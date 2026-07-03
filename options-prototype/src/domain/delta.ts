/**
 * Delta matching module for the Options Prototype.
 *
 * Implements BR-6: find the contract closest to a target delta.
 * Tie-breaking is delegated to the Policy Engine — not hard-coded here.
 *
 * Implementation note: the matching loop internally computes distances
 * and detects tie conditions. The structure preserves this intermediate
 * reasoning in local variables, making it capturable by a future
 * decision-record enhancement without restructuring the algorithm.
 *
 * Reference: docs/02-domain.md (BR-6), docs/05-design.md (Delta Matching Module)
 */

import type { OptionContract } from "./types";
import { type DeltaTieBreaker, resolveTieBreaker } from "./policy";

/**
 * BR-6: Find the contract closest to target delta.
 *
 * Compares |contract.delta| to targetDelta for all contract types.
 * Tie-breaker is provided by policy — not hard-coded.
 *
 * Returns null if the contracts array is empty.
 */
export function findClosestToDelta(
  contracts: OptionContract[],
  targetDelta: number,
  tieBreaker: DeltaTieBreaker
): OptionContract | null {
  if (contracts.length === 0) return null;

  let closest = contracts[0];
  let minDistance = deltaDistance(closest, targetDelta);

  for (let i = 1; i < contracts.length; i++) {
    const contract = contracts[i];
    const distance = deltaDistance(contract, targetDelta);

    if (distance < minDistance) {
      // Clear winner — closer to target
      closest = contract;
      minDistance = distance;
    } else if (distance === minDistance) {
      // Tie detected — delegate to policy
      closest = resolveTieBreaker(closest, contract, tieBreaker);
    }
    // else: current closest remains
  }

  return closest;
}

/**
 * Compute the absolute distance between a contract's delta and the target.
 * Uses |contract.delta| so that puts (negative delta) and calls (positive delta)
 * are compared on the same scale.
 */
function deltaDistance(contract: OptionContract, targetDelta: number): number {
  return Math.abs(Math.abs(contract.delta) - targetDelta);
}
