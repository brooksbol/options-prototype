# TT1 — 19-session short put spread rolling cadence (operator experiment)

**Captured:** 2026-10-29
**Status:** Operator-declared experiment / working protocol, not a ratified Wheelwright Product capability or trading authorization.
**Account:** tastytrade `tt1`.
**Purpose:** Durable cross-chat continuation of a manually operated trading experiment. Wheelwright `tt live` may supply observations; Wheelwright Talk is not yet expected to support this workflow. This document does not design API v2/MCP or authorize software work.

## Objective and central question

Target **at most one new qualified short put credit spread per trading session over 19 trading sessions**, beginning Thursday 2026-10-29 and ending Tuesday 2026-11-24 inclusive (US equity sessions). WAIT is a valid outcome.

Can staggered approximately 45-DTE short put spreads, using mechanical exits, release enough buying power (BP) to sustain the daily entry target without compounding portfolio risk or eroding capacity?

This is **not** a mandate to complete 19 trades or maximize trade count. Executions are operator-controlled.

## Established operator rules

- **Only short put vertical credit spreads** are eligible for new entries; no call spreads, iron condors, CSPs, buy-writes, or naked options in this experiment. Other pre-existing TT1 structures may nevertheless require monitoring.
- Entry DTE **42–52 calendar days**; select a rolling expiration window, never a fixed expiration. On 2026-10-29: Dec 11 (43 DTE) and Dec 18 (50 DTE) eligible; Dec 4 (36 DTE) not eligible.
- **P50 exit:** target close when 50% of original *maximum opening credit* is captured.
- **Time exit:** close at **21 calendar DTE**.
- **Precedence:** whichever target/checkpoint occurs first; target is not a fill, and order execution/released BP must be confirmed.
- Existing positions may exit on an entry day; closing never consumes that day's one-new-entry opportunity.
- New entries require adequate actual BP, execution quality, and acceptable marginal portfolio risk; otherwise **WAIT**.
- Record confirmed open/close fills, original credits, costs, BP consumption/release, realized results and exit-order state. No automated brokerage execution is authorized.

## Baseline — operator-confirmed 2026-10-29, not live-refresh evidence

| Quantity | Baseline |
| --- | ---: |
| Available options BP | $3,281.42 |
| BP committed to SPY + QQQ | approximately $2,600 |
| Approximate combined available + committed | $5,881.42 |

**Do not deduct the $2,600 again** from $3,281.42. Combined capacity is a planning reference, not unrestricted deployable capital. Future BP must be read from the broker.

Known positions opened 2026-10-28:
- SPY Dec 18 2026 **755/739 short put spread**, quantity 1; width $16, gross contractual width $1,600.
- QQQ Dec 18 2026 **700/690 short put spread**, quantity 1; width $10, gross contractual width $1,000.
- Other positions may exist, including **UNG iron condor**; do not presume this is complete TT1 inventory. Verify exact per-position BP, original credits, fees, exit orders, mark and net portfolio exposure from broker records.

## Capital and risk model

Do **not** impose a fixed $1,000 reserve or $250-per-trade allocation. Those were preliminary arithmetic illustrations subsequently rejected as policy.

**Underlying and spread width** are two major determinants of the dollar footprint; **short-strike selection** (delta/distance, credit, risk probability), option-chain granularity, liquidity and current market conditions also matter. A high nominal share price does not mechanically cause high BP consumption for a given width. Lower-priced ETFs often offer practical narrow-width structures, but execution costs may dominate narrow credits.

Candidate trade:
- Gross width exposure = `100 × (short strike − long strike)` for one conventional US ETF spread.
- Theoretical max loss before fees and assignment complications = gross width minus original credit.
- **Broker-reported actual BP reduction** takes precedence over theoretical estimates.
- Daily available BP ledger: `BP_next = BP_prior − confirmed new-entry BP + BP released by confirmed exits ± other broker-reported BP changes`.
- BP released is *not* earned profit or recovered economic capital. Losses and costs may reduce equity and future BP even when collateral is unlocked.
- **Unused BP should emerge from market conditions, current portfolio stress/concentration, broker constraints, opportunity quality and operator-defined risk tolerance**. There is no approved numeric reserve formula yet. Market-estimated loss does not independently establish acceptable loss.
- Assess aggregate maximum loss, conditional downside shocks, sector/underlying overlap, equity beta, volatility changes, assignment/expiration risks, liquidity, and price/credit sensitivity. Defined risk and P50/21-DTE rules do not cap realized loss at a small amount.
- Evaluate whether losses induce an adverse feedback loop: dwindling capital → larger relative risk or worse trades to preserve cadence.

### Illustrative capacity only — invalid as active policy

With available $3,281.42, *hypothetical* $1,000 reserve and $250 BP per trade, `floor((3281.42 − 1000)/250) = 9` new entries without release; the tenth would WAIT. This was a sensitivity example, **not** an adopted reserve, sizing method, or forecast.

Likewise hypothetical 5/10/15 trading-session early-exit holding periods cannot be treated as empirically supported P50 rates. **Conservative minimum early P50 fills = zero.** Simulate actual expiration-calendar 21-DTE checkpoints, weekends and exchange holidays; 21 DTE means calendar days, not 21 sessions.

For a Dec 11 expiration, 21 DTE falls on Nov 20 (within campaign). For Dec 18, 21 DTE falls Nov 27 (outside campaign; shortened market session). Exit execution and BP release remain uncertain. Reevaluate any time checkpoint that falls on a non-trading day.

