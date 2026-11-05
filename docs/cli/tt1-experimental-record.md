# TT1 offline experimental record — engineering candidate

Date: November 5, 2026. Category E: bounded operator-experiment reference.
State: implemented candidate; independent review and installation tracked below.
This is not a ratified trading strategy, backend decision resource or authorization
to acquire, install, trade, notify or change the experiment.

## Commission and recovered precedent

The Principal commissioned the smallest evidence-closure implementation following
the November 5 Experimental-Custodianship Audit (in the commissioning conversation,
not a repository artifact). The audit is investigative evidence, not the execution
grant. The subsequent engineering assignment explicitly authorizes bounded code,
offline verification and independent review, and reserves installation/live
acquisition. The Principal briefly paused for concurrent-thread coordination, then
clarified that the other thread concerns Sentinel and directed this work to resume.
All work is isolated from that thread and the Talk checkout.

Recovered from root AGENTS → docs/AGENTS → docs/README and Codex bootstrap:

- `experiments/tt1-short-put-spread-19-session-cadence-2026-10-29.md`: operator
  hypothesis, original/later conventions and unresolved success/risk thresholds.
- `cli/tt1-opportunities-report.md` and `cli/tt1-positions-report.md`: accepted
  reporting/evidence classes, not strategy admission or executable-price claims.
- `07-architecture-current.md` replay/temporal boundaries; ADR-015/016/019/022/023;
  maintained Account/Position owners and open ASSIM-0002. No universal Position
  identity or new Program membership is created here.
- `research/options-trading-research-program-control-2026-09-27.md`: gross/net,
  marks/fills, trade/portfolio and outcome/expectancy distinctions.
- Product-first mandate, known failure checksum and fitness controls. The specimen
  is the ordinary candidate CLI composing existing source artifacts offline.

Remote main at commission: `c87facff6179ddb1abf4a36fa38f2a4ea0ae5151`.
Development base: `1b0e0089047e149c526be34461558ad14f8c7c79`, the exporter repair
closeout, preserving installed runtime `4d97643c18c04ee1343c5d50c0f6d79e37326b86`.
This isolated exporter lineage is not remote-main ancestry. The installed 130-file
manifest was verified against both installed bytes and its source commit during
the audit. Candidate work does not switch launchers or alter those files.

## Smallest independently achievable slice

Existing facilities and limits were inspected before coding:

| Facility | Reuse or bounded gap |
|---|---|
| Six-member cadence ZIP | Exact source bytes, manifest/hash checks, market/position/order context and independent clocks |
| Existing verified ZIP publisher | Same private-mode, verification, fsync and atomic no-clobber publication pattern; existing publisher remains unchanged |
| `ww history --account tt1 --jsonl` | Accept its already-saved, provenance-bearing output; do not invoke read-through acquisition during offline composition |
| Governed Decision retention | Existing ADR-019 slice supports its own evaluator and context, not an established TT1 operator-note contract; not repurposed by inventing evaluator/Program authority |
| v2 Artifact upload | Supported brokerage CSV intake, not arbitrary TT1 notes/ZIP admission; no new API or schema added |
| Standalone held-package recognizer | Its output is retained as valuation/context. Closed-order tracing needs fills no longer in custody; this bounded composition matches native complex-group IDs plus exact reversed constituents, not current holdings or strike proximity |
| Later cadence snapshots | Reuse observations of original contracts after close; no monitoring service, acquisition, indicator calculation or scheduler |
| Market Sentinel | Separate calculation owner; no supported TT1 integration contract recovered. No code copied, imported or changed |

The result is an **operator-authored research source artifact**, not authoritative
v2 domain state, a local shadow transaction ledger, a second Decision database or
a new framework. It does not amend accepted API behavior. Backend admission of
such notes would require a supported contract; that gap remains explicit.

## Candidate command

```text
ww export tt1-record --input NOTES.json --output PRIVATE_DIRECTORY
```

Before installation, the equivalent candidate command is
`node scripts/wheelwright.mjs export tt1-record ...` from this worktree. No backend
URL, token, environment setup, broker credentials or operator GUID entry is needed.
The dispatch occurs before backend/configuration discovery. Python 3 is reused
from the existing exporter tooling; there are no new dependencies.

