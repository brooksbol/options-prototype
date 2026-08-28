# Academic Research Register

> **Status:** Exploratory research reference. Not policy. Not architecture. Not implementation authorization.
>
> **Purpose:** Durable index of academic and institutional research reviewed for Wheelwright. Each entry records what the source actually establishes, its methodological weaknesses, and what—if anything—should be carried forward into Wheelwright research. The register is intentionally evidence-first: papers may motivate questions and evidence requirements, but do not become policy by citation.

## Research posture

Wheelwright is not looking for papers merely to validate a preferred strategy. The useful questions are:

1. What does the paper establish with reasonable evidence?
2. What is weak, confounded, stale, or inapplicable?
3. What maps to Wheelwright's actual mission, supported entry mechanisms, and ETF-heavy universe?
4. What observation would Wheelwright need to retain to test the finding against its own operation?
5. Does the paper reveal a new success mode, failure boundary, or empirical question?

A recurring distinction is important:

> **Market compensation is not automatically opportunity quality.**

Wheelwright's research task is to learn when offered compensation is attractive *to this portfolio* for the risk, constraint, execution burden, and resulting capital state accepted.

---

## Goldman Sachs Options Research — *The Art of Put Selling: A 10 Year Study* (2013)

**Evidence strength:** High for the questions tested; institutional study rather than peer-reviewed academic paper.

**Scope:** Monthly put selling on optionable S&P 500 constituents, January 2003–January 2013, including strike-selection methods, fundamentals, maturity, weighting, volatility risk premium, transaction costs, and put/covered-call equivalence.

**What is strong**

- Broad constituent-level test rather than a hand-picked small universe.
- Uses actual historical S&P 500 membership/weights at trade inception.
- Models executable economics more conservatively than midpoint-only backtests by selling at bid.
- Separates contract selection from portfolio weighting.
- Finds no universal strike-selection rule; delta is a tradeoff coordinate rather than an intrinsic edge.
- Provides direct evidence that implied volatility generally exceeded subsequent realized volatility in the sample.
- Finds high free-cash-flow yield to be the strongest fundamental selection variable tested for individual-stock put selling.

**What is weak / bounded**

- Ten-year sample is short for tail-risk strategies and excludes several important later regimes.
- The strongest FCF result is in-sample and vulnerable to multiple-testing/data-mining concerns.
- Factor portfolios differ in weighting from the baseline, complicating comparisons.
- Corporate FCF yield is not directly portable to ETF underwriting.
- The tested lifecycle is monthly sell-and-expire/rebalance, not Wheelwright's full 7–45 DTE surface or actual CSP/buy-write lifecycle.

**Wheelwright relevance**

Primary external evidence behind the current entry-mechanism compensation finding:

> Successful governed entry requires adequate compensation for the accepted risk/constraint, an acceptable resulting capital state, and honest evidence about what was actually known and offered.

Goldman strongly supports treating premium as compensation for an obligation rather than as free production. It also supports separating candidate quality from portfolio sizing and concentration.

**Evidence-plane implications**

Retain enough contemporaneous evidence to test later: premium, delta, DTE, moneyness, IV, spread/liquidity, underlying price, execution, assignment/resolution, capital commitment duration, and lifecycle consequence. Preserve evaluated failures as well as selected opportunities.

---

## Francesco Carlier — *A Simple Options Trading Strategy based on Technical Indicators* (2021)

**Evidence strength:** Low.

**Scope:** Apple, SPY, and Walmart; 2005–2013; four-day slightly OTM put/call credit spreads triggered by SMA(50) and Bollinger Bands; several capital-allocation schemes.

**What is useful**

- Makes the effect of position sizing and compounding highly visible.
- Observes materially worse outcomes during high-volatility periods despite richer nominal option economics.
- Provides a useful counterexample in which a defined-risk strategy can have attractive production statistics while adverse outcomes simply consume allocated capital.

**What is weak**

- Only three underlyings and a small number of trades.
- Strongly prediction-dependent technical-analysis premise, contrary to Wheelwright's policy-over-prediction posture.
- Uses Black-Scholes/model-derived option prices rather than executable historical quotes.
- Omits commissions and bid-ask costs.
- Extremely high reported leveraged returns are largely an artifact of defined-risk leverage and compounding assumptions.

**Wheelwright relevance**

Secondary evidence only. The strongest conceptual contribution is:

> **Defined maximum loss is not the same thing as an acceptable capital consequence.**

A bounded spread loss can permanently consume productive capital, whereas CSP assignment or a buy-write lifecycle can transform capital into another productive asset state. This distinction is relevant to future strategy-expansion governance.

---

## de Silva, So & Smith — *Losing is Optional: Retail Option Trading and Expected Announcement Volatility* (2025 working paper)

**Evidence strength:** High for retail behavior around single-stock earnings announcements.

**Scope:** Nasdaq/PHLX option-flow data, 2010–2021, 32,758 quarterly earnings announcements, with clientele classification and OptionMetrics/CRSP/Compustat data.

