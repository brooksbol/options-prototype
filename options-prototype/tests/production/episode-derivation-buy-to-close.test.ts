/**
 * Episode Derivation — Buy-to-Close (BTC) Presentation Truth (BUG-021, third amendment)
 *
 * SINGLE-AUTHORITY MODEL (ADR-016): the backend Production path is the sole authority for BTC
 * recognized-lifecycle association. The frontend RENDERS the authoritative OptionCloseResult; it
 * must NOT independently reconstruct matched/residual/excess/status. These tests supply backend
 * OptionCloseResult objects and assert the close chapters render them faithfully:
 *
 *   - DETERMINISTIC_COMPLETE  → "Closed · obligation retired", deterministic, encumbrance removed;
 *   - DETERMINISTIC_PARTIAL   → "Partially closed", deterministic, residual from result;
 *   - OVER_CLOSE              → over-close, partial, excess from result;
 *   - UNRESOLVED / no result  → association unresolved, unresolved confidence, no encumbrance claim;
 *   - each executed close is its own dated chapter; the executed debit is shown from the row.
 *
 * A divergence guard proves the frontend does not override the backend: given an activity pattern
 * that a naive local resolver would call "complete", but a backend result of UNRESOLVED, the
 * chapter must render UNRESOLVED.
 */

import { describe, it, expect } from "vitest";
import { deriveEpisodeChapters } from "../../src/production/episode-derivation";
import { buildProductionCsv, NULL_TOKEN } from "../../src/production/production-csv-export";
import type { ActivityRow } from "../../src/csv/fidelity/activityParser";
import type { ParsedOptionContract } from "../../src/csv/fidelity/parseOptionContract";
import type { OptionCloseResult, ProductionAssessmentResponse } from "../../src/production/production-types";

function putOpt(u: string, s: number, e: string): ParsedOptionContract { return { underlying: u, expiration: e, strike: s, type: "PUT" }; }
function occ(u: string, s: number, e: string) { return ` -${u}${e.replace(/-/g, "").slice(2)}P${s}`; }

function sto(date: string, u: string, s: number, e: string, prem: number, qty = -1): ActivityRow {
  return {
    date, eventType: "sell_to_open", action: `YOU SOLD OPENING TRANSACTION PUT (${u}) ... ${s}`,
    symbol: occ(u, s, e), description: "", quantity: qty, price: prem / 100, commission: 0.65, fees: 0.03,
    amount: prem, cashBalance: null, settlementDate: null, option: putOpt(u, s, e), rawRow: [],
  };
}
function btc(date: string, u: string, s: number, e: string, debit: number | null, qty: number | null = 1): ActivityRow {
  return {
    date, eventType: "buy_to_close", action: `YOU BOUGHT CLOSING TRANSACTION PUT (${u}) ... ${s}`,
    symbol: occ(u, s, e), description: "", quantity: qty, price: debit != null && qty ? Math.abs(debit) / 100 : null,
    commission: 0.65, fees: 0.01, amount: debit, cashBalance: null, settlementDate: null,
    option: putOpt(u, s, e), rawRow: [],
  };
}

/**
 * Build an authoritative OptionCloseResult whose identity fields MATCH the BTC activity row (the
 * frontend keys on symbol|date|action|debit|quantity). This simulates the backend authority.
 */
function result(
  u: string, s: number, e: string, date: string, debit: number | null, qty: number | null,
  status: OptionCloseResult["status"],
  fields: Partial<OptionCloseResult> = {},
): OptionCloseResult {
  const q = qty ?? 0;
  return {
    closeFingerprint: `${u}-${date}-${debit}-${qty}`,
    contractKey: occ(u, s, e).trim(),
    symbol: occ(u, s, e),
    date,
    action: `YOU BOUGHT CLOSING TRANSACTION PUT (${u}) ... ${s}`,
    executedDebit: debit,
    closedQuantity: qty,
    outstandingBeforeMin: q, outstandingBeforeMax: q,
    matchedMin: q, matchedMax: q,
    residualMin: 0, residualMax: 0,
    excessUnmatched: 0,
    status,
    reason: "test",
    ...fields,
  };
}

function closesOf(rows: ActivityRow[], results: OptionCloseResult[], month = "2026-07") {
  const ch = deriveEpisodeChapters({
    activityRows: rows, snapshot: null, assessedTransactions: null,
    dispositionResults: null, optionCloseResults: results, targetMonth: month,
  });
  return ch.filter(c => c.whatHappened.startsWith("Closed") || c.whatHappened.startsWith("Partially closed"));
}

