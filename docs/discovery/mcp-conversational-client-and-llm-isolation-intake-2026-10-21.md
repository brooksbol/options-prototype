# MCP Conversational Wheelwright Client — Idea Discovery and Privacy Verification

**Date:** October 21, 2026
**Status:** Category D discovery/why-state, unratified; linked from canonical PL-MCP-01 intake. Not a Solution Overview, design, accepted Product capability, MCP implementation or execution permission.
**Source:** Principal–ChatGPT project conversation, October 21, 2026, beginning “what if i wanted a completely new kind of ww client ... a simple chat bot interface. no tables. no rows. just an operator and an agent,” continuing through the explicit request to persist the full thread. The conversation is provenance, not independent Product authority.

## 1. Principal-origin intent and progression

The proposed client is deliberately **chat-only**: no position tables, navigation or rows; an operator and an agent in conversation. It is not a chatbot bolted onto Write Desk. The Principal subsequently clarified: **“I'd like to use this as a learning exercise for MCPs.”** The experiment's learning subject is Model Context Protocol, while Wheelwright supplies a concrete, real domain and existing API.

The conversation progressively narrowed from general UX and MCP suitability to predictability, mechanical enforcement of canonical meaning, brokerage authentication, cross-user privacy, and finally **cross-user data mingling inside the LLM's knowledge**. The Principal singled out **“How we verify isolation”** as “the important bit.” This emphasis is the central reason for durable capture: the primary differentiator of a useful MCP learning experiment is executable verification of model-input isolation, not a convincing chatbot demo.

Key verbatim Principal questions: “what aspects of the design should we focus on to assure predictable behavior?”; “how do we prevent the agent for going off and doing its own thing? how to we enforce using ww BE for it's knowledge and semantic model? this applies to the ontological, domain and user model?”; “i see a lot of 'shoulds' and 'musts'. but what are the mechanics of enforcing that?”; “is the idea: control the MCP, control the agents?”; “how do you deal with things like user-->brokerage authentication?”; “how do you assure that the agent/MCP maintains user privacy, i.e., personal, financial data across users?”; “so the session is the isolation boundary?”; “this is the deterministic structure. what about the agents themselves?”; “my primary concern is mingling of user data inside the LLM's knowledge”; “How we verify isolation — this is the important bit.”

No client, host, model, MCP server, auth scheme, storage system or deployment was selected or authorized. All specific controls and tests below are *candidates advanced in discussion*, not ratified Wheelwright policy.

## 2. Current Wheelwright precedent and authority; do not re-invent

- The October 6 question-driven milestone (`docs/80-v2-question-driven-lifecycle-product-architecture-milestone-2026-10-06.md`) already frames the Product in terms of legitimate operator **or agent** questions, bounded claims and governed evidence. A conversation is a potential new projection of that direction, not an automatic new Bet.
- `docs/parking-lot-10.md` under PL-CLI-01 explicitly preserves the **unratified** hypothesis that intent-driven agents may displace default large table workbenches; tables can remain useful for audits, comparison and bulk allocation. PL-CLI-01 also preserves composable Unix tools and the human/agent equal-consumer experiment.
- `docs/77-api-v2-architectural-guardrails.md` and `docs/principles.md` ratify **backend owns state and business logic; clients own presentation**, plus policy-over-prediction, deterministic governed recommendations, canonical resource/authority discipline and single evidence authority. MCP cannot quietly implement a second domain/decision engine. Backend receives external evidence with provenance; the brokerage remains source of its own reality.
- `docs/knowledge/domain/accounts-and-operating-regimes.md`: **Account does not determine Operating Regime**. Regime is an explicit governed quantity/capital scope. A Sawdust nickname or conversation recollection is not authoritative evidence of scope membership. User identity, Account identity, access grants, legal ownership and accounting/cash-vs-margin context are separate.
- `docs/knowledge/domain/positions-and-governed-quantity.md`, `docs/assimilation-obligations.md` ASSIM-0002: Position/scope lifecycle ontology still has open questions; MCP tool schemas cannot ratify candidates or turn `ww positions` display rows into canonical lifecycle identity.
- V2 common OAS and `docs/api-v2/README.md` provide a machine-readable API starting point. Account discovery, authorized retained Position reads, quote reads and bounded financial evidence are possible *reuse candidates*; not all mentioned endpoints or candidate resource designs are implemented or suitable to expose. `docs/discovery/api-v2-candidate-resource-contract-2026-10-20.md` remains candidate only.
- `docs/parking-lot-9.md` PL-ACTOR-01 mentions MCP as a candidate for **actor-to-actor transport**. That is related technology, but a distinct Product concern and does not own customer-facing conversation or financial privacy.
- `docs/foundations/idea-intake-reconciliation.md` governs this record; exploration is not implementation permission.

## 3. Proposed MCP learning specimen, not an accepted design

