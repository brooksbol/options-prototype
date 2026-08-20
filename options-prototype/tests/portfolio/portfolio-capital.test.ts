/**
 * Portfolio Capital V1 — Aggregate Formula Tests
 *
 * Verifies the V1 formula:
 *   Portfolio Capital = Fidelity Total Account Value − aggregate short-option MTM
 *
 * Fidelity's Total includes cash, equities, T-bills, pending activity, and option
 * MTM (as a negative liability). Wheelwright adds back the option liability because
 * obligations do not reduce the capital stock.
 */

import { describe, it, expect } from "vitest";
import { derivePortfolioCapital, reconcileAgainstFidelity } from "../../src/portfolio/portfolio-capital";
import type { PortfolioSnapshot, BalanceContext } from "../../src/write-desk/types";

function makeSnapshot(overrides: {
  balanceContext?: BalanceContext | null;
  aggregateShortOptionMTM?: number | null;
  callCount?: number;
  putCount?: number;
}): PortfolioSnapshot {
  return {
    id: "test-1",
    source: { type: "fidelity", label: "Test" },
    accountId: "TEST-001",
    snapshotDate: "2026-08-20",
    inventory: [],
    existingCalls: Array.from({ length: overrides.callCount ?? 0 }, () => ({
      symbol: "X", underlying: "X", strike: 50, expiration: "2026-09-01", quantity: 1,
      brokerOptionBasis: null, brokerOptionAverageCost: null,
    })),
    existingPuts: Array.from({ length: overrides.putCount ?? 0 }, () => ({
      symbol: "X", underlying: "X", strike: 50, expiration: "2026-09-01", quantity: 1,
      brokerOptionBasis: null, brokerOptionAverageCost: null,
    })),
    deployableCash: 10000,
    aggregateShortOptionMTM: overrides.aggregateShortOptionMTM ?? null,
    balanceContext: overrides.balanceContext ?? null,
    provenance: { sourceType: "fidelity", sourceLabel: "Test", createdAt: "2026-08-20T12:00:00Z" },
    readiness: { status: "READY", optionSummaryLoaded: true, balancesLoaded: true, inventoryValid: true, cashStateValid: true, timestampsReconciled: true, timeSeparationMinutes: 0, warnings: [], blockReasons: [] },
  };
}

describe("derivePortfolioCapital — aggregate formula", () => {
  it("returns null when no balance context", () => {
    const snapshot = makeSnapshot({ balanceContext: null });
    expect(derivePortfolioCapital(snapshot)).toBeNull();
  });

  it("computes Portfolio Capital = totalAccountValue − shortOptionMTM", () => {
    const snapshot = makeSnapshot({
      balanceContext: {
        availableToTrade: 50000,
        cashAndCredits: 48517,
        totalAccountValue: 116300,
        valueOfInvestments: 67783,
        availableToWithdraw: 7690,
      },
      aggregateShortOptionMTM: -3500,
      callCount: 5,
      putCount: 7,
    });

    const result = derivePortfolioCapital(snapshot)!;
    expect(result).not.toBeNull();
    // 116300 − (−3500) = 119800
    expect(result.portfolioCapital).toBe(119800);
    expect(result.totalAccountValue).toBe(116300);
    expect(result.shortOptionMTM).toBe(-3500);
    expect(result.shortOptionPositionCount).toBe(12);
    expect(result.method).toBe("aggregate");
  });

  it("handles zero short-option MTM (all cash portfolio, no options)", () => {
    const snapshot = makeSnapshot({
      balanceContext: {
        availableToTrade: 80000,
        cashAndCredits: 80000,
        totalAccountValue: 80000,
        valueOfInvestments: 0,
        availableToWithdraw: 80000,
      },
      aggregateShortOptionMTM: null,
    });

    const result = derivePortfolioCapital(snapshot)!;
    // 80000 − 0 = 80000 (no option liability to add back)
    expect(result.portfolioCapital).toBe(80000);
    expect(result.shortOptionMTM).toBe(0);
  });

  it("option liability being removed increases Portfolio Capital above Fidelity Total", () => {
    const snapshot = makeSnapshot({
      balanceContext: {
        availableToTrade: 50000,
        cashAndCredits: 50000,
        totalAccountValue: 95000,
        valueOfInvestments: 45000,
        availableToWithdraw: 50000,
      },
      aggregateShortOptionMTM: -5000,
      callCount: 3,
      putCount: 2,
    });

    const result = derivePortfolioCapital(snapshot)!;
    // 95000 − (−5000) = 100000
    expect(result.portfolioCapital).toBe(100000);
    // Portfolio Capital > Fidelity Total — correct, because we removed the liability
    expect(result.portfolioCapital).toBeGreaterThan(result.totalAccountValue);
  });
});

describe("reconcileAgainstFidelity — aggregate formula", () => {
  it("shows the transparent adjustment", () => {
    const snapshot = makeSnapshot({
      balanceContext: {
        availableToTrade: 50000,
        cashAndCredits: 48517,
        totalAccountValue: 116300,
        valueOfInvestments: 67783,
        availableToWithdraw: 7690,
      },
      aggregateShortOptionMTM: -3500,
      callCount: 5,
      putCount: 7,
    });

    const derivation = derivePortfolioCapital(snapshot)!;
    const recon = reconcileAgainstFidelity(snapshot, derivation)!;

    expect(recon.portfolioCapital).toBe(119800);
    expect(recon.fidelityTotalAccountValue).toBe(116300);
    expect(recon.shortOptionMTMAdjustment).toBe(3500); // positive: amount added back
  });

  it("returns null when no balance context", () => {
    const snapshot = makeSnapshot({ balanceContext: null });
    const derivation = derivePortfolioCapital(snapshot);
    expect(derivation).toBeNull();
  });
});
