# Wheelwright — Architecture

## Runtime Topology

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
| Frontend tests | Vitest (1112+ tests) |
| Backend tests | JUnit 5 (173+ tests) |
| Provider | Tradier sandbox (REST, 15-min delayed, 60 req/min) |
| Styling | CSS custom properties (centralized theme tokens) |
| State management | React hooks (no external library) |
| Build | Gradle (Kotlin DSL, Java 21 toolchain) / npm |

## Backend Responsibilities

The backend owns: provider communication, market evidence lifecycle, session-aware scheduling, durable persistence, snapshot publication.

Key components:
- `AcquisitionWorker` — self-scheduling background loop
- `SessionGate` — market-hours enforcement (injectable clock)
- `SqliteEvidenceStore` — durable evidence persistence
- `TradierAdapter` — provider normalization
- `RequestPacer` — rate-limit compliance (0.9 req/sec)
- `SnapshotController` — ETag/conditional HTTP publication
- `StatusController` — scheduler telemetry

The backend must NOT: produce recommendations, rank candidates, know about portfolio state.

## Frontend Responsibilities

The frontend owns: recommendation generation (deterministic, cache-only), portfolio context, presentation, operator interaction.

Decision Engine paths (all zero provider calls):
- `recommendPuts()` — universe-wide put candidates
- `recommendCalls()` — inventory-driven call candidates
- `recommendBuyWrites()` — share-purchase + call candidates

Recommendation engine browser placement is **transitional** (documented as PL-ARCH-06), not the architectural end state.

## HTTP API

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

Sealed evidence remains valid until superseded by the next session. Wall-clock age does not invalidate sealed evidence.

## Tiered Acquisition Scheduler

| Class | Definition | Target |
|-------|-----------|--------|
| A | Ready symbols with qualifying puts | ≤ 15 min chain age |
| B | Ready symbols without qualifying puts | Best-effort, 120 min urgency |
| C | Lifecycle work (pending, partial, retriable) | Epoch retry policy |
| D | Prior-epoch absent | Once per epoch |

## Ownership Boundary

- **Backend authority.** Single source of truth for market evidence, production accounting, durable domain state.
- **No browser shadow evidence store.** Frontend state exists for interface operation only; it must not independently persist domain evidence.
- **HTTP caching is transport optimization**, not browser-owned evidence persistence.
- **Server-side computation** preferred for heavy, authoritative, reusable domain computation.
- **Frontend computation** appropriate for presentation-oriented derivations from cached evidence.

## Architectural Invariants (Summary)

18 ratified invariants organized into:
- **Lifecycle:** Browser-independent operation, restart durability
- **Acquisition:** Single authority, autonomous scheduling
- **Session:** Session-gated acquisition, trading calendar correctness, sealed evidence validity
- **Persistence:** Failed refresh preserves evidence, absence is resolution, observation provenance, facts persisted / trust derived
- **Publication:** Snapshot coherence, conditional retrieval, generation monotonicity, deterministic snapshots, contract versioning
- **Provider:** Credential custody, type containment, rate-limit compliance, provider stewardship
- **Boundaries:** Evidence/recommendation separation

Full catalog: `docs/foundations/backend-behavioral-invariants.md`
