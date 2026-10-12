import { describe, it, expect } from "vitest";
import {
  parseSymbolTerms,
  symbolMatches,
  withinBounds,
  callRowMatches,
  buyWriteRowMatches,
} from "../../src/write-desk/table-filter-predicates";

describe("parseSymbolTerms", () => {
  it("splits on commas and whitespace, trims, upper-cases, drops empties", () => {
    expect(parseSymbolTerms("spy, qqq  iwm")).toEqual(["SPY", "QQQ", "IWM"]);
  });
  it("returns an empty list for an empty / whitespace-only string", () => {
    expect(parseSymbolTerms("")).toEqual([]);
    expect(parseSymbolTerms("   ,  ")).toEqual([]);
  });
});

describe("symbolMatches", () => {
  it("matches when no terms are active", () => {
    expect(symbolMatches("SPY", [])).toBe(true);
  });
  it("matches on case-insensitive substring of any term", () => {
    expect(symbolMatches("SPY", ["SP"])).toBe(true);
    expect(symbolMatches("spy", ["SPY"])).toBe(true);
    expect(symbolMatches("QQQ", ["SPY", "QQ"])).toBe(true);
  });
  it("does not match when no term is a substring", () => {
    expect(symbolMatches("SPY", ["IWM"])).toBe(false);
  });
});

describe("withinBounds (inclusive, nullable)", () => {
  it("passes everything when both bounds are null", () => {
    expect(withinBounds(10, null, null)).toBe(true);
  });
  it("is inclusive at the endpoints", () => {
    expect(withinBounds(7, 7, 45)).toBe(true);
    expect(withinBounds(45, 7, 45)).toBe(true);
  });
  it("excludes values outside the bounds", () => {
    expect(withinBounds(6, 7, 45)).toBe(false);
    expect(withinBounds(46, 7, 45)).toBe(false);
  });
  it("honors a single-sided bound", () => {
    expect(withinBounds(100, 50, null)).toBe(true);
    expect(withinBounds(40, 50, null)).toBe(false);
    expect(withinBounds(40, null, 50)).toBe(true);
    expect(withinBounds(60, null, 50)).toBe(false);
  });
});

describe("callRowMatches (symbol + DTE; no capital/affordability)", () => {
  const row = { symbol: "SPY", dte: 21 };
  it("matches with no filters active", () => {
    expect(callRowMatches(row, { symbolTerms: [], dteMin: null, dteMax: null })).toBe(true);
  });
  it("filters by DTE bounds inclusively", () => {
    expect(callRowMatches(row, { symbolTerms: [], dteMin: 21, dteMax: 21 })).toBe(true);
    expect(callRowMatches(row, { symbolTerms: [], dteMin: 22, dteMax: null })).toBe(false);
    expect(callRowMatches(row, { symbolTerms: [], dteMin: null, dteMax: 20 })).toBe(false);
  });
  it("filters by symbol substring", () => {
    expect(callRowMatches(row, { symbolTerms: ["SP"], dteMin: null, dteMax: null })).toBe(true);
    expect(callRowMatches(row, { symbolTerms: ["QQ"], dteMin: null, dteMax: null })).toBe(false);
  });
  it("requires all active dimensions to pass", () => {
    expect(callRowMatches(row, { symbolTerms: ["SPY"], dteMin: 30, dteMax: null })).toBe(false);
  });
});

describe("buyWriteRowMatches (symbol + DTE + capital)", () => {
  const row = { symbol: "QQQ", dte: 30, capitalRequired: 45000 };
  it("matches with no filters active", () => {
    expect(
      buyWriteRowMatches(row, { symbolTerms: [], dteMin: null, dteMax: null, capitalMin: null, capitalMax: null }),
    ).toBe(true);
  });
  it("filters by capital bounds inclusively", () => {
    expect(
      buyWriteRowMatches(row, { symbolTerms: [], dteMin: null, dteMax: null, capitalMin: 45000, capitalMax: 45000 }),
    ).toBe(true);
    expect(
      buyWriteRowMatches(row, { symbolTerms: [], dteMin: null, dteMax: null, capitalMin: 50000, capitalMax: null }),
    ).toBe(false);
    expect(
      buyWriteRowMatches(row, { symbolTerms: [], dteMin: null, dteMax: null, capitalMin: null, capitalMax: 40000 }),
    ).toBe(false);
  });
  it("filters by DTE and symbol together", () => {
    expect(
      buyWriteRowMatches(row, { symbolTerms: ["QQ"], dteMin: 7, dteMax: 45, capitalMin: null, capitalMax: null }),
    ).toBe(true);
    expect(
      buyWriteRowMatches(row, { symbolTerms: ["SPY"], dteMin: 7, dteMax: 45, capitalMin: null, capitalMax: null }),
    ).toBe(false);
  });
  it("requires all active dimensions to pass", () => {
    expect(
      buyWriteRowMatches(row, { symbolTerms: ["QQQ"], dteMin: null, dteMax: null, capitalMin: null, capitalMax: 40000 }),
    ).toBe(false);
  });
});
