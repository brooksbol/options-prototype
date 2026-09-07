# Project Parking Lot — Continuation 5

> This file is a physical continuation of `docs/parking-lot.md`, `docs/parking-lot-2.md`, `docs/parking-lot-3.md`, and `docs/parking-lot-4.md`. Together, all `docs/parking-lot*.md` files constitute **one logical Wheelwright parking lot**.

**Started:** September 7, 2026  
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

## `PL-STRAT-01` Refinement — Hedged Broken-Wing Butterfly (HBWB)

**Date:** September 7, 2026  
**State:** RECONCILED exploration under existing `PL-STRAT-01`; no new `PL-*` identity created  
**Rich discovery record:** `docs/43-hedged-broken-wing-butterfly-discovery-2026-09-07.md`

### Intake

The September 7 HBWB discussion crossed the durability threshold but does **not** create a genuinely new backlog concern. It refines existing **`PL-STRAT-01` Strategy Expansion Governance**, whose purpose is to evaluate candidate strategies beyond the current CSP / covered-call / buy-write set and whose existing scope explicitly includes reconsideration of butterflies when new reasoning warrants it.

Canonical mapping:

> **HBWB discovery → merged/refined into `PL-STRAT-01`**

No separate `PL-HBWB-*` item is created. The commercial strategy name is a candidate instance inside the existing strategy-admission concern, not a new project namespace.

### What was discovered

A commercially presented strategy called the **Hedged Broken-Wing Butterfly (HBWB)** appears to use a put `+1 / -2 / +2` quantity shape rather than a conventional `+1 / -2 / +1` butterfly. The extra far-OTM long put may create net long downside tail exposure once all strikes are in the money, giving a plausible mechanical basis for the presenter's crash-protection claim.

The presenter also claims the structure can be delta/gamma neutral, long vomma, forgiving on T+0, and unlike many short-premium strategies is not harmed by volatility in the same way. Because the presenter is selling a masterclass, these claims are treated as **hypotheses requiring independent verification**, not as evidence.

An unresolved source discrepancy remains around the lower-leg delta. The screenshots visually appear to show `-03`, while the Principal stated that it should be `-30`. The `-03` reading is mechanically consistent with both farther-OTM strike ordering and an approximately delta-neutral `30/18/3` recipe; the `-30` reading is not obviously consistent with those same assumptions. **Do not encode either recipe as authoritative until primary-source verification.**

### Why it may matter

The HBWB may represent a materially different risk-engineering idea from a simple vertical spread:

- vertical spread: surrender premium to buy a finite adverse boundary;
- HBWB hypothesis: sell intermediate option exposure to help finance additional far-tail convexity that may become more valuable during severe price/volatility stress.

If that hypothesis survives mechanical and empirical testing, it could deepen Wheelwright's understanding of compensation relative to consequence and of when paying for defined/tail risk improves portfolio-level deployment quality.

The discussion also reaffirmed an existing Wheelwright research discipline:

> **Investigate failure modes first. Do not begin with the advertised upside case.**

The initial failure-mode map is preserved in the rich discovery record and includes: intermediate-loss valley, adverse spot move without expected IV response, skew-shape risk, hostile theta states, hedge drag, execution/slippage, locally true but globally misleading Greeks, discretionary-management dependence, and correlated portfolio exposure.

---

## Reconciliation Completion Record — `PL-STRAT-01` / HBWB refinement

### Intake

Canonical identity: **`PL-STRAT-01`**. The HBWB is a refinement/candidate instance under that existing strategy-expansion concern, not a new parking-lot item.

Rich why/evidence record: `docs/43-hedged-broken-wing-butterfly-discovery-2026-09-07.md`.

### Strategic disposition

**Strengthens existing strategic Bets; no roadmap change required.**

Relevant existing roadmap homes already express the useful intent:

- **C2 — Broader governed trade-shape repertoire:** HBWB is a possible future candidate trade shape, not yet an admitted strategy.
- **K1 — Consequence envelopes:** HBWB pressures the need to understand the entire consequence surface rather than premium alone.
- **K2 — Compensation relative to consequence:** the research question is what risk is sold to finance the hedge and whether compensation is adequate for the resulting state-dependent consequence.
- **L3 — Risk-profile performance can be learned empirically:** HBWB is another candidate risk profile whose hedge cost, drawdown behavior, capital efficiency, and realized downside could eventually be compared against simpler strategies.

