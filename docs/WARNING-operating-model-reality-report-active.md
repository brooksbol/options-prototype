# ⚠ ACTIVE WARNING — Wheelwright Operating Model Reality Report

> **STATUS: INCOMPLETE / ACTIVE DIAGNOSTIC — DO NOT ARCHIVE OR TREAT AS RESOLVED**
>
> **Fixing BUG-021 does not close this report. BUG-021 is the controlled specimen. The subject of this investigation is Wheelwright's execution system.**
>
> This report is intentionally persisted while the field test is still running so that context loss cannot erase the evidence. It is part root-cause analysis and part operating-model reality report. Observations below are evidence from the active field test; diagnoses and possible remedies remain hypotheses unless separately ratified by the Principal.

**Field-test baseline accepted main:** `9f10ba3de8c40aaf87e5bc2250aace6c1456cdc8`

## 1. Why BUG-021 was selected

BUG-021 was incidental. It was deliberately selected because it appeared to be a small, concrete defect: a Fidelity buy-to-close transaction was classified as a generic asset purchase / `CAPITAL_DEPLOYMENT` instead of closure/reduction of an existing short-option obligation.

We did **not** deliberately select a major architecture change, generalized lifecycle engine, Product redesign, brokerage ledger, or difficult open-ended domain problem. The expectation was that BUG-021 would provide a relatively clean field test of the execution controls Wheelwright had just spent substantial effort establishing.

Instead, a nominally small repair produced hours of implementation, review, rejection, amendment, regression, documentation correction, and reimplementation.

> **BUG-021 was not the subject of the experiment. It was deliberately chosen as a small specimen with which to test the operating model. The operating model itself became the subject when a nominally narrow task generated hours of rework despite newly ratified controls intended specifically to prevent that pattern.**

The eventual report must not rationalize the result merely as "BUG-021 turned out to be complicated." A central RCA question is why its complexity was discovered incrementally after implementation began rather than during required preimplementation reasoning and outcome confirmation.

## 2. Principal result so far

Wheelwright has substantially improved its **declarative discipline**. It now has explicit rules concerning authority, cold starts, Shared Execution, options-domain competence, mechanics/evidence/policy separation, specimens, Product observation, STOP conditions, `NOT VERIFIED`, Principal authority, evidence quality, handoffs, and regression ratchets.

Yet this field test does not currently demonstrate corresponding improvement in execution.

> **Wheelwright appears to have adequate declarative constraints but inadequate transition controls.**

The problem increasingly is not that actors do not know what the rules say. The problem is that nothing reliably prevents them from crossing critical workflow boundaries without satisfying those rules.

Important transitions include:

- interpretation → implementation;
- implementation → completion claim;
- review rejection → remediation / expanded implementation;
- review → Principal acceptance.

Actors repeatedly read, quote, and correctly describe relevant contracts while proceeding in ways those contracts were intended to prevent.

## 3. Clearest example: the Principal-confirmation gate

The Shared Execution Contract explicitly requires, **before substantial implementation**:

- a concrete positive specimen;
- a materially useful negative specimen;
- expected operator-visible results;
- Principal confirmation or replacement of those expectations.

Actor interpretations remain proposals until confirmed. This was deliberately installed to prevent precisely the behavior being observed.

Yet during BUG-021 implementation/amendment cycles, the workflow repeatedly proceeded into substantial implementation **without obtaining Principal confirmation of the expected outcomes**.

Kiro repeatedly accepts reviewer/synthesizer interpretations itself, for example: "This is correct and I accept it." That is not Principal confirmation. Asking the Principal for permission to commit after implementation is also not equivalent to obtaining Principal confirmation before implementation.

ChatGPT has repeatedly refined acceptance criteria and generated increasingly detailed Kiro instructions without returning those proposed outcomes to the Principal for confirmation.

The system therefore possesses the gate semantically while behaving as though the gate does not exist operationally.

## 4. The death spiral

The recurring topology is now observable:

