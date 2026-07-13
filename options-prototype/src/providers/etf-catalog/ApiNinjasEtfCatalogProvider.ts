/**
 * API Ninjas ETF Catalog Provider.
 *
 * Implements EtfCatalogProvider using the API Ninjas ETF endpoints:
 *   - /v1/etf?ticker=XXX       (single lookup, free tier)
 *   - /v1/etflist?offset=N     (enumerate all, Business+ only)
 *   - /v1/etfsearch?filters    (filtered search, Business+ only)
 *
 * Security: API key comes from VITE_API_NINJAS_KEY env variable.
 * This is acceptable for a local Vite prototype but must move server-side
 * before cloud deployment (VITE-prefixed vars are exposed to browser code).
 */

import type {
  EtfCatalogProvider,
  EtfCatalogQuery,
  EtfCatalogResult,
  EtfReference,
  RateLimitInfo,
  FieldCoverage,
} from "./types";

// --- Configuration ---

const API_BASE = "https://api.api-ninjas.com/v1";

function getApiKey(): string | null {
  return import.meta.env.VITE_API_NINJAS_KEY ?? null;
}

// --- Leveraged / Inverse inference from name ---

function inferLeveraged(name: string | null): boolean | null {
  if (!name) return null;
  const upper = name.toUpperCase();
  if (upper.includes("ULTRAPRO") || upper.includes("2X") || upper.includes("3X") || upper.includes("ULTRA")) return true;
  if (upper.includes("LEVERAGED")) return true;
  return false;
}

function inferInverse(name: string | null): boolean | null {
  if (!name) return null;
  const upper = name.toUpperCase();
  if (upper.includes("SHORT") || upper.includes("INVERSE") || upper.includes("BEAR")) return true;
  return false;
}

// --- Field coverage computation ---