Potential path: operator → AI host and MCP client → thin curated WW MCP adapter → authenticated v2 API → authoritative WW backend/evidence. Candidate first tools `list_accounts` and `list_positions`, both read-only. A realistic question: “What's in Sawdust?” The host should discover tools, backend-resolve Account nickname to canonical ID, retrieve *authorized* observations, and produce a bounded explanation. A second equivalent question/host should preserve the same substantive claim under the same evidence.

Prefer recover→reuse→compose→extend→invent; the MCP adapter must not own domain calculations, governance membership, recognition, financial identity or recommendation. Do not automatically publish every OAS endpoint as a model tool. An explicit quote *acquisition*, artifact *import*, or other side-effecting operation is not a simple read. Agent-facing tools are curated by semantics and security, with tool execution constrained by host-controlled allowlists. MCP tool annotations and model prompts are **not** enforcement of backend authority.

A proposed deterministic/predictable division: agent can parse intent, select tools, request clarifications and phrase descriptions; WW backend establishes facts, identity, permissions, relationships, policy evaluation and governed recommendations. Same authorized subject + snapshot + policy should produce same *substantive* conclusions; identical natural-language tokens or tool-call sequences are not expected.

## 4. Mechanical enforcement problem and candidate solution mechanisms

The Principal explicitly challenged aspirational “should/must” language. Separate four mechanisms, none guaranteed by an MCP server alone:

1. **Operation security:** trusted host/runtime permits only allowlisted MCP tools; sandbox/no generic HTTP, shell or database/broker credentials for the bounded learning specimen. MCP input schema and gateway validate calls. WW API independently checks authenticated caller and exact grant for *every* request. A model-supplied User ID, Account alias, role or session token is not identity proof.
2. **Semantic authority:** backend serves typed, explicit ontological associations, policy outcomes and provenance, not a bag of rows from which the agent manufactures relationships. Distinguish ontology, domain, User/access and **epistemic** (source, age, confidence/coverage, unknown-vs-negative) authority. The Agent may suggest a query; it cannot establish an Operating Regime from a brokerage Account, old conversation or co-location.
3. **Output integrity:** a trusted host-side claim gate or renderer validates each financially consequential typed assertion against authoritative WW result/snapshot/policy and authorization context before displaying as WW truth. Citation-looking strings and prompt admonitions are insufficient. Model-generated free prose cannot be mechanically guaranteed truthful; strict deterministic rendering of typed conclusions gives stronger assurance but less conversational freedom. Output-validation contract, types and placement remain proposed, not ratified/implemented.
4. **Agent execution/delegation:** distinct authenticated User, session and per-run agent execution identities; host associates the run with allowed tools/contexts. If subagents are introduced, effective permissions cannot exceed parent capability intersection with User grants. No need to invent multiple agents for first specimen. A shared process is possible with correctly isolated request/context state.

Do **not** equate control of the MCP server with control of all an agent can do: the host can expose other tools, and the LLM can emit unsupported language without tool calls. “Control the runtime to constrain agents; MCP to constrain capabilities; backend to enforce semantics; trusted output to establish what is represented as WW truth” is an **assistant-derived formulation**, not Principal ratification.

## 5. Brokerage authorization versus User/Account authorization

Distinct trust boundaries: operator→host, authenticated host/MCP→WW, and WW→brokerage. Existing v2 controlled-local Bearer authentication and exact many-to-many User–Account grants are established; they do not imply brokerage API credentials or trading rights. Candidate interactive brokerage connection: start connection request under known User; use provider-approved OAuth/MFA where actually supported; callback to trusted backend; encrypted token custody outside prompts/tool results; backend broker-account discovery and independent WW grants; agent sees connection status, not secrets. This is a possible later exercise, **not** implemented or generalized across brokerages. Fidelity CSV workflow remains different; do not assume OAuth integration exists for it. Initial MCP specimen should use existing authorized retained data, not invent provider integration.

## 6. Principal's central concern: cross-user mingling *inside LLM knowledge*

Three non-equivalent pathways:
- **Model weights:** ordinary inference generally does not update weights; service-side training/fine-tuning or retention uses need separately verified provider controls. No-training does not automatically imply zero retention.
- **Inference context:** conversations, tool outputs, summaries, cached prompt fragments or data from A could be wrongly assembled into B's request. Enforce isolation at the trusted host's *final pre-inference input* boundary, not just MCP access.
- **Persistent memory/RAG:** shared embeddings, indices, recalled summaries and long-lived agent memory can leak across User boundaries. Any derivative of A-scoped private data keeps its provenance/access classification; no global memory of personal facts. First specimen can disable persistent memory entirely.

**User + authorization** define data visibility; **session** isolates conversational context; **request** is independently checked; **agent execution** scopes delegated tools/working context. A session identifier is not authorization and a shared model alone is not inherently a shared memory. Account may legitimately be shared by separately granted Users; private conversations should not thereby become shared.

A third-party model provider is a separate trust boundary. WW/MCP cannot prove provider-internal retention/training/cross-tenant isolation from agent behavior alone. Verify service commitments and controls; for higher sensitivity consider self-hosting as an independently evaluated tradeoff.

