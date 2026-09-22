# BUG-015 — Operator Console moneyness sparkline folds multi-day spot history onto a single intraday session, producing misleading (near-straight, chronologically wrong) traces

- **Status:** Open (filed; not fixed by Principal decision)
- **Severity:** S3 (misleading visualization; underlying numeric moneyness values are correct)
- **Area:** Operator Console / moneyness sparkline (`MoneynessCellV4` + `deriveMoneynessHistory`)
- **Provenance:** Discovered 2026-09-14 (Principal observation during the covered-call incident). Filed per Principal decision; remediation deliberately deferred.

## Observed failure

On the Operator Console (Fidelity source), the MONEYNESS-column sparklines for held buy-writes looked internally suspicious:

- SMH: OTM ~ −5.6%, red line rises sharply toward the right.
- PDBC: ITM ~ +5.3%, green line slopes downward.
- WEAT: OTM ~ −2.1%, red line also slopes downward.

PDBC and WEAT showed nearly the same downward geometry despite being on opposite sides of the strike; SMH moved opposite to WEAT despite both being OTM. The traces also looked like near-straight two-point segments — more like a line from a baseline/reference to the current value than a real recent trajectory.

The numeric moneyness values are correct (e.g. SMH spot ~$542.60 vs $575 strike ≈ 5.6% OTM; PDBC ~$20.01 vs $19 ≈ 5.3% ITM; WEAT ~$26.42 vs $27 ≈ 2.1% OTM). The defect is specifically the sparkline geometry.

## Intended semantics violated

The ratified sparkline semantic invariant (`sparkline-scale.ts`): a moneyness-cell sparkline represents the temporal trajectory of the underlying's moneyness over the observation window. Its x-axis must follow real chronology. Here the x-axis does not — multi-day observations are folded onto one intraday session by time-of-day, so the rendered shape is not a faithful temporal trajectory.

## Evidence

Root cause (traced): `deriveMoneynessHistory` (`options-prototype/src/operator-console/moneyness-history.ts`) computes each point's x-position `t` as a fraction of a single 09:30–16:00 ET session **from the observation's time-of-day only, discarding its date**:

```
t = clamp((etMinutesOfDay(observedAt) - 09:30) / 390min, 0, 1)
```

But the real `spot_history` is multi-day. Live DB (read-only, 2026-09-14):

- SMH: 2,514 rows spanning `2026-08-20T14:24Z` → `2026-09-14T14:16Z`
- PDBC: 466 rows spanning `2026-08-20T15:52Z` → `2026-09-14T14:16Z`
- WEAT: 389 rows spanning `2026-08-20T15:38Z` → `2026-09-14T14:16Z`

Consequences that match the observed smell:
1. **Chronology destroyed:** an Aug-20 15:00 ET point and a Sep-14 15:00 ET point both map to `t ≈ 0.85`; points from different days pile onto the same x-band, so the polyline no longer traces real time order.
2. **Collapse to near-straight:** distinct `t` values become few, so the line reads as a segment from an early cluster to the current value.
3. **Direction incoherence:** slope becomes an artifact of which day's time-of-day samples land where, not a real trajectory — explaining PDBC vs WEAT (same downward geometry, opposite moneyness side) and SMH vs WEAT (opposite directions, both OTM).

`deduplicateObservations` removes identical rows but does not fix the cross-day `t` folding. The `< 3 points` fallback does not apply here because there are many points.

Scope note: this is the **Operator Console** moneyness sparkline only. The Deployment (Write Desk) covered-call candidates and their economics are unaffected (separate surface/path).

## Consequence

An operator glancing at the Console moneyness sparkline can misread the recent trajectory/direction of a held position, even though the numeric moneyness is correct. Misleading decision-support visualization → S3.

## Diagnosis / root cause

`deriveMoneynessHistory` positions points by intraday time-of-day fraction while the real evidence spans multiple sessions. The x-axis should represent chronological order across the actual observation window (e.g. by index, or by true elapsed time across `[min, max] observedAt`), not time-of-day within one session.

## Scope / non-goals

Presentation-layer geometry of the Operator Console moneyness sparkline. No change to moneyness math, position monitoring, admissibility, recommendations, or the Deployment surface. Demo-mode synthetic path (evenly-spaced fallback) is not the defect. **Filing does not authorize remediation; fix deliberately deferred by the Principal.**

## Acceptance criteria (for an eventual fix)

- Sparkline x-axis reflects real chronological order of the observation window (no cross-day time-of-day folding).
- Two contracts on the same underlying/window render virtually identical geometry (the ratified consistency corollary).
- Numeric moneyness values unchanged.
- No regression to Demo-mode rendering.

## Remediation history

_(empty — deferred)_

## Verification

_(empty — deferred)_

## Related

- `sparkline-scale.ts` — ratified sparkline semantic invariant (topology-preserving vertical scale); this defect is on the horizontal/time axis.
- Not related to BUG-012/013/014 (session authority / covered-call restoration).

## Audit checkpoint — 2026-09-22

**Disposition:** Confirmed still active on accepted main.

The moneyness-history path still maps observations from multiple dates onto one intraday-session axis, discarding the date dimension and preserving the misleading folded geometry described by this record.

**Restart point:** Reproduce with a multi-day history fixture, then remediate the temporal geometry without changing the correct underlying numeric moneyness values.
