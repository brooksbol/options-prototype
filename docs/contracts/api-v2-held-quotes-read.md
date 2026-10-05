# Canonical held-quote discovery contract — API v2 / `ww ls quotes`

**Date:** October 5, 2026
**Status:** Authoritative specification of Principal-ratified Product/capability decisions; specification complete, runtime implementation not authorized.
**Authority:** `PL-CLI-01` and `PL-API-03` in `../parking-lot-10.md`; Doc 77 cross-cutting guardrails; Doc 78 handoff discipline. Principal selected command, output, permission, invariant, inventory meaning, ordering, empty behavior, and HTTP direction after the completed investigation at accepted-main `2982eb803205fb0121569307f374d81bb5e70b79`.
**OAS:** [`api-v2-direct-quote-acquisition-proposal.yaml`](api-v2-direct-quote-acquisition-proposal.yaml), extended in place with GET. Its historical filename is retained to preserve existing references. The accepted POST operation and its schemas retain their semantics.
**Execution boundary:** This document specifies a future capability. It does not claim GET or `ls` exists, authorize runtime edits, grant credentials, or start Kiro implementation. The next authorized step after specification review is preparation of one bounded implementation handoff identifying this specification revision.

## 1. Product meaning and scoped invariant

`ww ls quotes` discovers the subjects for which Wheelwright currently holds a canonical direct-quote observation and identifies the selected current observation and its source.

> Held-evidence reads never acquire or revalidate evidence. `ww ls quotes` and its backing v2 capability cause no upstream provider contact.

This is a capability-specific held-evidence rule, not a claim that all existing HTTP GETs are provider-free. Existing v1 markets/timesales read-through behavior is unchanged. Independently scheduled provider activity is not activity caused by this read; acceptance must distinguish causal work from concurrent background work.

Include every current canonical `direct_quote` holding: unenrolled subjects, retained prior observations, any age, any current reuse eligibility, and any persisted provider environment. A holding is the authoritative accepted row for a canonical uppercase underlying symbol, not membership, freshness, or fitness for a consumer. There is one selected current observation per symbol. New acceptance replaces that observation, including when numeric facts are unchanged. Failure without new acceptance preserves the prior holding; failed attempts with no holding create no list entry.

Exclude universe/monitored membership, acquisition demand, legacy chain-derived prices, option chains, expiration calendars, spot history, Decision records/evidence, failed attempts without accepted canonical evidence, superseded quote history, acquisition history, and freshness/admissibility/reuse/trading-suitability judgments. The inventory is not all data Wheelwright persists. Detailed quote facts and deeper provenance are outside this slice and may belong to later `show`; no `show` grammar or endpoint is selected. Bare fetch and its relevance universe remain deferred. The discovered symbol set is only a possible future input, never that universe's definition.

## 2. HTTP collection and completion

`GET /v2/quotes` reads the complete current canonical quote-holdings collection. No request body or query parameters are supported. Any nonempty request body or presence of any query parameter (including empty-valued, repeated, or unknown names such as `symbol`, `limit`, `sort`, `fields`, `force`) is `422 INVALID_REQUEST`. A lone empty query delimiter is not a parameter. No filtering, sort controls, pagination, projections, ETag, conditional response, refresh, or freshness evaluation exists. `If-None-Match` is ignored; successful reads always return 200, never 304. A bodyless GET needs no Content-Type; Content-Type alone does not trigger POST's media-type rule.

Success is `200 application/json`, exactly one complete discovery item per selected symbol, uppercase symbol ascending (ordinal lexical order), no duplicate subjects, no silent cap/truncation. The POST 30-subject bound does not apply. Empty holdings are `200` with `items: []`, never 404/204. The explicit initial collection policy is full enumeration with no cardinality cap; if capacity prevents complete materialization, fail the entire request, never return a limited success or implied continuation. Pagination would require a later contract revision.

