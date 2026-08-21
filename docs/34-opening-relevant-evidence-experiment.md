# Opening-Relevant Evidence Experiment

**Date:** August 2026
**Status:** Design — pending Principal authorization for implementation
**Mode:** Experiment (bounded, reversible, no new product concepts)
**Related:** `foundations/acquisition-scheduler-policy.md`, `20-session-aware-acquisition.md`, `foundations/state-oriented-console.md`, `foundations/backend-behavioral-invariants.md`

---

## 1. Hypothesis

If Wheelwright preferentially acquires evidence for a small, empirically high-value subset of its universe during the opening window, the operator's decision surface becomes materially useful earlier than under the current undifferentiated Class A refresh.

---

## 2. Background and Motivation

### Observed Problem

The operator does not have economically relevant evidence when it is needed most — immediately after opening-bell delayed data becomes usable (~09:45 ET).

### Root Causes (from exploration)

1. **Inadmissible pre-delay acquisition:** The Java SessionGate permits acquisition from 09:30 ET. Evidence acquired 09:30–09:45 reflects stale/pre-open market state. When the frontend admissibility filter correctly invalidates this evidence at ~09:45, the recommendation surface empties and must rebuild from zero.

2. **Undifferentiated Class A:** The scheduler treats all ~324 Class A symbols equally. The operator's recurrently useful ~40–60 symbols are diluted 6:1 into the general pool.

3. **Stale expirations at session open:** After overnight, all expirations exceed the 6-hour freshness threshold. This makes the first refresh cost 3 provider calls per symbol instead of 2.

### Why the Problem Is Not Universe Size

50 symbols × 2 calls = 100 requests. At 0.9 req/sec = ~1.9 minutes. Provider capacity is sufficient. The problem is sequencing and phase-awareness.

---

## 3. Design Constraints

| Constraint | Source | How Preserved |
|-----------|--------|---------------|
| A/B/C/D service classes unmodified | Scheduler Policy | Opening relevance is orthogonal; classes govern work validity, not ordering |
| Backend does not compute recommendations | ADR-001, INV-BOUND-01 | Opening set is operator-curated fixture, not computed |
| Session-gated acquisition | INV-SESS-01 | Experimental postures map onto existing session semantics |
| Failed refresh preserves prior evidence | INV-PERSIST-01 | Unchanged |
| Provider stewardship | INV-PROV-04 | Phase structure avoids redundant calls |
| Single acquisition authority | INV-ACQ-01 | Unchanged |
| Rate-limit compliance | INV-PROV-03 | Pacer unchanged (0.9 req/sec) |
| No new product concepts | Principal direction | Fixture is temporary; no watchlist, tier, or learning system |
| No inactive-symbol policy changes | Principal direction | Out of scope; avoid muddying causal test |
| No new canonical session states | Principal direction | Use experimental scheduler postures within existing model |

---

## 4. The Opening-Relevant Set (Experimental Fixture)

**Definition:** A static, operator-curated list of symbols the scheduler should preferentially acquire during the opening burst.

**Nature:** An experimental fixture. Not a product concept, not a learned model, not a permanent watchlist. Exists solely to test the scheduling hypothesis.

**Population:** ~40–60 symbols chosen by the operator from repeated observation of which symbols recurrently occupy the useful top of the recommendation surface.

**Persistence:** A simple seed file (e.g., `data/seeds/opening-set.txt`, one symbol per line) read at startup. No schema changes required.

**Relationship to A/B/C/D:** Orthogonal. Opening-relevant symbols may be Class A or Class B at any given moment. The designation governs scheduling *priority among otherwise-eligible work*, not what work is valid. A symbol does not lose opening priority merely because a stale chain caused it to drop from A to B. Its service class still determines what acquisition work applies; opening relevance determines when that work is dispatched relative to non-opening-relevant symbols.

**Rollback:** Delete or empty the seed file. System reverts to undifferentiated scheduling.

---

## 5. Three-Phase Opening Model

The existing session-state model is preserved. The experiment adds *scheduler postures* — acquisition-policy behavior that varies by phase — without introducing new canonical session states.

