# Empirical Expected Value Estimation for Options Strategies — Prior-Art Investigation

Date: 2026-10-15 | Status: COMPLETE (research phase) | All sources accessed signed-out, publicly accessible only.

---

## EXECUTIVE SUMMARY

**Strongest established findings (VERIFIED unless flagged):**

1. **Option returns are conditionally forecastable from entry-observable information — but the forecastable component is mostly compensation for volatility risk, not pure alpha.** The most replicated predictors: (a) the gap between implied volatility and subsequent/expected realized volatility (Bakshi & Kapadia 2003: delta-hedged option gains are negative on average and track the negative market volatility risk premium; Goyal & Saretto 2009: sorting on historical-RV-minus-ATM-IV produces significant cross-sectional option-return spreads); (b) idiosyncratic volatility of the underlying (Cao & Han 2013: delta-hedged option returns decrease monotonically in IVOL); (c) ex-ante skewness of the option's return distribution (Boyer & Vorkink 2014: strong negative cross-sectional relation, 10–50%/week return gaps); (d) market-maker order flow / inventory pressure (Muravyev 2016). Each has a peer-reviewed, independent-data primary source. **Interpretation of (b) and (c) is contested** (variance-risk-exposure mechanics vs. preferences/intermediary frictions — index-level secondary evidence).

