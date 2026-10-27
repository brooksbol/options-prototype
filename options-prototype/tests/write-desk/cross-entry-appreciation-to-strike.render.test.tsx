// @vitest-environment jsdom
/**
 * BUG-050 — Cash Deployment Appr→Strike column.
 *
 * Principal decision (October 27, 2026, option A): CSP rows show no
 * appreciation to strike — "—" on screen, empty in the CSV, sorted last —
 * because a cash-secured put holds no shares. Buy-Write rows keep the
 * share-leg value (strike − spot) × 100 with the % in parentheses.
 */
import { render, fireEvent, screen, cleanup } from "@testing-library/react";
import { describe, it, expect, afterEach, beforeEach } from "vitest";
import { CrossEntryStrip } from "../../src/components/CrossEntryStrip";
import { DEFAULT_RECOMMENDATION_POLICY } from "../../src/write-desk/recommend";
import { buildCrossEntryRows, formatAppreciationToStrike } from "../../src/write-desk/production-v0";
import { buildCsv } from "../../src/write-desk/table-csv-export";
import type { PutCandidate } from "../../src/write-desk/candidate-types";
import type { BuyWriteCandidate } from "../../src/write-desk/recommend-buy-writes";
import { computeBuyWriteEconomics } from "../../src/write-desk/recommend-buy-writes";

// Specimen rows taken from the Principal's rejected export
// (wheelwright-cross-entry-2026-10-27 (2).csv): KSA CSP 32 vs spot 34.635
// (previously −$263), KWEB buy-write 23.5 vs spot 23.025 (+$47.50).
function put(symbol: string, strike: number, spot: number, mid: number): PutCandidate {
  return {
    rank: 1, symbol, expiration: "2026-11-20", dte: 24, strike, delta: -0.3, underlyingPrice: spot,
    bid: mid - 0.05, ask: mid + 0.05, mid, spreadPercent: 10, openInterest: 900, volume: 10,
    cashRequired: strike * 100, cashRemaining: 400, yieldAnnualized: 17.8,
    assessment: { score: 90, posture: "ACTIONABLE", components: [], hardNoReason: null, policyVersion: "v1" },
    posture: "ACTIONABLE", affordable: true, governance: { status: "authorized", reason: "" },
  };
}

function buyWrite(symbol: string, strike: number, spot: number, mid: number): BuyWriteCandidate {
  const economics = computeBuyWriteEconomics(spot, strike, mid, 10);
  return {
    rank: 1, symbol, expiration: "2026-11-06", dte: 10, strike, delta: 0.35,
    bid: mid - 0.005, ask: mid + 0.005, mid, spreadPercent: 3.8, openInterest: 4200, volume: 310,
    underlyingPrice: spot, capitalRequired: spot * 100, cashRemaining: 1300,
    premiumYieldAnnualized: economics.premiumYieldAnnualized,
    totalReturnIfAssignedAnnualized: economics.totalReturnIfAssignedAnnualized,
    totalReturnIfCalledPercent: economics.totalReturnIfCalledPercent,
    strikeAbovePrice: strike > spot, appreciationPerShare: strike - spot, economics,
    assessment: { score: 100, posture: "ACTIONABLE", components: [], hardNoReason: null, policyVersion: "v1" },
    posture: "ACTIONABLE", affordable: true, governance: { status: "authorized", reason: "" },
  };
}

const PUTS = [put("KSA", 32, 34.635, 0.375), put("FXI", 31, 32.42, 0.255)];
const BWS = [buyWrite("KWEB", 23.5, 23.025, 0.265), buyWrite("UNG", 10, 9.455, 0.415)];

function mount() {
  render(
    <CrossEntryStrip
      putCandidates={PUTS}
      buyWriteCandidates={BWS}
      policy={DEFAULT_RECOMMENDATION_POLICY}
      onSelectPut={() => {}}
      onSelectBuyWrite={() => {}}
    />,
  );
}

const headers = () => screen.getAllByRole("columnheader");
const header = (label: string) => headers().find((th) => th.textContent?.startsWith(label))!;
const apprIndex = () => headers().findIndex((th) => th.textContent?.startsWith("Appr→Strike"));
const rows = () => Array.from(document.querySelectorAll("tbody tr")).map((tr) => ({
  symbol: tr.querySelector(".wd-symbol")?.textContent ?? "",
  appr: tr.querySelectorAll("td")[apprIndex()]?.textContent ?? "",
}));

beforeEach(() => localStorage.clear());
afterEach(cleanup);

describe("Cash Deployment Appr→Strike (BUG-050)", () => {
  it("CSP rows carry no appreciation to strike; buy-write rows keep the share-leg value", () => {
    const built = buildCrossEntryRows(PUTS, BWS);
    for (const r of built.filter((r) => r.entryMechanism === "csp")) {
      expect(r.appreciationToStrikeDollars).toBeNull();
      expect(r.appreciationToStrikePct).toBeNull();
    }
    const kweb = built.find((r) => r.symbol === "KWEB")!;
    expect(kweb.appreciationToStrikeDollars).toBeCloseTo(47.5, 6);
    expect(kweb.appreciationToStrikePct).toBeCloseTo(2.063, 2);
  });

  it("renders — for CSP rows and +$ for buy-write rows; no negative value appears", () => {
    mount();
    const bySymbol = Object.fromEntries(rows().map((r) => [r.symbol, r.appr]));
    expect(bySymbol.KSA).toBe("—");
    expect(bySymbol.FXI).toBe("—");
    expect(bySymbol.KWEB).toBe("+$48 (+2.1%)");
    // (10 − 9.455) × 100 = 54.49999… in floating point → "$54" (unchanged formatter rounding).
    expect(bySymbol.UNG).toBe("+$54 (+5.8%)");
    expect(rows().some((r) => r.appr.includes("−"))).toBe(false);
  });

  it("sorting by Appr→Strike keeps CSP rows last in both directions", () => {
    mount();
    fireEvent.click(header("Appr→Strike"));
    const first = rows().map((r) => r.symbol);
    fireEvent.click(header("Appr→Strike"));
    const second = rows().map((r) => r.symbol);

    for (const order of [first, second]) {
      expect(order.slice(2).sort()).toEqual(["FXI", "KSA"]);
    }
    expect(new Set([first.slice(0, 2).join(), second.slice(0, 2).join()])).toEqual(new Set(["UNG,KWEB", "KWEB,UNG"]));
  });

  it("CSV leaves CSP Appr→Strike cells empty", () => {
    const csv = buildCsv(
      buildCrossEntryRows(PUTS, BWS) as unknown as Record<string, unknown>[],
      [
        { key: "entryMechanism", label: "Entry" }, { key: "symbol", label: "Symbol" },
        { key: "appreciationToStrikeDollars", label: "ApprToStrike$" }, { key: "appreciationToStrikePct", label: "ApprToStrike%" },
      ],
    );
    const lines = csv.trim().split(/\r?\n/).slice(1).map((l) => l.split(","));
    for (const [entry, , dollars, pct] of lines) {
      if (entry === "csp") expect([dollars, pct]).toEqual(["", ""]);
      else expect(Number(dollars)).toBeGreaterThan(0);
    }
  });

  it("formatter shows — when not applicable", () => {
    expect(formatAppreciationToStrike(null, null)).toBe("—");
    expect(formatAppreciationToStrike(-263.5, -7.6)).toBe("−$264 (−7.6%)");
  });
});
