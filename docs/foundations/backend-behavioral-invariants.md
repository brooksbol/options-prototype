# Wheelwright Backend Behavioral Invariants

**Date:** July 2026
**Status:** Ratified
**Charter authority:** `docs/foundations/retooling-charter.md`
**Step:** 3 of 6 (Define backend behavioral invariants)

---

## 1. Executive Definition

A behavioral invariant is a testable truth that must remain true after the backend implementation changes.

It is:

- Implementation-independent (describes observable behavior, not mechanism)
- Verifiable against a running system or its persistence layer
- Grounded in repository evidence (foundations, architecture docs, existing tests)
- Required by the system's architectural identity

It is not:

- A description of how the current TypeScript code happens to work
- A configuration parameter
- A preference about internal structure

The test for inclusion: if violating this statement produces a system that is no longer recognizably the Wheelwright Evidence Appliance, it is an invariant. If violating it merely produces a differently-implemented but functionally equivalent system, it is not.

---

## 2. Invariant Classification Rules

| Classification | Meaning | Authority Level |
|---------------|---------|-----------------|
| **Architectural invariant** | Required by system identity or stable boundaries. Violation breaks the appliance model. | Constitution |
| **Contract invariant** | Observable across a system boundary. Violation breaks consumer compatibility. | Laws |
| **Operational policy** | Configurable behavior. May change without violating architecture. | Operations |
| **Implementation detail** | Mechanism that must not be preserved merely because it exists. | None |

---

## 3. Ratified Invariant Catalog

### Lifecycle

| Field | Value |
|-------|-------|
| **ID** | INV-LIFE-01 |
| **Name** | Browser-independent operation |
| **Statement** | Evidence acquisition must continue according to session policy without requiring an active browser client, an inbound HTTP request, or any connected consumer. |
| **Type** | Architectural invariant |
| **Scope** | Backend process lifecycle |
| **Preconditions** | Backend process is running; provider credential is configured |
| **Required outcome** | Acquisition proceeds on schedule when zero consumers are connected |
| **Prohibited outcome** | Acquisition halts or degrades because no browser is polling |
| **Evidence** | `docs/foundations/evidence-appliance.md`: "Operates independently of any browser session." `docs/14-background-acquisition-design.md`: "No browser connection required." |
| **Authority** | Evidence Appliance foundation (constitution) |
| **Confidence** | Ratified |
| **Verification surface** | Process lifecycle — start backend, do not open browser, observe acquisition in logs/database |

---

| Field | Value |
|-------|-------|
| **ID** | INV-LIFE-02 |
| **Name** | Restart durability |
| **Statement** | Successfully acquired evidence must survive process restart and remain available for publication until superseded by a later successful observation. |
| **Type** | Architectural invariant |
| **Scope** | Persistence layer |
| **Preconditions** | Evidence has been successfully acquired and persisted |
| **Required outcome** | After process termination and restart, the same evidence is available in the published snapshot |
| **Prohibited outcome** | Process restart causes loss of successfully acquired evidence |
| **Evidence** | `tests/sqlite-evidence-store.test.ts`: "rebuilds identical snapshot after close and reopen." `docs/foundations/evidence-appliance.md`: "Durable persistence is required. An appliance that loses its evidence on restart has failed structurally." |
| **Authority** | Evidence Appliance foundation (constitution) |
| **Confidence** | Ratified |
| **Verification surface** | Database — acquire evidence, kill process, restart, compare snapshots |

---

### Acquisition

