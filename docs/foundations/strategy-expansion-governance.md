# Strategy Expansion Governance

**Date:** August 2026
**Status:** Exploratory architectural governance — scope hypothesis under evaluation

---

## Purpose

This document establishes Wheelwright's strategy scope boundary and the framework for evaluating candidate strategies. It defines what the system currently operates, what it is studying, and what is currently out of scope.

The boundary principle and evaluation framework are hypotheses informed by architectural reasoning. They become governing constraints only after repeated strategy analysis confirms them.

---

## Architectural Admission Test

A strategy should earn admission by serving governed portfolio/capital transformations and should not require predictive reasoning where present evidence, explicit policy, and mechanical-consequence reasoning suffice.

This test emerges from Policy over Prediction — but is not reducible to "no prediction ever." The governing principle states: "don't use prediction where policy would suffice." A strategy that inherently *requires* the operator to predict market direction in order to justify entry fails the test. A strategy that can use some predictive input as supplementary evidence while remaining governable through policy and consequence reasoning does not automatically fail.

Beyond prediction, additional architectural criteria apply:

- **Capital-state model:** The strategy should operate within Wheelwright's bounded, fully-collateralized capital-state model. Strategies requiring unbounded risk exposure or synthetic leverage conflict with the system's identity.
- **Lifecycle governability:** The strategy's lifecycle (entry, operation, resolution) must be expressible within Wheelwright's existing governance and monitoring infrastructure without requiring fundamentally different lifecycle semantics.
- **Consequence enumerability:** The strategy's mechanically determined resolution states must be enumerable so that governance can reason about all of them, not merely the expected-value path.

A strategy passes this test when:

1. Its resolution states are enumerable and mechanically determined (not contingent on forecasting).
2. The operator's decision can be framed as governance of acceptable consequences rather than a bet on direction.
3. The strategy serves a portfolio need (income production, protection, lifecycle management) that is expressible within the current Situation/Regime framework.
4. Evidence required to evaluate it is observable from the current environment (not a model of the future).
5. It operates within the bounded/collateralized capital-state model.

A strategy fails this test when:

1. Profitability depends on correctly predicting a narrow range of future prices, and no policy/consequence framing suffices.
2. The operator must hold a directional view to justify entry.
3. Risk is unbounded or requires prediction-based hedging to manage.
4. The strategy optimizes terminal P&L rather than governing capital-state transformations.
5. Its lifecycle complexity exceeds what the existing governance and monitoring architecture can express.

---

## Current Operational Strategy Set

These are implemented, tested, and in active use:

| Strategy | Capital Model | Production Sources | Status |
|---|---|---|---|
| Cash-Secured Put (CSP) | Strike x 100 secured | Premium (immediate) | Implemented |
| Covered Call (CC) | Shares already owned | Premium (immediate) | Implemented |
| Buy-Write | Price x 100 invested | Premium + conditional appreciation | Implemented |

Buy-write is explicitly recognized as a distinct entry mechanism within the Cash-Flow Operating Regime, not merely a combination of purchase and covered call.

---

## Candidate Strategies Under Study

These have survived initial conceptual screening but have not yet undergone full four-lens evaluation. None should be implemented before that analysis is complete.

### Rolling Existing Positions

**Existing architectural seeds:** PL-EXEC-01 describes trade lifecycle evolution through "filled → assigned → closed/rolled" and connects to overlay strategy (roll/take-profit). PL-ARCH-02 names lifecycle management including roll/take-profit/hold as part of situation-governed deployment strategy.

**What is new:** Treating rolling as a candidate strategy/lifecycle operation that must undergo four-lens analysis and potentially participate in Deployment fitness. The existing parking-lot items identify rolling as a lifecycle *capability*; the question now is whether it also has strategy-level decision semantics (when to roll vs. take assignment vs. close).

**Initial architectural assessment:** Rolling does not require prediction. It governs: "Given that expiration approaches and assignment consequences have changed, is extending the obligation at different terms preferable to accepting the current resolution?" This is consequence governance, not forecasting.

### Protective Puts

**Architectural tension:** A protective put *spends* production capacity to purchase protection. This is fundamentally different from CSP/CC/buy-write, which *generate* production. Under the current cash-flow production regime, the mission is "sustain realized production while preserving productive capacity."

