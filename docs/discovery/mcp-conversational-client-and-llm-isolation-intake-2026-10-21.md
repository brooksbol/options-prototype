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


## 10. October 21 continuation — research, discipline, layered capital and long-term strategy

**Standing:** Additional Principal-directed discovery in the same conversation, preserved at existing PL-MCP-01 as adjacent strategic context. These statements do not ratify a new Product Principle, Operating Regime resource, capital-management strategy or implementation mandate. They arose *after* the original intake; see the dated PL-MCP-01 continuation in the canonical parking lot.

### 10.1 The question-first trajectory

The Principal described an existing line of thinking: **“questions first” → user journey → ww CLI experience → domain concepts → API design.** The conversational/MCP client was recognized as an emerging natural consumer of this direction, not its cause. Assistant interpretation: agent-consumable capabilities provide a new falsifier of how reusable and semantically complete the v2 domain API really is. The established question-driven milestone and PL-CLI-01 composability hypothesis support this relationship; agent-client priority or primary-interface status is not decided.

### 10.2 Research and operations have different kinds of openness

The Principal identified a relatively unstructured Wheelwright **research arm**, occasionally involving Muse, exploratory hypotheses, backtesting plans and unconventional questions. This differs from the increasingly explicit operational domain. Research may legitimately explore distant hypotheses; operational policy must not silently inherit them.

Candidate separation, not an approved two-engine architecture: research produces questions, hypotheses, experiment protocols, provenance and independently checked results; governance/adoption is a distinct consequential transition; operations consumes only established domain meaning and duly adopted policy. The conversational agent might navigate between inquiry and governed operation without confusing experimental findings with operational recommendation authority. “Hypothesis”, “Experiment” and “Finding” are possible research vocabulary, not ratified entities/resources.

### 10.3 Operator focus / paradox of choice

The Principal located a psychological Product motivation in **the paradox of choice**: a trader continually faces stimuli and apparent opportunities that can break discipline. Wheelwright should help an operator stay focused, not manufacture trading activity. The Principal contrasted this with an impression that many conventional trading platforms optimize for encouraging trading rather than discipline; this is a Principal observation and differentiating hypothesis, **not a verified universal claim about competitors or their incentives**.

Assistant candidate phrasing: “Protect Operator Focus” and “discipline by design.” Neither was explicitly ratified as a Product Principle; the canonical Principles register presently has no ratified Product Principles. The current roadmap already contains WAIT as a genuine alternative, precommitted lifecycle policy, attention-first use, trustworthy concise explanation and explicit consequences. New insight: focus/attention is a possible common human-factors rationale for these existing directions. A meaningful future fitness probe might measure unnecessary, policy-inconsistent interventions and attentional burden against missed materially important decisions. Focus cannot mean withholding essential evidence or displacing operator agency.

A critical distinction: **research curiosity can be expansive without automatically interrupting operational discipline**. A novel premium or promising backtest is not by itself a reason to redirect capital.

### 10.4 Conversational discovery of operator profile versus governed policy

The Principal proposed an agent getting to know an operator through repeated conversations, with operating regimes **emerging as deterministic backend-governed models**, rather than remaining agent memories or informal labels. Illustrative regimes: recurring cash-flow Income Wheel; appreciation-oriented Growth Wheel; and long shares with protective LEAPS (“maturity with a floor”), where puts are a premium *debit* rather than income. These serve different jobs and are not interchangeable.

Candidate conceptual progression: conversation surfaces preferences and intent → candidate objective/constraint/scope proposals → explicit operator adoption through an authoritative mechanism → versioned backend governance → later reconsideration. This is *not* an established WW acceptance or mutation workflow. A conversational remark about a preference must not silently change a governing policy, commit capital, or imply Account-wide regime assignment. The October 6 operator-journey discovery already distinguishes operator profile (“how the operator prefers to perform the job”) from Operating Regime (“the job”). The backend remains authority for explicitly governed scopes, while agent recollections remain non-authoritative.

