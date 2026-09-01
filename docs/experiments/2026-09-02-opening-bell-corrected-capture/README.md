# Opening-Bell Corrected Opportunity-History Capture — 2026-09-02

**Status:** ARMED (documentation only). Substantive analysis NOT run tonight.
**Authority:** Category D — Reconciliation / Checkpoint Artifact (provenance for a future capture). Non-governing.
**Owner concept:** `PL-DEPLOY-02` / `PL-EVID-01`; unblocked by `PL-DEPLOY-02-DEF01` remediation (`c5df959`).
**Method context:** `docs/foundations/idea-intake-reconciliation.md`; 2026-08-27 3AM ruling (`baseline → retain → accumulate → analyze → govern`).

---

## Purpose

Capture a **corrected opportunity-history accumulation** across a full regular session, now that the
winner-economics HTTP-boundary defect (`PL-DEPLOY-02-DEF01`) is repaired and deployed. This is the
first session in which the opportunity-history fact plane records **complete winner economics**
(delta, strike, midpoint, spread, OI, volume, annualized yield, posture) for winner-required states.

**This is NOT the first A/B/C/D experiment.** A/B/C/D dispatch was already measured 2026-08-27 and
interpreted by the 2026-08-27 ruling. This capture is about **corrected economics-bearing
opportunity-history**, not scheduler service-class distribution. Existing scheduler/provider telemetry
may be retained as context only; A/B/C/D must not be promoted to operator-value or decision-frontier
semantics.

---

## Two distinct boundaries (do not collapse)

| Boundary | Fact | Value |
|----------|------|-------|
| **(1) Economics-valid accumulation boundary** (tonight) | When the instrument began truthfully persisting winner economics | Deploy SHA `c5df959`; backend restart PID **51965** (prior PID 42874 retired); real economics-valid rows begin at the **first real (non-sentinel) browser emission after the restart**. See "Sentinel exclusion" below. |
| **(2) Opening-bell analysis boundary** (tomorrow) | The analytical start of this capture window | **2026-09-02, 09:30:00 ET / 07:30:00 MDT** |

Boundary (1) is a code/runtime provenance fact. Boundary (2) is the analysis-window start. They are
different facts and must remain distinct in every derived record.

---

## Cold-reconstruct provenance manifest

- **Repository SHA at capture (runtime bytecode):** `c5df959` (`fix(PL-DEPLOY-02-DEF01)`), local == origin/main at arming.
  - Prior commits in the chain: `4398502` (DEF01 docs), `623487f` (D1–D3 chronology correction).
- **Economics-valid accumulation boundary:** SHA `c5df959`; backend restart **PID 51965**; sentinels excluded (below).
- **Backend/runtime identity at arming:** environment=`production`, provider=`tradier`, generation `20470`,
  last real publication `generatedAt=2026-09-01T20:16:02.500127Z`, sessionState `unknown` (post-restart warmup;
  clock-skew on the dev host means the shell clock is unreliable — use backend-reported values only).
- **Opportunity-history starting counts (post-deploy, incl. sentinels):** epochs `990`, symbolObservations `1,225,801`, surfaceObservations `62,406`.
  - Of these, **62,404** are pre-fix rows with NULL economics (partially valid per `PL-DEPLOY-02-DEF01`);
    **2** surface rows are deploy-smoke sentinels (below).
- **Provider-event starting cursor:** fresh process — `newestSequence`/`oldestSequence` null, `eventsDropped=0` at arming.
  If provider telemetry is retained alongside this capture, record the cursor again at the opening bell.
- **Observer launch/armed timestamp:** this artifact created during the 2026-09-01 evening deploy session
  (record the actual observer-armed wall-clock at the bell, from the backend, when the capture begins).
- **Runtime discontinuities (hard regime boundaries):** the 2026-09-01 restart (PID 42874 → 51965) onto `c5df959`
  is a hard boundary. Any further restart before/at the bell is another hard boundary and must be recorded;
  never difference cumulative counters across a restart.

---

## Sentinel exclusion (deploy-smoke rows — exclude from ALL economics analysis)

The `PL-DEPLOY-02-DEF01` deploy verification wrote synthetic smoke rows to the production DB. They are the
first economics-bearing rows chronologically but are **NOT real Decision evidence**. Preserve (do not delete;
append-only), but **exclude** from every economics population:

- Epochs: `ep_def01_smoke_c5df959` (policy `PL-DEPLOY-02-DEF01-smoke`), `ep_smoke_min` (policy `smoke`).
- Surface rows: `so_def01_smoke_actionable`, `so_def01_smoke_nodelta`.
- Symbol row: `sy_def01_smoke`.
- All carry `symbol = '__DEF01_SMOKE__'`.
- The rejected sentinel epoch `ep_def01_smoke_reject` correctly left **no** surface row (422 governed rejection).

**Exclusion predicate for analysis:** `symbol <> '__DEF01_SMOKE__'` AND `policy_version NOT LIKE '%smoke%'`.

**Real economics-valid accumulation therefore begins at the first real browser emission after the restart**
(expected at/after the 2026-09-02 opening bell), not at the sentinel rows.

---

## Arming checklist (before the bell)

- [ ] Observer/capture machinery started and stable BEFORE 09:30:00 ET so process startup does not consume the window.
- [ ] Confirm backend is on `c5df959` (PID, `/api/status` identity) and `environment=production`.
- [ ] Record backend-reported opening `generation`, `generatedAt`, `sessionState`, and opportunity-history counts at the bell.
- [ ] Record provider-event cursor at the bell (if provider telemetry retained).
- [ ] Note any restart between arming and the bell as a hard regime boundary.

## Capture discipline (during the session)

- Observe-only. No scheduler/acquisition/retention/schema/policy changes.
- Retain raw `/api/status` and `/api/opportunity-history/counts` samples + (optional) provider-events cursor pages.
- Do NOT run substantive opportunity-cost / membership-usefulness analysis during the capture; that is a
  later `analyze` step gated on sufficient corrected accumulation.

## Explicitly NOT authorized by this artifact

- No `analyze`-step substantive analysis tonight or implied for the bell.
- No acquisition-prioritization design; no A/B/C/D promotion to operator value.
- No runtime/scheduler/universe/session changes.