No new Bet is warranted merely because a commercially named structure exists. No roadmap edit is made.

### Architectural disposition

**Refines existing architecture pressure; no new architectural direction required.**

The discovery maps cleanly to:

- **AR3 — Governed Alternatives / reusable economic primitives:** HBWB adds concrete multi-leg pressure, but the existing roadmap explicitly requires strategy extensibility abstractions to be **earned through concrete strategy pressure**. This discovery does **not** authorize a generic arbitrary-trade-shape framework.
- **AR4 — Consequence semantics before explanation:** HBWB reinforces the need for structured spot/time/volatility-sensitive consequence semantics if such a strategy ever advances.

No new engine, service, registry, DSL, trade-shape taxonomy, or generalized payoff framework is authorized by this reconciliation.

### Parking-lot disposition / mapping

**Retained and refined under `PL-STRAT-01`.**

The prior broad treatment of butterflies as prediction-dependent remains a hypothesis subject to the same correction learned from credit spreads: payoff geometry alone does not prove that the **decision process** is predictive. HBWB must independently pass the existing Architectural Admission Test.

This record does **not** reopen all butterflies, admit HBWB, or change the operational strategy set.

### Why-state

Durable why-state is preserved in:

- `docs/43-hedged-broken-wing-butterfly-discovery-2026-09-07.md`

That record distinguishes presenter claims from derived mechanics, preserves the commercial-source incentive, records the unresolved delta discrepancy, and captures the failure-mode-first research posture.

No additional journal entry is required for this reconciliation because the rich discovery record preserves the material unfinished intellectual state and this canonical parking-lot record exposes the complete disposition.

### Next authorized mode

**Further exploration / research only.**

Next useful work, if selected by the Principal, is to obtain the exact primary-source recipe and mechanically test failure modes before evaluating profitability:

1. verify DTE, strike/delta selection, quantities, debit/credit target, and management/exit rules;
2. map terminal and intermediate-time P/L;
3. shock spot, IV, skew, and time independently and jointly;
4. inspect delta/gamma/theta/vega/vomma across the state space;
5. model realistic execution and hedge drag;
6. evaluate portfolio aggregation/correlation;
7. only then compare production and risk-profile outcomes against simpler governed alternatives.

**Not authorized:** strategy admission, recommendation-engine implementation, Deployment UI work, broker integration, generalized multi-leg framework work, policy promotion, or roadmap reprioritization.

---

## `PL-STRAT-01` Refinement — Comparative Options Strategy Surface

**Date:** September 7, 2026  
**State:** RECONCILED exploration under existing `PL-STRAT-01`; no new `PL-*` identity created  
**Rich discovery record:** `docs/44-options-strategy-surface-discovery-2026-09-07.md`

### Intake

The September 7 strategy-survey discussion crossed the durability threshold because it developed a reusable comparative model for evaluating option strategies. It does **not** create a new backlog concern. It refines existing **`PL-STRAT-01` Strategy Expansion Governance**.

Canonical mapping:

> **Comparative options strategy surface → merged/refined into `PL-STRAT-01`**

No separate strategy-surface `PL-*` identity is created. The surface is a research instrument for the existing strategy-admission concern, not a new project namespace or admitted strategy catalog.

### What was discovered

A conventional list of named strategies was progressively expanded into an eight-dimensional comparative surface:

1. strategy;
2. popularity / prevalence;
3. typical users;
4. typical market view;
5. core shape;
6. risk character;
7. prediction dependence;
8. reward surface relative to other strategies.

The comparison revealed that several properties routinely collapsed together in options discussion are materially independent:

- directional exposure does not equal prediction dependence;
- defined risk does not describe reward-surface geometry;
- maximum profit does not describe how broad or narrow the favorable state space is;
- retail or institutional prevalence does not establish Wheelwright suitability;
- two strategies with similar market-view labels can create very different consequence and reward surfaces.

The rich discovery artifact preserves the complete table and interpretation notes.

