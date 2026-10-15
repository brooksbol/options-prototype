# Options Backtesting Platforms — Capability and Cost Comparison

**As-of date:** 2026-10-14
**Research mode:** Independent product and technical research. No subscriptions purchased, no accounts created, no trades executed, no production software written. No trading strategy is recommended anywhere in this report. This research is research, not policy — nothing here constitutes trading authority.
**Deliverable path:** `~/workspace/your_files/options-backtesting-platforms-20261014.md`
**Working dossiers:** `~/workspace/research_notes/options-backtesting-platforms-20261014/notes/` (per-platform evidence files)

## Evidence labels

Every material claim carries one of four labels, per the commission's governing contract:

- **VERIFIED** — confirmed directly from primary documentation (vendor docs, pricing pages, API specs) read during this research.
- **CLAIMED** — vendor or secondary-source assertion whose behavior was not independently demonstrated.
- **INFERRED** — reasonable interpretation of verified/claimed inputs.
- **UNKNOWN** — insufficient evidence. Reported as UNKNOWN rather than assumed.

No capabilities or prices were invented. Where pricing or features are gated behind signup, they are marked UNKNOWN.

**Method:** eight parallel research agents investigated Option Omega, ORATS, OptionNet Explorer, Option Alpha, QuantConnect/LEAN, Backtrader (+options extensions), a discovered-alternatives cluster, and build-path data vendors, each working from official vendor documentation, pricing pages, API specifications, and primary technical docs via public web search and page text extraction, all on 2026-10-14.

---

## 1. Executive Summary

**The final question — answered first:** For an individual quantitative researcher doing empirical expected-value estimation of multi-leg options strategies, the best existing combination of realistic multi-leg backtesting, customizable management rules, exportable historical evidence, prospective paper trading, and cost efficiency is **QuantConnect / LEAN** — the only platform reviewed whose fill model crosses the spread at historical bid/ask (rather than assuming midpoint), whose per-trade orders are programmatically exportable, whose 4,000-symbol options universe covers the diversified-portfolio question, and whose research tier costs $0. It is not a no-code tool and it has real gaps (no native walk-forward, management policies are user code, default zero slippage), but it is the only candidate that survives all four decisive EV-research criteria without a disqualifying assumption.

**The decisive criteria** (from the commission: "a platform that produces only aggregate backtest performance is insufficient for serious empirical research") and how the field scores:

| Criterion | Option Omega | ORATS | OptionNet Explorer | Option Alpha | QuantConnect/LEAN | Backtrader |
|---|---|---|---|---|---|---|
| (a) Per-trade outcome export | ✅ CSV, VERIFIED | ✅ Trade log + per-leg, VERIFIED | ⚠️ Windows copy/paste only, VERIFIED | ✅ CSV (schema undocumented), VERIFIED | ✅ Orders API + custom stats, VERIFIED | ❌ Custom code |
| (b) Entry-time feature export | ⚠️ Thin: no per-leg IV/delta/Greeks, INFERRED absent | ❓ UNKNOWN for custom backtests | ❌ No structured export | ❓ UNKNOWN | ✅ Via QuantBook user code, VERIFIED feasible | ❌ Custom code |
| (c) OOS / walk-forward | ❌ Absent (heuristics only) | ❌ Permutation tests only, no WF | ❌ None | ❌ None (manual workaround) | ❌ No native WF (manual IS/OOS) | ❌ Custom harness |
| (d) Honest fill modeling | ❌ **Midpoint default**, VERIFIED | ✅ Quote-derived + take penalty, VERIFIED | ❌ Manual model prices (mid-like) | ❌ Mid-price guaranteed fills, no commissions, VERIFIED | ✅ Ask/bid take-liquidity + combos, VERIFIED | ❌ Custom code |

**No platform produces actual historical executions.** The entire field runs on *modeled* fills; the honest question is only which modeled assumption. The field splits three ways: **take-liquidity-modeled** (ORATS, QuantConnect), **midpoint-modeled** (Option Omega, Option Alpha), and **user-set model prices** (OptionNet Explorer). The midpoint-based platforms default to exactly the assumption this research program's guardrails forbid — and their own documentation admits fills at mid are optimistic (Option Omega refuses to backtest XSP precisely because its fill model fails on wide spreads, VERIFIED FAQ).

**Three recommended candidates:**

