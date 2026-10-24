# Wheelwright Talk — bull put spread construction-search checkpoint

**Captured:** 2026-10-24. **Standing:** Principal-requested durable Product exploration checkpoint; candidate design/experiment direction only. Does not ratify any search defaults, composite score, probability model, Operating Regime policy, brokerage order, new endpoint, or software implementation.

## Exact Principal wording and intent

- “find me the best short put spread.”
- “show me the best put spread for SPY” — SPY is incidental; the reusable question takes an underlying.
- “it's not a harder question like is this a good trade.”
- “and its an intentionally easier question than ‘is a short put spread a good strategy’”
- “yeah, i just assumed 45 DTE but that shouldn't be assumed. i'm sure i'm missing other things too. ‘best’ could mean many things, but i figure once i've established a trading pattern it could be a great accelerator”
- “we're back to what does 'best' mean. i for one think it's a combination of things. premium. risk/reward. execution probability. POP. Pxx. maybe volatility related stuff.”
- “the next hardest question would be: what is the best short put spread in the top ten mpost liquid etfs/indexes. but we'll save that one for later.”
- “also, talk doesn't have to give one answer. it could give multiple answers each for different regimes. or if it knows the regime you're talking about, could focus on that.”

This explores automating the existing manual tastytrade Curve workflow: underlying + eligible expirations/strikes/widths + price/probability/risk/liquidity measures → candidate comparison and selected strikes or deltas. Not a decision that spread selling is profitable or an authorization to trade.

## Product distinctions

1. **Construction search:** “Show me the best put spread for SPY.” Find eligible bull put credit spreads and compare their properties under *explicit* objectives/constraints. This is deliberately easier than judging strategy value.
2. **Position assessment:** “How is my spread doing?” Requires executed fills, current and historical economics, management state.
3. **Regime-conditioned decision / strategy evaluation:** “Is this spread attractive?” and “Is selling short put spreads a good strategy?” invoke forward expectancy, market conditions and empirical research/backtesting. Do **not** turn a construction-search question into an automatic backtesting project.

No fixed 45 DTE, width, deltas, maximum loss, risk budget, or objective may be silently assumed. Distinguish hard eligibility criteria, evaluation metrics, ranking preferences and applicable Operating Regime. Where ambiguity is material, ask an economical clarifying question or show several qualified Pareto-leading candidates rather than pretending there is one universally best answer. An explicitly governed regime may focus/limit selection when its attachment to the relevant capital and task is established; Account identity or ticker alone does not establish regime. If multiple regimes legitimately apply, several answers with separate criteria may be more useful. Illustrative lens labels are not newly ratified regimes.

## Dimensions to explore

- Premium: quoted/conservative opening credit and fees.
- Risk/reward: maximum expiration gain/loss, credit-at-risk, width, quantity/multiplier, capital exposure; not automatically buying power.
- **Execution probability**: distinct from bid/ask quality; quote spread, depth, age and session are evidence, not a validated fill probability.
- **POP**: model-dependent probability of positive P/L at a defined horizon and price/cost basis.
- **Pxx**: distinguish an x%-of-original-credit management target (already present in TT Live) from **probability of reaching** that target within a specified path-dependent horizon. Delta is not POP or profit-target hit probability. Do not conflate any of these.
- Volatility: IV level/skew/term structure, perhaps IV vs expected/realized movement as supported; establish source, model and limits.
- Time: DTE window, holding horizon, early exit/checkpoint rules, and comparability.
- Quote/liquidity eligibility, source completeness and reproducibility.

A composite “best” may require a transparent regime-relative policy, not arbitrary model-chosen weights. It may present a compact Pareto shortlist, multiple criterion winners, or no qualified candidate. Financial calculations, admission and ranking are deterministic over fixed, verified evidence, model and rules; language/UI narrate and visualize.

## Codex read-only findings (separate from Principal decisions)

Independent repository assessment delivered October 24, 2026, main `99241146a37c643f39e65af7ce5656df549f0b73`: recommendation **EXPERIMENT**, no mutations.

