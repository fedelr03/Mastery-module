const { createClient } = require('@supabase/supabase-js');

// ─── In-memory response cache ────────────────────────────────────────────────
// Key: "<topic>|<level>|<lang>|<module>"  →  { data, expiresAt }
// Best-effort: resets on cold starts, but very effective under real load.
const responseCache = new Map();
const CACHE_TTL_MS  = 60 * 60 * 1000; // 1 hour

function getCacheKey(meta, body) {
  // Only cache explanation-style requests — quizzes/exams should always vary
  if (!meta.topic || meta.module === 'quiz' || meta.module === 'exam') return null;
  return `${(meta.topic || '').toLowerCase().trim()}|${meta.level || ''}|${meta.lang || ''}|${meta.module || ''}`;
}

function getCached(key) {
  if (!key) return null;
  const entry = responseCache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) { responseCache.delete(key); return null; }
  return entry.data;
}

function setCache(key, data) {
  if (!key) return;
  if (responseCache.size > 500) {
    const firstKey = responseCache.keys().next().value;
    responseCache.delete(firstKey);
  }
  responseCache.set(key, { data, expiresAt: Date.now() + CACHE_TTL_MS });
}

// ─── Per-user cooldown ───────────────────────────────────────────────────────
const lastRequestTime = new Map();
const COOLDOWN_MS = 3000; // 3 seconds between requests per user

function isOnCooldown(userId) {
  if (!userId) return false;
  const last = lastRequestTime.get(userId);
  return last && (Date.now() - last) < COOLDOWN_MS;
}

function stampRequest(userId) {
  if (!userId) return;
  lastRequestTime.set(userId, Date.now());
  if (lastRequestTime.size > 1000) {
    for (const [k, v] of lastRequestTime)
      if (Date.now() - v > COOLDOWN_MS * 2) lastRequestTime.delete(k);
  }
}

// ─── Retry with exponential backoff ─────────────────────────────────────────
async function fetchWithRetry(url, options, maxRetries = 3) {
  let lastError;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    if (attempt > 0) {
      const delayMs = Math.min(1000 * Math.pow(2, attempt - 1), 8000); // 1s, 2s, 4s, 8s cap
      await new Promise(r => setTimeout(r, delayMs));
    }
    try {
      const res = await fetch(url, options);
      if (res.status === 429 || res.status === 529) {
        lastError = res.status;
        console.warn(`Claude API ${res.status} on attempt ${attempt + 1}, retrying...`);
        continue;
      }
      return res;
    } catch (err) {
      lastError = err;
      console.warn(`Claude API fetch error on attempt ${attempt + 1}:`, err.message);
    }
  }
  throw new Error(`Claude API unavailable after ${maxRetries + 1} attempts (last: ${lastError})`);
}

// ─── Main handler ────────────────────────────────────────────────────────────
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

  /* ── Per-user cooldown check ── */
  if (user && isOnCooldown(user.id)) {
    return res.status(429).json({ error: 'Too many requests. Please wait a moment before trying again.' });
  }

  /* ── Extract metadata and build Claude request ── */
  const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  const meta = body._meta || {};
  delete body._meta;

  /* ── Force model to Sonnet 4.6 ── */
  body.model = 'claude-sonnet-4-6';

  /* ── Cache lookup ── */
  const cacheKey = getCacheKey(meta, body);
  const cached = getCached(cacheKey);
  if (cached) {
    console.log(`Cache hit: ${cacheKey}`);
    if (user && SB_SERVICE_KEY) {
      try {
        const sb = createClient(SB_URL, SB_SERVICE_KEY);
        await sb.from('usage_logs').insert({
          user_id: user.id,
          email: user.email,
          topic: meta.topic || '',
          module: meta.module || '',
          mode: 'cached',
          lang: meta.lang || '',
          input_tokens: 0,
          output_tokens: 0,
          estimated_cost: 0,
        });
      } catch (logErr) {
        console.error('Usage log (cache) failed:', logErr);
      }
    }
    stampRequest(user?.id);
    return res.status(200).json(cached);
  }

  /* ── Call Claude API with retry ── */
  try {
    stampRequest(user?.id);

    const claudeRes = await fetchWithRetry('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(body),
    });

    const data = await claudeRes.json();

    /* ── Store in cache ── */
    if (claudeRes.status === 200) setCache(cacheKey, data);

    /* ── Log usage ── */
    if (user && SB_SERVICE_KEY && data.usage) {
      const inputTokens = data.usage.input_tokens || 0;
      const outputTokens = data.usage.output_tokens || 0;
      /* Sonnet 4.6 pricing: $3/M input, $15/M output */
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