### 10.5 One Account, layered time horizons and design attributes

The Principal reiterated that **one brokerage Account may contain multiple capital layers with different timeframes and design attributes**. This builds on the Principal-ratified scope fact: Account identity is not Operating Regime, and one Account may hold separately governed quantities under different regimes (standing example: 250 SPY shares, split 150 Buy & Hold / 100 Growth Wheel). Cash-side scopes also count. Do not infer from the established example that arbitrary overlapping “layers”, their hierarchical identity or their time-horizon relations are implemented/ratified.

Exploratory layer examples: weekly/monthly income, months-to-years growth, multi-year protected ownership (with independent protection expiry), immediate liquidity. Potentially different time horizons can coexist for ownership, protection, obligations and reconsideration. Canonical Position/Inventory Block/governed-scope identity remains unresolved under ASSIM-0002, so do not force these layers into arbitrary current v2 resource identities.

### 10.6 Position management versus portfolio management versus capital governance

The Principal observed that many trading interfaces are better at Position/trade handling than the broader task of **portfolio management**, though the discussion did not establish a comprehensive competitor survey. A possible longer-horizon distinction emerged:
- Position: what action is warranted for this holding?
- Portfolio: how do allocations, liquidity, concentration, correlations and time horizons interact?
- Capital governance: which purposes, commitments, constraints and priorities govern their collective use?

A locally attractive trade might conflict with a liquidity or protected-growth commitment. This is a *potential* explanation of how focus, multi-regime capital and question-driven clients fit together, not approval of portfolio-wide optimization, a new allocation policy, or a revised Product mission.

The Principal explicitly clarified: **“this is a long term strategic view.”** Therefore retain the current options-income scope and established roadmap. Use this as architectural compatibility/differentiation context, **not** a near-term roadmap addition, commitment, accepted Portfolio ontology or replacement vision.

### 10.7 Horizon discipline and pipeline disposition

Illustrative horizon split, not ratified sequencing:
- Present: sound v2 identity/evidence/domain contracts and question-driven API reuse.
- Experimental: bounded MCP conversation and **verifiable** isolation of per-user inference context with synthetic identities/fixtures.
- Long term: operator-profile discovery, explicit regime adoption, capital layering and portfolio-level governance across horizons.

**Reconciliation:** The MCP/privacy learning concern remains PL-MCP-01. Cross-link established PL-CLI-01 question-driven platform, PL-API-02/03, PL-CONV-01, maintained Account/Regime and Position/Governed Quantity owners; cite the current roadmap's Access, WAIT, precommitted policy, Trustability, comparative consequences and explanation direction. These later strategic observations are *related context*, not automatically new feature scope and not a new canonical PL identity without a separate durability/duplication assessment. No change to roadmap, architecture-roadmap, Principles, API/OAS, backend policy, client or deployment is authorized by this continuation. **PL-MCP-01 remains INTAKE, not RECONCILED.**

### 10.8 Remaining falsifiable questions

1. Does question-first API v2 composition answer useful unseen questions without adding agent-side financial semantics?
2. Can the agent preserve ontology/profile/regime/capital-scope distinctions while learning about the operator over time?
3. What authoritative event turns conversationally discovered preferences into adopted policy, with versioned scope, consent and an audit trail?
4. How can research findings be deliberately promoted (or rejected) without turning exploration into operational distraction?
5. What observations establish that focus-preserving surfaces reduce needless decisions *without* suppressing consequential evidence?
6. Does the long-term capital-governance vision expose actual architecture pressure today, or can established v2 domain-first boundaries accommodate it without speculative new resources?
7. How can future operator-profile memory remain user-private and outside financial authority, including the model-input isolation fitness concern already central to PL-MCP-01?


## 11. October 21 continuation — runtime, project sequencing, CLI versus REST, and web surface

