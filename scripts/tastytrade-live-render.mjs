// Terminal projection only. No broker reads, recognition, valuation or management decisions.
import { silhouette } from "./tastytrade-payoff-render.mjs";
import { stripVTControlCharacters } from "node:util";
const segmenter = new Intl.Segmenter("en", { granularity: "grapheme" });
export function cellWidth(text) {
  return [...segmenter.segment(stripVTControlCharacters(String(text)))].reduce((n, { segment }) => {
    const visible = segment.replace(/[\p{Mark}\p{Cf}\p{Cc}]/gu, "");
    if (!visible) return n;
    const c = visible.codePointAt(0);
    const wide = /\p{Extended_Pictographic}/u.test(visible) || c >= 0x1100 && (
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
const progressPercent = (progress, ascii = false) =>
  `${progress >= 0 ? "+" : ascii ? "-" : "−"}${Math.round(Math.abs(progress) * 100)}%${progress >= 1 - 1e-8 ? "~" : ""}`;
// Rendering bounds only the marker; the signed economic percentage remains unbounded.
export function exitTrack(progress, { width = 11, percentWidth = 6, ascii = false, color = false } = {}) {
  if (!Number.isFinite(progress)) {
    const missing = ascii ? "--" : "—";
    return color ? `\x1b[37m${missing}\x1b[97m` : missing;
  }
  const reached = progress >= 1 - 1e-8;
  const track = Array(width).fill(ascii ? "-" : "─");
  const index = Math.round(Math.max(0, Math.min(1, progress)) * (width - 1));
  const marker = progress < 0 ? (ascii ? "*" : "◆") : progress > 1 + 1e-8 ? (ascii ? ">" : "→") : reached ? (ascii ? "*" : "◆") : (ascii ? "o" : "●");
  const code = progress < 0 ? "91" : reached ? "92" : progress >= .9 ? "93" : "96";
  track[index] = color ? `\x1b[${code}m${marker}\x1b[97m` : marker;
  const percent = progressPercent(progress, ascii).padStart(percentWidth);
  return `${track.join("")} ${color ? `\x1b[${code}m${percent}\x1b[97m` : percent}`;
}
export function observationAge(evidence) {
  if (!Number.isFinite(evidence.ageMs)) return "—";
  const seconds = Math.max(0, Math.floor(evidence.ageMs / 1000));
  const age = seconds < 60 ? `${seconds}s` : seconds < 3600 ? `${Math.floor(seconds / 60)}m` : `${Math.floor(seconds / 3600)}h`;
  return age;
}
function profitObjective(p) {
  if (!p.targetOrder || !Number.isFinite(p.target)) return "—";
  // Only exact integer credit-capture objectives get Pxx labels; TARGET retains exact price evidence.
  const percent = p.profitCapture * 100;
  const objective = Number.isFinite(percent) && Math.abs(percent - Math.round(percent)) < 1e-8 ?
    `P${Math.round(percent)}` : "LIMIT";
  return objective;
}
// The domain supplies calendar-day progress. This function only projects it.
export function spanTrack(position, { width = 11, dteWidth = 3, ascii = false } = {}) {
  const { lifespan, dte } = position;
  const remaining = Number.isInteger(dte) && dte >= 0 ? String(dte) : ascii ? "--" : "—";
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
  return `${track}${pad(remaining,dteWidth,true)}d`;
}

export function renderPanel({ accountLabel, positions }, { color = false, columns = 157, ascii = false } = {}) {
  const limit = Number.isInteger(columns) && columns > 1 ? columns - 1 : 156;
  const mono = s => ascii ? s.replaceAll("—","--").replaceAll("−","-").replaceAll("–","-") : s;
  const ink = (s,code) => color && code ? `\x1b[${code}m${s}\x1b[97m` : s;
  const exitOptions = { ascii, percentWidth: Math.max(6,...positions.filter(p=>Number.isFinite(p.progress)).map(p=>cellWidth(progressPercent(p.progress,ascii)))) };
  const objectiveWidth = Math.max(3,...positions.map(p=>cellWidth(mono(profitObjective(p)))));
  const dteWidth = Math.max(3,...positions.map(p=>cellWidth(String(p.dte))));
  const rowAge = p => observationAge({ ageMs: Math.max(...[p.optionEvidence.ageMs,
    ...(p.spot.value === null ? [] : [p.spot.ageMs])].filter(Number.isFinite)) });
  const profitCell = (p, colored = false) => `${pad(mono(profitObjective(p)),objectiveWidth)} ${
    exitTrack(p.targetOrder ? p.progress : null,{...exitOptions,color:colored})}${
    p.transition ? colored ? ink(" T","93") : " T" : ""}`;
  const displayedPnl = p => p.pnl === null ? null : Math.sign(p.pnl) * Math.round(Math.abs(p.pnl)*100)/100;
  const rows = positions.map(p=>({ SYMBOL:p.symbol, PAYOFF:silhouette(p,{ascii}).text,
    RANGE:p.range ? `${p.range.lower}–${p.range.upper}` : "—",
    SPOT:p.spot.value === null ? "—" : spotPrice(p.spot.value),
    SPAN:spanTrack(p,{ascii,dteWidth}), "EXIT PROFIT":profitCell(p),
    "P/L":p.pnl === null ? "—" : dollars(displayedPnl(p)), QUOTE:rowAge(p), p }));
  const specs = [["SYMBOL",6],["PAYOFF",31],["RANGE",11],["SPOT",9],["SPAN",11+dteWidth+1],
    ["EXIT PROFIT",objectiveWidth+1+11+1+exitOptions.percentWidth],["P/L",9],["QUOTE",5]];
  const widths = Object.fromEntries(specs.map(([k,w])=>[k,Math.max(w,...rows.map(r=>cellWidth(mono(r[k]))))]));
  const gap = k => ["SPAN","EXIT PROFIT","P/L"].includes(k) ? "    " : k === "QUOTE" ? "   " : "  ";
  const size = keys => keys.reduce((n,k,i)=>n+widths[k]+(i ? gap(k).length : 0),0);
  let keys = specs.map(([k])=>k), compact=false;
  for(const k of ["PAYOFF","RANGE","SPOT"]) {
    if(size(keys)<=limit)break;
    keys=keys.filter(key=>key!==k);compact=true;
  }
  if(size(keys)>limit)return wrap(`Terminal too narrow: ${positions.length} positions not displayed; use --tsv.`,limit).join("\n")+"\n";
  const numeric = new Set(["SPOT","P/L","QUOTE"]);
  const join = values => values.map((v,i)=>(i ? gap(keys[i]) : "")+v).join("").trimEnd();
  const heading = `Account ${accountLabel}${compact ? " | narrow view" : ""}`;
  const header = join(keys.map(k=>k === "PAYOFF" ? pad(" ".repeat(Math.floor((widths[k]-6)/2))+k,widths[k]) : pad(k,widths[k],numeric.has(k))));
  const lines = [...wrap(heading,limit),header];
  for(const r of rows) {
    const p=r.p;
    lines.push(join(keys.map(k=>{
      const value=mono(r[k]);
      const code=k === "P/L" ? displayedPnl(p) === null || displayedPnl(p) === 0 ? null : displayedPnl(p)>0 ? "92" : "91" :
        k === "SPOT" ? ({up:"92",down:"91",unchanged:"97",unknown:"93"}[p.spot.movement] ?? "93") :
        k === "QUOTE" ? p.optionEvidence.stale || p.spot.stale || p.optionEvidence.retained || p.spot.retained ? "93" : null :
        value === mono("—") ? "37" : null;
      const decorated=k === "PAYOFF" ? silhouette(p,{ascii,color}).text : k === "EXIT PROFIT" ? profitCell(p,color) : ink(value,code);
      return pad(decorated,widths[k],numeric.has(k));
    })));
  }
  if(positions.length===0)lines.push("No live trades.");
  const output=lines.join("\n");
  return color ? `\n\x1b[97m${output}\x1b[0m\n` : `\n${output}\n`;
}
