# PL-API-02 — Accepted Kiro triage and bounded documentation corrections

**Date:** October 15, 2026. **State:** Principal accepted triage and authorized corrections #5/#7/#9, tests, persistence and push. Final independent release review remains pending; publication is on hold. Codex authored Step 2 and these corrections: this record is author evidence, not independent release approval.

## Frozen inputs and preservation

- Accepted Step 2 source: `347d3a9a648d36620341aecf98f663ed387837f6`; remote main reverified before correction. Original human artifact SHA-256: `357dc6f4f30a14d31ab83ee0e17ce7d0736d2692fab50333c6daf5d9b534cdb7`.
- Original Kiro report: `~/Downloads/kiro-black-box-acceptance-2026-10-15.md`, retained unchanged as the Principal-supplied standalone artifact. SHA-256: `96b2eacba2d933ee4d5087b0aa4fe44e855c788dfad37893ee9158dba9dca44b`. Remote advanced to `811a968d670f07e051a68268712d2cf6bafa81fb` during correction, preserving a [repository copy](kiro-black-box-acceptance-2026-10-15.md). That copy has SHA-256 `8f28985d5a74aecf36c7a383c48adb07642fdc39b03f9a82b57302c2c31b4532`; its only difference from Downloads is the absent final newline. Both copies remain unchanged. Its findings are in **Section 8**; Section 9 separates observations/inferences. This record preserves dispositions without rewriting the original report.
- Kiro recovered all 19 methods/routes/operation IDs exactly matching the frozen public embedded specification, representative shapes, three written synthetic requests, HTTP semantics, provenance/completeness and the execution boundary. Extracting OAS embedded in the supplied HTML is valid public-surface consumption. This is successful agent-usability evidence, not final release acceptance. Repository access exclusion is Kiro's reported test discipline; this comparison does not claim an independent process audit.
- The Principal accepted all ten dispositions and selected only #5/#7/#9 for correction. The other seven are nonblocking; optional clarifications are not implemented by this change.

## Ten-finding disposition

| Finding | Accepted classification | Evidence and disposition |
| --- | --- | --- |
| 1 — Missing authentication | Intentional Product restriction | Requirements plan, Product boundary, explicitly excludes public authentication/grant instructions while internal OAS retains security. No public instructions added. |
| 2 — No usable base URL | Acceptable limitation | Unpublished preview declares `/`; reserved example origin is intentionally nonoperational. No deployment origin invented. |
| 3 — Write-operation error bodies | Reported absence falsified; no defect confirmed | Both `acquireDirectQuotes` and `retainAndProcessAccountArtifact` resolve shared responses containing concrete synthetic errors. Browser comparison opened each POST's 422 tab and observed `INVALID_REQUEST`. Refs do not imply missing rendered examples. |
| 4 — Retry example / identity relationship | Missing example falsified; optional identity clarification deferred | Public `retryRetainedArtifactProcessing` has a minimal cURL example, verified in the browser. Prose describes appending an attempt from retained bytes; Attempt documents opaque import identity. Additional explanatory wording is nonblocking and unchanged. |
| 5 — Empty authorityEpoch meaning | Genuine public documentation defect; corrected | The authoritative QuoteProvenance field had a description, but the public filter dropped it for the word credential. Reword the authoritative annotation as opaque fencing provenance, without authentication prose; verify public schema and expanded native UI retain the meaning. No filter relaxation or wire change. |
| 6 — Codec examples | Deferred enhancement | EncodedQuoteSymbol already supplies canonical rules and a pattern. Exhaustive tables/custom validators are unnecessary for this correction. Request symbols versus encoded path tokens remain distinct. |
| 7 — FORCE preconditions | Genuine semantic gap; corrected; grant instructions intentionally excluded | Authoritative quote contract says FORCE bypasses reuse and does not override contact restrictions. Explain backend contact policy and CONTACT_NOT_PERMITTED versus UPSTREAM_UNAVAILABLE in public OAS annotations. No authentication/grant configuration instructions or override introduced. |
| 8 — Limits / throttling | Acceptable limitation; absence overstated | Public history descriptions also state deadline/page/row/input/response capacities. No documented rate quota or 429 promise follows from absence. Do not invent one. |
| 9 — CSV interpretations | Genuine completeness gap; corrected | Document the four existing Fidelity export types, exact required column labels, envelope/date/filename attribution, supported row rules and pre-retention validation versus post-retention processing rejection. This is documentation of accepted behavior, not a new CSV format. |
| 10 — Pagination | Acceptable limitation; optional clarification deferred | Accounts/Users prohibit queries, history prohibits queries and delivers bounded complete JSON, Artifact inventory says complete. No pagination API is invented. |

