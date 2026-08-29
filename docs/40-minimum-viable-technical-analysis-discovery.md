# Minimum Viable Technical Analysis — Deployment-Quality Evidence Discovery

**Date:** August 29, 2026  
**Status:** Discovery / experimental hypothesis. This record preserves the complete MVPTA discussion and reconciles it with existing Wheelwright architecture. It is not implementation authorization and does not make any technical observation a Decision policy input.

**Related:** `PL-EVID-01`, `PL-DEPLOY`, `PL-EVID-04`, `PL-DEPLOY-02`, `PL-COHERE-01`, `docs/39-credit-spreads-deployment-behavioral-discipline-discovery.md`, `docs/39-constraint-identification-restart-plan.md`, Policy over Prediction, Market-Priced Risk, Evidence over Assumption.

---

## 1. Question and governing posture

The motivating question was: what is the minimum viable technical analysis required to improve Wheelwright deployment quality?

The governing answer is deliberately narrower than conventional technical analysis:

> **Use a very small set of observable market-behavior measurements as context for determining what the market is asking Wheelwright to accept in exchange for premium — not as trading signals or predictions.**

MVPTA should move Wheelwright from merely saying "premium looks good" toward:

> **"Premium looks good relative to the observable behavior we are being paid to tolerate."**

This is compatible with Policy over Prediction. The objective is not to forecast that support will hold, that price will rise, or that a chart pattern will resolve. The objective is to make present and historical market behavior legible enough to compare compensation with accepted capital consequence.

This discussion extends the support/resistance and volatility-movement hypotheses already recorded in `docs/39-credit-spreads-deployment-behavioral-discipline-discovery.md`.

---

## 2. Candidate minimum evidence set

### 2.1 Volatility state and direction

Current IV alone may be insufficient. A short temporal history can distinguish, for example, IV that is high and still accelerating from IV that is high but falling.

The working hypothesis is that **high volatility that is falling** may sometimes represent rich compensation during normalization rather than rich compensation during intensifying stress.

This remains an empirical hypothesis, not policy.

Candidate observations include:

- current IV;
- recent IV trajectory/change;
- eventually IV rank/percentile or regime context if sufficient history exists.

### 2.2 Distance from recent price structure

Do not begin with elaborate support/resistance algorithms. Start with factual geometry:

- recent swing high/low if a stable definition is later justified;
- 20-day or other explicitly-defined recent high/low;
- percentage distance from recent extrema;
- strike distance from spot;
- strike distance expressed in ATR units.

Example explanation:

> Strike is 6% below spot, 1.4 ATR below spot, and below the recent 20-day low.

This describes observed geometry. It does not assert that the low is "support" or that it will hold.

### 2.3 Realized movement / ATR

ATR or a similarly simple realized-range measure gives context that delta alone does not: how far the obligation is from spot relative to ordinary recent movement for that instrument.

Cross-symbol use should favor normalized forms such as ATR/spot or strike distance in ATR units rather than raw dollar ATR.

### 2.4 Trend / persistence, minimally

If trend contributes incremental information, keep it deliberately simple: a slope, persistence measure, or price-versus-moving-reference relationship sufficient to describe whether price has persistently moved toward or away from the obligation.

Do not initially introduce MACD, RSI, stochastic oscillators, Bollinger Bands, Ichimoku, candlestick names, chart-pattern taxonomies, or "oversold therefore buy" rules.

### 2.5 Gap / discontinuity behavior

Average movement can conceal occasional large discontinuities. Gap magnitude/frequency may eventually be a useful complementary measure of movement character.

A compact candidate description of movement character is:

> **range → trend/persistence → gaps → volatility level → volatility direction**

Again, these are observations, not signals.

---

## 3. Illustrative discrimination hypothesis

Two otherwise comparable put opportunities might have the same approximate delta, DTE, premium, and execution quality but materially different observable behavior.

Example:

**Candidate A**
- IV high but falling;
- strike 2.1 ATR from spot;
- strike below recent low;
- recent price behavior comparatively stable.

**Candidate B**
- IV high and rising rapidly;
- strike 1.2 ATR from spot;
- strike above recent low;
- price persistently moving toward the strike.

If B offers 1.9% while A offers 1.8%, premium alone may rank B first. MVPTA asks whether the additional observable context demonstrates that the two opportunities are not economically comparable enough for that tiny premium difference to dominate.

This is an empirical question, not an assertion that A is better.

---

## 4. Minimum provider/data expansion

Most candidate MVPTA measurements can be produced from data Wheelwright already has access to through Tradier plus evidence it already acquires.

