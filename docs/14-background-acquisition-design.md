# Backend-Owned Background Evidence Acquisition

**Date:** July 2026
**Status:** Implemented (transitional architecture). Emergency session gate added July 3, 2026.
**Prerequisite:** Evidence Proxy thin slice (complete)

> **Architectural note:** The transition from browser-owned acquisition to backend-owned evidence maintenance was the point at which the project's architecture began becoming an evidence appliance. The browser shifted from owner to observer; the backend became the single authority maintaining a continuous evidence model. See `docs/foundations/evidence-appliance.md` for the governing concept.

---

## 1. Current Architecture

```
┌─────────────────────────────────────────────────┐
│  BROWSER (owns acquisition orchestration)        │
│                                                  │
│  Operator clicks Scan                            │
│    ↓                                             │
│  Scan Planner (inspects IndexedDB)               │
│    ↓                                             │
│  Acquisition Loop (up to 20 passes)              │
│    ↓                                             │
│  For each symbol:                                │
│    GET /api/market/expirations                   │
│    GET /api/market/chain                         │
│    → store in IndexedDB                          │
│    ↓                                             │
│  Wheelwright (reads IndexedDB, ranks)            │
│    ↓                                             │
│  Render recommendations                          │
└──────────────────────┬──────────────────────────┘
                       │ HTTP (paced)
┌──────────────────────▼──────────────────────────┐
│  BACKEND (owns provider access)                  │
│                                                  │
│  ResponseCache (90s chains, 60s quotes, 5m exp)  │
│  RequestPacer (0.9 req/sec)                      │
│  TradierAdapter → Tradier Sandbox                │
└─────────────────────────────────────────────────┘
```

**What the browser still owns:**
- When acquisition starts (operator click)
- What symbols to acquire (scan planner logic)
- Acquisition sequencing and looping
- Progress tracking and stopping conditions
- Durable evidence storage (IndexedDB)
- Session-aware acquisition policy
- Freshness classification
- Crawl state and generation tracking
- Recommendation timing

**What the backend owns:**
- Provider credential
- Upstream HTTP calls to Tradier
- Request pacing (rate-limit compliance)
- Short-lived response caching
- Response normalization

---

## 2. Target Architecture

```
┌─────────────────────────────────────────────────┐
│  BACKEND (owns acquisition + evidence)           │
│                                                  │
│  Acquisition Worker (continuous, session-aware)   │
│    ↓                                             │
│  Evidence Store (SQLite — system of record)       │
│    ↓                                             │
│  Snapshot Publisher (coherent, ETag-addressable)  │
│    ↓                                             │
│  HTTP API                                        │
│    GET /api/evidence/current                     │
│    If-None-Match → 304 or 200                    │
└──────────────────────┬──────────────────────────┘
                       │ HTTP (conditional)
┌──────────────────────▼──────────────────────────┐
│  BROWSER (observes evidence, computes locally)   │
│                                                  │
│  Fetch snapshot on load                          │
│  Poll/revalidate periodically                    │
│  Wheelwright (local, instant recomputation)       │
│  Render recommendations                          │
│  Operator interaction                            │
│  No acquisition logic                            │
│  No IndexedDB market evidence                    │
│  No scan planner, crawl state, or generation     │
└─────────────────────────────────────────────────┘
```

**Backend acquires continuously.** No browser connection required. Evidence is ready when the operator arrives.

**Browser is an observer.** It fetches the latest evidence snapshot and runs Wheelwright locally. Policy changes are instant. No scan button needed.

---

## 3. Transitional Architecture (Recommended)

The target is too large for one step. The transition should be incremental.

