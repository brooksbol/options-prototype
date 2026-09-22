/**
 * Tests for Fidelity upload flow — classification, slot validation, snapshot building.
 *
 * Tests the upload logic at the service layer (not React component rendering).
 * Validates that:
 * - Option Summary files classify correctly and fill the OS slot
 * - Balances files classify correctly and fill the Balances slot
 * - Wrong document type in wrong slot is rejected
 * - Both files required for READY snapshot
 * - Single file produces null or INCOMPLETE snapshot
 * - Replacement preserves prior valid state on failure
 */

import { describe, it, expect } from "vitest";
import { parseCsv, detectDelimiter } from "../../src/csv/reader";
import { preprocessCsv } from "../../src/csv/preprocess";
import { classifyDocument } from "../../src/csv/registry";
import "../../src/csv/fidelity"; // register parsers
import { FIDELITY_OPTION_SUMMARY_FIXTURE } from "../../src/csv/fixtures/optionSummary";
import { FIDELITY_BALANCES_FIXTURE } from "../../src/csv/fixtures/balances";
import { buildFidelitySnapshot } from "../../src/write-desk/fidelity-snapshot";
import type { OptionSummaryRow } from "../../src/csv/fidelity/optionSummaryParser";
import type { ParsedBalances } from "../../src/csv/fidelity/balancesParser";
import { classifyBalanceRegime, deriveDeployableCash } from "../../src/csv/fidelity/balancesParser";

// --- Helpers ---

function parseAndClassify(content: string) {
  const { csvContent } = preprocessCsv(content);
  const delimiter = detectDelimiter(csvContent);
  const doc = parseCsv(csvContent, delimiter);
  return classifyDocument(doc);
}

function parseOptionSummary(content: string): OptionSummaryRow[] {
  const { csvContent, preambleLines } = preprocessCsv(content);
  const delimiter = detectDelimiter(csvContent);
  const doc = parseCsv(csvContent, delimiter);
  const classification = classifyDocument(doc);
  const parsed = classification.parser!.parse(doc, { filename: "test.csv", preambleLines });
  return parsed.payload.rows as OptionSummaryRow[];
}

function parseBalances(content: string): ParsedBalances {
  const { csvContent, preambleLines } = preprocessCsv(content);
  const delimiter = detectDelimiter(csvContent);
  const doc = parseCsv(csvContent, delimiter);
  const classification = classifyDocument(doc);
  const parsed = classification.parser!.parse(doc, { filename: "test.csv", preambleLines });
  return parsed.payload.rows[0] as unknown as ParsedBalances;
}

// --- Classification Tests ---

describe("Fidelity upload — document classification", () => {
  it("Option Summary fixture classifies as fidelity_option_summary", () => {
    const result = parseAndClassify(FIDELITY_OPTION_SUMMARY_FIXTURE);
    expect(result.parser).not.toBeNull();
    expect(result.parser!.id).toBe("fidelity_option_summary");
  });

  it("Balances fixture classifies as fidelity_balances", () => {
    const result = parseAndClassify(FIDELITY_BALANCES_FIXTURE);
    expect(result.parser).not.toBeNull();
    expect(result.parser!.id).toBe("fidelity_balances");
  });

  it("Option Summary does NOT classify as balances", () => {
    const result = parseAndClassify(FIDELITY_OPTION_SUMMARY_FIXTURE);
    expect(result.parser!.id).not.toBe("fidelity_balances");
  });

  it("Balances does NOT classify as option_summary", () => {
    const result = parseAndClassify(FIDELITY_BALANCES_FIXTURE);
    expect(result.parser!.id).not.toBe("fidelity_option_summary");
  });
});

// --- Slot Validation (simulating the upload logic) ---

