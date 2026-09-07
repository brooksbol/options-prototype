# Options Strategy Surface — Comparative Discovery

**Date:** September 7, 2026  
**Status:** Discovery / reconciled exploration under existing `PL-STRAT-01`; not strategy admission, not implementation authorization  
**Related:** `PL-STRAT-01`, roadmap C2/K1/K2/L3, architecture-roadmap AR3/AR4, Policy over Prediction, Strategy Expansion Governance, `docs/43-hedged-broken-wing-butterfly-discovery-2026-09-07.md`

---

## Why this artifact exists

A September 7 discussion began with a simple survey question: what are the most popular options-trading strategies? The discussion then progressively added dimensions needed to compare strategies in a way that is more useful to Wheelwright than conventional labels such as bullish, bearish, neutral, or defined risk.

The resulting table is a **strategy surface**: a comparative research view across eight dimensions:

1. strategy;
2. popularity / prevalence;
3. typical users;
4. typical market view;
5. core shape;
6. risk character;
7. prediction dependence;
8. reward surface relative to other strategies.

This is not an admitted Wheelwright strategy catalog. It is a durable comparative surface for strategy research under `PL-STRAT-01`.

Two distinctions from the discussion are especially important:

> **Directional exposure is not the same thing as prediction dependence.**

and:

> **Defined risk does not tell us how broad, narrow, convex, asymmetric, or path-dependent the reward surface is.**

The strategy surface is intended to preserve those distinctions explicitly.

---

## Comparative strategy surface

