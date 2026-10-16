# PL-API-02 — API v2 documentation: Principal requirements and Codex delivery plan

**Date:** 2026-10-15  
**Status:** Step 4 published and engineering-verified at https://brooksbol.github.io/options-prototype/ (deployed source `3ae78b8`). Principal Product review pending; Step 5/protocol amendment and PL closure have not begun.
**Baseline reviewed by Codex:** `6ccd0a1ac8568faaad6467750666c8f3a194d9be`. Recheck current main before work.  
**Canonical intake:** `docs/parking-lot-10.md` → PL-API-02.  
**Authority:** `docs/design/api-documentation-github-pages-product-checkpoint-2026-10-15.md`, `docs/77-api-v2-architectural-guardrails.md`; Principal decisions in October 15 conversation.  
**Related defects:** GitHub issues #40, #41. **Deferred:** issue #39, now selected for implementation after documentation baseline is working.

## Product boundary

- **Only API v2 (`/v2`)** is in scope. Legacy `/api` v1, interim, and operational endpoints are expressly **out of scope** for this documentation product; do not make 31 legacy operations a publication dependency.
- Cover the 19 accepted v2 HTTP operations at the reviewed baseline, subject to re-inventory against current accepted main. REST resources, not `ww` CLI commands, determine coverage. CLI references are optional.
- Authoritative repository OAS is the contract; generated browsable documentation is derived. No backend documentation server/UI, documentation runtime dependency, or runtime changes.
- Redocly static rendering and GitHub Pages remain the selected direction. No API calls, authorization entry, credential prompts, “try it,” or other live API interactivity through the site.
- **Public site excludes authentication/authorization instructions and per-endpoint grant guidance**, as expressly directed by the Principal. **Internal authoritative OAS retains accurate security requirements**. Validate whether the selected renderer exposes security sections/extensions by default and suppress them in the public presentation without corrupting the OAS or hiding ordinary HTTP semantics. Flag a genuine tool conflict for Principal resolution.
- Include synthetic request, response, and error examples; copyable synthetic cURL commands (never executed by the site); HTTP error codes and schemas; relevant HTTP headers, caching and ETags; short getting-started guide; Wheelwright glossary; selective architecture/design links.
- Resource navigation and mobile-friendly layout. Search and dark mode if available natively without custom development.
- Display API version and last publication date; retain SHA in internal build provenance, **not visible in site UI**.
- Changelog automatically generated where practical; mark genuinely deprecated v2 operations and supply migration guidance for breaking changes. Do not invent deprecations or migration events.
- **No downloadable OAS link or offered download** in initial public UI; revisit later. An embedded specification required to render the site is not an advertised downloadable product and remains subject to disclosure review.

## Approved execution and publication

- Correct accepted v2 OAS fidelity defects **without changing backend behavior**. At minimum revalidate #40 (JSON artifact content types, API_POSITIONS/API_TRANSACTIONS, transaction-page import IDs), #41 (required upload headers), and response-specific error constraints, correlation/attachment headers, current selection prose and obsolete validation assertions.
- Build and validate an unpublished static Redocly preview using pinned reproducible tooling, focused synthetic conformance checks, and an independent v2 route/OAS coverage check.
- **Codex independently reviews** completed output before first publication. A favorable review plus passing security/validation checks authorizes automatic Pages publication; no separate per-release Principal approval required by the October 15 decision. Do not treat an unperformed review as approval.
- After initial publication, automatically rebuild/publish on accepted v2 OAS changes after CI validation. The end-of-session protocol must check documentation currency and trigger/verify publication as applicable.
- **Deployment failure does not block session closeout**: record the failure, leave publication status explicitly unresolved, and report it. Do not falsely claim synchronized docs.
- Amend ratified `docs/bootstrap/end-of-session-protocol.md` only after the documentation baseline and publication mechanism work; reconcile GitHub issue #39 at that point. This later protocol amendment is now Principal-selected, not a prerequisite to first preview.
- Security gate: exact output allowlist; synthetic-only content; no credentials, private financial data, source artifacts, live identifiers, or interactive API requests; reviewed renderer assets and site network behavior; restricted deployment permissions. Do not publish if these fail.