**Open question:** Does "preserving productive capacity" encompass spending current production to protect capital from erosion? Or does protective action require a different Situation/Mission frame (e.g., capital preservation regime)?

**Initial architectural assessment:** A protective put can be framed without prediction: "The consequences of this inventory declining below this price are unacceptable given current portfolio state and mission." That is governance, not forecasting. But its *fitness* under the cash-flow production regime requires Situation/Regime reasoning — it serves Preserve Optionality and capital preservation, potentially at the cost of Earn Proportional Compensation.

### Collars

**Architectural tension:** Combines production (covered call) and protection (protective put) on the same inventory. The collar's net cost may be zero or near-zero if call premium offsets put cost.

**Open question:** Is a collar a *single strategy* or a *composition of two strategies* that the Deployment surface should reason about independently? Does the zero-cost collar deserve distinct treatment because it preserves production while adding protection?

**Initial architectural assessment:** Like protective puts, collars can be framed as consequence governance. The operator accepts bounded upside (call) in exchange for bounded downside (put). No prediction required. The question is fitness within the current regime, not architectural admissibility.

### Fully-Collateralized Two-Sided Position (CSP + CC on Same Underlying)

**Architectural tension:** Economically equivalent to selling a covered call AND a cash-secured put simultaneously on an underlying already owned. Requires careful terminology — Fidelity's formal "covered strangle" definition and permission model may not be identical to this fully-collateralized construct.

**Open questions:**
- What does Fidelity call this? What permission level is required?
- Is this one strategy or two independently-governed positions that happen to coexist?
- Does the architecture need a composition primitive, or is it sufficient that CSP and CC recommendations can independently apply to the same underlying?

**Initial architectural assessment:** Each leg independently passes the admission test. The composition question is whether the system should *recognize* and *govern* the combined position as a unit, or whether it emerges naturally from independent CSP + CC recommendations.

---

## Currently Out of Scope (Absent Architectural Reconsideration)

These have failed the current conceptual screen. They are removed from the roadmap but not permanently prohibited — future architectural reasoning could revisit them.

| Strategy | Reason for Current Exclusion |
|---|---|
| Credit spreads (bull put, bear call) | Profitability depends on predicting a price range. Defined-risk, but the decision to enter requires a directional or range-bound view. Shifts toward terminal P&L optimization. |
| Diagonals / poor man's covered calls | Combines temporal and strike-distance speculation. Requires prediction of price path, not merely acceptable outcomes. |
| Iron condors | Explicitly a range-bound prediction strategy. Profit requires the underlying to remain within a predicted range. |
| Butterflies | Precision prediction of a specific price target at expiration. |
| Naked short strategies | Unbounded risk requires prediction-based risk management. Fundamentally incompatible with "the system does not predict market direction." |

**Why these fail:** These strategies fail the admission test for overlapping but distinct reasons:

- **Prediction dependence:** Credit spreads, iron condors, and butterflies require the operator to predict a price range or target. Their profitability is contingent on a directional or range-bound view that policy/consequence reasoning cannot replace.
- **Capital-state model conflict:** Naked strategies create unbounded risk exposure that is incompatible with the bounded, fully-collateralized capital-state model Wheelwright governs.
- **Lifecycle complexity:** Diagonals introduce synthetic inventory, temporal leg management, and path-dependent decision points that exceed what the current governance architecture can express without fundamental redesign.
- **P&L optimization identity:** Collectively, these strategies shift Wheelwright toward an options P&L prediction/optimization system rather than a system governing useful transformations of cash and inventory.

**Not permanent:** If future analysis discovers a framing where any of these serves consequence-governance within the bounded capital-state model without requiring prediction as the primary decision driver, the boundary should be revisited. The admission test, not this list, is the governing constraint.

---

## Four-Lens Evaluation Framework

Before implementing any candidate strategy, it must be understood through four lenses:

### Lens A: Problem / Role

- What portfolio need does the strategy address?
- What capability is missing from the current set (CSP, CC, buy-write) that makes it necessary?
- How does it complement rather than duplicate existing strategies?
- Under what Situation/Regime does this need arise?

