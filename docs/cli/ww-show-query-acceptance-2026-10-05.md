# Held ETF quote queries and human tables — October 5, 2026

**Status:** Principal manually accepted the bounded held-query/human-table slice at runtime commit `1cd3444af40ad1ae1dafa2c9332ace30a0ba9f3d`; end-of-session closeout records the acceptance below. Automated/provider-free evidence remains distinct from Principal acceptance and independent review.
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


## Manual rejection and bounded remediation — October 5, 2026

Principal manual acceptance at `4c2701ed9a03df579fec3928ef060bd37173b1ab` rejected complete-table verbose clocks and green non-change text; their terminal default is green. The preceding results document the original implementation and do not establish satisfaction of these two human requirements. Current authoritative defect lifecycles are [BUG-031](../bugs/BUG-031-show-complete-table-timestamps.md) and [BUG-032](../bugs/BUG-032-show-change-color-scope.md).

Correction: every horizontal-table timestamp uses existing compact local `Oct 5 18:00` formatting; verbose's detailed clocks remain. ANSI 32/31 surrounds only signed semantic change values; baseline and immediate restoration are white 37, including padding/separators/following cells/rows, with final reset 0 to restore the user's terminal. NO_COLOR and TERM=dumb disable all ANSI. TSV/JSONL and automatic machine redirection stay canonical and color-free. Only display code changes; strict persisted validation and query operations are unchanged.

Principal also directed DESCRIPTION immediately right of SYMBOL. The sole public registry is reordered SYMBOL, DESCRIPTION, TYPE, then remaining fields; Product vocabulary, --fields and generated manual stay synchronized. Complete TSV follows that governed registry order; ordinary nine-column output and exact --only order are unchanged. No public field semantics or JSONL shape changes.

Three additional regression tests plus strengthened existing assertions cover all five actual all-fields timestamp cells, canonical machine strings/calendar dates/missing values, semantic-only ANSI spans, inherited-green ordinary-white state, padding/separators/following prices/next rows, alignment, description placement and actual watch -c scope. Baseline before production edits: 13/18 pass, five failed corrected assertions. After remediation: 18/18 query tests pass. This is automated verification, not a claim of Principal manual rerun acceptance.


Final verification: **90/90** Node tests across show-query, show, ls, fetch, wheelwright and tastytrade. One initial concurrent run reported 89/90 with the unchanged legacy sort broken-pipe assertion; its isolated rerun passed 5/5 and the complete rerun passed 90/90. No unrelated remediation or established new defect follows from that transient test result. Deterministic local fetch acceptance **10/10** (zero legacy/chain requests), registry/manual check, JS syntax checks, existing detail OAS **25 specimens / 7 statuses**, collection OAS **62 specimens**, Roadmap regeneration/freshness and diff checks pass. OAS validation reused existing backend specimens; backend/runtime/OAS source remains untouched.

Held-only operational probe of the exact manual command returned exit 0, empty stderr, 10 rows and 36 columns. First-row clocks: LAST SOURCE EVENT `Oct 5 18:00`, BID/ASK SOURCE EVENT `Oct 5 17:59`, RECEIVED/COMMITTED `Oct 5 22:01`; headings start SYMBOL, DESCRIPTION, TYPE. All 20 change spans were whitespace-free. This is provider-free read observation, not acquisition or Principal visual acceptance. Coming Soon and Priority require no change; no new Product/architecture decision arises.

Manual rerun:

```sh
ww show --quotes --where type=ETF \
  --sort-by reportedChangePercent --absolute --descending \
  --limit 10 --all-fields --table
```

For a wide color-preserving pager, append `| less -SR`. For watch, retain `watch -c` with explicit `--table`. Nonempty NO_COLOR and TERM=dumb intentionally suppress ANSI, so ordinary text then follows terminal configuration.


## Principal acceptance and end-of-session closeout — October 5, 2026

The Principal explicitly said “accepted” after inspection of their Desktop screenshot `Screenshot 2026-10-05 at 10.51.17 PM.png`, then invoked the containing end-of-session protocol and authorized push. Accepted runtime is `1cd3444af40ad1ae1dafa2c9332ace30a0ba9f3d`, including the query/table implementation, BUG-031/032 remediation, DESCRIPTION immediately after SYMBOL and 12-character observation/acquisition ID suffixes in human horizontal tables. Full IDs remain in TSV/JSONL, verbose, canonical observations and filter/sort keys; suffixes are not guaranteed unique identities. The ID continuation passed 33/33 relevant show/query tests plus manual synchronization and Roadmap freshness checks.

The screenshot showed ten ETF rows ordered by absolute reportedChangePercent under `watch -c`, compact local timestamps, description placement, shortened IDs, change-only green/red values and ordinary white content. Principal acceptance closes the previously outstanding visual rerun for this bounded slice. It does not establish a rigorous “of the day” interpretation, freshness, trading suitability, global market completeness or acceptance of unrelated experimental CLI work.

