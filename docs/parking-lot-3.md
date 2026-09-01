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

---

## Reconciliation Completion Record — `PL-EVID-AGE` (Deployment Evidence Age, first slice)

**Date:** September 1, 2026  
**Method:** `docs/foundations/idea-intake-reconciliation.md`  
**Reconciliation state:** RECONCILED (first slice). Produced across a 3AM design session with three independent review rounds that each falsified part of an earlier model and were corrected before commitment.

### Intake

Canonical identity: `PL-EVID-AGE` (this file). Rich discovery record: `docs/41-operator-intent-evidence-age-intake.md`. GitHub Issue #1 is supporting workflow only, not canonical intake identity.

### Strategic disposition

**Strengthens existing Bets; no new Bet; no roadmap change required.** `PL-EVID-AGE` is the observational precursor to roadmap **G6/N1 — Decision-value-aware evidence acquisition**: it provides operator-visible instrumentation to gather the operator-value evidence N1's Bet needs *before* any scheduler change. It also concretizes the cross-cutting **Trustability** differentiator by putting per-row evidence freshness/provenance on the primary decision surface. The N1 constraint (no scheduler change during Constraint Identification) is respected because this slice is observational only. Differentiation lens: the Age display is *enabling instrumentation*, not itself the differentiator; it enables future differentiating allocation. "Good enough" for this first slice = truthful per-row chain-acquisition age, compact + sortable, advancing with wall-clock, observational only. (An optional one-line "N1 precursor instrumentation" note in `roadmap.md` remains deferred to Principal; not made here.)

### Architectural disposition (corrected — see ADR-015)

**New cross-cutting architecture constraint discovered; a new ADR was required and has been ratified as ADR-015 (Evidence Provenance Authority and Preservation).** The earlier "no architecture change / frontend-internal" disposition is **withdrawn**.

Ruling: **authoritative evidence provenance is established upstream, at the evidence/publication boundary. Downstream consumers may preserve, compose, and present provenance, but may not infer or manufacture its authority from normalization shape, fallback timestamps, cache timestamps, or synthesized clocks. Provenance claims are subject-scoped.** Concise boundary: *the frontend may calculate what to display from authoritative facts; it must not decide what facts are authoritative.*

First-slice semantic: **Age = option-chain acquisition age = `now − acquiredAt` of the option-chain record that supported the row.** Provenance is an explicit, subject-scoped state (`chain-acquired` | `unavailable`) **established by the publisher** and carried additively in the snapshot (`chains[].chainAcquisitionProvenance`; `primaryChainAcquisitionProvenance` for the legacy primary chain — see `docs/contracts/evidence-snapshot-v1.md`). The frontend consumes the explicit provenance; the browser does **not** decide authority. The provisional frontend `sym.chains`-vs-`sym.chain` heuristic is therefore superseded and must be removed. Symbol-level `symbols[].retrievedAt`, cache TTL timestamps, and `Date.now()` carry **no operator-facing Age provenance authority**.

Relationship to existing decisions: conforms to ADR-001 (recommendation reads cache, zero provider calls), ADR-003 (Age is sortable presentation, not a rank input), ADR-013 (generalized by ADR-015), AR9 (no acquisition/scheduler change). Relates to AR6 / PL-ARCH-06 as pressure/evidence only; **recommendation engines are not relocated** in this slice — they may continue transitionally where they live, provided they *consume* authoritative provenance rather than *create* it.

