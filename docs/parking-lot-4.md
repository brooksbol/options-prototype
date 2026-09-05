# Project Parking Lot — Continuation 4

> This file is a physical continuation of `docs/parking-lot.md`, `docs/parking-lot-2.md`, and `docs/parking-lot-3.md`. Together, all `docs/parking-lot*.md` files constitute **one logical Wheelwright parking lot**.

**Started:** September 6, 2026  
**Status:** Canonical Project / Operational State (Category C), same authority and governance as the preceding parking-lot files  
**Governing intake method:** `docs/foundations/idea-intake-reconciliation.md`

---

## Continuation Invariant

This is not a new backlog or namespace.

- All stable IDs are globally unique across the complete `docs/parking-lot*.md` sequence.
- New material ideas enter through the standard pipeline in `docs/foundations/idea-intake-reconciliation.md`.
- New intake is recorded in the latest continuation after checking the complete parking-lot sequence for an existing concept.
- Row order is not priority.
- Merge, split, supersession, promotion, rejection, and resolution preserve explicit disposition/mapping.
- A Principal decision to work on an item next changes sequencing, not its reconciliation/design state.

---

## Active Items — Architecture / Engineering Method

| ID | Name | Summary | Concept Home |
|---|---|---|---|
| `PL-ARCH-FITNESS-01` | Architectural Fitness Functions / Executable Architecture Invariants | **Durable discovery; intake only, not yet reconciled or authorized.** Wheelwright already has tests and structural checks that behave like architectural fitness functions in the evolutionary-architecture sense, but they emerged incidentally rather than as a deliberately classified or governed capability. The useful distinction is between ordinary behavioral regression tests, tests that explicitly protect an invariant, and true architectural fitness functions that protect an architectural property across future implementations. Candidate properties already visible in Wheelwright include engineering-boundary dependency rules, evidence/recommendation separation, ADR-015 provenance-authority preservation, ADR-016 association-authority preservation, and other mechanically observable architecture constraints. Working hypothesis: when an architectural decision creates a property whose violation can be detected mechanically, Wheelwright should **consider** whether that property deserves an executable fitness function; this is not a requirement that every ADR be mechanically tested. A lightweight maturity model may be useful: prose-only where mechanical enforcement is inappropriate; incidental regression coverage; explicitly named invariant tests; structural tooling such as ArchUnit/dependency/schema/static rules; and only where evidence warrants it, continuous quantitative fitness functions with thresholds/trends. This fits the existing deterministic ratchet: **probabilistic reasoning discovers architectural truth → durable authority establishes it → deterministic checks protect the mechanically observable portion.** The concern is avoiding both under-protection and a heavyweight fitness-function program or pseudo-tests that create governance theater. **Unresolved:** whether existing tests should merely be classified/reviewed, whether selected ADR/invariant properties should gain explicit executable protection, what assurance level is proportionate by change class, and whether repeated evidence eventually justifies a more formal program. **Not authorized:** no new governance artifact, testing framework, broad test rewrite, ArchUnit expansion, Sonar policy change, or implementation work. | `docs/foundations/technology-quality-constitution-v1.md`; `docs/technology-quality-program-v1.md`; `docs/07c-adrs.md` (especially ADR-015/ADR-016); existing architecture/invariant tests and structural checks; multi-actor deterministic-ratchet practice |

---

## Intake Note — `PL-ARCH-FITNESS-01`

**Trigger:** During the Production Disposition Truth implementation, the Principal observed that a substantial portion of Wheelwright's existing testing could already be considered architectural fitness functions, but that this protection is incidental rather than rigorous, and questioned whether additional rigor would be valuable.

**Why it may matter:** Wheelwright increasingly converts probabilistically discovered truths into durable architectural authority and deterministic invariants. Explicitly recognizing the subset that can be mechanically protected may reduce repeated reasoning, architectural drift, and future change risk without requiring a heavyweight architecture-compliance regime.

**Related existing concepts:** Technology Quality Constitution / Program; ADR and invariant discipline; ArchUnit-like structural enforcement; SCA as a quality evidence layer; multi-actor adversarial review; the deterministic ratchet from probabilistic discovery to executable evidence.

**Current disposition:** `INTAKE`. Repository search found no existing parking-lot identity specifically owning architectural fitness functions or executable architecture-invariant classification. Strategic and architectural reconciliation remain required before any promotion, decomposition, or implementation.

**Authorization boundary:** Preserve the idea. Do not interrupt the active Production Disposition Truth slice and do not create a formal fitness-function program merely because the concept is durable.
