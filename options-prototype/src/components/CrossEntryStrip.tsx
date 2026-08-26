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
import type { PutCandidate } from "../write-desk/scan-orchestrator";
import type { BuyWriteCandidate } from "../write-desk/recommend-buy-writes";
import type { RecommendationPolicy } from "../write-desk/recommend";
import { loadWorkspace, updateWorkspace } from "../workspace/workspace";
import { useMultiColumnSort, type SortDir } from "../write-desk/use-multi-column-sort";
import { downloadTableCsv } from "../write-desk/table-csv-export";

// --- Sortable Table (delegates to shared multi-column hook) ---

function useCrossEntrySortable(items: CrossEntryRow[], defaultKey: string = "productionV0", defaultDir: SortDir = "desc", onSortChange?: (key: string, dir: SortDir) => void) {
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
  maxRows?: number;
  onSelectPut: (candidate: PutCandidate) => void;
  onSelectBuyWrite: (candidate: BuyWriteCandidate) => void;
}

export function CrossEntryStrip({
  putCandidates,
  buyWriteCandidates,
  policy,
  maxRows = 10,
  onSelectPut,
  onSelectBuyWrite,
}: CrossEntryStripProps) {
  // Full eligible population (composition + eligibility filtering, no display cap)
  const allRows = useMemo(
    () => buildCrossEntryRows(putCandidates, buyWriteCandidates),
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
  const [showCount, setShowCount] = useState(() => loadWorkspace().writeDeskCrossEntryShowCount ?? maxRows);
  const filtered = affordableOnly ? sorted.filter(r => r.cashRemaining >= 0) : sorted;
  const displayed = filtered.slice(0, showCount);

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
          Show
          <input type="number" min={1} max={filtered.length || 50} value={showCount} onChange={(e) => { const v = Math.max(1, Math.min(filtered.length || 50, parseInt(e.target.value) || 10)); setShowCount(v); updateWorkspace({ writeDeskCrossEntryShowCount: v }); }} className="wd-control-spinner" />
        </label>
        <span className="wd-table-showing" style={{ marginLeft: "8px" }}>Showing {Math.min(displayed.length, filtered.length)} of {filtered.length}</span>
        <button className="wd-download-btn" onClick={() => {
          downloadTableCsv(
            sorted as unknown as Record<string, unknown>[],
            [
              { key: "entryMechanism", label: "Entry" }, { key: "symbol", label: "Symbol" },
              { key: "productionV0", label: "Prod v0" }, { key: "premiumYieldAnnualized", label: "Yield%" },
              { key: "dte", label: "DTE" }, { key: "delta", label: "Delta" },
              { key: "bid", label: "Bid" }, { key: "mid", label: "Mid" }, { key: "ask", label: "Ask" },
              { key: "capitalRequired", label: "Capital" }, { key: "cashRemaining", label: "Remaining" },
              { key: "executionScore", label: "Exec" }, { key: "posture", label: "Posture" },
            ],
            `wheelwright-cross-entry-${new Date().toISOString().slice(0, 10)}.csv`
          );
        }} title="Download as CSV">⬇ CSV</button>
      </div>
      {!isDefaultOrder && (
        <div className="wd-sort-notice">
          Viewing sorted by: <strong>{sortKey === "productionV0" ? "Prod v0" : sortKey === "premiumYieldAnnualized" ? "Yield" : sortKey === "executionScore" ? "Exec" : sortKey === "capitalRequired" ? "Capital" : sortKey === "cashRemaining" ? "Remaining" : sortKey === "entryMechanism" ? "Entry" : sortKey}</strong>
          {" · "}
          <button className="wd-sort-reset" onClick={(e) => handleSort("productionV0", e)}>Show Prod v0 order</button>
        </div>
      )}
      <table className="wd-candidate-table wd-cross-entry-table">
        <thead>
          <tr>
            <th className="wd-sortable" onClick={(e) => handleSort("entryMechanism", e)}>Entry{indicator("entryMechanism")}</th>
            <th className="wd-sortable" onClick={(e) => handleSort("symbol", e)}>Symbol{indicator("symbol")}</th>
            <th className="wd-sortable" onClick={(e) => handleSort("productionV0", e)}>Prod v0{indicator("productionV0")}</th>
            <th className="wd-sortable" onClick={(e) => handleSort("premiumYieldAnnualized", e)}>Yield{indicator("premiumYieldAnnualized")}</th>
            <th className="wd-sortable" onClick={(e) => handleSort("dte", e)}>DTE{indicator("dte")}</th>
            <th className="wd-sortable" onClick={(e) => handleSort("delta", e)}>Δ{indicator("delta")}</th>
            <th className="wd-sortable" onClick={(e) => handleSort("bid", e)}>Bid{indicator("bid")}</th>
            <th className="wd-sortable" onClick={(e) => handleSort("mid", e)}>Mid{indicator("mid")}</th>
            <th className="wd-sortable" onClick={(e) => handleSort("ask", e)}>Ask{indicator("ask")}</th>
            <th className="wd-sortable" onClick={(e) => handleSort("capitalRequired", e)}>Capital{indicator("capitalRequired")}</th>
            <th className="wd-sortable" onClick={(e) => handleSort("cashRemaining", e)}>Remaining{indicator("cashRemaining")}</th>
            <th className="wd-sortable" onClick={(e) => handleSort("executionScore", e)}>Exec{indicator("executionScore")}</th>
            <th className="wd-sortable" onClick={(e) => handleSort("posture", e)}>Posture{indicator("posture")}</th>
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
              <td>{row.delta.toFixed(2)}</td>
              <td>${row.bid.toFixed(2)}</td>
              <td>${row.mid.toFixed(2)}</td>
              <td>${row.ask.toFixed(2)}</td>
              <td>${row.capitalRequired.toLocaleString()}</td>
              <td className={row.cashRemaining < 0 ? "wd-negative-value" : ""}>${row.cashRemaining.toLocaleString()}</td>
              <td>{row.executionScore}</td>
              <td><span className={`wd-posture-badge wd-posture-${row.posture.toLowerCase()}`}>{row.posture}</span></td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
