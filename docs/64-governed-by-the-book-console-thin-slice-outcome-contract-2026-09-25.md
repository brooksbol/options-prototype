# Governed By-the-Book Console Thin-Slice Outcome Contract

**Date:** September 25, 2026  
**Status:** Principal-approved frozen thin-slice outcome contract  
**Method authority:** `docs/63-capability-decomposition-method-principal-adoption-2026-09-25.md`  
**Repository state before persistence:** accepted `main` verified at `4106f986ccfef16b90c239620a1545fd15b3d2fe`.

## 1. Operator problem

The operator has real portfolios and actionable inventory visible in the Wheelwright Console, but Wheelwright does not yet provide a durable, reproducible answer to:

> **What does my selected governed Program say I should do now?**

Today that answer can be reconstructed conversationally or through local evaluators, but it is not yet a first-class production Console behavior whose historical decision boundary can be preserved and replayed.

## 2. Frozen operator-visible outcome

When the operator opens a **real portfolio** in the normal Wheelwright Console, Wheelwright identifies governed actionable subjects within the selected thin-slice scope and projects the current **by-the-book Recommendation** directly on the relevant Console row or subject.

The operator can inspect that Recommendation to understand:

- what Wheelwright recommends;
- which governed Program/configuration and context apply;
- which decision-time evidence supports the Recommendation;
- why the applicable rules produced that Recommendation;
- whether required authority/evidence is insufficient.

The Recommendation is a governed Product result, not an AI improvisation and not a UI-local calculation.

Wheelwright durably preserves the historical Decision sufficiently to recover/replay the decision boundary without substituting later market evidence, later rules, or later operator behavior.

**Wheelwright does not submit a broker order in this thin slice. The operator retains execution authority.**

## 3. Console interaction model

The Console is the operator entry point and projection surface.

Conceptually:

> **real portfolio state → governed actionable subject → applicable governed Program/configuration + decision-time evidence → by-the-book Decision/Recommendation → Console recommendation tag/projection**

The Console itself does not become a new authority merely because it displays the result. Underlying authoritative state/evidence paths remain authoritative according to their governing contracts.

The frozen outcome does not require CSV export/import as part of the operator workflow.

## 4. Candidate governed subjects

The discovery that led to this contract identified at least these candidate subject classes:

- existing short obligations represented in the ladder;
- unencumbered shares represented in the Console;
- eligible uncommitted capital governed by the applicable Program.

The contract **does not pre-authorize all three as REQUIRED first-slice capabilities**. Decomposition must determine which are REQUIRED, ENABLING, or DEFER while preserving the operator outcome.

For capital, generic account cash is not automatically a governed Wheel subject. Any capital recommendation must operate on capital that is legitimately within the applicable governed scope and eligible for the Program.

## 5. Recommendation projection

The UI should be able to project a bounded current Recommendation on the relevant governed subject—for example as a tag or equivalent compact status.

Illustrative values discussed during outcome discovery included concepts such as:

- LET RESOLVE;
- BUY TO CLOSE;
- ROLL;
- SELL CALL;
- SELL PUT;
- HOLD / NO ACTION;
- UNRESOLVED / INSUFFICIENT.

These examples **do not freeze the canonical Recommendation vocabulary or an implementation enum**. The rigorous Program definition and subsequent authority reconciliation/decomposition must determine the legitimate action vocabulary and semantics.

The tag/projection represents the governed Recommendation. It must not become the rule engine or source of authority.

## 6. Positive specimen

A successful positive specimen uses a real portfolio represented in the normal Console.

For at least one governed actionable subject within the accepted first-slice scope, Wheelwright:

1. identifies the subject;
2. resolves the governing context and applicable Program/configuration;
3. obtains and preserves the required decision-time evidence/provenance;
4. evaluates the applicable by-the-book rules;
5. produces a bounded Recommendation;
6. projects that Recommendation on the relevant Console subject;
7. allows the operator to inspect the governing basis and reasoning trace;
8. durably preserves the Decision and its bindings;
9. survives browser destruction/restart;
10. retrieves/replays the historical Decision without silently substituting current evidence, current rules, or later operator behavior.

The Product proof is not that the Recommendation later makes money. The proof is that Wheelwright can truthfully state and preserve what the selected governed Program prescribed at that decision boundary.

## 7. Adverse/refusal specimen

If a Recommendation requires governing context, Program configuration, evidence, or authority that Wheelwright cannot establish sufficiently, Wheelwright must **not improvise a by-the-book answer**.

The relevant Console subject must expose a truthful unresolved/insufficient state rather than a fabricated Recommendation.

