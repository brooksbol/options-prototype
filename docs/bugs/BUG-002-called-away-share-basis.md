# BUG-002 — Production accounting cannot derive called-away share basis from direct purchases or buy-writes

- **Status:** Open
- **Severity:** Not established
- **Area:** Production (accounting correctness)
- **Provenance:** GitHub Issue #3 (https://github.com/brooksbol/options-prototype/issues/3) — historical, non-authoritative. Created 2026-09-03. Labels: `defect`, `area:production`.

## Observed failure

Production accounting recognizes an assigned-call stock sale as a lifecycle-attributed disposition, but its basis lookup is too narrow: it only searches prior assigned-put stock purchases. Shares acquired directly (including buy-write share acquisition) are not considered.

This causes realized call-away economics to remain **unresolved** even when Fidelity Activity contains sufficient direct-purchase basis evidence.

## Intended semantics violated

Called-away share disposition basis resolution should consider authoritative acquisition evidence appropriate to the shares being disposed, including direct share purchases / buy-write acquisition where attribution is supportable — while preserving epistemic discipline (no manufactured lot attribution).

## Evidence

### Empirical case: SLV, Sep 3 2026 (operator-reported — see status note)

Observed Fidelity lifecycle:

- 100 SLV shares acquired directly at $62.50/share.
- The Sep 2 $59 covered call was assigned.
- Fidelity reported `YOU SOLD ASSIGNED CALLS ...` for 100 SLV shares at $59.00.
- Net disposition proceeds: $5,899.87.

Expected share-leg realized result:

- acquisition basis: $6,250.00
- net proceeds: $5,899.87
- capital erosion: ≈ $350.13

This capital consequence is separate from previously recognized option premium and must not double-count that premium.

### Confirmed implementation mechanics (verified from code, 2026-09-04 reconciliation)

- `TransactionClassifier` maps `YOU SOLD ASSIGNED CALLS ...` to `ASSIGNED_CALL_STOCK_SALE`.
- `EconomicDecomposer.decompose` routes that kind to `decomposeLifecycleDisposition`, which computes `gainOrLoss = proceeds - basis` and books `REALIZED_APPRECIATION` (gain) or `CAPITAL_EROSION` (loss).
- `findDispositionBasis`, for `ASSIGNED_CALL_STOCK_SALE`, resolves basis **only** from a prior `ASSIGNED_PUT_STOCK_PURCHASE` of the same symbol. It does **not** consult direct `ASSET_PURCHASE` / buy-write acquisition for the call-away path.
- When basis resolves to `null`, the disposition is booked as `PRINCIPAL_MOVEMENT` with `BASIS_UNKNOWN`; no `REALIZED_APPRECIATION`/`CAPITAL_EROSION` component is emitted.

### Silent-degradation clarification (added 2026-09-04)

The failure does **not** surface as an error or an explicit "basis unresolved" signal. With no realized-appreciation/erosion component available, the frontend episode ledger (`buildResolveChapter`, called-away branch) falls back to labeling the row with the opening premium only — a plausible-looking **premium-only** figure. The operator can see a credible number and not realize the share-leg economics were never resolved. This silent degradation is material to the defect's consequence.

## Consequence

Realized share appreciation/erosion for directly-purchased or buy-write-origin called-away shares is silently omitted; the operator may see a premium-only figure that appears complete. (Severity was intentionally not asserted in the historical record.)

## Diagnosis / root cause

`findDispositionBasis` scopes basis resolution for `ASSIGNED_CALL_STOCK_SALE` to prior assigned-put purchases only; direct/buy-write acquisition basis is never consulted.

## Scope / non-goals

Records the defect and its factual basis. Filing does not authorize remediation. Priority/sequencing is a separate Principal decision.

## Acceptance criteria

- A direct-purchase → covered-call assignment → assigned-call stock-sale lifecycle can resolve realized share economics when the acquisition basis is determinable from Activity evidence.
- The SLV-shaped case recognizes ≈ $350.13 of capital erosion from $6,250 basis and $5,899.87 net proceeds.
- Existing assigned-put-origin basis behavior remains correct.
- No option-premium double counting is introduced.
- Ambiguous/multiple-lot cases remain explicitly unresolved or carry appropriate attribution confidence rather than guessing (distinguish unique, batch/partial, and unresolved attribution; preserve multi-lot ambiguity rather than silently using symbol-level blended basis; keep realized share appreciation/erosion separate from booked option premium).
- Tests cover direct-purchase/buy-write origin, above-basis appreciation, below-basis erosion, and ambiguous multi-lot attribution.

### Test gap identified (historical)

Current called-away accounting tests use shares acquired through put assignment, matching the existing narrow resolver. There is no equivalent direct-purchase/buy-write-origin test.

## Epistemic status of the SLV figures (preserved verbatim intent)

The SLV Sep 3 2026 dollar figures (basis $6,250 from 100 shares at $62.50; net proceeds $5,899.87; ≈ $350.13 erosion) are **operator-reported and have not been independently verified from the actual Fidelity Activity evidence.** The Production endpoint is stateless and the underlying Activity CSV is not retained in the repository, so these numbers could not be reconstructed from repository state. The implementation mechanics above are confirmed; the specific SLV dollar amounts are a plausible, arithmetically consistent illustration pending confirmation from the source Activity export. No numbers were invented or adjusted.

## Remediation history

None.

## Verification

None.

## Related

- Visibility sibling: `BUG-007` (unknown basis leaving reconciliation appearing complete).
- Economic-authority companion: `BUG-006` (called-away "capital returned" uses reconstructed strike notional).
- Legibility sibling (correct composite still illegible): `BUG-003`.
- Capability context: `PL-PORT-02` (production-accounting correctness), `PL-PORT-01` (lot attribution), `PL-EXEC-01` (lifecycle provenance).
