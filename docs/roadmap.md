# Wheelwright Strategic Roadmap

> **Status:** Canonical strategic roadmap — starting point ratified by the Principal on 2026-08-31; semantic LVT identifier/presentation migration ratified 2026-09-09.
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
- **Direction** — an established strategic direction that is intentionally not represented as an uncertain Bet merely to make the tree symmetrical.

Architecture, requirements, quality expectations, differentiation choices, and governing principles are not forced into the LVT merely because they are important.

## Canonical LVT Identifier and Presentation Convention

LVT objects use semantic, type-explicit, grep-able identifiers:

- `LVT-VISION-*`
- `LVT-GOAL-*`
- `LVT-BET-*`
- `LVT-INIT-*`
- `LVT-EXP-*`
- `LVT-DIRECTION-*`

The semantic identifier is the canonical identifier. Legacy identifiers such as `G1`, `A1`, `C3`, `K3`, `O2`, `L1`, `N1`, and `X4` remain historical aliases for traceability in older journal, discovery, parking-lot, and issue material; they are not the preferred vocabulary for new work.

Parentage is expressed by indentation in the canonical tree rather than encoded into identifiers. This keeps identifiers stable if an object later moves while preserving a low-cognitive-load human reading.

Canonical human presentation is:

> **one bullet per LVT object, one line per bullet, semantic ID + short name + concise description, indentation expressing parentage.**

---

# Canonical Lean Value Tree

