# Death Spiral Avoidance Protocol — Wheelwright

**Date:** September 27, 2026  
**Status:** Ratified methodology  
**Authority:** Category B — Ratified Decision / Accepted Design  
**Scope:** Shared multi-actor reasoning and workflow topology  
**Related:** `KNOWN-FAILURE-MODES.md`, `bootstrap/chatgpt-cold-start.md`, `bootstrap/kiro-cold-start.md`, `bootstrap/codex-cold-start.md`, `foundations/multi-actor-repeatability-temporal-synchronization.md`

---

## Purpose

Wheelwright uses multiple specialized actors because implementation, architecture, falsification, synthesis, and Principal judgment are different cognitive jobs. That separation becomes harmful when essentially the same unresolved problem repeatedly crosses actor boundaries without new decision-relevant state.

This protocol prevents that failure mode.

> **Core invariant: No repeated consequential traversal without new decision-relevant state.**

A second invariant governs the escape:

> **When repeated evidence falsifies work at the current abstraction layer, move up one layer before attempting implementation again.**

This protocol governs reasoning/workflow topology. It does **not** create execution authority. Authority rules independently determine whether any implementation, retry, mutation, persistence, or other consequential action may occur.

---

## Definition — Death Spiral

A **death spiral** is a repeated multi-actor cycle in which substantially the same unresolved problem is handed across an actor boundary again without a material change in evidence, governing model, Product meaning, authority, or candidate basis.

Canonical failure shape:

    Kiro implementation
      → Codex REJECT
      → ChatGPT translates the rejection into a more detailed Kiro prompt
      → Kiro implementation
      → Codex REJECT
      → ChatGPT produces an even more detailed Kiro prompt
      → ...

Changing actors, wording, prompt length, test count, or implementation detail does not make the traversal new if the decision-relevant state is materially unchanged.

Actor activity is not evidence of progress.

---

## Mandatory Traversal Question

Before sending an unresolved consequential concern through a substantially repeated actor/workflow path, ask:

> **What materially changed that makes another traversal of this loop rational?**

Another traversal is justified only when at least one of these changed materially:

1. **Evidence** — new empirical evidence, reproduction, trace, counterexample, measurement, observation, or falsifier changes what is known.
2. **Model** — the governing causal, domain, semantic, architectural, or invariant model has been synthesized, corrected, or materially refined.
3. **Product meaning** — the Principal has resolved a genuinely Principal-owned Product question that was blocking the work.
4. **Authority** — a genuinely required new authorization state exists after a boundary that actually consumed or lacked authority.
5. **Candidate basis** — a materially different candidate can now exist *because* evidence/model/Product meaning changed, rather than because rejection prose was merely translated into another implementation prompt.

A new candidate by itself is not sufficient when it is only another implementation variation under the same falsified or unresolved model.

If none changed, **do not traverse the same loop again.**

---

## REJECT Transition

A Codex `REJECT` is evidence about the reviewed candidate. It is not retry authority.

On REJECT, first classify what failed.

### Bounded implementation failure

If the rejection identifies a bounded implementation defect while the governing Product meaning, architecture, causal/domain model, and acceptance semantics remain established and unchallenged, ordinary remediation reasoning may remain at the implementation layer.

Whether another implementation attempt is authorized is a separate authority question.

### Model or meaning failure

If the rejection:

- falsifies an assumption;
- exposes missing or incorrect causality;
- demonstrates that acceptance criteria do not encode intended behavior;
- reveals unresolved domain/semantic meaning;
- contradicts ratified architecture or Product authority; or
- repeatedly defeats locally reasonable implementations under the same model,

then **stop implementation translation**.

The required reasoning transition is:

    REJECT
      → MODEL / INVARIANT SYNTHESIS
      → MODEL FALSIFICATION
      → unresolved Product/architecture decision if one genuinely remains
      → implementation decision / authorization if appropriate
      → implementation

The forbidden default is:

    REJECT
      → BETTER / LONGER KIRO PROMPT
      → IMPLEMENTATION RETRY

A reviewer finding may inform synthesis. It does not itself define the replacement model or authorize its implementation.

---

## Escalate Abstraction, Not Verbosity

When recurrence shows that the current abstraction layer is not resolving the problem, move upward only as far as the evidence requires:

    code / local implementation
      → implementation invariant or behavioral contract
      → domain / semantic / architectural model
      → Product meaning

Do not solve repeated failure by making the next actor prompt longer, more prescriptive, or more implementation-specific.

Do not overcorrect in the opposite direction: a bounded coding defect does not automatically require architectural or Product reopening.

