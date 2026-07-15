# Backend Evidence Service — Architecture Diagrams

**Companion to:** `09-backend-evidence-service-design.md`

---

## 1. Target Architecture — Data Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                   BACKEND EVIDENCE SERVICE (Node/Bun + SQLite)           │
│                                                                         │
│  ┌────────────┐                                                        │
│  │  Tradier   │    ┌─────────────────────────────────────────────────┐ │
│  │  Sandbox   │───▶│  Acquisition Worker                             │ │
│  │  API       │    │                                                 │ │
│  │            │    │  ┌────────────┐  ┌──────────┐  ┌────────────┐  │ │
│  │  60 req/m  │    │  │ Session    │  │ Job      │  │ Rate       │  │ │
│  │  15m delay │    │  │ Policy     │  │ Queue    │  │ Limiter    │  │ │
│  └────────────┘    │  └────────────┘  └──────────┘  └────────────┘  │ │
│                    │                                                 │ │
│                    │  Loop: pick job → fetch → store → chain-chase   │ │
│                    │        → sleep 1s → repeat                      │ │
│                    └───────────────────────┬─────────────────────────┘ │
│                                            │ writes                    │
│                                            ▼                          │
│                    ┌─────────────────────────────────────────────────┐ │
│                    │  SQLite                                         │ │
│                    │                                                 │ │
│                    │  instrument · expiration_evidence · chain_evidence│
│                    │  confirmed_absence · acquisition_job             │ │
│                    │  evidence_generation · evidence_snapshot          │ │
│                    └───────────────────────┬─────────────────────────┘ │
│                                            │ reads                    │
│                                            ▼                          │
│                    ┌─────────────────────────────────────────────────┐ │
│                    │  Snapshot Publisher                              │ │
│                    │                                                 │ │
│                    │  Coherent snapshot → ETag → evidence_snapshot    │ │
│                    │  Triggered: every 20 ready symbols or session Δ │ │
│                    └───────────────────────┬─────────────────────────┘ │
│                                            │                          │
├────────────────────────────────────────────┼──────────────────────────┤
│                    HTTP API                 │                          │
│                                            │                          │
│  GET /api/evidence-snapshots/current       │                          │
│  GET /api/admin/status                     │                          │
│                                            │                          │
└────────────────────────────────────────────┼──────────────────────────┘
                                             │
                     ┌───────────────────────┼───────────────────────┐
                     │  HTTP (conditional)    │                       │
                     │                       ▼                       │
                     │  If-None-Match ──── ETag match? ── 304        │
                     │                       │ no                    │
                     │                       ▼                       │
                     │                    200 + snapshot             │
                     └───────────────────────┼───────────────────────┘
                                             │
┌────────────────────────────────────────────┼──────────────────────────┐
│                   BROWSER                  │                           │
│                                            ▼                          │
│                    ┌─────────────────────────────────────────────────┐ │
│                    │  Evidence Snapshot (in memory)                   │ │
│                    │                                                 │ │
│                    │  Instruments + chains + coverage + provenance   │ │
│                    └───────────────────────┬─────────────────────────┘ │
│                                            │                          │
│            ┌───────────────────────────────┼────────────────────────┐ │
│            │                               │                        │ │
│            ▼                               ▼                        │ │
│  ┌──────────────────┐          ┌──────────────────────────┐        │ │
│  │  Portfolio        │          │  Wheelwright             │        │ │
│  │  Context          │─────────▶│  (local, instant)        │        │ │
│  │                   │          │                          │        │ │
│  │  · Fidelity CSV   │          │  · Contract selection    │        │ │
│  │  · Open orders    │          │  · Execution assessment  │        │ │
│  │  · Cash/reserved  │          │  · Ranking               │        │ │
│  └──────────────────┘          │  · Brief building        │        │ │
│                                 └────────────┬─────────────┘        │ │
│                                              │                      │ │
│                                 ┌────────────▼─────────────┐        │ │
│                                 │  Write Desk              │        │ │
│                                 │                          │        │ │
│                                 │  · Recommendation Board  │        │ │
│                                 │  · Recommendation Brief  │        │ │
│                                 │  · Policy Controls       │        │ │
│                                 └────────────┬─────────────┘        │ │
│                                              │                      │ │
│                                 ┌────────────▼─────────────┐        │ │
│                                 │  Broker Handoff          │        │ │
│                                 │                          │        │ │
│                                 │  · Write Intent          │        │ │
│                                 │  · Fidelity URL          │        │ │
│                                 │  · Open Order record     │        │ │
│                                 └──────────────────────────┘        │ │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 2. Acquisition Worker — Internal Flow

