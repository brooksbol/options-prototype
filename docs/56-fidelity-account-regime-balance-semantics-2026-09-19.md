# Fidelity Account-Regime and Broker-Balance Semantics — Discovery

**Date:** September 19, 2026  
**Status:** Reconciled discovery / broker-evidence record  
**Authority:** Supporting evidence and why-state; not Wheelwright policy  
**SYNC at reconciliation:** `c1e22e0e6575f70e722088aad0c2dc41ca2eb169`  
**Canonical intake:** `PL-DEPLOY-BAL`  
**Related:** `PL-DEPLOY`, `BUG-022`, `docs/foundations/options-domain-reference.md`

## Discovery

Live Fidelity balance-page definitions plus two real account specimens establish that Fidelity exposes materially different balance dialects for non-margin and margin-enabled accounts. Wheelwright must preserve the broker-native facts and project them into common decision meanings; it must not normalize the two account types into a fictitious universal cash/buying-power model.

The governing shape is:

> **broker-native facts → account-regime classification → Wheelwright semantic projection → policy**

not:

> broker-native facts → parser folding / synthetic Fidelity accounting → one universal “cash” number.

## Specimen A — PTS margin-enabled account

Observed September 19, 2026:

| Fidelity fact | Value |
|---|---:|
| Total account value | $114,830.71 |
| Account equity percentage | 100.00% |
| Margin buying power | $17,242.78 |
| Non-margin buying power | $8,621.39 |
| Available without margin impact | **$0.00** |
| Committed to open orders | $4,000.00 |
| Cash reserved for options strategies | $900.00 |
| Settled cash | **$1,923.15** |
| Cash only available to withdraw | **$1,923.15** |
| Cash and borrowing on margin | $10,568.16 |
| Net house surplus | $11,247.89 |
| Net SMA | $10,621.39 |
| Net exchange surplus | $11,572.01 |
| Cash market value | $102,431.55 |
| Margin market value | $10,645.01 |
| Option market value | -$2,352.00 |
| Cash (core) | $923.19 |
| Cash credit | $1,899.96 |
| Margin credit/debit | **$0.00** |
| Margin interest accrued | **none** |

### Load-bearing observations

1. **AWMI and Settled cash can diverge in a real margin account.** Here AWMI = $0 while Settled cash = $1,923.15. This closes the principal residual empirical gap recorded in BUG-022 and validates AWMI as the broker-native answer to Wheelwright’s MARGIN-regime question “what additional amount can be deployed without margin borrowing/interest?”
2. **Margin-enabled != margin-borrowing.** Positive margin market value and positive margin buying power coexist with margin credit/debit = $0 and no margin interest accrued.
3. **No current margin debt != positive unlevered deployment capacity.** The account has no margin debit while AWMI is $0.
4. **Capacity != owned liquidity.** Margin buying power, Non-margin buying power, and Cash-and-borrowing withdrawal capacity are broker capacity/credit concepts, not Treasury-owned cash.
5. **Holding classification != financing.** Margin market value is the value of positions carried in margin, not the amount borrowed.
6. House surplus, SMA, and exchange surplus are distinct broker requirement/surplus facts and must not be collapsed into one synthetic “margin cushion.”

## Specimen B — Sawdust Roth non-margin account

Observed September 19, 2026:

| Fidelity fact | Value |
|---|---:|
| Total account value | $23,925.94 |
| Available to trade (all settled) | **$10,510.06** |
| Available to withdraw | **$710.06** |
| Cash and credits | $10,510.06 |
| Value of investments | $13,415.88 |

### Load-bearing observations

1. The non-margin export is structurally much simpler and does not expose the margin-account balance family.
2. For this regime, Wheelwright’s unlevered Deployable projection is Fidelity’s **Available to trade (all settled)**.
3. **Tradable liquidity != withdrawable liquidity.** $10,510.06 is tradable while only $710.06 is withdrawable. The reason for the difference is not established by this specimen and must not be invented.
4. Absent margin fields are **not zero**; they are absent/not applicable.

