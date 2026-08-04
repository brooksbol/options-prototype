/**
 * Moneyness Presentation Classification
 *
 * Derives a visual state from MonitoredPosition.moneyness for tile rendering.
 * This is purely a presentation concern — the raw signed moneyness on
 * MonitoredPosition is unchanged.
 *
 * Semantic rule: the classification answers ONLY
 *   "Where is the underlying relative to this option's strike?"
 * It does NOT mean good/bad, safe/dangerous, or profitable/unprofitable.
 */

import type { MonitoredPosition } from "../portfolio/position-monitoring";

export type MoneynessState = "otm" | "atm" | "itm" | "none";

/**
 * ATM tolerance: positions within ±1% of strike are considered "near strike."
 * This is a presentation threshold, not a domain fact.
 */
export const ATM_TOLERANCE = 0.01;

/**
 * Classify a monitored position's moneyness into a visual state.
 *
 * - otm: underlying safely away from strike (moneyness < -tolerance)
 * - atm: underlying near the strike (|moneyness| <= tolerance)
 * - itm: underlying has crossed the strike (moneyness > +tolerance)
 * - none: no usable observation available
 */
export function classifyMoneyness(position: MonitoredPosition): MoneynessState {
  if (position.moneyness == null) return "none";
  if (position.moneyness > ATM_TOLERANCE) return "itm";
  if (position.moneyness < -ATM_TOLERANCE) return "otm";
  return "atm";
}

/**
 * Get the display label for a moneyness state.
 * Returns null for "none" (no observation — no label to show).
 */
export function moneynessLabel(state: MoneynessState): string | null {
  switch (state) {
    case "otm": return "OTM";
    case "atm": return "ATM";
    case "itm": return "ITM";
    case "none": return null;
  }
}

/**
 * Format the complete moneyness display string: category + signed percentage.
 *
 * Examples:
 *   "ITM +36.9%"
 *   "OTM −6.7%"
 *   "ATM +0.4%"
 *   null (no observation)
 *
 * Uses the normalized signed moneyness from Position Monitoring directly.
 * Does not recompute option direction.
 */
export function formatMoneynessDisplay(position: MonitoredPosition): string | null {
  const state = classifyMoneyness(position);
  const label = moneynessLabel(state);
  if (label == null || position.moneyness == null) return null;

  const pct = position.moneyness * 100;
  // Normalize negative zero to positive zero
  const displayPct = Object.is(pct, -0) || (Math.abs(pct) < 0.05) ? 0 : pct;
  const sign = displayPct >= 0 ? "+" : "";
  return `${label} ${sign}${displayPct.toFixed(1)}%`;
}
