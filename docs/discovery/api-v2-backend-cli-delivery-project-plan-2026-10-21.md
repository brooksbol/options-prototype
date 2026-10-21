# Wheelwright API v2 Backend and WW CLI Delivery — Project Plan

**Date:** October 21, 2026  
**Status:** Principal-requested project plan, planning/provenance artifact (Category D). This is a proposed delivery decomposition and acceptance framework, **not** an implementation permit, ratified new architecture, live trading/acquisition permission, task-state transition, or promise of an unverified schedule. Current A–F authority and repository task/experiment gates govern.

## Desired Product outcome

Implement **all accepted in-scope foundational backend API v2 capabilities**, independently verify the actual service, publish truthful authoritative OpenAPI documentation, then deliver `ww live` and migrate appropriate existing `ww` CLI commands to consume that backend with no duplicated authoritative financial logic.

**One backend, many clients:** API v2 is a financial-domain Product, not a screen-specific data feed. Human and automated/agentic consumers use the same OAS and financial semantics. Design must not block a potential future MCP consumer, but **MCP server/tool/adapter implementation and MCP acceptance are expressly outside this project**. The **v1 web UI is explicitly excluded**: no retrofit, parity, compatibility or decommissioning gate.

## Authority and already-agreed sequencing

- Principal accepts specification *as an architectural baseline with conditions*: `docs/discovery/api-v2-specification-acceptance-checkpoint-2026-10-21.md`.
- Full backend API first (not a `ww live`-only subset), followed by backend verification/Principal acceptance; then `ww live` and potential concurrent existing WW CLI migration: `docs/discovery/api-v2-full-implementation-handoff-2026-10-21.md`.
- Latest accepted candidate was **local-only when reported**, `a32c7c79a059cc58d5262cf3e30c520d2e087825` on `codex/api-v2-final-correction-2026-10-21`, under `docs/reviews/api-v2-foundational-contract-2026-10-20/openapi.json`. Verify its actual availability before implementing; do not treat GitHub main as containing it.
- Ratified v2 backend authority: `docs/77-api-v2-architectural-guardrails.md`. Ratified holistic API principle: `docs/foundations/holistic-domain-first-api-design-principle-2026-10-18.md`.
- Accepted `tt live` human reference: `docs/cli/tt-live-panel.md`, `docs/design/tt-live-economic-story/README.md`; accepted `ww positions` baseline: `docs/cli/ww-positions-command-2026-10-15.md`; `ww pull` accepted integration: repository task/CLI contracts.
- Reconcile with canonical `PL-CLI-01` (complete parking-lot continuity), `PL-API-02` and `PL-API-03` where applicable, current strategy `docs/roadmap.md`, architecture `docs/architecture-roadmap.md`, and `ASSIM-0002` without asserting the latter closed. These workstream associations are not standalone authorizations.

## Critical path and stage gates

| Gate | Outcome / minimum demonstrable proof | Go/no-go owner |
|---|---|---|
| G0 — Authority / inventory | Current remote/main SHA and local candidate identified; task and experiment permissions verified; complete accepted route/schema/runtime-obligation coverage matrix; isolated work and cross-stream ownership | Engineering + governance; Principal for missing permission |
| G1 — Mandatory contract corrections | Three residual conditions corrected: examples/temporal truth; redacted metric `asOf` leakage; coverage conflict Account/Position propagation. Independent targeted checks pass. No defective example becomes authoritative implementation guidance | Codex correction; Kiro independent falsification |
| G2 — Full backend implementation | **Every accepted in-scope OAS route** backed by running v2 code, persistence, source evidence, security, error/evidence qualifications and typed contracts. No silent `ww live`-only omissions | Implementation engineer; independent reviewer |
| G3 — Backend API acceptance | Repeatable tests pass against actual service; OAS and implementation agree; representative broker inputs and unknowns verified; negative access tests; Principal accepts completed API independently of any CLI | Kiro review + Principal |
| G4 — CLI delivery | `ww live` from v2 only; selected existing `ww` CLI commands retrofitted, potentially in parallel using isolated ownership | CLI engineering + Principal iterative observation |
| G5 — CLI migration acceptance | CLI output matches accepted Product specimens; end-to-end data lineage; no parallel authoritative normalization/recognition/valuation/management decisions in CLI; regression and independent verification | Kiro/independent review + Principal |

