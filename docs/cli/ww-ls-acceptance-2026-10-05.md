# Held canonical quote inventory — verification and manual acceptance, October 5, 2026

Authority is the frozen `cccb5a565e433f29436bd090848740e39f803d6d`
[held-read contract](../contracts/api-v2-held-quotes-read.md) and existing v2 OAS.
The Principal authorized Codex to implement this entire bounded vertical slice,
overriding the earlier implementation-actor default for this task only. Bootstrap:
clean `main`, HEAD cccb5a5, origin/main 2982eb803205fb0121569307f374d81bb5e70b79;
one local unpushed specification commit. One implementation commit authorized;
no push, runtime grant migration, server restart or live acquisition authorized.

The initial sections below record automated implementation evidence as of
20dc5e8. The subsequent manual acceptance and operational follow-through are
recorded in the final section; they do not imply independent multi-actor review.

## Implementation mechanics

GET has its own controller depending only on store, Bearer authentication and JSON
serialization. `quote.read` is checked independently before validation/enumeration.
Accepted POST controller/service/source/policy code is untouched. No credential
configuration is changed or existing identity automatically granted read authority.

Enumeration selects only seven discovery columns from `direct_quote`, ordered by
symbol BINARY, using an independent SQLite connection opened file-read-only and
query-only. It never migrates, joins membership, parses facts, consults acquisition
policy, or contacts providers. In-memory stores use a unique named shared-memory
URI so the reader remains separate from the writer; query-only prevents mutations.
No storage migration or global writer-lock refactor is needed.

The reader cannot join another thread's writer transaction. Real WAL-file tests
prove uncommitted successor/new-subject exclusion, rollback preservation, committed
replacement visibility, complete row tuples during 150 concurrent replacements,
transient insert/remove and continuously held subject inclusion. SQLite may give
the statement a stronger consistent cut; the public contract continues to promise
only its narrow committed-item guarantees, with no snapshot token/batch cut.

All rows are materialized, required discovery fields validated and the entire JSON
response serialized before success. Start-unavailable is 503; enumeration/mapping
failure is request-wide 500, never empty/partial. Omitted facts are not parsed.
Receipt/commit timestamp spelling and precision are preserved; neither is source
market-event time. Security vocabulary and required fields follow the frozen OAS.

CLI sends one authenticated GET without retries/redirects/fallbacks. It reuses the
accepted credential loader and transport conventions. Human discovery table,
headerless five-cell TSV and explicit summary JSONL follow the frozen contract.
Verbose adds human ID/commit columns and stderr origin/request/count; machine
records stay unchanged. Empty/0, failures/1, usage/config/2 and clean EPIPE are
covered. Usage/help precede credential loading. Controls are escaped, diagnostics
redacted, and raw transport exceptions suppressed. The manual is registered.

## Focused verification

```sh
cd evidence-service-java
JAVA_HOME=$(/usr/libexec/java_home -v 21) ./gradlew test \
  --tests '*HeldQuotesControllerTest' --tests '*HeldDirectQuoteStoreTest' \
  --tests '*V2QuotesControllerTest' --tests '*DirectQuoteServiceTest' --console=plain
cd ..
node --test scripts/ww-ls.test.mjs scripts/ww-fetch.test.mjs scripts/wheelwright.test.mjs
node scripts/ww-fetch.acceptance.mjs
# Python environment with PyYAML and jsonschema, as used for OAS verification:
python scripts/ww-ls-oas-validation.py
node options-prototype/scripts/generate-roadmap-projection.mjs --check
```

Results: **71 Java tests passed** (8 held HTTP, 3 real-store consistency, 30 accepted
POST HTTP, 30 acquisition service); **28 Node tests passed** (9 ls, 14 fetch, 5
existing porcelain); **10 existing fetch black-box acceptance specimens passed**.
No failed/skipped tests in the final focused runs. Real HTTP response specimens
from the held controller validate against the frozen GET response schemas,
including 200/401/403/422/500/503, empty/nonempty inventory, order and exact bounded
summary fields. The Python script prints the specimen count for the current run.
OAS 3.1 specification validation also passed. Existing compiler/deprecation/JVM
warnings are unrelated to this slice; no full suite or BUG-028 work was performed.

