# PL-API-02 — Step 4 GitHub Pages publication evidence

**Current status:** Published and engineering-verified; Principal Product review pending. Initial/pending observations below are retained checkpoint history, superseded by the observed SUCCESS section.


**Principal authorization:** October 15, 2026 Step 4 directive explicitly authorizes Pages configuration, bounded workflow implementation, publication, live verification and commit/push. No backend/brokerage/operational change, v1 documentation, OAS download, End-of-Session Protocol amendment or PL-API-02 closure. Principal Product review precedes Step 5.

**Initial state:** Remotely verified main `9460f2707f3424946fcadffe54b6da1af4e10eb5`, clean shared workspace. Reused isolated worktree and protected unrelated worktrees. Independent ACCEPT of `6126afd`, correction `7b65499` and resolved BUG-042 are recovered from the [acceptance reconciliation](pl-api-02-independent-rereview-acceptance-2026-10-15.md). Gate Experiment remains staged/inactive.

## Eligibility and destination

Authenticated GitHub API confirms public repository `brooksbol/options-prototype`, default main, admin/push/maintain permission, Actions enabled, default workflow token read permission. No pre-existing Pages site (404, has_pages=false). Principal-authorized creation uses workflow publishing. Pages API returns public HTTPS URL **https://brooksbol.github.io/options-prototype/**, build_type workflow and https_enforced=true. Automatically created github-pages environment has custom branch policy allowing **main only**. No custom domain, repository visibility change, backend exposure or authenticated execution is introduced. GitHub's [custom Pages workflow documentation](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages) establishes public-repository eligibility and OIDC/Pages deployment permissions.

## Reused implementation and identity

`.github/workflows/api-v2-pages.yml` uses SHA-pinned official checkout/setup-node/setup-python/upload-pages-artifact/deploy-pages actions. Build runs on pinned Ubuntu 24.04, Node 24.18.0/npm11.16.0, Python 3.12.15, existing locked Redocly/Redoc/Playwright and pinned validation dependencies. Build has contents:read only; isolated deployment job has pages:write and id-token:write only. Pull requests validate without deployment. Main input changes and manual main dispatch validate, regenerate and publish. Concurrency serializes each ref. No custom server/frontend/search/agent framework or backend dependency.

Existing source/OAS/example validation and native file-browser checks run before upload. Deployment staging copies **only index.html and LICENSES.txt by explicit filename**; private bundles/specimens/provenance/screenshots remain outside the uploaded directory. Post-deployment CI checks exact live file hashes with bounded cache-propagation retry. Main-only environment policy and workflow condition restrict deployment. No long-lived secret is added.

