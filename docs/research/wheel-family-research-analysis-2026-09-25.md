# Wheel Family Research — Wheelwright Analysis

**Date:** September 25, 2026  
**Status:** Analysis of research evidence for Wheelwright decomposition/design. Not ratified Product policy, architecture, implementation authority, or trading advice.  
**Research artifact:** `docs/research/wheel-family-research-report-2026-09-25.html`  
**Frozen thin-slice outcome:** `docs/64-governed-by-the-book-console-thin-slice-outcome-contract-2026-09-25.md`  
**Decomposition method:** `docs/63-capability-decomposition-method-principal-adoption-2026-09-25.md`  
**Prior Wheel research:** `docs/62a-wheel-strategy-research-report-2026-09-25.md`

## 1. Executive analysis

The new research materially strengthens a distinction Wheelwright already needed to preserve:

> **"The Wheel" is not one canonical Operating Program with a bag of tunable parameters. It is a family label applied to materially different operating programs.**

The strongest specimen is the assignment fracture. An assignment-accepting program treats assignment as a normal/planned state transition. An assignment-avoidant program treats assignment as a condition to avoid through continuing management/rolling. Both can use similar 30–45 DTE / approximately 0.30-delta conventions while prescribing different actions from the same economic/lifecycle state.

That means Wheelwright must not use the label `Wheel` itself as sufficient runtime policy.

For the frozen thin slice, **"by the book" must mean "according to the explicitly selected and versioned governed Operating Program in force at the decision boundary," not "according to a universal Wheel book."**

This research is evidence for decomposition and design. It does not by itself ratify a Program, choose a canonical Wheel variant, prove any variant economically superior, or authorize implementation.

## 2. Relationship to the frozen thin-slice outcome

The frozen endpoint remains unchanged:

> A production-useful, read-only governed decision capability in which the real-portfolio Console projects the current by-the-book Recommendation on an in-scope governed actionable subject, allows inspection of its governing basis, and durably preserves/replays the historical Decision without hindsight contamination.

The new research sharpens what that endpoint must *not* do:

- it must not infer rules merely from the family label `Wheel`;
- it must not treat folk conventions as universal policy;
- it must not fabricate an assignment stance;
- it must not silently choose between assignment-accepting and assignment-avoidant schools;
- it must not let current-code defaults substitute for the selected governed Program/version.

The research therefore increases the importance of explicit Program identity/version binding in the decomposition, while leaving the actual capability inventory and design open.

## 3. Operating Program identity is load-bearing

The report's family analysis separates at least three levels:

1. a thin recognizable family skeleton;
2. configurable conventions within some programs;
3. variant-defining or identity-breaking choices.

The important Wheelwright consequence is that not every variation belongs in one generic configuration object.

Examples the research treats as ordinary configuration include:

- delta;
- DTE;
- profit target;
- roll timing.

Examples it treats as more identity-defining include:

- assignment stance;
- objective;
- underlying class;
- collateral regime.

The precise canonical boundary remains a Product/semantic reconciliation question, but the decomposition must preserve the possibility that a change is a **different Operating Program**, not merely a parameter change.

## 4. "By the book" becomes Program-relative

The frozen thin slice asks:

> What does my selected governed Program say I should do now?

The new research gives this question stronger semantic content.

Conceptually:

`Decision Subject + governed context + selected Operating Program/version + frozen decision-time evidence -> Program-specific by-the-book Recommendation`

The label `Wheel` can remain useful for family classification or operator vocabulary, but it is insufficient as the policy discriminator.

This also gives a future comparative capability a clean shape:

- Program A applied to the same admissible state may produce Recommendation A;
- Program B may produce Recommendation B;
- only the selected governed Program produces the authoritative Recommendation for the live decision;
- counterfactual Program comparisons must not rewrite that historical authority.

The frozen thin slice does **not** require multi-Program comparison. The future-extension invariant is simply that later comparison capabilities consume the preserved governed Recommendation rather than invent a second definition of what the selected Program said.

## 5. Folk parameters are doctrine, not universal truth

The report found the familiar 30–45 DTE, approximately 0.30-delta, 50%-profit, and 21-DTE management conventions to be widely repeated but not established as Wheel-specific optima.

Wheelwright therefore needs to preserve a distinction between:

- **the Program says to use X**, and
- **X is empirically established as the optimal rule**.

The first can be a perfectly valid governed rule if the Principal has selected/ratified that Program/version.

The second requires evidence the report did not find.

This distinction is important for rule trace and explanation. A truthful explanation can say:

> Program version P applies rule R with threshold X.

It must not silently upgrade that statement into:

> X is the correct Wheel threshold.

## 6. Cost basis is accounting evidence, not generic forward policy

The report's cost-basis analysis reinforces a semantic boundary already important to Wheelwright.

Adjusted basis can be useful for:

- accounting;
- round-trip reporting;
- describing realized/unrealized economics;
- Program rules that explicitly reference basis.

It should not become a generic lifecycle truth.

A rule such as "never sell calls below basis" may exist in a particular governed Program or constraint set, but the economic state model must not infer it merely because basis is known.

This matters directly to GDXJ-like specimens: the Product must distinguish a Program-prescribed basis constraint from generic forward-economics reasoning.

