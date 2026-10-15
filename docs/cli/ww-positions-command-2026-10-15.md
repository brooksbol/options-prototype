# Canonical Position command — October 15, 2026

**Current status: Principal acceptance PASSED — October 15, 2026.**
The Principal accepted the ordinary installed `ww positions` after observing the
single-table terminal result. Accepted scope: no-argument authorized Account
Position inventory, BROKER/ACCOUNT as columns 1/2, shared compact table, consistent
human contract typography and no close-order section in bare output. Both command
spellings work from any directory; verbose/raw JSONL and explicit Account/snapshot
selection remain available. This accepts the bounded installed Product behavior,
not unfinished managed-Position monitoring or new financial/domain semantics.

Accepted installed runtime: `3de8dceb1659a674a30d35714896b4baba86fdbe`;
test-only follow-up: `0ac98f67d796207fd630d0d2841b28d710183c5a`;
pre-acceptance delivery evidence: `31cb5335278f6ff62817f7d414d69aa6bba2c2d5`.
Normal `~/.local/bin/ww` targets
`~/.local/share/wheelwright/pl-cli-01-positions/operational-20261015-3de8dce/client/scripts/ww`.
The private release manifest preserves source hashes, the previous executable,
unchanged saved configuration and verification output. No backend/service/DB/grant
change or brokerage acquisition was needed. Independent engineering verification
and Principal Product acceptance are separately established.

The following sections preserve the initial source-only checkpoint and subsequent
Product corrections chronologically. Their earlier pending-acceptance/no-visual-
change language is historical scope, superseded by this accepted delivery.

## Initial grammar checkpoint and delivery progression

Product decision: the Principal commissioned `ww positions` as the canonical
Position inspection command, with `ww show positions` retained as a fully
functional compatibility alias. This is bounded PL-CLI-01 command grammar work,
not managed-Position monitoring, new Position semantics or Product acceptance.

Implementation basis: remotely verified main
`03c2a47fe8499ac17ca924cd66047d640ce0652d`. Both spellings normalize through one
parser branch to the existing `show-positions` internal dispatch identity. Account
discovery, backend read, validation and renderer remain unchanged. Existing usage
and transport diagnostics retain their compatibility wording. Help and current
examples prefer the canonical spelling; historical acceptance evidence retains
the original spelling.

Recovered precedent and constraints: installed `ww show positions`, its compact
inventory/verbose/JSONL behavior, `ww-positions.mjs` and existing tests;
PRIN-ARCH-BACKEND-AUTHORITY, Doc 77, ADR-015/016/017, Product-first mandate and
existing fitness-control program. This reuses existing capability without a new
abstraction. No financial or visual changes, API/backend/database changes,
brokerage contact or operational deployment are included.

Proof: `scripts/ww-positions-alias.test.mjs` compares actual command processes
against a controlled local HTTP server, checking byte-identical stdout/stderr,
exit status and ordered backend requests. Covers default terminal and redirected
output, table, verbose, JSONL, Account lookup, exact snapshot selection, colors,
no-color/NO_COLOR/TERM=dumb, locale variants, help, invalid arguments, unknown
Account, forbidden and malformed backend responses. Positions did not support
TSV, quote filters or separate ASCII/Unicode flags; unsupported flags remain
usage errors. Output selection remains human on terminal and JSONL when piped,
with table/verbose preserving explicit human output.

Parallel safety: implementation uses a separate worktree/branch from remote
main. Original main has a local history authorization checkpoint and active,
uncommitted history backend changes; neither is included or modified. The shared
CLI files were clean at isolation. New history files appearing during this task
remain owned by that workstream. Its behavior/acceptance is not certified by this
change; remote main has no history command yet. No history source, tests or design
are changed. Its future shared-dispatch integration must preserve this alias.

Verification: 91 focused CLI tests passed (alias, existing dispatch, Accounts,
quotes/show/query, fetch, ls, sync and capital), followed by a passing alias rerun
including terminal-default comparison. Generated show-manual registry check and
whitespace checks pass. Existing Java-generated Position fixture tests require
build artifacts absent from this isolated worktree; no backend build or live
acquisition was performed for this dispatch-only change.

## Reconciliation with accepted history delivery

On resumption, remote main `7732138decf3318abe2482af84dde82290777509`
records Principal acceptance and closeout of integrated pull/history. The original
checkout is clean and synchronized. The only textual merge conflict is adjacent
root-help lines: retain both the Position alias description and the accepted
optional-symbol fetch synopsis. History/pull/sync/default-fetch dispatch and their
manuals remain as accepted. No Product or architecture plan change is required.
The previous parallel-safety paragraph describes initial isolation, not current
history availability. Operational installation remains separate from this source
integration; the accepted installed release is not replaced by this change.

