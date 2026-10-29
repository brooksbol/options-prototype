# Independent early financial-integration design challenge — 2026-10-29

**Design disposition: QUALIFIED.** Support preserving explicit native bracket relationships and correcting coverage-only overqualification. Do not use the proposed chain alone to populate existing current-occurrence opening/tenure/P&L fields. No implementation, Product ratification or operational acceptance is granted.

Baseline inspected: `8b6857fdfca667bbba6412f196dec2bb2690bfb4`. Source-only review of ComplexOrderEvidence, PackageEvidence, OrderEvaluation, ReadService and applicable OAS, under ADR-016/022 and maintained unresolved Position identity. No raw originals, private records, provider/model requests, services or grants were accessed or changed. Reported actual OTOCO contents were supplied by the commissioning actor; they were not independently inspected as provider facts.

## Native relationship versus current occurrence

The source currently flattens native OTOCO trigger/child records into group corroboration, losing role edges. Preserving the explicit trigger→child relationship is legitimate evidence recovery. It can establish **which reported opening instruction caused which reported closing instructions** when source contracts, identities and cuts support that claim. This requires no universal Position identity.

The additional link to current observed contracts establishes a different predicate: the active child addresses a uniquely reconciled current quantity. These two true predicates do not automatically establish that the current held inventory still originates in the trigger fill.

Adversarial indistinguishable-history specimen: trigger A fills; an independent manual Order later fully closes those contracts; identical contracts are reopened by B; the retained bracket child from A still addresses the same present quantity. Unless verified native semantics prohibit this surviving-child state, or another authority excludes the reduction/replacement, the proposed current inputs are consistent with both original and replacement inventory. “No competing opening retained” is insufficient when traversal/history coverage is unknown. A partial close/re-add can create the same problem without changing aggregate quantity.

Therefore an unambiguous native bracket may support a **broker-linked historical entry reference**, source fill cash/time and elapsed time since that reference, explicitly qualified. It does not by itself support current acquisition basis, uninterrupted tenure, current-held gross P/L or an opening event for the current occurrence. Current `Timeline`/OrderEvaluation and AssociationAuthority contracts require the claimed association to be substantiated; enum `BROKER_EXPLICIT_ORDER_LINK` is not additional proof. Do not insert a historical reference into an established opening slot and rely on a disclaimer to change its meaning.

A stronger bounded association could legitimately supply those existing fields without universal Position identity if supported by one of: a source-native identity/contract that binds current inventory to that execution; independently verified broker semantics excluding replacement; or an accepted, scoped event-completeness/reconciliation premise from the fill through the relevant cut. These are alternatives, not a mandate to invent universal complete history. ADR-022's completeness condition is scoped to its governed cohort; do not silently universalize it or waive the analogous causal gap here. Current averageOpenPrice/createdAt alone acquire no new semantic authority merely because values exist.

Minimum implementation scope: retain immutable native role edges, exact source/Account lineage and known fill facts; retain the existing current closing-scope association; expose a qualified historical bracket reference only where the contract can faithfully distinguish it. Keep current occurrence/basis/tenure unresolved until its stronger predicate is evidenced. If the desired operator meaning differs, reconcile that meaning before repurposing fields.

## Coverage-only suppression is overbroad

ReadService.propagate currently turns COVERAGE_INSUFFICIENT into allocation CONFLICT and nulls market/opening/P&L/payoff/range/management outputs together. For an otherwise uniquely reconciled option construction, insufficient external cash/share support does not invalidate its independently observed contracts, quantities, quote value or terminal contractual rights. Existing terminalPayoff is an appropriate reuse point; preserve TERMINAL_VALUE labeling when basis is unknown.

Use a bounded dependency distinction, not a blanket “coverage conflicts never matter” bypass:

- Remaining DTE/spot depend on qualified terms/calendar/source quote, independently of cash coverage.
- Terminal geometry depends on established composition/quantity, compatible terms/currency/horizon; current market value additionally needs qualified quote inputs.
- Opening cash/original tenure require the separately established opening association and verified fills. Gross/net P/L and management thresholds retain their existing basis/fee/Order prerequisites.
- Coverage sufficiency, reserved/available collateral and secured-strategy conclusions still require their own support evidence.

Keep coverage warnings/relationships explicit without falsely marking reconciled constituent allocation as conflicting. Preserve actual overallocated/UNKNOWN composition and quote/term conflicts: those can still invalidate dependent quantities/geometry/economics. Multiple simultaneous defects must not disappear behind the first warning. An independently valid output is preserved; an unavailable dependency is not supplied merely to recover CLI parity.

## Required adversarial specimens

Before claiming an opening predicate: ordinary OCO without trigger; duplicate/missing/contradictory trigger; cross-Account or stale/mixed source cuts; same legs in two brackets; filled status with incomplete/duplicate/partial fills; changed contract/multiplier/currency/deliverable; child replacement/cancellation/partial fill; whole close/reopen; partial reduction/re-add; additional same-series opening; reversal/correction; unknown history coverage. Assert exact failure disposition and that no current opening/basis/tenure leaks through a historical reference.

For coverage correction: hold identical reconciled constituents/quotes fixed while cash support changes sufficient→insufficient. Terminal geometry, spot, DTE and independent market value should remain identical while coverage status changes. Then vary actual allocation overuse/unknown membership, stale/missing quotes and unsupported terms independently to confirm affected outputs still fail closed. With unavailable entry, preserve terminal rights and withhold current P/L/progress; with independently proven entry, preserve only outputs whose remaining dependencies hold.

This is early design falsification and test direction, not evidence that these implementation tests ran. Financial parity remains unestablished until distinct predicates and dependencies pass independent executable checks.

CURRENT STATE: Historical native linkage and dependency-specific coverage correction are supported in principle; current-occurrence opening inference remains unsupported by the proposed chain alone.

DECISION REQUIRED: NO

NEXT AUTHORIZED ACTION: Return the bounded predicate/dependency findings to the commissioned implementation owner for reconciliation.
