# Recommendation Set Analysis

**Date:** July 2026
**Status:** Architectural concept — not yet implemented
**Nature:** Population-level observation of the ranked recommendation set

---

## Core Concept

The recommendation engine evaluates individual contracts. It ranks them by policy.

But the **recommendation set as a whole** has observable characteristics that no individual contract evaluation produces.

Example: Three of the top 10 recommendations are semiconductor ETFs (SMH, SOXX, XSD). Each contract was correctly ranked on its own merits. But the concentration in semiconductors is a property of the population, not of any single recommendation.

**Recommendation Set Analysis** observes the ranked population and reports its characteristics.

---

## Distinction from Individual Evaluation

| Concern | Unit | Example |
|---------|------|---------|
| Contract evaluation | One contract | "XLE $57 put has 23% yield, 0.30 delta, 9% spread" |
| Recommendation ranking | One contract relative to others | "Ranked #3 by Yield First policy" |
| **Recommendation Set Analysis** | The population | "3 of top 10 are semiconductors" |

These are distinct architectural concerns. Set Analysis does not change individual rankings. It observes what the ranked set collectively communicates.

---

## Architectural Abstraction: Grouping Heuristic

The system should not hardcode "sector analysis." Sector is one possible classification.

The general pattern:

```
Ranked Recommendations
    ↓
Grouping Heuristic (pluggable)
    ↓
Groups
    ↓
Distribution
    ↓
Observations
```

A **Grouping Heuristic** is any function that assigns recommendations to groups. The observation engine is independent of the specific grouping strategy.

### Example Grouping Heuristics

- **Sector** — Technology, Energy, Healthcare, Financials...
- **Industry** — Semiconductors, Oil & Gas, Biotech...
- **Asset class** — Equity, Fixed Income, Commodity, Currency
- **Product structure** — Plain ETF, Leveraged, Inverse, Income-oriented
- **Issuer** — SPDR, iShares, Vanguard, ProShares, Invesco
- **Geographic exposure** — US, International, Emerging, Single-country
- **Correlation cluster** — empirically correlated instruments
- **Volatility regime** — Low-vol, Normal, High-vol
- **Capital tier** — Micro (<$3K), Small ($3K-$10K), Medium ($10K-$30K), Large (>$30K)
- **DTE band** — Near-term (7-14), Standard (14-30), Extended (30-45)

This list is intentionally non-exhaustive. The architecture should accept new heuristics without structural changes.

---

## The Engine Asks One Question

For each recommendation:

> Which group does this belong to?

Everything else is generic:
- Count per group
- Percentage of total
- Dominant group(s)
- Concentration index
- Notable clustering

No recommendation-specific logic is needed in the observation layer.

---

## Evidence over Interpretation

Consistent with project philosophy, the system **reports observations** without prescribing action.

**Acceptable outputs:**
- "3 of top 10 belong to Semiconductors"
- "60% of recommendations are Technology sector"
- "Top 5 span 4 different sectors"
- "All top 20 require >$5,000 collateral"

**Not acceptable:**
- "Diversify" (prescriptive)
- "Avoid semiconductors" (directive)
- "This is risky" (judgmental)
- "Risk score: 78" (invented composite)

The operator decides. The system observes.

---

## Relationship to Portfolio Context

**Portfolio Context** is concerned with understanding the recommendation environment rather than evaluating individual contracts.

Recommendation Set Analysis is one mechanism by which Portfolio Context is produced.

Other Portfolio Context contributors:
- Existing position awareness (from Fidelity import)
- Pending intent awareness (from manual marking)
- Deployable cash constraints
- Affordability distribution

Set Analysis adds: "what does the current opportunity set look like as a population?"

---

## Relationship to Market-Priced Risk

The market-priced-risk research direction asks: "why is the market pricing this contract the way it does?"

Recommendation Set Analysis asks: "what does the population of attractive contracts tell us about current market conditions?"

These are complementary:
- Market-priced risk explains individual contract pricing
- Set Analysis reveals population-level patterns

Both are observational, not predictive.

---

## Relationship to Existing Architecture

| Concept | Connection |
|---------|-----------|
| Wheelwright | Produces the ranked set. Set Analysis consumes it as input. |
| Recommendation Brief | Could display set-level context ("this recommendation is one of 3 semiconductors in the top 10") |
| Velvet Rope / Product Structure | Product Structure is one possible grouping heuristic |
| Conditioned Operating Opportunity | Lifecycle quality could be a grouping dimension |
| Evidence Service | Classification metadata (sector, industry) may require enrichment data beyond current chain evidence |

---

## Data Requirements

Classification requires metadata not currently in the option chain:

| Heuristic | Data needed | Currently available? |
|-----------|-------------|---------------------|
| Sector | ETF sector classification | Partial (inferable from name for some) |
| Industry | Sub-sector classification | No |
| Product structure | Leverage, inverse, daily-reset flags | Yes (Velvet Rope ProductStructure) |
| Issuer | Fund issuer/sponsor | Partial (inferable from name) |
| Capital tier | Strike × 100 | Yes (computed from recommendation) |
| DTE band | DTE | Yes |
| Volatility regime | IV percentile | No (Tradier sandbox limitation) |

Some heuristics are immediately implementable (capital tier, DTE band, product structure). Others require enrichment data (sector, industry, correlation).

---

## Open Questions

1. **Where does classification metadata come from?** The Yahoo 496 list has symbols but not sector/industry. An enrichment source is needed.

2. **When is the set analyzed?** After every recommendation recomputation? Only on operator request? Continuously in the background?

3. **How is it displayed?** Inline with recommendations? Separate panel? Part of the Brief? Part of the header?

4. **Should concentration affect ranking?** Initially no (observation only). But a future "diversity-aware" ranking mode is conceivable.

5. **What constitutes "notable"?** When does concentration deserve highlighting? >30% in one group? >50%? Configurable threshold?

---

## Maturity

| Aspect | Status |
|--------|--------|
| Concept | Defined |
| Architectural abstraction (Grouping Heuristic) | Defined |
| Relationship to existing architecture | Mapped |
| Data requirements | Partially identified |
| Implementation plan | None — intentionally deferred |
| Enrichment data source | Not yet selected |
| Display design | Not yet designed |
