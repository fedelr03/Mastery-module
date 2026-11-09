import { useState, useRef, useEffect } from "react";
import { TH } from "../theme";
import { MathText } from "./math";
import { YouTubeRecs } from "./parts";

/* ═══════════ Slide emojis ═══════════ */
const SE={title:["\uD83C\uDFAF","\uD83E\uDDE0"],concept:["\uD83D\uDD11","\uD83D\uDC8E","\u26A1"],tip:["\uD83D\uDCA1","\uD83D\uDE80","\uD83C\uDF93"],end:["\uD83C\uDFC1","\uD83C\uDF89"]};
function sEmoji(ty,i){const a=SE[ty]||SE.title;return a[i%a.length];}

/* ═══════════ Slide Deck with single download card ═══════════ */
function InlineDeck({content,t,lang,mt:_mt}){
  const mt=_mt||{accent:TH.accent,accentLight:TH.accentLight,accentBg:TH.accentBg,borderAccent:TH.borderAccent,ink:TH.accentText};
  const slides=[{type:"title",title:content.title,sub:t.slideTitle,idx:0},...(content.keyConcepts||[]).map((c,i)=>({type:"concept",title:c.title,body:c.description,formula:c.formula,idx:i})),...(content.tips||[]).map((tp,i)=>({type:"tip",title:tp.title,body:tp.content,idx:i})),{type:"end",title:t.slideEnd,sub:t.slideEndSub,idx:0}];
  const[cur,setCur]=useState(0);
  const s=slides[cur];

  /* Split body into short bullet points for presentation style */
  const toBullets=(text)=>{
    if(!text)return[];
    /* Split on periods that end a sentence (not abbreviations) */
    const raw=text.split(/(?<=[.!?])\s+/).filter(s=>s.trim().length>5);
    /* Take max 4 bullets, keep them short */
    return raw.slice(0,4).map(b=>b.trim().replace(/\.$/,""));
  };

  /* ═══ Math-to-HTML converter: replicates MathText rendering as inline CSS HTML ═══ */
  const mathToHTML=(text)=>{
    if(!text)return"";
    let s=String(text);
    /* Combining marks: x̄ → styled overline */
    s=s.replace(/([a-zA-Z\u03B1-\u03C9])(\u0304)/g,'<span style="text-decoration:overline;text-decoration-thickness:1.5px;padding:0 1px">$1</span>');
    s=s.replace(/([a-zA-Z\u03B1-\u03C9])(\u0302)/g,'<span style="display:inline-block;position:relative;padding:0 1px">$1<span style="position:absolute;top:-0.35em;left:50%;transform:translateX(-50%);font-size:0.65em">\u0302</span></span>');
    /* Radicals: √{content} → √ with overline bar */
    s=s.replace(/\u221A\{([^}]+)\}/g,'<span style="display:inline-flex;align-items:flex-end;vertical-align:middle;margin:0 2px"><span style="font-size:1.2em;font-family:serif;position:relative;top:-0.05em">\u221A</span><span style="display:inline-flex;align-items:center;border-top:1.8px solid currentColor;padding:1px 4px 0 3px;margin-left:-1px;line-height:1.25">$1</span></span>');
    /* Balanced-paren fractions: walk the string to find (num)/(den) with any nesting */
    const fb=(str,start)=>{if(str[start]!=="(")return-1;let d=0;for(let i=start;i<str.length;i++){if(str[i]==="(")d++;if(str[i]===")")d--;if(d===0)return i;}return-1;};
    let out="",i=0;
    while(i<s.length){
      if(s[i]==="("){
        const close=fb(s,i);
        if(close>i+1){
          let after=close+1;
          /* Check for superscripts between ) and / */
          const supC="\u00B2\u00B3\u2074\u2075\u2076\u2077\u2078\u2079\u207F\u207A\u207B";
          while(after<s.length&&supC.includes(s[after]))after++;
          if(after<s.length&&s[after]==="/"){
            const slash=after;
            const numStr=s.slice(i+1,close)+s.slice(close+1,slash);
            let denStr=null,denEnd=slash+1;
            if(slash+1<s.length&&s[slash+1]==="("){
              const cd=fb(s,slash+1);
              if(cd>slash+2){denStr=s.slice(slash+2,cd);denEnd=cd+1;}
            }
            if(!denStr){
              /* Token denominator */
              let j=slash+1;
              const tokRe=/[\w\u00B2\u00B3\u03B1-\u03C9\u0394\u03A3\u03A9\u03C0\u221A\u00B9\u2074-\u2079\u207F\u2070\u2080-\u2089\u2099\u0304\u0302\u00D7.\u2032\u2033\u2212,]/;
              while(j<s.length&&tokRe.test(s[j]))j++;
              /* Also consume a following (…) so P(B), f(x), P(A|B) are treated as one token */
              if(j>slash+1&&j<s.length&&s[j]==="("){
                const cd=fb(s,j);
                if(cd>j){j=cd+1;}
              }
              if(j>slash+1){denStr=s.slice(slash+1,j);denEnd=j;}
            }
            if(denStr){
              const fracCSS="display:inline-flex;flex-direction:column;align-items:center;vertical-align:middle;margin:0 3px;line-height:1.1;font-size:0.88em";
              const lineCSS="width:100%;height:1.5px;background:currentColor;margin:2px 0;border-radius:1px";
              out+='<span style="'+fracCSS+'"><span style="padding:0 4px">'+numStr+'</span><span style="'+lineCSS+'"></span><span style="padding:0 4px">'+denStr+'</span></span>';
              i=denEnd;continue;
            }
          }
        }
      }
      out+=s[i];i++;
    }
    s=out;
    /* Simple token/token fractions (dy/dx, σ/μ, etc.) — skip pure numbers like 50,000/25,000 */
    const tokP="[a-zA-Z0-9\u00B2\u00B3\u03B1-\u03C9\u03C0\u0394\u00D7,]+";
    const simpleRe=new RegExp("(?<![a-zA-Z\u03B1-\u03C9])("+tokP+")/("+tokP+")(?![a-zA-Z\u03B1-\u03C9])","g");
    const pureNum2=/^[\d,.\s]+$/;
    s=s.replace(simpleRe,(m,a,b)=>{
      if(/^(true|false|and|or|yes|no|if|of|is|it|to|in|on|up)$/i.test(a))return m;
      if(pureNum2.test(a)&&pureNum2.test(b))return m;/* skip 50,000/25,000 */
      const fracCSS="display:inline-flex;flex-direction:column;align-items:center;vertical-align:middle;margin:0 3px;line-height:1.1;font-size:0.88em";
      const lineCSS="width:100%;height:1.5px;background:currentColor;margin:2px 0;border-radius:1px";
      return'<span style="'+fracCSS+'"><span style="padding:0 4px">'+a+'</span><span style="'+lineCSS+'"></span><span style="padding:0 4px">'+b+'</span></span>';
    });
    /* Bold and underline */
    s=s.replace(/\*\*([^*]+)\*\*/g,'<strong style="font-weight:700">$1</strong>');
    s=s.replace(/__([^_]+)__/g,'<span style="text-decoration:underline;text-decoration-color:rgba(232,148,10,0.4);text-underline-offset:2px">$1</span>');
    /* Newlines */
    s=s.replace(/\n/g,"<br/>");
    return s;
  };

  const buildSlideHTML=()=>{
    const ac=mt.accent||"#e8940a";const acL=mt.accentLight||"#f5a623";const acBg=mt.accentBg||"rgba(245,166,35,0.07)";const bdAc=mt.borderAccent||"rgba(232,148,10,0.25)";
    const bulletSplit=(text)=>{if(!text)return[];return text.split(/(?<=[.!?])\s+/).filter(s=>s.trim().length>5).slice(0,4).map(b=>b.trim().replace(/\.$/,""));};
    let html=`<!DOCTYPE html><html><head><meta charset="utf-8"><title>${content.title||"Slides"}</title>
<link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:wght@400;700;800&family=JetBrains+Mono:wght@400;700&display=swap" rel="stylesheet">
<style>
*{margin:0;box-sizing:border-box}
body{font-family:'Bricolage Grotesque',system-ui,sans-serif;background:#f7f5f0;-webkit-print-color-adjust:exact;print-color-adjust:exact}
.slide{width:100vw;min-height:100vh;display:flex;flex-direction:column;position:relative;background:#ffffff;page-break-inside:avoid;page-break-after:always}
.bar{position:absolute;top:0;left:0;right:0;height:7px;background:linear-gradient(90deg,${ac},${acL},#6366f1,#ec4899)}
.bot{position:absolute;bottom:0;left:0;right:0;height:3px;background:linear-gradient(90deg,transparent,${ac}33,transparent)}
.num{position:absolute;top:24px;right:36px;font-size:14px;color:#8a8a96;letter-spacing:2px;font-weight:700;font-family:'JetBrains Mono',monospace}
.center{flex:1;display:flex;flex-direction:column;justify-content:center;align-items:center;padding:40px 10vw;text-align:center}
.left{flex:1;display:flex;flex-direction:column;justify-content:center;padding:40px 8vw}
.badge{font-size:14px;font-weight:800;padding:6px 16px;border-radius:7px;display:inline-block;letter-spacing:2px;text-transform:uppercase;margin-bottom:18px}
.emoji{font-size:64px;margin-bottom:20px}
.emoji-sm{font-size:32px}
.grad-title{font-size:clamp(36px,6vw,64px);font-weight:800;line-height:1.1;margin-bottom:14px;background:linear-gradient(135deg,${ac},#6366f1);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
.subtitle{color:#8a8a96;font-size:20px;letter-spacing:0.5px;margin-top:4px}
.slide-title{font-size:clamp(28px,4.5vw,48px);font-weight:800;line-height:1.15;margin-bottom:24px}
.bullet{display:flex;align-items:flex-start;gap:14px;margin-bottom:14px}
.bullet-dot{font-size:22px;line-height:1.45;flex-shrink:0;font-weight:800}
.bullet-text{font-size:22px;color:#5c5c6c;line-height:1.55;font-family:system-ui,sans-serif}
.formula-box{font-family:'JetBrains Mono',monospace;background:linear-gradient(135deg,${acBg},rgba(99,102,241,0.04));border:2px solid ${bdAc};border-radius:14px;padding:18px 28px;font-size:24px;color:${ac};display:block;max-width:100%;line-height:1.8;margin-top:20px;white-space:pre-wrap;word-break:break-word;overflow:hidden}
@media print{
  body{background:#fff}
  .slide{min-height:100vh;page-break-inside:avoid;page-break-after:always;-webkit-print-color-adjust:exact;print-color-adjust:exact}
  @page{size:landscape;margin:0}
}
</style></head><body>`;

    slides.forEach((sl,si)=>{
      const pageNum=String(si+1).padStart(2,"0")+" / "+String(slides.length).padStart(2,"0");
      html+=`<div class="slide"><div class="bar"></div><div class="bot"></div><span class="num">${pageNum}</span>`;
      if(sl.type==="title"||sl.type==="end"){
        html+=`<div class="center"><div class="emoji">${sEmoji(sl.type,0)}</div><h2 class="grad-title">${sl.title}</h2><p class="subtitle">${sl.sub}</p></div>`;
      }else if(sl.type==="concept"){
        const bullets=bulletSplit(sl.body);
        html+=`<div class="left"><div style="display:flex;align-items:center;gap:12px;margin-bottom:18px"><span class="emoji-sm">${sEmoji("concept",sl.idx)}</span><span class="badge" style="background:${acBg};color:${ac}">${t.concept}</span></div>`;
        html+=`<h3 class="slide-title" style="color:${ac}">${mathToHTML(sl.title)}</h3>`;
        html+=`<div style="display:flex;flex-direction:column;gap:6px;${sl.formula?"margin-bottom:20px":""}">`;
        bullets.forEach(b=>{html+=`<div class="bullet"><span class="bullet-dot" style="color:${ac}">\u2022</span><span class="bullet-text">${mathToHTML(b)}</span></div>`;});
        html+=`</div>`;
        if(sl.formula)html+=`<div class="formula-box">${mathToHTML(sl.formula)}</div>`;
        html+=`</div>`;
      }else if(sl.type==="tip"){
        const bullets=bulletSplit(sl.body);
        html+=`<div class="left"><div style="display:flex;align-items:center;gap:12px;margin-bottom:18px"><span class="emoji-sm">${sEmoji("tip",sl.idx)}</span><span class="badge" style="background:rgba(99,102,241,0.08);color:#6366f1">${t.tipBadge}</span></div>`;
        html+=`<h3 class="slide-title" style="color:#2a2a3a">${sl.title}</h3>`;
        html+=`<div style="display:flex;flex-direction:column;gap:6px">`;
        bullets.forEach(b=>{html+=`<div class="bullet"><span class="bullet-dot" style="color:#6366f1">\u2022</span><span class="bullet-text">${mathToHTML(b)}</span></div>`;});
        html+=`</div></div>`;
      }
      html+=`</div>`;
    });

    html+=`</body></html>`;
    return html;
  };

  const[dlError,setDlError]=useState("");
  const dlRef=useRef(null);
  const[dlData,setDlData]=useState(null);
  const doDownload=()=>{
    setDlError("");
    try{
      const html=buildSlideHTML();
      const b64=btoa(unescape(encodeURIComponent(html)));
      const href="data:text/html;base64,"+b64;
      const name=(content.title||"slides").replace(/[^\w\s]/g,"").trim().replace(/\s+/g,"_")+".html";
      setDlData({href,name});
    }catch(e){console.error("Download error:",e);setDlError(e.message||"Error");}
  };
  /* Auto-click the hidden link once data is ready */
  useEffect(()=>{if(dlData&&dlRef.current){dlRef.current.click();setTimeout(()=>setDlData(null),500);}},[dlData]);

  return <div style={{animation:"fadeUp 0.3s ease"}}>
    <h2 style={{fontFamily:"'Bricolage Grotesque',sans-serif",fontSize:19,fontWeight:700,color:TH.text,marginBottom:11}}>{t.summaryDeck}</h2>
    <div style={{background:TH.surface,borderRadius:16,border:"1px solid "+TH.border,boxShadow:"0 4px 24px rgba(0,0,0,0.07)",minHeight:280,display:"flex",flexDirection:"column",position:"relative",overflow:"hidden"}}>
      {/* Top gradient bar */}
      <div style={{position:"absolute",top:0,left:0,right:0,height:5,background:"linear-gradient(90deg, "+mt.accent+", "+mt.accentLight+", "+TH.purple+", "+TH.pink+")",borderRadius:"16px 16px 0 0"}}/>
      {/* Slide number */}
      <div style={{position:"absolute",top:16,right:20,fontSize:12,color:TH.textMuted,letterSpacing:1.5,fontWeight:700,fontFamily:"'JetBrains Mono',monospace"}}>{String(cur+1).padStart(2,"0")} / {String(slides.length).padStart(2,"0")}</div>

      {/* TITLE / END slide */}
      {(s.type==="title"||s.type==="end")&&<div style={{flex:1,display:"flex",flexDirection:"column",justifyContent:"center",alignItems:"center",padding:"36px clamp(24px,6vw,60px)",textAlign:"center",minHeight:240}}>
        <div style={{fontSize:44,marginBottom:12}}>{sEmoji(s.type,0)}</div>
        <h3 style={{fontFamily:"'Bricolage Grotesque',sans-serif",fontSize:"clamp(22px,4vw,40px)",fontWeight:800,lineHeight:1.1,marginBottom:8,background:"linear-gradient(135deg, "+mt.accent+", "+TH.purple+")",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",backgroundClip:"text"}}>{s.title}</h3>
        <p style={{color:TH.textMuted,fontSize:14,letterSpacing:0.5}}>{s.sub}</p>
      </div>}

      {/* CONCEPT slide — professional layout */}
      {s.type==="concept"&&<div style={{flex:1,display:"flex",flexDirection:"column",justifyContent:"center",padding:"36px clamp(24px,5vw,50px)"}}>
        {/* Badge */}
        <div style={{display:"flex",alignItems:"center",gap:7,marginBottom:10}}>
          <span style={{fontSize:22}}>{sEmoji("concept",s.idx)}</span>
          <span style={{background:mt.accentBg,color:mt.ink,fontSize:11,fontWeight:800,padding:"3px 10px",borderRadius:5,letterSpacing:1.5,textTransform:"uppercase"}}>{t.concept}</span>
        </div>
        {/* Title */}
        <h3 style={{fontFamily:"'Bricolage Grotesque',sans-serif",fontSize:"clamp(20px,3vw,30px)",color:mt.ink,marginBottom:14,fontWeight:800,lineHeight:1.15}}><MathText>{s.title}</MathText></h3>
        {/* Bullet points — not paragraphs */}
        <div style={{display:"flex",flexDirection:"column",gap:6,marginBottom:s.formula?12:0}}>
          {toBullets(s.body).map((b,bi)=><div key={bi} style={{display:"flex",alignItems:"flex-start",gap:8}}>
            <span style={{color:mt.ink,fontSize:14,lineHeight:1.4,flexShrink:0,fontWeight:800}}>{"\u2022"}</span>
            <p style={{color:TH.textSecondary,fontSize:13,lineHeight:1.45}}><MathText>{b}</MathText></p>
          </div>)}
        </div>
        {/* Formula box */}
        {s.formula&&<div style={{fontFamily:"'JetBrains Mono',monospace",background:"linear-gradient(135deg, "+mt.accentBg+", rgba(99,102,241,0.04))",border:"1px solid "+mt.borderAccent,borderRadius:10,padding:"10px 16px",fontSize:14,color:mt.ink,maxWidth:"100%",overflow:"hidden",lineHeight:1.8,whiteSpace:"pre-wrap",wordBreak:"break-word"}}><MathText>{s.formula}</MathText></div>}
      </div>}

      {/* TIP slide */}
      {s.type==="tip"&&<div style={{flex:1,display:"flex",flexDirection:"column",justifyContent:"center",padding:"36px clamp(24px,5vw,50px)"}}>
        <div style={{display:"flex",alignItems:"center",gap:7,marginBottom:10}}>
          <span style={{fontSize:22}}>{sEmoji("tip",s.idx)}</span>
          <span style={{background:"rgba(99,102,241,0.08)",color:TH.purple,fontSize:11,fontWeight:800,padding:"3px 10px",borderRadius:5,letterSpacing:1.5,textTransform:"uppercase"}}>{t.tipBadge}</span>
        </div>
        <h3 style={{fontFamily:"'Bricolage Grotesque',sans-serif",fontSize:"clamp(20px,3vw,28px)",color:TH.text,marginBottom:14,fontWeight:800,lineHeight:1.15}}>{s.title}</h3>
        <div style={{display:"flex",flexDirection:"column",gap:6}}>
          {toBullets(s.body).map((b,bi)=><div key={bi} style={{display:"flex",alignItems:"flex-start",gap:8}}>
            <span style={{color:TH.purple,fontSize:14,lineHeight:1.4,flexShrink:0,fontWeight:800}}>{"\u2022"}</span>
            <p style={{color:TH.textSecondary,fontSize:13,lineHeight:1.45}}><MathText>{b}</MathText></p>
          </div>)}
        </div>
      </div>}

      {/* Bottom decoration line */}
      <div style={{position:"absolute",bottom:0,left:0,right:0,height:2,background:"linear-gradient(90deg, transparent, "+mt.accent+"20, transparent)"}}/>
    </div>
    {/* Nav */}
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginTop:9}}>
      <button onClick={()=>setCur(Math.max(0,cur-1))} disabled={cur===0} style={{background:cur===0?TH.bgAlt:TH.surface,border:"1px solid "+TH.border,borderRadius:7,padding:"6px 14px",color:cur===0?TH.textFaint:TH.textSecondary,fontSize:12,fontWeight:600,cursor:cur===0?"default":"pointer",fontFamily:"inherit"}}>{"\u2190"}</button>
      <div style={{display:"flex",gap:3}}>{slides.map((_,si)=><button key={si} onClick={()=>setCur(si)} style={{width:si===cur?16:5,height:5,borderRadius:3,background:si===cur?TH.accent:TH.borderLight,border:"none",cursor:"pointer",transition:"all 0.3s"}}/>)}</div>
      <button onClick={()=>setCur(Math.min(slides.length-1,cur+1))} disabled={cur===slides.length-1} style={{background:cur===slides.length-1?TH.bgAlt:TH.surface,border:"1px solid "+TH.border,borderRadius:7,padding:"6px 14px",color:cur===slides.length-1?TH.textFaint:TH.textSecondary,fontSize:12,fontWeight:600,cursor:cur===slides.length-1?"default":"pointer",fontFamily:"inherit"}}>{"\u2192"}</button>
    </div>
    {/* Download — single click */}
    <div style={{marginTop:14,background:TH.surface,border:"1px solid "+TH.border,borderRadius:10,padding:"12px 16px",boxShadow:TH.cardShadow,display:"flex",alignItems:"center",justifyContent:"space-between",gap:8}}>
      <div style={{display:"flex",alignItems:"center",gap:6}}>
        <span style={{fontSize:14}}>💾</span>
        <span style={{fontSize:12,fontWeight:700,color:TH.text}}>{t.downloadSlides}</span>
      </div>
      <button onClick={doDownload} style={{background:mt.btnBg||mt.accent,border:"none",borderRadius:7,padding:"7px 20px",color:mt.btnText||"#1f1d2b",fontWeight:700,fontSize:12,cursor:"pointer",fontFamily:"inherit",boxShadow:"0 2px 6px "+mt.btnShadow,display:"flex",alignItems:"center",gap:5}}>{"\u2B07"} {lang==="es"?"Descargar":"Download"}</button>
      {dlError&&<span style={{color:TH.redText,fontSize:12}}>{dlError}</span>}
    </div>
    {/* Hidden download link — auto-clicked by useEffect */}
    {dlData&&<a ref={dlRef} href={dlData.href} download={dlData.name} style={{display:"none"}}/>}
    <YouTubeRecs searches={content.youtubeSearches} t={t} lang={lang}/>
  </div>;
}


export default InlineDeck;
