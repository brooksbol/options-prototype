# EVA-001 — Empirical Expected Value Feasibility Protocol

Version: DRAFT 0.1, October 14, 2026. Author: Codex, investigating actor.
Current authorization: data-feasibility audit and protocol drafting only. This is not a frozen preregistration, approved management policy, backtest result or authorization to acquire a bulk dataset. Muse primary-source research and independent protocol challenge are pending.

## 1. Question and independent tests

Can information available at entry improve estimates of **net P/L under a fixed management policy** for 30–60 calendar-DTE ETF iron condors, relative to simple prior-only baselines?

Two tests have separate endpoints:

1. **Forecast feasibility:** Does additional option-market/volatility information improve out-of-sample managed net-P/L predictions? Secondary: does it improve target-before-time-exit probability predictions?
2. **Economic usefulness:** Does a predeclared rule using those predictions improve net portfolio outcomes against the same unfiltered policy under matched capital and execution assumptions?

Neither test proves alpha. Neither assumes that a complete physical or risk-neutral density must be constructed. Mean estimates cannot establish tail protection: report realized consequence distributions and their uncertainty separately. The entry study does not establish hold/close/roll/hedge comparisons for current positions.

## 2. Conditional scope and data pilot

**Primary proposed population:** SPY, standard unadjusted 100-share physically settled options, one-unit equal-quantity short iron condors, single expiration. XLE and EWZ are predeclared secondary replications when they pass identical data tests. This is a specified ETF panel, not all liquid ETFs or an options-selling population. Population choice comes from the commissioning request, not historical profitability.

Before labels/model fitting, freeze a coverage manifest listing candidate dates, expirations, sources, rights, adjusted-contract exclusions and coverage failures. Assess missingness by date/symbol/volatility state using only coverage and contemporaneous features, not later profits. Do not quietly move the start date past adverse markets or retain only contracts with complete successful exits.

**Proposed bounded pilot, requiring retrieval access:** enumerate option availability for three preselected historical anchor sessions per symbol: March 16, 2020; August 5, 2024; September 2, 2026. Unavailable dates stay in the report. They are stress/recent coverage probes, not performance samples. Select the expiration nearest 45 calendar DTE within 30–60, ties to earlier expiration, using historical listings. Inspect one candidate's four legs on entry, the next trading session and the first session at or below 21 DTE. The 2020 anchor may be outside entitlement; that is a finding, not a reason to buy a new plan or fabricate history.

Bound the pilot to at most 60 authenticated GETs across all symbols/routes, sequential within the verified account rate limit, with request/response hashes, HTTP classifications and no retries for entitlement failures. Request only selected contracts/time windows after listing inspection; no wildcard full-history download. Confirm actual API parameter shapes against the current terminal/docs before execution. If the request budget is insufficient, report incomplete coverage; do not silently expand it. No such pilot has run.

Required pilot checks:

- Historical contract existence, expiry, right, strike, root, deliverable, multiplier and exercise/settlement terms.
- Underlying and all leg quote clocks, bid/ask/sizes/conditions, crossed/zero markets, actual quote age and alignment. Sample timestamp must not be mistaken for last-update timestamp.
- Consistent entry Greeks/IV with source/model/rate/dividend/vintage provenance. Non-null is not valid. If IV/Greeks cannot be recovered, the proposed models/selector below are not ready; revise and freeze a simpler geometry-only design before results.
- Read access to the needed option paths and underlying history; no stock/index-to-option entitlement inference.
- Record-level missingness at both ordinary and adverse times, not only successful HTTP responses.

**Data gates:** A full path pilot supports the managed-policy experiment only if event ordering and quote fitness are observable. EOD-only access supports an explicitly once-daily or expiration-only alternative. No option history supports only data/method feasibility findings. A single historical path is a reconstruction specimen, not a forecast-validation sample.

## 3. Proposed candidate selection

All numbers below are proposed experimental parameters, not Wheelwright policy. They must be challenged and frozen before outcomes are computed; they are not to be tuned to make the strategy profitable.

- Scheduled entries: Wednesday at 10:05 America/New_York, skip market holidays/early closes rather than substituting favorable sessions. Calendar DTE uses contract expiration date; actual quote/session clocks use exchange time including DST.
- Choose expiration nearest 45 DTE within 30–60; ties to earlier expiration. Historical listings only; no selection based on subsequent survival or liquidity.
- Select OTM short put/call nearest absolute entry delta 0.20 from one identified consistent historical analytics source; ties farther OTM. Delta is a selection coordinate, not a probability.
- Target each wing width at 1% of entry underlying price; select the available long strike whose width is closest, ties to wider width. Unequal sides are allowed and recorded. Require long-put < short-put < short-call < long-call. No discretionary replacement trade if a leg fails quality gates.
- Proposed quote gate: positive size of at least one unit on required sides, positive bid, ask >= bid, actual quote age <=60 seconds and leg-update span <=60 seconds at decision time. Provider interval carry-forward without an actual update age cannot pass by inference. Record failures and run predeclared 30/120-second sensitivities if these clocks are available; they are not alternatives chosen after seeing profits.
- Package entry credit must be positive and below both wing widths, using the selected execution scenario. Preserve the coverage denominator for rejected candidates.

