# Kiro 4AM ratification disposition — agent architecture standards and SDK-based Talk

**Recorded:** October 25, 2026 (America/Denver), by **Kiro** (independent 4AM architecture ratification and determinacy reviewer).
**Standing:** Category D **actor-owned disposition**. These are Kiro recommendations to the Principal. They do **not** ratify any standard, authorize implementation, accept code, or represent Codex's position or a collective consensus. Principal acceptance remains the final authority.
**Subject:** [`4am-agent-mcp-standards-sdk-talk-ratification-candidate-2026-10-25.md`](4am-agent-mcp-standards-sdk-talk-ratification-candidate-2026-10-25.md) (the "candidate"), under PL-MCP-01.
**Inspected revision:** remote `main` `f982ad62678e0ce807604744bed16defcd21451c` (candidate commit), verified at start.
**Independence:** Codex's new ratification record was not read before this disposition was completed. Kiro's own prior 4AM report, Muse review and reciprocal review (conversation evidence, not repository authority) are baselines, not authority.

## 1. Bottom line

The candidate captures the Principal's SDK direction correctly as a **scoped technology directive** and correctly avoids minting duplicate standards. It is **not yet ready for Principal ratification as an operational guide for autonomous actors**: it is adequate in content but weak in transmission, conformance and determinacy. Six amendments (section 6) would make it ready; three of them need Principal decisions (section 8).

Most consequential gaps:

1. **"Based on the OpenAI Agents SDK" is undefined.** An actor can wrap one `run()` call around a bespoke router and claim conformance ("SDK-washing").
2. **Whether new Talk must consume Wheelwright through MCP is unstated.** The candidate says an SDK host does not mandate MCP for *other* hosts; it is silent for new Talk itself, while PL-MCP-01's Principal purpose is MCP learning.
3. **Disclosure ordering is wrong.** The candidate defers the disclosure profile to "before relevant acceptance". The SDK's documented defaults export traces including generation and tool inputs/outputs to OpenAI in server runtimes, so the first real-data run would exceed the Principal's accepted H-004 disclosure boundary before any acceptance step.
4. **Transmission path is absent.** The candidate is a Category D discovery file, not linked from the parking-lot index, ADR register, bootstrap or steering. Injected steering ("No new technology without demonstrated need … Current stack … intentionally minimal") pushes actors the opposite way.

## 2. Authority recovered (independently)

| Concern | Governing authority | Location |
|---|---|---|
| Backend owns state, business logic, financial conclusions | `PRIN-ARCH-BACKEND-AUTHORITY`; API v2 mandate | `docs/principles.md`; `docs/77-api-v2-architectural-guardrails.md` §"V2 backend authority mandate" |
| Consumer must not reconstruct authority; authority must reach the consumer | ADR-017 D2, D3, D5 | `docs/07c-adrs.md` ADR-017 |
| Errors, correlation, partial success, completion, projection, compatibility, discovery, composition | Doc 77 §§4, 5, 10, 11, 13, 14, 15, 18 | `docs/77-api-v2-architectural-guardrails.md` |
| Question-driven capability growth | Roadmap north star | `docs/roadmap.md` §"Current North Star — Question-Driven Design" |
| RECOVER → REUSE → COMPOSE → EXTEND → INVENT; early observation; hello-world first slice | Product-first mandate | `docs/mandates/product-first-continuous-engineering-2026-10-13.md` |
| Frameworks must be earned; architecture explicit and transmissible | Technology Quality Constitution Articles I, III; day-to-day practice | `docs/foundations/technology-quality-constitution-v1.md` |
| Observational fitness, trend over gates, separate enforcement ratification | Fitness controls v1 §§2–3 | `docs/technology-quality-fitness-controls-v1.md` |
| Knowledge ownership, CSVLOD as optional view purposes, injected instructions must route to canonical meaning | ADR-023 D1, D2, D5 | `docs/07c-adrs.md` ADR-023 |
| Principal model-disclosure boundary for real Account data | H-004 Option A (nickname, broker, count; `store:false`) | `docs/discovery/h004-principal-account-disclosure-and-inference-choice-2026-10-23.md` |
| Kotusev v3.0 tile names (Solution Options, Landscape Diagrams, Technology Inventories, Preliminary Solution Designs) | Repository transcription of canonical PDF | `docs/discovery/knowledge-survey-2026-10-18/kotusev-v3-name-verification.md` |

