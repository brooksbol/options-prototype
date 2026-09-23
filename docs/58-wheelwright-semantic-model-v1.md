# Wheelwright Semantic Model v1 — Draft

**Date:** September 23, 2026  
**Status:** Draft semantic integration model — Current Specialized Reference (Category E); **not ratified architecture or implementation authority**  
**Canonical intake:** `PL-SEM-01`  
**Scope:** Wheelwright-wide semantic integration across domain, portfolio, lifecycle, evidence, intent/policy, capability, decision, execution, and accounting submodels  
**Related:** `docs/foundations/options-domain-reference.md`, `docs/foundations/options-domain-competence-contract.md`, `docs/25-situation-architecture.md`, `docs/07c-adrs.md`, `docs/architecture-roadmap.md`, `docs/47-capital-state-management-deployment-paths-discovery-2026-09-07.md`, `docs/58-wheelwright-semantic-model-v1.md`

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

## 5. Candidate semantic primitives

“Primitive” means semantically irreducible for Wheelwright reasoning. It does **not** imply one class, table, aggregate, or service per concept.

### Identity and economic world

- **Account / Account Regime** — Wheelwright brokerage-account identity and the broker/account semantic regime applicable to it.
- **Instrument / Contract** — externally identifiable tradable instrument or contract.
- **Asset / Right / Obligation** — economically material constituents of a complete position.
- **Inventory Block / Lot** — owned inventory at the level required for mandate, basis, encumbrance, or lifecycle attribution.
- **Economic Position / Complete Position** — the economically material assets, cash, rights, obligations, collateral, encumbrance, and residual exposure that must be reasoned about together.
- **Capital Boundary / Capital Pool** — governed boundary within which capital is classified, allocated, constrained, and evaluated.
- **Portfolio Mandate / Inventory Role** — the expected contribution or governed role of capital/inventory, distinct from a specific outcome stance.

### Change over time

- **State** — facts true of a subject at a time.
- **Event** — something observed to have occurred.
- **Transition** — the semantic before/after transformation associated with an event or contemplated action.
- **Process** — ordered activity producing transitions.
- **Operating Program** — durable governed purpose/process spanning multiple positions or cycles.
- **Lifecycle** — the relevant state/event history of a particular subject.
- **Formation Provenance** — how the current state or construction came to exist.

### Claims and governance

- **Evidence Observation** — an observation with provenance and time semantics.
- **Authoritative Association** — a governed claim that two otherwise independent identities are related for a stated purpose.
- **Intent Assertion** — an authoritative, scoped, time-bounded statement of purpose or stance toward an outcome. Whether purpose and outcome stance remain one primitive is unresolved.
- **Policy Rule / Constraint / Preference** — governed rules about admissibility, prohibition, thresholds, and comparison.
- **Situation / Regime** — higher-scope operating context and objective semantics.

### Decision and action

- **Alternative** — a candidate governed path, including a valid no-transaction alternative such as HOLD.
- **Consequence** — a conditional economic/resulting-state effect of an Alternative or lifecycle event.
- **Recommendation** — a time- and evidence-bounded decision result over Alternatives; not an execution fact.
- **Action / Order** — operator or system instruction intended to cause a transition.
- **Observed Execution** — authoritative evidence that an action was actually executed.
- **Accounting Stock / Flow / Attribution** — governed economic/accounting semantics such as Portfolio Capital and Production.

This list is provisional and must survive semantic specimens before ratification.

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

## 12. State, consequence, intent, and alignment

These are separate semantic layers.

| Layer | Question |
|---|---|
| State | What is true now? |
| Consequence | What would happen if a specified transition occurred? |
| Intent | What purpose/outcome stance authoritatively applies? |
| Policy | What is permitted, prohibited, constrained, or preferred? |
| Alignment | How consistent is the current trajectory with the governed plan? |

**Alignment is derived**, not primitive.

Example:

- State: a call is ITM.
- Consequence: assignment would dispose of 100 shares at the strike.
- Intent: disposition is desired for this inventory.
- Policy: assignment at this effective exit is admissible.
- Alignment: current trajectory may align with the governed plan.

The same ITM state against strategic retention inventory can produce the opposite alignment.

---

## 13. Capability and executability

A mechanically coherent and policy-admissible Alternative may still be unavailable.

Capability/executability answers:

> **Can Wheelwright/operator actually perform this Alternative in this account, through this broker, under current evidence and operational conditions?**

Relevant constraints may include:

- account permissions / option tier;
- broker product and order support;
- collateral treatment;
- settlement state;
- market evidence sufficiency;
- liquidity / executable market;
- supported order semantics;
- Wheelwright implementation/support maturity.

This is distinct from:

- mechanical validity;
- policy admissibility;
- desirability;
- recommendation.

Understanding a structure does not imply Wheelwright supports recommending, staging, executing, or lifecycle-managing it.

A later capability model may be warranted. This draft establishes the semantic gap without selecting a standalone artifact.

---

## 14. Decision semantics

Wheelwright needs domain-level decision semantics independent of service/module placement.

Working composition:

```text
current subject/state
+ authoritative evidence
+ applicable intent and policy
+ candidate Alternatives
+ conditional consequences
+ capability/executability
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

## 15. Decision-to-execution ladder

The semantic ladder is:

```text
candidate
→ Alternative
→ recommendation
→ operator selection
→ contemplated action
→ staged broker instruction
→ submitted order
→ working order
→ execution
→ broker-observed event
→ reconciled domain state
```

Adjacent stages must not be collapsed merely because one implementation currently represents them with the same object or UI interaction.

Assignment is a lifecycle event, not necessarily an operator action. HOLD is an Alternative without a transaction event.

---

## 16. Counterfactual semantics

Wheelwright must preserve the distinction among:

- current factual state;
- conditional consequence;
- forecasted likely outcome;
- recommended action;
- observed historical result.

A consequence answers “if this transition occurs, then…”. It does not assert that the transition will occur.

This boundary is essential to Policy over Prediction.

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

## 19. Primitive versus derived semantics

### Strong primitive candidates

- account / account regime;
- instrument / contract;
- asset / right / obligation;
- inventory block / lot;
- complete position;
- capital boundary / pool;
- state / event / transition;
- formation provenance;
- evidence observation;
- authoritative association;
- intent assertion;
- policy rule / constraint / preference;
- Situation / regime;
- Alternative;
- consequence;
- operating program;
- action / order / execution;
- accounting stock / flow.

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

---

## 20. Semantic specimens

| Specimen | Required distinctions |
|---|---|
| UNG disposition covered call | inventory subject; covered-call construction; call-away consequence; disposition intent; policy; alignment |
| Strategic SPY overwrite | capital pool/mandate; strategic inventory binding; overwrite program; retention intent; short-call obligation; consequence; capability/policy |
| Buy-write | coordinated formation mechanism; provenance; resulting covered-call construction |
| CSP acquisition | short-put construction; collateral; acquisition intent; assignment consequence |
| CSP income | same construction; premium purpose; assignment acceptable/disfavored rather than necessarily desired |
| Wheel | durable program identity; cycle/process state; multiple position lifecycles and capital transitions |
| Protective put | construction; protection purpose; desired floor distinct from undesired adverse market event |
| Collar | construction; protection purpose; accepted upside cap/call-away consequence |
| Vertical spread | multi-leg construction; bounded consequence surface; purpose separately scoped |
| Iron condor | four-leg construction; range consequence profile; terminal-state preferences |
| PMCC / diagonal | multi-expiry construction; lifecycle complexity; no literal share-coverage assumption |
| BWB / HBWB | asymmetric consequence surface; desired tail behavior; tolerated intermediate valley |
| HOLD | no-transaction Alternative; continuing obligation/exposure; next decision boundary |
| CLOSE | action Alternative; indicative versus executed cost; residual resulting state |

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

These are design questions, not defects.

---

## 24. v1 non-goals

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
7. settle capability/executability semantics;
8. settle Decision semantics;
9. trace current implementation concepts against the model;
10. only then consider DDD bounded contexts, aggregates, ACLs, and implementation migration.

The purpose is not to produce a perfect abstract model. The purpose is to give Wheelwright one coherent semantic language so future architecture does not have to infer the world model from scattered documents and code.

---

## 26. v1 status

This is a **draft integration model** created under Principal direction and canonical intake `PL-SEM-01`.

It is durable project memory and a review target.

It is **not** ratified Category A/B architecture and does not override existing authority.

The next useful pressure is adversarial review and specimen-driven reconciliation, not implementation.
