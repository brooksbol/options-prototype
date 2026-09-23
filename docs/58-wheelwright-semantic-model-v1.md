# Wheelwright Semantic Model v1.3 — Draft

**Date:** September 23, 2026  
**Status:** Draft semantic integration model — Current Specialized Reference (Category E); **not ratified architecture or implementation authority**  
**Canonical intake:** `PL-SEM-01`  
**Scope:** Wheelwright-wide semantic integration across domain, portfolio, lifecycle, evidence, intent/policy, capability, decision, execution, and accounting submodels  
**Related:** `docs/foundations/options-domain-reference.md`, `docs/foundations/options-domain-competence-contract.md`, `docs/25-situation-architecture.md`, `docs/07c-adrs.md`, `docs/architecture-roadmap.md`, `docs/47-capital-state-management-deployment-paths-discovery-2026-09-07.md`, `PL-BROKER-CAP` in `docs/parking-lot-9.md`

---

## 1. Purpose

Wheelwright has mature semantic submodels but no single integrated model of the world those submodels describe.

This draft supplies a falsifiable semantic integration target. It is intentionally upstream of DDD implementation choices such as bounded contexts, aggregates, repositories, services, anti-corruption layers, persistence schemas, or module boundaries.

The governing question is:

> **What kinds of things exist in Wheelwright's world, how are they identified and related, who may assert what about them, how do they change over time, and which meanings are primitive versus derived?**

This document does **not** replace specialized authority. In particular:

- the Options Domain Reference remains the owner of externally grounded options mechanics and lifecycle economics;
- the Options Domain Competence Contract remains the reasoning-governance contract;
- ADRs remain the owner of ratified decisions;
- Portfolio Capital / Production artifacts remain the owners of their bounded accounting semantics;
- Evidence semantics and authority ADRs remain the owners of their ratified bounded rules;
- Situation and regime artifacts remain the owners of their accepted bounded semantics.

This draft integrates and names relationships among those models. Where it conflicts with Category A/B/C authority, that authority wins.

---

## 2. Why this exists

`docs/02-domain.md` is not, in practice, a complete Wheelwright domain model. It is an early-slice mixture of options-chain terminology, calculations, prototype assumptions, provider-neutral data shapes, and local architectural decisions.

Wheelwright subsequently developed important semantic models independently:

- complete-position economics;
- evidence state and provenance;
- position monitoring;
- Portfolio Capital and Production;
- Situation / regime semantics;
- capital-state paths and Alternatives;
- lifecycle consequences;
- broker/account projections;
- recommendation and execution semantics.

The result is a federation of useful submodels without a canonical integration layer.

Symptoms include overloaded words such as `strategy`, `position`, `intent`, `deployment`, and `outcome`; implementation enums that mix semantic dimensions; and repeated local rediscovery of authority, provenance, identity, and temporal rules.

---

## 3. Information architecture

The working architecture is non-linear:

```text
                 External Domain References
                  options / broker / market
                           │
                           ▼
                Wheelwright Semantic Model
      ┌────────────────────────────────────────────┐
      │ ontology / vocabulary                     │
      │ identity / scope / association             │
      │ portfolio / capital topology               │
      │ state / event / transition / lifecycle     │
      │ time / history                             │
      │ assertion / authority / provenance         │
      │ accounting relationships                   │
      └────────────────────────────────────────────┘
          ▲              ▲              ▲
          │              │              │
      Evidence      Intent / Policy   Event / Execution
          │              │              │
          └──────────────┼──────────────┘
                         ▼
                 Decision Semantics
        Alternatives → consequences → admissibility
        → comparison → recommendation / WAIT / unresolved
                         │
                         ▼
               Application Architecture
                    │            │
                    ▼            ▼
              Implementation   Product / Operator IA
```

Capability/executability cuts across Alternatives, accounts, brokers, evidence, and execution. Explanation and uncertainty accompany assertions and decisions rather than forming terminal layers.

---

## 4. Ontology versus operational domain model

Wheelwright benefits from distinguishing two intellectual concerns while keeping them in one canonical semantic artifact if this draft is later ratified.

### Ontology

Defines:

> what kinds of things exist, what semantic categories they belong to, and which relationships can hold among them.

### Operational domain model

Defines:

> identity, composition, scope, state, events, transitions, processes, programs, time, authority, provenance, invariants, and derivations for those concepts.

Separate authoritative documents are not proposed for v1. The project is already repairing semantic drift among adjacent artifacts; ontology and operational model should evolve together until a stable separation is earned.

---

## 5. Candidate semantic concept families

The v1 adversarial review exposed an internal error: the draft called slash-combined families “primitives” while grouping concepts that are not semantically identical. v1.1 therefore treats this as a **decomposition workspace**, not a settled primitive register.

A primitive, if later claimed, must be semantically irreducible for Wheelwright reasoning. Related concepts may still be distinct types, relations, or roles. None of these labels implies one class, table, aggregate, service, or bounded context.

### Identity and economic world

- **Account** — brokerage-account identity known to Wheelwright.
- **Account Regime** — semantic/accounting/execution regime applicable to an Account; a property/context of an account, not the account itself.
- **Instrument** — externally identifiable tradable instrument family or security.
- **Contract** — a specific contractual instrument with identity and terms; related to, but not synonymous with, Instrument.
- **Asset**, **Right**, **Obligation** — distinct economically material constituents that may participate in a complete position.
- **Lot** — broker/accounting inventory unit when authoritative lot identity exists.
- **Inventory Block** — governed quantity of inventory treated together for mandate, encumbrance, lifecycle, or decision purposes; may correspond to one or more lots and must not manufacture lot identity.
- **Position** — intentionally unresolved narrower identity used by broker, monitoring, construction, and lifecycle views; it must not silently mean Complete Position.
- **Complete Position** — all material assets, cash, rights, obligations, collateral, encumbrance, and residual exposure required for correct economic reasoning about a subject.
- **Capital Boundary** — governed scope within which capital classification and rules apply.
- **Capital Pool** — capital grouped within a boundary for a governed purpose; not synonymous with the boundary.
- **Portfolio Mandate** — authoritative purpose/objective assigned to a capital or inventory scope.
- **Inventory Role** — the expected contribution/function of inventory under a mandate; distinct from the mandate and from a specific outcome stance.