### Lens B: Mechanics

- What positions are opened?
- What capital/collateral is required?
- What premiums or costs are involved?
- What happens at assignment and expiration?
- What are the mechanically determined resolution states?
- What are the sources of gain and loss?
- What are the important failure or adverse cases?

The operator requires substantially deeper understanding of each unfamiliar strategy before implementation.

### Lens C: Composition

How does the strategy interact with:

- Cash positions and deployable capital
- Share inventory
- Existing CSPs, covered calls, buy-writes
- Other open option obligations
- Cost basis
- Exposure and concentration
- Other candidate strategies

The portfolio is a system, not a collection of isolated positions.

### Lens D: Decision Criteria and Wheelwright Implementation

- When should this strategy be used *instead of* another available strategy?
- What observable decision criteria distinguish when it fits vs. when alternatives fit better?
- What does Wheelwright need: evidence, portfolio state, calculations, governance, lifecycle management, recommendation logic, visualization?

The desired eventual behavior: Wheelwright can recommend which strategies fit the current situation, or present a narrowed set ranked by fitness.

---

## Relationship to Deployment Opportunity

The Deployment Opportunity concept (PL-DEPLOY, accepted architectural direction) already anticipates normalizing strategy-specific candidates into mission-aware portfolio actions. Strategy expansion deepens what "Deployment Opportunity" must eventually reason about:

- **Portfolio need** — What does the portfolio require? (idle cash, inventory income, protection, lifecycle attention)
- **Strategy eligibility** — Which strategies can mechanically serve that need given current state?
- **Consequence acceptability** — Are the resolution states of eligible strategies permitted by governance?
- **Strategy fitness** — Among acceptable alternatives, which best addresses the current need?
- **Contract fitness** — Within the selected strategy, which implementation is best?

This narrowing model refines the already-ratified direction. It does not create a new subsystem.

The critical decision rule: **Eligibility and acceptability prune. Fitness ranks only what survives. Relative superiority is insufficient — the best opportunity on a bad board may still be WAIT.**

---

## Relationship to Governing Principles

| Principle | Relationship |
|---|---|
| Policy over Prediction | The admission test. Every admitted strategy must be governable through policy/consequence reasoning. |
| Preserve Optionality | Protective strategies serve this principle. Tension: they may cost production capacity. |
| Earn Proportional Compensation | Income-producing strategies serve this. Must not be the only consideration. |
| Respect Uncertainty | Strategies requiring narrow prediction fail the admission test. |
| Execute with Discipline | Applies equally to all strategies (execution quality, liquidity). |
| Avoid Concentration | Strategy diversity is itself a form of diversification. |
| Observe Before Acting | Four-lens analysis before implementation. |

---

## Open Questions

1. **Fidelity permissions:** What options strategies does the operator's current Fidelity approval level permit? Which candidates require elevated permissions? What does Fidelity call the fully-collateralized two-sided position?

2. **Regime fit:** Do protective puts and collars fit the current cash-flow production regime, or do they require a capital-preservation or risk-management situation to justify their use of production capacity?

3. **Rolling semantics:** Is rolling a strategy (with its own fitness evaluation) or a lifecycle operation (always available as an alternative to assignment/expiration)? Can it be both?

4. **Composition:** Does the architecture need a first-class "composed position" concept, or do independently-governed legs on the same underlying suffice?

5. **Strategy fitness without universal score:** How should strategy-level fitness be expressed? The existing posture system (ACTIONABLE/EDGE/WAIT) operates at contract level. Strategy-level fitness may need different vocabulary or mechanics.

6. **Absolute deployment threshold:** What determines "the board is too poor to deploy"? Is this a minimum Production v0, a minimum execution score, a governance gate, or something else? Must be discovered empirically, not declared arbitrarily.

---

## Maturation Path

```
Current:  Exploratory hypothesis under evaluation
    ↓     (Perform four-lens analysis on each candidate)
Next:     Validated scope boundary with analyzed candidates
    ↓     (Operating experience confirms or revises the boundary)
Future:   Governing architectural constraint (if evidence warrants)
```

---

*This document does not authorize implementation of any candidate strategy. It preserves architectural discovery and establishes the evaluation framework for future work.*