### Why it may matter

The strategy surface gives `PL-STRAT-01` a more disciplined way to compare future candidate strategies without treating a strategy name as a sufficient unit of reasoning.

For example:

- a vertical credit spread can have a broad maximum-reward region with bounded adverse consequence;
- an iron condor can have a bounded central reward plateau with adverse outcomes in both tails;
- a conventional butterfly can concentrate attractive reward around a much narrower terminal region;
- a long straddle can have an adverse center but improving reward in both tails;
- the HBWB research hypothesis may contain ordinary compensation, an intermediate loss valley, and renewed extreme-downside convexity.

This comparison sharpens the Wheelwright question from **"which strategies are popular?"** to **"which consequence/reward geometries can be governed without prediction, with acceptable compensation, lifecycle burden, execution quality, and portfolio consequence?"**

---

## Reconciliation Completion Record — `PL-STRAT-01` / comparative strategy surface refinement

### Intake

Canonical identity: **`PL-STRAT-01`**. The strategy surface is a comparative research refinement under that existing strategy-expansion concern, not a new parking-lot item.

Rich why/evidence record: `docs/44-options-strategy-surface-discovery-2026-09-07.md`.

### Strategic disposition

**Strengthens existing strategic Bets; no roadmap change required.**

The surface directly strengthens existing roadmap intent:

- **C2 — Broader governed trade-shape repertoire:** provides a comparative research surface for candidate strategy families without admitting them;
- **K1 — Consequence envelopes:** makes clear that strategy quality cannot be inferred from premium, max profit, or max loss alone;
- **K2 — Compensation relative to consequence:** adds reward-surface breadth/shape and prediction dependence as useful comparative lenses when judging compensation against consequence;
- **L3 — Risk-profile performance can be learned empirically:** provides a stable comparative frame for future empirical comparison across different risk profiles.

No new Bet is warranted and no roadmap edit is made.

### Architectural disposition

**Refines existing architecture pressure; no new architectural direction required.**

The surface maps cleanly to:

- **AR3 — Governed Alternatives / reusable economic primitives:** the variety of strategy shapes creates real pressure toward reusable economic semantics, but that abstraction must still be earned through concrete strategy pressure. This record does **not** authorize a generic arbitrary-trade-shape framework, DSL, registry, or strategy engine;
- **AR4 — Consequence semantics before explanation:** reward/consequence geometry and prediction dependence reinforce the need for structured semantics before prose explanation if these dimensions later become product behavior.

No new architecture is authorized.

### Parking-lot disposition / mapping

**Retained and refined under `PL-STRAT-01`.**

The strategy surface is a research aid for evaluating candidate strategies under the existing Strategy Expansion Governance and Architectural Admission Test. It is not a list of strategies approved for Wheelwright.

### Why-state

Durable why-state is preserved in:

- `docs/44-options-strategy-surface-discovery-2026-09-07.md`

That artifact preserves the complete eight-column table, the qualitative nature of prevalence labels, the participant-context caveat, and the distinction between directional exposure, prediction dependence, risk character, and reward-surface geometry.

No additional journal entry is required because the rich discovery record preserves the material reasoning and this canonical parking-lot record exposes the complete disposition.

### Next authorized mode

**Further exploration / research only.**

Useful next work, if selected by the Principal, is to refine the strategy surface with empirically supportable dimensions such as execution complexity, capital/collateral character, lifecycle/management burden, assignment/exercise exposure, volatility/skew sensitivity, and portfolio aggregation behavior, then use those dimensions to compare candidate strategies under the existing Architectural Admission Test.

**Not authorized:** strategy admission, recommendation-engine implementation, UI work, broker integration, generalized trade-shape framework work, policy promotion, or roadmap reprioritization.

---

## `PL-STRAT-01` Refinement — Operator Strategy Policy and Governed Strategy Matching

**Date:** September 7, 2026  
**State:** RECONCILED exploration under existing `PL-STRAT-01`; no new `PL-*` identity created  
**Rich discovery record:** `docs/45-operator-strategy-policy-governed-matching-discovery-2026-09-07.md`

### Intake