### Change over time

- **State** — facts true of a subject at a time.
- **Event** — an occurrence in the economic or operational world. An Event exists independently of when or whether Wheelwright observes it.
- **Event Observation / Event Assertion** — evidence or an authoritative claim that an Event occurred, with provenance and time semantics.
- **Transition** — a before/after semantic transformation. A contemplated transition is counterfactual; a reconciled transition is accepted as domain history.
- **Reconciled Transition** — the accepted domain-state change attributed to an actual Event after sufficient evidence, association, and reconciliation.
- **Process** — ordered activity producing or contemplating transitions.
- **Operating Program** — durable governed purpose/process spanning multiple positions or cycles.
- **Lifecycle** — the relevant state/event/transition history of a particular subject.
- **Formation Provenance** — how the current state or construction came to exist.

### Claims and governance

- **Evidence Observation** — an observation with provenance and time semantics; it may support an Event Assertion but is not the Event.
- **Authoritative Association** — a governed claim that two otherwise independent identities are related for a stated purpose.
- **Intent Assertion** — an authoritative, scoped, time-bounded statement of purpose or stance toward an outcome. Whether purpose and outcome stance remain one concept is unresolved.
- **Policy Rule** — a governed decision rule.
- **Constraint** — an admissibility/prohibition boundary.
- **Preference** — an ordering among admissible alternatives/outcomes. Constraint and Preference must not be collapsed.
- **Situation** — operator-declared or otherwise authoritative decision context.
- **Regime** — durable operating/accounting/policy context. Situation and Regime may relate, but are not synonyms.

### Decision, action, and realized history

- **Candidate** — raw discovered possibility not yet normalized into a governed Alternative. If future specimens show no useful distinction, this concept should be removed rather than retained ceremonially.
- **Alternative** — a normalized governed path available for decision evaluation, including a valid no-transaction path such as HOLD.
- **Counterfactual Consequence** — conditional economic/resulting-state effect if an Alternative or contemplated transition occurs.
- **Mechanical Event Effect** — domain-mechanical effect caused by an Event, independent of whether Wheelwright has yet reconciled it.
- **Reconciled Outcome** — resulting state/economic result accepted into Wheelwright history after authoritative observation, association, and reconciliation.
- **Economic Attribution** — governed classification of a realized result to Production, principal movement, appreciation/erosion, lifecycle, or other accounting meaning.
- **Recommendation** — a time- and evidence-bounded decision result over Alternatives; not an operator selection or execution fact.
- **Action** — an operator/system act intended to cause or respond to a transition.
- **Order / Broker Instruction** — a broker-facing instruction expressing an Action where applicable; not every Action is an Order.
- **Execution** — actual execution occurrence in the broker/market world.
- **Execution Observation / Assertion** — broker-authoritative or otherwise governed evidence establishing execution; not the Execution itself.
- **Accounting Stock**, **Accounting Flow**, **Accounting Attribution** — distinct accounting concept families; this model integrates their relationships but does not redefine the bounded Portfolio Capital / Production authorities.

This list remains provisional. Promotion requires surviving semantic specimens and resolving identity, scope, authority, and temporal behavior.

---

## 6. Semantic assertion model

### Epistemic boundary: world, observation, assertion, reconciliation

Wheelwright must distinguish what exists in the economic/operational world from what a source reports and from what Wheelwright currently accepts.

- **World / Economic State** — what is actually true at a time, whether or not Wheelwright currently knows it.
- **Observation** — evidence received, measured, or acquired from a source.
- **Assertion** — a claim about a subject, made from observation, explicit authority, or a governed derivation.
- **Reconciled State** — the evidence-backed state Wheelwright currently accepts after identity binding, authoritative association, conflict handling, and reconciliation.
- **State View / Projection** — a source- or product-specific representation that may be stale, partial, conflicted, or not applicable.

A real Event may therefore occur while Wheelwright's Reconciled State still reflects the pre-event world. Reconciliation changes Wheelwright's accepted representation; it does not move the Event in time or manufacture the occurrence.


The largest integration gap is not another noun taxonomy. Wheelwright repeatedly needs to reason about claims.

A semantic assertion conceptually answers:

> **Who asserts what, about which subject, for what effective time, from what evidence or authority, at what epistemic level, and through which transformations may that meaning travel?**

A load-bearing assertion may require:

- assertion identity / version;
- subject;
- applicability scope / context;
- subject-binding / identity-binding basis;
- predicate / claim;
- value or relation;
- epistemic class;
- authority class, including source-system authority where relevant;
- evidence / provenance;
- validity dependencies;
- effective time;
- recorded time;
- derivation method;
- uncertainty / unresolved status;
- supersession / conflict relationship;
- revocation / invalidation status and reason.

Semantic absence is not one state. Where material, **false, absent, unknown, unavailable, stale, conflicted, zero/empty, and not applicable** must remain distinguishable.

A true assertion about one subject and a true assertion about another subject do not establish an association between them.

This is a conceptual contract, not a requirement for a generic `Assertion` runtime object or table.

### Association is itself a claim

Identity, association, attribution, aggregation, coverage, and correlation must not be collapsed.

Examples:

- a broker event belongs to a lifecycle;
- a short call is covered by identified inventory;
- inventory belongs to a strategic capital pool;
- realized appreciation is attributable to a governed lifecycle event.

These relationships require authority; proximity or matching identifiers do not manufacture them.

Load-bearing portfolio associations may also require **quantity/unit, effective interval, exclusivity or overlap rules, authority/provenance, and supersession/conflict semantics**. Coverage, allocation, encumbrance, pool membership, mandate binding, program membership, lifecycle association, and accounting attribution must not be assumed to share the same invariants.

---

## 7. Portfolio topology

Strategic SPY versus disposable SPY demonstrates that Account + Symbol + Position is insufficient.

The semantic model must be able to represent, where authoritative evidence exists:

```text
Account
  └─ Capital Boundary / Pool
       ├─ Mandate / Role
       ├─ Inventory block(s) / lot(s)
       ├─ Operating program(s)
       └─ Positions / obligations / encumbrances
```

The same symbol may plausibly participate in separately governed pools. Symbol identity therefore must not silently become mandate identity.

Whether lot-level identity is always required remains unresolved. A governed quantity block may be sufficient for some purposes.

---

## 8. Position, construction, mechanism, provenance, and program

These concepts must remain distinct.

### Holding / obligation record

Describes an evidence-backed quantity of an asset, right, or obligation at an account or source. It is not automatically a complete economic construction or lifecycle identity.

### Economic construction

Describes an economically relevant relation/view over constituents that creates a payoff or exposure shape now.

Examples:

- shares + short call;
- cash-backed short put;
- long put + short put;
- shares + long put + short call.

### Transaction / formation mechanism

Describes how a state is created.

Example:

> buy shares and write a call simultaneously.

### Formation provenance

Preserves the historical fact that a current covered-call construction was formed through a buy-write.

### Decision subject

Describes the explicitly scoped subject against which consequences, intent, policy, and Alternatives are evaluated. A Decision Subject need not be identical to a broker holding, UI row, or durable lifecycle entity.

### Complete Position

The Complete-Position Invariant establishes a **reasoning closure obligation**, not yet a durable entity identity. A Complete Position is provisionally the governed closure/view containing everything economically material to a specified conclusion.

### Lifecycle subject / episode

A durable lifecycle identity remains provisional. It should be introduced only if specimens demonstrate something that survives transitions such as leg expiration/replacement, partial close, assignment, or residual inventory.

### Operating program

Describes a durable, repeatable process spanning states or positions.

Example:

> Wheel: cash → short put → assignment → shares → short call → call-away → cash → repeat.

The Wheel therefore cannot be reduced to one stable economic construction.

---

## 9. Conventional “strategy” vocabulary

The options market legitimately uses `strategy` as a broad practitioner umbrella for named patterns such as:

- long call;
- long put;
- covered call;
- cash-secured put;
- protective put;
- vertical spread;
- iron condor;
- straddle;
- strangle;
- calendar spread;
- Wheel;
- PMCC;
- butterfly / BWB / HBWB.

Wheelwright should understand and expose this vocabulary without making `Strategy` one universal canonical machine type.

A conventional label should map onto the semantic dimensions it actually establishes and leave the rest unknown.

Example:

```text
market label: covered call
construction: shares + short call
formation provenance: unknown
operating program: unknown
inventory role: unknown
intent: unknown
assignment stance: unknown
policy: unknown
```

A buy-write may establish formation mechanism/provenance while producing the same current construction. A Wheel primarily identifies an operating program. A CSP used for acquisition and a CSP used primarily for premium may share construction while differing materially in intent.

---

## 10. Intent and policy

### Intent is first-class but not inferred from mechanics

Moneyness, delta, DTE, premium, assignment probability, construction, and conventional strategy label do not establish desirability.

Candidate definition:

> **An Intent Assertion is an authoritative, scoped, time-bounded statement binding a subject to a purpose or stance toward a possible outcome.**

The second adversarial review narrows the surviving model:

- **Objective / Purpose** — the result or function a mandate, program, or deployment seeks over a horizon.
- **Outcome Stance** — authoritative desirability/acceptability toward a specified possible outcome for a scoped subject.
- **Constraint** — an admissibility boundary, including prohibition.
- **Preference** — ordering among admissible alternatives or outcomes.

`Intent` remains provisional terminology. Before ratification it must acquire one non-overloaded meaning; the leading candidate is that canonical **Intent Assertion** names a scoped Outcome Stance rather than serving as an umbrella for purpose, policy, preference, and action choice.

### Admissibility and preference are distinct

“Desired,” “acceptable,” “tolerated,” “undesired,” and “prohibited” should not be treated as one simple scalar.

At minimum distinguish:

- **admissibility** — for example required / permitted / prohibited, with unresolved and not-applicable states where needed;
- **preference** — for example desired / preferred / neutral / disfavored, potentially conditional or comparative.

“Tolerated” ordinarily means permitted but disfavored. “Indifferent” means no material ordering under the stated comparison, not unknown.

A prohibited outcome is not merely a very low-ranked outcome.

### Policy remains distinct

Intent says what outcome/purpose applies to a subject. Policy supplies constraints, prohibitions, thresholds, and preferences governing decisions.

An authoritative policy may imply an outcome stance only when its applicability and subject binding are explicit.

---

## 11. Time and history

Time is semantic, not incidental metadata.

Wheelwright needs to distinguish at least:

1. **Economic/event time** — when a trade, assignment, deposit, disposition, or other economic event occurred.
2. **Settlement-effective time** — when settlement becomes economically/effectively operative where distinct.
3. **Broker processing/posting time** — when a broker processes or posts the record.
4. **Source observation time** — when a source observed/measured the fact, where available.
5. **Wheelwright acquisition/receipt time** — when Wheelwright acquired the evidence.
6. **Effective/decision time or interval** — when intent, policy, Situation, capability, or recommendation governed.
7. **Recorded time** — when Wheelwright persisted the assertion.

These are semantic time roles, not mandatory fields on every object.

Historical intent and policy must be preserved when required to answer:

> Was this decision consistent with the plan and evidence as known at the time?

Current intent must not rewrite historical intent.

---

## 12. State, counterfactual consequence, realized outcome, intent, and alignment

These are separate semantic layers.

| Layer | Question |
|---|---|
| World / Economic State | What is actually true now, possibly unknown to Wheelwright? |
| State Assertion / View | What does a particular source or projection claim is true? |
| Reconciled State | What does Wheelwright currently accept as true under evidence, association, and reconciliation? |
| Counterfactual Consequence | What would happen if a specified Alternative/transition occurred? |
| Event / Mechanical Effect | What actually occurred, and what does domain mechanics make that occurrence do? |
| Reconciled Outcome | What resulting state/economic result has authoritative evidence and reconciliation accepted into history? |
| Economic Attribution | How is that realized result governed/accounted for? |
| Intent | What purpose/outcome stance authoritatively applies? |
| Policy | What is permitted, prohibited, constrained, or preferred? |
| Alignment | How consistent is the current trajectory with the governed plan? |

