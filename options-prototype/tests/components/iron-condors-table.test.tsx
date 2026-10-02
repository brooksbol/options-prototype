/**
 * Iron Condors table — acceptance over FROZEN Exit Reliability v0 evidence (PR #33).
 *
 * Proves the product increment:
 *   - "Iron Condors" heading is present.
 *   - The full frozen scored universe renders (1,641 rows).
 *   - Default order is descending Exit Reliability.
 *   - SPY = 95.5, TLT = 94.7, XLE = 45.1, EWZ = 38.8.
 *   - The UI never calls the score a probability.
 *
 * All DOM queries are scoped to THIS render's container (via `within`) rather than
 * the global `screen`, so the assertions are immune to any DOM left mounted by other
 * test files (the project's vitest setup does not auto-cleanup between files).
 */

import { describe, it, expect, afterEach, beforeEach, vi } from "vitest";
import { render, within, cleanup, fireEvent, act, waitFor } from "@testing-library/react";
import { IronCondorsTable } from "../../src/components/IronCondorsTable";
import {
  EXIT_RELIABILITY_V0_ROWS,
  EXIT_RELIABILITY_V0_PROVENANCE,
} from "../../src/write-desk/exit-reliability-v0-data";

/**
 * Stub /api/evidence/quotes with a canned payload for a few symbols so the live
 * Spot/Chg/Chg% columns are exercised deterministically. Any symbol not in the
 * map returns no observation → rendered "—". The component chunks requests and
 * merges; the stub reads the requested `symbol=` params and answers for those.
 */
const STUB_QUOTES: Record<string, { price: number; previousClose: number }> = {
  SPY: { price: 110, previousClose: 100 },   // +10 / +10%
  TLT: { price: 90, previousClose: 100 },    // -10 / -10%
  XLE: { price: 50, previousClose: 50 },     // 0 / flat
};

function installQuotesStub() {
  vi.stubGlobal("fetch", vi.fn(async (input: RequestInfo | URL) => {
    const url = String(input);
    const syms = Array.from(new URLSearchParams(url.split("?")[1] ?? "").getAll("symbol"));
    const quotes = syms
      .filter((s) => STUB_QUOTES[s])
      .map((s) => ({ symbol: s, observation: { price: STUB_QUOTES[s].price, previousClose: STUB_QUOTES[s].previousClose, observedAt: "2026-10-01T20:00:00Z" } }));
    return {
      ok: true,
      status: 200,
      headers: new Headers(),
      json: async () => ({ generation: 1, generatedAt: "2026-10-01T20:00:00Z", quotes }),
    } as unknown as Response;
  }));
}

/**
 * Read the (symbol, score) pairs from a rendered table body, in DOM order.
 *
 * Uses direct DOM access (querySelector) rather than Testing Library role queries:
 * the frozen universe is ~1,641 rows, and the role-based accessibility tree walk
 * over that many rows is slow enough to risk timeouts under full-suite CPU
 * contention. Direct selectors keep each read well within the default timeout.
 */
function readRenderedRows(container: HTMLElement): { type: string; symbol: string; score: string }[] {
  const bodyRows = container.querySelectorAll("table.ic-table tbody tr");
  // Column order: Type(0) | Symbol(1) | Exit Reliability(2) | Spot(3) | Spread(4) | IV Rank(5) | Chg(6) | Chg%(7)
  return Array.from(bodyRows).map((row) => {
    const cells = row.querySelectorAll("td");
    return { type: cells[0]?.textContent ?? "", symbol: cells[1]?.textContent ?? "", score: cells[2]?.textContent ?? "" };
  });
}

