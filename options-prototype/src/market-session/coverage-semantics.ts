/**
 * Multi-Level Coverage Semantics — Tracks how deeply each symbol has been evaluated.
 *
 * Levels (progressive):
 *   UNKNOWN           — Never evaluated
 *   EXPIRATION_KNOWN  — Know what expiration dates exist; no chain data
 *   PRIMARY_EVALUATED — One primary chain evaluated; have a candidate or explicit rejection
 *   DEEP_EVALUATED    — All eligible chains evaluated for this symbol
 *
 * Recommendation readiness is derived from the distribution of levels
 * across the entire universe for the current canonical session.
 */

// --- Symbol Evidence Level ---

export type SymbolEvidenceLevel =
  | "UNKNOWN"
  | "EXPIRATION_KNOWN"
  | "PRIMARY_EVALUATED"
  | "DEEP_EVALUATED";

// --- Recommendation Readiness ---

export type RecommendationReadiness =
  | "NO_EVIDENCE"
  | "EXPIRATION_DISCOVERY"
  | "PRIMARY_BUILDING"
  | "PRIMARY_COMPLETE"
  | "CONTENDER_DEEPENING"
  | "CONTENDER_VALIDATED"
  | "FULLY_EVALUATED";

// --- Universe Coverage ---

export interface UniverseCoverage {
  /** Total symbols in the universe */
  total: number;
  /** Symbols confirmed to have no options */
  confirmedAbsence: number;
  /** Symbols with expiration data only (no chain) */
  expirationOnly: number;
  /** Symbols evaluated at primary expiration */
  primaryEvaluated: number;
  /** Symbols evaluated across all eligible expirations */
  deepEvaluated: number;
  /** Symbols not yet evaluated at all */
  unknown: number;
  /** Derived readiness state */
  readiness: RecommendationReadiness;
  /** The canonical session this coverage represents */
  canonicalSessionDate: string;
}

// --- Per-Symbol State ---

export interface SymbolCoverageState {
  symbol: string;
  level: SymbolEvidenceLevel;
  /** Session date of the evidence (null if never evaluated) */
  evidenceSessionDate: string | null;
  /** Whether this symbol's evidence is from the current canonical session */
  currentSession: boolean;
}

// --- Coverage Computation ---

/**
 * Compute universe coverage from per-symbol states.
 */
export function computeUniverseCoverage(
  symbolStates: SymbolCoverageState[],
  confirmedAbsenceCount: number,
  canonicalSessionDate: string
): UniverseCoverage {
  let expirationOnly = 0;
  let primaryEvaluated = 0;
  let deepEvaluated = 0;
  let unknown = 0;

  for (const state of symbolStates) {
    switch (state.level) {
      case "UNKNOWN":
        unknown++;
        break;
      case "EXPIRATION_KNOWN":
        expirationOnly++;
        break;
      case "PRIMARY_EVALUATED":
        primaryEvaluated++;
        break;
      case "DEEP_EVALUATED":
        deepEvaluated++;
        break;
    }
  }

  const total = symbolStates.length + confirmedAbsenceCount;
  const readiness = deriveReadiness(total, confirmedAbsenceCount, unknown, expirationOnly, primaryEvaluated, deepEvaluated);

  return {
    total,
    confirmedAbsence: confirmedAbsenceCount,
    expirationOnly,
    primaryEvaluated,
    deepEvaluated,
    unknown,
    readiness,
    canonicalSessionDate,
  };
}

/**
 * Derive recommendation readiness from coverage distribution.
 */
function deriveReadiness(
  total: number,
  confirmedAbsence: number,
  _unknown: number,
  expirationOnly: number,
  primaryEvaluated: number,
  deepEvaluated: number
): RecommendationReadiness {
  const optionable = total - confirmedAbsence;

  if (optionable === 0) return "NO_EVIDENCE";
  if (primaryEvaluated === 0 && deepEvaluated === 0) {
    if (expirationOnly > 0) return "EXPIRATION_DISCOVERY";
    return "NO_EVIDENCE";
  }

  const evaluated = primaryEvaluated + deepEvaluated;

  // All optionable symbols fully deep-evaluated
  if (deepEvaluated >= optionable) {
    return "FULLY_EVALUATED";
  }

  // All optionable symbols at least primary-evaluated
  if (evaluated >= optionable) {
    if (deepEvaluated > 0) return "CONTENDER_VALIDATED";
    return "PRIMARY_COMPLETE";
  }

  // Some deep evaluation in progress but not all optionable covered yet
  if (deepEvaluated > 0) {
    return "CONTENDER_DEEPENING";
  }

  // Some primary evaluation done but not all optionable covered
  return "PRIMARY_BUILDING";
}
