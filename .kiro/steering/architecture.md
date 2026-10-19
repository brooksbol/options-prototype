# Wheelwright — Architecture

> **Scope (Oct 19, 2026):** This file summarizes the **v1** runtime (Evidence Appliance + browser Write Desk/Console). It is an injected summary, not authority. For **API v2**, `docs/77-api-v2-architectural-guardrails.md` governs: **backend owns state and business logic; clients own presentation**. v1 client-side placement is debt/lessons, not a v2 assumption. Current domain meaning lives in `docs/knowledge/README.md`. Where this summary disagrees with those, they win.

## Runtime Topology (v1)

```
Java Backend (evidence-service-java)          Browser (options-prototype)
┌─────────────────────────────────┐          ┌──────────────────────────────┐
│ Spring Boot · Java 21 · SQLite  │          │ React 18+ · TypeScript · Vite│
│                                 │  HTTP    │                              │
│ Acquisition Worker              │◄────────►│ Evidence polling (30s)       │
│ Tradier Adapter + Pacer         │  ETag/   │ Portfolio Store              │
│ SQLite Evidence Store           │  304     │ Observation Store            │
│ Session Gate                    │          │ Decision Engine (3 paths)    │
│ Snapshot Controller             │          │ Write Desk / Console / Prod  │
└─────────────────────────────────┘          └──────────────────────────────┘
```

## Technology Stack

| Component | Choice |
|-----------|--------|
| Backend | Java 21, Spring Boot 3.4, SQLite (JDBC, WAL mode) |
| Frontend | React 18+, TypeScript (strict), Vite |
| Frontend tests | Vitest (run the suite for current counts) |
| Backend tests | JUnit 5 (run the suite for current counts) |
| Provider | Tradier (v1 originally sandbox, 15-min delayed, 60 req/min; later production profile measured. Do not infer current provider profile or limits from this row) |
| Styling | CSS custom properties (centralized theme tokens) |
| State management | React hooks (no external library) |
| Build | Gradle (Kotlin DSL, Java 21 toolchain) / npm |

## Backend Responsibilities (v1)

The backend owns: provider communication, market evidence lifecycle, session-aware scheduling, durable persistence, snapshot publication.

Key components:
- `AcquisitionWorker` — self-scheduling background loop
- `SessionGate` — market-hours enforcement (injectable clock)
- `SqliteEvidenceStore` — durable evidence persistence
- `TradierAdapter` — provider normalization
- `RequestPacer` — provider rate-limit compliance (configured by `tradier.requests-per-minute` in `evidence-service-java/src/main/resources/application.properties`; do not infer the rate from this summary)
- `SnapshotController` — ETag/conditional HTTP publication
- `StatusController` — scheduler telemetry

**v1 only:** the v1 evidence backend must NOT produce recommendations, rank candidates, or know about portfolio state. This rule does **not** apply to v2. Under Doc 77 the v2 backend owns authoritative state, governance evaluation and business logic, including governed comparisons.

## Frontend Responsibilities (v1)

The frontend owns: recommendation generation (deterministic, cache-only), portfolio context, presentation, operator interaction.

Decision Engine paths (all zero provider calls):
- `recommendPuts()` — universe-wide put candidates
- `recommendCalls()` — inventory-driven call candidates
- `recommendBuyWrites()` — share-purchase + call candidates

Recommendation engine browser placement is **transitional** (documented as PL-ARCH-06), not the architectural end state.

## HTTP API

Selected v1 endpoints only; not an exhaustive listing. Read the v1 controllers for the full v1 surface. API v2 operations are defined by the v2 OAS routed from `docs/api-v2/README.md`.

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/evidence/snapshot` | GET | Full evidence snapshot (ETag, 304) |
| `/api/evidence/quotes?symbol=...` | GET | Selective quote observation (ETag) |
| `/api/status` | GET | Scheduler telemetry |
| `/api/health` | GET | Health check |
| `/api/evidence/refresh` | POST | Administrative nudge |

## Evidence Snapshot Contract (v1 — Frozen)

- ETag format: `"gen-<N>"` (monotonically increasing)
- Conditional HTTP: `If-None-Match` → `304 Not Modified`
- Contract is frozen. Breaking changes require explicit version transition.
- Reference: `docs/contracts/evidence-snapshot-v1.md`

## Market Session Model (6 states)

1. `PREMARKET` — before 09:30 ET
2. `REGULAR_OPEN_DELAY` — market open, delayed data not yet meaningful
3. `REGULAR_OBSERVATION` — active session
4. `DELAY_DRAIN` — session closing, draining delayed quotes
5. `CLOSED_CANONICAL` — after 16:15 ET, evidence sealed
6. `NON_TRADING_DAY` — weekend/holiday

The delay-window states (`REGULAR_OPEN_DELAY`, `DELAY_DRAIN`) and the 16:15 boundary reflect a delayed (Sandbox) provider authority. Under a real-time authority the backend delay is zero, so those windows are empty (`SessionClassifier`; BUG-010).

Sealed evidence remains valid until superseded by the next session. Wall-clock age does not invalidate sealed evidence.

## Tiered Acquisition Scheduler

| Class | Definition | Target |
|-------|-----------|--------|
| A | Ready symbols with qualifying puts | Chain-age target unresolved (see note) |
| B | Ready symbols without qualifying puts | Best-effort, 120 min urgency |
| C | Lifecycle work (pending, partial, retriable) | Epoch retry policy |
| D | Prior-epoch absent | Once per epoch |

**Class A target note:** sources currently disagree. `docs/07-architecture-current.md` and `SchedulerConfig.DEFAULT` state 25 min; `docs/foundations/acquisition-scheduler-policy.md` states 15 min. This is an open, separately governed decision. Do not resolve it from this summary.

## Ownership Boundary

- **Backend authority.** Single source of truth for market evidence, production accounting, durable domain state.
- **No browser shadow evidence store.** Frontend state exists for interface operation only; it must not independently persist domain evidence.
- **HTTP caching is transport optimization**, not browser-owned evidence persistence.
- **Server-side computation** preferred for heavy, authoritative, reusable domain computation.
- **Frontend computation** appropriate for presentation-oriented derivations from cached evidence.

## Architectural Invariants (Summary)

Ratified invariants (consult the catalog for the current inventory), including:
- **Lifecycle:** Browser-independent operation, restart durability
- **Acquisition:** Single authority, autonomous scheduling
- **Session:** Session-gated acquisition, trading calendar correctness, sealed evidence validity
- **Persistence:** Failed refresh preserves evidence, absence is resolution, observation provenance, facts persisted / trust derived
- **Publication:** Snapshot coherence, conditional retrieval, generation monotonicity, deterministic snapshots, contract versioning
- **Provider:** Credential custody, type containment, rate-limit compliance, provider stewardship
- **Boundaries:** Evidence/recommendation separation

Full catalog: `docs/foundations/backend-behavioral-invariants.md`
