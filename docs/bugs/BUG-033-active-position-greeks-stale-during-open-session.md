# BUG-033 — Active-position Greeks go stale (≈1 day old) during an open session

- **Status:** Open
- **Severity:** Not established
- **Area:** Backend / evidence acquisition coverage + freshness for held (active) positions ↔ Operator Console Greeks presentation
- **Provenance:** Operator observation 2026-10-07 (IBIT buy-write), two Principal-provided position exports (normal vs. forced update)

> **Epistemic structure of this record.** This record deliberately separates: (1) **established observations** (what the exports showed), (2) **established code/architecture findings** (what source inspection proves), (3) an **unresolved incident-causality** question, (4) **future-investigation guidance**, and (5) the **Principal stopping decision**. Earlier drafts conflated these — successively overclaiming the scheduler-admission gap as the complete incident cause and adding unsupported temporal and economic interpretations. This version supersedes those claims; where older wording contradicts the boundaries below, the boundaries below govern.

## Observed failure (established observations)

On 2026-10-07, during an open session, an active position (IBIT buy-write, short the 2026-10-09 47.5 call) was displayed with a **Greek Age of ≈1 day** while co-displayed underlying/current-position fields (spot, Today's G/L) were current.

Normal (stale) export — IBIT, approximately:

| Field | Value |
|-------|-------|
| Spot | 47.13 |
| Moneyness | −0.8% (strike 47.5 > spot) |
| Delta | 0.83 |
| Gamma | 0.1583 |
| Theta | −0.0640 |
| Bid/Ask | 1.39 / 1.42 |
| Greek Age | ≈1d |
| Quote Freshness | 9m |

A forced refresh shortly afterward, with the underlying spot essentially unchanged (≈47.18), produced approximately:

| Field | Value |
|-------|-------|
| Spot | 47.18 |
| Delta | 0.37 |
| Gamma | 0.3101 |
| Theta | −0.1162 |
| Bid/Ask | 0.36 / 0.37 |
| Greek Age | ≈2m |

**What this establishes, and only this:** stale option-chain evidence (the held expiration's chain, carrying its Greeks and option bid/ask) was displayed alongside fresher current-position/underlying information; a forced refresh replaced that stale chain evidence with materially different current evidence, at an essentially unchanged underlying spot. No further mathematical or temporal meaning is inferred from these numbers than the evidence supports. In particular:

- The individual Greeks are **not** asserted to have been captured at different instants from one another; the established mismatch is between the day-old held-expiration chain and the fresher displayed underlying/current-position fields.
- The gamma difference (0.1583 stale → 0.3101 refreshed) is **qualitatively compatible** with the stale call having previously been farther in-the-money; it is **not** evidence of internal Greek incoherence and is **not** used to prove anything beyond "the chain evidence was older."
- A successful forced refresh establishes **changed** evidence. It does **not** by itself validate the Greek mathematics/normalization, nor prove synchronized observation with every co-displayed field.

## Intended semantics violated

- **Session awareness is correctness** (`foundations/evidence-appliance.md`): during an open session, evidence for active positions can and does change. Displaying day-old held-chain evidence alongside fresher underlying fields contradicts the appliance's obligation to maintain a current authoritative model of the position environment.
- **Persist facts; derive trust** (project identity principle 3): freshness/staleness is derived at query time. The system did derive and display `Greek Age ≈1d` honestly; the failure is that an active position's held-expiration chain was allowed to reach ≈1 day old during a live session.
- **Active-position freshness commensurate with risk** (`foundations/acquisition-scheduler-policy.md`): an active held position carrying ≈1-day-old chain evidence during an open session indicates held-position evidence was not refreshed commensurately with its risk significance.

## Consequence

The operator's live risk picture was wrong for this position: the stale export showed a short-call Delta of ≈0.83 versus the refreshed ≈0.37. For a decision-support appliance, stale-but-confidently-displayed Greeks on an open position are a correctness failure in the primary risk signal. Severity remains **Not established** (no Principal classification); the Principal has characterized a ≈1-day Greek age on an active position during an open session as unacceptable.

Why this matters at the **complete buy-write position** level (long shares + short call), not as an isolated call-leg number:

- An **inflated** short-call delta makes the long-stock/short-call position appear **less net bullish**, because a larger short-call delta implies a larger offset against the long shares.
- *Illustration only (not incident evidence unless the exact position quantity warrants it):* for one standard covered call against 100 shares, a displayed call delta of ≈0.83 implies a net position delta of ≈+17, whereas ≈0.37 implies ≈+63. This is explanatory arithmetic to show the direction and size of the distortion, not a measurement of this specific position.
- Bounds on interpretation: Delta does **not** by itself establish how much upside is already capped (the option contract's strike defines the cap), and Delta does **not** by itself establish assignment proximity.
- Broader domain finding (preserved): stale Greeks can materially distort the operator's understanding of the governed economic position near expiration, consistent with the Options Domain Competence contract (reason from the complete position, not an isolated metric).

## Diagnosis — established architecture findings vs. unresolved causality

### Established code/architecture findings (by source inspection)

1. **A held-expiration acquisition mechanism exists.** The frontend extracts the exact held `(symbol, expiration)` pairs and POSTs them to `/api/evidence/observe` (`use-observations.ts` `extractHeldExpirations` / `ensureObservable`), so the backend can keep held chains refreshed even below the 7–45 DTE eligibility window. The backend persists them (`held_expiration` table, migration 007; `SqliteEvidenceStore.setHeldExpirations`).

2. **Held expirations can be added to the acquisition set after a symbol is admitted for servicing.** Once a symbol is being serviced, `AcquisitionWorker.acquireAllEligibleChains` unions the held expirations into the fetched set (`store.getHeldExpirations(symbol)` ~1676). `HeldExpirationAcquisitionTest` demonstrates the worker fetching a held sub-7-DTE chain that ordinary eligibility would exclude, and excluding an unheld sub-window expiration.

3. **Held-chain acquisition is conditional on provider listing.** The overlay only fetches an expiration the provider actually lists (`if (known.contains(h))` ~1680); a held expiration the provider omits is silently not fetched.

4. **Non-primary acquisition/commit failures can be non-fatal.** Failures on individual non-primary expirations are logged and skipped while other acquisition for the symbol succeeds. So "once a symbol is dispatched, its held chain is necessarily fetched and committed" is **not** an unconditional guarantee.

5. **Scheduler admission ignores held-expiration age.** `getPrioritizedWorkQueue` decides whether a symbol needs service using symbol-level `newestChainAge` via the normal and monitored freshness tests (`primaryDue = newestChainAge >= config.chainFreshnessTargetMs()`; `monitoredDue = isMonitored && newestChainAge >= config.monitoredFreshnessTargetMs()`, ~1489–1497). The `held_expiration` table is **not** independently consulted in this admission decision, and the monitored overlay does not change recommendation class (~1502–1505).

6. **Therefore there is a real architectural gap:** a stale held expiration is not itself an independent scheduler-admission freshness obligation. **This gap is established independently of whether it caused the observed ≈1-day incident.**

7. **The gap alone cannot explain ≈1 day of staleness.** A fresh primary or unrelated chain keeps `newestChainAge` small and can suppress admission **only until the relevant symbol-level freshness threshold expires**. After that, ordinary admission should fire. A single suppression window does not account for ≈1 day.

8. **Forced refresh does not identify the cause.** `POST /api/evidence/refresh?symbol=...` → `AcquisitionWorker.forceAcquireSymbols` re-observes the exact symbol regardless of freshness, bypassing ordinary admission (and the session gate), through the same provider/persistence path. Its success re-stamped the held chain, but is **consistent with multiple causal explanations** and does not establish which one occurred.

9. **Removed multi-DTE surface obligation is context, not a confirmed remedy.** The blanket "refresh every eligible 7–45 DTE expiration on a ~25-min target" obligation was removed (`SqliteEvidenceStore.java` ~1483–1491). Its removal may be relevant context, but **restoring blanket multi-DTE refresh is not established as the correct remedy** (it would refresh many chains the operator does not hold).

Also noted from the trace (not causal claims): displayed spot/Quote-Freshness is sourced from the chain row for the symbol's `primary_expiration` (`getQuoteObservations`), while Greek Age is derived from the held-expiration chain cache record's provenance (`contract-greek-lookup.ts`); the frontend reports the two ages honestly from these distinct sources. Chain and quote are obtained via separate provider requests/caches — co-persistence of spot onto a chain row is **not** promoted to co-temporality of every co-displayed field.

### Independently valid architectural invariant (distinct from incident causality)

> A held `(symbol, expiration)`'s own chain age should be able to make a symbol due for service during an open session, rather than relying solely on symbol-level `newestChainAge`.

This is retained as a valid architectural observation about gap (6). It is **not** asserted as the incident root cause, and it does **not** by itself define remediation scope. No fix is designed here.

### Unresolved incident causality (NOT established)

**The actual mechanism that allowed the IBIT held expiration to remain ≈1 day stale is not established.** Known possibilities, none promoted to fact:

- repeated failure of the held secondary-chain acquisition while other IBIT acquisition succeeded;
- held demand not present/persisted at the relevant time;
- the held expiration not appearing in the provider-listed expiration set;
- some other scheduler/session/runtime condition;
- a combination of mechanisms.

These are not investigated in this traversal (Principal stopping decision below).

## Future investigation guidance (not performed today)

- A fresh primary row beside a stale held row, **by itself**, would not distinguish admission suppression from successful primary acquisition followed by failed held acquisition.
- Decisive future investigation would require **chronology** plus **held-demand / provider-listing / runtime** evidence (not a single snapshot).
- Today's post-forced-refresh DB state may be **insufficient** to reconstruct the historical incident, since the forced refresh already overwrote the stale held chain.
- Supporting unknowns to resolve if/when investigation is authorized: configured `monitoredFreshnessTargetMs()` / `chainFreshnessTargetMs()` values; whether this symbol's held demand was POSTed and persisted during the session; whether 2026-10-09 appeared in the provider-listed expirations; whether `acquireAllEligibleChains` logged any non-primary (held) commit failures for IBIT.

## Scope / non-goals

- Covers: staleness of held-position option-chain evidence (and its Greeks) during an open session, and the acquisition/freshness authority responsible for refreshing it.
- Does **not** cover: Greek math/normalization correctness (**not** established sound by this incident — not in scope either way); the zero-vs-absent Delta presentation ambiguity (BUG-011); general multi-source temporal composition (BUG-004) except as cross-linked context.
- **Filing does not authorize remediation.** Any root-cause investigation or fix requires separate explicit Principal authorization.

## Acceptance criteria

(Provisional; to be confirmed with the Principal. **Remediation scope cannot be finalized until the incident causality is established.**)

- **Precondition:** the incident mechanism is demonstrated (admission suppression vs. held-chain acquisition/listing failure vs. missing held demand vs. another condition vs. a combination). The eventual fix is scoped to the demonstrated cause, not assumed to be the admission gap.
- During an open session, no currently-held `(symbol, expiration)` carries option-chain evidence older than a defined active-position freshness target. Whatever the mechanism, the end state is a held expiration whose chain is refreshed within that bound.
- The fix lives at the backend evidence/acquisition authority, not as consumer-side compensation in the Operator Console. The frontend's honest two-column (Greek Age vs Quote Freshness) reporting is correct and must be preserved.

> Deliberately **not** acceptance conditions: "Greek math/normalization validated"; "Delta and Gamma mutually consistent for current moneyness" (that framing was an unsupported interpretation and is retracted); any generic co-temporality requirement across all co-displayed fields unless and until the system's authoritative temporal contract actually establishes one.

## Remediation history

Empty while Open.

## Verification

Empty while Open.

## Lifecycle / Log

- **2026-10-07 — Investigation findings captured; Principal stopping decision.** The Principal directed the team to (1) preserve the accumulated investigation findings with correct epistemic status, (2) leave **BUG-033 Open**, and (3) perform **no further investigation or remediation today**. This record was reconciled accordingly: the established observations and architecture findings are retained; the scheduler-admission gap is kept as an independently valid architectural finding but is **not** asserted as the incident root cause; incident causality is marked unresolved; and the earlier unsupported claims (internal Delta/Gamma incoherence; forced refresh validating Greek normalization; generic co-temporality; delta establishing upside-cap or assignment proximity) were corrected/retracted. **This is a stopping-point / sequencing decision only** — not a resolution, not a deferral of the defect, not a severity decision, not acceptance of any proposed fix, and not authorization to remediate.

## Related

- **BUG-004** — Console composes temporally incompatible evidence into an apparently-coherent view (conceptual cousin: temporal coherence of composed evidence; here day-old held-chain evidence is co-displayed with fresher underlying fields).
- **BUG-011** — Provider-reported exact-zero Delta rendered indistinguishably from absent Delta (adjacent Greeks-presentation defect, distinct cause).
- `foundations/evidence-appliance.md` — session awareness as correctness; sealed vs. live evidence.
- `foundations/acquisition-scheduler-policy.md` — tiered A/B/C/D freshness targets; the multi-DTE surface obligation whose removal is context here.
- Authority-Before-Consumers rule (`.kiro/steering/development-workflow.md`) — repair stale authoritative facts upstream, not in consumers.

### Key code locations (from 2026-10-07 trace; descriptive, not causal attributions)

- `evidence-service-java/.../db/SqliteEvidenceStore.java` — `getPrioritizedWorkQueue` admission gate uses symbol-level `newestChainAge` for `primaryDue`/`monitoredDue` (~1489–1497) and does not independently consult `held_expiration`; removed multi-DTE surface obligation (~1483–1491); `getQuoteObservations` (spot/`observedAt` from `primary_expiration` chain row ~1152–1197); `setHeldExpirations`/`getHeldExpirations` (~423–462). (Site of the established architectural gap; **not** asserted as the established incident owner.)
- `evidence-service-java/.../AcquisitionWorker.java` — `acquireAllEligibleChains` unions held expirations into the fetched set after admission (`store.getHeldExpirations(symbol)` ~1676; provider-listed guard ~1680; non-primary failures non-fatal); `forceAcquireSymbols` bypasses ordinary admission.
- `evidence-service-java/.../ObserveController.java` — `/api/evidence/observe` accepts and persists the `heldExpirations` overlay (present-vs-omitted lifecycle contract ~60–142).
- `options-prototype/src/evidence/use-observations.ts` — `extractHeldExpirations` / `ensureObservable` POST the exact held `(symbol, expiration)` pairs.
- `evidence-service-java/.../HeldExpirationAcquisitionTest.java` — demonstrates held sub-window fetch and unheld exclusion.
- `options-prototype/src/write-desk/contract-greek-lookup.ts` — derives Greek Age from the held-expiration chain cache record's provenance.
- `options-prototype/src/components/OperatorConsole.tsx` — computes/renders Greek Age vs Quote Freshness from the two distinct sources (CSV header ~505; columns ~556–576).
- `evidence-service-java/.../provider/TradierAdapter.java` — chain-with-greeks request and underlying spot stamped onto the chain row per expiration (`getOptionsChain` ~110–156); chain and quote use separate requests/caches.
