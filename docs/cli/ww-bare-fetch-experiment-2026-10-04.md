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

## Run 1 — cold start, `PROVIDER_UNAVAILABLE`

- Command: `node scripts/wheelwright.mjs fetch -v`
- Elapsed: ~1s. Exit status: **1**. stdout records: **0**.
- stderr terminal line: `ww: fetch did not complete (PROVIDER_UNAVAILABLE)`.
- Cause (grounded in source): `AcquisitionWorker.forceAcquireSymbols` returns `PROVIDER_UNAVAILABLE` immediately when `providerManager.acquisitionAuthorityEstablished()` is false (`"provider_unverified"`). On a freshly restarted backend during a session-blocked weekend, provider authority has not yet been established, because the normal (session-gated) scheduler has not run a verifying cycle. The first targeted acquisition after cold start therefore returns fast without acquiring.
- Contract preserved: noncompletion emitted **no** per-symbol certification and **no** stdout records.

## Run 2 — warm, `NOT_COMPLETED` (timeout) with evidence nonetheless stored

After an intervening single explicit `fetch QQQ` succeeded (`ACQUIRED`, 1/1 held, exit 0) — which established provider authority — the bare fetch was re-run:

- Command: `node scripts/wheelwright.mjs fetch -v`
- Exit status: **1**. stdout records: **0**.
- stderr terminal line: `ww: fetch did not complete (NOT_COMPLETED)`.
- Cause (grounded in source): the backend bounds a single forced targeted acquisition at `FORCED_ACQUISITION_TIMEOUT_MS = 20_000` (20s). The 14-symbol full-option-chain acquisition did not finish within that single 20s bound, so `forceAcquireSymbols` returned `NOT_COMPLETED` and certified nothing per symbol. Exit 1; zero stdout records. Contract preserved.

### Post-run stored-price state (read-only `ww prices`)

Although the fetch operation reported `NOT_COMPLETED`, a subsequent read showed **held prices for all 14 symbols**:

```
BN 36.92 · ETHA 20.11 · GDX 87.78 · GLD 380.14 · IWM 281.52 · QQQ 749.58 ·
SLV 54.74 · SMH 630.60 · SOXL 163.71 · SPY 769.64 · TQQQ 81.01 · URA 39.79 ·
USO 147.37 · XHB 96.70   (all status: ready)

HELD PRICES: 14/14
```

This is the designed orthogonality: **acquisition-operation completion and stored-price state are independent**. The backend acquisition thread kept working past the 20s forced-wait bound and ultimately stored prices for all 14 symbols; the CLI honestly refused to *certify* completion because the bounded operation returned `NOT_COMPLETED`. A later read is the correct way to observe the resulting held evidence. (These prices are weekend/sealed evidence; held ≠ fresh, newly acquired, independently quote-timestamped, or trade-suitable.)

## Honest findings

1. **Selector works and is deterministic.** Monitored UNION seed, dedup of the USO overlap, provenance (monitored/seed/both), monitored-first ordering, stderr-only diagnostics — all exactly as specified.
2. **Acquisition pressure is real and was surfaced, not hidden.** 14 symbols of full-chain acquisition exceed the backend's single 20s forced-acquisition bound, so bare fetch returns `NOT_COMPLETED` even when evidence is actually being stored. This is direct evidence for the acquisition-pressure hypothesis: *a symbol being worth observing does not imply a full option-chain acquisition should be forced for it under a single 20s bound.* The seed was **not** shrunk to hide this.
3. **Cold-start provider authority is a precondition.** The first targeted acquisition after restart can return `PROVIDER_UNAVAILABLE` until provider authority is established; this affects explicit fetch too, not just bare fetch.
4. **Contract preserved under failure.** Both failure modes produced exit 1, zero stdout records, and no false per-symbol certification.
5. **Resolved-empty invariant not exercised but guarded.** The fixed non-empty seed means the resolved set is never empty; the CLI still guards against POSTing a zero-symbol refresh (which the backend would treat as whole-cycle acquisition).

## Product acceptance question

> Does an experienced operator look at this result and think, "Of course these are the symbols you'd fetch by default"?

On the evidence: the *mechanism* is sound, but the *default set* is not yet obviously right. The seed deliberately includes awkward leveraged/sector entries (TQQQ, SOXL) and mixes them with the operator's five monitored positions; a 14-symbol full-chain fetch that cannot complete inside the 20s forced bound is itself a signal that "fetch everything worth glancing at" may be the wrong operation for a default. That is the intended falsification pressure, not a defect. The list was not made prettier before presenting this evidence.
