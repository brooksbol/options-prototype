/**
 * Production Outlook — V1 Composition Tests
 *
 * Covers:
 *   - ADR-014 double-count protection (puts produce $0 additional)
 *   - Call/buy-write appreciation contributes to likely additional
 *   - Rounding behavior
 *   - Uncertain positions excluded from base estimate
 *   - Likely-assigned puts still appear in contributions (resolution-complete)
 *   - Missing basis handling
 */

import { describe, it, expect } from "vitest";
import {
  deriveProductionOutlook,
  DISPLAY_ROUNDING_INCREMENT,
} from "../../src/forecast/production-outlook";
import type { ResolutionOutlook } from "../../src/forecast/resolution-outlook";
import type { MonitoredPosition } from "../../src/portfolio/position-monitoring";
import type { PortfolioSnapshot } from "../../src/write-desk/types";
import type { ProductionAssessmentResponse } from "../../src/production/production-types";

// --- Test Helpers ---

const NOW = new Date("2026-08-18T12:00:00Z");

function makeAssessment(knownCash: number): ProductionAssessmentResponse {
  return {
    period: "2026-08",
    periodDescription: "August 2026",
    reconciliationStatus: "FULLY_RECONCILED",
    reconciliationIssues: [],
    knownCashProduction: knownCash,
    unresolvedPotentialProduction: 0,
    realizedCapitalErosion: 0,
    netStrategyResult: knownCash,
    productionBreakdown: { OPTION_PREMIUM: knownCash },
    erosionEvents: [],
    transactionSummary: { totalTransactions: 0, sources: {} } as any,
    transactions: [],
  };
}

function makeMonitoredPosition(overrides: Partial<MonitoredPosition> = {}): MonitoredPosition {
  return {
    id: "pos-call-1",
    type: "call",
    underlying: "XLE",
    strike: 55,
    expiration: "2026-08-22",
    dte: 3,
    quantity: 2,
    encumberedCapital: 11000,
    capitalValuationBasis: "market-value-at-import",
    capitalAsOf: "2026-08-18",
    moneyness: 0.05,
    underlyingPrice: 57.75,
    priceObservedAt: "2026-08-18T10:00:00Z",
    evidenceGeneration: 5,
    acquisitionStatus: "FRESH",
    lastAttemptAt: "2026-08-18T10:00:00Z",
    failureCount: 0,
    ...overrides,
  };
}

function makeSnapshot(overrides: Partial<PortfolioSnapshot> = {}): PortfolioSnapshot {
  return {
    id: "test-snap",
    source: { type: "fidelity", label: "Test" },
    accountId: null,
    snapshotDate: "2026-08-18",
    inventory: [
      {
        symbol: "XLE",
        sharesOwned: 200,
        sharesEncumbered: 200,
        sharesFree: 0,
        maxAdditionalContracts: 0,
        economics: { averageCostPerShare: 53, costBasis: 10600, marketValue: 11550 },
      },
    ],
    existingCalls: [
      {
        symbol: "XLE260822C55",
        underlying: "XLE",
        strike: 55,
        expiration: "2026-08-22",
        quantity: 2,
        brokerOptionBasis: -256,
        brokerOptionAverageCost: -1.28,
      },
    ],
    existingPuts: [
      {
        symbol: "URA260822P31",
        underlying: "URA",
        strike: 31,
        expiration: "2026-08-22",
        quantity: 1,
        brokerOptionBasis: -85,
        brokerOptionAverageCost: -0.85,
      },
    ],
    deployableCash: 25000,
    balanceContext: null,
    provenance: { sourceType: "fidelity", sourceLabel: "Test", createdAt: "2026-08-18T10:00:00Z" },
    readiness: {
      status: "READY",
      optionSummaryLoaded: true,
      balancesLoaded: true,
      inventoryValid: true,
      cashStateValid: true,
      timestampsReconciled: true,
      timeSeparationMinutes: 0,
      warnings: [],
      blockReasons: [],
    },
    ...overrides,
  };
}

function makeOutlook(positionId: string, category: "likely-assigned" | "likely-expires-otm" | "uncertain", expiresThisMonth = true): ResolutionOutlook {
  return {
    positionId,
    category,
    expiresThisMonth,
    evidence: {
      dte: 3,
      moneyness: category === "likely-assigned" ? 0.05 : category === "likely-expires-otm" ? -0.06 : 0.01,
      underlyingPrice: 57.75,
      strike: 55,
      classifiedAt: "2026-08-18T12:00:00Z",
      reason: "test",
    },
  };
}

// --- ADR-014: Double-Count Protection ---

