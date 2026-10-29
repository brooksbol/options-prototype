/**
 * Options Market Liquidity — observed (PL-EVID-OBS v1 display-only experiment).
 *
 * One row per symbol with listed options, computed by `buildSymbolLiquidity`
 * from the published evidence snapshot under the operator's filter (DTE range,
 * option type, |Δ| band). Short-put vertical widths are discovered automatically
 * from the observed strikes (no width input). Display and sorting only:
 * no acquisition, no composite score, no trade selection, no influence on
 * posture, ranking, Production v0 or recommendations. Missing / not-current
 * evidence is shown as its own state and never ranked as illiquid.
 *
 * The table and CSV share one calculation path (the rows built here).
 * Selecting a row hands the symbol to the Cash Deployment symbol filter.
 */

import { useEffect, useMemo, useState } from "react";
import { loadWorkspace, updateWorkspace, type SymbolLiquidityControls } from "../workspace/workspace";
import {
  SYMBOL_LIQUIDITY_POLICY,
  SYMBOL_EVIDENCE_STATE_LABEL,
  DEFAULT_SYMBOL_LIQUIDITY_FILTER,
  buildSymbolLiquidity,
  validateSymbolLiquidityFilter,
  type OptionTypeFilter,
  type SnapshotSymbol,
  type SymbolLiquidityFilter,
  type SymbolLiquidityRow,
} from "../write-desk/symbol-liquidity";
import { useMultiColumnSort, type SortColumn } from "../write-desk/use-multi-column-sort";
import { downloadTableCsv, type CsvColumn } from "../write-desk/table-csv-export";
import { formatAcquisitionAge } from "../write-desk/evidence-provenance";
import { showCountInputValue, parseShowCountInput, applyShowCount, displayedCount } from "./showCountFilter";
import "../write-desk.css";
import "./iron-condors-table.css";
import "./symbol-liquidity-table.css";

const P = SYMBOL_LIQUIDITY_POLICY;
const D = DEFAULT_SYMBOL_LIQUIDITY_FILTER;
const DASH = "—";

const DEFAULT_SORT: SortColumn[] = [{ key: "medianSpreadPercent", dir: "asc" }];

const SORT_LABELS: Record<string, string> = {
  symbol: "Symbol",
  spotPrice: "Spot",
  state: "Evidence",
  medianSpreadPercent: "Med spread",
  medianAbsSpread: "Med $ spread",
  liquidSharePercent: "Liquid share",
  measuredContracts: "Contracts",
  measuredExpirations: "Expirations",
  quotedWidthCount: "Quoted widths",
  quotedPairsTotal: "Quoted pairs",
  bandOpenInterest: "OI",
  bandVolume: "Vol",
  oldestAcquiredAtMs: "Age",
};

const TYPE_LABEL: Record<OptionTypeFilter, string> = { all: "puts + calls", puts: "puts", calls: "calls" };

function scopeText(f: SymbolLiquidityFilter): string {
  return `${f.minDte}–${f.maxDte} DTE · |Δ| ${f.minAbsDelta.toFixed(2)}–${f.maxAbsDelta.toFixed(2)} ${TYPE_LABEL[f.optionType]} · liquid = contract grade L1–L${P.liquidMaxTier}`;
}

function isDefaultFilter(f: SymbolLiquidityFilter): boolean {
  return f.minDte === D.minDte && f.maxDte === D.maxDte && f.optionType === D.optionType &&
    f.minAbsDelta === D.minAbsDelta && f.maxAbsDelta === D.maxAbsDelta;
}

function age(ms: number | null, now: number): string {
  return ms == null ? DASH : formatAcquisitionAge({ kind: "chain-acquired", acquiredAtMs: ms }, now);
}

const money = (w: number) => `$${Number.isInteger(w) ? w : w.toFixed(2)}`;

function contractsTitle(r: SymbolLiquidityRow): string {
  return [
    `Measured (denominator): ${r.measuredContracts} = ${r.quotedContracts} quoted + ${r.zeroBidContracts} zero-bid (not liquid)`,
    `Liquid (L1–L${P.liquidMaxTier}): ${r.liquidContracts} · OI reported 0: ${r.zeroOiContracts} · OI unavailable (not graded): ${r.oiUnavailableContracts}`,
    `Excluded — invalid/missing quote: ${r.invalidQuoteContracts}; delta unavailable: ${r.unbandedContracts}`,
  ].join("\n");
}

