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
import { getDurableCache, buildCacheKey, type CacheDataType, type DurableMarketCache } from "../../cache/durable-cache";

// --- Cache ---

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const DEFAULT_TTL_MS = 60 * 1000; // 60 seconds

export class ResponseCache {
  private store = new Map<string, CacheEntry<unknown>>();
  private ttlMs: number;
  private _hits = 0;
  private _misses = 0;

  constructor(ttlMs: number = DEFAULT_TTL_MS) {
    this.ttlMs = ttlMs;
  }

  get<T>(key: string): { data: T; ageMs: number } | null {
    const entry = this.store.get(key);
    if (!entry) {
      this._misses++;
      return null;
    }

    const ageMs = Date.now() - entry.timestamp;
    if (ageMs > this.ttlMs) {
      this.store.delete(key);
      this._misses++;
      return null;
    }

    this._hits++;
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

  get hits(): number {
    return this._hits;
  }

  get misses(): number {
    return this._misses;
  }

  resetStats(): void {
    this._hits = 0;
    this._misses = 0;
  }
}

// --- Configuration ---

const SUPPORTED_UNDERLYINGS: Omit<Underlying, "price">[] = [
  { symbol: "SPY", name: "SPDR S&P 500 ETF Trust" },
  { symbol: "QQQ", name: "Invesco QQQ Trust" },
  { symbol: "IWM", name: "iShares Russell 2000 ETF" },
  { symbol: "DIA", name: "SPDR Dow Jones Industrial Average ETF" },
  { symbol: "XLE", name: "Energy Select Sector SPDR Fund" },
  { symbol: "XLF", name: "Financial Select Sector SPDR Fund" },
  { symbol: "XLV", name: "Health Care Select Sector SPDR Fund" },
  { symbol: "XLU", name: "Utilities Select Sector SPDR Fund" },
  { symbol: "XLI", name: "Industrial Select Sector SPDR Fund" },
  { symbol: "XLP", name: "Consumer Staples Select Sector SPDR Fund" },
  { symbol: "XLY", name: "Consumer Discretionary Select Sector SPDR Fund" },
  { symbol: "XLK", name: "Technology Select Sector SPDR Fund" },
  { symbol: "XLB", name: "Materials Select Sector SPDR Fund" },
  { symbol: "XLRE", name: "Real Estate Select Sector SPDR Fund" },
  { symbol: "XLC", name: "Communication Services Select Sector SPDR Fund" },
  { symbol: "TLT", name: "iShares 20+ Year Treasury Bond ETF" },
  { symbol: "GLD", name: "SPDR Gold Shares" },
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

// --- Cache Source Provenance ---

export type CacheSource = "memory" | "durable" | "network";

// --- Provider Implementation ---

export class TradierProvider implements MarketDataProvider {
  private config: TradierConfig;
  private cache: ResponseCache;
  private durableCache: DurableMarketCache;
  private rateLimitUsed: number | null = null;
  private rateLimitAvailable: number | null = null;
  private rateLimitAllowed: number | null = null;
  /** Local count of actual API calls made (not cache hits). */
  private apiCallCount = 0;
  /** In-flight request deduplication map. Concurrent requests for the same key share one Promise. */
  private inflight = new Map<string, Promise<unknown>>();
  /** Cache source tracking for the last operation (for observability). */
  lastCacheSource: CacheSource = "network";
  /** Counts for observability. */
  durableHits = 0;
  memoryHits = 0;
  networkCalls = 0;

  constructor(config: TradierConfig, ttlMs?: number) {
    this.config = config;
    this.cache = new ResponseCache(ttlMs);
    this.durableCache = getDurableCache();
  }

  /** The environment identifier used for durable cache keys. */
  private get cacheEnvironment(): string {
    return this.config.baseUrl.includes("sandbox") ? "sandbox" : "live";
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

    this.apiCallCount++;

    // Capture rate-limit headers from every response (may be unavailable due to CORS)
    const used = response.headers.get("X-Ratelimit-Used");
    const available = response.headers.get("X-Ratelimit-Available");
    const allowed = response.headers.get("X-Ratelimit-Allowed");
    if (used != null) this.rateLimitUsed = parseInt(used, 10);
    if (available != null) this.rateLimitAvailable = parseInt(available, 10);
    if (allowed != null) this.rateLimitAllowed = parseInt(allowed, 10);

    if (!response.ok) {
      const text = await response.text();
      throw new Error(
        `Tradier API error ${response.status}: ${text.slice(0, 200)}`
      );
    }

    return response.json();
  }

  private async cachedFetch<T>(cacheKey: string, fetcher: () => Promise<T>): Promise<{ data: T; fromCache: boolean; ageMs: number; source: CacheSource }> {
    // L1: Check in-memory cache first
    const cached = this.cache.get<T>(cacheKey);
    if (cached) {
      this.lastCacheSource = "memory";
      this.memoryHits++;
      return { data: cached.data, fromCache: true, ageMs: cached.ageMs, source: "memory" };
    }

    // Deduplication: if an identical request is already in-flight, share its Promise
    const existing = this.inflight.get(cacheKey);
    if (existing) {
      const data = await existing as T;
      return { data, fromCache: false, ageMs: 0, source: "network" };
    }

    // Execute the fetch and register it as in-flight
    const fetchPromise = fetcher().then((data) => {
      this.cache.set(cacheKey, data);
      this.inflight.delete(cacheKey);
      return data;
    }).catch((err) => {
      this.inflight.delete(cacheKey);
      throw err;
    });

    this.inflight.set(cacheKey, fetchPromise);
    const data = await fetchPromise;
    this.lastCacheSource = "network";
    this.networkCalls++;
    return { data, fromCache: false, ageMs: 0, source: "network" };
  }

  /**
   * Write a domain-transformed result to the durable cache (L2).
   * Called AFTER domain transformation so the scanner can read domain types directly.
   */
  private async writeDurable<T>(dataType: CacheDataType, symbol: string, expiration: string | null, payload: T): Promise<void> {
    const durableKey = buildCacheKey("tradier", this.cacheEnvironment, dataType, symbol, expiration ?? undefined);
    try {
      const record = this.durableCache.createRecord(
        durableKey, dataType, "tradier", this.cacheEnvironment,
        symbol, expiration, payload
      );
      await this.durableCache.put(record);
    } catch {
      // Durable write failed — non-critical
    }
  }

  /**
   * Read domain-transformed data from durable cache (L2).
   * Returns null if missing or expired.
   */
  private async readDurable<T>(dataType: CacheDataType, symbol: string, expiration: string | null): Promise<{ data: T; ageMs: number } | null> {
    const durableKey = buildCacheKey("tradier", this.cacheEnvironment, dataType, symbol, expiration ?? undefined);
    try {
      const record = await this.durableCache.get<T>(durableKey);
      if (record) {
        const freshness = this.durableCache.freshness(record);
        if (freshness === "fresh" || freshness === "stale_usable") {
          this.durableHits++;
          this.lastCacheSource = "durable";
          return { data: record.payload, ageMs: Date.now() - record.retrievedAt };
        }
      }
    } catch {
      // IndexedDB unavailable
    }
    return null;
  }

  /**
   * Batch quote lookup — single API call for multiple symbols.
   * Populates per-symbol cache entries (quotes:SYMBOL) so that
   * subsequent getOptionsChain() calls hit cache for the quote leg.
   *
   * Access-pattern optimization for broad scans (Opportunity Lab).
   */
  async getQuotes(symbols: string[]): Promise<Map<string, number>> {
    const upperSymbols = symbols.map((s) => s.toUpperCase());
    const symbolList = upperSymbols.join(",");
    const batchCacheKey = `quotes:batch:${symbolList}`;

    const priceMap = new Map<string, number>();

    try {
      const { data } = await this.cachedFetch(batchCacheKey, () =>
        this.fetchJson<TradierQuotesResponse>("/markets/quotes", { symbols: symbolList, greeks: "false" })
      );

      const quotes = ensureArray(data.quotes?.quote);

      for (const q of quotes) {
        if (q.symbol && q.last != null) {
          priceMap.set(q.symbol, q.last);

          // Populate per-symbol cache entries used by getOptionsChain()
          const perSymbolKey = `quotes:${q.symbol}`;
          const perSymbolResponse: TradierQuotesResponse = {
            quotes: { quote: q },
          };
          this.cache.set(perSymbolKey, perSymbolResponse);
        }
      }
    } catch (err) {
      console.error("TradierProvider.getQuotes batch failed:", err);
    }

    return priceMap;
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

    // Check L2 (durable) for domain-transformed data
    const durable = await this.readDurable<Expiration[]>("expirations", upperSymbol, null);
    if (durable) {
      // Hydrate L1
      this.cache.set(cacheKey, { expirations: { date: durable.data.map((e) => e.date) } });
      return durable.data;
    }

    try {
      const { data } = await this.cachedFetch(cacheKey, () =>
        this.fetchJson<TradierExpirationsResponse>("/markets/options/expirations", { symbol: upperSymbol })
      );

      const dates = ensureArray(data.expirations?.date);
      const result = dates.map((date) => ({ date, dte: computeDte(date) }));

      // Write domain-transformed result to L2
      await this.writeDurable("expirations", upperSymbol, null, result);

      return result;
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

    // Check L2 (durable) for the full domain-transformed chain
    const durableChain = await this.readDurable<OptionsChain>("chain", upperSymbol, expirationDate);
    if (durableChain) {
      // Hydrate L1 and return
      this.cache.set(chainCacheKey, {}); // mark L1 as warm
      return durableChain.data;
    }

    try {
      // Fetch chain and quote (both potentially cached in L1)
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

      const optionsChain: OptionsChain = {
        underlying: {
          symbol: upperSymbol,
          name: underlyingQuote?.description ?? knownUnderlying?.name ?? upperSymbol,
          price: underlyingPrice,
        },
        expiration: { date: expirationDate, dte: computeDte(expirationDate) },
        calls,
        puts,
        dataQuality,
      };

      // Write domain-transformed chain to L2 (durable)
      await this.writeDurable("chain", upperSymbol, expirationDate, optionsChain);

      return optionsChain;
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
    const iv = opt.greeks?.mid_iv ?? undefined;

    return {
      type: opt.option_type === "call" ? "CALL" : "PUT",
      strike: opt.strike,
      bid,
      ask: Math.max(ask, bid),
      delta: effectiveDelta,
      openInterest: opt.open_interest ?? 0,
      volume: opt.volume ?? 0,
      iv: iv != null ? iv : undefined,
    };
  }

  getCacheStats() {
    return {
      hits: this.cache.hits,
      misses: this.cache.misses,
      size: this.cache.size,
      apiCalls: this.apiCallCount,
      rateLimitUsed: this.rateLimitUsed,
      rateLimitAvailable: this.rateLimitAvailable,
      rateLimitAllowed: this.rateLimitAllowed,
    };
  }
}
