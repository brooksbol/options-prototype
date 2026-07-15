# Backend Evidence Service — Migration Plan & Documentation Impact

**Companion to:** `09-backend-evidence-service-design.md`

---

## Migration Plan Summary

| Phase | Name | What Changes | Rollback |
|-------|------|-------------|----------|
| 0 | Freeze & Document | No code changes. Document contracts. | N/A |
| 1 | Extract Shared Types | Shared TypeScript package for domain types | Revert package, restore co-located types |
| 2 | Parallel Operation | Backend runs alongside frontend crawl. Compares output. | Stop backend process |
| 3 | Frontend Consumes Backend | Feature flag switches evidence source | Set flag to `frontend` |
| 4 | Backend Default | Remove Scan button; acquisition telemetry to Labs | Set flag to `frontend`; restore Scan |
| 5 | Remove Frontend Acquisition | Delete browser crawl code | Restore from archive branch (irreversible in main) |

### Critical invariant across all phases

Wheelwright must produce identical recommendations for identical evidence, regardless of whether that evidence came from the frontend crawl or the backend snapshot. This is verified by comparison testing in Phase 2 and Phase 3.

### Timeline estimate

| Phase | Effort | Dependency |
|-------|--------|-----------|
| 0 | 1 day | None |
| 1 | 1-2 days | Phase 0 |
| 2 | 3-5 days | Phase 1 |
| 3 | 1-2 days | Phase 2 stable |
| 4 | 1 day | Phase 3 stable for 1 week |
| 5 | 1 day | Phase 4 stable for 2 weeks |

Total: ~2-3 weeks for full extraction with stabilization periods.

---

## Documentation Impact Inventory

### New documents (created during this pass)

| Document | Status |
|----------|--------|
| `08-adr-backend-evidence-service.md` | ✅ Complete |
| `09-backend-evidence-service-design.md` | ✅ Complete |
| `09a-backend-diagrams.md` | ✅ Complete |
| `09b-migration-and-impact.md` | ✅ This document |

### Documents to update during migration

| Document | Phase | Update |
|----------|-------|--------|
| `07-architecture-current.md` | Phase 3 | Add backend layer to architecture; mark acquisition as "backend-owned" |
| `07a-component-map-current.md` | Phase 4 | Mark acquisition components deprecated |
| `07b-diagrams.md` | Phase 3 | Add backend data-flow diagram |
| `.env.local` | Phase 4 | Remove Tradier credentials (backend-only) |
| `development-machine.md` | Phase 2 | Add backend setup instructions |

### Documents that become historical

| Document | Phase | Disposition |
|----------|-------|-------------|
| Frontend crawl-recovery tests | Phase 5 | Archive |
| `scan-planner.ts` inline documentation | Phase 5 | Archive with code |
| Crawl state IndexedDB notes | Phase 5 | Archive |
| "Rescan" UX documentation | Phase 4 | Replace with "evidence auto-refreshes" |

### Documents that remain unchanged

| Document | Reason |
|----------|--------|
| `00-project-charter.md` | Project intent unchanged |
| `foundations/*` | Philosophical foundations still apply |
| `07c-adrs.md` (ADRs 1-10) | All remain valid post-migration |
| Broker handoff documentation | Entirely frontend; unchanged |
| Recommendation Brief documentation | Reads from snapshot; unchanged |
| Open order documentation | Frontend-owned; unchanged |

---

## Extraction Friction Points

Places where the current codebase's boundaries make extraction harder than expected:

### 1. TradierProvider is tightly coupled to DurableCache

`TradierProvider` in `src/providers/tradier/TradierProvider.ts` directly writes to the DurableMarketCache (IndexedDB). The backend will need its own storage adapter. The provider's normalization logic (raw Tradier response → OptionsChain) is the valuable part to extract; the cache-write integration is not.

**Recommendation:** Extract normalization into a pure function. Provider adapters on the backend write to SQLite, not IndexedDB.

### 2. Session policy is duplicated if not shared

`MarketSessionPolicy` and `TradingCalendar` are currently frontend modules. The backend needs the same session classification. If not shared, they'll diverge.

**Recommendation:** Move to shared package in Phase 1.

### 3. PrimaryExpirationPolicy is used by both planner and Wheelwright

The scan planner uses `selectPrimaryExpiration` to know what chain to fetch. Wheelwright uses it to know what chain to read. This must remain a single shared definition.

**Recommendation:** Already identified for shared package.

### 4. Evidence readiness is defined in two places

The scan planner classifies "rankable" using cache freshness. The recommendation engine classifies "covered" using chain existence and content. These disagree (the root cause of the stuck-generation bug).

**Recommendation:** The backend extraction forces a single definition in the `evidence_generation` table. This is a fix, not just a migration.

### 5. OptionsChain type contains provider-specific metadata

The `OptionsChain` type includes `DataQuality` with `dataSource: "api" | "cache"` and `cacheAgeSeconds`. This is frontend-cache metadata that has no meaning in the backend. The snapshot schema should strip this or normalize it into provenance.

**Recommendation:** Backend snapshot uses a clean evidence schema. DataQuality metadata is replaced by snapshot-level provenance.

---

## Open Questions Requiring Decisions

### 1. Snapshot payload size

With 496 instruments and ~50 puts per chain, the full snapshot could be 3-8 MB (gzipped: ~400KB-1MB). Is this acceptable for a single-user local service?

**Proposed answer:** Yes, for single-user local deployment. Revisit if payload exceeds 10 MB or if multi-user is added.

### 2. Polling interval

How frequently should the browser revalidate the snapshot?

**Options:**
- A. Every 60 seconds (near-real-time during active use)
- B. Every 5 minutes (low overhead, still responsive)
- C. On visibility change + manual refresh (minimal polling)

**Proposed answer:** Option A during REGULAR_OBSERVATION, Option B during closed sessions, Option C when tab is hidden.

### 3. Partial coverage display

When the backend is still building the first generation (only 100 of 496 ready), should the frontend:
- A. Show provisional recommendations from available evidence (current behavior)
- B. Wait until coverage exceeds a threshold (e.g., 80%) before showing recommendations
- C. Always show what's available with an explicit coverage indicator

**Proposed answer:** Option C (match current behavior). Provisional recommendations with honest coverage display.

### 4. Session transition handling

When a new market session begins, should the backend:
- A. Immediately invalidate the prior snapshot and begin a new generation
- B. Keep serving the prior-session snapshot (sealed) while building the new one
- C. Serve a transitional snapshot that mixes sealed prior-session and new evidence

**Proposed answer:** Option B. The prior-session evidence remains valid (sealed canonical) until the new session's evidence is ready. This matches the current frontend behavior.

### 5. Should the backend expose per-symbol evidence endpoints?

For debugging or future use, should there be:
```
GET /api/evidence/symbols/:symbol
```

**Proposed answer:** Not in the first extraction. The full snapshot is sufficient. Add per-symbol endpoints if payload size becomes a problem or if the Brief needs to fetch additional evidence beyond what's in the snapshot.

### 6. Monorepo or separate repository?

Should the backend live in the same git repository as the frontend?

**Proposed answer:** Same repository (monorepo with `packages/` or `services/` directory). Shared types are easier to maintain. Separate deployment but shared source.
