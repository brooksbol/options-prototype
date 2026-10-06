# Subject detail read contract — API v2 / `ww show`

**Date:** October 5, 2026  
**Status:** Principal-ratified Product/capability contract; REFROZEN after bounded multi-subject and field-discovery reconciliation. Decision-complete for resumed Solution Design. Runtime implementation remains unauthorized.
**Authority:** Principal decisions following bounded Codex review against clean synchronized main `3ac333e7fea79ccd249015cda9f552994c30184b`; Doc 77 API v2 guardrails; existing v2 direct-quote acquisition and held-discovery contracts; explicit Principal ratification of multi-subject recommendation A after thaw at `a5428dfd6c3766b5a0c4c97a6fbe101276079209`, and field-discovery Product authority at `5c3a5131850022ecf8f67b4ad6e41e10dbe82e21`.
**Related:** `PL-CLI-01`, `PL-API-03`, `api-v2-held-quotes-read.md`, `api-v2-direct-quote-acquisition-proposal.md`.

## 1. Product meaning

`ww show` is subject-first. The ratified grammar is:

    ww show SUBJECT... [facets] [projection] [presentation]

including natural shell composition such as:

    cat symbols.txt | xargs ww show

For evidence inspection, one or more explicit subjects are required. The separate local discovery invocation `ww show --fields` needs no subject (section 6A). Normalize valid subjects to uppercase, deduplicate by first occurrence, and preserve that input order. No arbitrary 30-subject limit is inherited from acquisition. Any later practical bound must be explicit and reconciled rather than silently capping or truncating successful output.

The CLI is Wheelwright domain-language porcelain and does not mirror backend resource taxonomy merely because the API is resource-oriented.

For the first slice:

    ww show SPY
    ww show SPY --quote
    ww show --quote SPY

Bare subject view and explicit `--quote` have equivalent evidence content because canonical direct quote is the only participating evidence family in this slice. This does not redefine `show` as a quote command. Future chain, Decision, market, and position facets are out of scope.

> **Show returns the selected committed canonical observation for the named subject, preserving its identity, facts, and provenance. It never acquires, refreshes, or evaluates acquisition-reuse eligibility.**

A held quote remains readable when old, unenrolled, non-reusable for acquisition, from a persisted provider environment, or retained after failed reacquisition. Failed acquisition without a canonical holding creates nothing to show. Legacy chain-derived spot is never substituted.

## 2. Backing singular capability and HTTP realization boundary

The backing resource is:

    GET /v2/quotes/{symbol}

It is an authenticated, authorized, bodyless held-evidence read using `quote.read`.

- Valid, complete held subject: `200` with the complete canonical `QuoteObservation`.
- Valid subject with no canonical direct-quote holding: `404` Problem Details. The detail states only that no canonical direct quote is held for the subject; it does not assert that the market symbol does not exist.
- The Problem Details code is `NOT_FOUND`.
- Malformed persisted canonical representation: request-wide `500 INTERNAL_ERROR`; no partial or repaired observation.
- Existing authentication/authorization/capability-unavailable behavior remains.
- Correlation/request identity is distinct from observation identity.
- Replacement between an earlier `ls` and later `show` may legitimately produce a different observation ID.
- The singular read returns one complete committed row version and requires independent read isolation equivalent in purpose to the accepted collection reader.
- The read causes no provider/source/worker contact, acquisition, refresh, reuse evaluation, provider fallback, legacy substitution, or evidence mutation.

Strict decoding validates the complete persisted canonical observation before any CLI projection. Malformed required fields or malformed present optional fields fail the read. The reader does not substitute defaults, drop malformed fields, repair values, or fabricate timestamps/facts.

This singular resource remains the accepted capability baseline. Product does not prescribe how many HTTP requests realize a multi-subject invocation and does not require a batch HTTP capability. Solution Design selects the smallest coherent realization while preserving the per-subject outcomes and honest completion below. A singular request-wide 500 fails that subject's inspection; it does not invalidate successful inspections of other subjects.

## 3. Default subject projection

Interactive terminal output is a table with headers once and one row per successful distinct subject, in first-occurrence input order. The selected default columns and order are:

    SYMBOL  TYPE  LAST  CHANGE  BID  ASK  RECEIVED  PROVIDER  ENVIRONMENT

Canonical sources:

| Column | Canonical source |
|---|---|
| SYMBOL | `subject.symbol` |
| TYPE | `subject.securityType`, mapped to public CLI vocabulary |
| LAST | `facts.last.price` |
| CHANGE | `facts.reportedChangePercent` |
| BID | `facts.bid.price` |
| ASK | `facts.ask.price` |
| RECEIVED | `provenance.receivedAt` |
| PROVIDER | `provenance.provider` |
| ENVIRONMENT | `provenance.environment` |

`CHANGE` is the provider-reported percentage change in percentage points: canonical `0.62` renders as `+0.62%`. It is not absolute change, is not multiplied by 100, and is not recomputed from another fact.

Missing is never zero and never licenses substitution. Missing terminal cells render as `-`. Genuine zero renders as zero.

Human terminal timestamps render in the user's local timezone in compact readable form, e.g. `Oct 5 17:35`. Human numeric presentation may format values for readability without changing meaning or implying unsupported precision.

Redirected default stdout uses the same selected fields and order as headerless TSV. Missing fields are empty TSV cells, preserving field position including trailing empties. Machine timestamps and numerics retain canonical representations rather than terminal formatting.

## 4. Public CLI type vocabulary

Wheelwright CLI public vocabulary is:

- `EQUITY`
- `ETF`
- `INDEX`
- `OTHER`

The REST/wire model may retain `OTHER_UNDERLYING`; `ww` maps it to `OTHER`. This applies consistently to `ww` table, TSV, and JSONL surfaces. Existing CLI work may be retrofitted where needed to preserve this public invariant.

## 5. Verbose public view

`--verbose` means the complete useful **public** view, not implementation internals.

The current canonical public inventory includes subject identity; last/bid/ask prices and their supported sizes/venues/source-event times; open/high/low/close/previousClose; volume; reportedChange; reportedChangePercent; averageVolume; fiftyTwoWeekHigh/Low; description; exchange; observationId; provider; environment; acquisitionId; authorityEpoch; acquisitionPhase; optional regularSessionDate/feedIdentity; receivedAt; committedAt.

No field-specific timestamp may be invented where the canonical model lacks one. Last has no venue field. Acquisition phase is not freshness/admissibility. Missing feed identity is not reconstructed.

Across multiple subjects the complete public details remain grouped and clearly identified by subject, in first-occurrence input order, preserving tabular grammar. Failed subjects have diagnostics rather than successful detail groups.

## 6. Ordered projection: `--only`

`--only` is the public field-projection primitive.

Syntax:

    --only FIELD[,FIELD...]

Exactly one comma-separated ordered projection is supplied. It selects exactly the named public fields **and determines their output order**.

Examples:

    ww show SPY --only bid,ask
    ww show SPY --only ask,bid
    ww show --only symbol,last,bid,ask,receivedAt SPY

The first two are intentionally different projections. Option placement does not change semantics; `--only ... SPY` and `SPY --only ...` are equivalent.

`--only` never silently adds `symbol` or another identity field, including for multiple subjects:

    ww show SPY QQQ --only bid,ask

emits exactly two projected columns per successful subject. A caller wanting identity requests it explicitly:

    ww show SPY QQQ --only symbol,bid,ask

Public projection names are flat camelCase. `bid`, `ask`, and `last` mean their prices. Nested canonical paths are not the CLI projection grammar.

The bounded public vocabulary is:

    symbol,type,last,lastSize,lastSourceEventAt,
    bid,bidSize,bidVenue,bidSourceEventAt,
    ask,askSize,askVenue,askSourceEventAt,
    open,high,low,close,previousClose,volume,
    reportedChange,reportedChangePercent,averageVolume,
    fiftyTwoWeekHigh,fiftyTwoWeekLow,description,exchange,
    observationId,provider,environment,acquisitionId,authorityEpoch,
    acquisitionPhase,regularSessionDate,feedIdentity,receivedAt,committedAt

Unknown fields, an empty projection, malformed comma lists, or other invalid projection syntax are usage errors: exit 2 before credentials or HTTP.

`--only` with `--verbose` is contradictory and is a usage error, exit 2.

## 6A. Projection discovery and documentation synchronization

The public `--only` vocabulary is intentionally extensible without changing the core `show` command grammar. Wheelwright therefore exposes a first-class discovery surface:

    ww show --fields

`ww show --fields` lists the complete public field vocabulary supported by the installed `ww` version, with concise human-readable descriptions sufficient to identify each field. It is useful to both humans and agents and does not require a subject operand, credentials, HTTP, held evidence, or provider contact.

