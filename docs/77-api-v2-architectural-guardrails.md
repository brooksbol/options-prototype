# API v2 Architectural Guardrails

Status: **Principal-ratified architectural guardrails**.

These guardrails govern the design of Wheelwright API v2. They are intentionally cross-cutting: they define qualities and semantic disciplines that every v2 capability must inherit without prematurely selecting concrete resources, routes, schemas, persistence structures, provider transports, or production authentication mechanisms.

They exist so v2 pays the architectural cost once rather than accumulating client-specific and endpoint-specific conventions that later require another API rewrite.

## 1. Governing principle

**Cross-cutting semantics are defined once for API v2 and inherited by capabilities rather than reinvented endpoint by endpoint.**

API v2 is a general Wheelwright API: **one API, many clients**. `ww`, the web client, and future clients may project and present the same canonical capabilities differently. No client's workflow or presentation grammar defines the API's domain model.

### Canonical domain facade / de-multiplexing identity — Principal clarification, October 13, 2026

Wheelwright v2 is a **layered, brokerage-agnostic facade and de-multiplexing boundary**: heterogeneous broker APIs, CSV sources, identifiers, vocabularies and observation conventions are normalized and reconciled into a coherent **Wheelwright domain model** consumed by many Wheelwright tools. The canonical domain model and the tools that operate on it are the Product's enduring intellectual property; provider adapters, ingestion workflows and transport are supporting implementation mechanisms. Domain equivalence must be supported by evidence, never manufactured by suppressing meaningful broker differences.

**Design domain first.** The public API exposes Wheelwright Accounts, Positions, Quotes and other justified domain resources, with coherent collection/instance identities and reusable domain semantics. It must not be organized around the acquisition steps necessary for one screen or one provider. A proposed API resource must explain its domain identity and independently useful meaning, not merely its usefulness to one CLI column. This clarification reinforces the existing backend-authority, single-acquisition-authority and conventional-HTTP guardrails; it does not create a new Position ontology or silently change current routes.


V2 capability design should proceed in this order:

**Product semantics -> capability boundaries -> HTTP semantics -> OAS representation -> implementation.**

## V2 backend authority mandate

**Principal mandate:** API v2 MUST preserve a strict authority boundary: **backend owns state and business logic; clients own presentation.**

External systems remain the ultimate origin of their own state. A brokerage, for example, owns the brokerage reality. Wheelwright backend owns the authoritative, provenance-bearing observation/snapshot of that external state that Wheelwright uses, together with Wheelwright-owned governance, policy, derived state, and authoritative business logic.

Accordingly:

- clients MAY initiate requests, submit/import source evidence, select subjects, and render/project backend results;
- clients MUST NOT be the authoritative or sole durable store for Wheelwright state or external-state observations used by authoritative Wheelwright behavior;
- clients MUST NOT independently own or reproduce authoritative Wheelwright business logic, evidence reconciliation, governance evaluation, availability determination, or governed comparisons;
- authoritative Product behavior MUST NOT depend on state or business logic that exists only in a browser, CLI, or other client;
- `ww`, the web client, and future clients consume the same backend-owned state and business capabilities and may differ only in interaction and presentation;
- a backend-held external-state snapshot is an observation with explicit provenance and temporal meaning, not a claim that Wheelwright supersedes the external system as the source of reality;
- v1 client-side topology, browser-held portfolio state, and browser-side business logic are architectural debt/lessons, **not assumptions to inherit into v2**. Reuse requires independent v2 justification.
- client-side caching of Wheelwright domain representations is limited to standard HTTP caching semantics. Such caches MAY reuse backend representations according to the HTTP contract but MUST NOT become an independent Wheelwright state store, reconciliation authority, persistence boundary, or business-logic substrate. Ordinary client configuration, presentation preferences, and a source artifact awaiting explicit submission are outside this restriction so long as they do not become authoritative Wheelwright state.