| Field | Value |
|-------|-------|
| **ID** | INV-ACQ-01 |
| **Name** | Single acquisition authority |
| **Statement** | At most one acquisition cycle may be advancing the authoritative evidence model at any point in time. |
| **Type** | Architectural invariant |
| **Scope** | Acquisition worker |
| **Preconditions** | Backend is running |
| **Required outcome** | Work items are processed sequentially within a single non-overlapping loop |
| **Prohibited outcome** | Two concurrent cycles write to the evidence store simultaneously |
| **Evidence** | `acquisition-worker.ts`: "INVARIANT: Only one acquisition cycle is ever in flight." `docs/foundations/retooling-charter.md`: "Single acquisition authority. One process maintains one authoritative evidence model. No split-brain." |
| **Authority** | Retooling Charter principle 7 (constitution) |
| **Confidence** | Ratified |
| **Verification surface** | Process internals — concurrent cycle detection; database — no interleaved writes from multiple sources |

---

| Field | Value |
|-------|-------|
| **ID** | INV-ACQ-02 |
| **Name** | Acquisition does not require consumer initiative |
| **Statement** | The backend must initiate and schedule evidence acquisition autonomously. No consumer request is required to trigger routine acquisition. |
| **Type** | Architectural invariant |
| **Scope** | Acquisition scheduling |
| **Preconditions** | Backend is running; session permits acquisition |
| **Required outcome** | Acquisition begins automatically after process start |
| **Prohibited outcome** | Evidence remains stale because no consumer requested a refresh |
| **Evidence** | `main.ts`: worker starts on boot. `docs/foundations/evidence-appliance.md`: "Does not require the operator to initiate acquisition." |
| **Authority** | Evidence Appliance foundation (constitution) |
| **Confidence** | Ratified |
| **Verification surface** | Process lifecycle — start backend, observe automatic acquisition without any HTTP request |

---

### Session Behavior

| Field | Value |
|-------|-------|
| **ID** | INV-SESS-01 |
| **Name** | Session-gated acquisition |
| **Statement** | The backend must not issue routine provider requests when the current market session does not permit acquisition. |
| **Type** | Architectural invariant |
| **Scope** | Acquisition worker, session model |
| **Preconditions** | Market session is in a non-acquisition state (weekends, holidays, off-hours, CLOSED_CANONICAL, NON_TRADING_DAY) |
| **Required outcome** | Zero routine provider calls during non-acquisition sessions |
| **Prohibited outcome** | Provider requests issued during closed sessions, weekends, or holidays |
| **Evidence** | `docs/20-session-aware-acquisition.md`: "Acquiring during closed sessions is a modeling failure." `acquisition-worker.ts`: `isAcquisitionPermitted()` gate. `docs/foundations/retooling-charter.md`: principle 5. |
| **Authority** | Retooling Charter principle 5 (constitution) |
| **Confidence** | Ratified |
| **Verification surface** | Clock/session simulation — advance time to weekend/holiday, verify no upstream calls |

---

| Field | Value |
|-------|-------|
| **ID** | INV-SESS-02 |
| **Name** | Trading calendar correctness |
| **Statement** | The backend must correctly identify US market holidays, weekends, early-close days, and regular session boundaries for the operational year. |
| **Type** | Architectural invariant |
| **Scope** | Session model |
| **Preconditions** | None |
| **Required outcome** | Known holidays suppress acquisition. Known early-close times terminate acquisition correctly. Weekends are non-trading. |
| **Prohibited outcome** | Acquisition runs on a holiday. Acquisition continues past early close. |
| **Evidence** | `acquisition-worker.ts`: `US_MARKET_HOLIDAYS_2026` and time-of-day logic. `docs/20-session-aware-acquisition.md`: full calendar specification. |
| **Authority** | Session-aware acquisition doc (law) |
| **Confidence** | Ratified |
| **Verification surface** | Unit test — enumerate known holidays and boundary times, verify classification |

---

### Persistence