### Phase 1: Preparation (Premarket, before 09:30 ET)

**Existing session state:** Mapped to the pre-open portion of the trading day (currently blocked by SessionGate).

**Experimental posture:** Permit bounded reference-data refresh for the opening-relevant set only.

**Admissible work:**
- `getExpirations` for opening-relevant symbols whose expirations are stale (> 6 hours)

**Not admissible:**
- Chain or quote fetches (market data is pre-open)
- General-universe expiration refresh (unbounded; defer to Phase 2)
- Lifecycle/Class C work (does not shorten the critical path for the opening set)

**Trigger:** 09:00 ET on trading days. The work is bounded (~50 expiration calls ≈ 55 seconds at pacer rate) and completes well before market open.

**Exit:** 09:30 ET (market open).

### Phase 2: Delay Window (09:30–~09:45 ET)

**Existing session state:** The interval currently handled by SessionGate as `permitted("Regular session")`. The experiment changes the posture during this window to match the intent of doc-20's REGULAR_OPEN_DELAY.

**Experimental posture:** Expiration-only acquisition. No chain/quote fetches. Focus on work that directly shortens the post-09:45 critical path.

**Admissible work:**
- Expiration refresh for general Class A symbols (reduces their later per-symbol cost from 3→2)
- Expiration refresh for Class B symbols if Class A expirations are satisfied
- Expirations for opening-relevant symbols if any were missed in Phase 1

**Not admissible:**
- Chain/quote fetches for any symbol (the resulting data will not satisfy current-session admissibility and would be immediately invalidated at ~09:45)

**Ordering within Phase 2:**
1. Any remaining opening-relevant symbols needing expirations
2. General Class A symbols needing expirations (oldest first)
3. Class B symbols needing expirations (oldest first)

**Capacity:** 15 min × 54 req/min = 810 requests. At 1 call per symbol, could prepare expirations for the entire ~960 ready population.

**Exit:** 09:45 ET (market open + 15-minute provider delay).

### Phase 3: Opening Burst (~09:45 ET onward)

**Existing session state:** `REGULAR_OBSERVATION` (unchanged).

**Experimental posture:** Opening-relevant symbols are preferentially scheduled until the set is fully current. Then normal A/B/C/D scheduling resumes.

**Ordering:**

```
Priority 1: Opening-relevant symbols with eligible work (oldest chain first)
            — regardless of whether currently classified A or B
Priority 2: [Normal cascade]
  2a: Class A past 15-min freshness target (oldest first)
  2b: Class B past 120-min urgency threshold (oldest first)
  2c: Class A approaching target (oldest first)
  2d: Class B (anti-starvation floor when due)
  2e: Class C/D (anti-starvation floor when due)
```

**Anti-starvation:** Preserved. B and C/D floors continue to operate (1 per 10 dispatches, 1 per 20 dispatches). This costs approximately 5% of opening-burst capacity — accepted as a minor tax.

**Per-symbol cost during burst:** 2 calls (chain + quote) because expirations were pre-refreshed in Phases 1/2.

**Expected completion:** 50 symbols × 2 calls = 100 requests. At 54/min with floor overhead: ~2.0–2.1 minutes from 09:45 start. Expected completion: **~09:47 ET**.

**Transition to steady state:** Once all opening-relevant symbols have current-session chain evidence (`retrievedAt` > Phase 3 start time), Priority 1 is naturally exhausted. No manual transition — the queue simply contains no more opening-relevant work and the normal cascade takes over.

---

## 6. Instrumentation

### 6.1 Mechanism Evidence (Backend Telemetry)

Captured automatically by the scheduler. Exposed via `/api/status` extension or backend logs.

