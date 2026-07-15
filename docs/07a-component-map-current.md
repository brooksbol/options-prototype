# Options Prototype — Component Responsibility Map

**Status:** Authoritative as of July 2026
**Supersedes:** `05a-component-map.md` (Slice 1 only)

---

## How to Read This Document

Each component lists:
- **Responsibility** — what it owns
- **Inputs** — what it receives
- **Outputs** — what it produces
- **Must not** — boundary constraints

---

## Evidence Acquisition Layer

### `src/write-desk/acquire-evidence.ts`

| Property | Value |
|----------|-------|
| **Responsibility** | Orchestrate market evidence collection for the candidate universe. Session-gated. |
| **Inputs** | Universe symbols, provider instance, planner config, coverage requests, progress callback. |
| **Outputs** | `AcquisitionResult` — refreshed symbols, deferred symbols, errors, telemetry. |
| **Must not** | Produce recommendations. Rank candidates. Read from UI state. |

### `src/cache/scan-planner.ts`

| Property | Value |
|----------|-------|
| **Responsibility** | Determine which symbols need fresh evidence based on cache state and generation progress. |
| **Inputs** | Universe symbols, durable cache, crawl state, planner config. |
| **Outputs** | Ordered list of symbols to refresh this pass. |
| **Must not** | Make provider calls. Evaluate contracts. Produce recommendations. |

### `src/cache/crawl-state.ts`

| Property | Value |
|----------|-------|
| **Responsibility** | Durable generation and cursor tracking across page reloads and application restarts. |
| **Inputs** | Universe size, current cursor position, generation metadata. |
| **Outputs** | Persisted crawl state (IndexedDB). Cursor advancement. Generation rollover. |
| **Must not** | Own cache TTL logic. Make provider calls. |

### `src/write-desk/universe-scanner.ts`

| Property | Value |
|----------|-------|
| **Responsibility** | Traverse the candidate universe in generation order, coordinating with the scan planner. |
| **Inputs** | Universe, provider, scan config. |
| **Outputs** | `ScanTelemetry` — pass-level metrics (symbols selected, completed, deferred, errors). |
| **Must not** | Store recommendations. Own cache policy. |

---

## Evidence Store Layer

### `src/cache/durable-cache.ts`

| Property | Value |
|----------|-------|
| **Responsibility** | IndexedDB-backed cache with per-type TTLs. Key builder. Freshness classification. |
| **Inputs** | Cache key, payload, data type. |
| **Outputs** | `CacheRecord<T>`, freshness classification (`fresh`, `stale_usable`, `expired`, `missing`). |
| **Must not** | Make provider calls. Evaluate market data. Know about recommendations. |

### `src/market-session/evidence-provenance.ts`

| Property | Value |
|----------|-------|
| **Responsibility** | Define canonical evidence provenance. Gate logic for whether evidence should be written as canonical. |
| **Inputs** | Session state, retrieval time, market data. |
| **Outputs** | `EvidenceProvenance` metadata, `shouldWriteCanonical` decision. |
| **Must not** | Read from cache. Make provider calls. *(Note: not yet integrated into write path.)* |

### `src/market-session/coverage-semantics.ts`

| Property | Value |
|----------|-------|
| **Responsibility** | Multi-level coverage tracking (UNKNOWN → EXPIRATION_KNOWN → PRIMARY_EVALUATED → DEEP_EVALUATED). |
| **Inputs** | Symbol, current coverage state. |
| **Outputs** | Coverage level classification. |
| **Must not** | Make provider calls. Own cache records. |

---

## Market Session Layer

### `src/market-session/session-policy.ts`

| Property | Value |
|----------|-------|
| **Responsibility** | Classify current time into one of 6 market session states. Determine canonical session date and evidence acceptance. |
| **Inputs** | Current `Date`, trading calendar. |
| **Outputs** | `MarketSessionClassification` — state, canonical date, flags for evidence acceptance and prior-session validity. |
| **Must not** | Make provider calls. Own cached data. Produce recommendations. |

### `src/market-session/trading-calendar.ts`

| Property | Value |
|----------|-------|
| **Responsibility** | US market 2026 calendar: holidays, early-close days, regular session times. |
| **Inputs** | Date. |
| **Outputs** | Whether day is trading day, session times, early-close status. |
| **Must not** | Contain business logic beyond calendar facts. |

### `src/market-session/primary-expiration-policy.ts`

| Property | Value |
|----------|-------|
| **Responsibility** | Determine the primary expiration to evaluate for a given symbol (nearest to target DTE 21 within eligible range). |
| **Inputs** | Available expirations, target DTE, eligible range. |
| **Outputs** | Selected primary expiration or null. |
| **Must not** | Make provider calls. Know about ranking or recommendations. |

---

## Recommendation Engine (Wheelwright)

### `src/write-desk/recommend.ts`

| Property | Value |
|----------|-------|
| **Responsibility** | Produce ranked put recommendations from cached evidence + portfolio + policy. The Wheelwright engine. |
| **Inputs** | Universe symbols, deployable cash, durable cache, cache environment, recommendation policy, session context. |
| **Outputs** | `RecommendationResult` — ranked `PutCandidate[]`, wait candidates, coverage state, coverage requests. |
| **Must not** | Call providers. Fetch network data. Mutate cache. Interact with UI. |

### `src/write-desk/brief-builder.ts`

| Property | Value |
|----------|-------|
| **Responsibility** | Build the Wheelwright Brief view model from cached evidence and recommendation. Pure function. |
| **Inputs** | `PutCandidate`, policy, portfolio, session classification, cache, table position context. |
| **Outputs** | `WheelwrightBriefViewModel` — identity, decision, delta fit, neighborhood, position impact, provenance. |
| **Must not** | Call providers. Mutate state. Trigger acquisitions. |

