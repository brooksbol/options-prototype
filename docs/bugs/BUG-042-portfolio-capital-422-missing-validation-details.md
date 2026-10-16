# BUG-042 — Portfolio Capital non-Fidelity 422 omits required validation details

- **Status:** Resolved
- **Severity:** S2 — major, matching the independent reviewer’s MAJOR contract-fidelity classification; not remediation priority
- **Area:** Backend / v2 Portfolio Capital HTTP error contract
- **Provenance:** Principal-supplied independent PL-API-02 release review REJECT, finding IRR-01, October 15, 2026

## Observed failure

The independent reviewer reported that an authenticated caller with the required Account-scoped artifact-read grant selecting an existing non-Fidelity Account receives HTTP 422 from `GET /v2/portfolio-capital-observations`, code INVALID_REQUEST, detail "Fidelity evidence required", without invalidParams. Principal initially supplied the REJECT summary and subsequently supplied the full independent review in conversation. The review identifies exact candidate `f20185351ba2b34c5f7d136cc796f8583365e96f` and an actual MockMvc reproduction in `/tmp/wheelwright-release-review-20261015`. This is the release blocker IRR-01, not a separate defect identity.

## Intended semantics violated

The authoritative Account evidence OAS requires nonempty invalidParams for HTTP 422 Problems. Preserve this structured validation convention. Unsupported broker selection remains HTTP 422 with the same code/detail; no supported-broker expansion or OAS weakening is selected.

## Evidence

At remotely verified `f20185351ba2b34c5f7d136cc796f8583365e96f`, `PortfolioCapitalController.read` passes null validation details for the existing non-Fidelity branch. `ProblemDetails.of` preserves null and NON_NULL serialization omits invalidParams. This source trace independently confirms the reported discrepancy.

Applying the unchanged authoritative response schema through `Contracts.validate_response` rejects a synthetic body derived from that branch; adding the proposed validation entry passes. This is source/schema confirmation, **not a newly observed runtime HTTP response**. Existing `PortfolioCapitalHistoryTest.authenticationAccountGrantsValidationAndNoAdminBypass` exercises query/body validation and Fidelity success, but not this authorized non-Fidelity error branch or its exact Problem schema.

### Full independent review subsequently supplied

The reviewer reports executing the unchanged production controller through MockMvc with a disposable tastytrade Account/User and exact artifact-read grant. The actual returned body was:

```json
{
  "type": "urn:wheelwright:problem:invalid_request",
  "title": "Invalid request",
  "status": 422,
  "code": "INVALID_REQUEST",
  "detail": "Fidelity evidence required",
  "requestId": "33b46552-a96c-4cc1-994a-d7067831a649"
}
```

The reviewer applied `Contracts.validate_response('GET', '/v2/portfolio-capital-observations', 422, payload)` and observed rejection of this **actual** response. This is independent runtime evidence supplied by the Principal, distinct from the registration actor's source-derived synthetic comparison. No live provider or operational service was involved. The reviewer reported 176 Java tests (175 passed/one skipped), 37 actual synthetic HTTP specimens, 25 held-detail and 62 discovery specimens, seven conformance groups and 134 examples passing; none covered this exact branch before the counterexample. No remediation or new author runtime execution is claimed.

The full review classifies IRR-01 MAJOR; registration's preliminary S3 analyst assessment is superseded by S2 under the repository severity vocabulary. The independent REJECT applies to frozen `f201853`; subsequent registration/evidence commits contain no backend/OAS correction and do not resolve it.

IRR-02 is a nondefect input transcription observation: one supplied prompt used a 63-character LICENSES digest. The handoff and independently generated artifact agree on the 64-character SHA-256 `56872a8c6112765251a061ad17fd179d42dae5c9eae53b28eab4ed187ea4f377`. No artifact/license correction or separate BUG identity is warranted.

## Consequence

A schema-validating human/agent client can reject this error representation. Runtime/OAS fidelity fails although coverage, rendering and synthetic example tests pass. No financial arithmetic error, disclosure or operational deployment failure is established. This consequence caused the original independent REJECT; the subsequent independent ACCEPT and resolution are recorded below. Publication remains unperformed.

## Diagnosis / root cause

The specific business-validation branch calls the common Problem serializer with null rather than one structured accountId validation reason. Documentation conformance tests validated examples and other 422 branches without covering this reachable branch.

## Scope / non-goals

Registering this defect is authorized by the Principal's supplied next action. The initial registration directive left backend authorization pending. **Principal subsequently approved Decision A**, explicitly authorizing this one-branch correction, focused regression, actual-response/OAS validation, applicable tests, commit/push and separate independent verification. Filing/review alone did not supply that grant. No OAS weakening, unrelated backend change, operational grant/data/service change or publication is authorized. No new GitHub Issue or PL identity is created.

## Acceptance criteria

