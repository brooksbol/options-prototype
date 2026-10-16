# PL-API-02 — Independent re-review ACCEPT reconciliation

**Date:** October 15, 2026. **Category:** Reconciliation/evidence record, not a new independent review or Product decision. Principal supplied the completed independent re-review in conversation. This record reconciles that evidence; the author of BUG-042 does not self-certify the correction.

## Reviewed identity and disposition

Independent reviewer **ACCEPTED** remotely verified `6126afddc6c0e95d2fb496e31e4e86d28320577d`, containing correction `7b654994c40833a862419d9c4ae23b0b35d79057`. The original rejected identity `f20185351ba2b34c5f7d136cc796f8583365e96f` and IRR-01 remain preserved as history. BUG-042 is now Resolved on demonstrated independent verification; no remaining material findings were reported. Publication is unperformed; this reconciliation performs no hosting, deployment, CI or protocol changes.

The reviewer reports isolated clone/bootstrap/authority checks, no operational checkout changes, staged/inactive Gate Experiment 001, no live brokerage/operational data, and stopped disposable fixtures. Reviewer independence and these execution statements are supplied review evidence, not a new process audit by the implementation actor.

## Original failure and corrected runtime

The independent probe extracted the original controller from `f201853`; its actual MockMvc response omitted invalidParams and failed unchanged OAS validation. The focused regression also failed against it. The corrected production controller passed both, with status 422, INVALID_REQUEST, detail "Fidelity evidence required", and `invalidParams: [{"name":"accountId","reason":"Fidelity Account required"}]`. Both supplied/generated correlation IDs and application/problem+json/no-store headers validated. Additional probes preserved missing-credential 401, administrator/wrong-grant 403, Fidelity empty-success 200 and invalid-correlation 422.

The sole production difference is the PortfolioCapitalController validation entry. No OAS weakening, adapter/migration/authorization-model change, operational configuration or deployment was found. Supporting fixture/harness/test changes cover that branch.

## Independent verification results supplied

| Check | Result |
| --- | --- |
| Focused BUG-042 regression and original-controller negative test | Pass / original fails |
| V2 backend suite | 177 tests: 176 passed, one optional private-reference skip; zero failures/errors |
| Existing OAS conformance | Seven groups pass |
| Existing integrated HTTP harness | 38 actual specimens pass |
| Additional independent MockMvc cases | Seven pass unchanged OAS |
| Documentation coverage/examples | 19 operations / 134 examples pass |
| Roadmap integrity/freshness | 58 checks pass; projection current |
| Fresh browser verification | Desktop/mobile, navigation/search, schemas/cURL/errors and #5/#7/#9 pass; zero HTTP requests/page errors |

Independent tests also preserved Portfolio Capital arithmetic/provenance, unmatched/ambiguous evidence, explicit zero and source-scope protection. Kiro's original usability report remains unchanged, separate evidence; its black-box test was not repeated.

## Evidence identities

The reconciliation actor confirmed these supplied JSON files exist and recorded their byte hashes; they are temporary external evidence, not publication contents:

| Evidence | SHA-256 |
| --- | --- |
| `/tmp/ww-pl-api-02-rereview.4KEkua-probe/current.json` (seven cases) | `86c4e0668dbcba411d8d1278be8aefe78bfb7c9e1beb1af4be8b823b5b1054b3` |
| `/tmp/ww-pl-api-02-rereview.4KEkua-probe/original.json` (seven cases) | `1fee9d387f80ca466d841f793f4a7fe2a2d6183044d5b6e5fb58f5600f743118` |
| `/tmp/ww-pl-api-02-rereview.4KEkua-http/http-samples.json` (38 responses) | `fde228f1a2eee033d8c3a0a1c24bc94cf22f70477be28ff0269e7cea7465548f` |

Two independent documentation builds were byte-identical and matched the handoff: index.html **`eba04ae021122b6103ae19024190de9d0c60eb833f7da424271fe3183d9c09eb`**; LICENSES.txt **`56872a8c6112765251a061ad17fd179d42dae5c9eae53b28eab4ed187ea4f377`**. Public output remains exactly those two files. Matching bytes preserve prior disclosure review; fresh checks confirm no public authentication/grant instructions, credential/execution/download controls, HTTP requests or page errors. Private evidence stays outside the public artifact.

## Reconciled continuation boundary

The prior runtime/OAS release blocker is independently resolved. The recorded Step 3 independent gate is satisfied for the reviewed identity; this is independent readiness, not a claim of publication or operational delivery. Existing Step 4 hosting/workflow/security gates and the deferred Step 5/issue39 procedure requirements remain distinct. No GitHub Pages publication, operational deployment, workflow/settings change, protocol amendment or issue39/40/41 action is performed by this reconciliation. No new Product or architecture decision is manufactured.

Related: [BUG-042](../bugs/BUG-042-portfolio-capital-422-missing-validation-details.md), [requirements plan](../design/pl-api-02-v2-documentation-requirements-plan-2026-10-15.md), [completed independent handoff](pl-api-02-independent-release-review-handoff-2026-10-15.md).