Closeout began on clean, remote-synchronized main at the accepted runtime SHA; no unrelated in-flight files exist. Existing Product section 14 and Solution Design own the accepted behavior; BUG-031/032 retain canonical resolved lifecycles with Principal acceptance appended. No new bug, PL identity, Product/architecture decision, principle, priority or Coming Soon change is required. The earlier journal why-state already preserves the two rejected presentation assumptions, so no routine changelog entry is added there. Backend/API, strict persisted validation and acquisition paths remain unchanged. This closeout modifies documentation and regenerated Roadmap only, with no market acquisition.


Closeout verification on the accepted runtime: **91/91** Node tests pass across show-query, show, ls, fetch, wheelwright and tastytrade (including ID suffix boundaries and actual watch -c). Registry/generated manual synchronization passes; all 33 local links in changed documents resolve; Roadmap projection was regenerated from changed canonical bug/backlog state and its freshness check passes; git diff checks pass. Runtime is unchanged during closeout, so no backend/provider suite or live acquisition is performed. Canonical acceptance plus regenerated projection are committed/pushed together; final synchronized SHA is reported after remote verification.


## Post-acceptance watch no-wrap continuation — October 5, 2026

Principal reported the 10:59:40 PM screenshot: watch -c -w clipped the wide table, but ordinary text became green. Existing accepted watch -c composition did not test clipping. BUG-032 retains the same defect identity and records the new falsifier, source diagnosis, explicit “proceed” authorization and bounded fix. watch 4.0.7 resets its own foreground after clipping, so each colored horizontal data row must independently reassert white. This adds invisible SGR 37 only at row starts; semantic signed-value spans, canonical machines, query operations and strict reads remain unchanged. The new actual 60-column PTY watch -c -w test failed before production edits and passes after the fix; it checks white symbols after clipped headers/rows, green/red changes and zero, with fixture GETs only. No live acquisition or watch installation change.

Manual rerun: retain your existing query with `watch -c -t -w -n 6`. No-wrap intentionally hides right-edge overflow; `--table | less -SR` still provides full horizontal inspection. Previous Principal acceptance remains dated evidence; this bounded no-wrap continuation awaits its own visual rerun.


No-wrap continuation verification: **92/92** full relevant Node CLI tests pass; **34/34** show/query subset passes. Registry/manual synchronization, syntax, documentation links, regenerated Roadmap freshness and diff checks pass. Only one production line changes, adding the conditional white row prefix; no provider contact or runtime/watch installation change.


## Principal-ratified existing-flag semantics amendment — October 5, 2026

After viewing the 11:04:50 PM screenshot, the Principal clarified that the biggest movers should be selected by magnitude but displayed with gains above losses, most negative last. The earlier magnitude-interleaved ordering conformed to its accepted contract; this is a Product amendment, not a bug. Principal requested reassessment of existing flags rather than a new display-order flag, then ratified option A: sort-by chooses the field for both stages, absolute affects bounded membership ranking only, descending applies to ranking and canonical signed output order, and limit selects N before that final order. Without limit/with an oversized limit, all matches survive and absolute has no observable effect. Missing-last and original-subject-order ties remain in both stages. Formats share final row order and preserve values.

Example: -20%, +12%, -11%, +3% with absolute/descending/limit 3 now emits +12%, -11%, -20%. The unchanged ETF command expresses this directly. Production computes exact keys/original indices once, ranks absolute entries when bounded, takes N and orders retained entries canonically; ordinary nonabsolute sorting and unsorted limiting remain compatible. No API, provider, field, derived value, acquisition or new temporal interpretation. Prior acceptance remains dated evidence of the prior meaning; visual acceptance of this new ordering is separate.

Two new acceptance tests failed against the old ordering before production edits, then passed: exact membership and signed order in both directions, unlimited/oversized cases, stable cutoff/output ties, missing-last, beyond-Number precision, filtered collection population, unprojected sort key and identical horizontal table/TSV/JSONL order. Show/query subset passes 36/36, including strict-validation/partial-result and actual watch color regressions.


## Principal human venue-code labels — October 5, 2026

While the ratified ordering amendment was in progress, Principal asked for understandable bid/ask venue and exchange labels no longer than eight characters. Before design/implementation, inspected Tradier's official [Exchange Codes](https://docs.tradier.com/docs/exchange-codes) and [Quotes](https://docs.tradier.com/docs/quotes) documentation: exch is instrument exchange; bidexch/askexch identify side exchanges. The separate OPRA table has different meanings and is not used for underlying observations. A provider-qualified CLI presentation map expands the 23 documented underlying codes; examples P -> NYSEArca, Q -> Nasdaq, Z -> BATS. It follows the provider's published nomenclature, not inferred current venue membership or a newly resolved market identity.

