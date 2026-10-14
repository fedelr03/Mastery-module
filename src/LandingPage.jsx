import { useState, useEffect, useRef } from 'react';
import { supabase } from './supabase';

/* ═══════════ THEME TOKENS ═══════════
   Same brand as the app (cream paper, orange, Bricolage Grotesque),
   with text colors that pass WCAG AA contrast. The orange is used for
   fills and accents; text that must read as "orange" uses accentText. */
const LIGHT = {
  bg: '#f7f5f0', surface: '#fffdf8', border: '#e4ded4', borderLight: '#ece8e0', grid: 'rgba(31,29,43,0.06)',
  text: '#1f1d2b', textSecondary: '#55536a', textMuted: '#55536a',
  accent: '#e8940a', accentLight: '#f5a623', accentText: '#8f5400', accentBg: 'rgba(232,148,10,0.10)',
  onAccent: '#1f1d2b', ink: '#1f1d2b', onInk: '#ffffff',
  red: '#b42318', green: '#15803d',
};
const DARK = {
  bg: '#15141c', surface: '#1f1e28', border: '#2e2c3a', borderLight: '#26252f', grid: 'rgba(236,235,243,0.06)',
  text: '#ecebf3', textSecondary: '#b4b2c4', textMuted: '#b4b2c4',
  accent: '#f5a623', accentLight: '#f5a623', accentText: '#f5a623', accentBg: 'rgba(245,166,35,0.12)',
  onAccent: '#15141c', ink: '#0d0c12', onInk: '#ecebf3',
  red: '#f87171', green: '#4ade80',
};
const getTheme = (dark) => (dark ? DARK : LIGHT);

