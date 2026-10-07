# BUG-033 — Active-position Greeks go stale (≈1 day old) during an open session, misrepresenting live risk

- **Status:** Open
- **Severity:** Not established
- **Area:** Backend / evidence acquisition coverage + freshness for held (active) positions ↔ Operator Console Greeks presentation
- **Provenance:** Operator observation 2026-10-07 (IBIT buy-write), two Principal-provided position exports (normal vs. forced update)

## Observed failure

On 2026-10-07, during an open session, an active position (IBIT buy-write, short the 2026-10-09 47.5 call) was presented with a **Greek Age of `1d`** while every co-displayed quote/spot field was current (Today's G/L, spot). The day-old Greek bundle produced an internally incoherent and materially misleading risk reading:

Normal (stale) export — IBIT:

| Field | Value |
|-------|-------|
| Spot | 47.13 (OTM: strike 47.5 > spot) |
| Moneyness | −0.8% |
| Delta | **0.83** |
| Gamma | 0.1583 |
| Theta | −0.0640 |
| Bid/Ask | 1.39 / 1.42 |
| Greek Age | **1d** |
| Quote Freshness | 9m |

A slightly-OTM, near-ATM call with ~2 DTE cannot carry a 0.83 delta. The 0.83 is a capture-time value from ~1 day earlier when the option was higher/ITM. The displayed Gamma (near-ATM shape) and Delta (fairly-ITM shape) **disagree with each other**, confirming the bundle is not co-temporal with the live spot. The stale bid/ask (1.39/1.42) was likewise ~1 day old.

Forced-update export — same IBIT position, essentially unchanged spot:

| Field | Value |
|-------|-------|
| Spot | 47.18 |
| Delta | **0.37** |
| Gamma | 0.3101 |
| Theta | −0.1162 |
| Bid/Ask | 0.36 / 0.37 |
| Greek Age | **2m** |

With a fresh Greek bundle, Delta reads 0.37 — the expected magnitude for a slightly-OTM near-ATM 2-DTE call. The forced update producing correct values demonstrates the **Greek computation/normalization path is sound**; the defect is that the normal acquisition cadence allowed an active position's Greek+quote bundle to age ≈1 day during a live session.

## Intended semantics violated

- **Session awareness is correctness** (`foundations/evidence-appliance.md`): during an open session, evidence for active positions *can and does* change. Serving a day-old Greek bundle while the session is open contradicts the appliance's obligation to maintain a current authoritative model of the opportunity/position environment.
- **Persist facts; derive trust** (project identity principle 3): freshness/staleness is derived at query time. The system *did* derive and display `Greek Age: 1d`, but tolerating that age on an active position during an open session is an acquisition-coverage failure, not merely a labeling one.
- **Tiered acquisition freshness** (`foundations/acquisition-scheduler-policy.md`): Class A (ready symbols with qualifying puts) targets ≤15 min chain age. An active held position carrying a ~1-day-old Greek bundle during an open session indicates held/active-position symbols are not receiving acquisition freshness commensurate with their risk significance.

## Consequence

The operator's live risk picture is wrong. A buy-write whose true short-call delta is ~0.37 was presented as ~0.83, overstating directional exposure / assignment proximity on an active position two days from expiration. For a decision-support appliance, a stale-but-confidently-presented Greek on an *open* position is a correctness failure in the primary risk signal. Severity not established pending Principal classification; the Principal has characterized a 1d Greek age on an active position during an open session as "unacceptable."

## Diagnosis / root cause

**Established by code trace.** The defect is localized to the scheduler admission gate. The initial "separate acquisition paths for spot vs. Greeks" hypothesis is refuted (Greeks and spot are co-persisted on the same chain row per expiration), and an earlier draft of this record wrongly stated that "held positions get no acquisition priority that protects their own expiration." That is **incorrect**: a held-expiration acquisition mechanism provably exists (migration 007). The real, narrower defect is a distinction between **held-expiration acquisition** and **held-expiration freshness at the scheduler admission gate**.

> **Held expirations are acquisition obligations, but they are not freshness obligations at the scheduler admission gate.**

Mechanism:

1. **Greeks and spot are co-sourced per chain, per expiration.** `TradierAdapter.getOptionsChain` requests `/markets/options/chains?...&greeks=true` and stamps the underlying price onto that chain row at the chain's `retrievedAt` (`TradierAdapter.java` ~110–156, ~361–366; `normalizeChain` ~549–573). Greeks are not independently timestamped from spot *within a given chain row*.

2. **Displayed spot and Greeks come from DIFFERENT chain rows keyed by DIFFERENT expirations.**
   - **Quote Freshness / spot** is read from the chain row for the symbol's **`primary_expiration`**: `getQuoteObservations` sets both `price` and `observedAt` from that row (`SqliteEvidenceStore.java` ~1152–1197).
   - **Greek Age / Greeks** are looked up from the durable chain cache record keyed by the **position's OWN held expiration** (`contract-greek-lookup.ts` `lookupContractGreeksWithAge` ~104–125), age from that record's authoritative `evidenceProvenance.acquiredAtMs`.
   - `OperatorConsole.tsx` (~505, ~556–576) computes the two columns from these two distinct sources, **honestly**. The frontend is correct and is not the defect.

3. **A held-expiration ACQUISITION mechanism exists and works.** The frontend extracts the exact held `(symbol, expiration)` pairs and POSTs them to `/api/evidence/observe` (`use-observations.ts` `extractHeldExpirations` / `ensureObservable`), explicitly so the backend "keeps their chains refreshed even below the 7-45 DTE window." The backend persists them (`held_expiration` table, migration 007; `SqliteEvidenceStore.setHeldExpirations` ~423) and, **once a symbol is being serviced**, unions the held expirations into the fetched set (`AcquisitionWorker.acquireAllEligibleChains` ~1662–1690, `store.getHeldExpirations(symbol)` at ~1676). `HeldExpirationAcquisitionTest` proves the worker fetches a held 3-DTE chain that ordinary 7–45 DTE eligibility would exclude, and excludes an unheld sub-window expiration. So once IBIT is dispatched, its held 2026-10-09 chain **is** fetched correctly.

4. **But the SCHEDULER ADMISSION gate ignores held-expiration age.** `getPrioritizedWorkQueue` decides whether a symbol needs service at all using only the symbol's **`newestChainAge`**: `primaryDue = newestChainAge >= config.chainFreshnessTargetMs()` and `monitoredDue = isMonitored && newestChainAge >= config.monitoredFreshnessTargetMs()` (`SqliteEvidenceStore.java` ~1489–1497). The `held_expiration` table is **never consulted** in this admission decision. The monitored overlay also does not change recommendation class (~1502–1505). Consequently, **if any IBIT chain (e.g. a different/primary expiration) was recently acquired, `newestChainAge` is small and IBIT is excluded from the work queue** — so the servicing step in point 3 that would refresh the held 2026-10-09 chain never runs, and that held chain ages indefinitely.

5. **Why the forced update fixed it.** `POST /api/evidence/refresh?symbol=...` → `AcquisitionWorker.forceAcquireSymbols` re-observes the exact symbol **regardless of freshness**, bypassing the symbol-level admission gate (and the session gate), through the identical provider/persistence path. It therefore reaches the point-3 held-expiration servicing, re-stamps the held chain, and Delta corrected 0.83 → 0.37. This behavior is exactly what the admission-gate diagnosis predicts.

6. **The removed multi-DTE surface obligation is historical context, not the fix.** The blanket "refresh every eligible 7–45 DTE expiration on a ~25-min target" obligation was removed (`SqliteEvidenceStore.java` ~1483–1491). It *happened* to mask this failure by keeping non-primary chains fresh, but restoring it is **not** the conceptual fix — it would refresh many chains the operator does not hold. The correct, tighter invariant is below.

**The invariant the fix must satisfy:**

> **Every currently-held `(symbol, expiration)` must independently satisfy the active-position freshness target at the scheduler admission gate** — i.e. a held expiration's own chain age (not the symbol's `newestChainAge`, and not only `primary_expiration`) must be able to make the symbol due for service during an open session.