## LQ01–LQ28 evidence mapping

| Criteria | Evidence |
|---|---|
| LQ01–02,05,28 | Real empty/unenrolled old SANDBOX holding; original clocks and ID; malformed omitted facts deliberately stored; full GET succeeds |
| LQ03,08 | Legacy chain/calendar, monitored and demand fixtures excluded; every non-quote SQL table compared unchanged; worker and provider doubles have zero GET interactions |
| LQ04 | Legitimate failed POST retains prior; GET returns original ID and does not reattempt; spies cleared at causal GET boundary |
| LQ06,24 | Suspended authority and unavailable source do not block GET; source acquisition and provider quote/chain/calendar/index methods fail immediately if called; all source/worker/adapter interactions asserted absent after each GET specimen |
| LQ07,13,27 | Successor replaces prior; one current observation per symbol; reverse-inserted 37-item inventory fully ordered; If-None-Match does not produce ETag/304; private,no-store |
| LQ09–10 | SQL exception, failure after first item, malformed UUID/type/provider/environment/receipt/commit/symbol: entire-request problem, no items; missing real table fails enumeration |
| LQ11–12 | Read-only identity succeeds; acquire-only/force-only fail 403; missing/invalid credential fails 401 with Bearer challenge; auth precedes query validation |
| LQ14 | Independent real-WAL reader during uncommitted writer transaction/rollback/commit and concurrent replacements/transient symbols; complete committed tuples and stable holdings |
| LQ15–18 | Black-box PTY ordinary/verbose table, redirected five-field TSV, explicit JSONL on terminal/redirected, flags and original timestamps; C0/DEL/backslash escaping |
| LQ19–20 | Empty all modes; no bytes machine, exact terminal message; bare ls/other family/operand/quiet/filter/help mixtures exit 2 before HTTP; all help/man forms succeed without HTTP; unreadable credential fixture proves early usage rejection |
| LQ21–22 | 401/403/422/500/503, invalid/truncated JSON, malformed/order/correlation data and redirects fail 1 with no records; echoed credentials/ESC and transport secrets suppressed; missing/private .env credentials tested |
| LQ23 | 10,000 holdings piped to head -1 with pipefail: exit 0, one line, no stderr/stack trace and exactly one GET |
| LQ25–26 | Repeated/unknown/empty query names, body, invalid/multiple IDs fail 422; blank/absent ID generates UUID, supplied trimmed mixed-case ID echoed; auth/store unavailability503, safe problem correlation |

CLI fixture rejects any POST, v1 or follow-up route, and accepts only bodyless GET
/v2/quotes. Backend tests run full Spring HTTP wiring with provider/source/worker
spies, real SQLite and fail-fast contact stubs; no live provider involved. These
prove zero causal read-triggered contact rather than inferring it from source.

## Composition friction

Correctness and adapter requirement are separate: CF02 cut; CF03 categorical awk;
CF04 environment count using sort/uniq; CF05 rg; CF06 tee; CF07 large-stream head;
CF08 substitution; CF09 redirection; CF11 explicit JSONL consumed by jq; CF12 no
new generic ww text utility — all passed, **no adapter required**. Numeric-price
CF01 and CF03 calculation are N/A: discovery promises no price. CF10 presence/
absence is preserved by empty inventory and legacy exclusion; no invented value.
JSONL is the selected explicit serialization, not the default TSV adapter.

## Preservation and disposition

Frozen held contract and OAS are byte-for-byte unchanged from cccb5a5. Accepted
POST implementation files and direct-quote writer are unchanged; the sole shared
storage bootstrap adjustment is the private shared-memory name for separate test
readers, with existing POST/service regression tests green. Accepted fetch runtime
functions are unchanged and its focused unit/black-box tests pass. Bare fetch,
BUG-028, provider/scheduler policy, memberships, migrations and runtime grants are
untouched. No material new Product/architecture decision or contract contradiction
was found. Implementation is locally ready for manual acceptance; no push.


