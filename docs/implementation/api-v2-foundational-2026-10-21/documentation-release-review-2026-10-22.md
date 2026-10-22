# Independent Codex documentation release review — October22,2026

Separate fresh-context Codex reviewer `independent_docs_release_review` performed the repository-required review in its detached `/tmp/ww-docs-independent-3695c56` worktree. It received the immutable candidate/repository and normal bootstrap, with no author transcript or expected answers. It did not touch author source, operational services/data, credentials, remote Git or publication. This is Codex documentation review, not Kiro backend verification or Principal Product acceptance.

## Original verdict retained: REJECT

Candidate3695c56532bdb4948407eeeeb54785cf09883674: **REJECT** for DOC-IRR-01. `tools/api-docs/overview.md:19` described Position reads as retained inventory snapshots and line38 defined Position as observed contract/custody inventory or snapshot association. These rendered statements contradicted `docs/api-v2/README.md`, the accepted foundational Position schema and October21 acceptance checkpoint. The reviewer required only the bounded Position/Holding glossary correction, with qualified lifecycle and unresolved split/recombine retained.

Other independent checks passed: seven route/conformance groups, four operative-generation checks,36 internal/32 public operations,253 internal/225 public response examples, exact embedded public projection, accepted wire/security preservation, two-file allowlist, native browser navigation/search/cURL/error examples/mobile, zero unexpected HTTP/page errors. The reviewer also exercised Holdings/mobile navigation and visually inspected settled screenshots. It observed the author specimen's initial desktop screenshot could capture before settling; an independent settled capture confirmed actual rendering. npm audit reported zero advisories, not exhaustive bundled-code security proof. Redoc3.0.1 native API/MIT notices were inspected; no custom renderer/navigation/search was introduced.

Two independent clean builds matched: index6cd337494abc946514a18c804ad7c2ccf7501905b015c6f9f81ba6c2361fc122; LICENSES d49296fc22d15683bf0608962baec5337440a9a93537d7bf135d4a87be3dd5b8. `--publish` intentionally refused stale accepted inputs. No publication occurred during review.

## Successor verdict: ACCEPT

Exact successor **ac3ca73b8b8ec6f3f1091bcfb40cb731ee63bbce: ACCEPT**. Only overview.md and deployment evidence changed. The reviewer verified that the rendered overview distinguishes independent economic Positions from retained broker Holdings, states GUID/CLOSED behavior and preserves unknown evidence/split-recombine qualifications. Original REJECT is not relabeled.

The reviewer rebuilt twice from clean exact successor, reran validate.py/human-specimen.mjs, compared the projections and exercised the rendered correction independently. Operations/schemas/security projection stayed identical; only overview changed. Both builds had sourceDirty:false and identical bytes:

- index.html: **a98fe6605b79eae2e65c625a947087deb5d8a9da2a5f98f4122ed9da1a4fa6cb**
- LICENSES.txt: **d49296fc22d15683bf0608962baec5337440a9a93537d7bf135d4a87be3dd5b8**

Successor coverage remained36/32 operations,253/225 examples; Chromium traversed all32 and exercised native search/cURL/error/mobile, with zero page errors or unexpected requests. Independent rendered-text/screenshot inspection confirmed the correction. Unchanged renderer/dependency/license checks remain applicable. No remaining material findings within documentation scope. No backend deployment/live publication/Principal acceptance claim.

## Reproduction and limits

From the review worktree, pinned existing tools/caches were reused without changing author state:

```sh
tools/api-docs/.venv/bin/python scripts/v2-oas-conformance-test.py
tools/api-docs/.venv/bin/python tools/api-docs/build.py /tmp/ww-docs-successor-a
tools/api-docs/.venv/bin/python tools/api-docs/validate.py /tmp/ww-docs-successor-a
node tools/api-docs/human-specimen.mjs /tmp/ww-docs-successor-a
tools/api-docs/.venv/bin/python tools/api-docs/build.py /tmp/ww-docs-successor-b
cmp /tmp/ww-docs-successor-a/site/index.html /tmp/ww-docs-successor-b/site/index.html
cmp /tmp/ww-docs-successor-a/site/LICENSES.txt /tmp/ww-docs-successor-b/site/LICENSES.txt
```

Original review also ran operative-contract-test.py and npm audit. Reviewer evidence: `/tmp/ww-docs-review-clean-{a,b}`, `/tmp/ww-docs-successor-{a,b}` and corresponding temporary logs. Durable identities/verdicts above survive those temporary paths. The reviewer reported6,782 Redocly warnings including example-validator warnings; separate JSON Schema validation passes. Lint exit0 is not warning-free validation. No live financial/brokerage or complete backend domain audit was repeated. Future publication must still satisfy accepted identity, clean-source ancestry, successful workflow/deploy and actual live-byte/browser checks.


## Publication-path targeted review: ACCEPT3347f1e

The same separate reviewer independently ACCEPTED **3347f1ecb3636c72105411354c9c13f984b356a1** after inspecting the encoded-marker correction and actually building publication artifacts twice. Preview hash remainsa98fe6605b79eae2e65c625a947087deb5d8a9da2a5f98f4122ed9da1a4fa6cb. Exactly one JSON-encoded preview label becomes2026-10-22; all other HTML bytes are identical. Embedded publication specification equals the generated projection. Accepted source8dcee81203c91e10bdec94a6ed24e307a8729b54 is an ancestor; API contracts/assets/schemas/workflow are unchanged.

Clean provenance and repeated publication hashes: index **ce7ebc85d97a9903b78d26df5e08f88e16930ff56797c79b648b4458290ea0b0**; LICENSES **d49296fc22d15683bf0608962baec5337440a9a93537d7bf135d4a87be3dd5b8**. validate.py again passed36/32 operations,253/225 examples, wire/security and allowlist. human-specimen.mjs traversed32 operations/search/cURL/errors/mobile with zero errors/unexpected requests; independent visual inspection confirmed actual publication version0.6.0-foundational/date2026-10-22. Evidence: `/tmp/ww-docs-3347-preview`, `/tmp/ww-docs-3347-publication`, `/tmp/ww-docs-3347-publication-repeat` and logs. Earlier REJECT/contentACCEPT and lint/dependency caveats remain unchanged. No remote/runtime mutation or live-verification claim was made by the reviewer. This evidence-only successor record changes no public bytes.
