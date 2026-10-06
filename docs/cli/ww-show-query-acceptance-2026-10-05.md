# Held ETF quote queries and human tables — October 5, 2026

**Status:** Implemented and verified for the Principal-authorized bounded CLI slice; automated verification and live held-read observation are evidence, not independent review or Principal manual acceptance.
**Baseline:** clean, remote-verified main `9370ca018b9878d9791e390d5a204ccb557d8178`; Gate Experiment 001 staged/inactive.
**Authority:** Principal explicitly accepted the prior investigation and authorized Product amendment, Solution Design, implementation, verification, documentation, commit and push, then added semantic human colors as a continuation of the same scope. [Product section 14](../contracts/api-v2-subject-show-held-quote.md) and [Solution Design section 15](../design/ww-show-held-quote-solution-design.md) record exact grammar before implementation. No new API/backend or acquisition work.

## Question-driven result

Legitimate question -> existing governed capabilities -> pipeline friction -> missing deterministic primitives -> minimal porcelain -> same question rerun:

```sh
ww show --quotes --where type=ETF \
  --sort-by reportedChangePercent --absolute --descending \
  --limit 10 --all-fields --table
```

The complete horizontal human table has one observation per row and all 36 installed public fields. Explicit --table preserves human output through a pipe; use `| less -SR` for horizontal scrolling and ANSI rendering. Default TTY selects human output; default redirected output remains canonical TSV. Add --tsv or --jsonl for machine presentation (mutually exclusive with --table).

`--where FIELD=VALUE` is typed exact match, repeatable AND, not a query language. Missing values never match. Filter then sort then limit, after strict complete inspection of every selected subject. Sort keys need not be projected. --sort-by uses installed public vocabulary; magnitude is only a comparison key; missing stays last, ties preserve selected order, positive limits bound output not reads. No “today,” freshness, trading suitability or market-universe interpretation is inferred.

## Implementation / integrity boundary

Only bounded CLI/parser/registry/presentation and acceptance helpers change. Existing complete inventory plus sequential complete instance GETs are reused. Each request is bodyless, authenticated quote.read, no query parameters, redirect/retry/POST/provider/v1/repair/substitution. Selected population is complete inventory symbol order or explicit normalized first-occurrence subject order. Independent committed-row reads imply no cross-subject snapshot or observation-version pin. 1+M collection requests, O(M) retained observations, O(M log M) sort; limit cannot claim a smaller inspected population.

Strict JSON reader, full canonical validator, safe singular client, path codec, backend strict persisted decoder, OAS, auth and database code remain unchanged. Numeric keys compare normalized decimal coefficient/exponent, never Number; fractional instants preserve precision beyond milliseconds. Machine numeric lexemes, timestamps, omissions, TSV escaping and public JSONL schema remain exact. Registry kind/type metadata drives filters/sorts/formatting and generated semantic manual, with the same 36 fields and local --fields catalog.

Ordinary explicit-subject show preserves intentional streaming partial stdout and existing verbose complete FIELD/VALUE structure. Query reads buffer until every selected subject is accounted for. Failures are identified stderr, final exit 1; aggregate diagnostics explicitly state that filtering/ranking/limit cover only successful reads. Malformed observations a filter would exclude still fail; inventory failure emits no result records. Clean EPIPE and output failure conventions remain.

## Human color reference and behavior

Before color implementation, inspected `tastytrade.mjs`, `tastytrade-live.mjs`, `tastytrade.test.mjs`, and root README. `tt live` chooses human color via `color: !command.tsv`, independent of TTY; tests explicitly prove pipe color and ignored NO_COLOR. It uses ANSI 32/31, restores white 37 and finally resets. It has no shared helper, palette, FORCE_COLOR/TERM/capability detection. README documents `watch -c`; local watch help confirms -c interprets ANSI. These command-specific trade renderers were not imported or modified.

