# Architecture: Session-Aware Background Acquisition

**Date:** July 3, 2026 (corrected July 16, 2026)
**Status:** Architecture and design — emergency provider-traffic guard implemented; full session authority pending
**Priority:** HIGH — resolved by emergency gate
**Finding:** During testing on July 3, 2026 (Independence Day observed), the backend worker continued acquiring because it lacked session awareness. An emergency provider-traffic guard was implemented the same day to suppress off-hours, weekend, and holiday acquisition.

---

## Governing Principle

> Continuous observation must not mean continuous provider traffic.

The Evidence Service must acquire according to market-session policy. Evidence freshness, acquisition urgency, and refresh eligibility are session-relative. A timestamp alone does not determine whether evidence is stale.

The backend should continuously maintain:

> The best evidence appropriate to the current market session.

Session awareness is a **correctness requirement** of the evidence appliance (see `docs/foundations/evidence-appliance.md`). An appliance that acquires when markets are closed is wasting resources on data that cannot differ from what it already holds — a failure of environmental modeling, not merely an efficiency concern.

---

## Architectural Invariant

> Market-session policy governs acquisition eligibility, evidence validity, and operator-facing trust.

---

## 1. Current State (Deficiency)

| Component | Session Awareness |
|-----------|------------------|
| Frontend `MarketSessionPolicy` | Full — 6-state classification, trading calendar, DST, holidays, early closes |
| Frontend `USMarketCalendar` | Full — 2026 holidays, early-close dates, timezone-correct boundaries |
| Frontend `trust-state.ts` | Uses session state to evaluate evidence freshness |
| Backend `acquisition-worker.ts` | **None** — acquires continuously regardless of session |
| Backend worker state | Defines `"session_blocked"` but never transitions to it |

**Result:** The worker makes provider calls 24/7/365 including weekends, holidays, and overnight. All of these calls return stale data identical to the last market-hours response. They consume Tradier rate budget, generate unnecessary network traffic, and produce no new information.

---

## 2. Existing Session Model (Source of Truth)

The session model already exists in `options-prototype/src/market-session/`. These are the authoritative definitions:

### Session States

| State | Meaning |
|-------|---------|
| `PREMARKET` | Trading day, before regular open (09:30 ET) |
| `REGULAR_OPEN_DELAY` | Market open, delayed feed hasn't delivered regular observations yet (~15 min) |
| `REGULAR_OBSERVATION` | Delayed data represents regular-session market state |
| `DELAY_DRAIN` | Exchange closed, final regular-session observations arriving via delay |
| `CLOSED_CANONICAL` | Canonical snapshot sealed; no new regular evidence accepted |
| `NON_TRADING_DAY` | Weekend or holiday; no session active |

### Trading Calendar

- Source: `options-prototype/src/market-session/trading-calendar.ts`
- Implementation: `USMarketCalendar` class
- Year: 2026 (versioned, static holiday/early-close data)
- Timezone: America/New_York with EDT/EST handling
- Holidays: 10 dates (New Year, MLK, Presidents, Good Friday, Memorial, Juneteenth, July 4, Labor, Thanksgiving, Christmas)
- Early closes: 2 dates (day after Thanksgiving, Christmas Eve) at 13:15 ET for options
- Standard session: 09:30–16:00 ET
- Provider delay: 15 minutes (Tradier sandbox)

### Session Profile

```
ETF_OPTIONS_TRADIER_SANDBOX:
  regularOpen: "09:30"
  standardClose: "16:00"
  earlyClose: "13:15"
  providerDelayMinutes: 15
```

---

## 3. Acquisition Posture by Session State

| Session State | Acquisition Posture | Provider Calls Permitted | Evidence Accepted As |
|---------------|--------------------|--------------------------|--------------------|
| `PREMARKET` | Preparation | Limited (expirations refresh only) | Reference data, not canonical |
| `REGULAR_OPEN_DELAY` | Hold | None | — |
| `REGULAR_OBSERVATION` | Active acquisition | Yes — full chain/quote/expiration | Current-session canonical |
| `DELAY_DRAIN` | Drain authorized work | Complete in-flight batches only | Current-session canonical (final) |
| `CLOSED_CANONICAL` | Sealed | None routine | — |
| `NON_TRADING_DAY` | Suspended | None routine | — |

### PREMARKET

**Permitted:**
- Serve prior sealed canonical evidence
- Refresh slow-changing expirations (bounded, low-priority)
- Prepare work queue for regular session

**Not permitted:**
- Routine option-chain acquisition
- Presenting premarket data as equivalent to regular-session canonical

**Scheduling:** One bounded reference-data pass per premarket period. Not a continuous crawl.

