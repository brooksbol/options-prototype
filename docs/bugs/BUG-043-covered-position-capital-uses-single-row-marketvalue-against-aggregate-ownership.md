# BUG-043 — Covered-position Capital under-stated: per-share value derived from a single Option Summary row's market value against authoritative aggregate ownership

- **Status:** Resolved
- **Severity:** Not established
- **Area:** Portfolio state / monitored-position capital derivation (`options-prototype/src/write-desk/fidelity-snapshot.ts` `deriveInventory`; consumed by `options-prototype/src/portfolio/position-monitoring.ts` and `options-prototype/src/portfolio/shell-capital-context.ts`)
- **Provenance:** Principal observation 2026-10-22 on the running Operator Console. Specimen-confirmed against the operator's actual Fidelity Option Summary and Positions exports (Account Z39411514, quote as of 10/22/2026, downloaded ~10:41 AM ET). Remediated and Principal-validated in the browser 2026-10-22. Same ADR-020 ownership-authority family as BUG-026.

## Observed failure

On the Operator Console DTE ladder, the **Capital** column for every DRAM covered position was materially under-stated (~2.5× low). The $46 Buy-Write (2 contracts) showed **$3,669.20** instead of the correct **~$9,173**. The operator reported the discrepancy directly: a Buy-Write placed at ~$46 for two contracts for roughly $9,000 showed far less than $9,000 of encumbered capital.

Confirmed per-strike against the operator's 10:41 AM exports:

| DRAM position | Contracts | Capital shown (pre-fix) | Correct capital |
|---------------|----------:|------------------------:|----------------:|
| $46 Buy-Write | 2 | $3,669.20 | $9,173.00 |
| $50 CALL | 2 | $3,669.20 | $9,173.00 |
| $49.50 CALL | 1 | $1,834.60 | $4,586.50 |

Symbols with a single share row (IBIT, SLV, USO) were unaffected.

## Intended semantics violated

Encumbered capital for a covered call / buy-write is `perShareValue × 100 × contracts`, where `perShareValue` must represent the covering equity's true per-share value. The Capital column must present the real capital the position encumbers so the operator can reason about deployment against the complete economic position. Deriving a per-share value by dividing a **single lot's** market value by the **full aggregate** share count produces a per-share figure that is neither the mark nor any real basis, and under-states capital whenever authoritative ownership exceeds that one row's quantity.

## Evidence

Epistemic tags: **[established diagnosis]** = confirmed by reading code on the working tree and tracing data flow; **[observed]** = seen in the operator's real export / browser.

### Specimen — Fidelity Option Summary (Account Z39411514, quote as of 10/22/2026) **[observed]**

The Option Summary presents DRAM across **three** additive Covered Call share rows plus three short calls (prices abbreviated):

| Symbol | Strategy | Expiration & Strike | Quantity | Market value | Avg. cost |
|--------|----------|--------------------|---------:|-------------:|----------:|
| DRAM | Covered Call | Shares | 200 | $9,173.00 | $54.61 |
| DRAM | Covered Call | DRAM OCT 23 2026 $50 CALL | -2 | -$116.67 | — |
| DRAM | Covered Call | Shares | 200 | $9,173.00 | $54.61 |
| DRAM | Covered Call | DRAM OCT 23 2026 $46 CALL | -2 | -$170.68 | — |
| DRAM | Covered Call | Shares | 100 | $5,461.40 | $54.61 |
| DRAM | Covered Call | DRAM OCT 23 2026 $49.50 CALL | -1 | -$123.34 | — |

Each share row reports the same mark ($45.865/share → $9,173.00 per 200, $5,461.40 per 100) and the same blended average cost ($54.61). Total shares = 500.

### Independent grounding — Fidelity Positions export (same account) **[observed]**

