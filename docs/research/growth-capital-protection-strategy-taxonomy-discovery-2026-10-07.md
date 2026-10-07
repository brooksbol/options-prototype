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
- the long put creates a quantity-, strike-, and horizon-specific downside boundary for the matched shares;
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

A Growth-oriented Wheel may alter policy around that lifecycle — for example by reducing overwrite frequency, using lower-delta calls, tolerating unencumbered share ownership, or otherwise preserving more upside participation — while remaining recognizably Wheel-shaped.

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

## Adversarial qualifications

Subsequent review preserves the central Growth-versus-protection distinction but narrows several claims.

### 1. A collar does not guarantee ownership retention

A collar describes a current construction on owned shares; it does not guarantee that the shares remain owned through or after the collar horizon. The short call can result in share surrender. Early assignment can leave cash plus a surviving long put.

Accordingly:

    long shares + long put + short call

describes the protected construction, not a guaranteed resulting ownership state.

Where Growth includes a preference for retaining particular inventory, ownership resolution is itself a material consequence.

### 2. The protection boundary requires amount, quantity, and horizon

A put strike is not a permanent floor on total capital. The protection claim must identify at least:

- the number of shares protected;
- the put strike;
- the option quantity;
- the protection horizon / expiration;
- net option cash flow and other relevant costs.

For a simplified matched collar, the expiration consequence envelope can be bounded over that horizon, but expiration ends that particular put protection. Repeated renewal does not establish a permanent cumulative capital floor because protection costs, share prices, strikes, and horizons can change.

### 3. Construction does not determine program membership

Wheel and collar remain structurally different option constructions. Repeated collars do not become a Wheel merely because options expire and reopen.

The converse is not established either: a governed Wheel might potentially use a collar during an owned-share phase without necessarily abandoning its broader operating purpose. Whether that is permitted is a program/policy authority question.

The conventional Wheel state-transition diagram is therefore a useful structural reference, not a ratified definition requiring continuous alternation between short puts and covered calls. Existing Growth discovery also permits direct purchase, patience, and unencumbered share ownership.

### 4. The proposed taxonomy is analytical, not a mandatory hierarchy

The distinctions among why capital exists, what operating process governs it, what outcomes are acceptable, and what construction implements a current choice remain useful.

They do **not** establish this as compulsory architecture:

    Mandate -> Strategy Family -> Regime/Policy -> Mechanism

Capital-protection constraints may cross mechanisms and programs. One mandate may govern different quantities using different constructions. A collar may also serve a temporary protection or disposition window rather than imply durable membership in a Hedged Equity family.

The hierarchy in this note therefore remains a hypothesis to test, not exclusive parentage or ratified ontology.

### 5. Protection economics require an explicit comparison baseline

"Protection cost" is incomplete without stating the alternative being compared.

| Baseline | Material comparison |
|---|---|
| Unencumbered shares | Net option cash flow, downside protection, and surrendered upside |
| Existing covered call | Added put expenditure and changed consequences |
| Protective put | Call compensation received in exchange for the upside cap |
| Sell / reduce shares | Retained exposure versus released capital and reduced ownership |

Surrendered call premium and surrendered upside should not be counted as independent costs without defining the baseline and avoiding double counting. A "zero-cost collar" can have little or no opening option debit while still imposing meaningful economic sacrifice through capped upside and other consequences.

## Re-entry is a separate policy problem

A collar has no built-in re-entry strategy. It defines protection and surrender terms for existing ownership. If the short call removes the shares, the collar itself does not determine whether or how ownership should be restored.

Principal post-call-away paths can include:

| Path | Consequence |
|---|---|
| Buy shares immediately | Restore ownership at the current purchase price |
| Buy shares and establish a new collar | Restore ownership with newly accepted protection and upside limits |
| Sell a cash-secured put | Pursue contingent reacquisition; ownership may remain absent |
| Place a discounted buy order | Seek acquisition at a specified price without option premium |
| Wait | Preserve capital and accept continued nonownership |

A surviving long put may potentially protect repurchased matched shares for its remaining horizon, but suitability of its strike and duration is a fresh governed decision.

If the protective put is exercised while a short call survives, the remaining call exposure must be included in the complete-position analysis. Restoring shares can restore coverage; remaining without shares while leaving the short call open creates uncovered call exposure.

For the Growth specimen, the central re-entry question is:

> Restore desired ownership now, or accept continued absence while pursuing different acquisition terms?

Neither the old collar nor its exit price answers that question. Automatic repurchase and recollaring can repeatedly surrender shares at a cap and repurchase at a higher market price. Automatic cash-secured-put re-entry can leave Growth capital out of the underlying during continued appreciation.

This exposes a missing **re-entry policy**, not a missing option primitive or mechanism. Re-entry policy remains unratified.

## Questions for later reconciliation

1. Is Capital Protection properly a regime, a policy, a risk posture, or something else in the current Situation Architecture?
2. Are Growth and Income portfolio mandates, regimes, Operating Programs, or overloaded terms in current documentation?
3. Does **Hedged Equity** deserve explicit strategy-family semantics?
4. What makes a Growth Wheel structurally remain a Wheel?
5. What protection objective or consequence threshold causes Growth capital to choose Hold, Protective Put, Collar, Sell/Reduce, or another path?
6. How should protection cost be measured: option debit, surrendered call premium, surrendered upside, time encumbrance, execution friction, or a combination?
7. How should a capital-protection policy define floor, horizon, DTE, acceptable upside cap, and renewal/re-underwriting?
8. Can the same Capital Protection semantics govern both Growth and Income mandates without collapsing mandate and regime into the same taxonomy axis?\n9. When ownership is surrendered, what governed re-entry policy determines whether, when, and how desired ownership is restored?

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
