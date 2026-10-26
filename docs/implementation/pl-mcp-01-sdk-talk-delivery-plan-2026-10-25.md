# PL-MCP-01 — SDK-based Wheelwright Talk delivery plan

**Recorded:** 2026-10-25
**Standing:** Category C proposed project delivery sequence, subordinate to [ADR-024](../07c-adrs.md#adr-024-sdk-based-wheelwright-talk-mcp-integration-and-financial-authority), current Product authority, and actual task/experiment execution grants. **Not** authorization to implement, access protected evidence, install or deploy. No estimates, dates, actor assignments, framework version, or acceptance state inferred.
**Owner:** PL-MCP-01 within the canonical parking lot. Existing strategic [roadmap](../roadmap.md) and [architecture roadmap](../architecture-roadmap.md) retain their separate roles.

## Goal and measure

Deliver a **new, self-contained Wheelwright Talk** that feels like a capable conversational agent while using the OpenAI Agents SDK as its actual general model/tool execution runtime, MCP for authorized Wheelwright domain capabilities, and API v2 for authoritative financial data and decisions. **Question-driven Product progress** is measured by useful, truthful operator questions answered with little or no per-question host engineering—not MCP tool count or acceptance-test volume.

Old bespoke Talk is **DEPRECATED UNTIL FURTHER NOTICE** as Product. Its code, installed-state evidence, experiments, security discoveries and UI learning remain available as historical evidence; do not delete, stop or extend it. Independently warranted API v2 and MCP capability work can continue under existing authority.

## Non-negotiable operating boundaries

- Genuine SDK agent loop and dynamic MCP tool discovery/admission; no SDK-wrapped bespoke router or duplicated question-to-tool registry.
- API v2 owns financial semantics, outcomes and grants. The MCP adapter preserves useful safe error identity, provenance and correlation and does not become a second financial engine.
- Before any protected disclosure: disable SDK automatic trace export, keep sessions local, disable provider-managed conversations and remote compaction, apply `store:false` where applicable, and enforce existing scoped permissions. This covers **all development/test hosts, including Codex**, not just Talk. Verify normal-runtime egress, not only `NODE_ENV=test`.
- Backend-authoritative findings and qualified model commentary are permitted together but must be **implicitly visually distinguishable**. Model commentary must not masquerade as authoritative financial findings. Tool results are untrusted model input; model obedience is not the permission or truth boundary.
- Preserve independently validated authorized evidence when narration fails. Do not infer broker trade execution, policy, position identity or current market evidence from an indicative or historical result.
- Scope and authorization are governed by ADR-024 and existing gates. These phases are a planning sequence, not automatic authorization for their execution.

## Delivery progression — smallest useful vertical slices

| Stage | Operator-visible evidence of success | Engineering work and falsifiers | Advance only when |
|---|---|---|---|
| **0. Recover baseline and prepare safe workstream** | Clear distinction between deprecated installed/candidate artifacts and the *not-yet-implemented* successor | Recover actual current main/install states, ADR-024, known failures, PL-MCP-01, existing SDK/MCP compatibility; choose a protected iteration path, no new one-off host. Establish synthetic fixture and real-data disclosure boundaries | Existing state safe; accountable task authority and accepted specimen scope identified |
| **1. SDK + MCP walking skeleton** | Normal multi-turn chat, including a greeting, explanation and follow-up, through the **actual SDK run loop** | Pin supported JS Agents SDK; establish stdio MCP interoperability, discovered tool schemas, admission controls, local sessions, streaming if necessary; use synthetic data. Negative: second tool or freeform follow-up must not trigger a new host handler. Normal-runtime outbound trace check | Principal can observe a real single-host SDK chat specimen; actual network/tool execution path verified |
| **2. First governed question** | One real operator question answered correctly with backend-established facts; a relevant follow-up works naturally | Choose an *existing* useful question from operator inventory after Product review; reuse actual v2/MCP read capability and qualified snapshot. Trace API→MCP→SDK→presentation; no new tool absent demonstrated gap; verify actual subject on follow-ups, not just fluent prose | Operator judges the answer useful, succinct and grounded, and failed calls preserve referent |
| **3. Trustworthy conversational answer form** | The operator can easily tell verified financial findings from exploratory commentary, including when commentary fails | Explore 2–3 compact UX alternatives through real specimen. Backend-backed factual regions rendered via trusted data, commentary separately qualified without repetitive disclaimers. Negative fixtures: 77% reward/risk ≠ POP; indicative credit ≠ executed fill; max loss ≠ profit; unsupported policy advice; wrong/stale subject; injected tool-result instruction | Principal accepts information hierarchy and negative cases; no numeric-whitelist-only claim of truth |
| **4. Failure, privacy and MCP contract recovery** | Valid partial answer on evidence miss; human-understandable constraint when unavailable; no invented recovery actions | API v2/MCP error/correlation preservation (safe 401/403/422/500); XLU/IWM missing evidence; narration failure; privacy canaries across model/session/trace/guardrail; tool-result injection; authorization tests. Preserve private diagnostic boundaries. Use official MCP conformance facilities where applicable | Proven safe under scoped fixtures and authorized real-data disclosure, with stated limits |
| **5. Reusability demonstration** | A second justified Wheelwright question/tool becomes available without per-question conversational source changes | Develop *only* capabilities pulled by actual operator questions: attempt existing tools first, compose/extend backend when needed, prove distinct MCP contract. Codex may act as an independent preliminary MCP consumer **using appropriately authorized evidence**. Compare tool selection, full task outcome, token/latency and code-change cost | Multiple meaningful questions work, and no bespoke conversational-routing code was added |
| **6. Product acceptance and delivery decision** | New Talk meets agreed operator specimens and is distinguishable from the deprecated product | Independent implementation review, realized privacy/financial authority evidence, installation/rollback plan, explicit realization/provenance status and Principal observation. Proportionate fitness controls under existing Constitution | Principal accepts actual installed Product behavior under separately authorized delivery steps |

Stages can be interleaved where useful, especially early operator feedback and non-model API/MCP checks; **do not make all MCP development a mandatory waterfall ahead of Talk**. Begin with the smallest authorized runnable specimen, not an expensive framework/tool catalog. A stage does not automatically authorize the next.

## Initial question-driven evaluation set (candidate specimens, not acceptance ratification)

- Basic orientation: “What accounts do I have?” or “What's in Sawdust?” only with appropriate authorized subject/context.
- Natural follow-up: “And what about the risk?” retains the correct referent without inventing risk calculation.
- Market-data miss: “Find XLU bull put spreads around 45 DTE” explains insufficient qualified chain evidence, not nonexistent spreads.
- Context correction: SPY success → failed IWM request → “favor reward/risk” must stay on IWM; tool-call arguments are checked.
- Unavailable probability: 50%-credit hit probability is unavailable unless backend has an applicable validated model.
- Genuine incomplete knowledge: explain precisely whether evidence, permission, policy, capability or execution prevents a stronger answer.
- Financial integrity negative cases from ADR-024 plus narration failure and tool-result injection.

Choose a **small** first specimen with the Principal from this inventory, not the entire catalog. No Account-data use via Codex or the SDK until applicable disclosure is established.

## Risks, decisions, and metrics

**Active risks:** SDK/package vs current MCP revision compatibility; default trace export and compaction; improperly scoped context and session replay; model hallucination with genuine numbers; too much context in MCP responses; duplicated schemas; accidental extension of deprecated hosts; unapproved provider acquisition; experimental code promoted to Product without decision.

**Delegated design choices:** exact supported SDK version, local session implementation, UI hierarchy/composition, streaming, packaging, safe diagnostic envelope, and appropriate tests. These must honor ADR-024 and be compared with framework-native functions before adding bespoke machinery.

**Acceptance signals:** time to first useful runnable operator answer; number of important questions answered grounded in v2; correct tool and referent selection across turns; safe problem fidelity; unauthorized disclosures = zero on probed paths; semantic-negative failures; explanation-failure resilience; per-added-capability conversational code delta; time/credits/latency per successful task where measurable. Do not invent universal pass thresholds or CI gates; use existing fitness-control lifecycle.

**Deferred:** *My Questions* saved answer forms, ambient processing tips, broad spread search across underlyings, account-capital policies, target-hit probability models, persistence beyond local session requirements, and any unselected native SDK feature. These remain independently tracked under existing PL-MCP-01 and subject authorities; not prerequisites.

## Project-state and document discipline

- Ratified architecture: ADR-024; planned successor is **not installed or accepted**.
- The 4AM common reconciliation and original/final actor dispositions are retained as provenance, not duplicated normative standards.
- Current strategic direction belongs to the existing LVT; this plan should not create a new Bet by itself.
- Changing canonical roadmap inputs requires deterministic projection regeneration/check; do not hand-edit generated outputs.
- Update this one plan as work is authorized and evidence arrives. Avoid separate plan per question or worktree; track actual task/candidate/installed state in existing canonical authorities.


---

## Delivery management update — October 25, 2026

**Purpose:** Make the existing seven-stage plan actionable for a continuous Product workstream. This is a plan refinement under ADR-024, not new architectural authority or implementation permission. The stages above remain the source of scope; the milestones below are observable exit evidence, not a serial approval bureaucracy. No actor assignment, deadline or completion claim is implied.

### Working-product rule

**One successor application, incrementally matured.** From Stage 1 onward, continue evolving the *same* self-contained SDK-based Talk codebase into the Product candidate. A test harness, fixture, private preview, immutable review snapshot or protected worktree may support validation, but it is not another independently evolving Talk implementation. Merge accepted improvements into the authorized primary successor workstream instead of repeatedly recreating experimental hosts. Do not extend deprecated bespoke Talk.

**Early usability first.** Show the Principal an actual working conversational slice at Stage 1 and an actual useful answer at Stage 2. Do not wait for complete domain coverage, full tool-suite hardening or a large architectural review. Enforce the minimum data/security restrictions before each relevant exposure; defer unrelated speculative concerns.

### Work packages, dependencies and demonstration receipts

| Package / existing stage | Concrete deliverable in the single successor | Evidence to preserve in the existing work item or plan | Practical dependency |
|---|---|---|---|
| **W0 — Baseline / Stage 0** | Identified primary successor location, protected source state, deprecated-host inventory and scoped synthetic/authorized evidence set | Remote revision; accepted/candidate/installed distinction; SDK/MCP compatibility assumptions; authorization and no-touch boundaries | Before modifying application code |
| **W1 — SDK foundation / Stage 1** | Usable text chat with multiple turns; SDK executes the loop and discovers authorized MCP tools; non-tool replies and second-tool selection work | Actual execution path, pinned package/protocol versions, captured tool calls/arguments and normal-runtime trace-egress result | W0; synthetic fixture; no private-data expansion |
| **W2 — First useful answer / Stage 2** | One Principal-chosen authentic operator question answered from governed v2 facts, plus a natural follow-up in the same Talk | Operator-visible capture, v2/MCP request/evidence links, explicit unknowns, correctness of tool subject after failed requests | W1; an existing supported read capability; authorized data profile |
| **W3 — Financial answer UX / Stage 3** | Repeatable interface treatment separating backend-backed financial findings from model commentary without disclaimer overload; evidence still visible on model failure | Principal UX observation; successful and negative semantic specimens; proof commentary cannot populate authoritative fact fields | W2; trusted backend facts available |
| **W4 — Safety / contract reliability / Stage 4** | Safe useful error recovery, no protected egress, preserved request correlation and robust follow-up/error behavior | Controlled 401/403/422/500 + private-canary fixtures; tool-result injection; disclosure capture in normal Node runtime, not only tests; narration-failure test | Appropriate protection before each live-data step; deepen after W2/W3 as appropriate |
| **W5 — Evolution without one-offs / Stage 5** | A second *operator-justified* question/capability works in the same host without question-specific conversational code changes | Before/after host diff; semantic tool-discovery/use result; original question rerun; latency/tokens/effort observation where measurable | W2; real need and an existing-or-justified backend capability |
| **W6 — Product decision / Stage 6** | Operator-usable successor with evidence-based acceptance/rollback proposal, distinct from deprecated Talk | Accepted specimens, open limitations, independent architecture review, realization/install evidence and explicit Principal acceptance | Relevant W1–W5 outcomes verified; separate install/deploy grant |

**Practical critical path:** W0 → W1 → W2 → early Principal observation → W3 and focused W4 → W5 → W6. Security and disclosure checks needed for a specific experiment precede that experiment; other W4 checks may run alongside usability refinement rather than gate first observation.

### Responsibilities and interfaces (roles, not unsolicited actor assignments)

| Responsibility | Accountable authority | Engineering contribution / review |
|---|---|---|
| Operator questions, Product usefulness, financial-commentary UX acceptance | **Principal** | Implementing actor prepares earliest useful specimen and records the observed outcome |
| SDK Talk application, local sessions, authorized MCP admission and UX integration | **Authorized implementing actor, within the active workstream** | Independent reviewer verifies SDK execution, absence of bespoke routing, privacy/evidence boundaries and maintainability |
| Financial facts, policies, entitlement and evidence admission | **Wheelwright API v2 and existing Product/domain authorities** | MCP and Talk transport/project established claims; never reimplement authoritative math in the host |
| MCP contract discoverability and safe result/error semantics | **MCP capability owner under existing repo authority** | Codex may independently exercise approved synthetic/authorized MCP specimens as a preliminary host; this is not a second Talk Product |
| Architecture and fitness-control disposition | **Existing ADR/Technology Quality authorities; Principal for ratification** | Kiro/Codex contribute independently attributable evidence when commissioned; review does not create implementation permission |

No fixed Kiro/Codex implementation ownership is assigned here. Select the implementing actor/workstream using current task authority and repository state, not a stale historical assignment. Ordinary integration corrections inside an authorized workstream should not spawn a new plan or repeated actor approval loops.

### Delivery status and first authorized planning handoff

| Milestone | Current status as of this plan update |
|---|---|
| ADR-024 architecture and four Principal choices | **RATIFIED** |
| Deprecated bespoke Talk preserved | **PRODUCT DEPRECATED**; installed/process state not reverified by this planning update |
| W0 baseline / successor workstream identification | **AUTHOR-VERIFIED** against `265ecedf`; protected W1 workstream and synthetic-only boundaries established; see W1 execution entry below |
| W1 SDK conversational walking skeleton | **IMPLEMENTED / AUTHOR-VERIFIED CANDIDATE**; isolated preview used by the Principal in the reported liquidity conversation; independent review and Product acceptance pending |
| W2–W6 operator acceptance and delivery | **NOT STARTED / NO ACCEPTANCE EVIDENCE PROVIDED** |
| Software implementation / deployment authority | **W1 ONLY explicitly assigned to Codex by the subsequent Principal implementation instruction**; no W2, existing-runtime mutation or production deployment authority |

**Next execution handoff when separately authorized:** Recover current main/worktree/install/task state; confirm the W0 successor location and allowed synthetic fixture; then implement **W1 within that single successor** and immediately expose its multi-turn SDK/MCP conversation to Principal observation. Do not undertake fresh broad architectural research, speculative tool catalog work, or a new isolated Talk product.

### Plan update discipline

At each real learning checkpoint, update **this plan** with: package, observed result and source revision, current active workstream, acceptance status, unresolved blocker (if any), and next legitimate action. Replace obsolete assumptions rather than appending competing plans. Keep architecture ratification in ADR-024, Product capability questions in existing PL-MCP-01, defects in `docs/bugs/`, and actor receipts under their own provenance. If a roadmap projection input changes, use its established regeneration/check process; do not hand-edit derived files.

## W1 execution entry — October 25, 2026

**Authority source:** Principal's subsequent “Codex — Wheelwright Talk Implementing
Engineer” assignment: “The Principal authorizes the bounded W1 implementation
described here.” This supersedes the earlier unassigned planning state only for W1.
Codex is the implementer; independent review remains separate. Authorization includes
source, tests, minimal documentation, existing approved model access with synthetic
data, an isolated preview and submission for review. It excludes W2, real-data
expansion, provider acquisition, changes to grants/credentials, existing installations
or previews, dirty worktrees and production deployment.

**One successor:** `tools/talk/`, protected branch `codex/sdk-talk-w1-20261025` in
`options-candidates/sdk-talk-w1-20261025`, based on remote main `265ecedf`. Future
authorized development evolves this same application. No deprecated host source was
changed. The 21-entry dirty feedback candidate and pre-existing preview listeners
were preserved. WW-GATE-001 remains staged; it is not this task's execution control.

**Observed:** native SDK 0.21.0 Runner/MemorySession conversation; two unchanged
existing MCP servers discovered/invoked against greeting and invented Account fixtures;
SDK MCP client 2.3.1 negotiated protocol 2026-07-28. Six automated checks pass. An
eight-turn real-model synthetic specimen passed, including both tools, a capability
miss, broker referents and an actual failed inventory read followed by the correct
newest subject. Normal-runtime capture recorded only 11 nonstored Responses POSTs;
no conversation, compaction or trace request was observed. SDK rollback on provider
failure required a small public-session-API recovery extension, protected by a
negative test.

**Demonstration:** http://127.0.0.1:8810 — synthetic-only isolated preview. The operator
only opens the link; no backend/credential configuration is required. Browser visual
acceptance has not been claimed. SDK execution, MCP invocation, HTTP availability,
independent review and Principal Product acceptance are separate evidence.

**Receipt:** [W1 implementation and review evidence](https://github.com/brooksbol/options-prototype/blob/fdb4f4b291f9978959b68da7dc2ac23c8477f3ce/docs/reviews/sdk-talk-w1-implementation-2026-10-25.md).
W1 code is submitted as a candidate, not silently promoted to accepted Product.
W2–W6 remain unauthorized/not started. Next step is independent W1 review; the reported operator use below is not Product acceptance or authority for another implementation stage.

**Submitted W1 candidate:** [draft PR #42](https://github.com/brooksbol/options-prototype/pull/42), implementation source `28e5c3449eb932abb06eac391ee83d6615b931ee`, evidence commit `fdb4f4b291f9978959b68da7dc2ac23c8477f3ce`. Application code remains unmerged; recording this task state does not imply independent ACCEPT or Principal Product acceptance.

### W1 operator-reported observation — liquidity question

The Principal supplied the running preview's conversation: “what are the most liquid
etfs and indexes right now?” followed by “a combination of chain depth, trading volume,
and tight spreads. score the top ten accordingly, starting with tight spreads as the
first parameter”. This establishes reported use and a meaningful question emerging
through conversation, not Product acceptance.

Talk retained the topic and disclosed its lack of current market evidence. It did not
produce a backend-computed top ten. It proposed 50/25/25 weights and 20/60-session
windows as commentary; these were not operator-selected or backend-established.
“Spreads first” and “chain depth” still need precise Product meaning before a governed
ranking is possible. General candidate instruments are not current ranking evidence.

Preserve the question under existing PL-MCP-01. No ranking policy, liquidity tool,
provider acquisition, question-specific host patch or W2 implementation is authorized
by this observation. Independent W1 review and Product acceptance remain pending.


## Real-world Product learning — October 26 Income Wheel deployment

[October 26, 2026 real-money Income Wheel deployment case study](../discovery/2026-10-26-income-wheel-real-world-product-learning.md) is a **Principal-observed, human-executed** reference journey spanning market/WAIT assessment, current Account cash and held shares, option candidate comparison (hold/write vs liquidate vs hybrid), evolving constraints, share sales, covered calls, put and buy-write deployment, actual fills and post-trade balance reconciliation. The session recorded **$4,071 gross option premium sold** against a **$4,000** target; it does **not** demonstrate automated Talk execution or trading profit.

Use the **full dated journey and negative specimens** as a high-value question-driven Product benchmark alongside Q01–Q63, not as preselected strategy policy or implementation authorization. Recover existing v1 and v2 capabilities before engineering API v2/MCP gaps. The WW backend, not the MCP adapter or agent, owns local-file access and provider ingestion. Protected financial payload disclosure remains governed by ADR-024.