/* ═══════════ COPY ═══════════ */
const T = {
  es: {
    navHow: 'Cómo funciona', navReview: 'Repaso', navFaq: 'Preguntas',
    login: 'Iniciar sesión', signup: 'Crear cuenta',
    heroTitle: 'Entendé cada tema como para explicárselo a un amigo.',
    heroSub: 'Escribís un tema de matemática, estadística, economía o finanzas. Mastery Module te lo explica desde cero, a tu nivel y con ejemplos de lo que te gusta, y después te toma un quiz para ver si quedó.',
    heroCta: 'Crear cuenta gratis', heroCta2: 'Ya tengo cuenta',
    heroNote: 'Gratis, en español o en inglés.',
    demoLabel: 'Probalo acá: elegí qué te gusta',
    demoTopic: 'Derivada',
    demoFoot: 'La misma idea, explicada con tus intereses. En la app lo hacés con cualquier tema.',
    demo: [
      { key: 'futbol', label: 'Fútbol', text: 'Un delantero arranca a correr hacia el arco y su posición cambia todo el tiempo. La derivada te dice qué tan rápido está cambiando en un instante exacto: la velocidad que marcaría un radar justo en el momento en que patea.' },
      { key: 'cocina', label: 'Cocina', text: 'Ponés agua a hervir y anotás la temperatura cada minuto. La derivada es qué tan rápido sube la temperatura en un momento puntual, por ejemplo cuántos grados gana por segundo justo antes de que empiece a burbujear.' },
      { key: 'musica', label: 'Música', text: 'Una canción va subiendo de volumen. La derivada mide qué tan rápido crece el volumen en cada instante: en el fade-in del principio es chica, y cuando entra el estribillo se dispara.' },
    ],
    subjectsTitle: 'Qué podés estudiar',
    subjects: [
      { name: 'Matemática', topics: ['Derivadas', 'Integrales', 'Álgebra de matrices', 'Logaritmos'] },
      { name: 'Estadística', topics: ['Distribución normal', 'Teorema de Bayes', 'Test de hipótesis', 'Regresión'] },
      { name: 'Economía', topics: ['Oferta y demanda', 'Elasticidad', 'Política monetaria', 'Estructuras de mercado'] },
      { name: 'Finanzas', topics: ['Valuación por DCF', 'Ratios financieros', 'Valuación de opciones', 'Teoría de portfolio'] },
    ],
    howTitle: 'Cómo funciona',
    steps: [
      { title: 'Escribí un tema', desc: 'Mientras más concreto, mejor: «Elasticidad precio de la demanda» rinde más que «Economía». También podés subir el PDF de la guía de ejercicios o pegar el ejercicio que no te sale.' },
      { title: 'Leé y practicá', desc: 'La explicación viene por partes, con ejemplos resueltos paso a paso. Si algo no te cierra, tocás «No entendí» y te lo explica más simple. Después hacés el quiz y el examen, y cada respuesta trae su corrección.' },
      { title: 'Repasalo antes de olvidarlo', desc: 'Sumás el tema a tu mazo de repaso y la app te lo vuelve a preguntar cuando estás por olvidarlo.' },
    ],
    depthTitle: 'Elegís cuánto tiempo tenés',
    depths: [
      { name: 'Lite', desc: 'Unos 2 minutos: la idea central, dos conceptos clave y tres preguntas.' },
      { name: 'Rápido', desc: 'Explicación completa, quiz y un examen de 5 preguntas.' },
      { name: 'Profundo', desc: 'Análisis a fondo, examen de 10 preguntas, desafíos y slides de resumen.' },
    ],
    reviewTitle: 'El repaso se organiza solo',
    reviewText: 'Cada tarjeta te hace una pregunta nueva sobre algo que ya estudiaste. Respondés de memoria, la comparás con la respuesta modelo y te calificás. Con esa calificación, la app decide cuándo volver a preguntarte.',
    intervalsTitle: 'Según cómo te fue, la tarjeta vuelve:',
    intervals: [
      { r: 'Olvidé', when: 'mañana' },
      { r: 'Difícil', when: 'un poco más adelante' },
      { r: 'Bien', when: 'en unos días' },
      { r: 'Fácil', when: 'en semanas' },
    ],
    mapTitle: 'Y todo queda en tu mapa',
    mapText: 'Los temas que estudiaste se ordenan por materia, con un color según cuánto los dominás. Tocás cualquiera y lo retomás donde lo dejaste.',
    cardTopic: 'Derivadas', cardQ: '¿Qué representa geométricamente la derivada?',
    cardYours: 'Tu respuesta', cardYoursText: 'La pendiente de la recta tangente en ese punto.',
    cardModel: 'Respuesta modelo', cardModelText: 'La tasa de cambio instantánea: la pendiente de la recta tangente a la curva en ese punto.',
    cardRate: '¿Qué tan bien lo recordaste?',
    homeworkTitle: 'Para la tarea de esta semana',
    homework: [
      { title: 'Subí la guía de ejercicios', desc: '¿Tenés un PDF con 40 ejercicios? Subilo. La app reconoce qué tipo de problemas son y te enseña el método para resolverlos, así el próximo lo sacás vos.' },
      { title: 'Pegá el ejercicio que no te sale', desc: 'Lo escribís en la barra y te lo resuelve paso a paso, explicando por qué se hace cada cosa. Ideal para el que entra seguro en el parcial.' },
    ],
    faqTitle: 'Preguntas frecuentes',
    faq: [
      { q: '¿Es gratis?', a: 'Sí. Te registrás con tu email y empezás. Hay un límite de uso diario para que el servicio alcance para todos, y se renueva todos los días a las 21 h (hora de Argentina).' },
      { q: '¿Tengo que saber algo antes?', a: 'No. En tu perfil elegís si sos principiante, intermedio o avanzado, y las explicaciones se ajustan: con principiante usa analogías con cosas cotidianas, y con avanzado va directo a la notación formal.' },
      { q: '¿Qué es la técnica Feynman?', a: 'Un método de estudio que se le atribuye al físico Richard Feynman: intentás explicar un tema con palabras simples y, donde te trabás, ahí está lo que te falta entender. Por eso, después de cada explicación, la app te pide que lo expliques vos.' },
      { q: '¿En qué idioma está?', a: 'En español rioplatense o en inglés. Lo cambiás cuando quieras desde tu perfil o desde arriba de esta página.' },
      { q: '¿La IA se puede equivocar?', a: 'Sí, puede pasar, sobre todo en cuentas largas. Por eso los ejemplos vienen resueltos paso a paso, para que puedas seguirlos y verificarlos.' },
    ],
    finalTitle: 'Probalo con el tema que tenés que estudiar ahora',
    finalSub: 'Crear la cuenta lleva menos de un minuto.',
    footer: 'Mastery Module',
    themeDark: 'Activar modo oscuro', themeLight: 'Activar modo claro', langLabel: 'Idioma',
    /* auth form */
    welcomeBack: 'Hola de nuevo', createAccount: 'Crear cuenta',
    loginSub: 'Iniciá sesión para seguir estudiando.', signupSub: 'Con tu email, en menos de un minuto.',
    username: 'Nombre de usuario', usernamePH: 'Cómo te van a ver los demás',
    email: 'Email', password: 'Contraseña', confirmPW: 'Repetí la contraseña',
    pwPH: 'Mínimo 6 caracteres', confirmPH: 'La misma de arriba',
    loginBtn: 'Iniciar sesión', signupBtn: 'Crear cuenta gratis',
    toSignup: '¿No tenés cuenta? Creá una', toLogin: '¿Ya tenés cuenta? Iniciá sesión',
    forgotPW: 'Me olvidé la contraseña', forgotTitle: 'Recuperar contraseña',
    forgotSub: 'Poné tu email y te mandamos un link para crear una nueva.',
    sendReset: 'Mandar link', resetSent: 'Listo. Revisá tu email, ahí está el link para cambiar la contraseña.',
    backToLogin: 'Volver a iniciar sesión',
    notYou: '¿No sos vos? Usar otra cuenta',
    emailExists: 'Ya hay una cuenta con este email. Probá iniciar sesión.',
    signupOk: 'Cuenta creada. Te mandamos un email para confirmarla; después ya podés iniciar sesión.',
    pwMismatch: 'Las contraseñas no coinciden.',
    emailConfirmed: 'Email confirmado. Ya podés iniciar sesión.',
    errInvalid: 'El email o la contraseña no son correctos.',
    errNotConfirmed: 'Todavía no confirmaste tu email. Buscá el mensaje que te mandamos (fijate en spam).',
    errRate: 'Hiciste varios intentos seguidos. Esperá un minuto y probá de nuevo.',
    errNetwork: 'No hay conexión con el servidor. Revisá tu internet y probá de nuevo.',
    errGeneric: 'Algo falló. Probá de nuevo en un momento.',
  },
  en: {
    navHow: 'How it works', navReview: 'Review', navFaq: 'FAQ',
    login: 'Log in', signup: 'Sign up',
    heroTitle: 'Understand every topic well enough to explain it to a friend.',
    heroSub: 'Type a topic in math, statistics, economics or finance. Mastery Module explains it from scratch, at your level and with examples from things you like, then quizzes you to check it stuck.',
    heroCta: 'Create a free account', heroCta2: 'I have an account',
    heroNote: 'Free, in English or Spanish.',
    demoLabel: 'Try it: pick something you like',
    demoTopic: 'Derivative',
    demoFoot: 'The same idea, explained through your interests. In the app it works with any topic.',
    demo: [
      { key: 'futbol', label: 'Football', text: 'A striker sprints toward goal and his position keeps changing. The derivative tells you how fast it is changing at one exact instant: the speed a radar would show right as he shoots.' },
      { key: 'cocina', label: 'Cooking', text: 'You put water on to boil and write down the temperature every minute. The derivative is how fast the temperature is rising at one moment, say how many degrees per second it gains just before it starts to bubble.' },
      { key: 'musica', label: 'Music', text: 'A song keeps getting louder. The derivative measures how fast the volume grows at each instant: small during the slow fade-in, then it shoots up when the chorus kicks in.' },
    ],
    subjectsTitle: 'What you can study',
    subjects: [
      { name: 'Math', topics: ['Derivatives', 'Integrals', 'Matrix algebra', 'Logarithms'] },
      { name: 'Statistics', topics: ['Normal distribution', "Bayes' theorem", 'Hypothesis testing', 'Regression'] },
      { name: 'Economics', topics: ['Supply and demand', 'Elasticity', 'Monetary policy', 'Market structures'] },
      { name: 'Finance', topics: ['DCF valuation', 'Financial ratios', 'Options pricing', 'Portfolio theory'] },
    ],
    howTitle: 'How it works',
    steps: [
      { title: 'Type a topic', desc: 'The more specific the better: "Price elasticity of demand" works better than "Economics". You can also upload a PDF problem set or paste the exercise you are stuck on.' },
      { title: 'Read and practice', desc: 'The explanation comes in parts, with worked examples step by step. If something does not click, tap "I didn\'t get it" for a simpler version. Then take the quiz and the exam, with feedback on every answer.' },
      { title: 'Review it before you forget', desc: 'Add the topic to your review deck and the app asks you about it again right when you are about to forget it.' },
    ],
    depthTitle: 'Pick how much time you have',
    depths: [
      { name: 'Lite', desc: 'About 2 minutes: the core idea, two key concepts and three questions.' },
      { name: 'Fast', desc: 'Full explanation, a quiz and a 5-question exam.' },
      { name: 'Deep', desc: 'In-depth analysis, a 10-question exam, challenges and summary slides.' },
    ],
    reviewTitle: 'Review that schedules itself',
    reviewText: 'Each card asks you a fresh question about something you already studied. You answer from memory, compare it with the model answer and rate yourself. That rating decides when the app asks you again.',
    intervalsTitle: 'Depending on how it went, the card comes back:',
    intervals: [
      { r: 'Forgot', when: 'tomorrow' },
      { r: 'Hard', when: 'a bit later' },
      { r: 'Good', when: 'in a few days' },
      { r: 'Easy', when: 'in weeks' },
    ],
    mapTitle: 'And everything lands on your map',
    mapText: 'The topics you studied are grouped by subject and colored by how well you know them. Tap any of them to pick up where you left off.',
    cardTopic: 'Derivatives', cardQ: 'What does the derivative represent geometrically?',
    cardYours: 'Your answer', cardYoursText: 'The slope of the tangent line at that point.',
    cardModel: 'Model answer', cardModelText: 'The instantaneous rate of change: the slope of the line tangent to the curve at that point.',
    cardRate: 'How well did you remember it?',
    homeworkTitle: "For this week's homework",
    homework: [
      { title: 'Upload your problem set', desc: 'Got a PDF with 40 exercises? Upload it. The app works out what kind of problems they are and teaches you the method, so you can solve the next one yourself.' },
      { title: 'Paste the exercise you are stuck on', desc: 'Type it into the bar and it gets solved step by step, explaining why each step happens. Perfect for the one that is sure to be on the exam.' },
    ],
    faqTitle: 'Questions',
    faq: [
      { q: 'Is it free?', a: 'Yes. Sign up with your email and start. There is a daily usage limit so the service stays available for everyone; it resets every day at midnight UTC.' },
      { q: 'Do I need to know anything first?', a: 'No. In your profile you choose beginner, intermediate or advanced and explanations adapt: beginner uses everyday analogies, advanced goes straight to formal notation.' },
      { q: 'What is the Feynman technique?', a: 'A study method attributed to physicist Richard Feynman: you try to explain a topic in plain words, and wherever you get stuck is what you still need to understand. That is why, after each explanation, the app asks you to explain it yourself.' },
      { q: 'Which languages?', a: 'English or Rioplatense Spanish. Switch any time from your profile or from the top of this page.' },
      { q: 'Can the AI make mistakes?', a: 'Yes, it can happen, especially in long calculations. That is why examples are worked out step by step, so you can follow and check them.' },
    ],
    finalTitle: 'Try it with the topic you need to study right now',
    finalSub: 'Creating an account takes less than a minute.',
    footer: 'Mastery Module',
    themeDark: 'Switch to dark mode', themeLight: 'Switch to light mode', langLabel: 'Language',
    welcomeBack: 'Welcome back', createAccount: 'Create account',
    loginSub: 'Log in to keep studying.', signupSub: 'With your email, in under a minute.',
    username: 'Username', usernamePH: 'How others will see you',
    email: 'Email', password: 'Password', confirmPW: 'Repeat password',
    pwPH: 'At least 6 characters', confirmPH: 'Same as above',
    loginBtn: 'Log in', signupBtn: 'Create free account',
    toSignup: 'No account yet? Create one', toLogin: 'Already have an account? Log in',
    forgotPW: 'I forgot my password', forgotTitle: 'Reset password',
    forgotSub: 'Enter your email and we will send you a link to set a new one.',
    sendReset: 'Send link', resetSent: 'Done. Check your email for the link to change your password.',
    backToLogin: 'Back to log in',
    notYou: 'Not you? Use another account',
    emailExists: 'There is already an account with this email. Try logging in.',
    signupOk: 'Account created. We sent you an email to confirm it; after that you can log in.',
    pwMismatch: "Passwords don't match.",
    emailConfirmed: 'Email confirmed. You can log in now.',
    errInvalid: 'The email or password is not correct.',
    errNotConfirmed: "You haven't confirmed your email yet. Look for the message we sent you (check spam).",
    errRate: 'Too many attempts in a row. Wait a minute and try again.',
    errNetwork: "Can't reach the server. Check your connection and try again.",
    errGeneric: 'Something went wrong. Try again in a moment.',
  },
};

