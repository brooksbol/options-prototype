/**
 * Opportunity Breakdown — Two-level distribution within the candidate board.
 *
 * Level 1: Segmented bar showing the entire universe partitioned into outcomes.
 * Level 2: Text breakdown distinguishing "not recommended" (policy) from "not available" (structural).
 *
 * Semantics shared with table posture badges:
 *   Green  = Actionable
 *   Blue   = Edge
 *   Amber  = Below threshold (WAIT — not recommended)
 *   Red    = Poor market (hard-no — execution unsafe)
 *   Gray   = No match (no contract meeting policy)
 *   Slate  = No options / incomplete (structurally unavailable)
 */

import type { RecommendationFunnel } from "../write-desk/recommend";

interface Props {
  funnel: RecommendationFunnel;
  backendResolved?: number;
}

export function FunnelInfographic({ funnel, backendResolved }: Props) {
  const { monitored, eligible, actionable, edge, nonOptionable, pending, waitPosture, exclusions } = funnel;

  // Extract specific exclusion counts
  const poorMarket = exclusions.find(e => e.reason.includes("Hard-no") || e.reason.includes("execution"))?.count ?? 0;
  const noDelta = exclusions.find(e => e.reason.includes("delta"))?.count ?? 0;
  const noDte = exclusions.find(e => e.reason.includes("No expiration"))?.count ?? 0;
  const noChain = exclusions.find(e => e.reason.includes("Missing chain"))?.count ?? 0;
  const noContract = exclusions.find(e => e.reason.includes("No qualifying"))?.count ?? 0;
  const productStructure = exclusions.find(e => e.reason.includes("Product structure"))?.count ?? 0;

  // Two-level grouping
  const policyRejected = waitPosture + poorMarket + noDelta + noDte + noContract + productStructure;
  const structurallyUnavailable = nonOptionable + noChain + pending;
  const noMatch = noDelta + noDte + noContract + productStructure;

  // Bar segments (proportional to monitored)
  const segments = [
    { count: actionable, cls: "seg-actionable", label: "Actionable" },
    { count: edge, cls: "seg-edge", label: "Edge" },
    { count: waitPosture, cls: "seg-wait", label: "Below threshold" },
    { count: poorMarket, cls: "seg-poor", label: "Poor market" },
    { count: noMatch, cls: "seg-nomatch", label: "No match" },
    { count: nonOptionable, cls: "seg-nooptions", label: "No options" },
    { count: noChain + pending, cls: "seg-pending", label: "Unresolved" },
  ].filter(s => s.count > 0);

  // Catch unaccounted
  const accounted = segments.reduce((s, seg) => s + seg.count, 0);
  const remainder = monitored - accounted;
  if (remainder > 0) segments.push({ count: remainder, cls: "seg-other", label: "Other" });

  const isAcquiring = pending > 0;
  const isMixed = backendResolved != null && backendResolved < funnel.resolved && isAcquiring;

  return (
    <div className="wd-breakdown">
      {/* Segmented bar */}
      <div className="wd-breakdown-bar">
        {segments.map((seg, i) => (
          <div
            key={i}
            className={`wd-breakdown-seg ${seg.cls}`}
            style={{ width: `${monitored > 0 ? (seg.count / monitored) * 100 : 0}%` }}
            title={`${seg.count} ${seg.label}`}
          />
        ))}
      </div>

      {/* Two-level text breakdown */}
      <div className="wd-breakdown-text">
        <span className="wd-breakdown-line wd-breakdown-recommended">
          <strong>{eligible}</strong> Recommendations
          {actionable > 0 && <span className="wd-breakdown-detail seg-actionable">{actionable} Actionable</span>}
          {edge > 0 && <span className="wd-breakdown-detail seg-edge">{edge} Edge</span>}
        </span>
        {policyRejected > 0 && (
          <span className="wd-breakdown-line wd-breakdown-rejected">
            Not recommended:
            {waitPosture > 0 && <span className="wd-breakdown-detail seg-wait">{waitPosture} Below threshold</span>}
            {poorMarket > 0 && <span className="wd-breakdown-detail seg-poor">{poorMarket} Poor market</span>}
            {noMatch > 0 && <span className="wd-breakdown-detail seg-nomatch">{noMatch} No match</span>}
          </span>
        )}
        {structurallyUnavailable > 0 && (
          <span className="wd-breakdown-line wd-breakdown-unavailable">
            Not available:
            {nonOptionable > 0 && <span className="wd-breakdown-detail seg-nooptions">{nonOptionable} No options</span>}
            {(noChain + pending) > 0 && <span className="wd-breakdown-detail seg-pending">{noChain + pending} Incomplete</span>}
          </span>
        )}
        <span className="wd-breakdown-total">{monitored} ETFs</span>
        {isMixed && <span className="wd-breakdown-mixed">Prior baseline + {backendResolved} current</span>}
      </div>
    </div>
  );
}
