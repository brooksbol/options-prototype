# Dynamic Management of Covered Calls in a Growth/Compounding Regime
## Wheelwright Research Memo — Delta-Band (“Delta Staircase”) Covered Calls

**Date:** 2026-10-02  
**Scope:** Research only. Not Wheelwright policy. Not implementation.  
**Regime in scope:** Long-equity growth/compounding; continued ownership and upside participation primary, premium secondary, assignment may be undesirable, tax-advantaged account assumed (Roth IRA-type), transaction and opportunity costs still real.  
**Candidate mechanism:** Write low-delta OTM covered call. Middle delta band = hold. Upper rail = trigger *economic reevaluation* (hold / BTC to uncovered / BTC + farther OTM / roll up / roll up-and-out / accept assignment), NOT automatic roll. Lower rail = trigger reevaluation (hold / BTC cheap / expire). Any replacement must independently qualify from current state; no anchoring to historical strike; no mechanical repair.

**Semantic discipline (throughout):** ROLL ≠ PROFIT. BTC and STO are separate economic events. Replacement = new obligation. Roll credit ≠ realized gain. Replacement must independently qualify. Do not anchor to previous strike/loss. Delta ≠ assignment probability. Expiring OTM ≠ overall profitable. Premium ≠ free income. Buy-and-hold is not automatically the correct benchmark, but is included because Growth values appreciation.

**Evidence labels:** [Peer-reviewed] journal/academic; [Institutional/Index] index provider/consultant/asset-manager research; [Exchange/OIC ed.] Cboe/OCC/OIC educational/methodology; [Broker/Practitioner-Q] broker or quantitative-practitioner with stated rules; [Practitioner] rules/blogs/open-source specs — existence proof only; [Vendor] product marketing, lowest weight.

---

## 1. Executive conclusion

**Primary question:** For a long-equity growth investor, does dynamically managing covered calls using delta-triggered reconsideration materially improve upside participation or total economic outcome versus simpler low-delta or intermittent covered-call strategies after realistic execution costs? If so, under what regimes, lifecycle rules, tradeoffs, and mechanism?

**Answer: NOT DEMONSTRATED — not “demonstrated not to work.”**

No peer-reviewed, institutional, or index source located demonstrates that a two-rail delta-triggered reconsideration policy (BTC / roll-up / roll-up-and-out on an upper rail; harvest/rewrite on a lower rail) materially improves total economic outcome or upside participation versus (a) writing a lower-delta call and holding to expiration, (b) intermittent/opportunistic overwriting with deliberate uncovered periods, or (c) partial (fractional) coverage — after bid/ask, fees, and slippage.

What is demonstrated:

1. **Any covered call caps upside and lags in strong bull markets; OTM/fixed-delta writes lag less than ATM writes but collect less premium.** BXM captured only ~40–50% of 2013/2019 bull years (see §13). A delta rail does not repeal the cap; at best it re-prices the cap repeatedly, paying BTC costs and spreads each time.
2. **The compensated piece is small and specific.** Israelov & Nielsen (2015) [Peer-reviewed]: short-volatility slice Sharpe ~1.0 but <10% of risk (~2%/yr); embedded delta-timing = uncompensated reversal bet ~25% of risk, largest near expiry. Active rolling does not create a new premium; it re-trades the same exposures and adds turnover.
3. **“Recapturing upside” by rolling up is buying back upside previously sold, then usually selling upside again farther out/later.** Sometimes worth making; never free. An up-and-out “credit” buys strike with duration, not upside creation (§5–§7).
4. **Simpler competitors capture most plausible benefit with fewer moving parts:** permanently lower entry delta (Cboe BXMD, 30-delta monthly, held to expiry), partial coverage (BXMH, half unit), conditional coverage (BXMC, VIX≥20 → 1 else ½), and profit-target/DTE management (tastytrade-style 50%-of-premium and 21-DTE rules [Practitioner-Q]). None requires intra-life delta rails, and index versions are held to expiration — institutions that productized “delta” and “conditional” ideas deliberately did not productize intra-life delta-triggered rolling.

**Most defensible use of delta:** as a *prompt to re-underwrite* — “would I sell this call, at this strike/expiry, today?” — rather than automatic roll trigger; with hard guardrails (max DTE extension, max rolls per episode, BTC-to-uncovered genuinely allowed, replacement must clear same entry bar as fresh trade). **Least defensible:** near expiration (gamma makes delta unstable), in gap-prone single names, in low-vol grinding bulls (repeated small debits/spreads to chase rising cap), and whenever “roll for a credit” becomes the objective.

**Recommendation:** Two-rail delta policy deserves *one small, falsifiable experiment* — only against strong baselines (buy-and-hold, fixed low-delta hold-to-expiry, intermittent uncovered, partial coverage), realistic bid/ask, pre-registered kill criteria. If it cannot beat fixed low-delta hold-to-expiry net of costs, added complexity is not justified (§18–§19).

---

## 2. Existing terminology and history

**Finding:** “Delta Staircase” is not an established options-strategy name. “Delta-band” management exists as practitioner vocabulary and in at least one detailed open-source retail spec; fixed-delta *entry* is institutionalized by Cboe (BXMD); intra-life delta-band *rolling* is not institutionalized in any index methodology located.

