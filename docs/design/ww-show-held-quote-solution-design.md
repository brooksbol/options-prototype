# First subject show / held quote — accepted Solution Design

Date: October 5, 2026.
Status: **ACCEPTED Solution Design; Principal-authorized bounded implementation verified. Product remains frozen.**
Baseline: synchronized main/origin/main `4ff8c7a3d0a8f69330ee4ba1aa55c6d08e07c137`, with the BUG-030 reproduction and local reconciliation preserved. The Principal authorized bounded transport reconciliation after the first implementation gate failed.
Product authority: [frozen contract](../contracts/api-v2-subject-show-held-quote.md).
Architectural authority: [Doc 77](../77-api-v2-architectural-guardrails.md), existing acquisition/held-discovery contracts and OAS.
Defect boundary: [BUG-029](../bugs/BUG-029-tradier-source-event-time-parser.md), open; no remediation.

The following paragraph preserves the pre-handoff design authority state. Current implementation authority and verification are recorded in section 14.

The Principal authorized Solution Design and conditionally permitted design documentation. The Project-Memory Protocol distinguishes Design from Decision and permits the appropriate bounded reference home for durable learning. This document records a proposal without making new Product decisions or modifying runtime, grants or OAS. The separate contract amendment records the Principal’s explicit ratification; canonical memory and derived projection follow that documentation change. Earlier documentation persistence authority belonged to the completed refreeze work. The current turn preserves uncommitted gate evidence and records only the authorized bounded Solution Design reconciliation. Shared passthrough is rejected by BUG-030; the subsequent query proposal is explicitly rejected by the Principal. No runtime implementation resumes until the reconciled design is accepted; BUG-029 remediation remains unauthorized.

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

Authenticate and authorize before validating subject/body/query or revealing existence. Validate UUID correlation exactly as collection GET. Reject invalid canonical path-codec tokens, every query parameter and any nonempty body with 422, using safe `invalidParams` (`path.symbol`, `query.<name>`, `body`, `X-Request-Id`). Decode the validated bound path token exactly once through the codec after auth and before canonical store lookup; never apply URLDecoder to it. Content-Type alone is not a request body requirement.

The dependency graph must exclude `DirectQuoteService`, `DirectQuoteSource`, adapter, worker, scheduler, provider manager, calendar, enrollment, Decision and reuse-policy dependencies. Strict schema checks are representation checks, not market/reuse checks.

## 2. Resource routing and canonical path-symbol codec

Retain `GET /v2/quotes/{symbol}` with unchanged shared connector/container defaults. The path parameter is a transport token for canonical identity, not a persisted/provider identity. Copy canonical A–Z, digits, period and hyphen; encode slash `_2F`, underscore `_5F`, caret `_5E`. Only those uppercase escapes are legal, and tokens are not recursively decoded. Ordinary SPY remains `/v2/quotes/SPY`; BRK/B becomes `/v2/quotes/BRK_2FB`; literal BRK_2FB becomes `/v2/quotes/BRK_5F2FB`.

Canonical input is `[A-Z^][A-Z0-9.^/_-]{0,31}`. Canonical path grammar is `^(?:[A-Z]|_5E)(?:[A-Z0-9.-]|_(?:2F|5E|5F)){0,31}$`, encoded length 1–96. The CLI owns encoding after existing normalization/dedup; the authenticated API boundary owns once-only codec decoding before lookup. The complete alphabet analysis, inverse rules/proof, OAS delta and real-container acceptance are in [transport reconciliation](ww-show-held-quote-transport-reconciliation.md). No global codec, URI-decoding workaround, query route, symbol exclusion or provider namespace is added.

The Principal rejected the query alternative. BUG-030 and its original reproduction remain intact, and runtime stays paused until the revised codec design is accepted and a bounded handoff is authorized. Product semantics and original resource shape are unchanged.

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

After acceptance, extend the existing authoritative quote OAS with only `/v2/quotes/{symbol}` GET, `operationId: readHeldDirectQuote`, Bearer security and `x-required-grants: [quote.read]`.

