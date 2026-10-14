// Terminal projection only. No broker reads, recognition, valuation or management decisions.
import { silhouette } from "./tastytrade-payoff-render.mjs";
import { stripVTControlCharacters } from "node:util";
const segmenter = new Intl.Segmenter("en", { granularity: "grapheme" });
export function cellWidth(text) {
  return [...segmenter.segment(stripVTControlCharacters(String(text)))].reduce((n, { segment }) => {
    const visible = segment.replace(/[\p{Mark}\p{Cf}\p{Cc}]/gu, "");
    if (!visible) return n;
    const c = visible.codePointAt(0);
    const wide = (/\p{Extended_Pictographic}/u.test(visible) && !segment.includes("\uFE0E")) || c >= 0x1100 && (
      c <= 0x115f || c === 0x2329 || c === 0x232a || c >= 0x2e80 && c <= 0xa4cf ||
      c >= 0xac00 && c <= 0xd7a3 || c >= 0xf900 && c <= 0xfaff || c >= 0xfe10 && c <= 0xfe6f ||
      c >= 0xff01 && c <= 0xff60 || c >= 0xffe0 && c <= 0xffe6 || c >= 0x20000 && c <= 0x3fffd);
    return n + (wide ? 2 : 1);
  }, 0);
}
const pad = (s, width, right = false) => right ? " ".repeat(Math.max(0, width - cellWidth(s))) + s :
  s + " ".repeat(Math.max(0, width - cellWidth(s)));