The experienced-trader questionnaire and strategy-mapping discussion crossed the durability threshold because it developed a general model for matching operator constraints and preferences to the comparative strategy surface. It does **not** create a genuinely new backlog concern. It materially refines existing **`PL-STRAT-01` Strategy Expansion Governance**.

Canonical mapping:

> **Operator Strategy Policy / governed strategy matching → merged/refined into `PL-STRAT-01`**

The questionnaire is treated as an **elicitation mechanism**, not the architecture. Its durable output is provisionally named **Operator Strategy Policy**.

### What was discovered

The strategy surface and the operator questionnaire form dual descriptions of the strategy-selection problem:

> **The strategy surface describes what a strategy is willing to do to the portfolio. The operator policy describes what the operator is willing to let a strategy do to the portfolio.**

Recommendation can therefore be framed as:

> **operator policy × strategy characteristics × current evidence × portfolio state → governed alternatives**

A second invariant is explicit:

> **Recommendation cardinality is 0..N, not 1..N.**

Wheelwright must be able to return no recommendation when no admitted strategy satisfies current operator policy and current conditions.

The discovery also separates three stages that must not be collapsed into one score:

> **admission constraints → policy fitness → current opportunity selection**

Hard prohibitions such as bounded-loss requirements, no naked options, no assignment, no multi-expiration positions, or mechanical-management-only are eligibility gates. Softer preferences such as broad reward surface, premium orientation, or capital-efficiency preference rank the surviving strategies. Current Evidence and portfolio state then determine whether any survivor is attractive now.

### Strategy-policy mapping surface

The rich discovery record preserves the complete candidate questionnaire, normalization dimensions, hard gates, and bidirectional 1-to-N mapping between policy answer combinations and strategy families.

The normalized policy dimensions currently include:

- objective;
- underlying relationship;
- direction;
- prediction tolerance;
- loss character;
- reward preference;
- premium orientation;
- volatility dependence;
- lifecycle complexity;
- time structure;
- with assignment, call-away, naked-option tolerance, leg count, hedge cost, and discretionary-management tolerance acting as hard gates or refinements where appropriate.

The mapping is deliberately **1-to-N** at the policy stage. Multiple strategies may satisfy an operator policy before current Evidence distinguishes among them.

The model is also invertible:

- questionnaire → policy → eligible strategies;
- strategy → required/compatible policy characteristics.

This allows Wheelwright to test the model from both directions and allows a future admitted strategy to be characterized without rewriting the questionnaire decision tree.

### Null recommendation invariant

A policy can be internally coherent yet admit no current strategy, or can contain mutually restrictive conditions that make every candidate ineligible.

Wheelwright must preserve the valid result:

> **No admitted strategy satisfies the current policy.**

A hard operator constraint must never be silently weakened merely to make the system return a recommendation.

### Conceptual flow

The research model is:

> **Questionnaire answers**
>
> → **Operator Strategy Policy**
>
> → **hard-constraint admission**
>
> → **Eligible Strategy Set**
>
> → **policy-fitness comparison**
>
> → **current Evidence + executable Alternatives**
>
> → **Consequence Envelopes**
>
> → **Compensation relative to Consequence**
>
> → **portfolio-state check**
>
> → **0..N recommended alternatives + exclusions + reasons**

The questionnaire itself does not decide what trade should be opened today.

---

## Reconciliation Completion Record — `PL-STRAT-01` / Operator Strategy Policy refinement

### Intake

Canonical identity: **`PL-STRAT-01`**. Operator Strategy Policy and governed strategy matching refine the existing strategy-expansion concern and directly build on the comparative strategy surface.

Rich why/evidence record: `docs/45-operator-strategy-policy-governed-matching-discovery-2026-09-07.md`.

### Strategic disposition

**Strengthens existing strategic Bets; no roadmap change required at this stage.**

Relevant roadmap homes already express the strategic intent:

- **C2 — Broader governed trade-shape repertoire:** the valuable capability is not merely supporting more named strategies but governing which admitted strategies fit operator policy;
- **K1 — Consequence envelopes:** operator policy can express which adverse/favorable consequence geometries are acceptable;
- **K2 — Compensation relative to consequence:** compensation is compared only after unacceptable consequence shapes have been excluded;
- **L3 — Risk-profile performance can be learned empirically:** strategy-policy matching can eventually support empirical comparison of different admitted risk profiles under different operator policies.

