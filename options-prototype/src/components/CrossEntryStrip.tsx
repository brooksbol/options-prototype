/**
 * Cross-Entry Cash Deployment Strip
 *
 * Compact cross-entry surface showing top candidates from both CSP and Buy-Write,
 * ranked by Production v0 (experimental monthly production rate).
 *
 * This is an operational experiment, not ratified recommendation policy.
 * The score is an explicit hypothesis for falsification during live operation.
 *
 * Clicking a row opens the strategy-specific drawer for full explanation.
 * Column headers are sortable — operator can re-sort by any dimension for comparison.
 */

import { useMemo, useState, useCallback, useEffect } from "react";
import { buildCrossEntryRows, type CrossEntryRow } from "../write-desk/production-v0";
import { observeOpeningSetHydration } from "../write-desk/opening-set-observation";
import type { PutCandidate } from "../write-desk/candidate-types";
import type { BuyWriteCandidate } from "../write-desk/recommend-buy-writes";
import type { RecommendationPolicy } from "../write-desk/recommend";
import { loadWorkspace, updateWorkspace } from "../workspace/workspace";
import { showCountInputValue, parseShowCountInput, applyShowCount, displayedCount } from "./showCountFilter";
import { useMultiColumnSort, type SortDir } from "../write-desk/use-multi-column-sort";
import { downloadTableCsv, RAW_GREEK_IV_COLUMNS, MARKET_METRICS_COLUMNS } from "../write-desk/table-csv-export";
import { sanitizeGreeks, formatGreek, type RawExportGreeks } from "../write-desk/option-greeks";
import type { MarketMetrics } from "../write-desk/market-metrics";
import { AgeCell } from "../write-desk/AgeCell";
import { formatAcquisitionAge, type EvidenceProvenance } from "../write-desk/evidence-provenance";
import { CrossEntryRefreshButton } from "../write-desk/CrossEntryRefreshButton";
import { RowRefreshButton } from "../write-desk/RowRefreshButton";
import { selectRefreshTopSymbols, REFRESH_TOP_N } from "../write-desk/refresh-top-symbols";
import { describeLiquidity, LIQUIDITY_GRADE_POLICY, type LiquidityGrade } from "../write-desk/liquidity-grade";

// Liquidity header tooltip: states the provisional rule so the operator can see
// exactly what the grade means without reading code.
const LIQUIDITY_HEADER_TITLE = [
  `Contract liquidity grade (${LIQUIDITY_GRADE_POLICY.version}; provisional cutoffs). Weakest link: the worse of spread % and open interest.`,
  ...LIQUIDITY_GRADE_POLICY.tiers.map((t) => `L${t.tier} ${t.name}: spread ≤ ${t.maxSpreadPercent}% and OI ≥ ${t.minOpenInterest.toLocaleString()}`),
  "L4 Illiquid: anything worse.",
  "Sort: by grade only. Shift-click another column (e.g. OI, Spread, Yield) to order rows within each grade.",
  "Volume is not graded (resets each session).",
  "Buy-Write: option leg only; the stock-purchase spread is not included.",
  "Display and sorting only — does not affect posture, ranking or Prod v0.",
].join("\n");

const LIMITED_BY_SHORT: Record<NonNullable<LiquidityGrade["limitedBy"]>, string> = {
  spread: "spread",
  openInterest: "OI",
  both: "both",
};

// --- Sortable Table (delegates to shared multi-column hook) ---

function useCrossEntrySortable<T extends CrossEntryRow>(items: T[], defaultKey: string = "productionV0", defaultDir: SortDir = "desc", onSortChange?: (key: string, dir: SortDir) => void) {
  const { sorted, handleSort: multiHandleSort, indicator, isDefaultOrder, primaryKey } = useMultiColumnSort(
    items,
    [{ key: defaultKey, dir: defaultDir }],
    [{ key: defaultKey, dir: defaultDir }],
    onSortChange ? (cols) => onSortChange(cols[0]?.key ?? defaultKey, cols[0]?.dir ?? defaultDir) : undefined,
  );

  const handleSort = useCallback((key: string, event?: React.MouseEvent) => {
    multiHandleSort(key, { shiftKey: event?.shiftKey });
  }, [multiHandleSort]);

  return { sorted, handleSort, indicator, isDefaultOrder, sortKey: primaryKey };
}