| Metric | Definition | Capture |
|--------|-----------|---------|
| `opening.setSize` | Number of symbols in the experimental fixture | Startup |
| `opening.expirationsPreparedPhase1` | Opening-set symbols with fresh expirations after Phase 1 | Phase 1→2 boundary |
| `opening.expirationsPreparedPhase2` | Total symbols with fresh expirations after Phase 2 | Phase 2→3 boundary |
| `opening.burstStartAt` | Timestamp when Phase 3 begins | Phase 3 entry |
| `opening.firstChainAt` | Timestamp of first opening-set chain acquisition in Phase 3 | During burst |
| `opening.hydration50pctAt` | Timestamp when 50% of opening set has current chain | During burst |
| `opening.hydration80pctAt` | Timestamp when 80% of opening set has current chain | During burst |
| `opening.hydration100pctAt` | Timestamp when 100% of opening set has current chain | During burst |
| `opening.completionDurationSec` | Seconds from burst start to 100% hydration | Computed |
| `opening.floorInterruptions` | Anti-starvation dispatches during opening burst | During burst |
| `opening.totalProviderCalls` | Provider calls for opening set across all phases | Accumulated |

### 6.2 Outcome Evidence (Frontend Observation)

| Metric | Definition | Capture |
|--------|-----------|---------|
| `surface.openingSetCurrentAt0946` | Fraction of opening-set symbols with current-session evidence at 09:46 ET checkpoint | Programmatic timestamp |
| `surface.firstAdmissibleRecommendationAt` | Timestamp when recommendation engine first produces an actionable candidate from current-session opening-set evidence | Lightweight frontend console.log |
| `surface.boardUsableAt` | Timestamp when operator judges the recommendation surface decision-useful | Manual operator journal entry |
| `surface.admissibleCountAt0946` | Count of opening-set symbols with admissible evidence at the 09:46 checkpoint | Programmatic |

**Frontend instrumentation:** A lightweight timestamp mechanism. When `buildCrossEntryRows()` produces results, check how many are derived from opening-set symbols with `retrievedAt` after Phase 3 start. Log the hydration fraction and timestamp. This is observation, not recommendation computation — it happens after the existing pipeline runs and does not feed back into evidence acquisition.

### 6.3 Baseline Comparison

For the experiment to produce useful evidence, we need the pre-experiment baseline. Before enabling the experimental postures, run 2–3 sessions recording:
- At 09:46: what fraction of the fixture's symbols have current-session chain evidence?
- When does the full fixture population achieve current evidence under today's undifferentiated scheduling?
- When does the operator judge the board decision-useful?

The journal already records one baseline data point: at 10:06 ET, only 311/960 ready symbols had post-09:45 admissible observations. More precise fixture-specific baselines should be captured.

---

## 7. Acceptance Criteria

### Success Indicators

The experiment produces positive evidence if:

1. **Mechanism:** The opening-relevant set achieves 100% current-session evidence measurably earlier than under the baseline (pre-experiment undifferentiated scheduling).

2. **Outcome:** The operator observes that the recommendation surface becomes decision-useful materially earlier than the baseline experience.

3. **Non-regression:** After the opening burst completes, general Class A symbols still achieve their 15-minute freshness target within normal steady-state. B/C/D anti-starvation guarantees are preserved. No degradation of mid-session evidence quality.

### Observation Checkpoint: 09:46 ET

09:46 ET is an observation checkpoint, not a pass/fail cutoff. Record:
- Fraction of opening set with current-session evidence at 09:46
- Actual 100% completion time
- Comparison to baseline same-set fraction at 09:46

The useful experimental output is a curve:
> "At 09:46 we had 82% of the opening set current; complete at 09:47:11. Baseline would have been 6% at 09:46 and first achievable at ~10:03."

### Failure / Inconclusive Indicators

- Opening-set completion time is not meaningfully better than undifferentiated Class A scheduling for the same symbols
- Recommendation surface is not decision-useful despite evidence freshness (indicates wrong fixture population or other dominating factors)
- Provider errors or rate-limiting interfere with the burst pattern
- Phase 2 expiration pre-refresh creates unexpected state or side effects
- Opening-burst priority causes pathological starvation of other work (beyond the expected ~5% floor tax)

---

## 8. Rollback Boundary

The experiment is fully reversible:

| To Roll Back | Action |
|-------------|--------|
| Opening-relevant fixture | Delete or empty `data/seeds/opening-set.txt` |
| Phase 1/2 postures | Revert SessionGate to current binary permitted/blocked |
| Priority 1 ordering | Remove opening-set check in work-queue sort |
| Instrumentation | Remove telemetry capture (or leave as dead code) |