**Standing:** Principal questions and assistant-proposed planning options, not selected architecture, Product approval, executable implementation plan or runtime verification. This addition follows section 10's long-horizon discovery and preserves the newest discussion without opening a second intake.

### 11.1 Agent competence and knowledge

The Principal asked whether agents are “dumb” or have to be trained. Working explanation: a pretrained model provides natural-language reasoning and tool-selection ability; an agent runtime supplies a bounded execution loop; Wheelwright provides canonical, timely, access-controlled financial knowledge through tools. Separate model fine-tuning is **not a prerequisite** for the bounded experiment and risks introducing stale duplicate domain semantics. Tool descriptions, runtime constraints and retrieval do not confer authoritative financial judgment. The Principle of backend authority still governs.

### 11.2 Runtime and hosting candidates

The Principal asked whether Codex can be used with an existing OpenAI account and whether Render can host the future agent. Candidate division discussed:
- **Codex** as a convenient development/initial MCP inspection host, not a selected multi-user production runtime.
- A **purpose-built host/agent runtime** (OpenAI Agents SDK was suggested, not selected) to control the inference input, User and session binding, complete tool inventory, traces, claim validation and eventual conversation interface. Hosted API inference could have separate usage/billing and provider-handling terms from a ChatGPT subscription.
- **Render** as a potential cloud host for an app/service running an agent runtime and optional private MCP service, with Wheelwright backend kept authoritative. Render hosting itself does not supply Wheelwright-specific user-context isolation or controlled answer validation. Secrets, storage and third-party LLM retention require design.
- No actual host, SDK, model, transport, provider plan, Render service topology, secrets path or deployment selected.

The experiment's central cross-user fitness test remains **complete pre-inference context validation**, not merely security at the backend or agent promises. Third-party provider retention/training isolation cannot be proved from local behavioral tests alone.

### 11.3 Hypothetical project phases, not commitments

An assistant-generated hypothetical plan proposed: (0) Product/architecture reconciliation and accepted operator specimens; (1) synthetic cross-user/context isolation harness; (2) narrow read-only MCP adapter over operative v2; (3) one-agent conversational runtime and simple terminal UI; (4) semantic/output verification; (5) cloud multi-user testing; (6) pilot and operator acceptance. Its suggested week estimates were conjectural and are **not committed schedule, budget or sequencing**. A smaller first proof may combine a synthetic User A/B (+ intentionally shared-account User C) scenario with authenticated Account discovery, retained Positions, and auditable model-input isolation. No API mutation, brokerage credentials, trading, or real financial input needed.

### 11.4 Start before decision/recommendation maturity?

The Principal observed the holdings/Account/Position side becoming increasingly useful while v2 decision/recommendation semantics lag. Assistant hypothesis: do **not** wait for comprehensive recommendations to begin learning MCP; instead constrain the prototype to already established read capabilities and treat unanswered decision questions as bounded capability-gap evidence. An agent is an **observer rather than a trading advisor** at this stage. Decision semantics continue as independent backend Product work. This is advice only, not a Principal selection of start date or sequencing.

### 11.5 Continue `ww` CLI, create v2 Web, or skip stages?

The Principal asked whether the CLI was still a worthwhile intermediate step and how v2 Web and conversational clients fit together. The established v2 architectural mandate is one backend domain contract with independent consumers; **CLI is not a mandatory implementation predecessor to MCP or Web**, and no client owns financial business logic.

Candidate differentiated purposes:
- `ww` CLI: exact scriptable inspection, operational ergonomics, reproducibility and inexpensive API specimens.
- MCP conversational client: natural-language question composition, qualified explanations and previously unseen queries.
- v2 web UI: rich visual comparison, simultaneous inspection, navigation and spatial understanding.

Assistant sequencing suggestion: continue worthwhile CLI/domain vertical slices, run a small parallel synthetic-data MCP experiment, mature backend decision semantics independent of any interface, and approach web v2 through a bounded visually compelling journey rather than wholesale v1 replication. No selection, staffing allocation, requirement to build all three clients, or decision to retire CLI/Web followed.

