# EVA Prior-Art and Competitive-Landscape Investigation

**Date:** 2026-10-15. **Method:** web-index research (EconPapers/RePEc, SSRN, NBER, Federal Reserve, Chicago Fed, vendor documentation pages, GitHub code) plus one primary vendor page read in full. Labels: VERIFIED = primary evidence read; INFERRED = reasonable interpretation; SPECULATIVE = plausible, not established; UNKNOWN = insufficient evidence.

**Reference concept ("EVA"):** distinguishes (1) Q risk-neutral probabilities, (2) P physical probabilities, (3) expected payoff, (4) expected net profit after execution costs/financing, (5) risk compensation for systematic/tail risk, (6) alpha after risk exposures; used to compare HOLD / CLOSE / ROLL / HEDGE for multi-leg structures (iron condors, credit spreads, covered calls, calendar spreads, ratio backspreads) at entry and during the lifecycle, using historically calibrated probabilities.

---

## Executive Summary

**Bottom line: every conceptual component of EVA is established theory with decades of published prior art, and several commercial and open-source tools implement subsets of it. The Q-vs-P distinction, physical expected-option-return estimation, volatility-risk-premium measurement, Q→P transformations, dynamic derivative portfolio optimization, and even retail "expected value" trade-ranking all exist in published form. What is NOT found in public evidence is a single integrated system that computes historically-calibrated expected net P/L to compare HOLD / CLOSE / ROLL / HEDGE for existing multi-leg positions during the lifecycle, net of execution costs — and the absence of such a product may reflect that it is proprietary, or that the industry has learned the marginal value is low.**

Key facts established:

1. **Expected option returns under P are a 25-year-old literature.** Coval & Shumway (2001, JF) derived expected option returns and documented zero-beta ATM straddles losing ~3%/week; Broadie–Chernov–Johannes (2009, RFS) showed the "puzzling" negative put returns are *not inconsistent* with standard models — i.e., apparent edge is often risk compensation, the single most important caution for any EVA implementation.
2. **Q→P machinery is textbook.** Bliss & Panigirtzoglou (2004, JF) power-utility transform; Aït-Sahalia & Lo (1998 JF; 2000 JoE) nonparametric state-price-density estimation and implied risk-aversion estimation; Ross (2015) recovery theorem.
3. **The historically-calibrated expected-return signal that works is essentially one thing: realized-minus-implied volatility.** Goyal & Saretto (2009, JFE) sorted on RV−IV (~22.7%/mo long-short straddle, Sharpe ~0.71, gross); Goyal & Saretto (2025, RFS) then showed a 3-factor IPCA model explains nearly all 46 published option anomalies, and **after transaction costs (30% effective/quoted spread) ALL 46 strategies have negative alpha**. This is the strongest adverse finding: the edge EVA would try to harvest is, in the cross-section, statistically real but economically eliminated by costs.
4. **Volatility risk premium estimation is mature:** Bakshi & Kapadia (2003), Carr & Wu (2009), Bollerslev–Tauchen–Zhou (2009) — the VRP (model-free implied variance minus high-frequency realized variance) predicts market returns, explaining >15% of quarterly variation 1990–2005.
5. **Dynamic management optimization is published:** Liu & Pan (2003, JFE) closed-form dynamic derivative strategies with jumps/SV showing "sizable portfolio improvement"; Brandt–Santa-Clara–Valkanov (2009, RFS) parametric portfolio policies that directly optimize expected utility and explicitly accommodate transaction costs.
6. **Commercial "expected value" already exists — but Q-based, not P-based.** Option Alpha ranks Trade Ideas by EV and validated calibration on ~130k ideas (avg P/L tracked the theoretical EV line in a quiet, VIX<20 market) — but its probabilities are option-implied, its study assumed no management, no assignment, no costs, and calibration **collapsed entirely** for earnings-crossing trades. ORATS sells 300M+ pre-compiled backtests and proprietary "theoretical edge" metrics (D%/F%/S%, methodology undisclosed). tastytrade publishes management heuristics from long backtests (close at 50% max profit; exit/roll at 21 DTE; IV Rank gating) — rules, not per-position EV engines. OptionStrat, OptionNet Explorer, Market Chameleon offer POP/probability/backtest tools, all Q-based or historical-backtest-based, none a lifecycle HOLD/ROLL EV optimizer.
7. **Open-source EV calculators are almost all Q-based** (implied-probability POP × payoff). One exception found: `ollie1o1/options` computes per-leg edge as Black-Scholes on *realized* vol minus market price — a realized-vs-implied edge proxy — but it is entry-screening, not lifecycle management.
8. **Tail risk is where EV schemes die.** The AllianzGI Structured Alpha case (SEC primary source): a marketed-as-hedged complex options strategy lost >90% in some funds in March 2020; $5B+ restitution, $2.3B criminal fine. Any EVA that does not explicitly price tail/hedge reality is dangerous.
9. **Secrecy cuts against novelty claims.** Market-maker vol desks (Citadel Securities, DRW, Optiver, SIG) and systematic vol funds necessarily do expected-P&L-vs-cost analysis daily; that the workflow isn't published as "EVA" says nothing about whether it is practiced. Textbook treatments (e.g., Euan Sinclair's *Volatility Trading*) already teach expected-value position thinking to practitioners.