Where historical preservation is required by the resulting design, later availability of missing information must not cause Wheelwright to pretend that information was available at the original decision boundary.

## 8. Restart/replay expectation

Browser state is disposable.

Destroying/restarting the browser must not destroy or silently reconstruct historical decision truth.

The durable system must preserve enough authoritative/recoverable information to establish the original:

- Decision Subject;
- governing bindings;
- relevant evidence/provenance;
- Recommendation;
- rule/reasoning trace required for acceptance;
- applicable decision-time semantics.

Replay means recovering/reproducing the historical governed result from recoverable historical inputs/bindings. It does not mean merely storing display text, and it does not mean rerunning the historical question against today's portfolio/market state.

The exact persistence/identity design remains a decomposition/design question.

## 9. Thin-slice endpoint

The frozen endpoint is:

> **A production-useful, read-only governed decision capability in which the real-portfolio Console projects the current by-the-book Recommendation on an in-scope governed actionable subject, allows inspection of its governing basis, and durably preserves/replays the historical Decision without hindsight contamination.**

Broker execution is outside the endpoint.

Recording/comparing actual operator behavior may be added only if decomposition demonstrates it is REQUIRED or ENABLING for this frozen endpoint; it is not assumed merely because later research use would benefit from it.

## 10. Immediate Product value

This slice is intended to be useful on **real portfolios immediately**.

It is not merely scaffolding for paper trading or Training Mode.

It gives the operator a production decision-support surface while retaining human execution authority.

The durable governed Recommendation can later become an upstream input to additional experiments/capabilities, including:

1. operator-behavior comparison, where actual operator action can be compared with the preserved by-the-book Recommendation; and
2. paper-execution reference trajectories, where a methodology-faithful action can be submitted to an external simulated venue and observed through its lifecycle.

Those later capabilities are not authorized by this contract.

## 11. Explicit non-goals

This thin slice does not authorize or require:

- Tradier sandbox/paper order submission;
- live broker order submission;
- fake brokerage or internal fill simulation;
- autonomous execution;
- full paper-execution laboratory;
- FOLLOW/DEFER/DEPART scoring;
- treating FOLLOW as good or DEPART as bad;
- economic-outcome or profitability judgment;
- proof that the selected Program is economically superior;
- proof that adherence improves outcomes;
- Mandate-fulfillment scoring;
- portfolio-level capital allocator;
- Return Disposition as a new canonical entity;
- generic strategy/rule/policy engine;
- complete Wheel lifecycle;
- universal canonical Wheel rulebook;
- multi-strategy breadth;
- Training Mode;
- provider generalization;
- implementation of the entire semantic ontology.

## 12. Authority-gap rule

This outcome contract freezes the Product behavior, not unresolved Product policy.

If decomposition discovers that the frozen outcome requires Program/configuration, Recommendation, capital-scope, subject-identity, or other semantics that remain discovery/research-only, the gap must be surfaced explicitly.

The affected path is blocked until sufficient authority exists.

The gap must not be silently filled by implementation defaults, AI improvisation, current-code behavior, or retrospective interpretation.

Discovery/research is not automatically discarded merely because it is not yet governing authority.

## 13. Acceptance meaning

Acceptance of this thin slice would establish only that:

> **Wheelwright can use real portfolio state and decision-time evidence to bind an in-scope actionable subject to an explicitly governed Program/context, deterministically produce and visibly project the by-the-book Recommendation, explain its governing basis, and preserve/recover that historical Decision without hindsight contamination while leaving execution authority with the operator.**

Acceptance would **not** establish that:

- the Program is good;
- the Recommendation is profitable;
- adherence improves results;
- the chosen Wheel configuration is universally correct;
- paper execution works;
- broker integration is authorized.

## 14. Decomposition boundary

This contract intentionally does not decide:

- the complete capability inventory;
- which candidate subject classes are REQUIRED/ENABLING/DEFER;
- the canonical Recommendation vocabulary;
- whether Recommendation is implemented as an enum or another bounded type;
- the exact Program/configuration contract;
- the exact capital-scope model;
- persistence schema;
- API shape;
- UI component design;
- Decision identity/hash representation;
- whether actual operator disposition is inside the first implementation slice;
- implementation order beyond the adopted decomposition methodology.

Those questions now belong to capability decomposition and, only where necessary, subsequent Product/architecture reconciliation.

## 15. Future-extension invariant

Later behavioral-comparison and paper-execution capabilities should consume the durable governed Decision/Recommendation rather than create an independent competing definition of “what the Program said.”

This is a forward compatibility constraint, not authorization to implement those later capabilities now.
