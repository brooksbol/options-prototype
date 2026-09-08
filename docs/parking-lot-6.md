# Project Parking Lot — Continuation 6

> This file is a physical continuation of `docs/parking-lot.md` through `docs/parking-lot-5.md`. Together, all `docs/parking-lot*.md` files constitute **one logical Wheelwright parking lot**.

**Started:** September 7, 2026  
**Status:** Canonical Project / Operational State (Category C), same authority and governance as preceding parking-lot files  
**Governing intake method:** `docs/foundations/idea-intake-reconciliation.md`

---

## Continuation Invariant

This is not a new backlog or namespace. Stable IDs remain global across the complete parking-lot sequence; row/file position is not priority; new material is reconciled against existing canonical concerns before a new identity is created.

---

## `PL-STRAT-01` Refinement — Fidelity Options-Tier Execution Eligibility

**Date:** September 7, 2026  
**State:** RECONCILED exploration under existing `PL-STRAT-01`; no new `PL-*` identity created  
**Rich discovery record:** `docs/46-options-strategy-surface-fidelity-tier-refinement-2026-09-07.md`

### Intake

The Principal supplied Fidelity's current Tier 1/2/3 option-strategy permissions and approved adding broker applicability to the comparative strategy surface. This does not create a new backlog concern. It refines existing **`PL-STRAT-01` Strategy Expansion Governance**, the comparative strategy surface, and Operator Strategy Policy / governed matching work.

Canonical mapping:

> **Fidelity options-tier applicability → merged/refined into `PL-STRAT-01`**

The strategy surface now has a ninth concrete dimension: **Minimum Fidelity Options Tier**. The rich discovery record preserves the complete nine-column surface.

### What was discovered

Broker permission is not an economic property of a strategy and should not distort policy fitness. It is a separate execution-eligibility constraint.

The Fidelity source supplied by the Principal states:

- Tier 1: buy-writes, covered calls/rolls, buying calls/puts, cash-covered puts, long straddles/strangles;
- Tier 2: Tier 1 plus spreads up to four legs and covered puts secured by short stock;
- Tier 3: Tier 2 plus uncovered calls/puts and short straddles for stocks, ETFs, and indexes.

The mapping therefore distinguishes **explicit** Fidelity permissions from **derived/conditional/unverified** mappings for named constructions Fidelity did not explicitly enumerate. Wheelwright must not silently convert an inference such as “this appears to fit the four-leg spread permission” into broker-authoritative fact.

### Why it matters

The strategy-policy work previously separated hard admission constraints, policy fitness, and current opportunity selection. Broker/account capability adds another independent gate.

The refined model is:

> **Wheelwright strategy admission**
>
> → **Operator Strategy Policy**
>
> → **Broker/account execution eligibility**
>
> → **Current evidence and executable contracts**
>
> → **Consequence / compensation evaluation**
>
> → **Portfolio-state evaluation**
>
> → **0..N recommended alternatives**

This allows Wheelwright to distinguish:

> **Not recommended**

from:

> **Economically/policy compatible, but unavailable under the current broker/account permissions.**

For example, a Tier 1 Fidelity account can make a CSP executable while a policy-compatible bull put credit spread remains unavailable until Tier 2. That account limitation should not cause Wheelwright to misrepresent the spread as economically inferior.

The broader architectural concept is **broker/account execution eligibility**, not Fidelity-specific strategy quality.

---

## Reconciliation Completion Record — `PL-STRAT-01` / Fidelity tier refinement

### Intake

Canonical identity: **`PL-STRAT-01`**. No new parking-lot ID is created.

Rich why/evidence record: `docs/46-options-strategy-surface-fidelity-tier-refinement-2026-09-07.md`.

### Strategic disposition

**Strengthens existing strategic direction; no roadmap change required.**

The refinement strengthens C2 governed trade-shape repertoire and the existing strategy-policy matching work by making real-world account executability explicit without confusing it with economic suitability.

### Architectural disposition

**Refines existing governed-alternatives pressure; no new architecture direction is authorized.**

Broker/account execution eligibility is now a useful conceptual distinction from strategy admission and operator-policy eligibility. This does **not** authorize a broker-capability service, Fidelity API integration, generic broker abstraction, recommendation engine, or UI.

### Parking-lot disposition / mapping

**Retained and refined under `PL-STRAT-01`.**

The prior eight-column strategy surface remains the origin of the comparative model; `docs/46-options-strategy-surface-fidelity-tier-refinement-2026-09-07.md` supersedes its table for current comparative use by preserving all eight dimensions and adding the ninth Fidelity-tier dimension.

### Why-state

Durable why-state is preserved in:

- `docs/44-options-strategy-surface-discovery-2026-09-07.md` — original eight-dimensional strategy surface and interpretation;
- `docs/45-operator-strategy-policy-governed-matching-discovery-2026-09-07.md` — Operator Strategy Policy and 0..N matching model;
- `docs/46-options-strategy-surface-fidelity-tier-refinement-2026-09-07.md` — nine-column Fidelity-tier refinement and explicit-vs-derived evidence discipline.

No additional journal entry is required because these discovery records preserve the material reasoning and this canonical record exposes the disposition.

### Next authorized mode

**Further exploration / research only.**

Conditional Fidelity mappings should be verified when they become relevant to actual strategy admission or execution. Other brokers may later be characterized similarly if concrete project pressure warrants it; do not prematurely generalize a broker-permission framework.

**Not authorized:** strategy admission, broker integration, recommendation-engine implementation, UI work, generalized trade-shape framework work, policy promotion, or roadmap reprioritization.

---

## Continuation History

| Date | Event |
|---|---|
| Sep 7, 2026 | Fidelity options-tier execution eligibility reconciled into existing `PL-STRAT-01`. The strategy surface was refined from eight to nine dimensions by adding Minimum Fidelity Options Tier while preserving explicit-vs-derived broker evidence. No strategy admission, broker integration, or implementation was authorized. |