No schema changes. No publication contract changes. No snapshot format changes. No A/B/C/D semantics modified. No frontend contract changes.

---

## 9. Scope Exclusions

| Excluded | Reason |
|----------|--------|
| Automatic learning of the opening set | Requires PL-DEPLOY-02 observation infrastructure; out of scope |
| Inactive/non-optionable decay policy | Valid efficiency improvement but muddies causal test |
| UI readiness indicator (product) | Experiment needs only lightweight observation timestamps |
| Multi-expiration acquisition (PL-EVID-07) | Orthogonal and capacity-expensive |
| New canonical session states | Experiment uses postures within existing model |
| Permanent "Opening Tier" or watchlist concept | Fixture is temporary; no product semantics |
| Changes to admissibility enforcement | Problem addressed by not producing inadmissible chains |

---

## 10. Experiment Duration and Protocol

**Baseline capture:** 2–3 trading sessions with the fixture defined but NOT active in scheduling. Record the fixture's hydration timeline under current behavior.

**Experiment active:** 5+ trading sessions with the experimental postures enabled. Record all mechanism and outcome metrics.

**Observation protocol per session:**
1. Note Phase 1 completion (backend log or telemetry)
2. Note Phase 2 capacity utilization
3. At 09:46 ET: record opening-set hydration fraction (programmatic)
4. Note opening-set 100% completion time
5. Note when operator judges board decision-useful (manual)
6. Note any anomalies, provider errors, or unexpected behavior
7. Verify steady-state Class A freshness achieved normally after burst

---

## 11. Implementation Seams

When implementation is authorized, the natural seams are:

1. **SessionGate enhancement:** Add phase-awareness to `isPermitted()` — return a richer result that distinguishes "full acquisition permitted" from "expirations-only permitted" from "blocked." The existing `SessionDecision(permitted, reason)` record can carry a posture field without changing the binary API for callers that don't need it.

2. **Opening set loader:** Read `data/seeds/opening-set.txt` at startup. Expose `Set<String> openingSet` to the scheduler.

3. **Work-queue ordering:** In `getPrioritizedWorkQueue`, opening-relevant symbols with eligible work sort before non-opening-relevant symbols of equal or lower class, but only until their chain evidence is current-session.

4. **Phase 2 work filter:** During REGULAR_OPEN_DELAY posture, `acquireSymbolTiered` skips chain/quote acquisition and only performs expiration calls.

5. **Telemetry extension:** Track opening-set hydration within `AcquisitionWorker` and expose via `/api/status`.

6. **Frontend timestamp:** In the recommendation computation path, log hydration fraction of opening-set symbols after `buildCrossEntryRows` completes.

These are noted as guidance for the implementation conversation, not as specification.

---

## 12. Architectural Guardrail

> The experiment adds no new product concept except the temporary fixture itself.

No "Opening Tier." No permanent watchlist. No learned model. No new session taxonomy. No inactive policy.

The only thing under test is whether ordering scarce acquisition capacity by known opening relevance materially advances decision readiness.

If the experiment succeeds, the *findings* inform future architectural decisions (possibly a new parking-lot item, possibly an extension to the scheduler policy, possibly motivation for PL-DEPLOY-02). Those decisions remain separate from and subsequent to the experiment itself.

---

## Cross-References

| Document | Relationship |
|----------|-------------|
| `foundations/acquisition-scheduler-policy.md` | Governs A/B/C/D; experiment adds orthogonal ordering dimension |
| `20-session-aware-acquisition.md` | Specifies session states and postures; experiment aligns implementation with documented intent |
| `foundations/state-oriented-console.md` | Outcome evidence follows state-oriented principle |
| `foundations/backend-behavioral-invariants.md` | All ratified invariants preserved |
| `07c-adrs.md` ADR-001 | Evidence/recommendation separation preserved |
| `parking-lot.md` PL-DEPLOY-02 | Observation infrastructure; related but out of scope |
| `journal/project-journal.md` 2026-08-11, 2026-08-12 | Empirical evidence of current morning behavior |