If entry delta or actual quote-age requirements are unavailable, report the selection infeasible as written. A geometry-only selector or coarser sampling is a separately disclosed draft revision, not a hidden fallback. No later-outcome-dependent contract substitution.

## 4. Fixed experimental management

**Target:** gross credit capture of 50%; close debit threshold = half the actual simulated opening credit. This is a management objective, not a 50% probability and not an assertion about current brokerage positions.

Primary proposed observation schedule: every five minutes, 10:05–15:55 on regular sessions, beginning strictly after entry. The schedule models periodic observation; it does not claim continuously working-order performance. Daily-only data requires a differently named policy.

At each eligible observation before the time exit, detect the target using the conservative quoted-side package closing debit. An observed trigger places a simulated close for the next observation; use that later market and costs even if the target has reversed. This deliberately avoids equating a favorable midpoint touch with an immediate fill. Stress scenarios may delay execution further; they must share the same clocks and preserve trigger/execution separation.

**Time exit:** close at 10:05 on the first trading session with remaining calendar DTE <=21, using a decision and subsequent execution observation. If a prior target close is already pending, the same close instruction remains pending; do not double trade. Record exit reason and realized capture, which may differ from the objective.

**Expiration and exceptional paths:** with this time exit, ordinary complete paths close before expiration. Expiration is therefore an exception caused by unfilled/missing markets or lifecycle events, not a third interchangeable discretionary exit. Missing exit evidence yields an unresolved outcome and sensitivity bounds; do not discard the trade, invent a favorable fill or assume it survived unchanged to expiration. American early exercise/assignment, distributions and adjusted deliverables require explicit treatment. If their cash/share consequences cannot be established, the result remains a qualified quote-path simulation, not a complete executable portfolio claim. No automatic roll or hedge is modeled.

## 5. Pricing, costs and capital

For one unit, multiplier m=100:

`entry credit = bid(short put) + bid(short call) - ask(long put) - ask(long call)`

`close debit = ask(short put) + ask(short call) - bid(long put) - bid(long call)`

`net P/L = m × (entry credit - close debit) - commissions - fees - modeled slippage + attributable financing/cash flows`

All four legs are observed on a common decision/execution schedule. These formulas are a **quoted-side scenario**, not proof of simultaneous complex-order execution, capacity or guaranteed fill. Legging risk and complex-market improvement remain uncalibrated. Midpoint results are an optimistic diagnostic only, never the headline executable finding. An additional adverse slippage ladder must be frozen from source evidence/explicit assumptions before running; report the break-even extra cost rather than selecting a profitable rung.

Freeze dated broker commissions, exchange/clearing/regulatory fees by leg/side/event. Current fee schedules cannot silently price the full historical window. No numeric fee scalar is certified by this audit; Muse's research assignment covers the evidence and gaps. Fees must be counted once. Display gross and net separately. Historical exercise/dividend treatment must travel with the population.

Normalize the primary forecast target by contractual entry maximum expiration loss plus entry fees, recording this as a risk-capital proxy, not broker buying power. It does not bound execution/assignment-related liquidity needs. Report dollar error and return on this proxy as separate quantities. Capital efficiency includes capital-days, idle cash, turnover and liquidity obligations, not merely annualized per-trade ROI.

The forecast panel may have overlapping scheduled trades. The primary economic simulation uses one active one-unit position at a time, no leverage, an explicitly frozen starting cash balance, and a flat-cash alternative. Signals during an active position are recorded but not traded; rejected entries leave cash idle. Size, cash yield and reinvestment rules must be identical across filtered/unfiltered comparators and frozen before execution. Do not sum overlapping trade returns into a fictitious equity curve.

## 6. Minimal predictive comparison

No full probability-density engine is required. All models estimate the same fixed-policy outcome on the same held-out candidates and execution scenario.

| Model | Proposed inputs | Role |
|---|---|---|
| B0 | Prior completed-trade mean of normalized net P/L; prior target-event frequency | Minimal historical benchmark; no fitted market features |
| B1 | Entry credit/risk ratio, side widths/spot, DTE and identified entry IV | Small fixed regularized regression for managed net P/L; corresponding simple probability model for target-before-time-exit |
| B2 | B1 plus trailing realized variance and an implied-versus-forecast-realized variance feature | Incremental volatility-compensation hypothesis, not proof of a risk premium or a reconstructed physical density |

Use a fixed, transparent low-dimensional estimator; a proposed starting choice is standardized ridge regression and regularized logistic regression, fixed penalty, no feature search. Estimator definitions, IV construction and penalty must be frozen after data/schema inspection and independent challenge. No model is fitted in this stage.

