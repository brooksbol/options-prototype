/**
 * Capacity Summary — Unit Tests
 *
 * Validates the pure derivation of portfolio capacity facts
 * from MonitoredPosition[], ExpirationRung[], and PortfolioSnapshot.
 */

import { describe, it, expect } from "vitest";
import { deriveCapacitySummary } from "../../src/portfolio/capacity-summary";
import { deriveMonitoredPositions, groupByExpiration } from "../../src/portfolio/position-monitoring";
import type { PortfolioSnapshot, InventoryPosition } from "../../src/write-desk/types";

// --- Helpers ---

function makeInventory(overrides?: Partial<InventoryPosition>[]): InventoryPosition[] {
  const defaults: InventoryPosition[] = [
    { symbol: "XLE", sharesOwned: 300, sharesEncumbered: 100, sharesFree: 200, maxAdditionalContracts: 2, economics: { averageCostPerShare: 55, costBasis: 16500, marketValue: 18000 } },
    { symbol: "XLF", sharesOwned: 200, sharesEncumbered: 200, sharesFree: 0, maxAdditionalContracts: 0, economics: { averageCostPerShare: 38, costBasis: 7600, marketValue: 8400 } },
    { symbol: "QQQ", sharesOwned: 100, sharesEncumbered: 0, sharesFree: 100, maxAdditionalContracts: 1, economics: { averageCostPerShare: 480, costBasis: 48000, marketValue: 50000 } },
  ];
  if (overrides) {
    for (let i = 0; i < overrides.length && i < defaults.length; i++) {
      Object.assign(defaults[i], overrides[i]);
    }
  }
  return defaults;
}

function makeSnapshot(opts?: {
  puts?: Array<{ underlying: string; strike: number; expiration: string; quantity: number }>;
  calls?: Array<{ underlying: string; strike: number; expiration: string; quantity: number }>;
  inventory?: InventoryPosition[];
  deployableCash?: number | null;
}): PortfolioSnapshot {
  return {
    id: "test-cap",
    source: { type: "demo", label: "Test" },
    accountId: "TEST",
    snapshotDate: "2026-08-06",
    inventory: opts?.inventory ?? makeInventory(),
    existingPuts: (opts?.puts ?? [
      { underlying: "XLF", strike: 36, expiration: "2026-08-15", quantity: 2 },
      { underlying: "XLE", strike: 80, expiration: "2026-08-22", quantity: 1 },
    ]).map(p => ({ symbol: `-${p.underlying}P${p.strike}`, ...p })),
    existingCalls: (opts?.calls ?? [
      { underlying: "XLE", strike: 95, expiration: "2026-08-15", quantity: 1 },
      { underlying: "XLF", strike: 42, expiration: "2026-08-22", quantity: 2 },
    ]).map(c => ({ symbol: `-${c.underlying}C${c.strike}`, ...c })),
    deployableCash: opts?.deployableCash !== undefined ? opts.deployableCash : 7690,
    balanceContext: { availableToTrade: 7690, cashAndCredits: 22340, totalAccountValue: 145200, valueOfInvestments: 122860, availableToWithdraw: 5000 },
    provenance: { sourceType: "demo", sourceLabel: "Test", createdAt: "2026-08-06T12:00:00Z", accountId: "TEST" },
    readiness: { status: "READY", optionSummaryLoaded: true, balancesLoaded: true, inventoryValid: true, cashStateValid: true, timestampsReconciled: true, timeSeparationMinutes: 0, warnings: [], blockReasons: [] },
  } as PortfolioSnapshot;
}

/** Fixed "today" for deterministic DTE computation */
const TODAY = new Date("2026-08-08T12:00:00");

function deriveSummary(snapshot: PortfolioSnapshot) {
  const positions = deriveMonitoredPositions(snapshot, null, TODAY);
  const rungs = groupByExpiration(positions);
  return deriveCapacitySummary(positions, rungs, snapshot);
}

// --- Tests ---

