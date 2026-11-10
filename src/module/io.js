/* ═══════════ Notification sound (idea chime) ═══════════ */
function playDing(){
  try{
    const A=window.AudioContext||window.webkitAudioContext;if(!A)return;
    const ctx=new A();
    /* Resume in case autoplay policy suspended it */
    const go=()=>{
      const play=(freq,start,dur,vol)=>{
        const osc=ctx.createOscillator();const g=ctx.createGain();
        osc.type="sine";osc.frequency.value=freq;
        g.gain.setValueAtTime(vol||0.15,ctx.currentTime+start);
        g.gain.exponentialRampToValueAtTime(0.001,ctx.currentTime+start+dur);
        osc.connect(g);g.connect(ctx.destination);
        osc.start(ctx.currentTime+start);osc.stop(ctx.currentTime+start+dur+0.1);
      };
      play(587.33,0,0.18,0.12);/* D5 */
      play(880,0.1,0.3,0.1);/* A5 */
      play(1174.66,0.2,0.4,0.08);/* D6 — bright ascending fifth */
      setTimeout(()=>{try{ctx.close();}catch(e){}},2000);
    };
    if(ctx.state==="suspended"){ctx.resume().then(go);}else{go();}
  }catch(e){/* silent fail */}
}

/* ═══════════ PDF reader ═══════════ */
let pdfL=false;function loadPdfJs(){return new Promise((r,j)=>{if(pdfL&&window.pdfjsLib){r(window.pdfjsLib);return;}const s=document.createElement("script");s.src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";s.onload=()=>{window.pdfjsLib.GlobalWorkerOptions.workerSrc="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";pdfL=true;r(window.pdfjsLib);};s.onerror=()=>j(new Error("fail"));document.head.appendChild(s);});}
async function extractPdfText(buf){const lib=await loadPdfJs();const pdf=await lib.getDocument({data:buf}).promise;let o="";for(let i=1;i<=pdf.numPages;i++){const pg=await pdf.getPage(i);const tc=await pg.getTextContent();o+=tc.items.map(x=>x.str).join(" ")+"\n";}return o.trim();}

/* ═══════════ Robust JSON parser (handles truncation) ═══════════ */
function safeParseJSON(raw){
  let s=raw.trim();
  s=s.replace(/^```(?:json)?\s*/i,"").replace(/\s*```$/i,"");
  /* Find first { or [ — whichever comes first is the real start */
  const fb=s.indexOf("{"),fa=s.indexOf("[");
  const first=fb<0?fa:fa<0?fb:Math.min(fb,fa);
  if(first>0)s=s.slice(first);
  // Try direct parse first
  try{return JSON.parse(s);}catch(e){}
  // If truncated, try to repair
  // 1) Remove any incomplete string at the end (cut mid-value)
  s=s.replace(/,\s*"[^"]*$/,"");           // trailing incomplete key
  s=s.replace(/:\s*"[^"]*$/,"\":\"\"");     // trailing incomplete string value - close it
  s=s.replace(/:\s*$/,"");                  // trailing colon with no value
  s=s.replace(/,\s*$/,"");                  // trailing comma
  // 2) Find last complete structure
  const lastGood=Math.max(s.lastIndexOf("}]"),s.lastIndexOf('"}'),s.lastIndexOf("}},"),s.lastIndexOf("true"),s.lastIndexOf("false"));
  if(lastGood>0&&lastGood<s.length-3){
    // Find the end of this token
    let cut=lastGood;
    if(s[cut]==='}'){cut=s.indexOf('}',cut)+1;if(s[cut]===']')cut++;}
    else if(s[cut]==='"'){cut=s.indexOf('"',cut)+1;if(s[cut]==='}')cut++;}
    else{cut+=4;if(s.substring(lastGood,lastGood+5)==="false")cut++;}
    if(cut>0)s=s.slice(0,cut);
  }
  // 3) Remove trailing commas
  s=s.replace(/,\s*([\]}])/g,"$1");
  s=s.replace(/,\s*$/,"");
  // 4) Balance braces/brackets
  let ob=0,oB=0,inStr=false,esc=false;
  for(let i=0;i<s.length;i++){const c=s[i];if(esc){esc=false;continue;}if(c==="\\"){esc=true;continue;}if(c==='"'){inStr=!inStr;continue;}if(inStr)continue;if(c==="{")ob++;if(c==="}")ob--;if(c==="[")oB++;if(c==="]")oB--;}
  while(oB>0){s+="]";oB--;}
  while(ob>0){s+="}";ob--;}
  // 5) Final cleanup and parse
  s=s.replace(/,\s*([\]}])/g,"$1");
  try{return JSON.parse(s);}catch(e2){
    // Last resort: find the largest parseable prefix
    for(let end=s.length;end>100;end--){
      let attempt=s.slice(0,end);
      // Balance it
      let b1=0,b2=0,inS=false,es=false;
      for(let i=0;i<attempt.length;i++){const c=attempt[i];if(es){es=false;continue;}if(c==="\\"){es=true;continue;}if(c==='"'){inS=!inS;continue;}if(inS)continue;if(c==="{")b1++;if(c==="}")b1--;if(c==="[")b2++;if(c==="]")b2--;}
      while(b2>0){attempt+="]";b2--;}
      while(b1>0){attempt+="}";b1--;}
      attempt=attempt.replace(/,\s*([\]}])/g,"$1");
      try{const r=JSON.parse(attempt);if(r.title)return r;}catch{}
    }
    throw new Error("Could not parse response. Please try again.");
  }
}


export { playDing, extractPdfText, safeParseJSON };
