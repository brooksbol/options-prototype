# SQLite Persistence — Final Design

**Date:** July 16, 2026
**Status:** Approved design — ready for implementation
**Stack:** TypeScript/Express, `better-sqlite3`
**Prerequisite:** Current Write Desk UI baseline accepted

---

## Governing Principles

1. **Persist facts; derive trust.** The database stores observed evidence with provenance timestamps. Freshness, staleness, and validity are computed at snapshot-publication time from persisted facts, market-session policy, and seal state.

2. **Failed refresh must not destroy successful evidence.** A failed acquisition attempt records its failure metadata without overwriting the last successful payload. The operator always sees the most recent valid evidence, even if the latest refresh attempt failed.

3. **Absence is a resolution outcome, not a payload type.** When expiration discovery returns zero expirations, the symbol is marked as resolved with an absence outcome. It does not coexist with contradictory expiration evidence for the same symbol.

4. **Generation advances on snapshot publication, not on individual evidence writes.** Evidence mutation and snapshot publication are distinct lifecycle events. The generation counter tracks published snapshot versions.

5. **Snapshot is rebuilt deterministically from persisted evidence.** On startup, the service loads evidence from SQLite, reconstructs the published snapshot, and serves it. Measured rebuild cost validates this approach.

6. **Session provenance is per-evidence-record.** Each evidence row carries the trading session date that produced it, enabling per-symbol validity determination.

7. **Database location is configurable.** Default: `./data/evidence.sqlite3`. Overridable via `EVIDENCE_DB_PATH` environment variable for cloud persistent storage.

8. **Foreign keys and WAL mode enabled.** `PRAGMA foreign_keys = ON` during initialization and in tests. `PRAGMA journal_mode = WAL` for read concurrency and crash safety. WAL is not a backup strategy.

---

## Schema

```sql
-- Migration 001: Initial persistence schema

PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

-- ═══ UNIVERSE ═══

-- All monitored symbols
CREATE TABLE symbols (
  symbol     TEXT PRIMARY KEY,
  added_at   TEXT NOT NULL,        -- ISO-8601
  removed_at TEXT                  -- NULL = active
);

-- Named sources / cohorts
CREATE TABLE universe_sources (
  id           TEXT PRIMARY KEY,   -- 'yahoo_top_etfs_2026_07_13'
  name         TEXT NOT NULL,      -- 'Yahoo Top ETFs'
  imported_at  TEXT NOT NULL,
  symbol_count INTEGER NOT NULL
);

-- Many-to-many: a symbol can belong to multiple sources
CREATE TABLE symbol_membership (
  symbol    TEXT NOT NULL REFERENCES symbols(symbol),
  source_id TEXT NOT NULL REFERENCES universe_sources(id),
  PRIMARY KEY (symbol, source_id)
);

-- ═══ EVIDENCE ═══

-- Per-symbol evidence with independent tracking per evidence type.
-- A symbol can have expirations evidence AND chain evidence as separate rows.
-- Absence is a resolution flag on the expirations row (empty expirations = absent).
CREATE TABLE evidence (
  symbol         TEXT NOT NULL REFERENCES symbols(symbol),
  evidence_type  TEXT NOT NULL,          -- 'expirations', 'chain', 'quote'
  expiration     TEXT NOT NULL DEFAULT '',  -- populated only for chains (identifies which)
  -- Last successful evidence
  data           TEXT,                   -- JSON payload from last success (NULL if never succeeded)
  retrieved_at   TEXT,                   -- when data was last successfully retrieved
  session_date   TEXT,                   -- trading session that produced this evidence
  -- Latest attempt tracking (independent of success)
  last_attempt_at  TEXT,
  attempt_result   TEXT,                 -- 'success', 'failure', NULL (never attempted)
  failure_count    INTEGER NOT NULL DEFAULT 0,
  failure_reason   TEXT,
  PRIMARY KEY (symbol, evidence_type, expiration)
);

-- ═══ RESOLUTION ═══

-- Per-symbol resolution outcome (derived from evidence but persisted for query efficiency)
CREATE TABLE symbol_resolution (
  symbol            TEXT PRIMARY KEY REFERENCES symbols(symbol),
  resolution        TEXT NOT NULL,       -- 'ready', 'absent', 'pending', 'partial', 'failed'
  primary_expiration TEXT,               -- selected DTE target (NULL if absent/pending)
  resolved_at       TEXT,                -- when resolution was last determined
  session_date      TEXT                 -- session of resolution
);

-- ═══ SNAPSHOT ═══

-- Published snapshot state (singleton)
CREATE TABLE snapshot_state (
  id             INTEGER PRIMARY KEY CHECK (id = 1),
  generation     INTEGER NOT NULL DEFAULT 0,
  published_at   TEXT,                   -- when the snapshot was last published
  sealed_at      TEXT,                   -- when the session was sealed (NULL if active)
  session_date   TEXT,                   -- canonical session date
  session_state  TEXT                    -- last known session classification
);

-- ═══ INDEXES ═══

CREATE INDEX idx_evidence_symbol ON evidence(symbol);
CREATE INDEX idx_resolution_status ON symbol_resolution(resolution);
```

