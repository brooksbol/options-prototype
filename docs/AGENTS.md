# Wheelwright Documentation — Agent Instructions

This file applies to agents working in `docs/`. The repository root [AGENTS.md](../AGENTS.md) is the universal agent entry point. This file owns the detailed agent routing formerly embedded in `docs/README.md`; it does **not** replace the documentation authority model or grant execution permission.

## Required cold start

### Minimum Safe Bootstrap — bounded orientation

At cold start, acquire the compact authority and architecture orientation below. **Scan/index** large registries and continuation sequences for coverage; **read in full only task-relevant sections**. Do not confuse the ability to locate durable knowledge with loading every historical record into context. A plain `bootstrap` with no task must finish without exhaustive backlog or journal reading. Before consequential task work, retrieve relevant sections and evidence. Paths are relative to `docs/`.

**Retrieval terms:** These terms describe evidence coverage; existing instructions determine what must be retrieved.

- **Read:** Inspect the source content required by the applicable instruction. A complete-document requirement is not satisfied by excerpts, search snippets, or truncated retrieval. Scoped reading applies only where already permitted.
- **Index:** Enumerate the complete referenced set, including continuations, and inspect its required headings, IDs or matches. Indexing does not establish that the underlying entries were read or their claims verified.
- **Verify:** Check a specified claim against evidence appropriate to it, including applicable authority and scope, revision, task/experiment state, and implementation or operational evidence where relevant. Reading alone does not establish verification.

When reporting retrieval coverage, distinguish these activities and disclose material gaps or truncation. Disclosure does not satisfy a missing mandatory obligation. Keep existing attestations compact; no new report or tracking artifact is required. These terms change no mandatory scope, authority boundary or proof obligation.


| # | Document | Required context |
|---|----------|------------------|
| 1 | `README.md` | Documentation authority, index, and A–F precedence model. |
| 2 | `KNOWN-FAILURE-MODES.md` | Failure checksum and demonstrated operating-model mistakes. |
| 3 | `foundations/evidence-appliance.md` | Governing Evidence Appliance foundation and system identity. |
| 4 | `07-architecture-current.md` | Current architecture, engines, boundaries, and surfaces. |
| 5 | `07c-adrs.md` | Inspect the register/index and read foundational plus task-relevant decisions; do not load unrelated ADR text at untasked bootstrap. |
| 6 | Complete `parking-lot*.md` sequence | Enumerate every continuation and inspect headings/IDs/current-state matches across all files; read full entries only for the active task or a specific backlog inquiry. |
| 7 | `principles.md` | Canonical Principles register, ratified principles, and candidate boundary. |

### Principal shorthand: "write this down" — durable-learning request

When the Principal says "write this down", "remember this", or an equivalent phrase about Wheelwright work, treat it as an instruction to **complete a bounded knowledge-capture and reconciliation workflow**, not merely to suggest a filename, append indiscriminately to a journal, or propose a new principle. Follow `bootstrap/project-memory-protocol.md`, ADR-023, the A–F authority model and the existing `knowledge/` owner / `assimilation-obligations.md` mechanisms.

1. Capture the **exact Principal wording** where available, subject, practical example, why it matters, date/context, and a source locator. Keep actor interpretations and implications separately labeled.
2. Recover prior decisions and nearest maintained subject authority; identify whether this reinforces, corrects, contradicts, or adds to it. Preserve proposed, accepted, ratified, rejected and unresolved standing. Do not infer ratification from a memorable phrase or from this instruction.
3. Use the **existing** appropriate destination: amend an established maintained owner or governing artifact only when its semantics and mutation authority permit; otherwise preserve the scoped historical finding in the existing journal/checkpoint route and make the missing-assimilation disposition explicit. If an `ASSIM-*` obligation is warranted, use the canonical ledger and its required receipt/permission workflow; do not silently create an unsourced obligation or a new register.
4. Within the actual authorization for repository persistence, carry the work through verification and accepted-main synchronization. Do not demand that the Principal select a document path or restate previously supplied context. A Principal request to record knowledge authorizes documentation handling within existing constraints, **not** new Product ratification, software changes, trading actions or bypass of guarded Git workflows.
5. If the actor cannot write the repository, or a consequential boundary remains, produce an explicit portable handoff with exact content, proposed existing destination, status, blockers and responsible receiver. Do **not** claim "written down" merely because the chat or an uncommitted local file contains it. Report the verified commit/path when persisted, otherwise say plainly that persistence remains pending.