1. **QuantConnect/LEAN** — primary research instrument. Honest non-midpoint fills, combo-order atomicity, per-trade order export, 4,000-symbol universe, minute data from 2012, paper trading (paid tier), $0 free tier. Gaps: code-first (Python/C#), no native walk-forward, default zero slippage must be configured, early-assignment default unverified.
2. **ORATS** — complementary screening and reference layer. 300M+ precomputed backtests, environment-matched Trade Ideas, the most honest fill model of any no-code platform (bid + 75% of spread travel), per-leg trade-log export, $99/mo. Gaps: template-bound strategies (no arbitrary multi-leg), entry-feature export UNKNOWN, no native OOS, overlapped-position engine.
3. **tastytrade Lookback** (discovered alternative, $0 marginal cost) — free multi-leg backtester with customizable entry/exit management and per-trial outputs for the account the researcher already holds. Gaps: fill methodology and data resolution both UNKNOWN — verify hands-on before any reliance. (Option Alpha, $79/mo CLAIMED, is the closest commercial substitute if Lookback proves inadequate: 1-min data to 2013, per-trade CSV, unlimited paper trading — but midpoint fills, 5 tickers, ≤45 DTE.)

**Buy / Build / Hybrid recommendation: HYBRID (C).** No fully managed platform (A) survives the decisive criteria — every no-code backtester is midpoint-based, template-bound, narrow-universe, or manual. A pure open-source build (B) is viable for this researcher (an existing custom Python framework plus $0–$590 one-time data) but leaves fills and management policies unverified by any independent engine. The recommended hybrid: keep the existing Python framework as the EV estimator (build), run **QuantConnect/LEAN** as the independent honest-fill reconstruction and paper-trading layer, feed both with cheap data (ThetaData Free $0, one-month Value backfill ~$40, or HistoricalData.net $590 one-time), and use **ORATS** ($99/mo, cancellable) or free references as an independent screen — with the mandatory cross-validation step (reconcile the same strategy's trades across the Python framework and LEAN) before trusting any number.

**Cheapest credible data paths (all VERIFIED from live vendor pages):** HistoricalData.net $590 one-time (full 2002→present archive, bid/ask + IV + 5 Greeks, 726 GB); ThetaData Free $0 (EOD since 2023-06-01, already held); ThetaData Value one-month backfill ~$40 (6 years). ORATS historical bulk ~$400–800 first year (price variants need checkout confirmation). iVolatility's per-ticker model is $15k+ at 30 names (INFERRED) — avoid at portfolio scale. Cboe DataShop, Databento, OptionMetrics: gated, UNKNOWN pricing.

**Hard limitations that would invalidate use for EV research** are catalogued per platform in §7. The single most important open verification in the entire study: whether ORATS's custom-backtest trade log includes entry-time market features — UNKNOWN from public docs, answerable only by inspecting an actual export.

---

## 2. Platform Comparison (six platforms in depth)

### 2.1 Option Omega (optionomega.com)

**What it is:** no-code, browser-based options backtesting/modeling/automation platform. Three products on one engine: Modeling, Backtesting, Automation (live trading at Tastytrade, Tradier, Schwab, TradeStation). No installs, no code (VERIFIED — homepage). VERIFIED tier prices (annual billing, optionomega.com): Lite $24.99/mo (modeling only), **Essential $49.99/mo** (the backtesting tier), Plus $74.99/mo, Premium $249.99/mo.

**Strategy support (VERIFIED from official docs):** 16 native templates — butterfly, calendar, double calendar, iron condor, iron fly, jade lizard, long call/put, long call/put spread, short call/put, short call/put spread, ratio spread, short straddle, short strangle. Custom builder up to 8 legs with linked legs and delta/%OTM/fixed-premium/strike-offset selection. Multiple simultaneous positions with max-open-trades limiter. Portfolio aggregation of saved tests. Capital constraints (starting funds, margin allocation %, max contracts, capital-per-contract sizing) — though margin modeling is the vendor's own estimate (CLAIMED, with the vendor's own warning that brokerages differ). Covered calls: no template and no documented equity leg (UNKNOWN/INFERRED absent). No scripting — closest power-user tool is CSV upload of custom entry/exit/strike signals (VERIFIED).

**Decisive execution finding: fills are modeled at historical 1-minute bid/ask midpoints by default** (VERIFIED from their own FAQ). These are neither actual executions nor take-liquidity fills. Realism toggles exist and are honestly documented — require-two-consecutive-hits profit targets (default ON), cap-profits-at-target (default ON), per-position slippage, ignore-wide-spreads >10,000 bps, configurable commissions — with explicit vendor warnings that some toggles produce "overly optimistic" results (VERIFIED). But the baseline is mid, complex-order fills are summed per-leg mids (INFERRED), partial fills are not simulated, and early assignment is not modeled as an event (UNKNOWN — at expiry, physically-settled ITM legs are marked "Would Have Exercised," priced at 15:59). The vendor refuses to backtest XSP ("too illiquid to model realistically") — its own admission the fill model fails on wide spreads (VERIFIED FAQ).

**Research capabilities:** per-trade CSV export passes (VERIFIED) with fields including reason-for-close, legs, premium, max loss/profit %, VIX (only if an entry/exit condition). Entry-feature export is thin: no per-leg IV, delta, Greeks, or bid/ask at fill (INFERRED absent from documented schema). No walk-forward or OOS — the optimizer (up to 5 dimensions, CSV results, ANOVA parameter-impact) is in-sample with only a heuristic "curve-fit resistance" score and a first-half/second-half "Edge Trend" tile (VERIFIED). Risk analytics are strong for a no-code tool (drawdown, MAR, Sharpe, Sortino, tail-risk tile, ulcer index, Monte Carlo sizing). Paper trading: not documented (UNKNOWN/absent); automation is live-broker only on Premium. Ticker universe: SPX (PM expiries only), SPY, QQQ, IWM, GLD, TLT + 5 stocks + IBIT (VERIFIED docs/homepage) — far too narrow for a diversified-portfolio study; the 89/438-name condor program cannot run here. Calendars force-close the entire position at the near leg's expiry (CLAIMED FAQ). Data: 1-minute from 2013-01-01, RTH, OPRA vendor (CLAIMED), included in subscription, no public API, export is manual CSV.

**Verdict:** fast, well-documented no-code backtester for liquid index/ETF options with unusually candid realism toggles — but it fails three of four decisive criteria: midpoint fills, thin entry-feature export, no OOS/WF, plus a universe too narrow for the portfolio question. Best use: quick no-code validation of single-underlying rules on SPX/SPY/QQQ/IWM with conservative toggles ON, cross-checked against the researcher's own framework.

### 2.2 ORATS (orats.com)

**What it is:** two separate products — **Trading Tools** dashboard ($99/mo individual, VERIFIED live: https://ORATS.com/trading-tools) with Options Backtester + Intraday mode, Trade Ideas, Strategy Optimizer, scanners; and a separate **Data API** ($199–$899/mo, VERIFIED). Headline asset: 300M+ precomputed backtests across 100+ symbols and 15 strategies; custom backtester (2,000 runs/mo included) over 5,000+ symbols and 45 strategies, EOD back to 2007, intraday 1-minute mode back to October 2020 (VERIFIED: https://orats.com/backtester).

**Strategy support:** precomputed universe covers IronCondor, ShortPutSpread, ShortCallSpread, IronButterfly, straddles/strangles, calendars (long call/put calendars) — iron condors and credit spreads are fully represented (VERIFIED from API docs). Notable precomputed absences: covered calls/buy-writes, call calendars, ratio spreads, backspreads, arbitrary custom structures. Custom backtesting is **template-driven, not arbitrary leg construction**: you pick a strategy template and set per-leg delta/DTE bands, strike selection, and leg relations (strike width, dteDiff) — you cannot type in an arbitrary 6-leg structure (VERIFIED from intraday API schema and University input-parameters page). Covered-stock/buy-write overlays exist (VERIFIED 2019 blog). Multiple simultaneous positions: the engine enters one trade per qualifying day, so books overlap by design (VERIFIED methodology page: "you can have 10 trades on at the same time"), with a max-concurrent-trades cap (VERIFIED API). No documented capital-based position sizing — the constraint model is count-of-concurrent-trades, not account-size-driven (INFERRED).

**Execution realism — the most honest of the no-code platforms (VERIFIED from primary sources):** fills simulated from **actual historical bid-ask quotes**, not theoretical values (explicit vendor denial, https://orats.com/blog/answers-to-common-questions-backtesting). Fill model: buy at Bid + 75% of spread width (single legs), ~53–56% for four-leg spreads (VERIFIED from two ORATS pages, figures differ slightly) — modeled worse than mid, better than full take. Daily MTM at midpoints. Snapshots taken 14 minutes before close to avoid wide closing quotes. Commissions user-configurable (intraday API example: $0.65/contract). This is a **modeled-fill** regime: honest, but not historical executions. EOD exits can only trigger at the daily snapshot (INFERRED limitation); intraday engine checks stops/targets per minute bar (VERIFIED). Assignment behavior: undocumented (UNKNOWN).

**Management policies (VERIFIED configurable):** profit targets (6 levels in precomputed runs), stop losses (3 levels), delta-based exits, %-of-max-spread-profit exits, strike-difference-percent-value exits, DTE exits, VIX/RSI/IV-percentile/slope-percentile entry triggers, earnings-day filters. Rolling: a 2019 blog says the API could "adjust a trade, not by rolling" — current rolling support UNKNOWN. Critical optimizer limitation (VERIFIED): the Strategy Optimizer "does not change the strategy's legs; it changes when the strategy is allowed to enter" — entry-condition optimization only, never legs or exits.

**Research capabilities:** per-trade/per-leg outcome export VERIFIED (downloadable trade log; API trade rows carry entry delta, entry stock price, exit prices, profit, exitReason, margin; precomputed API rows carry entry VIX/RSI/IV-percentile/slope-percentile). **The critical UNKNOWN: whether the downloadable *custom*-backtest trade log includes entry IV and entry market features** — the single most important open question for EV estimation; may require joining against the Data API ($199/mo). OOS/walk-forward: absent — the overfitting defense is 10,000-iteration Monte Carlo permutation tests with p-values plus a "find similar" neighborhood check (VERIFIED). Risk metrics: 37 metrics incl. Sharpe, Sortino, max drawdown (VERIFIED); explicit tail metrics (VaR/ES) undocumented (UNKNOWN). No parallel control/treatment report (INFERRED absent). Paper trading VERIFIED via broker paper accounts (IBKR, TradeStation, Tradier) — prospective order routing, separate from the backtester. "Theoretical edge" D%/F%/S% methodology: not publicly documented (UNKNOWN).

**Cost (VERIFIED):** $99/mo dashboard (no free trial; 24-hour cancellation = full refund; students 50% off); realistic EV-research stack $298–$398/mo if the Data API or Backtest Finder API is needed for entry features. 2,000 custom backtests/mo quota. Historical bulk data: $99/mo on referral promo pages (CLAIMED) or $399/yr variants (CLAIMED) — needs checkout confirmation.

**Verdict:** strongest "precomputed library + honest modeled fills" candidate — excellent as an environment-matched idea screen and quote source — but an incomplete EV instrument: template-bound, unknown entry-feature exports, no OOS harness, overlapped-position engine. The actual EV estimation still lives in the researcher's Python framework.

### 2.3 OptionNet Explorer (optionnetexplorer.com)

**What it is:** a Windows desktop **manual** back-trading simulator ("flight simulator" for options) — set the historical date/time, hand-model each trade leg-by-leg in the option chain, commit, step time forward; it tracks cumulative P/L with adjustments and commissions. Not an automated rule-based engine (VERIFIED from official help docs).

**Strategy support (VERIFIED):** arbitrary multi-leg structures are modelable (the manual's worked example is a call butterfly; credit spreads, condors, calendars, covered calls all hand-modelable). Multiple simultaneous positions across named Accounts. Rolling/adjustments are manual re-commits. **No automation, scripting language, API, or rule-based engine documented anywhere** — the entire workflow is mouse/keyboard-driven (a ribbon tab "AutoExplorer" exists in the help TOC but its page was not retrievable — UNKNOWN). Portfolio capital constraints: UNKNOWN.

**Data (VERIFIED):** 5-minute intraday historical option data for "all optionable US Equities and Indices" maintained on vendor servers, included in subscription. Depth back to 2010 is third-party CLAIMED (not in official docs). IV/Greeks are **computed by ONE from raw prices via Black-Scholes**, not quoted (VERIFIED knowledgebase). Stock splits are explicitly **not** processed — manual close/reopen required (VERIFIED help). Dividend/ex-div modeling: UNKNOWN. Historical bid/ask: UNKNOWN (chain shows Mid only).

**Execution realism — the worst gap in the field:** fills are ONE-supplied (mid-like, INFERRED) default prices the user can override at commit time; the vendor warns broker fills "may be better or worse" (VERIFIED). No slippage parameter, no bid/ask fill rule, no automated stop/profit-target execution, **no auto-expiry** — the user must manually close legs at expiration (VERIFIED). Trade Log export is **Windows copy/paste only** (VERIFIED knowledgebase) — no CSV, no API. Assignment/early exercise: undocumented (UNKNOWN). Manual replay is hindsight-vulnerable by construction.

**Research capabilities:** per-trade outcomes exist only as manually committed, manually priced model trades with copy/paste export (VERIFIED weak). Entry features are stored in snapshots but not exportable in structured form (UNKNOWN/limited). No OOS/walk-forward, no documented drawdown/tail statistics. The "expected returns" feature cited by a secondary review is a forward-model tool under custom assumptions (CLAIMED, not found in official docs) — not an empirical EV estimator. Prospective paper trading: the Position Monitor tracks live positions via broker feed — a live-trade journal, not a prospective strategy sandbox (VERIFIED).

**Cost (VERIFIED live 2026-10-14, GBP excl. VAT):** 10-day trial £10; 3 months £165 (£147 post-trial); 12 months £535 (£485/£430 post-trial variants). No monthly plan. Data included. Windows desktop only (docs cite XP–7; reviews say XP–10; Mac needs a VM). Lock-in: trades, history, and the 5-minute dataset live on vendor servers — lapsing the subscription forfeits the research artifact itself (INFERRED).

**Verdict:** a learning/practice tool for hand-constructing illustrative trades, not research infrastructure. Fails all four decisive criteria. Exclude from the EV pipeline.

### 2.4 Option Alpha (optionalpha.com)

**What it is:** no-code retail options **autotrading** platform (founded 2014): rule-based bots routing to tastytrade/TradeStation/Tradier/Schwab (VERIFIED), an in-app historical backtester, and a Trade Ideas engine ranking setups by proprietary Expected Value and Alpha. No public REST API found.

**Strategy support (VERIFIED):** the backtester natively supports exactly 8 position types — long call, long call spread, short call spread, long put, long put spread, short put spread, iron condor, iron butterfly. Covered calls, calendars/diagonals, ratio spreads/backspreads, and arbitrary custom multi-leg are **not** in the backtester list (INFERRED absent). Multiple simultaneous positions with position limits and frequency caps; capital safeguards ("Available Capital" = allocation + credits − maintenance); compare-up-to-4 backtests and combine into a portfolio curve (VERIFIED). Ticker universe: **SPX, SPY, QQQ, IWM, XSP only** (VERIFIED) — a hard ceiling for the diversified-portfolio question.

**Execution realism — the vendor is unusually candid (VERIFIED from official docs):** baseline fill = **mid-price** at entry, exit, and trigger evaluation; optional user-set $/contract slippage (default INFERRED zero); bid/ask spread guards (June 2026); **"the backtest scans one time and always fills if conditions are met"** (vs live bots with real non-fills); **no commissions or exchange fees in P&L**; **no assignment/early-exercise modeling** ("the backtester cannot account for risk of assignment"). Modeled fills, guaranteed, at mid — the vendor says so plainly. Their own EV validation study (~130k Trade Ideas, mid-Jul–mid-Aug 2023, 155 symbols) assumed cash settlement, no management, no assignment, no transaction costs, and excluded earnings/ex-div crossings (VERIFIED blog).

**EV framework (VERIFIED, official docs/blog):** EV = Σ(x_i · p_i) in three tiers — Simple (max profit/loss × delta-as-probability), Simple-Partial, and Real EV (discrete BSM PDF at $0.01 underlying increments). Trade Ideas 2.0 uses Real EV. **Probabilities use Black-Scholes with 30-day historical volatility** — neither implied Q nor historically calibrated P (VERIFIED blog: HV-based BSM was their most accurate variant). Iron-condor EV treats put and call sides as **independent events** (joint probability = product — stated in their own docs). Vendor validation: bucketed pre-trade EV tracked realized average P/L in a quiet VIX<20 sample, but **EV–P/L correlation collapsed to zero for earnings-crossing trades** and sub-20-DTE predictability was poor ("Expected Value, and probabilities in general, cannot be relied upon for accurately estimating future returns" — their words). CLAIMED as vendor research, not peer-reviewed.

**Management:** Exit Options are first-class in bots (profit taking/target, stop loss, trailing stop, touch, expiration, earnings; 1-min checks; June 2026 added dollar-denominated exits) and partially in the backtester (VERIFIED). Whether full Exit-Options logic (trailing, touch, conditional updates) is simulated in historical backtests: UNKNOWN. Native rolling in backtests: UNKNOWN. Note: the vendor's EV evidence assumes hold-to-expiration — no vendor evidence on managed-policy expectancy.

**Research capabilities:** per-trade CSV export VERIFIED (June 2026; column schema undocumented → entry features UNKNOWN). Drawdown/tail stats VERIFIED (max drawdown, profit factor, win rate, streaks, monthly P/L, Return on Drawdown). No native OOS/walk-forward (UNKNOWN; manual time-window splits INFERRED workaround). **Paper trading VERIFIED — unlimited, no broker needed** — prospective validation path, though paper fills inherit the modeled-fill assumptions (INFERRED). Data: 1-minute options history, back to 2013-01-02 (XSP from 2015), expirations up to 45 DTE (June 2026 update, VERIFIED); historical bid/ask granularity, IV, Greeks: all UNKNOWN.

**Cost:** Pro plan = 50 bots, $100k/bot, unlimited backtesting (VERIFIED from https://Optionalpha.com/pricing). The dollar price was not visible in extracted page text; third parties consistently report **$79/mo** (CLAIMED, unverified at primary source) with a 30-day full-feature trial, no credit card. $0/mo promo plans via TradeStation ($10k balance) / Tradier ($5k) / tastytrade ($5k) (VERIFIED). No public REST API (INFERRED; docs list inbound webhooks only).

**Verdict:** transparent about its optimistic assumptions, strong on managed-policy automation and paper trading, but midpoint-guaranteed fills with no costs and no assignment, a 5-ticker/45-DTE ceiling, and an EV framework built on HV-based BSM (not calibrated physical probabilities) make it a cross-check tool, not the estimator. Worth the 30-day free trial for managed-policy variants on SPY/QQQ.

### 2.5 QuantConnect / LEAN (quantconnect.com)

**What it is:** code-first (Python/C#) quantitative platform on the open-source LEAN engine. No visual strategy builder — every docs page demonstrates code only (VERIFIED). Native `OptionStrategies` helpers: `IronCondor`, `Straddle`/`ShortStraddle`, `PutCalendarSpread`/`ShortPutCalendarSpread`, `BullPutLadder`/`BearPutLadder`, butterflies, box spreads; universe pre-filters (`universe.iron_condor(30, 5, 10)`) (VERIFIED). Credit spreads, condors, calendars, butterflies all covered natively.

**Execution realism — the strongest in the field (VERIFIED from official docs):** the default `ImmediateFillModel` for options fills market orders at **ask (buy) / bid (sell)** — not midpoint — selecting from tick quotes → QuoteBar → TradeBar with anti-look-ahead guards. Default slippage is **zero** (VERIFIED) — add a custom `ISlippageModel` for conservatism. Default leg execution: each leg of a strategy fills individually (VERIFIED, staff forum) — conservative on friction (per-leg spread crossing), though leg-to-leg correlation risk at entry is not modeled. **Atomic multi-leg via combo order types** (`ComboMarket`/`ComboLimit`/`ComboLegLimit`, VERIFIED): fills only when all legs can fill in the same timestep, with leg-level bid/ask pricing — a modeled atomicity, with no net complex-order negotiation and no midpoint assumptions anywhere. Fees: InteractiveBrokersFeeModel by default ($0.25–$0.70/contract at low volume, VERIFIED). Expiry: auto-exercise ITM at expiration against the underlying close, customizable via `IOptionExerciseModel` (VERIFIED); assignment: default model checked hourly in backtests, customizable via `IOptionAssignmentModel` (exact pre-expiry trigger logic of the default model: UNKNOWN). No market-impact model, no partial fills by default, no pin-risk nuance (INFERRED from docs).

**Data (VERIFIED):** US Equity Options (AlgoSeek, OPRA): 4,000 symbols incl. ETFs, **January 2012 → present**, minute resolution, Trade + Quote + Open Interest. US Index Options: **SPX, VIX, NDX only** (no XSP). Bid/ask and trades both available (`QuoteBar`/`TradeBar`, `History<QuoteBar>()`). IV/Greeks: daily, model-derived (forward-tree accounting for rates/dividends) via the Option Universe datasets. Corporate actions: underlying splits/dividends via Security Master (VERIFIED); option-side strike-adjustment specifics UNKNOWN. Free plan includes options data at minute/hour/daily (VERIFIED pricing page).

**Management policies:** profit targets, DTE exits, rolling, conditional adjustments are **user code** — no native policy objects (docs demonstrate all as hand-written logic). Provided primitives: `Schedule.On(...)` events, limit/stop/trailing-stop/MOO/MOC orders, `ExerciseOption`, `OnAssignmentOrderEvent`, Algorithm Framework slots (universe/alpha/**portfolio construction**/risk management/execution), `OptionMarginModel` buying-power modeling (VERIFIED).

**Research capabilities (VERIFIED):** per-trade order export via `api.read_backtest_orders(...)` (paginated; symbol, quantity, price, fill time, fees); custom summary statistics via `SetSummaryStatistic`; entry-feature pull via QuantBook notebooks against the same datasets (no native trade×feature join — user code, INFERRED). Overall Statistics (Expectancy, Sharpe, PSR, drawdown, fees); **no native walk-forward** (a 2015 feature request remains open — VERIFIED); parameter optimization exists (grid, QCC-priced compute); OOS via separate IS/OOS runs (manual); meta-analysis docs support comparing backtests across projects in one notebook (VERIFIED). **Paper trading on paid tiers** (tastytrade supported — VERIFIED pricing page); free tier has no paper/live nodes.

**Cost (VERIFIED):** **Free = $0** — unlimited backtesting, all asset classes incl. options data, minute/hour/daily, 1 research + 1 backtest node, PDF reports. Limits: 10K orders/backtest, no tick/second, no paper trading, no object store. Paid tiers (Quant Researcher, Team, Trading Firm, Institution) are now resource-configured; **exact seat prices were JS-rendered and not extractable — UNKNOWN**; third parties cite ~$60–84/mo Researcher configs (CLAIMED, indicative). Data downloads via CLI priced in QCC credits with a signed data agreement (no redistribution). Lock-in: low engine lock-in (open-source LEAN), moderate data/workflow lock-in (INFERRED).

**Verdict:** the only platform where the decisive EV criteria are all satisfiable — honest non-midpoint fills, per-trade export, entry features, multi-underlying portfolios with capital constraints — mostly on the $0 tier. Gaps: code-first (matches this researcher's existing Python practice), no native walk-forward, default fill is instant/complete/zero-slippage (optimistic on liquidity unless configured), combo fills are leg-level aggregates not net-negotiated spreads, index universe is SPX/VIX/NDX only, early-assignment default unverified.

### 2.6 Backtrader (+ options extensions)

**Blunt verdict: zero native options support (VERIFIED against the README feature list and API)** — no option instrument, chain, expiry, exercise, assignment, Greeks, or IV. Multi-leg = one data feed per contract + hand-rolled leg coordination + hand-rolled expiry settlement. A 2026 practitioner project (`jerry0815/trade_bot`) explicitly evaluated Backtrader for an options overlay and **rejected it**, building a custom event-driven simulator instead — the key real-world datapoint.

**Other material findings (VERIFIED):** upstream `mementum/backtrader` is **GPL-3.0, not MIT** (corrects the commission brief's premise — copyleft obligations attach to distributed derivatives; fine for internal research). Upstream **dormant since 2023-04-19**; life continues in forks (`nijigen-trading/backtrader` is the maintained install target, Python ≥3.9). **No maintained options-extension ecosystem found** — only end-user repos carrying options semantics in their own code. Data: none bundled; CSV/pandas ingestion (VERIFIED); extra data lines (bid/ask/IV/delta/DTE) are a documented mechanism (author's own blog), so ThetaData EOD per-contract CSVs fit — but hundreds–thousands of feeds is the user's ETL/scale problem. Execution: native market/limit/stop/OCO/bracket orders, slippage, volume fills, flexible per-asset commissions (tastytrade-style $1/contract + $0.10 clearing is implementable as a custom `CommInfoBase` — feasible-custom, not native); **bid/ask fills: no native support** (limit orders simulate against bar OHLC; honest bid/ask = custom limit-price-from-bid/ask-lines code). Profit-target/stop = native orders; DTE exits = native timers; assignment = no native concept. Research: `TradeAnalyzer` aggregates only; per-trade export, entry-feature export, and walk-forward are all custom code (~50–100 lines each). Cost: $0 software, user's hardware, no lock-in; programming requirement HIGH (weeks of options-engine code).

**Verdict:** usable as scaffolding (bar loop + order simulator + analyzer hooks), poor as an "options backtesting platform." Given the researcher already owns a custom Python framework, Backtrader's marginal value is thin. Rank below any platform with native multi-leg/expiry semantics.

### 2.7 Discovered alternatives (shortlist)

- **tastytrade Lookback** — the strongest discovered alternative. VERIFIED: free built-in backtester (Standard/Advanced/Simulation modes; guide updated 2026-01) with multi-leg support (`legs[]`), customizable entry/exit management (stops, profit targets), and per-trial outputs (`trials[]`/`snapshots[]`). Zero marginal cost for the existing account. Gaps UNKNOWN: fill assumptions, historical data resolution, OOS/walk-forward, exportability. Worth a hands-on cross-validation against the Python framework — a supplement, not a displacement.
- **Market Chameleon** — VERIFIED pre-computed strategy-backtest screeners (Straddle & Wing; Earnings screener tracking "over 3M historical back-tested strategies" per vendor) with win rates, avg/median returns, Sharpe, IV-vs-RV. Not user-programmable; no per-trade export; fills UNKNOWN. Pricing: official page fronts a free trial without showing recurring price; dated third-party reviews list $69–$99/mo tiers (all CLAIMED). Useful as an independent reference/prior, not an engine.
- **OptionStrat** — VERIFIED as strategy visualizer/optimizer + flow tool, not a historical backtester. Pricing corroborated across 2026 sources: Free / $39.99/mo Live Tools / $99.99/mo Live Flow. Irrelevant to EV estimation.
- **LiveVol (Cboe)** — VERIFIED analytics platform (tick-level time & sales 2011–present on Pro), not a strategy backtester. Pro $350–420/mo/user + data fees (VERIFIED); Core $105/mo; 15-day trial. No displacement case.
- **EdgeRater** — stock screener/backtester with auxiliary options-IV features, not a multi-leg options backtester. $1,497 forever license (VERIFIED). Exclude.
- **Watchlist only (insufficient evidence):** TradeHawk (Tradier trading platform, no real backtest engine evidenced), OptionsGeek (no credible product found — UNKNOWN), OptionScout ($9/mo Pro, CLAIMED), Options Trading Toolbox, Options Matrix Pro, TradeMachine.

**Displacement assessment:** none of the discovered alternatives meets the decisive EV criteria better than the primaries. Only tastytrade Lookback merits hands-on investigation.

---

## 3. Detailed Capability Matrix

### 3.1 Strategy support

| Structure | Option Omega | ORATS | OptionNet Explorer | Option Alpha | QuantConnect/LEAN | Backtrader |
|---|---|---|---|---|---|---|
| Credit put spreads | ✅ Native template (VERIFIED) | ✅ Precomputed + custom (VERIFIED) | ✅ Hand-modeled (VERIFIED) | ✅ Backtestable (VERIFIED) | ✅ Native helper (VERIFIED) | ❌ Custom code |
| Credit call spreads | ✅ Native template (VERIFIED) | ✅ Precomputed + custom (VERIFIED) | ✅ Hand-modeled (VERIFIED) | ✅ Backtestable (VERIFIED) | ✅ Native helper (VERIFIED) | ❌ Custom code |
| Iron condors | ✅ Native template (VERIFIED) | ✅ Precomputed + custom (VERIFIED) | ✅ Hand-modeled (VERIFIED) | ✅ Backtestable (VERIFIED) | ✅ `IronCondor()` helper (VERIFIED) | ❌ Custom code |
| Covered calls | ❌ No template / equity leg UNKNOWN | ✅ Stock-overlay in custom (VERIFIED blog) | ✅ Hand-modeled (VERIFIED) | ❌ Not in backtest list (INFERRED) | ✅ Via equity + option legs (VERIFIED) | ❌ Custom code |
| Calendar spreads | ✅ Native (force-closes at near expiry — CLAIMED) | ✅ Precomputed (long call/put calendar) + custom (VERIFIED) | ✅ Hand-modeled (VERIFIED) | ❌ Not in backtest list (INFERRED) | ✅ `PutCalendarSpread` helper (VERIFIED) | ❌ Custom code |
| Ratio spreads / backspreads | ✅ Ratio template (VERIFIED) | ❓ UNKNOWN (template support unverified) | ✅ Hand-modeled (INFERRED) | ❌ Not in backtest list (INFERRED) | ✅ Via leg quantities (VERIFIED) | ❌ Custom code |
| Custom multi-leg | ✅ Up to 8 legs, no-code (VERIFIED) | ⚠️ Template-parameterized only (VERIFIED) | ✅ Arbitrary leg entry (VERIFIED) | ⚠️ 8 fixed types only (VERIFIED) | ✅ Arbitrary (code) (VERIFIED) | ❌ Custom code |
| Multiple simultaneous positions | ✅ Max-open-trades limiter (VERIFIED) | ✅ One/day overlapping by design + cap (VERIFIED) | ✅ Named accounts (VERIFIED) | ✅ Position limits + frequency (VERIFIED) | ✅ Universe models (VERIFIED) | ✅ Multiple feeds (custom) |
| Portfolio capital constraints | ✅ Sizing/margin controls; margin = vendor estimate (VERIFIED/CLAIMED) | ⚠️ Count-based cap only (INFERRED) | ❓ UNKNOWN | ✅ Allocation safeguards (VERIFIED) | ✅ PortfolioConstructionModel + margin model (VERIFIED) | ❌ Custom code |
| Native vs custom programming | No-code only (VERIFIED) | Template config, no-code (VERIFIED) | Manual, no automation (VERIFIED) | No-code bots (VERIFIED) | Code-first Python/C# (VERIFIED) | Code-first Python (VERIFIED) |

### 3.2 Historical data

| Item | Option Omega | ORATS | OptionNet Explorer | Option Alpha | QuantConnect/LEAN | Backtrader |
|---|---|---|---|---|---|---|
| Depth | 2013-01-01 (VERIFIED) | 2007 EOD; 1-min Oct 2020 (VERIFIED) | CLAIMED 2010 (3rd-party) | 2013-01-02 (XSP 2015) (VERIFIED) | Jan 2012, minute (VERIFIED) | User-supplied |
| Resolution | 1-min RTH (VERIFIED) | EOD snapshot 14 min pre-close; 1-min intraday (VERIFIED) | 5-min (VERIFIED) | 1-min (VERIFIED) | Minute (+ tick/second paid) (VERIFIED) | User-supplied |
| Historical bid/ask | Underlies fills; vendor OPRA (CLAIMED) | ✅ SMV-cleaned bid/ask (VERIFIED) | ❓ UNKNOWN (chain shows Mid) | ❓ UNKNOWN | ✅ Trade + Quote bars (VERIFIED) | Via extra data lines (custom) |
| Historical IV/Greeks | Entry filters only; per-contract UNKNOWN | ✅ SMV Greeks + IV (VERIFIED) | Computed via BS, not quoted (VERIFIED) | ❓ UNKNOWN | ✅ Daily model-derived (VERIFIED) | Custom |
| ETF vs index options | SPY/QQQ/IWM/GLD/TLT ETFs; SPX index (PM only); **XSP excluded from backtests** (VERIFIED) | 5,000+ symbols: stocks, ETFs, indexes; no futures options (VERIFIED) | "All optionable US Equities and Indices" (VERIFIED) | SPX/SPY/QQQ/IWM/XSP only (VERIFIED) | 4,000 equity/ETF symbols; index = SPX/VIX/NDX only, **no XSP** (VERIFIED) | User-supplied |
| Corporate actions / dividends | Weak: QQQ 2023 special dividend caused documented errors (VERIFIED); policy UNKNOWN | Dividend/earnings/split history endpoints (VERIFIED); engine treatment UNKNOWN | Splits NOT processed (VERIFIED); dividends UNKNOWN | UNKNOWN | Underlying splits/dividends via Security Master (VERIFIED); option-side UNKNOWN | Custom |
| Data included vs separate | Included (INFERRED) | Backtester data included; Data API separate $199+/mo (VERIFIED) | Included (VERIFIED) | Included, unlimited backtests (VERIFIED) | Included on Free tier (VERIFIED) | None bundled |
| Raw data export / API | ❌ Manual CSV of trade log only; no API (VERIFIED) | Trade log downloadable; full data via paid API (VERIFIED) | ❌ Copy/paste only (VERIFIED) | CSV position export; no public REST API (VERIFIED/INFERRED) | ✅ Research notebooks + CLI download (VERIFIED) | N/A (user's data) |

### 3.3 Execution realism

| Item | Option Omega | ORATS | OptionNet Explorer | Option Alpha | QuantConnect/LEAN | Backtrader |
|---|---|---|---|---|---|---|
| Fill basis | **Midpoint** (VERIFIED FAQ) | Bid/ask + take penalty: buy at Bid+75% spread (VERIFIED) | User-set model price, mid-like (INFERRED) | **Mid-price**, guaranteed fill (VERIFIED) | **Ask (buy)/Bid (sell)** (VERIFIED) | Bar OHLC; custom bid/ask logic |
| Fill class | Modeled (midpoint) | Modeled (take-liquidity) | Modeled (manual) | Modeled (midpoint) | Modeled (take-liquidity) | Modeled (custom) |
| Complex-order fills | Per-leg mids summed; no spread-book (INFERRED) | Spread-level % travel (53–56%, VERIFIED) | N/A (manual) | Position mid-price (VERIFIED) | Per-leg default; **combo atomicity** modeled (VERIFIED) | N/A |
| Slippage | Optional per-position (VERIFIED) | Built into 75%/56% penalty (VERIFIED) | None documented | User-set $/contract (VERIFIED) | Default **zero**; custom model (VERIFIED) | Native models |
| Commissions/fees | User-configurable (VERIFIED) | User-configurable (VERIFIED) | Tracked, configurable treatment (VERIFIED) | **Excluded from P&L** (VERIFIED) | IB fee model default (VERIFIED) | Flexible custom schemes |
| Partial fills | Not simulated (INFERRED) | Not documented | N/A | N/A ("always fills") | Complete/immediate by default | Volume fills available |
| Profit-target limit orders | Simulated via two-hit + cap toggles (VERIFIED) | Trigger evaluated at snapshot (EOD) / per-minute (intraday) | Manual only | Exit options in bots; backtest subset UNKNOWN | Limit orders native (VERIFIED) | Native limit/OCO/bracket |
| Time/DTE exits | ✅ (VERIFIED) | ✅ (VERIFIED) | Manual | ✅ (VERIFIED) | User code (primitives VERIFIED) | Native timers |
| Stop orders | ✅ incl. trailing (VERIFIED) | ✅ (VERIFIED) | Manual | ✅ in bots (VERIFIED) | Native order types (VERIFIED) | Native |
| Assignment / early exercise | Not modeled as event (UNKNOWN) | Undocumented (UNKNOWN) | Undocumented (UNKNOWN) | **Not modeled** ("cannot account for risk of assignment," VERIFIED) | Hourly assignment checks + exercise model, customizable (VERIFIED) | No native concept |
| Ex-dividend effects | UNKNOWN (QQQ error documented) | Engine treatment UNKNOWN | UNKNOWN | Excluded from EV study; exit option exists | Dividend-yield models documented | Custom |
| Missing quotes | Blackout dates (VERIFIED); policy UNKNOWN | `tradeDaysSkippedNoData` diagnostics (VERIFIED) | UNKNOWN | UNKNOWN | No-fill on stale data (VERIFIED guard) | Custom |
| Liquidity constraints | Wide-spread ignore toggle only (VERIFIED) | Spread-penalty + snapshot timing (VERIFIED) | None | Bid/ask spread guards (VERIFIED) | Instant/complete fills (optimistic); user slippage | Volume fills |

**The fill-taxonomy verdict (commission RQ4's core distinction):** no platform offers actual historical executions. ORATS and QuantConnect model take-liquidity fills from historical quotes. Option Omega and Option Alpha model midpoint fills. OptionNet Explorer uses hand-set model prices. Backtrader models whatever the user codes.

### 3.4 Management policies

| Policy | Option Omega | ORATS | OptionNet Explorer | Option Alpha | QuantConnect/LEAN | Backtrader |
|---|---|---|---|---|---|---|
| Fixed % profit targets | ✅ No-code (VERIFIED) | ✅ 6 levels (VERIFIED) | Manual | ✅ Bots + backtest (VERIFIED) | User code | Native orders |
| DTE-based exits | ✅ (VERIFIED) | ✅ (VERIFIED) | Manual | ✅ (VERIFIED) | User code | Native timers |
| Rolling | ❌ No dedicated action (INFERRED) | ❌ "Adjust, not by rolling" (2019); current UNKNOWN | Manual re-commit | ❓ UNKNOWN | User code (example documented) | Custom |
| Conditional hedging | Time/profit actions, leg groups; **no new hedge legs** (VERIFIED/INFERRED) | Rule-based adjustments in API tier (2019); current UNKNOWN | Manual | Exit Options updatable by automation (VERIFIED) | User code (framework slots) | Custom |
| Conditional adjustments | ✅ Exit-on-VIX/price/delta/tested (VERIFIED) | Entry triggers optimizable; exit-rule optimization excluded (VERIFIED) | Manual | Partial (backtest subset UNKNOWN) | User code | Custom |
| Assignment management | ❓ UNKNOWN | ❓ UNKNOWN | ❓ UNKNOWN | Bots unaware of assignment (VERIFIED) | `OnAssignmentOrderEvent` hook (VERIFIED) | None |
| Portfolio-level rules | Portfolios aggregate; portfolio stops UNKNOWN | Combine backtests into one report (VERIFIED) | UNKNOWN | Combine backtests into portfolio curve (VERIFIED) | Risk management models (VERIFIED) | Custom |
| Configurable without programming | ✅ Fully | ✅ Fully (template-bound) | N/A (manual) | ✅ Fully (bots) | ❌ Code required | ❌ Code required |

### 3.5 Statistical research capabilities

| Capability | Option Omega | ORATS | OptionNet Explorer | Option Alpha | QuantConnect/LEAN | Backtrader |
|---|---|---|---|---|---|---|
| Per-trade outcome export | ✅ CSV (VERIFIED) | ✅ Trade log + per-leg (VERIFIED) | ⚠️ Copy/paste only (VERIFIED) | ✅ CSV, schema undocumented (VERIFIED) | ✅ Orders API + custom stats (VERIFIED) | ❌ Custom analyzer |
| Entry-feature export | ⚠️ Thin (no IV/Greeks/delta) | ❓ **UNKNOWN (custom logs)** | ❌ No structured export | ❓ UNKNOWN | ✅ QuantBook pull (user code) | ❌ Custom |
| Custom EV calculations | ❌ | ❌ (edge formula black box) | Forward-model only (CLAIMED) | HV-BSM EV, not calibrated P (VERIFIED) | ✅ User code | ✅ User code |
| Conditional P/L regression | ❌ (features missing) | ❓ (depends on export) | ❌ | ❓ (depends on export) | ✅ (features + outcomes joinable) | ✅ (custom) |
| OOS / walk-forward | ❌ Heuristics only | ❌ Permutation tests only | ❌ None | ❌ Manual workaround | ❌ Manual IS/OOS (no native WF) | ❌ Custom harness |
| Risk / drawdown analysis | ✅ Strong (MDD, MAR, Sortino, ulcer, MC) | ✅ 37 metrics (Sharpe, Sortino, MDD) | ❌ Not documented | ✅ MDD, PF, streaks, RoD | ✅ Full stats + charts | ✅ Analyzers (aggregates) |
| Tail-loss analysis | Tail-risk tile (VERIFIED) | VaR/ES UNKNOWN | ❌ | Best/worst, max-loss % | Custom stats | Custom |
| Parallel control/treatment | Manual compare (INFERRED) | No formal A/B (INFERRED) | Manual accounts (INFERRED) | Compare 4 side-by-side (VERIFIED) | ✅ Multi-backtest meta-analysis (VERIFIED) | ✅ Manual multi-run |
| Prospective paper trading | ❓ UNKNOWN/absent | ✅ Broker paper accounts (VERIFIED) | Live monitor only | ✅ Unlimited, no broker (VERIFIED) | ✅ Paid tiers, tastytrade (VERIFIED) | N/A |

---

## 4. Historical Data and Execution-Quality Assessment

### 4.1 Data quality ranking (for multi-leg EV research)

1. **ORATS** — deepest EOD history (2007), SMV-cleaned bid/ask + Greeks + IV + theoretical values, 5,000+ symbols, earnings/split/dividend history endpoints, 14-minutes-pre-close snapshots to avoid wide closing quotes, missing-data diagnostics (`tradeDaysSkippedNoData`, `entryDaysNoChain`). The most research-grade dataset of any commercial platform here (VERIFIED). Caveat: the backtester and the data product are separately billed.
2. **QuantConnect (AlgoSeek/OPRA)** — minute Trade + Quote + OI from January 2012, 4,000 equity/ETF symbols, daily model-derived IV/Greeks, underlying corporate actions via Security Master. Best resolution-per-dollar on the $0 tier (VERIFIED). Caveats: index options limited to SPX/VIX/NDX (no XSP); option-side split adjustments unverified.
3. **Option Alpha** — 1-minute options history back to 2013-01-02 (XSP from 2015), expirations to 45 DTE (VERIFIED). Caveats: 5 tickers only; bid/ask granularity, IV, Greeks, and corporate-action handling all UNKNOWN.
4. **Option Omega** — 1-minute from 2013-01-01, OPRA vendor (CLAIMED), 12 tickers (VERIFIED). Caveats: narrow universe; per-contract Greeks history UNKNOWN; QQQ special-dividend backtest errors documented (VERIFIED); XSP excluded as "too illiquid to model."
5. **OptionNet Explorer** — 5-minute data, "all optionable US Equities and Indices" (VERIFIED), depth to 2010 third-party CLAIMED. Caveats: IV/Greeks computed not quoted; splits unprocessed; no raw data export — the dataset cannot leave the platform.
6. **Backtrader** — no data; quality is whatever the researcher supplies (ThetaData EOD maps cleanly onto its feed mechanism, VERIFIED).

**Build-path data (cheapest credible, all VERIFIED from live vendor pages):** HistoricalData.net $590 one-time (2002→present, 34 columns incl. bid/ask, IV, 5 Greeks; free 239 MB sample for validation); ThetaData Free $0 (EOD since 2023-06-01, ~3.4 yr, already held; Greeks via BS inversion per the researcher's 2026-09-29 verification); ThetaData Value one-month backfill ~$40 (6 yr, cancel anytime). ORATS historical bulk ~$400–800 first year (two published price variants — confirm at checkout). Avoid at portfolio scale: iVolatility retail ($15k–$23k for 30 names × 5 yr, INFERRED); gated/UNKNOWN: Cboe DataShop, Databento, OptionMetrics.

### 4.2 Execution-quality verdict

The commission asked for the actual-vs-modeled-vs-midpoint distinction. Findings:

- **Actual historical executions: none.** No platform in this study replays real historical fills. Every backtest is a modeled fill. Any vendor language suggesting otherwise should be read as CLAIMED until demonstrated.
- **Modeled take-liquidity (best available):** ORATS (bid + 75% spread travel single-leg, ~53–56% four-leg; VERIFIED) and QuantConnect (ask/bid immediate fills, combo-order atomicity; VERIFIED). Both still assume instant, complete fills — no partial fills, no queue, no market impact. QuantConnect's default zero slippage must be configured upward for conservatism; ORATS's EOD exits trigger only at the daily snapshot.
- **Modeled midpoint (optimistic; matches the forbidden assumption):** Option Omega (VERIFIED FAQ) and Option Alpha (VERIFIED docs; guaranteed fills, no commissions). The researcher's own XSP audit demonstrated that midpoint fills flip sign (−$22,176 canonical vs +$18,252 midpoint) — these two platforms default to the optimistic side of that demonstrated gap.
- **Manual model prices:** OptionNet Explorer (user-set, mid-like, INFERRED) — the least disciplined regime, hindsight-vulnerable.

**Management-policy testing under honest fills** is currently possible only on QuantConnect (code) and ORATS (template-bound, EOD snapshot limits). Neither Option Omega nor Option Alpha can test a profit-target policy under take-liquidity assumptions without user slippage add-ons that remain midpoint-anchored.

---

## 5. Current Pricing Comparison (as-of 2026-10-14)

| Platform | Entry price | Research-capable tier | Trial | Data cost | Pricing evidence |
|---|---|---|---|---|---|
| Option Omega | $24.99/mo Lite (annual) | **Essential $49.99/mo** (annual) / Premium $249.99/mo | 7 days (14 Premium), 3-yr data cap, 250 tests/day | Included | Annual tiers VERIFIED on optionomega.com; monthly Lite/Essential/Plus ($29.99/$99.99/$129.99) third-party CLAIMED |
| ORATS | $99/mo Trading Tools | $99/mo; realistic EV stack **$298–$398/mo** (+ Data API) | No free trial; 24-hr full refund | Backtester data incl.; Data API $199–$899/mo; bulk ~$400–800/yr (variants) | $99 + API tiers VERIFIED; bulk variants CLAIMED (needs checkout) |
| OptionNet Explorer | £10 / 10-day trial | **£535/yr** (no monthly plan) | £10 10-day, one per customer | Included | VERIFIED live pricing page (GBP excl. VAT) |
| Option Alpha | $0 promo plans (via broker) | **$79/mo** Pro (third-party); $0 via TradeStation/Tradier/tastytrade promos | 30 days, full features, no card | Included, unlimited backtests | $79/mo CLAIMED (not visible in extracted page text); promos + trial VERIFIED |
| QuantConnect/LEAN | **$0 Free** | $0 Free covers minute options research; paid seat prices UNKNOWN | Free tier is the trial | Included on Free (minute/hour/daily) | Free VERIFIED; paid prices JS-gated UNKNOWN; ~$60–84/mo third-party CLAIMED |
| Backtrader | **$0** (GPL-3.0) | $0 | N/A | User-supplied | VERIFIED (GitHub; license GPL-3.0 not MIT) |
| tastytrade Lookback | **$0** (account held) | $0 | N/A | Included | VERIFIED free |
| Market Chameleon | Free trial | ~$69–$99/mo (third-party) | 7-day (CLAIMED) | Included | Recurring price not on official page; tiers CLAIMED |
| Build-path data | — | **$0** (ThetaData Free) / **$590 one-time** (HistoricalData.net) / ~$40 (ThetaData 1-mo backfill) | Free samples exist | — | All VERIFIED on live vendor pages |

**Total-cost sketches (INFERRED, first year, individual researcher):**
- (A) Fully managed: Option Omega Essential $600/yr or ORATS $1,188/yr — but neither meets the decisive EV criteria alone.
- (B) Open-source + data: $0 (ThetaData Free, ~3.4 yr EOD) to $590 one-time (HistoricalData.net, 2002→present) + engineering time (weeks for honest multi-leg engine).
- (C) Hybrid (recommended): $0 (QuantConnect Free) + $0–$590 data + optional ORATS $99/mo screening = **$590 one-time + $0–$1,188/yr optional**.

---

## 6. Three Recommended Candidates

### Candidate 1 — QuantConnect / LEAN (primary research instrument)

**Why:** the only platform satisfying all four decisive criteria without a disqualifying assumption. Fills cross the spread at historical bid/ask (VERIFIED) — the closest any reviewed platform gets to the researcher's take-liquidity standard. Combo orders model atomic multi-leg fills (VERIFIED). Per-trade orders export programmatically (VERIFIED). Entry features are pullable in QuantBook against the same datasets (VERIFIED feasible). 4,000-symbol universe with minute data from 2012 covers the diversified-portfolio question (VERIFIED). Algorithm Framework gives portfolio construction and risk-management slots with real capital constraints (VERIFIED). Paper trading on paid tiers with tastytrade support (VERIFIED). Free tier costs $0 with unlimited backtesting.

**Fit for the EV program:** the researcher's minimum defensible experiment (conditional net-P/L regression on entry observables, three cost scenarios, separate tail metrics, pre-registered falsification) is implementable here: natural take-liquidity / partial-improvement / midpoint scenarios are three runs of one strategy with different price-selection logic; IS/OOS splits are manual but disciplined; the Python framework remains the estimator while LEAN provides the independent reconstruction.

**Limitations to manage:** code-first (matches the researcher's existing practice — not a real cost); no native walk-forward (manual IS/OOS discipline required); default fills are instant, complete, and zero-slippage (must add a slippage model and treat combo fills as leg-level aggregates, not net-negotiated spreads); index universe is SPX/VIX/NDX only (no XSP); early-assignment default trigger logic unverified; paid seat prices UNKNOWN (verify before any paid commitment).

### Candidate 2 — ORATS (screening and reference layer)

**Why:** the best no-code complement. 300M+ precomputed backtests enable fast environment-matched screening (Trade Ideas/Backtest Finder) before committing research time. The most honest fill model of any no-code platform (VERIFIED). Per-leg trade-log export with entry delta and exit reasons (VERIFIED). 45 strategy templates over 5,000+ symbols with 15 years of EOD history. Permutation-test overfitting discipline on entry optimization. $99/mo, one-click cancel, 24-hour refund.

**Fit for the EV program:** use as the idea screen (which entry regimes × which structures merit full estimation) and as an independent reference for base rates; do not use as the estimator. The single most important open verification — whether custom-backtest trade logs include entry IV/market features — decides whether ORATS can feed the researcher's conditional-P/L pipeline directly or only via a $199/mo Data API join.

**Limitations to manage:** template-bound strategies (no arbitrary multi-leg, no custom managed policies beyond the exit menu); no native OOS/walk-forward; overlapped-position engine (one trade per qualifying day) does not match discrete-trade EV estimation without external log processing; rolling unsupported (2019 docs; current UNKNOWN); theoretical-edge methodology a black box; realistic stack $298–$398/mo if entry features require the Data API.

### Candidate 3 — tastytrade Lookback (free cross-validation; Option Alpha as paid fallback)

**Why:** zero marginal cost for the account the researcher already holds; true multi-leg historical backtester with customizable entry/exit management and per-trial outputs (VERIFIED). The cheapest possible independent cross-check of the Python framework's trade reconstruction.

**Fit for the EV program:** run identical strategies in Lookback and the Python framework; any divergence in trade lists or P/L is a defect in one of them. Do not rely on it until fill methodology and data resolution are verified hands-on (both UNKNOWN).

**If Lookback proves inadequate**, the paid fallback is **Option Alpha** (30-day free trial, ~$79/mo CLAIMED): 1-minute data to 2013, per-trade CSV export, unlimited paper trading, and the most transparent documentation of optimistic assumptions in the field — usable as a managed-policy cross-check on SPY/QQQ within its 5-ticker/45-DTE ceiling, with the midpoint-fill caveat priced in explicitly via slippage add-ons.

---

## 7. Specific Limitations That Would Invalidate Use for Empirical EV Research

Per-platform, stated as invalidation conditions — if the condition holds, the platform cannot serve the EV-estimation program as the estimator:

1. **Option Omega — INVALID as estimator:** (a) fills default to historical 1-minute quote *midpoints* (VERIFIED FAQ) — the exact optimistic assumption the research program forbids, and the researcher's own XSP audit showed midpoint assumptions flip the sign of results; (b) trade-log export contains no per-leg IV, delta, Greeks, or bid/ask (INFERRED absent) — conditional E[P/L | entry features] cannot be estimated from exports alone; (c) no walk-forward/OOS — optimizer sweeps are in-sample with a heuristic overfit score; (d) 12-ticker universe cannot run the diversified-portfolio study; (e) no programmatic access — the Python framework cannot consume it as a data source.
2. **ORATS — INVALID as estimator, VALID as screen/reference:** (a) "custom" means parameterizing 45 templates — arbitrary multi-leg structures and custom managed policies cannot be specified (VERIFIED); (b) entry-feature content of custom trade-log exports is UNKNOWN — if absent, conditional P/L regression requires a separate $199/mo Data API join; (c) no walk-forward/OOS harness; (d) the engine's one-trade-per-qualifying-day design produces overlapped books, not the discrete trades EV estimation needs, without external reprocessing.
3. **OptionNet Explorer — INVALID for research use:** manual, hand-priced model fills (INFERRED mid-like) with no fill discipline; no structured export (copy/paste only, VERIFIED); no automation, no OOS, no statistical reporting; manual replay is hindsight-vulnerable. Fails all four decisive criteria.
4. **Option Alpha — INVALID as estimator, VALID as managed-policy cross-check:** (a) mid-price guaranteed fills with no commissions and no assignment modeling (all VERIFIED) — optimistic on three axes simultaneously; (b) 5 tickers, ≤45 DTE (VERIFIED) — cannot serve the portfolio study or standard 30–60 DTE programs; (c) export schema undocumented and no native OOS; (d) its EV framework is HV-based BSM (VERIFIED) — neither implied Q nor calibrated P — and assumes put/call-side independence for condors.
5. **QuantConnect/LEAN — VALID with managed gaps:** invalid only if used naively — default zero slippage + instant complete fills must be configured (VERIFIED defaults); combo fills are leg-level bid/ask aggregates, not net complex-order negotiation (VERIFIED); no native walk-forward (manual IS/OOS discipline required); early-assignment default unverified (UNKNOWN — override with an explicit assignment model); index universe excludes XSP (VERIFIED).
6. **Backtrader — INVALID as a platform, VALID as scaffolding only:** zero native options semantics (VERIFIED); every decisive criterion is custom code; upstream dormant since 2023 and GPL-3.0 (VERIFIED). Given the researcher's existing custom framework, it adds nothing an honest options engine needs.
7. **Discovered alternatives:** OptionStrat (no historical backtesting — VERIFIED), Market Chameleon (aggregate screeners only, no per-trade export — VERIFIED), LiveVol (analytics, not a backtester — VERIFIED), EdgeRater (stock backtester — VERIFIED) are all invalid as EV estimators on current evidence.

---

## 8. Recommended Trial / Proof-of-Concept Evaluation

Ordered by cost (all $0) and information value. Each step has a falsification criterion — if it fails, the candidate is dropped.

1. **QuantConnect Free tier — honest-fill reconstruction test (2–3 days).** Re-implement one canonical strategy (e.g., SPY 45-DTE iron condor, 50% profit target, 21-DTE exit) in LEAN Python. Run three fill scenarios: natural take-liquidity (default), partial spread-improvement (combo limit), midpoint sensitivity. Export orders via `read_backtest_orders`; join entry features via QuantBook. **Falsification:** if LEAN's trade list diverges from the Python framework's on identical rules, debug both before trusting either. Success = reconciled trade lists and a quantified fill-assumption spread.
2. **ORATS — one month, $99 (24-hour refund safety net).** Run custom backtests on the condor universe; download the trade log and check the single most important open question: does it include entry IV and entry market features? Test the Strategy Optimizer's permutation-test discipline on one entry trigger. **Falsification:** if entry features are absent from exports and the Data API join is required, re-price the stack ($298–$398/mo) before continuing.
3. **tastytrade Lookback — $0, same week as (1).** Run the identical canonical strategy; compare trade lists and per-trial outputs against (1). Document its fill assumption from observed behavior. **Falsification:** if fills are midpoint-based or trade lists cannot be exported, demote to "not usable" and trial Option Alpha instead.
4. **Option Alpha — 30-day free trial (no card).** Backtest managed-policy variants (profit-target levels, DTE exits) on SPY/QQQ condors ≤45 DTE; export per-trade CSVs and check the column schema. **Falsification:** if the export lacks entry features or managed exits behave identically to hold-to-expiry, it adds nothing over the framework.
5. **Data validation — $0.** Pull HistoricalData.net's free 239 MB sample; validate the 34-column schema (bid/ask, IV, Greeks) and the vendor's quality claims against a ThetaData Free pull on overlapping dates/underlyings. **Falsification:** if bid/ask or Greeks columns fail validation, do not purchase; fall back to ThetaData Value one-month backfill (~$40).

Do not commit to any paid tier before steps 1–3 report. Total POC cost: $0–$99.

---

## 9. Buy / Build / Hybrid Recommendation

**Recommendation: HYBRID (C)** — commercial backtester for independent historical trade reconstruction + independent statistical analysis in the researcher's own framework.

**Why not (A) fully managed:** no managed platform survives the decisive criteria. The no-code field is midpoint-based (Option Omega, Option Alpha), template-bound (ORATS), narrow-universe (all three), or manual (OptionNet Explorer). Buying any one of them as the estimator means accepting midpoint fills — the assumption the researcher's own audit proved sign-flipping — or accepting template constraints that preclude the managed-policy comparisons the EV program needs. A managed platform can be a screen, a reference, or a cross-check; it cannot be the estimator.

**Why not (B) pure open-source + data alone:** it is viable — the researcher already owns a custom Python framework, and data costs $0–$590 one-time — but it leaves the two hardest parts (fill realism, management-policy mechanics) verified by nothing outside the researcher's own code. The XSP audit's central lesson is that execution assumptions decide results; an independent reconstruction engine is the cheapest insurance against self-deception. Backtrader specifically adds nothing here (zero options semantics, dormant, GPL-3.0) — the existing framework already exceeds it.

**The hybrid stack (concrete):**
- **Estimator (build, already owned):** the existing custom Python framework — conditional net-P/L regression/sorts, model-free expectation bounds, exposure decomposition (the three reusable methods from the prior-art report), OOS/walk-forward harness, tail metrics, pre-registered falsification criteria.
- **Independent reconstruction (buy/free):** QuantConnect/LEAN free tier — re-implement each studied strategy; reconcile trade lists and P/L against the framework; run the three execution scenarios (natural take-liquidity / partial improvement / midpoint sensitivity); use paper trading (paid tier, when warranted) for prospective validation.
- **Data (buy, cheap):** ThetaData Free ($0, already held) for recent EOD; one-month Value backfill (~$40) or HistoricalData.net $590 one-time for deep history with Greeks — validated against each other on overlap before any purchase.
- **Screen/reference (buy, optional):** ORATS $99/mo (cancellable) for environment-matched idea screening and base-rate priors; Market Chameleon or tastytrade Lookback ($0) as free secondary references.

**Approximate total cost:** $590 one-time (data) + $0/yr base; +$1,188/yr if ORATS screening is retained; +QuantConnect paid tier (price UNKNOWN — verify before commitment) only when paper trading or optimization compute is needed. Engineering time: days per strategy in LEAN (the researcher already writes Python backtests), not weeks — the options semantics LEAN provides natively (chains, expiry, assignment, combos) are exactly the code a Backtrader-based build would require.

---

## Final Question — Answered Directly

**Which existing platform offers the best combination of realistic multi-leg options backtesting, customizable management rules, exportable historical evidence, prospective paper trading, and cost efficiency for an individual quantitative researcher?**

**QuantConnect / LEAN.** It is the only reviewed platform that (a) fills at historical bid/ask rather than midpoint (VERIFIED), (b) models atomic multi-leg execution via combo orders (VERIFIED), (c) exports per-trade orders programmatically (VERIFIED), (d) supports arbitrary management policies with portfolio-level capital constraints (VERIFIED), (e) covers 4,000 optionable symbols at minute resolution from 2012 (VERIFIED), (f) offers prospective paper trading including tastytrade (VERIFIED), and (g) does the research tier at $0 (VERIFIED). Its gaps — no native walk-forward, management-as-code, default zero slippage, unverified early-assignment default — are manageable by a researcher who already writes Python backtests, and none of them is the midpoint assumption that disqualifies the no-code field. Pair it with the researcher's own Python framework as the EV estimator (hybrid approach C), feed both with $0–$590 data, and use ORATS ($99/mo, cancellable) as the screening/reference layer. That combination is the closest thing this market currently offers to an honest empirical expected-value research pipeline for multi-leg options.

---

## Appendix A — Key primary sources consulted

- Option Omega: https://optionomega.com/ · https://docs.optionomega.com/backtesting/backtest-setup.md · https://docs.optionomega.com/backtesting/backtesting-faq.md · https://docs.optionomega.com/backtesting/optimizer.md
- ORATS: https://ORATS.com/trading-tools · https://orats.com/backtester · https://orats.com/blog/answers-to-common-questions-backtesting · https://orats.com/docs/intraday-backtester-api · https://ORATS.com/university/backtesting-methodology · https://orats.com/strategy-optimizer
- OptionNet Explorer: https://www.optionnetexplorer.com/PaymentONEDISC_Trial_vks92oe92lj93msjwoqw9291k2l1m2k0.aspx · https://help.optionnetexplorer.com/documents_one_tour__chain.htm
- Option Alpha: https://Optionalpha.com/pricing · https://optionalpha.com/backtester · https://docs.optionalpha.com/tools/backtesting/best-practices.md · https://docs.optionalpha.com/technical-documentation/calculations/understanding-alpha-and-expected-value · https://OptionAlpha.com/blog/trade-ideas-expected-value-probability-and-performance
- QuantConnect: https://www.quantconnect.com/data/algoseek-us-equity-options · https://www.quantconnect.com/docs/v2/writing-algorithms/reality-modeling/trade-fills/supported-models/immediate-model · https://www.quantconnect.com/docs/v2/writing-algorithms/reality-modeling/options-models/exercise · https://www.quantconnect.com/pricing
- Backtrader: https://github.com/mementum/backtrader (GPL-3.0, dormant since 2023-04-19 — VERIFIED via GitHub API)
- Data vendors: https://www.thetadata.net/pricing · https://historicaldata.net/options.html · https://orats.com/data-api · https://massive.com/landing/options-data · https://www.IVolatility.com/data-download-intro/
- Per-platform evidence dossiers with full URL lists: `~/workspace/research_notes/options-backtesting-platforms-20261014/notes/`

## Appendix B — Open verifications (for follow-up, not assumed)

1. ORATS custom-backtest trade-log column schema (entry IV/features?) — needs one $99 month.
2. ORATS historical-bulk price structure ($99/mo vs $399/yr vs $399+$399 blog variant) — needs checkout page.
3. tastytrade Lookback fill methodology and data resolution — needs hands-on test.
4. Option Alpha paid-tier dollar price at primary source ($79/mo third-party CLAIMED).
5. QuantConnect paid seat prices (JS-rendered — needs live-browser pricing check).
6. Cboe DataShop Option EOD Summary standard price (cart-gated); Databento $/GB for OPRA (catalog-gated); iVolatility retail-tier Greeks inclusion.