This mandate selects the v2 authority/placement boundary. It does NOT by itself select a storage technology, persistence schema, intake mechanism, resource/route shape, OAS schema, snapshot retention policy, or implementation decomposition.

## 2. Authoritative machine-readable contract

API v2 MUST expose and maintain an authoritative OpenAPI Specification (OAS).

The OAS describes the actual runtime contract rather than serving as post-hoc documentation. It must faithfully represent applicable request and response schemas, status and error shapes, parameter semantics, optionality/nullability, security requirements, and other externally observable HTTP behavior.

OAS does not define Wheelwright's domain decomposition. Capability boundaries are selected from Product/domain semantics first and then represented faithfully in OAS.

### Brokerage source retention — Principal requirement, October 11, 2026

Original brokerage source artifacts and reconciled Account Ledger evidence have distinct jobs. V2 retains imported CSV bytes immutably in the backend, with generated artifact identity, account ownership, original filenames per import attempt, receipt time, source period when established, SHA-256, MIME type, original byte count, processing status and reconciliation result. Filename is provenance, never artifact identity. Same account/content may reuse an artifact while preserving each recorded import-attempt filename. Current bounded implementation uses SQLite BLOBs; a later payload-location change must preserve domain identity.

The source artifact is committed before semantic parsing/reconciliation. Source retention success does not establish processing success. Rejected or interrupted processing preserves the source and prior admitted evidence; retries process retained bytes without requiring duplicate upload. Authentication and source-account authorization precede retention. Original multi-account source access requires authority for every account present; an owning-account read grant must not expose another account's original rows.

The Account Ledger contains admitted brokerage evidence extracted from artifacts, with recoverable artifact/row lineage. Recent overlapping exports extend/match retained history rather than replacing it. Exact observed-row matching is not universal transaction identity, correction reconciliation or a lifecycle-completeness claim. Today's bounded slice does not implement those broader semantics.

Synchronization inventory is backend-owned. A client may discover local files, recognize supported export envelopes, hash bytes and sequence submissions; it may not maintain an authoritative local imported-file manifest or reconcile brokerage/domain state. File-processing completeness and brokerage-history coverage remain separate conclusions. `SYNC COMPLETE` establishes every eligible discovered content artifact was durably persisted and processed; missing/failed work is `SYNC INCOMPLETE`. A history-gap assertion requires independent ledger evidence; otherwise coverage remains explicitly unknown.

### Canonical resource identity and Account discovery — Principal correction, October 11, 2026

Persistence technology, resource identity, authorization and URI hierarchy are separate concerns. V2 resource IDs are immutable and opaque. Account IDs are generated by the backend and remain stable across alias/display-name changes; IDs carry no authority. REST never accepts Account aliases interchangeably with IDs. CLI friendly aliases resolve through backend discovery. Account metadata exposes ID, alias, display name and broker association.

Resources have independent canonical routes where their semantics support them. Account relationships belong in representations; foreign keys do not justify Account-nested URIs. Authorized-scope collections may accept an optional canonical Account ID filter that narrows, never expands, caller scope. Nest only when the domain capability genuinely describes that resource: original content and processing attempts concern an exact immutable Artifact. Existing canonical quote subject-selection routes retain their semantic capability purpose; this bounded slice does not redesign them around database ownership.

Today's slice uses Account discovery/detail, independent Positions/artifacts collections and independent Artifact detail/content/processing-attempt capabilities. Authentication establishes caller identity; backend grants determine Account/resource visibility. Exact grants are keyed by immutable Account IDs; discovering or guessing an ID is not authorization. No alias-path compatibility fallback is permitted.

### Account identity, operator nicknames and account-number confidentiality — Principal ratification, October 11, 2026

The Principal ratifies the following bounded Product and security requirements for API v2 and its operator clients:

1. **Canonical identity:** Each Account has one immutable, globally unique, randomly generated GUID, independent of brokerage account number, brokerage association, nickname and display name. The Principal's intended representation is a **standard unprefixed UUID**, not an `acct_` or brokerage-prefixed string. The existing `acct_` + random hexadecimal implementation substantially satisfies identity semantics but differs in representation; this ratification does **not** authorize or require immediate migration. Existing IDs, grants, evidence references and identity namespaces must not be silently rewritten.
2. **Operator interaction:** Operators must never be expected to know, memorize, copy, resolve manually, or type the GUID. Human-facing Account selection uses nicknames such as `pts` and `sawdust`. Clients resolve nicknames through backend-authoritative Account discovery; no client-local authoritative alias registry. Nickname changes preserve Account identity, retained evidence, Position relationships, authorization and brokerage association. Unknown/ambiguous names fail safely with human-usable guidance, never a demand to supply a GUID. Machine-facing REST continues to use canonical Account IDs; this is not an alias-as-REST-ID mandate.
3. **Account-number confidentiality:** Actual brokerage account numbers are sensitive, broker-scoped attributes, not canonical resource identities. Wheelwright API resource paths, query parameters and generated resource links must never expose raw account numbers or reversible encodings of them. Upstream brokerage integration requests are a separate boundary. Appropriate authorization is required to disclose full numbers in payloads; the precise disclosure capability is **unresolved** and must not be inferred from ordinary metadata access. Ordinary human-facing output, including tables and redirected TSV, masks account numbers by default (at most last four visible). Distinguish `maskedAccountNumber` / `accountNumberLast4` from full `accountNumber` in future representation decisions. Account ID possession grants no access; existing backend User–Account grants continue to govern.
4. **Current implementation and disposition:** Accepted `ww sync account pts` / `ww show positions --account pts` already resolve nicknames through backend discovery. `ww ls accounts` default full-number rendering violates the masking requirement and is tracked as **BUG-035**, Open at this ratification. *(Later state: BUG-035 was remediated under separate Principal authorization and is **Resolved** as of October 11, 2026; the BUG-035 record and `docs/bugs/INDEX.md` own its current status. This note does not alter the ratified requirement.)* Filing/ratification does not authorize remediation. The `acct_` representation difference is non-blocking and deferred pending a separately justified compatibility/migration decision.

**Explicitly outside this ratification:** Account–Brokerage resource/association design, Fidelity/tastytrade admission, Position occurrence, Account-first versus Position-first sequencing (still UNDECIDED under `PL-CONV-01`), and the separate User-isolation / administrator-exception discussion (held for later ratification). Existing many-to-many User–Account authority is not silently changed here. No source, API, schema, CLI, test, or migration implementation is authorized by this ratification.

**Provenance:** Principal confirmation in the October 11 `PL-CONV-01` 3AM reconciliation following Codex's bounded Account review; `docs/bugs/BUG-035-ww-accounts-exposes-full-broker-account-numbers.md`.

### User identity and Account access — Principal clarification, October 11, 2026

Authentication tokens identify a User with a stable, immutable backend-generated opaque User ID, independently of Account identity. Backend authorization explicitly establishes many-to-many User–Account capability relationships. Neither an Account/resource ID, an alias, Account ownership nor client filtering establishes User identity or permission. Credential rotation preserves User identity; credentials for one User share the same backend authorization state.

First-class User resources are `GET /v2/users` (administrator-only discovery), `GET /v2/users/{userId}` (administrator-only inspection) and `GET /v2/me` (the authenticated User’s own identity). Administrative privilege must be explicitly established and enforced by the backend. A User name, Account access or knowing a User ID implies no administrative authority. Administrator-only identity inspection does not automatically confer financial Account access. Independent resource identities and semantic URI hierarchy remain; aliases serve operator-friendly resolution only. This bounded implementation adds no User-management CRUD or general permissions framework.

### Account information isolation and administrative financial access — Principal ratification, October 11, 2026

