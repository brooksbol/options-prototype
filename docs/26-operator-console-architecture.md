# Operator Console Architecture

**Status:** Design — not yet implemented
**Date:** July 2026
**Depends on:** ADR-011 (Application-Scoped Portfolio Ingestion), ADR-012 (Operator Console as Home Surface), `docs/25-situation-architecture.md`

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

## Current Implementation Gap

The target architecture differs from the current repository state:

| Architectural Requirement | Current State |
|--------------------------|---------------|
| Application-scoped portfolio state | Page-local in `WriteDesk.tsx` component state |
| Application-scoped evidence/freshness | Page-local in `WriteDesk.tsx` (`evidenceMeta`, polling loop) |
| Operator Console surface | Does not exist — only `WriteDesk` and `App` (labs) |
| DTE ladder visualization | Not implemented |
| Home route | Currently resolves to the existing operational page (`/app/write`) |
| Situation rendering | Not implemented (situation architecture is durable but has no UI) |
| Health classification | Not defined or implemented |
| NAV historical data | No acquisition mechanism or display |
| Shared import status area | Import UI exists in `FidelityUpload.tsx` but is page-local to WriteDesk |

**Migration path (high-level, not an implementation plan):**

1. Lift portfolio and evidence state to application scope (implements ADR-011)
2. Create the Console surface and register it as the home route
3. Implement the DTE ladder from shared portfolio state
4. Render situation context from shared situation state
5. Connect capacity/exposure summary
6. Add action transitions to existing recommendation capabilities
7. Address NAV and health as their data contracts become available

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
