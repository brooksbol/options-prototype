# Primary-Evidence Upgrade: The Canonical Short-Premium Trade at Retail Execution

**Date:** 2026-09-27
**Assignment:** Adversarial, primary-source upgrade of the evidence foundation behind the proposed experiment — *"What does the canonical short-premium trade net at actual retail execution?"* (Q1)
**Research state at start:** PRE-WAVE-0 / PRIMARY-EVIDENCE UPGRADE
**Deliverable:** this integrated report, built from eight independent evidence tracks (A–H), each completed 2026-09-27.

**Hard stop boundary (honored):** no Q1 backtest was run; no parameter optimization or 45/50/21 search; no trade or strategy recommendations; no software or product design. Calculations below are source-understanding arithmetic only (decompositions of published exhibits, fee schedules, methodology documents).

**Evidence taxonomy (strict, per assignment):**
- `VERIFIED` — sufficient primary material directly inspected. *Caveat applied throughout: VERIFIED means the source reports what it reports — it is not a guarantee the source's conclusions are true about the market.* Paper-reported facts are distinguished from market truths (§18).
- `IDENTIFIED-TRACEABLE` — source exists and is located/citable, but direct inspection was insufficient. (Track A's `VERIFIED-SECONDARY` label is normalized into this bucket everywhere below.)
- `INFERENCE` — follows from inspected material plus stated reasoning; not asserted by any source.
- `ABSENCE-OF-EVIDENCE` — an appropriate search found nothing; not evidence of absence.
- `CONTRADICTED` — inspected evidence contradicts the claim as stated.

**Prior reports are hypothesis registers, not answer keys.** The 2026-09-26 research-program design and the comparative landscape redo were used as lead lists only. Where this upgrade reverses them, the reversal is stated openly (§20).

---

## 1. Executive verdict

**Three claims that anchored the program's prior foundation were falsified or materially narrowed:**

1. **The presumed low-single-digit gross baseline for the canon is CONTRADICTED as stated.** Independent "replications" pool incompatible structures, deltas, loss rules, cadences, denominators, and friction assumptions; several circulating "annual" figures are arithmetic extrapolations, not sequential portfolio returns. The honest bounded statement: some index short-premium studies report positive *gross per-trade* expectancy; transparent sequential-account results range from **negative/flat to low-single-digit**, and no inspected study supplies a complete net, sequential replication of the exact 45/50/21 composite with disclosed retail costs.
2. **The reverse-boundary claim was mis-signed.** The program's "diversified single-name short book is structurally long correlation" formulation is CONTRADICTED as stated (Track C): long dispersion is short correlation; a short-single-name-vol book with no index leg is not a correlation position. The corrected mechanism — common-downside-factor concentration in stress — is an `INFERENCE` with a stated chain, supported by adjacent evidence, and the exact portfolio test has never been run (`ABSENCE-OF-EVIDENCE`).
3. **The "regulatory goldmine" framing is downgraded.** SEBI's population F&O studies are the best retail-derivatives outcome data on earth (VERIFIED, exact figures §15), but they are published PDFs, not analyzable microdata; the US is an outcome-data desert; the Jane Street order is counterparty-blind, interim, and an order of magnitude smaller than the aggregate retail losses it is juxtaposed with. Regulatory evidence is a **calibration source with hard access ceilings**, not a substitute for missing US net-execution evidence.

**What survived upgrade:** the index variance risk premium (VERIFIED across multiple primary papers, with model conditions stated); the implied-vs-realized correlation wedge and index/constituent VRP contrast (three independent arrivals); the SEBI loss-incidence figures (VERIFIED, India-specific with stated haircuts); the Cboe index conventions and their systematic flattering direction (VERIFIED); the friction-matrix structure of retail execution costs (VERIFIED cells + one critical empty cell); the participant-data feasibility map (customer≠retail VERIFIED; P&L incidence not answerable VERIFIED).

**Disposition:** Q1 cannot be preregistered without relying on unexamined premises — the exact composite has no canonical specification in the primary record, no inspected net sequential replication exists, and the single most important cost input (SPX retail effective spread) has no primary empirical estimate. The highest-information-value next experiment is not Q1 but its prerequisite: a dedicated execution-calibration study that builds the instrument × order-type × size × DTE × period friction matrix Q1's preregistration depends on. That study is answerable from primary sources without running a backtest, and once done it unlocks Q1. (The formal disposition line appears once, at the end of §26.)

---

## 2. Claims upgraded to VERIFIED

Each claim below was confirmed in primary material directly inspected this session. "Source reports X" ≠ "X is true of the market" — §18 audits that boundary.

### V-01. Index variance risk premium exists in delta-hedged option returns
Bakshi & Kapadia (2003, *RFS*; 1988–1995): long delta-hedged S&P 500 options produced significant losses. Full paper inspected. No transaction-cost test; daily hedging; historical market structure. Does not establish a retail-harvestable strategy.

### V-02. Implied-vs-realized correlation wedge (DMV companion WP, 1996–2012)
S&P 500 30-day implied correlation **39.46%** vs realized **32.59%**; DJ30 implied **46.03%** vs realized **35.53%**. Companion working paper (July 2013) inspected in full. Published JF 2009 version not directly inspected — numbers reported with vintage.

### V-03. Index VRP > average constituent VRP; constituent average ≈ 0
DMV: constituents realized **41.99%** vs implied **43.38%** — not statistically distinguishable *on average*. Independently corroborated by Buraschi–Kosowski–Trojani (30 liquid names: implied 32.7% vs realized 31.8%, insignificant) and Buraschi–Trojani–Vedolin (S&P 100: implied 32.7% vs realized 31.8%). **Three independent arrivals of the stylized fact.** DMV's own tests reject the zero individual-VRP null for a material minority (503 of 919 non-rejections at 30 days) — the full-attribution premise is self-qualified as a first-order approximation.

### V-04. Correlation-risk exposure priced, with severe crisis losses (BKT 2011 WP)
Short-correlation proxy losses **−24.4%, −12.4%, −7.5%** in Sep/Oct/Nov 2008; average pairwise correlation **35.83% → 65.14%**; most-negative-correlation-beta fund portfolio **75% max drawdown** vs 5% for most-positive. Full WP inspected. Hedge-fund cross-section is adjacent evidence for a single-name option book, not a direct test.

### V-05. Dispersion profitability is period-dependent and friction-fragile
Deng (2008), full text inspected: naive dispersion monthly returns **24% (1996–2000) → −0.03% (2001–2005)**; Sharpe **1.2 → −0.17**. BTV (2009 WP inspected): DMV's correlation strategy "does not yield significant abnormal returns after transaction costs and margins"; all-constituent implementation "too costly." Bossu (2016), inspected: post-2008 single-stock variance-swap liquidity dried up; vanilla dispersion P&L "only very loosely connected to correlation."

### V-06. Sign convention: long dispersion ≡ short correlation
BTV and Bossu both establish this; a book of short single-name options with **no index leg** is not a correlation position per se. This is the correction to the program's prior "structurally long correlation" phrasing.

### V-07. Dealers persistently net short deep-OTM SPX puts; overnight premium = unhedgeable-inventory compensation (Terstegge 2025)
Full paper inspected: dealer positions 2011–2023, ~19M contracts net short deep OTM SPX puts; negative delta-hedged returns concentrated overnight/weekends; 2006 overnight-equity-liquidity natural experiment; 10% SPX drop → dealer losses ≈ 2× inventory value absent rehedging (~$8B equity sales to fully hedge). Working-paper status limits weight, not the label. Attribution is the author's interpretation, not a participant P&L ledger.

### V-08. SEBI individual F&O loss incidence (four primary documents inspected)
- Jan 2023 (PR 02/2023): **9 in 10** net losses FY19 & FY22; avg ₹50k FY22; +28% TC drag over net losses; 98% traded options; top-10 brokers, 67% turnover.
- Sep 2024 (PR 22/2024): **93%** FY22–FY24; ~₹2L avg over 3 years incl. TC; >₹1.8L cr aggregate; prop **+₹33k cr** / FPI **+₹28k cr** gross FY24; 97%/96% algo.
- Jul 2025 (PR 39/2025): ~91% FY25 — **revised** by Aug-2026 study to **90.9%** / **₹1.12 lakh cr** (supersedes press-circulated ₹1.05–1.06L cr).
- Aug 2026 (91 pp.): "individual" = resident individuals + **HUFs + NRIs + sole proprietorships** (includes HNIs); top-15 brokers, 92.3%/89.6% of traders; Net = Gross − TC; TC mix brokerage 44% / **STT 27%** / exchange 16% / GST 11%; FY25–FY26 **91.0%** / **₹2.03L cr** — exceeding FY22–FY24's ₹1.81L cr; gross loss incidence **82.1%** vs net **87.7%** (costs push ~5.6pp from profit to loss); options = 92% of losses; 99.3% traded options, 93% only options; **23% of traders ≈ 90% of losses**; tenor: FY25 **70% expiry-day / 80% within-one-day / 98% within-week** index-options turnover; category P&L FY26 gross: prop **+₹44k cr** / FPI **+₹39k cr** / individuals **−₹72k cr**; 99% algo (flag imperfect).
- Aug 2026 behaviour study (53 pp.): strategy section on **n≈5,050 random sample, explicitly "only indicative"**; "Majorly Options Sellers" (≥50% premium turnover from selling): **lowest loss incidence 44%** but **₹543 cr aggregate losses, avg ₹51.7L per loss-maker** — 11× "Majorly Options Buyers" (₹4.6L), >30× futures traders (₹1.7L). Numbers VERIFIED as SEBI's reported sample statistics; reading this as a short-volatility signature is INFERENCE.

### V-09. Jane Street interim order: mechanism alleged in detail; numbers and limits as stated
Order WTM/AN/MRD/MRD-SEC-3/31516/2025-26 (Jul 3, 2025; 105 pp., inspected): intraday index manipulation (Patch 1 / Patch 2) + extended marking the close; JS group total profit **₹36,502.12 cr** (exam period Jan 2023–Mar 2024... [sic: Jan 1, 2023 – Mar 31, 2025]), index-options profits **₹43,289.33 cr**, **impounded ₹4,843.57 cr**; **interim, ex parte, prima facie only**; JS denies wrongdoing; **no counterparty identification**; para 35/46 hedges — index-options profits "**may well account for some part of**" the retail-loss finding. Arithmetic: JS's entire-period profit ≈ **one-sixth** of aggregate individual losses over a comparable window; impounded amount ≈ 1.5–2.5% of aggregate retail losses.

### V-10. The US is an outcome-data desert for retail options
SEC Oct-2021 GameStop staff report (inspected): "market makers trade profitably with retail order flow" — a market-structure statement, **no retail P&L data**. FINRA NFCS Dec-2025 (inspected): 43% account access, 21% traded options — participation only. OCC: aggregate volume/OI/exercise only. CFTC retail-forex quarterly disclosures (17 CFR §5.5, rule text inspected): the only standing US regulatory outcome panel — **spot forex, not options**.

### V-11. Retail fee chain, dated (official pages inspected 2026-09-27)
tastytrade commissions page ("Last updated July 30, 2026"): **$1.00/contract to open, $0.00 to close**; **SPX single-listed proprietary fee $0.60**; clearing $0.10; exercise/assignment $0.02; **FINRA TAF $0.00329/contract for option sales** (sales only — asymmetry matters); **SEC fee $20.60 per $1M in sales** (as of Apr 4, 2026). OCC clearing fee **$0.025/contract from Jan 1, 2025** (infomemo 55624) with **$0 fee holiday Dec 1–31, 2025** (SEC filing; 2026 schedule unconfirmed — INFERENCE that it reverted). Worked all-in fixed cost: SPX sell-to-open + buy-to-close ≈ **$2.30/contract** + TAF/SEC on the sell leg(s) + ORF both legs. TAF must be modeled by side, not as a symmetric round-trip add-on.

### V-12. Execution-cost anchor points (papers inspected)
- Muravyev & Pearson (2003–06, liquid equity options): quoted 8.1¢/share, conventional effective 6.2¢ on $1.70 options; **authors explicitly prescribe the conventional effective spread for ordinary retail/non-timers** — the 1.3¢ timing-adjusted rate is timers-only.
- Anand & Muravyev (OPRA, mainly May 2021): avg quoted **≈9%**, effective **6.87%**, EQ ratio 0.82; auctions (19.4% of trades) EQ **0.49** vs regular **0.90**.
- Ernst & Spatt (inspected): options PFOF "prevalent… potentially more so than equities"; **PFOF-paying DMMs causally widen spreads**; price-improvement auctions ≈15% of option trades, $200–600M/month; cross-asset reversal: equity wholesalers narrow spreads, option DMMs widen them.

### V-13. Cboe strategy-index conventions (current methodologies inspected)
- **PUT** (v3.1, rev. 2026-09-21): monthly ATM SPX put, sold at **OPRA VWAP 11:30 a.m.–12:00 p.m. ET** (last bid if no trades), held to maturity, settles vs **AM SOQ**, T-bill collateral at 4-week/13-week bank discount rates, **zero commissions/fees/taxes**. Base **Jun 1, 1988**; launched **Jun 20, 2007**.
- **BXM**: pricing-convention history (SEC Release 34-57946, inspected): pre-Oct 1992 roll at close/last bid → 1992–2004 11:00 a.m. CT/last bid → **Jun 18, 2004 → VWAP**; VWAP window extended Nov 19, 2010. The 2004 switch is a documented fill-convention upgrade on all subsequent history.
- **PUTR conflict**: methodology (v2.0, 2025-10-15) says launched **Nov 23, 2015**, base Jan 31, 2001; current factsheet says launched **Mar 3, 2026**, first value Aug 13, 2018 — apparent restart/recalculation, reason unresolved.
- **WPUT/WPTR, CMBO**: bid-side conventions (first bid after open; last bid before 4 p.m.; PM-settlement expiries bought at last ask) — the most retail-achievable in the family, and notably WPUT (bid) Sharpe 0.40 < PUT (VWAP) 0.50 over 2006–2018.
- **No Cboe index implements 45/50/21** (monthly holds to expiry; no profit-taking; no 21-DTE exit). No Cboe put-spread index exists (searched; ABSENCE-OF-EVIDENCE).
- PUTR live window: MDD **−32.9%** vs Russell 2000 −32.2% — the downside-cushion claim fails on this window. BXMD MDD −42.7% vs BXM −35.8%.
- CMBO backfill discontinuity: **Mar 2006–Aug 2018 used EFA/EEM ETF options**; MXEA/MXEF index options only from Aug 17, 2018.

### V-14. Practitioner backtest cost/fill models (pages inspected)
- **ProjectOption iron condor**: "$1 per contract commission schedule (no ticket/per-trade charge)" → **$8 round trip per one-lot four-leg condor**; commission-turnover model VERIFIED. **Fill model undisclosed** (ABSENCE-OF-EVIDENCE) — commission evidence, not executable-spread evidence.
- **SJ Options** ("does tastytrade work"): SPX 16Δ strangle, 2005–early 2016, 45 DTE, IVR 50–100%, 50% winners, 2×-credit stop: every trade filled at **MID — source's own words "not likely"**. No cost model. Results: 65% win rate; **15% margin use: +2% cumulative (~0%/yr)**; 25%: −10%; 35%: −61%; 70%: −93%, stopped 2011. Modified wider stop: **+33% cumulative (~3%/yr)** at 15% margin; higher allocations still negative. This is a near-family replication, **not** the 21-DTE composite.
- **SteadyOptions ORATS** ("Iron Condors or Short Strangles?", May 2020, inspected): 30Δ SPY strangle since 2007: **5.34%/yr (vol 8.36%, Sharpe 0.64)** vs 30Δ iron condor with 20Δ wings **0.15% (vol 3.08%, Sharpe 0.05)**; "the additional transaction costs and performance drag of the long options is so significant that almost the entire return generated from the short options disappears." **The backtest's own cost model is undisclosed in the article** (ABSENCE-OF-EVIDENCE).
- **DTR iron condor** (45 DTE, SPX 2007–2016, 96,624 trades, 8/12/16/20Δ, 25/50/75 wings): **no cost model and no fill model stated** in either inspected methodology page.

### V-15. Single-name VRP: significant but heterogeneous and cost-fragile
- Bakshi & Kapadia (*JoD* 2003), full paper inspected: **smaller but significant aggregate negative effect in 25 large stocks**, wide heterogeneity. Blanket "≈ zero" is contradicted.
- Carr & Wu: inspected draft/final distinction — level metric 3/35 vs 7/35 significant; **log metric 21/35 vs 23/35 significant**. The "zero" claim depends on metric and vintage.
- Goyal & Saretto (working draft inspected): cross-sectional RV/IV sort **21.9%/month at midpoint → 4.1% at full quoted spreads**; illiquid-name results negative/insignificant at full spreads.
- Dickerson et al. (2026 WP inspected): **≈ −18% to −20%/yr systematic variance-risk price** across SPX, stocks, ETFs — but average total delta-hedged stock-option returns mostly insignificant. Result depends on a VIX²-scaled specification, nonparametric deltas, delevered returns, midpoint pricing, **no cost test**.
- Santa-Clara & Saretto (working draft inspected, 1985–2002): spreads and **margin calls** sharply reduced paper Sharpe and scale; margin calls force liquidation when positions are losing.

### V-16. Participant-data mechanics (specs inspected)
- Cboe Open-Close EOD spec v1.3: **86 columns**; MM buy/sell only (no open/close); customer/pro-customer size buckets (<100/100–199/≥200); **prices are series-level first/high/low/last only** — no per-participant premium fields.
- Cboe factsheet legend: "Customer/Individual: **Retail investors and institutional clients**" — customer≠retail VERIFIED. Pro-customer boundary: **>390 orders/day** (C1 rule book) — activity-based, not identity-based.
- Academic pricing inapplicable: DataShop policies restrict to accredited institutions, **excluding industry-funded research**; commercial rates apply to an independent program. The "~$750/year academic open-close" figure was a **2025 BZX-specific** rate; current C1 academic EOD is $1,500 first year + $125/mo — and unavailable to this program regardless.
- OCC public data (endpoints live-tested): cleared volume by **C/F/M** × call/put × exchange × contract date — **no open/close, no buy/sell, no price, no size buckets**; only annual aggregate exercise headlines.
- **Rule 605 excludes options** (FINRA RN 23-10: NMS stock excludes options) — CONTRADICTED as an options execution-quality source. CAT is nonpublic (SEC OIG).
- Cboe Trade-by-Trade (C1, 2026 product page + factsheet + July-2026 fee schedule): per-trade price × capacity × open/close × buy/sell + NBBO/BBO + complex execution IDs — the only located product measuring dollar premium by origin; **$12,000/mo** commercial; C1-only.
- Commercial pricing VERIFIED: C1 Open-Close EOD $600/mo; BZX/C2/EDGX $500/mo each; 1-min $4,000/mo; NYSE Arca EOD $750/mo; ISE EOD $750/mo; MIAX EOD $600/mo; MIAX Tradeby-Trade $10,000/mo.

### V-17. The 45/50/21 composite is real doctrine, assembled from separately tested components
VERIFIED: tastylive component studies date to 2015–2016 (50% target from a 10%/30%/50% sweep; 21-DTE exit with a loss-study rationale); **no evidence that tastylive ever published one study testing 45 DTE + fixed delta + 50% profit + 21-DTE exit together** (ABSENCE-OF-EVIDENCE after targeted search, consistent with the landscape redo's 97-item audit). Earliest full-composite implementation located: independent backtester spintwig, June 10, 2019. tastylive's explicit "Enter at 45 DTE, Exit at 21 DTE" segment: **July 27, 2020**. ≈30Δ appears to be a **later guideline**, not the constant in the earliest component studies. No inspected study runs a clean pre/post-2020 regime-transfer test.

### V-18. "₹35 of every ₹100 from retail" is not in the Jane Street order
The figure appears in commentary (e.g., a Medium analysis) and **nowhere in the 105-page order**. Likewise "Jane Street is the named winner on the other side of the ledger" overstates a contested, counterparty-blind record.

## 3. Claims remaining IDENTIFIED-TRACEABLE

Sources exist and are located/citable; direct inspection was insufficient. Track A's `VERIFIED-SECONDARY` items are normalized here per the assignment's taxonomy.

### T-01. Coval & Shumway ≈3% weekly ATM zero-beta straddle loss
Abstract-level only; full paper not obtained. Exists, citable, not independently verified.

### T-02. spintwig 170,500-trade / 20.77%-of-profits commission claim
Traceable strings (54 variants; 2007-01-03–2019-07-31; entries 3:46 p.m. ET; 30Δ±3.5; 45±17 DTE; exit 50% profit or 21 DTE; "20.77% — blended average percent of profits spent on commission"). **Commission model unrecoverable**: dollars/contract, sides, fees, gross/net denominator, slippage, variant dispersion all ABSENCE-OF-EVIDENCE. The primary page could not be inspected (failed fetch; not retried per stop instruction). Belongs to an independent backtester, not any practitioner corpus.

### T-03. Bryzgalova–Pavlova–Sikorskaya retail spread figures
Search extracts (full text not read): retail-faced avg bid-ask **12.6%**; SLIM transactions quoted **13.7%** / effective **6.7%** (Nov 2019–Jun 2021); size < $250: quoted 29.9% / effective 14.9%; sells 13.9%/6.1; buys 20.1%/11.0; midpoint trades 6.0% of a subset. Must be read in full before preregistration use.

### T-04. Barardehi et al., "Unpacking Retail Trading Costs"
URL located 2026-09-27; not yet inspected.

### T-05. Beckmeyer–Branger–Gayda 0DTE retail study
Conference-paper text read via search extracts: US retail SPX 0DTE; **~60% of retail losses attributed to transaction costs**; retail effective spreads about **half** of quoted. Narrow population (2021–2023, retail-identified SPX 0DTE). Exact numbers require full-text confirmation.

### T-06. Muravyev & Ni, "Option Returns: Night and Day"
Working paper (2015 McGill PDF): overnight delta-hedged returns **−1.0%/day index, −0.4%/day equity**; mildly positive intraday. Peer-reviewed publication not confirmed. Terstegge's independent SPX replication with dealer data corroborates the overnight concentration.

### T-07. Gârleanu–Pedersen–Poteshman, "Demand-Based Option Pricing" (JFE 2009)
WP text read; tables/sample window not fully inspected. End users net long index options (esp. OTM puts); dealers net short; demand pressure a first-order determinant of prices. The "end user" aggregate is not disaggregated into hedgers/speculators/retail.

### T-08. Terstegge-adjacent and mechanism literature (abstract/metadata level)
Muravyev (2016): inventory component **larger than** asymmetric-information component (JF 71). Pan & Poteshman (2006): buyer-initiated opening volume predicts single-stock returns (NBER abstract). Easley–O'Hara–Srinivas (1998): signed option volume informative (abstract). Pan (2002): jump premium **~3.5%** vs diffusive ~5.5% (S&P 500, 1989–1996). Santa-Clara & Yan (2010): ex-ante premium 70% above realized (1996–2002). Boyer & Vorkink (2014): strongly negative ex-ante skewness → individual-equity-option returns. Mason & Utke (2022): taxes capitalized in SPX vs SPY prices (exploits Section 1256). Henderson & Pearson (2011): retail structured products ~8% above fair value (64 issues). Bollen & Whaley (2004): order-flow buying pressure moves IV; vega-hedged simulated returns turn negative. Ni–Pearson–Poteshman (2005): expiration-day price clustering. Pearson–Poteshman–White (2008): option trading explains ~12% of daily absolute returns. Marshall (2009): dispersion, 2005–2007, abstract only. Buss & Vilkov (2012): option-implied betas, abstract only. Kaul–Nimalendran–Zhang (2004) and Goyenko–Ornthanalai–Tang (2014): candidates for options PIN and market-maker spread revenue — **not inspected**.

### T-09. Whaley (2002); Feldman & Roy (2005)
Findings via secondary descriptions only: BXM 1988–2001 matched S&P at <65% risk (Whaley, bid-price construction → implicit half-spread cost in early history); 1988–2004 CAGR 12.39% vs 12.20%, investable version tracking error 1.27%/yr (F&R).

### T-10. EnnisKnupp Cboe PUT paper; Cboe PUT gross-vs-net whitepaper table
First licensed PUT fund tracking vs index (Apr 2007–Oct 2008); 2007–2015 gross-vs-net table (2008: **41.9% gross → −26.8% net**; S&P −37.0%). Cboe-produced, off-domain hosting; traceable, not cboe.com.

### T-11. Retail broker schedules (Schwab, Fidelity, IBKR, Robinhood, E*TRADE, Firstrade)
Search-extract or third-party-summary level; official pages not directly read. Figures: $0.65/contract (Schwab/Fidelity, buy-to-close ≤$0.05 waived at Schwab), IBKR tiered $0.15–$0.65, Robinhood $0 + pass-through. Do not cite in preregistration without direct reads.

### T-12. OCC exercise/assignment series
Annual aggregate "contracts exercised" headlines only (Performance Highlights PDFs). No public participant-coded exercise series found.

### T-13. Cboe Trade-by-Trade exact field spec and history depth
Product page/factsheet only; field-level spec not inspected. C1-only; other exchanges "planned."

### T-14. 45/50/21 provenance secondaries (Track A normalized)
2015 third-party deck quoting the doctrine; 2015 IVR ThinkScript; Spina (2022) book-length statement of the composite (via two independent reviews); Option Alpha's 2025 "Tasty Condor" bot (45+ DTE, 20Δ shorts, 50% target, close at 21 DTE, explicitly crediting tastytrade); spintwig's SPX condor / "Mechanical Income" variants.

### T-15. FlashAlpha family-level after-cost study (Sept 2026)
**50 strategies, 7,265 trades, SPY/QQQ/IWM, 2020–2025, bid/ask fills + $0.65/contract**: short strangle mean **−0.04%/trade, Sharpe −0.32**; iron condor **−0.11%, Sharpe −0.81**. Family-level contrary evidence, **not** the exact composite. Noted in Track A; full methodology not inspected in this upgrade — does not automatically make Q1 redundant, but it changes the novelty calculus (gross family arm partially answered).

### T-16. PUT 2007–2015 gross-vs-net table (Cboe-produced, off-domain)
See T-10. Traceable; verify hosting before citing.

### T-17. ISE/Nasdaq/MIAX/NYSE product details
ISE Open/Close Trade Profile (actively offered; 2024 filings; fees unchanged since 2010); MIAX Tradeby-Trade field content uninspected; NYSE Arca 2026 fee status unreverified; Nasdaq NOTO current availability unconfirmed; Phlx/GEMX/NOM pricing individually uninspected.

### T-18. CFTC retail-forex quarterly disclosure panel
Rule text VERIFIED; the panel itself not analyzed in this upgrade. Underused cross-product datapoint; wrong product for options.

### T-19. EU/UK/Australia CFD loss-rate regimes
ESMA 74–89%, AMF 89%, FCA 82%, ASIC 68% — as cited by SEBI's global-evidence section, with SEBI's own non-comparability warning. Primary regime documents not inspected.

---

## 4. Claims remaining INFERENCE

### I-01. Common-downside-factor concentration in stress (the corrected reverse-boundary mechanism)
Chain stated (Track C): (i) short single-name options have nonlinear downside/gap exposure; (ii) stress raises common-factor dependence (BKT: 35.83%→65.14%); (iii) joint adverse moves then occur more often than normal-state correlations imply; (iv) aggregation concentrates simultaneous margin/capital demands. Plausible, adjacent-supported. **The exact portfolio test — diversified single-name short-premium book, executable fills, management rules, margin, assignment, through a correlation spike — has never been run** (ABSENCE-OF-EVIDENCE). This is distinct from DMV's index-VRP attribution and must not borrow its empirical weight.

### I-02. Correct narrow reading of DMV for a single-name book
Two distinct statements, do not merge: the book lacks the *index leg* that earns the correlation premium; separately, it carries uncompensated (or thinly compensated) common-downside exposure. Both beyond the inspected papers.

### I-03. Every documented index-convention bias flatters executable retail returns
VWAP ≥ bid; mid marks ≥ liquidation bid; T-bill rate ≥ sweep rate; SOQ frictionless vs assignment mechanics; zero costs/taxes vs real bills. No inspected bias points the other way. Direction of the management-rule mismatch (hold-to-expiry vs 50%/21-DTE) varies by regime — sign per-regime, not globally.

### I-04. PUT's headline Sharpe is carried by the backfilled segment (arithmetic on inspected exhibits)
Implied backfill Jun 1986–Jan 2006: PUT CAGR **~12.0%** vs S&P ~11.3%. Later segment Jan 2006–Dec 2018 (live since Jun 2007): PUT **5.97%**, Sharpe **0.50** vs S&P 7.59%/0.51. Live-era factsheet Jan 2007–Aug 2026: PUT Sharpe **0.52** vs S&P **0.61**. The full-sample Sharpe edge (0.65 vs 0.49) does not reproduce live. Regime confounding acknowledged (rates, 2008, post-2009 bull market punishing capped strategies) — the split is descriptive, not proof of backfill bias, but it is the correct falsification test and it fails to confirm the headline claim.

### I-05. India's frictions make SEBI loss rates an upper bound for a US analogue
STT (27% of TC, no US analogue) explains ~5.6pp of loss incidence; India's EDS is ~pure short-dated index-options buying with weekly-expiry regime (now reformed); "individual" includes HNIs/HUFs/NRIs. SEBI itself warns its global comparisons "should not be interpreted as directly comparable measures."

### I-06. Broker commissions are the dominant *fixed* retail friction; turnover structure multiplies them
tastytrade/SPX all-in fixed ≈ $2.30/contract round trip (V-11); a one-lot four-leg condor round trip = $4.80–$5.20 at $0.60–$0.65 schedules (ProjectOption V-14). ProjectOption's commission-turnover modeling reverses approach rankings — fees are load-bearing for high-turnover/many-leg structures, small for monthly 1-lot SPX.

### I-07. The 20.77% commission ratio is mechanically inflated by a small-profit denominator
A low-profit denominator inflates any commission/profit ratio. It must not be read as "$0.21 of every premium dollar." (Source-understanding note; the underlying model is unrecovered.)

### I-08. Dollar premium by origin from Open-Close is imputation with unquantified error
Series-level last-trade price × participant volume has unknown error; it is not a measurement. Only Cboe Trade-by-Trade (C1) measures it.

### I-09. Aggressor side from Trade-by-Trade NBBO/BBO context is inference, not a native field
Buy/sell ≠ aggressor. Open-Close and OCC cannot answer aggressor side at all.

### I-10. Consolidated premium-incidence picture (Track H)
The gross premium paid by buyers splits into (i) dealer/intermediary gross compensation for inventory + unhedgeable overnight/jump/correlation risk, minus (ii) adverse-selection extraction by informed traders, minus (iii) dissipated transaction/hedging costs, with (iv) tax and behavioral wedges shaping prices. **No inspected source quantifies these shares in one accounting.** Eleven proposed mechanisms collapse into seven groups to avoid double-counting: demand→inventory→overnight is one chain; spreads and transaction costs are one transfer viewed from two sides; jump and correlation risk are rival decompositions of one measured number; dealer hedging and inventory compensation overlap; behavioral demand is a source, not a recipient.

### I-11. SteadyOptions' ORATS strangle-vs-condor gap is "so significant" per the author but unmodeled
The backtest's own transaction-cost assumption is undisclosed; the author's statement that long-option "transaction costs and performance drag" erase "almost the entire return generated from the short options" is INFERENCE from the author's claim, not from a recovered model. Do not cite as a quantified cost estimate.

### I-12. SEBI's "Majorly Options Sellers" sample statistic is a short-volatility signature — indicative only
44% loss incidence with ₹51.7L average loss per loss-maker on an n≈5,050 explicitly-indicative sample: lose rarely, catastrophically. The studies do **not** support a "sellers are the winners" inference.

### I-13. Post-Dec-2025 OCC fee reversion
The $0 December-2025 holiday ending implies reversion, but the current 2026 schedule was not directly confirmed. Mark time-varying in any preregistration.

---

## 5. Claims became CONTRADICTED

### F-01. "Independent replications place canonical gross performance in a common low-single-digit annual range"
Improperly pools incompatible studies (different structures, deltas, loss rules, IV gates, cadence, overlap, leverage, denominators, friction assumptions); many report per-trade statistics, not sequential portfolio returns; several circulating "annual" figures are arithmetic extrapolations (ProjectOption's "45-day adjusted P/L" = average P/L × 45 / average days — arithmetic, not redeployment).

### F-02. Blanket "single-name VRP ≈ zero"
Contradicted by Bakshi–Kapadia JoD 2003 (significant aggregate negative effect, heterogeneous), Carr–Wu (log metric: 21–23/35 significant), Goyal–Saretto (midpoint assumptions), Dickerson et al. 2026 (−18% to −20%/yr systematic price). The evidence requires distinctions among total vs systematic VRP, level vs log premium, conditional vs unconditional effects, and factor price vs net implementable strategy return.

### F-03. Unconditional "index VRP is entirely correlation risk"
Model-conditional on (a) nonpriced individual variance risk — which DMV's own tests partly reject — and (b) a homogeneous correlation structure. The crisis-inclusive subsample (2008–2012) breaks the index VRP's significance; newer literature frames variance risk as a co-contributor.

### F-04. "A diversified single-name short-volatility book is structurally long correlation" (as stated)
Mis-signed. Long dispersion is short correlation (BTV, Bossu). A short-single-name-vol book with no index leg is not a correlation position; its stress exposure is common-downside-factor concentration (I-01), a distinct mechanism.

### F-05. Muravyev–Pearson timing-adjusted spread for ordinary retail
Authors explicitly assign it to timers; retail/non-timers face the conventional effective spread.

### F-06. Price improvement ≈ midpoint fills; a defensible midpoint-fill probability exists
Improvement is real (auction EQ 0.49; PIM $200–600M/month) but EQ ratios flatter wide quotes, midpoint trades are 6.0% of a subset, and no midpoint-fill probability was recovered (ABSENCE-OF-EVIDENCE).

### F-07. A single friction scalar covers SPX, SPY, single names, all periods
Contradicted by period/instrument/order-type/size heterogeneity (8.1¢/6.2¢ 2003–06 vs 9%/6.87% May 2021 vs 12.6% retail 2019–21; product fees differ).

### F-08. Exchange-member fees/rebates are directly usable as retail pass-through amounts
Member rebates/$0.00 customer base fees do not appear on retail bills; use broker-published pass-through schedules.

### F-09. Equity PFOF/wholesaler benefits transfer to options
Reversed in options (Ernst–Spatt): PFOF-paying option DMMs causally widen spreads.

### F-10. Mandatory fees are a single timeless scalar
TAF 0.002 → 0.00329; OCC 0.02 → 0.025 + holiday; ORF exchange- and time-varying; SEC fee rate changes semi-annually.

### F-11. "Commissions are negligible" for short-premium backtests
ProjectOption: commission-turnover modeling reverses approach rankings; four-leg structures multiply per-contract fees.

### F-12. "The indexes' VWAP pricing convention is achievable by a retail trader"
VWAP-of-prints over 30–120 minutes is not a guaranteed retail fill; the bid is. Supported only for WPUT/WPTR and CMBO (bid conventions). The 2004 BXM switch from bid → VWAP is a documented improvement in reported fills.

### F-13. "Index returns are net of the costs a retail trader would pay"
Zero commissions, fees, bid-ask on settlement, or taxes in every methodology. Direction: flattering, increasingly so for high-turnover variants.

### F-14. "Live post-launch performance confirms the backfilled history" (PUT; weakened for BXM)
PUT live-era Sharpe 0.52 vs S&P 0.61; full-sample 0.65 vs 0.49 carried by backfill. Regime-confounded but descriptive.

### F-15. "Put-write outperformance is alpha rather than risk-premium collection"
Israelov & Nielsen (2015): covered-call excess ≈ passive equity (67% of risk) + short-vol premium (Sharpe ~1.0 but <10% of risk) + **uncompensated equity-timing bet (~25% of risk, Sharpe ~0.1)**. PUT's return distribution: skew −2.09, kurtosis 12.58, down-beta 0.75 > up-beta 0.34 — crash-risk compensation that materialized (2008 −26.8%; Mar 2020).

### F-16. "Shorter tenor (weekly) improves the strategy"
WPUT Sharpe 0.40 < PUT 0.50 (2006–2018), despite 37.1%/yr gross premiums vs 22.1% — higher gross, lower net.

### F-17. "₹35 of every ₹100 came from retail pockets" (Jane Street)
Not in the order. Commentator invention.

### F-18. "Jane Street is the named winner on the other side of the ledger"
The order is counterparty-blind, interim, contested; JS's entire-period profit ≈ one-sixth of aggregate retail losses over a comparable window.

### F-19. "SEBI's loss rates transfer directly to US retail options"
STT wedge, product mix, population definition, expiry regime are load-bearing; SEBI cautions against direct comparability.

### F-20. "~$750/year academic open-close" as current universal price; academic pricing available to this program
2025 BZX-specific, dated; academic tiers contractually exclude an independent practitioner program.

### F-21. "Customer = retail" in origin-coded data
Cboe's own factsheet: customer = "Retail investors and institutional clients." The literature asserts opposite mappings (Cashman et al. vs Wang et al.) — no stable mapping exists.

### F-22. "Open-Close includes per-participant prices"
Series-level first/high/low/last only (EOD spec cols 10–13).

### F-23. "Rule 605 covers options execution quality"
FINRA RN 23-10: NMS stock excludes options.

### F-24. "Quoted spread = liquidity-provider capture"
Falsified: effective ≈ half quoted (Beckmeyer); timing discounts leak to timers (Muravyev–Pearson); wholesaler gross spread revenue is not profit net of adverse selection, hedging, fees, capital.

### F-25. "Correlation sellers bank the premium" (as a harvestable transfer)
Falsified by DMV's own friction result (dispersion fails after costs); Chen–Joslin–Ni contrary evidence cited in Terstegge. As a risk-compensation component it remains IDENTIFIED-TRACEABLE.

### F-26. Adverse selection dominates option expected returns
Falsified as dominant: Muravyev (2016) finds inventory larger. Survives as a real tax on the premium.

### F-27. "Commissions/fees modeled in the SJ Options, DTR, and ProjectOption short-put backtests"
SJ: MID fills, no costs; DTR: no cost or fill model stated; ProjectOption short-put: no commission amount modeled.

### F-28. "Downside-protection claims generalize across index windows"
PUTR live window MDD −32.9% vs RUT −32.2%; BXMD MDD −42.7% vs BXM −35.8%.

## 6. Claims whose wording must be narrowed

| # | Loose wording | Required wording |
|---|---|---|
| W-01 | "Canonical gross ≈ low-single-digit/yr" | "Some index studies report positive gross *per-trade* expectancy; transparent sequential-account results range from negative/flat to low-single-digit depending on structure, delta, loss rule, IV gate, denominator, and friction assumptions." |
| W-02 | "The 45/50/21 canon" | "A practitioner composite (45 DTE entry, 50% profit target, 21-DTE exit, later ≈30Δ guideline) assembled from separately tested components; no single primary study tests the full specification." |
| W-03 | "Index VRP is entirely correlation risk" | "Under DMV's model conditions (nonpriced individual variance risk, homogeneous correlation), the index VRP maps to the correlation wedge; newer literature frames variance risk as a co-contributor." |
| W-04 | "Diversified names diversify economic risk" | "Common-downside-factor concentration in stress (INFERENCE); the exact portfolio test has never been run." |
| W-05 | "SEBI: 91% of retail traders lose" | "91.0% of *individuals* (incl. HUFs/NRIs/sole props; top-15 brokers; India; STT-inclusive) incurred net losses FY25–FY26 — an upper bound for a US analogue, not a point estimate." |
| W-06 | "SteadyOptions found 4.44% CAGR / 0.52 Sharpe" | Retire until a primary methodology page is recovered. Currently secondary-compilation-only; archived URL inventory shows no matching article. |
| W-07 | "Commissions were 20.77% of profits" | "A traceable ratio string from an independent backtester whose commission model is unrecoverable; mechanically inflated by small-profit denominators; not '$0.21 per premium dollar'." |
| W-08 | "Backtest annualized return" | State whether the number is a sequential portfolio return or an arithmetic extrapolation (per-trade average × cycles). Reject the latter as an annualization. |
| W-09 | "Customer flow ≈ retail flow" | "Customer = regulatory residual (retail + institutional clients); small-lot (<100) is a published proxy convention, not a measurement." |
| W-10 | "Wholesalers capture the spread" | "Wholesalers gross the spread; effective ≈ half of quoted; net retention after adverse selection/hedging/fees/capital is unmeasured." |
| W-11 | "Jane Street took retail's premium" | "An interim, contested, counterparty-blind order alleging an expiry-day mechanism; JS's entire-period profit ≈ one-sixth of aggregate retail losses; the order attributes retail losses to JS only in hedged language ('may well account for some part of')." |
| W-12 | "PUT/BXM as Q1 benchmark" | "Closest comparators with six required adjustments: cost haircut, fill haircut (VWAP→bid), live-era comparison, management-rule mismatch disclosure, pre-tax status, single-name inapplicability." |
| W-13 | "Retail execution cost = X%" | "A matrix: instrument × order type × size × DTE × period. No scalar." |
| W-14 | "Who captures the premium" | "Gross position-formation share by origin (answerable) vs realized capture net of hedging/capital (not answerable with any located dataset)." |
| W-15 | "The canon was tested by tastylive" | "tastylive tested components (2015–2016); the full composite as one specification was never published by tastylive (targeted search; landscape redo concurs)." |
| W-16 | "Academic paper: options strategy earns X%" | "Paper-reported statistic under midpoint/no-cost/daily-hedging assumptions; not a market truth about executable performance." |

---

## 7. Primary-source ledger

Directly inspected in this upgrade (each entry: what was read, what it grounded). URLs as located 2026-09-27.

**Canonical replications (Track A):**
- SJ Options, "does tastytrade work" — sjoptions.com — MID-fill gross SPX strangle replication, margin-use dependence.
- DTR Trading, "45 DTE iron condor results summary" + "new iron condor series introduction" — dtr-trading.blogspot.com (2017/2016) — per-trade/max-risk-normalized iron condor results; no 21-DTE exit, no cost model.
- ProjectOption/Project Finance, "Iron Condor Management Results from 71,417 Trades" + "Short Put Management" (41,600 trades) — web.archive.org snapshots (2026-03/2026-04) — $1/contract commission model; arithmetic "45-day adjusted P/L."
- Secondary brief on spintwig — github.com/csnyder256/shadow-options-trading-lab — traceable 170,500-trade strings.
- SteadyOptions, "Iron Condors or Short Strangles?" (2020-05-31) — steadyoptions.com — ORATS 30Δ strangle vs condor; cost model undisclosed.
- Wayback CDX inventory of steadyoptions.com articles — 4.44%/0.52 figure unrecovered.

**VRP literature (Track B):**
- Bakshi & Kapadia (2003), *RFS* — full text — index delta-hedged losses.
- Bakshi & Kapadia (2003), *JoD* — full text — single-name aggregate significance + heterogeneity.
- Carr & Wu draft + final versions — level vs log metric distinction.
- Goyal & Saretto working draft — cross-sectional sort; cost sensitivity.
- Santa-Clara & Saretto working draft — margin-call effects.
- Dickerson et al. (2026) working paper — systematic variance-risk price vs total returns.

**Correlation/dispersion (Track C):**
- Driessen–Maenhout–Vilkov companion WP (July 2013) — full text — wedge, model conditions, regime instability.
- Buraschi–Kosowski–Trojani (2011 WP; RFS 2014) — full text — correlation exposure priced; 2008 losses.
- Deng (2008), "Volatility Dispersion Trading" — full text — regime break.
- Buraschi–Trojani–Vedolin (2009 WP; JF 2014) — substantial inspection — sign convention; DMV-after-costs citation.
- Bossu (2016), "A Primer on Correlation Trading" — full text — dealer positioning; executability wedge.
- Bossu (2005) conclusion extracted; Marshall (2009) abstract; Buss & Vilkov (2012) abstract.

**Transaction costs (Track D):**
- Muravyev & Pearson, "Option Trading Costs Are Lower Than You Think" — cicfconf.org PDF — timer evidence; retail prescription.
- Anand & Muravyev, "Do auctions impact quote competition?" (Feb 2025) — haslam.utk.edu PDF — OPRA May 2021; auction vs regular EQ.
- Ernst & Spatt, "Payment for Order Flow and Asset Choice" (Jul 2022) — foster.uw.edu PDF — options PFOF reversal.
- Cboe PutWrite Indices Methodology (current) — res-certification.cboe.com PDF — VWAP/bid/ask conventions.
- tastytrade commissions & fees page (updated Jul 30, 2026) — fee chain.
- OCC infomemo 55624 (clearing fee $0.025); SEC filing 34-104274-ex5a (Dec 2025 holiday).
- Cboe member fee schedules (SEC 34-106020-ex5, 34-105784-ex5) — member fees ≠ retail billing.

**Strategy indexes (Track E; local copies in notes/src/):**
- Cboe S&P 500 PutWrite Methodology v3.1 (rev. 2026-09-21); Cboe PutWrite Indices Methodology v2.0; Cboe BuyWrite Methodology v1.0; Conditional BuyWrite Methodology (rev. 2026-05-18); MSCI Covered Combo Methodology.
- SEC Release 34-57946 — BXM pricing-convention history.
- Bondarenko (2019), "Historical Performance of Put-Writing Strategies" — Cboe-commissioned; PUT & WPUT stats; explicit zero-cost disclaimer.
- Israelov & Nielsen (2015), "Covered Calls Uncovered," FAJ — three-way attribution.
- Cboe factsheets PUT/BXM/BXMD/BXMC/PUTR (2026-08-31).
- PUT dashboard snapshot (Wayback 2022-01-05); legacy PUT methodology PDF (archived 2022-01-27).

**Regulatory/enforcement (Track F):**
- SEBI PR 02/2023 (F&O study); PR 22/2024 (updated study); PR 39/2025 (comparative EDS); "Profitability of Individual Traders in EDS (FY25–FY26)" 91 pp. (Aug 2026); "Trading Behaviour of Individual Traders in EDS (FY25–FY26)" 53 pp. (Aug 2026) — all sebi.gov.in PDFs, read in full.
- SEC Staff Report on Equity and Options Market Structure Conditions in Early 2021 (Oct 14, 2021) — full text.
- FINRA Foundation NFCS "Investors in the United States," 4th ed. (Dec 2025) — full text.
- 17 CFR §5.5 / §5.18(i) via govinfo.gov / cftc.gov — CFTC retail-forex disclosure rule.
- SEBI interim order WTM/AN/MRD/MRD-SEC-3/31516/2025-26 (Jul 3, 2025), 105 pp. — full extraction read.
- CFTC v. Optiver materials via cftc.gov.

**Participant data (Track G):**
- Cboe Open-Close EOD spec v1.3 (20251110); 1-min spec v1.6; factsheet (©2026); product page; academic discount page; Historical Data Services Policies (v20240808).
- Cboe C1 Trade-by-Trade factsheet (©2026); product page; July-20-2026 fee schedule.
- Cboe OPRA-derived Option Trades spec; C1 Exchange Rule Book (2019) — pro-customer definition.
- SEC filing SR-CBOE-2023-055 — open-close product description.
- OCC Volume Query + ONN volume search — live CSV tests (IBM, SPX, 2026-09-25); record-layout PDFs; batch-processing change log.
- SEC Rule 606 FAQ; FINRA Regulatory Notice 23-10; SEC OIG CAT report.
- SEC file 34-94336 (NYSE open-close + multi-exchange competitor list); NYSE Arca options data fee schedule (Sep 2024); ISE filings (34-101096; ISE fee schedule); MIAX filings (34-105683-ex5).
- ORATS 1-min data dictionary; Trade Alert user manual.

**Premium incidence (Track H):**
- Terstegge (2025), "Intermediary Option Pricing" — full paper — dealer inventory compensation.
- CBOE Open-Close Federal Register filing (2022-10738) + spec PDF — origin-coded flow feasibility.

---

## 8. Canonical-strategy replication audit

Each row: what the study actually tested, with the exact specification it ran — not the label secondaries give it.

| Study | Structure / underlying / period | Entry / delta / exit | Cost model | Fill model | Denominator | Headline gross result | Access |
|---|---|---|---|---|---|---|---|
| SJ Options | SPX strangle, 2005–early 2016 | 45 DTE, 16Δ, IVR 50–100%, 50% winners, **2×-credit stop (not 21-DTE)** | none disclosed | **MID, "not likely"** | % margin use (15/25/35/50/70) | 15% use: **~0%/yr**; wider stop: **~3%/yr**; higher allocations negative; 70%: −93% stopped 2011 | VERIFIED |
| DTR Trading | SPX iron condor, 2007-01–2016-09, 96,624 trades, 432 runs | 45 DTE, 8/12/16/20Δ, 25/50/75 wings, 2-DTE/profit/loss exits; weekly options included | **none stated** | undisclosed | per-trade / max-risk | positive per-trade/max-risk-normalized; **no 21-DTE exit; no annual portfolio return** | VERIFIED design; ABSENCE costs |
| ProjectOption iron condor | SPX-class index, ~11 yr, 71,417 trades | 45 DTE, profit/loss/2-DTE exits | **$1/contract, no ticket → $8 RT/lot** | undisclosed | per-trade; "45-day adjusted P/L" = avg P/L × 45 / avg days (**arithmetic, not sequential**) | commission-turnover rankings reverse approaches | VERIFIED commission; ABSENCE fill |
| ProjectOption short put | SPY, 41,600 trades | managed | no amount modeled | undisclosed | per-trade; holding to expiry maximized avg gross P/L per trade | positive per-trade expectancy gross | VERIFIED; ABSENCE costs/fill |
| spintwig short put | SPY, 2007-01–2019-07, 170,500+ trades, 54 variants | 3:46 p.m. ET entries, 30Δ±3.5, 45±17 DTE, **50% profit or 21 DTE exit** (full composite) | "20.77% of profits" — **model unrecoverable** | undisclosed | per-trade | positive per-trade expectancy claimed | IDENTIFIED-TRACEABLE |
| SteadyOptions ORATS | SPY 30Δ strangle vs 20Δ-wing condor, since 2007 | strangle vs condor | **undisclosed**; author: long-option costs "so significant" | undisclosed | annual return | strangle **5.34%/yr** (Sharpe 0.64); condor **0.15%** (Sharpe 0.05) | VERIFIED numbers; ABSENCE model |
| SteadyOptions "4.44% CAGR / 0.52 Sharpe" (SPX 16Δ 2001–2020, 45/50/21) | untraceable | — | — | — | — | secondary-compilation-only | ABSENCE-OF-EVIDENCE (primary); retire |
| FlashAlpha (Sept 2026) | 50 strategies, 7,265 trades, SPY/QQQ/IWM, 2020–2025 | monthly strangle/condor variants | **bid/ask + $0.65/contract** | bid/ask | per-trade | strangle **−0.04%/trade, Sharpe −0.32**; condor **−0.11%, Sharpe −0.81** | family-level, not exact composite |

**Audit conclusion:** no row contains a complete sequential portfolio test of the exact composite (45 DTE + ≈30Δ + 50% profit + 21-DTE exit + index underlying + stated margin/denominator + disclosed retail commissions + realistic fills). The closest exact-composite test (spintwig) is the least inspectable. The most transparent test (SJ Options) is a near-family member with a stop-loss instead of the 21-DTE exit and MID fills. The only after-cost family-level study (FlashAlpha) is negative at the family level but is not the composite.

---

## 9. 45/50/21 composite provenance audit

| Date | Event | Status |
|---|---|---|
| 2015 | tastylive component studies: 50% profit target from 10%/30%/50% sweep; IVR concept in use (Nov 2015 ThinkScript) | VERIFIED components; secondaries normalized to IDENTIFIED-TRACEABLE |
| 2015–2016 | tastylive component lineage (per landscape redo, 97 primary items) | VERIFIED lineage |
| 2019-06-10 | spintwig short-put study: earliest located **full-composite** implementation (30Δ±3.5, 45±17 DTE, 50% or 21-DTE exit) — independent backtester | IDENTIFIED-TRACEABLE |
| 2020-07-27 | tastylive explicit "Enter at 45 DTE, Exit at 21 DTE" segment | VERIFIED (per Track A) |
| 2022 | Spina, *The Unlucky Investor's Guide to Options Trading* — book-length composite-as-doctrine | IDENTIFIED-TRACEABLE (two independent reviews) |
| 2024 | financialtechwiz criteria list (doctrine-explicit; roll-vs-close divergence noted) | VERIFIED (per Track A) |
| 2025-05-27 | Option Alpha "Tasty Condor" bot: 45+ DTE, 20Δ shorts, 50% target, close at 21 DTE, explicitly crediting tastytrade | IDENTIFIED-TRACEABLE (spec in search text) |

**Findings:** (a) the composite is real doctrine with a traceable component-by-component lineage; (b) it was **assembled from separately tested components, not derived from one verified study testing the full specification**; (c) the full-composite implementation predates tastylive's own explicit full-composite segment by ~13 months (spintwig, independent); (d) **≈30Δ appears to be a later guideline** — the earliest component studies did not hold it constant; (e) the 21-DTE exit has a documented loss-study rationale (21-DTE losers continue to lose) distinct from a profit-optimization rationale; (f) **no inspected study runs a clean pre/post-2020 regime-transfer test** of the composite.

**Consequence for Q1:** "the canonical trade" is not one thing in the primary record. A preregistration must freeze a specific composite (DTE, delta, profit target, exit, underlying, sizing, overlap, cadence) — and any frozen spec will be a stipulation, not a recovery of a tested canon.

## 10. Index VRP evidence

**VERIFIED core:** a negative variance risk premium in index options is established across multiple primary papers with directly inspected full texts or drafts:

- **Bakshi & Kapadia (2003, RFS; 1988–1995):** long delta-hedged S&P 500 options produced significant losses. Assumptions: daily hedging, midpoint pricing, no transaction costs, historical (1988–95) market structure. Establishes the *phenomenon*, not a harvestable strategy.
- **DMV companion WP (1996–2012):** implied-vs-realized correlation wedge (39.46% vs 32.59% S&P 500; 46.03% vs 35.53% DJ30); index VRP larger and more robust than the average constituent VRP. The "entirely correlation risk" attribution is **model-conditional** (nonpriced individual variance risk — partly rejected by the paper's own tests; homogeneous correlation structure).
- **Santa-Clara & Saretto (working draft, 1985–2002):** spreads and **margin calls** sharply reduced paper Sharpe and scale. Margin calls force liquidation when positions are losing — a survival mechanism absent from gross VRP estimates.
- **Coval & Shumway (~3%/week ATM zero-beta straddle loss):** abstract-level only (T-01). Treat as a cited magnitude, not a verified result.

**Boundary (paper → market):** the VRP is a statistical property of delta-hedged returns under the papers' assumptions. It is not a statement that a retail short-premium portfolio nets the premium. The steps from "long delta-hedged options lose on average" to "a specified retail short-premium program nets X%/yr" require: an execution model (fills), a cost model (commissions + spreads + fees), a margin/collateral specification, a management rule set, and a survival treatment — none of which the VRP papers supply.

**Regime instability (VERIFIED in DMV's own subsamples):** 2008–2012 — index VRP lost significance (realized variance extremely high); individual-stock average VRP point estimates turned negative for all horizons and both indices. The wedge is significant across 1996–2001, 2002–2007, 2008–2012 with varying size. Any claim calibrated on 1996–2007-style samples does not transfer without a crisis term.

---

## 11. Single-name VRP evidence

**The blanket "single-name VRP ≈ zero" claim is CONTRADICTED (F-02).** The evidence requires four distinctions: total vs systematic VRP; level vs log premium; conditional vs unconditional effects; factor price vs net implementable strategy return.

- **Bakshi & Kapadia (JoD 2003):** smaller but significant aggregate negative effect in 25 large stocks, with wide heterogeneity.
- **Carr & Wu:** draft/final-version distinction — level metric 3/35 vs 7/35 significant; **log metric 21/35 vs 23/35 significant**. The "zero" reading is metric- and vintage-dependent.
- **Goyal & Saretto (working draft):** cross-sectional RV/IV sorting — **21.9%/month at midpoint assumptions → 4.1% at full quoted spreads**; illiquid-name results negative/insignificant at full spreads. The single-name "premium" is substantially a transaction-cost artifact for the names where it looks largest.
- **Dickerson et al. (2026 working paper):** ≈ **−18% to −20%/yr systematic variance-risk price** across SPX, stocks, and ETFs — but **average total delta-hedged stock-option returns mostly insignificant**. The −18%/−20% figure depends on a time-varying VIX²-scaled specification, nonparametric deltas, delevered returns, midpoint pricing, and **no cost test**. Factor price ≠ implementable return.
- **Boyer & Vorkink (2014)** (T-08): single-name option returns patterned by ex-ante skewness — a different pricing mechanism (lottery demand) than index protection demand. Population boundary: index vs single-name mechanisms differ.

**Bottom line:** single-name VRP is not zero, but it is heterogeneous, specification-sensitive, and heavily cost-contingent. **No inspected paper tests a specified retail single-name short-premium portfolio net of realistic costs.**

---

## 12. Correlation-risk evidence

### Proposition 1 — correlation-risk mechanism behind the index VRP: substantially established as a model-conditional empirical regularity

- Large, persistent implied-minus-realized correlation wedge (V-02).
- Index/constituent VRP contrast across **three independent sources** (V-03).
- Correlation-risk exposure priced with crisis losses (V-04: BKT).
- Dispersion capture fragile to costs, margins, liquidity, regime (V-05: Deng; BTV-on-DMV; Bossu).
- **Limits:** the full-attribution claim is model-conditional (F-03); the crisis subsample breaks index VRP significance (§10); newer literature frames variance risk as a co-contributor ("both correlation and variance risks contribute" — 2018 factor-models paper, abstract-level); no post-2012 direct replication of DMV was found (ABSENCE-OF-EVIDENCE, not confirmation).
- Practitioner channel distinct from the risk-premium channel: Bossu (2016) — dealer desks short correlation to satisfy structured-product demand; implied correlation trades at a premium vs realized. DMV's risk-premium channel and Bossu's dealer-positioning channel both predict implied > realized, with different stability implications (open gap #5, §18).

### Proposition 2 — diversified single-name short-vol book concentrates in correlation spikes: not established; mechanism corrected

- **The "structurally long correlation" formulation is CONTRADICTED as stated** (F-04): sign convention matters. Long dispersion = short correlation. A short-single-name-vol book with no index leg is not a correlation position.
- **Corrected mechanism (INFERENCE, I-01):** common-downside-factor concentration during stress — components' losses become more positively dependent exactly when losses matter most (BKT: 35.83%→65.14% pairwise correlation in Sep 2008), concentrating simultaneous margin/capital demands.
- **No inspected study directly tests the target portfolio** (ABSENCE-OF-EVIDENCE): no diversified single-name short-option book, with executable fills, management rules, margin, and assignment, run through a correlation spike for either failure or survival. The evidence cuts one way because the test was never run, not because failure is proven — and no inspected source shows such a book *surviving* either.
- The mechanism is **distinct from DMV's index-VRP attribution** and cannot inherit its empirical weight.

---

## 13. Retail execution and transaction-cost evidence

### 13.1 No universal cost constant; preregistration must be a matrix

Quoted/effective spreads, broker commissions, and mandatory fees vary by instrument, period, order type, size, and broker. The preregistrable object is a **matrix: instrument (SPX / SPY / single name) × execution assumption × period**, possibly stratified by liquidity, DTE, size, time of day.

### 13.2 Verified and traceable cells

| Execution assumption | SPX evidence | SPY evidence | Single-name evidence |
|---|---|---|---|
| Diagnostic upper bound: midpoint, zero costs | SJ Options 2005–16: MID gross, "not likely" (VERIFIED) | — | — |
| Midpoint + dated fees | tastytrade Jul-2026: $2.30/contract RT fixed + sell-side TAF/SEC + ORF (VERIFIED) | $1.20 + regulatory RT at tastytrade; $1.30 RT at $0.65 schedules (VERIFIED/TRACEABLE) | IBKR tiered from $0.15; Robinhood $0 + pass-through (TRACEABLE) |
| Retail effective-spread execution | **EMPTY — no SPX-specific retail effective-spread study located** | SLIM effective 6.7% on quoted 13.7% (2019–21, TRACEABLE) | retail avg quoted 12.6% (2019–21, TRACEABLE); PFOF DMMs widen spreads (VERIFIED) |
| Marketable-order conservative bound | Cboe PUT conventions: sells at VWAP/last bid; PM-settlement expiries bought at last ask (VERIFIED) | PTLT last-NBBO-bid analog (VERIFIED) | — |
| Stress / illiquid / small-size | — | below-$250 trades: quoted 29.9%, effective 14.9% (TRACEABLE) | weekly-options premium in retail sample (TRACEABLE) |

**Empty cells are findings, not oversights.** The SPX-specific retail effective spread is the single most important unfilled cell for the 45/50/21 canon on SPX — and it is the exact evidence gap that makes Q1's preregistration unwritable.

### 13.3 Worked example (tastytrade, Jul 30 2026 — source-understanding calculation)
One SPX contract, sell-to-open then buy-to-close. Open: $1.00 + $0.10 clearing + $0.60 SPX proprietary + ORF + $0.00329 TAF + SEC fee on sale principal. Close: $0.00 + $0.10 + $0.60 + ORF. **Fixed known: $2.30/contract round trip** + sell-side-only fees. SPY equivalent: **$1.20 + regulatory**. A four-leg condor round trip: **$4.80–$5.20** at $0.60–$0.65 schedules.

### 13.4 Proposed friction ladder (Track D)
Midpoint diagnostic → midpoint + dated fees → stratified retail effective spread → quoted-side + fees → stress/illiquid case. Each rung must be dated and sourced; no rung may borrow another period's parameters silently (period transfer is untested — INFERENCE risk).

### 13.5 Key boundary failures for cost modeling
- TAF/SEC are **sell-side only** — do not model as symmetric round-trip fees (F-07's cousin; VERIFIED asymmetry).
- Member fees/rebates ≠ retail billing (F-08).
- Price improvement is real but is not a fill probability; **no defensible midpoint-fill probability was recovered** (F-06).
- Broker schedules change; tastytrade's page is dated Jul 30, 2026 — any preregistration must date its fee schedule.

## 14. Strategy-index evidence

### 14.1 What the indexes are
Published, rules-based, **zero-cost, pre-tax, backfilled** strategy benchmarks. PUT is the closest Q1 comparator (monthly ATM SPX put, full collateralization, European cash settlement — matches SPX, not single names); BXMD is the closest for a 30Δ call-overwrite. **No Cboe index implements the 45/50/21 management rules** — every index holds to expiry with no profit-taking, no 21-DTE exit, no delta-targeting except BXMD/BXRD (30Δ, monthly, held to expiry).

### 14.2 Key statistics (all from inspected methodologies, factsheets, Bondarenko 2019, Israelov–Nielsen 2015)

| Index | Window | Return | Vol | Sharpe | vs S&P 500 | Notable |
|---|---|---|---|---|---|---|
| PUT (full) | 1986–2018 | 9.54% | 9.95% | 0.65 | 9.80%/14.93%/0.49 | skew −2.09, kurtosis 12.58, MDD −32.7% |
| PUT (live-ish) | 2006–2018 | 5.97% | 10.69% | 0.50 | 7.59%/14.32%/0.51 | live since Jun 2007 |
| PUT (live era) | 2007–2026 | 7.1% | 10.7% | 0.52 | 11.0%/15.4%/0.61 | trails on return and Sharpe |
| PUT (implied backfill) | 1986–2006 | ~12.0% | — | — | ~11.3% | carried the headline edge (I-04) |
| BXM (full) | 1986–2026 | 8.6% | 10.7% | 0.56 | 11.2%/15.2%/0.57 | dead heat on Sharpe |
| BXMD | 1986–2026 | 10.7% | 12.9% | 0.61 | 11.2%/0.57 | MDD −42.7% |
| WPUT | 2006–2018 | 4.51% | 9.48% | 0.40 | PUT 0.50 | gross 37.1%/yr vs PUT 22.1% — higher gross, lower net |
| PUTR | 2018–2026 | 5.8% | 14.7% | 0.20 | RUT 8.3%/0.25 | MDD −32.9% vs RUT −32.2% |
| BXMC | 1990–2026 | 9.7% | 11.0% | 0.63 | 11.2%/0.57 | VIX-gated sizing; persistent bull-year lag |

Gross-vs-net scale (Cboe, 2007–2015): gross premiums averaged **22.1%/yr** (PUT), 37.1%/yr (WPUT); 2008: **41.9% gross → −26.8% net** (S&P −37.0%). The 2008 sign flip is the empirical shape of the strategy: negative skew, fat tails, down-beta 0.75 > up-beta 0.34.

### 14.3 History integrity issues (all VERIFIED from inspected documents)
- PUT's advertised base moved **Jun 30, 1986 → Jun 1, 1988** (the 1986–88 window contains the Oct 1987 crash); PUTY retains the 1986 base. Reason unresolved.
- PUTR: methodology (launched Nov 23, 2015 / base Jan 31, 2001) vs factsheet (launched **Mar 3, 2026** / first value Aug 13, 2018) — apparent restart, reason unknown.
- BXM launch: Mar 22, 2002 (methodology) vs Apr 11, 2002 (factsheet).
- BXM fill convention: last bid (pre-Jun 2004) → VWAP (Jun 18, 2004) → wider VWAP window (Nov 19, 2010).
- CMBO backfill: EFA/EEM ETF options (2006–Aug 2018) → index options (from Aug 17, 2018).
- Factsheet Sharpe/Sortino for BXM computed from July 1989 — unexplained start-date choice.

### 14.4 Benchmark-suitability for Q1 preregistration
PUT/BXMD are usable only with six adjustments: (1) **cost haircut** (commissions, fees, T-bill-vs-sweep gap — none in the index); (2) **fill haircut** (VWAP→bid; prefer PWT-style bid fills); (3) **live-era comparison** (report full-history and live-era side by side); (4) **management-rule mismatch disclosure** (index holds to expiry; Q1 exits at 50%/21-DTE — sign the mismatch per-regime); (5) **tax status** (pre-tax vs taxable account); (6) **single-name inapplicability** (no index models American exercise, dividends, borrow, or idiosyncratic gap risk). What the indexes legitimately contribute: gross premium scale (~18–22%/yr monthly ATM; ~37%/yr weekly), the empirical shape (skew, tails, betas), crisis signposts (2008, 2020, 2022), and the base rate that unadjusted index levels overstate executable retail returns.

---

## 15. Regulatory and enforcement-grade evidence

### 15.1 SEBI: the best retail-derivatives outcome data on earth — with hard access ceilings
Exact figures in V-08. What it can and cannot do for this program:
- **Can:** calibrate loss incidence (~91% FY25–FY26, India), the gross-vs-net wedge (5.6pp), the STT cost share (27%), the buyer/seller asymmetry (indicative), concentration (23%/90%), tenor (0DTE-dominated), and the regulatory-natural-experiment (Nov-2024 measures: participation −18%, intensity ↑, premium turnover recovered to ~96% of pre-policy average).
- **Cannot:** transfer to the US without the STT/product-mix/population haircuts (F-19; I-05); be re-analyzed (no public microdata — published PDFs with charts only); identify counterparties (no mapping of who trades with whom); decompose persistence into skill vs selection vs cost-drag (90–92% repeat-loss and 0.5%-always-profitable are cross-sectional conditionals on staying active; 43% annual exit churns the population).
- The seller-tail finding (I-12) needs a population-scale replication that only SEBI can run.

### 15.2 US: outcome-data desert (V-10)
SEC GameStop staff report: market-structure and PFOF mechanics; "market makers trade profitably with retail flow" — routinely over-read as a retail-loss finding; **no retail P&L data**. FINRA NFCS: participation only. OCC: plumbing. CFTC retail-forex: real outcome panel, wrong product. **The program cannot answer "net retail execution" questions from US regulatory sources at all.**

### 15.3 Enforcement: mechanisms, not incidence
- **Jane Street (V-09, F-17, F-18):** the order is strong evidence about mechanisms and sophistication asymmetries (minute-bar reconstructions; entity-grouping to defeat surveillance; options book an order of magnitude larger than the cash/futures "lever" — ₹43,289 cr vs ₹7,687 cr). It is **interim, ex parte, contested, counterparty-blind**, and an order of magnitude smaller than aggregate retail losses. It does not apportion the premium.
- **CFTC v. Optiver (2008/2012):** "banging the close" in NYMEX futures — mechanism-catalog precedent; futures, not options; no retail-outcome content.

### 15.4 Net assessment
The program design's "most underused ecosystem" instinct is **half-right**: regulatory data is the most underused *relative to its visibility*, but the binding constraint is **access, not attention** — the data that would answer the program's questions (PAN-level P&L, counterparty mapping) is not public in any jurisdiction surveyed. Genuinely underused at the margins: CFTC forex disclosures (methodological template), EU/UK/Australia CFD loss-rate panels, the Nov-2024 SEBI natural experiment, and the buyer-vs-seller asymmetry.

---

## 16. Participant/origin-data feasibility

### 16.1 What is answerable

| Question | Answerable? | With what |
|---|---|---|
| Customer / firm / market-maker volume shares | Yes — daily/intraday, per series, per exchange (open-close) or consolidated per symbol (OCC) | Cboe/ISE/MIAX/NYSE open-close; OCC Volume Query |
| Customer opening buys vs sells (contract volume) | Yes — per series, per exchange, per day/intraday | Open-Close EOD/1-min |
| Dollar premium by origin | **Approximate only** from Open-Close (imputation, I-08); **measured** from Cboe Trade-by-Trade (C1) | TBT: $12,000/mo commercial |
| Market-maker opening vs closing | **No** — Cboe EOD publishes MM buy/sell only | Spec cols 35–38 (VERIFIED negative) |
| Broker-level routing and PFOF for retail-sized options orders | Yes — quarterly, broker by broker | Rule 606 reports |
| Who captures the premium (realized P&L by participant) | **No** — requires linked entry/exit, strategy, account identity, costs, exercises/assignments; none available publicly or commercially | CONTRADICTED as a claim these data answer it |
| Aggressor side | **No** natively; inference only from TBT NBBO/BBO context (I-09) | — |
| Strategy linkage (spreads, rolls) | **No**, except TBT complex-trade execution IDs (field content uninspected) | IDENTIFIED-TRACEABLE |
| Exercise/assignment by participant | **No public series** — OCC annual aggregate only | ABSENCE-OF-EVIDENCE |

### 16.2 Boundary failures (do not cross)
1. Origin code → participant identity (capacity classes, not identities).
2. Customer → retail (CONTRADICTED by Cboe's own factsheet).
3. Small order → retail (convention, not measurement; the literature asserts opposite mappings).
4. Buy/sell volume → aggressor or economic risk transfer.
5. Opening sale → durable short-premium strategy (opens unlinked to closes; gross formation ≠ persistence).
6. Volume/OI → P&L or premium capture.
7. One exchange's product → consolidated market (Cboe four-exchange ≈ 35% of industry volume per Cashman et al.).
8. Academic price → program cost (contractually unavailable).
9. Series price columns → participant execution prices.
10. Double-counted exchange volume → cleared volume (Cboe counts both sides; OCC counts once).

### 16.3 Commercial reality for an independent program
C1 Open-Close EOD $600/mo (history from 2005-01-03); C1 1-min $4,000/mo; Cboe Trade-by-Trade $12,000/mo; full six-exchange coverage requires buying 6+ products with definitional differences. Raw data internal-use-only; derived-data redistribution $5,000–$7,500/mo extra. **Premium-incidence research must be reframed from realized capture to gross position-formation** unless account-linked data become available.

---

## 17. Premium-incidence feasibility

**Verdict: PARTIALLY MAPPABLE** — not answerable as a complete accounting; substantially mappable at the mechanism level.

### 17.1 Mechanism map (11 proposed → 7 groups; no double-counting)

| Group | Members | Status |
|---|---|---|
| A. Demand → inventory → overnight | investor risk transfer → dealer compensation → overnight risk | One chain, three descriptions. Core VERIFIED (Terstegge); buyer-side IDENTIFIED-TRACEABLE (GPP); incidence step INFERENCE |
| B. Spread ↔ cost | spreads as capture ↔ transaction costs as sink | Same money, two sides. Core IDENTIFIED-TRACEABLE (Bryzgalova, Beckmeyer); "spreads = retained profit" CONTRADICTED (F-24) |
| C. Index-premium components | jump risk + correlation risk | **Rival decompositions of one measured number** (Pan's 3.5% vs DMV attribution). Not additive. IDENTIFIED-TRACEABLE; harvestability CONTRADICTED (F-25) |
| D. Hedging ↔ inventory compensation | hedging costs/flows ↔ inventory compensation | Micro-driver and residual compensation — counting both double-counts. Separable share ABSENCE-OF-EVIDENCE |
| E. Demand source | behavioral demand ↔ investor risk transfer | Source ≠ recipient. Core IDENTIFIED-TRACEABLE (Boyer–Vorkink); incidence INFERENCE |
| F. Tax wedge | taxes/institutional constraints | Price-level wedge (Mason–Utke IDENTIFIED-TRACEABLE); no identified recipient — ABSENCE-OF-EVIDENCE |
| G. Information tax | adverse selection | Real but not dominant (F-26); recipient identity ABSENCE-OF-EVIDENCE; no options-market PIN by origin found |

### 17.2 Population boundaries (all fail to generalize without separate evidence)
- **Index → single-name:** index incidence is a dealer-inventory story (dealers net short; overnight/jump/correlation components); single-name is a mixed lottery/information/inventory story. No incidence conclusion may cross without separate evidence.
- **Retail → recipient:** retail is a net payer (wide spreads, ~60% of 0DTE losses = costs in a narrow population). **Retail premium *sellers* are not separately identified in any inspected source** — the "retail captures premium" case is ABSENCE-OF-EVIDENCE.
- **US → other jurisdictions:** near-total US concentration; zero non-US primary incidence evidence inspected (SEBI India primaries now inspected for outcomes — §15 — but not for incidence decomposition).

### 17.3 The missing join
No dataset combines origin × beneficial owner × motive × execution × hedge costs × capital charges × realized P&L. The closest obtainable input (CBOE Open-Close) gets the origin-coded flow half; the P&L-net-of-costs half has no public source. The binding constraint is a **data join**, not a theory gap.

## 18. Boundary-failure audit

Cross-cutting boundaries found in two or more tracks. Each is a named failure of transfer; preregistration and future research must carry them as explicit assumptions or corrections.

| # | Boundary | Fails because | Found in |
|---|---|---|---|
| B-01 | Paper-reported statistic → market truth | Midpoint pricing, no costs, daily hedging, and model assumptions are baked into academic numbers; they are not observations of executable performance | A, B, C, D, E, H |
| B-02 | Per-trade expectancy → annual portfolio return | Arithmetic extrapolation (avg P/L × cycles) ≠ sequential redeployment with margin, overlap, and survival | A |
| B-03 | Gross return → net return | Commissions, spreads, fees, and taxes are load-bearing (SEBI: 5.6pp of incidence; ProjectOption: ranking reversals; 2008 PUT: 41.9% gross → −26.8% net) | A, D, E, F |
| B-04 | Model-implied → executable | Vanilla dispersion P&L "only very loosely connected to correlation" (Bossu); DMV trade dies after costs/margins (BTV); var-swap liquidity gone post-2008 | C |
| B-05 | Index result → single-name portfolio | DMV attribution concerns the *index* VRP; a single-name book lacks the index leg; incidence mechanisms differ (inventory vs lottery/information) | B, C, H |
| B-06 | Normal → crisis | Correlation spikes (35.83%→65.14%); index VRP loses significance 2008–2012; margin calls force liquidation when losing | B, C |
| B-07 | Backfilled → live | PUT's Sharpe edge carried by backfill; live-era edge gone; methodology changes (BXM 2004 bid→VWAP) flatter history | E |
| B-08 | Quote → fill | VWAP/mid/SOQ are not retail fills; VWAP ≥ bid; SOQ untradeable; no midpoint-fill probability recovered | D, E |
| B-09 | India → US | STT wedge (27% of TC), product mix (~pure short-dated index-options buying), population definition (HNIs/HUFs/NRIs), expiry regime | F |
| B-10 | Customer → retail | Regulatory residual incl. institutions; activity-based pro boundary; literature asserts opposite mappings | G |
| B-11 | Volume → P&L | No linkage of opens to closes, no costs, no exercises/assignments by participant | G, H |
| B-12 | Quoted spread → retained profit | Effective ≈ half quoted; timing discounts leak; net of adverse selection/hedging/capital unmeasured | D, H |
| B-13 | Allegation → adjudication | Jane Street order is interim, ex parte, contested, counterparty-blind | F |
| B-14 | Aggregate → individual | 23% of traders ≈ 90% of losses; population averages mislead about the median trader | F |
| B-15 | Period → period | 2003–06 vs 2019–21 vs 2021 spread parameters not interchangeable; fee schedules time-varying | D |
| B-16 | Family → exact composite | FlashAlpha's negative family-level after-cost result does not test 45/50/21; nearby replications (stop-loss vs 21-DTE; 16Δ vs 30Δ) are not the composite | A |
| B-17 | Settlement price → fillable price | SOQ is untradeable; settlement frictionless; American-exercise/dividend risk absent from all index constructions | E |

---

## 19. Strongest falsifiers found

Ranked by how much they changed the program's foundation:

1. **The pooled low-single-digit gross baseline (F-01).** The upgrade's most load-bearing falsification: the "consensus range" was an artifact of pooling incompatible studies and arithmetic extrapolations. It was the premise Q1's preregistration would have been built on.
2. **The reverse-boundary mis-signing (F-04).** The program's own "structurally long correlation" claim was wrong on sign; the corrected mechanism (I-01) is weaker (INFERENCE, untested). This is the upgrade's clearest self-correction.
3. **"Live = backfilled" for PUT (F-14).** The headline full-sample Sharpe (0.65) is carried by the backfilled segment; live-era Sharpe (0.52) trails the S&P 500 (0.61). Regime-confounded but descriptive — and the correct falsification test for the index-benchmark premise.
4. **"Jane Street is the named winner on the other side" (F-18).** The order's own text (hedged attribution, counterparty-blind) and arithmetic (one-sixth of aggregate scale) falsify the framing.
5. **"₹35 of every ₹100 from retail" (F-17).** Not in the order. Commentator invention — a clean provenance falsification.
6. **"Customer = retail" (F-21).** Cboe's own factsheet contradicts it; the literature asserts opposite mappings.
7. **"~$750/year academic open-close" (F-20).** Stale, exchange-specific, and contractually inapplicable — a costing-premise falsification.
8. **"Quoted spread = liquidity-provider capture" (F-24).** Effective ≈ half quoted; wholesaler net retention unmeasured.
9. **"Correlation sellers bank the premium" (F-25).** Falsified as harvestable by DMV's own friction result.
10. **"Commissions are negligible" (F-11).** ProjectOption's commission-turnover modeling reverses approach rankings.
11. **"Retail pays the Muravyev timer rate" (F-05).** The authors explicitly say otherwise.
12. **"SteadyOptions 4.44%/0.52 is a primary finding" (W-06).** Unrecoverable at the primary level; retired.
13. **"The 20.77% commission ratio speaks for itself" (W-07).** Model unrecoverable; ratio mechanically inflated by small-profit denominators.
14. **"All costs modeled in the indexes" (F-13).** Explicit zero-cost/zero-tax construction in every methodology.
15. **"Weekly tenor improves risk-adjusted returns" (F-16).** WPUT Sharpe 0.40 < PUT 0.50 (2006–2018).
16. **"SEBI figures transfer to the US" (F-19).** STT/product-mix/population haircuts are load-bearing; India's numbers are an upper bound.

---

## 20. What changed relative to the existing research-program design

The 2026-09-26 program design and the landscape redo were hypothesis registers. This upgrade reverses or materially revises them as follows:

1. **Gross baseline (design: "~0–5%/yr on indices, no disclosed-friction net test exists").** The "~0–5%" pooling is CONTRADICTED as stated (F-01). The design's headline is narrowed to W-01. The "no net test" half survives — but FlashAlpha's after-cost family-level study (Sept 2026, post-design) now partially covers the gross family arm, which the design did not anticipate.
2. **Reverse boundary failure (design: "single-name short-premium book structurally long correlation per DMV").** Mis-signed; corrected to common-downside-factor concentration (F-04, I-01). This is the upgrade's most explicit reversal of the design's own vocabulary.
3. **Regulatory ecosystem (design: "most underused goldmine").** Downgraded to "best available calibration source with hard access ceilings" (§15.4). The design's Wave 0/1 instinct was half-right: binding constraint is access, not attention.
4. **Wave 0 feasibility premise (design: feasibility → net baselines).** Strengthened and made specific: the feasibility gate is now a named, answerable study (the friction matrix, §23), not a general "check data availability" step.
5. **The 20.77% commission figure (landscape redo).** Retained from the redo: belongs to an independent backtester with an undisclosed cost model, not any practitioner corpus. Reclassified from "practitioner evidence" to T-02 / W-07.
6. **45-DTE/50%/21-DTE canon (landscape redo: "traced to a single source, never published as one spec").** Confirmed and extended: earliest full-composite implementation is spintwig (2019, independent), predating tastylive's explicit full-composite segment (2020-07-27); ≈30Δ is a later guideline (§9).
7. **Index-vs-single-name VRP boundary (landscape redo: "triple-confirmed").** Confirmed, with the blanket "single-name ≈ zero" reading contradicted (F-02) and the boundary made mechanism-specific (§17.2).
8. **"Surface agreement masking operational divergence" (landscape redo's promoted lens).** Extended to the replication audit: studies that share the "short premium" label diverge on structure, delta, loss rule, denominator, and friction treatment — the same lens, applied to backtests (§8).
9. **Academic pricing (design-era assumption: ~$750/yr).** Falsified (F-20); commercial rates apply.
10. **Q1's position in the program.** The design made Q1 the highest-value next question. This upgrade demotes it to second: Q1's preregistration has unexamined premises (unnamed strategy spec, unmeasured friction, unadjusted benchmark) that a prerequisite study can resolve. Q1 is deferred, not abandoned (§21–§23).

## 21. Whether Q1 remains the highest-information-value next experiment

**No — not as the immediate next experiment.** Q1 ("What does the canonical short-premium trade net at actual retail execution?") remains the program's central question, but it is not the highest-information-value *next* experiment, for four converging reasons:

1. **The gross arm is partially answered.** FlashAlpha's after-cost family-level study (50 strategies, 7,265 trades, bid/ask + $0.65/contract: strangle −0.04%/trade Sharpe −0.32; condor −0.11% Sharpe −0.81) is not the exact composite (B-16), but it means Q1's gross component no longer has the novelty the design assumed. What remains unanswered is specifically the *retail-execution* component — which is a different, separately answerable study.
2. **The strategy has no canonical specification in the primary record.** The provenance audit (§9) shows the composite was assembled from separately tested components; ≈30Δ is a later guideline; the full composite's earliest implementation is an independent backtester. Any preregistration must *stipulate* a spec — and a stipulated spec tested against one friction model is a weaker experiment than the question's framing implies.
3. **The binding input is unmeasured.** The SPX retail effective-spread cell is empty (§13.2). Without it, any Q1 preregistration must assume a cost scalar — and the upgrade proved no universal scalar exists (F-07). A preregistration built on an assumed scalar is exactly the "unexamined premise" the assignment forbids.
4. **The benchmark is unadjusted.** No Cboe index implements 45/50/21; PUT requires six adjustments (§14.4), including a live-era restriction the headline statistics violate.

Q1 is therefore **deferred behind its prerequisite**, not demoted in importance. The prerequisite is itself a primary-evidence-generating study that can be completed without running a backtest — it fits the assignment's hard-stop boundary and the program's Wave-0 logic.

---

## 22. If Q1 remains next, what must be frozen in its preregistration

Q1 does not remain next *immediately* (§21), so this section records the **preregistration blockers** — the premises that must be resolved (by the §23 study and the spec work in §9) before Q1 becomes writable:

1. **Exact composite spec, stipulated and frozen:** DTE, delta (and delta definition), profit target, exit rule (21-DTE vs stop-loss — these are different strategies), underlying (SPX vs SPY vs single names), entry cadence, overlap, position sizing and margin denominator, IV gate (yes/no, threshold).
2. **Execution assumption, sourced per leg:** fill model (bid/ask/mid/limit — with the midpoint-fill probability marked ABSENCE-OF-EVIDENCE if assumed), dated commission schedule, mandatory-fee chain dated and modeled by side (TAF/SEC sell-side only), spread assumption from the friction matrix (§23), not a scalar.
3. **Sequential portfolio accounting:** defined starting capital, margin treatment, reinvestment/overlap rules, survival treatment (what happens at margin call — cf. Santa-Clara & Saretto), assignment/exercise handling for American-style underlyings.
4. **Benchmark, adjusted:** PUT or BXMD with the six adjustments (§14.4); live-era comparison primary; full-history comparison secondary; pre-tax status disclosed; management-rule mismatch signed per-regime.
5. **Regime coverage:** the sample must include a correlation-spike episode (2008, 2018, 2020); results calibrated on 1996–2007-style samples do not transfer (B-06).
6. **Boundary declarations:** all 17 boundaries in §18 carried as explicit assumptions; every VERIFIED claim tagged as source-reported vs market-true.

Until blockers 1–2 are resolved, writing Q1's preregistration would bake in the unexamined premises this upgrade was commissioned to remove.

---

## 23. If Q1 does not remain next, what should replace it and why

**Replacement question (Q0):** *"What is the executable retail friction for short-premium execution, specified as an instrument × order type × size × DTE × period matrix — and in particular, what is the SPX retail effective spread?"*

**Why it is better as the next experiment:**
- It is the **binding input** to Q1's preregistration (blocker #2, §22). Q1 cannot be specified without it.
- It is **answerable from primary sources without running a backtest** — inside the assignment's hard-stop boundary: execution literature (Anand–Muravyev VERIFIED; Bryzgalova full text; Barardehi et al.), Rule 606 routing reports, dated broker and mandatory fee schedules, the Cboe PutWrite methodology conventions as a conservative benchmark, and a defined fill-model ladder (§13.4).
- It **resolves the single most important empty cell** in the evidence base (§13.2): the SPX retail effective spread.
- It **tests whether FlashAlpha's cost assumption generalizes**: is bid/ask + $0.65/contract the right retail friction, or does the matrix show it is too kind or too harsh by instrument and period?
- It is **finite and falsifiable**: each matrix cell carries a source, a date, and a label; empty cells are findings.

**Deliverable:** the friction matrix with VERIFIED/TRACEABLE cells, dated values, and explicitly marked empty cells — plus a written fill-model policy (when midpoint is assumed, when bid-side, when VWAP) that any future Q1 preregistration can cite instead of assuming. On completion, Q1's preregistration blockers #2 (and, with the §9 spec work, #1) clear, and Q1 becomes the highest-information-value experiment again.

**What Q0 is not:** it is not a backtest, not a strategy recommendation, and not a substitute for Q1 — it is the calibration study Q1's preregistration depends on.

---

## 24. Remaining primary-evidence gaps

Ranked by load-bearing importance for the program:

1. **SPX retail effective spread by order type/size/time** — the empty row-3 SPX cell. No located study isolates it. (Q0's central target.)
2. **Midpoint limit-order fill probability, waiting time, cancellation/adverse selection** for options — no primary evidence recovered.
3. **Bryzgalova et al. full text** — Table I/Table A18 numbers are extract-level; read before preregistration use.
4. **Barardehi et al. ("Unpacking Retail Trading Costs")** — located, not inspected.
5. **Exact 45/50/21 spec recovery** — tastylive's component studies (2015–2016) at the primary level; the ≈30Δ guideline's first appearance.
6. **SteadyOptions 4.44%/0.52 primary** — unrecovered; retire until found.
7. **spintwig commission model** — dollars/contract, sides, fees, denominator unrecoverable from identified sources.
8. **Diversified single-name short-premium book through a correlation spike** — the exact portfolio test (I-01) has never been run; neither failure nor survival is established.
9. **Post-2012 DMV replication** — wedge and attribution stability including the 2020 episode.
10. **DMV risk-premium vs Bossu dealer-positioning channels** — disentangling two mechanisms that both predict implied > realized.
11. **Participant-level realized P&L net of hedging/capital** — the missing join at the center of the incidence question; no public source.
12. **Market-maker/wholesaler spread revenue net of costs** — none found (Goyenko et al. 2014 not inspected).
13. **Options-market PIN/adverse-selection measure by origin** — none found (Kaul et al. 2004 not inspected).
14. **Autocallable/structured-product dealer hedging flows, quantified** — practitioner sources only.
15. **Dispersion-trader participant identities** — the trade is identified, the traders are not.
16. **Who warehouses jump risk after dealers hedge** — no position-level evidence.
17. **Non-US premium-incidence evidence** — SEBI outcomes now inspected; incidence decomposition absent.
18. **Aggregate VRP decomposition into retained vs dissipated shares** — no inspected source attempts the full accounting.
19. **OCC 2026 current fee schedule** — confirm or mark time-varying.
20. **Rule 606 / execution-quality studies (Hendershott-style) for options** — not inspected; needed to separate routing/PFOF from execution quality.

---

## 25. Recommended next research action

**Execute Q0 (§23) as the next research action**, scoped as follows:

1. **Read in full:** Bryzgalova–Pavlova–Sikorskaya (2023); Barardehi et al.; any located SPX-specific execution study (search: "SPX effective spread retail," "index option execution costs," "0DTE effective spread").
2. **Pull:** Rule 606 reports for the major retail options brokers (routing shares, PFOF, order-type mix); current dated fee schedules for tastytrade (done), Schwab, Fidelity, IBKR (direct reads to upgrade T-11).
3. **Build:** the friction matrix (§13.2) with every cell sourced, dated, and labeled; mark empty cells as findings.
4. **Write:** a fill-model policy (midpoint diagnostic → dated fees → effective spread → quoted-side → stress) with explicit statements of what is assumed vs measured at each rung.
5. **Revisit:** Q1's preregistration readiness against the §22 blockers. If blockers #1–#2 clear, Q1 becomes writable and resumes as the highest-information-value experiment.

**Do not** run Q1's backtest before Q0 completes — the friction assumption it would require is exactly what Q0 exists to measure.

---

## 26. Full source/evidence ledger

Consolidated from all eight tracks. Label = status of the claim as used in this report.

### VERIFIED (primary material directly inspected)

| # | Source | One-line finding |
|---|---|---|
| V-01 | Bakshi & Kapadia (2003, RFS) | Long delta-hedged S&P 500 options: significant losses, 1988–1995 |
| V-02 | Driessen–Maenhout–Vilkov companion WP (Jul 2013) | Implied vs realized correlation wedge; model-conditional attribution |
| V-03 | DMV; BKT (2011 WP); BTV (2009 WP) | Index VRP > constituent avg ≈ 0 — three independent arrivals |
| V-04 | Buraschi–Kosowski–Trojani (2011 WP) | Correlation exposure priced; Sep–Nov 2008 losses −24.4/−12.4/−7.5% |
| V-05 | Deng (2008); BTV-on-DMV; Bossu (2016) | Dispersion fragile to costs/margins/liquidity/regime |
| V-06 | BTV; Bossu (2016) | Long dispersion ≡ short correlation (sign convention) |
| V-07 | Terstegge (2025) | Dealers net short deep-OTM SPX puts; overnight = unhedgeable-inventory compensation |
| V-08a | SEBI PR 02/2023 | 9/10 net losses FY19 & FY22; +28% TC drag; 98% traded options |
| V-08b | SEBI PR 22/2024 | 93% FY22–FY24; ~₹2L avg; prop +₹33k cr / FPI +₹28k cr gross |
| V-08c | SEBI PR 39/2025 | ~91% FY25 → revised 90.9% / ₹1.12L cr |
| V-08d | SEBI Profitability study (Aug 2026, 91 pp.) | Full methodology; net=gross−TC; STT 27%; 91.0% FY25–FY26; ₹2.03L cr |
| V-08e | SEBI Behaviour study (Aug 2026, 53 pp.) | 97% options buyers; sellers 44% incidence / ₹51.7L avg loss (n≈5,050, indicative) |
| V-09 | SEBI Jane Street interim order (Jul 3, 2025, 105 pp.) | Mechanism alleged; ₹36,502 cr / ₹4,843.57 cr impounded; interim, contested, counterparty-blind |
| V-10 | SEC GameStop staff report (Oct 2021); FINRA NFCS (Dec 2025); 17 CFR §5.5 | US outcome-data desert; market makers profitable with retail flow (no retail P&L); CFTC forex panel (wrong product) |
| V-11 | tastytrade fees (Jul 30, 2026); OCC infomemo 55624; SEC 34-104274-ex5a | $1 open/$0 close; SPX $0.60; TAF $0.00329 (sales only); SEC $20.60/$1M; OCC $0.025 + Dec-2025 holiday |
| V-12a | Muravyev & Pearson | Timer rates not for retail; conventional effective spread prescribed |
| V-12b | Anand & Muravyev (Feb 2025) | Quoted ≈9%, effective 6.87%; auction EQ 0.49 vs regular 0.90 |
| V-12c | Ernst & Spatt (Jul 2022) | PFOF DMMs widen option spreads; options PFOF reversal vs equities |
| V-13a | Cboe PUT methodology v3.1 (rev. 2026-09-21) | VWAP 11:30–12:00; SOQ settlement; T-bill collateral; zero costs; base Jun 1, 1988 / launched Jun 20, 2007 |
| V-13b | SEC Release 34-57946 | BXM: last bid → VWAP (Jun 18, 2004); window extended 2010 |
| V-13c | Cboe PutWrite methodology v2.0 vs PUTR factsheet | Launch/base conflict: Nov 23, 2015 / Jan 31, 2001 vs Mar 3, 2026 / Aug 13, 2018 |
| V-14a | ProjectOption iron-condor study (archived) | $1/contract, no ticket → $8 RT/lot; fill model undisclosed |
| V-14b | SJ Options "does tastytrade work" | MID fills "not likely"; ~0%/yr at 15% margin use; ~3%/yr modified wider stop; negative at higher allocations |
| V-14c | SteadyOptions "Iron Condors or Short Strangles?" (May 2020) | 30Δ SPY strangle 5.34%/yr vs condor 0.15%; cost model undisclosed |
| V-14d | DTR Trading iron-condor pages (2016/2017) | 96,624 trades, per-trade/max-risk results; no cost or fill model stated |
| V-15 | Bakshi & Kapadia (JoD 2003); Carr & Wu; Goyal & Saretto draft; Dickerson et al. (2026); Santa-Clara & Saretto draft | Single-name VRP: significant, heterogeneous, cost-fragile; margin calls force liquidation |
| V-16 | Cboe Open-Close specs/factsheet/policies; OCC endpoints; FINRA RN 23-10; SEC OIG CAT report; exchange fee schedules | 86-column spec; MM buy/sell only; series-level prices; customer≠retail; academic pricing inapplicable; OCC C/F/M aggregates; Rule 605 excludes options; CAT nonpublic |
| V-17 | Track A provenance audit | Composite real doctrine; components tested separately; no single full-composite tastylive study; spintwig 2019-06-10 earliest full implementation; tastylive full-composite segment 2020-07-27; ≈30Δ later guideline |
| V-18 | Jane Street order (105 pp.) | "₹35 of every ₹100 from retail" not present; no named counterparty |

### IDENTIFIED-TRACEABLE (located; inspection insufficient)

T-01 Coval & Shumway (≈3%/week straddle loss — abstract only) · T-02 spintwig 170,500 trades / 20.77% (model unrecoverable) · T-03 Bryzgalova et al. retail spreads (extracts) · T-04 Barardehi et al. (uninspected) · T-05 Beckmeyer et al. 0DTE retail costs (extracts) · T-06 Muravyev & Ni overnight returns (WP) · T-07 GPP demand-based pricing (WP text; tables uninspected) · T-08 mechanism literature (Muravyev 2016; Pan & Poteshman 2006; Easley et al. 1998; Pan 2002; Santa-Clara & Yan 2010; Boyer & Vorkink 2014; Mason & Utke 2022; Henderson & Pearson 2011; Bollen & Whaley 2004; Ni et al. 2005; Pearson et al. 2008; Marshall 2009; Buss & Vilkov 2012; Kaul et al. 2004; Goyenko et al. 2014 — abstracts/metadata or uninspected) · T-09 Whaley (2002); Feldman & Roy (2005) (secondary descriptions) · T-10 EnnisKnupp PUT paper; Cboe gross-vs-net whitepaper table (off-domain) · T-11 Schwab/Fidelity/IBKR/Robinhood schedules (extracts) · T-12 OCC exercise series (annual aggregates only) · T-13 Cboe Trade-by-Trade exact spec (product page only) · T-14 45/50/21 provenance secondaries (2015 deck; IVR ThinkScript; Spina 2022; Option Alpha 2025 bot; spintwig variants) · T-15 FlashAlpha family-level after-cost study, Sept 2026 (not the exact composite) · T-16 PUT 2007–2015 gross-vs-net table (Cboe-produced, off-domain) · T-17 ISE/MIAX/NYSE/Nasdaq product details (partially inspected) · T-18 CFTC retail-forex panel (rule verified; panel unanalyzed) · T-19 EU/UK/Australia CFD loss-rate regimes (via SEBI citation)

### INFERENCE · ABSENCE-OF-EVIDENCE · CONTRADICTED

I-01 through I-13 (§4) · Gaps G-01 through G-20 (§24; absences recorded with searches performed) · F-01 through F-28 (§5) · Boundaries B-01 through B-17 (§18)

---

*End of integrated report. Written 2026-09-27 from eight completed evidence tracks. Stop boundary honored throughout: no backtest, no parameter optimization, no trade recommendations, no software design.*

```
Q1 STATUS: REDIRECT — BETTER QUESTION IDENTIFIED
```