import { useState, useEffect, useRef } from 'react';
import { supabase } from './supabase';

/* ═══════════ THEMES (mirrors App.jsx) ═══════════ */
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

/* ═══════════ TRANSLATIONS ═══════════ */
const T = {
  en: {
    /* nav */
    navWhat: 'What is it', navHow: 'How it works', navTips: 'Tips', navGetStarted: 'Get Started',
    /* hero */
    heroEyebrow: 'THE FEYNMAN TECHNIQUE',
    heroTitle: 'Master anything.',
    heroTitleAccent: 'From first principles.',
    heroSub: 'Mastery Module turns any topic into a structured learning engine — explanations, quizzes, and challenges — built around one idea: you only truly understand something when you can explain it simply.',
    heroLogin: 'Log In', heroSignup: 'Sign Up Free',
    /* what */
    whatTitle: 'What is Mastery Module?',
    whatSub: 'Part explanation engine, part study partner — built around one idea: you don\'t really know something until you can teach it.',
    whatP1: 'Mastery Module is built on one idea: you only truly understand something when you can explain it simply. That\'s the Feynman Technique — and it\'s the engine behind everything here.',
    whatP2: 'Enter any topic. Get a first-principles explanation tailored to your level, then get challenged to prove you understood it.',
    /* modes */
    /* section badge labels */
    badgeIdea: 'THE IDEA', badgeModes: 'MODES', badgeWorkflow: 'WORKFLOW', badgeTips: 'TIPS',
    /* speed/depth modes */
    speedModesTitle: 'Choose your depth',
    speedModesSub: 'Three modes — pick the one that fits your situation right now.',
    speedModes: [
      { icon: '⚡', label: 'Lite', desc: 'Essential overview in ~2 min. Core idea, 2 key concepts, 3-question check.', when: 'Quick refresher, limited time, or just curious about a concept.', example: '"What is a derivative?" before jumping into a problem set.' },
      { icon: '🚀', label: 'Fast', desc: 'Full explanation + quiz + 5-question exam. The everyday study loop.', when: 'Actively studying and want explanation + practice in one shot.', example: '"Black-Scholes model" when prepping for a finance exam.' },
      { icon: '🔬', label: 'Think', desc: 'Deep-dive + 10-question exam + challenge problems + full summary deck.', when: 'You want true mastery — not just to pass a test, but to own the concept.', example: '"Central Limit Theorem" when you want to explain it from scratch to someone else.' },
    ],
    modesTitle: 'Six ways to learn',
    modesSub: 'Every mode serves a different purpose in the learning cycle.',
    modes: [
      { icon: '💡', label: 'Explain', desc: 'A clear, layered explanation of any concept — from simple to deep, adjusted to your knowledge level.' },
      { icon: '⚡', label: 'Quiz', desc: 'Rapid-fire questions to test recall. Instant feedback on every answer.' },
      { icon: '📄', label: 'Exam', desc: 'A structured, scored exam that simulates a real academic test on the topic.' },
      { icon: '🧩', label: 'Challenge', desc: 'Hard, application-level problems. Designed to reveal gaps you didn\'t know you had.' },
      { icon: '🔑', label: 'Key Concepts', desc: 'A clean list of the essential ideas — what you must know to claim mastery.' },
    ],
    /* how */
    howTitle: 'How to use it',
    howSub: 'A simple loop that builds deep understanding fast.',
    steps: [
      { n: '01', title: 'Pick a topic', desc: 'Type anything: "Black-Scholes model", "Central Limit Theorem", "Supply and Demand", "Compound Interest". The more specific, the better.' },
      { n: '02', title: 'Start with Explain', desc: 'Read the explanation carefully. Don\'t skim. This is your foundation. If something is unclear, hit Simplify.' },
      { n: '03', title: 'Quiz yourself immediately', desc: 'Knowledge fades fast without retrieval practice. Run the Quiz right after reading to lock concepts in.' },
      { n: '04', title: 'Go deeper with Exam or Challenge', desc: 'When you feel confident, stress-test it. Exams score you. Challenges push you beyond recall into real application.' },
    ],
    /* tips */
    tipsTitle: 'Tips to get the most out of it',
    tips: [
      { icon: '🎯', title: 'Be specific', desc: 'Instead of "Economics", try "Price elasticity of demand". Narrow topics produce sharper explanations.' },
      { icon: '🎓', title: 'Set your level', desc: 'Go to your Profile and set your knowledge level. Beginner gets analogies and simple language. Advanced gets technical depth.' },
      { icon: '🔄', title: 'Use the full loop', desc: 'Explain → Quiz → Exam is not optional. Each step reinforces the last. Skipping any one of them leaves gaps.' },
      { icon: '📝', title: 'Teach it back', desc: 'After reading an explanation, close it and try to explain the topic in your own words. If you get stuck, that\'s exactly where to focus.' },
      { icon: '🌙', title: 'Switch to Night Mode', desc: 'Long study sessions are easier on your eyes in dark mode. Set it once in your Profile and it sticks.' },
      { icon: '🌐', title: 'Use your language', desc: 'Content is generated in the language you select — English or Spanish. Set it in your Profile for a consistent experience.' },
    ],
    /* auth */
    authTitle: 'Ready to start?',
    authSub: 'Create your free account in seconds.',
    welcomeBack: 'Welcome Back', createAccount: 'Create Account',
    loginSub: 'Log in to continue learning', signupSub: 'Sign up to start your journey',
    username: 'Username', usernamePH: 'How others will see you',
    email: 'Email', password: 'Password', confirmPW: 'Confirm Password',
    pwPH: 'Min 6 characters', confirmPH: 'Repeat your password',
    loginBtn: 'Log In', signupBtn: 'Sign Up Free',
    toSignup: "Don't have an account? Sign up", toLogin: 'Already have an account? Log in',
    forgotPW: 'Forgot password?', forgotTitle: 'Reset Password',
    forgotSub: 'Enter your email and we\'ll send you a reset link',
    sendReset: 'Send Reset Link', resetSent: '✓ Check your email for a reset link.',
    backToLogin: '← Back to log in',
    emailExists: 'An account with this email already exists.',
    signupOk: 'Account created! Check your email to confirm, then log in.',
    pwMismatch: 'Passwords do not match.',
    emailConfirmed: '✓ Email confirmed! You can now sign in.',
    footer: 'Learn by First Principles',
  },
  es: {
    navWhat: 'Qué es', navHow: 'Cómo funciona', navTips: 'Tips', navGetStarted: 'Empezar',
    heroEyebrow: 'LA TÉCNICA FEYNMAN',
    heroTitle: 'Dominá cualquier tema.',
    heroTitleAccent: 'Desde los principios.',
    heroSub: 'Mastery Module convierte cualquier tema en un motor de aprendizaje — explicaciones, quizzes y desafíos — construidos alrededor de una sola idea: solo entendés algo de verdad cuando podés explicarlo simple.',
    heroLogin: 'Iniciar sesión', heroSignup: 'Registrarse gratis',
    whatTitle: '¿Qué es Mastery Module?',
    whatSub: 'Parte motor de explicación, parte compañero de estudio — todo alrededor de una sola idea: no entendés algo de verdad hasta que podés enseñarlo.',
    whatP1: 'Mastery Module se basa en una idea: solo entendés algo de verdad cuando podés explicarlo de forma simple. Eso es la Técnica Feynman — y es el motor de todo lo que hacemos acá.',
    whatP2: 'Ingresá cualquier tema. Recibís una explicación desde los principios fundamentales, adaptada a tu nivel, y luego te desafía a demostrar que lo entendiste.',
    /* etiquetas de sección */
    badgeIdea: 'LA IDEA', badgeModes: 'MODOS', badgeWorkflow: 'FLUJO', badgeTips: 'TIPS',
    /* modos de velocidad/profundidad */
    speedModesTitle: 'Elegí la profundidad',
    speedModesSub: 'Tres modos — elegí el que se adapta a tu situación ahora.',
    speedModes: [
      { icon: '⚡', label: 'Lite', desc: 'Resumen esencial en ~2 min. Idea central, 2 conceptos clave, 3 preguntas.', when: 'Repaso rápido, poco tiempo, o simplemente querés entender un concepto.', example: '"¿Qué es una derivada?" antes de arrancar con un parcial.' },
      { icon: '🚀', label: 'Rápido', desc: 'Explicación completa + quiz + examen de 5 preguntas. El ciclo de estudio del día a día.', when: 'Estás estudiando y querés explicación + práctica en un solo paso.', example: '"Modelo Black-Scholes" cuando te preparás para un final de finanzas.' },
      { icon: '🔬', label: 'Profundo', desc: 'Análisis a fondo + examen de 10 preguntas + desafíos + slides de resumen.', when: 'Querés dominar el tema de verdad — no solo aprobar, sino poder explicarlo.', example: '"Teorema Central del Límite" cuando querés poder enseñárselo a alguien más.' },
    ],
    modesTitle: 'Seis formas de aprender',
    modesSub: 'Cada modo cumple un propósito distinto en el ciclo de aprendizaje.',
    modes: [
      { icon: '💡', label: 'Explicar', desc: 'Una explicación clara y en capas de cualquier concepto — de lo simple a lo profundo, ajustada a tu nivel.' },
      { icon: '⚡', label: 'Quiz', desc: 'Preguntas rápidas para testear lo que recordás. Feedback instantáneo en cada respuesta.' },
      { icon: '📄', label: 'Examen', desc: 'Un examen estructurado y con puntaje que simula una prueba académica real sobre el tema.' },
      { icon: '🧩', label: 'Desafío', desc: 'Problemas de aplicación difíciles. Diseñados para revelar vacíos que no sabías que tenías.' },
      { icon: '🔑', label: 'Conceptos Clave', desc: 'Una lista limpia de las ideas esenciales — lo que tenés que saber para decir que dominás el tema.' },
    ],
    howTitle: 'Cómo usarlo',
    howSub: 'Un ciclo simple que construye comprensión profunda rápido.',
    steps: [
      { n: '01', title: 'Elegí un tema', desc: 'Escribí cualquier cosa: "Modelo Black-Scholes", "Teorema Central del Límite", "Oferta y Demanda", "Interés Compuesto". Cuanto más específico, mejor.' },
      { n: '02', title: 'Empezá con Explicar', desc: 'Leé la explicación con atención. No la escanees. Es tu base. Si algo no queda claro, usá Simplificar.' },
      { n: '03', title: 'Hacé el Quiz de inmediato', desc: 'El conocimiento se desvanece rápido sin práctica de recuperación. Hacé el Quiz justo después de leer para fijar los conceptos.' },
      { n: '04', title: 'Profundizá con Examen o Desafío', desc: 'Cuando te sentís seguro, poné a prueba ese conocimiento. Los exámenes te puntúan. Los desafíos te llevan más allá del recuerdo a la aplicación real.' },
    ],
    tipsTitle: 'Tips para sacarle el máximo',
    tips: [
      { icon: '🎯', title: 'Sé específico', desc: 'En lugar de "Economía", probá "Elasticidad precio de la demanda". Los temas acotados producen explicaciones más precisas.' },
      { icon: '🎓', title: 'Configurá tu nivel', desc: 'Entrá a tu Perfil y elegí tu nivel de conocimiento. Principiante recibe analogías y lenguaje simple. Avanzado recibe profundidad técnica.' },
      { icon: '🔄', title: 'Usá el ciclo completo', desc: 'Explicar → Quiz → Examen no es opcional. Cada paso refuerza al anterior. Saltarse uno deja huecos.' },
      { icon: '📝', title: 'Enseñalo vos', desc: 'Después de leer una explicación, cerrala e intentá explicar el tema con tus propias palabras. Donde te trabes, ahí está el hueco.' },
      { icon: '🌙', title: 'Usá el Modo Noche', desc: 'Las sesiones largas son más cómodas para los ojos en modo oscuro. Configuralo en tu Perfil y queda guardado.' },
      { icon: '🌐', title: 'Usá tu idioma', desc: 'El contenido se genera en el idioma que elijas — inglés o español. Configuralo en tu Perfil para una experiencia consistente.' },
    ],
    authTitle: '¿Listo para empezar?',
    authSub: 'Creá tu cuenta gratuita en segundos.',
    welcomeBack: 'Bienvenido de vuelta', createAccount: 'Crear cuenta',
    loginSub: 'Iniciá sesión para seguir aprendiendo', signupSub: 'Registrate y empezá a aprender',
    username: 'Nombre de usuario', usernamePH: 'Cómo te verán los demás',
    email: 'Email', password: 'Contraseña', confirmPW: 'Confirmar contraseña',
    pwPH: 'Mínimo 6 caracteres', confirmPH: 'Repetí tu contraseña',
    loginBtn: 'Iniciar sesión', signupBtn: 'Registrarse gratis',
    toSignup: '¿No tenés cuenta? Registrate', toLogin: '¿Ya tenés cuenta? Iniciá sesión',
    forgotPW: '¿Olvidaste tu contraseña?', forgotTitle: 'Resetear contraseña',
    forgotSub: 'Ingresá tu email y te enviamos un enlace para resetearla',
    sendReset: 'Enviar enlace', resetSent: '✓ Revisá tu email para el enlace de reset.',
    backToLogin: '← Volver al inicio de sesión',
    emailExists: 'Ya existe una cuenta con este email.',
    signupOk: '¡Cuenta creada! Revisá tu email para confirmar y luego iniciá sesión.',
    pwMismatch: 'Las contraseñas no coinciden.',
    emailConfirmed: '✓ ¡Email confirmado! Ya podés iniciar sesión.',
    footer: 'Aprendé desde los Principios Fundamentales',
  },
};

