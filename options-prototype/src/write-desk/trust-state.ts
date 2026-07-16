/**
 * Trust State Derivation — determines operator confidence in displayed recommendations.
 *
 * Trust is derived from the evidence supporting the DISPLAYED recommendation set.
 * Activity is independent of trust (system may be updating while trust is Current).
 *
 * See: docs/15-evidence-state-semantics.md
 */

import type { PutCandidate } from "./scan-orchestrator";

// --- Trust States ---

export type TrustState = "current" | "partially_current" | "stale_but_usable" | "degraded" | "unavailable";

export type ActivityState = "updating" | "idle";

export interface EvidenceStateIndicator {
  trust: TrustState;
  trustLabel: string;
  activity: ActivityState;
  covered: number;
  universe: number;
  freshnessLabel: string;
  freshnessSeconds: number | null;
  color: "green" | "yellow" | "orange" | "red";
}

// --- Policy Defaults (configurable thresholds) ---

const CURRENT_THRESHOLD_MS = 5 * 60 * 1000;     // 5 minutes
const STALE_THRESHOLD_MS = 30 * 60 * 1000;       // 30 minutes
const COVERAGE_THRESHOLD = 0.95;                   // 95%
const FAILURE_THRESHOLD = 0.05;                    // 5%

// --- Derivation ---

export interface TrustDerivationInput {
  /** Coverage from the backend snapshot */
  coverage: {
    ready: number;
    absent: number;
    pending: number;
    failed: number;
  } | null;
  /** Total universe size */
  universe: number;
  /** When the snapshot was generated (ISO string) */
  generatedAt: string | null;
  /** Whether evidence service is reachable */
  serviceAvailable: boolean;
  /** Whether the session is closed (sealed evidence is always "current") */
  sessionClosed: boolean;
  /** Whether backend is actively acquiring */
  isAcquiring: boolean;
}

export function deriveTrustState(input: TrustDerivationInput): EvidenceStateIndicator {
  const { coverage, universe, generatedAt, serviceAvailable, sessionClosed, isAcquiring } = input;

  // Unavailable: no service or no evidence
  if (!serviceAvailable || !coverage || !generatedAt) {
    return {
      trust: "unavailable",
      trustLabel: "Unavailable",
      activity: "idle",
      covered: 0,
      universe,
      freshnessLabel: "—",
      freshnessSeconds: null,
      color: "red",
    };
  }

  const covered = coverage.ready + coverage.absent;
  const coverageFraction = universe > 0 ? covered / universe : 0;
  const failedFraction = universe > 0 ? coverage.failed / universe : 0;

  // Freshness: seconds since snapshot was generated
  const freshnessMs = Date.now() - new Date(generatedAt).getTime();
  const freshnessSeconds = Math.round(freshnessMs / 1000);

  // Activity
  const activity: ActivityState = isAcquiring ? "updating" : "idle";

  // Degraded: high failure rate
  if (failedFraction > FAILURE_THRESHOLD) {
    return {
      trust: "degraded",
      trustLabel: "Degraded",
      activity,
      covered,
      universe,
      freshnessLabel: `${coverage.failed} failures`,
      freshnessSeconds,
      color: "orange",
    };
  }

  // Sealed session: evidence from canonical session is always current regardless of age
  if (sessionClosed) {
    return {
      trust: coverageFraction >= COVERAGE_THRESHOLD ? "current" : "partially_current",
      trustLabel: coverageFraction >= COVERAGE_THRESHOLD ? "Current" : "Partially Current",
      activity,
      covered,
      universe,
      freshnessLabel: "Sealed today",
      freshnessSeconds,
      color: coverageFraction >= COVERAGE_THRESHOLD ? "green" : "yellow",
    };
  }

  // Regular session: use time-based freshness
  const freshnessLabel = freshnessSeconds < 60
    ? `${freshnessSeconds}s ago`
    : freshnessSeconds < 3600
      ? `${Math.round(freshnessSeconds / 60)}m ago`
      : `${Math.round(freshnessSeconds / 3600)}h ago`;

  if (freshnessMs <= CURRENT_THRESHOLD_MS) {
    return {
      trust: coverageFraction >= COVERAGE_THRESHOLD ? "current" : "partially_current",
      trustLabel: coverageFraction >= COVERAGE_THRESHOLD ? "Current" : "Partially Current",
      activity,
      covered,
      universe,
      freshnessLabel,
      freshnessSeconds,
      color: coverageFraction >= COVERAGE_THRESHOLD ? "green" : "yellow",
    };
  }

  if (freshnessMs <= STALE_THRESHOLD_MS) {
    return {
      trust: "stale_but_usable",
      trustLabel: "Stale but Usable",
      activity,
      covered,
      universe,
      freshnessLabel,
      freshnessSeconds,
      color: "yellow",
    };
  }

  // Older than 30 minutes during regular session → degraded
  return {
    trust: "degraded",
    trustLabel: "Degraded",
    activity,
    covered,
    universe,
    freshnessLabel,
    freshnessSeconds,
    color: "orange",
  };
}