| Field | Value |
|-------|-------|
| **ID** | INV-PERSIST-01 |
| **Name** | Failed refresh preserves successful evidence |
| **Statement** | A failed acquisition attempt must not overwrite, delete, or invalidate the last successfully acquired payload for that symbol. |
| **Type** | Architectural invariant |
| **Scope** | Evidence store |
| **Preconditions** | A symbol has previously acquired evidence successfully |
| **Required outcome** | After a failure, the prior successful data remains available for publication |
| **Prohibited outcome** | Provider failure causes the snapshot to lose previously valid evidence |
| **Evidence** | `docs/foundations/retooling-charter.md`: principle 4. `docs/22-sqlite-persistence-design.md`: principle 2. `tests/sqlite-evidence-store.test.ts`: "failure does not overwrite last successful evidence." |
| **Authority** | Retooling Charter principle 4 (constitution) |
| **Confidence** | Ratified |
| **Verification surface** | Database — acquire successfully, then fail, verify data column unchanged |

---

| Field | Value |
|-------|-------|
| **ID** | INV-PERSIST-02 |
| **Name** | Absence is a resolution outcome |
| **Statement** | When expiration discovery returns zero expirations, the symbol must be resolved as absent. Absence is a successful observation, not a failure. |
| **Type** | Architectural invariant |
| **Scope** | Evidence store, resolution model |
| **Preconditions** | Provider successfully returns an empty expirations list |
| **Required outcome** | Symbol resolution = absent. Symbol is not in the work queue. |
| **Prohibited outcome** | Empty expirations treated as a failure. Symbol retried indefinitely. |
| **Evidence** | `docs/22-sqlite-persistence-design.md`: "Absence is a resolution outcome, not a payload type." `tests/evidence-store.test.ts`: "setExpirations with empty array → absent." |
| **Authority** | SQLite persistence design (law) |
| **Confidence** | Ratified |
| **Verification surface** | Database — set empty expirations, verify resolution = absent, verify not in work queue |

---

| Field | Value |
|-------|-------|
| **ID** | INV-PERSIST-03 |
| **Name** | Observation provenance |
| **Statement** | Each evidence record must carry the timestamp of successful retrieval, enabling consumers to determine evidence age without relying on backend-computed freshness labels. |
| **Type** | Contract invariant |
| **Scope** | Evidence store, snapshot publication |
| **Preconditions** | Evidence has been successfully acquired |
| **Required outcome** | `retrievedAt` timestamp is present and reflects actual retrieval time |
| **Prohibited outcome** | Evidence published without retrieval timestamp. Consumer cannot determine age. |
| **Evidence** | `EvidenceSnapshot.symbols[].retrievedAt` field. `docs/22-sqlite-persistence-design.md`: "Session provenance is per-evidence-record." |
| **Authority** | SQLite persistence design (law) |
| **Confidence** | Ratified |
| **Verification surface** | HTTP — snapshot response includes retrievedAt for each symbol with evidence |

---

| Field | Value |
|-------|-------|
| **ID** | INV-PERSIST-04 |
| **Name** | Facts persisted, trust derived |
| **Statement** | The persistence layer must store raw observation facts and provenance. Freshness, staleness, and validity classifications must be derived at query/publication time, never stored as persistent state. |
| **Type** | Architectural invariant |
| **Scope** | Database schema, snapshot builder |
| **Preconditions** | None |
| **Required outcome** | No `current`/`stale`/`fresh` columns in persistence. Validity computed from session context and timestamps. |
| **Prohibited outcome** | A stored "freshness" label becomes stale itself, producing incorrect validity assessments. |
| **Evidence** | `docs/22-sqlite-persistence-design.md`: "No `current`/`stale` in the schema" with derivation function. `docs/foundations/retooling-charter.md`: principle 3. |
| **Authority** | Retooling Charter principle 3 (constitution) |
| **Confidence** | Ratified |
| **Verification surface** | Schema inspection — no freshness/staleness columns. Integration test — same data produces different validity under different session contexts. |

---

### Publication

