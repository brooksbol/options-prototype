# 2026-09-29 conversation record — XSP defined-risk strategy, tastytrade, and Sosnoff review

**Status:** Session provenance / research record. Non-authoritative.  
**Repository:** `brooksbol/options-prototype`  
**Pre-persistence SYNC:** `8bc41aeb6c4b89e84cfa4b5690ae6cacea54e0a5`  
**Canonical strategy-intake home:** existing `PL-STRAT-01` research thread; this record does not create or ratify a new strategy.  
**Source artifacts preserved alongside this record:**
- [github-url.md](./github-url.md)
- [kiro-op-model.md](./kiro-op-model.md)

## Fidelity note on completeness

The Principal explicitly asked to persist the **entire conversation, including provided artifacts**.

At persistence time, part of the earlier chat had already been compacted by the conversation runtime. A byte-for-byte export of those already-compacted turns was not available to the assistant. This record therefore preserves:

1. the complete structured session state available at persistence time for those earlier turns;
2. the exact or near-verbatim user/assistant exchanges still present in active context;
3. the full durable conclusions and research questions produced by the two Codex reviews;
4. the two uploaded source artifacts, preserved separately without reinterpretation.

No missing earlier wording is fabricated.

---

# A. Structured record of the earlier compacted conversation

## A1. Why tastytrade entered the discussion

The Principal is evaluating tastytrade as an alternative/complement to Fidelity for options trading, especially for defined-risk XSP put credit spreads. Fidelity Tier 2 access had been denied / remained constrained, preventing straightforward use of vertical spreads. The Principal prefers Fidelity where possible but wants a venue that supports the intended structures cleanly.

tastytrade appeared substantially more strategy-native than Fidelity. Screenshots and discussion covered:

- strategy construction menus such as Vertical, Calendar, Butterfly, Ratio Spread, Strangle, Straddle, Iron Condor, and Jade Lizard;
- an Advanced Strategy interface exposing DTE, target OTM %, strike width / max risk, and other strategy-oriented controls;
- order time-in-force choices Day / GTC / GTD;
- platform settings including:
  - Default option order quantity 1;
  - option quantity increment 1;
  - option maximum quantity Unlimited;
  - DEFAULT CLOSE AT PROFIT % = 50;
  - DEFAULT OPTION BRACKET ORDER PROFIT % = 50;
  - DEFAULT OPTION BRACKET ORDER STOP LOSS % = 25;
  - default options session Regular Hours;
  - default order type Limit;
  - default bracket order TIF GTC.

The discussion explicitly rejected the idea that GTD could implement the 21-DTE exit. GTD cancels a working order at a specified date; it does not initiate a close. The emerging lifecycle split became:

- broker: hold a GTC profit-taking close around 50% of opening credit;
- Wheelwright/operator/API automation: own the mandatory 21-DTE time exit.

The Principal had selected **The Works** during tastytrade registration. Account approval emails were found, but the exact approved options tier had not been independently located. The account could construct an XSP vertical and reach order confirmation while showing insufficient buying power, which was encouraging but not treated as proof of the actual tier. Basic or The Works would be sufficient for defined-risk spreads; Limited would not.

## A2. Canonical XSP research strategy under discussion

The proposed strategy was deliberately **not delta-selected**. The Principal corrected an earlier attempt to frame it by delta.

Canonical research rule under discussion:

- underlying: XSP;
- enter around 45 DTE;
- choose the short put whose premium is closest to **$5**;
- buy the put exactly **20 index points lower**;
- close at **50% of opening credit**;
- if still open, force close at **21 DTE**;
- deploy mechanically, potentially every trading day because XSP has frequent expirations;
- avoid discretionary directional forecasting.

Illustrative live examples discussed:

1. XSP 757/737 put vertical, 20 points wide, about $3.17 credit:
   - gross width: $2,000;
   - max loss about $1,683.

2. XSP 730/710 put vertical, 20 points wide, about $1.88 credit:
   - credit: about $188;
   - max loss / BPR about $1,812–$1,814;
   - 50% target profit: about $94.

The discussion emphasized that defined-risk spread BPR is approximately the contractual maximum loss; margin does not simply halve that requirement the way stock margin intuition might suggest.

## A3. Capacity arithmetic and the unresolved economics