`release.json` records independent accepted source, accepted preview/license/contract-input hashes and explicit publication date 2026-10-15 (Principal's local project date). The publication build requires those identities and accepted-source ancestry. Unaccepted main content fails closed until the recorded acceptance evidence is reconciled. Main itself does not establish Product acceptance. Future accepted changes update this same small record; generation/publication then run automatically. This is source/artifact identity enforcement, not a claim that CI independently ratifies Product semantics.

The accepted preview's "not published — local preview" label cannot be displayed as the publication date. The sole release HTML difference is replacement of its **three native copies** with 2026-10-15; a byte comparison confirms everything else identical. No OAS, domain content, schema/example/security/renderer asset is changed. Default builds remain previews; `--publish` gates the metadata-only candidate. Browser checks support the live entry point while permitting only exact document GETs and rejecting unintended requests.

| Artifact | SHA-256 |
| --- | --- |
| Independently accepted preview index.html | `eba04ae021122b6103ae19024190de9d0c60eb833f7da424271fe3183d9c09eb` |
| Publication index.html (date metadata only) | `3bb997c683e6f11a583651a2abaf2e1ac9889295656819997d1c34241831634f` |
| Unchanged LICENSES.txt | `56872a8c6112765251a061ad17fd179d42dae5c9eae53b28eab4ed187ea4f377` |

## Local author verification before deployment

Seven OAS conformance groups pass; 19 operations/134 examples and unchanged wire/security authority validate. Publication candidate passes desktop/mobile navigation/search, schemas/cURL/error examples, #5/#7/#9, public instruction/control suppression and zero page errors/unintended requests. Explicit byte comparison establishes metadata-only change. Workflow YAML parses. Negative identity specimen rejects an altered accepted-preview hash. No backend runtime/API test or operational call is required for these publication-only changes; prior independent runtime verification remains preserved.

## Deployment observation

Workflow deployment and live observations are pending at the implementation commit. Configuration/build success alone is not publication success. Append actual run/source/deployment identifiers, live file hashes, fresh browser/network results and any failure/recovery evidence after observation. Principal Product acceptance remains pending regardless of engineering deployment verification.

## Observed deployment and live verification — SUCCESS

The preceding pending observation describes the pre-push implementation checkpoint. Actual publication is now observed:

- Published source: **`3ae78b8bf6b2b6fa736c623e832c2156f077e733`**. Both workflow jobs succeeded in [Actions run 38832531141](https://github.com/brooksbol/options-prototype/actions/runs/38832531141), created 2026-10-16T00:58:29Z/completed 00:59:51Z (October 15 local project date). The clean committed local rebuild and Ubuntu/Python 3.12 CI artifact have identical release bytes.
- Pages deployment **7108171243**, environment github-pages, ref main, source 3ae78b8; latest deployment status **success**, environment URL **https://brooksbol.github.io/options-prototype/**. HTTPS/public/workflow source confirmed by Pages API. No custom domain.
- Downloaded GitHub artifact **12017393579**, name github-pages, platform archive digest `sha256:b624dcaf225725a8791a2116353635d58878bcc0d1513ec24c4dd15593dc0a59`. Independently listed its tar: only regular files `./index.html` and `./LICENSES.txt`, no links/private files. File hashes equal the publication table above and exact HTTPS response bytes. Archive digest is distinct from individual file hashes.
- Live public embedded specification is OpenAPI 3.1.1, version **0.5.0-contract**, **19 operations**. Rendered last publication is **2026-10-15**; the preview date remains provenance of the independently accepted preview. Only the three publication-label copies changed from accepted HTML; LICENSES is byte-identical.
- Fresh Chromium/Playwright live run passed all 19 operation IDs, native navigation/search, desktop 1440px/mobile 390px, schemas, synthetic cURL and visible 422 error samples, expanded opaque provenance, FORCE boundary and four CSV interpretations. Live screenshots were visually inspected. Public authentication/grant instructions, credential entry, live execution and OAS download offers are absent.
- Browser recorded exactly **two GETs to the supplied documentation entry point**, zero other HTTP/HTTPS requests and zero page errors. No backend service or brokerage/API execution is involved. Private live evidence: `/tmp/ww-pages-committed/private/live-specimen.json` and screenshots. Downloaded live files: `/tmp/ww-pages-live-index.html`, `/tmp/ww-pages-live-LICENSES.txt`; uploaded tar inspection: `/tmp/ww-pages-upload/artifact.tar`. These are not public artifact contents.
- Seven conformance groups, 19-operation/134-example validation, local and live browser checks, clean-source reproduction, negative acceptance-gate test and 58 Roadmap integrity/freshness checks pass. No failed workflow/deployment or unresolved publication failure was observed.

**Nonblocking COTS observation:** GitHub emits upstream Node 20 deprecation/forced-Node 24 annotations for the pinned deploy-pages and upload-pages-artifact's pinned upload-artifact dependency. Both succeeded under current runner compatibility. No custom workaround or unreviewed dependency upgrade was introduced. Native dark mode remains the previously accepted nonblocking limitation.

**Current state:** Step 4 engineering publication/verification is complete; public site available. Final documentation-only synchronization commit records this observation and does not replace the deployed source identity above. **Principal Product review is pending.** Step 5, End-of-Session Protocol amendment, issue 39/40/41 disposition and PL closure have not begun. No backend/runtime/operational source or service change. This is deployment-author verification, not a new independent review or Principal Product acceptance.