## Principal manual acceptance and closeout — October 5

The Principal explicitly reported **“manual acceptance PASS for ww ls quotes”**
and invoked the containing end-of-session protocol. The accepted vertical slice
is implementation commit `20dc5e80f8d9fd539a7c43649d2dba1aa6e87fea` over frozen
specification cccb5a5, with the subsequently authorized CLI/help follow-ups.

Operational follow-through was separately authorized: add explicit quote.read to
the existing local CLI principal in private root .env, preserving quote.acquire
and quote.force. The Principal restarted the backend. Authenticated GET/CLI then
succeeded; credentials/file permissions were preserved and the private file stays
Git-ignored. This is an explicit local grant, not implication from acquisition
permissions, new authentication mechanics, or an operational migration of others.

The Principal's live shell specimen submitted 100 named stocks in four explicit
fetch batches (30/30/30/10). Ninety-nine were newly acquired; PBR.A was UNMATCHED.
Fetch correctly failed that batch, xargs completed remaining batches and returned
nonzero, and && therefore skipped ls. A separate verbose ls showed **103 sorted
holdings**, including the 99 new observations and prior SPX/SPY/XLE/XLF with
original receipt/commit clocks. No PBR.A holding was synthesized. A semicolon
can run discovery after a failed fetch; no fetch outcome or exit semantics changed.
This explicit file-driven fetch does not define the deferred bare-fetch universe.

Default redirected TSV was manually demonstrated with /tmp/quotes.tsv. The
Principal subsequently authorized an **accepted no-op --tsv** spelling; canonical
PL-CLI-01 records this CLI-only amendment to the frozen baseline. The flag retains
TTY tables, default redirected five-field TSV and --jsonl precedence, accepts
repetition, and changes no HTTP/OAS behavior. Live checks verified all three
presentations over 103 holdings. Help/man enumerate long/short flags, standalone
help/man and current read authentication; the stale fetch-manual no-read statement
is removed. Original frozen contract/OAS and backend POST/fetch behavior stay intact.

Coming Soon and broader PL-CLI-01/PL-API-03 scope need no horizon or graduation
change. show, bare fetch and PBR.A provider-notation investigation remain outside
this closed slice. BUG-028 and unrelated SLO work remain untouched. Required
projection regeneration/freshness and focused closeout verification accompany
persistence; final accepted-main synchronization is reported by the closeout actor.


## Bounded client-side `--type` amendment — October 5

The Principal explicitly authorized Codex to implement this selector against the
accepted baseline `711d4939cb836fa2d9d51bad4900cd03d65bde24`, with local commit and
no push. Bootstrap found clean matching main/origin after fetch; Gate Experiment
001 remains staged/inactive. The automated implementation evidence below was
followed by Principal acceptance PASS, recorded in the closeout section. No
independent actor review is claimed.

`--type TYPE` accepts exactly EQUITY, ETF, INDEX, OTHER, repeatable with OR
semantics and harmless duplicates. No normalization/aliases are accepted. Usage
errors exit 2 before credential loading/HTTP. The full wire collection is still
validated before presentation maps OTHER_UNDERLYING to OTHER and selects rows.
This mapping applies to unselected discovery output too, including JSONL; the
wire OAS/parser vocabulary is unchanged. Symbol order and table/TSV/JSONL shapes
are preserved; verbose counts selected rows. Zero matches exit 0 with the exact
terminal sentence `No canonical direct quotes match the selected types.` and
zero TSV/JSONL records. Unselected empty inventory retains its original message.

