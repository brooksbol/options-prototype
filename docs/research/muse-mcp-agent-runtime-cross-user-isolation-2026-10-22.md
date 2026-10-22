# Muse external research — MCP-compatible agent runtimes and cross-user isolation

**Report date:** 2026-10-22  
**Standing:** External research evidence; not Product authority, an approved architecture, or independent verification of runtime/provider claims.  
**Source:** Principal-supplied Muse report, titled *Prospective Cross-User Isolation in MCP-Compatible Agent Runtimes — Independent Research Report*, 314 physical lines, 62,220 UTF-8 bytes, SHA-256 `7fffa0da73a3ba44dceab068115c394e18c62140ecdafbde8ddb9f60509e0f3f`. The **verbatim report is a conversation attachment, not copied into this repository artifact**. This file is a faithfully attributed research digest and analytical receipt; do not cite it as a word-for-word copy of the entire source.

## Independent research question and research boundary

Can multiple authenticated people use the same LLM-backed agent service without private data crossing account/user boundaries into another person's inference context, persistent memory, retrieval, or outputs? Muse used only public source material, no private project details or internal documents, and performed no implementation or live framework-provider verification.

## Findings attributed to Muse (not automatically ratified)

1. **Conditional isolation; no framework-wide guarantee.** For five runtime families examined (OpenAI Agents SDK, LangGraph OSS/Platform, Microsoft Agent Framework/Semantic Kernel, Google ADK, AWS Strands + Bedrock AgentCore), binding caller identity to sessions, memories, data retrieval and tools remains an application/operator responsibility. LangGraph Platform documents custom authorization handlers; AgentCore claims per-session microVM compute isolation. Neither claim in the report is independently validated as end-to-end data isolation.
2. **MCP protocol is not a multi-user ACL system.** Tool/session identity, token audience/scope, no token passthrough and host/server consent/authorization require correct implementations. Tool descriptions, retrieved data, model instructions and MCP client/session metadata cannot substitute for authenticated backend grants.
3. **The high-value test point is actual egress.** An application-controlled model wrapper/proxy can inspect its complete assembled serialized request and fail closed on unauthorized provenance. A framework or provider feature that adds opaque server-managed state cannot be fully audited by such a pre-egress check.
4. **Memory and derived data inherit source privacy restrictions.** Histories, summaries, embeddings, vector collections, cached results, log/trace records and compaction outputs must stay bound to the authorized user and grant scope. Query-time access control is stronger than post-retrieval filtering. PostgreSQL RLS can enforce row policies at the data layer but has documented bypass-role, owner and pooled-connection considerations.
5. **Provider boundary is trust/audit, not customer-visible technical proof.** Commercial API training non-use, retention, prompt caching, zero-data-retention eligibility and serving isolation are provider/document/contract claims with endpoint and feature qualifications. Egress visibility cannot prove anything about hidden provider-internal operations.
6. **Failure evidence matters.** Muse cited pooled-state cross-user leakage (2023 ChatGPT redis-py incident), prompt-injection disclosure (EchoLeak), an experimental Asana MCP tenant-boundary incident and public tool-poisoning demonstrations. Different trust boundaries; do not treat every incident as an MCP protocol defect.
7. **Proposed falsification research protocol:** synthetic A/B Users with unguessable private canaries, C with specific shared grants; capture model egress and deliberately violate authorization to prove a fail-closed gate fires; exercise session replay, concurrent cancellation/retry, revocation, derived-summary/embedding/cache lineage, traces/logs, and prompt injection. A model's refusal to disclose a secret is not evidence that the secret never appeared in its context. Finite testing is not universal proof.
8. **Hosting:** Render and other generic container platforms separate infrastructure tenants, not Users within one process. Single-tenant deployment or a per-session microVM may give stronger execution separation but does not by itself validate user identity, retrieval authorization, model egress, or provider retention.

## High-priority independent correction to Muse's report (verified 2026-10-22)

Muse's §4 and §10 treated MCP `2026-07-28` as not verified, and its session-specific discussion was anchored on 2025-06-18 / 2025-11-25. The primary MCP project **officially released specification 2026-07-28**: https://blog.modelcontextprotocol.io/posts/2026-07-28/ and https://modelcontextprotocol.io/specification/2026-07-28 . The new spec has stateless self-contained requests, eliminates the old handshake and `Mcp-Session-Id` header, changes authorization requirements, and offers headers/routing/caching features. This is a **material protocol-currentness correction**. It does **not** invalidate the more general need to bind all application session/memory/retrieval state to authenticated Users. Confirm exact 2026 normative requirements from its protocol sections before forming implementation requirements. The TypeScript SDK guide https://ts.sdk.modelcontextprotocol.io/v2/migration/support-2026-07-28 explains that newer protocol support requires explicit opt-in; do not assume an installed SDK is already using this era.