No new Bet is warranted yet and no roadmap edit is made.

### Architectural disposition

**Refines existing architecture pressure; no new architecture direction required.**

The discovery maps to:

- **AR3 — Governed Alternatives:** it creates concrete pressure for comparing strategies and executable alternatives through shared economic/consequence semantics rather than hard-coded named-strategy branches;
- **AR4 — Consequence Semantics Before Explanation:** hard constraints, prediction dependence, reward-surface geometry, and exclusion reasons need structured semantics before explanation can reliably expose why alternatives were admitted, rejected, or preferred.

The provisional engine responsibility model is consistent with existing architecture: **Policy** owns durable operator constraints/preferences; **Evidence** owns current observable market/portfolio facts; **Decision** matches admitted strategy characteristics and current alternatives against Policy and Evidence; **Explanation** communicates inclusion, exclusion, preference, and reasons.

This does **not** authorize a generalized strategy engine, arbitrary trade-shape DSL, questionnaire UI, new service/registry, or implementation work. Reusable semantics must still be earned through concrete strategy pressure.

### Parking-lot disposition / mapping

**Retained and refined under `PL-STRAT-01`.** No new `PL-*` identity is created.

The Operator Strategy Policy model complements, rather than supersedes, the strategy-surface artifact and prior HBWB/credit-spread research.

### Why-state

Durable why-state is preserved in:

- `docs/45-operator-strategy-policy-governed-matching-discovery-2026-09-07.md`

That artifact preserves nearly verbatim the candidate experienced-trader questionnaire, normalized policy dimensions, hard gates, objective-specific mapping tables, reward-surface and prediction mappings, strategy-by-policy admission signatures, 1-to-N example, null recommendation invariant, conceptual algorithm, and strategy-surface/operator-policy duality.

No additional journal entry is required because the rich discovery record preserves the material unfinished intellectual state and this canonical record exposes the complete disposition.

### Next authorized mode

**Further exploration / design research only.**

Useful next work, if selected by the Principal, is to:

1. validate the questionnaire dimensions against the complete strategy surface;
2. identify which policy attributes are truly hard constraints versus preferences;
3. refine strategy-characterization fields needed for deterministic eligibility/exclusion;
4. test representative policy signatures, including contradictory and null-result cases;
5. determine where portfolio-level constraints belong relative to operator strategy policy;
6. only after those questions are resolved, consider a formal domain model or operator-facing elicitation design.

**Not authorized:** implementation, questionnaire UI, strategy admission, recommendation-engine changes, broker integration, generalized strategy-framework work, policy promotion, or roadmap reprioritization.

---

## Continuation History

| Date | Event |
|---|---|
| Sep 7, 2026 | `docs/parking-lot-5.md` created as a physical continuation of the single logical parking lot. The HBWB/masterclass discussion was reconciled into existing `PL-STRAT-01`, with full failure-mode-first discovery preserved in `docs/43-hedged-broken-wing-butterfly-discovery-2026-09-07.md`. Strategic disposition: strengthens C2/K1/K2/L3 with no roadmap change. Architectural disposition: refines AR3/AR4 with no new architecture. Next mode: further research only. |
| Sep 7, 2026 | Comparative options strategy surface reconciled into existing `PL-STRAT-01`, with the complete eight-column strategy surface preserved in `docs/44-options-strategy-surface-discovery-2026-09-07.md`. Strategic disposition: strengthens C2/K1/K2/L3 with no roadmap change. Architectural disposition: refines AR3/AR4 with no new architecture. Next mode: further research only. |
| Sep 7, 2026 | Operator Strategy Policy / governed strategy matching reconciled into existing `PL-STRAT-01`, with the complete experienced-trader questionnaire and 0..N strategy-policy mapping preserved in `docs/45-operator-strategy-policy-governed-matching-discovery-2026-09-07.md`. Strategic disposition: strengthens C2/K1/K2/L3 with no roadmap change. Architectural disposition: refines AR3/AR4 and separates admission constraints → policy fitness → current opportunity selection. Next mode: further exploration / design research only. |
