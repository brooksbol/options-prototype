# Account evidence synchronization and Position inspection

Start with `ww ls accounts` to discover authorized Account aliases, names,
broker associations and immutable IDs. Use an alias from that list in
`ww sync account pts` and `ww positions --account pts --verbose`.
Account discovery reads the backend's existing authorized collection; it does
not acquire brokerage evidence. `ww show accounts` directs operators to
`ww ls accounts`. Use `ww show -- accounts` for a literal quote symbol.

CONV-UX Account colors accepted (October 11, 2026): the Principal selected cyan
aliases (ANSI 96), bright white headings/details (97), and dark gray IDs
(256-color index 240). BROKER uses terminal brand approximations: Fidelity green
(32), tastytrade red (91); unknown brokers stay neutral. These categorical colors
identify the brokerage, not financial or operational status. This extends the
accepted `tt live` motif. Human tables have no row backgrounds;
each accent restores bright white and each line resets terminal attributes.
`ww ls accounts --no-color`, `NO_COLOR` (including an empty value), or
`TERM=dumb` disables color. Explicit `--table` preserves color through pipes;
redirected default TSV, explicit TSV and JSONL remain ANSI-free. Masking and
backend authorization are unchanged. All 21 focused CLI checks and installed
PTY/pipe probes pass. The Principal approved the rendered result; Codex inspected
the Desktop screenshot dated October 11, 2026 at 6:23:02 PM and confirmed the
palette, alignment and masking. This is Principal visual acceptance, not an
independent-review disposition.

Step 5 accepted configuration uses a dedicated private `.ww.env` alongside the ww client
containing only `WW_API_TOKEN` and `WW_BASE_URL`. It never reads the transitional
brokerage `.env`. Nonempty explicit Wheelwright exports still override this file.
Engineering provisions this configuration during an authorized deployment; no
standalone tt credentials were removed or relocated. Backend private configuration is provisioned separately.

For tastytrade, `ww sync account tt1` invokes authenticated backend acquisition
at `POST /v2/position-acquisitions?accountId=ID`. The backend alone exchanges
OAuth tokens, acquires and retains JSON, and admits a complete holdings snapshot.
The independent `account.positions.acquire:ID` grant is required; ordinary read,
artifact-write and quote-acquisition permissions do not imply it. Fidelity keeps
its existing CSV path. `ww positions --account tt1` remains a retained-state
read. No historical CSV operational import is introduced for tastytrade.

Position tables now use standing CONV-UX colors, with signed quantities visible
for standalone holdings. `--no-color`, `NO_COLOR` and `TERM=dumb` suppress ANSI;
JSONL is always ANSI-free. Quote-table colors and `tt live` are unchanged.
Step 5 R2 passed independent verification and was deployed and explicitly accepted
functionally and visually by the Principal on October 11, 2026. The ordinary
`ww sync account tt1` / `ww show positions --account tt1` journey displayed eight
actual holdings, with unsupported lifecycle/economic claims withheld. See
[delivery and recovery evidence](../design/pl-conv-01-step5-candidate.md).
The following Fidelity acceptance history remains applicable to its CSV path.
Historical acceptance examples retain their original compatibility spelling;
current usage prefers `ww positions`.

Implemented and Principal-accepted bounded slice, October 11, 2026. Principal explicitly reported **acceptance PASSED** after inspecting Account discovery, synchronization and Sawdust Position output. Automated verification and Principal acceptance are separate evidence; no independent review is claimed.

```sh
ww sync account pts
ww show positions --account pts --verbose
```

The CLI defaults to `http://localhost:3100` when no address is configured. The verified development instance uses port 3101 and durable backend database `data/positions-v2.sqlite3`, preserving the pre-existing service on 3100. Its address is now saved in the private repository configuration, so the accepted operator journey uses only:

```sh
ww ls accounts
ww sync account pts
ww show positions --account pts --verbose
```

Backend setup uses the existing Bearer configuration (`WHEELWRIGHT_V2_AUTH_TOKENS` / `wheelwright.v2.auth.tokens`) plus explicit account aliases (`WHEELWRIGHT_V2_ACCOUNTS` / `wheelwright.v2.accounts`, comma-separated `alias=brokerAccount`). Account bindings persist and cannot silently change. The backend generates persistent opaque `acct_` IDs. Required exact grants use those IDs: `account.read:ID`, `account.positions.read:ID`, `account.artifacts.read:ID`, and `account.artifacts.write:ID`. The CLI resolves friendly aliases through authorized `GET /v2/accounts` discovery; aliases are never accepted as REST IDs. Account metadata includes ID, alias, display name and broker association. Administrative backend alias renames preserve IDs, grants, artifacts and Position references. Binding a known alias to another broker account is rejected. Quote grants imply none of these. Never put actual credentials in command arguments or Git. `WW_API_TOKEN` follows explicit Wheelwright exports or the dedicated private `.ww.env`; brokerage `.env` is not read by ww.