## Important research limitations and risk of overclaim

- The report does not test any actual runtime or prove the assertions across vendor versions. Framework comparisons are largely vendor-documentation-based. In particular, broad language such as “none provides isolation by default,” “nine of twelve,” and “all inference calls are stateless” requires version-specific qualification.
- The proposition “inspect the complete inference payload” refers to **application-visible serialized egress**, not provider-side system context, opaque compaction, hosted file search or hidden endpoint behavior. A claim of inspecting *everything* would overstate test coverage.
- Muse's own source-quality appendix reports several incident assertions and CVEs taken from secondary reports rather than primary advisories. Use attributed/graded claims until corroborated.
- OpenAI/Anthropic/Google/Azure/Bedrock retention terms and endpoint eligibility are time-sensitive. Re-verify specific commercial terms at architecture/deployment decision time.
- A synthetic canary test is a **test method**, not sufficient authorization, domain semantics, deployment acceptance, or a proof of absolute secrecy.

## Research evidence and direct primary links in the supplied report

- MCP current spec: https://modelcontextprotocol.io/specification/2026-07-28
- OpenAI Agents SDK sessions/MCP/context: https://openai.github.io/openai-agents-python/sessions/ ; https://openai.github.io/openai-agents-python/mcp/ ; https://openai.github.io/openai-agents-python/context/
- LangGraph auth/Store: https://docs.langchain.com/langsmith/store-auth ; https://docs.langchain.com/langsmith/set-up-custom-auth
- Microsoft sessions: https://learn.microsoft.com/en-us/agent-framework/agents/conversations/session
- Google ADK user/session: https://docs.cloud.google.com/agent-builder/agent-engine/sessions/manage-sessions-adk
- AgentCore compute claims: https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/runtime-how-it-works.html
- OpenAI provider controls: https://developers.openai.com/api/docs/guides/your-data
- Anthropic provider controls: https://platform.claude.com/docs/en/manage-claude/api-and-data-retention
- NCSC prompt injection: https://www.ncsc.gov.uk/blog-post/prompt-injection-is-not-sql-injection
- PROMPTPEEK paper: https://www.ndss-symposium.org/wp-content/uploads/2025-1772-paper.pdf

The original Muse report contains a substantially fuller, attributed bibliography, section-by-section analysis, runtime matrix and limitations. This digest is intentionally not a substitute for reviewing that source report when a consequential decision depends on detailed evidence.

## 4AM interpretation — maintained authority versus new external evidence

- **Convergence (evidence, not multi-actor ACCEPT):** Kiro's independent repo investigation located a backend HTTP authorization spine and no separate agent-host pre-inference isolation mechanism at its snapshot revision. Muse's external evidence identifies exactly that agent-host/context boundary as application-owned. The findings are compatible but are not architectural proof or selection.
- **Candidate capability gap:** Inspection and restriction of agent-managed context, memory and tool results as they cross User boundaries; distinguish provider-internal control limits. Neither MCP nor a thin adapter alone solves the entire problem.
- **Candidate fitness methods:** synthetic cross-user request recording and canary cases, with test limits explicitly stated. Future experiment sequencing must honor the Principal's *project-wide* “the simplest thin slice is a hello world” guidance: wiring-only hello world is a separate, earlier specimen from multi-user assurance.
- **No forced runtime/platform choice:** AgentCore, LangGraph and OpenAI SDK remain research comparisons. No decision to adopt one follows from this report.
- **Standing:** PL-MCP-01 remains INTAKE. Codex's independent PL-MCP-01 reconciliation is a separate lane; a parallel foundational API Product conformance review becomes relevant if it discovers material contradictions in the backend foundation. No architecture selection, implementation, trial, release condition, Product principle, assimilation obligation, or Reconciliation Completion Record arises from this digest.

**Resumption:** Reconcile Codex 4AM findings against independent Muse research and the pinned Kiro report; explicitly correct protocol version in any future MCP design analysis. Preserve the original external report and provenance if full-fidelity source archival becomes available through an authorized path.
