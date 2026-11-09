/* ═══════════════════════════════════════════════════
   MasteryModule — the study screen: ask for a topic, wait, read, practice.

   The pieces live next to this file:
     subjects.js         subjects, keyword lists, topic validation
     strings.js          interface copy (es / en)
     loadingMessages.js  jokes and quotes shown while generating
     math.jsx            math notation formatter + <MathText>
     quizUtils.js        fixes and shuffles multiple-choice answers
     io.js               sound, PDF reading, tolerant JSON parser
     parts.jsx           explanation blocks, quiz cards, Feynman challenge
     Deck.jsx            summary slides (deep mode)
   ═══════════════════════════════════════════════════ */
import { useState, useRef, useEffect, useCallback } from "react";
import { supabase } from "../supabase";
import { addCard } from "../srs";
import { AC, subjectName } from "../theme";
import { getAccessToken, readJson, friendlyError } from "../lib/api";
import { T } from "./strings";
import { ML, ML_STATS, ML_ECON, ML_FINANCE } from "./loadingMessages";
import { CHIPS, MOD_CONF, isBlockedInterest, INTEREST_WARN, RANDOM_INTERESTS, detectModLocal, isMathRelated } from "./subjects";
import { MathText, deepFmt } from "./math";
import { sanitizeAllMC, shuffleMC } from "./quizUtils";
import { playDing, extractPdfText, safeParseJSON } from "./io";
import { RichExplanation, YouTubeRecs, QuizCard, TFCard, SolveCard, FeynmanPrompt, RelatedTopics } from "./parts";
import InlineDeck from "./Deck";
import { IconSearch, IconUpload, IconArrowRight, IconArrowLeft, IconClose } from "../components/icons";

/* Copy added with the redesign (the rest is in strings.js). */
const X={
  es:{homeTitle:"\u00BFQu\u00E9 quer\u00E9s entender hoy?",topicLabel:"Tema",interestLabel:"Algo que te guste (opcional)",attach:"Subir un archivo (PDF o texto)",randomInterest:"Elegir un inter\u00E9s al azar",clear:"Borrar",depthLabel:"Profundidad",suggestLabel:"Ideas para arrancar",recentLabel:"Segu\u00ED donde dejaste",newTopic:"Nuevo tema",identifying:"Identificando el tema",sectionsLabel:"Secciones",toggleType:"Tocar para cambiar entre concepto y ejercicio",example:"Ejemplo",toQuiz:"Ir al quiz",toExam:"Ir al examen"},
  en:{homeTitle:"What do you want to understand today?",topicLabel:"Topic",interestLabel:"Something you like (optional)",attach:"Upload a file (PDF or text)",randomInterest:"Pick a random interest",clear:"Clear",depthLabel:"Depth",suggestLabel:"Ideas to get started",recentLabel:"Pick up where you left off",newTopic:"New topic",identifying:"Identifying the topic",sectionsLabel:"Sections",toggleType:"Tap to switch between concept and exercise",example:"Example",toQuiz:"Go to the quiz",toExam:"Go to the exam"},
};
const APP_ICONS=["\uD83C\uDFED","\uD83D\uDCBB","\uD83C\uDFE5","\uD83D\uDE80","\uD83C\uDFAE","\uD83C\uDF0D"];

const stored=(k,d)=>{try{return localStorage.getItem(k)??d;}catch{return d;}};
const store=(k,v)=>{try{localStorage.setItem(k,v);}catch{/* private mode */}};

function timeAgo(iso,lang){
  const days=Math.floor((Date.now()-new Date(iso).getTime())/86400000);
  const es=lang==="es";
  if(!(days>=1))return es?"hoy":"today";
  if(days===1)return es?"ayer":"yesterday";
  if(days<30)return es?"hace "+days+" d\u00EDas":days+" days ago";
  const months=Math.floor(days/30);
  return es?"hace "+months+(months===1?" mes":" meses"):months+(months===1?" month ago":" months ago");
}

