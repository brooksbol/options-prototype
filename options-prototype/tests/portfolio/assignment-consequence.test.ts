/**
 * Assignment Consequence — Unit Tests
 *
 * Validates the canonical decomposed consequence model (ADR-013 Dimension 3).
 *
 * Epistemic invariants tested explicitly:
 * - Negative Fidelity option basis is preserved as the observed fact
 * - Positive premium credit is derived from the observed basis
 * - Call appreciation/erosion excludes option credit (separate components)
 * - Put acquisition principal remains strike × shares
 * - Analytical effective basis/exit become unavailable when option basis is missing
 * - Missing share basis prevents call appreciation/erosion but not mechanical facts
 * - Demo and Fidelity data use the same consequence semantics with different provenance
 */

import { describe, it, expect } from "vitest";
import {
  deriveCallAssignmentConsequence,
  derivePutAssignmentConsequence,
  type OptionBasisInput,
} from "../../src/portfolio/assignment-consequence";
import type { MonitoredPosition } from "../../src/portfolio/position-monitoring";
import type { InventoryPosition } from "../../src/write-desk/types";

// --- Helpers ---

function makeCallPosition(overrides?: Partial<MonitoredPosition>): MonitoredPosition {
  return {
    id: "call-XLE-55-2026-08-15",
    type: "call",
    underlying: "XLE",
    strike: 55,
    expiration: "2026-08-15",
    dte: 7,
    quantity: 2,
    encumberedCapital: 11200,
    capitalValuationBasis: "market-value-at-import",
    capitalAsOf: "2026-08-08",
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

function makePutPosition(overrides?: Partial<MonitoredPosition>): MonitoredPosition {
  return {
    id: "put-XLF-36-2026-08-15",
    type: "put",
    underlying: "XLF",
    strike: 36,
    expiration: "2026-08-15",
    dte: 7,
    quantity: 1,
    encumberedCapital: 3600,
    capitalValuationBasis: "strike",
    capitalAsOf: "2026-08-08",
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

function makeInventory(overrides?: Partial<InventoryPosition>): InventoryPosition {
  return {
    symbol: "XLE",
    sharesOwned: 200,
    sharesEncumbered: 200,
    sharesFree: 0,
    maxAdditionalContracts: 0,
    economics: { averageCostPerShare: 53, costBasis: 10600, marketValue: 11200 },
    ...overrides,
  };
}

// --- Call Consequence Tests ---

describe("Call Assignment Consequence", () => {
  const fullOptionBasis: OptionBasisInput = {
    brokerOptionBasis: -256.65,
    brokerOptionAverageCost: -1.28,
  };

  it("computes principal movement from strike and quantity", () => {
    const result = deriveCallAssignmentConsequence(makeCallPosition(), makeInventory(), fullOptionBasis);
    expect(result.type).toBe("call");
    expect(result.sharesRemoved).toBe(200); // 2 contracts × 100
    expect(result.cashProceeds).toBe(11000); // $55 × 200 shares
    expect(result.salePricePerShare).toBe(55);
  });

  it("derives appreciation from broker share basis", () => {
    const result = deriveCallAssignmentConsequence(makeCallPosition(), makeInventory(), fullOptionBasis);
    expect(result.brokerShareBasis.value).toBe(53);
    expect(result.brokerShareBasis.provenance).toBe("observed");
    expect(result.appreciationPerShare.value).toBe(2); // 55 - 53
    expect(result.appreciationPerShare.provenance).toBe("derived");
    expect(result.totalAppreciationOrErosion.value).toBe(400); // $2 × 200 shares
  });

  it("appreciation/erosion EXCLUDES option credit (separate components)", () => {
    // This is the key epistemic invariant: appreciation is purely strike vs share basis
    const result = deriveCallAssignmentConsequence(makeCallPosition(), makeInventory(), fullOptionBasis);
    // Appreciation is $400 (strike vs basis only)
    // Premium credit is $256.65 (separate)
    // They are NOT combined into a single number
    expect(result.totalAppreciationOrErosion.value).toBe(400);
    expect(result.premiumCredit.value).toBeCloseTo(256.65);
    // No totalEconomicResult field exists — components remain separate
    expect("totalEconomicResult" in result).toBe(false);
  });

  it("preserves negative broker option basis as observed fact", () => {
    const result = deriveCallAssignmentConsequence(makeCallPosition(), makeInventory(), fullOptionBasis);
    expect(result.brokerOptionBasis.value).toBe(-256.65);
    expect(result.brokerOptionBasis.provenance).toBe("observed");
  });

  it("derives positive premium credit from observed basis", () => {
    const result = deriveCallAssignmentConsequence(makeCallPosition(), makeInventory(), fullOptionBasis);
    expect(result.premiumCredit.value).toBeCloseTo(256.65);
    expect(result.premiumCredit.provenance).toBe("derived");
    expect(result.premiumCreditPerShare.value).toBeCloseTo(1.28);
    expect(result.premiumCreditPerShare.provenance).toBe("derived");
  });

  it("derives effective exit price as analytical measure", () => {
    const result = deriveCallAssignmentConsequence(makeCallPosition(), makeInventory(), fullOptionBasis);
    // effectiveExitPrice = strike + credit/share = 55 + 1.28 = 56.28
    expect(result.effectiveExitPrice.value).toBeCloseTo(56.28);
    expect(result.effectiveExitPrice.provenance).toBe("derived");
  });

  it("effective exit becomes unavailable when option basis is missing", () => {
    const noBasis: OptionBasisInput = { brokerOptionBasis: null, brokerOptionAverageCost: null };
    const result = deriveCallAssignmentConsequence(makeCallPosition(), makeInventory(), noBasis);
    expect(result.effectiveExitPrice.value).toBeNull();
    expect(result.effectiveExitPrice.provenance).toBe("unavailable");
  });

  it("missing share basis prevents appreciation/erosion but not mechanical facts", () => {
    const noShareBasis = makeInventory({ economics: null });
    const result = deriveCallAssignmentConsequence(makeCallPosition(), noShareBasis, fullOptionBasis);
    // Mechanical facts still work
    expect(result.sharesRemoved).toBe(200);
    expect(result.cashProceeds).toBe(11000);
    // Premium still works
    expect(result.premiumCredit.value).toBeCloseTo(256.65);
    // But appreciation is unavailable
    expect(result.brokerShareBasis.value).toBeNull();
    expect(result.brokerShareBasis.provenance).toBe("unavailable");
    expect(result.appreciationPerShare.value).toBeNull();
    expect(result.totalAppreciationOrErosion.value).toBeNull();
  });

  it("computes erosion when strike is below basis", () => {
    const belowBasis = makeCallPosition({ strike: 50 });
    const result = deriveCallAssignmentConsequence(belowBasis, makeInventory(), fullOptionBasis);
    expect(result.appreciationPerShare.value).toBe(-3); // 50 - 53
    expect(result.totalAppreciationOrErosion.value).toBe(-600); // -$3 × 200 shares
  });

  it("reports state transformation correctly", () => {
    const result = deriveCallAssignmentConsequence(makeCallPosition(), makeInventory(), fullOptionBasis);
    expect(result.sharesLeavingInventory).toBe(200);
    expect(result.callEncumbranceResolved).toBe(200);
    expect(result.existingShares).toBe(200);
    expect(result.resultingShares).toBe(0); // 200 - 200
  });

  it("handles null inventory gracefully", () => {
    const result = deriveCallAssignmentConsequence(makeCallPosition(), null, fullOptionBasis);
    expect(result.sharesRemoved).toBe(200);
    expect(result.cashProceeds).toBe(11000);
    expect(result.existingShares).toBeNull();
    expect(result.resultingShares).toBeNull();
    expect(result.brokerShareBasis.provenance).toBe("unavailable");
  });
});

// --- Put Consequence Tests ---

describe("Put Assignment Consequence", () => {
  const fullOptionBasis: OptionBasisInput = {
    brokerOptionBasis: -102.33,
    brokerOptionAverageCost: -1.02,
  };

  it("computes principal movement: cash → shares at strike", () => {
    const result = derivePutAssignmentConsequence(makePutPosition(), null, fullOptionBasis);
    expect(result.type).toBe("put");
    expect(result.cashConsumed).toBe(3600); // $36 × 100 × 1
    expect(result.sharesAcquired).toBe(100); // 1 contract × 100
    expect(result.acquisitionPricePerShare).toBe(36);
  });

  it("acquisition principal remains strike × shares (not premium-adjusted)", () => {
    // Key invariant: cashConsumed is the actual cash obligation, not reduced by premium
    const result = derivePutAssignmentConsequence(makePutPosition(), null, fullOptionBasis);
    expect(result.cashConsumed).toBe(3600); // Not 3600 - 102.33
    expect(result.acquisitionPricePerShare).toBe(36); // Not 36 - 1.02
  });

  it("preserves negative broker option basis as observed fact", () => {
    const result = derivePutAssignmentConsequence(makePutPosition(), null, fullOptionBasis);
    expect(result.brokerOptionBasis.value).toBe(-102.33);
    expect(result.brokerOptionBasis.provenance).toBe("observed");
  });

  it("derives positive premium credit from observed basis", () => {
    const result = derivePutAssignmentConsequence(makePutPosition(), null, fullOptionBasis);
    expect(result.premiumCredit.value).toBeCloseTo(102.33);
    expect(result.premiumCredit.provenance).toBe("derived");
    expect(result.premiumCreditPerShare.value).toBeCloseTo(1.02);
    expect(result.premiumCreditPerShare.provenance).toBe("derived");
  });

  it("derives analytical effective basis as secondary measure", () => {
    const result = derivePutAssignmentConsequence(makePutPosition(), null, fullOptionBasis);
    // analyticalEffectiveBasis = strike - credit/share = 36 - 1.02 = 34.98
    expect(result.analyticalEffectiveBasis.value).toBeCloseTo(34.98);
    expect(result.analyticalEffectiveBasis.provenance).toBe("derived");
  });

  it("analytical effective basis becomes unavailable when option basis is missing", () => {
    const noBasis: OptionBasisInput = { brokerOptionBasis: null, brokerOptionAverageCost: null };
    const result = derivePutAssignmentConsequence(makePutPosition(), null, noBasis);
    expect(result.analyticalEffectiveBasis.value).toBeNull();
    expect(result.analyticalEffectiveBasis.provenance).toBe("unavailable");
    // But mechanical facts still work
    expect(result.cashConsumed).toBe(3600);
    expect(result.sharesAcquired).toBe(100);
  });

  it("reports put obligation resolved equal to cash consumed", () => {
    const result = derivePutAssignmentConsequence(makePutPosition(), null, fullOptionBasis);
    expect(result.putObligationResolved).toBe(3600);
  });

  it("computes resulting shares with existing inventory", () => {
    const inv = makeInventory({ symbol: "XLF", sharesOwned: 200 });
    const result = derivePutAssignmentConsequence(makePutPosition(), inv, fullOptionBasis);
    expect(result.existingSharesOfUnderlying).toBe(200);
    expect(result.resultingTotalShares).toBe(300); // 200 + 100
  });

  it("computes resulting shares with no existing inventory", () => {
    const result = derivePutAssignmentConsequence(makePutPosition(), null, fullOptionBasis);
    expect(result.existingSharesOfUnderlying).toBeNull();
    expect(result.resultingTotalShares).toBe(100); // 0 + 100
  });
});

// --- Epistemic Invariants (cross-cutting) ---

describe("Epistemic Invariants", () => {
  it("demo and Fidelity data use the same consequence semantics", () => {
    // Demo: synthetic values with same sign convention
    const demoBasis: OptionBasisInput = { brokerOptionBasis: -220, brokerOptionAverageCost: -1.10 };
    // Fidelity: real values from fixture
    const fidelityBasis: OptionBasisInput = { brokerOptionBasis: -256.65, brokerOptionAverageCost: -1.28 };

    const demoResult = deriveCallAssignmentConsequence(makeCallPosition(), makeInventory(), demoBasis);
    const fidelityResult = deriveCallAssignmentConsequence(makeCallPosition(), makeInventory(), fidelityBasis);

    // Same structure, same provenance semantics
    expect(demoResult.brokerOptionBasis.provenance).toBe("observed");
    expect(fidelityResult.brokerOptionBasis.provenance).toBe("observed");
    expect(demoResult.premiumCredit.provenance).toBe("derived");
    expect(fidelityResult.premiumCredit.provenance).toBe("derived");
    expect(demoResult.effectiveExitPrice.provenance).toBe("derived");
    expect(fidelityResult.effectiveExitPrice.provenance).toBe("derived");

    // Different values, same semantics
    expect(demoResult.premiumCredit.value).toBe(220);
    expect(fidelityResult.premiumCredit.value).toBeCloseTo(256.65);
  });

  it("no composite economic measure exists in the consequence model", () => {
    const result = deriveCallAssignmentConsequence(
      makeCallPosition(),
      makeInventory(),
      { brokerOptionBasis: -256.65, brokerOptionAverageCost: -1.28 },
    );

    // These fields must NOT exist — they would represent collapsed P/L
    expect("totalEconomicResult" in result).toBe(false);
    expect("netResult" in result).toBe(false);
    expect("combinedPnL" in result).toBe(false);
    expect("callAwayClassification" in result).toBe(false);
  });

  it("premiumCredit is always Math.abs of brokerOptionBasis", () => {
    const basis: OptionBasisInput = { brokerOptionBasis: -500, brokerOptionAverageCost: -2.50 };
    const result = derivePutAssignmentConsequence(makePutPosition({ quantity: 2 }), null, basis);
    expect(result.premiumCredit.value).toBe(500);
    expect(result.brokerOptionBasis.value).toBe(-500);
  });
});

// --- Hero Color Classification Tests ---

describe("Hero Color Classification (consequence structure)", () => {
  // These tests validate the arithmetic that the presentation layer uses
  // to determine green/amber/red hero color.

  it("Category 1 (green): capital appreciation + premium → positive total, capital >= 0", () => {
    // XLE strike $57, basis $53 → appreciation
    const result = deriveCallAssignmentConsequence(
      makeCallPosition({ strike: 57 }),
      makeInventory({ economics: { averageCostPerShare: 53, costBasis: 10600, marketValue: 11200 } }),
      { brokerOptionBasis: -228, brokerOptionAverageCost: -1.14 },
    );
    const capital = result.totalAppreciationOrErosion.value!;
    const premium = result.premiumCredit.value!;
    const total = capital + premium;
    expect(capital).toBeGreaterThan(0); // appreciation
    expect(total).toBeGreaterThan(0);   // positive total
    // → GREEN
  });

  it("Category 3 (amber): capital erosion + premium offsets → non-negative total, capital < 0", () => {
    // XLE strike $55, basis $55.93 → slight erosion, but premium $1.10 offsets
    const result = deriveCallAssignmentConsequence(
      makeCallPosition({ strike: 55, quantity: 1 }),
      makeInventory({ economics: { averageCostPerShare: 55.93, costBasis: 11186, marketValue: 11200 } }),
      { brokerOptionBasis: -110, brokerOptionAverageCost: -1.10 },
    );
    const capital = result.totalAppreciationOrErosion.value!;
    const premium = result.premiumCredit.value!;
    const total = capital + premium;
    expect(capital).toBeLessThan(0);          // erosion
    expect(total).toBeGreaterThanOrEqual(0);  // premium offsets
    // → AMBER
  });

  it("Category 4 (red): capital erosion exceeds premium → negative total", () => {
    // XLE strike $48, basis $55.93 → deep erosion, premium $0.96 insufficient
    const result = deriveCallAssignmentConsequence(
      makeCallPosition({ strike: 48, quantity: 1 }),
      makeInventory({ economics: { averageCostPerShare: 55.93, costBasis: 11186, marketValue: 11200 } }),
      { brokerOptionBasis: -96, brokerOptionAverageCost: -0.96 },
    );
    const capital = result.totalAppreciationOrErosion.value!;
    const premium = result.premiumCredit.value!;
    const total = capital + premium;
    expect(capital).toBeLessThan(0);    // erosion
    expect(total).toBeLessThan(0);       // premium insufficient
    // → RED
  });
});