## Small Codex-focused project plan

**Step 1 — Correct contracts.** Bootstrap at current accepted main, protect unrelated work, inventory all implemented accepted `/v2` operations. Fix only OAS/docs discrepancies and focused validators/tests. Reproduce and disposition #40/#41 with evidence. No Java/controller/database/brokerage changes.

**Step 2 — Build joint human/agent preview.** Add minimal pinned Redocly build and validation tooling, resource navigation, synthetic examples, guide/glossary/links and conditional native search/dark mode. Generate static HTML locally. Confirm no public auth instructions or live interactivity; retain full security semantics in authoritative internal OAS.

**Step 3 — Independently falsify both audiences.** Separate Codex review of the exact generated human artifact and authoritative agent-consumed OAS/contracts, including read-only agent request/schema/semantic reconstruction: route coverage, OAS/runtime fidelity, security disclosure, render/navigation, offline/static behavior, and reproducibility. Correct bounded defects and repeat review if needed; no premature publication.

**Step 4 — Publish and automate.** On favorable independent review and green gates, configure restricted GitHub Pages deployment from the validated artifact. Validate live site. Add automatic regeneration/publication on accepted v2 OAS changes, with fail-closed publishing on validation/security failure.


### End-of-session documentation procedure — deferred precision requirement

**Principal direction:** Near the end of PL-API-02, after the static documentation build, publication and CI path are verified, write an **executable, unambiguous operating procedure** for how the End-of-Session Protocol checks and updates API v2 documentation. Do not amend the ratified protocol prematurely. The procedure must be independently adversarially vetted by Codex before adoption. This refines Step 5 and issue #39, not a new workstream.

**Acceptance criteria for the future procedure:**

1. State exact triggers and exclusions: which accepted OAS/contract/route changes require validation, regeneration and publication; how to determine a no-op; what to do when an API-relevant change is not yet accepted.
2. Name exact repository paths, required prerequisites, pinned tools, commands and working directories; specify input/source-of-truth files, generated output location, allowlist and artifact identities. Derive commands from the actually working implementation, never invent them now.
3. Define deterministic step order, explicit success/failure signals, expected outputs, CI/deployment checks, and how to verify that the live Pages site corresponds to the accepted artifact. Separate build validation, publication, and observation of publication.
4. Specify authorization and safety boundaries: no backend changes, no secrets or real financial examples, no interactive API execution, restricted workflow permissions, and preservation of unrelated/in-flight work.
5. Give precise failure and recovery branches, including stale docs, failed validation, failed deployment, unavailable hosting, ambiguous source/acceptance state, and retry/idempotency considerations. **Documentation deployment failure is nonblocking for session closeout**, but must be recorded and reported truthfully; no false success claim.
6. Specify durable evidence and final closeout reporting: source SHA, validation outcome, generated artifact identity/hash, deployment status, published version/date, outstanding defects, and next authorized action. Public UI need not display the SHA.
7. Codex must independently attack the instructions for ambiguity, missing preconditions, unbounded actions, contradictory permissions, and non-reproducible steps. Require a cold-start actor to execute a dry-run or safe simulation using only the written procedure, then reconcile findings before ratifying the amendment.

**Done means:** A fresh authorized actor can determine whether docs need updating and follow the complete verified path without guessing or asking the Principal to interpret routine steps. Preserve a clear no-op path and a nonblocking-but-reported failure path. Only then amend `docs/bootstrap/end-of-session-protocol.md` and reconcile issue #39 under existing governance.

**Step 5 — Closeout integration.** Amend end-of-session protocol with documentation freshness/publication check; failures are reported but nonblocking for session closeout. Reconcile issue #39 and report final SYNC and published status.


## COTS-first acceptance checks

Apply the existing RECOVER → REUSE → COMPOSE → EXTEND → INVENT mandate (`docs/mandates/product-first-continuous-engineering-2026-10-13.md`).

