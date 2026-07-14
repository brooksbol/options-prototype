/**
 * PrimaryExpirationPolicy v1-provisional
 *
 * Governs which expiration is selected for the primary-chain evaluation pass.
 * This is NOT a discovered optimum. It is a configurable provisional target
 * selected to provide a uniform first-pass comparison across the universe.
 *
 * Selection algorithm:
 *   1. Filter all available expirations to the eligible DTE range (7–45)
 *   2. Sort by distance from targetDte
 *   3. Tie-break: prefer NEARER (lower DTE)
 *   4. Select first
 *   5. Record: selected date, dte, distance, rationale
 *
 * No additional hidden narrowing beyond the eligible range.
 * Monthly preference is explicitly deferred until expiration-class
 * identification is reliable.
 */

import type { Expiration } from "../domain/types";

// --- Policy Definition ---

export interface PrimaryExpirationPolicy {
  version: string;
  /** Configurable target DTE for uniform first-pass comparison */
  targetDte: number;
  /** Eligible DTE range (same as operational scan range) */
  eligibleDteRange: { min: number; max: number };
  /** Prefer standard monthly expiration when reliably detectable */
  preferMonthlyExpiration: boolean;
  /** Deterministic tie-breaker when two expirations equidistant from target */
  tieBreaker: "NEARER" | "FARTHER";
  /** Selection rationale (human-readable, for audit) */
  rationale: string;
}

export const DEFAULT_PRIMARY_EXPIRATION_POLICY: PrimaryExpirationPolicy = {
  version: "v1-provisional",
  targetDte: 21,
  eligibleDteRange: { min: 7, max: 45 },
  preferMonthlyExpiration: false,
  tieBreaker: "NEARER",
  rationale:
    "Provisional target DTE of 21 selected to provide a uniform first-pass comparison " +
    "across the universe. This is NOT a discovered optimum and NOT established operator " +
    "policy. The value is configurable and subject to revision from operational evidence. " +
    "Selection: filter to eligible range (7–45 DTE), choose nearest to target, " +
    "tie-break toward nearer. No additional narrowing beyond the eligible range. " +
    "Monthly preference deferred until expiration-class identification is reliable.",
};

// --- Selection Result ---

export interface PrimaryExpirationSelection {
  /** Selected expiration (null if none eligible) */
  selected: Expiration | null;
  /** Distance from target DTE (absolute value) */
  distanceFromTarget: number | null;
  /** Number of eligible expirations considered */
  eligibleCount: number;
  /** Policy version used */
  policyVersion: string;
  /** Human-readable explanation of the selection */
  explanation: string;
}

// --- Selection Algorithm ---

/**
 * Select the primary expiration for a symbol's first-pass evaluation.
 *
 * Algorithm:
 * 1. Filter to eligible DTE range
 * 2. Sort by |dte - targetDte|, with tie-breaker
 * 3. Select the closest
 */
export function selectPrimaryExpiration(
  expirations: Expiration[],
  policy: PrimaryExpirationPolicy = DEFAULT_PRIMARY_EXPIRATION_POLICY
): PrimaryExpirationSelection {
  // 1. Filter to eligible range
  const eligible = expirations.filter(
    (e) => e.dte >= policy.eligibleDteRange.min && e.dte <= policy.eligibleDteRange.max
  );

  if (eligible.length === 0) {
    return {
      selected: null,
      distanceFromTarget: null,
      eligibleCount: 0,
      policyVersion: policy.version,
      explanation: `No expiration within eligible range ${policy.eligibleDteRange.min}–${policy.eligibleDteRange.max} DTE. ${expirations.length} total expirations available.`,
    };
  }

  // 2. Sort by distance from target, with tie-breaker
  const sorted = [...eligible].sort((a, b) => {
    const distA = Math.abs(a.dte - policy.targetDte);
    const distB = Math.abs(b.dte - policy.targetDte);

    if (distA !== distB) return distA - distB;

    // Tie-break
    if (policy.tieBreaker === "NEARER") return a.dte - b.dte;
    return b.dte - a.dte;
  });

  // 3. Select the closest
  const selected = sorted[0];
  const distance = Math.abs(selected.dte - policy.targetDte);

  return {
    selected,
    distanceFromTarget: distance,
    eligibleCount: eligible.length,
    policyVersion: policy.version,
    explanation: `Selected ${selected.date} (${selected.dte} DTE, distance ${distance} from target ${policy.targetDte}). ${eligible.length} eligible expiration${eligible.length > 1 ? "s" : ""} in ${policy.eligibleDteRange.min}–${policy.eligibleDteRange.max} DTE range.`,
  };
}
