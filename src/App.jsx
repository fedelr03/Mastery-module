/* ═══════════════════════════════════════════════════
   App — session, account and which screen is showing.
   Each screen lives in its own file and is loaded only when opened.
   ═══════════════════════════════════════════════════ */
import { useState, useEffect, useRef, useCallback, lazy, Suspense } from 'react';
import { supabase } from './supabase';
import { usePrefs } from './lib/prefs';
import TopBar from './components/TopBar';

const LandingPage = lazy(() => import('./LandingPage'));
const MasteryModule = lazy(() => import('./module/MasteryModule'));
const ReviewMode = lazy(() => import('./views/Review'));
const KnowledgeMap = lazy(() => import('./views/KnowledgeMap'));
const ProfileScreen = lazy(() => import('./views/Profile'));
const AdminDashboard = lazy(() => import('./views/Admin'));
const ResetPasswordScreen = lazy(() => import('./views/ResetPassword'));

const COPY = {
  es: { loading: 'Cargando…', suspended: 'Cuenta suspendida',
        suspendedText: 'Tu cuenta está suspendida por ahora. Escribile al administrador para saber más.', logout: 'Salir' },
  en: { loading: 'Loading…', suspended: 'Account suspended',
        suspendedText: 'Your account is suspended for now. Contact the administrator to find out more.', logout: 'Log out' },
};

function Splash({ text }) {
  return (
    <div className="center-screen" role="status" aria-live="polite">
      <div className="splash"><span className="brand-mark" aria-hidden="true">&#x2211;</span>{text}</div>
    </div>
  );
}