1. Reuse existing OpenAPI contracts, Redocly rendering, GitHub Pages/Actions and applicable validators. Document the specific capability gap before proposing any new abstraction.
2. Do not create a custom documentation app, server, API explorer, search engine, database or CI framework. No documentation runtime in the Java backend.
3. Use native Redocly navigation and responsive layout. Search and dark mode are conditional on native support; report gaps instead of writing substitutes.
4. Keep project-specific code limited to focused OAS fidelity, synthetic examples, route coverage, conformance, publication security and small build/deployment integration. Prefer existing test mechanisms.
5. Pin and lock tested dependencies. Check reproducibility, generated assets, external network behavior, licenses and dependency security.
6. Independent Codex review must falsify claims of reuse and challenge unnecessary custom infrastructure; implementation self-attestation is insufficient.
7. Retain the approved OpenAPI → Redocly → GitHub Pages stack unless a demonstrated material blocker warrants Principal escalation.

**Acceptance:** Predominantly standards, configuration, reused tools and documentation content, with only justified Wheelwright-specific integration. See also `docs/principles.md`, `docs/foundations/technology-quality-constitution-v1.md`, and `docs/technology-quality-fitness-controls-v1.md`.


## Agent usability goal and first validation

**Principal decision (October 15):** Human and agent usability are simultaneous, coequal acceptance goals for the initial API v2 documentation release. Build one authoritative OAS and linked semantic reference for both audiences; Redocly HTML is the human projection, and repository-owned OAS/contracts are the agent projection. Neither audience is deferred. The first substantial downstream integration test will be agent-assisted migration of the existing Wheelwright web client to API v2. This is a **future validation use case, not authorization to migrate the web client within PL-API-02**.

- **AGENT-01 (MUST):** An agent can discover all accepted v2 operations, stable operation IDs, parameters, request/response/error schemas, and relevant HTTP semantics from repository-owned OAS without scraping generated HTML.
- **AGENT-02 (MUST):** OAS descriptions and linked authoritative contracts preserve capability meaning, evidence provenance, freshness/completeness limits, and acquisition-versus-read distinctions; an agent must not infer business authority or execution permission from the presence of an operation.
- **AGENT-03 (MUST):** The agent-facing authoritative OAS retains accurate security and grant semantics even though the public human-facing site omits authentication/authorization instructions and has no interactive API calls.
- **AGENT-04 (MUST, initial release gate):** Independent Codex review exercises a bounded read-only agent-consumption specimen: locate representative v2 operations, reconstruct their valid request and response/error shapes, and identify governing semantic constraints without CLI or rendered-site dependence.
- **AGENT-05 (FUTURE ACCEPTANCE):** During a separately authorized web-client-to-v2 migration, test whether an agent can plan and implement client integration from OAS and governing contracts without inventing endpoints, duplicating backend business logic, or treating web-client state as authoritative. Record documentation gaps discovered then as feedback into PL-API-02.

**AGENT-06 (PRINCIPAL-SELECTED TEST CLIENT):** Kiro is the designated independent agent-consumption test client for the initial documentation release. Codex implements the documentation and conducts a separate adversarial review; Kiro tests the agent-facing OAS and linked authoritative contracts from a fresh context. Kiro must discover accepted v2 operations, recover request/response/error and domain semantics, construct synthetic requests, identify authorization/execution boundaries, and report missing or ambiguous documentation. **Kiro must not compensate for gaps by reverse-engineering backend implementation or relying on previous conversational knowledge.** The test is read-only: no live broker access, API mutations, web-client changes, or execution grants. Preserve Kiro's findings for Principal assessment and later web-client-to-v2 migration; the migration itself remains separately authorized.


### Kiro black-box acceptance rule

Principal decision: Kiro must test API documentation as an external consumer, using only the supplied public documentation surface. This stricter test supersedes earlier AGENT-06 wording allowing internal OAS and linked contracts as Kiro's test inputs.

