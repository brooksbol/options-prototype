/**
 * Call Empty State Diagnosis
 *
 * Derives an evidence-based explanation for why no covered-call candidates
 * are shown. Each condition is checked in priority order using data from
 * the current snapshot and recommendation state.
 *
 * The output is an operator-facing message that identifies the specific
 * cause rather than a generic "no results" state.
 */

import type { InventoryPosition } from "./types";

export interface CallEmptyStateInput {
  inventory: InventoryPosition[];
  hasScanCompleted: boolean;
  hasEvidenceMeta: boolean;
}

// --- Candidate Identity ---

/**
 * Contract identity for selection validity.
 * A selected recommendation is valid only while a candidate with this
 * identity exists in the current recommendation set.
 */
export interface CandidateIdentity {
  symbol: string;
  expiration: string;
  strike: number;
}

/**
 * Determine whether a selected candidate still exists in a result set.
 * Used by Deployment to validate put and call selections after recomputation.
 *
 * Identity = symbol + expiration + strike.
 */
export function candidateExistsInResults(
  selected: CandidateIdentity,
  results: CandidateIdentity[]
): boolean {
  return results.some(c =>
    c.symbol === selected.symbol &&
    c.expiration === selected.expiration &&
    c.strike === selected.strike
  );
}

/**
 * Derive the operator-facing explanation for an empty call candidates state.
 *
 * Priority order:
 * 1. No inventory at all
 * 2. No shares owned
 * 3. All shares encumbered by existing short calls
 * 4. Free shares exist but none reach 100-share contract threshold
 * 5. Evidence not yet available
 * 6. Policy didn't produce qualifying contracts
 */
export function deriveCallEmptyState(input: CallEmptyStateInput): string {
  const { inventory, hasScanCompleted, hasEvidenceMeta } = input;

  // No inventory at all
  if (inventory.length === 0) {
    return "No held shares available for covered calls.";
  }

  // No shares owned
  const totalShares = inventory.reduce((sum, p) => sum + p.sharesOwned, 0);
  if (totalShares === 0) {
    return "No held shares available for covered calls.";
  }

  // All shares encumbered
  const totalFree = inventory.reduce((sum, p) => sum + p.sharesFree, 0);
  if (totalFree === 0) {
    return "Held shares are fully encumbered by existing short calls.";
  }

  // Free shares exist but none reach 100-share contract threshold
  const hasContractCapacity = inventory.some(p => p.maxAdditionalContracts > 0);
  if (!hasContractCapacity) {
    const bestPosition = inventory.reduce((best, p) => p.sharesFree > best.sharesFree ? p : best, inventory[0]);
    return `Free shares do not form a complete 100-share contract (largest: ${bestPosition.symbol} with ${bestPosition.sharesFree} free).`;
  }

  // Free capacity exists but no scan has completed yet
  if (!hasScanCompleted && !hasEvidenceMeta) {
    return "Call evidence is not available yet.";
  }

  // Free capacity and evidence exist, but no contracts passed policy
  return "No call contracts currently satisfy policy for held inventory.";
}
