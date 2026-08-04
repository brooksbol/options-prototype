# Wheelwright — Current Architecture

**Status:** Authoritative as of July 2026
**Supersedes:** Prior version of this document (browser-owned acquisition era)

---

## Implementation Status

This document describes the current architecture of Wheelwright. The Java backend is the sole operational evidence appliance (live-market acceptance recorded August 3, 2026). The TypeScript backend has been retired.

---

## System Identity

Wheelwright is an always-on evidence appliance for policy-governed options-income decision support.

It is not:
- A screener
- A portfolio dashboard
- An automated trading system
- A brokerage integration

It is:
- An evidence appliance that continuously maintains an authoritative model of the options opportunity environment
- A decision-support workbench that presents evidence, produces recommendations, and hands off execution to a broker
- A policy engine that applies explicit, auditable rules to observed evidence

---

## Conceptual Architecture: Four Engines

Conceptually, Wheelwright is organized into four architectural concerns. These are not four independently deployed runtime services — they represent distinct responsibilities that may coexist within the same process or be separated as the system evolves.

```
┌───────────────────────────────────────────────────────────┐
│  EVIDENCE ENGINE                                           │
│  What is true about the market?                           │
│                                                           │
│  Maintains: chains, expirations, quotes, absence,         │
│  freshness, session validity, coverage                    │
└─────────────────────────┬─────────────────────────────────┘
                          │
┌─────────────────────────▼─────────────────────────────────┐
│  POLICY ENGINE                                             │
│  Given evidence, what rules govern our response?           │
│                                                           │
│  Applies: delta range, DTE range, execution thresholds,   │
│  governance, product structure, affordability              │
└─────────────────────────┬─────────────────────────────────┘
                          │
┌─────────────────────────▼─────────────────────────────────┐
│  DECISION ENGINE                                           │
│  Given policy results, what is recommended?                │
│                                                           │
│  Produces: ranked candidates, posture assignments,         │
│  contract selection, yield computation                     │
└─────────────────────────┬─────────────────────────────────┘
                          │
┌─────────────────────────▼─────────────────────────────────┐
│  EXPLANATION ENGINE                                        │
│  Why was this recommended?                                 │
│                                                           │
│  Produces: recommendation brief, neighborhood context,     │
│  governance annotations, provenance, delta fit             │
└───────────────────────────────────────────────────────────┘
```

---

## Current Runtime Architecture

The current runtime architecture consists of a Java backend maintaining evidence and a browser frontend producing recommendations:

```
┌──────────────────────────────────────────────────────────────┐
│  JAVA BACKEND (evidence-service-java)                         │
│  Spring Boot · Java 21 · SQLite                              │
│                                                              │
│  Acquisition Worker (self-scheduling, session-aware)          │
│    · Tiered scheduler (A/B/C/D freshness classes)            │
│    · Anti-starvation floors                                  │
│    · Publication coalescing                                  │
│                                                              │
│  Tradier Adapter → Tradier Sandbox (60 req/min, 15m delay)   │
│  Request Pacer (0.9 req/sec) · Response Cache                │
│                                                              │
│  SQLite Evidence Store (durable, WAL mode)                   │
│    · Symbol resolution · Evidence rows · Generations         │
│                                                              │
│  HTTP API:                                                   │
│    GET /api/evidence/snapshot (ETag, 304)                    │
│    GET /api/evidence/quotes?symbol=... (selective, ETag)     │
│    GET /api/status (scheduler telemetry)                     │
│    GET /api/health                                           │
│    POST /api/evidence/refresh (nudge)                        │
└──────────────────────────────┬───────────────────────────────┘
                               │ HTTP (conditional GET, 30s poll)
┌──────────────────────────────▼───────────────────────────────┐
│  BROWSER (options-prototype)                                  │
│                                                              │
│  Portfolio Store (application-scoped, self-hydrating)         │
│    → PortfolioSnapshot from Fidelity CSV or Demo             │
│    → useSyncExternalStore subscription model                 │
│                                                              │
│  Observation Store (application-scoped, subscriber-driven)   │
│    → Polls GET /api/evidence/quotes for portfolio symbols    │
│    → Provides underlying prices for Position Monitoring      │
│                                                              │
│  Position Monitoring                                         │
│    → Portfolio + Evidence → MonitoredPosition[]              │
│    → Moneyness, DTE, capital, provenance                    │
│                                                              │
│  Operator Console (home surface — route /)                   │
│    → Expiration-native DTE ladder (d3-hierarchy treemap)     │
│    → Moneyness visualization (OTM/ATM/ITM)                  │
│    → Position-detail modal (progressive learning)            │
│                                                              │
│  Recommendation Engines:                                     │
│    · recommendPuts() — universe-wide put candidates           │
│    · recommendCalls() — inventory-driven call candidates      │
│    (Both: zero provider calls, cache-only, deterministic)    │
│                                                              │
│  Write Desk (Operator Workbench — route /app/write)          │
│    · Collapsible Put and Call sections                        │
│    · Sortable candidate tables                               │
│    · Recommendation Brief (put drawer)                       │
│    · Policy controls                                         │
│                                                              │
│  Broker Handoff (WriteIntent → Fidelity trade link)          │
└──────────────────────────────────────────────────────────────┘
```

