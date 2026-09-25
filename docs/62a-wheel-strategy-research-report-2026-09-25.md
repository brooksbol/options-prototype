# Wheel Strategy Research Report

**Date:** 2026-09-25  
**Provenance:** Muse research, preserved by Principal request  
**Checkpoint lineage:** immediate descendant of `2e36b808e81c3048d95cdebbbc5df093f98c79bd`  
**Status:** Research evidence / discovery input. Not ratified architecture, policy, implementation authority, or trading advice.

## Executive conclusion

A rule-governed Wheel program can be defined, but the evidence does not show that “discipline” alone makes it economically attractive.

The strongest defensible conclusion is **partly yes**: a historical decision can be judged against a predeclared Wheel rulebook, but there is no canonical Wheel rulebook and no direct evidence that rule-adhering Wheel traders outperform traders who override their own rules.

“I trade the Wheel” identifies a recognizable cycle, not a complete decision policy. The cycle is stable; strike, tenor, profit-taking, rolling, sizing, event rules, and restart conditions are not.

A past action is auditable only if the trader had, before the decision:
- a timestamped rule set;
- an admissible evidence set;
- an explicit exception policy.

Without those records, the label “Wheel” underdetermines the action.

## Four-part decision-quality framework

Keep these distinct:

1. **Methodology** — Was the rulebook coherent, investable, and suited to its claimed edge?
2. **Adherence** — Did the action follow the rule in force, using only then-available evidence?
3. **Execution** — Were fills, costs, sizing, and operational choices faithful to the rule?
4. **Outcome** — What happened afterward? Important, but not proof that the earlier decision was good.

The research found no Wheel-specific dataset that isolates adherence from methodology, execution, and outcome.

## The narrow assignment-centric core

The most defensible Wheel specimen is a fully cash-secured, assignment-accepting, covered-call cycle on an underlying the trader genuinely accepts owning:

1. **Qualify** — Select a liquid underlying the trader is willing to own; reserve enough cash for assignment.
2. **Sell put** — Open a cash-secured put under predeclared strike, tenor, size, and event rules.
3. **Accept assignment** — If exercised, take the shares. Assignment is a planned transition, not a failed trade.
4. **Sell calls** — Write covered calls against owned shares; repeat after expiry.
5. **Accept call-away** — If exercised, release the shares and restart the put phase under the same qualification rules.

### Boundary

Rolling a tested put to avoid assignment may be a coherent premium-selling system, but it contradicts the assignment-centric Wheel’s defining transition. It is a competing program, not a neutral management tweak.

## Fundamental vs configurable

### Fundamental
- Cash sufficient for assignment.
- Genuine, recorded willingness to own.
- Assignment is an accepted state transition.
- Calls are covered by owned shares.
- Call-away is an accepted disposition.
- Cycle restarts only after fresh qualification.

### Must be specified; not canonical
- Delta, percent-OTM, or technical strike rule.
- 21–45, 30–45, weekly, or other tenor.
- 50% profit target vs hold to expiry.
- 21-DTE exit vs assignment.
- Call strike relative to basis or delta.
- Rolling.
- Event pauses.
- Sizing.
- Concentration.

## Minimal ex-ante rulebook

A disciplined program needs explicit rules for:

- **Universe** — eligible underlyings, liquidity tests, concentration limits, disqualifying events.
- **Put entry** — strike method, expiration band, premium floor, position size, cash collateral.
- **Put management** — profit close, time exit, assignment, and whether any roll is allowed, with a precise trigger.
- **Stock state** — thesis-break criteria that may justify leaving the cycle; a price decline alone is not a new rule.
- **Call entry** — strike method, tenor, whether below-basis calls are allowed, accepted call-away economics.
- **Call management** — expiry, roll, assignment, dividend/event handling.
- **Restart** — immediate restart or fresh market/underlying qualification.
- **Exceptions** — what new evidence permits intervention, who records it, and what action is allowed.

## Competing Wheel rulebooks

There is no canonical Wheel authority. The name covers incompatible doctrines.

### Assignment-centric core
Parameters must be declared; expiry or assignment is allowed. Assignment is a required transition when exercised. Distinctive risk: stock exposure can accumulate after a decline.

### Freeman 2021
Reported practitioner doctrine: roughly 30–45 DTE; IV 30–50%; premium at least about 1% of stock price; close at 50% or 21 DTE; no margin; about 10% of portfolio. Assignment is accepted within the cycle. Thresholds are practitioner doctrine, not validated constants.

### Tastytrade-style
Typically around 45 DTE, ~30 delta, 50% profit, 21-DTE management, roll for credit. Assignment is often avoided by rolling. Much of the mechanics derive from premium-selling/strangle research rather than full-Wheel tests.

### Cost-basis-recovery lineage
Refuses calls below basis, rolls losers, and credits premiums against a running “breakeven.” Assignment is accepted, then defended. Main risk: cost-basis anchoring can trap capital and conceal unrealized economic loss.

### Origin
No named inventor or definitive first use was established. The earliest concrete named source found in this research was an Option Alpha episode from October 2017. Claims that Warren Buffett invented or named the Wheel were not supported.