---

## Schema Design Notes

### Why separate `evidence` and `symbol_resolution`?

`evidence` stores facts: "for symbol XLE, the expirations evidence retrieved at T contained this JSON." Multiple evidence types exist per symbol (expirations + chain + quote).

`symbol_resolution` stores the derived symbol-level outcome: "XLE is ready (has complete evidence)." This is computed from evidence rows but persisted for efficient work-queue queries. It represents the acquisition controller's understanding of the symbol's current state.

### Absence model

When expiration discovery returns zero expirations:
- `evidence` row: `symbol='XLE', evidence_type='expirations', data='[]', attempt_result='success'`
- `symbol_resolution` row: `symbol='XLE', resolution='absent'`

There is no separate "absence" evidence type. Absence is the resolution outcome when expirations evidence succeeds but contains zero entries.

### Failed refresh preserves prior success

```
evidence row for XLE expirations:
  data = '[{"date":"2026-08-03","dte":21}]'   ← last successful payload (unchanged)
  retrieved_at = '2026-07-15T14:30:00Z'       ← when it last succeeded
  session_date = '2026-07-15'                 ← session of successful retrieval
  last_attempt_at = '2026-07-16T10:15:00Z'    ← most recent attempt (failed)
  attempt_result = 'failure'
  failure_count = 2
  failure_reason = 'Tradier returned 503'
```

The snapshot publisher sees the `data` field (valid evidence from July 15) and can serve it. The acquisition worker sees `attempt_result = 'failure'` and knows to retry. These are independent.

### No `current` / `stale` in the schema

Trust derivation happens at publication time:

```typescript
function deriveEvidenceValidity(
  evidence: EvidenceRow,
  currentSessionDate: string,
  sessionState: SessionState,
  sealedAt: string | null
): 'current' | 'sealed' | 'stale' | 'missing' {
  if (!evidence.data) return 'missing';
  if (sessionState === 'CLOSED_CANONICAL' || sessionState === 'NON_TRADING_DAY') {
    // Sealed evidence from the canonical session is valid regardless of age
    if (evidence.session_date === currentSessionDate) return 'sealed';
    if (evidence.session_date === priorSessionDate) return 'sealed';
    return 'stale';
  }
  // Active session: evidence from today's session is current
  if (evidence.session_date === currentSessionDate) return 'current';
  return 'stale';
}
```

---

## Implementation Plan

### Mapping to Existing Code

