# Wheelwright Semantic Model v1.1 — Draft

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

The largest integration gap is not another noun taxonomy. Wheelwright repeatedly needs to reason about claims.

A semantic assertion conceptually answers:

> **Who asserts what, about which subject, for what effective time, from what evidence or authority, at what epistemic level, and through which transformations may that meaning travel?**

A load-bearing assertion may require:

- subject;
- predicate / claim;
- value or relation;
- epistemic class;
- authority class;
- evidence / provenance;
- effective time;
- recorded time;
- derivation method;
- uncertainty / unresolved status;
- supersession / conflict relationship.

This is a conceptual contract, not a requirement for a generic `Assertion` runtime object or table.

### Association is itself a claim

Identity, association, attribution, aggregation, coverage, and correlation must not be collapsed.

Examples:

- a broker event belongs to a lifecycle;
- a short call is covered by identified inventory;
- inventory belongs to a strategic capital pool;
- realized appreciation is attributable to a governed lifecycle event.

These relationships require authority; proximity or matching identifiers do not manufacture them.

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

### Economic construction

Describes what economically exists now.

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

The exact boundary remains open: canonical `Intent` may ultimately mean only scoped outcome stance, leaving objective/purpose/mandate as distinct concepts.

### Admissibility and preference are distinct

“Desired,” “acceptable,” “tolerated,” “undesired,” and “prohibited” should not be treated as one simple scalar.

At minimum distinguish:

- whether an outcome is admissible under policy;
- how it is preferred among admissible outcomes.

A prohibited outcome is not merely a very low-ranked outcome.

### Policy remains distinct

Intent says what outcome/purpose applies to a subject. Policy supplies constraints, prohibitions, thresholds, and preferences governing decisions.

An authoritative policy may imply an outcome stance only when its applicability and subject binding are explicit.

---

## 11. Time and history

Time is semantic, not incidental metadata.

Wheelwright needs to distinguish at least:

1. **Economic/event time** — when a trade, assignment, deposit, disposition, or other economic event occurred.
2. **Processing/settlement time** — broker processing and settlement boundaries.
3. **Observation/acquisition time** — when evidence was acquired.
4. **Effective/decision time** — when intent, policy, Situation, capability, or recommendation governed.
5. **Recorded time** — when Wheelwright learned or persisted the assertion.

Historical intent and policy must be preserved when required to answer:

> Was this decision consistent with the plan and evidence as known at the time?

Current intent must not rewrite historical intent.

---

## 12. State, counterfactual consequence, realized outcome, intent, and alignment

These are separate semantic layers.

| Layer | Question |
|---|---|
| State | What is true now? |
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

An Event Observation / Assertion answers:

> **What evidence establishes or reports that occurrence, with what authority and provenance?**

A Reconciled Outcome answers:

> **What resulting state/economic result has Wheelwright accepted into history after evidence, association, and reconciliation?**

Economic Attribution answers:

> **How should that realized result be classified under the bounded accounting authorities?**

These boundaries are essential to Policy over Prediction and to historical truth.

---

## 17. Validity, supersession, and revocation

Some semantic objects are only valid under dependencies.

Examples:

- recommendations depend on evidence, policy, intent, capability, and time;
- intent may be superseded prospectively;
- policy may change;
- broker capability observations may become stale;
- evidence verdicts may expire or be superseded.

The semantic model must eventually define dependency-sensitive invalidation without pretending that every concept shares one lifetime.

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
| Strategic SPY overwrite | capital pool; mandate; inventory role/binding; overwrite program; retention intent; short-call obligation; counterfactual consequence; capability vs current feasibility vs Wheelwright support; policy |
| Buy-write | coordinated formation mechanism; provenance; resulting covered-call construction |
| CSP acquisition | short-put construction; collateral; acquisition intent; assignment consequence |
| CSP income | same construction; premium purpose; assignment acceptable/disfavored rather than necessarily desired |
| Wheel | durable program identity; cycle/process state; Candidate vs Alternative; multiple position lifecycles; Events/observations/reconciled transitions; capital transitions |
| Protective put | construction; protection purpose; desired floor distinct from undesired adverse market event |
| Collar | construction; protection purpose; accepted upside cap/call-away consequence |
| Vertical spread | multi-leg construction; bounded consequence surface; purpose separately scoped |
| Iron condor | four-leg construction; range consequence profile; terminal-state preferences |
| PMCC / diagonal | multi-expiry construction; lifecycle complexity; no literal share-coverage assumption |
| BWB / HBWB | asymmetric consequence surface; desired tail behavior; tolerated intermediate valley |
| HOLD | normalized no-transaction Alternative; continuing obligation/exposure; capability not confused with action; next decision boundary |
| CLOSE | Alternative; contemplated Action; broker Order where applicable; Execution vs execution evidence; counterfactual close cost vs realized fill; reconciled residual state |

A candidate semantic distinction that cannot survive these specimens should not be promoted.

---

## 21. Product / operator projection

Operator surfaces project semantic claims; they do not create truth merely by rendering it.

Two traceability rules are proposed:

1. Every operator-visible semantic claim should identify the upstream semantic owner it projects.
2. Every operator interaction intended to establish authority should identify the semantic assertion it creates.

This is particularly important for intent declarations, policy changes, recommendations, completion states, and semantic coloring.

---

## 22. Boundary with implementation and DDD

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

## 23. Open identity and scope questions

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
- Which Event observations are sufficient for reconciliation in each lifecycle?
- Which capability/support dimensions need explicit state machines versus assertions?

These are design questions, not defects.

---

## 24. v1.1 non-goals

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

## 25. Proposed maturation path

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

## 26. v1.1 status

This is a **v1.1 draft integration model** created under Principal direction and canonical intake `PL-SEM-01`, incorporating the first independent adversarial review.

It is durable project memory and a review target.

It is **not** ratified Category A/B architecture and does not override existing authority.

The next useful pressure is a second adversarial review focused on whether the v1 findings are actually resolved and whether the revised distinctions survive the semantic specimens. DDD decomposition remains downstream.
