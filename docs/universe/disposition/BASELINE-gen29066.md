# Generation 29066 Universe Disposition — Immutable Pre-Change Baseline

**Status:** Canonical Project / Operational State (Category C) — immutable experiment baseline
**Do not reconstruct or edit after activation.** This is the frozen "before" state against which
the post-activation observation is compared.

## Capture context

| Field | Value |
|-------|-------|
| Baseline captured at | 2026-09-14T17:50:43Z |
| Repository SYNC SHA | `0a06bd7754be7b412de288cc7b6c2a2fcffbe260` |
| Frozen disposition generation | `29066` |
| Live evidence generation at capture | `29162` |
| Live session state | `REGULAR_OBSERVATION` (market open, acquiring) |
| Provider | tradier, `PRODUCTION_ACTIVE`, `evidenceAvailability: NORMAL` |

> The disposition is frozen at generation 29066. The appliance continues acquiring, so the live
> generation at baseline capture (29162) is later than the frozen analysis generation. This is
> expected and does not affect the frozen cohorts.

## Population distinctions (verified — not assumed equivalent)

| Population | Count | Source |
|------------|------:|--------|
| Canonical seed count | 1,306 | `data/seeds/yahoo-merged-etf-tickers.csv` (rows − header); `universe_sources.yahoo_merged_2026_07 = 1306` |
| Database active-symbol count (`removed_at IS NULL`) | 1,308 | live `data/evidence.sqlite3` |
| Frontend / governed Decision denominator | 1,306 | gen-29066 CSP & Buy-Write exports (unique symbols) |
| `/api/status` reported `evidence.universe` | 1,306 | live status |

**Divergence (pre-existing, out of scope):** the DB holds **2** active symbols not present in the
canonical seed and not in the governed denominator: **`JETS`** and **`TAN`**. These almost certainly
entered via `observation_demand` (portfolio monitoring), not the canonical seed. They are **not** part
of the gen-29066 disposition and are **not** touched by this task. The canonical-removal delta below is
measured against the DB active population.

## Scheduler / servicing telemetry (`/api/status` at capture)

| Metric | Value |
|--------|-------|
| Scheduler state | `acquiring` (currentSymbol `GYLD`) |
| cycleCount | 1121 |
| symbolsAcquiredTotal | 12,587 |
| lastCycleDurationMs | 1,871 |
| failures | 0 |
| Eligible — Class A / B / C / D | 322 / 635 / 0 / 0 |
| Due — Class A / B / C / D | 1 / 23 / 0 / 0 |
| Oldest age (s) — Class A / B | 1,524 / 1,533 |
| Dispatches by class — A / B / C / D | 3,085 / 6,154 / 0 / 0 |
| Service debt — B / CD | 10 / 9,259 |
| Floor dispatches — B / CD | 819 / 0 |
| Publications — total / skipped-no-change / skipped-coalescing | 669 / 79 / 372 |

### Evidence coverage

| Metric | Value |
|--------|-------|
| generation | 29,162 |
| ready | 957 |
| absent | 351 |
| pending / failed / expirationsKnown | 0 / 0 / 0 |
| universe (reported) | 1,306 |

### Decision coverage

| Metric | Value |
|--------|-------|
| eligibleSymbols | 955 |
| currentSymbols | 955 |
| staleSymbols | 0 |
| windowMs | 1,800,000 (30 min) |

### Overlay cohorts

| Cohort | total / current / degraded |
|--------|----------------------------|
| multiDteSurface | 65 / 65 / 0 |
| monitoredPositions | 4 / 4 / 0 |

### Provider utilization (`activeAcquisition`)

| Metric | Value |
|--------|-------|
| authorityId | prod |
| queueDepth | 0 |
| dispatched | 21,855 |
| queued | 21,856 |
| rejected | 0 (no throttling) |
| requestLimit | 119 / 60,000 ms window |
| startsInWindow | 119 |
| nextAdmissionInMs | 6,103 |
| backoffRemainingMs | 0 |

## Expected populations after activation (forecast, not fact)

| Population | Before | Expected after |
|------------|-------:|---------------:|
| DB active-symbol count (`removed_at IS NULL`) | 1,308 | 968 (−340) |
| Canonical seed count | 1,306 | 966 (−340) if seed CSV is also pruned |
| Governed Decision denominator | 1,306 | 966 (−340) once removals are operative |
| Routine-servicing eligible (A+B) | 957 (322 A + 635 B) | reduced by the removed + weekly cohorts once operative |

The 487 `WEEKLY_REFRESH` symbols are **not** removed from the universe; they leave routine/high-frequency
servicing and become eligible for one governed refresh per week. Their exact routine-servicing exclusion
depends on the (unapproved) weekly-cadence seam and is therefore not activated in this baseline step.

## Activation note (operational)

The active universe is loaded **once at backend startup** (`UniverseLoader.loadUniverse` →
`getActiveSymbols()` → `AcquisitionWorker.start(universe)`). There is no live universe-reload endpoint.
Therefore:

- Setting `removed_at` on the 340 rows is durable in SQLite immediately, but the **running worker keeps
  its in-memory symbol list** until the next backend restart.
- **A backend restart is required to make the 340 removals operative.** The database change itself does
  not require a bounce; only operative effect does.
- The weekly-cadence seam (once approved) will follow the same startup-load pattern.

---

# FINAL Pre-Activation Baseline (warmed-up) — authoritative

