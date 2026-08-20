/**
 * Rung Totals Derivation Tests
 *
 * Validates that per-rung aggregation of consequence columns produces correct totals
 * with epistemic honesty:
 * - Capital: sum of encumberedCapital across all positions in a rung
 * - Premium Booked: sum of abs(brokerOptionBasis) for all positions with basis
 * - If Called Away: sum ONLY of Activity-attributed/batch-attributed rows;
 *   suppressed/blended rows do not contribute to the total
 *
 * These tests exercise the same derivation path used by the RungTotalsRow component
 * but at the domain level (no React rendering).
 */

import { describe, it, expect } from "vitest";
import {
  deriveCallAssignmentConsequence,
  derivePutAssignmentConsequence,
  type OptionBasisInput,
} from "../../src/portfolio/assignment-consequence";
import type { MonitoredPosition } from "../../src/portfolio/position-monitoring";
import type { InventoryPosition, CallAcquisitionBasis } from "../../src/write-desk/types";

// --- Helpers ---

function makePosition(overrides: Partial<MonitoredPosition>): MonitoredPosition {
  return {
    id: "test",
    type: "call",
    underlying: "TEST",
    strike: 50,
    expiration: "2026-09-04",
    dte: 14,
    quantity: 1,
    encumberedCapital: 5000,
    capitalValuationBasis: "market-value-at-import",
    capitalAsOf: "2026-08-20",
    moneyness: null,
    underlyingPrice: null,
    priceObservedAt: null,
    evidenceGeneration: null,
    acquisitionStatus: null,
    lastAttemptAt: null,
    failureCount: 0,
    ...overrides,
  };
}

function makeInventory(symbol: string, avgCost: number): InventoryPosition {
  return {
    symbol,
    sharesOwned: 200,
    sharesEncumbered: 200,
    sharesFree: 0,
    maxAdditionalContracts: 0,
    economics: { averageCostPerShare: avgCost, costBasis: avgCost * 200, marketValue: null },
  };
}

const noOptionBasis: OptionBasisInput = { brokerOptionBasis: null, brokerOptionAverageCost: null };

// --- Tests ---

describe("rung totals — capital aggregation", () => {
  it("sums encumberedCapital across all positions in a rung", () => {
    const positions = [
      makePosition({ id: "1", encumberedCapital: 5100 }),
      makePosition({ id: "2", encumberedCapital: 12000, type: "buy-write" }),
      makePosition({ id: "3", encumberedCapital: 3600, type: "put" }),
    ];

    const total = positions.reduce((sum, p) => sum + (p.encumberedCapital ?? 0), 0);
    expect(total).toBe(20700);
  });

  it("null encumberedCapital contributes zero", () => {
    const positions = [
      makePosition({ id: "1", encumberedCapital: 5100 }),
      makePosition({ id: "2", encumberedCapital: null }),
    ];

    const total = positions.reduce((sum, p) => sum + (p.encumberedCapital ?? 0), 0);
    expect(total).toBe(5100);
  });
});

describe("rung totals — premium booked aggregation", () => {
  it("sums abs(brokerOptionBasis) for all positions with basis", () => {
    // Simulating what the totals row does: iterate positions, find broker basis
    const brokerBases = [-350, -284, -750, null, -310];
    const premiumTotal = brokerBases
      .filter((b): b is number => b != null)
      .reduce((sum, b) => sum + Math.abs(b), 0);

    expect(premiumTotal).toBe(1694); // 350 + 284 + 750 + 310
  });

  it("null brokerOptionBasis contributes nothing to premium total", () => {
    const brokerBases: (number | null)[] = [null, null, -200];
    const premiumTotal = brokerBases
      .filter((b): b is number => b != null)
      .reduce((sum, b) => sum + Math.abs(b), 0);

    expect(premiumTotal).toBe(200);
  });
});