- Start Kiro in a fresh context with only the test instructions and documentation entry point.
- Do not search repository code, internal documents, design records, tests, or source OAS outside the documentation supplied to external consumers. Do not use prior Wheelwright conversational knowledge.
- Do not probe live APIs, execute operations, or access brokerages.
- Discover endpoints, explain semantics and errors, and compose synthetic requests using documentation alone.
- If information is absent or ambiguous, report a documentation usability failure; do not reconstruct it from implementation or other sources.
- Preserve test inputs, observed results, gaps and independent review. Codex may compare Kiro's results with authoritative internal contracts only after the isolated test.
- This does not replace separate OAS conformance verification or authorize web-client migration.

**Scope guardrail:** No MCP server, custom agent tool registry, web-client migration, or agent execution framework is part of this documentation workstream. The same authoritative OAS serves human rendering and agent understanding.

## Completion criteria

A human can browse all accepted v2 REST methods, and an independent agent can recover those operations and governing semantics directly from OAS/contracts, without scraping HTML. A reader can browse all accepted v2 REST methods and truthful schemas/errors/examples without Wheelwright running, without credentials, and without the documentation sending API requests. Source and publication are reproducible and traceable internally. First publication is independently approved by Codex and passes release gates. Legacy v1 remains out of scope. No unrelated work is modified.

## Reference artifacts

- `docs/contracts/api-v2-direct-quote-acquisition-proposal.yaml`
- `docs/contracts/api-v2-account-evidence.json`
- `docs/contracts/api-v2-market-evidence-subjects.json`
- `docs/contracts/evidence-snapshot-v1.md` (legacy authority, **not** a documentation deliverable)
- `docs/75-pl-api-02-http-boundary-classification-2026-10-05.md` (investigation evidence)
- `docs/design/ww-history-approved-checkpoint-2026-10-15.md`
- GitHub issues #39, #40, #41.

## Step 1 — contract corrections and author verification

**Date:** October 15, 2026. Implemented against remotely verified `891465878434f8eadb13a23ea68d554b97385e95` in an isolated worktree. This is bounded implementation/author evidence, not an independent review or permission to skip Step 3. Backend source, Java tests, runtime behavior, migrations, operational data/grants/services and unrelated work remain unchanged. No Redocly, preview, CI workflow, Pages or End-of-Session Protocol work is included.

### Revalidated discrepancies

- **#40 confirmed, corrected in OAS:** actual synthetic HTTP metadata for accepted tastytrade holdings failed the original `text/csv` constraint and missing `API_POSITIONS` enum. Transaction-history page metadata additionally failed missing `API_TRANSACTIONS` and UUID-only `importId`; the runtime uses `<attempt UUID>-<zero-based page offset>`. Artifact detail/inventory now admit both retained media types and actual attempt forms. Upload type restrictions remain the four supported CSV interpretations; backend source types do not become upload types.
- **#41 confirmed, corrected in OAS:** the old documented CSV/Account-only request, and requests omitting each header separately, return 422 without retention. OAS now requires filename-bearing `Content-Disposition` and `X-Brokerage-File-Type`, documents decoded filename restrictions and provides a coherent synthetic activity example. Invalid names and API-only types remain rejected.
- Error response schemas bind each HTTP response to the actual status/code/type/title grammar and require nonempty validation details for 422. Negative specimens reject cross-status and internally mixed Problems. No runtime error behavior changed.
- Optional correlation headers accurately allow omitted/blank generation and trimmed UUIDs; the selection header is now specified. Artifact content formally requires `Content-Disposition: attachment`. Selection prose includes supported same-day broker-evidenced adjusted identities and qualified fixed-income exclusion.
- The obsolete two-path assertion and whole-common-contract equality assumptions are replaced by current local-reference resolution and targeted preservation checks. Quote success bodies, acquisition input body, held reads, security and grant behavior remain unchanged. Only intended error/correlation documentation corrections differ.

GitHub #40/#41 were read and reproduced; their confirmed contract discrepancies are corrected by this delivery. The GitHub issues themselves remain open and unmodified. No new defect registry, issue comment or closure is introduced. Issue #39 remains deferred to the selected later step.

