# Sosnoff on Money / Cashflow Academy research analysis — 2026-09-26

**Status:** Research analysis and decomposition/design evidence. Not Product policy, architecture, implementation authority, trading advice, or authorization of any additional Operating Program.

**Source artifact:** `docs/research/sosnoff-on-money-research-report-2026-09-26.html`

**Authority boundary:** Principal-ratified Product meaning in `docs/65-principal-ratification-bounded-production-console-wheel-rules-2026-09-26.md` controls the bounded production Console walking slice. This analysis does not modify, broaden, reinterpret, or supersede Doc 65.

## Why this research matters

The Sosnoff corpus and the prior Cashflow Academy corpus provide a second independent practitioner comparison showing that broad activity or family labels underdetermine operating behavior.

The two corpora share substantial surface language and practice: premium selling, small sizing, implied volatility as an input, liquidity, event awareness, and behavioral discipline. Yet the research reconstructs materially different operating doctrines beneath that overlap.

The important domain result is therefore not that one corpus is "right" and the other "wrong." It is that a family/activity description such as "premium selling" does not uniquely determine the prescription for a concrete decision.

This strengthens, but does not independently prove, the existing distinction between a broad strategy/activity family and an explicitly governed Operating Program.

## Strategy family is not Operating Program

The Wheel-family research already showed that "Wheel" does not identify one canonical rulebook. This comparison supplies a neighboring example: practitioners can share a premium-selling orientation while differing materially in their assumptions, exception model, assignment stance, management doctrine, treatment of long optionality, probability interpretation, and meaning of discipline.

Accordingly:

> A broad strategy or activity label can locate a methodology family without determining the by-the-book action.

For governed decision purposes, the operative question remains program-relative:

> Given the selected governed Operating Program and version, this Decision Subject, the applicable governed context, and the evidence available at the decision boundary, what does that particular Program prescribe?

This research is evidence for the need to preserve that distinction. It is not authority for the contents of any Program.

## Operating Program is strategy-family-neutral

The existence of multiple Wheel-family programs does not narrow `Operating Program` to "Wheel flavor."

Wheel variants are one possible class of Operating Programs. Other repeatable investment methodologies may also constitute Operating Programs if and when their identity, rules, applicability, versioning, evidence requirements, and governance are separately specified and authorized.

This is a semantic boundary, not a scope expansion.

A useful falsifier for future design is:

> A foundational Operating Program concept is improperly Wheel-coupled if its meaning requires the Wheel family to remain meaningful.

Wheel-specific semantics may be required by a particular Wheel Program and by bounded domain-specific implementation. They should not silently redefine the foundational meaning of Operating Program itself.

This does **not** require a generic strategy engine, policy DSL, multi-strategy UI, universal options ontology, or implementation of any non-Wheel Program.

## Methodology fidelity and methodology validity remain separate

The comparison also strengthens another distinction:

1. **Program identity and fidelity:** what a particular methodology actually prescribes.
2. **Empirical validity:** whether the methodology's assumptions and prescriptions survive evidence.
3. **Execution:** what was actually done.
4. **Outcome:** what subsequently happened.

A governed Program may legitimately contain a mechanical rule because that rule is part of the Program without Wheelwright asserting that the rule is universally optimal or that the economic explanation offered for it is empirically established.

The Sosnoff research is especially useful here because it distinguishes a recognizable mechanical premium-selling lineage from the strength of the evidence offered for its claimed structural edge.

## Evidence-quality lesson

The research report found the Sosnoff channel to be a small, enumerable corpus whose exact transcript-level mechanics were not recoverable because usable captions/transcripts were unavailable. It therefore treated familiar tastytrade-lineage parameters as outside-lineage context rather than silently promoting them to channel doctrine.

That is the correct authority discipline for future research:

- practitioner doctrine is evidence of what a methodology says;
- repeated convention is not proof of optimality;
- outside lineage can contextualize but must not be silently attributed to the studied corpus;
- empirical support, practitioner assertion, inference, and unresolved evidence should remain distinguishable.

## Brokerage-friction finding

The report surfaced brokerage and market-structure friction as a comparatively distinctive practitioner concern: liquidity and spread quality, product access, data and exchange fees, idle-cash treatment, margin rates, transfers, broker risk systems, operator-error responsibility, and trade-desk access.

This is useful domain evidence. It does not by itself establish a required capability, change the current thin slice, or authorize broker integration. It should remain available to later decomposition when such frictions become load-bearing.

## Relationship to Doc 65

Nothing in this research invalidates the Principal-ratified bounded production Console rules.

Doc 65 does not claim a universal Wheel rulebook. It ratifies two bounded rules for an assignment-centric Wheel Program under explicit governed applicability:

- existing governed covered-call state may produce `LET RESOLVE`;
- eligible governed unencumbered Wheel inventory may produce `SELL CALL`;
- missing applicability, governance, or evidence fails closed as `UNRESOLVED`;
- `SELL CALL` is a phase Recommendation and does not answer `WHICH CALL?`.

The new research particularly reinforces the value of that last boundary. DTE, delta, strike selection, profit-taking, rolling, and related mechanical conventions must not enter the bounded Program merely because they are familiar practitioner canon.

## Explicit non-authority

This analysis does not:

- create or ratify a Sosnoff or tastytrade Operating Program;
- authorize implementation of another strategy family;
- modify `LET RESOLVE`, `SELL CALL`, or `UNRESOLVED`;
- supply exact contract-selection policy;
- ratify DTE, delta, profit-target, rolling, stop, or volatility rules;
- establish that one practitioner corpus is globally superior;
- establish a universal premium-selling edge;
- authorize multi-Program comparison in the current thin slice;
- authorize a generic strategy/rule/policy engine;
- broaden the production Console boundary;
- supersede Doc 63, Doc 64, Doc 65, ADR-019, or other accepted authority.

## Reconciliation pressure

For the next design reconciliation, this research should be used as a falsifier against accidental overfitting, not as a source of new Product requirements.

In particular, inspect whether the design:

- makes Operating Program secretly synonymous with Wheel flavor;
- allows family labels or familiar practitioner defaults to determine Recommendations without explicit governed Program authority;
- conflates faithful Program execution with empirical validation of the Program;
- imports contract-selection mechanics into the ratified `SELL CALL` phase decision;
- weakens fail-closed behavior because a convention is familiar;
- prevents future Programs with materially different operating doctrines from fitting the foundational semantics without rewriting those semantics.

Passing those checks does not authorize broader implementation. It only preserves the intended boundary while the first walking slice remains intentionally narrow.