> **Kiro implements → Codex falsifies → ChatGPT elaborates → Kiro implements more → Codex falsifies → ChatGPT elaborates more → ...**

The Principal is conspicuously absent from the semantic transitions inside that loop, not because the Principal is unavailable, but because actors continue negotiating and expanding the acceptance boundary among themselves.

> **The death spiral is an emergent property of competent actors compensating for one another after a failed transition.**

Codex is good at finding counterexamples. ChatGPT is good at synthesizing those counterexamples into coherent requirements. Kiro is capable of implementing those requirements. Each actor can therefore be locally useful while the system as a whole becomes slower, more expensive, and increasingly elaborate.

## 5. Requirement accretion and rework amplification

It would be inaccurate to call everything that followed random scope creep. Most added work remains causally connected to BUG-021.

A better diagnosis is:

> **Rework amplification caused by discovering the correct semantic boundary incrementally after implementation began.**

The nominally small BTC defect has already led into BTC PUT/CALL classification, signed closing cash, recognized short association, quantity reconciliation, missing-cash uncertainty, missing-quantity uncertainty, Product close chapters, partial-close semantics, repeated BTC identity, cross-month reporting, temporal causality, future-opening backfill, prior expiration/assignment, same-day ambiguity, historical uncertainty propagation, dated opening evidence, terminal-resolution quantity, backend/frontend semantic authority, repeated documentation correction, and substantial new test specimens.

Most of those concerns are legitimate consequences of making the original outcome true. That is precisely why this is useful operating-model evidence.

## 6. Patching falsifiers instead of internalizing invariants

A recurring Kiro behavior is now visible: Codex supplies a counterexample; Kiro repairs that counterexample; the next Codex run demonstrates another consequence of the same underlying invariant.

Examples:

- **Quantity without temporality:** quantity reconciliation used aggregate quantities over history, allowing a future STO to validate an earlier BTC.
- **Per-event BTC without per-event opening evidence:** BTC identity was preserved individually while opening evidence remained collapsed, allowing later STO quantity to leak backward.
- **Current uncertainty without historical uncertainty propagation:** missing quantity on the current BTC was flagged, but a prior unknown-quantity BTC effectively consumed zero, allowing later false certainty.

> **The actors are frequently patching the falsifier rather than internalizing the invariant that generated the falsifier.**

This is not primarily a missing-test problem.

## 7. Contract recital without behavioral compliance

Kiro often states the correct principle immediately before or after implementing something that violates it. It has correctly distinguished "the BTC debit reduces period option economics" from "the BTC retired a recognized short obligation," and correctly acknowledged "quantity reconciliation without temporal reconciliation" after Codex exposed the problem.

The contracts are demonstrably influencing **language and diagnosis**. They are not yet demonstrably constraining **the next implementation decision**.

> **The contracts appear to have improved the system's ability to describe failures after they occur more than they have improved first-pass execution.**

## 8. Actor reality — Kiro

Recurring observed failure patterns:

- **Acceptance-boundary mutation:** a narrower implementation is built and the acceptance meaning is progressively interpreted around what was implemented.
- **Evidence/lifecycle collapse:** known executed cash, recognized obligation, quantity, timing, and lifecycle association repeatedly support stronger conclusions than the evidence warrants.
- **Product verification failures:** the first candidate corrected backend arithmetic while Principal-visible Economic Activity still omitted BTC.
- **Temporal causality failures:** future events were allowed to validate prior conclusions.
- **Event-identity compression:** multiple BTCs were collapsed into scalar state before later being restored individually.
- **Quantity-evidence failures:** unknown quantity has repeatedly been capable of behaving like zero quantity.
- **Completion overclaims:** iterations ended with statements such as "The bounded amendment is complete" and "The second bounded amendment is complete" followed quickly by independent blocking falsification.
- **Contract recital without behavioral compliance.**
- **Repeated implementation without Principal-confirmed outcome boundary.**

This is not evidence that Kiro is incapable of engineering work. Much of the implementation is sophisticated and locally defensible. Local competence permits the workflow to travel a long way down the wrong execution path.

