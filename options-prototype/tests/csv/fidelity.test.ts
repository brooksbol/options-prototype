import { describe, it, expect } from "vitest";
import { parseDollar, parsePercent, parseQuantity } from "../../src/csv/fidelity/numericUtils";
import { parseOptionContract } from "../../src/csv/fidelity/parseOptionContract";
import { parseCsv } from "../../src/csv/reader";
import { classifyDocument } from "../../src/csv/registry";
import { fidelityOptionSummaryParser } from "../../src/csv/fidelity/optionSummaryParser";
import type { OptionSummaryRow } from "../../src/csv/fidelity/optionSummaryParser";
import { FIDELITY_OPTION_SUMMARY_FIXTURE, UNKNOWN_CSV_FIXTURE } from "../../src/csv/fixtures/optionSummary";

// Register parsers
import "../../src/csv/fidelity/index";

describe("numericUtils", () => {
  describe("parseDollar", () => {
    it("parses plain dollar", () => expect(parseDollar("$53.15")).toBe(53.15));
    it("parses negative dollar", () => expect(parseDollar("-$390.00")).toBe(-390));
    it("parses positive dollar", () => expect(parseDollar("+$0.96")).toBe(0.96));
    it("parses with commas", () => expect(parseDollar("$11,186.35")).toBe(11186.35));
    it("returns null for --", () => expect(parseDollar("--")).toBeNull());
    it("returns null for blank", () => expect(parseDollar("")).toBeNull());
    it("returns null for n/a", () => expect(parseDollar("n/a")).toBeNull());
    it("handles parenthetical negative", () => expect(parseDollar("($100.00)")).toBe(-100));
  });

  describe("parsePercent", () => {
    it("parses positive percent", () => expect(parsePercent("58.96%")).toBe(58.96));
    it("parses negative percent", () => expect(parsePercent("-24.00%")).toBe(-24));
    it("parses with plus sign", () => expect(parsePercent("+1.76%")).toBe(1.76));
    it("returns null for --", () => expect(parsePercent("--")).toBeNull());
    it("returns null for blank", () => expect(parsePercent("")).toBeNull());
  });

  describe("parseQuantity", () => {
    it("parses integer", () => expect(parseQuantity("200")).toBe(200));
    it("parses decimal", () => expect(parseQuantity("74.829")).toBe(74.829));
    it("parses negative", () => expect(parseQuantity("-2")).toBe(-2));
    it("returns 0 for blank", () => expect(parseQuantity("")).toBe(0));
  });
});

describe("parseOptionContract", () => {
  it("parses call contract", () => {
    const result = parseOptionContract("XLE JUL 31 2026 $55 CALL");
    expect(result).toEqual({
      underlying: "XLE",
      expiration: "2026-07-31",
      strike: 55,
      type: "CALL",
    });
  });

  it("parses put contract", () => {
    const result = parseOptionContract("XLE JUL 17 2026 $57 PUT");
    expect(result).toEqual({
      underlying: "XLE",
      expiration: "2026-07-17",
      strike: 57,
      type: "PUT",
    });
  });

  it("parses decimal strike", () => {
    const result = parseOptionContract("XLE AUG 07 2026 $54.50 CALL");
    expect(result).toEqual({
      underlying: "XLE",
      expiration: "2026-08-07",
      strike: 54.5,
      type: "CALL",
    });
  });

  it("returns null for Shares", () => {
    expect(parseOptionContract("Shares")).toBeNull();
  });

  it("returns null for empty string", () => {
    expect(parseOptionContract("")).toBeNull();
  });

  it("is case insensitive for type", () => {
    const result = parseOptionContract("SPY JAN 15 2027 $600 call");
    expect(result?.type).toBe("CALL");
  });

  it("parses Fidelity symbol format: -XLE260717P57", () => {
    const result = parseOptionContract("-XLE260717P57");
    expect(result).toEqual({
      underlying: "XLE",
      expiration: "2026-07-17",
      strike: 57,
      type: "PUT",
    });
  });

  it("parses symbol format with decimal strike: -XLE260717C54.5", () => {
    const result = parseOptionContract("-XLE260717C54.5");
    expect(result).toEqual({
      underlying: "XLE",
      expiration: "2026-07-17",
      strike: 54.5,
      type: "CALL",
    });
  });

  it("parses symbol format without leading dash: SPY261218C600", () => {
    const result = parseOptionContract("SPY261218C600");
    expect(result).toEqual({
      underlying: "SPY",
      expiration: "2026-12-18",
      strike: 600,
      type: "CALL",
    });
  });
});