Path parameter symbol: required scalar with the bounded EncodedQuoteSymbol schema from [transport reconciliation](ww-show-held-quote-transport-reconciliation.md), length 1–96 and canonical token pattern. It represents a decoded canonical identity of length 1–32; do not reuse raw RequestedSubject bounds/pattern as encoded syntax. Simple serialization, explode false; ordinary URI processing is separate from the once-only codec. No query/body/projection parameters. X-Request-Id uses established semantics; successful response is the complete canonical QuoteObservation without wrapper or transport identity fields.


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

No OAS mutation is made by this design document. The unchanged-default transport must pass its real-container codec binding and existing-route preservation gate before acceptance; no OAS or runtime amendment is made in this design turn.

## 7. CLI parser and HTTP client

Add a show-only parseArgs branch. Evidence-read mode accepts one or more subjects, all validated against the existing ASCII symbol grammar before credentials or HTTP. Normalize uppercase, then deduplicate by first occurrence while preserving input order. Do not inherit fetch’s 30-subject bound or silently truncate. No trimming malformed operands into valid subjects. Boolean --quote, --verbose/-v, --jsonl are idempotent and position-independent; support existing standalone help/-h/man conventions. No future facet dispatcher/framework.

Recognize the subject-free local discovery mode `ww show --fields` in the show parse branch before the evidence-read operand requirement and before configuration/credential loading. Route it directly to the public registry catalog renderer, not to the read client. The dedicated catalog invocation is an alternative to evidence inspection; reject subject/projection/facet/presentation combinations outside that invocation with ordinary usage exit 2 rather than ignoring operands or making HTTP calls. Existing standalone help/man dispatch retains its role; --help describes syntax/options rather than duplicating the field catalog. No environment, holdings or provider dependency enters the catalog path.

Exactly one --only consumes exactly the next argv item, split on commas. Reject empty argument/components, whitespace-contaminated names, unknown fields and repeated --only. Preserve supplied field sequence (including explicitly repeated field names), without silently sorting/deduplicating. --only with verbose/jsonl fails before credentials/HTTP. Boolean options do not require a particular position relative to subject. An ordinary -- ends option parsing consistently with the existing CLI convention.

All seven original examples and their multi-subject equivalents parse directly. In evidence-read mode, missing subjects, any invalid operand, malformed projection, or conflicting options reject the entire invocation locally with exit 2; no partial HTTP work starts. The selected facet/projection/presentation applies to every distinct subject. Existing hand parser does not naturally accept `--only=bid,ask`; this design does not add that spelling. Existing fetch/ls/sort branches remain unchanged.

`readHeldQuote(symbol, {token, base, fetchImpl})` does exactly one bodyless GET to the instance route, constructing the single segment from the encoded canonical subject token through ordinary URI serialization, rejecting redirects with no retries/fallback. Reuse credential loader and accepted URL/TLS/loopback/secret handling. Validate response status/media type, complete JSON, UUID response correlation, requested canonical subject, every required and present optional observation field before presentation. Generate no request or observation resource. Header request ID is not compared with observationId, nor expected inside the success body.

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

Default order: symbol,type,last,reportedChangePercent,bid,ask,receivedAt,provider,environment. Default headings exactly SYMBOL,TYPE,LAST,CHANGE %,BID,ASK,RECEIVED,PROVIDER,ENVIRONMENT. Other headings use unambiguous labels (e.g. LAST SIZE, BID SOURCE EVENT, PREVIOUS CLOSE, REPORTED CHANGE, REPORTED CHANGE %, COMMITTED). No generic key reflection.

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

