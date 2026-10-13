# Wheelwright Documentation — Agent Instructions

This file applies to agents working in `docs/`. The repository root [AGENTS.md](../AGENTS.md) is the universal agent entry point. This file owns the detailed agent routing formerly embedded in `docs/README.md`; it does **not** replace the documentation authority model or grant execution permission.

## Required cold start

### Minimum Safe Bootstrap — bounded orientation

At cold start, acquire the compact authority and architecture orientation below. **Scan/index** large registries and continuation sequences for coverage; **read in full only task-relevant sections**. Do not confuse the ability to locate durable knowledge with loading every historical record into context. A plain `bootstrap` with no task must finish without exhaustive backlog or journal reading. Before consequential task work, retrieve relevant sections and evidence. Paths are relative to `docs/`.

| # | Document | Required context |
|---|----------|------------------|
| 1 | `README.md` | Documentation authority, index, and A–F precedence model. |
| 2 | `KNOWN-FAILURE-MODES.md` | Failure checksum and demonstrated operating-model mistakes. |
| 3 | `foundations/evidence-appliance.md` | Governing Evidence Appliance foundation and system identity. |
| 4 | `07-architecture-current.md` | Current architecture, engines, boundaries, and surfaces. |
| 5 | `07c-adrs.md` | Inspect the register/index and read foundational plus task-relevant decisions; do not load unrelated ADR text at untasked bootstrap. |
| 6 | Complete `parking-lot*.md` sequence | Enumerate every continuation and inspect headings/IDs/current-state matches across all files; read full entries only for the active task or a specific backlog inquiry. |
| 7 | `principles.md` | Canonical Principles register, ratified principles, and candidate boundary. |

### Product-first proof routing — mandatory

Read `mandates/product-first-continuous-engineering-2026-10-13.md` and `technology-quality-fitness-controls-v1.md` during bootstrap. For each outcome-bearing task, recover the closest accepted Product behavior and relevant ratified invariants, ADRs, contracts and fitness functions before proposing new architecture. Identify concrete reuse, a falsifiable capability gap for each new abstraction, and an early runnable operator specimen. Carry those claims and their evidence through design, implementation and delivery. This is a lightweight proof obligation, not a new Principal approval stage. Agent attestations are insufficient; independent falsification and executable checks must verify claims where possible. Current repository instructions alone do not implement an unskippable enforcement substrate; do not claim otherwise.

### Routing and current state

For any consequential Wheelwright reasoning, review, implementation, reconciliation, or other outcome-bearing work:

1. Begin with the root `AGENTS.md`, then read `docs/README.md` as the authoritative documentation guide, index, and A–F authority model.
2. **Before consequential work, read `KNOWN-FAILURE-MODES.md`.** Wheelwright's failure checksum covers invented Product outcomes, late Principal observation, Codex→Kiro patch loops, manufactured retry authority, premature multi-actor convergence, in-flight-state damage, interruption mistakes, and deterministic state left to probabilistic judgment. It summarizes evidence; it does not create execution authority.
3. Read `foundations/shared-execution-contract.md` **only as the suspended runtime-control contract and compatibility bridge**. Actor-readable prose is not execution authority.
4. Read `foundations/principal-decision-surface.md` for the ratified human-factors decision grammar; it does not grant authority.
5. Follow the applicable actor-specific cold-start bootstrap below.
6. Reacquire current task and experiment state, task-relevant authority, and the applicable authoritative transition mechanism before claiming an action is permitted. Conversation, prompts, recommendations, and review dispositions are not authoritative execution state.
7. Follow `bootstrap/project-memory-protocol.md`, `foundations/multi-actor-repeatability-temporal-synchronization.md`, and `foundations/death-spiral-avoidance-protocol.md` as applicable.
8. For a material new idea, follow `foundations/idea-intake-reconciliation.md`; search/index **all** `parking-lot*.md` continuations and read the matching full entries. For chronological or topical project history, search/index all `journal/project-journal*.md` continuations and read the relevant spans. Complete sequence coverage is mandatory; complete sequential reading is not.
9. Retrieve applicable ratified principles from `principles.md`, task-specific contracts/ADRs, and current implementation evidence. Verify remote/local synchronization, protect in-flight changes, and respect Principal authorization and current experiment gates.

Gate Experiment 001 is staged until its durable state establishes otherwise; do not claim activation or mutation authority from conversational summaries.

**Bootstrap completion:** Verify remote/local SHA and tree, recover authority hierarchy, Product-first mandate, fitness-function route, actor role, safety boundaries, and how to find task state. With no task supplied, report ready for questions and stop. Do not claim a historical authorization is currently active merely because it appears in a journal or backlog: reconcile against the latest explicit stop/termination and canonical task state. If contradictory, report current state as unverified, never as active. Bootstrap does not itself resume a terminated workstream. Do not require full reading of all historical continuations to mark orientation complete.

## Actor-specific cold starts

| Document | Actor | Role |
|---|---|---|
| `bootstrap/chatgpt-cold-start.md` | ChatGPT | Reasoning, synthesis, and challenge |
| `bootstrap/kiro-cold-start.md` | Kiro | Repository-resident architecture/implementation |
| `bootstrap/codex-cold-start.md` | Codex | Independent adversarial review/falsification |

A request such as “Bootstrap yourself for Wheelwright from GitHub” starts at root `AGENTS.md`, continues here and through `docs/README.md` for authority, and then follows the appropriate actor bootstrap.

## Shared actor protocols

| Document | Purpose |
|---|---|
| `bootstrap/end-of-session-protocol.md` | Containing session-closeout protocol. The Principal command “execute end of session protocol” means **execute** closeout through memory reconciliation, verification, persistence, accepted-main synchronization, and final SYNC; do not stop for an intermediate plan or confirmation. |
| `bootstrap/project-memory-protocol.md` | Documentation diligence and project-memory synchronization |
| `foundations/shared-execution-contract.md` | Suspended runtime-control contract; semantic compatibility guidance only |
| `foundations/principal-decision-surface.md` | Ratified Principal-facing decision grammar; human-factors control, not enforcement |
| `foundations/multi-actor-repeatability-temporal-synchronization.md` | Temporal synchronization, convergence, and scoped execution ownership |
| `foundations/death-spiral-avoidance-protocol.md` | Avoid repeated consequential traversal without new decision-relevant state; escalate abstraction rather than prompt verbosity |
| `foundations/idea-intake-reconciliation.md` | Mandatory method for material new ideas and handoffs |

## Authority boundary

`docs/README.md` continues to define document classification, precedence, and documentation navigation. `principles.md`, the applicable governing/ratified documents, and canonical task state retain their existing authority. This file is a **routing instruction**, not a replacement for them. No ratified rule, permission, execution gate, or Product meaning changes through this relocation.
