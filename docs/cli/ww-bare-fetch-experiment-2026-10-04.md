# Bare `ww fetch` — real experiment evidence (2026-10-04)

**Status:** Captured experimental evidence for Principal review; **not** a Product acceptance decision and not a ratified default.
**Authority:** `PL-CLI-01` bare-fetch experiment; pre-implementation checkpoint `docs/72-pl-cli-bare-fetch-pre-implementation-checkpoint-2026-10-04.md`.
**Backend:** local evidence appliance on `:3100`, built and run from the `/Users/bollich/kiro/options` tree (the tree carrying `MonitoredController` and the bare-fetch CLI). Tradier **production** credential configured; `credentialConfigured=true`.
**Honesty note:** results are recorded as observed. The first run failed; it is preserved, not discarded.

---

## Pre-experiment state

- `GET /api/evidence/monitored` → `200` `{"symbols":["BN","ETHA","URA","USO","XHB"],"count":5,"meaning":"last declared monitored symbols"}`
- `/api/status`: `session.state = NON_TRADING_DAY` (canonical session date `2026-10-02`), `scheduler.state = session_blocked`, `monitoredPositions = {total:5, current:0, degraded:5}`, `environment = production`.

The weekend/non-trading posture matters: the scheduler is session-blocked, so it is not independently establishing provider authority or acquiring. Targeted `fetch` deliberately bypasses the session gate (`PL-OPS-09`), so it can still attempt acquisition.

## Selector resolution (identical across both runs)

Bare `ww fetch -v` resolved the experimental default deterministically:

```
Default selection: 14 symbol(s) (5 monitored, 10 seed; 4 monitored-only, 9 seed-only, 1 both)
BN    monitored
ETHA  monitored
URA   monitored
USO   both
XHB   monitored
SPY   experimental-seed
QQQ   experimental-seed
IWM   experimental-seed
SLV   experimental-seed
GLD   experimental-seed
TQQQ  experimental-seed
SMH   experimental-seed
SOXL  experimental-seed
GDX   experimental-seed
```

- **Monitored returned:** BN, ETHA, URA, USO, XHB (5).
- **Fixed seed:** SPY, QQQ, IWM, SLV, GLD, TQQQ, USO, SMH, SOXL, GDX (10).
- **Distinct union:** 14.
- **Overlap:** USO (monitored ∩ seed) → marked `both`, acquired once.
- **Order:** monitored first (declared order), then seed-only (seed order). Not a weighted score.
- Selection diagnostics went to **stderr** only; machine **stdout** carried no selection prose.

## Run 1 — shortly after backend restart, `PROVIDER_UNAVAILABLE` (NORMAL startup state)

- Command: `node scripts/wheelwright.mjs fetch -v`
- Elapsed: ~1s. Exit status: **1**. stdout records: **0**.
- stderr terminal line: `ww: fetch did not complete (PROVIDER_UNAVAILABLE)`.
- Interpretation: this is **normal backend startup behavior**, not a defect, API gap, bug, or weekend-specific blocker. The backend takes a couple of minutes to come fully online and establish provider authority after a restart; a targeted acquisition issued before that is reported as `PROVIDER_UNAVAILABLE`. The CLI relayed the backend's outcome truthfully and exited nonzero. Preserved here only as observed startup-state evidence.
- Contract preserved: noncompletion emitted **no** per-symbol certification and **no** stdout records.

## Run 2 — provider authority established, `NOT_COMPLETED` (20s synchronous timeout too short)

After the backend finished starting up and provider authority was established (confirmed by an intervening single explicit `fetch QQQ` succeeding: `ACQUIRED`, 1/1 held, exit 0), the bare fetch was re-run:

- Command: `node scripts/wheelwright.mjs fetch -v`
- Exit status: **1**. stdout records: **0**.
- stderr terminal line: `ww: fetch did not complete (NOT_COMPLETED)`.
- Cause (grounded in source): the backend bounds a single synchronous forced targeted acquisition at `FORCED_ACQUISITION_TIMEOUT_MS = 20_000` (20s). The legitimate 14-symbol request did not finish within that single 20s bound, so `forceAcquireSymbols` returned `NOT_COMPLETED` and certified nothing per symbol. Exit 1; zero stdout records. Contract preserved.
- Plain reading: **bare `ww fetch` correctly resolved 14 symbols, but the current 20-second forced-acquisition timeout was too short for that synchronous 14-symbol request.** This is a possible backend timeout/configuration limitation for a legitimate synchronous fetch workload — not a CLI defect and not evidence that the CLI should become asynchronous.

### Post-run stored-price state (read-only `ww prices`)

A subsequent read showed **held prices for all 14 symbols**:

```
BN 36.92 · ETHA 20.11 · GDX 87.78 · GLD 380.14 · IWM 281.52 · QQQ 749.58 ·
SLV 54.74 · SMH 630.60 · SOXL 163.71 · SPY 769.64 · TQQQ 81.01 · URA 39.79 ·
USO 147.37 · XHB 96.70   (all status: ready)

HELD PRICES: 14/14
```

That all 14 prices were held afterward shows the requested acquisition was **viable and continued progressing** — the request was legitimate; the single synchronous bound was simply shorter than the work took. It is **not** evidence that `ww fetch` needs asynchronous/background/polling/eventual-completion semantics (none were requested). It also illustrates the designed orthogonality that acquisition-operation completion and stored-price state are independent facts; a later read is the correct way to observe held evidence. (These prices are weekend/sealed evidence; held ≠ fresh, newly acquired, independently quote-timestamped, or trade-suitable.)

## Honest findings

1. **Selector works and is deterministic.** Monitored UNION seed, dedup of the USO overlap, provenance (monitored/seed/both), monitored-first ordering, stderr-only diagnostics — all exactly as specified.
2. **The 20s synchronous forced-acquisition timeout was too short for the legitimate 14-symbol request.** Bare fetch correctly resolved 14 symbols; the backend's single 20s forced-acquisition bound (`FORCED_ACQUISITION_TIMEOUT_MS`) elapsed before the work finished, so it returned `NOT_COMPLETED`. All 14 prices were nonetheless held afterward, showing the request was viable and progressing. This is a possible **backend timeout/configuration limitation** for legitimate synchronous fetch workloads. It does **not** justify an acquisition-architecture redesign, and it does **not** imply the CLI should become asynchronous. The seed was not shrunk.
3. **`PROVIDER_UNAVAILABLE` shortly after restart is normal startup state.** The backend takes a couple of minutes to establish provider authority after a restart; a targeted acquisition issued before then is reported as `PROVIDER_UNAVAILABLE`. Not a defect, gap, bug, or weekend-specific blocker. (It applies to explicit fetch too, not just bare fetch.)
4. **Contract preserved under failure.** Both outcomes produced exit 1, zero stdout records, and no false per-symbol certification.
5. **Resolved-empty invariant not exercised but guarded.** The fixed non-empty seed means the resolved set is never empty; the CLI still guards against POSTing a zero-symbol refresh (which the backend would treat as whole-cycle acquisition).

## Product acceptance question

> Does an experienced operator look at this result and think, "Of course these are the symbols you'd fetch by default"?

On the evidence: the *mechanism* is sound, but the *default set* is not yet obviously right. The seed deliberately includes awkward leveraged/sector entries (TQQQ, SOXL) and mixes them with the operator's five monitored positions, so an experienced operator would not yet say "of course." That is the intended falsification pressure on the default *selection*. (The 20s synchronous timeout is a separate backend-configuration observation about this fetch workload, not a judgment about which symbols belong in the default.) The list was not made prettier before presenting this evidence.