**Principal-selected Model A (explicit Account grants).** Private Account-related information is inaccessible by default. Authentication establishes a User; backend authorization requires the appropriate explicit User–Account capability grant for every Account-related read or mutation. This applies to Accounts, Positions, balances, orders, executions, retained evidence and artifacts, and future objectives, Program associations, evaluations and recommendations. Knowing a GUID or nickname, changing an Account filter, or client-side hiding does not grant authority. Collections must restrict to authorized scope; instance operations enforce object-level grants.

**Intentional sharing and administrative exception:** Multiple Users may access the same Account only when each has explicit backend grants for the relevant capabilities. An administrator may access another User's financial Account data only with appropriate Account grants. `users.admin` alone authorizes User inspection, **not** financial Account inspection. No blanket financial-administrator bypass is selected; broad financial-admin Models B/C are deferred pending demonstrated Product need. Ownership and access remain distinct.

**Original brokerage artifacts fail closed:** Disclosure of original source bytes requires established and sufficient authority for **every represented source Account**. Unknown, incomplete or unrecognized source scope is **not** evidence of owner-only scope and must not authorize original-byte retrieval. Rejected semantic processing does not relax disclosure rules. **BUG-036** documents a synthetic counterexample in which an unrecognized leading-space mixed-account header led to unauthorized original-byte disclosure. The defect was subsequently corrected and independently verified under separate Principal authorization on October 11, 2026; see its canonical record. This ratification itself did not authorize remediation.

**Authentication technology:** Continue existing controlled-local Bearer authentication while suitable. For exposed interactive deployment, prefer established off-the-shelf OIDC-compatible authentication and standard framework validation, mapping validated external issuer/subject identity to stable Wheelwright User identity while preserving backend Account grants. No vendor, production flow, custom IAM framework or implementation is selected by this ratification.

**Scope:** This section ratifies Product/security behavior and Model A, not a new Account ownership schema, new permission framework, or changes to current User/Account IDs. Further API capabilities inherit the boundary but must define their own required read/write grants when introduced. No code, API, schema, security configuration, migration, bug fix or test modification is authorized solely by this document.

## 3. Security from inception

API v2 MUST include a security boundary from inception.

Conceptually:

**request -> authentication / identity establishment -> authorization policy -> v2 capability**

Capabilities receive established caller identity/authority context rather than depending directly on a cloud-vendor authentication mechanism.

Localhost MAY use an explicitly configured trusted-local authentication mode that establishes a well-known local principal through the same security boundary.

Deployed environments MUST fail closed unless an approved authentication mechanism is configured. A generic production-capable security-off switch is not an acceptable deployment posture.

The production authentication mechanism remains an open design decision. Render or another deployment platform may later participate in authentication without defining v2 capability semantics.

Authorization boundaries should inform capability design where authorities differ. OAS must represent the real security requirements.

## 4. Uniform error grammar

V2 MUST define one consistent machine-readable error model and use it across capabilities.

The model should provide stable programmatic identity for an error, a human-readable explanation, relevant subject/resource context when applicable, and retry guidance where Wheelwright can state it truthfully. Request/operation correlation should be available for diagnosis.

The precise wire standard remains a design choice; established standards such as HTTP Problem Details should be preferred over inventing an equivalent private convention when they fit.

Endpoint-specific ad hoc error envelopes are not acceptable without a demonstrated semantic need.

## 5. Request and operation correlation

Every v2 request MUST be traceable through the work it causes.

Correlation should permit an operator or developer to connect a client invocation to backend handling, provider acquisition attempts, persistence/publication consequences, and logs where those stages occur.

A longer-lived acquisition/work operation may require identity distinct from the individual HTTP request that initiated or inspected it. The concrete request-ID/operation-ID mechanism remains to be designed.

## 6. Explicit temporal semantics

V2 MUST use explicit, consistently named time semantics.

Market evidence can involve materially different times, including provider observation time, Wheelwright acquisition/receipt time, commit/persistence time, publication time, and operation time. A generic ambiguous `timestamp` must not collapse distinct meanings.

Wire time representation must be unambiguous and timezone-safe. The exact canonical field set is capability/evidence-model work, not selected here.