Show adopts human-presentation-over-TTY selection and 32/31 colors. Only reportedChange/reportedChangePercent are sign-colored; all other fields use default foreground, restored with 39 after each colored cell. Positive signs and percentage-point units are preserved. Padding is calculated on escaped plain text before ANSI. Nonempty NO_COLOR or TERM=dumb disables color, including --table; empty/unset NO_COLOR does not. NO_COLOR behavior follows [the conventional nonempty-variable policy](https://no-color.org/) retrieved October 5. No color options/palettes or tt behavior changes.

```sh
watch -c 'ww show --quotes --where type=ETF --sort-by reportedChangePercent --absolute --descending --limit 10 --all-fields --table'
```

The watch capture pipe does not suppress explicitly requested human color. Automatic machine redirection and explicit TSV/JSONL never receive ANSI decoration. Deterministic PTY watch verification uses mock held GETs, changes a positive observation to negative, and exits on stable output. The existing PTY helper gains optional --stdin-tty because interactive watch cannot use its original /dev/null stdin; default capture behavior is unchanged.

## Deterministic verification

```sh
node --test scripts/ww-show-query.test.mjs scripts/ww-show.test.mjs \
  scripts/ww-ls.test.mjs scripts/ww-fetch.test.mjs scripts/wheelwright.test.mjs \
  scripts/tastytrade.test.mjs
node scripts/ww-fetch.acceptance.mjs
node scripts/ww-show-man.mjs --check
node --check scripts/ww-show.mjs
node --check scripts/ww-show-fields.mjs
node --check scripts/wheelwright.mjs
python scripts/ww-show-oas-validation.py
python scripts/ww-ls-oas-validation.py
npm --prefix options-prototype run generate:roadmap-projection
npm --prefix options-prototype run check:roadmap-projection
git diff --check
```

**87/87 Node tests pass**: 15 new query tests, 48 existing ww regressions, 24 tt compatibility tests. Coverage includes all requested selection/projection/formats, early conflicts/invalid limits/typed literals, exact AND filters/type=ETF/OTHER/empty-versus-missing, filter-before-sort-before-limit, all-field horizontal completeness, ordinary/absolute/directional/unprojected/missing/tied ordering, exact decimals beyond 2^53/extreme exponents, sub-millisecond instant ordering/equality, adaptive decimal rounding/no apparent zero/exact counts, signed percent/absolute change, color-only-change and alignment, NO_COLOR/TERM, TTY/pipes/actual watch, canonical machines, strict excluded-malformation failure, buffered top-N completion, partial success, inventory failure, empty results, clean pipes and output failures. Existing explicit-subject/--only/--fields/verbose/TSV/JSONL and isolated-install behavior passes.

**Fetch deterministic shell/PTY acceptance: 10/10**, zero legacy/chain requests. No live acquisition. Fixture GET allowlists reject provider, POST, v1, query or fallback paths for show. New tests never open/modify live persisted evidence.

OAS checks pass in an isolated temporary Python environment (PyYAML/jsonschema/openapi-spec-validator), validating the existing generated 25 detail and 62 inventory HTTP specimens and accepted POST/collection preservation. These are compatibility checks against previously generated backend evidence; no new backend implementation/Java acceptance claim is made. The default Python lacked dependencies; the isolated environment resolved that tooling prerequisite without repository dependency changes.

The prior human-header assertion was updated only from CHANGE to the explicitly accepted CHANGE %. The initial watch capture failure was the test helper's noninteractive stdin, not a Wheelwright defect; terminal-input capture now proves actual color rendering. No new intended-contract defect was demonstrated.

## Live held-read observation (separate from deterministic tests)

Read-only local invocation returned exit 0, empty stderr, ten ETFs with all 36 fields. First usable observation completed in approximately 0.74s. Follow-up table/TSV/JSONL probes completed in approximately 0.78/0.69/0.73s. Colored table carried 14 green and 6 red change-cell spans (two change fields across ten rows); TSV/JSONL had no ANSI. Table/TSV both had 36 columns.

Observed order and canonical reportedChangePercent:

| Subject | Percentage points |
|---|---:|
| CBRG | 17.45 |
| SPCH | 14.99 |
| SSPC | -14.97 |
| EWZ | 12.55 |
| WDCX | 12.02 |
| AAOX | 10.54 |
| IRE | -6.32 |
| MSTZ | -5.63 |
| CONL | 5.26 |
| CORD | 4.9 |

These are held facts at observation time, not session/date certification or ongoing expected rankings. No live provider acquisition, restart, credential change, database repair or evidence mutation occurred. Current scale did not falsify existing API composition; batch/detail APIs remain future evidence-driven work.

## Closeout / remaining boundary

Existing PL-CLI-01/PL-API-03 state, journal why-state, authority index, command manuals and generated Roadmap are reconciled together. No new intake, Bet, horizon, engine, principle, bug or API/OAS change. Coming Soon remains truthful and unchanged. BUG-028/030 and all unrelated work remain untouched. The Principal authorized commit/push for this slice; completion does not imply manual acceptance or independent reviewer disposition.
