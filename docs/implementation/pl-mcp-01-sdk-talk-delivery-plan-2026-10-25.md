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
| W2–W6 operator acceptance and delivery | **NO STAGE ACCEPTANCE**; later bounded experiments include evidence-access/UX work, not completion, installation or delivery |
| Software implementation / deployment authority | Initial W1 grant followed by the **bounded question-driven assignments below**, including local retained-evidence assessment. No merge, deployment, broadened model disclosure or unrelated Product implementation |

**Current execution handoff:** Independently review the frozen October27 audit/correction candidate linked below. W1 implementation and subsequent bounded candidate engineering are recorded; no second host, speculative catalog, installation or disclosure expansion follows from review readiness.

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
At W1 submission, W2–W6 remained unauthorized/not started. The later autonomous experiment below is a separate bounded Principal authorization, not automatic stage progression or Product acceptance.

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

### Authorized continuous question-driven experiment — October 25, 2026

**Authority:** subsequent Principal “Autonomous Wheelwright Talk Product Engineer”
assignment: “including reusable backend/MCP changes that existing Product authority
supports.” Codex owns actual application/model conversations, diagnosis, ordinary
corrections and original-question retests without routine Principal intervention.
Continue in `tools/talk/`, branch `codex/sdk-talk-w1-20261025`, draft PR #42; do not
revive deprecated hosts. This candidate-plan update does not alter accepted main.

Boundaries remain synthetic/otherwise explicitly permitted evidence, existing
approved model access, local isolated preview and tests. No new provider access,
real Account disclosure, existing credential/grant changes, installed-service
changes, merge or deployment. Defer affected questions at genuine authority/data
boundaries and continue other productive authorized questions; neither a passing
test nor a checkpoint ends the assignment by itself.

**Candidate result:** added two reusable MCP reads over existing API v2 retained
quotes and current portfolio Positions; actual Java controllers/SQLite/backend
authorization exercised against invented records. Account discovery uses the same
coherent fixture. Existing greeting remains. The one successor is still `tools/talk/`;
reusable adapters are in `tools/mcp-v2-evidence/`.
Corrected discovery-vs-observation qualifications, source/storage clock handling,
lossless source presentation, native SDK history replay after narration failure,
workspace subject discovery and completion of requested reads. MCP error disposition
survives narration failure. Native backend projection reduces redundant context.
No scoring policy, live feed, host financial engine or question router.

**Open observed narration risk:** final preview prose still inferred quote currency/size
units and offered rough cross-source arithmetic despite source qualifications.
Trusted source results remain exact and separate; broad financial claim integrity
and the W3 UX are not established. Do not treat synthetic author verification as
permission for protected financial evidence or Product acceptance.

Current top-ten liquidity remains unavailable: no authorized current comparable
options universe, depth evidence or selected ranking semantics. Fifty/twenty-five/
twenty-five was a model suggestion, not policy. [Closed-loop implementation receipt](../reviews/sdk-talk-closed-loop-2026-10-25.md)
records before/after questions, counterexamples, costs, exact source and remaining
boundaries. Author verification is separate from independent review and Principal
Product acceptance. W2–W6 are not declared complete.

### Real retained evidence and API v2 capability engineering — October 25

**Authority:** Principal's subsequent “Wheelwright API v2 Capability Engineer and
Talk Integration Engineer” assignment. Assess Q01–Q63 and the liquidity seed against
actual retained evidence; implement bounded reusable backend/MCP improvements.
Synthetic records remain tests, not Product coverage. The assignment does not
broaden protected Account/Position model disclosure, provider access, grants,
installed services or integration authority.

**Author-verified candidate source:** `8ee880ca72110eaa03984731c6ad80546dd94091`
in the same protected SDK successor/PR #42. Candidate additions: backend retained
quote-side measurement, existing MCP quote measurement/Position continuation and
lifecycle selection, compact exact source cards, and real Account metadata profile
within the existing nickname/broker/count permission. No new MCP tool, question
router, host financial engine or general agent loop.

**Coverage:** all 63 assessed, not 63 runtime passes: 4 bounded answers (one actual
SDK metadata answer plus three conceptual authority answers), 30 partial, 10
evidence-blocked, 11 unresolved-semantic and 8 not verified. Protected financial
model testing remains blocked; full financial answers are not established.
Readonly backend evaluation covers 155 retained Positions, all lifecycle UNRESOLVED;
reported open P/L is not lifetime earnings. Real retained chains exist, but do not
establish a current comparable liquidity ranking.

