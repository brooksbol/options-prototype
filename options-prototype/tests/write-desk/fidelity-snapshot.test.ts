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

// --- PositionEconomics propagation ---

describe("fidelity snapshot — position economics", () => {
  function makeShareRowWithEconomics(
    symbol: string,
    quantity: number,
    avgCost: number | null,
    costBasis: number | null,
    marketValue: number | null,
    strategy = "CoveredCall" as const
  ): OptionSummaryRow {
    return {
      symbol,
      description: `${symbol} shares`,
      strategy,
      positionType: "share",
      quantity,
      bid: null, ask: null,
      costBasis,
      marketValue,
      averageCost: avgCost,
      totalGainLoss: null, totalGainLossPercent: null, last: null,
      change: null, changePercent: null, marginRequirement: null,
      option: null, rawRow: [],
    };
  }

  it("carries averageCostPerShare, costBasis, and marketValue into economics", () => {
    const input = makeInput({
      optionSummaryRows: [
        makeShareRowWithEconomics("XLE", 200, 55.93, 11186.00, 11620.00),
      ],
    });
    const snapshot = buildFidelitySnapshot(input);
    const xle = snapshot.inventory.find(p => p.symbol === "XLE");

    expect(xle).toBeDefined();
    expect(xle!.economics).not.toBeNull();
    expect(xle!.economics!.averageCostPerShare).toBe(55.93);
    expect(xle!.economics!.costBasis).toBe(11186.00);
    expect(xle!.economics!.marketValue).toBe(11620.00);
  });

  it("produces null economics when all values are null", () => {
    const input = makeInput({
      optionSummaryRows: [
        makeShareRowWithEconomics("XLE", 200, null, null, null),
      ],
    });
    const snapshot = buildFidelitySnapshot(input);
    const xle = snapshot.inventory.find(p => p.symbol === "XLE");

    expect(xle).toBeDefined();
    expect(xle!.economics).toBeNull();
  });

  it("partial economics (only averageCost present) still populates object", () => {
    const input = makeInput({
      optionSummaryRows: [
        makeShareRowWithEconomics("XLE", 200, 55.93, null, null),
      ],
    });
    const snapshot = buildFidelitySnapshot(input);
    const xle = snapshot.inventory.find(p => p.symbol === "XLE");

    expect(xle!.economics).not.toBeNull();
    expect(xle!.economics!.averageCostPerShare).toBe(55.93);
    expect(xle!.economics!.costBasis).toBeNull();
    expect(xle!.economics!.marketValue).toBeNull();
  });

  it("repeated strategy rows use the row with maximum quantity for economics", () => {
    // Fidelity repeats shares per strategy view — the builder takes max quantity
    const input = makeInput({
      optionSummaryRows: [
        // CoveredCall view: 200 shares, basis $55.93
        makeShareRowWithEconomics("XLE", 200, 55.93, 11186.00, 11620.00, "CoveredCall"),
        // CashCoveredPut view: same 200 shares shown again, same economics
        makeShareRowWithEconomics("XLE", 200, 55.93, 11186.00, 11620.00, "CashCoveredPut" as any),
      ],
    });
    const snapshot = buildFidelitySnapshot(input);
    const xle = snapshot.inventory.find(p => p.symbol === "XLE");

    // Should not produce duplicate positions
    const xlePositions = snapshot.inventory.filter(p => p.symbol === "XLE");
    expect(xlePositions.length).toBe(1);
    expect(xle!.sharesOwned).toBe(200); // not 400
    expect(xle!.economics!.averageCostPerShare).toBe(55.93);
  });

  it("representative row selection is deterministic — larger quantity wins economics", () => {
    // Two strategy views with different quantities (unusual but possible)
    const input = makeInput({
      optionSummaryRows: [
        makeShareRowWithEconomics("XLE", 100, 50.00, 5000.00, 5800.00, "CoveredCall"),
        makeShareRowWithEconomics("XLE", 200, 55.93, 11186.00, 11620.00, "UnpairedShares" as any),
      ],
    });
    const snapshot = buildFidelitySnapshot(input);
    const xle = snapshot.inventory.find(p => p.symbol === "XLE");

    // 200 > 100, so the 200-share row's economics win
    expect(xle!.sharesOwned).toBe(200);
    expect(xle!.economics!.averageCostPerShare).toBe(55.93);
    expect(xle!.economics!.costBasis).toBe(11186.00);
  });
});

// --- Broker option economics carrythrough ---

describe("fidelity snapshot — broker option economics", () => {
  it("carries broker option basis and average cost to short calls", () => {
    const input = makeInput({
      optionSummaryRows: [
        makeShareRow("XLE", 200, "CoveredCall" as any),
        {
          ...makeOptionRow("XLE260731C55", "XLE", "CALL", 55, "2026-07-31", -2, "CoveredCall" as any),
          costBasis: -256.65,
          averageCost: -1.28,
        },
      ],
    });
    const snapshot = buildFidelitySnapshot(input);
    expect(snapshot.existingCalls.length).toBe(1);
    expect(snapshot.existingCalls[0].brokerOptionBasis).toBe(-256.65);
    expect(snapshot.existingCalls[0].brokerOptionAverageCost).toBe(-1.28);
  });

  it("carries broker option basis and average cost to short puts", () => {
    const input = makeInput({
      optionSummaryRows: [
        {
          ...makeOptionRow("XLE260724P53", "XLE", "PUT", 53, "2026-07-24", -1, "CashCoveredPut" as any),
          costBasis: -102.33,
          averageCost: -1.02,
        },
      ],
    });
    const snapshot = buildFidelitySnapshot(input);
    expect(snapshot.existingPuts.length).toBe(1);
    expect(snapshot.existingPuts[0].brokerOptionBasis).toBe(-102.33);
    expect(snapshot.existingPuts[0].brokerOptionAverageCost).toBe(-1.02);
  });

  it("passes null when option summary lacks cost basis", () => {
    const input = makeInput({
      optionSummaryRows: [
        makeShareRow("XLE", 200, "CoveredCall" as any),
        makeOptionRow("XLE260731C55", "XLE", "CALL", 55, "2026-07-31", -2, "CoveredCall" as any),
      ],
    });
    const snapshot = buildFidelitySnapshot(input);
    expect(snapshot.existingCalls[0].brokerOptionBasis).toBeNull();
    expect(snapshot.existingCalls[0].brokerOptionAverageCost).toBeNull();
  });
});
