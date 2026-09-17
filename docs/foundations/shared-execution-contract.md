# Wheelwright Shared Execution Contract — Outcome Amendment

**Ratified:** September 16, 2026  
**Status:** Principal-ratified shared execution contract  
**Authority:** Category B — Ratified Decision / Accepted Methodology  
**Applies to:** Principal + ChatGPT + Kiro + Codex when performing outcome-bearing Wheelwright work  
**Amends:** September 14, 2026 Three-AI Actor Governance Contract preserved in `docs/journal/project-journal-3.md`  
**Related:** `closed-loop-engineering.md`, `multi-actor-repeatability-temporal-synchronization.md`, actor-specific cold starts, `.kiro/steering/engineering-methodology.md`

---

## Operational primacy

For **outcome-bearing execution**, this is Wheelwright's primary shared execution contract.

That means a cold-start actor must not treat successful authority retrieval, architectural conformance, passing tests, implementation completeness, or review approval as sufficient when this contract is not being followed.

This operational primacy does **not** override Wheelwright's document-authority precedence, Category A system definition, or later explicit Principal direction. It governs **how authorized work is executed** within those constraints.

The original September 14 contract remains governing:

> **Find freely. Block narrowly. Defer explicitly. Observe quickly. Ratchet what reality proves.**

This amendment exists because recent work demonstrated that the contract could survive in repository memory while fail in execution. BTS/HOLD-CLOSE produced locally correct, test-backed engineering while the Principal-visible outcome remained wrong. This amendment makes preservation and observation of that outcome an explicit execution obligation.

---

## 1. The confirmed outcome remains the execution anchor

For outcome-bearing work, before substantial implementation begins:

- establish a concrete positive specimen;
- establish a materially useful negative specimen;
- state the operator-visible result expected for each; and
- obtain Principal confirmation or replacement of that interpretation.

Actor-generated interpretations are proposals until confirmed.

---

## 2. Consequential choices preserve both specimens

Before:

- adopting the implementation approach;
- materially changing that approach;
- expanding scope;
- crossing a significant implementation/review boundary; or
- handing the work to another actor,

trace both confirmed specimens through the proposed behavior.

The purpose is to detect contradiction early.

This is **not** proof that unfinished software already works.

---

## 3. Outcome contradiction requires STOP; incompleteness alone does not

STOP and surface the conflict when the proposed approach:

- contradicts a confirmed specimen;
- requires changing the meaning of a confirmed outcome;
- conflicts with applicable governing authority; or
- requires an unsupported product decision.

The September 14 BLOCKER authority remains unchanged.

A demonstrated correctness, safety, integrity, reversibility, or experiment-validity failure may also stop authorized execution when its concrete blocking consequence is stated.

Ordinary unfinished implementation, failing tests during development, or correctable defects are not by themselves STOP conditions.

---

## 4. Observe the product outcome at the earliest usable integration point

Passing tests, architectural conformance, backend correctness, review approval, or other intermediate evidence does not substitute for the Principal-visible outcome.

As soon as the confirmed result can be observed through the relevant integration path, observe it **before further hardening**.

---

## 5. `NOT VERIFIED` governs continuation

If the Principal-visible outcome **can be observed at the current integration point**, `NOT VERIFIED` is not available. Observe before spending additional effort hardening the implementation.

If the result genuinely cannot yet be observed, state:

- the specific missing precondition;
- why observation is currently unreachable;
- the consequence of that uncertainty; and
- what additional work or spend is justified to reach observation.

`NOT VERIFIED` is not a late closeout disclaimer and does not authorize indefinite work.

---

## 6. Context resets and handoffs recover the active outcome

On a context reset or actor handoff, the incoming actor must recover before proposing the next consequential action:

- the Principal-confirmed positive specimen;
- the Principal-confirmed negative specimen;
- their expected observable results;
- the current verification state; and
- anything that remains genuinely `NOT VERIFIED`.

Recovering repository authority without recovering this active acceptance anchor is incomplete synchronization for outcome-bearing work.

---

## 7. Protect only what reality earns

Specimen tests may be created before implementation to expose contradictions cheaply.

Such tests do **not** establish that:

- the interpretation is the correct product outcome; or
- the operator-visible outcome has actually been delivered.

After the Principal-confirmed interpretation has been observed successfully through the relevant product path, mechanically load-bearing properties may be preserved through existing deterministic regression or architectural-fitness mechanisms.

---

## Contract conformance

An actor must not silently substitute a locally correct intermediate objective for the confirmed outcome.

An actor must not silently reinterpret an applicable contract.

If proposed work conflicts with an applicable contract or confirmed outcome:

> **Surface the conflict before proceeding.**

Explicit amendments operate within their stated scope and remain subject to Wheelwright's repository authority precedence and later explicit Principal direction.

Applicable ratified contracts remain governing unless explicitly amended, superseded, or displaced by higher-precedence authority.

Unresolved material conflicts are surfaced to the Principal.

---

## Cross-actor obligation

ChatGPT, Kiro, and Codex must remind one another when:

- an intermediate abstraction begins replacing the confirmed outcome;
- review completeness becomes unauthorized scope;
- further hardening delays available product observation;
- tests or architecture are being substituted for observable acceptance;
- ordinary incomplete work is being classified as a STOP condition;
- `NOT VERIFIED` is being used despite an available observation path; or
- a fresh actor proposes consequential work without recovering the confirmed specimens and verification state.

---

## Acceptance

Outcome-bearing handoffs begin with:

> **Outcome delivered: YES / NO / NOT VERIFIED**

and provide direct evidence for the confirmed positive and negative specimens before test counts or architectural-conformance evidence.

`YES` requires observable outcome evidence when the relevant observation path exists.

---

## Effectiveness and falsification

This amendment exists to improve execution throughput, not increase ceremony.

Evaluate it using:

- elapsed time and credits to first observable evidence;
- contradictions caught before substantial implementation;
- failures first discovered by the Principal after claimed completion;
- unnecessary STOPs; and
- who first discovered a mismatch and how much had already been spent.

Actor compliance with the wording is not success.

If the amendment creates recital, excessive stopping, or additional ceremony without improving accepted-outcome throughput, it should be changed or withdrawn rather than reinforced with more governance.

---

## Herbie status

This contract does **not** establish disciplined execution as Wheelwright's identified Theory-of-Constraints constraint.

Disciplined execution remains a **leading Herbie hypothesis** supported by repeated execution failures.

This amendment is a bounded execution control and evidence-gathering mechanism under that hypothesis. Its observed effect on real work will determine what, if anything, has been learned about the actual constraint.