## 7. Consistent provenance

V2 MUST define a common provenance vocabulary for canonical evidence rather than allowing each capability to invent one.

Where applicable, provenance must be sufficient to understand the origin and authority of evidence, including provider/environment identity, observation/acquisition context, authority/fencing information, and whether a result represents newly acquired evidence, reusable held evidence, or retained prior evidence after a failed reacquisition.

The exact provenance schema remains to be designed.

## 8. Stable domain/resource identity

V2 MUST give domain evidence and operations stable, unambiguous identities independent of client presentation and provider transport mechanics.

Examples of identity dimensions may include an underlying quote subject, an underlying-plus-expiration chain subject, or a specific option contract. These examples do not select URI shapes.

Stable identity should support caching/reuse decisions, provenance, tracing, composition, and future evolution.

## 9. Repeatability and idempotency semantics

Every operation MUST have explicit repeatability semantics.

Clients must be able to know whether retrying after a timeout or transport failure is safe and what repeated execution means. Where true idempotency keys or deduplication are required, they should be designed explicitly rather than inferred.

Not every acquisition request must be free of renewed external observation; the requirement is truthful, documented repeatability semantics.

## 10. First-class partial success

V2 MUST model partial success explicitly wherever an operation addresses multiple subjects/evidence units or upstream behavior can succeed incompletely.

HTTP success alone must not imply that every requested subject was acquired successfully.

The contract must permit clients to distinguish outcomes such as success, failure, unavailable/missing evidence, and retained prior evidence where those distinctions are real. Outcome identity must reconcile by subject/evidence identity rather than response position.

This is especially important because provider batch transport can return HTTP 200 while reporting unmatched subjects.

## 11. Honest completion semantics

V2 MUST make completion semantics explicit.

A synchronous operation must define what has completed when its response is returned. If work can legitimately continue beyond the initiating request, the API must not present a client timeout or bounded wait as though it were the final operation outcome.

Where asynchronous or inspectable operations are appropriate, they must have explicit operation identity and status semantics. This guardrail does not mandate asynchronous design merely because work is slow.

## 12. Collection conventions

V2 MUST define common conventions for collections before individual capabilities independently invent pagination, limits, continuation, ordering, or collection metadata.

Capabilities that do not need pagination should not be forced into unnecessary machinery. Capabilities that can become large must not rely on accidental unbounded response behavior.

## 13. Filtering, sorting, and response projection

Where filtering, sorting, limiting, or field projection are supported, V2 SHOULD use consistent semantics across compatible capabilities.

**Acquisition scope and response projection are distinct.** Selecting fields in an API representation must not silently broaden or narrow the evidence acquisition that the requested capability semantically performs.

Likewise, client presentation is separate from API projection:

**acquisition scope -> canonical evidence -> API projection -> client presentation**

A `ww` display flag may therefore map to a projection or formatting choice without redefining the canonical evidence contract.

## 14. Compatibility and evolution discipline

V2 MUST define what constitutes a backward-compatible additive change and what requires a new contract/version boundary.

The policy must explicitly address at least schema field additions, optionality/nullability, enum evolution, error-code evolution, and semantic changes.

Clients should not be forced into lockstep deployment with the backend merely because the contract evolves additively.

## 15. Capability and service discovery

V2 SHOULD provide modest machine-readable discovery where runtime/provider/environment capability differences make it useful for clients to know what a Wheelwright instance supports.

Discovery must describe Wheelwright capabilities, not expose provider mechanics as the client abstraction.

This guardrail does not mandate HATEOAS or a generic dynamic API framework.

## 16. Health, readiness, and dependency state

V2 MUST distinguish materially different operational states rather than collapsing them into one generic health result.

At minimum, design must preserve the distinction between process/service liveness, readiness to serve the relevant Wheelwright contract, and upstream/provider availability or admission state where applicable.

Exact operational endpoints and deployment health-check mechanics remain open.