**Alignment is derived**, not primitive.

Example before assignment:

- State: a call is ITM.
- Counterfactual Consequence: if assignment occurs, 100 shares would be disposed at the strike.
- Intent: disposition is desired for this inventory.
- Policy: assignment at this effective exit is admissible.
- Alignment: current trajectory may align with the governed plan.

Example after assignment:

- Event: assignment economically occurred.
- Event Observation: broker-authoritative evidence reports the assignment.
- Mechanical Event Effect: the short-call obligation resolves and the covered quantity is disposed at the strike, subject to actual contract terms.
- Reconciled Outcome: Wheelwright accepts the resulting inventory/cash state after association and reconciliation.
- Economic Attribution: bounded accounting authority determines which realized components, if any, are Production, principal movement, appreciation/erosion, or another category.

The same ITM state against strategic retention inventory can produce the opposite alignment before resolution. A later realized outcome must not retroactively rewrite the intent/policy that governed the earlier decision.

---

## 13. Capability, current feasibility, and Wheelwright support

The v1 draft incorrectly bundled three axes with different authorities and lifetimes.

### Capability

> **Is this kind of action structurally permitted and supported for this account/product/broker relationship?**

Examples include account option tier, product eligibility, broker order-type support, and structural collateral rules. Capability can change, but it is not merely a quote-time market fact.

### Current feasibility / executability

> **Can this otherwise-capable action actually be performed now under current state and evidence?**

Examples include available buying power/collateral, settlement state, current position/encumbrance, sufficient market evidence, executable liquidity, market/session state, and other time-sensitive preconditions.

Feasibility is generally shorter-lived than structural capability and must carry currentness/provenance appropriate to the claim.

### Wheelwright support status

> **What can Wheelwright itself correctly understand, represent, evaluate, recommend, stage, execute, and lifecycle-manage?**

Support is not one boolean. A structure may be:

- understood mechanically;
- representable;
- consequence-modelled;
- policy-evaluable;
- recommendable;
- stageable;
- executable through an integration;
- lifecycle-manageable.

The Options Domain Competence Contract remains authoritative that domain understanding and support status are independent axes.

### Relationship to `PL-BROKER-CAP`

`PL-BROKER-CAP` owns the cross-surface **appraisal of brokerage-facing capability provision and incumbent fitness** across Portfolio State, Market Evidence, Execution, and Lifecycle/Outcome. It asks how Wheelwright should obtain those capabilities and whether current mechanisms remain fit.

`PL-SEM-01` owns the **general semantic distinction** among capability, present feasibility/executability, and Wheelwright product support. It does not select providers or replace the brokerage-capability appraisal.

Therefore these identities are related but not duplicates.

### Decision interaction

A mechanically coherent Alternative can be:

- prohibited by policy despite being capable and feasible;
- policy-admissible but structurally incapable;
- capable but currently infeasible;
- capable and feasible but unsupported by Wheelwright for recommendation/execution;
- fully admissible, capable, feasible, and supported.

None of those axes alone establishes desirability or recommendation.

---

## 14. Decision semantics

Wheelwright needs domain-level decision semantics independent of service/module placement.

Working composition:

```text
current subject/state
+ authoritative evidence
+ applicable intent and policy
+ normalized Alternatives
+ counterfactual consequences
+ structural capability
+ current feasibility/executability
+ Wheelwright support status
+ admissibility
+ preference/comparison
+ uncertainty
→ recommendation(s), WAIT, or unresolved
```

Important distinctions:

- zero recommendations may be correct;
- governed WAIT is different from insufficient evidence;
- HOLD may be a valid Alternative with no transaction;
- a recommendation is not an operator selection;
- an operator selection is not an order;
- an order is not an execution;
- an execution observation is not yet necessarily reconciled domain state.

---

## 15. Decision-to-execution ladder and authority

The semantic ladder is:

```text
discovered candidate
→ normalized Alternative
→ recommendation
→ operator selection
→ contemplated Action
→ staged broker instruction
→ submitted order assertion
→ working-order assertion
→ Execution
→ execution/event observation
→ authoritative association
→ Reconciled Transition / Outcome
```

Adjacent stages must not be collapsed merely because one implementation currently represents them with the same object or UI interaction.

Authority changes along the ladder:

- discovery establishes a possibility, not permission or recommendation;
- a Recommendation is Wheelwright decision output under its evidence/policy dependencies;
- operator selection establishes operator choice, not broker state;
- staging establishes a prepared instruction, not submission;
- broker order state such as submitted/working requires broker-authoritative evidence under the applicable execution contract;
- Execution is the occurrence itself; an execution observation/assertion is evidence of it;
- broker evidence does not by itself establish which Wheelwright lifecycle, inventory block, program, or accounting category the event belongs to;
- association and reconciliation are required before accepted domain state/history changes.

Assignment and exercise are lifecycle Events, not necessarily operator Actions. HOLD is an Alternative without a transaction Event.

---

## 16. Counterfactual and realized semantics

The distinctions below are **semantic dependencies, not a universal wall-clock processing sequence**. Observation may be the first evidence from which Wheelwright can identify an Event and derive its Mechanical Event Effect. Corrections may revise reconciliation without changing the actual Event.

**Mechanical Event Effect is derived semantics:** given an actual Event, contract/domain mechanics, quantities/units, and subject identity, it describes what the occurrence mechanically does. It is not another occurrence.

Wheelwright must preserve the distinction among:

- current factual State;
- Counterfactual Consequence;
- forecasted likelihood of a possible Event/outcome;
- recommended Action;
- actual Event;
- Event Observation / Assertion;
- Mechanical Event Effect;
- Reconciled Transition / Outcome;
- Economic Attribution.

A Counterfactual Consequence answers:

> **If this Alternative/transition occurs, what follows?**

It does not assert that the transition will occur.

An Event answers:

> **What occurrence actually happened in the economic or operational world?**

