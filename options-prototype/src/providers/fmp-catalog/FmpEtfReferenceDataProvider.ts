/**
 * Financial Modeling Prep — ETF Reference Data Provider.
 *
 * Available on current plan:
 *   - /stable/profile?symbol=X       (single-symbol profile with isEtf flag)
 *   - /stable/search-name?query=X    (search by name, returns basic info)
 *   - /stable/search-symbol?query=X  (search by symbol prefix)
 *
 * Paywalled (402):
 *   - /stable/etf-list              (full ETF enumeration)
 *   - /stable/available-exchanges   (exchange list)
 *
 * Not available / 404:
 *   - ETF-specific enrichment endpoints (holdings, sector-weightings, etc.)
 *   - Batch profile (comma-separated symbols)
 *   - Legacy v3 endpoints (deprecated)
 *
 * Security: API key from VITE_FMP_API_KEY. Must move server-side before cloud.
 */

import type { EtfReferenceDataProvider, FmpEtfCatalogEntry, FmpSearchResult } from "./types";

// --- Config ---

const API_BASE = "https://financialmodelingprep.com/stable";

function getApiKey(): string | null {
  return import.meta.env.VITE_FMP_API_KEY ?? null;
}

// --- Normalization ---

function normalizeProfile(raw: Record<string, unknown>): FmpEtfCatalogEntry {
  return {
    symbol: String(raw.symbol ?? ""),
    name: typeof raw.companyName === "string" ? raw.companyName : null,
    exchange: typeof raw.exchange === "string" ? raw.exchange : null,
    exchangeFullName: typeof raw.exchangeFullName === "string" ? raw.exchangeFullName : null,
    country: typeof raw.country === "string" ? raw.country : null,
    currency: typeof raw.currency === "string" ? raw.currency : null,
    isEtf: typeof raw.isEtf === "boolean" ? raw.isEtf : null,
    isFund: typeof raw.isFund === "boolean" ? raw.isFund : null,
    isActivelyTrading: typeof raw.isActivelyTrading === "boolean" ? raw.isActivelyTrading : null,
    isAdr: typeof raw.isAdr === "boolean" ? raw.isAdr : null,
    industry: typeof raw.industry === "string" ? raw.industry : null,
    sector: typeof raw.sector === "string" ? raw.sector : null,
    marketCap: typeof raw.marketCap === "number" ? raw.marketCap : null,
    price: typeof raw.price === "number" ? raw.price : null,
    beta: typeof raw.beta === "number" ? raw.beta : null,
    isin: typeof raw.isin === "string" ? raw.isin : null,
    cusip: typeof raw.cusip === "string" ? raw.cusip : null,
    cik: typeof raw.cik === "string" ? raw.cik : null,
    ipoDate: typeof raw.ipoDate === "string" ? raw.ipoDate : null,
    description: typeof raw.description === "string" ? raw.description : null,
    source: "fmp",
    raw,
  };
}

function normalizeSearchItem(raw: Record<string, unknown>): FmpEtfCatalogEntry {
  return {
    symbol: String(raw.symbol ?? ""),
    name: typeof raw.name === "string" ? raw.name : null,
    exchange: typeof raw.exchange === "string" ? raw.exchange : null,
    exchangeFullName: typeof raw.exchangeFullName === "string" ? raw.exchangeFullName : null,
    country: null,
    currency: typeof raw.currency === "string" ? raw.currency : null,
    isEtf: null, // search endpoints don't return isEtf
    isFund: null,
    isActivelyTrading: null,
    isAdr: null,
    industry: null,
    sector: null,
    marketCap: null,
    price: null,
    beta: null,
    isin: null,
    cusip: null,
    cik: null,
    ipoDate: null,
    description: null,
    source: "fmp",
    raw,
  };
}

// --- Provider ---

export class FmpEtfReferenceDataProvider implements EtfReferenceDataProvider {
  name = "Financial Modeling Prep";

  isConfigured(): boolean {
    return !!getApiKey();
  }

  async searchByName(query: string): Promise<FmpSearchResult> {
    return this.fetchEndpoint(
      `/search-name?query=${encodeURIComponent(query)}`,
      "search",
      "search-name"
    );
  }

  async searchBySymbol(query: string): Promise<FmpSearchResult> {
    return this.fetchEndpoint(
      `/search-symbol?query=${encodeURIComponent(query)}`,
      "search",
      "search-symbol"
    );
  }

  async getProfile(symbol: string): Promise<FmpSearchResult> {
    return this.fetchEndpoint(
      `/profile?symbol=${encodeURIComponent(symbol)}`,
      "profile",
      "profile"
    );
  }

  private async fetchEndpoint(
    path: string,
    normalizer: "profile" | "search",
    endpointName: string
  ): Promise<FmpSearchResult> {
    const apiKey = getApiKey();
    if (!apiKey) {
      return {
        success: false, items: [], count: 0, durationMs: 0,
        error: "API key not configured. Set VITE_FMP_API_KEY in .env.local",
        httpStatus: null, endpoint: endpointName,
      };
    }

    const start = Date.now();
    const separator = path.includes("?") ? "&" : "?";
    const url = `${API_BASE}${path}${separator}apikey=${apiKey}`;

    try {
      const response = await fetch(url);
      const durationMs = Date.now() - start;

      if (!response.ok) {
        const text = await response.text();
        return {
          success: false, items: [], count: 0, durationMs,
          error: `HTTP ${response.status}: ${text.slice(0, 200)}`,
          httpStatus: response.status, endpoint: endpointName,
        };
      }

      const data = await response.json();

      // Handle string error responses (FMP returns plain text errors sometimes)
      if (typeof data === "string") {
        return {
          success: false, items: [], count: 0, durationMs,
          error: data.slice(0, 200),
          httpStatus: response.status, endpoint: endpointName,
        };
      }

      let items: FmpEtfCatalogEntry[];
      if (Array.isArray(data)) {
        items = data.map((item: Record<string, unknown>) =>
          normalizer === "profile" ? normalizeProfile(item) : normalizeSearchItem(item)
        );
      } else if (data && typeof data === "object" && data.symbol) {
        items = [normalizeProfile(data as Record<string, unknown>)];
      } else {
        items = [];
      }

      return {
        success: true, items, count: items.length, durationMs,
        error: null, httpStatus: response.status, endpoint: endpointName,
      };
    } catch (err) {
      return {
        success: false, items: [], count: 0, durationMs: Date.now() - start,
        error: `Network error: ${err instanceof Error ? err.message : "unknown"}`,
        httpStatus: null, endpoint: endpointName,
      };
    }
  }
}