| Current Component | Role | SQLite Integration |
|-------------------|------|-------------------|
| `EvidenceStore` class | In-memory evidence authority | Replace with `SqliteEvidenceStore` implementing same interface |
| `EvidenceStore.initUniverse()` | Populate from parsed TypeScript file | Read from `symbols` table; initialize on first run from `loadUniverse()` |
| `EvidenceStore.setExpirations()` | Record expiration evidence | `INSERT OR REPLACE INTO evidence` + update `symbol_resolution` |
| `EvidenceStore.setChain()` | Record chain evidence | `INSERT OR REPLACE INTO evidence` + update resolution to 'ready' |
| `EvidenceStore.setFailure()` | Record failure | Update `last_attempt_at`, `failure_count`, `failure_reason` without touching `data` |
| `EvidenceStore.getWorkQueue()` | Symbols needing acquisition | `SELECT symbol FROM symbol_resolution WHERE resolution IN ('pending','partial','failed')` |
| `EvidenceStore.buildSnapshot()` | Serialize current state for API | Join `symbol_resolution` + `evidence` → compute coverage + serialize |
| `EvidenceStore.getETag()` | Conditional HTTP | `SELECT generation FROM snapshot_state` |
| `getEvidenceStore()` singleton | Provide store instance | Instantiate `SqliteEvidenceStore` with configured DB path |
| `loadUniverse()` in universe.ts | Parse Yahoo source file | Used only for initial seed; thereafter `SELECT symbol FROM symbols WHERE removed_at IS NULL` |
| Acquisition worker `acquireSymbol()` | Per-symbol acquisition logic | Unchanged — calls store methods which now write to SQLite |
| Snapshot route `GET /api/evidence/snapshot` | Serve evidence to frontend | Unchanged — calls `store.buildSnapshot()` which now reads from SQLite |

### Phase 1: Database Foundation

**Scope:** SQLite infrastructure, schema, migration runner, connection management.

- Add `better-sqlite3` and `@types/better-sqlite3` to `evidence-service/package.json`
- Create `evidence-service/src/db/` directory
- `db/connection.ts`: open database, apply pragmas (WAL, foreign_keys), apply migrations
- `db/migrations/001_initial.sql`: the schema above
- `db/migrate.ts`: read numbered SQL files, apply in order, track applied migrations in a `_migrations` table
- Configuration: `EVIDENCE_DB_PATH` env var (default: `./data/evidence.sqlite3`)
- On startup: ensure `data/` directory exists, open database, run migrations
- Tests: all database tests use `:memory:` SQLite (same API, no disk)
- Add `data/` to `.gitignore`

### Phase 2: SqliteEvidenceStore

**Scope:** Replace in-memory Map with SQLite-backed store implementing the same public interface.

- Create `evidence-service/src/db/sqlite-evidence-store.ts`
- Implement `EvidenceStore` interface methods backed by SQL queries
- `initUniverse(symbols)`: on first run, seed `symbols`, `symbol_membership`, `symbol_resolution` from the parsed universe file. On subsequent runs (database already populated), add only new symbols.
- `setExpirations(symbol, expirations, retrievedAt)`:
  - Write to `evidence` (type='expirations', data=JSON, retrieved_at, session_date, attempt_result='success')
  - If expirations empty → `symbol_resolution.resolution = 'absent'`
  - If expirations non-empty → `symbol_resolution.resolution = 'partial'`, compute `primary_expiration`
- `setChain(symbol, chain, retrievedAt)`:
  - Write to `evidence` (type='chain', expiration=primary, data=JSON)
  - Update `symbol_resolution.resolution = 'ready'`
- `setFailure(symbol, reason)`:
  - Update `evidence` row: increment `failure_count`, set `failure_reason`, `last_attempt_at`, `attempt_result='failure'`
  - Do NOT overwrite `data` or `retrieved_at`
  - If failure_count exceeds threshold → `symbol_resolution.resolution = 'failed'`
- `getWorkQueue()`:
  - `SELECT symbol FROM symbol_resolution WHERE resolution IN ('pending', 'partial') OR (resolution = 'failed' AND failure_count < 3)`
- `buildSnapshot()`:
  - Query all `symbol_resolution` rows + their associated `evidence` rows
  - Compute coverage counts
  - Serialize to `EvidenceSnapshot` shape
  - This is the measured operation — must complete in acceptable time for 1,286 symbols
- `get(symbol)`:
  - Query `symbol_resolution` + `evidence` for that symbol
  - Compose into `SymbolEvidence` shape
