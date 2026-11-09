/* Admin dashboard — AI usage, cost and user management. */
import { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '../supabase';
import { usePrefs } from '../lib/prefs';
import { IconRefresh } from '../components/icons';

const COPY = {
  es: { title: 'Panel de administración', sub: 'Uso de la IA y gestión de usuarios', refresh: 'Actualizar', loading: 'Cargando el panel…',
        overview: 'Resumen', users: 'Usuarios', requests: 'Pedidos', totalUsers: 'Usuarios', totalRequests: 'Pedidos a la IA', totalCost: 'Costo total',
        today: 'Hoy', reqs: 'pedidos', tokens: 'Tokens', tokIn: 'entrada', tokOut: 'salida', topUsers: 'Usuarios con más gasto', seeAll: 'Ver todos',
        noUsage: 'Todavía no hay uso.', email: 'Email', username: 'Nombre', role: 'Rol', signedUp: 'Alta', cost: 'Costo', action: 'Acción',
        allUsers: 'Todos los usuarios', block: 'Bloquear', unblock: 'Desbloquear', confirmBlock: '¿Bloquear?', yes: 'Sí', no: 'No',
        recent: 'Pedidos recientes', noRequests: 'Todavía no hay pedidos.', time: 'Hora', user: 'Usuario', topic: 'Tema', subject: 'Materia', calls: 'Llamadas',
        last14: 'Pedidos por día (últimos 14 días)', window: 'Calculado sobre los últimos {n} registros.',
        loadFailed: 'No se pudo cargar el panel. Revisá la conexión y probá de nuevo.', updateFailed: 'No se pudo actualizar el usuario: ',
        roles: { admin: 'Admin', blocked: 'Bloqueado', user: 'Usuario' } },
  en: { title: 'Admin dashboard', sub: 'AI usage and user management', refresh: 'Refresh', loading: 'Loading dashboard…',
        overview: 'Overview', users: 'Users', requests: 'Requests', totalUsers: 'Users', totalRequests: 'AI requests', totalCost: 'Total cost',
        today: 'Today', reqs: 'requests', tokens: 'Tokens', tokIn: 'in', tokOut: 'out', topUsers: 'Top users by cost', seeAll: 'See all',
        noUsage: 'No usage yet.', email: 'Email', username: 'Name', role: 'Role', signedUp: 'Signed up', cost: 'Cost', action: 'Action',
        allUsers: 'All users', block: 'Block', unblock: 'Unblock', confirmBlock: 'Block?', yes: 'Yes', no: 'No',
        recent: 'Recent requests', noRequests: 'No requests yet.', time: 'Time', user: 'User', topic: 'Topic', subject: 'Subject', calls: 'Calls',
        last14: 'Requests per day (last 14 days)', window: 'Computed over the latest {n} log rows.',
        loadFailed: "Couldn't load the dashboard. Check your connection and try again.", updateFailed: "Couldn't update the user: ",
        roles: { admin: 'Admin', blocked: 'Blocked', user: 'User' } },
};

const LOG_LIMIT = 1000;
const money = (n, d = 4) => '$' + (Number(n) || 0).toFixed(d);
const kilo = (n) => ((Number(n) || 0) / 1000).toFixed(1) + 'K';
const costOf = (l) => parseFloat(l.estimated_cost) || 0;
const dayKey = (d) => { const x = new Date(d); return x.getFullYear() + '-' + (x.getMonth() + 1) + '-' + x.getDate(); };

function summarize(logs) {
  const today = dayKey(Date.now());
  const stats = { requests: logs.length, cost: 0, input: 0, output: 0, todayReqs: 0, todayCost: 0 };
  const byUser = {};
  const byDay = {};
  logs.forEach((l) => {
    const c = costOf(l);
    stats.cost += c; stats.input += l.input_tokens || 0; stats.output += l.output_tokens || 0;
    const dk = dayKey(l.created_at);
    byDay[dk] = (byDay[dk] || 0) + 1;
    if (dk === today) { stats.todayReqs += 1; stats.todayCost += c; }
    const u = byUser[l.email] || (byUser[l.email] = { email: l.email, requests: 0, cost: 0 });
    u.requests += 1; u.cost += c;
  });
  const days = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i);
    days.push({ label: d.getDate() + '/' + (d.getMonth() + 1), n: byDay[dayKey(d)] || 0 });
  }
  // One row per click: the classifier + explanation + quiz calls share a request_group_id.
  const groups = []; const seen = {};
  logs.slice(0, 150).forEach((r) => {
    const key = r.request_group_id || r.id;
    if (!seen[key]) { seen[key] = { key, first: r, calls: 0, cost: 0, tokens: 0, modules: new Set() }; groups.push(seen[key]); }
    const g = seen[key];
    g.calls += 1; g.cost += costOf(r); g.tokens += (r.input_tokens || 0) + (r.output_tokens || 0);
    if (r.module && !['classifier'].includes(r.module)) g.modules.add(r.module);
  });
  return { stats, byUser, users: Object.values(byUser).sort((a, b) => b.cost - a.cost), days, groups };
}

