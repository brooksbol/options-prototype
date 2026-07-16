# Backend Thin Slice Proposal

**Date:** July 2026
**Status:** Proposed — awaiting review before implementation
**Purpose:** Move one meaningful, currently browser-owned operational responsibility behind an API boundary

---

## 1. Current-State Execution Trace

When the operator clicks **Scan** in the Write Desk, the following happens entirely within the browser:

```
WriteDesk.handleScan()
  │
  ├── acquireEvidence(symbols, provider, plannerConfig)
  │     │
  │     ├── CrawlStateService.ensureGeneration() → IndexedDB read/write
  │     ├── buildScanPlan(symbols, cache, crawlState) → IndexedDB reads (496 cache lookups)
  │     │
  │     └── [LOOP: up to 20 passes]
  │           ├── For each work item (up to 40 per pass):
  │           │     ├── Check session gate (market-sensitive vs insensitive)
  │           │     ├── provider.getExpirations(symbol) → HTTPS to Tradier sandbox
  │           │     │     └── Authorization: Bearer <VITE_TRADIER_API_KEY>
  │           │     ├── selectPrimaryExpiration() → determine target chain
  │           │     ├── provider.getOptionsChain(symbol, exp) → HTTPS to Tradier sandbox
  │           │     │     └── Authorization: Bearer <VITE_TRADIER_API_KEY>
  │           │     └── cache.put(record) → IndexedDB write
  │           │
  │           ├── recommendPuts(symbols, cash, cache, ...) → IndexedDB reads
  │           │     └── Pure ranking + assessment (no network)
  │           │
  │           └── Check stopping conditions → continue or break
  │
  ├── recommendPuts() [final] → IndexedDB reads → PutCandidate[]
  │
  ├── scanCalls(inventory, provider, config) → HTTPS to Tradier
  │
  └── UI state updates (setPutCandidates, setCoverage, setTelemetry, etc.)
```

**Concrete modules involved:**
- `src/config/tradier.ts` — reads `VITE_TRADIER_API_KEY` from browser environment
- `src/providers/tradier/TradierProvider.ts` — makes HTTPS calls to `sandbox.tradier.com/v1`
- `src/cache/durable-cache.ts` — IndexedDB read/write
- `src/cache/crawl-state.ts` — IndexedDB generation/cursor tracking
- `src/cache/scan-planner.ts` — cache inspection, work scheduling
- `src/write-desk/acquire-evidence.ts` — acquisition orchestration, session gating
- `src/write-desk/recommend.ts` — pure recommendation (cache reads only)
- `src/market-session/session-policy.ts` — 6-state session classification
- `src/components/WriteDesk.tsx` — orchestrates all of the above in `handleScan`

**Credentials:** The Tradier API key is compiled into the browser bundle via `VITE_TRADIER_API_KEY`. It is sent directly from the browser to `sandbox.tradier.com`.

---

## 2. Where is the Most Consequential Boundary Missing?

| Responsibility | Browser-acceptable? | Concern if it remains |
|---------------|--------------------|-----------------------|
| UI rendering, interaction | ✅ Yes | — |
| Wheelwright recommendation | ✅ Yes (pure, instant, local) | — |
| Policy controls | ✅ Yes | — |
| Portfolio CSV parsing | ✅ Acceptable | — |
| Broker handoff (Fidelity URL) | ✅ Yes (browser opens tab) | — |
| **Tradier API credential** | ❌ **No** | Key is in browser bundle, visible in DevTools, shipped to client |
| **Tradier HTTP calls from browser** | ❌ **No** | CORS-dependent, credential exposure, no server-side rate limiting |
| **Background acquisition loop** | ❌ **No** | Blocked by tab lifecycle, HMR, navigation |
| IndexedDB evidence store | ⚠️ Temporarily acceptable | Fragile across restarts; will be replaced |
| Crawl state / generation tracking | ⚠️ Temporarily acceptable | Source of recent bugs; will be replaced |

**The most consequential missing boundary:** The browser makes authenticated HTTPS calls to Tradier using a credential that should never leave a server.