Labels apply only to nonverbose human horizontal tables; the subsequent Principal categorical-color direction below supersedes their initial ordinary-white style. Unknown codes and other providers stay source text; missing cells stay missing. Verbose, TSV/JSONL, exact filters/sorts and canonical observations retain the original codes; aliases are not public fields or filter values. Field registry meaning/generated manual are synchronized. Two new deterministic tests failed against raw human codes before production edits and pass after: common P/Z/Q cells across projections, source immutability, ANSI scope/alignment, machine/verbose fidelity, canonical filter semantics, unknown/missing/provider fallback and <=8-character labels for all 23 published codes. This is authorized presentation behavior, not a defect record or API/provider change.


## Principal monetary and human-table style continuations — October 5, 2026

Principal directed prices/absolute change amounts to exactly two decimals, distinct known venue colors, yellow symbols, light-gray descriptions, orange LAST, separate TYPE colors, alternating full-width black/dark-gray rows, and descriptions truncated to first 40 characters plus ... when longer. After twice rejecting lighter backgrounds, the alternate gray is indexed 232 (#080808). Product/Design/manual/registry absorb these explicit directions. Sub-cent money can display signed 0.00; percentages remain adaptive. These amend presentation, not bugs, canonical values, field vocabulary or temporal semantics.

Deterministic coverage verifies decimal half-away-from-zero rounding/trailing zeros for every price/change field; source sign/color preservation; full canonical machines/verbose; provider-qualified <=8-character labels and 23 distinct scoped venue colors; yellow/gray/orange and all four TYPE colors; 40-character description boundary/Unicode/full machine text; black/232 full-row stripes; white before padding, background reset before newline; ANSI-free opt-outs/machines; and actual PTY watch -c -w categorical/stripe/change compatibility. Every style is presentation-only; exact canonical filters/sort/two-stage membership/output behavior and strict malformed-evidence handling stay governed.

This continuation is implementation/automated verification evidence. Prior Principal acceptance at 1cd3444 remains dated evidence of its then-current contract; visual acceptance of these later amendments is not claimed. No market acquisition or provider contact is performed.


Final continuation verification: **103/103** relevant Node tests pass, including **45/45** show/query tests and actual clipped watch proofs. Registry-generated manual, JavaScript syntax, 36 changed-document local links, regenerated Roadmap synchronization and git diff checks pass. Read-only held ETF acceptance returns 10 rows, empty stderr, five black/five indexed-232 stripes and the requested symbol/description/LAST/ETF foregrounds with NO_COLOR unset; the environment's NO_COLOR=1 correctly yields decoration-free output otherwise. No acquisition performed.

Principal's latest Desktop screenshot (11:26:27 PM) demonstrates the changed signed ordering and current yellow/gray/orange/categorical styles under watch -c -w across 90 rows. Principal considers negative red too dark; actor agrees and recommends brighter coral. Principal subsequently authorized brighter coral red (#ff5f5f, indexed 203) for both negative change fields; tests verify its value-only scope and actual watch composition. The screenshot is observation/feedback, not blanket acceptance of all amendments.

Final brighter-red rerun: 103/103 relevant tests still pass, including actual watch -c -w value-scope proofs; registry/manual, syntax, generated Roadmap and diff checks pass. Held ETF command emits brighter indexed-203 negative change spans and no old SGR31 spans, with empty stderr. Read-only; no acquisition.


## Principal manual acceptance of current styled table — October 5, 2026

Following review of the latest Desktop screenshot, Principal said “accepted.” This accepts the current implementation at `506fd0a23a2d192950f9d15c0a81ab76365e6741`, including two-stage absolute-magnitude membership with signed output ordering; compact human-local clocks; human-only provider venue labels and requested symbol/description/LAST/TYPE colors; full-width black/indexed-232 alternating rows; 40-character description excerpts; exact two-decimal human monetary rendering; and brighter coral negative change values. The red shade is indexed 203 (#ff5f5f), scoped to `reportedChange`/`reportedChangePercent`, reset before padding. The full query remains `watch -c -t -w -n 6 'ww show --quotes --where type=ETF --sort-by reportedChangePercent --absolute --descending --limit 10 --all-fields --table'`.

Current commit is already pushed and verified as `origin/main`. Closeout reran the full relevant CLI suite (103/103), manual/registry synchronization, syntax, Roadmap generation/freshness and diff checks; actual held inspection returned ten rows with empty stderr and the expected coral indexed spans, without acquisition. Machine output remains canonical and color-free. This visual acceptance does not establish regular-session “today,” data freshness, completeness/suitability, or independent reviewer disposition. It closes the manual-acceptance boundary for this authorized slice, not the broader PL-CLI-01/PL-API-03 items.
