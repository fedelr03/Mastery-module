import { TH, alpha } from "../theme";

/* ═══════════ Unicode Math Formatter ═══════════ */
const SUP={"0":"\u2070","1":"\u00B9","2":"\u00B2","3":"\u00B3","4":"\u2074","5":"\u2075","6":"\u2076","7":"\u2077","8":"\u2078","9":"\u2079","n":"\u207F","x":"\u02E3","y":"\u02B8","a":"\u1D43","b":"\u1D47","c":"\u1D9C","d":"\u1D48","e":"\u1D49","f":"\u1DA0","g":"\u1D4D","h":"\u02B0","i":"\u2071","j":"\u02B2","k":"\u1D4F","l":"\u02E1","m":"\u1D50","o":"\u1D52","p":"\u1D56","r":"\u02B3","s":"\u02E2","t":"\u1D57","u":"\u1D58","v":"\u1D5B","w":"\u02B7","z":"\u1DBB","+":"\u207A","-":"\u207B","(":"\u207D",")":"\u207E"};
const SUB_MAP={"0":"\u2080","1":"\u2081","2":"\u2082","3":"\u2083","4":"\u2084","5":"\u2085","6":"\u2086","7":"\u2087","8":"\u2088","9":"\u2089","a":"\u2090","e":"\u2091","o":"\u2092","x":"\u2093","h":"\u2095","k":"\u2096","l":"\u2097","m":"\u2098","n":"\u2099","p":"\u209A","s":"\u209B","t":"\u209C","i":"\u1D62","r":"\u1D63","u":"\u1D64","v":"\u1D65","j":"\u2C7C","+":"\u208A","-":"\u208B","(":"\u208D",")":"\u208E","=":"\u208C"};