Every capability response, including errors, has `X-Request-Id` and `Cache-Control: private, no-store`. No ETag or legacy snapshot generation is emitted. The entire collection must be read, mapped, validated, and serialized before emitting a successful HTTP body/status; a storage/representation failure must not leave an intentionally streamed partial inventory presented as success. Network truncation remains a transport failure, not an empty/successful collection.

Repeated GETs have no evidence or membership effects and require no idempotency key. Results may differ because other authorized activity changes holdings. A caller may safely repeat a failed read; the CLI initially makes one GET with no automatic retry or POST fallback.

## 3. Discovery schema and temporal truth

All fields below are required and non-null. There are no optional discovery fields in this revision. The item is a **discovery summary**, not a full QuoteObservation or acquisition result.

| Object / field | Type and meaning |
|---|---|
| Collection `requestId` | UUID for this HTTP read, equal to X-Request-Id; not observation/acquisition identity |
| Collection `items` | Array of `HeldQuoteDiscoveryItem`; empty permitted; symbol-unique and ordered |
| Item `observationId` | Original accepted observation UUID; stable while selected, never minted by reading |
| Item `subject` | Object with required `symbol` and `securityType` |
| `subject.symbol` | Canonical uppercase underlying symbol; 1–32 characters; `^[A-Z^][A-Z0-9.^/_-]*$` |
| `subject.securityType` | Existing Wheelwright vocabulary: EQUITY, ETF, INDEX, OTHER_UNDERLYING; never inferred from a ticker or defaulted on parsing failure |
| Item `provenance` | Bounded object containing only the four fields below |
| `provenance.provider` | Nonempty persisted source-provider identity; not the contacted Wheelwright server |
| `provenance.environment` | Persisted provider data environment: PRODUCTION or SANDBOX; not current active environment or client deployment environment |
| `provenance.receivedAt` | Original Wheelwright receipt instant for the accepted upstream subject evidence |
| `provenance.committedAt` | Original Wheelwright persistence-commit/authoritative acceptance instant for that observation |

Both clocks are RFC 3339 UTC instants using `Z`, preserving stored instant and available fractional precision. No required timestamp is defaulted from another clock. Neither is source market-event time, request time, publication time, age, or freshness. Reading/reuse/failure never rewrites them. Do not use them to guess session identity or source-event time. Observation ID is distinct from the symbol's current-holding slot identity; replacement selects a new ID, while returning an existing ID does not archive or resurrect it.

No facts, acquisition ID, authority epoch, acquisition phase, session/feed context, `fulfilled`, `priorRetained`, outcomes, operation timings, reuse/admissibility state, Decision state, generation, or chain provenance is produced. No null/zero/default substitution repairs malformed discovery fields. Only discovery columns need mapping; do not deserialize omitted `facts_json` just to enumerate the inventory. Malformed omitted detail does not justify acquisition or fabricated summary values; its remediation remains separate. Malformed/missing/unknown **required discovery data** is an entire-request INTERNAL_ERROR.

Response object schemas permit unknown additive properties for compatibility; clients ignore them but validate required known fields. This does not authorize emitting excluded fields in this slice. Removing fields, changing meanings/nullability, adding enum/error values, changing ordering, completeness, permission, or purity requires explicit contract revision and compatibility review. No generic version/kind envelope is introduced for CLI summaries.

Example (illustrative, not live evidence):

```json
{"requestId":"11111111-1111-4111-8111-111111111111","items":[{"observationId":"22222222-2222-4222-8222-222222222222","subject":{"symbol":"SPY","securityType":"ETF"},"provenance":{"provider":"tradier","environment":"PRODUCTION","receivedAt":"2026-10-05T21:06:00Z","committedAt":"2026-10-05T21:06:00.100Z"}}]}
```

## 4. Identity, security, correlation, and errors

