const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

// Public (anon) key, same one the browser app ships with. Used to verify login
// tokens when the service-role key isn't configured.
const PUBLIC_ANON_KEY = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY
  || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxkeXd4b3hhbnVsbW5qdGNtdWNnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQzODY3MDUsImV4cCI6MjA4OTk2MjcwNX0.A9L18tI9xEAy66n7kfMu6wSNjWvVNjaq1wcc7j-EVi4';

// ─── In-memory response cache ────────────────────────────────────────────────
// Key: "<topic>|<level>|<lang>|<module>"  →  { data, expiresAt }
// Best-effort: resets on cold starts, but very effective under real load.
const responseCache = new Map();
const CACHE_TTL_MS  = 60 * 60 * 1000; // 1 hour

function getCacheKey(meta, body) {
  // The key is a hash of the FULL request (model, system prompt, messages, limits).
  // Keying on topic/level/lang alone mixed up different requests: every uploaded
  // PDF shared the key "file", the user's interest was ignored, and a related-topic
  // request could be stored under the previous topic's name.
  // Review (recall) questions are never cached so they stay varied.
  if (meta.mode === 'recall' || meta.module === 'recall') return null;
  return crypto.createHash('sha256').update(JSON.stringify(body)).digest('hex');
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
// ─── Per-user sliding-window burst allowance ────────────────────────────────
// Each user may fire up to BURST_MAX requests within any BURST_WINDOW_MS window.
// This allows the classifier+Sonnet+Haiku parallel fan-out from a single click
// (3 requests) while still blocking rapid-fire abuse beyond that burst.
const userRequestLog = new Map();     // userId → array of recent timestamps
const BURST_MAX = 4;                   // enough for 3-call fan-out + 1 buffer
const BURST_WINDOW_MS = 3000;          // 3-second sliding window
 
function isOnCooldown(userId) {
  if (!userId) return false;
  const now = Date.now();
  const log = (userRequestLog.get(userId) || []).filter(t => now - t < BURST_WINDOW_MS);
  userRequestLog.set(userId, log);     // prune old timestamps
  return log.length >= BURST_MAX;
}
 
function stampRequest(userId) {
  if (!userId) return;
  const now = Date.now();
  const log = (userRequestLog.get(userId) || []).filter(t => now - t < BURST_WINDOW_MS);
  log.push(now);
  userRequestLog.set(userId, log);
  // Memory safety: evict users with no recent activity when map grows large.
  if (userRequestLog.size > 1000) {
    for (const [k, ts] of userRequestLog) {
      if (!ts.some(t => now - t < BURST_WINDOW_MS * 2)) userRequestLog.delete(k);
    }
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

  // Always verify the token. Before, if SUPABASE_SERVICE_ROLE_KEY was missing,
  // any non-empty token was accepted with no rate limit or budget.
  let user = null;
  try {
    const sbAuth = createClient(SB_URL, SB_SERVICE_KEY || PUBLIC_ANON_KEY);
    const { data, error } = await sbAuth.auth.getUser(token);
    if (error || !data?.user) return res.status(401).json({ error: 'Invalid session. Please log in again.' });
    user = data.user;
  } catch (authErr) {
    console.error('Auth check failed:', authErr);
    return res.status(503).json({ error: 'Could not verify your session. Please try again in a moment.' });
  }

  /* ── Blocked users can't use the AI (before, the block only hid the UI) ── */
  try {
    const sbRole = SB_SERVICE_KEY
      ? createClient(SB_URL, SB_SERVICE_KEY)
      : createClient(SB_URL, PUBLIC_ANON_KEY, { global: { headers: { Authorization: 'Bearer ' + token } } });
    const { data: roleRow } = await sbRole.from('profiles').select('role').eq('id', user.id).maybeSingle();
    if (roleRow?.role === 'blocked') {
      return res.status(403).json({ error: 'Account blocked.', code: 'ACCOUNT_BLOCKED' });
    }
  } catch (roleErr) {
    console.error('Role check failed (non-blocking):', roleErr);
  }

  /* ── Per-user cooldown check ── */
  if (user && isOnCooldown(user.id)) {
    return res.status(429).json({ error: 'Too many requests. Please wait a moment before trying again.' });
  }

  /* ── Extract metadata and build Claude request ── */
  const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  const meta = body._meta || {};
  delete body._meta;

  /* ── Whitelist allowed models (default: Sonnet 4.6) ── */
  const ALLOWED_MODELS = ['claude-sonnet-4-6', 'claude-haiku-4-5-20251001'];
  if (!ALLOWED_MODELS.includes(body.model)) body.model = 'claude-sonnet-4-6';

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
            request_group_id: meta.request_group_id || null,
          });
      } catch (logErr) {
        console.error('Usage log (cache) failed:', logErr);
      }
    }
    stampRequest(user?.id);
    return res.status(200).json(cached);
  }

  /* ── Daily budget check (non-admin users, $0.40/day, resets midnight UTC) ── */
  if (user && SB_SERVICE_KEY) {
    try {
      const sbBudget = createClient(SB_URL, SB_SERVICE_KEY);
      const { data: profileData } = await sbBudget.from('profiles').select('role').eq('id', user.id).single();
      const isAdminUser = profileData?.role === 'admin';

      if (!isAdminUser) {
        const DAILY_LIMIT = 0.40;
        const todayStart = new Date();
        todayStart.setUTCHours(0, 0, 0, 0);

        const { data: todayLogs } = await sbBudget
          .from('usage_logs')
          .select('estimated_cost')
          .eq('user_id', user.id)
          .gte('created_at', todayStart.toISOString());

        const todaySpend = (todayLogs || []).reduce((sum, log) => sum + (parseFloat(log.estimated_cost) || 0), 0);

        if (todaySpend >= DAILY_LIMIT) {
          const isEs = (meta.lang || '') === 'es';
          return res.status(429).json({
            error: isEs
              ? `Límite diario alcanzado ($${todaySpend.toFixed(2)} de $${DAILY_LIMIT.toFixed(2)}). Tu presupuesto se reinicia a medianoche (UTC). Podés ver tu uso en el perfil.`
              : `Daily budget reached ($${todaySpend.toFixed(2)} of $${DAILY_LIMIT.toFixed(2)}). Your budget resets at midnight UTC. Check your profile to track usage.`,
            code: 'DAILY_LIMIT_REACHED',
            spent: parseFloat(todaySpend.toFixed(4)),
            limit: DAILY_LIMIT,
          });
        }
      }
    } catch (budgetErr) {
      console.error('Daily budget check failed (non-blocking):', budgetErr);
      // Don't block the request if the budget check itself fails
    }
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
      /* Model-aware pricing: Haiku ($0.80/$4 per M) vs Sonnet ($3/$15 per M) */
      const isHaiku = (body.model || '').includes('haiku');
      const cost = (inputTokens * (isHaiku ? 0.80 : 3) + outputTokens * (isHaiku ? 4 : 15)) / 1_000_000;

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
          request_group_id: meta.request_group_id || null,
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
