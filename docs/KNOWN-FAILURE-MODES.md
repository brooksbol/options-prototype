# ⚠️ KNOWN FAILURE MODES — READ BEFORE ACTING

> **These are mistakes Wheelwright has already paid for. Do not rediscover them.**
>
> This is a cold-start failure checksum, not a new source of execution authority. Each item summarizes demonstrated operating-model evidence. Follow the linked governing authority and current task/experiment state for actual permissions and transitions.

## Before consequential work

If what you are about to do resembles any item below, **stop and reacquire the governing state before crossing the boundary**.

### 1. Do not invent Product outcomes

Do not let ChatGPT, Kiro, Codex, tests, or implementation details substitute for Principal-confirmed operator outcomes.

Before substantial outcome-bearing implementation, the required positive/negative Product specimens and expected operator-visible outcomes must have the required Principal confirmation.

**Known failure:** actors inferred increasingly detailed acceptance criteria, implemented and reviewed them, and only later discovered elementary Product requirements when the Principal used the software.

**Evidence / authority:** `WARNING-operating-model-reality-report-FINAL.md`; `foundations/shared-execution-contract.md` (semantic guidance; runtime-control claim suspended); `.kiro/steering/engineering-methodology.md`.

### 2. Do not harden before the earliest useful Product observation

When an outcome-bearing specimen is actually observable, observe the Principal-visible result before spending heavily on hardening or deep conformance work.

Green tests, architectural conformance, and reviewer approval do not substitute for the observable Product outcome.

**Known failure:** large test/review cycles accumulated before Principal observation exposed basic UX requirements.

**Evidence / authority:** `.kiro/steering/engineering-methodology.md`; `WARNING-operating-model-reality-report-FINAL.md`.

### 3. A Codex counterexample is evidence, not the next Kiro requirement

Do not automatically translate each Codex falsifier into a narrower implementation prompt.

Ask whether the rejection exposes a local defect or demonstrates that the implementation model/invariant is wrong. Repeated failures in the same conceptual neighborhood are evidence that another patch cycle may be the wrong successor state.

**Known failure:** Codex falsified → ChatGPT elaborated → Kiro patched → Codex found another manifestation of the same deeper invariant.

**Evidence:** `WARNING-operating-model-reality-report-FINAL.md`; pending operating-model correction record where current.

### 4. Codex REJECT does not authorize remediation or retry

A rejection invalidates the reviewed candidate. It does not manufacture another implementation attempt.

Recommendations, technical tractability, sunk cost, prompts, and conversational momentum do not create retry authority.

**Evidence / authority:** `foundations/principal-decision-surface.md`; `WARNING-operating-model-reality-report-FINAL.md`.

### 5. Your completion is not multi-actor completion

When independent actors were commissioned, one actor finishing does not mean the evidence set is complete.

Do not manufacture a collective conclusion or Principal decision before the required independent evidence has been collected/accounted for and reconciled.

**Known failure:** an actor completed its own 4AM analysis and jumped directly to a Principal decision before peer responses were available.

**Authority:** `foundations/multi-actor-repeatability-temporal-synchronization.md`.

### 6. Do not manufacture Principal decisions from your own analysis

A persuasive interpretation is still an actor interpretation.

Material divergence, missing peer evidence, unresolved Product meaning, or an unconfirmed acceptance boundary must not be silently promoted into a Principal decision or collective conclusion.

**Authority:** `foundations/multi-actor-repeatability-temporal-synchronization.md`; `foundations/principal-decision-surface.md`.

### 7. Reasoning is not authority

“What should happen?” and “May it happen now?” are different questions.

Conversation, recommendations, prompts, technical confidence, review dispositions, and actor prose are not authoritative execution state merely because they sound actionable.

**Authority:** `foundations/principal-decision-surface.md`; `README.md` Execution-Control Transition.

### 8. Do not disturb in-flight work just because another action is authorized

