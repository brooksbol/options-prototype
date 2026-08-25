/**
 * Moneyness History — Demo synthetic spot history + per-contract derivation.
 *
 * Key modeling distinction:
 *   Market history belongs to the UNDERLYING.
 *   Moneyness history belongs to the CONTRACT and is derived from that shared market history.
 *
 * Two contracts on the same underlying with different strikes consume the same
 * spot series but produce different moneyness trajectories. This is correct and
 * demonstrates why moneyness sparkline is more informative than a spot sparkline.
 *
 * The synthetic history generator produces a deterministic session's worth of
 * observations (~26 points at ~15-min cadence) for each underlying, seeded by
 * the symbol name alone (not strike or contract identity).
 */

import type { PositionType } from "../portfolio/position-monitoring";

// --- Types ---

export interface MoneynessPoint {
  /** Fractional position within the trading session (0 = 09:30 ET, 1 = 16:00 ET) */
  t: number;
  /** Signed moneyness: same formula as position-monitoring.ts */
  moneyness: number;
}

// --- Underlying-Level Spot History ---

/** Number of observations per synthetic session (~15-min cadence over 6.5 hours) */
const SESSION_POINTS = 26;

/**
 * Simple deterministic hash from a string, producing a value in [0, 1).
 * Used to seed the random walk per underlying.
 */
function hashSeed(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  }
  return (Math.abs(h) % 10000) / 10000;
}

/**
 * Seeded pseudo-random number generator (simple LCG).
 * Returns a function that produces values in [0, 1) on each call.
 */
function seededRng(seed: number): () => number {
  let state = Math.floor(seed * 2147483647) || 1;
  return () => {
    state = (state * 1664525 + 1013904223) & 0x7fffffff;
    return state / 0x7fffffff;
  };
}

/**
 * Generate a synthetic intraday spot history for a single underlying.
 *
 * The series:
 * - Has SESSION_POINTS evenly spaced observations.
 * - Ends at exactly `currentSpot` (the Demo scenario's current market price).
 * - Walks backward from currentSpot using a seeded random walk so the
 *   trajectory is deterministic per symbol.
 * - Uses realistic intraday volatility (~0.3-0.8% daily range scaled to session).
 * - Certain symbols have deliberate directional bias to produce crossover
 *   trajectories (started on the other side of strike, ended on current side).
 *
 * The result is cached per symbol so multiple contracts on the same underlying
 * share the exact same spot series.
 */
const spotHistoryCache = new Map<string, number[]>();

/**
 * Crossover biases: fractional shift applied to the starting price relative to current.
 * Positive = start higher than current spot (underlying was higher earlier, drifted down).
 * Negative = start lower than current spot (underlying was lower earlier, rallied up).
 *
 * Designed so specific contract/spot/strike combinations cross zero during the session:
 *
 *   URA: spot 34.50, put strike 35. Currently ITM (spot < strike).
 *     Need: started OTM (spot > strike earlier) → crossed into ITM.
 *     → positive bias (start higher, ~$36) → green→red for put.
 *
 *   BNO: spot 55.00, BW strike 54. Currently ITM (spot > strike).
 *     Need: started OTM (spot < strike earlier) → crossed into ITM.
 *     → negative bias (start lower, ~$52) → red→green for BW.
 *
 *   XLE: spot 59.50, call strike 60. Currently OTM (spot < strike).
 *     Need: started ITM (spot > strike earlier) → crossed into OTM.
 *     → positive bias (start higher, ~$61.5) → neutral for CC.
 *
 *   COPX: spot 39.80, put strike 38. Currently OTM (spot > strike).
 *     Need: started ITM (spot < strike) → crossed OTM → multi-cross territory.
 *     → negative bias (start lower, ~$37.5) then rally through.
 *
 *   GDXJ: spot 46.80, BW strike 47. Currently near ATM/OTM.
 *     Need: started deeper OTM → approached/crossed → fell back.
 *     → negative bias (start lower, ~$45) → red→briefly-green→red for BW.
 *
 *   EWY: spot 183, BW strike 187. Currently OTM (spot < strike for BW).
 *     Need: started near ITM → fell to OTM.
 *     → positive bias (start higher, ~$189) → green→red for BW.
 */
const CROSSOVER_BIASES: Record<string, number> = {
  URA: +0.05,   // start ~$36.2 (above $35 strike) → fell below → put went OTM→ITM (green→red)
  BNO: -0.06,   // start ~$51.7 (below $54 strike) → rallied above → BW went OTM→ITM (red→green)
  XLE: +0.04,   // start ~$61.9 (above $60 strike) → fell below → call went ITM→OTM
  COPX: -0.06,  // start ~$37.4 (below $38 strike) → rallied above → put went ITM→OTM (red→green)
  GDXJ: -0.05,  // start ~$44.5 (below $47 strike) → rally toward/through → BW OTM→near-ATM
  EWY: +0.04,   // start ~$190 (above $187 strike) → fell below → BW ITM→OTM (green→red)
};

