# BUG-021 — Buy-to-close option is classified as a generic asset purchase (CAPITAL_DEPLOYMENT), never netted against recognized premium

- **Status:** Open
- **Severity:** Not established
- **Area:** Production / accounting (backend `TransactionClassifier` → `EconomicDecomposer`)
- **Provenance:** Discovered 2026-09-16 during the Existing Short-Obligation HOLD vs CLOSE V1 reconciliation (Kiro repository-grounded verification; Codex originally surfaced the concern). No GitHub Issue. This is the authoritative record.

## Observed failure

A Fidelity Activity transaction that represents **buying to close a short option** (action string begins `"YOU BOUGHT CLOSING TRANSACTION ..."`) is not recognized by the backend transaction classifier. It falls through the classification chain to the generic catch-all and is classified as **`ASSET_PURCHASE`**, then economically decomposed as **`CAPITAL_DEPLOYMENT`** — a fresh asset purchase against the OCC option symbol — rather than being recognized as the closing of an option obligation and netted against the previously-recognized opening premium.

## Intended semantics violated

- **ADR-014 (Production recognition):** option premium is recognized once, at sell-to-open receipt. The closing debit of that same obligation is part of the *same* economic lifecycle and must not be accounted as unrelated capital deployment. Booking a BTC debit as `CAPITAL_DEPLOYMENT` against the OCC symbol misrepresents the economic event.
- **ADR-016 (evidence-to-domain association):** a closing transaction is an authoritative economic event bound to a specific short-obligation lifecycle; classifying it as a generic asset buy severs that association.
- The classifier already encodes option *opening* semantics (`OPTION_SELL_TO_OPEN_PUT` / `_CALL`); the *closing* counterpart is missing, so the two halves of one obligation lifecycle are accounted incoherently.

## Evidence

Verified against accepted `main` at SYNC `7b4a0843295bfed52584e4b5d97efd4eb7eacdd1`:

- `evidence-service-java/src/main/java/com/wheelwright/evidence/production/TransactionClassifier.java` — recognizes `"YOU SOLD OPENING TRANSACTION PUT"` / `"...CALL"` (option opening) but has **no** `"YOU BOUGHT CLOSING TRANSACTION"` branch. A BTC row is not matched by the treasury branch (requires `isTreasury`) nor `"YOU BOUGHT ASSIGNED PUTS"`, so it reaches the generic `if (action.startsWith("YOU BOUGHT")) return FidelityTransactionKind.ASSET_PURCHASE;`.
- `evidence-service-java/src/main/java/com/wheelwright/evidence/production/FidelityTransactionKind.java` — has `OPTION_SELL_TO_OPEN_PUT` / `_CALL` but **no** `OPTION_BUY_TO_CLOSE_*` member.
- `evidence-service-java/src/main/java/com/wheelwright/evidence/production/EconomicDecomposer.java` — `case ASSET_PURCHASE, TREASURY_PURCHASE -> ... ComponentType.CAPITAL_DEPLOYMENT ...`; no branch nets a closing debit against the earlier opening premium.
- The correct action string is already recognized in the **frontend** importers (`options-prototype/src/csv/fidelity/activityParser.ts` maps `"YOU BOUGHT CLOSING TRANSACTION"` → `buy_to_close`; likewise `src/scenarios/parseActivityCsv.ts`, `src/imports/fidelity/parseActivity.ts`, `src/domain/portfolio.ts`), demonstrating the backend classifier is missing a pattern the rest of the repository already knows.
- **No Java test** feeds a `"YOU BOUGHT CLOSING TRANSACTION"` row or asserts its classification/decomposition.

## Consequence

A month containing a buy-to-close would misattribute the closing debit as capital deployment against an option symbol instead of reducing the net production of the closed obligation. This can distort Net Strategy Result and Production accounting. Consequence magnitude in real operation was **not** established in this investigation (no live specimen quantified), so severity is recorded as `Not established` rather than invented.

## Diagnosis / root cause

The transaction classifier lacks a buy-to-close recognition branch and the enum lacks a corresponding kind; consequently the economic decomposer has no path to net the closing debit against recognized premium. The two halves of one option-obligation lifecycle (open credit, close debit) are classified by unrelated rules.

## Scope / non-goals

Records the defect only. **Filing does not authorize remediation.** This record does not prescribe the fix (new enum kind, classifier branch, netting semantics, or lifecycle-association design are all remediation-time decisions). It does not resolve the broader lifecycle-reconstruction maturity tracked by `PL-EXEC-01` / `PL-PORT-02`; it isolates the specific current mis-classification.

## Acceptance criteria (for an eventual, separately-authorized fix)

- A `"YOU BOUGHT CLOSING TRANSACTION"` row is classified as an option-close event, distinct from `ASSET_PURCHASE`.
- The closing debit is economically associated with the corresponding opening premium (or explicitly `UNRESOLVED` when association cannot be established), never booked as generic `CAPITAL_DEPLOYMENT` against the OCC symbol.
- Premium is still recognized exactly once (ADR-014 invariant preserved); the close does not double-count or re-recognize premium.
- Backend tests feed a BTC row and assert both classification and economic decomposition.

## Remediation history

None.

## Verification

None.

## Related

- `PL-EXEC-01` (Trade Lifecycle Evolution — anticipates later buy-to-close/roll/unwind economics and post-execution reconciliation; capability context, not a bug record).
- `PL-PORT-02` (Production Accounting remaining — lifecycle reconstruction; capability context).
- ADR-014 (Production recognition), ADR-016 (evidence-to-domain association) — governing semantics.
- `docs/design/existing-short-obligation-hold-vs-close-v1-design.md` §8/§19/§21 — the HOLD-vs-CLOSE V1 design treats this as a bounding constraint (it must not assume Production has netted a BTC), not something it repairs.
- **Finding B / BUG-001** — the live-overlay counterpart (a BTC/expired obligation is not removed from projected positions). Distinct concern (frontend projection vs backend accounting); cross-linked, not double-booked.
