/**
 * Funnel Infographic — Operator-facing micro telemetry.
 *
 * Primary display: three numbers + proportional bar.
 * Answers in < 1 second:
 *   - How much of the universe has been evaluated?
 *   - How many have options?
 *   - How many opportunities do I have?
 *
 * Disclosure: "Why only N?" with operator-language exclusion reasons.
 * Diagnostics: pipeline stages for developer inspection.
 */

import type { RecommendationFunnel } from "../write-desk/recommend";

interface FunnelInfographicProps {
  funnel: RecommendationFunnel;
  showCount: number;
  /** Backend's current-generation resolved count (may differ from funnel.resolved if prior cache participates) */
  backendResolved?: number;
}

/** Map implementation exclusion reasons to operator language */
function operatorReason(reason: string): string {
  if (reason.includes("Non-optionable") || reason.includes("no listed")) return "No options listed";
  if (reason.includes("No expiration in DTE")) return "No match in timeframe";
  if (reason.includes("No contract in delta")) return "No match at target risk";
  if (reason.includes("Hard-no") || reason.includes("execution quality")) return "Poor market quality";
  if (reason.includes("Wait posture") || reason.includes("below EDGE")) return "Below threshold";
  if (reason.includes("Missing chain")) return "Incomplete data";
  if (reason.includes("Product structure")) return "Structural exclusion";
  if (reason.includes("No qualifying")) return "No qualifying contract";
  if (reason.includes("Pending")) return "Not yet evaluated";
  return reason;
}

export function FunnelInfographic({ funnel, showCount, backendResolved }: FunnelInfographicProps) {
  const { monitored, resolved, optionable, pending, eligible } = funnel;
  const isAcquiring = pending > 0;
  const opportunities = eligible;
  // Detect mixed context: funnel used prior cache beyond what the backend currently provides
  const isMixedContext = backendResolved != null && backendResolved < resolved && isAcquiring;

  // Bar proportions (of monitored)
  const pctEligible = monitored > 0 ? (eligible / monitored) * 100 : 0;
  const pctOptionableOther = monitored > 0 ? ((optionable - eligible) / monitored) * 100 : 0;
  const pctResolved = monitored > 0 ? ((resolved - optionable) / monitored) * 100 : 0;
  const pctPending = monitored > 0 ? (pending / monitored) * 100 : 0;

  return (
    <div className="wd-funnel" role="region" aria-label="Universe coverage">
      {/* Primary: bar + 3 counts — one line */}
      <div className="wd-funnel-primary">
        <div
          className="wd-funnel-bar"
          role="progressbar"
          aria-valuenow={resolved}
          aria-valuemax={monitored}
          aria-label={`${resolved} of ${monitored} evaluated`}
        >
          <div className="wd-funnel-bar-seg wd-funnel-seg-eligible" style={{ width: `${pctEligible}%` }} />
          <div className="wd-funnel-bar-seg wd-funnel-seg-optionable" style={{ width: `${pctOptionableOther}%` }} />
          <div className="wd-funnel-bar-seg wd-funnel-seg-resolved" style={{ width: `${pctResolved}%` }} />
          {pctPending > 0 && (
            <div className="wd-funnel-bar-seg wd-funnel-seg-pending" style={{ width: `${pctPending}%` }} />
          )}
        </div>
        <div className="wd-funnel-stats">
          <span className="wd-funnel-stat" title="Total ETFs in monitored universe">
            <span className="wd-funnel-stat-num">{isAcquiring ? `${resolved}/${monitored}` : monitored}</span>
            <span className="wd-funnel-stat-label">{isAcquiring ? "evaluated" : "universe"}</span>
          </span>
          <span className="wd-funnel-stat" title="ETFs with listed options">
            <span className="wd-funnel-stat-num wd-funnel-stat-optionable">{optionable}</span>
            <span className="wd-funnel-stat-label">optionable</span>
          </span>
          <span className="wd-funnel-stat" title="Actionable or edge recommendations available now">
            <span className="wd-funnel-stat-num wd-funnel-stat-opportunities">{opportunities}</span>
            <span className="wd-funnel-stat-label">opportunities</span>
          </span>
        </div>
      </div>

      {/* Disclosure: why only N? */}
      {isMixedContext && (
        <span className="wd-funnel-context-note" title="Recommendations include prior valid evidence plus current backend updates">
          Prior valid + {backendResolved} current
        </span>
      )}
      {funnel.exclusions.length > 0 && (
        <details className="wd-funnel-why">
          <summary className="wd-funnel-why-summary">
            Why {opportunities}?
          </summary>
          <div className="wd-funnel-why-list">
            {funnel.exclusions
              .filter(e => e.count > 0)
              .sort((a, b) => b.count - a.count)
              .map((e, i) => (
                <div key={i} className="wd-funnel-why-row">
                  <span className="wd-funnel-why-count">{e.count}</span>
                  <span className="wd-funnel-why-reason">{operatorReason(e.reason)}</span>
                </div>
              ))}
          </div>
        </details>
      )}
    </div>
  );
}