1. **Reconciled transport/OAS boundary after design acceptance.** Real embedded-container fixture, no production startup/provider. Prove path-codec bijection/collision freedom, once-only binding/decoding and existing-route preservation under unchanged connector defaults; freeze additive OAS/prose with no POST/collection redesign. Failure returns to design, not a narrower symbol grammar.
2. **Store + decoder.** Unit fixtures for every known field/type/null/date/domain/predicate; real WAL rollback/concurrent row replacements where each version has different facts, IDs and all provenance values. Prove one committed version; separate opening and post-start failures. These can be accepted independently without a CLI.
3. **Singular HTTP.** Full Spring/controller tests, valid/unheld/corrupt/security/correlation/body/query/cache cases. Fail-fast source/adapter/worker spies and state comparisons on every path. OAS specimen validation with format assertions. Never substitute collection test fixtures that intentionally lack valid full observations for positive show fixtures.
4. **CLI registry/discovery + show.** First accept registry/catalog/manual synchronization and subject-free --fields isolation independently of backend implementation: no token/config loader, HTTP or provider access even with unavailable holdings/backend; complete name/description equality, projection validator parity, generated manual freshness and semantic-metadata mutation detection. Then accept evidence-read behavior: Parser permutations and negative pre-credential tests, complete response validation, exact registry/order, local-time/DST and absence/zero fixtures, TSV escaping/trailing empties, JSONL public types, numeric fidelity, response failures and broken pipes. Singular-route HTTP fixture proves one GET per distinct subject in input order and rejects POST/v1/collection/redirect/fallback calls. Cover uppercase first-occurrence dedup, more than 30 subjects, mixed success/404/500/transport/malformed-response outcomes, all-failure zero stdout, exact projection without symbol, and one JSONL record per success. A gated fixture lets a downstream consumer receive the first successful row before releasing a later failure; prove final exit 1 and retained partial stdout. PTY and shell composition cover cut/awk/rg/redirection/tee/head and && failure behavior.
5. **Bounded integration/preservation.** Manuals/help and installed-version registry discovery; fetch public OTHER retrofit. Focused existing V2QuotesController/DirectQuoteService, HeldQuotesController/HeldDirectQuoteStore and Node fetch/ls/type tests. No BUG-028/full-build optimization. Principal-visible valid fixture demonstrates the complete vertical slice; malformed fixture demonstrates truthful failure. Real market evidence is unnecessary.

The individual slice acceptances are engineering evidence, not Principal Product acceptance or new implementation authority. No runtime slice starts from this design alone.

## 11. Invariants, risks and stop conditions

Structurally enforce: read-only independent connection; one row/one version; complete strict validation before projection; no provider dependencies; no identity/clocks minted; absence distinct from corruption; API canonical versus ww public vocabulary; one singular GET per distinct inspected subject in this realization; subject-free discovery bypasses evidence/configuration/client initialization; one registry drives projection/catalog/manual field semantics; independent outcomes and intentional partial stdout; exact ordered projection without appended identity; no machine formatting through human placeholders; no mutable shared mapper coercion/defaults.

Concrete risks: existing malformed holdings fail correctly; cross-language codec parity, malformed token rejection and once-only binding must be proved without shared ingress changes; runtime lossless-number support must be checked; local timezone/DST must be tested without changing canonical strings; verbose output must never clip; extension data must not become an internal-state dump; shared-memory test behavior must not be mistaken for real WAL proof.

The original shared transport selection failed its conditional acceptance gate. The Principal selected bounded reconciliation, and later rejected its query representation; the current design retains the instance path using the explicitly directed reversible codec. No new Product choice or cross-cutting architectural machinery is required; design acceptance remains the boundary before resuming runtime work. Future codec-binding/preservation proof is still an implementation obligation, not an existing conformance claim.

At the pre-implementation design stage, no new demonstrated bug had been discovered. Numeric and routing issues at that stage were realization constraints for an unimplemented capability, not new defect records. BUG-029 remains open and unchanged.

Stop for BUG-029 remediation, BUG-028/build-performance work, future facets, Decision/market/position/provider/streaming/agent design, generic query frameworks, unrelated dirty state, or inability to satisfy exact encoding/committed-read/fidelity constraints. Do not narrow semantics to manufacture a pass.

## 12. Implementation gate falsification — October 5

The Principal authorized the bounded implementation at synchronized `4ff8c7a3d0a8f69330ee4ba1aa55c6d08e07c137`. The first real-container transport gate passed slash-as-one-symbol/one-decode binding but failed existing-route preservation: the actual GovernedDecisionController receives `A/B` from `/api/governed-decision/A%2FB` under passthrough, whereas the baseline container rejects it without controller/storage contact. Canonical evidence is [BUG-030](../bugs/BUG-030-shared-solidus-passthrough-route-regression.md) and the referenced focused test. No production configuration/runtime/OAS/CLI changes were made. No workaround was attempted.