```
┌─────────────────────────────────────────────────────────┐
│  ACQUISITION WORKER LOOP                                 │
│                                                         │
│  ┌─────────────────┐                                    │
│  │ Check session   │                                    │
│  │ state           │                                    │
│  └────────┬────────┘                                    │
│           │                                             │
│           ├── NON_TRADING / CLOSED ── sleep 30s ───┐    │
│           │                                        │    │
│           ├── PREMARKET / OPEN_DELAY               │    │
│           │   (expirations only)                   │    │
│           │                                        │    │
│           ▼                                        │    │
│  ┌─────────────────┐                              │    │
│  │ Pick next job   │                              │    │
│  │ (priority, then │                              │    │
│  │  next_attempt)  │                              │    │
│  └────────┬────────┘                              │    │
│           │                                        │    │
│           ├── No jobs pending ── sleep 5s ────────┤    │
│           │                                        │    │
│           ▼                                        │    │
│  ┌─────────────────┐                              │    │
│  │ Execute job     │                              │    │
│  │                 │                              │    │
│  │ EXPIRATIONS:    │                              │    │
│  │  fetch → store  │                              │    │
│  │  → if found:    │                              │    │
│  │    create chain │                              │    │
│  │    job          │                              │    │
│  │  → if empty:    │                              │    │
│  │    record       │                              │    │
│  │    absence      │                              │    │
│  │                 │                              │    │
│  │ CHAIN:          │                              │    │
│  │  fetch → store  │                              │    │
│  │  → symbol now   │                              │    │
│  │    rec-ready    │                              │    │
│  └────────┬────────┘                              │    │
│           │                                        │    │
│           ▼                                        │    │
│  ┌─────────────────┐                              │    │
│  │ Record result   │                              │    │
│  │ Update coverage │                              │    │
│  │ Check publish   │◀─────────────────────────────┘    │
│  │ threshold       │                                    │
│  └────────┬────────┘                                    │
│           │                                             │
│           ├── Threshold met ── publish snapshot          │
│           │                                             │
│           ▼                                             │
│  ┌─────────────────┐                                    │
│  │ Rate-limit      │                                    │
│  │ sleep ~1s       │                                    │
│  └────────┬────────┘                                    │
│           │                                             │
│           └── loop ─────────────────────────────────────┘
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## 3. Evidence Lifecycle — Single Symbol

```
Symbol: XLE
═══════════════════════════════════════════════════════════════════

State: UNKNOWN
  │
  │  Job: fetch expirations
  ▼
State: EXPIRATIONS_KNOWN
  │  Expirations: [2026-07-24, 2026-08-21, 2026-09-19, ...]
  │  Primary selected: 2026-08-21 (38 DTE, nearest to target 21)
  │
  │  Job: fetch chain for 2026-08-21
  ▼
State: RECOMMENDATION_READY
  │  Chain cached: 45 puts, underlying $88.50
  │  Observation: 2026-07-15 13:30 ET
  │  Session: regular-2026-07-15
  │
  │  (available to Wheelwright for ranking)
  │
  ═══════════════════════════════════════════════════════════════

Symbol: AAVM
═══════════════════════════════════════════════════════════════════

