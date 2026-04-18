import { useState, useEffect } from 'react';
import LandingPage from './LandingPage';
import { supabase } from './supabase';
import MasteryModule from './MasteryModule';

/* ═══════════ THEMES ═══════════ */
const LIGHT = {
  bg: '#f7f5f0', surface: '#ffffff', border: '#e4ded4', borderLight: '#ece8e0',
  text: '#2a2a3a', textSecondary: '#5c5c6c', textMuted: '#8a8a96', textFaint: '#b0aeb8',
  accent: '#e8940a', accentLight: '#f5a623', accentBg: 'rgba(245,166,35,0.07)',
  red: '#ef4444', green: '#22c55e', purple: '#6366f1',
};

const DARK = {
  bg: '#111114', surface: '#1c1c21', border: '#2c2c38', borderLight: '#222229',
  text: '#e2e2ec', textSecondary: '#9898b0', textMuted: '#606078', textFaint: '#38384a',
  accent: '#f5a623', accentLight: '#f5a623', accentBg: 'rgba(245,166,35,0.12)',
  red: '#f87171', green: '#4ade80', purple: '#9b9ef8',
};

const getTheme = (dark) => dark ? DARK : LIGHT;

/* ═══════════ AUTH TRANSLATIONS ═══════════ */
const AUTH_T = {
  en: {
    welcomeBack: 'Welcome Back', createAccount: 'Create Account',
    loginSub: 'Log in to continue learning', signupSub: 'Sign up to start your journey',
    username: 'Username', usernamePH: 'How others will see you',
    email: 'Email', password: 'Password', confirmPW: 'Confirm Password',
    pwPH: 'Min 6 characters', confirmPH: 'Repeat your password',
    loginBtn: 'Log In', signupBtn: 'Sign Up',
    toSignup: "Don't have an account? Sign up", toLogin: 'Already have an account? Log in',
    footer: 'Learn by First Principles',
    emailExists: 'An account with this email already exists.',
    signupOk: 'Account created! Check your email to confirm, then log in.',
    pwMismatch: 'Passwords do not match.',
    emailConfirmed: '✓ Email confirmed! You can now sign in.',
    forgotPW: 'Forgot password?',
    forgotTitle: 'Reset Password',
    forgotSub: 'Enter your email and we\'ll send you a reset link',
    sendReset: 'Send Reset Link',
    resetSent: '✓ Check your email for a reset link.',
    backToLogin: '← Back to log in',
    newPWTitle: 'Set New Password',
    newPWSub: 'Choose a new password for your account',
    newPassword: 'New Password',
    newPWBtn: 'Update Password',
    pwUpdated: '✓ Password updated! Redirecting...',
  },
  es: {
    welcomeBack: 'Bienvenido de vuelta', createAccount: 'Crear cuenta',
    loginSub: 'Iniciá sesión para seguir aprendiendo', signupSub: 'Registrate y empezá a aprender',
    username: 'Nombre de usuario', usernamePH: 'Cómo te verán los demás',
    email: 'Email', password: 'Contraseña', confirmPW: 'Confirmar contraseña',
    pwPH: 'Mínimo 6 caracteres', confirmPH: 'Repetí tu contraseña',
    loginBtn: 'Iniciar sesión', signupBtn: 'Registrarse',
    toSignup: '¿No tenés cuenta? Registrate', toLogin: '¿Ya tenés cuenta? Iniciá sesión',
    footer: 'Aprendé desde los Principios Fundamentales',
    emailExists: 'Ya existe una cuenta con este email.',
    signupOk: '¡Cuenta creada! Revisá tu email para confirmar y luego iniciá sesión.',
    pwMismatch: 'Las contraseñas no coinciden.',
    emailConfirmed: '✓ ¡Email confirmado! Ya podés iniciar sesión.',
    forgotPW: '¿Olvidaste tu contraseña?',
    forgotTitle: 'Resetear contraseña',
    forgotSub: 'Ingresá tu email y te enviamos un enlace para resetearla',
    sendReset: 'Enviar enlace',
    resetSent: '✓ Revisá tu email para el enlace de reset.',
    backToLogin: '← Volver al inicio de sesión',
    newPWTitle: 'Nueva contraseña',
    newPWSub: 'Elegí una nueva contraseña para tu cuenta',
    newPassword: 'Nueva contraseña',
    newPWBtn: 'Actualizar contraseña',
    pwUpdated: '✓ ¡Contraseña actualizada! Redirigiendo...',
  },
};

/* ═══════════ PROFILE TRANSLATIONS ═══════════ */
const PROFILE_T = {
  en: {
    title: 'My Profile', sub: 'Customize your experience',
    email: 'EMAIL', username: 'USERNAME',
    usernameSub: '— replaces your email in the top bar',
    usernamePH: 'e.g. Federico, Profe, fede.lr',
    level: 'KNOWLEDGE LEVEL', levelSub: '— adjusts how the system explains things to you',
    beginner: 'Beginner', beginnerDesc: 'Simple language, more examples',
    intermediate: 'Intermediate', intermediateDesc: 'Balanced depth & clarity',
    advanced: 'Advanced', advancedDesc: 'Technical, skips the basics',
    language: 'LANGUAGE', languageSub: '— applies to the app and modules',
    appearance: 'APPEARANCE',
    darkMode: 'Night Mode', darkModeDesc: 'Easier on the eyes in low light',
    save: 'Save Changes', saving: 'Saving...', saved: '✓ Saved!',
    changeEmail: 'Change', cancelEmail: 'Cancel',
    newEmail: 'NEW EMAIL', newEmailPH: 'your@newemail.com',
    updateEmail: 'Send Confirmation', emailChangeSent: '✓ Confirmation sent to your new address.',
  },
  es: {
    title: 'Mi Perfil', sub: 'Personalizá tu experiencia',
    email: 'EMAIL', username: 'NOMBRE DE USUARIO',
    usernameSub: '— reemplaza tu email en la barra superior',
    usernamePH: 'ej. Federico, Profe, fede.lr',
    level: 'NIVEL DE CONOCIMIENTO', levelSub: '— ajusta cómo el sistema te explica las cosas',
    beginner: 'Principiante', beginnerDesc: 'Lenguaje simple, más ejemplos',
    intermediate: 'Intermedio', intermediateDesc: 'Profundidad y claridad equilibradas',
    advanced: 'Avanzado', advancedDesc: 'Técnico, sin básicos',
    language: 'IDIOMA', languageSub: '— se aplica a la app y los módulos',
    appearance: 'APARIENCIA',
    darkMode: 'Modo Noche', darkModeDesc: 'Más cómodo con poca luz',
    save: 'Guardar Cambios', saving: 'Guardando...', saved: '✓ ¡Guardado!',
    changeEmail: 'Cambiar', cancelEmail: 'Cancelar',
    newEmail: 'NUEVO EMAIL', newEmailPH: 'tu@nuevoemail.com',
    updateEmail: 'Enviar confirmación', emailChangeSent: '✓ Confirmación enviada a tu nuevo email.',
  },
};

