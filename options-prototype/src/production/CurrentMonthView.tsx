/**
 * Current-Month Production View
 *
 * Operational surface answering:
 *   "What have I produced so far, what is in flight, where am I likely
 *    to finish, and how much capacity remains?"
 *
 * Integrates:
 *   - Backend production assessment (known production, unresolved, erosion)
 *   - Live portfolio snapshot (in-flight positions, capital capacity)
 *   - Position monitoring (expiry rungs)
 *
 * Domain ownership:
 *   - Known production semantics → backend (ProductionAssessor)
 *   - Capital/rung semantics → portfolio domain (position-monitoring, capacity-summary)
 *   - Forecast derivation → current-month-production.ts (this module composes)
 */

import { useMemo, useState, useCallback } from "react";
import { usePortfolio } from "../portfolio/use-portfolio";
import { useObservations } from "../evidence/use-observations";
import { deriveMonitoredPositions, groupByExpiration } from "../portfolio/position-monitoring";
import { deriveCurrentMonthProduction, type CurrentMonthProductionSummary, type InFlightPosition } from "./current-month-production";
import type { ProductionAssessmentResponse } from "./production-types";
import { loadWorkspace, updateWorkspace } from "../workspace/workspace";

interface Props {
  /** Backend assessment for the current month (null if not yet available) */
  assessment: ProductionAssessmentResponse | null;
}

