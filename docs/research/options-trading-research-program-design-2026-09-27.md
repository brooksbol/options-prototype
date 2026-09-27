# Options Trading Research Program Design
*Long-horizon research program: understanding options trading as a domain, derived independently from the domain itself — not from practitioner-education channels.*

Evidence labels used throughout: **VERIFIED** (read directly on a primary/secondary source in this investigation) · **IDENTIFIED-TRACEABLE** (specific named source located via search; contents known via abstracts, working-paper quotes, or consistent multi-outlet reporting; not directly read) · **INFERENCE** (analyst inference) · **ABSENCE-OF-EVIDENCE** (searched, no adequate source located).

Most paper-level claims below are IDENTIFIED-TRACEABLE. Directly read (VERIFIED): the SEC's Oct-2021 GameStop press release, OCC market-data pages, CBOE fee-schedule SEC filings, and several bookseller/publisher pages confirming professional books' existence. One access failure recorded: EconBiz (Muravyev & Pearson record) blocked by a bot wall — not retried per policy.

---

## 1. Executive finding

The highest-value research program for options trading is **not a better test of the practitioner canon** (45-DTE / 50%-profit / 21-DTE rule sets). The canon's gross expectancy is already approximately known — weak-positive on index underlyings, net of realistic retail execution probably near zero or negative — and further refining that number has sharply diminishing returns.

The investigation surfaced a different, higher-value landscape. Four findings dominate:

1. **The premium has a known recipient, and it is not the retail premium-seller.** The best-identified empirical facts in the domain are about *intermediaries*: Muravyev & Pearson (RFS 2020) show execution-timing traders pay ~1/5 the conventional effective spread — but that discount accrues to proprietary/institutional timers, not retail; FMA 2025 "Intermediary Option Pricing" shows most of the option risk premium is earned over nights and weekends, when retail cannot trade; Beckmeyer–Branger–Gayda (2023) measure retail 0DTE losses of ~$184k–$358k/day with spreads as the mechanism. The falsifiable, high-value question is not "does selling premium work" but **"who captures the documented premium, through which mechanical channels, and what is left at retail execution."** This question never appeared in the practitioner corpus.
2. **The index→single-name boundary failure cuts both ways, and the reverse direction is the dangerous one.** Driessen–Maenhout–Vilkov attribute the index variance risk premium *entirely* to priced correlation risk: selling index vol = selling correlation. The unasked corollary: a "diversified" book of single-name short-premium trades is structurally **long correlation exactly when correlation spikes** — i.e., the portfolio concentrates in the state where the premium turns negative. Correlated tail loss at the portfolio level is the mechanism the practitioner corpus never discusses, and the academic literature measures the ingredients (correlation risk premium, dealer gamma feedback, crisis correlation spikes) without assembling them into the retail portfolio-aggregation question.
3. **India is the best natural experiment in the field and is nearly unused by US-centric research.** SEBI's population-scale studies (FY22–FY25) show ~91% of individual F&O traders lose money, aggregate FY25 losses of ₹1.06 lakh crore (~$12.5B), with loss concentration by trading intensity and ~90% year-to-year loss persistence — plus the 2025 Jane Street enforcement (₹36,700 crore gains over 26 months, ₹4,850 crore disgorgement ordered) giving the *other side of the ledger*. Weekly index expiries, full regulator measurement, and an identified winner make this the closest thing the domain has to a controlled retail-options experiment.
4. **Several attractive directions are low-information.** Another SPY strangle backtest, debating 30 vs 45 DTE, cross-sectional ML on option surfaces without cost modeling, or retelling Volmageddon add approximately nothing. The program should be organized as falsification waves: Wave 1 establishes net-of-retail-execution baselines and the VRP boundary matrix; each subsequent wave is chosen by what Wave N falsifies.

---

## 2. What the practitioner corpus can and cannot establish

(Corpus per background: 8 practitioner corpora, ~97 primary items, ~26h speech. Lineage facts below from search-identified secondary compilations of tastylive/Option Alpha materials — IDENTIFIED-TRACEABLE.)

**It can establish:**
- **Lineage, not confirmation.** The 45-DTE / 16–30 delta / 50%-profit / 21-DTE / roll-for-credit rule set traces to tastylive's Market Measures research stream (named internal studies: Fabian 2016 on strangles and managing losers; Zeng 2024 on 21-DTE loss-halving). Its ubiquity across educators is shared ancestry — one ancestral claim repeated, not independent replication. (Classification: shared intellectual lineage → derivative education → marketing repetition.)
- **Gross-expectancy bounds on the canonical implementation.** Three independent replications are traceable: SteadyOptions SPX 16-delta 2001–2020, no costs — 45/50%/21 rule 4.44% CAGR / Sharpe 0.52 vs a passive 30-DTE-entry/5-DTE-exit 5.46%/0.67; SJ Options 2005–2016 with IVR>50 filter and 2×-credit stop — ~0%/yr at 15% margin usage, negative at 20%+ allocation; dtr-trading 2007–2018 — all six exit variants profitable gross. tastylive's own SPY data (2005–present, self-reported): 30/16/5-delta strangles managed at 50% win 81%/90%/97%. So the corpus + replications bound the *gross* index strangle at roughly 0–5%/yr before frictions — INFERENCE from these traceable numbers.
- **Vocabulary-behavior mapping (the false-consensus finding).** Shared phrases ("be the casino," "trade small") conceal incompatible implementations — this is a finding *about discourse*, valid within its method, and it is the corpus's genuine contribution: it tells you what the corpus cannot tell you.
- **What practitioners systematically omit**: correlated tail losses, portfolio survival, opportunity cost, capped upside, crowding, assignment economics, earnings gaps, correlation risk, long-vol alternatives, benchmarks. This absence inventory is itself evidence — but only about discourse, not about markets.

