# Wheelwright Strategic Roadmap

> **Status:** Canonical strategic roadmap — starting point ratified by the Principal on 2026-08-31.
>
> **Authority:** Category C — Canonical Project / Operational State. This document records Wheelwright's current strategic direction. It is intentionally mutable as evidence changes. It does not override Category A system definition or Category B ratified architecture/methodology.
>
> **Method:** Governed by `foundations/strategy-architecture-reconciliation.md` and the Three Actor Development Model.

## Purpose

This is Wheelwright's current Lean Value Tree (LVT) roadmap.

It is a **versioned statement of current direction under current knowledge**, not a promise, prescription, delivery schedule, or immutable destination. Evidence from implementation and operation may strengthen, weaken, reject, supersede, or reframe Bets and may pressure Goals or Vision.

The roadmap records strategic intent. Architectural consequences belong in `architecture-roadmap.md`. Unresolved work and evidence remain in the canonical `parking-lot*.md` sequence. Chronology and why-state belong in project memory/checkpoint artifacts.

Governing operating rule:

> **Explore freely; reconcile before committing. Govern commitment, not curiosity.**

## Lean Value Tree Vocabulary

- **Vision** — durable product direction.
- **Goal** — outcome Wheelwright seeks in service of the Vision.
- **Bet** — a hypothesis about how value/outcomes will be created.
- **Initiative** — something undertaken to test or realize a Bet.
- **Experiment** — a bounded empirical test of a narrower hypothesis; experiments may sit beneath Initiatives/Bets without becoming durable policy.

Architecture, requirements, quality expectations, differentiation choices, and governing principles are not forced into the LVT merely because they are important.

---

# Vision

> **Wheelwright is a continuously operating options-income decision system that connects evidence, choices, and consequences—helping the operator understand what is happening, what can be done, what could happen, and what actually happened.**

The intended loop is awareness → choices → consequences → action → outcome → learning → improved awareness/policy.

---

# G1 (Awareness) — Understand the Situation

> Continuously maintain trustworthy understanding of relevant market, portfolio, position, and evidence state; make material changes and uncertainty apparent.

## A1 — Continuous observation

**Bet:** Continuous observation reveals materially useful changes that periodic operator inspection misses.

**Initiatives:**
- Retain selected market observations over time.
- Evaluate whether small historical price/volatility observations improve situational context.
- Make freshness, insufficiency, disagreement, and degradation explicit.
- Establish governed universe evaluation.

## A2 — Continuous position reassessment

**Bet:** Continuous reassessment of open positions identifies situations requiring attention earlier and more consistently.

**Initiatives:**
- Establish sufficiently rich lot-level portfolio state.
- Continuously reassess open positions against current evidence and economics.

## A3 — Trustworthy significance and attention

**Bet:** Explicit significance modeling can distinguish meaningful change from noise well enough that both attention and silence are trustworthy.

**Initiatives:**
- Establish an Attention/significance model.
- Use temporal observations and current state to determine whether reconsideration is warranted.

---

# G2 (Choices) — Understand the Choices

> Identify the complete set of governed actions genuinely available from current state, including materially different deployment, lifecycle, and WAIT alternatives.

## C1 — WAIT as a genuine alternative

**Bet:** Treating WAIT as a first-class governed alternative improves capital-deployment decisions.

**Initiatives:**
- Represent WAIT alongside actionable alternatives.
- Separate absolute acceptability from relative comparison.

## C2 — Broader governed trade-shape repertoire

**Bet:** A broader governed repertoire of trade shapes improves capital deployment compared with optimizing only the current Wheel strategy set.

**Child hypotheses:**
- Defined-risk credit put spreads can create attractive opportunities by exchanging some premium for bounded downside.
- Defined-risk credit call spreads can create useful income opportunities with materially different consequences from covered calls.

**Initiatives:**
- Normalize strategy-specific candidates into a common Deployment Opportunity / Alternative representation.
- Support reusable economic primitives for multi-leg and future trade shapes. This is also an architecture-roadmap concern.