## Candidate underlying universe — research candidates, not qualified inventory

Initial **14 ETF symbols**, to be checked against today's chains, spreads, liquidity and portfolio concentrations:

- Initial smaller/flexible research set: **XLE, XLF, EWZ, EEM, TLT, HYG**.
- Broader/commodity diversifiers: **IWM, GDX, SLV, GLD**.
- Conditional/high-concentration or capital-intensive: **SPY, QQQ, USO, IBIT**.

None is automatically eligible. No index-option symbol has yet been validated as eligible; the working list is ETFs. Exclude leveraged/inverse ETFs initially. Avoid treating several tickers with shared equity, energy, or metals drivers as independent diversifiers. An ETF's option liquidity and practical spread widths must be checked *for the actual expiry and strikes*. Never invent live quotes, credits, deltas, fills or BP.

## Daily operator routine (one trading session)

1. Read **actual TT1 available BP**, full inventory, pending orders, market-data freshness and current marks.
2. Identify existing positions reaching P50 or 21-calendar-DTE management and address risks; record **confirmed fills**, including costs and actual released BP, not simply triggered targets.
3. Screen the research universe for **42–52 DTE** put options and viable expiry/strike pairs.
4. Construct up to three competitive short put spread candidates using **underlying, short strike and width**, with actual quoted credit, delta, bid/ask quality, likely execution cost and broker BP.
5. Compare *marginal* portfolio risk (aggregate maximum downside, concentration, correlated drawdown and possible volatility expansion) and capital-time productivity; recognize that attractive premium is not sufficient.
6. Select at most **one** admissible trade if market quality and portfolio risk permit. Otherwise record **WAIT** with reason: BP shortfall, unacceptable risk, or no attractive opportunity.
7. On confirmed new fill, set/verify **P50 closing order** and record **21-DTE checkpoint**; capture order acknowledgments, not assumed success.
8. Update daily ledger: opening BP, all entries/exits and timestamps, BP delta, reserve/risk headroom, open concurrent trades, remaining sessions, realized net P/L and next actions.

### Daily output, designed for low cognitive load

`Session date / session # of 19; Actual available BP; BP committed; broker/equity changes; active portfolio stress/risk headroom; positions and near exits; today's 42–52 DTE candidates (symbol, expiry, short/long put strikes, width, delta, bid/ask, credit, fees, max loss, BP, portfolio overlap); confirmed exits/BP released; entry or WAIT reason; trade count; realized net P/L; next operator action.`

Distinguish actual, estimated, scenario and unknown fields explicitly.

## Measurement and tests

Run at least:
- **A: no early P50 fills**; only confirmed 21-DTE time exits (unless risk action intervenes).
- **B: intermediate hypothetical P50 exits**, with explicit exit counts/holding times.
- **C: favorable hypothetical P50 exits**, never labeled forecast.

Stress variable spread widths, dollar BP/credit, holding period, slippage/commissions, losing trades, portfolio correlation, IV regimes, concurrent position count, and late/unfilled exits. The portfolio's free BP is a stochastic path; don't count prospective release before fill.

Track: qualified entries completed (out of 19), WAIT breakdown, median/mean holding sessions, true realized net P/L and drawdown, actual per-spread BP-day productivity, portfolio maximum remaining defined loss, concentration/correlated stress, and whether positive BP release coincides with falling economic equity.

**Success is not 19 fills alone**: cadence, return after costs and acceptable portfolio downside must all be examined. Empirical thresholds for success/failure are not yet ratified; set them before judging results.

## Open decisions and data needs

1. Verify complete broker inventory, the existing SPY/QQQ opening credits, fees, exact BP debits and exit-order state; account may include UNG.
2. Establish portfolio-level risk tolerance and an *adaptive* reserve/risk-headroom rule based on observable inputs, not a fixed-dollar cushion. Calibrate to risk and execution data, avoiding a reserve that simply optimizes trade count.
3. Determine acceptable deltas, width menu, minimum net credit/liquidity and correlation limits from chain evidence and operator choices.
4. Validate the 14-ETF watchlist; replace/remove members when options availability or diversification fails.
5. Create the actual 19-session **calendar-aware** daily BP and equity ledger, updating from confirmed TT1 evidence.
6. Derive early P50 fill frequency/holding time empirically; zero remains conservative default.
7. Keep manual ChatGPT trading operations separate from a potential future Wheelwright Talk Product feature. No implementation or new Product authority is implied.

## Governance / cross-chat resume

This document records an **operator trading experiment**, not a Wheelwright strategy admission. At capture, repository parking-lot `PL-STRAT-01` describes credit spreads as *out of scope for Wheelwright Product absent reconsideration*. Do not silently override it because the operator trades put credit spreads in TT1.

To resume in a new chat: provide this path and say **“Resume TT1 19-session short put spread cadence; start with current session, refresh actual tt1 state, and distinguish confirmed fills from scenarios.”** Reacquire current GitHub main and brokerage observations. If live data are inaccessible, ask for `tt live` output, options chain, or brokerage evidence rather than inventing it.

**Provenance:** Principal/ChatGPT conversation on 2026-10-29, “Tastytrade — 19-Day Rolling Options Cadence Experiment,” with follow-on clarifications: adaptive rather than fixed BP reserve; underlying + width + short strike determine capital footprint; **short put spreads only**; daily ETF candidate shortlist and manual operator routine; persisted for ChatGPT continuity before Talk capability matures.