function expirationsTitle(r: SymbolLiquidityRow): string {
  return [
    `Listed in DTE range: ${r.listedExpirations} · chains observed: ${r.observedChains} · listed but not observed: ${r.unobservedExpirations}`,
    `Admissible (backend verdict): ${r.admissibleChains} · not admissible: ${r.notAdmissibleChains} · no verdict: ${r.noVerdictChains}`,
    `Measured: ${r.measuredExpirations} · with ≥1 liquid contract: ${r.liquidExpirations}`,
  ].join("\n");
}

/** Widths listed in a tooltip before deferring to the CSV (wide chains can have hundreds). */
const TOOLTIP_MAX_WIDTHS = 40;
const NOT_EVALUATED = "Not evaluated (calls-only filter or no current evidence).";

function widthsTitle(r: SymbolLiquidityRow): string {
  if (r.quotedWidthCount == null) return NOT_EVALUATED;
  if (r.widths.length === 0) return "No short-put vertical discovered: no in-band short put with a listed lower strike.";
  const quoted = r.widths.filter((w) => w.quotedPairs > 0);
  const shown = quoted.slice(0, TOOLTIP_MAX_WIDTHS);
  const lines = [
    `Discovered short-put verticals: short put in |Δ| band; long put = any listed lower strike in the same chain, any delta.`,
    `${r.quotedWidthCount} of ${r.listedWidthCount} listed widths have ≥1 pair with both legs quoted.`,
    ...shown.map((w) => `${money(w.width)}: ${w.quotedPairs} quoted / ${w.listedPairs} listed · ${w.quotedExpirations} exp.`),
  ];
  if (quoted.length > shown.length) lines.push(`… ${quoted.length - shown.length} more quoted widths (see CSV).`);
  lines.push("Level 3 (executable vertical price) is NOT established by individual-leg quotes.");
  return lines.join("\n");
}

function widthsCell(r: SymbolLiquidityRow): string {
  if (r.quotedWidthCount == null) return DASH;
  if (r.quotedWidthCount === 0) return r.listedWidthCount === 0 ? "none listed" : "none quoted";
  const range = r.minQuotedWidth === r.maxQuotedWidth ? money(r.minQuotedWidth!) : `${money(r.minQuotedWidth!)}–${money(r.maxQuotedWidth!)}`;
  return `${r.quotedWidthCount} · ${range}`;
}

function pairsCell(r: SymbolLiquidityRow): string {
  if (r.quotedPairsTotal == null || r.listedPairsTotal == null) return DASH;
  return `${r.quotedPairsTotal.toLocaleString()}/${r.listedPairsTotal.toLocaleString()}`;
}

/** CSV detail: "width:quoted/listed" for every discovered width, space-separated. */
function widthDetail(r: SymbolLiquidityRow): string {
  return r.quotedWidthCount == null ? "" : r.widths.map((w) => `${w.width}:${w.quotedPairs}/${w.listedPairs}`).join(" ");
}

