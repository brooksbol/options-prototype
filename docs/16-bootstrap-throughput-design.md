# Cold-Bootstrap Throughput, Representative Coverage, and Coverage Visibility

**Date:** July 2026
**Status:** Design analysis — implementation pending review
**Based on:** Measured runtime data from 10 cold-start cycles

---

## 1. Measured Cold-Bootstrap Timeline

| Metric | Value |
|--------|-------|
| Cycles observed | 10 |
| Symbols resolved | 100 (67 ready, 33 absent) |
| Total elapsed | ~5m 48s |
| Average cycle duration | ~34.8s |
| Symbols per cycle | 10 |
| Effective per-symbol rate | ~3.5s blended |
| Extrapolated full-universe (496) | ~29 minutes |
| Time to first recommendation | ~35s (after cycle 1) |
| Time to 10 eligible | ~1m 10s (after cycle 2) |
| Time to 20 eligible | ~2m 30s (after cycle 4) |
| Time to 50% coverage | ~14-15 minutes |
| Time to 95% coverage | ~27 minutes |

---

## 2. Time Decomposition Per Symbol

### Ready symbol (has options, needs expirations + chain):

```
RequestPacer wait for expirations call:     ~1.1s
Tradier HTTP response (expirations):        ~300ms
DELAY_BETWEEN_SYMBOLS_MS (chain-chase):      2.0s  ← REDUNDANT
RequestPacer wait for chain call:            ~1.1s
Tradier HTTP response (chain):              ~300ms
RequestPacer wait for quote call:            ~1.1s (often cached → 0s)
Tradier HTTP response (quote):              ~300ms (often cached → 0s)
DELAY_BETWEEN_SYMBOLS_MS (to next symbol):   2.0s  ← REDUNDANT
───────────────────────────────────────────────────
Total (cold quote):                          ~8.2s
Total (cached quote):                        ~6.8s
```

### Absent symbol (no options):

```
RequestPacer wait for expirations call:     ~1.1s
Tradier HTTP response (expirations=null):   ~300ms
DELAY_BETWEEN_SYMBOLS_MS (to next symbol):   2.0s  ← REDUNDANT
───────────────────────────────────────────────────
Total:                                       ~3.4s
```

### Cycle composition (10-symbol batch):

```
~7 ready symbols × ~7.5s avg = 52.5s
~3 absent symbols × 3.4s    = 10.2s
1s inter-cycle delay         =  1.0s
───────────────────────────────────────
Estimated:                    ~63.7s sequential
```

But measured is ~34.8s because the DELAY_BETWEEN_SYMBOLS sleeps overlap with pacer queue drain (the pacer processes the next request while the worker sleeps).

---

## 3. Identification of Duplicated Delays

| Delay | Source | Purpose | Status |
|-------|--------|---------|--------|
| **RequestPacer ~1.1s/call** | `request-pacer.ts` (0.9 req/sec) | Provider rate-limit enforcement | **Necessary and sufficient** |
| **DELAY_BETWEEN_SYMBOLS_MS = 2000ms** | `acquisition-worker.ts` | "Pacing within a cycle" | **REDUNDANT** — predates the pacer |
| **DELAY_BETWEEN_SYMBOLS_MS in chain-chase** | `acquireSymbol()` | "Pace before chain call" | **REDUNDANT** — pacer handles this |
| 1000ms between cycles | `scheduleCycle()` | Scheduling gap | Acceptable |

**The `DELAY_BETWEEN_SYMBOLS_MS` contributes ~18s of wait per 10-symbol cycle (9 delays × 2s). Removing it saves ~52% of cycle time.**

---

## 4. Assessment of Safe Throughput Improvements

### Improvement A: Remove redundant inter-symbol delay

**Action:** Set `DELAY_BETWEEN_SYMBOLS_MS = 0` (or remove it entirely).
**Rationale:** The RequestPacer already enforces 0.9 req/sec. Adding 2s between symbols is double-pacing.
**Expected result:** Cycle time drops from ~35s to ~18-20s. Full bootstrap drops from ~29m to ~15-16m.
**Safety:** The pacer is the sole rate-limit authority. Unchanged. Tradier sees the same ~54 req/min regardless.

### Improvement B: Increase pacer rate to 1.0 req/sec

**Action:** Change RequestPacer from 0.9 to 1.0 req/sec.
**Rationale:** Tradier allows 60/min. At 1.0 req/sec = 60/min (exactly the limit). Leaves zero margin.
**Recommendation:** Keep at 0.9 for safety margin. Not worth the 10% gain vs risk of 429s.

### Improvement C: Reduce chain quote overhead

**Action:** Serve underlying price from already-cached quote (ResponseCache 60s TTL).
**Status:** Already implemented. Quote cache hit rate depends on whether same symbol was recently queried.
**First cold cycle:** No hits (all symbols new). Subsequent cycles: high hits for recently seen symbols.

