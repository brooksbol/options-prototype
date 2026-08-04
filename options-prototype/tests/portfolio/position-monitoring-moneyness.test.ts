/**
 * Position Monitoring — Moneyness Computation Tests
 *
 * Validates the composition of Portfolio positions + Evidence observations
 * into moneyness facts on MonitoredPosition.
 *
 * Moneyness formula:
 *   Call: (price - strike) / strike
 *   Put:  (strike - price) / strike
 *   Positive = ITM, Zero = ATM, Negative = OTM
 */

import { describe, it, expect } from "vitest";
import { deriveMonitoredPositions } from "../../src/portfolio/position-monitoring";
import type { PortfolioSnapshot } from "../../src/write-desk/types";
import type { ObservationState, QuoteObservation } from "../../src/evidence/observation-store";

// --- Helpers ---

function makeSnapshot(opts: {
  puts?: Array<{ underlying: string; strike: number; expiration: string; quantity: number }>;
  calls?: Array<{ underlying: string; strike: number; expiration: string; quantity: number }>;
}): PortfolioSnapshot {
  return {
    id: "test",
    source: { type: "demo", label: "Test" },
    accountId: "TEST",
    snapshotDate: "2026-08-04",
    inventory: [
      { symbol: "XLE", sharesOwned: 200, sharesEncumbered: 100, sharesFree: 100, maxAdditionalContracts: 1, economics: { averageCostPerShare: 55, costBasis: 11000, marketValue: 12000 } },
      { symbol: "QQQ", sharesOwned: 200, sharesEncumbered: 100, sharesFree: 100, maxAdditionalContracts: 1, economics: { averageCostPerShare: 480, costBasis: 96000, marketValue: 140000 } },
    ],
    existingPuts: (opts.puts ?? []).map(p => ({ symbol: `-${p.underlying}P${p.strike}`, ...p })),
    existingCalls: (opts.calls ?? []).map(c => ({ symbol: `-${c.underlying}C${c.strike}`, ...c })),
    deployableCash: 10000,
    balanceContext: { availableToTrade: 10000, cashAndCredits: 10000, totalAccountValue: 100000, valueOfInvestments: 90000, availableToWithdraw: 10000 },
    provenance: { sourceType: "demo", sourceLabel: "Test", createdAt: "2026-08-04T12:00:00Z", accountId: "TEST" },
    readiness: { status: "READY", optionSummaryLoaded: true, balancesLoaded: true, inventoryValid: true, cashStateValid: true, timestampsReconciled: true, timeSeparationMinutes: 0, warnings: [], blockReasons: [] },
  } as PortfolioSnapshot;
}

function makeObservations(quotes: Array<{ symbol: string; price: number | null; observedAt?: string; status?: string; lastAttemptAt?: string; failureCount?: number }>): ObservationState {
  const observations = new Map<string, QuoteObservation>();
  for (const q of quotes) {
    observations.set(q.symbol.toUpperCase(), {
      symbol: q.symbol.toUpperCase(),
      price: q.price,
      observedAt: q.observedAt ?? "2026-08-04T16:00:00Z",
      acquisitionStatus: (q.status as any) ?? "ready",
      lastAttemptAt: q.lastAttemptAt ?? "2026-08-04T16:00:00Z",
      failureCount: q.failureCount ?? 0,
    });
  }
  return {
    generation: 5000,
    generatedAt: "2026-08-04T16:00:00Z",
    observations,
    polling: false,
    lastPollResult: "200",
  };
}

const TODAY = new Date("2026-08-04T12:00:00Z");

// --- Tests ---