| Strategy | Popularity / prevalence | Typical users | Typical market view | Core shape | Risk character | Prediction dependence | Reward surface relative to other strategies |
|---|---|---|---|---|---|---|---|
| **Covered Call** | **Very common** | **Retail, advisors, institutions** — especially long-equity portfolios and income mandates | Neutral to mildly bullish | Long stock + short call | Upside capped; stock downside retained | **Low–Moderate** — can be consequence-driven if call-away and downside are acceptable | **Broad, modest, capped.** Premium improves many outcomes; large upside surrendered |
| **Cash-Secured Put** | **Very common** | **Retail, advisors, institutions** — commonly used for income or desired equity entry | Neutral to mildly bullish | Short put + cash collateral | Assignment risk; substantial downside exposure | **Low–Moderate** — can be consequence-driven if ownership at strike is acceptable | **Broad, modest, capped.** Many flat/up outcomes earn full premium; downside eventually overwhelms premium |
| **Protective Put** | **Common** | **All types** — retail investors through institutional hedging programs | Bullish but hedged | Long stock + long put | Downside floor; hedge cost | **Low** — primarily purchases an acceptable consequence boundary | **Broad, positively convex.** Open upside with bounded downside at cost of hedge drag |
| **Collar** | **Common** | **All types; particularly institutional/advisory** — concentrated positions and portfolio protection | Mildly bullish / defensive | Long stock + long put + short call | Downside bounded; upside capped | **Low** — largely consequence engineering | **Broad but compressed.** Both favorable and unfavorable extremes constrained |
| **Long Call** | **Very common** | **All types; especially retail** for leveraged directional exposure | Bullish | Buy call | Limited loss; leveraged upside | **High** — needs sufficient upward movement within finite time | **Narrower but highly convex.** Premium at risk with potentially very large upside |
| **Long Put** | **Very common** | **All types** — retail speculation plus professional/institutional hedging | Bearish | Buy put | Limited loss; leveraged downside | **High** — needs sufficient downward movement within finite time | **Narrower, highly convex.** Fixed premium at risk with increasing downside reward |
| **Bull Call Spread** | **Very common** | **Retail and professional/institutional** directional traders | Moderately bullish | Long lower call + short higher call | Defined risk/reward | **High** — requires favorable upward movement | **Concentrated, capped convexity.** Capital-efficient directional reward |
| **Bear Put Spread** | **Common** | **Retail and professional/institutional** directional or hedging users | Moderately bearish | Long higher put + short lower put | Defined risk/reward | **High** — requires favorable downward movement | **Concentrated, capped convexity.** Downside counterpart to bull call spread |
| **Bull Put Credit Spread** | **Very common** | **Retail, proprietary/professional and institutional** premium sellers | Neutral to bullish | Short higher put + long lower put | Defined-risk short premium | **Low–Moderate** — can be consequence-driven if bounded loss and compensation are acceptable | **Broad small-reward / bounded larger-loss.** Large favorable region earns capped premium |
| **Bear Call Credit Spread** | **Very common** | **Retail, proprietary/professional and institutional** premium sellers | Neutral to bearish | Short lower call + long higher call | Defined-risk short premium | **Low–Moderate** — can be consequence-driven | **Broad small-reward / bounded larger-loss.** Opposite-side vertical |
| **Iron Condor** | **Very common** | **Retail and professional volatility/premium traders**; also institutional variants | Range-bound / neutral | Put credit spread + call credit spread | Defined-risk short volatility | **Moderate–High** — depends on avoiding sufficiently large moves | **Wide central plateau, capped reward.** Large winning region relative to butterfly |
| **Iron Butterfly** | **Common** | **Retail and professional options traders** | Very range-bound / neutral | Short ATM straddle + protective wings | Defined risk; concentrated center | **High** — attractive payoff depends strongly on terminal location | **Tall, narrow central peak.** Greater peak potential than condor, smaller favorable region |
| **Long Straddle** | **Common** | **All types; particularly professional/institutional volatility traders** and event traders | Large move; direction unknown | Long call + long put, same strike | Limited loss; long volatility | **High** — direction unknown, but magnitude/timing must be right | **Two-sided convexity.** Central cost with increasing reward in either tail |
| **Short Straddle** | **Common among advanced traders** | **Professional/institutional and sophisticated retail** volatility sellers | Little movement | Short call + short put, same strike | Very large/unbounded risk | **Very High** — depends strongly on avoiding large movement | **High central reward / catastrophic tails.** Strong adverse asymmetry |
| **Long Strangle** | **Common** | **Retail, professional and institutional** event/volatility traders | Large move; direction unknown | OTM long call + OTM long put | Limited loss; long volatility | **High** — requires substantial movement | **Two-sided convexity, cheaper but farther away.** Larger central losing region |
| **Short Strangle** | **Common among advanced traders** | **Professional/institutional and sophisticated retail** premium sellers | Range-bound | OTM short call + OTM short put | Very large/unbounded risk | **Very High** — depends strongly on avoiding large movement | **Broad premium plateau / catastrophic tails.** Wide winning region with severe tail exposure |
| **Butterfly Spread** | **Common** | **Retail and professional options traders** | Target price region | Usually +1 / −2 / +1 | Defined risk; narrow payoff peak | **High** — strongly favors a particular terminal region | **Very concentrated peak.** Excellent capital efficiency near body; rapidly deteriorates away from it |
| **Broken-Wing Butterfly** | **Moderately common / specialized** | **Sophisticated retail and professional options traders** | Asymmetric target region | +1 / −2 / +1 with unequal wings | Defined/asymmetric risk | **Moderate–High** — asymmetry can reduce dependence, but location still matters | **Skewed peak/plateau.** Trades symmetry for improved economics on one side |
| **Hedged Broken-Wing Butterfly** | **Niche / specialized** | **Specialized options traders / strategy practitioners**; institutional prevalence unclear for this specific named construction | Premium selling + tail hedge | BWB-like structure + additional hedge | Complex, state-dependent convexity | **Unknown / under investigation** — central Wheelwright research question | **Potentially unusual:** ordinary compensation → intermediate adverse valley → renewed extreme-tail protection/reward |
| **Calendar Spread** | **Common** | **Retail, professional and institutional volatility/relative-value traders** | Time/volatility opportunity | Short near-term + long farther-term option | Strong time/IV sensitivity | **High** — future spot, IV and term structure matter | **Time-dependent peak.** Surface changes substantially with time and volatility |
| **Diagonal Spread** | **Common** | **Retail and professional traders**; institutional variants common | Direction + time/volatility | Different strikes and expirations | Flexible; path-dependent | **High** — several future variables affect economics | **Flexible but complex.** Combines directional and time/volatility characteristics |
| **Poor Man’s Covered Call** | **Popular with retail traders** | **Primarily retail**; the economic concepts exist institutionally but usually are not called PMCC | Bullish | Deep-ITM LEAPS call + short nearer call | Capital-efficient covered-call analogue | **Moderate** — longer-term bullish exposure plus repeated short-call decisions | **Covered-call-like with leverage.** Better capital efficiency; additional decay/IV exposure |
| **Ratio Spread** | **Moderately common / advanced** | **Professional/institutional and sophisticated retail** | Direction / volatility | Unequal numbers of long and short options | Potential substantial tail risk | **High–Very High** — favorable region can be narrow relative to adverse tail | **Highly asymmetric.** Attractive local reward can coexist with dramatically deteriorating tail |
| **Backspread** | **Specialized** | **Professional/institutional volatility traders and sophisticated retail** | Expect large move | More long options than short | Convex; often long volatility | **High** — generally requires sufficiently large movement/vol expansion | **Tail-heavy convexity.** Moderate movement may disappoint; extreme movement increasingly favorable |
| **Jade Lizard** | **Specialized but well-known** | **Mostly sophisticated retail and professional premium traders** | Neutral to bullish | Short put + call credit spread | Asymmetric short premium | **Moderate** — one side can be engineered favorably, but downside remains | **Broad premium surface with one engineered tail.** Relatively rich premium collection |
| **Reverse Jade Lizard** | **Niche** | **Sophisticated retail / professional options traders** | Neutral to bearish | Short call + put credit spread | Asymmetric; potentially uncapped upside | **Moderate–High** — uncapped call exposure makes forecast-independent acceptance difficult | **Mirror asymmetric premium surface.** Broad favorable region with dangerous upside tail |
| **Box Spread** | **Specialized / institutional** | **Primarily institutional, professional and sophisticated arbitrage/financing users** | Financing / arbitrage | Bull call spread + bear put spread | Defined; synthetic financing | **Very Low** — essentially independent of underlying direction | **Essentially flat/fixed.** Reward is financing yield rather than directional payoff |
| **Synthetic Long Stock** | **Common concept; less common retail implementation** | **All types; especially professional/institutional** for exposure construction and arbitrage | Bullish exposure | Long call + short put, same strike/expiry | Stock-equivalent exposure | **Low*** — creates exposure rather than requiring a target-price forecast | **Linear.** Approximately dollar-for-dollar underlying exposure |
| **Synthetic Short Stock** | **Common concept; less common retail implementation** | **All types; especially professional/institutional** | Bearish exposure | Long put + short call, same strike/expiry | Short-stock-equivalent exposure | **Low*** — likewise creates exposure rather than targeting a future region | **Linear inverse.** Approximately gains as underlying falls and loses as it rises |