The field catalog is derived from the same authoritative public projection registry used to validate and render `--only`; it is not a separately maintained list. The catalog must therefore remain mechanically consistent with accepted `--only` field names.

The `ww-show(1)` man page is the durable semantic documentation for the command. It explains the meaning and correct use of public fields beyond the concise runtime catalog, including units, evidence/source semantics, temporal meaning, missing-value behavior, and material caveats where applicable. The man page is intended to be useful to both human operators and agents that need more than capability discovery.

The three surfaces move together:

> **Adding, removing, renaming, or semantically changing a public `ww show --only` field requires the authoritative projection registry, `ww show --fields`, and `ww-show(1)` documentation to be updated together.**

This does not require every future derived or experimental value to become a `show` field. Scripts remain a proving/composition layer; a value becomes part of the public `show` vocabulary only after its Product semantics are explicitly accepted.

`--help`, `--fields`, and `ww-show(1)` have distinct roles:

- `--help`: invocation grammar and concise option guidance.
- `--fields`: runtime discovery of the installed public projection vocabulary.
- `ww-show(1)`: durable semantic meaning and correct-use guidance.

## 7. JSONL presentation

`--jsonl` is the complete structured public canonical observation presentation. Machine timestamps, nullability/omission, numerics, and structure follow the public serialization contract rather than terminal placeholders.

`--only` with `--jsonl` is contradictory and is a usage error, exit 2. Wheelwright does not invent an ad-hoc projected JSON object shape.

`--verbose` does not cause JSONL to expose implementation-only state.

For multiple subjects, JSONL emits one complete successful public observation per LF-terminated line, in first-occurrence input order. Subject failures are identified on stderr; they do not create an alternate JSONL failure/envelope schema or placeholder observation.

## 8. Argument ordering and usage

Ordinary options are position-independent when ordering has no semantic meaning. Therefore these are equivalent:

    ww show SPY --quote
    ww show --quote SPY

and ordinary boolean presentation options may likewise occur before or after the subject.

The comma-bounded `--only` argument removes the variable-length positional ambiguity discovered during review. No uppercase/ticker inference is used to discover where a projection ends.

Syntactically invalid CLI subjects are local usage errors, exit 2, before credentials or HTTP. Valid-but-unheld subjects reach the API and produce the 404 held-resource result.

Validate the complete operand/option grammar before credentials or HTTP, including later operands. Bare `show` remains usage exit 2 with no implicit selector. In evidence-inspection mode, options apply to the invocation’s distinct subject set. The separate `ww show --fields` discovery form bypasses the inspection subject requirement and evidence/client dependencies.

## 9. Exit behavior

Existing Wheelwright convention remains:

- `0`: every requested distinct subject was successfully inspected and its requested presentation completed; or the local field-discovery presentation completed successfully.
- `1`: authentication, authorization, backend, transport, response, data-integrity, or output failure.
- `2`: usage/configuration error.

A normal clean broken stdout pipe retains the established CLI convention.

Mixed outcomes are independent subject inspections, not an all-or-nothing transaction. Emit successful observations, diagnose failed subjects individually on stderr, and exit 1 if any requested distinct subject fails. A valid-but-unheld subject and a corrupt holding each produce no success row or observation for that subject. Command-wide failures remain operational failures, never silent omission or complete success.

**Partial stdout is intentional even when the final exit status is 1.** Successful rows may already have been consumed downstream before another subject fails. Output is not atomic and previously emitted successes are not retracted. Strict validation is complete per observation before that observation is output; this does not require buffering/suppressing all subjects until the invocation succeeds. Every requested distinct subject must be accounted for as success or identified failure; unresolved/truncated subjects cannot disappear behind exit 0.

## 10. Machine missing-value semantics

Human placeholders do not enter machine representations.

- TSV uses an empty field for a missing projected value.
- JSON/JSONL uses the public schema's actual optionality/nullability semantics: omit or `null` as defined by the serialization contract.
- Empty string and numeric zero are never fabricated merely to occupy a missing value.

## 11. Acceptance obligations

Implementation must prove at minimum:

1. Bare subject and explicit `--quote` equivalence.
2. Boolean option-order equivalence.
3. Exact nine-column default table/TSV order and truthful missing-versus-zero behavior.
4. Local-time human timestamps versus canonical machine timestamps.
5. Percentage-point `CHANGE` semantics.
6. Comma-separated `--only` projection selects and orders exactly the named fields.
7. Early usage rejection for invalid projection, invalid subject, `--only --verbose`, and `--only --jsonl`, with no HTTP.
8. Complete JSONL public observation when JSONL is selected.
9. Strict full-observation validation before every projection.
10. Old, unenrolled, non-reusable, foreign-environment, and retained valid holdings remain readable.
11. Legacy-only and failed-without-holding subjects remain absent.
12. `quote.read` authorization, auth-before-existence disclosure, exact 404/500/503 behavior, correlation and no-store semantics.
13. Independent committed-row singular-read isolation under rollback/concurrent replacement.
14. Zero causal provider/source/worker contact and zero evidence mutation on all singular-read paths.
15. Safe symbol path encoding/routing, including accepted symbols containing `/`.
16. Existing POST, fetch, `ls quotes`, and `ls quotes --type` contracts remain unchanged except any bounded CLI retrofit needed to preserve public `OTHER`.
17. Multi-subject uppercase normalization, first-occurrence deduplication and input/output order, without inheriting acquisition's 30-subject cap.
18. Mixed held/unheld/corrupt inspections emit successes and identified stderr failures with exit 1; all-success returns 0 and all-failure emits no successful stdout records.
19. Partial stdout remains intentional under exit 1, including successful rows consumed before a later failure; no invocation-wide output atomicity claim.
20. Headers once for the normal terminal table, one successful TSV row/JSONL observation per distinct successful subject, and clearly identified verbose subject groups.
21. Multi-subject `--only` outputs exactly the named fields in the named order, without implicitly appending symbol.
22. `ww show --fields` succeeds without subjects, credentials, HTTP, holdings or provider contact and discovers every installed public projection field with a concise description.
23. Projection validation/rendering and runtime discovery derive from one authoritative public field registry, with no separately maintained catalog.
24. Registry, runtime catalog and `ww-show(1)` field semantics stay synchronized when public fields are added, removed, renamed or semantically changed; help retains its separate concise invocation role. Experimental/derived script values do not enter the vocabulary without accepted Product semantics.

## 12. Explicit non-scope

This contract does not design future chain/Decision facets, market or position commands, generic query/filter/sort frameworks, hidden acquisition, provider fallback, or agent implementation. It does not authorize remediation of unrelated defects.

The malformed persisted source-event-time defect discovered during review is tracked separately under `docs/bugs/`. Strict `show` behavior must not conceal it.

---

## 13. Multi-subject ratification and refreeze

The Principal identified a Product-level omission during Solution Design: a subject-first command should be evaluated for natural multi-subject composition, including:

    ww show SPY QQQ
    cat symbols.txt | xargs ww show

Commit `a5428dfd6c3766b5a0c4c97a6fbe101276079209` thawed the artifact before implementation. The omission was a Product reconciliation concern, not a defect.

The reconciliation preserved all previously settled single-subject semantics, including held-evidence purity, strict decoding before projection, public field vocabulary, machine/human representation boundaries, authorization, and no hidden acquisition.

Following bounded Codex reconciliation, the Principal explicitly ratified recommendation A, with intentional partial stdout made explicit. The accepted package is:

- One or more explicit subjects; no arbitrary acquisition-limit inheritance.
- Uppercase normalization, first-occurrence deduplication and input order.
- Independent subject outcomes: successful stdout, identified failures on stderr, exit 1 if any subject fails.
- Intentional non-atomic stdout; already consumed successful rows remain useful under final exit 1.
- One normal/TSV row or complete JSONL observation per successful distinct subject; verbose detail grouped and identified by subject.
- Exact `--only` projection without an implicitly added symbol.
- No Product requirement about HTTP request count or a batch capability; realization belongs to Solution Design.

The Principal’s field-discovery addition at `5c3a5131850022ecf8f67b4ad6e41e10dbe82e21` is preserved in section 6A. The catalog is independent of subject cardinality and held evidence; it discovers the same public vocabulary used by every subject’s projection. The Product contract is refrozen coherently with both additions. All other settled single-subject semantics remain authoritative. Solution Design resumes; runtime implementation and BUG-029 remediation remain unauthorized. No further Product exploration is required by this refreeze.

CURRENT STATE: Principal-ratified multi-subject `ww show` Product/capability contract is refrozen and decision-complete for Solution Design.

DECISION REQUIRED: NO

NEXT AUTHORIZED ACTION: Prepare the bounded implementation handoff against the refrozen Product contract and decision-complete Solution Design. Runtime implementation remains unauthorized.
