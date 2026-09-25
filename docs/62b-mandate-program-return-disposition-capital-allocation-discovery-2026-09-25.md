# Mandate, Program, Return Disposition, and Capital Allocation — Discovery Checkpoint

**Date:** September 25, 2026  
**Status:** Discovery / reconciliation input; **not ratified architecture, ontology, policy, implementation authority, or trading advice**  
**Checkpoint lineage:** immediate descendant of `docs/62a-wheel-strategy-research-report-2026-09-25.md`, with accepted `main` verified at `7ca371cba02020b5c15f34ede5b0ecbbe418fa14` before mutation  
**Related:** `docs/58-wheelwright-semantic-model-v1.md` (`PL-SEM-01`), `docs/61-inner-game-governed-prescriptive-decision-discipline-2026-09-24.md`, `docs/62-paper-execution-methodology-laboratory-4am-checkpoint-2026-09-25.md`, `docs/62a-wheel-strategy-research-report-2026-09-25.md`

---

## 1. Purpose

Preserve a coherent discovery thread that emerged from the Wheel research and subsequent Principal discussion before semantic reconciliation changes its shape or conversational context is lost.

The current specialized semantic model already distinguishes, among other concepts:

- Capital Boundary;
- Capital Pool;
- Portfolio Mandate;
- Inventory Role;
- Operating Program;
- Policy Rule;
- Constraint;
- Preference;
- Situation;
- Regime;
- Economic Attribution.

It also states that portfolio topology is an **association topology, not a containment tree**.

This checkpoint therefore does **not** ratify new ontology. It records hypotheses and semantic pressure to be reconciled against incumbent authority.

---

## 2. Central discovery

> **Program performance cannot be evaluated independently of the purpose assigned to the capital. A Portfolio Mandate defines not only the operating purpose and acceptable sacrifices for capital governed by it, but may also expose attributes by which that capital scope participates in higher-level portfolio allocation.**

A second formulation captures the accounting boundary:

> **A Mandate should not change the accounting meaning of an economic result; it changes whether that result and the sacrifices required to produce it satisfy the purpose for which the capital was governed.**

A third formulation captures the candidate two-sided Mandate model:

> **A Portfolio Mandate may have both downward-facing operating semantics and upward-facing portfolio-applicability semantics: it governs capital allocated to its scope while also exposing the attributes needed for higher-level capital-allocation decisions.**

These are discovery hypotheses, not accepted semantic definitions.

---

## 3. Mandate and Operating Program are orthogonal

The discussion produced the following useful specimens:

- **PTS → Income Mandate + Wheel Operating Program**
- **Sawdust Roth → Growth / Compounding Mandate + Wheel Operating Program**

The semantic point is not that these bindings are already governed project state. The point is that purpose and recurring method are different dimensions.

- **Portfolio Mandate** answers why a governed capital or inventory scope exists and what it is intended to accomplish.
- **Operating Program** describes a durable governed purpose/process spanning positions or cycles.
- **Regime** remains a separate operating/accounting/policy context and must not be used as a synonym for Mandate.
- A construction such as a covered call remains an economic construction rather than becoming the Mandate or Program.

This separation permits the same Program family to be considered under different purposes without silently renaming those purposes as strategies.

---

## 4. Mandate governs required outcomes and acceptable sacrifices

A Mandate appears to need semantics for more than a preferred output. It may also define which sacrifices are acceptable in obtaining that output.

### Capital erosion specimen

Suppose a governed capital scope distributes cash while its capital base declines.

Three meanings must remain distinct:

1. **Capital erosion** — an economic observation / attribution.
2. **Capital-erosion tolerance** — a governed purpose/constraint applicable to the capital scope.
3. **Mandate evaluation** — whether the observed erosion is permitted, excessive, expected, or inconsistent with the purpose assigned to that capital.

The ontology must not encode `capital erosion = bad` universally.

An Income Mandate might require distributions while allowing only bounded erosion. A decumulation-oriented Mandate could deliberately permit consumption of principal. A liquidity/resilience Mandate might tolerate essentially none. Those are different purposes applied to economic facts whose accounting meaning should remain stable.

This suggests the broader hypothesis:

> **A Mandate defines required outcomes and acceptable sacrifices.**

The exact representation of those requirements remains open.

---

## 5. Distribution is not income; cash generation is not total return

The research comparison exposed an important analytical problem.

Conventional strategy comparison commonly emphasizes total return, compound return, volatility, Sharpe ratio, drawdown, or terminal wealth. Those measures remain economically important, but a comparison can silently assume that retained/reinvested terminal wealth is the governing objective.

A Mandate may instead require current distributions.

That does **not** make cash-form return intrinsically more valuable than appreciation. A dollar of option premium is not economically superior to a dollar of appreciation merely because it arrives as cash.

Likewise:

> **Distribution ≠ income.**

A withdrawal describes where cash went. It does not establish where the distributed value came from economically. A distribution can be funded by:

- economic production;
- realized appreciation;
- principal/capital consumption;
- some combination.

Wheelwright should preserve those distinctions rather than relabel every distribution as income.