Actual SDK Q01/Q02/Q63 and local real API/MCP checks are separate from synthetic
contract tests. The new quote measurement HTTP route is **not installed** in the
operational backend. The same application is observable at http://127.0.0.1:8812
with approved real metadata only and fresh local sessions per turn. Existing
previews/dirty candidates remain protected. No Product acceptance is asserted.

[Coverage, source inventory, blockers and review receipt](../reviews/sdk-talk-real-evidence-2026-10-25.md)
links the complete exact-wording matrix and safe machine evidence. Remaining
financial work needs applicable evidence/meaning or disclosure authority; do not
substitute synthetic demonstrations or infer a merge/deploy grant from this result.

## Real-world Product learning — October 26 Income Wheel deployment

[October 26, 2026 real-money Income Wheel deployment case study](../discovery/2026-10-26-income-wheel-real-world-product-learning.md) is a **Principal-observed, human-executed** reference journey spanning market/WAIT assessment, current Account cash and held shares, option candidate comparison (hold/write vs liquidate vs hybrid), evolving constraints, share sales, covered calls, put and buy-write deployment, actual fills and post-trade balance reconciliation. The session recorded **$4,071 gross option premium sold** against a **$4,000** target; it does **not** demonstrate automated Talk execution or trading profit.

Use the **full dated journey and negative specimens** as a high-value question-driven Product benchmark alongside Q01–Q63, not as preselected strategy policy or implementation authorization. Recover existing v1 and v2 capabilities before engineering API v2/MCP gaps. The WW backend, not the MCP adapter or agent, owns local-file access and provider ingestion. Protected financial payload disclosure remains governed by ADR-024.

## Authorized capability-coverage audit and corrections — October 27, 2026

**Authority:** Principal's “Independent Wheelwright Capability-Coverage Auditor and Backend Engineer” assignment, “Adversarial coverage audit followed by authorized, bounded engineering corrections.” This expressly extends the candidate engineering scope beyond the earlier W1-only summary, without granting protected disclosure, acquisition, installed-service mutation, new grants, trading, main merge or PR42 merge. Codex is implementer; independent reviewer remains separate. Protected branch `codex/capability-coverage-audit-20261027` is based on PR42 `cd3b9a6e`, reconciled with main `11a7cc1c`; PR42 and running services are preserved.

[Audit/correction receipt](../reviews/sdk-talk-capability-audit-2026-10-27.md) preserves the original exercise, exact63-row evidence assessment, reverse provider/source/API/MCP inventory, ten related/new specimens, tastytrade trace, real-source aggregates and synthetic SDK transcript. Buying power was absent from Q01–Q63, and the existing balance acquisition/retention path was overlooked. Three inspected stores contain no tastytrade balance originals;105 Fidelity balance originals provide confirmed unmodeled/unexposed facts. A provider-free retained-balance API/MCP candidate now preserves broker-native quantities, scope, clocks and unknowns. The same SDK naturally selects it; no financial engine/router was added to Talk/MCP.

**Standing:** author-verified candidate; not independently accepted or installed. Original full-answer counts remain4 bounded assessments/30 partial/10 evidence-blocked/11 unresolved semantics/8 unknown; only one prior real metadata SDK answer and no new real financial SDK answer established. New synthetic balance path passes. Existing restrictive real metadata profile remains unchanged. API publication acceptance pending; no manifest refresh/publication. **Next action:** independent review of the frozen audit candidate, with source/runtime/privacy checks, keeping reserved operations separate.

## Principal-authorized real retained-read preview — October 27, 2026

After observing the metadata-only preview fail “what is my margin position in pts right now?”, Principal instructed **“turn on everything.”** In this immediate read-preview context this authorizes admission and OpenAI API disclosure of the implemented real Account/financial/market read results under existing backend User grants for interactive Talk, including normal local conversational replay. It does not authorize new grants, changes to existing brokerage/operational credentials, brokerage acquisition, trades or production integration. Existing tracing-off, store:false, local sessions and no remote conversation/compaction remain. This supersedes the metadata-only restriction for the **new explicitly labeled real retained-read profile**, not other users or hosts.

Protected branch `codex/talk-authorized-real-reads-20261027` continues the same `tools/talk/` successor from frozen audit `91ec937c`; PR42 and the audit submission remain untouched. [Runtime/verification receipt](../reviews/sdk-talk-real-read-profile-2026-10-27.md) records the isolated backend, live original grants, private portfolio snapshot, separate existing quote read authority and the actual PTS SDK trial. Original stores and installed services remain unchanged. This is a Principal-authorized local preview, not independent acceptance or production delivery.

