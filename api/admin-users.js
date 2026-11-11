/* Admin-only user management: email-confirmation status and commands.
 *
 * Supabase keeps "email confirmed" in auth.users, which the browser can't read or
 * change, so these commands run here with the service-role key. Every request is
 * checked: the caller's token must belong to a profile with role = 'admin'.
 *
 * POST /api/admin-users  { action, ids?, days?, role? }
 *   list     → every auth user with confirmation / sign-in data
 *   confirm  → mark the email as confirmed (user can log in right away)
 *   resend   → send the confirmation email again
 *   delete   → delete the accounts (auth user + profile)
 *   purge    → delete unconfirmed accounts older than `days` days
 *   role     → set profiles.role to 'user' or 'blocked'
 * Admin accounts and the caller's own account are never touched by these commands.
 */
const { createClient } = require('@supabase/supabase-js');

const PUBLIC_ANON_KEY = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY
  || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxkeXd4b3hhbnVsbW5qdGNtdWNnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQzODY3MDUsImV4cCI6MjA4OTk2MjcwNX0.A9L18tI9xEAy66n7kfMu6wSNjWvVNjaq1wcc7j-EVi4';
const MAX_IDS = 200;

async function listAllUsers(admin) {
  const all = [];
  for (let page = 1; page <= 50; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw error;
    const batch = data?.users || [];
    all.push(...batch);
    if (batch.length < 1000) break;
  }
  return all;
}

const shape = (u) => ({
  id: u.id,
  email: u.email,
  created_at: u.created_at,
  email_confirmed_at: u.email_confirmed_at || u.confirmed_at || null,
  confirmation_sent_at: u.confirmation_sent_at || null,
  last_sign_in_at: u.last_sign_in_at || null,
});

module.exports = async function handler(req, res) {
  const origin = req.headers.origin;
  if (origin) {
    let sameSite = false;
    try { sameSite = new URL(origin).host === req.headers.host || /^https?:\/\/localhost(:\d+)?$/.test(origin); } catch (_) { /* malformed */ }
    if (sameSite) { res.setHeader('Access-Control-Allow-Origin', origin); res.setHeader('Vary', 'Origin'); }
  }
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const SB_URL = process.env.SUPABASE_URL || 'https://ldywxoxanulmnjtcmucg.supabase.co';
  const SB_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!SB_SERVICE_KEY) {
    return res.status(500).json({ error: 'SUPABASE_SERVICE_ROLE_KEY is not configured on the server.', code: 'NO_SERVICE_KEY' });
  }
  const admin = createClient(SB_URL, SB_SERVICE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });

  /* ── Caller must be an admin ── */
  const token = (req.headers.authorization || '').replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'Not authenticated.' });
  let caller;
  try {
    const { data, error } = await admin.auth.getUser(token);
    if (error || !data?.user) return res.status(401).json({ error: 'Invalid session.' });
    caller = data.user;
    const { data: row } = await admin.from('profiles').select('role').eq('id', caller.id).maybeSingle();
    if (row?.role !== 'admin') return res.status(403).json({ error: 'Admins only.' });
  } catch (e) {
    console.error('admin-users auth failed:', e);
    return res.status(503).json({ error: 'Could not verify your session.' });
  }

  let body;
  try { body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {}); } catch (_) { body = {}; }
  const action = body.action;

  try {
    if (action === 'list') {
      const users = await listAllUsers(admin);
      return res.status(200).json({ users: users.map(shape) });
    }

    /* Targets: admins and the caller are always excluded. */
    const { data: admins } = await admin.from('profiles').select('id').eq('role', 'admin');
    const protectedIds = new Set([caller.id, ...(admins || []).map((a) => a.id)]);

    let ids;
    if (action === 'purge') {
      const days = Math.max(1, Math.min(365, parseInt(body.days, 10) || 7));
      const cutoff = Date.now() - days * 86400000;
      const users = await listAllUsers(admin);
      ids = users.filter((u) => !(u.email_confirmed_at || u.confirmed_at) && new Date(u.created_at).getTime() < cutoff).map((u) => u.id);
    } else {
      ids = Array.isArray(body.ids) ? body.ids.filter((x) => typeof x === 'string').slice(0, MAX_IDS) : [];
    }
    const skipped = ids.filter((id) => protectedIds.has(id));
    ids = ids.filter((id) => !protectedIds.has(id));

    const done = [];
    const failed = [];
    const run = async (id, fn) => {
      try { await fn(id); done.push(id); } catch (e) { failed.push({ id, error: e.message || String(e) }); }
    };

    if (action === 'confirm') {
      for (const id of ids) await run(id, async () => {
        const { error } = await admin.auth.admin.updateUserById(id, { email_confirm: true });
        if (error) throw error;
      });
    } else if (action === 'resend') {
      const anon = createClient(SB_URL, PUBLIC_ANON_KEY, { auth: { persistSession: false } });
      const redirect = origin || (req.headers.host ? 'https://' + req.headers.host : undefined);
      for (const id of ids) await run(id, async () => {
        const { data, error: ge } = await admin.auth.admin.getUserById(id);
        if (ge) throw ge;
        const u = data?.user;
        if (!u?.email) throw new Error('User has no email');
        if (u.email_confirmed_at || u.confirmed_at) throw new Error('Already confirmed');
        const { error } = await anon.auth.resend({ type: 'signup', email: u.email, options: redirect ? { emailRedirectTo: redirect } : undefined });
        if (error) throw error;
      });
    } else if (action === 'delete' || action === 'purge') {
      for (const id of ids) await run(id, async () => {
        await admin.from('profiles').delete().eq('id', id); // in case there's no ON DELETE CASCADE
        const { error } = await admin.auth.admin.deleteUser(id);
        if (error) throw error;
      });
    } else if (action === 'role') {
      if (!['user', 'blocked'].includes(body.role)) return res.status(400).json({ error: 'Invalid role.' });
      for (const id of ids) await run(id, async () => {
        const { error } = await admin.from('profiles').update({ role: body.role }).eq('id', id);
        if (error) throw error;
      });
    } else {
      return res.status(400).json({ error: 'Unknown action.' });
    }

    return res.status(200).json({ done, failed, skipped });
  } catch (e) {
    console.error('admin-users action failed:', action, e);
    return res.status(500).json({ error: e.message || 'Action failed.' });
  }
};
