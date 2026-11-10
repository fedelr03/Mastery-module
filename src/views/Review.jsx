/* Review — spaced repetition session: a fresh question per card, answer from memory, rate yourself. */
import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../supabase';
import { usePrefs } from '../lib/prefs';
import { reviewCard, sm2Update, isDue, masteryLevel, MASTERY_LABEL } from '../srs';
import { postClaude, textOf, apiError } from '../lib/api';
import { subjectName } from '../theme';

const SESSION_SIZE = 5;

const COPY = {
  es: {
    title: 'Repaso', of: 'de', exit: 'Salir', loading: 'Cargando tarjetas…',
    allDone: 'Estás al día', noDue: 'No tenés tarjetas para repasar ahora.',
    emptyTitle: 'Tu mazo está vacío', emptyText: 'Cuando termines de leer una explicación, tocá "Agregar al mazo" y la app te la vuelve a preguntar justo antes de que la olvides.',
    goStudy: 'Ir a estudiar', deck: 'Tu mazo', today: 'Hoy', tomorrow: 'Mañana', inDays: 'en {n} días',
    back: 'Volver a estudiar', sessionDone: 'Sesión completada', remembered: '{a} de {b} recordadas',
    more: 'Te quedan {n} para hoy.', keepGoing: 'Seguir con {n} más',
    generating: 'Armando la pregunta…', answerPH: 'Escribí lo que te acordás…', answerLabel: 'Tu respuesta',
    reveal: 'Ver respuesta', yours: 'Tu respuesta', model: 'Respuesta modelo', skipped: 'No escribiste nada.',
    noModel: 'Comparalo con tus apuntes y calificate con honestidad.',
    rate: '¿Qué tan bien lo recordaste?', r1: 'Olvidé', r2: 'Difícil', r3: 'Bien', r4: 'Fácil',
    day: '1 día', days: '{n} días', hint: 'Tu calificación decide cuándo vuelve esta tarjeta.',
    rateFailed: 'No se pudo guardar tu calificación. Revisá la conexión y tocala de nuevo.',
    loadFailed: 'No pudimos cargar tus tarjetas. Revisá la conexión y probá de nuevo.', retry: 'Reintentar',
    qDef: 'Definición', qEx: 'Ejemplo', qApp: 'Aplicación', qCh: 'Desafío',
  },
  en: {
    title: 'Review', of: 'of', exit: 'Exit', loading: 'Loading cards…',
    allDone: "You're all caught up", noDue: 'No cards are due right now.',
    emptyTitle: 'Your deck is empty', emptyText: 'When you finish reading an explanation, tap "Add to Review Deck" and the app will ask you about it again right before you forget it.',
    goStudy: 'Go study', deck: 'Your deck', today: 'Today', tomorrow: 'Tomorrow', inDays: 'in {n} days',
    back: 'Back to studying', sessionDone: 'Session complete', remembered: '{a} of {b} remembered',
    more: '{n} more due today.', keepGoing: 'Keep going with {n} more',
    generating: 'Writing your question…', answerPH: 'Type what you remember…', answerLabel: 'Your answer',
    reveal: 'Show answer', yours: 'Your answer', model: 'Model answer', skipped: "You didn't write anything.",
    noModel: 'Compare it with your notes and rate yourself honestly.',
    rate: 'How well did you remember it?', r1: 'Forgot', r2: 'Hard', r3: 'Good', r4: 'Easy',
    day: '1 day', days: '{n} days', hint: 'Your rating decides when this card comes back.',
    rateFailed: "Your rating couldn't be saved. Check your connection and tap it again.",
    loadFailed: "We couldn't load your cards. Check your connection and try again.", retry: 'Retry',
    qDef: 'Definition', qEx: 'Example', qApp: 'Apply it', qCh: 'Challenge',
  },
};

const RATES = [
  { r: 1, key: 'r1', color: 'var(--red-text)' },
  { r: 2, key: 'r2', color: 'var(--orange-text)' },
  { r: 3, key: 'r3', color: 'var(--accent-text)' },
  { r: 4, key: 'r4', color: 'var(--green-text)' },
];

