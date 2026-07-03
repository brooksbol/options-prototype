/**
 * Domain calculation functions for the Options Prototype.
 *
 * Each function implements exactly one business rule.
 * All functions are pure: no side effects, no mutation, no exceptions.
 *
 * Reference: docs/02-domain.md (Business Rules BR-1 through BR-5)
 * Reference: docs/05-design.md (Calculation Module Design)
 */

import type { OptionType, Moneyness } from "./types";

/**
 * BR-1: Mid price calculation.
 * Returns the arithmetic mean of bid and ask.
 */
export function midPrice(bid: number, ask: number): number {
  return (bid + ask) / 2;
}

/**
 * BR-2: Premium per contract.
 * Total cash received for selling one contract (100 shares).
 */
export function premiumPerContract(mid: number): number {
  return mid * 100;
}

/**
 * BR-3: Annualized yield.
 * Premium as a percentage return on collateral, scaled to 365 days.
 *
 * Collateral rules:
 *   - Covered calls: collateral = underlyingPrice
 *   - Cash-secured puts: collateral = strike
 *
 * Returns a percentage (e.g., 12.5 means 12.5%).
 * Returns 0 if DTE is 0 (avoids division by zero).
 * Returns 0 if collateral is 0 (degenerate case).
 */
export function annualizedYield(
  mid: number,
  collateral: number,
  dte: number
): number {
  if (dte === 0 || collateral === 0) return 0;
  return (mid / collateral) * (365 / dte) * 100;
}

/**
 * BR-4: Moneyness classification.
 * ATM tolerance: $0.50 absolute.
 */
export function moneyness(
  strike: number,
  underlyingPrice: number,
  type: OptionType
): Moneyness {
  const distance = Math.abs(strike - underlyingPrice);
  if (distance <= 0.5) return "ATM";

  if (type === "CALL") {
    return strike < underlyingPrice ? "ITM" : "OTM";
  } else {
    return strike > underlyingPrice ? "ITM" : "OTM";
  }
}

/**
 * BR-5: Approximate assignment probability.
 * Uses |delta| as a proxy for probability of expiring ITM.
 * Returns a value between 0 and 1.
 */
export function assignmentProbability(delta: number): number {
  return Math.abs(delta);
}
