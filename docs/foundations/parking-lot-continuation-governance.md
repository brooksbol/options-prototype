# Parking-Lot Continuation Governance

**Status:** Ratified methodology
**Date:** August 29, 2026
**Authority:** Category B — Ratified Methodology
**Related:** `docs/parking-lot.md`, `docs/parking-lot-2.md`, `docs/README.md`, `docs/bootstrap/project-memory-protocol.md`

Wheelwright has one logical parking lot which may span multiple physical Markdown files for maintainability.

## Invariant

`docs/parking-lot.md`, `docs/parking-lot-2.md`, and any later numbered continuation files are pages of the same canonical backlog.

- File boundaries have no semantic meaning.
- Stable IDs are global across the sequence.
- Intake, merge, split, supersession, promotion, removal, and disposition rules apply across the whole sequence.
- New intake goes to the latest continuation unless an earlier item's original record must be reconciled.
- Cold starts, scans, searches, backlog reviews, and reconciliation work must inspect every `docs/parking-lot*.md` file currently present.
- Starting a continuation does not create a new backlog version, governance model, priority scheme, or authority layer.
- When the latest continuation becomes unwieldy, create the next numbered continuation under these same rules.

`docs/README.md` owns the bootstrap reading path; `docs/bootstrap/project-memory-protocol.md` owns retrieval/reconciliation discipline; actor cold-start documents reinforce the same rule.
