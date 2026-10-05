# PL-API-02 — HTTP Boundary Classification (Backend API Representation Survey)

**Date:** October 5, 2026
**Status:** Current Specialized Reference (Category E) evidence under `PL-API-02`. Investigative classification of the backend HTTP surface, not ratified architecture, not an implementation backlog, not defect authority. It is an **input to the strategic/architectural reconciliation of `PL-API-02`**, not a reconciliation and not an OAS design.
**Intake record:** `docs/parking-lot-10.md` → `PL-API-02` (Machine-readable HTTP contract and explicit API-boundary semantics).
**Frozen contract referenced:** `docs/contracts/evidence-snapshot-v1.md` (unchanged by this document).
**Investigation baseline:** `main` @ `2c49b26`.
**Mode:** Read-only investigation. No DTO creation, annotations, springdoc, OAS file, or cleanup was performed to produce this evidence.

---

## Purpose and method

`PL-API-02` asks two coupled questions. The second is:

> For each weakly typed HTTP boundary, is the weak typing **required by contract/serialization semantics**, a **justified implementation choice**, or **incidental architectural debt**?

This document answers that question for every mapped HTTP handler in the Java backend, so the answer is not lost to memory or reconstructed incorrectly during later reconciliation.

**Method.** All 16 `@RestController` classes under `evidence-service-java/src/main/java/com/wheelwright/evidence/` (including `production/`) were read at the investigation baseline. For each of the 30 mapped handlers the survey traced: the declared Java return type, the actual observable response shape, the serialization mechanism (hand-built `StringBuilder` vs framework Jackson vs Jackson-over-record), the direct HTTP-path test (if any), the discoverable reason for weak typing, a classification, and whether changing the Java type would alter observable HTTP semantics. Record declarations were confirmed in `db/SqliteEvidenceStore.java`, `provider/ObservationRecorder.java`, and `production/ProductionResponse.java`. Direct HTTP-path test presence was located by searching `src/test/java` for each literal `/api/...` path.

**The headline conclusion:** weak typing in this backend is **heterogeneous, not one architectural defect.** The surface already embodies several legitimate representation patterns, and conflating them would be an error.

---

## Classification vocabulary

| Code | Meaning |
|------|---------|
| **CR** | **Contract-required.** The hand-serialization or weak type is load-bearing for observable semantics (presence/absence, null-vs-zero, ETag identity, lifecycle distinctions). Changing it risks changing the contract. |
| **JIC** | **Justified implementation choice.** The weak type is reasonable and not strictly required; there is no debt signal (e.g. genuinely dynamic maps, cache-of-serialized-string coupling). |
| **DEBT** | **Incidental / accidental weak typing.** No semantic reason; the API shape is implicit and could be made explicit with no observable change. |
| **UNC** | **Uncertain.** Needs an explicit design decision in reconciliation — typically because present-vs-absent or null semantics are involved. |
| **TYPED** | The Java type already describes the body (record/POJO via Jackson). Not weak; listed for completeness. |

**"Changing Java type alters observable HTTP semantics?"** asks whether swapping `String` / `Map` / `?` for a typed DTO would change bytes, headers, status, field order, or null-vs-absent behavior that a consumer can observe. **YES / Partial / NO.**

The four legitimate representation patterns the survey distinguishes (the point the Principal flagged as materially changing the view of the API):

1. **Exact hand-controlled contracts** where presence / null / ETag semantics matter (CR).
2. **Dynamic-map responses** where a fixed DTO is not naturally better (JIC).
3. **Ordinary Jackson-serialized records** that are already typed (TYPED).
4. **Incidental type erasure** around otherwise-typed responses (DEBT) — e.g. `ResponseEntity<?>` wrapping a real record only to union with a `404`/`{error}` branch.

---

## Matrix — all 30 handlers

### Evidence / read endpoints