The escalation test is evidence-based: **what layer contains the falsified or unresolved assumption?**

---

## Semantic Loop Identity

Loop detection is semantic, not syntactic.

These may be the same death spiral:

    Kiro → Codex → ChatGPT → Kiro

    Kiro → ChatGPT → Codex → Kiro

    Kiro → Codex → Principal → ChatGPT → Kiro

if the same unresolved concern returns to implementation without new decision-relevant state.

Changing actor order does not reset the loop. Neither does:

- a fresh chat/session;
- a new prompt;
- more tests that exercise the same assumption;
- a more detailed review;
- a new patch under the same unresolved model;
- an actor declaring the issue understood;
- a recommendation being restated as a requirement.

---

## Principal Protection

Death-spiral avoidance must not turn the Principal into the human continue button.

Do not escalate to the Principal merely because:

- two AI actors disagree;
- a review rejected a candidate;
- a loop has occurred;
- an actor wants confirmation before continuing ordinary role-local reasoning;
- the system needs model/invariant synthesis that belongs to an AI role.

Return to the Principal only when the remaining uncertainty is actually Principal-owned or otherwise reserved by current authority: Product meaning, consequential scope/economic commitment, a material tradeoff requiring Principal judgment, or another explicit decision boundary.

A Principal decision is not a generic mechanism for resetting a loop counter.

---

## Multi-Actor Completion

An actor finishing its assigned reasoning does not establish that the evidence set is complete, and additional actor output does not automatically establish progress.

Before convergence or another consequential traversal, distinguish:

- **actor completion** — one actor finished;
- **evidence-set completion** — required evidence is present, waived, unavailable with disposition, or otherwise governed as complete;
- **decision readiness** — remaining uncertainty is small enough and correctly owned for the next decision;
- **execution authority** — the applicable authority mechanism permits the next consequential action.

Do not collapse these states.

---

## Detection Cues

Treat the following as death-spiral warnings:

- “Codex rejected it; write Kiro a better prompt.”
- The next prompt mostly restates the previous reviewer findings as implementation instructions.
- The same conceptual defect survives multiple locally reasonable patches.
- Test count or prompt length rises while the disputed model remains unchanged.
- Architecture is repeatedly reopened without threshold-crossing evidence.
- The Principal is repeatedly asked to say “continue” without a new Principal-owned decision.
- Actors repeatedly hand the same unresolved question to one another.
- A new implementation is proposed before explaining what changed since the previous rejection.
- Review is being used as iterative implementation steering rather than independent falsification.

A warning cue triggers the traversal question; it does not by itself prove a death spiral.

---

## Required Escape Procedure

When a death spiral is detected or strongly indicated:

1. **Stop the repeated traversal.** Do not issue another implementation prompt merely to maintain momentum.
2. **Name the unresolved concern** in concrete, falsifiable terms.
3. **Identify the current abstraction layer** and the assumption/evidence that failed there.
4. **Inventory what actually changed** since the last traversal using Evidence / Model / Product meaning / Authority / Candidate basis.
5. **If nothing material changed, move up one abstraction layer** and synthesize the missing model/invariant rather than retrying implementation.
6. **Falsify the synthesized model** independently enough to determine whether it explains the prior failures and survives known counterexamples.
7. **Route only genuinely unresolved reserved decisions to the Principal.**
8. **Re-enter implementation only when** the governing model/meaning is adequate *and* applicable authority independently permits the implementation attempt.

The objective is not to minimize iteration. The objective is to ensure each consequential iteration has a reason to produce different information.

---

## Relationship to Existing Controls

This protocol complements, and does not replace:

- **Codex REJECT / no-retry authority discipline:** REJECT does not authorize remediation.
- **Principal Decision Surface:** makes consequential state and Principal decisions conspicuous; it does not create authority.
- **Multi-actor temporal synchronization:** actor completion is not evidence-set completion.
- **Project-Memory Protocol:** durable learning from a spiral or its resolution must be reconciled when it crosses the durability threshold.
- **Known Failure Modes:** provides cold-start recognition cues; this document owns the full shared protocol.

Where these controls overlap, preserve their separate concerns:

> **Death Spiral Avoidance controls workflow topology. Authority controls permission. Project memory controls durability. The Principal controls reserved meaning and decisions.**

---

## Completion Test

A death-spiral intervention is successful when the next consequential traversal can answer both questions:

1. **What decision-relevant state changed?**
2. **Why does that change make this traversal capable of producing information or an outcome the previous traversal could not?**

If those questions cannot be answered, do not repeat the loop.
