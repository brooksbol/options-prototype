/**
 * Durable Market Cache — IndexedDB-backed two-level cache.
 *
 * L1: In-memory Map (fastest, current runtime only)
 * L2: IndexedDB (survives reload, restart, route changes)
 *
 * Features:
 * - Per-type TTLs (quotes, expirations, chains, metadata, errors)
 * - Typed composite keys (provider:environment:dataType:symbol:expiration:version)
 * - Fresh/stale/expired classification
 * - Stale-while-revalidate support
 * - Provider/environment isolation
 * - Does NOT cache portfolio-dependent derived results
 */

// --- TTL Configuration (provisional, configurable) ---

export interface CacheTTLConfig {
  version: string;
  /** Underlying quote fresh TTL (ms) */
  quoteFreshMs: number;
  /** Underlying quote stale-usable TTL (ms) */
  quoteStaleMs: number;
  /** Expiration list fresh TTL (ms) */
  expirationFreshMs: number;
  /** Expiration list stale-usable TTL (ms) */
  expirationStaleMs: number;
  /** Option chain fresh TTL (ms) */
  chainFreshMs: number;
  /** Option chain stale-usable TTL (ms) */
  chainStaleMs: number;
  /** Product structure metadata TTL (ms) */
  metadataFreshMs: number;
  /** Provider error negative cache TTL (ms) */
  errorTTLMs: number;
  /** Confirmed absence (no expirations, no chain) TTL (ms) */
  absenceTTLMs: number;
}

/**
 * Provisional TTLs — initial hypotheses for operational use.
 *
 * Rationale:
 * - Quotes: 2 min fresh, 10 min stale (prices move frequently)
 * - Expirations: 6 hours fresh, 24 hours stale (change at most daily)
 * - Chains: 5 min fresh, 30 min stale (primary scan data)
 * - Metadata: 7 days (product structure rarely changes)
 * - Errors: 30 sec (short retry window)
 * - Absence: 1 hour (confirmed "no options" is stable)
 */
export const DEFAULT_CACHE_TTL: CacheTTLConfig = {
  version: "v1-provisional",
  quoteFreshMs: 2 * 60 * 1000,
  quoteStaleMs: 10 * 60 * 1000,
  expirationFreshMs: 6 * 60 * 60 * 1000,
  expirationStaleMs: 24 * 60 * 60 * 1000,
  chainFreshMs: 5 * 60 * 1000,
  chainStaleMs: 30 * 60 * 1000,
  metadataFreshMs: 7 * 24 * 60 * 60 * 1000,
  errorTTLMs: 30 * 1000,
  absenceTTLMs: 60 * 60 * 1000,
};

// --- Data Types ---

export type CacheDataType = "quote" | "expirations" | "chain" | "metadata" | "error" | "absence";

export type CacheFreshness = "fresh" | "stale_usable" | "expired" | "missing";

// --- Cache Record ---

export interface CacheRecord<T = unknown> {
  key: string;
  dataType: CacheDataType;
  provider: string;
  environment: string;
  symbol: string;
  expiration: string | null;
  schemaVersion: string;
  retrievedAt: number;       // epoch ms
  freshUntil: number;        // epoch ms
  staleUntil: number;        // epoch ms
  payload: T;
}

// --- Key Builder ---

export function buildCacheKey(
  provider: string,
  environment: string,
  dataType: CacheDataType,
  symbol: string,
  expiration: string | null = null,
  schemaVersion: string = "v1"
): string {
  const parts = [
    "market",
    provider,
    environment,
    dataType,
    symbol.toUpperCase(),
  ];
  if (expiration) parts.push(expiration);
  parts.push(schemaVersion);
  return parts.join(":");
}

// --- Freshness Check ---

export function classifyFreshness(record: CacheRecord | null, now: number = Date.now()): CacheFreshness {
  if (!record) return "missing";
  if (now <= record.freshUntil) return "fresh";
  if (now <= record.staleUntil) return "stale_usable";
  return "expired";
}

// --- IndexedDB Store ---

import { openDB, MARKET_STORE } from "./db";

const STORE_NAME = MARKET_STORE;

// --- Durable Cache Class ---

export class DurableMarketCache {
  private l1 = new Map<string, CacheRecord>();
  private ttlConfig: CacheTTLConfig;

  constructor(ttlConfig: CacheTTLConfig = DEFAULT_CACHE_TTL) {
    this.ttlConfig = ttlConfig;
  }