This is simultaneously:
- A **security concern** (API key in client bundle)
- A **reliability concern** (browser lifecycle vs long-running acquisition)
- A **operational concern** (no server-side rate limiting, no background execution)
- The **exact capability** that the backend evidence service is designed to own

---

## 3. What Should Move First: Evidence Proxy

**Recommended first slice: A server-side Tradier proxy that owns the credential and executes market-data requests on behalf of the browser.**

The browser would call `GET /api/market/expirations?symbol=XLE` instead of calling Tradier directly. The server holds the Tradier credential, makes the upstream request, and returns the normalized response.

### Why this boundary, not others:

| Criterion | Evidence Proxy | Full Snapshot Service | Server-side Recommendations |
|-----------|---------------|----------------------|----------------------------|
| Architectural confidence | High — proves the API boundary | High but large scope | Excessive — moves Wheelwright server-side |
| Security improvement | **Immediate** — credential leaves browser | Same | Same |
| Production relevance | Direct — same Tradier calls, server-mediated | Higher but months of work | Premature |
| Scope | Small — 2-3 endpoints proxying existing calls | Large — full acquisition + persistence + publication | Very large |
| Disruption to Write Desk | **Minimal** — swap fetch URL, remove env var | Moderate — new data flow | Extensive — removes local Wheelwright |
| Risk | Low — behavior is identical from browser's perspective | Medium — new persistence model | High — changes recommendation latency |
| Foundation for extension | Excellent — add caching, scheduling, persistence behind the same boundary later | N/A (it IS the full service) | Wrong starting point |
| Cloud readiness | Good — credential is server-side for deployment | Same | Same |

### Why NOT the full snapshot service first:

The full service (continuous acquisition + SQLite + snapshot publication + ETag) is the destination but it's 2-3 weeks of work. The proxy is 1-2 days and immediately solves the credential problem while creating the correct boundary for everything else to grow behind.

### Why NOT server-side recommendations:

Wheelwright is pure, instant, and local. Moving it server-side adds latency to every policy change. This is architecturally regressive (see ADR-008, alternative 2).

---

## 4. What Remains Intentionally in the Browser

| Responsibility | Stays in browser | Reason |
|---------------|-----------------|--------|
| Wheelwright recommendation engine | ✅ | Instant local policy recomputation |
| Recommendation Policy controls | ✅ | Zero-latency interaction |
| Recommendation Brief | ✅ | Reads from local evidence |
| Portfolio CSV import/parse | ✅ | Operator-owned, file-based |
| Write Intent / Fidelity handoff | ✅ | Browser opens new tab |
| Pending Intents | ✅ | localStorage, governance only |
| IndexedDB evidence cache | ✅ (temporarily) | Still consumed by Wheelwright; migrates later |
| Crawl state / scan planner | ✅ (temporarily) | Orchestration stays until full service replaces it |
| Acquisition loop (handleScan) | ✅ (temporarily) | Calls proxy instead of Tradier; loop logic migrates later |

The key change: `acquireEvidence` still runs in the browser. It still loops. But its provider calls go through the server proxy instead of directly to Tradier.

---

## 5. API Contract

### Endpoint 1: Get Expirations

```
GET /api/market/expirations?symbol=XLE
```

Response (200):
```json
{
  "symbol": "XLE",
  "expirations": [
    { "date": "2026-07-24", "dte": 9 },
    { "date": "2026-08-21", "dte": 37 },
    { "date": "2026-09-19", "dte": 66 }
  ],
  "provider": "tradier",
  "retrievedAt": "2026-07-15T14:30:00Z"
}
```

Response (no options):
```json
{
  "symbol": "AAVM",
  "expirations": [],
  "provider": "tradier",
  "retrievedAt": "2026-07-15T14:30:01Z"
}
```

Error (provider failure):
```json
{
  "error": "provider_error",
  "message": "Tradier returned 429 Too Many Requests",
  "retryAfterMs": 60000
}
```

### Endpoint 2: Get Options Chain

