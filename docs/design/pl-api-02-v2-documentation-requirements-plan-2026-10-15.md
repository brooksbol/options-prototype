# PL-API-02 — API v2 documentation: Principal requirements and Codex delivery plan

**Date:** 2026-10-15  
**Status:** Principal decisions recorded; bounded implementation authorized; no claim of implementation, independent approval, or publication.  
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

**Step 2 — Build preview.** Add minimal pinned Redocly build and validation tooling, resource navigation, synthetic examples, guide/glossary/links and conditional native search/dark mode. Generate static HTML locally. Confirm no public auth instructions or live interactivity; retain full security semantics in authoritative internal OAS.

**Step 3 — Independently falsify.** Separate Codex review of exact generated artifact: route coverage, OAS/runtime fidelity, security disclosure, render/navigation, offline/static behavior, and reproducibility. Correct bounded defects and repeat review if needed; no premature publication.

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

## Completion criteria

A reader can browse all accepted v2 REST methods and truthful schemas/errors/examples without Wheelwright running, without credentials, and without the documentation sending API requests. Source and publication are reproducible and traceable internally. First publication is independently approved by Codex and passes release gates. Legacy v1 remains out of scope. No unrelated work is modified.

## Reference artifacts

- `docs/contracts/api-v2-direct-quote-acquisition-proposal.yaml`
- `docs/contracts/api-v2-account-evidence.json`
- `docs/contracts/api-v2-market-evidence-subjects.json`
- `docs/contracts/evidence-snapshot-v1.md` (legacy authority, **not** a documentation deliverable)
- `docs/75-pl-api-02-http-boundary-classification-2026-10-05.md` (investigation evidence)
- `docs/design/ww-history-approved-checkpoint-2026-10-15.md`
- GitHub issues #39, #40, #41.