\* **Directional exposure ≠ prediction dependence.** A synthetic long or short creates a directional exposure but does not inherently require a narrow forecast of terminal price to justify the structure.

---

## Interpretation notes

### Popularity / prevalence is qualitative

The prevalence labels are intentionally qualitative rather than asserted market-share statistics. They describe how commonly the strategies are encountered in ordinary options practice and education. They should not be interpreted as measured exchange-volume attribution by strategy.

### Typical users is not an endorsement signal

Institutional use is weak evidence that a structure is economically legitimate, but it is **not** evidence that the strategy is suitable for Wheelwright. Institutions may have execution infrastructure, financing advantages, portfolio-scale hedging needs, volatility books, cross-position netting, mandate constraints, or specialist expertise that the Wheelwright operator does not have.

Conversely, retail popularity does not make a strategy unsuitable. The column exists to expose the operating context in which a structure is commonly used.

### Prediction dependence is about justification, not exposure

Prediction dependence asks:

> **How right about the future does the implementer need to be for the strategy's economic justification to hold?**

A CSP, for example, may be used predictively — "the underlying will not fall below this strike" — or consequence-first — "assignment at this effective basis is acceptable and the current compensation is adequate." The same option geometry can therefore support different decision disciplines.

This is directly relevant to **Policy over Prediction**. Wheelwright should not infer prediction dependence solely from bullish/bearish/neutral labels or from payoff geometry.

