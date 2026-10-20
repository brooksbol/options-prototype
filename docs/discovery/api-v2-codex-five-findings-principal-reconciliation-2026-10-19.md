# API v2 — Principal response to Codex's five architectural objections

**Date:** October 19, 2026  
**Status:** Category D reconciliation / Principal-stated domain clarifications; not an operative OAS, implementation authorization, or complete ratification of unresolved identities.  
**Scope:** V2 foundational financial resources only. No v1 retrofit; no strategy, recommendation, deployment, or decision-engine design.  
**Codex review baseline:** `ac95f3ed10dd7fa7e9c0cead12ff7e0bb91136dd` (the original read-only Codex submission).  
**Related authority:** `docs/README.md`, `docs/principles.md`, `docs/77-api-v2-architectural-guardrails.md`, `docs/82-v2-ontology-resource-semantic-coverage-reconciliation-2026-10-07.md`, `docs/knowledge/domain/`, `docs/assimilation-obligations.md`, and `docs/cli/ww-positions-human-presentation-2026-10-17.md`.

## Reconciliation discipline

This record preserves the Principal's discussion of Codex's five objections before receiving/reconciling Kiro's independent report. It is **not** a claim that Codex agreed or that independent falsification has passed. The Principal's stated direction must not be silently expanded into detailed rules on identity, lifecycle, evidence admission, or implementation. The existing accepted v2 API continues unchanged. Resource names below are proposed unless already operative.

## 1. Position identity: Wheelwright Position is not brokerage Position

**Codex:** Current brokerage-derived IDs represent snapshot holdings and whole-holding associations; they cannot establish universal lifecycle continuity or quantity-scoped governance. The 250 SPY = 150/100 allocation specimen falsifies a naive mapping.

**Principal:** `ww position != brokerage position`. Challenge the premise that brokerage representations establish Wheelwright Position identity. A **Wheelwright ledger-centered model** is a candidate: broker-reported transactions and observations are evidence; Wheelwright reconciles them and establishes its own domain Positions and relationships. The accepted October 17 human table expresses meaningful Position presentation but does not prescribe canonical IDs or prove individual display rows are separate durable identities.

**Preserved invariants:** Do not invent brokerage holdings, quantity, historical events, relationships, collateral or economic continuity; conserve units/economics; preserve provenance, temporal qualifications, and unknowns. Ledger introduction grants no exception. A ledger need not be limited to transactions, but any opening inventory observation must be qualified rather than manufactured as a historical transaction.

**Still open:** Exact Position identity and lifecycle through partial reduction, full close/reopen, custody changes, allocation and governed quantity; how ledger state and independent brokerage inventory observations reconcile. `ASSIM-0002` remains PENDING. No Position schema or canonical instance URL is ratified.

## 2. Upload identity, retention, processing, parser separation

**Codex:** Upload submissions, original retained bytes, and processing attempts differ, and byte equality alone cannot guarantee equivalent financial admission.

**Principal:** A conceptual distinction does not automatically earn independent domain-entity or REST-resource status. Preferred Upload resource has a GUID independent of its checksum. Candidate deduplication index: `(accountId, SHA-256) -> canonical Upload URI`. Different filenames with identical Account-scoped payload bytes do not, by themselves, justify duplicate financial admission. Filenames are untrusted metadata, not source authority. Keep source provenance and processing status truthful.

**Client specimen:** `ww sync ~/Downloads` may submit every candidate CSV without a client-side processed-file manifest. Candidate response semantics: `201 Created` for new Upload; `303 See Other` for a recognized, equivalent, successfully processed Upload. A 303 is a useful nonfatal response, **not** the idempotency guarantee. Duplicate identity must be scoped, concurrency-safe and Account-authorized. Failed parsing after retention may leave a retained Upload; it must not be represented as successfully processed. Repeated malformed payloads may warrant bounded error suppression independently of resource identity.

**Creation versus replacement:** `POST /v2/uploads?force=true` is not automatically acceptable. `PUT /v2/uploads/{uploadId}` was raised but not selected. GUID identity is not a content hash, yet replacing retained bytes raises evidence immutability/provenance issues. Reprocessing previously retained evidence and correcting derived financial state are distinct from replacing a resource. No PUT or force contract was accepted.

**Parser insight:** A `/v2/parsers` collection may genuinely enumerate independently identifiable parser capabilities (e.g., Fidelity Balances, Fidelity Positions, Schwab Balances). `GET /v2/parsers` and `GET /v2/parsers/{parserId}` could expose discovery and contracts; an explicitly documented stateless POST on a parser instance could transform CSV -> structured JSON without admission/persistence. This is a meaningful independent black-box API test seam. Parsing, retaining an Upload, and admitting domain state remain distinct capabilities without automatically becoming three persistent financial entities.

**RPC rule:** “RPC is not inherently bad architecture. RPC used as a substitute for domain modeling is.” Domain concepts and resource identities come first; justified stateless/procedural APIs may follow. Recorded separately in `docs/77-api-v2-architectural-guardrails.md` at commit `343d6e8`.

**Still open:** Upload versus source-content equivalence and read authorization, parser identity/schema/version, atomic admission, processing-recovery contract, immutable-original guarantees, exact 303 rules, reprocessing and PUT semantics. Do not represent proposal as an implemented capability.

