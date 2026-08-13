/**
 * Current-Month Production — Semantic Invariant Tests
 *
 * Two fundamental invariants discovered during implementation:
 *
 * 1. ONE PREMIUM, ONE PRODUCTION
 *    A Fidelity option premium receipt must contribute to Production exactly once.
 *    Premium is recognized at sell-to-open (backend assessment). The same premium
 *    appearing as brokerOptionBasis on the open position must NOT be added again
 *    as forecast/in-flight production.
 *
 * 2. RESOLUTION IS NOT DEPLOYABLE CASH
 *    Capital associated with an expiry rung resolves at that date, but the outcome
 *    determines whether it becomes deployable cash or changes form (e.g., assignment
 *    converts cash to equity). The system must not classify resolving capital as
 *    automatically deployable.
 */

import { describe, it, expect } from "vitest";
import { deriveCurrentMonthProduction } from "../../src/production/current-month-production";
import type { PortfolioSnapshot } from "../../src/write-desk/types";
import type { ProductionAssessmentResponse } from "../../src/production/production-types";
import type { ExpirationRung } from "../../src/portfolio/position-monitoring";

// --- Test Fixtures ---

function createMinimalSnapshot(overrides: Partial<PortfolioSnapshot> = {}): PortfolioSnapshot {
  return {
    id: "test-snapshot",
    source: { type: "fidelity", label: "Fidelity" },
    accountId: null,
    snapshotDate: "2026-08-13",
    inventory: [],
    existingCalls: [],
    existingPuts: [],
    deployableCash: 5000,
    balanceContext: null,
    provenance: {
      sourceType: "fidelity",
      sourceLabel: "Fidelity Snapshot",
      createdAt: "2026-08-13T12:00:00Z",
    },
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

function createAssessment(knownCashProduction: number): ProductionAssessmentResponse {
  return {
    period: "2026-08",
    periodDescription: "August 2026",
    reconciliationStatus: "FULLY_RECONCILED",
    reconciliationIssues: [],
    knownCashProduction,
    unresolvedPotentialProduction: 0,
    realizedCapitalErosion: 0,
    productionBreakdown: { OPTION_PREMIUM: knownCashProduction },
    erosionEvents: [],
    transactionSummary: { included: 1, excluded: 0, uncertain: 0, notApplicable: 0 },
    transactions: [],
  };
}

// --- Invariant 1: One Premium, One Production ---

describe("Invariant: One Premium, One Production", () => {
  const today = new Date("2026-08-13");

  it("does not add brokerOptionBasis to forecast when backend has already counted the premium", () => {
    // Scenario: Operator sold a put on Aug 5 for $200 (2.00/share × 1 contract).
    // Backend assessed the Activity CSV and included that $200 in knownCashProduction.
    // The position is still open (expires Aug 15) with brokerOptionBasis = -200.
    // The forecast must NOT add $200 again.

    const snapshot = createMinimalSnapshot({
      existingPuts: [{
        symbol: "-XLE260815P50",
        underlying: "XLE",
        strike: 50,
        expiration: "2026-08-15",
        quantity: 1,
        brokerOptionBasis: -200, // negative = credit received (Fidelity convention)
        brokerOptionAverageCost: -2.00,
      }],
    });

    const assessment = createAssessment(200); // Backend already counted the $200

    const result = deriveCurrentMonthProduction(assessment, snapshot, [], today);

    // The forecast total must equal known production — NOT known + brokerOptionBasis
    expect(result.forecast.forecastTotal).toBe(200);
    expect(result.forecast.forecastTotal).toBe(result.knownProduction);

    // The resolving premium is $200 but labeled as "already in known" — context, not addition
    expect(result.forecast.resolvingPremium).toBe(200);
  });

  it("forecast never exceeds known production regardless of open position count", () => {
    // Multiple positions open this month — none should inflate the forecast
    const snapshot = createMinimalSnapshot({
      existingPuts: [
        { symbol: "-XLE260815P50", underlying: "XLE", strike: 50, expiration: "2026-08-15", quantity: 1, brokerOptionBasis: -200, brokerOptionAverageCost: -2.00 },
        { symbol: "-SPY260822P400", underlying: "SPY", strike: 400, expiration: "2026-08-22", quantity: 1, brokerOptionBasis: -500, brokerOptionAverageCost: -5.00 },
        { symbol: "-IWM260829P180", underlying: "IWM", strike: 180, expiration: "2026-08-29", quantity: 2, brokerOptionBasis: -300, brokerOptionAverageCost: -1.50 },
      ],
    });

    const assessment = createAssessment(1000); // Backend's authoritative known production

    const result = deriveCurrentMonthProduction(assessment, snapshot, [], today);

    // Forecast must equal known production exactly — open positions don't add to it
    expect(result.forecast.forecastTotal).toBe(1000);
  });

  it("positions expiring beyond the current month do not affect forecast", () => {
    const snapshot = createMinimalSnapshot({
      existingPuts: [{
        symbol: "-XLE260919P50",
        underlying: "XLE",
        strike: 50,
        expiration: "2026-09-19", // September — beyond August
        quantity: 1,
        brokerOptionBasis: -400,
        brokerOptionAverageCost: -4.00,
      }],
    });

    const assessment = createAssessment(150);

    const result = deriveCurrentMonthProduction(assessment, snapshot, [], today);

    expect(result.forecast.forecastTotal).toBe(150);
    // This position's premium is NOT counted in resolving premium (it's beyond month)
    expect(result.forecast.resolvingPremium).toBe(0);
  });
});

// --- Invariant 2: Resolution Is Not Deployable Cash ---

describe("Invariant: Resolution is not deployable cash", () => {
  const today = new Date("2026-08-13");

  it("resolving capital is labeled as resolving, not releasing or deployable", () => {
    // A put at $50 strike × 1 contract = $5,000 collateral resolving on Aug 15.
    // Whether it becomes deployable depends on assignment outcome.
    const rung: ExpirationRung = {
      expiration: "2026-08-15",
      dte: 2,
      positions: [{
        id: "put-XLE-50-2026-08-15",
        type: "put",
        underlying: "XLE",
        strike: 50,
        expiration: "2026-08-15",
        dte: 2,
        quantity: 1,
        encumberedCapital: 5000,
        capitalValuationBasis: "strike",
        capitalAsOf: "2026-08-13",
        moneyness: null,
        underlyingPrice: null,
        priceObservedAt: null,
        evidenceGeneration: null,
        acquisitionStatus: null,
        lastAttemptAt: null,
        failureCount: 0,
      }],
      totalCapital: 5000,
      capitalizedCount: 1,
    };

    const snapshot = createMinimalSnapshot({ deployableCash: 2000 });
    const result = deriveCurrentMonthProduction(null, snapshot, [rung], today);

    // The capacity section reports this as "resolving" — it does NOT add to deployableNow
    expect(result.capacity.resolvingThisMonth).toBe(5000);
    expect(result.capacity.deployableNow).toBe(2000); // Unchanged from snapshot

    // Resolving capital is NOT converted to forecast production
    expect(result.forecast.forecastTotal).toBe(0);
  });

  it("capital beyond month end is classified separately from resolving", () => {
    const augustRung: ExpirationRung = {
      expiration: "2026-08-15",
      dte: 2,
      positions: [{
        id: "put-XLE-50-2026-08-15",
        type: "put",
        underlying: "XLE",
        strike: 50,
        expiration: "2026-08-15",
        dte: 2,
        quantity: 1,
        encumberedCapital: 5000,
        capitalValuationBasis: "strike",
        capitalAsOf: "2026-08-13",
        moneyness: null,
        underlyingPrice: null,
        priceObservedAt: null,
        evidenceGeneration: null,
        acquisitionStatus: null,
        lastAttemptAt: null,
        failureCount: 0,
      }],
      totalCapital: 5000,
      capitalizedCount: 1,
    };

    const septemberRung: ExpirationRung = {
      expiration: "2026-09-19",
      dte: 37,
      positions: [{
        id: "put-SPY-400-2026-09-19",
        type: "put",
        underlying: "SPY",
        strike: 400,
        expiration: "2026-09-19",
        dte: 37,
        quantity: 1,
        encumberedCapital: 40000,
        capitalValuationBasis: "strike",
        capitalAsOf: "2026-08-13",
        moneyness: null,
        underlyingPrice: null,
        priceObservedAt: null,
        evidenceGeneration: null,
        acquisitionStatus: null,
        lastAttemptAt: null,
        failureCount: 0,
      }],
      totalCapital: 40000,
      capitalizedCount: 1,
    };

    const snapshot = createMinimalSnapshot();
    const result = deriveCurrentMonthProduction(null, snapshot, [augustRung, septemberRung], today);

    expect(result.capacity.resolvingThisMonth).toBe(5000);
    expect(result.capacity.beyondMonthEnd).toBe(40000);

    // Neither resolving nor beyond-month capital contributes to forecast
    expect(result.forecast.forecastTotal).toBe(0);
  });

  it("deployableNow comes from snapshot, not from resolving capital", () => {
    const rung: ExpirationRung = {
      expiration: "2026-08-15",
      dte: 2,
      positions: [{
        id: "put-XLE-50-2026-08-15",
        type: "put",
        underlying: "XLE",
        strike: 50,
        expiration: "2026-08-15",
        dte: 2,
        quantity: 1,
        encumberedCapital: 50000,
        capitalValuationBasis: "strike",
        capitalAsOf: "2026-08-13",
        moneyness: null,
        underlyingPrice: null,
        priceObservedAt: null,
        evidenceGeneration: null,
        acquisitionStatus: null,
        lastAttemptAt: null,
        failureCount: 0,
      }],
      totalCapital: 50000,
      capitalizedCount: 1,
    };

    const snapshot = createMinimalSnapshot({ deployableCash: 1234 });
    const result = deriveCurrentMonthProduction(null, snapshot, [rung], today);

    // deployableNow is exactly the snapshot's deployableCash — unaffected by rungs
    expect(result.capacity.deployableNow).toBe(1234);
    expect(result.capacity.resolvingThisMonth).toBe(50000);
  });
});
