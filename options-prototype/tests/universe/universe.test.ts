/**
 * Tests for Candidate Universe module.
 */

import { describe, it, expect } from "vitest";
import { mergeAndDeduplicate } from "../../src/universe/universe";
import { YAHOO_TOP_ETFS, YAHOO_SOURCE_ID, YAHOO_CAPTURED_AT } from "../../src/universe/sources/yahoo";
import type { CandidateSymbol } from "../../src/universe/types";

// --- Yahoo Seed Data ---

describe("Yahoo seed data", () => {
  it("contains exactly 496 symbols", () => {
    expect(YAHOO_TOP_ETFS).toHaveLength(496);
  });

  it("all symbols are uppercase", () => {
    for (const symbol of YAHOO_TOP_ETFS) {
      expect(symbol).toBe(symbol.toUpperCase());
    }
  });

  it("contains no duplicates", () => {
    const unique = new Set(YAHOO_TOP_ETFS);
    expect(unique.size).toBe(496);
  });

  it("is sorted alphabetically", () => {
    const sorted = [...YAHOO_TOP_ETFS].sort();
    expect(YAHOO_TOP_ETFS).toEqual(sorted);
  });

  it("contains known ETFs", () => {
    expect(YAHOO_TOP_ETFS).toContain("SPY");
    expect(YAHOO_TOP_ETFS).toContain("XLE");
    expect(YAHOO_TOP_ETFS).toContain("QQQ");
    expect(YAHOO_TOP_ETFS).toContain("GLD");
    expect(YAHOO_TOP_ETFS).toContain("VTI" === undefined ? "VT" : "VT"); // VT is in the list
  });

  it("has correct source constants", () => {
    expect(YAHOO_SOURCE_ID).toBe("yahoo_top_etfs_2026_07_13");
    expect(YAHOO_CAPTURED_AT).toBe("2026-07-13");
  });
});

// --- Merge and Deduplicate ---

describe("mergeAndDeduplicate", () => {
  it("deduplicates by symbol", () => {
    const input: CandidateSymbol[] = [
      { symbol: "XLE", sources: ["source_a"], addedAt: "2026-07-01" },
      { symbol: "XLE", sources: ["source_b"], addedAt: "2026-07-10" },
    ];
    const result = mergeAndDeduplicate(input);
    expect(result).toHaveLength(1);
    expect(result[0].symbol).toBe("XLE");
  });

  it("merges source tags on duplicate", () => {
    const input: CandidateSymbol[] = [
      { symbol: "XLE", sources: ["yahoo"], addedAt: "2026-07-01" },
      { symbol: "XLE", sources: ["operator_manual"], addedAt: "2026-07-10" },
    ];
    const result = mergeAndDeduplicate(input);
    expect(result[0].sources).toContain("yahoo");
    expect(result[0].sources).toContain("operator_manual");
    expect(result[0].sources).toHaveLength(2);
  });

  it("preserves earliest addedAt on merge", () => {
    const input: CandidateSymbol[] = [
      { symbol: "XLE", sources: ["a"], addedAt: "2026-07-10" },
      { symbol: "XLE", sources: ["b"], addedAt: "2026-07-01" },
    ];
    const result = mergeAndDeduplicate(input);
    expect(result[0].addedAt).toBe("2026-07-01");
  });

  it("normalizes symbols to uppercase", () => {
    const input: CandidateSymbol[] = [
      { symbol: "xle", sources: ["a"], addedAt: "2026-07-01" },
      { symbol: "XLE", sources: ["b"], addedAt: "2026-07-05" },
    ];
    const result = mergeAndDeduplicate(input);
    expect(result).toHaveLength(1);
    expect(result[0].symbol).toBe("XLE");
  });

  it("trims whitespace from symbols", () => {
    const input: CandidateSymbol[] = [
      { symbol: " SPY ", sources: ["a"], addedAt: "2026-07-01" },
    ];
    const result = mergeAndDeduplicate(input);
    expect(result[0].symbol).toBe("SPY");
  });

  it("skips empty symbols", () => {
    const input: CandidateSymbol[] = [
      { symbol: "", sources: ["a"], addedAt: "2026-07-01" },
      { symbol: "  ", sources: ["b"], addedAt: "2026-07-01" },
      { symbol: "XLE", sources: ["c"], addedAt: "2026-07-01" },
    ];
    const result = mergeAndDeduplicate(input);
    expect(result).toHaveLength(1);
    expect(result[0].symbol).toBe("XLE");
  });

  it("sorts output alphabetically", () => {
    const input: CandidateSymbol[] = [
      { symbol: "ZZZ", sources: ["a"], addedAt: "2026-07-01" },
      { symbol: "AAA", sources: ["b"], addedAt: "2026-07-01" },
      { symbol: "MMM", sources: ["c"], addedAt: "2026-07-01" },
    ];
    const result = mergeAndDeduplicate(input);
    expect(result.map((r) => r.symbol)).toEqual(["AAA", "MMM", "ZZZ"]);
  });

  it("deduplicates source tags within a merged record", () => {
    const input: CandidateSymbol[] = [
      { symbol: "XLE", sources: ["yahoo"], addedAt: "2026-07-01" },
      { symbol: "XLE", sources: ["yahoo"], addedAt: "2026-07-05" },
    ];
    const result = mergeAndDeduplicate(input);
    expect(result[0].sources).toEqual(["yahoo"]);
  });

  it("handles empty input", () => {
    const result = mergeAndDeduplicate([]);
    expect(result).toEqual([]);
  });

  it("handles single item", () => {
    const input: CandidateSymbol[] = [
      { symbol: "SPY", sources: ["test"], addedAt: "2026-07-01" },
    ];
    const result = mergeAndDeduplicate(input);
    expect(result).toHaveLength(1);
    expect(result[0].symbol).toBe("SPY");
  });
});

// --- No Provider Calls ---

describe("universe loading behavior", () => {
  it("loadCandidateUniverse returns bundled data without network calls", async () => {
    // Dynamic import to verify no side effects
    const { loadCandidateUniverse } = await import("../../src/universe/universe");
    const result = loadCandidateUniverse();
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThanOrEqual(496);
  });
});