describe("Fidelity upload — slot validation", () => {
  it("uploading Option Summary into Option Summary slot succeeds", () => {
    const result = parseAndClassify(FIDELITY_OPTION_SUMMARY_FIXTURE);
    const isCorrectSlot = result.parser?.id === "fidelity_option_summary";
    expect(isCorrectSlot).toBe(true);
  });

  it("uploading Balances into Balances slot succeeds", () => {
    const result = parseAndClassify(FIDELITY_BALANCES_FIXTURE);
    const isCorrectSlot = result.parser?.id === "fidelity_balances";
    expect(isCorrectSlot).toBe(true);
  });

  it("uploading Balances into Option Summary slot produces rejection", () => {
    const result = parseAndClassify(FIDELITY_BALANCES_FIXTURE);
    // The upload handler checks: parser.id === "fidelity_option_summary"
    const isCorrectSlot = result.parser?.id === "fidelity_option_summary";
    expect(isCorrectSlot).toBe(false);
    // UI would show: "This file was classified as 'Fidelity Balances' — expected Fidelity Option Summary"
  });

  it("uploading Option Summary into Balances slot produces rejection", () => {
    const result = parseAndClassify(FIDELITY_OPTION_SUMMARY_FIXTURE);
    const isCorrectSlot = result.parser?.id === "fidelity_balances";
    expect(isCorrectSlot).toBe(false);
  });
});

// --- Both Files Required ---

describe("Fidelity upload — both files required for READY", () => {
  it("Option Summary alone produces INCOMPLETE snapshot", () => {
    const rows = parseOptionSummary(FIDELITY_OPTION_SUMMARY_FIXTURE);
    const snapshot = buildFidelitySnapshot({
      optionSummaryRows: rows,
      optionSummaryFilename: "Option_Summary.csv",
      optionSummaryExportTimestamp: null,
      balances: {
        availableToTrade: null,
        availableToTradeAllSettled: null,
        cashAndCredits: null,
        totalAccountValue: null,
        valueOfInvestments: null,
        availableToWithdraw: null,
        regimeEvidence: { marginFormatPresent: false, legacyAllSettledPresent: false },
        accountName: null,
        accountNumber: null,
        allRows: [], // empty — balances not loaded
      },
      balancesFilename: "",
      balancesExportTimestamp: null,
    });
    expect(snapshot.readiness.status).toBe("INCOMPLETE");
    expect(snapshot.readiness.blockReasons.length).toBeGreaterThan(0);
  });

  it("both valid files produce READY snapshot", () => {
    const rows = parseOptionSummary(FIDELITY_OPTION_SUMMARY_FIXTURE);
    const balances = parseBalances(FIDELITY_BALANCES_FIXTURE);
    const snapshot = buildFidelitySnapshot({
      optionSummaryRows: rows,
      optionSummaryFilename: "Option_Summary.csv",
      optionSummaryExportTimestamp: "2026-07-08T07:42:00Z",
      balances,
      balancesFilename: "Balances.csv",
      balancesExportTimestamp: "2026-07-08T07:43:00Z",
    });
    expect(snapshot.readiness.status).toBe("READY");
    expect(snapshot.deployableCash).toBe(7690); // All Settled
    expect(snapshot.inventory.length).toBeGreaterThan(0);
  });
});

// --- Snapshot Content from Real Fixtures ---

