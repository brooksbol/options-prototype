# Held-quote detail read — bounded path-symbol codec reconciliation

Date: October 5, 2026.
Status: Accepted Solution Design under the Principal’s explicit path-codec acceptance and bounded implementation handoff; real-container preservation verified.
Baseline: remotely verified main/origin/main `4ff8c7a3d0a8f69330ee4ba1aa55c6d08e07c137`; useful uncommitted evidence and the rejected query proposal are recovery-stashed.
Authority: [Doc 77](../77-api-v2-architectural-guardrails.md), sections 8 and 20; [frozen Product contract](../contracts/api-v2-subject-show-held-quote.md); Principal rejection of query reconciliation and direction to define a reversible path-symbol codec.
Related: [main Solution Design](ww-show-held-quote-solution-design.md), [BUG-030](../bugs/BUG-030-shared-solidus-passthrough-route-regression.md).

## 1. Preserved capability and rejected candidates

Keep `GET /v2/quotes/{symbol}`. Ordinary canonical SPY remains `/v2/quotes/SPY`. The parameter contains an encoded canonical subject, not a new subject identity. The capability still returns one complete current committed canonical QuoteObservation, requires quote.read, strictly validates before projection, preserves identity/facts/provenance, and never acquires, contacts providers or mutates evidence. All CLI/cardinality/output/discovery/public-type decisions remain frozen.

Shared encoded-solidus passthrough is rejected by BUG-030. The Principal also rejected `GET /v2/quotes/observation?symbol=...`; do not add that route, a query selector or a compatibility alias to OAS/runtime. Its prior proposal is preserved in the journal/recovery stash as rejected reasoning, not active authority.

The new direction deliberately permits a small API-boundary transport codec. It does not permit modifying canonical identity, percent-double-encoding, a servlet bypass, a global decoder or changing connector policy. The following reconciliation sections preserve the design-stage reasoning; implementation verification follows in section 9.

## 2. Repository-established subject domain

Evidence agrees across:

- `api-v2-direct-quote-acquisition-proposal.yaml`: RequestedSubject.symbol accepts `^[A-Za-z^][A-Za-z0-9.^/_-]*$`, length 1–32; HeldQuoteDiscoverySubject.symbol has uppercase canonical grammar.
- `V2QuotesController.java`: the accepted pattern/length are checked before Locale.ROOT uppercase normalization.
- `HeldQuoteDiscoveryItem.java` and `wheelwright.mjs` discovery validation: canonical `[A-Z^][A-Z0-9.^/_-]{0,31}`.

Thus the codec input domain C is exactly ASCII strings matching:

```text
^[A-Z^][A-Z0-9.^/_-]{0,31}$
```

The first character is A–Z or caret. Subsequent characters are A–Z, 0–9, period, caret, slash, underscore or hyphen. There are 27 first-character choices and 41 subsequent-character choices. No Unicode, spaces, percent, tilde, plus, backslash, semicolon, colon, question mark or fragment marker is an accepted canonical identity today. Do not invent acceptance for those characters or silently remove them. Codec length limits apply to decoded identity, not its expanded transport string.

CLI input still accepts documented lowercase and normalizes it before encoding/deduplication. Codec functions themselves accept canonical uppercase identity only: encoding is not a second identity-normalization step. The API accepts the canonical path-codec spelling; it does not uppercase or repair lowercase path tokens. A lowercase canonical-equivalent CLI operand remains supported through its existing pre-HTTP normalization, while a noncanonical direct API token is 422. This does not exclude any canonical identity.

## 3. Complete minimal codec

Copy A–Z, 0–9, period and hyphen unchanged. Replace the other accepted characters as follows:

| Canonical character | ASCII hexadecimal | Canonical path token | Reason |
|---|---|---|---|
| `/` | 2F | `_2F` | A path separator must not be literal subject data in the segment. |
| `_` | 5F | `_5F` | Escape introducer must escape itself to prevent collisions. |
| `^` | 5E | `_5E` | Caret is not a URI-unreserved path character. |

No other escape is legal. Uppercase hexadecimal is mandatory. Safe characters cannot be optionally escaped; `_41` for A and `_2E` for period are noncanonical and rejected. This is a closed three-entry ASCII codec, not an extensible arbitrary-byte/UTF-8 decoder. A future subject alphabet expansion requires an explicit transport review rather than implicit acceptance through a generic hex decoder.