2. **Statistical anomaly ≠ economic value.** The literature's dominant lesson (Q3) is that measured option-return anomalies sit inside wide uncertainty bands once real frictions are included: Broadie, Chernov & Johannes (2009) show the famous negative put returns are statistically indistinguishable from a no-risk-premium stochastic-volatility model's sampling distribution ("one in four simulated paths generates more negative average returns than the data"); Figlewski (1989) shows realistic arbitrage bounds are "very wide" because hedging is expensive and risky even for market makers; Santa-Clara & Saretto (2009) document very high Sharpe ratios on short-option strategies **and simultaneously** show margin calls and transaction costs impose substantial limits to arbitrage. Constantinides et al. (2009/2010) provide the positive counterexample: out-of-sample stochastic-dominance violations that survive transaction costs and bid-ask spreads — but even this result is input-sensitive (Wallmeier critique; authors' 2021 rebuttal: the dispute is over a ~2% volatility-input choice).

3. **Reconstructing a full physical distribution is NOT necessary for expected-P/L estimation.** Established methods that avoid it: (a) direct conditional-payoff regression / sort-based conditional expectancy (Goyal & Saretto decile sorts; Fama-MacBeth regressions in Cao & Han); (b) model-free option-price integrals as expectation proxies (Martin 2017: SVIX lower bound on the equity premium from OTM option prices; needs no distributional assumption); (c) stochastic-dominance bounds using a time-series-estimated physical distribution (Constantinides et al.); (d) exposure decomposition into priced vs. unpriced components (Israelov & Nielsen). The direct approach (regress realized net P/L on entry-observable features) is exactly what the strongest prior art does, and it is strictly simpler than distributional reconstruction.

4. **Managed outcomes are reconstructible only at the coarsest tiers with defensible uncertainty bands.** The evidence supports: (A) expiration-only payoffs — defensible with daily option data + settlement conventions; (B) once-daily management — defensible with daily bid/ask series and conservative fill assumptions (midpoint fill is optimistic; a quote touching a target never proves a fill); (C/D) intraday or continuous profit-target orders — require intraday quote/trade data with timestamps, and execution uncertainty must be bounded by scenarios, not point-estimated (Muravyev & Pearson 2020 show effective spreads are materially smaller than quoted spreads for traders who time execution — so cost assumptions are a *range*, and the benefit depends on execution capability that a backtest cannot grant itself).

5. **There is no peer-reviewed empirical literature on iron condor (or systematically managed vertical-spread) expected P/L.** Verified by direct search on 2026-10-15. Academic evidence covers single options, straddles/strangles, delta-hedged portfolios, and covered calls. Multi-leg structures must be validated from primary data; citing academic papers as evidence *for* iron-condor profitability is unsupported. Single-leg index options and two-leg verticals are cleaner initial validation targets (cleaner data, fewer assignment/complex-order pricing issues).

**Major limitations of the prior art for this mission:** (i) nearly all strong results are for *unconditional or monthly-rebalanced buy-and-hold-to-expiration* returns, not profit-target-managed trades; the managed-policy dimension (50%-of-max-profit exits, stop-losses, rolling) has essentially no peer-reviewed treatment; (ii) most findings concern *option returns* (per-dollar returns on premium) rather than *net dollar P/L* or probability-weighted expectancy; (iii) sample periods are concentrated in 1987–2010 and dominated by the S&P 500; (iv) transaction-cost treatment is frequently absent or coarse in the forecasting papers; the cost papers and the forecasting papers are largely different literatures.

**Unresolved questions:** whether entry-information predictability survives in managed (early-exit) P/L rather than hold-to-expiration returns; whether tail-risk measures improve alongside mean forecasts; whether iron-condor/call-side premium behaves like the documented put-side premium; whether ML/high-dimensional models beat simple IV−RV baselines (a practitioner video-series claim of ~0.4% OOS R² ceiling for the S&P 500 surface is hypothesis-level only, not primary evidence).

---

## RESEARCH QUESTIONS — FINDINGS

### Q1. WHAT HAS WORKED EMPIRICALLY? (conditional option-return forecasts from entry-observable information)

**VERIFIED predictors with primary sources:**

| Predictor (entry-observable) | Source | What it forecasts | Evidence level |
|---|---|---|---|
| Historical RV − ATM IV spread (cross-sectional sorts) | Goyal & Saretto 2009 | Straddle / delta-hedged option returns | VERIFIED (abstracts); specific % figures not primary-verified |
| Negative unconditional delta-hedged gains; VRP | Bakshi & Kapadia 2003 | Sign/magnitude of delta-hedged option P/L | VERIFIED (abstracts) |
| Idiosyncratic volatility of underlying | Cao & Han 2013 | Delta-hedged equity option returns (negative) | VERIFIED (abstract); interpretation contested |
| Ex-ante total skewness of option return | Boyer & Vorkink 2014 | Option holding returns (negative, strongest at 1-week) | VERIFIED (abstract) |
| Option order flow / inventory pressure | Muravyev 2016 | Expected option returns | VERIFIED (abstract) |
| Stochastic-dominance bound violations | Constantinides et al. 2009/2010 | Expected-utility-improving trades | VERIFIED (abstracts); contested inputs |
| Option-implied vs realized correlation | Driessen, Maenhout & Vilkov 2009 | Correlation/variance risk premium (~18% per citing source) | Index-level (secondary citation) |

**Critical distinctions established by the literature:**
- **Option returns ≠ underlying returns.** Martin (2017) forecasts the *equity premium* (underlying return) from option prices; Goyal & Saretto / Boyer & Vorkink / Cao & Han forecast *option* returns. Conflating the two is the most common category error; the mission correctly separates them.
- **Forecasting option returns ≠ forecasting volatility.** Goyal & Saretto's signal is about *relative pricing* (is IV rich vs. expected RV), not about predicting RV per se. Poon & Granger (2003)-style volatility-forecasting literature is a different question.
- **Probability of profit is not expected P/L.** None of the primary sources substitutes POP for expectancy; the practitioner habit of quoting win rates without expectancy has no academic support. (INFERRED: win-rate statistics appear only in practitioner materials reviewed.)
- **Out-of-sample predictive improvement demonstrated:** Goyal & Saretto (monthly sorts, robust across subperiods — though in-sample portfolio construction, not a formal OOS forecast horse race); Constantinides et al. (2010) formal out-of-sample stochastic-dominance tests; Martin (2017) predictive regressions not rejecting the SVIX bound. What is largely *missing* is a clean OOS forecast-comparison (e.g., encompassing tests, OOS R²) of expected net P/L for *managed* strategies against simple baselines — UNKNOWN.

### Q2. SIMPLEST CREDIBLE BASELINES

Established, low-complexity baselines that must be beaten before any sophisticated model is entertained:

1. **Unconditional historical average return/P/L** (per strategy, per moneyness/DTE bucket). Required data: realized trade outcomes. Assumption: stationarity of the mean. Limitation: option returns are extremely skewed/noisy (Broadie et al.: raw means have enormous standard errors). Validation: Newey-West t-stats; subsample stability.
2. **IV − RV spread (Goyal & Saretto style).** Required data: option chain (IV) + underlying price history (RV). Assumptions: RV estimate proxies expected volatility; IV−RV gap proxies mispricing/risk premium. Limitation: Lof (2019) replication of Martin (2017): SVIX-type IV predictability largely vanishes once an EWMA realized-volatility baseline is included — i.e., always test the IV signal *against* an RV-only baseline.
3. **SVIX-type model-free option-price integral (Martin 2017).** Required data: full OTM option strip at entry. Assumptions: essentially none (weak no-arbitrage). Limitation: a *lower bound* on the equity premium, not a point forecast; forecasts underlying returns, not option P/L. But it is the canonical "no-distribution-needed" expectation-from-options method.
4. **Low-dimensional linear/Fama-MacBeth regressions** on: moneyness, DTE, IV level, IV−RV, IVOL, skewness, bid-ask spread, regime dummies (Cao & Han 2013 template). Limitation: option payoffs are nonlinear; linearity is an approximation — but the literature's positive results are mostly linear/sort-based, which sets the bar: complexity must *beat* these.
5. **Established risk-factor adjustments:** Fama-French/market factors for the equity leg (Israelov & Nielsen decomposition: passive equity + short vol + dynamic equity); variance-risk and correlation-risk factors (Driessen et al. for index products).
6. **Stochastic-dominance bound check (Constantinides et al.):** ask "does this trade improve expected utility for any risk-averse investor net of costs?" before asking "what is its alpha?"

**On the full-distribution question (VERIFIED):** No primary source requires reconstructing a complete physical probability distribution to estimate expected net P/L. Sorts, regressions, model-free integrals, and bound checks all sidestep it. A full distribution is only needed if the objective includes tail-risk/quantile estimation — and there the literature is thin (see Open Questions).

### Q3. DOES PREDICTIVE IMPROVEMENT PRODUCE ECONOMIC VALUE?

**The literature evaluates (A) forecast quality and (B) trading performance jointly only in a minority of papers — and they often disagree.**

- **Joint positive case (VERIFIED):** Constantinides, Czerwonko, Jackwerth & Perrakis (2010; SSRN abstract verified live): out-of-sample stochastic-dominance tests; writing bound-violating options raises expected utility net of transaction costs and bid-ask spreads; economically significant and robust. This is the methodological template: *OOS identification → utility/P&L test → costs → robustness*.
- **Joint positive case:** Goyal & Saretto (2009): significant long-short returns robust to liquidity sorts and factor models — but formal transaction-cost accounting for the long-short decile strategy is not verified in the accessible material; the *forecast* result is stronger than the *economic* result.
- **Negative findings / vanishing effects:**
  - Broadie, Chernov & Johannes (2009) (VERIFIED via slides + citation): the headline put-return anomaly is within a no-risk-premium model's sampling variation; apparent predictability can be peso-problem/estimation-risk artifacts. **Do not treat historical mean option returns as expected returns without model-based standard errors.**
  - Santa-Clara & Saretto (2009) (VERIFIED abstract): huge Sharpe ratios on short-option strategies, but margin requirements and transaction costs "impose substantial limits to arbitrage" — high Sharpe ≠ harvestable alpha.
  - Figlewski (1989) (VERIFIED abstract): realistic frictions make arbitrage bounds "very wide" — many apparent expected-P/L edges sit inside the no-arbitrage band.
  - Wallmeier vs. Constantinides et al. (VERIFIED citations): the flagship after-cost economic result is sensitive to ~2% volatility-input and index-level construction choices.
  - Lof (2019) replication (index-level): IV-based return predictability largely disappears against an RV baseline — a direct "predictive improvement vanishes" case.
- **Mean vs. tail risk (mission's key warning — supported):** No primary source reviewed demonstrates that a model improving *mean* P/L forecasts also improves *downside-risk* estimates. Santa-Clara & Saretto explicitly adjust for non-normality and emphasize margin calls; Israelov & Nielsen show the short-volatility exposure driving returns is the same exposure driving left-tail losses. **INFERRED rule: expected-P/L improvement and tail-risk reduction must be measured separately; the literature gives no license to infer one from the other.**
- **Risk-adjustment taxonomy the literature supports:** (i) raw expected profit (rarely sufficient); (ii) compensation for systematic risk — variance risk premium (Bakshi & Kapadia), correlation risk (Driessen et al.), intermediary inventory risk (Muravyev 2016; Cao & Han); (iii) benchmark-relative excess return (Goyal & Saretto factor-model tests); (iv) risk-adjusted alpha — fragile, because Sharpe ratios on short-option portfolios are non-normal (Santa-Clara & Saretto use non-normality-aware inference; Broadie et al. argue raw Sharpe ratios are "too noisy to use for tests").

### Q4. CAN MANAGED OUTCOMES BE RECONSTRUCTED DEFENSIBLY?

**Tier-by-tier verdict (VERIFIED where noted):**

- **(A) Expiration-only payoffs — DEFENSIBLE.** Requirements: daily option chains with contract IDs, strike/expiry coverage, underlying price and dividend data, settlement conventions (AM/PM), corporate-action adjustments, missing-data/survivorship handling. This is the standard in all hold-to-maturity studies (Broadie et al., Goyal & Saretto, Bakshi & Kapadia).
- **(B) Once-daily management (e.g., check target at close) — DEFENSIBLE with stated assumptions.** Requirements: daily bid/ask series (not just midpoints), timestamp synchronization of option quotes with underlying prints, dividend/ex-div handling, early-exercise/assignment logic for American options. Fill assumption must be conservative: fill at bid (for sells) / ask (for buys), never at midpoint; slippage scenario required. Constantinides et al. (2010) is the template: they incorporate bid-ask spreads, transaction costs, and *trading delays* (waiting one day) as a robustness device.
- **(C) Intraday management — DEFENSIBLE ONLY with intraday data and scenario bounds.** Requirements: intraday quotes/trades with timestamps, depth data, complex-order (spread) pricing vs. leg-by-leg pricing. Battalio & Schultz (2006) set the precedent of using intraday rather than closing data for execution-relevant questions. Bid/ask bounce and quote staleness must be modeled; midpoint-based fills are optimistic.
- **(D) Continuously working profit-taking orders — NOT DEFENSIBLE from quote data alone.** A quote touching a target price never proves an executable fill (queue position, depth at the touch, latency, and partial fills are unobserved). Methods for bounding: report a *range* from pessimistic (fill only if quote trades through the target by ≥ half-spread and holds, or use trade-price confirmation) to optimistic (touch = fill); treat the width of the range as the measurement, per Figlewski's bounds logic. Muravyev & Pearson (2020) add that effective spreads are ~25%+ smaller than quoted for traders who time execution — so the "true" cost is itself a range depending on execution skill the backtest cannot self-award.

**Execution-uncertainty checklist (compiled from the sources):** contract ID/strike coverage and roll conventions; quote timestamps and underlying synchronization; bid/ask *and* depth; complex-order vs. leg pricing; midpoint vs. executable; profit-target fill detection (touch vs. trade-through); periodic vs. continuous monitoring; early exercise/assignment (American); ex-dividend effects; AM/PM settlement; contract adjustments; missing data/survivorship bias (delisted underlyings, expired worthless contracts dropping from datasets).

### Q5. WHICH STRUCTURES SUIT INITIAL VALIDATION?

**Comparison (INFERRED from source coverage, flagged where speculative):**

| Dimension | Single-leg (e.g., short OTM put) | Two-leg credit vertical | Four-leg iron condor |
|---|---|---|---|
| Peer-reviewed empirical base | Strong (Bakshi-Kapadia; Broadie et al.; Bondarenko; CJP) | Weak-indirect (put spreads appear as test portfolios in Broadie et al.) | **None found (VERIFIED search)** |
| Data requirements | Single chain series | Two strikes, same expiry; spread-price synchronicity | Four strikes; complex-order pricing |
| Execution reconstruction | Standard | Moderate (leg-correlation, assignment on short leg) | Hard (fill on 4 legs, partial fills, wide effective spreads) |
| Vol/skew sensitivity | Direct (single-strike IV) | Net vega, skew between strikes | Vega-neutral-ish; loads on wings, correlation risk |
| Assignment | Single American-exercise risk | Short-leg assignment with long-leg hedge | Two short legs; pin risk at expiry |
| Sample availability | Largest | Good (liquid strikes) | Smaller (needs 4 liquid strikes simultaneously) |
| Tail risk | Uncapped one side | Capped | Capped but gap/overnight risk on both wings |
| Generalizability | Findings transfer upward with caution | — | Condor-specific effects (call-side premium weaker) don't transfer downward |

**Conclusions:**
- **Single-leg index options are the cleanest initial validation target** (VERIFIED: deepest literature, simplest reconstruction, largest samples). Two-leg credit verticals are a reasonable second step.
- **Iron condors are the worst initial target** despite practitioner popularity: no academic empirical base (VERIFIED gap), hardest execution reconstruction, and four-leg transaction costs dominate (Muravyev-Pearson cost findings cut hardest here).
- **Non-generalizable findings:** anything depending on the *call-side* wing (condor call spreads harvest less premium than put side — consistent with the put-centric anomaly literature; SPECULATIVE as a condor-specific claim, INFERRED from put-side dominance in sources); correlation-risk effects (Driessen et al.) matter for index condors but not single-name verticals; assignment/pin-risk mechanics are structure-specific.

### Q6. REUSABLE METHODS

| Method | Full distribution required? | Best fit for |
|---|---|---|
| **Direct conditional payoff regression** (Fama-MacBeth / panel; Cao & Han template) | No — regress realized net P/L on entry features | Mean net P/L estimation; management-policy comparison via interaction terms |
| **Historical conditional expectancy** (sorts; Goyal & Saretto deciles) | No | Mean P/L; simple, transparent; non-parametric |
| **Risk-neutral-to-physical transformations** (SD bounds — Constantinides et al.; SVIX bound — Martin) | Only a time-series physical estimate (bounds), or nothing at all (SVIX) | Benchmark-relative advantage testing; expectation proxies without distributional commitment |
| **Volatility risk premium models** (Bakshi & Kapadia delta-hedged gains; Carr & Wu variance-risk-premium portfolios — index-level citation) | No | Risk compensation vs. alpha decomposition; mean P/L |
| **Parametric return models** (SV/jump models à la Broadie et al.) | Yes (model-implied) | Honest standard errors on expected returns; peso-problem/model-risk quantification |
| **Risk-factor-adjusted option returns** (Israelov & Nielsen exposure decomposition; Driessen et al. correlation factor) | No | Separating priced exposures from unpriced (dynamic) exposures; benchmark-relative tests |
| **Monte Carlo** (Figlewski-style friction simulation) | Assumed process | Bounding execution/implementation uncertainty; cost-scenario analysis |
| **Distributional/quantile regression** | Estimates conditional quantiles, not full density | Downside-risk estimation — **notably absent from the reviewed prior art (UNKNOWN/gap)** |

**Direct answer to the mission's question:** estimating expected net P/L directly (regression/sorts on realized outcomes) is not only viable without a full physical distribution — it is what the strongest prior art does. Full-distribution reconstruction adds model risk (Broadie et al.'s core warning) without demonstrated payoff for the *mean* question. Reserve distributional methods for the *tail-risk* question, where they are necessary and where prior art is missing.

---

## PRIOR-ART MATRIX

### 1. Goyal & Saretto (2009) — Cross-section of option returns and volatility
- **Authors:** Amit Goyal, Alessio Saretto. **Date:** JFE 94(2), 2009, 310–326 (SSRN WP "Option Returns and Volatility Mispricing," Feb 2007).
- **Links:** citation https://EconPapers.repec.org/RePEc:eee:jfinec:v:94:y:2009:i:2:p:310-326 (index); SSRN abstract https://papers.ssrn.com/sol3/papers.cfm?abstract_id=889947 (verified live 2026-10-15).
- **Method:** Monthly decile sorts on (12m historical RV − 1m ATM IV); long-short straddle and delta-hedged option portfolios; long positive-spread decile, short negative-spread decile.
- **Instruments/sample:** US individual equity options.
- **Position construction:** Monthly-rebalanced zero-cost portfolios; hold-to-expiration style monthly options; no profit targets.
- **Required data:** Option chains (ATM IV), underlying price history (RV), liquidity characteristics.
- **Costs:** Robustness to option-liquidity sorts verified; explicit transaction-cost accounting not verified at abstract level.
- **Validation:** Cross-sectional sorts; robustness across market conditions, industries, firm characteristics; linear factor models do not explain results.
- **Findings:** Economically and statistically significant average monthly long-short returns; not explained by usual risk factors.
- **Limitations:** No per-trade expectancy estimator; long-short decile construct; cost treatment thin; specific performance figures (e.g., ~22.7%/month) appear only in secondary summaries — not primary-verified.

### 2. Bakshi & Kapadia (2003) — Delta-Hedged Gains and the Negative Market Volatility Risk Premium
- **Authors:** Gurdip Bakshi, Nikunj Kapadia. **Date:** RFS 16(2), 2003, 527–566.
- **Links:** https://EconPapers.repec.org/RePEc:oup:rfinst:v:16:y:2003:i:2:p:527-566 (index); companion individual-equity version (JoD Fall 2003) PDF http://people.umass.edu/~nkapadia/docs/Bakshi_Kapadia_JoD_Fall_2003.pdf (index).
- **Method:** Theory linking VRP sign/magnitude to mean delta-hedged gains; empirical delta-hedged (buy option + stock hedge) portfolios on S&P 500 (RFS) and individual equities (JoD).
- **Findings:** Delta-hedged gains significantly negative; less negative away from the money; more negative in high-vol regimes; robust to jump fears; individual-equity VRP smaller; idiosyncratic vol risk not priced.
- **Costs:** None in abstract-level evidence (academic P/L, not implementable strategy).
- **Limitations:** Establishes risk compensation, not exploitable alpha; no entry-signal timing; no transaction costs.

### 3. Broadie, Chernov & Johannes (2009) — Understanding Index Option Returns
- **Authors:** Mark Broadie, Mikhail Chernov, Michael Johannes. **Date:** RFS 22(11), 2009, 4493–4529. DOI https://doi.org/10.1093/rfs/hhp032.
- **Links:** Citation verified via author CV https://business.columbia.edu/sites/default/files-efs/person/cv/Broadie--Mark-CV_2022.pdf (index); author slides https://www.sambuz.com/doc/understanding-index-option-returns-ppt-presentation-941525 (index).
- **Method:** Monthly hold-to-maturity S&P 500 option returns 1987–2005 vs. simulated SV-model sampling distributions; alternative test portfolios (delta-hedged puts, ATM/crash-neutral straddles, put spreads).
- **Findings:** Observed −57%/mo OTM and −30%/mo ATM put returns are *within* a no-risk-premium model's sampling noise (1 in 4 simulated paths worse); raw Sharpe ratios/CAPM alphas too noisy for tests; the "anomaly" is largely the ~2% ATM IV-minus-realized-vol gap, whose source (mispricing vs. jump premium vs. peso problem) is unidentified.
- **Costs:** Uses hold-to-maturity returns partly to sidestep trading-cost/data problems.
- **Limitations:** Does not rule out genuine premia; shows they are hard to identify — the paper is a *caution*, not a trading signal.

### 4. Santa-Clara & Saretto (2009) — Option Strategies: Good Deals and Margin Calls
- **Authors:** Pedro Santa-Clara, Alessio Saretto. **Date:** JFM 12(3), 2009, 391–417. DOI https://doi.org/10.1016/j.finmar.2009.01.002.
- **Links:** https://optionmetrics.com/research/p-santa-clara-and-a-saretto-option-strategies-good-deals-and-margin-calls/ (verified live 2026-10-15).
- **Method:** Broad S&P 500 strategy menu (naked/covered, straddles, strangles, calendars; multiple maturities/moneyness) with explicit transaction costs and margin requirements.
- **Findings:** Short-option strategies earn very high Sharpe ratios, significant under non-normality-aware inference, above asset-pricing-model warrants — **but** margin calls and costs substantially limit arbitrage.
- **Limitations:** Mechanical strategies (no profit targets); Sharpe ratios on negatively-skewed payoffs need drawdown accounting; exact cost magnitudes not abstract-verified.

### 5. Constantinides, Jackwerth & Perrakis (2009); Constantinides, Czerwonko, Jackwerth & Perrakis (2010/2013)
- **Dates:** RFS 22(3), 2009, 1247–1277; SSRN WP Jul 2010 (J. Futures Markets 2013).
- **Links:** https://econpapers.repec.org/article/ouprfinst/v_3a22_3ay_3a2009_3ai_3a3_3ap_3a1247-1277..htm (index); NBER https://EconPapers.repec.org/RePEc:nbr:nberwo:14544 (index); https://papers.ssrn.com/sol3/papers.cfm?abstract_id=1282085 (verified live 2026-10-15); rebuttal https://EconPapers.repec.org/RePEc:now:jnlcfr:104.00000090 (index).
- **Method:** Stochastic-dominance bounds from time-series physical distribution; identify violating 1-month S&P 500 calls (1986–2006); zero-net-cost trades; out-of-sample utility tests with observable-only information, American exercise, transaction costs, bid-ask spreads, trading delays.
- **Findings:** Widespread violations; writing violating calls raises any risk-averse investor's expected utility net of costs; economically significant, robust.
- **Limitations:** Utility gain ≠ mean P/L; contested by Wallmeier (input sensitivity: ~2% vol input, index-level construction); relies on time-series physical distribution (estimation risk).

### 6. Boyer & Vorkink (2014) — Stock Options as Lotteries
- **Authors:** Brian H. Boyer, Keith Vorkink. **Date:** JF 69, 2014, 1485–1527.
- **Links:** https://optionmetrics.com/research/b-boyer-k-vorkink-stock-options-as-lotteries/ (verified live 2026-10-15).
- **Method:** Cross-sectional relation of ex-ante total skewness to holding returns on individual equity options.
- **Findings:** Strong negative skewness-return relation; 10–50%/week return gaps low-vs-high skewness; robust to moneyness; strongest at 1-week horizon.
- **Limitations:** Short-horizon; weekly holds; no cost treatment verified; interpretation contested by variance-risk-exposure accounts (index-level).

### 7. Cao & Han (2013) — Cross section of option returns and idiosyncratic stock volatility
- **Authors:** Jie Cao, Bing Han. **Date:** JFE 108(1), 2013, 231–249. DOI 10.1016/j.jfineco.2012.11.010.
- **Links:** https://ideas.repec.org/a/eee/jfinec/v108y2013i1p231-249.html (index).
- **Method:** Fama-MacBeth regressions of delta-hedged equity option returns on underlying IVOL (1996–2009), with size/BE-ME/past-return/systematic-vol controls.
- **Findings:** Delta-hedged option returns decrease monotonically in IVOL; unexplained by standard factors; intermediary-friction interpretation; limits-to-arbitrage proxies attenuate ~40%.
- **Limitations:** ATM contracts; newer work claims the relation is mechanical under no-arbitrage and reverses for OTM (index-level); no costed strategy.

### 8. Driessen, Maenhout & Vilkov (2009) — The Price of Correlation Risk
- **Date:** JF 64(3), 2009, 1377–1406. DOI http://dx.doi.org/10.1111/j.1540-6261.2009.01467.x.
- **Links:** DOI/citation via https://www.scirp.org reference record (index); citing summary https://files.fisher.osu.edu/department-finance/public/international_correlation_risk.pdf (index).
- **Findings:** Correlation risk premium on S&P 500 ≈18% (avg implied corr ~47% vs realized ~29%, per citing source — index-level); significantly negative price of correlation risk.
- **Limitations:** Structural model; not a managed-strategy forecast; figures secondary-sourced.

### 9. Muravyev (2016) — Order Flow and Expected Option Returns
- **Date:** JF 71(2), 2016, 673–708.
- **Links:** https://EconPapers.repec.org/RePEc:bla:jfinan:v:71:y:2016:i:2:p:673-708 (index); https://optionmetrics.com/research/d-muravyev-order-flow-and-expected-option-returns/ (verified live 2026-10-15).
- **Method:** Inventory-risk vs. informed-trade price-impact decomposition from market-maker-specific responses.
- **Findings:** Market-maker inventory risk is the primary driver of option price deviations; both components significant.
- **Limitations:** Needs signed intraday data; short-horizon; no costed strategy verified.

### 10. Muravyev & Pearson (2020) — Option Trading Costs Are Lower than You Think
- **Date:** RFS 33(11), 2020, 4973–5014.
- **Links:** https://EconPapers.repec.org/RePEc:oup:rfinst:v:33:y:2020:i:11:p:4973-5014. (index).
- **Findings:** Traders time executions to high-frequency fair-value moves; effective spreads <40% of conventional for timers; overall average effective spread ~25% smaller than conventional; conclusions about after-cost strategy profitability change.
- **Limitations:** Timing skill is itself a strategy; multi-leg orders likely worse; equity options.

### 11. Martin (2017) — What is the Expected Return on the Market?
- **Date:** QJE 132(1), 2017, 367–433. Related: Martin & Wagner (2019, JF) single-stock expected returns.
- **Links:** https://EconPapers.repec.org/RePEc:oup:qjecon:v:132:y:2017:i:1:p:367-433. (index); author page with public data https://personal.lse.ac.uk/martiniw/ (index).
- **Method:** SVIX lower bound on equity premium from OTM index-option integral; weak assumptions; no distribution needed.
- **Findings:** Bound avg ~5%, >20% in 2008; predictive regressions do not reject tightness.
- **Limitations:** Bound, not point forecast; forecasts underlying returns, not option P/L; Lof (2019) replication: incremental value over EWMA-RV is small.

### 12. Figlewski (1989) — Options Arbitrage in Imperfect Markets
- **Date:** JF 44(5), 1989.
- **Links:** https://citeseerx.ist.psu.edu/document?doi=1bdff58ca0b0962ad29460925c7d41b0fd3261f0&repid=rep1&type=pdf (index); https://pages.stern.nyu.edu/~sfiglews/documents/Figlewski-JF89-abstract.pdf (index).
- **Method:** Simulation of arbitrage with uncertain vol, costs, indivisibilities, discrete rebalancing.
- **Findings:** Realistic frictions leave "very wide" no-arbitrage bounds; delta hedging is expensive and risky even for market makers (~30bp costs, ~6.5% residual vol for 1m ATM at 15% vol, per author's keynote — index-level).
- **Limitations:** 1980s data; illustrative.

### 13. Israelov & Nielsen (2014) — Covered Call Strategies: One Fact and Eight Myths (+ 2018 follow-up)
- **Date:** FAJ Nov–Dec 2014; "Covered Calls Uncovered," JPM 2018.
- **Links:** https://paperswithbacktest.com/api/paper/covered-call-strategies-one-fact-and-eight-myths/pdf (index); https://www.aqr.com/-/media/AQR/Documents/Journal-Articles/Covering-the-world-global-evidence-on-covered-calls.pdf (index).
- **Method:** Return decomposition of S&P 500 covered calls into passive equity + short volatility + dynamic equity exposures.
- **Findings:** Covered call = low-beta equity; "income" is revenue not income; only the short-volatility exposure earns expected return (the VRP); dynamic equity exposure adds risk without expected return; delta-hedging the short straddle raises Sharpe substantially.
- **Limitations:** Single short-call structure; attribution, not an OOS managed-P/L forecast.

---

## THREE MOST REUSABLE METHODS

**1. Direct conditional net-P/L regression / sort-based conditional expectancy (Goyal & Saretto; Cao & Han).**
*Justification:* It is the method behind the two strongest conditional-forecast results in the literature; it estimates E[net P/L | entry information] directly with no distributional assumptions; it is transparent, low-dimensional, and falsifiable (OOS R², encompassing tests vs. baselines). Fama-MacBeth or panel regression with Newey-West errors is the established validation template; interaction terms can compare management policies (e.g., profit-target vs. hold) within the same regression.
*Evidence:* VERIFIED (abstracts + citations).

**2. Model-free option-implied expectation bounds (Martin SVIX; Constantinides SD bounds).**
*Justification:* Provides expectation estimates/inequalities from entry-observable option prices under minimal assumptions — the principled way to inject forward-looking information without a full distribution. SVIX needs only the OTM strip; SD bounds add a time-series physical estimate and a cost-aware utility test (the Constantinides 2010 protocol: observable info only, bid-ask, costs, delays).
*Evidence:* VERIFIED (abstracts + citations); contested only on inputs (Wallmeier debate), not on the method's logic.

**3. Exposure decomposition into priced vs. unpriced components (Israelov & Nielsen; Bakshi & Kapadia; Driessen et al.).**
*Justification:* Before forecasting P/L, decompose expected strategy return into exposures that theory/evidence says are compensated (short variance, short correlation, passive equity beta, intermediary inventory) vs. exposures that add risk without expected return (dynamic delta drift). This prevents the core error the literature documents: mistaking risk compensation for alpha, and mistaking volatility-of-P/L reduction for tail-risk reduction.
*Evidence:* VERIFIED (abstracts).

---

## STRONGEST COUNTEREVIDENCE

1. **Apparent anomalies are statistically indistinguishable from no-premium models** — Broadie, Chernov & Johannes (2009): put-return "anomalies" within SV-model sampling noise; peso problems and estimation risk are observationally equivalent to mispricing. (VERIFIED)
2. **High Sharpe ratios do not survive realistic implementation** — Santa-Clara & Saretto (2009): margin calls and transaction costs substantially limit arbitrage of the very strategies with the highest measured Sharpe ratios. (VERIFIED)
3. **No-arbitrage bounds are very wide under real frictions** — Figlewski (1989): most measured expected-P/L edges may sit inside the implementable no-arbitrage band. (VERIFIED)
4. **The flagship after-cost result is input-sensitive** — Wallmeier vs. Constantinides et al.: a ~2% volatility-input choice determines whether "widespread mispricing" exists. (VERIFIED citations; resolution contested)
5. **IV-based predictability adds little over RV baselines** — Lof (2019) replication of Martin (2017): SVIX predictability largely disappears against EWMA realized volatility. (index-level)
6. **Cross-sectional interpretations are contested** — variance-risk-exposure mechanics claimed to subsume both skewness (Boyer & Vorkink) and IVOL (Cao & Han) anomalies (index-level secondary source); intermediary-friction vs. preference stories unresolved.
7. **Conventional cost estimates overstate costs, but the offset requires skill** — Muravyev & Pearson (2020): effective spreads materially below quoted, but only for traders who time execution; a backtest cannot credit itself this benefit without modeling the timing strategy. (VERIFIED)
8. **Zero peer-reviewed evidence for iron condors / profit-target-managed spreads** — direct search 2026-10-15. The most mission-relevant structures have the thinnest evidence. (VERIFIED search result)

---

## MINIMUM DEFENSIBLE EXPERIMENT

**Objective:** Test whether entry-observable information improves expected net P/L forecasts over simple baselines. Separates (i) predictive accuracy from (ii) economic performance.

- **Instrument population:** S&P 500 index options (SPX), monthly expirations, 30–60 DTE at entry. Rationale: deepest data, European exercise (no early-exercise confound), most liquid; matches Broadie et al./Constantinides samples. Single short puts and put credit spreads first; iron condors only after single-leg/vertical validation.
- **Horizon:** Fixed 30–45 DTE entries; outcome measured two ways: (a) hold-to-expiration net P/L; (b) managed P/L under ONE pre-registered policy (e.g., close at 50% of max profit or at 21 DTE, whichever first).
- **Outcome definition:** Net dollar P/L per unit of margin/capital at risk, net of the cost scenarios below. Report mean, and separately: 5th percentile, max drawdown, and skewness of P/L. Never report win rate without expectancy.
- **Candidate predictors (all entry-observable):** ATM IV; IV − trailing RV (multiple RV windows); IV term-structure slope; 25-delta risk reversal/skew; underlying IVOL (for single names if extended); option bid-ask spread %; VIX regime indicator.
- **Baselines (must beat, in order):** (1) unconditional mean P/L per bucket; (2) RV-only model (EWMA RV); (3) IV−RV linear model; (4) SVIX-type model-free integral where applicable. Complexity is justified only by OOS improvement over (3).
- **Validation design:** Expanding-window out-of-sample; pre-registered specification; report OOS R² / mean-squared-error vs. baselines AND Diebold-Mariano/encompassing tests; subsample stability (pre/post-2010); Newey-West inference. No hyperparameter tuning on the evaluation window.
- **Cost scenarios (report all three):** (i) full quoted half-spread each way + commissions; (ii) Muravyev-Pearson-adjusted effective spread (~25–60% reduction, flagged as requiring execution skill); (iii) zero-cost (diagnostic only, never a headline). For managed exits: fill assumed at bid/ask with a one-day delay variant (Constantinides et al. protocol).
- **Risk/tail measurements:** Separate from mean: left-tail quantiles, max adverse excursion, margin-call frequency under the Santa-Clara-Saretto lens; test whether the forecast also predicts tail outcomes (expect: it will not — pre-register this null).
- **Falsification criteria (pre-registered):** The entry-information model is rejected if (a) OOS R² ≤ baseline OOS R²; (b) after-cost mean P/L ≤ 0 in the conservative cost scenario; (c) results are driven by a single subperiod or <5 tail events; (d) the Wallmeier-style sensitivity check (perturb vol inputs ±2%) flips the sign.
- **Execution-reconstruction tier:** Start at tier (A) expiration-only + tier (B) once-daily management with conservative fills. Tiers (C)/(D) require intraday data and scenario-bound reporting; a quote touching a target is never coded as a fill — require trade-through or report the assumption as a sensitivity range.

---

## OPEN QUESTIONS

1. **Managed-policy expectancy:** No primary source estimates expected P/L under profit-target/stop-loss management. Whether entry information that predicts hold-to-expiration returns also predicts *managed* outcomes is UNKNOWN (missing evidence, not negative evidence).
2. **Tail-risk forecastability:** Whether any entry-observable variable predicts the left tail of strategy P/L (as opposed to the mean) is UNKNOWN; the literature measures tails ex post (Santa-Clara & Saretto) but does not forecast them.
3. **Iron condor / multi-leg expectancy:** No peer-reviewed empirical base (VERIFIED gap). Missing evidence.
4. **Call-side vs. put-side premium:** The anomaly literature is put-centric; whether call spreads/condor call wings carry comparable expected P/L is UNKNOWN.
5. **ML vs. simple baselines:** Whether high-dimensional models beat IV−RV sorts OOS for option P/L is UNKNOWN in peer-reviewed literature (practitioner claims of low OOS R² ceilings are hypothesis-level only).
6. **Post-2010 / 0DTE-regime stability:** Most strong results use 1987–2010 samples; stability in the modern weekly/0DTE market structure is UNKNOWN.
7. **Shared datasets / publication bias:** Nearly all index-option studies reuse the same S&P 500 option datasets and the same 1987 crash peso-problem episode; independent-sample replication is scarce. Negative results are likely underpublished (INFERRED from the concentration of positive results on one dataset).

---

## RECOMMENDATIONS

**Deserve further investigation:**
- Direct conditional net-P/L regression on entry features (Goyal-Saretto/Cao-Han template), with OOS validation and the three cost scenarios — highest evidence-to-complexity ratio.
- SVIX/SD-bound expectation proxies as features or sanity checks (Martin; Constantinides) — minimal assumptions, forward-looking.
- Exposure decomposition (Israelov & Nielsen) as a mandatory diagnostic before any "alpha" claim.
- Muravyev-Pearson cost ranging and Constantinides-style trading-delay robustness as standard backtest protocol.

**Appear unnecessarily complex or insufficiently supported (for the mean-P/L question):**
- Full physical-distribution reconstruction — no primary source requires it for expected P/L; adds model risk (Broadie et al.).
- Multi-leg structures (iron condors) as the *initial* validation target — no empirical base, hardest reconstruction; start single-leg, then verticals.
- ML/high-dimensional models before beating the IV−RV linear baseline — unjustified given Lof (2019) and the literature's linear/sort-based successes.
- Sharpe-ratio-based strategy selection on short-option portfolios without non-normality-aware inference and margin accounting (Santa-Clara & Saretto; Broadie et al.).

**Inaccessible / unverifiable in this investigation:** full texts behind paywalls (JFE/JF/RFS publisher versions) — findings characterized from verified abstracts, author pages, and author-hosted materials; specific table statistics (e.g., Goyal-Saretto monthly return magnitudes, Driessen et al. 18% figure) are index-level and flagged as such. SSRN working-paper versions exist for Goyal-Saretto (abstract verified) and Constantinides et al. (abstract verified).

---

## EVIDENCE CLASSIFICATIONS (per major conclusion)

- Option returns are conditionally forecastable from entry info (IV−RV, IVOL, skewness, order flow): **VERIFIED** (multiple independent primary sources, abstract-level).
- Forecastable component is largely risk compensation, not pure alpha: **VERIFIED** (Bakshi-Kapadia, Israelov-Nielsen, Muravyev 2016, Cao-Han interpretations).
- Full distribution reconstruction unnecessary for expected P/L: **VERIFIED** (methods of all top sources).
- Statistical anomalies often within model noise / wide friction bounds: **VERIFIED** (Broadie et al., Figlewski).
- After-cost economic significance achievable OOS: **VERIFIED but CONTESTED** (Constantinides et al. 2010 positive; Wallmeier dispute unresolved).
- Mean-forecast improvement implies tail-risk improvement: **no evidence — treat as UNKNOWN; do not infer** (mission warning supported).
- No peer-reviewed iron-condor/managed-spread expectancy literature: **VERIFIED** (direct search).
- Specific performance statistics (22.7%/mo, 18% correlation premium, −57%/−30% put returns): **index-level, not primary-verified** — do not quote as established facts.
- Practitioner iron-condor backtests/books: **hypotheses only** per mission rules; excluded from evidence.

---

## SOURCES

All accessed signed-out on 2026-10-15. "Verified live" = page opened and content confirmed; "index" = found via search / citation record, content from snippets or abstracts.

| # | Source | URL | Accessed | Flag |
|---|---|---|---|---|
| 1 | Goyal & Saretto (2009), JFE — citation | https://EconPapers.repec.org/RePEc:eee:jfinec:v:94:y:2009:i:2:p:310-326 | 2026-10-15 | index |
| 2 | Goyal & Saretto (2007 SSRN WP) — abstract | https://papers.ssrn.com/sol3/papers.cfm?abstract_id=889947 | 2026-10-15 | verified live |
| 3 | Bakshi & Kapadia (2003), RFS — citation/abstract | https://EconPapers.repec.org/RePEc:oup:rfinst:v:16:y:2003:i:2:p:527-566 | 2026-10-15 | index |
| 4 | Bakshi & Kapadia companion (JoD 2003) — full PDF | http://people.umass.edu/~nkapadia/docs/Bakshi_Kapadia_JoD_Fall_2003.pdf | 2026-10-15 | index |
| 5 | Broadie, Chernov & Johannes (2009), RFS — citation via author CV | https://business.columbia.edu/sites/default/files-efs/person/cv/Broadie--Mark-CV_2022.pdf | 2026-10-15 | index |
| 6 | Broadie et al. — author slides (findings) | https://www.sambuz.com/doc/understanding-index-option-returns-ppt-presentation-941525 | 2026-10-15 | index |
| 7 | Santa-Clara & Saretto (2009) — OptionMetrics abstract | https://optionmetrics.com/research/p-santa-clara-and-a-saretto-option-strategies-good-deals-and-margin-calls/ | 2026-10-15 | verified live |
| 8 | Santa-Clara & Saretto (2009) — DOI record | https://doi.org/10.1016/j.finmar.2009.01.002 | 2026-10-15 | index |
| 9 | Constantinides, Jackwerth & Perrakis (2009) — citation | https://econpapers.repec.org/article/ouprfinst/v_3a22_3ay_3a2009_3ai_3a3_3ap_3a1247-1277..htm | 2026-10-15 | index |
| 10 | Constantinides et al. — NBER WP 14544 | https://EconPapers.repec.org/RePEc:nbr:nberwo:14544 | 2026-10-15 | index |
| 11 | Constantinides et al. (2010) — SSRN abstract | https://papers.ssrn.com/sol3/papers.cfm?abstract_id=1282085 | 2026-10-15 | verified live |
| 12 | Constantinides et al. (2021) reply to Wallmeier | https://EconPapers.repec.org/RePEc:now:jnlcfr:104.00000090 | 2026-10-15 | index |
| 13 | Constantinides et al. (2009) — OptionMetrics summary | https://optionmetrics.com/research/g-m-constantinides-j-c-jackwerth-and-s-perrakis-mispricing-of-sp-500-index-options/ | 2026-10-15 | index |
| 14 | Wallmeier critique — OptionMetrics summary | https://optionmetrics.com/research/m-wallmeier-mispricing-of-index-options-with-respect-to-stochastic-dominance-bounds/ | 2026-10-15 | index |
| 15 | Boyer & Vorkink (2014) — OptionMetrics abstract | https://optionmetrics.com/research/b-boyer-k-vorkink-stock-options-as-lotteries/ | 2026-10-15 | verified live |
| 16 | Cao & Han (2013), JFE — citation/abstract | https://ideas.repec.org/a/eee/jfinec/v108y2013i1p231-249.html | 2026-10-15 | index |
| 17 | Driessen, Maenhout & Vilkov (2009) — DOI record | http://dx.doi.org/10.1111/j.1540-6261.2009.01467.x | 2026-10-15 | index |
| 18 | Muravyev (2016), JF — citation | https://EconPapers.repec.org/RePEc:bla:jfinan:v:71:y:2016:i:2:p:673-708 | 2026-10-15 | index |
| 19 | Muravyev (2016) — OptionMetrics abstract | https://optionmetrics.com/research/d-muravyev-order-flow-and-expected-option-returns/ | 2026-10-15 | verified live |
| 20 | Muravyev & Pearson (2020), RFS — citation/abstract | https://EconPapers.repec.org/RePEc:oup:rfinst:v:33:y:2020:i:11:p:4973-5014. | 2026-10-15 | index |
| 21 | Martin (2017), QJE — citation/abstract | https://EconPapers.repec.org/RePEc:oup:qjecon:v:132:y:2017:i:1:p:367-433. | 2026-10-15 | index |
| 22 | Martin — author page, public SVIX data | https://personal.lse.ac.uk/martiniw/ | 2026-10-15 | index |
| 23 | Figlewski (1989), JF — full text | https://citeseerx.ist.psu.edu/document?doi=1bdff58ca0b0962ad29460925c7d41b0fd3261f0&repid=rep1&type=pdf | 2026-10-15 | index |
| 24 | Figlewski (1989) — author abstract page | https://pages.stern.nyu.edu/~sfiglews/documents/Figlewski-JF89-abstract.pdf | 2026-10-15 | index |
| 25 | Israelov & Nielsen (2014) — full text (mirror) | https://paperswithbacktest.com/api/paper/covered-call-strategies-one-fact-and-eight-myths/pdf | 2026-10-15 | index |
| 26 | Israelov et al. (2018) — AQR follow-up | https://www.aqr.com/-/media/AQR/Documents/Journal-Articles/Covering-the-world-global-evidence-on-covered-calls.pdf | 2026-10-15 | index |
| 27 | Battalio & Schultz (2006) — OptionMetrics abstract | https://optionmetrics.com/research/r-battalio-and-p-schultz-options-and-the-bubble/ | 2026-10-15 | verified live |

**Working notes:** 15 note files in `notes/` (one per source/topic), each recording URL, access date, verified-live vs index flag, and key facts. Cross-cutting reference lists (e.g., the AEA 2017 working paper's bibliography confirming Bondarenko 2014, Constantinides-Jackwerth-Savov 2013, Carr-Wu 2009, Coval-Shumway 2001 citations) are documented in `notes/counterevidence-model-risk.md`.

**Inaccessible:** publisher full texts (JFE/JF/RFS paywalls) — characterized from verified abstracts, author CVs/pages, and author-hosted materials; no statistics quoted beyond abstract-level claims except where explicitly flagged as index-level.