Trading capital discussed: about **$92,000** currently, with another **$100,000** potentially added to the taxable account in January, for a hypothetical future balance around **$192,000**.

At the illustrative $1,812 BPR:

- one spread/day and a 45→21 DTE maximum residence implies roughly 16–18 trading-day cohorts, not 21 full trading days;
- a useful central illustration was about 17 concurrent spreads at one/day, about $30.8k BPR;
- two/day implied roughly 34 concurrent spreads, about $61.6k BPR;
- three/day would approach/full-consume the current $92k and was not treated as sensible;
- absolute broker/BPR capacity was explicitly distinguished from acceptable portfolio risk.

The gross-production arithmetic was also separated from expected return:

- $188 opening credit is not profit;
- 50% target on that credit is about $94;
- 21 monthly entries × $94 = about $1,974 theoretical target capture if every trade reaches target;
- 42 monthly entries at two/day × $94 = about $3,948 theoretical target capture;
- forced 21-DTE exits can be losses and may dominate the economics.

The central empirical question became:

> How many ordinary ~$94 winners does one losing forced 21-DTE exit erase?

At full max loss, about $1,812 / $94 ≈ **19.3** target winners.

A Muse assignment was prepared to backtest the **exact** rule using real historical XSP options data, realistic fills/slippage/fees, and no silent SPX/SPY substitution. Requested outputs included:

- target-hit rate;
- forced-exit rate;
- days held;
- average/median P&L;
- forced-exit loss distribution;
- largest loss;
- profit factor;
- net P&L;
- monthly distribution;
- drawdown;
- concurrent positions;
- capital utilization;
- one/day vs two/day;
- clustered losses in broad selloffs;
- winners erased per losing forced exit;
- fraction of gross target profits consumed by forced exits.

## A4. Why Tom Sosnoff’s “11 Boring Strategies” video mattered

The Principal’s reason for asking for the transcript was not simply to list the 11 strategy names. The interest was in Tom’s **commentary**: which structures he actually favors, how frequently he uses them, what portfolio problem each solves, and what he says to expect.

The video identified:

1. short puts;
2. jade lizards;
3. covered calls;
4. short put spreads;
5. put ratio spreads;
6. short call spreads;
7. broken-wing butterflies;
8. unbalanced iron condors;
9. iron condors;
10. short strangles;
11. price reversion / pairs / volatility-related trading.

The transcript-derived working interpretation before Codex review was:

- short puts: Tom’s favorite/go-to bullish default;
- jade lizards: another frequent bullish tool;
- covered calls: used, but less dominant;
- short put spreads: defined-risk, capital-efficient, but Tom characterizes them as lower reward and says he prefers naked puts;
- put ratio spreads: frequent, high-POP but can retain undefined tail risk;
- short call spreads: especially interesting because Tom reportedly uses them heavily to reduce long delta while retaining defined risk;
- broken-wing butterflies: liked on the upside around earnings/runaway names;
- unbalanced iron condors: defined-risk, short-premium, deliberately negative-delta;
- iron condors: more conditional / high-IV engagement structure;
- short strangles: strongest personal endorsement, but undefined risk;
- pairs/contrarian IV: potentially more factor-distinct, but discretionary and harder to mechanize.

A crucial nuance in the “70%” section was that Tom’s closing comments appeared to group **short strangles plus broader subjective/contrarian implied-volatility trading**, not simply two named mechanical structures.

## A5. The first Codex strategy review

A Codex prompt asked for an adversarial review of the proposed XSP engine against repository authority and asked, among other things, whether a defined-risk call-spread sleeve might complement the put engine.

Codex returned a provisional review because it had not completed the full parking-lot sequence. Important findings preserved from that review:

- XSP spreads are a genuinely **new strategy family**, not a parameterized CSP/Wheel extension.
- XSP’s cash-settled, European-style mechanics mean there is no assignment-to-inventory Wheel lifecycle.
- The current Wheelwright recommendation architecture does not already contain a 45-DTE, premium-selected, two-leg strategy merely by changing a selector.
- The strategy specification still contains hidden ambiguities:
  - exact meaning of “every trading day”;
  - exact 45-DTE selection window;
  - whether “premium closest to $5” means bid/ask/mid/executable fill;
  - liquidity/freshness/tie-break rules;
  - whole-spread credit floor;
  - actual-filled-credit basis for 50% target;
  - exact operational mechanics of 21-DTE closure and failed/partial closes.
