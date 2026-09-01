# Project Parking Lot — Continuation 3

> This file is a physical continuation of `docs/parking-lot.md` and `docs/parking-lot-2.md`. Together, all `docs/parking-lot*.md` files constitute **one logical Wheelwright parking lot**.

**Started:** September 1, 2026  
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

## Active Items — Continuation

### Evidence / Operator-Usefulness Family

| ID | Name | Summary | Concept Home |
|---|---|---|---|
| `PL-EVID-AGE` | Deployment Evidence Age / Operator-Intent Acquisition Feedback | **Principal-selected next workstream; intake complete, strategic/architectural reconciliation required before implementation.** Add an operator-visible **Age** column to each Deployment table so a row answers: **“How old are the market observations from which this displayed row was calculated?”** Age must not mean UI render age or merely decision-object recomputation age. Working conservative semantic for 3AM validation: `now - oldest observation timestamp among market evidence actually used to produce the row`. Initial exposure is observational only: Age does not become a ranking/quality factor and does not itself change acquisition priority. The purpose is to create real-world operator feedback about whether finite provider capacity is being spent on information the operator actually values. The broader capability thesis is that acquisition should eventually return to tiers parameterized by probabilistic operator demand / decision relevance: **information-product quality → probable operator interest → acquisition tier/priority → achieved freshness**. Age is ideally an outcome of that allocation; a separate maximum-age validity boundary may still be required. This work appears to strengthen roadmap G6/N1 Decision-value-aware evidence acquisition and Trustability rather than presume a new Bet. Rich discovery/intake record: `docs/41-operator-intent-evidence-age-intake.md`. GitHub Issue #1 is supporting workflow only, not canonical intake identity. **Authorization boundary:** 3AM design/reconciliation is next; no scheduler-policy change, demand-aware prioritization implementation, new tier parameters, scalar utility score, or Age-as-ranking input is authorized yet. | `docs/41-operator-intent-evidence-age-intake.md`; `docs/roadmap.md` G6/N1; `docs/architecture-roadmap.md`; `PL-DEPLOY`; complete acquisition/evidence family; `docs/foundations/idea-intake-reconciliation.md` |

---

## Continuation History

| Date | Event |
|---|---|
| Sep 1, 2026 | `docs/parking-lot-3.md` created. `PL-EVID-AGE` established as the canonical stable intake identity for Deployment evidence Age and the related operator-intent acquisition-tier investigation. This normalizes the earlier standalone Doc 41 / GitHub Issue #1 intake into the standard parking-lot-first pipeline. |
