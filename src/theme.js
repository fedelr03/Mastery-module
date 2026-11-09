/* ═══════════════════════════════════════════════════
   theme.js — one source of truth for colors.

   The real values live in src/styles/app.css as CSS variables
   (light under :root, dark under [data-theme="dark"]).
   TH maps the old token names to those variables so any inline
   style follows the active theme without re-rendering.
   ═══════════════════════════════════════════════════ */

export const TH = {
  bg: 'var(--bg)', bgAlt: 'var(--bg-alt)', surface: 'var(--surface)',
  border: 'var(--border)', borderLight: 'var(--border-light)', borderAccent: 'var(--accent-border)',
  text: 'var(--text)', textSecondary: 'var(--text-2)', textMuted: 'var(--text-3)', textFaint: 'var(--text-4)',
  accent: 'var(--accent)', accentLight: 'var(--accent-light)', accentBg: 'var(--accent-bg)',
  accentBgStrong: 'var(--accent-bg-strong)', accentText: 'var(--accent-text)', onAccent: 'var(--on-accent)',
  purple: 'var(--purple)', green: 'var(--green)', red: 'var(--red)', pink: 'var(--pink)', cyan: 'var(--cyan)',
  greenText: 'var(--green-text)', redText: 'var(--red-text)', greenBg: 'var(--green-bg)', redBg: 'var(--red-bg)',
  topBar: 'var(--bar-bg)', shadow: 'var(--shadow-sm)', cardShadow: 'var(--shadow-card)',
};

/* Rotating accent colors for numbered blocks. */
export const AC = [TH.accentLight, TH.purple, TH.green, TH.red, TH.pink, TH.cyan];

/* A color at N% opacity. Works with CSS variables (hex+alpha suffixes don't). */
export const alpha = (color, pct) => `color-mix(in srgb, ${color} ${pct}%, transparent)`;

/* ── Subjects ── */
export const SUBJECT_IDS = ['math', 'stats', 'econ', 'finance', 'general'];

export const SUBJECT_NAME = {
  es: { math: 'Matemática', stats: 'Estadística', econ: 'Economía', finance: 'Finanzas', general: 'General' },
  en: { math: 'Math', stats: 'Statistics', econ: 'Economics', finance: 'Finance', general: 'General' },
};

export const subjectName = (id, lang) =>
  (SUBJECT_NAME[lang] || SUBJECT_NAME.en)[id] || (SUBJECT_NAME[lang] || SUBJECT_NAME.en).general;

/* Readable text color per subject (passes AA on its own tinted background). */
export const SUBJECT_INK = {
  light: { general: '#475569', math: '#8f5400', stats: '#3730a3', econ: '#047857', finance: '#0e7490' },
  dark: { general: '#b6c2d2', math: '#f5a623', stats: '#a5b4fc', econ: '#34d399', finance: '#22d3ee' },
};
