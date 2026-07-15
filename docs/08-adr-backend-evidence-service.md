# ADR: Move Evidence Acquisition from Browser-Owned Crawl to a Backend Evidence Service

**Date:** July 2026
**Status:** Accepted
**Supersedes:** Frontend-only crawl architecture (implicit, never formally documented as a permanent choice)

---

## Context

The current frontend owns:

- Operator UI
- Recommendation computation (Wheelwright)
- IndexedDB market evidence database
- Provider rate limiting (Tradier 60 req/min)
- Universe crawl (496 symbols)
- Generation state and cursor tracking
- Retry and recovery
- Session-aware evidence validity
- Stall detection
- Chain acquisition orchestration and priority interleaving

This architecture was intentionally chosen to validate the domain model without backend infrastructure. It succeeded in proving:

- 496-symbol universe acquisition works
- Tradier integration and sandbox behavior are understood
- Session-aware acquisition policy is necessary and definable
- Cache-backed recommendation generation is viable and fast
- Recommendation Policy as a first-class domain object
- Wheelwright as a deterministic, zero-provider-call recommendation engine
- Recommendation Brief as a decision-support artifact
- Fidelity broker handoff via pre-populated trade ticket URLs
- Progressive disclosure and compact operational layout

However, the browser is now acting as four things simultaneously:

1. Operator UI
2. Recommendation client
3. Durable evidence database
4. Background job processor

The last two are the source of all recent defects.

A browser tab is a poor home for a universe crawler because:

- The tab may close
- Vite/HMR may restart it
- In-memory queues disappear on restart while durable state persists
- IndexedDB metadata and in-memory state can diverge
- User clicks become job-scheduling commands
- Every UI lifecycle edge case becomes an acquisition edge case

Recent defects that exposed this boundary:

- Persisted cursor at universe end while coverage was incomplete (cursor=496, covered=133)
- Incomplete generation erroneously marked complete
- Scan planner and recommendation engine using different definitions of "covered"
- Stale expiration evidence incorrectly classified as recommendation-ready (no chain check)
- Acquisition priority logic preventing chain convergence (expirations always before chains)
- Application restart losing in-memory work queue while preserving durable cursor state
- Repeated Rescan commands becoming no-ops
- Operator interface blanking during long acquisition passes

These are classic distributed-job problems appearing in a browser environment that was never designed to host them.

---

## Decision

Move provider interaction, universe acquisition, rate limiting, canonical evidence management, acquisition jobs, retries, generations, and snapshot publication into a long-lived backend service.

The browser will no longer own the authoritative market-evidence lifecycle.

The frontend will consume coherent evidence snapshots via conditional GET and continue to run Wheelwright locally.

---

## Decision Boundary

### Backend owns:

- Provider adapters (Tradier, future providers)
- Provider credentials
- Universe crawl scheduling
- Acquisition job queue and execution
- Rate limiting (Tradier 60 req/min budget)
- Market-session acquisition policy
- Expiration and chain acquisition
- Retry with bounded backoff
- Recovery after process restart
- Confirmed absence tracking
- Canonical evidence storage
- Evidence generations
- Evidence-readiness determination (single shared contract)
- Snapshot coherence and publication
- Backend acquisition telemetry and observability
- ETag computation

### Frontend owns:

- Portfolio context (Fidelity CSV import, demo snapshot)
- Open-order reservations
- Recommendation Policy controls (delta, DTE, ranking mode)
- Wheelwright recomputation (instant, local, zero-latency)
- Recommendation rank computation
- Presentation sort (independent of rank)
- Recommendation Brief (decision summary, evidence, neighborhood, impact, provenance)
- Write Intent construction
- Fidelity broker handoff (browser opens new tab)
- Operator selection and UI state
- Evidence snapshot consumption and display

---

## Important Clarification

Evidence acquisition complexity does not disappear. It moves into the correct subsystem and is hidden behind a coherent snapshot boundary.

Conditional GETs simplify snapshot delivery to the browser. They do not replace backend acquisition logic. The backend still requires:

- Crawl state management
- Generation tracking
- Retry and bounded backoff
- Acquisition priority scheduling
- Rate budgeting
- Session-aware validity
- Confirmed absence
- Stalled-job detection
- Observability

The difference: these concerns now execute in a stable process with transactional storage, durable jobs, and explicit recovery — rather than in a browser tab competing with HMR, tab closure, and UI lifecycle events.

---

## Consequences

### Positive

- Acquisition survives browser reloads and tab closure
- Operator opens the Write Desk with evidence already available (no Scan button needed)
- One authoritative evidence state (no cursor/coverage divergence)
- Transactional persistence (SQLite, not IndexedDB)
- Durable retry and recovery with proper job semantics
- No browser-owned crawl cursor or generation state
- No frontend IndexedDB evidence reconciliation
- Simpler Write Desk lifecycle (pure decision surface)
- Easier observability and diagnostics (server-side logging)
- Provider credentials remain server-side (not in .env.local)
- Foundation for future multi-user operation
- Single shared definition of "recommendation-ready"

### Negative

- Introduces a server process (development and deployment concern)
- Introduces persistence migration concerns (SQLite schema evolution)
- Acquisition worker still requires careful job design (complexity moved, not eliminated)
- Snapshot payload size must be managed (496 instruments × chain data)
- Schema evolution becomes an API concern (versioned snapshots)
- Local development becomes multi-process (server + Vite)
- Migration must preserve deterministic Wheelwright behavior
- Temporarily two acquisition paths during migration

---

## Alternatives Considered

### 1. Continue hardening the frontend-only crawler

**Rejected.** The browser lifecycle is fundamentally incompatible with long-lived background acquisition. Each defect fix introduces new edge cases at the boundary between UI lifecycle and job execution. The domain model is proven; further investment in browser crawl hardening is building the wrong thing well.

### 2. Move both evidence acquisition AND Wheelwright to the backend

**Rejected as initial approach.** This would make every policy change into a server round-trip, destroying one of the system's strongest properties: instant local recomputation. The separation between Evidence and Recommendation was deliberately designed so that changing delta, ranking objective, or execution policy recomputes immediately without reacquiring anything. A `GET /api/recommendations?policy=yield_first` endpoint collapses these layers.

Wheelwright *may* move server-side later for multi-user governance or audit reasons, but it should not move in the first extraction.

### 3. Move only evidence acquisition to the backend, retain Wheelwright client-side

**Selected.** Preserves:
- Zero provider calls from Wheelwright
- Instant policy recomputation
- Deterministic recommendations
- Recommendation-policy experimentation (no network latency)
- Independence between recommendation rank and table sort
- Ability to replay a known evidence snapshot

Eliminates:
- Browser-owned acquisition lifecycle
- IndexedDB as authoritative evidence store
- Crawl cursor/generation state in the browser
- All frontend stall/recovery/priority logic

### 4. Use a third-party managed data platform

**Rejected.** No existing options data platform provides the exact normalized evidence shape that Wheelwright consumes. The acquisition logic is domain-specific (session-aware, expiration-selection-aware, absence-tracking). A generic data pipeline would still require domain-specific transformation, adding indirection without eliminating complexity.

---

## Status

**Accepted.** The frontend-only crawler was not a failed architecture. It was a deliberate prototype architecture that validated the domain model and exposed the correct service boundary. The pain now being experienced is evidence that the prototype has reached the limits of the architecture that was intentionally chosen for it.