// --- Component ---

interface CrossEntryStripProps {
  putCandidates: PutCandidate[];
  buyWriteCandidates: BuyWriteCandidate[];
  policy: RecommendationPolicy;
  onSelectPut: (candidate: PutCandidate) => void;
  onSelectBuyWrite: (candidate: BuyWriteCandidate) => void;
  /**
   * Re-read this surface's OWN authoritative evidence path (WriteDesk snapshot poll) and
   * recompute. Called after a targeted PL-OPS-09 re-observation completes (by the bulk
   * "Refresh top opportunities" control and by per-row refresh). Optional — when absent, the
   * refresh affordances are not shown.
   */
  onRefreshTopOpportunities?: () => void;
}

// Curated visible Greek/IV evidence columns (presentation semantics), resolved
// from the cross-entry row's originating candidate (CrossEntryRow references
// originalPut / originalBuyWrite). Presentation semantics: exact-zero/absence →
// "—" (the raw values are preserved in the CSV, not here). Rho and
// greeksUpdatedAt are deliberately CSV-only.
// IV Rank (tastytrade /market-metrics) is colocated with the other volatility
// metrics (right of Mid IV / SMV), sortable per the table's handler. INTERIM v1,
// observational only; resolved from the row's originating candidate.
function crossEntryGreekIvHeaders(
  handleSort: (key: string, e?: React.MouseEvent) => void,
  indicator: (key: string) => string,
) {
  return (
    <>
      <th className="wd-greek-head wd-greek-first" title="Gamma (Δ change per $1 underlying move)">Γ</th>
      <th className="wd-greek-head" title="Theta (option value change per calendar day)">Θ</th>
      <th className="wd-greek-head" title="Vega (value change per 1 IV point)">Vega</th>
      <th className="wd-greek-head wd-greek-iv" title="Mid IV — Tradier midpoint-derived implied volatility">Mid IV</th>
      <th className="wd-greek-head wd-greek-iv" title="SMV — ORATS smoothed/surface volatility">SMV</th>
      <th className="wd-greek-head wd-greek-iv wd-greek-last wd-sortable" onClick={(e) => handleSort("ivRank", e)} title="Underlying IV Rank (tastytrade /market-metrics), 0–100. Observational only — not a recommendation input. '—' when not served.">IV Rank{indicator("ivRank")}</th>
    </>
  );
}

function crossEntryPresentIv(v: number | null | undefined): string {
  return v != null && Number.isFinite(v) && v !== 0 ? v.toFixed(4) : "—";
}

function crossEntryIvRank(metrics?: MarketMetrics): string {
  const v = metrics?.ivRank;
  return v != null && Number.isFinite(v) ? (v * 100).toFixed(1) : "—";
}

function crossEntryIvRankTitle(metrics?: MarketMetrics): string {
  return metrics
    ? [
        metrics.ivRankSource ? `source: ${metrics.ivRankSource}` : null,
        metrics.ivUpdatedAt ? `as of ${metrics.ivUpdatedAt}` : null,
      ].filter(Boolean).join(" · ") || "IV Rank (tastytrade market-metrics)"
    : "IV Rank not served for this underlying";
}

function CrossEntryGreekIvCells({ greeks, metrics }: { greeks?: RawExportGreeks; metrics?: MarketMetrics }) {
  const g = sanitizeGreeks(greeks ?? {});
  return (
    <>
      <td className="wd-greek-cell wd-greek-first">{formatGreek(g.gamma)}</td>
      <td className="wd-greek-cell">{formatGreek(g.theta)}</td>
      <td className="wd-greek-cell">{formatGreek(g.vega)}</td>
      <td className="wd-greek-cell wd-greek-iv">{crossEntryPresentIv(greeks?.midIv)}</td>
      <td className="wd-greek-cell wd-greek-iv">{crossEntryPresentIv(greeks?.smvVol)}</td>
      <td className="wd-greek-cell wd-greek-iv wd-greek-last wd-ivrank-cell" title={crossEntryIvRankTitle(metrics)}>{crossEntryIvRank(metrics)}</td>
    </>
  );
}