### Verification and reproduction

Use an engineer-local Python environment containing PyYAML, jsonschema, referencing and openapi-spec-validator; no backend dependency was introduced.

```sh
python scripts/v2-oas-conformance-test.py
cd evidence-service-java
./gradlew --offline test --tests 'com.wheelwright.evidence.v2.*'
cd ..
python scripts/ww-show-oas-validation.py
python scripts/ww-ls-oas-validation.py
```

- Seven focused synthetic test groups pass, including negative media/type/identity/header/Problem/correlation cases. All three OAS documents and local references validate. Independent production-controller inventory matches all **19 operations / 17 paths** with unique operation IDs; legacy mappings are excluded by the approved boundary, not used as a publication dependency.
- Existing v2 backend suite: **176 tests, 175 passed, one optional private-reference skip**, zero failures/errors. Held-detail validator: **25 actual specimens**, all seven statuses and codec cases. Held-discovery validator: **62 actual specimens**, all six statuses and complete ordered empty/nonempty results.
- Existing `integratedUpdateFixture` plus `scripts/v2-oas-http-validation.py`: **37 actual synthetic HTTP specimens** pass, covering missing/invalid upload headers, successful admission, no retention on invalid upload, exact CSV content/attachment, JSON Artifact metadata/detail/inventory from actual holdings/history acquisition, Account history list/detail/errors, correlation and response headers. Transaction originals remain fail-closed. Original OAS was independently applied to those actual JSON metadata bodies and rejected the confirmed fields.
- Repaired history and selection validators pass the extracted eight history and six selection HTTP specimens with actual headers. These reuse the same HTTP run, not extra independent specimens.
- Scope-preserving parking-lot/journal/index reconciliation is included. The derived Roadmap was regenerated; freshness and all **58 integrity/freshness tests** pass. `git diff --check` passes. No new Product/architecture decision, horizon or workstream is created by this closeout.

To reproduce the HTTP check, create a fresh temporary directory, start `./gradlew --offline integratedUpdateFixture -PfixtureReady=ABSOLUTE_TEMP_DIRECTORY/ready.json`, then run `python scripts/v2-oas-http-validation.py ABSOLUTE_TEMP_DIRECTORY/ready.json ABSOLUTE_TEMP_DIRECTORY/http-samples.json` from repository root. Stop the fixture afterward. It uses only disposable SQLite and loopback synthetic providers; no Downloads writes or operational configuration. To exercise JSON metadata, the harness temporarily sets and restores one existing **fixture-only** Artifact-read grant after verifying the fixture User identity; no operational grants or schema are touched. Outputs remain local synthetic test evidence, not publication content.

The shared local resolver is `scripts/v2_oas.py`. Existing validators duplicated fragment resolution, assumed frozen whole-entry equality and lacked relational header checks. The bounded gap is common handling of this repository's three local OAS documents and HTTP specimens. The helper composes existing PyYAML, referencing, jsonschema and openapi-spec-validator; it is not a new schema engine or CI framework. It rejects references outside the three declared local contracts, verifies body schemas and documented headers, and checks header/body correlation. Structural OAS validity alone remains insufficient. Resource navigation, renderer/public filtering, publication security, CI and independently reviewed generated output belong to Steps 2–4.

Pre-push synchronization recovered documentation-only remote advancement `f6681c392c248b64e90d97721ca5a3c0128df6ac` adding COTS-first acceptance checks. That addition is preserved; it does not change the reviewed backend or OAS baseline. The implementation uses the focused project-specific conformance/coverage integration allowed by those checks.


## Step 2 — joint human and agent documentation delivery

**October 15, 2026; author evidence, independent acceptance pending.** Remote main was verified at `450106a2849f6c11eb3220a1c6f20bfc46764be5`; completed Step 1 `3ee1a5ce3c8141e3d72e8f5dea21d0fb3624f04d` is its ancestor. No accepted work was repeated. Remote decisions `0d11646` and `65bbd48` were recovered before delivery: Kiro's isolated public-only black-box test supersedes its earlier internal-contract input permission. Implementation candidate **`4b049f22b4294f4efae42069f3c20d7fd517f056`** contains the bounded source/tooling changes; this following documentation commit records delivery evidence. Both remain distinct from independent approval.