- **`LVT-VISION-WHEELWRIGHT` — Wheelwright Vision** — Wheelwright is a continuously operating options-income decision system that connects evidence, choices, and consequences—helping the operator understand what is happening, what can be done, what could happen, and what actually happened.
  - **`LVT-GOAL-AWARENESS` — Understand the Situation** *(legacy `G1`)* — Continuously maintain trustworthy understanding of relevant market, portfolio, position, and evidence state; make material changes and uncertainty apparent.
    - **`LVT-BET-OBSERVATION` — Continuous Observation** *(legacy `A1`)* — Continuous observation reveals materially useful changes that periodic operator inspection misses.
      - **`LVT-INIT-OBS-HISTORY` — Observation History** — Retain selected market observations over time.
      - **`LVT-INIT-OBS-CONTEXT` — Historical Context** — Evaluate whether small historical price/volatility observations improve situational context.
      - **`LVT-INIT-OBS-TRUST` — Evidence Trust** — Make freshness, insufficiency, disagreement, and degradation explicit.
      - **`LVT-INIT-OBS-UNIVERSE` — Universe Evaluation** — Establish governed universe evaluation.
    - **`LVT-BET-POSITION` — Continuous Position Reassessment** *(legacy `A2`)* — Continuous reassessment of open positions identifies situations requiring attention earlier and more consistently.
      - **`LVT-INIT-POS-STATE` — Portfolio State** — Establish sufficiently rich lot-level portfolio state.
      - **`LVT-INIT-POS-REASSESS` — Position Reassessment** — Continuously reassess open positions against current evidence and economics.
    - **`LVT-BET-ATTENTION` — Trustworthy Significance and Attention** *(legacy `A3`)* — Explicit significance modeling can distinguish meaningful change from noise well enough that both attention and silence are trustworthy.
      - **`LVT-INIT-ATTN-MODEL` — Attention Model** — Establish an Attention/significance model.
      - **`LVT-INIT-ATTN-RECONSIDER` — Reconsideration Detection** — Use temporal observations and current state to determine whether reconsideration is warranted.
  - **`LVT-GOAL-CHOICES` — Understand the Choices** *(legacy `G2`)* — Identify the complete set of governed actions genuinely available from current state, including materially different deployment, lifecycle, and WAIT alternatives.
    - **`LVT-BET-WAIT` — WAIT as a Genuine Alternative** *(legacy `C1`)* — Treating WAIT as a first-class governed alternative improves capital-deployment decisions.
      - **`LVT-INIT-WAIT-REPRESENT` — Represent WAIT** — Represent WAIT alongside actionable alternatives.
      - **`LVT-INIT-WAIT-ACCEPTABILITY` — Acceptability Separation** — Separate absolute acceptability from relative comparison.
    - **`LVT-BET-STRATEGIES` — Broader Governed Trade Shapes** *(legacy `C2`)* — A broader governed repertoire of trade shapes improves capital deployment compared with optimizing only the current Wheel strategy set.
      - **Child hypothesis — Defined-Risk Put Spreads** — Defined-risk credit put spreads can create attractive opportunities by exchanging some premium for bounded downside.
      - **Child hypothesis — Defined-Risk Call Spreads** — Defined-risk credit call spreads can create useful income opportunities with materially different consequences from covered calls.
      - **`LVT-INIT-STRAT-NORMALIZE` — Normalize Alternatives** — Normalize strategy-specific candidates into a common Deployment Opportunity / Alternative representation.
      - **`LVT-INIT-STRAT-PRIMITIVES` — Economic Primitives** — Support reusable economic primitives for multi-leg and future trade shapes; this is also an architecture-roadmap concern.
    - **`LVT-BET-LIFECYCLE-CHOICES` — Lifecycle Alternative Comparison** *(legacy `C3`)* — Explicit comparison of lifecycle alternatives improves position-management decisions.
      - **`LVT-INIT-LIFE-COMPARE` — Compare Lifecycle Actions** — Compare HOLD, CLOSE, ROLL, and natural resolution.
      - **`LVT-INIT-LIFE-TRANSITIONS` — Lifecycle Transitions** — Represent alternatives as possible state transitions rather than only opening trades.
    - **`LVT-BET-CHOICE-OPTIONALITY` — Future Optionality in Choice** *(legacy `C4`)* — Future optionality materially affects the quality of otherwise similar choices.
      - **`LVT-INIT-CHOICE-DTE-OPTIONALITY` — Cross-Expiration Optionality** — Evaluate alternatives across expirations as different future action spaces.
      - **`LVT-INIT-CHOICE-DURATION` — Capital Duration and Flexibility** — Incorporate capital duration and resulting flexibility into comparison.
    - **`LVT-BET-CAPITAL-CHOICES` — Capital State Determines Feasible Choices** *(legacy `C5`)* — The actual feasible choice set depends materially on current capital state.
      - **`LVT-INIT-CAP-AVAILABILITY` — Capital Availability** — Establish explicit capital availability and encumbrance reasoning.
      - **`LVT-INIT-CAP-ALTERNATIVES` — Capital-Aware Alternatives** — Integrate authoritative portfolio/capital state into alternative generation.
    - **`LVT-BET-UNIVERSE` — Governed Universe Evolution** *(legacy `C6`)* — Systematically governing universe admission improves the set of genuinely deployable alternatives.
      - **`LVT-INIT-UNIVERSE-WORKFLOW` — Candidate Admission Workflow** — Create the universe candidate evaluation/admission workflow.
      - **`LVT-INIT-UNIVERSE-DISPOSITION` — Explicit Admission Disposition** — Make admission, displacement, rejection, insufficient evidence, and review explicit.
  - **`LVT-GOAL-CONSEQUENCES` — Understand the Consequences** *(legacy `G3`)* — Make consequences and tradeoffs explicit enough for deliberate, accountable decisions.
    - **`LVT-BET-CONSEQUENCE-ENVELOPE` — Consequence Envelopes** *(legacy `K1`)* — Explicit consequence envelopes improve operator decisions compared with premium/rank-centric presentation.
      - **`LVT-INIT-CONSEQUENCE-REPRESENT` — Represent Consequences** — Represent maximum gain/loss, breakeven, capital commitment, assignment/inventory consequences, and relevant conditional outcomes.
    - **`LVT-BET-COMPENSATION` — Compensation Relative to Consequence** *(legacy `K2`)* — Compensation relative to accepted capital consequence is a better measure of deployment quality than premium yield alone.
      - **`LVT-INIT-COMP-MEASURES` — Compensation/Consequence Measures** — Develop compensation-versus-consequence measures.
      - **`LVT-INIT-COMP-COMPARE` — Compare Ranking Dimensions** — Compare those measures against current ranking dimensions.
    - **`LVT-BET-CONSEQUENCE-OPTIONALITY` — Future Optionality as Consequence** *(legacy `K3`)* — Future optionality is a material consequence of a decision.
      - **`LVT-INIT-CONSEQ-OPTION-SPACE` — Future Action Space** — Expose how alternatives alter future action space.
      - **`LVT-INIT-CONSEQ-OPTION-FACTORS` — Optionality Factors** — Incorporate duration, capital lockup, adjustment possibilities, and resulting state where useful.
    - **`LVT-BET-RISK-PROFILES` — Upstream Governed Risk/Consequence Profiles** *(legacy `K4`)* — Moving risk/consequence discretion upstream into governed policy reduces state-dependent risk taking.
      - **`LVT-INIT-RISK-PROFILES` — Governed Profiles** — Establish governed consequence/risk profiles.
      - **`LVT-INIT-RISK-BOUNDARIES` — Pre-Opportunity Boundaries** — Express acceptable consequence boundaries before individual opportunities appear.
    - **`LVT-BET-LIFECYCLE-POLICY` — Precommitted Lifecycle Policy** *(legacy `K5`)* — Precommitted lifecycle policy produces more consistent decisions under pressure.
      - **`LVT-INIT-POLICY-TAKE-PROFIT` — BTC/Take-Profit Policy** — Establish governed BTC/take-profit behavior.
      - **`LVT-INIT-POLICY-ADVERSE` — Adverse-Boundary Policy** — Establish adverse-boundary rules.
      - **`LVT-INIT-POLICY-RESOLUTION` — Resolution Policy** — Establish assignment/rolling/resolution policy.
    - **`LVT-BET-EXPLANATION` — Comparative Explanation** *(legacy `K6`)* — Comparative explanations improve deliberate operator judgment as alternatives become more multidimensional.
      - **`LVT-INIT-EXPLAIN-SURVIVOR` — Explain Preferred Alternative** — Explain why the preferred alternative survives.
      - **`LVT-INIT-EXPLAIN-TRADEOFFS` — Explain Tradeoffs** — Expose material tradeoffs against plausible alternatives.
    - **`LVT-BET-ACCEPTABILITY` — Absolute Acceptability Before Fitness** *(legacy `K7`)* — Separating absolute acceptability from relative fitness reduces deployment into the best bad opportunity.
      - **`LVT-INIT-ACCEPT-GATES` — Acceptability Gates** — Establish acceptability gates before ranking.
      - **`LVT-INIT-ACCEPT-WAIT` — Preserve WAIT** — Preserve WAIT when nothing clears the gates.
    - **`LVT-BET-EXECUTION-ECONOMICS` — Preserve Economics Through Execution** *(legacy `K8`)* — Preserving intended economics through execution improves realized deployment quality.
      - **`LVT-INIT-EXEC-BOUNDARIES` — Capital-Preserving Boundaries** — Calculate capital-preserving execution boundaries.
      - **`LVT-INIT-EXEC-EXPOSE` — Pre-Handoff Economics** — Expose those boundaries before broker handoff.
  - **`LVT-GOAL-OUTCOMES` — Understand the Outcome** *(legacy `G4`)* — Reconstruct what actually happened from decision through execution and lifecycle resolution, including economic and capital consequences.
    - **`LVT-BET-LIFECYCLE-OUTCOME` — Decision-to-Resolution Lifecycle Reconstruction** *(legacy `O1`)* — Reconstructing the complete decision-to-resolution lifecycle produces more useful economic understanding than isolated transaction history.
      - **`LVT-INIT-OUTCOME-EPISODES` — Lifecycle Episodes** — Reconstruct positions as lifecycle episodes.
      - **`LVT-INIT-OUTCOME-EXECUTION` — Recommendation-to-Execution Linkage** — Link recommendation-time economics to actual execution.
      - **`LVT-INIT-OUTCOME-EVENTS` — Economic Events** — Establish chronological economic events.
      - **`LVT-INIT-OUTCOME-BASIS` — Lot-Level Basis Attribution** — Establish lot-level basis attribution.
      - **`LVT-INIT-OUTCOME-ALTERNATIVES` — Decision-Time Alternatives** — Preserve selected action and alternatives available at decision time.
    - **`LVT-BET-CAPITAL-ACCOUNTING` — Capital-Consequence Accounting** *(legacy `O2`)* — Capital-consequence accounting provides a more meaningful account of options-income performance than premium accounting alone.
      - **`LVT-INIT-CAP-ACCOUNT-STATES` — Capital State Accounting** — Track capital deployed, encumbered, released, appreciated, and eroded.
      - **`LVT-INIT-CAP-ACCOUNT-PREMIUM` — Premium/Capital Relationship** — Relate premium flows to the capital consequences that produced them.
    - **`LVT-BET-BROKER-TRUTH` — Broker-Derived Lifecycle Truth** *(legacy `O3`)* — Broker-derived execution and resolution evidence can materially improve lifecycle truth while reducing manual reconciliation.
      - **`LVT-INIT-BROKER-EVIDENCE` — Broker Execution Evidence** — Acquire broker execution evidence where practical.
      - **`LVT-INIT-BROKER-RECONCILE` — Lifecycle Reconciliation** — Reconcile intended → submitted → working → filled → resolved states.
      - **`LVT-INIT-BROKER-RESOLUTION` — Authoritative Resolution** — Derive lifecycle resolution from authoritative evidence where possible.
  - **`LVT-GOAL-LEARNING` — Improve Empirically** *(legacy `G5`)* — Use point-in-time evidence and observed outcomes to improve policy while preserving reproducibility, attribution, explanation, and governance.
    - **`LVT-BET-OUTCOME-LEARNING` — Outcomes Reveal Discriminating Ranking Information** *(legacy `L1`)* — Lifecycle outcomes can reveal ranking factors with genuine discriminatory information.
      - **`LVT-INIT-LEARN-PRESERVE` — Preserve Decision Evidence** — Preserve point-in-time evidence, recommendations, and outcomes.
      - **`LVT-INIT-LEARN-QUALITY` — Multidimensional Deployment Quality** — Define multidimensional deployment quality.
      - **`LVT-INIT-LEARN-REPLAY` — Historical Policy Replay** — Establish historical policy replay.
      - **`LVT-EXP-VOL-TRAJECTORY` — Volatility Trajectory** — Test whether volatility trajectory contributes useful discriminatory information.
      - **`LVT-EXP-PRICE-GEOMETRY` — Factual Price Geometry** — Test whether factual price geometry contributes useful discriminatory information.
      - **`LVT-EXP-CROSS-DTE` — Cross-DTE Duration/Optionality** — Test whether duration/optionality differences across expirations contribute useful discriminatory information.
    - **`LVT-BET-EXECUTION-LEARNING` — Execution Mechanics Improve Empirically** *(legacy `L2`)* — Execution mechanics can be improved empirically and independently of recommendation quality.
      - **`LVT-EXP-LIMIT-PRICING` — Limit-Order Pricing** — Experiment with limit-order pricing.
      - **`LVT-EXP-FILL-BOUNDARIES` — Fill Boundaries** — Experiment with fill boundaries.
      - **`LVT-EXP-BTC-MECHANICS` — BTC/Take-Profit Mechanics** — Experiment with BTC/take-profit mechanics.
      - **`LVT-INIT-EXEC-MEASURE-SEPARATELY` — Separate Execution Measurement** — Measure recommendation quality separately from execution quality.
    - **`LVT-BET-RISK-LEARNING` — Risk-Profile Performance Can Be Learned Empirically** *(legacy `L3`)* — Comparing realized outcomes across risk profiles can identify when paying for defined risk produces superior overall deployment quality.
      - **`LVT-INIT-RISK-LEARN-PUTS` — CSP vs Put-Spread Outcomes** — Compare CSP versus put-spread outcomes where economically meaningful.
      - **`LVT-INIT-RISK-LEARN-CALLS` — Call-Side Risk Profiles** — Compare call-side consequence profiles.
      - **`LVT-INIT-RISK-LEARN-TRADEOFF` — Premium Haircut vs Consequence** — Evaluate premium haircut against capital efficiency and realized downside.
  - **`LVT-GOAL-CONTINUITY` — Operate Continuously** *(legacy `G6`)* — Operate continuously and reliably without depending on the operator workstation or an active interface.
    - **`LVT-DIRECTION-ALWAYS-ON` — Always-On Durable Wheelwright** — Wheelwright becomes an always-on durable appliance independent of the operator workstation; this direction is already substantially accepted and is not represented as an uncertain Bet merely to make the tree symmetrical.
      - **`LVT-INIT-CONT-CLOUD` — Durable Cloud Runtime** — Establish durable cloud runtime.
      - **`LVT-INIT-CONT-BOUNDARIES` — Durable/Transient Responsibility Separation** — Separate continuous backend responsibilities from transient clients.
      - **`LVT-INIT-CONT-HEALTH` — Health and Recovery Semantics** — Establish health/degradation/recovery semantics.
      - **`LVT-INIT-CONT-BACKUP` — Durable Backup/Recovery** — Establish durable backup/recovery.
      - **`LVT-INIT-CONT-OBSERVE` — Continuous Observation/Attention** — Establish continuously operating observation/attention capability consistent with current governing boundaries.
    - **`LVT-BET-EVIDENCE-PRIORITY` — Decision-Value-Aware Evidence Acquisition** *(legacy `N1`)* — Prioritizing finite acquisition capacity by decision relevance improves the freshness of evidence that matters most.
      - **`LVT-INIT-EVID-RELEVANCE` — Expose Decision Relevance** — Expose decision/attention relevance without transferring acquisition authority.
      - **`LVT-EXP-EVID-PRIORITY` — Compare Acquisition Policies** — Compare decision-value-aware acquisition against current governed scheduling.
  - **`LVT-GOAL-ACCESS` — Operate Wherever Needed** *(legacy `G7`)* — Securely understand and appropriately interact with current decision state wherever operator attention is required.
    - **`LVT-BET-MOBILE` — Attention-First Mobile** *(legacy `X1`)* — An attention-first mobile experience delivers most of the valuable off-desktop experience without reproducing the workstation.
      - **`LVT-INIT-MOBILE-ATTENTION` — Attention/Inspection First** — Build mobile around attention and inspection.
      - **`LVT-INIT-MOBILE-QUESTIONS` — Operator-Question Topology** — Organize mobile around operator questions rather than desktop route topology.
      - **`LVT-INIT-MOBILE-STATE` — Shared Authoritative State** — Establish shared authoritative state across clients.
      - **`LVT-INIT-MOBILE-ACK` — Durable Attention Acknowledgement** — Establish durable attention acknowledgement.
    - **`LVT-BET-NOTIFICATIONS` — Material Notifications** *(legacy `X2`)* — Notifications of genuinely material attention states reduce routine checking without creating alert fatigue.
      - **`LVT-INIT-NOTIFY-PUSH` — Attention Push** — Deliver Attention states through push notifications.
      - **`LVT-INIT-NOTIFY-TRUST` — Preserve Significance and Uncertainty** — Preserve significance and uncertainty in notification decisions.
    - **`LVT-BET-REMOTE-ACTION` — Bounded Consequential Remote Action** *(legacy `X3`)* — Progressively introducing bounded consequential mobile actions provides useful remote control without weakening accountable-human governance.
      - **`LVT-INIT-REMOTE-ACK` — Non-Consequential Remote Actions** — Begin with non-consequential acknowledgement/defer workflows.
      - **`LVT-INIT-REMOTE-GOVERN` — Govern Consequential Actions** — Introduce consequential actions only behind explicit governance boundaries.
      - **`LVT-INIT-REMOTE-AUTH` — Authentication and Authorization** — Establish appropriate authentication and authorization.
    - **`LVT-BET-CONCISE-EXPLANATION` — Trustworthy Concise Explanation** *(legacy `X4`)* — Concise explanations can preserve operator trust and decision quality despite the information constraints of mobile.
      - **`LVT-INIT-CONCISE-EXPLAIN` — Compressed Decision Explanation** — Compress explanations around what changed, why it matters, current consequences, available alternatives, and comparative reasoning.

