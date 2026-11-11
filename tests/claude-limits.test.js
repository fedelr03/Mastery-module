import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { loadWithFakeSupabase, call, fakeDb } from './helpers.js';

const USER = { id: 'u1', email: 'u1@x' };
let db; let api; let fetchMock;
const ago = (ms) => new Date(Date.now() - ms).toISOString();
const log = (o) => ({ id: Math.random(), user_id: USER.id, estimated_cost: 0, mode: 'fast', created_at: ago(10 * 60_000), ...o });
const body = { messages: [{ role: 'user', content: 'hola' }], _meta: { mode: 'fast', topic: 'x', lang: 'es' } };

beforeEach(() => {
  process.env.ANTHROPIC_API_KEY = 'k';
  process.env.SUPABASE_SERVICE_ROLE_KEY = 's';
  db = fakeDb({ profiles: [{ id: USER.id, role: 'user' }, { id: 'adm', role: 'admin' }], usage_logs: [] });
  const client = { from: db.from, auth: { getUser: async (t) => ({ data: { user: t === 'adm' ? { id: 'adm', email: 'a@x' } : USER } }) } };
  api = loadWithFakeSupabase('../api/claude.js', () => client);
  fetchMock = vi.fn(async () => new Response(JSON.stringify({
    content: [{ type: 'text', text: 'ok' }], usage: { input_tokens: 1000, output_tokens: 500 }, stop_reason: 'end_turn',
  }), { status: 200 }));
  vi.stubGlobal('fetch', fetchMock);
});
afterEach(() => vi.unstubAllGlobals());

describe('checkLimits', () => {
  it('lets a normal user through', async () => {
    expect(await api.checkLimits(db, USER.id)).toBeNull();
  });
  it('stops at the daily budget', async () => {
    db.tables.usage_logs.push(log({ estimated_cost: api.LIMITS.dailyCost, created_at: ago(1000) }));
    expect((await api.checkLimits(db, USER.id)).code).toBe('DAILY_LIMIT_REACHED');
  });
  it('stops too many calls in a minute, counting requests still in flight', async () => {
    for (let i = 0; i < api.LIMITS.perMinute; i++) db.tables.usage_logs.push(log({ mode: 'pending', created_at: ago(5000) }));
    expect((await api.checkLimits(db, USER.id)).code).toBe('RATE_LIMITED');
  });
  it('ignores stale reservations from a crashed request', async () => {
    for (let i = 0; i < api.LIMITS.perMinute; i++) db.tables.usage_logs.push(log({ mode: 'pending', created_at: ago(api.LIMITS.pendingTtlMs + 1000) }));
    expect(await api.checkLimits(db, USER.id)).toBeNull();
  });
});

describe('/api/claude', () => {
  it('reserves a usage row and fills it in with the real cost', async () => {
    const r = await call(api, { token: 'u1', body });
    expect(r.status).toBe(200);
    expect(db.tables.usage_logs).toHaveLength(1);
    const row = db.tables.usage_logs[0];
    expect(row.mode).toBe('fast');
    expect(row.estimated_cost).toBeGreaterThan(0);
    expect(row.input_tokens).toBe(1000);
  });
  it('answers 429 in the user language when over the limit, without calling the AI', async () => {
    db.tables.usage_logs.push(log({ estimated_cost: 5, created_at: ago(1000) }));
    const r = await call(api, { token: 'u1', body });
    expect(r.status).toBe(429);
    expect(r.body.error).toMatch(/Límite diario/);
    expect(fetchMock).not.toHaveBeenCalled();
  });
  it('admins are not limited', async () => {
    db.tables.usage_logs.push(log({ user_id: 'adm', estimated_cost: 5, created_at: ago(1000) }));
    expect((await call(api, { token: 'adm', body: { ...body, _meta: { ...body._meta, topic: 'admin' } } })).status).toBe(200);
  });
  it('drops the reservation when the AI call fails', async () => {
    fetchMock.mockImplementation(async () => { throw new Error('down'); });
    vi.useFakeTimers();
    const p = call(api, { token: 'u1', body: { ...body, _meta: { ...body._meta, topic: 'fails' } } });
    await vi.runAllTimersAsync();
    const r = await p;
    vi.useRealTimers();
    expect(r.status).toBe(502);
    expect(db.tables.usage_logs).toHaveLength(0);
  });
  it('blocked users get 403', async () => {
    db.tables.profiles[0].role = 'blocked';
    expect((await call(api, { token: 'u1', body })).status).toBe(403);
  });
});
