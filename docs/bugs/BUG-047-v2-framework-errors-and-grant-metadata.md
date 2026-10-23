# BUG-047 — V2 routing errors and declarative grant metadata are incomplete

- **Status:** Open — isolated correction candidate; independent Kiro verification pending.
- **Severity:** S3
- **Area:** Foundational Holdings API v2
- **Provenance:** Principal-supplied Kiro Product-conformance finding F6, October22,2026. Original independent probe artifacts unavailable; author constructed new probes against frozen base8bd75f5. No original-probe reproduction claim.

## Observed failure
A real loopback Spring server returned application/json default errors for unknown v2 route404 and wrong-method405. Market Account-scope and quote acquisition/force grants existed in prose/runtime but not complete declarative metadata.

## Intended semantics violated
V2 errors use the canonical problem envelope, correlation and non-disclosure; authoritative OAS advertises actual grants while public projection suppresses instructions. Doc77 §§4,12,13,19 and the operative contract govern the relevant boundary. Principal explicitly authorized bounded correction; no domain redesign.

## Evidence
[F6 reproduction, source/contract citations and author verification](../implementation/api-v2-foundational-2026-10-21/product-conformance-2026-10-22/verification.md). New probes are identified separately from reported samples and Kiro evidence.

## Consequence
Clients receive inconsistent error contracts or incomplete machine-readable security requirements. Severity describes that consequence; no live financial loss or disclosure incident demonstrated.

## Diagnosis / root cause
Controller-local errors did not cover framework dispatch failures; metadata additions were omitted.

## Scope / non-goals
Bounded F6 correction only. No v1/CLI migration, live acquisition, lifecycle policy, trade submission, or publication. Filing is not an execution grant.

## Acceptance criteria
V2 errors use the canonical problem envelope, correlation and non-disclosure; authoritative OAS advertises actual grants while public projection suppresses instructions. Existing36operations, financial/evidence/security semantics and retained source history remain intact. Independent Kiro verification required before integration/publication.

## Remediation history
Candidate prepared in codex/api-v2-product-conformance-correction-2026-10-22. See linked immutable candidate review package; not deployed or independently accepted.

## Verification
Author deterministic tests and static documentation specimens are recorded in the linked report. Bug remains Open pending independent verification and controlled acceptance; passing author tests are not Product acceptance.

## Related
[Correction task state](../implementation/api-v2-foundational-2026-10-21/product-conformance-2026-10-22/STATE.md); F3 lifecycle questions are reserved and are not this defect.
