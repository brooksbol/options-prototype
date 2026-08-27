/**
 * TierReadinessIndicator — compact operator-facing evidence tier freshness.
 *
 * Lives in the application shell header (visible across all surfaces).
 * Shows readiness by tier rather than a single aggregate number.
 * Follows State-Oriented Console principle: represents environment, not machinery.
 *
 * Semantics:
 *   A X/Y fresh — X Class A symbols have chains within 15-min freshness target
 *   B X/Y fresh — X Class B symbols are within 120-min threshold (or not yet due)
 *   C/D N pending — N lifecycle items awaiting work
 *   DTE surface X/Y current — X weekly-capable symbols have their full 7-45 DTE
 *     surface fresh; "DTE surface degraded N/Y" when part of the surface has aged out
 *
 * When a tier is fully satisfied, shows ✓ instead of a fraction.
 *
 * The former experimental "Opening N/N" segment was removed during the Aug 2026
 * market-open operational recovery — it was not an operator-approved readiness model.
 */

import type { TierReadiness } from "../hooks/useOpeningReadiness";

interface Props {
  readiness: TierReadiness | null;
  error?: boolean;
}

export function TierReadinessIndicator({ readiness, error }: Props) {
  // Backend unreachable
  if (!readiness && error) {
    return (
      <span className="as-tier-readiness as-tier-yellow">
        Evidence: offline
      </span>
    );
  }

  if (!readiness) return null;

  const { monitoredPositions, decisionCoverage, eligible, due, schedulerState } = readiness;

  // Show a compact scheduler-state label when no tier data is available yet
  if (schedulerState === "unknown") return null;
  if (schedulerState === "stopped" || schedulerState === "starting") {
    return (
      <span className="as-tier-readiness as-tier-yellow">
        Evidence: starting
      </span>
    );
  }
  if (schedulerState === "session_blocked") {
    return (
      <span className="as-tier-readiness as-tier-green">
        Evidence: sealed
      </span>
    );
  }

  const segments: string[] = [];

  // Class A: "X are within 15-min freshness target"
  // fresh = eligible - due (due = past target, needing refresh)
  if (eligible.classA > 0) {
    const freshA = eligible.classA - due.classA;
    if (due.classA === 0) {
      segments.push(`A ${eligible.classA}/${eligible.classA} \u2713`);
    } else {
      segments.push(`A ${freshA}/${eligible.classA} fresh`);
    }
  }

  // Class B: "X are within 120-min threshold (not yet due)"
  if (eligible.classB > 0) {
    const freshB = eligible.classB - due.classB;
    if (due.classB === 0) {
      segments.push("B current");
    } else {
      segments.push(`B ${freshB}/${eligible.classB} fresh`);
    }
  }

  // C/D lifecycle: only show if there's pending work
  const cdDue = due.classC + due.classD;
  if (cdDue > 0) {
    segments.push(`C/D ${cdDue} pending`);
  }

  // Monitored positions (PL-EVID-01) — the operator's held positions (capital at risk).
  // Primary fraction is ALWAYS current/total. This is an operator health signal.
  //
  // NOTE: the multi-DTE "DTE surface x/64" coverage is deliberately NOT shown here.
  // We established during the Aug 2026 recovery that 64 is the wrong denominator — only
  // trade-relevant (monitored + Class-A) symbols earn a tight surface obligation, so
  // x/64 stays low by design and is diagnostic telemetry only (available in /api/status),
  // NOT an operator health target or SLO. Surfacing it in the primary header preserved a
  // misleading interpretation. The Deployment board shows the decision surface directly.
  if (monitoredPositions && monitoredPositions.total > 0) {
    if (monitoredPositions.degraded === 0) {
      segments.push(`Positions ${monitoredPositions.total}/${monitoredPositions.total} \u2713`);
    } else {
      segments.push(`Positions ${monitoredPositions.current}/${monitoredPositions.total} current`);
    }
  }

  // Decision Coverage — the honest "best available?" completeness signal. If a material
  // fraction of the eligible opportunity space is stale, the Deployment board reflects
  // only the current subset and must NOT be read as best-across-the-universe.
  let coverageIncomplete = false;
  if (decisionCoverage && decisionCoverage.eligibleSymbols > 0) {
    const { eligibleSymbols, currentSymbols } = decisionCoverage;
    const pct = Math.round((currentSymbols / eligibleSymbols) * 100);
    // "Complete enough" threshold: >=90% of the eligible space currently participating.
    coverageIncomplete = pct < 90;
    if (coverageIncomplete) {
      segments.push(`Decision coverage ${currentSymbols}/${eligibleSymbols} symbols \u00B7 ${pct}% current \u2014 incomplete`);
    } else {
      segments.push(`Decision coverage ${currentSymbols}/${eligibleSymbols} \u00B7 ${pct}% \u2713`);
    }
  }

  if (segments.length === 0) return null;

  // Color: yellow when held positions are stale (capital at risk — most serious), when
  // Decision coverage is materially incomplete (board is not best-available), or when
  // Class A is behind. Multi-DTE surface coverage is NOT a health input (diagnostic only).
  let colorClass = "as-tier-green";
  const positionsDegraded = monitoredPositions != null && monitoredPositions.degraded > 0;
  if (positionsDegraded || coverageIncomplete) {
    colorClass = "as-tier-yellow";
  } else if (due.classA > eligible.classA * 0.5) {
    colorClass = "as-tier-yellow";
  }

  return (
    <span className={`as-tier-readiness ${colorClass}`}>
      {segments.join(" \u00B7 ")}
    </span>
  );
}
