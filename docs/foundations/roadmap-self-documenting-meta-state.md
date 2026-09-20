# Roadmap as Self-Documenting Meta-State

**Date:** September 2026
**Status:** Governing architectural concept — ratified
**Authority:** Category A — Governing / Current System Definition. This document defines *why* the Roadmap capability exists and what architectural property it preserves. It does not specify the Roadmap's implementation, its lenses, or its data schema; those are current expressions of this concept and may change.

---

## Governing thesis

> **The Roadmap is Wheelwright's self-documenting meta-state: a live projection of what the project currently believes, intends, prioritizes, has decided, and has yet to resolve. It stays useful because maintaining that state is part of doing the work, not a separate documentation exercise.**

## Two kinds of state

Wheelwright has **operational state** — evidence, positions, recommendations, decisions, outcomes, and other runtime/product state.

Wheelwright-the-project also has **meta-state** — what governs it, what it believes about the problem and solution, what it is trying to accomplish, what strategic bets and directions exist, what it currently prioritizes, what architectural pressures exist, what decisions have been made, what remains unresolved, and what the Principal currently sees on the product horizon.

Project meta-state naturally becomes distributed across strategy documents, principles, architecture records, ADRs, parking-lot records, journals, conversations, and actor context. The Roadmap exists to make the **governed portion** of that meta-state explicit, inspectable, and coherently projected inside Wheelwright itself.

## The recursive property

> Wheelwright does not merely document what the software does. It exposes the governed state of the thinking that is producing the software.

As Wheelwright evolves, its governed meta-state evolves with it, and the Roadmap projects that state back to the Principal. This recursive property — the system exposing the state of its own governance — is the enduring idea this document protects.

## The critical maintenance property

The Roadmap must **not** become a second, manually maintained representation of project state. Its value depends on:

> **Roadmap freshness is a side effect of doing Wheelwright work correctly.**

When normal work changes governed project meta-state, the appropriate canonical authority is reconciled as part of the normal ways of working. The Roadmap projection then changes **because the underlying meta-state changed** — not because someone maintained the Roadmap separately. If a distinct "maintain the Roadmap" activity ever becomes necessary, the architecture has failed part of the Roadmap's purpose.

The ways-of-working invariant that keeps this true lives in `bootstrap/project-memory-protocol.md`, alongside journal, parking-lot, Priority, and other project-state freshness expectations.

## Authority relationship

> canonical GitHub authority → routine actor reconciliation → build-time structured projection → read-only Roadmap → Principal inspection and course correction

The Roadmap is **not** the source of truth for the governance concepts it displays. It is the self-documenting projection of their canonical authority. Consequently:

- The Roadmap is read-only; it is never edited in the application.
- Relationships shown are **explicit-only** — exactly what canonical authority establishes, never inferred or manufactured.
- The architectural boundary that constrains how the projection crosses the repository/runtime line is governed by **ADR-018** (no runtime GitHub dependency; repository interaction is build/reconciliation-side). This concept does not restate that boundary; it depends on it.

## The feedback loop

> **governed project meta-state → projection → Principal inspection → observation/course correction → authority reconciliation → updated projection**

This is not circular authority. The Principal observes the projection and may change direction. Actors then reconcile that decision into the correct canonical authority. The Roadmap subsequently reflects the reconciled state. The projection never becomes authoritative over the state it projects.

## Consequence for the Principal

Because Wheelwright exposes its own governed meta-state, the Principal does not have to repeatedly reconstruct the intellectual state of the project from scattered documents, journals, ADRs, prior conversations, and actor memory. The Roadmap makes it possible to inspect Wheelwright and ask:

> **Does the current state of the project still represent the thing I intend to build?**

When the answer is no, that observation becomes input to the next course-correction and reconciliation cycle. This matters because Principal direction can change quickly and sharply; the model preserves that adaptability rather than turning prior planning into prescription.

## What this concept is not

- Not a justification for runtime GitHub access, a database, editable roadmap state in the application, duplicated authority, a project-management subsystem, or inferred relationships. (See ADR-018 and the explicit-only relationship rule.)
- Not defined by any particular set of lenses. The current projections — Principles, Strategy, Priority, Architecture, ADRs, Parking Lot, and Coming Soon (Now/Next/Later) — are **today's** expressions of governed meta-state. Any of them may be redesigned or removed without invalidating this concept. Self-documenting meta-state is the enduring property; the tabs are its current application.

## Relationship to existing foundations

| Foundation / record | Relationship |
|---|---|
| `bootstrap/project-memory-protocol.md` | Owns the ways-of-working invariant that keeps Roadmap freshness a side effect of doing the work. |
| `07c-adrs.md` (ADR-018) | Owns the architectural boundary (no runtime GitHub; build/reconciliation-side derivation) that constrains the projection's implementation. |
| `foundations/strategy-architecture-reconciliation.md`, `foundations/idea-intake-reconciliation.md` | The reconciliation methodologies through which governed meta-state changes before the projection reflects it. |
| `docs/parking-lot*.md` (`PL-ROADMAP-UI`) | Reconciliation provenance for the Roadmap capability; not the home of its enduring purpose (this document is). |