export function CrossEntryStrip({
  putCandidates,
  buyWriteCandidates,
  onSelectPut,
  onSelectBuyWrite,
  onRefreshTopOpportunities,
}: CrossEntryStripProps) {
  // Full eligible population (composition + eligibility filtering, no display cap).
  // INTERIM v1: attach observational IV Rank (tastytrade /market-metrics) from each
  // row's originating candidate so it colocates with the volatility block, sorts via
  // the shared `ivRank` key, and exports. Never a recommendation input.
  const allRows = useMemo(
    () => buildCrossEntryRows(putCandidates, buyWriteCandidates).map((r) => ({
      ...r,
      marketMetrics: (r.originalPut ?? r.originalBuyWrite)?.marketMetrics,
    })),
    [putCandidates, buyWriteCandidates]
  );

  // Opening-set experiment observation (lightweight, no feedback into logic)
  useEffect(() => {
    if (allRows.length > 0) {
      const symbols = new Set(allRows.map(r => r.symbol));
      observeOpeningSetHydration(symbols, allRows.length);
    }
  }, [allRows]);

  // Sort by active column (operator-controlled), THEN cap for display
  const ws = loadWorkspace();
  const { sorted, handleSort, indicator, isDefaultOrder, sortKey } = useCrossEntrySortable(
    allRows, ws.writeDeskCrossEntrySortKey, ws.writeDeskCrossEntrySortDir as SortDir,
    (key, dir) => updateWorkspace({ writeDeskCrossEntrySortKey: key, writeDeskCrossEntrySortDir: dir }),
  );
  const [affordableOnly, setAffordableOnly] = useState(() => loadWorkspace().writeDeskCrossEntryAffordableOnly);
  const [showCount, setShowCount] = useState<number | null>(() => loadWorkspace().writeDeskCrossEntryShowCount);
  const [dteMin, setDteMin] = useState<number | null>(() => loadWorkspace().writeDeskCrossEntryDteMin);
  const [dteMax, setDteMax] = useState<number | null>(() => loadWorkspace().writeDeskCrossEntryDteMax);
  const [symbolFilter, setSymbolFilter] = useState<string>(() => loadWorkspace().writeDeskCrossEntrySymbol);
  const [capitalMin, setCapitalMin] = useState<number | null>(() => loadWorkspace().writeDeskCrossEntryCapitalMin);
  const [capitalMax, setCapitalMax] = useState<number | null>(() => loadWorkspace().writeDeskCrossEntryCapitalMax);
  const symbolTerms = useMemo(
    () => symbolFilter.split(/[\s,]+/).map(t => t.trim().toUpperCase()).filter(Boolean),
    [symbolFilter]
  );
  const filtered = sorted.filter(r =>
    (!affordableOnly || r.cashRemaining >= 0) &&
    (dteMin == null || r.dte >= dteMin) &&
    (dteMax == null || r.dte <= dteMax) &&
    (capitalMin == null || r.capitalRequired >= capitalMin) &&
    (capitalMax == null || r.capitalRequired <= capitalMax) &&
    (symbolTerms.length === 0 || symbolTerms.some(t => r.symbol.toUpperCase().includes(t)))
  );
  const displayed = applyShowCount(filtered, showCount);

  // "Top opportunities" refresh scope (PL-OPS-09 consumer): the first N rows UNDER THE CURRENT
  // SORT/ORDER (`filtered` already reflects the active column sort + filters), deduped to unique
  // underlying symbols, hard-capped at N. This is display-relative — "the opportunities at the
  // head of the view the operator is using" — never a claim of canonical/best ranking.
  const refreshTopSymbols = selectRefreshTopSymbols(filtered, REFRESH_TOP_N);

  // Live symbol → current chain-acquisition provenance for the displayed rows, so the bulk
  // refresh control can detect VISIBLE-STATE convergence (rows actually showing newer evidence)
  // rather than claiming success at request return. Rebuilt each recompute; when multiple rows
  // share a symbol, the freshest provenance wins.
  const provenanceBySymbol = new Map<string, EvidenceProvenance | null | undefined>();
  for (const r of filtered) {
    const sym = r.symbol.toUpperCase();
    const existing = provenanceBySymbol.get(sym);
    const ex = existing && existing.kind === "chain-acquired" ? existing.acquiredAtMs : -1;
    const cur = r.evidenceProvenance && r.evidenceProvenance.kind === "chain-acquired" ? r.evidenceProvenance.acquiredAtMs : -1;
    if (!provenanceBySymbol.has(sym) || cur > ex) provenanceBySymbol.set(sym, r.evidenceProvenance);
  }

  if (allRows.length === 0) return null;

  return (
    <section className="wd-cross-entry">
      <div className="wd-cross-entry-header">
        <h3 className="wd-cross-entry-title">Cash Deployment — Experimental Prod v0</h3>
        <span className="wd-cross-entry-note">
          Experimental cross-entry lens. Includes Buy-Write conditional appreciation; not a validated "best deployment" ranking.
        </span>
        <label style={{ fontSize: "11px", marginLeft: "8px", cursor: "pointer", color: "#aaa" }}>
          <input type="checkbox" checked={affordableOnly} onChange={() => { const next = !affordableOnly; setAffordableOnly(next); updateWorkspace({ writeDeskCrossEntryAffordableOnly: next }); }} style={{ marginRight: "4px" }} />
          Affordable only
        </label>
        <label className="wd-control" style={{ marginLeft: "8px" }}>
          Symbol
          <input
            type="text"
            value={symbolFilter}
            placeholder="e.g. SPY, QQQ"
            onChange={(e) => {
              const next = e.target.value;
              setSymbolFilter(next);
              updateWorkspace({ writeDeskCrossEntrySymbol: next });
            }}
            className="wd-control-text"
            style={{ width: "96px" }}
          />
          {symbolFilter && (
            <button
              type="button"
              className="wd-sort-reset"
              style={{ marginLeft: "4px" }}
              onClick={() => { setSymbolFilter(""); updateWorkspace({ writeDeskCrossEntrySymbol: "" }); }}
              title="Clear symbol filter"
            >
              ✕
            </button>
          )}
        </label>
        <label className="wd-control" style={{ marginLeft: "8px" }}>
          DTE min
          <input
            type="number"
            min={0}
            value={dteMin ?? ""}
            placeholder="—"
            onChange={(e) => {
              const raw = e.target.value.trim();
              const next = raw === "" ? null : Math.max(0, parseInt(raw, 10) || 0);
              setDteMin(next);
              updateWorkspace({ writeDeskCrossEntryDteMin: next });
            }}
            className="wd-control-spinner"
          />
        </label>
        <label className="wd-control" style={{ marginLeft: "8px" }}>
          DTE max
          <input
            type="number"
            min={0}
            value={dteMax ?? ""}
            placeholder="—"
            onChange={(e) => {
              const raw = e.target.value.trim();
              const next = raw === "" ? null : Math.max(0, parseInt(raw, 10) || 0);
              setDteMax(next);
              updateWorkspace({ writeDeskCrossEntryDteMax: next });
            }}
            className="wd-control-spinner"
          />
        </label>
        <label className="wd-control" style={{ marginLeft: "8px" }}>
          Capital min
          <input
            type="number"
            min={0}
            step={100}
            value={capitalMin ?? ""}
            placeholder="—"
            onChange={(e) => {
              const raw = e.target.value.trim();
              const next = raw === "" ? null : Math.max(0, parseFloat(raw) || 0);
              setCapitalMin(next);
              updateWorkspace({ writeDeskCrossEntryCapitalMin: next });
            }}
            className="wd-control-spinner"
          />
        </label>
        <label className="wd-control" style={{ marginLeft: "8px" }}>
          Capital max
          <input
            type="number"
            min={0}
            step={100}
            value={capitalMax ?? ""}
            placeholder="—"
            onChange={(e) => {
              const raw = e.target.value.trim();
              const next = raw === "" ? null : Math.max(0, parseFloat(raw) || 0);
              setCapitalMax(next);
              updateWorkspace({ writeDeskCrossEntryCapitalMax: next });
            }}
            className="wd-control-spinner"
          />
        </label>
        <label className="wd-control" style={{ marginLeft: "8px" }}>
          Show
          <input type="text" inputMode="numeric" value={showCountInputValue(showCount)} onChange={(e) => { const v = parseShowCountInput(e.target.value, filtered.length || 50); setShowCount(v); updateWorkspace({ writeDeskCrossEntryShowCount: v }); }} className="wd-control-spinner" title="Rows to show. '-' = all" />
        </label>
        <span className="wd-table-showing" style={{ marginLeft: "8px" }}>Showing {displayedCount(filtered.length, showCount)} of {filtered.length}</span>
        <button className="wd-download-btn" onClick={() => { const csvNow = Date.now();
          downloadTableCsv(
            filtered as unknown as Record<string, unknown>[],
            [
              { key: "entryMechanism", label: "Entry" }, { key: "symbol", label: "Symbol" },
              { key: "productionV0", label: "Prod v0" }, { key: "premiumYieldAnnualized", label: "Yield%" },
              { key: "dte", label: "DTE" }, { key: "spot", label: "Spot" }, { key: "strike", label: "Strike" },
              { key: "appreciationToStrikeDollars", label: "ApprToStrike$" }, { key: "appreciationToStrikePct", label: "ApprToStrike%" }, { key: "delta", label: "Delta" },
              { key: "bid", label: "Bid" }, { key: "mid", label: "Mid" }, { key: "ask", label: "Ask" },
              { key: "liquidity", label: "Liquidity", format: (r) => (r.liquidity as LiquidityGrade | null)?.label ?? "" },
              { key: "liquidityLimitedBy", label: "LiqLimitedBy", format: (r) => (r.liquidity as LiquidityGrade | null)?.limitedBy ?? "" },
              { key: "spreadPercent", label: "Spread%" }, { key: "openInterest", label: "OI" }, { key: "volume", label: "Volume" },
              { key: "capitalRequired", label: "Capital" }, { key: "cashRemaining", label: "Remaining" },
              { key: "executionScore", label: "Exec" }, { key: "posture", label: "Posture" },
              { key: "age", label: "Age", format: (r) => formatAcquisitionAge(r.evidenceProvenance as EvidenceProvenance | undefined, csvNow) },
              // PL-DEPLOY-EXPORT: raw greek/IV columns resolved from the originating
              // candidate (CrossEntryRow references originalPut/originalBuyWrite). Same
              // raw-preservation semantics; distinct midIv/smvVol; verbatim timestamp.
              ...RAW_GREEK_IV_COLUMNS.map((col) => ({
                ...col,
                format: (r: Record<string, unknown>) => {
                  const orig = (r.originalPut ?? r.originalBuyWrite) as Record<string, unknown> | null;
                  return orig && col.format ? col.format(orig) : "";
                },
              })),
              // INTERIM v1 per-underlying volatility metrics (tastytrade). The row
              // carries `marketMetrics` (attached from the originating candidate), so
              // these columns read it directly — raw provider values, verbatim.
              ...MARKET_METRICS_COLUMNS,
            ],
            `wheelwright-cross-entry-${new Date().toISOString().slice(0, 10)}.csv`
          );
        }} title="Download as CSV">⬇ CSV</button>
        {onRefreshTopOpportunities && (
          <CrossEntryRefreshButton
            symbols={refreshTopSymbols}
            provenanceBySymbol={provenanceBySymbol}
            onRefreshComplete={onRefreshTopOpportunities}
          />
        )}
      </div>
      {!isDefaultOrder && (
        <div className="wd-sort-notice">
          Viewing sorted by: <strong>{sortKey === "productionV0" ? "Prod v0" : sortKey === "premiumYieldAnnualized" ? "Yield" : sortKey === "executionScore" ? "Exec" : sortKey === "capitalRequired" ? "Capital" : sortKey === "cashRemaining" ? "Remaining" : sortKey === "entryMechanism" ? "Entry" : sortKey === "liquiditySortKey" ? "Liquidity" : sortKey === "spreadPercent" ? "Spread" : sortKey === "openInterest" ? "OI" : sortKey === "volume" ? "Vol" : sortKey}</strong>
          {" · "}
          <button className="wd-sort-reset" onClick={(e) => handleSort("productionV0", e)}>Show Prod v0 order</button>
        </div>
      )}
      <div className="wd-cross-entry-scroll">
      <table className="wd-candidate-table wd-cross-entry-table">
        <thead>
          <tr>
            <th className="wd-sortable" onClick={(e) => handleSort("entryMechanism", e)}>Entry{indicator("entryMechanism")}</th>
            <th className="wd-sortable" onClick={(e) => handleSort("symbol", e)}>Symbol{indicator("symbol")}</th>
            <th className="wd-sortable" onClick={(e) => handleSort("productionV0", e)}>Prod v0{indicator("productionV0")}</th>
            <th className="wd-sortable" onClick={(e) => handleSort("premiumYieldAnnualized", e)}>Yield{indicator("premiumYieldAnnualized")}</th>
            <th className="wd-sortable" onClick={(e) => handleSort("dte", e)}>DTE{indicator("dte")}</th>
            <th className="wd-sortable" onClick={(e) => handleSort("spot", e)}>Spot{indicator("spot")}</th>
            <th className="wd-sortable" onClick={(e) => handleSort("strike", e)}>Strike{indicator("strike")}</th>
            <th className="wd-sortable" onClick={(e) => handleSort("appreciationToStrikeDollars", e)} title="Appreciation to strike — signed dollar move (per-share × 100) the underlying must make from spot to reach the strike, with the % in parentheses. Buy-Write: headroom to the capped-upside strike. CSP: (negative) distance down to the OTM put strike.">Appr→Strike{indicator("appreciationToStrikeDollars")}</th>
            <th className="wd-sortable" onClick={(e) => handleSort("delta", e)}>Δ{indicator("delta")}</th>
            {crossEntryGreekIvHeaders(handleSort, indicator)}
            <th className="wd-sortable" onClick={(e) => handleSort("bid", e)}>Bid{indicator("bid")}</th>
            <th className="wd-sortable" onClick={(e) => handleSort("mid", e)}>Mid{indicator("mid")}</th>
            <th className="wd-sortable" onClick={(e) => handleSort("ask", e)}>Ask{indicator("ask")}</th>
            <th className="wd-sortable" onClick={(e) => handleSort("liquiditySortKey", e)} title={LIQUIDITY_HEADER_TITLE}>Liq{indicator("liquiditySortKey")}</th>
            <th className="wd-sortable" onClick={(e) => handleSort("spreadPercent", e)} title="Option bid-ask spread as % of mid: (ask − bid) / mid">Spread{indicator("spreadPercent")}</th>
            <th className="wd-sortable" onClick={(e) => handleSort("openInterest", e)} title="Option open interest (published once a day — prior-day figure)">OI{indicator("openInterest")}</th>
            <th className="wd-sortable" onClick={(e) => handleSort("volume", e)} title="Option contracts traded this session (resets daily; low early in the session). Not part of the liquidity grade.">Vol{indicator("volume")}</th>
            <th className="wd-sortable" onClick={(e) => handleSort("capitalRequired", e)}>Capital{indicator("capitalRequired")}</th>
            <th className="wd-sortable" onClick={(e) => handleSort("cashRemaining", e)}>Remaining{indicator("cashRemaining")}</th>
            <th className="wd-sortable" onClick={(e) => handleSort("executionScore", e)}>Exec{indicator("executionScore")}</th>
            <th className="wd-sortable" onClick={(e) => handleSort("posture", e)}>Posture{indicator("posture")}</th>
            <th className="wd-sortable" onClick={(e) => handleSort("age", e)} title="Chain-acquisition age of the evidence this row was calculated from">Age{indicator("age")}</th>
          </tr>
        </thead>
        <tbody>
          {displayed.map((row) => (
            <tr
              key={`${row.entryMechanism}-${row.symbol}-${row.strike}-${row.expiration}`}
              className={`wd-posture-row wd-posture-${row.posture.toLowerCase()}`}
              onClick={() => {
                if (row.originalPut) onSelectPut(row.originalPut);
                else if (row.originalBuyWrite) onSelectBuyWrite(row.originalBuyWrite);
              }}
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  if (row.originalPut) onSelectPut(row.originalPut);
                  else if (row.originalBuyWrite) onSelectBuyWrite(row.originalBuyWrite);
                }
              }}
            >
              <td className="wd-cross-entry-mechanism">
                <span className={`wd-entry-badge wd-entry-${row.entryMechanism}`}>
                  {row.entryMechanism === "csp" ? "CSP" : "BW"}
                </span>
              </td>
              <td className="wd-symbol">{row.symbol}</td>
              <td className="wd-cross-entry-score">{row.productionV0.toFixed(1)}%</td>
              <td>{row.premiumYieldAnnualized.toFixed(1)}%</td>
              <td>{row.dte}</td>
              <td>${row.spot.toFixed(2)}</td>
              <td>${row.strike.toFixed(2)}</td>
              <td className={row.appreciationToStrikeDollars < 0 ? "wd-negative-value" : ""}>{row.appreciationToStrikeDollars >= 0 ? "+" : "−"}${Math.abs(row.appreciationToStrikeDollars).toFixed(0)} ({row.appreciationToStrikePct >= 0 ? "+" : "−"}{Math.abs(row.appreciationToStrikePct).toFixed(1)}%)</td>
              <td>{row.delta.toFixed(2)}</td>
              <CrossEntryGreekIvCells greeks={(row.originalPut ?? row.originalBuyWrite)?.exportGreeks} metrics={row.marketMetrics} />
              <td>${row.bid.toFixed(2)}</td>
              <td>${row.mid.toFixed(2)}</td>
              <td>${row.ask.toFixed(2)}</td>
              <td
                className={`wd-liquidity-cell${row.liquidity?.tier === 4 ? " wd-warn-value" : ""}`}
                title={describeLiquidity(row.liquidity, row) + (row.entryMechanism === "buy-write" ? " (option leg only)" : "")}
              >
                {row.liquidity ? row.liquidity.label : "—"}
                {row.liquidity?.limitedBy && <span className="wd-liquidity-limit"> {LIMITED_BY_SHORT[row.liquidity.limitedBy]}</span>}
              </td>
              <td className={row.spreadPercent > 15 ? "wd-warn-value" : ""}>{row.spreadPercent.toFixed(0)}%</td>
              <td className={row.openInterest < 50 ? "wd-warn-value" : ""}>{row.openInterest.toLocaleString()}</td>
              <td>{row.volume.toLocaleString()}</td>
              <td>${row.capitalRequired.toLocaleString()}</td>
              <td className={row.cashRemaining < 0 ? "wd-negative-value" : ""}>${row.cashRemaining.toLocaleString()}</td>
              <td>{row.executionScore}</td>
              <td><span className={`wd-posture-badge wd-posture-${row.posture.toLowerCase()}`}>{row.posture}</span></td>
              <td className="wd-age-cell">
                <AgeCell provenance={row.evidenceProvenance} />
                {onRefreshTopOpportunities && (
                  <RowRefreshButton
                    symbol={row.symbol}
                    provenance={row.evidenceProvenance}
                    onRefreshComplete={onRefreshTopOpportunities}
                  />
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>
    </section>
  );
}