/* The better a card is known, the harder the question type. */
function questionStyle(card) {
  const ease = parseFloat(card.ease_factor) || 2.5;
  const interval = parseInt(card.interval, 10) || 0;
  if (interval <= 1 || ease < 1.8) return {
    label: 'qDef',
    en: 'Generate a DEFINITION question: ask the student to define or explain what this concept IS in their own words. Keep it simple and direct — 1 sentence.',
    es: 'Generá una pregunta de DEFINICIÓN: pedile al estudiante que defina o explique con sus palabras qué ES este concepto. Simple y directa — 1 oración.',
  };
  if (interval <= 5 || ease < 2.2) return {
    label: 'qEx',
    en: 'Generate an EXAMPLE question: ask the student to give a concrete real-world example of this concept or describe where they would use it in practice.',
    es: 'Generá una pregunta de EJEMPLO: pedile al estudiante que dé un ejemplo concreto del mundo real de este concepto o dónde lo usaría en la práctica.',
  };
  if (interval <= 14 || ease < 2.6) return {
    label: 'qApp',
    en: 'Generate an APPLICATION question: ask the student to USE this concept — apply it to solve a small problem, explain a process step-by-step, or interpret a result.',
    es: 'Generá una pregunta de APLICACIÓN: pedile al estudiante que USE este concepto — aplicarlo para resolver un pequeño problema, explicar un proceso paso a paso, o interpretar un resultado.',
  };
  return {
    label: 'qCh',
    en: 'Generate a CHALLENGE question: ask about a common misconception, an edge case, a comparison with a closely related concept, or a situation where this concept breaks down or needs nuance.',
    es: 'Generá una pregunta DESAFÍO: preguntá sobre un error conceptual común, un caso borde, una comparación con un concepto relacionado, o cuándo este concepto falla o necesita matices.',
  };
}

async function fetchQuestion(card, style, lang) {
  const prompt = lang === 'es'
    ? `Tema: "${card.topic}" (materia: ${card.module || 'general'})\n\n${style.es}\n\nRespondé SOLO con JSON válido, sin backticks ni texto extra:\n{"question":"...","modelAnswer":"..."}\n\nLa pregunta debe ser 1 oración. La respuesta modelo: clara y concisa (1-2 oraciones). Usá español rioplatense.`
    : `Topic: "${card.topic}" (subject: ${card.module || 'general'})\n\n${style.en}\n\nRespond ONLY with valid JSON, no backticks or extra text:\n{"question":"...","modelAnswer":"..."}\n\nThe question is 1 sentence. The model answer is clear and concise (1-2 sentences).`;
  const data = await postClaude({
    model: 'fast', max_tokens: 300,
    messages: [{ role: 'user', content: prompt }],
    _meta: { topic: card.topic, module: 'recall', mode: 'recall', lang },
  });
  if (apiError(data)) throw new Error(apiError(data));
  const parsed = JSON.parse(textOf(data).replace(/```json|```/g, '').trim());
  if (!parsed.question) throw new Error('empty question');
  return { question: String(parsed.question), modelAnswer: String(parsed.modelAnswer || '') };
}

