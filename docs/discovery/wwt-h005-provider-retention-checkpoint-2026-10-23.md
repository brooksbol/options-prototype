# Wheelwright Talk — H-005 / provider-retention checkpoint

**Date:** October 23, 2026. **Standing:** Principal decision / operator-state checkpoint, not a claim of independently accepted H-005 or deployed new functionality.

## Current Product direction

- Accelerate useful, real-data operator questions through question-first thin slices; no automatic broad 4AM/privacy archaeology for each question.
- H-004 “What accounts do I have?” is implemented, independently accepted, Principal observed/accepted, installed and integrated. Authorized nickname, broker and count were sent to the external model using explicit `store:false`; normal `wwt` produced a correct answer.
- H-005 selected: **“What's in Sawdust?”**, exercising authorized real Holdings and conversational Account referents. Principal explicitly accepted standard OpenAI API retention as an engineering tradeoff and directed question-specific privacy evaluation rather than ZDR/MAM approval as a release gate.
- Sensitive-data controls remain substantive: API v2 backend grants and financial authority; exclude credentials, raw brokerage Account numbers, unrelated direct PII and other Users' information; model claims grounded in backend evidence. Do not treat absence of account numbers in one endpoint as a universal PII audit clearance.
- Q63 exact Principal utterance **“Good morning!  Whatta we got today?”** added to [question inventory](operator-question-inventory-2026-10-22.md); advanced future situational-awareness question, not replacement for H-005.

## H-005 reported implementation and permission state

Codex reported operational checkout recovered clean to remote main `4e2a5dfa72085fc010524241e59b3949fdfe3f9d`; existing installed `wwt` and services unchanged. Seven-file H-005 candidate frozen at `/tmp/wheelwright-h005-holdings-20261023-r1.tar.gz` SHA-256 `78acb2e683253a7b11723be1435218991d65efd56ab2f7ff6aa023e4901a560d`; 48/48 author tests reported passing. Review handoff `/tmp/wheelwright-h005-evidence-20261023/REVIEW.md`. These are **actor-reported local artifact paths**, not GitHub or sandbox references. Independent acceptance, installation, integration and Principal live Holdings observation remain unconfirmed.

The real-data author check found existing authenticated User lacked Sawdust Holdings-read and instrument-reference-read. The Principal authorized narrow grant provisioning, without changing other grants or granting trading/write authority. Actual provisioning result is **not yet reported**, so do not conflate authorization to change grants with completed state. No real Holdings were sent to OpenAI in that failed check.

## ZDR/MAM Sales inquiry — actual outcome

October 23 Gmail thread, subject **“ZDR and MAM for your Responses API application”**, from Alessandra at OpenAI, with Principal's sent reply:

- Initial Sales reply: ZDR and MAM require prior approval and additional terms; no default entitlement or automatic approval.
- Principal explained Wheelwright is currently a modest-budget personal portfolio-analysis prototype with potential but not committed commercial future.
- Follow-up Sales reply at **2026-10-23 18:01:26 UTC**: **“For your current personal prototype, we can’t sponsor a Sales-led ZDR review.”** This does **not** determine eligibility for other data controls. MAM approval path and project-specific contract terms were **not confirmed**. Sales invited recontact if commercial deployment or expected usage materially changes; no additional current usage estimate requested.
- Correspondence: https://mail.google.com/mail/u/0/#all/1a169ecc98eb0eb6 ; sent reply belongs to the same subject thread.
- **No ZDR or MAM approval has been established.** Do not label this a universal ZDR rejection or treat Sales's message as confirmation of model/project configuration.

**Principal standing direction:** ZDR/MAM are nice-to-have, not H-005 blockers; use standard API with explicit `store:false`, case-by-case privacy decisions and working real financial data. Note that `store:false` does not remove standard abuse-monitoring retention. This is a deliberate bounded operating tradeoff, not a finding that all financial data are nonsensitive.

## Other known work

- BUG-049 full brokerage number disclosure in ordinary API v2 Account discovery was independently verified, deployed with matching `ww`, and Principal supplied operator results showing nickname-first table and number-free JSONL. An explicit formal defect-closure command is not confirmed in this checkpoint.
- Independent review of H-004 r2 terminal Tool/MCP visibility reported ACCEPT; r2 was not installed or integrated in last confirmed state. Kiro's final isolation check was incomplete when shell failed; do not infer later completion.
- Separate `/v2/artifacts` `brokerAccount` full-number disclosure was observed in earlier review. It remains a separately scoped finding, not evidence that H-005's chosen data path necessarily touches it.
- PL-MCP-01 remains **INTAKE** unless separately closed through its broader Reconciliation Completion Record.

## Next actions, without redundant investigation

1. Receive Codex confirmation of narrow Sawdust/instrument grant provisioning and Kiro independent H-005 candidate verdict.
2. If accepted, deploy/install through isolated release controls and let Principal ask **“What's in Sawdust?”** in ordinary `wwt`. Do not presume acceptance or replay real data prematurely.
3. Preserve provenance and discuss new privacy issues proportionately per question; keep provider retention policy decision from becoming a recurring approval loop.
4. Handle the separate artifacts number disclosure as its own bounded defect when in scope.
5. Add more questions quickly after each observed working answer.

**CURRENT STATE:** H-004 working; H-005 candidate author-tested awaiting verification and actual grant confirmation; Sales-led ZDR review unavailable at current scale and MAM eligibility unconfirmed. Standard-retention real-data development authorized with controls.

**DECISION REQUIRED:** NO for documentary capture.

**NEXT AUTHORIZED ACTION:** Reconcile Kiro H-005 review and Codex grant result; progress to a verified real-data H-005 operator answer.