describe("Production Outlook — ADR-014 Invariants", () => {
  it("likely-assigned PUT produces $0 additional production (premium already recognized)", () => {
    const putPosition = makeMonitoredPosition({
      id: "pos-put-1",
      type: "put",
      underlying: "URA",
      strike: 31,
      moneyness: 0.06, // ITM
    });

    const outlook = makeOutlook("pos-put-1", "likely-assigned");
    const result = deriveProductionOutlook(
      makeAssessment(3000),
      [outlook],
      [putPosition],
      makeSnapshot(),
      NOW,
    );

    // Put should appear in likelyContributions (resolution-complete)
    expect(result.likelyContributions).toHaveLength(1);
    // But its amount must be $0
    expect(result.likelyContributions[0].amount).toBe(0);
    expect(result.likelyContributions[0].type).toBe("put");
    // And likelyAdditional should be $0
    expect(result.likelyAdditional).toBe(0);
    // Base estimate = recognized only
    expect(result.baseEstimate).toBe(3000);
  });

  it("likely-expires-otm contributes nothing (no double-count of premium)", () => {
    const callPosition = makeMonitoredPosition({
      id: "pos-call-otm",
      moneyness: -0.06,
    });

    const outlook = makeOutlook("pos-call-otm", "likely-expires-otm");
    const result = deriveProductionOutlook(
      makeAssessment(3000),
      [outlook],
      [callPosition],
      makeSnapshot(),
      NOW,
    );

    // No contributions from likely-expires-otm positions
    expect(result.likelyContributions).toHaveLength(0);
    expect(result.likelyAdditional).toBe(0);
    expect(result.baseEstimate).toBe(3000);
  });

  it("recognized production is never re-counted in likely additional", () => {
    // Call with appreciation — the premium component must NOT be added again
    const callPosition = makeMonitoredPosition({ id: "pos-call-1" });
    const outlook = makeOutlook("pos-call-1", "likely-assigned");

    const result = deriveProductionOutlook(
      makeAssessment(3000), // includes the premium already
      [outlook],
      [callPosition],
      makeSnapshot(),
      NOW,
    );

    // Appreciation only: (55 - 53) × 200 = $400
    // NOT appreciation + premium
    expect(result.likelyAdditional).toBe(400);
    expect(result.baseEstimate).toBe(3400); // 3000 + 400
  });
});

// --- Call/Buy-Write Appreciation ---

describe("Production Outlook — Call Appreciation", () => {
  it("likely-assigned call adds appreciation (strike - basis) × shares", () => {
    const callPosition = makeMonitoredPosition({ id: "pos-call-1", strike: 55, quantity: 2 });
    // Basis is $53/share in the snapshot → appreciation = ($55 - $53) × 200 = $400
    const outlook = makeOutlook("pos-call-1", "likely-assigned");

    const result = deriveProductionOutlook(
      makeAssessment(2500),
      [outlook],
      [callPosition],
      makeSnapshot(),
      NOW,
    );

    expect(result.likelyAdditional).toBe(400);
    expect(result.likelyContributions[0].amount).toBe(400);
    expect(result.likelyContributions[0].computable).toBe(true);
    expect(result.likelyContributions[0].explanation).toContain("Appreciation");
  });

  it("call with erosion (strike below basis) contributes negative amount", () => {
    const callPosition = makeMonitoredPosition({ id: "pos-call-1", strike: 50 }); // below $53 basis
    const outlook = makeOutlook("pos-call-1", "likely-assigned");

    const result = deriveProductionOutlook(
      makeAssessment(3000),
      [outlook],
      [callPosition],
      makeSnapshot(),
      NOW,
    );

    // Erosion: ($50 - $53) × 200 = -$600
    expect(result.likelyAdditional).toBe(-600);
    expect(result.likelyContributions[0].amount).toBe(-600);
  });

  it("call without share basis → computable = false, amount = 0", () => {
    const callPosition = makeMonitoredPosition({ id: "pos-call-1" });
    const snapshotNoBasis = makeSnapshot({
      inventory: [{
        symbol: "XLE",
        sharesOwned: 200,
        sharesEncumbered: 200,
        sharesFree: 0,
        maxAdditionalContracts: 0,
        economics: null, // no basis available
      }],
    });

    const outlook = makeOutlook("pos-call-1", "likely-assigned");

    const result = deriveProductionOutlook(
      makeAssessment(3000),
      [outlook],
      [callPosition],
      snapshotNoBasis,
      NOW,
    );

    expect(result.likelyContributions[0].computable).toBe(false);
    expect(result.likelyContributions[0].amount).toBe(0);
  });
});

// --- Uncertain Positions ---

