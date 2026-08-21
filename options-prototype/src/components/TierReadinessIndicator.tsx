/**
 * TierReadinessIndicator — compact operator-facing evidence tier freshness.
 *
 * Lives in the application shell header (visible across all surfaces).
 * Shows readiness by tier rather than a single aggregate number.
 * Follows State-Oriented Console principle: represents environment, not machinery.
 *
 * Semantics:
 *   Opening X/Y current — X symbols have current-session chain evidence
 *   A X/Y fresh — X Class A symbols have chains within 15-min freshness target
 *   B X/Y fresh — X Class B symbols are within 120-min threshold (or not yet due)
 *   C/D N pending — N lifecycle items awaiting work
 *
 * When a tier is fully satisfied, shows ✓ instead of a fraction.
 * Experiment artifact. Expression may evolve if the experiment succeeds.
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

  const { opening, eligible, due, schedulerState } = readiness;

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

  // Opening set: "X have current-session chain evidence"
  if (opening) {
    if (opening.burstComplete) {
      segments.push(`Opening ${opening.setSize}/${opening.setSize} \u2713`);
    } else {
      segments.push(`Opening ${opening.currentCount}/${opening.setSize} current`);
    }
  }

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

  if (segments.length === 0) return null;

  // Color: yellow during opening burst, green when complete
  let colorClass = "as-tier-green";
  if (opening && !opening.burstComplete) {
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