| Field | Value |
|-------|-------|
| **ID** | INV-PUB-01 |
| **Name** | Snapshot coherence |
| **Statement** | A published snapshot must represent a consistent view of the evidence store at a point in time. It must not combine partially-written state from an in-progress acquisition cycle. |
| **Type** | Contract invariant |
| **Scope** | Snapshot builder, HTTP endpoint |
| **Preconditions** | Consumer requests snapshot |
| **Required outcome** | Snapshot reflects a committed state (all writes from a cycle are either fully included or fully excluded) |
| **Prohibited outcome** | Snapshot contains one symbol's new data but not another's from the same batch |
| **Evidence** | `docs/22-sqlite-persistence-design.md`: "Generation advances on snapshot publication, not on individual evidence writes." SQLite transactions in store implementation. |
| **Authority** | SQLite persistence design (law) |
| **Confidence** | Ratified |
| **Verification surface** | HTTP — concurrent reads during acquisition never return torn state |

---

| Field | Value |
|-------|-------|
| **ID** | INV-PUB-02 |
| **Name** | Conditional retrieval |
| **Statement** | When the published snapshot has not changed since the consumer's last retrieval, the backend must support returning a 304 Not Modified response without retransmitting the full payload. |
| **Type** | Contract invariant |
| **Scope** | Snapshot HTTP endpoint |
| **Preconditions** | Consumer provides If-None-Match header matching current ETag |
| **Required outcome** | 304 response, no body |
| **Prohibited outcome** | Full payload retransmitted when evidence has not changed |
| **Evidence** | `routes/snapshot.ts`: ETag comparison logic. `useEvidenceSnapshot.ts`: consumer sends If-None-Match. `docs/14-background-acquisition-design.md`: "ETag for conditional revalidation." |
| **Authority** | Background acquisition design (law) |
| **Confidence** | Ratified |
| **Verification surface** | HTTP — request with matching ETag receives 304 |

---

| Field | Value |
|-------|-------|
| **ID** | INV-PUB-03 |
| **Name** | Generation monotonicity |
| **Statement** | The snapshot generation identifier must be monotonically increasing. A consumer receiving a higher generation can assume it supersedes all lower generations. |
| **Type** | Contract invariant |
| **Scope** | Snapshot publication |
| **Preconditions** | Snapshot has been published at least once |
| **Required outcome** | Each published snapshot has a higher generation than all previously published snapshots |
| **Prohibited outcome** | Generation decreases or resets during normal operation (restart may reset to the last persisted generation, which is acceptable) |
| **Evidence** | `tests/sqlite-evidence-store.test.ts`: "generation increments on publishSnapshot()." ETag format: `"gen-N"`. |
| **Authority** | SQLite persistence design (law) |
| **Confidence** | Ratified |
| **Verification surface** | HTTP — sequential snapshot fetches show non-decreasing generation |

---

| Field | Value |
|-------|-------|
| **ID** | INV-PUB-04 |
| **Name** | Deterministic snapshot from identical state |
| **Statement** | Given identical persisted evidence, the published snapshot must be deterministic. The same database state must produce the same snapshot content (excluding timing metadata like `generatedAt`). |
| **Type** | Contract invariant |
| **Scope** | Snapshot builder |
| **Preconditions** | Evidence state is unchanged |
| **Required outcome** | Multiple builds from the same state produce structurally identical output |
| **Prohibited outcome** | Non-deterministic ordering, random values, or hidden state cause snapshot variance |
| **Evidence** | `docs/07-architecture-current.md`: "Deterministic recommendation generation. Same inputs → same outputs." Applied transitively to the evidence publication layer. `tests/sqlite-evidence-store.test.ts`: behavioral equivalence tests compare normalized snapshots. |
| **Authority** | Architecture document (law) |
| **Confidence** | Ratified |
| **Verification surface** | Unit test — build snapshot twice from same state, compare |

---

### Provider Boundaries

