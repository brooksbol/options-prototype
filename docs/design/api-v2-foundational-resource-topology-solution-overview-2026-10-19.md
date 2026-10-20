# API v2 — Foundational Financial Resource Topology / Candidate Solution Overview

**Date:** October 19, 2026  
**Standing:** Candidate Solution Overview, not an accepted Solution Design, ratified ADR, operative OAS, or implementation authority.  
**Scope:** V2 only; foundational financial subjects, resources and their relationships. No v1 retrofit, Strategy/Program/Recommendation/Deployment/decision-engine design.  
**Provenance and challenge:** `docs/discovery/api-v2-codex-five-findings-principal-reconciliation-2026-10-19.md`; `docs/discovery/api-v2-kiro-findings-principal-reconciliation-2026-10-19.md`; `docs/discovery/4am-round6-api-reconciliation-2026-10-18.md`. Follow ratified `docs/principles.md`, `docs/77-api-v2-architectural-guardrails.md`, Doc 82, ADRs, maintained knowledge and `ASSIM-0002` where this candidate has unsettled implications.  
**Operational contract:** `docs/api-v2/README.md` and its canonical OAS/linked JSON remain authoritative for today's accepted endpoints. Nothing below changes them.

## Product objective and architecture

Wheelwright v2 is a brokerage-agnostic financial-domain facade/cache between clients and multiple brokerages. The backend owns reconciled evidence, authority, meaningful financial relationships, policy and domain computation. Clients may differ in human/agentic presentation but must not recreate financial meaning or manually construct URI path patterns; canonical links/discovery or generated centralized contract-aware navigation should be used, with documented query-parameter composition.

The **public URI topology is one coherent domain map**, not a collection of feature-local procedures. Collections generally use plural one-word domain nouns, instances canonical opaque identities (unless a documented stable subject lookup like ticker Quote). Domain relationship does not imply URI nesting. Internal HTTP operations receive no automatic architectural exemption. RPC may follow domain-first analysis when a real operation merits it. Design for extensibility, not speculative future-proofing.

## Candidate canonical resource families

| Resource | Candidate collection / instance | Resource meaning and identity | Standing / proof pressure |
|---|---|---|---|
| Users | `/v2/users`; `/v2/users/{userId}`; `/v2/me` | Authenticated User; `me` contextual discovery of same canonical User | Keep accepted. User identity independent of Account; admin Users grant no blanket financial read |
| Brokerages | `/v2/brokerages`; `/v2/brokerages/{brokerageId}` | Shared reference identity for institution/provider, distinct from connection environment/configuration | Principal-endorsed candidate; connection resource not earned |
| Accounts | `/v2/accounts`; `/v2/accounts/{accountId}` | Immutable confidential financial Account identity; broker association, explicit User–Account grants, user-specific visibility | Keep accepted, no claim of single User ownership in contradiction of many-to-many grants |
| Portfolios | `/v2/portfolios`; `/v2/portfolios/{portfolioId}` | Independently identifiable **mutable composite** of financial interests; membership 0..N, may be empty, may change internally or through constituent state; possible Account-spanning/overlap | Principal-established conceptual direction; exact membership/authorization/aggregation open. Not synonymous with Portfolio Capital |
| Positions | `/v2/positions`; candidate `/v2/positions/{positionId}` | Wheelwright Position != brokerage holding row; backend canonical economic subject assembled from evidence/authoritative relationships | Existing collection is snapshot-bound; durable instance identity/lifecycle not decided (ASSIM-0002). Human rows do not mint canonical instances |
| Instruments | `/v2/instruments`; `/v2/instruments/{instrumentId}` | Tradable Instrument catalog with identity independent of its ticker | Principal-endorsed candidate. `?symbol=SPY` is a convenient discovery filter; ambiguous symbol resolution must be explicit |
| Contracts | `/v2/contracts`; `/v2/contracts/{contractId}` | Specific contractual Instrument and terms, independent of whether any Account holds it | Established ontology concept, strong candidate; specialization/shared identity with Instrument and adjusted-deliverable encoding open |
| Transactions | `/v2/transactions`; `/v2/transactions/{transactionId}` | Independently addressable Account-ledger financial record; filter collection `?accountId=...` | Preferred candidate superseding nested-only canonical design if later authorized. Transfers involve two Account-ledger transaction instances; correlation only with evidence. Content fingerprints not universal event IDs |
| Quotes | `/v2/quotes`; `/v2/quotes/{symbol}` initially | Selected time-varying market-price representation of an Instrument or Contract, source/time qualified | Keep GET shortcut; future canonical Instrument identity and filters can evolve. Read-through target differs from existing pure-held GET; no silent contract replacement |
| Uploads | `/v2/uploads`; `/v2/uploads/{uploadId}` | Identifiable submitted source with GUID; source metadata, retention and processing state | Candidate. `(accountId, SHA-256)` indexes equivalence but does not become URL identity; preserve broker-acquired evidence and cross-Account security |
| Parsers | `/v2/parsers`; `/v2/parsers/{parserId}` | Independently identified parsing capability (e.g. Fidelity Balances, Schwab Positions) | Candidate REST discovery plus stateless transform invocation if justified; CSV→JSON transformation alone does not admit financial state |

