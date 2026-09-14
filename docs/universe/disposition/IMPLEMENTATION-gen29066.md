# Generation 29066 Universe Disposition — Implementation & Experiment Record

**Status:** Canonical Project / Operational State (Category C) — bounded servicing-policy implementation + experiment
**Kind:** Servicing-policy change and observation experiment (NOT a defect — no `BUG-NNN`)
**Separate from:** `BUG-016` (the observability defect whose accepted export made this analysis trustworthy). This record does not reuse or reopen `BUG-016`.
**Related (cross-link, not double-booked):** `PL-GOV-02` (Universe Candidate Evaluation / Admission Workflow); `foundations/acquisition-scheduler-policy.md`; `docs/07-architecture-current.md`.
**Repository SYNC SHA:** `0a06bd7754be7b412de288cc7b6c2a2fcffbe260`

> **PL identity — open question for the Principal.** This is genuinely new durable servicing-policy
> intake. No existing `PL-*` owns "frozen periodic servicing cadence for a specific evidence-generation
> cohort." Candidate new identity: `PL-SERV-01` (universe servicing cadence). Per idea-intake governance
> I have **not** minted a new `PL-*` unilaterally; I flag it for reconciliation. `PL-GOV-02` is adjacent
> (admission), not the same concern (servicing cadence of already-admitted symbols).

---

## 1. What this is

The generation-29066 analysis (frozen in `wheelwright-universe-disposition-gen29066.md`) assigns every
governed symbol one of three servicing dispositions. This record implements that disposition as a
**configuration/data** change plus a bounded observation experiment.

| Disposition | Count | Effect |
|-------------|------:|--------|
| `CANONICAL_REMOVE` | 340 | Removed from the canonical/active universe (soft-delete; history preserved) |
| `WEEKLY_REFRESH` | 487 | Remain known; leave routine/high-frequency servicing; eligible for one governed refresh per week |
| `NORMAL_PROTECTED` | 84 | Retain ordinary servicing cadence (explicitly protected) |
| **Removed from routine servicing (dedup union)** | **827** | |

Frozen predicates (do not broaden):

- **`WEEKLY_REFRESH`:** Current Zero OI in CSP or buy-write AND no current Actionable/Edge/Wait in
  either strategy AND no retained historical Actionable/Edge/Wait in either strategy.
- **`NORMAL_PROTECTED`:** Current Zero OI / no current useful outcome, but demonstrated historical
  Actionable/Edge/Wait usefulness.
- **`CANONICAL_REMOVE`:** Current incomplete/non-optionable cohort with no retained
  `HAS_EVALUABLE_SURFACES` history.

Wide Spread alone and No Delta Match alone do **not** change cadence.

## 2. Persisted artifacts (done)

| Path | Role |
|------|------|
| `docs/universe/disposition/wheelwright-universe-disposition-gen29066.md` | Frozen human-readable report (byte-identical) |
| `data/universe/disposition-gen29066.csv` | Machine-readable disposition (authoritative for implementation) |
| `docs/universe/disposition/CHECKSUMS-gen29066.md` | Provenance manifest + reconciliation |
| `docs/universe/disposition/BASELINE-gen29066.md` | Immutable pre-change baseline |
| `evidence-service-java/.../universe/UniverseDisposition.java` | Loader + independent validator |
| `evidence-service-java/.../universe/UniverseDispositionTest.java` | 14 validation tests (pass) |

Loading/validating the artifact performs **zero provider calls** and **zero database access** (the loader
reads a CSV; it has no provider or DB collaborators).

## 3. Canonical-removal (340) — implementation path (NOT applied this session)

**Proven mechanism (see CHECKSUMS/BASELINE):** the active universe is `symbols WHERE removed_at IS NULL`.
`UniverseImport` is purely additive (`INSERT OR IGNORE`) and never sets `removed_at`; the 340 symbols are
already persisted active in the live DB. **Editing the seed CSV alone does not remove them.** The correct,
non-destructive removal is a governed data operation setting `removed_at` on exactly those 340 rows.

### Exact path