Reconciled verification: 43 tests pass across the canonical/alias process
comparisons, shared dispatch, Accounts, history, update/pull, fetch and sync.
Generated show-manual consistency and assignment-scoped whitespace checks pass.
The net delta from accepted main remains the eight Position grammar/help/test
files; no history/pull/backend/API implementation or accepted delivery evidence
is changed. Independent engineering verification is repeated on the frozen
reconciled commit before promotion.

## Installed Product delivery scope — Principal clarification

The Principal requires ordinary installed `ww positions`, with no flags, from
any working directory. Source merge and isolated tests do not establish delivery.
This authorizes client installation using the established immutable release plus
normal `~/.local/bin/ww` symlink, preserving existing private configuration and
previous target for recovery; no backend restart, migration or grant change.

The prior parser required --account, so bare invocation now reuses the existing
unscoped GET /v2/positions collection. The backend selects authorized available
snapshots; the CLI validates the complete collection before output, obtains
friendly labels through existing Account discovery and renders each using the
unchanged accepted renderer. No Account or financial interpretation is moved to
the client. Explicit --account and --snapshot behavior is preserved; --snapshot
requires --account. Both spellings share bare and explicit behavior. No-evidence
scope is empty machine output or a concise human absence statement. Backend
failure fails nonzero without invented empty evidence. Machine output remains
one complete snapshot per JSONL line. No output-selection policy changes.

Operational verification must use the normal PATH-resolved executable and the
saved configured v2 backend, with real retained evidence. It performs pure v2
GETs only; no history/pull/acquisition or brokerage operation is needed. Preserve
private output outside Git. Independent engineering review and installed-command
verification are evidence; Principal acceptance is not claimed automatically.

Pre-install independent review rejected 16cf477 for an explicit JSONL-on-terminal
composition defect (blank separators/prose on empty collections). The corrected
candidate excludes explicit JSONL from human collection framing; regression
specimens cover multi-Account and empty terminal JSONL. The rejected candidate
was not installed. This preserves the output-selection contract across scopes.

## Installed command verification — October 15, 2026

Corrected source `98432965202a20b4981273af8d57269985f39205` independently
ACCEPTED for engineering conformance, then installed using the established
source-verified client release and atomic normal ww symlink replacement.
Release: `~/.local/share/wheelwright/pl-cli-01-positions/operational-20261015-9843296/`.
The release private manifest preserves previous target, hashes and recovery
check; the previous executable and its saved configuration remain intact. The
new private .ww.env is byte-identical with mode 0600. No backend process, database,
grant, brokerage acquisition or history/update source changed.

Exact PATH-resolved `ww positions` with terminal stdout exited 0 from `/tmp` and
User home, using `~/.local/bin/ww`, with no flags, setup or repository-relative
path. It displayed pts (31), sawdust (7) and tt1 (10) retained Positions. The exact
installed compatibility command also exited 0. Recorded terminal comparisons
are byte-identical between spellings and match the previous installed explicit
Account tables, with blank lines between Accounts. Redirected runs emit three
snapshot JSONL records; their evidence is equivalent between directories and
spellings apart from per-request correlation/evaluation clocks. Unknown financial
values remain unknown. All request paths are existing Wheelwright v2 GETs;
no provider or acquisition operation is involved.

Verification: 44 focused shared/alias/history/update tests plus six existing
Position parser/render/transport tests pass. Independent review of corrected
source accepts conformance; generated manual check passes. Private operational
output and verification JSON stay in the release's private directory outside
Git. Installed history/pull help is functional and their source/manuals are
byte-identical to the prior accepted installed release. No Principal Product
acceptance, new financial capability or managed-Position monitoring is claimed.

## Single-table Product refinement — October 15, 2026

Principal requests BROKER and ACCOUNT as columns 1 and 2 and one human table
across the returned Positions. This supersedes the prior compact per-Account
headings and joined-table delivery specimen. Reuse the existing compact row
projection and formatting with one global width calculation and one header.
Broker brand colors and cyan aliases remain; opaque Account fallback stays gray.
Mixed broker output retains CUSTODY when reported by any constituent and displays
? for unspecified brokerage custody, rather than exposing BROKER_REPORTED.
Explicit Account compact output follows the same table grammar. Verbose evidence
detail remains available; snapshot/evidence dates remain in verbose/JSONL instead
of per-Account compact headings. Complete JSONL, retrieval, authorization and
Position/financial interpretation are unchanged. The compatibility alias shares
this renderer. No backend/history/pull/brokerage change is authorized or needed.