**Owner of the fix:** the backend scheduler admission logic, `SqliteEvidenceStore.getPrioritizedWorkQueue` (the due decision must incorporate held-expiration age). The acquisition/servicing side (point 3) already does the right thing once admitted. The frontend reports ages honestly and needs no change. Per Authority-Before-Consumers, the repair belongs at the scheduler, not the console.

**Useful (but no longer necessary) incident evidence from the live DB:** confirming that at defect time IBIT held a ~1-day-old 2026-10-09 chain row while a *different* IBIT chain row was fresh (small `newestChainAge`) would directly exhibit the suppression. This is corroborating evidence; the source trace already explains how the code permits exactly this state. The configured values of `chainFreshnessTargetMs()` / `monitoredFreshnessTargetMs()` and whether the symbol was registered monitored remain unread but are not required to localize the defect.

## Scope / non-goals

- Covers: staleness of the Greek+quote bundle for **active/held positions** during an **open session**, and the acquisition-coverage/freshness authority responsible for refreshing it.
- Does not cover: Greek math/normalization correctness (demonstrated sound by the forced update), nor the zero-vs-absent Delta presentation ambiguity (BUG-011), nor general multi-source temporal composition (BUG-004) except as cross-linked context.
- **Filing does not authorize remediation.** Root-cause investigation and any fix require separate explicit Principal authorization.

