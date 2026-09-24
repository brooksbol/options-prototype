# BUG-026 — `deriveInventory` collapses genuinely-additive same-symbol share lots via MAX, under-counting ownership and producing a false over-encumbrance geometry warning

- **Status:** Open
- **Severity:** Not established
- **Area:** Portfolio state / base-snapshot inventory derivation (`options-prototype/src/write-desk/fidelity-snapshot.ts`, `deriveInventory`)
- **Provenance:** Discovered 2026-09-24 during read-only investigation of the observed URA "Unencumbered Shares" reconciliation warning. Specimen-confirmed against the operator's actual Fidelity Option Summary and Activity History exports (Account Z39411514, quote as of 09/24/2026).

## Observed failure

On the Operator Console "Unencumbered Shares" region, URA showed the geometry warning:

> Open short calls require 200 shares of URA, but only 100 shares were observed as owned. Observed ownership and open-call geometry do not reconcile.

The operator in fact held **200 URA shares fully covered by two short calls** — a coherent, correctly-covered position. The warning was false: it reported a reconciliation failure where none exists.

## Intended semantics violated

Inventory ownership derived from the Option Summary must reflect the operator's true share position for each symbol. When an operator holds multiple genuinely-additive lots of the same symbol (e.g. two 100-share lots acquired on different dates, each paired with its own covered call), the derived `sharesOwned` must total the real position (200), not a single lot (100). Under-counting ownership while faithfully counting the short calls fabricates an over-encumbrance geometry that does not exist.

## Evidence

Epistemic tags: **[established diagnosis]** = confirmed by reading committed code on `main`; **[observed]** = seen in the operator's real export.

### Specimen — Fidelity Option Summary (Account Z39411514, quote as of 09/24/2026, downloaded 2:56 PM ET) **[observed]**

The Option Summary contains **four** URA rows:

| Symbol | Strategy | Expiration & Strike | Quantity | Cost basis | Avg. cost | Market value |
|--------|----------|--------------------|---------:|-----------:|----------:|-------------:|
| URA | Covered Call | Shares | 100 | $4336.50 | $43.37 | $4097.00 |
| URA | Covered Call | URA SEP 25 2026 $41 CALL | -1 | -$39.34 | -$0.39 | -$50.00 |
| URA | Covered Call | Shares | 100 | $4336.50 | $43.37 | $4097.00 |
| URA | Covered Call | URA SEP 25 2026 $43 CALL | -1 | -$109.34 | -$1.09 | -$5.00 |

The two "Shares" rows are **byte-identical** across every field. The displayed cost basis $4,336.50 / avg $43.37 is the **position-level blended basis** of the two underlying lots: `($4,579 + $4,094) / 200 = $43.365/share → $4,336.50` per 100. Fidelity presents each lot under its own covered-call strategy pairing, producing two identical-looking share rows that are nonetheless **additive** (200 shares total).

### Independent grounding — Fidelity Activity History (same account) **[observed]**

The Activity ledger establishes the true URA position independent of the Option Summary display:

- 09/04/2026 — `YOU BOUGHT` 100 URA @ $45.79 (lot 1)
- 09/17/2026 — `YOU SOLD OPENING TRANSACTION CALL URA SEP 25 26 $43` (covers lot 1)
- 09/24/2026 — `YOU BOUGHT` 100 URA @ $40.94 (lot 2)
- 09/24/2026 — `YOU SOLD OPENING TRANSACTION CALL URA SEP 25 26 $41` (covers lot 2)

No URA shares were called away anywhere in the ledger. True held position: **200 shares, two short calls, fully covered.** Correct derived state is `sharesOwned=200, required=200`, **no warning**.

### Code trace, current `main` **[established diagnosis]**

1. `deriveInventory` (`options-prototype/src/write-desk/fidelity-snapshot.ts`) groups share rows per symbol using **maximum quantity seen, not sum**:
   ```ts
   // Fidelity repeats share rows per strategy — use the maximum seen quantity
   // (not sum, since they represent the same shares viewed from different strategies)
   if (existing && row.quantity > existing.owned) { existing.owned = row.quantity; ... }
   ```
   For the two URA rows: `owned = max(100, 100) = 100`. The second lot is dropped.

2. `deriveExistingShortCalls` (same file) emits **one entry per short-call row** with no collapsing: URA $41 and URA $43 → two `OpenShortCall`s → `rawCallRequired = 2 × 100 = 200`.