## C3 — Lifecycle alternative comparison

**Bet:** Explicit comparison of lifecycle alternatives improves position-management decisions.

**Initiatives:**
- Compare HOLD, CLOSE, ROLL, and natural resolution.
- Represent alternatives as possible state transitions rather than only opening trades.

## C4 — Future optionality in choice

**Bet:** Future optionality materially affects the quality of otherwise similar choices.

**Initiatives / experiments:**
- Evaluate alternatives across expirations as different future action spaces.
- Incorporate capital duration and resulting flexibility into comparison.

## C5 — Capital state determines feasible choices

**Bet:** The actual feasible choice set depends materially on current capital state.

**Initiatives:**
- Establish explicit capital availability and encumbrance reasoning.
- Integrate authoritative portfolio/capital state into alternative generation.

## C6 — Governed universe evolution

**Bet:** Systematically governing universe admission improves the set of genuinely deployable alternatives.

**Initiatives:**
- Create the universe candidate evaluation/admission workflow.
- Make admission, displacement, rejection, insufficient evidence, and review explicit.

---

# G3 (Consequences) — Understand the Consequences

> Make consequences and tradeoffs explicit enough for deliberate, accountable decisions.

## K1 — Consequence envelopes

**Bet:** Explicit consequence envelopes improve operator decisions compared with premium/rank-centric presentation.

**Initiatives:**
- Represent maximum gain/loss, breakeven, capital commitment, assignment/inventory consequences, and relevant conditional outcomes.

## K2 — Compensation relative to consequence

**Bet:** Compensation relative to accepted capital consequence is a better measure of deployment quality than premium yield alone.

**Initiatives:**
- Develop compensation-versus-consequence measures.
- Compare those measures against current ranking dimensions.

## K3 — Future optionality as consequence

**Bet:** Future optionality is a material consequence of a decision.

**Initiatives:**
- Expose how alternatives alter future action space.
- Incorporate duration, capital lockup, adjustment possibilities, and resulting state where useful.

## K4 — Upstream governed risk/consequence profiles

**Bet:** Moving risk/consequence discretion upstream into governed policy reduces state-dependent risk taking.

**Initiatives:**
- Establish governed consequence/risk profiles.
- Express acceptable consequence boundaries before individual opportunities appear.

## K5 — Precommitted lifecycle policy

**Bet:** Precommitted lifecycle policy produces more consistent decisions under pressure.

**Initiatives:**
- Establish governed BTC/take-profit behavior.
- Establish adverse-boundary rules.
- Establish assignment/rolling/resolution policy.

## K6 — Comparative explanation

**Bet:** Comparative explanations improve deliberate operator judgment as alternatives become more multidimensional.

**Initiatives:**
- Explain why the preferred alternative survives.
- Expose material tradeoffs against plausible alternatives.

## K7 — Absolute acceptability before fitness

**Bet:** Separating absolute acceptability from relative fitness reduces deployment into the best bad opportunity.

**Initiatives:**
- Establish acceptability gates before ranking.
- Preserve WAIT when nothing clears them.

## K8 — Preserve economics through execution

**Bet:** Preserving intended economics through execution improves realized deployment quality.

**Initiatives:**
- Calculate capital-preserving execution boundaries.
- Expose those boundaries before broker handoff.

---

# G4 (Outcomes) — Understand the Outcome

> Reconstruct what actually happened from decision through execution and lifecycle resolution, including economic and capital consequences.

## O1 — Decision-to-resolution lifecycle reconstruction

**Bet:** Reconstructing the complete decision-to-resolution lifecycle produces more useful economic understanding than isolated transaction history.

**Initiatives:**
- Reconstruct positions as lifecycle episodes.
- Link recommendation-time economics to actual execution.
- Establish chronological economic events.
- Establish lot-level basis attribution.
- Preserve selected action and alternatives available at decision time.

## O2 — Capital-consequence accounting

**Bet:** Capital-consequence accounting provides a more meaningful account of options-income performance than premium accounting alone.