export function generateDemoSpotHistory(symbol: string, currentSpot: number): number[] {
  const key = symbol.toUpperCase();
  const cached = spotHistoryCache.get(key);
  if (cached) return cached;

  const seed = hashSeed(key);
  const rng = seededRng(seed);

  const bias = CROSSOVER_BIASES[key] ?? 0;

  // Build the path backward from currentSpot so the final value is exact.
  // Apply directional bias as a linear drift from start to end.
  // Daily vol ~0.5%, session is ~half a day, so session vol ~0.35%.
  // For biased symbols, increase vol slightly to make crossings more visible.
  const baseSessionVol = 0.0035 * currentSpot;
  const sessionVol = bias !== 0 ? baseSessionVol * 1.5 : baseSessionVol;
  const stepVol = sessionVol / Math.sqrt(SESSION_POINTS);

  const prices: number[] = new Array(SESSION_POINTS);
  prices[SESSION_POINTS - 1] = currentSpot;

  // The starting price should be shifted by the bias amount
  const startingSpot = currentSpot * (1 + bias);
  // Linear drift per step from starting to current
  const driftPerStep = (currentSpot - startingSpot) / (SESSION_POINTS - 1);

  for (let i = SESSION_POINTS - 2; i >= 0; i--) {
    // Expected price at this point (linear interpolation from start to end)
    const stepsFromEnd = (SESSION_POINTS - 1) - i;
    const expectedDrift = driftPerStep * stepsFromEnd;
    // Box-Muller-ish noise
    const u1 = rng();
    const u2 = rng();
    const z = Math.sqrt(-2 * Math.log(Math.max(u1, 0.0001))) * Math.cos(2 * Math.PI * u2);
    prices[i] = prices[i + 1] - driftPerStep + z * stepVol;
    // Clamp to positive
    if (prices[i] <= 0) prices[i] = prices[i + 1] * 0.995;
  }

  spotHistoryCache.set(key, prices);
  return prices;
}

// --- Contract-Level Moneyness Derivation ---

/**
 * Derive moneyness history for a specific contract from the underlying's spot history.
 *
 * Uses the same canonical formula as position-monitoring.ts:
 *   call: (spot - strike) / strike
 *   put:  (strike - spot) / strike
 *   Positive = ITM, Negative = OTM
 *
 * Returns evenly-spaced MoneynessPoints with t in [0, 1].
 */
/**
 * Derive moneyness trajectory from spot history + strike.
 *
 * When timestamps are provided, x-positions are proportional to time within
 * the trading session (09:30–16:00 ET). Un-elapsed future remains blank.
 * When only prices are provided (Demo mode), falls back to evenly-spaced positions.
 *
 * Returns MoneynessPoints with t in [0, 1] representing position in the session.
 */
export function deriveMoneynessHistory(
  spotHistory: number[],
  strike: number,
  type: PositionType,
  timestamps?: string[],
): MoneynessPoint[] {
  if (spotHistory.length === 0 || strike <= 0) return [];

  // If timestamps provided, use time-proportional positioning
  if (timestamps && timestamps.length === spotHistory.length) {
    // Trading session: 09:30–16:00 ET = 6.5 hours = 23400 seconds
    // Convert each timestamp to fraction of session
    const SESSION_START_MINUTES = 9 * 60 + 30; // 09:30 ET in minutes from midnight
    const SESSION_END_MINUTES = 16 * 60;       // 16:00 ET in minutes from midnight
    const SESSION_DURATION = SESSION_END_MINUTES - SESSION_START_MINUTES; // 390 minutes

    return spotHistory.map((spot, i) => {
      const moneyness = type === "put"
        ? (strike - spot) / strike
        : (spot - strike) / strike;

      // Parse timestamp and convert to ET minutes from midnight
      const date = new Date(timestamps[i]);
      const etMinutes = getETMinutes(date);
      const t = Math.max(0, Math.min(1, (etMinutes - SESSION_START_MINUTES) / SESSION_DURATION));

      return { t, moneyness };
    });
  }

  // Fallback: evenly spaced (Demo mode)
  const step = spotHistory.length > 1 ? 1 / (spotHistory.length - 1) : 0;
  return spotHistory.map((spot, i) => {
    const moneyness = type === "put"
      ? (strike - spot) / strike
      : (spot - strike) / strike;
    return { t: i * step, moneyness };
  });
}

/**
 * Convert a Date to ET minutes from midnight.
 * Approximates EDT (UTC-4) / EST (UTC-5) using the same heuristic as SessionGate.
 */
function getETMinutes(date: Date): number {
  const month = date.getUTCMonth() + 1;
  const day = date.getUTCDate();
  const isEDT = (month > 3 && month < 11)
    || (month === 3 && day >= 8)
    || (month === 11 && day < 1);
  const etOffsetHours = isEDT ? -4 : -5;
  const etMs = date.getTime() + etOffsetHours * 3600_000;
  const etDate = new Date(etMs);
  return etDate.getUTCHours() * 60 + etDate.getUTCMinutes();
}

/**
 * Clear the spot history cache. Useful if Demo configuration changes.
 */
export function clearSpotHistoryCache(): void {
  spotHistoryCache.clear();
}
