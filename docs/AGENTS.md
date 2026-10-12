# Wheelwright Documentation — Agent Instructions

This file applies to agents working in `docs/`. The repository root [AGENTS.md](../AGENTS.md) is the universal agent entry point. This file owns the detailed agent routing formerly embedded in `docs/README.md`; it does **not** replace the documentation authority model or grant execution permission.

## Required cold start

For any consequential Wheelwright reasoning, review, implementation, reconciliation, or other outcome-bearing work:

1. Begin with the root `AGENTS.md`, then read `docs/README.md` as the authoritative documentation guide, index, and A–F authority model.
2. **Before consequential work, read `KNOWN-FAILURE-MODES.md`.** Wheelwright's failure checksum covers invented Product outcomes, late Principal observation, Codex→Kiro patch loops, manufactured retry authority, premature multi-actor convergence, in-flight-state damage, interruption mistakes, and deterministic state left to probabilistic judgment. It summarizes evidence; it does not create execution authority.
3. Read `foundations/shared-execution-contract.md` **only as the suspended runtime-control contract and compatibility bridge**. Actor-readable prose is not execution authority.
4. Read `foundations/principal-decision-surface.md` for the ratified human-factors decision grammar; it does not grant authority.
5. Follow the applicable actor-specific cold-start bootstrap below.
6. Reacquire current task and experiment state, task-relevant authority, and the applicable authoritative transition mechanism before claiming an action is permitted. Conversation, prompts, recommendations, and review dispositions are not authoritative execution state.
7. Follow `bootstrap/project-memory-protocol.md`, `foundations/multi-actor-repeatability-temporal-synchronization.md`, and `foundations/death-spiral-avoidance-protocol.md` as applicable.
8. For a material new idea, follow `foundations/idea-intake-reconciliation.md`; inspect **all** `parking-lot*.md` continuations. For chronological or topical project history, inspect all `journal/project-journal*.md` continuations.
9. Retrieve applicable ratified principles from `principles.md`, task-specific contracts/ADRs, and current implementation evidence. Verify remote/local synchronization, protect in-flight changes, and respect Principal authorization and current experiment gates.

Gate Experiment 001 is staged until its durable state establishes otherwise; do not claim activation or mutation authority from conversational summaries.

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
