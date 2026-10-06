# First subject show / held quote — Solution Design proposal

Date: October 5, 2026.
Status: **RESUMED Solution Design proposal following Principal multi-subject, field-discovery and transport selections. Not implementation authority.**
Baseline: synchronized main/origin/main `5c3a5131850022ecf8f67b4ad6e41e10dbe82e21`, preserving the earlier uncommitted multi-subject reconciliation. Product refreeze includes both Principal-selected A and the new field-discovery authority. No runtime implementation has begun.
Product authority: [frozen contract](../contracts/api-v2-subject-show-held-quote.md).
Architectural authority: [Doc 77](../77-api-v2-architectural-guardrails.md), existing acquisition/held-discovery contracts and OAS.
Defect boundary: [BUG-029](../bugs/BUG-029-tradier-source-event-time-parser.md), open; no remediation.

The Principal authorized Solution Design and conditionally permitted design documentation. The Project-Memory Protocol distinguishes Design from Decision and permits the appropriate bounded reference home for durable learning. This document records a proposal without making new Product decisions or modifying runtime, grants or OAS. The separate contract amendment records the Principal’s explicit ratification; canonical memory and derived projection follow that documentation change. The Principal now explicitly authorizes commit/push of the reconciled documentation after checks, under the Project-Memory Protocol’s scope-preserving persistence rule. Runtime/OAS implementation and BUG-029 remediation remain unauthorized. Shared-connector transport option A is selected conditionally on bounded real-container preservation proof; no selection remains outstanding.

## 1. Existing components and proposed responsibility path

Extend `HeldQuotesController` with singular GET handling; preserve its existing constructor dependencies (`SqliteEvidenceStore`, `BearerAuthenticator`, `ObjectMapper`) and collection behavior. Add a stateless package-local `StrictHeldQuoteDecoder`. No acquisition service or new orchestration service is needed.

Path:

```
HTTP correlation -> authentication -> quote.read -> request validation
  -> independent singular store read -> complete strict decoder
  -> complete pre-serialization -> 200 QuoteObservation
```

Absent row becomes 404, never an acquisition attempt. Strict decoder failure becomes 500, never absence. Opening the held-read capability can yield 503. Failures after read initiation are 500. All responses use `X-Request-Id`, `Cache-Control: private, no-store`; no ETag, 304, operation resource, acquisition outcome or observation identity minted by reading.

Reuse the controller's safe ProblemDetails serialization, Bearer challenge and correlation conventions. Add `NOT_FOUND(404, "Not found")` to the runtime error vocabulary; existing endpoints do not begin returning it. Detail: `No canonical direct quote is held for <SYMBOL>.` No SQL/raw evidence/exception messages enter diagnostics.

Authenticate and authorize before validating subject/body/query or revealing existence. Validate UUID correlation exactly as collection GET. Reject every query parameter and any nonempty body with 422, using safe `invalidParams` (`path.symbol`, `query.<name>`, `body`, `X-Request-Id`). Content-Type alone is not a request body requirement.

The dependency graph must exclude `DirectQuoteService`, `DirectQuoteSource`, adapter, worker, scheduler, provider manager, calendar, enrollment, Decision and reuse-policy dependencies. Strict schema checks are representation checks, not market/reuse checks.

## 2. Resource routing and selected conditional transport design

Public route: `GET /v2/quotes/{symbol}`. Canonicalize validated ASCII symbols to uppercase; request schema accepts `[A-Za-z^][A-Za-z0-9.^/_-]*`, length 1–32. Persisted/response symbol must satisfy the corresponding uppercase grammar and equal the requested canonical subject.

CLI path construction encodes the entire symbol as one URI component, e.g. `BRK/B` -> `BRK%2FB`; no query substitution, double encoding or decode-until-valid behavior.

Installed Tomcat is 10.1.36; its Connector initializes `encodedSolidusHandling` to REJECT. No project override exists. Therefore normal `%2F` cannot reach Spring under the current transport defaults. MockMvc is insufficient proof.

