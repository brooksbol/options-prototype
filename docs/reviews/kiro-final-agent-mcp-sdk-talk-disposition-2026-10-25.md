# Kiro FINAL disposition — Agent/MCP authority and SDK Talk

**Date:** October 25, 2026 (America/Denver). **Actual reviewer:** Kiro.
**Standing:** Category D independent, actor-owned final review. Not Principal ratification, not collective consensus, not Codex's position, not implementation authorization. Does not modify the shared reconciliation, either Codex record, Kiro's earlier disposition, ADRs, bootstrap, steering or parking-lot state.

**Disposition:** **RATIFY the architectural expression of the four settled Principal decisions.** Codex's FINAL ADR wording is a sound basis; **AMEND it with three material additions** (section 5) before recording. No Product or architectural choice remains open. The reconciliation is **ready for Principal ratification**; it is **not yet ready to guide autonomous implementation** until the decision is recorded in the ADR register and routed (transmission), which both actors identify as a bounded documentation step.

## 1. Revision, discovery and independence

- Reviewed remote `main`: **`45640a785f6e0fec1de5ec0ef8e14436ebd0053f`** (local fast-forwarded, clean, no concurrent local work).
- Discovery: root `AGENTS.md` → `docs/AGENTS.md` → `docs/README.md` → `docs/bootstrap/kiro-cold-start.md` → `docs/parking-lot-11.md` PL-MCP-01 continuation → shared reconciliation, section "October 25 reconciliation update — six Principal mandates and final-pass actor status" → Kiro earlier disposition → Codex earlier disposition → (after independent assessment) Codex FINAL.
- Authority reused from this session's earlier verified reads (unchanged since): `docs/principles.md` (`PRIN-ARCH-BACKEND-AUTHORITY`); `docs/77-api-v2-architectural-guardrails.md` (backend mandate; §§3–5, 10–15, 18); `docs/07c-adrs.md` ADR-015–017, ADR-023; `docs/foundations/technology-quality-constitution-v1.md` Articles I, III, IV, VI; `docs/technology-quality-fitness-controls-v1.md` §3; `docs/mandates/product-first-continuous-engineering-2026-10-13.md`; `docs/roadmap.md` question-driven north star.
- No Kiro FINAL disposition existed before this record. Both final-pass prompts were initially addressed to the other actor; Kiro and Codex each disclosed the mismatch (Codex FINAL §header; parking-lot-11).

## 2. Principal decisions recovered (settled; not reopened)

Source: shared reconciliation update (mandates M1–M6; decisions 1–4), restated in this assignment as D1–D4. D1: Agents SDK executes new Talk's general loop; Wheelwright domain capabilities through MCP; API v2 authoritative; Codex a preliminary MCP host only; no bespoke loops, routers or one-off hosts. D2: restrictive disclosure before exposure. D3: authoritative backend findings plus qualified commentary, intuitively distinguished by UX; evidence survives commentary failure. D4: bespoke Talk deprecated, preserved, no runtime action.

## 3. Four-property assessment

