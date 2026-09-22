# End-of-Session Protocol — Wheelwright

**Date:** September 22, 2026
**Status:** Ratified methodology
**Authority:** Category B — Ratified Methodology
**Related:** `bootstrap/project-memory-protocol.md`, `bootstrap/kiro-cold-start.md`, `foundations/principal-decision-surface.md`

---

## Purpose

This protocol is Wheelwright's **containing session-closeout process**. It owns the transition from an active authorized session/workstream to a durable, reconstructable handoff state.

The Project-Memory Protocol is a required component of this process; it is not the whole session-closeout process.

```
END-OF-SESSION PROTOCOL
    → establish repository and in-flight state
    → preserve unrelated in-flight work
    → complete authorized workstream closeout
        → PROJECT-MEMORY PROTOCOL
            → END-OF-WORKSTREAM MEMORY CHECK
    → synchronize required derived artifacts
    → run applicable verification
    → persist authorized closeout state
    → synchronize accepted main
    → report final SYNC and unresolved state
```

---

## Canonical Principal Invocation

The Principal command:

> **execute end of session protocol**

means:

> **Execute this protocol now, through completion.**

This exact phrase is an **imperative execution instruction**, not a request to explain the protocol, report a plan, enumerate intended steps, ask whether to proceed, or obtain another confirmation before ordinary closeout.

Equivalent unambiguous Principal wording such as “run the end-of-session protocol” or “close this session using the end-of-session protocol” has the same meaning. Actors must not require ritual wording when Principal intent to execute this protocol is clear.

After this command, **do not return control merely to ask “should I proceed?”** Proceed with all ordinary, scope-preserving closeout actions already authorized by the completed/active workstream and by the closeout rules below.

The invocation does **not** manufacture authority for new Product/architecture decisions, new work, scope expansion, retries of rejected/consumed implementation authority, or destructive treatment of unrelated work.

---

## Execution Contract

Once invoked, execute the following without an intermediate plan/approval round-trip:

1. **Establish current state.**
   - Inspect the current branch, working tree, staged/unstaged state, and remote/current-main relationship needed for safe closeout.
   - Distinguish work belonging to the closing workstream from unrelated or pre-existing in-flight work.

2. **Preserve unrelated in-flight work.**
   - Do not overwrite, discard, reset, normalize, stage, commit, or silently absorb unrelated work.
   - The mere existence of a dirty tree is **not** a reason to stop and ask the Principal what to do.
   - Isolate and work around unrelated state when that can be done safely.
   - Stop only when an actual provenance/collision ambiguity prevents safe closeout without a consequential choice.

3. **Execute the Project-Memory Protocol.**
   - Run the applicable `bootstrap/project-memory-protocol.md` reconciliation through its **End-of-Workstream Memory Check**.
   - Determine ordinary durable homes using the protocol; do not ask the Principal to choose a file or storage mechanism when existing governance already determines it.
   - Do not create a new Product/architecture decision, new `PL-*` intake, or other new governed commitment merely to make closeout look complete.

4. **Synchronize derived artifacts.**
   - Perform every required derived-artifact regeneration/freshness check triggered by the work, including the mandatory Roadmap projection rules in the Project-Memory Protocol.
   - Required scope-preserving regeneration is closeout, not a new work item.

5. **Verify the workstream.**
   - Run the applicable verification needed to establish that the accepted work and its closeout state remain sound.
   - Re-run checks when closeout mutations could have changed the result; do not substitute an old green result when current verification is required.

6. **Persist authorized closeout state.**
   - Commit/push the closing workstream and its ordinary scope-preserving reconciliation/persistence when that work is already authorized.
   - Stage deliberately. Do not sweep unrelated dirty state into the closeout commit.
   - Do **not** ask for a second Principal authorization merely to perform ordinary closeout persistence already carried by the work authorization and Project-Memory Protocol.

7. **Establish the durable handoff.**
   - Verify accepted `main` synchronization as applicable.
   - Establish the final accepted-main **SYNC SHA**.
   - Report what closed, the final SYNC, and any deliberately preserved unresolved/in-flight state.

---

## Continue Unless Genuinely Blocked

The default after invocation is **continue**.

Do **not** stop for:
- a plan review;
- permission to begin the protocol;
- ordinary project-memory reconciliation;
- choosing among durable homes already governed by repository authority;
- required derived-artifact regeneration;
- routine verification;
- ordinary scope-preserving commit/push;
- a dirty working tree that can be safely isolated;
- unrelated in-flight work that can be preserved without collision.

Stop and return to the Principal **only when completion actually requires**:
- a new Product or architecture decision;
- scope expansion or a new work item;
- resolution of genuinely ambiguous meaning;
- retry of rejected/consumed implementation authority;
- destructive or meaning-changing treatment of unrelated in-flight work;
- unresolved provenance/collision ambiguity that prevents safe isolation or persistence;
- another consequential boundary not already authorized.

When blocked, preserve all safely preservable state first, identify the exact blocking boundary, and ask only for the decision required to cross it. Do not turn the entire closeout back into a plan-approval ceremony.

---

## Relationship to the Project-Memory Protocol

`bootstrap/project-memory-protocol.md` governs durable project memory: retrieval, reconciliation, epistemic status, durable homes, Roadmap freshness, the End-of-Workstream Memory Check, and scope-preserving persistence.

This End-of-Session Protocol **contains and invokes** that methodology during session closeout, while additionally governing repository/in-flight-state preservation, verification, persistence sequencing, accepted-main synchronization, and final handoff.

Therefore:

> **End-of-Session Protocol contains Project-Memory Protocol closeout; Project-Memory Protocol does not replace End-of-Session Protocol.**

---

## Completion Condition

The protocol is complete only when either:

1. the authorized session/workstream has reached a durable, verified, synchronized handoff state and the final SYNC is reported; **or**
2. a genuine consequential boundary listed above prevents completion, all safely preservable state has been preserved, and the exact Principal decision required to continue is surfaced.

A report of intended steps is not completion. A request to proceed is not completion. Project-memory reconciliation without persistence/synchronization is not completion.
