/**
 * Write Desk — Execution Assessment Policy
 *
 * Provisional thresholds for execution quality scoring and posture assignment.
 * All values are explicit, configurable, versioned, and auditable.
 *
 * These are initial hypotheses designed to get close enough to the
 * practical go/no-go edge for controlled real-trade experimentation.
 * They will be revised as actual execution evidence accumulates.
 */

export interface ExecutionPolicy {
  version: string;

  // --- True Hard-No Exclusions ---
  /** Spread above this absolute floor = hard exclude (truly unusable market) */
  hardExcludeSpreadPercent: number;
  /** OI at exactly 0 = hard exclude */
  hardExcludeZeroOI: boolean;
  /** Zero or invalid bid = hard exclude */
  hardExcludeZeroBid: boolean;

  // --- Scoring Weights (sum to 1.0) ---
  weights: {
    spread: number;
    openInterest: number;
    volume: number;
    premium: number;
  };

  // --- Scoring References ---
  /** Spread at or below this = full score for spread component */
  preferredSpreadPercent: number;
  /** OI at or above this = full score for OI component */
  preferredOpenInterest: number;
  /** Volume at or above this = full score for volume component */
  preferredVolume: number;
  /** Bid premium at or above this = full score for premium component */
  preferredMinBid: number;

  // --- Posture Thresholds ---
  /** Score >= this → ACTIONABLE */
  actionableFloor: number;
  /** Score >= this → EDGE (below actionable) */
  edgeFloor: number;
  /** Score >= this → WAIT (below edge) */
  waitFloor: number;
  /** Below waitFloor → should have been hard-no (safety net) */
}

/**
 * Initial provisional execution policy.
 *
 * Rationale for each value:
 * - hardExcludeSpreadPercent: 80% — truly unusable; midpoint is meaningless
 * - preferredSpreadPercent: 15% — current Velvet Rope quality reference
 * - preferredOpenInterest: 50 — current VR minimum
 * - preferredVolume: 10 — minimal daily activity
 * - preferredMinBid: 0.10 — at least $10/contract premium
 * - actionableFloor: 65 — above preferred range on most components
 * - edgeFloor: 35 — plausible for controlled experimentation
 * - waitFloor: 15 — evidence present but too weak for action
 */
export const DEFAULT_EXECUTION_POLICY: ExecutionPolicy = {
  version: "v1-provisional",

  hardExcludeSpreadPercent: 80,
  hardExcludeZeroOI: true,
  hardExcludeZeroBid: true,

  weights: {
    spread: 0.40,
    openInterest: 0.25,
    volume: 0.15,
    premium: 0.20,
  },

  preferredSpreadPercent: 15,
  preferredOpenInterest: 50,
  preferredVolume: 10,
  preferredMinBid: 0.10,

  actionableFloor: 65,
  edgeFloor: 35,
  waitFloor: 15,
};
