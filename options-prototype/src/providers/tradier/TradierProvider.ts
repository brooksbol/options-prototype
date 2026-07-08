/**
 * TradierProvider — implements MarketDataProvider using the Tradier Sandbox API.
 *
 * Features:
 *   - TTL-based response cache (60s default) to reduce API calls during experimentation
 *   - Cache keyed by request shape (endpoint + params)
 *   - Only successful responses are cached
 *   - Manual refresh bypasses cache
 *   - DataQuality metadata includes source (api/cache) and age
 *   - Handles Tradier's XML-to-JSON array/object quirk
 *   - Greeks may be null in sandbox — delta defaults to 0 when unavailable
 */

import type { MarketDataProvider } from "../../domain/provider";
import type {
  Underlying,
  Expiration,
  OptionContract,
  OptionsChain,
  DataQuality,
} from "../../domain/types";
import type { TradierConfig } from "../../config/tradier";

// --- Cache ---

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const DEFAULT_TTL_MS = 60 * 1000; // 60 seconds

export class ResponseCache {
  private store = new Map<string, CacheEntry<unknown>>();
  private ttlMs: number;

  constructor(ttlMs: number = DEFAULT_TTL_MS) {
    this.ttlMs = ttlMs;
  }

  get<T>(key: string): { data: T; ageMs: number } | null {
    const entry = this.store.get(key);
    if (!entry) return null;

    const ageMs = Date.now() - entry.timestamp;
    if (ageMs > this.ttlMs) {
      this.store.delete(key);
      return null;
    }

    return { data: entry.data as T, ageMs };
  }

  set<T>(key: string, data: T): void {
    this.store.set(key, { data, timestamp: Date.now() });
  }

  invalidate(keyPrefix?: string): void {
    if (!keyPrefix) {
      this.store.clear();
      return;
    }
    for (const key of this.store.keys()) {
      if (key.startsWith(keyPrefix)) {
        this.store.delete(key);
      }
    }
  }

  get size(): number {
    return this.store.size;
  }
}

// --- Configuration ---

const SUPPORTED_UNDERLYINGS: Omit<Underlying, "price">[] = [
  { symbol: "SPY", name: "SPDR S&P 500 ETF Trust" },
  { symbol: "QQQ", name: "Invesco QQQ Trust" },
  { symbol: "IWM", name: "iShares Russell 2000 ETF" },
  { symbol: "XLE", name: "Energy Select Sector SPDR Fund" },
];

// --- Tradier Response Types (internal only) ---

interface TradierQuote {
  symbol: string;
  description?: string;
  type?: string;
  last?: number;
  bid?: number;
  ask?: number;
  volume?: number;
  open_interest?: number;
  strike?: number;
  underlying?: string;
  option_type?: "call" | "put";
  expiration_date?: string;
  greeks?: TradierGreeks | null;
}

interface TradierGreeks {
  delta?: number | null;
  gamma?: number | null;
  theta?: number | null;
  vega?: number | null;
  rho?: number | null;
  phi?: number | null;
  bid_iv?: number | null;
  mid_iv?: number | null;
  ask_iv?: number | null;
  smv_vol?: number | null;
  updated_at?: string | null;
}

interface TradierQuotesResponse {
  quotes?: {
    quote?: TradierQuote | TradierQuote[];
  };
}

interface TradierExpirationsResponse {
  expirations?: {
    date?: string | string[];
  };
}

interface TradierChainsResponse {
  options?: {
    option?: TradierQuote | TradierQuote[];
  };
}

// --- Utilities ---

function ensureArray<T>(value: T | T[] | undefined | null): T[] {
  if (value === undefined || value === null) return [];
  if (Array.isArray(value)) return value;
  return [value];
}

function computeDte(expirationDate: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expDate = new Date(expirationDate + "T00:00:00");
  const diffMs = expDate.getTime() - today.getTime();
  return Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
}

// --- Provider Implementation ---

export class TradierProvider implements MarketDataProvider {
  private config: TradierConfig;
  private cache: ResponseCache;

  constructor(config: TradierConfig, ttlMs?: number) {
    this.config = config;
    this.cache = new ResponseCache(ttlMs);
  }

  /**
   * Invalidate all cached data, or data for a specific symbol/expiration.
   * Call this to force fresh API requests on next access.
   */
  refresh(symbol?: string, expirationDate?: string): void {
    if (symbol && expirationDate) {
      this.cache.invalidate(`chain:${symbol.toUpperCase()}:${expirationDate}`);
      this.cache.invalidate(`quotes:${symbol.toUpperCase()}`);
    } else if (symbol) {
      this.cache.invalidate(symbol.toUpperCase());
      this.cache.invalidate(`quotes`);
      this.cache.invalidate(`expirations:${symbol.toUpperCase()}`);
    } else {
      this.cache.invalidate();
    }
  }

