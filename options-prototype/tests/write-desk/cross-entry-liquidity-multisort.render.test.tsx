// @vitest-environment jsdom
/**
 * BUG-051 — Cash Deployment multi-sort with Liq as the primary column.
 *
 * Principal specimen (October 27, 2026): "sort by LIQ, second sort by OI" — or
 * more generally, sort by Liq, then a second sort by any other column — must
 * order rows within each liquidity grade by the second column.
 *
 * Fixture: three L1 rows (spread ≤ 5%, OI ≥ 1,000) and one L2 row.
 */
import { render, fireEvent, screen, cleanup } from "@testing-library/react";
import { describe, it, expect, afterEach, beforeEach } from "vitest";
import { CrossEntryStrip } from "../../src/components/CrossEntryStrip";
import { DEFAULT_RECOMMENDATION_POLICY } from "../../src/write-desk/recommend";
import type { PutCandidate } from "../../src/write-desk/candidate-types";

function put(symbol: string, spreadPercent: number, openInterest: number, yieldAnnualized: number, mid: number): PutCandidate {
  return {
    rank: 1, symbol, expiration: "2026-11-20", dte: 24, strike: 30, delta: -0.3, underlyingPrice: 32,
    bid: mid - 0.01, ask: mid + 0.01, mid, spreadPercent, openInterest, volume: 10,
    cashRequired: 3000, cashRemaining: 500, yieldAnnualized,
    assessment: { score: 90, posture: "ACTIONABLE", components: [], hardNoReason: null, policyVersion: "v1" },
    posture: "ACTIONABLE", affordable: true, governance: { status: "authorized", reason: "" },
  };
}

// Prod v0 for a CSP scales with mid, so mid sets the default (Prod v0) order: AAA > BBB > CCC.
const ROWS = [
  put("AAA", 4.0, 1200, 30, 0.6),   // L1, low OI, highest Prod v0
  put("BBB", 2.0, 1500, 10, 0.5),   // L1, mid OI, lowest yield
  put("CCC", 3.0, 90000, 20, 0.4),  // L1, huge OI
  put("DDD", 8.0, 500, 40, 0.7),    // L2 (highest Prod v0 overall, but less liquid)
];

const order = () => Array.from(document.querySelectorAll("tbody tr")).map((tr) => tr.querySelector(".wd-symbol")?.textContent);
const header = (label: string) => screen.getAllByRole("columnheader").find((th) => th.textContent?.startsWith(label))!;

function mount() {
  render(
    <CrossEntryStrip
      putCandidates={ROWS}
      buyWriteCandidates={[]}
      policy={DEFAULT_RECOMMENDATION_POLICY}
      onSelectPut={() => {}}
      onSelectBuyWrite={() => {}}
    />,
  );
}

beforeEach(() => localStorage.clear());
afterEach(cleanup);

describe("Cash Deployment — Liq primary sort with a secondary column (BUG-051)", () => {
  it("Liq then Shift-click OI orders L1 rows by open interest, L2 after", () => {
    mount();
    fireEvent.click(header("Liq"));
    fireEvent.click(header("OI"), { shiftKey: true });
    expect(header("OI").textContent).toContain("2▼");
    expect(order()).toEqual(["CCC", "BBB", "AAA", "DDD"]);
  });

  it("Liq then Shift-click another column (Yield) orders within the grade by that column", () => {
    mount();
    fireEvent.click(header("Liq"));
    fireEvent.click(header("Yield"), { shiftKey: true });
    expect(order()).toEqual(["AAA", "CCC", "BBB", "DDD"]);
  });

  it("toggling the secondary direction reverses order within the grade only", () => {
    mount();
    fireEvent.click(header("Liq"));
    fireEvent.click(header("OI"), { shiftKey: true });
    fireEvent.click(header("OI"), { shiftKey: true });
    expect(header("OI").textContent).toContain("2▲");
    expect(order()).toEqual(["AAA", "BBB", "CCC", "DDD"]);
  });

  it("Liq alone groups by grade and keeps the default Prod v0 order within a grade", () => {
    mount();
    fireEvent.click(header("Liq"));
    expect(order()).toEqual(["AAA", "BBB", "CCC", "DDD"]);
  });
});