Output is a new 0600 ZIP. Existing outputs and source files are never overwritten.
The command prints only its output path; it does not dump private financial data.
Keep notes, history and output outside Git. A supplied history file is the
operator's TT1 attribution; one consistent Account ID is required in the saved
rows, but the redacted cadence source cannot independently cross-verify its native
broker number. That qualification travels with the record.

## Input v1

All names below are a bounded file contract, not new public Wheelwright resources.
Paths resolve relative to NOTES.json. Times require explicit zones. Monetary
source strings and original payloads are preserved; missing values remain null.

```json
{
  "schema": "tt1-experimental-input/v1",
  "experiment": {
    "id": "tt1-19-session-2026-10-29",
    "hypothesis": null,
    "successCriteria": null
  },
  "packages": ["cadence-before-decision.zip", "cadence-after-execution.zip"],
  "policies": [],
  "decisions": [],
  "evaluation": null
}
```

The empty fields are honest historical reconstruction, not a useful prospective
decision by themselves. For a subsequent SELECT or WAIT, add an operator-supplied
decision with:

- `id`, `decidedAt`, `action` (`SELECT` or `WAIT`). Decision time is explicitly an
  operator assertion; `recordedAt` is the actual composition clock. Retain the
  first contemporaneously composed archive. Later recomposition cannot prove a
  decision was recorded earlier; it must not replace that first archive.
- `packageSha256` and `manifestSha256`: exact source ZIP hash and its manifest-byte
  hash, available from the record's `sources`. Both must match. The decision must
  follow all independently zoned material source clocks, not just the export
  start time. Later packages may reconcile execution, never replace entry inputs.
- `policyVersion`: supplied local policy ID or null. Each policy contains `id`,
  `declaredAt`, `effectiveAt`, an explicit `rules` object and source/standing as
  available. These are asserted conventions, not ratification. Both times must
  precede the decision. IDs are local to the preserved input artifact; the full
  pinned payload travels with each decision. Duplicate IDs are rejected.
- `selected`: for SELECT, `underlying`, ISO `expiration`, `shortStrike`,
  `longStrike`, `quantity`; WAIT must have no selected trade/opening order. The
  exact retained pair, including exclusions/economics, is copied if available.
  Missing pairs remain NOT_RETAINED; exclusions are never upgraded to executable.
- `rationale`, `rejectedAlternatives`: exact operator statements or null. An empty
  alternatives array means explicitly none supplied; it is not a reconstructed
  comparison universe.
- `openingOrderId`, `attemptOrderIds`: optional explicit broker references. Status
  and raw evidence are retained for filled, canceled, expired, live or unknown
  attempts; an asserted link alone never establishes a fill. Opening composition
  and causal receipt time must independently agree for a verified decision link.
- `intendedExit`, `deviations`: optional operator-authored intent/qualification.
  These remain separate from actual broker instructions and their modifications.

Optional `exitChangeNotes` is a list of `orderId`, `reason` and the operator's
decision/source timestamps. Reasons are never generated from resulting orders.
The source note survives verbatim; it does not rewrite the broker's receipt time.

The proposed approximately 50%-capture / 2× opening-credit stop limit / 92%-of-limit
trigger is **provisional, investigatory and non-retroactive**. No configuration is
computed, submitted, defaulted or automatically applied by this command. Record
the exact intended values and standing only when supplied by the operator.

Optional `history: {"path": "saved-tt1-history.jsonl"}` accepts an already-saved
existing history representation. Do not run `ww history` under an offline-only
assignment: its backend may acquire. Empty JSONL cannot establish coverage; omit
it and retain NOT_SUPPLIED. Mixed Accounts/cuts, duplicate transactions, absent
lineage and truncation against the declared record count are rejected. A complete
bounded result still has UNKNOWN lifetime coverage.

Optional `accountBasis` declares `beginningAt`, `beginningCash`, `beginningEquity`,
`endingPackageSha256`, and `historyCompletenessAssertion` (`from`, `through`,
`source`). A residual is calculated only when this explicit premise, supplied
bounded completeness and history's requested-through cut cover the ending broker
balance. It remains **conditional on the operator's completeness assertion** and
provider snapshot consistency remains unverified. Missing premises withhold the
bridge. A computed unexplained residual is never relabeled fees or trading loss.

## Output and qualification