const spotPrice = (v) => String(v).includes(".") ? String(v).padEnd(String(v).indexOf(".") + 3, "0") : `${v}.00`;
const dollars = (v) => `${v > 0 ? "+" : v < 0 ? "−" : ""}$${new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 2, minimumFractionDigits: Number.isInteger(Math.round(Math.abs(v) * 100) / 100) ? 0 : 2,
}).format(Math.abs(v))}`;
function wrap(text, width) {
  const lines = []; let line = "";
  for (const word of text.split(" ")) {
    if (line && cellWidth(`${line} ${word}`) > width) { lines.push(line); line = ""; }
    line += `${line ? " " : ""}${word}`;
  }
  if (line) lines.push(line);
  return lines;
}
// The track normalizes to verified management objectives. Dollar rounding is
// presentation only; exact domain values still drive marker placement.
const wholeDollars = value => `$${new Intl.NumberFormat('en-US', { maximumFractionDigits:0 }).format(Math.abs(value))}`;
function economicSlot(value, objectives) {
  if (Math.abs(value)<1e-8) return 4;
  const denominator=value>0?objectives.targetGrossProfit:objectives.adverseExitLoss;
  const fraction=Number.isFinite(denominator)&&denominator>0?Math.abs(value)/denominator:null;
  const steps=fraction===null?1:fraction>=1-1e-8?4:Math.max(1,Math.min(3,Math.round(fraction*4)));
  return 4+(value>0?steps:-steps);
}
export function exitTrack(position, { ascii = false, color = false, leftStopWidth } = {}) {
  const { pnl, economicObjectives: objectives = {}, recentMovement: movement = {} } = position ?? {};
  const profit=objectives.targetGrossProfit,loss=objectives.adverseExitLoss,stop=objectives.stopThreshold?.grossPnl;
  const valid=n=>Number.isFinite(n)&&n>0;
  const ink=(s,c)=>color?`\x1b[${c}m${s}\x1b[97m`:s;
  const line=ascii?'-':'─',bar=ascii?'|':'│';
  const noProtectiveExit=position?.protectiveExitEvidence?.state==='absent'&&!position?.stopOrder&&!objectives.stopThreshold&&!valid(loss);
  const at=Number.isFinite(pnl)?economicSlot(pnl,objectives):null;
  const beyondStop=Number.isFinite(pnl)&&valid(loss)&&pnl < -loss-1e-8;
  const drawAt=beyondStop?null:at;
  const directionArrow=['improving','deteriorating'].includes(movement.direction)?
    ink(movement.direction==='improving'?(ascii?'>':'→'):(ascii?'<':'←'),movement.direction==='improving'?'92':'91'):' ';
  const overflow=beyondStop?ink(ascii?'*':'◆','96')+directionArrow:'  ';
  const trackCells=Array.from({length:9},(_,i)=>{
    const scaled=i<4?valid(loss):valid(profit),landmark=[0,4,8].includes(i);
    const base=i===0&&noProtectiveExit?(ascii?'!':'☠︎'):i===4?bar:landmark&&scaled?bar:scaled?line:'.';
    const code=i===4?'97':i<4?'91':'92';
    const filler=i===4?(valid(profit)?line:'.'):scaled?line:'.';
    const fillerCode=i===4?'92':code;
    const marker=drawAt===i?ink(ascii?'*':'◆','96'):ink(filler,fillerCode);
    const arrow=drawAt===i&&['improving','deteriorating'].includes(movement.direction)?
      ink(movement.direction==='improving'?(ascii?'>':'→'):(ascii?'<':'←'),movement.direction==='improving'?'92':'91'):ink(filler,fillerCode);
    // Put the final boundary last so the dollar summary touches it even at target.
    return i===8?[marker,arrow,ink(base,code)]:[ink(base,code),marker,arrow];
  }).flat();
  // A verified nonnegative stop belongs on the same economic axis as current P/L.
  // Preserve references/current/movement when terminal quantization shares a cell.
  if(Number.isFinite(stop)&&stop>=0&&valid(profit)&&stop<=profit){
    const desired=Math.round(12+14*stop/profit);
    const current=drawAt===null?null:drawAt===8?24:drawAt*3+1;
    const occupied=new Set([0,12,26]);
    if(current!==null){occupied.add(current);if(movement.direction)occupied.add(current+1);}
    const candidates=Array.from({length:14},(_,i)=>13+i).filter(i=>!occupied.has(i));
    const ordered=candidates.filter(i=>current===null||Math.abs(stop-pnl)<1e-8||(stop>pnl?i>current:i<current));
    const available=ordered.length?ordered:candidates;
    available.sort((a,b)=>Math.abs(a-desired)-Math.abs(b-desired)||a-b);
    if(available.length)trackCells[available[0]]=ink(ascii?'r':'↩︎',stop>1e-8?'92':'97');
  }
  const track=trackCells.join('');
  const status=at===null?' ?':movement.direction&&movement.mode==='retained'?' r':'';
  const targetLabel=valid(profit)?ink(wholeDollars(profit),'92'):ink(ascii?'--':'—','37');
  const leftAmount=Number.isFinite(stop)&&stop < -1e-8 ? (ascii?'-':'−')+wholeDollars(stop):'';
  const labelWidth=Math.max(leftStopWidth??0,cellWidth(leftAmount));
  const leftLabel=labelWidth?pad(leftAmount?ink(leftAmount,'91'):'',labelWidth,true)+' ':'';
  return `${leftLabel}${overflow}${track}${targetLabel}${status}`;
}
export function observationAge(evidence) {
  if (!Number.isFinite(evidence.ageMs)) return "—";
  const seconds = Math.max(0, Math.floor(evidence.ageMs / 1000));
  const age = seconds < 60 ? `${seconds}s` : seconds < 3600 ? `${Math.floor(seconds / 60)}m` : `${Math.floor(seconds / 3600)}h`;
  return age;
}
// Both durations come from the existing verified calendar-day projection.
function dteLabel(position, ascii) {
  const missing=ascii?'--':'—';
  const days=n=>Number.isInteger(n)&&n>=0?String(n):missing;
  return `${days(position.dte)}/${days(position.lifespan?.openingDte)}`;
}
// The domain supplies calendar-day progress. This function only projects it.
export function spanTrack(position, { width = 11, dteWidth = 5, ascii = false, color = false } = {}) {
  const { lifespan } = position;
  const duration=dteLabel(position,ascii);
  dteWidth=Math.max(dteWidth,cellWidth(duration));
  if (position.manualExit && lifespan) return manualSpan(position, { width, dteWidth, ascii, color });
  let track;
  if (!lifespan || !Number.isFinite(lifespan.progress)) {
    const missing = ascii ? "--" : "—";
    track = pad(" ".repeat(Math.floor((width - cellWidth(missing))/2)) + missing,width);
  } else {
    const progress = lifespan.progress;
    const cells = Array(width).fill(ascii ? "-" : "─");
    const at = Math.round(Math.max(0,Math.min(1,progress)) * (width - 1));
    cells[at] = progress <= 0 || progress >= 1 ? ascii ? "*" : "◆" : ascii ? "o" : "●";
    track = cells.join("");
  }
  return `${track} ${pad(duration,dteWidth,true)}d`;
}

// Eleven logical time slots. Co-cell markers concatenate in current/M/expiration
// order rather than moving a checkpoint or silently erasing it.
function manualSpan(position, { width, dteWidth, ascii, color }) {
  const { lifespan, manualExit: m } = position;
  const index = p => Math.round(Math.max(0,Math.min(1,p))*(width-1));
  const slots = Array.from({length:width},()=>[]);
  const ink = (s,code) => color ? `\x1b[${code}m${s}\x1b[97m` : s;
  const code = m.state === "PAST DUE" ? "91" : "92";
  slots[index(lifespan.progress)].push(ascii ? "o" : "●");
  slots[index(m.progress)].push(ink("M",code));
  slots[width-1].push(ascii ? "*" : "◆");
  const track = slots.map(s=>s.length?s.join(""):ascii?"-":"─").join("");
  return `${track} ${pad(dteLabel(position,ascii),dteWidth,true)}d`;
}

