# Independent Fidelity public-reference / terminal-settlement design assessment — 2026-10-29

**Disposition: QUALIFIED design support; no automatic approval of a changed financial predicate.** Read-only inspection of accepted b399 runtime/source owners and contract schemas. Principal’s reported choice authorizes bounded request-triggered public contract-reference acquisition, not assumed standard100 terms, grant changes, Account-market/Order reads, polling, trading or deployment. No protected data, real provider/model request or source/service/grant mutation occurred.

## Existing source and contract authority

PortfolioOptionDefinitions and PortfolioOptionReferenceSources intentionally leave price multiplier null when not independently supplied. The compact-chain owner can admit an explicit single underlying-share deliverable and PHYSICAL settlement when shares-per-contract agrees; it does not substitute that count for multiplier. PortfolioReferenceTerms.warnings expressly states that deliverable share counts do not establish a price multiplier. Current combine derives STANDARD_EQUITY_INTRINSIC only with known multiplier equal to the delivered share count. Both OptionTerms and TacticalOptionTerms OAS allOf constraints require non-null positive multiplier for that applicability. Current PortfolioMath uses multiplier for intrinsic arithmetic as well as quote valuation.

Therefore public acquisition wiring alone may still leave terminal geometry unavailable. Relabeling multiplier, setting existing applicability despite null multiplier, or globally marking complete terms qualified would violate the present source/contract distinction. A genuine separation requires an explicit, independently testable backend predicate and aligned contract semantics.

## Mathematical versus source sufficiency

Premium quote scaling and physical exercise settlement are different quantities. A contractual terminal value may use an evidenced exercise quantity D independently of an unknown premium quote multiplier **if** the accepted source profile establishes delivery of exactly D shares of the same underlying against exercise consideration D×K in the stated currency, with standard/unadjusted terms, an unambiguous strike denomination, matching right/expiration and no cash/other components or conflicting evidence.

For that supported profile, the physical call value is max(D×S−D×K,0), and shares minus short-call terminal value can be evaluated using D. No default100 is necessary. This is contractual intrinsic/terminal value, not quote-based mark, premium, cost basis, P/L, break-even, target, available collateral or current execution price. The prior independent synthetic D50/D100 and unmatched-ratio findings continue to apply.

**D alone is insufficient.** “Shares per contract” does not by itself state strike exercise consideration or premium quote scale. A standard profile may carry the necessary strike-unit meaning, but its admission must be grounded in authoritative provider/contract semantics rather than an implementation’s repeated word Standard. Existing UNKNOWN/missing/cash/adjusted/conflicting terms must not be upgraded by geometric convenience. There is no new Product policy needed merely to calculate already-established physical rights; there is an evidence/contract obligation to establish those rights and state which result is qualified. If exercise consideration or strike unit remains unknown, withholding the actual capped shape remains correct.

## Smallest bounded realization to falsify

- Keep multiplier null with its source warnings; retain incomplete overall option terms where premium-scale facts are missing.
- Admit a distinct terminal-settlement applicability/quantity basis with exact reference provenance and supported source-profile assumptions. Do not silently reuse the existing OAS applicability that promises non-null multiplier. Reuse the existing exact geometry evaluator behind the narrower terminal-only predicate; leave quote mark/premium/P&L paths blocked by their existing dependencies.
- Require exact held quantity cancellation before calling the aggregate capped. Non100, over/under share ratio and multiple calls must use actual evidenced exercise quantities. Preserve all source rows and compatibility-versus-membership distinction.
- Keep public observations and source dates separate from custody, orders and opening continuity. Reference refresh cannot renew custody or create current opening basis.

Internal explicit series→source Instrument/underlying URI binding is reasonable reuse of the existing owners, provided complete binding/geometry/currency/root validation occurs before mutation and duplicate/ambiguous/missing requested subjects fail atomically. Default TT1 namespace/resolution must remain unchanged. Public provenance URNs remain free of Account IDs/private artifact identifiers; a cross-broker URI binding must not silently assert broader legal equivalence than its checked series facts. Any independently retained contradictory facts remain conflict, not overwritten source precedence.

Acquisition selection must be current source-resolved Fidelity-held series within the caller’s metadata/holdings/Position and existing global market/reference authorization. Bound100series/10underlyings and the final payload, reuse existing one-day reference retention policy, and distinguish missing/denied/failed reference evidence. No Account-market quote/Order reads should become a fallback. Principal approval of this public-reference operation does not broaden those other capabilities.

## Required focused counterexamples

Pure standard D50 and D100 with unknown premium multiplier; exact capped ratio versus under/over-share ratio; unknown strike unit/exercise consideration; missing or conflicting share count; cash/mixed/other deliverables; adjusted/nonstandard series; wrong underlying/right/strike/expiration/currency/root; source/private URI mismatch; duplicate bindings/missing subset; reference reuse/expiry and failure; no permitted acquisition with insufficient grant; unchanged TT1; and assurance that marketValue/premium/P&L/break-even/progress remain unavailable even when terminal geometry qualifies.

This assessment does not establish what the actual BDRY public response contains or that it supplies sufficient settlement facts. A frozen implementation and controlled retained-source specimens are required for independent source-to-financial review. No live provider or private-record operation was performed.

CURRENT STATE: Public-reference reuse qualified; terminal settlement can be separated from quote scale only under explicitly established physical-rights semantics and aligned contracts.

DECISION REQUIRED: NO

NEXT AUTHORIZED ACTION: Return the bounded evidence/authority finding; review the exact frozen source/profile before accepting any changed terminal predicate.
