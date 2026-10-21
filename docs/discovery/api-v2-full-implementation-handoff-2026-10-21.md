# API v2 full implementation handoff — specification first, ww live second (2026-10-21)

**Standing:** Principal-directed execution planning / implementation handoff. The Principal explicitly clarified: **"i want to implement the API to spec before moving on to ww live. not just the parts that ww live needs."** This supersedes any earlier incremental-only or early `ww live` delivery sequencing suggestions. It does not bypass repository actor/experiment gates, production deployment authorization or independent verification.

## Stage gate and objective

**Stage 1: implement the entire Principal-accepted foundational API v2 specification**, not merely the fields consumed by `ww live`. Deliver every in-scope route, schema, financial/domain relationship, error/evidence semantics, persistence/integration obligations, authorized read/projection behavior and applicable functional test. `ww live` implementation is **not authorized as part of this stage**. Obtain independent verification and Principal acceptance of the implemented API before beginning Stage 2.

**Stage 2: ww live** consumes the completed and verified API v2 without owning brokerage acquisition, Construction recognition, valuation or management semantics. Product proof remains accepted `tt live` plus multi-Account conventions; exact presentation stays client-owned.

## Accepted specification baseline

- Principal acceptance of the *architectural/specification baseline with conditions*: `docs/discovery/api-v2-specification-acceptance-checkpoint-2026-10-21.md`.
- Candidate commit **local-only at last report**: `a32c7c79a059cc58d5262cf3e30c520d2e087825` on `codex/api-v2-final-correction-2026-10-21`.
- Local worktree: `/Users/bollich/kiro/options-candidates/api-v2-final-correction-2026-10-21`; typed candidate: `docs/reviews/api-v2-foundational-contract-2026-10-20/openapi.json`; read README, schemas, all examples, source matrix, runtime invariants and Kiro reports.
- Candidate had 294 deterministic specification checks independently reproduced by Kiro (as reported by Principal). This is **not** evidence of implemented API or runtime enforcement.
- Current alpha operative OAS is described by `docs/api-v2/README.md`; no backward-compatibility obligation where it contradicts accepted target semantics. Preserve legitimate broker evidence and accepted behaviors.

## Mandatory three entry corrections

Before calling the accepted OAS mechanically coherent or using its defective examples as implementation authority, close these and independently verify:

1. Regenerate six template-derived Position examples from their own evidence and constituent data. Repair contradictory warnings, economics/payoff availability, and `asOf` of gross/net/fees to represent evaluation time.
2. Redacted Order-derived metrics MUST NOT leak opening time through `asOf` or other metadata. Update schema, projections and negative authorization fixtures/tests, then test running server enforcement later.
3. Reconcile competing coverage claims (two calls drawing on 100 shares) both at Account-level totals and affected Position states; use accurate field pointers and distinguish economic coverage from broker-asserted reservation. Do not build operator association/tax-lot machinery without demonstrated need.

## Full specification implementation scope

Create a contract-to-implementation inventory from every **accepted in-scope** path, verb, schema, projection and behavioral invariant in the typed candidate. Treat explicitly open/deferred capabilities as out of scope rather than arbitrarily deciding them. For each route and major property map current status (implemented/partial/missing), dependency, source and validation; finish all accepted scope, not merely `tt live` parity.

Includes wherever the accepted candidate defines them: User/token-root authorization and Account grants; Account and independent broker holdings/snapshot discovery and retrieval; source Artifacts/import attempts and evidence provenance; Position collection/instances with GUID and terminal CLOSED; immutable Construction instances and exact versioned, write-once Models with predecessor navigation; constituents (cash/long shares/options/nested); unclassified recognition; financial sign/price-unit semantics; exact payoff geometry and qualified evaluation; current/original/cumulative roll/protection/LEAPS economics where supported; read-only Orders/source fills/working statuses; transaction source views; underlying/option quotes and provenance/freshness; account-wide conservation/collateral/coverage distinctions; structured incomplete warnings; scoped collection projections; Audit where in accepted contract; standard HTTP error semantics and source-specific operational outcomes.