## 17. Upstream pressure and retry semantics

Because Wheelwright mediates constrained external providers, v2 MUST represent materially different acquisition impediments truthfully.

Clients should be able to distinguish, where known and useful, conditions such as provider unavailability, Wheelwright admission/rate pressure, delayed work, and terminal acquisition failure.

Retry guidance must be supplied only where Wheelwright can state it reliably. Provider-specific quota mechanics remain below the stable client contract unless they are intentionally exposed as diagnostic provenance.

## 18. Capability composition and bounded side effects

V2 capabilities should be small, domain-meaningful, composable, and reasonably predictable in scope.

A capability MUST NOT silently traverse a broader policy-selected graph of evidence merely because an existing workflow happens to need that graph.

Cardinality alone is not the problem: a named evidence unit may naturally contain many fields or entities. The guardrail is against hidden domain-policy expansion into additional evidence units not implied by explicit capability intent.

Higher-order Wheelwright workflows remain legitimate and may explicitly compose or orchestrate narrower evidence capabilities while preserving backend ownership of domain policy.

Provider batching, caching, admission, and other transport optimizations belong below stable Wheelwright semantics.

### Provider batching policy

When one semantic acquisition operation requires upstream observations for multiple subjects, and the active provider can acquire those observations together without changing Wheelwright evidence identity, per-subject outcome truth, authority/fencing, or other capability semantics, v2 SHOULD batch the compatible upstream work rather than dispatch avoidable sequential provider requests.

This policy applies regardless of how the subject set was selected. A bare client operation whose Product semantics resolve a default subject set and an explicit multi-subject operation are treated the same after semantic scope is resolved.

Semantic work is determined before transport grouping. Reusable held evidence need not be included in an upstream batch; subjects requiring upstream acquisition may be grouped together. Provider request-size limits or other legitimate transport constraints may require more than one batch, so this is a **batch if needed** policy rather than a one-round-trip guarantee.

Batch transport MUST NOT create a shared success boundary. Outcomes remain reconciled by requested subject/evidence identity, including partial success, unmatched subjects, retained prior evidence, and failures.

The stable API and clients MUST NOT depend on a particular provider request count or batch shape. Batching is an execution policy beneath the canonical Wheelwright capability contract, not a new evidence unit or client-visible acquisition meaning.

## 19. Acquisition, reuse, read, derive, and presentation

**Read-through facade default for ordinary domain reads — Principal clarification, October 13, 2026.** Clients request domain representations through GET and need not orchestrate brokerage acquisition, CSV import discovery, reconciliation or cache refresh to obtain a Position view. The backend may serve retained evidence or, under its separately authorized and bounded evidence policy, retrieve/admit new upstream observations while satisfying a GET. Such incidental internal persistence does not by itself make GET an unsafe client-requested mutation. GET MUST NOT initiate a trade, cancellation, broker instruction or other unsafe action on the client's behalf. Layer transparency does not imply guaranteed fresh brokerage evidence, a provider network call on every GET, or unlimited blocking latency. Source coverage, clocks, provenance, retained/stale status, upstream failure and independently unknown domain conclusions remain explicit.

Existing explicit acquisition endpoints and provider/session controls remain implemented contracts until separately reviewed. This read-through default **does not authorize** silently adding provider calls, expanding credentials or grants, changing GET latency/failure contracts, altering existing POST behavior, or bypassing evidence admission. A proposed read-through implementation must demonstrate bounded execution, authorization, source capabilities, fallback and compatibility before deployment. Where an acquisition request is genuinely a separately valued Product resource, it may be exposed with coherent identity and lifecycle; for the `ww show positions` monitoring Product, acquisition is internal machinery, not a client-facing Product resource.

V2 MUST distinguish acquiring/revalidating external evidence from merely reading held evidence and from deriving interpretations from evidence.

An acquisition request may be satisfied by reusable held evidence when the capability's acquisition policy permits it; **acquisition does not necessarily mean a provider network call**.

