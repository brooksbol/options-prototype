/**
 * Mock ETF Catalog Provider.
 *
 * Returns static fixture data for testing the Explorer UI
 * without API calls.
 */

import type { EtfCatalogProvider, EtfCatalogQuery, EtfCatalogResult, EtfReference } from "./types";

const MOCK_ETFS: EtfReference[] = [
  { symbol: "SPY", name: "SPDR S&P 500 ETF Trust", price: 751.37, aum: 762117890000, category: "Large Cap Blend", issuer: "State Street", expenseRatio: 0.09, leveraged: false, inverse: false, country: "US", isin: "US78462F1030", numHoldings: 504, source: "mock", raw: {} },
  { symbol: "QQQ", name: "Invesco QQQ Trust", price: 525.80, aum: 305184502800, category: "Large Cap Growth", issuer: "Invesco", expenseRatio: 0.20, leveraged: false, inverse: false, country: "US", isin: "US46090E1038", numHoldings: 101, source: "mock", raw: {} },
  { symbol: "XLE", name: "Energy Select Sector SPDR Fund", price: 54.86, aum: 26500000000, category: "Energy", issuer: "State Street", expenseRatio: 0.09, leveraged: false, inverse: false, country: "US", isin: null, numHoldings: 23, source: "mock", raw: {} },
  { symbol: "XLF", name: "Financial Select Sector SPDR Fund", price: 55.55, aum: 45200000000, category: "Financials", issuer: "State Street", expenseRatio: 0.09, leveraged: false, inverse: false, country: "US", isin: null, numHoldings: 72, source: "mock", raw: {} },
  { symbol: "XLU", name: "Utilities Select Sector SPDR Fund", price: 45.26, aum: 16800000000, category: "Utilities", issuer: "State Street", expenseRatio: 0.09, leveraged: false, inverse: false, country: "US", isin: null, numHoldings: 31, source: "mock", raw: {} },
  { symbol: "TQQQ", name: "ProShares UltraPro QQQ", price: 82.50, aum: 24000000000, category: "Trading--Leveraged Equity", issuer: "ProShares", expenseRatio: 0.88, leveraged: true, inverse: false, country: "US", isin: null, numHoldings: null, source: "mock", raw: {} },
  { symbol: "SQQQ", name: "ProShares UltraPro Short QQQ", price: 8.20, aum: 5600000000, category: "Trading--Inverse Equity", issuer: "ProShares", expenseRatio: 0.95, leveraged: true, inverse: true, country: "US", isin: null, numHoldings: null, source: "mock", raw: {} },
];

function computeFieldCoverage(items: EtfReference[]) {
  const fields = ["name", "price", "aum", "category", "issuer", "expenseRatio", "leveraged", "inverse", "country", "isin", "numHoldings"] as const;
  const populated: Record<string, number> = {};
  const missing: Record<string, number> = {};

  for (const field of fields) {
    populated[field] = 0;
    missing[field] = 0;
    for (const item of items) {
      if (item[field] != null) populated[field]++;
      else missing[field]++;
    }
  }

  return { total: items.length, populated, missing };
}

export class MockEtfCatalogProvider implements EtfCatalogProvider {
  name = "Mock ETF Catalog";

  isConfigured(): boolean {
    return true;
  }

  async search(query: EtfCatalogQuery): Promise<EtfCatalogResult> {
    const start = Date.now();

    // Simulate small delay
    await new Promise((r) => setTimeout(r, 50));

    let items: EtfReference[];

    if (query.type === "lookup") {
      const found = MOCK_ETFS.filter((e) => e.symbol.toUpperCase() === query.ticker.toUpperCase());
      items = found;
    } else if (query.type === "list") {
      items = MOCK_ETFS.slice(query.offset, query.offset + 1000);
    } else {
      // search — filter by available criteria
      items = MOCK_ETFS.filter((e) => {
        if (query.minAum && (e.aum == null || e.aum < query.minAum)) return false;
        if (query.maxAum && (e.aum == null || e.aum > query.maxAum)) return false;
        if (query.country && e.country !== query.country) return false;
        return true;
      });
    }

    return {
      success: true,
      query,
      items,
      count: items.length,
      hasMore: false,
      durationMs: Date.now() - start,
      error: null,
      httpStatus: 200,
      rateLimitInfo: null,
      fieldCoverage: computeFieldCoverage(items),
    };
  }
}
