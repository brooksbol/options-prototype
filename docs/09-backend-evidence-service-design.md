# Backend Evidence Service — Design Document

**Date:** July 2026
**Status:** Proposed (not yet implemented)
**Companion:** `08-adr-backend-evidence-service.md`

---

## 1. Architectural Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        BACKEND EVIDENCE SERVICE                          │
│                                                                         │
│  ┌──────────────┐     ┌────────────────────┐     ┌──────────────────┐  │
│  │   Tradier    │     │  Acquisition       │     │  Evidence Store   │  │
│  │   Adapter    │────▶│  Worker            │────▶│  (SQLite)        │  │
│  │              │     │                    │     │                  │  │
│  │  · Sandbox   │     │  · Session-aware   │     │  · Instruments   │  │
│  │  · Rate limit│     │  · Priority queue  │     │  · Expirations   │  │
│  │  · 60 req/m  │     │  · Retry/backoff   │     │  · Chains        │  │
│  └──────────────┘     │  · Continuous pace  │     │  · Absences      │  │
│                       └────────────────────┘     │  · Generations   │  │
│                                                  └────────┬─────────┘  │
│                                                           │            │
│                       ┌────────────────────┐              │            │
│                       │  Snapshot          │◀─────────────┘            │
│                       │  Publisher         │                           │
│                       │                    │                           │
│                       │  · Coherent snap   │                           │
│                       │  · ETag compute    │                           │
│                       │  · Atomic publish  │                           │
│                       └────────┬───────────┘                           │
└────────────────────────────────┼───────────────────────────────────────┘
                                 │
                                 │ HTTP
                                 │ GET /api/evidence-snapshots/current
                                 │ If-None-Match / ETag / 304
                                 │
┌────────────────────────────────┼───────────────────────────────────────┐
│                        BROWSER (unchanged layers)                       │
│                                │                                        │
│                       ┌────────▼───────────┐                           │
│                       │  Evidence Snapshot  │                           │
│                       │  (in memory)       │                           │
│                       └────────┬───────────┘                           │
│                                │                                        │
│                       ┌────────▼───────────┐                           │
│                       │  Wheelwright        │                           │
│                       │  (local, instant)  │                           │
│                       └────────┬───────────┘                           │
│                                │                                        │
│                       ┌────────▼───────────┐                           │
│                       │  Write Desk        │                           │
│                       │  (operator UI)     │                           │
│                       └────────┬───────────┘                           │
│                                │                                        │
│                       ┌────────▼───────────┐                           │
│                       │  Broker Handoff    │                           │
│                       │  (Fidelity URL)    │                           │
│                       └────────────────────┘                           │
└────────────────────────────────────────────────────────────────────────┘
```

The acquisition worker operates independently of whether a browser is open. Evidence is acquired, stored, and published on its own schedule. The browser consumes snapshots.

---

## 2. Product Behavior Shift

### Current

```
Operator opens Write Desk
  → clicks Scan
  → waits 30–120 seconds for acquisition
  → evaluates provisional recommendations (partial coverage)
  → clicks Rescan repeatedly for convergence
  → manages crawl failures and stalls
```

### Target

```
Backend acquires continuously (independent of browser)
  → operator opens Write Desk
  → latest coherent evidence snapshot is already available
  → recommendations are immediately computed locally
  → evidence continues refreshing independently
  → operator focuses entirely on decisions