**Hard ordering:** G3 before G4. Back-end tests and OAS/documentation development run concurrently with backend implementation. Some CLI retrofit tasks may be parallelized *after G3*; no assumption that all WW CLI migration must be serial. G5 is distinct from G3.

## Workstreams and products

### WS1 — Contract corrections and complete implementation inventory

Deliver: corrected typed OAS candidate/examples, cross-reference every accepted route/verb/schema and functional invariant to current service state (already supported / partial / missing / explicitly deferred), implementation dependencies and proof tests. Resolve three mandatory corrections exactly: source-derived example payloads and evaluated `asOf`; non-leaking redacted `asOf`; coverage conflict and accurate warning field references. Preserve pending/unknown evidence instead of fabricated calculations. Acceptance: spec coherence probes and independent targeted review; complete scope inventory signed off, no implementation disguised by synthetic tests.

### WS2 — Full backend API v2 implementation

Deliver all accepted in-scope domain capabilities, not limited to `ww live`:
- token-User and Account grants; Accounts; independently readable broker holdings and historical snapshot discovery; original source Artifacts and import attempts where required;
- independent Position GUID and terminal CLOSED; write-once Construction instances and immediate predecessors; exact versioned write-once Models; cash/share/options/nested constituents; unclassified fallback; Account-wide conservation;
- broker-normalized contract terms/units, read-only Orders and evidence-backed associations; transactions/source fills when available; broker market observations/option quote provenance; current/original/cumulative qualified economics and exact payoff geometry;
- evidence warnings, redaction, complete summary/expanded projections, Audit where accepted, standard HTTP errors and retained evidence/refresh semantics.

Avoid undocumented feature gaps, forced structure recognition, invented broker Executions or collateral, speculative new Portfolio/Strategy/margin resources, tax-lot/assignment engines or brokerage order submission. Backend owns authoritative financial semantics, CLI does not.

### WS3 — Automated backend verification and integration quality

Build automated checks **with WS2**, not after:
- executable OAS/schema conformance; response/error/route coverage; examples generated from source fixtures; contract drift;
- deterministic payoff, signed cash/option price units, conservation, collateral/coverage and roll/LEAPS/protection economics;
- broker source provenance, time/freshness, missing/partial evidence, refresh failure preservation, reconciliation and no fabricated continuity;
- runtime User/Account grants and adversarial redaction across links, collections, history, summary and expanded views; negative fixtures for Order-derived time/targets;
- persistence/retrieval and controlled HTTP integration; accepted Product precedent tests, including coverage of historical holdings and `ww pull` source evidence.

Report unit vs service vs offline vs live-broker evidence separately. Current 294 reported candidate checks are specification evidence **not** implemented-service validation. Produce CI-ready deterministic suites; explicitly state unavoidable live-source limitations.

### WS4 — Authoritative API documentation (parallel with WS2/WS3)

Maintain a **single authoritative machine-readable OpenAPI 3.1 contract accurately describing the running v2 API**, and derive/bind:
- human browsable API reference with resource maps, identity/lifecycle, authorization, payload examples and error/warning explanations;
- agent-friendly OAS operation descriptions, typed inputs/outputs, URI navigation, source provenance, field statuses, example client calls, security and unknown semantics;
- reproducible contract validation and publication/update procedure per `docs/api-v2/README.md` and `docs/bootstrap/api-v2-documentation-update-procedure.md`.

Do **not** build MCP server/adapters/tool wrappers or a parallel agent API/schema authority. Potential future MCP consumption is a reason for clean contract semantics only, not a separate acceptance gate. Documentation cannot claim unimplemented endpoints or imaginary broker coverage.

### WS5 — `ww live` implementation (only after G3)

Implement the accepted `tt live` `SYMBOL | TRADE SHAPE | RANGE | SPOT | DTE | EXIT PROGRESS | QUOTE` operator story through API v2. Respect accepted `ww` BROKER/ACCOUNT multi-Account conventions, Unicode/ASCII and color/terminal-width fallbacks, qualified unknowns, source freshness, working Order state and no fictitious time exit. CLI handles rendering and command interaction only. Obtain an **early real terminal specimen** and Principal observation before long hardening loops. Verified numeric truth comes from backend; lossy glyphs never corrupt exact geometry.