## 9. Actor reality — Codex

Codex has been the strongest actor in this field test so far. It independently falsified unmatched BTC certainty, over-close certainty, missing contract identity, missing cash reconciliation, missing Product presentation, future-opening backfill, repeated-close collapse, cross-month disappearance, missing quantity, partial-close presentation, collapsed opening evidence, terminal-resolution quantity loss, and historical uncertainty disappearance.

It has frequently found these failures quickly after expensive Kiro implementation. That independence is evidence **for retaining independent adversarial review**. The multi-actor model is therefore not shown to be fundamentally wrong merely because the current topology is failing.

Important correction: do **not** claim Codex failed to understand the Principal-visible-outcome requirement. Codex explicitly used `REJECT — PRINCIPAL-VISIBLE OUTCOME STILL WRONG` and consistently tested Product-visible consequences. "Principal-visible outcome" is not identical to "Principal-confirmed expected outcome." We have not established that Codex was ignorant of the latter requirement.

A narrower question remains: should Codex have treated absence of recorded Principal confirmation as a blocking procedural defect? Another legitimate retrospective question is whether earlier review passes could reasonably have found some temporal/repeated-event failures sooner. Current evidence primarily shows Codex functioning effectively as a **postimplementation falsifier**.

## 10. Actor reality — ChatGPT

ChatGPT has produced strong domain and architectural synthesis. It correctly separated known closing cash from lifecycle association, identified temporal reconciliation, identified uncertainty propagation, and eventually recognized competing backend/frontend lifecycle authority.

But ChatGPT has also become part of the death spiral.

Observed failures:

- **Insufficient initial Product observation:** the first independent run reasoned heavily from code paths without exercising the earliest reachable Principal-visible Product surface as required.
- **Role drift:** instead of remaining synthesizer/challenger, ChatGPT repeatedly authored detailed Kiro implementation instructions.
- **Automatic compensation:** Codex discovers a defect; ChatGPT translates it into increasingly elaborate requirements for Kiro.
- **Principal-confirmation bypass:** ChatGPT repeatedly generated/refined acceptance boundaries without first returning proposed outcomes to the Principal for confirmation.
- **Requirement accretion:** the latest synthesis grew into an eleven-section "third bounded amendment."
- **Premature convergence language:** for example, "The encouraging part is that the core BTC economics are no longer the problem. The remaining problem is narrower and conceptually clean..." Similar convergence language preceded additional fundamental findings.

> **ChatGPT's ability to compensate for Kiro's execution failures may mask the fact that the operating model itself failed.**

This is a major operating-model finding, not a footnote about ChatGPT performance.

## 11. The multi-actor model itself

There is not yet evidence that independent actors are inherently the wrong model. The intended separation remains sensible:

- **ChatGPT:** reasoning, synthesis, architectural challenge;
- **Kiro:** implementation authority;
- **Codex:** independent adversarial falsification;
- **Principal:** final product/architectural authority.

Codex has demonstrated why independence is useful. The problem is the **feedback topology**.

Current reality resembles:

> Principal → interpretation → Kiro implementation → Codex rejection → ChatGPT elaboration → Kiro reimplementation → Codex rejection → ChatGPT elaboration → ...

Downstream actors repair upstream execution failures rather than returning the workflow to the state transition that failed. Consequences include requirement accretion, rework amplification, weak accountability, semantic negotiation without Principal confirmation, increasing implementation/test/documentation surface, and increasing cost.

A potential better topology to investigate — **not yet ratified** — is:

> **Principal-confirmed outcome → implementation → independent falsification → Principal acceptance**

ChatGPT's highest leverage may be before implementation: expose semantic choices and obtain Principal confirmation. A rejection should perhaps **invalidate the current execution state** rather than automatically authorize another implementation cycle. The reviewer would identify which earlier state failed — interpretation, domain grounding, Principal confirmation, implementation, or observation — and control would return there.

## 12. The missing transition control

The most important question is no longer "What guardrails should we add?"

It is:

> **Why did an explicit existing guardrail fail to change actor behavior, and what is the smallest mechanism that makes compliance observable before expensive work begins?**

If the answer is simply more prose, another checklist, more STOP language, or another contract document, the underlying problem probably remains. The contracts already contain the relevant ideas. The missing capability appears to be **transition enforcement**.

## 13. Temporary fifth diagnostic actor

This field test has effectively introduced a fifth actor. It is not another reviewer of BUG-021. It observes the **four-actor operating system itself**: contract adherence, required transitions, where scope/rework enters, who catches failures, work performed before detection, whether contracts alter behavior or merely improve post-hoc language, actor compensation, and whether the Principal becomes the runtime compliance monitor.

> **The fifth actor is diagnostic instrumentation, not a proposed permanent governance layer. Its success criterion is that the improvements it identifies make continuous fifth-actor monitoring unnecessary.**

If the eventual remedy is "add another permanent AI reviewer to keep everyone honest," the underlying system has not been fixed.

> **The Principal should not have to become the runtime compliance monitor for the operating model.**

The Principal has personally had to notice the missing confirmation gate, spiraling costs, recurring known-red test, distinctions in Codex wording, and repeated execution topology. That is not a scalable operating model.

## 14. Execution economics

This field test must include cost, not just correctness.

Known measured corrective Kiro runs:

| Cycle | Credits | Time |
|---|---:|---:|
| Kiro amendment #1 | 64.99 | 35m 40s |
| Kiro amendment #2 | 56.86 | 31m 26s |
| **Measured corrective total** | **121.85** | **67m 06s** |

This excludes the original Kiro implementation, Codex reviews, ChatGPT synthesis, current/future amendment work, Principal attention, repeated full regression, and orchestration overhead.

One Codex rejection after the first major amendment took only **2m 24s**. Expensive implementation is repeatedly followed by relatively cheap falsification.

The Shared Execution Contract itself says effectiveness should be judged partly by elapsed time and credits to observable evidence. These numbers are direct contract-effectiveness evidence.

## 15. Regression latency

Wheelwright expects actors to run full regression after mutative work. That is correct engineering discipline. The problem is not that Kiro runs full regression. The problem is that the suite is sufficiently slow that every unnecessary implementation cycle carries a substantial latency tax.

> **Wheelwright's regression suite is too slow for the development model Wheelwright expects actors to follow.**

This is separate from the operating-model failure:

- **Operating-model problem:** unnecessary implementation/reimplementation cycles occur because transitions are not enforced.
- **Engineering-system problem:** each cycle is expensive because normal verification is slow.

They multiply. The existing parking-lot regression-optimization work should be understood as an **execution-economics constraint on the multi-actor model**, not merely developer-experience polish. Do not solve it by discouraging full regression.

## 16. Permanently known-red regression

The same frontend failure has appeared repeatedly:

`Full frontend: 1721 pass, 1 failure — the same pre-existing multi-expiration.test.ts date-relative snapshot...`

The local decision each time is defensible: it is unrelated to BUG-021 and already fails on clean main. Systemically, however, every actor proves "I didn't cause this" while nobody owns "Why is the full regression suite permanently red?"

This creates repeated cognitive/explanation cost, weakens the meaning of "full regression," creates noise capable of hiding future regressions, and normalizes technical friction.

The missing operating behavior appears to be:

> **Encounter recurring known defect → do not silently absorb it → route durably to owner/work queue → repeated encounters increase priority rather than merely repeating the waiver.**

Kiro should not spontaneously expand BUG-021 to fix an unrelated test; that would violate scope discipline. Wheelwright instead needs a **friction ratchet** so recurring known failures do not become permanent background noise.

## 17. New architectural warning: competing lifecycle authority

The latest Codex review identified an additional systemic concern: backend and frontend independently determine the same economic relationship — what recognized short obligation a BTC retired — and they have already disagreed.

This is not merely another BUG-021 edge case. It is evidence that duplicated semantic authority can cause Product and backend to derive different lifecycle truths. ChatGPT correctly recognized this as potentially conflicting with ADR-016.