## Discipline vs discretion

**Discipline is a control variable, not an edge.**

Consistency can:
- prevent silent rule changes after losses;
- keep sizing and collateral inside bounds;
- separate assignment from panic;
- preserve comparable records across cycles;
- make override frequency measurable.

Consistency cannot establish:
- that the Wheel has positive alpha;
- that a fixed rule is economically sound;
- that rolling improves expected return;
- that premium offsets poor stock selection;
- that one favorable outcome validates one decision.

### Likely departure pressures
- **Assignment aversion** — rolling because assignment now feels like a loss despite ex-ante willingness to own.
- **Cost-basis anchoring** — refusing an economically sensible call because the strike would crystallize a stock loss.
- **Endowment effect** — becoming attached to assigned shares and rolling calls to avoid letting them go.
- **Rescue accounting** — treating each new credit as if it repairs the old trade; a roll actually closes one position and opens another.

### Adversarial finding
A tastylive study cited by the report found fixed 1×–5× credit-loss management ineffective for short strangles. A rule can be followed perfectly and still be a bad rule.

## Evidence

The strongest data are proxies, not full-Wheel tests.

### Direct full-cycle evidence: sparse

A second-hand reported SPY Wheel backtest over 2007–2024 showed approximately:
- 21-DTE Wheel CAGR: 3.2%
- SPY CAGR: 8.0%
- Wheel Sharpe: about 1.02
- SPY Sharpe: about 0.62
- Wheel max drawdown: about -21.1%
- SPY max drawdown: about -55.2%

The same reported source attributed roughly 94–99% of total return in a 45-DTE SPY Wheel test to long-equity exposure rather than the premium-selling machinery.

These findings were not directly verified from the original source and must remain labeled second-hand.

A one-year KO 2020 comparison reported:
- regular Wheel: +$148;
- protected Wheel: +$153;
- buy-and-hold: +$1,016.

This is far too narrow for general inference.

### Strategy proxies

**Cboe PUT, 1986–2018**
- Compound return roughly 9.54% vs S&P 500 9.80%.
- Sharpe roughly 0.65 vs 0.49.
- Lower volatility, stronger risk-adjusted result, but negative skew around -2.09.

**Russell 2000 buy-write, 1996–2011**
- Reported return roughly 8.87% vs Russell 2000 8.11%.
- Max drawdown roughly -42.9% vs -52.9%.
- During the 2003–2007 bull segment it lagged the underlying.

**ORATS short-put analysis, 2007–2019**
- More than 4,500 trades across seven underlyings.
- Popular 45→21 DTE management was slightly worse in the cited analysis.
- Equal-weight diversification improved Sharpe versus the average single-underlying result.

These are component/proxy studies, not validation of the complete Wheel state machine.

### Behavioral evidence

**Barber & Odean**
- Highest-turnover households earned about 11.4% net annually versus 18.5% for the lowest-turnover group.
- Strong evidence against excessive/impulsive trading, but indirect for the Wheel.

**Bauer, Cosemans & Eichholtz**
- Roughly 68,000 accounts and 9 million option trades.
- Retail option losses exceeded equity losses, with poor timing and overreaction implicated.
- Relevant population, but not a test of systematic Wheel adherence.

## Evidence-strength ledger

- **Fixed-rule Wheel beats discretionary Wheel:** ABSENT — no direct adherence-vs-override dataset found.
- **Rolling beats assignment or exit:** ABSENT / WEAK — doctrine only; no controlled full-Wheel comparison.
- **21-DTE exits reduce tail loss:** MODERATE PROXY — premium-selling studies, with conflicting evidence.
- **Put-writing improved historical risk-adjusted return:** STRONG PROXY — long Cboe PUT history; not full Wheel.
- **Covered calls cushion drawdowns and cap upside:** STRONG PROXY — multiple index studies.
- **Full Wheel beats buy-and-hold:** WEAK / INCONCLUSIVE — direct backtests are sparse and uneven.

## Economics, risk, and regimes

Premium is compensation, not protection.

The historical put-write record is consistent with underwriting crash risk. Lower volatility and smaller drawdowns than equity do not mean small drawdowns in absolute terms.

Illustrative cited magnitudes:
- BXM 2008 loss: about -28.65%.
- S&P 500 2008 loss: about -37.00%.
- PUT worst drawdown in one reported 2006–2015 window: about -32.70%.

These are not identical measurement windows; they show magnitude, not a ranking.

### More favorable environments
- Flat or modestly rising markets.
- Choppy, fast mean-reversion.
- Implied volatility rich to realized volatility.

### Mixed environments
- Sharp fall followed by rapid recovery.
- Moderate declines where premium cushions loss.
- High volatility with intact underlying thesis.

### Less favorable environments
- Sustained downward momentum.
- Long bull runs that outrun covered calls.
- Single-stock impairment or insolvency.

### Underlying selection is not a detail

A cash-secured put can become stock ownership precisely after a decline. Assignment may increase exposure toward full equity delta when diversification is already deteriorating. Premium cannot reliably offset permanent impairment.

