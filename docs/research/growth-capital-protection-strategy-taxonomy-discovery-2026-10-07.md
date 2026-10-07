# Growth / Capital Protection Strategy Taxonomy — Discovery

**Date:** 2026-10-07  
**Status:** Discovery only — not ratified policy, taxonomy, or implementation authorization

## Purpose

Preserve an open taxonomy question discovered while comparing Growth Wheel behavior with capital-protection techniques such as collars. This record is a breadcrumb for later reconciliation with Wheelwright's regime, mandate, strategy-expansion, capital-state, and Growth research.

## Thesis under investigation

A Growth / Compounding mandate can plausibly operate under capital-protection policy without ceasing to be a Growth mandate.

Canonical specimen:

- long-term, tax-deferred account;
- SPY shares are owned for long-term appreciation;
- a collar is established on those shares;
- the long put creates a governed downside floor;
- the short call finances some or all of that protection by surrendering explicitly acceptable upside;
- income from the short call is incidental to the protection mechanism rather than the portfolio's primary objective.

In this specimen, the reason for owning SPY remains Growth / Compounding even while the shares are protected.

## Structural problem

It may be a category error to treat **Growth Wheel** and **Capital Protection** as sibling variations of one strategy family.

The option structures are materially different.

### Wheel

A conventional Wheel is a short-option lifecycle with capital-state transitions resembling:

    cash + short put -> shares + short call -> cash

Assignment participates directly in the lifecycle. The short put is an acquisition/re-entry mechanism and the covered call is an owned-inventory monetization/disposition mechanism.

A Growth-oriented Wheel may alter policy around that lifecycle — for example by reducing overwrite frequency, using lower-delta calls, tolerating uncovered ownership, or otherwise preserving more upside participation — while remaining recognizably Wheel-shaped.

### Collar

A collar has a different structural identity:

    long shares + long put + short call -> protected shares

The put polarity is reversed relative to the Wheel's cash-secured put. The long put establishes a downside boundary. The short call finances protection and establishes an upside boundary. Renewal re-underwrites a protection envelope; it does not inherently create the Wheel's cash-to-shares-to-cash lifecycle.

Repeated collars therefore do not become a Wheel merely because the options expire and are renewed.

## Open taxonomy hypothesis

One possible decomposition is:

    Portfolio mandate / objective
        -> strategy family
        -> operating regime or policy
        -> mechanism

Under that hypothesis:

    Growth / Compounding
        -> Wheel
        -> growth-oriented policy
        -> CSP / covered-call lifecycle

and:

    Growth / Compounding
        -> Hedged Equity
        -> Capital Protection
        -> collar

This would allow Growth Wheel and a SPY collar to serve the same Growth mandate while remaining structurally different strategies.

It would also allow Capital Protection to be orthogonal to portfolio mandate. For example, capital-protection policy might potentially govern Growth capital or Income capital when downside consequences justify an explicit floor.

## Important unresolved distinction

Do not yet ratify **Capital Protection** as a strategy-family name.

A cleaner taxonomy may be:

- **Growth / Compounding** — mandate or objective;
- **Wheel** — strategy family;
- **Hedged Equity** — separate strategy family;
- **Capital Protection** — regime, policy, or governed risk posture;
- **Collar** — mechanism / option structure.

That placement must be reconciled against current Wheelwright vocabulary before canonization.

## Objective-function implication

For the SPY specimen, capital protection does not necessarily replace Growth as the objective.

A more accurate formulation may be:

> Maximize long-term compounded growth subject to an explicit acceptable capital-loss boundary.

That differs from maximizing protection or minimizing drawdown at all costs. Protection may instead operate as a constraint on a Growth objective.

## Questions for later reconciliation

1. Is Capital Protection properly a regime, a policy, a risk posture, or something else in the current Situation Architecture?
2. Are Growth and Income portfolio mandates, regimes, Operating Programs, or overloaded terms in current documentation?
3. Does **Hedged Equity** deserve explicit strategy-family semantics?
4. What makes a Growth Wheel structurally remain a Wheel?
5. What protection objective or consequence threshold causes Growth capital to choose Hold, Protective Put, Collar, Sell/Reduce, or another path?
6. How should protection cost be measured: option debit, surrendered call premium, surrendered upside, time encumbrance, execution friction, or a combination?
7. How should a capital-protection policy define floor, horizon, DTE, acceptable upside cap, and renewal/re-underwriting?
8. Can the same Capital Protection semantics govern both Growth and Income mandates without collapsing mandate and regime into the same taxonomy axis?

## Existing work to reconcile

Before promoting any of these terms to authority, reconcile this discovery with:

- `docs/foundations/regime-objective-function.md`
- `docs/foundations/strategy-expansion-governance.md`
- `docs/47-capital-state-management-deployment-paths-discovery-2026-09-07.md`
- `docs/49-share-capital-release-cost-decision-discovery-2026-09-08.md`
- recent Growth / Growth Wheel research, including covered-call delta-band and growth-overwrite taxonomy work
- current Situation Architecture, governed-scope, Portfolio Mandate, and Operating Program/configuration vocabulary

## Non-decision

This record does **not**:

- create a Capital Protection regime;
- create a Hedged Equity strategy family;
- rename or redefine Growth Wheel;
- authorize systematic SPY collars;
- define collar strike, DTE, renewal, or execution policy;
- alter any existing production policy or implementation.

It preserves the hypothesis and the structural evidence so the taxonomy can be revisited deliberately.
