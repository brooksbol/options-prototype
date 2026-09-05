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

import { useMemo, useState, useCallback, useEffect } from "react";
import { usePortfolio } from "../portfolio/use-portfolio";
import { useObservations } from "../evidence/use-observations";
import { deriveMonitoredPositions, groupByExpiration } from "../portfolio/position-monitoring";
import { deriveCurrentMonthProduction, type InFlightPosition } from "./current-month-production";
import type { ProductionAssessmentResponse } from "./production-types";
import { EpisodeLedger } from "./EpisodeLedger";
import { deriveEpisodeChapters } from "./episode-derivation";
import { buildProductionCsv } from "./production-csv-export";
import { getActivityFilename } from "../portfolio/portfolio-store";
import { loadWorkspace, updateWorkspace } from "../workspace/workspace";
import { classifyAllPositions } from "../forecast/resolution-outlook";
import { deriveProductionOutlook } from "../forecast/production-outlook";
import { recordOutlookObservations } from "../forecast/outlook-observations";
import { deriveProspectiveDeployment } from "../forecast/prospective-deployment";
import { getActivityRows } from "../portfolio/portfolio-store";
import "../components/position-detail-modal.css";
import "./episode-ledger.css";

/**
 * Canonical recognized Production source taxonomy.
 * Matches backend ProductionSource enum exactly.
 * Rendered in stable order including $0.00 values so the operator
 * can inspect production development throughout the month.
 */
const CANONICAL_PRODUCTION_SOURCES = [
  "OPTION_PREMIUM",
  "MONEY_MARKET_INCOME",
  "TREASURY_DISCOUNT",
  "DIVIDEND",
  "REALIZED_APPRECIATION",
] as const;

interface Props {
  /** Backend assessment for the current month (null if not yet available) */
  assessment: ProductionAssessmentResponse | null;
}