Whether the eventual solution is backend authority or another bounded mechanism remains an implementation/architecture decision. The diagnostic finding is:

> **Wheelwright created competing implementations of an economically load-bearing conclusion, and independent review demonstrated actual semantic divergence between them.**

This belongs in the reality report regardless of the eventual BUG-021 repair.

## 18. Critical counterfactual

A question that must survive into the final RCA:

> **Had the existing Principal-confirmation gate actually been enforced before BUG-021 implementation, how much of the subsequent implementation/rejection/reimplementation work would have been unnecessary?**

The exact number is unknowable. But preimplementation outcome work might have surfaced known cash versus recognized lifecycle, unmatched BTC, partial BTC, quantity uncertainty, temporal ordering, future-opening prohibition, repeated closes, reporting-period identity, terminal resolution, and Product presentation.

If most would have emerged then, much measured cost is avoidable rework caused by a failed transition. If they could not reasonably have emerged, that weakens the diagnosis. The field test should answer honestly rather than assume it.

## 19. What this says about the new contracts

Current evidence does **not** support: "The new contracts fixed Wheelwright's execution problems."

It supports something narrower:

> **The contracts improved shared vocabulary, diagnostic quality, and adversarial review.**

Codex reviews are unusually precise. ChatGPT can articulate the domain distinction clearly. Kiro can recognize exactly what it got wrong after falsification. That is meaningful progress.

But evidence so far suggests:

> **The contracts are better at helping actors explain failure than preventing actors from entering the failure state.**

## 20. What not to conclude yet

Do not prematurely conclude:

- **BUG-021 requires a generalized lifecycle engine.** No evidence establishes that.
- **The four-actor model is fundamentally wrong.** Independent falsification has demonstrated substantial value.
- **Codex is the solution.** Codex currently catches expensive mistakes after they occur.
- **We need more contracts.** Existing contracts already contain several violated principles.
- **We need a permanent fifth actor.** That would institutionalize compensation instead of fixing execution.
- **BUG-021 became complicated, therefore the field test tells us nothing.** Its evolution is itself central evidence.
- **The latest amendment is probably the last.** Repeated premature convergence makes that unsupported until adversarial evidence establishes it.

## 21. Current root-cause hierarchy

### Primary — Execution failure

Actors do not consistently allow governing invariants to constrain the next implementation decision. Kiro repeatedly builds a plausible implementation, proves it against locally constructed tests, and then overstates what has actually been established.

### Secondary — Enforcement architecture / transition-control failure

Mandatory workflow provisions exist as semantic obligations but are not enforced at the moment actors cross state boundaries. Principal confirmation is the clearest example.

### Tertiary — Multi-actor compensation / rework amplification

Downstream actors compensate for upstream failure: Codex falsifies → ChatGPT specifies → Kiro implements. This makes the system capable of eventually converging while making it expensive and obscuring accountability.

### Multipliers — Engineering friction

Slow full regression and normalized known-red tests increase the cost of every unnecessary cycle.

## 22. What prevention must eventually demonstrate

Any eventual operating-model change should answer:

- What exact behavior changes — not merely what document changes?
- At what transition is it enforced?
- How can we observe that it happened?
- How can an actor tell it cannot proceed?
- How does rejection return the workflow to the correct prior state?
- How do we prevent downstream actors from silently authorizing expanded implementation?
- How do we preserve Principal authority without making the Principal the compliance officer?
- How do we know the mechanism reduced rework rather than merely adding ceremony?
- Can the normal four-actor system operate correctly without the fifth diagnostic actor continuously watching it?

## 23. Conditions for closing the eventual warning

Fixing BUG-021 should **not** retire this report. The warning should remain visible until there is evidence that the operating-model problem itself has changed.

Potential evidence might eventually include:

- Principal-confirmed outcomes actually recorded before implementation;
- actors demonstrably prevented from crossing required transitions;
- rejection returning work to a defined prior state rather than automatically triggering another amendment;
- materially lower rework on subsequent bounded specimens;
- fewer Principal-discovered compliance failures;
- reduced credits/time to first trustworthy Product evidence;
- no requirement for continuous fifth-actor monitoring;
- recurring engineering friction being durably ratcheted rather than repeatedly waived.

