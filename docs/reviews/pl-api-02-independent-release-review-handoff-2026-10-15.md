# PL-API-02 — Separate independent release-review handoff

**Assigned role:** Fresh independent Codex reviewer. Codex author verification is not independent release approval. **Publication remains on hold.** Review and report only; do not remediate, publish, change Pages/CI, amend the End-of-Session Protocol or close issues #39/#40/#41.

Bootstrap from current remote main through AGENTS.md, docs/AGENTS.md, docs/README.md and Codex cold-start routing. Record exact reviewed SHA and protect unrelated work. Verify that correction implementation **`655c18e97cc9bcf25fba891f256b16557dd50110`** is an ancestor; subsequent delivery-record commits do not change its OAS/tooling inputs. Read the requirements plan and [accepted ten-finding triage](pl-api-02-kiro-triage-2026-10-15.md). Independently assess, without treating author claims as conclusions.

## Exact evidence and specimen

- Original [Kiro report](kiro-black-box-acceptance-2026-10-15.md), preserved unchanged from remote `811a968`: SHA-256 `8f28985d5a74aecf36c7a383c48adb07642fdc39b03f9a82b57302c2c31b4532`. The Principal's Downloads copy has SHA-256 `96b2eacba2d933ee4d5087b0aa4fe44e855c788dfad37893ee9158dba9dca44b`; the sole difference is its final newline. Preserve both; the report is successful agent-usability evidence, not approval of the revised release artifact.
- Public preview: `tools/api-docs/dist/site/index.html`. Exact public allowlist: **index.html, LICENSES.txt**.
- Frozen corrected HTML SHA-256: **`eba04ae021122b6103ae19024190de9d0c60eb833f7da424271fe3183d9c09eb`**.
- LICENSES.txt SHA-256: `56872a8c6112765251a061ad17fd179d42dae5c9eae53b28eab4ed187ea4f377`.
- Private generated evidence: `tools/api-docs/dist/private/provenance.json`, `agent-specimen.json`, `human-specimen.json`, screenshots including `provenance.png` and `csv-formats.png`. These are not publication contents.
- Reproduction commands and pinned dependencies: [tooling README](../../tools/api-docs/README.md). Regenerate locally if ignored output is absent. Author comparison rebuilt clean committed source twice, with a clean locked npm installation between builds, and compared both public files byte-for-byte.

## Review obligations

1. Independently inventory accepted v2 controller operations and verify OAS operation IDs, schema/reference truth, request/response/error/header/caching semantics and security/grant preservation against authoritative linked Product contracts. No backend or operational API mutations.
2. Verify #5: authorityEpoch remains opaque fencing provenance in authoritative OAS and public HTML, with no implied time/client-sequencing contract or authentication instructions. Expand native provenance in the rendered schema.
3. Verify #7: FORCE bypasses reuse without overriding contact restrictions; backend policy applies at actual contact; policy-denied contact is distinguished from upstream unavailability. Preserve partial-success/retained-evidence truth. Public grant instructions remain intentionally absent.
4. Verify #9: four supported Fidelity export interpretations have accurate required column labels, envelopes/date/attribution and rejection semantics. Compare with accepted contract/implementation evidence; distinguish request shape, retention and evidence admission. No new source format or generalized CSV framework is authorized.
5. Independently inspect native desktop/mobile navigation/search, schema/error/cURL rendering, offline file browsing and no execution/credential/download UI. Confirm no remote requests and no public authentication/grant instructions; ordinary HTTP status/header semantics remain visible.
6. Rebuild from pinned tooling, compare exact public hashes and review both bundled OAS and HTML for disclosure. Confirm synthetic-only content, no real account numbers/financial evidence/credentials/source artifacts, licenses, provenance and exact allowlist. Private output must stay outside the public artifact.
7. Report actual ACCEPT/REJECT findings and material limitations separately from Principal Product acceptance and publication permission. Check the existing publication gates and latest Principal hold; do not publish as a side effect of this review. Dark mode is expressly nonblocking; optional findings do not expand scope.

The reviewed evidence set must cover both authoritative repository OAS/domain-contract consumption and human/public artifact consumption. Do not require scraping HTML for authoritative agent contract access. Kiro's isolated public-surface test remains a distinct external-consumer exercise. Its ten findings have accepted dispositions; independently challenge the correction fidelity and release claims, not settled architecture without material falsifying evidence.
