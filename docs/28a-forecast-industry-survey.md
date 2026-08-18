# Forecast Industry Survey — Summary of Findings

**Date:** August 18, 2026
**Status:** Research complete; findings incorporated into V2 exploration
**Purpose:** Inform the Forecast design with established industry practice, optimized for household cash-flow planning (not trading prediction or risk management)

---

## Research Objective

Find the simplest defensible industry practices that could help Wheelwright form a directional view of how existing positions are likely to resolve before month-end. Accuracy over precision. Planning usefulness over theoretical optimality.

---

## Key Findings

### 1. Resolution assessment (how practitioners assess likely expiration state)

- **Delta as probability proxy:** Industry consensus (Schwab, tastytrade, Option Alpha) treats |delta| ≈ probability ITM at expiration. Schwab's Probability ITM column is within a few percentage points of delta. Technically risk-neutral probability, not real-world, but "close enough" for operational use.
- **Expected move:** Price × IV × √(DTE/365) = one-standard-deviation range. 68% of outcomes should fall within this band. Useful for determining whether a position is within the "likely range" or far outside it.
- **Near-expiration gamma behavior:** Delta accelerates near expiration for ATM options. Deeply ITM or OTM positions become highly certain. Only near-ATM positions remain uncertain at low DTE.
- **Practical coarse classification:** Deep OTM + low DTE → very likely expires worthless. Deep ITM + low DTE → very likely assignment. Near ATM at any DTE → genuinely uncertain.

### 2. Exercise/assignment mechanics

- OCC auto-exercises if ITM by $0.01+ at expiration. For planning purposes, probability ITM ≈ probability of assignment.
- Early exercise is rare for ETF options except: (a) deep ITM calls before ex-dividend when dividend > remaining time value, (b) deep ITM puts where time value is negligible.
- Pin risk (stock closes very near strike) makes ATM positions genuinely unpredictable.

### 3. Pro-forma / scenario methodology (most relevant finding)

- Pro forma = forward-looking financial statements built on explicit assumptions. State assumptions clearly → compute arithmetic consequences → present result as conditional.
- Standard practice: 3 scenarios (base/best/worst). No precise probabilities needed.
- Treasury/corporate cash forecasting classifies receipts by confidence: certain/probable/possible. Directly analogous to position resolution classification.
- Rolling forecasts: start with projection, replace assumptions with actuals as events resolve. Matches Wheelwright's intra-month progressive-clarity pattern.
- **Key architectural fit:** Wheelwright already has the consequence arithmetic (ADR-013 Economic Consequence). The only missing piece is the resolution classification. Classification + existing computation = forecast.

### 4. Three forecasting families (evaluated against Wheelwright's need)

| Family | Evidence needed | Currently available? | Assessment |
|--------|----------------|---------------------|------------|
| **Market-implied** (delta, IV, expected move) | Current delta/IV per contract | Partially (not re-acquired for open positions) | Gold standard for precision; probably unnecessary for coarse classification |
| **Scenario/pro-forma** (assumptions → consequences) | Position data + resolution assumption | **YES — fully available** | Natural fit. Matches epistemic architecture. |
| **Empirical/statistical** (Monte Carlo, ML, calibration) | Large historical dataset | No | Inappropriate for V1. Violates Level 1→3 prohibition. |

**Verdict:** Scenario/pro-forma method overwhelmingly appropriate. Market-implied may supplement later if needed.

### 5. Simplicity vs. sophistication

Wharton research (Armstrong & Green, 2015): "Complexity increases forecast error by 27% on average" across 25 quantitative comparisons. All 22 evidence-based forecasting procedures identified are simple.

### 6. Uncertainty representation

- False precision is a documented cognitive bias. $5,437.26 when evidence supports only "≈$5K" actively misleads.
- For planning communication: "lead with your recommendation, translate confidence intervals to business language."
- Wheelwright's uncertainty is *bounded* (discrete resolution states), not *continuous*. Requires different visual treatment than statistical uncertainty.
- Appropriate representations: rounded point ("≈$5K"), simple range ("$4K–$6K"), or structured decomposition ("$3K produced + ~$2K likely").

---

## Sources

- [Schwab: Options Delta and Probability](https://www.schwab.com/learn/story/options-delta-probability-and-other-risk-analytics) — delta as probability ITM proxy
- [tastytrade: Delta](https://tastytrade.com/learn/trading-products/options/delta/) — delta as probability approximation
- [tastylive: Expected Move](https://www.tastylive.com/news-insights/expected-move-sanity-checking-trade-ideas) — expected move formula
- [Wharton: Simple vs Complex Forecasting](https://faculty.wharton.upenn.edu/wp-content/uploads/2016/10/Simple-versus-complex-forcasting-The-evidence_1.pdf) — complexity increases error
- [CFI: Scenario Analysis](https://corporatefinanceinstitute.com/resources/financial-modeling/scenario-analysis/) — base/best/worst methodology
- [CBOE: Early Exercise](https://www.cboe.com/insights/posts/dont-get-stuck-paying-the-dividend-on-your-short-trade/) — dividend-related exercise

Content was rephrased for compliance with licensing restrictions.