## 3. Portfolio: mutable first-class composite, zero or more members

**Codex:** “Portfolio” lacks defined membership identity; access-scoped aggregates, saved collections and overlapping holdings are different concerns.

**Principal:** A **Portfolio is a first-class composite financial resource**, with stable identity independent of its current composition. Its composition may change internally (membership/allocation changes) or externally (underlying holdings and Account activity). Neither changes Portfolio identity. A Portfolio may validly contain **zero members** and continue to exist; cardinality `0..N`. A Portfolio is a view into a mutable composite, not a frozen position set. Distinct Portfolios may overlap without manufacturing or duplicating economic ownership.

**Candidate routes:** `/v2/portfolios`, `/v2/portfolios/{portfolioId}`.

**Separate concerns:** User grants do not establish Portfolio membership. An empty Portfolio is not a nonexistent Portfolio; empty membership, zero value and unknown value are not synonyms. Portfolio Capital observations remain qualified financial evidence, not automatically NAV or a complete valuation.

**Still open:** Membership definition/authority, selectors versus explicit members, handling changed constituents, aggregation and coverage, authorized partial views, historical representation. These details do not defeat first-class Portfolio identity and must not be assumed settled.

## 4. Acquisition capability versus resource model: facade and Uniform Interface

**Codex:** Existing FORCE/ordinary quote acquisition, source outcomes, retained-prior evidence and read/acquire permission distinctions are accepted v2 capabilities. Ordinary GET is currently provider-free held evidence.

**Principal:** **Capabilities and domain concepts are different dimensions.** Wheelwright is a brokerage-agnostic **facade/cache between the operator and N brokerages**. Resource identity should express the financial domain through REST's Uniform Interface and Layered System. The operator asks “give me SPY's spot price, not your life story.” A domain Quote GET should not require the client to orchestrate broker acquisition, caching or evidence admission. The backend handles those responsibilities while returning prices with appropriate evidence-time/source qualifications.

**Disposition:** Preserve legitimate acquisition capabilities, including explicit FORCE/revalidation where justified, without treating the existing `POST /v2/quotes` as automatically the correct resource mapping. RPC may be warranted *after* domain analysis. Existing accepted held-only GET and POST contracts remain operative until independently reviewed and explicitly changed; do not silently claim that read-through GET is already implemented or automatically authorized.

**Still open:** Explicit refresh interface, read-through policy/latency/error/cache contract, acquisition authorization and compatibility transition.

## 5. Symbol shortcut, Instrument and Contract identities

**Codex:** A ticker is not enduring Instrument identity. Symbols change, can be ambiguous, and adjusted option terms cannot be inferred from shorthand.

**Principal:** Keep ticker-based Quote lookup as a useful *shortcut* (`GET /v2/quotes/SPY`) while canonical Instrument identity remains independent and available through `/v2/instruments/{instrumentId}`. Discover via collection selection such as `GET /v2/instruments?symbol=SPY`. Ambiguous symbol matches must not be silently guessed. Collection query filters can evolve without making ticker identity canonical.

**Ontology reconciliation:** Doc 58 (unratified Semantic Model draft) distinguishes an Instrument as externally identifiable security/family and Contract as specific contractual financial instrument with identity and terms. Doc 82 (Principal-ratified reconciliation) recognizes a Contract independent of any Account holding/obligation and identifies `/v2/contracts` as a strong *candidate*, while exact identity is open. A Contract may be a specialized Instrument and deserve separately useful addressability. Quote provides evidence; Position represents Account-associated financial interest/obligation; Contract identity persists across Accounts and market evidence.

**Candidate routes:** `/v2/instruments`, `/v2/instruments/{instrumentId}`, `/v2/contracts`, `/v2/contracts/{contractId}`; existing ticker Quote shortcut preserved.

**Still open:** Instrument/Contract specialization and shared identity, adjusted deliverables, symbol resolution and canonical URI encoding, any historical Quote observation identity. Do not elevate the unratified Doc 58 draft above ratified v2 authority.

## Cross-cutting boundaries and checks

- V2 only; do not retrofit v1. V1 may provide Product evidence, not architectural authority.
- Foundational financial entities and relationships only; no Strategies, Programs, Recommendations or decision engine redesign in this workstream.
- Principal convention: collection URIs plural nouns, preferably one word; domain model precedes HTTP methods and OAS.
- Human and agentic interfaces may differ; canonical IDs need not clutter human `ww positions` tables.
- Application clients do not manually manufacture URI path patterns; discover canonical links or use centralized/generated contract-aware routing and documented query-parameter composition.
- No internal-API exemption from coherent domain resource design.
- Design for extensibility rather than speculative future-proofing.
- HTTP-based internal service composition and in-process application-service composition are both viable candidates. Judge by present separation-of-concerns and independent black-box testing, consistency and operational evidence, not solely by overhead or hypothetical future scale.
- No API changes, code, migrations, brokerage operations, deployments or retroactive ratification follow from this document.

## Status for next reconciliation

All five Codex principal objections received a scoped Principal response. This is a **Principal/ChatGPT retort**, not a new Codex disposition. Kiro's independent evidence has not yet been reconciled. Preserve genuine unresolved identity and contract questions for cross-actor challenge instead of treating conversation agreement as proof.
