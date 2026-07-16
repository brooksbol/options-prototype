# Write Desk Recomposition — Evidence Validity Model and Page Architecture

**Date:** July 16, 2026
**Status:** Ratified design — authoritative for implementation planning
**Scope:** Holistic architecture covering backend evidence validity, frontend page composition, and session authority
**History:** Initial draft July 3, 2026. Corrected and ratified July 16, 2026.

---

## Governing Principle

> **Represent the environment, not the machinery.**

This principle follows from the project's architectural identity as an **evidence appliance** (see `docs/foundations/evidence-appliance.md`). Write Desk is the operator console for the appliance — a viewport into continuously maintained evidence, not a control panel for a scanner.

### Backend
The Evidence Service does not exist to run a crawler. It exists to maintain the best valid evidence appropriate to the current market session. Acquisition is a means, not an end. The worker is subordinate to the Evidence Validity Model.

### Frontend
Write Desk does not narrate acquisition machinery. It presents the current portfolio, opportunity surface, evidence trust, and decision context. The operator sees what the environment offers — not what the system is doing to learn about it. Diagnostics remain available for process mechanics, but they are not the primary surface.

---

## 1. Evidence Validity Model

Evidence validity is not a timestamp check. It is a function of:

- **Session state** — Is new market evidence physically possible right now?
- **Acquisition posture** — Is the system permitted to acquire?
- **Seal status** — Has the session's evidence been finalized?
- **Evidence provenance** — When was this evidence observed, relative to which session?

### Core rules:

| Rule | Statement |
|------|-----------|
| R1 | Evidence acquired during REGULAR_OBSERVATION or DELAY_DRAIN is canonical for that session |
| R2 | Sealed canonical evidence remains valid until superseded by the next session's canonical evidence |
| R3 | Wall-clock age does not invalidate sealed evidence |
| R4 | Acquisition is permitted only when new evidence can physically exist |
| R5 | The backend is the sole authority for acquisition decisions |
| R6 | The frontend determines display trust from backend-reported evidence metadata |
| R7 | Durable persistence is required to fulfill evidence validity across process restarts |

### Validity states:

| State | Meaning | Acquisition | Trust label |
|-------|---------|-------------|-------------|
| **Current** | Evidence from active session, recently refreshed | Active | Current |
| **Updating** | Evidence from active session, refresh in progress | Active | Updating |
| **Partially current** | Incomplete coverage during active session | Active | Partially Current |
| **Sealed** | Session complete, evidence finalized | None | Sealed · {date} Close |
| **Prior session** | Serving sealed evidence from previous session | None | Prior Session |
| **Unavailable** | No valid evidence exists | Blocked by session | Unavailable |
| **Degraded** | Service error or provider failure | May retry | Degraded |

---

## 2. Session Authority and Ownership

The backend is authoritative for session classification, acquisition posture, and evidence sealing. The frontend does not independently override acquisition eligibility.

| Decision | Authority | Location |
|----------|-----------|----------|
| Current session classification | Backend | `evidence-service/src/market-session/` (to be created) |
| Acquisition permitted? | Backend | Worker checks session before each cycle |
| Evidence seal | Backend | Worker transitions to sealed on session close |
| Trust label for display | Frontend | Derives from backend-reported metadata |
| Recommendation computation | Frontend | Runs Wheelwright on cached evidence |

The backend classifies the session and includes it in the snapshot response:

```json
{
  "sessionState": "CLOSED_CANONICAL",
  "canonicalSessionDate": "2026-07-15",
  "acquisitionPosture": "sealed",
  "sealedAt": "2026-07-15T16:15:00Z"
}
```

The frontend uses this to select the appropriate trust label without independently re-deriving session state from a clock. This avoids split-brain classification.

**Shared code recommendation:** The existing `MarketSessionPolicy` and `USMarketCalendar` in `options-prototype/src/market-session/` should become shared code (shared package or backend-canonical with frontend consuming) rather than maintaining divergent copies. The calendar data is small, static, versioned, and must agree across frontend and backend.

---

## 3. Policy Ownership

### System Governance (not operator-adjustable)