### Improvement D: Bounded concurrency (2 concurrent upstream)

**Action:** Allow 2 parallel upstream calls through the pacer, maintaining ~30 req/min per slot.
**Rationale:** Two concurrent request streams at 0.5 req/sec each = 1.0 req/sec total ≈ 60/min.
**Risk:** More complex pacer logic. May exceed budget during bursts. NOT recommended for this slice.
**Future:** Consider if 15-minute bootstrap is unacceptable.

### Recommended immediate action: Improvement A only.

Remove `DELAY_BETWEEN_SYMBOLS_MS`. The pacer is the rate-limit authority.

---

## 5. Proposed Representative Acquisition Priority

### Current behavior

Symbols are acquired in static `yahoo.ts` array order (alphabetical: AAVM, ABFL, ACWI, AIA, AIRR...).

This means early recommendations are dominated by A-D symbols and whatever sectors they represent.

### Proposed tiered priority

| Tier | Symbols | Rationale | Count |
|------|---------|-----------|-------|
| 1 | Portfolio holdings | Operator already owns these | 2-10 |
| 2 | Existing options + pending intents | Active positions | 2-10 |
| 3 | Core high-liquidity ETFs | Most likely to produce actionable recommendations | ~30 |
| 4 | Sector-representative sample | One per major sector ensures early diversity | ~11 |
| 5 | Previously top-ranked (from prior session) | High prior probability of being useful | ~20 |
| 6 | Remaining universe | Full coverage continues | ~430 |

### Core high-liquidity ETFs (Tier 3, illustrative)

```
XLE, XLF, XLK, XLU, XLP, XLV, XLI, XLB, XLRE, XLC,  // Select Sector SPDRs
QQQ, IWM, DIA, GLD, EFA,                               // Mega liquid
SMH, XBI, ITB, COPX, URA                               // Thematic leaders
```

### Sector-representative sample (Tier 4)

One symbol from each major sector that isn't already in Tier 3:
- Technology: SMH (in T3)
- Energy: XLE (in T3)
- Financials: XLF (in T3)
- Healthcare: XBI (in T3)
- Industrials: XLI (in T3)
- Consumer: XLP (in T3)
- Materials: COPX (in T3)
- Real Estate: XLRE (in T3)
- Utilities: XLU (in T3)
- Communications: XLC (in T3)
- Emerging: EEM

Actually — the Select Sector SPDRs already provide sector representation. Tier 3 naturally covers this.

### Implementation approach

The `loadUniverse()` function returns symbols in a fixed order. Reorder them:

```
[...tier1_portfolio, ...tier2_positions, ...tier3_core, ...remaining_shuffled]
```

The remaining universe could be shuffled (deterministic daily seed) to avoid alphabetical bias across cold-starts.

---

## 6. Decision Readiness Recommendation

**Do not create a new named state.** Use the existing trust-state vocabulary:

- **Partially Current + displayed recommendations exist** = "Decision-ready for displayed set, broader universe still building"
- **Current + 95% covered** = "Full decision readiness"

The evidence-state indicator already communicates this:

```
● Partially Current · 89/496 covered · ≤ 3s · Updating
```

The operator can see: "I have recommendations. The system is still working. More may appear."

If we add the concept "displayed recommendations are all based on current evidence" (Display Trust from the semantics spec), that already answers "can I act?" without inventing a new state.

**Recommendation:** Express Decision Readiness through the existing trust indicator + coverage fraction. Do not add a separate concept.

---

## 7. Coverage-Bar Design Recommendation

### Form

A thin progress bar below the evidence-state indicator, showing visual coverage proportion:

```
● Partially Current · 89/496 covered · ≤ 3s · Updating
[████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░]  18%
```

### Behavior

| State | Bar behavior |
|-------|-------------|
| Updating, < 95% covered | Visible, actively growing |
| Current, ≥ 95% covered | Collapses or fades to minimal (optional: hidden entirely) |
| Stale/Degraded | Visible at current level, not growing |
| Unavailable | Not shown |

### Placement

Immediately below the evidence-state indicator in Band 3. Same width as the controls band. 2px height. Unobtrusive but legible.

### Represents

`Covered / Universe` where Covered = Ready + Absent.

Does NOT represent: pass count, queue depth, cycle completion, or elapsed time.

### At scale (N >> 496)

The bar still works: it shows proportion covered. At 50,000 symbols, 48,000/50,000 = 96% reads the same way. The bar doesn't depend on universe size being small.

### Accessibility

- `role="progressbar"` with `aria-valuenow` and `aria-valuemax`
- Color alone doesn't convey state (text label accompanies the bar)

---

## 8. Simplified First-Load Information Hierarchy

### Current (redundant/overlapping)

