# PL-API-02 — Bounded Principal public-reference cleanup

**Authority:** Principal's [full live-site walkthrough](pl-api-02-principal-live-site-review-2026-10-15.md) and explicit bounded implementation/publication directive. Remotely verified baseline `c2f44a38ab3bc2b8ef974ca3a08bb328a2cdd451`; initial shared checkout clean. Existing isolated worktree protects unrelated work. No backend/OAS/agent-contract change, Artifact documentation edit, domain redesign, protocol amendment or PL closure.

## Delivered boundary

Public projection excludes exactly GET /v2/users, GET /v2/users/{userId}, POST /v2/position-acquisitions and GET /v2/market-evidence-subjects. GET /v2/me remains self-inspection and uses native **Identity** tagging; internal security/semantics remain in untouched authoritative OAS. Empty paths/tags and the introductory subject-selection bullet are removed with those public capabilities. Expected counts: **15 public / 19 internal**; internal operation IDs and all authoritative files unchanged.

Pinned Redocly CLI performs native [unused-component removal](https://redocly.com/docs/cli/commands/bundle) after projection. An independent reachability assertion checks every public component is referenced from retained paths. No orphan User-discovery/acquisition/selection schema or example remains. Self-inspection still needs the User representation; retained evidence can still name its source-acquisition provenance. Those required representations are not orphaned internal operations.

Native schema `title` annotations label status/code-constrained oneOf branches, such as **422 — Invalid request**. Public-only error presentation copies preserve identical resolved wire constraints and examples. **Artifact operations bypass title/editorial overrides**; full resolved descriptions, schemas, titles, headers and examples compare exactly with their prior public projection. No custom renderer, frontend, selector/filter component or schema engine. Redoc still presents reusable allOf/oneOf variants natively; response-specific constraints/examples and actual status bars remain authoritative, not permission to choose a different HTTP result.

Portfolio Capital introduction groups existing sentences into eight paragraphs. Word-for-word comparison ignoring whitespace verifies the formula, two-source qualification, no NAV/atomic/history claim, missing/null/zero rules, clocks/provenance, ambiguous timestamps/order, unknown coverage and capacity/status limitations are unchanged. No resource redesign.

## Verification and status review

- Source controller/OAS inventory and structural/reference validation: **19 internal operations, 134 examples**, unchanged wire/security. Byte comparison through Git confirms no backend, authoritative OAS, repository agent entry or semantic-contract edits.
- Public coverage: exact internal-minus-four set, **15 operations**. GET /v2/me under Identity; excluded operation IDs/routes absent from generated HTML and public search/navigation.
- Public response examples: **106**, all validate against the actual pruned/titled public schemas; existing request/parameter/cURL examples remain checked through authoritative schemas. Resolved non-Artifact constraints remain identical; Artifact presentation compares exactly.
- Native pruning reachability and strict two-file allowlist pass. Negative specimens adding an excluded operation or unreachable schema fail validation. Old assumptions of identical public/internal path and schema sets are replaced by explicit audience coverage plus fidelity/preservation checks, not weaker structural validation.
- Existing seven OAS conformance groups pass. Local native browser checks cover all 15 operations, absence of excluded routes, Identity navigation, Account/held-quote error labels, paragraph rendering, search/mobile/schema/cURL/errors, #5/#7/#9 and all existing security controls. Zero page errors/unintended HTTP requests; no API execution/credential entry/download offer. New screenshots visually inspected.
- REST-01 is review-only: existing public status union remains 200/400/401/403/404/415/422/500/503. No 201/202/303/304/406/409/429 is added. Quote wrong media remains 415; Artifact wrong media remains its implemented 422. Held reads still ignore conditional ETags/no 304; unknown throttling/conflict/creation policy is not invented. Deferred domain observations remain parked.

## Authorized publication identity

This content intentionally differs from the first published 19-operation artifact. It is not represented as byte-identical to that artifact. `release.json` records the Principal cleanup source and new verified preview identity under this explicit bounded publication authorization; it does not claim a new independent review of the revised UI. Existing accepted contract-input/license hashes, workflow permissions, environment restriction and exact artifact allowlist remain unchanged. Publication remains through the approved CI/CD path.

| Artifact | SHA-256 |
| --- | --- |
| Revised 15-operation preview | `6d26b9bc44b80f45a26336d387643959ef45fd1624ea4e977693fa05f2c56821` |
| Revised published index.html | `f8c5f1b6adeff77b897dd89cfdf4fe2d9995c499d0a4fd42b9b18351d583c411` |
| Unchanged LICENSES.txt | `56872a8c6112765251a061ad17fd179d42dae5c9eae53b28eab4ed187ea4f377` |

Local publication candidate passes identity gate and validation. Actual deployment/live observations are pending at the implementation commit and must be recorded before success. Principal reinspection/final Product acceptance remains pending; Step 5 and PL closure have not begun.

**Remaining COTS limits:** Empty introductory right pane remains nonblocking (UX-01); no custom layout. Native shared-schema selector behavior is preserved. Artifact selectors/content remain as previously published by explicit scope. Native dark mode remains previously accepted as unimportant. No deferred backend/domain change is needed for this cleanup.