- Instrument admissibility (product structure restrictions)
- Admissible delta range boundaries
- Admissible DTE range boundaries
- Hard execution floors (spread > 80%, zero OI, zero bid)
- Canonical policy version
- Posture thresholds (ACTIONABLE ≥ 65, EDGE ≥ 35)

System-owned. Changes require explicit architectural decision, not casual UI interaction.

### Operator-Adjustable Operating Controls

- Target delta (preference center, not governance boundary)
- Target DTE (preference center)
- Ranking mode (execution_first, balanced, yield_first, capital_efficiency)

Only those explicitly intended to be adjustable. The UI must not present governance parameters as if they are casual preferences.

### Display Controls (presentation only)

- Affordable only (checkbox)
- Show count (10/20/50/100)
- Column sort order

Frontend presentation state. Does not affect the recommendation engine's eligible population.

---

## 4. Acquisition Posture by Session

| Session State | Posture | Provider Traffic | Work Scope | Wake Interval |
|---------------|---------|-----------------|------------|---------------|
| PREMARKET | Preparation | Limited (expirations) | Bounded reference refresh, non-optionable revalidation | 5 min |
| REGULAR_OPEN_DELAY | Hold | None | Queue preparation only | 30s (poll for session advance) |
| REGULAR_OBSERVATION | Active | Full (chains, quotes, expirations) | Continuous universe maintenance | 1s between cycles |
| DELAY_DRAIN | Drain | Bounded (complete in-flight) | Finish current batch, no new starts | 1s until drained, then seal |
| CLOSED_CANONICAL | Sealed | None | Log transition, sleep until next state | 5 min (monitor transition) |
| NON_TRADING_DAY | Suspended | None | Log transition, sleep until next state | 15 min |

---

## 5. Off-Hours Cold Start

| Scenario | Behavior |
|----------|----------|
| Cold start during REGULAR_OBSERVATION | Normal bootstrap — full acquisition |
| Cold start during PREMARKET | Bounded reference-only refresh, full acquisition when regular session starts |
| Cold start during CLOSED_CANONICAL | Report sealed-from-prior-session if durable evidence exists; otherwise report unavailable |
| Cold start during NON_TRADING_DAY | Same as CLOSED_CANONICAL |
| Cold start with empty store, off-hours | Unavailable — no valid evidence until next session |
| Cold start with SQLite (future) | Load prior sealed evidence, serve immediately |

**Transitional (current in-memory store):** Off-hours cold start → unavailable. The operator sees "Market Closed · No evidence available (service restarted outside market hours)."

**Intended (persistence era):** Off-hours cold start → load sealed evidence → "Prior Session · Jul 15 Close · 49 opportunities."

### Durability as a requirement

SQLite or equivalent persistence is required to fulfill the Evidence Validity Model across process restarts. Without durability:

- Market closed + backend restart = no server evidence
- Operator must wait until next regular session for any recommendations

With durability:

- Market closed + backend restart = load latest sealed canonical evidence
- Recommendations immediately available from prior session

Persistence also supports historical-analysis accumulation (observing the opportunity surface over time). This is a prerequisite for the complete validity model, not an optimization.

---

## 6. Sealed Evidence Semantics

When the session transitions from DELAY_DRAIN to CLOSED_CANONICAL:

1. Worker records `sealedAt` timestamp
2. Worker logs: `"Session closed · canonical evidence sealed · routine acquisition suspended"`
3. Evidence generation is frozen (no new increments)
4. Snapshot endpoint includes `sealedAt` in response
5. Frontend displays "Sealed · Today's Close" (not "47 minutes ago")

**Friday close through Monday open:** Evidence remains sealed. No staleness. The trust label reads "Prior Session · Friday Close" throughout the weekend. Recommendations remain valid because the underlying market hasn't moved.

---

## 7. Refresh Disposition

### Current behavior:
`POST /api/evidence/refresh` → `worker.nudge()` → cancels idle timer, reevaluates whether work is due.

### What nudge actually does:
It does not guarantee fresh data. Its semantics are:

> Reevaluate whether acquisition work is currently due and permitted.