The complete canonical token domain P is:

```text
^(?:[A-Z]|_5E)(?:[A-Z0-9.-]|_(?:2F|5E|5F)){0,31}$
```

These displayed grammars require full-string matching, including rejection of trailing controls/line terminators; do not rely on an ECMA `$` test that can match before a final newline. Java can use matcher.matches; JavaScript must use an absolute-end guard or an equivalent full-match check.

Encoded length is 1–96; the pattern's token count enforces decoded length 1–32. The 96 bound is attainable with 32 carets. No token contains slash, percent or URI delimiters. Output consists solely of URI-unreserved ASCII characters. See [RFC 3986 section 2.3](https://www.rfc-editor.org/rfc/rfc3986.html#section-2.3).

### Encoding E: C -> P

1. Validate complete canonical input against C; reject invalid input without trimming, case repair or identity substitution.
2. Scan original characters once, left to right. Copy safe characters; emit the exact escape table for slash/underscore/caret.
3. Return the token. Do not re-encode generated underscores or escape text. No general chained string replacements that can escape their own output.

### Decoding D: P -> C

1. Validate the entire bound path token against P, including exact token forms, uppercase spelling and decoded-token count. No normalization or guessed escape.
2. Scan original token once, left to right. Copy safe characters; on `_`, consume exactly the next two uppercase hexadecimal characters and map only 2F/5F/5E.
3. Validate the decoded canonical identity against C and, defensively, require E(decoded) == original token. Return canonical identity exactly.
4. Never rescan the decoded output. `BRK_5F2FB` decodes to literal `BRK_2FB`, not to `BRK/B`.

Decoder failure is authenticated capability validation failure: 422 INVALID_REQUEST with safe `path.symbol` invalidParams, before storage. A valid token that decodes to an unheld subject is 404 NOT_FOUND. A valid held subject whose complete persisted observation is malformed remains 500 INTERNAL_ERROR. URI/container-invalid requests remain outside the capability's valid-HTTP envelope.

## 4. Examples, uniqueness and round-trip properties

| Canonical subject | Canonical path token | D(token) |
|---|---|---|
| SPY | SPY | SPY |
| BRK/B | BRK_2FB | BRK/B |
| BRK_2FB | BRK_5F2FB | BRK_2FB |
| ^SPX | _5ESPX | ^SPX |
| A_ | A_5F | A_ |
| A//B | A_2F_2FB | A//B |
| A/./B | A_2F._2FB | A/./B |
| A/../B | A_2F.._2FB | A/../B |

Rejected examples include `BRK_`, `BRK_2`, `BRK_2fB`, `BRK_5f2FB`, `BRK_41`, `BRK_2E`, `BRK_00`, `BRK_25`, raw `BRK/B`, raw `^SPX`, lowercase `spy`, and a token starting `_2F` (decoded first character would be slash). Malformed sequences, unsupported escapes, safe-character over-escaping, empty input and more than 32 decoded characters fail rather than being repaired.

Required laws:

- For every s in C: D(E(s)) = s.
- For every p in P: E(D(p)) = p.
- Therefore E is injective: E(a) = E(b) implies a = b.
- Every canonical subject has exactly one codec token and every accepted codec token names exactly one canonical subject.

Proof: emitted codewords for the three special characters start with `_`, which is never emitted raw. Every such codeword has fixed length three and one distinct meaning. All other codewords are distinct single safe characters. Left-to-right decoding therefore has a unique segmentation and inverse. The first-token and 32-token restrictions correspond exactly to C. Because unnecessary/unknown escapes and lowercase are rejected, there are no codec spelling aliases.

A detached design oracle (not a production module or repository test) verified all 46,521 canonical identities of lengths 1–3, 10,000 deterministic samples spanning lengths 1–32 (LCG seed 0x57575348), maximum-expansion boundaries and literal-escape/dot-sequence cases. It checked both laws, observed-token collision freedom and ordinary URL construction, and rejected 26 malformed/boundary/control examples. This supports the rules and proof; it is not exhaustive enumeration of all 32-character identities or implemented HTTP acceptance.

## 5. Codec and ordinary URI processing are separate layers

CLI pipeline:

```text
canonical typed operand -> existing validation/uppercase/dedup
 -> E(canonical identity) -> ordinary path-segment URI serialization
 -> bodyless GET /v2/quotes/<token>
```

