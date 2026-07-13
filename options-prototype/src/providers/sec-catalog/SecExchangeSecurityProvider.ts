/**
 * SEC Exchange-Listed Securities Provider.
 *
 * Loads the SEC company_tickers_exchange.json dataset.
 * In development, uses the Vite proxy (/sec-api/) to avoid CORS.
 * Caches the result in module memory for the session.
 */

import type { SecurityCatalogProvider, SecurityCatalogResult, SecSecurityReference } from "./types";

// --- SEC response shape ---

interface SecRawResponse {
  fields: string[];
  data: (string | number | null)[][];
}

// --- Session cache ---

let cachedResult: SecurityCatalogResult | null = null;

// --- URL ---

// Vite proxy rewrites /sec-api/ → https://www.sec.gov/files/
const SEC_URL = "/sec-api/company_tickers_exchange.json";

// --- Provider ---

export class SecExchangeSecurityProvider implements SecurityCatalogProvider {
  name = "SEC Exchange-Listed Securities";

  async loadSecurities(): Promise<SecurityCatalogResult> {
    // Return cached result if available
    if (cachedResult) {
      return cachedResult;
    }

    const start = Date.now();
    const fetchedAt = new Date().toISOString();

    try {
      const response = await fetch(SEC_URL);

      if (!response.ok) {
        const text = await response.text();
        return {
          success: false,
          items: [],
          totalCount: 0,
          durationMs: Date.now() - start,
          error: `HTTP ${response.status}: ${text.slice(0, 200)}`,
          fetchedAt,
        };
      }

      const raw: SecRawResponse = await response.json();
      const items = normalizeSecResponse(raw);

      const result: SecurityCatalogResult = {
        success: true,
        items,
        totalCount: items.length,
        durationMs: Date.now() - start,
        error: null,
        fetchedAt,
      };

      // Cache for session
      cachedResult = result;
      return result;
    } catch (err) {
      return {
        success: false,
        items: [],
        totalCount: 0,
        durationMs: Date.now() - start,
        error: `Network error: ${err instanceof Error ? err.message : "unknown"}`,
        fetchedAt,
      };
    }
  }

  /** Clear the session cache (for explicit refresh) */
  clearCache(): void {
    cachedResult = null;
  }
}

// --- Normalization ---

function normalizeSecResponse(raw: SecRawResponse): SecSecurityReference[] {
  // fields: ["cik", "name", "ticker", "exchange"]
  const fieldMap = new Map(raw.fields.map((f, i) => [f, i]));
  const cikIdx = fieldMap.get("cik") ?? 0;
  const nameIdx = fieldMap.get("name") ?? 1;
  const tickerIdx = fieldMap.get("ticker") ?? 2;
  const exchangeIdx = fieldMap.get("exchange") ?? 3;

  return raw.data.map((row) => ({
    cik: Number(row[cikIdx]) || 0,
    name: String(row[nameIdx] ?? ""),
    ticker: String(row[tickerIdx] ?? ""),
    exchange: row[exchangeIdx] != null ? String(row[exchangeIdx]) : null,
    source: "sec_company_tickers_exchange" as const,
  }));
}
