# BUG-022 — Deployable cash is regime-unaware: the balances parser folds margin-derived buying power into the legacy "all settled" slot, over-stating unlevered deployable capacity on a margin-enabled account

- **Status:** Open
- **Severity:** Not established
- **Area:** Write Desk / broker-balance ingestion and deployable-cash derivation (`options-prototype/src/csv/fidelity/balancesParser.ts`, `options-prototype/src/write-desk/fidelity-snapshot.ts`, `PortfolioSnapshot.deployableCash` contract in `options-prototype/src/write-desk/types.ts`, `tests/write-desk/fidelity-upload.test.ts`)
- **Provenance:** Discovered 2026-09-17 (investigation into a live Operator/Write Desk "Deployable" figure that disagreed with Fidelity). Independent review by ChatGPT (reasoning partner) and Kiro (repository investigation). Not previously filed. No GitHub Issue.

## Observed failure

On the current PTS margin-enabled Fidelity account, Wheelwright presents **Deployable ≈ $6,734** while Fidelity's own export for the same account reports **Available without margin impact = $0** and **Settled cash = $0**. Wheelwright is therefore labeling broker *buying-power capacity that requires margin* as unlevered "Deployable" cash, and would size cash-secured-put deployment against capital the broker says cannot be put to work without margin impact.

The figure Wheelwright surfaces ($6,734.37) is exactly Fidelity's **Non-margin buying power** row — a distinct broker concept from "Available without margin impact" — which the ingestion path currently treats as interchangeable with settled/unlevered deployable cash.

## Intended semantics violated

- **Policy over prediction / honest capacity.** "Deployable" is Wheelwright's unlevered, put-writing capacity. It must reflect what the operator can actually commit now without incurring margin, not the broker's margin-inclusive buying power.
- **Persist facts; derive trust.** Distinct broker-authoritative balance fields (Settled cash, Available without margin impact, Non-margin buying power, Margin buying power, Cash reserved for options) are distinct facts and must be preserved distinctly. They must not be normalized into a single legacy field at ingestion; the deployable *decision* is a domain-layer derivation, not a parser responsibility.
- **Authority before consumers.** The defect originates at the ingestion/authority layer (the parser makes a domain decision and mislabels its output), not in the consumers that read `deployableCash`.

## Evidence

Epistemic tags: **[observed]** = present in a real exported file or read directly from current source; **[established diagnosis]** = confirmed by reading committed code/history; **[inference]** = reasoned from evidence but not directly proven; **[reasoned candidate]** = proposed remediation semantic, not yet specimen-validated.

### Specimen A — Sawdust Roth (legacy / non-margin export) — CASH/legacy positive specimen **[observed]**

Real Fidelity Balances export, account `262761078` (Roth IRA), downloaded 2026-09-17 1:22 PM ET:

```
,Balance,Day change
Total account value,23736.47,67.64
AVAILABLE TO TRADE,,
Available to trade (all settled),510.28,
Available to withdraw,510.28,
HOLDINGS,,
Cash and credits,10310.28,
Value of your investments,13426.19,21.64
```

- Structural layout: `Available to trade (all settled)` is a **value-bearing row** ($510.28).
- **Absent** rows: `Settled cash`, `Non-margin buying power`, `Margin buying power`, `Available without margin impact`, `MARGIN STATUS`, `Account equity percentage`.
- Correct unlevered Deployable for this account is **$510.28** (the legacy "all settled" field). Note `Cash and credits` ($10,310.28) is materially larger than deployable — even here deployable is not raw cash.
- Current code produces the correct value for this specimen (the legacy `"all settled"` branch captures $510.28 directly; no fold is triggered because the margin fields are absent).

### Specimen B — PTS (margin-enabled export) — MARGIN negative specimen **[observed]**

Real Fidelity Balances export, account `Z39411514` (margin-enabled), downloaded 2026-09-17 12:51 PM ET:

```
,Balance,Day change
Total account value,113842.91,2244.36
Account equity percentage,100.00%,
AVAILABLE TO TRADE,,
Margin buying power,13468.74,13366.24
Non-margin buying power,6734.37,6683.12
Available without margin impact,0,-51.25
Cash reserved for options strategies,900,
Settled cash,0,
AVAILABLE TO WITHDRAW,,
Cash only,0,
Cash and borrowing on margin,0,
MARGIN STATUS,,
House surplus,7393.18,7341.93
SMA,6734.37,6683.12
Exchange surplus,7677.52,7626.27
No margin interest accrued,,
HOLDINGS,,
Cash market value,106209.61,-2423.69
Margin market value,8666.38,8666.38
Option market value,-1997,-1831
Cash (core),5051.25,
Cash debit,-4165.33,-2195.9
Margin credit/debit,0,0
```