**What is strong**

- Large event sample with actual trader-clientele classifications.
- Separates expected announcement volatility from retail demand pressure.
- Shows that retail option buying rises sharply before high expected-announcement-volatility earnings events.
- Finds market makers largely absorb this demand and bear unhedgeable jump/inventory risk.
- Finds option prices become unusually rich around the highest retail-demand/high-EAV events.
- Shows long-option retail losses are driven by overpayment relative to realized volatility, large bid-ask spreads, and slow post-event exit.
- Retail short option positions perform positively on average in the reported return decomposition, while long positions perform negatively.

**What is weak / bounded**

- The core phenomenon is single-stock earnings-event risk, not ETF options.
- Market-maker short exposure is not equivalent to fully collateralized retail CSP or buy-write exposure.
- Some P&L construction requires assumptions because the dataset covers only part of the options market and does not observe outside wealth/collateral.
- Evidence of expensive options around earnings does not imply that a Wheelwright seller should automatically cross earnings; the compensation exists because jump risk is genuinely difficult to hedge.

**Wheelwright relevance**

Strong evidence for the proposition that **option prices can contain a demand-driven compensation component**, not merely a forecast of future realized volatility. It also demonstrates why event state and execution friction are part of the bargain.

For any future individual-stock expansion, earnings proximity should be retained as a first-class contemporaneous fact. More generally, Wheelwright should be able to distinguish compensation arising from ordinary volatility risk from compensation arising from discrete event/jump risk.

---

## Khomyn, Putniņš & Zoican — *The Value of ETF Liquidity* (Review of Financial Studies, 2024)

**Evidence strength:** High for ETF secondary-market liquidity/clientele economics.

**Scope:** Model plus empirical analysis of U.S.-domiciled passive, unlevered, non-inverse equity ETFs tracking identical or very similar indexes. Main empirical sample 2016–2020; 105 competing ETFs representing about $1.71T AUM and $45.24B average daily secondary-market dollar volume.

**What is strong**

- Compares same-index or near-identical-index ETFs, creating unusually clean economic comparisons.
- Uses multiple liquidity measures: quoted, effective, and realized spreads, volume, and turnover.
- Controls for tracking error, performance drag, security-lending income, marketing/name recognition, structure, taxes, AUM, and other competing explanations.
- Finds a clear clientele mechanism: short-horizon/high-turnover investors choose more liquid ETFs despite higher management fees.
- Finds strong network effects: liquidity attracts high-turnover users, whose trading sustains liquidity ("liquidity begets liquidity").
- Robustly documents economically large differences among otherwise similar ETFs: more liquid competitors charge higher fees, have tighter spreads, larger market share, and dramatically more volume.

**What is weak / bounded**

- The main empirical window is only 2016–2020 and includes only plain-vanilla passive U.S. equity ETFs.
- The study is about ETF-share secondary-market liquidity and issuer economics, not option-chain liquidity directly.
- Same-index comparisons do not prove that ETF-share liquidity maps one-for-one into option liquidity, IV quality, or premium production.
- The theoretical mechanism simplifies authorized-participant behavior and several real-world market microstructure details.

**Wheelwright relevance**

Very high for universe governance and execution, despite not being an options paper.

The paper establishes that **ETF wrapper choice is economically meaningful even when underlying exposure is essentially identical**. For a short-horizon options-income operator, recurring trading friction can rationally dominate small annual expense-ratio differences. SPY versus lower-fee S&P 500 peers is the canonical example.

This suggests Wheelwright should not treat an ETF merely as an exposure label. The tradable instrument itself has a liquidity/clientele history that can matter to:

- option-chain depth and continuity;
- underlying-share execution during buy-writes and assignment/call-away lifecycle;
- evidence reliability during fast markets;
- transaction-cost burden relative to capital velocity;
- choice among economically substitutable ETFs.

**Research question created**

> When Wheelwright has multiple ETFs expressing substantially the same exposure, does the higher-liquidity wrapper produce sufficiently better option and lifecycle economics to dominate a lower-fee substitute for the system's actual holding horizon and turnover?

This is an empirical question, not an authorization to prefer incumbents or SPY automatically.

**Evidence-plane implications**

Potentially retain, where obtainable and policy-neutral: ETF share spread, dollar volume, turnover, AUM, age/inception, benchmark identity, and same-exposure/substitute relationships alongside option-surface liquidity. Later analysis can test whether wrapper-level liquidity explains option execution quality or production.

---

## Poterba & Shoven — *Exchange-Traded Funds: A New Investment Option for Taxable Investors* (AEA Papers and Proceedings, 2002)

**Evidence strength:** Good historical institutional/economic evidence; old and narrow by modern ETF standards.

**Scope:** Early ETF mechanics and a comparison of SPY with Vanguard Index 500 over the 1994–2000 period, emphasizing pre-tax return, after-tax return, tracking, transaction costs, and in-kind redemption.

**What is strong**

