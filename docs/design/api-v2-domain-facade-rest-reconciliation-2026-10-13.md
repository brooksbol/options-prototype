# API v2 domain facade and REST resource-model reconciliation

**Date:** October 13, 2026
**Status:** PRINCIPAL EXPLANATION RECORDED; RECONCILIATION PROPOSED, NOT RATIFIED.
**Scope:** Architectural review of `ww show positions` proposal. No API contract, code, permission, migration, or operational authorization.

## Principal's architectural intent (October 13 conversation)

Wheelwright v2 is a **facade / de-multiplexing layer** that reconciles heterogeneous brokerage-specific syntaxes and evidence into **one coherent Wheelwright Product/domain model** for its clients. The domain model and tools operating on it are Wheelwright's core intellectual property. Brokers are upstream sources; their transport, refresh, CSV parsing and admission workflows are implementation details, not the default public resource vocabulary.

The Principal emphasizes standard REST **Uniform Interface**, **Layered System**, and **Cacheability** constraints:
- Public URIs express coherent **domain resource collections and identifiable instances**, not the identity of a provider, client, internal workflow or acquisition mechanism.
- GET collection = search/filter/select a representation; GET instance = retrieve the identified resource. Query parameters may select projections when useful; document their semantics and response shapes.
- POST to a collection, under the Principal's chosen resource grammar, creates an instance of **that collection's domain resource type**. Which authorized caller initiates creation is separate from the resource contract. Standard HTTP allows other POST uses; any deviation here must have an explicit domain justification, not implementation convenience.
- 201 describes completed creation with resource identity; 202 describes accepted but incomplete processing; 200 may describe a successful GET or an operation response where its documented semantics genuinely fit. HTTP status semantics follow actual outcomes; neither every POST nor every GET implies asynchronous work.
- GET safety is about the **client-requested semantics**, not a ban on incidental server-side state maintenance. A read-through facade may contact a provider, normalize/admit newly observed evidence, and update internal held evidence while serving a GET, provided it does not perform a client-unrequested brokerage trade/cancel or other unsafe domain action. The `GET /clock` analogy illustrates varying read representations without client-requested mutation.
- Read-through evidence caching is the initial architectural assumption, **not** a requirement that every GET make an upstream call. Freshness, admission, provider failures, provenance and unknowns remain explicit. Client/intermediary caching, if used, follows standard HTTP `Cache-Control`, `ETag`, `Vary`, and conditional-request semantics; private Account evidence requires appropriate protection. No new client-owned authoritative cache.
- A Product client asking for Positions should not have to orchestrate an acquisition request or understand whether evidence came from a broker, retained SQLite observation or imported CSV.

## Reconciliation against existing ratified authority

| Existing authority | Alignment or unresolved tension |
|---|---|
| `docs/principles.md` PRIN-ARCH-BACKEND-AUTHORITY and PRIN-ARCH-SINGLE-ACQUISITION-AUTHORITY | **Aligned.** Domain authority and evidence acquisition remain in backend; client owns presentation. |
| `docs/foundations/evidence-appliance.md` | **Aligned.** Independently maintained evidence; existing provider worker and retained evidence are implementation mechanisms. |
| `docs/77-api-v2-architectural-guardrails.md` §§3, 5, 13, 19, 20 | **Largely aligned.** §20 already favors domain nouns, shallow collection/instance URIs, projections, and omitting action nouns. §13 separates acquisition scope from representation projection. |
| Guardrails §19 and §20 example: acquisition/read distinction; optional POST to reacquire quote evidence | **Needs explicit reconciliation.** Existing text can be read as assuming the public client orchestrates acquisition. The Principal's new clarification prefers read-through GET for ordinary domain reads and rejects acquisition workflow as a Product concept for `ww show positions`. This does **not** by itself deprecate existing endpoints or prohibit genuinely Product-facing acquisition resources in other contexts. |
| `docs/07-architecture-current.md` existing self-scheduling worker, refresh endpoint and legacy browser paths | **Distinguish historical/current implementation from v2 target.** Do not silently erase accepted v1 behavior or pretend the legacy routes already implement the new facade. |
| `docs/README.md` authority hierarchy | This document is a design-review reconciliation proposal. It does not amend Category A/B ratification by implication. |

## Concrete consequence for Codex's October 13 proposal

Proposal reviewed: `docs/design/ww-show-positions-v2-architectural-proposal-2026-10-13.md` (local/uncommitted at review time; do not assume on remote main).

- **Retain for review:** `GET /v2/positions?view=monitoring` as an optional projection of the canonical Positions collection. Account/snapshot selectors are search/selection filters; projection naming and precise response contracts remain engineering design.
- **Reject for this Product path:** `POST /v2/position-acquisitions?accountId=ID&evidence=monitoring`. The `monitoring` acquisition selector encodes a consumer-specific workflow and leaks the facade's upstream acquisition mechanism. It is not a Product capability requested by the Principal.
- **Rework:** Internal provider-adapter acquisition, retained observation admission, source coverage, permissions, timestamps, caching and failure handling as backend responsibilities serving canonical domain reads. Do not infer that existing backend can already perform all required read-through acquisitions or that new provider permissions exist. The revised design must demonstrate the feasible latency, evidence coverage, authentication and failure behavior.
- **Preserve:** Independent unknowns, association/quantity conservation, financial scope, provenance, no fabricated lifecycle, no provider-specific financial semantics in the CLI, and compatibility with existing accepted APIs. Existing `/v2/position-acquisitions` is an implementation reality; its removal/migration is **not authorized** by this record.
- **Domain first:** Position association, construction, valuation, payoff, objectives and quote assessment are reusable Wheelwright concepts, not fields invented solely because a terminal table needs columns. A `monitoring` projection may compose them without becoming their authoritative owner.
- **Open Product decisions remain open:** D1 managed-row evidence, D2 covered-call P/L/objective/lifespan scope, D3 RANGE meaning, D4 exact scaled CC/CSP terminal output. This reconciliation does not accept those choices.

## Required review of a revised proposal

Begin with a short **existing vs proposed URI table** and the underlying domain resource identity, collection/instance semantics, method/status semantics and projection definitions. Then show which backend capabilities are already present, which need extension, how the facade reconciles multiple providers, and how read-through caching and evidence admissibility preserve safety, security, correctness and bounded latency. Compare against existing guardrails and state any explicit contradiction; do not merely assert compliance.

**No implementation authority follows from this reconciliation.** Principal review is still required before the proposed API contracts are changed.
