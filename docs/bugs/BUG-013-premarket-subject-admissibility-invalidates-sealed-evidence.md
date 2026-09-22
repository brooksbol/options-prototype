# BUG-013 — During trading-day PREMARKET, per-subject admissibility invalidates prior-session sealed evidence that session-level classification still treats as canonical

- **Status:** Open (fix implemented, awaiting Principal browser verification)
- **Severity:** S2
- **Area:** Backend / `SessionClassifier` per-subject admissibility vs session-level canonical state
- **Provenance:** Discovered 2026-09-14 (~00:28 ET) during BUG-012 diagnosis. No GitHub Issue (repository-native defect system).

## Observed failure

On Monday 2026-09-14 at 00:28 ET (Sunday 22:28 MDT), the Deployment surface showed `PRE-MARKET` and the funnel collapsed to `11 No Delta Match · 130 No DTE Match · 1165 Incomplete` with zero CSP/buy-write rows. Direct comparison of two live snapshots of the identical Friday chains:

| Session state (ET clock) | Friday eligible (7–45 DTE) chains: admissible / inadmissible |
|---|---|
| `NON_TRADING_DAY` (Sunday) | **2210 / 0** |
| `PREMARKET` (Monday 00:28 ET) | **0 / 2210** |

Same 955 ready symbols, same Friday chains, same `canonicalSessionDate: 2026-09-11` — every eligible Friday chain flipped from `admissible:true` to `admissible:false` purely because the ET clock crossed midnight into Monday.

## Intended semantics violated

Sealed-evidence validity: a completed session's evidence remains valid until superseded by the next session ("Friday's sealed close remains valid through the weekend and into Monday pre-open"). Session-level classification honors this — in PREMARKET it correctly reports `canonicalSessionDate = 2026-09-11` (prior session). But **per-subject admissibility contradicted the session-level canonical state**: it evaluated the prior-session chain's timestamp against the CURRENT trading day's `[open, close]` window, which a Friday-acquired chain can never satisfy, and marked it inadmissible. Per-subject admissibility must agree with the canonical-session state machine.

## Evidence

`SessionClassifier.admissibilityForSubject(env, acquiredAt, now)` had two branches:
- **Non-trading day** (Sat/Sun/holiday): `admissible = acquiredAt != null` → Friday chains admissible as sealed evidence. Correct.
- **Trading day** (entered at Monday 00:00 ET, well before the 09:30 open): computed `admissible = effectiveMs ∈ [todayOpen, todayClose]`. A Friday-afternoon `acquiredAt` is far below Monday's open ⇒ `admissible = false`. The branch's own comment acknowledged it: *"Prior-session sealed evidence is not represented per-subject here … before-boundary we simply report the prior canonical date with the subject inadmissible for today."* That is precisely the inconsistency: it reported Friday as canonical while marking Friday's evidence inadmissible.

This was decisive on its own (2210/0 → 0/2210 flip on identical chains); the 141-vs-1165 funnel split was not needed to localize it.

## Consequence

Every trading-day pre-open window (roughly the overnight hours into each trading morning), the Deployment surface loses all prior-session rows even though sealed evidence is present and canonical — the operator arrives to an empty board pre-open. Operator-facing correctness failure on a primary surface → **S2**.

## Diagnosis / root cause

Per-subject admissibility did not agree with the session-level canonical state machine before the current session's admissibility boundary. It must, in PREMARKET / pre-open, treat a prior-session-acquired subject as canonical **when the prior session is operationally valid** (the same authority the session-level classifier consults).

**Coupled upstream defect:** the "prior session operationally valid" authority this fix depends on (`hasCompletePublishedSession`) was itself defective — see **BUG-014**. BUG-013 is the per-subject inconsistency; BUG-014 is the durable-validity authority it consumes. Both had to be repaired for the board to recover; a correct BUG-013 consumer of a `false` BUG-014 boolean would still show an empty board.

## Scope / non-goals

`SessionClassifier.admissibilityForSubject` before-boundary branch only. Does not weaken ADR-017, change frontend precedence, reacquire data, or special-case symbols. Production vs delayed/sandbox semantics preserved. Not a blanket "PREMARKET ⇒ admissible" pass.

## Acceptance criteria

- Sat/Sun/holiday: prior completed-session sealed evidence admissible (unchanged).
- Trading-day PREMARKET (and pre-open portion of open-delay): prior completed-session sealed evidence admissible **iff** the prior session is operationally valid.
- REGULAR_OBSERVATION: current-session admissibility uses the current session window as designed; a prior-session chain is NOT treated as current-session evidence.
- CLOSED_CANONICAL: completed current-session sealed evidence remains admissible.
- Production vs delayed/sandbox semantics remain distinct.

## Remediation history

Implemented (not committed; awaiting Principal browser verification) in `SessionClassifier.admissibilityForSubject`. Before the current session's admissibility boundary, a prior-session subject is admissible iff **(a)** `persistedSessionValid.test(previousTradingDay)` is true (the same authority the session-level classification consults for `priorSessionOperationallyValid`), AND **(b)** its effective observation (acquisition minus the authority's delay) falls within the PRIOR session's `[open, close]` window (genuine prior-session sealed evidence, not a stray timestamp). At/after the boundary, current-session semantics are unchanged. Depends on BUG-014 repairing `hasCompletePublishedSession`.

## Verification

`SessionClassifierTest.SealedEvidenceAcrossMidnight` (6 tests): Sunday→Friday chain admissible; Monday 00:28 PREMARKET→same Friday chain still admissible when prior session valid; PREMARKET with prior session NOT operationally valid→Friday chain not admitted; Monday REGULAR_OBSERVATION→Friday chain not current-session evidence; production vs sandbox distinct in PREMARKET; a chain acquired after Friday close is not admitted as Friday sealed evidence. All pass. Existing SessionClassifier subject-admissibility tests remain green. **Live browser verification pending** (requires backend restart to load the change and run BUG-014's migration).

## Related

- **BUG-014** — the coupled upstream durable-validity authority defect this fix consumes.
- **BUG-012** — the frontend consumer-path race (separate defect; same empty-board symptom).
- **ADR-015 / ADR-016 / ADR-017** — the authority-precedence spine.
- Sealed-evidence validity invariant (`docs/foundations/backend-behavioral-invariants.md`, `docs/07-architecture-current.md`).

## Audit checkpoint — 2026-09-22

**Disposition:** Open — technical remediation verified; Product acceptance outstanding.

The remediation is committed on current main (the audit identified implementation commit `a1028a0`). Focused `SessionClassifier` verification passes across Sunday/non-trading, Monday PREMARKET, regular session, invalid-prior-session, production-vs-sandbox, and after-close boundary specimens. The prior-session admissibility behavior described by the defect is technically repaired.

The record's older "not committed" wording is superseded by this checkpoint. Browser/Product verification remains outstanding and was not simulated during the current regular session.

**Restart point:** Observe the Deployment surface through the relevant premarket/sealed-evidence boundary with the current backend. If Product behavior matches the automated acceptance evidence, disposition as Resolved.
