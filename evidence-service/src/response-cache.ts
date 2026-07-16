/**
 * In-memory response cache with per-type TTLs.
 *
 * Eliminates redundant upstream Tradier calls within short windows.
 * Process-local only. Resets on server restart. No manual purging needed.
 *
 * TTL policy:
 *   - Expirations: 5 minutes (changes infrequently within a session)
 *   - Quotes: 60 seconds (underlying price, changes slowly relative to options)
 *   - Chains: 90 seconds (prevent duplicate fetches within acquisition pass)
 */

export type CacheType = "expirations" | "quote" | "chain";

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
  retrievedAt: string;
}

const TTL_MS: Record<CacheType, number> = {
  expirations: 5 * 60 * 1000,  // 5 minutes
  quote: 60 * 1000,             // 60 seconds
  chain: 90 * 1000,             // 90 seconds
};

export class ResponseCache {
  private store = new Map<string, CacheEntry<unknown>>();

  /**
   * Get cached response. Returns null on miss or expiry.
   */
  get<T>(type: CacheType, key: string): { data: T; retrievedAt: string } | null {
    const fullKey = `${type}:${key}`;
    const entry = this.store.get(fullKey);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.store.delete(fullKey);
      return null;
    }
    return { data: entry.data as T, retrievedAt: entry.retrievedAt };
  }

  /**
   * Store a response with type-appropriate TTL.
   */
  set<T>(type: CacheType, key: string, data: T, retrievedAt: string): void {
    const fullKey = `${type}:${key}`;
    this.store.set(fullKey, {
      data,
      expiresAt: Date.now() + TTL_MS[type],
      retrievedAt,
    });
  }

  /**
   * Cache statistics for diagnostics.
   */
  stats(): { size: number; byType: Record<CacheType, number> } {
    const byType: Record<CacheType, number> = { expirations: 0, quote: 0, chain: 0 };
    for (const key of this.store.keys()) {
      const type = key.split(":")[0] as CacheType;
      if (byType[type] !== undefined) byType[type]++;
    }
    return { size: this.store.size, byType };
  }
}

// Singleton
let instance: ResponseCache | null = null;

export function getResponseCache(): ResponseCache {
  if (!instance) instance = new ResponseCache();
  return instance;
}