3. `deriveUnencumberedInventory` Case 2 (`options-prototype/src/portfolio/unencumbered-inventory.ts`) then compares `rawCallRequiredShares (200) > observedSharesOwned (100)` and emits the exact observed warning.

This occurs in the **base snapshot from the Option Summary alone**, before any Activity projection. `evaluateReadiness` does not check call-vs-share geometry, so nothing downgrades readiness.

### Causal attribution for this incident **[established diagnosis]**

This MAX-not-SUM collapse is the **observed, sufficient cause** of the live URA warning. The same-day Activity-projection checkpoint (see Related → BUG-023) is **not** a contributing cause here: the Sep 24 lot is already present in the Option Summary, so excluding the same-day Activity purchase from the projection is correct for this specimen; adding it would double-count.

## Consequence

A correctly-covered multi-lot position is presented as an unreconciled ownership/obligation discrepancy. Consequence surfaces in the operator's trust signal (a false "does not reconcile" warning on a healthy position) and suppresses free-share/`maxAdditionalContracts` accounting for the affected symbol (the encumbrance clamp `min(encumbered, owned)` hides the negative deficit; `sharesFree = max(0, 100 − 200) = 0`). Severity **Not established** pending Principal decision; the numeric values are individually correct, but the composed geometry is misleading. No same-symbol multi-lot position with per-lot covered calls can reconcile under the current derivation.

## Diagnosis / root cause

`deriveInventory` cannot distinguish two economically distinct cases that can look identical at the row level:

- **(a)** the same 100 shares repeated across multiple strategy views (must collapse to 100), and
- **(b)** multiple genuinely-additive 100-share lots, each paired with its own covered call (must total 200).

It resolves both with MAX, which is correct for (a) and wrong for (b). Critically, in this specimen the two additive lots are **byte-identical** (blended basis shown on both rows), so neither MAX nor naive value-based de-duplication can separate them. The Option Summary share rows **alone** are insufficient to disambiguate; the distinguishing evidence lives in the **short-call count** (two distinct strikes ⇒ two covered lots) and in **Activity** (two distinct `YOU BOUGHT` events).

## Scope / non-goals

**Filing only. This record does not authorize remediation.**

Non-goals:
- Do not switch MAX → SUM. A blind SUM correctly fixes this specimen but **doubles** case (a) — the truly-repeated-per-strategy case the MAX rule was introduced to handle.
- Do not de-duplicate by row-value equality. The specimen's two additive rows are byte-identical, so value-dedup would also wrongly collapse them.
- Do not "fix" the warning by suppressing it in `deriveUnencumberedInventory`. That consumer is correctly reporting the contradiction it is handed; the defect is upstream in ownership derivation (authority-before-consumer).
- Do not alter the Activity-projection checkpoint semantics under this record (that seam is owned by BUG-023).

## Acceptance criteria

Direction (not an implementation prescription):

- Two genuinely-additive same-symbol lots, each paired with its own covered call, must derive `sharesOwned` = total shares (URA → 200) and reconcile against the total short-call requirement (200) with **no** geometry warning.
- The same 100 shares repeated across multiple strategy views (single lot) must still derive to 100, **not** 200 (no regression to over-counting).
- Disambiguation must use durable structural evidence (short-call coverage count and/or Activity `shares_bought_direct` events), not row-value equality and not a blind SUM.
- Acceptance tests must exercise the **live** derivation path (`deriveInventory` / `deriveUnencumberedInventory`), not only the scenario-replay path (`src/scenarios/projectState.ts`), which does not cover this code.
- The URA specimen (two identical 100-share rows + $41/$43 calls) is a required positive fixture; a single-symbol repeated-per-strategy export is a required negative fixture.

## Remediation history

_(empty — Open)_

## Verification

_(empty — Open)_

## Related

- **BUG-023** (Open) — Activity overlay ↔ broker-balance checkpoint reconciliation (cash side). Same reconciliation-authority family (what evidence already incorporates a fact), different surface and different mechanism. The ownership-side same-day checkpoint behavior discussed during this investigation is recorded as a note on BUG-023, not as a separate bug, because it was **latent** (non-causal) in this incident.
- **BUG-001** (Open) — Activity overlay lifecycle projection (assigned-call closure / called-away disposition) on the same snapshot. Adjacent; not the same defect.
- **BUG-004** (Open) — Console composing temporally incompatible evidence into an apparently-coherent view. Thematically related (composed inconsistency), materially different (market-evidence coherence vs share-lot derivation).
- Not a `PL-*` item (defect, not a capability).