- The $5 premium rule does **not** hold delta, moneyness, probability of loss, or compensation per unit of risk constant.
- Fixed $20 width changes as a percentage of XSP as the index level changes.
- “34 concurrent spreads” is a reasonable central capacity illustration, not a hard maximum.
- **Thirty-four individually bounded spreads can still behave like one concentrated S&P 500 downside position.**
- BPR/max loss alone hides mark-to-market drawdown, IV expansion, widening markets, clustered exits, and lifecycle-control failure.
- “Remaining buying power” is the wrong portfolio objective; start with a Principal-chosen NAV-at-risk budget and liquidity/stress reserve.
- A short-call sleeve may reduce snapshot delta but can turn the portfolio into a distributed iron-condor-like short-volatility book with additional gamma/whipsaw/path risk.
- Delta should initially be treated as an informational/scenario-tested measure rather than automatically promoted to a control target.
- Research order should be:
  1. standalone XSP engine;
  2. robustness/capacity/account stress;
  3. only then combined put/call sleeves;
  4. other bounded structures only if a specific unmet portfolio need remains.

## A6. tastytrade education question

The Principal asked whether tastytrade provides its own tutorials because the platform looked complex and powerful.

The response identified official tastytrade learning material, including a Desktop Platform course, “Trading With tastytrade” material, strategy/opening/managing tutorials, Greeks, and advanced-strategy education. The discussion also noted tastytrade’s own backtesting/risk-analysis capabilities as potentially relevant to the Wheelwright/Muse research program, subject to whether they can express the unusual $5-short-premium / fixed-$20-width rule.

---

# B. Exact/near-verbatim active-context conversation

## B1. Principal

> that's why i wanted you to scan the transcript.  tom talks about his favorites and what to expect.  the guy's a walking talking research project.

## B2. ChatGPT

The response agreed with that framing and said the value of the video was not the chapter list but Tom’s compressed map of portfolio construction from decades of trading/research. It summarized the 11 strategies, called attention to the “70% reveal,” and connected the video to the residual-capital problem: use Tom’s structures as a menu of **research hypotheses**, not as a mandate to deploy all capital.

It also stated that a reliable word-for-word transcript had not yet been obtained and that exact claims about favorites/frequencies/expected outcomes should not be invented.

## B3. Principal

> yes, extract the commentary, via the transcript

## B4. ChatGPT — transcript-derived strategy commentary

The response extracted the following working map:

| Strategy | Tom’s expressed usage/preference | Expected role / comments | Wheelwright relevance |
|---|---|---|---|
| Short puts | favorite / go-to / primary default bullish approach | 35–50 DTE, 16–22 delta, beaten-down names, IVR, ~50% target | productive but undefined downside |
| Jade lizard | another go-to bullish strategy | high POP, around 40 DTE, ~50% target, no upside risk if credit is sufficient | still naked-put downside |
| Covered calls | less frequent | basis reduction, cheaper/oversold stocks, 40–60 DTE | familiar but capital-intensive |
| Short put spreads | once/twice weekly; prefers naked puts | defined risk, capital efficient, lower reward, ~50% target | closest to proposed core engine, but Tom’s selection differs |
| Put ratio spreads | several times weekly | high POP, oversold/high-IV contexts, local protection but tail risk | hybrid, but conflicts with hard-loss-bound preference |
| Short call spreads | major favorite; second-largest current position after naked strangles | capital-efficient negative delta, defined risk, 30–50 DTE, ~50% target, reduce portfolio long delta | standout candidate for later research |
| Broken-wing butterflies | one to three weekly | likes upside version, especially earnings/runaway stocks | specialized negative-delta tool |
| Unbalanced iron condors | one/two weekly | defined risk, short premium, intentional negative delta | possible bounded portfolio-balancing candidate |
| Iron condors | engagement strategy | needs high IVR, harder to adjust | conditional |
| Short strangles | career best-performing option strategy by his statement | 45 DTE, 16–20 delta, high IVR, 50% target, frequent entries/adjustments | strongest endorsement but undefined risk |
| Price reversion / pairs / subjective IV | pairs occasional; subjective IV significant | relative value / contrarian volatility | more distinct factor, but discretionary |