```
┌─────────────────────────────────────────────────┐
│  BACKEND (acquires in background)                │
│                                                  │
│  Acquisition Worker (in-process, timer-driven)   │
│    → runs continuously when session permits      │
│    → uses existing TradierAdapter + cache        │
│    → stores evidence in memory (generation map)  │
│    ↓                                             │
│  Evidence Endpoint                               │
│    GET /api/evidence/snapshot                    │
│    → returns current evidence state              │
│    → ETag for conditional revalidation           │
│    ↓                                             │
│  Existing proxy endpoints remain available       │
│    GET /api/market/expirations (for fallback)    │
│    GET /api/market/chain (for fallback)          │
└──────────────────────┬──────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────┐
│  BROWSER (two modes, feature-flagged)            │
│                                                  │
│  Mode A (current): browser-owned acquisition     │
│    → calls /api/market/* per symbol              │
│    → stores in IndexedDB                         │
│    → existing scan loop                          │
│                                                  │
│  Mode B (new): backend-owned acquisition         │
│    → polls GET /api/evidence/snapshot            │
│    → receives complete evidence state            │
│    → runs Wheelwright locally                    │
│    → no scan button, no acquisition loop         │
│    → no IndexedDB market evidence                │
└─────────────────────────────────────────────────┘
```

The transition preserves Mode A as fallback while Mode B proves the new architecture.

---

## 4. Recommended First Backend-Owned Acquisition Slice

### What to build

A **non-overlapping, self-scheduling acquisition worker** in the evidence-service that:

1. Starts automatically when the server starts
2. Acquires evidence continuously during market hours (session-aware)
3. Uses self-scheduling (not `setInterval`) — only one cycle is ever in flight
4. Paces at ~1 req/sec (reuses existing RequestPacer)
5. Stores evidence in an in-memory map (keyed by symbol) — explicitly transitional, not a durable system of record
6. Publishes evidence **incrementally** as each symbol completes (not batch-at-end)
7. Tracks coverage (ready count, absence count, pending count)
8. Exposes a snapshot via a new endpoint: `GET /api/evidence/snapshot`
9. Computes an ETag that changes when evidence changes
10. Answers `304 Not Modified` when the browser's held snapshot is current
11. Includes telemetry: serialized snapshot bytes, symbols changed per generation, transfer size

The scheduler pattern:

```
async function runAcquisitionCycle() {
  await acquireNextBatch();  // may take minutes
  publishSnapshot();          // incremental — each symbol available as acquired
  const delay = determineNextDelay();  // short during active work, long when idle
  setTimeout(runAcquisitionCycle, delay);
}
```

**Only one acquisition cycle is ever in flight. Scheduling must never create overlapping cycles.**

### What NOT to build yet

- SQLite persistence (evidence lives in process memory — explicitly transitional, acceptable for single-user local)
- Multiple concurrent clients (single browser assumed, though the architecture naturally supports it)
- Historical snapshots
- Complex generation management
- Cloud deployment concerns
- Delta-based snapshot delivery (measure full-snapshot size first)

### Why this slice

It transforms the operator experience from "scan the market" to "observe the market" with minimal infrastructure. The acquisition worker is just a `setInterval` loop inside the existing Express process — no distributed queue, no separate process, no database.

---

## 5. Browser Responsibility After Transition

| Responsibility | Before | After |
|---------------|--------|-------|
| Acquisition orchestration | Browser | Backend |
| Scan planning | Browser | Backend |
| Session awareness | Browser | Backend |
| Freshness classification | Browser | Backend |
| Crawl state / generation | Browser | Backend |
| IndexedDB market evidence | Browser | Eliminated |
| Durable evidence storage | Browser (IndexedDB) | Backend (memory → SQLite) |
| Recommendation computation | Browser (Wheelwright) | Browser (Wheelwright) — unchanged |
| Policy controls | Browser | Browser — unchanged |
| Rendering | Browser | Browser — unchanged |
| Broker handoff | Browser | Browser — unchanged |
| Portfolio context | Browser | Browser — unchanged |

**The browser becomes dramatically simpler.** The entire `acquire-evidence.ts`, `scan-planner.ts`, `crawl-state.ts`, `durable-cache.ts` (market evidence parts), and `universe-scanner.ts` are eliminated from the frontend.

---

## 6. Backend Responsibility After Transition