Wheelwright may reuse familiar HTTP cache semantics in spirit when they faithfully model evidence reuse/revalidation, while exposing operator-friendly client language. For example, a future `ww fetch --force` may request upstream reacquisition without requiring operators to understand HTTP cache-control terminology.

Exact acquisition-policy controls remain Product/API design work.

## 20. Conventional HTTP/resource grammar

**Uniform Interface and Layered System clarification — Principal, October 13, 2026.** The client should not need to distinguish a retained SQLite observation, upstream broker response or newly admitted CSV to use a Wheelwright domain resource. GET collection resources support search/filter/selection; query parameters may select documented projections. A projection is a representation of canonical domain facts, not an authorization to create client-specific domain authority. POST to a domain collection normally creates an instance of that same collection's resource type, with a coherent instance identity where one exists; the identity of the authorized initiating client is independent of the resource semantics. Standard HTTP also permits other POST semantics, but departures from the collection-create convention require an explicit domain rationale. Do not conflate an audit-record collection with a different operation/request collection just because both involve acquisition.

HTTP outcomes follow actual operation semantics: `201 Created` for completed creation (normally with a `Location`), `202 Accepted` for accepted but incomplete processing, and ordinary `200 OK` for successful GET representations. Neither POST nor provider communication implies asynchronous processing by itself. Preserve the common Problem/error contract. Backend evidence read-through caching is separate from HTTP response caching: use standard `Cache-Control`, `ETag`, conditional requests and `Vary` when appropriate, without exposing sensitive Account data through shared caches or making clients independent reconciliation authorities. Initial private Account financial responses may remain `private, no-store` while the backend retains evidence.

API v2 SHOULD follow established, widely understood HTTP/REST conventions wherever those conventions accurately express Wheelwright semantics. Wheelwright-specific HTTP conventions SHOULD exist only where standard conventions are inadequate or would misrepresent the domain.

Public URLs SHOULD be short, stable, human-readable, and resource-oriented. The URL names the Wheelwright domain resource rather than the internal capability implementation or a particular client's workflow.

The default resource grammar is:

- collection resources use plural domain nouns, for example `/v2/quotes`;
- an instance resource, when one genuinely exists with stable identity, is subordinate to its collection, for example conceptually `/v2/quotes/{symbol}`;
- singular resource names are reserved for resources that are inherently singleton in their context rather than used arbitrarily alongside plural collection names;
- path hierarchy expresses genuine resource containment or relationship rather than procedural workflow or backend execution stages;
- resource names SHOULD be nouns; standard HTTP methods SHOULD express operations when their defined semantics fit the Wheelwright capability;
- query parameters SHOULD select, filter, sort, limit, or project resources rather than encode procedural actions;
- structured request bodies carry operation input where appropriate, especially when POST semantics require more than collection selection;
- redundant routing vocabulary such as `/api`, client names, provider names, implementation mechanisms, and action nouns SHOULD NOT appear in public paths without a demonstrated semantic or deployment need;
- URLs SHOULD remain shallow unless deeper hierarchy represents a real domain relationship.

This is a convention, not REST dogma. V2 MUST deviate when following the convention would make the HTTP contract misleading or fail to express a real Wheelwright domain operation. Such deviation should be deliberate and justified by the capability semantics rather than convenience or implementation shape.

This convention complements rather than replaces the acquisition/read distinction. The same natural resource family may support different standard HTTP methods with different semantics when truthful: for example, a POST may acquire/revalidate quote evidence while a GET may read held quote evidence. This example does not by itself authorize either route.

### URI construction by clients — Principal rule, October 19, 2026

**Application code must not manually construct API URI path patterns.** Clients resolve canonical resource addresses through API-provided links, documented discovery, or generated/centralized contract-aware routing rather than concatenating path segments or reconstructing identifiers into URI templates. Given a resolved collection URI, clients may construct and encode documented **query parameters** for filtering, searching, sorting, and projection. Query parameters do not replace authorization, and a query is not an invitation to manufacture undocumented routes.