**Novelty classification: (C) — established techniques combined in a potentially distinctive workflow.** The six-way decomposition (Q / P / payoff / net P&L / risk compensation / alpha) is conceptually clean but each element is prior art; the lifecycle HOLD/CLOSE/ROLL/HEDGE comparison using historically calibrated P with explicit cost accounting is not found as a published integrated system, which is the only arguably distinctive part — and that distinctiveness is unproven against the strong adverse evidence on costs and calibration fragility.

---

## 1. Prior-Art Matrix

### (a) Risk-neutral valuation — VERIFIED (canonical, not re-derived this session)
Black–Scholes–Merton (1973), Breeden–Litzenberger (1978) state-price densities from ∂²C/∂K², Heston (1993) stochastic volatility. Industry-standard; uncontested.

### (b) Physical probability estimation — VERIFIED
- **Aït-Sahalia & Lo (1998)**, "Nonparametric Estimation of State-Price Densities Implicit in Financial Asset Prices," *Journal of Finance* 53, 499–547 — nonparametric SPD extraction from option cross-sections. https://www.princeton.edu/~yacine/research.htm
- **Aït-Sahalia & Lo (2000)**, "Nonparametric Risk Management and Implied Risk Aversion," *Journal of Econometrics* 94, 9–51 — joint option cross-section + underlying time series → implied risk-aversion estimator. https://EconPapers.RePEc.org/paper/nbrnberwo/6130.htm
- **Bliss & Panigirtzoglou (2004)**, "Option-Implied Risk Aversion Estimates," *Journal of Finance* 59(1) — canonical parametric Q→P: f_P(S_T) = f_Q(S_T)·S_T^(−γ) / E[S_T^(−γ)], γ via max log-likelihood of realized S_T. https://www.chicagofed.org/~/media/publications/working-papers/2001/wp2001-15r3-pdf.pdf
- **Ross (2015)**, "The Recovery Theorem," *JF* 70(2) — recovers P from Q under transition-independence (strong assumptions; cited for completeness, not re-verified this session).

