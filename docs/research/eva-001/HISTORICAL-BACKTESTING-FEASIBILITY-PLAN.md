# EVA-001 — Historical Backtesting Feasibility: Deferred Investigation Plan

**Status:** PLANNED / PARKED. Documentation only. No platform selection, subscription, data purchase, software implementation, backtest, paper trade, or live trade authorized.

**Purpose:** Resolve whether an existing historical-options backtesting platform can produce an independently analyzable, credible, costed record for a single defined-risk options spread. This is a feasibility gate for EVA entry-selection research, not a mandate to build a system.

## Context and source-of-truth boundaries

- EVA-001 [draft protocol](PROTOCOL.md) is **draft 0.2**; it currently uses SPY iron condors. Subsequent conversation favors testing feasibility with a **two-leg SPX credit vertical**, subject to data, execution, capital and settlement checks. This plan **does not silently revise the protocol**.
- Original Muse platform survey: [options-backtesting-platforms-20261014.md](muse-raw/options-backtesting-platforms-20261014.md) if archived; otherwise retain the original uploaded artifact. Muse's “LEAN is the verified winner at $0” and ready-made Python EVA estimator claims are **not accepted**.
- Codex's latest review (relayed by Principal): LEAN, ORATS, tastytrade Lookback remain **candidates**. Free-tier export, fill synchronization, vendor access, and underlying data sufficiency are unresolved.
- Prior [round-one](ROUND-1-VERIFICATION.md), [round-two](ROUND-2-VERIFICATION.md), [data audit](DATA-AUDIT.md), and [conversation recovery](CONVERSATION-RECOVERY-2026-10.md) remain distinct artifacts. Do not upgrade actor reports to established facts without verification.
- **Separate workstream:** prospective paper-trading platform research. Do not merge it with historical backtesting, nor assume the same platform must serve both.

## Bounded operator question

Can **one historical SPX two-leg credit vertical** (or a justified alternative if unavailable) be reconstructed from synchronized entry and exit evidence, with an explicit fixed management policy, transparent fees and fill assumptions, and a trade-level export sufficient to independently recalculate net P/L and entry-time features?

This tests feasibility and reproducibility only. It **does not** establish EVA forecast skill, trading alpha, realistic executable complex-order fills, or suitability for deployment.

## Candidates — no winner yet

1. **QuantConnect / LEAN:** Verify exact Free vs paid entitlement for historical SPX options, backtest orders, API access, log limits, Object Store, entry-feature access, export route, and local download rights. LEAN's combo-limit fill model can use bar extrema from different moments; “atomic” simulated fills do not prove executable package prices. Verify synchronized quote-based modeling. Current docs include walk-forward primitives, but not a proven leakage-safe EVA workflow.
2. **ORATS:** Verify whether one template-based credit vertical with a 50%-credit target / 21-DTE exit can be reconstructed and exported with entry IV/RV-relevant features, contract IDs, timestamps, leg-level bid/ask, fees and exit reasons. Identify when a separately paid Data API is necessary. Document exact spread-travel assumptions and sensitivity; 53% four-leg travel is not a full take-liquidity fill and does not automatically transfer to verticals.
3. **tastytrade Lookback:** Verify accessible features, historical data resolution, spread fill/target rules, per-trial export, entry feature fields and costs. “Free” is useful only if the specimen is reproducible and independently analyzable.

Apply **the same standards** to all three. No requirement for a native walk-forward button if independent chronological splits are possible. No automatic disqualification for templates, overlapping observations (provided dependence is handled), or midpoint **diagnostic** scenarios; midpoint-only results cannot support executable headline economics.

## Investigation sequence — when resumed

**Gate 0 — Exact entitlements and documentation (no spend):**
- Establish actual account/tier capabilities and terms for each candidate; separate cloud access, API calls, downloadable data and research export.
- For LEAN, identify an **exact, supported** path from historical strategy orders to a trade-level table joined with **entry-time-only** market features on the available plan. Free-tier API exclusion and log/Object Store restrictions are active objections; do not assume `read_backtest_orders` is available at $0.
- Confirm SPX contract universe, expiration/settlement (AM/PM), multiplier, quote timestamps, spread orders and broker/exchange fee models.
- Identify the precise behavior of the intended order type; LEAN combo fill may use nonsimultaneous bar high/low and requires a time-consistent sensitivity scenario. Do not assert slippage alone fixes synchronization.
- Reconcile Muse's conflicting descriptions of Option Alpha EV volatility inputs as a **separate documentation correction**, not a new platform candidate.
- Result: short evidence matrix with vendor source, documented behavior, plan/tier, unknowns, cost, and exact specimen feasibility.

**Gate 1 — One exportable specimen (only after Gate 0):**
- Predefine a small SPX credit vertical, historical date, expiration, strike selection, entry timing, fixed 50% opening-credit target / 21-DTE time exit **as experimental controls**, broker fee schedule, and cost scenarios.
- Reconstruct entry, order/fill or nonfill, exit, contract IDs, synchronized underlying/option quotes, entry-time IV and RV inputs, gross P/L, itemized fees, net P/L and missing-data diagnostics.
- Compare natural-side execution, explicit conservative package rules, and midpoint **diagnostic** sensitivity; distinguish target touch from actual historical fill.
- Export an auditable record and **independently recompute** arithmetic. A platform's aggregate equity curve is not enough.
- If no coherent historical entry/exit evidence exists, report **DATA INSUFFICIENT** and stop; do not silently substitute theoretical prices.

**Gate 2 — Decision memo (no automatic implementation):**
- Classify each candidate: DOCUMENTED / DEMONSTRATED / VALIDATED-FOR-BOUNDED-USE / NOT DEMONSTRATED.
- Record fee fidelity, fill-timing realism, export completeness, feature availability, operational effort and real costs.
- Decide whether any candidate supports the **smallest EVA entry-selection experiment**, whether another structure/instrument is necessary, or whether to stop.
- Cross-engine disagreement may come from differing data and conventions; agreement is **not execution truth**. Use a second engine only if it resolves a specified uncertainty.

## Explicit separation of later experiments

- **Historical backtesting:** reconstruction and retrospective OOS development; separate predictive quality, net economic selection value, and tail measures.
- **Prospective paper trading:** independent platform search and contemporaneous frozen control/treatment observations; NOT part of this platform feasibility plan.
- **Small live trades:** optional, separately authorized, capped execution-calibration research; NOT part of this plan.
- **Production v1/v2:** no implementation or deployment authority granted. Strategically specific EVA economics and policy remain owned; commodity data/simulation may be adopted.

## Resume checklist

When the Principal resumes: (1) inspect this plan and latest EVA-001 protocol; (2) verify any new Muse paper-trading report separately; (3) ask Codex for a narrow **Gate 0** evidence/entitlement review; (4) only then decide whether to run a no-cost Gate 1 specimen. Preserve rejected assumptions and reasons, not just the selected vendor.

**Current state:** Plan persisted; parked at Gate 0. **Next authorized action tonight: none.**
