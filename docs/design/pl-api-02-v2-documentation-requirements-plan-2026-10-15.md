# PL-API-02 — API v2 documentation: Principal requirements and Codex delivery plan

**Date:** 2026-10-15  
**Status:** Principal decisions recorded; Step 1 contracts corrected and author-verified; later steps are not delivered by this checkpoint. No independent approval or publication claimed.
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
