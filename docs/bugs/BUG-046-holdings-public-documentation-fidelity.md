# BUG-046 — Holdings public reference loses operation semantics and source qualifications

- **Status:** Open — isolated correction candidate; independent Kiro verification pending.
- **Severity:** S3
- **Area:** Foundational Holdings API v2
- **Provenance:** Principal-supplied Kiro Product-conformance finding F4/F5, October22,2026. Original independent probe artifacts unavailable; author constructed new probes against frozen base8bd75f5. No original-probe reproduction claim.

## Observed failure
The published native projection had 17 identical generic descriptions and a singular OPEN example alongside a named UNRESOLVED example. Source-backed multi-leg, conflict and history examples were absent.

## Intended semantics violated
Public operation explanations and examples must faithfully express accepted evidence-qualified financial results. Doc77 §§4,12,13,19 and the operative contract govern the relevant boundary. Principal explicitly authorized bounded correction; no domain redesign.

## Evidence
[F4/F5 reproduction, source/contract citations and author verification](../implementation/api-v2-foundational-2026-10-21/product-conformance-2026-10-22/verification.md). New probes are identified separately from reported samples and Kiro evidence.

## Consequence
Clients can misunderstand financial evidence and resource capabilities. Severity describes that consequence; no live financial loss or disclosure incident demonstrated.

## Diagnosis / root cause
Promotion placed domain explanations inside private-only blocks and retained an obsolete singular example.

## Scope / non-goals
Bounded F4/F5 correction only. No v1/CLI migration, live acquisition, lifecycle policy, trade submission, or publication. Filing is not an execution grant.

## Acceptance criteria
Public operation explanations and examples must faithfully express accepted evidence-qualified financial results. Existing36operations, financial/evidence/security semantics and retained source history remain intact. Independent Kiro verification required before integration/publication.

## Remediation history
Candidate prepared in codex/api-v2-product-conformance-correction-2026-10-22. See linked immutable candidate review package; not deployed or independently accepted.

## Verification
Author deterministic tests and static documentation specimens are recorded in the linked report. Bug remains Open pending independent verification and controlled acceptance; passing author tests are not Product acceptance.

## Related
[Correction task state](../implementation/api-v2-foundational-2026-10-21/product-conformance-2026-10-22/STATE.md); F3 lifecycle questions are reserved and are not this defect.
