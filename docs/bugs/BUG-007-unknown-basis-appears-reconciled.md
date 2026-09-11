# BUG-007 — Unknown stock-disposition basis can leave Production reconciliation appearing complete

- **Status:** Open
- **Severity:** Not established
- **Area:** Production (reconciliation visibility)
- **Provenance:** GitHub Issue #12 (https://github.com/brooksbol/options-prototype/issues/12) — historical, non-authoritative. Created 2026-09-05. Labels: `defect`, `area:production`.

## Observed failure

When realized economics for a called-away stock disposition remain unresolved (`BASIS_UNKNOWN`), Production can still present the lifecycle as though it were fully reconciled. Unknown realized economics can silently coexist with a presentation that implies completeness.

## Intended semantics violated

> Unknown realized economics must not silently coexist with a presentation that implies the lifecycle is fully reconciled.

## Evidence

The Production pipeline decomposes a disposition into components with a `Confidence` (including `BASIS_UNKNOWN`) and produces a `ReconciliationStatus`. A disposition whose basis cannot be resolved is booked as principal movement with realized appreciation/erosion unresolved. The concern raised in the four-actor review is that this unresolved realized-economics state is not reliably reflected as operator-visible reconciliation uncertainty — the aggregate cash total can still reconcile, producing an appearance of completeness.

## Consequence

An operator can be shown an apparently-complete monthly/lifecycle economic picture while realized appreciation/erosion for one or more called-away dispositions is in fact undetermined. Aggregate correctness (deployable cash reconciles) conceals the event-level uncertainty. This is the same class of hazard observed across the Sep-04 cycle: aggregate reconciliation masking event-level economic-truth gaps. (Severity was not established in the historical record.)

## Diagnosis / root cause

Event-level `BASIS_UNKNOWN` state is not propagated into operator-visible reconciliation status; aggregate cash reconciliation can still appear complete.

## Relationship to BUG-002

`BUG-002` (GitHub #3) concerns **computing** called-away basis correctly for directly-purchased shares (the number is wrong/absent). **This defect is the visibility sibling:** even when basis genuinely cannot be resolved from available evidence — a legitimate, correct `BASIS_UNKNOWN` outcome — the operator-visible reconciliation status should reflect that unresolved economic state rather than appearing complete. Fixing `BUG-002` reduces how often this occurs but does not, by itself, guarantee that a *remaining* `BASIS_UNKNOWN` is surfaced as reconciliation uncertainty. Keep the two records distinct.

## Scope / non-goals

Filing does not authorize remediation; priority/sequencing is a separate Principal decision. No UI solution is prescribed. Distinct from `BUG-003` (legibility of a *correct composite* Produced number) — this concerns making *unresolved* economics visible as uncertainty.

## Acceptance criteria (requirement)

- Unresolved realized economics (`BASIS_UNKNOWN` on a lifecycle-attributed disposition) must influence the operator-visible reconciliation status / uncertainty presentation.
- Keep this distinct from cash-total reconciliation: the cash total reconciling does not imply the realized-economics attribution is complete.
- No fabrication of attribution to make the status appear resolved; the correct outcome is *visible uncertainty*, not a manufactured number.

## Remediation history

None.

## Verification

None.

## Related

- Exposing defect (backend basis resolution): `BUG-002`.
- Companion economic-authority defect: `BUG-006` (called-away "capital returned" uses reconstructed strike notional instead of actual disposition proceeds).
- Architecturally analogous (independent): `BUG-004` (incoherent composed evidence presented as coherent).
- Why-state: `docs/journal/project-journal-2.md` (2026-09-05 live-operations synthesis).