### WS6 — Existing WW CLI migration and business-logic elimination (after G3, parallel if safe)

Inventory installed/existing command families (e.g. `ww positions`, `ww pull`, history, quote/fetch/account inspection); map each field/calculation/source path to v2. Distinguish harmless parsing/presentation/formatting from duplicated authoritative broker acquisition, normalization, Position/Construction recognition, association, valuations, roll/management or evidence-quality logic. Replace conflicting CLI logic with API reads while preserving accepted human UX, shell composition, machine formats and privacy/error semantics. Migration wave plan and independent worktree ownership should be decided after inventory; do not casually rewrite all commands simultaneously.

**Completion evidence:** static/client dependency inventory plus actual service-backed tests showing no parallel financial domain engine, representative human outputs including failure/unknown cases, and independent verification. CLI acceptance is a separate Principal decision.

## Dependency summary and allowable parallelism

G0 → G1 → full WS2 with WS3 and WS4 concurrent → G3 → WS5 and scoped WS6 potentially concurrent → G5.

Critical blockers: missing actual local accepted candidate; repository permission/task/experiment gate; unsupported source facts/authorization semantics; a genuine Product contradiction; failed independent security/financial verification. Non-blockers: absent MCP adapter; unimplemented v1 web migration; unproven discretionary tax-lot associations; unresolved optional Portfolio/Execution resource; historical evidence honestly reported UNKNOWN.

## Risks and mitigation

| Risk | Mitigation |
|---|---|
| Correct-looking OAS, missing runtime paths | Route/verb/schema-to-handler matrix and live controlled HTTP conformance |
| Security leak through derived fields | Negative access tests for timestamps, source links, projection expansions and history |
| Double-counted exposure or false collateral | Account-wide reconciliation/Position conflict propagation, sourced authority |
| Broker gaps lead to invented P/L or Order history | Source coverage matrix, provenance, explicit UNKNOWN and operator warning |
| Client migrations reproduce financial engines | Static audit, API-only field lineage and end-to-end parity tests |
| Repeated Codex/Kiro patch cycles delay Product | Bounded falsifiers, model-level review for recurring defects, early Principal operator specimen |
| Parallel changes damage in-flight work | Isolated branches/worktrees, explicit ownership, merge/integration check |
| Documentation diverges from runtime | OAS as executable contract, generated human reference, CI documentation validation |

## Time and staffing

No fixed delivery dates or promises are established by this plan. The Principal's October 21 preference to move promptly is a priority, not proof that complete backend implementation and CLI migration fit one day. Sequence and internal sprint sizing require an actual coverage inventory, source/runtime baseline, and available engineering capacity. Suggested accountability: **Codex** for independent architecture/falsification and bounded contract engineering as assigned, **Kiro** for repository-resident implementation/integration as authorized, **Principal** for operator outcome and final acceptance. Roles follow current actor instructions; no agent automatically receives mutation permission from this plan.

## Concrete acceptance evidence package

By G3, produce: target-to-operative OAS coverage report; full implemented route list; financial and negative authorization tests with command/output; source provenance matrix and broker limitations; independent implementation review; actual backend endpoint samples; Principal acceptance record.

By G5, produce: `ww live` terminal specimen and accepted parity tests; migrated-command inventory; evidence of removal of duplicated domain logic, CLI tests and representative Unix workflows; independent verification and final Principal acceptance.

## Reconciliation and authorization

Existing `PL-CLI-01`, `PL-API-02`, `PL-API-03` and accepted design documents are the canonical routing; this plan **does not** allocate a new `PL-*` item or supersede roadmap governance. Any genuinely new material capability or owner uncovered during implementation follows the repository's idea-intake/reconciliation pipeline. No new architectural meaning or Product principle is ratified by drafting this plan. Before software work, inspect current gates/task authority and obtain required explicit permission. No repo code, OAS implementation, runtime, trading, deployment, v1 web UI or MCP resources are modified here.