| Property | Finding |
|---|---|
| **Adequacy** | Sound and sufficient as architecture. Remaining gaps are three scoping omissions (section 5), not missing decisions |
| **Transmission** | **Not yet satisfied.** The decisions live in a Category D discovery document and a parking-lot paragraph. The ADR register ends at ADR-023. Injected steering still says "No new technology without demonstrated need … Current stack … intentionally minimal", and `kiro-cold-start.md` still classifies integration mechanics as ordinary judgment. Codex FINAL §3 amendments 1–4 fix this; Kiro concurs |
| **Conformance** | Distinguishable by execution-path evidence (SDK `Runner` iterations, MCP `tools/call` records, backend requests), configuration plus egress tests and Product specimens. **False-conformance trap verified:** the SDK disables tracing by default when `NODE_ENV=test` ([config guide](https://openai.github.io/openai-agents-js/guides/config/)), so a test suite can show no trace export while the normal runtime exports. Disclosure checks must exercise normal-runtime configuration (Codex FINAL notes the same) |
| **Determinacy** | The four decisions remove the consequential forks found in Kiro's earlier disposition. With Codex's precedence clause (Principal selection prevails over minimal-stack, internal-precedent and integration-mechanics guidance; harness-to-Product changes require reconciliation), independent actors should identify the same boundaries. UI, session mechanism, packaging, SDK version and error-metadata mapping remain legitimately delegated |

## 4. Focused questions

| Question | Answer | Classification |
|---|---|---|
| Is the SDK genuinely responsible for conversation and tool execution? | Yes, if the ADR's "SDK wrapper around replacement custom orchestration does not conform" clause is recorded and checked through execution paths, not imports | Settled decision + observational check |
| Is MCP compulsory for domain access without banning host-local functions? | Yes. Codex FINAL §4 correctly permits UI, credentials, trusted projection, lifecycle and SDK extensions | Settled + delegated |
| Are disclosure controls effective before first exposure? | For Talk, yes as written. **Not for the Codex preliminary host** (section 5, A1) | Material amendment |
| Tracing, session storage, compaction, auxiliary model calls? | Covered for Talk: trace export, `store:false`, local session, no remote compaction. Model-backed guardrails and retries are model requests under the same boundary (D2 "before data enters model requests") | Existing settled wording suffices |
| Can the model present an indicative quote as an executed credit? | Yes, in commentary, as the recorded October 25 trace showed ("historical $87 opening credit"). No deterministic mechanism prevents this in free prose. D3's structural guarantee applies to the authoritative region only. Residual commentary error is accepted by D3's "qualified commentary" design, but must be measured | Settled + behavioral fitness |
| Can a correctly sourced number acquire wrong meaning? | Yes; numeric provenance cannot detect role, subject or status errors. D3 already rejects whitelists alone | Settled |
| Does the UX requirement avoid rigidity? | Yes: hierarchy, layout, typography and interaction, with no layout or library mandated | Settled + future Product acceptance |
| Can tool-result text inject instructions? | Yes; new Talk returns tool results to the model, unlike the deprecated construction host. The shared reconciliation does not mention injection; Codex FINAL lists it only as a candidate check | Material amendment (A2) |
| Does explanation failure preserve evidence? | Required by D3; Codex FINAL correctly adds "only still-valid, authorized evidence" | Settled |
| Can a new MCP capability become useful without a Talk handler? | Yes under D1; capability-specific presentation work remains legitimate client work | Settled + observational check |
| Is the deprecated Talk distinguished from accepted, installed and candidate artifacts? | Adequately via Codex FINAL §3 amendment 4 (retain H-004 acceptance, candidate identities and dated receipts; current running status UNKNOWN). Defects found in deprecated installed hosts follow the existing `docs/bugs/` process; filing does not authorize remediation | Existing authority suffices |
| Can an experimental precedent override the SDK selection? | Not if Codex's precedence clause and steering/bootstrap routing are recorded | Transmission amendment (Codex) |
| Duplication or unnecessary governance? | None if recorded as one ADR plus routing. Do not add a parallel standards set | — |
| Missing Product decisions? | None. Remaining questions are delegated design | — |

## 5. Material amendments (exact minimal wording)

Insert into the ADR text proposed in Codex FINAL §3 when the Principal ratifies.

**A1 — Disclosure scope covers development and verification hosts.** Codex FINAL's disclosure paragraph binds "Talk". D1 also permits Codex as a preliminary MCP host, which sends conversation and tool results through a different provider surface and retains full tool results in local session logs (verified: `~/.codex/sessions/2026/10/25/rollout-*.jsonl` and `~/.codex/artifacts/wheelwright/mcp-host-review-20261025/` contain complete MCP tool results). Without this sentence, "Codex MAY be used" could be read as permission to run real Account data through it.

> Any model host used for Wheelwright MCP development or verification, including Codex, receives only synthetic or otherwise authorized data within existing scoped disclosure permissions; protected Account data requires explicit Principal authorization for that host before exposure.

**A2 — Tool results are untrusted model input.**

> MCP tool results, backend free-text fields and other retrieved content are untrusted model input. Grants, tool admission, disclosure configuration and the authoritative findings presentation MUST NOT depend on model compliance with instructions; injected instructions must not widen data scope, invoke unadmitted tools or alter authoritative findings.

**A3 — Principal negative specimens recorded as Product acceptance evidence.** These were supplied in the Principal's final-review assignment but are not in the shared reconciliation:

> Commentary that strengthens authority is nonconforming, including: reward/risk restated as probability; an indicative credit restated as an executed opening fill; maximum loss restated as maximum profit; unsupported qualitative recommendations stated as Wheelwright policy; stale or wrong-subject figures presented as current facts.

Each is wording within the settled decisions, not a new decision.

## 6. Proposition dispositions

| Proposition | Disposition | Category |
|---|---|---|
| D1 SDK runtime + MCP domain path + v2 authority + anti-wrapper clause | **RATIFY** | Settled Principal decision |
| D2 restrictive disclosure before exposure | **RATIFY, AMEND (A1)** | Settled; scope wording |
| D3 authoritative findings plus qualified commentary; UX distinction; evidence survives failure | **RATIFY, AMEND (A3)** | Settled; future UX acceptance |
| D4 deprecation with preservation, no runtime action | **RATIFY** | Settled |
| Precedence of Principal selection over minimal-stack, internal-precedent and integration guidance; harness-to-Product trigger (Codex FINAL ADR paragraph 5) | **RATIFY** | Candidate guidance, resolves Kiro P3/P4 |
| Tool-result injection boundary | **AMEND (A2)** | Candidate guidance |
| Backend authority, error/correlation fidelity, grants | **NO NEW STANDARD** | Existing: principles, Doc 77, ADR-015–017; MCP 2026-07-28 Tools error handling and `_meta` trace context are supporting normative protocol text |
| Record as one ADR plus routing (PL-MCP-01, steering, bootstraps, realization material) | **RATIFY** Codex FINAL §3 amendments 1–4 | Transmission |
| Fitness checks (section 7) | **RATIFY as observational candidates; no gates** | Fitness controls v1 §3 |
| CSVLOD: ADR records choice; short Solution Options rationale; existing realization material serves Landscape; no per-tile documents | **RATIFY** | ADR-023 D1/D2 |
| A universal claim-ID registry or host semantic validator for free commentary | **REJECT** | Would create a second semantic model; conflicts with backend authority |

## 7. Minimal falsifiers for later implementation (not executed)

| Check | Type |
|---|---|
| SDK `Runner` owns iteration; no direct `responses.create` loop in host; no question-to-tool router (inspect call paths, not strings alone) | Static + architectural judgment |
| New MCP capability usable with no conversational-routing diff | Deterministic (diff) |
| API v2 problem code, title and request ID survive API → MCP → Talk; private canary never forwarded | Deterministic |
| Normal-runtime configuration (not `NODE_ENV=test`): trace export disabled, `store:false`, local session, no remote compaction; synthetic-canary egress capture | Deterministic |
| Same check for any Codex or other verification host before protected data (A1) | Deterministic + Principal authorization record |
| Authentic backend numbers with wrong role, subject or status in commentary (the A3 specimens) cannot appear in, or rewrite, the authoritative findings; commentary occurrences measured over repeated runs | Behavioral (trend) |
| Valid authorized evidence remains visible when commentary fails | Deterministic (injected failure) |
| Account and underlying referents survive follow-ups and errors (SPY → IWM → "favor reward/risk"), verified by tool-call arguments | Behavioral |
| Instruction text in a tool result cannot widen scope, call unadmitted tools or alter authoritative findings | Behavioral + deterministic boundary assertions |
| Deprecated Talk paths receive no new feature commits | Static (repository history) |
| Fresh actor recovers the four decisions from root `AGENTS.md` without a supplied filename | Behavioral (transmission) |

## 8. Comparison with Kiro's earlier disposition

| Earlier Kiro objection | Status |
|---|---|
| "Based on the SDK" undefined (SDK-washing) | **Resolved** by D1 and Codex anti-wrapper wording |
| MCP use for new Talk unstated | **Resolved** by D1 |
| Disclosure deferred to acceptance | **Resolved for Talk** by D2; **open for verification hosts** → A1 |
| Pause scope ambiguous | **Resolved** by D4 plus Codex realization amendment |
| Determinacy and precedence (runtime selection, harness trigger, internal-precedent limit) | **Resolved** by Codex precedence clause, once routed |
| Transmission absent | **Still open**; bounded ADR/routing step agreed by both actors |
| Missing injection falsifier | **Partly resolved** (Codex check) → A2 |
| Backend claim identity deferred | **Resolved** by D3: authoritative region from backend results; no registry needed |

## 9. Critical evaluation of Codex FINAL (peer evidence)

- **Agree:** the four RATIFY dispositions; transmission not satisfied; ADR wording substance; precedence clause; `NODE_ENV=test` trap; "do not standardize" list; no blocking Product choice.
- **Disagree (material):** the disclosure paragraph is scoped to Talk only (A1); untrusted tool-result handling is a check, not a boundary statement (A2); Principal negative specimens are not carried into durable text (A3).
- **Disagree (moderate):** Codex FINAL §4 says to "validate subject, units, economic role and source qualifications, including purely qualitative commentary." As an implementation expectation this invites either a host-side semantic engine (contrary to backend authority) or an LLM judge (insufficient alone under D3). The guarantee should rest on the authoritative region being populated only from backend results; commentary semantics are measured by behavioral falsifiers, not validated deterministically.
- **Factual note:** Codex FINAL §1 states the shared candidate was unchanged from `f982ad62`; at `45640a78` it has since gained the dated six-mandate update (`1503bafb`), which this review used.

## 10. Repository observations (no action taken)

- `npm run check:roadmap-projection` reports the committed projection **stale** at `45640a78`. Commit `45640a78` changed `docs/parking-lot-11.md`, a canonical projection input, without regeneration; staleness also predates it. This record changes no projection input.
- The shared reconciliation's statement that Kiro FINAL is pending becomes historical upon this record; updating it belongs to the routing amendment.

## 11. Readiness and blocking issues

- **Blocking for Principal ratification:** none.
- **Blocking for autonomous implementation:** ADR recording and routing (transmission), with A1–A3 included.
- No further broad research, framework comparison or review cycle is recommended.

## 12. Limits and cost

Documentation-only review. No code, tests, SDK execution, model calls or egress capture. SDK facts are from current unversioned JS documentation; `@openai/agents` 0.21.0 was the npm version observed earlier on October 25. Elapsed about 4 minutes (12:52–12:56 MDT, start to first push); token and monetary cost unavailable to Kiro. Principal interventions: one prompt correction (actor-addressing). External content was rephrased for licensing compliance.
