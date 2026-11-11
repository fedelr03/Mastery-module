import { describe, it, expect, beforeEach } from 'vitest';
import { loadWithFakeSupabase, call, fakeDb } from './helpers.js';

let db; let api; let log;
const old = '2026-01-01T00:00:00Z';
beforeEach(() => {
  process.env.SUPABASE_SERVICE_ROLE_KEY = 's';
  log = [];
  const users = [
    { id: 'adm', email: 'a@x', created_at: old, email_confirmed_at: old },
    { id: 'p1', email: 'p1@x', created_at: old, email_confirmed_at: null },
    { id: 'p2', email: 'p2@x', created_at: new Date().toISOString(), email_confirmed_at: null },
    { id: 'c1', email: 'c1@x', created_at: old, email_confirmed_at: old },
  ];
  db = fakeDb({
    profiles: [{ id: 'adm', role: 'admin' }, { id: 'p1', role: 'user' }, { id: 'p2', role: 'user' }, { id: 'c1', role: 'user' }],
    usage_logs: [
      { email: 'c1@x', estimated_cost: 0.5, input_tokens: 10, output_tokens: 5, mode: 'fast', created_at: new Date().toISOString() },
      { email: 'c1@x', estimated_cost: 0.25, input_tokens: 10, output_tokens: 5, mode: 'fast', created_at: old },
      { email: 'p1@x', estimated_cost: 0, mode: 'pending', created_at: new Date().toISOString() },
    ],
  });
  const client = {
    from: db.from,
    auth: {
      getUser: async (t) => ({ data: { user: { id: t } } }),
      resend: async ({ email }) => { log.push('resend ' + email); return {}; },
      admin: {
        listUsers: async () => ({ data: { users } }),
        getUserById: async (id) => ({ data: { user: users.find((u) => u.id === id) } }),
        updateUserById: async (id) => { log.push('confirm ' + id); return {}; },
        deleteUser: async (id) => { log.push('delete ' + id); return {}; },
      },
    },
  };
  api = loadWithFakeSupabase('../api/admin-users.js', () => client);
});

describe('/api/admin-users', () => {
  it('refuses non-admins and anonymous callers', async () => {
    expect((await call(api, { token: 'p1', body: { action: 'list' } })).status).toBe(403);
    expect((await call(api, { body: { action: 'list' } })).status).toBe(401);
  });
  it('lists users with their confirmation date', async () => {
    const r = await call(api, { token: 'adm', body: { action: 'list' } });
    expect(r.body.users.find((u) => u.id === 'p1').email_confirmed_at).toBeNull();
  });
  it('never touches admin accounts', async () => {
    const r = await call(api, { token: 'adm', body: { action: 'delete', ids: ['adm', 'c1'] } });
    expect(r.body).toMatchObject({ done: ['c1'], skipped: ['adm'] });
    expect(log).toEqual(['delete c1']);
  });
  it('resends only to unconfirmed users', async () => {
    const r = await call(api, { token: 'adm', body: { action: 'resend', ids: ['p1', 'c1'] } });
    expect(r.body.done).toEqual(['p1']);
    expect(r.body.failed[0]).toMatchObject({ id: 'c1', error: 'Already confirmed' });
  });
  it('purge deletes only unconfirmed accounts older than N days', async () => {
    const r = await call(api, { token: 'adm', body: { action: 'purge', days: 7 } });
    expect(r.body.done).toEqual(['p1']);
  });
  it('only lets the role be set to user or blocked', async () => {
    expect((await call(api, { token: 'adm', body: { action: 'role', ids: ['c1'], role: 'admin' } })).status).toBe(400);
  });
  it('stats count every row except in-flight reservations', async () => {
    const r = await call(api, { token: 'adm', body: { action: 'stats', tzOffset: 0 } });
    expect(r.body.stats).toMatchObject({ requests: 2, cost: 0.75, todayReqs: 1 });
    expect(r.body.users[0]).toMatchObject({ email: 'c1@x', requests: 2 });
    expect(r.body.days).toHaveLength(14);
  });
});