export function CurrentMonthView({ assessment }: Props) {
  const { snapshot } = usePortfolio();
  const observations = useObservations();

  // Current month key for episode ledger
  const currentMonthKey = useMemo(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  }, []);

  // Mission target — first Situation Architecture primitive
  const [missionTarget, setMissionTarget] = useState<number | null>(() => loadWorkspace().missionTarget);
  const [editingTarget, setEditingTarget] = useState(false);
  const [targetInput, setTargetInput] = useState("");

  // Erosion detail toggle
  const [erosionExpanded, setErosionExpanded] = useState(false);

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

  // PL-PROD-EXPORT-01 trust correction #1: derive the Economic Activity chapters ONCE. The exact
  // same collection is rendered by the EpisodeLedger AND serialized into the Production CSV, so a
  // rendered claim and an exported claim can never come from two independent derivations.
  // (Declared BEFORE handleDownloadCsv so the callback closes over an initialized binding — no TDZ.)
  const episodeChapters = useMemo(() => {
    const activityRows = getActivityRows();
    if (!activityRows || activityRows.length === 0) return [];
    return deriveEpisodeChapters({
      activityRows,
      snapshot,
      assessedTransactions: assessment?.transactions ?? null,
      dispositionResults: assessment?.dispositionResults ?? null,
      targetMonth: currentMonthKey,
    });
  }, [assessment, snapshot, currentMonthKey]);

  // PL-PROD-EXPORT-01: download one hybrid Production Evidence CSV.
  // Composes the authoritative backend response with the ALREADY-DERIVED presentation chapters
  // (same inputs the EpisodeLedger renders). No economic recomputation happens here — the CSV
  // serializer only serializes existing backend + presentation values.
  const handleDownloadCsv = useCallback(() => {
    // Consume the SAME chapter collection the ledger renders (correction #1) — no re-derivation.
    const csv = buildProductionCsv(assessment, episodeChapters, {
      exportGeneratedAt: new Date().toISOString(),
      targetMonth: currentMonthKey,
      sourceFilename: getActivityFilename(),
    });
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `production-evidence-${currentMonthKey}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [assessment, episodeChapters, currentMonthKey]);

  // --- Production Outlook (V1 Operating Forecast) ---
  const outlook = useMemo(() => {
    const positions = snapshot ? deriveMonitoredPositions(snapshot, observations) : [];
    if (positions.length === 0) return null;

    const today = new Date();
    const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    const outlooks = classifyAllPositions(positions, monthEnd, today);

    // Record observations for future evaluation
    const monthStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;
    const posMap = new Map(positions.map(p => [p.id, { underlying: p.underlying }]));
    recordOutlookObservations(outlooks, posMap, monthStr, today);

    return deriveProductionOutlook(assessment, outlooks, positions, snapshot, today);
  }, [assessment, snapshot, observations]);

  // --- Prospective Deployment (V2 continuation estimate) ---
  const prospective = useMemo(() => {
    const today = new Date();
    const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    const activityRows = getActivityRows();

    // Use the earliest resolution date from capacity rungs
    const earliestResolution = summary.capacity.resolvingRungs.length > 0
      ? summary.capacity.resolvingRungs[0].expiration
      : null;

    return deriveProspectiveDeployment(
      activityRows,
      summary.capacity.resolvingThisMonth,
      earliestResolution,
      monthEnd,
      today,
    );
  }, [summary]);

  // --- Combined Forecast (V1 + V2) ---
  const forecastTotal = useMemo(() => {
    if (!outlook) return null;
    const base = outlook.baseEstimate + prospective.roughEstimate;
    // Round to nearest $1K for headline
    return Math.round(base / 1000) * 1000;
  }, [outlook, prospective]);

  // Forecast info popover toggle
  const [forecastInfoOpen, setForecastInfoOpen] = useState(false);

  // Escape key dismiss for forecast modal (matches Console PositionDetailModal idiom)
  useEffect(() => {
    if (!forecastInfoOpen) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") setForecastInfoOpen(false); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [forecastInfoOpen]);

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
            {assessment && (
              <button
                className="prod-csv-export-btn"
                onClick={handleDownloadCsv}
                title="Download a machine-readable Production evidence CSV (backend assessment + presented claims)"
                aria-label="Download Production CSV"
              >
                Download Production CSV
              </button>
            )}
          </div>

          <div className="prod-current-metrics">
            <div className="prod-metric prod-metric-known">
              <span className="prod-metric-label">Produced</span>
              <span className="prod-metric-value">${summary.knownProduction.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>

            <div className="prod-metric prod-metric-forecast">
              <span className="prod-metric-label">Forecast
                <button
                  className="prod-forecast-info-btn"
                  onClick={() => setForecastInfoOpen(!forecastInfoOpen)}
                  title="Wheelwright's Simple Forecast"
                  aria-label="Forecast explanation"
                >&#9432;</button>
              </span>
              {forecastTotal && forecastTotal > 0 ? (
                <span className="prod-metric-value">
                  ≈ ${(forecastTotal / 1000).toFixed(0)}K
                </span>
              ) : outlook && outlook.baseEstimateRounded > 0 ? (
                <span className="prod-metric-value">
                  ≈ ${(outlook.baseEstimateRounded / 1000).toFixed(outlook.baseEstimateRounded % 1000 === 0 ? 0 : 1)}K
                </span>
              ) : (
                <span className="prod-metric-value prod-metric-placeholder">—</span>
              )}
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
                <button
                  className="prod-mission-set-btn"
                  onClick={() => setEditingTarget(true)}
                  title="Set monthly production target"
                >
                  Set target
                </button>
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
                  <button
                    className="prod-erosion-toggle"
                    onClick={() => setErosionExpanded(!erosionExpanded)}
                    title={erosionExpanded ? "Hide erosion detail" : "Show erosion detail"}
                  >
                    ${summary.capitalErosion.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    <span className="prod-erosion-caret">{erosionExpanded ? "▾" : "▸"}</span>
                  </button>
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

          {/* Erosion event detail — expandable provenance */}
          {erosionExpanded && assessment && assessment.erosionEvents.length > 0 && (
            <ul className="prod-erosion-detail">
              {assessment.erosionEvents.map((event, i) => (
                <li key={i} className="prod-erosion-detail-row">
                  <span className="prod-erosion-detail-context">{event.date} · {event.symbol}</span>
                  <span className="prod-erosion-detail-desc">{event.description}</span>
                  <span className="prod-erosion-detail-amount">${event.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </li>
              ))}
            </ul>
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

          {/* Forecast decomposition — compact aligned summary */}
          {outlook && (
            <div className="prod-outlook-decomposition">
              <div className="prod-outlook-row">
                <span className="prod-outlook-label">Produced so far</span>
                <span className="prod-outlook-value">${outlook.recognizedProduction.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span>
              </div>
              <div className="prod-outlook-row">
                <span className="prod-outlook-label">Current positions</span>
                <span className="prod-outlook-value">
                  {outlook.likelyAdditional !== 0
                    ? `~$${outlook.likelyAdditional.toLocaleString(undefined, { maximumFractionDigits: 0 })}`
                    : "~$0"}
                </span>
              </div>
              {prospective.deploymentPlausible && (
                <div className="prod-outlook-row">
                  <span className="prod-outlook-label">Possible redeployment</span>
                  <span className="prod-outlook-value">
                    ~${(prospective.roughEstimate / 1000).toFixed(0)}K
                  </span>
                </div>
              )}
              {outlook.uncertainCount > 0 && (
                <div className="prod-outlook-row prod-outlook-row-minor">
                  <span className="prod-outlook-label">Uncertain</span>
                  <span className="prod-outlook-value">
                    {outlook.uncertainCount} position{outlook.uncertainCount > 1 ? "s" : ""}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Forecast ⓘ modal — same idiom as Console PositionDetailModal */}
          {forecastInfoOpen && (
            <div
              className="pdm-backdrop"
              onClick={(e) => { if (e.target === e.currentTarget) setForecastInfoOpen(false); }}
            >
              <div className="pdm-modal prod-forecast-modal" role="dialog" aria-modal="true" aria-label="Wheelwright's Simple Forecast">
                <header className="pdm-header">
                  <span className="prod-forecast-modal-title">Wheelwright's Simple Forecast</span>
                  <button
                    className="pdm-close"
                    onClick={() => setForecastInfoOpen(false)}
                    aria-label="Close"
                  >&times;</button>
                </header>
                <div className="prod-forecast-modal-body">
                  <div className="prod-forecast-modal-method">
                    <p>Wheelwright starts with production already recognized this month — premium received, appreciation realized, any other booked cash.</p>
                    <p>For positions nearing expiration, it looks at where the underlying sits relative to the strike and how little time remains. When the evidence points clearly toward assignment or expiration, Wheelwright includes the corresponding economic consequence.</p>
                    <p>It then considers capital expected to cycle again before month-end. Because option premium is recognized when a new trade is opened, another deployment can add to this month's production even if the new contracts expire next month. Wheelwright uses the immediate premium yield observed across its actual deployment history as a rough guide.</p>
                    <p>The result is deliberately rounded because this is a planning forecast, not an accounting result.</p>
                  </div>
                </div>
              </div>
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

        <section className="prod-current-sources">
          <h3 className="prod-section-title">Sources</h3>
          <table className="prod-breakdown-table">
            <tbody>
              {CANONICAL_PRODUCTION_SOURCES.map((source) => (
                <tr key={source}>
                  <td className="prod-source-name">{formatSource(source)}</td>
                  <td className="prod-source-amount">${(summary.productionBreakdown[source] ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

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

      {/* === RIGHT COLUMN: In-Flight Positions + Economic Events === */}
      <div className="prod-current-right">
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

        {/* Episode Ledger — V2 chronological wheel activity (PL-PROD-EVENTS).
            Consumes the single shared chapter collection (also serialized by the CSV export). */}
        <EpisodeLedger chapters={episodeChapters} />
      </div>
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