These are **identity-oriented examples**, not claim that all resources are implemented or already fully authorized. No independent collection for every ontology noun. Concepts such as Account ledger, observations, collateral links, governed quantities, evidence gaps and parse outcomes must have faithful representations even where they do not earn top-level root endpoints.

## Existing public API disposition matrix (candidate only)

| Operative v2 family | Candidate disposition | Preservation / falsifier |
|---|---|---|
| `/v2/users`, `/v2/users/{userId}`, `/v2/me` | Keep | User identity, self resolution, explicit administrator grants |
| `/v2/accounts`, `/v2/accounts/{accountId}` | Keep | Account immutable identity, access isolation, nickname discovery |
| `GET /v2/positions` | Keep and rework domain representation over time; consider instance | Current snapshot/holding IDs must not be promoted into lifecycle identities |
| `POST /v2/position-acquisitions` | Challenge target HTTP exposure; operational capability preserved | Explicit sync/bounded attempt and permissions cannot disappear; no independent domain entity yet justified |
| `GET /v2/portfolio-capital-observations` | Preserve distinct bounded financial measure; placement/label separately reconcile | Not a surrogate for `/v2/portfolios`; evidence pairing, gaps and clocks preserved |
| `GET /v2/accounts/{accountId}/transactions[/{transactionId}]` | Favor top-level canonical Transactions with Account filtering and explicit grants | Existing accepted per-Account history clocks/coverage retained through transition |
| `/v2/artifacts` and instance | Challenge generic catch-all; avoid assuming Uploads cover broker-acquired JSON | Exact immutable original source, hashes, confidentiality, source/attempt evidence must survive |
| `/v2/artifacts/{artifactId}/content` | Reconcile only after retained-source resource identity | Original bytes, separate disclosure authorization remain |
| `POST /v2/artifacts/{artifactId}/imports` | Reconcile as retained processing/history, not automatic standalone Import resource | Failed and interrupted processing; retry from retained bytes; no duplicate economics |
| `GET /v2/quotes`, `GET /v2/quotes/{symbol}` | Retain selected-Quote GET, examine read-through target | Existing GET expressly held-only; preserving original semantics during migration required |
| `POST /v2/quotes` | Explicit acquisition capability remains, but collection POST lacks automatic domain-creation justification | Preserve FORCE/ORDINARY and per-subject outcomes pending independently justified interface |
| `GET /v2/market-evidence-subjects` | Reject unearned independent resource name; relocate or internalize legitimate subject selection | Preserve backend relevant-subject selection, incomplete coverage and accepted `ww pull` behavior |

## Relationships and invariants

- User–Account: explicit backend many-to-many access grants; brokerage shared institutional reference; Account association independent of authorization. Multiple Users using shared brokerage integrations never share financial access by implication.
- Brokerage connection/environment (e.g. Tradier sandbox versus production) is integration/security configuration, not automatically a financial domain resource. Keep credential and source-evidence isolation.
- Portfolio membership and its values vary without identity changes. Empty members are valid; zero membership is not a certified zero valuation. Overlapping Portfolios must not duplicate underlying ownership or economics.
- Position is a Wheelwright canonical concept, not broker custody/contract hash. Broker snapshots are independently qualified evidence; cumulative ledger is a candidate accounting basis. Explicitly governed quantities are not inferred from Account, ticker or snapshot. No double counting.
- Instrument is independent of ticker symbol; Contract has terms/deliverables independent of Account holdings. One Contract can relate to multiple Accounts/Positions. A Contract may specialize Instrument; no two conflicting identities.
- Quote URI identifies a selected, time-varying representation, not every immutable observation. Timestamp/provenance qualification remains observable. Request `Cache-Control` and backend evidence-source revalidation are separate policies. Plain GET must not require client acquisition choreography.
- Upload: an authenticated submitted Account is attribution claim, not proof of source Account; filename untrusted. Retention-before-processing and failed source preservation remain; source cross-Account leakage forbidden. 201 new / 303 equivalent successfully processed are candidate outcomes, with account-scoped checksum indexing and concurrency proof. Two filenames alone do not justify two financial admissions. Upload GUID independent of checksum.
- Parser: return qualified normalized JSON without establishing Account attribution, minting financial-domain IDs, or admitting state. Backend service or independently exposed parser may be justified by actual black-box test utility.
- Ledger: recent overlapping transactions extend/reconcile accumulated history; never overwrite prior evidence. Gap requests such as “can you give me May 5 through June 1?” may be emitted only when evidence establishes those boundaries; otherwise coverage UNKNOWN. Disagreement between projection and snapshot is unresolved, not a fabricated transaction.

