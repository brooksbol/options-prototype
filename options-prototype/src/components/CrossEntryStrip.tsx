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
 */

import { useMemo } from "react";
import { buildCrossEntryRows, buildCrossEntryExport, type CrossEntryRow } from "../write-desk/production-v0";
import type { PutCandidate } from "../write-desk/scan-orchestrator";
import type { BuyWriteCandidate } from "../write-desk/recommend-buy-writes";
import type { RecommendationPolicy } from "../write-desk/recommend";

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
  const rows = useMemo(
    () => buildCrossEntryRows(putCandidates, buyWriteCandidates, maxRows),
    [putCandidates, buyWriteCandidates, maxRows]
  );

  if (rows.length === 0) return null;

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
        <button className="wd-download-btn" onClick={handleExport} title="Export full cross-entry decomposition (JSON)">⬇</button>
      </div>
      <table className="wd-candidate-table wd-cross-entry-table">
        <thead>
          <tr>
            <th>Entry</th>
            <th>Symbol</th>
            <th>Prod v0</th>
            <th>Yield</th>
            <th>DTE</th>
            <th>Δ</th>
            <th>Capital</th>
            <th>Remaining</th>
            <th>Exec</th>
            <th>Posture</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, idx) => (
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