- Generation: `snapshot_state.generation` incremented by `publishSnapshot()` (new method), not by individual evidence writes

**Key behavioral change:** Individual evidence writes do NOT advance generation. A new `publishSnapshot()` method advances generation, updates `published_at`, and recomputes the ETag. The snapshot route calls this before serving (or the worker calls it after each batch completes).

### Phase 3: Restart Recovery and Session Integration

**Scope:** Service restart loads persisted state. Session seal persists.

- On startup: `SqliteEvidenceStore` constructor opens database, runs migrations, loads `snapshot_state`
- If evidence exists: `buildSnapshot()` succeeds immediately → service is ready to serve
- If database is empty (first run): seed from `loadUniverse()`, begin acquisition
- Worker on startup: reads `getWorkQueue()` from SQLite → resumes where it left off
- Session seal: when the session gate transitions to `CLOSED_CANONICAL`, write `sealed_at` to `snapshot_state`
- On cold start off-hours with evidence: serve sealed snapshot immediately
- On cold start off-hours without evidence: report unavailable (no evidence to serve)

**Tests for restart recovery:**
- Write evidence to SQLite, close store, re-open from same file, verify all evidence present
- Verify work queue only contains symbols that genuinely need acquisition
- Verify a crashed mid-batch acquisition resumes correctly (partially-resolved symbols have `resolution = 'partial'`)

### Phase 4: Universe Expansion (Separate Task)

**Scope:** Import the merged 1,286-symbol universe.

- Create a universe-import script or startup logic:
  - Load new symbol list
  - `INSERT OR IGNORE INTO symbols` for new symbols
  - `INSERT INTO symbol_membership` for new source cohort
  - `INSERT INTO symbol_resolution (symbol, resolution) VALUES (?, 'pending')` for new symbols
- Existing 496 symbols: evidence rows untouched, resolution unchanged
- New 790 symbols: start as `pending`, acquire during next active session
- The 496-symbol cohort remains queryable: `SELECT symbol FROM symbol_membership WHERE source_id = 'yahoo_top_etfs_2026_07_13'`

---

## Snapshot Rebuild Cost

The concern is whether rebuilding the published snapshot from SQLite on startup is cheap enough to avoid persisting the payload.

**Analysis for 1,286 symbols:**
- `SELECT` from `symbol_resolution`: 1,286 rows × ~100 bytes ≈ 128 KB
- `SELECT` from `evidence` for ready symbols (chains are large): ~365 ready × ~50 KB JSON ≈ 18 MB read
- In-memory assembly of the `EvidenceSnapshot` object: iteration + JSON serialization
- Expected time: 50-200ms on a modern SSD (SQLite reads are fast; JSON parsing is the bottleneck)

**Mitigation if measured cost is unacceptable:**
- Maintain a write-through memory cache: all writes go to SQLite AND to an in-memory Map
- On startup: populate the Map from SQLite (one-time cost)
- Snapshot serves from memory; SQLite provides durability
- This is the same architecture as today (Map-based) with SQLite as the durable backing store

**Recommendation:** Implement direct SQLite reads first. Measure. Add write-through cache only if rebuild exceeds 500ms.

---

## File Structure

```
evidence-service/
  src/
    db/
      connection.ts          -- open, pragma, migrate
      migrate.ts             -- numbered migration runner
      migrations/
        001_initial.sql      -- schema
      sqlite-evidence-store.ts  -- SqliteEvidenceStore class
    evidence-store.ts        -- interface (extract interface from current class)
    ...existing files...
  data/
    evidence.sqlite3         -- created at runtime (gitignored)
  .gitignore                 -- add: data/
```

---

## Open Design Decisions (Resolved)

