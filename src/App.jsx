import { useState, useEffect } from 'react';
import { supabase } from './supabase';
import MasteryModule from './MasteryModule';

const TH = {
  bg: '#f7f5f0', surface: '#ffffff', border: '#e4ded4', text: '#2a2a3a',
  textSecondary: '#5c5c6c', textMuted: '#8a8a96', accent: '#e8940a',
  accentLight: '#f5a623', red: '#ef4444', green: '#22c55e',
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
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setSuccess('Check your email to confirm your account!');
      }
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  const inputStyle = {
    width: '100%', padding: '12px 14px', border: '1px solid ' + TH.border, borderRadius: 10,
    fontSize: 14, fontFamily: 'inherit', background: TH.bg, color: TH.text,
    outline: 'none', transition: 'border-color 0.2s',
  };

  return (
    <div style={{ minHeight: '100vh', background: TH.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ width: '100%', maxWidth: 400, animation: 'fadeUp 0.4s ease' }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: 'rgba(245,166,35,0.07)', border: '1px solid rgba(232,148,10,0.25)', borderRadius: 10, padding: '3px 10px', marginBottom: 12, fontSize: 9, color: TH.accent, fontWeight: 700, letterSpacing: 1.5 }}>∑ MASTERY MODULE</div>
          <h1 style={{ fontFamily: "'Bricolage Grotesque',sans-serif", fontSize: 32, fontWeight: 800, color: TH.text, letterSpacing: '-0.02em' }}>
            {isLogin ? 'Welcome Back' : 'Create Account'}
          </h1>
          <p style={{ color: TH.textMuted, fontSize: 13, marginTop: 6 }}>
            {isLogin ? 'Log in to continue learning' : 'Sign up to start your learning journey'}
          </p>
        </div>

        <div style={{ background: TH.surface, borderRadius: 16, border: '1px solid ' + TH.border, padding: 24, boxShadow: '0 4px 24px rgba(0,0,0,0.04)' }}>
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 11, fontWeight: 600, color: TH.textSecondary, display: 'block', marginBottom: 5 }}>Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="you@email.com" style={inputStyle}
                onFocus={e => e.target.style.borderColor = TH.accent} onBlur={e => e.target.style.borderColor = TH.border} />
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 11, fontWeight: 600, color: TH.textSecondary, display: 'block', marginBottom: 5 }}>Password</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder={isLogin ? 'Your password' : 'Min 6 characters'} minLength={6} style={inputStyle}
                onFocus={e => e.target.style.borderColor = TH.accent} onBlur={e => e.target.style.borderColor = TH.border} />
            </div>

            {error && <div style={{ padding: '8px 12px', background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.12)', borderRadius: 8, color: TH.red, fontSize: 12, marginBottom: 14 }}>{error}</div>}
            {success && <div style={{ padding: '8px 12px', background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.12)', borderRadius: 8, color: TH.green, fontSize: 12, marginBottom: 14 }}>{success}</div>}

            <button type="submit" disabled={loading} style={{
              width: '100%', padding: '13px', border: 'none', borderRadius: 10,
              background: loading ? TH.border : 'linear-gradient(135deg, ' + TH.accentLight + ', ' + TH.accent + ')',
              color: '#fff', fontWeight: 700, fontSize: 14, cursor: loading ? 'wait' : 'pointer',
              fontFamily: 'inherit', letterSpacing: 0.3, boxShadow: '0 2px 12px rgba(232,148,10,0.2)',
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
function AdminDashboard({ session }) {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [recent, setRecent] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      /* Fetch all usage logs (admin RLS policy allows this) */
      const { data: logs } = await supabase.from('usage_logs').select('*').order('created_at', { ascending: false }).limit(500);
      const { data: profiles } = await supabase.from('profiles').select('*');

      if (logs) {
        setRecent(logs.slice(0, 50));

        /* Aggregate stats */
        const totalRequests = logs.length;
        const totalCost = logs.reduce((s, l) => s + (parseFloat(l.estimated_cost) || 0), 0);
        const totalInputTokens = logs.reduce((s, l) => s + (l.input_tokens || 0), 0);
        const totalOutputTokens = logs.reduce((s, l) => s + (l.output_tokens || 0), 0);
        setStats({ totalRequests, totalCost, totalInputTokens, totalOutputTokens, totalUsers: profiles?.length || 0 });

        /* Per-user aggregation */
        const byUser = {};
        logs.forEach(l => {
          if (!byUser[l.email]) byUser[l.email] = { email: l.email, requests: 0, cost: 0, inputTokens: 0, outputTokens: 0, lastActive: l.created_at };
          byUser[l.email].requests++;
          byUser[l.email].cost += parseFloat(l.estimated_cost) || 0;
          byUser[l.email].inputTokens += l.input_tokens || 0;
          byUser[l.email].outputTokens += l.output_tokens || 0;
        });
        setUsers(Object.values(byUser).sort((a, b) => b.requests - a.requests));
      }
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  const cardStyle = { background: TH.surface, borderRadius: 12, border: '1px solid ' + TH.border, padding: '16px 20px', flex: 1, minWidth: 140 };
  const thStyle = { textAlign: 'left', padding: '8px 10px', fontSize: 10, fontWeight: 700, color: TH.textMuted, borderBottom: '1px solid ' + TH.border, letterSpacing: 0.5 };
  const tdStyle = { padding: '8px 10px', fontSize: 12, color: TH.text, borderBottom: '1px solid rgba(0,0,0,0.03)' };

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: TH.textMuted }}>Loading dashboard...</div>;

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '20px 20px 40px', animation: 'fadeUp 0.3s ease' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h2 style={{ fontFamily: "'Bricolage Grotesque',sans-serif", fontSize: 22, fontWeight: 800, color: TH.text }}>Admin Dashboard</h2>
          <p style={{ color: TH.textMuted, fontSize: 11, marginTop: 2 }}>Usage tracking & analytics</p>
        </div>
        <button onClick={loadData} style={{ background: TH.bg, border: '1px solid ' + TH.border, borderRadius: 8, padding: '7px 14px', fontSize: 11, color: TH.textSecondary, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600 }}>Refresh</button>
      </div>

      {/* ── Summary Cards ── */}
      {stats && <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 24 }}>
        <div style={cardStyle}>
          <div style={{ fontSize: 10, color: TH.textMuted, fontWeight: 600, marginBottom: 4 }}>TOTAL USERS</div>
          <div style={{ fontSize: 28, fontWeight: 800, color: TH.text, fontFamily: "'Bricolage Grotesque',sans-serif" }}>{stats.totalUsers}</div>
        </div>
        <div style={cardStyle}>
          <div style={{ fontSize: 10, color: TH.textMuted, fontWeight: 600, marginBottom: 4 }}>TOTAL REQUESTS</div>
          <div style={{ fontSize: 28, fontWeight: 800, color: TH.text, fontFamily: "'Bricolage Grotesque',sans-serif" }}>{stats.totalRequests}</div>
        </div>
        <div style={cardStyle}>
          <div style={{ fontSize: 10, color: TH.textMuted, fontWeight: 600, marginBottom: 4 }}>TOTAL COST</div>
          <div style={{ fontSize: 28, fontWeight: 800, color: TH.accent, fontFamily: "'Bricolage Grotesque',sans-serif" }}>${stats.totalCost.toFixed(4)}</div>
        </div>
        <div style={cardStyle}>
          <div style={{ fontSize: 10, color: TH.textMuted, fontWeight: 600, marginBottom: 4 }}>TOTAL TOKENS</div>
          <div style={{ fontSize: 18, fontWeight: 800, color: TH.text, fontFamily: "'Bricolage Grotesque',sans-serif" }}>{((stats.totalInputTokens + stats.totalOutputTokens) / 1000).toFixed(1)}K</div>
          <div style={{ fontSize: 9, color: TH.textMuted, marginTop: 2 }}>{(stats.totalInputTokens / 1000).toFixed(1)}K in / {(stats.totalOutputTokens / 1000).toFixed(1)}K out</div>
        </div>
      </div>}

      {/* ── Per-User Table ── */}
      <div style={{ background: TH.surface, borderRadius: 12, border: '1px solid ' + TH.border, overflow: 'hidden', marginBottom: 24 }}>
        <div style={{ padding: '12px 16px', borderBottom: '1px solid ' + TH.border }}>
          <h3 style={{ fontSize: 13, fontWeight: 700, color: TH.text }}>Usage by User</h3>
        </div>
        {users.length === 0 ? <div style={{ padding: 20, textAlign: 'center', color: TH.textMuted, fontSize: 12 }}>No usage yet</div> :
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr>
              <th style={thStyle}>EMAIL</th>
              <th style={thStyle}>REQUESTS</th>
              <th style={thStyle}>INPUT TOKENS</th>
              <th style={thStyle}>OUTPUT TOKENS</th>
              <th style={thStyle}>COST</th>
              <th style={thStyle}>LAST ACTIVE</th>
            </tr></thead>
            <tbody>
              {users.map(u => <tr key={u.email}>
                <td style={tdStyle}><span style={{ fontWeight: 600 }}>{u.email}</span></td>
                <td style={tdStyle}>{u.requests}</td>
                <td style={tdStyle}>{u.inputTokens.toLocaleString()}</td>
                <td style={tdStyle}>{u.outputTokens.toLocaleString()}</td>
                <td style={{ ...tdStyle, color: TH.accent, fontWeight: 600 }}>${u.cost.toFixed(4)}</td>
                <td style={{ ...tdStyle, color: TH.textMuted, fontSize: 11 }}>{new Date(u.lastActive).toLocaleDateString()}</td>
              </tr>)}
            </tbody>
          </table>
        </div>}
      </div>

      {/* ── Recent Requests ── */}
      <div style={{ background: TH.surface, borderRadius: 12, border: '1px solid ' + TH.border, overflow: 'hidden' }}>
        <div style={{ padding: '12px 16px', borderBottom: '1px solid ' + TH.border }}>
          <h3 style={{ fontSize: 13, fontWeight: 700, color: TH.text }}>Recent Requests (last 50)</h3>
        </div>
        {recent.length === 0 ? <div style={{ padding: 20, textAlign: 'center', color: TH.textMuted, fontSize: 12 }}>No requests yet</div> :
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr>
              <th style={thStyle}>TIME</th>
              <th style={thStyle}>USER</th>
              <th style={thStyle}>TOPIC</th>
              <th style={thStyle}>MODULE</th>
              <th style={thStyle}>MODE</th>
              <th style={thStyle}>TOKENS</th>
              <th style={thStyle}>COST</th>
            </tr></thead>
            <tbody>
              {recent.map(r => <tr key={r.id}>
                <td style={{ ...tdStyle, fontSize: 10, color: TH.textMuted, whiteSpace: 'nowrap' }}>{new Date(r.created_at).toLocaleString()}</td>
                <td style={{ ...tdStyle, fontSize: 11 }}>{r.email}</td>
                <td style={{ ...tdStyle, fontSize: 11, maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.topic}</td>
                <td style={tdStyle}><span style={{ fontSize: 9, padding: '2px 6px', borderRadius: 4, background: TH.bg, fontWeight: 600 }}>{r.module}</span></td>
                <td style={tdStyle}><span style={{ fontSize: 9, padding: '2px 6px', borderRadius: 4, background: r.mode === 'fast' ? 'rgba(34,197,94,0.08)' : 'rgba(99,102,241,0.08)', fontWeight: 600, color: r.mode === 'fast' ? TH.green : '#6366f1' }}>{r.mode}</span></td>
                <td style={{ ...tdStyle, fontSize: 11 }}>{((r.input_tokens || 0) + (r.output_tokens || 0)).toLocaleString()}</td>
                <td style={{ ...tdStyle, color: TH.accent, fontWeight: 600, fontSize: 11 }}>${(parseFloat(r.estimated_cost) || 0).toFixed(4)}</td>
              </tr>)}
            </tbody>
          </table>
        </div>}
      </div>
    </div>
  );
}

/* ═══════════ MAIN APP ═══════════ */
export default function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [view, setView] = useState('module'); /* 'module' | 'admin' */

  useEffect(() => {
    /* Get initial session */
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) checkAdmin(session.user.id);
      setLoading(false);
    });
    /* Listen for auth changes */
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) checkAdmin(session.user.id);
      else { setIsAdmin(false); setView('module'); }
    });
    return () => subscription.unsubscribe();
  }, []);

  const checkAdmin = async (userId) => {
    const { data } = await supabase.from('profiles').select('role').eq('id', userId).single();
    setIsAdmin(data?.role === 'admin');
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setSession(null); setIsAdmin(false); setView('module');
  };

  if (loading) return <div style={{ minHeight: '100vh', background: TH.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: TH.textMuted, fontSize: 13 }}>Loading...</div>;

  if (!session) return <AuthScreen />;

  /* ── Top bar (logged in) ── */
  const topBar = (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
      background: 'rgba(247,245,240,0.95)', backdropFilter: 'blur(12px)',
      borderBottom: '1px solid ' + TH.border, padding: '8px 16px',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 11, color: TH.textMuted }}>{session.user.email}</span>
        {isAdmin && <span style={{ fontSize: 8, fontWeight: 700, color: TH.accent, background: 'rgba(245,166,35,0.1)', padding: '2px 6px', borderRadius: 4, letterSpacing: 0.5 }}>ADMIN</span>}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {isAdmin && <>
          <button onClick={() => setView('module')} style={{
            padding: '5px 12px', borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', border: '1px solid ' + (view === 'module' ? TH.accent : TH.border),
            background: view === 'module' ? 'rgba(245,166,35,0.08)' : 'transparent', color: view === 'module' ? TH.accent : TH.textMuted,
          }}>Module</button>
          <button onClick={() => setView('admin')} style={{
            padding: '5px 12px', borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', border: '1px solid ' + (view === 'admin' ? TH.accent : TH.border),
            background: view === 'admin' ? 'rgba(245,166,35,0.08)' : 'transparent', color: view === 'admin' ? TH.accent : TH.textMuted,
          }}>Dashboard</button>
        </>}
        <button onClick={handleLogout} style={{
          padding: '5px 12px', borderRadius: 6, fontSize: 11, cursor: 'pointer', fontFamily: 'inherit',
          background: 'transparent', border: '1px solid ' + TH.border, color: TH.textMuted, fontWeight: 600,
        }}>Log Out</button>
      </div>
    </div>
  );

  return (
    <div>
      {topBar}
      <div style={{ paddingTop: 44 }}>
        {view === 'admin' && isAdmin ? <AdminDashboard session={session} /> : <MasteryModule session={session} />}
      </div>
    </div>
  );
}