The response emphasized that Tom does **not** present short put spreads as his great production machine; he explicitly trades off reward for bounded risk. It also highlighted short call spreads as the most interesting later research candidate because Tom says he uses them to reduce portfolio long delta.

It cautioned that the “70%” claim was broader than “two named strategies”: short strangles plus broader subjective contrarian IV trading appeared to dominate his activity/results.

## B5. Principal

> let's have codex review this.  gen a prompt

## B6. ChatGPT — Codex prompt

A full actor prompt was generated asking Codex to bootstrap from repository authority and adversarially review:

- the XSP engine’s fit with Wheelwright;
- whether it is a new strategy family;
- hidden execution-policy ambiguities;
- capacity arithmetic;
- aggregate risk beyond BPR;
- whether call spreads diversify or merely create distributed iron-condor exposure;
- what Greeks/risk measures a future portfolio layer needs;
- whether “remaining buying power” is the right framing;
- which Sosnoff observations are hypotheses versus evidence;
- what research should follow the XSP backtest;
- what evidence threshold should be required before admission.

The prompt explicitly prohibited implementation or silent policy promotion.

## B7. Principal — first Codex review

The Principal supplied a detailed Codex review titled **“Wheelwright strategy review.”** Its durable conclusions are captured in section A5 and in the project journal. Key additional points from the supplied review:

- current repository authority contains a real tension: older strategy-expansion governance had treated credit spreads as out of scope because they “require prediction,” while later credit-spread discovery challenged the premise that directional exposure proves a predictive decision process;
- a fixed-rule XSP spread can conceptually fit Policy over Prediction if complete consequence/compensation can be justified without relying on “the index will stay above the short strike”;
- fixed rules do not remove the strategy’s dependence on realized paths;
- whole-account scenarios should include spot moves both ways, IV shocks, skew changes, liquidity deterioration, and down-then-up paths;
- a zero-delta target can hide two large short-option books;
- future architecture would need durable spread/cohort identity, account-level risk budgets, broker reconciliation, replay-bound inputs, and lifecycle attention;
- a positive backtest mean is insufficient: predeclared rules, point-in-time chain data, realistic fills/costs, multiple regimes, sensitivity, out-of-sample/forward observation, and failure criteria are required;
- do not run an eleven-strategy performance tournament before validating the core engine and portfolio budget.

## B8. ChatGPT — synthesis of first Codex review

The response highlighted several especially important findings:

- **position risk is not portfolio risk**;
- one max-loss spread is about **19.3 $94 target winners**;
- “remaining capital” should be reframed as a risk-budget/liquidity-reserve question;
- adding call spreads may create a distributed iron-condor book rather than genuine diversification;
- the $5-premium rule has regime-dependent meaning;
- research should proceed XSP engine → robustness/capacity → account stress → only then a second engine.

It proposed adding a “winner-equivalent loss distribution” to the empirical output.

## B9. Principal

> what about having codex review tom's 11 boring... video, or your detailed synopsis of that video?

## B10. ChatGPT

The response said the right next Codex review was to have Codex examine **the transcript itself**, not merely ChatGPT’s synopsis. The goal would be:

- independently extract Tom’s strategy-by-strategy commentary;
- identify his actual portfolio logic;
- collapse named structures into economic risk families;
- separate transcript statements from empirical evidence and Wheelwright authority;
- determine which observations are useful research hypotheses.

A detailed actor prompt was generated accordingly.

## B11. Principal — second Codex review

The Principal supplied a long Codex review titled **“Tom Sosnoff’s eleven strategies: Wheelwright research review.”**

It reported that Codex had obtained YouTube’s English auto-generated captions (432 timed segments) and then audited each strategy. Important transcript corrections included:

- covered calls: no stated generic 50% close rule in that chapter;
- short put spreads: the chapter has credit/width and ~50% rules, but no chapter-specific 45-DTE or delta selection;
- put ratios: target at least opening credit, not necessarily the common 50%;
- iron condors: 30–50% target, frequency not stated;
- short-call “rich skew” claims should not be generalized automatically to XSP;
- the “70%” statement is nuanced: short strangles plus broader subjective contrarian IV trading.

