# Wheelwright Architecture Roadmap

> **Status:** Canonical architecture-roadmap starting point — ratified by the Principal on 2026-08-31 as the structural counterpart to `roadmap.md`.
>
> **Authority:** Category C — Canonical Project / Operational State. This document records current architectural pressure and intended structural evolution. It does not replace `07-architecture-current.md` (Category A) or ratified Category B decisions. Where this roadmap conflicts with A/B authority, A/B governs until explicitly changed through the normal architecture process.
>
> **Method:** Governed by `foundations/strategy-architecture-reconciliation.md` and `foundations/three-actor-model.md`.

## Purpose

The strategic roadmap and architecture roadmap are distinct but continuously reconciled views of intended evolution.

- `roadmap.md` asks: **What outcomes do we believe will create value, and what are we betting on?**
- This document asks: **What structural capabilities/transitions appear necessary or desirable if those strategic beliefs survive contact with evidence?**

This is not a project plan, service decomposition, target-state diagram, or authorization to implement every pressure listed here.

> **Explore freely; reconcile before committing.**

Architecture may push upstream on strategy when implementation evidence exposes constraints or new possibilities. Strategy may push downstream on architecture when new Bets require capabilities the current system cannot coherently support.

---

# Current Architecture Baseline

The governing baseline remains `07-architecture-current.md` and the Category A/B documents indexed by `docs/README.md`.

The roadmap starts from several already-governing characteristics:

- Wheelwright is an evidence appliance.
- Evidence acquisition and recommendation responsibilities are separated.
- Evidence is authoritative and durable; facts are persisted and trust is derived.
- Recommendation behavior is deterministic under the same evidence and policy.
- The operator remains accountable for consequential decisions and broker submission.
- The browser is increasingly treated as an operator client/viewport rather than the natural owner of always-on system cognition.
- Cloud/always-on operation is accepted direction.
- SQLite remains appropriate absent demonstrated pressure requiring a heavier persistence architecture.

# Architectural Pressure Revealed by Strategic Reconciliation

The 2026-08-31 strategy pass reconciled 60 broad propositions against current architecture, then normalized them into an LVT. The strongest repeated structural pressures are below.

## AR1 — Authoritative State Must Mature Beyond Market Evidence

**Pressure from:** A2, C5, O1/O2, L1, X1.

Current market evidence is backend-authoritative and durable, while important portfolio/decision context remains comparatively client-owned or reconstruction-heavy.

Future Bets repeatedly require trustworthy knowledge of:

- lot-level ownership and basis;
- capital availability and encumbrance;
- open obligations and rights;
- lifecycle state;
- policy version and relevant decision context;
- operator attention/acknowledgement where multi-client coherence requires it.

**Candidate transition:** from market-evidence authority plus browser portfolio context toward a durable authoritative state substrate sufficient for continuous decision support and outcome reconstruction.

**Not yet prescribed:** one database model, one service, event sourcing, or a particular portfolio schema.

## AR2 — Attention Emerges as a Distinct Responsibility

**Pressure from:** A1–A3, N1, X1/X2.

Continuous acquisition is not the same as watching, and watching is not the same as deciding.

The reconciliation repeatedly produced a distinct concern:

> change → significance → attention

Attention answers whether current state deserves operator reconsideration. Decision answers what governed alternatives exist and how they compare.

**Candidate transition:** establish durable significance/attention semantics that can operate independently of browser lifetime without becoming a second recommendation engine.

**Kreature boundary:** Existing ratified/project-memory boundaries concerning Kreature remain constraints. This roadmap does not silently redefine Kreature as an embedded Wheelwright subsystem. Wheelwright may need continuous Attention capability; how that relates to an independent Kreature observer must be reconciled explicitly before implementation.

## AR3 — From Strategy-Specific Recommendations Toward Governed Alternatives

**Pressure from:** C1–C6, K1–K8.

The strategic tree increasingly asks Wheelwright to reason over:

- WAIT;
- CSP and covered-call/buy-write choices;
- defined-risk multi-leg shapes;
- HOLD/CLOSE/ROLL/natural resolution;
- capital feasibility;
- future optionality.

A trade candidate is too narrow because some legitimate alternatives contain no opening trade.

**Candidate transition:** from parallel strategy-specific recommendation pipelines toward a common concept of a **governed Alternative** grounded in authoritative state.

An Alternative may describe a possible state transition and may or may not contain a trade shape.

**Architecture hypothesis:** strategy extensibility may be better supported by reusable economic primitives—rights, obligations, legs, inventory, collateral/encumbrance, compensation, payoff, expiration, lifecycle, execution, and optionality—than by adding independent strategy architectures indefinitely.

This hypothesis must be earned through concrete strategy pressure; it is not authorization for a premature generalized framework.

## AR4 — Consequence Semantics Before Explanation

**Pressure from:** K1–K8, C2/C4, O2, L3.

Consequences are not merely explanatory prose. Policy and Decision increasingly need structured consequence semantics before Explanation can render them.

Candidate consequence dimensions include:

- bounded/unbounded loss;
- maximum gain;
- breakeven;
- capital commitment/encumbrance;
- assignment/inventory consequences;
- conditional outcomes;
- duration;
- future optionality;
- execution sensitivity.

**Candidate transition:** make consequence/economic semantics first-class domain data usable by Policy, Decision, Execution, Explanation, Outcome, and Learning.

This does **not** imply a separate Consequences service or engine.

## AR5 — Separate Eligibility, Acceptability, and Comparative Fitness

**Pressure from:** C1, K2, K7.