Additional report precision: shared Price permits source-reported zero; QuoteFacts requires at least one qualifying strictly positive price-bearing fact. Kiro's wording must not be read as requiring every price to be positive. Its three requests are request-shape templates; in particular an invented activity filename does not establish broker-account attribution or promise processing ACCEPTED. HTTP 200/REJECTED remains a valid retained-source result. The original report is preserved, including these imprecisions.

## Contract authority and correction scope

Reuse the [requirements plan](../design/pl-api-02-v2-documentation-requirements-plan-2026-10-15.md), [quote domain contract](../contracts/api-v2-direct-quote-acquisition-proposal.md) sections Observation and clocks / HTTP, error, security, and configuration, and existing [Account evidence semantics](../cli/ww-account-evidence.md). Annotations live in the authoritative common/account OAS; no separate authored agent/public contract is created.

CSV fidelity was checked against existing `FidelityPositions.parse`, `BrokerageArtifacts.sourceBrokerIds`, `sourceFooter`, `ingest`, `process` and `admitRows`, and `FidelityTransactions.normalize` under `evidence-service-java/src/main/java/com/wheelwright/evidence/v2/`. Controller upload validation remains unchanged. Required headers do not mean all cells must be nonblank. Recognized broker envelopes and attribution remain necessary; generic CSV syntax alone cannot promise admission. Only placeholders appear in guidance: no real brokerage account numbers, evidence or source files are added.

Regression checks extend existing source/public conformance and the native browser specimen: restored opaque provenance, FORCE's policy boundary, four format column/envelope descriptions and HTTP 200 processing rejection must survive generation/rendering. Native provenance expansion is exercised rather than requiring collapsed schema prose to appear immediately. All existing public suppression, network, navigation and wire/security preservation checks remain in place.

## Independent release-review handoff

Provide a **fresh separate Codex reviewer** the final synchronized source identity, this accepted disposition, the unchanged original Kiro report, the requirements plan, authoritative OAS/linked contracts, exact two-file public artifact and private provenance/test evidence. The reviewer must independently reproduce the artifact, inspect both consumption methods and verify all three corrections plus the public exclusion boundary. Existing Kiro usability evidence is preserved; it does not certify the revised artifact or waive reviewer checks. Author tests cannot substitute for this separate review.

No backend source/runtime, brokerage adapters, database/schema, operational configuration/data, CI workflow, Pages setting, End-of-Session Protocol or issue #39/#40/#41 disposition is changed. No publication is authorized by this correction delivery.


## Author verification

The existing seven focused OAS conformance groups pass for all 19 operations. Source/public validation passes all 134 examples, source-controller coverage, unchanged wire/security constraints and exact artifact allowlist. Browser verification passes native provenance expansion, FORCE policy text and CSV table/rejection guidance, plus existing desktop/mobile navigation/search/cURL/error checks. Zero page errors and HTTP/HTTPS requests; no backend/API service used. New provenance/CSV screenshots were visually inspected. Roadmap regeneration/freshness and all 58 integrity/freshness tests pass; diff whitespace check passes. These are author results, not independent release acceptance. Frozen committed artifact hashes and clean rebuild comparison follow in the delivery identity record.
