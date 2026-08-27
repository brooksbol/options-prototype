/**
 * Sparkline vertical scaling — topology-preserving auto-fit.
 *
 * SPARKLINE SEMANTIC INVARIANT (ratified during the Aug 2026 sparkline incident):
 *   A moneyness-cell sparkline represents the temporal trajectory of the UNDERLYING
 *   over the observation window. Its topology is invariant across strikes for the same
 *   underlying and window. Strike-relative state is conveyed separately by the moneyness
 *   value and state encoding (color/region) — NOT by the sparkline's shape or scale.
 *
 *   Corollary (built-in consistency check): two rows on the same underlying and window
 *   must render virtually identical sparkline geometry. If they diverge, either the
 *   evidence or the rendering is wrong.
 *
 * The earlier scaling normalized Y by max(|moneyness|). For a far-OTM/ITM strike the
 * absolute moneyness LEVEL (e.g. -5.2%) dominated the tiny intra-window VARIATION
 * (e.g. 0.4% of spot), collapsing the same underlying V into a near-flat line — while
 * an ATM strike on the identical history rendered a clear V. Same evidence, different
 * story. That violated the invariant.
 *
 * Fix (Option A): scale Y by the LOCAL RANGE of the moneyness window (max - min), not
 * its absolute level. The trace fills the plot regardless of how far the strike sits
 * from the money, so the movement shape is faithful. Strike relationship remains
 * conveyed by the numeric moneyness value, cell color, and region shading — and by the
 * strike (zero) line WHEN it falls inside the fitted window.
 */

export interface SparklineScale {
  /** Map a moneyness value to a Y pixel coordinate (top = small y). */
  yScale: (moneyness: number) => number;
  /** Y pixel coordinate of the strike (moneyness == 0) line. */
  zeroY: number;
  /** Whether the strike (zero) line falls within the fitted vertical window. */
  zeroInRange: boolean;
  /** Fitted window bounds (moneyness units). */
  min: number;
  max: number;
}

/**
 * Build a topology-preserving vertical scale for a moneyness sparkline.
 *
 * @param moneyness  the moneyness value at each observation moment
 * @param plotTop    top Y pixel of the plot area (inclusive)
 * @param plotBottom bottom Y pixel of the plot area (inclusive, > plotTop)
 * @param minRange   floor on the fitted range so a flat/near-flat window renders as a
 *                   centered flat line rather than dividing by ~zero (default 0.0005 = 0.05%).
 */
export function buildSparklineScale(
  moneyness: number[],
  plotTop: number,
  plotBottom: number,
  minRange = 0.0005,
): SparklineScale {
  const plotH = plotBottom - plotTop;
  const mid = plotTop + plotH / 2;

  if (moneyness.length === 0) {
    return { yScale: () => mid, zeroY: mid, zeroInRange: false, min: 0, max: 0 };
  }

  let lo = Math.min(...moneyness);
  let hi = Math.max(...moneyness);

  // Zero-range / near-zero-range guard: center a flat window so a truly flat series
  // renders as a centered horizontal line (not pinned to an edge, not divide-by-zero).
  const rawRange = hi - lo;
  if (rawRange < minRange) {
    const center = (hi + lo) / 2;
    lo = center - minRange / 2;
    hi = center + minRange / 2;
  }

  const range = hi - lo;
  // Small vertical padding so the extremes don't touch the very edge.
  const padFrac = 0.12;
  const padded = range * padFrac;
  const fitLo = lo - padded;
  const fitHi = hi + padded;
  const fitRange = fitHi - fitLo;

  // max moneyness -> plotTop (small y); min -> plotBottom (large y).
  const yScale = (m: number) => plotBottom - ((m - fitLo) / fitRange) * plotH;

  const zeroInRange = fitLo <= 0 && fitHi >= 0;
  const zeroY = zeroInRange ? yScale(0) : (0 > fitHi ? plotTop : plotBottom);

  return { yScale, zeroY, zeroInRange, min: fitLo, max: fitHi };
}