/* ═══════════ TOP BAR TRANSLATIONS ═══════════ */
const TOP_T = {
  en: { module: 'Module', profile: 'Profile', dashboard: 'Dashboard', logout: 'Log Out', history: 'History' },
  es: { module: 'Módulo', profile: 'Perfil', dashboard: 'Panel', logout: 'Salir', history: 'Historial' },
};

/* ═══════════ AUTH SCREEN ═══════════ */
function AuthScreen({ confirmedEmail }) {
  const [lang, setLang] = useState(() => localStorage.getItem('mm_lang') || 'es');
  const [dark] = useState(() => localStorage.getItem('mm_dark') === 'true');
  const TH = getTheme(dark);
  const changeLang = (l) => { setLang(l); localStorage.setItem('mm_lang', l); };
  const [isLogin, setIsLogin] = useState(true);
  const [isForgot, setIsForgot] = useState(false);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPW, setConfirmPW] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (confirmedEmail) setSuccess(AUTH_T[lang].emailConfirmed);
  }, [lang, confirmedEmail]);

  const t = AUTH_T[lang];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError(''); setSuccess('');
    try {
      if (isForgot) {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: window.location.origin,
        });
        if (error) throw error;
        setSuccess(t.resetSent);
      } else if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        if (password !== confirmPW) { setError(t.pwMismatch); setLoading(false); return; }
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        if (data?.user?.identities?.length === 0) {
          setError(t.emailExists);
        } else {
          if (username.trim()) localStorage.setItem('mm_pending_username', username.trim());
          setSuccess(t.signupOk);
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
    boxSizing: 'border-box',
  };

  const title = isForgot ? t.forgotTitle : isLogin ? t.welcomeBack : t.createAccount;
  const subtitle = isForgot ? t.forgotSub : isLogin ? t.loginSub : t.signupSub;

  return (
    <div style={{ minHeight: '100vh', background: TH.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ width: '100%', maxWidth: 380, animation: 'fadeUp 0.4s ease' }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: TH.accentBg, border: '1px solid rgba(232,148,10,0.25)', borderRadius: 10, padding: '3px 10px', marginBottom: 12, fontSize: 9, color: TH.accent, fontWeight: 700, letterSpacing: 1.5 }}>&#x2211; MASTERY MODULE</div>
          <h1 style={{ fontFamily: "'Bricolage Grotesque',sans-serif", fontSize: 32, fontWeight: 800, color: TH.text, letterSpacing: '-0.02em' }}>
            {title}
          </h1>
          <p style={{ color: TH.textMuted, fontSize: 13, marginTop: 6 }}>
            {subtitle}
          </p>
        </div>

        <div style={{ background: TH.surface, borderRadius: 16, border: '1px solid ' + TH.border, padding: 24, boxShadow: dark ? '0 4px 24px rgba(0,0,0,0.3)' : '0 4px 24px rgba(0,0,0,0.04)' }}>
          {/* ── Language toggle ── */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 18 }}>
            {['es', 'en'].map(l => (
              <button key={l} onClick={() => changeLang(l)} style={{
                padding: '4px 12px', fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
                border: '1px solid ' + (lang === l ? TH.accent : TH.border),
                background: lang === l ? TH.accentBg : 'transparent',
                color: lang === l ? TH.accent : TH.textMuted,
                borderRadius: l === 'es' ? '6px 0 0 6px' : '0 6px 6px 0',
              }}>
                {l.toUpperCase()}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit}>
            {/* ── Sign up only: username ── */}
            {!isLogin && !isForgot && (
              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 11, fontWeight: 600, color: TH.textSecondary, display: 'block', marginBottom: 5 }}>{t.username}</label>
                <input type="text" value={username} onChange={e => setUsername(e.target.value)}
                  placeholder={t.usernamePH} style={inputStyle}
                  onFocus={e => e.target.style.borderColor = TH.accent}
                  onBlur={e => e.target.style.borderColor = TH.border} />
              </div>
            )}

            {/* ── Email (always shown) ── */}
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 11, fontWeight: 600, color: TH.textSecondary, display: 'block', marginBottom: 5 }}>{t.email}</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                placeholder="you@email.com" style={inputStyle}
                onFocus={e => e.target.style.borderColor = TH.accent}
                onBlur={e => e.target.style.borderColor = TH.border} />
            </div>

            {/* ── Password (login / signup only) ── */}
            {!isForgot && (
              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 11, fontWeight: 600, color: TH.textSecondary, display: 'block', marginBottom: 5 }}>{t.password}</label>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} required
                  placeholder={isLogin ? '••••••••' : t.pwPH} minLength={6} style={inputStyle}
                  onFocus={e => e.target.style.borderColor = TH.accent}
                  onBlur={e => e.target.style.borderColor = TH.border} />
              </div>
            )}

            {/* ── Confirm password (signup only) ── */}
            {!isLogin && !isForgot && (
              <div style={{ marginBottom: 20 }}>
                <label style={{ fontSize: 11, fontWeight: 600, color: TH.textSecondary, display: 'block', marginBottom: 5 }}>{t.confirmPW}</label>
                <input type="password" value={confirmPW} onChange={e => setConfirmPW(e.target.value)} required
                  placeholder={t.confirmPH} minLength={6} style={inputStyle}
                  onFocus={e => e.target.style.borderColor = TH.accent}
                  onBlur={e => e.target.style.borderColor = TH.border} />
              </div>
            )}

            {!isLogin && !isForgot && <div style={{ marginBottom: 6 }} />}

            {error && <div style={{ padding: '8px 12px', background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.12)', borderRadius: 8, color: TH.red, fontSize: 12, marginBottom: 14 }}>{error}</div>}
            {success && <div style={{ padding: '8px 12px', background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.12)', borderRadius: 8, color: TH.green, fontSize: 12, marginBottom: 14 }}>{success}</div>}

            <button type="submit" disabled={loading} style={{
              width: '100%', padding: '13px', border: 'none', borderRadius: 10,
              background: loading ? TH.border : 'linear-gradient(135deg, ' + TH.accentLight + ', ' + TH.accent + ')',
              color: '#fff', fontWeight: 700, fontSize: 14, cursor: loading ? 'wait' : 'pointer',
              fontFamily: 'inherit', boxShadow: '0 2px 12px rgba(232,148,10,0.2)',
            }}>
              {loading ? '...' : isForgot ? t.sendReset : isLogin ? t.loginBtn : t.signupBtn}
            </button>
          </form>

          {/* ── Bottom links ── */}
          <div style={{ textAlign: 'center', marginTop: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {isForgot ? (
              <button onClick={() => { setIsForgot(false); setIsLogin(true); setError(''); setSuccess(''); }} style={{
                background: 'none', border: 'none', color: TH.accent, fontSize: 12,
                cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600,
              }}>
                {t.backToLogin}
              </button>
            ) : (
              <>
                {isLogin && (
                  <button onClick={() => { setIsForgot(true); setError(''); setSuccess(''); }} style={{
                    background: 'none', border: 'none', color: TH.textMuted, fontSize: 11,
                    cursor: 'pointer', fontFamily: 'inherit', fontWeight: 500,
                  }}>
                    {t.forgotPW}
                  </button>
                )}
                <button onClick={() => { setIsLogin(!isLogin); setError(''); setSuccess(''); setUsername(''); setConfirmPW(''); }} style={{
                  background: 'none', border: 'none', color: TH.accent, fontSize: 12,
                  cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600,
                }}>
                  {isLogin ? t.toSignup : t.toLogin}
                </button>
              </>
            )}
          </div>
        </div>
        <p style={{ textAlign: 'center', color: TH.textMuted, fontSize: 10, marginTop: 16 }}>{t.footer}</p>
      </div>
    </div>
  );
}

/* ═══════════ RESET PASSWORD SCREEN ═══════════ */
function ResetPasswordScreen({ onDone }) {
  const [lang] = useState(() => localStorage.getItem('mm_lang') || 'es');
  const [dark] = useState(() => localStorage.getItem('mm_dark') === 'true');
  const TH = getTheme(dark);
  const t = AUTH_T[lang];
  const [password, setPassword] = useState('');
  const [confirmPW, setConfirmPW] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const inputStyle = {
    width: '100%', padding: '12px 14px', border: '1px solid ' + TH.border, borderRadius: 10,
    fontSize: 14, fontFamily: 'inherit', background: TH.bg, color: TH.text, outline: 'none',
    boxSizing: 'border-box',
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPW) { setError(t.pwMismatch); return; }
    setLoading(true); setError('');
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setError(error.message);
    } else {
      setSuccess(t.pwUpdated);
      setTimeout(() => onDone(), 2000);
    }
    setLoading(false);
  };

  return (
    <div style={{ minHeight: '100vh', background: TH.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ width: '100%', maxWidth: 380, animation: 'fadeUp 0.4s ease' }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: TH.accentBg, border: '1px solid rgba(232,148,10,0.25)', borderRadius: 10, padding: '3px 10px', marginBottom: 12, fontSize: 9, color: TH.accent, fontWeight: 700, letterSpacing: 1.5 }}>&#x2211; MASTERY MODULE</div>
          <h1 style={{ fontFamily: "'Bricolage Grotesque',sans-serif", fontSize: 32, fontWeight: 800, color: TH.text, letterSpacing: '-0.02em' }}>{t.newPWTitle}</h1>
          <p style={{ color: TH.textMuted, fontSize: 13, marginTop: 6 }}>{t.newPWSub}</p>
        </div>
        <div style={{ background: TH.surface, borderRadius: 16, border: '1px solid ' + TH.border, padding: 24, boxShadow: dark ? '0 4px 24px rgba(0,0,0,0.3)' : '0 4px 24px rgba(0,0,0,0.04)' }}>
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 11, fontWeight: 600, color: TH.textSecondary, display: 'block', marginBottom: 5 }}>{t.newPassword}</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} required
                placeholder={t.pwPH} minLength={6} style={inputStyle}
                onFocus={e => e.target.style.borderColor = TH.accent}
                onBlur={e => e.target.style.borderColor = TH.border} />
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 11, fontWeight: 600, color: TH.textSecondary, display: 'block', marginBottom: 5 }}>{t.confirmPW}</label>
              <input type="password" value={confirmPW} onChange={e => setConfirmPW(e.target.value)} required
                placeholder={t.confirmPH} minLength={6} style={inputStyle}
                onFocus={e => e.target.style.borderColor = TH.accent}
                onBlur={e => e.target.style.borderColor = TH.border} />
            </div>
            {error && <div style={{ padding: '8px 12px', background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.12)', borderRadius: 8, color: TH.red, fontSize: 12, marginBottom: 14 }}>{error}</div>}
            {success && <div style={{ padding: '8px 12px', background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.12)', borderRadius: 8, color: TH.green, fontSize: 12, marginBottom: 14 }}>{success}</div>}
            <button type="submit" disabled={loading || !!success} style={{
              width: '100%', padding: '13px', border: 'none', borderRadius: 10,
              background: success ? TH.green : loading ? TH.border : 'linear-gradient(135deg, ' + TH.accentLight + ', ' + TH.accent + ')',
              color: '#fff', fontWeight: 700, fontSize: 14, cursor: loading ? 'wait' : 'pointer',
              fontFamily: 'inherit', boxShadow: '0 2px 12px rgba(232,148,10,0.2)',
            }}>
              {loading ? '...' : t.newPWBtn}
            </button>
          </form>
        </div>
        <p style={{ textAlign: 'center', color: TH.textMuted, fontSize: 10, marginTop: 16 }}>{AUTH_T[lang].footer}</p>
      </div>
    </div>
  );
}

/* ═══════════ PROFILE SCREEN ═══════════ */
function ProfileScreen({ session, profile, onSave, lang, setLang, dark, setDark }) {
  const TH = getTheme(dark);
  const t = PROFILE_T[lang] || PROFILE_T.en;

  const [username, setUsername] = useState(profile?.username || '');
  const [level, setLevel] = useState(profile?.level || 'intermediate');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showEmailChange, setShowEmailChange] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [emailChanging, setEmailChanging] = useState(false);
  const [emailMsg, setEmailMsg] = useState('');

  useEffect(() => {
    setUsername(profile?.username || '');
    setLevel(profile?.level || 'intermediate');
  }, [profile?.username, profile?.level]);

  const changeLang = (l) => { setLang(l); localStorage.setItem('mm_lang', l); };

  const handleEmailChange = async () => {
    if (!newEmail.trim()) return;
    setEmailChanging(true); setEmailMsg('');
    const { error } = await supabase.auth.updateUser({ email: newEmail.trim() });
    if (error) setEmailMsg(error.message);
    else { setEmailMsg(t.emailChangeSent); setNewEmail(''); }
    setEmailChanging(false);
  };

  const toggleDark = () => {
    const next = !dark;
    setDark(next);
    localStorage.setItem('mm_dark', String(next));
  };

  const handleSave = async () => {
    setSaving(true);
    const { error } = await supabase
      .from('profiles')
      .update({ username: username.trim(), level })
      .eq('id', session.user.id);
    if (!error) {
      onSave({ username: username.trim(), level });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    }
    setSaving(false);
  };

  const inputStyle = {
    width: '100%', padding: '12px 14px', border: '1px solid ' + TH.border, borderRadius: 10,
    fontSize: 14, fontFamily: 'inherit', background: TH.bg, color: TH.text, outline: 'none',
    boxSizing: 'border-box',
  };

  const sectionLabel = (main, sub) => (
    <label style={{ fontSize: 11, fontWeight: 600, color: TH.textSecondary, display: 'block', marginBottom: 5 }}>
      {main}{sub && <span style={{ color: TH.textFaint, fontWeight: 400 }}> {sub}</span>}
    </label>
  );

  return (
    <div style={{ maxWidth: 520, margin: '0 auto', padding: '32px 20px 60px', animation: 'fadeUp 0.3s ease' }}>
      <div style={{ marginBottom: 28 }}>
        <h2 style={{ fontFamily: "'Bricolage Grotesque',sans-serif", fontSize: 24, fontWeight: 800, color: TH.text, marginBottom: 4 }}>{t.title}</h2>
        <p style={{ color: TH.textMuted, fontSize: 12 }}>{t.sub}</p>
      </div>

      <div style={{ background: TH.surface, borderRadius: 16, border: '1px solid ' + TH.border, padding: 24, boxShadow: dark ? '0 4px 24px rgba(0,0,0,0.3)' : '0 4px 24px rgba(0,0,0,0.04)' }}>

        {/* Email — with inline change */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 }}>
            {sectionLabel(t.email)}
            <button onClick={() => { setShowEmailChange(v => !v); setEmailMsg(''); setNewEmail(''); }} style={{
              background: 'none', border: 'none', color: TH.accent, fontSize: 11, fontWeight: 600,
              cursor: 'pointer', fontFamily: 'inherit', padding: 0, marginBottom: 5,
            }}>
              {showEmailChange ? t.cancelEmail : t.changeEmail}
            </button>
          </div>
          <div style={{
            padding: '12px 14px', border: '1px solid ' + TH.borderLight, borderRadius: 10,
            fontSize: 14, background: TH.bg, color: TH.textMuted,
          }}>
            {session.user.email}
          </div>
          {showEmailChange && (
            <div style={{ marginTop: 10 }}>
              {sectionLabel(t.newEmail)}
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)}
                  placeholder={t.newEmailPH}
                  style={{ ...inputStyle, flex: 1 }}
                  onFocus={e => e.target.style.borderColor = TH.accent}
                  onBlur={e => e.target.style.borderColor = TH.border}
                />
                <button onClick={handleEmailChange} disabled={emailChanging || !newEmail.trim()} style={{
                  padding: '0 16px', borderRadius: 10, border: 'none', cursor: emailChanging ? 'wait' : 'pointer',
                  background: 'linear-gradient(135deg, ' + TH.accentLight + ', ' + TH.accent + ')',
                  color: '#fff', fontWeight: 700, fontSize: 12, fontFamily: 'inherit', whiteSpace: 'nowrap',
                }}>
                  {emailChanging ? '...' : t.updateEmail}
                </button>
              </div>
              {emailMsg && (
                <div style={{
                  marginTop: 8, padding: '7px 12px', borderRadius: 8, fontSize: 12,
                  background: emailMsg.startsWith('✓') ? 'rgba(34,197,94,0.06)' : 'rgba(239,68,68,0.06)',
                  border: '1px solid ' + (emailMsg.startsWith('✓') ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)'),
                  color: emailMsg.startsWith('✓') ? TH.green : TH.red,
                }}>
                  {emailMsg}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Username */}
        <div style={{ marginBottom: 20 }}>
          {sectionLabel(t.username, t.usernameSub)}
          <input type="text" value={username} onChange={e => setUsername(e.target.value)}
            placeholder={t.usernamePH}
            style={inputStyle}
            onFocus={e => e.target.style.borderColor = TH.accent}
            onBlur={e => e.target.style.borderColor = TH.border} />
        </div>

        {/* Knowledge Level */}
        <div style={{ marginBottom: 24 }}>
          {sectionLabel(t.level, t.levelSub)}
          <div style={{ display: 'flex', gap: 0, borderRadius: 10, overflow: 'hidden', border: '1px solid ' + TH.border }}>
            {[
              { value: 'beginner', emoji: '🌱', label: t.beginner, desc: t.beginnerDesc },
              { value: 'intermediate', emoji: '📖', label: t.intermediate, desc: t.intermediateDesc },
              { value: 'advanced', emoji: '🔬', label: t.advanced, desc: t.advancedDesc },
            ].map((opt, i) => (
              <button key={opt.value} onClick={() => setLevel(opt.value)} style={{
                flex: 1, padding: '14px 8px', border: 'none', cursor: 'pointer', fontFamily: 'inherit',
                borderLeft: i > 0 ? '1px solid ' + (level === opt.value ? TH.accent : TH.border) : 'none',
                background: level === opt.value ? TH.accentBg : TH.surface,
                transition: 'background 0.15s',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
              }}>
                <span style={{ fontSize: 20 }}>{opt.emoji}</span>
                <span style={{ fontSize: 11, fontWeight: 700, color: level === opt.value ? TH.accent : TH.text }}>{opt.label}</span>
                <span style={{ fontSize: 9, color: TH.textMuted, lineHeight: 1.3, textAlign: 'center' }}>{opt.desc}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Divider */}
        <div style={{ borderTop: '1px solid ' + TH.borderLight, marginBottom: 24 }} />

        {/* Language */}
        <div style={{ marginBottom: 24 }}>
          {sectionLabel(t.language, t.languageSub)}
          <div style={{ display: 'flex', borderRadius: 10, overflow: 'hidden', border: '1px solid ' + TH.border }}>
            {[
              { code: 'es', flagSrc: 'https://flagcdn.com/32x24/ar.png', name: 'Español' },
              { code: 'en', flagSrc: 'https://flagcdn.com/32x24/us.png', name: 'English' },
            ].map((l, i) => (
              <button key={l.code} onClick={() => changeLang(l.code)} style={{
                flex: 1, padding: '12px 8px', border: 'none', cursor: 'pointer', fontFamily: 'inherit',
                borderLeft: i > 0 ? '1px solid ' + (lang === l.code ? TH.accent : TH.border) : 'none',
                background: lang === l.code ? TH.accentBg : TH.surface,
                transition: 'background 0.15s',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
              }}>
                <img src={l.flagSrc} alt={l.name} style={{ width: 32, height: 24, borderRadius: 3, objectFit: 'cover', boxShadow: '0 1px 3px rgba(0,0,0,0.15)' }} />
                <span style={{ fontSize: 11, fontWeight: 700, color: lang === l.code ? TH.accent : TH.text }}>{l.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Divider */}
        <div style={{ borderTop: '1px solid ' + TH.borderLight, marginBottom: 24 }} />

        {/* Appearance / Night Mode */}
        <div style={{ marginBottom: 28 }}>
          {sectionLabel(t.appearance)}
          <div
            onClick={toggleDark}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '14px 16px', borderRadius: 10, border: '1px solid ' + (dark ? TH.accent : TH.border),
              background: dark ? TH.accentBg : TH.bg, cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 20 }}>{dark ? '🌙' : '☀️'}</span>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: dark ? TH.accent : TH.text }}>{t.darkMode}</div>
                <div style={{ fontSize: 10, color: TH.textMuted, marginTop: 1 }}>{t.darkModeDesc}</div>
              </div>
            </div>
            {/* Toggle pill */}
            <div style={{
              width: 42, height: 24, borderRadius: 12, position: 'relative',
              background: dark ? TH.accent : TH.border,
              transition: 'background 0.25s', flexShrink: 0,
            }}>
              <div style={{
                position: 'absolute', top: 3, left: dark ? 21 : 3,
                width: 18, height: 18, borderRadius: '50%',
                background: '#fff', transition: 'left 0.25s',
                boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
              }} />
            </div>
          </div>
        </div>

        <button onClick={handleSave} disabled={saving} style={{
          width: '100%', padding: '13px', border: 'none', borderRadius: 10,
          background: saved ? TH.green : saving ? TH.border : 'linear-gradient(135deg, ' + TH.accentLight + ', ' + TH.accent + ')',
          color: '#fff', fontWeight: 700, fontSize: 14, cursor: saving ? 'wait' : 'pointer',
          fontFamily: 'inherit', boxShadow: '0 2px 12px rgba(232,148,10,0.2)', transition: 'background 0.3s',
        }}>
          {saved ? t.saved : saving ? t.saving : t.save}
        </button>
      </div>
    </div>
  );
}

/* ═══════════ ADMIN DASHBOARD ═══════════ */
function AdminDashboard({ dark }) {
  const TH = getTheme(dark);
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
  const td = { padding: '8px 10px', fontSize: 11.5, color: TH.text, borderBottom: '1px solid ' + (dark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)') };
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
          <thead><tr><th style={th}>EMAIL</th><th style={th}>USERNAME</th><th style={th}>ROLE</th><th style={th}>SIGNED UP</th><th style={th}>REQUESTS</th><th style={th}>COST</th><th style={th}>ACTION</th></tr></thead>
          <tbody>{profiles.map(p => {
            const usage = users.find(u => u.email === p.email);
            return <tr key={p.id}>
              <td style={td}><span style={{ fontWeight: 600 }}>{p.email}</span></td>
              <td style={{ ...td, color: p.username ? TH.text : TH.textFaint, fontStyle: p.username ? 'normal' : 'italic' }}>{p.username || '—'}</td>
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

      {tab === 'requests' && (() => {
        // Group rows by request_group_id; ungrouped rows each become their own group
        const groups = [];
        const seen = {};
        recent.forEach(r => {
          const key = r.request_group_id || r.id;
          if (!seen[key]) {
            seen[key] = { rows: [], totalCost: 0, totalTokens: 0 };
            groups.push(seen[key]);
          }
          seen[key].rows.push(r);
          seen[key].totalCost += parseFloat(r.estimated_cost) || 0;
          seen[key].totalTokens += (r.input_tokens || 0) + (r.output_tokens || 0);
        });
        return (
          <div style={{ background: TH.surface, borderRadius: 12, border: '1px solid ' + TH.border, overflow: 'hidden' }}>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid ' + TH.border }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: TH.text }}>Recent Requests ({groups.length} total)</span>
              <span style={{ fontSize: 10, color: TH.textMuted, marginLeft: 8 }}>({recent.length} API calls)</span>
            </div>
            {groups.length === 0 ? <div style={{ padding: 20, textAlign: 'center', color: TH.textMuted, fontSize: 12 }}>No requests yet</div> :
            <div style={{ overflowX: 'auto' }}><table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr>
                <th style={th}>TIME</th><th style={th}>USER</th><th style={th}>TOPIC</th>
                <th style={th}>MODULE</th><th style={th}>CALLS</th><th style={th}>TOKENS</th>
                <th style={th}>TOTAL COST</th>
              </tr></thead>
              <tbody>{groups.map((g, i) => {
                const first = g.rows[0];
                const modules = [...new Set(g.rows.map(r => r.module).filter(Boolean))].join(', ');
                return (
                  <tr key={i}>
                    <td style={{ ...td, fontSize: 10, color: TH.textMuted, whiteSpace: 'nowrap' }}>{new Date(first.created_at).toLocaleString()}</td>
                    <td style={{ ...td, fontSize: 11 }}>{first.email}</td>
                    <td style={{ ...td, fontSize: 11, maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{first.topic}</td>
                    <td style={td}><span style={{ fontSize: 9, padding: '2px 6px', borderRadius: 4, background: TH.bg, fontWeight: 600 }}>{modules}</span></td>
                    <td style={{ ...td, fontSize: 11, textAlign: 'center' }}>
                      <span style={{ fontSize: 9, padding: '2px 6px', borderRadius: 4, background: 'rgba(99,102,241,0.08)', color: TH.purple, fontWeight: 700 }}>{g.rows.length}</span>
                    </td>
                    <td style={{ ...td, fontSize: 11 }}>{g.totalTokens.toLocaleString()}</td>
                    <td style={{ ...td, color: TH.accent, fontWeight: 800, fontSize: 12 }}>${g.totalCost.toFixed(5)}</td>
                  </tr>
                );
              })}</tbody>
            </table></div>}
          </div>
        );
      })()}
    </div>
  );
}


/* ═══════════ STUDY HISTORY ═══════════ */
function StudyHistory({ dark, lang, session, onLoad }) {
  const TH = getTheme(dark);
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);

  const MOD_COLORS = {
    math:    { color: '#e8940a', bg: 'rgba(232,148,10,0.08)',    label: 'Math' },
    stats:   { color: '#6366f1', bg: 'rgba(99,102,241,0.08)',    label: 'Stats' },
    econ:    { color: '#10b981', bg: 'rgba(16,185,129,0.08)',    label: 'Econ' },
    finance: { color: '#06b6d4', bg: 'rgba(6,182,212,0.08)',     label: 'Finance' },
    general: { color: '#8a8a96', bg: 'rgba(138,138,150,0.08)',   label: 'General' },
  };

  const t = lang === 'es' ? {
    title: 'Historial de Estudio', sub: 'Tus temas estudiados anteriormente',
    empty: 'Todavía no estudiaste ningún tema.', noHistory: 'Cuando estudies un tema, aparecerá acá.',
    open: 'Abrir', refresh: 'Actualizar', loading: 'Cargando historial...',
    today: 'Hoy', yesterday: 'Ayer', thisWeek: 'Esta semana', older: 'Anterior',
  } : {
    title: 'Study History', sub: 'Your past study sessions',
    empty: 'No topics studied yet.', noHistory: 'Once you study a topic, it will appear here.',
    open: 'Open', refresh: 'Refresh', loading: 'Loading history...',
    today: 'Today', yesterday: 'Yesterday', thisWeek: 'This week', older: 'Older',
  };

  useEffect(() => { loadHistory(); }, []);

  const loadHistory = async () => {
    setLoading(true);
    try {
      const { data } = await supabase
        .from('study_history')
        .select('id, topic, module, mode, lang, level, created_at, content')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false })
        .limit(50);
      setEntries(data || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const deleteEntry = async (id) => {
    await supabase.from('study_history').delete().eq('id', id);
    setEntries(e => e.filter(x => x.id !== id));
  };

  const now = new Date();
  const todayStr = now.toDateString();
  const yesterdayStr = new Date(now - 86400000).toDateString();
  const weekAgo = new Date(now - 7 * 86400000);
  const grouped = { today: [], yesterday: [], thisWeek: [], older: [] };
  entries.forEach(e => {
    const d = new Date(e.created_at);
    if (d.toDateString() === todayStr) grouped.today.push(e);
    else if (d.toDateString() === yesterdayStr) grouped.yesterday.push(e);
    else if (d > weekAgo) grouped.thisWeek.push(e);
    else grouped.older.push(e);
  });

  const renderGroup = (label, items) => {
    if (!items.length) return null;
    return (
      <div key={label} style={{ marginBottom: 28 }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: TH.textMuted, letterSpacing: 1.2, marginBottom: 10, textTransform: 'uppercase' }}>{label}</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {items.map(entry => {
            const mc = MOD_COLORS[entry.module] || MOD_COLORS.general;
            const modeColor = entry.mode === 'think' ? TH.purple : entry.mode === 'lite' ? TH.cyan : TH.green;
            const modeBg = entry.mode === 'think' ? 'rgba(99,102,241,0.08)' : entry.mode === 'lite' ? 'rgba(6,182,212,0.08)' : 'rgba(34,197,94,0.08)';
            return (
              <div key={entry.id} style={{ background: TH.surface, border: '1px solid ' + TH.border, borderRadius: 12, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: mc.bg, border: '1px solid ' + mc.color + '40', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span style={{ fontSize: 8, fontWeight: 800, color: mc.color, letterSpacing: 0.5 }}>{mc.label.toUpperCase()}</span>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: TH.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{entry.topic}</div>
                  <div style={{ display: 'flex', gap: 6, marginTop: 4, alignItems: 'center', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 9, padding: '1px 7px', borderRadius: 4, background: modeBg, color: modeColor, fontWeight: 700 }}>{(entry.mode || 'fast').toUpperCase()}</span>
                    <span style={{ fontSize: 9, padding: '1px 7px', borderRadius: 4, background: TH.bg, color: TH.textMuted, fontWeight: 600 }}>{(entry.level || 'intermediate').toUpperCase()}</span>
                    <span style={{ fontSize: 9, color: TH.textMuted }}>{new Date(entry.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    <span style={{ fontSize: 10 }}>{entry.lang === 'es' ? '🇦🇷' : '🇺🇸'}</span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                  <button onClick={() => onLoad({ content: entry.content, topic: entry.topic, mod: entry.module, mode: entry.mode })}
                    style={{ fontSize: 11, fontWeight: 700, padding: '7px 16px', borderRadius: 8, cursor: 'pointer', fontFamily: 'inherit', background: TH.accentBg, border: '1px solid ' + TH.accent + '50', color: TH.accent }}>{t.open}</button>
                  <button onClick={() => deleteEntry(entry.id)}
                    style={{ fontSize: 12, padding: '7px 10px', borderRadius: 8, cursor: 'pointer', fontFamily: 'inherit', background: 'transparent', border: '1px solid ' + TH.border, color: TH.textMuted, lineHeight: 1 }}>✕</button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  if (loading) return <div style={{ padding: 60, textAlign: 'center', color: TH.textMuted, fontSize: 13 }}>{t.loading}</div>;

  return (
    <div style={{ maxWidth: 960, margin: '0 auto', padding: '24px 20px 60px', animation: 'fadeUp 0.3s ease' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 10 }}>
        <div>
          <h2 style={{ fontFamily: "'Bricolage Grotesque',sans-serif", fontSize: 24, fontWeight: 800, color: TH.text }}>{t.title}</h2>
          <p style={{ color: TH.textMuted, fontSize: 11, marginTop: 2 }}>{t.sub} — {entries.length} {lang === 'es' ? 'sesiones' : 'sessions'}</p>
        </div>
        <button onClick={loadHistory} style={{ background: TH.surface, border: '1px solid ' + TH.border, borderRadius: 8, padding: '7px 16px', fontSize: 11, color: TH.textSecondary, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600 }}>{t.refresh}</button>
      </div>
      {entries.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
          <div style={{ fontSize: 36, marginBottom: 14 }}>📚</div>
          <div style={{ fontSize: 14, fontWeight: 600, color: TH.textSecondary, marginBottom: 6 }}>{t.empty}</div>
          <div style={{ fontSize: 12, color: TH.textMuted }}>{t.noHistory}</div>
        </div>
      ) : (
        <>
          {renderGroup(t.today, grouped.today)}
          {renderGroup(t.yesterday, grouped.yesterday)}
          {renderGroup(t.thisWeek, grouped.thisWeek)}
          {renderGroup(t.older, grouped.older)}
        </>
      )}
    </div>
  );
}

/* ═══════════ TOP BAR ═══════════ */
function TopBar({ session, profile, isAdmin, view, setView, onLogout, dark, lang }) {
  const TH = getTheme(dark);
  const t = TOP_T[lang] || TOP_T.en;
  const displayName = profile?.username || session.user.email;
  const btnStyle = (active) => ({
    padding: '5px 14px', borderRadius: 7, fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
    border: '1px solid ' + (active ? TH.accent : TH.border),
    background: active ? TH.accentBg : 'transparent',
    color: active ? TH.accent : TH.textMuted,
  });
  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1000, minHeight: 48,
      background: dark ? '#111114' : '#f7f5f0',
      borderBottom: '1px solid ' + TH.border,
    }}>
      <style>{`
        .mm-topbar-inner { padding: 8px 20px; }
        .mm-topbar-name  { max-width: 200px; }
        .mm-topbar-btn   { padding: 5px 14px; font-size: 11px; }
        .mm-topbar-logout{ padding: 5px 14px; font-size: 11px; }
        @media (max-width: 480px) {
          .mm-topbar-inner  { padding: 8px 12px; gap: 4px !important; }
          .mm-topbar-name   { max-width: 80px; font-size: 10px; }
          .mm-topbar-btn    { padding: 5px 9px !important; font-size: 10px !important; }
          .mm-topbar-logout { padding: 5px 9px !important; font-size: 10px !important; margin-left: 2px !important; }
        }
      `}</style>
      <div className="mm-topbar-inner" style={{
        maxWidth: 960, margin: '0 auto',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'nowrap', gap: 6,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0, flexShrink: 1 }}>
          <span style={{ fontSize: 14, fontWeight: 800, color: TH.text, fontFamily: "'Bricolage Grotesque',sans-serif", flexShrink: 0 }}>&#x2211;</span>
          <span className="mm-topbar-name" style={{ fontSize: 11, color: TH.textMuted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{displayName}</span>
          {isAdmin && <span style={{ fontSize: 8, fontWeight: 700, color: TH.accent, background: TH.accentBg, padding: '2px 6px', borderRadius: 4, letterSpacing: 0.5, flexShrink: 0 }}>ADMIN</span>}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0 }}>
          <button onClick={() => setView('module')} className="mm-topbar-btn" style={btnStyle(view === 'module')}>{t.module}</button>
          <button onClick={() => setView('history')} className="mm-topbar-btn" style={btnStyle(view === 'history')}>{t.history}</button>
          <button onClick={() => setView('profile')} className="mm-topbar-btn" style={btnStyle(view === 'profile')}>{t.profile}</button>
          {isAdmin && <button onClick={() => setView('admin')} className="mm-topbar-btn" style={btnStyle(view === 'admin')}>{t.dashboard}</button>}
          <button onClick={onLogout} className="mm-topbar-logout" style={{
            padding: '5px 14px', borderRadius: 7, fontSize: 11, cursor: 'pointer', fontFamily: 'inherit',
            background: 'transparent', border: '1px solid ' + TH.border, color: TH.textMuted, fontWeight: 600, marginLeft: 4,
          }}>{t.logout}</button>
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
  const [pendingLoad, setPendingLoad] = useState(null);
  const [profile, setProfile] = useState(null);
  const [confirmedEmail, setConfirmedEmail] = useState(false);
  const [needsNewPassword, setNeedsNewPassword] = useState(false);

  // ── Persistent preferences ──
  const [lang, setLang] = useState(() => localStorage.getItem('mm_lang') || 'es');
  const [dark, setDark] = useState(() => localStorage.getItem('mm_dark') === 'true');

  const TH = getTheme(dark);

  // Sync body background with theme
  useEffect(() => {
    document.body.style.background = TH.bg;
    document.body.style.transition = 'background 0.3s';
  }, [dark]);

  useEffect(() => {
    const hash = window.location.hash;
    if (hash) {
      const params = new URLSearchParams(hash.replace(/^#/, ''));
      const type = params.get('type');
      if (type === 'signup' || type === 'email') setConfirmedEmail(true);
      // recovery type is handled by PASSWORD_RECOVERY event below
      window.history.replaceState(null, '', window.location.pathname);
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        applyPendingUsername(session.user.id);
        checkRole(session.user.id);
        loadProfile(session.user.id);
      }
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (_event === 'PASSWORD_RECOVERY') {
        setNeedsNewPassword(true);
        return;
      }
      if (_event === 'USER_UPDATED' && session) {
        // Sync the new confirmed email into profiles table
        await supabase.from('profiles').update({ email: session.user.email }).eq('id', session.user.id);
      }
      setSession(session);
      if (session) {
        applyPendingUsername(session.user.id);
        checkRole(session.user.id);
        loadProfile(session.user.id);
      } else {
        setIsAdmin(false); setIsBlocked(false); setView('module'); setProfile(null);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  const applyPendingUsername = async (userId) => {
    const pending = localStorage.getItem('mm_pending_username');
    if (pending) {
      await supabase.from('profiles').update({ username: pending }).eq('id', userId);
      localStorage.removeItem('mm_pending_username');
    }
  };

  const checkRole = async (userId) => {
    const { data } = await supabase.from('profiles').select('role').eq('id', userId).single();
    setIsAdmin(data?.role === 'admin');
    setIsBlocked(data?.role === 'blocked');
  };

  const loadProfile = async (userId) => {
    const { data } = await supabase.from('profiles').select('username, level').eq('id', userId).single();
    setProfile(data || {});
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setSession(null); setIsAdmin(false); setIsBlocked(false); setView('module'); setProfile(null); setNeedsNewPassword(false);
  };

  const handleProfileSave = (updates) => {
    setProfile(prev => ({ ...prev, ...updates }));
  };

  if (loading) return (
    <div style={{ minHeight: '100vh', background: TH.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: TH.textMuted, fontSize: 13 }}>
      Loading...
    </div>
  );

  // Password recovery flow — shown before the normal app
  if (needsNewPassword) return (
    <ResetPasswordScreen onDone={() => {
      setNeedsNewPassword(false);
      supabase.auth.signOut();
    }} />
  );

  if (!session) return <LandingPage confirmedEmail={confirmedEmail} />;

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
    <div style={{ minHeight: '100vh', background: TH.bg, transition: 'background 0.3s' }}>
      <TopBar session={session} profile={profile} isAdmin={isAdmin} view={view} setView={setView} onLogout={handleLogout} dark={dark} lang={lang} />
      <div style={{ paddingTop: 48 }}>
        {view === 'admin' && isAdmin && <AdminDashboard dark={dark} />}
        {view === 'profile' && <ProfileScreen session={session} profile={profile} onSave={handleProfileSave} lang={lang} setLang={setLang} dark={dark} setDark={setDark} />}
        {view === 'history' && <StudyHistory dark={dark} lang={lang} session={session} onLoad={(item) => { setPendingLoad(item); setView('module'); }} />}
        <div style={{ display: (view !== 'admin' && view !== 'profile' && view !== 'history') ? 'block' : 'none', maxWidth: 960, margin: '0 auto' }}>
          <MasteryModule session={session} level={profile?.level || 'intermediate'} lang={lang} dark={dark} pendingLoad={pendingLoad} onLoadDone={() => setPendingLoad(null)} />
        </div>
      </div>
    </div>
  );
}
