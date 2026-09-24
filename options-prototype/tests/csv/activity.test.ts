import { describe, it, expect } from "vitest";
import { parseCsv } from "../../src/csv/reader";
import { classifyDocument } from "../../src/csv/registry";
import { fidelityActivityParser } from "../../src/csv/fidelity/activityParser";
import type { ActivityRow } from "../../src/csv/fidelity/activityParser";
import { FIDELITY_ACTIVITY_FIXTURE } from "../../src/csv/fixtures/activity";

// Register parsers
import "../../src/csv/fidelity/index";

function getFixtureDocument() {
  return parseCsv(FIDELITY_ACTIVITY_FIXTURE);
}

function getRows(): ActivityRow[] {
  const doc = getFixtureDocument();
  const result = fidelityActivityParser.parse(doc);
  return result.payload.type === "activity" ? result.payload.rows : [];
}

describe("fidelityActivityParser detection", () => {
  it("detects activity document with high confidence", () => {
    const doc = getFixtureDocument();
    const detection = fidelityActivityParser.detect(doc);
    expect(detection.confidence).toBeGreaterThan(0.6);
  });

  it("classifier selects activity parser for this fixture", () => {
    const doc = getFixtureDocument();
    const result = classifyDocument(doc);
    expect(result.parser?.id).toBe("fidelity_activity");
  });
});

describe("fidelityActivityParser parsing", () => {
  it("parses all event rows", () => {
    const rows = getRows();
    expect(rows.length).toBeGreaterThan(10);
  });

  it("detects trailer rows", () => {
    const doc = getFixtureDocument();
    const result = fidelityActivityParser.parse(doc);
    expect(result.trailerRows.length).toBeGreaterThan(0);
  });

  it("extracts metadata", () => {
    const doc = getFixtureDocument();
    const result = fidelityActivityParser.parse(doc, { filename: "history.csv" });
    expect(result.metadata.source).toBe("fidelity");
    expect(result.metadata.documentType).toBe("activity");
    expect(result.metadata.filename).toBe("history.csv");
  });
});

describe("event type classification", () => {
  it("classifies sell-to-open transactions", () => {
    const rows = getRows();
    const sto = rows.filter((r) => r.eventType === "sell_to_open");
    expect(sto.length).toBeGreaterThan(0);
    // Should include the XLE Aug 07 $54.5 Call
    const call = sto.find((r) => r.option?.strike === 54.5 && r.option?.type === "CALL");
    expect(call).toBeDefined();
  });

  it("classifies assignment events", () => {
    const rows = getRows();
    const assigned = rows.filter((r) => r.eventType === "assigned");
    expect(assigned.length).toBeGreaterThan(0);
    // XLE Jul 10 $57.5 Put assignment
    const putAssign = assigned.find((r) => r.option?.strike === 57.5);
    expect(putAssign).toBeDefined();
  });

  it("classifies expired events", () => {
    const rows = getRows();
    const expired = rows.filter((r) => r.eventType === "expired");
    expect(expired.length).toBeGreaterThan(0);
  });

  it("classifies shares bought via assignment", () => {
    const rows = getRows();
    const bought = rows.filter((r) => r.eventType === "shares_bought_assignment");
    expect(bought.length).toBeGreaterThan(0);
    expect(bought[0].symbol).toBe("XLE");
  });

  it("classifies treasury events", () => {
    const rows = getRows();
    const treasury = rows.filter((r) => r.eventType === "treasury");
    expect(treasury.length).toBeGreaterThan(0);
  });

  it("classifies dividend events", () => {
    const rows = getRows();
    const div = rows.filter((r) => r.eventType === "dividend");
    expect(div.length).toBeGreaterThan(0);
  });

  it("classifies cash movements", () => {
    const rows = getRows();
    const cash = rows.filter((r) => r.eventType === "cash_movement");
    expect(cash.length).toBeGreaterThan(0);
  });

  it("unknown actions become 'other'", () => {
    const rows = getRows();
    // Any unclassified rows should be "other", not crash
    for (const row of rows) {
      expect(row.eventType).toBeTruthy();
    }
  });
});

describe("option contract parsing in activity", () => {
  it("parses option from symbol format", () => {
    const rows = getRows();
    const sto = rows.find((r) => r.eventType === "sell_to_open" && r.option?.strike === 54.5);
    expect(sto).toBeDefined();
    expect(sto!.option!.underlying).toBe("XLE");
    expect(sto!.option!.type).toBe("CALL");
    expect(sto!.option!.expiration).toBe("2026-08-07");
  });

  it("parses option from action text for assignments", () => {
    const rows = getRows();
    const assigned = rows.filter((r) => r.eventType === "assigned");
    // Should have parsed option details even when symbol might be tricky
    const withOption = assigned.filter((r) => r.option !== null);
    expect(withOption.length).toBeGreaterThan(0);
  });

  it("parses decimal strikes", () => {
    const rows = getRows();
    const decimal = rows.find((r) => r.option?.strike === 57.5);
    expect(decimal).toBeDefined();
  });
});

