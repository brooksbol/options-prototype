# BUG-049 — independent acceptance and coordinated delivery

**Date:** October 23, 2026. **Standing:** bounded integration/deployment receipt;
Principal operator acceptance remains pending. BUG-049 remains **Open**.

## Accepted identity and final post-checks

The Principal supplied Kiro's independent **ACCEPT** of the revised 12-file
archive `/tmp/wheelwright-bug049-candidate-20261023-r1.tar.gz`, SHA-256
`1e27c1f6f1c374ca8cb6e850c4583568b91156b379e313cbe27817694a346366`,
base `91a627b27aac7fdaac535afe2a736f94383707c4`, and explicitly directed
Codex to finish only two post-checks and integrate/deploy the accepted candidate.
No new implementation iteration or full review was commissioned.

Principal-supplied Kiro results: 1,018 Java tests, zero failures/two skips;
380/380 CLI; 65 HTTP requests/zero failures; contract/docs and projection passed.
These are attributed independent-review results, not a new Codex review verdict.

Codex completed both outstanding post-checks before operational mutation:
- All 12 source hashes matched the frozen manifest in both Kiro's post-test
  checkout and the integration checkout.
- Original H-004 tree: all 11 dirty/untracked file hashes, status and binary
  diff unchanged. Before-review service PIDs unchanged: v1 3100=21011,
  Vite 5173=21026, old v2 3101=23742. Old v2 JAR hash and installed ww/wwt
  targets unchanged. No original build file modified after review began.

Local post-check receipt: `/tmp/wheelwright-bug049-postchecks-20261023/postchecks.json`.
No credential or raw Account payload is included in this repository receipt.

## Integration and deployment

Remote main was reverified at91a627b2 before persistence and push. Exact accepted
12-file source committed at **dbdd6ea037a8ed8d6be57da403e95d0f569a0300**.
No accepted implementation bytes changed. Normal documentation release identity
refresh is a separate metadata commit **cc066b15930f62824bdb7b2cec414deeaa3a8e3c**;
both commits were fast-forward pushed to main. Original frozen/main checkout
was neither reset, rebased, stashed, built nor used as an integration workspace.

Private paired release: `~/.local/share/wheelwright/bug049-20261023/`.
JAR SHA-256: `1f9dda4c6cc320b8fdf3566e6506bb2d0a838536ef7b0b0b14244c2e4dbf1100`.
Matching ww scripts/man pages were exported from the exact accepted source;
existing dedicated private ww configuration was preserved with private permissions.
No new grant, Account binding, credential or migration was introduced.

Reused the established JAR/SQLite deployment helpers and protection/recovery
pattern. A consistent private operational-database copy passed rehearsal:
number-free Account collection/detail, matching CLI JSONL/table, unchanged User,
all preexisting evidence/grant rows and Artifact payload hashes preserved. The
previous JAR reopened the same copy and passed recovery checks.

Deployment obtained live and quiesced consistent private backups, stopped only
old v2, atomically switched the ww symlink while v2 was down, then started the
corrected backend with the prior operational configuration. This prevented an
old-client/new-backend interval. Failure handling restores the prior client/JAR
pair; no recovery was needed. v1 was never stopped or restarted.

Installed v2 is PID82933 on3101. The ordinary installed command
`ww ls accounts --jsonl` passed without engineer connection/configuration overrides
and returned the same three authorized Accounts as direct collection/detail reads,
with no brokerage-number fields. Explicit table verification passed without a
BROKER ACCOUNT column or meaningless **** cells. Canonical IDs, User identity,
existing grants, bindings and retained evidence were preserved. Protected v1/Vite
PIDs remained unchanged. The installed mixed wwt target remains untouched and
must not be launched as an H-004 shortcut.

Private deployment receipt and backups are retained under that paired release's
private directory. This is installed author verification, not Principal operator
acceptance or a new brokerage/acquisition/model-safety certification.

## Documentation publication

Reused the adopted API-v2 documentation update procedure. Clean accepted-source
preview build/validation and browser specimen passed; release identity binds to
dbdd6ea. Unchanged preview date preserved; publication date2026-10-23. Publication
build/validation/browser checks passed all32 public operations, native navigation,
search/mobile/error examples, zero unexpected requests/page errors. No release
workflow, permissions or controls were weakened. Live publication observation is
recorded below after the existing push workflow completes.

## Remaining boundaries

The old backend can still leak a number through explicit JSONL with the new
client. Coordinated deployment is essential; do not treat the CLI as a privacy
filter for old API payloads. The separate artifacts brokerAccount finding is
unchanged, outside BUG-049 and excluded from H-004's fixed Account-only path.

Principal operator acceptance: run ordinary installed `ww ls accounts` and
`ww ls accounts --jsonl`; check nickname-first discovery and number omission.
No environment variables, ports, GUIDs or backend wiring are required.
BUG-049 stays Open until the Principal accepts this installed behavior.

H-004 remains separate. The Principal confirmed the shown OpenAI organization
is the one used by wwt, provided screenshots with all three sharing options
Disabled and API logging enabled per call, and explicitly accepted transmission
of only authorized nicknames, broker labels and counts with store:false under
standard retention and documented exceptions. ZDR/MAM enrollment is not claimed.
An isolated eight-file Account-question implementation candidate exists with
unchanged H-003 agent/tests and an extended existing launcher; nine H-004 tests
plus15 H-003 tests pass, including SDK wire-level store:false verification.
Independent H-004 review, actual-data author conversation and installation remain
pending. No actual Account metadata has been sent to inference during this work.

## Final publication observation — LIVE_VERIFIED

Existing push workflow [39985542391](https://github.com/brooksbol/options-prototype/actions/runs/39985542391)
completed successfully with build/deploy at exact source
`cc066b15930f62824bdb7b2cec414deeaa3a8e3c`. No dispatch/rerun or permission change.
Independent fetches of both live static files match local validated publication
bytes exactly: index.html SHA-256
`10a2dbb71233d6d7eaf6f89bfc2164b4f5dbf084b8772e8fca33727b5063f2b4`,
LICENSES.txt SHA-256
`d49296fc22d15683bf0608962baec5337440a9a93537d7bf135d4a87be3dd5b8`.
Live browser specimen passes all32 public operations, native search/error/mobile,
zero page errors/unexpected requests. Live desktop/mobile captures were visually
inspected. Existing forced-Node24 deprecation annotations are nonblocking;
no dependency/workflow change introduced.

Final installed checks: ordinary `ww ls accounts --table` renders three rows,
no BROKER ACCOUNT column and no meaningless **** cells; unauthenticated Account
collection returns401. Post-deployment original H-004 hashes/binary diff and
protected v1/Vite PIDs still match. Delivery is installed/verified, while
Principal operator acceptance remains **PENDING** and BUG-049 remains **Open**.
Final evidence/main SYNC is reported after the documentation-only closeout push;
accepted application source dbdd6ea and documentation publication cc066b1 remain
distinct identities. These receipt/index/continuation changes add no new
implementation and no new publication inputs.
