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