export default function MasteryModule({session, level, lang, dark, pendingLoad, onLoadDone, onCardAdded}){
  const t=T[lang]||T.en;
  const[topic,setTopic]=useState("");const[file,setFile]=useState(null);const[fileContent,setFileContent]=useState("");
  const[phase,setPhase]=useState("idle");const[loadingPhase,setLoadingPhase]=useState(0);const[loadingMsg,setLoadingMsg]=useState("");const[loadProg,setLoadProg]=useState(0);
  const[content,setContent]=useState(null);const[error,setError]=useState(null);const[validationError,setValidationError]=useState(false);
  const[cardStatus,setCardStatus]=useState(null);// null | 'adding' | 'added' | 'exists'
  const[quizAnswers,setQuizAnswers]=useState({});const[quizSubmitted,setQuizSubmitted]=useState(false);
  const[examAnswers,setExamAnswers]=useState({});const[examSubmitted,setExamSubmitted]=useState(false);
  const[challengeAnswers,setChallengeAnswers]=useState({});const[challengeSubmitted,setChallengeSubmitted]=useState(false);
  const[activeSection,setActiveSection]=useState("explain");const[fileError,setFileError]=useState("");
  const[interest,setInterest]=useState(()=>stored("mm_interest",""));const[interestFocused,setInterestFocused]=useState(false);const[interestError,setInterestError]=useState(false);
  const[mod,setMod]=useState("general");
  const[classifierReady,setClassifierReady]=useState(true);/* true=ready, false=waiting for classifier */
  const[mode,setMode]=useState(()=>{const m=stored("mm_mode","fast");return["lite","fast","think"].includes(m)?m:"fast";});/* "lite" | "fast" | "think" — remembered between visits */
  const[recent,setRecent]=useState([]);const[recentTick,setRecentTick]=useState(0);const[openingId,setOpeningId]=useState(null);
  useEffect(()=>{store("mm_mode",mode);},[mode]);
  useEffect(()=>{store("mm_interest",isBlockedInterest(interest)?"":interest.trim());},[interest]);
  const[topicType,setTopicType]=useState("concept");/* "concept" | "problem" — auto-detected */
  const[simplifiedBlocks,setSimplifiedBlocks]=useState(null);const[simplifying,setSimplifying]=useState(false);
  const[feynmanDone,setFeynmanDone]=useState(false);
  const mc=MOD_CONF[mod]||MOD_CONF.general;
  const mt={accent:mc.accent,accentLight:mc.accentLight,accentBg:mc.accentBg,accentBgStrong:mc.accentBgStrong,accentText:dark?({general:"#94a3b8",math:"#f5a623",stats:"#a5b4fc",econ:"#34d399",finance:"#22d3ee"}[mod]||mc.accentLight):mc.accentText,borderAccent:mc.borderAccent,btnShadow:mc.btnShadow,btnBg:mc.btnBg||"#e8940a",btnText:mc.btnText||"#1f1d2b",ink:dark?({general:"#94a3b8",math:"#f5a623",stats:"#a5b4fc",econ:"#34d399",finance:"#22d3ee"}[mod]||mc.accentLight):mc.accentText};
  const fileRef=useRef(null);const usedRef=useRef(new Set());const classModRef=useRef("general");

  const pickMsg=useCallback(()=>{const pool=mod==="stats"?ML_STATS:mod==="econ"?ML_ECON:mod==="finance"?ML_FINANCE:ML;const p=pool[lang]||pool.en;if(usedRef.current.size>=p.length)usedRef.current.clear();let i;do{i=Math.floor(Math.random()*p.length);}while(usedRef.current.has(i));usedRef.current.add(i);return p[i];},[lang,mod]);
  useEffect(()=>{if(phase!=="loading")return;setLoadingMsg(pickMsg());const iv=setInterval(()=>{setLoadingMsg(pickMsg());setLoadingPhase(p=>(p+1)%5);},8000);return()=>clearInterval(iv);},[phase,lang,pickMsg]);
  useEffect(()=>{if(phase==="loading"){setLoadProg(0);const st=Date.now();const iv=setInterval(()=>{const el=(Date.now()-st)/1000;/* Smooth S-curve: fast start, steady cruise, slows near end */const p=96*(1-Math.exp(-el/18))+(el>5?Math.min(el-5,25)*0.25:0);setLoadProg(Math.min(97,p));},200);return()=>clearInterval(iv);}if(phase==="complete"){setLoadProg(100);const tm=setTimeout(()=>setLoadProg(0),600);return()=>clearTimeout(tm);}},[phase]);

  const handleFile=async(e)=>{const f=e.target.files?.[0];if(!f)return;setFile(f);setValidationError(false);setFileError("");const ext=f.name.split(".").pop().toLowerCase();try{if(ext==="pdf"||f.type==="application/pdf"){const buf=await f.arrayBuffer();const text=await extractPdfText(buf);if(!text||text.trim().length<10){setFileError(t.pdfError);setFile(null);setFileContent("");return;}setFileContent(text);}else{const text=await new Promise((r,j)=>{const rd=new FileReader();rd.onload=ev=>r(ev.target.result);rd.onerror=()=>j(new Error("fail"));rd.readAsText(f);});setFileContent(text);}}catch{setFileError(t.fileReadError);setFile(null);setFileContent("");}};

  const reset=()=>{setPhase("idle");setContent(null);setTopic("");setFile(null);setFileContent("");setError(null);setValidationError(false);setQuizAnswers({});setQuizSubmitted(false);setExamAnswers({});setExamSubmitted(false);setChallengeAnswers({});setChallengeSubmitted(false);setActiveSection("explain");setFileError("");setMod("general");setTopicType("concept");setSimplifiedBlocks(null);setSimplifying(false);setFeynmanDone(false);setCardStatus(null);if(fileRef.current)fileRef.current.value="";usedRef.current.clear();window.scrollTo({top:0,behavior:"smooth"});};


  /* ── Save session to study history ── */
  const saveHistory=async(parsedContent,savedTopic)=>{
    if(!session?.user?.id)return;
    try{
      const{error:histErr}=await supabase.from("study_history").insert({
        user_id:session.user.id,
        email:session.user.email,
        topic:savedTopic||topic||"Unknown",
        module:classModRef.current,
        mode,lang,level,
        content:parsedContent,
      });
      if(histErr)throw histErr;
      setRecentTick(n=>n+1);
    }catch(e){console.error("History save failed:",e);}
  };

  /* ── Add current topic to SRS review deck ── */
  const handleAddToReview=async()=>{
    if(!session?.user?.id||!content||cardStatus==="adding"||cardStatus==="added"||cardStatus==="exists")return;
    setCardStatus("adding");
    const result=await addCard(supabase,{
      userId:session.user.id,
      topic:topic||content.title||"Unknown",
      module:classModRef.current,
      lang,level,
      studyHistoryId:null,
    });
    if(!result){setCardStatus(null);return;}
    setCardStatus(result.alreadyExists?"exists":"added");
    if(!result.alreadyExists)onCardAdded?.();
  };

  /* ── Show a saved topic (from the map or the "recent" list) without calling the AI ── */
  const showSaved=(item)=>{
    if(!item||!item.content)return;
    const m=["math","stats","econ","finance","general"].includes(item.mod)?item.mod:"general";
    setContent(item.content);setTopic(item.topic||"");setMod(m);classModRef.current=m;
    if(["lite","fast","think"].includes(item.mode))setMode(item.mode);
    if(item.content.topicType==="problem"||item.content.topicType==="concept")setTopicType(item.content.topicType);
    setFile(null);setFileContent("");setError(null);setValidationError(false);
    setQuizAnswers({});setQuizSubmitted(false);setExamAnswers({});setExamSubmitted(false);
    setChallengeAnswers({});setChallengeSubmitted(false);
    setSimplifiedBlocks(null);setFeynmanDone(false);setCardStatus(null);setActiveSection("explain");
    setPhase("complete");
    setTimeout(()=>window.scrollTo({top:0,behavior:"smooth"}),50);
  };
  useEffect(()=>{if(!pendingLoad)return;showSaved(pendingLoad);onLoadDone?.();},[pendingLoad]);

  /* ── Recent topics for the home screen (titles only; content is fetched on click) ── */
  useEffect(()=>{
    const uid=session?.user?.id;if(!uid)return;
    let alive=true;
    supabase.from("study_history").select("id, topic, module, mode, created_at").eq("user_id",uid).order("created_at",{ascending:false}).limit(30)
      .then(({data})=>{
        if(!alive||!data)return;
        const seen=new Set();const out=[];
        for(const r of data){const k=String(r.topic||"").toLowerCase().trim();if(!k||k==="file"||seen.has(k))continue;seen.add(k);out.push(r);if(out.length>=6)break;}
        setRecent(out);
      });
    return()=>{alive=false;};
  },[session?.user?.id,recentTick]);
  const openSaved=async(r)=>{
    if(openingId!==null)return;
    setOpeningId(r.id);setError(null);
    try{
      const{data,error:e}=await supabase.from("study_history").select("content, topic, module, mode").eq("id",r.id).single();
      if(e||!data?.content)throw e||new Error("empty");
      showSaved({content:data.content,topic:data.topic,mod:data.module,mode:data.mode});
    }catch(err){console.error("openSaved:",err);setError(friendlyError("Failed to fetch",lang));}
    setOpeningId(null);
  };

    const go=async(overrideTopic)=>{
    /* If a related-topic chip triggered this, set topic state and carry topicType forward */
    const activeTopic=overrideTopic!==undefined?overrideTopic:topic;
    if(overrideTopic!==undefined){setTopic(overrideTopic);}
    try{
    if(!activeTopic.trim()&&!fileContent)return;
    if(!fileContent&&!isMathRelated(activeTopic)){setValidationError(true);return;}
    /* Warm up AudioContext on user interaction so sound works when results arrive */
    try{const a=new(window.AudioContext||window.webkitAudioContext)();a.resume().then(()=>setTimeout(()=>{try{a.close();}catch(e){}},100));}catch(e){}
    const accessToken=await getAccessToken();
    setValidationError(false);setPhase("loading");setError(null);setContent(null);setSimplifiedBlocks(null);setSimplifying(false);
    setQuizAnswers({});setQuizSubmitted(false);setExamAnswers({});setExamSubmitted(false);setChallengeAnswers({});setChallengeSubmitted(false);
    setLoadingPhase(0);setActiveSection("explain");usedRef.current.clear();setCardStatus(null);
    setMod("general");setClassifierReady(false);/* reset module + show detecting state */
    /* ── Fire-and-forget AI classifier: snaps colors + jokes + topic type pill within ~1s ── */
    /* Fires BEFORE the if(isLite) branch, so it works for ALL modes: lite, fast, think      */
    const classifyInput=(activeTopic||fileContent||"").slice(0,400);
    const groupId=Date.now().toString(36)+Math.random().toString(36).slice(2,7);
    let classifyP=Promise.resolve(null);
    const localMod=fileContent?null:detectModLocal(activeTopic);
    if(localMod){setMod(localMod);classModRef.current=localMod;setClassifierReady(true);classifyP=Promise.resolve(localMod);}
    else if(classifyInput.trim().length>=2){
      classifyP=fetch("/api/claude",{method:"POST",headers:{"Content-Type":"application/json","Authorization":"Bearer "+accessToken},
        body:JSON.stringify({model:"fast",max_tokens:25,
          _meta:{topic:classifyInput,module:"classifier",mode:"classify",lang,level,request_group_id:groupId},
          system:"Reply with ONLY valid JSON, no markdown or explanation: {\"module\":\"math|stats|econ|finance\",\"type\":\"concept|problem\"}. 'concept' = a theory or topic to understand (e.g. 'Derivatives', 'Supply and Demand'). 'problem' = a specific exercise or calculation to solve (e.g. 'Find the derivative of 3x²', 'Solve 2x+4=10', a PDF with exercises).",
          messages:[{role:"user",content:"Input: "+classifyInput}]})})
      .then(readJson)
      .then(d=>{
        const raw=(d.content||[]).map(b=>b.text||"").join("").trim();
        let parsed={};
        try{parsed=JSON.parse(raw);}catch(e){/* fallback: try to extract words */const m=raw.toLowerCase().replace(/[^a-z]/g," ");if(m.includes("stats"))parsed.module="stats";else if(m.includes("econ"))parsed.module="econ";else if(m.includes("finance"))parsed.module="finance";else if(m.includes("math"))parsed.module="math";if(m.includes("problem"))parsed.type="problem";else if(m.includes("concept"))parsed.type="concept";}
        if(["math","stats","econ","finance"].includes(parsed.module)){setMod(parsed.module);classModRef.current=parsed.module;}
        if(parsed.type==="problem"||parsed.type==="concept"){setTopicType(parsed.type);}
        setClassifierReady(true);
        return ["math","stats","econ","finance"].includes(parsed.module)?parsed.module:null;
      })
      .catch(()=>{setClassifierReady(true);return null;});
    }
    /* Wait briefly for the classifier so the tutor role matches THIS topic.
       Reading `mod` here would give the previous topic's subject (stale state). */
    const detectedMod=(await Promise.race([classifyP,new Promise(r=>setTimeout(()=>r(null),3000))]))||"general";

    const isFast=mode==="fast";
    const isLite=mode==="lite";
    const prompt=fileContent?"Topic: "+(activeTopic||"Analyze this math content")+"\n\nContent:\n"+fileContent.slice(0,5000):"Topic: "+activeTopic;
    const modConf=MOD_CONF[detectedMod]||MOD_CONF.general;
    const roleStr=lang==="es"?modConf.roleEs:modConf.roleEn;
    const langRule=lang==="es"?"CRÍTICO — IDIOMA Y CALIDAD:\n1. TODO el contenido en español argentino natural (voseo, cálido e informal). Usá 'vos' no 'tú'. Ejemplos: 'Imaginá que...', 'Básicamente lo que pasa es...', 'Ponele que tenés...'\n2. ORTOGRAFÍA Y ACENTOS: escribí SIEMPRE con acentos correctos. Ejemplos: 'fichó' no 'fico', 'también' no 'tambien', 'después' no 'despues', 'así' no 'asi'. Revisá cada palabra.\n3. TÉRMINOS TÉCNICOS: los términos técnicos aceptados en español (backpropagation, machine learning, overfitting, clustering) pueden quedarse en inglés. Todo lo demás en español.\n4. ETIQUETAS OBLIGATORIAS EN ESPAÑOL: el campo 'label' de bloques analogy DEBE ser 'Pensalo así' (no 'Think of it like this'). El campo 'title' de bloques steps DEBE empezar con 'Ejemplo Resuelto:' (no 'Worked Example:'). Los pasos deben decir 'Paso 1:', 'Paso 2:' etc.\n5. NUNCA uses / (barra) entre palabras en texto explicativo. Escribí 'dado que' no 'dado/que', 'verdadero o falso' no 'verdadero/falso'.\n6. PROHIBIDO: insultos, malas palabras o lenguaje ofensivo en cualquier idioma (no 'jodido', 'mierda', 'pelotudo', 'carajo', ni similares). Mantené todo respetuoso y profesional.\n7. NUNCA uses términos en inglés como 'Net Income', 'Revenue', 'Current Assets' — usá 'Ingreso Neto', 'Ingresos', 'Activos Corrientes'. Abreviaturas estándar (ROE, ROA, NPV, WACC, CAPM) están bien.":"All JSON string values in English. NEVER use insults or offensive language in any language.";
    const ytLang=lang==="es"?"youtubeSearches: 3 VERY SPECIFIC YouTube search queries IN SPANISH. Include channel names.":"youtubeSearches: 3 VERY SPECIFIC YouTube search queries IN ENGLISH. Include channel names.";
    const safeInterest=interest.trim()&&!isBlockedInterest(interest)?interest.trim():"";
    const levelCtx=level==="beginner"
      ?" BEGINNER LEVEL. The student has ZERO prior knowledge. Rules: (1) NO jargon without an immediate plain-English definition. (2) Every analogy must use everyday objects (food, sports, money — nothing academic). (3) Worked examples use only small whole numbers. (4) NEVER skip a step. (5) No references to other math concepts the student may not know. Explain as if talking to a curious 10-year-old."
      :level==="advanced"
      ?" ADVANCED LEVEL. The student has a strong math/science background. Rules: (1) Use precise formal language and standard notation without defining basics. (2) Skip elementary steps — show only non-obvious derivations. (3) Worked examples must be challenging and non-trivial. (4) Go deep: edge cases, limitations, connections to related advanced concepts. (5) No dumbed-down analogies."
      :" INTERMEDIATE LEVEL. The student knows the basics but is not an expert. Rules: (1) Define specialized terms but skip obvious ones. (2) Mix intuitive explanation with formal notation. (3) Worked examples use realistic numbers, not trivial cases. (4) Include both the 'why it works' and the 'how to apply it'.";
    /* ── Interest context: split by call ── */
    const sonnetInterestCtx=safeInterest?"\n\nPERSONALIZATION (very important): The user loves \""+safeInterest+"\". You MUST:\n- Make ALL analogies and explanations reference \""+safeInterest+"\" creatively (characters, scenarios, themes from it).\n- In the exam: at least 2-3 questions should frame the math problem using \""+safeInterest+"\" context (e.g. if they like The Simpsons, use Homer/Bart in word problems).\n- Be creative and fun with the references, not forced. Make it feel like a fan made this module.":"";
    const haikuInterestCtx=safeInterest?"\n\nPERSONALIZATION: The user loves \""+safeInterest+"\". You MUST weave \""+safeInterest+"\" references naturally into tips. Be creative and fun, not forced.":"";
    const liteInterestCtx=safeInterest?"\n\nPERSONALIZATION (very important): The user loves \""+safeInterest+"\". You MUST:\n- Make the analogy block and explanations reference \""+safeInterest+"\" (characters, scenarios, themes from it).\n- At least 1 exam question should frame the problem using \""+safeInterest+"\" context.\n- Weave references into tips too. Be creative and fun, not forced.":"";
    /* ── Topic type: AI self-detects in main call; classifier updates pill early ── */
    const topicTypeCtx="\n\nTOPIC TYPE (CRITICAL — AUTO-DETECT AND OUTPUT IN JSON):\nBefore generating content, determine whether the input is:\n• CONCEPT/THEORY → a topic to understand (e.g. 'Derivatives', 'Central Limit Theorem', 'Supply & Demand')\n• PROBLEM/EXERCISE → a specific exercise, calculation, or file with problems to solve (e.g. 'Find the derivative of 3x\u00B2+2x', 'Solve 2x+4=10', a PDF worksheet)\nOutput \"topicType\":\"concept\" or \"topicType\":\"problem\" as a REQUIRED top-level JSON key.\nCRITICAL BLOCK ORDER based on detected type:\n• concept → standard order: analogy block first, then text/keypoint, steps block last as worked example.\n• problem → Feynman in reverse: steps block FIRST with the complete step-by-step solution to the exact problem, then text/analogy block explaining WHY each step works and the underlying principle. NEVER start with analogy when a problem was submitted.";

    try{
      if(isLite){
        /* ── LITE MODE: single Haiku call — all sections, minimal content ── */
        const controller=new AbortController();
        const timeout=setTimeout(()=>controller.abort(),120000);
        const liteSystem="You are "+roleStr+"."+levelCtx+"\n"+langRule+"\n\nNOTATION \u2014 CRITICAL RULES (Haiku makes specific mistakes \u2014 avoid ALL of them):\n\u2022 MULTIPLICATION: The ONLY allowed symbol is \u00D7. Write: (1)/(2)\u00D7ln(x), a\u00D7b, 2\u00D7n. NEVER use the letter x or X as a multiplication operator between terms. BAD: 'A x B', '2 x n'. GOOD: 'A\u00D7B', '2\u00D7n'. The letter x is ONLY a variable.\n\u2022 FRACTIONS: EVERY division needs (numerator)/(denominator) with parens on BOTH sides. MANDATORY in quiz/exam options. BAD: '1/2\u00D7ln(x)', '1/4 + C'. GOOD: '(1)/(2)\u00D7ln(x)', '(1)/(4) + C', '(x^3)/(3)'. Integration results: (x^3)/(3)\u00D7ln(x) \u2212 (x^3)/(9) + C. NEVER write 1/2 or x/3 without parens.\n\u2022 EXPONENTS: Multi-character exponents MUST use {}: e^{3t}, e^{-x}, x^{n+1}. Single char: x^2, e^n. NEVER drop the ^ symbol. BAD: 'e3t' (write e^{3t}), 'e(3t)' (write e^{3t}), 'x^32' (write (x^3)/(2)). If exponent has 2+ chars, ALWAYS use {}.\n\u2022 CALCULUS: Integrals: \u222B e^{3t} dt NOT '\u222B (e^3t3) dt'. Integration by parts: u = t, dv = e^{3t} dt NOT 'e3tdt'. Antiderivatives include + C. Derivatives: (dy)/(dx), f'(x).\n\u2022 Radicals: \u221A{content} \u2014 e.g. \u221A{2}, \u221A{x+1}. NEVER 'square root of'.\n\u2022 Absolute value: |x|. Logarithms: log_b(x), ln(x). Subscripts: x_0, x_i. Greek: \u03B1 \u03B2 \u03B3 \u03B4 \u03B5 \u03B8 \u03BB \u03BC \u03C0 \u03C3 \u03C6 \u03C9 (or spell out).\n\u2022 Comparisons: \u2265 \u2264 \u2260 \u2248 \u00B1 (or >=, <=, !=, approx, +-). NEVER use LaTeX \\\\frac or \\\\sqrt style."+modConf.notationPrompt+"\n\nRESPOND WITH ONLY A SINGLE JSON OBJECT. No markdown fences.\nRequired JSON keys (ALL MANDATORY):\n- \"title\": string\n- \"explanationBlocks\": array of 2-3 objects. BLOCK ORDER: analogy first, then text/keypoint, steps last.\n  {\"type\":\"analogy\",\"label\":\"Think of it like this\",\"text\":\"...\"} | {\"type\":\"text\",\"text\":\"...\"} | {\"type\":\"keypoint\",\"text\":\"...\"} | {\"type\":\"steps\",\"title\":\"Worked Example: [name]\",\"context\":\"Full problem. MANDATORY.\",\"items\":[\"Step 1:...\"]}\n  CRITICAL: every block MUST have non-empty text/items.\n- \"keyConcepts\": array of 2 objects {\"title\",\"description\",\"formula\"}\n- \"applications\": array of 1 object {\"title\",\"description\",\"example\"}\n- \"quiz\": array of 3 objects (2 mc + 1 tf).\n  MC: {\"type\":\"mc\",\"question\":\"...\",\"options\":[4 strings],\"correctIndex\":0-3,\"explanation\":\"1 sentence\"}\n  TF: {\"type\":\"tf\",\"statement\":\"A clear true-or-false claim\",\"answer\":true or false,\"explanation\":\"Why\"}\n- \"exam\": array of 3 mc objects {\"type\":\"mc\",\"question\",\"options\":[4 strings],\"correctIndex\":0-3,\"explanation\"}\n- \"tips\": array of 2 objects {\"title\",\"content\"}\n- "+ytLang+"\nKeep ALL sections concise: 1-2 sentences per block, 1 sentence per explanation. CURRENT YEAR IS 2026: use 2025-2026 context for any examples or data — never cite 2023 or earlier as recent/current. CORRECTNESS CHECK (CRITICAL): for every MC question, re-read options[correctIndex] and confirm it is the factually correct answer; your explanation MUST confirm that same option — a mismatch breaks the quiz. TOOL REFERENCES: if you mention any software tool (Excel, Python, R, etc.) in a question or example, you MUST briefly explain what that tool does in that context — never assume the student knows it. Vary correctIndex 0-3 randomly. NO REASONING IN EXPLANATIONS (CRITICAL): The \"explanation\" field of every quiz/exam MC question must be ONE clean sentence stating why the correctIndex option is correct. NEVER write \"espera\", \"esperá\", \"wait\", \"actually\", \"hmm\", \"let me recheck\", \"cambiando\", \"re-cálculo\", \"revisá\", \"no, la respuesta es\", or ANY meta-commentary, self-correction, or thinking-out-loud. Do all reasoning INTERNALLY before writing JSON; only output the final clean answer. NEVER mention \"index N\" or \"opción N\" in the explanation text — correctIndex already encodes that. If your answer changes mid-thought, rewrite correctIndex AND explanation cleanly; do NOT leave a trail."+liteInterestCtx+topicTypeCtx+"\n\nADDITIONAL REQUIRED JSON KEY:\n- \"relatedTopics\": array of 4-5 objects {\"label\":string,\"tagline\":string} — closely related subtopics or techniques to explore next. Keep labels short (2-5 words). Taglines: one brief phrase. NEVER list the current topic itself.";
        const liteRes=await fetch("/api/claude",{method:"POST",headers:{"Content-Type":"application/json","Authorization":"Bearer "+accessToken},signal:controller.signal,
          body:JSON.stringify({model:"fast",max_tokens:5500,
            _meta:{topic:activeTopic||"file",module:detectedMod,mode:"lite",lang,level,request_group_id:groupId},
            system:liteSystem,messages:[{role:"user",content:prompt}]})});
        const liteData=await readJson(liteRes);clearTimeout(timeout);
        if(liteData.error)throw new Error(liteData.error.message||liteData.error);
        const rawLite=(liteData.content||[]).map(b=>b.text||"").join("");
        if(!rawLite||rawLite.trim().length<10)throw new Error("Empty response from API. Please try again.");
        const parsed=safeParseJSON(rawLite);if(!parsed.title)throw new Error("Could not parse response. Please try again.");
        if(!parsed.exam||!Array.isArray(parsed.exam)||parsed.exam.length===0){parsed.exam=[{type:"mc",question:lang==="es"?"El examen no se gener\u00F3. Intent\u00E1 de nuevo.":"Exam was not generated. Please try again.",options:["\u2014","\u2014","\u2014","\u2014"],correctIndex:0,explanation:""}];}
        if(!parsed.tips||!Array.isArray(parsed.tips)||parsed.tips.length===0){parsed.tips=[{title:lang==="es"?"Practic\u00E1 con ejemplos":"Practice with examples",content:lang==="es"?"La mejor forma de aprender es resolver problemas paso a paso.":"The best way to learn is by solving problems step by step."}];}
        if(!parsed.quiz||!Array.isArray(parsed.quiz)||parsed.quiz.length===0){parsed.quiz=[{type:"mc",question:lang==="es"?"El quiz no se gener\u00F3. Intent\u00E1 de nuevo.":"Quiz was not generated. Please try again.",options:["\u2014","\u2014","\u2014","\u2014"],correctIndex:0,explanation:""}];}
        if(!parsed.keyConcepts||!Array.isArray(parsed.keyConcepts))parsed.keyConcepts=[];
        if(!parsed.applications||!Array.isArray(parsed.applications))parsed.applications=[];
        if(!parsed.explanationBlocks||!Array.isArray(parsed.explanationBlocks))parsed.explanationBlocks=[];
        const finalLite=shuffleMC(deepFmt(sanitizeAllMC(parsed)));setContent(finalLite);setPhase("complete");playDing();saveHistory(finalLite,activeTopic||finalLite.title||"file");
        if(parsed.topicType==="problem"||parsed.topicType==="concept")setTopicType(parsed.topicType);
        setTimeout(()=>window.scrollTo({top:0,behavior:"smooth"}),200);
      }else{
        /* ── FAST / THINK: parallel Sonnet + Haiku calls ── */
        const controller=new AbortController();
        const timeout=setTimeout(()=>controller.abort(),mode==="think"?240000:150000);/* deep mode thinks longer */
        const authH={"Content-Type":"application/json","Authorization":"Bearer "+accessToken};

        /* ── Sonnet: explanation + keyConcepts + applications + exam (+ examChallenge in think) ── */
        const sonnetSystem="You are "+roleStr+"."+levelCtx+"\n"+langRule+"\n\nNOTATION \u2014 ALWAYS USE SYMBOLS, NEVER WRITE MATH IN WORDS:\n\u2022 Fractions/division: (num)/(den) ALWAYS with parens, \u00F7 for arithmetic. NEVER \'divided by\'.\n\u2022 Radicals: \u221A{content} or sqrt{content} \u2014 e.g. \u221A{2}, \u221A{x+1}. NEVER 'square root of'.\n\u2022 Powers: x^2, 2^3, e^n, x^{n+1}, (1+r)^n. NEVER 'squared', 'cubed', 'to the power of'.\n\u2022 Multiplication: \u00D7 directly \u2014 write a\u00D7b, 2\u00D7n. NEVER 'times' or 'multiplied by'.\n\u2022 Absolute value: |x|, |a-b|. NEVER 'absolute value of'.\n\u2022 Logarithms: log_b(x), log_{10}(x), ln(x). NEVER \'log base b of\'.\n\u2022 Subscripts: x_0, x_i, x_{n-1} (or \u2080\u2081\u2082 for simple cases).\n\u2022 Integrals: \u222B[a,b] f(x) dx. Sums: \u2211[i=1,n] a_i. Products: \u220F[i=1,n]. NEVER \'integral from...\', \'sum from...\'.\n\u2022 Limits: lim_{x\u2192a} f(x) or lim[x\u21920]. NEVER 'as x approaches'.\n\u2022 Derivatives: (dy)/(dx), f'(x), f''(x), (\u2202f)/(\u2202x). NEVER 'derivative of ... with respect to'.\n\u2022 Greek: \u03B1 \u03B2 \u03B3 \u03B4 \u03B5 \u03B8 \u03BB \u03BC \u03C0 \u03C3 \u03C6 \u03C9.\n\u2022 Comparisons: \u2265 \u2264 \u2260 \u2248 \u00B1 (or write >=, <=, !=, approx, +-). NEVER use LaTeX \\\\frac or \\\\sqrt style.\nDerivatives: (dy)/(dx) not dydx. f'(x) for prime."+modConf.notationPrompt+"\n\nFORMULA FORMATTING RULES (CRITICAL):\n1. EVERY fraction MUST have (numerator)/(denominator) with BOTH parentheses. Example: (n\u2211xy - \u2211x\u2211y)/(n\u2211x\u00B2 - (\u2211x)\u00B2). NEVER write num/den without parens.\n2. ONE formula per line. NEVER chain multiple formulas with commas. If showing slope AND intercept, put each on its OWN line.\n3. In keyConcepts formula field: put ONLY the main formula. If there are multiple related formulas, separate with \\n newline character.\n4. In keypoint blocks: if you include a formula, put it on its own line after the explanation text, separated by \\n.\n5. Formatting: **bold** key terms, __underline__ key formulas (explanations only, sparingly).\n\nRESPOND WITH ONLY A SINGLE JSON OBJECT. No markdown fences.\nRequired JSON keys (ALL are MANDATORY - never omit any):\n- \"title\": string\n- \"explanationBlocks\": array of "+(isFast?"3-4":"5-6")+" objects, each with \"type\" and fields. "+(isFast?"Include 1+ \"steps\" block.":"Include 2+ \"steps\" blocks.")+"\n  BLOCK ORDER (MANDATORY): Explain the concept FIRST, then show examples. Structure: 1) Start with an \"analogy\" block, 2) then \"text\" and \"keypoint\" blocks for theory/definitions/formulas, 3) put \"steps\" blocks LAST as worked examples. NEVER start with a steps block.\n  BLOCK FORMATS (follow exactly):\n  - {\"type\":\"analogy\", \"label\":\"Think of it like this\", \"text\":\"A concrete everyday analogy that makes the concept click. MUST NOT be empty.\"}\n  - {\"type\":\"text\", \"text\":\"A paragraph explaining theory, definitions, or intuition.\"}\n  - {\"type\":\"keypoint\", \"text\":\"A key takeaway or important formula.\"}\n  - {\"type\":\"steps\", \"title\":\"Worked Example: [name]\", \"context\":\"The FULL problem statement \u2014 what is given, what to find. MANDATORY.\", \"items\":[\"Step 1: ...\",\"Step 2: ...\"]}\n  CRITICAL: Every block MUST have non-empty \"text\" (for analogy/text/keypoint) or \"items\" (for steps). NEVER return empty strings.\n- \"keyConcepts\": array of 3 objects {\"title\",\"description\",\"formula\"}\n- \"applications\": array of "+(isFast?"2":"3")+" objects {\"title\",\"description\",\"example\"}\n- \"exam\": array of "+(isFast?"5":"10")+" objects, ALL mc with question, options, correctIndex, explanation.\n"+(isFast?"":"- \"examChallenge\": array of 8 objects. 5 hard mc + 3 solve.\n  Solve format: {\"type\":\"solve\",\"problem\":\"A word problem to solve on paper\",\"hint\":\"A brief clue\",\"solution\":\"Full step-by-step solution with calculations\"}\n  CRITICAL: solve MUST have \"problem\" (NOT \"question\"), \"hint\", and \"solution\".\n")+"OUTPUT LENGTH MANAGEMENT (CRITICAL): ALL sections above are MANDATORY. Keep explanationBlocks CONCISE (max 2-3 sentences per text block, max 4 steps). Keep keyConcepts to 1-2 sentences. Keep exam explanations to 1 sentence. PRIORITIZE completeness over verbosity. CURRENT YEAR IS 2026: use 2025-2026 context for any examples, data, or references — never cite 2023 or earlier as recent/current. CORRECTNESS CHECK (CRITICAL): for every MC question, re-read options[correctIndex] and confirm it is factually correct; the explanation MUST reference that same option — a mismatch makes the exam wrong. TOOL REFERENCES: if you mention any software tool (Excel, Python, R, a spreadsheet function, etc.) in any question or example, you MUST briefly explain what it does in that context — never assume the student knows the tool. Vary correctIndex 0-3 randomly. NO REASONING IN EXPLANATIONS (CRITICAL): The \"explanation\" field of every quiz/exam MC question must be ONE clean sentence stating why the correctIndex option is correct. NEVER write \"espera\", \"esperá\", \"wait\", \"actually\", \"hmm\", \"let me recheck\", \"cambiando\", \"re-cálculo\", \"revisá\", \"no, la respuesta es\", or ANY meta-commentary, self-correction, or thinking-out-loud. Do all reasoning INTERNALLY before writing JSON; only output the final clean answer. NEVER mention \"index N\" or \"opción N\" in the explanation text — correctIndex already encodes that. If your answer changes mid-thought, rewrite correctIndex AND explanation cleanly; do NOT leave a trail."+sonnetInterestCtx+topicTypeCtx+"\n\nADDITIONAL REQUIRED JSON KEY:\n- \"relatedTopics\": array of 4-5 objects {\"label\":string,\"tagline\":string} — closely related subtopics or techniques the student should explore AFTER mastering this topic. Examples for 'Derivatives': [{\"label\":\"Chain Rule\",\"tagline\":\"Derivatives of nested functions\"},{\"label\":\"Optimization Problems\",\"tagline\":\"Finding maxima and minima\"}]. Keep labels short (2-5 words). Taglines: one brief phrase. NEVER list the current topic itself.";

        /* ── Haiku: quiz + tips + youtubeSearches ── */
        const haikuSystem="You are "+roleStr+"."+levelCtx+"\n"+langRule+"\n\nNOTATION \u2014 CRITICAL RULES (Haiku makes specific mistakes \u2014 avoid ALL of them):\n\u2022 MULTIPLICATION: The ONLY allowed symbol is \u00D7. Write: (1)/(2)\u00D7ln(x), a\u00D7b, 2\u00D7n. NEVER use the letter x or X as a multiplication operator between terms. BAD: 'A x B', '2 x n'. GOOD: 'A\u00D7B', '2\u00D7n'. The letter x is ONLY a variable.\n\u2022 FRACTIONS: EVERY division needs (numerator)/(denominator) with parens on BOTH sides. MANDATORY in quiz/exam options. BAD: '1/2\u00D7ln(x)', '1/4 + C'. GOOD: '(1)/(2)\u00D7ln(x)', '(1)/(4) + C', '(x^3)/(3)'. Integration results: (x^3)/(3)\u00D7ln(x) \u2212 (x^3)/(9) + C. NEVER write 1/2 or x/3 without parens.\n\u2022 EXPONENTS: Multi-character exponents MUST use {}: e^{3t}, e^{-x}, x^{n+1}. Single char: x^2, e^n. NEVER drop the ^ symbol. BAD: 'e3t' (write e^{3t}), 'e(3t)' (write e^{3t}), 'x^32' (write (x^3)/(2)). If exponent has 2+ chars, ALWAYS use {}.\n\u2022 CALCULUS: Integrals: \u222B e^{3t} dt NOT '\u222B (e^3t3) dt'. Integration by parts: u = t, dv = e^{3t} dt NOT 'e3tdt'. Antiderivatives include + C. Derivatives: (dy)/(dx), f'(x).\n\u2022 Radicals: \u221A{content} \u2014 e.g. \u221A{2}, \u221A{x+1}. NEVER 'square root of'.\n\u2022 Absolute value: |x|. Logarithms: log_b(x), ln(x). Subscripts: x_0, x_i. Greek: \u03B1 \u03B2 \u03B3 \u03B4 \u03B5 \u03B8 \u03BB \u03BC \u03C0 \u03C3 \u03C6 \u03C9 (or spell out).\n\u2022 Comparisons: \u2265 \u2264 \u2260 \u2248 \u00B1 (or >=, <=, !=, approx, +-). NEVER use LaTeX \\\\frac or \\\\sqrt style."+modConf.notationPrompt+"\n\nRESPOND WITH ONLY A SINGLE JSON OBJECT. No markdown fences.\nRequired JSON keys (ALL are MANDATORY - never omit any):\n- \"quiz\": array of "+(isFast?"3":"5")+" objects. "+(isFast?"2 mc + 1 tf.":"3 mc + 2 tf.")+"\n  MC format: {\"type\":\"mc\",\"question\":\"...\",\"options\":[4 strings],\"correctIndex\":0-3,\"explanation\":\"1 sentence\"}\n  TF format: {\"type\":\"tf\",\"statement\":\"A clear true-or-false claim\",\"answer\":true or false,\"explanation\":\"Why\"}\n  CRITICAL: tf MUST have \"statement\" (NOT \"question\"), \"answer\" (boolean), and \"explanation\".\n- \"tips\": array of "+(isFast?"2":"3")+" objects {\"title\",\"content\"}\n- "+ytLang+"\nKeep quiz explanations to 1 sentence. CURRENT YEAR IS 2026: use 2025-2026 context for any examples or references — never cite 2023 or earlier as recent/current. CORRECTNESS CHECK (CRITICAL): for every MC question, re-read options[correctIndex] and verify it is the correct answer; the explanation MUST confirm that same option. TOOL REFERENCES: if you mention any software tool (Excel, Python, etc.) in a question, briefly explain what it does in that context. Vary correctIndex 0-3 randomly. NO REASONING IN EXPLANATIONS (CRITICAL): The \"explanation\" field of every quiz/exam MC question must be ONE clean sentence stating why the correctIndex option is correct. NEVER write \"espera\", \"esperá\", \"wait\", \"actually\", \"hmm\", \"let me recheck\", \"cambiando\", \"re-cálculo\", \"revisá\", \"no, la respuesta es\", or ANY meta-commentary, self-correction, or thinking-out-loud. Do all reasoning INTERNALLY before writing JSON; only output the final clean answer. NEVER mention \"index N\" or \"opción N\" in the explanation text — correctIndex already encodes that. If your answer changes mid-thought, rewrite correctIndex AND explanation cleanly; do NOT leave a trail."+haikuInterestCtx+topicTypeCtx;

        /* ── Fire both in parallel ── */
        const [sonnetRes,haikuRes]=await Promise.all([
          fetch("/api/claude",{method:"POST",headers:authH,signal:controller.signal,
            body:JSON.stringify({model:"smart",max_tokens:isFast?8000:12000,
              _meta:{topic:activeTopic||"file",module:detectedMod,mode,lang,level,request_group_id:groupId},
              system:sonnetSystem,messages:[{role:"user",content:prompt}]})}),
          fetch("/api/claude",{method:"POST",headers:authH,signal:controller.signal,
            body:JSON.stringify({model:"fast",max_tokens:isFast?3500:5000,
              _meta:{topic:activeTopic||"file",module:detectedMod,mode:mode+"_haiku",lang,level,request_group_id:groupId},
              system:haikuSystem,messages:[{role:"user",content:prompt}]})}),
        ]);
        const [sonnetData,haikuData]=await Promise.all([readJson(sonnetRes),readJson(haikuRes).catch(e=>({error:{message:String(e&&e.message||e)}}))]);
        clearTimeout(timeout);
        if(sonnetData.error)throw new Error(sonnetData.error.message||sonnetData.error);
        if(haikuData.error)console.warn("Quiz/tips call failed:",haikuData.error);

        const rawSonnet=(sonnetData.content||[]).map(b=>b.text||"").join("");
        const rawHaiku=(haikuData.content||[]).map(b=>b.text||"").join("");
        if(!rawSonnet||rawSonnet.trim().length<10)throw new Error("Empty response from API. Please try again.");

        const parsedSonnet=safeParseJSON(rawSonnet);
        let parsedHaiku={};
        try{if(rawHaiku&&rawHaiku.trim().length>=10)parsedHaiku=safeParseJSON(rawHaiku)||{};}catch(e){console.warn("Quiz/tips parse failed:",e);}
        if(!parsedSonnet.title)throw new Error("Could not parse response. Please try again.");

        /* ── Merge both responses ── */
        const parsed={...parsedSonnet,
          quiz:parsedHaiku.quiz,
          tips:parsedHaiku.tips,
          youtubeSearches:parsedHaiku.youtubeSearches,
        };

        /* Validate critical sections */
        if(!parsed.exam||!Array.isArray(parsed.exam)||parsed.exam.length===0){
          parsed.exam=[{type:"mc",question:lang==="es"?"El contenido del examen no se gener\u00F3 correctamente. Intent\u00E1 de nuevo.":"Exam content was not generated correctly. Please try again.",options:["\u2014","\u2014","\u2014","\u2014"],correctIndex:0,explanation:""}];
        }
        if(!parsed.tips||!Array.isArray(parsed.tips)||parsed.tips.length===0){
          parsed.tips=[{title:lang==="es"?"Practic\u00E1 con ejemplos":"Practice with examples",content:lang==="es"?"La mejor forma de aprender es resolver problemas paso a paso.":"The best way to learn is by solving problems step by step."}];
        }
        if(!parsed.quiz||!Array.isArray(parsed.quiz)||parsed.quiz.length===0){
          parsed.quiz=[{type:"mc",question:lang==="es"?"El quiz no se gener\u00F3. Intent\u00E1 de nuevo.":"Quiz was not generated. Please try again.",options:["\u2014","\u2014","\u2014","\u2014"],correctIndex:0,explanation:""}];
        }
        if(!parsed.keyConcepts||!Array.isArray(parsed.keyConcepts))parsed.keyConcepts=[];
        if(!parsed.applications||!Array.isArray(parsed.applications))parsed.applications=[];
        if(!parsed.explanationBlocks||!Array.isArray(parsed.explanationBlocks))parsed.explanationBlocks=[];
        const finalFull=shuffleMC(deepFmt(sanitizeAllMC(parsed)));setContent(finalFull);setPhase("complete");playDing();saveHistory(finalFull,activeTopic||finalFull.title||"file");
        if(parsed.topicType==="problem"||parsed.topicType==="concept")setTopicType(parsed.topicType);
        setTimeout(()=>window.scrollTo({top:0,behavior:"smooth"}),200);
      }/* end fast/think else */
    }catch(err){
      console.error(err);
      setError(friendlyError(err.name==="AbortError"?"AbortError":err.message,lang));setPhase("idle");
    }

    }catch(outerErr){console.error("go() error:",outerErr);setError(friendlyError(outerErr.message,lang));setPhase("idle");}
  };

  /* ═══════════ "I didn't understand" — one-shot simpler explanation ═══════════ */
  const simplify=async()=>{
    if(simplifiedBlocks||simplifying||!content)return;
    setSimplifying(true);
    try{
      const accessToken=await getAccessToken();
      const modConf=MOD_CONF[mod]||MOD_CONF.general;
      const roleStr=lang==="es"?modConf.roleEs:modConf.roleEn;
      const langRule=lang==="es"?"CRÍTICO: Todo en español argentino (voseo). Acentos correctos siempre. El campo 'label' de analogy: 'Pensalo así'. El campo 'title' de steps: 'Ejemplo Resuelto: [nombre]'. Pasos: 'Paso 1:', 'Paso 2:'. Sin insultos ni malas palabras.":"All JSON string values in English.";
      const safeInterest=interest.trim()&&!isBlockedInterest(interest)?interest.trim():"";
      const interestNote=safeInterest?" The user loves \""+safeInterest+"\", use it in analogies.":"";
      const originalText=(content.explanationBlocks||[]).map(b=>b.text||b.title||(b.items||[]).join("; ")).join(" ").slice(0,2000);
      const controller=new AbortController();
      const timeout=setTimeout(()=>controller.abort(),120000);
      const res=await fetch("/api/claude",{
        method:"POST",headers:{"Content-Type":"application/json","Authorization":"Bearer "+accessToken},
        signal:controller.signal,
        body:JSON.stringify({model:"smart",max_tokens:4000,
          _meta:{topic:content.title||"simplify",module:mod,mode:"simplify",lang,request_group_id:Date.now().toString(36)+Math.random().toString(36).slice(2,7)},
          system:"You are "+roleStr+". The student did NOT understand the previous explanation. Your job: RE-EXPLAIN the same topic but MUCH SIMPLER.\n"+langRule+"\n\nRULES:\n1. Explain like you\u2019re talking to an 8-year-old. Zero jargon.\n2. Use a CONCRETE, EVERYDAY analogy as the backbone (pizza slices, sharing candy, filling a pool, etc.).\n3. Walk through ONE practical example step-by-step with actual numbers. Show EVERY calculation. IMPORTANT: explain the concept FIRST (analogy + text), THEN show the worked example (steps block) AFTER.\n4. Keep it SHORT \u2014 3-4 blocks max. No walls of text.\n5. Include a mini \"try this\" at the end: ONE super easy problem they can solve in 10 seconds with the answer.\n6. NOTATION \u2014 ALWAYS USE SYMBOLS, NEVER WRITE MATH IN WORDS: fractions (num)/(den) or \u00F7 (NEVER 'divided by'); radicals \u221A{content} or sqrt{content} (NEVER 'square root of'); powers x^2, 2^3, e^n (NEVER 'squared', 'to the power of'); multiplication \u00D7 directly, e.g. a\u00D7b (NEVER 'times'); absolute value |x| (NEVER 'absolute value of'); logarithms log_b(x), ln(x) (NEVER 'log base b of'); Greek \u03C3\u03BC\u03C0\u03B1\u03B2. NEVER use LaTeX \\\\frac or \\\\sqrt style."+modConf.notationPrompt+"\n"+interestNote+"\n\nRESPOND WITH ONLY A JSON ARRAY of explanation blocks. No markdown fences.\nEach block: {\"type\":\"analogy\"|\"steps\"|\"text\"|\"keypoint\", \"text\"?:string, \"label\"?:string, \"title\"?:string, \"context\"?:string (REQUIRED for steps — the full problem setup), \"items\"?:[strings]}.\nExample: [{\"type\":\"analogy\",\"label\":\"Think of it like this\",\"text\":\"Imagine you have 12 cookies...\"},{\"type\":\"steps\",\"title\":\"Let\u2019s solve one together\",\"context\":\"You have 12 cookies and want to share them equally among 3 friends. How many does each friend get?\",\"items\":[\"Step 1: ...\",\"Step 2: ...\"]},{\"type\":\"keypoint\",\"text\":\"The answer is 4! Try this: ...\"}]",
          messages:[{role:"user",content:"The student didn\u2019t understand this explanation of \""+content.title+"\":\n\n"+originalText+"\n\nRe-explain it MUCH more simply with a concrete step-by-step example."}],
        }),
      });
      const data=await readJson(res);clearTimeout(timeout);
      if(data.error)throw new Error(data.error.message);
      const raw=(data.content||[]).map(b=>b.text||"").join("");
      let parsed;
      try{parsed=safeParseJSON(raw);}catch(e){parsed=null;}
      /* Handle various response shapes: array, {blocks:[...]}, or single object */
      let blocks=null;
      if(Array.isArray(parsed)&&parsed.length>0)blocks=parsed;
      else if(parsed&&Array.isArray(parsed.blocks)&&parsed.blocks.length>0)blocks=parsed.blocks;
      else if(parsed&&Array.isArray(parsed.explanationBlocks)&&parsed.explanationBlocks.length>0)blocks=parsed.explanationBlocks;
      else if(parsed&&parsed.type&&parsed.text)blocks=[parsed];/* single block object */
      if(blocks){setSimplifiedBlocks(deepFmt(blocks));}
      else{throw new Error("Bad format");}
    }catch(err){console.error("simplify error:",err);setSimplifiedBlocks([{type:"text",text:lang==="es"?"No se pudo generar una explicaci\u00F3n m\u00E1s simple. Intent\u00E1 de nuevo con otro tema.":"Could not generate a simpler explanation. Try again with another topic."}]);}
    finally{setSimplifying(false);}
  };

  // Scoring
  const quizMC=(content?.quiz||[]).filter(q=>q.type==="mc");
  const quizTF=(content?.quiz||[]).filter(q=>q.type==="tf");
  const quizMCScore=quizMC.reduce((a,q,i)=>{const idx=(content?.quiz||[]).indexOf(q);return a+(quizAnswers[idx]===parseInt(q.correctIndex,10)?1:0);},0);
  const quizTFScore=quizTF.reduce((a,q)=>{const idx=(content?.quiz||[]).indexOf(q);return a+(quizAnswers[idx]===q.answer?1:0);},0);
  const quizScore=quizMCScore+quizTFScore;
  const quizTotal=(content?.quiz||[]).length;
  const quizAllAnswered=Object.keys(quizAnswers).length>=quizTotal;

  const examScore=content?.exam?content.exam.reduce((a,q,i)=>a+(examAnswers[i]===parseInt(q.correctIndex,10)?1:0),0):0;
  const examTotal=(content?.exam||[]).length;

  const challengeMC=(content?.examChallenge||[]).filter(q=>q.type==="mc");
  const challengeMCScore=challengeMC.reduce((a,q)=>{const idx=(content?.examChallenge||[]).indexOf(q);return a+(challengeAnswers[idx]===parseInt(q.correctIndex,10)?1:0);},0);

  /* ═══════════ Derived view state ═══════════ */
  const x=X[lang]||X.en;
  const showResults=phase==="complete"&&content;
  const canGo=phase!=="loading"&&(topic.trim().length>0||!!fileContent)&&!interestError;
  const pct=(n,total)=>Math.round((n/Math.max(total,1))*100);
  const tone=(n,total)=>n>=total*0.8?" is-good":n>=total*0.5?"":" is-bad";
  const examAnswered=Object.keys(examAnswers).length;
  const challengeAnswered=Object.keys(challengeAnswers).length;
  const sections=[
    {id:"explain",label:t.understand},
    {id:"quiz",label:t.quiz,done:quizSubmitted},
    {id:"exam",label:t.exam,done:examSubmitted},
    {id:"tips",label:t.tips},
    ...(mode==="think"?[{id:"deck",label:t.deck}]:[]),
  ];
  const goSection=(id)=>{setActiveSection(id);window.scrollTo({top:0,behavior:"smooth"});};
  const chips=mod==="general"
    ?[...CHIPS.math[lang].slice(0,2),...CHIPS.stats[lang].slice(0,2),...CHIPS.econ[lang].slice(0,2),...CHIPS.finance[lang].slice(0,2)]
    :(CHIPS[mod]||CHIPS.math)[lang];
  const modes=[["lite",t.modeLite,t.modeLiteDesc],["fast",t.modeFast,t.modeFastDesc],["think",t.modeThink,t.modeThinkDesc]];
  const showFeynman=(mode==="fast"||mode==="think")&&!feynmanDone;
  const feynman=<FeynmanPrompt topic={topic||content?.title||""} keyConcepts={content?.keyConcepts} lang={lang} t={t} onDone={()=>setFeynmanDone(true)}/>;
  const inDeck=cardStatus==="added"||cardStatus==="exists";

  return <div className="mm" data-subject={mod}>
    <input ref={fileRef} type="file" accept=".pdf,.txt,.md,.csv,.tex,text/*,application/pdf" hidden onChange={handleFile}/>

    {/* ═══════════ HOME ═══════════ */}
    {phase==="idle"&&<>
      <div className="mm-glow" aria-hidden="true"/>
      <section className="mm-home">
        <header className="mm-hero">
          <span className="tag tag-sub" key={mod}>{mc.icon} {lang==="es"?mc.badgeEs:mc.badgeEn}</span>
          <h1>{x.homeTitle}</h1>
          <p>{t.subtitle}</p>
        </header>

        {error&&<div className="alert alert-error" role="alert" style={{marginBottom:14}}>{error}</div>}

        <form className="ask card" onSubmit={e=>{e.preventDefault();if(canGo)go();}}>
          <div className={"ask-row ask-topic"+(validationError?" is-error":"")}>
            <IconSearch/>
            <input type="text" value={topic} placeholder={t.placeholder} aria-label={x.topicLabel} autoComplete="off" enterKeyHint="go"
              onChange={e=>{setTopic(e.target.value);setValidationError(false);}}/>
            <button type="button" className={"icon-btn"+(file?" is-on":"")} title={x.attach} aria-label={x.attach} onClick={()=>fileRef.current?.click()}><IconUpload/></button>
          </div>
          <div className="ask-notes">
            {validationError&&<div className="alert alert-error" role="alert">{t.invalidInput}</div>}
            {fileError&&<div className="alert alert-error" role="alert">{fileError}</div>}
            {file&&<div className="file-pill"><IconUpload size={16}/><span>{file.name}</span><button type="button" onClick={()=>{setFile(null);setFileContent("");setFileError("");if(fileRef.current)fileRef.current.value="";}}>{t.remove}</button></div>}
          </div>

          <div className={"ask-row ask-interest"+(interest?" has-value":"")+(interestError?" is-error":"")}>
            <span className="ask-emoji" aria-hidden="true">🎯</span>
            <input type="text" value={interest} placeholder={t.interestPlaceholder.replace(/^\S+\s/,"")} aria-label={x.interestLabel} autoComplete="off"
              onChange={e=>{setInterest(e.target.value);setInterestError(isBlockedInterest(e.target.value));}}/>
            <button type="button" className="icon-btn" title={x.randomInterest} aria-label={x.randomInterest}
              onClick={()=>{setInterest(RANDOM_INTERESTS[Math.floor(Math.random()*RANDOM_INTERESTS.length)]);setInterestError(false);}}><span aria-hidden="true">🎲</span></button>
            {interest&&<button type="button" className="icon-btn" title={x.clear} aria-label={x.clear} onClick={()=>{setInterest("");setInterestError(false);}}><IconClose/></button>}
          </div>
          {interestError
            ?<div className="alert alert-error" role="alert" style={{marginTop:8}}>{INTEREST_WARN[lang]||INTEREST_WARN.en}</div>
            :<p className="ask-hint">{t.interestHint}</p>}

          <div className="ask-sep"/>
          <div className="modes" role="radiogroup" aria-label={x.depthLabel}>
            {modes.map(([id,name,desc])=><button key={id} type="button" role="radio" aria-checked={mode===id} className="mode" onClick={()=>setMode(id)}>
              <span className="mode-name">{name}</span>
              <span className="mode-desc">{desc}</span>
            </button>)}
          </div>
          <button type="submit" className="btn btn-sub btn-lg btn-block ask-go" disabled={!canGo}>{t.learn}<IconArrowRight/></button>
        </form>

        <div className="suggest">
          <p className="eyebrow">{x.suggestLabel}</p>
          <div className="chips">{chips.map(c=><button key={c} type="button" className="chip" onClick={()=>{setTopic(c);setValidationError(false);}}>{c}</button>)}</div>
        </div>

        {recent.length>0&&<div className="recent">
          <div className="recent-head"><p className="eyebrow">{x.recentLabel}</p></div>
          <div className="recent-list">
            {recent.map(r=><button key={r.id} type="button" className="recent-item" data-subject={r.module||"general"} disabled={openingId!==null} onClick={()=>openSaved(r)}>
              {openingId===r.id?<span className="spinner"/>:<span className="dot"/>}
              <span><b>{r.topic}</b><small>{subjectName(r.module,lang)} · {timeAgo(r.created_at,lang)}</small></span>
            </button>)}
          </div>
        </div>}
      </section>
    </>}

    {/* ═══════════ LOADING ═══════════ */}
    {phase==="loading"&&<section className="mm-loading" role="status" aria-live="polite">
      <div className="load-ring"><span className="spinner spinner-lg"/>{classifierReady&&<b aria-hidden="true">{mc.icon}</b>}</div>
      <h1 className="load-topic">{topic||file?.name||""}</h1>
      <p className="load-status">
        {!classifierReady?x.identifying:loadProg>=88?t.almostThere:t.thinking}
        {(!classifierReady||loadProg<88)&&<span className="dots" aria-hidden="true"><i/><i/><i/></span>}
      </p>
      <p className="load-msg" key={loadingMsg} style={{fontStyle:loadingMsg.startsWith("“")?"italic":"normal"}}>{classifierReady?loadingMsg:""}</p>
      <div className="load-bar">
        <div className="progress" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(loadProg)}><i style={{width:loadProg+"%"}}/></div>
        <small>{Math.round(loadProg)}%</small>
      </div>
    </section>}

    {/* ═══════════ RESULTS ═══════════ */}
    {showResults&&<section className="mm-results">
      <div className="res-top">
        <button type="button" className="btn btn-ghost btn-sm" onClick={reset}><IconArrowLeft size={16}/>{x.newTopic}</button>
        <button type="button" className={"btn btn-sm "+(inDeck?"btn-ok":"btn-soft")} disabled={cardStatus==="adding"||inDeck} onClick={handleAddToReview}>
          {cardStatus==="adding"?"…":cardStatus==="added"?t.addedToReview:cardStatus==="exists"?t.alreadyInReview:t.addToReview}
        </button>
      </div>
      <header className="res-head">
        <div className="res-tags">
          <span className="tag tag-sub">{mc.icon} {subjectName(mod,lang)}</span>
          <button type="button" className={"tag"+(topicType==="problem"?" tag-purple":"")} title={x.toggleType} onClick={()=>setTopicType(p=>p==="concept"?"problem":"concept")}>{topicType==="problem"?t.topicTypeProblemLabel:t.topicTypeConceptLabel}</button>
          {interest&&!interestError&&<span className="tag tag-purple">🎯 {interest}</span>}
        </div>
        <h1>{content.title}</h1>
      </header>

      <div className="sectabs-wrap">
        <div className="sectabs" role="tablist" aria-label={x.sectionsLabel}>
          {sections.map(s=><button key={s.id} type="button" role="tab" aria-selected={activeSection===s.id} className="sectab" onClick={()=>goSection(s.id)}>{s.label}{s.done&&<span className="tick" aria-hidden="true">✓</span>}</button>)}
        </div>
      </div>

      {error&&<div className="alert alert-error" role="alert" style={{marginBottom:14}}>{error}</div>}

      {/* ── Explanation ── */}
      {activeSection==="explain"&&<div className="sec">
        <RichExplanation blocks={content.explanationBlocks} lang={lang}/>
        {!simplifiedBlocks&&<div className="simplify">
          <button type="button" className="btn btn-dashed" disabled={simplifying} onClick={simplify}>{simplifying?<><span className="spinner"/>{t.simplifying}</>:t.didntUnderstand}</button>
        </div>}
        {simplifiedBlocks&&<div className="simpler">
          <span className="tag tag-green">💡 {t.simplerExplain}</span>
          <RichExplanation blocks={simplifiedBlocks} lang={lang}/>
        </div>}

        {(content.keyConcepts||[]).length>0&&<>
          <h3 className="sub">{t.keyConcepts}</h3>
          <div className="stack">
            {content.keyConcepts.map((c,i)=><div key={i} className="kc" style={{"--c":AC[i%AC.length]}}>
              <h4><MathText>{c.title}</MathText></h4>
              <p><MathText>{c.description}</MathText></p>
              {c.formula&&<div className="formula"><MathText>{c.formula}</MathText></div>}
            </div>)}
          </div>
        </>}

        {(content.applications||[]).length>0&&<>
          <h3 className="sub">{t.realWorld}</h3>
          <p className="sub-note">{t.realWorldSub}</p>
          <div className="appc">
            {content.applications.map((app,i)=><div key={i} className="app-card">
              <h4><span aria-hidden="true">{APP_ICONS[i%APP_ICONS.length]}</span>{app.title}</h4>
              <p><MathText>{app.description}</MathText></p>
              {app.example&&<div className="app-ex"><b>{x.example}</b><p><MathText>{app.example}</MathText></p></div>}
            </div>)}
          </div>
        </>}

        <div className="sec-actions" style={{marginTop:32}}>
          <button type="button" className="btn btn-sub" onClick={()=>goSection("quiz")}>{x.toQuiz}<IconArrowRight/></button>
        </div>

        <RelatedTopics topics={content.relatedTopics} t={t} onSelect={(label)=>{
          /* carry topicType forward — do not reset */
          setPhase("idle");setContent(null);setError(null);setSimplifiedBlocks(null);setSimplifying(false);setFeynmanDone(false);
          setQuizAnswers({});setQuizSubmitted(false);setExamAnswers({});setExamSubmitted(false);
          setChallengeAnswers({});setChallengeSubmitted(false);setActiveSection("explain");setMod("general");setCardStatus(null);
          setFile(null);setFileContent("");
          window.scrollTo({top:0,behavior:"smooth"});
          /* small timeout so state flushes before go() reads activeTopic */
          setTimeout(()=>go(label),50);
        }}/>
        <YouTubeRecs searches={content.youtubeSearches} t={t} lang={lang}/>
      </div>}

      {/* ── Quiz ── */}
      {activeSection==="quiz"&&<div className="sec">
        <div className="sec-head">
          <div><h2>{t.testYourself}</h2><p>{quizSubmitted?t.score+": "+quizScore+"/"+quizTotal:t.selectBest}</p></div>
          {quizSubmitted&&<span className={"score-pill"+tone(quizScore,quizTotal)}>{pct(quizScore,quizTotal)}%</span>}
        </div>
        <div className="stack">
          {(content.quiz||[]).map((q,i)=>q.type==="tf"
            ?<TFCard key={i} q={q} index={i} selected={quizAnswers[i]} onSelect={v=>setQuizAnswers(p=>({...p,[i]:v}))} submitted={quizSubmitted} t={t}/>
            :<QuizCard key={i} q={q} index={i} selected={quizAnswers[i]} onSelect={v=>setQuizAnswers(p=>({...p,[i]:v}))} submitted={quizSubmitted} t={t}/>)}
        </div>
        <div className="sec-actions">
          {!quizSubmitted
            ?<button type="button" className="btn btn-sub" disabled={!quizAllAnswered} onClick={()=>setQuizSubmitted(true)}>{t.submit}{!quizAllAnswered&&<span style={{opacity:0.8,fontWeight:500}}> · {Object.keys(quizAnswers).length}/{quizTotal}</span>}</button>
            :<>
              <button type="button" className="btn btn-ghost" onClick={()=>{setQuizAnswers({});setQuizSubmitted(false);}}>{t.retry}</button>
              <button type="button" className="btn btn-soft" onClick={()=>goSection("exam")}>{x.toExam}<IconArrowRight/></button>
            </>}
        </div>
        {quizSubmitted&&showFeynman&&feynman}
      </div>}

      {/* ── Exam + challenge ── */}
      {activeSection==="exam"&&<div className="sec">
        <div className="sec-head">
          <div><h2>{t.examTitle}</h2><p>{examSubmitted?t.score+": "+examScore+"/"+examTotal:(mode==="think"?t.examSub:mode==="lite"?t.examSubLite:t.examSubFast)}</p></div>
          {examSubmitted&&<span className={"score-pill"+tone(examScore,examTotal)}>{pct(examScore,examTotal)}%</span>}
        </div>
        <div className="stack">
          {(content.exam||[]).map((q,i)=><QuizCard key={i} q={q} index={i} selected={examAnswers[i]} onSelect={v=>setExamAnswers(p=>({...p,[i]:v}))} submitted={examSubmitted} t={t} prefix={t.exam+" "}/>)}
        </div>
        <div className="sec-actions">
          {!examSubmitted
            ?<button type="button" className="btn btn-sub" disabled={examAnswered<examTotal} onClick={()=>setExamSubmitted(true)}>{t.submit}{examAnswered<examTotal&&<span style={{opacity:0.8,fontWeight:500}}> · {examAnswered}/{examTotal}</span>}</button>
            :<button type="button" className="btn btn-ghost" onClick={()=>{setExamAnswers({});setExamSubmitted(false);}}>{t.retry}</button>}
        </div>
        {examSubmitted&&showFeynman&&feynman}

        {mode==="think"&&(content.examChallenge||[]).length>0&&<>
          <div className="challenge-head">
            <h2>{t.examChallengeTitle}</h2>
            <p>{t.examChallengeSub}</p>
            {challengeSubmitted&&challengeMC.length>0&&<p style={{fontWeight:700,marginTop:6}}>{t.score}: {challengeMCScore}/{challengeMC.length}</p>}
          </div>
          <div className="stack">
            {content.examChallenge.map((q,i)=>q.type==="solve"
              ?<SolveCard key={"s"+i} q={q} index={i} t={t}/>
              :<QuizCard key={"c"+i} q={q} index={i} selected={challengeAnswers[i]} onSelect={v=>setChallengeAnswers(p=>({...p,[i]:v}))} submitted={challengeSubmitted} t={t} prefix={"🔥 "}/>)}
          </div>
          {challengeMC.length>0&&<div className="sec-actions">
            {!challengeSubmitted
              ?<button type="button" className="btn btn-primary" disabled={challengeAnswered<challengeMC.length} onClick={()=>setChallengeSubmitted(true)}>{t.submit}</button>
              :<button type="button" className="btn btn-ghost" onClick={()=>{setChallengeAnswers({});setChallengeSubmitted(false);}}>{t.retry}</button>}
          </div>}
        </>}
      </div>}

      {/* ── Tips ── */}
      {activeSection==="tips"&&<div className="sec">
        <div className="sec-head"><div><h2>{t.tips_title}</h2><p>{t.tips_sub}</p></div></div>
        <div className="stack">
          {(content.tips||[]).map((tip,i)=><div key={i} className="tip">
            <span className="step-n" style={{"--c":AC[i%3]}}>{i+1}</span>
            <div><h4>{tip.title}</h4><p><MathText>{tip.content}</MathText></p></div>
          </div>)}
        </div>
        <YouTubeRecs searches={content.youtubeSearches} t={t} lang={lang}/>
      </div>}

      {/* ── Slides ── */}
      {activeSection==="deck"&&<div className="sec"><InlineDeck content={content} t={t} lang={lang} mt={mt}/></div>}

      {/* New topic — after the Feynman challenge in fast/deep modes */}
      {(mode==="lite"||feynmanDone||(!quizSubmitted&&!examSubmitted))&&<div className="res-end">
        <button type="button" className="btn btn-sub btn-lg" onClick={reset}>{t.learnAgain}</button>
      </div>}
    </section>}

    <footer className="mm-foot">{t.footer}</footer>
  </div>;
}
