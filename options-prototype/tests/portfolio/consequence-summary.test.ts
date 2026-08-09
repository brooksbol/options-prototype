/**
 * Consequence Summary — Unit Tests
 *
 * Validates the nearest-rung aggregation of per-position assignment consequences.
 *
 * Key invariants:
 * - Appreciation and erosion are separate (never netted)
 * - Premium is a separate component
 * - Positions without basis are counted as indeterminate
 * - Aggregation consumes assignment-consequence.ts outputs
 */

import { describe, it, expect } from "vitest";
import { deriveNearestConsequenceSummary } from "../../src/portfolio/consequence-summary";
import { deriveMonitoredPositions, groupByExpiration } from "../../src/portfolio/position-monitoring";
import type { PortfolioSnapshot, InventoryPosition } from "../../src/write-desk/types";

// --- Helpers ---

function makeSnapshot(opts?: {
  puts?: Array<{ underlying: string; strike: number; expiration: string; quantity: number; brokerOptionBasis?: number | null; brokerOptionAverageCost?: number | null }>;
  calls?: Array<{ underlying: string; strike: number; expiration: string; quantity: number; brokerOptionBasis?: number | null; brokerOptionAverageCost?: number | null }>;
  inventory?: InventoryPosition[];
}): PortfolioSnapshot {
  return {
    id: "test-cq",
    source: { type: "demo", label: "Test" },
    accountId: "TEST",
    snapshotDate: "2026-08-08",
    inventory: opts?.inventory ?? [
      { symbol: "XLE", sharesOwned: 200, sharesEncumbered: 200, sharesFree: 0, maxAdditionalContracts: 0, economics: { averageCostPerShare: 53, costBasis: 10600, marketValue: 11200 } },
      { symbol: "QQQ", sharesOwned: 200, sharesEncumbered: 200, sharesFree: 0, maxAdditionalContracts: 0, economics: { averageCostPerShare: 480, costBasis: 96000, marketValue: 100000 } },
    ],
    existingCalls: (opts?.calls ?? []).map(c => ({
      symbol: `-${c.underlying}C${c.strike}`,
      underlying: c.underlying,
      strike: c.strike,
      expiration: c.expiration,
      quantity: c.quantity,
      brokerOptionBasis: c.brokerOptionBasis ?? null,
      brokerOptionAverageCost: c.brokerOptionAverageCost ?? null,
    })),
    existingPuts: (opts?.puts ?? []).map(p => ({
      symbol: `-${p.underlying}P${p.strike}`,
      underlying: p.underlying,
      strike: p.strike,
      expiration: p.expiration,
      quantity: p.quantity,
      brokerOptionBasis: p.brokerOptionBasis ?? null,
      brokerOptionAverageCost: p.brokerOptionAverageCost ?? null,
    })),
    deployableCash: 10000,
    balanceContext: { availableToTrade: 10000, cashAndCredits: 10000, totalAccountValue: 100000, valueOfInvestments: 90000, availableToWithdraw: 10000 },
    provenance: { sourceType: "demo", sourceLabel: "Test", createdAt: "2026-08-08T12:00:00Z", accountId: "TEST" },
    readiness: { status: "READY", optionSummaryLoaded: true, balancesLoaded: true, inventoryValid: true, cashStateValid: true, timestampsReconciled: true, timeSeparationMinutes: 0, warnings: [], blockReasons: [] },
  } as PortfolioSnapshot;
}

const TODAY = new Date("2026-08-08T12:00:00");

function deriveSummary(snapshot: PortfolioSnapshot) {
  const positions = deriveMonitoredPositions(snapshot, null, TODAY);
  const rungs = groupByExpiration(positions);
  return deriveNearestConsequenceSummary(rungs, snapshot);
}

// --- Tests ---

