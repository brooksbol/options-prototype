# Console Moneyness Sparklines: A Temporal-Evidence Candidate Finding

**Date:** August 27, 2026
**Status:** Candidate architectural finding — recorded under PL-COHERE-01 as a **separate** candidate from Finding #1. Related by pattern, not assumed to share immediate cause. Not ratified direction. No implementation authorized.
**Classification:** Temporal / historical evidence-reconstruction gap (candidate). Current-state evidence is healthy; historical-state evidence is not.
**Triggered by:** Console screenshot — positions, current spot, moneyness, and DTE grouping all render, but the moneyness-cell sparklines are conspicuously empty.

---

## 1. Summary

The Console's current-state evidence is healthy: positions render, current spot/moneyness values exist, DTE grouping works, consequence columns compute. What is missing is the **historical trace** inside the moneyness cells — the sparkline. A sparkline is not a function of "do I have a current quote?" It requires a **time series**. Its absence is therefore a temporal-evidence symptom, not a current-evidence symptom.

End-to-end tracing of one position (SLV) against the live system established that the sparklines are empty for two distinct, compounding reasons — **neither of which is "no data":**

1. **Multi-expiration amplification collapses to a single observation moment.** `spot_history` receives one INSERT per `setChain` / `setChainForExpiration` call. A weekly-capable symbol acquired via `acquireAllEligibleChains` writes 6–11 rows per cycle — one per eligible expiration — **all with the same underlying price, within one <15-second burst.** The Console passes these raw rows straight into `deriveMoneynessHistory` with no deduplication. The raw count clears the `>= 3` render gate, but every point shares one price and one timestamp cluster, so the rendered trace is a **flat, degenerate, effectively-invisible line** — not an intraday trajectory.

2. **Weekly-capable symbols have not been re-acquired since the opening burst.** The same population implicated in Finding #1. Their latest `spot_history` observation is ~90–110 minutes old; the scheduler has not returned to refresh their full surface. So even the amplified rows all come from a single early-session moment.

The result matches Finding #1's pattern exactly:

> Locally-healthy current evidence ≠ complete decision/temporal evidence surface.

But the immediate mechanisms differ. Finding #1 is a **validity-gate mismatch** (fresh chains dropped by a 30-min TTL). This finding is a **temporal-density gap** (amplified writes collapsing to one moment) compounded by the **same acquisition-cadence gap** (weekly symbols not revisited). They are cousins, not the same bug.

---

## 2. Verified Trace (SLV, Live, August 27, 2026)

### 2.1 SQLite `spot_history` (durable) — data exists

```
SLV total rows: 574
Most recent 8 rows: all 2026-08-27T13:46:24–13:46:36Z, all price 61.645
Prior row: 2026-08-26T19:19 (yesterday)
```

The 8 recent rows are one acquisition burst (12 seconds), one price. Table-wide: 50,427 rows across 961 symbols, earliest 2026-08-20, latest ~now. So `spot_history` persists correctly and survives across sessions (SLV has a week of history).

### 2.2 History API (`GET /api/evidence/history?symbol=SLV`, default `since` = now − 12h)

```
SLV obs count: 8
first: {price: 61.645, observedAt: 13:46:24Z}
last:  {price: 61.645, observedAt: 13:46:36Z}
```

The API faithfully returns what the store holds within the 12h window: 8 rows, all from the single 13:46 burst.

### 2.3 Frontend hook (`useSpotHistory`)

`OperatorConsole.tsx`: `useSpotHistory(underlyings, !isDemoSource, observations.generation)`. Fetches `/api/evidence/history?symbol=...`, sets `Map<symbol, SpotObservation[]>`. For SLV: 8 observations. Correct pass-through.

### 2.4 Console derivation + render gate (`OperatorConsole.tsx` ~713–726)

```
const realSpotSeries = spotHistory.get(position.underlying);
if (realSpotSeries && realSpotSeries.length >= 3) {
  moneynessPoints = deriveMoneynessHistory(
    realSpotSeries.map(obs => obs.price),      // 8 identical prices
    position.strike,
    position.type,
    realSpotSeries.map(obs => obs.observedAt), // 8 timestamps within 12s
  );
}
```

