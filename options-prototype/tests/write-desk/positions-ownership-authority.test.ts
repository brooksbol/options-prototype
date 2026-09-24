/**
 * BUG-026 / ADR-020 — Positions as authoritative aggregate share-ownership.
 *
 * Exercises the LIVE derivation path (buildFidelitySnapshot → deriveInventory) and the
 * live Unencumbered Shares geometry warning (deriveUnencumberedInventory), NOT the
 * scenario-replay path. Proves both sides of the historical ambiguity:
 *
 *   - genuinely-additive lots (URA/BNO-class) reconcile to true ownership WHEN Positions is
 *     available, and the false over-encumbrance warning disappears;
 *   - repeated strategy-view presentation does not inflate ownership;
 *   - absent Positions, the conservative observed (MAX) behavior is preserved and ownership
 *     is NEVER inferred from short-call geometry;
 *   - genuinely-insufficient ownership still raises the warning (the warning was never the
 *     bug — incorrect ownership evidence feeding it was).
 */

import { describe, it, expect } from "vitest";
import { buildFidelitySnapshot, type FidelitySnapshotInput } from "../../src/write-desk/fidelity-snapshot";
import { deriveUnencumberedInventory } from "../../src/portfolio/unencumbered-inventory";
import { deriveOwnershipFromPositions } from "../../src/portfolio/positions-ownership";
import type { OptionSummaryRow } from "../../src/csv/fidelity/optionSummaryParser";
import type { HoldingRow } from "../../src/csv/fidelity/positionsParser";
import type { ParsedBalances } from "../../src/csv/fidelity/balancesParser";

function shareRow(symbol: string, quantity: number): OptionSummaryRow {
  return {
    symbol, description: `${symbol} shares`, strategy: "CoveredCall",
    positionType: "share", quantity,
    bid: null, ask: null, costBasis: 4336.5, marketValue: 4097, averageCost: 43.37,
    totalGainLoss: null, totalGainLossPercent: null, last: null,
    change: null, changePercent: null, marginRequirement: null, option: null, rawRow: [],
  };
}

function callRow(underlying: string, strike: number, expiration: string, qty: number): OptionSummaryRow {
  return {
    symbol: `-${underlying}${strike}C`, description: `${underlying} ${expiration} ${strike} CALL`,
    strategy: "CoveredCall", positionType: "option", quantity: qty,
    bid: null, ask: null, costBasis: null, marketValue: null, averageCost: null,
    totalGainLoss: null, totalGainLossPercent: null, last: null,
    change: null, changePercent: null, marginRequirement: null,
    option: { type: "CALL", strike, expiration, underlying, symbol: `-${underlying}${strike}C` }, rawRow: [],
  };
}

function equityHolding(symbol: string, quantity: number): HoldingRow {
  return {
    accountNumber: "Z39411514", accountName: "PERSONAL TREASURY", investmentType: "ETFs",
    symbol, description: `${symbol} ETF`, assetClass: "equity", quantity,
    lastPrice: null, lastPriceChange: null, currentValue: null,
    todayGainLoss: null, todayGainLossPercent: null, totalGainLoss: null, totalGainLossPercent: null,
    percentOfAccount: null, costBasisTotal: null, averageCostBasis: null,
    option: null, maturityDate: null, rawRow: [],
  };
}

function balances(): ParsedBalances {
  return {
    availableToTrade: 5000, availableToTradeAllSettled: 5000, cashAndCredits: 5000,
    totalAccountValue: 100000, valueOfInvestments: 95000, availableToWithdraw: 5000,
    regimeEvidence: { marginFormatPresent: false, legacyAllSettledPresent: true },
    accountName: "PERSONAL TREASURY", accountNumber: "Z39-411514",
    allRows: [{ label: "Available to Trade", amount: 5000, dayChange: null, isSubItem: false, rawRow: [] }],
  };
}

function input(rows: OptionSummaryRow[], ownership: Map<string, number> | null): FidelitySnapshotInput {
  return {
    optionSummaryRows: rows,
    optionSummaryFilename: "os.csv",
    optionSummaryExportTimestamp: "09/24/2026",
    balances: balances(),
    balancesFilename: "bal.csv",
    balancesExportTimestamp: "09/24/2026",
    brokerageAccountId: "acct-1",
    authoritativeOwnership: ownership,
    positionsFilename: ownership ? "positions.csv" : null,
    positionsExportTimestamp: ownership ? "09/24/2026" : null,
  };
}

