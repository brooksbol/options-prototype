# H-004 — Principal decision: nickname-first Accounts and model-visible metadata

**Date:** October 23, 2026. **Standing:** Principal decision record and implementation handoff; not evidence of implementation, provider clearance, deployment or acceptance.

## Principal decisions

The Principal directed: **“let's go with a nickname only approach. and any account numbers should be redacted to the last few digits.”** The Principal selected **Option A — Model receives Account metadata**: the trusted host sends *authorized Account nicknames, brokers and counts* to the external model, which composes the conversational answer. Later: **“make it so.”**

Interpretation, preserving the distinct boundaries:
- Ordinary operator discovery/selection is **nickname-first**. Do not require GUIDs or broker numbers.
- Ordinary API v2 Account discovery continues BUG-049's accepted correction direction: **omit** brokerage account numbers from collection/detail payloads. Where an *explicitly authorized other presentation* has genuine use for an Account number, redact to only the final few digits (maximum four); never expose full numbers merely through Account metadata grants.
- Model-visible H-004 Account data is narrowly allowlisted: authorized **nickname, broker label, count** only. No brokerage number, masked suffix, canonical Account/User ID, grants, token, full unfiltered payload or unnecessary display name. Handle nickname sensitivity as a separate validated concern.
- Model participates in interpretation and answer composition; do **not** replace this selected architecture with local-only dispatch or hardcoded answer text.
- API v2 remains authoritative for User/grants, Account identity and returned inventory. The answer must not claim legal ownership, complete brokerage coverage, balances, Holdings, financial advice, or Account-derived Operating Regime.
- Real authorized financial metadata **must not** go to external inference before actual provider project retention/security and application egress/history/answer checks have passed and the Principal accepts any residual risk. Accepted H-003 explicitly uses `store:false` but does not alone establish provider ZDR/MAM or financial answer integrity.

## BUG-049 integration state

Codex created an isolated, author-verified 11-file candidate, archive SHA-256 `24e0f785ef9725b47db2e874488faf7c40dcf6f7c9b9fddf686f17180a412e21` at `/tmp/wheelwright-bug049-candidate-20261022.tar.gz` (Principal's local machine). Kiro independently **ACCEPTED** that frozen candidate against base `241cbabbefef996febe9f83f7f1f872cd609d19e`. Java 1,018 tests 0 failures 2 skips; 380 CLI tests with NO_COLOR; 50-request isolated real-boot-JAR probe passes; base-control probe catches defect. Not yet integrated, deployed or Principal-accepted. Kiro found later remote main documentation advancement makes derived `roadmap-projection.json` stale. Principal accepted review Option A: Codex in isolated checkout updates from current remote, regenerates **only** derived projection and freezes new candidate; Kiro narrowly verifies new identity/projection and relevant BUG-049 tests/probe before integration. Deploy matching backend and CLI together; installed old `ww` rejects changed payload. Candidate's CLI displays literal `****` in BROKER ACCOUNT column; nickname-first calls for meaningful presentation, with removal of meaningless column a proposed bounded UI refinement requiring regression review, not a reason to leak account numbers.

Kiro also observed `GET /v2/artifacts?accountId=` returning `brokerAccount` full number under a distinct grant. This is an **audit finding outside BUG-049**, requiring separate evidence-backed bug/disclosure contract and fix, without conflating required internal brokerage integrations.

## H-004 and safety

Frozen mixed H-004 worktree remains unverified, uncommitted and unsafe to launch: installed `wwt` points to mixed launcher; build touched running v1 classpath. Never build/launch it as a shortcut. Independent Codex and Kiro read-only security reports find accepted H-003 not yet suitable for real Account metadata: history/tool outputs are resent; model answers lack grounding checks; actual OpenAI project retention policy is unknown. Muse's full external provider report is preserved at `docs/research/hosted-llm-api-financial-data-privacy-20261022.md`; it is external evidence, not proof of project's current status or blanket mandate.

## Authorized next execution sequence

1. One Codex implementer in an isolated worktree re-freezes BUG-049 on latest main with *only* necessary derived projection update (and explicitly bounded nickname-only CLI presentation if not already covered by the accepted target); avoid modifying frozen H-004 or live build outputs.
2. Independent Kiro narrow verification of changed candidate before integration.
3. Integrate/deploy BUG-049 backend and matching CLI under normal production controls; Principal observes nickname-first behavior. Keep bug Open until acceptance.
4. Audit API v2 PII and sensitive data disclosures, including artifacts `brokerAccount`; file and fix verified defects separately.
5. Verify actual OpenAI org/project settings, host field projection, history, non-egress secrets, prompt-injection and grounded-answer controls; obtain Principal disclosure-risk agreement. No live Account model calls before safety gate.
6. A **separate** Codex-only H-004 implementation handoff after readiness; independently review, then Principal observes real authorized Account answer in `wwt`.

**CURRENT STATE:** Principal's nickname-first + Option A directions captured; BUG-049 accepted frozen candidate pending re-freeze/integration; no live model safety GO.

**DECISION REQUIRED:** NO to perform bounded BUG-049 re-freeze and verification; later real inference requires safety evidence and Principal risk acceptance.
