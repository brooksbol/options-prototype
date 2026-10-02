# Growth Overwrite Strategy Taxonomy and Experiment Structure

**Date:** 2026-10-02  
**Status:** Research synthesis / durable project memory. Not Wheelwright policy. Not implementation authority.  
**Primary existing home:** `PL-DEC-BEH` (Inner Game / Governed Prescriptive Decision Discipline), especially the Sawdust Roth candidate **Growth / Compounding** mandate specimen.  
**Adjacent concerns:** `PL-EXEC-01` lifecycle transitions; `PL-STRAT-01` strategy/repertoire governance; `PL-UX-01` attention/re-underwriting prompts; `PL-PORT-01` portfolio/inventory state.  
**Research basis:** `docs/research/covered-call-delta-band-growth-memo-2026-10-02.md`.

## Why this exists

A real first covered-call roll in the Sawdust Roth triggered a broader Growth-regime question: can an investor retain more equity upside while still harvesting worthwhile call premium? Initial discussion centered on a "Delta Staircase" intuition—roll a rising covered call up in discrete steps as delta rises—but Codex and subsequent Muse research broadened the problem materially.

The durable conclusion is that **Growth overwrite should be treated as a design space, not one strategy**.

The main control dimensions are:

1. **Distance** — how much upside is sold, primarily via strike/delta.
2. **Timing** — when the investor chooses to sell upside at all.
3. **Fraction** — how much of the share inventory is capped.
4. **Lifecycle** — how an existing short-call obligation is managed after entry.

Secondary controls include volatility gating, profit harvesting, DTE/time stops, execution quality, and staggering.

Simplicity is itself a criterion: added lifecycle complexity must beat simpler policies after executable costs.

## Semantic discipline

Preserve these distinctions in every experiment or future Product treatment:

- ROLL ≠ PROFIT.
- BTC and STO are separate economic events.
- A replacement option is a new obligation.
- Roll credit is not realized gain.
- Replacement must independently qualify from current state.
- Do not anchor a new strike to historical strike or prior loss.
- Delta is a state variable / attention signal, not assignment probability.
- Premium is compensation for selling optionality, not free income.
- A valid outcome may be **NO CALL / remain uncovered**.
- Growth objective means equity appreciation and continued ownership are primary; premium is secondary.
- Numeric thresholds below are research/experimental parameters unless separately established.

## Strategy catalog

### BH — Long Equity / Uncovered

**Rule:** Never sell calls.

**Purpose:** Maximum upside-participation control and terminal-wealth benchmark.

**Best fit:** strong bull markets, recoveries, explosive upside.

**Weakness:** no option-premium production; full equity downside.

**Complexity:** minimal.

**Backtest role:** mandatory baseline.

---

### FIXED — Low-Delta Fixed Overwrite

**Core idea:** Stay covered, but sell relatively little upside.

**Candidate experimental entry:**
- long shares available;
- 35–45 DTE;
- 0.16–0.20 absolute call delta;
- spread ≤10% of midpoint and ≤$0.05;
- sell at executable bid.

**Lifecycle:** Hold through expiration/resolution; re-underwrite only at cycle boundary.

**Application:** Simple Growth overlay that preserves more participation than ATM/near-ATM overwrite.

**Likely market fit:** sideways, modest bull, reasonably rich volatility.

**Likely weak fit:** explosive bull or sharp recovery because cap still exists.

**Institutional analogue:** Cboe BXMD uses fixed-delta entry (30Δ) and monthly hold-to-expiry.

**Complexity:** low.

**Excellent backtest axes:** entry delta 0.10 / 0.15 / 0.20 / 0.25 / 0.30 crossed with a small tenor set such as 30 / 45 / 60 DTE.

---

### INTER — Volatility-Gated Intermittent Overwrite

**Core idea:** Do not sell Growth-account upside unless sufficiently compensated.

**Candidate v1 experimental rule:**
- common Growth entry: 35–45 DTE, 0.16–0.20Δ, liquidity gate;
- require 1-year IV Rank ≥50;
- otherwise remain uncovered;
- hold accepted call through expiration.

**Important interpretation:** IVR 50 is an experimental threshold, not established doctrine.

**Potential v2:** replace/simple-gate IVR with a volatility-risk-premium measure, e.g. implied volatility relative to realized or forecast volatility.

