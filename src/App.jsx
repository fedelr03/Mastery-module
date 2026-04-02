import { useState, useEffect } from 'react';
import { supabase } from './supabase';
import MasteryModule from './MasteryModule';

const TH = {
  bg: '#f7f5f0', surface: '#ffffff', border: '#e4ded4', borderLight: '#ece8e0',
  text: '#2a2a3a', textSecondary: '#5c5c6c', textMuted: '#8a8a96', textFaint: '#b0aeb8',
  accent: '#e8940a', accentLight: '#f5a623', accentBg: 'rgba(245,166,35,0.07)',
  red: '#ef4444', green: '#22c55e', purple: '#6366f1',
};

/* ═══════════ AUTH SCREEN ═══════════ */
function AuthScreen() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError(''); setSuccess('');
    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        if (data?.user?.identities?.length === 0) {
          setError('An account with this email already exists.');
        } else {
          setSuccess('Account created! Check your email to confirm, then log in.');
        }
      }
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  const inputStyle = {
    width: '100%', padding: '12px 14px', border: '1px solid ' + TH.border, borderRadius: 10,
    fontSize: 14, fontFamily: 'inherit', background: TH.bg, color: TH.text, outline: 'none',
  };

  return (
    <div style={{ minHeight: '100vh', background: TH.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ width: '100%', maxWidth: 380, animation: 'fadeUp 0.4s ease' }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: TH.accentBg, border: '1px solid rgba(232,148,10,0.25)', borderRadius: 10, padding: '3px 10px', marginBottom: 12, fontSize: 9, color: TH.accent, fontWeight: 700, letterSpacing: 1.5 }}>&#x2211; MASTERY MODULE</div>
          <h1 style={{ fontFamily: "'Bricolage Grotesque',sans-serif", fontSize: 32, fontWeight: 800, color: TH.text, letterSpacing: '-0.02em' }}>
            {isLogin ? 'Welcome Back' : 'Create Account'}
          </h1>
          <p style={{ color: TH.textMuted, fontSize: 13, marginTop: 6 }}>
            {isLogin ? 'Log in to continue learning' : 'Sign up to start your journey'}
          </p>
        </div>

        <div style={{ background: TH.surface, borderRadius: 16, border: '1px solid ' + TH.border, padding: 24, boxShadow: '0 4px 24px rgba(0,0,0,0.04)' }}>
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 11, fontWeight: 600, color: TH.textSecondary, display: 'block', marginBottom: 5 }}>Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="you@email.com" style={inputStyle} />
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 11, fontWeight: 600, color: TH.textSecondary, display: 'block', marginBottom: 5 }}>Password</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder={isLogin ? 'Your password' : 'Min 6 characters'} minLength={6} style={inputStyle} />
            </div>
            {error && <div style={{ padding: '8px 12px', background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.12)', borderRadius: 8, color: TH.red, fontSize: 12, marginBottom: 14 }}>{error}</div>}
            {success && <div style={{ padding: '8px 12px', background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.12)', borderRadius: 8, color: TH.green, fontSize: 12, marginBottom: 14 }}>{success}</div>}
            <button type="submit" disabled={loading} style={{
              width: '100%', padding: '13px', border: 'none', borderRadius: 10,
              background: loading ? TH.border : 'linear-gradient(135deg, ' + TH.accentLight + ', ' + TH.accent + ')',
              color: '#fff', fontWeight: 700, fontSize: 14, cursor: loading ? 'wait' : 'pointer',
              fontFamily: 'inherit', boxShadow: '0 2px 12px rgba(232,148,10,0.2)',
            }}>
              {loading ? '...' : isLogin ? 'Log In' : 'Sign Up'}
            </button>
          </form>
          <div style={{ textAlign: 'center', marginTop: 16 }}>
            <button onClick={() => { setIsLogin(!isLogin); setError(''); setSuccess(''); }} style={{
              background: 'none', border: 'none', color: TH.accent, fontSize: 12,
              cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600,
            }}>
              {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Log in'}
            </button>
          </div>
        </div>
        <p style={{ textAlign: 'center', color: TH.textMuted, fontSize: 10, marginTop: 16 }}>Learn by First Principles</p>
      </div>
    </div>
  );
}

/* ═══════════ ADMIN DASHBOARD ═══════════ */
function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [recent, setRecent] = useState([]);
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('overview');

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const { data: logs } = await supabase.from('usage_logs').select('*').order('created_at', { ascending: false }).limit(500);
      const { data: profs } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
      setProfiles(profs || []);
      if (logs) {
        setRecent(logs.slice(0, 50));
        const totalRequests = logs.length;
        const totalCost = logs.reduce((s, l) => s + (parseFloat(l.estimated_cost) || 0), 0);
        const totalInput = logs.reduce((s, l) => s + (l.input_tokens || 0), 0);
        const totalOutput = logs.reduce((s, l) => s + (l.output_tokens || 0), 0);
        const today = new Date().toDateString();
        const todayReqs = logs.filter(l => new Date(l.created_at).toDateString() === today).length;
        const todayCost = logs.filter(l => new Date(l.created_at).toDateString() === today).reduce((s, l) => s + (parseFloat(l.estimated_cost) || 0), 0);
        setStats({ totalRequests, totalCost, totalInput, totalOutput, totalUsers: profs?.length || 0, todayReqs, todayCost });
        const byUser = {};
        logs.forEach(l => {
          if (!byUser[l.email]) byUser[l.email] = { email: l.email, requests: 0, cost: 0, input: 0, output: 0, last: l.created_at };
          byUser[l.email].requests++;
          byUser[l.email].cost += parseFloat(l.estimated_cost) || 0;
          byUser[l.email].input += l.input_tokens || 0;
          byUser[l.email].output += l.output_tokens || 0;
        });
        setUsers(Object.values(byUser).sort((a, b) => b.requests - a.requests));
      }
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  const toggleBlock = async (userId, currentRole) => {
    const newRole = currentRole === 'blocked' ? 'user' : 'blocked';
    const { error } = await supabase.from('profiles').update({ role: newRole }).eq('id', userId);
    if (!error) loadData();
    else alert('Failed to update user: ' + error.message);
  };

  const card = (label, value, sub, color) => (
    <div style={{ background: TH.surface, borderRadius: 12, border: '1px solid ' + TH.border, padding: '14px 18px', flex: '1 1 140px', minWidth: 140 }}>
      <div style={{ fontSize: 9, color: TH.textMuted, fontWeight: 700, letterSpacing: 1, marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 26, fontWeight: 800, color: color || TH.text, fontFamily: "'Bricolage Grotesque',sans-serif" }}>{value}</div>
      {sub && <div style={{ fontSize: 9, color: TH.textMuted, marginTop: 2 }}>{sub}</div>}
    </div>
  );

  const th = { textAlign: 'left', padding: '8px 10px', fontSize: 9, fontWeight: 700, color: TH.textMuted, borderBottom: '1px solid ' + TH.border, letterSpacing: 0.5 };
  const td = { padding: '8px 10px', fontSize: 11.5, color: TH.text, borderBottom: '1px solid rgba(0,0,0,0.03)' };
  const tabBtn = (id, label) => (
    <button key={id} onClick={() => setTab(id)} style={{
      padding: '6px 16px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
      border: '1px solid ' + (tab === id ? TH.accent : TH.border),
      background: tab === id ? TH.accentBg : 'transparent', color: tab === id ? TH.accent : TH.textMuted,
    }}>{label}</button>
  );

  if (loading) return <div style={{ padding: 60, textAlign: 'center', color: TH.textMuted, fontSize: 13 }}>Loading dashboard...</div>;

  return (
    <div style={{ maxWidth: 960, margin: '0 auto', padding: '24px 20px 60px', animation: 'fadeUp 0.3s ease' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 10 }}>
        <div>
          <h2 style={{ fontFamily: "'Bricolage Grotesque',sans-serif", fontSize: 24, fontWeight: 800, color: TH.text }}>Admin Dashboard</h2>
          <p style={{ color: TH.textMuted, fontSize: 11, marginTop: 2 }}>Usage tracking & user management</p>
        </div>
        <button onClick={loadData} style={{ background: TH.surface, border: '1px solid ' + TH.border, borderRadius: 8, padding: '7px 16px', fontSize: 11, color: TH.textSecondary, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600 }}>Refresh</button>
      </div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {tabBtn('overview', 'Overview')}
        {tabBtn('users', 'Users')}
        {tabBtn('requests', 'Requests')}
      </div>

      {tab === 'overview' && stats && <>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 20 }}>
          {card('TOTAL USERS', stats.totalUsers)}
          {card('TOTAL REQUESTS', stats.totalRequests)}
          {card('TOTAL COST', '$' + stats.totalCost.toFixed(4), null, TH.accent)}
          {card('TODAY', stats.todayReqs + ' reqs', '$' + stats.todayCost.toFixed(4), TH.purple)}
          {card('TOKENS', ((stats.totalInput + stats.totalOutput) / 1000).toFixed(1) + 'K', (stats.totalInput / 1000).toFixed(1) + 'K in / ' + (stats.totalOutput / 1000).toFixed(1) + 'K out')}
        </div>
        <div style={{ background: TH.surface, borderRadius: 12, border: '1px solid ' + TH.border, overflow: 'hidden' }}>
          <div style={{ padding: '12px 16px', borderBottom: '1px solid ' + TH.border, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: TH.text }}>Top Users by Cost</span>
            <button onClick={() => setTab('users')} style={{ fontSize: 10, color: TH.accent, background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, fontFamily: 'inherit' }}>See all</button>
          </div>
          {users.length === 0 ? <div style={{ padding: 20, textAlign: 'center', color: TH.textMuted, fontSize: 12 }}>No usage yet</div> :
          <div style={{ overflowX: 'auto' }}><table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr><th style={th}>EMAIL</th><th style={th}>REQUESTS</th><th style={th}>COST</th></tr></thead>
            <tbody>{users.slice(0, 5).map(u => <tr key={u.email}>
              <td style={td}><span style={{ fontWeight: 600 }}>{u.email}</span></td>
              <td style={td}>{u.requests}</td>
              <td style={{ ...td, color: TH.accent, fontWeight: 700 }}>${u.cost.toFixed(4)}</td>
            </tr>)}</tbody>
          </table></div>}
        </div>
      </>}

      {tab === 'users' && <div style={{ background: TH.surface, borderRadius: 12, border: '1px solid ' + TH.border, overflow: 'hidden' }}>
        <div style={{ padding: '12px 16px', borderBottom: '1px solid ' + TH.border }}><span style={{ fontSize: 13, fontWeight: 700, color: TH.text }}>All Users ({profiles.length})</span></div>
        <div style={{ overflowX: 'auto' }}><table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead><tr><th style={th}>EMAIL</th><th style={th}>ROLE</th><th style={th}>SIGNED UP</th><th style={th}>REQUESTS</th><th style={th}>COST</th><th style={th}>ACTION</th></tr></thead>
          <tbody>{profiles.map(p => {
            const usage = users.find(u => u.email === p.email);
            return <tr key={p.id}>
              <td style={td}><span style={{ fontWeight: 600 }}>{p.email}</span></td>
              <td style={td}><span style={{
                fontSize: 9, fontWeight: 700, padding: '2px 8px', borderRadius: 4, letterSpacing: 0.3,
                background: p.role === 'admin' ? 'rgba(245,166,35,0.1)' : p.role === 'blocked' ? 'rgba(239,68,68,0.08)' : 'rgba(34,197,94,0.06)',
                color: p.role === 'admin' ? TH.accent : p.role === 'blocked' ? TH.red : TH.green,
              }}>{(p.role || 'user').toUpperCase()}</span></td>
              <td style={{ ...td, fontSize: 10, color: TH.textMuted }}>{new Date(p.created_at).toLocaleDateString()}</td>
              <td style={td}>{usage?.requests || 0}</td>
              <td style={{ ...td, color: TH.accent, fontWeight: 600 }}>${(usage?.cost || 0).toFixed(4)}</td>
              <td style={td}>{p.role !== 'admin' && <button onClick={() => toggleBlock(p.id, p.role)} style={{
                fontSize: 10, fontWeight: 600, padding: '4px 10px', borderRadius: 6, cursor: 'pointer', fontFamily: 'inherit',
                background: p.role === 'blocked' ? 'rgba(34,197,94,0.08)' : 'rgba(239,68,68,0.06)',
                border: '1px solid ' + (p.role === 'blocked' ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.15)'),
                color: p.role === 'blocked' ? TH.green : TH.red,
              }}>{p.role === 'blocked' ? 'Unblock' : 'Block'}</button>}</td>
            </tr>;
          })}</tbody>
        </table></div>
      </div>}

      {tab === 'requests' && <div style={{ background: TH.surface, borderRadius: 12, border: '1px solid ' + TH.border, overflow: 'hidden' }}>
        <div style={{ padding: '12px 16px', borderBottom: '1px solid ' + TH.border }}><span style={{ fontSize: 13, fontWeight: 700, color: TH.text }}>Recent Requests ({recent.length})</span></div>
        {recent.length === 0 ? <div style={{ padding: 20, textAlign: 'center', color: TH.textMuted, fontSize: 12 }}>No requests yet</div> :
        <div style={{ overflowX: 'auto' }}><table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead><tr><th style={th}>TIME</th><th style={th}>USER</th><th style={th}>TOPIC</th><th style={th}>MODULE</th><th style={th}>MODE</th><th style={th}>TOKENS</th><th style={th}>COST</th></tr></thead>
          <tbody>{recent.map(r => <tr key={r.id}>
            <td style={{ ...td, fontSize: 10, color: TH.textMuted, whiteSpace: 'nowrap' }}>{new Date(r.created_at).toLocaleString()}</td>
            <td style={{ ...td, fontSize: 11 }}>{r.email}</td>
            <td style={{ ...td, fontSize: 11, maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.topic}</td>
            <td style={td}><span style={{ fontSize: 9, padding: '2px 6px', borderRadius: 4, background: TH.bg, fontWeight: 600 }}>{r.module}</span></td>
            <td style={td}><span style={{ fontSize: 9, padding: '2px 6px', borderRadius: 4, background: r.mode === 'fast' ? 'rgba(34,197,94,0.08)' : 'rgba(99,102,241,0.08)', fontWeight: 600, color: r.mode === 'fast' ? TH.green : TH.purple }}>{r.mode}</span></td>
            <td style={{ ...td, fontSize: 11 }}>{((r.input_tokens || 0) + (r.output_tokens || 0)).toLocaleString()}</td>
            <td style={{ ...td, color: TH.accent, fontWeight: 700, fontSize: 11 }}>${(parseFloat(r.estimated_cost) || 0).toFixed(4)}</td>
          </tr>)}</tbody>
        </table></div>}
      </div>}
    </div>
  );
}

/* ═══════════ TOP BAR ═══════════ */
function TopBar({ session, isAdmin, view, setView, onLogout }) {
  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1000,
      background: 'rgba(247,245,240,0.95)', backdropFilter: 'blur(12px)',
      borderBottom: '1px solid ' + TH.border,
    }}>
      <div style={{
        maxWidth: 960, margin: '0 auto', padding: '8px 20px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 6,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 14, fontWeight: 800, color: TH.text, fontFamily: "'Bricolage Grotesque',sans-serif" }}>&#x2211;</span>
          <span style={{ fontSize: 11, color: TH.textMuted, maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{session.user.email}</span>
          {isAdmin && <span style={{ fontSize: 8, fontWeight: 700, color: TH.accent, background: TH.accentBg, padding: '2px 6px', borderRadius: 4, letterSpacing: 0.5 }}>ADMIN</span>}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {isAdmin && <>
            <button onClick={() => setView('module')} style={{
              padding: '5px 14px', borderRadius: 7, fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
              border: '1px solid ' + (view === 'module' ? TH.accent : TH.border),
              background: view === 'module' ? TH.accentBg : 'transparent', color: view === 'module' ? TH.accent : TH.textMuted,
            }}>Module</button>
            <button onClick={() => setView('admin')} style={{
              padding: '5px 14px', borderRadius: 7, fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
              border: '1px solid ' + (view === 'admin' ? TH.accent : TH.border),
              background: view === 'admin' ? TH.accentBg : 'transparent', color: view === 'admin' ? TH.accent : TH.textMuted,
            }}>Dashboard</button>
          </>}
          <button onClick={onLogout} style={{
            padding: '5px 14px', borderRadius: 7, fontSize: 11, cursor: 'pointer', fontFamily: 'inherit',
            background: 'transparent', border: '1px solid ' + TH.border, color: TH.textMuted, fontWeight: 600, marginLeft: 4,
          }}>Log Out</button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════ MAIN APP ═══════════ */
export default function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const [view, setView] = useState('module');

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) checkRole(session.user.id);
      setLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) checkRole(session.user.id);
      else { setIsAdmin(false); setIsBlocked(false); setView('module'); }
    });
    return () => subscription.unsubscribe();
  }, []);

  const checkRole = async (userId) => {
    const { data } = await supabase.from('profiles').select('role').eq('id', userId).single();
    setIsAdmin(data?.role === 'admin');
    setIsBlocked(data?.role === 'blocked');
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setSession(null); setIsAdmin(false); setIsBlocked(false); setView('module');
  };

  if (loading) return <div style={{ minHeight: '100vh', background: TH.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: TH.textMuted, fontSize: 13 }}>Loading...</div>;
  if (!session) return <AuthScreen />;

  if (isBlocked) return (
    <div style={{ minHeight: '100vh', background: TH.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ textAlign: 'center', maxWidth: 400 }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>&#x1F6AB;</div>
        <h2 style={{ fontFamily: "'Bricolage Grotesque',sans-serif", fontSize: 22, fontWeight: 800, color: TH.text, marginBottom: 8 }}>Account Blocked</h2>
        <p style={{ color: TH.textMuted, fontSize: 13, lineHeight: 1.6, marginBottom: 20 }}>Your account has been temporarily suspended. Contact the administrator for more information.</p>
        <button onClick={handleLogout} style={{ padding: '10px 24px', borderRadius: 10, border: '1px solid ' + TH.border, background: TH.surface, color: TH.textSecondary, fontWeight: 600, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>Log Out</button>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: TH.bg }}>
      <TopBar session={session} isAdmin={isAdmin} view={view} setView={setView} onLogout={handleLogout} />
      <div style={{ paddingTop: 48 }}>
        {view === 'admin' && isAdmin
          ? <AdminDashboard />
          : <div style={{ maxWidth: 960, margin: '0 auto' }}><MasteryModule session={session} /></div>
        }
      </div>
    </div>
  );
}
