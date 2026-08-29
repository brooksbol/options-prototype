# Project Parking Lot — Continuation

> This file is a physical continuation of `docs/parking-lot.md`. Together, `docs/parking-lot.md`, this file, and any later numbered continuation files constitute **one logical Wheelwright parking lot**.

**Started:** August 29, 2026
**Status:** Canonical Project / Operational State (Category C), same authority and governance as `docs/parking-lot.md`

---

## Continuation Invariant

This is not Parking Lot v2 and does not introduce a new backlog, governance model, priority scheme, or namespace.

- All intake, merge, split, supersession, promotion, removal, and disposition rules from `docs/parking-lot.md` continue unchanged.
- Stable IDs are globally unique across the complete parking-lot sequence.
- Existing items remain where they were recorded; they do not need to be copied here.
- New intake is recorded in the latest continuation file unless reconciliation of an existing item requires editing its original record.
- Cross-file relationships are normal. An item in this file may refine, depend on, merge into, or supersede an item in an earlier continuation.
- Future scans, cold starts, reconciliations, and backlog reviews must inspect **all** `docs/parking-lot*.md` files, not only `docs/parking-lot.md`.
- If this file becomes unwieldy, continue physically in `docs/parking-lot-3.md` under the same invariant.

The file boundary exists only for maintainability. It has no semantic meaning.

---

## Active Items — Continuation

### Historical / Observational Family

| ID | Name | Summary | Concept Home |
|---|---|---|---|
| `PL-EVID-MVPTA` | Minimum Viable Technical Analysis / Deployment-Quality Evidence Experiment | **Exploratory evidence/research item; not Decision policy and not implementation authorization.** Determine whether a deliberately small set of non-predictive, point-in-time market observations improves Wheelwright's assessment of compensation relative to accepted capital consequence without materially destroying useful deployment opportunity. Candidate primitive evidence: (A) historical daily OHLCV as the only meaningful new provider acquisition, (B) IV/strike/delta geometry already present in production option-chain evidence with selected IV observations remembered over time, and (C) existing spot observations. Candidate local derivations: ATR/normalized realized movement, recent range extrema and strike distance from them, strike distance in ATR units, gap/discontinuity behavior, realized volatility, minimal price persistence/trend only if empirically useful, current IV, and IV trajectory including the hypothesis that high IV while falling may represent rich compensation during normalization. Initial posture toward support/resistance is factual geometry rather than a prediction that a level will hold: e.g. strike below recent low, distance from recent territory, repeated extrema only if later evidence demonstrates incremental value. **Policy-over-prediction guardrail:** observations remain evidence; strategy-specific Decision logic may eventually interpret them differently, but MVPTA must not become chart-reading, technical-rating, or signal-generation machinery. Avoid indicator-library creep (RSI/MACD/stochastics/Bollinger/Ichimoku/candlestick patterns/magic thresholds) absent evidence. **Research requirements:** point-in-time reconstruction with no look-ahead leakage; explicit adjusted/unadjusted price and corporate-action semantics; horizon/window coherence with Wheelwright's actual DTE/lifecycle; cross-symbol normalization; strategy-neutral evidence ownership; feature redundancy/marginal-information testing; scheduled-event/discontinuity handling; explicit insufficient-history/stale/missing/bad-data states; backfill/retention policy; corporate-action/ticker identity; feature-definition/version provenance; and an explicit dependent variable for "deployment quality." Candidate evaluation framing: does evidence improve compensation relative to capital consequences subsequently experienced, without materially reducing useful deployment opportunity? Fewer assignments, lower adverse excursion, or higher premium alone are not sufficient definitions of improvement. **Architecture:** provider → primitive Evidence → reproducible derived observation → research/validation → only empirically justified observations may later be considered by Decision/Deployment. Prefer transparent facts over opaque aggregate "technical scores." **Acquisition/TOC constraint:** do not alter the active constraint-identification campaign in `docs/39-constraint-identification-restart-plan.md`; Herbie is not yet identified. Historical OHLC is highly deferrable and should eventually be subordinate to Decision-critical evidence according to whatever acquisition constraint/capacity the campaign establishes. Conceptual daily-history contract is approximately one successful completed-bar renewal per maintained symbol per completed trading day, not minute-scale freshness. Current IV should reuse chain acquisition; IV history should primarily be manufactured by remembering acquired evidence rather than requesting additional chains. **Persistence:** SQLite remains the working assumption; expected MVPTA volume is modest (roughly millions, not billions, of compact rows for multi-year daily history) and does not itself justify a database migration. Avoid persisting every contract/Greek on every chain refresh merely for MVPTA. Observation identity must follow the economic observation, not multi-expiration acquisition topology; the `spot_history` amplification finding in doc 37 is an explicit warning. Store canonical primitives and minimal durable temporal observations; derive indicators locally or materialize only justified summaries. **Sequence:** preserve Tuesday constraint-identification experiment unchanged → establish safe acquisition hierarchy/capacity → bootstrap low-priority historical OHLC → derive candidate features locally → retrospectively/observationally test discriminatory value against Wheelwright outcomes → only then consider promotion into Deployment eligibility/acceptability/fitness semantics. Full discovery record: `docs/40-minimum-viable-technical-analysis-discovery.md`. | `PL-EVID-01`; `PL-DEPLOY`; `PL-DEPLOY-02`; `PL-EVID-04`; `docs/37-console-sparkline-temporal-evidence-finding.md`; `docs/39-credit-spreads-deployment-behavioral-discipline-discovery.md`; `docs/39-constraint-identification-restart-plan.md`; `docs/40-minimum-viable-technical-analysis-discovery.md`; Policy over Prediction; Market-Priced Risk |

---

## Continuation History

| Date | Event |
|---|---|
| Aug 29, 2026 | `docs/parking-lot-2.md` created as a physical continuation of the single logical parking lot. MVPTA integrated as `PL-EVID-MVPTA`, reconciling the complete discussion with existing `PL-EVID-01`, `PL-DEPLOY`, `PL-DEPLOY-02`, Market-Priced Risk, support/volatility discovery, observation-identity findings, and the active constraint-identification campaign. |