Before repository/workspace mutation, preserve material in-flight state: dirty trees, staged files, uncommitted candidates, branch divergence, frozen candidates, and concurrent actor work.

Authorization for one transition does not authorize reset, stash, overwrite, absorb, stage, commit, discard, or otherwise disturb pre-existing work.

**Evidence:** pending operating-model correction record where current; `foundations/multi-actor-repeatability-temporal-synchronization.md`.

### 9. Interruption creates no disposition

Actor or infrastructure interruption preserves the last authoritative workflow state.

An interrupted review is not ACCEPT, REJECT, retry authority, mutation permission, or permission for another actor to invent the missing disposition.

**Evidence:** BUG-021 interrupted Codex review; pending operating-model correction record where current.

### 10. Orthogonal completion does not erase another workflow head

Finishing one bounded task does not make another already-active workflow disappear.

Report the authoritative active state after the action completes. Do not emit `NEXT AUTHORIZED ACTION: NONE` merely because your local task is finished when another concrete workflow action remains outstanding.

**Evidence:** pending operating-model correction record where current.

### 11. Tests and conformance are not Product acceptance

A technically impressive candidate can still be the wrong Product.

Do not let test counts, architectural cleanliness, implementation completeness, or Codex approval become a proxy for Principal-visible acceptance.

**Evidence / authority:** `.kiro/steering/engineering-methodology.md`; `WARNING-operating-model-reality-report-FINAL.md`.

### 12. Do not leave deterministic consequences to probabilistic discretion

Where project authority defines a consequence as mechanically following from durable state, do not turn it back into “does this actor think it applies?”

Roadmap freshness is a canonical example: the Roadmap is a projection of governed meta-state, and freshness is a side effect of doing Wheelwright work correctly.

**Authority:** `bootstrap/project-memory-protocol.md`.

### 13. Do not patch the falsifier when the model is wrong

A concrete failing specimen is not necessarily the requirement.

Identify the invariant, authoritative evidence owner, provenance rules, temporal rules, and permitted transformations that generated the failure class. A local fix that passes the latest specimen may simply purchase the next rejection.

**Evidence:** `WARNING-operating-model-reality-report-FINAL.md`.

### 14. Do not make the Principal the human “continue” button

Explicit Principal authority is essential. Repeatedly asking the Principal to authorize another narrow pass through an unchanged rework topology is not evidence that the topology is healthy.

The goal is trustworthy progress with minimum sufficient coordination, not a governed death march.

**Evidence:** `WARNING-operating-model-reality-report-FINAL.md`; `foundations/multi-actor-repeatability-temporal-synchronization.md`.

---

## The recurring meta-failure

Wheelwright has repeatedly demonstrated this pattern:

> **The declarative rule exists. The actor can explain the rule. The workflow still crosses the boundary.**

Do not respond to that pattern primarily by writing more behavioral prose.

When a demonstrated failure recurs despite an existing rule, investigate whether the missing layer is explicit state, transition control, capability control, deterministic derived-state maintenance, or another enforceable mechanism.

> **Models reason. Durable state remembers. Deterministic mechanisms control consequential transitions. The Principal decides meaning.**

## Provenance, not duplication

This checksum deliberately stays short. It does not replace the underlying authority or evidence.

Start with:

- `docs/README.md` — authority root and routing.
- `docs/WARNING-operating-model-reality-report-FINAL.md` — detailed field-test evidence.
- `docs/foundations/principal-decision-surface.md` — reasoning/authority distinction and Principal-facing grammar.
- `docs/foundations/multi-actor-repeatability-temporal-synchronization.md` — synchronization, convergence, and execution ownership.
- `docs/bootstrap/project-memory-protocol.md` — durable memory and freshness discipline.
- current task/experiment state — the only relevant source for what is actually active now.

If a future incident demonstrates a genuinely new recurring failure mode, preserve the evidence first. Add it here only when doing so materially reduces the chance that a cold actor will repeat an already-paid-for mistake.
