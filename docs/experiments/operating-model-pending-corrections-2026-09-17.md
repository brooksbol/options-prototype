# Pending Operating-Model Corrections — 2026-09-17

**Status:** Principal-approved for later codification at the next safe stop.  
**Recorded while:** BUG-021 candidate is frozen following independent Codex REJECT; no retry authority exists.  
**Base main:** `00bde244201c6ba04c782c4371cfd3a7ce9d919f`.  
**Execution effect:** This record does **not** authorize modification of the frozen BUG-021 candidate, remediation, retry, candidate replacement, or another implementation attempt.

## Principal decision

On 2026-09-17 the Principal selected **A**: durably preserve the approved pending operating-model corrections without altering or contaminating the frozen BUG-021 candidate.

The corrections are approved for codification when BUG-021 reaches its next safe stop. This durable record exists so the approval does not depend on conversational memory while the in-flight candidate remains undisturbed.

## 1. Principal-facing action translation

`NEXT AUTHORIZED ACTION` must express the next concrete action the Principal should actually take when Principal action is required, rather than merely describing another actor's permission state.

Example:

- Poor: `KIRO MAY IMPLEMENT`
- Principal-facing: `SEND THE PREPARED BUG-021 EXECUTION PROMPT TO THE EXISTING KIRO SESSION`
- When no Principal action is required: `NONE`

The decision surface must expose an outstanding Principal decision even when execution of the resulting action is intentionally deferred. `Do not execute now` is not equivalent to `no Principal decision exists`.

## 2. In-flight execution-state preservation

Before issuing an instruction that can alter repository or workspace state, inspect and preserve material in-flight execution state, including as applicable dirty working trees, preserved uncommitted candidates, staged files, branch divergence, frozen candidates, and concurrent actor work.

Authorization for a next transition does not imply permission to discard, stage, commit, reset, stash, overwrite, incorporate, or otherwise disturb pre-existing work unless that effect is explicitly within the authorized action.

This correction was exposed when a documentation transition encountered the existing dirty BUG-021 candidate and risked mixing state.

## 3. Interruption-state preservation

Actor or infrastructure interruption preserves the last authoritative workflow state. Incomplete execution creates no inferred disposition or authority transition.

In particular, an interrupted review is neither `ACCEPT` nor `REJECT`; it does not restore mutation permission, authorize retry, permit another actor to substitute a disposition, or otherwise advance the workflow.

This correction was exposed when Codex exhausted its usage allowance during independent review of the frozen BUG-021 candidate. No Codex disposition existed at interruption, so the candidate remained frozen and the review remained incomplete.

## 4. Orthogonal work must preserve the active workflow head

Completing an orthogonal action must not erase, replace, consume, or implicitly supersede an already-active next action in another workstream.

`NEXT AUTHORIZED ACTION` is derived from the authoritative active workflow state **after** the current action completes, not merely from the scope or completion state of the actor's most recent local task.

A locally complete task therefore does not justify `NEXT AUTHORIZED ACTION: NONE` when another active workflow still has a concrete Principal-facing next action.

This correction was exposed when the Principal authorized creation of the orthogonal `PL-ACTOR-01` human-clipboard intake item while BUG-021 remained frozen under an interrupted Codex review. The intake was completed and persisted, but reporting `NEXT AUTHORIZED ACTION: NONE` incorrectly erased the still-active BUG-021 workflow head. The correct next action remained to resume the existing Codex review after the usage limit reset, reacquire current `main`, and verify that the frozen candidate remained identical before continuing.

This finding does not establish a hierarchy among actors, select a global scheduler, or resolve the broader concurrent-next-action problem. It establishes only the preservation invariant: orthogonal completion cannot make an outstanding workflow head disappear.

## 5. Conceptual REJECT must not default to another implementation attempt

Repeated high-quality falsification of different manifestations of the same underlying model error is evidence that the implementation model or model-translation handoff may be inadequate, not merely evidence of another local defect.

The observed BUG-021 loop was:

`ChatGPT interprets → Kiro implements → Codex falsifies → ChatGPT translates the falsifier into a tighter Kiro instruction → Kiro implements again`.

Adding explicit Principal retry authorization improves authority hygiene but does not by itself change this rework pattern. A governed retry loop can remain the same throughput failure.

When a Codex REJECT exposes a conceptual/invariant failure class, the natural successor must therefore be **reasoning/model validation**, not another implementation authorization decision.

