# EVA-001 — Conversation Recovery and Hypothesis Evolution (October 2026)

**Status:** Conversation evidence captured for durability, NOT ratification or implementation authorization. This supplements [draft protocol](PROTOCOL.md), [Codex round-one verification](ROUND-1-VERIFICATION.md), and [round-two verification](ROUND-2-VERIFICATION.md). Original full Muse reports were supplied in chat; this document captures their substantive claims and corrections, not a verbatim reproduction. No backtest, purchase, production change or trade is authorized by this record.

## Principal's objectives (NOT in priority order)

1. More profit.
2. Less risk.
3. Avoid being “Nostradamus”: calibrated statistical forecasts and probabilities are welcome; unsupported “feeling bullish today” predictions are not.
4. Learn options.
5. Build cool stuff.
6. Smoother, more reliable trading experience.

The Principal accepts falsification and abandoning EVA if uneconomic; measured reliability takes time. A prospective paper-traded control group is important; a little real capital may be spent on carefully bounded experiments, but no amount or trade is authorized.

## How the hypothesis evolved

- A probability-options video prompted the distinction between POP, P50, and expected value. A high win rate and a payoff graph do not establish positive expectancy; POP times maximum win plus complementary probability times maximum loss ignores intermediate payoffs.
- TT Live position attention, absent/unfilled exit orders, and conditional upside recapture (covered call plus *triggered*, same-strike later-dated long call) were discussed. These are separate position-management concerns, not EVA-001 scope.
- Initial formula EV = integral of payoff times density was corrected: specify horizon, physical P versus risk-neutral Q, total-since-entry versus incremental holding economics, costs, dividends, American exercise and path-dependent management.
- TT Live's existing “P50” means a **50% credit-capture target**, NOT a modeled probability of hitting that target.
- MIPD (Market-Implied Probability Distribution) was proposed as an optional Q extraction/valuation-consistency research capability. Risk-neutral valuation alone does not establish trading edge. Physical-P expectancy, risk compensation, alpha and tail consequences are separate quantities.
- **EVA (Expected Value Analysis)** remains a *proposed research direction*, not an accepted v2 component. A full distribution is not required for direct conditional mean P/L, nor for direct quantile estimation. Forecast quality, economic selection value and tail-risk accuracy need independent tests.
- The Principal favors **entry selection first** because current position management is relatively mature. EVA-001 asks about entry information predicting outcomes under a fixed management policy; HOLD/CLOSE/ROLL/HEDGE at lifecycle checkpoints is a different, uncommissioned study.
- The operational baseline must include the **real premium-ranked, eligibility-filtered selection workflow**, not a weak straw man. Evaluate forecasts on identical candidate sets and portfolio outcomes for simultaneous paper-traded control/treatment groups. Freeze forecasts before outcomes. WAIT is a legitimate candidate action.
- The hurricane-model analogy (American vs European models) motivates calibrated, competing forecasts and explicit model disagreement; no “magic number” or unwarranted model ensemble. Forecasting is acceptable; directional intuition is not.
- Historical research plus forward paper trading plus small real-money execution observations are complementary. Real fills can calibrate simulation assumptions, not prove EVA forecast skill from a few trades.

## Current and proposed experimental specimens — keep authority separate

**Current Codex draft protocol 0.2**: SPY 30–60 DTE single-expiration four-leg iron condors, experimental 50% opening-credit capture or 21-DTE exit, RV-only/IV-only/IV−RV and historical baselines, quoted-side and delay execution scenarios. [Protocol](PROTOCOL.md). This is a draft, not a ratified management policy.

**Later conversation preference (NOT reconciled into protocol)**: begin with a defined-risk **two-leg credit vertical**, put side first as a research candidate, on **SPX** if capital sizing, execution and historical data work; compare SPY and XSP. Rationale: two rather than four legs, European cash-settled SPX avoids early assignment/stock delivery, liquid markets may improve simulated-real fill correspondence. SPX is about 10× SPY/XSP notional; for defined-risk spreads compare actual dollar max loss, contract granularity, buying power, AM/PM settlement, spread widths, fees and *complex-order fills*, not notional alone. SPX retail 30–60 DTE execution calibration remains unresolved. Covered calls and CSPs are not the immediate experimental target. Condors may follow vertical validation, not be silently dropped.

## Muse research 1 — prior art / competitive landscape (relayed Oct 15)

Muse located established Q/P theory, volatility risk premium, conditional option returns, Q→P transformation, stochastic-dominance and dynamic-portfolio methods. Candidate sources: Coval–Shumway (2001), Goyal–Saretto (2009, 2025), Bakshi–Kapadia (2003), Carr–Wu (2009), Bollerslev–Tauchen–Zhou (2009), Broadie–Chernov–Johannes (2009), Aït-Sahalia–Lo (1998/2000), Bliss–Panigirtzoglou (2004), Constantinides et al., Liu–Pan (2003), Brandt–Santa-Clara–Valkanov (2009), Israelov–Nielsen covered-call attribution.

Commercial leads: Option Alpha entry EV/expiration calibration, ORATS theoretical-edge/backtesting, tastytrade fixed-rule management research, OptionStrat, OptionNet Explorer, Market Chameleon, and open-source ollie1o1/options realized-vol pricing proxy. Muse found no public integrated live HOLD/CLOSE/ROLL/HEDGE physical-EV system; **non-discovery does not prove novelty, nonexistence or commercial failure**. Muse's speculation about institutional secrecy is not verified. AllianzGI enforcement is a tail-risk caution, not a controlled test of EVA.