Key rows:

| Broker field | Value |
|---|---:|
| Non-margin buying power | $6,734.37 |
| Available without margin impact | $0 |
| Settled cash | $0 |
| Cash reserved for options strategies | $900 |
| Margin buying power | $13,468.74 |
| Account equity percentage | 100.00% |

- Correct unlevered Deployable for this account is **$0** (`Available without margin impact`). Wheelwright currently shows **$6,734.37** (`Non-margin buying power`). **[observed]**
- `Non-margin buying power` ($6,734.37) is strictly greater than both `Settled cash` ($0) and `Available without margin impact` ($0), demonstrating that Non-margin buying power is **not** an unlevered figure and is **not** interchangeable with either. **[observed]**

### Behavior chain — current source **[established diagnosis]**

1. `balancesParser.ts` parses the distinct current-format fields (`settledCash`, `nonMarginBuyingPower`, `availableWithoutMarginImpact`, `cashReservedForOptions`) but then executes a fold:
   ```ts
   if (availableToTradeAllSettled == null) {
     availableToTradeAllSettled = nonMarginBuyingPower ?? availableWithoutMarginImpact;
   }
   ```
   For Specimen B this sets `availableToTradeAllSettled = 6734.37` (nullish-coalescing selects Non-margin buying power because it is non-null).
2. `fidelity-snapshot.ts`: `deployableCash = input.balances.availableToTradeAllSettled ?? input.balances.availableToTrade` → `6734.37`.
3. UI (`HeaderPortfolioStatus.tsx` and other consumers) renders `snapshot.deployableCash` as "Deployable" → $6.7K.

### Regime signal **[established diagnosis]**

`Account equity percentage = 100.00%` is present on the **margin** Specimen B and **absent** on the cash-only Specimen A. Equity percentage therefore cannot distinguish regime. The reliable regime signal is **field presence**: the margin regime is marked by the presence of `Non-margin buying power` / `Margin buying power` / `Available without margin impact` / `MARGIN STATUS`; the legacy/cash regime by their absence together with a value-bearing `Available to trade (all settled)` row.

### Historical origin **[established diagnosis]**

The fold entered in commit `62acc8f` (2026-09-09), titled "provider-aware session gate + **settled-cash-only deployable hardening**." The commit message and its journal entry describe *removing* the buying-power fallback and resolving deployable from Settled cash only. The committed code does the opposite: it introduced the `nonMarginBuyingPower ?? availableWithoutMarginImpact` resolution and mapped it into the legacy `availableToTradeAllSettled` slot. The in-code comment documents this as an intentional "2026-09-08" decision superseding "Settled cash only." Message/journal and implementation/tests are in direct, self-aware contradiction inside one commit. `balancesParser.ts` has had no commits since `62acc8f`; the behavior is live.

### Latent-coincidence mechanism **[established diagnosis]**

`tests/write-desk/fidelity-upload.test.ts` encodes the folded behavior as intended, including fixtures where `Non-margin buying power ≈ Available without margin impact ≈ Settled cash`, and a `FIDELITY_BALANCES_DIVERGENT` fixture that asserts deployable = Non-margin buying power ($56,552.99) over Settled cash ($47,051.19). All current-format fixtures model a margin account with healthy settled cash; none models Specimen B's regime ($0 available-without-margin, $0 settled, positive Non-margin buying power). The tests validated a coincidence, not the semantics; margin activation on the live account exposed the latent error.

## Consequence

Wheelwright over-states unlevered deployable capacity on a margin-enabled account and would size CSP deployment against capacity the broker permits only with margin impact. This is an operator-facing, outcome-bearing capacity figure feeding recommendation sizing. Severity is left **Not established** pending a Principal severity decision; the potential consequence is a materially wrong "Deployable" figure driving deployment decisions, but the record does not assert a severity level to avoid inventing one (per `docs/bugs/README.md`).

## Diagnosis / root cause

A **layering violation at ingestion.** `balancesParser.ts` performs two responsibilities: (1) extract broker facts — correct — and (2) *decide* what "deployable" means by folding margin-derived buying power into the legacy `availableToTradeAllSettled` field — a domain/policy decision that does not belong in the parser. The fold treats `Non-margin buying power` and `Available without margin impact` as interchangeable and both as interchangeable with legacy "all settled"; Specimen B falsifies that interchangeability.

