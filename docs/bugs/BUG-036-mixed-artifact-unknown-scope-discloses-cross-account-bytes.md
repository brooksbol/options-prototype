# BUG-036 — Unknown mixed-artifact source scope permits cross-Account original-byte disclosure

- **Status:** Open
- **Severity:** S2
- **Area:** Backend / v2 brokerage artifact original-content authorization
- **Provenance:** Codex independent adversarial User-isolation review, October 11, 2026, under PL-CONV-01; synthetic in-memory MockMvc counterexample

## Observed failure

A retained original brokerage CSV containing rows for Account A and Account B can be retrieved in full by a User holding only Account A's artifact-read capability when source-scope detection fails to recognize an unexpected but plausible header. Semantic import is rejected, yet original-byte retrieval returns HTTP 200 and includes Account B's private data.

This is a demonstrated synthetic authorization-bypass specimen, **not** a verified production disclosure incident.

## Intended semantics violated

Backend Account authorization must not disclose private evidence from an Account for which the authenticated User lacks the necessary capability. An original artifact containing multiple Accounts requires established and authorized scope for every represented Account. Failure to establish the source scope must fail closed, not be interpreted as owner-only permission. Rejection of semantic processing does not make retained original bytes safe to disclose.

Doc 77 already establishes backend User–Account authorization, and source-account restrictions for original multi-account artifact access. The broader User-isolation/admin Model A invariant was subsequently ratified in Doc 77 on October 11; the original defect finding did not depend on that later ratification.

## Evidence

Codex executed a synthetic test with existing application classes and MockMvc against an in-memory database:

1. Writer uploaded a mixed-account CSV to Account A, containing synthetic private data for Accounts A and B.
2. Header began with a leading space: ` Account number,Account name`.
3. Source detection did not recognize the exact expected prefix; processing returned `REJECTED`, preserving the original bytes.
4. A distinct reader with only Account A's artifact-read permission requested original content.
5. Original content was returned **HTTP 200**, including synthetic Account B data, despite no Account B grant.

Relevant reviewed implementation:
- `evidence-service-java/src/main/java/com/wheelwright/evidence/v2/BrokerageArtifacts.java` near line 53: exact-prefix source-envelope detection; unrecognized header falls back to owner-only source scope.
- `evidence-service-java/src/main/java/com/wheelwright/evidence/v2/ArtifactsController.java` near line 75: original-content authorization trusts that scope.
- `docs/contracts/api-v2-account-evidence.json`: original mixed-account retrieval requires authorization for all represented source Accounts.
- `docs/77-api-v2-architectural-guardrails.md`: original artifact access and Account authorization requirements.

Evidence is Codex's reported executed synthetic probe; no test file, committed fixture, or production log was produced by this read-only review.

## Consequence

Cross-Account disclosure of retained private brokerage source data despite backend Account-grant isolation. Classified **S2 (major)** as a security confidentiality violation with a concrete synthetic bypass. Severity is not a remediation priority or claim of production exploitation.

## Diagnosis / root cause

Unknown/unrecognized source-envelope detection returns an owner-only scope, conflating **scope not established** with **known single-owner source**. Original-byte retrieval relies on that assertion. Semantic processing rejection does not prevent content access.

## Scope / non-goals

This defect is the fail-open source-scope/original-content authorization boundary, not the separate `ww ls accounts` masking defect (BUG-035), general identity-provider selection, broad administrator roles, or a generalized CSV parsing redesign. Preserve retained originals and admission failure semantics; determine authorized source scope independently of whether semantic processing succeeded.

Filing does **not** authorize remediation, code changes, new tests, schema changes, or commits beyond this defect record.

## Acceptance criteria

- If the complete source-account scope of an original artifact cannot be established, original-byte retrieval does not disclose it to a caller whose authority cannot be proven sufficient.
- Every represented source Account requires appropriate authorization for full original-byte retrieval; owner-only access cannot substitute for missing cross-Account authority.
- Reproduce the leading-space mixed-account header specimen and verify the unauthorized reader cannot retrieve Account B's original bytes.
- Preserve authorized retrieval for established single-Account sources and established fully authorized mixed-Account sources.
- Preserve source retention and prior admitted evidence on rejected processing; do not conflate processing success with disclosure authority.

## Remediation history

### Principal acceptance and independent rejection — October 11, 2026