This shorthand applies to Product, architecture, engineering, UX, operating-model and domain learning, including topics not yet represented under `knowledge/`. Lack of a maintained owner is an assimilation gap to route, not permission to invent authority. Success means a fresh actor can recover the consequential meaning **by subject** without knowing the original quotation or journal number.

### Maintained knowledge and assimilation obligations — routing

- `knowledge/README.md` indexes maintained subject owners for current domain meaning. When a task touches a listed subject, read its owner page before historical sources; follow its citations for standing and scope.
- `assimilation-obligations.md` is the canonical Category C ledger of open knowledge-assimilation work (`ASSIM-*`). At cold start, scan it for `PENDING`/`READY` entries; when a task touches an affected subject, honor the entry's permission boundary and resume trigger. Entries never grant execution permission.
- Injected steering summaries route to these owners; where a summary disagrees with a maintained owner or ratified source, the owner/source wins.

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

### Herbie terminology — Theory of Constraints (October 22, 2026)

The Principal states: **“Any reference to \"Herbie\" is either a reference to theory of constraints or Hancock. And I never talk about Herbie Hancock.”** In this project's discourse, read **Herbie** as a Theory of Constraints bottleneck/constraint reference, **not** a jazz-person referent or an automatic Wheelwright question type. See the [question inventory disambiguation](discovery/operator-question-inventory-2026-10-22.md#principal-disambiguation--herbie-october-22-2026). Do not label every question a Herbie: a question may reveal a constraint, which requires evidence.

### Cross-cutting smallest-slice guidance — October 22, 2026

The Principal states **“the simplest thin slice is a hello world.”** This is Wheelwright-wide engineering guidance, **not a PL-MCP-01-only instruction**. Recover its scope, meaning and authority limits in [the Product-first engineering mandate](mandates/product-first-continuous-engineering-2026-10-13.md#principal-clarification--smallest-thin-slice-october-22-2026). A minimal runnable hello world demonstrates the first end-to-end wiring; it does not itself demonstrate domain semantics, privacy, or release fitness, and does not authorize implementation.

### Muse external-research confidentiality boundary — October 22, 2026

The Principal's explicit rule is **“muse must never be given internal information, e.g., Wheelwright, etc.”** For any Muse assignment, read [External research confidentiality — Muse](bootstrap/project-memory-protocol.md#external-research-confidentiality--muse-principal-instruction-october-22-2026). Muse receives only anonymized, generic external research questions; do not disclose the repository, Wheelwright identity, project architecture or internal context. Muse's externally sourced findings are reconciled internally after research. This is a Principal research disclosure instruction, not a Product Principle or research authorization.

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

### Ratified Talk architecture — ADR-024 (October 25, 2026)

For any Wheelwright Talk, MCP/agent-host, conversational-client, or PL-MCP-01 task, retrieve [ADR-024](07c-adrs.md#adr-024-sdk-based-wheelwright-talk-mcp-integration-and-financial-authority) from the ratified ADR register before design or implementation. New Talk uses the OpenAI Agents SDK for general conversational execution and MCP for Wheelwright domain access; old bespoke Talk is deprecated. ADR-024 governs over generic dependency-minimization or reusable-experiment heuristics for this scoped decision. Preserve its restrictive disclosure requirements for both Product and development/testing hosts. This paragraph routes to authority; it does not repeat, replace, or grant implementation permission.