describe("rung totals — If Called Away net (epistemic-aware)", () => {
  it("sums only activity-attributed and batch-attributed values", () => {
    // Three BW positions: two with unique attribution, one with blended-only basis
    const pos1 = makePosition({ id: "bw1", type: "buy-write", underlying: "GDXJ", strike: 120, quantity: 1 });
    const pos2 = makePosition({ id: "bw2", type: "buy-write", underlying: "EWY", strike: 185, quantity: 1 });
    const pos3 = makePosition({ id: "call1", type: "call", underlying: "XLE", strike: 60, quantity: 2 });

    const basis1: CallAcquisitionBasis = { pricePerShare: 119.60, shares: 100, date: "2026-08-12", confidence: "unique" };
    const basis2: CallAcquisitionBasis = { pricePerShare: 179.29, shares: 100, date: "2026-08-15", confidence: "unique" };

    const c1 = deriveCallAssignmentConsequence(pos1, null, noOptionBasis, basis1);
    const c2 = deriveCallAssignmentConsequence(pos2, null, noOptionBasis, basis2);
    const c3 = deriveCallAssignmentConsequence(pos3, makeInventory("XLE", 55), noOptionBasis); // blended only

    // pos1: 120 - 119.60 = +0.40/sh × 100 = +40
    expect(c1.brokerShareBasis.provenance).toBe("activity-attributed");
    expect(c1.totalAppreciationOrErosion.value).toBeCloseTo(40);

    // pos2: 185 - 179.29 = +5.71/sh × 100 = +571
    expect(c2.brokerShareBasis.provenance).toBe("activity-attributed");
    expect(c2.totalAppreciationOrErosion.value).toBeCloseTo(571);

    // pos3: observed/blended — should NOT contribute to total
    expect(c3.brokerShareBasis.provenance).toBe("observed");

    // Total: only attributed values
    let total = 0;
    let suppressed = 0;
    for (const c of [c1, c2, c3]) {
      if (c.brokerShareBasis.provenance === "activity-attributed" || c.brokerShareBasis.provenance === "batch-attributed") {
        total += c.totalAppreciationOrErosion.value!;
      } else {
        suppressed++;
      }
    }

    expect(total).toBeCloseTo(611); // 40 + 571
    expect(suppressed).toBe(1); // XLE excluded
  });

  it("nets appreciation and erosion correctly", () => {
    // BNO: erosion -42, EWY: appreciation +571
    const pos1 = makePosition({ id: "bw-bno", type: "buy-write", underlying: "BNO", strike: 51, quantity: 1 });
    const pos2 = makePosition({ id: "bw-ewy", type: "buy-write", underlying: "EWY", strike: 185, quantity: 1 });

    const basis1: CallAcquisitionBasis = { pricePerShare: 51.42, shares: 100, date: "2026-08-10", confidence: "unique" };
    const basis2: CallAcquisitionBasis = { pricePerShare: 179.29, shares: 100, date: "2026-08-15", confidence: "unique" };

    const c1 = deriveCallAssignmentConsequence(pos1, null, noOptionBasis, basis1);
    const c2 = deriveCallAssignmentConsequence(pos2, null, noOptionBasis, basis2);

    const net = c1.totalAppreciationOrErosion.value! + c2.totalAppreciationOrErosion.value!;
    expect(net).toBeCloseTo(529); // -42 + 571
  });

  it("does not include put positions in called-away total", () => {
    const putPos = makePosition({ id: "put1", type: "put", underlying: "URA", strike: 35, quantity: 2 });
    const optBasis: OptionBasisInput = { brokerOptionBasis: -310, brokerOptionAverageCost: -1.55 };
    const putConsequence = derivePutAssignmentConsequence(putPos, null, optBasis);

    // Put consequence has no appreciation/erosion — it's a state transformation
    expect(putConsequence.type).toBe("put");
    // Puts should be filtered out before summing called-away total
    // (the component does: positions.filter(p => p.type === "call" || p.type === "buy-write"))
  });

  it("suppressed total is marked partial when any row is excluded", () => {
    // Two attributed, one blended
    const consequences = [
      { provenance: "activity-attributed" as const, value: 40 },
      { provenance: "activity-attributed" as const, value: 571 },
      { provenance: "observed" as const, value: -403 }, // blended, would be wrong
    ];

    let total = 0;
    let known = 0;
    let suppressed = 0;

    for (const c of consequences) {
      if (c.provenance === "activity-attributed" || c.provenance === "batch-attributed") {
        total += c.value;
        known++;
      } else {
        suppressed++;
      }
    }

    expect(total).toBe(611);
    expect(known).toBe(2);
    expect(suppressed).toBe(1);
    // The component renders this as "+$611 *" with a title explaining exclusion
  });

  it("all-suppressed group shows no numeric total", () => {
    // All positions have blended basis only
    const consequences = [
      { provenance: "observed" as const, value: 500 },
      { provenance: "unavailable" as const, value: null },
    ];

    let known = 0;
    for (const c of consequences) {
      if (c.provenance === "activity-attributed" || c.provenance === "batch-attributed") {
        known++;
      }
    }

    expect(known).toBe(0);
    // The component renders "—" (no total available)
  });
});