The earlier decision-complete claim was conditional on preservation proof; that condition is now falsified for the candidate. Implementation stops and returns to Solution Design under the explicit handoff stop rule. All nontransport Product decisions remain frozen. No new architecture is selected by this finding.

## 13. Bounded reconciliation following Principal path-codec direction

The Principal rejected the query representation and directed retention of `/v2/quotes/{symbol}` through reversible subject transport encoding. [The completed codec reconciliation](ww-show-held-quote-transport-reconciliation.md) specifies the complete accepted alphabet, `_2F`/`_5F`/`_5E` escape table, one canonical representation, strict nonrecursive decoding, URI-layer distinction, exact OAS and acceptance changes. The previous query proposal is preserved in the append-only journal and recovery stash as rejected reasoning, not an active API direction. No Product artifact, runtime or authoritative OAS was changed. BUG-030 and its real-container reproduction remain byte-identical.

## 14. Accepted codec handoff and implementation verification — October 5

The Principal explicitly accepted the complete path-symbol codec and authorized resumption of the bounded implementation, beginning with the real-container preservation gate. That gate passes with Tomcat encoded-solidus handling still `reject`: SPY, BRK/B, literal BRK_2FB and ^SPX arrive at the quote reader as their exact canonical identities. Invalid/noncanonical tokens fail; raw encoded solidus on the actual existing governed-decision route remains container-rejected without storage dispatch. No global connector change or query endpoint is introduced.

The implemented vertical slice follows this design: independent query-only single-row store read, explicit strict persisted decoder, authenticated quote.read instance controller, additive OAS, sequential independent multi-subject CLI reads, complete response validation before projection, lossless machine numbers, one projection/discovery/semantic registry and generated man-page field block. The CLI uses a bounded source-lexeme JSON reader rather than ordinary JSON.parse binding: duplicate keys fail and numeric precision never passes through JavaScript Number. This realization preserves the already-selected strictness/fidelity seam and requires no Product change.

[Implementation acceptance evidence](../cli/ww-show-acceptance-2026-10-05.md) records passing focused Java, real SQLite/WAL, real-container, CLI/terminal/shell, OAS and registry/manual checks. This is automated engineering verification, not an independent review or a claimed Principal manual acceptance. Product remains byte-identical to the synchronized baseline. BUG-029 remains open; affected holdings deliberately fail detail decoding even for projections that omit the malformed field. BUG-030 and its original negative-candidate test remain byte-identical, with an explicit separate reproduction task that intentionally fails. Broader PL-CLI-01/PL-API-03 scope and horizons are unchanged.

CURRENT STATE: Accepted path-codec Solution Design implemented and verified for the bounded held-quote show slice.

DECISION REQUIRED: NO

NEXT AUTHORIZED ACTION: Principal manual acceptance / independent review of the synchronized bounded implementation; no additional runtime scope implied.


## 15. Authorized collection/filter/order/table extension — October 5, 2026

**Authority:** Principal's explicit bounded implementation grant and Product contract section 14. Baseline remote/local main `9370ca018b9878d9791e390d5a204ccb557d8178`; clean checkout; Gate Experiment 001 staged/inactive. Existing API, path codec, security, singular read and strict decoder are settled and unchanged.

**Grammar selected before implementation:** repeatable `--where FIELD=VALUE` (first equals delimiter, typed exact-match AND); `--sort-by FIELD`, `--absolute`, `--descending`, positive `--limit N`; `--quotes`, `--all-fields`, mutually exclusive `--table`/`--tsv`/`--jsonl`. Exact argument/error/output behavior is owned by Product section 14.

**Realization:** extend the existing parser and registry in their bounded modules. Registry type/format metadata is the single field-type authority for filter validation, comparison, numeric formatting and generated semantic documentation. Keep discovery side-effect-free. No new installed module/dependency or query framework is required.

Use the existing `readHeldQuotes` for one complete inventory GET, followed by sequential `readHeldQuote` calls with the same configured credential/endpoint. No arbitrary subject cap or request pool is needed in this slice. Inventory identity is selection, not an observation-version pin; each detail remains one independently committed row. Every inventoried subject must be inspected even if a summary type might appear to exclude it. Failures cannot hide behind filters or limits. No POST/provider/v1 path is available in this orchestration.

