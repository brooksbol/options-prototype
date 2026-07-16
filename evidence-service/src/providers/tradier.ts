/**
 * Tradier Provider Adapter — Server-side HTTP client with caching and pacing.
 *
 * Owns the credential. Makes upstream calls to Tradier.
 * Normalizes responses into application-owned domain shapes.
 * Never exposes raw Tradier response structure to the API consumer.
 *
 * Efficiency:
 *   - ResponseCache eliminates redundant upstream calls (TTL per evidence type)
 *   - RequestPacer queues upstream calls at ~1/sec (holds, never rejects during normal load)
 *   - Quotes are cached and reused across chain requests
 */

import type { ServiceConfig } from "../config.js";
import { getResponseCache, type ResponseCache } from "../response-cache.js";
import { getRequestPacer, type RequestPacer } from "../request-pacer.js";

// --- Application-owned response types ---

export interface MarketExpiration {
  date: string;
  dte: number;
}

export interface MarketChainUnderlying {
  symbol: string;
  name: string;
  price: number;
}

export interface MarketOptionContract {
  strike: number;
  bid: number;
  ask: number;
  delta: number;
  openInterest: number;
  volume: number;
}

export interface MarketChain {
  symbol: string;
  expiration: string;
  underlying: MarketChainUnderlying;
  puts: MarketOptionContract[];
  calls: MarketOptionContract[];
}

// --- Error types ---

export class ProviderError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
    public readonly retryAfterMs?: number
  ) {
    super(message);
    this.name = "ProviderError";
  }
}

// --- Adapter ---

export class TradierAdapter {
  private apiKey: string;
  private baseUrl: string;
  private cache: ResponseCache;
  private pacer: RequestPacer;

  constructor(config: ServiceConfig) {
    this.apiKey = config.tradierApiKey;
    this.baseUrl = config.tradierBaseUrl;
    this.cache = getResponseCache();
    this.pacer = getRequestPacer();
  }

  async getExpirations(symbol: string): Promise<{ expirations: MarketExpiration[]; retrievedAt: string; cacheHit: boolean }> {
    const cacheKey = symbol.toUpperCase();

    // Check cache
    const cached = this.cache.get<MarketExpiration[]>("expirations", cacheKey);
    if (cached) {
      return { expirations: cached.data, retrievedAt: cached.retrievedAt, cacheHit: true };
    }

    // Validate key before queuing
    if (!this.apiKey) {
      throw new ProviderError("Tradier API key not configured", 503);
    }

    // Fetch via pacer
    const retrievedAt = new Date().toISOString();
    const data = await this.pacer.submit(() => this.fetchExpirations(symbol));

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const dates = data?.expirations?.date;
    const expirations: MarketExpiration[] = (!dates || !Array.isArray(dates)) ? [] :
      dates.map((dateStr: string) => {
        const expDate = new Date(dateStr + "T12:00:00");
        const dte = Math.round((expDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        return { date: dateStr, dte };
      });

    // Store in cache
    this.cache.set("expirations", cacheKey, expirations, retrievedAt);

    return { expirations, retrievedAt, cacheHit: false };
  }

  async getOptionsChain(symbol: string, expiration: string): Promise<{ chain: MarketChain; retrievedAt: string; cacheHit: boolean }> {
    const cacheKey = `${symbol.toUpperCase()}:${expiration}`;

    // Check chain cache
    const cachedChain = this.cache.get<MarketChain>("chain", cacheKey);
    if (cachedChain) {
      return { chain: cachedChain.data, retrievedAt: cachedChain.retrievedAt, cacheHit: true };
    }

    const retrievedAt = new Date().toISOString();

    // Fetch chain via pacer
    const chainData = await this.pacer.submit(() => this.fetchChain(symbol, expiration));

    // Get underlying quote (use cache if available)
    const quoteCacheKey = symbol.toUpperCase();
    let quote = this.cache.get<{ price: number; name: string }>("quote", quoteCacheKey);

    if (!quote) {
      const quoteData = await this.pacer.submit(() => this.fetchQuote(symbol));
      const q = quoteData?.quotes?.quote;
      const price = q?.last ?? q?.close ?? 0;
      const name = q?.description ?? symbol.toUpperCase();
      quote = { data: { price, name }, retrievedAt };
      this.cache.set("quote", quoteCacheKey, { price, name }, retrievedAt);
    }

    // Normalize chain
    const options = chainData?.options?.option;
    const puts: MarketOptionContract[] = [];
    const calls: MarketOptionContract[] = [];

    if (Array.isArray(options)) {
      for (const opt of options) {
        const contract: MarketOptionContract = {
          strike: opt.strike ?? 0,
          bid: opt.bid ?? 0,
          ask: opt.ask ?? 0,
          delta: opt.greeks?.delta ?? 0,
          openInterest: opt.open_interest ?? 0,
          volume: opt.volume ?? 0,
        };
        if (opt.option_type === "put") puts.push(contract);
        else if (opt.option_type === "call") calls.push(contract);
      }
    }

    puts.sort((a, b) => a.strike - b.strike);
    calls.sort((a, b) => a.strike - b.strike);

    const chain: MarketChain = {
      symbol: symbol.toUpperCase(),
      expiration,
      underlying: {
        symbol: symbol.toUpperCase(),
        name: quote.data.name,
        price: quote.data.price,
      },
      puts,
      calls,
    };

    // Store in cache
    this.cache.set("chain", cacheKey, chain, retrievedAt);

    return { chain, retrievedAt, cacheHit: false };
  }

  // --- Private: raw Tradier HTTP calls (go through pacer) ---

  private async fetchExpirations(symbol: string): Promise<Record<string, any>> {
    const url = new URL(`${this.baseUrl}/markets/options/expirations`);
    url.searchParams.set("symbol", symbol.toUpperCase());
    url.searchParams.set("includeAllRoots", "true");
    return this.httpRequest(url);
  }

  private async fetchChain(symbol: string, expiration: string): Promise<Record<string, any>> {
    const url = new URL(`${this.baseUrl}/markets/options/chains`);
    url.searchParams.set("symbol", symbol.toUpperCase());
    url.searchParams.set("expiration", expiration);
    url.searchParams.set("greeks", "true");
    return this.httpRequest(url);
  }

  private async fetchQuote(symbol: string): Promise<Record<string, any>> {
    const url = new URL(`${this.baseUrl}/markets/quotes`);
    url.searchParams.set("symbols", symbol.toUpperCase());
    return this.httpRequest(url);
  }

  private async httpRequest(url: URL): Promise<Record<string, any>> {
    if (!this.apiKey) {
      throw new ProviderError("Tradier API key not configured", 503);
    }

    const response = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        Accept: "application/json",
      },
    });

    if (response.status === 429) {
      throw new ProviderError("Rate limited by Tradier", 429, 60000);
    }

    if (!response.ok) {
      throw new ProviderError(
        `Tradier returned ${response.status}: ${response.statusText}`,
        response.status
      );
    }

    return await response.json() as Record<string, any>;
  }
}