/* Supabase auth errors come in English; show them in the user's language. */
function authErrorText(err, t) {
  const m = String(err?.message || '');
  if (/invalid login credentials/i.test(m)) return t.errInvalid;
  if (/email not confirmed/i.test(m)) return t.errNotConfirmed;
  if (/rate limit|too many/i.test(m)) return t.errRate;
  if (/failed to fetch|network|load failed/i.test(m)) return t.errNetwork;
  if (/password should be at least/i.test(m)) return t.pwPH;
  return t.errGeneric;
}

/* ═══════════ STYLES ═══════════ */
const css = (TH) => `
  .lp { --bg:${TH.bg}; --surface:${TH.surface}; --border:${TH.border}; --grid:${TH.grid};
        --text:${TH.text}; --text2:${TH.textSecondary}; --accent:${TH.accent}; --accentText:${TH.accentText};
        --accentBg:${TH.accentBg}; --onAccent:${TH.onAccent}; --ink:${TH.ink}; --onInk:${TH.onInk};
        min-height:100vh; background:var(--bg); color:var(--text);
        font-family:'DM Sans', system-ui, sans-serif; font-size:17px; line-height:1.6;
        -webkit-font-smoothing:antialiased; }
  .lp *, .lp *::before, .lp *::after { box-sizing:border-box; }
  .lp h1, .lp h2, .lp h3 { font-family:'Bricolage Grotesque', system-ui, sans-serif; margin:0; color:var(--text); }
  .lp p { margin:0; }
  .lp a { color:inherit; }
  .lp button { font-family:inherit; }
  .lp :focus-visible { outline:3px solid var(--accent); outline-offset:2px; border-radius:6px; }
  .lp-wrap { max-width:1080px; margin:0 auto; padding:0 20px; }

  /* nav */
  .lp-nav { position:sticky; top:0; z-index:50; background:color-mix(in srgb, var(--bg) 92%, transparent);
            backdrop-filter:blur(10px); border-bottom:1px solid transparent; transition:border-color .2s; }
  .lp-nav.is-scrolled { border-bottom-color:var(--border); }
  .lp-nav-in { display:flex; align-items:center; gap:12px; height:64px; }
  .lp-logo { display:flex; align-items:center; gap:8px; font-weight:700; font-size:17px; text-decoration:none; color:var(--text); }
  .lp-logo-mark { font-family:'Bricolage Grotesque', sans-serif; font-size:24px; font-weight:800; color:var(--accent); line-height:1; }
  .lp-links { display:flex; gap:4px; margin-left:20px; }
  .lp-link { background:none; border:none; color:var(--text2); font-size:15px; padding:8px 10px; border-radius:8px; cursor:pointer; }
  .lp-link:hover { color:var(--text); background:var(--accentBg); }
  .lp-nav-right { margin-left:auto; display:flex; align-items:center; gap:8px; }
  .lp-seg { display:flex; border:1px solid var(--border); border-radius:8px; overflow:hidden; }
  .lp-seg button { background:none; border:none; padding:6px 10px; font-size:13px; font-weight:600; color:var(--text2); cursor:pointer; }
  .lp-seg button[aria-pressed="true"] { background:var(--accentBg); color:var(--accentText); }
  .lp-icon-btn { width:36px; height:36px; display:grid; place-items:center; border:1px solid var(--border); border-radius:8px; background:none; color:var(--text2); cursor:pointer; }
  .lp-btn { display:inline-flex; align-items:center; justify-content:center; gap:8px; border-radius:10px; font-weight:700;
            font-size:16px; padding:13px 22px; cursor:pointer; border:1px solid transparent; text-decoration:none; }
  .lp-btn-primary { background:var(--accent); color:var(--onAccent); }
  .lp-btn-primary:hover { filter:brightness(1.06); }
  .lp-btn-ghost { background:transparent; color:var(--text); border-color:var(--border); }
  .lp-btn-ghost:hover { border-color:var(--text2); }
  .lp-btn-sm { font-size:14px; padding:8px 14px; }

  /* hero */
  .lp-hero { padding:72px 0 64px; }
  .lp-hero-grid { display:grid; grid-template-columns:1.1fr 1fr; gap:56px; align-items:center; }
  .lp-hero h1 { font-size:clamp(36px, 5.2vw, 58px); line-height:1.04; letter-spacing:-0.03em; font-weight:800; max-width:14ch; }
  .lp-hero-sub { margin-top:22px; font-size:19px; color:var(--text2); max-width:34em; }
  .lp-hero-ctas { display:flex; flex-wrap:wrap; gap:12px; margin-top:32px; }
  .lp-hero-note { margin-top:14px; font-size:14px; color:var(--text2); }

  .lp-demo { position:relative; border:1px solid var(--border); border-radius:18px; background-color:var(--surface);
             background-image:linear-gradient(var(--grid) 1px, transparent 1px), linear-gradient(90deg, var(--grid) 1px, transparent 1px);
             background-size:22px 22px; padding:26px; box-shadow:0 18px 50px -24px rgba(31,29,43,.25); }
  .lp-demo-label { font-size:14px; font-weight:600; color:var(--text2); }
  .lp-chips { display:flex; flex-wrap:wrap; gap:8px; margin-top:10px; }
  .lp-chip { border:1px solid var(--border); background:var(--surface); color:var(--text); border-radius:999px; padding:7px 15px; font-size:15px; font-weight:600; cursor:pointer; }
  .lp-chip[aria-pressed="true"] { background:var(--accent); border-color:var(--accent); color:var(--onAccent); }
  .lp-demo-topic { margin-top:22px; display:flex; align-items:baseline; justify-content:space-between; gap:12px; flex-wrap:wrap; }
  .lp-demo-topic h3 { font-size:28px; font-weight:800; letter-spacing:-0.02em; }
  .lp-formula { font-family:'Cambria Math','STIX Two Math','Times New Roman',serif; font-size:17px; color:var(--text2); white-space:nowrap; }
  .lp-demo-text { margin-top:12px; font-size:17px; line-height:1.65; background:var(--surface); border-left:3px solid var(--accent); padding:12px 14px; border-radius:0 10px 10px 0; min-height:9.5em; }
  .lp-demo-text.swap { animation:lpSwap .32s ease; }
  .lp-demo-foot { margin-top:14px; font-size:14px; color:var(--text2); }
  @keyframes lpSwap { from { opacity:0; transform:translateY(4px); } to { opacity:1; transform:none; } }

  /* sections */
  .lp-section { padding:88px 0; border-top:1px solid var(--border); }
  .lp-h2 { font-size:clamp(30px, 3.6vw, 42px); line-height:1.1; letter-spacing:-0.025em; font-weight:800; max-width:20ch; }
  .lp-lead { margin-top:16px; font-size:18px; color:var(--text2); max-width:36em; }

  .lp-subjects { display:grid; grid-template-columns:repeat(4, 1fr); gap:28px; margin-top:36px; }
  .lp-subjects h3 { font-size:20px; font-weight:700; padding-bottom:10px; border-bottom:2px solid var(--accent); }
  .lp-subjects ul { list-style:none; margin:12px 0 0; padding:0; color:var(--text2); font-size:16px; }
  .lp-subjects li { padding:4px 0; }

  .lp-steps { display:grid; grid-template-columns:repeat(3, 1fr); gap:36px; margin-top:44px; counter-reset:step; }
  .lp-step-n { font-family:'Bricolage Grotesque', sans-serif; font-size:44px; font-weight:800; color:var(--accent); line-height:1; }
  .lp-step h3 { font-size:22px; font-weight:700; margin-top:14px; }
  .lp-step p { margin-top:10px; color:var(--text2); font-size:16px; }
  .lp-depths { margin-top:56px; border:1px solid var(--border); border-radius:16px; background:var(--surface); padding:24px 26px; }
  .lp-depths h3 { font-size:19px; font-weight:700; }
  .lp-depth-row { display:grid; grid-template-columns:repeat(3, 1fr); gap:24px; margin-top:16px; }
  .lp-depth-row strong { display:block; font-size:16px; }
  .lp-depth-row span { display:block; margin-top:4px; font-size:15px; color:var(--text2); }

  .lp-review-grid { display:grid; grid-template-columns:1fr 1fr; gap:56px; align-items:start; }
  .lp-intervals { margin-top:28px; }
  .lp-intervals p { font-size:15px; font-weight:600; color:var(--text2); }
  .lp-intervals ol { list-style:none; padding:0; margin:12px 0 0; display:grid; gap:8px; }
  .lp-intervals li { display:grid; grid-template-columns:96px 1fr; align-items:center; gap:12px; font-size:16px; }
  .lp-intervals .bar { height:10px; border-radius:6px; background:var(--accent); }
  .lp-intervals .lbl { font-weight:700; }
  .lp-intervals .when { display:flex; align-items:center; gap:10px; color:var(--text2); }
  .lp-map { margin-top:36px; padding-top:28px; border-top:1px solid var(--border); }
  .lp-map h3 { font-size:20px; font-weight:700; }
  .lp-map p { margin-top:8px; color:var(--text2); font-size:16px; }

  .lp-card { border:1px solid var(--border); border-radius:18px; background:var(--surface); padding:24px; box-shadow:0 18px 50px -28px rgba(31,29,43,.3); }
  .lp-card-topic { display:inline-block; font-size:13px; font-weight:700; color:var(--accentText); background:var(--accentBg); border-radius:999px; padding:3px 10px; }
  .lp-card-q { margin-top:14px; font-size:19px; font-weight:700; line-height:1.35; font-family:'Bricolage Grotesque', sans-serif; }
  .lp-card-block { margin-top:14px; border-radius:10px; padding:10px 12px; background:var(--bg); }
  .lp-card-block b { display:block; font-size:13px; color:var(--text2); }
  .lp-card-block span { display:block; margin-top:3px; font-size:15px; }
  .lp-card-rate { margin-top:16px; font-size:13px; font-weight:600; color:var(--text2); }
  .lp-card-btns { display:grid; grid-template-columns:repeat(4, 1fr); gap:6px; margin-top:8px; }
  .lp-card-btns span { text-align:center; font-size:14px; font-weight:600; border:1px solid var(--border); border-radius:8px; padding:8px 4px; }
  .lp-card-btns span.on { border-color:var(--accent); background:var(--accentBg); color:var(--accentText); }

  .lp-hw { display:grid; grid-template-columns:1fr 1fr; gap:40px; margin-top:36px; }
  .lp-hw div { border-left:3px solid var(--accent); padding-left:20px; }
  .lp-hw h3 { font-size:21px; font-weight:700; }
  .lp-hw p { margin-top:8px; color:var(--text2); font-size:16px; }

  .lp-faq { margin-top:28px; max-width:760px; }
  .lp-faq details { border-bottom:1px solid var(--border); }
  .lp-faq summary { cursor:pointer; list-style:none; padding:20px 36px 20px 0; font-size:19px; font-weight:700; position:relative; font-family:'Bricolage Grotesque', sans-serif; }
  .lp-faq summary::-webkit-details-marker { display:none; }
  .lp-faq summary::after { content:'+'; position:absolute; right:4px; top:16px; font-size:26px; font-weight:400; color:var(--accentText); }
  .lp-faq details[open] summary::after { content:'−'; }
  .lp-faq details p { padding:0 0 20px; color:var(--text2); font-size:16px; max-width:40em; }

  .lp-final { background:var(--ink); color:var(--onInk); padding:88px 0; }
  .lp-final-grid { display:grid; grid-template-columns:1fr 420px; gap:56px; align-items:center; }
  .lp-final h2 { color:var(--onInk); font-size:clamp(30px, 3.6vw, 44px); line-height:1.1; letter-spacing:-0.025em; font-weight:800; }
  .lp-final p { margin-top:14px; font-size:18px; opacity:.85; }
  .lp-footer { padding:28px 0; font-size:14px; color:var(--text2); }

  @media (max-width: 900px) {
    .lp-hero { padding:40px 0 48px; }
    .lp-hero-grid, .lp-review-grid, .lp-final-grid { grid-template-columns:1fr; gap:36px; }
    .lp-subjects { grid-template-columns:repeat(2, 1fr); }
    .lp-steps, .lp-depth-row, .lp-hw { grid-template-columns:1fr; gap:28px; }
    .lp-section, .lp-final { padding:60px 0; }
    .lp-links { display:none; }
  }
  @media (max-width: 520px) {
    .lp-nav-right .lp-hide-sm { display:none; }
    .lp-subjects { grid-template-columns:1fr 1fr; gap:20px; }
    .lp-demo { padding:20px; }
    .lp-demo-text { min-height:12em; }
  }
  @media (prefers-reduced-motion: reduce) { .lp-demo-text.swap { animation:none; } html { scroll-behavior:auto; } }
`;

