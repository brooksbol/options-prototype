/**
 * Episode Derivation — Called-Away Disposition Truth (Issues #11 / #3 / #12)
 *
 * Source-of-truth model under test:
 *   - Fidelity evidence  = raw facts
 *   - backend Production = interpreted economic truth (DispositionResult)
 *   - frontend           = presentation only
 *
 * The frontend RENDERS the backend-authoritative per-disposition result. It must not
 * reconstruct realized economics, correlate raw events with economic components, or infer
 * basis resolution. These tests therefore supply backend DispositionResult objects and assert
 * that the chapter renders them faithfully — never a strike notional as realized cash, and
 * never economics bleeding across same-day episodes.
 */

import { describe, it, expect } from "vitest";
import { deriveEpisodeChapters } from "../../src/production/episode-derivation";
import type { ActivityRow } from "../../src/csv/fidelity/activityParser";
import type { ParsedOptionContract } from "../../src/csv/fidelity/parseOptionContract";
import type { DispositionResult } from "../../src/production/production-types";

// --- Activity row builders (raw Fidelity facts) ---

function callOption(underlying: string, strike: number, expiration: string): ParsedOptionContract {
  return { underlying, expiration, strike, type: "CALL" };
}

function stoCall(date: string, underlying: string, strike: number, expiration: string, premium: number): ActivityRow {
  return {
    date, eventType: "sell_to_open",
    action: `YOU SOLD OPENING TRANSACTION CALL (${underlying}) ... ${strike}`,
    symbol: ` -${underlying}${expiration.replace(/-/g, "").slice(2)}C${strike}`,
    description: "", quantity: -1, price: premium / 100, commission: 0.65, fees: 0.01,
    amount: premium, cashBalance: null, settlementDate: null,
    option: callOption(underlying, strike, expiration), rawRow: [],
  };
}

function directBuy(date: string, underlying: string, shares: number, pricePerShare: number): ActivityRow {
  return {
    date, eventType: "shares_bought_direct",
    action: `YOU BOUGHT ${underlying}`,
    symbol: underlying, description: "", quantity: shares, price: pricePerShare,
    commission: null, fees: null, amount: -(shares * pricePerShare),
    cashBalance: null, settlementDate: null, option: null, rawRow: [],
  };
}

function assignedNotification(date: string, underlying: string, strike: number, expiration: string, contracts: number): ActivityRow {
  return {
    date, eventType: "assigned",
    action: `ASSIGNED as of ${date} CALL (${underlying}) ... ${strike}`,
    symbol: ` -${underlying}${expiration.replace(/-/g, "").slice(2)}C${strike}`,
    description: "", quantity: contracts, price: null, commission: null, fees: null,
    amount: 0, cashBalance: null, settlementDate: null,
    option: callOption(underlying, strike, expiration), rawRow: [],
  };
}

function calledAwaySale(date: string, underlying: string, shares: number, salePrice: number, netProceeds: number): ActivityRow {
  return {
    date, eventType: "shares_sold_assignment",
    action: `YOU SOLD ASSIGNED CALLS AS OF ${date} ${underlying}`,
    symbol: underlying, description: "", quantity: -shares, price: salePrice,
    commission: null, fees: 0.23, amount: netProceeds,
    cashBalance: null, settlementDate: null, option: null, rawRow: [],
  };
}

// --- Backend-authoritative disposition result builders (interpreted economic truth) ---

// contractActivityKey = the OCC contract/activity grouping key of the assigned call (backend-established association).
function occKey(underlying: string, strike: number, occExp: string): string {
  return `-${underlying}${occExp}C${strike}`;
}

function resolvedDisposition(
  contractActivityKey: string, date: string, symbol: string, qty: number, salePrice: number,
  netProceeds: number, appreciation: number | null, erosion: number | null,
): DispositionResult {
  const attributable = appreciation != null ? netProceeds - appreciation
    : erosion != null ? netProceeds + erosion
    : netProceeds;
  return {
    dispositionFingerprint: `${symbol}-${date}-${qty}-${salePrice}`, contractActivityKey,
    symbol, date, dispositionAction: `YOU SOLD ASSIGNED CALLS AS OF ${date} ${symbol}`,
    kind: "ASSIGNED_CALL_STOCK_SALE",
    quantity: qty, salePricePerShare: salePrice, netSaleProceeds: netProceeds,
    attributableAcquisitionCash: attributable,
    realizedAppreciation: appreciation, realizedErosion: erosion,
    state: "RESOLVED", provenance: "test",
  };
}

