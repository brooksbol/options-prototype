# Evidence–Decision Temporal Coherence: A Cross-Subsystem Finding

**Date:** August 27, 2026
**Status:** Architectural finding — recorded under PL-COHERE-01. Not ratified direction. No implementation authorized.
**Classification:** Temporal-consistency contract mismatch between the Evidence Appliance and Decision.
**Triggered by:** Cold-start observation that the Deployment (Write Desk) board collapsed toward a single expiration (DTE 22) while the backend held the full 7–45 DTE surface.

---

## 1. Summary

Wheelwright can acquire the full 7–45 DTE surface correctly, publish it correctly, hydrate it correctly, and still silently collapse the Deployment board back toward the primary expiration — because Decision refuses to use chain evidence older than 30 minutes while the Evidence Appliance may take hours to revisit any given symbol.

This is **not** a DTE-selection bug, a missing frontend feature, or a code regression in hydration. It is a **temporal-consistency bug between two subsystems** that have each independently defined what "usable evidence" means:

- **Evidence Appliance:** "This is the evidence I currently have, acquired according to scheduler priority and cadence." Full multi-expiration surface, refreshed on a multi-hour cycle (Class B `oldestAge` observed at ~20.8h during the incident).
- **Browser Decision (`recommend.ts` `isEligible`):** "Chain evidence older than 30 minutes is unusable." `chainStaleMs = 30 min` (`durable-cache.ts` `DEFAULT_CACHE_TTL`).

Neither rule is absurd in isolation. Together they make the intended 7–45 DTE capability **transient**: a weekly-capable symbol contributes multi-DTE candidates only during the ~30-minute window after its `acquireAllEligibleChains` batch runs. On a cold start, the entire universe is acquired in an early burst, then everything ages past the freshness gate before the scheduler cycles back.

The most dangerous property is that the failure is **quiet**. Wheelwright does not report "54 of 64 weekly surfaces are currently unavailable because evidence aged beyond Decision validity." It presents a healthy-looking DTE-22 board. Since the multi-expiration investigation (`docs/21-primary-expiration-investigation.md`, PL-EVID-07) established that hiding non-primary expirations can materially alter the production frontier, silently collapsing to a single expiration is now a **correctness problem**, not a cosmetic one.

---

## 2. Verified Behavior (Code + Live Evidence, August 27, 2026)

The finding was established by tracing one symbol (SPY) end-to-end and corroborating against the live SQLite store and the live snapshot. Every layer except the last was confirmed correct.

### 2.1 Backend acquires the full surface (correct)

`AcquisitionWorker.acquireAllEligibleChains()` fetches a chain for every eligible expiration returned by `SqliteEvidenceStore.getEligibleExpirations()`, not just the primary. Confirmed in SQLite: liquid ETFs hold many chains.

```
GLD 18, IWM 18, QQQ 18, SPY 18, XLF 18, SMH 17, XLE 14, EEM 13 ...
```

### 2.2 Backend publishes the full surface (correct)

`SqliteEvidenceStore.getEvidence()` returns a `chains` array via `getAllChains(symbol)`. The live snapshot (`GET /api/evidence/snapshot`, 19.7 MB) contained, for every one of the 64 weekly-capable symbols, a chain for **every** eligible expiration (DTE 7 through 43), each with real puts/calls data (~161 contracts per side). Zero partial. 891 monthly-only symbols correctly carried a single eligible chain (the market offers only one expiration in range).

Snapshot population at time of observation:

- 955 ready symbols
- 64 weekly-capable (>1 eligible expiration) — **all fully hydrated**
- 891 monthly-only — correctly single-DTE

### 2.3 Frontend hydration consumes the full surface (correct)

`WriteDesk.tsx` `handleNewEvidence` (the live snapshot consumer; note `useEvidenceSnapshot.ts` is unused dead code) contains the multi-expiration hydration loop:

```
const chains = sym.chains ?? [{ expiration: sym.chain.expiration, data: sym.chain, retrievedAt: sym.retrievedAt }];
for (const chainEntry of chains) { ... cache.put(...) }
```

It iterates every expiration, caches each keyed by `(provider, environment, "chain", symbol, expiration)`, stamps each record with the **backend's** `retrievedAt` (preserving true provider-acquisition age), and prunes stale expirations. This code is correct and present at HEAD.

### 2.4 The boundary: Decision eligibility (`recommend.ts` `isEligible`, lines ~260–273)

During an **open** session (`useSessionValidity = false`), a cached chain must pass two gates to participate in recommendations:

1. **Admissibility:** `record.retrievedAt >= admissibilityBoundaryMs` where the boundary is `sessionOpen + providerDelay` (today: 09:30 ET + 15 min = 13:45 UTC).
2. **Freshness TTL:** `cache.freshness(record)` must be `fresh` (< 5 min) or `stale_usable` (< 30 min). Beyond 30 minutes the record is `expired` and dropped.

Because `handleNewEvidence` stamps each chain with its true backend acquisition time, non-primary chains sitting in the Class B backlog carry old timestamps and fail gate 2 (and possibly gate 1). The result: chains that are **present in cache** are **filtered out of recommendations**.

### 2.5 The smoking gun (SPY, live)

SPY's eligible chains (DTE 7–43) were all acquired in one back-to-back batch at **13:48:15–13:48:30 UTC** (`acquireAllEligibleChains` running consecutively through the pacer). At observation time (15:19 UTC) they were ~90 minutes old — **all expired** under the 30-minute TTL. The scheduler had not re-acquired SPY's full surface since the cold-start bootstrap batch and was still draining a ~20.8h Class B backlog.