```
GET /api/market/chain?symbol=XLE&expiration=2026-08-21
```

Response (200):
```json
{
  "symbol": "XLE",
  "expiration": "2026-08-21",
  "underlying": {
    "symbol": "XLE",
    "name": "Energy Select Sector SPDR Fund",
    "price": 88.50
  },
  "puts": [...],
  "calls": [...],
  "provider": "tradier",
  "retrievedAt": "2026-07-15T14:30:02Z"
}
```

The response shape matches the existing `OptionsChain` domain type — the browser's `TradierProvider` currently normalizes the Tradier response into this shape. The proxy will do the same normalization server-side.

### Endpoint 3: Health / Status

```
GET /api/status
```

Response:
```json
{
  "status": "ok",
  "provider": "tradier",
  "environment": "sandbox",
  "rateBudget": { "requestsThisMinute": 12, "limit": 60 }
}
```

### No authentication on the proxy (initially)

The proxy runs on `localhost`. No user auth needed for single-operator local deployment. The Tradier credential is the server's secret — the browser never sees it.

---

## 6. Minimal Backend Components

```
evidence-service/
├── src/
│   ├── main.ts              — server startup (Express or Hono)
│   ├── routes/
│   │   ├── market.ts        — /api/market/expirations, /api/market/chain
│   │   └── status.ts        — /api/status
│   ├── providers/
│   │   └── tradier.ts       — Tradier HTTP client (extracted from frontend TradierProvider)
│   ├── normalize.ts         — Tradier response → OptionsChain domain type
│   └── rate-limiter.ts      — simple token-bucket (60 req/min)
├── package.json
├── tsconfig.json
└── .env                     — TRADIER_API_KEY (server-only, never in browser)
```

**Technology:** TypeScript + Node (or Bun) + Express (or Hono). No database. No ORM. No framework beyond HTTP routing.

**Shared types:** The `OptionsChain`, `Expiration`, and `OptionContract` types from `src/domain/types.ts` are used by both frontend and backend. Initially, copy the type definitions. In Phase 1 of the full migration, extract into a shared package.

---

## 7. State and Persistence Decision

**No persistence for the first slice.**

The proxy is stateless — it receives a request, calls Tradier, normalizes the response, and returns it. The browser's IndexedDB cache continues to handle evidence persistence.

The only server-side state is the rate-limiter's token bucket (in-process memory, resets on restart — acceptable for a proxy).

**Why no persistence yet:**
- The browser's IndexedDB cache still works for Wheelwright
- Adding SQLite to the proxy creates scope creep
- The proxy proves the API boundary without changing the data flow
- Persistence arrives in Phase 2 (full evidence service) when the crawl logic moves server-side

---

## 8. Required Frontend Changes

1. **Remove `VITE_TRADIER_API_KEY` from `.env.local`** — the browser no longer needs it

2. **Create a new `ProxyMarketDataProvider`** that implements the existing `MarketDataProvider` interface but calls the local proxy instead of Tradier directly:
   ```typescript
   class ProxyMarketDataProvider implements MarketDataProvider {
     async getExpirations(symbol: string): Promise<Expiration[]> {
       const res = await fetch(`/api/market/expirations?symbol=${symbol}`);
       const data = await res.json();
       return data.expirations;
     }
     async getOptionsChain(symbol: string, expiration: string): Promise<OptionsChain> {
       const res = await fetch(`/api/market/chain?symbol=${symbol}&expiration=${expiration}`);
       return await res.json();
     }
   }
   ```

3. **Update `src/providers/index.ts`** to return `ProxyMarketDataProvider` instead of `TradierProvider` when the proxy is available (feature flag or environment detection)

4. **Add Vite proxy config** to forward `/api/*` to `localhost:3100` during development

5. **No other changes.** The acquisition loop, scan planner, crawl state, IndexedDB cache, Wheelwright, and UI all remain unchanged. They just receive data from a different source.

---

## 9. Explicit Deferrals