Relative ranking alone always produces a winner, including on a bad board. WAIT and absolute deployment quality require a distinction between:

1. what is feasible/eligible;
2. what is acceptable at all;
3. what is comparatively preferable among survivors.

**Candidate transition:** evolve Decision/Policy semantics so absolute acceptability is not hidden inside a relative rank score.

## AR6 — Durable Decision Context and Computation Ownership

**Pressure from:** A2, C5, O1, L1, G6, G7; also current PL-ARCH-06 pressure.

The strategic roadmap requires continuous reassessment, multi-client consistency, historical replay, attention, and decision provenance. Those needs cannot all depend on an active browser owning the relevant context.

The architectural question is broader than "move the recommendation engine to the backend":

> **Where does authoritative decision context live, and where should deterministic decision evaluation occur?**

**Candidate transition:** move appropriate state and computation behind a durable/shared boundary while preserving deterministic behavior and avoiding unnecessary service decomposition.

## AR7 — Decision → Execution → Lifecycle → Outcome Identity

**Pressure from:** K8, O1–O3, L1–L3.

Future learning requires Wheelwright to distinguish:

- recommendation/decision quality;
- execution quality;
- outcome quality.

That requires durable identity across what was known, what alternatives existed, what was selected, what was intended for execution, what actually filled, how the position evolved, and how it resolved economically.

Two useful conceptual identities emerged:

- **Decision episode:** what was known, what choices existed, what was selected, and why.
- **Lifecycle episode:** what happened after selection through economic resolution.

Their exact cardinality and representation are intentionally unresolved, especially for rolling and compound transitions.

**Candidate transition:** strengthen the connective tissue between Decision, broker handoff/execution evidence, lifecycle state, and Production/Outcome.

## AR8 — Learning Requires a Reproducible Temporal Substrate

**Pressure from:** L1–L3 and G4.

Empirical policy evolution requires a dependency chain:

> temporal evidence → decision context/provenance → execution identity → lifecycle/outcome truth → deployment-quality definition → replay/experimentation → policy change

**Candidate transition:** make point-in-time decision environments reproducible enough to evaluate candidate policies without hindsight contamination.

Required supporting concerns include policy/recommendation provenance and explicit deployment-quality definitions.

Candidate features such as volatility trajectory, factual price geometry, and cross-DTE optionality remain experiments until evidence demonstrates incremental value.

## AR9 — Continuity Is a Cross-Cutting System Property

**Pressure from:** G6.

Always-on operation is accepted direction, not a new domain engine.

Architectural consequences include:

- durable cloud runtime;
- continuous backend responsibilities independent of clients;
- explicit health/degradation/recovery semantics;
- backup/recovery;
- appropriate durable decision/attention responsibilities;
- finite-provider-capacity governance.

Provider scarcity remains a fact. Higher-level concerns may eventually expose decision relevance, but Evidence Acquisition remains authoritative over provider scheduling unless a future ratified decision changes that boundary.

## AR10 — Access Is a Cross-Cutting Client/Operator Property

**Pressure from:** G7.

Mobile is not itself the architectural objective. The objective is coherent access to appropriate authoritative state and reasoning away from the primary workstation.

Architectural consequences include:

- shared authoritative state across clients;
- durable attention acknowledgement where needed;
- secure authentication/authorization;
- explanations that can be rendered at different information densities;
- bounded remote action that preserves accountable-human governance.

The likely sequence is state → Attention → remote delivery → remote understanding → bounded remote action, rather than desktop-route replication.

---

# Candidate Responsibility Model

Strategic reconciliation repeatedly produced the following responsibility chain:

> **Evidence / Authoritative State**
> → **Attention**
> → **Governed Alternatives**
> → **Consequences**
> → **Decision**
> → **Execution**
> → **Lifecycle & Outcome**
> → **Learning**
> → **Policy evolution**

This is a **responsibility model, not a service diagram**. It does not supersede the current Four Engines or authorize nine new components. Its purpose is to identify concerns that the current Four Engines may not fully express as Wheelwright evolves.

Explanation, governance/provenance, continuity, and access operate across these concerns rather than necessarily becoming additional engines.

# Reconciliation With the Current Four Engines

The current Evidence → Policy → Decision → Explanation model remains useful and governing where represented in current architecture.

The strategic roadmap exposes pressure beyond its present conceptual endpoint:

- **Outcome** is not merely Explanation or reporting; it closes the economic lifecycle.
- **Learning** needs the chain from evidence-at-decision through outcome.
- **Attention** is distinct from both acquisition and recommendation.
- **Consequences** increasingly need structured semantics before Explanation.

The architecture roadmap therefore records pressure to evolve the conceptual model without prematurely replacing it.

# Simplicity Constraint

None of the above implies microservices, event sourcing, distributed databases, or heavyweight infrastructure.

> **Complexity must be earned by demonstrated architectural pressure.**

The Evidence Appliance boundary, deterministic policy/decision behavior, SQLite persistence posture, and accountable-human execution model remain strong constraints unless evidence and explicit ratification change them.

# Change Discipline

1. This roadmap records architectural pressure and current intended evolution, not implementation authorization.
2. Category A/B authority governs until explicitly changed.
3. Strategic Bets may create architecture pressure; architecture findings may pressure Bets upstream.
4. The Architect proposes structural interpretation. The Principal decides material direction changes.
5. Implementation Engineer findings return as evidence through the Three Actor loop.
6. Material changes to this roadmap should preserve why-state in a journal or reconciliation/checkpoint artifact.
7. Occasional whole-roadmap drift review is useful, but reconciliation is primarily evidence-triggered rather than cadence-driven.
