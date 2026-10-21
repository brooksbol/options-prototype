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

## Principal clarification — API as an independent Product (October 20, 2026)

**Standing:** Principal-accepted architectural clarification reinforcing the existing ratified holistic domain-first API principle; not a separately ratified principle, new implementation permission, or requirement to preserve alpha API compatibility.

**Principal wording (conversation, October 20, 2026):**

> one more thing on this point: a clean domain model supports extensibility and scalability and ultimately enhances usability if you think of the API itself as a product, separate from any client.

The Principal then explicitly requested that this be written down. In the immediately preceding discussion, the Principal also stated:

> the current v2 is an alpha. we have no compatability constraints. we don't have to explain anything to anyone but ourselves at this point. i reject any sunk cost argument.

**Design consequence (interpretation of the clarification):** Evaluate Wheelwright's public API as an independently usable Product. A coherent financial domain model, clear resource identity, composable relationships and client-independent representations should support extensibility, scalability and usability across CLI, graphical and agentic consumers. The accepted `tt live` experience is an essential Product precedent but its constrained one-row Unicode projection must not limit the domain's exact financial meaning or API representation. Existing alpha v2 routes/schemas/code are implementation evidence and potential reuse, not a backwards-compatibility veto. Preserve authoritative financial evidence, correct semantics and relevant source history; reject features that entrench accidental alpha semantics or optimize only for a single screen.

**Reconciliation:** This clarification strengthens the existing Principle and the ratified API v2 guardrails in `docs/77-api-v2-architectural-guardrails.md` (one API, many clients; backend authority), without adding a second duplicate principle to `docs/principles.md` or independently ratifying a new Product Principle. It informs the ongoing API v2 adversarial-review dispositions, especially Codex Finding 5, whose proposed compatibility obligation was rejected by the Principal for alpha v2. No application code, OAS, or API resource contract is changed by this note.