Use the established Bearer-to-principal boundary. GET requires **quote.read**, independently of quote.acquire and quote.force. An authenticated acquire-only/force-only principal is forbidden. No implicit grants, credential migration, anonymous fallback, trusted-local bypass, or provider credential lookup is defined. Actual token/grant configuration is later authorized operations work. Provider initialization/availability/suspension is not a read prerequisite when authentication and held storage are available. This does not promise provider-free whole-application startup; current application wiring still requires provider configuration.

Processing order for a well-formed HTTP request reaching the capability: establish response correlation; fail closed on missing approved authenticator configuration (503); authenticate (401); authorize quote.read (403); validate correlation/body/query (422); enumerate/map/serialize holdings (200 or request-wide error). No row data leaks to unauthenticated/unauthorized callers.

Missing or whitespace-only `X-Request-Id` generates a UUID. A single valid UUID (hex 8-4-4-4-12 form, case-insensitive, surrounding whitespace trimmed) is echoed without changing its spelling after trimming. Multiple header values or a nonblank invalid value cause 422 after authentication/authorization, with a newly generated valid correlation UUID in the response/problem. An earlier security failure uses that generated ID. RequestId is correlation only; no read operation resource or acquisition ID is created. Correlate read handling/storage failure/logging; there can be no provider work to correlate.

Errors use the established RFC 9457 `application/problem+json` grammar. Required: `type`, `title`, `status`, `code`, `requestId`; optional: safe `detail`, `instance`, `invalidParams` (invalidParams is required and nonempty for 422). Type is `urn:wheelwright:problem:{lowercase-code}`. HTTP status equals body status. Header and body requestId agree. Never return credentials, raw provider payloads, SQL text, stack traces, or partial holdings.

| HTTP | Code / stable title | Condition |
|---|---|---|
| 401 | UNAUTHENTICATED / Unauthenticated | Missing/invalid credential; include `WWW-Authenticate: Bearer` |
| 403 | FORBIDDEN / Forbidden | Authenticated caller lacks quote.read |
| 422 | INVALID_REQUEST / Invalid request | Invalid correlation, unsupported query parameter, or nonempty GET body |
| 503 | CAPABILITY_UNAVAILABLE / Capability unavailable | Read capability cannot start because approved authentication or held storage is unavailable |
| 500 | INTERNAL_ERROR / Internal error | Unexpected storage/enumeration/mapping/serialization failure, including malformed required discovery fields |

For validation failures supply invalidParams: query names use `query.<decoded-name>`, body uses `body`, correlation uses `X-Request-Id`, with safe reasons. Repeated unsupported query names need only one entry per distinct name. Unknown query names are never silently ignored. For GET no operation-specific 400/415/404/207 is selected. HTTP server/proxy rejection of malformed transport syntax is outside the capability's valid-HTTP grammar. No Retry-After promise or upstream failure code is invented. A database failure during enumeration is 500; established inability to begin the held-read capability is 503. Neither is 200 empty or partial success.

## 5. Narrow concurrency guarantee and implementation obligation

Repository evidence: DatabaseManager enables WAL; SqliteEvidenceStore owns one shared JDBC connection. Its txLock serializes multi-statement blocks toggling autoCommit, but explicitly does not isolate every single-statement reader/writer. setDirectQuote replaces all columns in one UPSERT. Existing getDirectQuotes loops single-symbol reads and is not a collection enumeration mechanism. WAL and atomic UPSERT alone do not prove safe reads on a shared connection temporarily participating in another thread's transaction.

Required successful-read semantics:

1. Every item represents all discovery fields from **one committed authoritative row version**, current at some instant during that read's storage enumeration interval. No uncommitted/rolled-back version, old ID with new provenance, or torn item is allowed.
2. At most one item per symbol. A replacement overlapping enumeration may yield the complete prior or complete successor version, never both. A replacement committed before enumeration begins cannot yield the superseded version.
3. Include every subject held continuously throughout enumeration. A subject inserted or removed concurrently may be included or absent according to when enumeration sees committed state. Do not lose a continuously held subject merely because its row was replaced.
4. No collection-wide single-instant snapshot, globally coordinated POST batch cut, latest-at-response guarantee, snapshot token, or ordering by commit time is promised. Independent rows may reflect different committed instants within the enumeration interval. Without concurrent mutations, return the complete held collection exactly.
5. Materialize and validate the full result before success. If this guarantee cannot be met, fail visibly and stop the implementation handoff for reconciliation; do not weaken it silently.

