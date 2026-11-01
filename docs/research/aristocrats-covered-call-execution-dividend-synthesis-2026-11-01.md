# Aristocrats overlay — execution and dividend sensitivity synthesis (2026-11-01)

**Standing:** Research interpretation; not ratified Wheelwright Product behavior, universe-selection policy, trade recommendation, or authorization.

## Evidence preserved

- [Initial 70-name 45-DTE liquidity study](external-artifacts/aristocrats-45d-options-liquidity-20261031.md).
- [19-name covered-call execution comparison](external-artifacts/aristocrats-covered-call-execution-20261101.md).
- [Dividend-aware delta and ex-dividend sensitivity](external-artifacts/aristocrats-dividend-sensitivity-20261101.md).

All three are Muse-supplied empirical reports. Their source CSV/Parquet caches remain external and were **not** committed with these Markdown reports.

## Findings supported by the studies

**Liquidity selection:** The 19-name group was defined post hoc from the first 70-name liquidity analysis (16-delta median relative spread <0.50 and both-short availability >0.80). The selection is a research cohort, not a qualified equity investment universe.

**Execution slope:** On matched dates when 10/15/20 delta calls were all quotable, median annualized natural-bid premium rates were 2.3%, 4.2%, and 6.2%, respectively. Relative spreads were 0.667, 0.410, 0.321; haircut from midpoint 33%, 21%, 16%; median reported volume 5, 14, 22. The 20-to-10 delta paired premium rate ratio was median 2.83×, with a 2.50–3.88× range across 19 names. No actual realized returns, assignments, or rolls were inferred. Natural bid quotes do not establish guaranteed fills.

**Dividend-adjusted deltas:** Point-in-time trailing dividend yield (median 2.75% of spot across names) with IV re-inverted under q changed selected strikes on only 5.1% of paired observations. The typical baseline 20-delta call was 0.194 under q-aware delta, but O/TROW/CLX were 0.168/0.177/0.183. Conditional strike changes usually move one grid step, median -2.5% of spot, with median 1.72× entry-bid premium ratio. Aggregate natural-bid yield results remained nearly unchanged; the changed-contract subset differed materially.

**Ex-dividend exposure:** A median 46% of quarterly-payer 45-DTE windows spanned an ex-date, versus 99.6% for monthly payer O. On dividend-spanning windows, cumulative in-window dividend exceeded the 20-delta entry call bid in 50.5% of cases. This ratio is **not** early-assignment probability or an exercise prediction; early exercise needs ITM stock and sufficiently low remaining extrinsic value just before the ex-date.

## Interpretation and limits

The central uncertainty has shifted from theoretical premium quotes to **actual economics of long-term ownership when the call is active**, including assignment, early-exercise exposure, forfeited dividends, foregone rebound upside, and buying back/rolling to preserve ownership.

Do not equate delta with probability of assignment or let the model choose long-term stock ownership. The external investment policy determines holdings; Wheelwright's bounded concern is an options overlay and evidence about its effects.

The layered income benchmark remains only a scenario: $120K rolling 12-month T-bill ladder, $500K long-horizon illiquid non-options layer, $380K tactical sleeve; a 60/40 SPY/individual-Aristocrat balance and about nine positions are exploratory. None is a mandate, adopted allocation, or achieved performance. The Treasury ladder is intended to give the operator discretion to decline unattractive trades. Capital quantization occurs at 100-share lots and discrete strikes.

## Next falsifiable study

Using cached historical chains and issuer/exchange verified ex-dates, compare 10/15/20 q-aware delta covered calls at approximately 45 DTE *against unchanged buy-and-hold of the same stock*. Evaluate expiry and ex-div early exercise using contemporaneous spot/remaining extrinsic; separate ex-spanning and non-spanning episodes and monthly O from quarterly payers. Clearly distinguish an early-exercise *incentive proxy* from observed exercise and early-assignment facts. Compare accept assignment, defensive BTC and rolling only under explicitly defined policies and feasible quotes; never assume midpoint fills or force uninterrupted overwriting. Capture dividends actually earned, sale proceeds, residual cash, upside truncation and NAV with whole lots. If necessary paths and prices or reliable ex-dates are not in evidence, report the bound and stop rather than manufacture outcomes.

No policy is proposed by this memo; empirical results must precede any eligibility or decision standard.
