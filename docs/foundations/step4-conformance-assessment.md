# Step 4: Conformance Assessment

**Date:** July 2026
**Charter authority:** `docs/foundations/retooling-charter.md`
**Invariants authority:** `docs/foundations/backend-behavioral-invariants.md`
**Step:** 4 of 6 (Inventory existing backend against ratified invariants)

---

## Conformance Table

| ID | Invariant | Status | Evidence | Gap | Remediation |
|----|-----------|--------|----------|-----|-------------|
| INV-LIFE-01 | Browser-independent operation | **Satisfied** | `main.ts`: worker starts on server boot via `worker.start()`. No HTTP trigger required. Acquisition runs continuously via `scheduleCycle()`. | None | — |
| INV-LIFE-02 | Restart durability | **Satisfied** | `sqlite-evidence-store.ts`: all evidence written to SQLite with WAL mode. Test: "rebuilds identical snapshot after close and reopen" passes. | None | — |
| INV-ACQ-01 | Single acquisition authority | **Satisfied** | `acquisition-worker.ts`: `cycleActive` flag prevents overlap. `if (!this.running \|\| this.cycleActive) return;` in `runCycle()`. Singleton via `getAcquisitionWorker()`. | None | — |
| INV-ACQ-02 | No consumer initiative required | **Satisfied** | `main.ts` line ~47: `worker.start()` called in `app.listen()` callback. Worker self-schedules via `scheduleCycle(1000)` immediately. | None | — |
| INV-SESS-01 | Session-gated acquisition | **Satisfied** | `acquisition-worker.ts`: `isAcquisitionPermitted()` checks day-of-week, holidays, and time-of-day before every cycle. Returns `{ permitted: false, reason }` during off-hours. | None | — |
| INV-SESS-02 | Trading calendar correctness | **Satisfied** | `US_MARKET_HOLIDAYS_2026` contains 10 dates. `US_EARLY_CLOSE_2026` contains 2 dates (2026-11-27, 2026-12-24) with 13:30 ET cutoff (13:15 close + 15-min provider delay). Time boundaries: 09:30–16:15 ET standard, 09:30–13:30 ET early-close. DST approximation covers 99%+ of the year. 16 focused session-gate tests verify all boundaries. | None remaining. DST approximation is a known simplification acceptable for the TypeScript backend. | Remediated in `04c84f0`. Java migration note: use a maintained exchange-calendar source rather than accumulating annual constants. |
| INV-SESS-03 | Sealed evidence validity | **Not yet implemented** | `currentSessionDate()` returns today's date as a string. Session date is stored per evidence row. However, `buildSnapshot()` does not derive validity from session context — it serves raw data without freshness/validity annotations. No sealed/unsealed state is communicated to consumers. | Backend does not implement sealed-evidence semantics. Consumer (frontend) has partial implementation via `sessionClosed` flag but backend does not produce session-validity metadata. | Implement session-validity derivation in the Java backend. This is accepted-deferred per the ratification record: "the Java implementation should fulfill the documented intent, not merely replicate the partial behavior." |
| INV-PERSIST-01 | Failed refresh preserves success | **Satisfied** | `sqlite-evidence-store.ts` `setFailure()`: updates only `last_attempt_at`, `attempt_result`, `failure_count`, `failure_reason` — never touches `data` or `retrieved_at`. Test: "failure does not overwrite last successful evidence" passes. | None | — |
| INV-PERSIST-02 | Absence is resolution outcome | **Satisfied** | `setExpirations()` with empty array: sets `resolution = 'absent'`. Test: "setExpirations with empty array → absent" passes. `getWorkQueue()` excludes absent symbols. | None | — |
| INV-PERSIST-03 | Observation provenance | **Satisfied** | Every `setExpirations()` and `setChain()` records `retrieved_at`. `SymbolEvidence.retrievedAt` is included in snapshot. `session_date` also stored per row. | None | — |
| INV-PERSIST-04 | Facts persisted, trust derived | **Partially satisfied** | Schema has no `current`/`stale`/`fresh` columns — correct. However, the backend does not actually derive trust at publication time either. It serves raw evidence without validity annotations. The derivation responsibility currently falls to the consumer (frontend). | Backend does not perform trust derivation. The principle is satisfied at the schema level (no stored freshness) but the positive behavior (deriving validity from session context at publication time) is not implemented. This is the same gap as INV-SESS-03. | Address together with INV-SESS-03 in the Java implementation. |
| INV-PUB-01 | Snapshot coherence | **Satisfied** | Snapshot coherence is currently guaranteed through process-level serialization: Node.js single-threaded event loop, synchronous `better-sqlite3` access, and the single-flight acquisition worker (INV-ACQ-01). No explicit database read transaction wraps `buildSnapshot()`. SQLite WAL mode provides additional reader/writer isolation at the database level. | None in the current single-process runtime. | **Java migration note:** The Java implementation must deliberately reproduce the coherence guarantee. A multi-threaded runtime with asynchronous JDBC cannot rely on event-loop serialization. The Java snapshot builder will likely require an explicit read transaction or equivalent consistency boundary. |
| INV-PUB-02 | Conditional retrieval | **Satisfied** | `routes/snapshot.ts`: compares `If-None-Match` header against current ETag. Returns 304 when matched. Test: consumer `useEvidenceSnapshot.ts` sends `If-None-Match` and handles 304. | None | — |
| INV-PUB-03 | Generation monotonicity | **Satisfied** | `publishSnapshot()`: `UPDATE snapshot_state SET generation = generation + 1`. Monotonically increasing by SQL semantics. Test: "generation increments on publishSnapshot()" passes. | None | — |
| INV-PUB-04 | Deterministic snapshot | **Satisfied** | `buildSnapshot()` queries symbols in insertion order (consistent), builds deterministic JSON from deterministic SQL queries. Tests: behavioral equivalence tests compare normalized snapshots and pass. | None | — |
| INV-PUB-05 | Published contract versioning | **Satisfied** | Snapshot response includes `"apiVersion": "1"`. Contract document frozen at `docs/contracts/evidence-snapshot-v1.md`. 12 contract tests in `tests/snapshot-contract.test.ts` lock the published shape. Stability commitment documented: breaking changes require explicit version transition. | None remaining. | Remediated in `7386e31`. |
| INV-PROV-01 | Credential custody | **Satisfied** | `config.ts` loads from env var. `routes/status.ts` exposes only `credentialConfigured: boolean`, never the key value. `main.ts` logs `"configured"` or `"MISSING"`, not the value. Snapshot endpoint contains no credential data. | None | — |
| INV-PROV-02 | Provider type containment | **Satisfied** | `providers/tradier.ts` normalizes to `MarketExpiration`, `MarketChain`, `MarketOptionContract`. Snapshot contains only these application types. Legacy `/api/market/*` proxy responses include `provider: "tradier"` and `environment: "sandbox"` metadata fields — these are informational metadata strings, not structural type leakage. | None (invariant concerns provider response *structures* leaking; metadata labels do not violate that boundary) | Legacy proxy cleanup recommended when those endpoints are retired. |
| INV-PROV-03 | Rate-limit compliance | **Satisfied** | `RequestPacer` at 0.9 req/sec (~54/min, under 60/min limit). All upstream calls route through `pacer.submit()`. Queue has max 200 depth with rejection. Tests: `request-pacer.test.ts` verifies pacing behavior. | None | — |
| INV-PROV-04 | Provider stewardship | **Satisfied** | `ResponseCache` prevents duplicate upstream calls within TTL windows (5m expirations, 60s quotes, 90s chains). `acquisition-worker.ts` only acquires symbols in the work queue (pending/partial), not already-resolved symbols. | None | — |
| INV-UNIV-01 | Idempotent universe initialization | **Satisfied** | `universe-import.ts` uses `INSERT OR IGNORE`. Tests: "existing evidence survives import", "duplicate import is idempotent" pass. | None | — |
| INV-UNIV-02 | Work queue reflects resolution | **Satisfied** | `getWorkQueue()` returns only `pending` and `partial` (expirations_known) symbols. Tests: "getWorkQueue returns pending and expirations_known symbols" excludes absent. "work queue reflects only genuinely pending symbols after restart" passes. | None | — |
| INV-BOUND-01 | Evidence/recommendation separation | **Satisfied** | Backend codebase contains zero recommendation logic. No ranking, no posture classification, no policy evaluation. Grep for `recommend\|ranking\|posture\|policy.*engine` in evidence-service returns zero results in business logic. | None | — |

