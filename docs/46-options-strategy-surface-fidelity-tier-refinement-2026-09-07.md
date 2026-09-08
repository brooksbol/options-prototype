# Options Strategy Surface — Fidelity Tier Refinement

**Date:** September 7, 2026  
**Status:** Discovery / reconciled exploration under existing `PL-STRAT-01`; not strategy admission, broker integration, or implementation authorization  
**Supersedes for current comparative use:** the eight-column table in `docs/44-options-strategy-surface-discovery-2026-09-07.md` by adding a ninth broker-specific dimension; the interpretation and governance of that artifact remain in force.

---

## Why this refinement exists

The comparative strategy surface developed in `docs/44-options-strategy-surface-discovery-2026-09-07.md` described intrinsic and contextual strategy characteristics but did not represent whether a particular broker/account permission level can execute a strategy.

The Principal supplied Fidelity's current options-tier descriptions:

- **Tier 1:** buy-writes, covered calls and rolls, buying calls/puts, cash-covered puts, long straddles/strangles;
- **Tier 2:** Tier 1 plus spreads up to four legs and covered puts secured by short stock;
- **Tier 3:** Tier 2 plus uncovered calls/puts and short straddles for stocks, ETFs, and indexes.

This creates a useful ninth dimension:

> **Minimum Fidelity Options Tier**

Broker permission is not an economic property of a strategy and must not distort policy fitness or strategy quality. It is an **execution-eligibility constraint** applied after Wheelwright strategy admission and operator-policy eligibility.

Where Fidelity explicitly names the strategy class, the tier is treated as explicit. Where the result is inferred from Fidelity's broad permissions, the table marks it as derived/conditional rather than silently converting inference into broker authority.

---

## Nine-dimensional comparative strategy surface