Sync scans regular `.csv` files directly in `~/Downloads`, including Positions, Option Summary, History and Balances exports attributed to the selected backend account. Other CSVs/accounts are ignored. Positions and Option Summary contain broker identity; current History/Balances attribution relies on the original account-number filename and remains qualified. Broker download timestamps with an explicit ET zone determine submission order when supported; otherwise filesystem modification time is a visibly reported fallback. Exact duplicate contents are one artifact, independently of names. Files are read into invocation memory; no client database or manifest is written. A retained failed artifact can be retried even if its original local file has moved.

Artifacts retain exact bytes, BOM/line endings, SHA-256 and original byte count. Upload and processing-attempt metadata commit before semantic parsing. Rejected imports retain their source, preserve earlier evidence, stop sync and leave later work pending. Artifact list/detail/content and retained-processing retry are account authorized. Target-Account artifact write authority permits importing and retrying a mixed-account Positions file: the original remains private and only the target Account's rows are admitted. Other Accounts are neither created nor updated. Formats without supported row-level Account attribution retain the source but reject mixed-account processing. Retrieving complete original bytes separately requires artifact read grants for every source Account; unknown source Accounts deny retrieval. The authoritative machine-readable contract is the account-evidence fragment linked from the common v2 OAS.

Positions exports establish inventory; same contract/custody rows are additive. A Position defaults to observed account/contract/custody inventory. That identity is not a lifecycle cohort or evidence of continuity through full close/reopen. Explicit whole-holding associations may group multiple constituents through the operator-run backend `importPositions` utility (`positionAssociations` JSON); the association is snapshot-bound, independently records Program/authority, and cannot allocate one holding twice. No real grouping or Program association was invented for PTS. Partial quantity allocation remains outside this slice.

Position totals propagate missing values rather than displaying partial totals as complete. DTE is calendar days from the current New York date; negative DTE does not establish expiration execution. Own-underlying share sensitivity is shown for stocks/ETFs; option Greeks, incompatible aggregate delta, allocations and exit policy remain unknown. Adjusted contracts preserve their broker symbols and quantities without assuming deliverables. Same-day accepted Option Summary rows may supply bid/ask and exact-quantity per-option margin requirements with separate artifact/row provenance; strategy rows never count shares, establish Position identity or establish Program membership. Date-only quote evidence does not establish current executable prices. Market value, broker margin requirement and allocation remain different quantities. Working-order coverage is unknown because these exports do not report working orders; the display keeps it separate from holdings and close terms.

History processing retains exact observed rows with artifact/row lineage and matches identical row occurrences across overlapping exports, including within-export multiplicity. It never truncates prior observations. A changed row remains a distinct observation; corrections, economic transaction identity and lifecycle projection are not established. History coverage remains `UNKNOWN`, even after `SYNC COMPLETE`. Balances and Option Summary rows are preserved as admitted observations; no deployable-capital or autonomous recommendation claim follows.

The REST surface is independent of database ownership: `GET /v2/accounts`, `GET /v2/accounts/{accountId}`, `GET /v2/positions`, `GET/POST /v2/artifacts`, `GET /v2/artifacts/{artifactId}`, `GET /v2/artifacts/{artifactId}/content`, and `POST /v2/artifacts/{artifactId}/imports`. Read collections default to authorized scope; optional `accountId=ID` narrows it. Raw-CSV creation requires `accountId=ID` to identify its owner. Representations carry Account relationships. Artifact content and processing-attempt nesting describe that exact immutable source, not a foreign-key layout. Existing quote routes retain their subject-selected capability semantics. No standalone ledger or Account write REST API is added.

Migration 016 converts all retained account references and snapshot metadata to generated IDs without replacing source bytes, ledger observations, snapshot identities or constituent identities. A persisted immutable inventory namespace preserves legacy holding identities; mutable aliases never drive future identity or grants. Account creation/binding and rename remain backend administration, separate from these read endpoints.

Reproduction checks:

```sh
cd evidence-service-java
./gradlew test --tests 'com.wheelwright.evidence.v2.*' --tests 'com.wheelwright.evidence.db.*'
cd ..
node --test scripts/wheelwright.test.mjs scripts/ww-fetch.test.mjs scripts/ww-ls.test.mjs scripts/ww-show.test.mjs scripts/ww-show-query.test.mjs scripts/ww-positions.test.mjs scripts/ww-sync.test.mjs scripts/ww-accounts.test.mjs
```

The Java run creates `build/position-read-specimen.json`, consumed by the rendering test. Live verification on October 11 retained and processed 244 PTS source artifacts, verified exact content-retrieval hashes/lengths for all 244 before the stricter source-scope boundary, demonstrated a zero-upload second sync, and rendered 25 Positions from the latest October 11 export. Full actual terminal output and live logs are local ignored artifacts under `evidence-service-java/build/` (`pts-positions-actual.txt`, `pts-sync-idempotent.txt`); original account bytes reside in the ignored backend database rather than Git. These observations establish executable behavior, not independent review or Principal acceptance.

