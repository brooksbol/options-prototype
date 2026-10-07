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

**Established by code trace (one live-DB disambiguation remaining).** The initial "separate acquisition paths for spot vs. Greeks" hypothesis is **refuted at the provider level and refined**: Greeks and spot are *co-persisted on the same chain evidence row, per expiration*. The staleness arises from a **per-expiration freshness divergence** combined with the absence of any held-position freshness guarantee.

Mechanism:

1. **Greeks and spot are co-sourced per chain, per expiration.** `TradierAdapter.getOptionsChain` requests `/markets/options/chains?...&greeks=true` and stamps the underlying price onto that chain row at the chain's `retrievedAt` (`TradierAdapter.java` ~110–156, ~361–366; `normalizeChain` ~549–573). Greeks are not independently timestamped from spot *within a given chain row*.

2. **But the operator's displayed spot and Greeks come from DIFFERENT chain rows keyed by DIFFERENT expirations.**
   - **Quote Freshness / spot** is read from the chain row for the symbol's **`primary_expiration`**: `getQuoteObservations` sets both `price` and `observedAt` from that row (`SqliteEvidenceStore.java` ~1152–1197), served as `observation.observedAt`.
   - **Greek Age / Greeks** are looked up from the durable chain cache record keyed by the **position's OWN held expiration** (`contract-greek-lookup.ts` `lookupContractGreeksWithAge` ~104–125), with age taken from that record's authoritative `evidenceProvenance.acquiredAtMs`.
   - When the held expiration ≠ `primary_expiration` (or its chain row is simply older), **spot stays fresh via the primary-expiration chain while the held-expiration chain — carrying the Greeks — ages silently.** `OperatorConsole.tsx` ~505, ~556–576 computes the two columns from these two distinct sources, honestly.

3. **Held positions get no acquisition priority that protects their own expiration.** The scheduler universe is the ~1286-symbol `symbol_resolution` set, not the operator's portfolio. The only portfolio-awareness is a "monitored" overlay (`monitored_at`) that **explicitly does not change recommendation class** (`SqliteEvidenceStore.java` ~1502–1505) and whose due test uses `newestChainAge`, not the held expiration's age (~1495). Final ordering is a breadth-first/stale-frontier sweep across A/B (~1600–1631).

4. **The policy change that lets non-primary held expirations age silently.** The blanket multi-DTE "surface obligation" that previously forced every eligible 7–45 DTE expiration to refresh on a ~25-min target was **removed** (`SqliteEvidenceStore.java` ~1483–1491, "The blanket multi-DTE 25-min SURFACE obligation is REMOVED"). The scheduler's own comment (~1420–1432) warns this leaves non-primary eligible chains "aging silently." A held non-primary expiration therefore has no service obligation tied to its own age.

5. **Why the forced update fixed it.** `POST /api/evidence/refresh?symbol=...` → `AcquisitionWorker.forceAcquireSymbols` re-observes the exact symbol regardless of freshness and bypassing both the due gate and the session gate, through the identical provider/persistence path. This re-stamps the held expiration's chain record, so `chainAcquiredAtMs` jumped to ~2 min and Delta corrected 0.83 → 0.37.

**Owner of the freshness responsibility:** the backend acquisition scheduler (`SqliteEvidenceStore.getPrioritizedWorkQueue` driven by `AcquisitionWorker`). The frontend only reports ages honestly; it does not create the staleness. Per Authority-Before-Consumers, the repair belongs at the scheduler/freshness authority, not in the Operator Console.

**Remaining unverified (requires live-DB / runtime inspection, not source):**
- Whether this IBIT buy-write's held expiration (2026-10-09) equaled the symbol's `primary_expiration` at defect time. If NOT primary → cause is the removed multi-DTE surface obligation (point 4) directly. If it WAS primary → cause is point 3 (the symbol was simply out-competed in the universe-wide breadth sweep / not "due" by `newestChainAge`), or a frontend durable-cache record stale relative to the quote-path read. Disambiguating requires inspecting `evidence` rows (per-expiration chain `retrieved_at` for IBIT) and the frontend durable-cache record.
- The configured values of `SchedulerConfig.monitoredFreshnessTargetMs()` / `chainFreshnessTargetMs()` (how often a monitored symbol *should* refresh) were not read.
- Whether this position's symbol was actually POSTed to `/api/evidence/observe` (registered "monitored") during the session.

## Scope / non-goals

- Covers: staleness of the Greek+quote bundle for **active/held positions** during an **open session**, and the acquisition-coverage/freshness authority responsible for refreshing it.
- Does not cover: Greek math/normalization correctness (demonstrated sound by the forced update), nor the zero-vs-absent Delta presentation ambiguity (BUG-011), nor general multi-source temporal composition (BUG-004) except as cross-linked context.
- **Filing does not authorize remediation.** Root-cause investigation and any fix require separate explicit Principal authorization.

## Acceptance criteria

(To be confirmed with the Principal; provisional, derived from the observed failure and code trace.)

- During an open session, the chain row carrying an active position's **held expiration** (not merely the symbol's `primary_expiration`) is refreshed within a defined freshness bound appropriate to active-position risk, rather than aging to ~1 day. The fix addresses per-held-expiration freshness, not just symbol-level or primary-expiration freshness.
- Displayed Greeks for an active position are co-temporal with the displayed spot such that Delta and Gamma are mutually consistent for the current moneyness.
- The fix lives at the acquisition/freshness authority (scheduler), not as consumer-side compensation in the Operator Console. The frontend's honest two-column (Greek Age vs Quote Freshness) reporting is correct and should be preserved.

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

- `evidence-service-java/.../db/SqliteEvidenceStore.java` — `getPrioritizedWorkQueue` (no held-expiration priority; removed multi-DTE surface obligation ~1483–1491) and `getQuoteObservations` (spot/`observedAt` from `primary_expiration` chain row ~1152–1197).
- `options-prototype/src/write-desk/contract-greek-lookup.ts` — `lookupContractGreeksWithAge` derives Greek Age from the held-expiration chain cache record's provenance (the divergent timestamp source).
- `options-prototype/src/components/OperatorConsole.tsx` — computes/renders Greek Age vs Quote Freshness from the two distinct sources (CSV header ~505; columns ~556–576).
- `evidence-service-java/.../provider/TradierAdapter.java` — Greeks (`chains?...&greeks=true`) and spot co-persisted on one chain row per expiration (`getOptionsChain` ~110–156).
- `evidence-service-java/.../AcquisitionWorker.java` — `forceAcquireSymbols` (forced refresh bypassing due + session gates) explains the forced-update correction.
