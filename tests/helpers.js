/* Loads a CommonJS API file with @supabase/supabase-js replaced by a fake client. */
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);

export function loadWithFakeSupabase(apiPath, makeClient) {
  const sbPath = require.resolve('@supabase/supabase-js');
  const full = require.resolve(apiPath);
  const saved = require.cache[sbPath];
  require.cache[sbPath] = { id: sbPath, filename: sbPath, loaded: true, exports: { createClient: () => makeClient() } };
  delete require.cache[full];
  try { return require(full); } finally {
    if (saved) require.cache[sbPath] = saved; else delete require.cache[sbPath];
  }
}

/* Minimal req/res pair for a Vercel-style handler. */
export function call(handler, { token, body, headers = {} } = {}) {
  return new Promise((resolve) => {
    const res = {
      code: 200, headers: {},
      setHeader(k, v) { this.headers[k] = v; },
      status(c) { this.code = c; return this; },
      json(j) { resolve({ status: this.code, body: j }); },
      end() { resolve({ status: this.code }); },
    };
    handler({ method: 'POST', headers: { host: 'h', ...(token ? { authorization: 'Bearer ' + token } : {}), ...headers }, body }, res);
  });
}

/* In-memory table store that answers the query shapes the API uses. */
export function fakeDb(tables) {
  let nextId = 1000;
  const from = (name) => {
    const rows = (tables[name] ||= []);
    const filters = []; let op = 'select'; let payload; let single = false; let range = null;
    const match = (r) => filters.every((f) => f(r));
    const q = {
      select() { return q; },
      eq(k, v) { filters.push((r) => r[k] === v); return q; },
      gte(k, v) { filters.push((r) => r[k] >= v); return q; },
      order() { return q; },
      limit() { return q; },
      range(a, b) { range = [a, b]; return q; },
      single() { single = true; return q; },
      maybeSingle() { single = true; return q; },
      insert(v) { op = 'insert'; payload = v; return q; },
      update(v) { op = 'update'; payload = v; return q; },
      delete() { op = 'delete'; return q; },
      then(resolve, reject) {
        let out;
        if (op === 'insert') {
          const row = { id: nextId++, created_at: new Date().toISOString(), ...payload };
          rows.push(row); out = single ? row : [row];
        } else if (op === 'update') {
          rows.filter(match).forEach((r) => Object.assign(r, payload)); out = null;
        } else if (op === 'delete') {
          for (let i = rows.length - 1; i >= 0; i--) if (match(rows[i])) rows.splice(i, 1); out = null;
        } else {
          out = rows.filter(match);
          if (range) out = out.slice(range[0], range[1] + 1);
          if (single) out = out[0] ?? null;
        }
        return Promise.resolve({ data: out, error: null }).then(resolve, reject);
      },
    };
    return q;
  };
  return { from, tables };
}