/* ═══════════ LANDING PAGE ═══════════ */
export default function LandingPage({ confirmedEmail, initialForm }) {
  const [lang, setLang] = useState(() => localStorage.getItem('mm_lang') || 'es');
  const [dark, setDark] = useState(() => localStorage.getItem('mm_dark') === 'true');
  const [scrolled, setScrolled] = useState(false);
  const [morphKey, setMorphKey] = useState(0);

  const TH = getTheme(dark);
  const t = T[lang];

  const authRef = useRef(null);
  const whatRef = useRef(null);
  const howRef = useRef(null);
  const tipsRef = useRef(null);

  const changeLang = (l) => { setLang(l); localStorage.setItem('mm_lang', l); setMorphKey(k => k + 1); };
  const toggleDark = () => { const n = !dark; setDark(n); localStorage.setItem('mm_dark', String(n)); };

  useEffect(() => {
    document.body.style.background = TH.bg;
    document.body.style.transition = 'background 0.3s';
  }, [dark]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const scrollTo = (ref) => ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  const goToAuth = (mode) => {
    scrollTo(authRef);
    // slight delay so scroll lands first
    setTimeout(() => authRef.current?.dispatchEvent(new CustomEvent('setmode', { detail: mode })), 350);
  };

  const navBtn = (label, onClick) => (
    <button onClick={onClick} style={{
      background: 'none', border: 'none', color: TH.textSecondary, fontSize: 12,
      fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', padding: '4px 0',
      letterSpacing: 0.3,
    }}>{label}</button>
  );

  return (
    <div style={{ minHeight: '100vh', background: TH.bg, color: TH.text, fontFamily: "'Bricolage Grotesque', system-ui, sans-serif", transition: 'background 0.3s' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:wght@400;600;700;800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes morphIn {
          0%   { opacity: 0; filter: blur(8px); transform: translateY(6px) scale(0.98); }
          100% { opacity: 1; filter: blur(0px); transform: translateY(0)   scale(1);    }
        }
        .lp-fade { animation: fadeUp 0.5s ease both; }
        .lp-morph { animation: morphIn 0.38s cubic-bezier(0.22,1,0.36,1) both; }
        .lp-card:hover { transform: translateY(-2px); box-shadow: 0 8px 32px rgba(0,0,0,0.08) !important; }
        .lp-card { transition: transform 0.2s, box-shadow 0.2s; }
        input { font-size: 16px; }
        @media (max-width: 640px) {
          .lp-nav-links { display: none !important; }
          .lp-nav-right { gap: 6px !important; }
          .lp-nav-right .lp-lang-toggle span { display: none; }
        }
      `}</style>

      {/* ── STICKY NAV ── */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        background: scrolled ? (dark ? 'rgba(17,17,20,0.92)' : 'rgba(247,245,240,0.92)') : 'transparent',
        backdropFilter: scrolled ? 'blur(12px)' : 'none',
        borderBottom: scrolled ? '1px solid ' + TH.border : '1px solid transparent',
        transition: 'all 0.25s',
        overflow: 'hidden',
      }}>
        <div style={{ maxWidth: 960, margin: '0 auto', padding: '10px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 18, fontWeight: 800, color: TH.accent }}>&#x2211;</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: TH.text, letterSpacing: '-0.01em' }}>Mastery Module</span>
          </div>
          {/* Nav links — hidden on small screens */}
          <div className="lp-nav-links" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {[
              { label: t.navWhat, ref: whatRef },
              { label: t.navHow,  ref: howRef  },
              { label: t.navTips, ref: tipsRef  },
            ].map(({ label, ref }) => (
              <button key={label} onClick={() => scrollTo(ref)} style={{
                padding: '5px 13px', borderRadius: 8, border: '1px solid ' + TH.border,
                background: TH.surface, color: TH.textSecondary, fontSize: 11,
                fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                transition: 'border-color 0.15s, color 0.15s',
              }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = TH.accent; e.currentTarget.style.color = TH.accent; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = TH.border;  e.currentTarget.style.color = TH.textSecondary; }}
              >{label}</button>
            ))}
          </div>
          {/* Right controls */}
          <div className="lp-nav-right" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {/* Lang toggle */}
            <div style={{ display: 'flex', borderRadius: 6, overflow: 'hidden', border: '1px solid ' + TH.border }}>
              {['es', 'en'].map(l => (
                <button key={l} onClick={() => changeLang(l)} style={{
                  padding: '4px 9px', fontSize: 10, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
                  border: 'none', background: lang === l ? TH.accentBg : 'transparent',
                  color: lang === l ? TH.accent : TH.textMuted,
                }}>{l.toUpperCase()}</button>
              ))}
            </div>
            {/* Dark toggle */}
            <button onClick={toggleDark} style={{
              background: 'none', border: '1px solid ' + TH.border, borderRadius: 6,
              padding: '4px 8px', cursor: 'pointer', fontSize: 12,
            }}>{dark ? '☀️' : '🌙'}</button>
            {/* Login button */}
            <button onClick={() => goToAuth('login')} style={{
              padding: '6px 14px', borderRadius: 8, border: '1px solid ' + TH.border,
              background: TH.surface, color: TH.textSecondary, fontSize: 11, fontWeight: 700,
              cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap',
            }}>{t.heroLogin}</button>
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section style={{ paddingTop: 120, paddingBottom: 90, textAlign: 'center', padding: '120px 20px 90px' }}>
        <div key={morphKey} style={{ maxWidth: 680, margin: '0 auto' }} className="lp-fade lp-morph">
          {/* Eyebrow pill */}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: TH.accentBg, border: '1px solid rgba(232,148,10,0.25)', borderRadius: 20, padding: '5px 14px', marginBottom: 28, fontSize: 9, color: TH.accent, fontWeight: 700, letterSpacing: 2 }}>
            <span>&#x2211;</span> {t.heroEyebrow}
          </div>
          {/* Headline */}
          <h1 style={{ fontSize: 'clamp(40px, 7vw, 68px)', fontWeight: 800, lineHeight: 1.08, letterSpacing: '-0.03em', color: TH.text, marginBottom: 20 }}>
            {t.heroTitle}<br />
            <span style={{ color: TH.accent }}>{t.heroTitleAccent}</span>
          </h1>
          {/* Sub */}
          <p style={{ fontSize: 'clamp(14px, 2vw, 17px)', color: TH.textSecondary, lineHeight: 1.65, maxWidth: 520, margin: '0 auto 36px' }}>
            {t.heroSub}
          </p>
          {/* CTAs */}
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button onClick={() => goToAuth('signup')} style={{
              padding: '14px 30px', borderRadius: 12, border: 'none',
              background: 'linear-gradient(135deg,' + TH.accentLight + ',' + TH.accent + ')',
              color: '#fff', fontWeight: 700, fontSize: 14, cursor: 'pointer',
              fontFamily: 'inherit', boxShadow: '0 2px 20px rgba(232,148,10,0.3)',
            }}>{t.heroSignup}</button>
            <button onClick={() => goToAuth('login')} style={{
              padding: '14px 30px', borderRadius: 12, border: '1px solid ' + TH.border,
              background: TH.surface, color: TH.textSecondary, fontWeight: 700,
              fontSize: 14, cursor: 'pointer', fontFamily: 'inherit',
            }}>{t.heroLogin}</button>
          </div>
        </div>

        {/* Hero visual — faithful app replica */}
        <div style={{ maxWidth: 640, margin: '56px auto 0', position: 'relative' }}>
          {/* Browser chrome */}
          <div style={{
            background: dark ? '#0e0e11' : '#e8e4dc',
            borderRadius: '16px 16px 0 0',
            padding: '10px 14px',
            display: 'flex', alignItems: 'center', gap: 6,
            borderBottom: '1px solid ' + TH.border,
          }}>
            {['#ff5f57','#febc2e','#28c840'].map((c,i) => (
              <div key={i} style={{ width: 9, height: 9, borderRadius: '50%', background: c, opacity: 0.85 }} />
            ))}
            <div style={{ flex: 1, height: 7, borderRadius: 20, background: dark ? '#2a2a38' : '#d0ccc3', marginLeft: 8, maxWidth: 260 }} />
          </div>

          {/* App window */}
          <div style={{
            background: TH.bg,
            borderRadius: '0 0 16px 16px',
            boxShadow: dark ? '0 24px 80px rgba(0,0,0,0.55)' : '0 24px 80px rgba(0,0,0,0.1)',
            overflow: 'hidden',
            border: '1px solid ' + TH.border,
            borderTop: 'none',
          }}>
            {/* Mini nav bar */}
            <div style={{
              display: 'flex', justifyContent: 'flex-end', alignItems: 'center',
              padding: '8px 14px', gap: 6,
              borderBottom: '1px solid ' + TH.border,
              background: TH.bg,
            }}>
              {[
                { label: lang === 'es' ? 'Módulo' : 'Module', accent: true },
                { label: lang === 'es' ? 'Perfil' : 'Profile', accent: false },
                { label: lang === 'es' ? 'Salir' : 'Log Out', accent: false },
              ].map((b, i) => (
                <div key={i} style={{
                  padding: '3px 10px', borderRadius: 6, fontSize: 9, fontWeight: 700,
                  border: '1px solid ' + (b.accent ? TH.accent : TH.border),
                  color: b.accent ? TH.accent : TH.textSecondary,
                  background: 'transparent',
                }}>{b.label}</div>
              ))}
            </div>

            {/* App content */}
            <div style={{ padding: '22px 28px 24px', textAlign: 'center' }}>
              {/* Subject pill */}
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                border: '1px solid ' + TH.border, borderRadius: 20,
                padding: '3px 12px', marginBottom: 12, fontSize: 8, fontWeight: 700,
                color: TH.textSecondary, letterSpacing: 1,
              }}>
                🎯 {lang === 'es' ? 'MATEMÁTICA · ESTADÍSTICA · ECONOMÍA · FINANZAS' : 'MATH · STATISTICS · ECONOMICS · FINANCE'}
              </div>

              {/* App title */}
              <div style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.03em', color: TH.text, marginBottom: 6 }}>
                {lang === 'es' ? 'Módulo de Dominio' : 'Mastery Module'}
              </div>
              <div style={{ fontSize: 10, color: TH.textSecondary, marginBottom: 18, lineHeight: 1.5 }}>
                {lang === 'es'
                  ? 'Escribí un tema de mate, estadística, economía o finanzas.'
                  : 'Type a topic in math, statistics, economics, or finance.'}
              </div>

              {/* Input card */}
              <div style={{
                background: TH.surface, borderRadius: 14, border: '1px solid ' + TH.border,
                padding: '12px', textAlign: 'left',
                boxShadow: dark ? '0 4px 20px rgba(0,0,0,0.3)' : '0 4px 20px rgba(0,0,0,0.05)',
              }}>
                {/* Topic input */}
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  background: TH.bg, borderRadius: 10, border: '1px solid ' + TH.border,
                  padding: '8px 10px', marginBottom: 8,
                }}>
                  <span style={{ fontSize: 11 }}>🔍</span>
                  <span style={{ flex: 1, fontSize: 10, color: TH.text, fontWeight: 500 }}>
                    {lang === 'es' ? 'Derivadas' : 'Derivatives'}
                  </span>
                  {/* Upload icon — box with upward arrow */}
                  <div style={{
                    width: 22, height: 22, borderRadius: 6,
                    border: '1px solid ' + TH.border,
                    background: TH.surface,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    <svg width="11" height="11" viewBox="0 0 14 14" fill="none" stroke={TH.textMuted} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="2" y="2" width="10" height="10" rx="2"/>
                      <path d="M7 9V5M5 7l2-2 2 2"/>
                    </svg>
                  </div>
                </div>

                {/* Interests input */}
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  background: TH.bg, borderRadius: 10,
                  border: '1px solid ' + TH.border,
                  padding: '7px 10px', marginBottom: 6,
                }}>
                  <span style={{ fontSize: 10 }}>🎯</span>
                  <span style={{ flex: 1, fontSize: 10, color: TH.accent, fontWeight: 600 }}>
                    {lang === 'es' ? 'Fútbol' : 'Basketball'}
                  </span>
                  {/* Sparkle/dice icon */}
                  <div style={{
                    width: 20, height: 20, borderRadius: 5,
                    border: '1px solid ' + TH.border,
                    background: TH.surface,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0, fontSize: 10,
                  }}>✦</div>
                  {/* X button */}
                  <div style={{
                    width: 20, height: 20, borderRadius: 5,
                    border: '1px solid ' + TH.border,
                    background: TH.surface,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0, fontSize: 9, color: TH.textMuted, fontWeight: 700,
                  }}>✕</div>
                </div>
                <div style={{ fontSize: 8, color: TH.textFaint, textAlign: 'center', marginBottom: 10 }}>
                  {lang === 'es' ? 'Opcional — personaliza las analogías y el quiz con lo que te gusta' : 'Optional — personalizes analogies & quiz with your interests'}
                </div>

                {/* Divider */}
                <div style={{ height: 1, background: TH.borderLight, marginBottom: 10 }} />

                {/* Mode buttons */}
                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  {(lang === 'es'
                    ? [['Lite','Resumen esencial'], ['Rápido','Explicación rápida + quiz'], ['Profundo','Análisis completo + examen']]
                    : [['Lite','Essential overview'], ['Fast','Quick explanation + quiz'], ['Think','Full deep dive + exam + deck']]
                  ).map(([label, sub], i) => (
                    <div key={i} style={{
                      flex: 1, textAlign: 'center', padding: '6px 4px', borderRadius: 8,
                      border: '1px solid ' + (i === 1 ? TH.border : 'transparent'),
                      background: i === 1 ? TH.surface : 'transparent',
                    }}>
                      <div style={{ fontSize: 9, fontWeight: 800, color: i === 1 ? TH.text : TH.textMuted }}>{label}</div>
                      <div style={{ fontSize: 7, color: i === 1 ? TH.accent : TH.textFaint, marginTop: 1 }}>{sub}</div>
                    </div>
                  ))}
                  <div style={{
                    padding: '7px 16px', borderRadius: 8,
                    background: dark ? '#3a3a4a' : '#2a2a3a',
                    color: '#fff', fontSize: 10, fontWeight: 800,
                  }}>
                    {lang === 'es' ? 'Dale' : 'Learn'}
                  </div>
                </div>
              </div>

              {/* Topic chips */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, justifyContent: 'center', marginTop: 16 }}>
                {(lang === 'es'
                  ? ['Teorema de Pitágoras','Integrales','Distribución Normal','Ratios Financieros']
                  : ['Pythagorean Theorem','Integrals','Normal Distribution','Financial Ratios']
                ).map((chip, i) => (
                  <div key={i} style={{
                    padding: '3px 10px', borderRadius: 20, fontSize: 8, fontWeight: 500,
                    border: '1px solid ' + TH.border, color: TH.textSecondary,
                    background: TH.surface,
                  }}>{chip}</div>
                ))}
              </div>

              {/* Footer tag */}
              <div style={{ marginTop: 14, fontSize: 8, color: TH.textFaint }}>
                {lang === 'es' ? 'Aprendé desde los Principios Fundamentales' : 'Learn by First Principles'}
              </div>
            </div>
          </div>

          {/* Glow */}
          <div style={{
            position: 'absolute', bottom: -30, left: '50%', transform: 'translateX(-50%)',
            width: 300, height: 60, borderRadius: '50%',
            background: 'rgba(232,148,10,0.12)', filter: 'blur(30px)', pointerEvents: 'none',
          }} />
        </div>
      </section>

      {/* ── WHAT IS IT ── */}
      <section ref={whatRef} style={{ padding: '80px 20px', borderTop: '1px solid ' + TH.borderLight }}>
        <div style={{ maxWidth: 720, margin: '0 auto' }}>
          <div key={`hdr-what-${morphKey}`} className="lp-morph" style={{ textAlign: 'center', marginBottom: 48 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: TH.accentBg, border: '1px solid rgba(232,148,10,0.2)', borderRadius: 20, padding: '4px 12px', marginBottom: 16, fontSize: 9, color: TH.accent, fontWeight: 700, letterSpacing: 1.5 }}>{t.badgeIdea}</div>
            <h2 style={{ fontSize: 'clamp(26px,4vw,38px)', fontWeight: 800, letterSpacing: '-0.02em', color: TH.text, marginBottom: 10 }}>{t.whatTitle}</h2>
            <p style={{ fontSize: 14, color: TH.accent, fontWeight: 600 }}>{t.whatSub}</p>
          </div>
          <div key={morphKey} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 20 }}>
            {[t.whatP1, t.whatP2].map((p, i) => (
              <div key={i} className="lp-card" style={{
                background: TH.surface, borderRadius: 16, border: '1px solid ' + TH.border,
                padding: '24px 24px', boxShadow: dark ? '0 4px 24px rgba(0,0,0,0.2)' : '0 4px 24px rgba(0,0,0,0.03)',
              }}>
                <div style={{ fontSize: 24, marginBottom: 12 }}>{i === 0 ? '📐' : '🔬'}</div>
                <p style={{ color: TH.textSecondary, fontSize: 14, lineHeight: 1.7 }}>{p}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SIX MODES ── */}
      <section style={{ padding: '80px 20px', background: dark ? TH.surface : '#faf8f4', borderTop: '1px solid ' + TH.borderLight, borderBottom: '1px solid ' + TH.borderLight }}>
        <div style={{ maxWidth: 960, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: TH.accentBg, border: '1px solid rgba(232,148,10,0.2)', borderRadius: 20, padding: '4px 12px', marginBottom: 16, fontSize: 9, color: TH.accent, fontWeight: 700, letterSpacing: 1.5 }}>{t.badgeModes}</div>
            <h2 style={{ fontSize: 'clamp(26px,4vw,38px)', fontWeight: 800, letterSpacing: '-0.02em', color: TH.text, marginBottom: 10 }}>{t.modesTitle}</h2>
            <p style={{ fontSize: 13, color: TH.textMuted, maxWidth: 400, margin: '0 auto' }}>{t.modesSub}</p>
          </div>
          <div key={morphKey} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(240px,1fr))', gap: 16 }}>
            {t.modes.map((m, i) => (
              <div key={i} className="lp-card" style={{
                background: TH.surface, borderRadius: 14, border: '1px solid ' + TH.border,
                padding: 20, boxShadow: dark ? '0 2px 16px rgba(0,0,0,0.2)' : '0 2px 16px rgba(0,0,0,0.03)',
              }}>
                <div style={{ fontSize: 22, marginBottom: 10 }}>{m.icon}</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: TH.text, marginBottom: 6 }}>{m.label}</div>
                <p style={{ fontSize: 12, color: TH.textMuted, lineHeight: 1.65 }}>{m.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SPEED / DEPTH MODES ── */}
      <section style={{ padding: '80px 20px' }}>
        <div style={{ maxWidth: 960, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: TH.accentBg, border: '1px solid rgba(232,148,10,0.2)', borderRadius: 20, padding: '4px 12px', marginBottom: 16, fontSize: 9, color: TH.accent, fontWeight: 700, letterSpacing: 1.5 }}>{lang === 'es' ? 'PROFUNDIDAD' : 'DEPTH'}</div>
            <h2 style={{ fontSize: 'clamp(26px,4vw,38px)', fontWeight: 800, letterSpacing: '-0.02em', color: TH.text, marginBottom: 10 }}>{t.speedModesTitle}</h2>
            <p style={{ fontSize: 13, color: TH.textMuted, maxWidth: 440, margin: '0 auto' }}>{t.speedModesSub}</p>
          </div>
          <div key={morphKey} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))', gap: 20 }}>
            {t.speedModes.map((sm, i) => {
              const modeColors = [
                { accent: '#059669', accentBg: 'rgba(5,150,105,0.07)', border: 'rgba(5,150,105,0.2)', tag: 'LITE' },
                { accent: '#e8940a', accentBg: 'rgba(232,148,10,0.07)', border: 'rgba(232,148,10,0.2)', tag: dark ? 'FAST' : 'FAST' },
                { accent: '#6366f1', accentBg: 'rgba(99,102,241,0.07)', border: 'rgba(99,102,241,0.2)', tag: 'THINK' },
              ][i];
              return (
                <div key={i} className="lp-card" style={{
                  background: TH.surface, borderRadius: 16, border: '1px solid ' + TH.border,
                  padding: 24, boxShadow: dark ? '0 4px 24px rgba(0,0,0,0.2)' : '0 4px 24px rgba(0,0,0,0.04)',
                  borderTop: '3px solid ' + modeColors.accent,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                    <span style={{ fontSize: 20 }}>{sm.icon}</span>
                    <span style={{ fontSize: 15, fontWeight: 800, color: TH.text }}>{sm.label}</span>
                    <span style={{ marginLeft: 'auto', fontSize: 8, fontWeight: 700, letterSpacing: 1.2, color: modeColors.accent, background: modeColors.accentBg, border: '1px solid ' + modeColors.border, borderRadius: 4, padding: '2px 7px' }}>{modeColors.tag}</span>
                  </div>
                  <p style={{ fontSize: 13, color: TH.textSecondary, lineHeight: 1.6, marginBottom: 14 }}>{sm.desc}</p>
                  <div style={{ borderTop: '1px solid ' + TH.borderLight, paddingTop: 14 }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: TH.textMuted, letterSpacing: 0.8, marginBottom: 5, textTransform: 'uppercase' }}>
                      {lang === 'es' ? 'Cuándo usarlo' : 'Best when'}
                    </div>
                    <p style={{ fontSize: 12, color: TH.textMuted, lineHeight: 1.6, marginBottom: 10 }}>{sm.when}</p>
                    <div style={{ background: TH.bg, borderRadius: 8, padding: '8px 12px', border: '1px solid ' + TH.borderLight }}>
                      <span style={{ fontSize: 10, fontWeight: 700, color: modeColors.accent, marginRight: 5 }}>{lang === 'es' ? 'Ejemplo' : 'e.g.'}</span>
                      <span style={{ fontSize: 11, color: TH.textSecondary, fontStyle: 'italic' }}>{sm.example}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section ref={howRef} style={{ padding: '80px 20px' }}>
        <div style={{ maxWidth: 680, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: TH.accentBg, border: '1px solid rgba(232,148,10,0.2)', borderRadius: 20, padding: '4px 12px', marginBottom: 16, fontSize: 9, color: TH.accent, fontWeight: 700, letterSpacing: 1.5 }}>{t.badgeWorkflow}</div>
            <h2 style={{ fontSize: 'clamp(26px,4vw,38px)', fontWeight: 800, letterSpacing: '-0.02em', color: TH.text, marginBottom: 10 }}>{t.howTitle}</h2>
            <p style={{ fontSize: 13, color: TH.textMuted }}>{t.howSub}</p>
          </div>
          <div key={morphKey} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {t.steps.map((s, i) => (
              <div key={i} style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>
                <div style={{ flexShrink: 0, width: 40, height: 40, borderRadius: 12, background: TH.accentBg, border: '1px solid rgba(232,148,10,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, color: TH.accent, letterSpacing: 0.5, marginTop: 2 }}>
                  {s.n}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: TH.text, marginBottom: 5 }}>{s.title}</div>
                  <p style={{ fontSize: 13, color: TH.textMuted, lineHeight: 1.65 }}>{s.desc}</p>
                  {i < t.steps.length - 1 && (
                    <div style={{ width: 1, height: 16, background: TH.border, marginLeft: -28, marginTop: 12 }} />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TIPS ── */}
      <section ref={tipsRef} style={{ padding: '80px 20px', background: dark ? TH.surface : '#faf8f4', borderTop: '1px solid ' + TH.borderLight, borderBottom: '1px solid ' + TH.borderLight }}>
        <div style={{ maxWidth: 960, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: TH.accentBg, border: '1px solid rgba(232,148,10,0.2)', borderRadius: 20, padding: '4px 12px', marginBottom: 16, fontSize: 9, color: TH.accent, fontWeight: 700, letterSpacing: 1.5 }}>{t.badgeTips}</div>
            <h2 style={{ fontSize: 'clamp(26px,4vw,38px)', fontWeight: 800, letterSpacing: '-0.02em', color: TH.text }}>{t.tipsTitle}</h2>
          </div>
          <div key={morphKey} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(260px,1fr))', gap: 16 }}>
            {t.tips.map((tip, i) => (
              <div key={i} className="lp-card" style={{
                background: TH.surface, borderRadius: 14, border: '1px solid ' + TH.border,
                padding: '18px 20px', boxShadow: dark ? '0 2px 16px rgba(0,0,0,0.2)' : '0 2px 16px rgba(0,0,0,0.03)',
                display: 'flex', gap: 14, alignItems: 'flex-start',
              }}>
                <div style={{ fontSize: 20, flexShrink: 0, marginTop: 2 }}>{tip.icon}</div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: TH.text, marginBottom: 5 }}>{tip.title}</div>
                  <p style={{ fontSize: 12, color: TH.textMuted, lineHeight: 1.65 }}>{tip.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── AUTH SECTION ── */}
      <section ref={authRef} style={{ padding: '80px 20px 100px' }}>
        <div style={{ maxWidth: 420, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: TH.accentBg, border: '1px solid rgba(232,148,10,0.25)', borderRadius: 20, padding: '4px 12px', marginBottom: 16, fontSize: 9, color: TH.accent, fontWeight: 700, letterSpacing: 1.5 }}>&#x2211; MASTERY MODULE</div>
            <h2 style={{ fontSize: 'clamp(26px,4vw,36px)', fontWeight: 800, letterSpacing: '-0.02em', color: TH.text, marginBottom: 8 }}>{t.authTitle}</h2>
            <p style={{ fontSize: 13, color: TH.textMuted }}>{t.authSub}</p>
          </div>
          <AuthForm TH={TH} dark={dark} lang={lang} changeLang={changeLang} t={t} confirmedEmail={confirmedEmail} initialMode={initialForm || 'login'} />
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ borderTop: '1px solid ' + TH.borderLight, padding: '20px', textAlign: 'center' }}>
        <span style={{ fontSize: 13, fontWeight: 800, color: TH.accent, marginRight: 8 }}>&#x2211;</span>
        <span style={{ fontSize: 11, color: TH.textMuted }}>{t.footer}</span>
      </footer>
    </div>
  );
}

/* ═══════════ AUTH FORM (embedded, same as App.jsx logic) ═══════════ */
function AuthForm({ TH, dark, lang, changeLang, t, confirmedEmail, initialMode }) {
  const [isLogin, setIsLogin] = useState(initialMode !== 'signup');
  const [isForgot, setIsForgot] = useState(false);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPW, setConfirmPW] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (confirmedEmail) setSuccess(t.emailConfirmed);
  }, [lang, confirmedEmail]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError(''); setSuccess('');
    try {
      if (isForgot) {
        const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin });
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
    fontSize: 14, fontFamily: 'inherit', background: TH.bg, color: TH.text, outline: 'none', boxSizing: 'border-box',
  };

  return (
    <div style={{ background: TH.surface, borderRadius: 20, border: '1px solid ' + TH.border, padding: 28, boxShadow: dark ? '0 8px 40px rgba(0,0,0,0.35)' : '0 8px 40px rgba(0,0,0,0.06)' }}>
      {/* Header inside card */}
      <div style={{ marginBottom: 20 }}>
        <h3 style={{ fontSize: 20, fontWeight: 800, color: TH.text, letterSpacing: '-0.01em', marginBottom: 3 }}>
          {isForgot ? t.forgotTitle : isLogin ? t.welcomeBack : t.createAccount}
        </h3>
        <p style={{ fontSize: 12, color: TH.textMuted }}>{isForgot ? t.forgotSub : isLogin ? t.loginSub : t.signupSub}</p>
      </div>

      {/* Lang toggle */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
        {['es', 'en'].map(l => (
          <button key={l} onClick={() => changeLang(l)} style={{
            padding: '4px 12px', fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
            border: '1px solid ' + (lang === l ? TH.accent : TH.border),
            background: lang === l ? TH.accentBg : 'transparent',
            color: lang === l ? TH.accent : TH.textMuted,
            borderRadius: l === 'es' ? '6px 0 0 6px' : '0 6px 6px 0',
          }}>{l.toUpperCase()}</button>
        ))}
      </div>

      <form onSubmit={handleSubmit}>
        {!isLogin && !isForgot && (
          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: TH.textSecondary, display: 'block', marginBottom: 5 }}>{t.username}</label>
            <input type="text" value={username} onChange={e => setUsername(e.target.value)}
              placeholder={t.usernamePH} style={inputStyle}
              onFocus={e => e.target.style.borderColor = TH.accent}
              onBlur={e => e.target.style.borderColor = TH.border} />
          </div>
        )}
        <div style={{ marginBottom: 14 }}>
          <label style={{ fontSize: 11, fontWeight: 600, color: TH.textSecondary, display: 'block', marginBottom: 5 }}>{t.email}</label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
            placeholder="you@email.com" style={inputStyle}
            onFocus={e => e.target.style.borderColor = TH.accent}
            onBlur={e => e.target.style.borderColor = TH.border} />
        </div>
        {!isForgot && (
          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: TH.textSecondary, display: 'block', marginBottom: 5 }}>{t.password}</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required
              placeholder={isLogin ? '••••••••' : t.pwPH} minLength={6} style={inputStyle}
              onFocus={e => e.target.style.borderColor = TH.accent}
              onBlur={e => e.target.style.borderColor = TH.border} />
          </div>
        )}
        {!isLogin && !isForgot && (
          <div style={{ marginBottom: 20 }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: TH.textSecondary, display: 'block', marginBottom: 5 }}>{t.confirmPW}</label>
            <input type="password" value={confirmPW} onChange={e => setConfirmPW(e.target.value)} required
              placeholder={t.confirmPH} minLength={6} style={inputStyle}
              onFocus={e => e.target.style.borderColor = TH.accent}
              onBlur={e => e.target.style.borderColor = TH.border} />
          </div>
        )}

        {error && <div style={{ padding: '8px 12px', background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.12)', borderRadius: 8, color: TH.red, fontSize: 12, marginBottom: 14 }}>{error}</div>}
        {success && <div style={{ padding: '8px 12px', background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.12)', borderRadius: 8, color: TH.green, fontSize: 12, marginBottom: 14 }}>{success}</div>}

        <button type="submit" disabled={loading} style={{
          width: '100%', padding: '13px', border: 'none', borderRadius: 10,
          background: loading ? TH.border : 'linear-gradient(135deg,' + TH.accentLight + ',' + TH.accent + ')',
          color: '#fff', fontWeight: 700, fontSize: 14, cursor: loading ? 'wait' : 'pointer',
          fontFamily: 'inherit', boxShadow: '0 2px 12px rgba(232,148,10,0.2)',
        }}>
          {loading ? '...' : isForgot ? t.sendReset : isLogin ? t.loginBtn : t.signupBtn}
        </button>
      </form>

      <div style={{ textAlign: 'center', marginTop: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {isForgot ? (
          <button onClick={() => { setIsForgot(false); setIsLogin(true); setError(''); setSuccess(''); }} style={{ background: 'none', border: 'none', color: TH.accent, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600 }}>
            {t.backToLogin}
          </button>
        ) : (
          <>
            {isLogin && (
              <button onClick={() => { setIsForgot(true); setError(''); setSuccess(''); }} style={{ background: 'none', border: 'none', color: TH.textMuted, fontSize: 11, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 500 }}>
                {t.forgotPW}
              </button>
            )}
            <button onClick={() => { setIsLogin(!isLogin); setError(''); setSuccess(''); setUsername(''); setConfirmPW(''); }} style={{ background: 'none', border: 'none', color: TH.accent, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600 }}>
              {isLogin ? t.toSignup : t.toLogin}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
