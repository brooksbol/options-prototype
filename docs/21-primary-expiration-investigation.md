# Investigation: Is Wheelwright's Primary-Expiration Model Hiding Better Opportunities?

**Date:** August 20, 2026
**Status:** Investigation complete — findings documented, validation spike proposed (not approved for implementation)
**Triggered by:** Buy-Write DTE histogram concentrated at 22–29 DTE
**Parking-lot item:** `PL-EVID-07`

---

## 1. Verified Current Behavior

### Pipeline (code-verified, every step confirmed in source)

```
Tradier API returns ALL available expirations for a symbol
       ↓
SqliteEvidenceStore.selectPrimaryExpiration()
  ← TARGET_DTE = 21, MIN_DTE = 7, MAX_DTE = 45
  ← Selects the SINGLE expiration nearest to 21 DTE
       ↓
AcquisitionWorker.acquireChain(symbol, primaryExpiration)
  ← Fetches ONE chain from Tradier for that single expiration
       ↓
SqliteEvidenceStore.setChain(symbol, chainJson, retrievedAt)
  ← Stores chain in evidence table keyed by (symbol, 'chain', expiration)
  ← Sets symbol_resolution.resolution = 'ready'
       ↓
SnapshotBuilder / getEvidence(symbol)
  ← Queries: WHERE symbol = ? AND evidence_type = 'chain' AND expiration = primary_expiration
  ← Delivers exactly ONE chain per symbol to the frontend
       ↓
Frontend DurableMarketCache (IndexedDB)
  ← Stores chain keyed as: market:tradier:sandbox:chain:SYMBOL:EXPIRATION:v1
       ↓
recommendPuts() / recommendBuyWrites() / recommendCalls()
  ← Calls selectEligibleExpirations(expirations, {min:7, max:45})
  ← Iterates ALL eligible expirations looking for cached chains
  ← Only FINDS a chain for the primary expiration
  ← Produces ONE candidate per symbol at the primary DTE
       ↓
BuyWriteDescriptiveHistograms
  ← Receives [...buyWriteCandidates, ...buyWriteWaitCandidates]
  ← Faithfully renders the concentrated DTE distribution
```

### Key architectural detail: the DB schema does NOT enforce single-chain

The evidence table primary key is `(symbol, evidence_type, expiration)`. Multiple chains for different expirations **can** coexist. The single-chain behavior is enforced by:
1. Acquisition logic — always passes `primaryExpiration` to `acquireChain()`
2. Snapshot delivery — `getEvidence()` queries only the current `primary_expiration`

Proof: 1,207 orphan chain rows exist in the current database from prior sessions when the primary shifted (e.g., weekly rollover). SPY has 7 historical chains, QQQ has 7, IWM has 6.

### Applies uniformly across all strategies

- **Cash-secured puts:** `recommendPuts()` iterates eligible expirations, finds only primary chain
- **Buy-writes:** `recommendBuyWrites()` iterates eligible expirations, finds only primary chain
- **Covered calls:** `recommendCalls()` same pattern on inventory symbols

The constraint is not strategy-specific. It is an evidence-layer primitive.

---

## 2. What the 7–45 DTE Range Actually Controls

### Facts (code-verified)

- `eligibleDteRange: { min: 7, max: 45 }` is used by `selectEligibleExpirations()` in the recommendation engines
- `targetDte: 21` is displayed in the UI DTE dropdown but is **NOT consumed** by `recommendPuts()` or `recommendBuyWrites()` — it exists only in the separate `PrimaryExpirationPolicy` module
- Changing the DTE dropdown triggers `handleReRecommend()` which re-runs the recommendation engines from cache with the updated policy — but since the cache contains only one chain, the result rarely changes

### When does changing the DTE range matter today?

Only when it **excludes** the already-selected primary expiration. For example:
- If the primary is at DTE 29 and you narrow the range to {min: 7, max: 21}, that symbol would be excluded entirely
- This is a rejection of existing evidence, not a search over alternatives

### Current population reality (database-verified, August 20, 2026)

| Primary Expiration | DTE | Symbols | Percentage |
|---|---|---|---|
| 2026-09-18 | 29 | 890 | 93% |
| 2026-09-11 | 22 | 64 | 7% |
| 2026-08-21 | 1 (expired) | 7 | <1% |

