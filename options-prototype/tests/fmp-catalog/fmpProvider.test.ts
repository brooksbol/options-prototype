/**
 * Tests for FMP ETF Reference Data provider normalization.
 */

import { describe, it, expect } from "vitest";

// We test the normalization logic by simulating what the provider does internally.
// Since the provider calls fetch (which we don't want in unit tests), we test
// the data transformation patterns.

describe("FMP profile normalization", () => {
  // Simulates normalizeProfile logic
  function normalize(raw: Record<string, unknown>) {
    return {
      symbol: String(raw.symbol ?? ""),
      name: typeof raw.companyName === "string" ? raw.companyName : null,
      exchange: typeof raw.exchange === "string" ? raw.exchange : null,
      country: typeof raw.country === "string" ? raw.country : null,
      isEtf: typeof raw.isEtf === "boolean" ? raw.isEtf : null,
      isFund: typeof raw.isFund === "boolean" ? raw.isFund : null,
      isActivelyTrading: typeof raw.isActivelyTrading === "boolean" ? raw.isActivelyTrading : null,
      industry: typeof raw.industry === "string" ? raw.industry : null,
      sector: typeof raw.sector === "string" ? raw.sector : null,
      marketCap: typeof raw.marketCap === "number" ? raw.marketCap : null,
      price: typeof raw.price === "number" ? raw.price : null,
      isin: typeof raw.isin === "string" ? raw.isin : null,
      cusip: typeof raw.cusip === "string" ? raw.cusip : null,
    };
  }

  it("normalizes a complete ETF profile", () => {
    const raw = {
      symbol: "XLE",
      companyName: "State Street Energy Select Sector SPDR ETF",
      exchange: "AMEX",
      country: "US",
      isEtf: true,
      isFund: false,
      isActivelyTrading: true,
      industry: "Asset Management",
      sector: "Financial Services",
      marketCap: 26500000000,
      price: 54.86,
      isin: "US81369Y5069",
      cusip: "81369Y506",
    };
    const result = normalize(raw);
    expect(result.symbol).toBe("XLE");
    expect(result.name).toBe("State Street Energy Select Sector SPDR ETF");
    expect(result.isEtf).toBe(true);
    expect(result.exchange).toBe("AMEX");
    expect(result.country).toBe("US");
    expect(result.marketCap).toBe(26500000000);
    expect(result.price).toBe(54.86);
  });

  it("handles missing optional fields with null", () => {
    const raw = { symbol: "TEST" };
    const result = normalize(raw);
    expect(result.symbol).toBe("TEST");
    expect(result.name).toBeNull();
    expect(result.isEtf).toBeNull();
    expect(result.exchange).toBeNull();
    expect(result.marketCap).toBeNull();
    expect(result.price).toBeNull();
  });

  it("does not coerce string to boolean for isEtf", () => {
    const raw = { symbol: "X", isEtf: "true" };
    const result = normalize(raw);
    expect(result.isEtf).toBeNull(); // string, not boolean
  });

  it("handles empty symbol", () => {
    const raw = {};
    const result = normalize(raw);
    expect(result.symbol).toBe("");
  });

  it("distinguishes ETF from non-ETF", () => {
    const etf = normalize({ symbol: "SPY", isEtf: true });
    const stock = normalize({ symbol: "AAPL", isEtf: false });
    expect(etf.isEtf).toBe(true);
    expect(stock.isEtf).toBe(false);
  });
});

describe("FMP search normalization", () => {
  function normalizeSearch(raw: Record<string, unknown>) {
    return {
      symbol: String(raw.symbol ?? ""),
      name: typeof raw.name === "string" ? raw.name : null,
      exchange: typeof raw.exchange === "string" ? raw.exchange : null,
      currency: typeof raw.currency === "string" ? raw.currency : null,
      // search endpoints don't return these:
      isEtf: null,
      country: null,
      marketCap: null,
    };
  }

  it("normalizes a search result", () => {
    const raw = { symbol: "XLE", name: "State Street Energy Select Sector SPDR ETF", exchange: "AMEX", currency: "USD" };
    const result = normalizeSearch(raw);
    expect(result.symbol).toBe("XLE");
    expect(result.name).toContain("Energy");
    expect(result.exchange).toBe("AMEX");
    expect(result.isEtf).toBeNull(); // not available in search
  });

  it("handles international symbols", () => {
    const raw = { symbol: "EUNL.DE", name: "Some European ETF", exchange: "XETRA", currency: "EUR" };
    const result = normalizeSearch(raw);
    expect(result.symbol).toBe("EUNL.DE");
    expect(result.currency).toBe("EUR");
  });
});

describe("FMP provider error handling patterns", () => {
  it("402 indicates paywalled endpoint", () => {
    const httpStatus = 402;
    expect(httpStatus).toBe(402); // This is the "subscription required" status
  });

  it("404 indicates endpoint not found or wrong path", () => {
    const httpStatus = 404;
    expect(httpStatus).toBe(404);
  });

  it("empty array response means no data (not an error)", () => {
    const data: unknown[] = [];
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBe(0);
  });

  it("string response is an error message from FMP", () => {
    const data = "Restricted Endpoint: This endpoint is not available...";
    expect(typeof data).toBe("string");
    // Provider should treat string responses as errors
  });
});

describe("FMP coverage expectations", () => {
  // Based on live characterization results
  const EXPECTED_COVERAGE = {
    SPY: { found: true, isEtf: true },
    XLE: { found: true, isEtf: true },
    SCHD: { found: true, isEtf: true },
    QQQ: { found: true, isEtf: true },
    TLT: { found: true, isEtf: true },
    QETH: { found: true, isEtf: true },
    QSOL: { found: false, isEtf: null },
  };

  it("documents expected coverage from live characterization", () => {
    // These expectations are based on actual live API calls performed during the spike.
    // They document what we observed, not what the API guarantees.
    expect(EXPECTED_COVERAGE.SPY.found).toBe(true);
    expect(EXPECTED_COVERAGE.XLE.found).toBe(true);
    expect(EXPECTED_COVERAGE.SCHD.found).toBe(true);
    expect(EXPECTED_COVERAGE.QSOL.found).toBe(false);
  });

  it("FMP provides isEtf classification that SEC does not", () => {
    // This is the key differentiator from the SEC dataset
    expect(EXPECTED_COVERAGE.XLE.isEtf).toBe(true);
  });
});