```

The Write Desk becomes a pure decision surface rather than a crawl controller.

The Scan button disappears or becomes an administrative action ("request priority refresh for symbol X") rather than the primary acquisition trigger.

Evidence age, session, provider, and coverage are displayed but do not require operator intervention for ordinary operation.

---

## 3. Technology Recommendation

### First implementation

| Component | Choice | Rationale |
|-----------|--------|-----------|
| Language | TypeScript | Shared types with frontend, team familiarity |
| Runtime | Node or Bun | Proven TypeScript server runtimes, no JVM overhead |
| Database | SQLite | Single-user, single-process, zero-config, transactional, sufficient for 496 instruments |
| HTTP | Express or Hono | Lightweight, well-understood |
| Worker | Embedded (setInterval/setTimeout) | No distributed queue needed for single-process |
| Scheduling | In-process timer + session-aware policy | No cron, no external scheduler |

### Why SQLite is sufficient

- Single user, single process
- 496 instruments × ~10 expirations × ~50 chains = manageable dataset
- Transactional writes (no IndexedDB async quirks)
- WAL mode supports concurrent reads during writes
- No deployment infrastructure (file on disk)
- Backup = copy file
- Fast enough for this workload (reads are sub-millisecond)
- Can migrate to PostgreSQL later if multi-user requires it

### What is explicitly excluded

| Excluded | Reason |
|----------|--------|
| PostgreSQL | Unnecessary infrastructure for single-user prototype |
| Redis | No caching layer needed between SQLite and HTTP |
| Kafka/SQS | No distributed event streaming needed |
| Kubernetes | No container orchestration needed |
| Docker | Optional; bare process is simpler for local dev |
| Distributed workers | Single process handles 1 req/sec comfortably |

---

## 4. Data Model Sketch

```sql
-- Instruments in the candidate universe
CREATE TABLE instrument (
  symbol TEXT PRIMARY KEY,
  name TEXT,
  universe_source TEXT NOT NULL,         -- 'yahoo_496', 'priority_watchlist'
  universe_version TEXT NOT NULL,
  structural_metadata TEXT,              -- JSON: product structure, leverage, inverse flags
  first_seen_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- Cached expiration lists per instrument
CREATE TABLE expiration_evidence (
  symbol TEXT NOT NULL,
  provider TEXT NOT NULL,
  expirations_json TEXT NOT NULL,        -- JSON array of {date, dte}
  observed_at TEXT NOT NULL,             -- inferred market observation time
  retrieved_at TEXT NOT NULL,            -- wall clock when fetched
  session_key TEXT NOT NULL,             -- e.g., 'regular-2026-07-15'
  status TEXT NOT NULL DEFAULT 'valid',  -- 'valid', 'stale', 'superseded'
  PRIMARY KEY (symbol, provider)
);

-- Cached option chains per instrument + expiration
CREATE TABLE chain_evidence (
  symbol TEXT NOT NULL,
  expiration TEXT NOT NULL,
  provider TEXT NOT NULL,
  chain_json TEXT NOT NULL,              -- normalized chain payload (puts, calls, underlying)
  observed_at TEXT NOT NULL,
  retrieved_at TEXT NOT NULL,
  session_key TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'valid',
  PRIMARY KEY (symbol, expiration, provider)
);

-- Symbols confirmed to have no options available
CREATE TABLE confirmed_absence (
  symbol TEXT NOT NULL,
  evidence_type TEXT NOT NULL,           -- 'no_expirations', 'no_chain'
  reason TEXT,
  observed_at TEXT NOT NULL,
  session_key TEXT NOT NULL,
  valid_until TEXT,                       -- NULL = valid until next session
  PRIMARY KEY (symbol, evidence_type)
);

-- Acquisition job queue
CREATE TABLE acquisition_job (
  id TEXT PRIMARY KEY,
  symbol TEXT NOT NULL,
  evidence_type TEXT NOT NULL,           -- 'expirations', 'chain'
  target_expiration TEXT,                -- NULL for expirations jobs
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'in_progress', 'completed', 'failed', 'cancelled'
  priority INTEGER NOT NULL DEFAULT 100, -- lower = higher priority
  attempts INTEGER NOT NULL DEFAULT 0,
  max_attempts INTEGER NOT NULL DEFAULT 3,
  next_attempt_at TEXT NOT NULL,
  last_error TEXT,
  leased_at TEXT,                        -- NULL when not in-progress
  lease_expires_at TEXT,
  created_at TEXT NOT NULL,
  completed_at TEXT
);

-- Acquisition attempt history (append-only)
CREATE TABLE acquisition_attempt (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  job_id TEXT NOT NULL REFERENCES acquisition_job(id),
  started_at TEXT NOT NULL,
  completed_at TEXT,
  provider TEXT NOT NULL,
  http_status INTEGER,
  response_time_ms INTEGER,
  error_message TEXT,
  result TEXT                            -- 'success', 'error', 'timeout', 'rate_limited'
);

-- Evidence generation tracking
CREATE TABLE evidence_generation (
  id TEXT PRIMARY KEY,
  session_key TEXT NOT NULL,             -- 'regular-2026-07-15'
  universe_version TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'building', -- 'building', 'complete', 'stalled', 'superseded'
  started_at TEXT NOT NULL,
  published_at TEXT,
  ready_count INTEGER NOT NULL DEFAULT 0,
  absence_count INTEGER NOT NULL DEFAULT 0,
  pending_count INTEGER NOT NULL DEFAULT 0,
  failure_count INTEGER NOT NULL DEFAULT 0,
  total_symbols INTEGER NOT NULL
);

-- Published snapshots (the API serves the latest)
CREATE TABLE evidence_snapshot (
  id TEXT PRIMARY KEY,
  generation_id TEXT NOT NULL REFERENCES evidence_generation(id),
  etag TEXT NOT NULL UNIQUE,
  published_at TEXT NOT NULL,
  schema_version INTEGER NOT NULL DEFAULT 1,
  coverage_json TEXT NOT NULL,           -- JSON coverage summary
  payload_bytes INTEGER                  -- size tracking
);

-- Indexes for common queries
CREATE INDEX idx_job_status_priority ON acquisition_job(status, priority, next_attempt_at);
CREATE INDEX idx_job_symbol ON acquisition_job(symbol);
CREATE INDEX idx_chain_session ON chain_evidence(session_key);
CREATE INDEX idx_generation_session ON evidence_generation(session_key);
CREATE INDEX idx_snapshot_published ON evidence_snapshot(published_at DESC);
```

This schema is a design sketch. Column types, constraints, and indexes will be refined during implementation.

---

## 5. Acquisition Model

### Continuous crawl

The acquisition worker runs continuously in the server process. It does not require an operator click.

```
while (server is running):
  if (market session permits acquisition):
    select next job from queue (by priority, then next_attempt_at)
    execute acquisition (expirations or chain)
    record result
    schedule follow-up work (expirations → chain for primary expiration)
    sleep ~1 second (safe pace within 60 req/min)
  else:
    sleep 30 seconds (check again later)
```

### Rate budget

- Tradier sandbox: 60 requests per minute
- Safe default pace: 1 request per second (leaves headroom for bursts)
- Acquisition is never operator-triggered in steady state
- Administrative "priority refresh" may consume burst capacity

### Acquisition progression

For each symbol, the progression is:

```
1. Fetch expirations (market-insensitive, always permitted)
   → no expirations? Record confirmed absence. Done.
   → has expirations? Select primary expiration. Schedule chain job.

2. Fetch primary chain (market-sensitive, session-gated)
   → success? Symbol is recommendation-ready.
   → failure? Retry with backoff.
```

This two-step progression is a domain requirement, not a frontend artifact. The backend implements it with explicit job dependencies rather than multi-pass priority interleaving.

### Retry with bounded backoff

```
Attempt 1: immediate
Attempt 2: 60 seconds
Attempt 3: 5 minutes
After max_attempts: mark failed, exclude from generation coverage
```

### Session-aware validity

The acquisition worker observes the same 6-state session model:

- **REGULAR_OBSERVATION / DELAY_DRAIN:** All acquisition permitted
- **PREMARKET / REGULAR_OPEN_DELAY:** Expirations only (market-insensitive)
- **CLOSED_CANONICAL / NON_TRADING_DAY:** Expirations only; existing canonical chains remain valid

### Confirmed absence

When a symbol has no expirations (Tradier returns empty), record a `confirmed_absence` entry. This is valid for the current session. Do not retry within the same session.

### Process restart recovery

On startup:
1. Check for in-progress jobs with expired leases → reset to pending
2. Resume the current generation from the job queue
3. No cursor to reconcile — the queue IS the remaining work

This is fundamentally simpler than the browser crawl's cursor/generation/in-memory divergence problem.

### Recommendation-ready definition (single shared contract)

An instrument is recommendation-ready when:

1. It has valid expiration evidence for the current session
2. It has a valid chain for its primary expiration (per PrimaryExpirationPolicy)
3. The chain includes puts with non-zero bids
4. OR it has a confirmed absence (not recommendation-ready, but coverage-complete)

This definition is used by both the acquisition worker (to determine when a symbol's jobs are complete) and the frontend Wheelwright (to determine what it can rank). There is exactly one definition.

---

## 6. Snapshot Publication Model

### Coherence requirement

A snapshot must be coherent. The API must never expose a partially-written combination of old and new evidence as though it is canonical.

### Publication strategy

```
1. Acquisition worker updates evidence tables continuously
   (chain_evidence, expiration_evidence, confirmed_absence)

2. Periodically (every N completions or every M seconds):
   - Recompute coverage counts
   - If coverage improved since last publication:
     - Create new evidence_generation record (or update existing)
     - Compute ETag from generation state
     - Insert evidence_snapshot record
     - New snapshot is now "current"

3. The previous published snapshot remains available
   (the API serves the latest published_at)

4. Acquisition may continue after publication
   (next snapshot publishes when meaningful progress occurs)
```

### Publication triggers

- Every 20 symbols becoming recommendation-ready (batch publication)
- Session state transition (sealed evidence at session close)
- Administrative request (operator forces snapshot update)
- No publication when nothing has changed (ETag is stable)

### Snapshot immutability

Once published, a snapshot's content does not change. New evidence creates a new snapshot. This makes ETags reliable and conditional GETs correct.

---

## 7. Snapshot API Contract

### Endpoint

```
GET /api/evidence-snapshots/current
```

### Request headers

```
If-None-Match: "regular-2026-07-15-g18"
```

### Response: 304 (unchanged)

```
HTTP/1.1 304 Not Modified
ETag: "regular-2026-07-15-g18"
```

### Response: 200 (new snapshot)

```
HTTP/1.1 200 OK
ETag: "regular-2026-07-15-g19"
Cache-Control: private, no-cache
Content-Type: application/json
```

```json
{
  "snapshotId": "regular-2026-07-15-g19",
  "schemaVersion": 1,
  "session": {
    "type": "REGULAR_OBSERVATION",
    "marketDate": "2026-07-15",
    "canonicalSessionKey": "regular-2026-07-15"
  },
  "coverage": {
    "universe": 496,
    "recommendationReady": 338,
    "confirmedNoOptions": 118,
    "pending": 40,
    "failed": 0
  },
  "instruments": [
    {
      "symbol": "XLE",
      "name": "Energy Select Sector SPDR Fund",
      "primaryExpiration": "2026-07-24",
      "primaryDte": 9,
      "status": "recommendation_ready"
    }
  ],
  "chains": [
    {
      "symbol": "XLE",
      "expiration": "2026-07-24",
      "underlying": { "symbol": "XLE", "name": "Energy Select Sector SPDR Fund", "price": 88.50 },
      "puts": [],
      "calls": [],
      "observedAt": "2026-07-15T13:30:00Z",
      "retrievedAt": "2026-07-15T13:45:12Z",
      "sessionKey": "regular-2026-07-15"
    }
  ],
  "provenance": {
    "provider": "tradier",
    "environment": "sandbox",
    "generationId": "regular-2026-07-15-g19",
    "publishedAt": "2026-07-15T13:50:00Z",
    "acquisitionPace": "1 req/sec",
    "sessionState": "REGULAR_OBSERVATION"
  }
}
```

### Payload strategy decision

For the first implementation: **Option A — complete normalized evidence snapshot.**

Rationale:
- 496 instruments with one primary chain each = manageable payload (~2-5 MB compressed)
- Wheelwright needs the full universe to rank (top-20 is a ranking output, not an input filter)
- Simplest implementation (one GET, full local state)
- Eliminates pagination/streaming complexity
- gzip compression makes transfer practical

Future considerations:
- If payload exceeds ~10 MB, consider delta snapshots (only changed instruments)
- If multi-user, consider per-policy filtered snapshots
- Never paginate in a way that prevents local Wheelwright recomputation

### Cache-Control semantics

`Cache-Control: private, no-cache` means:
- `private`: only the single user's browser may cache (no shared CDN)
- `no-cache`: the browser may retain the response but must revalidate before using it

This permits the browser to hold the last snapshot in HTTP cache and avoid re-download when the ETag matches. It does NOT mean "do not store."

---

## 8. Client Behavior

### On load

```
1. Fetch GET /api/evidence-snapshots/current
2. Store snapshot in memory
3. Run Wheelwright locally with current policy + portfolio
4. Render Write Desk immediately
```

### On policy change

```
1. Rerun Wheelwright locally (zero network)
2. Re-render recommendations instantly
```

### On periodic refresh (poll or visibility change)

```
1. Fetch GET /api/evidence-snapshots/current
   with If-None-Match: <current ETag>
2. If 304: do nothing (evidence unchanged)
3. If 200: update in-memory snapshot, rerun Wheelwright, re-render
```

### During refresh

- Never blank the Recommendation Board while a newer snapshot is loading
- Display the last coherent snapshot until the new one arrives
- Show a subtle indicator ("refreshing..." or updated timestamp) rather than clearing state

### Evidence display

Show in the compact header:
- Evidence age (time since snapshot publication)
- Session state
- Coverage (e.g., "338 / 496 ready")
- Provider

Detailed acquisition telemetry (jobs queued, in-flight, retry count) belongs in Labs & Diagnostics, not the operational header.

### Frontend persistence (retained)

| Persisted | Storage | Reason |
|-----------|---------|--------|
| UI preferences | localStorage | Survives reload |
| Selected recommendation | React state | Session-only |
| Portfolio import (Fidelity CSVs) | React state + localStorage | User action |
| Open-order reservations | localStorage | Survives reload |
| Draft Write Intents | React state | Session-only |
| Last evidence snapshot | HTTP cache (browser-managed) | Conditional GET revalidation |
| Recommendation Policy | localStorage | Survives reload |

### Frontend persistence (removed)

| Removed | Was | Reason for removal |
|---------|-----|-------------------|
| IndexedDB market evidence | Durable cache | Backend owns evidence |
| Crawl state / cursor / generation | IndexedDB | Backend owns acquisition |
| Per-symbol evaluation state | IndexedDB | Backend owns job state |
| Scan planner config | Memory | No client-side planning |
| Acquisition telemetry | Memory | Backend provides via API |


---

## 9. Conditional GET Semantics

### What ETag identifies

The ETag identifies a **published evidence snapshot** — a single coherent point-in-time view of all market evidence. It does not identify individual cache entries, individual instruments, or individual chains.

```
ETag: "regular-2026-07-15-g19"
       ├─ session key ─────┤ ├─ generation sequence
```

### What 304 means

`304 Not Modified` means: the published coherent snapshot has not changed since the client last received it. The backend may have acquired new evidence since then, but it has not published a new snapshot yet. The client's held copy is still the latest published state.

### What `Cache-Control: private, no-cache` means

- `private`: Response is intended for a single user. No shared proxy or CDN may store it.
- `no-cache`: The browser may retain the response locally, but must revalidate (send `If-None-Match`) before using it. This is NOT "do not store."

Together: the browser stores the last snapshot response, but always asks "has it changed?" before treating it as current. When the server answers 304, zero bytes transfer and zero re-rendering occurs.

### What conditional GETs do NOT replace

Conditional GETs simplify delivery. They do not replace:

- Acquisition scheduling (the worker still decides what to fetch and when)
- Freshness policy (the service still determines when evidence expires)
- Generation management (the service still tracks coverage progress)
- Session-aware validity (the service still knows when chains become stale)
- Retry logic (the service still handles provider failures)
- Rate budgeting (the service still respects Tradier's 60 req/min)

The conditional GET is the **delivery mechanism**. The backend acquisition model is the **production mechanism**. They are distinct concerns.

### Why this is well-suited to options evidence

Options evidence changes in snapshot-sized increments — not in real-time streams. A chain fetched at 10:15 AM is valid for 5-15 minutes. Evidence changes happen at the generation level (new chains acquired, coverage improves) rather than at the individual-quote level.

This makes ETags ideal: the service can expose one strong statement:

> *This is the latest coherent evidence snapshot currently available.*

The browser does not need to understand crawl cursor position, job queue state, retry counts, or partial writes. It receives a complete, internally consistent evidence state — or confirms its held copy is still current.

---

## 10. Migration Path

### Phase 0: Freeze and Document

- Freeze major investment in browser crawl features
- Retain current frontend implementation as reference and operational fallback
- Document existing evidence normalization contracts (OptionsChain shape, expiration format, chain structure)
- Document the shared readiness definition
- Extract canonical type definitions into a form that can be shared

**Rollback:** N/A — no code changes.

### Phase 1: Extract Shared Contracts

- Create a shared TypeScript package (or directory) for types used by both frontend and backend:
  - Normalized instrument metadata
  - Expiration evidence shape
  - Option chain evidence shape (OptionsChain)
  - Evidence provenance
  - Session key format
  - Evidence readiness contract
  - Evidence snapshot schema
  - Recommendation Policy types
  - Wheelwright input/output types
  - WriteIntent types
- Move existing domain types into the shared location
- Verify frontend still builds and passes tests using shared types

**Rollback:** Revert shared package, restore co-located types.

### Phase 2: Backend Service — Parallel Operation

- Create backend service (TypeScript, SQLite, HTTP)
- Implement Tradier adapter (reuse existing TradierProvider logic)
- Implement acquisition worker with continuous crawl
- Implement SQLite evidence storage
- Implement snapshot publication
- Implement `GET /api/evidence-snapshots/current` with ETag
- Run backend acquisition in parallel with frontend acquisition
- Compare outputs for selected symbols (automated or manual spot-check)
- Backend serves snapshots but frontend does not consume them yet

**Rollback:** Stop backend process. Frontend continues operating independently.

### Phase 3: Frontend Consumes Backend Snapshots

- Add feature flag: `EVIDENCE_SOURCE=backend` (default: `frontend`)
- When `backend`: Write Desk fetches snapshot from API instead of running local acquisition
- Wheelwright receives evidence from snapshot (same types, different source)
- Compare recommendation outputs: backend-sourced vs frontend-sourced evidence
- Verify identical Wheelwright behavior for equivalent evidence
- Keep browser-owned acquisition code intact but inactive behind flag

**Rollback:** Set `EVIDENCE_SOURCE=frontend`. No code removal needed.

### Phase 4: Backend as Default

- Make `EVIDENCE_SOURCE=backend` the default
- Remove Scan/Rescan button (or convert to "request priority refresh" admin action)
- Remove crawl progress UI from the main operational header
- Move acquisition telemetry into Labs & Diagnostics (fetched from backend API)
- Frontend no longer makes Tradier API calls
- IndexedDB market evidence stores become unused

**Rollback:** Set `EVIDENCE_SOURCE=frontend`. Restore Scan button visibility.

### Phase 5: Remove Frontend Acquisition Code

- Remove IndexedDB market evidence stores
- Remove crawl state service
- Remove scan planner
- Remove acquire-evidence.ts
- Remove universe-scanner.ts
- Remove frontend Tradier rate-limit logic
- Remove .env.local Tradier credentials (credentials now backend-only)
- Archive removed code in a branch or tag for reference

**Rollback:** Restore from archive branch. This phase is irreversible in main — execute only after stabilization period.

---

## 11. Shared Contracts

The following types/contracts should become shared packages (or a shared directory importable by both frontend and backend):

### Evidence types

| Contract | Current Location | Shared? |
|----------|-----------------|---------|
| `OptionsChain` (underlying, puts, calls, dataQuality) | `src/domain/types.ts` | Yes |
| `Expiration` (date, dte) | `src/domain/types.ts` | Yes |
| `OptionContract` (strike, bid, ask, delta, OI, volume) | `src/domain/types.ts` | Yes |
| Evidence provenance metadata | `src/market-session/evidence-provenance.ts` | Yes |
| Session key format | `src/market-session/session-policy.ts` | Yes |
| Market session states (6 states) | `src/market-session/session-policy.ts` | Yes |
| Primary expiration selection policy | `src/market-session/primary-expiration-policy.ts` | Yes |

### Recommendation types

| Contract | Current Location | Shared? |
|----------|-----------------|---------|
| `RecommendationPolicy` | `src/write-desk/recommend.ts` | Yes |
| `ContractSelectionPolicy` | `src/write-desk/recommend.ts` | Yes |
| `RankingPolicy` | `src/write-desk/recommend.ts` | Yes |
| `PutCandidate` | `src/write-desk/scan-orchestrator.ts` | Yes (output shape) |
| `WriteIntent` | `src/execution/write-intent.ts` | Yes |

### Snapshot contract

| Contract | Location | Notes |
|----------|----------|-------|
| Evidence snapshot schema | New (shared) | Defines the API response shape |
| Coverage summary | New (shared) | Universe/ready/absent/pending/failed |
| Instrument readiness status | New (shared) | recommendation_ready / pending / absent / failed |

### Provider-specific types that must NOT leak

| Type | Stays In |
|------|----------|
| Tradier API response shapes | Backend only |
| Tradier authentication | Backend only |
| Provider HTTP client internals | Backend only |
| Raw JSON before normalization | Backend only |

---

## 12. Observability

### Backend diagnostics (exposed via API or admin endpoint)

```
GET /api/admin/status
```

```json
{
  "session": {
    "state": "REGULAR_OBSERVATION",
    "canonicalDate": "2026-07-15",
    "acquisitionPermitted": true
  },
  "generation": {
    "id": "regular-2026-07-15-g19",
    "status": "building",
    "startedAt": "2026-07-15T09:45:00Z"
  },
  "coverage": {
    "total": 496,
    "recommendationReady": 338,
    "confirmedAbsence": 118,
    "pending": 37,
    "failed": 3
  },
  "jobs": {
    "queued": 37,
    "inFlight": 1,
    "completedToday": 412,
    "failedToday": 3,
    "retriesToday": 5
  },
  "provider": {
    "requestsThisMinute": 42,
    "rateLimitBudget": 60,
    "lastRequestAt": "2026-07-15T14:22:31Z",
    "consecutiveFailures": 0
  },
  "snapshot": {
    "latestEtag": "regular-2026-07-15-g19",
    "publishedAt": "2026-07-15T14:20:00Z",
    "payloadBytes": 3200000,
    "snapshotsPublishedToday": 14
  },
  "uptime": "5h 32m"
}
```

### What the Write Desk shows (compact)

```
Evidence: 338 / 496 ready · Jul 15 · Tradier · 2 min ago
```

### What Labs & Diagnostics shows (detailed)

- Full backend status JSON
- Acquisition job history
- Provider request/failure timeline
- Generation history
- Snapshot publication log
- Per-symbol evidence age

---

## 13. Security and Deployment

### Credentials

- Tradier API token: backend-only (environment variable or secrets file)
- No provider credentials in frontend code or .env.local
- No broker credentials anywhere (Fidelity handoff is URL-only, browser-side)

### Network binding

- Default: `localhost:3100` (or similar local port)
- No public exposure without explicit configuration
- No authentication needed for single-user local deployment
- If later exposed beyond localhost: add API key or session auth

### Fidelity handoff

- Remains entirely browser-side
- Backend has no knowledge of Fidelity URLs, credentials, or order state
- No trade submission from the backend (ever, without a separate explicit decision)

### Backup and migration

- SQLite backup = copy the .db file
- Include backup in development machine documentation
- Schema migrations via versioned SQL files (1_initial.sql, 2_add_column.sql)
- Migration runs on startup if schema version is behind

### Local development

```
Terminal 1: cd evidence-service && npm start    (backend on :3100)
Terminal 2: cd options-prototype && npm run dev (Vite on :5173)
```

Frontend Vite proxy config points `/api/*` to `localhost:3100`.

---

## 14. Non-Goals for the First Extraction

| Excluded | Reason |
|----------|--------|
| Server-side order submission | Execution boundary remains browser-side |
| Broker credential storage | No broker integration in backend |
| Multi-user tenancy | Single operator prototype |
| Distributed workers | Single process at 1 req/sec is sufficient |
| Event streaming (WebSocket/SSE) | Polling with conditional GET is simpler and sufficient |
| Server-side Wheelwright | Preserves instant local policy recomputation |
| Mobile clients | Desktop browser is the operator surface |
| Cloud-scale infrastructure | Local SQLite on local machine |
| Real-time streaming market data | Tradier sandbox is 15-min delayed; streaming adds no value |
| Historical evidence replay | Future concern; snapshot immutability enables it later |
| Multi-provider aggregation | Tradier is sole provider for now |
| Options Greeks computation | Consumed from provider, not computed |

---

## 15. Testing Strategy

### Backend unit tests

| Area | Tests |
|------|-------|
| Session-aware validity | Market-sensitive blocked during closed; insensitive always permitted |
| Expiration-to-chain progression | Expirations discovered → chain job auto-created |
| Retry and backoff | Failed job retries at correct intervals; max_attempts respected |
| Rate-budget compliance | Worker respects 60 req/min; burst does not exceed limit |
| Confirmed absence | Empty expirations → absence recorded; not retried in same session |
| Single readiness definition | Backend and frontend agree on "recommendation_ready" |
| Atomic snapshot publication | Partial generation never exposed as current snapshot |
| ETag computation | Same evidence → same ETag; changed evidence → different ETag |
| Deterministic snapshot payload | Same inputs → byte-identical JSON (sorted keys, stable order) |
| Process restart recovery | In-progress jobs with expired leases → reset to pending |
| Job queue priority | Chains before expirations for symbols with known expirations |

### Integration tests

| Area | Tests |
|------|-------|
| Full acquisition cycle | Symbol goes from unknown → expirations → chain → recommendation_ready |
| Conditional GET behavior | 304 when unchanged; 200 with new ETag when snapshot updated |
| Client snapshot consumption | Wheelwright produces identical results from backend vs frontend evidence |
| Parallel operation | Backend and frontend produce same evidence for same symbol |

### Frontend tests (post-migration)

| Area | Tests |
|------|-------|
| Snapshot fetch on load | Renders recommendations from snapshot |
| Conditional refresh | 304 → no re-render; 200 → updates recommendations |
| Policy change without network | Recomputes locally from held snapshot |
| Stale snapshot display | Shows last snapshot while refreshing; never blanks board |
| Feature flag toggle | Switches between frontend and backend evidence sources |

---

## 16. Documentation Reconciliation

### Documents that remain valid

| Document | Reason |
|----------|--------|
| `07-architecture-current.md` | Describes the system as of the frontend-only phase. Becomes historical once backend is operational. |
| `07a-component-map-current.md` | Frontend components remain. Acquisition components become "archived." |
| `07b-diagrams.md` | Session state machine and Brief layout remain. Data flow diagram needs backend version. |
| `07c-adrs.md` | All 10 ADRs remain valid (Wheelwright, rank independence, broker handoff, etc.) |
| `foundations/*` | Policy-over-prediction, closed-loop engineering — all still apply |
| `00-project-charter.md` | Project intent unchanged |

### Documents requiring updates

| Document | Update Needed |
|----------|--------------|
| `07-architecture-current.md` | Add backend layer; mark acquisition section as "migrating to backend" |
| `07a-component-map-current.md` | Mark acquisition components (acquire-evidence, scan-planner, crawl-state) as "deprecated — backend migration" |
| `07b-diagrams.md` | Add backend data-flow diagram alongside current frontend diagram |

### Frontend crawl documents that become historical

| Document/Code | Disposition |
|---------------|-------------|
| `src/write-desk/acquire-evidence.ts` | Archive after Phase 5 |
| `src/cache/scan-planner.ts` | Archive after Phase 5 |
| `src/cache/crawl-state.ts` | Archive after Phase 5 |
| `src/cache/durable-cache.ts` (market evidence parts) | Archive after Phase 5 |
| `src/write-desk/universe-scanner.ts` | Archive after Phase 5 |
| `tests/cache/crawl-recovery.test.ts` | Archive after Phase 5 |

### ADRs superseded

| ADR | Superseded by |
|-----|--------------|
| None fully superseded | ADR-007 (Session-Aware Evidence Governance) evolves into backend implementation but remains conceptually valid |

### New documentation needed

| Document | Purpose |
|----------|---------|
| `08-adr-backend-evidence-service.md` | ✅ Written |
| `09-backend-evidence-service-design.md` | ✅ This document |
| Backend README | Setup, running, configuration |
| API reference | Endpoint documentation |
| Schema migration guide | How to evolve SQLite schema |
| Deployment guide | How to run backend + frontend together |
