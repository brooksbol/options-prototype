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

## `PL-DEPLOY` Refinement — Capital-State Management and Deployment Paths

**Date:** September 7, 2026  
**State:** RECONCILED exploration under existing `PL-DEPLOY`; no new `PL-*` identity created  
**Rich discovery record:** `docs/47-capital-state-management-deployment-paths-discovery-2026-09-07.md`

### Intake

A live operator discussion began with the current Covered-Call Candidates surface and the fact that COPX, retained after a Sep 4 buy-write call expired OTM, currently produces only one covered-call row. The discussion crossed the durability threshold because it developed a broader model already anticipated by `PL-DEPLOY` and the Regime Objective Function.

Canonical mapping:

> **Share Deployment / capital-state paths / merged capital deployment → merged/refined into `PL-DEPLOY`**

No new capital-state-management `PL-*` identity is created. Secondary pressure maps to `PL-STRAT-01`, `PL-POL-01`, `PL-PORT-01`, `PL-DEC-BEH`, and `PL-EXEC-01`.

### What was discovered

Wheelwright's natural abstraction progression is becoming:

> **options primitives → strategies/mechanisms → capital-state transitions → capital-state paths → mission-relative governed alternatives**

The immediate UI hypothesis is to evolve Covered-Call Candidates into a **Share Deployment — Prod v0** surface parallel to **Cash Deployment — Prod v0**, with the leftmost `Entry` column representing alternatives such as CC, Collar, Sell, and Hold. Multiple CC rows can represent materially different production/upside/disposition bargains rather than duplicate contracts.

The deeper hypothesis is that Cash Deployment and Share Deployment may eventually converge into a unified **Capital Deployment — Prod v0** surface. A recommendation row could represent a complete path, not merely a trade, for example:

- COPX shares → CC;
- COPX shares → Collar;
- COPX shares → cash;
- COPX shares → cash → another symbol's CSP/BW;
- COPX shares → cash → COPX CSP/BW.

Share → cash may therefore be an intermediate state. Selling current ownership and later accepting a compensated conditional obligation on the same symbol is not contradictory.

### Concrete COPX why-state

The real Activity evidence establishes approximately $94.93/share stock acquisition basis for 100 COPX and about $341.34 net premium from the expired Sep 4 $95 call. That produces a useful capital-cycle reference of approximately $91.5146/share after prior premium. At the sealed $90.66 reference, stock-only unrealized change is about -$427 while the prior whole-cycle capital shortfall is only about -$85.46.

This demonstrates:

> **stock/accounting basis ≠ capital-cycle basis**

and:

> **cost basis is decision context, not a command to wait for recovery.**

The Sep 18 $93 CC and Sep 11 $95 CC examples show different economically meaningful flavors: more current premium/earlier possible disposition versus less premium/more retained recovery and upside. A below-stock-basis call-away can still leave the complete production cycle profitable after prior/current premium.

Selling COPX at a realized loss can also be rational if the released cash has a materially better governed use. Asset acceptability (“willing to own”) is distinct from current allocation preference (“best use of capital now”).

### Mission / production / erosion refinement

The governing mission remains hard:

> **Sustain target monthly realized production from available capital while preserving the productive capacity of that capital.**

The Principal clarified that prior-month Production is withdrawn. Therefore realized premium that is distributed cannot simultaneously be counted as retained repair of capital erosion. Productive output and productive capacity are distinct flows.

At the same time, the semantics of erosion should not be universal strategy mechanics. The active mission regime should determine how erosion, retained/distributed production, capital velocity, hedge cost, and similar consequences are valued or constrained. This directly pressures `PL-POL-01` Cash-Flow-Safe Recovery and reinforces that the Cash-Flow Operating Regime is a regime rather than Wheelwright's permanent identity.

### Operator Strategy Policy refinement

This discussion returns directly to the questionnaire discovery. The questionnaire is still an elicitation mechanism, not architecture. Its deeper role may extend from matching named strategies to describing what consequences and capital-state paths the operator is willing to own under the active mission regime.

Refined conceptual flow:

> **Mission regime → Operator policy → current capital state → admissible paths → strategy/broker eligibility → evidence/executable contracts → consequence envelope → compensation relative to consequence → mission fitness → 0..N recommended paths**

The existing hard-gate and 0..N invariants remain in force.

### Fidelity / collar correction captured by the rich record