describe("episode-derivation BTC presentation renders the authoritative backend result (BUG-021 A3)", () => {
  it("DETERMINISTIC_COMPLETE → obligation retired, deterministic, encumbrance removed for matched qty", () => {
    const rows = [sto("2026-07-05", "EWY", 150, "2026-08-21", 150), btc("2026-07-20", "EWY", 150, "2026-08-21", -40, 1)];
    const res = [result("EWY", 150, "2026-08-21", "2026-07-20", -40, 1, "DETERMINISTIC_COMPLETE",
      { outstandingBeforeMin: 1, outstandingBeforeMax: 1, matchedMin: 1, matchedMax: 1, residualMin: 0, residualMax: 0 })];
    const c = closesOf(rows, res);
    expect(c.length).toBe(1);
    expect(c[0].whatHappened).toBe("Closed · obligation retired");
    expect(c[0].confidence).toBe("deterministic");
    expect(c[0].productionAmount).toBeCloseTo(-40, 2); // executed debit, per-event
    expect(c[0].capitalLabel).toContain("nominal encumbrance removed"); // matched exact = 1
  });

  it("DETERMINISTIC_PARTIAL → partially closed with residual FROM the result", () => {
    const rows = [sto("2026-07-05", "EWY", 150, "2026-08-21", 300, -2), btc("2026-07-20", "EWY", 150, "2026-08-21", -40, 1)];
    const res = [result("EWY", 150, "2026-08-21", "2026-07-20", -40, 1, "DETERMINISTIC_PARTIAL",
      { outstandingBeforeMin: 2, outstandingBeforeMax: 2, matchedMin: 1, matchedMax: 1, residualMin: 1, residualMax: 1 })];
    const c = closesOf(rows, res);
    expect(c[0].whatHappened).toBe("Partially closed");
    expect(c[0].confidence).toBe("deterministic");
    expect(c[0].conditionalLabel).toContain("1 still open"); // residual from result
    expect(c[0].productionAmount).toBeCloseTo(-40, 2);
    expect(c[0].productionLabel).not.toContain("episode net"); // no fabricated P&L
  });

  it("OVER_CLOSE → over-close with excess FROM the result", () => {
    const rows = [sto("2026-07-05", "EWY", 150, "2026-08-21", 150, -1), btc("2026-07-20", "EWY", 150, "2026-08-21", -40, 2)];
    const res = [result("EWY", 150, "2026-08-21", "2026-07-20", -40, 2, "OVER_CLOSE",
      { outstandingBeforeMin: 1, outstandingBeforeMax: 1, matchedMin: 1, matchedMax: 1, residualMin: 0, residualMax: 0, excessUnmatched: 1 })];
    const c = closesOf(rows, res);
    expect(c[0].whatHappened).toContain("over-close");
    expect(c[0].confidence).toBe("partial");
    expect(c[0].conditionalLabel).toContain("excess 1");
    expect(c[0].capitalAmount).toBeNull(); // no exact-matched encumbrance under over-close
  });

  it("UNRESOLVED result → association unresolved, no encumbrance claim; executed debit still shown", () => {
    const rows = [btc("2026-07-20", "EWY", 150, "2026-08-21", -40, 1)];
    const res = [result("EWY", 150, "2026-08-21", "2026-07-20", -40, 1, "UNRESOLVED",
      { outstandingBeforeMin: 0, outstandingBeforeMax: 0, matchedMin: 0, matchedMax: 0 })];
    const c = closesOf(rows, res);
    expect(c[0].whatHappened).toContain("association unresolved");
    expect(c[0].confidence).toBe("unresolved");
    expect(c[0].productionAmount).toBeCloseTo(-40, 2); // cash still known
    expect(c[0].capitalAmount).toBeNull();
    expect(c[0].linkDate).toBeNull();
  });

  it("UNRESOLVED with an outstanding RANGE surfaces the range in the annotation", () => {
    const rows = [sto("2026-07-03", "EWY", 150, "2026-08-21", 300, -2), btc("2026-07-20", "EWY", 150, "2026-08-21", -40, 1)];
    const res = [result("EWY", 150, "2026-08-21", "2026-07-20", -40, 1, "UNRESOLVED",
      { outstandingBeforeMin: 0, outstandingBeforeMax: 2, matchedMin: 0, matchedMax: 1 })];
    const c = closesOf(rows, res);
    expect(c[0].confidence).toBe("unresolved");
    expect(c[0].conditionalLabel).toContain("0..2"); // range preserved, surfaced
  });

  it("no authoritative result at all → association unresolved (backend did not establish it)", () => {
    const rows = [sto("2026-07-05", "EWY", 150, "2026-08-21", 150), btc("2026-07-20", "EWY", 150, "2026-08-21", -40, 1)];
    const c = closesOf(rows, []); // no results supplied
    expect(c.length).toBe(1);
    expect(c[0].whatHappened).toContain("association unresolved");
    expect(c[0].confidence).toBe("unresolved");
  });

  it("DIVERGENCE GUARD: activity looks 'complete' but backend says UNRESOLVED → renders UNRESOLVED", () => {
    // A naive local resolver would call this STO1→BTC1 complete. The frontend must NOT: it renders
    // the backend's UNRESOLVED verdict, proving it does not recompute association.
    const rows = [sto("2026-07-05", "EWY", 150, "2026-08-21", 150), btc("2026-07-20", "EWY", 150, "2026-08-21", -40, 1)];
    const res = [result("EWY", 150, "2026-08-21", "2026-07-20", -40, 1, "UNRESOLVED",
      { outstandingBeforeMin: 0, outstandingBeforeMax: 1 })];
    const c = closesOf(rows, res);
    expect(c[0].whatHappened).toContain("association unresolved");
    expect(c[0].confidence).toBe("unresolved");
    expect(c[0].capitalAmount).toBeNull(); // must NOT claim encumbrance the backend didn't establish
  });

  it("missing cash: executed debit unavailable is shown; result UNRESOLVED", () => {
    const rows = [sto("2026-07-05", "EWY", 150, "2026-08-21", 150), btc("2026-07-20", "EWY", 150, "2026-08-21", null, 1)];
    const res = [result("EWY", 150, "2026-08-21", "2026-07-20", null, 1, "UNRESOLVED")];
    const c = closesOf(rows, res);
    expect(c[0].productionAmount).toBeNull();
    expect(c[0].confidence).toBe("unresolved");
  });

  it("two closes on different dates remain TWO dated chapters, each rendering its own result", () => {
    const rows = [
      sto("2026-07-01", "EWY", 150, "2026-08-21", 300, -2),
      btc("2026-07-10", "EWY", 150, "2026-08-21", -40, 1),
      btc("2026-07-16", "EWY", 150, "2026-08-21", -30, 1),
    ];
    const res = [
      result("EWY", 150, "2026-08-21", "2026-07-10", -40, 1, "DETERMINISTIC_PARTIAL",
        { outstandingBeforeMin: 2, outstandingBeforeMax: 2, matchedMin: 1, matchedMax: 1, residualMin: 1, residualMax: 1 }),
      result("EWY", 150, "2026-08-21", "2026-07-16", -30, 1, "DETERMINISTIC_COMPLETE",
        { outstandingBeforeMin: 1, outstandingBeforeMax: 1, matchedMin: 1, matchedMax: 1, residualMin: 0, residualMax: 0 }),
    ];
    const c = closesOf(rows, res);
    expect(c.length).toBe(2);
    expect(c.map(x => x.date).sort()).toEqual(["2026-07-10", "2026-07-16"]);
  });

  it("cross-month: each close lands in its own month, rendering that month's result", () => {
    const rows = [
      sto("2026-07-01", "EWY", 150, "2026-09-18", 300, -2),
      btc("2026-07-20", "EWY", 150, "2026-09-18", -40, 1),
      btc("2026-08-20", "EWY", 150, "2026-09-18", -30, 1),
    ];
    const res = [
      result("EWY", 150, "2026-09-18", "2026-07-20", -40, 1, "DETERMINISTIC_PARTIAL",
        { outstandingBeforeMin: 2, outstandingBeforeMax: 2, matchedMin: 1, matchedMax: 1, residualMin: 1, residualMax: 1 }),
      result("EWY", 150, "2026-09-18", "2026-08-20", -30, 1, "DETERMINISTIC_COMPLETE",
        { outstandingBeforeMin: 1, outstandingBeforeMax: 1, matchedMin: 1, matchedMax: 1, residualMin: 0, residualMax: 0 }),
    ];
    const july = closesOf(rows, res, "2026-07");
    const august = closesOf(rows, res, "2026-08");
    expect(july.length).toBe(1);
    expect(july[0].date).toBe("2026-07-20");
    expect(august.length).toBe(1);
    expect(august[0].date).toBe("2026-08-20");
  });

  it("FALSIFIER (Codex REJECT): unmatched BTC quantity 3 / −$40 keeps its OBSERVED quantity and cash, unresolved, no capital deployment", () => {
    // Unmatched BTC: a buy-to-close with NO recognized opening (no STO) → skeleton episode with
    // recognized-opening contracts=0. The close chapter's quantity MUST come from the OBSERVED
    // close row (3), not the episode's opening quantity (0). Regression: prior code rendered
    // contracts=0, erasing the known BTC quantity when association was unresolved.
    const rows = [btc("2026-07-20", "EWY", 150, "2026-08-21", -40, 3)];
    const c = closesOf(rows, []); // no authoritative result → association unresolved
    expect(c.length).toBe(1);
    // Known BTC quantity remains VISIBLE (the defect: this was 0).
    expect(c[0].contracts).toBe(3);
    // Known BTC cash remains VISIBLE.
    expect(c[0].productionAmount).toBeCloseTo(-40, 2);
    expect(c[0].productionLabel).toContain("closing debit");
    // Still an option close, association explicitly unresolved — no fabricated certainty.
    expect(c[0].whatHappened).toContain("association unresolved");
    expect(c[0].confidence).toBe("unresolved");
    // No capital-deployment / encumbrance treatment for an unresolved close.
    expect(c[0].capitalAmount).toBeNull();
    expect(c[0].linkDate).toBeNull();
    // No current-state retirement claim.
    expect(c[0].whatHappened).not.toContain("obligation retired");
  });

  it("matched DBO preserved: observed quantity 1 still renders as 1 (no regression from the quantity-source fix)", () => {
    // The confirmed matched DBO specimen: STO 1 → BTC 1, DETERMINISTIC_COMPLETE. The quantity-source
    // fix (observed close quantity) must leave this unchanged: contracts=1 either way.
    const rows = [sto("2026-07-05", "DBO", 21, "2026-09-18", 44.34, -1), btc("2026-07-20", "DBO", 21, "2026-09-18", -5.01, 1)];
    const res = [result("DBO", 21, "2026-09-18", "2026-07-20", -5.01, 1, "DETERMINISTIC_COMPLETE",
      { outstandingBeforeMin: 1, outstandingBeforeMax: 1, matchedMin: 1, matchedMax: 1, residualMin: 0, residualMax: 0 })];
    const c = closesOf(rows, res);
    expect(c.length).toBe(1);
    expect(c[0].contracts).toBe(1);
    expect(c[0].whatHappened).toBe("Closed · obligation retired");
    expect(c[0].confidence).toBe("deterministic");
    expect(c[0].productionAmount).toBeCloseTo(-5.01, 2);
  });

  it("NEGATIVE SPECIMEN (BUG-021 record): STO 2 → BTC quantity UNAVAILABLE / −$40 keeps cash visible, quantity UNKNOWN, opening qty NOT substituted", () => {
    // Durable BUG-021 negative specimen: an opening of quantity 2, then a buy-to-close whose
    // executed quantity is unavailable. The close is a real option cash event (−$40 stays visible),
    // but its executed quantity is UNKNOWN and must remain unknown. The episode's opening quantity
    // (2) must NEVER be substituted/presented as the observed closing quantity.
    const rows = [
      sto("2026-07-05", "EWY", 150, "2026-08-21", 300, -2),
      btc("2026-07-20", "EWY", 150, "2026-08-21", -40, null), // quantity unavailable
    ];
    // Backend cannot deterministically associate a quantity-unknown close → UNRESOLVED.
    const res = [result("EWY", 150, "2026-08-21", "2026-07-20", -40, null, "UNRESOLVED",
      { outstandingBeforeMin: 2, outstandingBeforeMax: 2, matchedMin: 0, matchedMax: 0 })];
    const c = closesOf(rows, res);
    expect(c.length).toBe(1);
    // Cash remains visible.
    expect(c[0].productionAmount).toBeCloseTo(-40, 2);
    expect(c[0].productionLabel).toContain("closing debit");
    // Executed quantity is UNKNOWN — and specifically NOT the opening quantity 2.
    expect(c[0].contracts).not.toBe(2);
    expect(c[0].contracts).toBeNull();
    // Option close, association explicitly unresolved; no capital deployment; no false certainty.
    expect(c[0].whatHappened).toContain("association unresolved");
    expect(c[0].confidence).toBe("unresolved");
    expect(c[0].capitalAmount).toBeNull();
    expect(c[0].whatHappened).not.toContain("obligation retired");
  });

  it("negative control: an ordinary asset purchase is not a close chapter", () => {
    const rows: ActivityRow[] = [{
      date: "2026-07-15", eventType: "shares_bought_direct", action: "YOU BOUGHT SPYI (Cash)",
      symbol: "SPYI", description: "", quantity: 74, price: 53.46, commission: null, fees: null,
      amount: -3955.67, cashBalance: null, settlementDate: null, option: null, rawRow: [],
    }];
    const c = closesOf(rows, []);
    expect(c.length).toBe(0);
  });
});