**Initiatives:**
- Track capital deployed, encumbered, released, appreciated, and eroded.
- Relate premium flows to the capital consequences that produced them.

## O3 — Broker-derived lifecycle truth

**Bet:** Broker-derived execution and resolution evidence can materially improve lifecycle truth while reducing manual reconciliation.

**Initiatives:**
- Acquire broker execution evidence where practical.
- Reconcile intended → submitted → working → filled → resolved states.
- Derive lifecycle resolution from authoritative evidence where possible.

---

# G5 (Learning) — Improve Empirically

> Use point-in-time evidence and observed outcomes to improve policy while preserving reproducibility, attribution, explanation, and governance.

## L1 — Outcomes reveal discriminating ranking information

**Bet:** Lifecycle outcomes can reveal ranking factors with genuine discriminatory information.

**Initiatives:**
- Preserve point-in-time evidence, recommendations, and outcomes.
- Define multidimensional deployment quality.
- Establish historical policy replay.

**Experiments:**
- Volatility trajectory.
- Factual price geometry.
- Cross-DTE duration/optionality.

## L2 — Execution mechanics improve empirically

**Bet:** Execution mechanics can be improved empirically and independently of recommendation quality.

**Initiatives / experiments:**
- Experiment with limit-order pricing.
- Experiment with fill boundaries.
- Experiment with BTC/take-profit mechanics.
- Measure recommendation quality separately from execution quality.

## L3 — Risk-profile performance can be learned empirically

**Bet:** Comparing realized outcomes across risk profiles can identify when paying for defined risk produces superior overall deployment quality.

**Initiatives:**
- Compare CSP versus put-spread outcomes where economically meaningful.
- Compare call-side consequence profiles.
- Evaluate premium haircut against capital efficiency and realized downside.

**Cross-cutting enabling work:**
- Version policy and recommendation provenance.
- Require controlled empirical evidence before promoting candidate ranking factors into durable policy.

---

# G6 (Continuity) — Operate Continuously

> Operate continuously and reliably without depending on the operator workstation or an active interface.

## Established strategic direction — Always-on durable Wheelwright

Wheelwright becomes an always-on durable appliance independent of the operator workstation. This direction is already substantially accepted; it is not represented as an uncertain Bet merely to make the tree symmetrical.

**Initiatives:**
- Establish durable cloud runtime.
- Separate continuous backend responsibilities from transient clients.
- Establish health/degradation/recovery semantics.
- Establish durable backup/recovery.
- Establish continuously operating observation/attention capability consistent with current governing boundaries.

**Architecture implications:**
- Determine which decision responsibilities require a durable service boundary.
- Preserve Evidence Appliance simplicity unless demonstrated pressure requires greater infrastructure complexity.

## N1 — Decision-value-aware evidence acquisition

**Bet:** Prioritizing finite acquisition capacity by decision relevance improves the freshness of evidence that matters most.

**Initiatives / experiments:**
- Expose decision/attention relevance without transferring acquisition authority.
- Compare decision-value-aware acquisition against current governed scheduling.

**Constraint:** This Bet does not authorize scheduler changes during the current Constraint Identification investigation. Acquisition authority and current behavioral invariants remain governing.

---

# G7 (Access) — Operate Wherever Needed

> Securely understand and appropriately interact with current decision state wherever operator attention is required.

## X1 — Attention-first mobile

**Bet:** An attention-first mobile experience delivers most of the valuable off-desktop experience without reproducing the workstation.

**Initiatives:**
- Build mobile around attention and inspection.
- Organize mobile around operator questions rather than desktop route topology.
- Establish shared authoritative state across clients.
- Establish durable attention acknowledgement.

## X2 — Material notifications

**Bet:** Notifications of genuinely material attention states reduce routine checking without creating alert fatigue.

**Initiatives:**
- Deliver Attention states through push notifications.
- Preserve significance and uncertainty in notification decisions.

## X3 — Bounded consequential remote action

**Bet:** Progressively introducing bounded consequential mobile actions provides useful remote control without weakening accountable-human governance.