  /** Get a record — checks L1 first, then L2 (IndexedDB). */
  async get<T>(key: string): Promise<CacheRecord<T> | null> {
    // L1
    const l1Hit = this.l1.get(key) as CacheRecord<T> | undefined;
    if (l1Hit) return l1Hit;

    // L2
    try {
      const db = await openDB();
      const tx = db.transaction(STORE_NAME, "readonly");
      const store = tx.objectStore(STORE_NAME);
      const result = await idbGet<CacheRecord<T>>(store, key);
      if (result) {
        // Hydrate L1
        this.l1.set(key, result as CacheRecord);
      }
      return result;
    } catch {
      return null;
    }
  }

  /** Put a record — writes to both L1 and L2. */
  async put<T>(record: CacheRecord<T>): Promise<void> {
    // L1
    this.l1.set(record.key, record as CacheRecord);

    // L2
    try {
      const db = await openDB();
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      store.put(record);
      await idbComplete(tx);
    } catch {
      // IndexedDB unavailable — L1 only
    }
  }

  /** Classify freshness of a cached record. */
  freshness(record: CacheRecord | null): CacheFreshness {
    return classifyFreshness(record);
  }

  /** Build a cache record with TTLs computed from the data type. */
  createRecord<T>(
    key: string,
    dataType: CacheDataType,
    provider: string,
    environment: string,
    symbol: string,
    expiration: string | null,
    payload: T
  ): CacheRecord<T> {
    const now = Date.now();
    const { freshMs, staleMs } = this.getTTLs(dataType);
    return {
      key,
      dataType,
      provider,
      environment,
      symbol: symbol.toUpperCase(),
      expiration,
      schemaVersion: "v1",
      retrievedAt: now,
      freshUntil: now + freshMs,
      staleUntil: now + staleMs,
      payload,
    };
  }

  /** Get all records for a symbol (from L2). */
  async getBySymbol(symbol: string): Promise<CacheRecord[]> {
    try {
      const db = await openDB();
      const tx = db.transaction(STORE_NAME, "readonly");
      const store = tx.objectStore(STORE_NAME);
      const index = store.index("symbol");
      return await idbGetAll(index, symbol.toUpperCase());
    } catch {
      return [];
    }
  }

  /** Delete expired records from L2 (housekeeping). */
  async pruneExpired(): Promise<number> {
    try {
      const db = await openDB();
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      const index = store.index("staleUntil");
      const now = Date.now();
      const range = IDBKeyRange.upperBound(now);
      let pruned = 0;

      return new Promise((resolve) => {
        const cursor = index.openCursor(range);
        cursor.onsuccess = () => {
          const c = cursor.result;
          if (c) {
            c.delete();
            this.l1.delete((c.value as CacheRecord).key);
            pruned++;
            c.continue();
          } else {
            resolve(pruned);
          }
        };
        cursor.onerror = () => resolve(pruned);
      });
    } catch {
      return 0;
    }
  }

  /** Get stats for observability. */
  getStats(): { l1Size: number } {
    return { l1Size: this.l1.size };
  }

  private getTTLs(dataType: CacheDataType): { freshMs: number; staleMs: number } {
    switch (dataType) {
      case "quote": return { freshMs: this.ttlConfig.quoteFreshMs, staleMs: this.ttlConfig.quoteStaleMs };
      case "expirations": return { freshMs: this.ttlConfig.expirationFreshMs, staleMs: this.ttlConfig.expirationStaleMs };
      case "chain": return { freshMs: this.ttlConfig.chainFreshMs, staleMs: this.ttlConfig.chainStaleMs };
      case "metadata": return { freshMs: this.ttlConfig.metadataFreshMs, staleMs: this.ttlConfig.metadataFreshMs };
      case "error": return { freshMs: this.ttlConfig.errorTTLMs, staleMs: this.ttlConfig.errorTTLMs };
      case "absence": return { freshMs: this.ttlConfig.absenceTTLMs, staleMs: this.ttlConfig.absenceTTLMs };
    }
  }
}

// --- IDB Helpers (promisified) ---

function idbGet<T>(store: IDBObjectStore, key: string): Promise<T | null> {
  return new Promise((resolve, reject) => {
    const req = store.get(key);
    req.onsuccess = () => resolve(req.result ?? null);
    req.onerror = () => reject(req.error);
  });
}

function idbGetAll<T>(index: IDBIndex, key: string): Promise<T[]> {
  return new Promise((resolve, reject) => {
    const req = index.getAll(key);
    req.onsuccess = () => resolve(req.result ?? []);
    req.onerror = () => reject(req.error);
  });
}

function idbComplete(tx: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

// --- Singleton ---

let instance: DurableMarketCache | null = null;

export function getDurableCache(): DurableMarketCache {
  if (!instance) {
    instance = new DurableMarketCache();
  }
  return instance;
}

/** Reset singleton (for testing). */
export function resetDurableCache(): void {
  instance = null;
}
