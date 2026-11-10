/* Building blocks of a study module: explanation, quiz cards, Feynman challenge. */
import { useState, useEffect, useRef } from 'react';
import { AC } from '../theme';
import { MathText } from './math';
import { safeParseJSON } from './io';
import { postClaude, textOf, apiError } from '../lib/api';
import { IconPlay } from '../components/icons';

const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];
const hasText = (s) => typeof s === 'string' && s.trim().length > 0;

/* ═══════════ Explanation ═══════════ */
export function RichExplanation({ blocks, lang }) {
  const isEs = lang === 'es';
  if (!blocks || !blocks.length) return null;

  /* The model sometimes returns English labels even in Spanish mode. */
  const analogyLabel = (raw) => {
    if (!raw || /think of it like this/i.test(raw)) return isEs ? 'Pensalo así' : 'Think of it like this';
    if (isEs && /analogy|analogi/i.test(raw)) return 'Analogía';
    return raw;
  };
  const stepsTitle = (raw) => {
    if (!raw || !isEs) return raw;
    return raw.replace(/^Worked Example[:\s]*/i, 'Ejemplo Resuelto: ').replace(/^Example[:\s]*/i, 'Ejemplo Resuelto: ');
  };

  return (
    <div className="stack">
      {blocks.map((b, bi) => {
        const c = AC[bi % AC.length];
        if (b.type === 'analogy') {
          if (!hasText(b.text)) return null;
          return (
            <div key={bi} className="xb xb-analogy" style={{ '--c': c }}>
              <div className="xb-label"><span aria-hidden="true">💡</span>{analogyLabel(b.label)}</div>
              <p><MathText>{b.text}</MathText></p>
            </div>
          );
        }
        if (b.type === 'steps') {
          const items = (b.items || []).filter(hasText);
          if (!items.length) return null;
          return (
            <div key={bi} className="xb" style={{ '--c': c }}>
              {b.title && <p className="xb-title"><MathText>{stepsTitle(b.title)}</MathText></p>}
              {b.context && <div className="xb-context"><MathText>{b.context}</MathText></div>}
              <ol className="steps">
                {items.map((item, ii) => (
                  <li key={ii}>
                    <span className="step-n" style={{ '--c': AC[ii % AC.length] }}>{ii + 1}</span>
                    <p><MathText>{item}</MathText></p>
                  </li>
                ))}
              </ol>
            </div>
          );
        }
        if (b.type === 'keypoint') {
          if (!hasText(b.text)) return null;
          return (
            <div key={bi} className="xb xb-key">
              <span aria-hidden="true">⚡</span>
              <div><MathText>{b.text}</MathText></div>
            </div>
          );
        }
        if (b.type === 'table') {
          return (
            <div key={bi} className="xb xb-table">
              {b.title && <p className="xb-title">{b.title}</p>}
              <table>
                <thead><tr>{(b.headers || []).map((h, hi) => <th key={hi}><MathText>{h}</MathText></th>)}</tr></thead>
                <tbody>
                  {(b.rows || []).map((row, ri) => (
                    <tr key={ri}>{(Array.isArray(row) ? row : []).map((cell, ci) => <td key={ci}><MathText>{cell}</MathText></td>)}</tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        }
        if (!hasText(b.text)) return null;
        return <div key={bi} className="xb"><p><MathText>{b.text}</MathText></p></div>;
      })}
    </div>
  );
}

/* ═══════════ YouTube searches ═══════════ */
export function YouTubeRecs({ searches, t, lang }) {
  if (!searches || !searches.length) return null;
  return (
    <aside className="yt">
      <div className="yt-head"><span className="yt-play"><IconPlay /></span>{t.goDeeper}</div>
      <div className="yt-list">
        {searches.map((s, i) => {
          const q = s + (lang === 'es' ? ' en español' : '');
          return (
            <a key={i} className="yt-link" target="_blank" rel="noopener noreferrer"
              href={'https://www.youtube.com/results?search_query=' + encodeURIComponent(q) + '&sp=EgIQAQ%3D%3D'}>
              <span className="yt-play"><IconPlay /></span>
              <span>{s}</span>
              <small>{t.ytLang} →</small>
            </a>
          );
        })}
      </div>
    </aside>
  );
}

function Why({ text, t }) {
  if (!hasText(text)) return null;
  return <div className="why"><b>{t.why}</b><MathText>{text}</MathText></div>;
}

/* ═══════════ Multiple choice ═══════════ */
export function QuizCard({ q, index, selected, onSelect, submitted, t, prefix }) {
  const answer = parseInt(q.correctIndex, 10);
  const state = !submitted || selected === undefined ? '' : selected === answer ? ' is-right' : ' is-wrong';
  return (
    <div className={'q' + state}>
      <div className="q-meta"><span className="q-num">{prefix || t.question}{index + 1}</span></div>
      <p className="q-text"><MathText>{q.question}</MathText></p>
      <div className="opts" role="radiogroup">
        {(q.options || []).map((opt, oi) => {
          const isSel = selected === oi;
          const cls = submitted ? (oi === answer ? ' is-ans' : isSel ? ' is-miss' : '') : isSel ? ' is-sel' : '';
          return (
            <button key={oi} type="button" role="radio" aria-checked={isSel} disabled={submitted}
              className={'opt' + cls} onClick={() => onSelect(oi)}>
              <span className="opt-key">{LETTERS[oi] || oi + 1}</span>
              <span><MathText>{opt}</MathText></span>
            </button>
          );
        })}
      </div>
      {submitted && <Why text={q.explanation} t={t} />}
    </div>
  );
}

/* ═══════════ True / False ═══════════ */
export function TFCard({ q, index, selected, onSelect, submitted, t }) {
  const state = !submitted || selected === undefined ? '' : selected === q.answer ? ' is-right' : ' is-wrong';
  return (
    <div className={'q' + state}>
      <div className="q-meta">
        <span className="q-num">{t.question}{index + 1}</span>
        <span className="tag">{t.tfInstruction}</span>
      </div>
      <p className="q-text"><MathText>{q.statement}</MathText></p>
      <div className="opts opts-row" role="radiogroup">
        {[true, false].map((val) => {
          const isSel = selected === val;
          const cls = submitted ? (val === q.answer ? ' is-ans' : isSel ? ' is-miss' : '') : isSel ? ' is-sel' : '';
          return (
            <button key={String(val)} type="button" role="radio" aria-checked={isSel} disabled={submitted}
              className={'opt' + cls} onClick={() => onSelect(val)}>
              {val ? t.trueLabel : t.falseLabel}
            </button>
          );
        })}
      </div>
      {submitted && <Why text={q.explanation} t={t} />}
    </div>
  );
}

/* ═══════════ Solve on paper, then reveal ═══════════ */
export function SolveCard({ q, index, t }) {
  const [show, setShow] = useState(false);
  return (
    <div className="q q-solve">
      <div className="q-meta">
        <span className="q-num">🔥 {index + 1}</span>
        <span className="tag tag-red">{t.solveInstruction}</span>
      </div>
      <p className="q-text"><MathText>{q.problem}</MathText></p>
      {q.hint && <div className="q-hint"><span aria-hidden="true">💡</span><span><MathText>{q.hint}</MathText></span></div>}
      <button type="button" className={'btn btn-sm ' + (show ? 'btn-ok' : 'btn-primary')} aria-expanded={show} onClick={() => setShow(!show)}>
        {show ? t.hideSolution : t.revealSolution}
      </button>
      {show && <div className="solution"><MathText>{q.solution}</MathText></div>}
    </div>
  );
}

/* ═══════════ Related topics ═══════════ */
export function RelatedTopics({ topics, t, onSelect }) {
  if (!Array.isArray(topics) || topics.length === 0) return null;
  return (
    <section className="related">
      <h3 className="sub" style={{ marginTop: 0 }}>{t.relatedTopicsTitle}</h3>
      <p className="sub-note">{t.relatedTopicsSub}</p>
      <div className="related-grid">
        {topics.filter((x) => x && x.label).map((item, i) => (
          <button key={i} type="button" className="related-item" onClick={() => onSelect(item.label)}>
            <b>{item.label}</b>
            {item.tagline && <small>{item.tagline}</small>}
          </button>
        ))}
      </div>
    </section>
  );
}

/* ═══════════ Feynman challenge: explain it in your own words ═══════════ */
const MIN_CHARS = 20;

export function FeynmanPrompt({ topic, keyConcepts, lang, t, onDone }) {
  const [answer, setAnswer] = useState('');
  const [result, setResult] = useState(null);
  const [grading, setGrading] = useState(false);
  const [failed, setFailed] = useState(false);
  const [countdown, setCountdown] = useState(8);
  const timer = useRef(null);

  useEffect(() => {
    timer.current = setInterval(() => setCountdown((c) => (c <= 1 ? 0 : c - 1)), 1000);
    return () => clearInterval(timer.current);
  }, []);
  useEffect(() => { if (countdown === 0) clearInterval(timer.current); }, [countdown]);

  const ready = answer.trim().length >= MIN_CHARS;

  const grade = async () => {
    if (!ready || grading) return;
    setGrading(true); setFailed(false);
    try {
      const concepts = (keyConcepts || []).map((kc) => kc.title || kc).slice(0, 6).join(', ');
      const system = lang === 'es'
        ? 'Sos un tutor evaluando si el estudiante entendió el tema. Respondé SOLO con un objeto JSON válido, sin markdown, sin texto extra.'
        : 'You are a tutor evaluating student understanding. Respond ONLY with a valid JSON object, no markdown, no extra text.';
      const user = lang === 'es'
        ? `Tema: "${topic}"\nConceptos clave: ${concepts}\n\nExplicación del estudiante:\n"${answer}"\n\nEvaluá y respondé SOLO con este JSON:\n{"score":0-100,"nailed":["1-3 cosas bien explicadas"],"missed":["1-3 conceptos importantes que faltaron"],"tip":"una oración concreta de qué mejorar","verdict":"una oración motivadora resumiendo el resultado"}\nSi es muy corta o irrelevante, score < 40.`
        : `Topic: "${topic}"\nKey concepts: ${concepts}\n\nStudent's explanation:\n"${answer}"\n\nEvaluate and respond ONLY with this JSON:\n{"score":0-100,"nailed":["1-3 things explained well"],"missed":["1-3 important missing concepts"],"tip":"one concrete sentence on what to improve","verdict":"one motivating sentence summarizing the result"}\nIf very short or irrelevant, score < 40.`;
      const data = await postClaude({
        model: 'fast', max_tokens: 500,
        _meta: { topic, module: 'feynman', mode: 'feynman', lang },
        system, messages: [{ role: 'user', content: user }],
      });
      if (apiError(data)) throw new Error(apiError(data));
      const parsed = safeParseJSON(textOf(data));
      if (!parsed || typeof parsed !== 'object') throw new Error('Bad format');
      setResult({ ...parsed, score: Math.max(0, Math.min(100, Math.round(Number(parsed.score) || 0))) });
    } catch (e) {
      /* Before, a failed grading silently closed the challenge and the text was lost. */
      console.error('Feynman grading error:', e);
      setFailed(true);
    }
    setGrading(false);
  };

  if (result) {
    const tone = result.score >= 80 ? ' is-good' : result.score >= 50 ? '' : ' is-bad';
    return (
      <div className="feyn">
        <div className="feyn-head">
          <h3>{t.feynmanResultTitle}</h3>
          <span className={'score-pill' + tone}>{result.score}/100</span>
        </div>
        {result.verdict && <p>{result.verdict}</p>}
        {Array.isArray(result.nailed) && result.nailed.length > 0 && (
          <div className="feyn-list" style={{ color: 'var(--green-text)' }}>
            <b>{t.feynmanNailed}</b>
            <ul>{result.nailed.map((x, i) => <li key={i}>{x}</li>)}</ul>
          </div>
        )}
        {Array.isArray(result.missed) && result.missed.length > 0 && (
          <div className="feyn-list" style={{ color: 'var(--sub-ink)' }}>
            <b>{t.feynmanMissed}</b>
            <ul>{result.missed.map((x, i) => <li key={i}>{x}</li>)}</ul>
          </div>
        )}
        {result.tip && <div className="alert alert-accent" style={{ marginTop: 14 }}><span aria-hidden="true">💡</span><span>{result.tip}</span></div>}
        <div className="feyn-btns">
          <button type="button" className="btn btn-ghost" onClick={() => { setAnswer(''); setResult(null); }}>{t.feynmanTryAgain}</button>
          <button type="button" className="btn btn-sub" onClick={onDone}>{t.feynmanContinue}</button>
        </div>
      </div>
    );
  }

  return (
    <div className="feyn">
      <div className="feyn-head"><h3>{t.feynmanTitle}</h3></div>
      <p>{t.feynmanSub.replace('{topic}', topic)}</p>
      <textarea className="textarea" rows={4} value={answer} placeholder={t.feynmanPlaceholder}
        aria-label={t.feynmanTitle} onChange={(e) => setAnswer(e.target.value)} />
      {failed && (
        <div className="alert alert-error" role="alert" style={{ marginTop: 10 }}>
          {lang === 'es' ? 'No se pudo corregir tu explicación. Probá de nuevo.' : "Couldn't grade your explanation. Try again."}
        </div>
      )}
      <div className="feyn-foot">
        <span>
          {answer.length === 0 && countdown > 0 && t.feynmanSkipHint.replace('{n}', countdown)}
          {answer.length === 0 && countdown === 0 && <button type="button" className="link-btn" onClick={onDone}>{t.feynmanSkip}</button>}
          {answer.length > 0 && !ready && (lang === 'es' ? `Faltan ${MIN_CHARS - answer.trim().length} caracteres` : `${MIN_CHARS - answer.trim().length} more characters`)}
          {failed && ready && <button type="button" className="link-btn" onClick={onDone}>{t.feynmanSkip}</button>}
        </span>
        <button type="button" className="btn btn-sub btn-sm" disabled={grading || !ready} onClick={grade}>
          {grading ? t.feynmanGrading : t.feynmanSubmit}
        </button>
      </div>
    </div>
  );
}
