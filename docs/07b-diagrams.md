# System Diagrams

**Status:** Authoritative as of August 2026

---

## 1. Data Flow Diagram

```
┌──────────────────────────────────────────────────────────────────┐
│  EXTERNAL SOURCES                                                 │
│                                                                   │
│  Tradier Sandbox API          Fidelity CSV Export                 │
│  (60 req/min, 15m delayed)    (positions, balances)              │
└──────────┬────────────────────────────────────────┬──────────────┘
           │                                        │
           │ HTTP (paced, 0.9 req/sec)              │ File upload (browser)
           │                                        │
┌──────────▼──────────────────────────┐    ┌───────▼────────────────┐
│  JAVA BACKEND                        │    │  BROWSER                │
│  (evidence-service-java)             │    │  (options-prototype)    │
│                                      │    │  Application Shell      │
│  ┌────────────────────────────────┐  │    │                         │
│  │  Acquisition Worker             │  │    │  ┌─────────────────┐   │
│  │  · Session gate                 │  │    │  │ CSV Parsers      │   │
│  │  · Tiered scheduler (A/B/C/D)  │  │    │  │ · Option Summary │   │
│  │  · Anti-starvation floors      │  │    │  │ · Balances       │   │
│  │  · Publication coalescing      │  │    │  │ · Activity Hist. │   │
│  └────────────┬───────────────────┘  │    │  └────────┬────────┘   │
│               │ writes                │    │           │             │
│  ┌────────────▼───────────────────┐  │    │  ┌────────▼────────┐   │
│  │  SQLite Evidence Store          │  │    │  │ Portfolio Store   │   │
│  │  · Symbols + resolution         │  │    │  │ (app-scoped)     │   │
│  │  · Chains + expirations         │  │    │  │ · Cash           │   │
│  │  · Generations                  │  │    │  │ · Inventory      │   │
│  └────────────┬───────────────────┘  │    │  │ · Economics      │   │
│               │ reads                 │    │  │ · Existing opts  │   │
│  ┌────────────▼───────────────────┐  │    │  └────────┬────────┘   │
│  │  Snapshot Publisher             │  │    │           │             │
│  │  · ETag computation             │  │    │           │             │
│  │  · Conditional HTTP (304)       │  │    │           │             │
│  └────────────┬───────────────────┘  │    │           │             │
│               │                       │    │           │             │
│  ┌────────────┴───────────────────┐  │    │           │             │
│  │  Quotes Publisher               │  │    │           │             │
│  │  · Selective symbol quotes      │  │    │           │             │
│  │  · Conditional HTTP (304)       │  │    │           │             │
│  └────────────┬───────────────────┘  │    │           │             │
└───────────────┼──────────────────────┘    │           │             │
                │                            │           │             │
                │ GET /api/evidence/snapshot  │           │             │
                │ (30s poll, If-None-Match)   │           │             │
                │                            │           │             │
                ├───────────────────────────▶│           │             │
                │                            │  ┌───────▼─────────┐   │
                │ GET /api/evidence/quotes    │  │ IndexedDB Cache   │   │
                │ (portfolio symbols, poll)   │  │ (read cache from  │   │
                │                            │  │  backend snapshot) │   │
                └───────────────────────────▶│  └───────┬─────────┘   │
                                             │          │              │
                                             │  ┌───────▼─────────┐   │
                                             │  │ Observation Store │   │
                                             │  │ (portfolio quotes)│   │
                                             │  └───────┬─────────┘   │
                                             │          │              │
                                             │          │ + Portfolio   │
                                             │          │              │
                                             │  ┌───────▼─────────────┐│
                                             │  │ Decision Engine      ││
                                             │  │ · recommendPuts()    ││
                                             │  │ · recommendCalls()   ││
                                             │  │ · recommendBuyWrites()│
                                             │  │ (zero provider calls)││
                                             │  └───────┬─────────────┘│
                                             │          │              │
                                             │  ┌───────▼─────────┐   │
                                             │  │ Position         │   │
                                             │  │ Monitoring       │   │
                                             │  │ (ADR-013)        │   │
                                             │  └───────┬─────────┘   │
                                             │          │              │
                                             │  ┌───────▼─────────┐   │
                                             │  │ Operator Surfaces │   │
                                             │  │ · Console (/)     │   │
                                             │  │ · Write Desk      │   │
                                             │  │   (/app/write)    │   │
                                             │  │ · Production      │   │
                                             │  │   (/app/production)│  │
                                             │  └───────┬─────────┘   │
                                             │          │              │
                                             │  ┌───────▼─────────┐   │
                                             │  │ Broker Handoff    │   │
                                             │  │ · WriteIntent     │   │
                                             │  │ · Fidelity URL    │   │
                                             │  │ · New tab         │   │
                                             │  └─────────────────┘   │
                                             │                         │
                                             └─────────────────────────┘
```

