/**
 * Sparkline scale — topology-preservation invariant.
 *
 * SPARKLINE SEMANTIC INVARIANT (ratified Aug 2026 sparkline incident):
 *   A moneyness-cell sparkline represents the temporal trajectory of the underlying
 *   over the observation window. Its topology is invariant across strikes for the same
 *   underlying and window. Strike-relative state is conveyed separately by the moneyness
 *   value and state encoding — not by the sparkline's shape or scale.
 *
 * Regression: the real BNO case that exposed the bug — identical spot history rendered
 * a clear V at the ATM strike but a flat line at an OTM strike, because the old scaling
 * normalized by max(|moneyness|) (absolute level) instead of local range.
 */

import { describe, it, expect } from "vitest";
import { buildSparklineScale } from "../../src/operator-console/sparkline-scale";

// The real BNO deduped spot history that exposed the defect (down/up wiggle).
const BNO_SPOT = [51.235, 51.02, 51.2, 51.11];

// Buy-write / call convention: moneyness = (spot - strike) / strike
function moneyness(spot: number, strike: number): number {
  return (spot - strike) / strike;
}

/** Topology = sign of the vertical delta between consecutive plotted points. */
function topology(ys: number[]): number[] {
  const t: number[] = [];
  for (let i = 1; i < ys.length; i++) {
    const d = ys[i] - ys[i - 1];
    t.push(d === 0 ? 0 : d > 0 ? 1 : -1);
  }
  return t;
}

describe("buildSparklineScale — topology preservation across strikes", () => {
  const PLOT_TOP = 1;
  const PLOT_BOTTOM = 23;

  it("renders the SAME topology for two strikes on identical spot history (the BNO bug)", () => {
    const atmM = BNO_SPOT.map(s => moneyness(s, 51)); // ~ATM, small +moneyness
    const otmM = BNO_SPOT.map(s => moneyness(s, 54)); // ~-5.2% OTM

    // Sanity: the absolute levels differ substantially (this is what fooled the old scale).
    expect(Math.abs(otmM[0])).toBeGreaterThan(Math.abs(atmM[0]) * 5);

    const atmScale = buildSparklineScale(atmM, PLOT_TOP, PLOT_BOTTOM);
    const otmScale = buildSparklineScale(otmM, PLOT_TOP, PLOT_BOTTOM);

    const atmYs = atmM.map(m => atmScale.yScale(m));
    const otmYs = otmM.map(m => otmScale.yScale(m));

    // The temporal SHAPE (up/down sequence) must be identical.
    expect(topology(otmYs)).toEqual(topology(atmYs));
  });

  it("both strikes use a meaningful fraction of the plot height (no flat-line collapse)", () => {
    const atmM = BNO_SPOT.map(s => moneyness(s, 51));
    const otmM = BNO_SPOT.map(s => moneyness(s, 54));

    for (const ms of [atmM, otmM]) {
      const scale = buildSparklineScale(ms, PLOT_TOP, PLOT_BOTTOM);
      const ys = ms.map(m => scale.yScale(m));
      const span = Math.max(...ys) - Math.min(...ys);
      const plotH = PLOT_BOTTOM - PLOT_TOP;
      // Vertical span should be a large fraction of the plot (auto-fit), not ~1px.
      expect(span).toBeGreaterThan(plotH * 0.5);
    }
  });

  it("keeps values within the plot bounds", () => {
    const otmM = BNO_SPOT.map(s => moneyness(s, 54));
    const scale = buildSparklineScale(otmM, PLOT_TOP, PLOT_BOTTOM);
    for (const m of otmM) {
      const y = scale.yScale(m);
      expect(y).toBeGreaterThanOrEqual(PLOT_TOP - 0.001);
      expect(y).toBeLessThanOrEqual(PLOT_BOTTOM + 0.001);
    }
  });

  it("strike (zero) line is in-range for an ATM strike, out-of-range for a far-OTM strike", () => {
    const atmM = BNO_SPOT.map(s => moneyness(s, 51)); // straddles/near zero
    const otmM = BNO_SPOT.map(s => moneyness(s, 54)); // all ~ -0.05

    expect(buildSparklineScale(atmM, PLOT_TOP, PLOT_BOTTOM).zeroInRange).toBe(true);
    expect(buildSparklineScale(otmM, PLOT_TOP, PLOT_BOTTOM).zeroInRange).toBe(false);
  });

  it("zero-range guard: a flat series renders as a centered flat line (no divide-by-zero)", () => {
    const flat = [(-0.05), (-0.05), (-0.05)];
    const scale = buildSparklineScale(flat, PLOT_TOP, PLOT_BOTTOM);
    const ys = flat.map(m => scale.yScale(m));
    const mid = PLOT_TOP + (PLOT_BOTTOM - PLOT_TOP) / 2;
    for (const y of ys) {
      expect(Number.isFinite(y)).toBe(true);
      expect(Math.abs(y - mid)).toBeLessThan(0.5); // centered
    }
    expect(topology(ys)).toEqual([0, 0]);
  });
});