describe("moneyness computation", () => {
  describe("call positions", () => {
    it("computes positive moneyness for ITM call (price > strike)", () => {
      const snapshot = makeSnapshot({ calls: [{ underlying: "XLE", strike: 55, expiration: "2026-08-08", quantity: 1 }] });
      const obs = makeObservations([{ symbol: "XLE", price: 60 }]);
      const positions = deriveMonitoredPositions(snapshot, obs, TODAY);
      const call = positions.find(p => p.type === "call")!;
      // (60 - 55) / 55 = 0.0909...
      expect(call.moneyness).toBeCloseTo(5 / 55, 6);
      expect(call.moneyness!).toBeGreaterThan(0); // ITM
    });

    it("computes negative moneyness for OTM call (price < strike)", () => {
      const snapshot = makeSnapshot({ calls: [{ underlying: "XLE", strike: 60, expiration: "2026-08-08", quantity: 1 }] });
      const obs = makeObservations([{ symbol: "XLE", price: 55 }]);
      const positions = deriveMonitoredPositions(snapshot, obs, TODAY);
      const call = positions.find(p => p.type === "call")!;
      // (55 - 60) / 60 = -0.0833...
      expect(call.moneyness).toBeCloseTo(-5 / 60, 6);
      expect(call.moneyness!).toBeLessThan(0); // OTM
    });

    it("computes zero moneyness for ATM call (price === strike)", () => {
      const snapshot = makeSnapshot({ calls: [{ underlying: "XLE", strike: 58, expiration: "2026-08-08", quantity: 1 }] });
      const obs = makeObservations([{ symbol: "XLE", price: 58 }]);
      const positions = deriveMonitoredPositions(snapshot, obs, TODAY);
      const call = positions.find(p => p.type === "call")!;
      expect(call.moneyness).toBe(0);
    });
  });

  describe("put positions", () => {
    it("computes positive moneyness for ITM put (price < strike)", () => {
      const snapshot = makeSnapshot({ puts: [{ underlying: "XLE", strike: 60, expiration: "2026-08-08", quantity: 1 }] });
      const obs = makeObservations([{ symbol: "XLE", price: 55 }]);
      const positions = deriveMonitoredPositions(snapshot, obs, TODAY);
      const put = positions.find(p => p.type === "put")!;
      // (60 - 55) / 60 = 0.0833...
      expect(put.moneyness).toBeCloseTo(5 / 60, 6);
      expect(put.moneyness!).toBeGreaterThan(0); // ITM
    });

    it("computes negative moneyness for OTM put (price > strike)", () => {
      const snapshot = makeSnapshot({ puts: [{ underlying: "XLE", strike: 55, expiration: "2026-08-08", quantity: 1 }] });
      const obs = makeObservations([{ symbol: "XLE", price: 60 }]);
      const positions = deriveMonitoredPositions(snapshot, obs, TODAY);
      const put = positions.find(p => p.type === "put")!;
      // (55 - 60) / 55 = -0.0909...
      expect(put.moneyness).toBeCloseTo(-5 / 55, 6);
      expect(put.moneyness!).toBeLessThan(0); // OTM
    });

    it("computes zero moneyness for ATM put (price === strike)", () => {
      const snapshot = makeSnapshot({ puts: [{ underlying: "XLE", strike: 58, expiration: "2026-08-08", quantity: 1 }] });
      const obs = makeObservations([{ symbol: "XLE", price: 58 }]);
      const positions = deriveMonitoredPositions(snapshot, obs, TODAY);
      const put = positions.find(p => p.type === "put")!;
      expect(put.moneyness).toBe(0);
    });
  });

  describe("no observations (backward compatibility)", () => {
    it("returns null moneyness when observations omitted", () => {
      const snapshot = makeSnapshot({
        puts: [{ underlying: "XLE", strike: 55, expiration: "2026-08-08", quantity: 1 }],
        calls: [{ underlying: "QQQ", strike: 500, expiration: "2026-08-08", quantity: 1 }],
      });
      const positions = deriveMonitoredPositions(snapshot, undefined, TODAY);
      for (const p of positions) {
        expect(p.moneyness).toBeNull();
        expect(p.underlyingPrice).toBeNull();
        expect(p.priceObservedAt).toBeNull();
        expect(p.evidenceGeneration).toBeNull();
        expect(p.acquisitionStatus).toBeNull();
        expect(p.lastAttemptAt).toBeNull();
        expect(p.failureCount).toBe(0);
      }
    });

    it("returns null moneyness when observations is null", () => {
      const snapshot = makeSnapshot({ puts: [{ underlying: "XLE", strike: 55, expiration: "2026-08-08", quantity: 1 }] });
      const positions = deriveMonitoredPositions(snapshot, null, TODAY);
      expect(positions[0].moneyness).toBeNull();
    });
  });

  describe("observation without price (acquisition facts preserved)", () => {
    it("preserves acquisition status when price is null (pending symbol)", () => {
      const snapshot = makeSnapshot({ puts: [{ underlying: "XLE", strike: 55, expiration: "2026-08-08", quantity: 1 }] });
      const obs = makeObservations([{ symbol: "XLE", price: null, status: "pending", lastAttemptAt: null, failureCount: 0 }]);
      const positions = deriveMonitoredPositions(snapshot, obs, TODAY);
      const put = positions[0];
      expect(put.moneyness).toBeNull();
      expect(put.underlyingPrice).toBeNull();
      expect(put.acquisitionStatus).toBe("pending");
      expect(put.evidenceGeneration).toBe(5000);
      expect(put.failureCount).toBe(0);
    });

    it("preserves acquisition facts for failed symbol with no prior price", () => {
      const snapshot = makeSnapshot({ puts: [{ underlying: "XLE", strike: 55, expiration: "2026-08-08", quantity: 1 }] });
      const obs = makeObservations([{ symbol: "XLE", price: null, status: "failed", lastAttemptAt: "2026-08-04T15:00:00Z", failureCount: 3 }]);
      const positions = deriveMonitoredPositions(snapshot, obs, TODAY);
      const put = positions[0];
      expect(put.moneyness).toBeNull();
      expect(put.acquisitionStatus).toBe("failed");
      expect(put.failureCount).toBe(3);
      expect(put.lastAttemptAt).toBe("2026-08-04T15:00:00Z");
    });
  });

  describe("provenance propagation", () => {
    it("attaches underlying price and observedAt from Evidence", () => {
      const snapshot = makeSnapshot({ puts: [{ underlying: "XLE", strike: 55, expiration: "2026-08-08", quantity: 1 }] });
      const obs = makeObservations([{ symbol: "XLE", price: 58.99, observedAt: "2026-08-04T16:40:02Z" }]);
      const positions = deriveMonitoredPositions(snapshot, obs, TODAY);
      expect(positions[0].underlyingPrice).toBe(58.99);
      expect(positions[0].priceObservedAt).toBe("2026-08-04T16:40:02Z");
    });

    it("attaches evidence generation from store-level state", () => {
      const snapshot = makeSnapshot({ puts: [{ underlying: "XLE", strike: 55, expiration: "2026-08-08", quantity: 1 }] });
      const obs = makeObservations([{ symbol: "XLE", price: 58.99 }]);
      obs.generation = 4321;
      const positions = deriveMonitoredPositions(snapshot, obs, TODAY);
      expect(positions[0].evidenceGeneration).toBe(4321);
    });

    it("attaches acquisition status and attempt metadata", () => {
      const snapshot = makeSnapshot({ calls: [{ underlying: "QQQ", strike: 700, expiration: "2026-08-08", quantity: 1 }] });
      const obs = makeObservations([{ symbol: "QQQ", price: 698.41, status: "failed", lastAttemptAt: "2026-08-04T17:06:40Z", failureCount: 3 }]);
      const positions = deriveMonitoredPositions(snapshot, obs, TODAY);
      const call = positions.find(p => p.type === "call")!;
      expect(call.acquisitionStatus).toBe("failed");
      expect(call.lastAttemptAt).toBe("2026-08-04T17:06:40Z");
      expect(call.failureCount).toBe(3);
      // Price is still available (preserved observation)
      expect(call.underlyingPrice).toBe(698.41);
      expect(call.moneyness).not.toBeNull();
    });

    it("symbol not in observations returns all evidence fields null/default", () => {
      const snapshot = makeSnapshot({ puts: [{ underlying: "MISSING", strike: 50, expiration: "2026-08-08", quantity: 1 }] });
      const obs = makeObservations([{ symbol: "XLE", price: 58.99 }]); // MISSING not included
      const positions = deriveMonitoredPositions(snapshot, obs, TODAY);
      expect(positions[0].moneyness).toBeNull();
      expect(positions[0].underlyingPrice).toBeNull();
      expect(positions[0].evidenceGeneration).toBeNull();
      expect(positions[0].acquisitionStatus).toBeNull();
    });
  });

  describe("edge cases", () => {
    it("handles large ITM call correctly", () => {
      const snapshot = makeSnapshot({ calls: [{ underlying: "QQQ", strike: 500, expiration: "2026-08-08", quantity: 2 }] });
      const obs = makeObservations([{ symbol: "QQQ", price: 700 }]);
      const positions = deriveMonitoredPositions(snapshot, obs, TODAY);
      const call = positions.find(p => p.type === "call")!;
      // (700 - 500) / 500 = 0.4
      expect(call.moneyness).toBeCloseTo(0.4, 6);
    });

    it("handles deep OTM put correctly", () => {
      const snapshot = makeSnapshot({ puts: [{ underlying: "XLE", strike: 40, expiration: "2026-08-08", quantity: 1 }] });
      const obs = makeObservations([{ symbol: "XLE", price: 60 }]);
      const positions = deriveMonitoredPositions(snapshot, obs, TODAY);
      const put = positions[0];
      // (40 - 60) / 40 = -0.5
      expect(put.moneyness).toBeCloseTo(-0.5, 6);
    });

    it("case-insensitive symbol lookup", () => {
      const snapshot = makeSnapshot({ puts: [{ underlying: "xle", strike: 55, expiration: "2026-08-08", quantity: 1 }] });
      const obs = makeObservations([{ symbol: "XLE", price: 60 }]);
      const positions = deriveMonitoredPositions(snapshot, obs, TODAY);
      expect(positions[0].moneyness).not.toBeNull();
    });
  });
});