State: UNKNOWN
  │
  │  Job: fetch expirations
  │  Result: empty (no options available)
  ▼
State: CONFIRMED_ABSENCE
  │  Reason: no expirations
  │  Valid for: current session
  │
  │  (counted toward coverage-complete; not recommendation-ready)
  │
  ═══════════════════════════════════════════════════════════════

Symbol: COPX
═══════════════════════════════════════════════════════════════════

State: RECOMMENDATION_READY (from session regular-2026-07-14)
  │
  │  New session begins: regular-2026-07-15
  │  Prior evidence → SEALED (valid for recommendation until superseded)
  │
  │  Job: refresh expirations (low priority — still has sealed evidence)
  │  Job: refresh primary chain (when session permits market-sensitive)
  ▼
State: RECOMMENDATION_READY (current session evidence)
  │
  ═══════════════════════════════════════════════════════════════
```

---

## 4. Snapshot Publication Timeline

```
Time  ───────────────────────────────────────────────────────────▶

9:45 AM   Worker starts (REGULAR_OBSERVATION)
          Jobs queued: 496 (expirations for all)

9:46      20 expirations fetched, 14 had options → 14 chain jobs created
          6 confirmed absences recorded

9:47      14 chains fetched → 14 symbols RECOMMENDATION_READY
          ┌─────────────────────────────────────┐
          │ PUBLISH snapshot g1                  │
          │ ETag: "regular-2026-07-15-g1"       │
          │ Coverage: 14 ready, 6 absent, 476 pending │
          └─────────────────────────────────────┘

9:48-9:52  Next 80 expirations + chains (continuous pace)
          ┌─────────────────────────────────────┐
          │ PUBLISH snapshot g2                  │
          │ Coverage: 52 ready, 24 absent, 420 pending │
          └─────────────────────────────────────┘

...

10:15     ┌─────────────────────────────────────┐
          │ PUBLISH snapshot g8                  │
          │ Coverage: 298 ready, 118 absent, 80 pending │
          └─────────────────────────────────────┘

10:30     ┌─────────────────────────────────────┐
          │ PUBLISH snapshot g12                 │
          │ Coverage: 378 ready, 118 absent, 0 pending │
          │ Status: COMPLETE                     │
          └─────────────────────────────────────┘

          Worker continues (refreshing stale symbols, lower priority)

Operator opens Write Desk at 10:35 AM:
  → GET /api/evidence-snapshots/current
  → receives g12 (378 instruments ready)
  → Wheelwright computes top 20 instantly
  → no waiting, no Scan button
```

---

## 5. Conditional GET Sequence

```
Browser                              Backend
  │                                    │
  │  GET /evidence-snapshots/current   │
  │  (no If-None-Match)               │
  │──────────────────────────────────▶│
  │                                    │  Query latest snapshot
  │  200 OK                            │
  │  ETag: "regular-2026-07-15-g12"    │
  │  Cache-Control: private, no-cache  │
  │  Body: { full snapshot }           │
  │◀──────────────────────────────────│
  │                                    │
  │  (stores in HTTP cache + memory)   │
  │  (runs Wheelwright, renders table) │
  │                                    │
  ═══ 2 minutes pass ═══              │
  │                                    │
  │  GET /evidence-snapshots/current   │
  │  If-None-Match: "...-g12"         │
  │──────────────────────────────────▶│
  │                                    │  g12 still latest
  │  304 Not Modified                  │
  │◀──────────────────────────────────│
  │                                    │
  │  (no re-render, no transfer)       │
  │                                    │
  ═══ 5 minutes pass ═══              │  (g13 published)
  │                                    │
  │  GET /evidence-snapshots/current   │
  │  If-None-Match: "...-g12"         │
  │──────────────────────────────────▶│
  │                                    │  g13 is newer
  │  200 OK                            │
  │  ETag: "regular-2026-07-15-g13"    │
  │  Body: { updated snapshot }        │
  │◀──────────────────────────────────│
  │                                    │
  │  (updates memory, reruns           │
  │   Wheelwright, re-renders if       │
  │   recommendations changed)         │
  │                                    │