Safe connection/transaction ownership is a required implementation mechanism, but this contract does not prescribe locking strategy, another connection, or a store-wide redesign. An implementation may provide stronger read consistency without making clients depend on it. Acceptance must exercise actual storage concurrency, including another transaction's temporary autoCommit state and rollback, rather than only mocked row mapping.

## 6. CLI Product contract

```text
ww ls quotes [-v | --verbose] [--jsonl]
ww ls --help | -h | --man
ww ls quotes --help | -h | --man
```

The resource operand `quotes` precedes flags. Flags may appear in either order after it; repeated flags are idempotent. -v and --verbose are equivalent. Help/manual forms shown above are standalone and contact no backend. Bare `ww ls`, other families, symbol operands, unsupported options (including -q, --quiet, --force, filtering/sort flags), and unsupported mixtures with help/manual are usage errors before credential loading/HTTP. No implicit quote default or generic resource framework is selected.

One invocation performs one bodyless authenticated GET /v2/quotes, without query parameters, redirects, retries, follow-up inspection, or acquisition fallback. Validate the entire HTTP response before stdout output: status/content JSON, required fields/types/formats, correlation agreement, ordered unique subjects, and the complete parse. Invalid response is exit 1 with no result records. Ignore unknown response properties. Preserve the selected fields and original clocks; never evaluate freshness/reuse or repair evidence.

Terminal stdout (when stdout is a TTY and --jsonl is absent) is a table headed `Held canonical direct quotes` with ordinary columns, in this order: SYMBOL, TYPE, RECEIVED AT (UTC), PROVIDER, ENVIRONMENT. Full receipt instant is shown; no local-time substitution, ANSI dependency, or price column. Column widths/alignment are engineering choices; values and labels are contractual. -v additionally appends OBSERVATION ID and COMMITTED AT (UTC). Empty terminal output is exactly `No canonical direct quotes held.` followed by newline, including verbose mode.

Redirected/piped default stdout is **headerless TSV**, one holding per LF-terminated row, fields in order: symbol, securityType, receivedAt, provider, environment. No heading, status, blank row, ANSI, or decoration. Verbose does not alter TSV fields. Each cell escapes backslash as `\\`, tab as `\t`, CR as `\r`, LF as `\n`; ordinary symbols/times/types remain literal. This preserves one physical line per holding without discarding unusual source identity characters. Other C0 controls (U+0000–U+001F) and DEL (U+007F), including ESC, use literal `\u00XX` escapes with uppercase hex digits. Human cells use the same control-character escaping. No raw terminal control sequences are emitted.

--jsonl overrides TTY detection and emits one LF-terminated **HeldQuoteDiscoveryItem** JSON object per holding, exactly the item's defined discovery fields, including observationId and committedAt. No collection envelope, requestId duplication, kind tag, null substitutions, acquisition detail, or normal status records. Verbose does not alter JSONL. Empty TSV/JSONL stdout is zero bytes. Both formats preserve symbol order.

Normal nonverbose stderr is empty on success. Verbose stderr reports the immediate Wheelwright origin (not upstream provider identity), response request UUID, and holding count, including zero: `From <origin>`, `Request <uuid>`, `ls quotes: <N> holdings` (one line each). It never reports acquisition outcomes. Failures remain visible on stderr in every mode; safe problem code/detail/correlation may be shown. Do not print credentials, authorization headers, raw transport exception text, or untrusted control sequences. No quiet flag exists.

