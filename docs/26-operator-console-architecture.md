# Operator Console Architecture

**Status:** First slice implemented (August 2026); design areas remain for future increments
**Date:** July 2026 (design); August 2026 (first implementation)
**Depends on:** ADR-011 (Application-Scoped Portfolio Ingestion), ADR-012 (Operator Console as Home Surface), ADR-013 (Position Monitoring Model)

---

## Purpose

The Operator Console is Wheelwright's primary home and monitoring surface. It provides operator orientation: awareness of encumbered capital, temporal distribution, urgency, mission progress, and available capacity.

It answers:

- What is currently encumbered?
- For how long?
- Where is urgency concentrated?
- How much capacity is available?
- What requires attention?
- How is the portfolio progressing against the active situation?

The Console does not replace Wheelwright's recommendation, discovery, selection, or execution capabilities. Those remain accessible from a separate functional area. The Console orients the operator and identifies attention — it does not absorb the full action workflow.

---

## Core Abstraction

The primary portfolio-monitoring abstraction is:

**Encumbered capital distributed over time.**

DTE is the temporal dimension. Each option position encumbers capital (cash for puts, share value for calls) until its expiration or resolution. The Console makes that distribution visible, proportional, and inspectable.

This is an operational representation — not an accounting ledger, not a positions table, not a P&L summary.

---

## Primary Visualization — DTE Ladder

The DTE ladder is the hero visualization of the Operator Console.

### Architectural semantics

- Each **rung** represents a DTE interval (bucket).
- Each **position** appears as a tile in the rung corresponding to its current DTE.
- Tile **area** is proportional to the capital encumbered by that position.
- Puts and calls are **visually distinguishable** (badge, border, or other mechanism).
- **Health/attention state** may be visually encoded on each tile (outline, color).
- Each rung is an **independent packing container**. It manages its own tile layout.
- A rung may use **multiple rows** when necessary to preserve meaningful tile proportionality.
- The ladder communicates **temporal concentration and capital exposure**, not merely contract count.

### What the ladder does NOT specify (deferred)

- Exact DTE rung boundaries (policy decision — may align with operational cadence)
- Exact packing algorithm (implementation decision — treemap-like proportional packing is the intent)
- Exact colors, typography, or tile visual details (design decision)
- Health classification thresholds or scoring rules (separate ADR/design artifact)

### Tile information model

Each tile represents one option position and carries at minimum:

- Underlying symbol
- Option type (put or call)
- Strike price
- Expiration date
- DTE (current)
- Encumbered capital (strike × 100 for puts; share market value for calls)
- Current underlying price
- Distance from strike (moneyness indicator)
- Health state (when health classification is defined)

The tile may render a subset of these fields directly, with the remainder accessible via interaction (click/hover/drawer).

### Rung summary

Each rung should communicate:

- DTE interval label
- Total encumbered capital in the interval
- Number of contracts/positions
- Percentage of total encumbered capital

---

## Console Regions

### Portfolio Import / Status

A compact area showing the current state of imported portfolio data.

**Architectural requirements:**

- Shows whether portfolio inputs are present, valid, and sufficiently fresh
- Displays source provenance (filenames, timestamps, account identifier)
- Exposes validation state and warnings
- Provides a shared import/update action
- **Consumes application-scoped portfolio state (ADR-011)** — does not own independent parsing or storage
- Must not require the operator to re-upload data that was already imported on another surface

### Situation / Mission Context

Displays the active operating situation and the minimum context needed for the operator to understand how the portfolio is being evaluated.

**Architectural requirements:**

- Shows the active situation name/regime
- Shows the primary objective (e.g., monthly target, horizon)
- References `docs/25-situation-architecture.md` for situation semantics
- Does not introduce new situation concepts not defined in the situation architecture
- Should be compact — the situation is context, not content

### Capacity / Exposure Summary

Communicates the operator's current capital position at a glance.

**Required information:**

- Total encumbered capital
- Encumbered as percentage of eligible AUM
- Unencumbered/available capacity (buying power, free shares)
- Near-term obligations (capital at risk in the closest DTE rung)
- Concentration signals (when one rung or symbol dominates disproportionately)

This region provides numbers and status — the ladder provides the spatial/temporal distribution.

### NAV / Mission Progress

Architectural region for portfolio trajectory relative to the active situation's mission.

**What it distinguishes:**

- **Observed historical NAV** — actual account value over time (imported evidence)
- **Mission/planned trajectory** — the target path defined by the situation (policy)
- **Acceptable operating envelope** — boundaries within which operation is healthy (policy)

**Current status:**

- Historical observation data: no acquisition mechanism or schema ratified. A Fidelity history CSV is a possible source pending inspection of actual exports.
- Mission trajectory: a policy/situation concept, not market evidence. Defined by the active situation's objective and horizon.
- Operating envelope: a policy concept defining acceptable deviation from trajectory.

This region is architecturally reserved. Its data dependencies are unresolved. Implementation should begin with whatever historical data can be obtained and clearly labeled, and grow as data contracts solidify.

### Action Transition

Defines how the Console hands the operator into Wheelwright's recommendation and execution capabilities.

**Architectural requirements:**

- The Console identifies attention and urgency
- When the operator decides to act (write a new put, write a new call, inspect opportunities), the Console transitions them to the appropriate Wheelwright capability
- The transition preserves context (active situation, relevant symbol, relevant DTE range)
- The exact navigation mechanism (route change, slide panel, modal, tab) is not yet specified

**Deliberately deferred:** navigation mechanism, URL structure, transition animation, whether capabilities are co-rendered or separately routed.

---

## State Ownership

The Console's operation depends on several logical state categories:

| State Category | Scope | Owner | Console Role |
|---------------|-------|-------|--------------|
| Portfolio/import state | Application | Shared provider (ADR-011) | Consumer — reads snapshot, provenance, validation |
| Evidence/freshness state | Application | Shared evidence service | Consumer — reads generation, coverage, session state |
| Active situation state | Application | Shared situation context | Consumer — reads regime, objective, constraints |
| Derived monitoring state | Console | Console logic | Owner — computes DTE distribution, rung allocation, urgency |
| Recommendation state | Application | Recommendation engine | Not consumed directly — Console shows portfolio state, not recommendations |
| Local UI interaction state | Console | Console component | Owner — selected tile, expanded rung, hover state |

**Key principle:** The Console computes its own derived monitoring view (rung allocation, concentration, urgency) from shared application state. It does not duplicate or re-derive portfolio parsing, evidence acquisition, or recommendation logic.

**Implementation note:** The specific frontend mechanism for shared state (React Context, external store, module-level observable) is not specified. Any mechanism providing consistent, observable, application-scoped state satisfies the architecture.

---

## Health

Health is an important Console concept that appears on tiles and potentially in rung summaries and the capacity region.

### What is defined (architecturally)

- Health is a per-position attribute rendered on the DTE ladder
- It must be **inspectable** — the operator should be able to understand why a position has its health state
- It must be **evidence-derived** — computable from observable position metadata, not from a hidden model
- It should respect **Epistemic Integrity** — never imply more certainty about position health than the evidence supports
- It may be **situation-informed** — the same position could have different health under different situations

### What is NOT defined (deferred to Health Classification ADR)

- The specific inputs that determine health
- The number of health states and their names
- Threshold values
- Whether health is a score, classification, or structured evidence
- How health relates to existing execution assessment, delta, or moneyness
- How health changes over time as DTE decreases

---

## Implementation Status (August 2026)

The first operational slice of the Operator Console is implemented and committed.

### What has been proven

| Architectural Requirement | Implementation Status |
|--------------------------|----------------------|
| Application-scoped portfolio state | ✅ Implemented — module-level singleton store (`portfolio-store.ts`) with `useSyncExternalStore`, self-hydrating from localStorage |
| Application-scoped evidence observations | ✅ Implemented — `observation-store.ts` polls `GET /api/evidence/quotes?symbol=...`, subscriber-driven lifecycle |
| Operator Console surface | ✅ Implemented — `OperatorConsole.tsx` at route `/` |
| DTE ladder visualization | ✅ Implemented — expiration-native rungs with d3-hierarchy squarified treemap packing |
| Home route | ✅ Implemented — `/` routes to Console, `/app/write` to existing operational surface |
| Position Monitoring composition | ✅ Implemented — `Portfolio + Evidence Observations → deriveMonitoredPositions()` producing moneyness, DTE, capital, provenance |
| Moneyness visualization | ✅ Implemented — OTM/ATM/ITM borders + signed percentage magnitude |
| Tile inspection (click interaction) | ✅ Implemented — position-detail modal with progressive learning, assignment scenarios, concept explanations |
| Shared import status | ✅ Implemented — both Console and Write Desk consume the same portfolio store |

### What remains deferred

| Architectural Requirement | Status |
|--------------------------|--------|
| Situation rendering | Not implemented — situation architecture is durable but has no Console UI |
| Health classification | Not implemented — moneyness serves as the first Contract State dimension (ADR-013); Decision Pressure and full health semantics remain future work |
| NAV / mission progress region | Placeholder geometry reserved; no historical data acquisition or display |
| Capacity/exposure summary | Placeholder geometry reserved; not populated |
| Sidebar content | Placeholder only |
| Action transitions (Console → recommendation surface) | Basic navigation link exists; no context-preserving transition |

### Key implementation decisions made during the first slice

These emerged from iterative visual feedback and are working implementation choices, not ratified architectural invariants:

- **Expiration-native rungs** (one rung per actual expiration date) rather than DTE calendar bands
- **d3-hierarchy squarified treemap** for tile packing within each rung
- **sqrt value compression** to narrow capital-ratio extremes while preserving ordering
- **Content-driven rung height** computed from position count and container width
- **Variable font size** scaling with tile area for proportional information density
- **Put/call encoding via background tint** (cool blue for calls, warm purple for puts)
- **State encoding via border color** (green = OTM, yellow = ATM, red = ITM) — answering only "where is the underlying relative to strike?"
- **Progressive-learning concept definitions** centralized in `src/concepts/` for reusable explanatory content
- **Synthetic demo economics** modeling future Activity History data to evaluate the intended UX

### What the first slice explicitly does NOT ratify

- Specific ATM tolerance (±1% is a presentation constant, subject to tuning)
- Treemap geometry constants (MIN_TILE_HEIGHT, MIN_TILE_WIDTH values)
- Position-detail modal layout specifics
- Demo economics formulas
- Concept explanation prose (product content, evolving)
- Assignment consequence thresholds (±2% for appreciation/near-basis/below-basis classification)

---

## Out of Scope

This document does not resolve:

- Health Classification semantics (separate ADR/design artifact)
- Exact DTE rung boundaries (operational policy)
- Exact ladder packing algorithm (implementation)
- NAV history schema or acquisition contract (pending source investigation)
- Historical storage technology (implementation)
- Mission trajectory/envelope data model (situation policy)
- Frontend state library or technology (implementation)
- Authentication implementation (future infrastructure)
- Final routing/navigation mechanics (deferred until implementation informs)
- Visual styling system (implementation/design)
- Recommendation-engine redesign (not in scope)
- Existing code renaming (separate concern)