### REGULAR_OPEN_DELAY

**Permitted:**
- Wait for provider feed to stabilize
- Serve prior-session canonical evidence (still operationally valid)

**Not permitted:**
- Acquisition calls (delayed feed hasn't reached regular-session territory yet)

**Duration:** ~15 minutes (provider delay window)

### REGULAR_OBSERVATION

**Permitted:**
- Full freshness-driven option-chain acquisition
- Incremental evidence publication
- Normal RequestPacer-governed provider calls
- Failures and retries with backoff

**This is the primary active-acquisition state.** All current worker logic applies here.

### DELAY_DRAIN

**Permitted:**
- Complete in-flight batch (do not abandon partially-acquired symbols)
- Accept final delayed observations as canonical

**Not permitted:**
- Starting new universe-wide passes
- Beginning new symbol acquisition that wasn't already queued

**Duration:** ~15 minutes after exchange close

### CLOSED_CANONICAL

**Permitted:**
- Serve sealed canonical evidence
- Diagnostics and health checks
- Bounded administrative refresh (explicit operator action only)

**Not permitted:**
- Routine option-chain crawling
- Repeated reacquisition of unchanged chains overnight
- Treating retrieved data as new canonical evidence

**Worker state:** `session_blocked`. Log transition once. Remain alive but produce no provider traffic.

### NON_TRADING_DAY

**Permitted:**
- Serve latest sealed canonical evidence
- Administrative diagnostics

**Not permitted:**
- Any routine provider acquisition
- Bootstrap crawl
- Reference data refresh (defer to next PREMARKET)

**Worker state:** `session_blocked`. Log transition once.

---

## 4. Trading Calendar Authority

The backend must use an exchange-aware trading calendar. Do not rely only on weekday checks.

### Required capabilities:

- Weekend detection (Saturday/Sunday)
- Full exchange holiday detection (10 dates for 2026)
- Early-close session detection (2 dates for 2026)
- Daylight-saving time transitions (EDT ↔ EST)
- Exchange timezone (America/New_York)
- Provider delay window computation
- Session transition boundary timestamps

### Implementation approach:

Share or replicate the existing `USMarketCalendar` and `MarketSessionPolicy` from the frontend. Options:

| Approach | Pros | Cons |
|----------|------|------|
| **A. Copy to backend** | No shared-package infrastructure needed | Duplication; must sync manually |
| **B. Shared package** | Single source of truth | Requires workspace package setup |
| **C. Backend-canonical, frontend imports** | Backend is authoritative for scheduling | Larger refactor |

**Recommended for transitional slice:** Approach A (copy). The calendar is small, static (annual), and versioned. Copy `trading-calendar.ts` and `session-policy.ts` (core types and logic only) into `evidence-service/src/market-session/`. Note that the frontend uses `MarketSessionPolicy` for trust-state derivation (a display concern) while the backend uses it for acquisition scheduling (an operational concern). These are compatible uses of the same temporal classification.

---

## 5. Off-Hours Cold Start

When the Evidence Service starts with an empty process-lifetime store outside an active market session:

### NON_TRADING_DAY or CLOSED_CANONICAL cold start:

| Option | Behavior | Recommended |
|--------|----------|-------------|
| Remain idle | Report empty evidence, no acquisition | **Yes — transitional** |
| Full bootstrap crawl | Acquire stale data at night | No |
| Limited reference refresh | Acquire expirations only | Deferred |
| Serve durable evidence | Load from SQLite | Future (not yet built) |

**Transitional decision:** The worker starts in `session_blocked` state if cold-starting during CLOSED_CANONICAL or NON_TRADING_DAY. It reports via diagnostics that no evidence exists because the market is closed. The frontend displays "Prior Session · Market Closed" or "Unavailable · No evidence (service started outside market hours)".

When the next PREMARKET arrives, the worker transitions to limited preparation. When REGULAR_OBSERVATION begins, full acquisition starts.

**SQLite-era behavior:** On cold start, load persisted evidence from the previous session. Serve it as sealed canonical. No provider traffic needed until the next active session.

### PREMARKET cold start:

Worker may perform one bounded reference-data pass (expirations only) to prepare the work queue. Full acquisition awaits REGULAR_OBSERVATION.

### REGULAR_OBSERVATION cold start:

Normal bootstrap — full acquisition proceeds as today.

---

## 6. Sealed Evidence Semantics

Evidence sealed at session close remains operationally valid indefinitely until superseded by the next session's canonical evidence.

| Scenario | Evidence validity |
|----------|------------------|
| Close at 16:00 ET, operator checks at 21:00 ET | Valid sealed canonical |
| Saturday morning | Valid sealed canonical from Friday |
| Holiday (today, July 3) | Valid sealed canonical from July 2 |
| Monday 08:00 ET (premarket) | Valid sealed canonical from prior Friday |
| Monday 09:45 ET (regular + delay) | New session begins; sealed evidence superseded as new data arrives |

**Key rule:** Do NOT mark valid sealed evidence as stale because wall-clock age exceeds a threshold. The freshness label is session-relative:

- During regular session: "3s ago" / "2m ago" (real-time freshness matters)
- During closed/non-trading: "Today's close" / "Prior session" (wall-clock age is irrelevant)

---

## 7. Non-Optionable Revalidation

Non-optionable is a successful classification, not an error. However, it is not permanent — a fund may begin listing options at any time.

### Revalidation policy:

| Trigger | Action |
|---------|--------|
| Calendar cadence (weekly) | Re-check expirations for a bounded subset of non-optionable symbols during PREMARKET |
| Universe metadata change | Re-check affected symbols |
| Administrative action | Operator-triggered revalidation |
| Provider reference update | Deferred (not currently detectable) |

**Do NOT revalidate every non-optionable symbol every active cycle.** This is a low-frequency maintenance task.

**Cadence:** Re-check ~20% of non-optionable symbols per week (rotating). At 131 non-optionable symbols, this means ~26/week or ~5-6/day during PREMARKET.

---

## 8. Scheduler vs Acquisition

| Concept | Meaning | Generates provider traffic? |
|---------|---------|---------------------------|
| Scheduler wakeup | Timer fires, worker evaluates policy | No |
| Session check | Worker classifies current session state | No |
| No work due | Work queue empty or session blocked | No |
| Acquiring | Worker makes provider calls via pacer | Yes |
| Sealing | Worker marks evidence as canonical end-of-session | No |
| Maintaining reference data | Bounded expiration refresh during PREMARKET | Yes (limited) |
| Administratively forced | Operator nudge outside normal policy | Yes (explicit) |

**Critical:** A scheduler wakeup does not mean acquisition. The worker should NOT show "Updating" in Write Desk merely because the scheduler evaluated its policy and found no work permitted.

---

## 9. Operator-Facing State

Session-aware evidence trust labels:

| Condition | Operator Label |
|-----------|---------------|
| Regular session, evidence < 60s old | Current |
| Regular session, acquiring | Updating |
| Regular session, partially covered | Partially Current |
| Sealed after close, complete | Sealed · Today's Close |
| Prior session, market closed | Prior Session · Market Closed |
| Prior session, non-trading day | Prior Session · {Day} Close |
| No evidence, cold start off-hours | Unavailable · Market Closed |
| Service error | Degraded |

---

## 10. Refresh / Administrative Actions

The existing "Refresh" button calls `POST /api/evidence/refresh` which triggers `worker.nudge()`.

### Session-aware behavior:

| Session State | Refresh action |
|---------------|---------------|
| REGULAR_OBSERVATION | Permitted — immediate cycle |
| DELAY_DRAIN | Permitted — drain authorized work |
| PREMARKET | Permitted — bounded reference refresh only |
| REGULAR_OPEN_DELAY | Queued — executes when session permits |
| CLOSED_CANONICAL | Denied or admin-only — log as administrative override |
| NON_TRADING_DAY | Denied — no meaningful data available |

During CLOSED_CANONICAL or NON_TRADING_DAY, the Refresh button should either:
- Be disabled with tooltip ("Market closed — no live data available")
- Be hidden
- Trigger only reference-data maintenance (not chain acquisition)

Ordinary Write Desk operation should not require an off-hours refresh.

---

## 11. Observability

### State-transition log (info level):

```
[worker] Regular session · active acquisition permitted · 496 pending
[worker] Delay drain · completing in-flight batch · 3 remaining
[worker] Session closed · canonical evidence sealed · routine acquisition suspended
[worker] Non-trading day · serving prior sealed evidence · next session Monday 2026-07-06 09:30 ET
[worker] Premarket · bounded reference refresh · 6 non-optionable symbols re-checked
[worker] Regular session resumed · beginning acquisition cycle
```

### Diagnostics endpoint additions:

```json
{
  "sessionState": "CLOSED_CANONICAL",
  "acquisitionPosture": "sealed",
  "workPermitted": false,
  "reason": "Market closed — exchange holiday (Independence Day observed)",
  "lastCanonicalSeal": "2026-07-02T16:15:00Z",
  "nextSessionTransition": "2026-07-06T09:30:00Z",
  "nextSessionState": "PREMARKET",
  "lastProviderCall": "2026-07-02T16:12:34Z",
  "administrativeOverrideActive": false
}
```

### No repeated idle logging:

The worker logs a session transition once. It does NOT emit:
```
[worker] Idle · coverage: 365 ready, 131 absent, 0 pending
[worker] Idle · coverage: 365 ready, 131 absent, 0 pending
[worker] Idle · coverage: 365 ready, 131 absent, 0 pending
```

This was already fixed (single "Bootstrap complete" transition log).

---

## 12. Implementation Plan

### Phase 1: Stop off-hours traffic (immediate)

1. Copy `trading-calendar.ts` core types and `CALENDAR_2026` data into `evidence-service/src/market-session/`
2. Copy `session-policy.ts` core classification logic into `evidence-service/src/market-session/`
3. Add session check at top of `runCycle()`:
   ```typescript
   const session = this.sessionPolicy.classify(new Date());
   if (!this.isAcquisitionPermitted(session.state)) {
     this.transitionToSessionBlocked(session);
     return;
   }
   ```
4. Implement `isAcquisitionPermitted()` → only `REGULAR_OBSERVATION` and (bounded) `DELAY_DRAIN`
5. Add state-transition logging
6. Gate `nudge()` by session state

### Phase 2: Sealed evidence semantics

1. Record `lastSealedAt` timestamp when transitioning to CLOSED_CANONICAL
2. Include seal timestamp in snapshot response
3. Frontend trust-state uses seal-awareness to label evidence correctly

### Phase 3: Premarket preparation

1. During PREMARKET, allow bounded expiration-only refresh
2. Non-optionable revalidation (rotating subset)
3. Work queue preparation for upcoming session

### Phase 4: Observability

1. Expose session-aware diagnostics in status endpoint
2. Next-session-transition computation
3. Administrative override logging

---

## 13. Tests Required

| Test | Nature |
|------|--------|
| Regular session → acquisition permitted | Deterministic calendar fixture |
| CLOSED_CANONICAL → acquisition suppressed | Deterministic calendar fixture |
| NON_TRADING_DAY → acquisition suppressed | Deterministic calendar fixture |
| Weekend → acquisition suppressed | Deterministic calendar fixture |
| Exchange holiday (e.g., July 3) → suppressed | Deterministic calendar fixture |
| Early-close transition → DELAY_DRAIN then CLOSED_CANONICAL | Fixture with early-close date |
| DST boundary → correct session boundaries | March 8 / November 1 fixtures |
| Sealed evidence remains valid after close | Trust-state derivation |
| Scheduler wakeup not reported as Updating | Worker state check |
| Off-hours cold start → session_blocked | Empty store + non-trading classify |
| Nudge during CLOSED_CANONICAL → denied or gated | Integration |
| Non-optionable revalidation cadence | Unit test for rotation logic |
| No repeated idle logging | Output assertion |
| State-transition log emitted once per transition | Output assertion |

All tests use deterministic calendar fixtures, not wall-clock.

---

## 14. Open Questions

1. **Should the backend ever acquire on a non-trading day if the evidence store is completely empty?** Current recommendation: No. Report unavailable. Wait for next session.

2. **Should administrative override be available at all during NON_TRADING_DAY?** Current recommendation: No routine use. Allow only via explicit diagnostics endpoint with logging.

3. **How should early-close days interact with DELAY_DRAIN duration?** Options close at 13:15 ET + 15 min delay = evidence valid until 13:30 ET. Worker should seal by ~13:35 ET.

4. **Should the backend expose its session classification to the frontend?** Currently the frontend computes its own. Both should agree. Consider having the snapshot response include `sessionState` so the frontend can verify consistency.

5. **Year rollover:** Calendar data is 2026-only. Need CALENDAR_2027 before January 1, 2027. This is a manual annual update (exchange publishes holiday schedule months ahead).

---

## 15. Cross-References

| Document | Relationship |
|----------|-------------|
| `docs/14-background-acquisition-design.md` | Parent design — specifies session-awareness as a requirement (not yet implemented) |
| `docs/15-evidence-state-semantics.md` | Defines trust states; session-awareness influences trust labels |
| `docs/foundations/state-oriented-console.md` | Operator-facing state philosophy |
| `options-prototype/src/market-session/session-policy.ts` | Source of truth for session classification |
| `options-prototype/src/market-session/trading-calendar.ts` | Source of truth for calendar data |
| `evidence-service/src/acquisition-worker.ts` | Implementation target for Phase 1 |

---

## Completion Criteria

> The background worker does not routinely scan live option evidence during off hours, weekends, or exchange holidays.

> Valid closed-session evidence is represented as sealed, not merely old.

> The scheduler can remain alive continuously without generating continuous unnecessary provider traffic.