## Acceptance criteria

(To be confirmed with the Principal; provisional, derived from the observed failure and code trace.)

- During an open session, the scheduler admission gate (`getPrioritizedWorkQueue`) makes a symbol due for service when **any currently-held `(symbol, expiration)`'s own chain age** exceeds the active-position freshness target — independent of the symbol's `newestChainAge` and independent of `primary_expiration`. A fresh unrelated/primary chain must not suppress servicing of a stale held expiration.
- The fix is scoped to the admission gate, **not** a restoration of the blanket multi-DTE surface obligation (that would refresh unheld chains the operator does not care about).
- The held-expiration acquisition/servicing path (`AcquisitionWorker.acquireAllEligibleChains`, migration 007) is unchanged — it already fetches the held expiration correctly once the symbol is admitted.
- Displayed Greeks for an active position end up co-temporal with the displayed spot such that Delta and Gamma are mutually consistent for the current moneyness.
- The fix lives at the scheduler (backend), not as consumer-side compensation in the Operator Console. The frontend's honest two-column (Greek Age vs Quote Freshness) reporting is correct and must be preserved.

## Remediation history

Empty while Open.

## Verification

Empty while Open.

## Related

- **BUG-004** — Console composes temporally incompatible evidence into an apparently-coherent view (closest conceptual cousin: temporal coherence of composed evidence; here spot and Greeks are co-displayed from different-age chain rows).
- **BUG-011** — Provider-reported exact-zero Delta rendered indistinguishably from absent Delta (adjacent Greeks-presentation defect, distinct cause).
- `foundations/evidence-appliance.md` — session awareness as correctness; sealed vs. live evidence.
- `foundations/acquisition-scheduler-policy.md` — tiered A/B/C/D freshness targets; the multi-DTE surface obligation whose removal is implicated here.
- Authority-Before-Consumers rule (`.kiro/steering/development-workflow.md`) — repair stale authoritative facts upstream, not in consumers.

### Key code locations (from 2026-10-07 trace)

- `evidence-service-java/.../db/SqliteEvidenceStore.java` — **the defect's owner:** `getPrioritizedWorkQueue` admission gate uses only `newestChainAge` for `primaryDue`/`monitoredDue` (~1489–1497), never consulting `held_expiration`; removed multi-DTE surface obligation (~1483–1491); `getQuoteObservations` (spot/`observedAt` from `primary_expiration` chain row ~1152–1197); `setHeldExpirations`/`getHeldExpirations` (~423–462).
- `evidence-service-java/.../AcquisitionWorker.java` — `acquireAllEligibleChains` unions held expirations into the fetched set **after** admission (`store.getHeldExpirations(symbol)` ~1676); `forceAcquireSymbols` bypasses the admission gate (explains the forced-update correction).
- `evidence-service-java/.../ObserveController.java` — `/api/evidence/observe` accepts and persists the `heldExpirations` overlay (present-vs-omitted lifecycle contract ~60–142).
- `options-prototype/src/evidence/use-observations.ts` — `extractHeldExpirations` / `ensureObservable` POST the exact held `(symbol, expiration)` pairs so held chains stay refreshed below the 7–45 DTE window.
- `evidence-service-java/.../HeldExpirationAcquisitionTest.java` — proves the worker fetches a held sub-window chain and excludes an unheld one (acquisition side is correct).
- `options-prototype/src/write-desk/contract-greek-lookup.ts` — `lookupContractGreeksWithAge` derives Greek Age from the held-expiration chain cache record's provenance.
- `options-prototype/src/components/OperatorConsole.tsx` — computes/renders Greek Age vs Quote Freshness from the two distinct sources (CSV header ~505; columns ~556–576).
- `evidence-service-java/.../provider/TradierAdapter.java` — Greeks (`chains?...&greeks=true`) and spot co-persisted on one chain row per expiration (`getOptionsChain` ~110–156).