## 7. Candidate executable isolation-fitness test — highest-priority learning outcome

**Proposed invariant:** For every model invocation on behalf of User U, every private context segment that reaches actual inference input has provenance and current authorization for U. The gate must control the **actual full serialized bytes/messages** crossing into inference; merely recording a manifest that may omit content is not proof.

Test topology: synthetic Users A/B/C; private Accounts A/B and deliberately shared Account A authorized for C; planted unique synthetic canaries and distinctive synthetic financial facts. Record provenance through original results, derived summaries, embeddings/retrieval, caching and transformations.

Proposed positive/negative checks:
- B's queries cannot cause A-only segments to appear in B's complete assembled model input or tool results, even with A's Account ID/nickname, session ID or resource handle.
- A and B concurrent queries, retries, cancellation, resumed chats, reused connections and context-window compaction retain isolation.
- A's grant revocation disallows future reads/retrievals; formerly assembled context needs an explicit revocation/resume policy rather than assuming old exposed bytes can be erased from a prior inference.
- Shared-Account C can access *specifically granted* Account evidence but not A's private chat/memory.
- Prompt injection in broker evidence/tool results cannot promote data into instructions or widen scope.
- Invalid or unavailable evidence remains unavailable; missing option Greeks, working orders, transaction completeness, current quote time, or governed regime are not silently synthesized.
- Capture every *outbound model invocation* in a protected harness, compare actual input segments with authenticated principal, grant scope and provenance classification; fail closed on unknown ownership/unmanifested private material.
- Inspect output and adversarially ask B to disclose A's synthetic canary. A model failing to disclose is **not proof** of input isolation or provider-internal secrecy; use as an additional detection layer.
- Logs, diagnostics, traces and stored fixtures themselves need access control, redaction/retention and synthetic test data, lest the verifier create a new leak.

**Proposed release-blocking fitness criterion for a future multi-user client:** zero unauthorized private segments at the actual pre-inference boundary in tested cases; all known request and retrieval pathways covered by instrumented harness and adversarial fixtures. This is a candidate fitness function, not an assertion of formal proof of all conceivable pathways or of the model-provider internals.

Triangulate three independent layers to isolate defects: direct v2 HTTP correctness; MCP adapter equivalence without an LLM; complete LLM host/context/output tests. Same substantive established results under repeated paraphrases and different hosts, under fixed input snapshots. Add direct negative tests and independent challenge; “it answered well” is not acceptance.

## 8. Unresolved decisions and non-commitments

- Is the initial experiment just a local single-user protocol lesson, or should dual-user synthetic isolation be its first built-in proof? The Principal's emphasis strongly favors verification-first, but no implementation or sequence was ratified.
- Which MCP host, SDK, protocol version, transport, identity binding and deployment? No choice made.
- Can complete model-input interception/verification be implemented in the chosen host? A third-party black-box host may not expose sufficient observability. If not, do **not** claim proven isolation.
- How to type authoritative claim objects and validate/render them without adding a second semantic model outside WW? Backend and output-boundary responsibilities need reconciliation.
- Which source fields may leave backend for the LLM, and which provider retention/training regime is acceptable for real customer data?
- How to implement User/context grants for shared Accounts, retrieval memory, in-flight revocation, delegations, and derivatives.
- Which existing v2 endpoints/OAS operations are operative/accepted at build time, and which proposed Position, governance and lifecycle semantics remain unresolved? Do not implement a candidate resource as if ratified.
- Whether a new product-level principle/architecture pressure is actually needed after falsifying reuse. No new principle/Bet/roadmap change asserted here.

## 9. Idea-pipeline disposition and boundaries

**Canonical intake:** PL-MCP-01 in `docs/parking-lot-10.md`. Distinct from PL-ACTOR-01 (actor-to-actor transport); related to PL-CLI-01 (question-driven composability, agent as consumer), PL-API-02/03 (contract/common capabilities), PL-CONV-01 (Position convergence), PL-ARCH-03/07 (identity/privacy), and Trustability/access direction in `docs/roadmap.md`.

**Preliminary strategy:** existing question-driven/trustworthy concise explanation/access goals; likely no new Bet, pending complete strategic reconciliation. **Preliminary architecture:** ratified backend authority is directly reusable; proposed new pre-inference context isolation verification and final-answer grounding may create engineering pressure, not an authorized architecture decision. **Status:** INTAKE / discovery, **not RECONCILED**: required Reconciliation Completion Record is not asserted. No implementation decomposition or commitment.

**Not authorized:** MCP server, agent/chat client implementation, API/OAS changes, provider credential acquisition, brokerage connections, trading, real user data transfer to a model, memory collection, grant mutation, hosting/deployment, ratification of tool/schema vocabulary, modification of accepted Product surfaces, or operating-model changes.

**Persistence scope:** documentary intake and bounded why-state only, requested by Principal October 21, 2026. Record includes assistant-derived candidate approaches visibly separated from Principal-stated goals. It is not a transcript export and does not misrepresent synthetic examples as live brokerage evidence.
