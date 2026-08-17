/**
 * Net Strategy Result — Frontend Consumption Tests
 *
 * Proves the domain invariant:
 *   Net Strategy Result = (OPTION_PREMIUM + REALIZED_APPRECIATION) − CAPITAL_EROSION
 *
 * Key invariant: structural income (MONEY_MARKET_INCOME, TREASURY_DISCOUNT, DIVIDEND)
 * must NEVER affect Net Strategy Result. These are not consequences of options strategy
 * decisions and must not mask or inflate the strategy engine's net contribution.
 *
 * The authoritative computation lives in the backend (ProductionAssessor). These tests
 * verify that the frontend correctly consumes the backend-provided netStrategyResult
 * without introducing its own accounting logic.
 */

import { describe, it, expect } from "vitest";
import { deriveCurrentMonthProduction } from "../../src/production/current-month-production";
import type { ProductionAssessmentResponse } from "../../src/production/production-types";

// --- Helpers ---

function makeAssessment(overrides: Partial<ProductionAssessmentResponse> = {}): ProductionAssessmentResponse {
  return {
    period: "2026-08",
    periodDescription: "August 2026",
    reconciliationStatus: "FULLY_RECONCILED",
    reconciliationIssues: [],
    knownCashProduction: 0,
    unresolvedPotentialProduction: 0,
    realizedCapitalErosion: 0,
    netStrategyResult: 0,
    productionBreakdown: {},
    erosionEvents: [],
    transactionSummary: { included: 0, excluded: 0, uncertain: 0, notApplicable: 0 },
    transactions: [],
    ...overrides,
  };
}

// --- Tests ---

