# Wheelwright — Current Architecture

**Status:** Authoritative as of August 2026
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
│  BROWSER (options-prototype) — Application Shell              │
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
│    → Moneyness, DTE, capital, resolution proximity           │
│                                                              │
│  Operator Console (home surface — route /)                   │
│    → Expiration-native DTE ladder (d3-hierarchy treemap)     │
│    → Moneyness visualization (OTM/ATM/ITM)                  │
│    → Position-detail modal (progressive learning)            │
│                                                              │
│  Decision Engine (strategy-specific recommendation paths):   │
│    · recommendPuts() — universe-wide put candidates           │
│    · recommendCalls() — inventory-driven call candidates      │
│    · recommendBuyWrites() — share-purchase + call candidates  │
│    (All: zero provider calls, cache-only, deterministic)     │
│                                                              │
│  Write Desk (Deployment & Recommendation — route /app/write) │
│    · Collapsible Put, Call, and Buy-Write sections            │
│    · Cross-entry composition and comparison                  │
│    · Sortable candidate tables                               │
│    · Recommendation Brief (put + buy-write drawers)          │
│    · Policy controls                                         │
│                                                              │
│  Production (Accounting — route /app/production)             │
│    · Activity History CSV upload (current ingestion)         │
│    · Backend-authoritative monthly production accounting     │
│    · localStorage persistence of uploaded CSV                │
│                                                              │
│  Broker Handoff (WriteIntent → Fidelity trade link)          │
└──────────────────────────────────────────────────────────────┘
```

---

## Application Shell

Wheelwright's operational surfaces share a common application operating context — the Application Shell. This is not an independent surface but the structural container that holds cross-cutting concerns multiple surfaces need.

**The Application Shell provides:**

- Application-scoped portfolio state and provenance (ADR-011)
- Evidence session state and freshness (shared across all surfaces)
- Navigation between operational surfaces with context preservation (ADR-012)
- Active situation/mission context (when implemented; see §Operating Regime and Situation)
- Consistent layout grammar and interaction conventions

**The Application Shell distinguishes:**

- **Application-scoped state** — portfolio, evidence/session, situation — owned by the shell, observed by all surfaces.
- **Surface-local state** — selections, filters, scroll position, expanded/collapsed UI — owned by individual surfaces and persisted only where the surface explicitly chooses to do so.

This decomposition is the logical consequence of ADR-011 ("Multiple Wheelwright surfaces observe one consistent imported portfolio") and ADR-012 ("Application-scoped state becomes a prerequisite for implementation"). The shell makes those requirements structurally explicit.

**Current implementation:**
- `portfolio-store.ts` — module-level singleton, self-hydrating from localStorage, observable via `useSyncExternalStore`
- `observation-store.ts` — subscriber-driven selective quote polling for portfolio symbols
- Route-based navigation (`Root.tsx`) between Console, Write Desk, and Production

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

### 3. Recommendation (Browser — Decision Engine)

**Owns:** Recommendation generation as a deterministic function of cached evidence + policy + portfolio state.

The Decision Engine produces ranked candidates via three strategy-specific recommendation paths. Each path independently evaluates its candidate universe against cached evidence and shared policy. All paths share the same contract: zero provider calls, deterministic, cache-only.

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

#### Buy-Write Recommendations (`recommendBuyWrites`)

- Evaluates universe symbols where purchasing shares + writing a covered call constitutes a deployment opportunity
- Reads underlying prices and call chains from cached evidence
- Applies shared delta/DTE/execution policy with buy-write-specific economic consequence, including premium and conditional appreciation to strike in the current implementation
- Produces ranked `BuyWriteCandidate[]` with posture
- Affordability-gated by deployable cash required to acquire the underlying shares

**Cross-entry composition:** The Write Desk can compose and compare opportunities across all three recommendation paths, enabling the operator to assess deployment options by unified economics rather than by entry mechanism alone. The specific comparison methodology is current implementation subject to evolution — it is not a ratified economic model.

**Invariant:** Zero provider calls. Same evidence + same policy = same recommendations. This holds for all three paths independently.

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

### 4. Write Desk (Deployment & Recommendation — route /app/write)

**Owns:** Operator workflow for opportunity assessment, contract selection, and execution handoff.

**Structure:**
- **Header:** Title, source selector, deployable cash, session state, call capacity, pending intents
- **Put section** (collapsible): Policy controls, funnel infographic, sortable candidate table
- **Call section** (collapsible): Covered-call candidates for held inventory
- **Buy-Write section** (collapsible): Buy-write candidates with composite economics
- **Cross-entry comparison:** Unified ranking across CSP and buy-write opportunities
- **Recommendation Brief:** Right-side drawer (put and buy-write; call drawer is deferred)

**Collapse state:** Persisted in `Workspace` (localStorage). Sections default expanded.

**Must not:** Acquire evidence. Execute trades. Own recommendation logic.

---

### 5. Production (Accounting & Reconciliation — route /app/production)

**Owns:** Production accounting, economic reconciliation of realized option income, and mission-relative output assessment.

**Purpose:** The operator answers: "What has my portfolio actually produced? Am I on track?" This surface reconciles *realized* economic activity against production goals.

**Current capability:** Backend-authoritative monthly production accounting and reconciliation from Fidelity Activity History evidence.

**Architectural direction:** Assess production against situation-defined mission targets (e.g., Bridge Income's monthly cash-flow requirement). This awaits situation implementation.

**Current ingestion:** Fidelity Activity History CSV upload with localStorage persistence. The CSV is the current mechanism for importing realized trade data; it is not the architectural identity of the surface.

**Must not:** Produce recommendations. Acquire evidence. Own portfolio snapshot.

---

### 6. Broker Handoff

**Owns:** Order intent construction and broker-specific URL generation.

**WriteIntent → Fidelity trade link → new tab.** The system opens a pre-populated ticket. The broker is responsible for preview, validation, confirmation, and submission.

**Currently implemented for:** Cash-secured puts. Buy-write and call-only handoff are deferred.

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

**Shared across puts, calls, and buy-writes:**
- Delta range (admissible: 0.15–0.50, target: 0.30)
- DTE range (eligible: 7–45, target: 21) — see note below
- Execution quality thresholds
- Ranking mode

> **DTE range present-day semantics (August 2026):** The eligible DTE range (7–45) is applied by the recommendation engines as a filter on cached expiration lists. However, the backend acquires only one chain per symbol (the expiration nearest ~21 DTE). Consequently, the DTE range currently functions as an eligibility gate on pre-sampled evidence rather than a search space. For 93% of symbols (monthly-only) there is only one eligible expiration in the range regardless. For 64 weekly-capable symbols, the recommendation engine iterates all eligible expirations but finds cached chain data only at the primary expiration. This behavior is documented and investigated in `docs/21-primary-expiration-investigation.md`; a candidate future direction (`PL-EVID-07`) would make this a true search-space control.

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

## Ownership and Authority Boundary

The backend owns authoritative domain data, evidence lifecycle, persistence, acquisition, and substantive computational state. The frontend owns presentation, interaction, and transient UI state.

### Governing constraints

- **Backend authority.** The backend is the single source of truth for market evidence, production accounting, and any durable domain state. The browser consumes backend-published state; it does not independently maintain or persist domain evidence.
- **No browser shadow evidence store.** Frontend state may exist to operate the interface (selections, filters, pending intents, UI mode). It must not create an independent persistence lifecycle for authoritative domain evidence. localStorage, sessionStorage, and IndexedDB must not hold market observations, production records, or other domain evidence that the backend owns.
- **HTTP caching is transport optimization.** ETag, `If-None-Match`, `304 Not Modified`, and `Cache-Control` are legitimate transfer-efficiency mechanisms subordinate to backend authority. They do not constitute browser-owned evidence persistence.
- **Computation placement.** Server-side computation is preferred for heavy, authoritative, reusable domain computation (production accounting, lifecycle assessment, governance evaluation). Frontend computation is appropriate for presentation-oriented derivations (recommendation ranking from cached evidence, UI-local formatting, interaction-local calculations). Existing browser-local recommendation placement is transitional where already documented as such (see PL-ARCH-06).
- **Migration posture.** Movement toward this boundary should be deliberate — guided by the architecture and sequenced with infrastructure prerequisites (cloud deployment, recommendation engine ownership decision). It should not be mixed opportunistically into unrelated fixes.

### Current transitional state

The recommendation engines (`recommendPuts`, `recommendCalls`, `recommendBuyWrites`) currently execute in the browser against cached evidence snapshots. This is a documented transitional placement (PL-ARCH-06), not the architectural end state. The engines are deterministic pure functions — they do not acquire evidence, maintain state, or persist results. Their current browser placement does not violate the authority boundary because the backend remains the evidence authority and the browser merely computes a deterministic view of it.

Portfolio state (Fidelity CSV) persists in localStorage as raw imported text. This is operator-provided input data (analogous to a file the user uploaded), not backend-maintained evidence. Its browser persistence is appropriate because the operator is its source, not the backend.

---

## Operating Regime and Situation

Wheelwright operates within a **cash-flow production regime**: the system exists to support an operator who consciously deploys capital into options positions to produce periodic income. This regime is documented in `foundations/regime-objective-function.md`.

Within this regime, a **Situation** provides cross-cutting operating context that shapes how the entire application reasons about recommendations, explanations, portfolio health, and production targets. A situation contributes context, constraints, optimization priorities, and explanation framing — it is not a page-level input to one surface but a lens that shapes all operational surfaces.

**Current state:** The system operates in an implicit default situation (Situation 0) that matches today's policy behavior. The first named situation — **Bridge Income** (monthly cash-flow production over a finite horizon) — is accepted architectural direction, not yet implemented.

**Architectural relationship:**
- Situation is cross-cutting context within the Application Shell, not a peer to the Four Engines.
- The Decision Engine's recommendation paths become situation-informed when situations are implemented (same mechanics, situation-derived optimization targets).
- The Console renders portfolio state through the lens of the active situation.
- Production assesses output against situation-defined targets.
- Explanation framing becomes situation-contextual.

The full situation model is specified in `docs/25-situation-architecture.md`.

---

## Accepted Architectural Direction

### Deployment Opportunity

The reconciliation (August 2026) ratified **Deployment Opportunity** as a domain/composition concept within the Decision Engine.

**Concept:** A Deployment Opportunity is a normalized, situation-aware portfolio action produced when the Decision Engine's strategy-specific outputs (put, call, buy-write candidates) are composed and evaluated against the active mission. It answers the operator's real question: "Given my portfolio, available capacity, evidence, and mission — what productive portfolio actions are available now?"

**Ownership:** The Deployment Opportunity sits within the Decision Engine. It is not a fifth engine or a new service layer. Whether it manifests as a distinct internal composition component or as a new output shape from existing machinery is unresolved — the structural realization should emerge from implementation.

**Current state:** The Write Desk's cross-entry composition and the buy-write path are embryonic expressions of this concept. A unified Deployment surface presenting opportunities organized by mission relevance (rather than by entry mechanism) is the anticipated evolution.

**What is NOT decided:**
- The normalized opportunity representation or schema
- Cross-strategy comparability model
- The final scoring/ranking methodology for cross-mechanism comparison
- Whether the unified surface replaces or supplements the current strategy sections
- Implementation timeline

This direction fulfills the Situation Architecture's "Unified Recommendation Surface" anticipation and the Regime Objective Function's identification of multiple entry mechanisms serving one mission.

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
| Puts only | Puts, Calls, and Buy-Writes |
| Bid-based yield | Midpoint-based yield |

The TypeScript backend (`evidence-service/`) has been retired after successful Java retooling acceptance (August 3, 2026). The Java backend is the sole evidence appliance.
