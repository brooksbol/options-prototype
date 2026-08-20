/**
 * Demo Temporal Coherence Test
 *
 * Verifies that the demo portfolio's synthetic spot prices produce
 * plausible moneyness values (no extreme temporal rot).
 */

import { describe, it, expect } from "vitest";
import { createDemoSnapshot, DEMO_SPOT_PRICES } from "../../src/write-desk/demo-snapshot";
import { deriveMonitoredPositions } from "../../src/portfolio/position-monitoring";
import type { ObservationState } from "../../src/evidence/observation-store";

function buildDemoObservations(): ObservationState {
  const observations = new Map<string, any>();
  for (const [symbol, price] of Object.entries(DEMO_SPOT_PRICES)) {
    observations.set(symbol.toUpperCase(), {
      price,
      observedAt: new Date().toISOString(),
      acquisitionStatus: "ready",
      lastAttemptAt: null,
      failureCount: 0,
    });
  }
  return { generation: 1, generatedAt: new Date().toISOString(), observations, polling: false, lastPollResult: "200" };
}

describe("demo temporal coherence", () => {
  it("all demo positions have moneyness within plausible operating range (|moneyness| < 15%)", () => {
    const snapshot = createDemoSnapshot();
    const observations = buildDemoObservations();
    const positions = deriveMonitoredPositions(snapshot, observations, new Date());

    for (const pos of positions) {
      expect(pos.moneyness, `${pos.type} ${pos.underlying} $${pos.strike} should have an observation`).not.toBeNull();
      const absMoney = Math.abs(pos.moneyness!);
      expect(
        absMoney,
        `${pos.type} ${pos.underlying} $${pos.strike}: |moneyness| = ${(absMoney * 100).toFixed(1)}% exceeds 15% — temporal rot?`
      ).toBeLessThan(0.15);
    }
  });

  it("demo contains all three strategy types", () => {
    const snapshot = createDemoSnapshot();
    const observations = buildDemoObservations();
    const positions = deriveMonitoredPositions(snapshot, observations, new Date());

    const types = new Set(positions.map(p => p.type));
    expect(types.has("put")).toBe(true);
    expect(types.has("call")).toBe(true);
    expect(types.has("buy-write")).toBe(true);
  });

  it("demo contains OTM, ATM, and ITM positions", () => {
    const snapshot = createDemoSnapshot();
    const observations = buildDemoObservations();
    const positions = deriveMonitoredPositions(snapshot, observations, new Date());

    const hasOTM = positions.some(p => p.moneyness != null && p.moneyness < -0.01);
    const hasATM = positions.some(p => p.moneyness != null && Math.abs(p.moneyness) <= 0.01);
    const hasITM = positions.some(p => p.moneyness != null && p.moneyness > 0.01);

    expect(hasOTM, "demo should have OTM positions").toBe(true);
    expect(hasATM, "demo should have near-ATM positions").toBe(true);
    expect(hasITM, "demo should have ITM positions").toBe(true);
  });

  it("DEMO_SPOT_PRICES covers all portfolio symbols", () => {
    const snapshot = createDemoSnapshot();
    const allSymbols = new Set<string>();
    for (const p of snapshot.existingPuts) allSymbols.add(p.underlying.toUpperCase());
    for (const c of snapshot.existingCalls) allSymbols.add(c.underlying.toUpperCase());

    for (const sym of allSymbols) {
      expect(DEMO_SPOT_PRICES[sym] ?? DEMO_SPOT_PRICES[sym.toLowerCase()],
        `DEMO_SPOT_PRICES missing ${sym}`
      ).toBeDefined();
    }
  });
});