**Application:** Growth account where premium is secondary and uncapped time is acceptable.

**Likely market fit:** rich/high-IV regimes where the investor is paid materially to cap upside.

**Likely weak fit:** low-volatility grinding bull; the option is cheap while the right tail matters.

**Institutional cousin:** Cboe BXMC varies coverage according to VIX state.

**Complexity:** low.

**Excellent backtest axis:** IVR threshold 0 / 20 / 30 / 40 / 50 / 60 / 70 while holding strike/DTE policy constant.

**Machine decision shape:** WRITE or WAIT.

---

### PART — Partial Overwrite

**Core idea:** Cap only part of the share inventory.

**Rule:** Sell covered calls on a fixed fraction of shares; leave remainder structurally uncapped.

**Candidate experiment:** 50% coverage; Muse proposed 500 shares so contract granularity permits exact fractional coverage.

**Application:** Growth accounts with at least several hundred shares where permanent full coverage is unnecessary.

**Likely market fit:** broad; particularly attractive where preserving upside is structurally important.

**Strength:** uncapped upside is guaranteed on uncovered shares; no forecasting or roll management required.

**Weakness:** standard 100-share contract granularity makes this binary at exactly 100 shares.

**Institutional analogue:** Cboe BXMH half overwrite; BXMC varies 1 versus 1/2 coverage.

**Complexity:** minimal.

**Excellent backtest axis:** 0 / 20 / 40 / 50 / 60 / 80 / 100% coverage.

---

### HARVEST — Profit-Target Managed Overwrite

**Core idea:** Stop carrying an obligation once a large portion of the originally available premium has been earned.

**Candidate practitioner baseline:**
- enter around 45 DTE;
- BTC at 50% of original credit captured;
- then independently requalify a new call;
- if no fresh call qualifies, remain uncovered.

**Growth interpretation:** Harvest is not automatically "BTC then STO again." It is "BTC then re-underwrite."

**Application:** Avoid carrying exhausted calls through low remaining reward / higher lifecycle risk.

**Likely market fit:** periods of fast early premium decay.

**Complexity:** low-to-moderate.

**Excellent backtest axes:** 25 / 50 / 75 / 90% captured; compare immediate rewrite versus fresh INTER qualification.

---

### TIME — DTE-Managed Overwrite

**Core idea:** Avoid carrying short calls into an increasingly unstable near-expiration gamma regime merely to collect the last residual value.

**Candidate review levels:** 7 / 14 / 21 DTE or natural expiry.

**Action:** DTE threshold triggers re-underwriting, not necessarily automatic closure.

**Relevant observables:** remaining extrinsic, BTC ask, assignment intent, dividend timing, moneyness.

**Application:** expiration-risk control and simplification.

**Complexity:** low.

**Backtestability:** excellent.

---

### BAND — Delta-Band Managed Overwrite

**Working historical nickname:** "Delta Staircase Covered Call." Research found "delta-band covered call" as existing practitioner vocabulary; "Delta Staircase" is descriptive project language, not established strategy nomenclature.

**Core idea:** Delta rails trigger reconsideration of an existing cap.

**Candidate experimental state machine:**
- middle region: HOLD;
- upper review: Δ ≥0.45, S ≥K, and ≥10 DTE remaining;
- lower review: Δ ≤0.07 OR ≥75% original premium captured;
- inside the final ~7–10 DTE use a separate expiry protocol;
- upper/lower rail triggers review, not automatic trade;
- permitted outcomes include HOLD, BTC-to-uncovered, BTC+fresh-qualified replacement, or accept assignment;
- max one roll per cycle;
- replacement DTE capped; no open-ended DTE treadmill;
- after BTC-to-uncovered, 5-trading-day dwell before rewrite in the proposed experiment.

**Application:** Dynamic management of a cap that becomes binding or economically exhausted.

**Strongest surviving idea:** delta is useful as an **attention/re-underwriting alarm** because short-call delta indicates how much local share participation is being surrendered.

**Not demonstrated:** that intra-life delta-band rolling improves net Growth outcomes.

**Likely weak regimes:** whipsaw, low-vol grinding bull, explosive gaps, volatility shock without corresponding price move.

**Complexity:** highest in this family.

**Backtest burden:** BAND must beat simpler FIXED / INTER / PART alternatives after realistic costs to justify complexity.