- Tradier option-chain acquisition/pacing and normalized option evidence exist.
- Existing single-put candidate screening and liquidity assessment exist; not an exhaustive two-leg enumeration.
- TT Live recognizes held spreads and computes held-position payoff/exit measures; API v2 backend includes qualified Construction matching and piecewise payoff mathematics.
- **Not established complete:** prospective two-leg bull-put enumeration/search, general POP engine, profit-target hitting-probability model, durable saved search recipes, full chain and quote-term coverage.
- Terms/identity, multiplier/deliverable, leg bid/ask clocks and execution-quality coverage require validation before hard economic claims.
- Existing Recipes (`PL-RECIPE-01`) are a **candidate** conceptual precedent for explicit, versioned saved search patterns, not an authorized framework. Avoid a new DSL.
- Current `docs/roadmap.md` Trade Finder scope hands exact strikes/width/POP/P50 tuning to broker; extending Wheelwright to do it is an **unresolved Product-scope proposal** requiring explicit experiment authority. Do not treat existing frontend math as backend-approved search.
- Codex suggested one-expiration, one-width conservative-credit first specimen. This is an engineering probe, **not** a ratified definition of best. Principal subsequently emphasized multi-metric and multi-regime comparisons.

Source discovery anchors: `docs/roadmap.md`; `docs/discovery/tastytrade-iron-condor-operator-learning-2026-09-30.md`; `docs/foundations/options-domain-competence-contract.md`; `docs/cli/tt-live-panel-history.md`; `docs/knowledge/domain/accounts-and-operating-regimes.md`; `docs/parking-lot-8.md` (Recipes); `docs/discovery/operator-question-inventory-2026-10-22.md`; `docs/discovery/wwt-position-analysis-product-direction-2026-10-23.md`; Codex inspection of `TradierAdapter`, `MarketChain`, `PortfolioMath`, `PortfolioRecognition`, `PortfolioReferenceTerms`, browser single-put selection, and TT Live calculations. Reverify current SHA and authoritative source lines before changes.

## Bounded next experiment — proposal, not implementation

**Product question:** “Show me the best put spread for SPY.” Use SPY only as an example; no ticker hardcoding or assumption that a current chain is available.

- First prove that the existing provider/normalized evidence can support a bounded, enumerated set of eligible two-leg bull put candidates and their deterministic economics, with exclusions and comparable pricing basis. Reuse backend authority. Verify a small independent golden fixture exhaustively covers all eligible pairs; keep quote quality explicit.
- Present the same candidate universe under **multiple supported, explicit lenses** (e.g. conservative credit, credit/max loss, risk constraint), or a non-dominated shortlist. Do not invent POP/Pxx execution-fill probability or volatility ranking. Unsupported dimensions appear as explicit gaps, not fake scores. A single winner is optional.
- Ask only for indispensable constraints missing from any established governing pattern; no hidden 45-DTE default. If a probability dimension is proposed, first define event, horizon, model, measure, inputs, validation, and acceptance against a trusted reference; it may be excluded from first implementation.
- Real operator value is in showing concise **short/long strike or delta**, expiration, credible net credit, max gain/loss, quality and why a construction leads under a named objective. Preserve supporting detail on demand.
- No trades, grants, brokerage execution, expanded market acquisition, generalized backtester or API redesign by implication. Isolate experiment from active private Talk preview and protect rollback/main.
- Falsify with changed underlyings, strikes, widths, expired/stale/crossed quotes, incompatible terms, empty universe, tied ranks, partial coverage, and unsupported probability measures. Never claim mid as executable or a model probability as historical hit rate.

## Later—not this experiment

“What is the best short put spread across the ten most liquid ETFs and indexes?” adds a governed universe definition and cross-underlying normalization, including differing multiplier, liquidity and risk characteristics; do not silently fold this into the one-underlying slice.

**Current standing:** Exploration captured. Codex read-only recommendation EXPERIMENT. No search defaults or multi-regime selection policies ratified, and no new implementation authorized by this checkpoint.


## Principal Product observation — actionability correction (October 24)

After the isolated Codex synthetic browser experiment (candidate `a4822f3ca7cf763be09a1704c0d3a6c97036ba00`, port 8788) was presented, the Principal said: **“this is good. but it's not actionable. unless i missed it, i don't see strike prices or deltas”** and then directed **“make it so. then ask codex to iterate.”** Preserve this as genuine Principal observation rather than inferred acceptance. The experiment report contains synthetic strike pairs (105/95 and 100/95), but it did not establish that both legs are visually salient in the actual UI, and did not report deltas. The operator should be able to immediately identify **underlying, expiration, short put strike, long put strike**, together with selected objective and key economics; show qualified leg deltas where the source supports them, otherwise mark them **unavailable** without inventing values. Do not make execution identity depend on opening expandable details. All prototype examples remain emphatically SYNTHETIC, not actionable live trade quotes or broker handoffs. Principal direction requests a bounded Codex iteration on the isolated experiment; it does not ratify live pricing, probabilities, a model, broker execution, new API endpoints, integration or deployment. Verify source state and preserve original candidate for independent comparison before any allowed iteration.