### Delivered boundary and reuse

- [Repository agent entry](../api-v2/README.md) links the authoritative common/account/market OAS and existing Product/domain contracts. All **19 accepted v2 operations / 17 paths**, stable operation IDs, request/response/error/header/security constraints and acquisition-versus-held-evidence semantics are preserved. **134 synthetic request/response/error examples** plus parameter examples and copyable cURL samples are validated without executing API calls.
- [Pinned tooling and reproduction](../../tools/api-docs/README.md) composes Redocly CLI **2.64.0**, Redoc **2.5.4**, Playwright **1.56.1**, Node **24.18.0**, npm **11.16.0** and pinned Python validation dependencies. No custom frontend, search, agent framework, tool registry, backend runtime or publication infrastructure is added.
- The public reference derives from the same OAS. Security/grant instructions are suppressed only in its temporary projection; authoritative internal security remains intact. Ordinary 401/403 errors and HTTP headers remain. Public output has exactly **index.html and LICENSES.txt**; internal bundles, projections, provenance and test reports remain private. No downloadable OAS offer, credential entry or live API execution exists.
- Offline packaging embeds the verified pinned COTS script and native logo and disables remote fonts. Native `Redoc.init` avoids the CLI prerender/hydration errors observed on this graph. Native navigation, search, schemas, examples and responsive layout are reused. Eight pre-existing YAML flow-map description commas were quoted after structural lint exposed stray null annotation keys; focused wire/security preservation checks exclude only those exact historical prose fragments.
- Native dark mode is unavailable in pinned Redoc. **Principal clarification: dark mode is not important; this is a nonblocking COTS limitation**, with no substitute commissioned. Deterministic cross-file response component renaming is verified after bundling. The one disabled lint rule is a false positive on the existing legitimate `not: {required: [failure]}` pattern; structural/example validation remains enabled.

### Author verification and frozen specimen

Two builds from clean committed candidate `4b049f2`, with a fresh locked `npm ci --ignore-scripts` between them, produced byte-identical public files:

| Public file | SHA-256 |
|---|---|
| index.html | `357dc6f4f30a14d31ab83ee0e17ce7d0736d2692fab50333c6daf5d9b534cdb7` |
| LICENSES.txt | `56872a8c6112765251a061ad17fd179d42dae5c9eae53b28eab4ed187ea4f377` |

- Step 1's seven focused synthetic groups pass. Source controller/OAS coverage, local references, all examples, stable IDs and unchanged wire/security constraints pass. No backend behavior was changed or backend test suite result newly claimed by Step 2.
- Read-only author agent reconstruction passes for all 19 operations: request/response/errors/headers, security, linked domain semantics, provenance/completeness and acquisition-versus-held-read distinctions. OAS availability is explicitly separated from permission to execute. `dist/private/agent-specimen.json` is verification evidence, not another agent contract format or independent acceptance.
- Chromium opens the actual **file://** reference with HTTP/HTTPS blocked: all operations discoverable, native search, schemas, copyable cURL and visible 422 error example pass. Desktop 1440px and mobile 390px layout/navigation pass; screenshots visually inspected. **Zero page errors, zero HTTP/HTTPS requests**, no backend required, no authentication instructions or interactive execution controls.
- Documentation index, canonical intake and journal are reconciled; derived Roadmap regeneration/freshness and all 58 integrity/freshness tests pass. `git diff --check` passes.
- Locked npm dependency audit reports zero advisories. Bundled third-party CLI code is not claimed exhaustively audited by npm; notices are retained. Source inputs, versions, source SHA/dirty state and artifact hashes are recorded privately in `dist/private/provenance.json`.

