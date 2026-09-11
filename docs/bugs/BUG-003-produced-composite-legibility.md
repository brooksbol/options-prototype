# BUG-003 — Production "Produced" result is not sufficiently legible: composite economic sources are not first-order visible

- **Status:** Open
- **Severity:** S3
- **Area:** Production (cognitive-correctness / presentation semantics)
- **Provenance:** GitHub Issue #8 (https://github.com/brooksbol/options-prototype/issues/8) — historical, non-authoritative. Created 2026-09-04. Labels: `defect`, `area:production`, `S3`.

## Observed failure

Production can present a **correct composite** monthly Produced result without making its economic composition sufficiently legible. The number can be right while answering "where did it come from?" requires the operator to perform arithmetic or reconstruct lifecycle joins.

This is a **cognitive-correctness / presentation-semantics** defect measured against Wheelwright's evidence-appliance semantics — not a request for visual polish, and distinct from the accounting-correctness bug in `BUG-002` (it remains even when `BUG-002` is fixed).

## Intended semantics violated

Wheelwright is an evidence appliance whose surfaces should "represent the environment, not the machinery" and let the operator read state without reconstructing it. The Production surface's first-order operator question is:

> "How much has the strategy produced this month, and where did it come from?"

Requiring the operator to do arithmetic or reconstruct cross-transaction lifecycle joins to answer the second half is a correctness gap against evidence-appliance / state-oriented-console semantics.

## Evidence (confirmed from implementation)

- **Produced is a genuine composite.** `ProductionAssessor` aggregates `knownCashProduction` across multiple `ProductionSource` values: `OPTION_PREMIUM`, `REALIZED_APPRECIATION`, `MONEY_MARKET_INCOME`, `TREASURY_DISCOUNT`, `DIVIDEND`. A single "Produced $X" can silently combine all of these.
- **The decomposition already exists in the backend response.** The assessment returns a `productionBreakdown` map keyed by `ProductionSource`, a `netStrategyResult` (defined as `OPTION_PREMIUM + REALIZED_APPRECIATION - CAPITAL_EROSION`, excluding structural income), and a per-transaction audit trail of `EconomicComponent`s. The evidence to answer "where did it come from" is present but not surfaced as a first-order answer.
- **Lifecycle attribution requires joins the operator should not perform.** Option premium is booked at sell-to-open and realized appreciation at the call-away, on separate transactions/dates. A single per-episode "produced" figure is synthesized only in the frontend episode ledger (`buildResolveChapter`) and only when a matching backend component is available.

### Empirical trigger (illustration only)

The Sep 3 2026 SLV case exposed the ambiguity: two adjacent rows both showed +$53.34 with no on-surface decomposition, and even an expert reviewer could not distinguish premium from appreciation without inspecting code or the source CSV. Cited only as the trigger that surfaced the defect, not as its definition.

## Consequence

The operator cannot easily see that Produced = premium + appreciation + structural income, and in what proportion. S3 (moderate): the composite figure is correct but its composition is not legible on-surface.

## Diagnosis / root cause

Backend already computes the decomposition (`productionBreakdown`, `netStrategyResult`, `EconomicComponent` trail); it is not surfaced as a first-order operator answer.

## Scope / non-goals

Records the defect and its factual basis. Does **not** prescribe a UI solution (no decomposition panel, tooltip, or layout is authorized or implied). Filing does not authorize remediation; priority/sequencing is a separate Principal decision.

## Distinction from BUG-002

- `BUG-002` is about **computing the number correctly** (called-away basis resolution).
- This defect is present **even when the number is computed correctly**: composition remains illegible.

## Acceptance criteria

Not separately enumerated in the historical record beyond the intended-semantics statement above (no UI solution prescribed).

## Remediation history

None.

## Verification

None.

## Related

- Accounting-correctness sibling: `BUG-002` (called-away basis resolution).
- Lifecycle/decomposition context: `PL-PROD-EVENTS`, `PL-PORT-02` (supporting context only).
