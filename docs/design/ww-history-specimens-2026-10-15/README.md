# WW History Presentation Specimens

**DESIGN ONLY.** These are representative rendered artifacts, not implemented `ww` output, brokerage observations, financial results or accepted Product visuals. The parent [proposal](../ww-history-product-and-technical-proposal-2026-10-15.md) owns the proposed semantics and review disposition. A temporary off-repository formatter produced these files; no runtime renderer, API, schema, migration or brokerage acquisition was implemented.

The private TT1 reference remains unchanged outside Git. Its verified hash and structural inventory are in the proposal. These invented examples preserve 21 records: 18 trades (seven Sell to Open, seven Buy to Open, two Buy to Close, two Sell to Close), two deposits and one balance adjustment. Four synthetic order references have four rows each; one has two. Money movements have no order, instrument, average price or multiplier and have unreported commissions. All rows preserve a reported quantity. Dates, symbols, IDs, descriptions, prices, money and links between opening/closing records are invented; only the counts, column shape and reference-presence patterns are carried over. Repeated order IDs show source linkage without strategy labels, aggregation or a claim of simultaneous execution.

## Views of the same 21 transactions

| Proposed invocation | Representative artifact |
|---|---|
| `ww history --account tt1` on a terminal | [normal.txt](normal.txt), full 21-row human table |
| Same, with normal human color enabled | [normal.ansi](normal.ansi), actual ANSI palette and alternating backgrounds; display with `cat` or `less -SR` |
| `ww history --account tt1 --verbose` | [verbose.txt](verbose.txt), all 21 transactions with full facts and source lineage |
| `ww history --account tt1` in a pipe, or explicit `--tsv` | [history.tsv](history.tsv), 21 headerless rows; [columns.json](columns.json) defines their order |
| `ww history --account tt1 --csv` | [history.csv](history.csv), header plus 21 rows, lossless flat schema |
| `ww history --account tt1 --jsonl` | [history.jsonl](history.jsonl), 21 objects, exact decimal strings and nested provenance/context |
| Machine diagnostic stream | [machine-stderr.txt](machine-stderr.txt), one context summary, separate from stdout |
| Failed revalidation with last good evidence | [incomplete.txt](incomplete.txt), stale retained evidence, explicit incomplete result and exit 1 |
| Successful empty history | [empty.txt](empty.txt), human empty state and machine/header behavior, exit 0 |

[synthetic-reference.csv](synthetic-reference.csv) uses the reference export's 21-column shape with invented data. Source provenance in the specimen points to this file and its real SHA-256, not to the private brokerage export. Synthetic Wheelwright/observation IDs illustrate stable identifiers; there is no provider transaction-ID column in the CSV, and these IDs do not demonstrate a way to derive authoritative identity from it.

`REUSABLE`, `STALE`, `COMPLETE`, `UNVERIFIED` and related values are illustrative design labels. As-of clocks are synthetic. Displayed traversal completeness is not a claim about real provider acquisition; it is paired with unverified source snapshot consistency and lifetime coverage. CSV/TSV flatten all transaction, source and history context fields; empty nullable cells correspond to JSON null, while reported zeros remain zero. JSON metadata uses native integers/booleans; financial values and external IDs retain strings. Normal and verbose output contain explicit unknowns; nothing fills absent commissions with zero. Reported money-movement totals stand independently and are not recomputed from a missing commission.

The color specimen uses the recovered Account/quote conventions: cyan alias, established tastytrade brand color, yellow symbols, light-gray descriptions, orange prices, gray identifiers, neutral signed cash, alternating black/indexed-232 backgrounds and reset sequences. No positive/negative cash value is colored as profit/loss. Machine files have no ANSI. On narrow terminals use horizontal viewing; no field is omitted to force a fit. A real Terminal screenshot and Principal visual acceptance are not claimed.

These artifacts permit design-level checks of counts, parseability, monetary arithmetic, cross-format field equivalence, lineage hashes and color placement. Passing those checks proves internal specimen consistency only; installed behavior, live source mapping, account security and acquisition fidelity remain unimplemented.