## 3. Historical falsification — the bespoke Talk orchestration choice

Evidence-based classification; no causal claim beyond what records show.

| Stage | Classification | Evidence |
|---|---|---|
| H-001 / H-003 (Oct 22): hand-written Responses API loop over stdio MCP | **Authorized bounded experiment.** Runtime explicitly left open | `4am-pl-mcp-01-bounded-evidence-reconciliation-2026-10-22.md` item 6 ("No forced runtime selection"; Agents SDK listed as a research alternative) and "choosing a disposable test harness does not choose the future production architecture"; H-003 Principal authorization "no … production architecture commitment" |
| H-004 r1 (Oct 23) onward: real Account data; H-005 holdings; trades; `wwt-web` preview; `talk-construction` | **Consequential architectural choice made without recognition or review.** The harness became the Product host by accretion | No H-004/H-005/`wwt-*` record reconsiders runtime or framework (repository search). Each capability added its own host or agent file (`holdings-agent.mjs`, `trades-agent.mjs`, `tools/talk-construction/`). `talk-construction/worker.mjs` describes itself as "Existing Talk per-turn process/MCP isolation". Kiro's own independent ACCEPT of H-004 r1 did not raise the question |
| Was a standard missing, untransmitted, or unfollowed? | **Missing trigger plus transmitted rules that biased toward the outcome.** Not "transmitted but not followed" | (a) No rule required re-examining a harness when it began carrying real data or Product capability. (b) `docs/bootstrap/kiro-cold-start.md` lists architectural uncertainty as authority, identity, persistence, provenance, lifecycle, publication, migration and capital-path changes — not technology, framework or runtime selection — and calls "integration mechanics" ordinary judgment. (c) Injected steering: "No new technology without demonstrated need." (d) Constitution Article III treats frameworks as earned complexity. (e) RECOVER → REUSE applied faithfully selects the accepted internal H-003 harness |
| Would the candidate have made the choice explicit? | **Partially.** "Framework leverage" would have prompted review of SDK mechanisms before reimplementing loop and session. "Decision determinacy" helps only if the actor already recognizes runtime selection as consequential, which (b)–(e) argued against. H-004's privacy constraints might still have justified a narrow custom pipeline; the candidate would make that reviewable, not necessarily different | Inference from the above; untested |

**Lesson for determinacy:** the candidate's two standards can conflict with existing transmitted rules (Article III, steering, RECOVER → REUSE of internal precedent). Without an explicit precedence statement, independent actors will resolve the conflict differently.

## 4. Technical verification (current sources, pinned where possible)

