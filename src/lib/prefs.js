/* ═══════════════════════════════════════════════════
   prefs.js — language and light/dark mode, in one place.

   Before, every screen read localStorage on its own and they could
   disagree. Now there is a single store: any component calls
   usePrefs() and re-renders when a preference changes.
   ═══════════════════════════════════════════════════ */
import { useSyncExternalStore } from 'react';

const read = (key) => { try { return localStorage.getItem(key); } catch { return null; } };
const write = (key, value) => { try { localStorage.setItem(key, value); } catch { /* private mode */ } };

function initialDark() {
  const saved = read('mm_dark');
  if (saved === 'true' || saved === 'false') return saved === 'true';
  // First visit: follow the device setting.
  return typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-color-scheme: dark)').matches;
}

function initialLang() {
  const saved = read('mm_lang');
  if (saved === 'es' || saved === 'en') return saved;
  const nav = (typeof navigator !== 'undefined' && navigator.language) || 'es';
  return nav.toLowerCase().startsWith('en') ? 'en' : 'es';
}

let state = { lang: initialLang(), dark: initialDark() };
const listeners = new Set();

function apply() {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  root.dataset.theme = state.dark ? 'dark' : 'light';
  root.lang = state.lang;
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', state.dark ? '#15141c' : '#f7f5f0');
}
apply();

function set(patch) {
  state = { ...state, ...patch };
  apply();
  listeners.forEach((fn) => fn());
}

export function setLang(lang) {
  if (lang !== 'es' && lang !== 'en') return;
  write('mm_lang', lang);
  set({ lang });
}

export function setDark(dark) {
  write('mm_dark', String(!!dark));
  set({ dark: !!dark });
}

const subscribe = (fn) => { listeners.add(fn); return () => listeners.delete(fn); };
const snapshot = () => state;

export function usePrefs() {
  const s = useSyncExternalStore(subscribe, snapshot, snapshot);
  return { lang: s.lang, dark: s.dark, setLang, setDark };
}