describe("Fidelity upload — snapshot content", () => {
  it("derives XLE inventory correctly from fixture", () => {
    const rows = parseOptionSummary(FIDELITY_OPTION_SUMMARY_FIXTURE);
    const balances = parseBalances(FIDELITY_BALANCES_FIXTURE);
    const snapshot = buildFidelitySnapshot({
      optionSummaryRows: rows,
      optionSummaryFilename: "test.csv",
      optionSummaryExportTimestamp: null,
      balances,
      balancesFilename: "test.csv",
      balancesExportTimestamp: null,
    });

    const xle = snapshot.inventory.find((p) => p.symbol === "XLE");
    expect(xle).toBeDefined();
    // Fixture: XLE shares appear as 200 in two CC strategy views (same shares)
    // Max seen = 200. Short calls: -2 + -2 = 4 contracts = 400 shares encumbered
    // But encumbered is capped at sharesOwned (200)
    expect(xle!.sharesOwned).toBe(200);
    expect(xle!.sharesEncumbered).toBe(200); // capped at owned
    expect(xle!.sharesFree).toBe(0);
    expect(xle!.maxAdditionalContracts).toBe(0);
  });

  it("derives SPYI as sub-100 position", () => {
    const rows = parseOptionSummary(FIDELITY_OPTION_SUMMARY_FIXTURE);
    const balances = parseBalances(FIDELITY_BALANCES_FIXTURE);
    const snapshot = buildFidelitySnapshot({
      optionSummaryRows: rows,
      optionSummaryFilename: "test.csv",
      optionSummaryExportTimestamp: null,
      balances,
      balancesFilename: "test.csv",
      balancesExportTimestamp: null,
    });

    const spyi = snapshot.inventory.find((p) => p.symbol === "SPYI");
    expect(spyi).toBeDefined();
    expect(spyi!.sharesOwned).toBeLessThan(100);
    expect(spyi!.maxAdditionalContracts).toBe(0);
  });

  it("derives existing short puts from fixture", () => {
    const rows = parseOptionSummary(FIDELITY_OPTION_SUMMARY_FIXTURE);
    const balances = parseBalances(FIDELITY_BALANCES_FIXTURE);
    const snapshot = buildFidelitySnapshot({
      optionSummaryRows: rows,
      optionSummaryFilename: "test.csv",
      optionSummaryExportTimestamp: null,
      balances,
      balancesFilename: "test.csv",
      balancesExportTimestamp: null,
    });

    expect(snapshot.existingPuts.length).toBeGreaterThan(0);
    // Fixture has XLE puts
    const xlePuts = snapshot.existingPuts.filter((p) => p.underlying === "XLE");
    expect(xlePuts.length).toBeGreaterThan(0);
  });

  it("deployable cash comes from All Settled (not Available to Trade top-level)", () => {
    const balances = parseBalances(FIDELITY_BALANCES_FIXTURE);
    // Fixture: Available to Trade = $32,690, All Settled = $7,690
    expect(balances.availableToTrade).toBe(32690);
    expect(balances.availableToTradeAllSettled).toBe(7690);

    const rows = parseOptionSummary(FIDELITY_OPTION_SUMMARY_FIXTURE);
    const snapshot = buildFidelitySnapshot({
      optionSummaryRows: rows,
      optionSummaryFilename: "test.csv",
      optionSummaryExportTimestamp: null,
      balances,
      balancesFilename: "test.csv",
      balancesExportTimestamp: null,
    });
    // Authority: All Settled
    expect(snapshot.deployableCash).toBe(7690);
  });

  it("loaded filenames are preserved in provenance", () => {
    const rows = parseOptionSummary(FIDELITY_OPTION_SUMMARY_FIXTURE);
    const balances = parseBalances(FIDELITY_BALANCES_FIXTURE);
    const snapshot = buildFidelitySnapshot({
      optionSummaryRows: rows,
      optionSummaryFilename: "Option_Summary_2026-07-08.csv",
      optionSummaryExportTimestamp: "2026-07-08T07:42:00Z",
      balances,
      balancesFilename: "Balances_2026-07-08.csv",
      balancesExportTimestamp: "2026-07-08T07:43:00Z",
    });
    expect(snapshot.provenance.optionSummaryFilename).toBe("Option_Summary_2026-07-08.csv");
    expect(snapshot.provenance.balancesFilename).toBe("Balances_2026-07-08.csv");
  });

  it("file replacement invalidation: new snapshot is independent of old", () => {
    const rows = parseOptionSummary(FIDELITY_OPTION_SUMMARY_FIXTURE);
    const balances = parseBalances(FIDELITY_BALANCES_FIXTURE);
    const snap1 = buildFidelitySnapshot({
      optionSummaryRows: rows,
      optionSummaryFilename: "first.csv",
      optionSummaryExportTimestamp: null,
      balances,
      balancesFilename: "first_bal.csv",
      balancesExportTimestamp: null,
    });
    const snap2 = buildFidelitySnapshot({
      optionSummaryRows: rows,
      optionSummaryFilename: "second.csv",
      optionSummaryExportTimestamp: null,
      balances,
      balancesFilename: "second_bal.csv",
      balancesExportTimestamp: null,
    });
    // Independent snapshots have different provenance filenames
    expect(snap2.provenance.optionSummaryFilename).toBe("second.csv");
    expect(snap1.provenance.optionSummaryFilename).toBe("first.csv");
  });
});

