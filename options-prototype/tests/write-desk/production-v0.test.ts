/**
 * Production v0 Tests — Proves:
 *
 * 1. CSP production = premium only, normalized to monthly rate
 * 2. Buy-Write production = premium + delta × appreciation, normalized
 * 3. Below-price buy-write reduces production (negative appreciation)
 * 4. Dimensional coherence: result is in monthly % regardless of DTE
 * 5. Cross-entry rows are filtered (affordable, ACTIONABLE/EDGE, governance)
 * 6. Cross-entry rows are sorted by productionV0 descending
 * 7. Zero DTE handled gracefully
 */

import { describe, it, expect } from "vitest";
import {
  computeProductionV0ForCSP,
  computeProductionV0ForBuyWrite,
  buildCrossEntryRows,
} from "../../src/write-desk/production-v0";
import type { PutCandidate } from "../../src/write-desk/scan-orchestrator";
import type { BuyWriteCandidate } from "../../src/write-desk/recommend-buy-writes";
import { computeBuyWriteEconomics } from "../../src/write-desk/recommend-buy-writes";

// --- Helpers ---

function makePutCandidate(overrides: Partial<PutCandidate> = {}): PutCandidate {
  return {
    rank: 1,
    symbol: "XLE",
    expiration: "2026-08-21",
    dte: 21,
    strike: 58,
    delta: -0.30,
    bid: 1.80,
    ask: 2.00,
    mid: 1.90,
    spreadPercent: 5.3,
    openInterest: 500,
    volume: 100,
    cashRequired: 5800,
    cashRemaining: 4200,
    yieldAnnualized: 57.0,
    assessment: { score: 85, posture: "ACTIONABLE", components: [], hardNoReason: null, policyVersion: "v1" },
    posture: "ACTIONABLE",
    affordable: true,
    governance: { status: "authorized", reason: "" },
    ...overrides,
  };
}

function makeBuyWriteCandidate(overrides: Partial<BuyWriteCandidate> = {}): BuyWriteCandidate {
  const economics = computeBuyWriteEconomics(58, 60, 1.30, 21);
  return {
    rank: 1,
    symbol: "XLE",
    expiration: "2026-08-21",
    dte: 21,
    strike: 60,
    delta: 0.30,
    bid: 1.20,
    ask: 1.40,
    mid: 1.30,
    spreadPercent: 14.3,
    openInterest: 300,
    volume: 80,
    underlyingPrice: 58,
    capitalRequired: 5800,
    cashRemaining: 4200,
    premiumYieldAnnualized: economics.premiumYieldAnnualized,
    totalReturnIfAssignedAnnualized: economics.totalReturnIfAssignedAnnualized,
    totalReturnIfCalledPercent: economics.totalReturnIfCalledPercent,
    strikeAbovePrice: true,
    appreciationPerShare: 2,
    economics,
    assessment: { score: 80, posture: "ACTIONABLE", components: [], hardNoReason: null, policyVersion: "v1" },
    posture: "ACTIONABLE",
    affordable: true,
    governance: { status: "authorized", reason: "" },
    ...overrides,
  };
}

// --- CSP Production v0 ---

describe("computeProductionV0ForCSP", () => {
  it("computes monthly production rate from premium only", () => {
    const candidate = makePutCandidate({ mid: 1.90, cashRequired: 5800, dte: 21 });
    const result = computeProductionV0ForCSP(candidate);

    // Premium = 1.90 × 100 = $190
    expect(result.premiumDollars).toBeCloseTo(190, 0);
    expect(result.appreciationDollars).toBe(0);
    expect(result.conditionalAppreciationContribution).toBe(0);
    expect(result.experimentalCycleProduction).toBeCloseTo(190, 0);

    // Monthly rate = $190 / $5800 × 30/21 × 100 = 4.68%
    expect(result.productionV0).toBeCloseTo(4.68, 1);
  });

  it("handles zero DTE gracefully", () => {
    const candidate = makePutCandidate({ dte: 0 });
    const result = computeProductionV0ForCSP(candidate);
    expect(result.productionV0).toBe(0);
  });
});

// --- Buy-Write Production v0 ---