The forecast-realized-variance feature uses only underlying observations available before entry. Any first-stage fitted variance forecast uses training-only labels that have fully matured, with time-respecting cross-fitting for downstream training features. Contract IV and realized variance must refer to a stated matched horizon; averaging distinct provider IV measurements is prohibited. Call the difference an estimated feature until its measurement interpretation is defended. Entry-time features are fixed across the compared models; future implied/realized volatility is never a predictor.

An IV-only lognormal terminal POP is not a valid benchmark for reaching an early profit target. Broker probability benchmarking requires archived, contemporaneous values for the identical event/horizon and methodology; otherwise label it unavailable. Never interpret TT's P50 target as a historical probability observation.

## 7. Chronology, overlap and regimes

Date limits follow verified coverage, not results. Preferred minimum design has 24 calendar months of training plus a later untouched 12-month test period; intervening embargoes/warmup require additional history. Shorter access may support a pilot, not a broad reliability claim. Count independent time blocks, not four legs, every quote, overlapping trades or multiple same-day structures as independent samples.

Use expanding chronological training, fixed annual test blocks and training-only internal validation. Purge training labels whose entry-to-exit windows overlap a test block, with a proposed additional 60-calendar-day embargo. Fit preprocessing and any quantiles only on training data. Freeze the final holdout before outcome inspection; coverage work must not print P/L labels. Record any unavoidable prior exposure to the source history.

Primary paired inference uses calendar-block resampling across all symbols jointly, proposed 90-calendar-day blocks with 60/120-day sensitivity. Cross-symbol stress dependence must survive resampling. Report actual blocks, standard errors/intervals and effective-sample limitations; a small block count yields inconclusive evidence, not pseudo-precision.

Predeclare regime diagnostics using entry-known trailing realized volatility relative to training-only quantiles, plus calendar stress windows identified before results. Regime splits are diagnostics, not model-selection opportunities. No per-regime profitable-parameter rescue and no claim that an accessible 2023–2026 sample contains all tail environments.

## 8. Outcomes, benchmarks and falsifiers

**Forecast primary:** paired out-of-sample squared-error difference for normalized net P/L, B2 versus B1; report B1 versus B0, dollar MAE, bias and uncertainty as secondary diagnostics. **Probability secondary:** target-before-time-exit Brier score, calibration and event counts, with unresolved labels disclosed. One realized P/L does not reveal the true conditional EV; forecast evaluation is across an adequately specified cohort.

**Economic primary:** one-position-at-a-time B2-filtered policy (enter only when predicted net P/L >0) versus the identical unfiltered policy, at matched cash/cost assumptions. No threshold optimization. Report total net wealth difference, trade count, exposure/capital-days, drawdown, worst loss, tail-loss summaries and an explicit simple benchmark adjustment. Flat cash is a second comparator. A risk-adjusted-return statistic or positive raw wealth difference alone is not alpha. Risk benchmarks and economic minimum-relevance threshold must be fixed before execution, with the chosen rationale exposed rather than inferred from test results.

Disposition rules:

- **Data infeasible:** relevant historical contracts/paths/clocks cannot support the proposed labels. Narrow or stop; do not fit fabricated outcomes.
- **Forecast advantage unsupported:** held-out improvement is absent, unstable, too small to be useful or indistinguishable from estimation error. Reject the tested incremental-model claim; preserve the baseline and specification.
- **Economic advantage unsupported:** any predictive improvement fails to improve net results under the fixed policy, or disappears at defensible costs. Reject the tested trading-usefulness claim for that scope.
- **Risk-adjusted advantage unresolved:** apparent profit is explainable by changed tail/exposure/capital risk or too few independent stress observations. Do not label it alpha.
- **Conditional continuation:** robust out-of-sample results justify independent replication, not production adoption. Missingness, cost calibration or regime dependence can still limit the conclusion.

Confidence intervals spanning zero are inconclusive evidence, not proof of equivalence. A model advantage is evaluated against the frozen relevance threshold and cost/assumption sensitivities. A failed variant does not authorize searching structures, symbols, thresholds or dates until profits appear.

## 9. Freeze checklist and division of work

Before a run: verified coverage/entitlement; exact date manifest; candidate/quote thresholds; observation and fill delays; assignment/exception rules; dated fee/slippage scenarios; IV/horizon definition; model equations/penalties; folds/embargo; portfolio cash/risk benchmark; relevance threshold; missingness/bounds; hashes and independent protocol challenge. These are unresolved preregistration fields where source evidence is still pending, not claims that the current draft is executable.

Codex owns local evidence inspection, instrumented research artifacts and eventual analysis only within separately commissioned scope. Muse researches primary evidence through the Principal-relayed [assignment](MUSE-PROMPT.md). The Principal supplies research meaning and tradeoff decisions. Kiro handles any later architectural/governance reconciliation. No actor's source synthesis is independent review of its own eventual implementation.

The current stage ends with the audit, this draft and the Muse handoff. It does not start a backtest, train a model, change v1/v2, purchase data, alter credentials or deploy anything.
