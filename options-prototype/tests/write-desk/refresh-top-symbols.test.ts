/**
 * selectRefreshTopSymbols — Cash Deployment "Refresh top opportunities" scope selection.
 *
 * Proves the display-relative, bounded refresh scope (PL-OPS-09 consumer):
 * 1. Uses the first N rows IN THE GIVEN (current-sort) ORDER — not a re-sort.
 * 2. Deduplicates underlying symbols (multiple rows per underlying collapse to one).
 * 3. Uppercases symbols.
 * 4. Hard-caps at N rows, so the unique-symbol result is always <= N.
 * 5. Respects whatever order it is given (proves it does not impose its own ranking).
 */

import { describe, it, expect } from "vitest";
import { selectRefreshTopSymbols, REFRESH_TOP_N, type RefreshScopeRow } from "../../src/write-desk/refresh-top-symbols";

function rows(...symbols: string[]): RefreshScopeRow[] {
  return symbols.map(s => ({ symbol: s }));
}

describe("selectRefreshTopSymbols", () => {
  it("takes the first N rows in the given order", () => {
    const input = rows("AAA", "BBB", "CCC", "DDD");
    expect(selectRefreshTopSymbols(input, 2)).toEqual(["AAA", "BBB"]);
  });

  it("deduplicates underlyings (N rows can yield fewer than N symbols)", () => {
    // Two rows for GLD (e.g. a CSP and a buy-write) collapse to one symbol.
    const input = rows("GLD", "GLD", "SLV");
    expect(selectRefreshTopSymbols(input, 30)).toEqual(["GLD", "SLV"]);
  });

  it("uppercases symbols", () => {
    expect(selectRefreshTopSymbols(rows("bno", "CopX"), 30)).toEqual(["BNO", "COPX"]);
  });

  it("hard-caps at N rows, so unique symbols never exceed N", () => {
    const input = rows(...Array.from({ length: 100 }, (_, i) => `S${i}`));
    const result = selectRefreshTopSymbols(input, REFRESH_TOP_N);
    expect(result.length).toBe(REFRESH_TOP_N);
    expect(result[0]).toBe("S0");
    expect(result[REFRESH_TOP_N - 1]).toBe(`S${REFRESH_TOP_N - 1}`);
  });

  it("respects the given order and does not impose its own ranking", () => {
    // Given a descending-yield order vs an ascending one, the scope faithfully follows the input.
    const desc = rows("HIGH", "MID", "LOW");
    const asc = rows("LOW", "MID", "HIGH");
    expect(selectRefreshTopSymbols(desc, 2)).toEqual(["HIGH", "MID"]);
    expect(selectRefreshTopSymbols(asc, 2)).toEqual(["LOW", "MID"]);
  });

  it("returns empty for empty input", () => {
    expect(selectRefreshTopSymbols([], REFRESH_TOP_N)).toEqual([]);
  });

  it("skips blank symbols without inflating the set", () => {
    expect(selectRefreshTopSymbols(rows("SPY", "  ", "QQQ"), 30)).toEqual(["SPY", "QQQ"]);
  });
});
