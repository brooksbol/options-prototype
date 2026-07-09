import { describe, it, expect } from "vitest";
import { parseCsv } from "../../src/csv/reader";
import { classifyDocument } from "../../src/csv/registry";
import { fidelityPositionsParser } from "../../src/csv/fidelity/positionsParser";
import type { HoldingRow } from "../../src/csv/fidelity/positionsParser";
import { FIDELITY_POSITIONS_FIXTURE } from "../../src/csv/fixtures/positions";

// Register parsers
import "../../src/csv/fidelity/index";

function getFixtureDocument() {
  return parseCsv(FIDELITY_POSITIONS_FIXTURE);
}

describe("fidelityPositionsParser detection", () => {
  it("detects positions document with high confidence", () => {
    const doc = getFixtureDocument();
    const detection = fidelityPositionsParser.detect(doc);
    expect(detection.confidence).toBeGreaterThan(0.6);
  });

  it("classifier selects positions parser for this fixture", () => {
    const doc = getFixtureDocument();
    const result = classifyDocument(doc);
    expect(result.parser?.id).toBe("fidelity_positions");
  });
});

describe("fidelityPositionsParser parsing", () => {
  it("parses all holding rows (29 total)", () => {
    const doc = getFixtureDocument();
    const result = fidelityPositionsParser.parse(doc);
    expect(result.payload.type).toBe("holdings");
    if (result.payload.type === "holdings") {
      expect(result.payload.rows.length).toBe(29);
    }
  });

  it("detects trailer rows", () => {
    const doc = getFixtureDocument();
    const result = fidelityPositionsParser.parse(doc);
    expect(result.trailerRows.length).toBeGreaterThan(0);
  });

  it("extracts document metadata", () => {
    const doc = getFixtureDocument();
    const result = fidelityPositionsParser.parse(doc, { filename: "positions.csv" });
    expect(result.metadata.source).toBe("fidelity");
    expect(result.metadata.documentType).toBe("positions");
    expect(result.metadata.accountNumber).toBe("Z39411514");
    expect(result.metadata.accountName).toBe("PERSONAL TREASURY");
    expect(result.metadata.filename).toBe("positions.csv");
  });

  it("extracts download timestamp from trailer", () => {
    const doc = getFixtureDocument();
    const result = fidelityPositionsParser.parse(doc);
    expect(result.metadata.downloadTimestamp).toContain("Jul-08-2026");
  });
});

describe("asset class classification", () => {
  function getRows(): HoldingRow[] {
    const doc = getFixtureDocument();
    const result = fidelityPositionsParser.parse(doc);
    return result.payload.type === "holdings" ? result.payload.rows : [];
  }

  it("classifies ETFs as equity", () => {
    const rows = getRows();
    const etfs = rows.filter((r) => r.assetClass === "equity");
    expect(etfs.length).toBe(2); // SPYI + XLE
    expect(etfs.map((r) => r.symbol)).toContain("SPYI");
    expect(etfs.map((r) => r.symbol)).toContain("XLE");
  });

  it("classifies options correctly", () => {
    const rows = getRows();
    const options = rows.filter((r) => r.assetClass === "option");
    expect(options.length).toBe(4);
  });

  it("classifies Treasury bills as fixed_income", () => {
    const rows = getRows();
    const fixedIncome = rows.filter((r) => r.assetClass === "fixed_income");
    expect(fixedIncome.length).toBe(22);
  });

  it("classifies SPAXX as cash_equivalent", () => {
    const rows = getRows();
    const cash = rows.filter((r) => r.assetClass === "cash_equivalent");
    expect(cash.length).toBe(1);
    expect(cash[0].symbol).toContain("SPAXX");
  });
});