- Exact-phrase search `"delta staircase" options strategy` returned no options-strategy usage. Treat as project coinage, not term of art.
- **Fixed-delta entry is institutionalized:** Cboe S&P 500 30-Delta BuyWrite Index (BXMD) “tracks the value of a hypothetical portfolio that overlays a short 30-delta call option on the S&P 500 instead of an at-the-money option. The smaller premium… provides a smaller buffer but also less giveup on the upside. The BXMD portfolio is rebalanced monthly after the expiration of the 30-delta SPX call… A new 30-delta SPX call is then sold.” [Institutional/Index — https://ww2.cboe.com/us/indices/dashboard/BXMD/] BXMD does **not** monitor delta intra-month or roll on rails; delta used once at entry, held to expiration.
- **Practitioner delta-band exists in mission form.** One explicit open-source spec [Practitioner; existence proof, not performance]: |Δ| < 0.12 = “harvest” (BTC + rewrite at sleeve entry target, 30–45 DTE), 0.12 ≤ |Δ| ≤ 0.45 = “hold”, |Δ| > 0.45 = “defend” (BTC → roll up-and-out to entry target, or BTC-only); entry targets differ by sleeve (conviction ~0.12–0.18Δ, income ~0.20–0.30Δ); BTC and rewrite legs gated separately for spread/liquidity, downgrade to BTC-only if rewrite fails; harvest with DTE < 10 must rewrite only into 30–45 DTE. Source: https://github.com/jasebrodsky/trading/blob/HEAD/.cursor/skills/robinhood-delta-band-cc/SKILL.md
- Second practitioner source: roll up-and-out at 0.50+, weigh rolling vs assignment at 0.60+, consider closing below 0.20 if profit objective met [Practitioner — https://wheelstrategyoptions.com/blog/optimizing-covered-call-defense-when-to-roll-when-to-close-and-delta-triggers/]
- Practitioner strike selection routinely frames entry by delta bands (~0.15–0.25 “Fortress,” ~0.25–0.35 normal-IV) and “dynamic delta selection” lowering delta when IV rich [Practitioner — https://cashflowmachine.net/covered-call-delta-selection/] — entry selection, not validated intra-life management.

**How common?** Entry-delta targeting: ubiquitous (practitioner) and index-certified (BXMD). Hold-in-band with reconsideration outside: present in practitioner systems, absent from index methodologies and peer-reviewed covered-call literature located. Vocabulary circulates; performance claim does not circulate with institutional-grade evidence.

---

## 3. What the academic/institutional literature says about dynamic covered-call management

### 3.1 Academic core: what a covered call is

**Israelov & Nielsen, “Covered Calls Uncovered,” *Financial Analysts Journal* 71(6), 2015** [Peer-reviewed; SSRN https://papers.ssrn.com/sol3/papers.cfm?abstract_id=2444999&mirid=1]. Decomposing BXM-like (1-month ATM) and BXY-like (1-month 2% OTM), Mar 1996–Dec 2014:

- **Covered Call = Passive Equity + Short Volatility + Dynamic (Timing) Equity**, timing term = (InitialCallDelta − CallDelta) × Equity. Passive equity supplies most risk/return. Short volatility Sharpe ~1.0 yet <10% of risk, ~2%/yr. Equity timing ~25% of risk, ~0.5%/yr return, statistically insignificant (t ≈ 0.4), ~zero alpha — naïve reversal bet: exposure rises after falls, falls after rises because short call delta moves against holder.
- Timing bet smallest just after sale, largest just before expiry; day before expiry provides on average nearly same risk as passive equity exposure. Academic root of “don’t hold short premium into final days” — cuts against using raw delta as late-life controller (§4).
- **Risk-managed variant does NOT roll options; it delta-hedges timing exposure daily with index futures**, holding portfolio delta constant. Hedging cut BXM volatility 11.4% → 9.2% and raised Sharpe 0.37 → 0.52; BXY volatility 13.3% → 12.4%, Sharpe 0.41 → 0.46 [Peer-reviewed]. Implication: the one academically supported “dynamic” improvement manages delta via underlying/futures, not rolling the option — opposite instrument from Delta Staircase.

Earlier literature consistent on unconditional strategy: Whaley (2002), Feldman & Dhruv (2004), Hill et al. (2006), Figelman (2008/2009) find S&P 500 covered calls earned index-like average returns with lower volatility [Peer-reviewed/Institutional, as cited in Israelov & Nielsen]. Kapadia & Szado (2012) similar for Russell 2000 buy-write [Peer-reviewed]. None tests delta-rail rolling.

### 3.2 Index-productized variants — all held to expiry

Cboe productized nearly every static dimension, making absence of delta-rail product informative:

| Lever | Index | Rule (entry only; held to expiry) |
|---|---|---|
| ATM full | BXM | Sell ~1-mo ATM SPX monthly |
| OTM moneyness | BXY | Sell 1-mo 2% OTM monthly |
| OTM delta | BXMD | Sell monthly call nearest 30-delta at roll |
| Partial | BXMH | Sell half unit ATM monthly; long unchanged |
| Conditional | BXMC | Sell 1 if VIX ≥20 else ½, ATM monthly |
| Staggered | BXMW | Four staggered weekly tranches of 4-wk calls |

Sources: BXM factsheet https://prefblog.com/wp-content/uploads/2026/02/CboeGlobalIndices_BXM-Index_Factsheet_251231.pdf ; BXY https://res.cboe.com/us/indices/dashboard/BXY/ ; BXMD https://ww2.cboe.com/us/indices/dashboard/BXMD/ ; BXMH methodology https://res-certification.cboe.com/api/global/us_indices/governance/Cboe_Half_Buywrite_Indices_Methodology.pdf ; BXMC https://res.cboe.com/us/indices/dashboard/bxmc/

**Methodology caveat (all Cboe buy-write):** hypothetical call sold at VWAP (or last bid), expiring cash-settled at Special Opening Quotation, dividends/premium reinvested, **no commissions/fees/market-impact beyond VWAP**. BXMH methodology: call “held to maturity,” new call sold at 2-hour VWAP beginning 11:30am ET. Retail American ETF options (SPY/QQQ) differ: physical assignment, dividend early-exercise, wider effective spreads. Index levels are upper-bound frictionless picture — useful as baselines, dangerous as promises.

### 3.3 Practitioner management systems (labeled, unvalidated)

- **Profit-target + time-stop (tastytrade lineage)** [Practitioner-Q]: enter ~45 DTE, close at 50% of credit, roll/close at 21 DTE to avoid gamma. Mirrored in open-source (https://github.com/jrszilard/trading-bot — IV-rank >30 entry, ~45 DTE, 50% profit, 21-DTE). Lifecycle rule on premium/time, not delta rail. No peer-reviewed validation located; strong baseline for experiment.
- **Delta-trigger tables** [Practitioner]: 0.50+ roll up/out, 0.60+ weigh assignment, falling-delta close (see §2). Internally consistent, backtest-free in sources located.

### 3.4 Active fund practice

Managers vary coverage/strike actively but discretionarily [Vendor]: BMO adjusts “percentage of portfolio covered” and strike distance, partial coverage ranges, greater OTM emphasis since June 2025 (http://fundlibrary.com/Articles/Detail/covered-call-etfs-the-total-return-approach/2278). JEPI combines defensive low-vol equity sleeve with SPX calls via ELNs, staggered weekly; Morningstar notes capped upside, questions benefit “to a long-term buy-and-hold investor” [Institutional research on Vendor product — https://global.morningstar.com/en-gb/etfs/this-jpmorgan-etf-targets-high-income-us-stocks]. Professionals vary coverage ratio and strike at entry and stagger expirations; located materials do not disclose delta-rail rolling.

---

## 4. Delta as a lifecycle feedback variable

### 4.1 Participation intuition correct — instantaneously

100 shares (+100 delta) short one call Δ: combined delta = 100×(1−Δ). Δ=0.15 retains ~85% of next $1; Δ=0.45 retains ~55%; deep ITM Δ→1 retains ~0%, economically limit sell at strike. Practitioner explainers state same arithmetic (100 shares + short 0.30Δ = net +70 [Practitioner — https://optionpilot.ainvest.com/blog/how-to-sell-a-covered-call]).

As snapshot of retained participation, delta is exactly right. Problems begin using snapshot as controller.

### 4.2 Why delta alone inadequate (Objection 5 — sustained)

Δ = Δ(S, σ, T, K, r, q); gamma largest near strike near expiry — where growth investor most wants reliable control.

- **Same delta, different animal.** 0.45Δ at 45 DTE far from strike, modest gamma; 0.45Δ at 1 DTE essentially at strike, maximal gamma — $1 move swings delta tens of points. Israelov: timing exposure minimal at sale, maximal at expiry, converging to 0 or 1 [Peer-reviewed]. Rail at “0.45” fires in calm mid-life and pin-risk end-life for different reasons. **Any delta rail must be DTE-gated** (e.g., rails disabled/re-scaled inside ~7–10 DTE, where tastytrade 21-DTE tradition already exits [Practitioner-Q]).
- **Volatility moves delta without price.** Vol spike raises OTM deltas, can push through upper rail with stock unchanged (Path H, §9). IV crush collapses delta while stock at strike. Delta-only cannot distinguish “stock ran” vs “surface re-priced.” Pair delta with moneyness (S/K) and DTE; practitioner spec does this implicitly (defend → rewrite at entry delta, 30–45 DTE).
- **Skew/strike discreteness.** Listed strikes discrete; “30-delta strike” jumps in moneyness as vol/skew shifts. BXMD accepts coarseness monthly [Institutional/Index]; daily rail inherits daily.
- **Gaps/discrete monitoring.** Equity options trade 9:30–16:00/16:15 ET; underlying gaps overnight through rail. Once-daily check will discover Δ=0.85 not 0.45. Rule must specify action on discovery, not assume execution at rail.
- **Early assignment/dividends.** American calls: if remaining extrinsic < upcoming dividend, exercise rational, assignment likely day before ex-div [Exchange/OIC ed.; https://www.webull.com/learn/R4yy3g/HRwsEk]. Delta does not encode. High-delta into ex-date is assignment event on calendar. SPX European cash-settled indexes lack this failure mode — index evidence understates single-name/ETF friction.
- **Liquidity.** Far-OTM low-delta calls wide *percentage* spreads; lower rail “call cheap, BTC” can trigger on $0.02 option with $0.02 spread, BTC costs 50–100% of remaining value in friction (§14).

**Verdict:** Delta is good *state variable* and legitimate *component* of multidimensional trigger; as sole controller conflates price/vol/time. Strongest defensible form: **reconsideration trigger = (delta rail) AND (DTE window) AND (replacement independently qualifies at entry standards including spread/IV)** — delta summons decision, does not make one. Research supports keeping mission’s framing (“trigger reevaluation, NOT automatic roll”).

### 4.3 Delta ≠ assignment probability

Black-Scholes (no div): delta = N(d1), risk-neutral prob ITM = N(d2), d1 = d2 + σ√T, so delta systematically overstates even model’s risk-neutral ITM probability, growing with σ√T [model fact; https://github.com/jonaslffr-ship-it/trading-library/blob/HEAD/03-options/L2-greeks-and-hedging.md]. N(d2) is risk-neutral pricing probability, not real-world forecast. Using delta as “chance of losing shares” stacks two errors. Assignment risk: check moneyness, extrinsic vs dividend, DTE — not delta.

---

## 5. Economics of successive upward rolls

### 5.1 Accounting identity

Position equity = shares (marked) − call liability (ask to BTC) + cash premium ledger. Roll changes: (i) realizes old call (STO₁ − BTC₁ − costs), (ii) opens new liability (STO₂ − eventual cost), (iii) moves cap (strike) and clock (expiry). Net roll credit/debit = (ii) opening cash − (i) closing cash; labeling it profit double-counts because STO credit arrives with equal opposite liability at fair value.

### 5.2 Worked staircase ($40→$44→$47→$50→$54, illustrative)

Per share ×100, ignore spreads one paragraph then add:

- S=$40. Sell 45-DTE $44 call (Δ≈0.20) for $0.80. Effective cap $44.80. Retained delta ≈80.
- Stock $44. Call Δ≈0.55, trades $1.90. **BTC leg: $0.80 − $1.90 = −$1.10 realized on call.** Shares +$4.00 unrealized.
  - *BTC only:* shares at $44, call ledger −$1.10, uncapped from here. Paid $1.10 to remove cap *after* move — short delta all way up.
  - *Roll up same expiry to $47:* $47 call $0.90 → roll debit $1.00. New liability $0.90; cap $47.
  - *Roll up-and-out to $47 +30d:* longer $47 call $2.05 → roll credit $0.15. Same $47 cap, obligation 30d longer.
- Repeat to $47, $50, $54. Terminal if assigned at $54 after 4 rolls: **total = strike received + ΣSTO − ΣBTC − Σ(spreads/fees)**. Each BTC of appreciated call repurchases near dollar-for-dollar (Δ→1) appreciation investor already had in shares — short call gives it back. Shares created $40→$54; calls taxed path, each roll paid toll (spread ×2 legs) to move tax boundary.

With friction: $0.04–$0.10/share combined spread+slippage per roll on liquid ETF options (single names worse). Four rolls ≈ $0.16–$0.40/share = $16–$40/contract vs initial premium $0.80 ($80). Friction 20–50% of original premium plausible planning range for actively staircased position, before debit rolls.

### 5.3 Objection 3 sustained: rolling up IS buying back sold upside

Options Playbook canonical example: stock $87.50, sell $90 call $1.30; stock $92, BTC $90 call $2.10 (“it will hurt a bit”), sell 60-day $95 call $2.30 for $0.20 net credit — warning: “Every time you roll up and out, you may be taking a loss on the front-month call… you still have not secured any gains… you could wind up compounding your losses… more like a quadruple-edged shaving razor.” [Practitioner — https://www.optionsplaybook.com/managing-positions/rolling-covered-calls] Saxo: once call mostly intrinsic, “any roll will likely require a debit and won't improve your upside much” [Broker — https://www.home.saxo/en-sg/content/articles/options/rolling-options-explained---04---frequently-asked-questions-and-real-world-scenarios-02102025]

### 5.4 Same-expiry up-rolls are debit rolls (Objection 4a — sustained)

Fixed expiry, higher strike cheaper (monotone in strike). BTC lower-strike > STO higher-strike: **pure roll-up is debit by no-arbitrage** (up to spread noise). Credit only by selling more time (up-and-out), more vol (IV rose), or closer strike than delta target. Each “credit” purchased with duration or risk. Arithmetic, not opinion. Any backtest booking roll credits as income without marking new liability mis-states performance.

### 5.5 Critique of “$30 debit for $300 cap” metric (§6 preview)

Metric ($0.30/share debit lifts cap $3.00/share on 100 shares) errors: (1) certain immediate debit vs contingent terminal cap increase paying only if finish above old strike (fully only above new); (2) ignores duration extension ( $300 available longer, against you); (3) ignores new STO expected value — if fairly priced, sale ~zero ex-ante edge before VRP, so “purchase” closer to fair-value exchange than bargain.

**Better accounting:**
1. *Closed-leg result:* STO₁ − BTC₁ − costs (sunk; report, never target).
2. *Fresh-trade test:* Would you sell candidate today, naked-to-history, at bid, given IV/DTE/spread/growth mandate? If no, BTC-only or hold; do not roll.
3. *Cap-exchange efficiency (roll vs BTC-only):* debit ÷ (cap increase × risk-neutral prob finishing above old strike) — EV-weighted price per dollar usable cap — reported alongside DTE extension days. Pair (EV-$ per usable cap $, extra days short) is honest summary; no single scalar sufficient.

---

## 6. Whether the “staircase” interpretation is economically legitimate

**Partially legitimate as description of strike path; misleading as description of wealth creation.**

Legitimate: successive upward replacements cause effective upside cap to follow underlying upward in discrete steps: $44 → $47 → $50 → $55 … Strike path does staircase.

Misleading if it implies appreciation between levels captured by rolling. It is not. Appreciation captured by long shares minus Σ(BTC−STO losses) minus Σfriction. Every BTC cost and new STO liability must be in ledger (§5.2). “Recapture upside” implies roll creates upside; correct phrasing: *roll exchanges realized loss on old call (plus new short-vol obligation) for higher, later cap.* Whether exchange good depends entirely on whether new short call is attractive sale at that moment — mission’s “independently qualify” rule is exact antidote.

**How to measure genuinely preserved upside:** Compare terminal wealth and upside participation (e.g., capture in best underlying return quartile) of BAND vs FIXED/PART/BH on identical paths net of all spreads/fees, with premium ledger reported separately from total P&L. If BAND terminal wealth > FIXED only because it spent more days uncovered, attribute to uncovered time, not rolling skill — which is why experiment logs days covered vs uncovered (§18).

---

## 7. Duration-extension problem (duration treadmill)

Repeated up-and-out (30→45→60 DTE…) converts episodic overwrite into **quasi-permanent short-vol obligation**: investor almost never uncapped, theta always “harvested,” every rally met by re-shorting higher.

- **Upside benefit decays while obligation persists.** Each BTC nearer intrinsic (Δ→1), each new STO must go farther/later for credit; cap recedes slower than stock in persistent rally (staircase falls behind explosive path — Path B, §9).
- **Short-vol becomes structural.** Permanently overwritten = permanently short vol + permanently running reversal-timing bet [Peer-reviewed Israelov]. Portfolio allocation decision (long equity + short vol) should be made as one with target coverage ratio, not arrived at by roll inertia.
- **Exit harder.** Later expiry = more vega, more calendar to defend; “temporary” cap becomes position.

**Anti-treadmill rules in practice** [Practitioner/Practitioner-Q]: hard DTE ceilings (rewrite only 30–45 DTE; open-source spec refuses harvest into <10-DTE weeklies, caps rewrites 30–45); roll-count limits (e.g., max 2 rolls then close/re-evaluate — https://github.com/ducklinggod/trading-edge, illustrative unvalidated); time-stops (close/roll at 21 DTE regardless); episode term limits (rally episode ends in assignment, BTC-to-uncovered, or pre-set final expiry — new call after is new episode requiring fresh entry).

**No empirical study located measures treadmill outcomes directly** — established by accounting (§5) and practitioner warning, not backtest. Evidence gap; experiment logs DTE-extension explicitly (§18).

**Can rules prevent endless extension?** Yes by construction: cap replacement DTE at entry DTE (no net duration extension across episode), cap rolls per cycle (e.g., 1), require BTC-to-uncovered dwell before rewrite. Whether capped version still beats FIXED is experiment question, not assumption.

---

## 8. Lower-rail / exhausted-call management

**Objection 6 — sustained in part: lower delta boundary particularly weak as sole observable.**

Low delta does not imply negligible executable closing cost. When rally stalls/reverses, call moves farther OTM, delta declines, option inexpensive *in dollars* but often expensive *as % of remaining value*:

- Remaining value may be $0.05 with $0.02 spread: BTC at ask pays 40% friction to retire $0.05 liability that may expire worthless in days.
- Better observables: **% of original premium captured** (e.g., BTC at ≥75% captured — tastytrade 50% rule [Practitioner-Q] is stricter), **extrinsic value remaining**, **DTE**, **spread as % of mid**, and **fresh-entry qualification for any rewrite**.
- Lower rail legitimate uses: (a) BTC cheaply to remove pin/gamma risk near expiry and free shares before event/dividend; (b) BTC to allow uncovered participation if investor now wants uncapped exposure and call is trivial cost; (c) harvest + rewrite *only if* rewrite passes fresh-entry bar (target delta/DTE/spread/IV) — open-source spec’s harvest (<0.12 → rewrite 30–45 DTE, legs gated separately) is coherent template [Practitioner].
- Illegitimate use: mechanical BTC because delta < X regardless of spread/DTE, or mechanical rewrite anchored to old strike (forbidden by mission, correctly — especially after decline, §9 Path E).

**Verdict:** Lower rail should not be delta alone. Replace with composite: (Δ ≤ 0.07 *or* ≥75% premium captured) AND (DTE and spread checks) AND (rewrite only if fresh-qualifies, else stay uncovered/expired). Delta summons review; premium-captured + extrinsic + DTE decide.

---

## 9. Behavior across market regimes (Paths A–H)

Judged for growth investor. BAND = delta-triggered management; FIXED = fixed low-delta hold-to-expiry; INTER = intermittent/uncovered-by-default; PART = partial coverage.

| Path | Call behavior | Band behavior | Likely net vs simpler |
|---|---|---|---|
| **A. Smooth sustained rally** | Delta climbs steadily through rails | Repeated BTC/roll-up debits + spreads; cap chases with lag; premium ledger negative on calls, shares carry return | **Band ≤ FIXED ≤ buy-and-hold.** FIXED caps once/month; band pays extra rolls for similar trailing cap. |
| **B. Explosive/gapping rally** | Overnight Δ 0.20→0.90; BTC near intrinsic | Rail discovered late; BTC-only after gap or accept assignment; up-and-out large debit/far duration | **Band ≈ FIXED (both capped); PART wins** (uncovered gaps fully). No daily rule trades at rail price in gap. |
| **C. Rally then immediate collapse (whipsaw)** | Roll-up near top; then stock falls, new far call collapses | Pays debit/spread at top, holds now-cheap call (lower rail BTC/expire); mission forbids strike-anchoring, correctly | **Band < hold-to-expiry.** Roll cost sunk at worst moment. Israelov reversal exposure is statistical shadow of this path [Peer-reviewed]. |
| **D. Long decline** | Call decays OTM, Δ→0, lower rail fires | Harvest/BTC cheap + rewrite for shrinking premium; temptation to roll down must be resisted | Any overwrite cushions only by premium — small vs drawdown (BXM max DD −35.8% vs −50.9% S&P since 1986 [Institutional/Index]). Premium ≠ protection. Band adds turnover in falling market. |
| **E. Decline then sharp recovery** | Calls rewritten at depressed prices/strikes in D; recovery slams low cap | If D rewrites anchored near depressed strikes, recovery capped early — most damaging for growth. Defense: re-select at entry delta from *current* spot, never anchor; willingness to sit uncovered | **INTER/PART win.** Staying uncovered through trough preserves V. Band safe only with strict fresh-entry + uncovered willingness. |
| **F. Sideways/high-vol** | Rich premium, delta oscillates mid-band | Few rail crossings; premium harvest best; occasional harvest-BTC+rewrite | **Overwrite home turf.** Band ≈ FIXED; both modestly beat BH (VRP ~2%/yr at ATM [Peer-reviewed]). Watch spread on frequent harvests. |
| **G. Low-vol grinding bull** | Thin premium, slow delta creep | Repeated small defend-rolls; each “credit” needs more duration; treadmill maximal | **Band < FIXED < buy-and-hold, plausibly.** BXMD edge came from *not* over-managing 30Δ monthly [Institutional/Index]. VRP smallest while friction unchanged — active management worst regime. |
| **H. Vol shock, no direction** | IV spike inflates price and delta; rails fire on vol alone | Delta-only BTCs at vol peak (realizes vol loss) or rolls into rich premium (good sale, bad trigger) | Multidimensional rule (delta+moneyness+DTE+IV) strictly dominates delta-only. BTC-at-peak canonical unforced error. |

**Cross-path summary:** Band plausible wins confined to choppy/sideways where any overwrite works; distinctive losses concentrate whipsaw (C), grinding bull (G), vol-shock (H) — active ingredient (frequent re-capping) most costly exactly when growth investor most cares (strong/recovering markets A/B/E). Asymmetry is core prior experiment must overcome.

---

## 10. Comparison with simpler low-delta strategies

**Permanently lower delta, hold to expiry (FIXED).** BXMD (30-delta monthly) existence proof with 32+yr record: annualized 10.7% mid-1986–Jul 2018, +2,527% cumulative, “generally bigger upside moves during bull markets than BXM,” lower vol than S&P 500 [Institutional/Index — https://www.indexologyblog.com/2018/09/04/strong-returns-over-32-years-for-bxmd-index-that-writes-otm-spx-options/]. Growth investor would push 0.10–0.20Δ at thinner premium. Captures “more upside, less premium” without any intra-life decisions.

**Fixed profit-target management.** Close at 50% premium captured and/or 21 DTE, then decide afresh whether to rewrite — including not [Practitioner-Q]. Harvests fast early theta, truncates high-gamma tail Israelov identifies [Peer-reviewed], never chases rising cap (no upper-rail roll). For growth, lower rewrite propensity after profit-taking (only if fresh standards met) → “overwrite, but often uncovered.”

**Conventional roll-up-and-out at expiry only.** Restrict rolls to expiry event (BXM/BXY monthly cadence): caps turnover at 12 decisions/yr, never pays mid-life BTC spreads, bounds treadmill by calendar.

**Assessment:** If delta-band cannot beat FIXED and profit-target baselines net of costs, it has no case — they already deliver “low cap + periodic freedom” with fraction of trades. Experiment crux (§18).

---

## 11. Comparison with intermittent overwriting

Sell only when IV compensates (BXMC conditions coverage on VIX≥20 [Institutional/Index]; practitioner IV-rank >30 [Practitioner-Q]); otherwise deliberately uncovered. Deliberate uncovered periods directly serve growth mandate, zero roll friction.

No index isolates “IV-timing skill,” so remains reasoned prior not measured edge — but cost advantage arithmetic. INTER arm in experiment (§18) tests IV-rank ≥50 gate, hold to expiry.

Intermittent vs band: band is path-adaptive covered→uncovered *after* rallies (procyclical re-capping, §9); intermittent is valuation-adaptive covered *when paid*, uncovered when cheap — philosophically opposite timing. For growth, intermittent’s logic (get paid to cap, else don’t cap) aligns better with “premium secondary” than band’s logic (always capped, chase cap upward).

---

## 12. Comparison with partial overwriting

Overwrite fraction (e.g., calls on 100–200 of 500 shares): full upside on uncovered remainder, premium on covered slice. Upside participation linear and *guaranteed* (no roll re-caps uncovered shares); premium scales with coverage; assignment met from covered slice without disturbing core; decision collapses to coverage ratio, no rails to police.

Institutional evidence coverage ratio is first-class lever:
- **BXMH** half unit ATM monthly, long unchanged [Institutional/Index methodology https://res-certification.cboe.com/api/global/us_indices/governance/Cboe_Half_Buywrite_Indices_Methodology.pdf]
- **BXMC** state-dependent 1 vs ½ by VIX≥20 [Institutional/Index https://res.cboe.com/us/indices/dashboard/bxmc/] — dynamic at coverage margin, re-decided monthly at entry, NOT delta-rail rolling.
- BMO active funds vary coverage in flexible ranges [Vendor http://fundlibrary.com/Articles/Detail/covered-call-etfs-the-total-return-approach/2278]

**Band vs partial:** Partial achieves band’s stated goal (“don’t cap all upside”) *structurally*, zero monitoring, zero roll friction, no whipsaw pathology. Band’s only theoretical edge is path-adaptivity (covered flat, uncovered after rallies). Given §9, adaptivity is procyclically costly (re-caps after strength). **For 500-share growth holder, calls on 100–200 shares at low delta is simplest strong baseline in study; burden of proof on band to beat it.**

Contract granularity caveat: 100 shares = one contract, partial impossible at that size. Partial requires ≥200–500 shares to be meaningful. Where position is exactly 100 shares, choice is binary (covered or not), making intermittent timing and delta/entry selection relatively more important — but still not evidence for intra-life rolling.

---

## 13. Relevant index and empirical evidence

**Comparable-dataset warning.** BXM (first calculation Jun 1986; launched 2002), BXY (1988), BXMD (1986), BXMH (first value Jan 1990; launched Sep 2020 — heavily backtested) share Cboe total-return, VWAP-sale, SOQ-settlement conventions, so *within-Cboe* comparisons over *common window* meaningful. Comparisons to other windows (Callan 1988–2006, Ibbotson 1988–2004) or tradable ETFs (American options, fees, ELNs) not apples-to-apples; windows attached to numbers.

| Evidence | Window | Result |
|---|---|---|
| BXM factsheet (Cboe, Dec 31 2025) | Jun 1986–2025 | BXM 8.5% ann, 10.7% vol, maxDD −35.8%, beta 0.62, Sharpe 0.54 vs S&P 500 TR 11.1%, 15.2%, −50.9%, Sharpe 0.56. Trailing 1-yr 8.9%, 10-yr 7.3% [Institutional/Index https://prefblog.com/wp-content/uploads/2026/02/CboeGlobalIndices_BXM-Index_Factsheet_251231.pdf] |
| Callan (via secondary) | 1988–2006 | BXM 11.77% at 9.29% vol vs S&P 11.67% at 13.89% — equal return, ~⅔ vol in window with two bears [Institutional, summarized https://www.moneysense.ca/columns/past-performance-of-the-cboe-sp-500-buywrite-index-bxm/] |
| BXMD (Indexology/Cboe) | mid-1986–Jul 2018 | 10.7% annualized (highest of nine shown), lower vol than S&P, +2,527% cumulative, more bull upside than BXM [Institutional/Index https://www.indexologyblog.com/2018/09/04/strong-returns-over-32-years-for-bxmd-index-that-writes-otm-spx-options/] |
| Calendar years BXM vs S&P | 2003–2021 | BXM outperformed only 4 of 19 years; 2013 S&P +32.39% vs BXM +13.26%; 2019 +31.49% vs +15.68%; 2008 −37.00% vs −28.65% (BXM wins losing less) [Institutional data secondary https://WWW.FTPORTFOLIOS.COM/Commentary/MarketCommentary/2022/5/5/this-covered-call-index-tends-to-outperform-the-sp-500-when-returns-are-modest-or-down] |
| Israelov & Nielsen | Mar 1996–Dec 2014 | Short-vol ~2%/yr (Sharpe ~1.0, <10% risk); timing ~25% risk ~0 return; OTM (BXY-like avg delta 0.70 at sale — note: delta of combined position exposure in their scaling) keeps more equity premium than ATM (0.50) with similar short-vol [Peer-reviewed] |

**Bull upside capture plainly:** strongest bull years shown (2013, 2019), full ATM overwriting captured ~40–50% of index gain. OTM/delta writes capture more by construction, partial more again on uncovered slice, *no located index shows intra-life rolling capturing more still*.

**Skew:** Buy-write negatively skewed vs underlying (capped right tail, retained left tail partially cushioned); Israelov beta asymmetry downside 0.85 / upside 0.46 for BXM same fact in beta form [Peer-reviewed]. Growth investor by mandate buyer of right tail — every overwrite sells asset they most want to keep. Premium must be worth sale each time at entry — “independently qualify” restated as portfolio theory.

**What indexes cannot tell us:** whether rolling on delta rails beats holding to expiry. Every Cboe buy-write holds to expiry. Silence from institution that productized every neighboring rule for 20+ years is weak evidence against rail (exchanges profit from turnover, viable rolling index not obviously suppressed) — not proof.

**Could not verify:** single-window BXMD/BXY/BXMH factsheet table (Cboe PDFs did not render in fetcher — flagged for direct pull); BXMC conditioning alpha vs coverage effect; any peer-reviewed test of 50%-profit/21-DTE on covered calls specifically.

---

## 14. Execution-cost and liquidity implications

- **Every roll crosses two spreads.** Practitioner anatomy [Practitioner, arithmetic sound]: $0.10/leg spread ×2 legs ×3 rolls = $0.60/contract given up; “on 10-contract position, $600 — just in slippage” (https://medium.com/@peter_pru_prusinowski/the-hidden-cost-of-rolling-when-adjustment-becomes-overtrading-7fb8d72924fa). Open-source band spec defends: legs spread-gated separately, failed rewrite downgrades to BTC-only [Practitioner].
- **Academic spread levels:** Muravyev & Pearson: conventional effective spreads overstate true costs (traders time executions), yet adjusted effective spread still averages ~5.2% of option midpoint (quoted wider) [Peer-reviewed summary https://www.researchgate.net/publication/4769320_The_Behavior_of_Bid-Ask_Spreads_and_Volume_in_Options_Markets_during_the_Competition_for_Listings_in_1999]. On $0.80 low-delta call, 5% of mid = $0.04/share per side — before commissions/fees ($0.50–$0.65/contract/side retail typical plus exchange/OCC). Low-delta calls cheap dollars, expensive percent: spread as share of premium rises as delta falls, taxing strikes growth investor prefers and harvest-BTC lower rail commands.
- **Turnover math:** Hold-to-expiry monthly = 12 STOs/yr (+ settlements, no BTC spread). Two-rail band active year plausibly 25–60 executions. Even SPY/QQQ ($0.01–$0.05 spreads), band must earn back multiple of FIXED friction before “management alpha”; single names hurdle multiplies.
- **Timing/assignment:** No after-hours options execution (equity options end 16:00/16:15 ET) while shares gap overnight; assignment notices after fact; ex-dividend early exercise can remove shares before morning check (§4); pin risk at expiry coin-flip daily checker cannot trade. SPX index evidence contains none.
- **Thin evidence:** No located study isolates retail roll-execution shortfall for covered calls. Experiment must model (bid STO, ask BTC, slippage sensitivity 25%/50%/100% of spread) rather than cite (§18).

---

## 15. Strongest evidence FOR dynamic management

1. **Cap is live liability, not set-and-forget sale.** As Δ→1 covered call becomes deferred sale at old strike; growth investor who would not sell shares at that price today is mis-holding. Rail forces re-underwriting at moment it matters (mission framing; practitioner tables [Practitioner]).
2. **Early BTC on lower rail is cheap convexity repurchase.** BTC at 75–90% premium captured redeploys during fastest theta, truncates high-gamma expiry window Israelov identifies as timing-risk peak [Peer-reviewed mechanism; Practitioner-Q 50%/21-DTE exploits same fact].
3. **Discipline against real behavioral failures** — strike-anchoring after rallies (“roll till I’m whole”) and premium-chasing after declines (roll down, cap recovery). Band with fresh-entry qualification/no-anchoring, as mission and open-source spec specify, genuinely better *process* than ad-hoc rolling [Practitioner].
4. **State-dependent coverage institutionally endorsed in spirit** (BXMC VIX-conditioned; active funds vary coverage [Institutional/Index; Vendor]) — band is finer-grained cousin of accepted idea.

Note: FOR case is process/mechanism, not measured net performance. No FOR item is peer-reviewed performance evidence for delta-rail rolling itself.

---

## 16. Strongest evidence AGAINST dynamic management

1. **No demonstrated net benefit.** Zero peer-reviewed/index evidence intra-life delta management beats hold-to-expiry at entry-selected delta — while friction added is certain/quantifiable (§14). Extraordinary turnover requires extraordinary evidence; none exists.
2. **Systematically sells low / buys high along path.** Short call convexity clusters BTCs near local highs (intrinsic-rich) and rewrites near local lows (premium-poor) — Israelov reversal exposure with commissions [Peer-reviewed]. Whipsaw (Path C) is strategy geometry, not bad luck.
3. **Controller unstable where it matters.** Near expiry gamma, gaps (no trading), vol shocks (delta without price) rail fires late/false/never (§4). Institutions delta-managing do so hedging with underlying daily (Israelov risk-managed), not rolling options through spreads.
4. **Simpler structures dominate on first principles for this mandate.** Partial guarantees uncapped upside on chosen fraction zero monitoring; fixed low-delta (BXMD 32-yr record) trails bulls least among full overwrites; conditional entry (BXMC) skips cheap-vol sales. Band must beat all three after costs — unmet burden.
5. **Duration treadmill + assignment leakage** convert tactical overwrite into permanent short-vol with dividend/early-exercise leaks on American options (§7, §4) — portfolio growth investor never explicitly chose.

---

## 17. Important questions for which good evidence does not exist

**Not demonstrated (open):**
- (a) Any net-of-cost advantage of delta-rail rolling vs fixed low-delta hold-to-expiry — untested in located literature.
- (b) Optimal rail placement, DTE gating, roll limits — practitioner values (0.12/0.45; 50%/21-DTE) conventions, not estimates.
- (c) IV-conditioned overwriting timing skill (BXMC mechanical; no located study attributes returns to conditioning vs reduced coverage).
- (d) Treadmill outcome measurement.
- (e) Retail execution shortfall on covered-call rolls.
- (f) Whether multidimensional trigger (delta+moneyness+DTE+IV) outperforms delta-only or profit-target-only in controlled test.
- (g) Single-name (vs index/ETF) delta-band behavior under earnings gaps/ idiosyncratic vol — no located study; index evidence may not transfer (prior Wheelwright boundary: index vs single-name VRP, Driessen et al. — single-name VRP ~zero/negative).

**Demonstrated (do not relitigate):** Covered calls cap upside/lag strong bulls (index record); ATM full overwriting ~40–50% capture of strong bull years; compensated short-vol ~2%/yr <10% risk with uncompensated ~25%-risk reversal rider (Israelov & Nielsen); same-expiry roll-up debit by no-arbitrage; roll credit ≠ profit (accounting); delta > risk-neutral ITM probability (model math); BXMD-style fixed 30-delta monthly multi-decade record high equity-like returns lower vol — for that static rule.

Distinction matters: absence of evidence for band is not evidence band fails — it is reason to require experiment (§18) rather than adopt or dismiss by folklore either way. Do not default to conservative folklore; do not assume candidate correct. Follow evidence: currently, evidence supports baselines, is silent on band.

---

## 18. Recommended smallest Wheelwright experiment

**Verdict:** Yes, two-rail delta policy deserves exactly one small falsifiable experiment — practitioner rule coherent, widely mirrored, untested vs strong baselines. Not a large one until it beats fixed low-delta net of costs.

**Design (pre-register all):**

- **Underlying:** One highly liquid broad ETF — **SPY** (deep penny-wide options; American exercise + dividends make it harder than SPX indexes, honest for growth use). Single names excluded (idiosyncratic gaps/earnings swamp policy comparison at feasible N). Optional robustness twin: QQQ (not in primary).
- **Common entry (all overwrite arms):** Sell **0.16–0.20 delta, 35–45 DTE**, only if quoted spread ≤10% of mid and ≤$0.05 (else stay uncovered that cycle; log skip). Evaluate **once daily at close** (15:45 ET marks); execute in simulation at next open bid/ask to forbid close-price fantasy fills — or same-close bid/ask with stated slippage haircut; pick one, freeze it.
- **Arms (five, no more):**
  1. **BH:** Buy-and-hold (ceiling/floor reference).
  2. **FIXED:** Entry as above, hold to expiry, rewrite next cycle (BXMD-spirit at growth delta).
  3. **BAND:** FIXED + rails: upper Δ ≥0.45 with ≥10 DTE remaining (inside 10 DTE switch to expiry protocol); lower Δ ≤0.07 *or* ≥75% premium captured. On rail, only permitted: BTC-to-uncovered or BTC+rewrite **iff** replacement passes fresh-entry standards (delta/DTE/spread/IV vs own history); max replacement DTE 45d; **max 1 roll per cycle**; after BTC-to-uncovered, **no rewrite for 5 trading days** (anti-churn dwell). Expiry protocol: BTC any ITM call at 7 DTE if assignment unwanted (pre-declared), else allow settlement/assignment and restart as new episode. Additional research-suggested gates: upper rail requires **S ≥ K** (moneyness co-trigger, kills Path-H vol-only BTCs); no net DTE extension across episode (replacement DTE ≤ entry DTE remaining + original tenor cap — treadmill killed by construction).
  4. **INTER:** Overwrite only when IV rank (1-yr) ≥50 (else uncovered); hold to expiry (BXMC-spirit at entry margin).
  5. **PART:** Overwrite **50%** of shares at common entry, hold to expiry (BXMH-spirit). Simulate 500 shares so fractions exact under contract granularity.
- **Costs:** STO at bid, BTC at ask, settlement at intrinsic; commissions/fees at stated retail schedule; report at 0.5×, 1×, 2× realized spread.
- **Sample:** Maximum available SPY options history with survivorship-clean chains (≥10 years spanning 2020 crash/recovery, 2022 bear, 2023– bull); walk-forward parameter freeze (rails ex-ante from practitioner values, not fitted); cycle-level block bootstrap CIs (~120 monthly cycles small, overlapping rolls autocorrelated — wide intervals expected, itself a finding).

**Changes research suggests to naive band:** DTE-gate rails (no delta actions inside 7–10 DTE except expiry protocol); moneyness co-trigger (S≥K); cap replacement DTE at entry DTE; BTC-to-uncovered first-class dwell-protected outcome, not failure state.

---

## 19. Specific hypotheses and falsification criteria

**Metrics (growth-mandate order):** Terminal wealth/CAGR; upside capture in best underlying quartile of months; max drawdown and downside capture; premium ledger (ΣSTO − ΣBTC) reported *separately* from total P&L; turnover (executions/yr), total spread+fees; days covered vs uncovered; DTE-extension days (treadmill gauge); assignment count.

**Hypotheses:**

- **H1 (primary, upside):** BAND best-quartile upside capture > FIXED by economically meaningful margin (pre-register threshold, e.g., ≥5pp) net of 1× costs.
- **H2 (primary, wealth):** BAND terminal wealth > FIXED net of 1× costs over full sample.
- **H3 (non-inferiority, risk):** BAND max drawdown not worse than FIXED by > pre-registered margin.
- **H4 (mechanism):** BAND outperformance, if any, is attributable to days uncovered / BTC-to-uncovered decisions, not to roll-up-and-out replacements (decompose P&L by action type). If H4 fails (rolls themselves lose, uncovered time wins), correct conclusion is “intermittent uncovered works,” not “staircase works.”
- **H5 (treadmill):** BAND DTE-extension days and rolls/cycle remain within caps and do not predict worse outcomes in Paths A/G subsamples.
- **H6 (lower rail):** Lower-rail BTC+rewrite cycles outperform lower-rail BTC-and-wait and hold-to-expiry sub-cycles on premium captured per day covered, net of spread. If not, lower rail should be premium-captured/DTE rule, not delta.

**Falsification / kill criteria (pre-commit):**

- **Reject BAND** if it fails H1 *or* H2 vs FIXED at 1× costs (must beat on both terminal wealth and bull-quartile capture, without worse maxDD, full sample and bull-only subsample). Otherwise FIXED/PART/INTER stand.
- **Reject BAND** if outperformance disappears at 2× spread sensitivity while FIXED/PART survive — complexity not robust to execution reality.
- **Reject roll-up component** if H4 shows BTC-to-uncovered accounts for all gain and roll-ups subtract — retain at most “BTC to get uncapped” rule, which is INTER by another name.
- **Reject delta as lower-rail controller** if H6 fails — replace with premium-captured % + DTE + spread rule.
- **Do not optimize:** No rail-fitting after seeing results in primary test. Parameter sensitivity (e.g., upper 0.40/0.50) is secondary robustness, reported labeled as such, not used to rescue primary.

---

## 20. Bibliography (primary first; URLs verbatim as retrieved 2026-10-02)

**Peer-reviewed / academic**
1. Israelov, R. & Nielsen, L.N. (2015). “Covered Calls Uncovered.” *Financial Analysts Journal* 71(6). SSRN: https://papers.ssrn.com/sol3/papers.cfm?abstract_id=2444999&mirid=1 — Full text: https://assets.super.so/e46b77e7-ee08-445e-b43f-4ffd88ae0a0e/files/81be3cf6-33d8-4640-876b-fbb5d133e73a.pdf
2. Israelov, R. (2017). “PutWrite versus BuyWrite: Yes, Put-Call Parity Holds Here Too.” SSRN: https://papers.ssrn.com/sol3/papers.cfm?abstract_id=2894610
3. Szado, E. & Schneeweis, T. (2010). “Loosening Your Collar: Alternative Implementations of QQQ Collars.” *Journal of Trading* 5(2). https://www.pm-research.com/content/iijtrade/5/2/35
4. Muravyev, D. & Pearson, N.D. Option trading costs (summary record): https://www.researchgate.net/publication/4769320_The_Behavior_of_Bid-Ask_Spreads_and_Volume_in_Options_Markets_during_the_Competition_for_Listings_in_1999
5. Figelman, I. (2008). “Expected Return and Risk of Covered Call Strategies.” *Journal of Portfolio Management* (record): https://www.researchgate.net/publication/247906220_Expected_Return_and_Risk_of_Covered_Call_Strategies

**Institutional / index provider**
6. Cboe BXMD dashboard (30-delta methodology): https://ww2.cboe.com/us/indices/dashboard/BXMD/
7. Cboe BXY dashboard (2% OTM methodology): https://res.cboe.com/us/indices/dashboard/BXY/
8. Cboe BXMC dashboard (VIX-conditional coverage): https://res.cboe.com/us/indices/dashboard/bxmc/
9. Cboe Half BuyWrite Indices Methodology (BXMH/BXRH): https://res-certification.cboe.com/api/global/us_indices/governance/Cboe_Half_Buywrite_Indices_Methodology.pdf
10. Cboe BXM factsheet (Dec 31, 2025; via mirror): https://prefblog.com/wp-content/uploads/2026/02/CboeGlobalIndices_BXM-Index_Factsheet_251231.pdf
11. Moran, M. / Indexology: “Strong Returns Over 32+ Years for BXMD Index” (2018): https://www.indexologyblog.com/2018/09/04/strong-returns-over-32-years-for-bxmd-index-that-writes-otm-spx-options/
12. Neuberger Berman white paper, index option-writing benchmarks: https://www.nb.com/-/media/NB/Article-Assets/wp_index_option_writing_strategy_benchmarks.ashx
13. Morningstar on JPMorgan Equity Premium Income (JEPI): https://global.morningstar.com/en-gb/etfs/this-jpmorgan-etf-targets-high-income-us-stocks

**Exchange / OIC-style education**
14. OIC covered-call feature (via TheStreet): https://www.thestreet.com/investing/oic-special-feature-covered-calls-11373043
15. Webull/OIC-style covered-call education (early assignment, dividends): https://www.webull.com/learn/R4yy3g/HRwsEk

**Broker / practitioner-quantitative**
16. Saxo, “Rolling options explained — FAQ”: https://www.home.saxo/en-sg/content/articles/options/rolling-options-explained---04---frequently-asked-questions-and-real-world-scenarios-02102025
17. Options Playbook (Ally), “Rolling a Covered Call”: https://www.optionsplaybook.com/managing-positions/rolling-covered-calls
18. Tastytrade-methodology open-source implementations (50% profit / 21 DTE / IV-rank): https://github.com/jrszilard/trading-bot and https://github.com/cmike444/tastytrade-mcp/blob/HEAD/skills/trading-strategies/references/vrp.md

**Practitioner (existence/process only)**
19. Delta-band covered-call spec (harvest <0.12 / hold 0.12–0.45 / defend >0.45): https://github.com/jasebrodsky/trading/blob/HEAD/.cursor/skills/robinhood-delta-band-cc/SKILL.md
20. “Optimizing Covered Call Defense: When to Roll, When to Close, and Delta Triggers”: https://wheelstrategyoptions.com/blog/optimizing-covered-call-defense-when-to-roll-when-to-close-and-delta-triggers/
21. Covered-call delta selection / dynamic delta bands: https://cashflowmachine.net/covered-call-delta-selection/
22. “The Hidden Cost of Rolling: When Adjustment Becomes Overtrading”: https://medium.com/@peter_pru_prusinowski/the-hidden-cost-of-rolling-when-adjustment-becomes-overtrading-7fb8d72924fa
23. Option Alpha, “Cost of Slippage”: https://optionalpha.com/lessons/the-cost-of-slippage
24. Covered-call mechanics (worked example, dividend check): https://optionpilot.ainvest.com/blog/how-to-close-or-roll-a-covered-call and https://optionpilot.ainvest.com/blog/how-to-sell-a-covered-call

**Vendor (lowest weight; product design only)**
25. BMO covered-call approach (active coverage/strike, partial): http://fundlibrary.com/Articles/Detail/covered-call-etfs-the-total-return-approach/2278
26. First Trust, BXM vs S&P calendar years (Bloomberg data): https://WWW.FTPORTFOLIOS.COM/Commentary/MarketCommentary/2022/5/5/this-covered-call-index-tends-to-outperform-the-sp-500-when-returns-are-modest-or-down

*Historical/hypothetical index or study results as labeled; index methodologies exclude retail commissions, fees, and American-option assignment effects unless stated. Decision support, not investment advice.*

---

## Compact conclusion — questions A–I answered independently

**A. Is delta-band covered-call management economically coherent?**  
Yes as process, unproven as performance. Coherent form: delta as reconsideration trigger + DTE gate + moneyness co-trigger + fresh-entry qualification for any replacement + BTC-to-uncovered genuinely allowed + roll/DTE caps. Incoherent form: automatic roll on delta, roll-credit-as-profit accounting, strike-anchoring. Coherence does not imply superiority.

**B. Is the upper delta rail a useful mechanism for mitigating capped upside?**  
Useful as *alarm*, not demonstrated as *mitigation*. It correctly identifies when position delta has collapsed (100×(1−Δ) retained) and forces re-underwriting. Whether acting on it (BTC/roll) leaves investor better off than holding FIXED to expiry is untested; accounting shows action costs debit/spread and usually re-caps. Mitigation claim requires experiment H1/H2/H4.

**C. Does repeated upward rolling actually preserve meaningful upside after its costs?**  
Not demonstrated. What it preserves is a higher *terminal cap strike*, purchased by realized BTC losses + new liabilities + friction (20–50% of initial premium plausible over 4 rolls on liquid ETFs, worse single names) + often duration. Net preserved upside after costs is exactly what no located source measures. “Staircase” describes strike path, not wealth path (§6).

**D. Is the lower delta rail useful, or should another observable govern exhausted-call closure?**  
Delta alone is the weakest rail; replace as primary controller. Govern exhausted-call closure by **% premium captured (e.g., ≥75%), extrinsic remaining, DTE, and spread-as-%-of-mid**, with delta as secondary review prompt and rewrite only on fresh qualification. Lower-rail delta <0.07 can stay as one input in composite, not trigger (§8, H6).

**E. Does dynamic management appear superior to simply selling farther-OTM/lower-delta calls?**  
No — not on current evidence. Fixed low-delta hold-to-expiry (BXMD-spirit at 0.30Δ institutional; 0.16–0.20Δ growth version untested as index but same construction) is the baseline with multi-decade record and minimal friction. Burden on BAND to beat FIXED net of costs (H1/H2); until then, simpler appears superior by default of evidence + cost arithmetic, while strictly “band fails” is not demonstrated.

**F. Does dynamic management appear superior to intermittent overwriting?**  
No demonstrated superiority; intermittent has stronger first-principles alignment for Growth (cap only when IV pays; deliberately uncovered otherwise; zero roll friction) and institutional cousin BXMC (coverage conditioned on VIX). Band’s timing is procyclical (re-cap after strength); intermittent’s is valuation-based. Experiment INTER arm is co-equal contender, not straw man.

**G. Does partial overwriting solve the Growth objective more simply?**  
For positions ≥200–500 shares, yes — most simply and most robustly of any alternative studied. Guarantees uncapped upside on uncovered fraction structurally, eliminates rails/monitoring/whipsaw, scales premium by coverage ratio, institutional precedent BXMH (half) and BXMC (½ vs 1). Only limitation is contract granularity at 100 shares. Where partial feasible, it is default Growth solution to beat.

**H. Is there enough evidence to justify a Wheelwright experiment?**  
Yes — enough to justify *one small* experiment, not adoption. Justification: practitioner rule exists in near-identical form, mechanism coherent as re-underwriting prompt, question untested vs strong baselines, and Wheelwright can test with realistic bid/ask on SPY. Absence of literature evidence plus certain friction costs is precisely falsifiable setup. Not enough evidence to justify implementation, parameter optimization tour, or single-name rollout.

**I. If yes, what is the ONE experiment we should run first?**  
The §18 five-arm SPY test, pre-registered and frozen: BH vs FIXED (0.16–0.20Δ, 35–45 DTE, hold to expiry) vs BAND (FIXED + upper Δ≥0.45 & S≥K & ≥10 DTE, lower Δ≤0.07 or ≥75% captured, max 1 roll/cycle, replacement DTE ≤45d with no net episode extension, BTC-to-uncovered with 5-day dwell, legs fresh-qualify) vs INTER (IV-rank ≥50 else uncovered) vs PART (50% coverage). Daily close evaluation, next-open (or haircut close) bid/ask execution, 0.5×/1×/2× spread sensitivity, ≥10yr SPY chains. **Kill BAND unless it beats FIXED on both terminal wealth and best-quartile upside capture at 1× costs without worse max drawdown (full + bull subsample).** Decompose BAND P&L by action (H4) so “uncovered time won” is not misread as “staircase won.”