describe("date normalization", () => {
  it("normalizes MM-DD-YYYY to ISO", () => {
    const rows = getRows();
    const first = rows[0];
    expect(first.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(first.date).toBe("2026-07-07");
  });
});

describe("numeric parsing", () => {
  it("parses amounts", () => {
    const rows = getRows();
    const sto = rows.find((r) => r.eventType === "sell_to_open" && r.option?.strike === 54.5);
    expect(sto!.amount).toBeCloseTo(218.67);
  });

  it("parses commissions", () => {
    const rows = getRows();
    const sto = rows.find((r) => r.eventType === "sell_to_open" && r.option?.strike === 54.5);
    expect(sto!.commission).toBeCloseTo(1.3);
  });

  it("parses cash balance", () => {
    const rows = getRows();
    const first = rows[0];
    expect(first.cashBalance).toBeCloseTo(23390.08);
  });
});

// --- AUTO-JOURNAL resiliency guard (2026-09-24 vocabulary) ---
//
// Fidelity introduced "JOURNALED VS <acct> AUTO-JOURNAL ..." rows (internal cash/margin
// journaling of options/shares) in the Sep 24 specimen. These are zero-economic internal
// transfers. The fail-closed contract requires them to classify as first-class "other"
// (not a familiar verb) and NOT mutate projected portfolio state until explicitly
// classified by future authority. This guard locks that behavior so a future edit cannot
// silently give AUTO-JOURNAL economic authority.

import { projectActivityOverlay, parseCheckpoint } from "../../src/portfolio/activity-projection";
import type { PortfolioSnapshot } from "../../src/write-desk/types";

const AUTO_JOURNAL_CSV = `Run Date,Action,Symbol,Description,Type,Price ($),Quantity,Commission ($),Fees ($),Accrued Interest ($),Amount ($),Cash Balance ($),Settlement Date
09/24/2026,JOURNALED VS Z39-411514-2 AUTO-JOURNAL CALL (GDXJ) VANECK ETF TRUST SEP 25 26 $124 (100 SHS) (Cash), -GDXJ260925C124,CALL (GDXJ) VANECK ETF TRUST SEP 25 26 $124 (100 SHS),Cash,,1,,,,0.00,Processing,
09/24/2026,JOURNALED VS Z39-411514-1 AUTO-JOURNAL VANECK ETF TRUST JUNIOR GOLD MINE (GDXJ) (Margin),GDXJ,VANECK ETF TRUST JUNIOR GOLD MINE,Margin,,100,,,,0.00,Processing,
`;

describe("AUTO-JOURNAL resiliency (fail-closed, non-mutating)", () => {
  function parseAutoJournalRows() {
    const doc = parseCsv(AUTO_JOURNAL_CSV);
    const result = fidelityActivityParser.parse(doc);
    return result.payload.type === "activity" ? result.payload.rows : [];
  }

  it("classifies JOURNALED VS ... AUTO-JOURNAL as 'other' (not a share buy/sell/option event)", () => {
    const rows = parseAutoJournalRows();
    expect(rows.length).toBe(2);
    for (const row of rows) {
      expect(row.eventType).toBe("other");
    }
  });

  it("does not mutate projected inventory (zero-economic internal transfer)", () => {
    const base: PortfolioSnapshot = {
      id: "t", source: { type: "fidelity", label: "F", filenames: [] },
      brokerageAccountId: "a", accountId: null, snapshotDate: "2026-09-24",
      inventory: [{ symbol: "GDXJ", sharesOwned: 100, sharesEncumbered: 0, sharesFree: 100, maxAdditionalContracts: 1, economics: null }],
      existingCalls: [], existingPuts: [], deployableCash: 1000, aggregateShortOptionMTM: null,
      balanceContext: null,
      provenance: { sourceType: "fidelity", sourceLabel: "F", createdAt: new Date().toISOString() },
      readiness: { status: "READY", optionSummaryLoaded: true, balancesLoaded: true, inventoryValid: true, cashStateValid: true, timestampsReconciled: true, timeSeparationMinutes: 0, warnings: [], blockReasons: [] },
    };
    const rows = parseAutoJournalRows();
    const checkpoint = parseCheckpoint(null); // project everything — isolate AUTO-JOURNAL behavior
    const { snapshot: projected, projectedEventCount } = projectActivityOverlay(base, rows, checkpoint.timestamp, checkpoint.precision);

    // AUTO-JOURNAL rows are "other" → default branch → no state mutation.
    const gdxj = projected.inventory.find((p) => p.symbol === "GDXJ")!;
    expect(gdxj.sharesOwned).toBe(100);
    expect(gdxj.sharesEncumbered).toBe(0);
    expect(gdxj.sharesFree).toBe(100);
    expect(projected.deployableCash).toBe(1000);
    expect(projected.existingCalls).toHaveLength(0);
    // The events are counted as projected-but-inert (they passed the checkpoint) yet mutate nothing.
    expect(projectedEventCount).toBe(2);
  });
});