---

## 2. Scheduler Assessment Cycle

```
┌─────────────────────────────────────────────────────┐
│  ACQUISITION WORKER CYCLE                            │
│                                                     │
│  ┌─────────────┐                                   │
│  │ Session Gate │──── blocked? ──── sleep 5 min     │
│  └──────┬──────┘                                   │
│         │ permitted                                  │
│  ┌──────▼──────────────────────────┐               │
│  │ Build Prioritized Work Queue     │               │
│  │ · Classify A/B/C/D              │               │
│  │ · Sort: A oldest → B past max   │               │
│  │   → remaining → C → D           │               │
│  └──────┬──────────────────────────┘               │
│         │                                           │
│  ┌──────▼──────────────────────────┐               │
│  │ Capture Telemetry                │               │
│  │ · eligible = classified pop      │               │
│  │ · due = work queue counts        │               │
│  │ · oldestAgeSeconds               │               │
│  └──────┬──────────────────────────┘               │
│         │                                           │
│         │ queue empty? ──── idle (30s) ─── publish  │
│         │                                           │
│  ┌──────▼──────────────────────────┐               │
│  │ Select Batch (max 10)            │               │
│  │ · Satisfy B debt (every 10 jobs) │               │
│  │ · Satisfy CD debt (every 20)     │               │
│  │ · Fill from priority queue       │               │
│  └──────┬──────────────────────────┘               │
│         │                                           │
│  ┌──────▼──────────────────────────┐               │
│  │ Dispatch (per item)              │               │
│  │ · Acquire via TradierAdapter     │               │
│  │ · Store evidence                 │               │
│  │ · Record metrics                 │               │
│  └──────┬──────────────────────────┘               │
│         │                                           │
│  ┌──────▼──────────────────────────┐               │
│  │ Publish If Due                   │               │
│  │ · Skip if no change              │               │
│  │ · Skip if < 5s since last        │               │
│  │ · Force before idle              │               │
│  └──────┬──────────────────────────┘               │
│         │                                           │
│         └──── more work? ──── 1s delay ──── repeat  │
│                   no? ──── idle ──── 30s ──── repeat │
└─────────────────────────────────────────────────────┘
```

---

## 3. Recommendation Pipeline (Browser — Decision Engine)

```
Backend Snapshot (polled every 30s)
        │
        ▼
IndexedDB Cache (populated from snapshot)
        │
        ├───────────────────────────────┬───────────────────────────┐
        │                               │                           │
        ▼                               ▼                           ▼
recommendPuts()                  recommendCalls()          recommendBuyWrites()
  · Universe (~1286 symbols)       · Inventory positions      · Universe symbols
  · Delta/DTE/execution policy     · Free shares ≥ 100        · Underlying prices
  · Affordability (cash)           · Same delta/DTE policy     · Call chains
  · Governance (product structure) · No affordability gate     · Affordability (shares)
        │                               │                           │
        ▼                               ▼                           ▼
Ranked PutCandidate[]            Ranked CallCandidate[]    Ranked BuyWriteCandidate[]
  · ACTIONABLE / EDGE / WAIT       · ACTIONABLE / EDGE       · ACTIONABLE / EDGE / WAIT
        │                               │                           │
        └───────────────────┬───────────┴───────────────────────────┘
                            │
                            ▼
              Cross-Entry Composition (current: experimental)
                · Unified comparison across paths
                · Strategy-independent economics
                            │
                            ▼
                    Write Desk (Deployment & Recommendation)
                    · Collapsible Puts section
                    · Collapsible Calls section
                    · Collapsible Buy-Write section
                    · Cross-entry comparison view
                    · Policy controls (shared)
                    · Recommendation Brief (put + buy-write drawers)
```

---

## 4. Market Session State Machine