describe("BUG-026 / ADR-020 — Positions authoritative ownership", () => {
  // The real Sep 24 URA specimen: two byte-identical 100-share Covered Call rows + $41 and
  // $43 calls. Positions reports 200. True position is fully covered.
  const uraOsRows: OptionSummaryRow[] = [
    shareRow("URA", 100),
    callRow("URA", 41, "2026-09-25", -1),
    shareRow("URA", 100),
    callRow("URA", 43, "2026-09-25", -1),
  ];

  it("additive lots: Positions 200 → owned 200, required 200, no false over-encumbrance warning (URA specimen)", () => {
    const positions = deriveOwnershipFromPositions([equityHolding("URA", 200)]);
    const snap = buildFidelitySnapshot(input(uraOsRows, positions));

    const ura = snap.inventory.find((p) => p.symbol === "URA")!;
    expect(ura.sharesOwned).toBe(200);
    expect(ura.sharesEncumbered).toBe(200); // 2 calls × 100
    expect(ura.sharesFree).toBe(0);
    expect(ura.ownershipAuthority).toBe("positions");
    expect(snap.provenance.ownershipFromPositions).toBe(true);

    // The live geometry warning must NOT fire — 200 required reconciles with 200 owned.
    const { geometryWarnings } = deriveUnencumberedInventory(snap);
    expect(geometryWarnings.find((w) => w.symbol === "URA")).toBeUndefined();
  });

  it("repeated strategy presentation: same 100 shares shown twice + Positions 100 → owned 100 (no inflation)", () => {
    // Repeated-strategy view: two 100-share rows but a SINGLE covered lot (one -1 call).
    // Positions authoritatively reports 100. Ownership must not become 200.
    const rows: OptionSummaryRow[] = [
      shareRow("REPT", 100),
      callRow("REPT", 50, "2026-10-17", -1),
      shareRow("REPT", 100),
    ];
    const positions = deriveOwnershipFromPositions([equityHolding("REPT", 100)]);
    const snap = buildFidelitySnapshot(input(rows, positions));

    const rept = snap.inventory.find((p) => p.symbol === "REPT")!;
    expect(rept.sharesOwned).toBe(100);
    expect(rept.ownershipAuthority).toBe("positions");
    const { geometryWarnings } = deriveUnencumberedInventory(snap);
    expect(geometryWarnings.find((w) => w.symbol === "REPT")).toBeUndefined();
  });

  it("Positions absent: conservative observed (MAX) behavior preserved; ownership NOT inferred from calls", () => {
    // URA-shaped ambiguous OS, but NO Positions. Must retain the pre-ADR-020 observed value
    // (MAX = 100) — undercount preferred to manufactured certainty — and must NOT infer 200
    // from the two calls. The warning legitimately fires because the evidence genuinely
    // fails to reconcile without Positions.
    const snap = buildFidelitySnapshot(input(uraOsRows, null));
    const ura = snap.inventory.find((p) => p.symbol === "URA")!;
    expect(ura.sharesOwned).toBe(100); // observed, not inferred
    expect(ura.ownershipAuthority).toBe("option-summary");
    expect(snap.provenance.ownershipFromPositions).toBe(false);

    const { geometryWarnings } = deriveUnencumberedInventory(snap);
    const uraWarning = geometryWarnings.find((w) => w.symbol === "URA");
    expect(uraWarning).toBeDefined();
    expect(uraWarning!.observedSharesOwned).toBe(100);
    expect(uraWarning!.rawCallRequiredShares).toBe(200);
  });

  it("genuine insufficient ownership: Positions 100 but calls require 200 → warning still fires", () => {
    // Positions is authoritative and reports only 100 shares while two calls require 200.
    // This is a REAL geometry inconsistency; the warning must still fire on authoritative
    // evidence (the warning was never the bug).
    const positions = deriveOwnershipFromPositions([equityHolding("URA", 100)]);
    const snap = buildFidelitySnapshot(input(uraOsRows, positions));
    const ura = snap.inventory.find((p) => p.symbol === "URA")!;
    expect(ura.sharesOwned).toBe(100);
    expect(ura.ownershipAuthority).toBe("positions");

    const { geometryWarnings } = deriveUnencumberedInventory(snap);
    const uraWarning = geometryWarnings.find((w) => w.symbol === "URA");
    expect(uraWarning).toBeDefined();
    expect(uraWarning!.observedSharesOwned).toBe(100);
    expect(uraWarning!.rawCallRequiredShares).toBe(200);
  });

  it("Positions equity rows are summed (additive), never MAX — opposite of Option Summary", () => {
    // Two additive equity lines for the same symbol in Positions sum to the true total.
    const ownership = deriveOwnershipFromPositions([
      equityHolding("ABC", 100),
      equityHolding("ABC", 100),
    ]);
    expect(ownership.get("ABC")).toBe(200);
  });

  it("Positions ignores non-equity rows (options/treasury/cash) for ownership", () => {
    const ownership = deriveOwnershipFromPositions([
      equityHolding("ABC", 100),
      { ...equityHolding("XYZ", 5), assetClass: "cash_equivalent", symbol: "SPAXX" },
      { ...equityHolding("T", 1000), assetClass: "fixed_income", symbol: "912797UH8" },
    ]);
    expect(ownership.get("ABC")).toBe(100);
    expect(ownership.has("SPAXX")).toBe(false);
    expect(ownership.has("912797UH8")).toBe(false);
  });
});