// --- BUG-022: regime-aware Deployable cash (current margin-format export layout) ---
//
// The margin-format "Balances" export uses "AVAILABLE TO TRADE" as a blank section
// header with the capacity values in sub-rows. Wheelwright's unlevered Deployable is
// "Available without margin impact" in this regime — NEVER "Non-margin buying power",
// which reflects margin-inclusive capacity. Distinct broker facts are preserved and not
// folded into the legacy "all settled" slot.

// --- Live acceptance specimen: PTS (margin-enabled), exported 2026-09-17 ---
// The BUG-022 negative specimen. Non-margin buying power ($6,734.37) is non-zero while
// Available without margin impact and Settled cash are both $0. Correct Deployable = $0;
// Wheelwright must NOT surface the $6,734.37 as Deployable.
const FIDELITY_BALANCES_PTS_MARGIN = `,Balance,Day change
Total account value,113842.91,2244.36
Account equity percentage,100.00%,
AVAILABLE TO TRADE,,
Margin buying power,13468.74,13366.24
Non-margin buying power,6734.37,6683.12
Available without margin impact,0,-51.25
Cash reserved for options strategies,900,
Settled cash,0,
AVAILABLE TO WITHDRAW,,
Cash only,0,
Cash and borrowing on margin,0,
MARGIN STATUS,,
House surplus,7393.18,7341.93
SMA,6734.37,6683.12
Exchange surplus,7677.52,7626.27
No margin interest accrued,,
HOLDINGS,,
Cash market value,106209.61,-2423.69
Margin market value,8666.38,8666.38
Option market value,-1997,-1831
Cash (core),5051.25,
Cash debit,-4165.33,-2195.9
Margin credit/debit,0,0
`;

// --- Live acceptance specimen: Sawdust Roth (legacy / non-margin), exported 2026-09-17 ---
// The BUG-022 positive specimen for the legacy regime. No margin fields present; the
// value-bearing "Available to trade (all settled)" row is the Deployable source ($510.28).
const FIDELITY_BALANCES_SAWDUST_LEGACY = `,Balance,Day change
Total account value,23736.47,67.64
AVAILABLE TO TRADE,,
Available to trade (all settled),510.28,
Available to withdraw,510.28,
HOLDINGS,,
Cash and credits,10310.28,
Value of your investments,13426.19,21.64
`;

// Margin-format export where Non-margin buying power ($56,552.99) and Available without
// margin impact ($56,552.99) agree, but Settled cash ($47,051.19) diverges. Deployable is
// Available without margin impact; Settled cash is retained as a distinct fact only.
const FIDELITY_BALANCES_MARGIN_SETTLED_DIVERGES = `,Balance,Day change
Total account value,115591.63,565.11
Account equity percentage,100.00%,
AVAILABLE TO TRADE,,
Margin buying power,113105.98,113105.98
Non-margin buying power,56552.99,56552.99
Available without margin impact,56552.99,56552.99
Cash reserved for options strategies,2100,
Settled cash,47051.19,
AVAILABLE TO WITHDRAW,,
Cash only,47051.19,
Cash and borrowing on margin,47051.19,
`;

