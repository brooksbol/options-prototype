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

// --- Current-format Balances (Sep 2026 export layout) ---

// Real Fidelity "Balances" export layout as of Sep 2026: "AVAILABLE TO TRADE" is a
// blank section header. Deployable cash is Fidelity's tactical trading capacity —
// "Non-margin buying power" (equivalently "Available without margin impact") — per the
// 2026-09-08 Principal decision. In this early export, Non-margin buying power happened to
// equal Settled cash, so both resolve to the same value.
const FIDELITY_BALANCES_CURRENT_FORMAT = `,Balance,Day change
Total account value,115450.72,424.2
Account equity percentage,100.00%,
AVAILABLE TO TRADE,,
Margin buying power,94102.38,94102.38
Non-margin buying power,47051.19,47051.19
Available without margin impact,47051.19,47051.19
Cash reserved for options strategies,2100,
Settled cash,47051.19,
AVAILABLE TO WITHDRAW,,
Cash only,47051.19,
Cash and borrowing on margin,47051.19,
MARGIN STATUS,,
House surplus,47051.19,46399.02
`;

// Real Fidelity export (2026-09-08) where Non-margin buying power ($56,552.99) and
// Settled cash ($47,051.19) DIVERGE. Per the 2026-09-08 Principal decision, deployable
// cash is the tactical trading capacity Fidelity actually permits — Non-margin buying
// power ($56,552.99) — not Settled cash. Settled cash remains captured as evidence.
const FIDELITY_BALANCES_DIVERGENT = `,Balance,Day change
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

// Hypothetical export missing "Non-margin buying power" but retaining the equivalent
// "Available without margin impact". Deployable cash resolves from the equivalent label.
const FIDELITY_BALANCES_NMBP_VIA_EQUIVALENT = `,Balance,Day change
Total account value,115591.63,565.11
Account equity percentage,100.00%,
AVAILABLE TO TRADE,,
Margin buying power,113105.98,113105.98
Available without margin impact,56552.99,56552.99
Cash reserved for options strategies,2100,
Settled cash,47051.19,
AVAILABLE TO WITHDRAW,,
Cash only,47051.19,
`;

describe("Fidelity upload — current-format Balances (Sep 2026)", () => {
  it("classifies as fidelity_balances", () => {
    const result = parseAndClassify(FIDELITY_BALANCES_CURRENT_FORMAT);
    expect(result.parser).not.toBeNull();
    expect(result.parser!.id).toBe("fidelity_balances");
  });

  it("extracts authoritative deployable cash from Non-margin buying power", () => {
    const balances = parseBalances(FIDELITY_BALANCES_CURRENT_FORMAT);
    // Downstream (fidelity-snapshot) resolves deployableCash = availableToTradeAllSettled ?? availableToTrade
    const deployable = balances.availableToTradeAllSettled ?? balances.availableToTrade;
    expect(deployable).toBe(47051.19); // Non-margin BP == Settled cash in this early export
  });

  it("captures current-format sub-fields", () => {
    const balances = parseBalances(FIDELITY_BALANCES_CURRENT_FORMAT);
    expect(balances.settledCash).toBe(47051.19);
    expect(balances.nonMarginBuyingPower).toBe(47051.19);
    expect(balances.availableWithoutMarginImpact).toBe(47051.19);
    expect(balances.cashReservedForOptions).toBe(2100);
    expect(balances.totalAccountValue).toBe(115450.72);
  });

  it("uses Non-margin buying power (not Settled cash) when the two diverge", () => {
    const balances = parseBalances(FIDELITY_BALANCES_DIVERGENT);
    // Non-margin BP = $56,552.99 is the tactical deployable figure Fidelity permits;
    // Settled cash = $47,051.19 is retained only as evidence.
    expect(balances.settledCash).toBe(47051.19);
    expect(balances.nonMarginBuyingPower).toBe(56552.99);
    expect(balances.availableToTradeAllSettled).toBe(56552.99);
    const deployable = balances.availableToTradeAllSettled ?? balances.availableToTrade;
    expect(deployable).toBe(56552.99);
  });

  it("resolves deployable cash from Available without margin impact when Non-margin buying power is absent", () => {
    const balances = parseBalances(FIDELITY_BALANCES_NMBP_VIA_EQUIVALENT);
    expect(balances.nonMarginBuyingPower).toBeNull();
    expect(balances.availableWithoutMarginImpact).toBe(56552.99);
    expect(balances.availableToTradeAllSettled).toBe(56552.99);
    const deployable = balances.availableToTradeAllSettled ?? balances.availableToTrade;
    expect(deployable).toBe(56552.99);
  });
});
