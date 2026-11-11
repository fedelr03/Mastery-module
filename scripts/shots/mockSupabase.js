/* A stand-in for the Supabase client that answers from fixtures.js.
   Only implements what the app calls. Used only by the screenshot harness. */
import { USER, PROFILE, HISTORY, CARDS } from './fixtures';

const session = { access_token: 'demo', user: USER };

const TABLES = { study_history: HISTORY, review_cards: CARDS, profiles: [{ id: USER.id, ...PROFILE }] };

/* "id, topic, kc:content->keyConcepts" → pick those fields (supports one alias). */
function project(row, select) {
  if (!select || select.trim() === '*') return { ...row };
  const out = {};
  select.split(',').map((s) => s.trim()).forEach((f) => {
    const alias = f.match(/^(\w+):(\w+)->(\w+)$/);
    if (alias) { out[alias[1]] = row[alias[2]]?.[alias[3]] ?? null; return; }
    out[f] = row[f];
  });
  return out;
}

class Query {
  constructor(table) { this.table = table; this.rows = [...(TABLES[table] || [])]; this.sel = '*'; this.one = false; this.opts = {}; }
  select(s = '*', opts = {}) { this.sel = s; this.opts = opts; return this; }
  eq(k, v) { if (k !== 'user_id') this.rows = this.rows.filter((r) => r[k] === v); return this; }
  neq(k, v) { this.rows = this.rows.filter((r) => r[k] !== v); return this; }
  lte(k, v) { this.rows = this.rows.filter((r) => r[k] <= v); return this; }
  ilike(k, v) { this.rows = this.rows.filter((r) => String(r[k]).toLowerCase() === String(v).toLowerCase()); return this; }
  order(k, { ascending = true } = {}) { this.rows.sort((a, b) => (a[k] < b[k] ? -1 : 1) * (ascending ? 1 : -1)); return this; }
  limit(n) { this.rows = this.rows.slice(0, n); return this; }
  single() { this.one = true; return this; }
  maybeSingle() { this.one = true; return this; }
  insert() { return this; }
  update() { return this; }
  upsert() { return this; }
  delete() { return this; }
  then(resolve, reject) {
    const data = this.rows.map((r) => project(r, this.sel));
    const res = this.opts.head ? { data: null, count: data.length, error: null }
      : { data: this.one ? data[0] ?? null : data, count: data.length, error: null };
    return Promise.resolve(res).then(resolve, reject);
  }
}

export const supabase = {
  auth: {
    getSession: async () => ({ data: { session } }),
    onAuthStateChange: () => ({ data: { subscription: { unsubscribe() {} } } }),
    signOut: async () => ({}),
    updateUser: async () => ({}),
  },
  from: (t) => new Query(t),
  rpc: async () => ({ data: null, error: null }),
};