function formatMath(text){
  if(!text||typeof text!=="string")return text;
  let s=text;
  /* Protect **bold** and __underline__ markers from being mangled */
  const boldSafe=[];s=s.replace(/\*\*([^*]+)\*\*/g,(_,c)=>{boldSafe.push(c);return"\x00B"+boldSafe.length+"\x00";});
  const ulSafe=[];s=s.replace(/__([^_]+)__/g,(_,c)=>{ulSafe.push(c);return"\x00U"+ulSafe.length+"\x00";});
  /* Protect "value/time-unit" from fraction parser: $50M/año → $50M por año */
  s=s.replace(/\/(a\u00F1o|mes|d\u00EDa|trimestre|semestre|hora|minuto|segundo|unidad|acci\u00F3n|empleado|persona|cliente|usuario|trabajador)/gi," por $1");
  s=s.replace(/\/(year|month|day|quarter|semester|hour|minute|second|unit|share|employee|person|customer|user|worker)/gi," per $1");
  /* Convert [expr]/token → (expr)/(token) so the fraction renderer can pick it up.
     e.g. [f(x+h) − f(x)]/h  →  (f(x+h) − f(x))/(h)
     Excludes commas inside brackets so ∑[i=1,n] limit notation is not affected. */
  s=s.replace(/\[([^\],\[\]]+)\]\/\(([^)]+)\)/g,"($1)/($2)");
  s=s.replace(/\[([^\],\[\]]+)\]\/([a-zA-Z0-9\u03B1-\u03C9]+)/g,"($1)/($2)");
  /* Protect fractional exponents ^{n/d} and ^(n/d) before char-by-char mapping mangles them.
     Restore as ^(n⁄d) using U+2044 FRACTION SLASH so processFractions (which only checks ASCII /)
     will leave them alone; processExponents renders them as a tiny stacked superscript fraction. */
  const fracExpProtect=[];
  s=s.replace(/\^\{([^}]*\/[^}]*)\}/g,(_,inner)=>{fracExpProtect.push(inner);return"\x00FX"+fracExpProtect.length+"\x00";});
  s=s.replace(/\^\(([^)]*\/[^)]*)\)/g,(_,inner)=>{fracExpProtect.push(inner);return"\x00FX"+fracExpProtect.length+"\x00";});
  s=s.replace(/\^{([^}]+)}/g,(_,i)=>i.split("").map(c=>SUP[c]||SUP[c.toLowerCase()]||c).join(""));
  s=s.replace(/\^([0-9a-zA-Z+\-()])/g,(_,c)=>SUP[c]||SUP[c.toLowerCase()]||c);
  s=s.replace(/_{([^}]+)}/g,(_,i)=>i.split("").map(c=>SUB_MAP[c]||SUB_MAP[c.toLowerCase()]||c).join(""));
  s=s.replace(/_([0-9a-zA-Z+\-()=])(?![a-zA-Z0-9])/g,(_,c)=>SUB_MAP[c]||SUB_MAP[c.toLowerCase()]||c);
  s=s.replace(/sqrt\{([^}]+)\}/gi,"\u221A{$1}");
  s=s.replace(/sqrt\(([^)]+)\)/gi,"\u221A{$1}");
  /* Convert bare √ followed by number/token into √{token} for MathText rendering */
  s=s.replace(/\u221A\(([^)]+)\)/g,"\u221A{$1}");
  s=s.replace(/\u221A\[([^\]]+)\]/g,"\u221A{$1}");
  s=s.replace(/\u221A(?!\{)([a-zA-Z0-9\u03B1-\u03C9\u00B2\u00B3]+)/g,"\u221A{$1}");
  s=s.replace(/\bsqrt\b/gi,"\u221A");
  s=s.replace(/>=/g,"\u2265");s=s.replace(/<=/g,"\u2264");s=s.replace(/!=/g,"\u2260");
  s=s.replace(/\+-/g,"\u00B1");
  /* Accent-aware boundary: \b treats áéíóúñü as non-word chars, breaking Spanish words.
     e.g. \bsum\b matches "sumás" (Argentine voseo). Use lookahead/lookbehind for accented chars. */
  const AB="(?<![a-zA-Z\u00C0-\u024F])";const AE="(?![a-zA-Z\u00C0-\u024F])";
  s=s.replace(new RegExp(AB+"pi"+AE,"g"),"\u03C0");s=s.replace(new RegExp(AB+"PI"+AE,"g"),"\u03C0");
  s=s.replace(/\binfinity\b/gi,"\u221E");s=s.replace(new RegExp(AB+"inf"+AE,"g"),"\u221E");
  s=s.replace(/([a-zA-Z0-9\u03B1-\u03C9])\s*\*\s*([a-zA-Z0-9\u03B1-\u03C9(])/g,"$1\u00D7$2");
  /* "3 x 4" or "2 X n" where x/X is used as multiplication between a digit and another token.
     Only convert when there is a DIGIT on the LEFT to avoid mangling variable x in f(x), etc. */
  s=s.replace(/(\d)\s+[xX]\s+(\d)/g,"$1\u00A0\u00D7\u00A0$2");
  s=s.replace(/(\d)\s+[xX]\s+([a-wyzA-WYZ\u03B1-\u03C9])/g,"$1\u00A0\u00D7\u00A0$2");
  /* ── Prose rescue: last-resort catches for banned phrases ─── */
  s=s.replace(/([a-zA-Z0-9\u03B1-\u03C9])\s+squared\b/gi,"$1\u00B2");
  s=s.replace(/([a-zA-Z0-9\u03B1-\u03C9])\s+cubed\b/gi,"$1\u00B3");
  s=s.replace(/([a-zA-Z0-9\u03B1-\u03C9])\s+times\s+([a-zA-Z0-9\u03B1-\u03C9(])/gi,"$1\u00A0\u00D7\u00A0$2");
  s=s.replace(/([a-zA-Z0-9\u03B1-\u03C9])\s+multiplied\s+by\s+([a-zA-Z0-9\u03B1-\u03C9(])/gi,"$1\u00A0\u00D7\u00A0$2");
  s=s.replace(/([a-zA-Z0-9\u03B1-\u03C9)%])\s+divided\s+by\s+([a-zA-Z0-9\u03B1-\u03C9(])/gi,"$1\u00A0\u00F7\u00A0$2");
  s=s.replace(/\bthe\s+square\s+root\s+of\s+([a-zA-Z0-9\u03B1-\u03C9]+)/gi,"\u221A{$1}");
  s=s.replace(/\blog\s+base\s+([a-zA-Z0-9]+)\s+of\s*/gi,"log_{$1}(");
  s=s.replace(/([a-zA-Z0-9\u03B1-\u03C9])\s+to\s+the\s+power\s+of\s+([a-zA-Z0-9]+)/gi,(_,b,e)=>b+"^{"+e+"}");
  s=s.replace(/\btheta\b/gi,"\u03B8");s=s.replace(/\balpha\b/gi,"\u03B1");
  s=s.replace(/\bbeta\b/gi,"\u03B2");s=s.replace(/\bdelta\b/gi,"\u03B4");
  s=s.replace(/\bsigma\b/gi,"\u03C3");s=s.replace(/\blambda\b/gi,"\u03BB");
  s=s.replace(/\bgamma\b/gi,"\u03B3");s=s.replace(new RegExp(AB+"mu"+AE,"gi"),"\u03BC");
  s=s.replace(/\bomega\b/gi,"\u03C9");s=s.replace(/\bepsilon\b/gi,"\u03B5");
  s=s.replace(/\bphi\b/gi,"\u03C6");s=s.replace(/\brho\b/gi,"\u03C1");
  s=s.replace(new RegExp(AB+"tau"+AE,"gi"),"\u03C4");s=s.replace(/\bSigma\b/g,"\u03A3");
  s=s.replace(/\bDelta\b/g,"\u0394");s=s.replace(/\bOmega\b/g,"\u03A9");
  s=s.replace(new RegExp(AB+"int"+AE,"g"),"\u222B");s=s.replace(new RegExp(AB+"sum"+AE,"g"),"\u2211");
  s=s.replace(new RegExp(AB+"prod"+AE,"g"),"\u220F");s=s.replace(/\bpartial\b/gi,"\u2202");
  s=s.replace(/\bnabla\b/gi,"\u2207");s=s.replace(/\bforall\b/gi,"\u2200");
  s=s.replace(/\bexists\b/gi,"\u2203");
  s=s.replace(/\bapprox\b/gi,"\u2248");s=s.replace(/~=/g,"\u2248");
  /* Statistics notation */
  s=s.replace(/\bxbar\b/gi,"x\u0304");s=s.replace(/\bx_bar\b/gi,"x\u0304");s=s.replace(/X_bar/g,"X\u0304");
  s=s.replace(/\bybar\b/gi,"y\u0304");s=s.replace(/\bphat\b/gi,"p\u0302");s=s.replace(/p_hat/g,"p\u0302");
  s=s.replace(/\bmu_0\b/g,"\u03BC\u2080");s=s.replace(/\bsigma\^2\b/gi,"\u03C3\u00B2");
  s=s.replace(/\bH_0\b/g,"H\u2080");s=s.replace(/\bH_1\b/g,"H\u2081");s=s.replace(/\bH_a\b/g,"H\u2090");
  s=s.replace(/\bP\(([^)]+)\)/g,"P($1)");/* preserve P() notation */
  s=s.replace(/\bE\[([^\]]+)\]/g,"E[$1]");/* preserve E[] notation */
  s=s.replace(/\bVar\[([^\]]+)\]/g,"Var[$1]");
  s=s.replace(/\bCov\[([^\]]+)\]/g,"Cov[$1]");
  s=s.replace(/\bC\((\w+),(\w+)\)/g,"C($1,$2)");s=s.replace(/\bnCr\b/g,"C(n,r)");s=s.replace(/\bnPr\b/g,"P(n,r)");
  s=s.replace(/\bchi\b/gi,"\u03C7");s=s.replace(/\bchi_squared\b/gi,"\u03C7\u00B2");s=s.replace(/\bchi2\b/gi,"\u03C7\u00B2");
  s=s.replace(/\bzeta\b/gi,"\u03B6");s=s.replace(/\bkappa\b/gi,"\u03BA");s=s.replace(/\bnu\b/gi,"\u03BD");
  s=s.replace(/\bpsi\b/gi,"\u03C8");s=s.replace(/\bxi\b/gi,"\u03BE");
  s=s.replace(/\bprop_to\b/gi,"\u221D");s=s.replace(/\bpropto\b/gi,"\u221D");
  s=s.replace(/\bemptyset\b/gi,"\u2205");s=s.replace(/\bnotin\b/gi,"\u2209");
  s=s.replace(/\bsubset\b/gi,"\u2282");s=s.replace(/\bsuperset\b/gi,"\u2283");
  s=s.replace(/\bunion\b/gi,"\u222A");s=s.replace(/\bintersect\b/gi,"\u2229");
  /* ═══ STATS FORMULA RECOVERY: fix garbled API output ═══ */
  /* Garbled superscript parens: e⁽ → e^( */
  s=s.replace(/e\u207D/g,"e^(");s=s.replace(/\u207E/g,")");
  /* Garbled normal PDF exponent — ALL variants: */
  /* "e-(x-μ²2σ²)" with NO spaces */
  s=s.replace(/e[-\u2212]\(?x[-\u2212]\u03BC\)?\u00B2\/?2\u03C3\u00B2\)?/g,"e^(-(x - \u03BC)\u00B2/(2\u03C3\u00B2))");
  /* "-x-μ²2σ²" or "- x - μ²2σ²" with optional spaces → "-(x - μ)²/(2σ²)" */
  s=s.replace(/-\s*\(?x\s*[-\u2212]\s*\u03BC\)?\u00B2\s*\/?\s*\(?2\u03C3\u00B2\)?/g,"-(x - \u03BC)\u00B2/(2\u03C3\u00B2)");
  /* "e elevado...-(x-μ)²/(2σ²)" — already has the -(x-μ) form, leave the text, fix the math after it */
  s=s.replace(/potencia de\s*-\s*\(?x\s*[-\u2212]\s*\u03BC\)?\u00B2\s*\/?\s*\(?2\u03C3\u00B2\)?/g,"potencia de -(x - \u03BC)\u00B2/(2\u03C3\u00B2)");
  /* "1/σ√2π" without outer parens → "(1)/(σ√{2π})" */
  s=s.replace(/(?<![(\d])1\s*\/\s*\(?\u03C3\u221A/g,"(1)/(\u03C3\u221A");
  /* "σ√2π" → "σ√{2π}" — radical after sigma always needs braces */
  s=s.replace(/\u03C3\u221A(?!\{)([a-zA-Z0-9\u03B1-\u03C9\u00B2\u00B3]+)/g,"\u03C3\u221A{$1}");
  /* ═══ DISTRIBUTION NOTATION RECOVERY ═══ */
  /* "N(μ, σ²n)" or "Nμ, (σ²n)" → "N(μ, (σ²)/(n))" */
  s=s.replace(/N\u03BC,\s*\(?(\u03C3\u00B2)n\)?/g,"N(\u03BC, ($1)/(n))");
  s=s.replace(/N\(\u03BC,\s*(\u03C3\u00B2)n\)/g,"N(\u03BC, ($1)/(n))");
  s=s.replace(/N\(\u03BC,\s*(\u03C3\u00B2)\s*\/\s*n\)/g,"N(\u03BC, ($1)/(n))");
  /* "σ²n" as standalone → "(σ²)/(n)" */
  s=s.replace(/(?<=[\s,(=])(\u03C3\u00B2)n(?=[\s,).]|$)/g,"($1)/(n)");
  /* ═══ WHOLESALE FORMULA REPLACEMENT — matches entire garbled formula, outputs correct version ═══ */
  /* SLOPE: b = (n∑xy − (∑x)(∑y))/(n∑x² − (∑x)²)
     Key: (∑x)(∑y) = product of sums. ∑x² = sum of squares. (∑x)² = square of sum. */
  s=s.replace(/\bb\s*=\s*\(?[^.;\n]*?n\u2211xy[^.;\n]*?\u2211x[^.;\n]*?\u2211y[^.;\n]*?n\u2211x\u00B2[^.;\n]*?\u2211x[^.;\n]*?\u00B2\)?/g,"b = (n\u2211xy \u2212 (\u2211x)(\u2211y))/(n\u2211x\u00B2 \u2212 (\u2211x)\u00B2)");
  /* CORRELATION: r = (n∑xy − (∑x)(∑y))/(√{(n∑x² − (∑x)²)(n∑y² − (∑y)²)})
     Single radical form — clearer than two separate √. */
  s=s.replace(/\br\s*=\s*(?=.*\u2211x\u00B2)(?=.*\u2211y\u00B2)[^.;\n]+/g,"r = (n\u2211xy \u2212 (\u2211x)(\u2211y))/(\u221A{(n\u2211x\u00B2 \u2212 (\u2211x)\u00B2)(n\u2211y\u00B2 \u2212 (\u2211y)\u00B2)})");
  /* Z-SCORE: Z = (X − μ)/(σ) */
  s=s.replace(/\bZ\s*=\s*\(?\s*[Xx]\s*[-\u2212]\s*\u03BC\s*\)?\s*\/?\s*\(?\s*\u03C3\s*\)?/g,"Z = (X \u2212 \u03BC)/(\u03C3)");
  s=s.replace(/([Xx])\s*[-\u2212]\s*\u03BC\u03C3/g,"($1 \u2212 \u03BC)/(\u03C3)");
  /* √(...)(...)  → √{(...)(...)} for product under radical in correlation formula */
  s=s.replace(/\u221A\(\s*(\([^)]+\)\s*\([^)]+\))\s*\)/g,"\u221A{$1}");
  /* √(expr)(expr) without outer parens → √{(expr)(expr)} */
  s=s.replace(/\u221A\(([^)]+)\)\(([^)]+)\)/g,"\u221A{($1)($2)}");
  /* "SSE/SST" "SSR/SST" without parens → "(SSE)/(SST)" */
  s=s.replace(/\b(SS[ERT])\s*\/\s*(SS[ERT])\b/g,"($1)/($2)");
  /* "1 - SSE/SST" → "1 - (SSE)/(SST)" */
  s=s.replace(/1\s*[-\u2212]\s*(SS[ERT])\s*\/\s*(SS[ERT])/g,"1 - ($1)/($2)");
  /* "ȳ - bx̄" — these are fine, leave as-is */
  /* "Σ(xi - x̄)²" "Σ(yi - ŷ)²" — parenthesized already, fine */
  /* Generic: "expr₁/expr₂" where expr has Σ or Greek → wrap in parens */
  s=s.replace(/(\u2211[a-zA-Z\u00B2\u0304\u0302\u03B1-\u03C9]+(?:\s*[-\u2212+]\s*[a-zA-Z0-9\u00B7\u00D7\u0304\u0302\u03B1-\u03C9\u00B2]+)*)\s*\/\s*(\u2211[a-zA-Z\u00B2\u0304\u0302\u03B1-\u03C9]+(?:\s*[-\u2212+]\s*[a-zA-Z0-9\u00B7\u00D7\u0304\u0302\u03B1-\u03C9\u00B2]+)*)/g,"($1)/($2)");
  /* "n - 2" or "n - k" bare in denominator: √(SSE/n-2) → √{(SSE)/(n-2)} */
  s=s.replace(/\u221A\(?(SSE)\s*\/\s*(n\s*[-\u2212]\s*\d+)\)?/g,"\u221A{($1)/($2)}");
  /* Generic: unbraced fraction with Greek on either side: μ/σ → (μ)/(σ) when standalone */
  s=s.replace(/(?<=\s|=|:)(\u03BC)\s*\/\s*(\u03C3)(?=\s|,|$)/g,"($1)/($2)");
  /* ═══ FORMULA PRESENTATION ═══ */
  /* Multiple P() expressions chained with commas → newline-separated */
  s=s.replace(/(P\([^)]+\)\s*[\u2248\u2265\u2264=<>\u2245]\s*[\d.]+%?)\s*,\s*(?=P\()/g,"$1\n");
  /* Multiple formulas chained with commas where each has ≈ or = → newline-separated */
  s=s.replace(/(\S+\s*[\u2248=]\s*[\d.]+%?)\s*,\s*(\S+\s*[\u2248=]\s*[\d.]+)/g,"$1\n$2");
  /* "formula, donde/where var = expr y/and var = expr" → split each assignment to its own line */
  s=s.replace(/,\s*(donde|where)\s+/gi,"\n$1 ");
  s=s.replace(/\s+([yY]|and)\s+([a-zA-Z\u03B1-\u03C9]\u0304?\s*=)/g,"\n$2");
  /* Semicolons between formulas → newlines */
  s=s.replace(/;\s*(?=[a-zA-Z\u03B1-\u03C9])/g,"\n");
  /* Derivative notation: convert compact forms to fraction-renderable forms */
  s=s.replace(/\bd\u00B2y\/dx\u00B2\b/g,"(d\u00B2y)/(dx\u00B2)");
  s=s.replace(/\bd\u00B2f\/dx\u00B2\b/g,"(d\u00B2f)/(dx\u00B2)");
  s=s.replace(/\bdydx\b/g,"(dy)/(dx)");s=s.replace(/\bdfdx\b/g,"(df)/(dx)");
  s=s.replace(/\bdzdt\b/g,"(dz)/(dt)");s=s.replace(/\bdsdt\b/g,"(ds)/(dt)");
  s=s.replace(/\bdydt\b/g,"(dy)/(dt)");s=s.replace(/\bdxdt\b/g,"(dx)/(dt)");
  s=s.replace(/\bdudx\b/g,"(du)/(dx)");s=s.replace(/\bdvdx\b/g,"(dv)/(dx)");
  /* Catch-all for concatenated derivative notation dAdB → (dA)/(dB).
     Restricted to math variables ONLY — excludes a/e/i/o/u so it doesn't shred
     Spanish words like "dada", "dedo", "dado", "duda", "dudo". Math derivatives
     use x/y/z/t/s/u/v/r/n/f/g/w/h/k/p/q/m, almost never aeiou-only combos. */
  s=s.replace(/\bd([xyztsfvwrnkpqmhg])d([xyztsfvwrnkpqmhg])\b/g,"(d$1)/(d$2)");
  s=s.replace(/(?<!\w)d\/d([a-zA-Z])\b/g,"(d)/(d$1)");/* d/dx → (d)/(dx) */
  s=s.replace(/\u2202\/\u2202([a-zA-Z])/g,"(\u2202)/(\u2202$1)");/* ∂/∂x → (∂)/(∂x) */
  /* Prime notation: f'(x), g'(x) — render with proper prime symbol */
  s=s.replace(/([a-zA-Z])''\(/g,"$1\u2033\u2060(");/* f''( → f″⁠( */
  s=s.replace(/([a-zA-Z])'\(/g,"$1\u2032\u2060(");/* f'( → f′⁠( */
  s=s.replace(/([a-zA-Z])''/g,"$1\u2033");/* f'' → f″ */
  s=s.replace(/([a-zA-Z])'/g,"$1\u2032");/* f' → f′ */
  /* Catch any prime+paren combos that slipped through other paths */
  s=s.replace(/([a-zA-Z]\u2032)\((?!\u2060)/g,"$1\u2060(");
  s=s.replace(/([a-zA-Z]\u2033)\((?!\u2060)/g,"$1\u2060(");
  /* Final cleanup: catch any remaining _X or ^X patterns the API might send */
  s=s.replace(/_([a-zA-Z0-9])(?![a-zA-Z0-9])/g,(_,c)=>SUB_MAP[c]||SUB_MAP[c.toLowerCase()]||c);
  s=s.replace(/\^([a-zA-Z0-9])/g,(_,c)=>SUP[c]||SUP[c.toLowerCase()]||c);
  /* Strip any truly orphaned underscores between math tokens */
  s=s.replace(/([a-zA-Z0-9\u03B1-\u03C9])_(?=[a-zA-Z0-9\u03B1-\u03C9])/g,"$1");
  /* Prevent bad line breaks: use non-breaking hyphen (U+2011) between numbers/% */
  s=s.replace(/(\d)-(\d)/g,"$1\u2011$2");/* 15-20 → 15‑20 (won't break) */
  s=s.replace(/(\d)-([\$\u20AC\u00A3%])/g,"$1\u2011$2");/* 20-$ → 20‑$ */
  s=s.replace(/(%)(\s*)-(\s*)(\d)/g,"$1$2\u2011$3$4");/* %-5 → %‑5 */
  /* Prevent formula line breaks: replace spaces around math operators with non-breaking spaces (U+00A0)
     so "FCF = EBIT × (1 - Tasa Impositiva)" stays on one line */
  s=s.replace(/ ([=\u2212\u00D7\u00F7\u00B1\u2248\u2265\u2264\u2260~]) /g,"\u00A0$1\u00A0");/* space=space → nbsp=nbsp */
  s=s.replace(/ ([+\-]) (?=[\d\w\u03B1-\u03C9(])/g,"\u00A0$1\u00A0");/* space+space before math token */
  s=s.replace(/([=\u2212+\-\u00D7]) \(/g,"$1\u00A0(");/* = ( → =nbsp( */
  s=s.replace(/\) ([=\u2212+\-\u00D7\u00F7])/g,")\u00A0$1");/* ) = → )nbsp= */
  /* Normalize spaces around / in fraction contexts so processFractions can match.
     Haiku often outputs "(a + b) / (c - d)" with spaces — collapse them to "(a+b)/(c-d)". */
  s=s.replace(/\)\s+\/\s+\(/g,")/(");
  s=s.replace(/\)\s+\/\s+([a-zA-Z0-9\u03B1-\u03C9\u221A\u03A3\u2211])/g,")/$1");
  s=s.replace(/([a-zA-Z0-9\u03B1-\u03C9])\s+\/\s+\(/g,"$1/(");
  s=s.replace(/([a-zA-Z0-9\u03B1-\u03C9])\s+\/\s+([a-zA-Z0-9\u03B1-\u03C9])(?=\s|[^a-zA-Z0-9]|$)/g,"$1/$2");

  /* Collapse mid-sentence newlines: if a line ends with a regular letter, comma, or quote
     AND the next line starts with a lowercase letter, it's a prose wrap — join with a space.
     Lines ending with ), digits, Greek, or superscripts are formula newlines → keep the gap. */
  s=s.replace(/([a-z\u00E0-\u00FF'"\u2019\u201D,])\n([a-z\u00E0-\u00FF])/g,"$1 $2");
  /* Restore **bold** and __underline__ markers */
  s=s.replace(/\x00FX(\d+)\x00/g,(_,i)=>"^("+fracExpProtect[i-1].replace("/","\u2044")+")");
  s=s.replace(/\x00B(\d+)\x00/g,(_,n)=>"**"+boldSafe[n-1]+"**");
  s=s.replace(/\x00U(\d+)\x00/g,(_,n)=>"__"+ulSafe[n-1]+"__");
  return s;
}

/* ═══════════ MathText: renders fractions, radicals, integrals/sums with stacked limits, bold/underline ═══════════ */
const fracStyle={display:"inline-flex",flexDirection:"column",alignItems:"center",verticalAlign:"middle",margin:"0 3px",lineHeight:1.1,fontSize:"0.85em"};
const fracLine={width:"100%",height:"1.5px",background:"currentColor",margin:"2px 0",borderRadius:1};
const FRAC_SKIP=/^(true|false|and|or|yes|no|if|of|is|it|to|in|on|up|da|do|de|la|lo|le|el|en|es|su|se|si|ya|yo|mi|tu|va|al|un|te|me|ni|vs|eg|ie|dado|dada|donde|cuando|como|sino|pero|pues|bien|mal|hay|son|fue|han|ser|con|por|para|cada|ante|bajo|tras|solo|todo|verdadero|falso|otro|otra)$/i;

/* Units like m/s, km/h or kg/m are not fractions: keep them inline. */
const UNIT_RE=/^(m|s|km|h|hs|hr|kg|g|mg|cm|mm|l|ml|min|seg|kwh|mph|d\u00EDa|dia|mes|a\u00F1o|ano|unidad|unidades|u)$/i;
function isUnit(t){return UNIT_RE.test(String(t||"").replace(/[.,;:]+$/,""));}

/* Radical style: √ with connected overline bar — professional math rendering */
const radicalStyle={display:"inline-flex",alignItems:"flex-end",verticalAlign:"middle",margin:"0 2px",position:"relative"};
const radSymStyle={fontSize:"1.2em",lineHeight:1,fontFamily:"'Times New Roman',serif",position:"relative",top:"-0.05em"};
const radBodyStyle={display:"inline-flex",alignItems:"center",borderTop:"1.8px solid currentColor",padding:"1px 4px 0 3px",marginLeft:"-1px",lineHeight:1.25,minHeight:"1.2em"};

/* Reverse maps: Unicode sub/sup → regular chars */
const SUB_REV={};for(const[k,v]of Object.entries(SUB_MAP))SUB_REV[v]=k;
const SUP_REV={};for(const[k,v]of Object.entries(SUP))SUP_REV[v]=k;
const SUB_SET=new Set(Object.values(SUB_MAP));
const SUP_SET=new Set(Object.values(SUP));
function decodeSub(s){return[...s].map(c=>SUB_REV[c]||c).join("");}
function decodeSup(s){return[...s].map(c=>SUP_REV[c]||c).join("");}

/* Styles for stacked operator limits (integrals, sums, products) */
const opLimitStyle={display:"inline-flex",alignItems:"center",verticalAlign:"middle",margin:"0 1px"};
const opStackStyle={display:"inline-flex",flexDirection:"column",alignItems:"center",lineHeight:1,margin:"0 1px",verticalAlign:"middle"};
const opSymStyle={fontSize:"1.35em",lineHeight:1};
const opLimFontStyle={fontSize:"0.7em",lineHeight:1,opacity:0.85,fontFamily:"'JetBrains Mono',monospace"};

function MathText({children}){
  if(typeof children!=="string")return children||null;
  const s=children;

  /* ——— Pass 1: Bracket-notation limits: ∫[a,b], ∑[i=1,n], ∏[k=1,n] ——— */
  const bracketLimitRe=/([\u222B\u2211\u220F])\[([^\],]*),([^\]]*)\]/g;
  /* ——— Pass 2: Unicode sub/sup limits right after ∫∑∏ ——— */
  const subCharsEsc=Object.values(SUB_MAP).map(c=>"\\u"+c.charCodeAt(0).toString(16).padStart(4,"0")).join("");
  const supCharsEsc=Object.values(SUP).map(c=>{const h=c.charCodeAt(0).toString(16).padStart(4,"0");return"\\u"+h;}).join("");
  /* ——— Pass 3: Fractions ——— */
  const fracRe=/\(([^)]+)\)\/\(([^)]+)\)|(?<![a-zA-Z])([a-zA-Z0-9\u00B2\u00B3\u03C0\u221A\u00B9\u2074-\u2079]+)\/([a-zA-Z0-9\u00B2\u00B3\u03C0\u221A\u00B9\u2074-\u2079]+)(?![a-zA-Z])/g;

  /* Combined approach: scan string, process operators first, then fractions */
  function processOperators(input){
    if(typeof input!=="string")return input;
    const parts=[];let last=0,m;

    /* First: bracket notation ∫[a,b] */
    const combined=new RegExp('([\\u222B\\u2211\\u220F])\\[([^\\],]*),([^\\]]*)\\]','g');
    while((m=combined.exec(input))!==null){
      if(m.index>last)parts.push(input.slice(last,m.index));
      const sym=m[1],lower=m[2].trim(),upper=m[3].trim();
      parts.push(<span key={"op"+m.index} style={opLimitStyle}><span style={opStackStyle}><span style={opLimFontStyle}>{upper}</span><span style={opSymStyle}>{sym}</span><span style={opLimFontStyle}>{lower}</span></span></span>);
      last=m.index+m[0].length;
    }
    if(last<input.length)parts.push(input.slice(last));
    if(parts.length<=1&&last===0)return input;
    return parts;
  }

  function processUnicodeLimits(input){
    if(typeof input!=="string")return input;
    const parts=[];let i=0;
    while(i<input.length){
      const c=input[i];
      if(c==="\u222B"||c==="\u2211"||c==="\u220F"){
        let sub="",sup="";let j=i+1;
        while(j<input.length&&SUB_SET.has(input[j])){sub+=input[j];j++;}
        while(j<input.length&&SUP_SET.has(input[j])){sup+=input[j];j++;}
        /* Also check sup first then sub */
        if(!sub&&!sup){let k=i+1;while(k<input.length&&SUP_SET.has(input[k])){sup+=input[k];k++;}while(k<input.length&&SUB_SET.has(input[k])){sub+=input[k];k++;}if(sub||sup)j=k;}
        if(sub||sup){
          const lower=decodeSub(sub);const upper=decodeSup(sup);
          parts.push(<span key={"uo"+i} style={opLimitStyle}><span style={opStackStyle}>{upper&&<span style={opLimFontStyle}>{upper}</span>}<span style={opSymStyle}>{c}</span>{lower&&<span style={opLimFontStyle}>{lower}</span>}</span></span>);
          i=j;
        }else{parts.push(c);i++;}
      }else{parts.push(c);i++;}
    }
    /* Merge consecutive strings */
    const merged=[];let buf="";
    for(const p of parts){if(typeof p==="string")buf+=p;else{if(buf){merged.push(buf);buf="";}merged.push(p);}}
    if(buf)merged.push(buf);
    if(merged.length<=1&&typeof merged[0]==="string")return merged[0]||input;
    return merged;
  }

  /* Find matching closing paren/brace for balanced nesting */
  function findBalanced(s,start,open,close){
    if(s[start]!==open)return -1;
    let d=0;
    for(let i=start;i<s.length;i++){if(s[i]===open)d++;if(s[i]===close)d--;if(d===0)return i;}
    return -1;
  }

  function processFractions(input){
    if(typeof input!=="string")return input;
    const parts=[];let i=0;
    const supC="\u00B2\u00B3\u2074\u2075\u2076\u2077\u2078\u2079\u207F\u207A\u207B";
    const tokChars=/[\w\u00B2\u00B3\u03B1-\u03C9\u0394\u03A3\u03A9\u03C0\u221A\u00B9\u2074-\u2079\u207F\u2070\u2080-\u2089\u2099\u0304\u0302\u00D7.\u2032\u2033\u2212,]/;
    const FRAC_SKIP=/^(true|false|and|or|yes|no|if|of|is|it|to|in|on|up|da|do|de|la|lo|le|el|en|es|su|se|si|ya|yo|mi|tu|va|al|un|te|me|ni|vs|eg|ie|dado|dada|donde|cuando|como|sino|pero|pues|bien|mal|hay|son|fue|han|ser|con|por|para|cada|ante|bajo|tras|solo|todo|verdadero|falso|otro|otra)$/i;
    const PURE_NUM=/^[\d,.\s]+$/;/* Skip pure numeric fractions like 50,000/25,000 */

    while(i<input.length){
      /* Pattern 1: (balanced-expr)[sups]/(balanced-expr or token) */
      if(input[i]==="("){
        const closeNum=findBalanced(input,i,"(",")");
        if(closeNum>i+1){
          /* Check for superscripts after closing paren */
          let afterNum=closeNum+1;
          while(afterNum<input.length&&supC.includes(input[afterNum]))afterNum++;
          /* Check for / */
          if(afterNum<input.length&&input[afterNum]==="/"){
            const slashPos=afterNum;
            let num=input.slice(i+1,closeNum);
            let numSup=input.slice(closeNum+1,slashPos);
            let den=null,denEnd=slashPos+1;
            /* Denominator: balanced parens or token */
            if(slashPos+1<input.length&&input[slashPos+1]==="("){
              const closeDen=findBalanced(input,slashPos+1,"(",")");
              if(closeDen>slashPos+2){den=input.slice(slashPos+2,closeDen);denEnd=closeDen+1;}
            }
            if(!den){
              /* Token denominator */
              let j=slashPos+1;
              /* Handle √{...} as atomic token */
              if(j<input.length&&input[j]==="\u221A"&&j+1<input.length&&input[j+1]==="{"){
                const cb=findBalanced(input,j+1,"{","}");
                if(cb>j+2){j=cb+1;}else{while(j<input.length&&tokChars.test(input[j]))j++;}
              }else{
                while(j<input.length&&(tokChars.test(input[j])||input[j]==="\u221A"||input[j]==="{"))j++;
                /* Also consume a following (…) so P(B), f(x), P(A|B) are treated as one token */
                if(j>slashPos+1&&j<input.length&&input[j]==="("){
                  const cb=findBalanced(input,j,"(",")");
                  if(cb>j){j=cb+1;}
                }
              }
              if(j>slashPos+1){den=input.slice(slashPos+1,j);denEnd=j;}
            }
            if(den&&!FRAC_SKIP.test(num)&&!FRAC_SKIP.test(den)){
              parts.push(input.slice(0,0));/* flush previous handled by outer logic */
              const renderPart=(t)=>{let r=processCombiningMarks(t);const ap=(items,fn)=>{if(typeof items==="string")return fn(items);if(Array.isArray(items))return items.map(x=>typeof x==="string"?fn(x):x).flat();return items;};r=ap(r,processRadicals);r=ap(r,processExponents);return r;};
              if(i>0)parts.push(input.slice(parts.length===1?0:0,i));/* This is handled below */
              /* Recursively build remaining */
              const before=input.slice(0,i);
              const fracEl=<span key={"f"+i} style={fracStyle}><span style={{padding:"0 3px"}}>{renderPart(num+numSup)}</span><span style={fracLine}/><span style={{padding:"0 3px"}}>{renderPart(den)}</span></span>;
              const after=input.slice(denEnd);
              const result=[];
              if(before)result.push(before);
              result.push(fracEl);
              if(after){const rest=processFractions(after);if(Array.isArray(rest))result.push(...rest);else if(rest)result.push(rest);}
              return result;
            }
          }
        }
      }
      /* Pattern 2: simple token/token or token/(balanced) */
      if(tokChars.test(input[i])||input[i]==="\u221A"){
        let tokStart=i;
        /* Handle √{...} */
        if(input[i]==="\u221A"&&i+1<input.length&&input[i+1]==="{"){
          const cb=findBalanced(input,i+1,"{","}");
          if(cb>i+2)i=cb+1;else i++;
          continue;
        }
        while(i<input.length&&tokChars.test(input[i]))i++;
        if(i<input.length&&input[i]==="/"){
          const tok1=input.slice(tokStart,i);
          if(tok1&&!FRAC_SKIP.test(tok1)){
            const slashPos=i;
            let den=null,denEnd=slashPos+1;
            if(slashPos+1<input.length&&input[slashPos+1]==="("){
              const closeDen=findBalanced(input,slashPos+1,"(",")");
              if(closeDen>slashPos+2){den=input.slice(slashPos+2,closeDen);denEnd=closeDen+1;}
            }
            if(!den){
              let j=slashPos+1;
              if(j<input.length&&input[j]==="\u221A"&&j+1<input.length&&input[j+1]==="{"){
                const cb=findBalanced(input,j+1,"{","}");if(cb>j+2)j=cb+1;else while(j<input.length&&tokChars.test(input[j]))j++;
              }else{
                while(j<input.length&&tokChars.test(input[j]))j++;
                /* Also consume a following (…) so P(B), f(x), P(A|B) are treated as one token */
                if(j>slashPos+1&&j<input.length&&input[j]==="("){
                  const cb=findBalanced(input,j,"(",")");
                  if(cb>j){j=cb+1;}
                }
              }
              if(j>slashPos+1){den=input.slice(slashPos+1,j);denEnd=j;}
            }
            if(den&&!FRAC_SKIP.test(den)&&!(PURE_NUM.test(tok1)&&PURE_NUM.test(den))&&!(isUnit(tok1)&&isUnit(den))){
              const renderPart=(t)=>{let r=processCombiningMarks(t);const ap=(items,fn)=>{if(typeof items==="string")return fn(items);if(Array.isArray(items))return items.map(x=>typeof x==="string"?fn(x):x).flat();return items;};r=ap(r,processRadicals);r=ap(r,processExponents);return r;};
              const before=input.slice(0,tokStart);
              const fracEl=<span key={"f"+tokStart} style={fracStyle}><span style={{padding:"0 3px"}}>{renderPart(tok1)}</span><span style={fracLine}/><span style={{padding:"0 3px"}}>{renderPart(den)}</span></span>;
              const after=input.slice(denEnd);
              const result=[];
              if(before)result.push(before);
              result.push(fracEl);
              if(after){const rest=processFractions(after);if(Array.isArray(rest))result.push(...rest);else if(rest)result.push(rest);}
              return result;
            }
          }
        }
        continue;
      }
      i++;
    }
    return input;/* no fractions found, return original string */
  }

  /* Pipeline: operators → unicode limits → FRACTIONS → combining marks → radicals → exponents → bold/underline → newlines
     CRITICAL: fractions MUST run before radicals/combining marks. Those processors split the string
     into segments (React elements + remaining strings), which destroys fraction patterns like
     (num)/(√{...}) — the radical extractor would rip √{...} out of the denominator, leaving
     processFractions with an unmatched '(' and no way to see the full fraction. */
  let result=processOperators(s);
  function applyToSegments(items,fn){
    if(typeof items==="string")return fn(items);
    if(!Array.isArray(items))return items;
    return items.map((it,idx)=>typeof it==="string"?fn(it):it);
  }
  result=applyToSegments(result,processUnicodeLimits);
  if(Array.isArray(result))result=result.flat();

  /* Combining marks: x̄ (U+0304 macron), p̂ (U+0302 circumflex) → CSS-styled overline/hat */
  function processCombiningMarks(input){
    if(typeof input!=="string")return input;
    /* Restrict to known math/stats variables — avoids clobbering Spanish words
       like "dada","mama","para" that may carry stray combining chars from API */
    const re=/([xyprznmwXYPRZNMW\u03B1-\u03C9])(\u0304|\u0302)/g;
    const parts=[];let last=0,m;
    while((m=re.exec(input))!==null){
      if(m.index>last)parts.push(input.slice(last,m.index));
      const isBar=m[2]==="\u0304";
      parts.push(<span key={"cm"+m.index} style={{display:"inline-block",textDecoration:isBar?"overline":"none",textDecorationThickness:"1.5px",textUnderlineOffset:isBar?undefined:undefined,fontStyle:"normal",padding:"0 1px",position:"relative"}}>{m[1]}{isBar?"":<span style={{position:"absolute",top:"-0.35em",left:"50%",transform:"translateX(-50%)",fontSize:"0.65em",lineHeight:1}}>{"\u0302"}</span>}</span>);
      last=m.index+m[0].length;
    }
    if(last<input.length)parts.push(input.slice(last));
    if(parts.length<=1&&last===0)return input;
    return parts;
  }

  /* Radical processing: √{content}, √(content), √[content], or √token → rendered radical with overline */
  function processRadicals(input){
    if(typeof input!=="string")return input;
    const re=/\u221A\{([^}]+)\}|\u221A\(([^)]+)\)|\u221A\[([^\]]+)\]|\u221A([a-zA-Z0-9\u00B2\u00B3\u03C0\u03B1-\u03C9\u0304\u0302]+)/g;
    const parts=[];let last=0,m;
    while((m=re.exec(input))!==null){
      if(m.index>last)parts.push(input.slice(last,m.index));
      const body=m[1]||m[2]||m[3]||m[4];
      /* Recursively render radical body: combining marks + exponents */
      let renderedBody=processCombiningMarks(body);
      const apInner=(items,fn)=>{if(typeof items==="string")return fn(items);if(Array.isArray(items))return items.map(x=>typeof x==="string"?fn(x):x).flat();return items;};
      renderedBody=apInner(renderedBody,processExponents);
      parts.push(<span key={"r"+m.index} style={radicalStyle}><span style={radSymStyle}>{"\u221A"}</span><span style={radBodyStyle}>{renderedBody}</span></span>);
      last=m.index+m[0].length;
    }
    if(last<input.length)parts.push(input.slice(last));
    if(parts.length<=1&&last===0)return input;
    return parts;
  }

  /* Exponent rendering: base^(expr) → base with superscript block */
  function processExponents(input){
    if(typeof input!=="string")return input;
    /* Extended: `)` is valid base char (handles (expr)^(n/d) patterns).
       U+2044 ⁄ FRACTION SLASH signals a protected fractional exponent → rendered as tiny stacked fraction. */
    const re=/([a-zA-Z0-9\u03B1-\u03C9)])\^\(([^)]+)\)/g;
    const parts=[];let last=0,m;
    while((m=re.exec(input))!==null){
      if(m.index>last)parts.push(input.slice(last,m.index));
      const expInner=m[2];
      let supContent;
      if(expInner.includes("\u2044")){/* U+2044 fraction slash → tiny stacked fraction */
        const si=expInner.indexOf("\u2044");const n=expInner.slice(0,si);const d=expInner.slice(si+1);
        supContent=<span style={{display:"inline-flex",flexDirection:"column",alignItems:"center",verticalAlign:"middle",lineHeight:1.1,fontSize:"0.88em",margin:"0 1px"}}><span style={{padding:"0 2px"}}>{n}</span><span style={{width:"100%",height:"1px",background:"currentColor",margin:"1px 0",borderRadius:1}}/><span style={{padding:"0 2px"}}>{d}</span></span>;
      }else{supContent=expInner;}
      parts.push(<span key={"exp"+m.index} style={{display:"inline"}}>{m[1]}<sup style={{fontSize:"0.72em",lineHeight:1}}>{supContent}</sup></span>);
      last=m.index+m[0].length;
    }
    if(last<input.length)parts.push(input.slice(last));
    if(parts.length<=1&&last===0)return input;
    return parts;
  }

  /* Bold/underline MUST run FIRST — before fractions/radicals/marks split the string.
     Otherwise **a = (x)/(y)** gets split at the fraction, breaking the **..** pattern. */
  function processMathInner(t){
    const applyStr=(items,fn)=>{
      if(typeof items==="string")return fn(items);
      if(Array.isArray(items))return items.map(x=>typeof x==="string"?fn(x):x).flat();
      return items;
    };
    let r=processFractions(t);
    r=applyStr(r,processCombiningMarks);
    r=applyStr(r,processRadicals);
    r=applyStr(r,processExponents);
    return r;
  }
  function processBoldUnderline(input){
    if(typeof input!=="string")return input;
    const re=/\*\*([^*]+)\*\*|__([^_]+)__/g;
    const parts=[];let last=0,m;
    while((m=re.exec(input))!==null){
      if(m.index>last)parts.push(input.slice(last,m.index));
      if(m[1])parts.push(<strong key={"b"+m.index} style={{color:TH.text,fontWeight:700}}>{processMathInner(m[1])}</strong>);
      else if(m[2])parts.push(<span key={"u"+m.index} style={{textDecoration:"underline",textDecorationColor:alpha(TH.accent,38),textUnderlineOffset:2,textDecorationThickness:1.5}}>{processMathInner(m[2])}</span>);
      last=m.index+m[0].length;
    }
    if(last<input.length)parts.push(input.slice(last));
    if(parts.length<=1&&last===0)return input;
    return parts;
  }
  /* Split newlines into <br/> */
  function processNewlines(input){
    if(typeof input!=="string"||!input.includes("\n"))return input;
    return input.split("\n").flatMap((line,i,arr)=>i<arr.length-1?[line,<span key={"nl"+i} style={{display:"block",height:8}}/>]:[line]).filter(x=>x!=="");
  }

  /* Step 1: Bold/underline (before anything splits the string) */
  result=applyToSegments(result,processBoldUnderline);
  if(Array.isArray(result))result=result.flat();

  /* Step 2: Newlines */
  result=applyToSegments(result,processNewlines);
  if(Array.isArray(result))result=result.flat();

  /* Step 3: Fractions (on remaining string segments) */
  result=applyToSegments(result,processFractions);
  if(Array.isArray(result))result=result.flat();

  /* Step 4: Combining marks, radicals, exponents */
  result=applyToSegments(result,processCombiningMarks);
  if(Array.isArray(result))result=result.flat();

  result=applyToSegments(result,processRadicals);
  if(Array.isArray(result))result=result.flat();

  result=applyToSegments(result,processExponents);
  if(Array.isArray(result))result=result.flat();

  if(typeof result==="string")return <>{result}</>;
  if(Array.isArray(result)&&result.length<=1&&typeof result[0]==="string")return <>{result[0]}</>;
  return <>{result}</>;
}

function deepFmt(obj){
  if(typeof obj==="string")return formatMath(obj);
  if(Array.isArray(obj))return obj.map(deepFmt);
  if(obj&&typeof obj==="object"){const o={};for(const[k,v]of Object.entries(obj)){o[k]=(k==="correctIndex"||k==="type"||k==="answer")?v:deepFmt(v);}return o;}
  return obj;
}

export { formatMath, MathText, deepFmt };
