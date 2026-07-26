# Component Responsibility Map

**Status:** Authoritative as of July 2026
**Supersedes:** Prior version (browser-owned acquisition era)

---

## How to Read This Document

Each component lists:
- **Responsibility** — what it owns
- **Inputs** — what it receives
- **Outputs** — what it produces
- **Must not** — boundary constraints

Components are organized by runtime boundary (Java backend vs browser frontend).

---

## Java Backend (evidence-service-java)

### `AcquisitionWorker`

| Property | Value |
|----------|-------|
| **Responsibility** | Self-scheduling background evidence acquisition. Single cycle in flight. Session-gated. |
| **Inputs** | Universe symbols (from DB), scheduler config, session gate decision, provider adapter. |
| **Outputs** | Evidence written to SQLite. Telemetry snapshot. Publication triggers. |
| **Must not** | Produce recommendations. Rank candidates. Know about portfolio state. |

### `SessionGate`

| Property | Value |
|----------|-------|
| **Responsibility** | Determine whether acquisition is permitted at the current instant. |
| **Inputs** | Clock (injectable). |
| **Outputs** | `SessionDecision { permitted, reason }`. |
| **Must not** | Make provider calls. Store state. Depend on evidence. |

### `SqliteEvidenceStore`

| Property | Value |
|----------|-------|
| **Responsibility** | Durable evidence persistence. Universe management. Work queue. Classification. |
| **Inputs** | Symbol evidence (expirations, chains, failures). Universe seed. |
| **Outputs** | Prioritized work queue. Classified population. Evidence snapshots. Generation counter. |
| **Must not** | Make provider calls. Produce recommendations. |

### `TradierAdapter`

| Property | Value |
|----------|-------|
| **Responsibility** | Provider communication. Credential custody. Response normalization. |
| **Inputs** | Symbol, expiration. API credential. |
| **Outputs** | Normalized `MarketExpiration[]`, `MarketChain`. |
| **Must not** | Store evidence. Know about scheduling. Leak Tradier response shapes. |

### `RequestPacer`

| Property | Value |
|----------|-------|
| **Responsibility** | Rate-limit compliance. Queue-based serialization of provider calls. |
| **Inputs** | Callable tasks. Rate configuration (0.9 req/sec). |
| **Outputs** | Paced execution. Queue depth and rejection metrics. |
| **Must not** | Decide what to acquire. Know about evidence or scheduling. |

### `SnapshotController`

| Property | Value |
|----------|-------|
| **Responsibility** | Serve evidence snapshot with conditional HTTP (ETag/304). |
| **Inputs** | HTTP request (optional If-None-Match header). Store state. |
| **Outputs** | v1 JSON snapshot or 304 Not Modified. ETag header. |
| **Must not** | Trigger acquisition. Modify evidence. |

### `StatusController`

| Property | Value |
|----------|-------|
| **Responsibility** | Expose scheduler state, telemetry, evidence meta, pacer/cache diagnostics. |
| **Inputs** | Worker status. Scheduler telemetry. Store metrics. |
| **Outputs** | JSON status response. |
| **Must not** | Trigger acquisition. Modify state. |

### `NudgeController`

| Property | Value |
|----------|-------|
| **Responsibility** | Allow operator to request immediate cycle assessment. |
| **Inputs** | POST request. |
| **Outputs** | `{"status":"nudged"}`. Worker nudge side-effect. |
| **Must not** | Bypass session gate. Guarantee cycle execution. |

---

## Browser Frontend — Recommendation Layer

### `src/write-desk/recommend.ts` (`recommendPuts`)

| Property | Value |
|----------|-------|
| **Responsibility** | Generate ranked put candidates from cached evidence + policy + portfolio. |
| **Inputs** | Universe symbols, deployable cash, durable cache, policy, session state. |
| **Outputs** | Ranked `PutCandidate[]`, funnel metrics, coverage requests. |
| **Must not** | Make provider calls. Modify cache. Know about UI state. |

### `src/write-desk/recommend-calls.ts` (`recommendCalls`)

| Property | Value |
|----------|-------|
| **Responsibility** | Generate ranked call candidates for held inventory from cached evidence. |
| **Inputs** | Inventory positions, durable cache, policy, session state. |
| **Outputs** | Ranked `CallCandidate[]`, excluded list. |
| **Must not** | Make provider calls. Modify cache. Evaluate positions without free shares. |

### `src/write-desk/brief-builder.ts`

| Property | Value |
|----------|-------|
| **Responsibility** | Build the Wheelwright Recommendation Brief view model. |
| **Inputs** | PutCandidate, policy, portfolio, session, cache, table position. |
| **Outputs** | `WheelwrightBriefViewModel` — decision summary, evidence, neighborhood, impact, provenance. |
| **Must not** | Make provider calls. Modify state. Produce side effects. |