| Strategy | Popularity / prevalence | Typical users | Typical market view | Core shape | Risk character | Prediction dependence | Reward surface relative to other strategies | Minimum Fidelity Options Tier |
|---|---|---|---|---|---|---|---|---|
| **Covered Call** | **Very common** | Retail, advisors, institutions | Neutral to mildly bullish | Long stock + short call | Upside capped; stock downside retained | **Low–Moderate** | **Broad, modest, capped** | **1 — explicit** |
| **Cash-Secured Put** | **Very common** | Retail, advisors, institutions | Neutral to mildly bullish | Short put + cash collateral | Assignment risk; substantial downside exposure | **Low–Moderate** | **Broad, modest, capped** | **1 — explicit** |
| **Protective Put** | **Common** | All types | Bullish but hedged | Long stock + long put | Downside floor; hedge cost | **Low** | **Broad, positively convex** | **1 — derived from buying puts** |
| **Collar** | **Common** | All types; particularly institutional/advisory | Mildly bullish / defensive | Long stock + long put + short call | Downside bounded; upside capped | **Low** | **Broad but compressed** | **2 — derived as multi-leg spread/combination** |
| **Long Call** | **Very common** | All types; especially retail | Bullish | Buy call | Limited loss; leveraged upside | **High** | **Narrower but highly convex** | **1 — explicit** |
| **Long Put** | **Very common** | All types | Bearish | Buy put | Limited loss; leveraged downside | **High** | **Narrower, highly convex** | **1 — explicit** |
| **Bull Call Spread** | **Very common** | Retail and professional/institutional | Moderately bullish | Long lower call + short higher call | Defined risk/reward | **High** | **Concentrated, capped convexity** | **2 — derived from spreads up to 4 legs** |
| **Bear Put Spread** | **Common** | Retail and professional/institutional | Moderately bearish | Long higher put + short lower put | Defined risk/reward | **High** | **Concentrated, capped convexity** | **2 — derived** |
| **Bull Put Credit Spread** | **Very common** | Retail, professional and institutional premium sellers | Neutral to bullish | Short higher put + long lower put | Defined-risk short premium | **Low–Moderate** | **Broad small-reward / bounded larger-loss** | **2 — derived** |
| **Bear Call Credit Spread** | **Very common** | Retail, professional and institutional premium sellers | Neutral to bearish | Short lower call + long higher call | Defined-risk short premium | **Low–Moderate** | **Broad small-reward / bounded larger-loss** | **2 — derived** |
| **Iron Condor** | **Very common** | Retail and professional volatility/premium traders | Range-bound / neutral | Put credit spread + call credit spread | Defined-risk short volatility | **Moderate–High** | **Wide central plateau, capped reward** | **2 — derived; 4-leg spread** |
| **Iron Butterfly** | **Common** | Retail and professional options traders | Very range-bound / neutral | Short ATM straddle + protective wings | Defined risk; concentrated center | **High** | **Tall, narrow central peak** | **2 — derived; 4-leg spread** |
| **Long Straddle** | **Common** | All types; especially volatility/event traders | Large move; direction unknown | Long call + long put, same strike | Limited loss; long volatility | **High** | **Two-sided convexity** | **1 — explicit** |
| **Short Straddle** | **Common among advanced traders** | Professional/institutional and sophisticated retail | Little movement | Short call + short put, same strike | Very large/unbounded risk | **Very High** | **High central reward / catastrophic tails** | **3 — explicit** |
| **Long Strangle** | **Common** | Retail, professional and institutional | Large move; direction unknown | OTM long call + OTM long put | Limited loss; long volatility | **High** | **Two-sided convexity, cheaper but farther away** | **1 — explicit** |
| **Short Strangle** | **Common among advanced traders** | Professional/institutional and sophisticated retail | Range-bound | OTM short call + OTM short put | Very large/unbounded risk | **Very High** | **Broad premium plateau / catastrophic tails** | **3 — derived from uncovered calls/puts** |
| **Butterfly Spread** | **Common** | Retail and professional options traders | Target price region | Usually +1 / −2 / +1 | Defined risk; narrow payoff peak | **High** | **Very concentrated peak** | **2 — derived; 3-leg spread** |
| **Broken-Wing Butterfly** | **Moderately common / specialized** | Sophisticated retail and professional options traders | Asymmetric target region | +1 / −2 / +1 with unequal wings | Defined/asymmetric risk | **Moderate–High** | **Skewed peak/plateau** | **2 — derived; 3-leg spread** |
| **Hedged Broken-Wing Butterfly** | **Niche / specialized** | Specialized options traders / strategy practitioners | Premium selling + tail hedge | BWB-like structure + additional hedge | Complex, state-dependent convexity | **Unknown / under investigation** | **Potentially unusual: ordinary compensation → intermediate adverse valley → renewed extreme-tail protection/reward** | **2? — conditional/unverified; depends on authoritative recipe and Fidelity treatment** |
| **Calendar Spread** | **Common** | Retail, professional and institutional volatility/relative-value traders | Time/volatility opportunity | Short near-term + long farther-term option | Strong time/IV sensitivity | **High** | **Time-dependent peak** | **2 — derived** |
| **Diagonal Spread** | **Common** | Retail and professional traders | Direction + time/volatility | Different strikes and expirations | Flexible; path-dependent | **High** | **Flexible but complex** | **2 — derived** |
| **Poor Man’s Covered Call** | **Popular with retail traders** | Primarily retail | Bullish | Deep-ITM LEAPS call + short nearer call | Capital-efficient covered-call analogue | **Moderate** | **Covered-call-like with leverage** | **2 — derived** |
| **Ratio Spread** | **Moderately common / advanced** | Professional/institutional and sophisticated retail | Direction / volatility | Unequal numbers of long and short options | Potential substantial tail risk | **High–Very High** | **Highly asymmetric** | **2 or 3 — conditional; depends on whether residual short exposure is treated as uncovered** |
| **Backspread** | **Specialized** | Professional/institutional volatility traders and sophisticated retail | Expect large move | More long options than short | Convex; often long volatility | **High** | **Tail-heavy convexity** | **2 — derived if recognized as covered multi-leg spread; verify execution treatment** |
| **Jade Lizard** | **Specialized but well-known** | Mostly sophisticated retail and professional premium traders | Neutral to bullish | Short put + call credit spread | Asymmetric short premium | **Moderate** | **Broad premium surface with one engineered tail** | **3? — conditional; naked short-put exposure ordinarily implies Tier 3 unless collateral treatment changes eligibility** |
| **Reverse Jade Lizard** | **Niche** | Sophisticated retail / professional options traders | Neutral to bearish | Short call + put credit spread | Asymmetric; potentially uncapped upside | **Moderate–High** | **Mirror asymmetric premium surface** | **3 — derived from uncovered short-call exposure; verify named-structure treatment** |
| **Box Spread** | **Specialized / institutional** | Primarily institutional, professional and sophisticated arbitrage/financing users | Financing / arbitrage | Bull call spread + bear put spread | Defined; synthetic financing | **Very Low** | **Essentially flat/fixed** | **2 — derived; 4-leg spread, subject to account/product restrictions** |
| **Synthetic Long Stock** | **Common concept; less common retail implementation** | All types; especially professional/institutional | Bullish exposure | Long call + short put, same strike/expiry | Stock-equivalent exposure | **Low*** | **Linear** | **3? — conditional; uncovered short put generally implies Tier 3, but cash coverage may change treatment** |
| **Synthetic Short Stock** | **Common concept; less common retail implementation** | All types; especially professional/institutional | Bearish exposure | Long put + short call, same strike/expiry | Short-stock-equivalent exposure | **Low*** | **Linear inverse** | **3? — conditional; uncovered short call generally implies Tier 3 unless separately covered** |

