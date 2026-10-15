# Canonical Position command — October 15, 2026

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
