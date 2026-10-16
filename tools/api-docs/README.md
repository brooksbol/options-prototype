# Wheelwright static API reference — preview and GitHub Pages publication

One authoritative API contract serves two audiences. Agents enter through [repository OAS and linked contracts](../../docs/api-v2/README.md). Humans open the generated static Redoc reference. Generated output is derived, ignored by Git and not an alternative contract authority.

## Reproduce

Use the Node/npm versions pinned by `package.json` and `.node-version`. Python verification composes the existing Step 1 validators with the transitive versions pinned in `requirements.txt` (author run: CPython 3.9.6 on macOS arm64; provenance records the actual interpreter). From repository root:

```sh
python3 -m venv tools/api-docs/.venv
tools/api-docs/.venv/bin/python -m pip install -r tools/api-docs/requirements.txt
npm ci --prefix tools/api-docs --ignore-scripts
tools/api-docs/node_modules/.bin/playwright install chromium
tools/api-docs/.venv/bin/python scripts/v2-oas-conformance-test.py
tools/api-docs/.venv/bin/python tools/api-docs/build.py
tools/api-docs/.venv/bin/python tools/api-docs/validate.py
node tools/api-docs/human-specimen.mjs
```

Open **`tools/api-docs/dist/site/index.html`** directly. No server, credentials, backend configuration or service is needed. An optional output-directory argument to each specimen/build command supports two-build comparison. Review publication packaging against the exact allowlist: **index.html and LICENSES.txt only**. Private bundles, examples/reconstruction evidence, screenshots and provenance live under `dist/private`, never the public directory.

## Reuse and bounded integration

Redocly CLI 2.64.0 bundles the existing cross-file OAS and renders Redoc 2.5.4. Redoc supplies navigation, schemas, example tabs, copy buttons, search and responsive layout. Playwright 1.56.1/Chromium supplies browser verification. No custom frontend, search, database, server, API explorer, agent framework or deployment workflow is created.

The specific packaging gaps are public instruction suppression and offline assets. `build.py` derives a public projection by removing standard security nodes/grant extensions and internal-only instruction blocks, filtering remaining instructional prose, and retaining all operations, schemas, errors and HTTP headers. The authoritative OAS keeps full security semantics. No separately authored public/agent specification exists; the temporary projection is not offered for download.

The CLI's default script is fetched from a CDN and its native footer logo also requests a CDN asset. Packaging verifies the exact renderer SRI against the locked npm Redoc bundle, embeds that COTS script and the checked-in native logo, and disables Google fonts. The small SVG is vendored from `https://cdn.redoc.ly/redoc/logo-mini.svg`, under Redoc's MIT distribution; build provenance hashes it and LICENSES.txt preserves notices. No image script, event handler or external asset reference is permitted.

The pinned CLI prerender/hydrate pair emitted React hydration errors on this complex graph. Packaging invokes the documented native `Redoc.init` with the same embedded specification and typed configuration instead. Rendering/search remain entirely COTS; no replacement component is implemented. Browser checks require zero page errors and block HTTP before exercising the UI.

## COTS limits and validation

- Native search and responsive layout are verified. **Native dark mode is unavailable** in the pinned Redoc 2.5.4 renderer; no replacement is built. The Principal clarified that dark mode is not important, so this is nonblocking. The CLI advertises a future Redoc 3 transition, so upgrades require a fresh specimen.
- Redocly deterministically renames colliding cross-file response components, such as Problem401-2; operation IDs, resolved schemas and semantics are preserved and validated.
- The `no-required-schema-properties-undefined` lint rule is disabled for the legitimate `not: {required: [failure]}` JSON Schema pattern. Structural lint and source/example conformance remain enabled. No broad lint ignore file is used.
- Rendering exposed eight old unquoted flow-map description commas. Those prose-only YAML errors are quoted; no wire constraints change. The wire comparison recognizes only the exact historical null prose fragments.
- `npm audit` reports on the lockfile package graph; the CLI also contains bundled dependencies with notices. This is not a claim that npm audit exhaustively audits bundled third-party code. No backend/runtime dependency is added.