describe("Consequence Summary", () => {
  it("returns null when no positions exist", () => {
    const snapshot = makeSnapshot({ puts: [], calls: [], inventory: [] });
    expect(deriveSummary(snapshot)).toBeNull();
  });

  it("aggregates call appreciation separately from erosion", () => {
    // XLE: strike 55, basis 53 → +$2/share × 200 = +$400 appreciation
    // QQQ: strike 470, basis 480 → -$10/share × 200 = -$2000 erosion
    const snapshot = makeSnapshot({
      calls: [
        { underlying: "XLE", strike: 55, expiration: "2026-08-15", quantity: 2, brokerOptionBasis: -256, brokerOptionAverageCost: -1.28 },
        { underlying: "QQQ", strike: 470, expiration: "2026-08-15", quantity: 2, brokerOptionBasis: -400, brokerOptionAverageCost: -2.00 },
      ],
    });
    const result = deriveSummary(snapshot)!;
    expect(result.calls).not.toBeNull();
    expect(result.calls!.totalAppreciation).toBe(400);
    expect(result.calls!.appreciationCount).toBe(1);
    expect(result.calls!.totalErosion).toBe(2000);
    expect(result.calls!.erosionCount).toBe(1);
  });

  it("never nets appreciation against erosion", () => {
    // Both appreciation and erosion exist simultaneously
    const snapshot = makeSnapshot({
      calls: [
        { underlying: "XLE", strike: 55, expiration: "2026-08-15", quantity: 2, brokerOptionBasis: -200, brokerOptionAverageCost: -1.00 },
        { underlying: "QQQ", strike: 470, expiration: "2026-08-15", quantity: 2, brokerOptionBasis: -400, brokerOptionAverageCost: -2.00 },
      ],
    });
    const result = deriveSummary(snapshot)!;
    // Both are independently reported, never subtracted
    expect(result.calls!.totalAppreciation).toBeGreaterThan(0);
    expect(result.calls!.totalErosion).toBeGreaterThan(0);
    // No "net" field exists
    expect("netAppreciation" in (result.calls as any)).toBe(false);
    expect("netResult" in (result.calls as any)).toBe(false);
  });

  it("aggregates call premium separately from appreciation", () => {
    const snapshot = makeSnapshot({
      calls: [
        { underlying: "XLE", strike: 55, expiration: "2026-08-15", quantity: 2, brokerOptionBasis: -256, brokerOptionAverageCost: -1.28 },
      ],
    });
    const result = deriveSummary(snapshot)!;
    expect(result.calls!.totalPremium).toBe(256);
    expect(result.calls!.premiumCount).toBe(1);
    // Premium is NOT added to appreciation
    expect(result.calls!.totalAppreciation).toBe(400); // purely strike vs basis
  });

  it("counts calls without basis as indeterminate", () => {
    const inventory: InventoryPosition[] = [
      { symbol: "XLE", sharesOwned: 200, sharesEncumbered: 200, sharesFree: 0, maxAdditionalContracts: 0, economics: null },
    ];
    const snapshot = makeSnapshot({
      calls: [
        { underlying: "XLE", strike: 55, expiration: "2026-08-15", quantity: 2, brokerOptionBasis: -256, brokerOptionAverageCost: -1.28 },
      ],
      inventory,
    });
    const result = deriveSummary(snapshot)!;
    expect(result.calls!.indeterminateCount).toBe(1);
    expect(result.calls!.appreciationCount).toBe(0);
    expect(result.calls!.erosionCount).toBe(0);
    // Premium still computable even without share basis
    expect(result.calls!.totalPremium).toBe(256);
  });

  it("aggregates put cash-to-equity transformation", () => {
    const snapshot = makeSnapshot({
      puts: [
        { underlying: "XLF", strike: 36, expiration: "2026-08-15", quantity: 2, brokerOptionBasis: -200, brokerOptionAverageCost: -1.00 },
        { underlying: "XLE", strike: 50, expiration: "2026-08-15", quantity: 1, brokerOptionBasis: -150, brokerOptionAverageCost: -1.50 },
      ],
    });
    const result = deriveSummary(snapshot)!;
    expect(result.puts).not.toBeNull();
    // XLF: 36 × 100 × 2 = $7,200; XLE: 50 × 100 × 1 = $5,000
    expect(result.puts!.totalCashToEquity).toBe(12200);
    expect(result.puts!.putCount).toBe(2);
  });

  it("aggregates put premium", () => {
    const snapshot = makeSnapshot({
      puts: [
        { underlying: "XLF", strike: 36, expiration: "2026-08-15", quantity: 1, brokerOptionBasis: -102, brokerOptionAverageCost: -1.02 },
      ],
    });
    const result = deriveSummary(snapshot)!;
    expect(result.puts!.totalPremium).toBe(102);
    expect(result.puts!.premiumCount).toBe(1);
  });

  it("uses the nearest rung only (lowest DTE)", () => {
    // Two rungs: Aug 15 (7 DTE) and Aug 22 (14 DTE)
    // Only Aug 15 positions should be aggregated
    const snapshot = makeSnapshot({
      calls: [
        { underlying: "XLE", strike: 55, expiration: "2026-08-15", quantity: 2, brokerOptionBasis: -256, brokerOptionAverageCost: -1.28 },
        { underlying: "QQQ", strike: 500, expiration: "2026-08-22", quantity: 2, brokerOptionBasis: -800, brokerOptionAverageCost: -4.00 },
      ],
    });
    const result = deriveSummary(snapshot)!;
    expect(result.expiration).toBe("2026-08-15");
    // Only the XLE call in the nearest rung
    expect(result.calls!.appreciationCount + result.calls!.erosionCount).toBe(1);
    expect(result.calls!.totalAppreciation).toBe(400); // XLE only
  });

  it("reports DTE and expiration of the nearest rung", () => {
    const snapshot = makeSnapshot({
      puts: [
        { underlying: "XLF", strike: 36, expiration: "2026-08-15", quantity: 1, brokerOptionBasis: -100, brokerOptionAverageCost: -1.00 },
      ],
    });
    const result = deriveSummary(snapshot)!;
    expect(result.expiration).toBe("2026-08-15");
    expect(result.dte).toBe(8); // Aug 8 → Aug 15 at market close
  });

  it("returns null calls when nearest rung has only puts", () => {
    const snapshot = makeSnapshot({
      puts: [
        { underlying: "XLF", strike: 36, expiration: "2026-08-15", quantity: 1, brokerOptionBasis: -100, brokerOptionAverageCost: -1.00 },
      ],
      calls: [],
    });
    const result = deriveSummary(snapshot)!;
    expect(result.calls).toBeNull();
    expect(result.puts).not.toBeNull();
  });

  it("returns null puts when nearest rung has only calls", () => {
    const snapshot = makeSnapshot({
      calls: [
        { underlying: "XLE", strike: 55, expiration: "2026-08-15", quantity: 2, brokerOptionBasis: -256, brokerOptionAverageCost: -1.28 },
      ],
      puts: [],
    });
    const result = deriveSummary(snapshot)!;
    expect(result.puts).toBeNull();
    expect(result.calls).not.toBeNull();
  });

  it("handles puts without broker option basis (premium unavailable)", () => {
    const snapshot = makeSnapshot({
      puts: [
        { underlying: "XLF", strike: 36, expiration: "2026-08-15", quantity: 1 },
      ],
    });
    const result = deriveSummary(snapshot)!;
    expect(result.puts!.totalCashToEquity).toBe(3600);
    expect(result.puts!.totalPremium).toBe(0);
    expect(result.puts!.premiumCount).toBe(0);
  });
});