function partialDisposition(
  contractActivityKey: string, date: string, symbol: string, qty: number, salePrice: number, netProceeds: number,
): DispositionResult {
  return {
    dispositionFingerprint: `${symbol}-${date}-${qty}-${salePrice}`, contractActivityKey,
    symbol, date, dispositionAction: `YOU SOLD ASSIGNED CALLS AS OF ${date} ${symbol}`,
    kind: "ASSIGNED_CALL_STOCK_SALE",
    quantity: qty, salePricePerShare: salePrice, netSaleProceeds: netProceeds,
    attributableAcquisitionCash: null, realizedAppreciation: null, realizedErosion: null,
    state: "PARTIAL", provenance: "test — proceeds known, acquisition economics unresolved",
  };
}

describe("episode-derivation renders backend-authoritative disposition results", () => {
  it("renders net sale proceeds from the backend result, never a strike notional; each episode gets its own", () => {
    // BNO-shaped: 100@$51 (1 ct) and 200@$54 (2 ct) called away the same day.
    const rows: ActivityRow[] = [
      stoCall("2026-09-01", "BNO", 51, "2026-09-04", 284.34),
      stoCall("2026-09-01", "BNO", 54, "2026-09-04", 144.34),
      stoCall("2026-09-01", "BNO", 54, "2026-09-04", 149.34), // → $54 episode has 2 contracts
      directBuy("2026-09-01", "BNO", 300, 52.5),
      assignedNotification("2026-09-08", "BNO", 51, "2026-09-04", 1),
      assignedNotification("2026-09-08", "BNO", 54, "2026-09-04", 2),
      calledAwaySale("2026-09-08", "BNO", 100, 51, 5099.89),
      calledAwaySale("2026-09-08", "BNO", 200, 54, 10799.77),
    ];
    // Backend resolved the $54 leg (appreciation) but left the $51 leg unresolved (partial).
    // Association is by contractActivityKey (OCC grouping key) — the backend's decision, not FE heuristics.
    const dispositionResults: DispositionResult[] = [
      partialDisposition(occKey("BNO", 51, "260904"), "2026-09-08", "BNO", 100, 51, 5099.89),
      resolvedDisposition(occKey("BNO", 54, "260904"), "2026-09-08", "BNO", 200, 54, 10799.77, 799.77, null),
    ];

    const chapters = deriveEpisodeChapters({
      activityRows: rows, snapshot: null, assessedTransactions: null,
      dispositionResults, targetMonth: "2026-09",
    });

    const calledAway = chapters.filter(c => c.whatHappened.includes("Called away"));
    expect(calledAway.length).toBe(2);
    const c51 = calledAway.find(c => c.strike === 51)!;
    const c54 = calledAway.find(c => c.strike === 54)!;

    // Net sale proceeds from the backend result — never strike notional.
    expect(c51.capitalAmount).toBeCloseTo(5099.89, 2);
    expect(c51.capitalLabel).toContain("net sale proceeds");
    expect(c51.capitalLabel).not.toContain("5,100"); // 51*100*1
    expect(c51.capitalLabel).not.toContain("returned");

    expect(c54.capitalAmount).toBeCloseTo(10799.77, 2);
    expect(c54.capitalLabel).not.toContain("10,800"); // 54*100*2

    // Each episode renders ITS OWN backend state — no bleed.
    // $54 resolved → deterministic; $51 partial → not deterministic.
    expect(c54.confidence).toBe("deterministic");
    expect(c51.confidence).toBe("partial");
  });

  it("renders 'partial' when the backend reports known proceeds but unresolved acquisition economics", () => {
    const rows: ActivityRow[] = [
      stoCall("2026-09-01", "BNO", 54, "2026-09-04", 144.34),
      stoCall("2026-09-01", "BNO", 54, "2026-09-04", 149.34),
      directBuy("2026-09-01", "BNO", 200, 52.5),
      assignedNotification("2026-09-08", "BNO", 54, "2026-09-04", 2),
      calledAwaySale("2026-09-08", "BNO", 200, 54, 10799.77),
    ];
    const dispositionResults = [partialDisposition(occKey("BNO", 54, "260904"), "2026-09-08", "BNO", 200, 54, 10799.77)];

    const chapters = deriveEpisodeChapters({
      activityRows: rows, snapshot: null, assessedTransactions: null,
      dispositionResults, targetMonth: "2026-09",
    });

    const c54 = chapters.filter(c => c.whatHappened.includes("Called away")).find(c => c.strike === 54)!;
    // Proceeds known precisely...
    expect(c54.capitalAmount).toBeCloseTo(10799.77, 2);
    expect(c54.capitalLabel).toContain("net sale proceeds");
    // ...but backend did not resolve the acquisition economics → not deterministic; no fabricated result.
    expect(c54.confidence).toBe("partial");
    expect(c54.productionLabel).not.toContain("appreciation");
    expect(c54.productionLabel).not.toContain("erosion");
  });

  it("renders resolved appreciation from the backend result (deterministic)", () => {
    const rows: ActivityRow[] = [
      stoCall("2026-09-01", "ABC", 55, "2026-09-04", 100),
      directBuy("2026-09-01", "ABC", 100, 50),
      assignedNotification("2026-09-08", "ABC", 55, "2026-09-04", 1),
      calledAwaySale("2026-09-08", "ABC", 100, 55, 5499.87),
    ];
    const dispositionResults = [
      resolvedDisposition(occKey("ABC", 55, "260904"), "2026-09-08", "ABC", 100, 55, 5499.87, 499.87, null),
    ];

    const chapters = deriveEpisodeChapters({
      activityRows: rows, snapshot: null, assessedTransactions: null,
      dispositionResults, targetMonth: "2026-09",
    });

    const c = chapters.filter(x => x.whatHappened.includes("Called away")).find(x => x.strike === 55)!;
    expect(c.capitalAmount).toBeCloseTo(5499.87, 2);
    expect(c.confidence).toBe("deterministic");
    expect(c.productionAmount).toBeCloseTo(100 + 499.87, 2); // premium + appreciation
  });

  it("renders a zero-gain/zero-loss RESOLVED disposition as deterministic", () => {
    const rows: ActivityRow[] = [
      stoCall("2026-09-01", "ZER", 55, "2026-09-04", 100),
      directBuy("2026-09-01", "ZER", 100, 55),
      assignedNotification("2026-09-08", "ZER", 55, "2026-09-04", 1),
      calledAwaySale("2026-09-08", "ZER", 100, 55, 5500),
    ];
    // Backend: association resolved, acquisition economics known, exactly zero gain/loss.
    const dispositionResults: DispositionResult[] = [{
      dispositionFingerprint: "ZER-1", contractActivityKey: occKey("ZER", 55, "260904"),
      symbol: "ZER", date: "2026-09-08", dispositionAction: "YOU SOLD ASSIGNED CALLS AS OF 2026-09-08 ZER",
      kind: "ASSIGNED_CALL_STOCK_SALE",
      quantity: 100, salePricePerShare: 55, netSaleProceeds: 5500,
      attributableAcquisitionCash: 5500, realizedAppreciation: null, realizedErosion: null,
      state: "RESOLVED", provenance: "test zero",
    }];

    const chapters = deriveEpisodeChapters({
      activityRows: rows, snapshot: null, assessedTransactions: null,
      dispositionResults, targetMonth: "2026-09",
    });
    const c = chapters.filter(x => x.whatHappened.includes("Called away")).find(x => x.strike === 55)!;
    // Knowledge-based, not sign-based: RESOLVED with null appreciation/erosion → deterministic.
    expect(c.confidence).toBe("deterministic");
    expect(c.capitalAmount).toBeCloseTo(5500, 2);
  });

  it("does not let a resolved disposition's economics leak to an unresolved sibling", () => {
    // Two same-day $54/2ct and $51/1ct. Only the $54 leg is resolved in the backend result.
    const rows: ActivityRow[] = [
      stoCall("2026-09-01", "BNO", 51, "2026-09-04", 284.34),
      stoCall("2026-09-01", "BNO", 54, "2026-09-04", 144.34),
      stoCall("2026-09-01", "BNO", 54, "2026-09-04", 149.34),
      directBuy("2026-09-01", "BNO", 300, 52.5),
      assignedNotification("2026-09-08", "BNO", 51, "2026-09-04", 1),
      assignedNotification("2026-09-08", "BNO", 54, "2026-09-04", 2),
      calledAwaySale("2026-09-08", "BNO", 100, 51, 5099.89),
      calledAwaySale("2026-09-08", "BNO", 200, 54, 10799.77),
    ];
    const dispositionResults: DispositionResult[] = [
      resolvedDisposition(occKey("BNO", 54, "260904"), "2026-09-08", "BNO", 200, 54, 10799.77, 799.77, null),
      // No result for the $51 disposition at all.
    ];

    const chapters = deriveEpisodeChapters({
      activityRows: rows, snapshot: null, assessedTransactions: null,
      dispositionResults, targetMonth: "2026-09",
    });

    const calledAway = chapters.filter(c => c.whatHappened.includes("Called away"));
    const c51 = calledAway.find(c => c.strike === 51)!;
    const c54 = calledAway.find(c => c.strike === 54)!;

    // $54 renders its resolved economics.
    expect(c54.confidence).toBe("deterministic");
    expect(c54.capitalAmount).toBeCloseTo(10799.77, 2);

    // $51 has NO backend result → unresolved; must NOT inherit $54's economics.
    expect(c51.confidence).toBe("partial");
    expect(c51.capitalLabel).toBe("Net sale proceeds unavailable");
    expect(c51.capitalAmount).toBeNull();
    expect(c51.productionAmount).not.toBe(c54.productionAmount);
  });

  // --- ADR-016: the frontend must not independently establish the called-away association ---

  it("does NOT independently associate a called-away sale to a CALL episode when the backend supplies no association", () => {
    // A perfectly 'inferrable' called-away sale (matching underlying/date/qty/strike) is present in
    // the raw activity, but the backend provides NO disposition result for it. Under ADR-016 the
    // frontend must NOT reconstruct the sale→episode relationship from those attributes: the
    // resolution must render unresolved, and the sale must NOT appear as a constituent event via
    // independent inference.
    const rows: ActivityRow[] = [
      stoCall("2026-09-01", "IND", 55, "2026-09-04", 120),
      directBuy("2026-09-01", "IND", 100, 50),
      assignedNotification("2026-09-08", "IND", 55, "2026-09-04", 1),
      calledAwaySale("2026-09-08", "IND", 100, 55, 5499.87), // would trivially "match" by qty+strike
    ];
    // Backend established NO association (e.g. ambiguous or key-not-unique across the assessment).
    const dispositionResults: DispositionResult[] = [];

    const chapters = deriveEpisodeChapters({
      activityRows: rows, snapshot: null, assessedTransactions: null,
      dispositionResults, targetMonth: "2026-09",
    });

    const c = chapters.filter(x => x.whatHappened.includes("Called away")).find(x => x.strike === 55)!;
    // No authoritative association → unresolved economics, no fabricated proceeds.
    expect(c.confidence).toBe("partial");
    expect(c.capitalLabel).toBe("Net sale proceeds unavailable");
    expect(c.capitalAmount).toBeNull();
    // And the called-away sale must NOT have been independently attached as a constituent event.
    const saleEvents = c.constituentEvents.filter(e => e.action.includes("ASSIGNED CALLS"));
    expect(saleEvents.length).toBe(0);
  });

  it("renders the disposition constituent event FROM the authoritative backend result (not independent inference)", () => {
    const rows: ActivityRow[] = [
      stoCall("2026-09-01", "ABC", 55, "2026-09-04", 100),
      directBuy("2026-09-01", "ABC", 100, 50),
      assignedNotification("2026-09-08", "ABC", 55, "2026-09-04", 1),
      calledAwaySale("2026-09-08", "ABC", 100, 55, 5499.87),
    ];
    const dispositionResults = [
      resolvedDisposition(occKey("ABC", 55, "260904"), "2026-09-08", "ABC", 100, 55, 5499.87, 499.87, null),
    ];

    const chapters = deriveEpisodeChapters({
      activityRows: rows, snapshot: null, assessedTransactions: null,
      dispositionResults, targetMonth: "2026-09",
    });

    const c = chapters.filter(x => x.whatHappened.includes("Called away")).find(x => x.strike === 55)!;
    // The disposition appears as a constituent event, sourced from the backend result's provenance
    // fields (dispositionAction/date/symbol/netSaleProceeds) — one, and exactly one.
    const saleEvents = c.constituentEvents.filter(e => e.action.includes("ASSIGNED CALLS"));
    expect(saleEvents.length).toBe(1);
    expect(saleEvents[0].amount).toBeCloseTo(5499.87, 2);
    expect(saleEvents[0].date).toBe("2026-09-08");
  });
});