### 11.6 Principal's newest topology question: MCP through CLI or directly through REST?

The Principal explicitly asked whether MCP should invoke `ww` CLI or the v2 REST API. Two candidate paths were compared:
- **MCP → v2 REST API → backend**: favored in assistant assessment because v2 OAS is authoritative and machine-readable, API preserves structured provenance/errors/authentication, and a cloud multi-user service need not spawn CLI processes or parse presentation-specific output.
- **MCP → ww CLI → v2 REST API → backend**: feasible local learning composition and a useful Codex tool-use experiment, but introduces subprocess/credential/output-contract complexity in hosted multi-user settings.

A third option, **a shared typed/generated HTTP client library used by both CLI and MCP**, could reduce adapter duplication if real need is demonstrated, but it is not independently justified yet and must not become client-side financial authority.

**No binding decision was made.** Assistant recommendation is MCP→REST as primary production-oriented path, with `ww` an independent reference client and equivalence oracle. The experiment should compare identical authorized synthetic fixtures through REST, CLI and MCP for canonical Account identity, qualified Positions, timing/provenance, authorization/denials and preservation of UNKNOWN. Distinct human presentation is allowed; authoritative conclusions must match. Test protocol/controller complexity before cementing adapter topology.

### 11.7 Evaluation and open decisions

Planning hypotheses should be tested by smallest executable specimens, not assertions that an agent or three UI types are needed. Relevant falsifiers:
1. Can the MCP adapter preserve exact v2 subject, source, status and authorization semantics without CLI parsing or new domain logic?
2. Can a Codex-assisted local demo and a purpose-built host yield equivalent *domain* results while showing the observability/control difference of hosted inference?
3. Does the host provide complete final model-request interception for privacy fitness verification?
4. Can two users' synthetic contexts be proven separate through parallel, resumed and retrieved conversations, including derivatives and caching?
5. Which operator questions need visual comparison rather than prose, and which use CLI composition best?
6. Does a decision question reveal missing backend domain semantics instead of incentivizing ungoverned agent-side recommendation?
7. What cloud/provider guarantees and costs make real private financial data acceptable?

**Status remains PL-MCP-01 INTAKE.** Reconciliation Completion Record not yet prepared, no MCP runtime/SDK/host or CLI-versus-REST choice ratified, and no experiment/implementation/deployment authority asserted by this documentation update.


## 12. October 21 continuation — evolutionary question-led development and Wheelwright as a mirror

**Standing:** Principal strategic discovery and assistant interpretation, not a new ratified Product Principle, fixed project plan, Solution Overview, or implementation authorization. Captured under the existing PL-MCP-01 identity at the Principal's request. Related to the already-established question-driven Product north star, PL-CLI-01 composability, and Wheelwright's Product-first engineering mandate.

### 12.1 Principal's five observations — preserved verbatim

- “roadmap as strategic intent, not a laudry list of features in order”
- “a project plan that is actually a cyclical operating model”
- “follow the questions”
- “This is a better way forward than unix commands. it's a shortcut to the questions.”
- “ww will end up being a mirror: a mirror on my own learning”

The immediate preceding Principal elaboration makes the meaning especially clear: **“i'd like to evolve this rather than plan it out. we can have a project plan but it doesn't dictate where the questions take us”**. The Principal hopes answers naturally uncover new questions and composable Wheelwright capabilities expose useful **unpredicted/emergent** behavior possibilities. Do not flatten this into an instruction to remove the roadmap, abandon the CLI, automatically evolve governance, or give the model open-ended execution authority.

### 12.2 Distinct concerns and candidate interpretation

**Roadmap as strategic intent.** The roadmap preserves direction, desired operator outcomes, bets and boundaries. It need not be treated as a feature-order manifest. Existing `docs/roadmap.md` question-driven design already directs developers from legitimate questions toward governed evidence/capability gaps. Existing roadmap authority and the requirement to reconcile material changes are unchanged.

