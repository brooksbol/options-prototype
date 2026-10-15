# WW transaction-history implementation candidate

**Principal acceptance-path rejection:** The isolated preview is insufficient for Product acceptance. The required gate is the installed, real-evidence workflow `ww pull && ww history`. Checkpoint dc19cdd remains component implementation/author-test evidence only; it is not end-to-end acceptance-ready. See the current PL-CLI-01 reconciliation below.

October 15, 2026. Engineering implementation and author verification complete; **independent review, Principal Product acceptance and deployment are not claimed**. Existing PL-CLI-01 scope; approved design/checkpoint remains unchanged.

## Operator preview

The isolated launcher arranges the backend, disposable database, synthetic local provider and credentials. It never uses the operational service or brokerage credentials. From the candidate checkout:

```sh
node scripts/ww-history-preview.mjs
node scripts/ww-history-preview.mjs history --account tt1
node scripts/ww-history-preview.mjs history --account pts --verbose
node scripts/ww-history-preview.mjs history --csv
node scripts/ww-history-preview.mjs history --jsonl
node scripts/ww-history-preview.mjs history --man
node scripts/ww-history-preview.mjs pull --help
node scripts/ww-history-preview.mjs pull --man
```

Each launch uses new synthetic state and cleans up afterward. These are ordinary Product commands passed to an engineer-arranged isolated candidate; no environment variables, service URLs, GUIDs, configuration edits or manual backend wiring are required. Initial Java build can take longer than subsequent launches. Operational `ww` is unchanged. Pull help/manual are implemented; pull execution and broader sync/fetch work remain deferred.

Actual synthetic captures: [21-row terminal](tt1-terminal.txt), [PTY color capture](tt1-terminal.ansi.txt), [Fidelity verbose](pts-verbose.txt), [combined CSV](history.csv), [combined JSONL](history.jsonl). These contain invented evidence only, not private transactions. PTY captures normalize CRLF to LF; CSV retains its emitted CRLF bytes. They demonstrate running software, not independent or Principal visual acceptance.

## Implementation and reuse

- Reuse backend Account discovery, Model A User–Account grants, original artifact retention, existing Fidelity activity-row observations, exact JSON/decimal handling, existing tastytrade OAuth/HTTP safeguards and CLI presentation/serialization conventions.
- Add Account-nested list/detail; one `account.transactions.read:ID` grant covers the facade including policy-bounded read-through. `account.read:ID` supports nickname discovery. No global transaction resource or financial admin bypass.
- Add a retained projection with immutable transaction UUIDs, source-scoped identity, successive observation links, original hashes/row provenance and same-Account reversal resolution. Changed observations remain retained, including A→B→A. Missing rows do not delete older observations. The facade does not assert a coherent upstream snapshot.
- tastytrade backend calls `/accounts/{brokerAccount}/transactions` with `per-page=250`, ascending sort, page offsets and one fixed `end-at`, without transaction-type/symbol/date-lower-bound filters. One OAuth exchange and shared ten-second upstream deadline, at most 100 pages / 25,000 records / 16 MiB per traversal. Secret-bearing responses are excluded before retention. Safe pages are retained before semantic admission. Failed/inconsistent scans preserve the last admitted result; admission is atomic. Output is bounded to 25,000 retained rows and 16 MiB, with explicit failure rather than truncation.
- Production constructor fixes tastytrade's existing API base. Local fake-provider constructor is package-private and test-only. `wheelwright.history.read-through-enabled` defaults to false; `wheelwright.history.reuse-seconds` defaults to 300 (bounded 0–86,400). Enabling production source access/configuration/grants remains an operational authorization matter. No separate `ww fetch` or CLI provider pagination/ledger.
- Migration 020 adds the history tables and an explicit history-read boolean defaulting false. Disposable databases verified the migration; **no operational DB was migrated and no operational grant changed**.
- No strategy reconstruction, calculated trading P/L, tax accounting or performance interpretation. Preserve exact signed cash and reported fee components, missing fields, currency and original source facts. Current tastytrade mapping leaves multiplier/settlement unavailable rather than assuming them.

## Additive Product clarifications