SLV passes the `>= 3` gate (8 ≥ 3). But `deriveMoneynessHistory` receives 8 identical prices at 8 near-identical timestamps → 8 `MoneynessPoint`s at essentially the same `t` and same moneyness → a flat, zero-width trace. **The sparkline renders, but there is nothing to see.**

Note the Console does **not** apply Kreature's `deduplicateObservations` (30s clustering). Kreature's `observation-derivation.ts` would collapse these 8 rows to **1 moment** — which is the honest count. The Console instead treats the amplified rows as 8 real observations, which is why it silently passes the gate while producing no perceptible trace.

### 2.5 Population-level confirmation (last 12h, moments ≈ distinct 15-char timestamp prefixes)

| Symbol | raw rows (12h) | distinct moments | latest observation | class |
|---|---|---|---|---|
| DBO | 7 | 7 | 15:25 UTC | monthly-only (single chain) |
| REMX | 7 | 7 | 15:31 UTC | monthly-only |
| WEAT | 7 | 7 | 15:26 UTC | monthly-only |
| SLV | 8 | **1** | 13:46 UTC | weekly (multi-exp) |
| XLE | 8 | **1** | 13:49 UTC | weekly |
| GLD | 11 | **1** | 13:47 UTC | weekly |
| QQQ | 11 | **1** | 13:47 UTC | weekly |
| SPY | 11 | **1** | 13:48 UTC | weekly |
| EWY, GDX, GDXJ, BNO, COPX, URA | 6 | **1** | 13:46–14:07 UTC | weekly |

The pattern is unambiguous:
- **Monthly-only symbols** (one `setChain` per cycle) accumulate genuine intraday moments and keep updating → their sparklines would work.
- **Weekly-capable symbols** (multi-expiration) show `raw ≫ moments` (all raw rows collapse to 1 moment) AND are stale since the opening burst → their sparklines are flat/empty.

---

## 3. Two Distinct Root Causes

### Cause A — Observation identity is not resolved at persistence (multi-expiration amplification)

`spot_history` records "a price was encountered during chain acquisition," one row per `setChain`/`setChainForExpiration`. It does not model "a distinct observation moment." Multi-expiration acquisition therefore writes N identical rows per cycle. Consumers must dedup to recover observation moments. Kreature does; the Console does not. This is precisely the risk flagged in `observation-derivation.ts`:

> "If the heuristic ever produces incorrect groupings, that is evidence that PL-EVID-01 should resolve observation identity at the persistence layer."

The Console's empty sparklines are the first operator-visible consequence of observation identity being unresolved at the persistence layer.

### Cause B — Weekly-capable symbols not revisited since opening burst (acquisition cadence)

The same population and the same cadence gap as Finding #1. Weekly symbols were acquired in the opening burst (~13:46–14:07) and have not been refreshed since (~90–110 min at observation time). Even with perfect dedup, a symbol observed once has one point — below the `>= 3` threshold for a meaningful trace. Temporal density depends on revisit frequency, which for the multi-expiration population is not maintained tightly enough to build an intraday series.

**A and B compound:** A means each visit contributes only 1 usable moment (not N); B means visits are infrequent for exactly the symbols that most need multi-DTE reasoning. Together they starve the sparkline of temporal points.

---

## 4. Relationship to Finding #1 (Pattern Yes, Cause No)

| Dimension | Finding #1 (doc 35) | This finding (doc 37) |
|---|---|---|
| Symptom | Deployment board collapses to DTE 22 | Console sparklines empty |
| Evidence present in backend? | Yes (full 7–45 surface) | Yes (`spot_history` populated) |
| Immediate mechanism | Decision 30-min TTL drops fresh chains | Amplified writes collapse to 1 moment + stale weekly revisit |
| Shared pattern | Locally-healthy current ≠ complete surface | Same |
| Shared population | 64 weekly-capable symbols | Same 64 weekly-capable symbols |
| Shared cadence factor | Weekly full-surface revisit lag | Weekly full-surface revisit lag (Cause B) |
| Distinct factor | Browser TTL vs backend cadence | Observation identity unresolved at persistence (Cause A) |

