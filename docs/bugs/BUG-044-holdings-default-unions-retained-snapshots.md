# BUG-044 — Default holdings unions historical snapshots

- **Status:** Open — isolated correction candidate; independent Kiro verification pending.
- **Severity:** S2
- **Area:** Foundational Holdings API v2
- **Provenance:** Principal-supplied Kiro Product-conformance finding F1, October22,2026. Original independent probe artifacts unavailable; author constructed new probes against frozen base8bd75f5. No original-probe reproduction claim.

## Observed failure
Two accepted same-Account snapshots produced two retained cuts in a default response; the accepted contract promises the latest applicable cut.

## Intended semantics violated
Default must select one latest applicable admitted cut per authorized Account; explicit historical access remains available. Doc77 §§4,12,13,19 and the operative contract govern the relevant boundary. Principal explicitly authorized bounded correction; no domain redesign.

## Evidence
[F1 reproduction, source/contract citations and author verification](../implementation/api-v2-foundational-2026-10-21/product-conformance-2026-10-22/verification.md). New probes are identified separately from reported samples and Kiro evidence.

## Consequence
Current custody can be double-counted across time. Severity describes that consequence; no live financial loss or disclosure incident demonstrated.

## Diagnosis / root cause
PortfolioController selected every retained HOLDING before filtering/pagination.

## Scope / non-goals
Bounded F1 correction only. No v1/CLI migration, live acquisition, lifecycle policy, trade submission, or publication. Filing is not an execution grant.

## Acceptance criteria
Default must select one latest applicable admitted cut per authorized Account; explicit historical access remains available. Existing36operations, financial/evidence/security semantics and retained source history remain intact. Independent Kiro verification required before integration/publication.

## Remediation history
Candidate prepared in codex/api-v2-product-conformance-correction-2026-10-22. See linked immutable candidate review package; not deployed or independently accepted.

## Verification
Author deterministic tests and static documentation specimens are recorded in the linked report. Bug remains Open pending independent verification and controlled acceptance; passing author tests are not Product acceptance.

## Related
[Correction task state](../implementation/api-v2-foundational-2026-10-21/product-conformance-2026-10-22/STATE.md); F3 lifecycle questions are reserved and are not this defect.