**Not authorized merely by full implementation:** first-class Execution resource if still open, Portfolio membership if deferred, arbitrary Strategy/Regime engine, margin support, automatic trades or broker Order submission, tax-lot assignment or a universal securities master, or implementation of invented unsupported source facts.

## Definition of API implementation done

1. Every accepted route in the candidate OAS is implemented or explicitly excluded with documented Principal-approved scope reason; no missing routes silently recategorized as "not needed by ww live."
2. All response/request schemas and statuses match the implementation and are represented faithfully in operative OAS; versioned immutable resources, field-level authorization, evidence warnings and qualified unavailable values work end to end.
3. Real backed persistence/retrieval and scoped cross-resource identities validated; current and historical broker holdings observable independently of interpreted Positions.
4. Contract examples and source-derived fixtures internally coherent; negative probes test unsupported association, malformed contract/economic units, Account-wide overclaims, no synthetic fills, missing market history, and source quality.
5. Runtime Account grants and redaction verified by negative authorization tests, not only OAS assertions.
6. Broker-adapter and historical/evidence coverage declared honestly: unavailable source evidence remains explicit UNKNOWN and warning, not a missing implementation disguised as filled data.
7. Full deterministic schema, service, integration, financial invariants and regression suites pass. Independent Kiro architectural/runtime review and Principal acceptance are separate.
8. No premature deployment/installation or `ww live` start before the gate is satisfied.

## Delivery process and proof

Use bounded internal milestones (entry corrections → contract inventory/implementation plan → full backend implementation → verification → independent review → Principal API acceptance), but **milestones are not scope truncation**. Reuse code that fits; retire incorrect alpha assumptions. Resolve repo task, change and experiment permission gates before editing. Protect candidate and unrelated worktrees. No live brokerage mutations; get separate approval for any operational acquisition or deployment.

Only after completed API acceptance should work on `ww live` begin.

## Subsequent client migration and acceptance — Principal clarification (October 21, 2026)

**Principal direction:** “subsequent acceptance of the new ww BE v2 API will be retrofitting existing ww tools to the new API and assuring that there's no duplicated logic in those ww cli tools. we'll start with ww live, and perhaps retrofit the others concurrently”.

This adds a **distinct post-backend acceptance/delivery phase** without narrowing the prior full-spec API implementation requirement. Sequence: (1) implement the complete accepted backend v2 API and verify its behavior, (2) verify/accept the backend API as ready for client integration, (3) begin `ww live` as the first WW CLI consumer and selectively retrofit other existing `ww` commands, potentially concurrently where isolated execution and regression verification permit, (4) verify and accept the resulting WW CLI integration and de-duplication of business logic. Do not pronounce all-client migration complete based solely on API acceptance.

**Non-duplication invariant:** WW CLI clients own command parsing, interaction and rendering, not source acquisition authority, Position/Construction recognition, brokerage normalization, association and reconciliation, valuation, P/L, roll-history financial interpretation, management semantics or evidence qualification. Locate existing client-side financial logic and replace it with v2-sourced results rather than leaving competing calculations in place. Preserve accepted operator-facing behaviors (`ww positions`, `ww pull`, history, etc.) as applicable; differences require explicit evidence, not automatic compatibility to obsolete alpha backend semantics. A client-specific exception must be justified and exposed for review.

**Acceptance proof:** inspect every migrated command’s data flow, test equivalence to relevant accepted Product specimens, demonstrate client outputs are sourced from authorized v2 resources with no parallel authoritative financial logic, test incomplete/stale evidence and multi-Account authorization, and independently verify the resulting commands. The order and concurrent scope of additional tool retrofits remain scheduling choices, not blanket authorization for uncontrolled simultaneous rewrites.

**Explicit acceptance exclusion — Principal, October 21, 2026:** The **v1 web UI is outside this API v2 and WW CLI integration acceptance boundary**. Do not refactor, retrofit, test for migration acceptance, or require parity for the v1 web UI as a condition for accepting the new backend API or migrated `ww` commands. Existing v1 web UI operation, migration and decommissioning are separate future work and are not implied by this handoff. References to multi-client architecture describe the API's independent design capability, not a mandate to migrate the v1 web UI now.
