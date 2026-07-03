/**
 * Policy domain for the Options Prototype.
 *
 * Policy defines screening criteria and evaluation preferences.
 * The evaluation engine consumes policy — it does not own it.
 *
 * Distinction from calculations:
 *   - Calculations express domain definitions (one correct answer).
 *   - Policies express user intent and judgment (reasonable people could disagree).
 *
 * Reference: docs/05-design.md (Policy Domain section)
 */

import type { OptionContract } from "./types";

/**
 * Delta tie-breaker strategies.
 * Determines which contract wins when two are equidistant from target delta.
 */
export type DeltaTieBreaker =
  | "PreferOTM"
  | "PreferITM"
  | "PreferHigherStrike"
  | "PreferLowerStrike";

/**
 * Screening policy for Slice 1.
 * Extensible for future criteria (yield thresholds, DTE range, moneyness filters).
 */
export interface DeltaPolicy {
  targetDelta: number; // 0.01 to 0.99, default 0.30
  tieBreaker: DeltaTieBreaker; // default: "PreferOTM"
}

export const DEFAULT_DELTA_POLICY: DeltaPolicy = {
  targetDelta: 0.3,
  tieBreaker: "PreferOTM",
};

/**
 * Resolve a tie-breaker between two equidistant contracts.
 * Consumes the policy — does not hard-code preference.
 *
 * Precondition: both contracts should have the same `type` field.
 * This is enforced by caller discipline (contracts come from the same
 * calls[] or puts[] array), not by the type system.
 */
export function resolveTieBreaker(
  a: OptionContract,
  b: OptionContract,
  tieBreaker: DeltaTieBreaker
): OptionContract {
  switch (tieBreaker) {
    case "PreferOTM":
      if (a.type === "CALL") {
        return a.strike >= b.strike ? a : b;
      } else {
        return a.strike <= b.strike ? a : b;
      }
    case "PreferITM":
      if (a.type === "CALL") {
        return a.strike <= b.strike ? a : b;
      } else {
        return a.strike >= b.strike ? a : b;
      }
    case "PreferHigherStrike":
      return a.strike >= b.strike ? a : b;
    case "PreferLowerStrike":
      return a.strike <= b.strike ? a : b;
  }
}
