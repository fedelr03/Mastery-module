/* ConceptMap — the knowledge map drawn as a concept map:
   you → subjects → topics, plus dashed links between topics of different subjects that share ideas.

   Drawn in SVG (not canvas) so it stays sharp, follows the theme through CSS variables,
   and every topic is a real focusable button. Two layouts:
   - columns: one column per subject, for screens 640px and wider
   - stack:   subjects one under the other along a trunk, for phones */
import { useState, useRef, useLayoutEffect, useMemo } from 'react';

const ICON = { math: '∑', stats: 'σ', econ: '⚖', finance: '$', general: '◎' };
const LEVELS = ['due', 'learning', 'reviewing', 'mastered'];

const PILL_H = 38;
const PILL_GAP = 12;
const SUB_R = 30;

/* Text width with the real font, so long topic names are cut cleanly. */
let measureCtx = null;
function textWidth(s, font) {
  if (typeof document === 'undefined') return s.length * 7.6;
  if (!measureCtx) measureCtx = document.createElement('canvas').getContext('2d');
  measureCtx.font = font;
  return measureCtx.measureText(s).width;
}
const PILL_FONT = "600 14.5px 'DM Sans', system-ui, sans-serif";
function fit(label, maxW) {
  if (textWidth(label, PILL_FONT) <= maxW) return label;
  let s = label;
  while (s.length > 3 && textWidth(s + '…', PILL_FONT) > maxW) s = s.slice(0, -1);
  return s.trimEnd() + '…';
}
/* One line if it fits, otherwise two (the second one cut if still too long). */
function wrap(label, maxW) {
  if (textWidth(label, PILL_FONT) <= maxW) return [label];
  const words = label.split(' ');
  let first = '';
  for (let i = 0; i < words.length; i++) {
    const next = first ? first + ' ' + words[i] : words[i];
    if (textWidth(next, PILL_FONT) > maxW) {
      if (!first) return [fit(label, maxW)];
      return [first, fit(words.slice(i).join(' '), maxW)];
    }
    first = next;
  }
  return [first];
}
const PILL_H2 = 56;
const TEXT_X = 30;
const labelRoom = (w, tp) => w - TEXT_X - 10 - (tp.count > 1 ? 28 : 0);
/* Stack pills of 1 or 2 lines from a top edge; returns the nodes and the bottom edge. */
function placeTopics(topics, x, w, top, extra) {
  let y = top;
  const nodes = topics.map((tp) => {
    const lines = wrap(tp.label, labelRoom(w, tp));
    const h = lines.length > 1 ? PILL_H2 : PILL_H;
    const node = { tp, lines, h, x, w, y: y + h / 2, ...extra };
    y += h + PILL_GAP;
    return node;
  });
  return { nodes, bottom: y - PILL_GAP };
}

function layoutColumns(subjects, width) {
  const n = subjects.length;
  const colW = Math.max(210, Math.min(300, (width - 16) / n));
  const W = Math.max(width, colW * n + 16);
  const x0 = (W - colW * n) / 2;
  const root = { x: W / 2, y: 44 };
  const subY = 158;
  const top = subY + SUB_R + 74;
  const nodes = [];
  let bottom = top;
  const subs = subjects.map((s, i) => {
    const left = x0 + i * colW;
    const cx = left + colW / 2;
    const spineX = left + 18;
    const pillX = spineX + 16;
    const pillW = left + colW - 8 - pillX;
    const placed = placeTopics(s.topics, pillX, pillW, top, { sub: s.id, col: i });
    nodes.push(...placed.nodes);
    bottom = Math.max(bottom, placed.bottom);
    const lastY = placed.nodes[placed.nodes.length - 1].y;
    return { ...s, cx, cy: subY, spineX, spineTop: top - 18, lastY, labelBelow: true };
  });
  return { W, H: bottom + 34, root, subs, nodes, mode: 'columns' };
}

function layoutStack(subjects, width) {
  const W = Math.max(300, width);
  const root = { x: 20, y: 34 };
  const trunkX = 34;
  const nodes = [];
  let y = 104;
  const subs = subjects.map((s) => {
    const cx = trunkX + 46;
    const cy = y;
    const spineX = cx;
    const pillX = cx + 18;
    const pillW = W - 10 - pillX;
    const placed = placeTopics(s.topics, pillX, pillW, cy + SUB_R + 18, { sub: s.id, col: 0 });
    nodes.push(...placed.nodes);
    const lastY = placed.nodes[placed.nodes.length - 1].y;
    y = placed.bottom + 62;
    return { ...s, cx, cy, spineX, spineTop: cy + SUB_R, lastY, labelBelow: false };
  });
  return { W, H: y - 30, root, subs, nodes, mode: 'stack', trunkX };
}