Supporting inference on reserve netting: **[inference]** Specimen B shows `Available without margin impact = 0` while `Cash reserved for options = 900`. This is consistent with the reserve already being netted into `Available without margin impact`, and is corroborated by the existing `PortfolioSnapshot.deployableCash` doc comment ("Fidelity has already done so"). This is a **supported inference, not a proven Fidelity formula** — no specimen directly demonstrates the subtraction. Remediation must confirm this rather than assume it, and must not double-net `Cash reserved for options`.

## Scope / non-goals

**Filing this record does not authorize remediation** (per `docs/bugs/README.md`). This record captures the demonstrated defect, its evidence, and converged acceptance criteria only.

Non-goals for this record:
- No production-code changes, no parser changes, no behavioral-test changes, no new domain module, no cleanup made under this filing.
- Not eliminating the Balances CSV ingestion path (broker-authoritative balance facts remain required; reconstructing them from positions/transactions would convert broker fact into Wheelwright inference).
- Not margin-capacity UI work (surfacing `Margin buying power` as a first-class product concept is a separate, deferred concern).
- Does not touch or reference Gate Experiment 001.

**Remediation surface noted but not modified:** the `PortfolioSnapshot.deployableCash` doc comment in `options-prototype/src/write-desk/types.ts` currently documents the legacy-only semantic ("this is 'Available to trade (all settled)' ... Fidelity has already [netted reservations]"). That comment re-teaches the assumption behind this defect and must be corrected as part of remediation; it is deliberately left unmodified during filing.

## Acceptance criteria

An eventual fix (under separate Principal authorization) should satisfy:

1. **Parser preserves broker truth; no fold.** `balancesParser.ts` retains `Settled cash`, `Available without margin impact`, `Non-margin buying power`, `Margin buying power`, `Cash reserved for options` (and legacy `Available to trade (all settled)`) as **distinct** facts. The `availableToTradeAllSettled = nonMarginBuyingPower ?? availableWithoutMarginImpact` fold is removed. The parser makes no deployable-cash decision.
2. **Regime-aware derivation in a domain layer**, keyed on **field presence** (not equity percentage):
   - **Legacy / CASH regime** (margin fields absent): Deployable = `Available to trade (all settled)`. Specimen A → **$510.28**.
   - **MARGIN regime** (margin fields present): Deployable = `Available without margin impact`. Specimen B → **$0**. `Non-margin buying power`, `Margin buying power`, `Settled cash`, `Cash reserved for options` retained as separate facts, never folded into Deployable.
   - **INDETERMINATE** (regime cannot be classified / expected fields absent): Deployable = `null` → readiness blocks. **Fail-closed; do not guess.**
3. **`PortfolioSnapshot.deployableCash` contract shape unchanged** (`number | null`), so downstream consumers (`recommendPuts`, `recommendBuyWrites`, `brief-builder`, readiness, scan-audit, production) require no shape change. The stale doc comment (above) is corrected to the regime-aware semantic.
4. **Both live specimens verified.** Sawdust → $510.28; PTS → $0.
5. **Reserve netting confirmed, not assumed.** Remediation confirms whether `Available without margin impact` already nets `Cash reserved for options`; Deployable must not double-net it.
6. **Open semantic to be resolved at remediation, not assumed proven — [reasoned candidate]:** in the MARGIN regime, when `Available without margin impact` and `Settled cash` both exist and **disagree**, which is unlevered Deployable? Principal's current ruling: `Available without margin impact` is the candidate for portfolio-wide unlevered Deployable, with `Settled cash` retained as a distinct broker fact. This ruling is **reasoned but not specimen-validated** — both fields are $0 in Specimen B, so the available specimens do not empirically discriminate between them. Remediation must not present this as evidence-proven.
7. **Fixtures corrected to the right semantics.** The `FIDELITY_BALANCES_DIVERGENT` assertion (deployable = Non-margin buying power) is replaced with the regime-correct expectation, and a fixture modeling Specimen B's regime ($0 available-without-margin, positive Non-margin buying power) is added.

## Remediation history

_(empty — Open)_

## Verification

_(empty — Open)_

## Related

- Commit `62acc8f` (2026-09-09) — origin of the fold (provenance/why-state, not authority).
- `docs/contracts/evidence-snapshot-v1.md` — the frozen backend evidence contract is **not** involved; broker balances are a separate frontend CSV ingestion path. Recorded here to bound scope.
- `PortfolioSnapshot` contract (`options-prototype/src/write-desk/types.ts`) — deployable-cash consumer contract; stale doc comment noted as remediation surface.