Focused specimens verify first-two-column order, one header/global alignment,
multiple brokers, quantity/sign/unknown preservation, color equivalence/opt-outs,
empty output, explicit Account consistency and byte-identical original snapshot
JSONL. Deliver through the existing normal installed CLI release mechanism and
verify exact `ww positions` without acquiring new evidence.

Installed refinement: source `1dec8ab4a16d963a02b2ab2703418287defc8ced`
independently verified (46 shared/focused checks plus six Position checks).
Normal ww symlink now targets source-verified client release
`~/.local/share/wheelwright/pl-cli-01-positions/operational-20261015-1dec8ab/`.
Configuration is byte-preserved; previous release remains available for recovery.
Exact `ww positions` exits0 from `/tmp` and home: one header,48 rows, BROKER and
ACCOUNT first, shared widths and no per-Account banners. Installed alias human
output is byte-identical. JSONL compared with prior installed release preserves
all snapshot evidence except request/evaluation clocks. History/update sources,
backend and acquisition are unchanged. Private terminal/verification evidence
stays with the release outside Git. This is installed engineering verification,
not an invented Principal acceptance disposition.

## Contract typography and holdings-only bare output — October 15, 2026

Principal identifies inconsistent Fidelity/tastytrade POSITION / CONTRACT syntax
and directs that bare output must not show close orders. Compact output remains
holdings-only: no orders, close terms or order inference are introduced.
Single-contract Options whose Position label equals their observed contract use
common human typography `ROOT YYMMDD{C|P}STRIKE`, for example `XLF 261127P52`
and `USO 261023C153`. Fidelity's source prefix and OCC padding/fixed decimal
encoding are display syntax, not quantity direction or Wheelwright identity.
Require backend kind Options and matching published expiration; preserve raw
fallback for unrecognized/mismatched forms and custom/explicit association labels.
Adjusted roots (ETHA1), fractional strikes and all raw source values are preserved;
exact decimal text formatting uses no floating-point financial calculation.
Verbose/JSONL remain raw and unchanged. No canonical identity, equivalence claim,
Position association, backend/API or acquisition behavior changes.

Recovered precedents: existing Fidelity compact source parser and backend
TastytradeHoldings supported envelope, PositionSnapshot kind/expiration and
single-contract labels. This is a bounded human formatter, not reuse of the
standalone tt broker client or introduction of client domain authority. Regression
covers both encodings, fractional precision, adjusted roots, malformed/fallback
inputs, labels and byte-identical unmutated JSONL, plus holdings-only compact output.

Installed typography runtime `3de8dce` independently ACCEPTED, with test-only
follow-up `0ac98f6` also checked (runtime unchanged). All55 shared/Position tests
pass, including eight generated-Java specimen checks. Previous generated-fixture
presentation expectations were updated to the current table/contract grammar.
Normal installed source-verified release:
`~/.local/share/wheelwright/pl-cli-01-positions/operational-20261015-3de8dce/`.
Exact `ww positions` exits0 from `/tmp` and home: one header/48 rows, normalized
Fidelity/tastytrade contract display, adjusted ETHA1 preserved and no close-order
section. Alias human bytes match. Compared to prior installed release, all raw
JSONL snapshot evidence is unchanged except request/evaluation clocks. Previous
client/configuration remains available; no backend/history/pull/acquisition change.
Private terminal/verification evidence stays outside Git. No Principal acceptance
is claimed by these engineering checks.

## Accepted closeout

Principal command: **“acceptance PASSED; execute end of session protocol”**.
End-of-Workstream Memory Check: PL-CLI-01 remains the owning concern; no new intake,
principle, ADR, Bet or horizon. Recovered/extended accepted Position display and
existing v2 collection rather than a second Position model. Important rejected
JSONL framing and source-only completion remain preserved above. Installed release,
private recovery/configuration and accepted specimen are reconstructable. Coming
Soon still concerns broader Position reassessment/attention, so it is unchanged.
Managed monitoring, unavailable tastytrade economics/custody and unrecognized
contract-format fallback remain bounded limitations, not newly commissioned work.
Accepted pull/history, unrelated worktrees, EVA and WW-GATE-001 remain unchanged.
Closeout updates canonical state/index/journal, regenerates the derived Roadmap,
verifies current source/docs and synchronizes main. No further work is authorized
by this acceptance; next action after closeout is NONE.

Final closeout verification:55 CLI tests and147 Roadmap parser/integrity/freshness
tests pass. Generated show manual and Roadmap freshness checks pass. Installed
runtime source hashes match the accepted release/current runtime, saved private
configuration matches the preserved prior client, and recorded operational proof
retains successful command/alias/raw-evidence checks. No runtime reinstall or
provider call is needed for this documentation-only closeout.