---

### COND-COV — Volatility-Conditioned Coverage Ratio

**Core idea:** Adjust the percentage of shares covered according to compensation rather than use a binary all-covered/all-uncovered state.

**Illustrative experimental structure:**
- low compensation → 0–20% covered;
- normal → 40%;
- rich → 60%;
- very rich → 80%.

These numbers are examples for design exploration, not researched thresholds.

**Application:** Larger Growth holdings where contract granularity allows smooth coverage changes.

**Institutional precedent:** BXMC varies full versus half coverage using VIX condition.

**Potential benefit:** Combines INTER and PART without intra-life rolling.

**Complexity:** moderate but mechanically simple.

**Backtestability:** excellent.

---

### STAGGER — Staggered Overwrite

**Core idea:** Split short-call obligations across expirations rather than concentrate all coverage at one entry/expiry point.

**Institutional analogue:** BXMW uses four staggered weekly tranches of four-week calls.

**Application:** Diversify timing, spot, and volatility entry risk across a larger share position.

**Does not solve:** capped upside by itself.

**Complexity:** moderate.

**Backtest:** synchronized monthly versus 2-tranche versus 4-tranche.

---

### EXP-ROLL — Expiry/Resolution-Only Management

**Core idea:** Anti-BAND. No mid-cycle management.

**Rule:** Hold through natural resolution, then independently underwrite the next call.

**Application:** Bound turnover, execution friction, and duration-extension/treadmill risk.

**Complexity:** low.

**Backtest:** strong baseline.

## Interesting simple combinations

### LOW-INTER — Low-Delta Intermittent Overwrite

Candidate:
- 35–45 DTE;
- 0.16–0.20Δ;
- liquidity gate;
- IVR ≥X;
- otherwise WAIT/uncovered;
- hold accepted call to resolution.

Controls **distance + timing** with very few parameters.

This is a strong candidate for first automation because the action space is only WRITE or WAIT.

### PART-INTER — Conditional Partial Overwrite

Candidate concept:
- coverage ratio rises as option compensation improves;
- cheap volatility can imply little/no coverage;
- rich volatility can justify more coverage.

Controls **fraction + timing**.

Potentially strong Growth architecture for ≥200–500-share positions.

### INTER-HARVEST — Intermittent Overwrite with Profit Harvest

State machine:

UNCOVERED → qualified call → COVERED → profit target reached → BTC → REQUALIFY → COVERED or UNCOVERED

No roll concept is required.

This may capture much of the desired lifecycle behavior with lower complexity than BAND.

## Reusable Growth-overwrite observables

These should be treated as reusable decision evidence rather than tied to one strategy.

| Dimension | Observable | Economic question |
|---|---|---|
| Upside sold | short-call delta | How much marginal share participation is being surrendered now? |
| Upside room | (K / S) - 1 | How far can shares rise before the strike? |
| Compensation | executable call premium | What are we actually paid? |
| Relative volatility | IV Rank / percentile | Is optionality rich versus its own recent history? |
| Volatility risk premium | implied minus realized/forecast vol | Are we being compensated for selling volatility? |
| Time | DTE | How long is the right tail being sold? |
| Harvest state | % original premium captured | How much of the original opportunity has already been earned? |
| Residual obligation | extrinsic value / BTC ask | What does freedom from the obligation cost now? |
| Execution quality | spread dollars; spread / mid | How much expected edge is lost crossing the market? |
| Coverage | covered shares / total shares | How much inventory has capped upside? |
| Participation | approximate net equity delta | How much instantaneous equity participation remains? |
| Turnover | executions/year | What does complexity cost? |

For a partially covered share position, a useful approximate participation heuristic is:

`portfolio participation ≈ 1 - (coverage_fraction × short_call_delta)`

Example: 40% coverage with 0.20Δ calls gives approximately 92% local equity participation before higher-order effects.

This is a comparison aid, not a complete outcome metric.

## Backtesting ladder — earn complexity

Do not begin with a giant parameter optimization.

### Experiment A — Delta surface

BH versus fixed calls at 0.10 / 0.15 / 0.20 / 0.25 / 0.30Δ.

Goal: measure the price of progressively selling more upside.

### Experiment B — Compensation gate

Take one promising low-delta policy and vary IVR threshold:

0 / 20 / 30 / 40 / 50 / 60 / 70.