// --- REAL LIVE SPECIMEN: PTS margin-enabled account (Z39411514), exported 2026-09-21 ---
// Verbatim body of the Fidelity Balances export. AWMI = Settled cash = $849.30 here (they
// happen to agree in this specimen); Deployable is AWMI ($849.30) in the MARGIN regime.
// Non-margin buying power ($9,547.54) must NOT surface as Deployable. MARGIN STATUS present.
const FIDELITY_BALANCES_PTS_MARGIN_2026_09_21 = `,Balance,Day change
Total account value,114996.37,171.62
Account equity percentage,100.00%,
AVAILABLE TO TRADE,,
Margin buying power,19095.08,1652.22
Non-margin buying power,9547.54,826.11
Available without margin impact,849.3,826.11
Settled cash,849.3,
AVAILABLE TO WITHDRAW,,
Cash only,849.3,
Cash and borrowing on margin,9494.31,
MARGIN STATUS,,
House surplus,10204.83,856.9
SMA,9547.54,826.11
Exchange surplus,10531.15,859.1
No margin interest accrued,,
HOLDINGS,,
Cash market value,104344.07,12.52
Margin market value,10689,43.99
Option market value,-4646,-2222
Cash and credits,849.3,-73.89
`;

// --- REAL LIVE SPECIMEN: Sawdust Roth cash (non-margin) account (262761078), exported
//     2026-09-21. Verbatim body. Sep-2026 cash layout: NO "(all settled)" row, NO MARGIN
//     STATUS. Headline "Available to trade" ($458.42) is Deployable; "Settled cash" ($51.06)
//     is withdrawal-oriented and is NOT Deployable. This is the format that regressed the
//     baseline parser to INDETERMINATE and blocked the Roth account. ---
const FIDELITY_BALANCES_SAWDUST_CASH_2026_09 = `,Balance,Day change
Total account value,23826.12,-69.04
AVAILABLE TO TRADE,,
Available to trade,458.42,
Settled cash,51.06,
Available to withdraw,51.06,
HOLDINGS,,
Cash and credits,458.42,
Value of your investments,23367.7,10219.82
`;

function snapshotFromBalancesText(balancesText: string) {
  const rows = parseOptionSummary(FIDELITY_OPTION_SUMMARY_FIXTURE);
  const balances = parseBalances(balancesText);
  return buildFidelitySnapshot({
    optionSummaryRows: rows,
    optionSummaryFilename: "test.csv",
    optionSummaryExportTimestamp: null,
    balances,
    balancesFilename: "test.csv",
    balancesExportTimestamp: null,
  });
}