| Field | Value |
|-------|-------|
| **ID** | INV-PROV-01 |
| **Name** | Credential custody |
| **Statement** | Provider credentials must be held exclusively by the backend. They must never be transmitted to consumers, logged in plaintext, or included in HTTP responses. |
| **Type** | Architectural invariant |
| **Scope** | Configuration, provider adapter, API responses |
| **Preconditions** | None |
| **Required outcome** | Credential used in upstream requests only. Not present in any consumer-facing output. |
| **Prohibited outcome** | API key appears in snapshot, status response, error message, or log output |
| **Evidence** | `config.ts`: "Credential never logged or exposed in responses." `docs/10-backend-implementation-preferences.md`: "No Tradier or broker secrets exposed to the browser." |
| **Authority** | Backend implementation preferences (law) |
| **Confidence** | Ratified |
| **Verification surface** | HTTP — inspect all endpoint responses for credential absence. Logs — grep for key value. |

---

| Field | Value |
|-------|-------|
| **ID** | INV-PROV-02 |
| **Name** | Provider type containment |
| **Statement** | Provider-native response structures must not escape the adapter boundary. All data exposed to consumers must use application-owned domain types. |
| **Type** | Architectural invariant |
| **Scope** | Provider adapter, API responses |
| **Preconditions** | Provider returns data |
| **Required outcome** | Snapshot and API responses use `MarketExpiration`, `MarketChain`, `MarketOptionContract` — application-defined shapes |
| **Prohibited outcome** | Tradier JSON field names, nesting structures, or type names appear in consumer-facing output |
| **Evidence** | `providers/tradier.ts`: normalizes to application types. `routes/market.ts`: "Application-owned contract. Does not expose Tradier response shapes." `docs/foundations/retooling-charter.md`: "Provider types never leak." |
| **Authority** | Retooling Charter stable boundaries (constitution) |
| **Confidence** | Ratified |
| **Verification surface** | HTTP — snapshot schema uses only application-defined types. Code review — adapter is the sole Tradier-aware module. |

---

| Field | Value |
|-------|-------|
| **ID** | INV-PROV-03 |
| **Name** | Rate-limit compliance |
| **Statement** | The backend must not exceed the provider's published rate limit under any operational condition, including burst scenarios (operator nudge, restart with large work queue). |
| **Type** | Architectural invariant |
| **Scope** | Request pacing |
| **Preconditions** | Provider has a published rate limit (Tradier: 60 requests/minute) |
| **Required outcome** | Sustained request rate remains below the provider's limit with safety margin |
| **Prohibited outcome** | Provider returns 429. Burst from restart or nudge exceeds limit. |
| **Evidence** | `request-pacer.ts`: 0.9 req/sec (~54/min, under 60/min). `docs/07-architecture-current.md`: "TradierProvider (sandbox, 15-min delayed, 60 req/min rate limit)." |
| **Authority** | Architecture document (law) |
| **Confidence** | Ratified |
| **Verification surface** | Integration test — max burst scenario, measure actual upstream call rate |

---

### Universe

| Field | Value |
|-------|-------|
| **ID** | INV-UNIV-01 |
| **Name** | Idempotent universe initialization |
| **Statement** | Universe initialization must be idempotent. Repeated initialization with the same symbol set must not duplicate records, reset evidence, or alter existing resolution state. |
| **Type** | Architectural invariant |
| **Scope** | Universe import, evidence store |
| **Preconditions** | Universe has been previously initialized |
| **Required outcome** | Re-running initialization preserves all existing evidence and resolution |
| **Prohibited outcome** | Duplicate symbol rows. Evidence reset. Resolution state lost. |
| **Evidence** | `db/universe-import.ts`: "Idempotent: running multiple times does not duplicate rows or reset evidence." `tests/sqlite-evidence-store.test.ts`: `initUniverse` uses INSERT OR IGNORE. |
| **Authority** | SQLite persistence design (law) |
| **Confidence** | Ratified |
| **Verification surface** | Database — initialize, acquire evidence, re-initialize, verify evidence preserved |

---

