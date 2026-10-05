# API v2 Design / Implementation Handoff Checkpoint — 2026-10-05

Status: **Principal-selected working direction and implementation-handoff discipline; includes one explicit principle candidate that is not yet ratified as a governing principle.**

This checkpoint persists design reasoning selected after the API v2 architectural guardrails in Doc 77 and before the next Codex iteration. It prevents the implementation phase from inheriting unwritten assumptions from conversation.

It does not authorize API v2 implementation.

## 1. Implementation actor: Kiro

When API v2 reaches implementation, **Kiro is the intended implementation actor**.

This is a deliberate workflow choice. Kiro performs best when implementation authority is explicit and there is effectively nothing material left for the implementation actor to interpret.

Therefore API v2 must not be handed to Kiro with unresolved Product or architectural choices disguised as coding details.

The implementation handoff should be specification-driven rather than exploratory.

## 2. Required rigor before Kiro implementation

Before Kiro is authorized to write v2 implementation code, the authoritative design package should resolve, to the extent applicable to the authorized slice:

- Product semantics and capability boundaries;
- stable resource/evidence identity;
- HTTP resources, methods, parameters, and status semantics;
- authoritative OAS request/response schemas;
- authentication and authorization behavior, including trusted-local behavior for the relevant environment;
- canonical evidence semantics;
- time and provenance semantics;
- acquisition, reuse, and forced-reacquisition behavior;
- partial-success and error grammar;
- synchronous/asynchronous completion semantics;
- repeatability/idempotency semantics;
- persistence and publication consequences;
- collection/filter/sort/projection semantics where applicable;
- compatibility/evolution expectations;
- explicit acceptance criteria and representative specimens;
- prohibited scope and changes;
- implementation stop conditions.

This list does not require designing unrelated future capabilities before an incremental slice can be implemented. It requires eliminating material ambiguity inside the slice that is actually authorized.

## 3. Kiro must not silently resolve design ambiguity

The intended implementation contract is:

**Implement the already-decided contract. Do not make Product or architecture decisions while coding.**

If authoritative inputs are internally inconsistent, omit a required decision, or leave a material behavior ambiguous, Kiro should stop and report the ambiguity rather than selecting a behavior on the Principal's behalf.

A useful readiness test is:

**Do not hand a v2 slice to Kiro while further interpretation during implementation would itself constitute an unauthorized Product or architectural decision.**

Mechanical implementation choices that do not alter the authorized contract remain normal engineering work.

## 4. Codex role before implementation

Codex remains the independent investigator/reviewer/falsifier rather than the intended implementation actor.

Immediately before a v2 implementation handoff, Codex should be used to review the completed design package specifically for:

- contradictions with repository authority;
- semantic holes;
- unstated assumptions;
- inconsistent OAS/runtime expectations;
- missing edge/failure behavior;
- places where Kiro would have to guess;
- accidental expansion of the authorized slice.

Material ambiguities found by that review should be resolved and persisted before Kiro receives implementation authority.

This establishes the intended transition:

**investigate -> Product decisions -> architecture -> precise contract/OAS -> Codex ambiguity/falsification review -> resolve material ambiguity -> Kiro implementation -> acceptance**

## 5. Principle candidate: architecture without future prediction

The following is a **candidate principle**, worth preserving now but not yet ratified as a general governing principle:

> Wheelwright API v2 should be designed from observed client pressure and natural domain/resource granularity, using composability and extensibility as the hedge against an unknowable future rather than attempting to predict future client workflows.

The current reasoning has three parts.

### 5.1 `ww` is a design guide, not the API master

The `ww` CLI provides concrete pressure tests.

Real operator workflows expose whether a capability is too broad, awkward to compose, surprisingly expensive, or coupled to an unrelated workflow.

The CLI therefore guides API reconciliation through actual use.

It does **not** define the API schema, constrain the canonical response to what the terminal displays, or justify a CLI-specific backend. The target remains one API serving many clients.

### 5.2 Natural resource/evidence granularity guides capability boundaries

Capability boundaries should follow meaningful Wheelwright domain/evidence identities rather than hypothetical future screens or existing v1 workflow endpoints.

Examples under current investigation include underlying observations, expiration calendars, a chain identified by underlying plus expiration, contract observations, and higher-order Decision evidence/workflows.

These examples are boundary probes, not a ratified endpoint catalog.

The important test is whether the capability has a coherent subject/evidence identity and semantics, not whether it happens to match a current UI action.

### 5.3 Composability/extensibility replace prediction

Wheelwright does not need to predict every future client workflow if its capabilities have coherent identities, contracts, and cross-cutting semantics and can be composed without hidden policy traversal.

The architectural question is therefore not primarily:

**Will this API support a particular future thing we imagine today?**

A better pressure test is:

**Have we unnecessarily prevented a future client from composing these capabilities differently?**

This is not an argument for generic APIs. Extensibility does not mean replacing domain capabilities with a generic operation envelope such as `executeEvidenceOperation(type, params)`.

Strong, specific domain semantics plus consistent cross-cutting API grammar are the intended form of extensibility. A genuinely new capability can be added when evidence demonstrates the need.

## 6. Relationship to anti-prediction architecture discipline

This candidate principle is intentionally different from architecture by future prediction.

It does not authorize speculative abstractions, generic frameworks, or capabilities justified only by imagined future consumers.

The evidence sources for design remain concrete:

1. observed Product/operator pressure, with `ww` currently providing an especially useful proving surface;
2. natural Wheelwright domain/resource/evidence boundaries;
3. actual provider constraints and capabilities;
4. accepted Product behavior that v2 must preserve or explicitly supersede;
5. Doc 77's cross-cutting guardrails.

Composability and extensibility provide room for future evolution without requiring the future workflow to be known now.

## 7. Incremental design remains valid

The demand for rigor before Kiro implementation does not imply a requirement to design all of API v2 before writing any code.

A bounded v2 capability may proceed when its own semantics, interactions with common cross-cutting grammar, OAS contract, failure behavior, security boundary, and acceptance criteria are sufficiently resolved.

Later capabilities may extend the API under the compatibility/evolution discipline in Doc 77.

This is how rigor and non-predictive design coexist:

**be exhaustive about the semantics of the capability being implemented; do not speculate about capabilities that have not yet earned their existence.**

## 8. Authority relationship

Doc 77 remains the governing API v2 cross-cutting architectural guardrail set.

This checkpoint adds:

- the selected Kiro implementation-actor direction;
- the pre-implementation ambiguity-elimination discipline;
- the intended Codex falsification gate before implementation;
- the explicit incremental-design interpretation of rigor;
- the architecture-without-future-prediction principle candidate.

The principle candidate in Section 5 is deliberately not yet promoted to a general project foundation or ratified architecture principle. It should be pressure-tested during the next Codex/design iterations.

This checkpoint does NOT authorize:

- API v2 implementation;
- any v2 route or schema;
- a particular resource catalog;
- changes to v1;
- changes to experimental `ww fetch`;
- speculative future-client requirements.

CURRENT STATE: v2 cross-cutting guardrails are ratified in Doc 77; implementation is reserved for a later, highly explicit Kiro handoff; observed CLI pressure, natural resource granularity, and composability are the current candidate non-predictive design method.

DECISION REQUIRED: NO

NEXT AUTHORIZED ACTION: Continue the Codex semantic/provider investigation and use the persisted v2 guardrails plus this checkpoint as context; do not begin implementation.
