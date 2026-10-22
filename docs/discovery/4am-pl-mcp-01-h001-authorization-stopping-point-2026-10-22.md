# PL-MCP-01 — H-001 authorization and 4AM stopping-point snapshot

**Date:** 2026-10-22  
**Standing:** Category D historical authorization and handoff evidence. Explicit Principal authorization of a tightly bounded experimental outcome, **not** PL-MCP-01 reconciliation completion, production agent architecture selection, blanket Git permission, or release acceptance.  
**Starting remote main observed:** `4a942d0f595014123bebeecd5d6f84a6d1d4e304` (verify current SHA again on resumption).

## Principal's explicit choice

After the [bounded three-actor reconciliation](4am-pl-mcp-01-bounded-evidence-reconciliation-2026-10-22.md), the Principal selected:

**“A. have codex build it. gen the prompt first , then persist a snapshot.”**

This accepts Option A as defined in the reconciliation: authorize **only a local, inert, data-free MCP hello-world end-to-end invocation**, with reproducible evidence. It names **Codex** the implementation actor. The authorization does not settle which runtime, transport or hosting topology a real conversational financial Product might later use.

Earlier Principal guidance is project-wide: **“the simplest thin slice is a hello world.”** Maintained owner: [Product-first mandate](../mandates/product-first-continuous-engineering-2026-10-13.md#principal-clarification--smallest-thin-slice-october-22-2026).

**Principal scope exclusion:** “we don't care about ww cli compatibility issues in this thread.” No CLI migration, parity or adapter compatibility work is in H-001.

## H-001 authorized outcome

- Launch a minimal local MCP server exposing one deterministic hello-world tool.
- Invoke and discover the tool from a local MCP client, exercising actual protocol wiring.
- Observe an exact deterministic `Hello, world!` text response and clean termination.
- Record supported SDK and exercised/negotiated protocol version, repeatable command, actual output, and deterministic integration verification.
- Prefer inert local stdio if compatible; this is a disposable experiment and does not select a production host.
- Codex should follow repository-root `AGENTS.md`, specific actor bootstrap, current execution/gate state, protected worktrees, applicable review and independent acceptance rules. An implementation report is not independent acceptance.

**Explicit exclusions:** no LLM requirement; no private data; no brokerage credentials or API v2 financial requests; no User/Account grants; no memory, retrieval, embeddings, or persistent conversations; no multi-user privacy assurance; no generated financial claims; no hosted/public deployment; no autonomous activity/trading; no OAS/domain model/API modification; no general-purpose agent infrastructure; no CLI compatibility tasks.

**Boundary:** This Principal choice authorizes the bounded experimental *outcome* and preparatory prompt, but does not override currently staged/inactive mutation gates, branch protections, review separation or other technical authority conditions. If a gate blocks write/integration, Codex must report it, not bypass it.

## Current evidence and reconciliation state

- [Kiro 4AM stopping point](4am-pl-mcp-01-stopping-point-2026-10-22.md), supplemented by Kiro's later bounded re-pin at `5081a39`: reusable HTTP-boundary Account/User grants and more granular published OAS; agent inference-context controls still absent.
- [Muse external research](../research/muse-mcp-agent-runtime-cross-user-isolation-2026-10-22.md): all compared agent approaches require application-managed authorization and context protection; provider internals not independently verifiable from app egress; original report has material MCP 2026-07-28 release-version correction.
- [Codex 4AM independent review](4am-pl-mcp-01-codex-independent-review-receipt-2026-10-22.md): strategy fit supported, context custody and answer integrity unresolved, first executable hello world separable from later domain and privacy specimens.
- [Bounded three-actor evidence reconciliation](4am-pl-mcp-01-bounded-evidence-reconciliation-2026-10-22.md): H-001 ready to propose and now specifically authorized by Principal, not yet implemented.
- Parallel API v2 Product-conformance verification is independent, conditionally relevant only if a material result invalidates a relied-upon premise; not a prerequisite for this data-free MCP wiring test.

## Status at this stopping point

- **Authorization:** H-001 local-only inert MCP wiring experiment **YES**, as constrained above.
- **Assigned implementation actor:** Codex.
- **Prompt:** complete copy-paste Codex implementation prompt delivered in the Principal conversation on October 22, 2026; this repository record is a durable boundary/goal handoff, not a verbatim prompt copy.
- **Implementation:** not observed, not claimed.
- **Independent verification/acceptance:** not performed.
- **Merge/integration:** not authorized by this snapshot alone; not observed.
- **PL-MCP-01:** remains **INTAKE / DISCOVERY**, no Reconciliation Completion Record.
- **Open later architecture:** authenticated model context assembly, authorization lineage and revocation, tool permissions, provider terms, financial answer integrity, and real-user isolation. H-001 is not evidence for their fitness.

## Resumption checks

1. Reverify remote `main`, current repo gate state, and actor ownership before implementation.
2. Read H-001 Principal authorization, exclusions and direct-repository instructions.
3. Execute H-001 only within actual mutation permissions; record real MCP version, execution, reproducibility, and tests.
4. Freeze and submit evidence for independent review through normal repository process.
5. Preserve strict distinction between working protocol wiring and acceptance of production security/finance semantics.
6. Continue broader PL-MCP-01 reconciliation separately, not as a hidden H-001 scope expansion.

**CURRENT STATE:** H-001 authorized by Principal for Codex as a local-only, data-free MCP hello-world learning experiment; prompt prepared. Not implemented or independently accepted. PL-MCP-01 INTAKE.

**DECISION REQUIRED:** NO.

**NEXT AUTHORIZED ACTION:** Codex performs bounded H-001 within the verified repository gate/worktree and review constraints.