1. Prune the 340 symbols from `data/seeds/yahoo-merged-etf-tickers.csv` (keeps seed and DB consistent for
   any future fresh import; expected seed 1,306 → 966). This is necessary but **not sufficient** on its own.
2. Apply a governed soft-removal to the live DB:
   ```sql
   UPDATE symbols
      SET removed_at = '<ISO8601 activation timestamp>'
    WHERE symbol IN (<the 340 CANONICAL_REMOVE symbols>)
      AND removed_at IS NULL;
   ```
   Bounded by the frozen artifact; touches only the 340. No evidence, resolution, membership, or
   opportunity-history rows are deleted (they are keyed by `symbol` and remain intact).
3. Verify delta:
   - active count (`removed_at IS NULL`) 1,308 → **968** (exact −340);
   - all 340 have non-null `removed_at`;
   - all 487 weekly + 84 protected still `removed_at IS NULL`;
   - `JETS`, `TAN` (out-of-scope extras) unchanged.
4. **Operative effect requires a backend restart** — the worker holds the startup-loaded symbol list;
   there is no live universe-reload endpoint. DB change is durable immediately; behavior changes at bounce.

**Not executed this session** per the corrected boundary. Preconditions (baseline frozen, semantics proven)
are met; applying awaits explicit Principal authorization at activation.

### Whether to encode the removal as code

Preferred: keep removal as a **governed data operation** (a small, reviewable, idempotent apply/rollback
step driven by `data/universe/disposition-gen29066.csv`), not special-cased application logic. A minimal
one-shot applier that reads the disposition artifact and sets `removed_at` for the `CANONICAL_REMOVE`
cohort is the smallest mechanism; it contains no per-symbol logic and no scheduler behavior. This is
offered for approval, not built.

## 4. Weekly-refresh policy — AS IMPLEMENTED (simplified: attempt cadence)

**Principal simplification (this pass).** WEEKLY_REFRESH means **one execution of Wheelwright's existing
normal servicing path every seven days** — governed by an **attempt clock**, not by acquisition
completeness. The scheduler governs *attempt cadence*, not *acquisition completeness*.

> **Superseded design note.** Earlier passes explored a `completeWeeklyBundle` / `weeklySuccessClock`
> set-completeness gate (expected expiration set ⊆ successfully acquired admissible chain set) and a
> per-expiration retry throttle. That is **removed from this experiment** by Principal decision. It is
> preserved as durable why-state: the set-completeness reasoning (missing-row detection via `hasUsableChain`
> admissibility, obsolete-set handling) remains valid as **observability/diagnostics**, but it must **not**
> govern weekly scheduling here. The `MIN`-over-existing-rows gap that motivated it is moot because the
> simplified policy does not gate on completeness at all.

### 4.1 Policy (implemented)

For exactly the frozen 487 `WEEKLY_REFRESH` symbols:

1. The existing normal acquisition workflow is **unchanged** (existing 7–45 DTE semantics unchanged).
2. A durable per-symbol attempt clock is persisted: `symbol_resolution.weekly_last_attempt_at`
   (migration `009_weekly_refresh_cadence.sql`, nullable TEXT).
3. `weeklyDue(symbol) := weekly_last_attempt_at IS NULL OR now − weekly_last_attempt_at ≥ weeklyRefreshIntervalMs`
   (default 7 days, `SchedulerConfig.weeklyRefreshIntervalMs`).
4. When due, the symbol is admitted to the work queue and serviced by the existing normal path exactly once.
5. `weekly_last_attempt_at` is advanced **after** the governed servicing attempt **regardless of outcome**
   (complete / partial / absent / failed) — `SqliteEvidenceStore.markWeeklyAttempt`, called by the worker
   after `acquireSymbolTiered`.
6. No automatic retry before the next seven-day boundary; a partial/failed attempt still advances the clock,
   so the symbol waits the full interval (cadence, not completeness).
7. All ordinary evidence, failures, diagnostics, and provenance from the normal path are preserved unchanged.
8. Existing operator/manual refresh (`POST /api/evidence/refresh`) is unchanged — it bypasses the weekly
   exclusion (which is only a routine-selection predicate).

