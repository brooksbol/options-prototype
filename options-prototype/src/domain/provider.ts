/**
 * MarketDataProvider interface definition.
 *
 * All data sources — mock, delayed, real-time — must implement this interface.
 * The interface returns canonical domain types. No vendor schemas leak past
 * this boundary.
 *
 * Design decisions:
 *   - Asynchronous from the beginning (Promise-based).
 *   - Mock provider uses Promise.resolve() for consistency.
 *   - All returned OptionContracts must have `type` populated ("CALL" | "PUT").
 *   - DTE is computed by the provider, not stored in raw data.
 *   - expirationDate parameter is an ISO date string (e.g., "2025-07-18").
 *
 * Reference: docs/04-architecture.md (MarketDataProvider Interface)
 * Reference: docs/05-design.md (MarketDataProvider Interface)
 * Reference: docs/02-domain.md (ADR-004)
 */

import type { Underlying, Expiration, OptionsChain } from "./types";

/** Cache statistics for observability in lab instruments. */
export interface CacheStats {
  hits: number;
  misses: number;
  size: number;
  /** Total API calls made (local counter, always reliable). */
  apiCalls: number;
  /** Tradier X-Ratelimit-Used (from most recent API response). Null if CORS blocks it. */
  rateLimitUsed: number | null;
  /** Tradier X-Ratelimit-Available (from most recent API response). Null if CORS blocks it. */
  rateLimitAvailable: number | null;
  /** Tradier X-Ratelimit-Allowed (from most recent API response). Null if CORS blocks it. */
  rateLimitAllowed: number | null;
}

export interface MarketDataProvider {
  /**
   * Return all available underlyings (ETFs).
   */
  getUnderlyings(): Promise<Underlying[]>;

  /**
   * Batch quote lookup for multiple symbols.
   * Returns a map of symbol → price.
   *
   * This aligns with APIs that support multi-symbol quote requests
   * (e.g., Tradier /markets/quotes?symbols=XLE,XLF,...).
   *
   * Used by broad-scan instruments (Opportunity Lab) to pre-warm the
   * quote cache in a single API call rather than N individual calls.
   * Populates the same cache entries used by getOptionsChain().
   */
  getQuotes(symbols: string[]): Promise<Map<string, number>>;

  /**
   * Return available expirations for a given underlying symbol.
   * Each Expiration includes a dynamically-computed DTE.
   */
  getExpirations(symbol: string): Promise<Expiration[]>;

  /**
   * Return the full options chain (calls + puts) for a given
   * underlying symbol and expiration date.
   *
   * All returned OptionContracts have `type` set to "CALL" or "PUT".
   */
  getOptionsChain(symbol: string, expirationDate: string): Promise<OptionsChain>;

  /**
   * Return cache hit/miss statistics.
   * Used by lab instruments for observability.
   * Providers without caching return zeros.
   */
  getCacheStats(): CacheStats;
}