Use WW_BASE_URL (default http://localhost:3100) and the existing private WW_API_TOKEN convention: nonempty export overrides the literal private root .env key; no shell evaluation, provider-key loading, provisioning, or printed secret. Reject embedded URL credentials and require HTTPS outside localhost/127.0.0.1/[::1]; reject redirects rather than forward credentials. Missing/empty credential fails before HTTP, exit 1. Actual grant configuration is outside this specification work.

| Exit | Meaning |
|---|---|
| 0 | Complete read, response validation, and requested presentation succeeded; empty inventory also succeeds |
| 1 | Missing/invalid credential, unauthorized caller, backend/transport/response failure, or output failure |
| 2 | Invalid grammar/options/operands or invalid endpoint configuration; no HTTP |

Broken stdout pipe follows existing ww behavior: clean termination with the already established exit status (normally 0), no stack trace/EPIPE diagnostic, no further HTTP/provider work. This is intentional consumer termination after the complete response was validated, not an HTTP partial-success claim. Other output errors fail with exit 1. No diagnostic contains the credential, even if backend text repeats it. Credentials never appear in verbose origin/correlation output.

## 7. Acceptance contract

These are future implementation acceptance obligations, not tests claimed passed by specification work. Use deterministic fixtures and real store tests; provider spies must fail on any invocation. CLI fixtures permit only the single GET and must reject POST/v1/follow-up routes.

| ID | Specimen | Required result |
|---|---|---|
| LQ01 | Empty held table | 200, items [], no provider work |
| LQ02 | Unenrolled direct quote | Listed with its original ID/source/clocks; no membership prerequisite |
| LQ03 | Legacy-only evidence/membership/demand | No entry; no promotion or enrollment |
| LQ04 | Failed reacquisition retaining prior | Prior still listed unchanged; no failure/outcome field |
| LQ05 | Old/non-reusable quote | Listed unchanged; no policy evaluation/contact |
| LQ06 | Provider unavailable/suspended/cache expired | Read succeeds when auth/storage serve; zero causal provider calls |
| LQ07 | Accepted replacement, including equal prices | One current successor ID; no history/duplicate |
| LQ08 | Read before/after state comparison | No worker/demand/enrollment/chain/calendar/membership/publication mutations |
| LQ09 | Storage enumeration fails after some rows | 500 problem; no 200, empty substitution, or partial inventory |
| LQ10 | Required stored discovery field malformed/missing/unknown enum | Entire-request 500; no default provider/type/time or torn item |
| LQ11 | quote.read-only principal | 200; no acquire/force grant needed |
| LQ12 | acquire-only, force-only, missing/invalid credentials | 403 for authenticated missing read; 401 for unauthenticated; no held data/contact |
| LQ13 | Out-of-order fixture storage | Deterministic uppercase ordinal symbol order |
| LQ14 | Concurrent replacement/insert/remove and transaction rollback | Section 5 guarantees; old/new complete committed item only, one per symbol, stable membership complete |
| LQ15 | Terminal ordinary | Exact required heading/columns/values; results stdout, no ordinary stderr |
| LQ16 | Redirected TSV | Five ordered cells, no header, correct escaping, one physical LF row/holding |
| LQ17 | Explicit JSONL on TTY and redirected | One complete summary per line, same schema/clocks, no acquisition/envelope fields |
| LQ18 | -v / --verbose with table/TSV/JSONL | Human extra columns; origin/request/count stderr; machine schemas unchanged |
| LQ19 | Empty CLI in every mode | Exact terminal message or zero machine bytes, exit 0; verbose zero count stderr |
| LQ20 | Bare ls, unsupported family/symbol/flag/help mixture | Exit 2 before credential loading/HTTP; discovery forms make no HTTP |
| LQ21 | Auth/backend/transport/truncated JSON/malformed response | Exit 1, stderr error, no result records |
| LQ22 | Secret echoed in errors/origin/transport exception | Credential suppressed; no raw header/payload/exception disclosure |
| LQ23 | Sufficiently large stream piped to head -1 | Clean existing ww EPIPE behavior, no diagnostic/stack trace; no extra requests |
| LQ24 | All positive/negative paths with source/worker/adapters spied | Zero causal upstream contacts and acquisition/revalidation attempts |
| LQ25 | Unknown/repeated/empty query; nonempty GET body; invalid/duplicate correlation | 422 and safe invalidParams; header/problem UUID agrees; no provider work |
| LQ26 | Valid supplied/absent correlation; unavailable auth/store | Echo or generation as specified; 503 only for capability-start unavailability |
| LQ27 | More than 30 held subjects; If-None-Match supplied | Complete 200; no acquisition cap, truncation, ETag, or 304; private,no-store |
| LQ28 | Omitted detail contains malformed source-event facts | Valid discovery columns still enumerate without parsing or repairing omitted detail; no anomaly remediation |

Record applicable CF01–CF12 composition-friction evidence from ../cli/ww-composition-friction-acceptance.md with correctness and adapter requirement separately. cut, awk, rg, sort/uniq, tee, head, substitution, and redirection must consume promised TSV fields directly. Numeric-price cases are N/A because no price is promised; do not add one to make a test applicable. CF11 verifies complete **discovery-summary** JSONL; full quote facts remain outside this capability. CF12 forbids solving composition by inventing generic ww text utilities. Illustrative pipelines: `ww ls quotes | cut -f1`, `ww ls quotes | rg '^SPY\t'`, `ww ls quotes | cut -f5 | sort | uniq -c`, `ww ls quotes --jsonl | jq '.observationId'`.

## 8. Doc 78 ambiguity/falsification disposition

Bounded self-review checks: legacy-only/unenrolled holdings; environment mismatch and old retained evidence; read-only/acquire-only identities; full collections over 30; invalid query/correlation/body; malformed required discovery columns versus omitted detail; concurrent rollback/shared-connection autoCommit; machine-output escaping and verbose invariance; early consumer closure; POST schema/security preservation.

Findings resolved within the specification: a current inventory is not a history ledger; age/reuse/environment do not gate inclusion; Bearer authentication alone does not confer quote.read; full collection does not import the POST limit or generation ETag; ordinary machine output remains five TSV fields under verbose; corrupted discovery fields fail the entire read; omitted source-event detail is not parsed or repaired; collection-wide snapshot isolation is not asserted from WAL or the current shared connection. Required observable committed-item consistency is explicit, with mechanism left to engineering. HTTP Problem schema restrictions/status-code pairs and correlation rules are represented in OAS, not delegated to Kiro.

**Specification verification (October 5):** OAS 3.1 validation passed; parsed POST operation, every pre-existing schema/response, and Bearer mechanics compare unchanged to bootstrap HEAD (only shared security prose is extended to describe independent GET authority). Positive empty/nonempty/over-30 discovery schemas and negative required/null/enum/time specimens passed JSON Schema validation; GET error status/code pairs passed. These are specification checks, not runtime acceptance. Roadmap projection is regenerated and freshness checked with the authority changes.

**Disposition:** No material Product/architecture ambiguity remains for this bounded slice. Contract ready for implementation handoff. This is a single Codex specification self-review, not an independent multi-actor review or runtime acceptance. There is no implementation candidate and no test result proving runtime conformance yet.

Stop a later implementation if committed complete enumeration cannot be guaranteed, provider/Decision initialization is required by the read path, required fields would need invented provenance/defaults, errors cannot fail before success publication, or execution requires broad changes beyond this slice. Report new evidence; do not silently reinterpret the contract. Preserve accepted POST, v1, fetch, BUG-028, migrations, membership, and provider/scheduler policy. Actual implementation and operational grant changes require the bounded handoff; no push is authorized by this specification turn.

CURRENT STATE: Principal-ratified held-quote discovery decisions are specified in prose/OAS with CLI and acceptance contracts; runtime implementation has not begun.

DECISION REQUIRED: NO

NEXT AUTHORIZED ACTION: Prepare the bounded implementation handoff for GET /v2/quotes plus ww ls quotes against this committed specification revision.