- **MCP 2026-07-28** is current and stateless: no `initialize` handshake, mandatory `server/discover`, per-request `_meta`; OpenTelemetry trace-context conventions in `_meta` (SEP-414); tools listed in deterministic order ([changelog](https://modelcontextprotocol.io/specification/2026-07-28/changelog)). Hosts own orchestration and context; "full conversation history stays with the host" ([architecture](https://modelcontextprotocol.io/specification/2026-07-28/architecture)). Clients SHOULD give tool execution errors to the model ([tools](https://modelcontextprotocol.io/specification/2026-07-28/server/tools)). Streamable HTTP servers MUST validate `Origin` (not applicable to current stdio servers).
- **`@openai/agents` 0.21.0** (npm, modified 2026-10-20) is **pre-1.0**. `@openai/agents-core` depends on `openai ^7.2.0` and has optional `@modelcontextprotocol/client ^2.0.0`, which is compatible on paper with Wheelwright's `openai 7.43.0` and MCP client `2.3.1`. Protocol negotiation of the SDK's MCP integration against Wheelwright's 2026-07-28-pinned servers is **not verified** (no code run).
- **SDK facilities** ([MCP guide](https://openai.github.io/openai-agents-js/guides/mcp/), [sessions](https://openai.github.io/openai-agents-js/guides/sessions/), [tracing](https://openai.github.io/openai-agents-js/guides/tracing/), [models](https://openai.github.io/openai-agents-js/guides/models/)):
  - `MCPServerStdio` with `toolFilter`, `cacheToolsList`, `errorFunction`, `useStructuredContent`, and `toolInputGuardrails`/`toolOutputGuardrails` applied to local MCP tools.
  - Sessions: `MemorySession` (process-local), custom `Session`/`RunContextAwareSession`, `OpenAIConversationsSession` (server-managed history), `OpenAIResponsesCompactionSession` (sends history to `responses.compact`).
  - `modelSettings.store`; opt-in retries.
  - Tracing is enabled and exported to OpenAI by default in server runtimes; generation and function spans capture inputs/outputs unless `traceIncludeSensitiveData` is disabled; `setTraceProcessors()` can replace the exporter.
- **Trusted boundary vs agent instruction:** SDK guardrails, tool filters and instructions are in-process host controls. The trusted security boundary for data access remains backend authentication and grants (Doc 77 §3 and Model A). MCP annotations are hints. None of the SDK facilities makes model prose a backend-authoritative claim.

## 5. Proposition dispositions

| # | Candidate proposition | Disposition | Reason / strongest counterexample | Change needed for determinacy |
|---|---|---|---|---|
| P1 | New self-contained Talk based on the OpenAI Agents SDK (scoped Principal directive) | **RATIFY as recorded, AMEND for conformance** | Correctly scoped; not a vendor mandate. Counterexample: an `Agent` whose only tool is the existing bespoke router, or hand-copied schemas fed to `run()`, would satisfy the words | Define minimum conformance: SDK `Runner` executes the model/tool loop; MCP tools reach the model through SDK MCP integration from discovery (no hand-copied schemas, no exact-tool-count checks); no question-specific routing before the run; custom code only at named extension points (tool filter, guardrails, session, trace processors, `errorFunction`, trusted presentation, authentication). Pin exact SDK version |
| P2 | Pause bespoke Talk; preserve evidence; no deletion or deployment change | **RATIFY, AMEND scope** | Ambiguous coverage: accepted installed H-004 r1 `wwt`; running private previews (`wwt-feedback` r27, `talk-construction` 8791/8793); candidate backend `/v2/chains` work in `talk-underlyings-20261025` | Enumerate paused hosts and each item's lifecycle state (accepted, installed, candidate). State whether backend capability work (e.g. `/v2/chains`) is host-independent and outside the pause. List lessons carried forward: deterministic renderer, evidence-retained-on-narration-failure, subject guard, MCP construction server |
| P3 | Decision determinacy: recover precedents, identify native and custom alternatives, name the accountable authority before durable divergence | **AMEND** | Historical case: the actor did not recognize runtime selection as consequential, because transmitted rules classified it as ordinary judgment | Define "consequential architectural choice" to include technology/framework/runtime selection and host orchestration pattern, plus a scope-change trigger (a harness or experiment begins carrying real data or Product capability). Place it in the Constitution day-to-day practice and the actor bootstraps' architectural-uncertainty lists, not as a new standalone standard |
| P4 | Framework leverage: review supported framework mechanisms before reimplementing generic loops, sessions, discovery, tracing, recovery | **AMEND** | Conflicts as written with Article III and the injected steering rule; RECOVER → REUSE privileges internal precedent | State as symmetric build-versus-adopt evaluation, where both reimplementation and dependency are complexity. Add precedence: an accepted internal harness is not a binding precedent for a scope it was explicitly not selected for. Extend Article III or the "While designing" checklist instead of a separate standard |
| P5 | Reusable capability boundary: backend owns financial authority; MCP exposes meaningful capabilities faithfully; SDK host owns execution, tool admission, presentation | **NO NEW STANDARD** (reference existing) | Already `PRIN-ARCH-BACKEND-AUTHORITY`, Doc 77 §18, ADR-017, MCP architecture, Oct 24 thin-MCP direction | Reference only. Add: tool admission is configuration (SDK `toolFilter` or allowlist), not per-question code |
| P6a | Authorization and financial claims are not enforced by prompts or schemas alone | **NO NEW STANDARD** | Oct 21 PL-MCP-01 intake §4; ADR-017; MCP annotation-hint semantics | Reference only |
| P6b | Trustworthy financial assertions preserve backend claim identity, subject, provenance, qualifications | **DEFER** | No backend claim-identity contract exists. A host-side claim resolver risks becoming a second semantic model (Oct 21 intake §8). Numeric provenance alone is insufficient: the recorded "$87 opening credit" passes a number check while misstating an indicative quote | Resolve after the output-guarantee Product decision; then place claim identity in the v2 contract under Doc 77, not in the host |
| P6c | Disclosure profile is an open Product decision before relevant acceptance | **AMEND (ordering)** | SDK default trace export, `OpenAIConversationsSession` and compaction send data beyond the H-004 Option A boundary on first use | Until the Principal selects a profile: synthetic or market-only data; tracing disabled or replaced; `traceIncludeSensitiveData: false`; `store: false`; process-local session; no server-managed conversation or compaction. The decision is needed **before the first real Account-data run**, not before acceptance |
| P7 | Observable fitness; controls start observational; no automatic CI gates | **RATIFY, AMEND with specific checks** | Consistent with fitness controls v1 §3. Counterexample: `tools/` has no CI, so all checks are actor-run until separately authorized | Adopt the candidate checks in section 7 as observational candidates under fitness controls v1 |
| P8 | CSVLOD mapping (Guidelines, Patterns, Solution Options, Landscape, Preliminary Solution Design) | **RATIFY with AMEND** | Labels now match Kotusev v3.0. Main value is Solution Options (alternatives) and Landscape (accepted/installed/candidate realization, already required by ADR-023 D2) | Record the SDK decision itself as an **ADR** (Category B, read at bootstrap through the ADR register) referencing a Solution Options section. Defer Patterns and Preliminary Solution Design. No document per tile |
| P9 | Falsifier list | **RATIFY, AMEND** | Missing: tool-result prompt injection once results reach the model; SDK-washing; default trace export on first run; harness-to-product promotion without a decision record | Add these four falsifiers |
| P10 | 4AM procedure: independent actor dispositions; consolidated register separates actor recommendations from Principal decisions | **RATIFY** | Matches multi-actor synchronization protocol | None |
| P11 | Industry-source basis | **RATIFY with corrections** | Sources are appropriate and correctly labelled as support, not authority | Pin MCP 2026-07-28 and `@openai/agents` 0.21.0; note pre-1.0 status; distinguish normative MCP text from vendor guidance (OpenAI, Anthropic, AWS, Azure) |

## 6. Amendments required before ratification (summary)

1. **SDK conformance minimum** (P1): the definition in section 5, plus a structural check.
2. **MCP requirement for new Talk** (P1, P2): Principal decision; see section 8.
3. **Disclosure safe defaults and ordering** (P6c).
4. **Pause enumeration** (P2).
5. **Determinacy and precedence** (P3, P4): technology/runtime selection as consequential; scope-change trigger; build-versus-adopt symmetry; internal-precedent limit.
6. **Transmission placement:** record the SDK decision as an ADR; link candidate and actor dispositions from PL-MCP-01 in the canonical parking lot; route the injected steering summary and actor bootstraps to the ADR (ADR-023 D5). Kiro has not made these edits; they need authorization.

## 7. Governance property assessment and justified fitness checks

| Property | Assessment |
|---|---|
| **Adequacy** | Content largely sound and correctly non-duplicative; gaps in P1 conformance, P6c ordering and missing injection falsifier |
| **Transmission** | **Fails today.** Candidate is unindexed Category D; bootstrap and steering do not route to it; steering contradicts it |
| **Conformance** | Partly mechanizable (checks below), but no CI runs `tools/` tests and WW-GATE-001 remains STAGED. Detection still depends on independent review |
| **Determinacy** | **Insufficient.** Independent actors would plausibly diverge on: SDK conformance meaning; MCP use in new Talk; pause scope; disclosure timing; whether a custom trusted-presentation layer is permitted; which internal precedents carry forward |

Justified candidate checks (observational; none is a gate; promotion under fitness controls v1):

| Check | Type | Falsifies |
|---|---|---|
| C1 SDK conformance: new Talk depends on pinned `@openai/agents`; host source has no direct `responses.create`; MCP tools come from SDK MCP integration; no hardcoded tool count or name | Deterministic, static | SDK-washing; bespoke loop substitution |
| C2 Disclosure configuration: tracing disabled or replaced; `traceIncludeSensitiveData: false`; `store: false`; no server-managed session or compaction without Principal profile | Deterministic, config test | Default egress beyond H-004 boundary |
| C3 MCP Problem preservation: stub API 401/403/404/422/500 with canary; assert code, title and request ID preserved; private body never forwarded | Deterministic, contract test | 422 detail loss; correlation loss; privacy leak |
| C4 Evidence survives narration failure | Deterministic with injected model failure | Validated evidence disappearing |
| C5 Referent continuity (SPY → IWM → "favor reward/risk"), verified by actual tool-call arguments | Behavioral; repeated runs; trend | Stale-subject fallback |
| C6 Tool-result injection fixture (instruction text in a backend `reason` field) | Behavioral; repeated runs | Injected instruction changing tool use or output |
| C7 Added-capability marginal change: a new MCP tool requires no conversational-routing diff | Deterministic, diff-based | One-off host growth |

## 8. Genuine Principal decisions

1. **MCP in new Talk.** Must new SDK Talk consume Wheelwright capabilities through MCP (SDK MCP integration), or may it use native function tools calling v2 directly? PL-MCP-01's purpose ("a learning exercise for MCPs") argues for MCP; Codex's earlier work treats native tools as legitimate. Actors should not infer this.
2. **Model-disclosure profile** for SDK Talk with real Account data (tracing, response storage, session storage, compaction) — required before the first real-data run.
3. **Financial output guarantee** (already open in the candidate) — constrained backend-authoritative answers versus explicitly fallible discussion beside deterministically rendered facts.
4. **Pause scope** — which hosts and candidates are paused, and whether host-independent backend capability work continues.

## 9. Readiness

**Not ready for Principal ratification as-is.** Ready after the section 6 amendments and the section 8 decisions. No new standard beyond amendments to existing owners (Technology Quality Constitution, fitness controls v1, ADR register, bootstraps and steering routing) is recommended.

## 10. Repository observations (no action taken)

- The candidate commit `f982ad62` added only the candidate file; it is not linked from `docs/parking-lot-11.md`.
- `npm run check:roadmap-projection` reports the committed projection is **stale** at `f982ad62`. This predates and is unaffected by this disposition, which changes no projection input.

## 11. Limits

No code, tests, model calls or services were run. SDK/MCP protocol compatibility, guardrail scope in the JS SDK, and actual SDK egress were verified from documentation only. Cost: approximately 6 minutes wall clock (12:16–12:22 MDT); token and monetary cost not available to Kiro. External content was rephrased for licensing compliance.
