import { useState, useEffect, useRef } from 'react';
import { usePrefs } from '../lib/prefs';
import { IconStudy, IconMap, IconReview, IconUser, IconChart, IconSun, IconMoon, IconLogout } from './icons';

const COPY = {
  es: { study: 'Estudiar', map: 'Mapa', review: 'Repasar', profile: 'Perfil', admin: 'Panel', logout: 'Salir',
        sections: 'Secciones', account: 'Cuenta', language: 'Idioma', due: 'para repasar',
        toDark: 'Cambiar a modo oscuro', toLight: 'Cambiar a modo claro' },
  en: { study: 'Study', map: 'Map', review: 'Review', profile: 'Profile', admin: 'Dashboard', logout: 'Log out',
        sections: 'Sections', account: 'Account', language: 'Language', due: 'due for review',
        toDark: 'Switch to dark mode', toLight: 'Switch to light mode' },
};

const ICONS = { study: IconStudy, map: IconMap, review: IconReview, profile: IconUser, admin: IconChart };

export default function TopBar({ view, setView, isAdmin, dueCount, name, email, onLogout }) {
  const { lang, dark, setLang, setDark } = usePrefs();
  const t = COPY[lang] || COPY.en;
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);

  /* Close the account menu on outside click or Escape. */
  useEffect(() => {
    if (!open) return;
    const onDown = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setOpen(false); };
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('mousedown', onDown); document.removeEventListener('keydown', onKey); };
  }, [open]);

  const main = ['study', 'map', 'review', ...(isAdmin ? ['admin'] : [])];
  const go = (id) => { setView(id); setOpen(false); window.scrollTo({ top: 0 }); };
  const badge = (id) => id === 'review' && dueCount > 0
    ? <span className="badge" aria-label={dueCount + ' ' + t.due}>{dueCount > 99 ? '99+' : dueCount}</span>
    : null;
  const display = name || email || '';

  return (
    <>
      <header className="topbar">
        <div className="topbar-in">
          <button type="button" className="brand" onClick={() => go('study')} aria-label="Mastery Module">
            <span className="brand-mark" aria-hidden="true">&#x2211;</span>
            <span className="brand-name">Mastery Module</span>
          </button>

          <nav className="nav" aria-label={t.sections}>
            {main.map((id) => {
              const Icon = ICONS[id];
              return (
                <button key={id} type="button" className="nav-item" aria-current={view === id ? 'page' : undefined} onClick={() => go(id)}>
                  <Icon size={18} />{t[id]}{badge(id)}
                </button>
              );
            })}
          </nav>

          <div className="topbar-right">
            <button type="button" className="icon-btn" onClick={() => setDark(!dark)} aria-label={dark ? t.toLight : t.toDark} title={dark ? t.toLight : t.toDark}>
              {dark ? <IconSun /> : <IconMoon />}
            </button>
            <div className="menu-wrap" ref={menuRef}>
              <button type="button" className="avatar" aria-haspopup="menu" aria-expanded={open} aria-label={t.account} onClick={() => setOpen((v) => !v)}>
                {(display.trim()[0] || '?')}
              </button>
              {open && (
                <div className="menu" role="menu">
                  <div className="menu-head">
                    <strong>{name || email}</strong>
                    {name && <span>{email}</span>}
                  </div>
                  <button type="button" role="menuitem" className="menu-item" onClick={() => go('profile')}><IconUser size={18} />{t.profile}</button>
                  <div className="menu-row">
                    <span>{t.language}</span>
                    <div className="seg" role="group" aria-label={t.language}>
                      {['es', 'en'].map((l) => (
                        <button key={l} type="button" aria-pressed={lang === l} onClick={() => setLang(l)}>{l.toUpperCase()}</button>
                      ))}
                    </div>
                  </div>
                  <button type="button" role="menuitem" className="menu-item is-danger" onClick={() => { setOpen(false); onLogout(); }}><IconLogout size={18} />{t.logout}</button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Phone: sections move to a bottom tab bar, within thumb reach. */}
      <nav className="tabbar" aria-label={t.sections}>
        {[...main, 'profile'].map((id) => {
          const Icon = ICONS[id];
          return (
            <button key={id} type="button" className="tab" aria-current={view === id ? 'page' : undefined} onClick={() => go(id)}>
              <Icon size={22} />{t[id]}{badge(id)}
            </button>
          );
        })}
      </nav>
    </>
  );
}
