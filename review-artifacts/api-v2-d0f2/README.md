# API v2 independent review handoff

**NON-RELEASE REVIEW ONLY — NOT ACCEPTED — NOT PUBLISHED.** Frozen PR45 candidate `d0f2f10699e811ef9286c843f9896a39336d8afc`; PR remains draft. This branch does not authorize merge, public API-reference publication or permanent installation.

Download `public-review.zip`, extract it and open `site/index.html` in a browser. The HTML is self-contained; `LICENSES.txt` is included. GitHub raw HTML downloads as source; GitHub does not host this branch as a live rendered site.

For structural review, use `openapi-public.json`:35 public operations, bundled with local component references (cycles preserved). For all39 operations, accurate security/permission/error behavior and full schemas, use all four existing canonical source links in `frozen-source-links.json`; start at the YAML entry. There is intentionally no newly redistributed internal bundle. This implements the Principal's explicit choice to use existing frozen source links plus a public-only bundle, with no private repository.

`operation-inventory.json` indexes all39 internal operations and identifies the35 public entries. The four exclusions are preserved. `CHANGE-REPORT.md` identifies baseline, changes, compatibility and known semantic acceptance blockers. `manifest.json` records exact source, file hashes, build and validation evidence.

Independent reviewer: examine resources/relationships, requests/responses, source/event/receipt clocks, acquisition versus retained reads, permissions/errors, selectors/pagination and compatibility. The public projection intentionally omits internal security instructions; it is not sufficient alone for those questions. Passing build validation is not Product/architecture acceptance.

Connector retrieval: if a large file returns empty through github_fetch_file, use its git blob SHA with github_fetch_blob. Verify content length and hash; an empty successful transport response is not retrieval proof. No localhost access is needed.