## LVT Notes Preserved from the Prior Representation

- **Vision loop** — awareness → choices → consequences → action → outcome → learning → improved awareness/policy.
- **Strategy child hypotheses** — the defined-risk put-spread and call-spread hypotheses remain hypotheses beneath `LVT-BET-STRATEGIES`; this identifier migration does not promote them into admitted strategy or durable policy.
- **Continuity architecture implications** — determine which decision responsibilities require a durable service boundary, while preserving Evidence Appliance simplicity unless demonstrated pressure requires greater infrastructure complexity.
- **Evidence-priority constraint** — `LVT-BET-EVIDENCE-PRIORITY` does not authorize scheduler changes during the current Constraint Identification investigation; acquisition authority and current behavioral invariants remain governing.
- **Learning cross-cutting enabling work** — version policy and recommendation provenance, and require controlled empirical evidence before promoting candidate ranking factors into durable policy.
- **Classification discipline** — this migration resolves naming/presentation only. Where the prior roadmap used mixed labels such as “Initiatives / experiments,” the semantic type labels above make the smallest reasonable classification needed for canonical identity; they do not themselves authorize implementation or promote exploratory evidence into policy.

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

This normalized LVT contains **28 Bets plus one established strategic direction**. The number is descriptive, not a target.

The original broad 60-proposition exploration remains valuable. Reconciliation showed that those propositions were not 60 peers: some were Bets, some Initiatives, some experiments, some architectural consequences, some requirements, and some governing principles. This roadmap preserves their useful content by placing it at the level where it naturally belongs rather than deleting it to satisfy an arbitrary Bet count.

Visible overlap across Goals is retained where the same concern has genuinely different strategic meaning. Examples include future optionality as both a property of choice (`LVT-BET-CHOICE-OPTIONALITY`, legacy `C4`) and a consequence of choice (`LVT-BET-CONSEQUENCE-OPTIONALITY`, legacy `K3`), WAIT (`LVT-BET-WAIT`, legacy `C1`) and absolute acceptability (`LVT-BET-ACCEPTABILITY`, legacy `K7`), and Attention (`LVT-BET-ATTENTION`, legacy `A3`) with remote notification (`LVT-BET-NOTIFICATIONS`, legacy `X2`). Future evidence may justify synthesis; no reduction target is imposed.

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
