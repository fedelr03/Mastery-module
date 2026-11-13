const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');
const { buildRequest, estimateCost, cleanResponse } = require('./_lib/models');

// Public (anon) key, same one the browser app ships with. Used to verify login
// tokens when the service-role key isn't configured.
const PUBLIC_ANON_KEY = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY
  || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxkeXd4b3hhbnVsbW5qdGNtdWNnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQzODY3MDUsImV4cCI6MjA4OTk2MjcwNX0.A9L18tI9xEAy66n7kfMu6wSNjWvVNjaq1wcc7j-EVi4';

// ─── Speed: reuse connections and skip repeated work ────────────────────────
// One Supabase client per key for the life of the instance (before, each request
// built up to four of them).
const clients = new Map();
function clientFor(url, key) {
  const id = url + '|' + key;
  if (!clients.has(id)) clients.set(id, createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } }));
  return clients.get(id);
}

// A click sends up to 3 requests with the same login token. Once Supabase has
// confirmed a token, remember it briefly instead of asking again for each one.
const verifiedTokens = new Map(); // token → { user, until }
const TOKEN_TTL_MS = 60 * 1000;

/* Reads the token's payload WITHOUT trusting it. Only used to start database
   lookups early; their results are thrown away unless Supabase confirms the token. */
function peekToken(token) {
  try {
    const p = JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString('utf8'));
    return { sub: typeof p.sub === 'string' ? p.sub : null, exp: Number(p.exp) || 0 };
  } catch (_) { return { sub: null, exp: 0 }; }
}

async function verifyToken(sbAuth, token) {
  const now = Date.now();
  const hit = verifiedTokens.get(token);
  if (hit && hit.until > now) return hit.user;
  const { data, error } = await sbAuth.auth.getUser(token);
  if (error || !data?.user) return null;
  const expMs = peekToken(token).exp * 1000;
  const until = Math.min(now + TOKEN_TTL_MS, expMs || now + TOKEN_TTL_MS);
  if (verifiedTokens.size > 500) verifiedTokens.delete(verifiedTokens.keys().next().value);
  verifiedTokens.set(token, { user: data.user, until });
  return data.user;
}

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

// ─── Limits (counted in usage_logs) ──────────────────────────────────────────
const PENDING = 'pending';
const LIMITS = {
  dailyCost: 0.40,     // USD per user per UTC day
  perMinute: 20,       // AI calls (one click fans out to ~3)
  perHour: 200,
  pendingTtlMs: 5 * 60 * 1000, // reservations older than this are stale (crashed instance) and don't count
};

/* Returns null if the user may proceed, or the 429 payload if not. */
async function checkLimits(sb, userId, now = Date.now()) {
  const dayStart = new Date(now); dayStart.setUTCHours(0, 0, 0, 0);
  const since = new Date(Math.min(dayStart.getTime(), now - 3600 * 1000)).toISOString();
  const { data: rows, error } = await sb
    .from('usage_logs')
    .select('created_at, estimated_cost, mode')
    .eq('user_id', userId)
    .gte('created_at', since)
    .limit(5000);
  if (error) throw error;
  let spent = 0; let lastMinute = 0; let lastHour = 0;
  (rows || []).forEach((r) => {
    const t = new Date(r.created_at).getTime();
    if (r.mode === PENDING && now - t > LIMITS.pendingTtlMs) return;
    if (t >= dayStart.getTime()) spent += parseFloat(r.estimated_cost) || 0;
    if (now - t < 60 * 1000) lastMinute += 1;
    if (now - t < 3600 * 1000) lastHour += 1;
  });
  if (spent >= LIMITS.dailyCost) {
    return {
      code: 'DAILY_LIMIT_REACHED', spent: parseFloat(spent.toFixed(4)), limit: LIMITS.dailyCost,
      errorEs: `Límite diario alcanzado ($${spent.toFixed(2)} de $${LIMITS.dailyCost.toFixed(2)}). Tu presupuesto se reinicia a medianoche (UTC).`,
      errorEn: `Daily budget reached ($${spent.toFixed(2)} of $${LIMITS.dailyCost.toFixed(2)}). Your budget resets at midnight UTC.`,
    };
  }
  if (lastMinute >= LIMITS.perMinute || lastHour >= LIMITS.perHour) {
    return {
      code: 'RATE_LIMITED',
      errorEs: 'Hiciste muchos pedidos seguidos. Esperá un minuto y probá de nuevo.',
      errorEn: 'Too many requests in a short time. Wait a minute and try again.',
    };
  }
  return null;
}

