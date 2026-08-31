# 33 — Strategy / Roadmap Operating-Model Checkpoint

> **Status:** Ratified reconciliation/checkpoint — 2026-08-31.
>
> **Authority:** Category D — provenance of the governance evolution that established `roadmap.md` and `architecture-roadmap.md`. It explains why the current state exists; it does not override Category A/B/C authority.

## Context

Wheelwright had accumulated a strong architecture/governance system, a large evidence-driven parking lot, and a continuous stream of strategic ideas through operator/Principal conversation. What it lacked was a durable strategic roadmap that could accept those ideas without turning the parking lot into a roadmap or turning architecture into product strategy.

The Principal brought two familiar operating ideas together:

1. Thoughtworks EDGE / Lean Value Tree strategy structure: Vision → Goals → Bets → Initiatives.
2. Kotusev-style continuous reconciliation between strategy and architecture at the scope appropriate to the problem, without enterprise-architecture artifact bureaucracy.

This was integrated with Wheelwright's existing Three Actor Development Model (3AM).

## Governance evolution

The resulting operating model is:

### Discovery loop — Principal ↔ Architect

Ideas may enter conversationally and informally. "What about support levels?", "what about credit spreads?", mobile, cloud, Kreature, execution mechanics, and similar questions are legitimate exploration inputs.

Exploration should remain low-friction.

> **Govern commitment, not curiosity.**

### Strategy ↔ architecture reconciliation loop

Material ideas are reconciled against two distinct views:

- **Strategic roadmap:** intended product outcomes and hypotheses.
- **Architecture roadmap:** structural capabilities/transitions that appear necessary or desirable in support of strategy.

Neither silently owns the other. Strategy may pressure architecture downstream; architecture evidence may pressure strategy upstream.

> **Strategy and architecture are distinct but continuously reconciled views of intended evolution.**

### Delivery-learning loop — canonical 3AM

Principal direction → Architect structure → Implementation Engineer builds → working-software/operating evidence → Architect findings → Principal decides next direction.

This is a learning loop, not a hierarchy.

## Course-correction model

The roadmap is not a promise or prescription.

> **The roadmap records current direction, not promised destination; evidence can change it.**

Goals are expected to be more stable than Bets; Vision more stable than Goals. Nothing is immutable. Material evidence can propagate implementation → architecture → Bet → Goal → Vision when warranted.

The current roadmap should describe what is believed now. Chronology and why-state belong in journal/checkpoint history rather than forcing the current roadmap to become archaeological.

## The 60-proposition exploration

A deliberately broad set of 60 candidate propositions was generated across seven Goals:

- G1 Awareness — Understand the Situation
- G2 Choices — Understand the Choices
- G3 Consequences — Understand the Consequences
- G4 Outcomes — Understand the Outcome
- G5 Learning — Improve Empirically
- G6 Continuity — Operate Continuously
- G7 Access — Operate Wherever Needed

No pruning was allowed during reconciliation.

Each proposition was examined for:

1. strategic character;
2. architecture relationship (ALIGNED / ALREADY-RATIFIED / EXTENDS / PRESSURES / ARCH-GAP / CONFLICTS);
3. learning question;
4. architectural finding where warranted.

The first pass demonstrated that all 60 were useful, but not all were peers.

## Why "pruning" was rejected

After reconciliation, "pruning" implied that the objective was to discard useful propositions until a smaller number remained. That was not what the evidence showed.

The 60 propositions occupied different levels and roles:

- genuine strategic Bets;
- Initiatives beneath broader Bets;
- experiments beneath learning Bets;
- architectural consequences/directions;
- operational requirements;
- governing principles.

The better operation was **normalization / synthesis**, not deletion.

> **The goal is not a smaller list. It is a truer map of the thinking.**

## Initiative normalization pass

Using the LVT distinction that a Bet is a hypothesis about value/outcome while an Initiative is something undertaken to test or realize that Bet, the 60 propositions began to normalize naturally.

Examples:

- Continuous observation/significance remained Bet-level; temporal retention and universe evaluation became Initiative-shaped.
- A broader governed trade-shape repertoire remained Bet-level; common Deployment Opportunity representation and reusable economic primitives became Initiative/architecture-shaped.
- Preserving intended economics through execution became the Bet; calculating capital-preserving fill boundaries became an Initiative.
- Complete decision-to-resolution reconstruction became a Bet; lifecycle episodes, recommendation-to-fill linkage, event chronology, lot attribution, and decision-context capture became Initiatives.
- Outcomes revealing discriminating ranking information became a Bet; temporal preservation, deployment-quality definition, and replay became enabling Initiatives; volatility trajectory and factual price geometry became experiments.
- Cloud runtime became an Initiative beneath an already-established continuity direction rather than a manufactured uncertain Bet.

## Blessed starting LVT

The Principal explicitly blessed the normalized tree as the starting point for Wheelwright's roadmap/operating model.

The resulting `roadmap.md` contains 28 Bets plus one established strategic direction. The count is descriptive, not normative.

The tree deliberately retains visible overlap where the same concern has different meaning under different Goals. No target Bet count exists.

## Architecture findings produced by the same analysis

The reconciliation produced a candidate responsibility chain:

> Evidence / Authoritative State → Attention → Governed Alternatives → Consequences → Decision → Execution → Lifecycle & Outcome → Learning → Policy evolution

This is not a service diagram and does not supersede current architecture. It records repeated structural pressure.

The strongest architecture-roadmap themes are:

1. authoritative state must mature beyond market evidence;
2. Attention is distinct from acquisition and Decision;
3. strategy-specific recommendations are pressured toward a governed-Alternative concept;
4. consequence semantics must exist before Explanation;
5. eligibility/acceptability/fitness should remain conceptually distinct;
6. authoritative decision context/computation ownership must become durable enough for always-on and multi-client operation;
7. Decision → Execution → Lifecycle → Outcome needs durable identity;
8. empirical Learning requires reproducible temporal decision context;
9. Continuity is cross-cutting rather than another domain engine;
10. Access is cross-cutting rather than "build mobile" as architecture.

These are captured in `architecture-roadmap.md` with explicit non-prescription and simplicity constraints.

## Relationship to the parking lot

The canonical `parking-lot*.md` sequence remains what it was: unresolved work, evidence, accepted direction, and investigation state within its scoped project concern.

It is **not** replaced by the roadmap and should not be mechanically converted into one.

The roadmap can explain why a parking-lot item matters. A parking-lot item can provide evidence that pressures a Bet or architecture transition. The two artifacts serve different purposes.

## Relationship to project memory

This checkpoint preserves the snapshot that created the first roadmap and architecture-roadmap baseline. Future current-state edits should not erase this provenance.

The current roadmap is intentionally allowed to evolve. This checkpoint remains the answer to: **what did we bless on August 31, 2026, and why?**

## Significance

This is a major evolution in Wheelwright project governance.

Before this checkpoint, Wheelwright had strong evidence discipline, architecture governance, 3AM delivery governance, and durable unresolved-state tracking, but strategic direction was largely reconstructed from foundations, parking-lot pressure, journal history, and Principal conversation.

After this checkpoint, Wheelwright has an explicit operating road base connecting:

> **Vision → Goals → Bets → Initiatives ↔ Architecture → Implementation → Evidence → Learning → Strategy**

without sacrificing exploratory freedom or evidence-driven course correction.
