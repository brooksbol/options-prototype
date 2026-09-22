# BUG-017 — Deployment CSV export is constrained by presentation row limit

- **Status:** Open
- **Severity:** Not established
- **Area:** Write Desk / Deployment CSV export
- **Provenance:** Acceptance testing 2026-09-14

## Observed failure

During Deployment acceptance testing, the table reported **"Showing 90 rows"** and the exported puts CSV contained **90 data rows**.

This observation raises a credible export-completeness defect: the CSV export may be inheriting the table's presentation/display-row limit.

The failure is **not yet confirmed**, because the acceptance session did not establish that more than 90 otherwise-exportable rows existed under the same substantive filters at the moment of export.

## Intended semantics violated

A presentation-only row limit and CSV export scope are separate concerns.

The Deployment table may limit rendered rows for usability. CSV export should contain the complete candidate result set satisfying the operator's substantive filters, independent of how many rows are currently rendered on screen.

Substantive filters remain authoritative for export scope, including strategy, symbol/search filters, DANGER visibility, and other candidate-selection filters. A presentation-only Show/row-count control must not silently truncate the export.

## Evidence

Observed during acceptance testing on 2026-09-14:

- Deployment displayed **"Showing 90 rows."**
- The exported puts CSV contained **90 data rows**.
- The exported specimen was named `wheelwright-puts-2026-09-14.csv`.
- It was **not established** that the complete filtered candidate set contained more than 90 exportable rows.

Epistemic status: the 90-row UI state and 90-row export are observed; causal truncation by the presentation limit is suspected and requires a controlled >90-row acceptance test.

## Consequence

If confirmed, an export can appear complete while silently omitting valid filtered candidate rows. This becomes operationally significant as Wheelwright produces result sets larger than the on-screen presentation limit.

Severity is not established by the current evidence.

## Diagnosis / root cause

Not established.

A possible coupling between presentation row limiting and export input is the subject of the required verification; it must not be treated as proven root cause until demonstrated.

## Scope / non-goals

This record concerns CSV export completeness relative to the Deployment table's presentation row limit.

It does not cover:

- the newly admitted-symbol discoverability/hydration acceptance finding;
- whether a pending symbol produces a recommendation row;
- DANGER classification semantics;
- admission or universe membership;
- redesign of Deployment pagination or table rendering.

Filing this bug does not authorize remediation.

## Acceptance criteria

A controlled acceptance test must:

1. Establish an underlying filtered candidate set containing more than 90 exportable rows.
2. Leave the Deployment presentation limit at 90.
3. Export CSV.
4. Verify that the CSV contains the complete filtered candidate set, not merely the 90 rendered rows.
5. Compare membership as well as row count so a different truncation cannot accidentally pass.

If the CSV contains only the displayed 90 rows, the defect is confirmed. If it contains the complete filtered set, this suspected defect should be dispositioned based on that evidence.

## Remediation history

None. Open; remediation is not authorized by filing.

## Verification

Pending the controlled >90-row acceptance test described above.

## Related

- Acceptance testing, 2026-09-14.
- Separate from the admitted-but-pending symbol discoverability/hydration finding.

## Audit checkpoint — 2026-09-22

**Disposition:** Confirmed active; the prior "may be constrained" wording understated the evidence.

Current Deployment export applies the presentation `showCount` limit before CSV generation. With the current 90-row presentation limit, the exported CSV is therefore truncated to the presented subset rather than representing the full evaluated/exportable population. This was confirmed directly from the implementation during the open-bug audit.

**Restart point:** Preserve the demonstrated distinction between presentation limiting and export membership; remediation should make export operate on the authoritative full export set rather than the display slice.
