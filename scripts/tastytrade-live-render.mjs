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
const price = (v) => v.toFixed(3).replace(/0$/, "");
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
export function renderPanel({ accountLabel, positions }, { color = false, columns = 157, ascii = false } = {}) {
  const limit = Number.isInteger(columns) && columns > 1 ? columns - 1 : 156;
  const mono = (s) => ascii ? s.replaceAll("—", "--").replaceAll("−", "-") : s;
  const ink = (s, code) => color && code ? `\x1b[${code}m${s}\x1b[37m` : s;
  const rows = positions.map((p) => ({
    SYMBOL: p.symbol, PAYOFF: silhouette(p, { ascii }).text, EXP: new Set(positions.map(p => p.expiry.slice(0,4))).size > 1 ? p.expiry.slice(0,10) : p.expiry.slice(5, 10).replace("-", "/"), QTY: String(p.quantity),
    DTE: String(p.dte), EXIT: `${p.p50 ? "P50" : "LIMIT"}:${p.transition ? "T" : "B"}`,
    OPEN: price(p.credit), NOW: p.market.stale ? "—" : price(p.market.closeDebit), TARGET: price(p.target),
    "P/L": p.pnl === null ? "—" : dollars(p.pnl),
    PROG: p.progress === null ? "—" : `${p.progress >= 0 ? "+" : "−"}${Math.round(Math.abs(p.progress) * 100)}%${p.progress >= 1 - 1e-8 ? "~" : ""}`,
    SPOT: p.spot.value === null ? "—" : `${spotPrice(p.spot.value)}${p.spot.stale ? "!" : ""}`,
    QUOTE: `O:${p.optionEvidence.label} S:${p.spot.label}`, p,
  }));
  const specs = [["SYMBOL",8],["PAYOFF",31],["EXP",5],["QTY",3],["DTE",3],["EXIT",15],
    ["OPEN",6],["NOW",6],["TARGET",6],["P/L",9],["PROG",7],["SPOT",9],["QUOTE",20]];
  const widths = Object.fromEntries(specs.map(([k,w]) => [k,Math.max(w,...rows.map((r) => cellWidth(mono(r[k]))))]));
  const size = (keys) => keys.reduce((n,k) => n + widths[k], 0) + (keys.length - 1) * 2;
  let keys = specs.map(([k]) => k);
  let compact = false;
  for (const k of ["PAYOFF", "OPEN", "TARGET", "SPOT"]) {
    if (size(keys) <= limit) break;
    keys = keys.filter((key) => key !== k); compact = true;
  }
  if (size(keys) > limit) return wrap(`Terminal too narrow: ${positions.length} positions not displayed; use --tsv.`, limit).join("\n") + "\n";
  const numeric = new Set(["QTY","DTE","OPEN","NOW","TARGET","P/L","PROG","SPOT"]);
  const years = [...new Set(positions.map(p => p.expiry.slice(0,4)))];
  const heading = `Account ${accountLabel}${years.length === 1 ? ` | EXP ${years[0]}` : ""}${compact ? " | narrow view" : ""}`;
  const header = keys.map((k) => k === "PAYOFF" ? pad(" ".repeat(Math.floor((widths[k] - 6)/2)) + k, widths[k]) :
    pad(k,widths[k],numeric.has(k))).join("  ").trimEnd();
  const lines = [...wrap(heading,limit), header];
  for (const r of rows) {
    const p = r.p;
    lines.push(keys.map((k) => {
      const value = mono(r[k]);
      const code = k === "P/L" || k === "PROG" ? p.pnl === null || p.pnl === 0 ? null : p.pnl > 0 ? "32" : "31" :
        k === "SPOT" ? p.spot.stale ? p.spot.value === null ? "90" : "33" : "96" :
        k === "QUOTE" ? p.optionEvidence.stale || p.spot.stale || p.optionEvidence.retained || p.spot.retained ? "33" : null :
        k === "EXIT" && p.transition ? "33" : value === mono("—") ? "90" : null;
      const decorated = k === "PAYOFF" ? silhouette(p, { ascii, color }).text : ink(value,code);
      return pad(decorated,widths[k],numeric.has(k));
    }).join("  ").trimEnd());
  }
  lines.push(...wrap("PAYOFF: expiration shape, not current P/L; = unequal wings; [compressed] unresolved at this width; [?terms] unverified.",limit));
  lines.push(...wrap("OPEN/NOW/TARGET: credit/closing debit per unit; P/L gross, leg-mid estimate. SPOT: tastytrade equity mid.",limit));
  lines.push(...wrap("B: broker limit; T: exit transition (tt positions); ~: mid at/below target, still held. O/S: options/spot; r: retained session; !: stale.",limit));
  if (positions.length === 0) lines.push("No live trades.");
  const output = lines.join("\n");
  return color ? `\n\x1b[37m${output}\x1b[0m\n` : `\n${output}\n`;
}
