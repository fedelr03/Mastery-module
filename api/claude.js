const { createClient } = require('@supabase/supabase-js');

module.exports = async function handler(req, res) {
  /* ── CORS ── */
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  /* ── Env vars ── */
  const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY;
  const SB_URL = process.env.SUPABASE_URL || 'https://ldywxoxanulmnjtcmucg.supabase.co';
  const SB_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!ANTHROPIC_KEY) return res.status(500).json({ error: 'Server missing API key configuration.' });

  /* ── Auth check ── */
  const token = (req.headers.authorization || '').replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'Not authenticated. Please log in.' });

  let user = null;
  if (SB_SERVICE_KEY) {
    const sb = createClient(SB_URL, SB_SERVICE_KEY);
    const { data, error } = await sb.auth.getUser(token);
    if (error || !data?.user) return res.status(401).json({ error: 'Invalid session. Please log in again.' });
    user = data.user;
  }

  /* ── Extract metadata and build Claude request ── */
  const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  const meta = body._meta || {};
  delete body._meta;

  /* ── Call Claude API ── */
  try {
    const claudeRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(body),
    });

    const data = await claudeRes.json();

    /* ── Log usage ── */
    if (user && SB_SERVICE_KEY && data.usage) {
      const inputTokens = data.usage.input_tokens || 0;
      const outputTokens = data.usage.output_tokens || 0;
      const cost = (inputTokens * 3 + outputTokens * 15) / 1_000_000;

      try {
        const sb = createClient(SB_URL, SB_SERVICE_KEY);
        await sb.from('usage_logs').insert({
          user_id: user.id,
          email: user.email,
          topic: meta.topic || '',
          module: meta.module || '',
          mode: meta.mode || '',
          lang: meta.lang || '',
          input_tokens: inputTokens,
          output_tokens: outputTokens,
          estimated_cost: cost,
        });
      } catch (logErr) {
        console.error('Usage log failed:', logErr);
      }
    }

    return res.status(claudeRes.status).json(data);
  } catch (err) {
    console.error('Claude API error:', err);
    return res.status(502).json({ error: 'Failed to reach Claude API. Please try again.' });
  }
};