**It cannot establish:**
- **Net expectancy at retail execution.** No flagship practitioner backtest models commissions + slippage + spreads with a disclosed model (the 170,500-trade SPY replication's commission model is undisclosed; its 20.77%-of-profits figure is therefore non-reusable). ABSENCE-OF-EVIDENCE for any practitioner net-of-friction canon test.
- **Causal mechanisms.** The corpus asserts regularities (manage at 21 DTE because gamma accelerates; roll for a credit) without distinguishing selection effects, risk-premium harvesting, or microstructure artifacts. Nothing in the corpus adjudicates between "21-DTE works because gamma" vs "21-DTE works because it cuts exposure to the loss tail."
- **Generalization boundaries.** Index-shaped mechanics are applied to single names without stating the boundary; no corpus distinguishes which claims are index-only.
- **Whether the edge, if any, is compensation for tail risk vs. mispricing.** Practitioners rarely frame premium as insurance compensation; the corpus cannot test the insurance-premium hypothesis.
- **Counterfactuals.** No practitioner source tests the canon against long-vol, trend, or cash alternatives on matched risk.

---

## 3. The major unanswered questions

1. What fraction of the documented index VRP survives **actual retail execution** (realized fills vs midpoint marks)? — tests the gross→net and midpoint→executable boundaries.
2. **Who earns the premium?** Decompose the other side: intermediaries/market makers/wholesalers via origin-coded data (CBOE Open-Close), execution-timing heterogeneity, night/weekend returns.
3. Does trade-level expectancy survive **portfolio aggregation** under realistic cross-underlying correlation in stress? — the missing joint-distribution math.
4. What is the true **capital occupation** of the canon (margin expansion in crises, buying-power reduction), and how does return-on-occupied-capital compare to alternatives?
5. **Which popular rules were never independently tested** — full inventory with evidence grades (45/50/21 composite is the flagship; also IVR thresholds, "roll for a credit," delta targets).
6. Is the VRP **eroding** (crowding)? Time-series of index VRP and strategy-index Sharpe by decade; 2010s condor collapse (CNDR Sharpe −0.07) as case study.
7. What is the **assignment/early-exercise drag** on short-call strategies around dividends, and on short puts around corporate actions? (Poteshman–Serbin only covers exercise mistakes; the economics are unmeasured.)
8. Does **dealer gamma positioning predict option returns** (not just stock returns)? The feedback literature studies stocks; the option-side predictability is the trader-relevant question.
9. What is the **opportunity cost** — matched-risk comparison vs long-vol, trend-following, or de-risked equity (AQR's alternatives)?
10. How does **0DTE change the evidence** — does any pre-2022 finding transfer to a market where >50–60% of SPX volume is same-day?
11. What are the **accounting-vs-economic return** mechanics: is "premium income" partly a drawdown reserve being consumed (income illusion)?
12. What happens under **correlated margin calls**: portfolio-level forced liquidation as the ruin mechanism (distinct from trade-level max loss)?
13. What is the **loss-attribution** of retail derivatives losses (India data): spreads vs adverse selection vs behavioral timing vs leverage?
14. Which findings depend on **dead market structure** (floor era, pre-weekly, pre-PFOF, pre-0DTE)?
15. What is the **causal mechanism** behind 21-DTE management — gamma-risk reduction vs loss-tail truncation vs premium-capture-rate optimization? (Adjudicable with counterfactual backtests.)

---

## 4. Independently derived research vectors

Each vector: (1) answers well; (2) cannot answer; (3) primary sources; (4) hierarchy note (full tiers in §5); (5) which practitioner claims it tests; (6) new questions it exposes; (7) methodological traps; (8) generalization limits; (9) independence classification; (10) a serious project sketch.

### V1 — Academic asset-pricing literature on option returns and the VRP
1. Answers: whether average option returns deviate from frictionless benchmarks; the term-structure and cross-section of the variance risk premium; decomposition into jump, leverage, and correlation components.
2. Cannot: what any *implementable* strategy nets (most tests are delta-hedged, frictionless, monthly-rebalanced paper portfolios); who trades against whom.
3. Sources (all IDENTIFIED-TRACEABLE via abstracts/quotes): Coval & Shumway (2001, JF) — zero-beta ATM straddles −3%/wk; Bakshi & Kapadia (2003, RFS) — delta-hedged S&P 500 underperformance; Carr & Wu (2009, RFS) — VRP across 5 indices/35 stocks; Driessen, Maenhout & Vilkov (2009) — index VRP = correlation risk; Broadie, Chernov & Johannes (2009) — put returns consistent with jump models (no anomaly); Goyal & Saretto (2009) — HV−IV cross-section, decays at quoted spreads; Cao & Han (2013) — idiosyncratic vol → delta-hedged returns; Hu & Jacobs (2014/15) — volatility and expected option returns; Bali & Murray (2013) — risk-neutral skewness; Vasquez (2012/17) — term-structure slope; Heston, Jones & Khorram — option momentum; Jones & Shemesh (2010) — weekend effect; Christoffersen, Fournier & Jacobs (2013) — equity-option factor structure; Choy (2015) — retail trading proportion predicts returns; Muravyev (2016) — order imbalances and reversal; Bondarenko (2019) — PUT index; recent: Hu–Jacobs–Seo (2022), Bollerslev et al. (2023, JFE), Nucera et al. (2024, RFS), Orłowski et al. (2024, MS), Heston et al. (2024, cross-asset).
4. Hierarchy: peer-reviewed top-journal > working papers > surveys/summaries; within papers, results with transaction-cost robustness > frictionless sorts.
5. Tests: "be the casino" (VRP existence — supported for indices, not single names); "IV overstates realized vol" (supported index, fragile single-name); win-rate framing (never tested — the literature studies means, not hit rates).
6. New questions: the correlation-risk decomposition implies the reverse boundary question (§1.2); intermediary-pricing papers (FMA 2025) imply a *time-of-day* structure to the premium nobody in practitioner discourse mentions.
7. Traps: frictionless delta-hedging; monthly rebalancing vs retail holding; EOD OptionMetrics mids as "prices"; peso problems (samples without 1987-scale events); multiple-testing across 100+ documented predictors.
8. Limits: almost entirely US equities, 1996+ (OptionMetrics era), index-heavy; pre-0DTE market structure; institutional execution assumptions.
9. Classification: **independent empirical evidence** — the strongest independent check on practitioner doctrine; shares no lineage with it (derives from Black–Scholes/Merton lineage and econometrics).
10. Project: re-derive the Carr–Wu/Driessen boundary on current data with *executable* proxies (bid-side fills for shorts), producing a "VRP boundary matrix" by instrument (index/single-name/commodity), tenor, and moneyness — the anchor for everything downstream.

### V2 — Exchange strategy benchmarks (CBOE family)
1. Answers: what a fully specified, rule-frozen, fully-collateralized option-writing rule earns gross over decades (1986+).
2. Cannot: net-of-cost retail implementation; leverage/margin-use variants; single-name anything.
3. Sources: CBOE methodology documents and dashboards (BXM 2002/Whaley; PUT 2007; BXMD, BXN, BXD, WPUT, PUTR, CNDR, BFLY, CMBO, CLL, PPUT, VXTH) — VERIFIED to exist via CBOE dashboard references; Wilshire 2019 PUT evaluation (IDENTIFIED-TRACEABLE).
4. Hierarchy: live index history > backfilled history (pre-2007 PUT, pre-2002 BXM are backtests with bid-price fills per Whaley 2002 — i.e., they *do* embed ~half-spread); CBOE-commissioned evaluations < independent replications.
5. Tests: "systematic premium selling beats buy-and-hold risk-adjusted" — supported gross on Sharpe, *not* on CAGR (PUT 9.54% vs S&P 9.80%, 1986–2018); "defined-risk condors" — CNDR/BFLY collapse in the 2010s falsifies the family-level claim.
6. New questions: why did CNDR/BFLY die in the 2010s while BXMD thrived? (regime-dependence of the premium by structure — unasked by practitioners).
7. Traps: backfilled index history treated as live; "no leverage" construction flatters Sharpe vs implementable retail margin use; survivorship of published indices (failed indices aren't launched).
8. Limits: SPX (and DJX/NDX) only; monthly rolls; 1986+; no 0DTE-era indices with long history; institutional collateralization.
9. Classification: **institutional convention + mechanical facts**; shares intellectual lineage with academia (Whaley) but is independent of *retail practitioner* doctrine — a genuinely independent gross baseline.
10. Project: build a "strategy-index autopsy" — decompose PUT/BXM/BXMD/CNDR returns into (a) equity-beta, (b) VRP harvest, (c) term-structure/carry, (d) crisis drawdowns; test which components are stable across decades.

### V3 — Market-microstructure and execution-cost research
1. Answers: what liquidity taking actually costs in options; how costs vary by trader type, venue, and timing; wholesaler/internalization economics.
2. Cannot: long-horizon strategy P&L; counterparty identity at the account level (origin codes are coarse).
3. Sources: Muravyev & Pearson (2020, RFS) — execution timing; effective spreads ~1/5 of conventional for timers; avg effective spread one-quarter below conventional (IDENTIFIED-TRACEABLE via working-paper text and author's appendix); de Fontnouvelle, Fishe & Harris (2003, SEC) — option spreads; Battalio, Hatch & Jennings (2016) — PFOF and spreads; Griffith & Van Ness (2020) — cancellation fees widen spreads; Bryzgalova, Pavlova & Sikorskaya (JF) — retail options volume >60%, wholesalers; AEA 2023 paper — quoted half-spread 9.71¢, price improvement 2.88¢, effective 6.49¢, realized 4.85¢ (IDENTIFIED-TRACEABLE).
4. Hierarchy: transaction-level OPRA studies > quote-based estimates > EOD-spread proxies; studies distinguishing trader types > pooled averages.
5. Tests: "friction is on the order of the edge" — SUPPORTED and refinable; "spreads are the main cost" — partially; timing heterogeneity means *whose* cost matters more than the average.
6. New questions: is Muravyev's timing discount available to retail at all? (Hypothesis: retail are the non-timers whose wide spreads *fund* the timers' discount — testable with origin-coded data.) What fraction of SEBI-measured losses is spread vs adverse move?
7. Traps: midpoint-based "effective spread" is biased when execution is timed (Muravyev's core point — most literature underestimates the bias); quoted EOD spreads ≠ intraday; retail price improvement ≠ low cost (improvement off a wide quote).
8. Limits: US listed options; mostly 2010s+; OPRA data access; wholesaler fills are off-exchange prints.
9. Classification: **independent empirical evidence / causal-ish descriptive**; fully independent of practitioner doctrine — and it *inverts* a practitioner assumption (costs are not a fixed haircut; they are trader-type-dependent).
10. Project: "who pays the spread" — join origin-coded option prints with retail-brokerage 606-style routing data where available; estimate execution-cost heterogeneity by participant type; re-price the canonical backtests at type-specific costs.

### V4 — Retail-behavior and outcomes evidence (US + India)
1. Answers: what retail actually trades, when, and what it earns/loses in aggregate.
2. Cannot: individual skill vs structure attribution without account-level panels; causal effect of any single rule.
3. Sources: Lakonishok, Lee, Pearson & Poteshman (2007) — option market activity 1990–2001; Bauer, Cosemans & Eichholtz (2009) — Dutch retail option losses; Poteshman & Serbin (2003) — early exercise; "Losing is Optional" (MIT/SSRN 4050165) — 5–9% losses around earnings announcements, 10–14% for high-EAV, +~5% from transaction costs; Eaton et al. (2022) — brokerage outages → demand pressure on IVs; de Silva, Smith & So (2022) — losses around earnings; Bryzgalova et al. — >60% of volume, skewness preference; Beckmeyer, Branger & Gayda (2023, SSRN 4404704) — 0DTE: >75% of retail SPX trades are 0DTE, avg losses $184k/day (Feb 2021–Feb 2023), $358k/day since May 2022; FMA Texas 0DTE paper — strategy-level retail P&L quantiles (naked puts/calls mean −5.6/−9.4; spreads ≈ 0; condor +0.6); SEBI F&O studies FY22–FY25 — 91% lose, ₹1.06 lakh crore FY25, loss concentration by intensity, ~90% persistence; SEC Staff Report Oct 2021 (VERIFIED press release; report contents IDENTIFIED-TRACEABLE) — retail peaked at 91% of non-MM GME option volume mid-Jan 2021. (All IDENTIFIED-TRACEABLE except SEC press release.)
4. Hierarchy: population-scale regulator data (SEBI, SEC) > account-level brokerage panels > transaction-level exchange data > surveys/self-reports.
5. Tests: "retail can harvest the VRP" — REJECTED in every measured setting so far; "defined-risk is safer" — SUPPORTED at trade level (spreads ≈ breakeven vs naked ≈ −6 to −9%); "win rate ≈ edge" — REJECTED (0DTE: median retail trade profitable, mean negative — the cleanest win-rate→expectancy inversion available).
6. New questions: loss *attribution* (spread vs timing vs leverage vs product); why spreads break even for retail but naked doesn't (selection or structure?); the Jane Street mirror — what does the winner's book look like?
7. Traps: survivorship (losers quit — SEBI participation fell 61.4L→42.7L in FY25); net-vs-gross definitions; India market-structure differences (weekly expiries, STT, no PFOF same way); US retail identified via exchange rule changes (Beckmeyer) — identification assumptions.
8. Limits: US 2020–2026 retail boom cohort; India F&O (different products/taxes); Netherlands 2009 (dated).
9. Classification: **independent empirical evidence** — the strongest falsifier of practitioner income claims; no shared lineage (regulator/academic measurement).
10. Project: "loss attribution ledger" — decompose measured retail losses into spread cost, adverse price movement, leverage/margin, and product selection, US and India; test whether any retail subpopulation (by strategy, per FMA quantiles) earns positive mean returns.

### V5 — Institutional portfolio-construction research
1. Answers: what options do *inside* a portfolio (risk, return, and cost of overlays); honest cost of insurance; alternatives to options for tail risk.
2. Cannot: whether any specific retail rule works; short-horizon trade economics.
3. Sources: Israelov & Nielsen "Covered Calls Uncovered" (AQR) — BXM ≈ equity returns at lower beta; ~25% uncompensated equity-timing exposure; hedging it lifts Sharpe 0.37→0.52; AQR "Chasing Your Own Tail (Risk)" (2011) + 2019 revisit — tail hedging via puts too costly; five alternatives; AQR "An Alternative Option to Portfolio Rebalancing" (2018) — short-option overlay earns VRP *and* the paper models transaction costs and real-world constraints (rare); Hurst–Ooi–Pedersen (2017) — trend as crisis alpha; Spitznagel/Universa "Dao of Capital" — deep-OTM tail convexity framing (professional book, marketing-adjacent).
4. Hierarchy: peer-reviewed/institutional white papers with disclosed methods > fund marketing > books-as-philosophy.
5. Tests: "covered calls are income" — REFRAMED: largely an equity-beta transformation with a small VRP kicker; "tail hedges protect portfolios" — SUPPORTED mechanically, REJECTED economically at systematic implementation cost (AQR).
6. New questions: the benchmark problem — what *should* a premium strategy be compared against (matched-beta equity? risk parity? trend?); does the "uncompensated timing exposure" critique generalize to short-put programs (PUT)?
7. Traps: institutional rebalancing/overlay framing assumes scale, governance, and tax status retail lacks; AQR papers are also product-adjacent (risk parity vendor).
8. Limits: institutional portfolios, long horizons, 1990s–2010s samples; implementation via OTC/listeds at scale.
9. Classification: **independent professional practice + institutional convention**; shares academic lineage (Israelov is a researcher) but not practitioner lineage — an independent check with different objective functions.
10. Project: "benchmark tribunal" — re-state every major strategy index (PUT, BXM, CNDR, PPUT) against matched-risk alternatives (beta-matched equity, trend overlay, vol-targeted equity) to separate VRP alpha from risk transformation.

### V6 — Dealer-inventory and hedging-feedback research
1. Answers: whether and how option positioning moves *underlying* prices/volatility (gamma hedging, vanna/charm flows).
2. Cannot (yet): whether positioning predicts *option* returns — the literature studies the stock leg; the option leg is the gap.
3. Sources: Ni, Pearson & Poteshman (2008) — volatility information in options; Ni et al. (2021) — MM delta-rebalancing → next-day stock volatility and jump probability; Hu (2014) — delta-hedge-induced order imbalance predicts stock returns; Baltussen, Da, Liao & Peng (2021) — short gamma → end-of-day hedging, intraday momentum; Gârleanu, Pedersen & Poteshman (2009) — demand-based option pricing; FMA 2025 "Intermediary Option Pricing" — shadow gamma, night/weekend returns; Utah 0DTE paper — 1σ 0DTE volume → +14% intraday vol; Brogaard et al. — 0DTE IV approach, Robinhood-outage identification; Kolanovic (JPM) Volmageddon-2.0 warnings — practitioner-desk, treat as hypothesis.
4. Hierarchy: identified causal designs (outages, expirations, rule changes) > predictive regressions > calibrated models > desk notes.
5. Tests: "gamma pinning/expiry effects" — SUPPORTED directionally for stocks; practitioner claims about *option* pricing from gamma flows — UNTESTED (absence).
6. New questions: does dealer positioning predict *delta-hedged option returns* (not stock returns)? Is 0DTE's intraday-vol effect exploitable or just a cost? Do wholesalers' internalized flows dampen or amplify?
7. Traps: GEX-style metrics are non-stationary post-2020 (ALPresi: level non-stationary, momentum stationary — regressing on levels is spurious); commercial gamma data is a black box; causality stock→options vs options→stock is genuinely hard.
8. Limits: US equities, 2015+ mostly; intraday horizons; SPX-centric.
9. Classification: **independent empirical evidence** (academic) mixed with **institutional convention/marketing** (desk notes); the academic core is independent of practitioner doctrine.
10. Project: "the option leg" — test whether dealer gamma positioning predicts *delta-hedged option returns* (not stock returns) using OPRA + OptionMetrics; this is the missing half of the feedback literature.

### V7 — Historical episodes and archives
1. Answers: how options markets behave under structural breaks; what repeated across episodes; what was believed at the time (contemporaneous records beat hindsight).
2. Cannot: clean causal attribution (episodes are N=1); transferability to current microstructure.
3. Sources: 1973 CBOE founding/BSM; 1987 portfolio insurance (LOR; Brady Report; Gennotte–Leland 1990; Rubinstein–Roll debate); 2008; 2010 flash crash; Feb 2018 Volmageddon — MDPI "BeVIXed" account + OptionMetrics IvyDB signed-volume finding (>400K net VIX calls 9:55–10:05am, Feb 5 2018 — vendor research, treat as IDENTIFIED-TRACEABLE); Mar 2020; Jan 2021 GME (SEC report); Aug 2024 vol spike; 2025 Jane Street/SEBI; oral histories (Mat Cashman/OCC interview; Leland–Rubinstein documents).
4. Hierarchy: contemporaneous regulatory reports (Brady, SEC) > exchange/vendor forensics > academic postmortems > memoirs > journalism.
5. Tests: "premium strategies survive crises" — each episode is a falsification instance for *some* implementation (XIV termination; CNDR 2010s); "stops protect" — Volmageddon evidence says gaps blow through stops.
6. New questions: which practitioner rules *post-date* the last real stress test (most 0DTE practice has never seen a 1987/2008-scale event — the sample-selection problem); do episodes rhyme mechanically (crowded short-vol + procyclical hedging)?
7. Traps: narrative fallacy; hindsight bias; each episode's microstructure is dead (1987 floor, 2018 pre-0DTE-daily); survivorship of commentators.
8. Limits: US-centric; one observation each; regime-specific.
9. Classification: **historical observation** — independent of practitioner doctrine (predates most of it); the strongest available stress evidence.
10. Project: "episode autopsies with a common template" — for each episode: positioning beforehand, trigger, hedging feedback, who lost/won, which current rules would have failed; then a "stress-test matrix" mapping rules × episodes.

### V8 — Options data infrastructure
1. Answers: what is measurable, at what cost and license; the raw material for every empirical vector.
2. Cannot: anything by itself — it is infrastructure, not evidence.
3. Sources: OptionMetrics IvyDB US (EOD 1996+; intraday 3×/day from 2018 incl. 0DTE; Europe/Asia/Canada/Global Indices; WRDS + CRSP link 2025; Snowflake 2026) — VERIFIED via vendor announcements; CBOE DataShop/MDX (claims history to 1973), LiveVol Open-Close data with origin codes (customer/firm/MM/pro) and academic pricing ($750/yr EOD) — VERIFIED via SEC fee filings; OPRA tape via Databento/Polygon; ORATS; Theta Data; DiscountOptionData; OCC volume/OI/exercise data 1973+ (VERIFIED via theocc.com).
4. Hierarchy: OPRA prints > exchange open-close origin data > vendor-cleaned EOD (OptionMetrics) > free scraped chains.
5. Tests: N/A directly — but determines which claims are *testable at all* (e.g., retail identification needs origin codes or rule-change instruments).
6. New questions: what can't be bought — account-level retail panels (only brokers/regulators have them); wholesaler internalization prints lack quote context.
7. Traps: EOD mid ≠ tradable; survivorship in vendor universes; corporate-action adjustments; OPRA is prints without intent.
8. Limits: cost-gated (academic pricing exists but is nontrivial); US-centric.
9. Classification: **mechanical facts**.
10. Project: "evidence-feasibility map" — for each question in §3, name the dataset that could answer it, its cost/license, and the identification strategy; this is Wave 0 infrastructure.

### V9 — Professional books and pro oral histories
1. Answers: how professionals *think* (risk framing, sizing, what they refuse to do); durable heuristics from practitioners with skin in the game.
2. Cannot: verified P&L; statistical claims (books don't run regressions); representativeness (survivors write books).
3. Sources: Natenberg "Option Volatility & Pricing"; Sinclair "Volatility Trading," "Option Trading," "Positional Option Trading"; Taleb "Dynamic Hedging"; Cottle "The Hidden Reality"; McMillan "Options as a Strategic Investment"; Gleadall; Augen; Hull; Passarelli; Chen & Sebastian; Schwager "Market Wizards: The Next Generation" (Goedeker); Options Insider Radio (Longo, longest-running); "Confessions of a Market Maker"; Cashman/OCC interview.
4. Hierarchy: market-maker-authored (Sinclair, Taleb, Cottle — inventory-risk perspective) > strategist-authored (Natenberg, McMillan — education lineage) > interview compilations (selection bias) > trading-room podcasts.
5. Tests: "trade small / size by Kelly fraction" (Sinclair: most retail 2–3× too large — INFERENCE from his stated rule); "vol trading is statistics" — a *standard* against which retail rule sets can be graded, not a test.
6. New questions: the inventory-risk worldview (Taleb/Sinclair/Cottle) vs the retail "income" worldview — two incompatible theories of what an option position *is*; the books suggest the research program's missing variable is *inventory*, not strategy.
7. Traps: survivorship; era-specific (floor vs electronic); some authors sell education (McMillan lineage overlaps retail educator lineage — shared ancestry, not independent).
8. Limits: mostly equity options, 1990s–2010s experience; US/European.
9. Classification: **independent professional practice** (market-maker-authored) shading into **shared intellectual lineage / derivative education** (educator-authored). Must be split, not treated as one vector.
10. Project: "two theories of the option" — extract the inventory-risk theory (Taleb/Sinclair/Cottle) as formal propositions and test them against retail rule sets; e.g., does any retail rule set satisfy Sinclair's "thesis must include a number" criterion?

### V10 — Broker/educator documentation and the lineage graph
1. Answers: the actual ancestry of claims — who said what first, who copied whom; the commercial incentives shaping each node.
2. Cannot: whether claims are true.
3. Sources: tastylive Market Measures archive (Fabian 2016; Zeng 2024); tastytrade corporate facts (thinkorswim ~$606M 2009; tastytrade $1.0B 2021 — IDENTIFIED-TRACEABLE); Option Alpha materials; OIC mechanics docs (assignment/exercise/pin risk — VERIFIED to exist as a category); broker 606 disclosures; forum corpora (r/options, r/thetagang).
4. Hierarchy: dated primary publications > secondary compilations > forum repetition.
5. Tests: the false-consensus finding itself — mappable as a citation graph: which phrases co-occur with which incompatible behaviors.
6. New questions: does commercial product shape (brokerage owns education arm) predict *which* claims spread (e.g., high-turnover rules at a commission-earning broker — INFERENCE, testable via 606 + rule turnover rates)?
7. Traps: treating educator backtests as evidence (they're marketing with numbers); confusing disclosure with rigor.
8. Limits: US retail; 2010s–2020s.
9. Classification: **derivative education / marketing repetition** — the object of study for lineage, not a source of evidence about markets.
10. Project: build the citation graph — nodes = claims, edges = "repeated by"; compute the true number of *independent* origins for each canon element (expectation: ~1 for 45/50/21).

### V11 — Regulatory datasets and filings
1. Answers: population-scale ground truth on volumes, losses, and market structure; enforcement revealing hidden winners.
2. Cannot: strategy-level economics (regulators measure outcomes, not theses).
3. Sources: OCC volume/OI/exercise data 1973+ (VERIFIED); SEC Rule 606 routing disclosures; SEC Staff Report Oct 2021 (VERIFIED); SEBI F&O studies + Jane Street order 2025 (IDENTIFIED-TRACEABLE); FINRA suitability rules; Brady Report (1987).
4. Hierarchy: enforcement-grade measurement > statistical reports > rule proposals.
5. Tests: any claim of the form "retail does X" — directly measurable; "brokers act in clients' interest" — 606 + PFOF economics.
6. New questions: the Jane Street mirror — can enforcement data reveal what the *winning* side's book looks like (index arbitrage vs retail flow)? What does India-style weekly-expiry data imply for US 0DTE regulation?
7. Traps: regulatory agenda shapes what's measured; India≠US transfer needs care.
8. Limits: jurisdiction-specific; coarse granularity.
9. Classification: **independent empirical evidence / mechanical facts** — the highest-authority descriptive layer.
10. Project: "the other side of the ledger" — assemble every public enforcement + wholesaler-economics source into one P&L decomposition: retail losses = whose revenue?

### V12 — Communities and forums (text as data)
1. Answers: belief diffusion, vocabulary spread, sentiment/positioning proxies; natural experiments (outages, rule changes).
2. Cannot: P&L truth (self-reported); representativeness.
3. Sources: r/options, r/thetagang, r/wallstreetbets, Elite Trader archives.
4. Hierarchy: timestamped posts with positions > retrospective claims > memes.
5. Tests: the false-consensus mechanism — does shared vocabulary predict correlated positioning (testable around events)?
6. New questions: do forums *coordinate* the crowded trades (GME, 0DTE templates — the 2026 OPRA study found retail 0DTE synchronized by fintech templates)?
7. Traps: bots/astroturf; survivorship; irony.
8. Limits: 2019+; self-selected.
9. Classification: **descriptive evidence** about beliefs; independent of educator lineage only insofar as it can reveal *deviations*.
10. Project: "vocabulary→positioning" — link phrase adoption to subsequent retail flow concentration (OPRA origin data) around events.

### V13 — Cross-asset and derivatives-desk research
1. Answers: whether the VRP generalizes beyond US equities (energy, FX, rates); how dealers price it.
2. Cannot: retail implementation.
3. Sources: Jacobs et al. (2023) — energy options VRP; Nucera et al. (2024, RFS) — FX; Heston et al. (2024) — 20 futures; JPM/BofA/GS desk notes (Kolanovic).
4. Hierarchy: peer-reviewed cross-asset > desk notes.
5. Tests: "premium selling works" as an asset-class claim — PARTIALLY SUPPORTED in energy/FX (different mechanisms: hedging pressure, inventory).
6. New questions: is there an asset class where retail *could* harvest VRP with listed instruments (or is the boundary universal)?
7. Traps: desk notes are positioning/marketing; futures-options ≠ equity-options microstructure.
8. Limits: institutional.
9. Classification: **independent empirical evidence** (academic) + **institutional convention** (desks).
10. Project: cross-asset VRP boundary — same measurement template as V1 across commodities/FX/rates; locate the most retail-accessible positive-VRP instrument, if any.

### V14 — Open-source reproducible backtests
1. Answers: exact, inspectable implementations; sensitivity of results to choices (the "researcher degrees of freedom" audit).
2. Cannot: execution realism beyond modeled frictions; data quality (often free chains).
3. Sources: the GitHub-agent research corpus surfaced in searches (theta-gate, shadow-options-trading-lab, cipher, vetoed dossiers) — treat as **unvetted secondary compilations**, useful as leads, not evidence; plus established OSS (e.g., QuantLib-based studies, academic replication packages).
4. Hierarchy: replication packages attached to papers > independent replications with disclosed data > agent-generated dossiers (lowest — recycle claims without provenance).
5. Tests: sensitivity — e.g., SteadyOptions' finding that passive 30-DTE/5-DTE-exit beats 45/50/21 gross (IDENTIFIED-TRACEABLE) is exactly the kind of result this vector produces.
6. New questions: how many canon results survive a multiverse analysis (all reasonable specifications)?
7. Traps: garbage data in (free chains); undisclosed cost models (the 170,500-trade replication problem); overfitting to the replication itself.
8. Limits: data access; compute.
9. Classification: **derivative** (of whatever data they use) — valuable for *falsification audits*, not for primary evidence.
10. Project: "multiverse of the canon" — pre-registered specification curve for 45/50/21 and its competitors, with disclosed friction models at three levels (mid, quoted-spread, Muravyev-timed).

---

## 5. Evidence hierarchy within each vector

Tiers are ordered by authority for *decision-relevant* claims. A lower-tier source can outrank a higher-tier one on a narrow question it measures directly (e.g., SEBI beats a top-journal paper on "what did Indian retail earn").

**V1 (academic asset-pricing):** T1 — top-5/top-field peer-reviewed with transaction-cost robustness (e.g., Goyal–Saretto's spread-adjusted sorts; Muravyev–Pearson). T2 — peer-reviewed without cost robustness. T3 — working papers (SSRN/FMA) with identified designs. T4 — surveys, textbook summaries, finance-media retellings. *Rule: frictionless sorts are hypotheses, not evidence, about implementable strategies.*

**V2 (CBOE benchmarks):** T1 — live index history with published methodology (post-launch PUT/BXM). T2 — backfilled history (pre-launch; note Whaley-2002 bid-fill convention embeds ~half-spread). T3 — CBOE-commissioned evaluations (Wilshire 2019). T4 — vendor/media summaries (Bondarenko 2019 is closer to T2/T3: independent author, CBOE data).

**V3 (microstructure/costs):** T1 — transaction-level OPRA studies with trader-type identification. T2 — transaction-level without type splits. T3 — quote-based effective-spread studies. T4 — EOD-spread proxies and rules of thumb. *Rule: any cost number that doesn't specify whose cost is a category error.*

**V4 (retail outcomes):** T1 — population-scale regulator measurement (SEBI, SEC). T2 — account-level brokerage panels. T3 — transaction-level exchange data with retail identification (Beckmeyer; FMA 0DTE). T4 — surveys, self-reports, forum P&L posts.

**V5 (institutional portfolio):** T1 — disclosed-method white papers with cost modeling (AQR rebalancing-overlay paper). T2 — peer-reviewed institutional studies (Israelov–Nielsen). T3 — fund marketing and CIO-magazine summaries. T4 — philosophy books (Spitznagel).

**V6 (dealer feedback):** T1 — identified causal designs (outages, expirations). T2 — predictive regressions with proper stationarity handling. T3 — calibrated structural models. T4 — desk notes and commercial gamma dashboards.

**V7 (episodes):** T1 — contemporaneous regulatory reports (Brady, SEC). T2 — exchange/vendor forensics (OptionMetrics Volmageddon note). T3 — academic postmortems. T4 — memoirs and journalism.

**V8 (data infra):** T1 — OPRA prints. T2 — exchange open-close with origin codes. T3 — vendor-cleaned EOD (OptionMetrics). T4 — free scraped chains. *This hierarchy governs input quality for all empirical vectors.*

**V9 (pro books/oral history):** T1 — market-maker-authored with inventory-risk framing (Sinclair, Taleb, Cottle). T2 — strategist/educator-authored (Natenberg; McMillan — note lineage overlap with retail education). T3 — interview compilations (Schwager; Options Insider Radio). T4 — trading-room podcasts.

**V10 (lineage):** T1 — dated primary educator publications. T2 — secondary compilations. T3 — forum repetition. *This vector ranks provenance, not truth.*

**V11 (regulatory):** T1 — enforcement-grade measurement. T2 — statistical reports. T3 — rule proposals and speeches.

**V12 (forums):** T1 — timestamped posts with verifiable positions. T2 — retrospective claims. T3 — memes/sentiment. *Evidence about beliefs only.*

**V13 (cross-asset):** T1 — peer-reviewed cross-asset studies. T2 — desk notes.

**V14 (OSS backtests):** T1 — paper-attached replication packages. T2 — independent replications with disclosed data. T3 — unvetted compilations (agent-generated dossiers). *Falsification audits only.*

---

## 6. Cross-vector overlap and independence

The fourteen vectors collapse into **five genuinely independent lineages** plus infrastructure. Everything else is transmission.

| Lineage | Vectors | Ultimate origin | Relation to practitioner doctrine |
|---|---|---|---|
| Academic econometrics | V1, V3, V6-academic, V13-academic | Black–Scholes–Merton + financial econometrics | Fully independent; the primary falsifier |
| Exchange/vendor mechanics | V2, V8, V11-data | CBOE/OCC/OPRA institutional history | Independent of retail doctrine; shares academic lineage (Whaley) |
| Regulatory measurement | V4-regulator, V11 | State enforcement/statistics | Fully independent; highest descriptive authority |
| Institutional practice | V5, V13-desks, V9-market-maker | Dealer/investment-management practice | Independent of retail doctrine; different objective functions |
| Practitioner-education lineage | V10, V12, V9-educator, V14-low | tastylive Market Measures → broker educators → forums | **This is the object of study, not evidence** |
| Historical record | V7 | Events themselves | Independent; predates the doctrine |

**Overlaps that masquerade as independent confirmation (must be deduplicated):**
- The "IV > RV" claim appears in V1 (Carr–Wu), V2 (PUT marketing), V5 (AQR), and V10 (tastylive) — but V2's index and V10's talking points both *descend* from the same empirical fact; counting them as four confirmations is the exact error the mission warns against. Independent confirmations: V1 only (with V13-academic as a partial second in other asset classes).
- Muravyev–Pearson (V3) and Bryzgalova et al. (V4) share OPRA-era data and coauthor-network proximity — treat as one-and-a-half sources on retail costs, not two.
- AQR's papers (V5) cite the same CBOE indices (V2) they then evaluate — circularity to discount, not independence to count.
- The GitHub agent-dossier corpus (V14-low) recycles V1/V2/V10 claims with AI-generated confidence — it is a *transmission accelerator*, not a source. Any claim found only there is unsourced.
- SEBI (V4/V11) and US retail studies (V4) are genuinely independent of each other (different regulators, markets, periods) — their agreement (retail loses; spreads matter) is the strongest cross-validation in the whole map.

**The single most important independence result:** the five lineages agree on *facts* (VRP exists for indices; retail loses; spreads are wide; tails correlate) while disagreeing on *prescriptions* — which is exactly what you'd expect if the facts are real and the prescriptions are lineage artifacts.

---

## 7. Important evidence-boundary failures

Invalid transfers — each is a way a true statement in one context becomes false in another. The first eleven were given; the rest were discovered in this investigation.

1. **Index → single-stock.** Index VRP is correlation risk (Driessen–Maenhout–Vilkov); single names average ~zero/negative (Carr–Wu: 7/35 significant). Practitioner mechanics cross this boundary silently.
2. **Institutional → retail execution.** Muravyev's timing discount accrues to timers; retail may be the non-timers funding it. Cost estimates don't transfer across participant types.
3. **Gross → net returns.** CBOE indices and practitioner backtests are gross (or half-spread-only); net requires the friction ladder.
4. **Midpoint → executable fills.** Muravyev's core result: conventional effective spreads overstate timer costs and the bias is trade-direction-correlated.
5. **Isolated trades → sequential portfolios.** Rolling, margin calls, and correlated tails make portfolio P&L a different object from mean trade P&L.
6. **Normal → crisis regimes.** Vol-of-vol, gap risk, and correlation spikes live in the crisis state; averages across regimes mislead.
7. **Historical → current microstructure.** Floor era, pre-weekly, pre-PFOF, pre-0DTE findings may be dead. The 0DTE break is the live case.
8. **Risk-neutral → real-world probability.** Delta-as-probability confuses the pricing measure with the physical one; the wedge *is* the risk premium.
9. **Win rate → expectancy.** 0DTE retail: median trade profitable, mean negative (FMA quantiles). The cleanest empirical inversion available.
10. **Backtest → causal mechanism.** 21-DTE "works" is not "21-DTE works *because of gamma*."
11. **One implementation → strategy family.** PUT ≠ strangle ≠ iron condor (CNDR's 2010s collapse). Family-level claims from one implementation are invalid.
12. **One underlying → asset class.** SPX evidence ≠ single-name ≠ energy/FX (where VRP has different mechanisms).
13. **One period → structural law.** 1988–2006 and 2009–2019 are regimes, not laws; decade-split everything.
14. **EOD snapshot → intraday reality.** IvyDB EOD mids miss 0DTE intraday dynamics, pin risk, and after-hours assignment.
15. **Put-call parity reasoning → American/exercise reality.** Early exercise (Poteshman–Serbin), ex-div dates, and hard-to-borrow break parity-based intuition; the drag is unmeasured.
16. **Model-free variance portfolios → tradable spreads.** Carr–Wu's replicating portfolios aren't retail-tradable; the implementable proxy may have different economics.
17. **Cross-sectional sort → implementable portfolio.** Goyal–Saretto's sorts decay at quoted spreads; the paper *is* the boundary demonstration.
18. **Time-series average → sequential experience.** Arithmetic means ignore ruin: a positive-expectancy strategy with absorbing ruin states has negative *experienced* expectancy for the ruined.
19. **Paper portfolio → funded portfolio.** Margin expansion in crises means the funded portfolio faces constraints the paper portfolio never meets (return on occupied capital).
20. **IV level → trade edge.** Edge is IV−RV (a spread), not IV level; IVR/IV-percentile entry filters select on level, which is the wrong variable — a boundary failure inside the canon's own entry logic.
21. **Night/weekend-inclusive returns → retail-harvestable returns.** Part of the measured premium accrues when markets are closed (FMA 2025); retail cannot earn it. Index-level backtests overstate harvestable premium.
22. **Wholesaler price improvement → low cost.** Improvement is measured off wide quotes; effective costs remain the binding number (V3).
23. **One country's market → another's.** SEBI's India findings don't transfer mechanically to the US (weekly expiries, STT, different PFOF regime) — but the *mechanisms* (spreads, skewness preference) are candidates for transfer, not the magnitudes.

---

## 8. Highest-information-value questions

Ranked by expected information gain per unit of research effort — specifically by power to **falsify broad assumptions, unblock downstream questions, or expose population boundaries**. Not ordered by ease.

**Q1. What does the canonical short-premium trade net at actual retail execution?**
*Why first:* every downstream question (portfolio role, alternatives, education) depends on the sign and size of net expectancy. Current state: gross ≈ 0–5%/yr on indices (V2 + replications); retail frictions unmeasured with a disclosed model (ABSENCE-OF-EVIDENCE). A credible net number — or a credible "negative" — falsifies the income framing outright and redirects the program from optimization to loss-attribution. Method: V3 cost heterogeneity × V2 baselines; pre-registered friction ladder (mid → quoted spread → origin-specific effective spread).

**Q2. Who captures the documented VRP, through which mechanical channels?**
*Why:* the literature proves a premium exists (indices) but never assigns it to a participant. Candidates: market makers (spread + timing), wholesalers (internalization), intermediaries (night/weekend gap premium), hedgers' counterparties. If the answer is "intermediaries, mechanically," then retail premium-selling is structurally a transfer — the single most important boundary in the domain. Method: V11 origin data + V3 + V6 night/weekend decomposition + SEBI/Jane Street mirror.

**Q3. Does trade-level expectancy survive portfolio aggregation under stress correlation?**
*Why:* the missing math. Practitioner portfolios hold many "uncorrelated" short-premium positions; Driessen–Maenhout–Vilkov implies the crisis state is precisely when single-name correlations spike and the premium inverts. This tests whether diversification *works* for short-vol books or is an illusion (INFERENCE: likely partially illusory — the reverse boundary failure of §1.2). Method: joint-distribution simulation calibrated to crisis correlation spikes + historical episode overlays (V7).

**Q4. Is the VRP eroding — and by structure?**
*Why:* CNDR/BFLY died in the 2010s while BXMD thrived; 0DTE now dominates SPX volume. If edge decays with crowding and structure, all historical evidence needs a time-decay adjustment, and "timeless rules" claims fail. Method: decade-split VRP measurement (V1 template) + strategy-index autopsy (V2) + retail participation series (V4/V11).

**Q5. What is the true capital occupation of premium strategies, and the return on occupied capital?**
*Why:* practitioners quote return on notional or on margin-at-entry; margin expands in crises — the binding constraint is sequential, not per-trade. Return on *occupied* capital through a full cycle may invert rankings (INFERENCE). Method: reconstruct buying-power-reduction paths through 2008/2020 episodes for canonical portfolios.

**Q6. Which canon rules were never independently tested — full inventory with evidence grades?**
*Why:* establishes the folklore boundary cheaply and blocks wasted effort. Expected output: most rules grade D (single-source, self-reported). This is Wave 1 deliverable and the precondition for honest prioritization.

**Q7. Does dealer gamma positioning predict option returns (not stock returns)?**
*Why:* the entire feedback literature studies the stock leg; the practitioner holds the option leg. If gamma positioning predicts delta-hedged option returns, it's a tradeable mechanism; if not, the "gamma flows" discourse is misapplied. Either answer kills a large confused literature. Method: V6 project.

**Q8. What is the loss attribution of measured retail derivatives losses?**
*Why:* SEBI's ₹1.06 lakh crore and Beckmeyer's $184–358k/day are totals, not mechanisms. Decomposing into spread cost / adverse movement / leverage / product selection tells you *which* interventions (education? product design? cost?) could matter. Method: V4 + V3 + India/US comparison.

**Q9. What should an options strategy be benchmarked against?**
*Why:* "PUT Sharpe 0.64 vs S&P 0.45" is only meaningful if Sharpe-on-vol is the right metric for a negatively-skewed strategy. Israelov & Nielsen's timing-exposure critique suggests the right benchmark is beta-and-timing-matched equity, or trend, or risk parity — which may erase the apparent alpha. This is a *question about questions*: it determines what counts as evidence in every later wave.

**Q10. What fails in the 0DTE regime that held before it?**
*Why:* >50–60% of SPX volume is now 0DTE (IDENTIFIED-TRACEABLE); the entire pre-2022 evidence base was built in a different microstructure. This is the "dead market structure" boundary failure with the shortest fuse. Method: re-run V1/V2 templates on 0DTE-era data; compare retail outcomes (FMA quantiles) to monthly-era analogues.

---

## 9. Proposed research waves

Design principle: **Wave N answers questions that determine what Wave N+1 investigates.** Order by information value, not ease. Each wave states outputs, completion gates, and falsifiers.

### Wave 0 — Evidence-feasibility map (4–6 weeks)
*Question:* for each §3 question, what dataset answers it, at what cost/license, with what identification strategy?
*Tracks:* data-infrastructure audit (V8); lineage-graph skeleton (V10); evidence-grade inventory of canon rules (Q6).
*Outputs:* (a) dataset×question matrix with costs and licenses; (b) canon rule inventory with evidence grades; (c) lineage graph v1 (claims → origins).
*Gate:* every §3 question has a named dataset + method or is marked ABSENCE-OF-EVIDENCE with a stated reason.
*Falsifier:* if >50% of questions lack any feasible dataset, the program's scope must shrink to the feasible subset — the map itself is the finding.

### Wave 1 — Anchors and falsifiers (the net baseline + the boundary matrix)
*Questions:* Q1, Q2 (first pass), Q6 (completed), Q9 (benchmark framework).
*Tracks (parallel):*
- T1a. Net-of-execution canon replication: 45/50/21 and its competitors (passive 30-DTE/5-DTE-exit per SteadyOptions; BXMD-style 30-delta) on SPX/SPY 2005+, pre-registered friction ladder.
- T1b. VRP boundary matrix: re-derive Carr–Wu/Driessen on current data by instrument (index/single-name/commodity), tenor, moneyness, with executable-side pricing.
- T1c. Strategy-index autopsy: decompose PUT/BXM/BXMD/CNDR into beta / VRP / carry / crisis components by decade.
- T1d. Benchmark tribunal: re-state major indices against matched-risk alternatives (beta-matched equity, trend, vol-targeted equity).
*Outputs:* net-expectancy table for the canon at three friction levels; boundary matrix; component decomposition; benchmark-relative scoreboard.
*Gate:* a signed, magnitude-credible net number for the canonical trade at retail execution, with confidence intervals; and a written statement of which instruments/tenors have positive executable VRP.
*Falsifiers:* (i) if net retail expectancy is robustly positive, the "transfer" hypothesis (Q2) weakens — pivot to optimization; (ii) if no instrument shows positive executable VRP, the program pivots to "why does anyone trade options" (hedging/insurance demand side); (iii) if benchmark-relative alpha vanishes everywhere, the "edge" was risk transformation — publish that.

### Wave 2 — Aggregation, survival, and capital (portfolio-level truth)
*Questions:* Q3, Q5, plus assignment/early-exercise economics (§3.7).
*Depends on:* Wave 1's net baselines and boundary matrix (can't aggregate what you haven't measured).
*Tracks:*
- T2a. Correlated-tail portfolio simulation: joint distributions with crisis correlation spikes; "diversified" short-premium books through 2008/2020/2018 episodes.
- T2b. Capital-occupation reconstruction: buying-power paths, margin expansion, return on occupied capital vs alternatives.
- T2c. Assignment & exercise drag: OCC exercise data + dividend calendar → measured drag on short-call programs; pin-risk/after-hours assignment frequency.
*Outputs:* portfolio-survival curves; capital-occupation-adjusted return rankings; assignment-drag estimates.
*Gate:* a quantitative statement of the form "N uncorrelated short-premium positions behave like X effective positions in a −3σ week."
*Falsifiers:* if aggregation is approximately benign (tails don't correlate beyond what's priced), the practitioner's diversification intuition survives — surprising and important.

### Wave 3 — Mechanisms (causal, not correlational)
*Questions:* Q7 (gamma→option returns), the 21-DTE causal adjudication (§3.15), crowding/erosion (Q4 first pass).
*Depends on:* Wave 1 baselines (need the phenomenon before the mechanism); Wave 2's correlation findings (mechanism must explain them).
*Tracks:*
- T3a. The option leg: dealer positioning → delta-hedged option returns.
- T3b. 21-DTE adjudication: counterfactual exits (gamma-matched vs time-matched) to separate mechanisms.
- T3c. Crowding time-series: VRP and strategy Sharpe by decade; retail participation as a crowding proxy; 0DTE share as structural break.
*Outputs:* mechanism verdicts with effect sizes; a dated statement on VRP erosion.
*Gate:* each tested mechanism gets "supports / rejects / unidentified" with a pre-registered test.
*Falsifiers:* if no positioning variable predicts option returns, the gamma discourse is decorative — say so.

### Wave 4 — Regime and structure (the world changed)
*Questions:* Q10 (0DTE), Q8 (loss attribution), India as natural experiment, Jane Street mirror.
*Depends on:* Waves 1–3 (need the old-regime baselines to measure what changed).
*Tracks:*
- T4a. 0DTE evidence transfer: re-run Wave 1 templates on 0DTE-era data; retail strategy-level outcomes (extend FMA quantiles).
- T4b. Loss-attribution ledger: US + India decomposition (spread / adverse move / leverage / product).
- T4c. The winner's book: assemble Jane Street/SEBI enforcement + wholesaler economics into the other side of the ledger.
*Outputs:* a "regime-transfer matrix" (which findings survive 0DTE); loss-attribution percentages; winner-side decomposition.
*Gate:* quantitative answer to "how much of measured retail loss is spread vs everything else."
*Falsifiers:* if 0DTE-era results match monthly-era results, the microstructure break is overstated — the old evidence transfers further than assumed.

### Wave 5 — Portfolio role and alternatives (what options are *for*)
*Questions:* Q9 applied (benchmark-relative role), long-vol/trend/cash alternatives, the "two theories of the option" (V9).
*Depends on:* all prior waves (role follows measurement).
*Tracks:*
- T5a. Alternatives tribunal: tail-hedge (PPUT/TAIL/VXTH), trend, de-risking — matched-drawdown comparisons.
- T5b. Inventory-risk theory formalization: test Sinclair/Taleb/Cottle propositions against retail rule sets.
- T5c. Product-design implications: given Waves 1–4, what *could* a retail-accessible positive-expectancy options program look like — or is the honest answer "none found"?
*Outputs:* role statement for options in portfolios; formal verdicts on inventory-risk propositions; design constraints (possibly negative).
*Gate:* a one-page "what options are for" statement with evidence grades per claim.
*Falsifiers:* if a retail-accessible positive-expectancy program is found, it overturns the Wave 1–2 pessimism — the program must steelman it, not bury it.

---

## 10. Parallel research tracks within each wave

- **Wave 0:** (i) dataset×question matrix; (ii) canon evidence-grade inventory; (iii) lineage-graph skeleton. All three are independent — run concurrently; they share only a coordinator.
- **Wave 1:** T1a (replication) ∥ T1b (boundary matrix) ∥ T1c (index autopsy) ∥ T1d (benchmarks). T1a and T1b share data infra but ask independent questions; T1d can start from published index histories without waiting for T1a.
- **Wave 2:** T2a (tail aggregation) ∥ T2b (capital occupation) ∥ T2c (assignment drag). T2a needs Wave 1's per-trade distributions (light dependency — can start with literature parameters, then recalibrate); T2b/T2c are independent of T2a.
- **Wave 3:** T3a (option-leg gamma) ∥ T3b (21-DTE adjudication) ∥ T3c (crowding). Fully parallel; different data, different methods.
- **Wave 4:** T4a (0DTE transfer) ∥ T4b (loss attribution) ∥ T4c (winner's book). T4b needs T4a's 0DTE outcome data for the US leg — sequence T4a → T4b(US), but India leg of T4b is independent; T4c is document-based, fully parallel.
- **Wave 5:** T5a (alternatives) ∥ T5b (inventory theory) ∥ T5c (design). T5c depends on T5a/T5b outputs — sequence within the wave.

---

## 11. Dependencies between research tracks

```
Wave 0 (feasibility map)
  └─► Wave 1 (T1a net baseline, T1b boundary matrix, T1c autopsy, T1d benchmarks)
        ├─► Wave 2 (needs T1a distributions for T2a; T1b for instrument scope)
        │     └─► Wave 4 (needs old-regime baselines to measure regime change)
        └─► Wave 3 (needs T1a/T1b phenomena; T3c crowding needs T1c decade splits)
              └─► Wave 5 (needs everything: role follows measurement)
```
Key cross-links: T1d (benchmarks) is a *methodological* dependency of T5a — the benchmark framework must be fixed in Wave 1 or Wave 5 re-litigates it. T2a's crisis-correlation parameters should be checked against T3a's mechanism findings (does dealer feedback explain the correlation spike?). T4c (winner's book) informs Q2's second pass regardless of wave — schedule a Q2 revisit after Wave 4.

---

## 12. Completion gates

- **Wave 0:** dataset×question matrix complete; every §3 question has a named dataset+method or a written ABSENCE-OF-EVIDENCE; canon inventory graded; lineage graph v1 published internally.
- **Wave 1:** signed net-expectancy table (canon × 3 friction levels) with CIs; boundary matrix (instrument × tenor × moneyness, executable pricing); index-autopsy decomposition; benchmark-relative scoreboard; benchmark framework frozen for Wave 5.
- **Wave 2:** "effective independent positions in a −3σ week" quantified; capital-occupation-adjusted rankings; assignment-drag measured; portfolio-survival curves through ≥3 historical episodes.
- **Wave 3:** each mechanism verdict (support/reject/unidentified) with pre-registered tests; dated erosion statement; 21-DTE adjudication published.
- **Wave 4:** regime-transfer matrix; loss-attribution percentages (US + India); winner-side P&L decomposition.
- **Wave 5:** one-page role statement with evidence grades; inventory-theory verdicts; design-constraint memo (including "none found" if that's the result).
- **Program-level gate:** every §8 question has an answer at stated confidence, or a written explanation of why the evidence cannot answer it (absence as finding).

---

## 13. Falsifiers

Program-level falsifiers — observations that would overturn the program's working hypotheses (stated here so they can't be dodged later):

1. **Net retail expectancy robustly positive** (Wave 1): kills the transfer hypothesis; program pivots to optimization and mechanism refinement.
2. **No positive executable VRP anywhere** (Wave 1): kills "harvest the premium" as a retail proposition entirely; pivot to demand-side (why do institutions pay?) and hedging-value research.
3. **Aggregation benign** (Wave 2): diversified short-premium books survive stress correlation — the practitioner's diversification intuition was right; the correlation-risk worry was overstated.
4. **Gamma predicts option returns strongly** (Wave 3): the dealer-feedback discourse was substantive, not decorative — upgrade V6 to a primary alpha vector.
5. **0DTE-era results match monthly-era** (Wave 4): microstructure break overstated; old evidence transfers.
6. **A retail-accessible positive-expectancy program is found** (Wave 5): the pessimistic synthesis was wrong — steelman and publish it.
7. **Loss attribution shows spreads are minor** (Wave 4): the friction framing was wrong; losses are mostly adverse selection/timing — redirect to behavioral vectors.
8. **VRP increasing, not eroding** (Wave 3): crowding narrative false; investigate *why* the premium persists despite participation growth (limits-to-arbitrage deepening?).

---

## 14. Research directions that look attractive but are probably low-information

1. **Another SPY strangle backtest with a new DTE tweak.** The gross number is already bounded (0–5%/yr); the binding uncertainty is frictions and aggregation, not the 30-vs-45 parameter. More specifications = more researcher degrees of freedom, not more knowledge.
2. **Cross-sectional ML on option surfaces without cost modeling.** Goyal–Saretto already showed the canonical result (HV−IV sorts work pre-cost, decay at quoted spreads). ML re-discovers this with more overfitting and the same cost problem.
3. **Debating entry signals (IVR thresholds, term-structure filters) in isolation.** Entry filters are second-order if exit/aggregation/friction dominate expectancy; and IVR is exchange-reported, regime-dependent, and never independently validated as an edge variable (it measures *level*, not edge — the IV-level→edge boundary failure).
4. **Retelling Volmageddon / GME as narrative.** The episodes are valuable only inside the Wave 3/4 autopsy template (positioning → trigger → feedback → P&L); standalone narratives add no decision-relevant information.
5. **Interviewing more retail educators.** The lineage graph (V10) shows this samples the same ancestral node repeatedly — ten repetitions of one claim are not ten confirmations. Interview *market makers and wholesalers* instead (V9/V11), or don't interview.
6. **"AI predicts implied volatility" without execution.** Predicting a mid is not predicting a fill (Muravyev); and IV level ≠ edge. This direction compounds two boundary failures.
7. **Pre-0DTE literature reviews that don't address regime transfer.** Summarizing the 1996–2021 literature without the Wave 4 transfer matrix produces confident-sounding but potentially dead knowledge.
8. **Optimizing the 45/50/21 composite itself.** Even a perfect optimization inherits the lineage problem (single ancestral source) and the net-friction problem; the information ceiling is a slightly better number for a possibly negative-expectancy rule.

---

## 15. What evidence ecosystem is currently most underused

**Regulatory and enforcement-grade datasets — specifically the Indian F&O record and origin-coded US options data.** Ranked:

1. **SEBI's F&O studies + the Jane Street enforcement (2025).** Population-scale, regulator-measured, with weekly index expiries (a structural cousin of 0DTE), loss concentration by intensity, ~90% loss persistence, and — uniquely — a named, quantified winner on the other side (₹36,700 crore gains / ₹4,850 crore disgorgement). US-centric research cites none of it. It is the closest the domain has to a controlled experiment in retail derivatives outcomes, and it directly answers "what happens at scale" without identification gymnastics. (IDENTIFIED-TRACEABLE via consistent multi-outlet reporting; the primary SEBI reports themselves not directly read — VERIFIED would require reading them.)
2. **CBOE LiveVol Open-Close data with origin codes** (customer / firm / market-maker / professional customer), with academic pricing ($750/yr EOD per SEC fee filings — VERIFIED). This is the only broad source that separates *who* trades. Almost every "retail does X" claim in both practitioner and academic discourse is inferred; this data measures it. Underused because it's paywalled and requires microstructure competence.
3. **The intermediary-pricing literature's time-of-day results** (FMA 2025 "Intermediary Option Pricing": premium concentrated in nights/weekends; shadow gamma). Practitioner discourse has no representation of this at all — it implies a structural, mechanical reason retail can't harvest part of the premium. One working paper, zero follow-up in the retail-facing world.
4. **OCC exercise/assignment data (1973+).** Assignment economics — the actual realized drag of early exercise, pin risk, after-hours assignment — is discussed anecdotally everywhere and measured nowhere public. The data exists at the clearinghouse.
5. **The 0DTE retail-outcome corpus (2023–2026).** Beckmeyer–Branger–Gayda, the FMA Texas strategy-quantile paper, the Utah/Brogaard volatility papers — a fresh, directly-on-point empirical literature measuring retail P&L *by strategy* that post-dates nearly all practitioner doctrine. The median-vs-mean inversion in the FMA quantiles is the single cleanest empirical object in the retail debate.

Honorable mention: **historical CBOE data to 1973** (MDX claims it) — would let researchers test whether any finding survives the floor era, decimalization, and the pre/post-1987 volatility regime; almost untouched because it's expensive and hard.

---

## 16. What question should be researched next, and why

**Q1: What does the canonical short-premium trade net at actual retail execution?**

Why this one, of all candidates:

- **It is the broadest falsifier.** A credible net number (or credible negative) adjudicates the central practitioner claim — "selling premium is an income strategy" — in one stroke. Every other question is downstream of its sign.
- **It unblocks the program.** If net ≈ 0 or negative: the program pivots to loss attribution (Q8) and winner-side economics (Q2) — Waves 2–4 reorient. If net is robustly positive: the program pivots to optimization and mechanism — a completely different Wave 2. No other single question determines the direction of travel this cleanly.
- **It is feasible now.** The ingredients exist: canonical implementations are fully specified (tastylive archive), index histories are public (CBOE), friction ladders are pre-specifiable (mid → quoted → origin-specific effective spreads via Muravyev's method), and independent gross replications already bound the top of the range.
- **It converts an absence into a finding.** The current state — no disclosed-friction net test of the flagship rule set — is itself the scandal the program should open with. Publishing the first honest net number, whatever its sign, is the anchor the whole literature lacks.
- **Pre-registration is natural.** Specification (45/50/21 + named competitors), friction ladder, and success criteria can all be fixed before looking — which is exactly what the lineage-tainted literature has never done.

Concrete next step (Wave 0→1 bridge): pre-register the replication protocol — instruments (SPX/SPY), period (2005+), implementations (canon 45/50/21, passive 30-DTE/5-DTE-exit, BXMD-style 30-delta), friction ladder (midpoint / quoted half-spread / Muravyev-adjusted effective spread / retail-broker commission schedules), and the benchmark set (T1d) — then run it.

---

## 17. What should be researched after that

**Q2 (second pass): Who captures the documented premium, through which mechanical channels?**

Why second: Q1's answer determines *how much* leaks at retail execution; Q2 determines *where it goes*. If Q1 finds net ≈ 0, Q2 is the natural sequel — the premium the literature proves exists must be someone's revenue. The decomposition (market-maker spread capture × execution-timing heterogeneity × wholesaler internalization × night/weekend gap premium × the Jane Street-style flow business) turns a diffuse "friction" into named recipients with measured shares. This requires Wave 1's baselines plus origin-coded data (Wave 0 feasibility) and the Wave 4 winner-side material — which is why it follows Q1 rather than running first: you can't attribute a leakage you haven't measured.

If Q1 instead finds robust positive net expectancy, the "after that" changes: the follow-up becomes **Q3 (aggregation/survival)** — because a positive trade-level edge that dies at the portfolio level is the next binding constraint, and the correlation-risk mechanism (§1.2) is the prime suspect. The program should pre-commit to this branch: *Q1-positive → Q3; Q1-null/negative → Q2.*

---

## 18. Long-horizon research backlog

Beyond the five waves, in rough priority order:

1. **Demand-side economics of options.** If the premium is insurance compensation, who is the natural buyer and why don't they self-insure? (Pension/structured-product bid for downside puts; covered-call overwriting supply.) The literature models the premium; the *institutional plumbing* behind the bid is under-documented.
2. **Volatility-of-volatility and gap-risk pricing.** The intermediary literature points at gap risk (nights/weekends) as the priced component. A dedicated program on *when* gap risk is priced vs realized — event calendars, earnings, elections — would connect V6 to tradeable structure.
3. **The 1987-scale out-of-sample problem.** No living strategy has seen a 22%-in-a-day event in the electronic/0DTE era. A program on "what breaks first" — margin algorithms, wholesaler internalization, 0DTE liquidity — using simulated 1987-magnitude shocks on current microstructure, would be the honest stress test nobody runs.
4. **Tax and account-structure effects.** IRA vs taxable treatment of premium "income," wash sales on rolls, 1256 contracts (SPX) vs equity options — practitioners mention these; nobody has measured their expectancy impact. Potentially first-order for US retail.
5. **International comparative: Korea, Taiwan, Brazil.** Other markets with huge retail derivatives participation and different microstructures (e.g., KOSPI200 options' history as the world's most active contract). Tests which findings are US-structure-specific.
6. **The education industry's P&L.** If broker-affiliated educators' rule sets have turnover rates measurable against 606 routing economics, the commercial-product-shape hypothesis (background finding) becomes testable: does rule turnover predict broker revenue per account?
7. **Long-dated options (LEAPS) as a separate domain.** Nearly all evidence is ≤1-year tenor. LEAPS' different clientele (hedgers, overwriters) and tax treatment may make the VRP boundary different — unmapped.
8. **Crypto options (Deribit).** A 24/7 market with no nights/weekends — the perfect falsifier for the intermediary gap-risk story (V6): if the night/weekend premium disappears in crypto, the mechanism is confirmed; if it persists, it's not about market closure.
9. **Options in retirement/decumulation.** The "income" framing targets retirees; the sequence-of-returns interaction between premium harvesting and withdrawals is unstudied and potentially devastating (selling vol into a drawdown to fund spending).
10. **Market-design counterfactuals.** What would retail outcomes look like under alternative structures (auction mechanisms, frequent batch auctions for options, spread-priority rules)? The 0DTE debate is really a market-design debate wearing a strategy costume.

---

## 19. What we do not yet know to ask

Genuine unknowns — questions whose *form* isn't yet clear, listed so the program can recognize them when they arrive:

- **What is the equilibrium of the retail options market?** We measure losses and winners' gains, but we lack a model of the full ecology: who supplies what risk to whom, at what price, and whether the current configuration is stable or transitional (e.g., does 0DTE growth end in a Volmageddon-like reset or a new steady state?).
- **Is "the volatility risk premium" one thing or several?** Index VRP (correlation risk), single-name VRP (idiosyncratic/intermediary), night/weekend VRP (gap risk), energy VRP (hedging pressure) — the program treats these as one label; they may be distinct phenomena with distinct harvestability. We don't yet have the taxonomy.
- **What does the market look like to the intermediary?** All our data is from the outside (prints, quotes). The wholesaler/market-maker's internal view — inventory, internalization decisions, timing algorithms — is the dark matter of this domain. We don't know what questions their data would answer because we've never seen it.
- **How does the domain end?** Regulatory (SEBI-style curbs spreading), structural (0DTE → continuous expiries → event contracts), or competitive (edge fully arbitraged) endpoints would each invalidate different parts of the evidence base. We have no framework for evidence *expiration dates*.
- **What is risk for a short-volatility portfolio?** Volatility-of-portfolio, drawdown, margin-call probability, and "probability of ruin before edge materializes" are different quantities; the domain has no agreed risk measure for the thing practitioners actually hold. Without it, "risk-adjusted return" claims are undefined.
- **Are we measuring the right participants?** "Retail" in 2026 includes algos running on retail brokerage APIs (the OPRA synchronization finding). The participant taxonomy (retail vs pro vs intermediary) may already be obsolete — and with it, every participant-conditioned claim.

---

## 20. Source and evidence ledger

**Directly read (VERIFIED):**
- SEC press release, "SEC Staff Releases Report on Equity and Options Market Structure Conditions in Early 2021" (Oct. 18, 2021) — https://www.sec.gov/newsroom/press-releases/2021-212 — read 2026-09-27. Confirms the report's existence, date, focus (GME Jan 2021), and the four study areas (brokerage trading restrictions; digital engagement practices and PFOF; dark pools/wholesalers; short selling).
- OCC homepage/market-data pages — https://www.theocc.com/ (via search-result URLs) — read via search index 2026-09-27: OCC clears all US listed-options trades; publishes monthly volume data; 2026 daily average ~70M contracts. (Index-based; treat figures as approximate.)
- CBOE fee-schedule SEC filings (SR-CboeBZX-2025-116, SR-CboeBZX-2025-063) — via search index: Cboe LiveVol Open-Close academic pricing $750/yr EOD. (Index-based.)
- EconBiz record for Muravyev & Pearson blocked by bot wall (Anubis) — recorded as access failure, not retried per policy.

**Identified and traceable (IDENTIFIED-TRACEABLE — specific named sources located via search; contents known via abstracts, working-paper quotes, or consistent multi-outlet reporting; not directly read):**

*Peer-reviewed / academic:*
- Coval, J. & Shumway, T. (2001). "Expected Option Returns." *Journal of Finance* 56(3), 983–1009.
- Bakshi, G. & Kapadia, N. (2003). "Delta-Hedged Gains and the Negative Market Volatility Risk Premium." *Review of Financial Studies* 16(2), 527–566.
- Carr, P. & Wu, L. (2009). "Variance Risk Premiums." *Review of Financial Studies* 22(3), 1311–1341.
- Driessen, J., Maenhout, P. & Vilkov, G. (2009). "The Price of Correlation Risk: Evidence from Equity Options." *Journal of Finance*.
- Broadie, M., Chernov, M. & Johannes, M. (2009). "Understanding Index Option Returns." *Review of Financial Studies*.
- Goyal, A. & Saretto, A. (2009). "Cross-Section of Option Returns and Volatility." *Journal of Financial Economics*.
- Cao, J. & Han, B. (2013). "Cross Section of Option Returns and Idiosyncratic Stock Volatility." *Journal of Financial Economics*.
- Hu, G. & Jacobs, K. (2014/2015). "Volatility and Expected Option Returns."
- Bali, T. & Murray, S. (2013). "Does Risk-Neutral Skewness Predict the Cross Section of Equity Option Portfolio Returns?" *Journal of Financial Economics*.
- Vasquez, A. (2012/2017). Term-structure slope and option returns.
- Heston, S., Jones, C. & Khorram, M. — "Option Momentum."
- Jones, C. & Shemesh, J. (2010). "The Weekend Effect in Equity Option Returns."
- Christoffersen, P., Fournier, M. & Jacobs, K. (2013). "The Factor Structure in Equity Option Prices."
- Choy, S. (2015). Retail trading proportion and option returns.
- Muravyev, D. & Pearson, N. (2020). "Option Trading Costs Are Lower than You Think." *Review of Financial Studies* — quotes via working-paper PDF (cicfconf.org) and author's appendix (dmurav.com).
- Muravyev, D. (2016). Order imbalances and option return reversal.
- Ni, S., Pearson, N. & Poteshman, A. (2008). Volatility information in options; Ni et al. (2021) — MM rebalancing → stock volatility/jumps.
- Hu, J. (2014). Delta-hedging-induced order imbalance predicts stock returns.
- Baltussen, G., Da, Z., Liao, S. & Peng, M. (2021). Short gamma → end-of-day hedging, intraday momentum.
- Gârleanu, N., Pedersen, L. & Poteshman, A. (2009). "Demand-Based Option Pricing." *Review of Financial Studies*.
- Lakonishok, J., Lee, I., Pearson, N. & Poteshman, A. (2007). "Option Market Activity." *Review of Financial Studies*.
- Poteshman, A. & Serbin, V. (2003). "Clearly Irrational Financial Market Behavior." *Journal of Finance*.
- Bauer, R., Cosemans, M. & Eichholtz, P. (2009). "Option Trading and Individual Investor Performance." *Journal of Banking & Finance*.
- Bryzgalova, S., Pavlova, A. & Sikorskaya, V. — "Retail Trading in Options and the Rise of the Big Three Wholesalers." *Journal of Finance* (2023).
- Eaton, G., Green, T., Roseman, B. & Wu, Y. (2022). Retail brokerage outages and options demand pressure.
- de Silva, T., Smith, K. & So, E. (2022). Retail losses around earnings announcements.
- Beckmeyer, H., Branger, N. & Gayda, L. (2023). "Retail Traders Love 0DTE Options... But Should They?" SSRN 4404704.
- "Losing is Optional: Retail Option Trading and Expected Announcement Volatility." MIT/SSRN 4050165.
- FMA Texas 2026 paper — retail 0DTE strategy-level P&L quantiles (fmaconferences.org/Texas/Papers/827.pdf).
- Brogaard et al. — "Does 0DTE Options Trading Increase Volatility?" (IV design, Robinhood outages).
- University of Utah 0DTE paper — 1σ 0DTE volume → +14% intraday S&P vol (via FA-Mag reporting).
- FMA 2025 — "Intermediary Option Pricing" (fmaconferences.org/Derivatives2025/47.pdf): shadow gamma, night/weekend returns.
- de Fontnouvelle, P., Fishe, R. & Harris, J. (2003). SEC study of option spreads.
- Battalio, R., Hatch, B. & Jennings, R. (2016). PFOF and option spreads.
- Bondarenko, O. (2019). "Historical Performance of the Put-Write Index."
- Whaley, R. (2002). BXM construction (CBOE-commissioned).
- Hu, J., Jacobs, K. & Seo, S. (2022). *Review of Asset Pricing Studies*; Bollerslev et al. (2023, JFE); Nucera et al. (2024, RFS); Orłowski et al. (2024, MS); Heston et al. (2024, cross-asset VRP).
- Barberis, N. & Huang, M. (2008). Skewness preferences; Boyer, B. & Vorkink, K. (2014).

*Institutional:*
- Israelov, R. & Nielsen, L. "Covered Calls Uncovered." AQR. (https://www.aqr.com/-/media/AQR/Documents/Insights/Journal-Article/Covered-Calls-Uncovered.pdf)
- AQR. "Chasing Your Own Tail (Risk)" (2011) and "Revisited" (2019).
- AQR. "An Alternative Option to Portfolio Rebalancing" (2018).
- OptionMetrics research note (DeSimone & Shih, via Barchart 2024) — Volmageddon VIX-options forensics using IvyDB signed volume.

*Regulatory / official:*
- SEC Staff Report on Equity and Options Market Structure Conditions in Early 2021 (report itself; press release VERIFIED above).
- SEBI F&O studies FY22–FY25 (via consistent multi-outlet reporting: 91% lose; ₹1.06 lakh crore FY25; 41% YoY rise; participation 61.4L→42.7L within FY25).
- SEBI enforcement vs Jane Street (2025): ₹36,700 crore gains over 26 months; ₹4,850 crore disgorgement ordered (via multi-outlet reporting).
- OCC volume/OI statistics (theocc.com).
- Brady Report (1987) — named, not located in this investigation.

*Exchange / data:*
- CBOE strategy-index methodologies and dashboards: BXM, PUT, PUTY, BXMD, BXN, BXD, WPUT, PUTR, CNDR, BFLY, CMBO, CLL, PPUT, VXTH (cboe.com).
- Wilshire 2019 PUT evaluation (CBOE-commissioned).
- OptionMetrics IvyDB US / Intraday / Europe / Asia / Canada / Global Indices (vendor announcements 2025–2026; WRDS; CRSP link; Snowflake).
- CBOE DataShop/MDX; Cboe LiveVol Open-Close data.

*Professional books / oral history (existence VERIFIED via booksellers; contents not read):*
- Natenberg, S. *Option Volatility & Pricing*; Sinclair, E. *Volatility Trading*, *Option Trading*, *Positional Option Trading*; Taleb, N. *Dynamic Hedging*; Cottle, C. *Options Trading: The Hidden Reality*; McMillan, L. *Options as a Strategic Investment*; Gleadall, S. *Option Gamma Trading*; Augen, J.; Hull, J.; Passarelli, D.; Chen, D. & Sebastian, M.; Schwager, J. *Market Wizards: The Next Generation*.
- Options Insider Radio (Mark Longo); "Confessions of a Market Maker" podcast; Mat Cashman (OCC) "Reminiscences of a Market Maker" interview.

*Practitioner-lineage materials (for V10 lineage graph; contents via secondary compilations):*
- tastylive Market Measures archive: Fabian (2016) strangle studies; Zeng (2024) 21-DTE study.
- Independent replications: SteadyOptions (SPX 16-delta 2001–2020); SJ Options (2005–2016); dtr-trading (2007–2018).
- Corporate: thinkorswim ~$606M (2009); tastytrade $1.0B (2021).

**Inference (INFERENCE — analyst judgments, not sourced):**
- Gross index-strangle expectancy bound ≈ 0–5%/yr; net at retail execution likely near zero or negative.
- "Diversified" single-name short-premium books likely concentrate (not diversify) in crises via correlation spikes.
- Return on occupied capital may invert practitioner rankings.
- Retail traders are plausibly the non-timing group whose wide spreads fund timers' discounts (Muravyev mechanism applied to participant types).
- ~1 independent origin for the 45/50/21 composite (expected lineage-graph result).

**Absence of evidence (ABSENCE-OF-EVIDENCE — searched, not found):**
- No disclosed-friction net test of the 45/50/21 composite.
- No academic test of the 45/50/21 composite as a composite.
- No measurement of assignment/early-exercise drag on retail short-call programs.
- No study of dealer positioning → option returns (only → stock returns).
- No agreed risk measure for short-volatility portfolios.
- No account-level retail options panel available to researchers (only brokers/regulators hold them).
- No evidence on whether VRP findings transfer to the 0DTE regime.
- No loss-attribution decomposition of SEBI/Beckmeyer aggregate loss figures.

---

*Notes: working drafts for sections 1–7, 8–14, 15–20 are retained at notes/draft-a.md, notes/draft-b.md, notes/draft-c.md. This report.md is the assembled deliverable.*