### 4.2 Where the exclusion is applied

`SqliteEvidenceStore.getPrioritizedWorkQueue` builds the A/B/C/D queue exactly as before, then — only when a
weekly cohort is installed — drops any weekly-cohort symbol that is not `weeklyDue`. Empty cohort ⇒ no-op
(all existing behavior/tests unchanged). The cohort is installed once at startup from the validated
`UniverseDisposition` artifact (`EvidenceStoreConfig.WorkerStarter`, gated by `universe.disposition.path`).

### 4.3 Explicitly NOT implemented (per Principal)
Weekly-specific 0–45 acquisition; `completeWeeklyBundle`; expected-vs-acquired reconciliation as a
scheduling gate; oldest-success weekly clocks; six-hour retry behavior; per-expiration weekly retry
machinery; completeness-driven rescheduling; automatic retries before the next weekly boundary. No
ACTIVE/DORMANT lifecycle, scoring, cohort recomputation, re-entry, or cadence tiers.

### 4.4 DTE discrepancy — recorded separately, NOT resolved here
Wheelwright's current normal acquisition path uses **7–45 DTE** (`SqliteEvidenceStore.getEligibleExpirations`,
`MIN_DTE=7`), consumed by `acquireAllEligibleChains`. The Principal believes the intended governed window
**may be 0–45 DTE**. This experiment does **not** change Decision DTE eligibility or ordinary acquisition
scope. The discrepancy is logged as a separate follow-up (see `docs/universe/disposition/DTE-DISCREPANCY-followup.md`).

## 5. Protected (84) — verification plan
All 84 are present and active in the live DB and appear in neither the removal nor weekly cohort (verified
in the disposition tests: disjoint cohorts; `dispositionOf` lookups). Post-activation runtime verification:
confirm each of the 84 remains `removed_at IS NULL` and is not excluded by the weekly predicate.

## 6. Exact transactional activation procedure for the 340 (STOP — not executed)

All steps read-only until step 5. No destructive SQL; no `DELETE`; no manual evidence-row deletion.
The disposition CSV is the source of the 340 symbols (`disposition = CANONICAL_REMOVE`).

1. **Backup.** With the appliance able to be paused for the window, copy the DB and its WAL/SHM sidecars:
   `cp data/evidence.sqlite3 data/evidence.sqlite3.pre-gen29066.bak` (and `-wal`, `-shm` if present).
   Record the backup checksum. (SQLite is in WAL mode; a checkpoint or clean copy is preferable.)
2. **Dry-run match — exactly 340 active.** Prove the frozen `CANONICAL_REMOVE` cohort maps to exactly 340
   currently-active rows:
   ```sql
   SELECT COUNT(*) FROM symbols
    WHERE removed_at IS NULL
      AND symbol IN (<340 CANONICAL_REMOVE from disposition-gen29066.csv>);
   -- expect: 340
   ```
3. **Exclusion proof.** Prove none of the 487 weekly or 84 protected symbols are in the removal set
   (already guaranteed disjoint by the validated artifact; re-assert against the CSV before mutation):
   ```sql
   SELECT COUNT(*) FROM symbols
    WHERE symbol IN (<340 removal>) AND symbol IN (<487 weekly ∪ 84 protected>);
   -- expect: 0
   ```
4. **Pre-count.** `SELECT COUNT(*) FROM symbols WHERE removed_at IS NULL;` — expect 1,308.
5. **Apply in one transaction:**
   ```sql
   BEGIN;
   UPDATE symbols
      SET removed_at = '<ISO8601 activation timestamp>'
    WHERE removed_at IS NULL
      AND symbol IN (<340 CANONICAL_REMOVE>);
   -- assert changes() = 340 before COMMIT
   COMMIT;
   ```
   The `AND removed_at IS NULL` guard makes it idempotent and prevents overwriting an existing removal
   timestamp.
