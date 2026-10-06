# Subject-first held-quote show — implementation verification, October 5, 2026

Status: bounded implementation verified by focused automated acceptance; Principal manual acceptance / independent review pending. Authority: unchanged [frozen Product contract](../contracts/api-v2-subject-show-held-quote.md), [accepted Solution Design](../design/ww-show-held-quote-solution-design.md) and [accepted path-codec reconciliation](../design/ww-show-held-quote-transport-reconciliation.md). The Principal explicitly authorized Codex implementation, preservation gate first, and bounded commit/push after passing acceptance. Baseline main/origin/main: `4ff8c7a3d0a8f69330ee4ba1aa55c6d08e07c137`. Useful pre-handoff uncommitted design and BUG-030 evidence were preserved; no unrelated concurrent changes were discarded.

## Preservation gate and causal boundaries

The real installed Tomcat/Spring container with the actual HeldQuotesController and GovernedDecisionController passes `HeldQuoteCodecTransportTest`. The gate first ran before the remaining slice, then passed again against the completed authenticated endpoint and complete observation fixtures. No application connector configuration changed: encoded-solidus handling remains `reject`.

| Request / condition | Proved outcome |
|---|---|
| `/v2/quotes/SPY` | Canonical SPY |
| `/v2/quotes/BRK_2FB` | Canonical BRK/B, decoded once |
| `/v2/quotes/BRK_5F2FB` | Literal canonical BRK_2FB; no escape rescan |
| `/v2/quotes/_5ESPX` | Canonical ^SPX |
| Encoded dot/repeated-slash identity components | Remain symbol data in the intended quote route |
| Incomplete, lowercase, unknown, unnecessary escapes / invalid identity | Authenticated 422; no holding lookup |
| Raw `/v2/quotes/BRK%2FB` | Container rejection, unchanged policy |
| Double percent encoding | Rejected, not a workaround |
| Existing `/api/governed-decision/A%2FB` | Container 400; zero controller/storage dispatch |
| Existing legacy literal underscore ID | Same interpretation; no quote codec applied |
| Collection authentication / unsupported query | Existing authorization and 422 behavior preserved |

`PathSymbolCodecTest` and the Node codec tests each exercise all 46,521 one-to-three-character identities over the accepted alphabet, 10,000 generated longer identities and maximum expansion. Tests prove both canonical round trips, injectivity/collision avoidance, exact-once decoding and malformed/noncanonical token rejection. URI escaping is separate from the codec. No rejected query endpoint exists.

Controller construction is limited to store/auth/serialization. The store opens an independent read-only (file) / query-only connection and issues one prepared SELECT of all 13 columns, closing it after materialization. There is no provider/source/worker, acquisition service, reuse policy, membership or legacy join in this path. Fail-fast provider/source/worker spies verify zero interactions. Tests compare stored rows before/after success and error reads. No schema migration, repair, acquisition, credential/grant migration or service restart is performed.

## Backend acceptance

| Layer | Evidence |
|---|---|
| Strict persisted decoder | Required identity/provenance, enums, calendar/date-time, JSON primitive types and present optional facts validated; explicit null rejected where omission is required; price-bearing predicate enforced. Duplicate keys, trailing JSON, invalid sizes/numbers and malformed source timestamps fail without defaults/coercion/drop/repair. Exact decimal and large integer values preserved. SQLite dynamic storage classes are checked before text binding; a BLOB holding syntactically valid JSON fails rather than being coerced into apparently valid text. |
| Instance controller | 200 complete canonical QuoteObservation; independent quote.read; 401/403; 404 NOT_FOUND no canonical holding; 422 invalid request/path; 500 INTERNAL_ERROR malformed full representation; 503 unavailable read/auth capability. Safe diagnostics, UUID correlation distinct from observation ID, private/no-store and no ETag. |
| Holding semantics | Old, unenrolled, CLOSED/non-reusable prior holdings remain readable; legacy chain-only subject remains 404; read does not turn absent/corrupt into another evidence family. |
| Real SQLite/WAL | Uncommitted successor excluded; rollback invisible; committed successor visible; 200 concurrent full-column replacements yield exactly one complete row version, never mixed facts/provenance. Opening/unavailable and after-open integrity failure remain distinct. |
| OAS | Additive `/v2/quotes/{symbol}` GET, EncodedQuoteSymbol and bounded held-read Problem schema. All seven status responses validated using 25 actual controller specimens. Existing POST, collection GET and every existing schema compare equal to baseline. 62 existing collection specimens still validate. |

BUG-029 is intentionally not fixed. A held observation with `sourceEventAt: "asksize"` or `"prevclose"` fails full decoding even if a caller asks only for last or bid. Valid acceptance fixtures are synthetic canonical observations; deliberately malformed fixtures prove rejection. Nothing repairs operator persistence.

## CLI, public fields and composition acceptance

The authoritative `scripts/ww-show-fields.mjs` registry defines all 36 accepted camelCase public names, canonical extractors, headings, descriptions, durable semantic metadata and formatting kinds. `--only` validation/projection and `--fields` catalog derive from that same registry. `scripts/ww-show-man.mjs` generates/checks the semantic field block in [ww-show(1)](ww-show-man.txt), including units, source/evidence identity, temporal meaning and missing-value caveats. The test compares registry names/order exactly with the frozen contract; no independent runtime catalog exists. Registry changes without manual regeneration fail the freshness check.

