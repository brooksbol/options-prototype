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

## R2 — REJECT after correction submitted separately

Immutable candidate: `ffac5dc80bc7e3f47948c80d6c351026eaf49c5c`.

Corrections preserve three general invariants:

- A source observation cannot be consumed before its recorded receipt/context
  cut; event, receipt, historical decision assertion and composition times differ.
- Financial finality considers incoming reversal relationships, not only the
  original row's outgoing flags; missing source identity withholds finality.
- Every executed opening, including incomplete/canceled siblings, participates
  in ambiguity. Unresolved execution cannot be treated as absent execution.

The independent reviewer verified the original three fixes using incoming TRADE
and OTHER reversals, three partially executed sibling status classes, and seven
transaction/history clock cases. Independent Python21 and Node42/one unavailable
private-fixture skip passed. Six actual retained source ZIP inventories/hashes/
lengths and the reference lifecycle/post-exit trace were independently verified;
final costs and selection rationale remained unknown.

R2 nevertheless had one remaining blocker: a future cancellation timestamp was
projected as a confirmed historical cancellation period. The independent frozen
reproduction was retained at `/tmp/tt1-independent-cancellation-ffac5dc8.py`.
The same knowledge-cut invariant had been applied selectively. R2 remains frozen
and unchanged; its valid fixes are retained in the successor.

## R3 — model reconciliation and new candidate

The repeated temporal finding triggered model synthesis before further code:

| Time class | Permitted relationship |
|---|---|
| Actual order receipt | At or before source read receipt |
| Actual fill/cancel/reject/expire/live/trigger event when reported | At or after instruction receipt and at or before source read receipt; no activation semantics inferred |
| Native broker update clock | At or before source read receipt; operational clock is not an economic event |
| Actual transaction execution/creation | At or before its artifact receipt |
| Transaction artifact receipt and supplied history context | At or before composition cut |
| Source decision evidence | All material source clocks at or before asserted decision time |
| Planned GTD/option expiry/future-effective policy | May be future; never interpreted as an occurred historical event |

A shared observed-event validator and explicit native-clock classification now
implement that model. Parameterized tests vary every event class across
before-instruction, after-source/before-composition, and future-composition cuts;
valid future planned dates remain admissible. This changes evidence qualification,
not the trading policy, broker trigger semantics or authority model.

R3 immutable identity: `a7c986b3c771b5314a0a0edb79a4195d56fa21c8`.
Independent review: **REJECT solely for missing generator provenance**.
The implementer raised this omission during review; the reviewer independently
confirmed that neither record nor manifest identified the reconciler source or
runtime. Cadence producer revisions do not identify the separate derivation that
produces experimental results. A detached archive could not distinguish results
produced by earlier rejected algorithms.

Prior invariant fixes independently passed 31 reviewer specimens plus additional
update-clock/transaction-receipt cases, Python25, Node42/one private-fixture skip,
and independently checked six-ZIP/reference lifecycle/post-exit evidence. No further
financial/temporal blocker was found in that tested scope. R3 remains unchanged.

## R4 — bounded generator-provenance correction

The output now contains the exact standalone generator source, its SHA-256 and
Python implementation/version in the record and manifest. Original operator
bytes remain intact. A derived replay input changes only source file locations
to archive members and names the original composition time without overriding
the actual new replay clock. The regression detaches from the original cadence
path and runs the archived standalone generator, comparing pinned decisions,
source identities and generator identity.

Exact R4 source and independent disposition are recorded after submission.
No installation is authorized by either tests or review ACCEPT.