  private async fetchJson<T>(path: string, params?: Record<string, string>): Promise<T> {
    const url = new URL(`${this.config.baseUrl}${path}`);
    if (params) {
      for (const [key, val] of Object.entries(params)) {
        url.searchParams.set(key, val);
      }
    }

    const response = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${this.config.apiKey}`,
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(
        `Tradier API error ${response.status}: ${text.slice(0, 200)}`
      );
    }

    return response.json();
  }

  private async cachedFetch<T>(cacheKey: string, fetcher: () => Promise<T>): Promise<{ data: T; fromCache: boolean; ageMs: number }> {
    const cached = this.cache.get<T>(cacheKey);
    if (cached) {
      return { data: cached.data, fromCache: true, ageMs: cached.ageMs };
    }

    const data = await fetcher();
    this.cache.set(cacheKey, data);
    return { data, fromCache: false, ageMs: 0 };
  }

  async getUnderlyings(): Promise<Underlying[]> {
    const symbols = SUPPORTED_UNDERLYINGS.map((u) => u.symbol).join(",");
    const cacheKey = `quotes:${symbols}`;

    try {
      const { data } = await this.cachedFetch(cacheKey, () =>
        this.fetchJson<TradierQuotesResponse>("/markets/quotes", { symbols, greeks: "false" })
      );

      const quotes = ensureArray(data.quotes?.quote);
      const priceMap = new Map<string, number>();
      for (const q of quotes) {
        if (q.symbol && q.last != null) {
          priceMap.set(q.symbol, q.last);
        }
      }

      return SUPPORTED_UNDERLYINGS.map((u) => ({
        ...u,
        price: priceMap.get(u.symbol) ?? 0,
      }));
    } catch (err) {
      console.error("TradierProvider.getUnderlyings failed:", err);
      return SUPPORTED_UNDERLYINGS.map((u) => ({ ...u, price: 0 }));
    }
  }

  async getExpirations(symbol: string): Promise<Expiration[]> {
    const upperSymbol = symbol.toUpperCase();
    const cacheKey = `expirations:${upperSymbol}`;

    try {
      const { data } = await this.cachedFetch(cacheKey, () =>
        this.fetchJson<TradierExpirationsResponse>("/markets/options/expirations", { symbol: upperSymbol })
      );

      const dates = ensureArray(data.expirations?.date);
      return dates.map((date) => ({ date, dte: computeDte(date) }));
    } catch (err) {
      console.error(`TradierProvider.getExpirations(${symbol}) failed:`, err);
      return [];
    }
  }

  async getOptionsChain(
    symbol: string,
    expirationDate: string
  ): Promise<OptionsChain> {
    const upperSymbol = symbol.toUpperCase();
    const chainCacheKey = `chain:${upperSymbol}:${expirationDate}`;
    const quoteCacheKey = `quotes:${upperSymbol}`;

    try {
      // Fetch chain and quote (both potentially cached)
      const [chainResult, quoteResult] = await Promise.all([
        this.cachedFetch(chainCacheKey, () =>
          this.fetchJson<TradierChainsResponse>("/markets/options/chains", {
            symbol: upperSymbol,
            expiration: expirationDate,
            greeks: "true",
          })
        ),
        this.cachedFetch(quoteCacheKey, () =>
          this.fetchJson<TradierQuotesResponse>("/markets/quotes", {
            symbols: upperSymbol,
            greeks: "false",
          })
        ),
      ]);

      // Extract underlying price
      const quotes = ensureArray(quoteResult.data.quotes?.quote);
      const underlyingQuote = quotes.find(
        (q) => q.symbol === upperSymbol && q.type !== "option"
      );
      const underlyingPrice = underlyingQuote?.last ?? 0;

      // Map options — track Greeks availability
      const options = ensureArray(chainResult.data.options?.option);
      const calls: OptionContract[] = [];
      const puts: OptionContract[] = [];
      let greeksFound = false;

      for (const opt of options) {
        if (opt.greeks?.delta != null) greeksFound = true;
        const contract = this.mapContract(opt);
        if (!contract) continue;
        if (contract.type === "CALL") calls.push(contract);
        else puts.push(contract);
      }

      calls.sort((a, b) => a.strike - b.strike);
      puts.sort((a, b) => a.strike - b.strike);

      const knownUnderlying = SUPPORTED_UNDERLYINGS.find((u) => u.symbol === upperSymbol);

      // Determine cache status (use chain result as primary indicator)
      const dataSource: "api" | "cache" = chainResult.fromCache ? "cache" : "api";
      const cacheAgeSeconds = chainResult.fromCache ? Math.round(chainResult.ageMs / 1000) : 0;

      const dataQuality: DataQuality = {
        greeksAvailable: greeksFound,
        dataSource,
        cacheAgeSeconds: dataSource === "cache" ? cacheAgeSeconds : undefined,
        limitations: greeksFound
          ? undefined
          : "Tradier Sandbox does not provide Greeks. Delta values are defaulted to 0. Delta-based recommendations are not meaningful.",
      };

      return {
        underlying: {
          symbol: upperSymbol,
          name: knownUnderlying?.name ?? upperSymbol,
          price: underlyingPrice,
        },
        expiration: { date: expirationDate, dte: computeDte(expirationDate) },
        calls,
        puts,
        dataQuality,
      };
    } catch (err) {
      console.error(`TradierProvider.getOptionsChain(${symbol}, ${expirationDate}) failed:`, err);
      return {
        underlying: { symbol: upperSymbol, name: upperSymbol, price: 0 },
        expiration: { date: expirationDate, dte: computeDte(expirationDate) },
        calls: [],
        puts: [],
        dataQuality: { greeksAvailable: false, dataSource: "api", limitations: "Provider request failed." },
      };
    }
  }

  private mapContract(opt: TradierQuote): OptionContract | null {
    if (!opt.option_type || opt.strike == null) return null;
    const bid = opt.bid ?? 0;
    const ask = opt.ask ?? 0;
    if (bid === 0 && ask === 0) return null;
    const delta = opt.greeks?.delta ?? null;
    const effectiveDelta = delta ?? 0;

    return {
      type: opt.option_type === "call" ? "CALL" : "PUT",
      strike: opt.strike,
      bid,
      ask: Math.max(ask, bid),
      delta: effectiveDelta,
      openInterest: opt.open_interest ?? 0,
      volume: opt.volume ?? 0,
    };
  }
}