Default local preview: **`tools/api-docs/dist/site/index.html`**. Build, validation and browser reproduction commands are in the tooling README. Generated output is ignored by Git, reproducible from committed sources and remains unpublished. Final synchronization SHA is reported at handoff; private provenance can record that final documentation commit without changing the frozen public bytes.

### Exact independent Step 3 handoff

1. Give fresh-context Kiro **only** `tools/api-docs/kiro-public-test-instructions.txt` and the frozen public `index.html` entry point. Do not provide this plan, internal OAS/contracts/source/tests, author reports, expected operation counts/answers or earlier conversation. Kiro discovers operations, composes written synthetic requests and reports gaps from the supplied public documentation alone; no network/API probing or execution. Preserve results unchanged, including missing authorization guidance required to be absent publicly.
2. A fresh independent Codex reviewer separately verifies the committed OAS/linked contracts, clean reproduction, frozen hashes, human specimen and COTS/security claims. Only after Kiro's isolated test may Codex compare its results with internal authority. Author reconstruction is not a substitute for either independent exercise.
3. Assess both consumption methods before any publication. This delivery makes no independent approval claim and starts no Step 3 review, Pages configuration, CI publication, web-client migration, operational change, issue closure or End-of-Session Protocol amendment.

**Remaining state:** Kiro black-box and independent Codex acceptance are pending. Existing later publication gates remain in force. No Principal decision is required to hand off this Step 2 specimen; dark mode is explicitly nonblocking.


## Accepted Kiro triage — corrections before independent release review

October 15 Principal accepted the full ten-finding triage. Kiro's successful public-only usability exercise and Codex's author/browser comparison are distinct evidence, neither final release approval. [Canonical correction/disposition evidence](../reviews/pl-api-02-kiro-triage-2026-10-15.md) records the unchanged standalone report's identity, all ten findings, source authority, corrections and exact independent handoff.

Only #5 (opaque authorityEpoch meaning), #7 (FORCE bypasses reuse without overriding contact restrictions) and #9 (supported Fidelity CSV formats/columns/processing rejection) are selected for bounded correction. Other seven findings are nonblocking; optional clarifications do not expand this delivery. Backend behavior, wire/security constraints, operational state, Pages/CI/publication, End-of-Session Protocol and issue disposition remain unchanged. Publication remains on hold until the separate independent release review passes. Codex author verification is not that review.


## Independent release REJECT — IRR-01 / BUG-042

October 15 Principal supplied the independent verdict: coverage 19/19, human documentation, Kiro usability, #5/#7/#9, reproducibility, inspected-artifact security and COTS compliance pass; runtime/OAS fidelity fails on the non-Fidelity Portfolio Capital 422 branch. These are reviewer results as supplied by the Principal, not a new author certification. [BUG-042](../bugs/BUG-042-portfolio-capital-422-missing-validation-details.md) is the single durable defect identity; IRR-01 remains review provenance. Registering it does not authorize backend correction. The directive explicitly leaves that decision pending; the proposed one-branch correction/test is recorded without implementing it. Preserve the unchanged OAS convention and require a fresh immutable candidate and separate independent verification after authorized remediation. No publication.


## BUG-042 Decision A approved — bounded correction candidate

Principal explicitly approved remediation of only the Portfolio Capital non-Fidelity 422 validation-details discrepancy, focused regression, actual response/OAS validation, applicable tests and commit/push. [BUG-042](../bugs/BUG-042-portfolio-capital-422-missing-validation-details.md) records red-before-fix proof, one-branch correction, 177 backend tests (176 passed/one optional skip), seven conformance groups and 38 actual synthetic HTTP specimens passing unchanged OAS. No unrelated backend changes, OAS weakening or publication. The independent REJECT remains until a separate reviewer verifies this new candidate; the bug remains Open. Earlier pending-authorization statements describe the preserved historical state and are superseded only by this explicit Decision A grant.


## Independent re-review ACCEPT — BUG-042 resolved