## 7. Rolling should not collapse lifecycle semantics

The report reinforces that a roll is economically:

1. close an existing obligation; then
2. open a new obligation.

"ROLL" may still be a useful operator-facing Recommendation label or compound action representation if later design justifies it, but Wheelwright must preserve the underlying lifecycle/economic separation.

The semantic danger is creating a primitive that makes a challenged obligation appear to persist unchanged through a roll, thereby obscuring:

- closure economics;
- realization;
- new obligation identity;
- new evidence/decision boundary;
- path-dependent accumulated losses.

The exact Recommendation vocabulary remains intentionally unfrozen by Doc 64.

## 8. Evidence ranking changes what deserves design attention

The research argues that the economically important dimensions are dominated by:

1. underlying selection;
2. collateral regime;
3. objective/Program logic;
4. turnover/frictions/tax context;
5. only then strike/DTE fine tuning.

This is not implementation authority, but it is a useful guard against spending first-slice design energy on highly visible micro-parameters while under-modeling the Program identity, assignment stance, collateral assumptions, or subject qualification that actually change the program.

The thin slice still needs only the load-bearing subset required by its accepted specimen(s).

## 9. Mandate-specific Wheel configurations remain empirically unvalidated

The report found no evidence that "income Wheel," "growth Wheel," or similar Mandate-specific configurations are empirically established categories.

That does **not** by itself invalidate Wheelwright's architecture-level distinction between:

- Portfolio Mandate / purpose;
- Operating Program;
- Program-declared configurable latitude.

But it prevents a stronger empirical claim.

Wheelwright must not say that a Mandate-specific Wheel configuration is externally validated merely because its governance architecture permits one.

If Mandate is allowed to resolve Program parameters, that remains a Product/architecture decision requiring its own sufficient authority.

## 10. Relationship to prior Doc 62a

The new report does not make Doc 62a useless.

Doc 62a's assignment-centric cycle remains a coherent **specific Operating Program specimen** and continues to provide useful research about explicit rulebooks, assignment acceptance, call-away, discipline, and auditability.

The new report narrows the status of that specimen:

- it is not "the Wheel";
- assignment avoidance is not merely an implementation tweak;
- several other coherent programs also use the Wheel label;
- common parameter conventions do not unify those programs;
- the family label underdetermines the Recommendation.

This analysis therefore treats the two research artifacts as complementary with an important correction in emphasis: **assignment-centric Wheel is one governed Program candidate, not the universal semantic definition of Wheel.**

## 11. Decomposition implications — pressure, not inventory

The following are decomposition pressures produced by the research and frozen outcome. They are **not** a pre-decided capability inventory.

The decomposition should be able to account for:

- explicit Operating Program identity/version;
- binding of the selected Program/version to the governed decision context;
- in-scope Decision Subject identity;
- exact decision-time evidence/provenance;
- deterministic Program-specific evaluation;
- truthful unknown/insufficient behavior;
- bounded Recommendation semantics;
- inspectable governing/rule trace;
- durable historical Decision identity and replay;
- no hindsight substitution;
- separation of family label from Program policy;
- separation of Recommendation from later Action/Execution/Outcome.

If any of those responsibilities can be satisfied as derived semantics rather than independently durable entities or capabilities, decomposition/design should prefer the smaller coherent model.

The adopted decomposition method still governs: SPLIT only on materially independent behavior/authority/lifecycle/failure boundaries; CLUSTER where the semantic model, owner, lifecycle, invariants, and acceptance specimen are substantially shared.

## 12. What the first thin slice explicitly does not gain from this research

This research does not add the following requirements to Doc 64:

- Tradier sandbox execution;
- broker submission;
- paper-trading lifecycle;
- generalized multi-Program comparison UI;
- behavioral adherence scoring;
- universal Wheel ontology;
- complete Wheel lifecycle;
- all 13 documented flavors;
- mandate optimization;
- a generic rule engine;
- profitability scoring;
- empirical Program ranking.

Those remain outside the frozen endpoint unless subsequent decomposition demonstrates a REQUIRED or ENABLING dependency under the adopted method.

## 13. Research limitations that must remain visible

The underlying report explicitly records important limitations:

- 43 of 46 sources were read through indexed text rather than verified-live pages;
- no rigorous full-cycle retail Wheel backtest was found;
- the stronger academic evidence is on components such as put-write and buy-write indexes rather than the full retail Wheel cycle;
- no evidence was found validating mandate-specific Wheel configurations;
- important empirical comparisons remain unresolved, including assignment-accepting versus assignment-avoidant programs and Wheel cash flow versus matched-risk total-return-plus-withdrawal approaches.

These limitations make the report valuable as a **semantic/falsification input**, not as proof of a superior trading methodology.

## 14. Durable conclusion

The most important durable analytical conclusion is:

> **Wheelwright should govern and replay an explicitly identified/versioned Operating Program. "Wheel" is a family label and cannot, by itself, answer a by-the-book lifecycle question.**

For the currently frozen Console thin slice, this means the Product must truthfully answer:

> **What did the selected governed Program/version prescribe for this in-scope Decision Subject, using the evidence and governance available at that decision boundary?**

and preserve that answer without hindsight contamination.

Everything beyond that remains subject to the adopted decomposition and capability-design/reconciliation process.