It does not:
- Force provider calls
- Bypass freshness checks
- Invalidate caches
- Override session policy

The primary label "Refresh" is misleading because it implies guaranteed new data.

### Session-aware behavior:

| Session | Nudge effect |
|---------|--------------|
| REGULAR_OBSERVATION | Immediate cycle if work exists |
| DELAY_DRAIN | Complete current drain |
| PREMARKET | Bounded reference refresh |
| REGULAR_OPEN_DELAY | Queued — executes when observation begins |
| CLOSED_CANONICAL | Denied — returns 409 with reason |
| NON_TRADING_DAY | Denied — returns 409 with reason |

### Recommended disposition:

- Remove from primary Write Desk surface
- Relocate to diagnostics as "Check Now" or "Reevaluate Acquisition"
- A nudge must always obey session policy
- A weekend or holiday action must not silently trigger a provider crawl

---

## 8. Current Page-Composition Diagnosis

### Element inventory (top to bottom):

| Element | Height | Purpose | Permanence |
|---------|--------|---------|-----------|
| Band 1: Identity/Session | ~32px | Context: who, what portfolio, what session | Always visible |
| Band 2: Portfolio chips | ~24px | Context: positions, capacity, cash | Always visible |
| Band 2: Portfolio detail (expanded) | ~200px | Detail: full tables, provenance | Disclosure only |
| Band 3: Refresh button | ~28px | Action: nudge backend | Questionable — move to diagnostics |
| Band 3: PolicyStrip (7 selects) | ~28px | Control: adjust recommendation policy | Needs reclassification |
| Band 3: Evidence indicator | ~14px | Status: trust, coverage, freshness | Always visible |
| Band 3: Coverage bar | ~4px | Visual: coverage proportion | Always visible |
| Put section heading | ~18px | Label + affordable toggle + show count | Always visible |
| FunnelInfographic | ~24px | Telemetry: universe partitioning | Always visible |
| Provisional note | ~16px | Status: incomplete coverage message | Conditional |
| Showing count | ~14px | Info: X of Y eligible | Always visible |
| **Total above first row** | **~190-220px** | | |

### Problems identified:

1. **Band 3 is overloaded** — Refresh, 7 policy selects, evidence indicator, and coverage bar on one wrapping line. No clear visual hierarchy.
2. **Policy controls have wrong mental model** — 7 dropdowns look like casual preferences. Some are governance (admissible range), some are operator controls (ranking mode), some are targets (Δ, DTE).
3. **FunnelInfographic duplicates evidence indicator** — Both show coverage/universe information.
4. **Provisional note duplicates funnel** — Says the same thing in prose.
5. **Coverage disclosure section duplicates funnel exclusions** — Same information in two places.
6. **Evidence indicator + coverage bar + funnel = three overlapping coverage displays**
7. **Portfolio detail expansion pushes table ~200px further down**
8. **No visual dominance** — candidate table doesn't feel like the primary surface; it's just another section after many.

---

## 9. Composition Principles (Informed by Fidelity Option Summary)

Principles extracted from Fidelity's layout (not their branding):

| Principle | Application |
|-----------|-------------|
| **One dominant working surface** | The candidate table is the work. Everything else is subordinate. |
| **Compact account context** | Portfolio state in one dense line, not an expandable card. |
| **Controls adjacent to affected data** | Ranking mode and show count near the table, not in a separate band. |
| **Bounded containers** | Each logical section has clear visual boundaries. |
| **No vertical fragmentation** | Don't use full-width horizontal bands for small data points. |
| **Dense but readable** | Small type, tight spacing, monospace numbers. |
| **Disclosure at point of relevance** | Details expand where they're needed, not in a separate section. |

---

## 10. Element Permanence Classification