---

## 3. The Rolling-Window Effect (corroborated by candidate counts)

At any instant, only the symbols whose chains were refreshed within the last 30 minutes pass the freshness gate. This population **churns** as the scheduler sweeps the universe.

Live SQLite measurements (August 27, 2026):

| Measure | Count |
|---|---|
| Symbols with a chain refreshed in the last 30 min (pass freshness) | 460–476 (churning) |
| Symbols with a chain after today's admissibility boundary (13:45 UTC) | 897 (admissibility not the binding gate now) |
| Weekly symbols with >1 eligible chain inside the 30-min window (a few min after burst) | 64 |
| Weekly symbols with >1 eligible chain inside the 30-min window (90 min later) | 0 |

Chain age histogram at observation: `0–5m: 118`, `5–30m: 342`, `30m–boundary: 807`, `pre-boundary/old: 1230`. Only ~460 of ~2500 chain rows were fresh/stale-usable.

The ~460–476 figure closely matches the ~482 candidates observed on the previous day's fully-reconstructed acceptance board. The candidate count is not a measure of how many opportunities exist; it is a measure of **how recently the scheduler happened to visit each symbol**.

---

## 4. Root Structural Cause

> The backend refresh cadence and the frontend evidence-validity cadence are incompatible.

- Backend full-universe refresh cycle: multi-hour (observed ~5h for ~960 chains, worsened by multi-expiration fan-out — see PL-EVID-07 cost analysis).
- Frontend chain validity window: 30 minutes (`chainStaleMs`), during open sessions.

With a ~5h cycle and a 30-min window, the fraction of the universe that can simultaneously satisfy Decision validity is bounded well below 100%. Multi-DTE weekly symbols blink in and out of the board as their acquisition batch ages past 30 minutes. Cold start is the worst case: the whole universe is acquired in one early burst, then everything ages out together before the scheduler returns.

---

## 5. Four Findings to Preserve (before any fix)

1. **7–45 DTE is a required Decision surface, not an optional enhancement.** PL-EVID-07 established that non-primary expirations can materially alter the production frontier. Collapsing to the primary is a loss of decision capability, not a display simplification. (Reinforced by the DTE-production-surface journal entry, Aug 26, 2026.)

2. **Evidence presence and Decision admissibility are distinct states.** The backend having a chain does not mean Decision currently permits it. These are different questions owned by different subsystems, and the system must be able to distinguish "no evidence exists" from "evidence exists but is inadmissible right now."

3. **A validity policy cannot be chosen independently of acquisition/service-level policy.** A 30-minute admissibility window is a commitment that the acquisition system can maintain the required decision surface within 30 minutes. That commitment is not currently met for the full universe. Validity interval and acquisition SLA must be designed together.

4. **Degraded evidence coverage must be observable.** Wheelwright must never silently turn "7–45 DTE" into "whatever happens to remain fresh." A degraded surface must be reported as degraded.

---

## 6. The 3AM Question (for architecture, not for patching)

> What does "current enough to make a governed deployment decision" actually mean, and which subsystem owns guaranteeing that condition?

This is the question to answer in architecture reconciliation. Candidate implementations — a longer chain validity interval, session-aware chain validity (analogous to sealed-evidence semantics), scheduler prioritization of full eligible surfaces for weekly-capable symbols, backend-computed admissibility, or some combination — are **implementations of the answer, not the answer itself.**

Explicitly rejected as the resolution: bumping `chainStaleMs` from 30 minutes to a larger arbitrary number. That treats a symptom and re-buries the coupling between validity policy and acquisition SLA.

---

## 7. Proposed Invariant (candidate — not yet ratified)

> If Wheelwright claims to evaluate 7–45 DTE, the Evidence Appliance must either maintain that decision surface within its declared validity contract or explicitly report that the surface is degraded.

This belongs in architecture. It is exactly the class of cross-subsystem coherence mismatch that PL-COHERE-01 was promoted to find: two layers that are each internally correct but whose composition silently defeats a ratified capability.

---

## 8. What This Finding Does NOT Do

- Does not change `chainStaleMs` or any freshness parameter.
- Does not modify the acquisition scheduler.
- Does not alter the snapshot contract.
- Does not modify `recommend.ts` eligibility.
- Does not ratify any of the candidate implementations in §6.
- Does not conclude that the browser-side recommendation placement is wrong (that is PL-ARCH-06's question) — though this finding is additional operational evidence for that reconciliation.

The finding is preserved so a future actor can reconstruct the reasoning without re-deriving it from a single confusing observation of a DTE-22 board.

---

## 9. Cross-References

- `docs/21-primary-expiration-investigation.md` — PL-EVID-07: established that non-primary expirations carry real, decision-relevant opportunity.
- `docs/foundations/evidence-appliance.md` — sealed-evidence semantics: precedent for session-aware validity that ignores wall-clock age.
- `docs/15-evidence-state-semantics.md` — trust/freshness model; this finding shows the Decision-eligibility gate is a separate, stricter validity notion than the trust indicator.
- `docs/07-architecture-current.md` §Evidence–recommendation boundary, §Market Session Model.
- `docs/parking-lot.md` — PL-COHERE-01 (owner), PL-EVID-07 (resolved), PL-ARCH-06 (recommendation engine ownership), PL-EVID-01 (observation architecture).
- Journal: 2026-08-11 (freshness/admissibility live findings), 2026-08-12 (freshness rollover empties surface), 2026-08-21 (multi-expiration surface to production), 2026-08-26 (DTE production surface).
