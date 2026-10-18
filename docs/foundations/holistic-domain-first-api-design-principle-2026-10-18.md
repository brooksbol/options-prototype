# Holistic Domain-First API Design — Principal Architectural Principle

**Status:** Principal explicitly established this as a principle on October 18, 2026, during the 4AM v2 API design review.
**Family:** Architectural / build.
**Scope:** Wheelwright public domain API design, especially v2 and future capability additions.

## Principle

**Design and assess the API holistically against Wheelwright's domain model and intended capabilities, not myopically around the feature being implemented at the moment.** A locally convenient endpoint must not become the organizing assumption for the public API. Evaluate the overall resource topology, coherent domain identities, relationships, collection/instance semantics and URI patterns before approving additions that may distort the domain facade.

## Principal provenance

The Principal stated on October 18, 2026:

> this is a decent step in the right direction. we're thinking holistically about the domain model, not myopically about some feature we're trying to implement in the moment. this is another principle that we need to persist. this the the right way to think about api design.

The same session established: "The principal can detect design flaws in a rest api just by looking at the uri patterns." See `docs/foundations/principal-rest-uri-design-review-intent-2026-10-18.md`.

## Design/review test

Before introducing or expanding an API resource, assess the proposed URI in the context of the **whole current and intended domain resource model**. Ask what domain entity or relationship the URI identifies, whether the collection and instance semantics are faithful, whether it leaks a provider/client/acquisition workflow, and whether adjacent resources compose without competing identities or authority. Begin with a URI-topology critique; use code/contract inspection to validate—not substitute for—that architectural reasoning.

This principle does not mandate a resource for every ontology noun, identical URI nesting, a wholesale API replacement, or a pause in working-software delivery. Apply alongside Doc 77, Doc 82, and the October 13 REST reconciliation.