`validate.py` verifies source route coverage, stable IDs, 134 examples, links, unchanged wire/security constraints and the public boundary. [The agent specimen](agent-specimen.md) records read-only semantic reconstruction. `human-specimen.mjs` opens the file directly, exercises search/cURL/error tabs and mobile layout, and records screenshots, page errors and network requests. Ordinary HTTP 401/403 error identities and WWW-Authenticate header values remain visible; instructions, credential entry and grant guidance do not.

## Step 3 handoff

Review the exact committed candidate, `dist/private/provenance.json` and the hashed two-file public artifact. Rebuild from the lockfile into a second output directory and compare HTML/license hashes. Repeat the read-only agent exercise from authoritative repository OAS and linked contracts; independently inspect desktop/mobile UI, examples, security suppression, static-file behavior and blocked network evidence. Challenge the minimal packaging and COTS claims.

The subsequent Principal decision designates **Kiro's separate fresh-context black-box test**. Supply only test instructions and the public static documentation entry point. Withhold this internal README, the author answer table, private reports, internal source/OAS/contracts and prior conversation. No API probing is allowed. Preserve Kiro's discoveries, synthetic requests and gaps unchanged, then let the separate Codex reviewer compare with internal authority. Kiro completed that test on October 15; its original standalone report is preserved unchanged. The accepted ten-finding triage and three bounded corrections are recorded in `docs/reviews/pl-api-02-kiro-triage-2026-10-15.md`. Final independent release review remains pending.

This is Step 2 author evidence only. Independent approval is pending. Do not configure Pages, publish, amend the End-of-Session Protocol, close #39/#40/#41, or migrate the web client as part of this handoff.


## Step 4 — authorized publication

Principal authorized Step 4 after independent ACCEPT of `6126afd`. `.github/workflows/api-v2-pages.yml` validates pull requests and publishes accepted main-branch documentation changes; manual dispatch is restricted to main for deployment. Earlier Step 2/3 publication holds above describe their historical phase. Step 5 and Principal Product review remain separate.

Generate a publication candidate locally with `tools/api-docs/.venv/bin/python tools/api-docs/build.py --publish`, then run the existing validation/browser commands. Default builds remain unpublished previews. `release.json` records the independent accepted source, preview/license hashes, accepted contract-input hashes and explicit publication date. Publishing verifies the preview first, then replaces only the three native copies of "not published — local preview" with that date. API/schema/example/security content is unchanged. Public release HTML therefore has a new recorded hash; the accepted preview hash remains the baseline. The build never claims deployment success.

For a future accepted documentation change, reproduce and review the preview/linked contracts, then update `acceptedSource`, accepted preview/license/input hashes and publication date in `release.json` from that evidence. Main alone does not prove Product acceptance. CI automatically regenerates and publishes when the acceptance record matches; otherwise it fails closed. These records are review evidence, not a new Product approval ceremony or independently enforced authority system.

CI uses pinned Node/npm, CPython 3.12.15 on Ubuntu 24.04 and SHA-pinned GitHub actions. Its build job has contents:read; only the deploy job receives pages:write and id-token:write. Pull requests cannot deploy. A main-only github-pages environment policy limits deployments. The public artifact is staged by explicit filename; no private evidence is uploaded. CI verifies the live index/license hashes after deployment. No backend service is started or changed by publication.

To exercise the same browser checks against the live destination, run `node tools/api-docs/human-specimen.mjs tools/api-docs/dist https://brooksbol.github.io/options-prototype/` after generating/validating the candidate. Only exact GETs for that entry point are permitted; other HTTP requests fail the specimen. Live results go to private `live-specimen.json`. This is author/deployment evidence, not Principal Product acceptance. Native dark mode remains nonblocking.
