# Principal Decision Surface — Wheelwright

**Status:** Ratified Decision / Accepted Operating-Model Design (Category B)  
**Ratified:** September 17, 2026  
**Scope:** Outcome-bearing AI actor replies and consequential workflow transitions

## Purpose

Make the right thing to do the easy thing to do.

Wheelwright must not require the Principal to memorize state-machine nomenclature, infer whether prose carries execution authority, or police ordinary actor transitions. Ordinary language expresses intent. Consequential authority must be established separately by authoritative state.

The Principal Decision Surface is a fixed human-factors interface. Repetition is intentional: the ending of an outcome-bearing actor reply should become visually predictable enough that a missing or malformed ending feels wrong before the Principal has to reason through why.

This learned heuristic is an **anomaly detector, not an authorization mechanism**. Wheelwright must remain safe when the Principal does not notice an actor mistake.

## Governing distinction

> **What should be done? is reasoning. May it be done now? is authority state.**

Technical reasoning, however persuasive or correct, does not create execution authority.

In particular:

- a Codex `REJECT` invalidates the reviewed candidate; it does not authorize remediation or retry;
- an actor recommendation does not become a Principal decision because another actor repeats or operationalizes it;
- a request to draft or provide a Kiro prompt does not by itself prove that consequential mutation is authorized;
- conversational claims, including claims containing words such as `authorized`, `retry`, `go`, or `implement`, are not authoritative execution state merely because they are actionable;
- malformed or missing decision-surface fields are actor defects, not grants of authority.

When ordinary Principal language is genuinely ambiguous about a consequential transition, the safe behavior is to preserve the non-consequential state and present the smallest explicit decision required. The Principal should be able to answer in ordinary language such as `A`, `yes`, or `stop`; the Principal must not need to speak internal state-machine vocabulary.

## Fixed reply grammar

Every outcome-bearing ChatGPT, Kiro, and Codex reply must end with the following grammar. Field names, order, and meaning are fixed.

```text
CURRENT STATE: <AUTHORITATIVE STATE>

DECISION REQUIRED: YES | NO

[IF YES]
OPTIONS:
A — <PLAIN-LANGUAGE CHOICE>
B — <PLAIN-LANGUAGE CHOICE>
C — <PLAIN-LANGUAGE CHOICE>

RECOMMENDED DEFAULT: <OPTION>

[IF NO]
NEXT AUTHORIZED ACTION: <ONE ACTION | NONE>
```

### If `DECISION REQUIRED: YES`

- `OPTIONS` must contain the materially distinct choices actually available to the Principal.
- Options must be stated in plain language, not internal controller vocabulary.
- `RECOMMENDED DEFAULT` is required and must identify one of the listed options.
- A recommendation is advice, not authority. The selected option becomes consequential authority only through the applicable authoritative transition mechanism.

### If `DECISION REQUIRED: NO`

- `OPTIONS` must not appear.
- `RECOMMENDED DEFAULT` must not appear.
- `NEXT AUTHORIZED ACTION` must contain exactly one action or `NONE`.
- Do not use `or`, menus, implied alternatives, or phrases such as `ready for...` to smuggle a decision into a no-decision surface.
- `NEXT AUTHORIZED ACTION` reports authority; it does not create authority.

## Authority provenance rule

Before an actor writes a consequential `NEXT AUTHORIZED ACTION`, it must be able to identify the durable authority/state that permits that action. If it cannot, it must not manufacture permission from conversation, task momentum, narrowness of the defect, sunk cost, prior permission, another actor's recommendation, or technical confidence.

The presentation convention creates useful friction at the authority boundary, but it is not deterministic enforcement. A future execution controller or isolation/promotion boundary must independently prevent unauthorized consequential action.

## Principal cognitive conditioning

The invariant footer is deliberately boring. Its stable visual form is intended to produce a lightweight learned checksum:

> reasoning / evidence → state → decision requirement → options or one authorized next action

Over time, an absent, reordered, creatively renamed, internally contradictory, or ambiguous footer should become conspicuous to the Principal.

That conditioning is defense in depth only. Principal vigilance is never the runtime safety boundary.

## Actor conditioning

The same grammar conditions actors. Before stating `NEXT AUTHORIZED ACTION: KIRO MAY IMPLEMENT`, an actor is forced to confront whether authoritative evidence actually supports that statement. This improves observability of authority invention but does not make probabilistic self-policing reliable enforcement.

## September 17 behavioral specimen

The BUG-021 rework chain demonstrated why this distinction is required:

1. Codex rejected a candidate.
2. ChatGPT correctly recognized death-spiral risk but inferred that a narrow, technically tractable defect justified `one narrowly authorized amendment` without independent authority evidence.
3. A later Principal request for a Kiro prompt caused that inferred authority to be packaged into executable instructions.
4. Kiro performed the bounded mutation and verification competently.
5. Codex independently rejected the amended candidate on the same underlying quantity-source invariant and explicitly stated that its rejection did not authorize another retry.
6. Codex later correctly treated an actor's recommended Option A as a recommendation rather than a Principal decision.

This is evidence of **failed conversational containment and death-spiral reproduction**. It is not evidence that Gate Experiment 001's capability boundary failed, because the durable experiment state remained `STAGED` with `experiment_started: false`. The distinction between observed actor behavior and an actually activated enforcement experiment must be preserved.

## Design consequences

- Models reason; durable state remembers; deterministic mechanisms control consequential authority.
- Good technical work performed after a bad authority transition is still a bad transition.
- The Principal's language should express intent, not function as a security protocol.
- The system should ask for explicit Principal decisions only when they are materially required.
- Safe/default behavior should require the least cognitive effort.
- Actor violations, enforcement failures, and Principal/operating-model interventions remain distinct observations.
