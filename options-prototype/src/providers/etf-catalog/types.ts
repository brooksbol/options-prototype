/**
 * ETF Catalog Provider — domain types.
 *
 * Permissive canonical model that preserves unknown provider fields.
 * Maps only what is present and exposes missing-field diagnostics.
 */

// --- Canonical ETF Reference ---

export interface EtfReference {
  symbol: string;
  name: string | null;
  price: number | null;
  aum: number | null;
  category: string | null;
  issuer: string | null;
  expenseRatio: number | null;
  leveraged: boolean | null;
  inverse: boolean | null;
  country: string | null;
  isin: string | null;
  numHoldings: number | null;
  source: "api_ninjas" | "mock";
  /** Raw provider response — preserved for inspection */
  raw: unknown;
}

// --- Query Types ---

export interface EtfLookupQuery {
  type: "lookup";
  ticker: string;
}

export interface EtfListQuery {
  type: "list";
  offset: number;
}

export interface EtfSearchQuery {
  type: "search";
  minAum?: number;
  maxAum?: number;
  minExpenseRatio?: number;
  maxExpenseRatio?: number;
  holdings?: string[];
  country?: string;
  offset?: number;
}

export type EtfCatalogQuery = EtfLookupQuery | EtfListQuery | EtfSearchQuery;

// --- Result Types ---

export interface EtfCatalogResult {
  success: boolean;
  query: EtfCatalogQuery;
  items: EtfReference[];
  /** Total items returned in this response */
  count: number;
  /** Whether more results may be available (pagination) */
  hasMore: boolean;
  /** Request duration in ms */
  durationMs: number;
  /** Error message if failed */
  error: string | null;
  /** HTTP status code */
  httpStatus: number | null;
  /** Any quota/rate-limit info from response headers */
  rateLimitInfo: RateLimitInfo | null;
  /** Field coverage: which canonical fields were populated across results */
  fieldCoverage: FieldCoverage;
}

export interface RateLimitInfo {
  remaining: number | null;
  limit: number | null;
  reset: string | null;
}

export interface FieldCoverage {
  total: number;
  populated: Record<string, number>;
  missing: Record<string, number>;
}

// --- Provider Interface ---

export interface EtfCatalogProvider {
  /** Provider name for display */
  name: string;

  /** Whether the provider is configured (API key present, etc.) */
  isConfigured(): boolean;

  /** Execute a catalog query */
  search(query: EtfCatalogQuery): Promise<EtfCatalogResult>;
}