/**
 * BUG-021 — validated-invariant falsifiers (second authorized attempt, 2026-09-17).
 *
 * Invariant: Product must not assert an opening-event relationship, allocation, or provenance that
 * Production's authoritative association contract (OptionCloseResult) does not establish. The
 * backend result carries close ECONOMICS for the contract SERIES (executed debit, observed/null
 * quantity, outstanding-before / matched / residual / excess ranges, status) but NEVER a singular
 * opening row/date/fill-allocation. A close chapter therefore asserts NO singular opening
 * relationship: linkDate is null, linkDirection is null, and the opening STO is not a constituent.
 * Established close economics remain fully visible regardless.
 *
 * These falsify the exact Codex REJECT defect and its stronger order-independence generalization.
 */
describe("BUG-021 validated invariant: a close asserts no unsupported singular opening (falsifiers A/B/E)", () => {
  // Helper: all chapters (not just closes) so we can inspect the close's link + constituents.
  function allChapters(rows: ActivityRow[], results: OptionCloseResult[], month = "2026-07") {
    return deriveEpisodeChapters({
      activityRows: rows, snapshot: null, assessedTransactions: null,
      dispositionResults: null, optionCloseResults: results, targetMonth: month,
    });
  }
  const isClose = (c: { whatHappened: string }) =>
    c.whatHappened.startsWith("Closed") || c.whatHappened.startsWith("Partially closed");

  it("A — FUTURE OPENING never asserted: Jul10 BTC, Jul20 STO → close links to no opening date, no Jul20 constituent", () => {
    // Same OCC contract. A BTC on Jul 10 with a later STO on Jul 20. A future opening can never be
    // the opening associated with an earlier close. The backend adjudicates the close deterministically
    // for the series; Product must NOT stamp the (encounter-order) opening date onto the close.
    const rows = [
      btc("2026-07-10", "EWY", 150, "2026-08-21", -40, 2),
      sto("2026-07-20", "EWY", 150, "2026-08-21", 300, -2),
    ];
    const res = [result("EWY", 150, "2026-08-21", "2026-07-10", -40, 2, "DETERMINISTIC_COMPLETE",
      { outstandingBeforeMin: 2, outstandingBeforeMax: 2, matchedMin: 2, matchedMax: 2, residualMin: 0, residualMax: 0 })];
    const ch = allChapters(rows, res);
    const close = ch.find(isClose)!;
    expect(close).toBeDefined();
    // The close asserts NO singular opening relationship (the defect: linkDate=2026-07-20).
    expect(close.linkDate).toBeNull();
    expect(close.linkDirection).toBeNull();
    // The future (Jul 20) STO is NOT listed as a constituent of the close (the defect: it was).
    const closeConstituentDates = close.constituentEvents.map(e => e.date);
    expect(closeConstituentDates).not.toContain("2026-07-20");
    expect(closeConstituentDates).toEqual(["2026-07-10"]); // only the close row itself
    // Established close economics remain visible.
    expect(close.productionAmount).toBeCloseTo(-40, 2);
    expect(close.contracts).toBe(2);
    expect(close.whatHappened).not.toContain("2026-07-20");
  });

  it("B — ORDER INDEPENDENCE: Jul3 STO1 / Jul7 STO2 / Jul10 BTC3 renders IDENTICALLY under reversed STO input order", () => {
    // The stronger Codex falsifier. Both STO fills precede the close, so a "before the close" filter
    // is insufficient — the defect was that Product converted STO encounter order into a singular
    // opening identity the backend never established. Reversing the two STO rows leaves the
    // authoritative backend result unchanged, so the rendered close must be byte-identical.
    const resB = [result("EWY", 150, "2026-08-21", "2026-07-10", -40, 3, "DETERMINISTIC_COMPLETE",
      { outstandingBeforeMin: 3, outstandingBeforeMax: 3, matchedMin: 3, matchedMax: 3, residualMin: 0, residualMax: 0 })];

    const forward = [
      sto("2026-07-03", "EWY", 150, "2026-08-21", 150, -1),
      sto("2026-07-07", "EWY", 150, "2026-08-21", 300, -2),
      btc("2026-07-10", "EWY", 150, "2026-08-21", -40, 3),
    ];
    const reversed = [
      sto("2026-07-07", "EWY", 150, "2026-08-21", 300, -2),
      sto("2026-07-03", "EWY", 150, "2026-08-21", 150, -1),
      btc("2026-07-10", "EWY", 150, "2026-08-21", -40, 3),
    ];

    const closeFwd = allChapters(forward, resB).find(isClose)!;
    const closeRev = allChapters(reversed, resB).find(isClose)!;

    // The close asserts no singular opening in EITHER ordering.
    expect(closeFwd.linkDate).toBeNull();
    expect(closeRev.linkDate).toBeNull();
    expect(closeFwd.linkDirection).toBeNull();
    expect(closeRev.linkDirection).toBeNull();
    // Neither ordering leaks an opening date into the close's constituents (only the close row).
    expect(closeFwd.constituentEvents.map(e => e.date)).toEqual(["2026-07-10"]);
    expect(closeRev.constituentEvents.map(e => e.date)).toEqual(["2026-07-10"]);
    // The rendered close is identical across input orderings (no order-dependent opening identity).
    expect(closeRev).toEqual(closeFwd);
    // Established close economics preserved.
    expect(closeFwd.productionAmount).toBeCloseTo(-40, 2);
    expect(closeFwd.contracts).toBe(3);
    expect(closeFwd.whatHappened).toBe("Closed · obligation retired");
  });

  it("E — PARTIAL close: deterministic matched/residual is rendered WITHOUT allocating the close to a particular opening fill", () => {
    // Two prior STO fills, a partial close. The backend establishes matched=1, residual=1 for the
    // series; it does NOT establish which fill the matched contract came from. Product renders the
    // matched/residual economics but asserts no singular opening date/fill allocation.
    const rows = [
      sto("2026-07-03", "EWY", 150, "2026-08-21", 150, -1),
      sto("2026-07-07", "EWY", 150, "2026-08-21", 150, -1),
      btc("2026-07-10", "EWY", 150, "2026-08-21", -40, 1),
    ];
    const res = [result("EWY", 150, "2026-08-21", "2026-07-10", -40, 1, "DETERMINISTIC_PARTIAL",
      { outstandingBeforeMin: 2, outstandingBeforeMax: 2, matchedMin: 1, matchedMax: 1, residualMin: 1, residualMax: 1 })];
    const close = allChapters(rows, res).find(isClose)!;
    expect(close.whatHappened).toBe("Partially closed");
    expect(close.confidence).toBe("deterministic");
    expect(close.conditionalLabel).toContain("1 still open"); // residual from the backend result
    // No singular opening allocation asserted.
    expect(close.linkDate).toBeNull();
    expect(close.linkDirection).toBeNull();
    expect(close.constituentEvents.map(e => e.date)).toEqual(["2026-07-10"]);
    // Established close economics preserved.
    expect(close.productionAmount).toBeCloseTo(-40, 2);
    expect(close.contracts).toBe(1);
  });
});