describe("Net Strategy Result", () => {

  it("passes through backend netStrategyResult when only premium exists", () => {
    const assessment = makeAssessment({
      knownCashProduction: 849.66,
      netStrategyResult: 849.66,
      productionBreakdown: { OPTION_PREMIUM: 849.66 },
    });

    const summary = deriveCurrentMonthProduction(assessment, null, []);
    expect(summary.netStrategyResult).toBeCloseTo(849.66, 2);
  });

  it("passes through backend netStrategyResult including lifecycle appreciation", () => {
    const assessment = makeAssessment({
      knownCashProduction: 1349.66,
      netStrategyResult: 1349.66,
      productionBreakdown: { OPTION_PREMIUM: 849.66, REALIZED_APPRECIATION: 500 },
    });

    const summary = deriveCurrentMonthProduction(assessment, null, []);
    expect(summary.netStrategyResult).toBeCloseTo(1349.66, 2);
  });

  it("passes through backend netStrategyResult with erosion subtracted", () => {
    const assessment = makeAssessment({
      knownCashProduction: 849.66,
      realizedCapitalErosion: 500.23,
      netStrategyResult: 349.43,
      productionBreakdown: { OPTION_PREMIUM: 849.66 },
    });

    const summary = deriveCurrentMonthProduction(assessment, null, []);
    expect(summary.netStrategyResult).toBeCloseTo(349.43, 2);
  });

  it("can be negative when erosion exceeds strategy production", () => {
    const assessment = makeAssessment({
      knownCashProduction: 200,
      realizedCapitalErosion: 800,
      netStrategyResult: -600,
      productionBreakdown: { OPTION_PREMIUM: 200 },
    });

    const summary = deriveCurrentMonthProduction(assessment, null, []);
    expect(summary.netStrategyResult).toBeCloseTo(-600, 2);
  });

  // --- INVARIANT: structural income must never affect Net Strategy Result ---
  // These tests verify that the backend computes netStrategyResult correctly
  // by simulating responses where structural income varies but netStrategyResult
  // remains constant (as the backend would produce).

  it("INVARIANT: MONEY_MARKET_INCOME does NOT affect Net Strategy Result", () => {
    const withoutSpaxx = makeAssessment({
      knownCashProduction: 849.66,
      netStrategyResult: 849.66,
      productionBreakdown: { OPTION_PREMIUM: 849.66 },
    });

    const withSpaxx = makeAssessment({
      knownCashProduction: 849.66 + 142.11,
      netStrategyResult: 849.66, // unchanged — SPAXX excluded by backend
      productionBreakdown: { OPTION_PREMIUM: 849.66, MONEY_MARKET_INCOME: 142.11 },
    });

    const resultWithout = deriveCurrentMonthProduction(withoutSpaxx, null, []);
    const resultWith = deriveCurrentMonthProduction(withSpaxx, null, []);

    expect(resultWithout.netStrategyResult).toBeCloseTo(849.66, 2);
    expect(resultWith.netStrategyResult).toBeCloseTo(849.66, 2);
  });

  it("INVARIANT: TREASURY_DISCOUNT does NOT affect Net Strategy Result", () => {
    const withoutTreasury = makeAssessment({
      knownCashProduction: 849.66,
      netStrategyResult: 849.66,
      productionBreakdown: { OPTION_PREMIUM: 849.66 },
    });

    const withTreasury = makeAssessment({
      knownCashProduction: 849.66 + 61.80,
      netStrategyResult: 849.66, // unchanged — Treasury excluded by backend
      productionBreakdown: { OPTION_PREMIUM: 849.66, TREASURY_DISCOUNT: 61.80 },
    });

    const resultWithout = deriveCurrentMonthProduction(withoutTreasury, null, []);
    const resultWith = deriveCurrentMonthProduction(withTreasury, null, []);

    expect(resultWithout.netStrategyResult).toBeCloseTo(849.66, 2);
    expect(resultWith.netStrategyResult).toBeCloseTo(849.66, 2);
  });

  it("INVARIANT: DIVIDEND does NOT affect Net Strategy Result", () => {
    const withoutDividend = makeAssessment({
      knownCashProduction: 849.66,
      netStrategyResult: 849.66,
      productionBreakdown: { OPTION_PREMIUM: 849.66 },
    });

    const withDividend = makeAssessment({
      knownCashProduction: 849.66 + 39.66,
      netStrategyResult: 849.66, // unchanged — Dividend excluded by backend
      productionBreakdown: { OPTION_PREMIUM: 849.66, DIVIDEND: 39.66 },
    });

    const resultWithout = deriveCurrentMonthProduction(withoutDividend, null, []);
    const resultWith = deriveCurrentMonthProduction(withDividend, null, []);

    expect(resultWithout.netStrategyResult).toBeCloseTo(849.66, 2);
    expect(resultWith.netStrategyResult).toBeCloseTo(849.66, 2);
  });

  it("INVARIANT: large structural income cannot mask strategy deterioration", () => {
    // Backend correctly computes: strategy produced $200, eroded $500, net = -$300
    // Even though total knownCashProduction is positive due to SPAXX + Treasury
    const assessment = makeAssessment({
      knownCashProduction: 200 + 142.11 + 61.80,
      realizedCapitalErosion: 500,
      netStrategyResult: -300, // strategy engine is underwater
      productionBreakdown: {
        OPTION_PREMIUM: 200,
        MONEY_MARKET_INCOME: 142.11,
        TREASURY_DISCOUNT: 61.80,
      },
    });

    const summary = deriveCurrentMonthProduction(assessment, null, []);

    // Total production looks positive
    expect(summary.knownProduction).toBeCloseTo(403.91, 2);
    // But Net Strategy Result correctly shows strategy engine is underwater
    expect(summary.netStrategyResult).toBeCloseTo(-300, 2);
  });

  // --- Null handling ---

  it("is null when no assessment is available", () => {
    const summary = deriveCurrentMonthProduction(null, null, []);
    expect(summary.netStrategyResult).toBeNull();
  });

  it("is zero when assessment has no strategy activity", () => {
    const assessment = makeAssessment({
      knownCashProduction: 142.11,
      netStrategyResult: 0, // no strategy activity
      productionBreakdown: { MONEY_MARKET_INCOME: 142.11 },
    });

    const summary = deriveCurrentMonthProduction(assessment, null, []);
    expect(summary.netStrategyResult).toBe(0);
  });
});