describe("Capacity Summary", () => {
  describe("Put Obligations", () => {
    it("sums strike × 100 × quantity for all short puts", () => {
      const summary = deriveSummary(makeSnapshot());
      // XLF $36 × 100 × 2 = $7,200 + XLE $80 × 100 × 1 = $8,000 = $15,200
      expect(summary.putObligations).toBe(15200);
      expect(summary.putPositionCount).toBe(2);
    });

    it("returns zero when no puts exist", () => {
      const summary = deriveSummary(makeSnapshot({ puts: [] }));
      expect(summary.putObligations).toBe(0);
      expect(summary.putPositionCount).toBe(0);
    });
  });

  describe("Covered Equity", () => {
    it("sums market-value-at-import encumbered capital for short calls", () => {
      const summary = deriveSummary(makeSnapshot());
      // XLE: marketValue=18000, sharesOwned=300, perShare=60, call qty=1 → 60×100×1 = $6,000
      // XLF: marketValue=8400, sharesOwned=200, perShare=42, call qty=2 → 42×100×2 = $8,400
      expect(summary.coveredEquity).toBe(14400);
      expect(summary.callPositionCount).toBe(2);
    });

    it("counts calls without valuation when inventory economics are missing", () => {
      const inventory = makeInventory();
      inventory[0].economics = null; // XLE has no economics
      const snapshot = makeSnapshot({ inventory });
      const summary = deriveSummary(snapshot);
      // XLE call should be "unavailable", XLF call should still work
      expect(summary.callsWithoutValuation).toBe(1);
      expect(summary.callPositionCount).toBe(1);
      // Only XLF: 42 × 100 × 2 = $8,400
      expect(summary.coveredEquity).toBe(8400);
    });

    it("returns zero when no calls exist", () => {
      const summary = deriveSummary(makeSnapshot({ calls: [] }));
      expect(summary.coveredEquity).toBe(0);
      expect(summary.callPositionCount).toBe(0);
      expect(summary.callsWithoutValuation).toBe(0);
    });
  });

  describe("Deployable Cash", () => {
    it("passes through snapshot.deployableCash directly", () => {
      const summary = deriveSummary(makeSnapshot());
      expect(summary.deployableCash).toBe(7690);
    });

    it("preserves null when deployableCash is null", () => {
      const summary = deriveSummary(makeSnapshot({ deployableCash: null }));
      expect(summary.deployableCash).toBeNull();
    });
  });

  describe("Nearest Rung Exposure", () => {
    it("reports disaggregated exposure for the nearest expiration rung", () => {
      const summary = deriveSummary(makeSnapshot());
      // Nearest rung is 2026-08-15 (8 DTE from our fixed today of 2026-08-08T12:00:00 to 2026-08-15T16:00:00)
      // Contains: XLF put ($36×100×2=$7200) + XLE call (60×100×1=$6000)
      expect(summary.nearestRung).not.toBeNull();
      expect(summary.nearestRung!.expiration).toBe("2026-08-15");
      expect(summary.nearestRung!.dte).toBe(8);
      expect(summary.nearestRung!.putExposure).toBe(7200);
      expect(summary.nearestRung!.callExposure).toBe(6000);
      expect(summary.nearestRung!.positionCount).toBe(2);
    });

    it("returns null when no positions exist", () => {
      const summary = deriveSummary(makeSnapshot({ puts: [], calls: [] }));
      expect(summary.nearestRung).toBeNull();
    });
  });

  describe("Call-Writing Capacity", () => {
    it("lists symbols with free shares and available lots", () => {
      const summary = deriveSummary(makeSnapshot());
      // XLE: 200 free, 2 lots. QQQ: 100 free, 1 lot. XLF: 0 free, 0 lots (excluded).
      expect(summary.callCapacity).toHaveLength(2);
      expect(summary.callCapacity[0]).toEqual({ symbol: "XLE", sharesFree: 200, additionalLots: 2 });
      expect(summary.callCapacity[1]).toEqual({ symbol: "QQQ", sharesFree: 100, additionalLots: 1 });
    });

    it("computes total free lots across all symbols", () => {
      const summary = deriveSummary(makeSnapshot());
      expect(summary.totalFreeLots).toBe(3);
    });

    it("returns empty when no inventory has free shares", () => {
      const inventory = makeInventory();
      inventory.forEach(inv => { inv.sharesFree = 0; inv.maxAdditionalContracts = 0; });
      const summary = deriveSummary(makeSnapshot({ inventory }));
      expect(summary.callCapacity).toHaveLength(0);
      expect(summary.totalFreeLots).toBe(0);
    });

    it("sorts by lots descending for presentation priority", () => {
      const inventory: InventoryPosition[] = [
        { symbol: "A", sharesOwned: 100, sharesEncumbered: 0, sharesFree: 100, maxAdditionalContracts: 1, economics: null },
        { symbol: "B", sharesOwned: 500, sharesEncumbered: 0, sharesFree: 500, maxAdditionalContracts: 5, economics: null },
        { symbol: "C", sharesOwned: 300, sharesEncumbered: 0, sharesFree: 300, maxAdditionalContracts: 3, economics: null },
      ];
      const summary = deriveSummary(makeSnapshot({ inventory, puts: [], calls: [] }));
      expect(summary.callCapacity[0].symbol).toBe("B");
      expect(summary.callCapacity[1].symbol).toBe("C");
      expect(summary.callCapacity[2].symbol).toBe("A");
    });
  });

  describe("Provenance", () => {
    it("carries the snapshot date", () => {
      const summary = deriveSummary(makeSnapshot());
      expect(summary.snapshotDate).toBe("2026-08-06");
    });
  });

  describe("Empty Portfolio", () => {
    it("handles empty portfolio without crashing", () => {
      const snapshot = makeSnapshot({ puts: [], calls: [], inventory: [] });
      const summary = deriveSummary(snapshot);
      expect(summary.putObligations).toBe(0);
      expect(summary.putPositionCount).toBe(0);
      expect(summary.coveredEquity).toBe(0);
      expect(summary.callPositionCount).toBe(0);
      expect(summary.callsWithoutValuation).toBe(0);
      expect(summary.nearestRung).toBeNull();
      expect(summary.callCapacity).toHaveLength(0);
      expect(summary.totalFreeLots).toBe(0);
    });
  });
});