export default function AdminDashboard() {
  const { lang } = usePrefs();
  const t = COPY[lang] || COPY.en;
  const [logs, setLogs] = useState([]);
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tab, setTab] = useState('overview');
  const [confirmId, setConfirmId] = useState(null);
  const [busyId, setBusyId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true); setError('');
    const [l, p] = await Promise.all([
      supabase.from('usage_logs').select('*').order('created_at', { ascending: false }).limit(LOG_LIMIT),
      supabase.from('profiles').select('*').order('created_at', { ascending: false }),
    ]);
    if (l.error || p.error) { console.error(l.error || p.error); setError(t.loadFailed); }
    setLogs(l.data || []); setProfiles(p.data || []);
    setLoading(false);
  }, [t.loadFailed]);

  useEffect(() => { load(); }, [load]);

  const { stats, byUser, users, days, groups } = useMemo(() => summarize(logs), [logs]);
  const maxDay = Math.max(1, ...days.map((d) => d.n));

  const setRole = async (profile, role) => {
    setBusyId(profile.id); setConfirmId(null); setError('');
    const { error: e } = await supabase.from('profiles').update({ role }).eq('id', profile.id);
    setBusyId(null);
    if (e) { setError(t.updateFailed + e.message); return; }
    setProfiles((list) => list.map((x) => (x.id === profile.id ? { ...x, role } : x)));
  };

  const roleTag = (role) => {
    const r = role || 'user';
    return <span className={'tag ' + (r === 'admin' ? 'tag-accent' : r === 'blocked' ? 'tag-red' : 'tag-green')}>{t.roles[r] || r}</span>;
  };

  return (
    <div className="page">
      <div className="page-head">
        <div><h1>{t.title}</h1><p>{t.sub}</p></div>
        <button type="button" className="btn btn-ghost btn-sm" onClick={load} disabled={loading}><IconRefresh size={16} />{t.refresh}</button>
      </div>

      <div className="seg" role="tablist" style={{ marginBottom: 20 }}>
        {['overview', 'users', 'requests'].map((id) => (
          <button key={id} type="button" role="tab" aria-selected={tab === id} onClick={() => setTab(id)}>{t[id]}</button>
        ))}
      </div>

      {error && <div className="alert alert-error" role="alert" style={{ marginBottom: 16 }}>{error}</div>}
      {loading && <div className="skeleton" style={{ height: 260 }} role="status" aria-label={t.loading} />}

      {!loading && tab === 'overview' && (
        <>
          <div className="stats">
            <div className="stat"><b>{profiles.length}</b><span>{t.totalUsers}</span></div>
            <div className="stat"><b>{stats.requests}</b><span>{t.totalRequests}</span></div>
            <div className="stat is-accent"><b>{money(stats.cost, 2)}</b><span>{t.totalCost}</span></div>
            <div className="stat"><b>{stats.todayReqs}</b><span>{t.today} · {t.reqs}</span><small>{money(stats.todayCost)}</small></div>
            <div className="stat"><b>{kilo(stats.input + stats.output)}</b><span>{t.tokens}</span><small>{kilo(stats.input)} {t.tokIn} · {kilo(stats.output)} {t.tokOut}</small></div>
          </div>
          {logs.length >= LOG_LIMIT && <p className="small muted" style={{ marginBottom: 14 }}>{t.window.replace('{n}', LOG_LIMIT)}</p>}

          <section className="card ad-panel">
            <div className="ad-panel-head"><h2>{t.last14}</h2></div>
            <div className="bars" role="img" aria-label={t.last14}>
              {days.map((d, i) => <div key={i} title={d.label + ': ' + d.n}><i style={{ height: (d.n / maxDay) * 100 + '%' }} /></div>)}
            </div>
            <div className="bars-x" aria-hidden="true">{days.map((d, i) => <span key={i}>{i % 2 === 1 ? d.label : ''}</span>)}</div>
          </section>

          <section className="card ad-panel">
            <div className="ad-panel-head">
              <h2>{t.topUsers}</h2>
              <button type="button" className="link-btn" onClick={() => setTab('users')}>{t.seeAll}</button>
            </div>
            {users.length === 0 ? <p className="muted" style={{ padding: 20, textAlign: 'center' }}>{t.noUsage}</p> : (
              <div className="table-wrap"><table className="table">
                <thead><tr><th>{t.email}</th><th className="num">{t.requests}</th><th className="num">{t.cost}</th></tr></thead>
                <tbody>{users.slice(0, 5).map((u) => (
                  <tr key={u.email}><td><strong>{u.email}</strong></td><td className="num">{u.requests}</td><td className="num"><strong>{money(u.cost)}</strong></td></tr>
                ))}</tbody>
              </table></div>
            )}
          </section>
        </>
      )}

      {!loading && tab === 'users' && (
        <section className="card ad-panel">
          <div className="ad-panel-head"><h2>{t.allUsers} ({profiles.length})</h2></div>
          <div className="table-wrap"><table className="table">
            <thead><tr><th>{t.email}</th><th>{t.username}</th><th>{t.role}</th><th>{t.signedUp}</th><th className="num">{t.requests}</th><th className="num">{t.cost}</th><th>{t.action}</th></tr></thead>
            <tbody>{profiles.map((p) => {
              const usage = byUser[p.email];
              const blocked = p.role === 'blocked';
              return (
                <tr key={p.id}>
                  <td><strong>{p.email}</strong></td>
                  <td className={p.username ? '' : 'muted'}>{p.username || '—'}</td>
                  <td>{roleTag(p.role)}</td>
                  <td className="muted">{p.created_at ? new Date(p.created_at).toLocaleDateString() : '—'}</td>
                  <td className="num">{usage?.requests || 0}</td>
                  <td className="num">{money(usage?.cost)}</td>
                  <td>
                    {p.role === 'admin' ? null : confirmId === p.id ? (
                      <span style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}>
                        <span className="small">{t.confirmBlock}</span>
                        <button type="button" className="btn btn-danger btn-sm" onClick={() => setRole(p, 'blocked')}>{t.yes}</button>
                        <button type="button" className="btn btn-ghost btn-sm" onClick={() => setConfirmId(null)}>{t.no}</button>
                      </span>
                    ) : (
                      <button type="button" className={'btn btn-sm ' + (blocked ? 'btn-ok' : 'btn-danger')} disabled={busyId === p.id}
                        onClick={() => (blocked ? setRole(p, 'user') : setConfirmId(p.id))}>
                        {blocked ? t.unblock : t.block}
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}</tbody>
          </table></div>
        </section>
      )}

      {!loading && tab === 'requests' && (
        <section className="card ad-panel">
          <div className="ad-panel-head"><h2>{t.recent} ({groups.length})</h2></div>
          {groups.length === 0 ? <p className="muted" style={{ padding: 20, textAlign: 'center' }}>{t.noRequests}</p> : (
            <div className="table-wrap"><table className="table">
              <thead><tr><th>{t.time}</th><th>{t.user}</th><th>{t.topic}</th><th>{t.subject}</th><th className="num">{t.calls}</th><th className="num">{t.tokens}</th><th className="num">{t.cost}</th></tr></thead>
              <tbody>{groups.map((g) => (
                <tr key={g.key}>
                  <td className="muted" style={{ whiteSpace: 'nowrap' }}>{new Date(g.first.created_at).toLocaleString()}</td>
                  <td>{g.first.email}</td>
                  <td className="ellipsis" title={g.first.topic}>{g.first.topic}</td>
                  <td>{[...g.modules].join(', ') || g.first.module}</td>
                  <td className="num">{g.calls}</td>
                  <td className="num">{g.tokens.toLocaleString()}</td>
                  <td className="num"><strong>{money(g.cost, 5)}</strong></td>
                </tr>
              ))}</tbody>
            </table></div>
          )}
        </section>
      )}
    </div>
  );
}