/**
 * BUG-021 — end-to-end path falsifier through the Production Evidence CSV export.
 *
 * The Codex REJECT observed the defect in the exported CSV (`link_date=2026-07-20` and the July-20
 * STO listed as a close constituent). This drives the ACTUAL path — activity rows →
 * deriveEpisodeChapters → buildProductionCsv — and asserts the exported close row asserts NO
 * singular opening: the `link_date` and `link_relationship` claims are the explicit NULL token, and
 * the future STO date never appears in the close's presentation group.
 */
describe("BUG-021 validated invariant through the CSV export path (falsifier A, end-to-end)", () => {
  // Minimal RFC-4180-ish parser (mirrors the CSV export test harness).
  function parseRows(text: string): Record<string, string>[] {
    const out: string[][] = [];
    let field = "", row: string[] = [], inQ = false, i = 0;
    while (i < text.length) {
      const ch = text[i];
      if (inQ) {
        if (ch === '"') { if (text[i + 1] === '"') { field += '"'; i += 2; continue; } inQ = false; i++; continue; }
        field += ch; i++; continue;
      }
      if (ch === '"') { inQ = true; i++; continue; }
      if (ch === ",") { row.push(field); field = ""; i++; continue; }
      if (ch === "\r" && text[i + 1] === "\n") { row.push(field); out.push(row); row = []; field = ""; i += 2; continue; }
      if (ch === "\n") { row.push(field); out.push(row); row = []; field = ""; i++; continue; }
      field += ch; i++;
    }
    if (field.length > 0 || row.length > 0) { row.push(field); out.push(row); }
    const raw = out.filter(r => r.length > 1 || (r.length === 1 && r[0] !== ""));
    const header = raw[0];
    return raw.slice(1).map(cells => { const o: Record<string, string> = {}; header.forEach((h, idx) => { o[h] = cells[idx] ?? ""; }); return o; });
  }

  it("A (CSV) — future-opening close exports NULL link_date / link_relationship and never the Jul-20 STO date", () => {
    const rows = [
      btc("2026-07-10", "EWY", 150, "2026-08-21", -40, 2),
      sto("2026-07-20", "EWY", 150, "2026-08-21", 300, -2),
    ];
    const res = [result("EWY", 150, "2026-08-21", "2026-07-10", -40, 2, "DETERMINISTIC_COMPLETE",
      { outstandingBeforeMin: 2, outstandingBeforeMax: 2, matchedMin: 2, matchedMax: 2, residualMin: 0, residualMax: 0 })];

    const chapters = deriveEpisodeChapters({
      activityRows: rows, snapshot: null, assessedTransactions: null,
      dispositionResults: null, optionCloseResults: res, targetMonth: "2026-07",
    });
    // presented_claim rows are emitted alongside a (non-null) backend assessment; supply a minimal
    // authoritative response so the export produces the presentation layer we are falsifying.
    const assessment: ProductionAssessmentResponse = {
      period: "2026-07", periodDescription: "July 2026", reconciliationStatus: "PRODUCTION_UNCERTAIN",
      reconciliationIssues: [], knownCashProduction: 0, unresolvedPotentialProduction: 0,
      realizedCapitalErosion: 0, netStrategyResult: 0, productionBreakdown: {}, erosionEvents: [],
      transactionSummary: { included: 0, excluded: 0, uncertain: 0, notApplicable: 0 },
      transactions: [], dispositionResults: [],
    };
    const csv = buildProductionCsv(assessment, chapters, { exportGeneratedAt: "2026-09-17T00:00:00Z", targetMonth: "2026-07" });
    const parsed = parseRows(csv);

    // Identify the presentation group for the CLOSE chapter (broker_run_date = the close date).
    const closeWhatHappened = parsed.find(r =>
      r.record_type === "presented_claim" && r.claim_name === "what_happened" &&
      r.broker_run_date === "2026-07-10" && r.value_text.startsWith("Closed"));
    expect(closeWhatHappened).toBeDefined();
    const groupKey = closeWhatHappened!.presentation_group_key;
    const inGroup = (claim: string) => parsed.find(r =>
      r.record_type === "presented_claim" && r.presentation_group_key === groupKey && r.claim_name === claim);

    // The exported close asserts NO singular opening (the defect: link_date=2026-07-20).
    expect(inGroup("link_date")!.value_text).toBe(NULL_TOKEN);
    expect(inGroup("link_relationship")!.value_text).toBe(NULL_TOKEN);

    // The future opening date never appears anywhere in the close's presentation group.
    const groupCells = parsed
      .filter(r => r.presentation_group_key === groupKey)
      .flatMap(r => Object.values(r));
    expect(groupCells.some(v => v.includes("2026-07-20"))).toBe(false);

    // Established close economics survive in the export.
    expect(inGroup("production_amount")!.value_numeric).toBe("-40");
    expect(inGroup("contracts")!.value_numeric).toBe("2");
    expect(inGroup("what_happened")!.value_text).toBe("Closed · obligation retired");
  });
});