The encoded token uses only URI-unreserved characters, so ordinary encodeURIComponent/path serialization leaves its spelling unchanged. In particular, CLI never constructs a percent-encoded solidus: it constructs `_2F`. Build the URL from the encoded token, not from raw canonical subject characters. SPY therefore remains SPY.

API pipeline:

```text
unchanged container/Spring URI processing -> bound path token
 -> correlation/authentication/quote.read -> body/query/token validation
 -> D(token) exactly once -> canonical store lookup -> complete strict decoder
```

Use ordinary `@GetMapping("/v2/quotes/{symbol}")` PathVariable binding. Do not apply URLDecoder to the bound value. Keep syntax validation in the controller after security, not a route regex that changes malformed-token errors to 404. No global decoder/filter or connector customizer is introduced.

There is one standard HTTP percent-decoding boundary and one separate application codec decoding, not repeated decoding of the same representation. RFC-equivalent percent-encoding of URI-unreserved characters may yield the same bound canonical codec token through standard URI handling; this is not an additional codec spelling. The canonical client URI spelling uses those characters literally. No raw request-path parsing is added to forbid ordinary URI equivalence.

`BRK%2FB` still encounters the existing encoded-solidus container rejection. `BRK%252FB` is never produced by the CLI; a once-bound `BRK%2FB` contains `%` and fails codec validation. `BRK_252FB` uses a forbidden `_25` escape and also fails. These are not decoding workarounds. Legal `BRK_5F2FB` succeeds as literal canonical underscore identity and is never decoded twice.

Because a complete token cannot contain literal slash or be exactly `.`/`..`, subject slash/dot sequences cannot become URI path hierarchy or dot-segment normalization. Decode only after intended-route dispatch and use the result only as a prepared canonical store key, never as another URL/path to dispatch.

## 6. Boundary ownership and compatibility

Proposed minimal realization after acceptance: one bounded pure Node helper for E in the show path construction seam, and one bounded pure Java helper for D at the held-quote controller boundary. Share normative test specimens/rules, not a provider namespace or generic routing framework. No implementation of those helpers occurs now.

Persisted lookup/subject agreement, returned subject.symbol, diagnostics referring to subject identity, field registry/rendering and JSONL all use the decoded canonical identity. Persisted rows must never be keyed by path token. Collision fixtures must hold BRK/B and BRK_2FB separately and read them separately. Source/provider adapters continue to use existing canonical identities; this read never contacts them. POST body symbols and collection discovery symbols have no codec and remain unchanged.

Multi-subject CLI normalization/order/dedup happen before E, and all outcome/projection/presentation semantics remain unchanged. HTTP request count remains a Solution Design detail. Ordinary GET `/v2/quotes/SPY` remains clean; the API remains subordinate instance-resource grammar. There is no observation query endpoint or provider-specific representation.

BUG-030 is avoided by leaving shared container settings unchanged and emitting only safe path characters. Existing Decision paths retain their original interpretation. Codec application is scoped to the new held-quote route, not installed across legacy routes. Preserve BUG-030 and its original failing shared-passthrough reproduction byte-for-byte; do not “fix” that test by changing its expected preservation condition.

## 7. Exact bounded OAS delta after acceptance

The accepted OAS currently contains only `/v2/quotes` GET/POST. Add `/v2/quotes/{symbol}` GET, operationId `readHeldDirectQuote`, bearerAuth and `x-required-grants: [quote.read]`. Do not add `/v2/quotes/observation` or alter existing operations.

Add a bounded `EncodedQuoteSymbol` transport schema (do not modify RequestedSubject or canonical response subject schemas):

```yaml
EncodedQuoteSymbol:
  type: string
  minLength: 1
  maxLength: 96
  pattern: '^(?:[A-Z]|_5E)(?:[A-Z0-9.-]|_(?:2F|5E|5F)){0,31}(?![\s\S])'
  description: >-
    Canonical path-symbol token for a canonical ASCII Wheelwright subject of
    1–32 characters. Copy A–Z, digits, period and hyphen. Escape slash as _2F,
    underscore as _5F and caret as _5E. Decode exactly once; no other escape,
    lowercase token or unnecessary escape is accepted. Transport only;
    persisted and returned subject identity remains the decoded symbol.
```

The schema uses an absolute-end negative lookahead rather than an ECMA `$`-only suffix, so a terminal line break is not accidentally accepted.

