# BUG-006 — Production called-away "capital returned" uses reconstructed strike notional instead of actual disposition proceeds

- **Status:** Open
- **Severity:** Not established
- **Area:** Production (economic-authority / semantic-truth; frontend episode ledger)
- **Provenance:** GitHub Issue #11 (https://github.com/brooksbol/options-prototype/issues/11) — historical, non-authoritative. Created 2026-09-05. Labels: `defect`, `area:production`.

## Observed failure

Production's frontend episode ledger presents a called-away **"capital returned"** figure computed as a reconstructed strike notional (`strike × 100 × contracts`) rather than the actual Fidelity disposition proceeds available in Activity evidence.

The defect is **not** that the arithmetic is difficult, nor that it runs in the frontend. The defect is:

> A valid mechanical/notional quantity is promoted into an operator-visible **realized economic claim** ("capital returned") that it does not represent.

This is an economic-authority / semantic-truth defect: a notional is labeled as though it were realized cash returned.

## Intended semantics violated

An operator-visible "capital returned" claim must represent realized returned capital (authoritative disposition proceeds), not a reconstructed strike notional. Distinct economic quantities must not be collapsed under the "capital" label.

## Evidence

### Current source mechanism (confirmed)

`options-prototype/src/production/episode-derivation.ts`, called-away branch in `buildResolveChapter` (and `buildResolutionChapter`):

```
const capitalAmount = episode.strike * 100 * episode.contracts;
...
capitalLabel = `$${fmt(capitalAmount)} returned`;
```

The **put-assigned** branch already prefers authoritative evidence (`episode.shareCost` from the `shares_bought_assignment` row) and only falls back to notional when absent. The **called-away** branch does not apply that discipline to the capital figure — it uses the raw strike notional and consults backend economics only for the *production/episode result* label, not the *capital returned* figure.

### Operational evidence (Sep-04 / Sep-05)

BNO (400 shares held via direct purchases), EWY, and GDXJ calls were assigned on Sep-04, processed Sep-08. Actual Fidelity `YOU SOLD ASSIGNED CALLS` net proceeds exist in Activity evidence (e.g., BNO: 200 sh @ $54 = $10,799.77 net; 100 sh @ $51 = $5,099.89 net). The operator-visible "capital returned" figure did not represent these actual proceeds.

**Provenance gap (unresolved — do not invent a cause):** the exact historical screenshot multiplicities ($10,200 / $16,200 for BNO) are NOT reproducible from current source + supplied evidence. Current source emits `strike × 100 × contracts` (i.e., $5,100 / $10,800 for BNO's two assigned episodes). Whether the screenshot predates current source or reflects a different load is unresolved. Acceptance should be demonstrated against the supplied Sep-04/Sep-05 transaction shapes, not the screenshot values.

### Distinct economic quantities not to be collapsed under "capital"

- strike notional (`strike × 100 × contracts`) — legitimate only if labeled as strike notional;
- gross disposition proceeds;
- net disposition proceeds (after fees);
- returned attributable principal (basis of disposed shares);
- realized appreciation/erosion;
- buying-power / deployable-cash change.

The current label conflates a notional with realized returned capital.

## Consequence

The operator sees a "capital returned" figure that is actually a strike notional, not realized cash returned. (Severity was not established in the historical record.)

## Diagnosis / root cause

Called-away branch sources the capital figure from `strike × 100 × contracts` instead of authoritative disposition proceeds, unlike the put-assigned branch which prefers authoritative evidence.

## Scope / non-goals

Filing does not authorize remediation; priority/sequencing is a separate Principal decision. No UI redesign is authorized or implied. Distinct from `BUG-003` (legibility of the composite *Produced* number) and from `BUG-002` (backend basis resolution) — this concerns the *kind* of quantity shown for called-away capital.

## Acceptance criteria

- Against the supplied Sep-04/Sep-05 export shapes, BNO/EWY/GDXJ called-away rows show actual disposition proceeds (or an explicit "unavailable"/labeled-notional), never an unlabeled `strike × 100 × contracts` presented as "capital returned."
- Put-assigned capital presentation remains correct.

### Smallest correction boundary (historical guidance)

In the called-away branch, source the operator-visible capital figure from authoritative disposition proceeds (Activity `YOU SOLD ASSIGNED CALLS` amount / backend assessment), mirroring the put-assigned discipline; when authoritative proceeds are unavailable, present the quantity as unavailable (or as an explicitly-labeled notional) rather than as "capital returned." No generalized frontend→backend migration; no new subsystem.

## Remediation history

None.

## Verification

None.

## Related

- Backend accounting-correctness sibling: `BUG-002` (called-away basis resolution).
- Reconciliation-visibility sibling: `BUG-007` (unknown basis leaving reconciliation appearing complete).
- Architecturally analogous (independent): `BUG-004` (temporally incompatible evidence composed into an apparently-coherent view).
- Economic-authority why-state: `docs/journal/project-journal-2.md` (2026-09-05 live-operations synthesis).