Example: discover an Instrument using the canonical Instruments collection with `?symbol=SPY`; follow its returned canonical resource link/identity rather than embedding a guessed Instrument path throughout client code. The ticker-based Quote lookup remains a supported current shortcut; its existence does not require clients to own route-construction logic. This is a **Principal-stated architectural direction for client development and future API reconciliation**, not a retroactive claim that current clients conform, not a ratified Instrument schema, and not permission to change operative contracts or software.

Client command vocabulary and HTTP vocabulary remain independent. A CLI verb such as `fetch` or `ls` may map naturally to conventional HTTP operations without requiring the API to expose the CLI command name. Likewise, anticipated client reuse is a useful pressure test but is not the justification for the resource grammar: the convention is selected because it is established, comprehensible, and compatible with one API serving many clients.

### Extensibility is a virtue; future-proofing is a vice — Principal clarification, October 19, 2026

**Design for extensibility, not speculative future-proofing.** Extensibility preserves clean boundaries and contracts so independently justified capabilities can be added or composed later. Future-proofing invents abstractions, complexity, and requirements for hypothetical needs that have not earned a place in the Product. Keep those distinct.

The `POST /v2/uploads` discussion illustrates the distinction: a clear Upload resource boundary and independently testable domain contracts can support future composition. Backend orchestration *may* use HTTP between domain capabilities or in-process application services; neither choice is ratified here. Evaluate the choice against present requirements, meaningful separation of concerns, independent contract testing, consistency, and operational cost. Do not mandate distributed services merely because they might someday scale, and do not dismiss HTTP orchestration solely as overhead. This principle-like clarification does not grant implementation authority or ratify a new REST resource.

## 21. Patterns not mandated by these guardrails

V2 should not adopt architectural machinery merely because it is fashionable or because the API is new.

These guardrails do NOT mandate:

- HATEOAS;
- GraphQL;
- CQRS;
- event sourcing;
- an API gateway;
- microscopic provider-shaped endpoints;
- REST noun purity at the expense of truthful domain semantics;
- asynchronous jobs for every acquisition;
- pagination where collections are naturally bounded;
- a particular production identity provider.

Any such mechanism requires its own demonstrated Wheelwright need.

## 22. Design review obligation

A proposed v2 capability must be reviewable against the applicable guardrails before implementation authorization.

The review should be able to answer, as applicable:

- What is the Product/domain capability and its stable subject identity?
- What acquisition or derivation does it perform?
- What side effects are inherent and predictable?
- How is it represented in authoritative OAS?
- What identity/authorization applies?
- What are its error and partial-success semantics?
- What times and provenance does it expose?
- How is the request/work correlated?
- What does completion mean?
- What happens when the request is repeated?
- What are its collection/filter/projection semantics?
- What upstream pressure/retry state can be represented truthfully?
- How can the contract evolve compatibly?
- Is any broader policy traversal explicit rather than hidden?

Not every question requires a unique field or mechanism on every capability. The obligation is that applicable cross-cutting semantics come from the common v2 grammar rather than being silently omitted or independently reinvented.

## 23. Authority boundary

These guardrails ARE selected architectural constraints for API v2.

They do NOT by themselves authorize:

- API v2 implementation;
- any particular v2 route/resource/schema;
- v1 behavior changes;
- `ww fetch` semantic changes;
- persistence changes;
- provider batching;
- scheduler/concurrency/timeout changes;
- a production authentication mechanism;
- a particular error wire standard;
- a particular async-operation design.

Specific Product semantics and capability boundaries still precede HTTP/OAS design.

CURRENT STATE: API v2 has a Principal-ratified cross-cutting architectural guardrail set, including authoritative OAS and security-from-inception.

DECISION REQUIRED: NO

NEXT AUTHORIZED ACTION: Continue semantic/provider reconciliation, then evaluate proposed v2 capabilities against these guardrails before implementation design.