export default function App() {
  const { lang, dark } = usePrefs();
  const t = COPY[lang] || COPY.en;

  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [account, setAccount] = useState(null); // { username, level, role }
  const [view, setView] = useState('study');
  const [pendingLoad, setPendingLoad] = useState(null);
  const [confirmedEmail, setConfirmedEmail] = useState(false);
  const [needsNewPassword, setNeedsNewPassword] = useState(false);
  const [dueCount, setDueCount] = useState(0);
  const loadedFor = useRef(null);

  const userId = session?.user?.id || null;
  const isAdmin = account?.role === 'admin';
  const isBlocked = account?.role === 'blocked';

  const loadDueCount = useCallback(async (uid) => {
    if (!uid) return;
    try {
      const { count, error } = await supabase
        .from('review_cards')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', uid)
        .neq('status', 'suspended')
        .lte('next_review_at', new Date().toISOString());
      if (!error) setDueCount(count || 0);
    } catch { /* table may not exist yet */ }
  }, []);

  /* Username typed at sign-up is saved once the account exists, then the profile is read. */
  const loadAccount = useCallback(async (uid) => {
    try {
      const pending = localStorage.getItem('mm_pending_username');
      if (pending) {
        const { error } = await supabase.from('profiles').update({ username: pending }).eq('id', uid);
        if (!error) localStorage.removeItem('mm_pending_username');
      }
    } catch { /* ignore */ }
    try {
      const { data } = await supabase.from('profiles').select('username, level, role').eq('id', uid).maybeSingle();
      setAccount(data || {});
    } catch (e) {
      console.error('Could not load profile:', e);
      setAccount({});
    }
  }, []);

  /* ── Session ── */
  useEffect(() => {
    const hash = window.location.hash;
    if (hash) {
      const type = new URLSearchParams(hash.replace(/^#/, '')).get('type');
      if (type === 'signup' || type === 'email') setConfirmedEmail(true);
      // "recovery" is handled by the PASSWORD_RECOVERY event below
      window.history.replaceState(null, '', window.location.pathname);
    }

    // If Supabase is unreachable (e.g. the project is paused) getSession can hang;
    // without the timeout the app would stay on the loading screen forever.
    const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error('Supabase getSession timeout')), 8000));
    Promise.race([supabase.auth.getSession(), timeout])
      .then(({ data }) => setSession(data.session))
      .catch((err) => { console.error('Could not restore session:', err); setSession(null); })
      .finally(() => setLoading(false));

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, next) => {
      if (event === 'PASSWORD_RECOVERY') { setNeedsNewPassword(true); return; }
      setSession(next);
      if (event === 'USER_UPDATED' && next) {
        // Never await Supabase inside this callback (it can deadlock the client): defer it.
        setTimeout(() => {
          supabase.from('profiles').update({ email: next.user.email }).eq('id', next.user.id).then(() => {});
        }, 0);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  /* ── Account data: once per signed-in user (not on every token refresh) ── */
  useEffect(() => {
    if (!userId) {
      loadedFor.current = null;
      setAccount(null); setDueCount(0); setView('study'); setPendingLoad(null);
      return;
    }
    if (loadedFor.current === userId) return;
    loadedFor.current = userId;
    loadAccount(userId);
    loadDueCount(userId);
  }, [userId, loadAccount, loadDueCount]);

  /* Cards become due while the tab is in the background: recount when the user comes back. */
  useEffect(() => {
    if (!userId) return;
    const onVisible = () => { if (document.visibilityState === 'visible') loadDueCount(userId); };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [userId, loadDueCount]);

  const handleLogout = async () => {
    try { await supabase.auth.signOut(); } catch (e) { console.error(e); }
    setSession(null); setNeedsNewPassword(false);
  };

  const splash = <Splash text={t.loading} />;
  if (loading) return splash;

  if (needsNewPassword) return (
    <Suspense fallback={splash}>
      <ResetPasswordScreen onDone={() => { setNeedsNewPassword(false); supabase.auth.signOut(); }} />
    </Suspense>
  );

  if (!session) return <Suspense fallback={splash}><LandingPage confirmedEmail={confirmedEmail} /></Suspense>;

  if (account === null) return splash;

  if (isBlocked) return (
    <div className="center-screen app">
      <div className="empty" style={{ maxWidth: 440 }}>
        <div className="empty-mark" aria-hidden="true">!</div>
        <h2>{t.suspended}</h2>
        <p>{t.suspendedText}</p>
        <button type="button" className="btn btn-ghost" style={{ marginTop: 20 }} onClick={handleLogout}>{t.logout}</button>
      </div>
    </div>
  );

  const backToStudy = () => { loadDueCount(userId); setView('study'); };

  return (
    <div className="app">
      <TopBar view={view} setView={setView} isAdmin={isAdmin} dueCount={dueCount}
        name={account.username} email={session.user.email} onLogout={handleLogout} />
      <main>
        <Suspense fallback={<div className="page"><div className="skeleton" style={{ height: 220 }} /></div>}>
          {view === 'admin' && isAdmin && <AdminDashboard />}
          {view === 'profile' && (
            <ProfileScreen session={session} profile={account} onSave={(u) => setAccount((p) => ({ ...p, ...u }))} />
          )}
          {view === 'map' && (
            <KnowledgeMap session={session} dueCount={dueCount}
              onOpen={(item) => { setPendingLoad(item); setView('study'); }}
              onReview={() => setView('review')} onStudy={() => setView('study')} />
          )}
          {view === 'review' && (
            <ReviewMode session={session} onDone={backToStudy} onProgress={() => loadDueCount(userId)} />
          )}
        </Suspense>
        <Suspense fallback={<div className="page"><div className="skeleton" style={{ height: 220 }} /></div>}>
          {/* The study screen stays mounted so a module being generated isn't lost when you look at another tab. */}
          <div hidden={view !== 'study'}>
            <MasteryModule session={session} level={account.level || 'intermediate'} lang={lang} dark={dark}
              pendingLoad={pendingLoad} onLoadDone={() => setPendingLoad(null)} onCardAdded={() => loadDueCount(userId)} />
          </div>
        </Suspense>
      </main>
    </div>
  );
}