The review’s central economic conclusion was:

> the eleven named strategies reduce to relatively few genuinely distinct economic families; many are different payoff diagrams for short-volatility exposure with different directional overlays.

Its factor map classified, with qualifications:

- short puts / jade lizards / covered calls / put spreads / put ratios as strongly overlapping with broad equity downside and short-volatility risk;
- short call spreads as negative-delta but still short-volatility;
- condors and strangles as two-sided short-volatility structures with different tail bounds;
- broken-wing butterflies as highly state-dependent local geometry;
- pairs/relative value as the most potentially distinct factor, but without a deterministic bounded-loss recipe in Tom’s discussion.

The review concluded that no other strategy in the eleven clearly supplies **both**:
1. a genuinely orthogonal return source, and
2. explicit bounded maximum loss,
in the form Tom presents it.

It recommended:

1. falsify put-only capacity and lifecycle first;
2. test whether negative delta is actually needed;
3. compare put-only + cash, fewer puts + cash, and put+call at equal gross risk;
4. only then test another bounded structure if a specific need remains.

It explicitly said **do not yet run an eleven-strategy tournament** or optimize Tom’s parameter recipes against the XSP backtest.

## B12. ChatGPT — synthesis of second Codex review

The response said the review succeeded because it treated Tom as a **hypothesis source about portfolio construction**, not as policy authority.

The most important synthesized principle was:

> **Strategy diversity is not risk-factor diversity.**

The response further observed:

- Tom’s apparent edge is not “11 magic structures” but a toolkit centered on short IV, frequent small trades, partial-profit exits, capital efficiency, and directional shaping;
- call spreads remain a legitimate research question because Tom genuinely uses them to reduce long delta;
- however, a put+call system may mainly be a short-gamma/short-volatility iron-condor-like portfolio;
- pairs are more factor-distinct but fail the current bounded/deterministic preference as described;
- cash may provide more genuine diversification than simply adding another short-premium strategy.

## B13. Principal

> bootstrap from github and persist this entire conversation, including the provided artifacts

This record is the direct result of that instruction.

---

# C. Provided artifacts

The two uploaded artifacts are preserved separately without reinterpretation:

1. **github URL** — [github-url.md](./github-url.md)
2. **Kiro operating model** — [kiro-op-model.md](./kiro-op-model.md)

The Kiro operating model states, among other things:

- GitHub is project truth;
- conversation is ephemeral;
- evidence beats assumption;
- distinguish Exploration, Design, Decision, and Implementation;
- do not treat speculative proposals as ratified direction;
- journal meaningful durable learning;
- keep documentation synchronized;
- commits require explicit approval;
- UI acceptance requires operator validation;
- avoid premature abstraction.

These source-artifact statements are preserved as supplied. Current repository authority still governs any conflict.

---

# D. Durable research state at persistence

## Established as conversation/review findings

- XSP put vertical research is an existing **PL-STRAT-01** exploration, not an admitted strategy.
- Proposed canonical research specification:
  - XSP;
  - ~45 DTE;
  - short put premium closest to $5;
  - long put 20 points lower;
  - close at 50% of actual opening credit;
  - mandatory close at 21 DTE;
  - systematic daily cohorts under study.
- The empirical study must focus on forced-exit loss distribution and overlapping-cohort drawdown, not just win rate or gross premium.
- A fixed $20 max-loss envelope per spread does not control aggregate correlated portfolio risk.
- Capacity arithmetic is not allocation policy.
- “Unused buying power” is not automatically capital awaiting deployment.
- A later call-spread study, if any, should compare equal-risk portfolios and include cash/fewer-put comparators.
- Tom’s transcript is practitioner evidence/hypothesis pressure, not independent performance evidence.
- Most of Tom’s named strategies are not independent return factors.
- Strategy-name diversity must not be confused with risk-factor diversity.

## Still unresolved / pending evidence

- Whether the exact XSP engine has positive net expectancy after realistic fills, costs, and forced exits.
- Whether 1/day or 2/day is sensible under any predeclared account risk budget.
- What maximum portfolio drawdown / NAV-at-risk / liquidity reserve is acceptable.
- Whether a negative-delta sleeve improves portfolio outcomes versus simply holding more cash.
- Whether tastytrade’s backtester can faithfully express the exact $5-premium / $20-width rule.
- Actual approved tastytrade options tier, although the account itself is approved.
- Any implementation, admission, policy, or UI design for this strategy family.