| Responsibility | Status |
|---------------|--------|
| Provider credential custody | Already implemented |
| Upstream HTTP calls | Already implemented |
| Request pacing | Already implemented |
| Response caching | Already implemented |
| **Acquisition scheduling** | New |
| **Session awareness** | New (moved from browser) |
| **Universe traversal** | New (moved from browser) |
| **Coverage tracking** | New (moved from browser) |
| **Evidence storage** | New (in-memory map initially) |
| **Snapshot publication** | New |
| **ETag computation** | New |
| **Freshness management** | New (moved from browser) |

---

## 7. Update Delivery: Polling vs Conditional HTTP vs SSE vs WebSockets

### Polling (simple periodic GET)

```
setInterval(() => fetch("/api/evidence/snapshot"), 30000)
```

**Pros:** Simplest. Standard HTTP. Works everywhere. No connection management.
**Cons:** Wasteful if nothing changed. Fixed interval doesn't match evidence-arrival cadence.
**Verdict:** Acceptable baseline. Works for prototype.

### Conditional HTTP (ETag / If-None-Match / 304)

```
fetch("/api/evidence/snapshot", { headers: { "If-None-Match": currentEtag } })
→ 304 (no transfer) or 200 (new snapshot)
```

**Pros:** Standard HTTP. Zero-cost when unchanged. Browser HTTP cache can participate. Semantically correct.
**Cons:** Still requires polling interval decision. Slightly more complex than bare GET.
**Verdict:** **Recommended.** Combines polling simplicity with transfer efficiency. The natural fit for evidence that changes in discrete generations (not continuously).

### Server-Sent Events (SSE)

```
const es = new EventSource("/api/evidence/stream");
es.onmessage = (e) => updateSnapshot(JSON.parse(e.data));
```

**Pros:** Server pushes when ready. No polling interval to tune. Reconnects automatically.
**Cons:** Persistent connection. Slightly more complex server-side. Payload management (full snapshot per event? delta?). Not needed if polling at 30-60s is acceptable.
**Verdict:** Good future option. Overkill for first slice. Consider when evidence changes frequently enough that 30s polling feels laggy.

### WebSockets

**Pros:** Bidirectional. Low latency.
**Cons:** Connection management. Reconnection logic. State synchronization. Bidirectionality not needed (server → browser is sufficient). Significantly more complex.
**Verdict:** **Not recommended.** The evidence update pattern is unidirectional and infrequent (every 30-120 seconds). WebSockets solve a latency problem that doesn't exist here.

### Recommendation

**Conditional HTTP polling at 30-second intervals.**

Simple. Standard. Efficient (304 when unchanged). No persistent connections. Works with any reverse proxy or load balancer. Upgradable to SSE later if 30s latency becomes unacceptable.

---

## 8. System-of-Record Recommendation

### Current: Browser IndexedDB is the system of record

Evidence survives page reloads but not browser clears. Only one "client" (the browser) ever reads or writes. The backend has no durable knowledge of what evidence exists.

### Recommended transition: Backend in-memory → Backend SQLite

**Phase 1 (this slice):** Backend holds evidence in process memory. Sufficient for single-user local deployment. Evidence lost on server restart (browser IndexedDB serves as warm backup during transition).

**Phase 2 (future):** Backend SQLite becomes the durable system of record. Survives process restarts. Browser no longer needs IndexedDB for market evidence. The server is authoritative.

### Why backend should be system of record

- **Resilience:** Evidence survives browser clears, profile resets, and device switches
- **Cloud readiness:** A deployed server maintains evidence independently of browser lifecycle
- **Multi-client:** Multiple browser sessions observe the same evidence (future)
- **Historical:** Evidence history becomes naturally available for analysis (future)
- **Simplicity:** One authoritative store, not two (IndexedDB + server) that can diverge

### Transition strategy

During the transition, both stores exist:
- Backend acquires and serves evidence via snapshot endpoint
- Browser's IndexedDB remains populated (from prior scans or as fallback)
- Browser prefers backend snapshot when available
- If backend is unavailable, browser can fall back to local IndexedDB

Once backend is proven stable, IndexedDB market evidence is removed.

---

## 9. Risks, Assumptions, and Open Questions

### Risks