They are **architecturally connected without being the same bug.** Both are instances of Wheelwright lacking a coherent, subsystem-owned notion of what evidence is "complete enough" for a given consumer — one for Decision's option surface, one for the Console's temporal trace.

---

## 5. The Larger Suspicion: No System-Level Definition of Evidence Readiness

The Console currently shows a header indicator such as "EVIDENCE 60/60 fresh" while, simultaneously:

- Current spot: present.
- Current portfolio state: present.
- Historical sparkline: absent (this finding).
- Deployment multi-DTE surface: degraded to 22 (Finding #1).

The "60/60 fresh" indicator is **not necessarily incorrect by its own definition** — it likely means "the current portfolio underlyings have acceptable *current* observations." But that is far narrower than what an operator naturally reads "EVIDENCE 60/60 fresh" to mean. If it means "current portfolio underlyings have current quotes," while Deployment lacks its required temporal option surface and the Console lacks historical observations, then:

> Wheelwright currently has no coherent **system-level** definition of evidence readiness. Each surface has its own implicit, narrow notion, and the global indicator reflects only one of them.

This is a candidate meta-finding. It connects Finding #1 and this finding architecturally without claiming a shared bug: the common thread is the **absence of a shared readiness contract** across current-quote, temporal-history, and decision-surface evidence. This is the same class of defect PL-COHERE-01 exists to surface (two or more locally-reasonable components + an unstated cross-boundary contract), now appearing in the readiness/coverage dimension rather than the validity dimension.

**Not yet ratified.** Recorded as a suspicion to test in the next reconciliation pass, alongside doc 35 and doc 36.

---

## 6. What This Finding Does NOT Do

- Does not fix the sparkline (no code).
- Does not add dedup to the Console path.
- Does not change the `>= 3` gate, `spot_history` schema, or the history API window.
- Does not change acquisition cadence.
- Does not redefine the "60/60 fresh" indicator.
- Does not assert that Finding #1 and this finding share a cause — only a pattern and a population.
- Does not ratify the "no system-level evidence readiness" meta-finding.

---

## 7. Open Questions for the Next Reconciliation Pass

1. **Observation identity ownership.** Should `spot_history` resolve observation identity at the persistence layer (one row per observation moment, not per `setChain`), or should every consumer dedup? Kreature deduplicates; the Console does not; the divergence is itself a coherence defect. (PL-EVID-01.)
2. **Cold-start / reconstruction semantics for `spot_history`.** The table persists across sessions (SLV has a week of rows), so this is not a persistence-loss issue. But the intraday *density* depends on scheduler revisit cadence — is temporal density a first-class acquisition obligation, or an incidental byproduct? (Couples to Finding #1's cadence question.)
3. **System-level evidence readiness.** Is there one readiness concept, or a matrix (current-quote readiness × temporal-history readiness × decision-surface readiness)? What should the operator-facing indicator actually claim? (Meta-finding — for 3AM, not for patching.)
4. **The `>= 3` gate semantics.** Should the render gate count raw rows or distinct observation moments? Counting raw rows is why SLV silently passes while showing nothing.

---

## 8. Cross-References

- `docs/35-evidence-decision-temporal-coherence.md` — Finding #1 (validity-gate mismatch; same pattern, same population)
- `docs/36-temporal-contract-design-brief.md` — 3AM brief on the temporal contract (Finding #1)
- `docs/21-primary-expiration-investigation.md` — PL-EVID-07: multi-expiration acquisition (the source of the amplification)
- `docs/15-evidence-state-semantics.md` — freshness/trust vocabulary; relevant to the readiness meta-question
- `docs/parking-lot.md` — PL-COHERE-01 (owner), PL-EVID-01 (observation architecture — observation-identity ownership), PL-EVID-07
- Code: `evidence-service-java/.../SqliteEvidenceStore.java` (`setChain`/`setChainForExpiration` both INSERT spot_history), `AcquisitionWorker.acquireAllEligibleChains`, `HistoryController` (12h default window); `options-prototype/src/evidence/use-spot-history.ts`, `src/operator-console/moneyness-history.ts`, `src/kreature/observation-derivation.ts` (has dedup the Console lacks), `src/components/OperatorConsole.tsx` (~713–726, the `>= 3` gate)