[Principal update contracts](../../cli/ww-update-product-clarifications-2026-10-15.md) authorize the history default: no Account selector discovers authorized Account metadata and composes separate nested reads. Each read rechecks backend history authority; a denied/unavailable Account remains an explicit diagnostic and nonzero aggregate status. Successful independent records survive. CSV has one header; every machine record carries Account identity and its own history clocks. Empty authorized scope is successful. No client business logic or global collection.

Fidelity reads existing admitted activity rows without acquisition/import. Stable UUIDs identify retained row equivalence and occurrence; they do **not** establish broker event identity or correction/reversal relationships. Different correction-shaped rows remain distinct observations, not silently merged. Brokerage transaction ID and currency are unknown in the current mapping; `Amount ($)` does not alone certify ISO currency. Raw quantity, price, commission, fees and net amount remain exact strings without inventing missing fields. Import time is separate from unknown brokerage freshness. All available normalized retained rows may be delivered completely while lifetime coverage remains unknown. This bounded representation is neither a new Fidelity reconciliation engine nor a claim of tastytrade-equivalent source quality.

History help/man and root help/man describe the candidate. At the Principal's explicit follow-up, pull help/man preserve **ww pull — Update WW with everything so I can start doing stuff.** Bare pull performs no update and reports that execution is unimplemented. Other commands retain accepted behavior.

## Author verification

| Check | Result |
|---|---|
| Full backend Gradle suite | 835 tests: 833 passed, two opt-in skips; zero failures/errors. Final exact-numeric-wire parser change then passed all 172 v2 tests (171 pass, one opt-in skip). |
| History tests with private reference enabled | All nine passed, including all 21 CSV rows; exact original hash checked without archiving private bytes or account-bearing filename. CSV-to-fake-API fixture checks normalization, **not live API equivalence**. |
| Full WW CLI suite | 115 passed, zero failures. |
| Actual HTTP and real CLI | 11 list/detail/auth/validation/not-found specimens; eight CLI invocations; 23 records across two synthetic Accounts; exact export/provenance/identity checks; no global route. |
| OAS | Account OAS 3.1 and all 11 actual HTTP specimens validated. Corrected the reused Account `Problem404` reference to existing common read-Problem schema, which includes NOT_FOUND; generic acquisition Problem excluded it. No wire status or common quote contract changed. |
| Actual PTY | Default 21-row table; cyan alias, red tastytrade, bright white baseline, yellow symbols/orange prices, neutral cash and alternating dark backgrounds. Captures are not Principal visual acceptance. |
| Documentation integrity | 58 projection integrity/freshness checks passed; generated projection is synchronized. |
| Scope/immutability | Approved proposal and specimens unchanged; no operational service/configuration/DB/grant changes or live account acquisition. |

Backend tests cover pagination, duplicate/changed metadata, capacity declaration, invalid cash effects, source attribution, secret exclusion, disabled/reused/empty sources, persistent identity/restart, final-page failure with retained evidence, concurrent reads, exact numeric JSON prices/amounts beyond floating-point precision, change/reversal links, A→B→A observations, exact Fidelity amounts/duplicates/sparse columns and no Fidelity acquisition, unauthorized/admin/holdings bypasses and Account-local instance lookup. CLI checks cover grammar, strict response validation, all formats, colors/opt-outs, aggregation, independent failures and manuals. Existing selected-Account sync and explicit fetch tests remain green.

Reproduction scripts: `scripts/ww-history-http-validation.mjs READY_FILE OUTPUT_DIRECTORY` against the test-only `transactionHistoryPreview` Gradle task; `scripts/ww-history-oas-validation.py HTTP_SAMPLES_JSON` using engineer-local jsonschema/openapi-spec-validator/PyYAML. No dependency was added to production for these checks. Source/CLI fixtures copy the additive module in isolated existing command tests. Legacy-migration rehearsal now removes new history tables/migration when reconstructing its pre-migration specimen; assertions remain intact.

## Remaining gates and limits

Independent review and Principal functional/visual acceptance remain. Deployment, operational migration/grants/configuration and live tastytrade acquisition remain separately unauthorized. Provider transaction fields and actual TT1 coverage were not live-verified. Full traversal does not establish lifetime completeness, source consistency or real-time freshness. Oversized histories fail explicitly; public cursors/checkpoints/async work are deferred. Raw tastytrade transaction content retrieval remains fail-closed under existing artifact-scope detection rather than expanding raw disclosure authority. Broader bare sync/default-selection/fetch/pull implementation and EVA remain outside this candidate.
