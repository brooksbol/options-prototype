# System Diagrams

**Status:** Authoritative as of July 2026

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
│                                      │    │                         │
│  ┌────────────────────────────────┐  │    │  ┌─────────────────┐   │
│  │  Acquisition Worker             │  │    │  │ CSV Parsers      │   │
│  │  · Session gate                 │  │    │  │ · Option Summary │   │
│  │  · Tiered scheduler (A/B/C/D)  │  │    │  │ · Balances       │   │
│  │  · Anti-starvation floors      │  │    │  └────────┬────────┘   │
│  │  · Publication coalescing      │  │    │           │             │
│  └────────────┬───────────────────┘  │    │  ┌────────▼────────┐   │
│               │ writes                │    │  │ Portfolio        │   │
│  ┌────────────▼───────────────────┐  │    │  │ Snapshot         │   │
│  │  SQLite Evidence Store          │  │    │  │ · Cash           │   │
│  │  · Symbols + resolution         │  │    │  │ · Inventory      │   │
│  │  · Chains + expirations         │  │    │  │ · Economics      │   │
│  │  · Generations                  │  │    │  │ · Existing opts  │   │
│  └────────────┬───────────────────┘  │    │  └────────┬────────┘   │
│               │ reads                 │    │           │             │
│  ┌────────────▼───────────────────┐  │    │           │             │
│  │  Snapshot Publisher             │  │    │           │             │
│  │  · ETag computation             │  │    │           │             │
│  │  · Conditional HTTP (304)       │  │    │           │             │
│  └────────────┬───────────────────┘  │    │           │             │
└───────────────┼──────────────────────┘    │           │             │
                │                            │           │             │
                │ GET /api/evidence/snapshot  │           │             │
                │ (30s poll, If-None-Match)   │           │             │
                │                            │           │             │
                └───────────────────────────▶│           │             │
                                             │  ┌───────▼─────────┐   │
                                             │  │ IndexedDB Cache   │   │
                                             │  │ (read cache from  │   │
                                             │  │  backend snapshot) │   │
                                             │  └───────┬─────────┘   │
                                             │          │              │
                                             │          │ + Portfolio   │
                                             │          │              │
                                             │  ┌───────▼─────────┐   │
                                             │  │ Wheelwright       │   │
                                             │  │ · recommendPuts() │   │
                                             │  │ · recommendCalls()│   │
                                             │  │ (zero provider    │   │
                                             │  │  calls)           │   │
                                             │  └───────┬─────────┘   │
                                             │          │              │
                                             │  ┌───────▼─────────┐   │
                                             │  │ Write Desk        │   │
                                             │  │ · Put table       │   │
                                             │  │ · Call table      │   │
                                             │  │ · Brief drawer    │   │
                                             │  │ · Policy controls │   │
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

## 3. Recommendation Pipeline (Browser)

```
Backend Snapshot (polled every 30s)
        │
        ▼
IndexedDB Cache (populated from snapshot)
        │
        ├───────────────────────────────────────────┐
        │                                           │
        ▼                                           ▼
recommendPuts()                              recommendCalls()
  · Universe (~1286 symbols)                   · Inventory positions
  · Delta/DTE/execution policy                 · Free shares ≥ 100
  · Affordability (cash)                       · Same delta/DTE policy
  · Governance (product structure)             · No affordability gate
        │                                           │
        ▼                                           ▼
Ranked PutCandidate[]                        Ranked CallCandidate[]
  · ACTIONABLE / EDGE / WAIT                   · ACTIONABLE / EDGE / WAIT
        │                                           │
        └───────────────────┬───────────────────────┘
                            │
                            ▼
                    Write Desk
                    · Collapsible Puts section
                    · Collapsible Calls section
                    · Policy controls (shared)
                    · Recommendation Brief (put drawer)
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