An **Event Observation** is evidence received or measured concerning an occurrence.

An **Event Assertion** is a claim that an occurrence happened, potentially derived from one or more observations or another authoritative source. Observation and assertion must not be assumed identical.

An Event Assertion answers:

> **What evidence establishes or reports that occurrence, with what authority and provenance?**

A Reconciled Outcome answers:

> **What resulting state/economic result has Wheelwright accepted into history after evidence, association, and reconciliation?**

Economic Attribution answers:

> **How should that realized result be classified under the bounded accounting authorities?**

These boundaries are essential to Policy over Prediction and to historical truth.

---

## 17. Validity, supersession, correction, and revocation

Some semantic objects are only valid under dependencies.

Examples:

- recommendations depend on evidence, policy, intent, capability, and time;
- intent may be superseded prospectively;
- policy may change;
- broker capability observations may become stale;
- evidence verdicts may expire or be superseded.

The semantic model must eventually define dependency-sensitive invalidation without pretending that every concept shares one lifetime.

It must also distinguish correction of a false assertion, late enrichment of an incomplete assertion, reassociation of a true Event, reversal/correction in an external source, and prospective supersession of intent/policy from retrospective correction of history.

A Recommendation also requires a reproducible decision trace to the evaluated Alternative set, evidence/policy/intent/capability versions and as-of time, operator selection if any, later Events, and post-hoc evaluation. This is a semantic trace requirement, not authorization for a generic runtime framework.

---

## 18. Accounting integration

Portfolio Capital and Production remain bounded authoritative models.

The semantic core must explain their relationships to:

- stocks;
- flows;
- liabilities;
- encumbrances;
- principal movement;
- market-value change;
- appreciation / erosion;
- Production;
- broker-native balance projections.

This draft does not redefine those accounting concepts.

---

## 19. Concept families versus derived semantics

v1.1 withdraws the v1 claim that the slash-combined list represented “strong primitive candidates.” The semantic model is not mature enough to make that claim consistently.

### Candidate concept families requiring identity/decomposition work

Quantity and unit semantics are cross-cutting correctness concerns. Contracts, shares, deliverable multipliers, adjusted contracts, cash amounts, and per-share/per-contract values must remain explicit where they affect coverage, assignment, collateral, consequence, or complete-position reasoning.

- Account; Account Regime.
- Instrument; Contract.
- Asset; Right; Obligation.
- Lot; Inventory Block.
- Position; Complete Position; Economic Construction.
- Capital Boundary; Capital Pool.
- Portfolio Mandate; Inventory Role.
- State; Event; Event Observation/Assertion; Transition; Reconciled Transition.
- Process; Operating Program; Lifecycle; Formation Provenance.
- Evidence Observation; Authoritative Association; Semantic Assertion.
- Intent Assertion; Policy Rule; Constraint; Preference; Situation; Regime.
- Candidate; Alternative; Counterfactual Consequence.
- Mechanical Event Effect; Reconciled Outcome; Economic Attribution.
- Recommendation; Action; Order/Broker Instruction; Execution; Execution Observation/Assertion.
- Capability; Current Feasibility/Executability; Wheelwright Support Status.
- Accounting Stock; Accounting Flow; Accounting Attribution.

### Derived candidates

- moneyness;
- resolution proximity;
- decision pressure;
- resolution outlook;
- alignment;
- health;
- eligibility;
- opportunity quality;
- attractiveness;
- recommendation rank;
- deployability;
- assignment pressure;
- Production outlook;
- evidence trust/currentness;
- strategy-policy fit.

Derived does not mean unimportant. It means the value must retain traceable dependency on more primitive facts and governed semantics.

A future primitive register should contain only concepts that survive decomposition and specimen testing without slash-combining categorically distinct meanings.

---

## 20. Semantic specimens

| Specimen | Required distinctions |
|---|---|
| UNG disposition covered call | inventory subject; covered-call construction; counterfactual call-away consequence before assignment; actual assignment Event if it occurs; broker observation; reconciled outcome; disposition intent; policy; alignment |
| Strategic SPY overwrite | capital pool; multiple lots/inventory blocks; quantified/time-scoped coverage and encumbrance; mandate; overwrite program; objective; retention outcome stance; short-call obligations; counterfactual consequence; capability vs current feasibility vs Wheelwright support; policy |
| Partial SPY call assignment with late evidence | actual assignment Event; partial quantity; contract/share units; late broker observation; Event Assertion; identity binding; corrected coverage/encumbrance; Reconciled State; residual inventory; historical intent/policy; accounting attribution |
| Buy-write | coordinated formation mechanism; provenance; resulting covered-call construction |
| CSP acquisition | short-put construction; collateral; acquisition intent; assignment consequence |
| CSP income | same construction; premium purpose; assignment acceptable/disfavored rather than necessarily desired |
| Wheel | durable program identity across a cycle boundary; cycle/process state; Candidate vs Alternative; multiple holding/construction/lifecycle identities; Events/observations/assertions/reconciled transitions; capital transitions; program membership |
| Protective put | construction; protection purpose; desired floor distinct from undesired adverse market event |
| Collar | construction; protection purpose; accepted upside cap/call-away consequence |
| Vertical spread | multi-leg construction; bounded consequence surface; purpose separately scoped |
| Iron condor | four-leg construction; range consequence profile; terminal-state preferences |
| PMCC / diagonal | multi-expiry construction; lifecycle complexity; no literal share-coverage assumption |
| BWB / HBWB | asymmetric consequence surface; desired tail behavior; tolerated intermediate valley |
| HOLD | normalized no-transaction Alternative; Decision Subject; continuing obligation/exposure; actual/asserted/reconciled state; capability not confused with action; next decision boundary |
| CLOSE | Alternative; contemplated Action; operator commitment/cancellation; broker Order and cancel/replace where applicable; partial/full Execution vs execution observation/assertion; counterfactual close cost vs realized fill; reconciled residual capital/inventory state |
| Long straddle control | two long option rights; same-underlying/same-strike/same-expiration leg relationships; two opening debits; no underlying inventory requirement; bilateral convex payoff; quantity/unit correctness; Decision Subject; purpose/outcome stance not inferred from construction; no covered-call-style assignment-intent assumption |