Buffer collection/filter/sort/limit/all-fields/explicit-table commands. Ordinary existing explicit-subject commands retain streaming. Pure selection operates over fully validated observations: AND filters, stable selection ranking, then limit and canonical output ordering. Buffering allows width calculation across emitted horizontal rows; verbose still uses its existing independent FIELD/VALUE renderer. Failure messages stay stderr and an aggregate summary explains partial query results before ranked output. Operational output failures retain exit 1; clean EPIPE retains the established convention.

Exact decimals compare sign, normalized coefficient and base-ten exponent without converting facts to Number or expanding huge exponents. Numeric filters compare mathematical equality. Limits parse as BigInt, converting only a bounded slice index. UTC instant keys split date/time and exact fractional decimal, avoiding Date's millisecond truncation; Date is used only for human-local display. Ordinal string/date comparisons are locale-independent. Missing keys are handled separately from direction. Stable sort ties preserve selected input order.

Human rounding uses decimal digits, not binary floating point: prices/absolute changes use fixed two decimals; percentages retain adaptive precision and no apparent nonzero zero; extreme large amounts use two-decimal-coefficient scientific notation; counts remain exact integers. Verbose preserves exact numeric spelling with sign/percent decoration. Machine values never pass through the human formatter. Complete tables calculate widths from escaped headings/cells and use the same compact local clocks for every timestamp field as ordinary tables; columns never clip or disappear.

**Complexity / bounds:** M holdings require 1+M existing reads; sorting O(M log M), retained evidence/output O(M). Limit does not reduce reads. Sequential execution bounds in-flight requests to one. No snapshot/latest-at-response promise. A capacity/output failure is visible, never a silently capped success. The 204-holding live read can measure practicality without acquisition; a speculative batch API remains deferred absent falsifying evidence.

**Reconciliation / gates:** existing PL-CLI-01 with PL-API-03 mapping, no new Bet, horizon, engine or API/OAS delta. Applicable ratified evidence-appliance, single-acquisition-authority and epistemic-precision constraints are satisfied by held-only reads and display-only rounding. Product register currently has no ratified Product Principles; preserve the accepted solution constraints without promoting them into new principles. Bounded self-review checks grammar/type/partial-outcome invariants before code; deterministic fixtures rerun the operator question before additional hardening. Stop on a material unresolved Product/architecture contradiction, not hypothetical scale pressure. The Principal authorized the coding actor for this CLI-only slice; historical API-v2 Kiro handoff rules do not create a new API implementation task.