/* Mastery ring around a subject: one arc per level, sized by how many topics are at that level. */
function MasteryRing({ cx, cy, r, topics }) {
  const C = 2 * Math.PI * r;
  const total = topics.length || 1;
  const gap = topics.length > 1 ? 3 : 0;
  let offset = 0;
  const arcs = [...LEVELS, 'none'].map((lv) => {
    const n = topics.filter((tp) => tp.level === lv).length;
    if (!n) return null;
    const len = (n / total) * C;
    const el = (
      <circle key={lv} className={'cm-ring m-' + lv} cx={cx} cy={cy} r={r}
        strokeDasharray={`${Math.max(len - gap, 1)} ${C}`} strokeDashoffset={-offset}
        transform={`rotate(-90 ${cx} ${cy})`} />
    );
    offset += len;
    return el;
  });
  return <g aria-hidden="true">{arcs}</g>;
}

export default function ConceptMap({ subjects, rootLabel, subjectLabel, countLabel, isDimmed, onOpen, openingId, active, setActive, ariaLabel }) {
  const wrapRef = useRef(null);
  const [width, setWidth] = useState(960);

  useLayoutEffect(() => {
    const el = wrapRef.current;
    if (!el) return undefined;
    const update = () => setWidth(Math.round(el.clientWidth));
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const L = useMemo(
    () => (width < 640 ? layoutStack(subjects, width) : layoutColumns(subjects, width)),
    [subjects, width],
  );

  const byKey = useMemo(() => Object.fromEntries(L.nodes.map((n) => [n.tp.key, n])), [L]);
  const links = useMemo(() => {
    const out = [];
    const seen = new Set();
    L.nodes.forEach((a) => a.tp.linkKeys.forEach((k) => {
      const b = byKey[k];
      if (!b) return;
      const id = [a.tp.key, k].sort().join('|');
      if (seen.has(id)) return;
      seen.add(id);
      out.push(a.col <= b.col ? [a, b] : [b, a]);
    }));
    return out;
  }, [L, byKey]);

  const activeNode = active ? byKey[active] : null;
  const related = useMemo(() => new Set(activeNode ? activeNode.tp.linkKeys : []), [activeNode]);

  const linkPath = ([a, b]) => {
    if (L.mode === 'stack') {
      // Both pills sit at the same x on phones: loop out to the right edge.
      const x = a.x + a.w;
      const bulge = Math.min(48, 18 + Math.abs(b.y - a.y) * 0.08);
      return `M${x} ${a.y} C${x + bulge} ${a.y}, ${x + bulge} ${b.y}, ${x} ${b.y}`;
    }
    const x1 = a.x + a.w, x2 = b.x;
    const dx = Math.max(40, (x2 - x1) * 0.45);
    return `M${x1} ${a.y} C${x1 + dx} ${a.y}, ${x2 - dx} ${b.y}, ${x2} ${b.y}`;
  };

  const keyDown = (e, tp) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onOpen(tp); }
  };

  return (
    <div className="cm-wrap" ref={wrapRef}>
      <svg className={'cm' + (active ? ' has-active' : '')} width={L.W} height={L.H} viewBox={`0 0 ${L.W} ${L.H}`}
        role="group" aria-label={ariaLabel}>
        {/* root → subjects */}
        <g className="cm-trunks" aria-hidden="true">
          {L.subs.map((s) => (
            <path key={s.id} data-subject={s.id} className="cm-trunk"
              d={L.mode === 'columns'
                ? `M${L.root.x} ${L.root.y + 18} C${L.root.x} ${(L.root.y + s.cy) / 2 + 10}, ${s.cx} ${(L.root.y + s.cy) / 2 - 10}, ${s.cx} ${s.cy - SUB_R - 4}`
                : `M${L.trunkX} ${s.cy - 14} Q${L.trunkX} ${s.cy}, ${L.trunkX + 14} ${s.cy} L${s.cx - SUB_R - 4} ${s.cy}`} />
          ))}
          {L.mode === 'stack' && L.subs.length > 0 && (
            <path className="cm-trunk is-shared" d={`M${L.trunkX} ${L.root.y + 16} L${L.trunkX} ${L.subs[L.subs.length - 1].cy - 14}`} />
          )}
        </g>

        {/* subject → topics (a spine with rounded elbows) */}
        <g className="cm-branches" aria-hidden="true">
          {L.subs.map((s) => {
            const r = 12;
            const spine = L.mode === 'columns'
              ? `M${s.cx - SUB_R - 8} ${s.cy} C${s.spineX + 10} ${s.cy}, ${s.spineX} ${s.cy + 20}, ${s.spineX} ${s.cy + 60} L${s.spineX} ${s.lastY - r}`
              : `M${s.spineX} ${s.spineTop} L${s.spineX} ${s.lastY - r}`;
            return (
              <g key={s.id} data-subject={s.id}>
                <path className="cm-branch" d={spine} />
                {L.nodes.filter((n) => n.sub === s.id).map((n) => (
                  <path key={n.tp.key} className={'cm-branch' + (isDimmed(n.tp) ? ' is-dim' : '')}
                    d={`M${s.spineX} ${n.y - r} Q${s.spineX} ${n.y}, ${s.spineX + r} ${n.y} L${n.x} ${n.y}`} />
                ))}
              </g>
            );
          })}
        </g>

        {/* links between subjects: the ones between neighbouring columns are always drawn (faint);
            the rest only for the topic under the cursor, so a line never seems to end on the wrong pill */}
        <g className="cm-links" aria-hidden="true">
          {L.mode === 'columns' && links.filter(([a, b]) => b.col - a.col === 1).map(([a, b]) => (
            <path key={a.tp.key + '|' + b.tp.key} className="cm-link" d={linkPath([a, b])} />
          ))}
        </g>

        {/* root */}
        <g className="cm-root" aria-hidden="true"
          transform={L.mode === 'columns' ? `translate(${L.root.x} ${L.root.y})` : `translate(${L.root.x} ${L.root.y})`}>
          {(() => {
            const w = textWidth(rootLabel, "700 15px 'DM Sans', system-ui, sans-serif") + 58;
            const x = L.mode === 'columns' ? -w / 2 : 0;
            return (
              <>
                <rect x={x} y={-19} width={w} height={38} rx={19} />
                <text className="cm-root-mark" x={x + 22} y={1}>∑</text>
                <text className="cm-root-text" x={x + 40} y={1}>{rootLabel}</text>
              </>
            );
          })()}
        </g>

        {/* subjects */}
        {L.subs.map((s, i) => {
          const dim = s.topics.every((tp) => isDimmed(tp));
          return (
            <g key={s.id} data-subject={s.id} className={'cm-sub' + (dim ? ' is-dim' : '')} style={{ '--i': i }} aria-hidden="true">
              <MasteryRing cx={s.cx} cy={s.cy} r={SUB_R + 6} topics={s.topics} />
              <circle className="cm-sub-disc" cx={s.cx} cy={s.cy} r={SUB_R} />
              <text className="cm-sub-icon" x={s.cx} y={s.cy + 1}>{ICON[s.id]}</text>
              {s.labelBelow ? (
                <>
                  <text className="cm-sub-name" x={s.cx} y={s.cy + SUB_R + 30}>{subjectLabel(s.id)}</text>
                  <text className="cm-sub-count" x={s.cx} y={s.cy + SUB_R + 50}>{countLabel(s.topics.length)}</text>
                </>
              ) : (
                <>
                  <text className="cm-sub-name is-side" x={s.cx + SUB_R + 16} y={s.cy - 8}>{subjectLabel(s.id)}</text>
                  <text className="cm-sub-count is-side" x={s.cx + SUB_R + 16} y={s.cy + 14}>{countLabel(s.topics.length)}</text>
                </>
              )}
            </g>
          );
        })}

        {/* topics */}
        {L.nodes.map((n, i) => {
          const { tp } = n;
          const dim = isDimmed(tp) || (activeNode && activeNode !== n && !related.has(tp.key));
          const hasCount = tp.count > 1;
          return (
            <g key={tp.key} data-subject={n.sub}
              className={'cm-topic m-' + tp.level + (dim ? ' is-dim' : '') + (activeNode === n ? ' is-active' : '') + (related.has(tp.key) ? ' is-related' : '')}
              style={{ '--i': i }}
              transform={`translate(${n.x} ${n.y})`}
              role="button" tabIndex={0} aria-label={tp.aria}
              aria-busy={openingId === tp.id ? 'true' : undefined}
              onClick={() => onOpen(tp)} onKeyDown={(e) => keyDown(e, tp)}
              onMouseEnter={() => setActive(tp.key)} onMouseLeave={() => setActive(null)}
              onFocus={() => setActive(tp.key)} onBlur={() => setActive(null)}>
              <g className="cm-topic-in">
                <rect className="cm-pill" x={0} y={-n.h / 2} width={n.w} height={n.h} rx={11} />
                {openingId === tp.id
                  ? <circle className="cm-spin" cx={17} cy={0} r={6} />
                  : <circle className="cm-dot" cx={17} cy={0} r={5} />}
                <text className="cm-label" x={TEXT_X} y={n.lines.length > 1 ? -8 : 1}>
                  {n.lines.map((ln, k) => <tspan key={k} x={TEXT_X} dy={k ? 18 : 0}>{ln}</tspan>)}
                </text>
                {hasCount && <text className="cm-count" x={n.w - 12} y={1}>{tp.count}×</text>}
              </g>
            </g>
          );
        })}

        {activeNode && (
          <g className="cm-links-on" data-subject={activeNode.sub} aria-hidden="true">
            {links.filter(([a, b]) => a === activeNode || b === activeNode).map(([a, b]) => {
              const other = a === activeNode ? b : a;
              const end = L.mode === 'stack' || other.col > activeNode.col ? 'left' : 'right';
              return (
                <g key={a.tp.key + '|' + b.tp.key}>
                  <path className="cm-link is-on" d={linkPath([a, b])} />
                  <circle className="cm-link-end" cx={L.mode === 'stack' ? other.x + other.w : end === 'left' ? other.x : other.x + other.w} cy={other.y} r={4} />
                </g>
              );
            })}
          </g>
        )}
      </svg>
    </div>
  );
}
