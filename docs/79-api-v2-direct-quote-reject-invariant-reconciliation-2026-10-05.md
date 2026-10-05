# API v2 Direct-Quote Candidate Rejection — Implementation-Invariant Reconciliation

**Date:** October 5, 2026  
**Status:** Reconciliation/checkpoint artifact; implementation candidate `28df973` rejected; no retry or mutation authority  
**Authority:** Category D — Reconciliation / Checkpoint Artifact  
**Scope:** Death-Spiral-Avoidance model synthesis after independent rejection of the first `POST /v2/quotes` implementation candidate  
**Governing authority:** Principal-ratified direct-quote contract at `3a390ef0b22e9d7e1d57895f0abd1bc216e7dbc8`; `docs/76-ww-fetch-api-v2-investigation-snapshot-2026-10-05.md` §§21–23; `docs/77-api-v2-architectural-guardrails.md`; `docs/78-api-v2-design-implementation-handoff-checkpoint-2026-10-05.md`; `PL-API-03`; `foundations/death-spiral-avoidance-protocol.md`

---

## 1. Trigger and workflow disposition

Kiro produced local implementation candidate `28df973` for the Principal-ratified first API v2 direct-quote slice. Independent Codex review rejected the candidate with four contract-level counterexamples despite the candidate reporting 37 v2 tests passing and 690 backend tests passing.

The rejection does **not** invalidate the ratified Product/API contract and does **not** authorize a patch or another implementation attempt.

The Death Spiral Avoidance Protocol therefore applies before any repeated Kiro → Codex traversal:

> **No repeated consequential traversal without new decision-relevant state.**

The required next step is implementation-model / invariant synthesis and falsification, not a longer remediation prompt.

## 2. New decision-relevant evidence supplied by the rejection

The rejected candidate exposed four concrete failures not exercised by its reported test suite:

1. closed-session reuse could accept a regular-session observation without proving it belongs to the **latest completed** regular session; active reuse also failed to bind reuse to the applicable session/feed boundary and used whole-second age truncation;
2. `receivedAt` and acquisition phase were fixed before provider admission/HTTP, so admission delay or a session transition could make persisted provenance false;
3. provider type fallback could classify an option quote as `OTHER_UNDERLYING`, allowing syntactically accepted but semantically unsupported subjects to become `NEWLY_ACQUIRED`;
4. HTTP request correlation stopped at the controller instead of propagating through provider admission/observer/fencing/commit.

These are new counterexamples and therefore new Evidence under the Death Spiral Avoidance Protocol. They justify model synthesis; they do not by themselves justify implementation retry.

## 3. Reconciled implementation invariants

### I1 — Reuse eligibility is evidence-identity-bound

A held direct quote is reusable only when its persisted provenance positively establishes that it belongs to the reuse boundary applicable **now**.

For active-session ordinary reuse, eligibility requires both:

- successful upstream-contact age within the configured threshold using non-truncated instant/duration comparison; and
- agreement with the applicable session/feed identity boundary.

For completed-session ordinary reuse, eligibility requires positive proof that the held observation's persisted `regularSessionDate` equals the **latest completed regular trading session** under the applicable feed/session calendar semantics. The observation's session membership is established from the upstream-contact context and persisted as provenance; it is not inferred later from `receivedAt`, current wall-clock age, or Decision publication state. Merely being labeled regular-session evidence, or merely being old enough to predate closure, is insufficient.

If the applicable regular-session identity cannot be established unambiguously, `regularSessionDate` is absent as the ratified OAS requires. Such an observation fails closed for completed-session reuse because the required session identity cannot be proven. Absence does not authorize guessing a date from receipt time.

Provider availability does not redefine this eligibility.

A direct quote first acquired outside the latest completed regular session does not become latest-completed-session evidence merely because the market is currently closed.

This invariant refines implementation truth only; it does not change the ratified reuse Product semantics.

### I2 — Contact, receipt, and commit are distinct temporal boundaries

Temporal provenance must be derived from the actual event it names and the ratified OAS meanings must not be collapsed:

- **upstream contact** owns `acquisitionPhase` and the applicable `regularSessionDate` when that date is unambiguously known;
- `receivedAt` is the later instant Wheelwright receives the successful upstream subject payload;
- `committedAt` is the instant the accepted observation becomes authoritative held evidence;
- request `startedAt`/`completedAt` remain operation clocks and are not substitutes for contact, receipt, or commit;
- source event timestamps remain provider-reported field-specific clocks and are never synthesized from contact/receipt/commit/request clocks.