The page currently shows simultaneously:
- "Partially Current" (trust state) ← **Keep: primary**
- "89/496 covered" ← **Keep: primary**
- "≤ 3s" (freshness) ← **Keep: primary**
- "Updating" (activity) ← **Keep: primary**
- "BUILDING" (coverage badge on section title) ← **Remove: redundant with trust indicator**
- "Provisional leaders from X of Y evaluated" ← **Simplify**
- Coverage disclosure details ← **Move to expanded/diagnostics**

### Recommended primary presentation

```
Band 3:
  [Refresh]  Policy controls...    ● Partially Current · 89/496 · ≤ 3s · Updating
                                   [████████░░░░░░░░░░░░░░░░░░░░░]

Section title:
  Put Candidates — Cash-Secured    ☑ Affordable only  Show [20 ▾]

Provisional note (when < 95% covered):
  Showing best from 89 evaluated symbols · background acquisition continuing
```

**Removed from primary view:**
- "BUILDING" badge (trust indicator replaces it)
- Pass counts, cycle numbers
- Telemetry grid
- "refreshed this pass" / "deferred"

---

## 9. Visible vs Backend Coverage Lag

The 30-second polling interval explains any mismatch between backend stdout (`67 ready`) and frontend display.

**Timeline:**
```
T+0:    Backend completes cycle 10 → store shows 67 ready
T+0:    Generation advances to N
T+15:   Frontend polls → If-None-Match hits old ETag → 200 with new generation
T+15:   Frontend merges 67 ready symbols → reruns Wheelwright → renders

Maximum lag: 30 seconds (one polling interval)
```

The 495 vs 496 universe size difference (if observed) comes from the `loadUniverse()` function parsing the Yahoo source file — it may count slightly differently depending on trailing whitespace or comments.

---

## 10. Expected Time to Decision-Useful Populations

### With current delays (DELAY_BETWEEN_SYMBOLS = 2s):

| Milestone | Time |
|-----------|------|
| First recommendation | ~35s |
| 5 eligible | ~1m |
| 10 eligible | ~1m 10s |
| 20 eligible | ~2m 30s |
| Decision-useful (top 20 stable) | ~5-6m |
| 50% covered | ~14m |
| 95% covered | ~27m |
| 100% covered | ~29m |

### After removing redundant delay:

| Milestone | Time |
|-----------|------|
| First recommendation | ~20s |
| 5 eligible | ~35s |
| 10 eligible | ~45s |
| 20 eligible | ~1m 20s |
| Decision-useful (top 20 stable) | ~3m |
| 50% covered | ~8m |
| 95% covered | ~14m |
| 100% covered | ~16m |

### With priority ordering (Tier 1-3 first):

The first ~50 symbols would be high-liquidity, portfolio-relevant ETFs. These are most likely to produce actionable recommendations. Time to a representative, stable top-20 would be ~2-3 minutes instead of ~5-6 minutes.

---

## 11. Risks and Open Questions

| Risk | Mitigation |
|------|-----------|
| Removing delay causes Tradier 429s | Pacer enforces 0.9 req/sec regardless. Provider never sees more than 54 calls/min. |
| Priority ordering biases recommendations | Ranking is unchanged. Only acquisition order changes. Low-priority symbols eventually get the same evidence quality. |
| Coverage bar creates "wait for 100%" expectation | Clearly label as "covered" not "progress." Bar fades/collapses at Current. Trust indicator says "act now" regardless of bar. |
| Representative sample doesn't include the actual best opportunity | Can't know until evaluated. Mitigated by covering high-liquidity ETFs first (they most often produce recommendations). |

**Open questions:**

1. Should Tier 3 (core ETFs) be hardcoded or derived from prior session rankings?
2. Should the universe be shuffled after priority tiers to prevent alphabetical bias?
3. Should the coverage bar show Ready/Absent as different colors (green/gray)?
4. Should the Tier 5 "previously top-ranked" persist across server restarts? (Requires SQLite or file persistence — deferred.)

---

## 12. Proposed Do It Scope (Narrow)

**Authorized for immediate implementation:**

1. **Remove `DELAY_BETWEEN_SYMBOLS_MS`** from the acquisition worker (set to 0 or remove the sleep calls). The pacer is the sole rate-limit authority.

2. **Add priority ordering** to the universe loader: portfolio symbols first, then a hardcoded list of ~20-30 core high-liquidity ETFs, then remaining universe.

3. **Add coverage bar** — thin 2px bar below evidence indicator, representing Covered/Universe.

4. **Remove "BUILDING" badge** from the section title (trust indicator replaces it).

5. **Simplify provisional note** to "Showing best from X evaluated · background acquisition continuing"

**NOT in scope:**
- Bounded concurrency
- Pacer rate changes
- Shuffled universe ordering
- Decision Readiness as a new concept
- SQLite persistence for prior rankings
- Expanded evidence disclosure panel