| Element | Classification | Proposed Location |
|---------|---------------|-------------------|
| Write Desk title | Permanent | Band 1 |
| Portfolio source select | Permanent | Band 1 |
| SIMULATED badge | Permanent (demo mode) | Band 1 |
| Deployable cash | Permanent | Band 1 |
| Session pip + label | Permanent | Band 1 |
| Evidence trust indicator | Permanent | Band 2 (operating context) |
| Position chips (calls, puts, pending) | Permanent | Band 2 |
| Target Δ, Target DTE | Operator control | Table header |
| Ranking mode | Operator control | Table header |
| Affordable toggle | Display control | Table header |
| Show count | Display control | Table header |
| Micro-infographic | Permanent | Table header |
| Admissible Δ range | System governance | Disclosure ("Policy settings") |
| DTE range | System governance | Disclosure ("Policy settings") |
| Policy version | Diagnostic | Remove from primary |
| Refresh button | Diagnostic | Remove from primary or relocate to diagnostics |
| Portfolio detail grid | Disclosure | Behind "Portfolio detail" |
| Coverage disclosure | Diagnostic | Merge into "Why N?" |
| Provisional note | Redundant | Remove (infographic communicates this) |

---

## 11. Proposed Write Desk Information Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│ BAND 1: Context Line                                            ~28px  │
│                                                                         │
│ Write Desk · Demo Portfolio · SIMULATED · $18,500 deployable            │
│                                       Market Closed · Jul 15 session    │
└─────────────────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────────────────┐
│ BAND 2: Operating Context                                       ~24px  │
│                                                                         │
│ ● Sealed · Jul 15 close · 496/496 resolved · 49 opportunities          │
│ Calls: XLE·1  Short puts: XLF $40 07-18                                │
└─────────────────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────────────────┐
│ TABLE HEADER                                                    ~26px  │
│                                                                         │
│ Put Candidates — Cash-Secured                                           │
│ [Rank ▾] [Δ 0.30] [DTE 21]  ☑ Affordable  Show [50]                   │
│                                                                         │
│ [ 49 opportunities | 316 filtered | 131 no options ]  ▸ Why 49?        │
└─────────────────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────────────────┐
│ CANDIDATE TABLE                                          ~remainder     │
│                                                                         │
│ #  Symbol  Exp    DTE  Strike  Δ    Bid   Ask  Spread  OI  Yield  ...  │
│ 1  XLE     07-18  15   $88    .28  $1.52 $1.70  12%  520  29.8%  ...  │
│ 2  XLF     07-18  15   $44    .30  $0.85 $0.95  12%  340  33.5%  ...  │
│ ...                                                                     │
└─────────────────────────────────────────────────────────────────────────┘
```

**Total above first table row: ~78px** (target) vs current ~190-220px.

---

## 12. Wireframe-Level Layout Description

### Band 1 — Context Line (single row, ~28px)

Left: `Write Desk` · source select · SIMULATED · `$18,500 deployable` · ●

Right: session pip · `Market Closed` · `Jul 15` · `Labs →`

### Band 2 — Operating Context (single row, ~24px)

Left: Evidence trust: `● Sealed · Jul 15 close · 496/496 resolved · 49 opportunities`

Right: Position chips: `Calls: XLE·1` · `Puts: XLF $40 07-18` (or "No positions" if empty)

Optional disclosure: `▸ Portfolio detail` expands inline below this band.

### Table Header (attached to table, ~26px)

Row 1: `Put Candidates — Cash-Secured`
Row 2: Controls inline: `[Rank mode ▾]` `[Δ 0.30 ▾]` `[DTE 21 ▾]` · `☑ Affordable` · `Show [50 ▾]`
Row 3: Micro-infographic: segmented bar + `▸ Why 49?` disclosure

### Candidate Table

Immediately follows. Dominates the viewport.

---

## 13. Vertical-Space Budget

| Target viewport | 900px (MacBook Air) |
|----------------|---------------------|
| Browser chrome + tab bar | ~80px |
| Available page height | ~820px |

| Zone | Current | Target | Reduction |
|------|---------|--------|-----------|
| Band 1 (identity/session) | ~32px | 28px | -4px |
| Band 2 (portfolio + evidence) | ~24px inline + 200px expanded | 24px + disclosure | -200px potential |
| Band 3 (controls + evidence) | ~60px | 0px (merged into Band 2 + table header) | -60px |
| Section header + infographic | ~40px | 26px (table header with controls) | -14px |
| Provisional + showing count | ~30px | 0px (removed/merged) | -30px |
| **Total above table** | **~190px** | **~78px** | **-112px** |
| **Table rows visible (at 22px/row)** | **~28 rows** | **~33 rows** | **+5 rows** |

Ratified target: approximately 78px above the candidate board, excluding user-expanded disclosure. The candidate table is the dominant permanent surface.

---

## 14. Portfolio-Detail Compression Plan

**Current:** 3-column expandable grid (Call Capacity table, Put Deployment card, Provenance metadata) consuming ~200px when expanded.

**Proposed primary (always visible):**
```
Calls: XLE·1 XLK·2  ·  Puts: 2 short  ·  $18,500 deployable
```

One line. ~14px. Decision-relevant information only.

**Proposed disclosure (behind "Portfolio detail"):**
- Full capacity table
- Encumbered positions
- Below-lot positions
- Provenance
- Pending intents management

The disclosure expands below Band 2, pushing the table down temporarily. Acceptable because the operator is choosing to inspect detail.

---

## 15. Policy and Evidence Composition Plan

### Current problem:
Band 3 mixes three unrelated concerns: action (Refresh), policy controls (7 selects), and status (evidence indicator + coverage bar).

### Proposed separation:

| Concern | Classification | New location |
|---------|---------------|-------------|
| Evidence trust | Permanent status | Band 2, inline with portfolio context |
| Ranking mode | Operator control | Table header, adjacent to data |
| Target Δ, Target DTE | Operator control | Table header, compact inline selects |
| Admissible Δ range, DTE range | System governance | Behind disclosure ("Policy settings") |
| Refresh button | Diagnostic action | Remove from primary or move to diagnostics |
| Policy version | Diagnostic | Remove from primary |
| Coverage bar | Permanent status | Merge into micro-infographic |

Result: Band 3 is eliminated entirely. Its contents distribute to where they're contextually relevant.

---

## 16. Micro-Infographic Placement and Composition

### Placement:
Attached to table header, below controls line. Part of the candidate-board frame, not a separate band.

### Role:
Represents the current opportunity environment, not acquisition mechanics.

### Composition (macOS storage-bar metaphor):

```
[ ████ opportunities │ ░░░░░░░░░ filtered │ ▓▓▓ no options │   pending ]
  49                   316                   131              0