## Explicit non-conclusions

This record does **not** establish that:
- the XSP strategy works;
- 2 spreads/day is appropriate;
- $61.6k BPR is an acceptable portfolio allocation;
- short call spreads diversify the put engine;
- Tom Sosnoff’s reported historical results are independently verified;
- any one of the eleven strategies should be added to Wheelwright;
- the January capital infusion should be deployed.

---

# E. Resume point

The immediate empirical dependency remains the exact XSP put-spread backtest already assigned to Muse.

If that study is encouraging, the next research sequence preserved by this conversation is:

1. standalone engine robustness and forced-exit loss distribution;
2. overlapping-cohort/account-level stress and predeclared risk-budget/liquidity policy;
3. comparison of put-only + cash vs reduced-put + cash vs bounded negative-delta sleeve at equal gross risk;
4. only then investigate another bounded structure if a specific portfolio need remains.

This is a research sequence, not implementation authority.


---

# F. 2026-09-29 afternoon checkpoint — historical-data substrate and backtest engine

## F1. Historical data requirement resurfaced

The Principal recalled that Wheelwright had previously identified a need for historical option data. The discussion connected the current XSP study to that earlier architectural concern: current/live chains answer “what is tradable now,” while historical point-in-time chains are needed to replay what a policy could actually have selected at an earlier decision time.

The working distinction is now:

- **Tradier / live provider:** operational current-market evidence.
- **ThetaData / historical provider:** research and point-in-time replay evidence.
- **Wheelwright retained snapshots:** prospective canonical evidence accumulated by the system itself.

This is a research/architecture observation, not a provider migration decision.

## F2. Nearby mini-index products

XND and MRUT were considered as conceptual analogues to XSP. The Principal observed that their available chains are materially less complete than XSP for the intended mechanical selector. That matters because the proposed rule requires a sufficiently dense expiry/strike/quote surface to choose a ~45-DTE put nearest a $5 premium and then a long put exactly 20 points lower.

Current research implication: do not broaden the experiment merely for nominal index diversification. Chain completeness and executable liquidity should be treated as prerequisites for any later instrument-generalization study.

The tastytrade “W” marker on expirations was identified as a Weekly-series label, not a change to the DTE calculation. Weekly expirations are not excluded from the proposed XSP rule.

## F3. tastytrade advanced-order observations

Principal-provided screenshots showed a representative XSP Nov 13, 45-DTE 730/710 put vertical, 20 points wide, around $1.76 opening credit and about $1,824 BP/max-loss effect.

The Advanced Order / Bracket panel demonstrated:

- a GTC **Close At Profit** order around $0.87, corresponding to approximately 50% of opening credit;
- a GTC **Stop Loss** around $2.19, reflecting tastytrade’s observed default ~25% stop-loss setting.

The 25% stop is **not** part of the proposed canonical XSP strategy and must not be silently imported into it.

The screenshots strengthen the lifecycle split already under discussion: tastytrade can plausibly own the price-triggered GTC profit exit, while the 21-DTE time-triggered mandatory exit still requires operator/Wheelwright/API lifecycle logic.

An implementation detail remains worth verifying in a tiny live/paper observation: whether an attached 50%-profit bracket recalculates from the **actual opening fill credit** or preserves the pre-fill staged price.

## F4. ThetaData acquisition status

A separate research actor reported that ThetaData’s free account is active and historical data is accessed through the locally installed ThetaData terminal rather than a web-download surface. The terminal can authenticate with an API key.

Security boundary preserved in this conversation: **do not paste the ThetaData API key into chat.** Prefer a local environment variable or local temporary credential file that is excluded from Git, never echoed/logged/committed, and can be revoked/rotated if exposed.

The acquisition plan is to probe actual XSP EOD historical coverage before assuming the free-tier window. At this checkpoint, the first pull chunk was probing 2024-07 and all tested months were returning data. A 72-month scan is intended to establish the true earliest usable date before completing the full pull.

## F5. Canonical backtest engine corrections completed