The Principal authorized Codex to implement the accepted design as a deliberate exception to the usual Architect/Implementation Engineer separation, then reported **acceptance PASSED** and invoked end-of-session closeout. Independent verification subsequently rejected the candidate as recorded below; author tests are not independent review.

`BrokerageArtifacts.SourceScope` now distinguishes established Account scope from unknown/incomplete scope. Strict UTF-8 decoding and the existing CSV tokenizer inspect supported Fidelity source envelopes independently of financial/date parsing. Original-content retrieval denies unestablished scope with the existing 403 response and requires exact artifact-read grants for every established source Account. The shared non-Positions admission check also rejects unestablished scope after retention. No schema migration or source rewriting is required; retained bytes are inspected on retrieval.

A header-trimming-only patch was rejected because it would leave the unknown-to-owner fallback intact. Blocking every rejected import was rejected because semantic processing failure does not imply incomplete source attribution. Filename/type alone cannot rescue an unknown envelope.

The subsequently rejected code candidate is anchored to base `dada93a4d71ed9d867b042e2199991fa82d23fe6`, archive SHA-256 `4af26d8653ab3cc7672ee37970384757ec54c08bd71d6edb525337e02dfc7f68`. Subsequent accepted-main synchronization changed convergence documentation only; candidate source/test hashes remained identical. Closeout persistence does not deploy or restart the running backend.

## Verification

### October 11, 2026 — Author regression and retained-format verification

22 focused backend tests pass across original-source authorization, brokerage artifacts, Accounts, Users and Positions; nine existing CLI Account/Position/sync regressions pass. Tests cover the exact leading-space counterexample, unknown/partial scope, unregistered source Accounts, malformed quoting/UTF-8, known single/mixed scope, administrator non-bypass, retry/duplicate filename attempts, and exact-byte authorized retrieval despite rejected semantic processing. The former arbitrary-malformed-content retrieval fixture now uses a rejected financial value with established source scope.

Read-only inspection of all 315 retained Fidelity originals establishes 311 fully mapped source scopes: 100 Activity, 93 Balances, 94 Option Summary and 24 Positions. Four additional Positions originals contain unregistered source Accounts and remain denied, matching the previous source-account checks. All 315 stored payload hashes match. No retained evidence, Account binding, User grant, configuration or live service was changed. No production exploitation is asserted.

### October 11, 2026 — Independent verification REJECT

A separate read-only verification agent verified the frozen archive hash and all four candidate source/test hashes. Its isolated run of the same 22 focused backend tests passed. An additional in-memory MockMvc adversarial probe then demonstrated that a padded second Option Summary Account section is treated as an ordinary table row, omitting that Account from established scope:

```csv
Fidelity Investments - Option Summary A1
Symbol,Strategy,Expiration & Strike,Quantity
SPY,Other,Shares,1
Fidelity Investments - Option Summary B2,,,
QQQ,PRIVATE-B,Shares,25
```

Both Accounts were registered. A writer uploaded to Account A; a distinct reader had only Account A's artifact-read grant. Executed result: `established=true containsB=false processing=ACCEPTED http=200 privateDisclosed=true`. The independent expected-403 assertion failed with actual HTTP 200. The original 22 tests remain passing; they do not cover this padded section. The classifier recognizes summary Account markers only in single-field rows; the padded B2 marker passes the ordinary-row width check. No production incident is asserted.

The reviewer returned **REJECT** for frozen candidate SHA-256 `4af26d8653ab3cc7672ee37970384757ec54c08bd71d6edb525337e02dfc7f68`, stopped upon the counterexample and made no workspace or production changes. It did not independently repeat the retained-population or CLI checks. This was a separate Codex verification agent, not Kiro verification.

**Disposition:** The Principal's earlier reported acceptance is preserved as evidence, but the subsequent independent rejection means the correction does not satisfy acceptance criteria. BUG-036 remains **Open**. No rejected source is committed/deployed; the frozen archive and uncommitted candidate remain preserved locally. End-of-session persistence is documentation/projection only. No further fix, retry, or Step 3 advancement is authorized by this closeout.

## Related

- `PL-CONV-01` — tt/ww convergence and User authorization reconciliation.
- `BUG-035` — separate human-facing account-number masking defect.
- `docs/77-api-v2-architectural-guardrails.md` — governing authorization and source-retention boundaries.