```
                    ┌─────────────────┐
                    │  NON_TRADING_DAY │◀──── Weekend/Holiday
                    └────────┬────────┘
                             │ Next trading day
                             ▼
                    ┌─────────────────┐
          ┌────────│    PREMARKET     │
          │        │  (before 09:30)  │
          │        └────────┬────────┘
          │                 │ 09:30 ET
          │                 ▼
          │        ┌─────────────────────┐
          │        │  REGULAR_OPEN_DELAY  │
          │        │  (~15 min provider)  │
          │        └────────┬────────────┘
          │                 │ First meaningful data
          │                 ▼
          │        ┌─────────────────────┐
          │        │ REGULAR_OBSERVATION  │◀─── Acquisition active
          │        │  (09:45–16:00 ET)   │
          │        └────────┬────────────┘
          │                 │ 16:00 ET
          │                 ▼
          │        ┌─────────────────┐
          │        │   DELAY_DRAIN   │
          │        │  (16:00–16:15)  │
          │        └────────┬────────┘
          │                 │ 16:15 ET
          │                 ▼
          │        ┌─────────────────────┐
          └───────▶│  CLOSED_CANONICAL   │──── Evidence sealed
                   │  (after 16:15 ET)   │     Recommendations valid
                   └─────────────────────┘     Acquisition blocked
```

---

## 5. Conditional HTTP Sequence

```
Browser                          Backend
  │                                │
  │  GET /api/evidence/snapshot    │
  │  (no If-None-Match)           │
  │───────────────────────────────▶│
  │                                │ Build snapshot
  │  200 OK                        │ Compute ETag
  │  ETag: "gen-42"                │
  │  Body: { snapshot JSON }       │
  │◀───────────────────────────────│
  │                                │
  │  ... 30 seconds ...            │
  │                                │
  │  GET /api/evidence/snapshot    │
  │  If-None-Match: "gen-42"       │
  │───────────────────────────────▶│
  │                                │ Compare ETag
  │  304 Not Modified              │ Match → no body
  │  (no body)                     │
  │◀───────────────────────────────│
  │                                │
  │  ... evidence changes ...      │
  │                                │
  │  GET /api/evidence/snapshot    │
  │  If-None-Match: "gen-42"       │
  │───────────────────────────────▶│
  │                                │ ETag now "gen-43"
  │  200 OK                        │ Mismatch → full response
  │  ETag: "gen-43"                │
  │  Body: { updated snapshot }    │
  │◀───────────────────────────────│
```

---

## 6. Application Surface Topology

```
┌─────────────────────────────────────────────────────────────────┐
│  APPLICATION SHELL (shared operating context)                    │
│                                                                 │
│  Cross-cutting state:                                           │
│    · Portfolio context and provenance (ADR-011)                 │
│    · Evidence session state and freshness                       │
│    · Active situation/mission (when implemented)                │
│    · Navigation and context-preserving transitions              │
│                                                                 │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────┐  │
│  │  CONSOLE          │  │  DEPLOYMENT /     │  │  PRODUCTION   │  │
│  │  (home — /)       │  │  RECOMMENDATION   │  │  (/app/       │  │
│  │                   │  │  (/app/write)     │  │   production) │  │
│  │  · Orientation    │  │                   │  │              │  │
│  │  · Position       │  │  · Opportunity    │  │  · Realized  │  │
│  │    monitoring     │  │    assessment     │  │    income    │  │
│  │  · DTE ladder     │  │  · Contract       │  │  · Monthly   │  │
│  │  · Decision       │  │    selection      │  │    accounting│  │
│  │    pressure       │  │  · Cross-entry    │  │  · Mission-  │  │
│  │  · Capacity       │  │    comparison     │  │    relative  │  │
│  │    assessment     │  │  · Brief /        │  │    progress  │  │
│  │                   │  │    explanation    │  │    (future)  │  │
│  │                   │  │  · Execution      │  │              │  │
│  │                   │  │    handoff        │  │              │  │
│  └──────────────────┘  └──────────────────┘  └──────────────┘  │
│                                                                 │
│  Operator Flow:  Orient ──→ Assess/Deploy ──→ Reconcile        │
│                    ↑                              │              │
│                    └──────────────────────────────┘              │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  ENGINEERING / DEBUG AREA (subordinate, not operator topology)   │
│                                                                 │
│  · Universe browser                                             │
│  · Scenario replay (research)                                   │
│  · Parsing diagnostics                                          │
│  · Backend telemetry / scheduler status                         │
│  · Legacy Lab surfaces (pending retirement)                     │
└─────────────────────────────────────────────────────────────────┘
```

**Reading this diagram:**

- The **Application Shell** is the shared container. It provides cross-cutting state, navigation, and presentation grammar to all operational surfaces.
- The three **operational surfaces** are the established operator destinations. Each owns a distinct responsibility in the operator's workflow cycle.
- The **operator flow** arrow illustrates the natural traversal: orientation (Console) → opportunity assessment and deployment (Write Desk) → production reconciliation → back to orientation.
- The **engineering area** is deliberately subordinate. It provides developer/research tools but is not part of the operator's mental model or primary navigation.