function computeFieldCoverage(items: EtfReference[]): FieldCoverage {
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

// --- Response normalization ---

/**
 * Normalize a /v1/etf response (single ETF detail).
 * Note: Free tier returns "This data is for premium users only." for premium fields.
 */
function normalizeEtfDetail(raw: Record<string, unknown>): EtfReference {
  const name = (raw.etf_name as string) ?? null;
  return {
    symbol: (raw.etf_ticker as string) ?? "",
    name,
    price: typeof raw.price === "number" ? raw.price : null,
    aum: typeof raw.aum === "number" ? raw.aum : null,
    category: null, // API Ninjas does not provide category
    issuer: null,   // API Ninjas does not provide issuer
    expenseRatio: typeof raw.expense_ratio === "number" ? raw.expense_ratio : null,
    leveraged: inferLeveraged(name),
    inverse: inferInverse(name),
    country: typeof raw.country === "string" ? raw.country : null,
    isin: typeof raw.isin === "string" ? raw.isin : null,
    numHoldings: typeof raw.num_holdings === "number" ? raw.num_holdings : null,
    source: "api_ninjas",
    raw,
  };
}

/**
 * Normalize a /v1/etfsearch response item.
 */
function normalizeSearchItem(raw: Record<string, unknown>): EtfReference {
  const name = (raw.name as string) ?? null;
  return {
    symbol: (raw.symbol as string) ?? "",
    name,
    price: null, // search endpoint does not return price
    aum: typeof raw.aum === "number" ? raw.aum : null,
    category: null,
    issuer: null,
    expenseRatio: typeof raw.expense_ratio === "number" ? raw.expense_ratio : null,
    leveraged: inferLeveraged(name),
    inverse: inferInverse(name),
    country: typeof raw.country === "string" ? raw.country : null,
    isin: null, // search endpoint does not return ISIN
    numHoldings: typeof raw.num_holdings === "number" ? raw.num_holdings : null,
    source: "api_ninjas",
    raw,
  };
}

/**
 * Normalize a /v1/etflist response item (just a ticker string).
 */
function normalizeListItem(ticker: string): EtfReference {
  return {
    symbol: ticker,
    name: null,
    price: null,
    aum: null,
    category: null,
    issuer: null,
    expenseRatio: null,
    leveraged: null,
    inverse: null,
    country: null,
    isin: null,
    numHoldings: null,
    source: "api_ninjas",
    raw: ticker,
  };
}

// --- Rate limit extraction ---

function extractRateLimitInfo(headers: Headers): RateLimitInfo | null {
  const remaining = headers.get("X-RateLimit-Remaining") ?? headers.get("x-ratelimit-remaining");
  const limit = headers.get("X-RateLimit-Limit") ?? headers.get("x-ratelimit-limit");
  const reset = headers.get("X-RateLimit-Reset") ?? headers.get("x-ratelimit-reset");

  if (!remaining && !limit && !reset) return null;

  return {
    remaining: remaining ? parseInt(remaining, 10) : null,
    limit: limit ? parseInt(limit, 10) : null,
    reset: reset ?? null,
  };
}

// --- Provider Implementation ---

export class ApiNinjasEtfCatalogProvider implements EtfCatalogProvider {
  name = "API Ninjas ETF";

  isConfigured(): boolean {
    return !!getApiKey();
  }

  async search(query: EtfCatalogQuery): Promise<EtfCatalogResult> {
    const apiKey = getApiKey();
    if (!apiKey) {
      return {
        success: false,
        query,
        items: [],
        count: 0,
        hasMore: false,
        durationMs: 0,
        error: "API key not configured. Set VITE_API_NINJAS_KEY in .env.local",
        httpStatus: null,
        rateLimitInfo: null,
        fieldCoverage: { total: 0, populated: {}, missing: {} },
      };
    }

    const start = Date.now();

    try {
      let url: string;
      let normalizer: "detail" | "search" | "list";

      switch (query.type) {
        case "lookup":
          url = `${API_BASE}/etf?ticker=${encodeURIComponent(query.ticker)}`;
          normalizer = "detail";
          break;
        case "list":
          url = `${API_BASE}/etflist?offset=${query.offset}`;
          normalizer = "list";
          break;
        case "search": {
          const params = new URLSearchParams();
          if (query.minAum) params.set("min_aum", String(query.minAum));
          if (query.maxAum) params.set("max_aum", String(query.maxAum));
          if (query.minExpenseRatio) params.set("min_expense_ratio", String(query.minExpenseRatio));
          if (query.maxExpenseRatio) params.set("max_expense_ratio", String(query.maxExpenseRatio));
          if (query.holdings?.length) params.set("holdings", query.holdings.join(","));
          if (query.country) params.set("country", query.country);
          if (query.offset) params.set("offset", String(query.offset));
          url = `${API_BASE}/etfsearch?${params.toString()}`;
          normalizer = "search";
          break;
        }
      }

      const response = await fetch(url, {
        headers: {
          "X-Api-Key": apiKey,
          Accept: "application/json",
        },
      });

      const durationMs = Date.now() - start;
      const rateLimitInfo = extractRateLimitInfo(response.headers);

      if (!response.ok) {
        const errorText = await response.text();
        return {
          success: false,
          query,
          items: [],
          count: 0,
          hasMore: false,
          durationMs,
          error: `HTTP ${response.status}: ${errorText.slice(0, 200)}`,
          httpStatus: response.status,
          rateLimitInfo,
          fieldCoverage: { total: 0, populated: {}, missing: {} },
        };
      }

      const data = await response.json();
      let items: EtfReference[];
      let hasMore = false;

      switch (normalizer) {
        case "detail":
          // /v1/etf returns a single object (or empty {} for invalid tickers)
          if (data && typeof data === "object" && !Array.isArray(data) && data.etf_ticker) {
            items = [normalizeEtfDetail(data)];
          } else if (data && typeof data === "object" && data.error) {
            // Endpoint returned an error message (e.g., subscription restriction)
            return {
              success: false,
              query,
              items: [],
              count: 0,
              hasMore: false,
              durationMs: Date.now() - start,
              error: String(data.error),
              httpStatus: response.status,
              rateLimitInfo,
              fieldCoverage: { total: 0, populated: {}, missing: {} },
            };
          } else {
            items = [];
          }
          break;

        case "list":
          // /v1/etflist returns an array of ticker strings (or error object for wrong tier)
          if (Array.isArray(data)) {
            items = data.map((ticker: string) => normalizeListItem(ticker));
            hasMore = data.length >= 1000;
          } else if (data && typeof data === "object" && data.error) {
            return {
              success: false, query, items: [], count: 0, hasMore: false,
              durationMs: Date.now() - start, error: String(data.error),
              httpStatus: response.status, rateLimitInfo,
              fieldCoverage: { total: 0, populated: {}, missing: {} },
            };
          } else {
            items = [];
          }
          break;

        case "search":
          // /v1/etfsearch returns an array of objects (or error object for wrong tier)
          if (Array.isArray(data)) {
            items = data.map((item: Record<string, unknown>) => normalizeSearchItem(item));
            hasMore = data.length >= 50;
          } else if (data && typeof data === "object" && data.error) {
            return {
              success: false, query, items: [], count: 0, hasMore: false,
              durationMs: Date.now() - start, error: String(data.error),
              httpStatus: response.status, rateLimitInfo,
              fieldCoverage: { total: 0, populated: {}, missing: {} },
            };
          } else {
            items = [];
          }
          break;
      }

      return {
        success: true,
        query,
        items,
        count: items.length,
        hasMore,
        durationMs,
        error: null,
        httpStatus: response.status,
        rateLimitInfo,
        fieldCoverage: computeFieldCoverage(items),
      };
    } catch (err) {
      return {
        success: false,
        query,
        items: [],
        count: 0,
        hasMore: false,
        durationMs: Date.now() - start,
        error: `Network error: ${err instanceof Error ? err.message : "unknown"}`,
        httpStatus: null,
        rateLimitInfo: null,
        fieldCoverage: { total: 0, populated: {}, missing: {} },
      };
    }
  }
}
