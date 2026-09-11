# BUG-001 — Activity overlay does not project assigned-call closure and called-away share disposition

- **Status:** Open
- **Severity:** Not established
- **Area:** Portfolio state / trade-lifecycle overlay (frontend Activity projection)
- **Provenance:** GitHub Issue #2 (https://github.com/brooksbol/options-prototype/issues/2) — historical, non-authoritative. Created 2026-09-03.

> **Migration note (2026-09-11):** GitHub Issue #2 did not carry a `defect` label. The Principal ruled during the defect-tracking migration that it **is** a defect: its authoritative body explicitly identifies a "latent lifecycle-processing defect" and records demonstrated incorrect behavior, intended behavior, and acceptance criteria. The absent label was historical classification drift, not evidence that it ceased to be a defect. Migration membership is semantic, not label-driven.

## Observed failure

The Fidelity Activity overlay parses assigned-call lifecycle events but does not apply them to post-checkpoint portfolio state. This is a **latent lifecycle-processing defect**.

It did **not** cause the Sep 3, 2026 SLV position to disappear: the Sep 3 Option Summary already reflected the closed state, so the current-state CSV was correct. The defect surfaces when an assignment occurs *after* an older authoritative checkpoint and must be projected forward from Activity.

## Intended semantics violated

The intended overlay contract is:

> authoritative Option Summary checkpoint + subsequent executed Activity = current state.

Assigned-call lifecycle events that occur after the checkpoint must be projected onto current portfolio state. They currently are not.

## Evidence

Fidelity Activity classification already distinguishes:

- `assigned` — the option assignment notification;
- `shares_sold_assignment` — `YOU SOLD ASSIGNED CALLS ...`.

The current Activity projection mutation switch handles direct share purchases, sell-to-open, direct share sales, and cash/default paths, but `assigned` and `shares_sold_assignment` **fall through without mutating current portfolio state**.

## Consequence

For a covered call assigned after an older checkpoint, the projected current state is wrong: the short call is not closed and the called-away shares are not removed. (Severity was not established in the historical record.)

## Diagnosis / root cause

Projection mutation switch does not handle the `assigned` and `shares_sold_assignment` classifications; they are parsed but not applied.

## Scope / non-goals

Records the defect only. Filing does not authorize remediation.

Explicit non-bug clarifications (preserved from the original record):

- The Sep 3 SLV omission from `wheelwright-positions-2026-09-03.csv` is **correct** — that CSV is a current open-position projection; SLV had already been called away and should not remain.
- SLV appearing in the puts/buy-writes/cross-entry opportunity exports after closure is **coherent** — those files describe current opportunities, not historical positions.

## Acceptance criteria

- Add a post-checkpoint assigned-call scenario using a checkpoint older than the Activity event.
- `assigned` closes/removes the matching short call.
- `shares_sold_assignment` removes the called-away shares from inventory.
- The affected symbol is reflected as projected activity.
- Reconciliation does not double-count when a newer Option Summary already incorporates the same lifecycle (a later authoritative Option Summary must remain authoritative and must not cause the event to be applied twice).
- Cash / deployable-cash handling follows the existing authoritative Balances reconciliation policy without double-counting.
- Tests cover the full covered-call lifecycle transition rather than only parser classification.

### Test gaps identified (historical)

- Portfolio overlay after assigned call
- Removal of called-away shares
- Removal of corresponding short call
- Proceeds/cash semantics after call-away
- Explicit frontend assertion for `shares_sold_assignment`

## Remediation history

None.

## Verification

None.

## Related

- Portfolio-state / trade-lifecycle maturity: `PL-PORT-01`, `PL-EXEC-01` (capability context; not a bug record).
