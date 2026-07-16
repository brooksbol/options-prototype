# Market-Priced Risk as Evidence — Research Topic

**Date:** July 2026
**Status:** Research topic — not a feature request, not an implementation plan
**Nature:** Architectural exploration of whether observable market pricing can improve recommendation context

---

## Core Question

The options market continuously prices risk, uncertainty, and probability. Rather than inventing our own risk model, can the system learn to **read what the market is already communicating** through its pricing?

The objective is not to outperform the market's pricing model. The objective is to better interpret the information the market already provides.

---

## Motivating Observations

### Observation 1: Same yield, different collateral

Two contracts both produce ~5% annualized yield:

- Contract A: Collateral $72,000
- Contract B: Collateral $5,000

**Question:** Why is the market willing to pay approximately the same yield while requiring dramatically different capital commitments?

One possible explanation is that the market is pricing different probability distributions for the two underlyings. Another may be liquidity characteristics, diversification of the underlying, institutional participation, or structural features. Determining which factors dominate — and whether they are observable from current evidence — is precisely the purpose of this research. The current system presents both as "5% yield" without explaining what makes them structurally different.

### Observation 2: Same collateral, different yield

Two contracts both require ~$5,000 collateral:

- Contract A: Yield 5%
- Contract B: Yield 60%

**Question:** Why is the market paying twelve times as much premium?

The market is communicating something — elevated uncertainty, structural complexity, binary risk, thin liquidity, or some combination. The current system shows the yield but does not explain what drives it.

---

## Research Principle

> In the absence of evidence, all that remains are agendas.

This applies here. The system should expose evidence about what the market is communicating, not replace operator judgment with a proprietary risk score.

The operator remains responsible for the decision (Human In The Loop). The system's job is to make the market's communication legible.

---

## What the Market Prices (Observable Factors)

The options market continuously reflects:

- Implied volatility (and its percentile relative to history)
- Realized volatility of the underlying
- Volatility skew (puts vs calls, near vs far strikes)
- Liquidity (bid/ask spread, open interest, volume)
- Supply and demand imbalances
- Probability distributions (embedded in the volatility surface)
- Correlation and sector characteristics
- Structural product characteristics (leverage, daily reset, inverse)
- Jump risk (binary events, earnings, dividends)
- Time decay characteristics

These are not predictions. They are observations from current market state.

---

## Architectural Implications

### What this is NOT

- Not a portfolio risk score ("Risk: 82.7")
- Not a prediction of future prices
- Not a replacement for operator judgment
- Not an attempt to outsmart market pricing

### What this COULD be

Explanatory context in the Recommendation Brief that decomposes yield into its observable drivers:

```
Yield: 60% annualized

Market is pricing:
  IV percentile: 85th (elevated relative to 30-day history)
  Product structure: 3x leveraged, daily reset
  Underlying 30d realized vol: 48%
  OI depth: 14 contracts (thin)
  Assignment recovery: structurally uncertain (NAV decay)
```

This is evidence, not a score. The operator sees *why* the premium is high and decides whether those characteristics are acceptable under their policy.

### Contrast with current system

Today, Wheelwright evaluates:
- Delta (probability proxy)
- Spread (execution quality)
- OI/Volume (liquidity)
- Yield (income)
- Product structure (Velvet Rope)

What it does NOT yet expose:
- *Why* the yield is what it is
- Whether the yield is normal or anomalous for this instrument
- What structural factors the market is pricing into the premium
- Whether two "same yield" contracts carry fundamentally different market-assessed risk

---

## Relationship to Existing Architecture

| Concept | Connection |
|---------|-----------|
| Policy over prediction | Consistent — reading market signals, not predicting outcomes |
| Wheelwright | Could consume market-pricing context as input to assessment or as Brief evidence |
| Recommendation Brief | Natural home for explanatory market-pricing context |
| Velvet Rope / Product Structure | Already captures some structural factors (leverage, inverse) — market pricing may quantify what structure implies |
| Conditioned Operating Opportunity | IV and skew characteristics affect the post-assignment call environment |
| Evidence Service (backend) | Market-pricing data (IV, historical vol) may require additional provider data beyond current chain evidence |

---

## Possible Research Directions

Without assuming conclusions:

1. **IV context:** Is the current IV elevated, depressed, or normal for this instrument? (Requires historical IV baseline — not currently available from Tradier sandbox.)

2. **Yield decomposition:** Can yield be decomposed into: base time-value + volatility premium + structural premium + liquidity discount? (May be partially inferable from IV vs realized vol.)

3. **Yield anomaly detection:** Do contracts with anomalously high yield relative to their delta/DTE share observable characteristics? (Structural complexity, low OI, elevated IV — all currently observable.)

4. **Assignment recovery context:** For instruments with known structural issues (leveraged, daily reset), can the system explain why assignment is different from a plain ETF? (Already partially implemented in ProductStructure.)

5. **Peer comparison:** How does this instrument's put pricing compare to similar instruments in the same sector/theme? (Requires sector metadata — partially available from ETF names.)

---

## Important Constraints

- Avoid inventing arbitrary composite scores unless well supported by evidence
- Prefer market-derived evidence over model-derived estimates
- Do not attempt to predict future IV, price, or assignment probability
- Do not add data sources until the research question justifies the complexity
- The current Tradier sandbox provides limited Greeks (often zero) — richer data may require provider upgrade

---

## Expected Outcomes

This research may produce:

- New explanatory signals in the Recommendation Brief
- Improved recommendation narratives ("this yield is elevated because...")
- Better portfolio awareness ("your portfolio concentrates in high-IV instruments")
- Classification refinements for Velvet Rope
- Input to Lifecycle Quality assessment
- Or no architectural changes at all

The purpose is learning, not validating a predetermined solution.

---

## Data Requirements (Preliminary)

| Signal | Currently available? | Source |
|--------|---------------------|--------|
| Implied volatility per contract | Partial (Tradier sandbox often returns 0) | Would need live Tradier or alternative |
| Historical IV (30/60/90 day) | No | Requires historical data provider |
| Realized volatility | No | Computable from price history |
| Volatility skew | Derivable from chain (multiple strikes' IV) | Requires non-zero IV data |
| Product structure flags | Yes | Velvet Rope ProductStructure |
| Bid/ask spread | Yes | Current chain data |
| Open interest depth | Yes | Current chain data |
| Sector/theme classification | Partial (from ETF name inference) | Could be enriched |

**Note:** Several research directions require data not currently available from the Tradier sandbox. This is a data access question, not an architectural question. The architecture (evidence-based, explanatory, non-predictive) is sound regardless of which data sources eventually supply the observations.

---

## Maturity

| Aspect | Status |
|--------|--------|
| Research question | Clearly framed |
| Architectural fit | Confirmed (evidence-based, Brief-oriented, non-predictive) |
| Data requirements | Partially identified; gaps in IV history |
| Implementation plan | None — intentionally deferred |
| Provider requirements | May exceed Tradier sandbox capabilities |
| Scoring model | Explicitly avoided until evidence justifies it |