The CLI uses a bounded strict JSON reader retaining numeric source lexemes. Complete response validation precedes projection; malformed/truncated/duplicate-key data, invalid status/media/correlation/Problem shape and subject mismatch yield no success record. Known schema fields alone are rebuilt into the public nested JSONL view; arbitrary additive backend/internal state is not dumped. Machine values are not rounded through Number. OTHER_UNDERLYING maps to OTHER in show; the previously authorized public fetch-presentation mapping is covered separately, without modifying acquisition evidence or fetch request semantics.

Tests prove:

- Bare subject / --quote equivalence; ordinary options before/after subjects; uppercase normalization, first-occurrence deduplication and ordered output beyond 30 subjects.
- One bodyless authenticated instance GET per distinct subject, safe path-segment encoding, no redirects/retries/fallbacks, safe credential-suppressed diagnostics. HTTP count is this implementation's realization, not a Product constraint.
- Independent success/absence/corruption, stderr diagnostics per failed subject, aggregate exit 1, and intentional partial stdout consumed before the later failure.
- Exact nine-column human default, one header, missing `-`, reported percentage-point CHANGE without substitution; local receipt time and DST transitions; full-fraction local verbose times.
- Headerless same-order TSV, exact canonical timestamp/numeric values and empty missing cells including trailing cells; genuine zero and empty source strings remain values. Control characters/backslashes use documented cell escapes.
- JSONL one complete public canonical successful observation per line, with no alternate failure records; all optionality follows schema, no fabricated null/zero/empty substitutes.
- Exact --only order (including explicitly repeated fields), no injected symbol, comma-argument parsing; malformed/empty/unknown projection, contradictory --verbose/--jsonl and invalid subjects fail exit 2 before credentials/HTTP.
- --fields and help/manual work without credentials, HTTP, evidence or providers; field discovery is local and derived. Verbose remains subject-identified FIELD/VALUE tables, without clipping or losing public fields.
- Auth/backend/transport/response failures exit 1, usage/configuration errors exit 2, every distinct success exit 0. Shell awk/head composition, injected output-write failure exit 1 and accepted clean EPIPE behavior remain intact.
- Existing fetch, ls quotes, --type and other CLI regressions pass; isolated-install tests package the new imported modules rather than changing existing command semantics.

## Verification commands and results

Java 21 focused suite: **81 tests, zero failures/errors** (10 new API/store/codec/decoder/transport tests and 71 accepted collection/POST/store/service regressions):

```sh
JAVA_HOME=$(/usr/libexec/java_home -v 21) evidence-service-java/gradlew -p evidence-service-java test \
  --tests '*PathSymbolCodecTest' --tests '*HeldQuoteCodecTransportTest' \
  --tests '*StrictHeldQuoteDecoderTest' --tests '*HeldQuoteDetailControllerTest' \
  --tests '*HeldQuoteDetailStoreTest' --tests '*HeldQuotesControllerTest' \
  --tests '*HeldDirectQuoteStoreTest' --tests '*V2QuotesControllerTest' \
  --tests '*DirectQuoteServiceTest' --console=plain
```

Node focused suite: **48/48 pass**, including real pseudo-terminal, deterministic local HTTP fixture and shell processes:

```sh
node --test scripts/ww-show.test.mjs scripts/ww-ls.test.mjs \
  scripts/ww-fetch.test.mjs scripts/wheelwright.test.mjs
node scripts/ww-fetch.acceptance.mjs
```

Fetch deterministic acceptance remains **10/10**, with zero legacy-chain requests. Local fixtures are not market acquisition. Python validation uses an isolated temporary environment with PyYAML/jsonschema/openapi-spec-validator:

```sh
python scripts/ww-show-oas-validation.py
python scripts/ww-ls-oas-validation.py
node scripts/ww-show-man.mjs --check
npm --prefix options-prototype run generate:roadmap-projection
npm --prefix options-prototype run check:roadmap-projection
git diff --check
```

All pass. Full-build performance work/full unrelated test expansion is intentionally not undertaken; BUG-028 remains out of scope.

## Preserved rejected-design reproduction and open work

BUG-030's defect record and original `HeldQuoteTransportPreservationTest.java` remain byte-identical to the preserved evidence. The original test deliberately enables rejected global passthrough and fails because the legacy route dispatches. It is excluded explicitly from routine `test` and retained under a conspicuously named task:

```sh
JAVA_HOME=$(/usr/libexec/java_home -v 21) evidence-service-java/gradlew -p evidence-service-java \
  reproduceRejectedSolidusTransport --console=plain
```

This task uses a non-shipping `bug030` source set containing the exact baseline controller, so the preserved pre-instance routing probe does not overlap the new production instance route. The archived controller compares byte-for-byte with baseline 4ff8c7a and is never on the application runtime classpath. One routing test passes; the preservation test **intentionally fails** at its original route-dispatch assertion, reproducing BUG-030; it is not current-design acceptance. The passing `HeldQuoteCodecTransportTest` separately proves the accepted implementation. BUG-030 remains open as candidate-regression evidence, not remediated by changing global policy. BUG-029 remains open and unremediated. No new defect beyond the preserved BUG-030 is asserted by this implementation.

Deferred: Principal manual acceptance / independent review, BUG-028/029 remediation, future facets/evidence families, provider/streaming architecture and broader CLI/API backlog. No authority to begin those follows from this completion.