---

## Layer Responsibilities

### 1. Evidence Acquisition (Java Backend)

**Owns:** Provider communication, market evidence lifecycle, session-aware scheduling, durable persistence.

**Key components:**
- `AcquisitionWorker` — self-scheduling background loop
- `SessionGate` — market-hours enforcement (injectable clock)
- `SqliteEvidenceStore` — durable evidence persistence
- `TradierAdapter` — provider normalization
- `RequestPacer` — rate-limit compliance (0.9 req/sec)
- `SnapshotController` — ETag/conditional HTTP publication
- `StatusController` — scheduler telemetry exposure

**Scheduler (tiered freshness):**

| Class | Definition | Target |
|-------|-----------|--------|
| A | Ready symbols with qualifying puts | ≤ 15 min chain age |
| B | Ready symbols without qualifying puts | Best-effort, 120 min urgency |
| C | Lifecycle work (pending, partial, retriable) | Epoch retry policy |
| D | Prior-epoch absent | Once per epoch |

**Telemetry semantics (scheduler contract):**
- `eligible` = total classified population per class (regardless of freshness)
- `due` = actionable subset currently in work queue (past freshness target)

**Recovery policy:** Prior-epoch failed symbols receive one bounded recovery probe per new session. If the probe succeeds, normal lifecycle restores the symbol toward ready. If it fails, `session_date` advances to today, suppressing further probes until the next session. Failure history (`failure_count`) is preserved and incremented — never reset.

**Must not:** Produce recommendations. Rank candidates. Know about portfolio state.

---

### 2. Portfolio Context (Browser)

**Owns:** Portfolio snapshot, deployable cash, inventory, existing positions, position economics, pending intents.

**Sources:**
- Fidelity CSV upload (Option Summary + Balances)
- Demo snapshot (development)

**Provides:**
- `PortfolioSnapshot` with inventory, cash, existing calls/puts, readiness
- `InventoryPosition` with `economics: PositionEconomics | null`

**PositionEconomics:**
```typescript
interface PositionEconomics {
  averageCostPerShare: number | null;
  costBasis: number | null;
  marketValue: number | null;
}
```

**Cash model:** Fidelity's "Available to trade (all settled)" is authoritative. The system does NOT subtract open-order reservations — Fidelity has already done so.

---

### 3. Recommendation Engines (Browser — Wheelwright)

**Owns:** Recommendation generation as a deterministic function of cached evidence + policy + portfolio state.

#### Put Recommendations (`recommendPuts`)

