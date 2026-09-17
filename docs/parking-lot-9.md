# Project Parking Lot — Continuation 9

> This file is a physical continuation of `docs/parking-lot.md` through `docs/parking-lot-8.md`. Together, all `docs/parking-lot*.md` files constitute **one logical Wheelwright parking lot**.

**Started:** September 17, 2026  
**Status:** Canonical Project / Operational State (Category C), same authority and governance as the preceding parking-lot files  
**Governing intake method:** `docs/foundations/idea-intake-reconciliation.md`

---

## `PL-ACTOR-01` — Remove the Principal as Human Clipboard While Preserving Principal Authority

**Date:** September 17, 2026  
**State:** INTAKE — new canonical identity created; discussion preserved only; not reconciled, decomposed, designed, selected for implementation, or authorized for implementation  
**Trigger:** Live multi-actor Wheelwright operation during BUG-021 exposed that the Principal is currently the physical message bus among ChatGPT, Kiro, and Codex: copying prompts, results, reviews, and responses between otherwise independent actors.

### What was discovered

The current operating model deliberately preserves Principal authority at consequential boundaries, but transport between actors is largely manual. In normal operation the Principal repeatedly performs handoffs such as:

- ChatGPT prepares a Kiro prompt → Principal pastes it into Kiro;
- Kiro executes and reports → Principal pastes Kiro's response into ChatGPT;
- ChatGPT prepares a Codex review prompt → Principal pastes it into Codex;
- Codex returns review evidence → Principal pastes Codex's response into ChatGPT.

This makes the Principal an accidental **human clipboard / physical message bus**. That transport burden is distinct from the Principal's legitimate authority role.

The desired conceptual separation discovered in discussion is:

> **The Principal owns authority. The system owns transport.**

The Principal does **not** want to surrender Product judgment or consequential authority merely to remove manual copying. The idea is to investigate whether actor-to-actor transport can become automatic while actors continue to stop at genuine authority boundaries so the Principal can exercise judgment.

### Candidate operating shape discussed — not a decision

A useful shorthand that emerged was:

> **Automatic transport, actor-directed workflow, Principal-held authority, mechanical backstop.**

This is discovery language, not accepted architecture.

The discussion distinguished two orthogonal permissions:

1. **Transport permission** — whether one actor can deliver evidence, prompts, state, or results to another actor.
2. **Execution / transition authority** — whether the receiving actor may perform a consequential transition.

Automatic delivery must not itself confer execution authority.

### Likely integration paths — topology intentionally unresolved

The likely communication graph among the three working AI actors was identified as a complete bidirectional triangle:

- ChatGPT ↔ Kiro
- ChatGPT ↔ Codex
- Kiro ↔ Codex

This records **integration paths only**. It makes no implementation commitment. It does not imply six bespoke integrations, a shared broker, a controller, direct APIs, MCP, or any other topology.

### MCP discussion — candidate technology only

Model Context Protocol (MCP) was identified as a technology worth investigating for transport and/or capability access. No decision was made to use MCP.

The important distinction preserved from the discussion is:

- MCP or another protocol could help with transport/capability access;
- Wheelwright's authority model would still determine permitted transitions;
- the Principal would still own Product/authority judgments except where authority is explicitly delegated;
- actor communication must not be mistaken for authority creation.

### Concurrency pressure discovered during the same discussion

Removing the human clipboard may expose or accelerate a separate operating-model question already visible in the current manual regime: two actors can report incompatible `NEXT AUTHORIZED ACTION`s.

Working name from the discussion:

> **Concurrent Next-Action Conflict:** two actors, operating legitimately from their available state, report different consequential `NEXT AUTHORIZED ACTION`s that cannot both be executed consistently.

Two cases must remain distinct:

1. **Stale-state conflict:** the actors reasoned from different authoritative snapshots; reacquiring current state may eliminate the apparent conflict.
2. **Same-state conflict:** incompatible proposed next actions survive after both actors reacquire the same current authoritative state. This is a genuine adjudication problem.

The unresolved question is:

> **When two actors propose incompatible next actions against the same current authoritative state, what adjudication mechanism determines the workflow head?**

### Tiebreaking / delegation discussion — explicitly unresolved

Possibilities discussed, but not selected:

- Principal acts as tiebreaker when a genuine same-state conflict reaches an authority boundary;
- ChatGPT could act as a Principal proxy for a precisely defined class of conflicts under explicit delegated authority;
- deterministic machinery could provide serialization/conflict detection/backstop behavior without replacing actor reasoning or Principal judgment.

No hierarchy such as `Principal > ChatGPT > Kiro > Codex` has been invented or accepted. In particular, actor independence — including Codex's role as independent falsifier — should not be casually collapsed into a permanent hierarchy.

If delegated Principal authority is ever explored, its scope and limits would need to be explicit so that "proxy" does not become authority leakage.

### Live evidence that motivated preserving the idea

The BUG-021 workflow supplied several concrete observations:

- repeated manual prompt/result copying made the Principal's transport burden visible;
- the Principal-facing Decision Surface discussion showed that many immediate human actions are currently variations of "paste this there";
- a fifth diagnostic actor was able to advance orthogonal durable documentation on `main` while Kiro's candidate remained frozen and Codex review was interrupted, demonstrating that actor concurrency and authoritative-state movement are real rather than hypothetical;
- Codex usage exhaustion interrupted review without changing the candidate's authority state, reinforcing that transport/execution availability and authority state are separate concerns.

These observations motivate investigation. They do not establish a solution.

### Why it might matter

If transport can be separated cleanly from authority, Wheelwright may be able to reduce low-value Principal attention spent moving messages while preserving the high-value human role: deciding Product meaning, scope, acceptance, sequencing, economic commitment, and other consequential boundaries.

A successful design should make the Principal intervene because judgment is required, not because two software actors cannot deliver messages to each other.

### Related current authority / concepts

- `docs/foundations/principal-decision-surface.md` — current Principal-facing outcome/decision surface.
- `docs/foundations/three-actor-model.md` — actor-role context.
- `docs/bootstrap/project-memory-protocol.md` — durable state and authorization discipline.
- `docs/foundations/shared-execution-contract.md` — suspended runtime-control attempt; useful warning against mistaking prose for enforcement.
- `docs/experiments/ww-gate-experiment-001.md` and its state record — capability-boundary experiment, currently distinct from this idea.
- `docs/experiments/operating-model-pending-corrections-2026-09-17.md` — narrow pending corrections learned from the current live workflow; not a substitute for this broader transport idea.

### What remains unresolved

- Whether automatic actor transport is desirable across every integration path or only selected handoffs.
- Whether transport should be direct, brokered, controller-mediated, MCP-based, or use another mechanism.
- How actor identity, message provenance, state/version identity, delivery acknowledgement, and replay/idempotency should work.
- How a receiving actor proves that a delivered message carries evidence but not authority unless durable authority independently permits the transition.
- Whether there must be one authoritative workflow head, and if so where that state lives.
- How same-state next-action conflicts are detected and adjudicated.
- Whether any Principal authority should ever be delegated to ChatGPT or another actor, and under what exact limits.
- How to preserve Codex independence if transport becomes automatic.
- What deterministic backstop is required if an actor fails to stop at an authority boundary.
- Whether MCP is useful, sufficient for any transport layer, or irrelevant after deeper investigation.

### Explicitly not authorized

This intake does **not** authorize:

- implementation of actor-to-actor transport;
- MCP adoption or integration;
- creation of a controller, broker, workflow engine, or new authority service;
- delegation of Principal authority;
- invention of a permanent actor hierarchy;
- changes to current actor roles;
- changes to Gate Experiment 001;
- changes to the active BUG-021 workflow or frozen candidate;
- automatic execution following actor-to-actor delivery;
- roadmap or architecture changes.

### Parking-lot disposition / mapping

**New canonical identity `PL-ACTOR-01` retained at INTAKE.** Repository search found no existing `PL-*` identity owning the specific concern of removing the Principal's manual actor-to-actor transport burden while preserving Principal authority. This is broader than the pending narrow Decision Surface corrections and is not a defect record.

### Why-state

The material discussion is preserved in this intake record so that the concept can survive cold start without reconstructing the conversation. No additional discovery document is required at intake unless later exploration becomes too rich for this canonical record.

### Next authorized mode

**Further exploration only.** When deliberately selected later, reacquire this item and investigate the problem before choosing protocol, topology, hierarchy, delegation, or enforcement design.

No reconciliation, design, decomposition, experiment, or implementation is authorized by this intake.