| Field | Value |
|-------|-------|
| **ID** | INV-UNIV-02 |
| **Name** | Work queue reflects resolution state |
| **Statement** | The work queue must contain only symbols that genuinely require acquisition work (pending expirations, pending chains, or recoverable failures). Symbols that are resolved (ready or absent) must not appear. |
| **Type** | Architectural invariant |
| **Scope** | Work queue derivation |
| **Preconditions** | Universe initialized, some symbols resolved |
| **Required outcome** | Ready and absent symbols excluded from work queue. Pending and partial symbols included. |
| **Prohibited outcome** | Fully-resolved symbols re-acquired unnecessarily. Work queue grows unbounded. |
| **Evidence** | `tests/evidence-store.test.ts`: "getWorkQueue returns pending and expirations_known symbols" (excludes absent). `tests/sqlite-evidence-store.test.ts`: "work queue reflects only genuinely pending symbols after restart." |
| **Authority** | Evidence store tests (law) |
| **Confidence** | Ratified |
| **Verification surface** | Unit test — verify queue membership after various resolution outcomes |

---

### System Boundaries

| Field | Value |
|-------|-------|
| **ID** | INV-BOUND-01 |
| **Name** | Evidence/recommendation separation |
| **Statement** | The backend must not compute recommendations, apply recommendation policy, or produce ranked candidate lists. Its product boundary is evidence publication. |
| **Type** | Architectural invariant |
| **Scope** | Backend responsibilities |
| **Preconditions** | None |
| **Required outcome** | Backend publishes evidence. Consumer computes recommendations locally. |
| **Prohibited outcome** | Backend returns recommendation rankings, posture classifications, or policy evaluations |
| **Evidence** | `docs/10-backend-implementation-preferences.md`: "Backend answers: 'What is true about the market right now?' Frontend answers: 'Given my portfolio, my policy, and the current market, what should I write today?'" `docs/foundations/retooling-charter.md`: transitional boundary — recommendation engine is consumer-local. |
| **Authority** | Backend implementation preferences (law). Retooling Charter transitional boundary. |
| **Confidence** | Ratified (as current migration boundary; explicitly transitional per charter) |
| **Verification surface** | API — no endpoint returns recommendation data. Code — no recommendation logic in backend. |

---

## 4. Ratification Decisions (Resolved)

The following candidates were ratified by operator decision:

---

| Field | Value |
|-------|-------|
| **ID** | INV-PROV-04 |
| **Name** | Provider stewardship |
| **Statement** | The backend shall not knowingly consume provider capacity to reacquire equivalent evidence when existing evidence already satisfies the governing acquisition policy. |
| **Type** | Architectural invariant |
| **Scope** | Provider interaction, acquisition policy |
| **Preconditions** | Existing evidence is available and satisfies current acquisition policy |
| **Required outcome** | Provider capacity is conserved; equivalent evidence is not redundantly requested |
| **Prohibited outcome** | Backend issues provider requests for data it already holds under policy |
| **Evidence** | `response-cache.ts`: prevents redundant upstream calls. `request-pacer.ts`: guards capacity. Operator ratification: "Make provider stewardship the invariant." |
| **Authority** | Operator ratification against Retooling Charter |
| **Confidence** | Ratified |
| **Verification surface** | Integration test — verify no upstream call issued when equivalent cached response satisfies policy. Note: specific TTL values, cache mechanisms, and implementation strategies are operational policy, not part of this invariant. |

---

| Field | Value |
|-------|-------|
| **ID** | INV-PUB-05 |
| **Name** | Published contract versioning |
| **Statement** | Published evidence contracts are versioned. Breaking changes require an explicit version transition. |
| **Type** | Contract invariant |
| **Scope** | Snapshot HTTP endpoint, all consumer-facing API contracts |
| **Preconditions** | A consumer relies on the published snapshot structure |
| **Required outcome** | Consumers are not broken by backend changes. Shape changes are accompanied by explicit version transitions. |
| **Prohibited outcome** | A field rename, removal, or semantic change silently breaks consumers |
| **Evidence** | `useEvidenceSnapshot.ts`: consumer depends on specific fields (generation, generatedAt, universe, coverage). Operator ratification: "This is the appliance's public contract." |
| **Authority** | Operator ratification against Retooling Charter |
| **Confidence** | Ratified |
| **Verification surface** | HTTP — consumer integration tests against the published contract. Schema — versioned contract document (to be produced in a future step). |

