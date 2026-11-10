import { useState } from 'react';
import { supabase } from '../supabase';
import { usePrefs } from '../lib/prefs';

const COPY = {
  es: { title: 'Nueva contraseña', sub: 'Elegí una nueva contraseña para tu cuenta.', password: 'Nueva contraseña',
        confirm: 'Repetí la contraseña', hint: 'Mínimo 6 caracteres', submit: 'Actualizar contraseña', saving: 'Guardando…',
        mismatch: 'Las contraseñas no coinciden.', done: 'Contraseña actualizada. Te llevamos a iniciar sesión…',
        failed: 'No se pudo actualizar la contraseña. Pedí un enlace nuevo y probá otra vez.' },
  en: { title: 'Set a new password', sub: 'Choose a new password for your account.', password: 'New password',
        confirm: 'Repeat the password', hint: 'At least 6 characters', submit: 'Update password', saving: 'Saving…',
        mismatch: "Passwords don't match.", done: 'Password updated. Taking you to log in…',
        failed: "Couldn't update the password. Request a new link and try again." },
};

export default function ResetPasswordScreen({ onDone }) {
  const { lang } = usePrefs();
  const t = COPY[lang] || COPY.en;
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (busy || done) return;
    if (password !== confirm) { setError(t.mismatch); return; }
    setBusy(true); setError('');
    const { error: err } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (err) { setError(/at least/i.test(err.message) ? t.hint : t.failed); return; }
    setDone(true);
    setTimeout(onDone, 1800);
  };

  return (
    <div className="center-screen app">
      <div className="auth-card">
        <div className="auth-head">
          <span className="tag tag-accent">&#x2211; MASTERY MODULE</span>
          <h1>{t.title}</h1>
          <p>{t.sub}</p>
        </div>
        <form className="card" onSubmit={submit}>
          <label className="field">
            <span className="label">{t.password} <small>({t.hint})</small></span>
            <input className="input" type="password" value={password} minLength={6} required autoComplete="new-password"
              onChange={(e) => setPassword(e.target.value)} />
          </label>
          <label className="field">
            <span className="label">{t.confirm}</span>
            <input className="input" type="password" value={confirm} minLength={6} required autoComplete="new-password"
              onChange={(e) => setConfirm(e.target.value)} />
          </label>
          {error && <div className="alert alert-error" role="alert" style={{ marginTop: 16 }}>{error}</div>}
          {done && <div className="alert alert-ok" role="status" style={{ marginTop: 16 }}>{t.done}</div>}
          <button type="submit" className="btn btn-primary btn-block" style={{ marginTop: 20 }} disabled={busy || done}>
            {busy ? t.saving : t.submit}
          </button>
        </form>
      </div>
    </div>
  );
}