Provider admission occurs before upstream contact. Therefore phase/session classification must not be fixed at request enqueue or before admission. But receipt also must not overwrite contact classification.

A boundary-crossing specimen is intentionally representable without contradiction: if upstream contact occurs immediately before regular close and the successful subject payload is received immediately after close, `acquisitionPhase` remains the classification at the pre-close contact and `receivedAt` records the post-close receipt instant. The values describe different facts and need not imply the same phase.

For completed-session reuse, session membership follows the persisted `regularSessionDate` established from the upstream-contact context. `receivedAt` is not a second session-membership rule. If contact-context session identity was not unambiguously knowable and therefore `regularSessionDate` is absent, session-specific reuse fails closed rather than inferring membership from receipt time.

### I3 — Subject verification is positive and fail-closed

A requested direct-quote subject succeeds only when the upstream result positively verifies:

- the returned canonical subject identity corresponds to the requested canonical subject; and
- the returned provider security type maps to an allowed underlying security type under the ratified direct-quote capability.

Unknown, absent, unrecognized, option, or otherwise unsupported provider types must not be promoted by fallback into a supported underlying classification.

Syntactic request validation is not semantic provider verification.

Batch reconciliation remains by canonical subject identity, never response position.

This invariant does not create a new Product security-type taxonomy. It requires the implementation to enforce the already-ratified underlying-only capability conservatively: unsupported or unverifiable type is failure, not guessed success.

### I4 — Request correlation is end-to-end operation context

The request correlation UUID established at the HTTP boundary must remain reconstructably associated with all work caused by that request:

HTTP request → capability operation → provider admission/HTTP → normalization/acceptance → authority-fenced persistence → terminal result/logging.

An acquisition may also have its own subordinate `acquisitionId`, authority lease operation id, provider measurement sequence, or batch identity. Those identities do not replace request correlation.

The existing provider observer/pacer logical-operation context is the required integration seam unless implementation evidence demonstrates it cannot carry the ratified correlation semantics. A v2 path must not silently bypass that seam and allow provider work to appear with null logical identity / epoch-zero default context.

Correlation does not alter authority fencing: the captured authority epoch still travels with the authorizing acquisition context and stale authority remains fenced.

## 4. Existing backend mechanisms that support the model

The rejection does not presently require a new architecture:

- Existing `SessionClassifier` / `SessionGate` code contains useful **calendar mechanics and terminology** for trading dates, weekends, holidays, early closes, provider delay, and canonical-session reasoning. Direct-quote reuse must not import the classifier's whole admissibility verdict or its `persistedSessionValid` dependency, because that predicate is coupled to complete published Decision-session state and named v2 quotes may exist without Decision enrollment.
- The current calendar implementation is explicitly bounded to hard-coded 2026 holiday/early-close tables. That is not a sufficient long-lived direct-quote session-identity authority. A later implementation must use a calendar/session-identity mechanism capable of establishing the applicable regular-session date for the observation; if it cannot establish that identity unambiguously, the direct-quote model must preserve OAS truth by omitting `regularSessionDate` and failing closed for session-specific reuse rather than guessing.
- `RequestPacer` already carries `PurposeScope` / `OperationContext` with logical operation id, purpose, subject, opaque provenance, and captured authority epoch. It captures caller context before crossing onto the dispatch thread.
- `RequestPacer` resolves admission before beginning the provider observer operation, establishing an existing post-admission **contact-start** boundary. That boundary is useful for `acquisitionPhase`/session classification; successful payload receipt remains a distinct later boundary for `receivedAt`.
- `ProviderAuthorityManager.commitIfCurrent` already fences durable writes against the captured lease epoch and records store mutation against the lease logical operation.
- Existing session/admissibility code demonstrates the architectural distinction between session identity and wall-clock age, but Decision publication validity is not a direct-quote reuse prerequisite.

Therefore the first candidate's defects are presently classified as an inadequate implementation model / integration of established mechanisms, not evidence that the ratified v2 Product/API contract is unimplementable. The exact reusable calendar/session-identity implementation seam remains an engineering question constrained by the fail-closed semantics above; it must not reintroduce Decision enrollment as a prerequisite.

## 5. Falsification matrix required before another candidate can be accepted

Any later authorized implementation candidate must survive counterexamples at the invariant level, not merely repeat the prior happy-path specimens.

