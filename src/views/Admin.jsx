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
        roles: { admin: 'Admin', blocked: 'Bloqueado', user: 'Usuario' },
        status: 'Email', confirmed: 'Confirmado', pendingTag: 'Pendiente', daysAgo: 'hace {n} d', today0: 'hoy', lastLogin: 'Último ingreso', never: 'Nunca',
        fAll: 'Todos', fPending: 'Pendientes', fConfirmed: 'Confirmados', fBlocked: 'Bloqueados', search: 'Buscar por email o nombre…',
        pendingStat: 'Sin confirmar', selected: '{n} seleccionados', clearSel: 'Quitar selección', selectAll: 'Seleccionar todos',
        cConfirm: 'Confirmar', cResend: 'Reenviar email', cBlock: 'Bloquear', cUnblock: 'Desbloquear', cDelete: 'Eliminar',
        purge: 'Eliminar pendientes de más de', days: 'días', purgeBtn: 'Limpiar',
        ask: { confirm: '¿Confirmar el email de {n} usuario(s)? Van a poder entrar sin abrir el mail.', resend: '¿Reenviar el email de confirmación a {n} usuario(s)?',
               blocked: '¿Bloquear a {n} usuario(s)?', user: '¿Desbloquear a {n} usuario(s)?', delete: '¿Eliminar {n} cuenta(s)? No se puede deshacer.',
               purge: '¿Eliminar todas las cuentas sin confirmar de más de {d} días? No se puede deshacer.' },
        result: 'Listo: {ok} OK', resultFail: ', {f} con error', resultSkip: ', {s} omitidos (admins o tu cuenta)',
        noAuth: 'No se pudo leer el estado de confirmación: {e}. Revisá que SUPABASE_SERVICE_ROLE_KEY esté configurada en Vercel.',
        emailLimit: 'Ojo: el servidor de mail de Supabase por defecto manda pocos emails por hora.', none: 'No hay usuarios con este filtro.' },
  en: { title: 'Admin dashboard', sub: 'AI usage and user management', refresh: 'Refresh', loading: 'Loading dashboard…',
        overview: 'Overview', users: 'Users', requests: 'Requests', totalUsers: 'Users', totalRequests: 'AI requests', totalCost: 'Total cost',
        today: 'Today', reqs: 'requests', tokens: 'Tokens', tokIn: 'in', tokOut: 'out', topUsers: 'Top users by cost', seeAll: 'See all',
        noUsage: 'No usage yet.', email: 'Email', username: 'Name', role: 'Role', signedUp: 'Signed up', cost: 'Cost', action: 'Action',
        allUsers: 'All users', block: 'Block', unblock: 'Unblock', confirmBlock: 'Block?', yes: 'Yes', no: 'No',
        recent: 'Recent requests', noRequests: 'No requests yet.', time: 'Time', user: 'User', topic: 'Topic', subject: 'Subject', calls: 'Calls',
        last14: 'Requests per day (last 14 days)', window: 'Computed over the latest {n} log rows.',
        loadFailed: "Couldn't load the dashboard. Check your connection and try again.", updateFailed: "Couldn't update the user: ",
        roles: { admin: 'Admin', blocked: 'Blocked', user: 'User' },
        status: 'Email', confirmed: 'Confirmed', pendingTag: 'Pending', daysAgo: '{n}d ago', today0: 'today', lastLogin: 'Last login', never: 'Never',
        fAll: 'All', fPending: 'Pending', fConfirmed: 'Confirmed', fBlocked: 'Blocked', search: 'Search by email or name…',
        pendingStat: 'Unconfirmed', selected: '{n} selected', clearSel: 'Clear selection', selectAll: 'Select all',
        cConfirm: 'Confirm', cResend: 'Resend email', cBlock: 'Block', cUnblock: 'Unblock', cDelete: 'Delete',
        purge: 'Delete pending older than', days: 'days', purgeBtn: 'Clean up',
        ask: { confirm: 'Confirm the email of {n} user(s)? They will be able to log in without opening the email.', resend: 'Resend the confirmation email to {n} user(s)?',
               blocked: 'Block {n} user(s)?', user: 'Unblock {n} user(s)?', delete: 'Delete {n} account(s)? This cannot be undone.',
               purge: 'Delete every unconfirmed account older than {d} days? This cannot be undone.' },
        result: 'Done: {ok} OK', resultFail: ', {f} failed', resultSkip: ', {s} skipped (admins or your account)',
        noAuth: "Couldn't read confirmation status: {e}. Check that SUPABASE_SERVICE_ROLE_KEY is set in Vercel.",
        emailLimit: "Note: Supabase's default mail server only sends a few emails per hour.", none: 'No users match this filter.' },
};