**Codex round-one corrections (direct source checks):**
- Goyal–Saretto 2025: 16 strategies retained statistically significant **net returns** under the modeled cost case while all **net IPCA alphas** were negative; population ~25-DTE delta-hedged common-stock options, not managed ETF condors. Do not say all profitable strategies died. [Paper](https://academic.oup.com/rfs/article/38/6/1783/8010873).
- Option Alpha's ~130k-idea study compared predictions with subsequently observed expiration outcomes, **empirical** rather than mere repricing identity; not after-cost, managed-trade proof. [Vendor study](https://optionalpha.com/blog/trade-ideas-expected-value-probability-and-performance).
- Muse's Q→P power-utility sign was **wrong**. Under the cited CRRA assumptions, p(s)=q(s)s^(+gamma)/E_Q[S^(+gamma)], not the negative exponent. [Chicago Fed paper](https://www.chicagofed.org/~/media/publications/working-papers/2001/wp2001-15r3-pdf.pdf).
- Abstract/index citations do not certify unread formulas/tables; expected utility is not automatically alpha; RV−IV is a candidate baseline, not the only working signal.

## Muse research 2 — empirical methodology (relayed Oct 15)

Muse proposed direct conditional option-P/L estimation via historical sorts/regression without a full physical density. Research leads: Goyal–Saretto RV−IV, Cao–Han idiosyncratic vol, Boyer–Vorkink skew, Muravyev order flow, Santa-Clara–Saretto margin/costs, Broadie et al. sampling/peso risk, Figlewski frictions, Muravyev–Pearson trading costs, Martin SVIX equity-premium bound, Constantinides stochastic-dominance, Israelov–Nielsen exposure attribution. Simple baselines: historical average, **RV-only**, IV−RV, limited regressions. Forecast and economic utility must be tested separately; mean improvement cannot certify tail protection. Periodic target observation and continuously working profit-order fills are not equivalent. Muse recommended SPX single-leg first, then verticals; reported no peer-reviewed condor literature; proposed cost discounts and universal falsifiers.

**Codex round-two corrections:**
- Universal “no peer-reviewed condor research” **false**: Niblock, *Flight of the condors* (2017), peer-reviewed Australian equity condor study. [University record](https://researchportal.scu.edu.au/esploro/outputs/journalArticle/Flight-of-the-condors-evidence-on/991012820796302368). [2025 stopping preprint](https://arxiv.org/abs/2501.12397) is only a lead.
- SPX European exercise helps, but doesn't resolve access, AM/PM settlement, capital or retail execution costs. Do not auto-switch the protocol.
- Muravyev–Pearson does **not** justify a universal 25–60% quoted-spread discount for our packages. [Publisher abstract](https://academic.oup.com/rfs/article-abstract/33/11/4973/5732665).
- Martin SVIX is an **underlying equity-premium bound** requiring the negative-correlation condition, not an assumption-free managed option P/L estimator. [Paper](https://personal.lse.ac.uk/martiniw/WIER.pdf).
- Negative average strategy P/L doesn't falsify forecast skill; arbitrary <5-tail-events and ±2%-vol thresholds aren't universal. Quantiles can be estimated without a full density. Fama–MacBeth option-return studies do not validate managed dollar-P/L regressions by themselves.
- Codex amended draft protocol 0.2 to include an RV-only baseline on matched observations. No model fitting/backtest followed.

## Data feasibility and platform questions

Codex audit: retained ThetaData files have IWM underlying EOD and RVX history, **not historical option-price paths**; archived Tradier SPY chains are point-in-time, not exit trajectories; Theta Terminal not listening and options-history entitlement unverified. Actual synchronized historical entry/exit quotes are the next gating empirical observation.

Principal judged tastytrade's backtester poor. A **sanitized Muse-only platform survey** was prepared: check genuine paper trading versus API sandbox versus backtest at tastytrade, Tradier, IBKR, thinkorswim; evaluate ORATS, Option Omega, QuantConnect, OptionNet Explorer, Option Alpha and alternatives. Require SPX/SPY/XSP support, two-leg verticals, simulated versus actual fills, realistic complex-order pricing, **broker-specific commissions and exchange/regulatory/SPX fees**, gross/net P/L, timestamps, exportable trades, fixed target and 21-DTE management, parallel portfolios, prices and trials. No subscription/purchase authorized. Do not disclose project identity or private infrastructure to Muse.

**Build/adopt principle:** Own strategic economic semantics, policy, evidence interpretation and validation; survey/adopt mature commodity data, mathematical libraries and simulation infrastructure when suitable. A thin bespoke experiment may optimize learning but should not automatically become permanent infrastructure. [Closed-Loop Engineering](../../foundations/closed-loop-engineering.md), [Principles](../../principles.md).

## Authorization and preservation boundary

This is a historical **conversation record**, not a new policy or a silent rewrite of [PROTOCOL.md](PROTOCOL.md). EVA research may conclude PROCEED, NARROW or REJECT. No historical options panel, paper-trade experiment, live experimental trade, model fitting, platform purchase or production implementation is established. Actor boundaries: Muse = research only (sanitized prompts); Codex = independent source/technical verification; Kiro = architecture/governance; Principal = decisions.
