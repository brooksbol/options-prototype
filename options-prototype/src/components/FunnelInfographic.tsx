/**
 * Opportunity Surface — macOS-style terminal partition infographic.
 *
 * Shows the complete universe as one fixed bar partitioned into
 * mutually exclusive terminal outcomes. Every symbol belongs to
 * exactly one segment. All segments sum to the monitored universe.
 *
 * Visually compact: one bar + one legend line.
 */

import type { RecommendationFunnel } from "../write-desk/recommend";

interface OpportunitySurfaceProps {
  funnel: RecommendationFunnel;
  /** Backend's current resolved count (for mixed-context indicator) */
  backendResolved?: number;
}

/**
 * Terminal partition: every symbol in the monitored universe
 * belongs to exactly one of these mutually exclusive categories.
 */
interface Partition {
  label: string;
  count: number;
  className: string;
}

function buildPartition(funnel: RecommendationFunnel): Partition[] {
  const { monitored, eligible, nonOptionable, pending, waitPosture, exclusions } = funnel;

  // Count actionable vs edge from candidates (funnel doesn't separate these yet,
  // so we derive from exclusions: eligible = actionable + edge)
  // For now, eligible is one segment. Future: split when funnel tracks it.

  // Extract exclusion counts by operator category
  const noOptions = nonOptionable;
  const noTimeframe = exclusions.find(e => e.reason.includes("No expiration"))?.count ?? 0;
  const noDeltaMatch = exclusions.find(e => e.reason.includes("No contract in delta") || e.reason.includes("delta range"))?.count ?? 0;
  const poorMarket = exclusions.find(e => e.reason.includes("Hard-no") || e.reason.includes("execution quality"))?.count ?? 0;
  const belowThreshold = waitPosture;
  const missingData = exclusions.find(e => e.reason.includes("Missing chain"))?.count ?? 0;
  const noContract = exclusions.find(e => e.reason.includes("No qualifying"))?.count ?? 0;
  const productStructure = exclusions.find(e => e.reason.includes("Product structure"))?.count ?? 0;

  // Combine filter reasons into one "filtered" bucket for display
  const riskMismatch = noDeltaMatch + noTimeframe;
  const qualityFiltered = poorMarket + noContract + productStructure;

  const partitions: Partition[] = [];

  if (eligible > 0) partitions.push({ label: "Opportunities", count: eligible, className: "wd-seg-eligible" });
  if (belowThreshold > 0) partitions.push({ label: "Below threshold", count: belowThreshold, className: "wd-seg-threshold" });
  if (riskMismatch > 0) partitions.push({ label: "No match", count: riskMismatch, className: "wd-seg-nomatch" });
  if (qualityFiltered > 0) partitions.push({ label: "Poor market", count: qualityFiltered, className: "wd-seg-quality" });
  if (noOptions > 0) partitions.push({ label: "No options", count: noOptions, className: "wd-seg-nooptions" });
  if (pending > 0) partitions.push({ label: "Unresolved", count: pending, className: "wd-seg-pending" });
  if (missingData > 0) partitions.push({ label: "Incomplete", count: missingData, className: "wd-seg-incomplete" });

  // Ensure partitions sum to monitored (catch any unaccounted symbols)
  const accounted = partitions.reduce((s, p) => s + p.count, 0);
  const remainder = monitored - accounted;
  if (remainder > 0) {
    // Symbols that were evaluable but produced no candidate and aren't in any named exclusion
    // (usually symbols that had chains but all contracts were in the wrong delta range or had no puts)
    partitions.push({ label: "Other filtered", count: remainder, className: "wd-seg-other" });
  }

  return partitions;
}

export function FunnelInfographic({ funnel, backendResolved }: OpportunitySurfaceProps) {
  const { monitored, pending } = funnel;
  const partitions = buildPartition(funnel);
  const isAcquiring = pending > 0;
  const isMixedContext = backendResolved != null && backendResolved < (funnel.resolved) && isAcquiring;

  return (
    <div className="wd-surface" role="img" aria-label={`Opportunity surface: ${funnel.eligible} of ${monitored} ETFs`}>
      {/* Segmented bar */}
      <div className="wd-surface-bar">
        {partitions.map((p, i) => (
          <div
            key={i}
            className={`wd-surface-seg ${p.className}`}
            style={{ width: `${monitored > 0 ? (p.count / monitored) * 100 : 0}%` }}
            title={`${p.count} ${p.label}`}
          />
        ))}
      </div>

      {/* Compact legend */}
      <div className="wd-surface-legend">
        {partitions.filter(p => p.count > 0).map((p, i) => (
          <span key={i} className="wd-surface-legend-item">
            <span className={`wd-surface-swatch ${p.className}`} />
            <span className="wd-surface-legend-count">{p.count}</span>
            <span className="wd-surface-legend-label">{p.label}</span>
          </span>
        ))}
        <span className="wd-surface-total">{monitored} ETFs</span>
        {isMixedContext && (
          <span className="wd-surface-context" title="Recommendations include prior valid evidence plus current backend updates">
            Prior baseline + {backendResolved} current
          </span>
        )}
      </div>
    </div>
  );
}