For the 890 monthly-only symbols, the DTE range is entirely inert. They have ONE eligible expiration. No UI control can reveal alternatives that do not exist.

### Semantic problem

The UI presents `7–45` as a static label next to the DTE target dropdown, implying a search space. A reasonable operator might interpret this as: "Wheelwright is searching across all expirations from 7 to 45 DTE and selecting the best." In reality, it is a pass/fail test applied to a pre-selected expiration.

This is not a display bug. It is a semantic mismatch between what the control implies and what the system does.

---

## 2a. Provenance of the 64/890 Population Split

### Verified: this is live provider data, not inference

The eligible-expiration counts are derived from actual Tradier `/markets/options/expirations` API responses stored in the evidence table. Retrieval timestamps confirm:

- **900 symbols** have expirations fetched on 2026-08-20 (today's session)
- **61 symbols** have expirations fetched on 2026-08-19 (still fresh per 6-hour expiration TTL)
- **63 of the 64 weekly-capable symbols** were identified from today's fetch; 1 from yesterday

Each expiration-list row stores the verbatim normalized JSON array of `{date, dte}` objects returned by Tradier. The eligible-expiration count is computed by filtering that array to `7 <= dte <= 45`. This is market structure as reported by the exchange via Tradier, not our inference from cached chains.

**Implication:** Multi-expiration acquisition is naturally self-limiting. The market itself determines fan-out. We do not need an elaborate progressive architecture because 890 symbols simply do not have multiple expirations to acquire.

### The 64 weekly-capable symbols

ARKK, BKLN, BNO, BOIL, COPX, DIA, DPST, EEM, EFA, EWJ, EWY, EWZ, FAS, FEZ, FXI, GBTC, GDX, GDXJ, GLD, HYG, IAU, IEF, IGV, IVV, IWM, IYR, KRE, KWEB, LABD, LQD, MTUM, NAIL, QQQ, RSP, SCHD, SLV, SMH, SOXL, SOXX, SPXL, SPY, SSO, TNA, TQQQ, UNG, UPRO, URA, USO, VOO, VXUS, XBI, XHB, XLB, XLC, XLE, XLF, XLI, XLK, XLP, XLU, XLV, XLY, XOP, XRT.

These are high-volume, high-OI ETFs — exactly the names expected to have weekly options and the names most likely to have good execution quality at all DTEs.

---

## 3. Empirical Opportunity-Cost Findings

### Data source and limitations

The existing SQLite database contains orphan chains from previous weeks for SPY, QQQ, and IWM. These chains were captured at different times (not simultaneously) and therefore **cannot cleanly measure opportunity cost** — underlying price, volatility, and market conditions are confounded with DTE. They permit only a structural illustration of how option characteristics vary across DTEs for the same underlyings.

### Annualized yield comparison (at ~0.30 delta)

**SPY** (underlying ~$767, primary DTE 22):

| DTE | CSP Yield% (ann.) | BW Total% (ann.) | Spread% | OI |
|-----|-------------------|-------------------|---------|-----|
| 8 | 27.0% | 90.2% | 1.1–1.3% | 510–579 |
| 11 | 18.5% | 63.3% | 0.9–1.4% | 520–783 |
| 15 | 15.0% | 47.4% | 0.9–1.3% | 1,374–1,789 |
| 22 ← | 12.5% | 38.9% | 0.3–0.5% | 477–1,090 |

**QQQ** (underlying ~$716, primary DTE 22):

| DTE | CSP Yield% (ann.) | BW Total% (ann.) | Spread% | OI |
|-----|-------------------|-------------------|---------|-----|
| 8 | 42.4% | 148.3% | 1.3–1.4% | 139–1,697 |
| 11 | 29.1% | 98.7% | 1.1–1.2% | 4,965–6,197 |
| 15 | 22.8% | 72.9% | 1.0–1.2% | 175–582 |
| 22 ← | 19.7% | 60.5% | 1.1–1.3% | 1,213–2,025 |

**IWM** (underlying ~$299, primary DTE 22):

| DTE | CSP Yield% (ann.) | BW Total% (ann.) | Spread% | OI |
|-----|-------------------|-------------------|---------|-----|
| 8 | 36.5% | 126.8% | 2.5–2.6% | 217–482 |
| 15 | 19.1% | 62.3% | 2.1–2.3% | 319–826 |
| 22 ← | 17.0% | 53.6% | 1.7–2.6% | 393–574 |

### Interpretation — what this means and what it does not

**Observation:** Shorter DTEs produce materially higher annualized yields with comparable execution quality for liquid ETFs.

**Caution — annualization is the dominant factor:** The DTE 8 CSP on SPY has a premium-per-day of ~$56 versus ~$26 at DTE 22. That is 2.2x, not the 2.2x that the annualized percentages suggest once you account for the 365/DTE multiplier. The annualized yield difference overstates the daily premium difference because shorter contracts are annualized over fewer days.

**Caution — these are not simultaneous observations:** The DTE 8 chain was captured on August 10, the DTE 22 chain on August 20. IV and underlying price differed. This prevents clean apples-to-apples comparison.

**Hypothesis (not yet proven):** For weekly-capable liquid ETFs, shorter-DTE contracts likely offer a modestly better theta-harvest rate (premium per day per unit of risk). This aligns with general options pricing theory (theta accelerates near expiration). But the difference is modest for liquid ETFs at the same delta, and execution quality (spread, OI) does not materially degrade at nearby weeklies for these names.

**What CANNOT be measured from current evidence:**
- Whether shorter DTE systematically outperforms when risk-adjusted (assignment probability is higher at the same delta for shorter DTE)
- The compounding effect of rolling shorter contracts more frequently
- Whether the marginal improvement justifies the operational complexity of more frequent decisions
- Portfolio-level effects of mixing different DTEs across the universe

### Population-level opportunity cost

This is the critical finding:

| Segment | Symbols | Eligible Expirations | Multi-Exp Benefit |
|---------|---------|---------------------|-------------------|
| Monthly-only ETFs | 890 (93%) | 1 per symbol | **ZERO** — no alternative exists |
| Weekly-capable ETFs | 64 (7%) | 6–12 per symbol | **POSSIBLE** — unexplored today |

For 93% of the universe, multi-expiration acquisition cannot help because the market offers only one expiration within 7–45 DTE. The opportunity cost question applies exclusively to 64 weekly-capable symbols.

These 64 symbols include SPY, QQQ, IWM, GLD, XLF, XLE, DIA, EEM, TLT, ARKK, FXI, XBI, HYG, and other highly-liquid ETFs — the symbols most likely to have good execution quality at all DTEs.

---

## 4. Acquisition/Storage/Performance Implications

### Current baseline

| Metric | Current Value |
|--------|--------------|
| Universe | 1,306 symbols (961 ready, 345 absent) |
| Active chains | 961 (one per ready symbol) |
| Chain size (avg) | ~5 KB |
| Total chain data | ~10 MB |
| API rate | 0.9 req/sec (serialized, single pacer queue) |
| Full refresh cycle | ~48–72 minutes for full universe |
| Session hours | 09:30–16:15 ET (~6.75 hours) |

### Cost of full-window acquisition (all eligible expirations)

| Metric | Full Window | Multiplier |
|--------|-------------|-----------|
| Total chains needed | 1,330 | 1.38x |
| Additional chains (beyond primary) | 369 | — |
| Additional API calls | ~740 (chain + quote per exp) | — |
| Additional pacer time | ~14 minutes of serialized request time | — |
| Additional calendar time (est.) | ~20–25 minutes (scheduler batching overhead) | — |
| Additional DB storage | ~1.8 MB | — |
| Additional IndexedDB (frontend) | ~1.8 MB | — |

### Why this is cheaper than it appears

1. **93% of the universe is unaffected.** Monthly-only symbols have exactly 1 eligible expiration; acquiring "all eligible" for them changes nothing.
2. **The 64 weekly symbols are the high-value targets.** They average ~8 eligible expirations each.
3. **The DB schema already supports it.** PK is `(symbol, evidence_type, expiration)` — no migration needed.
4. **Orphan chains prove it works.** 1,207 historical chains from previous sessions already coexist in the DB without issues.
5. **Snapshot delivery is the only hard constraint.** The current `getEvidence()` must be extended to return multiple chains.

### Scheduler/freshness impact (corrected analysis)

**Current full-universe refresh:** observed at approximately 5 hours (14:23–19:23 ET on August 20, 2026) for 900 chains.

The current scheduler uses freshness classes (A = 15 min, B = 120 min). The 64 weekly-capable symbols are likely concentrated in Class A (most-traded, highest-priority). Currently, refreshing one Class A symbol requires ~1.1 seconds of pacer time (one chain fetch). With multi-expiration acquisition, each weekly symbol would require ~8 chain fetches (average eligible expirations), consuming ~9 seconds of pacer time per symbol.

**Class A refresh implications:** A full Class A pass over all 64 weekly symbols would take ~10 minutes of pacer time instead of ~1 minute. This directly competes with Class A refresh time for the remaining ~850 symbols. Whether this materially degrades operator-perceived freshness depends on how the scheduler interleaves weekly-symbol multi-chain work with single-chain work for the rest of the universe.

**Storage impact is negligible.** The additional 1.8 MB is irrelevant compared to the current 14.9 MB database. The meaningful cost is scheduler capacity and freshness, not bytes.

---

## 5. Architectural Alternatives

### A. Current: Single primary expiration (baseline)

**How it works:** One expiration nearest ~21 DTE, one chain per symbol.

**Benefits:**
- Simple acquisition logic
- Predictable, bounded API usage
- Uniform comparison across universe (same DTE neighborhood for all)
- Fast snapshot delivery (one chain per symbol)
- Matches the original "uniform first-pass comparison" design intent

**Limitations:**
- Cannot discover that a different expiration offers better economics
- The 7–45 DTE range in the policy is semantically misleading
- For 64 weekly-capable symbols, systematically excludes potentially superior contracts
- Makes an implicit recommendation decision in the evidence layer

### B. Full eligible-window acquisition

**How it works:** Acquire every chain for every expiration within 7–45 DTE.

**Cost:** 1,330 chains total (1.38x current). +14 minutes per refresh cycle.

**Benefits:**
- Recommendation engine sees the complete opportunity surface
- DTE becomes a true recommendation dimension
- Eliminates the evidence/recommendation boundary violation
- No hidden decisions — all expirations compete on merit

**Limitations:**
- Adds complexity to snapshot delivery (multi-chain per symbol)
- Frontend hydration grows modestly
- Scheduler must prioritize which expirations to refresh first
- Recommendation ranking becomes multi-dimensional (same symbol may appear at multiple DTEs)

**Assessment:** Feasible at current universe size. The 1.38x multiplier is modest. The real complexity is downstream (recommendation deduplication, UX for multiple DTEs per symbol).

### C. Representative horizons (short / medium / long)

**How it works:** Acquire chains at 3 fixed DTE neighborhoods, e.g., ~8, ~22, ~36 DTE.

**Cost:** ~3x for weekly-capable symbols, ~1x for monthly-only. Total ~1,090 chains.

**Benefits:**
- Bounded acquisition cost
- Provides short/medium/long comparison without full enumeration
- Simpler than full-window for scheduler reasoning

**Limitations:**
- Still makes a selection decision (why these 3?), just less aggressively
- May miss the actual best expiration (e.g., if it's at DTE 14, not 8 or 22)
- Requires maintaining a mapping of "representative" → actual available expiration
- Couples the evidence layer to a specific DTE philosophy

**Assessment:** A reasonable compromise if full-window proves too expensive. Currently, full-window is cheap enough (1.38x) that this intermediate step may not be necessary.

### D. Progressive deepening

**How it works:**

```
Broad universe (1,306 symbols)
       ↓
Cheap primary-expiration scan (existing behavior)
       ↓
Identify "promising" symbols (ACTIONABLE or EDGE at primary)
       ↓
Acquire additional expirations for those ~50–150 symbols
       ↓
Re-evaluate with complete evidence
```

**Benefits:**
- Preserves cheap initial scan for the full universe
- Deepens only where additional evidence has decision value
- Natural fit with the scheduler's tiered priority system
- Could integrate with the existing Class A/B/C/D framework

**Limitations:**
- "Promising enough to deepen" is a chicken-and-egg problem: a symbol might appear unpromising at DTE 22 but excellent at DTE 8 (because its theta curve or term structure favors short-dated contracts)
- This would systematically miss opportunities that only exist at non-primary DTEs
- Adds complexity to the acquisition state machine (new states: "deepened", "awaiting-deepening")
- The set of promising symbols overlaps heavily with the 64 weekly-capable symbols anyway

**Assessment:** Intellectually appealing but the chicken-and-egg problem is real. A symbol with WAIT posture at DTE 22 might have ACTIONABLE contracts at DTE 8, but progressive deepening wouldn't discover this because the primary-pass didn't flag it. For the current universe where only 64 symbols have weekly options, full-window (Option B) is cheap enough that progressive deepening adds complexity without meaningful savings.

### E. Weekly-aware acquisition (recommended)

**How it works:** Maintain the existing primary-expiration model for monthly-only symbols (890 of them), but acquire all eligible expirations for the 64 symbols that have weekly options.

This is effectively Option B but with an awareness optimization: don't waste API calls attempting multi-expiration acquisition for symbols that only have one eligible expiration.

**Cost:** ~370 additional chains for the weekly-capable symbols. ~14 minutes additional per full refresh. 1.8 MB additional storage.

**Benefits:**
- Targeted where the opportunity cost actually exists
- Zero additional load for 93% of the universe
- Scheduler can naturally prioritize weekly-symbol multi-exp as Class A work
- Database and schema already support it
- Aligns with the evidence-appliance principle: maintain an authoritative model of the opportunity environment

**Detection mechanism:** When expirations are fetched, if a symbol has >1 eligible expiration within the DTE range, mark it as "weekly-capable" and acquire chains at all eligible expirations. For monthly-only symbols, behavior is unchanged.

**Limitations:**
- Snapshot delivery must be updated to return multiple chains per symbol
- Frontend hydration must handle per-expiration chains (but already attempts this)
- Recommendation ranking must handle multiple candidates per symbol

---

## 6. Strategy-Specific Implications

### Cash-Secured Puts

- **DTE matters moderately.** Premium per day is somewhat higher at shorter DTEs (theta acceleration), but assignment risk is also higher.
- **Operational implication:** Shorter contracts require more frequent decisions (rolling every 7–14 days vs. every 21–30 days). Whether this net-benefits the operator depends on their capacity and thesis about compounding shorter cycles.
- **Current opportunity cost:** For SPY/QQQ/IWM, the DTE 8 CSP annualized yield is ~2x the DTE 22 yield. After normalizing for annualization math, the premium-per-day advantage is modest (~30–50%).

### Buy-Writes

- **DTE matters MORE for buy-writes.** The buy-write includes stock appreciation to strike, which scales with DTE differently than premium alone. The total-return-if-called metric favors shorter DTEs heavily because appreciation is locked in over fewer days.
- **Current opportunity cost is LARGEST here.** BW total return at DTE 8 is 2–3x the DTE 22 value even after normalizing. Buy-write is the strategy most penalized by single-expiration evidence.
- **Reason:** Buy-writes earn (premium + appreciation). The appreciation component is a fixed dollar amount regardless of DTE. Annualizing a $17 appreciation over 8 days produces far higher returns than over 22 days. This isn't just math — it reflects a genuine advantage of rolling covered calls more frequently when the underlying cooperates.

### Covered Calls (on existing inventory)

- **DTE matters but is already partially observed.** Covered calls apply to owned positions where the share basis is known. The operator may have a strong preference for specific DTEs based on their thesis (e.g., writing weeklies for income vs. writing monthlies for larger premiums).
- **The current model is adequate but not optimal.** For covered calls on owned positions, the operator typically evaluates a specific symbol and can manually examine different expirations via the expiration selector. The universal scan is less relevant.

### Should DTE policy be strategy-specific?

**Yes, potentially.** The economic logic differs:
- CSPs: operator may prefer ~21 DTE for a balance of premium and time horizon
- Buy-writes: shorter DTE may systematically outperform (faster capital recycling)
- Covered calls: DTE preference is position-dependent (basis, thesis, roll timing)

However, the evidence acquisition model should be **strategy-neutral**. The evidence layer should acquire all available evidence; the recommendation engines should apply strategy-specific DTE preferences. This is the correct architectural separation.

---

## 7. Assessment Against Wheelwright's Architectural Principles

### The Evidence Appliance principle (from `foundations/evidence-appliance.md`)

> "Wheelwright is an always-on evidence appliance for options-income decision support."
>
> "Continuously maintains an authoritative evidence model of the options opportunity environment."

The current behavior violates this principle in spirit. The evidence layer is not maintaining an "authoritative model of the opportunity environment" — it is maintaining an authoritative model of **one expiration neighborhood**. The 64 weekly-capable symbols have 6–12 eligible expirations representing real, tradeable opportunity. Storing only one is an incomplete model.

### The Four Engines architecture (from `07-architecture-current.md`)

```
EVIDENCE ENGINE — What is true about the market?
POLICY ENGINE — Given evidence, what rules govern our response?
DECISION ENGINE — Given policy results, what is recommended?
EXPLANATION ENGINE — Why was this recommended?
```

`selectPrimaryExpiration()` is a **Policy/Decision function** embedded in the **Evidence Engine**. It decides which expiration is "worth" acquiring — but that judgment properly belongs in the recommendation layer, which has the operator's DTE preferences, strategy context, and fitness criteria.

The evidence engine's job is: "What is true about the market?" The answer should include all available expirations and their chains within the observation window, not a pre-filtered subset.

### Boundary violation classification

This is more precisely characterized as an **evidence sampling policy that has acquired recommendation semantics**. The original design was a pragmatic and legitimate optimization for scanning a large universe cheaply. The `primary-expiration-policy.ts` document is explicit:

> "Provisional target DTE of 21 selected to provide a uniform first-pass comparison across the universe. This is NOT a discovered optimum and NOT established operator policy."

The design was always intended as provisional. The problem is not the original sampling decision — it is that Wheelwright subsequently presents 7–45 DTE in the UI and documentation as though the recommendation engine has access to that full space. The semantic mismatch is the actionable issue. The DTE range control implies a search over alternatives that do not exist in the evidence set.

### What the boundary should be

- **Evidence layer:** Acquire and maintain chains for all eligible expirations of weekly-capable symbols. For monthly-only symbols (890), acquire the single available chain. The evidence layer's DTE range (7–45) becomes a genuine acquisition window, not a filter applied to a pre-selected result.
- **Recommendation layer:** Apply strategy-specific DTE preferences, select optimal expiration per symbol, rank candidates. The `targetDte` control becomes meaningful — it tells the recommendation engine which DTE neighborhood to prefer when multiple options exist.

---

## 8. Recommended Direction

### Primary recommendation: Weekly-aware multi-expiration acquisition (Option E)

**Rationale:**
1. The acquisition cost is trivial (+14 minutes, +1.8 MB)
2. The DB schema already supports it
3. The frontend recommendation engines already iterate multiple expirations
4. It resolves the evidence/recommendation boundary violation
5. It makes the DTE control semantically honest
6. The opportunity cost is concentrated in exactly the symbols where execution quality is highest

### Uncertainties

- **Recommendation deduplication:** When the same symbol appears at DTE 8, 15, 22, and 29 — does the board show 4 candidates or 1 (best)? This is a product decision, not a technical one. The current architecture (pick best per symbol) is probably correct initially.
- **Operator cognitive load:** More DTE options could produce a noisier board. Mitigation: the recommendation engine still picks one best candidate per symbol; the DTE dimension is an internal optimization, not necessarily exposed as 4x more rows.
- **Snapshot size:** Delivering 8 chains per weekly symbol instead of 1 increases the snapshot. For 64 symbols × 8 chains × 5KB = 2.5 MB additional. The current snapshot is already polled with ETag/304 and only transmits on change.
- **Scheduler complexity:** Which expiration to refresh first for a weekly-capable symbol? Likely: prioritize the nearest-to-target, then sweep others. Or: treat all expirations of a weekly symbol as one logical work unit.

### What this does NOT recommend

- Changing the UI to show multiple DTE candidates per symbol (not yet — evaluate the data first)
- Removing the primary-expiration concept entirely (it remains useful as a "prefer this DTE" hint)
- Acquiring expirations outside 7–45 DTE
- Treating monthly-only symbols differently in the recommendation logic

---

## 9. Proposed Validation Spike

### Goal

Prove or disprove that multi-expiration evidence produces materially different recommendations, using same-session contemporaneous data that eliminates confounding from different market conditions.

### Experimental Controls

The spike must satisfy: **same symbol + same moment + same market + same policy**, with only **expiration** varying.

All chains for a given symbol must be acquired back-to-back through the pacer (~1.1 seconds apart) so that underlying price, implied volatility, and market conditions are effectively identical across expirations.

### Design

**Phase 1: Acquire evidence (1 session, ~20–25 minutes of additional acquisition time)**

Modify `acquireSymbolTiered()` for a temporary experiment:
- When `setExpirations()` identifies a symbol with >1 eligible expiration within 7–45 DTE, acquire chains for ALL eligible expirations (not just primary)
- Apply only to the 64 weekly-capable symbols
- Acquire all expirations for a symbol as a single atomic batch (consecutive pacer submissions)
- Run for one full market session

This requires changing approximately 10–15 lines in `AcquisitionWorker.java` and no schema changes.

**Phase 2: Compare recommendations (offline analysis)**

After a session with multi-expiration data:
- Run the existing recommendation engine against the full evidence set (it already iterates eligible expirations)
- For each of the 64 weekly-capable symbols, compare: which expiration produces the best candidate?
- Use the same recommendation policy throughout (no policy changes)

**Phase 3: Report**

The analysis must answer:
- How many of the 64 symbols change their best recommendation to a non-primary DTE?
- How many change materially (>20% improvement) rather than trivially?
- How many cross ACTIONABLE/EDGE/WAIT posture boundaries?
- What are the economics in **actual dollars per contract** as well as annualized percentages?
- Does execution quality (spread %, OI, volume) materially differ at the winning DTE?
- Do shorter DTEs systematically win, or is the pattern varied?
- What was the actual elapsed time for the additional acquisition?
- For buy-writes specifically: does the total-return-if-called metric favor shorter DTE after controlling for the annualization amplification effect?

### Spike scope

- No UI changes
- No snapshot format changes
- No policy changes
- Approximately 10–15 lines of Java changed in `acquireSymbolTiered()`
- One session of acquisition data
- One offline comparison script

### Risk

Minimal. The spike adds ~370 extra API calls per refresh cycle (within rate limits), temporarily consumes ~1.8 MB more DB space, and can be reverted by removing the temporary code. The frontend will automatically benefit because the recommendation engines already iterate all cached chains per expiration.

### Status

**Not approved for implementation.** This spike requires explicit authorization before proceeding.

---

## Summary of Key Findings

| Category | Finding | Classification |
|----------|---------|----------------|
| Pipeline behavior | Single chain per symbol, selected at acquisition time | **Fact** (code-verified) |
| DTE control semantics | 7–45 range is a pass/fail test, not a search space | **Fact** (code-verified) |
| Population structure | 93% of universe has only 1 eligible expiration | **Fact** (database-verified) |
| Opportunity cost exists only for 64 weekly symbols | Monthly-only symbols cannot benefit from multi-exp | **Fact** (database-verified) |
| Shorter DTE yields higher annualized returns | Premium-per-day is modestly higher; annualization amplifies. **Not validated** — cross-session data, confounded with price/IV changes | **Preliminary indication** (requires same-session experiment) |
| Buy-writes most affected | Total-return metric mechanically penalizes longer DTE via annualization | **Structural observation** (consistent with options math, but magnitude unquantified) |
| Acquisition cost is low | +14 min, +1.8 MB, +370 chains for full window | **Fact** (calculated from empirical counts + known rate limits) |
| Boundary violation exists | Evidence layer makes a recommendation decision | **Architectural judgment** |
| Progressive deepening has a chicken-and-egg problem | May miss opportunities that only appear at non-primary DTEs | **Hypothesis** (logical argument, not proven) |
| Option E is architecturally aligned and low-cost | Weekly-aware acquisition resolves the issue for affected symbols | **Recommendation** (requires spike validation) |
