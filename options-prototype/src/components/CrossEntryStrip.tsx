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

import { useMemo, useState, useCallback } from "react";
import { buildCrossEntryRows, buildCrossEntryExport, type CrossEntryRow } from "../write-desk/production-v0";
import type { PutCandidate } from "../write-desk/scan-orchestrator";
import type { BuyWriteCandidate } from "../write-desk/recommend-buy-writes";
import type { RecommendationPolicy } from "../write-desk/recommend";

// --- Sortable Table Hook (same pattern as WriteDesk candidate tables) ---

type SortDir = "asc" | "desc";

function useCrossEntrySortable(items: CrossEntryRow[], defaultKey: string = "productionV0", defaultDir: SortDir = "desc") {
  const [sortKey, setSortKey] = useState(defaultKey);
  const [sortDir, setSortDir] = useState<SortDir>(defaultDir);

  const handleSort = useCallback((key: string) => {
    if (key === sortKey) {
      setSortDir((d) => d === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      // Most numeric columns default to descending (highest first)
      // Symbol and entryMechanism default to ascending (alphabetical)
      setSortDir(key === "symbol" || key === "entryMechanism" ? "asc" : "desc");
    }
  }, [sortKey]);

  const sorted = useMemo(() => {
    return [...items].sort((a, b) => {
      const aVal = (a as Record<string, unknown>)[sortKey];
      const bVal = (b as Record<string, unknown>)[sortKey];
      if (aVal == null && bVal == null) return 0;
      if (aVal == null) return 1;
      if (bVal == null) return -1;
      let cmp: number;
      if (typeof aVal === "string") {
        cmp = aVal.localeCompare(bVal as string);
      } else {
        const na = Number(aVal);
        const nb = Number(bVal);
        if (isNaN(na) && isNaN(nb)) cmp = 0;
        else if (isNaN(na)) cmp = -1;
        else if (isNaN(nb)) cmp = 1;
        else cmp = na - nb;
      }
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [items, sortKey, sortDir]);

  const indicator = (key: string) => sortKey === key ? (sortDir === "asc" ? " ▲" : " ▼") : "";

  const isDefaultOrder = sortKey === defaultKey && sortDir === defaultDir;

  return { sorted, handleSort, indicator, isDefaultOrder, sortKey };
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

  // Sort by active column (operator-controlled), THEN cap for display
  const { sorted, handleSort, indicator, isDefaultOrder, sortKey } = useCrossEntrySortable(allRows);
  const [affordableOnly, setAffordableOnly] = useState(true);
  const filtered = affordableOnly ? sorted.filter(r => r.cashRemaining >= 0) : sorted;
  const displayed = filtered.slice(0, maxRows);

  if (allRows.length === 0) return null;

  const handleExport = () => {
    const payload = buildCrossEntryExport(putCandidates, buyWriteCandidates, {
      targetDelta: policy.contractSelection.targetDelta,
      admissibleDeltaRange: policy.contractSelection.admissibleDeltaRange,
      eligibleDteRange: policy.contractSelection.eligibleDteRange,
      executionActionableFloor: policy.executionAssessment.actionableFloor,
      executionEdgeFloor: policy.executionAssessment.edgeFloor,
    });
    const json = JSON.stringify(payload, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `production-v0-export-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <section className="wd-cross-entry">
      <div className="wd-cross-entry-header">
        <h3 className="wd-cross-entry-title">Cash Deployment — Experimental Prod v0</h3>
        <span className="wd-cross-entry-note">
          Experimental cross-entry lens. Includes Buy-Write conditional appreciation; not a validated "best deployment" ranking.
        </span>
        <label style={{ fontSize: "11px", marginLeft: "8px", cursor: "pointer", color: "#aaa" }}>
          <input type="checkbox" checked={affordableOnly} onChange={() => setAffordableOnly(!affordableOnly)} style={{ marginRight: "4px" }} />
          Affordable only
        </label>
        <button className="wd-download-btn" onClick={handleExport} title="Export full cross-entry decomposition (JSON)">⬇</button>
      </div>
      {!isDefaultOrder && (
        <div className="wd-sort-notice">
          Viewing sorted by: <strong>{sortKey === "productionV0" ? "Prod v0" : sortKey === "premiumYieldAnnualized" ? "Yield" : sortKey === "executionScore" ? "Exec" : sortKey === "capitalRequired" ? "Capital" : sortKey === "cashRemaining" ? "Remaining" : sortKey === "entryMechanism" ? "Entry" : sortKey}</strong>
          {" · "}
          <button className="wd-sort-reset" onClick={() => handleSort("productionV0")}>Show Prod v0 order</button>
        </div>
      )}
      <table className="wd-candidate-table wd-cross-entry-table">
        <thead>
          <tr>
            <th className="wd-sortable" onClick={() => handleSort("entryMechanism")}>Entry{indicator("entryMechanism")}</th>
            <th className="wd-sortable" onClick={() => handleSort("symbol")}>Symbol{indicator("symbol")}</th>
            <th className="wd-sortable" onClick={() => handleSort("productionV0")}>Prod v0{indicator("productionV0")}</th>
            <th className="wd-sortable" onClick={() => handleSort("premiumYieldAnnualized")}>Yield{indicator("premiumYieldAnnualized")}</th>
            <th className="wd-sortable" onClick={() => handleSort("dte")}>DTE{indicator("dte")}</th>
            <th className="wd-sortable" onClick={() => handleSort("delta")}>Δ{indicator("delta")}</th>
            <th className="wd-sortable" onClick={() => handleSort("bid")}>Bid{indicator("bid")}</th>
            <th className="wd-sortable" onClick={() => handleSort("mid")}>Mid{indicator("mid")}</th>
            <th className="wd-sortable" onClick={() => handleSort("ask")}>Ask{indicator("ask")}</th>
            <th className="wd-sortable" onClick={() => handleSort("capitalRequired")}>Capital{indicator("capitalRequired")}</th>
            <th className="wd-sortable" onClick={() => handleSort("cashRemaining")}>Remaining{indicator("cashRemaining")}</th>
            <th className="wd-sortable" onClick={() => handleSort("executionScore")}>Exec{indicator("executionScore")}</th>
            <th className="wd-sortable" onClick={() => handleSort("posture")}>Posture{indicator("posture")}</th>
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
