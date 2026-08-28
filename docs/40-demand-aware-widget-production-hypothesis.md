# Demand-Aware Widget Production — Downstream TOC Hypothesis

**Date:** August 29, 2026  
**Status:** PARKED downstream hypothesis. Preserve for later investigation; do not use this document to change current acquisition behavior.  
**Scope:** Product-demand and production-priority hypothesis for Wheelwright after the current constraint-identification work.  
**Related:** `docs/39-constraint-identification-restart-plan.md`, `docs/parking-lot.md`, `PL-DEPLOY`, `PL-GOV-02`, opportunity-history observation work.

---

## 1. Why this is worth preserving

The current constraint-identification campaign is deliberately focused on finding the one present system constraint. The leading machine-level hypothesis is that Tradier is underutilized while eligible WIP waits. Nothing in this note supersedes that investigation.

However, the discussion exposed a materially better model of Wheelwright's eventual factory economics that should not be lost once the current machine problem is resolved.

The key correction is:

> **The factory's products are operator-facing widgets. The operator(s) are the consumers.**

Market data, option chains, quotes, expirations, and evidence are inputs and intermediate material. A technically valid widget is not automatically valuable output merely because the factory can produce it.

This distinction matters because once provider/acquisition capacity is no longer obscuring system throughput, the next constraint may emerge around the supply of operator-valued widgets and the factory's allocation of scarce production capacity among them.

---

## 2. Concrete motivating example

Consider two simultaneously producible products:

- an SPY widget around 7 DTE;
- a DBO widget around 22 DTE.

The point of the example is not that one symbol or DTE is universally superior.

The point is that the factory may be able to manufacture both while their expected value to the operator differs materially. SPY can be operationally easy to observe and highly liquid while still presenting unattractive premium economics. DBO may present richer premium economics and therefore a more valuable widget to the operator at that moment.

The production question is therefore not merely:

> Can Wheelwright produce both widgets?

It is also:

> **Should Wheelwright produce both widgets at the same fidelity and cadence, and if not, at what relative priority?**

---

## 3. Product-demand model

A useful downstream factory model is:

```text
market conditions
    -> evidence/raw material
    -> factory manager
    -> scarce production capacity
    -> operator-facing widgets
    -> operator consumption / rejection / action
    -> observed demand signal
    -> factory manager
```

The feedback loop is important. The factory manager should eventually know which widgets to build based on demonstrated consumer demand rather than treating every possible widget as an equal production obligation.

"Demand" must not be assumed to mean only explicit clicks. Future investigation should determine which operator behaviors are legitimate demand evidence, potentially including inspection, dismissal, action, repeated seeking, explicit request, and downstream economic use.

No demand metric is ratified by this note.

---

## 4. Throughput implication

A high count of technically valid widgets is not necessarily system throughput in the Theory of Constraints sense.

If the operator does not value or consume those widgets, manufacturing more of them can increase local production metrics without improving the system goal.

A better eventual throughput concept may be:

> **operator-valued widgets supplied per unit of constrained factory capacity**

This wording is intentionally provisional. "Valued," "supplied," and the relevant capacity denominator all require empirical definition before ratification.

The important durable insight is narrower:

> **Widget production volume and valuable system output are not the same quantity.**

---

## 5. Production priority and acceptable corner-cutting

If factory capacity is scarce, equal treatment of every symbol, expiration, or widget family may be economically irrational.

The factory manager may eventually need to decide:

- which widget products deserve full production;
- which deserve lower production priority;
- which can be sensed cheaply until conditions improve;
- what evidence depth/fidelity each product deserves;
- what refresh cadence is justified by expected operator value;
- when a low-demand product should be promoted because market conditions changed.

This creates a principled meaning for "cutting corners":

> **Reduce production cost where doing so does not materially reduce the supply or recall of widgets the operator would have valued.**

This is not authorization to weaken evidence quality, freshness contracts, universe coverage, or current acquisition obligations now. It is a future optimization question that becomes legitimate only after the current constraint is identified and the relevant downstream regime is actually observed.

A particularly important future distinction is likely to be:

- **sensing:** cheap enough market awareness to detect that a low-priority product has become interesting;
- **production:** the more expensive evidence work required to manufacture the full operator-facing widget.

Low current demand may justify reduced production without justifying blindness.

---

## 6. Relationship to supply and demand

The relevant "supply" is not simply the number of option contracts the market exposes.

The market supplies changing economic conditions from which Wheelwright can manufacture products. Wheelwright then decides how much scarce factory capacity to spend converting those conditions into widgets. Operators create demand for those widgets.

A future constrained regime could therefore look like:

```text
operator demand for valuable widgets
    >
market/factory supply of valuable widgets
```

If acquisition machinery is already capable of adequately seeing the opportunity environment, that scarcity may be economically real rather than a software defect.

For example, capital and operator attention may be available while the market simply does not offer enough conditions capable of producing attractive premium-oriented widgets under Wheelwright's policies.

That would be fundamentally different from the current suspected regime in which valuable opportunities may be missed because evidence cannot be renewed fast enough.

---

## 7. Future measurement questions

Do not answer these now. Preserve them for the point at which the current constraint has moved and factory capacity allocation becomes observable as a system problem.

Future investigation should ask:

1. What observable operator behavior constitutes demand for a widget product?
2. What is the production cost of a widget by symbol, expiration, strategy, and evidence depth?
3. Which widget families consume substantial factory capacity while producing little operator value?
4. How much can production fidelity or cadence be reduced before operator-valued opportunity recall degrades materially?
5. What cheap sensing mechanism can detect regime changes and promote a low-priority product back into full production?
6. Does prioritizing production by expected operator demand increase whole-system throughput, or merely optimize a local metric?
7. When capacity is no longer scarce, does any prioritization policy still matter?
8. Where does WIP accumulate once the provider/acquisition machine is operated near its practical envelope?

The SPY-7-DTE versus DBO-22-DTE comparison is a useful future test case because it separates "easy/possible to manufacture" from "worth manufacturing at equal priority."

---

## 8. Guardrails

This note must not be used to pre-decide the next Herbie.

Specifically:

- Do not declare widget supply/demand to be the next constraint before observing it.
- Do not prune SPY, DBO, or any other symbol based on this hypothesis.
- Do not alter refresh cadence, expiration coverage, TTLs, evidence fidelity, or scheduler priority based on this note.
- Do not interpret low premium in one observation as durable low operator demand.
- Do not equate operator clicks with economic value without investigation.
- Do not build a demand-aware factory manager merely because the model is plausible.
- Do not let this downstream hypothesis distract from the current Doc 39 measurement campaign.

The correct TOC sequence remains:

> **Identify the current constraint, exploit/subordinate/elevate as warranted, then observe the changed system and allow the next constraint to reveal itself.**

---

## 9. Durable hypothesis to carry forward

When Wheelwright has enough acquisition capacity to observe the market reliably, the factory manager may need to allocate production capacity according to demonstrated operator demand for widget products rather than servicing every producible widget equally.

The core future question is:

> **Given finite factory capacity, which widgets should Wheelwright build, at what priority and fidelity, so that it preserves the operator-valued opportunities that matter while spending as little constrained capacity as possible on low-value output?**

This is a downstream hypothesis, not a current implementation directive.