The actor reported 13 unit tests passing, including six newly added tests for target-price execution, strict-DTE skipping, incomplete-trade exclusion, capital-ceiling blocking, clustered same-day exits, and order-insensitive live-shape parser validation.

The corrected canonical methodology is:

1. **Strict entry DTE:** eligible expirations must be in calendar DTE [40, 50], selecting the expiry nearest 45 DTE with nearer expiry as tie-break. If none exists, skip and log `no_expiration_in_45dte_window`. The legacy >=30-DTE fallback is non-canonical sensitivity behavior only.
2. **Short strike:** among puts in the selected expiry, rank by distance of visible midpoint from $5.00; require an executable quote. Long put is exactly 20 index points below.
3. **Canonical opening execution:** short bid minus long ask.
4. **50% target:** when sampled closing debit reaches or passes the 50%-of-entry-credit limit, record the exit fill at the **limit price itself**, not at the better sampled debit. Preserve sampled debit separately. No price improvement is assumed.
5. **21-DTE exit:** otherwise close at the sampled executable EOD debit on the first trading day with calendar DTE <= 21.
6. **End-of-sample positions:** mark `incomplete` and exclude from realized-P&L statistics; do not fabricate neutral marks.
7. **Capital ceiling:** every attempted entry in both 1/day and 2/day cases is refused if aggregate open BPR plus the new spread would exceed the $92,000 account. The 2/day case is therefore capital-constrained rather than a simple 2x scale.
8. **Execution scenarios:** canonical reasonable execution pays the quoted spread; conservative execution adds 2 cents per leg per side adverse slippage.
9. **No optimization:** $5 premium target, $20 width, ~45-DTE strict window, 50% target, and 21-DTE exit remain fixed for the canonical run.

## F6. Study document checkpoint

The Principal supplied **“XSP Put-Credit-Spread Systematic Strategy: Historical Viability Study.”** At this checkpoint Sections 1–3 define the research question, data/limitations, and exact methodology; Sections 4–12 intentionally remain TBD until the historical pull completes.

The study’s central economic question remains: **do losing forced 21-DTE exits consume the stream of small 50%-profit winners?** Required outputs include winners erased per forced loser, gross target profits consumed by forced exits, monthly P&L distribution, drawdown/cluster behavior, capital utilization, 1/day versus capital-constrained 2/day, and execution-cost sensitivity.

Important epistemic boundary: the expected ThetaData coverage window written in the draft is provisional. Empirical probing, not documentation expectation, determines the actual usable window.

## F7. Current state / resume point

- XSP remains exploratory research under PL-STRAT-01; no strategy admission or policy ratification.
- Engine corrections are at a clean checkpoint with 13 reported passing tests.
- Historical acquisition is still running; no performance conclusion exists yet.
- Do not modify the engine merely to fill waiting time unless the data pull exposes a concrete defect.
- Next evidence: actual earliest continuous XSP coverage, completed pull, then measured canonical results—especially the `forced_21dte` loss distribution and clustered cohort drawdowns.


---

# G. 2026-09-29 late-afternoon snapshot — XSP historical results received; independent audit pending

## G1. Muse historical-results report received

The Principal supplied Muse’s completed report, **“XSP Put-Credit-Spread Backtest — Historical Results”** (study date 2026-09-29). The report states that ThetaData free-tier XSP EOD coverage was obtained from 2023-06-01 through 2026-09-28 and that the frozen canonical strategy was run without parameter optimization.

Reported canonical Scenario A:
- 859 reported sample days; 546 entries; 537 completed; 9 incomplete.
- 314 target exits (58.5%); 223 forced exits (41.5%).
- 69.1% profitable completed trades.
- Net P&L **-$21,593**; average month **-$540**; median month **+$415**; 65% profitable months.
- Reported annualized return on fixed $92,000: **-7.1%**.
- Profit factor **0.61**.
- Reported max drawdown **-$33,009 (-35.9%)**.
- Average target winner **+$98.41**; average losing forced exit **-$331.30**; one average losing forced exit therefore erased about **3.37 average target winners**.
- Gross losing forced exits were reported as **178% of gross target profits**.
- Losses clustered in cohorts; reported examples include Mar 2025, Aug 2024, Apr 2024, and Mar 2026.
- Peak reported BPR was $33,808 (36.8% of $92,000), with at most 18 simultaneous spreads.
- Two entries/day reportedly scaled the loss approximately linearly rather than diversifying it.

