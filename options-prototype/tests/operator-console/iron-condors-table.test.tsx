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

import { describe, it, expect, afterEach } from "vitest";
import { render, within, cleanup } from "@testing-library/react";
import { IronCondorsTable } from "../../src/operator-console/IronCondorsTable";
import {
  EXIT_RELIABILITY_V0_ROWS,
  EXIT_RELIABILITY_V0_PROVENANCE,
} from "../../src/operator-console/exit-reliability-v0-data";

/**
 * Read the (symbol, score) pairs from a rendered table body, in DOM order.
 *
 * Uses direct DOM access (querySelector) rather than Testing Library role queries:
 * the frozen universe is ~1,641 rows, and the role-based accessibility tree walk
 * over that many rows is slow enough to risk timeouts under full-suite CPU
 * contention. Direct selectors keep each read well within the default timeout.
 */
function readRenderedRows(container: HTMLElement): { symbol: string; score: string }[] {
  const bodyRows = container.querySelectorAll("table.ic-table tbody tr");
  return Array.from(bodyRows).map((row) => {
    const cells = row.querySelectorAll("td");
    return { symbol: cells[0]?.textContent ?? "", score: cells[1]?.textContent ?? "" };
  });
}

// The full frozen universe is ~1,641 rows; rendering it in jsdom can exceed the
// default 5s timeout under full-suite CPU contention. Give these renders headroom.
describe("IronCondorsTable (frozen Exit Reliability v0)", { timeout: 30000 }, () => {
  afterEach(cleanup);

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