---

## Summary

| Status | Count | Invariants |
|--------|-------|------------|
| **Satisfied** | 16 | INV-LIFE-01, INV-LIFE-02, INV-ACQ-01, INV-ACQ-02, INV-SESS-01, INV-SESS-02, INV-PERSIST-01, INV-PERSIST-02, INV-PERSIST-03, INV-PUB-01, INV-PUB-02, INV-PUB-03, INV-PUB-04, INV-PUB-05, INV-PROV-01, INV-PROV-02, INV-PROV-03, INV-PROV-04, INV-UNIV-01, INV-UNIV-02, INV-BOUND-01 |
| **Not yet implemented (Java-targeted)** | 2 | INV-SESS-03, INV-PERSIST-04 |

---

## Gap Classification

### 1. Accepted-Deferred: New Java Capability

| Invariant | Gap | Disposition |
|-----------|-----|-------------|
| INV-SESS-03 | Sealed evidence validity not implemented | **New Java capability.** The architecture requires it; the TypeScript backend never implemented it. The Java backend should fulfill the documented intent. No TypeScript fix warranted. |
| INV-PERSIST-04 | Trust derivation not performed at publication | **New Java capability.** Same underlying gap as INV-SESS-03. The negative principle (no stored freshness) is satisfied at the schema level; the positive behavior (derive validity from session context at publication time) is not. Address together with INV-SESS-03 in Java. |

