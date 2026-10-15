# API documentation — GitHub Pages publication checkpoint

**Date:** October 15, 2026  
**Status:** Principal-approved Product direction; publication implementation deferred and separately authorized.  
**Canonical intake:** `PL-API-02` in `docs/parking-lot-10.md`. This is not a new PL or a change to the API runtime.  
**Fresh-thread entry point:** This document, then `docs/AGENTS.md`, `docs/README.md`, `docs/77-api-v2-architectural-guardrails.md`, `docs/75-pl-api-02-http-boundary-classification-2026-10-05.md`, and the task-relevant `PL-API-02` section of `docs/parking-lot-10.md`.

## Principal decision

**APPROVED: Option B — repository-generated, browsable static API documentation via GitHub Pages, with Redocly preferred as renderer.**

- Wheelwright's authoritative, version-controlled **OpenAPI Specification (OAS)** is the source for the reference; generated HTML is derived, reproducible output, not a second contract authority.
- Publish a navigable, read-only API reference from GitHub, linked from the repository README. GitHub Pages is the preferred hosting surface; GitHub's ordinary Markdown/YAML browser remains available.
- **Do not** embed a documentation UI, live Swagger/Redoc server, or documentation-specific runtime dependency in the Wheelwright Java backend.
- **Do not** expose interactive authenticated brokerage execution through documentation. No secrets, live account data, sensitive identifiers or private financial fixtures in published examples.
- Prefer a small initial reference with navigation, endpoint/schema views and relevant Markdown guides, not a new documentation platform.
- Validate OAS fidelity and generated-reference freshness in CI; only accepted and accurately specified routes should appear as authoritative.
- GitHub Pages visibility and repository/publication eligibility must be verified before enabling publication. Ordinary Pages hosting may make content public even when repository access is restricted; no assumption of private hosting.

## Why this is aligned

Doc 77 already mandates authoritative OAS for API v2, and the design order remains **Product semantics → capability boundaries → HTTP semantics → OAS → implementation**. The static site presents the contract without coupling backend uptime, broker credentials, provider adapters, or runtime controller typing to documentation hosting. It does not resolve all legacy v1 weakly typed HTTP boundaries or supersede frozen prose contracts.

The October 5 `PL-API-02` intake investigated contract truth and weakly typed responses, not simply installing Swagger. Keep that work distinct from the now-approved **publication surface**. Do not refactor controllers just to satisfy a documentation generator. Reuse existing v2 OAS artifacts and conformance checks; inventory them before proposing consolidation.

## Bounded next workstream (fresh thread)

1. Bootstrap project instructions and recover the `PL-API-02` authority, current OAS inventory, related frozen prose contracts, and the accepted API v2 routes.
2. Confirm the repo's GitHub Pages eligibility, visibility/security posture, deployment mechanism and actual site destination. **Do not enable public publishing until the disclosure boundary is explicitly checked.**
3. Produce the smallest working static Redocly reference generated from existing accepted OAS, with safe examples and README navigation. Avoid invented routes and undocumented payloads.
4. Add reproducible generation plus validation/freshness checks; prove generated pages match the authoritative OAS and contain no sensitive artifacts.
5. Present a browsable preview and exact publication plan for Principal review. Publish/enable Pages only under separately confirmed authorization.
6. Keep backend API runtime, brokerage acquisition, migrations, operational services and the ongoing `ww pull && ww history` release untouched.

## Acceptance target

A reader can open the repository's API documentation entry point and browse a coherent, versioned, **static** API reference (resources, methods, request/response schemas, error and security semantics) without running Wheelwright or accessing financial accounts. The rendered site can be regenerated from version-controlled OAS; CI detects invalid or stale output. No documentation server or UI is installed in the backend.

## Boundaries and open execution checks

- **Product choice settled:** static GitHub Pages + Redocly preferred; no live backend documentation UI.
- **Engineering/publication not yet authorized by this record:** GitHub Pages settings, workflows, public site publication, dependency installation, contract rewrites, backend changes.
- **Execution checks:** repository Pages eligibility and privacy, OAS coverage of currently implemented endpoints, safe example content, renderer/toolchain reproducibility, CI and link strategy.
- `PL-API-02` remains the canonical umbrella for machine-readable contract fidelity and HTTP-boundary questions. This checkpoint settles the publication-surface question only; it does not claim full PL reconciliation or API contract completeness.

## Fresh-thread kickoff

"Bootstrap `brooksbol/options-prototype` using `AGENTS.md` and `docs/AGENTS.md`. Continue `PL-API-02` from `docs/design/api-documentation-github-pages-product-checkpoint-2026-10-15.md`. The Principal approved static, browsable Redocly-generated API documentation hosted by GitHub Pages, sourced from authoritative OAS, with no backend docs UI. Inventory accepted OAS and Pages/privacy readiness; propose the smallest verifiable publication slice and identify any authorization needed. Do not change operational services or the `ww pull && ww history` workstream."