```

---

## 6. Migration Phase Diagram

```
Phase 0          Phase 1          Phase 2          Phase 3          Phase 4/5
────────         ────────         ────────         ────────         ─────────

CURRENT          SHARED TYPES     PARALLEL         BACKEND          CLEANUP
                                  OPERATION        DEFAULT

┌─────────┐     ┌─────────┐     ┌─────────┐     ┌─────────┐     ┌─────────┐
│ Browser │     │ Browser │     │ Browser │     │ Browser │     │ Browser │
│         │     │         │     │         │     │         │     │         │
│ UI      │     │ UI      │     │ UI      │     │ UI      │     │ UI      │
│ Acq ████│     │ Acq ████│     │ Acq ░░░░│     │         │     │         │
│ IDB ████│     │ IDB ████│     │ IDB ░░░░│     │ Snap ███│     │ Snap ███│
│ Wheelw █│     │ Wheelw █│     │ Wheelw █│     │ Wheelw █│     │ Wheelw █│
│ Broker █│     │ Broker █│     │ Broker █│     │ Broker █│     │ Broker █│
└─────────┘     └─────────┘     └─────────┘     └─────────┘     └─────────┘

                ┌─────────┐     ┌─────────┐     ┌─────────┐     ┌─────────┐
                │ Shared  │     │ Shared  │     │ Shared  │     │ Shared  │
                │ Types   │     │ Types   │     │ Types   │     │ Types   │
                └─────────┘     └─────────┘     └─────────┘     └─────────┘

                                ┌─────────┐     ┌─────────┐     ┌─────────┐
                                │ Backend │     │ Backend │     │ Backend │
                                │         │     │         │     │         │
                                │ Acq ████│     │ Acq ████│     │ Acq ████│
                                │ SQLite █│     │ SQLite █│     │ SQLite █│
                                │ API   █ │     │ API ████│     │ API ████│
                                └─────────┘     └─────────┘     └─────────┘

████ = active        ░░░░ = deprecated/inactive
```

---

## 7. Comparison: Current vs Target Frontend Responsibilities

```
CURRENT FRONTEND                         TARGET FRONTEND
════════════════                         ═══════════════

┌────────────────────────────────┐      ┌────────────────────────────────┐
│  ████ Operator UI              │      │  ████ Operator UI              │
│  ████ Recommendation (Wheelwr) │      │  ████ Recommendation (Wheelwr) │
│  ████ Portfolio context        │      │  ████ Portfolio context        │
│  ████ Broker handoff           │      │  ████ Broker handoff           │
│  ████ Open orders              │      │  ████ Open orders              │
│                                │      │  ████ Snapshot consumption     │
│  ▓▓▓▓ IndexedDB evidence      │      │                                │
│  ▓▓▓▓ Crawl state / cursor    │      │  ░░░░ (removed)                │
│  ▓▓▓▓ Scan planner            │      │  ░░░░ (removed)                │
│  ▓▓▓▓ Universe scanner        │      │  ░░░░ (removed)                │
│  ▓▓▓▓ Rate limiter            │      │  ░░░░ (removed)                │
│  ▓▓▓▓ Stall detection         │      │  ░░░░ (removed)                │
│  ▓▓▓▓ Chain-chasing           │      │  ░░░░ (removed)                │
│  ▓▓▓▓ Provider credentials    │      │  ░░░░ (removed)                │
│  ▓▓▓▓ Session-gate enforcement│      │  ░░░░ (removed)                │
│  ▓▓▓▓ Priority interleaving   │      │  ░░░░ (removed)                │
│  ▓▓▓▓ Generation tracking     │      │  ░░░░ (removed)                │
└────────────────────────────────┘      └────────────────────────────────┘

████ = retained    ▓▓▓▓ = acquisition (moving to backend)    ░░░░ = removed
```