Observed Fidelity UI on the Principal's visibly Tier 1 account exposes Collar and presents only the two option legs when 100 shares already exist. This supersedes the earlier `docs/46` derived “Collar = Tier 2” assumption for this account/context. The rich record preserves the distinction among `explicit-doc`, `observed-ui`, `derived`, and `conditional/unverified` broker evidence and the invariant:

> **economic position shape ≠ broker order shape ≠ resulting portfolio consequence**

The Fidelity order-level “Max Loss Unlimited” display on a collar order also demonstrates why broker order-risk presentation must not be blindly treated as resulting portfolio risk when existing inventory supplies coverage.

---

## Reconciliation Completion Record — `PL-DEPLOY` / capital-state management refinement

### Intake

Canonical identity: **`PL-DEPLOY`**. No new parking-lot ID is created.

Rich why/evidence record: `docs/47-capital-state-management-deployment-paths-discovery-2026-09-07.md`.

Secondary mappings: `PL-STRAT-01`, `PL-POL-01`, `PL-PORT-01`, `PL-DEC-BEH`, `PL-EXEC-01`.

### Strategic disposition

**Strengthens existing strategic direction; no roadmap change required.**

`PL-DEPLOY` already calls for normalized mission-aware portfolio actions, and the Regime Objective Function already asks whether Wheelwright should eventually expose a unified “Where should this capital go?” surface. This discovery extends that existing direction from competing cash-entry mechanisms to owned-inventory actions and complete capital-state paths.

### Architectural disposition

**Refines existing Deployment Opportunity / governed-alternatives pressure; no new architecture direction is authorized.**

The discovery suggests that a future comparison object may need current state, transition/path, resulting state, consequence envelope, compensation, and mission/policy fitness. It does **not** authorize a generic state machine, arbitrary strategy DSL, path-search optimizer, new recommendation service, or merged UI implementation.

### Parking-lot disposition / mapping

**Retained and refined under `PL-DEPLOY`.**

Related existing concerns are not merged away:

- `PL-STRAT-01` continues to own strategy admission and Operator Strategy Policy pressure;
- `PL-POL-01` continues to own cash-flow-safe recovery/erosion-policy questions;
- `PL-PORT-01` continues to own portfolio-state and lot/basis maturity;
- `PL-DEC-BEH` continues to own behavioral discipline around basis, loss realization, and sunk-cost/reference-point effects;
- `PL-EXEC-01` continues to own lifecycle/execution boundaries.

### Why-state

Durable why-state is preserved in:

- `docs/47-capital-state-management-deployment-paths-discovery-2026-09-07.md`

The artifact preserves the COPX lifecycle trigger, real cost/cycle basis calculations, CC variants, collar examples, Fidelity Tier 1 observation, order-vs-position distinction, execution caution, Share/Capital Deployment hypotheses, mission/erosion discussion, and return to Operator Strategy Policy.

No additional journal entry is required for this snapshot because the rich discovery record preserves the material unfinished intellectual state and this canonical record exposes the complete disposition.

### Next authorized mode

**Further exploration / design only.**

Useful next work is to determine the smallest useful capital-state/path representation, decide whether Share Deployment should be an intermediate learning surface before any merge, determine how Hold/Sell/Collar/multi-step paths interact with `Prod v0`, identify hard gates versus graded mission-fit dimensions, and define the minimum basis/provenance required for correct owned-inventory consequences.

**Not authorized:** Share Deployment implementation, Capital Deployment implementation, `Prod v0` changes, automatic selling/redeployment, direct broker execution, strategy admission, generalized state/path framework, new mission regimes, policy promotion, or roadmap reprioritization.

---

## Continuation History

| Date | Event |
|---|---|
| Sep 7, 2026 | Fidelity options-tier execution eligibility reconciled into existing `PL-STRAT-01`. The strategy surface was refined from eight to nine dimensions by adding Minimum Fidelity Options Tier while preserving explicit-vs-derived broker evidence. No strategy admission, broker integration, or implementation was authorized. |
| Sep 7, 2026 | Capital-state management / deployment-path discovery reconciled into existing `PL-DEPLOY`, with secondary mappings to strategy policy, erosion/recovery policy, portfolio-state maturity, behavioral discipline, and lifecycle execution. Rich snapshot: `docs/47-capital-state-management-deployment-paths-discovery-2026-09-07.md`. No implementation authorized. |