### Primitive A — historical daily OHLCV

This is the principal new provider evidence primitive identified by the discussion.

From one reusable daily OHLCV series Wheelwright can derive locally:

- ATR / realized range;
- recent highs/lows;
- percentage and ATR-normalized distance from recent territory;
- realized volatility;
- gaps;
- moving references or simple slopes/persistence;
- drawdowns and other later experimental measurements without additional provider calls.

Do not acquire each technical indicator separately from a provider.

### Primitive B — existing option-chain evidence

Production chains already naturally contain the evidence needed for current strike geometry, delta, and IV. MVPTA should reuse that acquisition rather than request another chain for technical analysis.

IV history can be manufactured prospectively by remembering selected IV observations Wheelwright already acquires.

### Primitive C — existing spot observations

Existing spot observations can support contemporaneous distance calculations and, eventually, finer-grained movement/persistence analysis.

The acquisition principle is:

> **Acquire primitive evidence once at the frequency at which the primitive actually changes, persist it according to honest observation identity, and fan it out to derived consumers.**

A separate technical-analysis provider is not presently justified.

---

## 5. Tradier traffic and the August 28/Tuesday constraint campaign

MVPTA must not alter or prejudge the active Constraint Identification Restart Plan in `docs/39-constraint-identification-restart-plan.md`.

That plan's leading hypothesis is that Tradier is materially underutilized while eligible Wheelwright WIP waits, but Herbie has not been identified. Existing indirect evidence suggested approximately 74.7 provider dispatches/minute against an intended safe Production pace of approximately 96/minute while WIP aged and Decision coverage degraded. The Tuesday campaign exists to directly measure the factory before optimizing it.

Therefore:

- do not add MVPTA workload to Tuesday's measurement campaign;
- do not assume spare Tradier capacity exists merely because indirect arithmetic suggests it;
- do not introduce concurrency, pruning, TTL changes, or scheduler changes for MVPTA before the constraint investigation warrants solution work;
- after the constraint is identified, subordinate MVPTA acquisition to the resulting flow policy.

Historical OHLCV has unusually forgiving freshness semantics. A completed daily bar generally needs one successful maintenance acquisition per maintained symbol per completed trading day, not minute-scale renewal. It can yield to Decision-critical current evidence during pressure.

For a universe of roughly 1,300 symbols, an initial bootstrap is on the order of one history request per symbol if the provider returns the desired range in one response. Ongoing maintenance is roughly 1,300 daily-bar updates per trading day. Most other MVPTA measurements should add little or no provider traffic because they are locally derived from OHLCV or extracted from existing spot/chain acquisition.

Working constraint:

> **MVPTA may consume evidence-acquisition capacity only under the temporal/priority contract established by the post-investigation architecture; it must not silently steal freshness from higher-value current evidence.**

---

## 6. Database load, retention, and SQLite

MVPTA does not presently justify abandoning SQLite.

For approximately 1,300 symbols and five years of daily bars (~1,260 trading days), the bootstrap is roughly 1.6 million OHLCV rows. A compact SQLite representation with indexes is plausibly a few hundred MB; even substantially more history remains well below a database-size boundary that by itself requires a server database.

Ongoing OHLCV growth is only about 1,300 rows per trading day, roughly 300k–330k rows/year.

IV retention requires more discipline. Persisting every contract's Greeks/IV on every chain acquisition indefinitely could create millions of rows per day and multi-GB/month growth. MVPTA does not require that. Prefer selected durable volatility observations or summaries sufficient to reconstruct the intended temporal feature.

Derived indicators are cheap. A current feature row per symbol is only ~1,300 rows; even one daily feature snapshot per symbol is modest. Prefer reproducible derivation from primitives over indiscriminate materialization.

The primary SQLite risks are not MVPTA database size but:

- write amplification;
- concurrent writers;
- long analytical queries competing with operational writes;
- excessive/duplicative indexes;
- unbounded retention of high-frequency option-surface data.

A future migration from SQLite should be evidence-driven by actual operating requirements such as multiple concurrent application instances/writers, substantial parallel analytics, replication/high availability, or measured SQLite contention — not by MVPTA's projected storage volume.

---

## 7. Observation identity — explicit lesson from `spot_history`

MVPTA must not repeat the existing `spot_history` amplification defect documented in `docs/37-console-sparkline-temporal-evidence-finding.md`.

Today one underlying spot observation can be persisted once per eligible expiration because persistence is coupled to chain acquisition topology. A weekly-capable symbol may therefore produce 6–11 nearly identical rows during one acquisition burst even though economically only one observation moment occurred.

