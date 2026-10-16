# BUG-042 — Portfolio Capital non-Fidelity 422 omits required validation details

- **Status:** Open
- **Severity:** S3 — moderate contract-conformance failure; analyst assessment, not remediation priority
- **Area:** Backend / v2 Portfolio Capital HTTP error contract
- **Provenance:** Principal-supplied independent PL-API-02 release review REJECT, finding IRR-01, October 15, 2026

## Observed failure

The independent reviewer reported that an authenticated caller with the required Account-scoped artifact-read grant selecting an existing non-Fidelity Account receives HTTP 422 from `GET /v2/portfolio-capital-observations`, code INVALID_REQUEST, detail "Fidelity evidence required", without invalidParams. Principal supplied the REJECT verdict; the original full independent review artifact has not been supplied to this record. This is the release blocker IRR-01, not a separate defect identity.

## Intended semantics violated

The authoritative Account evidence OAS requires nonempty invalidParams for HTTP 422 Problems. Preserve this structured validation convention. Unsupported broker selection remains HTTP 422 with the same code/detail; no supported-broker expansion or OAS weakening is selected.

## Evidence

At remotely verified `f20185351ba2b34c5f7d136cc796f8583365e96f`, `PortfolioCapitalController.read` passes null validation details for the existing non-Fidelity branch. `ProblemDetails.of` preserves null and NON_NULL serialization omits invalidParams. This source trace independently confirms the reported discrepancy.

Applying the unchanged authoritative response schema through `Contracts.validate_response` rejects a synthetic body derived from that branch; adding the proposed validation entry passes. This is source/schema confirmation, **not a newly observed runtime HTTP response**. Existing `PortfolioCapitalHistoryTest.authenticationAccountGrantsValidationAndNoAdminBypass` exercises query/body validation and Fidelity success, but not this authorized non-Fidelity error branch or its exact Problem schema.

## Consequence

A schema-validating human/agent client can reject this error representation. Runtime/OAS fidelity fails although coverage, rendering and synthetic example tests pass. No financial arithmetic error, disclosure or operational deployment failure is established. Independent release verdict remains REJECT and publication is on hold.

## Diagnosis / root cause

The specific business-validation branch calls the common Problem serializer with null rather than one structured accountId validation reason. Documentation conformance tests validated examples and other 422 branches without covering this reachable branch.

## Scope / non-goals

Registering this defect is authorized by the Principal's supplied next action. **Backend correction authorization remains explicitly pending in that directive.** Filing/review does not itself authorize remediation. No backend, OAS, grants, brokerage, database, Pages/workflow or operational behavior is changed by registration. No new GitHub Issue or PL identity is created.

## Acceptance criteria

1. Once explicitly authorized, replace only this branch's null argument with `List.of(new ProblemDetails.InvalidParam("accountId", "Fidelity Account required"))`, or equivalent accurate wording. Keep HTTP 422, INVALID_REQUEST, detail "Fidelity evidence required", correlation and no-store behavior.
2. Add a focused synthetic regression using an existing non-Fidelity Account and exact read grant; assert the original status/code/detail, nonempty invalidParams identifying accountId, headers and conformance to the unchanged response schema. Demonstrate failure against the frozen pre-fix candidate.
3. Preserve authentication, Account authorization, Fidelity success, other validation branches and storage/provider boundaries. No live provider or operational data required.
4. Run focused backend regressions plus existing OAS/conformance validation. Submit a new immutable candidate to a separate independent reviewer; author tests do not constitute release approval.

## Remediation history

None. Open; backend correction not performed.

## Verification

Registration verification: source trace and synthetic unchanged-OAS negative/positive comparison described above. Runtime remediation and independent verification pending.

## Related

- [PL-API-02 requirements and release plan](../design/pl-api-02-v2-documentation-requirements-plan-2026-10-15.md)
- [Independent release-review handoff](../reviews/pl-api-02-independent-release-review-handoff-2026-10-15.md)
- `docs/contracts/api-v2-account-evidence.json`, Portfolio Capital 422 response and Problem constraints
- `evidence-service-java/src/main/java/com/wheelwright/evidence/v2/PortfolioCapitalController.java`
- `evidence-service-java/src/main/java/com/wheelwright/evidence/v2/ProblemDetails.java`