describe("Production Outlook — Uncertain Positions", () => {
  it("uncertain positions excluded from base estimate", () => {
    const callPosition = makeMonitoredPosition({ id: "pos-uncertain", moneyness: 0.02 });
    const outlook = makeOutlook("pos-uncertain", "uncertain");

    const result = deriveProductionOutlook(
      makeAssessment(3000),
      [outlook],
      [callPosition],
      makeSnapshot(),
      NOW,
    );

    expect(result.baseEstimate).toBe(3000); // only recognized
    expect(result.uncertainCount).toBe(1);
  });

  it("uncertain positions contribute to upside range", () => {
    const callPosition = makeMonitoredPosition({ id: "pos-uncertain", strike: 55, quantity: 2 });
    const outlook = makeOutlook("pos-uncertain", "uncertain");

    const result = deriveProductionOutlook(
      makeAssessment(3000),
      [outlook],
      [callPosition],
      makeSnapshot(),
      NOW,
    );

    // Upside if assigned: (55 - 53) × 200 = $400
    expect(result.uncertainUpside).toBe(400);
    expect(result.uncertainContributions).toHaveLength(1);
  });
});

// --- Rounding ---

describe("Production Outlook — Rounding (Epistemic Precision)", () => {
  it("rounds base estimate to nearest display increment", () => {
    const callPosition = makeMonitoredPosition({ id: "pos-call-1", strike: 55, quantity: 2 });
    const outlook = makeOutlook("pos-call-1", "likely-assigned");

    const result = deriveProductionOutlook(
      makeAssessment(3200), // 3200 + 400 appreciation = 3600
      [outlook],
      [callPosition],
      makeSnapshot(),
      NOW,
    );

    expect(result.baseEstimate).toBe(3600);
    expect(result.baseEstimateRounded).toBe(3500); // rounded to nearest 500
  });

  it("rounds up when appropriate", () => {
    const callPosition = makeMonitoredPosition({ id: "pos-call-1", strike: 55, quantity: 2 });
    const outlook = makeOutlook("pos-call-1", "likely-assigned");

    const result = deriveProductionOutlook(
      makeAssessment(4850), // 4850 + 400 = 5250
      [outlook],
      [callPosition],
      makeSnapshot(),
      NOW,
    );

    expect(result.baseEstimateRounded).toBe(5500); // 5250 rounds to 5500
  });

  it("exports rounding increment as provisional parameter", () => {
    expect(DISPLAY_ROUNDING_INCREMENT).toBe(500);
  });
});

// --- Resolution-Complete Display ---

describe("Production Outlook — Resolution-Complete (puts included)", () => {
  it("likely-assigned put appears in contributions with $0 amount and explanation", () => {
    const putPosition = makeMonitoredPosition({
      id: "pos-put-1",
      type: "put",
      underlying: "URA",
      strike: 31,
    });

    const outlook = makeOutlook("pos-put-1", "likely-assigned");
    const result = deriveProductionOutlook(
      makeAssessment(3000),
      [outlook],
      [putPosition],
      makeSnapshot(),
      NOW,
    );

    expect(result.likelyContributions).toHaveLength(1);
    expect(result.likelyContributions[0].type).toBe("put");
    expect(result.likelyContributions[0].amount).toBe(0);
    expect(result.likelyContributions[0].explanation).toContain("capital");
    expect(result.likelyContributions[0].explanation).toContain("shares");
  });
});

// --- Null/Missing Assessment ---

describe("Production Outlook — Missing Inputs", () => {
  it("null assessment → recognized production = 0", () => {
    const callPosition = makeMonitoredPosition({ id: "pos-call-1" });
    const outlook = makeOutlook("pos-call-1", "likely-assigned");

    const result = deriveProductionOutlook(
      null, // no assessment
      [outlook],
      [callPosition],
      makeSnapshot(),
      NOW,
    );

    expect(result.recognizedProduction).toBe(0);
    expect(result.baseEstimate).toBe(400); // just appreciation
  });

  it("null snapshot → no appreciation computable", () => {
    const callPosition = makeMonitoredPosition({ id: "pos-call-1" });
    const outlook = makeOutlook("pos-call-1", "likely-assigned");

    const result = deriveProductionOutlook(
      makeAssessment(3000),
      [outlook],
      [callPosition],
      null, // no snapshot
      NOW,
    );

    expect(result.likelyContributions[0].computable).toBe(false);
    expect(result.likelyAdditional).toBe(0);
  });

  it("beyond-month positions counted but not classified", () => {
    const pos = makeMonitoredPosition({ id: "pos-beyond" });
    const outlook: ResolutionOutlook = {
      positionId: "pos-beyond",
      category: "uncertain",
      expiresThisMonth: false,
      evidence: { dte: 30, moneyness: 0.05, underlyingPrice: 57, strike: 55, classifiedAt: "2026-08-18T12:00:00Z", reason: "beyond" },
    };

    const result = deriveProductionOutlook(
      makeAssessment(3000),
      [outlook],
      [pos],
      makeSnapshot(),
      NOW,
    );

    expect(result.beyondMonthCount).toBe(1);
    expect(result.likelyContributions).toHaveLength(0);
    expect(result.uncertainCount).toBe(0); // beyond-month doesn't count as "uncertain this month"
  });
});