For MVPTA:

> **One economic observation should become one durable observation regardless of how many downstream option surfaces happened to expose it.**

Observation identity should be resolved according to the thing observed, not the acquisition path that happened to carry it.

This is particularly important for IV history: the system must explicitly define whether the observed object is a contract IV, expiration-level surface summary, underlying-level volatility summary, or another policy-neutral primitive. Do not let the chain topology define that identity accidentally.

---

## 8. Research-first posture

Do not immediately make MVPTA a recommendation policy.

The preferred sequence is:

1. acquire/persist the primitive evidence;
2. derive candidate measurements locally;
3. reconstruct them point-in-time against historical or prospectively observed Deployment opportunities;
4. ask whether they discriminate better from worse Wheelwright deployments under Wheelwright's own objectives;
5. test marginal information value and redundancy;
6. only then consider explicit Decision policy/fitness integration.

This allows Wheelwright to determine whether conventional technical measurements contain useful information for its actual strategy, universe, DTE, and capital-consequence model rather than importing textbook claims.

`PL-DEPLOY-02` / opportunity-surface observation is a natural experimental companion because it can preserve contemporaneous candidate state without immediately changing recommendations.

---

## 9. Point-in-time correctness and look-ahead prevention

Historical evaluation must use only evidence available at the original decision timestamp.

If a deployment made on date/time T is evaluated using a later completed bar, revised corporate-action adjustment, later IV observation, future extrema, or any feature whose calculation window contains information after T, the research contains look-ahead leakage.

Every experimental feature therefore needs sufficient provenance to answer:

- what primitive observations existed at T?
- which feature definition/version was used?
- what observation window ended at or before T?
- was the evidence complete, stale, partial, or reconstructed?

Point-in-time correctness is a prerequisite for believing retrospective MVPTA results.

---

## 10. Price adjustment and corporate-action semantics

OHLCV history requires an explicit adjusted/unadjusted-price contract.

Splits, reverse splits, dividends/distributions, ticker changes, mergers, and similar events can distort ATR, gaps, extrema, trend, and realized-volatility measurements if adjustment semantics are accidental.

Option strikes relate to contemporaneous market prices, while long-horizon historical analysis may use adjusted series. MVPTA must preserve enough provenance and semantics to avoid comparing incompatible coordinate systems.

Corporate-action identity also matters: if a ticker changes or an instrument is structurally transformed, the system must decide whether and how historical continuity is represented rather than assuming ticker-string continuity equals economic continuity.

---

## 11. Horizon coherence

Conventional defaults such as ATR14, 20-day lows, 50-day averages, or 60-day slopes should not become policy merely because charting software commonly uses them.

The observation windows should be tested against Wheelwright's actual operating horizon — currently short-premium deployments commonly discussed around 14–21 DTE, while the Evidence surface supports a broader DTE range.

Questions include:

- which lookback windows describe movement relevant to the commitment horizon?
- should lookback scale with DTE?
- do different strategies require different interpretation while consuming the same neutral evidence?
- do intraday and daily observations answer different questions?

Window selection is part of the hypothesis, not a universal technical-analysis constant.

---

## 12. Normalization and cross-symbol comparability

Raw technical values are often not comparable across instruments.

Candidate normalized forms include:

- ATR / spot;
- strike distance / ATR;
- percentage distance from recent extrema;
- realized volatility in consistent annualized or horizon-specific form;
- IV relative to the instrument's own recent history;
- gap magnitude relative to spot or ordinary realized movement.

Normalization should support `PL-DEPLOY`'s cross-symbol/cross-strategy comparison without collapsing strategy-specific consequence semantics into an opaque universal score.

---

## 13. Strategy-neutral evidence, strategy-specific interpretation

The evidence layer should describe facts such as:

> price is X ATR above the recent low;

not:

> bullish support is strong.

The same observed condition can have different implications for a CSP, covered call, buy-write, put credit spread, call credit spread, or future strategy. Strategy-specific Decision logic owns the interpretation.

This preserves the existing unified Deployment model: common evidence can feed distinct consequence/ranking semantics without forcing false symmetry among strategies.

---

## 14. Feature redundancy and marginal information value

ATR, realized volatility, range width, gap behavior, and IV can encode overlapping information. More features do not automatically mean more evidence.

MVPTA research should test whether each candidate feature adds incremental discrimination beyond evidence already present. Highly correlated measures should not become multiple votes that manufacture false confidence.

The MVP should remain intentionally small.

---

## 15. Event/discontinuity contamination and data-quality states