export function CurrentMonthView({ assessment }: Props) {
  const { snapshot } = usePortfolio();
  const observations = useObservations();

  // Mission target — first Situation Architecture primitive
  const [missionTarget, setMissionTarget] = useState<number | null>(() => loadWorkspace().missionTarget);
  const [editingTarget, setEditingTarget] = useState(false);
  const [targetInput, setTargetInput] = useState("");

  const handleTargetSave = useCallback(() => {
    const parsed = parseFloat(targetInput.replace(/[$,]/g, ""));
    if (!isNaN(parsed) && parsed > 0) {
      setMissionTarget(parsed);
      updateWorkspace({ missionTarget: parsed });
    }
    setEditingTarget(false);
    setTargetInput("");
  }, [targetInput]);

  const handleTargetClear = useCallback(() => {
    setMissionTarget(null);
    updateWorkspace({ missionTarget: null });
    setEditingTarget(false);
    setTargetInput("");
  }, []);

  const summary = useMemo(() => {
    const positions = snapshot ? deriveMonitoredPositions(snapshot, observations) : [];
    const rungs = groupByExpiration(positions);
    return deriveCurrentMonthProduction(assessment, snapshot, rungs);
  }, [assessment, snapshot, observations]);

  return (
    <div className="prod-current">
      {/* === LEFT COLUMN: Summary + Capacity + Composition + Sources + Recon + Provenance === */}
      <div className="prod-current-left">
        <section className="prod-current-hero">
          <div className="prod-current-context">
            <span className="prod-current-month">{summary.evidenceContext.currentMonth}</span>
            <span className="prod-current-progress">
              Day {summary.evidenceContext.daysElapsed}/{summary.evidenceContext.totalDays}
            </span>
          </div>

          <div className="prod-current-metrics">
            <div className="prod-metric prod-metric-known">
              <span className="prod-metric-label">Produced</span>
              <span className="prod-metric-value">${summary.knownProduction.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>

            <div className="prod-metric prod-metric-forecast">
              <span className="prod-metric-label">Forecast</span>
              <span className="prod-metric-value prod-metric-placeholder">—</span>
            </div>

            <div className="prod-metric prod-metric-mission">
              <span className="prod-metric-label">Mission</span>
              {editingTarget ? (
                <span className="prod-mission-edit">
                  <input
                    className="prod-mission-input"
                    type="text"
                    placeholder="$6,000"
                    value={targetInput}
                    onChange={(e) => setTargetInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleTargetSave();
                      if (e.key === "Escape") { setEditingTarget(false); setTargetInput(""); }
                    }}
                    autoFocus
                  />
                  <button className="prod-mission-btn" onClick={handleTargetSave}>Set</button>
                  {missionTarget != null && (
                    <button className="prod-mission-btn prod-mission-btn-clear" onClick={handleTargetClear}>Clear</button>
                  )}
                </span>
              ) : missionTarget != null ? (
                <span
                  className="prod-metric-value prod-metric-editable"
                  onClick={() => { setEditingTarget(true); setTargetInput(missionTarget.toString()); }}
                  title="Click to change monthly target"
                >
                  ${missionTarget.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                </span>
              ) : (
                <span
                  className="prod-metric-value prod-metric-placeholder prod-metric-editable"
                  onClick={() => setEditingTarget(true)}
                  title="Set monthly production target"
                >
                  —
                </span>
              )}
            </div>
          </div>

          {/* Mission remaining — descriptive only */}
          {missionTarget != null && assessment && (
            <div className="prod-mission-context">
              <span className="prod-mission-remaining">
                ${Math.max(0, missionTarget - summary.knownProduction).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} remaining
              </span>
              {summary.knownProduction >= missionTarget && (
                <span className="prod-mission-met">Target met</span>
              )}
            </div>
          )}

          {(summary.capitalErosion > 0 || summary.unresolvedProduction > 0) && (
            <div className="prod-current-secondary">
              {summary.capitalErosion > 0 && (
                <div className="prod-current-erosion">
                  <span className="prod-erosion-label">Erosion</span>
                  <span className="prod-erosion-value">${summary.capitalErosion.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
              )}
              {summary.unresolvedProduction > 0 && (
                <div className="prod-current-unresolved">
                  <span className="prod-unresolved-label">Unresolved</span>
                  <span className="prod-unresolved-value">+${summary.unresolvedProduction.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
              )}
            </div>
          )}

          {/* Net Strategy Result — always visible when assessment exists */}
          {summary.netStrategyResult != null && (
            <div className="prod-net-strategy">
              <span className="prod-net-strategy-label">Net Strategy Result</span>
              <span className={`prod-net-strategy-value${summary.netStrategyResult < 0 ? " prod-net-strategy-negative" : ""}`}>
                {summary.netStrategyResult < 0 ? "−" : ""}${Math.abs(summary.netStrategyResult).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          )}
        </section>

        <section className="prod-current-capacity">
          <h3 className="prod-section-title">Production Capacity</h3>
          <div className="prod-capacity-grid">
            <div className="prod-cap-cell">
              <span className="prod-cap-label">Deployable now</span>
              <span className="prod-cap-value">
                {summary.capacity.deployableNow != null
                  ? `$${summary.capacity.deployableNow.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                  : "—"}
              </span>
            </div>
            <div className="prod-cap-cell">
              <span className="prod-cap-label">Resolving this month</span>
              <span className="prod-cap-value">
                {summary.capacity.resolvingThisMonth > 0
                  ? `$${summary.capacity.resolvingThisMonth.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                  : "$0.00"}
              </span>
              {summary.capacity.resolvingRungs.length > 0 && (
                <span className="prod-cap-detail">
                  {summary.capacity.resolvingRungs.map(r =>
                    `${r.expiration.slice(5)} (${r.positionCount}pos · $${r.totalCapital.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })})`
                  ).join(" · ")}
                </span>
              )}
            </div>
            <div className="prod-cap-cell">
              <span className="prod-cap-label">Beyond month end</span>
              <span className="prod-cap-value">
                {summary.capacity.beyondMonthEnd > 0
                  ? `$${summary.capacity.beyondMonthEnd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                  : "$0.00"}
              </span>
            </div>
          </div>
        </section>

        <section className="prod-current-composition">
          <h3 className="prod-section-title">Production Evidence</h3>
          <table className="prod-composition-table">
            <tbody>
              <tr>
                <td className="prod-comp-label">Known production (booked)</td>
                <td className="prod-comp-value">${summary.knownProduction.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                <td className="prod-comp-status prod-comp-known">Known</td>
              </tr>
              {summary.forecast.resolvingPremium > 0 && (
                <tr>
                  <td className="prod-comp-label">Premium on {summary.forecast.resolvingPositionCount} resolving position{summary.forecast.resolvingPositionCount !== 1 ? "s" : ""} (already in known)</td>
                  <td className="prod-comp-value">${summary.forecast.resolvingPremium.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  <td className="prod-comp-status prod-comp-context">Context</td>
                </tr>
              )}
              {summary.forecast.unknownPremiumCount > 0 && (
                <tr>
                  <td className="prod-comp-label">{summary.forecast.unknownPremiumCount} resolving position{summary.forecast.unknownPremiumCount !== 1 ? "s" : ""} (premium unknown)</td>
                  <td className="prod-comp-value">—</td>
                  <td className="prod-comp-status prod-comp-unresolved">Unresolved</td>
                </tr>
              )}
              {summary.unresolvedProduction > 0 && (
                <tr>
                  <td className="prod-comp-label">Unresolved potential</td>
                  <td className="prod-comp-value">+${summary.unresolvedProduction.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  <td className="prod-comp-status prod-comp-unresolved">Unresolved</td>
                </tr>
              )}
            </tbody>
          </table>
        </section>

        {Object.keys(summary.productionBreakdown).length > 0 && (
          <section className="prod-current-sources">
            <h3 className="prod-section-title">Sources</h3>
            <table className="prod-breakdown-table">
              <tbody>
                {Object.entries(summary.productionBreakdown).map(([source, amount]) => (
                  <tr key={source}>
                    <td className="prod-source-name">{formatSource(source)}</td>
                    <td className="prod-source-amount">${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )}

        {summary.reconciliationIssues.length > 0 && (
          <section className="prod-current-recon">
            <h3 className="prod-section-title">Reconciliation</h3>
            <ul className="prod-issues-list">
              {summary.reconciliationIssues.map((issue, i) => (
                <li key={i} className="prod-issue">
                  <span className="prod-issue-type">{formatIssueType(issue.type)}</span>
                  <span className="prod-issue-desc">{issue.description}</span>
                  {issue.potentialImpact != null && (
                    <span className="prod-issue-impact">${issue.potentialImpact.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  )}
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className="prod-current-provenance">
          <h3 className="prod-section-title">Provenance</h3>
          <ul className="prod-provenance-list">
            <li>Current month: {summary.evidenceContext.currentMonth}</li>
            <li>Assessment date: {summary.evidenceContext.today}</li>
            {summary.evidenceContext.snapshotDate && <li>Portfolio snapshot: {summary.evidenceContext.snapshotDate}</li>}
            <li>Premium recognized at receipt, not at contract expiry</li>
            <li>Resolving positions: obligation context, not additional income</li>
            <li>Excludes: hypothetical future deployments, linear extrapolation</li>
            <li>Capital resolution: outcome-dependent (not guaranteed cash)</li>
          </ul>
        </section>
      </div>

      {/* === RIGHT COLUMN: In-Flight Positions === */}
      {summary.inFlightPositions.length > 0 && (
        <section className="prod-current-inflight">
          <h3 className="prod-section-title">In-Flight Positions</h3>
          <table className="prod-inflight-table">
            <thead>
              <tr>
                <th></th>
                <th>Symbol</th>
                <th>Strike</th>
                <th>Exp</th>
                <th>DTE</th>
                <th>Qty</th>
                <th>Premium</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {summary.inFlightPositions.map((pos, i) => (
                <InFlightRow key={i} position={pos} />
              ))}
            </tbody>
          </table>
        </section>
      )}
    </div>
  );
}

// --- Sub-components ---

function InFlightRow({ position }: { position: InFlightPosition }) {
  const typeLabel = position.type === "put" ? "Put" : position.type === "call" ? "Call" : "Buy-Write";
  const typeClass = `prod-inflight-tag prod-inflight-tag-${position.type}`;
  return (
    <tr className={`prod-inflight-row${position.expiresThisMonth ? " prod-inflight-thismonth" : ""}`}>
      <td><span className={typeClass}>{typeLabel}</span></td>
      <td>{position.underlying}</td>
      <td>${position.strike}</td>
      <td>{position.expiration.slice(5)}</td>
      <td>{position.dte}d</td>
      <td>{position.quantity}</td>
      <td>{position.premiumCredit != null ? `$${position.premiumCredit.toFixed(2)}` : "—"}</td>
      <td>{position.expiresThisMonth ? "This month" : "Beyond"}</td>
    </tr>
  );
}

// --- Formatters ---

function formatSource(source: string): string {
  const labels: Record<string, string> = {
    OPTION_PREMIUM: "Option Premium",
    MONEY_MARKET_INCOME: "Money Market Income",
    TREASURY_DISCOUNT: "Treasury Discount",
    DIVIDEND: "Dividends",
    REALIZED_APPRECIATION: "Realized Appreciation",
  };
  return labels[source] || source.replace(/_/g, " ");
}

function formatIssueType(type: string): string {
  const labels: Record<string, string> = {
    BASIS_UNKNOWN: "Basis Unknown",
    DISTRIBUTION_CHARACTER_UNKNOWN: "Distribution Character",
    UNCLASSIFIED_ACTION: "Unclassified",
    INCOMPLETE_PERIOD_COVERAGE: "Incomplete Coverage",
    INSUFFICIENT_HISTORY: "Insufficient History",
  };
  return labels[type] || type.replace(/_/g, " ");
}