---

## Broker Handoff Layer

### `src/execution/write-intent.ts`

| Property | Value |
|----------|-------|
| **Responsibility** | Construct a broker-neutral WriteIntent from a recommendation. Format Fidelity security IDs. |
| **Inputs** | `PutCandidate`, optional quantity. |
| **Outputs** | `WriteIntent` or null (if data insufficient). |
| **Must not** | Call providers. Submit orders. Interact with broker systems. |

### `src/execution/fidelity-trade-link.ts`

| Property | Value |
|----------|-------|
| **Responsibility** | Accept a WriteIntent and produce a pre-populated Fidelity trade-ticket URL. |
| **Inputs** | `WriteIntent`. |
| **Outputs** | `FidelityTradeLink` — URL string + verification requirements list. |
| **Must not** | Submit orders. Interact with Fidelity credentials. Automate broker pages. Assume order acceptance. |

---

## Write Desk (UI Layer)

### `src/components/WriteDesk.tsx`

| Property | Value |
|----------|-------|
| **Responsibility** | Main operator workbench. Composes 3-band header, candidate board, drawer. Orchestrates scan + recommend workflow. |
| **Inputs** | User interactions, portfolio source selection. |
| **Outputs** | Rendered operational interface. Triggers acquisition and recommendation. |
| **Must not** | Own recommendation logic. Own evidence acquisition logic. Own broker submission. |

### `src/components/RecommendationBrief.tsx`

| Property | Value |
|----------|-------|
| **Responsibility** | Right-side drawer showing decision-critical evidence for a selected recommendation. Includes broker handoff. |
| **Inputs** | `PutCandidate`, policy, portfolio, session, cache environment, table position. |
| **Outputs** | Rendered brief with identity, decision summary, execution evidence, strike neighborhood, position impact, provenance, Fidelity link. |
| **Must not** | Call providers. Fetch from network. Own recommendation logic. Submit orders. |

### `src/components/FidelityUpload.tsx`

| Property | Value |
|----------|-------|
| **Responsibility** | Fidelity CSV upload interface (positions + activity files). |
| **Inputs** | File selection events. |
| **Outputs** | `PortfolioSnapshot` via callback. |
| **Must not** | Make market data calls. Produce recommendations. |

---

## Portfolio Layer

### `src/write-desk/demo-snapshot.ts`

| Property | Value |
|----------|-------|
| **Responsibility** | Create a deterministic simulated portfolio for development use. |
| **Inputs** | None (hardcoded). |
| **Outputs** | `PortfolioSnapshot` with demo positions, cash, existing puts. |
| **Must not** | Call providers. Vary between invocations. |

### `src/write-desk/types.ts`

| Property | Value |
|----------|-------|
| **Responsibility** | Define `PortfolioSnapshot`, `PortfolioSourceType`, related portfolio types. |
| **Inputs** | None (type definitions). |
| **Outputs** | Type system for portfolio state. |
| **Must not** | Contain logic. Import React. |

---

## Universe Layer

### `src/universe/sources/yahoo.ts`

| Property | Value |
|----------|-------|
| **Responsibility** | Bundled Yahoo 496 ETF universe (seed data, captured July 13, 2026). |
| **Inputs** | None (static). |
| **Outputs** | `YAHOO_TOP_ETFS: string[]` — 496 symbols, alphabetically sorted. |
| **Must not** | Make network calls. Change between invocations. |

### `src/universe/universe.ts`

| Property | Value |
|----------|-------|
| **Responsibility** | Merge and deduplicate candidate universe from all sources. |
| **Inputs** | Yahoo source, priority watchlist. |
| **Outputs** | Unified `CandidateSymbol[]` with source descriptor. |
| **Must not** | Make provider calls. Own admission logic. |

---

## Styling Layer

### `src/theme-tokens.css`

| Property | Value |
|----------|-------|
| **Responsibility** | Centralized dark-theme palette. 3-tier text hierarchy + disabled. Typographic scale. Spacing tokens. |
| **Outputs** | CSS custom properties consumed by all component CSS. |
| **Must not** | Contain component-specific rules. |

### `src/write-desk.css`

| Property | Value |
|----------|-------|
| **Responsibility** | Write Desk operational surface styles. Band layout, table, controls, portfolio disclosure. |
| **Consumes** | `theme-tokens.css` via `@import`. |

### `src/recommendation-brief.css`

| Property | Value |
|----------|-------|
| **Responsibility** | Recommendation Brief drawer styles. Decision summary, evidence, neighborhood, impact, provenance, handoff. |
| **Consumes** | `theme-tokens.css` via `@import`. |

---

## Scan Orchestration

### `src/write-desk/scan-orchestrator.ts`

| Property | Value |
|----------|-------|
| **Responsibility** | Define candidate types (`PutCandidate`, `CallCandidate`, `CallInventoryItem`). Coordinate call scanning. |
| **Inputs** | Portfolio inventory, provider, scan config. |
| **Outputs** | Typed candidate arrays. |
| **Must not** | Own recommendation ranking for puts (that's Wheelwright's job). |

### `src/write-desk/scan-audit.ts`

| Property | Value |
|----------|-------|
| **Responsibility** | Create and persist scan audit records for operational traceability. |
| **Inputs** | Snapshot, candidates, excluded, provider info, policy. |
| **Outputs** | `ScanAuditRecord` persisted to localStorage. |
| **Must not** | Influence recommendations. Make provider calls. |