### `src/write-desk/execution-assessment.ts`

| Property | Value |
|----------|-------|
| **Responsibility** | Score contract execution quality. Hard-no detection. Posture assignment. |
| **Inputs** | Contract evidence (bid, ask, spread, OI, volume, delta). Policy thresholds. |
| **Outputs** | `ExecutionAssessment { score, posture, components }`. |
| **Must not** | Know about ranking. Know about affordability. Make provider calls. |

---

## Browser Frontend — Evidence Cache

### `src/cache/durable-cache.ts`

| Property | Value |
|----------|-------|
| **Responsibility** | IndexedDB-backed cache with per-type TTLs. Freshness classification. |
| **Inputs** | Cache records (populated from backend snapshot polling). |
| **Outputs** | `CacheRecord<T>`, freshness classification (fresh, stale_usable, expired, missing). |
| **Must not** | Make provider calls. Own evidence lifecycle. |

---

## Browser Frontend — Portfolio Context

### `src/write-desk/fidelity-snapshot.ts`

| Property | Value |
|----------|-------|
| **Responsibility** | Build normalized PortfolioSnapshot from Fidelity CSV data. |
| **Inputs** | Parsed OptionSummaryRow[], ParsedBalances. |
| **Outputs** | `PortfolioSnapshot` — inventory, cash, existing options, economics, readiness. |
| **Must not** | Make market data calls. Produce recommendations. |

### `src/components/FidelityUpload.tsx`

| Property | Value |
|----------|-------|
| **Responsibility** | Two-file CSV upload UI. Slot management. localStorage persistence. |
| **Inputs** | File uploads (Option Summary + Balances). |
| **Outputs** | Parsed snapshot via callback. Slot state for UI display. |
| **Must not** | Produce recommendations. Make market data calls. |

---

## Browser Frontend — Operator Workbench

### `src/components/WriteDesk.tsx`

| Property | Value |
|----------|-------|
| **Responsibility** | Operator workflow orchestration. Evidence polling. Recommendation triggering. |
| **Inputs** | Portfolio snapshot, backend evidence (via polling), policy state. |
| **Outputs** | Rendered put/call tables, policy controls, drawer trigger, collapse state. |
| **Must not** | Own recommendation logic. Make direct provider calls. |

### `src/components/RecommendationBrief.tsx`

| Property | Value |
|----------|-------|
| **Responsibility** | Right-side drawer for put recommendation inspection. |
| **Inputs** | PutCandidate, policy, portfolio, session, cache environment. |
| **Outputs** | Rendered brief (decision summary, evidence, neighborhood, governance, handoff). |
| **Must not** | Make provider calls. Modify recommendations. Own broker submission. |

---

## Browser Frontend — Broker Handoff

### `src/execution/write-intent.ts`

| Property | Value |
|----------|-------|
| **Responsibility** | Construct broker-neutral WriteIntent from recommendation. |
| **Inputs** | Candidate, quantity, limit price. |
| **Outputs** | `WriteIntent` domain object. |
| **Must not** | Know about Fidelity. Submit orders. Mutate portfolio. |

### `src/execution/fidelity-trade-link.ts`

| Property | Value |
|----------|-------|
| **Responsibility** | Convert WriteIntent to Fidelity pre-populated trade ticket URL. |
| **Inputs** | WriteIntent. |
| **Outputs** | `FidelityTradeLink` — URL + metadata. |
| **Must not** | Submit orders. Interact with credentials. Mutate portfolio state. |

---

## Browser Frontend — Workspace

### `src/workspace/workspace.ts`

| Property | Value |
|----------|-------|
| **Responsibility** | Persist operator preferences in localStorage. Schema evolution via merge. |
| **Inputs** | Partial workspace updates. |
| **Outputs** | Complete `Workspace` (policy knobs, collapse state, display preferences). |
| **Must not** | Store market data. Store portfolio data. Make provider calls. |

---

## Legacy (browser-owned acquisition — pending removal)

The following components belong to the browser-owned acquisition era. They remain in the codebase but are no longer on the active runtime path. The Write Desk now consumes evidence from the backend via snapshot polling rather than acquiring directly.

- `src/write-desk/acquire-evidence.ts` — browser acquisition orchestrator
- `src/cache/scan-planner.ts` — crawl planning
- `src/cache/crawl-state.ts` — generation/cursor tracking
- `src/write-desk/universe-scanner.ts` — universe traversal
- `src/write-desk/scan-orchestrator.ts` — full scan (puts + calls via proxy)
- `src/providers/proxy/ProxyMarketDataProvider.ts` — HTTP proxy to backend market routes

These will be removed during TypeScript backend retirement.
