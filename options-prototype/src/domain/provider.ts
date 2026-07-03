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

export interface MarketDataProvider {
  /**
   * Return all available underlyings (ETFs).
   */
  getUnderlyings(): Promise<Underlying[]>;

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
}