A valid rulebook should survive:
- the underlying going deeply underwater;
- call premiums becoming negligible at acceptable strikes;
- capital remaining tied up for years.

“I will roll until it comes back” is not a risk limit.

## Historical decision audit

Judge a decision without hindsight by freezing the information set first, comparing the action to the rulebook, and only afterward examining the outcome.

Required record:

- **Time** — timestamp and market session; no later evidence admitted.
- **State** — cash, short put, assigned shares, short call, or cycle closed.
- **Evidence** — price, option chain, liquidity, events, and thesis facts available then.
- **Rule version** — exact parameter set and exception policy in force.
- **Recommendation** — advance, wait, accept assignment, sell call, accept call-away, or leave the program because a predeclared invalidation fired.
- **Human action** — followed, deferred, or departed, with stated reason separately recorded.
- **Outcome** — observed later and never used to relabel the earlier decision.

### When discretion is principled

Discretion is compatible with rigor when the intervention channel was defined before the event. Illustrative triggers include fraud, delisting risk, failed ownership thesis, option-market dysfunction, or portfolio-constraint breach, but only if triggers and allowed responses were predeclared.

**A new fact can change the recommendation. A new feeling about an unchanged fact is a departure.**

The trigger list is illustrative governance language, not a universal Wheel rule.

## Adversarial findings

### Direct discipline evidence is missing
No study found compares otherwise-similar Wheel traders who follow a fixed rule set with traders who override it. The report supports auditability, not a causal return premium for discipline.

### Mechanical adherence can make exposure worse
Assignment after a decline can transform a low-delta short put into approximately full equity exposure. A rigid cycle can be anti-diversifying and trap capital in a deteriorating asset.

### Rolling has no demonstrated Wheel edge
A roll is a close plus a new trade. No controlled full-Wheel study found that rolling a loser beats accepting assignment or exiting. “For a credit” describes cash flow, not expected value.

### Premium may mostly price crash insurance
AQR frames volatility-risk-premium returns as compensation for underwriting sharp market losses. Broadie, Chernov & Johannes show dramatic put-return results can be consistent with jump risk rather than simple mispricing.

### Backtests are fragile
Common weaknesses include synthetic option prices, missing fills and costs, short samples, optimized parameters, survivorship bias, and coding mistakes.

### Benchmark construction can create apparent superiority
Israelov’s comparison attributed about 1.1% per year of the PUT–BXM gap to four hours per month of differing index exposure, showing how benchmark construction can masquerade as economic superiority.

## Open questions

- Does any predeclared discretionary override improve a full Wheel after costs and matched underlying exposure?
- Does rolling add value relative to assignment or exit when the new position is marked as a fresh trade?
- How much Wheel performance survives realistic fills, taxes, delistings, and a fixed survivorship-free universe?
- Can full-cycle results be decomposed into equity beta, volatility-risk premium, timing, and selection without residual ambiguity?

## Source map

Research completed 2026-09-25.

1. OptionsTradingIQ — Mark Freeman book review / Wheel rulebook — verified live; practitioner doctrine.
2. Option Alpha Podcast #107 — index; earliest concrete named use found, 2017-10-10.
3. QuantConnect / Melchin — verified live; automated SPY Wheel; incomplete period/cost detail.
4. OptionsTradingIQ protected Wheel — verified live; KO 2020 direct comparison.
5. Bondarenko 2019, Cboe PUT — index/proxy.
6. AQR, *Understanding the Volatility Risk Premium* — index/proxy.
7. Broadie, Chernov & Johannes 2007 — index/critique.
8. CAIA / Crawford buy-write study — index/proxy.
9. First Trust / Bloomberg year table — index/proxy.
10. Blom / ORATS management test — index/proxy.
11. Early Retirement Now, Options Series Part 12 — verified live/critique.
12. Barber & Odean 2000 — index/behavioral.
13. Bauer, Cosemans & Eichholtz — index/behavioral.
14. Heath, Huddart & Lang 1999 — index/behavioral.
15. Israelov, PutWrite vs BuyWrite — index/critique.
16. Cboe BXM methodology — index/methodology.

## Research-use boundary

Do not overread the record:
- direct Wheel backtests are few;
- several findings are reported second-hand;
- the strongest long histories test only one leg or a proxy construction;
- proxy evidence clarifies exposure and risk, but does not validate the full Wheel state machine;
- no direct evidence establishes that disciplined Wheel adherence outperforms override behavior.

## Relevance to Wheelwright discovery

This report is preserved as evidence, not as a ratified Wheelwright architecture decision.

It materially supports the following discovery questions without resolving them:
- how a named strategy family becomes a specific Operating Program;
- which parts of a program are invariant versus configurable;
- how a Portfolio Mandate may legitimately bias choices inside a program’s permitted configuration space;
- how a versioned deterministic rulebook can produce a by-the-book recommendation;
- how operator behavior can be recorded as FOLLOW / DEFER / DEPART without outcome hindsight;
- how methodology quality, adherence, execution quality, and outcome remain separate;
- when a configuration change remains the same Operating Program versus creating a distinct program.

The report does **not** authorize implementation, broker submission, a new architecture record, or a new program identity.