export function renderPanel({ accountLabel, positions }, { color = false, columns = 157, ascii = false, showPnl = false } = {}) {
  const limit = Number.isInteger(columns) && columns > 1 ? columns - 1 : 156;
  const mono = s => ascii ? s.replaceAll("—","--").replaceAll("−","-").replaceAll("–","-").replaceAll("≥",">=").replaceAll("≤","<=") : s;
  const ink = (s,code) => color && code ? `\x1b[${code}m${s}\x1b[97m` : s;
  const leftStopWidth=Math.max(0,...positions.map(p=>{
    const stop=p.economicObjectives?.stopThreshold?.grossPnl;
    return Number.isFinite(stop)&&stop < -1e-8?cellWidth((ascii?'-':'−')+wholeDollars(stop)):0;
  }));
  const exitOptions = { ascii, leftStopWidth };
  const dteWidth = Math.max(5,...positions.map(p=>cellWidth(dteLabel(p,ascii))));
  const rowAge = p => observationAge({ ageMs: Math.max(...[p.optionEvidence.ageMs,
    ...(p.spot.value === null ? [] : [p.spot.ageMs])].filter(Number.isFinite)) });
  const profitCell = (p, colored = false) => `${exitTrack(p,{...exitOptions,color:colored})}${
    p.transition ? colored ? ink(" T","93") : " T" : ""}`;
  const displayedPnl = p => p.pnl === null ? null : Math.sign(p.pnl) * Math.round(Math.abs(p.pnl)*100)/100;
  const payoff = (p, colored = false) => Object.hasOwn(p, "payoffUnavailableLabel") && !p.payoff ?
    ink(mono(p.payoffUnavailableLabel), colored ? "37" : null) : silhouette(p,{ascii,color:colored}).text;
  const rows = positions.map(p=>({ SYMBOL:p.symbol, "TRADE SHAPE":payoff(p),
    RANGE:p.rangeLabel ?? (p.range ? `${p.range.lower}–${p.range.upper}` : "—"),
    SPOT:p.spot.value === null ? "—" : spotPrice(p.spot.value),
    DTE:spanTrack(p,{ascii,dteWidth}), "EXIT PROGRESS":profitCell(p),
    "P/L":p.pnl === null ? "—" : dollars(displayedPnl(p)), QUOTE:rowAge(p), p }));
  const specs = [["SYMBOL",6],["TRADE SHAPE",31],["RANGE",11],["SPOT",9],["DTE",11+dteWidth+2],
    ["EXIT PROGRESS",29],["P/L",9],["QUOTE",5]];
  const widths = Object.fromEntries(specs.map(([k,w])=>[k,Math.max(w,...rows.map(r=>cellWidth(mono(r[k]))))]));
  const gap = k => k === "EXIT PROGRESS" ? "  " : ["DTE","P/L"].includes(k) ? "    " : k === "QUOTE" ? "   " : "  ";
  const size = keys => keys.reduce((n,k,i)=>n+widths[k]+(i ? gap(k).length : 0),0);
  let keys = specs.map(([k])=>k).filter(k=>showPnl || k!=="P/L"), compact=false;
  for(const k of ["TRADE SHAPE","RANGE","SPOT"]) {
    if(size(keys)<=limit)break;
    keys=keys.filter(key=>key!==k);compact=true;
  }
  if(size(keys)>limit)return wrap(`Terminal too narrow: ${positions.length} positions not displayed; use --tsv.`,limit).join("\n")+"\n";
  const numeric = new Set(["SPOT","P/L","QUOTE"]);
  const join = values => values.map((v,i)=>(i ? gap(keys[i]) : "")+v).join("").trimEnd();
  const heading = `Account ${accountLabel}${compact ? " | narrow view" : ""}`;
  const header = join(keys.map(k=>["TRADE SHAPE","DTE","EXIT PROGRESS"].includes(k) ? pad(" ".repeat(Math.floor((widths[k]-k.length)/2))+k,widths[k]) : pad(k,widths[k],numeric.has(k))));
  const lines = [...wrap(heading,limit),header];
  for(const r of rows) {
    const p=r.p;
    lines.push(join(keys.map(k=>{
      const value=mono(r[k]);
      const code=k === "P/L" ? displayedPnl(p) === null || displayedPnl(p) === 0 ? null : displayedPnl(p)>0 ? "92" : "91" :
        k === "SPOT" ? silhouette(p,{ascii}).spotRegionCode?.replace("2;","") ?? (p.spot.value === null ? "37" : "97") :
        k === "QUOTE" ? p.market.closeDebit === null || p.market.valuationSource === "broker mark" || p.optionEvidence.stale || p.spot.stale || p.optionEvidence.retained || p.spot.retained ? "93" : null :
        value === mono("—") ? "37" : null;
      const decorated=k === "TRADE SHAPE" ? payoff(p,color) : k === "EXIT PROGRESS" ? profitCell(p,color) : k === "DTE" ? spanTrack(p,{ascii,dteWidth,color}) : ink(value,code);
      return pad(decorated,widths[k],numeric.has(k));
    })));
  }
  if(positions.length===0)lines.push("No live trades.");
  for (const p of positions) for (const issue of p.issues ?? []) {
    lines.push(...wrap(`${p.symbol}: ${p.status === "recognized" ? issue : `${p.status}: ${issue}`}`, limit));
  }
  const output=lines.join("\n");
  return color ? `\n\x1b[97m${output}\x1b[0m\n` : `\n${output}\n`;
}