---

| Field | Value |
|-------|-------|
| **ID** | INV-SESS-03 |
| **Name** | Sealed evidence validity |
| **Statement** | Evidence sealed at session close remains valid and servable until superseded by the next session's canonical observations, regardless of elapsed wall-clock time. |
| **Type** | Architectural invariant |
| **Scope** | Evidence validity derivation, snapshot publication |
| **Preconditions** | Market session has closed; evidence was acquired during the canonical session |
| **Required outcome** | Friday's sealed evidence serves validly throughout the weekend. Evidence is not marked stale by wall-clock aging alone. |
| **Prohibited outcome** | Sealed evidence reported as stale merely because hours have passed since acquisition |
| **Evidence** | `docs/foundations/evidence-appliance.md`: "Friday's sealed close is the newest valid evidence throughout the weekend. The appliance preserves and serves this state without marking it stale." `docs/20-session-aware-acquisition.md`: session-validity derivation function. |
| **Authority** | Evidence Appliance foundation (constitution). Operator ratification: "The Constitution says it should. If the current implementation falls short of the documented architectural intent, the implementation is wrong — not the architecture." |
| **Confidence** | Ratified |
| **Verification surface** | Clock/session simulation — acquire during Friday regular session, advance clock to Saturday, verify evidence is reported as valid (not stale). Note: the current TypeScript backend does not fully implement this; the ratified invariant establishes that the Java implementation should fulfill the documented intent, not merely replicate the partial behavior. |

---

## 5. Explicit Non-Invariants

These are operational policies or implementation details that must NOT be preserved as invariants:

| Item | Classification | Reason |
|------|---------------|--------|
| Batch size of 10 symbols per cycle | Operational policy | Tunable performance parameter |
| 30-second idle delay between cycles | Operational policy | Scheduling parameter |
| 5-second backoff after failure | Operational policy | Retry parameter |
| 5-minute session-blocked recheck interval | Operational policy | Scheduling parameter |
| 0.9 requests/second pacing rate | Operational policy | Derived from provider limit; the invariant is "don't exceed the limit," not the specific rate |
| Response cache TTLs (90s/60s/5m) | Operational policy | Optimization parameters |
| Express as HTTP framework | Implementation detail | Any HTTP framework satisfying the contract invariants is acceptable |
| `better-sqlite3` as database driver | Implementation detail | Any SQLite driver satisfying ACID and WAL is acceptable |
| `tsx` as runtime | Implementation detail | Development convenience |
| In-memory EvidenceStore class | Implementation detail | Transitional; SQLite is the system of record |
| Specific internal method names | Implementation detail | Not observable across any boundary |
| Generation advancing on every individual write (in-memory store) vs. on publishSnapshot (SQLite store) | Implementation detail with ambiguity | See Conflicts section |

---

## 6. Negative Invariants / Prohibited Behaviors

These must never occur in any conforming implementation:

| ID | Prohibited Behavior | Authority |
|----|---------------------|-----------|
| NEG-01 | A browser session becomes the acquisition authority (browser-initiated crawl as sole evidence path) | Evidence Appliance foundation |
| NEG-02 | A provider failure overwrites or destroys previously successful evidence | Retooling Charter principle 4 |
| NEG-03 | Recommendation computation occurs in the backend | Backend implementation preferences (current boundary) |
| NEG-04 | Provider-native payload structures appear in consumer-facing API responses | Retooling Charter stable boundary |
| NEG-05 | Two concurrent acquisition cycles advance the evidence model simultaneously | Retooling Charter principle 7 |
| NEG-06 | Acquisition proceeds during a market session that does not permit it | Retooling Charter principle 5 |
| NEG-07 | Provider credentials appear in any consumer-facing output | Backend implementation preferences |
| NEG-08 | Process restart causes loss of previously persisted successful evidence | Evidence Appliance foundation |
| NEG-09 | A stored freshness label substitutes for runtime session-context-based validity derivation | Retooling Charter principle 3 |