The reasoning/model-validation state must:

- identify the invariant at the level that generated the failure class, rather than restating Codex's latest counterexample;
- identify which component owns authoritative truth and which components may consume or transform that truth;
- make evidence provenance and temporal authority explicit;
- explain why the proposed model excludes the known failure class;
- generate and survive counterexamples beyond those supplied by Codex;
- remain non-mutating with respect to the frozen implementation candidate;
- produce no Kiro implementation prompt and create no retry authority.

Only after the model has been made explicit and falsified should the workflow surface any new Principal implementation-authorization decision.

For BUG-021, the immediate architectural question is not “how do we stop Product from associating the July 20 STO?” It is:

> What evidence is authoritative for identifying the opening associated with a close, where is that association established, and why is Product independently reconstructing an opening identity after the backend has already adjudicated the close?

The July 20 specimen is a counterexample to the model, not the requirement.

This correction is an experiment in changing the intellectual division of labor at the ChatGPT→Kiro handoff. It does not assert that ChatGPT or Kiro has already been proven to be the throughput constraint, and it does not weaken Codex's independent falsification role.


## 6. Cross-actor evidence provenance is mandatory

> **AN ACTOR MAY NOT RELY ON ANOTHER ACTOR'S COMPLETED WORK, DISPOSITION, OR STATE TRANSITION MERELY BECAUSE A THIRD ACTOR REPORTS THAT IT OCCURRED.**

A consequential cross-actor handoff must carry enough provenance for the receiving actor to establish the claimed result from the underlying evidence or from a durable authoritative representation of that result.

This is a distinct requirement from the existing rule that conversation and actor prose do not create execution authority. The problem is not only whether a message grants authority. The receiving actor may not even possess the evidence needed to know that the claimed prerequisite event occurred.

The governing distinction is:

> **Possession of evidence by Actor A does not make that evidence available to Actor B. Actor C's summary of Actor A's evidence does not close the gap.**

Therefore:

- a third actor's statement that another actor returned `ACCEPT`, `REJECT`, `BLOCKED`, completed a review, validated a model, or established another consequential result is not a substitute for the underlying disposition/evidence or a durable authoritative record of it;
- repository synchronization alone is insufficient when consequential workflow state depends on external actor evidence that has not been persisted there;
- a receiving actor must be able to identify the producer, the relevant evidence/result, the state or candidate against which it was produced, and enough provenance to determine that the evidence applies to the contemplated transition;
- if the receiving actor cannot establish that provenance, it must stop rather than accept a conversational reconstruction as workflow truth;
- evidence transport and authority transport remain separate: delivering authentic evidence does not itself authorize the next consequential transition.

The resulting synchronization invariant is:

> **Actor synchronization requires synchronization of relevant evidence, not merely synchronization of repository SHA and authority.**

### BUG-021 specimen that exposed the gap

After Codex independently reviewed the preserved seventh-pass BUG-021 candidate and returned `REJECT`, ChatGPT possessed that review evidence and later performed model validation. Kiro did not possess the Codex evidence, and the repository-resident BUG-021 record still described the candidate as pending independent Codex review.

When subsequently asked to proceed from the later state, Kiro stopped because the state it could independently establish did not prove that the Codex review had occurred.

That STOP was correct.

ChatGPT telling Kiro that "Codex already reviewed and rejected this candidate" would not have repaired the provenance gap. It would merely have made ChatGPT an evidence-provenance proxy and asked Kiro to trust a third actor's conversational reconstruction.

The correct future operating model must make the actual cross-actor evidence, or its durable authoritative representation, available to the receiving actor before a consequential transition depends on it.

### Relationship to PL-ACTOR-01

This finding materially sharpens `PL-ACTOR-01 — Remove the Principal as Human Clipboard While Preserving Principal Authority`.

Automatic actor transport must not merely move prose messages. Where a handoff carries consequential evidence, it must preserve evidence provenance sufficiently for the receiver to establish what happened and against what state.

This correction does **not** choose MCP, a broker, direct actor integration, a workflow controller, or any other transport topology. It establishes the invariant any later transport mechanism must satisfy.


## Safe-stop disposition

At the next safe stop, reconcile these corrections into the appropriate operating-model authority documents on `main`, then retire or supersede this pending record according to the repository's normal documentation discipline.

Until then, this record is preservation of approved pending decisions, not permission to disturb BUG-021 or alter the active operating model mid-flight.