1. Once explicitly authorized, replace only this branch's null argument with `List.of(new ProblemDetails.InvalidParam("accountId", "Fidelity Account required"))`, or equivalent accurate wording. Keep HTTP 422, INVALID_REQUEST, detail "Fidelity evidence required", correlation and no-store behavior.
2. Add a focused synthetic regression using an existing non-Fidelity Account and exact read grant; assert the original status/code/detail, nonempty invalidParams identifying accountId, headers and conformance to the unchanged response schema. Demonstrate failure against the frozen pre-fix candidate.
3. Preserve authentication, Account authorization, Fidelity success, other validation branches and storage/provider boundaries. No live provider or operational data required.
4. Run focused backend regressions plus existing OAS/conformance validation. Submit a new immutable candidate to a separate independent reviewer; author tests do not constitute release approval.

## Remediation history

October 15 — Principal-approved bounded author correction adds one accountId validation entry only to the non-Fidelity Portfolio Capital 422 branch. Status, code, detail, request correlation and no-store behavior are unchanged. Focused regression and existing integrated synthetic fixture/harness cover the branch. At author handoff, status remained Open and release remained REJECTED pending separate independent verification; the subsequent ACCEPT below resolves that state.

## Verification

Registration evidence remains preserved above. Author remediation verification:

- Added `PortfolioCapitalHistoryTest.nonFidelityValidationIncludesAccountDetails`; ran against unchanged production code at `9ef78e6f14203def52008683481a1721c9fdc3de` and observed failure because invalidParams is not an array (field absent). Then made the one-branch correction; the test passes with exact status/code/detail, one accountId reason, content type, correlation and no-store assertions. The rejected candidate is preserved in Git; disposable red-run XML is `/tmp/ww-bug042-red.xml`.
- Existing v2 suite: **177 tests, 176 passed, one optional skip, zero failures/errors**. Seven focused OAS conformance groups pass; 19 mapped operations and unchanged schemas/security remain covered.
- Extended the existing integrated-update test fixture with the Portfolio Capital controller/service and reused the existing temporarily granted/restored synthetic tastytrade artifact-read scope. No new fixture framework, operational grant or real broker contact. Existing HTTP harness now validates **38 actual synthetic HTTP specimens**, including this exact 422 against the unchanged authoritative OAS, response headers and body/header correlation.
- Actual corrected body preserves type `urn:wheelwright:problem:invalid_request`, title `Invalid request`, status 422, code `INVALID_REQUEST`, detail `Fidelity evidence required`; adds `invalidParams: [{"name":"accountId","reason":"Fidelity Account required"}]`. The HTTP sample uses correlation UUID `11111111-1111-4111-8111-111111111111`, `application/problem+json` and `Cache-Control: private, no-store`.
- Disposable HTTP evidence: `/tmp/ww-bug042-http.JttBkV/http-samples.json`. Its owned fixture was stopped after verification. No operational API/provider/service or Downloads writes.

Reproduce from repository root using the existing Python validation environment:

```sh
cd evidence-service-java
./gradlew --offline test --tests 'com.wheelwright.evidence.v2.*'
cd ..
tools/api-docs/.venv/bin/python scripts/v2-oas-conformance-test.py
```

For actual HTTP verification, create a fresh temporary directory, start `./gradlew --offline integratedUpdateFixture -PfixtureReady=ABSOLUTE_TEMP_DIRECTORY/ready.json` from `evidence-service-java`, then run `tools/api-docs/.venv/bin/python scripts/v2-oas-http-validation.py ABSOLUTE_TEMP_DIRECTORY/ready.json ABSOLUTE_TEMP_DIRECTORY/http-samples.json` from repository root. Stop the owned fixture afterward. The harness validates this branch against the authoritative OAS rather than merely testing a synthetic example. These are author results only; separate independent verification subsequently completed as recorded below.

### Independent resolution — October 15, 2026

Principal supplied independent re-review **ACCEPT** of remote `6126afddc6c0e95d2fb496e31e4e86d28320577d`, containing correction `7b654994c40833a862419d9c4ae23b0b35d79057`. The reviewer reproduced original `f201853` failure, original-controller regression failure and unchanged-OAS rejection, then independently verified the corrected actual response, focused regression, 177-test backend suite, seven OAS groups, 38 HTTP responses and seven additional MockMvc cases. Both supplied/generated request IDs, prior 401/403/200/422 behavior and financial/source-scope semantics remain correct. No remaining material findings. **BUG-042 is Resolved on independent evidence**, not author test results. [Re-review reconciliation](../reviews/pl-api-02-independent-rereview-acceptance-2026-10-15.md) preserves identities, evidence hashes, other passed gates and the distinction between readiness and publication. No deployment/publication is claimed.

## Related

- [PL-API-02 requirements and release plan](../design/pl-api-02-v2-documentation-requirements-plan-2026-10-15.md)
- [Independent release-review handoff](../reviews/pl-api-02-independent-release-review-handoff-2026-10-15.md)
- `docs/contracts/api-v2-account-evidence.json`, Portfolio Capital 422 response and Problem constraints
- `evidence-service-java/src/main/java/com/wheelwright/evidence/v2/PortfolioCapitalController.java`
- `evidence-service-java/src/main/java/com/wheelwright/evidence/v2/ProblemDetails.java`