// ─── Main handler ────────────────────────────────────────────────────────────
async function handler(req, res) {
  /* ── CORS ── */
  // The app calls this endpoint from its own domain, so other websites don't need access.
  // (Before, '*' let any site call it from a visitor's browser.)
  const origin = req.headers.origin;
  if (origin) {
    let sameSite = false;
    try { sameSite = new URL(origin).host === req.headers.host || /^https?:\/\/localhost(:\d+)?$/.test(origin); } catch (_) { /* malformed origin */ }
    if (sameSite) { res.setHeader('Access-Control-Allow-Origin', origin); res.setHeader('Vary', 'Origin'); }
  }
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
  //
  // The session check, the role lookup and the usage limits used to run one after
  // another (three round trips before Claude was even called). They now run at the
  // same time. The role and limit lookups are started with the user id read from the
  // token, and are only used once Supabase confirms that token belongs to that user.
  const sbLog = SB_SERVICE_KEY ? clientFor(SB_URL, SB_SERVICE_KEY) : null;
  const claimedId = peekToken(token).sub;
  const lookRole = (uid) => {
    const sbRole = sbLog
      || createClient(SB_URL, PUBLIC_ANON_KEY, { global: { headers: { Authorization: 'Bearer ' + token } }, auth: { persistSession: false, autoRefreshToken: false } });
    return Promise.resolve(sbRole.from('profiles').select('role').eq('id', uid).maybeSingle())
      .then(({ data }) => ({ role: data?.role || null }), (err) => ({ err }));
  };
  const lookLimits = (uid) => (sbLog
    ? checkLimits(sbLog, uid).then((verdict) => ({ verdict }), (err) => ({ err }))
    : Promise.resolve({ verdict: null }));
  let roleP = claimedId ? lookRole(claimedId) : null;
  let limitsP = claimedId ? lookLimits(claimedId) : null;

  let user = null;
  try {
    user = await verifyToken(clientFor(SB_URL, SB_SERVICE_KEY || PUBLIC_ANON_KEY), token);
    if (!user) return res.status(401).json({ error: 'Invalid session. Please log in again.' });
  } catch (authErr) {
    console.error('Auth check failed:', authErr);
    return res.status(503).json({ error: 'Could not verify your session. Please try again in a moment.' });
  }

  /* ── Blocked users can't use the AI (before, the block only hid the UI) ── */
  // Early lookups only count if they were made for the user Supabase just confirmed.
  if (user.id !== claimedId) { roleP = lookRole(user.id); limitsP = lookLimits(user.id); }
  let isAdminUser = false;
  const roleRes = await roleP;
  if (roleRes?.err) console.error('Role check failed (non-blocking):', roleRes.err);
  if (roleRes?.role === 'blocked') {
    return res.status(403).json({ error: 'Account blocked.', code: 'ACCOUNT_BLOCKED' });
  }
  isAdminUser = roleRes?.role === 'admin';

  /* ── Per-user cooldown check ── */
  if (user && isOnCooldown(user.id)) {
    return res.status(429).json({ error: 'Too many requests. Please wait a moment before trying again.' });
  }

  /* ── Extract metadata and build Claude request ── */
  let clientBody;
  try {
    clientBody = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
  } catch (_) {
    return res.status(400).json({ error: 'Invalid request body.' });
  }
  if (!Array.isArray(clientBody.messages) || clientBody.messages.length === 0) {
    return res.status(400).json({ error: 'Invalid request body.' });
  }
  const meta = clientBody._meta || {};
  /* The server picks the model and its settings (see api/_lib/models.js). */
  const { body, model, fallbackBody } = buildRequest(clientBody, meta);

  /* ── Cache lookup ── */
  const cacheKey = getCacheKey(meta, body);
  const cached = getCached(cacheKey);
  if (cached) {
    console.log(`Cache hit: ${cacheKey}`);
    if (user && SB_SERVICE_KEY) {
      try {
        await sbLog.from('usage_logs').insert({
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

  /* ── Limits, checked in the database so they hold across every server instance ──
     In-memory counters (isOnCooldown) only see requests that hit the same instance;
     Vercel runs many, so the real limits are counted in usage_logs. Each request
     reserves its row *before* calling Claude (mode 'pending'), so requests still in
     flight count too. Admins are exempt. */
  let reservationId = null;
  if (user && sbLog && !isAdminUser) {
    const limitRes = await limitsP; // already running since the start of the request
    if (limitRes.err) console.error('Limit check failed (non-blocking):', limitRes.err);
    if (limitRes.verdict) {
      const verdict = limitRes.verdict;
      const isEs = (meta.lang || '') === 'es';
      return res.status(429).json({ ...verdict, error: isEs ? verdict.errorEs : verdict.errorEn, errorEs: undefined, errorEn: undefined });
    }
  }
  /* The reservation is written while Claude is already working, instead of making
     Claude wait for it. It still lands within milliseconds, long before the answer. */
  let reservationP = Promise.resolve();
  if (user && sbLog) {
    reservationP = Promise.resolve(sbLog.from('usage_logs').insert({
      user_id: user.id, email: user.email, topic: meta.topic || '', module: meta.module || '',
      mode: PENDING, lang: meta.lang || '', input_tokens: 0, output_tokens: 0, estimated_cost: 0,
      request_group_id: meta.request_group_id || null,
    }).select('id').single())
      .then(({ data: row }) => { reservationId = row?.id || null; })
      .catch((resErr) => { console.error('Usage reservation failed (non-blocking):', resErr); });
  }
  /* If the request ends without a usage row being filled in, drop the reservation. */
  const releaseReservation = async () => {
    await reservationP;
    if (!reservationId || !sbLog) return;
    try { await sbLog.from('usage_logs').delete().eq('id', reservationId); } catch (_) { /* ignore */ }
    reservationId = null;
  };

  /* ── Call Claude API with retry ── */
  try {
    stampRequest(user?.id);

    const send = (payload) => fetchWithRetry('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(payload),
    });

    let usedModel = model;
    let claudeRes = await send(body);
    let data = await claudeRes.json();
    await reservationP;

    /* Plan B: if the new model or one of its new fields is rejected, retry once on the previous model. */
    if ((claudeRes.status === 400 || claudeRes.status === 404) && fallbackBody.model) {
      console.warn(`Model ${model} rejected (${claudeRes.status}): ${data?.error?.message || ''}. Retrying on ${fallbackBody.model}.`);
      usedModel = fallbackBody.model;
      claudeRes = await send(fallbackBody);
      data = await claudeRes.json();
    }

    if (claudeRes.status === 200 && data.stop_reason === 'refusal') {
      await releaseReservation();
      return res.status(422).json({ error: { message: 'refusal' }, code: 'REFUSAL' });
    }
    data = cleanResponse(data);

    /* ── Store in cache ── */
    if (claudeRes.status === 200) setCache(cacheKey, data);

    /* ── Log usage ── */
    if (user && SB_SERVICE_KEY && data.usage) {
      const inputTokens = (data.usage.input_tokens || 0) + (data.usage.cache_read_input_tokens || 0) + (data.usage.cache_creation_input_tokens || 0);
      const outputTokens = data.usage.output_tokens || 0;
      const cost = estimateCost(usedModel, data.usage);

      try {
        const row = {
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
        };
        if (reservationId) {
          await sbLog.from('usage_logs').update(row).eq('id', reservationId);
          reservationId = null;
        } else {
          await sbLog.from('usage_logs').insert(row);
        }
      } catch (logErr) {
        console.error('Usage log failed:', logErr);
      }
    }

    await releaseReservation();
    return res.status(claudeRes.status).json(data);
  } catch (err) {
    await releaseReservation();
    console.error('Claude API error:', err);
    return res.status(502).json({ error: 'Failed to reach Claude API. Please try again.' });
  }
}

module.exports = handler;
module.exports.checkLimits = checkLimits;
module.exports.LIMITS = LIMITS;