**Project plan as cyclical operating model.** Rather than committing to a complete upfront decision-support decomposition, proposed cycle: operator asks a consequential question → attempt the answer using existing authorized capabilities → characterize whether blocked by missing evidence, meaning, governance or composition → recover/reuse first and extend only where justified and authorized → run the same question as an executable fitness specimen → observe new useful questions, surprising compositions and failure cases → repeat, pause or stop. The cycle defines **method and quality gates**; it does not predetermine the next Product capability. This must not bypass repository idea intake, ratification or Principal authority.

**Follow the questions.** Natural follow-on questions might progress from positions requiring attention to repeated management interventions, appropriateness of operating policy, and empirical evaluation of an alternative regime. These are *illustrative question paths*, not approved deterministic recommendations or requirements to implement a universal decision engine. Every loop should produce an operator-useful demonstrated result, a falsified claim, or an explicitly characterized blocker; not perpetual speculative redesign.

**Conversation as a shortcut to questions.** The original composable Unix CLI was itself a move away from fixed workflows: humans and agents could compose small governed tools. A conversational MCP client can let an agent attempt composition on behalf of an operator who need not learn CLI command grammar. The Principal expressed this as a preferable potential direction, **not** a decision to retire `ww` or violate ratified one-API/many-clients. CLI remains useful for precision, scripting, inspection, and independent conformance.

**WW as mirror of operator learning.** A possible long-term differentiator is that Wheelwright reflects not only account inventory or financial performance but also the operator's developing questions, changing hypotheses, clarified capital purposes and decision history. In a disciplined implementation, conversation and research may capture tentative preferences and beliefs while authoritative backend domain policy changes only on explicit governed adoption with provenance. The goal is greater operator self-understanding and agency, **not** an agent independently learning a user's secrets into shared model weights, imposing goals or deciding trades.

### 12.3 Emergence is a falsifiable hypothesis

Investigate whether each accepted domain primitive reduces the marginal work necessary to answer previously unforeseen questions, and whether capability composition uncovers genuinely useful operator outcomes. Possible measures: previously unsupported questions answered correctly by composing existing authoritative primitives; independently reproduced answers across CLI/REST/MCP; reduced bespoke backend additions; operator decision quality and effort. These are **candidate measurements**, not ratified KPIs. Curiosity or creative agent output is not authoritative financial meaning, and claims of emergence require observable examples rather than enthusiasm.

### 12.4 Stable constraints versus evolutionary discovery

**Stable authority:** financial and ontological meaning, backend-governed calculations/policies, User–Account grants, source provenance, claim uncertainty, cross-user model-context isolation, and consequential authorization boundaries.

**Evolving discovery:** which operator question is worth pursuing, whether it can already be answered, which evidence/capability is missing, which composition proves useful, which research hypothesis is falsified, and whether an observed capability deserves Product adoption.

Do not conflate operator conversational memory, research hypotheses, backend-governed policy and agent-run working context. The previously documented pre-inference multi-user isolation fitness concern remains central.

### 12.5 Explicit scope and disposition

This continuation **refines the rationale and learning method for PL-MCP-01** but does not expand its immediate experimental implementation beyond a potential bounded read-only MCP/holdings specimen. Decision Support remains a separate domain delivery concern; it should evolve from real questions while preserving existing roadmap and API commitments. No new roadmap Bet, Product Principle, CLI retirement, universal agent framework, hidden recommendation logic, persistent User model or autonomous research mandate is asserted.

**State:** PL-MCP-01 remains INTAKE; strategy and architecture reconciliation plus the required Reconciliation Completion Record are still pending. The Principal requested durable knowledge capture, not ratification or implementation. No runtime, backend/OAS, access, model-memory, deployment, research, or trading mutation is authorized by this record.