The Positions export reports DRAM aggregate ownership of **500 shares** (market value $27,307.00, i.e. $54.614/share mark at that export's quote). Under ADR-020 this is the authoritative aggregate ownership and is what populates `sharesOwned`.

### Code trace, working tree before the fix **[established diagnosis]**

1. `deriveInventory` (`fidelity-snapshot.ts`) sets `sharesOwned` from the authoritative Positions aggregate (**500**) when available (ADR-020 / BUG-026), but carries `economics.marketValue` from the **single selected Option Summary share row** (the largest observed, **200 shares → $9,173.00**). The two numbers come from different quantities and are never reconciled.

2. `deriveMonitoredPositions` (`position-monitoring.ts`) computes covered-position capital as:
   ```ts
   const perShare = inv.economics.marketValue / inv.sharesOwned;   // 9173 / 500 = 18.35
   encumberedCapital = perShare * 100 * call.quantity;             // 18.35 * 100 * 2 = 3669.20
   ```
   The true per-share value is ~$45.87, so capital is understated by the ratio `observedRowShares / ownedShares = 200/500`.

3. `deriveShellCapitalContext` (`shell-capital-context.ts`) uses the identical `marketValue / sharesOwned` construction, so the persistent header **Encumbered** total was under-stated by the same mechanism (~$13,760 low on this specimen).

### Causal attribution **[established diagnosis]**

This is a direct interaction with BUG-026 / ADR-020. Before authoritative Positions ownership existed, `sharesOwned` and the selected row's `marketValue` described the same quantity, so `marketValue / sharesOwned` yielded the correct mark. Once ADR-020 made `sharesOwned` the **aggregate** (500) while `economics` remained scoped to one row (200), the per-share derivation silently became wrong for any symbol whose aggregate ownership exceeds the selected row's quantity. The defect is latent for single-row symbols and only surfaces on multi-lot covered symbols.

## Consequence

The Capital column — a primary input to the operator's deployment and risk reasoning — under-states encumbered capital on multi-lot covered positions, and the header Encumbered triad fact is correspondingly low. On this specimen the DRAM positions each showed ~40% of true capital. Because the error scales with the ownership/row ratio, it is silent and systematic rather than obviously broken. Severity **Not established** pending Principal decision; the underlying marks and share counts are individually correct, but the composed per-share figure and all capital derived from it are wrong.

## Diagnosis / root cause

`InventoryPosition.economics` totals (`marketValue`, `costBasis`) are **row-scoped** (the selected Option Summary share row), while `sharesOwned` is **aggregate-scoped** (authoritative Positions). Any consumer that converts a row-scoped total into a per-share value by dividing by aggregate `sharesOwned` produces an incorrect per-share figure. The fix must make the economics totals describe the same quantity as `sharesOwned`.

## Scope / non-goals

This record documents a remediation that was performed and Principal-validated on 2026-10-22. Per the bug protocol, filing a record does not itself authorize remediation; the authorization context for this change is the Principal's direct report of the defect and in-session browser validation of the fix.

Non-goals:
- Does not change the valuation convention that covered-position Capital uses the broker-reported share mark from the export (not live spot, not cost basis). That was the pre-existing design and is unchanged.
- Does not alter ownership derivation (`sharesOwned`), encumbrance, or the geometry-warning path (BUG-026 / ADR-020 territory, unchanged).
- Does not touch put capital (strike-based; never used `economics`).

## Acceptance criteria

- A multi-lot covered symbol whose authoritative aggregate ownership exceeds the selected Option Summary row's quantity must derive per-share value at the true mark, so covered-call / buy-write Capital equals `mark × 100 × contracts` (DRAM $46 BW, 2 contracts → ~$9,173; $50 CALL ×2 → ~$9,173; $49.50 CALL ×1 → ~$4,586.50).
- A repeated-per-strategy single-lot symbol (ownership equals the row quantity) must be unchanged — economics totals must **not** be inflated.
- The header Encumbered total must reflect the corrected covered-equity figures.
- Tests must exercise the live derivation path (`deriveInventory` → `deriveMonitoredPositions`), with the real DRAM 10/22 specimen as a positive fixture and a repeated-strategy single-lot case as a negative (no-inflation) fixture.

## Remediation history

**2026-10-22 — Resolved.** In `deriveInventory` (`options-prototype/src/write-desk/fidelity-snapshot.ts`), after `sharesOwned` is resolved, the selected share row's `marketValue` and `costBasis` are scaled from the row's observed quantity (`observedOs`) to the authoritative `owned` count before building `economics`:

```ts
if (data.observedOs > 0 && data.owned !== data.observedOs) {
  const scale = data.owned / data.observedOs;
  if (data.marketValue != null) data.marketValue *= scale;
  if (data.costBasis != null) data.costBasis *= scale;
}
```

This is exact because Fidelity reports the same per-share mark and the same symbol-level blended average cost on every share row of a symbol, so `(rowTotal / rowShares) × ownedShares` reconstructs the aggregate total. When ownership came from the row itself (no Positions, or quantities already equal) the scale is 1 and nothing changes. `averageCostPerShare` is already per-share and is untouched. No consumer changed: `position-monitoring.ts` and `shell-capital-context.ts` now receive economics totals scoped to the same quantity as `sharesOwned`, so their existing `marketValue / sharesOwned` construction yields the correct mark (authority-before-consumer: repaired at the ownership/economics derivation, not patched in each consumer).

## Verification

Automated, against the live derivation path:
- `options-prototype/tests/write-desk/positions-ownership-authority.test.ts` — added two cases: (1) the real DRAM 10/22 specimen (three additive share rows 200/200/100 at the same mark, Positions 500) → `economics.marketValue`/`costBasis` scaled to 500 shares, `averageCostPerShare` unchanged, and `deriveMonitoredPositions` yields Capital $9,173 ($46 BW), $9,173 ($50 CALL), $4,586.50 ($49.50 CALL); (2) repeated-strategy single lot (Positions equals row quantity) → economics totals **not** inflated.
- Full frontend suite green (172 files, 2200 tests); frontend build green.

## Principal acceptance — 2026-10-22

Principal browser validation on the running Operator Console: after reload (Wheelwright rebuilds the snapshot from the persisted raw CSVs, no re-import required), the DRAM Capital column and the header Encumbered total reflect the corrected values. Principal reported the fix worked. Accepted.

## Related

- **BUG-026** (Resolved) — same file (`deriveInventory`), same ADR-020 ownership-authority family. BUG-026 made `sharesOwned` the authoritative aggregate; this bug is the latent per-share consequence of that change for the row-scoped `economics` totals left behind. Direct sibling.
- **ADR-020** — Aggregate Share-Ownership Authority; the decision whose aggregate-vs-row-scope mismatch this bug resolves on the economics/capital side.
- **BUG-009** (Open) — Capital label/amount divergence (Production surface). Thematically adjacent (Capital correctness) but a different surface and mechanism; not the same defect.
- Not a `PL-*` item (defect, not a capability).
