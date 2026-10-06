# Subject detail read contract — API v2 / `ww show`

**Date:** October 5, 2026  
**Status:** THAWED for bounded Product reconciliation. The previously ratified single-subject semantics remain authoritative except where multi-subject cardinality may require amendment. Solution Design and runtime implementation are paused pending refreeze.  
**Authority:** Principal decisions following bounded Codex review against clean synchronized main `3ac333e7fea79ccd249015cda9f552994c30184b`; Doc 77 API v2 guardrails; existing v2 direct-quote acquisition and held-discovery contracts.  
**Related:** `PL-CLI-01`, `PL-API-03`, `api-v2-held-quotes-read.md`, `api-v2-direct-quote-acquisition-proposal.md`.

## 1. Product meaning

`ww show` is subject-first. The previously frozen grammar was:

    ww show SUBJECT [facets] [projection] [presentation]

A newly identified composition requirement has reopened subject cardinality. Product reconciliation must evaluate the generalized grammar:

    ww show SUBJECT... [facets] [projection] [presentation]

including natural shell composition such as:

    cat symbols.txt | xargs ww show

This thaw does not yet ratify multi-subject semantics; it records the Product-level omission that must be resolved before Solution Design continues.

The CLI is Wheelwright domain-language porcelain and does not mirror backend resource taxonomy merely because the API is resource-oriented.

For the first slice:

    ww show SPY
    ww show SPY --quote
    ww show --quote SPY

Bare subject view and explicit `--quote` have equivalent evidence content because canonical direct quote is the only participating evidence family in this slice. This does not redefine `show` as a quote command. Future chain, Decision, market, and position facets are out of scope.

> **Show returns the selected committed canonical observation for the named subject, preserving its identity, facts, and provenance. It never acquires, refreshes, or evaluates acquisition-reuse eligibility.**

A held quote remains readable when old, unenrolled, non-reusable for acquisition, from a persisted provider environment, or retained after failed reacquisition. Failed acquisition without a canonical holding creates nothing to show. Legacy chain-derived spot is never substituted.

## 2. Backing singular capability

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

## 3. Default subject projection

Interactive terminal output is a one-row table with headers. The selected default columns and order are:

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

## 7. JSONL presentation

`--jsonl` is the complete structured public canonical observation presentation. Machine timestamps, nullability/omission, numerics, and structure follow the public serialization contract rather than terminal placeholders.

`--only` with `--jsonl` is contradictory and is a usage error, exit 2. Wheelwright does not invent an ad-hoc projected JSON object shape.

`--verbose` does not cause JSONL to expose implementation-only state.

## 8. Argument ordering and usage

Ordinary options are position-independent when ordering has no semantic meaning. Therefore these are equivalent:

    ww show SPY --quote
    ww show --quote SPY

and ordinary boolean presentation options may likewise occur before or after the subject.

The comma-bounded `--only` argument removes the variable-length positional ambiguity discovered during review. No uppercase/ticker inference is used to discover where a projection ends.

Syntactically invalid CLI subjects are local usage errors, exit 2, before credentials or HTTP. Valid-but-unheld subjects reach the API and produce the 404 held-resource result.

## 9. Exit behavior

Existing Wheelwright convention remains:

- `0`: successful complete read.
- `1`: authentication, authorization, backend, transport, response, data-integrity, or output failure.
- `2`: usage/configuration error.

A normal clean broken stdout pipe retains the established CLI convention.

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

## 12. Explicit non-scope

This contract does not design future chain/Decision facets, market or position commands, generic query/filter/sort frameworks, hidden acquisition, provider fallback, or agent implementation. It does not authorize remediation of unrelated defects.

The malformed persisted source-event-time defect discovered during review is tracked separately under `docs/bugs/`. Strict `show` behavior must not conceal it.

---

## 13. Thaw notice — multi-subject cardinality

The Principal identified a Product-level omission during Solution Design: a subject-first command should be evaluated for natural multi-subject composition, including:

    ww show SPY QQQ
    cat symbols.txt | xargs ww show

The artifact is therefore thawed before implementation. This is not a defect and does not authorize runtime work.

All previously settled single-subject semantics remain the baseline and should not be reopened merely because cardinality is under review. In particular, held-evidence purity, strict decoding before projection, public field vocabulary, machine/human representation boundaries, authorization, and no hidden acquisition remain settled unless a demonstrated cardinality conflict requires a bounded amendment.

Product reconciliation is limited to consequences introduced by one-or-more subjects, including:

- accepted subject cardinality and any practical bound;
- input ordering and duplicate-subject semantics;
- mixed held/unheld/corrupt subject behavior and exit semantics;
- row/output ordering and multi-subject presentation, including verbose behavior;
- JSONL and TSV behavior across multiple subjects;
- whether the Product contract requires any multi-subject HTTP capability or leaves HTTP realization entirely to Solution Design.

The existing singular `GET /v2/quotes/{symbol}` section is retained as the previously ratified baseline, not as a decision that multi-subject CLI realization must perform one HTTP request per subject. Backend realization must not be changed until Product cardinality semantics are refrozen.

CURRENT STATE: The `ww show` Product/capability contract is THAWED for bounded multi-subject cardinality reconciliation. Previously ratified single-subject semantics remain the authoritative baseline.

DECISION REQUIRED: YES

NEXT AUTHORIZED ACTION: Reconcile multi-subject Product semantics, amend this artifact narrowly, refreeze it, then resume Solution Design. Runtime implementation remains unauthorized.