- Clean same-exposure comparison between SPY and a traditional S&P 500 index fund.
- Separates expense ratio, tracking difference, bid-ask cost, and tax consequences rather than collapsing them into one return number.
- Clearly explains the ETF creation/redemption mechanism and why ETF market prices can differ from NAV while arbitrage constrains the difference.
- Identifies investor horizon as economically important: frequent/large traders may rationally value ETF intraday liquidity, while small low-turnover investors may prefer traditional funds.
- Explains redemption-in-kind as a mechanism by which ETFs can remove low-basis securities and reduce taxable capital-gain distributions.

**What is weak / bounded**

- Extremely early ETF era: 1994–2000 performance and 2001 market structure are not representative of the modern ETF ecosystem.
- Focuses principally on SPY versus one Vanguard mutual fund, not cross-sectional ETF selection.
- Commission structures, spreads, creation/redemption technology, tax law, ETF structures, and competitive fees have changed materially.
- The paper is primarily about taxable buy-and-hold vehicle choice, not options-income production.

**Wheelwright relevance**

Moderate but foundational for understanding the *instrument* on which Wheelwright operates.

Two ideas carry forward strongly:

1. **Holding horizon changes which cost matters.** A one-time spread matters much more to a high-turnover strategy than to a long-term holder; annual fund fees matter in the opposite direction.
2. **ETF wrapper mechanics create economic effects separate from the underlying index.** Tracking difference, dividend handling, market-price/NAV divergence, tax mechanics, and transaction cost can make two vehicles with nearly identical exposure non-identical for Wheelwright.

The paper also forms an interesting historical precursor to Khomyn, Putniņš & Zoican (2024). Poterba/Shoven hypothesized that ETFs would segment investors by liquidity need and turnover. Two decades later, Khomyn et al. document exactly such liquidity clienteles empirically among competing ETFs.

**Wheelwright implication**

For CSP and buy-write entry, exposure identity and wrapper identity should remain distinct concepts. An ETF may be acceptable fundamentally as exposure while still being inferior operationally because of its executable market, option surface, tax/lifecycle behavior, or wrapper mechanics.

---

## Cross-paper findings currently worth carrying forward

### 1. Risk transfer can be rational on both sides

Goldman and the retail-announcement paper both support a market in which buyers rationally or behaviorally pay others to hold difficult risks. Wheelwright does not need the options market to be globally inefficient. It needs compensation that is attractive for the specific risks and capital states this portfolio can absorb.

### 2. Compensation must survive execution

Goldman, Carlier's weaknesses, the retail-announcement paper, and the ETF-liquidity literature all point toward the same constraint: quoted or modeled economics are not sufficient. Spread, fill quality, liquidity, and timing can consume apparent production.

### 3. Capital consequence matters independently from max loss

CSP assignment, buy-write ownership/call-away, and defined-risk spread loss have materially different capital-state transitions. Strategy admission should reason about what capital becomes after an adverse outcome, not merely the scalar maximum loss.

### 4. The ETF wrapper is part of the opportunity

The ETF-liquidity papers show that two instruments with substantially identical underlying exposure can have different secondary-market liquidity, trading costs, clientele, tax behavior, and wrapper mechanics. Wheelwright should preserve the distinction between **exposure** and **instrument**.

### 5. Holding horizon and capital velocity change the relevant cost function

For a long-term investor, a small recurring expense-ratio difference can dominate. For a high-turnover operator, one-time/round-trip spreads and execution friction can dominate. Wheelwright's objective is therefore not "lowest fee ETF" or "highest premium option," but total economics over the actual lifecycle.

### 6. Point-in-time evidence remains mandatory

Any relationship learned later must be reconstructible from facts actually observable when the decision could have been made. Historical databases that silently insert later-known data create false knowledge.

---

## Open research questions

- Does ETF-share liquidity predict option-chain liquidity after controlling for underlying exposure and option demand?
- Among same- or near-same-exposure ETFs, does the liquid incumbent produce higher *net* Wheelwright production after spreads, fill quality, collateral/capital velocity, and lifecycle resolution?
- Is buy-write's currently observed production advantage over CSP explained partly by wrapper/underlying liquidity and immediate-share execution economics?
- How should Wheelwright decompose compensation into ordinary variance risk, skew/downside-insurance demand, discrete jump/event risk, liquidity compensation, and other observable burdens without constructing an opaque composite score?
- Which contemporaneous facts are cheap to retain now but impossible to reconstruct later?
- Can Wheelwright measure an opportunity's realized economic productivity without mistaking premium collected for return or ignoring the capital state produced by resolution?

---

## Governance

This register is **research memory**, not recommendation authority.

A paper can:

- create a hypothesis;
- identify an observation worth retaining;
- expose a confounder or failure boundary;
- suggest an empirical comparison;
- strengthen or weaken an existing conceptual model.

A paper cannot, by itself:

- establish a Wheelwright delta or DTE target;
- admit a new strategy;
- change universe membership policy;
- create a composite score;
- override production evidence;
- authorize implementation.

The intended sequence remains:

> **baseline → retain → accumulate → analyze → govern**
