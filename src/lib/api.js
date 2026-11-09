/* ═══════════════════════════════════════════════════
   api.js — the only place the browser talks to /api/claude.

   Fixes two old problems:
   1. Each call used the token saved when the page loaded. After about
      an hour that token expires and every request failed with
      "Invalid session". Now the current token is read on every call.
   2. When the server answered with something that wasn't JSON (a
      timeout page, for example) the user saw a cryptic parser error.
   ═══════════════════════════════════════════════════ */
import { supabase } from '../supabase';

export async function getAccessToken() {
  try {
    const { data } = await supabase.auth.getSession();
    return data?.session?.access_token || '';
  } catch {
    return '';
  }
}

/** Reads a fetch Response as JSON; turns non-JSON answers into a clear error. */
export async function readJson(res) {
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    if (res.status === 504 || res.status === 408) throw new Error('Request timed out');
    throw new Error('Service unavailable (' + res.status + ')');
  }
}

/** Text of a Claude answer (joins the text blocks). */
export const textOf = (data) => (data?.content || []).map((b) => b.text || '').join('');

/**
 * POST to /api/claude. Returns the parsed body (which may carry `.error`).
 * `token` is optional: pass one to reuse it across parallel calls.
 */
export async function postClaude(body, { signal, token } = {}) {
  const auth = token ?? (await getAccessToken());
  const res = await fetch('/api/claude', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + auth },
    body: JSON.stringify(body),
    signal,
  });
  return readJson(res);
}

/** Error message from a /api/claude body, or '' when there is none. */
export function apiError(data) {
  if (!data || !data.error) return '';
  return typeof data.error === 'string' ? data.error : data.error.message || 'Error';
}

/* ── User-facing error text, in both languages ── */
const ERRORS = [
  [/Límite diario|Daily budget/i, null], // already written for the user by the server
  [/timed out|AbortError|aborted/i, {
    es: 'La respuesta tardó demasiado. Probá de nuevo en un ratito.',
    en: 'That took too long. Please try again in a moment.' }],
  [/Invalid session|Not authenticated|log in/i, {
    es: 'Tu sesión venció. Volvé a iniciar sesión y probá de nuevo.',
    en: 'Your session expired. Log in again and retry.' }],
  [/Too many requests/i, {
    es: 'Hiciste varios pedidos seguidos. Esperá unos segundos y volvé a probar.',
    en: 'Too many requests in a row. Wait a few seconds and try again.' }],
  [/Account blocked/i, {
    es: 'Tu cuenta está suspendida. Escribile al administrador si creés que es un error.',
    en: 'Your account is suspended. Contact the administrator if you think this is a mistake.' }],
  [/Could not verify your session/i, {
    es: 'No pudimos verificar tu sesión. Probá de nuevo en un momento.',
    en: "We couldn't verify your session. Try again in a moment." }],
  [/refusal/i, {
    es: 'La IA no puede responder sobre ese tema. Probá con otro enfoque o con un tema de mate, estadística, economía o finanzas.',
    en: "The AI can't answer that one. Try another angle or a math, statistics, economics or finance topic." }],
  [/Failed to reach|unavailable|overloaded|529|502|503/i, {
    es: 'El servicio de IA está saturado ahora. Probá de nuevo en un minuto.',
    en: 'The AI service is busy right now. Try again in a minute.' }],
  [/Empty response|Could not parse/i, {
    es: 'La respuesta llegó incompleta. Probá de nuevo, suele andar al segundo intento.',
    en: 'The answer arrived incomplete. Try again; it usually works the second time.' }],
  [/Failed to fetch|NetworkError|Load failed/i, {
    es: 'No hay conexión con el servidor. Revisá tu internet y probá de nuevo.',
    en: "Can't reach the server. Check your connection and try again." }],
];

export function friendlyError(raw, lang) {
  const m = String(raw || '');
  const l = lang === 'es' ? 'es' : 'en';
  for (const [re, txt] of ERRORS) {
    if (re.test(m)) return txt ? txt[l] : m;
  }
  return l === 'es' ? 'Algo falló al generar el módulo. Probá de nuevo.' : 'Something went wrong. Please try again.';
}