```

Single segmented bar, ~4px tall. One legend line below with counts. Total: ~20px.

### Coherence requirement:
All values displayed together must share:
- Universe version
- Policy/governance version
- Evidence generation
- Recommendation timestamp
- Session context

### Behavior:

| State | Appearance |
|-------|------------|
| Acquiring (partial) | Pending segment visible, bar growing |
| Complete | Pending gone, stable segments |
| Sealed | Identical to complete (evidence is frozen) |
| Zero eligible | Opportunity segment absent, "Why 0?" prominent |

### Disclosure: "Why N?"
Expands inline with operator-language exclusion reasons:
- 131 No options listed
- 184 No match (delta/DTE/spread)
- 122 Poor market quality
- 9 Below threshold

---

## 17. Generation Display Model

### Problem:
During bootstrap, the UI may show a mix of current partial backend generation and prior browser-cached evidence.

### Rule:
All counts in the infographic must belong to the same recommendation run:
- Same universe version
- Same policy version
- Same evidence generation
- Same recommendation timestamp

### Implementation:
The `RecommendationResult.funnel` already captures this. The infographic renders from one funnel object, computed from one cache state at one point in time.

During active acquisition: funnel.pending > 0, displayed counts reflect current partial state.

After completion: funnel.pending = 0, all counts are final.

The "Showing X of Y eligible" count and the infographic "49 opportunities" must always agree (both from the same `funnel` object).

---

## 18. Session-Aware Operator State Examples

### Regular session, actively acquiring:
```
● Updating · 320/496 resolved · 24 opportunities · 2m ago
```

### Regular session, fully current:
```
● Current · 496/496 · 49 opportunities · 30s ago
```

### Closed session (evening):
```
● Sealed · Today's close · 49 opportunities
```

### Weekend:
```
● Prior Session · Friday close · 49 opportunities · next session Monday
```

### Exchange holiday:
```
● Prior Session · Jul 15 close · 49 opportunities · next session Jul 17
```

### Off-hours cold start (no durable evidence):
```
○ Unavailable · Market closed · no evidence available
```

### Off-hours cold start (with durable evidence, future):
```
● Prior Session · Jul 15 close · 49 opportunities · loaded from store
```

### Service error:
```
● Degraded · last valid 5m ago · service error
```

---

## 19. Diagnostic Layering Plan

| Layer | Content | Access |
|-------|---------|--------|
| **Primary** (always visible) | Trust label, opportunity count, session state | Band 2 |
| **Explanation** (one click) | "Why N?" exclusion breakdown | Disclosure in table header |
| **Portfolio** (one click) | Full position tables, provenance | Disclosure below Band 2 |
| **Policy** (one click) | Governance parameters, admissible ranges | Disclosure or settings panel |
| **Engineering** (diagnostics route) | Worker state, queue depth, pacer, cache, generations, scheduler | /labs or /diagnostics |

**Never in primary view:**
- Cycle number, scheduler pass, queue depth
- Current symbol, pacer delay, request counts
- Cache hit rates, generation IDs
- ETag values, response sizes
- Worker state transitions
- Session classification detail

---

## 20. Implementation Phases

### Completed: Emergency Provider-Traffic Guard

A temporary safety barrier implemented July 3, 2026 in `evidence-service/src/acquisition-worker.ts`. Blocks acquisition based on:
- Weekend (Saturday/Sunday)
- Hard-coded 2026 holiday set
- Before 09:30 ET
- After 16:15 ET

**Explicit limitations (not the completed Evidence Validity Model):**
- No shared six-state session model
- Incomplete early-close handling (uses 16:15 for all days)
- No sealing transition
- No durable prior-session load
- No canonical next-session calculation
- No distinct PREMARKET / OPEN_DELAY / DELAY_DRAIN behavior
- Inline calendar duplication (not shared with frontend)
- Simple ET offset approximation

Preserved only as a temporary safety barrier until backend session authority is implemented.

### Phase 1: Backend Session Authority (Next)

- Share or replicate `MarketSessionPolicy` and `USMarketCalendar` in evidence-service
- Replace emergency gate with proper six-state classification
- Implement canonical sealing on DELAY_DRAIN → CLOSED_CANONICAL transition
- State-transition logging (one log per transition, not per wakeup)
- Session metadata in snapshot response (`sessionState`, `sealedAt`, `acquisitionPosture`)
- Nudge/Refresh gated by session policy (409 when denied)

### Phase 2: Frontend Trust from Backend

- Use backend-reported session metadata for trust label
- Remove independent frontend session classification for acquisition trust
- (Frontend retains session classification for display formatting only)

### Phase 3: Page Recomposition

- Merge Band 2 + Band 3 into one operating-context line
- Attach operator controls (Rank, Δ, DTE) to table header
- Move governance parameters to disclosure
- Compress portfolio context to single line
- Remove Refresh from primary surface
- Eliminate redundant coverage displays (evidence indicator, coverage bar, funnel → one infographic)
- Remove provisional note (infographic communicates this)

### Phase 4: Infographic and Diagnostics

- macOS storage-bar composition
- "Why N?" disclosure
- Generation coherence verification
- Diagnostic route for engineering telemetry

### Phase 5: Persistence

- Durable sealed evidence (SQLite)
- Restart continuity
- Historical observation storage
- Off-hours cold start → load sealed evidence

---

## Summary

The UI layout and worker behavior were symptoms of the same architectural problem. The system must represent and maintain the opportunity environment — not expose the machinery used to construct it.

> The Evidence Service maintains the best valid evidence appropriate to the current market session.

> Write Desk presents one coherent operator workspace centered on candidate evaluation.

> The candidate board is the work. Everything else is compact supporting context.

> Closed markets produce sealed evidence, not pointless crawling.

> The operator console shows what is. Diagnostics show what the system is doing.