\* **Directional exposure ≠ prediction dependence.** A synthetic long or short creates directional exposure but does not inherently require a narrow terminal-price forecast to justify the structure.

---

## Fidelity-tier interpretation rules

### Explicit versus derived

The tier column distinguishes two evidence levels:

- **explicit** — Fidelity's supplied tier description directly names the strategy or strategy class;
- **derived / conditional / unverified** — the tier follows from broad permissions such as “spreads up to 4 legs” or “selling uncovered calls/puts,” but the named construction itself was not explicitly listed in the supplied Fidelity material.

Wheelwright must not silently promote a derived tier into a broker-authoritative fact. Conditional entries require broker-specific verification before becoming executable policy.

### Broker permission is not strategy quality

A Fidelity tier is an account execution constraint, not a strategy characteristic in the economic sense. A strategy should not receive a worse policy-fit score because the current account cannot execute it.

Instead Wheelwright should distinguish:

> **Not recommended**

from:

> **Policy-compatible or preferred, but unavailable under the current broker/account permissions.**

For example, a Tier 1 operator policy could admit both a CSP and a bull put credit spread economically. Fidelity execution eligibility would allow the CSP while identifying the spread as requiring Tier 2 rather than pretending the spread is economically inferior.

---

## Three distinct eligibility layers

The Fidelity refinement exposes three eligibility questions that should remain separate:

1. **Wheelwright strategy admission** — has Wheelwright sufficiently understood and governed this strategy?
2. **Operator-policy eligibility** — does the strategy satisfy the operator's hard constraints and preferences?
3. **Broker/account execution eligibility** — can this particular broker/account execute the structure?

Only after those gates should current evidence, executable contracts, consequence envelopes, compensation relative to consequence, and portfolio state determine whether an actual alternative is attractive.

Conceptually:

> **Wheelwright strategy admission**
>
> → **Operator Strategy Policy**
>
> → **Broker/account execution eligibility**
>
> → **Current evidence and executable contracts**
>
> → **Consequence / compensation evaluation**
>
> → **Portfolio-state evaluation**
>
> → **0..N recommended alternatives**

The broader architectural concept is therefore **broker/account execution eligibility**, not Fidelity-specific logic. Fidelity is the first concrete broker-permission surface captured here.

---

## Reconciliation result

This refinement creates no new parking-lot identity. It further refines `PL-STRAT-01` and the strategy-surface / Operator Strategy Policy discoveries already reconciled there.

### Strategic disposition

**Strengthens existing direction; no roadmap change required.** Broker permissions introduce a real-world feasibility gate without changing the economic strategy-admission question.

### Architectural disposition

**Refines existing governed-alternatives pressure; no broker integration is authorized.** The discovery strengthens the need to distinguish economic/policy fitness from account execution capability. It does not authorize a broker-capability service, Fidelity API work, strategy engine, or UI.

### Next authorized mode

**Further exploration / research only.** Verify conditional Fidelity mappings when they become relevant and, if other brokers become relevant, characterize their account-permission models without prematurely generalizing a broker abstraction.

**Not authorized:** strategy admission, broker integration, recommendation-engine implementation, UI work, generalized trade-shape framework work, policy promotion, or roadmap reprioritization.