---

## 6. Return disposition is a missing analytical dimension

The discussion identified a semantic requirement concerning what happens to economic value after it is produced or realized.

Possible dispositions include:

- retained within the governed capital scope;
- reinvested;
- distributed externally;
- used to replenish another governed capital scope;
- reallocated to another Mandate;
- used to maintain a governed capital floor.

The phrase **Return Disposition** is useful discovery vocabulary but is **not promoted here as a new canonical entity or primitive**.

The important separation is:

> **economic return → disposition of economic value → mandate fulfillment**

Total economic return must remain total economic return. Disposition must not be used to inflate or redefine it.

---

## 7. Mandate fulfillment is distinct from total-return ranking

Two statements may both be true:

- Program A produced greater total economic return.
- Program B satisfied a particular Income Mandate more effectively.

There is no contradiction if the Mandate requires outcomes beyond maximizing terminal wealth.

But this creates an important experimental control. An income-producing program should not automatically be compared only against undisturbed buy-and-hold. A stronger comparison may require the alternative total-return program to face the **same distribution requirement and the same capital-erosion policy**.

For example:

> Compare an income-producing program against buy-and-hold plus matched systematic withdrawals, while preserving the same initial capital, required distributions, erosion tolerance, and relevant risk constraints.

This prevents the form in which return arrives from being mistaken for an economic advantage.

The research question therefore becomes closer to:

> **Given the same initial capital and the same required disposition of economic value, which program better fulfills the governing Mandate, at what cost to capital, risk, liquidity, and future optionality?**

That is not a claim that one program will win.

---

## 8. Program configuration versus Program mutation

The Wheel research found that the named Wheel cycle is materially under-specified until strike policy, tenor, management rules, assignment behavior, restart conditions, sizing, and exceptions are declared.

This creates a candidate distinction:

1. **Program invariant** — changing it may change Program identity.
2. **Program parameter** — legitimate configuration within the same Program.
3. **Mandate-driven parameter policy** — uses purpose/preferences to resolve permitted latitude.
4. **Program/Mandate incompatibility** — the Mandate requires behavior outside the Program's legitimate configuration surface.

The governing hypothesis is:

> **Mandate may order choices within latitude the Operating Program genuinely permits; Mandate does not grant authority to rewrite the Operating Program.**

This is important because an earlier conversational tendency toward a “hybrid” or compromise Wheel can now be understood as a failure mode: a desired outcome pressures the reasoning process to invent a quasi-program on the fly.

If Program A prescribes A and the operator chooses B, the system should preserve that disagreement rather than synthesize A½ merely to make the Program appear aligned with operator preference.

Repeated justified departures may become evidence for deliberate Program revision or a different Program. They should not retroactively change the Program that governed the original decision.

---

## 9. Candidate deterministic baseline

The deterministic comparison baseline therefore appears to require more context than:

`Position + Wheel → Recommendation`

A working discovery hypothesis is closer to:

`Governed Capital Scope + Mandate + Operating Program + Permitted Program Configuration + Applicable Regime / Policy / Constraints / Preferences + Frozen Evidence → Alternatives → Recommendation + Rule Trace`

This expression is **not architecture** and does not establish required runtime objects.

Its value is explanatory: a reproducible “by-the-book” answer must be bound to the purpose, Program, configuration, context, and evidence that actually governed the decision boundary.

That baseline can later support comparison with operator behavior without allowing outcome hindsight to rewrite the prior prescription.

---

## 10. Program adherence remains distinct from Program quality

The Hourglass-derived research thesis is not:

> Wheel is better.

Nor is it:

> Following rules is always better.

The sharper experimental questions are:

1. Did the operator follow the selected Operating Program?
2. How well did the Operating Program serve the Portfolio Mandate?
3. How should the Program be configured for different Mandates without changing its identity?
4. When does adapting the Program to a Mandate cross the boundary into a different Operating Program?
5. What economic result occurred?
6. How was that result disposed?
7. Did the combination fulfill the governing Mandate?

At minimum, future analysis should resist collapsing:

- Program quality;
- Program adherence;
- execution quality;
- economic outcome;
- disposition of economic value;
- Mandate fulfillment.

A profitable departure can remain a departure. A loss-producing FOLLOW can remain faithful to the Program. Neither observation settles whether the Program itself was good.

---

## 11. Portfolio-level implication

Zooming out from account-level specimens suggests a larger capital-allocation model.

Illustrative capital scopes might perform different jobs:

- liquidity / resilience;
- income production;
- growth / compounding.

These are **specimens**, not a ratified three-layer portfolio hierarchy.

The important discovery is that different governed capital scopes can carry different Mandates, and therefore different:

- required outcomes;
- liquidity requirements;
- acceptable erosion;
- drawdown tolerance;
- distribution expectations;
- capacity;
- surplus/deficit semantics;
- compatible Programs or Program configurations.

A higher-level portfolio allocation policy could then reason about movement of capital among differently mandated scopes without needing to understand the mechanics of every underlying option position.

Conceptually:

`Portfolio purpose → allocation policy → governed capital scopes / Mandates → Operating Programs → decisions / executions → economic results → disposition → allocation state`

This is deliberately **not** asserted as a containment hierarchy. Incumbent semantic authority describes portfolio topology as an association topology.

---

## 12. Two-sided Portfolio Mandate hypothesis

The latest synthesis is that Portfolio Mandate may need to participate in reasoning in two directions.

### Downward-facing operating governance

For capital already bound to the Mandate, it may express:

- purpose / required outcomes;
- constraints;
- preferences;
- acceptable sacrifices;
- liquidity requirements;
- distribution requirements;
- erosion tolerance;
- compatible Program/configuration requirements.

### Upward-facing portfolio applicability

For higher-level capital allocation, the governed scope may need to expose information such as:

- whether the Mandate is under- or over-capitalized;
- minimum useful allocation;
- capacity for additional capital;
- capital floor;
- surplus condition;
- replenishment need;
- liquidity profile;
- distribution obligation;
- acceptable erosion envelope;
- conditions under which capital can leave the scope.

The exact attributes are illustrative and require reconciliation.

A concise hypothesis is:

> **A Portfolio Mandate defines both the governance of capital allocated to it and the attributes by which that Mandate participates in higher-level portfolio allocation.**

---

## 13. Allocation feedback must not become uncontrolled policy mutation

Economic results can inform future allocation without automatically changing the Mandate or Operating Program that produced them.

For example, if an Income scope experiences erosion within its authorized tolerance, that fact need not imply immediate Program revision. If a Liquidity scope exceeds its required floor, surplus capital may become eligible for reallocation if portfolio policy permits it.

The desired conceptual separation is:

- **within a governed scope:** Mandate governs purpose and admissible operation;
- **across governed scopes:** portfolio allocation policy governs movement of capital;
- **between experimental/program epochs:** deliberate governance may revise Mandates, Programs, or configurations.

Execution-time discomfort should not silently become methodology development or portfolio-policy mutation.

---

## 14. Research implication

The proposed follow-up research on precommitment, Program adherence, principled override, and deliberate revision should include an additional dimension:

> **How should rule-governed programs be evaluated when different governing purposes require different dispositions of economic return?**

A particularly important adversarial control is:

> **Where an Income Mandate requires distributions, compare income-producing programs against total-return programs subjected to equivalent withdrawals rather than assuming that the form in which return arrives has intrinsic economic value.**

Research should distinguish:

- total economic return;
- timing and form of cash flows;
- distribution policy;
- capital preservation / erosion;
- risk and drawdown;
- liquidity;
- mandate fulfillment.

This extension should not tell an independent researcher that Wheelwright's proposed semantic solution is correct.

---

## 15. Explicit non-decisions

This checkpoint does **not** authorize or ratify:

- a new `ReturnDisposition` entity or primitive;
- a hierarchical Mandate architecture;
- a fixed three-layer portfolio model;
- a Mandate scoring engine;
- a questionnaire/configurator UI;
- numeric objective functions;
- an Income-specific or Growth-specific Wheel strike rule;
- the proposition that Wheel is superior for income;
- the proposition that cash-form returns are economically superior to appreciation;
- a new Operating Program;
- a new Portfolio Mandate identity;
- a new Regime identity;
- implementation work;
- changes to `docs/58-wheelwright-semantic-model-v1.md`;
- changes to ratified Portfolio Capital / Production accounting semantics.

The discovery is preserved specifically so those questions can be reconciled deliberately rather than answered implicitly in implementation.

---

## 16. Questions for semantic reconciliation

1. Does incumbent authority already support a Portfolio Mandate carrying both operating-purpose semantics and portfolio-applicability semantics, or is another association/assertion concept required?
2. Is “return disposition” already represented adequately by existing accounting flow / capital movement semantics?
3. Where should capital-erosion tolerance live: Mandate, Constraint, Policy Rule, or a governed association among them?
4. How should Mandate requirements and Preferences affect Program configuration without mutating Program identity?
5. What establishes the invariant boundary between Program configuration and a new Operating Program?
6. How should Program/Mandate incompatibility be represented?
7. Can portfolio-level allocation policy operate over Capital Pools / Boundaries / Mandates without creating a containment hierarchy?
8. Which upward-facing allocation attributes belong to the Mandate itself versus assertions about the currently governed capital scope?
9. How should required distributions be represented without conflating cash flow, Production, realized appreciation, and capital consumption?
10. Which concepts are primitive, which are assertions/associations, and which are derived evaluations?
11. How should Mandate fulfillment be evaluated without redefining total economic return?
12. Which parts of this discovery belong in `PL-SEM-01`, existing Portfolio Capital / Production authority, an existing parking-lot item, or a genuinely new intake identity?

---

## 17. Preservation boundary

This document is a **snapshot of developed discovery**.

It exists because losing the distinctions above would create meaningful rediscovery and reconstruction risk. It intentionally stops before semantic promotion.

The next semantic step, if separately authorized, is reconciliation against complete incumbent authority—not implementation from this checkpoint.