Snapshot change: additive, subject-scoped provenance fields under INV-PUB-05 (no version increment, documented, compatibility-tested). This is a **real published-contract change**, not "frontend-internal." Legacy primary chain **inherits** authoritative provenance from its per-expiration record (verified in `SqliteEvidenceStore.getEvidence`, which already reads the primary chain's `retrieved_at`); `unavailable` is reserved for an existing chain subject whose authority genuinely cannot be established.

### Governing epistemic rule (now ADR-015, clause 4/6)

> **Internal freshness/cache timestamps and operator-facing evidence provenance are distinct semantics. A synthesized or fallback timestamp used for cache/freshness mechanics must never silently become operator-facing evidence provenance. Provenance has a subject: a claim must name what was acquired, not merely when.**

Ratified as **ADR-015** (the earlier "open ADR question" is decided).

### Known provenance limitation (durable — do not lose)

- **Desired future semantic:** age of the *oldest economically material evidence* actually used by the row.
- **Current implementable semantic (this slice):** option-chain acquisition age.
- **Why the gap exists:** for calls and buy-writes the underlying spot may come from a **cached quote acquired up to approximately 60 seconds *before* the option chain** (backend `QUOTE` TTL 60s); its independent acquisition provenance is not retained in the current composite chain representation. No provider/exchange observation timestamp exists anywhere (Tradier is ~15-min delayed; a delay-subtracted "observed" time would be an estimate, not evidence). `chainAcquisitionProvenance` therefore **cannot** support the stronger "oldest economically material evidence age." Closing the gap requires separately preserving quote-acquisition provenance — out of scope for this slice, retained under this ID.

### Process-gate and experiment disclosures (durable)

- **Process-gate violation:** implementation of the first slice was performed after reconciliation but **before Principal authorization**, crossing the commitment gate. The resulting working tree is retained as **provisional implementation evidence only**; it is not accepted project state and was not committed. Durable authority (this ADR-015 + records) was established first; implementation is separately authorized afterward.
- **Live-experiment repository-state discontinuity:** during the September 1 capture, the shared checkout was pulled `9c352c3 → 8fc0594` despite a no-touch instruction. The intervening diff was documentation-only and the running backend/observer processes remained on `9c352c3`-loaded code, so runtime behavior was unaffected; repository-state continuity was nonetheless broken and is disclosed here and in the final experiment record rather than rationalized away.

### Parking-lot disposition / mapping

`PL-EVID-AGE` **retained**. First implementation scope narrowed to the observational Deployment Age column (strict chain-acquisition age). The broader operator-intent acquisition-tier thesis and the stronger-provenance ("oldest material evidence") work remain **deferred / unauthorized** under this same ID.

### Why-state

Durable why-state preserved in the journal entry dated 2026-09-01 (Deployment Evidence Age reconciliation), including: the provider-bound-regime motivation, the three review corrections, the timestamp/provenance-separation rule, and the live-experiment repository-state discontinuity disclosure.

### Next authorized mode

**Durable authority first, then separate implementation authorization.** ADR-015 and this corrected record are persisted into durable project authority; the resulting durable-state diff is reported to the Principal for review. Implementation of the reworked slice (backend publication of subject-scoped provenance; frontend consumption; presentation; CSV) is **not** authorized by this record — it requires a separate, explicit Principal authorization after the durable state is reviewed. The prior uncommitted working tree remains provisional evidence only and is not to be committed as implementation. When authorized, the slice is observational only (no effect on ranking, quality, governance, tiers, scheduler priority, or acquisition policy) and commit remains separately gated.

---

## Continuation History

| Date | Event |
|---|---|
| Sep 1, 2026 | `docs/parking-lot-3.md` created. `PL-EVID-AGE` established as the canonical stable intake identity for Deployment evidence Age and the related operator-intent acquisition-tier investigation. This normalizes the earlier standalone Doc 41 / GitHub Issue #1 intake into the standard parking-lot-first pipeline. |
| Sep 1, 2026 | `PL-EVID-AGE` Reconciliation Completion Record added (first slice = observational Deployment Age). Strengthens G6/N1 + Trustability; no new Bet; no roadmap change; no architecture-roadmap change; no new architecture ratification. Whether the timestamp/provenance-separation rule warrants its own ADR is an open Principal decision. Next authorized mode: implementation (single owner Kiro), observational only, commit gated. |
| Sep 1, 2026 | `PL-EVID-AGE` Reconciliation Completion Record **corrected** after Principal review. Architectural disposition revised from "no change" to **ADR-015 ratified** (Evidence Provenance Authority and Preservation): provenance authority is upstream at publication; downstream preserves/composes/presents but does not establish it; provenance is subject-scoped. Snapshot gains additive subject-scoped fields (`chains[].chainAcquisitionProvenance`, `primaryChainAcquisitionProvenance`) under INV-PUB-05 — a real contract change. Recorded the process-gate violation (implementation occurred before authorization; retained as provisional evidence only) and the live-experiment repository-state discontinuity. Next authorized mode: durable authority first, then a separate implementation authorization. |
| Sep 1, 2026 | `PL-EVID-AGE` shipped to production (Age live, backend-published subject-scoped provenance; regime boundary 13:24:23 MDT). Post-release review correction pass added focused tests and a publisher timestamp-validation fix (no-silent-promotion). **Bounded follow-up recorded under `PL-EVID-AGE` (deferred, not a defect):** make `evidenceProvenance` **required** on chain-derived types (chain-derived cache records, Deployment candidates, conditioned-call evidence/opportunities; non-chain cache records exempt). Currently optional → missing degrades safely to `unavailable`; tightening is material (~7 interfaces, ~100 test/fixture refs) so it is a separate future increment. Also still deferred under this ID: quote-acquisition provenance and the stronger "oldest economically material evidence age" semantic. |