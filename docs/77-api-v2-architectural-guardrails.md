# API v2 Architectural Guardrails

Status: **Principal-ratified architectural guardrails**.

These guardrails govern the design of Wheelwright API v2. They are intentionally cross-cutting: they define qualities and semantic disciplines that every v2 capability must inherit without prematurely selecting concrete resources, routes, schemas, persistence structures, provider transports, or production authentication mechanisms.

They exist so v2 pays the architectural cost once rather than accumulating client-specific and endpoint-specific conventions that later require another API rewrite.

## 1. Governing principle

**Cross-cutting semantics are defined once for API v2 and inherited by capabilities rather than reinvented endpoint by endpoint.**

API v2 is a general Wheelwright API: **one API, many clients**. `ww`, the web client, and future clients may project and present the same canonical capabilities differently. No client's workflow or presentation grammar defines the API's domain model.

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

This mandate selects the v2 authority/placement boundary. It does NOT by itself select a storage technology, persistence schema, intake mechanism, resource/route shape, OAS schema, snapshot retention policy, or implementation decomposition.

## 2. Authoritative machine-readable contract

API v2 MUST expose and maintain an authoritative OpenAPI Specification (OAS).

The OAS describes the actual runtime contract rather than serving as post-hoc documentation. It must faithfully represent applicable request and response schemas, status and error shapes, parameter semantics, optionality/nullability, security requirements, and other externally observable HTTP behavior.

OAS does not define Wheelwright's domain decomposition. Capability boundaries are selected from Product/domain semantics first and then represented faithfully in OAS.

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

V2 MUST distinguish acquiring/revalidating external evidence from merely reading held evidence and from deriving interpretations from evidence.

An acquisition request may be satisfied by reusable held evidence when the capability's acquisition policy permits it; **acquisition does not necessarily mean a provider network call**.

Wheelwright may reuse familiar HTTP cache semantics in spirit when they faithfully model evidence reuse/revalidation, while exposing operator-friendly client language. For example, a future `ww fetch --force` may request upstream reacquisition without requiring operators to understand HTTP cache-control terminology.

Exact acquisition-policy controls remain Product/API design work.

## 20. Conventional HTTP/resource grammar

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

Client command vocabulary and HTTP vocabulary remain independent. A CLI verb such as `fetch` or `ls` may map naturally to conventional HTTP operations without requiring the API to expose the CLI command name. Likewise, anticipated client reuse is a useful pressure test but is not the justification for the resource grammar: the convention is selected because it is established, comprehensible, and compatible with one API serving many clients.

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
