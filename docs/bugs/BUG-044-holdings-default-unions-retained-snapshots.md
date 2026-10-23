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

## October22 — retained-catalog pagination regression

The Principal reports independent Kiro verification resolved the original F1/F2/F4–F6 targets but REJECTED frozen5377610c because retained snapshot catalog pagination lost cuts. This is reported independent disposition; original full Kiro probe artifacts were not supplied. It does not erase the original rejection or authorize deployment. The Principal separately explicitly authorizes this one bounded regression correction.

New source-admission/HTTP walks independently reproduce the failure: seven cuts at ascending limits1/2/3 yield2/3/4, reverse limit1 yields1; one Account/fivecuts/limit2 yields3. SQL compared `account||':'||snapshot_id` against the signed controller continuation `/v2/accounts/{account}:{snapshotId}`. Catalog summary generation, sorting and serialization therefore disagreed with persistence selection.

The isolated successor uses the existing canonical Account URI plus snapshot ID consistently in SQL and the controller's shared PortfolioSnapshots.orderingKey. Public cursor encoding, signature, grants, filters and resource identities remain unchanged. New19-check catalog suite covers one/two Accounts, limits1/2/3/default50, both directions, same-date distinct cuts, page boundaries, history/latest selection and restricted visibility; targeted31 checks including existing F1/F2 pass. Full regression and exact before/after traces are recorded in [the successor evidence/handoff](../implementation/api-v2-foundational-2026-10-21/product-conformance-2026-10-22/catalog-pagination-regression/README.md). Status remains Open pending targeted independent Kiro re-verification and later controlled acceptance. No F3 lifecycle or recognition policy change.