| Capability | Deferred to |
|-----------|-------------|
| Server-side evidence persistence (SQLite) | Phase 2 |
| Server-side acquisition scheduling | Phase 2 |
| Crawl state / generation tracking on server | Phase 2 |
| Snapshot publication / ETag / 304 | Phase 2 |
| Server-side session policy | Phase 2 |
| User authentication | Phase 2+ |
| Wheelwright on server | Not planned (stays client-side) |
| Multi-user | Not planned for first slice |
| Cloud deployment | After proxy is stable locally |

---

## 10. Implementation Sequence

1. **Create `evidence-service/` directory** with package.json, tsconfig, basic Express/Hono setup
2. **Extract Tradier HTTP client** from `TradierProvider` into server-side module (the normalization logic)
3. **Implement `/api/market/expirations`** — calls Tradier, normalizes, returns
4. **Implement `/api/market/chain`** — calls Tradier, normalizes, returns
5. **Add rate limiter** — token bucket, 60 req/min
6. **Implement `/api/status`** — health check
7. **Create `ProxyMarketDataProvider`** in the frontend
8. **Add Vite proxy config** — `/api/*` → `localhost:3100`
9. **Wire proxy provider** into `getProvider()` when backend is available
10. **Remove `VITE_TRADIER_API_KEY`** from frontend `.env.local`
11. **Verify end-to-end** — same Write Desk behavior, requests now go through proxy

---

## 11. End-to-End Acceptance Criteria

The operator experience is identical. Verification:

1. Start the backend: `cd evidence-service && npm start`
2. Start the frontend: `cd options-prototype && npm run dev`
3. Open Write Desk, click Scan
4. Recommendations appear progressively (same as before)
5. Network tab shows requests to `localhost:5173/api/market/*` (proxied to backend)
6. **No requests to `sandbox.tradier.com` from the browser**
7. **No Tradier API key in the browser bundle or DevTools**
8. Backend logs show Tradier requests with rate limiting
9. Coverage converges to complete (same as before)
10. Policy changes still recompute instantly (Wheelwright is local)
11. Recommendation Brief still works (reads from IndexedDB)
12. Fidelity handoff still works (browser-side)

**Test:** If the backend is stopped, the frontend should show a clear error ("Evidence service unavailable") rather than silently failing. If the backend is restarted, the next Scan should work normally.

---

## 12. Risks, Uncertainties, and Assumptions

| Risk | Mitigation |
|------|-----------|
| CORS issues during development | Vite proxy config handles this — no CORS needed |
| Tradier sandbox IP-based rate limiting | Proxy consolidates from one IP (the server) — same behavior as browser |
| Frontend `TradierProvider` has IndexedDB integration | The proxy only replaces the HTTP layer; IDB writes remain in the browser-side acquire-evidence flow |
| Shared type drift | Copy types initially; extract shared package in Phase 1.5 |
| Two processes for local dev | Acceptable; document in README; could combine later with concurrently |

**Assumptions requiring confirmation:**
- The Tradier sandbox does not enforce browser-specific headers (User-Agent, Origin) that would fail from a Node/Bun HTTP client
- The existing `TradierProvider` normalization logic can be cleanly extracted (it currently also writes to DurableCache — the proxy only does normalization, not caching)

---

## "Do It" Scope

**Authorized scope (after review):**

1. Create `evidence-service/` — TypeScript, Node/Bun, Express or Hono
2. Two endpoints: `/api/market/expirations`, `/api/market/chain`
3. One status endpoint: `/api/status`
4. Server-side Tradier HTTP client with rate limiter
5. `ProxyMarketDataProvider` in frontend
6. Vite proxy config
7. Remove Tradier credential from browser
8. End-to-end verification

**Not in scope:**
- Database
- Background acquisition
- Snapshot publication
- Authentication
- Cloud deployment
- Any change to Wheelwright, Brief, or UI behavior

**Estimated effort:** 1-2 days

**Governing principle:** The credential and the upstream HTTP calls move behind a boundary. Everything else stays where it is. The operator sees identical behavior. The architecture gains its first real production seam.