### 2. Remediated in TypeScript (Complete)

| Invariant | Remediation | Commit |
|-----------|-------------|--------|
| INV-SESS-02 | Added early-close dates (Nov 27, Dec 24) with 13:30 ET boundary. 16 session-gate tests. | `04c84f0` |
| INV-PUB-05 | Added `apiVersion: "1"` to snapshot. Froze contract in `docs/contracts/evidence-snapshot-v1.md`. 12 contract tests. | `7386e31` |

### 3. Legacy Cleanup (No Invariant Violation)

| Invariant | Finding | Disposition |
|-----------|---------|-------------|
| INV-PROV-02 | Legacy proxy responses include informational `provider: "tradier"` metadata | **No action required.** Invariant is satisfied — the issue is metadata labels in temporary legacy endpoints, not structural type leakage. Legacy endpoints are marked temporary per retooling charter. Cleanup occurs when they are retired. |

### 4. Java Migration Note (No Current Gap)

| Invariant | Finding | Disposition |
|-----------|---------|-------------|
| INV-PUB-01 | Snapshot coherence depends on Node.js single-thread serialization, not explicit transaction | **Java migration concern.** Currently satisfied through runtime coincidence. Java must deliberately reproduce the guarantee via explicit read transaction or equivalent consistency boundary. |

### 5. Invariants Fully Enforced by Tests

| Invariant | Test Coverage |
|-----------|--------------|
| INV-LIFE-02 | `sqlite-evidence-store.test.ts`: restart recovery |
| INV-PERSIST-01 | `sqlite-evidence-store.test.ts`: failed refresh preservation |
| INV-PERSIST-02 | `evidence-store.test.ts`: absence resolution |
| INV-PUB-03 | `sqlite-evidence-store.test.ts`: generation increments |
| INV-UNIV-01 | `universe-import.test.ts`: idempotent initialization |
| INV-UNIV-02 | `evidence-store.test.ts` + `sqlite-evidence-store.test.ts`: work queue correctness |
| INV-PROV-03 | `request-pacer.test.ts`: pacing behavior |

---

## Remediation Status

All TypeScript remediations are complete.

| Unit | Scope | Status | Commit |
|------|-------|--------|--------|
| 1 | Session correctness: early-close dates | **Complete** | `04c84f0` |
| 2 | Publication contract freeze: apiVersion + schema doc | **Complete** | `7386e31` |

### Java-targeted (accepted-deferred)

| Invariant | Disposition |
|-----------|-------------|
| INV-SESS-03 (sealed evidence validity) | New Java capability — implement documented architectural intent |
| INV-PERSIST-04 (trust derivation at publication) | New Java capability — same underlying work as INV-SESS-03 |

### Java migration notes

| Invariant | Concern |
|-----------|---------|
| INV-PUB-01 (snapshot coherence) | Java must explicitly ensure coherence via read transaction — cannot rely on single-thread event-loop serialization |
| INV-SESS-02 (trading calendar) | Java should use a maintained exchange-calendar mechanism rather than accumulating annual constants |

---

## Boundary of Step 4

This assessment is complete. All TypeScript remediations have been implemented and verified.

**Retooling preparation status:**

- Steps 1–4 complete
- 16 of 18 invariants satisfied in the TypeScript baseline
- 2 invariants (INV-SESS-03, INV-PERSIST-04) explicitly Java-targeted as new capability
- Snapshot contract v1 frozen with tests and documentation
- Session gate correctness verified
- Retooling preparation is complete; retooling itself remains pending until the Java backend replaces TypeScript and full acceptance criteria are satisfied

**What remains for Step 5:**

> Identify the smallest retooling seam.

That conversation should determine:

- Which Java component to build first
- What subset of invariants that component must satisfy
- How to verify behavioral equivalence during the transition
- Whether the dual-process transitional period uses the snapshot contract (likely yes)

---

*The TypeScript backend satisfies 16 of 18 ratified invariants. The 2 unimplemented invariants (INV-SESS-03 and INV-PERSIST-04) are accepted-deferred capabilities that the Java backend should fulfill as new behavior. Retooling preparation is complete.*