### (c) Conditional expected option returns — VERIFIED
- **Coval & Shumway (2001)**, "Expected Option Returns," *JF* 56(3), 983–1009 — theory + zero-beta ATM straddle ≈ −3%/week. https://econpapers.repec.org/article/blajfinan/v_3a56_3ay_3a2001_3ai_3a3_3ap_3a983-1009.htm
- **Goyal & Saretto (2009)**, "Cross-section of option returns and volatility," *JFE* 94(2), 310–326 — RV−IV sorts; long-short straddle ≈ 22.7%/mo, Sharpe ≈ 0.71 (figures corroborated by secondary citation; flag). https://papers.ssrn.com/sol3/papers.cfm?abstract_id=889947
- **Bali & Hovakimian (2009)**, "Volatility Spreads and Expected Stock Returns," *Management Science* 55(11), 1797–1812 — negative relation between expected returns and RV−IV spread; positive link with call−put IV spread (jump-risk proxy). https://papers.ssrn.com/sol3/papers.cfm?abstract_id=1443848
- Cao–Han–Zhan (mission's citation): the specific paper was **not located** this session → UNKNOWN. Related located work: Christoffersen et al. (2018) "Liquidity risk and expected option returns" (cited in a working paper reviewed; not directly verified).

### (d) Volatility risk premium estimation — VERIFIED
- **Bakshi & Kapadia (2003)**, "Delta-Hedged Gains and the Negative Market Volatility Risk Premium," *RFS* 16(2), 527–566 — delta-hedged gains < 0; worse at high vol; VRP significant after jump fears. https://EconPapers.repec.org/article/ouprfinst/v_3a16_3ay_3a2003_3ai_3a2_3ap_3a527-566.htm
- **Carr & Wu (2009)**, "Variance Risk Premiums," *RFS* 22(3), 1311–1341 — synthetic variance swap rate from option portfolio; VRP = RV − synthetic rate; 5 indexes + 35 stocks. https://econpapers.repec.org/article/ouprfinst/v_3a22_3ay_3a2009_3ai_3a3_3ap_3a1311-1341.htm
- **Bollerslev, Tauchen & Zhou (2009)**, "Expected Stock Returns and Variance Risk Premia," *RFS* 22(11), 4463–4492 — VRP explains >15% of quarterly excess market returns, 1990–2005; +P/E → R² >25%. https://federalreserve.gov/econres/feds/expected-stock-returns-and-variance-risk-premia.htm
- Prokopczuk & Wese Simen (single-stock VRP, mission citation): **not located** this session → UNKNOWN.

### (e) Distributional risk estimation — VERIFIED
- **Israelov & Nielsen (2015)**, "Covered Calls Uncovered," *Financial Analysts Journal* 71(1) — performance attribution: short-vol is <10% of covered-call risk but Sharpe ≈ 1.0; the embedded "equity timing" exposure is ~¼ of risk and *uncompensated*; hedging it raises Sharpe by ≈ 0.16 (global study: https://www.aqr.com/-/media/AQR/Documents/Journal-Articles/Covering-the-world-global-evidence-on-covered-calls.pdf). Lesson: expected-return estimates that don't strip embedded exposures mislead.
- **Broadie, Chernov & Johannes (2009)**, "Understanding Index Option Returns," *RFS* 22(11), 4493–4529 — "puzzling" put returns (−60%/mo for 6% OTM; Sharpe 3–4× index; CAPM alpha −50%/mo) are *not inconsistent* with Black-Scholes/simple SV; ATM straddles hardest, consistent with jump premia/Peso/estimation risk. https://EconPapers.repec.org/paper/cprceprdp/6239.htm — the foundational caution that **negative expected option returns = risk compensation**, not alpha.
- **Constantinides, Czerwonko, Jackwerth & Perrakis (2011)**, "Are Options on Index Futures Profitable for Risk‐Averse Investors?," *JF* 66(4), 1407–1437 — stochastic-dominance-bound violations identify option writes that improve expected utility for *any* risk-averse investor **net of transaction costs and bid-ask spreads**, out-of-sample, 1983–2006 (secondary notes: selected-call writers 12.3–43.2%/mo vs 7.7% unfiltered; signals cluster in high-IV post-drop regimes — flag as secondary). https://nber.org/papers/w16302 — one of the few papers claiming *net-of-cost* expected-utility improvement, i.e., genuine alpha after costs.

### (f) Portfolio-level expected utility — VERIFIED
- **Liu & Pan (2003)**, "Dynamic derivative strategies," *JFE* 69(3), 401–430 — closed-form dynamic optimum with jumps + SV; derivatives used to exploit time-varying opportunity set; calibration to S&P 500 shows "sizable portfolio improvement." http://ideas.repec.org/a/eee/jfinec/v69y2003i3p401-430.html
- **Brandt, Santa-Clara & Valkanov (2009)**, "Parametric Portfolio Policies," *RFS* 22(9), 3411–3447 — parameterize weights directly on characteristics; maximize investor's *average utility* in sample; explicitly extendable to transaction costs; robust in/out of sample. https://EconPapers.repec.org/RePEc:oup:rfinst:v:22:y:2009:i:9:p:3411-3447
- Santa-Clara & Valkanov as a standalone options-management paper (mission citation): **not located**; the located joint work is Brandt–Santa-Clara–Valkanov (2009) above.

### (g) Dynamic position-management optimization — VERIFIED (partial)
- Liu & Pan (2003) and Brandt–Santa-Clara–Valkanov (2009) above are the academic core (dynamic/optimal derivative allocation).
- **tastylive "Market Measures" research** (industry, secondary descriptions): 16Δ SPY strangles 45 DTE 2005–2018 — managing at 50% max profit "protects profits" vs 25% target (Nov 6, 2019); for narrow-wing iron condors, managing winners at 50% is "not as effective" as for strangles (May 7, 2018). Doctrine: close at 50% max profit; manage/roll at 21 DTE regardless of P/L; roll untested side when breached; IV Rank gating. These are fixed-rule heuristics from backtests, not per-position EV optimization. https://www.ivoox.com/market-measures-november-6-2019-iv-audios-mp3_rf_44008481_1.html ; https://www.ivoox.com/en/market-measures-may-7-2018-audios-mp3_rf_25832683_1.html
- No published academic paper was found that optimizes the *HOLD vs CLOSE vs ROLL vs HEDGE* decision per-position using historically calibrated P → INFERRED gap in *published* literature.

---

## 2. Existing Implementations

| Vendor / Project | Structures covered | Existing-position mgmt (HOLD/CLOSE/ROLL/HEDGE)? | Entry vs lifecycle | Methodology (historical P vs implied Q) | Costs included? |
|---|---|---|---|---|---|
| **ORATS** (orats.com) — VERIFIED | Multi-leg incl. condors, verticals, calendars (1–4 legs) | No per-position EV lifecycle engine; backtests use fixed entry/exit rules | Entry (Trade Ideas) + rule-based backtest | 300M+ historical backtests + proprietary "theoretical edge" (D%/F%/S% — formula undisclosed); IV-vs-forecast vol comparisons | UNKNOWN for edge calc; backtester configurable |
| **Option Alpha** — VERIFIED | Iron condors, short put/call spreads (Trade Ideas) | Bots automate entries/exits on fixed rules; EV is an entry filter | Entry | **EV = Σ(xᵢ·pᵢ) with option-implied (Q) probabilities** — not historically calibrated P | No (validation study assumed no costs, no management, no assignment) |
| **OptionStrat** — VERIFIED | 50+ templates: covered calls, iron condors, straddles, etc. | Saved-strategy tracking, backtest; no EV optimizer | Entry + tracking | "Chance of profit" = Q-based; optimizer ranks by chance of profit / return | Optional commission input |
| **OptionNet Explorer** — VERIFIED (secondary) | Complex multi-leg, portfolio-level | Manual "back-trading" simulator; Monte Carlo w/ custom probability assumptions → shows "expected returns" | Entry + manual lifecycle replay | User-supplied assumptions; historical option prices for replay | UNKNOWN |
| **tastytrade/tastylive** — VERIFIED (secondary) | Strangles, iron condors, verticals, jade lizards | Fixed management doctrine (50% take, 21 DTE, rolls) from long backtests | Entry + rule-based lifecycle | Historical backtests; POP tooling Q-based | Not in published study details |
| **Market Chameleon** — VERIFIED | Straddles, wings, earnings strategies | Backtest screeners; no per-position EV | Entry/backtest | Historical backtests; "Historical Odds" outcome distributions | UNKNOWN |
| **SteadyOptions** — VERIFIED | Iron condors, calendars, butterflies, earnings plays | Discretionary management | Entry + discretionary | Discretionary | Excluded from reported performance |
| **GitHub: polygon-io/massive-com iron-condor screeners** — VERIFIED | Iron condors | No | Entry | PoP from BS with IV (Q-based) | No |
| **GitHub: trextrader/spy-iron-condor-trading** — VERIFIED | Iron condors | No | Entry | PoP lognormal-Q; EV = E_Q[payoff] Monte Carlo — risk-neutral EV | UNKNOWN |
| **GitHub: ollie1o1/options** — VERIFIED | Credit spreads, iron condors | No | Entry | Per-leg edge = BS on **realized** vol minus market price, netted across legs incl. costs — the closest open-source analog to a physical expected-value calculator | Yes (round-trip cost model) |
| Institutional (Bloomberg, Cboe LiveVol, Trade Alert, Numerix, FINCAD, Hanweck/SpotGamma) | — | No public evidence of any | — | UNKNOWN (proprietary) | — |

**Net assessment:** No vendor or open-source project found computes expected net P/L from historically calibrated P for HOLD/CLOSE/ROLL/HEDGE comparisons on live positions. Commercial "expected value" (Option Alpha) and "edge" (ORATS) products are Q-based or backtest-based. The ollie1o1/options realized-vol edge is the nearest open-source analog and is entry-only.

---

## 3. Candidate Quantitative Methods

| Method | Strengths | Limitations | Data requirements | Published validation (with dates) |
|---|---|---|---|---|
| **Historical conditional expectancy** (e.g., RV−IV sorts) | Simple, transparent; strongest empirical track record in options | Signal is essentially one factor; decays; costs kill it | OptionMetrics history + realized vol | Goyal & Saretto (2009) JFE; Goyal & Saretto (2025) RFS — 46 anomalies explained by 3-factor IPCA; **costs make all alphas negative** |
| **Q→P transformations** (power-utility kernel; nonparametric SPD + risk-aversion estimate) | Principled; separates beliefs from preferences; uses full cross-section | γ unstable; tail estimation fragile (Figlewski's critique); kernel misspecification | Full strike cross-section + underlying history | Bliss & Panigirtzoglou (2004) JF; Aït-Sahalia & Lo (1998 JF; 2000 JoE) |
| **Variance risk premium models** (synthetic var-swap rate vs RV) | Directly measures the dominant priced risk in index options; predicts returns | Index-level; weaker in single names; timing not sizing | Option panels + high-frequency underlying data | Carr & Wu (2009) RFS; Bollerslev–Tauchen–Zhou (2009) RFS (>15% of quarterly return variation, 1990–2005) |
| **Parametric return distributions** (GARCH/SV/jump-diffusion P) | Full P density → any payoff's expectation; dynamic | Estimation risk (Broadie et al.'s "estimation risk" caveat); Peso problems; model risk | Long underlying return history | Broadie–Chernov–Johannes (2009): even simple SV explains put returns — models fit, but distinguishing risk premium from mispricing is hard |
| **Nonparametric methods** (kernel SPD, empirical payoff distributions) | Few assumptions | Data-hungry in tails; bandwidth sensitivity; curse of dimensionality for multi-leg | Dense strike grids, long histories | Aït-Sahalia & Lo (1998); Figlewski's practical critique of tail estimation |
| **Machine learning** (direct return prediction, IPCA) | Captures interactions; IPCA disciplines the zoo | Overfitting; most "anomalies" are one factor (RV−IV); costs | Large panels | Goyal & Saretto (2025) RFS: 3-factor IPCA explains 46 anomalies |
| **Monte Carlo simulation** (under P or Q) | Handles any multi-leg/exotic payoff; path-dependence | Garbage-in-garbage-out on the P calibration; tail model risk | Calibrated P process | Industry standard (OptionNet Explorer); academic: Liu & Pan (2003) calibration |
| **Direct payoff regression** (historical P&L conditional on observables) | Directly estimates E[net P&L \| state]; includes costs naturally | Selection/survivorship bias; regime change; needs management-policy conditioning (HOLD vs ROLL changes the payoff being regressed) | Historical trades with fills + costs | tastytrade backtests (heuristic rules, not regressions); no published per-decision regression engine found |

---

## 4. Evidence For and Against Economic Value

### For (with cost/bias caveats as reported)
- Goyal & Saretto (2009): RV−IV long-short straddle ≈ 22.7%/mo, Sharpe ≈ 0.71 — **gross of costs**; robust to characteristics/liquidity/factors. (VERIFIED via SSRN abstract + secondary corroboration of magnitudes.)
- Constantinides et al. (2011): bound-violation call writes improve expected utility for any risk-averse investor **net of transaction costs and bid-ask spreads**, out-of-sample 1983–2006. (VERIFIED via NBER abstract.) One of very few net-of-cost positive results.
- Bollerslev–Tauchen–Zhou (2009): VRP predicts market returns (R² >15% quarterly) — evidence that a P-vs-Q wedge is real and forecastable. (VERIFIED.)
- Option Alpha (2023, vendor study): EV buckets calibrated to realized avg P/L in a quiet regime — but **no costs, no management, no assignment, 30-day sample, VIX<20**. (VERIFIED from vendor page; weak external validity.)

### Against (reported prominently)
- **Goyal & Saretto (2025), RFS 38(6):** 46 anomalies → 3-factor IPCA (first factor = RV−IV) leaves avg alpha ≈ 6bp/mo; at 30% effective/quoted spreads, **all 46 IPCA alphas turn negative**. The cross-sectional edge EVA would trade is, net of realistic costs, zero or negative. (VERIFIED via detailed research notes describing the RFS paper; paper DOI 10.1093/rfs/hhae087.)
- **Broadie–Chernov–Johannes (2009):** negative expected put returns are consistent with Black-Scholes/SV — apparent "edge" is risk compensation (Peso problems, jump premia, estimation risk). An EVA that labels risk compensation as "alpha" will manufacture false signals. (VERIFIED.)
- **Option Alpha's own finding:** EV calibration "not correlated ... whatsoever" for earnings-crossing trades — the probability input fails exactly when risk is highest. (VERIFIED.)
- **Israelov & Nielsen (2015):** ~¼ of covered-call risk is uncompensated equity-timing exposure — expected-P/L figures that don't attribute embedded exposures mislead. (VERIFIED.)
- **AllianzGI Structured Alpha (SEC, 2022):** marketed-as-hedged options strategy, no effective hedges, >90% losses in some funds (Mar 2020), $5B+ restitution / $2.3B criminal fine / $675M SEC penalty. Expected-value frameworks that underweight tails and hedge failure modes destroy capital. (VERIFIED via SEC.gov.)
- **tastytrade (May 2018):** managing winners at 50% helps strangles but is "not as effective" for narrow iron condors — management rules don't transfer across structures; a lifecycle EV engine must be structure-specific. (VERIFIED via segment description.)

### Bias treatment in the literature
Transaction costs: the central determinant — Goyal–Saretto (2025) and Constantinides et al. (2011) treat them explicitly with opposite conclusions (eliminates vs survives), which brackets the debate. Selection/survivorship: backtest-based vendor tools (ORATS 300M backtests) explicitly warn the best of many backtests overstates future results (IBKR/ORATS 2026 article). Overfitting: the 46-anomaly zoo collapsing to one IPCA factor is the cautionary tale. Out-of-sample: Constantinides et al. use genuine OOS SSD tests; most vendor backtests are in-sample-optimized.

---

## 5. Commercial Capability Comparison

**Marketing vs verifiable reality:**
- **ORATS** markets "proprietary edge calculations" and 300M+ backtests — verifiable: the backtest count, the Trade Ideas ranking by POP/Sharpe, the 15+ years of data, the IV-vs-forecast comparisons. **Not verifiable:** the D%/F%/S% edge formulas (proprietary). No lifecycle HOLD/ROLL EV engine is documented.
- **Option Alpha** markets "+EV" automation — verifiable: the EV formula Σ(xᵢ·pᵢ), the Trade Ideas product, the 130k-idea calibration study with its stated assumptions. **The fine print matters:** probabilities are implied (Q), costs/management/assignment excluded, calibration fails around earnings. This is the closest commercial product to "expected value for multi-leg spreads," and it is **not** historically calibrated P and **not** a lifecycle tool.
- **tastytrade** markets research-driven management — verifiable: specific studies (dates, universes, rules) and the concrete doctrine (50% profit target, 21 DTE). This is the closest commercial analog to *lifecycle* decision support, but it is fixed heuristics, not per-position expected-value computation.
- **OptionStrat / Market Chameleon / OptionNet Explorer** — verifiable: POP (Q-based), backtesting, scenario/Monte Carlo tools. None claims expected net-P/L lifecycle optimization.
- **SteadyOptions** — verifiable: defined-risk multi-leg strategies, published (self-reported, commission-excluded) track record; no analytics product at all.
- **Institutional (Bloomberg/Cboe LiveVol/Trade Alert/Numerix/FINCAD/Hanweck)** — no public documentation of expected-net-P/L or HOLD/ROLL engines found; treat as UNKNOWN, not as absent.

---

## 6. Novelty Assessment

**Classification: (C) — established techniques combined in a potentially distinctive workflow.**

Reasoning:
- (A) "Established theory" is true of every component: Q/P separation (Bliss–Panigirtzoglou 2004; Aït-Sahalia–Lo 1998/2000), physical expected option returns (Coval–Shumway 2001; Goyal–Saretto 2009), VRP estimation (Bakshi–Kapadia 2003; Carr–Wu 2009; BTZ 2009), risk-compensation-vs-alpha attribution (Broadie–Chernov–Johannes 2009; Israelov–Nielsen 2015), dynamic derivative optimization (Liu–Pan 2003; Brandt–Santa-Clara–Valkanov 2009), and retail expected-value trade ranking (Option Alpha).
- (B) "Established implementation" is false for the *integrated* concept: no public system was found that computes historically-calibrated expected net P/L across HOLD/CLOSE/ROLL/HEDGE for live multi-leg positions. But commercial Q-based EV (Option Alpha) and heuristic lifecycle management (tastytrade) each cover part of the workflow, and open-source realized-vol edge calculators (ollie1o1/options) cover the entry-screening part.
- The genuinely hard, unproven parts are exactly the ones the literature flags as fragile: (i) estimating P well enough that E_P[net P&L] beats E_Q by more than costs (Goyal–Saretto 2025 says costs win); (ii) separating risk compensation from alpha (Broadie et al. 2009); (iii) calibration around events (Option Alpha's earnings failure); (iv) tail risk (AllianzGI).
- (D) "Plausibly novel research direction" overstates it: the direction is well-trodden; only the specific *packaging* (six-way decomposition + lifecycle decision framing) lacks a public counterpart.
- (E) "Unsupported/falsified" is too strong: Constantinides et al. (2011) show net-of-cost expected-utility improvement is *possible* in-sample-identified, out-of-sample-tested form.

**Skeptical summary:** EVA's conceptual distinctions are all prior art. Its only candidate distinctiveness is workflow integration (historical-P expected net P&L driving HOLD/CLOSE/ROLL/HEDGE on live positions) — and the public evidence suggests that gap exists either because it is proprietary (market-maker desks do this daily) or because the net-of-cost economics don't support a product (Goyal–Saretto 2025).

---

## 7. Secrecy and Publication Bias

- **INFERRED:** Systematic vol market-makers (Citadel Securities, SIG, DRW, Optiver, Ronin) and vol funds (Capstone, Parallax; PIMCO/BlueCrest vol strategies) must compute expected hedging P&L vs costs continuously — this is the core market-making function, taught in practitioner texts (e.g., Sinclair's *Volatility Trading*). Absence of a publication titled "EVA" is not evidence the workflow is unused; it is evidence it is either proprietary or considered obvious infrastructure.
- **VERIFIED (SEC.gov):** AllianzGI Structured Alpha — $5B+ restitution, $2.3B criminal fine, $675M SEC civil penalty; marketed hedged options strategy with no effective hedges; >90% losses in some funds in March 2020. Indirect evidence that (a) sophisticated institutions run large-scale options expected-return operations, and (b) tail-risk mismeasurement, not probability miscalibration, is the dominant failure mode. https://www.sec.gov/enforcement-litigation/distributions-harmed-investors/matter-allianz-global-investors-us-llc-admin-proc-file-no-3-20855
- **INFERRED:** Roni Israelov's practitioner research program (AQR/NDVR: "Pathetic Protection" 2017; "Being Right is Not Enough" 2018; "Tail Risk Hedging" 2020) is the closest public analog to institutional lifecycle expected-value thinking for options overlays. "TrueDay" (mission mention) was not located → UNKNOWN.
- Publication bias cuts both ways: profitable edges stay unpublished (bias toward finding "no public system"), while published anomalies overstate gross edge and understate costs (bias toward finding "edge exists"). Both biases were directly observed in this investigation.

---

## 8. Open Research Questions

1. Can any historically-calibrated P estimator produce E_P[net P&L] estimates for multi-leg structures that survive *realistic* retail/institutional transaction costs out-of-sample, given Goyal–Saretto (2025)'s negative result for 46 anomalies?
2. What is the marginal value of a per-position HOLD/CLOSE/ROLL/HEDGE EV computation over tastytrade-style fixed heuristics (50% take, 21 DTE)? No public horse race exists.
3. How should the Q→P wedge be decomposed per-position into (5) risk compensation vs (6) alpha — i.e., can EVA's own taxonomy be operationalized, or does Broadie–Chernov–Johannes's identification problem make it unidentifiable in practice?
4. How does EV calibration behave around events (earnings, FOMC) where Option Alpha's own study shows total calibration failure?
5. What utility/risk framework disciplines position-level EV decisions — expected utility (Constantinides et al.), parametric policies (Brandt et al.), or drawdown/tail constraints (AllianzGI lesson)?
6. Does the lifecycle component add value beyond entry selection — i.e., is expected net P&L *conditional on the position's current state* forecastable, or is theta/gamma path-dependence unforecastable noise?

---

## 9. Recommended Next Research Directions

1. **Replicate Goyal–Saretto (2025)'s cost analysis** on the specific multi-leg structures EVA targets (iron condors, calendars, ratio backspreads), since their 46 strategies may not include them — this is the make-or-break empirical test.
2. **Horse-race the methods in §3** on a common historical options dataset (entry + lifecycle decisions, net of borrow/commission/spread costs, out-of-sample, with White/Hansen reality-check or deflated Sharpe multiple-testing correction).
3. **Study the Q→P identification problem directly:** estimate Bliss–Panigirtzoglou γ and Aït-Sahalia–Lo risk aversion in rolling windows; test stability — if γ is unstable, EVA's P is built on sand.
4. **Investigate practitioner implementations:** Euan Sinclair's *Volatility Trading* (2008/2013) and Taleb's *Dynamic Hedging* for the market-maker's expected-P&L workflow — the closest published "prior art" for the lifecycle component.
5. **Tail-risk accounting:** integrate CVaR/expected-shortfall and explicit hedge-failure scenarios (the AllianzGI lesson) before any expected-value framing is trusted.
6. **Patent search** on expected-value-based options management engines (not completed this session) to check for filed-but-uncommercialized implementations.

---

## FINAL QUESTION

**What, if anything, is genuinely distinctive about EVA compared with existing quantitative options analytics, and what established methods should be investigated before attempting to invent new ones?**

**Distinctive:** Almost nothing at the component level — the Q/P distinction, physical expected-return estimation, VRP measurement, Q→P transforms, risk-compensation-vs-alpha attribution, dynamic derivative optimization, and even retail "expected value" trade ranking are all established prior art with 20+ year pedigrees. The *only* candidate-distinctive element is the **integrated lifecycle workflow**: computing historically-calibrated expected net P&L (after costs/financing) to choose among HOLD / CLOSE / ROLL / HEDGE for *existing* multi-leg positions. No published paper, commercial product, or open-source tool found in this investigation does that as one system (commercial tools do Q-based entry EV or fixed-rule lifecycle heuristics; open-source does Q-based screening with one realized-vol-edge exception). Whether that gap reflects proprietary practice or lack of economic value is **not resolvable from public evidence** — and Goyal & Saretto (2025)'s finding that transaction costs eliminate all 46 anomaly alphas is a strong reason to suspect the latter.

**Investigate before inventing:** (1) Goyal & Saretto (2009 → 2025) — the RV−IV signal and its cost-driven death; (2) Broadie–Chernov–Johannes (2009) — risk compensation vs mispricing identification; (3) Bliss & Panigirtzoglou (2004) and Aït-Sahalia & Lo (1998/2000) — Q→P machinery; (4) Carr & Wu (2009) and Bollerslev–Tauchen–Zhou (2009) — VRP measurement and its return predictability; (5) Liu & Pan (2003) and Brandt–Santa-Clara–Valkanov (2009) — dynamic/utility-based derivative optimization with transaction costs; (6) Constantinides et al. (2011) — the rare net-of-cost positive result and its SSD methodology; (7) Israelov & Nielsen (2015) — embedded-exposure attribution; (8) Option Alpha's EV methodology and its published calibration study — the closest commercial implementation, including its documented failure modes (earnings, no costs); (9) practitioner texts (Sinclair, Taleb) for the market-maker lifecycle workflow; (10) the AllianzGI Structured Alpha enforcement record as the tail-risk counterexample. Any new work that cannot beat the Goyal–Saretto (2025) cost critique and the Broadie–Chernov–Johannes identification critique should not proceed past the literature stage.

---

## Sources

**Academic (primary bibliographic/abstract evidence, read 2026-10-15, index):**
1. Coval, J. & Shumway, T. (2001). "Expected Option Returns." *J. Finance* 56(3), 983–1009. https://econpapers.repec.org/article/blajfinan/v_3a56_3ay_3a2001_3ai_3a3_3ap_3a983-1009.htm
2. Broadie, M., Chernov, M. & Johannes, M. (2009). "Understanding Index Option Returns." *RFS* 22(11), 4493–4529. https://EconPapers.repec.org/paper/cprceprdp/6239.htm
3. Goyal, A. & Saretto, A. (2009). "Cross-section of option returns and volatility." *JFE* 94(2), 310–326. https://papers.ssrn.com/sol3/papers.cfm?abstract_id=889947
4. Goyal, A. & Saretto, A. (2025). "Can Equity Option Returns Be Explained by a Factor Model? IPCA Says Yes." *RFS* 38(6), 1783–1821. DOI 10.1093/rfs/hhae087 (via https://github.com/moremeds/unusual-whales/blob/HEAD/docs/research/goyal-saretto-ipca-options/README.md)
5. Bollerslev, T., Tauchen, G. & Zhou, H. (2009). "Expected Stock Returns and Variance Risk Premia." *RFS* 22(11), 4463–4492. https://federalreserve.gov/econres/feds/expected-stock-returns-and-variance-risk-premia.htm
6. Bliss, R. & Panigirtzoglou, N. (2004). "Option-Implied Risk Aversion Estimates." *J. Finance* 59(1). https://www.chicagofed.org/~/media/publications/working-papers/2001/wp2001-15r3-pdf.pdf
7. Aït-Sahalia, Y. & Lo, A. (1998). "Nonparametric Estimation of State-Price Densities Implicit in Financial Asset Prices." *JF* 53, 499–547; and (2000). "Nonparametric Risk Management and Implied Risk Aversion." *J. Econometrics* 94, 9–51. https://www.princeton.edu/~yacine/research.htm
8. Bakshi, G. & Kapadia, N. (2003). "Delta-Hedged Gains and the Negative Market Volatility Risk Premium." *RFS* 16(2), 527–566. https://EconPapers.repec.org/article/ouprfinst/v_3a16_3ay_3a2003_3ai_3a2_3ap_3a527-566.htm
9. Carr, P. & Wu, L. (2009). "Variance Risk Premiums." *RFS* 22(3), 1311–1341. https://econpapers.repec.org/article/ouprfinst/v_3a22_3ay_3a2009_3ai_3a3_3ap_3a1311-1341.htm
10. Bali, T. & Hovakimian, A. (2009). "Volatility Spreads and Expected Stock Returns." *Management Science* 55(11), 1797–1812. https://papers.ssrn.com/sol3/papers.cfm?abstract_id=1443848
11. Constantinides, G., Czerwonko, M., Jackwerth, J.C. & Perrakis, S. (2011). "Are Options on Index Futures Profitable for Risk‐Averse Investors?" *JF* 66(4), 1407–1437. https://nber.org/papers/w16302
12. Liu, J. & Pan, J. (2003). "Dynamic derivative strategies." *JFE* 69(3), 401–430. http://ideas.repec.org/a/eee/jfinec/v69y2003i3p401-430.html
13. Brandt, M., Santa-Clara, P. & Valkanov, R. (2009). "Parametric Portfolio Policies." *RFS* 22(9), 3411–3447. https://EconPapers.repec.org/RePEc:oup:rfinst:v:22:y:2009:i:9:p:3411-3447
14. Israelov, R. & Nielsen, L. (2015). "Covered Calls Uncovered." *Financial Analysts J.* 71(1). https://assets.super.so/e46b77e7-ee08-445e-b43f-4ffd88ae0a0e/files/81be3cf6-33d8-4640-876b-fbb5d133e73a.pdf ; global extension: https://www.aqr.com/-/media/AQR/Documents/Journal-Articles/Covering-the-world-global-evidence-on-covered-calls.pdf

**Vendor / commercial (index + one full page read):**
15. Option Alpha — "Probability & Performance: Expected Value vs. Realized P/L" (read in full 2026-10-15, verified live). https://OptionAlpha.com/blog/trade-ideas-expected-value-probability-and-performance
16. ORATS — Trade Ideas. https://orats.com/trade-ideas ; University review (four pillars). https://orats.com/university/review ; scanner edge blog. https://ORATS.com/blog/best-option-scanners-of-2025
17. IBKR Campus — "How to Set Up Interactive Brokers and ORATS in Claude" (Sept 2026; 300M backtests; backtest-selection bias warning). https://www.interactivebrokers.com/campus/ibkr-quant-news/how-to-set-up-interactive-brokers-and-orats-in-claude/
18. OptionStrat. https://optionstrat.com ; review. https://thenerdynoob.com/optionstrat-review/
19. OptionNet Explorer reviews. https://bullishbears.com/optionnet-explorer-review/ ; https://optionstradingiq.com/using-optionnet-explorer-to-study-options-strategies/
20. tastylive Market Measures segments (via iVoox listings). https://www.ivoox.com/market-measures-november-6-2019-iv-audios-mp3_rf_44008481_1.html ; https://www.ivoox.com/en/market-measures-may-7-2018-audios-mp3_rf_25832683_1.html
21. Market Chameleon. https://marketchameleon.com
22. SteadyOptions. https://steadyoptions.com

**Open source (index):**
23. https://github.com/ollie1o1/options/commit/eaa3de622d0a54ff5b38622178af42bfa066f48a (realized-vol edge EV)
24. https://github.com/trextrader/spy-iron-condor-trading/blob/HEAD/docs/plans/implementation_plan_v43_full.md (risk-neutral EV via Monte Carlo)
25. https://github.com/polygon-io/community/blob/HEAD/examples/rest/options-iron-condor/README.md ; https://github.com/massive-com/community/blob/HEAD/examples/rest/options-iron-condor/README.md (Q-based PoP screeners)

**Regulatory / enforcement (primary):**
26. SEC — In the Matter of Allianz Global Investors U.S. LLC, File No. 3-20855 (May 17, 2022). https://www.sec.gov/enforcement-litigation/distributions-harmed-investors/matter-allianz-global-investors-us-llc-admin-proc-file-no-3-20855

**Working notes:** notes/note-01-academic-prior-art.md, notes/note-02-commercial-open-source.md, notes/note-03-methods-negative-secrecy.md (in this research directory).

**Could not verify:** Cao-Han-Zhan specific paper; Prokopczuk & Wese Simen single-stock VRP paper; Israelov "TrueDay" product; exact Goyal–Saretto (2009) Sharpe 0.71 from primary tables (secondary corroboration only); ORATS D%/F%/S% edge formulas (proprietary); any institutional HOLD-vs-ROLL expected-value engine (proprietary/unknown); patent landscape for EV-based options engines (not searched).