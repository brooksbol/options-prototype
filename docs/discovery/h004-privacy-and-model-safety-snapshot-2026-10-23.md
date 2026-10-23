# H-004 — API confidentiality and hosted-model safety stopping-point snapshot

**Recorded:** October 23, 2026.  
**Standing:** Category D Principal-context handoff and attributed research; NOT a new ratified Product policy, model-safety GO, production deployment, or H-004 independent acceptance.

## Principal intent and sequence

The Principal moved away from synthetic-only H-004 as the Product destination. A simple question ("What accounts do I have?") surfaced a real backend disclosure defect and a cross-cutting question of whether external inference can safely process authorized financial information. Principal-directed sequence:

1. File a bug for API v2 full-account-number disclosure.
2. Correct the bug and independently verify.
3. Audit API v2 for other PII/inappropriate sensitive disclosure; file and fix distinct verified bugs.
4. Independently assess actual hosted-model safety, provider policies, current API project settings, and exact `wwt` egress/answer-integrity implementation.
5. Only after acceptable gates, resume the real-account question in `wwt` **without substituting a synthetic environment for the real operator experience**. Synthetic test data remain suitable for negative/regression tests.

The Principal described the model/trust-boundary constraint as a likely **Herbie** (Theory of Constraints), rather than a reason to conceal the gap behind fixtures. Confirm the actual throughput bottleneck from evidence; do not label every missing control a proven Herbie.

## BUG-049

[Defect record](../bugs/BUG-049-api-v2-account-discovery-full-number-disclosure.md). Source investigation found ordinary `GET /v2/accounts` and `GET /v2/accounts/{accountId}` serialize full `brokerAssociation.accountNumber`; CLI masking (resolved BUG-035) did not change this API behavior. No cross-User breach was established.

The Principal reports Codex implemented a bounded fix in an isolated checkout, omitting numbers in both endpoints while retaining Account identity, aliases, broker labels, grants and internal bindings. **Codex-reported author verification:** 1,018 Java tests, 0 failures, 2 skips; 21 CLI tests; schema/doc checks passed. Candidate `/tmp/wheelwright-bug049-candidate-20261022.tar.gz`, local to Principal environment. This is an **attributed report**, not independently verified here. Candidate remains author-verified, uncommitted, not independently accepted or deployed; BUG-049 remains Open until warranted closeout.

Kiro was assigned independent frozen-candidate acceptance; no Kiro result is present in this stopping-point context. Do not upgrade status based on the existence of an acceptance prompt.

## Muse external provider research (preserved verbatim as separately supplied Markdown content)

[Full original Muse Markdown report](../research/hosted-llm-api-financial-data-privacy-20261022.md), researched October 22, 2026. This is **external public-source research**, not Wheelwright architecture authority, assurance of exact API-project settings or a safety clearance. Companion HTML was provided in chat; Markdown is the durable record of research.

Key attributed findings:
- OpenAI API content is not used for shared-model training by default unless customer opts in; default abuse-monitoring logs may retain prompts/responses up to 30 days subject to exceptions. Default is NOT Zero Data Retention.
- ZDR and Modified Abuse Monitoring (MAM) require approval/configuration for the actual organization AND project. Endpoint and feature eligibility matter; explicit `store:false` for stateless Responses calls is prudent. Tool calls, logs, history replay, prompt caches, stateful services, flagged-content/legal exceptions and subprocessors create additional surfaces.
- OpenAI direct, Microsoft Azure OpenAI, AWS Bedrock, Anthropic commercial API, Vertex AI and Gemini API differ materially; the research's conclusion was **conditionally suitable under narrow controls**, not generally safe.
- Independent provider assurances are contractual/documentary with some gated independent attestation; the report could **not** verify this Principal's actual provider console settings, executed agreements, or running `wwt` host.
- Muse recommended verified ZDR (or at minimum MAM), data minimization, DPA and endpoint controls for sensitive personal financial data. That is a research recommendation, not yet Principal-ratified Wheelwright Product policy or proof all Account metadata on standard API is categorically forbidden.

## H-004 consensus and freeze

Question selected: **“What accounts do I have?”** Truthful meaning: which Account metadata the authenticated User is authorized to inspect, not legal ownership, brokerage completeness, Holdings, operating regime or balances. Source: maintained Accounts/Operating Regimes owner and Doc 77; existing API v2 `GET /v2/accounts` filters by grants.

Independent Codex and Kiro 4AM Account-question reports agreed on meaning but differed on fixture realization (accepted release JAR vs isolated Spring) and fixed-sentence vs bounded natural language. The Principal challenged the synthetic-environment premise, then prioritized actual API disclosure and model safety. Do not treat earlier proposed synthetic first-slice approvals as current direction.

Earlier H-004 same-tree concurrent mutations collided. Codex preserved a local recovery archive and manifest; a pre-suspension Gradle build rewrote files in the running v1 backend's shared classpath. No failure was observed, but functional equivalence was not proven. The mixed H-004 tree is frozen, unverified, uncommitted and not accepted; installed `wwt` points at that mixed launcher. **Do not run the installed `wwt`, build in the frozen tree, or restart services as a side effect of H-004 investigations.** Use separately authorized isolated worktrees and distinct outputs. H-001/H-002/H-003 prior accepted releases are not overturned by this incident.

## Active read-only 4AM inference-security assignment

A single identical independent Codex/Kiro investigation prompt was given, expressly read-only and without model calls, builds or real-data egress. It asks each actor to inspect accepted H-003's actual model, endpoint, `store` setting, transcript/tool handling, credentials and logs; API authorization/projection; context separation; provider-account unknowns; financial-answer integrity; and compare (a) minimum authorized projection to external model and (b) trusted host rendering Account results without model egress. Findings are to be reconciled **before** implementation or model-safety GO. Their findings are not yet received in this snapshot.

## Current gates / exact nonclaims

- BUG-049: **filed; author-verified candidate only**. Independent Kiro review, integration, deployment, acceptance and wider audit outstanding.
- Muse: **research received and archived**. No signed-in project retention verification, executed provider agreement check, or application safety determination.
- API PII/sensitive disclosure audit: **not yet complete**; no claims of other bugs.
- `wwt` inference-host/security review: **actors prompted, results pending**.
- H-004 real Account question: **not implemented or observed as accepted**; no approval for live financial tool results into external inference.
- PL-MCP-01: **INTAKE**, no general architecture Reconciliation Completion Record.

**CURRENT STATE:** Durable stopping-point snapshot and original Muse report committed. Candidate fix pending independent review and deployment; model safety and broader API disclosure gates pending.

**DECISION REQUIRED:** NO for this documentary capture.

**NEXT AUTHORIZED ACTION:** Receive independent BUG-049 acceptance and Codex/Kiro read-only inference-boundary findings; reconcile against the full Muse report; then decide the smallest verified safe real Account path.