6. **Verify affected = 340.** Confirm the statement changed exactly 340 rows (`changes()` = 340).
7. **Verify active population 1,308 → 968.** `SELECT COUNT(*) FROM symbols WHERE removed_at IS NULL;`
   — expect 968.
8. **Verify JETS and TAN untouched.** Both remain `removed_at IS NULL` (they are not in the 340).
9. **Verify weekly/protected untouched.** All 487 + 84 remain `removed_at IS NULL`.
10. **Verify history readable.** Spot-check that evidence and opportunity-history rows for several removed
    symbols still return (e.g. `SELECT COUNT(*) FROM evidence WHERE symbol='<a removed symbol>'` > 0;
    `symbol_observation` / `surface_observation` still queryable). Nothing was deleted.
11. **Update the canonical seed** by exactly the same 340 symbols, so a future fresh import is coherent
    with the DB. **A pre-built staged file already exists:** `data/universe/seed-gen29066-post-removal.csv`
    (the current `data/seeds/yahoo-merged-etf-tickers.csv` minus exactly the 340; verified 966 rows). It is
    **staged only — NOT the canonical seed** while activation is unauthorized. At activation the canonical
    replacement must be **atomic** (single move/rename over `data/seeds/yahoo-merged-etf-tickers.csv`, not an
    in-place partial edit) and the resulting canonical seed must be **verified to contain exactly 966
    intended symbols** before restart. (The additive importer will not resurrect removed symbols, but the
    canonical seed should still reflect the reduced set.)
12. **Restart the backend only after both the DB state and the seed are coherent** (steps 5–11 done).
13. **Verify the restarted worker loads the expected active universe:** `/api/status` `evidence.universe`
    and `getActiveSymbols` count consistent with 968 active (minus/plus the JETS/TAN observation-demand
    distinction already documented in the baseline). Confirm none of the 340 appear in the work queue.

## 7. Exact rollback procedure (STOP — not executed)

Equally explicit; data/configuration only; preserves all evidence and all observations made during the
experiment.

1. **Restore the 340 seed rows** to `data/seeds/yahoo-merged-etf-tickers.csv` (966 → 1,306).
2. **Clear `removed_at` for exactly the frozen 340 in one transaction:**
   ```sql
   BEGIN;
   UPDATE symbols
      SET removed_at = NULL
    WHERE symbol IN (<340 CANONICAL_REMOVE>)
      AND removed_at IS NOT NULL;
   -- assert changes() = 340
   COMMIT;
   ```
   (Scope strictly to the frozen 340 so no unrelated prior removal is disturbed.)
3. **Remove/disable the 487 weekly overrides** if the seam was implemented: set the seam's single disable
   flag (or revert the disposition artifact's weekly rows). Ordinary cadence resumes.
4. **Restart the backend.**
5. **Verify restored active population** (`removed_at IS NULL` back to 1,308; the 340 back in the work queue;
   weekly exclusion no longer applied).
6. **Preserve** the frozen report, machine-readable artifact, baseline, and **all** historical evidence and
   all observations acquired during the experiment. Nothing is deleted or rewritten. The DB backup from
   activation step 1 remains available as a fallback but should not be needed (rollback is forward, not a
   restore).

## 8. Forecast (preserved as forecast, not fact — do not rewrite after observation)
- ~827 symbols removed from routine servicing under the frozen gen-29066 disposition.
- Expected meaningful freshness-SLO improvement.
- Prior central forecast: ~20% improvement.
- Prior uncertainty range: ~5–35%.
- Provider-path utilization improvement is not by itself proof of whole-system improvement and does not
  identify Herbie. Causality must not be claimed from a single short observation window; observe several
  comparable acquisition cycles / multiple sessions before recommending further universe changes.

## 9. Activation & observation (post-approval)
On Principal authorization: prune seed → apply the 340 soft-removals → (approved) enable the weekly seam →
restart backend → observe the **same** baseline telemetry (freshness-SLO attainment, oldest work age,
due-work population, scheduler WIP, productive-symbol revisit cadence, dispatch/completion rate, provider
utilization, throttling/rejection state, recovery behavior) across several cycles. Do not expand or
recompute cohorts during observation.