// The full frozen universe is ~1,641 rows; rendering it in jsdom can exceed the
// default 5s timeout under full-suite CPU contention. Give these renders headroom.
describe("IronCondorsTable (frozen Exit Reliability v0)", { timeout: 30000 }, () => {
  beforeEach(() => { installQuotesStub(); });
  afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

  it("renders the Iron Condors heading and both columns", () => {
    const { container } = render(<IronCondorsTable />);
    const scope = within(container);
    expect(scope.getByRole("heading", { name: /Iron Condors/i })).toBeTruthy();
    expect(scope.getByRole("columnheader", { name: /Symbol/i })).toBeTruthy();
    expect(scope.getByRole("columnheader", { name: /Exit Reliability/i })).toBeTruthy();
  });

  it("renders the complete frozen scored universe (1,641 ETFs)", () => {
    const { container } = render(<IronCondorsTable />);
    const rendered = readRenderedRows(container);
    expect(rendered.length).toBe(EXIT_RELIABILITY_V0_ROWS.length);
    expect(rendered.length).toBe(1641);
    expect(EXIT_RELIABILITY_V0_PROVENANCE.evaluatedCount).toBe(1641);
  });

  it("defaults to descending Exit Reliability order", () => {
    const { container } = render(<IronCondorsTable />);
    const rendered = readRenderedRows(container);
    const scores = rendered.map((r) => Number(r.score));
    for (let i = 1; i < scores.length; i++) {
      expect(scores[i]).toBeLessThanOrEqual(scores[i - 1]);
    }
    // Top of the list is the highest score.
    expect(rendered[0].symbol).toBe("SPY");
    expect(rendered[0].score).toBe("95.5");
  });

  it.each([
    ["SPY", "95.5"],
    ["TLT", "94.7"],
    ["XLE", "45.1"],
    ["EWZ", "38.8"],
  ])("displays %s = %s", (symbol, score) => {
    const { container } = render(<IronCondorsTable />);
    const rendered = readRenderedRows(container);
    const match = rendered.find((r) => r.symbol === symbol);
    expect(match).toBeDefined();
    expect(match?.score).toBe(score);
  });

  it("does not describe Exit Reliability as a probability", () => {
    const { container } = render(<IronCondorsTable />);
    const text = (container.textContent ?? "").toLowerCase();
    // The only mention of "probability" must be the explicit disclaimer that it is NOT one.
    expect(text).toContain("not a fill probability");
    // No "N% probability" style phrasing anywhere.
    expect(text).not.toMatch(/\d+(\.\d+)?\s*%?\s*probability/);
  });

  it("is not collapsible by default (standalone render shows the table)", () => {
    const { container } = render(<IronCondorsTable />);
    expect(container.querySelector(".wd-collapse-toggle")).toBeNull();
    expect(container.querySelector("table.ic-table")).not.toBeNull();
  });

  it("renders a collapse toggle and hides the table when collapsed", () => {
    const onToggle = () => {};
    // Expanded: toggle present, table visible.
    const expanded = render(<IronCondorsTable collapsed={false} onToggleCollapse={onToggle} />);
    const toggle = expanded.container.querySelector(".wd-collapse-toggle");
    expect(toggle).not.toBeNull();
    expect(toggle?.getAttribute("aria-expanded")).toBe("true");
    expect(expanded.container.querySelector("table.ic-table")).not.toBeNull();
    cleanup();

    // Collapsed: toggle still present (so it can be reopened), table hidden, heading kept.
    const collapsed = render(<IronCondorsTable collapsed={true} onToggleCollapse={onToggle} />);
    const cToggle = collapsed.container.querySelector(".wd-collapse-toggle");
    expect(cToggle).not.toBeNull();
    expect(cToggle?.getAttribute("aria-expanded")).toBe("false");
    expect(collapsed.container.querySelector("table.ic-table")).toBeNull();
    expect(collapsed.container.querySelector(".ic-title")?.textContent).toContain("Iron Condors");
  });

  it("invokes onToggleCollapse when the chevron is clicked", () => {
    let calls = 0;
    const { container } = render(
      <IronCondorsTable collapsed={false} onToggleCollapse={() => { calls += 1; }} />,
    );
    const toggle = container.querySelector(".wd-collapse-toggle") as HTMLButtonElement;
    toggle.click();
    expect(calls).toBe(1);
  });

  it("renders all eight columns with Type first, including the placeholders", () => {
    const { container } = render(<IronCondorsTable enableQuotes={false} />);
    const headers = Array.from(container.querySelectorAll("table.ic-table thead th")).map((h) => (h.textContent ?? "").replace(/[▲▼0-9]/g, "").trim());
    expect(headers).toEqual(["Type", "Symbol", "Exit Reliability", "Spot", "Spread", "IV Rank", "Chg", "Chg %"]);
  });

  it("renders a TYPE badge (ETF for all v0 symbols) as the first column", () => {
    const { container } = render(<IronCondorsTable enableQuotes={false} />);
    const rows = Array.from(container.querySelectorAll("table.ic-table tbody tr")).slice(0, 5);
    for (const row of rows) {
      const cells = row.querySelectorAll("td");
      const badge = cells[0]?.querySelector(".ic-type-badge");
      expect(badge).not.toBeNull();
      expect(badge?.textContent).toBe("ETF");
      expect(badge?.className).toContain("ic-type-etf");
    }
  });

  it("renders Spread and IV Rank as placeholders for every row", () => {
    const { container } = render(<IronCondorsTable enableQuotes={false} />);
    // Column order shifts by Type: Spread = cell 4, IV Rank = cell 5 (0-indexed).
    const rows = Array.from(container.querySelectorAll("table.ic-table tbody tr")).slice(0, 5);
    for (const row of rows) {
      const cells = row.querySelectorAll("td");
      expect(cells[4]?.textContent).toBe("—");
      expect(cells[5]?.textContent).toBe("—");
    }
  });

  it("renders live Spot/Chg/Chg% from quotes and color-codes direction", async () => {
    const { container } = render(<IronCondorsTable />);
    // Symbol is now the 2nd cell (Type is first). Match on cell[1].
    const cellsFor = (sym: string) => {
      const rows = Array.from(container.querySelectorAll("table.ic-table tbody tr"));
      const row = rows.find((r) => r.querySelectorAll("td")[1]?.textContent === sym);
      return row ? Array.from(row.querySelectorAll("td")) : [];
    };
    // Columns: Type(0) Symbol(1) ExitRel(2) Spot(3) Spread(4) IVRank(5) Chg(6) Chg%(7)
    await waitFor(() => expect(cellsFor("SPY")[3]?.textContent).toBe("$110.00"));

    const spy = cellsFor("SPY");
    expect(spy[6]?.textContent).toBe("+$10.00");       // Chg
    expect(spy[7]?.textContent).toBe("+10.00%");        // Chg %
    expect(spy[6]?.className).toContain("ic-up");

    const tlt = cellsFor("TLT");
    expect(tlt[3]?.textContent).toBe("$90.00");
    expect(tlt[6]?.textContent).toBe("-$10.00");
    expect(tlt[7]?.textContent).toBe("-10.00%");
    expect(tlt[6]?.className).toContain("ic-down");

    const xle = cellsFor("XLE");
    expect(xle[6]?.textContent).toBe("$0.00");          // flat
    expect(xle[6]?.className).toContain("ic-flat");
  });

  it("shows — for Spot/Chg when the appliance does not maintain the symbol", () => {
    const { container } = render(<IronCondorsTable enableQuotes={false} />);
    const rows = Array.from(container.querySelectorAll("table.ic-table tbody tr"));
    const spy = rows.find((r) => r.querySelectorAll("td")[1]?.textContent === "SPY");
    const cells = spy ? Array.from(spy.querySelectorAll("td")) : [];
    expect(cells[3]?.textContent).toBe("—"); // Spot
    expect(cells[6]?.textContent).toBe("—"); // Chg
    expect(cells[7]?.textContent).toBe("—"); // Chg %
  });

  it("filters by min/max Exit Reliability", () => {
    const { container } = render(<IronCondorsTable enableQuotes={false} />);
    const scope = within(container);
    fireEvent.change(scope.getByLabelText("Min exit reliability"), { target: { value: "90" } });
    const rows = Array.from(container.querySelectorAll("table.ic-table tbody tr"));
    const symbols = rows.map((r) => r.querySelectorAll("td")[1]?.textContent);
    // Only SPY (95.5), TLT (94.7), DIA (90.2) are >= 90.
    expect(symbols).toEqual(["SPY", "TLT", "DIA"]);
  });

  it("filters by min Spot (rows without live spot are excluded by a bound)", async () => {
    const { container } = render(<IronCondorsTable />);
    const scope = within(container);
    // Wait for quotes to populate first.
    await waitFor(() => {
      const r = Array.from(container.querySelectorAll("table.ic-table tbody tr")).find((x) => x.querySelectorAll("td")[1]?.textContent === "SPY");
      expect(r?.querySelectorAll("td")[3]?.textContent).toBe("$110.00");
    });
    fireEvent.change(scope.getByLabelText("Min spot"), { target: { value: "100" } });
    const symbols = Array.from(container.querySelectorAll("table.ic-table tbody tr")).map((r) => r.querySelectorAll("td")[1]?.textContent);
    // Only SPY has spot >= 100 among the stubbed symbols; TLT(90)/XLE(50) and all
    // unquoted rows (null spot) are excluded by the bound.
    expect(symbols).toEqual(["SPY"]);
  });

  it("multi-sorts: clicking Symbol sorts ascending alphabetically", () => {
    const { container } = render(<IronCondorsTable enableQuotes={false} />);
    const symbolHeader = Array.from(container.querySelectorAll("table.ic-table thead th")).find((h) => (h.textContent ?? "").includes("Symbol")) as HTMLElement;
    act(() => { fireEvent.click(symbolHeader); });
    const symbols = Array.from(container.querySelectorAll("table.ic-table tbody tr")).map((r) => r.querySelectorAll("td")[1]?.textContent ?? "");
    const sortedCopy = [...symbols].sort((a, b) => a.localeCompare(b));
    expect(symbols).toEqual(sortedCopy);
  });

  it("exposes a CSV download button", () => {
    const { container } = render(<IronCondorsTable enableQuotes={false} />);
    const btn = Array.from(container.querySelectorAll("button")).find((b) => (b.textContent ?? "").includes("CSV"));
    expect(btn).toBeTruthy();
  });

  it("preserves frozen provenance (date, source, counts, unevaluable symbols)", () => {
    const p = EXIT_RELIABILITY_V0_PROVENANCE;
    expect(p.datasetDate).toBe("2026-10-01");
    expect(p.source).toContain("PR #33");
    expect(p.meaning).toBe("quote-based proxy");
    expect(p.evaluatedCount).toBe(1641);
    expect(p.unevaluableCount).toBe(2);
    expect([...p.unevaluableSymbols]).toEqual(["BLCN", "TXS"]);
    // Unevaluable symbols are NOT scored rows.
    const symbols = new Set(EXIT_RELIABILITY_V0_ROWS.map((r) => r.symbol));
    expect(symbols.has("BLCN")).toBe(false);
    expect(symbols.has("TXS")).toBe(false);
  });
});
