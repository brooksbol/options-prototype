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

Immutable source: `4885d601f22c5771a7d8814b89218665667d4a3d`.
Independent disposition: **ACCEPT for the bounded offline evidence-record capability**.

Reviewer independently verified every produced member hash/length, exact generator
source/hash/runtime, original notes and mode0600. Original notes, packages, history
and repository-script copies were removed before running the archived generator.
Every derived field matched apart from the actual newer replay composition time.
All 31 prior invariant specimens, Python25 and relevant Node42/one unavailable
private-fixture skip passed independently. The reference six-source lifecycle and
post-exit trace also passed; original rationale/final fees remained unknown.

No remaining blocker was found within that scope. This is not complete experiment
closure, complete transaction history, final cumulative net P/L, original historical
ranking/rationale, executable counterfactuals, future observation coverage,
Principal success criteria, backend admission, Product acceptance or installation.

R1–R3 rejected commits/worktrees remain preserved. The implementation actor did not
review its own submission. A separate final documentation-only closeout records
this acceptance; the reviewed executable source remains byte-identical.
No installation is authorized by either tests or review ACCEPT.

## Final bounded verification and handoff

- Reviewed executable source remains byte-identical to `4885d601`; final closeout
  changes reference/review/journal/navigation documentation only.
- Full standalone CLI/TT/visual regression command: **442 passed, two unavailable
  private fixtures skipped, zero failures** (444 top-level tests). Its new wrapper
  additionally runs **25 Python accountability tests**. Focused CLI/history/
  cadence/market/record subset: **42 passed, one of those fixtures skipped**.
- The first broad run encountered three missing generated Java specimens, rather
  than implementation failures. Existing offline `PositionsTest`,
  `HistoricalPositionsTest` and `TastytradeAcquisitionTest` generated the four
  required synthetic files: **18 Java tests passed**. The unchanged Java sources'
  generated files were reused in later isolated worktrees' ignored build folders.
  Broad regressions then passed, including the final R4 source.
- A separate private harness invoked existing `TransactionHistory.retained` using
  SQLite `mode=ro`, no provider client and acquisition disabled; the existing
  `validateHistory`/`renderHistory` JSONL path accepted its stale, incomplete
  32-record result. The source cut remains old; no broker history refresh occurred.
- The private final record combines that source with six retained cadence ZIPs,
  preserves their bytes, actual reference lifecycle and later observations, and
  keeps final fees/rationale/account bridge unknown. It includes generator bytes,
  digest/runtime and detached replay locations. Source and result archives remain
  outside Git, in private verification storage.
- The root Talk worktree, installed `ww`/`tt` targets, exporter source, services,
  broker orders, credentials, grants, strategy parameters, Sentinel and schedules
  remain unchanged. No live brokerage acquisition or notification occurred.
- No changed file is a canonical input of the inspected Roadmap generator. No
  Roadmap regeneration is required. No API v2 contract/runtime/build semantics
  changed; API documentation update/publication is NO_OP for this workstream.
- Source is handed off on its isolated exporter lineage. Remote main remains the
  separately verified accepted-main identity; no merge, installation, activation,
  Product acceptance or strategy ratification is claimed.
