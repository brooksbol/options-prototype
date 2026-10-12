# BUG-037 — Tastytrade JSON source scope ignores content outside inventory items

- **Status:** Resolved
- **Severity:** S2
- **Area:** Backend / v2 tastytrade evidence acquisition and disclosure
- **Provenance:** PL-CONV-01 Step 5 independent Kiro verification, October 11, 2026; Principal reconciled both findings and authorized bounded correction A.

## Observed failure
The frozen Step 5 candidate returned HTTP 200 with foreign-Account JSON to an owner-only original-artifact reader. Both implementer self-review and independent Kiro review reproduced this against frozen JAR SHA-256 `323ef24b1db20957f307c91aad938748957b386fa5b2555ced9f0211b2da798a`. Independent review extended the specimen to top-level content. No live disclosure incident is established.

## Intended semantics violated
`77-api-v2-architectural-guardrails.md` requires sufficient authority for every represented source Account; unknown scope cannot establish owner-only scope. The TASTYTRADE classifier checked only `data.items`, then declared the complete original owner-only.

## Consequence / diagnosis
Original-byte disclosure can cross financial Account authority. The new JSON classifier was incomplete; the enforcement loop and existing Fidelity BUG-036 correction remain sound.

## Scope / acceptance criteria
Recognize the complete supported JSON envelope, fail closed on unknown structure, preserve acquisition provenance. Keep retention and valid holdings admission independent from disclosure eligibility. Preserve Fidelity source-scope and per-Account authorization checks.

## Remediation / verification
Principal explicitly authorized the bounded R2 correction. `TastytradeHoldings.sourceAccount` now recognizes only the supported complete envelope and scalar item schema. `TastytradeDisclosureTest` challenges data siblings, top-level data, nested/array data, foreign context, pagination extensions, duplicate/malformed documents and rejected retained originals through real artifact disclosure. Valid retained bytes still return 200; unknown scope returns 403 even with all known Account grants. Existing Fidelity regressions pass. R2 subsequently passed independent Kiro verification and Principal operational/visual acceptance; see closure below.

## Related
PL-CONV-01; BUG-036 (accepted Fidelity protection preserved); `../design/pl-conv-01-step5-candidate.md`; original frozen submission and review artifacts under `/Users/bollich/.local/share/wheelwright/pl-conv-01-step5/`.


## Principal acceptance / closure — October 11, 2026 (America/Denver)
Kiro independently ACCEPTED frozen R2 JAR SHA-256 `33d5e3360c697db8863eafc4bc173452b2c8f4c9a49f9e60318386e9026d15e4`. Complete-envelope fail-closed disclosure, valid-byte access, admission/disclosure separation, whole-body deadline, socket cancellation, released monitor, snapshot preservation and subsequent acquisition recovery passed. Fidelity protection remains preserved; the corrected raw-socket reviewer harness and the exact executed-versus-reused regression evidence are documented in the Step5 design closeout. The Principal accepted the independent report, authorized deployment, successfully exercised ordinary installed ww acquisition/read commands, supplied the color screenshot and explicitly selected A accepting functionality/presentation. This defect is **Resolved**, not merely candidate-remediated. No live incident is inferred from the synthetic original failure.