/* Calls the admin endpoint with the current session token. */
async function adminApi(payload) {
  const { data } = await supabase.auth.getSession();
  const res = await fetch('/api/admin-users', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + (data?.session?.access_token || '') },
    body: JSON.stringify(payload),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error || 'HTTP ' + res.status);
  return json;
}
const daysSince = (d) => Math.floor((Date.now() - new Date(d).getTime()) / 86400000);

const LOG_LIMIT = 1000;
const money = (n, d = 4) => '$' + (Number(n) || 0).toFixed(d);
const kilo = (n) => ((Number(n) || 0) / 1000).toFixed(1) + 'K';
const costOf = (l) => parseFloat(l.estimated_cost) || 0;
const dayKey = (d) => { const x = new Date(d); return x.getFullYear() + '-' + (x.getMonth() + 1) + '-' + x.getDate(); };

function summarize(allLogs) {
  const logs = allLogs.filter((l) => l.mode !== 'pending'); // requests still in progress
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
  const [busy, setBusy] = useState(false);
  const [authUsers, setAuthUsers] = useState(null); // null = unavailable
  const [authError, setAuthError] = useState('');
  const [filter, setFilter] = useState('all');
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(() => new Set());
  const [ask, setAsk] = useState(null); // { action, ids, role?, days?, text }
  const [notice, setNotice] = useState('');
  const [purgeDays, setPurgeDays] = useState(7);
  const [serverStats, setServerStats] = useState(null); // totals over every log row

  const load = useCallback(async () => {
    setLoading(true); setError('');
    const [l, p] = await Promise.all([
      supabase.from('usage_logs').select('*').order('created_at', { ascending: false }).limit(LOG_LIMIT),
      supabase.from('profiles').select('*').order('created_at', { ascending: false }),
    ]);
    if (l.error || p.error) { console.error(l.error || p.error); setError(t.loadFailed); }
    setLogs(l.data || []); setProfiles(p.data || []);
    try {
      setServerStats(await adminApi({ action: 'stats', tzOffset: new Date().getTimezoneOffset() }));
    } catch (e) { console.error('Usage stats unavailable, using the latest rows:', e); setServerStats(null); }
    try {
      const { users: au } = await adminApi({ action: 'list' });
      setAuthUsers(au || []); setAuthError('');
    } catch (e) { console.error(e); setAuthUsers(null); setAuthError(e.message); }
    setLoading(false);
  }, [t.loadFailed]);

  useEffect(() => { load(); }, [load]);

  const local = useMemo(() => summarize(logs), [logs]);
  const { groups } = local;
  const { stats, byUser, users, days } = serverStats || local;
  const maxDay = Math.max(1, ...days.map((d) => d.n));

  /* One row per account: auth data (confirmation) joined with the profile (name, role). */
  const rows = useMemo(() => {
    const byId = {};
    profiles.forEach((p) => { byId[p.id] = { ...p }; });
    (authUsers || []).forEach((u) => { byId[u.id] = { ...(byId[u.id] || { role: 'user' }), ...u, created_at: byId[u.id]?.created_at || u.created_at }; });
    return Object.values(byId)
      .map((r) => ({ ...r, isPending: authUsers ? !r.email_confirmed_at : false }))
      .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
  }, [profiles, authUsers]);

  const counts = useMemo(() => ({
    all: rows.length,
    pending: rows.filter((r) => r.isPending).length,
    confirmed: rows.filter((r) => authUsers && !r.isPending).length,
    blocked: rows.filter((r) => r.role === 'blocked').length,
  }), [rows, authUsers]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((r) => {
      if (filter === 'pending' && !r.isPending) return false;
      if (filter === 'confirmed' && (r.isPending || !authUsers)) return false;
      if (filter === 'blocked' && r.role !== 'blocked') return false;
      if (q && !((r.email || '').toLowerCase().includes(q) || (r.username || '').toLowerCase().includes(q))) return false;
      return true;
    });
  }, [rows, filter, query, authUsers]);

  const selectable = visible.filter((r) => r.role !== 'admin');
  const selRows = rows.filter((r) => selected.has(r.id));
  const toggle = (id) => setSelected((s0) => { const s1 = new Set(s0); s1.has(id) ? s1.delete(id) : s1.add(id); return s1; });
  const allChecked = selectable.length > 0 && selectable.every((r) => selected.has(r.id));
  const toggleAll = () => setSelected(allChecked ? new Set() : new Set(selectable.map((r) => r.id)));

  /* Ask first, then run. kind = confirm | resend | delete | purge | role */
  const request = (action, ids, extra = {}) => {
    const key = action === 'role' ? extra.role : action;
    const text = t.ask[key].replace('{n}', ids.length).replace('{d}', extra.days);
    setAsk({ action, ids, ...extra, text });
  };

  const runAsk = async () => {
    const a = ask; setAsk(null); setBusy(true); setError(''); setNotice('');
    try {
      const r = await adminApi({ action: a.action, ids: a.ids, role: a.role, days: a.days });
      let msg = t.result.replace('{ok}', r.done.length);
      if (r.failed.length) msg += t.resultFail.replace('{f}', r.failed.length) + ' (' + r.failed[0].error + ')';
      if (r.skipped.length) msg += t.resultSkip.replace('{s}', r.skipped.length);
      if (a.action === 'resend') msg += '. ' + t.emailLimit;
      setNotice(msg);
      setSelected(new Set());
      await load();
    } catch (e) {
      setError(t.updateFailed + e.message);
    } finally { setBusy(false); }
  };

  const statusTag = (r) => {
    if (!authUsers) return <span className="muted">—</span>;
    if (!r.isPending) return <span className="tag tag-green">{t.confirmed}</span>;
    const d = daysSince(r.created_at);
    return <span className="tag tag-accent" title={r.confirmation_sent_at ? new Date(r.confirmation_sent_at).toLocaleString() : ''}>{t.pendingTag} · {d === 0 ? t.today0 : t.daysAgo.replace('{n}', d)}</span>;
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
            <div className="stat"><b>{rows.length}</b><span>{t.totalUsers}</span></div>
            {authUsers && (
              <button type="button" className="stat" style={{ textAlign: 'left', cursor: 'pointer' }} onClick={() => { setFilter('pending'); setTab('users'); }}>
                <b>{counts.pending}</b><span>{t.pendingStat}</span>
              </button>
            )}
            <div className="stat"><b>{stats.requests}</b><span>{t.totalRequests}</span></div>
            <div className="stat is-accent"><b>{money(stats.cost, 2)}</b><span>{t.totalCost}</span></div>
            <div className="stat"><b>{stats.todayReqs}</b><span>{t.today} · {t.reqs}</span><small>{money(stats.todayCost)}</small></div>
            <div className="stat"><b>{kilo(stats.input + stats.output)}</b><span>{t.tokens}</span><small>{kilo(stats.input)} {t.tokIn} · {kilo(stats.output)} {t.tokOut}</small></div>
          </div>
          {!serverStats && logs.length >= LOG_LIMIT && <p className="small muted" style={{ marginBottom: 14 }}>{t.window.replace('{n}', LOG_LIMIT)}</p>}

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

      {notice && <div className="alert alert-ok" role="status" style={{ marginBottom: 16 }}>{notice}</div>}
      {!loading && authError && <div className="alert alert-accent" role="alert" style={{ marginBottom: 16 }}>{t.noAuth.replace('{e}', authError)}</div>}

      {ask && (
        <div className="alert alert-accent" role="alertdialog" style={{ marginBottom: 16, alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' }}>
          <span>{ask.text}</span>
          <span style={{ display: 'inline-flex', gap: 6 }}>
            <button type="button" className={'btn btn-sm ' + (['delete', 'purge'].includes(ask.action) || ask.role === 'blocked' ? 'btn-danger' : 'btn-ok')} onClick={runAsk}>{t.yes}</button>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setAsk(null)}>{t.no}</button>
          </span>
        </div>
      )}

      {!loading && tab === 'users' && (
        <section className="card ad-panel">
          <div className="ad-panel-head" style={{ flexWrap: 'wrap' }}>
            <h2>{t.allUsers} ({rows.length})</h2>
            {authUsers && (
              <span style={{ display: 'inline-flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }} className="small">
                {t.purge}
                <input className="input" type="number" min="1" max="365" value={purgeDays} aria-label={t.days}
                  onChange={(e) => setPurgeDays(e.target.value)} style={{ width: 70, minHeight: 36, padding: '0 8px' }} />
                {t.days}
                <button type="button" className="btn btn-danger btn-sm" disabled={busy}
                  onClick={() => request('purge', [], { days: Math.max(1, parseInt(purgeDays, 10) || 7) })}>{t.purgeBtn}</button>
              </span>
            )}
          </div>

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', padding: '12px 18px', borderBottom: '1px solid var(--border)' }}>
            <div className="seg" role="tablist">
              {[['all', t.fAll], ...(authUsers ? [['pending', t.fPending], ['confirmed', t.fConfirmed]] : []), ['blocked', t.fBlocked]].map(([id, label]) => (
                <button key={id} type="button" role="tab" aria-selected={filter === id} onClick={() => { setFilter(id); setSelected(new Set()); }}>
                  {label} <span className="muted">{counts[id]}</span>
                </button>
              ))}
            </div>
            <input className="input" type="search" placeholder={t.search} value={query} onChange={(e) => setQuery(e.target.value)}
              style={{ flex: '1 1 220px', minHeight: 40 }} aria-label={t.search} />
          </div>

          {selected.size > 0 && (
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center', padding: '10px 18px', borderBottom: '1px solid var(--border)', background: 'var(--bg-alt)' }}>
              <strong className="small" style={{ marginRight: 6 }}>{t.selected.replace('{n}', selected.size)}</strong>
              {authUsers && <button type="button" className="btn btn-ok btn-sm" disabled={busy || !selRows.some((r) => r.isPending)}
                onClick={() => request('confirm', selRows.filter((r) => r.isPending).map((r) => r.id))}>{t.cConfirm}</button>}
              {authUsers && <button type="button" className="btn btn-ghost btn-sm" disabled={busy || !selRows.some((r) => r.isPending)}
                onClick={() => request('resend', selRows.filter((r) => r.isPending).map((r) => r.id))}>{t.cResend}</button>}
              <button type="button" className="btn btn-ghost btn-sm" disabled={busy} onClick={() => request('role', [...selected], { role: 'blocked' })}>{t.cBlock}</button>
              <button type="button" className="btn btn-ghost btn-sm" disabled={busy} onClick={() => request('role', [...selected], { role: 'user' })}>{t.cUnblock}</button>
              <button type="button" className="btn btn-danger btn-sm" disabled={busy} onClick={() => request('delete', [...selected])}>{t.cDelete}</button>
              <button type="button" className="link-btn" style={{ marginLeft: 'auto' }} onClick={() => setSelected(new Set())}>{t.clearSel}</button>
            </div>
          )}

          {visible.length === 0 ? <p className="muted" style={{ padding: 20, textAlign: 'center' }}>{t.none}</p> : (
          <div className="table-wrap"><table className="table">
            <thead><tr>
              <th><input type="checkbox" checked={allChecked} onChange={toggleAll} aria-label={t.selectAll} disabled={!selectable.length} /></th>
              <th>{t.email}</th><th>{t.username}</th><th>{t.status}</th><th>{t.role}</th><th>{t.signedUp}</th><th>{t.lastLogin}</th>
              <th className="num">{t.requests}</th><th className="num">{t.cost}</th><th>{t.action}</th>
            </tr></thead>
            <tbody>{visible.map((p) => {
              const usage = byUser[p.email];
              const isAdminRow = p.role === 'admin';
              const blocked = p.role === 'blocked';
              return (
                <tr key={p.id}>
                  <td>{isAdminRow ? null : <input type="checkbox" checked={selected.has(p.id)} onChange={() => toggle(p.id)} aria-label={p.email} />}</td>
                  <td><strong>{p.email}</strong></td>
                  <td className={p.username ? '' : 'muted'}>{p.username || '—'}</td>
                  <td style={{ whiteSpace: 'nowrap' }}>{statusTag(p)}</td>
                  <td>{roleTag(p.role)}</td>
                  <td className="muted">{p.created_at ? new Date(p.created_at).toLocaleDateString() : '—'}</td>
                  <td className="muted">{authUsers ? (p.last_sign_in_at ? new Date(p.last_sign_in_at).toLocaleDateString() : t.never) : '—'}</td>
                  <td className="num">{usage?.requests || 0}</td>
                  <td className="num">{money(usage?.cost)}</td>
                  <td>
                    {isAdminRow ? null : (
                      <span style={{ display: 'inline-flex', gap: 6, whiteSpace: 'nowrap' }}>
                        {p.isPending && <button type="button" className="btn btn-ok btn-sm" disabled={busy} onClick={() => request('confirm', [p.id])}>{t.cConfirm}</button>}
                        {p.isPending && <button type="button" className="btn btn-ghost btn-sm" disabled={busy} onClick={() => request('resend', [p.id])}>{t.cResend}</button>}
                        <button type="button" className={'btn btn-sm ' + (blocked ? 'btn-ok' : 'btn-ghost')} disabled={busy}
                          onClick={() => request('role', [p.id], { role: blocked ? 'user' : 'blocked' })}>{blocked ? t.unblock : t.block}</button>
                        <button type="button" className="btn btn-danger btn-sm" disabled={busy} onClick={() => request('delete', [p.id])}>{t.cDelete}</button>
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}</tbody>
          </table></div>
          )}
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