These are working criteria, not yet ratified requirements.

## 24. Current warning statement

> **Wheelwright's contracts can currently be read, quoted, tested against, and still bypassed at the moment of execution. During the BUG-021 field test, competent actors repeatedly compensated for one another after failed transitions: Kiro implemented locally plausible semantics, Codex cheaply falsified them, ChatGPT translated the failures into larger implementation specifications, and Kiro implemented again — while the required Principal-confirmation boundary remained bypassed. The result was substantial rework on a deliberately small specimen. Do not mistake increasingly sophisticated remediation for evidence that the operating model is working.**

---

## Active-field-test continuation note

This document is deliberately incomplete. Continue adding observations while the BUG-021 field test and associated actor behavior remain under observation. Preserve distinctions among:

1. **Observed evidence** — what actors actually did, claimed, measured, or falsified.
2. **Diagnosis / hypothesis** — explanations for why the observed behavior occurred.
3. **Possible remedy** — mechanisms worth evaluating; these are not ratified architecture merely because they appear here.

Do not close, archive, downgrade, or treat this warning as resolved merely because BUG-021 itself is fixed. The operating-model issue requires independent evidence of changed execution behavior.

## 25. Directives for the corrective actor retrospective

When this field test reaches the cross-actor retrospective, the actors are **not** being asked to litigate or defend their individual performance. The evidence above is the starting point. The purpose of the exercise is to design the observed pathologies out of Wheelwright.

### Directive 1 — Do not defend yourself

Do not spend the retrospective explaining why an action was locally reasonable, why tests passed, why scope appeared bounded, why information was unavailable at the time, or why another actor should have caught something sooner. Those facts may be relevant evidence, but defensive narratives are not the requested output.

> **Treat the observed failures as established evidence. Spend the effort on prevention, not rationalization.**

### Directive 2 — Propose ways to eliminate the pathologies

Do not merely produce "lessons learned," reminders, or additional prose obligations. Wheelwright already contains substantial declarative guidance that actors were able to read and recite without reliably changing execution behavior.

For each important pathology, propose a mechanism that makes recurrence difficult or impossible. Prefer **removing failure-producing degrees of freedom over adding instructions**. Candidate mechanisms may include explicit state transitions, executable gates, authority ownership, automatic routing, fail-closed transitions, required durable evidence, or other structural controls.

Every proposed corrective mechanism must answer:

- What exact behavior changes?
- At what workflow transition is it enforced?
- What prevents or visibly marks noncompliant progression?
- How does the mechanism preserve Principal authority without making the Principal a runtime compliance monitor?
- How would another deliberately small Wheelwright task falsify the claim that the mechanism works?
- How will Wheelwright distinguish genuine improvement from added ceremony?

Examples of inadequate remedies include "actors should remember to ask the Principal," "Kiro should reason about invariants," "ChatGPT should stay in its lane," or "Codex should keep reviewing." Those restate desired behavior without making it structural.

### Directive 3 — Do not design a better BUG-021 process

> **Do not design a better process for fixing BUG-021. That opportunity has passed. We are in damage-control mode on BUG-021. Finish it safely, but do not mistake making this specimen finally work for correcting the operating model.**

The retrospective is counterfactual and forward-looking:

> **What must change so that the next supposedly small Wheelwright task does not produce this pathology?**

BUG-021 supplies evidence. It is not the target for the operating-model remedy. Do not respond by creating a more rigorous options-lifecycle-defect workflow, a BTC-specific process, or another procedure optimized for the exact semantic discoveries made during this incident.

A useful filter is:

> **A proposal that would have made this particular BTC implementation easier but would not materially change the execution trajectory of an unrelated small Wheelwright task is not an operating-model remedy.**

The desired retrospective posture is therefore:

> **Here is what happened. Do not litigate it. Design it out of the system.**
