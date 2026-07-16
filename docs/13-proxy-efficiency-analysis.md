# Evidence Proxy — Acquisition Efficiency Analysis

**Date:** July 2026
**Status:** Analysis complete, implementation pending review

---

## 1. Measured Request Timeline (One Full Scan)

### Before (browser-side TradierProvider)

```
Pass 1 (40 symbols, ~40 seconds):
  Per symbol:
    1. getExpirations(symbol) → Tradier HTTP (or ResponseCache hit)
    2. [chain-chasing] getOptionsChain(symbol, exp)
       → Check DurableCache (IndexedDB)
       → If miss: Tradier HTTP (1 call — chain includes underlying data)
       → ResponseCache stores response for 60s
  
  Effective upstream calls: ~40 expirations + ~30 chains = ~70
  But: ResponseCache prevents duplicate calls within 60s
  And: DurableCache (IndexedDB) prevents re-fetching within 5-min TTL
  
  Net Tradier calls: Varies. First pass ~70. Subsequent passes: much fewer (cache hits).
  The old provider survived because IndexedDB persistence meant only NEW symbols hit Tradier.
```

### After (Evidence Proxy, current)

```
Pass 1 (15 symbols due to reduced budget):
  Per symbol from frontend:
    1. GET /api/market/expirations?symbol=X → Backend → Tradier (1 call)
    2. [chain-chasing] GET /api/market/chain?symbol=X&expiration=Y
       → Backend → Tradier (2 calls: chain + quote, parallel)
  
  Total upstream Tradier calls per symbol: 3
  Total per pass: 15 × 3 = 45 (within 60/min limit)
  
  Time per pass: ~15-20 seconds (sequential HTTP through proxy)
  Passes needed: ~33 for 496 symbols
  Total scan time: ~8-10 minutes
```

---

## 2. Root Cause of Excess Calls

Three efficiency behaviors were lost when the browser-side provider was removed:

### A. DurableCache (IndexedDB) prevented re-fetching

The old provider checked IndexedDB before calling Tradier. If a symbol had fresh/stale evidence cached from a prior pass, it was a local read — zero network. The proxy is stateless: every request goes to Tradier regardless of whether the evidence was fetched 30 seconds ago.

### B. ResponseCache (60s in-memory) coalesced repeated calls

The old provider cached raw HTTP responses for 60 seconds. If the acquisition loop requested the same symbol twice (common during retries or when the scan planner re-evaluated), the second call was free. The proxy has no response cache.

### C. The old provider's chain call was 1 Tradier request, not 2

The old `TradierProvider.getOptionsChain()` made a single Tradier chain request that included `greeks=true`. It got the underlying price from a *cached quote* (fetched separately during `getUnderlyings()` or from a prior call). The new backend adapter makes 2 parallel calls (chain + quote) for every chain request because it has no quote cache.

### Summary of lost efficiency

| Behavior | Old Provider | Current Proxy | Impact |
|----------|-------------|---------------|--------|
| IndexedDB evidence cache | ✅ Skips Tradier for cached symbols | ❌ Stateless — always calls Tradier | Major: symbols with 5-min-fresh evidence still hit Tradier |
| 60s response cache | ✅ Coalesces duplicate calls | ❌ None | Moderate: repeated calls within a pass are redundant |
| Single chain call (cached quote) | ✅ 1 Tradier call per chain | ❌ 2 calls (chain + quote) | Major: doubles chain cost |
| Batch quote support | Partial (getQuotes batch) | ❌ Individual quotes per chain | Moderate: could batch |

---

## 3. Comparison Summary

| Metric | Old Browser Provider | Current Proxy |
|--------|---------------------|---------------|
| Tradier calls per expiration | 1 | 1 |
| Tradier calls per chain | 1 (quote from cache) | 2 (chain + quote) |
| Calls per new symbol | 2 | 3 |
| Calls per already-cached symbol | 0 (IndexedDB hit) | 3 (no server cache) |
| Effective budget per pass | 40 symbols | 15 symbols (reduced to avoid 429) |
| Full universe scan time | ~3-4 minutes | ~8-10 minutes |
| Rate limit failures | Rare (cache absorbed load) | Common without budget reduction |

---

## 4. Smallest Correction That Restores Reliable Acquisition

### Immediate fix (smallest scope, biggest impact):

**Add a short-lived response cache to the backend proxy.**

A simple in-memory TTL cache (30-60 seconds) on the backend eliminates the two largest inefficiencies:

1. **Quote deduplication:** Cache the underlying quote for 60s. Multiple chain requests for the same symbol within a pass share one quote call. This reduces chain cost from 2 Tradier calls to 1 for already-quoted symbols.

2. **Expiration deduplication:** Cache expiration responses for 5 minutes. The frontend's IndexedDB still has its own cache, but if the frontend asks again (e.g., on rescan), the backend serves from memory without hitting Tradier.

This is NOT the same as the full SQLite evidence store (that's Phase 2). It's a thin in-process response cache — analogous to what the old `ResponseCache` class provided in the browser.

### Implementation:

```typescript
// Backend: simple TTL map
class ResponseCache {
  private cache = new Map<string, { data: any; expiresAt: number }>();
  
  get(key: string): any | null {
    const entry = this.cache.get(key);
    if (!entry || Date.now() > entry.expiresAt) return null;
    return entry.data;
  }
  
  set(key: string, data: any, ttlMs: number): void {
    this.cache.set(key, { data, expiresAt: Date.now() + ttlMs });
  }
}
```

Cache policy:
- Expirations: 5 min TTL (changes infrequently)
- Quotes: 60s TTL (underlying price, changes slowly relative to option pricing)
- Chains: 60s TTL (prevent duplicate fetches within same pass)

### Effect:

With a 60s backend cache:
- First request for a symbol: 3 Tradier calls (expiration + chain + quote)
- Second request within 60s: 0 Tradier calls (all from cache)
- Chain with cached quote: 1 Tradier call (chain only, quote from cache)

This restores the old provider's effective behavior: ~40 symbols per pass, ~1-2 Tradier calls per genuinely-new symbol, cache hits for everything else.

---

## 5. Should `refreshBudget = 15` Remain?

**Revert to 40 after implementing the backend cache.**

The budget reduction was a workaround for the missing cache. Once the backend caches quotes and deduplicates requests, the actual Tradier call count per pass drops to ~40-50 (not 120), well within the 60/min limit.

The `refreshBudget` should remain a **frontend throughput policy** (how many symbols to process per pass), not a proxy for provider rate-limit awareness. The backend owns rate-limit compliance; the frontend owns acquisition pacing.

If the backend cache is NOT implemented, keep `refreshBudget = 15` as a safety measure.

---

## 6. Acceptance Criteria

A full-universe scan (496 symbols) must complete without rate-limit failures when:

1. The backend response cache is active (60s TTL for quotes, 5 min for expirations)
2. The frontend `refreshBudget` is restored to 40
3. The acquisition loop runs continuously (multiple passes per scan)
4. The backend rate limiter does NOT return 429 to the frontend during normal scanning
5. Tradier's upstream 60 req/min limit is respected
6. Total scan time is ≤ 5 minutes for full universe (comparable to old provider)
7. The frontend has no knowledge of Tradier's per-request cost

### Observable verification:

```
Pass telemetry after fix:
  Selected: 40 symbols
  Completed: 40
  Errors: 0
  Failures: 0
  Provider expirations: 40 (or fewer if cached)
  Provider chains: 40 (or fewer if cached)
  Upstream Tradier calls: ≤ 60 (backend manages budget)
```

---

## 7. Architectural Position

The `refreshBudget = 15` change leaks provider implementation details into the frontend. The frontend shouldn't need to know that one logical `getOptionsChain()` costs two upstream Tradier calls.

The correct boundary:

```
Frontend: "Give me evidence for these 40 symbols"
Backend:  "OK. I'll manage the provider budget internally."
         (caches quotes, deduplicates, paces requests, queues if needed)
```

The backend may respond slightly slower (pacing), but it should never fail with 429 during normal operation. Rate limiting is a provider concern that belongs behind the facade.

---

## 8. Recommended Implementation Sequence

1. Add in-memory `ResponseCache` to the backend (30-60s TTL)
2. Cache quote responses (keyed by symbol, 60s TTL)
3. Cache expiration responses (keyed by symbol, 5 min TTL)
4. When fetching a chain, check quote cache first — only call Tradier for quote if cache miss
5. Revert `refreshBudget` to 40
6. Verify: full scan completes without 429 errors
7. (Optional) Add request pacing (1 req/sec delay between upstream calls) as a safety margin

Step 7 is the definitive solution: the backend internally paces its upstream calls at ~1/sec regardless of how many frontend requests arrive. Requests that can't be served immediately are held briefly (not rejected). This makes the proxy behave like the old provider's implicit rate-limit behavior without the frontend needing to know.