Principal-selected A: configure the shared Tomcat connector’s encoded-solidus **passthrough**, preserving the encoded slash inside one path segment for Spring’s parsed-path routing, then use `@GetMapping("/v2/quotes/{symbol}")`. CLI encodes the complete symbol as one segment. Obtain the decoded PathVariable exactly once; never apply URLDecoder again. Validate its complete canonical subject syntax before SQL.

The conditional acceptance boundary is shared routing and security preservation, not a custom singular-endpoint parser. Prove correctly encoded solidus reaches the application as symbol data without becoming a separator, and prove existing routes retain their interpretation and security behavior. Double encoding, query-route alternatives, symbol exclusions, catch-all routes and endpoint-specific parsing tricks are prohibited compensations. This server-wide setting also interacts with encoded percent handling; test that interaction rather than assume it safe. If standard connector/Spring routing cannot preserve the boundary reliably, stop and return to Solution Design. Do not implement a compensating workaround or switch transport choices without a new Principal disposition.

Official references:
- [Tomcat 10.1.36 Connector source](https://raw.githubusercontent.com/apache/tomcat/10.1.36/java/org/apache/catalina/connector/Connector.java), default REJECT and configurable handling.
- [Tomcat connector reference](https://tomcat.apache.org/tomcat-10.1-doc/config/http.html), reject/decode/passthrough behavior.
- [Spring 6.2 request mapping](https://docs.spring.io/spring-framework/reference/6.2/web/webmvc/mvc-controller/ann-requestmapping.html).

Do not claim this candidate has been end-to-end proven. Under the selected conditional design, real HTTP acceptance must exercise `%2F`, `%2f`, leading/trailing/repeated slash within otherwise valid symbols, `/./` and `/../` inside symbol data, `%25`, double encoding, raw semicolon, `%3B`, backslash, invalid percent transport syntax, and non-show paths. Transport-invalid HTTP may be rejected by the container; valid HTTP reaching the capability receives its specified Problem response.

## 3. Independent persisted read

Add `Optional<DirectQuoteRow> readHeldDirectQuote(String canonicalSymbol)` to `SqliteEvidenceStore`. Do not change acquisition's existing `getDirectQuote` or map it through discovery enumeration.

Open an independent connection using the same `heldReadUrl`/file-read-only strategy as `listHeldDirectQuotes`; named private shared-memory test stores use query-only without file READONLY flags. Set `PRAGMA query_only=ON`, use a prepared `SELECT` of all 13 direct_quote columns with `WHERE symbol=?`, and materialize the row. Close ResultSet, statement and reader through try-with-resources before decoding/output. No migrations, writer connection, membership joins, BEGIN IMMEDIATE, or application writer locks.

A single SELECT on that independent connection provides the required committed statement view. An explicit multi-statement transaction is unnecessary: there is only one statement and no follow-up lookup. WAL permits reading prior committed state while another connection holds an uncommitted successor. Under replacement the result may be the complete old or successor row current during the read, never a mixture. A replacement committed before the SELECT starts must be visible; missing is determined by that statement's view. Shared-memory locking failures may fail visibly; never allow dirty reads.

Use `HeldReadUnavailableException` for established inability to open/begin the capability, consistent with collection behavior. SQL/decoding failure after initiation is an internal error, not 404/empty success. No retries are introduced.

## 4. Strict persisted decoder

Recommended seam: explicit, capability-bounded tree decoder using existing Jackson, with authoritative OAS conformance tests. Do not add a general runtime schema framework or load a mutable YAML file per request.

`StrictHeldQuoteDecoder.decode(row, expectedCanonicalSymbol)` returns a validated, defensively owned JSON representation of the ratified **wire QuoteObservation**. Use a tree-backed value rather than immediately round-tripping through Java `Double`/`Long` fields: this avoids coercion and imposing undocumented numeric precision/range limits. The existing Java QuoteObservation record remains unchanged for acquisition. This decoder does not call its fallback mapper.

Use a dedicated Jackson reader configured for duplicate-key detection, trailing-token rejection, BigDecimal numeric fractions and BigInteger integers. Construct root/subject/provenance from persisted columns; SQL NULL for optional session/feed columns means omission. SQL NULL in required columns fails. Parse facts_json as a complete object. A JSON null value for a known nonnullable optional fact is malformed, not omission.

Validate before conversion/publication:

| Concern | Check |
|---|---|
| Identity | Original observationId/acquisitionId UUID; canonical symbol shape/equality; no new IDs |
| Required provenance | Nonempty provider/authorityEpoch, approved environment and phase enums, receipt/commit UTC instants |
| Optional provenance | Present regularSessionDate is valid exact date; present feedIdentity is string; no derived values |
| Facts object | Object, known fields have exact schema types; no scalar-to-string/number coercion |
| Side/trade objects | Present object requires nonnegative numeric price; optional nonnegative integer size; side venue string; event time valid canonical UTC |
| Price facts | open/high/low/close/previousClose/fiftyTwoWeekHigh/Low numeric and nonnegative |
| Activity | volume/averageVolume nonnegative mathematical integers; reportedChange/Percent numeric with either sign |
| Price-bearing predicate | At least one strictly positive last/bid/ask/open/high/low/close; previousClose alone is insufficient |
| Strings | description/exchange and optional string facts remain strings, including genuine schema-permitted empty strings |

Validate calendar correctness and RFC3339 UTC syntax, preserving original timestamp spelling/fractional precision. Do not truncate a timestamp merely to fit Java's nanosecond parser. Do not invent chronology/market/session constraints beyond the ratified representation. UNKNOWN phase is valid only when actually stored as that enum.

The existing OAS permits additive unknown object properties. Treat those separately from known malformed properties: validate all supported canonical fields, preserve accepted additive data on the backend without interpreting it as a new fact, and do not use extension data to satisfy the price predicate. CLI clients ignore unknown additions and present only the declared public inventory. This does not authorize publication of new implementation fields or raw provider payloads.

OAS fixture validation must assert formats, not merely annotate them. Compare decoder pass/fail against shared QuoteObservation schema and prose constraints (including canonical uppercase symbol/UTC semantics) so an explicit decoder cannot silently drift. The runtime does not change the acquisition acceptance path.

## 5. BUG-029

Show can be implemented and accepted independently of BUG-029. Positive fixtures seed complete valid observations directly into test-only databases; malformed fixtures use BUG-029 tokens and other unrelated corruption shapes. Do not repair test fixtures through provider acquisition, mutate live holdings or change normalization.

An affected real holding fails 500 even when default/only output excludes its timestamp. No success record is emitted for the affected subject. Other valid requested subjects remain independently displayable. Collection GET retains its narrower discovery validation and remains able to enumerate a holding with malformed omitted detail. No live success with SPY is promised until its entire persisted representation is valid.

## 6. Bounded OAS amendment

Extend the existing authoritative quote OAS with only `/v2/quotes/{symbol}` GET, `operationId: readHeldDirectQuote`, Bearer security and `x-required-grants: [quote.read]`.

Path parameter: required string, length 1–32, input symbol pattern above, simple scalar serialization, encoded slash data explicitly documented. X-Request-Id uses the established correlation header rules. No body/query/projection parameters. Successful response is directly `$ref: QuoteObservation`, no wrapper/requestId/operation clocks. Correlation is in the header.

| Status | Schema/vocabulary |
|---|---|
| 200 | Complete QuoteObservation; application/json |
| 401 | UNAUTHENTICATED; application/problem+json; WWW-Authenticate: Bearer |
| 403 | FORBIDDEN |
| 404 | NOT_FOUND / Not found; holding-specific detail |
| 422 | INVALID_REQUEST; nonempty invalidParams |
| 500 | INTERNAL_ERROR |
| 503 | CAPABILITY_UNAVAILABLE |

Every response requires correlation and private,no-store headers. Ignore If-None-Match as collection does; successful reads return 200. No upstream error vocabulary or 207.

Add a bounded `HeldQuoteReadProblem` schema with explicit status/code/title pair constraints and the established structural fields. Existing Problem/HeldQuotesReadProblem enums exclude 404; do not extend accepted POST/collection schemas to advertise new responses. Reuse their property schemas where possible without composing a restrictive schema that inadvertently prohibits 404. Preserve all existing operations/components semantically and verify the parsed baseline diff.

No OAS mutation is made by this design document. The selected transport profile must pass its real-container preservation gate before the singular route is accepted; no OAS or runtime amendment is authorized in this documentation turn.

## 7. CLI parser and HTTP client

Add a show-only parseArgs branch. Evidence-read mode accepts one or more subjects, all validated against the existing ASCII symbol grammar before credentials or HTTP. Normalize uppercase, then deduplicate by first occurrence while preserving input order. Do not inherit fetch’s 30-subject bound or silently truncate. No trimming malformed operands into valid subjects. Boolean --quote, --verbose/-v, --jsonl are idempotent and position-independent; support existing standalone help/-h/man conventions. No future facet dispatcher/framework.

Recognize the subject-free local discovery mode `ww show --fields` in the show parse branch before the evidence-read operand requirement and before configuration/credential loading. Route it directly to the public registry catalog renderer, not to the read client. The dedicated catalog invocation is an alternative to evidence inspection; reject subject/projection/facet/presentation combinations outside that invocation with ordinary usage exit 2 rather than ignoring operands or making HTTP calls. Existing standalone help/man dispatch retains its role; --help describes syntax/options rather than duplicating the field catalog. No environment, holdings or provider dependency enters the catalog path.

Exactly one --only consumes exactly the next argv item, split on commas. Reject empty argument/components, whitespace-contaminated names, unknown fields and repeated --only. Preserve supplied field sequence (including explicitly repeated field names), without silently sorting/deduplicating. --only with verbose/jsonl fails before credentials/HTTP. Boolean options do not require a particular position relative to subject. An ordinary -- ends option parsing consistently with the existing CLI convention.

All seven original examples and their multi-subject equivalents parse directly. In evidence-read mode, missing subjects, any invalid operand, malformed projection, or conflicting options reject the entire invocation locally with exit 2; no partial HTTP work starts. The selected facet/projection/presentation applies to every distinct subject. Existing hand parser does not naturally accept `--only=bid,ask`; this design does not add that spelling. Existing fetch/ls/sort branches remain unchanged.

`readHeldQuote(symbol, {token, base, fetchImpl})` does exactly one bodyless GET to the encoded instance route, rejecting redirects with no retries/fallback. Reuse credential loader and accepted URL/TLS/loopback/secret handling. Validate response status/media type, complete JSON, UUID response correlation, requested canonical subject, every required and present optional observation field before presentation. Generate no request or observation resource. Header request ID is not compared with observationId, nor expected inside the success body.

The smallest multi-subject realization is a sequential loop over the normalized distinct subjects, using one singular GET per subject and shared invocation configuration/credentials. No batch endpoint, concurrency pool, retry or collection selection is needed. This request-count choice is Solution Design, not Product semantics. Each independent GET observes its own committed row version; no cross-subject snapshot is promised.

For each subject, validate its complete response before emitting its success presentation. On 404, corrupt holding, transport failure or malformed response, emit an escaped subject-labelled diagnostic on stderr (with available request correlation), record aggregate failure and continue to the next subject. Never turn failure into a synthetic observation or absence. Process-wide inability to proceed must diagnose the remaining subjects as not successfully read, without claiming an HTTP result for an unattempted subject; exit 1. Configuration/usage errors remain preflight exit 2. Do not expose the credential in diagnostics. A common auth failure may be diagnosed per attempted subject; the simple baseline loop does not infer other holdings from it.

Keep success emission in input order with failures leaving gaps. Record failure state before diagnostics/output so later clean broken-pipe handling preserves an already known nonzero exit. Successful output is intentionally incremental and may already have been consumed before a later failure. Never retract it, buffer all subjects to manufacture atomicity, or claim exit 0 with an unresolved subject. The existing clean-EPIPE convention still applies when the downstream reader ends early; it is not evidence that unseen subjects succeeded.

Machine numeric fidelity must not be lost in JSON.parse. Installed Node is v24.18.0 and supports source-aware JSON.parse revivers and JSON.rawJSON. A small show-only canonical-number wrapper retains numeric source lexemes, validates number/integer domains exactly, supplies TSV text and raw numeric JSON serialization. Never serialize numeric strings instead of numbers or round 64-bit volumes through Number. Feature-check before HTTP; unsupported runtime fails clearly rather than degrading fidelity. Keep this bounded to show; no general numeric/query framework or unrelated fetch refactor.

Do not redact a successful observation into a different valid observation: if result data would expose the credential, suppress/fail that response; redact safe diagnostics. Never emit raw transport exception messages. Diagnostics reuse escaped/redacted origin and correlation; nonverbose successful stderr remains empty. Verbose may report origin/request to stderr without changing machine observation data.

## 8. Public fields and projection seam

Define one bounded ordered SHOW_FIELDS registry in a side-effect-free show-specific CLI module (proposed `scripts/ww-show-fields.mjs`), imported by the existing command. Each entry contains public camelCase name, explicit canonical extractor, terminal heading, human formatter, machine serializer, concise discovery description and durable semantic documentation metadata: units, canonical source meaning, temporal meaning, missing-value behavior and applicable caveats. There is no generic projection architecture. Importing the registry must not read credentials/configuration or initialize an HTTP/provider client. Undefined means absent; actual zero/empty source string stays present. Do not use truthiness or fabricate placeholders in the observation model.

`--only` names resolve against this registry; --fields iterates the same entries in complete public inventory order. For local catalog presentation, reuse the CLI’s table/TSV grammar: FIELD / DESCRIPTION headers on a TTY, headerless name/description TSV when redirected. These descriptions remain readable by humans and agents. No market facts, subject rows, correlation IDs or runtime evidence appear. Success exits 0 even with no backend or credentials.

Implement `ww-show(1)` in the established `docs/cli/ww-show-man.txt` convention. Generate its field-reference section from the registry’s semantic metadata while keeping authored command/purity/exit/composition guidance outside the generated block. A bounded generation/check helper fails if that block differs, not merely when names differ. Thus a source/units/meaning/caveat edit changes both catalog and durable reference through the same metadata; avoid a second list or a drift-prone hand-copied field section. Verify complete metadata for every registry entry. The reference explains percentage points (not ratio), price/size/volume units as truthfully supported, source-event versus receipt versus commit time, calendar dates, missing versus zero, provider-reported rather than derived facts, and provenance limits. Do not invent currency or lot-unit guarantees absent from the accepted schema; state those limitations. The concise descriptions identify fields; the longer semantic text explains use.

A semantic edit still requires Product acceptance before changing registry metadata. Script-derived experiments do not auto-register. Conformance checks are maintenance evidence, not Product authorization. Help remains concise invocation guidance including the subject-free discovery form. Acceptance proves exact field inventory and rendered descriptions equal registry data, every field has a semantic manual entry, and the generated manual section is fresh. No runtime module, generator or manual is created in this design-only turn.

Mapping (Q = validated observation):

| Public fields | Extractor |
|---|---|
| symbol, type | Q.subject.symbol; Q.subject.securityType mapped OTHER_UNDERLYING -> OTHER |
| last, lastSize, lastSourceEventAt | Q.facts.last.price/size/sourceEventAt |
| bid, bidSize, bidVenue, bidSourceEventAt | Q.facts.bid.price/size/venue/sourceEventAt |
| ask, askSize, askVenue, askSourceEventAt | Q.facts.ask.price/size/venue/sourceEventAt |
| open, high, low, close, previousClose, volume | Same names in Q.facts |
| reportedChange, reportedChangePercent, averageVolume | Same names in Q.facts |
| fiftyTwoWeekHigh, fiftyTwoWeekLow, description, exchange | Same names in Q.facts |
| observationId | Q.observationId |
| provider, environment, acquisitionId, authorityEpoch, acquisitionPhase | Same names in Q.provenance |
| regularSessionDate, feedIdentity, receivedAt, committedAt | Same names in Q.provenance |

Default order: symbol,type,last,reportedChangePercent,bid,ask,receivedAt,provider,environment. Default headings exactly SYMBOL,TYPE,LAST,CHANGE,BID,ASK,RECEIVED,PROVIDER,ENVIRONMENT. Other headings use unambiguous labels (e.g. LAST SIZE, BID SOURCE EVENT, PREVIOUS CLOSE, REPORTED CHANGE, REPORTED CHANGE %, COMMITTED). No generic key reflection.

Verbose order is the frozen inventory sequence in contract section 6. --only uses the supplied ordered registry entries, with no automatically added symbol/type/identity. Apply complete validation first, type mapping second, field extraction/projection third, formatting last.

Complete JSONL reconstructs the declared nested public observation and maps subject.securityType to OTHER; it does not flatten it, add request/diagnostic fields or echo arbitrary unknown backend properties. The backing API remains canonical wire vocabulary. A bounded fetch presentation retrofit maps every public structured subject.securityType occurrence (result subject and observation.subject) to OTHER without changing raw response validation, outcomes, fulfillment or acquisition behavior; ls already conforms. Preserve empty-string facts actually supplied, while absent optional fields remain omitted.

## 9. Presentation

Use existing stdout.isTTY detection. JSONL overrides it. Compose each complete validated observation before emitting any output for that subject. Successful subjects stream in first-occurrence input order; unsuccessful subjects contribute only stderr diagnostics. An all-failure invocation emits no stdout, including headers.

- Normal/only TTY: one row per successful subject, one header block before the first success. Use heading-based minimum column widths and left/right padding consistently; long values expand rather than being clipped. This permits incremental output without withholding earlier successes to calculate whole-command widths. No truncation/ANSI/width-dependent omitted fields. Missing cells `-`.
- Verbose TTY: one subject-labelled FIELD / VALUE table per successful subject in frozen verbose order. This keeps the complete public view readable in one tabular arrangement rather than a 36-column row. Every public field is represented, including missing values; IDs and clocks are never clipped. No JSON dump or implementation-state block. This is a layout choice within the frozen tabular grammar, not a new projection.
- Redirected normal/only/verbose: one LF-terminated headerless TSV row per successful subject in selected order. Verbose uses the complete registry order. Absent values empty; retain trailing empties. Escape text controls/backslashes as existing discovery serializer does; no human `-` or percent decoration.
- JSONL: one complete nested public observation per successful subject, LF-terminated, on TTY or pipe, with omitted absent optional facts and public OTHER. Verbose does not expand that inventory.

Terminal dates use local OS/Node timezone (including ordinary TZ configuration), deterministic English month labels and 24-hour time. Receipt/source/commit instants can use compact `MMM d HH:mm`; verbose values additionally retain full local date/year/seconds, available fraction and explicit offset so old/DST observations are not ambiguous. regularSessionDate is a calendar date and is never timezone-shifted. TSV/JSONL preserve original UTC timestamp strings exactly. Date conversion only affects display, never evidence/trust.

Human numerics use readable canonical decimal values, optional grouping, no forced trailing precision. Percent fields add + only for positive values and append %, never multiply by 100. Zero remains zero; no rounding a small nonzero into apparent zero. Machine serializers use exact numeric source values, with no grouping/units. Avoid binary conversion when it would lose meaning.

Reuse clean stdout EPIPE termination and other output-failure exit 1 behavior. HTTP/response failures emit no success row or JSONL for that subject and do not suppress valid subjects. --only bid,ask remains exactly two columns regardless of subject count; identity requires explicit symbol. Usage/config=2; any operational failure including 404/data integrity=1; every requested distinct subject successfully read and presented=0, subject to the established clean broken-pipe convention.

## 10. Acceptance architecture and ordered slices

1. **Transport/OAS boundary under selected conditional A.** Real embedded-container fixture, no production startup/provider. Prove slash/encoding/request validation and existing-route preservation; freeze additive OAS/prose with no POST/collection redesign. Failure returns to design, not a narrower symbol grammar.
2. **Store + decoder.** Unit fixtures for every known field/type/null/date/domain/predicate; real WAL rollback/concurrent row replacements where each version has different facts, IDs and all provenance values. Prove one committed version; separate opening and post-start failures. These can be accepted independently without a CLI.
3. **Singular HTTP.** Full Spring/controller tests, valid/unheld/corrupt/security/correlation/body/query/cache cases. Fail-fast source/adapter/worker spies and state comparisons on every path. OAS specimen validation with format assertions. Never substitute collection test fixtures that intentionally lack valid full observations for positive show fixtures.
4. **CLI registry/discovery + show.** First accept registry/catalog/manual synchronization and subject-free --fields isolation independently of backend implementation: no token/config loader, HTTP or provider access even with unavailable holdings/backend; complete name/description equality, projection validator parity, generated manual freshness and semantic-metadata mutation detection. Then accept evidence-read behavior: Parser permutations and negative pre-credential tests, complete response validation, exact registry/order, local-time/DST and absence/zero fixtures, TSV escaping/trailing empties, JSONL public types, numeric fidelity, response failures and broken pipes. Singular-route HTTP fixture proves one GET per distinct subject in input order and rejects POST/v1/collection/redirect/fallback calls. Cover uppercase first-occurrence dedup, more than 30 subjects, mixed success/404/500/transport/malformed-response outcomes, all-failure zero stdout, exact projection without symbol, and one JSONL record per success. A gated fixture lets a downstream consumer receive the first successful row before releasing a later failure; prove final exit 1 and retained partial stdout. PTY and shell composition cover cut/awk/rg/redirection/tee/head and && failure behavior.
5. **Bounded integration/preservation.** Manuals/help and installed-version registry discovery; fetch public OTHER retrofit. Focused existing V2QuotesController/DirectQuoteService, HeldQuotesController/HeldDirectQuoteStore and Node fetch/ls/type tests. No BUG-028/full-build optimization. Principal-visible valid fixture demonstrates the complete vertical slice; malformed fixture demonstrates truthful failure. Real market evidence is unnecessary.

The individual slice acceptances are engineering evidence, not Principal Product acceptance or new implementation authority. No runtime slice starts from this design alone.

## 11. Invariants, risks and stop conditions

Structurally enforce: read-only independent connection; one row/one version; complete strict validation before projection; no provider dependencies; no identity/clocks minted; absence distinct from corruption; API canonical versus ww public vocabulary; one singular GET per distinct inspected subject in this realization; subject-free discovery bypasses evidence/configuration/client initialization; one registry drives projection/catalog/manual field semantics; independent outcomes and intentional partial stdout; exact ordered projection without appended identity; no machine formatting through human placeholders; no mutable shared mapper coercion/defaults.

Concrete risks: existing malformed holdings fail correctly; encoded-slash transport changes affect shared ingress; runtime lossless-number support must be checked; local timezone/DST must be tested without changing canonical strings; verbose output must never clip; extension data must not become an internal-state dump; shared-memory test behavior must not be mistaken for real WAL proof.

No genuine Product or Solution Design decision remains after the Principal’s selections. Conditional real-container transport proof is an implementation acceptance obligation, not an outstanding selection or a claim that proof already exists. Failure of that proof returns to Solution Design rather than narrowing Product semantics.

No new demonstrated bug was discovered. Numeric and routing issues here are realization constraints for an unimplemented capability, not new defect records. BUG-029 remains open and unchanged.

Stop for BUG-029 remediation, BUG-028/build-performance work, future facets, Decision/market/position/provider/streaming/agent design, generic query frameworks, unrelated dirty state, or inability to satisfy exact encoding/committed-read/fidelity constraints. Do not narrow semantics to manufacture a pass.

CURRENT STATE: Product is coherently refrozen with multi-subject inspection and subject-free field discovery. Solution Design is decision-complete for implementation handoff under Principal-selected conditional transport A. Runtime/OAS implementation has not begun and is not authorized by this document.

DECISION REQUIRED: NO

NEXT AUTHORIZED ACTION: Prepare the bounded implementation handoff against this refrozen contract and decision-complete design. Runtime work requires separate explicit authorization; its first transport acceptance gate must prove shared-route interpretation/security preservation.