Rolling measurements can be dominated by events that are not ordinary movement: earnings, ex-dividend dates, ETF distributions, splits/reverse splits, index changes, unusual overnight gaps, or bad/missing provider bars.

MVPTA needs explicit evidence-quality states rather than silently returning numbers. Candidate states include:

- `INSUFFICIENT_HISTORY`;
- `STALE`;
- `MISSING_SESSION`;
- `DISCONTINUITY_DETECTED`;
- `CORPORATE_ACTION_UNRESOLVED`;
- provider/data failure distinct from an unfavorable measurement.

A symbol with 12 usable days should not silently receive a 20-day feature.

---

## 16. Backfill and retention policy

Do not fetch "all history" merely because it is available.

Backfill depth should be sufficient to:

- calculate the longest experimental feature window;
- provide enough pre-window context for validation;
- support the intended retrospective study;
- avoid unnecessary provider traffic and storage.

Possible ranges such as one, three, five, or ten years remain design choices. Five years was used only for storage-sizing speculation, not ratified as the required backfill.

A multi-timescale retention model remains compatible with `PL-EVID-01`: bounded/raw evidence where appropriate, derived metrics, and promoted durable artifacts.

---

## 17. Derived-evidence ownership and feature versioning

MVPTA should not be implemented as fields stuffed opportunistically into option-chain persistence or recommendation objects.

Working responsibility shape:

**Provider acquisition** → primitive market evidence  
**Evidence** → point-in-time OHLCV / spot / IV observations  
**Observation/derivation** → ATR, extrema, realized movement, gaps, IV trajectory, etc.  
**Research** → determine which observations discriminate outcomes  
**Decision** → consume only empirically justified observations under explicit policy  
**Deployment** → expose transparent effects on eligibility/acceptability/fitness where appropriate

Derived feature definitions require provenance/versioning. If ATR14 becomes ATR20, or an extrema definition changes, historical decisions/research must remain reproducible rather than being silently reinterpreted under today's algorithm.

---

## 18. Define "improved deployment quality" before optimizing

MVPTA cannot be evaluated until the dependent variable is explicit.

Possible outcomes are not equivalent:

- fewer assignments;
- lower maximum adverse excursion;
- greater realized production;
- lower capital erosion;
- fewer manual interventions;
- better net strategy result;
- better production per unit of accepted adverse consequence;
- preserved deployment opportunity / avoiding excessive WAIT.

These can conflict. A filter that reduces assignment may also remove profitable governed deployments.

The working Wheelwright-aligned evaluation question is:

> **Does this evidence improve compensation received relative to the capital consequences actually experienced, without materially destroying useful deployment opportunity?**

This should be reconciled with `PL-DEPLOY`'s existing sequence:

> governance → eligibility → consequence acceptability → fitness → absolute deployment threshold → DEPLOY or WAIT

MVPTA observations should not make an unacceptable consequence acceptable merely because a technical feature looks favorable.

---

## 19. Explainability and anti-score-creep constraint

Avoid a generic opaque construct such as:

> Technical Score = 73

Prefer inspectable statements:

> Strike is 2.1 ATR below spot; below the 20-day low; IV is elevated and declining.

If a measurement eventually influences Decision, the operator should be able to see what was observed, what definition/version produced it, and how policy used it.

MVPTA should enrich the evidence available to governed reasoning, not become a second recommendation engine or a chartist black box.

---

## 20. Reconciled disposition

MVPTA is best understood as:

> **A historical/temporal market-evidence experiment intended to determine whether a very small set of non-predictive, locally derived observations improves Wheelwright's assessment of compensation versus accepted capital consequence.**

It is not presently:

- a Decision policy change;
- implementation authorization;
- a technical-indicator library;
- a new provider requirement;
- a reason to abandon SQLite;
- a reason to modify the Tuesday constraint-identification campaign;
- an authorization to use support/resistance or high-and-falling IV as ranking policy.

The first likely experimental data primitive is historical daily OHLCV. IV history can largely be created by remembering selected evidence Wheelwright already acquires. Derived observations should be researched point-in-time before admission to Decision.

The durable architecture already has natural homes: `PL-EVID-01` owns the historical/observation architecture; `PL-DEPLOY-02` is a natural observation/research companion; `PL-DEPLOY` owns eventual transparent use in deployment reasoning; `PL-EVID-04` owns market-priced-risk/IV concerns; `PL-COHERE-01` supplies the observation-identity and temporal-contract warnings; the active constraint-identification plan governs sequencing relative to provider-capacity work.
