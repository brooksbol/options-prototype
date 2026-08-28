# Wheelwright System Goal Hierarchy

**Status:** Foundational orientation — a recurring reasoning aid, not an implementation specification or optimization authorization.  
**Date:** August 29, 2026  
**Purpose:** Preserve the hierarchy of goals, learning loops, and constraints that should be revisited whenever Wheelwright begins significant new work.

---

## Why this foundation exists

Wheelwright can be viewed at many levels. Each level presents legitimate optimization problems, but the importance of those problems increases as the system boundary expands.

A request-rate problem can matter. Evidence freshness can matter more. Producing the right operator-facing opportunities can matter more still. Understanding what makes an opportunity economically good matters more than efficiently producing a fixed definition of a good opportunity. Ultimately, all of those concerns are subordinate to the productive-capital system and the purpose that system serves.

The danger is local optimization: improving a lower-level metric while forgetting why that machinery exists.

The governing orientation is:

> **A lower-level optimization is valuable only insofar as it improves the goal of the level above it.**

This document should therefore be reread when starting significant new architecture, optimization, policy, evidence, recommendation, risk, or portfolio work. Its purpose is to restore the system boundary before attention narrows to a particular mechanism.

---

## The hierarchy

The hierarchy is not a rigid architecture decomposition. It is a way of asking what each layer is *for*.

### Level 1 — Machinery and flow

Question:

> **Can Wheelwright's machinery efficiently transform available work into current, trustworthy evidence and usable products?**

Examples include acquisition workers, queues, pacing, provider access, persistence, evidence publication, freshness, and other factory-floor mechanics.

Theory of Constraints is directly useful here. Observe WIP, queues, utilization, blocking, starvation, throughput, and the current constraint. Improve the system constraint rather than polishing local machinery.

The August 2026 Tradier/WIP investigation lives primarily at this level. Its importance is real but instrumental. Tradier utilization is not Wheelwright's ultimate goal.

### Level 2 — Product / widget supply

Question:

> **Is scarce factory capacity being spent producing the widgets that are useful to operators?**

An operator-facing opportunity can be treated as a product of the factory. SPY at 7 DTE and DBO at 22 DTE are different possible widgets. Technical producibility does not imply equal production obligation.

This introduces production economics:

- which widget families merit full production;
- at what cadence and fidelity;
- where production effort can be reduced without materially harming operator value;
- whether cheap sensing can preserve awareness while expensive production is concentrated elsewhere;
- how observed operator demand should eventually inform factory scheduling.

This is not authorization for demand-aware scheduling. It is the higher-level reason such a policy may eventually matter.

### Level 3 — Decision quality / what constitutes a good deal

Question:

> **Is Wheelwright getting better at distinguishing genuinely attractive compensation from merely attractive-looking compensation?**

This is a continuous-learning problem.

A good deal is not synonymous with high premium. Premium is compensation for accepting some burden. The Goldman Sachs put-selling research and Wheelwright's subsequent entry-mechanism analysis sharpened the governing idea:

> **Risk is not failure. Uncompensated or misunderstood risk is failure.**

The definition of a good deal should therefore remain empirical, falsifiable, and capable of becoming richer as evidence accumulates.

Possible dimensions include, without presuming a final formula:

- compensation;
- realized and implied risk;
- fundamental or structural quality of the resulting ownership state;
- strike/delta/DTE relationships;
- liquidity and execution quality;
- capital commitment and duration;
- capital velocity;
- concentration and portfolio interaction;
- lifecycle consequences;
- erosion and drawdown behavior;
- market regime;
- subsequent realized outcomes.

These are candidate explanatory dimensions, not authorization for a composite risk score or a fixed ranking model.

The long-run objective is not to freeze today's definition of a good deal and make Wheelwright extraordinarily efficient at finding it. It is to build a system capable of **continuously improving its understanding of what a good deal is**.

### Level 4 — Portfolio / productive-capital system

Question:

> **What capital and liquidity structure can sustainably convert available market opportunity into required cash flow while keeping erosion, drawdown, concentration, liquidity risk, and other capital consequences within acceptable bounds?**

At this level the unit of analysis is no longer the individual trade.

A standalone attractive opportunity may be a poor deployment for the portfolio that receives it. Conversely, apparently lower production may be rational when it preserves liquidity, selectivity, resilience, or future productive capacity.

The important variables begin to interact:

```text
productive capital
    <-> required cash flow
    <-> sustainable production rate
    <-> tolerated risk / capital impairment
    <-> liquidity and selectivity
```

This creates an important hypothesis about capital sufficiency.

More productive capital and adequate liquidity may reduce the production rate that must be extracted from each unit of capital. Lower production pressure may allow Decision to reject marginal bargains. Greater selectivity may reduce erosion or undesirable capital states. Better capital preservation then supports future production.

The reverse feedback loop may also exist:

```text
insufficient productive capital
    -> greater production pressure
    -> weaker selectivity
    -> acceptance of poorer compensation or consequences
    -> greater erosion / impairment risk
    -> less productive capital
    -> still greater required production pressure
```

These are system hypotheses to test, not established quantitative laws.

Cash is therefore not automatically idle waste. Some amount of liquidity may create the temporal and decision slack that permits WAIT rather than forcing marginal deployment.

An eventual portfolio-level design question is:

> **What is the minimum productive-capital and liquidity structure that allows the system to meet its cash-flow requirement while retaining enough selectivity that capital degradation and risk remain within the operator's tolerance?**

Wheelwright does not yet possess enough evidence to answer that question authoritatively. Preserving the question is the point.

### Level 5 — Household / mission

Question:

> **What must the productive-capital system accomplish for the household it ultimately serves?**

At the widest currently useful boundary, portfolio production is instrumental rather than terminal. The productive-capital system exists to support required consumption/cash flow while preserving enough future productive capacity, resilience, and optionality to continue doing so.

This means neither premium, trade count, utilization, recommendation count, nor even nominal portfolio production is the ultimate objective.

A useful high-level formulation is:

> **Determine and maintain a productive-capital system capable of sustainably supporting required household cash flow while preserving the capital characteristics and risk profile the operator is willing to accept.**

The exact household requirement, inflation treatment, time horizon, erosion tolerance, liquidity requirement, and acceptable risk envelope are empirical/governance questions rather than constants supplied by this foundation.

---

## The nested dependency

Read upward:

```text
machinery produces evidence efficiently
        ↓
factory produces useful widgets
        ↓
Decision recognizes well-compensated opportunities
        ↓
portfolio converts opportunities into sustainable production
        ↓
household receives required cash flow while productive capacity is preserved
```

Read downward, each higher level supplies purpose and constraints to the level below it:

```text
household mission
        ↓
portfolio production / risk / liquidity requirements
        ↓
definition of acceptable and attractive deals
        ↓
operator demand for particular widgets
        ↓
factory production priorities and machinery requirements
```

This bidirectional relationship matters. Lower layers provide capability and evidence upward. Higher layers provide meaning and priorities downward.

---

## Goldratt and Senge

Wheelwright increasingly exhibits two coupled improvement loops.

### Goldratt / Theory of Constraints

```text
observe flow
    -> identify the current system constraint
    -> exploit / subordinate / elevate as warranted
    -> observe the moved constraint
    -> repeat
```

This prevents effort from being consumed by local optima that do not improve system throughput toward the goal.

### Senge / learning-system orientation

```text
observe outcomes
    -> examine the mental model that produced the decisions
    -> learn from discrepancies and consequences
    -> revise the model
    -> behave differently
    -> observe new outcomes
```

This prevents Wheelwright from efficiently optimizing a definition of success that evidence has shown to be incomplete or wrong.

The loops reinforce each other:

```text
improve system flow
    -> obtain richer / more reliable observations
    -> learn more about opportunity, risk, and consequence
    -> improve the mental model of a good deal
    -> change which products and decisions matter
    -> change factory demand and flow
    -> expose a new constraint
    -> improve again
```

A useful discipline follows:

> **Senge prevents Wheelwright from optimizing a system whose underlying mental model is wrong. Goldratt prevents Wheelwright from endlessly improving its mental model without improving the system.**

Neither name is intended as doctrinal authority. The useful point is the coupling of constraint-focused improvement with explicit learning and revision of the models that define value.

---

## Evidence is what allows the hierarchy to learn

This hierarchy strengthens, rather than replaces, Wheelwright's evidence-first architecture.

The system cannot improve its definition of a good deal if it remembers only the opportunities selected by today's definition of good. It cannot learn whether apparent compensation was adequate if it fails to retain contemporaneous risk, execution, market, and capital-state facts. It cannot improve portfolio policy if lifecycle consequences disappear after a trade closes.

Therefore:

> **Persist cheap, policy-neutral, irreconstructible facts; derive changing interpretations from them later.**

This is why historical evidence is not merely reporting infrastructure. It is part of Wheelwright's capacity to improve its own mental models.

The test is not simply whether Wheelwright can explain today's recommendation. The stronger test is:

> **Can future Wheelwright use today's preserved evidence to discover that today's definition of a good deal was incomplete?**

---

## Local optimization warning

The hierarchy should be invoked whenever a proposed improvement has an attractive local metric.

Ask:

1. What level of the hierarchy is this change optimizing?
2. What is the goal of that level?
3. What higher-level goal is that goal serving?
4. Is the proposed metric causally useful to that higher-level goal, or merely easy to measure?
5. Could improving the local metric make the higher-level system worse?
6. What evidence would tell us?

Examples:

- More Tradier requests are useful only if additional request throughput improves the evidence/products the system needs.
- More widgets are useful only if they improve the operator's decision space.
- More premium is useful only if it is adequate compensation for acceptable consequences.
- More production is useful only if it remains sustainable relative to capital impairment and portfolio constraints.
- More portfolio income is useful only insofar as it serves Mission without destroying the productive capacity needed for future Mission.

---

## Relationship to current work

This foundation does **not** supersede `docs/39-constraint-identification-restart-plan.md`.

The current empirical investigation remains intentionally narrow: identify the current system constraint through direct factory-floor measurement. Herbie has not yet been identified. The Tradier/WIP hypothesis must be tested without jumping into solution space.

This hierarchy explains **why** that narrow investigation matters and, equally importantly, why it must not be mistaken for the ultimate objective.

Likewise, `docs/40-demand-aware-widget-production-hypothesis.md` is one downstream hypothesis within Level 2, while `docs/38-entry-mechanism-risk-compensation-finding.md` and the Goldman research it interprets are important inputs to Level 3. Neither individually describes the whole system hierarchy.

---

## Revisit protocol

Revisit this foundation:

- at the start of a major new Wheelwright initiative;
- before optimizing a prominent operational metric;
- when a new risk dimension or research finding changes the meaning of a good deal;
- when historical evidence contradicts current policy assumptions;
- when portfolio or household requirements materially change;
- when a TOC constraint appears to move to a different layer of the system;
- whenever work becomes technically compelling but its relationship to Mission is unclear.

The purpose is not ceremonial review. It is to ask again:

> **What system are we optimizing, what is its goal at this boundary, and what higher-level purpose makes that goal matter?**

If those answers are unclear, narrow implementation work should pause until the system boundary is understood.

---

## Non-authorization

This foundation does not authorize:

- a portfolio optimizer;
- automated trading;
- a new risk score;
- a change to recommendation ranking;
- demand-aware scheduling;
- universe pruning;
- changes to DTE/delta policy;
- changes to evidence freshness contracts;
- a fixed household withdrawal rule;
- a fixed capital requirement;
- a declaration of the current Herbie.

It establishes a durable orientation for discovering those answers empirically and governing them deliberately.