---

## 7. Repository Conflicts or Ambiguities

### Conflict 1: Generation semantics

**In-memory store** (`evidence-store.ts`): Generation advances on every individual `setExpirations`, `setChain`, or `setFailure` call.

**SQLite store** (`sqlite-evidence-store.ts`): Generation advances only on explicit `publishSnapshot()` call.

**Competing interpretations:**
- In-memory behavior: generation = "any evidence has changed" counter
- SQLite behavior: generation = "a coherent snapshot has been explicitly published" counter

**Higher authority:** `docs/22-sqlite-persistence-design.md` explicitly states: "Generation advances on snapshot publication, not on individual evidence writes." The in-memory store contradicts this.

**Resolution:** The SQLite behavior is authoritative. INV-PUB-03 (generation monotonicity) applies to published snapshots, not individual writes. The in-memory store's per-write generation is an implementation artifact from its pre-SQLite era.

---

### Conflict 2: Work queue — failed symbols

**In-memory store**: Failed symbols with `failureCount < 3` remain in the work queue.

**SQLite store**: The work queue query is more complex but functionally similar.

**Ambiguity:** Is the threshold of 3 failures an invariant or operational policy?

**Resolution:** The *principle* — that a bounded number of retries occurs before giving up — is an invariant (INV-UNIV-02 requires the queue to not grow unbounded). The specific threshold (3) is operational policy.

---

### Conflict 3: Sealed evidence validity

**Documented** (`evidence-appliance.md`, `20-session-aware-acquisition.md`): Evidence sealed at session close remains valid regardless of wall-clock age. "Friday's sealed close is the newest valid evidence throughout the weekend."

**Implemented**: The current TypeScript backend does not implement seal semantics. It serves whatever is in SQLite without session-validity derivation. The frontend has `sessionClosed` logic, but the backend does not produce sealed/unsealed metadata.

**Resolution:** The documented behavior is the architectural intent. The current implementation is incomplete. This is listed as candidate INV-SESS-C01. The Java retooling should implement the documented behavior, not merely replicate the current partial implementation.

---

## 8. Ratification Record

All candidate invariants have been resolved by operator decision:

| Former Candidate | Decision | Ratified As |
|------------------|----------|-------------|
| INV-ACQ-C01 (redundant request suppression) | Ratified — narrowed to provider stewardship principle | INV-PROV-04 |
| INV-PUB-C01 (snapshot shape stability) | Ratified — strengthened to versioned contract requirement | INV-PUB-05 |
| INV-SESS-C01 (sealed evidence validity) | Ratified — constitutional authority; implementation must fulfill documented intent | INV-SESS-03 |

Operator guidance on INV-SESS-03:

> "If the current implementation falls short of the documented architectural intent, the implementation is wrong — not the architecture."

This establishes that the Java implementation target is the ratified architecture, not the current TypeScript behavior.

---

## 9. Boundary of Step 3

This document defines the behavioral invariants that any conforming Wheelwright backend must satisfy.

It does not:

- Inventory how the current TypeScript backend satisfies (or fails to satisfy) each invariant
- Design the Java replacement
- Produce a migration backlog
- Select specific technologies or libraries

**What remains for Step 4:**

> Inventory the existing TypeScript backend against the ratified invariants.

That inventory will identify, for each invariant:

- Whether the current implementation satisfies it
- Where in the codebase the behavior lives
- Whether the implementation is minimal or carries accidental complexity
- Which behaviors are incomplete relative to the documented architectural intent

That inventory is not performed here.

---

*Any backend that satisfies these invariants is recognizably the Wheelwright Evidence Appliance, regardless of whether it is implemented in TypeScript, Java, or another language.*