describe("computeProductionV0ForBuyWrite", () => {
  it("includes delta-weighted appreciation in production", () => {
    // Strike $60, price $58, mid $1.30, delta 0.30, DTE 21
    const candidate = makeBuyWriteCandidate({
      strike: 60, underlyingPrice: 58, mid: 1.30, delta: 0.30, dte: 21, capitalRequired: 5800,
    });
    const result = computeProductionV0ForBuyWrite(candidate);

    // Premium = $130
    expect(result.premiumDollars).toBeCloseTo(130, 0);
    // Appreciation = (60-58) × 100 = $200
    expect(result.appreciationDollars).toBeCloseTo(200, 0);
    // Conditional contribution = 0.30 × $200 = $60
    expect(result.conditionalAppreciationContribution).toBeCloseTo(60, 0);
    // Cycle production = $130 + $60 = $190
    expect(result.experimentalCycleProduction).toBeCloseTo(190, 0);
    // Monthly rate = $190 / $5800 × 30/21 × 100 = 4.68%
    expect(result.productionV0).toBeCloseTo(4.68, 1);
  });

  it("negative appreciation reduces production (strike below price)", () => {
    const economics = computeBuyWriteEconomics(60, 55, 4.00, 21);
    const candidate = makeBuyWriteCandidate({
      strike: 55, underlyingPrice: 60, mid: 4.00, delta: 0.45, dte: 21, capitalRequired: 6000,
      economics,
    });
    const result = computeProductionV0ForBuyWrite(candidate);

    // Premium = $400
    expect(result.premiumDollars).toBeCloseTo(400, 0);
    // Appreciation = (55-60) × 100 = -$500
    expect(result.appreciationDollars).toBeCloseTo(-500, 0);
    // Conditional contribution = 0.45 × (-$500) = -$225
    expect(result.conditionalAppreciationContribution).toBeCloseTo(-225, 0);
    // Cycle production = $400 + (-$225) = $175
    expect(result.experimentalCycleProduction).toBeCloseTo(175, 0);
    // Production is positive because premium > delta-weighted erosion
    expect(result.productionV0).toBeGreaterThan(0);
  });

  it("can produce negative production when erosion overwhelms premium", () => {
    const economics = computeBuyWriteEconomics(60, 50, 1.00, 21);
    const candidate = makeBuyWriteCandidate({
      strike: 50, underlyingPrice: 60, mid: 1.00, delta: 0.50, dte: 21, capitalRequired: 6000,
      economics,
    });
    const result = computeProductionV0ForBuyWrite(candidate);

    // Premium = $100
    // Appreciation = (50-60) × 100 = -$1000
    // Conditional = 0.50 × (-$1000) = -$500
    // Cycle production = $100 + (-$500) = -$400
    expect(result.experimentalCycleProduction).toBeCloseTo(-400, 0);
    expect(result.productionV0).toBeLessThan(0);
  });

  it("higher delta increases appreciation contribution when strike above price", () => {
    const econ1 = computeBuyWriteEconomics(58, 60, 1.30, 21);
    const low = makeBuyWriteCandidate({ delta: 0.20, economics: econ1 });
    const high = makeBuyWriteCandidate({ delta: 0.45, economics: econ1 });

    const resultLow = computeProductionV0ForBuyWrite(low);
    const resultHigh = computeProductionV0ForBuyWrite(high);

    // Higher delta → more conditional appreciation contribution
    expect(resultHigh.conditionalAppreciationContribution).toBeGreaterThan(resultLow.conditionalAppreciationContribution);
    expect(resultHigh.productionV0).toBeGreaterThan(resultLow.productionV0);
  });
});

// --- Cross-Entry Row Building ---

describe("buildCrossEntryRows", () => {
  it("merges CSP and Buy-Write and sorts by productionV0", () => {
    const puts = [makePutCandidate({ mid: 1.90, cashRequired: 5800, dte: 21 })]; // ~4.68%
    const bws = [makeBuyWriteCandidate({ mid: 2.50, delta: 0.40, strike: 62, underlyingPrice: 58, capitalRequired: 5800, dte: 21, economics: computeBuyWriteEconomics(58, 62, 2.50, 21) })];

    const rows = buildCrossEntryRows(puts, bws);

    expect(rows.length).toBe(2);
    // Buy-write should rank higher (premium $250 + 0.40 × $400 appreciation = $410 cycle prod)
    expect(rows[0].entryMechanism).toBe("buy-write");
    expect(rows[1].entryMechanism).toBe("csp");
    expect(rows[0].productionV0).toBeGreaterThan(rows[1].productionV0);
  });

  it("excludes unaffordable candidates", () => {
    const puts = [makePutCandidate({ affordable: false })];
    const bws = [makeBuyWriteCandidate({ affordable: false })];

    const rows = buildCrossEntryRows(puts, bws);
    expect(rows.length).toBe(0);
  });

  it("excludes WAIT posture", () => {
    const puts = [makePutCandidate({ posture: "WAIT" })];
    const bws = [makeBuyWriteCandidate({ posture: "WAIT" })];

    const rows = buildCrossEntryRows(puts, bws);
    expect(rows.length).toBe(0);
  });

  it("excludes danger governance", () => {
    const puts = [makePutCandidate({ governance: { status: "danger", reason: "leveraged" } })];
    const bws = [makeBuyWriteCandidate({ governance: { status: "danger", reason: "leveraged" } })];

    const rows = buildCrossEntryRows(puts, bws);
    expect(rows.length).toBe(0);
  });

  it("respects maxRows limit", () => {
    const puts = Array.from({ length: 20 }, (_, i) =>
      makePutCandidate({ symbol: `SYM${i}`, mid: 1.0 + i * 0.1, strike: 50 + i })
    );

    const rows = buildCrossEntryRows(puts, [], 5);
    expect(rows.length).toBe(5);
  });

  it("includes EDGE posture candidates", () => {
    const puts = [makePutCandidate({ posture: "EDGE" })];
    const rows = buildCrossEntryRows(puts, []);
    expect(rows.length).toBe(1);
  });
});