describe("fidelityOptionSummaryParser", () => {
  // Parse the fixture starting from the header line
  function getFixtureDocument() {
    const lines = FIDELITY_OPTION_SUMMARY_FIXTURE.split("\n");
    const headerIdx = lines.findIndex((l) => l.toLowerCase().startsWith("symbol,"));
    const csvContent = lines.slice(headerIdx).join("\n");
    return parseCsv(csvContent);
  }

  it("detects option summary with high confidence", () => {
    const doc = getFixtureDocument();
    const detection = fidelityOptionSummaryParser.detect(doc);
    expect(detection.confidence).toBeGreaterThan(0.5);
    expect(detection.matchedHeaders.length).toBeGreaterThanOrEqual(3);
  });

  it("does not detect unknown CSV", () => {
    const doc = parseCsv(UNKNOWN_CSV_FIXTURE);
    const detection = fidelityOptionSummaryParser.detect(doc);
    expect(detection.confidence).toBeLessThan(0.3);
  });

  it("parses all 7 position rows", () => {
    const doc = getFixtureDocument();
    const result = fidelityOptionSummaryParser.parse(doc);
    expect(result.payload.type).toBe("option_summary");
    if (result.payload.type === "option_summary") {
      expect(result.payload.rows.length).toBe(7);
    }
  });

  it("includes document metadata", () => {
    const doc = getFixtureDocument();
    const result = fidelityOptionSummaryParser.parse(doc, {
      filename: "test.csv",
      preambleLines: [
        "Fidelity Investments - Option Summary Z39411514",
        "Quote data as of 07/08/2026.",
      ],
    });
    expect(result.metadata.source).toBe("fidelity");
    expect(result.metadata.documentType).toBe("option_summary");
    expect(result.metadata.quoteDate).toBe("07/08/2026");
    expect(result.metadata.accountNumber).toBe("Z39411514");
    expect(result.metadata.filename).toBe("test.csv");
  });

  it("detects trailer rows", () => {
    const doc = getFixtureDocument();
    const result = fidelityOptionSummaryParser.parse(doc);
    expect(result.trailerRows.length).toBeGreaterThan(0);
  });

  it("preserves duplicate share rows (strategy views)", () => {
    const doc = getFixtureDocument();
    const result = fidelityOptionSummaryParser.parse(doc);
    const items = result.payload.type === "option_summary" ? result.payload.rows : [];
    const shareRows = items.filter((i) => i.positionType === "share" && i.symbol === "XLE");
    // XLE shares appear twice (once per covered call strategy)
    expect(shareRows.length).toBe(2);
  });

  it("correctly classifies strategies", () => {
    const doc = getFixtureDocument();
    const result = fidelityOptionSummaryParser.parse(doc);
    const items = result.payload.type === "option_summary" ? result.payload.rows : [];
    const strategies = items.map((i) => i.strategy);
    expect(strategies).toContain("CoveredCall");
    expect(strategies).toContain("CashCoveredPut");
    expect(strategies).toContain("UnpairedShares");
  });

  it("parses option contracts correctly", () => {
    const doc = getFixtureDocument();
    const result = fidelityOptionSummaryParser.parse(doc);
    const items = result.payload.type === "option_summary" ? result.payload.rows : [];
    const options = items.filter((i) => i.option !== null);
    expect(options.length).toBe(4);

    const firstOption = options[0];
    expect(firstOption.option?.underlying).toBe("XLE");
    expect(firstOption.option?.type).toBe("CALL");
  });

  it("parses numeric values correctly", () => {
    const doc = getFixtureDocument();
    const result = fidelityOptionSummaryParser.parse(doc);
    const items = result.payload.type === "option_summary" ? result.payload.rows : [];

    // SPYI row
    const spyi = items[0];
    expect(spyi.quantity).toBeCloseTo(74.829);
    expect(spyi.bid).toBeCloseTo(53.02);
    expect(spyi.costBasis).toBeCloseTo(3999.99);
    expect(spyi.totalGainLossPercent).toBeCloseTo(-0.57);
  });
});

describe("document classification", () => {
  it("classifies option summary correctly", () => {
    const lines = FIDELITY_OPTION_SUMMARY_FIXTURE.split("\n");
    const headerIdx = lines.findIndex((l) => l.toLowerCase().startsWith("symbol,"));
    const doc = parseCsv(lines.slice(headerIdx).join("\n"));
    const result = classifyDocument(doc);
    expect(result.parser?.id).toBe("fidelity_option_summary");
  });

  it("returns null parser for unknown CSV", () => {
    const doc = parseCsv(UNKNOWN_CSV_FIXTURE);
    const result = classifyDocument(doc);
    // May match a stub with low confidence or return null
    expect(result.detection?.confidence ?? 0).toBeLessThan(0.5);
  });
});