| Question | Decision |
|----------|----------|
| Persist snapshot payload? | No. Rebuild deterministically. Measure cost. |
| `current`/`stale` in schema? | No. Derived at publication time from facts + session policy. |
| Absence as evidence_type? | No. Absence is `symbol_resolution.resolution = 'absent'` derived from empty expirations. |
| Generation increment trigger? | On snapshot publication, not individual writes. |
| Quote evidence? | Yes. Persisted as `evidence_type = 'quote'`. Independent retrieval/failure tracking. |
| Multi-source membership? | Junction table `symbol_membership`. Original cohorts always recoverable. |
| Foreign keys? | ON. In both production and tests. |
| Database location? | `EVIDENCE_DB_PATH` env var, default `./data/evidence.sqlite3`. |
| PostgreSQL portability? | Repository boundary is clean. Migration is manageable but not trivial (JSON, timestamps, concurrency differ). |

---

## Migration Pattern: Lightweight Parallel Run

Rather than replacing the in-memory store and hoping for correctness, the migration uses the existing `EvidenceStore` as a **test oracle** — a reference implementation against which SQLite behavior is validated.

### Why lightweight (not full enterprise parallel-run)

The current in-memory store is ~200 lines with straightforward Map operations. There are no accumulated edge cases, no concurrent access patterns, no mysterious legacy behavior. The risk being managed is:

1. Does SQLite lose data that the Map would have retained? (durability correctness)
2. Does restart recovery produce a snapshot identical to what existed pre-restart? (the restart proof)
3. Does a failed write corrupt state in a way the Map never could? (failure mode safety)

These are all deterministically testable without runtime dual-writes.

### Mechanism

**The behavioral comparison lives in the test suite, not the runtime.**

```typescript
// Behavioral equivalence: same operations → same observable output
describe("SqliteEvidenceStore matches InMemoryEvidenceStore", () => {
  it("produces identical snapshot given identical operation sequence", () => {
    const memory = new InMemoryEvidenceStore();
    const sqlite = new SqliteEvidenceStore(":memory:");

    // Apply identical operations
    for (const store of [memory, sqlite]) {
      store.initUniverse(["XLE", "XLF", "NOOPT"]);
      store.setExpirations("XLE", expirations, now);
      store.setChain("XLE", chain, now);
      store.setExpirations("NOOPT", [], now); // absence
      store.setFailure("XLF", "timeout");
    }

    // Compare normalized snapshots
    expect(normalize(sqlite.buildSnapshot()))
      .toEqual(normalize(memory.buildSnapshot()));
  });
});
```

**The restart proof is an explicit test scenario:**

```typescript
describe("restart recovery", () => {
  it("rebuilds identical snapshot after service restart", () => {
    const store1 = new SqliteEvidenceStore(tempFile);
    // ... acquire evidence ...
    const before = normalize(store1.buildSnapshot());
    store1.close();

    const store2 = new SqliteEvidenceStore(tempFile);
    const after = normalize(store2.buildSnapshot());
    expect(after).toEqual(before);
  });
});
```

### What this achieves

- SQLite is authoritative from day one (tests prove equivalence before deployment)
- No `DualWriteEvidenceStore` in production code
- No runtime divergence debugging
- No separate "authority inversion" deployment
- The old `EvidenceStore` class is renamed to `InMemoryEvidenceStore` and retained as a test oracle
- Behavioral comparison runs on every build
- Restart proof runs on every build

### Retirement criteria

The `InMemoryEvidenceStore` test oracle is retired when all of these are demonstrated:

- Normal-session behavioral equivalence
- Sealed-session behavioral equivalence
- Restart recovery (write → close → reopen → identical snapshot)
- Failed-refresh preservation (prior success survives subsequent failure)
- Universe expansion (add symbols without disrupting existing evidence)
- Snapshot generation correctness (increments on publication, not on writes)
- Work queue correctness after restart (only genuinely pending symbols)

---

## Implementation Readiness

The design maps precisely to the existing `EvidenceStore` interface, acquisition worker, and snapshot route. The implementation sequence preserves the current public API — the snapshot endpoint, acquisition worker, and frontend polling all continue to function identically. The change is internal: the Map is replaced by SQLite as the backing store, with the critical addition that state survives restarts.

The `InMemoryEvidenceStore` remains in the codebase as a test oracle for behavioral equivalence verification.

Ready for implementation.
