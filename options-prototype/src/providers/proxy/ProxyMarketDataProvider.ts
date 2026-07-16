/**
 * Proxy Market Data Provider — calls the Evidence Service backend instead of Tradier directly.
 *
 * The browser communicates only with the application backend.
 * Provider credentials and Tradier-specific transport details are hidden behind this boundary.
 */

import type { MarketDataProvider } from "../../domain/provider";
import type { Underlying, Expiration, OptionsChain } from "../../domain/types";

const SUPPORTED_UNDERLYINGS: Underlying[] = [];

export class ProxyMarketDataProvider implements MarketDataProvider {
  private baseUrl: string;

  constructor(baseUrl: string = "/api/market") {
    this.baseUrl = baseUrl;
  }

  async getUnderlyings(): Promise<Underlying[]> {
    return SUPPORTED_UNDERLYINGS;
  }

  async getQuotes(_symbols: string[]): Promise<Map<string, number>> {
    // Quotes are not needed for the primary acquisition path.
    // Return empty map — quote data comes from chain responses.
    return new Map();
  }

  getCacheStats(): { hits: number; misses: number; size: number; apiCalls: number; rateLimitUsed: number | null; rateLimitAvailable: number | null; rateLimitAllowed: number | null } {
    return { hits: 0, misses: 0, size: 0, apiCalls: 0, rateLimitUsed: null, rateLimitAvailable: null, rateLimitAllowed: null };
  }

  async getExpirations(symbol: string): Promise<Expiration[]> {
    const url = `${this.baseUrl}/expirations?symbol=${encodeURIComponent(symbol)}`;
    const res = await fetch(url);

    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: "Unknown error" }));
      throw new Error(`Evidence service error (${res.status}): ${err.message ?? "expirations fetch failed"}`);
    }

    const data = await res.json();
    return (data.expirations ?? []) as Expiration[];
  }

  async getOptionsChain(symbol: string, expiration: string): Promise<OptionsChain> {
    const url = `${this.baseUrl}/chain?symbol=${encodeURIComponent(symbol)}&expiration=${encodeURIComponent(expiration)}`;
    const res = await fetch(url);

    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: "Unknown error" }));
      throw new Error(`Evidence service error (${res.status}): ${err.message ?? "chain fetch failed"}`);
    }

    const data = await res.json();

    // Map to the OptionsChain domain type expected by the frontend
    return {
      underlying: data.underlying,
      expiration: { date: data.expiration, dte: computeDte(data.expiration) },
      puts: data.puts ?? [],
      calls: data.calls ?? [],
      dataQuality: {
        greeksAvailable: (data.puts ?? []).some((p: { delta: number }) => p.delta !== 0),
        dataSource: "api",
      },
    };
  }
}

function computeDte(expirationDate: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const exp = new Date(expirationDate + "T12:00:00");
  return Math.round((exp.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}