- Evaluates the full candidate universe (~1,286 symbols)
- Reads chain evidence from IndexedDB cache (populated by backend snapshot)
- Applies policy: delta range, DTE range, execution thresholds, governance
- Produces ranked `PutCandidate[]` with posture (ACTIONABLE, EDGE, WAIT)

#### Call Recommendations (`recommendCalls`)

- Evaluates held inventory positions with `maxAdditionalContracts > 0`
- Reads call contracts from the same cached chains
- Applies the same shared policy (delta, DTE, execution quality)
- Produces ranked `CallCandidate[]` with posture

**Invariant:** Zero provider calls. Same evidence + same policy = same recommendations.

**Valuation convention (midpoint economics):**

The recommendation engine distinguishes four levels of pricing:

| Level | Definition | Example |
|-------|-----------|---------|
| **Observed market data** | Raw bid, ask, last from the provider | bid=$1.20, ask=$1.40 |
| **Midpoint valuation** | Policy convention: `(bid + ask) / 2` | mid=$1.30 |
| **Indicative economics** | Derived metrics using midpoint as the assumed fill | yield=38.9%, premium=$130/ct |
| **Executable pricing** | Actual fill depends on market conditions at order time | Unknown until execution |

The system uses midpoint valuation for all indicative economics:
- Yield: `annualizedYield(mid, collateral, dte)`
- Premium per contract: `mid × 100`
- Assignment basis (puts): `strike - mid`
- Call yield denominator: `underlyingPrice` (describes the option, not the position)

Midpoint is a policy convention — it represents the operator's reasonable expectation when placing a limit order near the market center. It is neither the worst-case (bid) nor a guaranteed fill.

---

### 4. Write Desk (Operator Workbench)

**Owns:** Operator workflow, UI composition, interaction model.

**Structure:**
- **Header:** Title, source selector, deployable cash, session state, call capacity, pending intents
- **Put section** (collapsible): Policy controls, funnel infographic, sortable candidate table
- **Call section** (collapsible): Covered-call candidates for held inventory
- **Recommendation Brief:** Right-side drawer (put only; call drawer is Horizon B)

**Collapse state:** Persisted in `Workspace` (localStorage). Both sections default expanded.

**Must not:** Acquire evidence. Execute trades. Own recommendation logic.

---

### 5. Broker Handoff

**Owns:** Order intent construction and broker-specific URL generation.

**WriteIntent → Fidelity trade link → new tab.** The system opens a pre-populated ticket. The broker is responsible for preview, validation, confirmation, and submission.

**Currently implemented for:** Cash-secured puts only. Call handoff is Horizon B.

---

## Recommendation Policy (First-Class Domain Object)

```typescript
interface RecommendationPolicy {
  version: string;
  contractSelection: ContractSelectionPolicy;
  executionAssessment: ExecutionPolicy;
  ranking: RankingPolicy;
  deployment: DeploymentPolicy;
}
```

**Shared across puts and calls:**
- Delta range (admissible: 0.15–0.50, target: 0.30)
- DTE range (eligible: 7–45, target: 21)
- Execution quality thresholds
- Ranking mode

**Delta interpretation:**
- Puts: filter by `|delta|` (absolute value of negative delta)
- Calls: filter by raw positive delta
- Same numeric range (0.15–0.50) applies to both sides

**Ranking modes:** Execution First, Balanced, Yield First, Capital Efficiency.

---

## Market Session Model

**States (6):**
1. `PREMARKET` — before 09:30 ET
2. `REGULAR_OPEN_DELAY` — market open, delayed data not yet meaningful
3. `REGULAR_OBSERVATION` — active session
4. `DELAY_DRAIN` — session closing, draining delayed quotes
5. `CLOSED_CANONICAL` — after 16:15 ET, evidence sealed
6. `NON_TRADING_DAY` — weekend/holiday

**Session gating:** Acquisition blocked during closed sessions (backend). Sealed canonical evidence remains valid for recommendations during closed sessions (frontend).