interface SymbolLiquidityTableProps {
  /** Published evidence snapshot `symbols[]` (computed under the active filter here). */
  symbols: SnapshotSymbol[];
  /** Hand the symbol to the Cash Deployment symbol filter. */
  onSelectSymbol?: (symbol: string) => void;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

export function SymbolLiquidityTable({ symbols, onSelectSymbol, collapsed, onToggleCollapse }: SymbolLiquidityTableProps) {
  // Controls are restored from the workspace so a browser refresh keeps the operator's view.
  // Filter inputs are kept as typed text so invalid entries can be shown and rejected explicitly.
  const [saved] = useState<SymbolLiquidityControls | null>(() => loadWorkspace().writeDeskSymbolLiquidityControls);
  const [symbolQuery, setSymbolQuery] = useState(saved?.symbol ?? "");
  const [measuredOnly, setMeasuredOnly] = useState(saved?.measuredOnly ?? false);
  const [showCount, setShowCount] = useState<number | null>(saved ? saved.showCount : 50);
  const [minDteText, setMinDteText] = useState(saved?.minDte ?? String(D.minDte));
  const [maxDteText, setMaxDteText] = useState(saved?.maxDte ?? String(D.maxDte));
  const [optionType, setOptionType] = useState<OptionTypeFilter>(saved?.optionType ?? D.optionType);
  const [minDeltaText, setMinDeltaText] = useState(saved?.minAbsDelta ?? D.minAbsDelta.toFixed(2));
  const [maxDeltaText, setMaxDeltaText] = useState(saved?.maxAbsDelta ?? D.maxAbsDelta.toFixed(2));
  const now = Date.now();

  useEffect(() => {
    updateWorkspace({
      writeDeskSymbolLiquidityControls: {
        minDte: minDteText, maxDte: maxDteText, optionType, minAbsDelta: minDeltaText, maxAbsDelta: maxDeltaText,
        symbol: symbolQuery, measuredOnly, showCount,
      },
    });
  }, [minDteText, maxDteText, optionType, minDeltaText, maxDeltaText, symbolQuery, measuredOnly, showCount]);

  const filter: SymbolLiquidityFilter = {
    minDte: minDteText.trim() === "" ? NaN : Number(minDteText),
    maxDte: maxDteText.trim() === "" ? NaN : Number(maxDteText),
    optionType,
    minAbsDelta: minDeltaText.trim() === "" ? NaN : Number(minDeltaText),
    maxAbsDelta: maxDeltaText.trim() === "" ? NaN : Number(maxDeltaText),
  };
  const errors = validateSymbolLiquidityFilter(filter);
  const valid = errors.length === 0;
  const filterKey = JSON.stringify(filter);

  // One calculation path for table + CSV; recomputed only when evidence or a valid filter changes.
  const summary = useMemo(
    () => (valid ? buildSymbolLiquidity(symbols, filter) : null),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [symbols, filterKey, valid],
  );

  const resetFilters = () => {
    setMinDteText(String(D.minDte)); setMaxDteText(String(D.maxDte)); setOptionType(D.optionType);
    setMinDeltaText(D.minAbsDelta.toFixed(2)); setMaxDeltaText(D.maxAbsDelta.toFixed(2));
  };

  const collapsible = typeof onToggleCollapse === "function";
  const isCollapsed = collapsible && collapsed === true;

  const rows = summary?.rows ?? [];
  const q = symbolQuery.trim().toUpperCase();
  const filtered = rows.filter((r) =>
    (q === "" || r.symbol.includes(q)) &&
    (!measuredOnly || r.state === "measured" || r.state === "thin-sample"),
  );

  const { sorted, handleSort, indicator, isDefaultOrder, columns } = useMultiColumnSort(filtered, DEFAULT_SORT, DEFAULT_SORT);
  const onSort = (key: string, e?: React.MouseEvent) => handleSort(key, { shiftKey: e?.shiftKey });
  const displayed = applyShowCount(sorted, showCount);

  const counts = rows.reduce<Record<string, number>>((acc, r) => { acc[r.state] = (acc[r.state] ?? 0) + 1; return acc; }, {});
  const measuredCount = (counts.measured ?? 0) + (counts["thin-sample"] ?? 0);
  const singleExpirationCount = rows.filter((r) => r.singleExpiration).length;

  const downloadCsv = () => {
    if (!summary) return;
    const f = summary.filter;
    const n = (v: number | null, d = 1) => (v == null ? "" : v.toFixed(d));
    const row = (r: Record<string, unknown>) => r as unknown as SymbolLiquidityRow;
    const widthCols: CsvColumn[] = [
      { key: "quotedWidthCount", label: "QuotedWidthCount", format: (r) => n(row(r).quotedWidthCount, 0) },
      { key: "minQuotedWidth", label: "MinQuotedWidth", format: (r) => n(row(r).minQuotedWidth, 2) },
      { key: "maxQuotedWidth", label: "MaxQuotedWidth", format: (r) => n(row(r).maxQuotedWidth, 2) },
      { key: "quotedPairsTotal", label: "QuotedPairs", format: (r) => n(row(r).quotedPairsTotal, 0) },
      { key: "listedWidthCount", label: "ListedWidthCount", format: (r) => n(row(r).listedWidthCount, 0) },
      { key: "listedPairsTotal", label: "ListedPairs", format: (r) => n(row(r).listedPairsTotal, 0) },
      { key: "widthDetail", label: "WidthQuotedListedPairs", format: (r) => widthDetail(row(r)) },
    ];
    downloadTableCsv(
      sorted as unknown as Record<string, unknown>[],
      [
        // Filter settings on every row (no CSV metadata mechanism exists).
        { key: "fMinDte", label: "FilterMinDTE", format: () => String(f.minDte) },
        { key: "fMaxDte", label: "FilterMaxDTE", format: () => String(f.maxDte) },
        { key: "fType", label: "FilterOptionType", format: () => f.optionType },
        { key: "fMinD", label: "FilterMinAbsDelta", format: () => String(f.minAbsDelta) },
        { key: "fMaxD", label: "FilterMaxAbsDelta", format: () => String(f.maxAbsDelta) },
        { key: "fW", label: "WidthDiscovery", format: () => (f.optionType === "calls" ? "not evaluated (calls)" : "all listed lower strikes; short put in |Δ| band") },
        { key: "symbol", label: "Symbol" },
        { key: "spotPrice", label: "Spot", format: (r) => n(r.spotPrice as number | null, 2) },
        { key: "state", label: "Evidence" },
        { key: "medianSpreadPercent", label: "MedianSpread%", format: (r) => n(r.medianSpreadPercent as number | null, 2) },
        { key: "medianAbsSpread", label: "MedianAbsSpreadPerShare", format: (r) => n(r.medianAbsSpread as number | null, 3) },
        { key: "liquidSharePercent", label: "LiquidShare%", format: (r) => n(r.liquidSharePercent as number | null, 1) },
        { key: "measuredContracts", label: "MeasuredContracts" },
        { key: "liquidContracts", label: "LiquidContracts" },
        { key: "zeroOiContracts", label: "ZeroOIContracts" },
        { key: "oiUnavailableContracts", label: "OIUnavailableContracts" },
        { key: "quotedContracts", label: "QuotedContracts" },
        { key: "zeroBidContracts", label: "ZeroBidContracts" },
        { key: "invalidQuoteContracts", label: "ExcludedInvalidQuote" },
        { key: "unbandedContracts", label: "ExcludedNoDelta" },
        { key: "listedExpirations", label: "ListedExpirations" },
        { key: "observedChains", label: "ObservedChains" },
        { key: "unobservedExpirations", label: "ListedNotObserved" },
        { key: "admissibleChains", label: "AdmissibleChains" },
        { key: "notAdmissibleChains", label: "NotAdmissibleChains" },
        { key: "noVerdictChains", label: "NoVerdictChains" },
        { key: "measuredExpirations", label: "MeasuredExpirations" },
        { key: "liquidExpirations", label: "LiquidExpirations" },
        { key: "singleExpiration", label: "SingleExpiration", format: (r) => (r.singleExpiration ? "yes" : "no") },
        ...widthCols,
        { key: "verticalLevel3", label: "ExecutableVerticalEstablished", format: () => "no" },
        { key: "bandOpenInterest", label: "OI", format: (r) => n(r.bandOpenInterest as number | null, 0) },
        { key: "bandVolume", label: "Volume", format: (r) => n(r.bandVolume as number | null, 0) },
        { key: "volumePartial", label: "VolumePartial", format: (r) => (r.bandVolume == null ? "" : r.volumePartial ? "partial" : "complete") },
        { key: "oldestAcquiredAtMs", label: "OldestChainAcquiredAt", format: (r) => (r.oldestAcquiredAtMs == null ? "" : new Date(r.oldestAcquiredAtMs as number).toISOString()) },
        { key: "newestAcquiredAtMs", label: "NewestChainAcquiredAt", format: (r) => (r.newestAcquiredAtMs == null ? "" : new Date(r.newestAcquiredAtMs as number).toISOString()) },
      ],
      `wheelwright-symbol-liquidity-${new Date().toISOString().slice(0, 10)}${isDefaultFilter(f) ? "" : `-${f.minDte}-${f.maxDte}dte-${f.optionType}`}.csv`,
    );
  };

  return (
    <section className="ic-card sl-card" aria-label="Options Market Liquidity — observed">
      <header className="ic-head">
        <h2 className="ic-title">
          {collapsible && (
            <button
              type="button"
              className="wd-collapse-toggle"
              onClick={onToggleCollapse}
              aria-expanded={!isCollapsed}
              aria-label={isCollapsed ? "Expand Options Market Liquidity section" : "Collapse Options Market Liquidity section"}
            >
              <span className={`wd-chevron${isCollapsed ? " wd-chevron-collapsed" : ""}`}>▾</span>
            </button>
          )}
          Options Market Liquidity — observed
        </h2>
        <p className="ic-subtitle">
          Experimental, observational. How liquid each symbol's <em>observed</em> options market is.
          Current evidence only (backend admissibility). Not a ranking of strategy usefulness, premium or opportunity count; no composite score;
          quoted widths are not executable vertical prices. Select a row to filter Cash Deployment to that symbol.
        </p>
        <div className="ic-meta sl-active-filter" aria-label="Active filter">
          Active filter: <strong>{valid ? scopeText(filter) : "invalid — see below"}</strong>
          {valid && !isDefaultFilter(filter) && <span className="wd-liquidity-limit"> (filtered)</span>}
        </div>
        {summary && (
          <div className="ic-meta">
            {measuredCount.toLocaleString()} measured ({(counts["thin-sample"] ?? 0).toLocaleString()} thin sample &lt; {P.thinSampleMinContracts} contracts
            {" "}· {singleExpirationCount.toLocaleString()} single expiration)
            {" "}· {(counts["insufficient-quotes"] ?? 0).toLocaleString()} insufficient quotes
            {" "}· {(counts["no-in-band"] ?? 0).toLocaleString()} no matching contracts
            {" "}· {(counts["not-current"] ?? 0).toLocaleString()} not current
            {" "}· {(counts["no-chains"] ?? 0).toLocaleString()} listed, not observed
            {" "}· {(counts["no-window-expirations"] ?? 0).toLocaleString()} no expiration in range
            {(counts.unresolved ?? 0) > 0 && <> · {(counts.unresolved ?? 0).toLocaleString()} not yet resolved</>}
            {" "}· {summary.absentSymbols.toLocaleString()} with no listed options (not shown)
          </div>
        )}
      </header>

      {isCollapsed ? null : (
      <>
      <div className="wd-table-controls ic-controls sl-filter-row" aria-label="Evidence filters">
        <label className="wd-control">
          DTE
          <input type="number" value={minDteText} aria-label="Min DTE" onChange={(e) => setMinDteText(e.target.value)} className="wd-control-spinner" min={P.coverageMinDte} max={P.coverageMaxDte} />
        </label>
        <label className="wd-control">
          –
          <input type="number" value={maxDteText} aria-label="Max DTE" onChange={(e) => setMaxDteText(e.target.value)} className="wd-control-spinner" min={P.coverageMinDte} max={P.coverageMaxDte} />
        </label>
        <label className="wd-control">
          Type
          <select value={optionType} aria-label="Option type" onChange={(e) => setOptionType(e.target.value as OptionTypeFilter)} className="wd-control-text">
            <option value="all">All</option>
            <option value="puts">Puts</option>
            <option value="calls">Calls</option>
          </select>
        </label>
        <label className="wd-control" title="Absolute delta: puts carry negative delta; |Δ| is compared. Missing delta is excluded, never treated as zero.">
          |Δ|
          <input type="number" step="0.05" value={minDeltaText} aria-label="Min absolute delta" onChange={(e) => setMinDeltaText(e.target.value)} className="wd-control-spinner" />
        </label>
        <label className="wd-control">
          –
          <input type="number" step="0.05" value={maxDeltaText} aria-label="Max absolute delta" onChange={(e) => setMaxDeltaText(e.target.value)} className="wd-control-spinner" />
        </label>
        <button type="button" className="wd-sort-reset" onClick={resetFilters} disabled={valid && isDefaultFilter(filter)} title={`Reset to ${scopeText(D)}`}>Reset filters</button>
      </div>
      {!valid && (
        <div className="wd-sort-notice sl-filter-errors" role="alert">
          Filter not applied: {errors.join(" ")}
        </div>
      )}

      <div className="wd-table-controls ic-controls">
        <label className="wd-control">
          Symbol
          <input
            type="text"
            value={symbolQuery}
            placeholder="e.g. SPY"
            aria-label="Filter symbols"
            onChange={(e) => setSymbolQuery(e.target.value)}
            className="wd-control-text"
            style={{ width: "72px" }}
          />
        </label>
        <label className="wd-control" style={{ cursor: "pointer" }}>
          <input type="checkbox" checked={measuredOnly} onChange={() => setMeasuredOnly(!measuredOnly)} style={{ marginRight: "4px" }} />
          Measured only
        </label>
        <label className="wd-control">
          Show
          <input
            type="text"
            inputMode="numeric"
            value={showCountInputValue(showCount)}
            onChange={(e) => setShowCount(parseShowCountInput(e.target.value, sorted.length || 50))}
            className="wd-control-spinner"
            title="Rows to show. '-' = all"
            aria-label="Rows to show"
          />
        </label>
        <span className="wd-table-showing">Showing {displayedCount(sorted.length, showCount)} of {sorted.length}</span>
        <button type="button" className="wd-download-btn" onClick={downloadCsv} disabled={!summary} title={summary ? "Download as CSV (filtered rows and active filter settings)" : "Fix the filter to export"}>⬇ CSV</button>
      </div>

      {!isDefaultOrder && (
        <div className="wd-sort-notice">
          Sorted by: <strong>{columns.map((c) => SORT_LABELS[c.key] ?? c.key).join(" → ")}</strong>
          {" · "}
          <button className="wd-sort-reset" onClick={() => onSort("medianSpreadPercent")}>Reset to median spread</button>
          {columns.length < 3 && <span className="wd-sort-hint"> (shift+click a header for secondary sort)</span>}
        </div>
      )}

      <div className="ic-scroll sl-scroll">
        <table className="ic-table sl-table">
          <thead>
            <tr>
              <th scope="col" className="ic-col-symbol wd-sortable" onClick={(e) => onSort("symbol", e)}>Symbol{indicator("symbol")}</th>
              <th scope="col" className="ic-col-num wd-sortable" onClick={(e) => onSort("spotPrice", e)} title="Underlying spot price carried on the most recently acquired admissible chain. '—' when no current chain carries a price.">Spot{indicator("spotPrice")}</th>
              <th scope="col" className="wd-sortable" onClick={(e) => onSort("state", e)} title={`Evidence state under the active filter. Measured / Thin sample (fewer than ${P.thinSampleMinContracts} measured contracts) carry liquidity measures; missing, unobserved or not-current evidence is never treated as illiquid.`}>Evidence{indicator("state")}</th>
              <th scope="col" className="ic-col-num wd-sortable" onClick={(e) => onSort("medianSpreadPercent", e)} title="Median bid/ask spread as % of mid over QUOTED matching contracts from admissible chains. Zero-bid contracts contribute no spread.">Med spread{indicator("medianSpreadPercent")}</th>
              <th scope="col" className="ic-col-num wd-sortable" onClick={(e) => onSort("medianAbsSpread", e)} title="Median absolute quote spread (ask − bid) PER SHARE over QUOTED matching contracts. ×100 for one contract. Not a vertical's round-trip cost.">Med $ spread{indicator("medianAbsSpread")}</th>
              <th scope="col" className="ic-col-num wd-sortable" onClick={(e) => onSort("liquidSharePercent", e)} title={`Share of measured matching contracts graded L1–L${P.liquidMaxTier} by the v1 contract grade (needs spread ≤ 10% AND open interest ≥ 250). Denominator = measured contracts with observed OI (zero-bid counts as not liquid). A reported OI of 0 grades L4 even with a tight spread — common for newly listed expirations.`}>Liquid share{indicator("liquidSharePercent")}</th>
              <th scope="col" className="ic-col-num wd-sortable" onClick={(e) => onSort("measuredContracts", e)} title="Measured matching contracts (the liquid-share denominator). Hover a cell for the breakdown and exclusions.">Contracts{indicator("measuredContracts")}</th>
              <th scope="col" className="ic-col-num wd-sortable" onClick={(e) => onSort("measuredExpirations", e)} title="Measured / listed expirations in the DTE range (expirations with ≥1 liquid contract). Hover for listed-not-observed and admissibility.">Expirations{indicator("measuredExpirations")}</th>
              <th scope="col" className="ic-col-num wd-sortable" onClick={(e) => onSort("quotedWidthCount", e)} title="Discovered short-put vertical widths with ≥1 pair quoted on BOTH legs: count · narrowest–widest. Short put in the |Δ| band; long put = any listed lower strike in the same chain, any delta. Hover for per-width counts. Not executable vertical prices.">Quoted widths{indicator("quotedWidthCount")}</th>
              <th scope="col" className="ic-col-num wd-sortable" onClick={(e) => onSort("quotedPairsTotal", e)} title="Short-put vertical pairs across all discovered widths: both legs quoted / listed. Not executable vertical prices.">Quoted pairs{indicator("quotedPairsTotal")}</th>
              <th scope="col" className="ic-col-num wd-sortable" onClick={(e) => onSort("bandOpenInterest", e)} title="Σ provider-reported open interest over measured matching contracts (prior-day OCC figure; a newly listed expiration reports 0 until its first overnight update). Hover Contracts for zero vs unavailable counts.">OI{indicator("bandOpenInterest")}</th>
              <th scope="col" className="ic-col-num wd-sortable" onClick={(e) => onSort("bandVolume", e)} title="Σ current-session volume over measured matching contracts from admissible chains. 'partial' = fewer admissible chains than listed expirations.">Vol{indicator("bandVolume")}</th>
              <th scope="col" className="ic-col-num wd-sortable" onClick={(e) => onSort("oldestAcquiredAtMs", e)} title="Chain acquisition age across admissible chains: newest–oldest.">Age{indicator("oldestAcquiredAtMs")}</th>
            </tr>
          </thead>
          <tbody>
            {displayed.map((r) => {
              const measured = r.state === "measured" || r.state === "thin-sample";
              const select = () => onSelectSymbol?.(r.symbol);
              return (
                <tr
                  key={r.symbol}
                  className={onSelectSymbol ? "wd-posture-row" : undefined}
                  onClick={onSelectSymbol ? select : undefined}
                  tabIndex={onSelectSymbol ? 0 : undefined}
                  onKeyDown={onSelectSymbol ? (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); select(); } } : undefined}
                  title={onSelectSymbol ? `Filter Cash Deployment to ${r.symbol}` : undefined}
                >
                  <td className="ic-col-symbol">{r.symbol}</td>
                  <td className="ic-col-num">{r.spotPrice == null ? DASH : `$${r.spotPrice.toFixed(2)}`}</td>
                  <td className={r.state === "thin-sample" ? "wd-warn-value" : measured ? "" : "ic-placeholder"}>{SYMBOL_EVIDENCE_STATE_LABEL[r.state]}</td>
                  <td className="ic-col-num">{r.medianSpreadPercent == null ? DASH : `${r.medianSpreadPercent.toFixed(1)}%`}</td>
                  <td className="ic-col-num">{r.medianAbsSpread == null ? DASH : `$${r.medianAbsSpread.toFixed(2)}`}</td>
                  <td className="ic-col-num">{r.liquidSharePercent == null ? DASH : `${r.liquidSharePercent.toFixed(0)}%`}</td>
                  <td className="ic-col-num" title={contractsTitle(r)}>{measured ? r.measuredContracts.toLocaleString() : DASH}</td>
                  <td className="ic-col-num" title={expirationsTitle(r)}>
                    {r.listedExpirations === 0 ? DASH : `${r.measuredExpirations}/${r.listedExpirations} (${r.liquidExpirations})`}
                    {r.singleExpiration && <span className="wd-liquidity-limit"> single</span>}
                  </td>
                  <td className="ic-col-num" title={widthsTitle(r)}>{widthsCell(r)}</td>
                  <td className="ic-col-num" title={widthsTitle(r)}>{pairsCell(r)}</td>
                  <td className="ic-col-num">{r.bandOpenInterest == null ? DASH : r.bandOpenInterest.toLocaleString()}</td>
                  <td className="ic-col-num">
                    {r.bandVolume == null ? DASH : r.bandVolume.toLocaleString()}
                    {r.bandVolume != null && r.volumePartial && <span className="wd-liquidity-limit"> partial</span>}
                  </td>
                  <td className="ic-col-num">
                    {(() => {
                      if (r.oldestAcquiredAtMs == null) return DASH;
                      const oldest = age(r.oldestAcquiredAtMs, now);
                      const newest = age(r.newestAcquiredAtMs, now);
                      return oldest === newest ? oldest : `${newest}–${oldest}`;
                    })()}
                  </td>
                </tr>
              );
            })}
            {displayed.length === 0 && (
              <tr>
                <td className="ic-empty" colSpan={13}>
                  {!valid ? "Filter not applied — fix the filter above." : rows.length === 0 ? "No observed symbols in the evidence snapshot." : "No symbols match the current symbol/measured filters."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      </>
      )}
    </section>
  );
}