### Reuse identity falsifiers

- During overnight closure, a direct quote from two regular sessions ago must not reuse even if marked regular/usable.
- During weekend closure, only evidence belonging to Friday (or the actual latest completed trading session around a holiday) may qualify for completed-session reuse.
- A quote acquired after Friday close must not become Friday completed-session evidence merely because it is the newest held quote.
- At the next regular-session/feed boundary, prior-boundary evidence must not qualify for active reuse merely because its contact age is below 60 seconds.
- Exactly-at-threshold and immediately-beyond-threshold cases must use precise duration semantics without whole-second truncation.
- Provider availability/unavailability must not change the answer to the reuse-eligibility predicate.

### Temporal-truth falsifiers

- Queue/admission waits across market open must classify `acquisitionPhase`/`regularSessionDate` at upstream contact after admission, while `receivedAt` records the later successful payload receipt.
- Contact-before-close / receipt-after-close must preserve pre-close contact classification and post-close `receivedAt`; completed-session reuse must use the persisted contact-context `regularSessionDate`, not infer a different session from receipt.
- Contact-before-open / receipt-after-open must likewise preserve the distinct contact and receipt facts rather than laundering one boundary into the other.
- A reused observation must preserve its original clocks and phase/session/feed provenance.
- A failed reacquisition must not rewrite prior clocks.
- Source event times must remain independent of receipt and commit times.

### Subject-verification falsifiers

- Requested syntactically valid option symbol + provider type `option` + positive price must never become `NEWLY_ACQUIRED` as an underlying.
- Unknown/unrecognized/missing provider type must fail closed rather than map to `OTHER_UNDERLYING`.
- Returned symbol mismatch must fail that subject even under HTTP 200.
- Mixed batch of verified underlying, option, unknown type, and unmatched symbol must reconcile independently by identity.
- Tests must exercise the real provider-normalization/type-mapping path, not only a fake source that pre-classifies unsupported subjects.

### Correlation falsifiers

- A supplied valid `X-Request-Id` must be reconstructable on provider observer events caused by that request.
- A generated request UUID must have the same property.
- Provider admission events must not fall back to null logical id / epoch zero for v2 acquisition.
- Store mutation/fenced events and provider transport events must be reconstructably attributable to the same request while preserving their subordinate acquisition/lease identities.
- A multi-subject provider batch must preserve one request correlation while retaining per-subject terminal truth.
- An unauthorized/rejected request must produce no provider-correlated operation.

## 6. What this reconciliation does not change

This checkpoint does **not**:

- reopen or amend the ratified `POST /v2/quotes` HTTP/OAS contract;
- change ordinary reuse, FORCE, batching, partial-success, security, or completion Product semantics;
- select new public fields or endpoints;
- authorize modifications to the frozen OAS;
- authorize implementation remediation;
- authorize another Kiro traversal;
- authorize push of rejected candidate `28df973`;
- change v1, Decision, `ww fetch`, `ww ls`, or provider policy.

## 7. Death-spiral completion test for re-entry

Before another implementation traversal is rational, the workflow must be able to answer:

1. **What decision-relevant state changed?**  
   The implementation model now contains explicit invariants for reuse identity, temporal provenance, positive subject verification, and end-to-end correlation, derived from four concrete independent-review counterexamples and reconciled with existing backend mechanisms.

2. **Why can the next traversal produce an outcome the previous one could not?**  
   A later implementation actor can be tested against falsifiers that directly attack the previously missing invariants rather than merely reproducing the first candidate's implementation-shaped tests.

This revision incorporates the first independent falsification of the model. The Death Spiral Avoidance Protocol still requires independent re-falsification of the revised contact/receipt/session-identity model before implementation re-entry.

---

CURRENT STATE: Candidate `28df973` is rejected and unpushed. The ratified v2 direct-quote contract remains unchanged. Four missing implementation invariants have been synthesized. After independent falsification, I1/I2 were revised to preserve distinct contact/receipt/commit semantics and to prevent direct-quote reuse from inheriting Decision publication validity.

DECISION REQUIRED: NO

NEXT AUTHORIZED ACTION: Independently re-falsify the revised implementation-invariant model, specifically the contact-before-close/receipt-after-close specimen, fail-closed absent session identity, and independence from Decision publication validity. Do not implement, patch, push, or issue a Kiro remediation prompt unless that falsification succeeds and implementation authority is separately established.
