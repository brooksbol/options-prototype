/**
 * Tests for policy response curve (sweepDelta).
 *
 * Verifies that the same chain evidence produces meaningfully different
 * results under different target deltas — the core hypothesis this
 * experiment is testing.
 */

import { describe, it, expect } from "vitest";
import { sweepDelta, SWEEP_DELTAS } from "../../src/opportunity/sweep";
import type { OptionsChain, OptionContract } from "../../src/domain/types";

// --- Test helpers ---

function makeContract(overrides: Partial<OptionContract> & { type: "CALL" | "PUT"; strike: number }): OptionContract {
  return {
    bid: 1.00,
    ask: 1.20,
    delta: 0.30,
    openInterest: 500,
    volume: 100,
    ...overrides,
  };
}

function makeChain(): OptionsChain {
  // A chain with multiple strikes at various deltas
  return {
    underlying: { symbol: "XLE", name: "Energy Select Sector SPDR", price: 85.00 },
    expiration: { date: "2026-07-18", dte: 14 },
    calls: [
      makeContract({ type: "CALL", strike: 95, delta: 0.10, bid: 0.15, ask: 0.25 }),
      makeContract({ type: "CALL", strike: 92, delta: 0.15, bid: 0.30, ask: 0.45 }),
      makeContract({ type: "CALL", strike: 90, delta: 0.20, bid: 0.50, ask: 0.70 }),
      makeContract({ type: "CALL", strike: 88, delta: 0.25, bid: 0.80, ask: 1.00 }),
      makeContract({ type: "CALL", strike: 87, delta: 0.30, bid: 1.10, ask: 1.30 }),
      makeContract({ type: "CALL", strike: 86, delta: 0.35, bid: 1.50, ask: 1.70 }),
      makeContract({ type: "CALL", strike: 85, delta: 0.40, bid: 1.90, ask: 2.10 }),
      makeContract({ type: "CALL", strike: 84, delta: 0.45, bid: 2.40, ask: 2.60 }),
      makeContract({ type: "CALL", strike: 83, delta: 0.50, bid: 3.00, ask: 3.20 }),
    ],
    puts: [
      makeContract({ type: "PUT", strike: 75, delta: -0.10, bid: 0.10, ask: 0.20 }),
      makeContract({ type: "PUT", strike: 78, delta: -0.15, bid: 0.20, ask: 0.35 }),
      makeContract({ type: "PUT", strike: 80, delta: -0.20, bid: 0.35, ask: 0.50 }),
      makeContract({ type: "PUT", strike: 81, delta: -0.25, bid: 0.55, ask: 0.70 }),
      makeContract({ type: "PUT", strike: 83, delta: -0.30, bid: 0.80, ask: 1.00 }),
      makeContract({ type: "PUT", strike: 84, delta: -0.35, bid: 1.10, ask: 1.30 }),
      makeContract({ type: "PUT", strike: 85, delta: -0.40, bid: 1.50, ask: 1.70 }),
      makeContract({ type: "PUT", strike: 86, delta: -0.45, bid: 2.00, ask: 2.20 }),
      makeContract({ type: "PUT", strike: 87, delta: -0.50, bid: 2.60, ask: 2.80 }),
    ],
  };
}

// --- Tests ---

describe("sweepDelta", () => {
  it("returns one point per sweep delta value", () => {
    const points = sweepDelta(makeChain(), 14);
    expect(points).toHaveLength(SWEEP_DELTAS.length);
    expect(points.map((p) => p.targetDelta)).toEqual(SWEEP_DELTAS);
  });

  it("selects different call strikes at different deltas", () => {
    const points = sweepDelta(makeChain(), 14);
    const strikes = points.map((p) => p.callStrike);

    // Strikes should generally decrease as delta increases (closer to ATM)
    expect(strikes[0]).toBeGreaterThan(strikes[strikes.length - 1]!);

    // Should not all be the same
    const unique = new Set(strikes);
    expect(unique.size).toBeGreaterThan(1);
  });

  it("selects different put strikes at different deltas", () => {
    const points = sweepDelta(makeChain(), 14);
    const strikes = points.map((p) => p.putStrike);

    // Put strikes should generally increase as delta increases (closer to ATM)
    expect(strikes[strikes.length - 1]!).toBeGreaterThan(strikes[0]!);

    const unique = new Set(strikes);
    expect(unique.size).toBeGreaterThan(1);
  });

  it("yields increase with delta (higher delta = higher premium)", () => {
    const points = sweepDelta(makeChain(), 14);
    const callYields = points.map((p) => p.callYield).filter((y): y is number => y != null);
    const putYields = points.map((p) => p.putYield).filter((y): y is number => y != null);

    // Yields should be monotonically increasing
    for (let i = 1; i < callYields.length; i++) {
      expect(callYields[i]).toBeGreaterThanOrEqual(callYields[i - 1]);
    }
    for (let i = 1; i < putYields.length; i++) {
      expect(putYields[i]).toBeGreaterThanOrEqual(putYields[i - 1]);
    }
  });

  it("capital per contract increases with delta (put strikes move closer to ATM)", () => {
    const points = sweepDelta(makeChain(), 14);
    const capitals = points.map((p) => p.capitalPerContract).filter((c): c is number => c != null);

    // Capital should increase as we move to higher deltas (strikes closer to ATM)
    for (let i = 1; i < capitals.length; i++) {
      expect(capitals[i]).toBeGreaterThanOrEqual(capitals[i - 1]);
    }
  });

  it("returns null fields when greeks are unavailable", () => {
    const chain = makeChain();
    chain.dataQuality = { greeksAvailable: false };

    const points = sweepDelta(chain, 14);

    for (const pt of points) {
      expect(pt.callStrike).toBeNull();
      expect(pt.callYield).toBeNull();
      expect(pt.putStrike).toBeNull();
      expect(pt.putYield).toBeNull();
    }
  });

  it("returns null yields when DTE is 0", () => {
    const points = sweepDelta(makeChain(), 0);

    for (const pt of points) {
      expect(pt.callYield).toBeNull();
      expect(pt.putYield).toBeNull();
    }
  });

  it("the spread between min and max yield reveals response magnitude", () => {
    const points = sweepDelta(makeChain(), 14);
    const callYields = points.map((p) => p.callYield).filter((y): y is number => y != null);

    const minYield = Math.min(...callYields);
    const maxYield = Math.max(...callYields);
    const spread = maxYield - minYield;

    // With this fixture, there should be a meaningful spread
    expect(spread).toBeGreaterThan(10);
  });
});