**Trading calendar:** 2026 US market holidays (10), early-close days (2). DST via simplified month/day heuristic.

---

## Evidence Snapshot Contract

**Endpoint:** `GET /api/evidence/snapshot`

**Conditional HTTP:** `If-None-Match` → `304 Not Modified` when generation unchanged.

**ETag format:** `"gen-<N>"` (monotonically increasing).

**Contract:** Frozen at v1. See `docs/contracts/evidence-snapshot-v1.md`.

---

## Candidate Universe

**Canonical source:** Yahoo merged ETF list (1,286 symbols, imported from seed CSV on backend startup).

**Call universe:** Derived from `PortfolioSnapshot.inventory` — only held positions with ≥ 100 free shares.

---

## Technology Stack

| Component | Choice |
|-----------|--------|
| Backend | Java 21, Spring Boot 3.4, SQLite (JDBC) |
| Frontend framework | React 18+ with TypeScript (strict) |
| Frontend build | Vite |
| Frontend tests | Vitest (1112 tests) |
| Backend tests | JUnit 5 (173 tests) |
| Frontend storage | IndexedDB (evidence cache), localStorage (workspace) |
| Backend storage | SQLite with WAL mode |
| Provider | Tradier sandbox (REST, 15-min delayed, 60 req/min) |
| Styling | CSS custom properties (centralized theme tokens) |
| State management | React hooks (no external library) |

---

## Design Principles

1. **Evidence appliance.** The backend maintains evidence continuously and independently of any connected client.
2. **Policy over prediction.** Explicit, auditable rules — not market forecasting.
3. **Cache-backed recommendations.** Wheelwright never calls providers. All recommendations derive from cached evidence.
4. **Deterministic recommendation generation.** Same inputs → same outputs.
5. **Midpoint economics.** Yield and premium use midpoint valuation as the indicative fill price.
6. **Failed refresh preserves successful evidence.** A failed acquisition never overwrites the last successful payload.
7. **Session awareness is correctness.** Acquiring during closed sessions is a modeling failure.
8. **Recommendation rank independent of presentation sort.** The operator controls view order without affecting recommendation quality.
9. **Human confirmation before broker submission.** The system opens a ticket; the broker confirms.
10. **Numbers are the product.** Numeric values dominate their labels visually.

---

## Calls Architecture (Horizon A — Implemented)

The first slice of call recommendations restores covered-call candidates for held, unencumbered, quantized shares.

**What exists:**
- `recommendCalls()` reads call contracts from cached chains
- Filters inventory for `maxAdditionalContracts > 0` (free shares ≥ 100)
- Applies shared delta/DTE/execution policy
- Produces ranked `CallCandidate[]`
- Rendered in collapsible Call section of Write Desk

**What is deferred (Horizon B/C):**
- Call drawer (full recommendation brief)
- Projected Call Surface (put drawer showing egress opportunity)
- Appreciation geometry (basis vs strike vs current price)
- Call execution handoff (Fidelity trade link for calls)
- Historical lifecycle linkage
- Put/call symmetry classification
- Familiarity / instrument affinity
- User-specific durable state

---

## Relationship to Prior Architecture

This document supersedes the earlier version that described browser-owned acquisition with IndexedDB as the primary evidence store. Key evolution:

| Before (browser-owned) | Now (backend-owned) |
|------------------------|---------------------|
| Browser acquires from Tradier via proxy | Java backend acquires directly |
| IndexedDB is system of record | SQLite is system of record; IndexedDB is a read cache |
| Scan button triggers acquisition | Always-on worker, 30s polling from frontend |
| `scanCalls()` via ProxyMarketDataProvider | `recommendCalls()` via cached evidence |
| Puts only | Puts and Calls |
| Bid-based yield | Midpoint-based yield |

The TypeScript backend (`evidence-service/`) has been retired after successful Java retooling acceptance (August 3, 2026). The Java backend is the sole evidence appliance.