Path parameter `symbol`: required, `in: path`, `style: simple`, `explode: false`, schema ref EncodedQuoteSymbol. Parameter examples: SPY, BRK_2FB, BRK_5F2FB, _5ESPX with decoded identities documented. Its 96-character encoded bound must not inherit the 32-character raw RequestedSubject bound. Prose and specimens specify the exact inverse and forbid recursive decoding. No query/body/projection selectors.

Reuse the optional single UUID X-Request-Id semantics. 200 application/json remains the existing complete QuoteObservation directly, containing canonical subject.symbol, original IDs/facts/provenance and no request wrapper. Full persisted validation remains before projection. Every response requires X-Request-Id and Cache-Control private,no-store; no ETag/304, redirects, retries or acquisition fallback.

Add the previously designed independent bounded HeldQuoteReadProblem component. Existing Problem/HeldQuotesReadProblem enums exclude 404; do not widen accepted POST/collection schemas or compose against a restriction that prohibits it. Support exact existing RFC 9457 pairs: 401 UNAUTHENTICATED (Bearer challenge), 403 FORBIDDEN, 404 NOT_FOUND / Not found / urn:wheelwright:problem:not_found, 422 INVALID_REQUEST with nonempty invalidParams, 500 INTERNAL_ERROR, 503 CAPABILITY_UNAVAILABLE. Valid-unheld detail states no canonical direct quote is held for the decoded canonical subject, not the transport token. Header/problem request IDs remain separate from observation identity.

Add encoded-token/collision/invalid-escape/error specimens and validate against these schemas. Diff parsed OAS to prove only the new path and bounded components are added; old POST and collection GET schemas/behavior remain unchanged. No machine-readable OAS is amended in this proposal turn.

## 8. Acceptance and next bounded handoff

After design acceptance and separate runtime handoff:

1. Implement E/D with shared normative specimens and independent Java/Node property tests. Prove the laws across the complete alphabet, sampled lengths 1–32, exhaustive short strings, 96-character boundary, collision fixtures and every malformed/over-escaped category. Assert case-sensitive canonical tokens and no repairs.
2. Run real embedded-container tests with unchanged defaults and the intended authenticated held-quote controller, not only a routing echo probe. Prove SPY, BRK/B, literal BRK_2FB, caret and repeated/dot-slash identities reach only the intended route and yield exact canonical storage keys/response subjects. Invalid tokens reach auth-before-422 without storage; raw percent-slash remains rejected without dispatch. Verify the connector still has its baseline reject policy.
3. Prove the original unrelated Decision `A%2FB` path is rejected with no storage call, and ordinary legacy underscore IDs are not codec-decoded. Preserve collection/POST auth and request behavior, including collection-query 422. No global routing/security change is permitted.
4. Continue the already specified independent SQLite/strict decoder/API/CLI/purity/registry/manual/mixed-outcome acceptance. Encoding is before request only; validation/projection and stored canonical identity are unaffected. No market acquisition or BUG-029 remediation.

No genuine codec choice remains after applying the Principal direction to the existing subject alphabet. This is a decision-complete proposal, not runtime authority or a claim of container acceptance. No Product artifact edits, production code, authoritative OAS changes, commit or push occur in this turn.

## 9. Accepted implementation and preservation proof

The Principal accepted these rules and resumed the bounded implementation with a preservation-first gate. `HeldQuoteCodecTransportTest` passes against the installed application Tomcat and actual v2 quote / governed-decision controllers. Connector encoded-solidus handling remains `reject`. Valid codec tokens reach the intended quote route, decode once and look up exact canonical subjects, including literal underscore collision and caret identities. Malformed tokens fail authenticated validation, and unauthenticated calls retain the existing auth boundary. Encoded solidus still fails at the container on the unrelated route, with no controller/storage dispatch. Existing collection auth/query interpretation is preserved. The new OAS only adds the instance GET and its independent encoded-symbol/problem schemas; accepted POST, collection and old schemas compare equal to baseline.

[Acceptance evidence](../cli/ww-show-acceptance-2026-10-05.md) records the passing current-design gate and the separately preserved intentionally failing BUG-030 reproduction. No rejected query endpoint, double encoding, extra URI decoder or global connector override exists.

CURRENT STATE: Reconciled transport design accepted, implemented and preservation-tested; Product remains frozen.

DECISION REQUIRED: NO

NEXT AUTHORIZED ACTION: Principal manual acceptance / independent review of this bounded implementation.