/* ═══════════ PAGE ═══════════ */
export default function LandingPage({ confirmedEmail, initialForm }) {
  const [lang, setLang] = useState(() => localStorage.getItem('mm_lang') || 'es');
  const [dark, setDark] = useState(() => localStorage.getItem('mm_dark') === 'true');
  const [scrolled, setScrolled] = useState(false);
  const [interest, setInterest] = useState('futbol');
  const [swapKey, setSwapKey] = useState(0);

  const [isReturning, setIsReturning] = useState(() => localStorage.getItem('mm_returning') === '1');
  const [rememberedEmail, setRememberedEmail] = useState(() => localStorage.getItem('mm_last_email') || '');
  const handleClearReturning = () => { setIsReturning(false); setRememberedEmail(''); };
  const [authMode, setAuthMode] = useState(() => (isReturning && !initialForm ? 'login' : initialForm || 'signup'));
  const [authForgot, setAuthForgot] = useState(false);

  const TH = getTheme(dark);
  const t = T[lang] || T.es;

  const authRef = useRef(null);
  const howRef = useRef(null);
  const reviewRef = useRef(null);
  const faqRef = useRef(null);

  const changeLang = (l) => { setLang(l); localStorage.setItem('mm_lang', l); };
  const toggleDark = () => { const n = !dark; setDark(n); localStorage.setItem('mm_dark', String(n)); };

  useEffect(() => { document.documentElement.lang = lang; }, [lang]);
  useEffect(() => { document.body.style.background = TH.bg; }, [dark]);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const scrollTo = (ref) => ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  const goToAuth = (mode) => { setAuthForgot(false); if (mode) setAuthMode(mode); scrollTo(authRef); };
  const pickInterest = (k) => { if (k !== interest) { setInterest(k); setSwapKey((n) => n + 1); } };

  const demo = t.demo.find((d) => d.key === interest) || t.demo[0];
  const barWidths = ['8%', '22%', '48%', '100%'];

  return (
    <div className="lp">
      <style>{css(TH)}</style>

      <header className={'lp-nav' + (scrolled ? ' is-scrolled' : '')}>
        <div className="lp-wrap lp-nav-in">
          <a className="lp-logo" href="/" aria-label="Mastery Module">
            <span className="lp-logo-mark" aria-hidden="true">&#x2211;</span>
            <span>Mastery Module</span>
          </a>
          <nav className="lp-links" aria-label="Secciones">
            <button className="lp-link" onClick={() => scrollTo(howRef)}>{t.navHow}</button>
            <button className="lp-link" onClick={() => scrollTo(reviewRef)}>{t.navReview}</button>
            <button className="lp-link" onClick={() => scrollTo(faqRef)}>{t.navFaq}</button>
          </nav>
          <div className="lp-nav-right">
            <div className="lp-seg lp-hide-sm" role="group" aria-label={t.langLabel}>
              {['es', 'en'].map((l) => (
                <button key={l} aria-pressed={lang === l} onClick={() => changeLang(l)}>{l.toUpperCase()}</button>
              ))}
            </div>
            <button className="lp-icon-btn lp-hide-sm" onClick={toggleDark} aria-label={dark ? t.themeLight : t.themeDark} title={dark ? t.themeLight : t.themeDark}>
              {dark ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><circle cx="12" cy="12" r="4.5"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z"/></svg>
              )}
            </button>
            <button className="lp-btn lp-btn-ghost lp-btn-sm" onClick={() => goToAuth('login')}>{t.login}</button>
            <button className="lp-btn lp-btn-primary lp-btn-sm lp-hide-sm" onClick={() => goToAuth('signup')}>{t.signup}</button>
          </div>
        </div>
      </header>

      <main>
        {/* ── HERO ── */}
        <section className="lp-hero">
          <div className="lp-wrap lp-hero-grid">
            <div>
              <h1>{t.heroTitle}</h1>
              <p className="lp-hero-sub">{t.heroSub}</p>
              <div className="lp-hero-ctas">
                <button className="lp-btn lp-btn-primary" onClick={() => goToAuth('signup')}>{t.heroCta}</button>
                <button className="lp-btn lp-btn-ghost" onClick={() => goToAuth('login')}>{t.heroCta2}</button>
              </div>
              <p className="lp-hero-note">{t.heroNote}</p>
            </div>

            <div className="lp-demo">
              <p className="lp-demo-label" id="demo-label">{t.demoLabel}</p>
              <div className="lp-chips" role="group" aria-labelledby="demo-label">
                {t.demo.map((d) => (
                  <button key={d.key} className="lp-chip" aria-pressed={interest === d.key} onClick={() => pickInterest(d.key)}>{d.label}</button>
                ))}
              </div>
              <div className="lp-demo-topic">
                <h3>{t.demoTopic}</h3>
                <span className="lp-formula" aria-label="f prima de x igual al límite cuando h tiende a cero de f de x más h menos f de x, sobre h">
                  f&prime;(x) = lim<sub>h&rarr;0</sub> (f(x+h) &minus; f(x)) / h
                </span>
              </div>
              <p key={swapKey} className={'lp-demo-text' + (swapKey ? ' swap' : '')} aria-live="polite">{demo.text}</p>
              <p className="lp-demo-foot">{t.demoFoot}</p>
            </div>
          </div>
        </section>

        {/* ── SUBJECTS ── */}
        <section className="lp-section">
          <div className="lp-wrap">
            <h2 className="lp-h2">{t.subjectsTitle}</h2>
            <div className="lp-subjects">
              {t.subjects.map((s) => (
                <div key={s.name}>
                  <h3>{s.name}</h3>
                  <ul>{s.topics.map((x) => <li key={x}>{x}</li>)}</ul>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── HOW IT WORKS ── */}
        <section className="lp-section" ref={howRef} style={{ scrollMarginTop: 64 }}>
          <div className="lp-wrap">
            <h2 className="lp-h2">{t.howTitle}</h2>
            <ol className="lp-steps" style={{ listStyle: 'none', padding: 0, margin: '44px 0 0' }}>
              {t.steps.map((s, i) => (
                <li key={s.title} className="lp-step">
                  <span className="lp-step-n" aria-hidden="true">{i + 1}</span>
                  <h3>{s.title}</h3>
                  <p>{s.desc}</p>
                </li>
              ))}
            </ol>
            <div className="lp-depths">
              <h3>{t.depthTitle}</h3>
              <div className="lp-depth-row">
                {t.depths.map((d) => (
                  <div key={d.name}><strong>{d.name}</strong><span>{d.desc}</span></div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── REVIEW ── */}
        <section className="lp-section" ref={reviewRef} style={{ scrollMarginTop: 64 }}>
          <div className="lp-wrap lp-review-grid">
            <div>
              <h2 className="lp-h2">{t.reviewTitle}</h2>
              <p className="lp-lead">{t.reviewText}</p>
              <div className="lp-intervals">
                <p>{t.intervalsTitle}</p>
                <ol>
                  {t.intervals.map((iv, i) => (
                    <li key={iv.r}>
                      <span className="lbl">{iv.r}</span>
                      <span className="when"><span className="bar" style={{ width: barWidths[i] }} aria-hidden="true" />{iv.when}</span>
                    </li>
                  ))}
                </ol>
              </div>
              <div className="lp-map">
                <h3>{t.mapTitle}</h3>
                <p>{t.mapText}</p>
              </div>
            </div>
            <div className="lp-card" aria-hidden="true">
              <span className="lp-card-topic">{t.cardTopic}</span>
              <p className="lp-card-q">{t.cardQ}</p>
              <div className="lp-card-block"><b>{t.cardYours}</b><span>{t.cardYoursText}</span></div>
              <div className="lp-card-block"><b>{t.cardModel}</b><span>{t.cardModelText}</span></div>
              <p className="lp-card-rate">{t.cardRate}</p>
              <div className="lp-card-btns">
                {t.intervals.map((iv, i) => <span key={iv.r} className={i === 2 ? 'on' : ''}>{iv.r}</span>)}
              </div>
            </div>
          </div>
        </section>

        {/* ── HOMEWORK ── */}
        <section className="lp-section">
          <div className="lp-wrap">
            <h2 className="lp-h2">{t.homeworkTitle}</h2>
            <div className="lp-hw">
              {t.homework.map((h) => (
                <div key={h.title}><h3>{h.title}</h3><p>{h.desc}</p></div>
              ))}
            </div>
          </div>
        </section>

        {/* ── FAQ ── */}
        <section className="lp-section" ref={faqRef} style={{ scrollMarginTop: 64 }}>
          <div className="lp-wrap">
            <h2 className="lp-h2">{t.faqTitle}</h2>
            <div className="lp-faq">
              {t.faq.map((f) => (
                <details key={f.q}><summary>{f.q}</summary><p>{f.a}</p></details>
              ))}
            </div>
          </div>
        </section>

        {/* ── FINAL CTA + AUTH ── */}
        <section className="lp-final" ref={authRef} style={{ scrollMarginTop: 64 }}>
          <div className="lp-wrap lp-final-grid">
            <div>
              <h2>{t.finalTitle}</h2>
              <p>{t.finalSub}</p>
            </div>
            <AuthForm
              TH={TH} dark={dark} lang={lang} t={t}
              confirmedEmail={confirmedEmail}
              mode={authMode} setMode={setAuthMode}
              forgot={authForgot} setForgot={setAuthForgot}
              isReturning={isReturning} rememberedEmail={rememberedEmail}
              onClearReturning={handleClearReturning}
            />
          </div>
        </section>
      </main>

      <footer className="lp-footer">
        <div className="lp-wrap" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className="lp-logo-mark" style={{ fontSize: 18 }} aria-hidden="true">&#x2211;</span>
          <span>{t.footer} &copy; {new Date().getFullYear()}</span>
        </div>
      </footer>
    </div>
  );
}

/* ═══════════ AUTH FORM ═══════════ */
function AuthForm({ TH, dark, lang, t, confirmedEmail, mode, setMode, forgot, setForgot, isReturning, rememberedEmail, onClearReturning }) {
  const isLogin = mode === 'login';
  const isForgot = !!forgot;

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState(rememberedEmail || '');
  const [password, setPassword] = useState('');
  const [confirmPW, setConfirmPW] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const emailRef = useRef(null);
  const passwordRef = useRef(null);

  useEffect(() => {
    if (confirmedEmail) setSuccess(t.emailConfirmed);
  }, [lang, confirmedEmail]);

  useEffect(() => {
    if (isReturning && isLogin && !isForgot && email && passwordRef.current) {
      passwordRef.current.focus({ preventScroll: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { setError(''); setSuccess(''); }, [mode, forgot]);

  const handleNotYou = () => {
    localStorage.removeItem('mm_returning');
    localStorage.removeItem('mm_last_email');
    setEmail(''); setPassword('');
    onClearReturning?.();
    setTimeout(() => emailRef.current?.focus(), 0);
  };

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
        localStorage.setItem('mm_returning', '1');
        localStorage.setItem('mm_last_email', email);
      } else {
        if (password !== confirmPW) { setError(t.pwMismatch); setLoading(false); return; }
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        if (data?.user?.identities?.length === 0) {
          setError(t.emailExists);
        } else {
          if (username.trim()) localStorage.setItem('mm_pending_username', username.trim());
          localStorage.setItem('mm_last_email', email);
          setSuccess(t.signupOk);
        }
      }
    } catch (err) {
      setError(authErrorText(err, t));
    }
    setLoading(false);
  };

  const label = { fontSize: 14, fontWeight: 600, color: TH.textSecondary, display: 'block', marginBottom: 6 };
  const input = {
    width: '100%', padding: '12px 14px', border: '1px solid ' + TH.border, borderRadius: 10,
    fontSize: 16, fontFamily: 'inherit', background: TH.bg, color: TH.text, boxSizing: 'border-box',
  };
  const linkBtn = { background: 'none', border: 'none', color: TH.accentText, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600, padding: 4 };
  const quietBtn = { ...linkBtn, color: TH.textSecondary, fontWeight: 500 };
  const showNotYou = isReturning && isLogin && !isForgot && email && email === rememberedEmail;

  return (
    <div style={{ background: TH.surface, color: TH.text, borderRadius: 18, border: '1px solid ' + TH.border, padding: 28, boxShadow: dark ? '0 8px 40px rgba(0,0,0,0.35)' : '0 8px 40px rgba(0,0,0,0.12)' }}>
      <h3 style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.01em', color: TH.text }}>
        {isForgot ? t.forgotTitle : isLogin ? t.welcomeBack : t.createAccount}
      </h3>
      <p style={{ fontSize: 15, color: TH.textSecondary, marginTop: 4, marginBottom: 20 }}>
        {isForgot ? t.forgotSub : isLogin ? t.loginSub : t.signupSub}
      </p>

      <form onSubmit={handleSubmit}>
        {!isLogin && !isForgot && (
          <div style={{ marginBottom: 14 }}>
            <label htmlFor="mm-username" style={label}>{t.username}</label>
            <input id="mm-username" type="text" autoComplete="username" value={username} onChange={(e) => setUsername(e.target.value)} placeholder={t.usernamePH} style={input} />
          </div>
        )}
        <div style={{ marginBottom: 14 }}>
          <label htmlFor="mm-email" style={label}>{t.email}</label>
          <input id="mm-email" ref={emailRef} type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="vos@email.com" style={input} />
        </div>
        {!isForgot && (
          <div style={{ marginBottom: 14 }}>
            <label htmlFor="mm-password" style={label}>{t.password}</label>
            <input id="mm-password" ref={passwordRef} type="password" autoComplete={isLogin ? 'current-password' : 'new-password'} value={password} onChange={(e) => setPassword(e.target.value)} required
              placeholder={isLogin ? '' : t.pwPH} minLength={6} style={input} />
          </div>
        )}
        {!isLogin && !isForgot && (
          <div style={{ marginBottom: 18 }}>
            <label htmlFor="mm-confirm" style={label}>{t.confirmPW}</label>
            <input id="mm-confirm" type="password" autoComplete="new-password" value={confirmPW} onChange={(e) => setConfirmPW(e.target.value)} required
              placeholder={t.confirmPH} minLength={6} style={input} />
          </div>
        )}

        {error && <div role="alert" style={{ padding: '10px 12px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 8, color: TH.red, fontSize: 14, marginBottom: 14 }}>{error}</div>}
        {success && <div role="status" style={{ padding: '10px 12px', background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.25)', borderRadius: 8, color: TH.green, fontSize: 14, marginBottom: 14 }}>{success}</div>}

        <button type="submit" disabled={loading} className="lp-btn lp-btn-primary" style={{ width: '100%', opacity: loading ? 0.6 : 1, cursor: loading ? 'wait' : 'pointer' }}>
          {loading ? '…' : isForgot ? t.sendReset : isLogin ? t.loginBtn : t.signupBtn}
        </button>
      </form>

      <div style={{ textAlign: 'center', marginTop: 14, display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'center' }}>
        {isForgot ? (
          <button type="button" onClick={() => { setForgot(false); setMode('login'); }} style={linkBtn}>{t.backToLogin}</button>
        ) : (
          <>
            {isLogin && <button type="button" onClick={() => setForgot(true)} style={quietBtn}>{t.forgotPW}</button>}
            {showNotYou && <button type="button" onClick={handleNotYou} style={quietBtn}>{t.notYou}</button>}
            <button type="button" onClick={() => { setMode(isLogin ? 'signup' : 'login'); setUsername(''); setConfirmPW(''); }} style={linkBtn}>
              {isLogin ? t.toSignup : t.toLogin}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