**Initiatives:**
- Begin with non-consequential acknowledgement/defer workflows.
- Introduce consequential actions only behind explicit governance boundaries.
- Establish appropriate authentication and authorization.

## X4 — Trustworthy concise explanation

**Bet:** Concise explanations can preserve operator trust and decision quality despite the information constraints of mobile.

**Initiatives:**
- Compress explanations around what changed, why it matters, current consequences, available alternatives, and comparative reasoning.

---

# Cross-Cutting Quality and Differentiation Lens

The LVT answers what outcomes and capabilities Wheelwright currently believes are worth pursuing. It does not imply that every capability deserves the same level of refinement.

When useful, roadmap decisions should be reconciled through the quality/differentiation lens defined in `foundations/strategy-architecture-reconciliation.md`:

- Which qualities determine whether this capability is useful?
- What does **good enough for the current operating context** mean?
- What would **good** look like beyond that stopping point?
- Is excellence here strategically differentiating, or is the capability primarily enabling/commoditized?
- What evidence supports the current assessment?
- What condition would cause Wheelwright to return later and close more of the gap?

Quality dimensions are capability-specific; no universal scorecard is required.

## Emerging differentiator — Trustability

A recurring strategic concern across Awareness, Choices, Consequences, Outcomes, Learning, Continuity, and Access is the operator's question:

> **Can I trust what I'm seeing?**

Trustability is currently treated as an emerging cross-cutting differentiator rather than a separate Goal. Depending on the capability, it may be supported by accuracy, freshness, completeness, explicit uncertainty, provenance, determinism, reproducibility, explainability, operational reliability, and the trustworthiness of both attention and silence.

This is not solely a product concern and not solely an architecture concern. Product direction defines the trustworthy operator experience; architecture and implementation must make it true; operating evidence reveals where trust is weak.

## Good enough as intentional timing

A supported Bet or useful capability may still reach an intentional stopping point before all known improvement is exhausted.

A **good-enough-now** judgment means the capability is sufficiently fit for the current operating context that the next increment of effort is better spent elsewhere. The remaining gap to good or excellent should remain understandable, together with material conditions that would cause Wheelwright to revisit it.

This allows current work to stop successfully without pretending that no further improvement is possible.

# Current Structural Reading

This first normalized LVT contains **28 Bets plus one established strategic direction**. The number is descriptive, not a target.

The original broad 60-proposition exploration remains valuable. Reconciliation showed that those propositions were not 60 peers: some were Bets, some Initiatives, some experiments, some architectural consequences, some requirements, and some governing principles. This roadmap preserves their useful content by placing it at the level where it naturally belongs rather than deleting it to satisfy an arbitrary Bet count.

Visible overlap across Goals is retained where the same concern has genuinely different strategic meaning. Examples include future optionality as both a property of choice (C4) and a consequence of choice (K3), WAIT (C1) and absolute acceptability (K7), and Attention (A3) with remote notification (X2). Future evidence may justify synthesis; no reduction target is imposed.

The roadmap is one input to the operating question **what should we work on next?** That question also depends on current evidence, experiments, quality/fitness, differentiation intent, dependencies, architectural readiness, and the opportunity cost of continuing current work.

# Roadmap Change Discipline

1. Exploration is unconstrained by this tree.
2. Material ideas are reconciled against both this roadmap and `architecture-roadmap.md` before commitment.
3. Material capability decisions may also require explicit quality/fitness and differentiation judgment.
4. Implementation evidence may create pressure upstream; it does not silently rewrite strategy.
5. The Architect identifies relationships, contradictions, pressure, and current adequacy. The Principal decides changes in direction and where Wheelwright intends to differentiate.
6. Bets may strengthen, weaken, be rejected, be superseded, or be reframed.
7. A supported capability may intentionally stop at good enough for the current context while further improvement remains deferred.
8. Goals are expected to be more stable than Bets; Vision more stable than Goals. Nothing is immutable.
9. Changes to this current-state document should preserve why-state in the project journal or a reconciliation/checkpoint artifact.