## Acceptance/falsification specimens for independent reviewers

1. Broker reports one 250 SPY holding; Wheelwright has authorized 150/100 separately governed quantities, no invented broker rows.
2. 200 URA shares, 100 unallocated and 100 linked as call collateral; no duplicate economics and no inferred collateral from symbol matching.
3. Broker holding closes and later reopens identical Contract: cannot inherit prior occurrence membership merely from tuple equality.
4. Partial reduction: do not silently assert residual applicability or quantities.
5. Two Accounts hold the same Contract; one canonical Contract definition, distinct Account exposures.
6. Adjusted option with nonstandard deliverable: terms and quantities remain exact; no ticker+strike identity shortcut.
7. Empty Portfolio remains addressable through stable identity.
8. Overlapping Portfolios can reference the same positions without duplicating economic ownership.
9. PTS→Sawdust transfer yields separate Account-ledger entries; correlation evidence qualified.
10. Upload identical Account-scoped CSV under two filenames: no duplicated financial admission; authorization/privacy and processing status correct.
11. Submit PTS source while selecting Sawdust: do not manufacture verified source identity nor contaminate Sawdust when evidence demonstrates conflict.
12. Concurrent identical submissions: no double admission; report truthful completion or error.
13. Parser returns JSON for valid/invalid Fidelity/Schwab specimens without Account mutation or manufacturing provenance.
14. Quote GET returns SPY's selected price and minimally necessary quality/clock, not acquisition story; held-only acceptance remains until change.
15. Snapshot inventory 250, partial ledger projects 200: explain discrepancy without creating 50 fictitious shares.
16. Gap-qualified ledger asks for a specifically evidenced missing interval; unknown history doesn't become invented date bounds.
17. Two User identities share an adapter but not Account visibility; Tradier sandbox/production cannot cross-contaminate.
18. Human `ww positions` output remains concise; agentic API identity, provenance and relationships are independently inspectable.

## Dependency-aware delivery candidate

1. **First:** ratify coherent whole-topology *resource meanings* and preserve original v2 contracts; audit differences against current OAS/controllers. Do not start endpoint-by-endpoint patching.
2. **Parallel low-risk work where independently authorized:** Account/User/Brokerage discovery and top-level Transaction selection may progress using stable IDs and grants; independently test parser transformations without inventing identities.
3. **Foundational high-dependency work:** Position + governed quantities, Contract/Instrument canonical identity, and ledger/snapshot reconciliation need explicit semantic decisions and independent falsification before promising resource instances or Position economics.
4. **Upload/Quote evolution:** preserve accepted source-retention, quote force and held semantics until migration and source-quality test specimens pass.
5. **CLI evidence:** verify early human `ww` output plus structured/agent API behavior against the same backend authoritative domain facts.
6. **Separate defects:** reported SQLite concurrent upload false rejections and filename-sensitive download/retry go to existing BUG registry after independent reproduction/triage. Don't use bug repair to bootstrap an unratified resource taxonomy.

No existing accepted v2 capability is removed by this candidate document. Implementation, OAS edits, migration, operational evidence acquisition, grants and deployment are expressly outside authorization. Further Principal judgment on final canonical identities and contested semantic boundaries remains required.

## Knowledge-assimilation scope

This Solution Overview is an **integrated candidate**, not a maintained Category A owner. Established Account, Operating Regime, Position and Governed Quantity meaning stays in `docs/knowledge/domain/` with its cited standing. New Portfolio/Upload/Parser/Instrument/Contract proposals remain visibly candidate; do not silently mark `ASSIM-0002` VERIFIED or create unsourced assimilation obligations. Subsequent ratification and knowledge-owner changes require their own explicit state/verification.
