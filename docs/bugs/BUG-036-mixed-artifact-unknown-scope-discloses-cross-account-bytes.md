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

Doc 77 already establishes backend User–Account authorization, and source-account restrictions for original multi-account artifact access. The Principal's proposed broader User-isolation/admin exception remains **unratified**; this bug does not depend on ratifying it.

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

None; Open.

## Verification

Codex synthetic in-memory MockMvc counterexample as reported. No fix or post-fix verification.

## Related

- `PL-CONV-01` — tt/ww convergence and User authorization reconciliation.
- `BUG-035` — separate human-facing account-number masking defect.
- `docs/77-api-v2-architectural-guardrails.md` — governing authorization and source-retention boundaries.