| Risk | Mitigation |
|------|-----------|
| In-memory evidence lost on crash/restart | Acceptable for transitional slice. Explicitly labeled as process-lifetime authority. SQLite in Phase 2. Browser IndexedDB as warm backup during transition. |
| Snapshot payload size (~2-5MB for 496 chains) | Measure from day one. Acceptable for local HTTP with gzip. If problematic, consider delta snapshots (changed symbols only) or manifest+per-symbol resources. |
| 30s polling creates stale UX during rapid acquisition | Acceptable. Evidence publishes incrementally — each poll sees improvement. Operator observes coverage growing. |
| Backend timer drift or starvation under load | Self-scheduling prevents overlap. Single-user local deployment — load is minimal. |
| Session-awareness duplicated (browser + backend during transition) | Feature flag isolates modes. Only one mode active at a time. |
| Overlapping acquisition cycles | Prevented by design: non-overlapping self-scheduling. Only one cycle is ever in flight. |

### Required telemetry (measure from day one)

- Serialized snapshot size (bytes, gzipped bytes)
- Number of symbols changed per generation increment
- Bytes transferred during a cold bootstrap (first full snapshot)
- Frontend merge/parse time for received snapshot
- Acquisition cycle duration
- Symbols acquired per cycle
- Time between snapshot publications

### Assumptions requiring validation

1. The Tradier sandbox does not throttle differently for server-originated vs browser-originated requests
2. A single Express process can handle acquisition + serving snapshots without blocking
3. The evidence snapshot payload (all 496 chains) is acceptable as a single HTTP response
4. 30-second polling latency is acceptable to the operator during active sessions
5. The `OptionsChain` domain type is suitable as the snapshot contract (or minimal transformation needed)

### Open Questions

1. **Should the backend also compute recommendations?** Not initially. Wheelwright stays client-side for instant policy recomputation. May migrate later for multi-user governance.

2. **What triggers the first acquisition?** Server startup + market session detection. No operator action required.

3. **How does the operator request a priority refresh?** A lightweight endpoint: `POST /api/evidence/refresh?symbol=XLE`. Not the primary acquisition path — just a nudge.

4. **Should evidence snapshots be versioned/immutable?** Eventually yes (for replay). Initially, the "current" endpoint always serves the latest.

5. **When does IndexedDB market evidence get removed from the browser?** After the backend has proven stable for 2+ weeks of daily use. Feature-flagged.

---

## 10. The Central Question

> Should Write Desk eventually become an observer of continuously maintained evidence rather than the initiator of evidence acquisition?

**Yes.**

The Write Desk's purpose is decision support — "what should I write today?" That question is answered by applying policy to evidence. The evidence should already exist when the question is asked.

An operator opening the Write Desk should experience:

```
Evidence: 496/496 ready · Jul 16 · 2 min ago
```

Not:

```
Click Scan to begin evidence acquisition...
```

The Scan button becomes either:
- **"Refresh Now"** — an administrative action to force immediate re-acquisition of a specific symbol or the full universe
- **Eliminated entirely** — evidence freshness is a service-level concern, not an operator action

The natural evolution:

| Phase | Operator experience |
|-------|-------------------|
| Current | Click Scan → wait → see results |
| Transitional | Open Write Desk → evidence already available (backend acquired) → Refresh if needed |
| Target | Open Write Desk → evidence is always current → just make decisions |

---

## 11. Smallest Architectural Step

**Add a background acquisition loop to the existing evidence-service process.**

This transforms the service from a passive proxy into an active acquirer:

```
Before:  Browser asks → backend fetches → browser stores
After:   Backend fetches continuously → browser observes current state
```

The step is small because:
- It reuses the existing `TradierAdapter`, `ResponseCache`, and `RequestPacer`
- It adds a timer loop (no distributed queue)
- It stores evidence in a simple in-memory map (no database)
- It exposes one new endpoint (`GET /api/evidence/snapshot`)
- It preserves the existing proxy endpoints as fallback
- The frontend change is a feature flag: use snapshot endpoint instead of per-symbol calls

The step is meaningful because:
- The operator no longer initiates acquisition
- Evidence exists before the browser connects
- The Scan button becomes optional
- The architecture proves "observe" over "initiate"
- The path to SQLite, cloud deployment, and multi-client is clear
