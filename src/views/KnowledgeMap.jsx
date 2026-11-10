/* Knowledge map — every topic you studied, grouped by subject and colored by how well you know it.
   It used to be a fixed-width drawing that was unreadable on phones and unreachable by keyboard;
   now it is ordinary buttons in a responsive grid. */
import { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '../supabase';
import { usePrefs } from '../lib/prefs';
import { masteryLevel, MASTERY_LABEL } from '../srs';
import { subjectName, SUBJECT_IDS } from '../theme';
import { IconRefresh } from '../components/icons';

const COPY = {
  es: {
    title: 'Mapa de conocimiento', sub: 'Todo lo que estudiaste, por materia y por qué tan bien lo sabés.',
    refresh: 'Actualizar', loading: 'Cargando tu mapa…',
    empty: 'Todavía no estudiaste ningún tema', emptyHint: 'Cuando estudies el primero, aparece acá.', goStudy: 'Estudiar un tema',
    topics: 'temas', topic: 'tema', statTopics: 'Temas estudiados', statDue: 'Para repasar hoy', statMastered: 'Dominados', statSubjects: 'Materias',
    reviewNow: 'Repasar ahora', all: 'Todos', search: 'Buscar un tema…', noMatch: 'Ningún tema coincide con el filtro.',
    times: '{n} veces', linked: 'Se conecta con', open: 'Abrir',
    loadFailed: 'No pudimos cargar tu mapa. Revisá la conexión y probá de nuevo.',
    openFailed: 'No se pudo abrir ese tema. Probá de nuevo.',
  },
  en: {
    title: 'Knowledge map', sub: 'Everything you studied, by subject and by how well you know it.',
    refresh: 'Refresh', loading: 'Loading your map…',
    empty: "You haven't studied any topic yet", emptyHint: 'Your first one will show up here.', goStudy: 'Study a topic',
    topics: 'topics', topic: 'topic', statTopics: 'Topics studied', statDue: 'Due today', statMastered: 'Mastered', statSubjects: 'Subjects',
    reviewNow: 'Review now', all: 'All', search: 'Search a topic…', noMatch: 'No topic matches the filter.',
    times: '{n} times', linked: 'Connects with', open: 'Open',
    loadFailed: "We couldn't load your map. Check your connection and try again.",
    openFailed: "Couldn't open that topic. Try again.",
  },
};

const SUBJECT_ICON = { math: '∑', stats: 'σ', econ: '⚖', finance: '$', general: '◎' };
const LEVELS = ['due', 'learning', 'reviewing', 'mastered'];
const norm = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();

/* Words from a topic's key concepts, used to find topics in different subjects that share ideas. */
function keywordsOf(keyConcepts) {
  const out = new Set();
  (Array.isArray(keyConcepts) ? keyConcepts : []).forEach((kc) => {
    String(kc?.title || '').split(/[\s\-_/,]+/).forEach((w) => {
      const k = norm(w).replace(/[^a-z0-9]/g, '');
      if (k.length > 3) out.add(k);
    });
  });
  return out;
}

function buildMap(history, cards) {
  const cardByTopic = {};
  cards.forEach((c) => { const k = norm(c.topic); if (!cardByTopic[k]) cardByTopic[k] = c; });

  const byKey = {};
  history.forEach((row) => {            // newest first, so the first row seen is the latest version
    const key = norm(row.topic);
    if (!key) return;
    if (!byKey[key]) {
      const module = SUBJECT_IDS.includes(row.module) ? row.module : 'general';
      byKey[key] = { key, id: row.id, label: row.topic, module, mode: row.mode, count: 0, level: masteryLevel(cardByTopic[key]), keywords: new Set(), links: [] };
    }
    byKey[key].count += 1;
    keywordsOf(row.kc).forEach((k) => byKey[key].keywords.add(k));
  });
  const topics = Object.values(byKey);

  // Cross-subject links: two or more shared keywords.
  for (let i = 0; i < topics.length; i++) {
    for (let j = i + 1; j < topics.length; j++) {
      const a = topics[i], b = topics[j];
      if (a.module === b.module) continue;
      let shared = 0;
      for (const k of b.keywords) { if (a.keywords.has(k) && ++shared > 1) break; }
      if (shared > 1) { a.links.push(b.label); b.links.push(a.label); }
    }
  }

  const order = { due: 0, learning: 1, reviewing: 2, mastered: 3, none: 4 };
  const subjects = SUBJECT_IDS
    .map((id) => ({ id, topics: topics.filter((tp) => tp.module === id).sort((x, y) => order[x.level] - order[y.level] || y.count - x.count) }))
    .filter((s) => s.topics.length > 0);
  return { topics, subjects };
}

export default function KnowledgeMap({ session, onOpen, onReview, onStudy }) {
  const { lang } = usePrefs();
  const t = COPY[lang] || COPY.en;
  const labels = MASTERY_LABEL[lang] || MASTERY_LABEL.en;
  const userId = session.user.id;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [raw, setRaw] = useState({ history: [], cards: [] });
  const [filter, setFilter] = useState('all');
  const [query, setQuery] = useState('');
  const [openingId, setOpeningId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      // Only titles and key-concept names are needed here; the full module is fetched when a topic is opened.
      let hist = await supabase.from('study_history')
        .select('id, topic, module, mode, created_at, kc:content->keyConcepts')
        .eq('user_id', userId).order('created_at', { ascending: false });
      if (hist.error) {
        hist = await supabase.from('study_history')
          .select('id, topic, module, mode, created_at')
          .eq('user_id', userId).order('created_at', { ascending: false });
      }
      if (hist.error) throw hist.error;
      const cards = await supabase.from('review_cards')
        .select('topic, ease_factor, interval, next_review_at, status')
        .eq('user_id', userId).neq('status', 'suspended');
      setRaw({ history: hist.data || [], cards: cards.data || [] });
    } catch (e) {
      console.error('map load failed:', e);
      setError(t.loadFailed);
    }
    setLoading(false);
  }, [userId, t.loadFailed]);

  useEffect(() => { load(); }, [load]);

  const { topics, subjects } = useMemo(() => buildMap(raw.history, raw.cards), [raw]);
  const counts = useMemo(() => {
    const c = { due: 0, learning: 0, reviewing: 0, mastered: 0, none: 0 };
    topics.forEach((tp) => { c[tp.level] += 1; });
    return c;
  }, [topics]);

  const q = norm(query);
  const visible = (tp) => (filter === 'all' || tp.level === filter) && (!q || norm(tp.label).includes(q));
  const shown = subjects.map((s) => ({ ...s, list: s.topics.filter(visible) })).filter((s) => s.list.length > 0);

  const open = async (tp) => {
    if (openingId !== null) return;
    setOpeningId(tp.id); setError('');
    const { data, error: e } = await supabase.from('study_history').select('content, topic, module, mode').eq('id', tp.id).single();
    setOpeningId(null);
    if (e || !data?.content) { console.error('open topic failed:', e); setError(t.openFailed); return; }
    onOpen({ content: data.content, topic: data.topic, mod: data.module || tp.module, mode: data.mode });
  };

  const head = (
    <div className="page-head">
      <div><h1>{t.title}</h1><p>{t.sub}</p></div>
      <button type="button" className="btn btn-ghost btn-sm" onClick={load} disabled={loading}><IconRefresh size={16} />{t.refresh}</button>
    </div>
  );

  if (loading) return (
    <div className="page" role="status" aria-live="polite">
      {head}
      <span className="sr-only">{t.loading}</span>
      <div className="stats">{[0, 1, 2, 3].map((i) => <div key={i} className="skeleton" style={{ height: 84 }} />)}</div>
      <div className="map-grid">{[0, 1, 2].map((i) => <div key={i} className="skeleton" style={{ height: 240 }} />)}</div>
    </div>
  );

  if (topics.length === 0) return (
    <div className="page">
      {head}
      {error && <div className="alert alert-error" role="alert">{error}</div>}
      {!error && (
        <div className="empty">
          <div className="empty-mark" aria-hidden="true">∑</div>
          <h2>{t.empty}</h2>
          <p>{t.emptyHint}</p>
          <button type="button" className="btn btn-primary" style={{ marginTop: 22 }} onClick={onStudy}>{t.goStudy}</button>
        </div>
      )}
    </div>
  );

  return (
    <div className="page">
      {head}
      {error && <div className="alert alert-error" role="alert" style={{ marginBottom: 16 }}>{error}</div>}

      <div className="stats">
        <div className="stat"><b>{topics.length}</b><span>{t.statTopics}</span></div>
        {counts.due > 0
          ? <button type="button" className="stat is-accent" onClick={onReview}><b>{counts.due}</b><span>{t.statDue}</span><small>{t.reviewNow} →</small></button>
          : <div className="stat"><b>0</b><span>{t.statDue}</span></div>}
        <div className="stat"><b>{counts.mastered}</b><span>{t.statMastered}</span></div>
        <div className="stat"><b>{subjects.length}</b><span>{t.statSubjects}</span></div>
      </div>

      <div className="map-tools">
        <button type="button" className="chip" aria-pressed={filter === 'all'} onClick={() => setFilter('all')}>{t.all}</button>
        {LEVELS.filter((lv) => counts[lv] > 0).map((lv) => (
          <button key={lv} type="button" className="chip" aria-pressed={filter === lv} onClick={() => setFilter(filter === lv ? 'all' : lv)}>
            <span className={'m-dot m-' + lv} />{labels[lv]} · {counts[lv]}
          </button>
        ))}
        {topics.length > 6 && (
          <input className="input" type="search" value={query} placeholder={t.search} aria-label={t.search} onChange={(e) => setQuery(e.target.value)} />
        )}
      </div>

      {shown.length === 0 && <p className="muted" style={{ textAlign: 'center', padding: '32px 0' }}>{t.noMatch}</p>}

      <div className="map-grid">
        {shown.map((s) => {
          const total = s.topics.length;
          return (
            <section key={s.id} className="map-col" data-subject={s.id}>
              <header className="map-col-head">
                <span className="map-icon" aria-hidden="true">{SUBJECT_ICON[s.id]}</span>
                <div>
                  <h2>{subjectName(s.id, lang)}</h2>
                  <small>{total} {total === 1 ? t.topic : t.topics}</small>
                  <div className="map-bar" aria-hidden="true">
                    {LEVELS.map((lv) => {
                      const n = s.topics.filter((tp) => tp.level === lv).length;
                      return n > 0 ? <i key={lv} className={'m-' + lv} style={{ width: (n / total) * 100 + '%', background: 'var(--m)' }} /> : null;
                    })}
                  </div>
                </div>
              </header>
              <ul className="map-topics">
                {s.list.map((tp) => (
                  <li key={tp.key}>
                    <button type="button" className="map-topic" disabled={openingId !== null} onClick={() => open(tp)}
                      title={tp.links.length ? t.linked + ': ' + tp.links.join(', ') : t.open}>
                      {openingId === tp.id ? <span className="spinner" /> : <span className={'m-dot m-' + tp.level} />}
                      <span>
                        <b>{tp.label}</b>
                        {(tp.links.length > 0 || tp.count > 1) && (
                          <small>
                            {tp.count > 1 ? t.times.replace('{n}', tp.count) : ''}
                            {tp.count > 1 && tp.links.length > 0 ? ' · ' : ''}
                            {tp.links.length > 0 ? '↔ ' + tp.links.slice(0, 2).join(', ') : ''}
                          </small>
                        )}
                      </span>
                      {tp.level !== 'none' && <span className={'m-label m-' + tp.level}>{labels[tp.level]}</span>}
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </div>

      <div className="legend" aria-hidden="true">
        {LEVELS.map((lv) => <span key={lv}><i className={'m-dot m-' + lv} />{labels[lv]}</span>)}
      </div>
    </div>
  );
}