**Color continuation (Principal steering):** Inspected `tastytrade.mjs`, `tastytrade-live.mjs`, tests and README before designing color. No shared helper exists; copying its trade-specific economic renderer would introduce wrong semantics/dependencies. Reuse the convention: human color is chosen by presentation, not stdout TTY; ANSI green/red codes are 32/31. Show initializes human output to white 37, colors only the semantic value of registry kinds change/percent according to exact sign, restores white 37 immediately afterward, and ends with reset 0. This follows tt live’s relevant convention and keeps ordinary text white even when the caller’s default foreground is green. Widths use escaped plain text; padding is placed outside the colored semantic span. Nonempty NO_COLOR (conventional source https://no-color.org/) and TERM=dumb disable color, including explicit --table. Pure policy takes env for deterministic testing. No tt changes. Verify explicit piped human output and an actual PTY `watch -c` invocation, while machine formats remain ANSI-free.


**Manual acceptance remediation (October 5):** BUG-031 removes `allFields` from the detailed-clock branch: only verbose selects full clocks; every horizontal table uses existing compact localTime. BUG-032 moves ANSI decoration inside independently calculated padding and adopts tt live's white baseline/value restoration/final reset. Strict decoder, held GETs, query operations, canonical machine values and color-disable policy are unchanged. Principal-requested DESCRIPTION placement is represented by moving that entry immediately after SYMBOL in the sole registry; regenerate the semantic manual and synchronize Product vocabulary. Default and exact --only projections retain their established order.


**ID-width continuation (Principal direction):** In the human non-verbose cell renderer, observationId/acquisitionId use their final 12 characters before width calculation. Keep full strings in canonical machine output, verbose, filter/sort keys and observations; suffixes do not establish uniqueness. No registry meaning/name, API or held-read change.


**Post-acceptance no-wrap continuation:** BUG-032's ordinary-white invariant was falsified by watch 4.0.7 resetting its own ANSI state after clipped lines. Reassert SGR 37 at each horizontal data row's beginning when color is enabled; existing output initialization covers the header. All widths stay based on plain values, and disabled/machine modes receive no new escapes. Verify actual clipped headers/rows under watch -c -w with the existing PTY fixture harness, alongside original watch -c coverage. The Principal authorized this bounded continuation; no watch/API/provider changes.


**Principal-ratified ranking/output-order amendment (October 5):** Existing --absolute now modifies bounded membership ranking; --sort-by and --descending also govern final canonical signed output order. Build exact canonical keys and original selected indices once. For numeric absolute plus limit, sort entries by magnitude/direction, take N, then sort retained entries by canonical value/direction; use original indices for ties in both stages and missing-last independent of direction. Without absolute, one canonical sort and slice realizes both stages. Without limit, skip magnitude ranking and sort canonically: absolute has no observable effect. Work stays within existing O(M log M) collection sorting, with an additional O(N log N) retained-row sort; all selected observations are still strictly inspected before either stage. Machine row order follows the same amended semantics; values/projection/format/integrity/API are unchanged. Principal option A ratifies this contract amendment; this is not a defect in the previously conforming implementation.


**Principal venue-label continuation:** Before implementation, verify Tradier's published exchange-code table (https://docs.tradier.com/docs/exchange-codes, October 5, 2026). Keep one private 23-entry display map in the CLI renderer; use short labels <=8 characters for bidVenue/askVenue/exchange only when the persisted provider is tradier and presentation is a nonverbose human horizontal table. Use the underlying table, never the separately published OPRA mapping. Known labels are escaped and measured before padding; no sign color applies. Unknown codes/other providers pass through unchanged; missing stays missing. Canonical values, exact code filtering/ordering, verbose and machines bypass aliases. Governed field meanings/catalog/manual note display-only expansion; no public field names/types or backend/API change.


**Principal fixed monetary-decimal continuation:** Render registry kinds price/change with exact-decimal half-away-from-zero rounding at exponent -2 and pad trailing fractional zeros to two places. Generalize the existing rounder to handle all digits discarded or rounding to zero without huge exponent expansion. Preserve the source prefix/color even when a nonzero change displays +0.00/-0.00. Existing large-magnitude scientific behavior remains bounded with exactly two coefficient decimals. Percent/integer and verbose branches remain unchanged. Machine values and exact query keys bypass human rounding; every monetary registry field is tested together for fixed decimals and canonical fidelity.


### Human-table style realization — Principal continuation, October 5

Keep private fixed TYPE and Tradier venue palettes in the CLI renderer. Style only semantic cell values, with explicit white after each; the foreground reset preserves the active row background. Yellow SYMBOL (226), light-gray DESCRIPTION (250), orange LAST (208), and four distinct TYPE colors apply only to present horizontal-table values. Change green/red still depends on exact canonical sign, not rounded display. Verbose does not acquire categorical styles.

Before measuring table widths, truncate escaped description text after 40 Unicode characters, adding ... only when longer. Full descriptions remain canonical in verbose/machines/filter/sort. Monetary price/change kinds render exactly two decimals using decimal-string rounding, never binary floating point; percentage/count rules remain separate.

Compute widths/padding from plain cells, color values afterward, and retain final-cell padding. Prefix each data row with white plus black/gray (40 or 48;5;232); suffix background reset (49) before LF. This keeps the stripe continuous without coloring padding foregrounds, and reasserts state after watch -c -w clipping. Headers remain unstriped, final reset restores caller state, and existing NO_COLOR/TERM=dumb opts out of all ANSI. No machine, API, provider, persistence or strict validation path changes.


Brighter-red continuation: Principal authorized indexed foreground 203 (#ff5f5f) for negative reportedChange/reportedChangePercent after screenshot feedback. Use the same semantic-value wrapper and immediate white restore, retaining row background. Actual watch -c -w proof verifies the indexed red survives composition; all canonical/machine/opt-out boundaries stay unchanged.