| # | Endpoint | Java return type | Actual response shape | Serialization | Contract / tests | Reason for weak typing (if discoverable) | Classification | Changing type alters observable HTTP semantics? |
|---|----------|------------------|-----------------------|---------------|------------------|-------------------------------------------|----------------|-----|
| 1 | `GET /api/evidence/snapshot` | `ResponseEntity<String>` | Large evidence snapshot object (`apiVersion`, `generation`, `coverage`, `symbols[]` with nested chains/greeks/provenance/admissibility) | **Hand-built** `SnapshotBuilder.buildSnapshotJson` | **Frozen** `contracts/evidence-snapshot-v1.md`; `SnapshotControllerTest` | Deliberate: null-never-zero, additive-only field evolution (ADR-015, BUG-020, greeks, IV, Issue #16), ETag identity, `X-Generation`/`X-Payload-Bytes`, `304` conditional | **CR** | **YES** — generated DTO would risk reordering/absence and null-vs-0 the frozen contract pins |
| 2 | `GET /api/evidence/quotes` | `ResponseEntity<String>` | `{generation, generatedAt, quotes[]}`; nested `observation` (null-or-object) + `acquisition` | **Hand-built** StringBuilder | `QuotesControllerTest`; shares `holdsRequestedPrice` gate | Deliberate: `observation: null` vs object is load-bearing; `previousClose` null-never-0; custom `quotes-<fp>-gen-N` ETag + `304` | **CR** | **YES** — observation null/object switch and ETag are observable |
| 3 | `GET /api/evidence/history` | `ResponseEntity<String>` | `{histories: {SYM: [{price, observedAt}]}}` | **Hand-built** StringBuilder | No direct HTTP-path test (store `getSpotHistory` tested) | Dynamic symbol-keyed map; truthful "only what was observed"; `Cache-Control: max-age=30` | **UNC** → leans **JIC** | **Partial** — map-of-dynamic-keys resists a fixed schema; low risk but no test pins it |
| 4 | `GET /api/evidence/history/all` | `ResponseEntity<String>` | Same shape as #3, whole-universe | **Hand-built** (shared builder with #3) | No direct HTTP-path test | Same as #3 | **UNC** → leans **JIC** | **Partial** — same as #3 |
| 5 | `GET /api/evidence/timesales` | `ResponseEntity<String>` | `{generatedAt, series: {SYM: [{close, time}]}}` | **Hand-built** StringBuilder | No direct HTTP-path test | Dynamic symbol-keyed map; per-symbol TTL cache stores pre-serialized JSON fragments (`Cached.barsJson`) — serialization coupled to caching | **JIC** | **Partial** — cache holds raw JSON strings; a DTO forces re-architecting the per-symbol cache |
| 6 | `GET /api/markets` | `ResponseEntity<String>` | `{generatedAt, indices:[{symbol, label, last, change, changePercent, prevClose, observedAt, intraday[]}]}` | **Hand-built** `toJson(Map)` + StringBuilder | No direct HTTP-path test | Null-never-fabricated fields on provider failure; whole payload cached as a JSON string (TTL) | **JIC** | **Partial** — nullable DTO expresses nulls fine; cache-of-string is the coupling |
| 7 | `GET /api/evidence/monitored` | `ResponseEntity<Map<String,Object>>` | `{symbols[], count, meaning}` | **Jackson** on `Map` | No direct HTTP-path test (`getMonitoredSymbols` tested) | Small fixed-shape map mixing `List`/`int`/`String` | **DEBT** (mild) | **NO** — a 3-field record serializes identically |

### Status / health / measurement

| # | Endpoint | Java return type | Actual response shape | Serialization | Contract / tests | Reason for weak typing | Classification | Changing type alters observable HTTP semantics? |
|---|----------|------------------|-----------------------|---------------|------------------|------------------------|----------------|-----|
| 8 | `GET /api/status` | `Map<String,Object>` | Deeply nested diagnostics: `session`, `scheduler`, `schedulerTelemetry`, `evidence`, `multiDteSurface`, `monitoredPositions`, `decisionCoverage`, `weeklyRefresh`, `providerAvailability`, `cache`, `pacer`, + **conditionally present** `openingExperiment`, `cycleTiming` | **Jackson** on hand-assembled `LinkedHashMap` tree | `StatusControllerTest` | Aggregates ~12 subsystems; some keys **conditionally added** (present-vs-absent is meaningful); `session` is backend-authoritative (Issue #16) | **UNC** (mix JIC + DEBT) | **Partial** — conditional-key presence must be preserved; naive DTO would emit nulls instead of omitting keys → observable change |
| 9 | `GET /api/health` | `Map<String,String>` | `{status: "up"}` | **Jackson** `Map.of` | `StatusControllerTest` | Trivial 1-field response | **DEBT** (trivial) | **NO** |
| 10 | `GET /api/measurement/provider-events` | `Object` | Measurement event page from `pacer.getMeasurementEvents` | **Jackson** on returned object | Referenced in `StatusControllerTest` | `Object` erases an already-typed return; opt-in measurement plane | **DEBT** | **NO** — underlying object already typed; `Object` is gratuitous erasure |
| 11 | `POST /api/measurement/after-hours-provider-run` | `Map<String,Object>` | `{status, startedAt, completedAt, symbol, requested, completed, durationMs, responseCharactersDiscarded, requestLimit, windowMs, startsInWindow, nextAdmissionInMs, evidencePersisted, cacheMutated}` | **Jackson** `LinkedHashMap` | No test; **gated by `@ConditionalOnProperty`** (absent unless opted in) | Fixed-shape measurement result; `409` via typed exception | **DEBT** (mild) | **NO** — fixed keys; a record serializes identically |

### Governed decision / context / continuity (durable records)

| # | Endpoint | Java return type | Actual response shape | Serialization | Contract / tests | Reason for weak typing | Classification | Changing type alters observable HTTP semantics? |
|---|----------|------------------|-----------------------|---------------|------------------|------------------------|----------------|-----|
| 12 | `POST /api/governed-decision` | `ResponseEntity<Map<String,Object>>` | `{status, decisionId, recordedAt}` or `{error,...}` | **Jackson** `Map.of` | No direct HTTP-path test | Small status map; `@RequestBody DecisionDto` is **typed** | **DEBT** (response) | **NO** |
| 13 | `GET /api/governed-decision/{id}` | `ResponseEntity<?>` | `GovernedDecisionRecord` (record) or `404` empty | **Jackson** on **record** | No direct HTTP-path test | `?` hides an already-typed record; wildcard only for the `notFound().build()` branch | **DEBT** | **NO** — body is a real record |
| 14 | `GET /api/governed-decision?account&subject` | `ResponseEntity<?>` | `{decisions: GovernedDecisionRecord[]}` | **Jackson** (map wrapping record list) | No direct HTTP-path test | Wildcard; envelope wraps typed records | **DEBT** | **NO** |
| 15 | `GET /api/governed-decision/counts` | `ResponseEntity<Map<String,Integer>>` | `{<countName>: int}` | **Jackson** | No direct HTTP-path test | Dynamic count-name keys | **JIC** | **NO** — dynamic string→int map legitimately resists a fixed schema |
| 16 | `POST /api/governed-context` | `ResponseEntity<Map<String,Object>>` | `{status, contextVersionId, version, recordedAt}` or `{error, violations[]}` | **Jackson** `Map.of` | `GovernedContextControllerTest` | Status map; `@RequestBody ContextDraftDto` **typed** | **DEBT** (response) | **NO** |
| 17 | `GET /api/governed-context/resolve` | `ResponseEntity<?>` | `{resolved:false}` or `{resolved:true, contextVersion: GovernedContextVersionRecord}` | **Jackson** (map wrapping record) | `GovernedContextControllerTest` | Wildcard; resolved-union envelope wrapping a typed record | **DEBT** | **NO** |
| 18 | `GET /api/governed-context/counts` | `ResponseEntity<Map<String,Integer>>` | `{<countName>: int}` | **Jackson** | `GovernedContextControllerTest` | Dynamic count keys | **JIC** | **NO** |
| 19 | `POST /api/governed-context/association` | `ResponseEntity<Map<String,Object>>` | `{status, associationId, recordedAt}` or `{error}` | **Jackson** `Map.of` | `GovernedContextControllerTest` | Status map; `@RequestBody AssociationDto` **typed** | **DEBT** (response) | **NO** |
| 20 | `GET /api/governed-context/association/resolve` | `ResponseEntity<?>` | `{resolved}` + `association: SubjectScopeAssociationRecord` | **Jackson** (map wrapping record) | `GovernedContextControllerTest` | Wildcard; resolved-union envelope | **DEBT** | **NO** |
| 21 | `POST /api/governed-context/attach` | `ResponseEntity<Map<String,Object>>` | `{status, program, configVersion, governedScopeId, contextVersionId, associationId, effectiveFrom, recordedAt}` or `{error,...}` | **Jackson** `Map.of` | `GovernedContextControllerTest` | Status map; `@RequestBody AttachDto` **typed** | **DEBT** (response) | **NO** |
| 22 | `POST /api/continuity/assess` | `ResponseEntity<Map<String,Object>>` | 16-field verdict map (`status, assessmentId, verdict, affirmative, openingQuantity, reconciledQuantity, blockers[], admissionRuleVersion, acceptedCompleteness, quietDay, coveredThrough, governedScopeId, evidenceHash, effectiveFrom, recordedAt`) or `422 {error, missing[]}` | **Jackson** `LinkedHashMap` | `ContinuityControllerTest`; `@RequestBody AssessDto` **typed** | Fixed-shape verdict from engine result; `null` fields (e.g. `quietDay`, `reconciledQuantity`) are meaningful | **UNC** → leans **DEBT** | **Partial** — a DTO must preserve explicit `null` fields (null-vs-absent) |
| 23 | `GET /api/continuity/resolve` | `ResponseEntity<?>` | `{resolved:false}` or `{resolved:true, assessment: ContinuityAssessmentRecord}` | **Jackson** (map wrapping record) | `ContinuityControllerTest` | Wildcard; resolved-union envelope | **DEBT** | **NO** |
| 24 | `GET /api/continuity/counts` | `ResponseEntity<Map<String,Integer>>` | `{<countName>: int}` (delegates to `getGovernedDecisionCounts`) | **Jackson** | `ContinuityControllerTest` | Dynamic count keys | **JIC** | **NO** |

### Opportunity history / observe / production / observer

| # | Endpoint | Java return type | Actual response shape | Serialization | Contract / tests | Reason for weak typing | Classification | Changing type alters observable HTTP semantics? |
|---|----------|------------------|-----------------------|---------------|------------------|------------------------|----------------|-----|
| 25 | `POST /api/opportunity-history` | `ResponseEntity<Map<String,Object>>` | `{status, epochId, symbolObservations, surfaceObservations}` or `422 {error, evaluationState, symbol, expiration, strategy, contractViolations}` | **Jackson** `Map.of` | `OpportunityHistoryBoundaryTest`; `@RequestBody BatchRequest` **typed** (nested `EpochDto`/`SymbolObs`/`SurfaceObs`/`WinnerDto`) | Status map; request side richly typed (historically bug-sensitive — PL-DEPLOY-02-DEF01 Jackson binding) | **DEBT** (response) | **NO** |
| 26 | `GET /api/opportunity-history/counts` | `ResponseEntity<Map<String,Integer>>` | `{<countName>: int}` | **Jackson** | `OpportunityHistoryBoundaryTest` (indirect) | Dynamic count keys | **JIC** | **NO** |
| 27 | `POST /api/evidence/observe` | `ResponseEntity<Map<String,Object>>` | `{added[], alreadyKnown[], monitored, heldExpirations, totalRequested}` or `400 {error}` | **Jackson** `LinkedHashMap`; **request body is `@RequestBody Map<String,Object>` (untyped!)** | No direct HTTP-path test (heavy store/lifecycle tests exist) | `heldExpirations: -1` sentinel = "omitted/unchanged"; **request body untyped** because present-vs-omitted-vs-`[]` of `symbols`/`heldExpirations` is a 3-way lifecycle contract a flat DTO would flatten | **CR** (request side) / DEBT (response) | **YES (request)** — a typed request DTO cannot distinguish "key omitted" from "key = []" without custom deserialization; that 3-way distinction is load-bearing (clear vs unchanged vs replace) |
| 28 | `POST /api/production/assess` | `ResponseEntity<?>` | `ProductionResponse` (**record**, deep nested DTO tree) or `400/500 {error}` | **Jackson** on **record**; **multipart** `@RequestParam MultipartFile file` + `period` | No direct HTTP-path test | `?` hides an already fully-typed `ProductionResponse` record; wildcard only unions with error maps | **DEBT** (envelope) / **TYPED** (success body) | **NO** — success body already a rich record; multipart input needs explicit modeling in any OAS regardless |
| 29 | `GET /api/observer/observations` | `ObservationRecorder.ObservationPage` (**record**) | Typed page: operation events + control events + cursor/epoch/discontinuity metadata | **Jackson** on **record** | No direct HTTP-path test (recorder tested) | None — fully typed | **TYPED** | **NO** — already typed |

### Side-effecting nudge

| # | Endpoint | Java return type | Actual response shape | Serialization | Contract / tests | Reason for weak typing | Classification | Changing type alters observable HTTP semantics? |
|---|----------|------------------|-----------------------|---------------|------------------|------------------------|----------------|-----|
| 30 | `POST /api/evidence/refresh` | `Map<String,Object>` | `{outcome, completed, symbolsAcquired, workQueueDepth, generation, sessionPosture, targeted, recoversHistory}` + **conditionally** `perSymbol[]` when targeted | **Jackson** `LinkedHashMap` | `NudgeControllerTest` | `perSymbol` key **conditionally present** only for targeted refresh; `outcome` is an enum-name string | **UNC** → leans **DEBT** | **Partial** — conditional `perSymbol` presence must be preserved; a flat DTO would emit it always → observable change |

---

## Summary counts (30 handlers)

| Classification | Count | Endpoints |
|----------------|-------|-----------|
| **CR** (contract-required) | 3 | snapshot (#1), quotes (#2), observe-request (#27) |
| **CR-adjacent / UNC-leaning-CR** | 1 | status conditional keys (#8) |
| **JIC** (justified) | 6 | timesales (#5), markets (#6), dynamic count maps (#15, #18, #24, #26) |
| **DEBT** (incidental) | 13 | monitored (#7), health (#9), provider-events `Object` (#10), after-hours (#11), governed-decision ×3 (#12–14), governed-context responses + resolves (#16, #17, #19, #20, #21), continuity resolve (#23), opp-history response (#25) |
| **UNC** (needs decision) | 3 | history/all (#3, #4), continuity assess (#22), refresh (#30) |
| **TYPED** (already typed) | 2 | observer (#29), production success body (#28 record) |

Counts overlap where an endpoint has a typed request + weak response; the classification reflects the weak side. The `history`/`history-all` pair is listed as two UNC entries.

---

## Load-bearing findings (preserve these specifically)

### F1 — `POST /api/evidence/observe` has load-bearing omitted / empty / present request semantics

The request body is deliberately `@RequestBody Map<String,Object>` rather than a typed DTO. The `symbols` and `heldExpirations` keys each carry a **three-way lifecycle contract**:

- **key omitted** → leave the existing declaration **unchanged**;
- **key present as `[]`** → **explicitly clear** the set;
- **key present with entries** → atomically **replace** the set.

A flat Jackson-bound DTO cannot distinguish "key omitted" from "key = `[]`" without custom deserialization, and the response mirrors this with a `heldExpirations: -1` sentinel meaning "omitted → unchanged." This is the clearest case in the backend where **untyped request binding is contract-required, not debt.** Any OAS/typing work must preserve this distinction (and must not assume a generated request schema captures it).

### F2 — The three UNC endpoints turn on absence-vs-null, and that is exactly why they are undecided

`/api/status` (#8), `/api/evidence/refresh` (#30), and `/api/continuity/assess` (#22) rely on **conditional key presence** (`openingExperiment`, `cycleTiming`, `perSymbol`) or **meaningful null fields** (`quietDay`, `reconciledQuantity`). A naive DTO conversion would turn an **absent key** into `key: null` — which **is** an observable change for a consumer that distinguishes the two. These endpoints answer PL-API-02's "is the weak typing required?" with an honest **"partly."** The reconciliation decision here is specifically whether to preserve present-vs-absent semantics (e.g. `@JsonInclude(NON_NULL)` or equivalent) or to flatten them — a semantics choice, not a mechanical refactor.

### F3 — Genuinely dynamic maps are not debt

`{SYM: [...]}` history/timesales payloads (#3–6) and `{countName: int}` count maps (#15, #18, #24, #26) are legitimately open-ended. In OAS these are `additionalProperties`; typing them in Java buys little and does not improve the contract. Classified **JIC**, deliberately **not** debt. Do not "clean these up" into fixed DTOs under a tooling-driven impulse.

### F4 — Most wildcard/`Object`/status-map weakness is incidental type erasure around otherwise-typed responses

The six `ResponseEntity<?>` wildcards (#13, #14, #17, #20, #23, #28) almost all wrap an **already-typed record**; the wildcard exists only to union a success record with a `{resolved:false}` / `404` / `{error}` branch. `Object` on provider-events (#10) erases an already-typed return. These are the cleanest candidates for explicit response modeling and would **not** change observable bytes. This is incidental debt, distinct in kind from F1–F3.

### F5 — Weak typing is heterogeneous, not one architectural defect

The decisive conclusion. The backend already embodies four legitimate representation patterns — exact hand-controlled contracts (CR), dynamic maps (JIC), ordinary records (TYPED), and incidental erasure (DEBT). "The backend is weakly typed" is a false simplification. A single blanket remedy ("convert everything to DTOs so a generator works") would damage F1 (observe request), F2 (absence-vs-null endpoints), and F3 (dynamic maps). Any PL-API-02 direction must respect the pattern distinctions rather than optimize the codebase for one OpenAPI generator.

---

## Serialization note

Serialization is bimodal. Six endpoints hand-build JSON with `StringBuilder` (snapshot, quotes, history ×2, timesales, markets); the rest use Jackson over `Map`/record trees. The hand-built set is where auto-generated OAS would be **least** faithful (opaque `string`), and it overlaps exactly with the contract-required (#1, #2) and cache-coupled (#5, #6) endpoints — a non-coincidence worth carrying into reconciliation.

---

## Boundary and disposition

- This is **evidence**, not a decision. It does not adopt OpenAPI, choose a contract-first vs annotation-augmented vs hybrid direction, or authorize any dependency, file, annotation, DTO, or test.
- It is an **input to the strategic/architectural reconciliation of `PL-API-02`**, which remains at `INTAKE`.
- OAS design-options evaluation is **deliberately not** advanced here, per Principal direction on this session.
- Demonstrated contract defects (none asserted here) would belong under `docs/bugs/`, not this survey.