Principal supplied the independent ACCEPT of `6126afddc6c0e95d2fb496e31e4e86d28320577d`. [Durable reconciliation](../reviews/pl-api-02-independent-rereview-acceptance-2026-10-15.md) preserves original/corrected reproductions, exact evidence/artifact identities and all passed verification areas. BUG-042 is Resolved on that separate review. The previously rejected runtime/OAS gate is satisfied, with no remaining material findings. Earlier REJECT/Open/pending statements remain historical evidence, superseded for current state by this record. This establishes independent readiness, not publication. No Pages/workflow/deployment/protocol or issue 39/40/41 action is included; existing later gates remain in force.


## Step 4 authorization and implementation

Principal explicitly authorized GitHub Pages configuration/publication, minimal Actions workflow, automatic publication for accepted inputs, live verification and bounded commit/push. [Publication evidence](../reviews/pl-api-02-pages-publication-2026-10-15.md) records eligibility/admin permission, destination/branch restriction, restricted permissions, identity gate, exact public allowlist and metadata-only publication-date transformation. Backend/OAS/content/security remain unchanged. Deployment/live results must be observed before success; Principal Product review precedes Step 5. No protocol amendment or PL closure.


## Step 4 observed publication — Principal Product review next

[Successful deployment evidence](../reviews/pl-api-02-pages-publication-2026-10-15.md#observed-deployment-and-live-verification--success) records source `3ae78b8bf6b2b6fa736c623e832c2156f077e733`, Actions run 38832531141, deployment 7108171243 and verified public artifact/HTTPS hashes. Live **https://brooksbol.github.io/options-prototype/** shows version 0.5.0-contract/publication date 2026-10-15 and all 19 operations. Native navigation/search/mobile/examples/schema/error checks pass; zero unexpected requests/page errors. Exact two-file artifact and metadata-only difference from accepted preview verified. No publication failure. Principal reviews the actual site before Step 5; no Product acceptance or PL closure is inferred. Protocol and issue 39/40/41 remain untouched.

## Principal Product review — deferred Portfolio resource-model concern (October 15)

**Disposition: PARKED / NONBLOCKING.** During review of the published v2 reference, the Principal questioned whether `GET /v2/portfolio-capital-observations?accountId=...` expresses the correct domain resource. This is **not** a request to remove Account filtering or to change the accepted Portfolio Capital calculation. The concern is that the resource identity is narrower and more Account-centric than the desired User-scoped domain model.

**Candidate for later Product/domain reconciliation, not an approved API change:** `GET /v2/portfolio` for the authenticated User's portfolio and `GET /v2/positions` for the User's positions, with Account filtering/selection retained where appropriate. In the Principal's framing, **Portfolio + Positions = Console**. Revisit resource ownership, identity, scope, filters, and the relationship between Portfolio Capital observations and the broader Portfolio representation when planning the v2 Web Console migration. Do not assume the candidate is complete or prescribe a schema now.

**Boundary:** Leave current endpoint, OAS, clients, grants, and documentation unchanged during PL-API-02 acceptance. Do not block Product acceptance or Step 5 on this issue. Reconcile later with existing `PL-PORT-01` / `PL-PROD-VALUE` and Doc 77's domain-first REST guardrails; no new workstream or implementation authorization arises from this note.

## Principal live-site review reconciliation — October 15

Principal completed first live-site walkthrough. **Product acceptance remains pending** bounded public-documentation cleanup and reinspection. [Full review ledger](../reviews/pl-api-02-principal-live-site-review-2026-10-15.md) preserves near-term UX/public-projection decisions and deferred REST/domain-model observations. Preserve all Artifact public documentation unchanged in this release; deferred Portfolio/Evidence/Audit/Artifact model exploration must not block acceptance. The near-term candidate removes two administrative User discovery operations, holdings acquisition, and market-evidence subject selection from the public projection only (expected 15 public operations, 19 internal), improves native oneOf labels if supported, and optionally improves Portfolio Capital prose. Preserve `/v2/me`. Codex must validate actual renderer and projection behavior, report blockers rather than expand scope, and return the revised live site for Principal Product acceptance. No Step 5 protocol amendment yet.