Final identity/security verification preserves all 244 original BLOBs exactly against the pre-migration backup. Canonical REST content retrieval verifies 242 original files against Downloads; two older multi-account CSVs contain additional unregistered accounts and correctly return 403 under the current PTS/Sawdust grants. Their originals remain retained; original-file retrieval requires configuring and authorizing every source account. This does not expand Position-read scope or obscure sync/history status.

Principal-selected target-only import correction: Sawdust synchronization now
processes all 71 discovered exports, including older mixed-account Positions
files, without additional Account grants. A retained September 28 failure was
retried without reupload after accepting Fidelity's download footer both with
and without `at`. Repeat Sawdust sync uploads/processes zero files and reports
no pending work. The October 11 snapshot renders seven Sawdust Positions; PTS
still renders 25. All 315 retained artifacts pass payload/hash verification,
the previous 244 artifacts are unchanged, and User identities/grants are
unchanged. Live retrieval of the mixed July 10 original still returns 403.
Logs and actual output are retained under ignored `evidence-service-java/build/`
as `sawdust-sync-actual.txt`, `sawdust-sync-resumed.txt`,
`sawdust-sync-idempotent.txt` and `sawdust-positions-actual.txt`.


User identity/security amendment: Bearer credentials resolve to persistent backend-generated `usr_` User IDs, independent of the `acct_` IDs. Server-only bootstrap configuration remains `token=userId-or-registration-subject:permissions`; a first registration subject creates one persisted User, and later credentials may reference its canonical ID. Registration subjects are not REST aliases, Account IDs or identity derived from Account ownership. No raw credential is stored in the User tables or returned by the identity routes. Use private environment configuration, never shell arguments or Git.

Configured capabilities are admitted to backend User state. Multiple configured credentials for one User share the union of that User’s explicitly configured capabilities; startup replaces permissions for configured Users rather than accumulating old grants. Subsequent backend revocation affects the next authenticated request. Four fixed User–Account flags implement metadata read, Position read, artifact read and artifact write with many-to-many relationships. Existing quote grants are persisted User capabilities. No client filter or known resource ID adds access.

`GET /v2/me` returns the authenticated User with ID, display name, explicit administrator flag and Account capabilities. `GET /v2/users` and `GET /v2/users/{userId}` require `users.admin`, explicitly granted by backend configuration/state; that capability does not imply Account evidence permissions. A User named admin is unprivileged unless explicitly granted. Account aliases remain CLI discovery conveniences. There are no User create/update/delete endpoints. User IDs survive Account renames, credential rotation and backend restart.

User amendment verification: 246 backend v2/database tests and 87 relevant CLI tests pass. Live `/v2/me` returns the persisted non-admin User with two explicit Account relationships; `/v2/users` denies discovery with 403. The existing commands still yield zero uploads and 25 Positions. User migration preserves exact original bytes, all snapshots/constituent identities and retained history. Administrator-only list/detail routes are verified with persisted backend Users in HTTP tests, without granting administrator privilege to the live operator implicitly.


## PL-CONV-01 Step 3 accepted delivery — October 11, 2026

The accepted implementation persists brokerage association independently of the native
reference. Backend private bootstrap accepts `alias=FIDELITY:reference` and
`alias=TASTYTRADE:reference`; existing `alias=reference` remains Fidelity.
References retain exact case and leading zeros. Registration is idempotent by
brokerage/reference pair. Nicknames are globally unique backend metadata; stale
bootstrap names do not undo persisted renames. This adds no registration API.

Ordinary Account tables and redirected TSV mask native numbers (BUG-035).
Short or malformed values expose no suffix. Explicit JSONL and existing API
payloads are unchanged; permanent full-number disclosure policy remains open.
For tastytrade Accounts, `ww sync account <nickname>` explains that Fidelity
CSV synchronization is the only supported capability before scanning Downloads.
Backend processing independently rejects non-Fidelity admission after retaining
source bytes. No tastytrade Position evidence support is claimed.

Migration 018 preserves canonical Account IDs, inventory namespaces, grants and
all existing evidence/snapshots while replacing native-reference global uniqueness
with `(broker, broker_account)` uniqueness. Fidelity source-scope lookup is
explicitly Fidelity-qualified and preserves BUG-036 fail-closed disclosure.

The Principal accepted the operational delivery after ordinary installed CLI tests
without connection overrides. Fidelity pts/sawdust and tastytrade tt1 are
authorized and discoverable; BUG-035 is Resolved. See
[`pl-conv-01-step3-candidate.md`](../design/pl-conv-01-step3-candidate.md) for
frozen identity, independent verification, deployment/recovery and Operator acceptance.

Command grammar: `ww positions` is canonical. `ww show positions` remains a
fully functional compatibility alias with the same options, output and exit codes.
