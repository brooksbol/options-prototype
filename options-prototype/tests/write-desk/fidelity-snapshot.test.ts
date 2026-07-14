/**
 * Tests for the Fidelity portfolio snapshot builder.
 */

import { describe, it, expect } from "vitest";
import { buildFidelitySnapshot, type FidelitySnapshotInput } from "../../src/write-desk/fidelity-snapshot";
import type { OptionSummaryRow } from "../../src/csv/fidelity/optionSummaryParser";
import type { ParsedBalances } from "../../src/csv/fidelity/balancesParser";

// --- Helpers ---

function makeShareRow(symbol: string, quantity: number, strategy = "UnpairedShares" as const): OptionSummaryRow {
  return {
    symbol,
    description: `${symbol} shares`,
    strategy,
    positionType: "share",
    quantity,
    bid: null, ask: null, costBasis: null, marketValue: null, averageCost: null,
    totalGainLoss: null, totalGainLossPercent: null, last: null,
    change: null, changePercent: null, marginRequirement: null,
    option: null, rawRow: [],
  };
}

function makeOptionRow(
  symbol: string,
  underlying: string,
  type: "CALL" | "PUT",
  strike: number,
  expiration: string,
  quantity: number,
  strategy = "CoveredCall" as const
): OptionSummaryRow {
  return {
    symbol,
    description: `${underlying} ${expiration} ${strike} ${type}`,
    strategy,
    positionType: "option",
    quantity,
    bid: null, ask: null, costBasis: null, marketValue: null, averageCost: null,
    totalGainLoss: null, totalGainLossPercent: null, last: null,
    change: null, changePercent: null, marginRequirement: null,
    option: { type, strike, expiration, underlying, symbol: symbol },
    rawRow: [],
  };
}

function makeBalances(overrides?: Partial<ParsedBalances>): ParsedBalances {
  return {
    availableToTrade: 20000,
    availableToTradeAllSettled: 18500,
    cashAndCredits: 22340,
    totalAccountValue: 145200,
    valueOfInvestments: 122860,
    availableToWithdraw: 18500,
    accountName: "Individual",
    accountNumber: "Z12-345678",
    allRows: [{ label: "Available to Trade", amount: 20000, dayChange: null, isSubItem: false, rawRow: [] }],
    ...overrides,
  };
}

function makeInput(overrides?: Partial<FidelitySnapshotInput>): FidelitySnapshotInput {
  return {
    optionSummaryRows: [
      makeShareRow("XLE", 400, "CoveredCall"),
      makeOptionRow("-XLE260815C95", "XLE", "CALL", 95, "2026-08-15", -4, "CoveredCall"),
      makeShareRow("SPYI", 74),
    ],
    optionSummaryFilename: "Option_Summary_2026-07-03.csv",
    optionSummaryExportTimestamp: "2026-07-03T07:42:00Z",
    balances: makeBalances(),
    balancesFilename: "Balances_2026-07-03.csv",
    balancesExportTimestamp: "2026-07-03T07:43:00Z",
    ...overrides,
  };
}

// --- Tests ---

describe("buildFidelitySnapshot", () => {
  it("produces READY snapshot with both files", () => {
    const snapshot = buildFidelitySnapshot(makeInput());
    expect(snapshot.readiness.status).toBe("READY");
    expect(snapshot.source.type).toBe("fidelity");
  });

  it("assigns deployable cash directly from Available to Trade All Settled", () => {
    const snapshot = buildFidelitySnapshot(makeInput());
    // Direct assignment — no subtraction
    expect(snapshot.deployableCash).toBe(18500);
  });

  it("does not subtract existing put obligations from deployable cash", () => {
    const input = makeInput({
      optionSummaryRows: [
        makeShareRow("XLE", 400),
        makeOptionRow("-XLF260815P42", "XLF", "PUT", 42, "2026-08-15", -2, "CashCoveredPut"),
      ],
    });
    const snapshot = buildFidelitySnapshot(input);
    // Cash must be 18500 regardless of existing puts
    expect(snapshot.deployableCash).toBe(18500);
    // Puts are recorded as exposure (1 row with quantity 2)
    expect(snapshot.existingPuts.length).toBe(1);
    expect(snapshot.existingPuts[0].quantity).toBe(2);
  });

  it("derives correct XLE inventory: 400 shares, 4 calls = 400 encumbered, 0 free", () => {
    const snapshot = buildFidelitySnapshot(makeInput());
    const xle = snapshot.inventory.find((p) => p.symbol === "XLE");
    expect(xle).toBeDefined();
    expect(xle!.sharesOwned).toBe(400);
    expect(xle!.sharesEncumbered).toBe(400);
    expect(xle!.sharesFree).toBe(0);
    expect(xle!.maxAdditionalContracts).toBe(0);
  });

  it("derives correct SPYI inventory: 74 shares, below 1 lot", () => {
    const snapshot = buildFidelitySnapshot(makeInput());
    const spyi = snapshot.inventory.find((p) => p.symbol === "SPYI");
    expect(spyi).toBeDefined();
    expect(spyi!.sharesOwned).toBe(74);
    expect(spyi!.sharesEncumbered).toBe(0);
    expect(spyi!.sharesFree).toBe(74);
    expect(spyi!.maxAdditionalContracts).toBe(0);
  });

  it("derives existing short calls", () => {
    const snapshot = buildFidelitySnapshot(makeInput());
    // One row with quantity -4 → 1 entry, quantity = 4
    expect(snapshot.existingCalls.length).toBe(1);
    expect(snapshot.existingCalls[0].underlying).toBe("XLE");
    expect(snapshot.existingCalls[0].strike).toBe(95);
    expect(snapshot.existingCalls[0].quantity).toBe(4);
  });

  it("both files required — missing balances produces INCOMPLETE", () => {
    const input = makeInput({
      balances: makeBalances({ allRows: [], availableToTrade: null, availableToTradeAllSettled: null }),
    });
    const snapshot = buildFidelitySnapshot(input);
    expect(snapshot.readiness.status).toBe("INCOMPLETE");
    expect(snapshot.readiness.blockReasons.length).toBeGreaterThan(0);
  });

  it("timestamp separation produces warning", () => {
    const input = makeInput({
      optionSummaryExportTimestamp: "2026-07-03T07:00:00Z",
      balancesExportTimestamp: "2026-07-03T08:00:00Z", // 60 min apart
    });
    const snapshot = buildFidelitySnapshot(input);
    expect(snapshot.readiness.warnings.length).toBeGreaterThan(0);
    expect(snapshot.readiness.warnings[0]).toContain("minutes apart");
  });

  it("preserves provenance", () => {
    const snapshot = buildFidelitySnapshot(makeInput());
    expect(snapshot.provenance.sourceType).toBe("fidelity");
    expect(snapshot.provenance.optionSummaryFilename).toBe("Option_Summary_2026-07-03.csv");
    expect(snapshot.provenance.balancesFilename).toBe("Balances_2026-07-03.csv");
    expect(snapshot.provenance.accountId).toBe("Z12-345678");
  });

  it("provides balance context", () => {
    const snapshot = buildFidelitySnapshot(makeInput());
    expect(snapshot.balanceContext).not.toBeNull();
    expect(snapshot.balanceContext!.totalAccountValue).toBe(145200);
    expect(snapshot.balanceContext!.cashAndCredits).toBe(22340);
  });
});