**October27 operator inventory rejection:** “show me all of my positions” was answered with empty OPEN lifecycle queries. Principal rejected it; prior real-preview handover is not Product acceptance. The same read-preview workstream now exposes the existing retained holdings collection through a reusable MCP inventory read and renders actual rows/denials; OPEN is not an implicit inventory filter. Existing grants allow Sawdust's seven holdings but deny PTS/tt1 holdings, so complete all-Account custody remains blocked by those grants. No permission expansion inferred. See the [same runtime receipt](../reviews/sdk-talk-real-read-profile-2026-10-27.md#operator-rejection-and-inventory-correction--october27).

**October27 balance UX rejection:** [BUG-052](../bugs/BUG-052-talk-balance-history-overretrieval.md) records excessive retrieval, private model context and presentation. Candidate API v2 source-time selection, bounded MCP default and compact Talk card reduce the actual original PTS question from82 observations/34,260 input tokens to1 observation/6,634 input tokens. A natural source-time follow-up establishes the missing October26 source without substituting receipt time/currentness. [Same runtime receipt](../reviews/sdk-talk-real-read-profile-2026-10-27.md#operator-balance-ux-rejection-and-bounded-correction--october-27) preserves author evidence and browser-verification limitation. No grants/acquisition/v1 changes or Product acceptance inferred.

**October27 screenshot falsification:** Principal rejected bd11fea0's general rendering: holdings still expanded into a large source block and answer Markdown appeared literally. The same [BUG-052 record](../bugs/BUG-052-talk-balance-history-overretrieval.md) now preserves the failed scope assumption, compact lazy generic sources, safe local Markdown dependency, 22-test result and native Chrome interaction evidence. This is a presentation-only successor within existing delegated engineering; backend authority, SDK conversation, disclosure profile and v1 remain unchanged. No Principal acceptance inferred.

## Principal production direction — October27

Principal explicitly approved option A: add only holdings-read grants for PTS and tt1, then supplied today's Sawdust Positions CSV. Subsequent instructions: scan Downloads since October19; finish the CSV problem; fix tt1 balance access; **“move this work to production. no more isolated work.”** This authorizes integrating this work into main and installing the SDK successor at the existing Talk entry point, replacing the deprecated host and preview-only data path. The earlier candidate-only/deployment reservation is superseded for this bounded delivery. It does not authorize trades, new brokerage/provider grants, unknown Account access, fabricated financial semantics or Product acceptance claims. Codex remains implementer, not its own independent reviewer.

Author operational evidence so far: exact two holdings flags added with all other fields preserved; subsequent tt1 balance-evidence read authorized and added. Private rollback receipts contain identity/grant details; public reports omit credentials/financial values. Sawdust supplied CSV was accepted by existing backend POST; all10 security quantities/sides match exactly,11 returned rows include one source cash-category observation, and one unsupported source row remains explicitly outside inventory meaning. Source date October27, not October19.48 additional supported Fidelity CSVs were then submitted through existing `ww sync`/backend admission. The initial Downloads scan counted81 CSVs (61 after October19 ended),71 recognizable Fidelity files,21 already retained including the supplied import. A later new Wheelwright export increased the live directory count to82; do not rewrite the earlier observation.

Two remaining combined Accounts_History exports exposed missing account-row attribution support. Bounded backend extension reuses strict source-envelope validation, exact retained originals, per-row owner filtering and existing Activity normalization/row-equivalence rules. Unknown foreign Accounts prevent original-byte disclosure but do not prevent admission of the explicitly authorized owner's rows, matching the existing Positions precedent. Account names/numbers are excluded from normalized row fingerprints so equivalent legacy/combined rows do not become new ledger events merely because their envelope differs. No new financial event identity is claimed.

The successful full holdings read also exposed a synthetic-host output cap of700 tokens. Official Responses status and SDK error diagnostics establish `incomplete/max_output_tokens` despite HTTP200; the generic failure was not authorization. Raising the general bounded output cap to4096 passed the real-model retest (2 requests,29,717 tokens,11.067seconds). No financial logic or question-specific host routing was added. Installed service uses the operational backend directly, not a private SQLite copy; localhost8814 bookmarks redirect to installed Talk8787. Production deployment verification and final data reconciliation remain to be appended to the existing runtime receipt after observation.

**Installed October27:** production direction completed at main349dc014 and deployed runtime: SDK Talk8787,8814 redirect, existing operational v2 backend3101, direct shared production evidence. All71 recognizable Fidelity Downloads originals are retained/accepted for authorized Account rows, with five unregistered foreign Accounts remaining excluded. PTS/tt1 holdings and tt1 balance grants work; a real authorized tt1 backend refresh succeeds. Three installed SDK operator questions pass, including authoritative tt1 buying power. [Final runtime receipt](../reviews/sdk-talk-real-read-profile-2026-10-27.md#installed-result--october27-final-production-observation) records exact runtime/JAR,1035 Java checks,22 Talk tests, source/privacy checks, costs/limits and scoped Public API reference acceptance-pending status. No Principal Product acceptance or independent reviewer approval claimed. Newly active v1 work and shared project projections are preserved.

## Installed portfolio falsification replay — October 27

The Principal's subsequent production conversation falsifies portfolio completeness despite earlier successful transports. Reconcile through the [existing real-read receipt](../reviews/sdk-talk-real-read-profile-2026-10-27.md#production-portfolio-replay-correction--october-27-after-installed-conversation), BUG052/053 and the October26 case study. Reused custody selection now supports bounded backend option inventories/counts; source-native Fidelity cash labels survive projection; existing transaction collection gains bounded retained-only selection and MCP exposure; a missing optional quote-measurement route no longer erases a successful authoritative quote read. UI renders typed option rows rather than depending on model enumeration. CSP construction/collateral identity, current-held opening-cohort premium and a universal liquidity ranking remain distinct unestablished claims. Production delivery verification follows in the linked receipt; author implementation is not independent approval or Product acceptance. Preserve the concurrently active v1 thread.

Installed replay closeout: implementation `067e627f` is live at `http://localhost:8787/`. The linked receipt and machine evidence preserve failed attempts and the final targeted financial-authority replay. Five short-put rows across three Accounts are complete for their selected source cuts; CSP count, current-held premium attribution and current liquidity ranking remain unestablished. Tests and measured usage are recorded without claiming all63 questions rerun, independent approval or Product acceptance.

## October29 production temporal, transaction and closed-trade remediation

Principal's Production Remediation Engineer assignment continues bounded backend/API v2/MCP/SDK implementation and installed verification, preserving existing grants, v1 and ADR-024. Earlier production installation direction remains explicit for this work; no authority for trading, new grants, Gmail ingestion or background polling is inferred. [BUG-054](../bugs/BUG-054-talk-relative-date-grounding.md) owns missing trusted temporal context; [BUG-053](../bugs/BUG-053-talk-operational-account-evidence-disconnect.md) retains the transaction read-through disconnect.

Subsequent Principal direction selects **“Show me this month's closed-trade P/L”**, one row/result per closed trade, **“with totals”**, and **“no disclaimer noise. hide any of that under accordion links.”** This authorizes the narrow reported closed-round-trip net metric; it does not settle an unqualified monthly total-account-performance default. Backend source-net accounting and conservative unique whole-package matching supply results; MCP passes them; SDK chooses the reusable period view. No leg cash-flow table substitutes for P/L. Estimated source fees remain in the exact metric label; details and analysis are deliberate disclosures. [Implementation and verification receipt](../reviews/sdk-talk-temporal-executions-remediation-2026-10-29.md) preserves scope, failed assumptions, real/simulated distinctions and runtime evidence. Independent review and Principal acceptance remain separate.

Installed October29: implementation `e9de0049` is live at8787 with unchanged grants/v1. Three actual SDK turns naturally select today's October29 executions, October1–29 closed-trade net P/L with totals, and October28 activity. XLE/EWZ/XLF reported round trips reconcile; source fee estimates remain typed. Outcome-first report and collapsed details pass installed-asset browser replay. Final serial Java1051 checks (two skips), Talk31/MCP14 and39-operation contract validation pass. See the linked receipt/machine evidence for clocks, costs, privacy and unresolved total-account-performance semantics. Author verification is not independent approval or Principal acceptance.

### October29 Principal acceptance falsification and follow-up

Principal reports Tests1/2/4 passing and Test3 (XLF evidence) failing; Tests5/6 initially untested. This is partial UX/functional acceptance, not financial acceptance. Continuing the same bounded workstream: recover the existing exact transaction item read for MCP drill-down; suppress empty analysis; format tactical USD to cents with exact source decimals retained; reconcile directly against hash-verified originals; exercise all Accounts and September. No new financial semantics, grants or acquisition layer. Existing BUG052/053 and the October29 implementation receipt own findings and verification. Fidelity closed-report support and verified September coverage remain distinct from the corrected XLF/UI defects.

## October29 Product integration continuation

Principal assigned staged Product Integration/Continuous Engineering leadership: independent financial baseline; leading tt-live tactical parity; reuse of operational intelligence; screenshot/download interactions; two-axis real Product acceptance. The [single maintained capability/presentation matrix](pl-mcp-01-capability-presentation-matrix.md) is the acceptance/prioritization instrument, not a parallel backlog. [Current scoped engineering receipt](../reviews/sdk-talk-tactical-integration-2026-10-29.md) separates source recovery, candidate implementation, independent reviews and installed outcomes. Existing BUG052/053/054 and PL-EVID-OBS retain lifecycle ownership. Preserve installed8787 and unrelated dirty v1 work during candidate engineering. Disabled source-profile permissions block only affected real-data parity; they do not stop other authorized engineering or create permission to broaden grants.

### October29 installed integration continuation receipt

Independent financial baseline remains QUALIFIED; reviewed tactical/native, explicit images, governed CSV and existing holdings acquisition increments are integrated/installed under the existing Principal production direction. Real replay falsified adapter UUID and history/empty-cursor behavior; accepted successorsa904/9a84 are installed atbf6fecea. Full [workspace receipt](../reviews/sdk-talk-workspace-interactions-2026-10-29.md#final-installed-real-replay-and-preservation-receipt) and existing [two-axis matrix](pl-mcp-01-capability-presentation-matrix.md) own actual outcomes, costs, reviews and remaining boundaries. No Principal acceptance or broad financial completeness inferred. Additional tt1 Order/Account-market/global market prerequisite grants and request-triggered policies were concretely requested but remain unapproved/unchanged; compatible-source/opening-occurrence proof still required. No v1/credentials/trading changes or PR42 merge. Continue full real tactical parity only within received source authority; do not turn missing semantics into a new financial engine.

### Principal-approved tt1 request-triggered evidence scope — October29

Principal task **“Apply the Principal-approved tt1 read-only evidence access and request-triggered acquisition policy”** explicitly authorizes only: `account.orders.read:tt1`, `account.market.read:tt1`, global `market.read` including shared-market resources, request-triggered Order read-through with300-second reuse and market read-through with30-second reuse. Principal quotations supplied with the authorization: **“no separate, explicit Refresh action”** and **“this is all fine for now. make it so.”** Ordinary authorized reads, including SDK-selected requests and other authorized clients, may trigger acquisition without per-read confirmation. Reuse intervals are acquisition policy, not freshness guarantees.

This supersedes the prior pending-permission boundary for exactly these capabilities. It does not expand PTS/Sawdust grants, brokerage OAuth, model-data disclosure, trading/order mutation, autonomous polling or unrelated configuration. Codex is assigned operational implementer; source changes, if necessary, retain normal isolated candidate/independent review requirements. Existing trusted backend User bootstrap owns grants, with exact before/after preservation checks and private rollback; no direct ad-hoc SQL grant patch. Accepted runtime remains installed during preparation. Source/provider originals stay private; normalized minimum-necessary SDK results remain under existing disclosure. Permission success is not opening-association or tactical-parity acceptance. Compare compatible cuts and preserve unknowns. Receipt continues in the existing October29 workspace-interactions review and capability matrix.

Approved tt1 source scope applied through trusted server bootstrap and explicit process policy, verified exact3grantadds/allotherflags unchanged. Installed runtime0054c2fa contains independently accepted shared-budget transport correction. Real SDK/acquisition/reuse/isolation/CLI comparison and remaining opening/coverage dependency gaps are persisted in the [activation receipt](../reviews/sdk-talk-workspace-interactions-2026-10-29.md#approved-tt1-policy-installed-verification--october29-1453-mdt) and existing matrix/BUG053. Additional permission approval is not pending for this exact scope. Full financial/native tactical parity is not accepted; no extra grants or Product semantics inferred.

### Principal financial integration continuation — October29

Principal explicitly assigns bounded APIv2 financial integration to close remaining tt-live parity, correcting demonstrated association/dependency defects without weakening financial authority. Candidate branchcodex/talk-tactical-financial-20261029 protects installed8b6857fd/0054c2fa and fixed approved grants/policies. Existing BUG053/matrix and [financial dependency receipt](../reviews/sdk-talk-financial-dependencies-2026-10-29.md) own work/evidence. Independent design preserves the native-bracket versus current-origin boundary; coverage-only overpropagation and missing native parent navigation are corrected, with compact native degraded UI. No universal Position identity, current-held origin from matching alone, new disclosure/grants or unrelated v1 change. Source freeze and independent implementation review precede production integration under existing bounded production direction.


Financial dependency successor independently ACCEPTed at6f5ed308 after two actual falsifiers were corrected; installed integrated sourceb008cbe1 preserves concurrent Principal daily-report docs. Installed actual SDK monitoring, Position/native-bracket drill-down and all-Account inventory pass; four-structure same-cut comparison restores contractual geometry without admitting unproved entry economics. Native installed UI replay passes4SVG/mobile/keyboard/default evidence checks. [Detailed receipt and measured usage](../reviews/sdk-talk-financial-dependencies-2026-10-29.md#installed-successor-verification--october29). Full opening/progress parity and Principal acceptance remain open; existing approved grants/policies unchanged.


### Shared tactical result — Principal bounded continuation, October29

Principal authorizes one reusable backend tactical result for an engineer-only CLI and existing SDK/MCP/native renderer under b67ff449 operate-every-day direction. Candidatecodex/shared-tactical-result-20261029 reuses exact Position tactical projection; no new estimate/continuity semantics, installed tt/v1 changes, main merge or deployment. Existing grants/policies/disclosure fixed. [Contract, falsifiers, real retained dual-consumer proof and measurements](../reviews/sdk-talk-shared-tactical-result-2026-10-29.md). Independent review and Principal acceptance remain separate. Existing gaps stay in BUG052/053 and this plan/matrix.

Shared tactical successor97c943a2 independently ACCEPTed after preserved aa77 warning/range rejection.425backend/continuity tests0failures1skip;65Talk/CLI tests;8OAS checks. Real retained directHTTPCLI and actualSDK/MCP consume same selected QQQ financial fields/source clocks; native preview8816 available. Source/receipts in candidate branches only; no main merge or production install. [Final disposition](../reviews/sdk-talk-shared-tactical-result-2026-10-29.md#independent-acceptance-preview-and-operational-protection). Principal acceptance pending; daily tools/grants/policies preserved.


### Principal shared-result acceptance follow-up, October29

Test1 operator-positive; Test2 compact QQQ scope failed; Test3 exact evidence passed. Authorized bounded correction stays under existing SDK/API/MCP architecture: exact current underlying selection, conversation display scope, generic empty-analysis suppression. [Candidate/real SDK evidence](../reviews/sdk-talk-selection-2026-10-29.md). No new financial semantics, grants/policies, main merge or production deployment.

Selection successorb21404f1 independently ACCEPTed after preserved379 nonempty-code rejection. Existing SQL/MCP/UI scope controls pass independently;426backend1skip/72Node/8OAS author results. Only temporary8816 updated; production/main unchanged. Principal reload/retest pending; [final receipt](../reviews/sdk-talk-selection-2026-10-29.md#independent-acceptance-and-owned-preview-update).


### Principal bounded acceptance — October29

Principal confirms corrected8816 three-turn4→QQQonly→4 PASS and accepts shared-result/selection experiment atb21404f1. Record this as bounded Product acceptance, not merely author/reviewer success. Residual empty analysis andCURRENT label scrutiny, plus full economic parity, remain separate open gaps. CURRENT implementation means≤12h policy window (also Open), not live/recent acquisition. Reviewed matching artifact/rollback prepared; main integration/production8787 deployment require the next explicit operational decision. [Acceptance and proposal](../reviews/sdk-talk-selection-2026-10-29.md#principal-bounded-product-acceptance-and-integration-decision).


### Principal integration/deployment authorization — October29

Principal selected **“A”** in response to the concrete proposal **“Integrate and deploy the accepted candidate to port8787, keeping residual gaps open.”** This authorizes integration of independently reviewed/Principal-bounded-accepted runtimeb21404f1 with its acceptance receipts, matching backend/API/MCP/UI installation, and normal post-installation verification. It does not authorize financial semantic changes, residual cleanup implementation, grant/policy/OAuth/trading changes, unrelated v1/service changes or changes to PR42. Preserve existing tools and approved300/30read policies. Restart only v2evidence3101 andTalk8787; retain matching source/JAR rollback and verify normal privacy/account boundaries. Earlier explicitly unapproved deployment state remains historical; this decision supersedes it for this exact release only.