| Task criteria | Focused automated evidence in scripts/ww-ls.test.mjs |
|---|---|
| A | Original LQ15–23/Unix/private-credential fixtures retained; mixed full inventory without selectors |
| B–E, L | Mixed ordered AAPL/EQUITY, BTC/OTHER_UNDERLYING, QQQ/ETF, SPX/INDEX, SPY/ETF; each public type, OR and duplicate equality; exact selected objects/order |
| F–I | Missing/empty, BOND, etf, OTHER_UNDERLYING, missing second value and help mixtures exit 2, no HTTP/no records; unreadable private .env proves rejection before credential loading |
| J | Nonempty inventory without matching type and empty inventory; PTY exact sentence, zero redirected TSV/JSONL bytes, exit 0; verbose zero count |
| K | ETF/OTHER in ordinary/verbose PTY tables, default/explicit-no-op TSV and terminal/redirected JSONL; exact fields and selected counts |
| M | Matching valid ETF plus excluded EQUITY with null observation ID or malformed commit clock, and invalid wire type; exit 1/no records in table/verbose/JSONL; excluded out-of-order subject also fails |
| N | Each valid selector invocation asserts exactly one authenticated bodyless GET /v2/quotes, exact path with no query; fixture rejects other routes/methods |
| O | Original validation/correlation/transport/escaping tests retained; authenticated errors and echoed-secret suppression checked with/without selector; 10,000-row selected and unselected head pipelines exit cleanly |

Verification commands are the focused commands above, plus `node --check
scripts/wheelwright.mjs`, OAS 3.1 validation via openapi-spec-validator, and
`npm run generate:roadmap-projection` / `npm run check:roadmap-projection` from
options-prototype. Results: **33 Node tests passed**, **10 fetch black-box
specimens passed**. Focused Gradle verification succeeded with inputs up-to-date;
the unchanged 71 Java specimens report zero failures/errors/skips. **62 real HTTP
specimens** still validate against the unchanged GET OAS; OAS specification
validation passed. Python validation used an isolated /tmp environment because
system Python lacked PyYAML. No live provider, server restart or credential write.

Final preservation review: backend/auth/persistence and OAS are byte-identical to
the bootstrap baseline; CLI HTTP reader/validator, fetch runtime and other command
branches are unchanged. Only bounded ls parsing/presentation/help and associated
tests/manual/contract/evidence/project-state reconciliation change. BUG-028 is
untouched. Projection is regenerated from the canonical PL-CLI-01 amendment and
freshness verified; no strategy, horizon or broader capability graduation follows.
Local persistence is authorized; no push is authorized.


## Principal selector acceptance and end-of-session closeout

The Principal reported **“acceptance PASSED; execute end of session protocol”**
for implementation commit `9b4b8a1de5a665c74d7460d44159df99759ba5d9`.
Immediately preceding acceptance, the Principal supplied this live composition
specimen:

```sh
shasum -a 256 <(ww ls quotes --type ETF --type INDEX) <(ww ls quotes | awk -F '\t' '$2 == "ETF" || $2 == "INDEX"')
```

Both streams hashed to
`4d906a8e60662d8c48c910480b369eeb9ab7bb00319e15e66ccf1dabd863d635`.
This is Principal-supplied evidence of byte-for-byte equivalence between the OR
selector and external filtering of complete default TSV, including row order.
It complements the automated A–O specimens; it does not independently prove
all negative cases or authorize another capability.

Closeout began with a clean main one commit ahead of remotely refreshed origin,
which remains `711d4939cb836fa2d9d51bad4900cd03d65bde24`. Acceptance is reconciled
under PL-CLI-01 and journal why-state; broader backlog, Coming Soon, strategy and
architecture remain unchanged. Roadmap is regenerated from canonical authority
and checked for freshness. No runtime, backend/OAS, persistence, credentials,
BUG-028 or other resource family is changed during closeout. The explicit local
commit/no-push task restriction remains in force; accepted local main and remote
main are reported separately in the final handoff.


**Current closeout verification:** 33/33 focused Node tests passed again with zero failures/skips; syntax and diff checks passed. Roadmap projection was regenerated from the updated canonical acceptance state and freshness passed. Closeout changes only acceptance evidence, canonical PL-CLI-01 state, journal and derived projection; no runtime or unrelated changes. Local commit persists the accepted handoff without pushing.