export default function ReviewMode({ session, onDone, onProgress }) {
  const { lang } = usePrefs();
  const t = COPY[lang] || COPY.en;
  const userId = session.user.id;

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [cards, setCards] = useState([]);     // this session's queue
  const [deck, setDeck] = useState([]);       // every active card
  const [totalDue, setTotalDue] = useState(0);
  const [current, setCurrent] = useState(0);
  const [done, setDone] = useState(false);
  const [results, setResults] = useState([]);

  const [phase, setPhase] = useState('loading_q'); // loading_q | answering | revealed
  const [qa, setQa] = useState({ question: '', modelAnswer: '' });
  const [style, setStyle] = useState(null);
  const [userAnswer, setUserAnswer] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [lastRating, setLastRating] = useState(null);
  const [rateError, setRateError] = useState('');
  const answerRef = useRef(null);

  const loadDue = useCallback(async () => {
    setLoading(true); setLoadError(false);
    const { data, error } = await supabase
      .from('review_cards')
      .select('*')
      .eq('user_id', userId)
      .neq('status', 'suspended')
      .order('next_review_at', { ascending: true });
    if (error) { console.error('review load failed:', error); setLoadError(true); setLoading(false); return; }
    const all = data || [];
    const due = all.filter(isDue);
    setDeck(all);
    setTotalDue(due.length);
    setCards(due.slice(0, SESSION_SIZE));
    setCurrent(0); setResults([]); setDone(false);
    setLoading(false);
  }, [userId]);

  useEffect(() => { loadDue(); }, [loadDue]);

  const card = cards[current];

  /* A new question every time a card comes up. */
  useEffect(() => {
    if (loading || done || !card) return;
    const st = questionStyle(card);
    setStyle(st); setPhase('loading_q'); setQa({ question: '', modelAnswer: '' }); setUserAnswer(''); setRateError('');
    let cancelled = false;
    fetchQuestion(card, st, lang)
      .then((res) => { if (!cancelled) { setQa(res); setPhase('answering'); } })
      .catch(() => {
        if (cancelled) return;
        // No AI available: fall back to free recall so the session can continue.
        setQa({
          question: lang === 'es'
            ? `¿Qué recordás sobre "${card.topic}"? Explicalo con tus palabras.`
            : `What do you remember about "${card.topic}"? Explain it in your own words.`,
          modelAnswer: '',
        });
        setPhase('answering');
      });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [card?.id, loading, done]);

  useEffect(() => { if (phase === 'answering') answerRef.current?.focus({ preventScroll: true }); }, [phase]);

  const rate = useCallback(async (rating) => {
    if (submitting || !card) return;
    setSubmitting(true); setLastRating(rating); setRateError('');
    const saved = await reviewCard(supabase, card.id, rating, card);
    if (!saved) {
      setRateError(t.rateFailed); setLastRating(null); setSubmitting(false);
      return;
    }
    setResults((prev) => [...prev, { rating, topic: card.topic }]);
    onProgress?.();
    setTimeout(() => {
      setSubmitting(false); setLastRating(null);
      if (current + 1 >= cards.length) setDone(true);
      else setCurrent((n) => n + 1);
    }, 320);
  }, [submitting, card, current, cards.length, onProgress, t.rateFailed]);

  /* Keyboard: 1–4 to rate once the answer is showing. */
  useEffect(() => {
    if (phase !== 'revealed' || done) return;
    const onKey = (e) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const n = Number(e.key);
      if (n >= 1 && n <= 4) { e.preventDefault(); rate(n); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [phase, done, rate]);

  const nextIn = (r) => {
    const days = sm2Update(card, r).interval;
    return days <= 1 ? t.day : t.days.replace('{n}', days);
  };
  const when = (iso) => {
    const days = Math.ceil((new Date(iso) - Date.now()) / 86400000);
    if (days <= 0) return t.today;
    if (days === 1) return t.tomorrow;
    return t.inDays.replace('{n}', days);
  };

  /* ── Loading / error ── */
  if (loading) return (
    <div className="page rv" role="status" aria-live="polite">
      <span className="sr-only">{t.loading}</span>
      <div className="skeleton" style={{ height: 8, marginBottom: 20 }} />
      <div className="skeleton" style={{ height: 300, borderRadius: 22 }} />
    </div>
  );
  if (loadError) return (
    <div className="page rv">
      <div className="alert alert-error" role="alert">{t.loadFailed}</div>
      <div className="sec-actions"><button type="button" className="btn btn-ghost" onClick={loadDue}>{t.retry}</button></div>
    </div>
  );

  /* ── Nothing due ── */
  if (cards.length === 0) {
    if (deck.length === 0) return (
      <div className="page rv">
        <div className="empty">
          <div className="empty-mark" aria-hidden="true">+</div>
          <h2>{t.emptyTitle}</h2>
          <p>{t.emptyText}</p>
          <button type="button" className="btn btn-primary" style={{ marginTop: 22 }} onClick={onDone}>{t.goStudy}</button>
        </div>
      </div>
    );
    const labels = MASTERY_LABEL[lang] || MASTERY_LABEL.en;
    return (
      <div className="page rv">
        <div className="empty" style={{ paddingBottom: 32 }}>
          <div className="empty-mark" aria-hidden="true">✓</div>
          <h2>{t.allDone}</h2>
          <p>{t.noDue}</p>
        </div>
        <div className="recent-head"><p className="eyebrow">{t.deck}</p><span className="tag">{deck.length}</span></div>
        <div className="rv-list">
          {deck.map((c) => {
            const level = masteryLevel(c, { ignoreDue: true });
            return (
              <div key={c.id} className="rv-row" data-subject={c.module || 'general'}>
                <span className="dot" />
                <span>{c.topic}</span>
                <span className={'m-label m-' + level}>{labels[level]}</span>
                <small>{when(c.next_review_at)}</small>
              </div>
            );
          })}
        </div>
        <div className="sec-actions" style={{ marginTop: 28 }}><button type="button" className="btn btn-primary" onClick={onDone}>{t.back}</button></div>
      </div>
    );
  }

  /* ── Session summary ── */
  if (done) {
    const passed = results.filter((r) => r.rating >= 3).length;
    const remaining = Math.max(0, totalDue - cards.length);
    return (
      <div className="page rv" style={{ textAlign: 'center' }}>
        <div className="empty" style={{ paddingBottom: 0 }}>
          <div className="empty-mark" aria-hidden="true">✓</div>
          <h2>{t.sessionDone}</h2>
          <p>{t.remembered.replace('{a}', passed).replace('{b}', results.length)}</p>
        </div>
        <div className="card rv-summary">
          {results.map((r, i) => {
            const meta = RATES.find((x) => x.r === r.rating);
            return <div key={i}><span>{r.topic}</span><b style={{ color: meta.color }}>{t[meta.key]}</b></div>;
          })}
        </div>
        {remaining > 0 && <div className="alert alert-accent" style={{ justifyContent: 'center', marginBottom: 16 }}>{t.more.replace('{n}', remaining)}</div>}
        <div className="sec-actions">
          <button type="button" className={'btn ' + (remaining > 0 ? 'btn-ghost' : 'btn-primary')} onClick={onDone}>{t.back}</button>
          {remaining > 0 && <button type="button" className="btn btn-primary" onClick={loadDue}>{t.keepGoing.replace('{n}', Math.min(remaining, SESSION_SIZE))}</button>}
        </div>
      </div>
    );
  }

  /* ── Card ── */
  return (
    <div className="page rv" data-subject={card.module || 'general'}>
      <div className="rv-top">
        <div className="progress" role="progressbar" aria-valuemin={0} aria-valuemax={cards.length} aria-valuenow={current}>
          <i style={{ width: (current / cards.length) * 100 + '%' }} />
        </div>
        <span className="rv-count">{current + 1} {t.of} {cards.length}</span>
        <button type="button" className="btn btn-quiet btn-sm" onClick={onDone}>{t.exit}</button>
      </div>

      <div className={'card rv-card' + (submitting ? ' is-busy' : '')}>
        <div className="rv-card-head">
          <div className="res-tags">
            <span className="tag tag-sub">{subjectName(card.module || 'general', lang)}</span>
            {style && <span className="tag">{t[style.label]}</span>}
          </div>
          <h2>{card.topic}</h2>
        </div>
        <div className="rv-body">
          {phase === 'loading_q' && <div className="rv-load" role="status"><span className="spinner" />{t.generating}</div>}

          {phase === 'answering' && (
            <form onSubmit={(e) => { e.preventDefault(); setPhase('revealed'); }} style={{ display: 'contents' }}>
              <p className="rv-q">{qa.question}</p>
              <textarea ref={answerRef} className="textarea" rows={4} value={userAnswer} placeholder={t.answerPH} aria-label={t.answerLabel}
                onChange={(e) => setUserAnswer(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); setPhase('revealed'); } }} />
              <button type="submit" className="btn btn-sub btn-block">{t.reveal}</button>
            </form>
          )}

          {phase === 'revealed' && (
            <>
              <p className="rv-q">{qa.question}</p>
              <div className="rv-ans"><b>{t.yours}</b>{userAnswer.trim() || <span className="muted">{t.skipped}</span>}</div>
              {qa.modelAnswer
                ? <div className="rv-ans is-model"><b>{t.model}</b>{qa.modelAnswer}</div>
                : <div className="alert">{t.noModel}</div>}
            </>
          )}
        </div>
      </div>

      {phase === 'revealed' && (
        <div className="rv-rate">
          <p className="eyebrow">{t.rate}</p>
          <div className="rates">
            {RATES.map(({ r, key, color }) => (
              <button key={r} type="button" className={'rate' + (lastRating === r ? ' is-on' : '')} style={{ '--c': color }} disabled={submitting} onClick={() => rate(r)}>
                <b>{t[key]}</b>
                <small>{nextIn(r)}</small>
                <kbd aria-hidden="true">{r}</kbd>
              </button>
            ))}
          </div>
          {rateError && <div className="alert alert-error" role="alert" style={{ marginTop: 14 }}>{rateError}</div>}
          <p className="rv-hint">{t.hint}</p>
        </div>
      )}
    </div>
  );
}
