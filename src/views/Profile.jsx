import { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { usePrefs } from '../lib/prefs';
import { IconSun, IconMoon, IconCheck } from '../components/icons';

const COPY = {
  es: {
    title: 'Mi perfil', sub: 'Tu cuenta y cómo querés que te expliquen.',
    account: 'Cuenta', email: 'Email', change: 'Cambiar', cancel: 'Cancelar',
    newEmail: 'Nuevo email', newEmailPH: 'tu@nuevoemail.com', sendConfirm: 'Enviar confirmación',
    emailSent: 'Te mandamos un mail a la dirección nueva para confirmar el cambio.',
    emailFailed: 'No se pudo cambiar el email. Revisá la dirección y probá de nuevo.',
    username: 'Nombre', usernameHint: 'aparece arriba en lugar de tu email', usernamePH: 'ej. Fede, Profe',
    level: 'Tu nivel', levelSub: 'Cambia cómo se escriben las explicaciones.',
    beginner: 'Principiante', beginnerDesc: 'Lenguaje simple y muchos ejemplos',
    intermediate: 'Intermedio', intermediateDesc: 'Equilibrio entre intuición y notación',
    advanced: 'Avanzado', advancedDesc: 'Técnico, sin repasar lo básico',
    prefs: 'Preferencias', language: 'Idioma', languageSub: 'De la app y de las explicaciones',
    theme: 'Apariencia', themeSub: 'Se guarda en este dispositivo', light: 'Claro', dark: 'Oscuro',
    save: 'Guardar cambios', saving: 'Guardando…', saved: 'Guardado',
    saveFailed: 'No se pudieron guardar los cambios. Revisá la conexión y probá de nuevo.',
    unsaved: 'Tenés cambios sin guardar',
  },
  en: {
    title: 'My profile', sub: 'Your account and how you want things explained.',
    account: 'Account', email: 'Email', change: 'Change', cancel: 'Cancel',
    newEmail: 'New email', newEmailPH: 'you@newemail.com', sendConfirm: 'Send confirmation',
    emailSent: 'We sent an email to the new address to confirm the change.',
    emailFailed: "Couldn't change the email. Check the address and try again.",
    username: 'Name', usernameHint: 'shown in the top bar instead of your email', usernamePH: 'e.g. Fede, Prof',
    level: 'Your level', levelSub: 'Changes how explanations are written.',
    beginner: 'Beginner', beginnerDesc: 'Plain language and lots of examples',
    intermediate: 'Intermediate', intermediateDesc: 'A balance of intuition and notation',
    advanced: 'Advanced', advancedDesc: 'Technical, skips the basics',
    prefs: 'Preferences', language: 'Language', languageSub: 'For the app and the explanations',
    theme: 'Appearance', themeSub: 'Saved on this device', light: 'Light', dark: 'Dark',
    save: 'Save changes', saving: 'Saving…', saved: 'Saved',
    saveFailed: "Couldn't save your changes. Check your connection and try again.",
    unsaved: 'You have unsaved changes',
  },
};

const LEVELS = ['beginner', 'intermediate', 'advanced'];

export default function ProfileScreen({ session, profile, onSave }) {
  const { lang, dark, setLang, setDark } = usePrefs();
  const t = COPY[lang] || COPY.en;

  const [username, setUsername] = useState(profile?.username || '');
  const [level, setLevel] = useState(profile?.level || 'intermediate');
  const [status, setStatus] = useState('idle'); // idle | saving | saved | error
  const [emailOpen, setEmailOpen] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [emailBusy, setEmailBusy] = useState(false);
  const [emailMsg, setEmailMsg] = useState(null); // { ok, text }

  useEffect(() => {
    setUsername(profile?.username || '');
    setLevel(profile?.level || 'intermediate');
  }, [profile?.username, profile?.level]);

  const dirty = username.trim() !== (profile?.username || '') || level !== (profile?.level || 'intermediate');

  const save = async () => {
    if (!dirty || status === 'saving') return;
    setStatus('saving');
    const updates = { username: username.trim(), level };
    const { error } = await supabase.from('profiles').update(updates).eq('id', session.user.id);
    if (error) { console.error('Profile save failed:', error); setStatus('error'); return; }
    onSave(updates);
    setStatus('saved');
    setTimeout(() => setStatus((s) => (s === 'saved' ? 'idle' : s)), 2500);
  };

  const changeEmail = async (e) => {
    e.preventDefault();
    const value = newEmail.trim();
    if (!value || emailBusy) return;
    setEmailBusy(true); setEmailMsg(null);
    const { error } = await supabase.auth.updateUser({ email: value });
    setEmailBusy(false);
    if (error) { setEmailMsg({ ok: false, text: t.emailFailed }); return; }
    setEmailMsg({ ok: true, text: t.emailSent });
    setNewEmail('');
  };

  return (
    <div className="page page-narrow">
      <div className="page-head"><div><h1>{t.title}</h1><p>{t.sub}</p></div></div>

      <section className="card pf-section">
        <h2>{t.account}</h2>
        <div className="field" style={{ marginTop: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 10 }}>
            <span className="label">{t.email}</span>
            <button type="button" className="link-btn" onClick={() => { setEmailOpen((v) => !v); setEmailMsg(null); setNewEmail(''); }}>
              {emailOpen ? t.cancel : t.change}
            </button>
          </div>
          <input className="input" value={session.user.email || ''} readOnly aria-label={t.email} />
        </div>
        {emailOpen && (
          <form className="field" onSubmit={changeEmail}>
            <label className="label" htmlFor="pf-new-email">{t.newEmail}</label>
            <div className="pf-inline">
              <input id="pf-new-email" className="input" type="email" required value={newEmail} placeholder={t.newEmailPH}
                autoComplete="email" onChange={(e) => setNewEmail(e.target.value)} />
              <button type="submit" className="btn btn-primary" disabled={emailBusy || !newEmail.trim()}>{emailBusy ? '…' : t.sendConfirm}</button>
            </div>
          </form>
        )}
        {emailMsg && <div className={'alert ' + (emailMsg.ok ? 'alert-ok' : 'alert-error')} role="status" style={{ marginTop: 12 }}>{emailMsg.text}</div>}
        <label className="field">
          <span className="label">{t.username} <small>({t.usernameHint})</small></span>
          <input className="input" type="text" value={username} maxLength={40} placeholder={t.usernamePH} autoComplete="nickname"
            onChange={(e) => { setUsername(e.target.value); if (status !== 'saving') setStatus('idle'); }} />
        </label>
      </section>

      <section className="card pf-section">
        <h2>{t.level}</h2>
        <p>{t.levelSub}</p>
        <div className="levels" role="radiogroup" aria-label={t.level}>
          {LEVELS.map((id, i) => (
            <button key={id} type="button" role="radio" aria-checked={level === id} className="level"
              onClick={() => { setLevel(id); if (status !== 'saving') setStatus('idle'); }}>
              <span className="level-bars" aria-hidden="true">
                {[0, 1, 2].map((n) => <i key={n} className={n <= i ? 'on' : ''} style={{ height: 8 + n * 5 }} />)}
              </span>
              <b>{t[id]}</b>
              <small>{t[id + 'Desc']}</small>
            </button>
          ))}
        </div>
      </section>

      <section className="card pf-section">
        <h2>{t.prefs}</h2>
        <div className="pf-row" style={{ marginTop: 14 }}>
          <div><strong>{t.language}</strong><small>{t.languageSub}</small></div>
          <div className="seg" role="group" aria-label={t.language}>
            <button type="button" aria-pressed={lang === 'es'} onClick={() => setLang('es')}>Español</button>
            <button type="button" aria-pressed={lang === 'en'} onClick={() => setLang('en')}>English</button>
          </div>
        </div>
        <div className="pf-row">
          <div><strong>{t.theme}</strong><small>{t.themeSub}</small></div>
          <div className="seg" role="group" aria-label={t.theme}>
            <button type="button" aria-pressed={!dark} onClick={() => setDark(false)}><IconSun size={16} />{t.light}</button>
            <button type="button" aria-pressed={dark} onClick={() => setDark(true)}><IconMoon size={16} />{t.dark}</button>
          </div>
        </div>
      </section>

      {status === 'error' && <div className="alert alert-error" role="alert" style={{ marginTop: 14 }}>{t.saveFailed}</div>}
      <div className="pf-save">
        {dirty && status === 'idle' && <span className="small muted">{t.unsaved}</span>}
        <button type="button" className={'btn ' + (status === 'saved' ? 'btn-ok' : 'btn-primary')} disabled={(!dirty && status !== 'saved') || status === 'saving'} onClick={save}>
          {status === 'saved' ? <><IconCheck />{t.saved}</> : status === 'saving' ? t.saving : t.save}
        </button>
      </div>
    </div>
  );
}