A candidate semantic distinction that cannot survive these specimens should not be promoted.

The long-straddle specimen is deliberately a **control outside Wheelwright's current covered-call/CSP/Wheel center of gravity**. It tests whether the semantic core generalizes to options constructions rather than encoding current operating-program assumptions.

Broader practitioner “strategy” material—including construction mechanics, opening debit/credit, payoff geometry, scenario/magnitude thesis, volatility/time exposure, applicability criteria, and conventional labels—remains **pending semantic pressure**. It is intentionally not promoted into the model until the focused identity–association–assertion reconciliation is stable.

---

## 21. v1.3 identity–association–assertion reconciliation

This section records the focused specimen pass authorized after the second independent adversarial review. Its purpose is to settle the minimum semantic commitments needed to continue maturation without opening DDD design.

### 21.1 Position is not one canonical identity

The specimens reject a universal `Position` entity.

Wheelwright should instead distinguish:

1. **Holding / Obligation Record** — evidence-backed quantity of an asset, right, or obligation associated with an account/source.
2. **Economic Construction** — an economically meaningful relation/view over constituents that creates a payoff/exposure shape.
3. **Decision Subject** — the explicitly scoped subject against which Alternatives, consequences, intent, policy, and recommendations are evaluated.
4. **Complete Position** — a conclusion-relative closure/view containing everything economically material to a specified question.
5. **Lifecycle Subject / Episode** — a durable identity only where a governed lifecycle actually requires continuity across state changes.

`Position` remains valid conventional/product vocabulary, but **must not establish canonical identity by itself**. A Console row, broker holding, option obligation, construction, Complete Position, and lifecycle episode are not interchangeable.

A Complete Position is therefore not presumed to be a persistent entity. Completeness is relative to the conclusion: assignment consequence, collateral, P&L, deployability, aggregate exposure, and accounting attribution may require different closure scopes.

### 21.2 Association is a quantified, time-scoped governed claim

The SPY and partial-assignment specimens reject generic pointer-like association for load-bearing relationships.

A load-bearing association may require:

- subject identity;
- counterpart identity;
- relation kind and purpose;
- quantity and unit;
- effective interval;
- authority/provenance;
- exclusivity or permitted-overlap semantics;
- supersession/conflict/correction behavior.

This applies especially to **coverage, encumbrance, allocation, Capital Pool membership, mandate binding, program membership, lifecycle association, and accounting attribution**.

Core invariant:

> **A true assertion about A and a true assertion about B do not establish a relationship between A and B.**

Additional invariants established by the specimens:

- the same governed share quantity must not be treated as simultaneously available to cover two obligations unless an authoritative relation explicitly permits that economic use;
- partial assignment changes only the assigned quantity and its affected associations; residual inventory and residual obligations retain independent identity;
- one option obligation may be covered by quantities drawn from more than one lot/block only if the coverage allocation is explicit and quantity-correct;
- program membership may survive expiration or resolution of an individual option obligation;
- a mandate change is prospective/versioned and does not rewrite the mandate governing an earlier decision;
- Capital Pool membership is governed allocation, not a synonym for broker account balance;
- same-symbol inventory may participate in distinct mandates/programs when quantity allocation prevents false overlap.

Whether Capital Pools themselves may overlap remains policy/topology-specific and is not universally settled here.

### 21.3 Actual, observed, asserted, and reconciled state are distinct

The partial-assignment/late-evidence specimen settles the epistemic boundary:

```text
World / Economic State
    exists independently of Wheelwright knowledge

Observation
    evidence received/measured from a source

Assertion
    a claim about a bound subject, supported by observation/authority/derivation

Reconciled State
    what Wheelwright currently accepts after identity binding,
    authoritative association, conflict handling, and reconciliation
```

An assignment may economically occur before Wheelwright receives broker evidence. The late observation does not move event time. Reconciliation may update accepted history later without claiming the economic event occurred later.

A correction may:

- correct a false assertion;
- enrich an incomplete assertion;
- reassociate a true Event to the correct subject/lifecycle;
- represent an external reversal/correction.

Those are not the same historical operation.

### 21.4 Assertion validity is dependency-sensitive

A load-bearing assertion is not adequately described by provenance alone. Its semantic contract may include:

- assertion identity/version;
- subject and identity-binding basis;
- applicability scope/context;
- predicate/value/relation;
- epistemic class;
- source authority and decision/reconciliation authority where distinct;
- evidence/provenance;
- effective interval and recorded/acquired times;
- derivation;
- validity dependencies;
- uncertainty;
- supersession/conflict;
- revocation/invalidation and reason.

Absence semantics are explicit:

`false ≠ absent ≠ unknown ≠ unavailable ≠ stale ≠ conflicted ≠ zero/empty ≠ not applicable`.

A dependent recommendation or reconciliation must not silently convert one of these states into another.

### 21.5 Purpose, Outcome Stance, Constraint, and Preference are separate

The specimens reject `Intent` as an umbrella that carries all normative meaning.

- **Objective / Purpose** — what a mandate/program/deployment seeks to accomplish over a horizon.
- **Outcome Stance** — authoritative desirability/acceptability toward a specified possible outcome for a scoped subject.
- **Constraint** — an admissibility boundary.
- **Preference** — ordering among admissible Alternatives/outcomes.
- **Action Choice / Operator Selection** — a decision fact, not durable intent.

Canonical `Intent Assertion` is narrowed provisionally to **a scoped, authoritative, time-bounded Outcome Stance**. This remains subject to one further adversarial pass before ratification, but purpose/objective is no longer part of the same semantic kind.

Admissibility and preference remain independent. An outcome can be permitted but disfavored; prohibited is not merely “very undesirable”; indifferent is not unknown.

### 21.6 Strategic-SPY / partial-assignment specimen

Assume strategic SPY inventory spans multiple evidence-backed lots or governed quantity blocks and ten short calls participate in an overwrite program.

Before assignment:

- holdings/lots establish evidence-backed inventory quantities;
- governed allocation associates specified quantities with a strategic mandate/pool;
- explicit coverage/encumbrance associates quantities with each short-call obligation;
- the overwrite program supplies durable program context;
- Objective/Purpose may be incremental income while preserving strategic exposure;
- Outcome Stance may prefer retention and disfavor call-away;
- policy determines whether disposition is prohibited, conditionally admissible, or permitted;
- ITM/OTM is factual contract state, not alignment by itself.

If only some calls are assigned:

- Assignment is an Event affecting specific obligations and quantities.
- Mechanical Event Effect is derived from the Event, contract terms, deliverables, and quantity.
- unassigned obligations remain open;
- only assigned covered quantities are disposed/changed;
- residual strategic inventory remains inventory rather than becoming a new “position” merely because another quantity left;
- coverage/encumbrance associations for resolved obligations terminate or change at the applicable boundary;
- program identity may persist;
- accounting attribution remains separately governed.

If broker evidence arrives late, Wheelwright may temporarily hold a Reconciled State that differs from World State. Later reconciliation corrects the representation without rewriting the Event time or historical intent/policy.

This specimen therefore requires **quantity-bearing association identity**, not merely `symbol + account + option`.

### 21.7 Wheel-cycle specimen

The Wheel specimen establishes that an Operating Program can persist while constructions and obligations change:

```text
cash state
  -> short-put obligation
  -> assignment Event
  -> share inventory
  -> short-call obligation
  -> call-away Event
  -> cash state
```

The durable semantic candidate is the **Operating Program**, not one Position spanning all states.

A Wheel cycle may earn its own lifecycle/episode identity when Wheelwright needs to associate opening deployment, intermediate Events, Production attribution, and terminal capital state. That identity is not automatically the option contract, share lot, or program itself.

Program membership is an authoritative association. It must not be inferred solely because trades resemble a Wheel.

### 21.8 HOLD / CLOSE specimen

HOLD proves that an Alternative is not synonymous with a transaction.

For a scoped Decision Subject:

- **HOLD** preserves the current governed exposure/obligation until a stated decision boundary or invalidating condition;
- **CLOSE** contemplates an Action that may produce a broker instruction/order and, if executed, a resulting state.

The ladder remains semantically distinct:

```text
Alternative
  -> Recommendation
  -> Operator Selection
  -> Commitment / contemplated Action
  -> Staged Broker Instruction
  -> Submitted / Working Order
  -> Execution(s)
  -> Observation(s) / Assertion(s)
  -> Association + Reconciliation
  -> Reconciled Transition / Outcome
  -> Economic Attribution
```

This is not a mandatory implementation state machine.

**Commitment** is the missing semantic bridge: operator selection does not by itself prove broker submission, and staging does not prove broker acceptance. Withdrawal/cancellation can terminate a commitment before execution. Cancel/replace relates successor broker instructions/orders to the governing Action without pretending the original order never existed. Partial execution creates realized quantity plus residual open quantity; it does not collapse into either “executed” or “not executed.”

Broker-authoritative evidence is required for broker order/execution state. Operator/system authority can establish selection, commitment, or staging but cannot manufacture a broker fill.

### 21.9 Long-straddle control specimen

The long-straddle control falsifies several assumptions that would otherwise remain hidden in covered-call/CSP/Wheel specimens.

A conventional long straddle consists of a long call and long put on the same underlying with the same strike and expiration. Semantically:

- there are two long option Rights, not a short obligation plus inventory;
- the Economic Construction depends on an explicit leg relationship, not containment in underlying shares;
- formation commonly involves opening debit(s), but formation provenance does not define the construction's durable identity;
- the Decision Subject may be the two-leg construction even though each contract/right retains its own evidence-backed identity;
- Complete Position for payoff/consequence reasoning includes both legs and relevant cash flows;
- quantity/unit and contract multiplier must be explicit;
- Objective/Purpose, market thesis, volatility/time thesis, and Outcome Stance are **not inferred solely from the label**;
- there is no general covered-call-style “call-away desired/undesired” semantic;
- exercise/expiration/lifecycle outcomes may differ by leg while the construction-level reasoning subject remains meaningful.

The control therefore supports the separation:

```text
conventional strategy label
    ≠ Economic Construction
    ≠ formation mechanism/provenance
    ≠ Decision Subject
    ≠ Objective/Purpose
    ≠ market/scenario thesis
    ≠ Outcome Stance
    ≠ Policy
```

This is the principal generalization result of the focused pass.

### 21.10 Candidate remains decision-pipeline vocabulary

The focused specimens do not yet require Candidate as a foundational ontology identity.

For now:

- **Candidate** = raw discovered possibility before normalization;
- **Alternative** = normalized governed path suitable for consequence/policy/decision evaluation, including HOLD.

Candidate should remain provisional decision-intake vocabulary unless Wheelwright needs durable candidate identity for rejection provenance, deduplication, or learning across normalization.

### 21.11 Settled versus still open after the focused pass

**Settled strongly enough to continue maturation:**

- no universal canonical Position identity;
- Complete Position is a conclusion-relative closure/view unless future evidence requires durable identity;
- Economic Construction, Decision Subject, Holding/Obligation Record, and Operating Program are distinct;
- load-bearing association is governed and may be quantity/time scoped;
- World State, Observation, Assertion, and Reconciled State are distinct;
- assertion validity/applicability/absence semantics are first-class;
- Objective/Purpose, Outcome Stance, Constraint, Preference, and Action Choice are distinct;
- Event Observation and Event Assertion are distinct;
- Mechanical Event Effect is derived semantics;
- HOLD is a real Alternative;
- partial execution and partial assignment preserve residual identity/quantity;
- conventional strategy labels do not establish canonical semantic type or normative intent.

**Still open before ratification:**

- whether a narrower durable Lifecycle Subject/Episode is required in each operating program;
- exact Capital Pool overlap/partition rules;
- exact authority matrices for each association kind;
- final canonical naming of `Intent Assertion` versus `Outcome Stance Assertion`;
- exact identity/version contract for Recommendation/decision trace;
- which commitment semantics belong in the semantic core versus later execution-domain design;
- whether Candidate ever earns durable identity;
- full mapping of conventional practitioner strategy vocabulary and applicability/thesis dimensions.

