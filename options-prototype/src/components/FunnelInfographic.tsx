/**
 * Opportunity Surface — Integrated board summary.
 *
 * A thin segmented bar + one legend line that describes why the table
 * contains the rows it does. Part of the candidate board, not a separate widget.
 *
 * Color semantics are shared with table posture badges:
 *   Green  = Actionable (opportunities)
 *   Blue   = Edge (opportunities)
 *   Amber  = Below threshold (watching)
 *   Red    = Poor market (execution unsafe)
 *   Gray   = No match (nothing in range)
 *   Slate  = No options (not applicable)
 *   Dim    = Unresolved (pending)
 */

import type { RecommendationFunnel } from "../write-desk/recommend";

interface OpportunitySurfaceProps {
  funnel: RecommendationFunnel;
  backendResolved?: number;
}

interface Segment {
  label: string;
  count: number;
  cls: string;
}

function buildSegments(funnel: RecommendationFunnel): Segment[] {
  const { monitored, eligible, nonOptionable, pending, waitPosture, exclusions } = funnel;

  const noTimeframe = exclusions.find(e => e.reason.includes("No expiration"))?.count ?? 0;
  const noDelta = exclusions.find(e => e.reason.includes("delta"))?.count ?? 0;
  const poorMarket = exclusions.find(e => e.reason.includes("Hard-no") || e.reason.includes("execution"))?.count ?? 0;
  const missingData = exclusions.find(e => e.reason.includes("Missing chain"))?.count ?? 0;
  const noContract = exclusions.find(e => e.reason.includes("No qualifying"))?.count ?? 0;
  const productStructure = exclusions.find(e => e.reason.includes("Product structure"))?.count ?? 0;

  const noMatch = noDelta + noTimeframe + noContract + productStructure;
  const segments: Segment[] = [];

  if (eligible > 0) segments.push({ label: "Opportunities", count: eligible, cls: "seg-opportunities" });
  if (waitPosture > 0) segments.push({ label: "Below threshold", count: waitPosture, cls: "seg-threshold" });
  if (poorMarket > 0) segments.push({ label: "Poor market", count: poorMarket, cls: "seg-poor" });
  if (noMatch > 0) segments.push({ label: "No match", count: noMatch, cls: "seg-nomatch" });
  if (nonOptionable > 0) segments.push({ label: "No options", count: nonOptionable, cls: "seg-nooptions" });
  if (pending > 0) segments.push({ label: "Unresolved", count: pending, cls: "seg-pending" });
  if (missingData > 0) segments.push({ label: "Incomplete", count: missingData, cls: "seg-incomplete" });

  // Catch unaccounted
  const accounted = segments.reduce((s, seg) => s + seg.count, 0);
  const remainder = monitored - accounted;
  if (remainder > 0) segments.push({ label: "Other", count: remainder, cls: "seg-other" });

  return segments;
}

export function FunnelInfographic({ funnel, backendResolved }: OpportunitySurfaceProps) {
  const { monitored, pending } = funnel;
  const segments = buildSegments(funnel);
  const isAcquiring = pending > 0;
  const isMixed = backendResolved != null && backendResolved < funnel.resolved && isAcquiring;

  return (
    <div className="wd-opp-surface">
      <div className="wd-opp-bar">
        {segments.map((seg, i) => (
          <div
            key={i}
            className={`wd-opp-seg ${seg.cls}`}
            style={{ width: `${monitored > 0 ? (seg.count / monitored) * 100 : 0}%` }}
            title={`${seg.count} ${seg.label}`}
          />
        ))}
      </div>
      <div className="wd-opp-legend">
        {segments.filter(s => s.count > 0).map((seg, i) => (
          <span key={i} className={`wd-opp-item ${seg.cls}`}>
            <span className="wd-opp-count">{seg.count}</span> {seg.label}
          </span>
        ))}
        <span className="wd-opp-total">{monitored} ETFs</span>
        {isMixed && <span className="wd-opp-mixed">Prior + {backendResolved} current</span>}
      </div>
    </div>
  );
}