describe("Fidelity upload — BUG-022 regime-aware Deployable", () => {
  // --- MARGIN regime ---

  it("classifies the margin-format export as fidelity_balances", () => {
    const result = parseAndClassify(FIDELITY_BALANCES_PTS_MARGIN);
    expect(result.parser).not.toBeNull();
    expect(result.parser!.id).toBe("fidelity_balances");
  });

  it("preserves distinct broker facts without folding them (PTS margin specimen)", () => {
    const balances = parseBalances(FIDELITY_BALANCES_PTS_MARGIN);
    expect(balances.settledCash).toBe(0);
    expect(balances.nonMarginBuyingPower).toBe(6734.37);
    expect(balances.marginBuyingPower).toBe(13468.74);
    expect(balances.availableWithoutMarginImpact).toBe(0);
    expect(balances.cashReservedForOptions).toBe(900);
    expect(balances.totalAccountValue).toBe(113842.91);
    // The legacy "all settled" slot is NOT populated by the fold — it stays absent in
    // the margin format (no legacy "Available to trade (all settled)" row).
    expect(balances.availableToTradeAllSettled).toBeNull();
  });

  it("LIVE PTS specimen → Deployable is $0, NOT the $6,734.37 Non-margin buying power", () => {
    const snapshot = snapshotFromBalancesText(FIDELITY_BALANCES_PTS_MARGIN);
    expect(snapshot.deployableCash).toBe(0);
    // Regression guard: the folded value must never reappear as Deployable.
    expect(snapshot.deployableCash).not.toBe(6734.37);
  });

  it("LIVE PTS 2026-09-21 specimen → MARGIN; Deployable is $849.30 from AWMI (not the $9,547.54 NMBP)", () => {
    const balances = parseBalances(FIDELITY_BALANCES_PTS_MARGIN_2026_09_21);
    expect(balances.regimeEvidence.marginFormatPresent).toBe(true);
    expect(classifyBalanceRegime(balances)).toBe("MARGIN");
    expect(balances.availableWithoutMarginImpact).toBe(849.3);
    expect(balances.nonMarginBuyingPower).toBe(9547.54);
    expect(balances.settledCash).toBe(849.3);
    expect(deriveDeployableCash(balances)).toBe(849.3);
    const snapshot = snapshotFromBalancesText(FIDELITY_BALANCES_PTS_MARGIN_2026_09_21);
    expect(snapshot.deployableCash).toBe(849.3);
    expect(snapshot.deployableCash).not.toBe(9547.54);
  });

  it("uses Available without margin impact (not Non-margin buying power, not Settled cash) when they diverge", () => {
    const balances = parseBalances(FIDELITY_BALANCES_MARGIN_SETTLED_DIVERGES);
    expect(balances.nonMarginBuyingPower).toBe(56552.99);
    expect(balances.availableWithoutMarginImpact).toBe(56552.99);
    expect(balances.settledCash).toBe(47051.19);
    const snapshot = snapshotFromBalancesText(FIDELITY_BALANCES_MARGIN_SETTLED_DIVERGES);
    expect(snapshot.deployableCash).toBe(56552.99);
  });

  // --- LEGACY_CASH regime ---

  it("LIVE Sawdust specimen → Deployable is $510.28 from 'Available to trade (all settled)'", () => {
    const balances = parseBalances(FIDELITY_BALANCES_SAWDUST_LEGACY);
    expect(balances.availableToTradeAllSettled).toBe(510.28);
    // Margin fields absent in the legacy format.
    expect(balances.nonMarginBuyingPower ?? null).toBeNull();
    expect(balances.availableWithoutMarginImpact ?? null).toBeNull();
    const snapshot = snapshotFromBalancesText(FIDELITY_BALANCES_SAWDUST_LEGACY);
    expect(snapshot.deployableCash).toBe(510.28);
  });

  // --- Sep-2026 cash-account layout: "(all settled)" suffix dropped, "Settled cash"
  //     broken out into its own row. This is the format that regressed to INDETERMINATE.
  //     Sawdust Roth specimen (exported Sep-2026): headline "Available to trade" carries
  //     the tradable figure ($458.42); "Settled cash" ($51.06) is withdrawal-oriented and
  //     is NOT Deployable. No "(all settled)" row, no MARGIN STATUS. ---
  it("Sep-2026 Sawdust cash layout → LEGACY_CASH; Deployable is $458.42 from 'Available to trade'", () => {
    const balances = parseBalances(FIDELITY_BALANCES_SAWDUST_CASH_2026_09);
    // No legacy all-settled row, no margin evidence — presence of a value-bearing
    // "Available to trade" row is what marks the cash regime.
    expect(balances.availableToTradeAllSettled).toBeNull();
    expect(balances.availableToTrade).toBe(458.42);
    expect(balances.settledCash).toBe(51.06);
    expect(balances.regimeEvidence.legacyAllSettledPresent).toBe(false);
    expect(balances.regimeEvidence.marginFormatPresent).toBe(false);
    expect(balances.regimeEvidence.availableToTradePresent).toBe(true);
    expect(classifyBalanceRegime(balances)).toBe("LEGACY_CASH");
    // Deployable falls back to "Available to trade" (headline tradable), NOT "Settled cash".
    expect(deriveDeployableCash(balances)).toBe(458.42);
    const snapshot = snapshotFromBalancesText(FIDELITY_BALANCES_SAWDUST_CASH_2026_09);
    expect(snapshot.deployableCash).toBe(458.42);
    expect(snapshot.readiness.status).toBe("READY");
  });

  it("Sep-2026 cash layout: when BOTH an all-settled row and a headline row exist, prefers all-settled", () => {
    // Guard the preference direction: a pre-Sep-2026 cash export can expose a larger
    // headline "Available to trade" alongside the smaller settled "(all settled)" figure.
    // The settled figure remains the ratified Deployable authority.
    const bothForms = `,Balance,Day change
Total account value,23736.47,67.64
AVAILABLE TO TRADE,,
Available to trade,900.00,
Available to trade (all settled),510.28,
Available to withdraw,510.28,
`;
    const balances = parseBalances(bothForms);
    expect(balances.availableToTrade).toBe(900.0);
    expect(balances.availableToTradeAllSettled).toBe(510.28);
    expect(classifyBalanceRegime(balances)).toBe("LEGACY_CASH");
    expect(deriveDeployableCash(balances)).toBe(510.28);
  });

  // --- INDETERMINATE regime (fail-closed) ---

  it("INDETERMINATE regime (no regime-appropriate field) yields null Deployable and blocks readiness", () => {
    // A balances export with a total but no legacy all-settled row and no margin fields.
    const indeterminate = `,Balance,Day change
Total account value,50000,0
HOLDINGS,,
Cash and credits,1234,
`;
    const balances = parseBalances(indeterminate);
    expect(balances.availableToTradeAllSettled).toBeNull();
    expect(balances.nonMarginBuyingPower ?? null).toBeNull();
    expect(balances.availableWithoutMarginImpact ?? null).toBeNull();
    const snapshot = snapshotFromBalancesText(indeterminate);
    expect(snapshot.deployableCash).toBeNull();
    expect(snapshot.readiness.status).toBe("INCOMPLETE");
    expect(snapshot.readiness.blockReasons.length).toBeGreaterThan(0);
  });

  // --- Regime by PRESENCE, not numeric value (BUG-022 correction) ---

  it("present-but-blank margin fields classify MARGIN and fail closed (null), NOT legacy cash", () => {
    // Margin-format export whose margin capacity rows are present but blank. There is no
    // legacy "Available to trade (all settled)" row. Regime must be MARGIN by presence;
    // Deployable must be null (fail closed) — it must NOT fall through to any legacy value.
    const blankMargin = `,Balance,Day change
Total account value,113842.91,2244.36
Account equity percentage,100.00%,
AVAILABLE TO TRADE,,
Margin buying power,,
Non-margin buying power,,
Available without margin impact,,
Cash reserved for options strategies,,
Settled cash,,
MARGIN STATUS,,
House surplus,,
`;
    const balances = parseBalances(blankMargin);
    // Presence recorded despite blank numeric values.
    expect(balances.regimeEvidence.marginFormatPresent).toBe(true);
    expect(balances.regimeEvidence.legacyAllSettledPresent).toBe(false);
    expect(classifyBalanceRegime(balances)).toBe("MARGIN");
    // Blank AWMI → no Deployable value → fail closed, NOT legacy fallback.
    expect(deriveDeployableCash(balances)).toBeNull();
    const snapshot = snapshotFromBalancesText(blankMargin);
    expect(snapshot.deployableCash).toBeNull();
    expect(snapshot.readiness.status).toBe("INCOMPLETE");
  });

  it("MARGIN STATUS section alone marks the margin regime (presence, not numeric value)", () => {
    // Even if only the MARGIN STATUS section is recognizable, the export is margin-format
    // and must not be treated as legacy cash.
    const marginStatusOnly = `,Balance,Day change
Total account value,113842.91,2244.36
AVAILABLE TO TRADE,,
Available without margin impact,4200,
MARGIN STATUS,,
House surplus,7393.18,7341.93
`;
    const balances = parseBalances(marginStatusOnly);
    expect(balances.regimeEvidence.marginFormatPresent).toBe(true);
    expect(classifyBalanceRegime(balances)).toBe("MARGIN");
    // AWMI present ($4,200) → that is Deployable in the margin regime.
    expect(deriveDeployableCash(balances)).toBe(4200);
  });
});