### 21.12 Consequence for the next pressure

The focused pass does **not** authorize DDD decomposition.

It does establish enough separation to begin the previously pinned broader practitioner-strategy falsification pass. That pass should decompose each conventional strategy treatment into at least:

- economic construction and leg mechanics;
- formation/opening cash-flow mechanics;
- payoff/consequence geometry;
- directional and/or magnitude scenario thesis where the source supplies one;
- volatility and time exposure where the source supplies it;
- lifecycle/resolution mechanics;
- applicability/use criteria;
- capability/feasibility requirements;
- Objective/Purpose or Outcome Stance only when explicitly authoritative rather than inferred;
- conventional label/source mapping.

The purpose of that next pass is not to create a universal `Strategy` type. It is to test whether the semantic model can represent the dimensions practitioners legitimately bundle under the word “strategy.”

---

## 22. Product / operator projection

Operator surfaces project semantic claims; they do not create truth merely by rendering it.

Two traceability rules are proposed:

1. Every operator-visible semantic claim should identify the upstream semantic owner it projects.
2. Every operator interaction intended to establish authority should identify the semantic assertion it creates.

This is particularly important for intent declarations, policy changes, recommendations, completion states, and semantic coloring.

---

## 23. Boundary with implementation and DDD

This draft deliberately stops before implementation-domain architecture.

It does **not** decide:

- bounded contexts;
- aggregates / aggregate roots;
- repositories;
- domain services;
- anti-corruption layers;
- context maps;
- event sourcing;
- CQRS;
- persistence schemas;
- service boundaries;
- module/package boundaries.

Those questions become meaningful only after semantic identity, ownership, invariants, and consistency requirements are sufficiently stable.

A later DDD pass should be **discovered from semantic ownership and invariant boundaries**, not imposed from DDD vocabulary.

Useful future questions include:

- Which semantic concepts mean different things in different contexts?
- Which invariants require transactional consistency?
- Which authority boundaries imply context boundaries?
- Where do broker-native models require anti-corruption translation?
- Which events cross context boundaries?
- Which aggregates, if any, are actually required?

No bounded context or aggregate is ratified by this v1 draft.

---

## 24. Open identity and scope questions

This draft intentionally leaves unresolved:

- What makes a Position the same Position over time?
- Does a position survive expiration/replacement of one leg?
- Is buy-write current identity or formation provenance only?
- Does a covered-call position contain shares or reference an inventory block?
- Can one short call be covered by multiple lots?
- Can one symbol contain separately governed strategic and disposable pools?
- What identifies a mandate?
- What identifies a Wheel program across cycles?
- What identifies one Wheel cycle?
- Is Deployment a decision, capital episode, transaction, or resulting state?
- What is the scope boundary of a Situation?
- Is Intent the umbrella for purpose + outcome stance, or outcome stance only?
- Which operator interactions create authoritative intent?
- What capability facts are durable versus point-in-time observations?
- Does Candidate earn a durable semantic identity distinct from Alternative, or is it only discovery-stage vocabulary?
- Which Position identities are required in addition to Complete Position and Economic Construction?
- What narrower `Position` identity, if any, survives once Holding/Obligation Record, Economic Construction, Decision Subject, Complete Position, and Lifecycle Subject/Episode are distinguished?
- What are the quantity, unit, interval, exclusivity/overlap, authority, and conflict invariants for coverage, encumbrance, allocation, pool membership, mandate binding, and program membership?
- Can Capital Pools overlap, and may one governed share quantity cover more than one obligation at the same effective time?
- Which Event observations/assertions are sufficient for reconciliation in each lifecycle?
- When does operator selection become durable commitment, and how do withdrawal, cancellation, cancel/replace, and partial execution relate to the original Action and Order?
- Which capability/support dimensions need explicit state machines versus assertions?

These are design questions, not defects.

---

## 25. v1.3 non-goals

This draft does not:

- rename `02-domain.md`;
- replace the Options Domain Reference;
- ratify a new architecture;
- change recommendation logic;
- change UI semantics;
- change broker/execution behavior;
- introduce generalized runtime frameworks;
- authorize code/schema migration;
- establish a universal `Strategy` type;
- establish DDD bounded contexts or aggregates;
- claim the candidate primitive list is final.

---

## 26. Proposed maturation path

Before promotion beyond draft:

1. reconcile vocabulary collisions against current authority;
2. test identity and association semantics against concrete specimens;
3. test assertion/authority/time grammar;
4. settle the minimum ontology;
5. settle operational composition/state/lifecycle semantics;
6. settle intent/policy boundaries;
7. settle capability / current-feasibility / Wheelwright-support semantics;
8. settle Decision semantics;
9. trace current implementation concepts against the model;
10. only then consider DDD bounded contexts, aggregates, ACLs, and implementation migration.

The purpose is not to produce a perfect abstract model. The purpose is to give Wheelwright one coherent semantic language so future architecture does not have to infer the world model from scattered documents and code.

---

## 27. v1.3 status

This is a **v1.3 draft integration model** created under Principal direction and canonical intake `PL-SEM-01`, incorporating the first and second independent adversarial reviews and the focused identity–association–assertion specimen reconciliation.

It is durable project memory and a review target.

It is **not** ratified Category A/B architecture and does not override existing authority.

The second independent adversarial review has completed. Three v1 material findings were resolved and the counterfactual-versus-realized finding was substantially but only partially resolved.

The focused identity–association–assertion reconciliation has completed and is recorded in Section 21. It settles enough semantic separation to continue maturation while leaving ratification blocked on the explicitly listed residual questions.

The next authorized pressure is the previously pinned **broader practitioner-strategy falsification pass**, decomposing conventional strategy treatments across mechanics, formation cash flows, payoff geometry, scenario thesis, volatility/time exposure, lifecycle, applicability, capability/feasibility, and external vocabulary without creating a universal `Strategy` type. DDD decomposition remains downstream.