## Fidelity broker semantics captured from the live balance UI

These are `[BROKER]` semantics, not universal clearing mechanics:

- **Margin buying power:** maximum capacity, including cash and margin, for fully marginable securities.
- **Non-margin buying power:** capacity for securities that do not themselves permit borrowing against them (Fidelity examples include options, penny stocks, ETFs, and mutual funds). It is not synonymous with cash-only/unlevered capacity.
- **Available without margin impact (AWMI):** amount usable without borrowing on margin and incurring interest.
- **Committed to open orders:** amount allocated to pending orders, reducing remaining trade capacity.
- **Cash reserved for options strategies:** broker cash requirement for applicable option strategies; preserve as a fact and do not reverse-engineer Fidelity’s internal reserve-netting formula.
- **Settled cash:** settlement/GFV-oriented cash concept; not synonymous with Deployable.
- **Cash only available to withdraw:** collected cash withdrawal capacity without margin borrowing.
- **Cash and borrowing on margin:** withdrawal capacity including potential broker credit.
- **Net house surplus:** margin equity above Fidelity’s house requirement.
- **Net SMA:** surplus associated with the Federal Regulation T requirement.
- **Net exchange surplus:** margin equity above the exchange requirement.
- **Cash market value:** market value of applicable positions carried as cash positions; not cash-on-hand.
- **Margin market value:** market value of applicable positions carried in margin; not margin debt.
- **Option market value:** market value of long and short option positions.
- **Cash credit:** Fidelity accounting credit associated with unsettled activity and/or unswept settled cash under Fidelity’s definition.
- **Margin credit/debit:** actual margin financing balance; distinct from margin holding type and buying power.

## Semantic projections established/refined

### Unlevered deployable capital

- CASH / legacy Fidelity regime → `Available to trade (all settled)`
- MARGIN Fidelity regime → `Available without margin impact`
- INDETERMINATE → `null` / fail closed

This is the already-remediated BUG-022 behavior and is **validated, not changed**, by the new evidence.

### Unlevered withdrawable cash — candidate semantic projection

- CASH → `Available to withdraw`
- MARGIN → `Cash only`
- INDETERMINATE → unknown/fail closed

This projection is semantically supported by Fidelity’s labels/definitions but is not implementation authorization.

### Financing state — orthogonal to account regime

Margin capability, current margin debit, accrued margin interest, and potential borrowing capacity are separate facts. A margin-enabled account can have no current margin debt; a no-debt margin account can simultaneously have zero additional AWMI.

## Invariants

1. Preserve broker facts distinctly; do not fold them at ingestion.
2. Missing/not-applicable is not numeric zero.
3. Do not treat buying power or borrowing capacity as owned Treasury liquidity.
4. Do not infer current debt from margin holding type or margin capability.
5. Do not infer unlevered deployable capacity from settled cash on a margin account.
6. Do not reconstruct Fidelity NAV, house requirements, SMA, exchange surplus, or reserve netting unless Fidelity supplies a documented contract sufficient to do so.
7. Broker-authoritative current balances outrank Wheelwright synthetic approximations for the broker concepts they directly report.
8. Semantic projections answer explicit Wheelwright questions; they do not erase the underlying broker facts.

## Epistemic limits retained

- Fidelity’s internal reserve-netting formula remains unproven.
- No automatic deployment/margin-risk policy is established from house surplus, SMA, or exchange surplus.
- No generalized broker-accounting engine is justified.
- This evidence is Fidelity-specific. Other brokers require their own current broker/account grounding.

## Reconciliation summary

Strategically this **strengthens existing `PL-DEPLOY`** and does not create a new roadmap Bet. Architecturally it refines the existing fact/derivation boundary and account-regime projection discipline; no new architecture-roadmap direction is required. A bounded canonical identity, `PL-DEPLOY-BAL`, preserves the unresolved capability/runtime/test consequences without reopening BUG-022.

Production implementation is not authorized by this record.
