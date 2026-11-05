# TT1 offline experimental evidence — independent review history

Date: November 5, 2026. Engineering evidence, not Product acceptance or installation.
Commission: explicit Principal bounded implementation/offline verification and
independent review following the Experimental-Custodianship Audit.

## R1 — REJECT

Immutable candidate: `108892c4f7f881df6d5878772e23a435f173b2b2`.
Independent reviewer: separate Codex reviewer task `tt1_independent_review`, not
the implementation actor. Original candidate source/worktree remains unchanged.

Reviewer independently reproduced three blockers:

1. Incoming reversal relationships were ignored when a matched original row still
   had NONE_REPORTED. Existing `TransactionHistory` stores the reversal link on
   the reversing row. The synthetic record incorrectly retained final net P/L.
2. A future transaction provenance receipt could enter an earlier composition
   because only package clocks were checked against the knowledge cutoff.
3. A partially executed second opening did not participate in same-group
   ambiguity, allowing an affirmative close attribution despite an unresolved
   executed sibling.

Reviewer ran 18 Python tests and the relevant CLI/history/cadence/market/record
suites (42 passed, one unavailable private fixture skipped), then demonstrated
all three additional falsifiers. Green existing tests did not establish safety.
The independent reproduction was held outside Git at
`/tmp/tt1-independent-falsifiers-108892c4.py`; the three cases are now also durable
regressions in the corrected candidate's synthetic suite. No private broker data,
credentials, acquisition, source edits, installation or Sentinel changes were
used in review.

Reviewer accepted the qualified offline-source-artifact boundary in scope:
no new database or backend admission API is required for this slice. That is not
acceptance of the rejected implementation or a claim of complete experiment
closure.

## R2 — correction submitted separately

Corrections preserve three general invariants:

- A source observation cannot be consumed before its recorded receipt/context
  cut; event, receipt, historical decision assertion and composition times differ.
- Financial finality considers incoming reversal relationships, not only the
  original row's outgoing flags; missing source identity withholds finality.
- Every executed opening, including incomplete/canceled siblings, participates
  in ambiguity. Unresolved execution cannot be treated as absent execution.

Implementation and independent re-review remain separate. Final exact corrected
identity, verification and review disposition are recorded after submission.
No installation is authorized by either tests or review ACCEPT.
