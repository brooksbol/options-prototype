import { describe, it, expect } from "vitest";
import { parseFidelityActivity } from "../../src/imports/fidelity/parseActivity";
import { parseFidelityHoldings } from "../../src/imports/fidelity/parseHoldings";

describe("parseFidelityActivity", () => {
  const sampleCSV = `Run Date,Account,Action,Symbol,Security Description,Security Type,Quantity,Price ($),Commission ($),Fees ($),Accrued Interest ($),Amount ($),Settlement Date
07/01/2026,XXXX1234,YOU SOLD OPENING TRANSACTION,-XLE260718P55,PUT (XLE) ENERGY SELECT SECTOR JUL 18 26 $55,Cash,5,0.35,0,0.04,,$174.96,07/02/2026
07/01/2026,XXXX1234,YOU SOLD OPENING TRANSACTION,-XLE260718C57,CALL (XLE) ENERGY SELECT SECTOR JUL 18 26 $57,Cash,3,0.45,0,0.02,,$134.98,07/02/2026
06/28/2026,XXXX1234,DIVIDEND RECEIVED,,ENERGY SELECT SECTOR SPDR,Cash,,,,,,42.50,06/30/2026`;

  it("parses activity rows", () => {
    const result = parseFidelityActivity(sampleCSV);
    expect(result.items.length).toBe(3);
    expect(result.errors.length).toBe(0);
  });

  it("maps action to canonical activity type", () => {
    const result = parseFidelityActivity(sampleCSV);
    expect(result.items[0].type).toBe("SELL_TO_OPEN");
    expect(result.items[2].type).toBe("DIVIDEND");
  });

  it("extracts option details from description", () => {
    const result = parseFidelityActivity(sampleCSV);
    const put = result.items[0];
    expect(put.isOption).toBe(true);
    expect(put.optionDetails?.type).toBe("PUT");
    expect(put.optionDetails?.strike).toBe(55);
    expect(put.optionDetails?.expiration).toBe("2026-07-18");
    expect(put.optionDetails?.underlying).toBe("XLE");
  });

  it("extracts call option details", () => {
    const result = parseFidelityActivity(sampleCSV);
    const call = result.items[1];
    expect(call.isOption).toBe(true);
    expect(call.optionDetails?.type).toBe("CALL");
    expect(call.optionDetails?.strike).toBe(57);
  });

  it("normalizes date to ISO format", () => {
    const result = parseFidelityActivity(sampleCSV);
    expect(result.items[0].date).toBe("2026-07-01");
  });

  it("parses amounts", () => {
    const result = parseFidelityActivity(sampleCSV);
    expect(result.items[2].amount).toBe(42.50);
  });

  it("reports source file name", () => {
    const result = parseFidelityActivity(sampleCSV, "my-export.csv");
    expect(result.source).toBe("my-export.csv");
  });

  it("handles empty input", () => {
    const result = parseFidelityActivity("");
    expect(result.items.length).toBe(0);
    expect(result.errors.length).toBe(0);
  });
});

describe("parseFidelityHoldings", () => {
  const sampleCSV = `Account Name/Number,Symbol,Description,Quantity,Last Price,Last Price Change,Current Value,Today's Gain/Loss Dollar,Today's Gain/Loss Percent,Total Gain/Loss Dollar,Total Gain/Loss Percent,Percent Of Account,Cost Basis,Cost Basis Per Share,Type
Individual XXXX1234,XLE,ENERGY SELECT SECTOR SPDR,500,$55.92,+$0.41,"$27,960.00",$205.00,+0.74%,"$2,460.00",+9.63%,45.32%,"$25,500.00",$51.00,Cash
Individual XXXX1234,-XLE260718P55,"PUT (XLE) ENERGY SELECT SECTOR JUL 18 26 $55",-5,$0.35,0.00,-$175.00,$0.00,0.00%,-$0.04,-0.02%,0.28%,$175.04,$0.35,Margin
Individual XXXX1234,SPAXX,FIDELITY GOVERNMENT MONEY MARKET,,,$0.00,"$5,432.10",,,,,,,,Cash`;

  it("parses holding rows", () => {
    const result = parseFidelityHoldings(sampleCSV);
    // XLE stock + XLE put (SPAXX is cash, skipped)
    expect(result.items.length).toBe(2);
    expect(result.errors.length).toBe(0);
  });

  it("parses equity holdings", () => {
    const result = parseFidelityHoldings(sampleCSV);
    const xle = result.items[0];
    expect(xle.symbol).toBe("XLE");
    expect(xle.quantity).toBe(500);
    expect(xle.isOption).toBe(false);
  });

  it("parses option holdings with details", () => {
    const result = parseFidelityHoldings(sampleCSV);
    const put = result.items[1];
    expect(put.isOption).toBe(true);
    expect(put.optionDetails?.type).toBe("PUT");
    expect(put.optionDetails?.strike).toBe(55);
    expect(put.optionDetails?.expiration).toBe("2026-07-18");
    expect(put.optionDetails?.underlying).toBe("XLE");
    expect(put.quantity).toBe(-5);
  });

  it("skips cash positions (SPAXX)", () => {
    const result = parseFidelityHoldings(sampleCSV);
    const symbols = result.items.map((h) => h.symbol);
    expect(symbols).not.toContain("SPAXX");
  });

  it("handles empty input", () => {
    const result = parseFidelityHoldings("");
    expect(result.items.length).toBe(0);
  });

  it("reports source file name", () => {
    const result = parseFidelityHoldings(sampleCSV, "positions.csv");
    expect(result.source).toBe("positions.csv");
  });
});
