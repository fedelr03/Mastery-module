import { useState, useEffect, useRef } from 'react';
import { supabase } from './supabase';
import { usePrefs } from './lib/prefs';

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
    navHow: 'Cómo funciona', navReview: 'Ejemplos', navFaq: 'Preguntas',
    login: 'Iniciar sesión', signup: 'Crear cuenta',
    heroTitle: 'Entendé cada tema como para explicárselo a un amigo.',
    heroSub: 'Escribís un tema de matemática, estadística, economía o finanzas. Mastery Module te lo explica desde cero, a tu nivel y con ejemplos de lo que te gusta, y después te toma un quiz para ver si quedó.',
    heroCta: 'Crear cuenta gratis', heroCta2: 'Ya tengo cuenta',
    heroNote: 'Gratis, en español o en inglés.',
    heroShotAlt: 'Captura de Mastery Module: la explicación de Derivadas, que arranca con una analogía de fútbol.',
    frameUrl: 'mastery-module.vercel.app',
    tourTitle: 'Así se ve por dentro',
    tourLead: 'Estas capturas son de la app, con una cuenta de prueba. Es lo mismo que vas a ver vos.',
    tour: [
      { key: 'home', title: 'Escribís el tema', desc: 'Lo que tenés que estudiar, con tus palabras. Si querés, sumás algo que te guste y los ejemplos salen de ahí. Elegís si tenés 2 minutos o media hora.', alt: 'Pantalla de inicio: el tema «Elasticidad precio de la demanda» escrito en la barra, con fútbol como interés y el modo Rápido elegido.' },
      { key: 'explain', title: 'Leés la explicación', desc: 'Arranca con una analogía, sigue con la definición y la fórmula, y cierra con un ejercicio resuelto paso a paso. Si algo no te cierra, tocás «No entendí» y te lo explica más simple.', alt: 'Explicación de Derivadas: analogía con un delantero, definición, fórmula del límite y un ejemplo resuelto.' },
      { key: 'quiz', title: 'Te tomás el quiz', desc: 'Cada respuesta se corrige al toque y te dice por qué. Después viene un examen más largo y, al final, te pide que lo expliques vos con tus palabras.', alt: 'Quiz corregido: una respuesta bien, otra mal, con la explicación de cada una.' },
      { key: 'review', title: 'Lo repasás antes de olvidarlo', desc: 'Cuando un tema está por olvidarse, la app te hace una pregunta nueva sobre él. Respondés de memoria, comparás con la respuesta modelo y calificás cómo te fue: eso decide cuándo vuelve.', alt: 'Tarjeta de repaso de Inflación: la respuesta del estudiante al lado de la respuesta modelo.' },
      { key: 'map', title: 'Ves todo en tu mapa', desc: 'Cada tema cuelga de su materia, con un color según cuánto lo sabés. Las líneas punteadas unen temas de materias distintas que comparten ideas, como derivadas y elasticidad.', alt: 'Mapa de conocimiento: materias con sus temas y una línea que une Derivadas con Elasticidad precio.' },
    ],
    demoTitle: 'Los ejemplos salen de lo que te gusta',
    demoLead: 'La misma idea, la derivada, explicada para tres personas distintas. Tocá un interés.',
    demoTopic: 'Derivada',
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
    homeworkTitle: 'Para la tarea de esta semana',
    hwPdfTitle: 'Subí la guía de ejercicios',
    hwPdfDesc: 'La app lee el PDF, agrupa los ejercicios por tipo y te enseña el método de cada grupo. Así el próximo lo resolvés solo.',
    hwPdfFile: 'Guia_3_Derivadas.pdf', hwPdfMeta: '40 ejercicios',
    hwPdfFound: 'Encontró 4 tipos de problema',
    hwPdfTypes: [['Regla de la potencia', 'ej. 1 a 12'], ['Regla de la cadena', 'ej. 13 a 24'], ['Producto y cociente', 'ej. 25 a 33'], ['Recta tangente', 'ej. 34 a 40']],
    hwExTitle: 'Pegá el ejercicio que no te sale',
    hwExDesc: 'Lo escribís tal cual está en la guía y te lo resuelve paso a paso, diciendo por qué se hace cada cosa.',
    hwExInput: 'Derivá f(x) = (3x² + 1)⁵',
    hwExSteps: [
      'Es una función adentro de otra: (algo)⁵, y adentro 3x² + 1. Va regla de la cadena.',
      'Derivás la de afuera dejando la de adentro igual: 5(3x² + 1)⁴.',
      'Multiplicás por la derivada de la de adentro: 6x.',
      'f′(x) = 30x(3x² + 1)⁴',
    ],
    depthTitle: 'Elegís cuánto tiempo tenés',
    depths: [
      { name: 'Lite', desc: 'Unos 2 minutos: la idea central, dos conceptos clave y tres preguntas.' },
      { name: 'Rápido', desc: 'Explicación completa, quiz y un examen de 5 preguntas.' },
      { name: 'Profundo', desc: 'Análisis a fondo, examen de 10 preguntas, desafíos y slides de resumen.' },
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
    navHow: 'How it works', navReview: 'Examples', navFaq: 'FAQ',
    login: 'Log in', signup: 'Sign up',
    heroTitle: 'Understand every topic well enough to explain it to a friend.',
    heroSub: 'Type a topic in math, statistics, economics or finance. Mastery Module explains it from scratch, at your level and with examples from things you like, then quizzes you to check it stuck.',
    heroCta: 'Create a free account', heroCta2: 'I have an account',
    heroNote: 'Free, in English or Spanish.',
    heroShotAlt: 'Screenshot of Mastery Module: the Derivatives explanation, opening with a football analogy.',
    frameUrl: 'mastery-module.vercel.app',
    tourTitle: 'What it looks like inside',
    tourLead: 'These are screenshots of the app with a test account. It is exactly what you will see.',
    tour: [
      { key: 'home', title: 'Type a topic', desc: 'Whatever you need to study, in your own words. Add something you like if you want, and the examples come from there. Pick whether you have 2 minutes or half an hour.', alt: 'Home screen: the topic "Price elasticity of demand" typed in, with football as the interest and Fast mode selected.' },
      { key: 'explain', title: 'Read the explanation', desc: 'It opens with an analogy, then the definition and the formula, and ends with a worked example step by step. If something does not click, tap "I didn\'t get it" for a simpler version.', alt: 'Derivatives explanation: a striker analogy, the definition, the limit formula and a worked example.' },
      { key: 'quiz', title: 'Take the quiz', desc: 'Every answer is graded on the spot and tells you why. Then comes a longer exam and, at the end, it asks you to explain the topic in your own words.', alt: 'Graded quiz: one answer right, one wrong, with the explanation for each.' },
      { key: 'review', title: 'Review it before you forget', desc: 'When a topic is about to slip, the app asks you a new question about it. You answer from memory, compare with the model answer and rate how it went: that decides when it comes back.', alt: 'Inflation review card: the student answer next to the model answer.' },
      { key: 'map', title: 'See everything on your map', desc: 'Each topic hangs from its subject, colored by how well you know it. Dashed lines join topics from different subjects that share ideas, like derivatives and elasticity.', alt: 'Knowledge map: subjects with their topics and a line linking Derivatives with Price elasticity.' },
    ],
    demoTitle: 'Examples come from what you like',
    demoLead: 'The same idea, the derivative, explained for three different people. Tap an interest.',
    demoTopic: 'Derivative',
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
    homeworkTitle: "For this week's homework",
    hwPdfTitle: 'Upload your problem set',
    hwPdfDesc: 'The app reads the PDF, groups the exercises by type and teaches you the method for each group, so you can solve the next one yourself.',
    hwPdfFile: 'Problem_set_3_Derivatives.pdf', hwPdfMeta: '40 exercises',
    hwPdfFound: 'Found 4 kinds of problem',
    hwPdfTypes: [['Power rule', 'ex. 1 to 12'], ['Chain rule', 'ex. 13 to 24'], ['Product and quotient', 'ex. 25 to 33'], ['Tangent line', 'ex. 34 to 40']],
    hwExTitle: 'Paste the exercise you are stuck on',
    hwExDesc: 'Type it exactly as it is in the problem set and it gets solved step by step, saying why each step happens.',
    hwExInput: 'Differentiate f(x) = (3x² + 1)⁵',
    hwExSteps: [
      'It is a function inside another: (something)⁵, with 3x² + 1 inside. Chain rule.',
      'Differentiate the outside and keep the inside as is: 5(3x² + 1)⁴.',
      'Multiply by the derivative of the inside: 6x.',
      'f′(x) = 30x(3x² + 1)⁴',
    ],
    depthTitle: 'Pick how much time you have',
    depths: [
      { name: 'Lite', desc: 'About 2 minutes: the core idea, two key concepts and three questions.' },
      { name: 'Fast', desc: 'Full explanation, a quiz and a 5-question exam.' },
      { name: 'Deep', desc: 'In-depth analysis, a 10-question exam, challenges and summary slides.' },
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
  :where(.lp) :where(h1, h2, h3) { font-family:'Bricolage Grotesque', system-ui, sans-serif; margin:0; color:var(--text); }
  :where(.lp) :where(p) { margin:0; }
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

  /* hero: copy on the left, the real app on the right, running off the bottom edge */
  .lp-hero { padding:64px 0 0; overflow:hidden; }
  .lp-hero-grid { display:grid; grid-template-columns:minmax(0,0.9fr) minmax(0,1.1fr); gap:56px; align-items:end; }
  .lp-hero-copy { padding:24px 0 72px; align-self:center; }
  .lp-hero h1 { font-size:clamp(36px, 5vw, 56px); line-height:1.04; letter-spacing:-0.03em; font-weight:800; max-width:14ch; }
  .lp-hero-sub { margin-top:22px; font-size:19px; color:var(--text2); max-width:32em; }
  .lp-hero-ctas { display:flex; flex-wrap:wrap; gap:12px; margin-top:32px; }
  .lp-hero-note { margin-top:14px; font-size:14px; color:var(--text2); }
  .lp-hero-shot { margin-bottom:-2px; }
  .lp-hero-shot .lp-frame { border-bottom-left-radius:0; border-bottom-right-radius:0; border-bottom:none; }
  .lp-hero-shot .lp-frame-img { aspect-ratio:1 / 0.95; }

  /* browser-ish frame around every screenshot: the URL says "this is the real app" */
  .lp-frame { border:1px solid var(--border); border-radius:14px; background:var(--surface); overflow:hidden;
              box-shadow:0 30px 60px -36px rgba(31,29,43,.45); }
  .lp-frame-bar { display:flex; align-items:center; gap:10px; height:34px; padding:0 12px; border-bottom:1px solid var(--border); background:var(--bg); }
  .lp-frame-bar i { width:9px; height:9px; border-radius:50%; background:var(--border); flex:none; }
  .lp-frame-bar span { flex:1; text-align:center; font-size:12.5px; color:var(--text2); margin-right:37px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
  .lp-frame-img { display:block; width:100%; height:auto; object-fit:cover; object-position:top center; background:var(--bg); }

  /* sections */
  .lp-section { padding:96px 0; border-top:1px solid var(--border); }
  .lp-h2 { font-size:clamp(30px, 3.6vw, 42px); line-height:1.1; letter-spacing:-0.025em; font-weight:800; max-width:20ch; }
  .lp-lead { margin-top:14px; font-size:18px; color:var(--text2); max-width:38em; }

  /* tour: the steps on the left pick the screenshot on the right */
  .lp-tour { display:grid; grid-template-columns:minmax(0,0.8fr) minmax(0,1.2fr); gap:48px; margin-top:44px; align-items:start; }
  .lp-tour-list { list-style:none; margin:0; padding:0; display:grid; gap:4px; }
  .lp-tour-btn { display:grid; grid-template-columns:34px 1fr; gap:4px 12px; width:100%; text-align:left; background:none; border:1px solid transparent;
                 border-radius:14px; padding:14px 16px; cursor:pointer; color:var(--text); }
  .lp-tour-btn:hover { background:var(--accentBg); }
  .lp-tour-btn[aria-selected="true"] { background:var(--surface); border-color:var(--border); box-shadow:0 10px 30px -22px rgba(31,29,43,.4); }
  .lp-tour-n { grid-row:span 2; width:30px; height:30px; border-radius:50%; display:grid; place-items:center; font-size:14px; font-weight:700;
               border:1.5px solid var(--border); color:var(--text2); margin-top:1px; }
  .lp-tour-btn[aria-selected="true"] .lp-tour-n { background:var(--accent); border-color:var(--accent); color:var(--onAccent); }
  .lp-tour-btn b { font-family:'Bricolage Grotesque', sans-serif; font-size:19px; font-weight:700; line-height:1.3; }
  .lp-tour-btn span.d { font-size:15.5px; color:var(--text2); line-height:1.55; display:none; }
  .lp-tour-btn[aria-selected="true"] span.d { display:block; }
  .lp-tour-stage { position:sticky; top:84px; }
  .lp-tour-stage .lp-frame-img { aspect-ratio:1 / 0.86; }
  .lp-tour-stage .lp-frame-img.is-wide { aspect-ratio:auto; }
  .lp-tour-m { display:none; }
  .lp-depths { margin-top:40px; display:grid; grid-template-columns:repeat(3, 1fr); gap:24px; padding-top:28px; border-top:1px solid var(--border); }
  .lp-depths strong { display:block; font-size:16px; }
  .lp-depths span { display:block; margin-top:4px; font-size:15px; color:var(--text2); }
  .lp-depths-t { grid-column:1 / -1; font-family:'Bricolage Grotesque', sans-serif; font-size:20px; font-weight:700; }

  /* interest demo */
  .lp-demo-grid { display:grid; grid-template-columns:minmax(0,0.9fr) minmax(0,1.1fr); gap:56px; align-items:center; }
  .lp-chips { display:flex; flex-wrap:wrap; gap:8px; margin-top:24px; }
  .lp-chip { border:1px solid var(--border); background:var(--surface); color:var(--text); border-radius:999px; padding:8px 16px; font-size:15px; font-weight:600; cursor:pointer; }
  .lp-chip[aria-pressed="true"] { background:var(--ink); border-color:var(--ink); color:var(--onInk); }
  .lp-bubble { position:relative; background:var(--surface); border:1px solid var(--border); border-radius:22px 22px 22px 6px; padding:26px 28px; }
  .lp-bubble h3 { font-size:26px; font-weight:800; letter-spacing:-0.02em; }
  .lp-formula { display:block; margin-top:2px; font-family:'Cambria Math','STIX Two Math','Times New Roman',serif; font-size:16px; color:var(--text2); overflow-wrap:anywhere; }
  .lp-bubble p { margin-top:16px; font-size:18px; line-height:1.65; min-height:7.4em; }
  .lp-bubble p.swap { animation:lpSwap .32s ease; }
  @keyframes lpSwap { from { opacity:0; transform:translateY(4px); } to { opacity:1; transform:none; } }

  .lp-subjects { display:grid; grid-template-columns:repeat(4, 1fr); gap:28px; margin-top:56px; padding-top:28px; border-top:1px solid var(--border); }
  .lp-subjects h3 { font-size:18px; font-weight:700; }
  .lp-subjects ul { list-style:none; margin:8px 0 0; padding:0; color:var(--text2); font-size:16px; }
  .lp-subjects li { padding:3px 0; }

  /* homework: two worked examples drawn like the app */
  .lp-hw { display:grid; grid-template-columns:1fr 1fr; gap:28px; margin-top:40px; }
  .lp-hw-item h3 { font-size:22px; font-weight:700; }
  .lp-hw-item > p { margin-top:8px; color:var(--text2); font-size:16px; max-width:30em; }
  .lp-hw-demo { margin-top:20px; background:var(--surface); border:1px solid var(--border); border-radius:16px; padding:18px; }
  .lp-file { display:flex; align-items:center; gap:12px; padding:12px 14px; border-radius:12px; background:var(--bg); }
  .lp-file svg { flex:none; color:var(--red); }
  .lp-file b { display:block; font-size:15px; overflow-wrap:anywhere; }
  .lp-file small { display:block; font-size:13.5px; color:var(--text2); }
  .lp-found { margin:16px 2px 8px; font-size:14px; font-weight:600; color:var(--text2); }
  .lp-types { list-style:none; margin:0; padding:0; }
  .lp-types li { display:flex; justify-content:space-between; gap:12px; padding:10px 2px; border-top:1px solid var(--border); font-size:15.5px; }
  .lp-types li span { color:var(--text2); font-size:14px; white-space:nowrap; }
  .lp-ask { display:flex; align-items:center; gap:10px; padding:12px 14px; border-radius:12px; border:1.5px solid var(--border); background:var(--bg); font-size:16px; font-weight:600; }
  .lp-ask svg { flex:none; color:var(--text2); }
  .lp-steps { list-style:none; margin:14px 0 0; padding:0; display:grid; gap:10px; }
  .lp-steps li { display:grid; grid-template-columns:26px 1fr; gap:10px; font-size:15.5px; line-height:1.5; }
  .lp-steps li i { font-style:normal; width:26px; height:26px; border-radius:8px; display:grid; place-items:center; font-size:13px; font-weight:700;
                   background:var(--accentBg); color:var(--accentText); }
  .lp-steps li.is-result { font-family:'Cambria Math','STIX Two Math','Times New Roman',serif; font-size:18px; font-weight:700; }
  .lp-steps li.is-result i { background:var(--accent); color:var(--onAccent); font-family:'DM Sans', sans-serif; }

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
    .lp-hero { padding-top:32px; }
    .lp-hero-copy { padding:8px 0 36px; }
    .lp-hero-grid, .lp-demo-grid, .lp-final-grid, .lp-hw { grid-template-columns:1fr; gap:36px; }
    .lp-hero-grid { gap:0; }
    .lp-tour { grid-template-columns:1fr; gap:0; }
    .lp-tour-list, .lp-tour-stage { display:none; }
    .lp-tour-m { display:grid; gap:44px; list-style:none; margin:0; padding:0; }
    .lp-tour-m h3 { display:flex; align-items:center; gap:12px; font-size:22px; font-weight:700; }
    .lp-tour-m h3 .lp-tour-n { background:var(--accent); border-color:var(--accent); color:var(--onAccent); }
    .lp-tour-m p { margin:8px 0 16px; color:var(--text2); font-size:16px; }
    .lp-tour-m .lp-frame-img { aspect-ratio:1 / 0.9; }
    .lp-tour-m .lp-frame-img.is-wide { aspect-ratio:auto; }
    .lp-subjects { grid-template-columns:repeat(2, 1fr); }
    .lp-depths { grid-template-columns:1fr; gap:16px; }
    .lp-section, .lp-final { padding:64px 0; }
    .lp-links { display:none; }
  }
  @media (max-width: 520px) {
    .lp-nav-right .lp-hide-sm { display:none; }
    .lp-nav-in { gap:8px; }
    .lp-logo span:last-child { display:none; }
    .lp-seg button { padding:6px 8px; }
    .lp-subjects { gap:20px; }
    .lp-bubble { padding:20px; }
    .lp-bubble p { min-height:10em; font-size:17px; }
  }
  @media (prefers-reduced-motion: reduce) { .lp-bubble p.swap { animation:none; } html { scroll-behavior:auto; } }
`;

/* ═══════════ PAGE ═══════════ */
export default function LandingPage({ confirmedEmail, initialForm }) {
  const { lang, dark, setLang: changeLang, setDark } = usePrefs();
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

  const toggleDark = () => setDark(!dark);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const scrollTo = (ref) => ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  const goToAuth = (mode) => { setAuthForgot(false); if (mode) setAuthMode(mode); scrollTo(authRef); };
  const pickInterest = (k) => { if (k !== interest) { setInterest(k); setSwapKey((n) => n + 1); } };

  const demo = t.demo.find((d) => d.key === interest) || t.demo[0];

  const [tourStep, setTourStep] = useState(0);
  /* Arrow keys move between the tour's tabs, like any tab list. */
  const tourKeys = (e) => {
    const n = t.tour.length;
    const next = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 }[e.key];
    if (!next && e.key !== 'Home' && e.key !== 'End') return;
    e.preventDefault();
    const i = e.key === 'Home' ? 0 : e.key === 'End' ? n - 1 : (tourStep + next + n) % n;
    setTourStep(i);
    document.getElementById('tour-tab-' + t.tour[i].key)?.focus();
  };

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
            <div className="lp-seg" role="group" aria-label={t.langLabel}>
              {['es', 'en'].map((l) => (
                <button key={l} aria-pressed={lang === l} onClick={() => changeLang(l)}>{l.toUpperCase()}</button>
              ))}
            </div>
            <button className="lp-icon-btn" onClick={toggleDark} aria-label={dark ? t.themeLight : t.themeDark} title={dark ? t.themeLight : t.themeDark}>
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
            <div className="lp-hero-copy">
              <h1>{t.heroTitle}</h1>
              <p className="lp-hero-sub">{t.heroSub}</p>
              <div className="lp-hero-ctas">
                <button className="lp-btn lp-btn-primary" onClick={() => goToAuth('signup')}>{t.heroCta}</button>
                <button className="lp-btn lp-btn-ghost" onClick={() => goToAuth('login')}>{t.heroCta2}</button>
              </div>
              <p className="lp-hero-note">{t.heroNote}</p>
            </div>
            <div className="lp-hero-shot">
              <Shot name="hero" dark={dark} lang={lang} alt={t.heroShotAlt} url={t.frameUrl} eager />
            </div>
          </div>
        </section>

        {/* ── TOUR ── */}
        <section className="lp-section" ref={howRef} style={{ scrollMarginTop: 64 }}>
          <div className="lp-wrap">
            <h2 className="lp-h2">{t.tourTitle}</h2>
            <p className="lp-lead">{t.tourLead}</p>
            <div className="lp-tour">
              <ol className="lp-tour-list" role="tablist" aria-orientation="vertical" aria-label={t.tourTitle} onKeyDown={tourKeys}>
                {t.tour.map((st, i) => (
                  <li key={st.key} role="presentation">
                    <button id={'tour-tab-' + st.key} role="tab" className="lp-tour-btn" aria-selected={tourStep === i} aria-controls="tour-panel"
                      tabIndex={tourStep === i ? 0 : -1} onClick={() => setTourStep(i)}>
                      <span className="lp-tour-n" aria-hidden="true">{i + 1}</span>
                      <b>{st.title}</b>
                      <span className="d">{st.desc}</span>
                    </button>
                  </li>
                ))}
              </ol>
              <div className="lp-tour-stage" id="tour-panel" role="tabpanel" aria-labelledby={'tour-tab-' + t.tour[tourStep].key}>
                <Shot name={t.tour[tourStep].key} dark={dark} lang={lang} alt={t.tour[tourStep].alt} url={t.frameUrl} />
              </div>
              <ol className="lp-tour-m">
                {t.tour.map((st, i) => (
                  <li key={st.key}>
                    <h3><span className="lp-tour-n" aria-hidden="true">{i + 1}</span>{st.title}</h3>
                    <p>{st.desc}</p>
                    <Shot name={st.key} dark={dark} lang={lang} alt={st.alt} url={t.frameUrl} />
                  </li>
                ))}
              </ol>
            </div>
            <div className="lp-depths">
              <h3 className="lp-depths-t">{t.depthTitle}</h3>
              {t.depths.map((d) => (
                <div key={d.name}><strong>{d.name}</strong><span>{d.desc}</span></div>
              ))}
            </div>
          </div>
        </section>

        {/* ── INTERESTS ── */}
        <section className="lp-section" ref={reviewRef} style={{ scrollMarginTop: 64 }}>
          <div className="lp-wrap">
            <div className="lp-demo-grid">
              <div>
                <h2 className="lp-h2">{t.demoTitle}</h2>
                <p className="lp-lead">{t.demoLead}</p>
                <div className="lp-chips" role="group" aria-label={t.demoTitle}>
                  {t.demo.map((d) => (
                    <button key={d.key} className="lp-chip" aria-pressed={interest === d.key} onClick={() => pickInterest(d.key)}>{d.label}</button>
                  ))}
                </div>
              </div>
              <div className="lp-bubble">
                <h3>{t.demoTopic}</h3>
                <span className="lp-formula" aria-label="f prima de x igual al límite cuando h tiende a cero de f de x más h menos f de x, sobre h">
                  f&prime;(x) = lim<sub>h&rarr;0</sub> (f(x+h) &minus; f(x)) / h
                </span>
                <p key={swapKey} className={swapKey ? 'swap' : ''} aria-live="polite">{demo.text}</p>
              </div>
            </div>
            <div className="lp-subjects">
              {t.subjects.map((sub) => (
                <div key={sub.name}>
                  <h3>{sub.name}</h3>
                  <ul>{sub.topics.map((x) => <li key={x}>{x}</li>)}</ul>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── HOMEWORK ── */}
        <section className="lp-section">
          <div className="lp-wrap">
            <h2 className="lp-h2">{t.homeworkTitle}</h2>
            <div className="lp-hw">
              <div className="lp-hw-item">
                <h3>{t.hwPdfTitle}</h3>
                <p>{t.hwPdfDesc}</p>
                <div className="lp-hw-demo" aria-hidden="true">
                  <div className="lp-file">
                    <svg width="26" height="30" viewBox="0 0 26 30" fill="none"><path d="M3 1h13l7 7v19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V3a2 2 0 0 1 2-2z" fill="currentColor" opacity=".14" stroke="currentColor" strokeWidth="1.5"/><path d="M16 1v7h7" stroke="currentColor" strokeWidth="1.5"/><text x="12" y="23" fontSize="7" fontWeight="700" textAnchor="middle" fill="currentColor" fontFamily="DM Sans, sans-serif">PDF</text></svg>
                    <div><b>{t.hwPdfFile}</b><small>{t.hwPdfMeta}</small></div>
                  </div>
                  <p className="lp-found">{t.hwPdfFound}</p>
                  <ul className="lp-types">
                    {t.hwPdfTypes.map(([name, range]) => <li key={name}>{name}<span>{range}</span></li>)}
                  </ul>
                </div>
              </div>
              <div className="lp-hw-item">
                <h3>{t.hwExTitle}</h3>
                <p>{t.hwExDesc}</p>
                <div className="lp-hw-demo" aria-hidden="true">
                  <div className="lp-ask">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>
                    {t.hwExInput}
                  </div>
                  <ol className="lp-steps">
                    {t.hwExSteps.map((st, i) => (
                      <li key={i} className={i === t.hwExSteps.length - 1 ? 'is-result' : ''}><i>{i === t.hwExSteps.length - 1 ? '=' : i + 1}</i><span>{st}</span></li>
                    ))}
                  </ol>
                </div>
              </div>
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

/* ═══════════ SCREENSHOT ═══════════
   Real screenshots of the app (scripts/shots/capture.py makes them), in the visitor's theme and language. */
const SHOT_SIZE = { hero: [1200, 1230], home: [1400, 1478], explain: [1400, 1522], quiz: [1400, 1591], review: [1256, 1156], map: [1400, 935] };
function Shot({ name, dark, lang, alt, url, eager }) {
  const [w, h] = SHOT_SIZE[name] || [1400, 1000];
  return (
    <figure className="lp-frame" style={{ margin: 0 }}>
      <div className="lp-frame-bar" aria-hidden="true"><i /><i /><i /><span>{url}</span></div>
      <img className={'lp-frame-img' + (w / h > 1.2 ? ' is-wide' : '')} src={`/screens/${name}-${dark ? 'dark' : 'light'}${lang === 'en' ? '-en' : ''}.webp`}
        width={w} height={h} alt={alt} loading={eager ? 'eager' : 'lazy'} fetchpriority={eager ? 'high' : undefined} decoding="async" />
    </figure>
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