Execution sensitivity is material: Muse reports **+$18,096** under optimistic midpoint fills versus **-$21,593** under bid/ask execution, a $39,689 sign-changing swing. The report also states that an April 2025 forced exit crossed a severely dislocated quoted market and modeled a $23.01 closing debit on a nominally $20-wide spread.

The report also found that the literal “daily” canonical rule was enterable on only 63.5% of reported days. A major cause was the absence of the exact short-minus-20 long strike on 212 otherwise-valid entry days. A nearest-listed-long sensitivity increased entries but worsened reported P&L.

## G2. Epistemic status changed from “pending result” to “reported adverse result, unverified”

The completed report is useful adverse evidence, but it is **not yet treated as independently validated evidence**. A separate read-only audit identified four bounded questions that must be resolved against Muse’s code, raw chains, timestamps, and trade outputs before the result can drive Wheelwright strategy or capital authority:

1. **Calendar reconciliation.** The report labels 859 observations “trading days” and says all weekdays are present except nine market holidays. The date-range arithmetic/market calendar must be independently reconciled.
2. **Same-day EOD selection/execution semantics.** The report selects the contract from an EOD chain and models entry using that same day’s quotes. The raw timestamps and code must establish whether this represents a legitimate executable protocol or introduces look-ahead.
3. **Forced-close debit greater than spread width.** The $23.01 modeled close on a $20-wide spread may be mechanically possible when independently crossing badly dislocated leg quotes before expiration, but it exposes a policy tension: a mandatory 21-DTE close does not guarantee the contractual terminal width as the realized exit cap. The execution model and intended live order semantics require audit.
4. **Portfolio drawdown methodology.** The report’s -35.9% drawdown must be checked against true daily mark-to-market equity for all overlapping open positions, not merely realized P&L. With up to 18 simultaneous spreads, realized-only drawdown could understate economic drawdown.

The audit should trace the complete evidence path:
**calendar -> raw ThetaData timestamps/quotes -> contract selection -> entry execution -> lifecycle execution -> daily portfolio valuation -> reported statistics.**

## G3. No optimization authorized

Do **not** respond to the adverse result by tuning premium target, width, DTE, profit target, or exit age against this sample. The canonical hypothesis remains frozen while validation is pending. Execution-realism analysis is permissible as validation of the existing experiment, not as parameter optimization.

## G4. tastytrade curriculum observation

The Principal is concurrently working through tastytrade’s nine-course “All About Options” curriculum. The completed introductory material places unusually strong emphasis on **intrinsic versus extrinsic value**, and extrinsic value is also prominent in the tastytrade trading UI.

Research interpretation only: for the normally OTM short put selected by the canonical ~$5-premium rule, the premium is essentially extrinsic value. Thus the rule can be viewed economically as selecting roughly a fixed amount of extrinsic value to sell, while **not** fixing delta, moneyness, strike distance, implied volatility, or risk compensation across regimes. Do not change the canonical selector from premium to an “extrinsic” UI field without a separate decision.

The curriculum sequence observed by the Principal is: Options Foundations; Building an Options Strategy; Opening an Options Strategy; Placing Options Trades; Managing an Options Strategy; Bullish Options Strategies; Bearish Options Strategies; Neutral Options Strategies; Options Greeks. Preserve a distinction among tastytrade’s official education, Sosnoff practitioner claims, and empirical historical evidence.

## G5. Current state / resume point

- Historical acquisition and Muse’s first canonical run are complete enough to produce a report.
- The report is adverse but **unverified**.
- XSP remains research under PL-STRAT-01.
- No Wheelwright authority, strategy admission, capital allocation, provider migration, or execution policy changes as a consequence of the report.
- Muse’s local artifacts are reported at `~/workspace/xsp-study`: engine/code, raw ThetaData parquet chains, scenario outputs, and unit tests. They were not independently accessible to the auditing actor at this checkpoint.
- **Next authorized action:** independently audit the backtest artifacts when accessible, with special attention to calendar correctness, EOD timestamp/execution semantics, forced-close pricing beyond width, and true mark-to-market portfolio drawdown.