### Reward surface is different from max profit

Reward surface asks:

> **Across the relevant future-state space, where does the strategy pay, how broadly, how strongly, and with what geometry?**

Examples:

- a credit spread generally has a broad maximum-reward region and a bounded adverse region;
- an iron condor has a central reward plateau with losses in both tails;
- a butterfly concentrates attractive reward much more narrowly around the body;
- a long straddle has an adverse central region and improving reward in both sufficiently distant tails;
- the HBWB hypothesis may combine ordinary compensation, an intermediate adverse valley, and renewed extreme-downside protection or reward.

Thus **defined risk** and **maximum profit** are insufficient descriptors of deployment quality.

---

## What this surface reveals for Wheelwright

The table exposes several independent dimensions that conventional strategy taxonomies collapse together:

- **market view** — conventional directional/range interpretation;
- **economic construction** — the option/underlying legs that create the position;
- **risk character** — bounded, unbounded, asymmetric, stock-like, convex, etc.;
- **prediction dependence** — how much future-state forecasting is required to justify entry;
- **reward-surface geometry** — how reward and loss are distributed across possible states;
- **participant context** — whether a strategy is common in retail, professional, advisory, or institutional practice.

For Wheelwright, these distinctions strengthen the case that candidate-strategy evaluation should not be a flat list of named strategies. A useful future strategy-admission comparison will likely need to reason about **consequence surfaces, compensation, prediction dependence, execution/lifecycle complexity, and portfolio fit** independently.

This does **not** authorize a generalized strategy taxonomy or arbitrary multi-leg implementation framework. The architecture-roadmap's existing warning still applies: reusable economic primitives and broader strategy representation must be earned through concrete strategy pressure.

---

## Reconciliation result

This discovery does **not** create a new parking-lot identity. It refines the existing `PL-STRAT-01` Strategy Expansion Governance concern.

### Strategic reconciliation

**Strengthens existing strategic direction; no roadmap change required.**

The strategy surface is directly relevant to existing roadmap intent:

- **C2 — Broader governed trade-shape repertoire:** provides a comparative research surface for candidate strategy families without admitting them;
- **K1 — Consequence envelopes:** reward/risk surfaces reinforce the need to evaluate more than premium or max loss;
- **K2 — Compensation relative to consequence:** makes explicit that reward magnitude and reward breadth must be compared with adverse consequence;
- **L3 — Risk-profile performance can be learned empirically:** provides candidate dimensions for comparing materially different risk profiles over time.

No new Bet is warranted and no roadmap edit is required.

### Architectural reconciliation

**Refines existing architecture pressure; no new architecture direction required.**

The surface maps to:

- **AR3 — From Strategy-Specific Recommendations Toward Governed Alternatives:** multiple trade shapes pressure common economic semantics, but this discovery does not authorize a generalized strategy engine, DSL, or arbitrary trade-shape framework;
- **AR4 — Consequence Semantics Before Explanation:** prediction dependence and reward/consequence geometry reinforce the need for consequence semantics to exist as structured domain data before they are merely explained in prose.

No implementation is authorized.

---

## Next authorized mode

**Further exploration / research only.**

Useful next work, if selected by the Principal, would be to refine the surface with empirically supportable dimensions such as execution complexity, capital/collateral character, lifecycle/management burden, assignment/exercise exposure, volatility/skew sensitivity, and portfolio aggregation behavior, then use those dimensions to compare candidate strategies under the existing Architectural Admission Test.

**Not authorized:** strategy admission, recommendation-engine implementation, UI work, broker integration, generalized trade-shape framework work, policy promotion, or roadmap reprioritization.