- `operator-source.json`: exact notes bytes, including missing hypothesis,
  criteria, rationale or evaluation; never invented content.
- `sources/<sha256>.zip`: exact original cadence bytes, verified before use.
- `history.jsonl`: exact supplied transaction source, if any.
- `experimental-record.json`: source identities; pinned decisions; raw opening
  evidence; actual profit/stop/TIF/GTD configurations; native replacement links;
  receipt/cancellation periods; fills; costs where supported; balances; marks;
  later underlying/original-contract observations; unknowns and qualifications.
- `review.txt`: separate WAIT/linked-entry sessions, attempts, supported/unresolved
  openings, closed/unestablished closes, gross/net/cost status, policy references,
  current supplied marks and missing evaluation. Historical TT1 inventory does
  not automatically enter the experiment cohort. Deviations require the retained
  intended rules and operator judgment; the report does not declare optimality.
- `manifest.json`: output payload hashes/lengths. No manifest self-checksum claim.

Supported economics is deliberately narrow: standard 100-share put verticals,
complete reported fills, a unique filled opening per native complex group and
exact reverse constituent quantities. Unsupported structures, unknown terms and
partial fills remain visible as unresolved openings. Different same-underlying
packages cannot inherit each other's closes. Unlinked closes and unknown interim
events are not filled in by geometry. A native group link is qualified broker
association evidence, not universal lifecycle completeness or Program membership.

Net realized P/L requires transaction rows matching each complete opening/closing
leg's action, quantity, value and execution time, with no unresolved correction or
reversal, USD, supported normalization and explicitly final reported commission/
fee components. Estimated or missing costs leave final net P/L null. Observed net
cash is preserved separately. Partial history never becomes lifetime completeness.

Actual order snapshots retain prior fields/statuses with source clocks. Receipt
and cancellation do not establish activation, exact intraperiod edits or continuous
working state. The documented 21-DTE research date is an objective, not an executed
time exit. Later qualified or unqualified original-contract observations retain
their own qualifications; none becomes an assumed counterfactual fill. Missing
future horizons, intraday paths, BP occupation and activation markets stay unknown.

## Verification and remaining decisions

Run `node --test scripts/tt1-experimental-record.test.mjs` for the synthetic offline
specimens (the wrapper runs the Python tests). Existing cadence/history/CLI suites
must pass as well. Private source replay is separate from public synthetic tests;
no broker originals, account identifiers or result archives belong in Git.

The retained-source reference replay traced its opening, replacement and closing
fill, preserved the gross result and subsequent exact-contract observations, and
withheld missing costs/rationale. Private artifacts stay outside Git. This does
not close missing original candidate/ranking evidence or final transaction costs.

Still reserved: Principal success/risk criteria and cohort/exception judgments;
authorization to recover later brokerage history; backend admission contract if
that becomes needed; supported Sentinel integration; installation. No new
framework or strategy change is justified by these gaps.

Independent review REJECTED frozen `108892c4f7f881df6d5878772e23a435f173b2b2`:
incoming transaction reversals, future transaction receipts, and partially executed
sibling openings could be promoted into unsupported final outcomes. The original
commit/worktree is preserved. Correction is a new isolated revision under the
same bounded assignment, not authority derived from the rejection. It applies the
composition cutoff to transaction provenance/context, tests incoming reversal
relationships, and includes every executed sibling in group ambiguity. An
unresolved partially executed opening cannot disappear merely because it is
Cancelled rather than Filled. See the [review record](../reviews/tt1-evidence-record-2026-11-05.md).

Independent re-review REJECTED R2
`ffac5dc80bc7e3f47948c80d6c351026eaf49c5c`: its original three corrections passed,
but future cancellations could still become confirmed event periods. R2 is also
preserved unchanged. Before R3, the temporal model was reconciled into a shared
observed-event boundary rather than another cancellation-only check: occurred
order events must lie between instruction receipt and source observation;
operational update clocks must not exceed source observation; transaction events
must not exceed artifact receipt; receipts/context must not exceed composition.
Planned GTD/option expiration and future-effective declared policy are distinct
from occurred events and remain representable without pretending they happened.

R3 has a parameterized event-class/boundary test matrix. Independent review is
pending at this freeze. No installation, operational change or Principal Product
acceptance is claimed.