describe("option parsing", () => {
  function getRows(): HoldingRow[] {
    const doc = getFixtureDocument();
    const result = fidelityPositionsParser.parse(doc);
    return result.payload.type === "holdings" ? result.payload.rows : [];
  }

  it("parses option contracts from symbol format", () => {
    const rows = getRows();
    const options = rows.filter((r) => r.assetClass === "option");

    const put57 = options.find((r) => r.option?.strike === 57 && r.option?.type === "PUT");
    expect(put57).toBeDefined();
    expect(put57!.option!.underlying).toBe("XLE");
    expect(put57!.option!.expiration).toBe("2026-07-17");
  });

  it("parses decimal strikes", () => {
    const rows = getRows();
    const call54_5 = rows.find((r) => r.option?.strike === 54.5);
    expect(call54_5).toBeDefined();
    expect(call54_5!.option!.type).toBe("CALL");
    expect(call54_5!.option!.expiration).toBe("2026-08-07");
  });

  it("parses negative quantities for short options", () => {
    const rows = getRows();
    const options = rows.filter((r) => r.assetClass === "option");
    for (const opt of options) {
      expect(opt.quantity).toBeLessThan(0);
    }
  });
});

describe("Treasury bill parsing", () => {
  function getRows(): HoldingRow[] {
    const doc = getFixtureDocument();
    const result = fidelityPositionsParser.parse(doc);
    return result.payload.type === "holdings" ? result.payload.rows : [];
  }

  it("extracts maturity dates", () => {
    const rows = getRows();
    const treasuries = rows.filter((r) => r.assetClass === "fixed_income");

    // All treasuries should have maturity dates
    for (const t of treasuries) {
      expect(t.maturityDate).not.toBeNull();
      expect(t.maturityDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });

  it("parses specific maturity date correctly", () => {
    const rows = getRows();
    const t = rows.find((r) => r.symbol === "912797RF6");
    expect(t).toBeDefined();
    expect(t!.maturityDate).toBe("2026-07-09");
  });

  it("parses alternate format maturity (date before ZERO CPN)", () => {
    const rows = getRows();
    const t = rows.find((r) => r.symbol === "912797UF2");
    expect(t).toBeDefined();
    expect(t!.maturityDate).toBe("2026-09-10");
  });

  it("parses face values as quantity", () => {
    const rows = getRows();
    const t = rows.find((r) => r.symbol === "912797TP2");
    expect(t).toBeDefined();
    expect(t!.quantity).toBe(9000);
  });
});

describe("cash equivalent parsing", () => {
  function getRows(): HoldingRow[] {
    const doc = getFixtureDocument();
    const result = fidelityPositionsParser.parse(doc);
    return result.payload.type === "holdings" ? result.payload.rows : [];
  }

  it("parses SPAXX current value", () => {
    const rows = getRows();
    const cash = rows.find((r) => r.assetClass === "cash_equivalent");
    expect(cash).toBeDefined();
    expect(cash!.currentValue).toBeCloseTo(23390.08);
  });

  it("has null for price-related fields on cash", () => {
    const rows = getRows();
    const cash = rows.find((r) => r.assetClass === "cash_equivalent");
    expect(cash!.lastPrice).toBeNull();
    expect(cash!.totalGainLoss).toBeNull();
  });
});

describe("numeric parsing", () => {
  function getRows(): HoldingRow[] {
    const doc = getFixtureDocument();
    const result = fidelityPositionsParser.parse(doc);
    return result.payload.type === "holdings" ? result.payload.rows : [];
  }

  it("parses XLE equity values", () => {
    const rows = getRows();
    const xle = rows.find((r) => r.symbol === "XLE");
    expect(xle).toBeDefined();
    expect(xle!.quantity).toBe(400);
    expect(xle!.lastPrice).toBeCloseTo(55.60);
    expect(xle!.currentValue).toBeCloseTo(22240.00);
    expect(xle!.costBasisTotal).toBeCloseTo(22372.70);
    expect(xle!.totalGainLossPercent).toBeCloseTo(-0.60);
  });

  it("parses percent of account", () => {
    const rows = getRows();
    const xle = rows.find((r) => r.symbol === "XLE");
    expect(xle!.percentOfAccount).toBeCloseTo(25.86);
  });
});
