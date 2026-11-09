/* ═══════════ Sanitize AI thinking-out-loud from MC explanations ═══════════
   Fixes two Haiku symptoms that sometimes slip past the prompt:
   1. Reasoning trails bleed into the explanation field
      (e.g. "...espera, revisá: 2t+2 en t=3 es 8. La respuesta correcta es 8 ms, que es index 1.")
   2. correctIndex mismatches the option the prose reasoning actually endorses.

   Strategy:
   - Look for "index N" / "índice N" (0-indexed) — most reliable when present.
   - Fall back to "opción N" / "option N" (1-indexed).
   - Fall back to "la respuesta correcta es <value>" — match that value against options.
   - If any hint yields a valid index that differs from correctIndex, override.
   - Always strip the reasoning trail from the explanation text.                          */
const REASONING_TRAIL_RE=/\s*[.,;…]{0,3}\s*\b(esper[aá]|pero\s+esper[aá]|wait[,\s]+let\s+me|wait,?\s+|hmm+|hm+\b|no,?\s+(?:la\s+respuesta|esper[aá]|revis[aá]|esper[aá])|cambiando|re[-\s]?c[aá]lculo|recalculo|revis[aá]ndolo|revis[aá]\b|actualizo|actualizando|revisando|actually[,\s]+(?:the\s+|let\s+me)|let\s+me\s+(?:recheck|verify|double)|hold\s+on)\b[\s\S]*$/i;
const INDEX_HINT_RE=/\b(?:index|[ií]ndice)\s*(?:es\s+|is\s+)?(\d)\b/i;
const OPTION_HINT_RE=/\b(?:opci[oó]n|option)\s+(?:correcta\s+(?:es\s+(?:la\s+)?)?)?(\d)\b/i;
const ANSWER_HINT_RE=/\b(?:la\s+respuesta\s+correcta\s+es|the\s+correct\s+answer\s+is|respuesta\s*[:=]|answer\s*[:=])\s+([^.,;\n]{1,40}?)(?=[.,;\n]|\s+(?:que\s+es|which\s+is)|$)/i;

function sanitizeMCQuestion(q){
  if(!q||typeof q!=="object"||q.type!=="mc"||!Array.isArray(q.options)||q.options.length<2)return q;
  const origExpl=typeof q.explanation==="string"?q.explanation:"";
  const curIdx=parseInt(q.correctIndex,10);
  let intendedIdx=null;

  /* Heuristic 1: explicit 0-indexed "index N" */
  const m1=origExpl.match(INDEX_HINT_RE);
  if(m1){const n=parseInt(m1[1],10);if(n>=0&&n<q.options.length)intendedIdx=n;}

  /* Heuristic 2: 1-indexed "opción N" / "option N" (only if index hint absent) */
  if(intendedIdx===null){
    const m2=origExpl.match(OPTION_HINT_RE);
    if(m2){const n=parseInt(m2[1],10);if(n>=1&&n<=q.options.length)intendedIdx=n-1;}
  }

  /* Heuristic 3: "la respuesta correcta es X" — match X against option text */
  if(intendedIdx===null){
    const m3=origExpl.match(ANSWER_HINT_RE);
    if(m3){
      const hint=m3[1].trim().toLowerCase().replace(/[.,;]$/,"");
      /* Exact-ish match: option contains the hint or vice-versa (case/accent-insensitive) */
      const norm=(s)=>String(s).normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().trim();
      const nh=norm(hint);
      if(nh.length>=1){
        const candidates=q.options.map((opt,i)=>({i,v:norm(opt)}));
        /* Prefer exact match, then containment */
        let hit=candidates.find(c=>c.v===nh);
        if(!hit)hit=candidates.find(c=>c.v.includes(nh)||nh.includes(c.v));
        if(hit)intendedIdx=hit.i;
      }
    }
  }

  /* Heuristic 4: look for a percentage or numeric value in the explanation that matches an option */
  if(intendedIdx===null){
    const pctM=origExpl.match(/\b(\d+(?:[.,]\d+)?)\s*%/);
    if(pctM){
      const normStr=(s)=>String(s).normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().trim();
      const needle=normStr(pctM[0]);
      const hit=q.options.map((opt,i)=>({i,v:normStr(opt)})).find(c=>c.v.includes(needle)||needle.includes(c.v.replace(/[^0-9.%]/g,"")));
      if(hit)intendedIdx=hit.i;
    }
  }

  /* Strip the reasoning trail regardless (even if no index hint was found) */
  let cleaned=origExpl.replace(REASONING_TRAIL_RE,"").trim();
  /* Also strip lone trailing "pero" / "but" that marks an abruptly cut reasoning trail */
  cleaned=cleaned.replace(/,?\s*\bpero\b\s*\.?\s*$/i,"").trim();
  cleaned=cleaned.replace(/,?\s*\bbut\b\s*\.?\s*$/i,"").trim();
  /* Safety: never blank out the explanation — if cleaning ate everything, restore */
  if(!cleaned||cleaned.length<3)cleaned=origExpl;

  const out={...q,explanation:cleaned};
  /* Only override correctIndex if intended differs AND is in range */
  if(intendedIdx!==null&&intendedIdx!==curIdx&&intendedIdx>=0&&intendedIdx<q.options.length){
    out.correctIndex=intendedIdx;
  }
  return out;
}

function sanitizeAllMC(parsed){
  if(!parsed||typeof parsed!=="object")return parsed;
  const walk=(arr)=>Array.isArray(arr)?arr.map(sanitizeMCQuestion):arr;
  const out={...parsed};
  if(out.quiz)out.quiz=walk(out.quiz);
  if(out.exam)out.exam=walk(out.exam);
  if(out.examChallenge)out.examChallenge=walk(out.examChallenge);
  return out;
}

/* ═══════════ Shuffle MC options so correct answer isn't always A ═══════════ */
function shuffleMC(data){
  if(!data)return data;
  const d={...data};
  const shuffleQuestions=(qs)=>{
    if(!Array.isArray(qs))return qs;
    return qs.map(q=>{
      if(q.type!=="mc"||!Array.isArray(q.options)||q.options.length<2)return q;
      const correct=q.options[parseInt(q.correctIndex,10)];
      const indices=[...Array(q.options.length).keys()];
      /* Fisher-Yates shuffle */
      for(let i=indices.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[indices[i],indices[j]]=[indices[j],indices[i]];}
      const newOpts=indices.map(i=>q.options[i]);
      const newIdx=newOpts.indexOf(correct);
      return{...q,options:newOpts,correctIndex:newIdx};
    });
  };
  if(d.quiz)d.quiz=shuffleQuestions(d.quiz);
  if(d.exam)d.exam=shuffleQuestions(d.exam);
  if(d.examChallenge)d.examChallenge=shuffleQuestions(d.examChallenge);
  return d;
}

export { sanitizeMCQuestion, sanitizeAllMC, shuffleMC };