Goal: determine whether **when** upside is sold improves the Growth/premium tradeoff.

### Experiment C — Coverage surface

At a frozen entry rule, vary coverage:

0 / 20 / 40 / 60 / 80 / 100%.

Goal: measure whether **how much** upside is sold dominates lifecycle complexity.

### Experiment D — Harvest

Add fixed profit-capture thresholds, with fresh requalification after BTC.

Goal: determine whether removing economically exhausted obligations adds value.

### Experiment E — BAND

Only after strong simple baselines exist, test delta-band lifecycle management.

Goal: determine whether intra-life cap renegotiation adds value beyond distance, timing, fraction, and simple harvest.

**Principle:** every experiment must earn the next unit of complexity.

## Muse's proposed five-arm falsifiable experiment

The attached research memo recommends one pre-registered SPY comparison:

1. **BH** — buy-and-hold.
2. **FIXED** — 0.16–0.20Δ, 35–45 DTE, hold to expiry.
3. **BAND** — FIXED plus upper/lower review rails, max one roll, no net DTE treadmill, BTC-to-uncovered allowed.
4. **INTER** — common low-delta entry only when 1-year IV Rank ≥50; otherwise uncovered.
5. **PART** — 50% coverage.

Execution should use realistic bid/ask, commissions/fees, and spread sensitivity rather than midpoint fantasy fills.

Primary Growth metrics:
- terminal wealth / CAGR;
- upside capture in the best underlying-return quartile;
- max drawdown / downside capture;
- premium ledger reported separately from total P&L;
- total execution friction;
- turnover;
- days covered versus uncovered;
- assignment count;
- DTE-extension days where rolling exists.

Muse's proposed BAND kill rule:
- reject BAND unless it beats FIXED on both terminal wealth and bull-quartile upside capture at realistic costs without worse max drawdown;
- reject the roll-up component if any BAND advantage is explained entirely by BTC-to-uncovered time rather than replacement rolls;
- reject lower-delta as the lower-rail controller if premium-captured/DTE/spread management performs better.

## Market-regime map from the research

### Strong sustained rally
BH strongest structural upside. FIXED limits one cap per cycle. BAND may repeatedly pay to chase the cap. PART preserves guaranteed uncapped fraction.

### Explosive/gapping rally
Delta rails may be crossed before options can trade. PART is structurally robust because uncovered shares participate automatically.

### Rally then immediate collapse
BAND is vulnerable to paying BTC/roll costs near the local high just before the new higher cap becomes irrelevant.

### Long decline
Premium cushions only part of equity loss. Repeated rewrite/roll-down behavior can create recovery problems.

### Decline then sharp recovery
INTER/PART have attractive structural properties because deliberate uncovered inventory can participate fully in the rebound. Rewriting depressed strikes can be especially damaging to Growth.

### Sideways/high-volatility
Overwrite strategies have their most intuitive home; compensation is rich and caps are less costly.

### Low-volatility grinding bull
INTER may simply abstain. BAND faces thin premium plus repeated cap pressure and friction.

### Volatility shock without price move
Delta can change because IV changes. Delta-only action is therefore unsafe; moneyness/DTE/volatility context matters.

## Current research classification

- **FIXED:** simple, credible baseline; institutionally analogous; strong backtest candidate.
- **INTER:** simple, highly automatable, philosophically aligned with Growth; threshold effectiveness unproven.
- **PART:** simplest structural solution where contract granularity permits; strong institutional precedent.
- **HARVEST/TIME:** simple lifecycle controls; exact practitioner thresholds unratified.
- **BAND:** coherent re-underwriting framework, not demonstrated performance edge.
- **COND-COV:** promising synthesis of timing and fraction; institutionally analogous in spirit.
- **STAGGER:** timing-diversification structure, not direct capped-upside cure.
- **EXP-ROLL:** strong low-turnover baseline.

## Durable interpretation

The research question has changed from:

> Can Wheelwright dynamically move a covered-call cap upward?

to:

> What is the simplest rules-based overwrite policy that preserves the Growth mandate's equity participation while extracting worthwhile option compensation?

That framing leaves **NO CALL** as a valid outcome and makes simple alternatives first-class competitors rather than straw-man baselines.

No Product policy, numeric threshold, automated trade instruction, or implementation is ratified by this artifact.