The baseline above was captured shortly after a backend bounce and includes startup/transient effects.
It is retained as an operational snapshot. **This warmed-up baseline is the authoritative "before" state**
for the activation experiment: captured after the appliance returned to steady normal acquisition
(initial catch-up cycles complete — `lastCycleDurationMs` fell from ~30–44 s during warm-up to a few
seconds; multi-DTE surface recovered to 60/65 current).

| Field | Value |
|-------|-------|
| Final baseline captured at | 2026-09-14T18:23:53Z |
| Repository SYNC SHA | `0a06bd7754be7b412de288cc7b6c2a2fcffbe260` |
| Frozen disposition generation | `29066` |
| Live evidence generation | `29241` |
| Session state | `REGULAR_OBSERVATION` (accepting canonical evidence) |
| Provider | tradier · `PRODUCTION_ACTIVE` · `evidenceAvailability: NORMAL` |

### Scheduler / servicing (warmed-up)

| Metric | Value |
|--------|-------|
| Scheduler state | `acquiring` (currentSymbol `OUSM`) |
| cycleCount | 57 |
| symbolsAcquiredTotal | 855 |
| lastCycleDurationMs | 6,157 (steady incremental cycles; warm-up catch-up over) |
| failures | 1 |
| Eligible — A / B / C / D | 320 / 637 / 0 / 0 |
| Due — A / B / C / D | 81 / 199 / 0 / 0 |
| Oldest age (s) — A / B | 1,834 / 1,834 (~30.6 min; consistent with 25-min target + steady churn) |
| Dispatches by class — A / B | 179 / 381 |
| Service debt — B / CD | 10 / 560 |
| Floor dispatches — B / CD | 55 / 0 |
| Publications — total / skipped-coalescing / skipped-no-change | 40 / 16 / 0 |

### Evidence coverage

| Metric | Value |
|--------|-------|
| generation | 29,241 |
| ready | 957 |
| absent | 351 |
| pending / failed / expirationsKnown | 0 / 0 / 0 |
| universe (reported) | 1,306 |

### Decision / overlays

| Metric | Value |
|--------|-------|
| decisionCoverage eligibleSymbols | 955 |
| decisionCoverage currentSymbols | 935 |
| decisionCoverage staleSymbols | 20 |
| decisionCoverage windowMs | 1,800,000 (30 min) |
| multiDteSurface total / current / degraded | 65 / 60 / 5 |
| monitoredPositions total / current / degraded | 4 / 4 / 0 |

### Provider utilization (warmed-up)

| Metric | Value |
|--------|-------|
| lifecycle | PRODUCTION_ACTIVE |
| queueDepth | 0 |
| dispatched | 1,434 |
| queued | 1,435 |
| rejected | 0 (no throttling) |
| requestLimit / windowMs | 119 / 60,000 |
| startsInWindow | 119 |
| backoffRemainingMs | 0 |

### DB active-symbol count (read-only)
- `symbols WHERE removed_at IS NULL` = **1,308** (unchanged; extras `JETS`,`TAN` still present, out of scope).

### Population distinctions (unchanged, re-verified)
- canonical seed 1,306 · DB active 1,308 · governed Decision denominator 1,306.

> Warm-up note: two backend restarts occurred during this design pass (operational, not activation of any
> gen-29066 disposition). Neither the 340 removals nor the weekly cadence were applied, so these restarts
> did **not** activate the disposition. A post-activation restart is still required to make the removals
> operative.

---

# Warmed-up steady-state baseline samples (multiple)

Per Principal instruction, the "before" side is represented by several comparable steady-state samples, not
a single moment. The earlier "FINAL" sample (18:23:53Z) was captured while the appliance was still
completing warm-up catch-up (multiDte 60/65, decisionCoverage 935/955). The samples below were taken after
full convergence and are the representative pre-activation steady state.

| Sample | Time (UTC) | cycle | lastCycleMs | due A/B/C/D | oldest age s (A/B) | gen | decisionCoverage | multiDte | provider rejected | provider dispatched |
|--------|-----------|------:|------------:|-------------|--------------------|-----|------------------|----------|------------------:|--------------------:|
| pre-1 | 2026-09-14T18:31:52Z | 97 | 842 | 0/1/0/0 | –/902 | 29274 | 955/955 (0 stale) | 65/65 (0 deg) | 0 | — |
| 1 | 2026-09-14T18:32:02Z | 98 | 2,660 | 0/1/0/0 | –/927 | 29275 | 955/955 (0 stale) | 65/65 (0 deg) | 0 | 2,268 |
| 2 | 2026-09-14T18:33:32Z | 101 | 387 | 0/0/0/0 | –/– | 29275 | 955/955 (0 stale) | 65/65 (0 deg) | 0 | 2,268 |
| 3 | 2026-09-14T18:35:02Z | 104 | 243 | 0/0/0/0 | –/– | 29275 | 955/955 (0 stale) | 65/65 (0 deg) | 0 | 2,268 |

**Steady-state characterization (pre-activation, gen-29066 disposition NOT active):**
- Decision coverage saturated: 955/955 current, 0 stale, throughout.
- Multi-DTE surface fully current: 65/65, 0 degraded.
- Due work near zero at steady state (0–1 Class B); short incremental cycles (243–2,660 ms).
- Provider healthy: 0 rejections; dispatched flat between samples (in-window churn only).
- Evidence generation advancing slowly (29274→29275) — normal steady coalesced publication.
- DB active-symbol count 1,308; session `REGULAR_OBSERVATION`; SYNC `0a06bd7…`.

This is the representative "before" state. Post-activation observation (§9 of IMPLEMENTATION) must compare
against these steady-state samples, not the warm-up transient.
