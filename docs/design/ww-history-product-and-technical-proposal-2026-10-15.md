# WW Account Transaction History — Product and Technical Proposal

Date: October 15, 2026. Status: **PROPOSED; design only, implementation uncommissioned.** Repository baseline: `a0dcbc889d521ceeb43f8518317c5a7a8785dadf`. Owning concern: `PL-CLI-01`, related `PL-PORT-01`, `PL-EVID-01` and `PL-CONV-01`. This proposal does not resume Position-convergence implementation, change EVA-001, or authorize operational acquisition, database migration, deployment or brokerage instructions.

## Product outcome

The Operator can ask **what happened in TT1, across its available transaction history**, inspect an understandable chronological record, and export the same facts for independent examination:

```sh
ww history --account tt1
ww history --account tt1 --csv > tt1-history.csv
ww history --account tt1 --jsonl > tt1-history.jsonl
```

The Principal proposed the `history --account` grammar, requested machine formats consistent with other commands, the established human colors, and use of the newly downloaded tastytrade CSV as the testing reference. `--jsonl` follows the existing machine convention; this first slice does not introduce a competing `--json` alias or whole-document JSON mode. CSV is the requested additive format.

History includes trades and non-trade ledger activity: deposits, withdrawals, fees, distributions, interest, transfers, adjustments, expiration and assignment when reported. It is transaction evidence, not a Position snapshot, order-status history, tax report, strategy lifecycle, or calculated trading profit. A credit is not necessarily income; a debit is not necessarily a loss. No order/strategy grouping silently replaces individual transactions.

Default selection is the entire available Account transaction collection, oldest first, with no hidden recent-date cutoff or row cap. Deterministic tie ordering is display order, not inferred execution sequence. The first slice needs no filters or pagination flags for ordinary use. Broader filtering can later inherit the existing query conventions.

## Command and presentation contract

```text
ww history --account ACCOUNT
    [--table | --tsv | --csv | --jsonl]
    [-v | --verbose] [--no-color]
ww history --help | -h | --man
```

Reuse Account nickname discovery, exact Account grants, local argument validation before HTTP, help/man discovery, stdout/stderr separation, format conflict handling and broken-pipe behavior. Unknown or unauthorized aliases give ordinary human guidance, never a request to type a GUID. An omitted Account is a usage error rather than an implicit all-Account financial read. Repeated identical boolean/format flags are harmless; conflicting formats fail before acquisition. Bare help is local and needs no credentials.

**Human view:** terminal table by default; `--table` forces that view when piped. Show a compact heading such as `tt1 — tastytrade transaction history`, retained/new evidence status, as-of clock, covered interval and one concise coverage qualification. Proposed columns: `DATE`, `TYPE / ACTION`, `SYMBOL`, `QTY`, `PRICE`, `VALUE`, `COMMISSION`, `FEES`, `NET CASH`, `CCY`. Non-trade rows retain their descriptions and absent instrument fields. Same-date events with genuine execution instants show those instants; date-only records stay visibly date-only. Dates are not synthesized from receipt clocks. Verbose includes uncut description, transaction/revision identity, source clocks, adjustment/reversal references and provenance.

**Color:** reuse the accepted Account/table visual precedents and shared formatting components rather than a separate history theme. Account alias cyan; tastytrade's established broker color; symbols yellow; descriptions light gray; neutral text bright/ordinary white; identifiers dark gray. Reuse alternating black/indexed-232 rows, alignment and reset discipline. Price may use the existing orange price treatment. Cash amounts stay neutral with explicit signs/labels: existing green/coral negative-change colors must not silently redefine deposits as profits or purchases as losses. Unknown cells are neutral `?`. Two-decimal human money follows existing rounding, with currency explicit; exact precision remains in machine/verbose output. Reuse `--no-color`, `NO_COLOR`, `TERM=dumb`, and explicit-table/watch behavior; no ANSI in TSV, CSV or JSONL. Existing surfaces differ on empty versus present `NO_COLOR`; compose the Account/Positions opt-out behavior (presence disables color) and test it explicitly, without modifying other commands.

**Machines:** automatic piped output is headerless TSV; explicit `--tsv` also forces it on a terminal. CSV has one header row and standard quoted cells/newlines, never comments or table decoration. JSONL has one transaction per line, preserving nested provenance and history context. All formats preserve Account identity, currency, original transaction kind/action, distinct dates, exact signed decimals, nullability, reversal status and source lineage. Decimal money/quantity fields use exact decimal strings in JSONL. Numeric-looking broker identifiers remain strings. CSV/TSV include explicit coverage/as-of columns on each record; JSONL includes the same context. Empty CSV has its header; empty TSV/JSONL has no transaction rows. A single stderr summary preserves coverage context even for empty output. No full brokerage account number is emitted by any ordinary format.

The CSV schema is a documented Wheelwright schema, not a claim to reproduce tastytrade's export byte-for-byte. Map and reconcile equivalent fields explicitly. Use proper CSV escaping, disable source text as terminal control sequences, and document that spreadsheet formula interpretation is outside lossless CSV semantics; do not silently alter source descriptions.

**Completion:** exit 0 means every page of the selected published backend revision was delivered and no required acquisition/admission work is incomplete. It does not mean independently proven lifetime coverage. Exit 1 means operational failure, incomplete acquisition or truncated delivery; exit 2 means usage/configuration error. Retained prior rows may accompany exit 1, clearly identified. Validate/spool all pages before ordinary stdout so a late page error does not resemble a complete export. A downstream closed pipe follows the established EPIPE convention. No output file is silently described as complete after a write failure.

## Completeness is a supported claim with a scope

Keep these separate in the backend representation and human summary:

| Question | Proposed evidence/conclusion |
|---|---|
| Did Wheelwright traverse and admit the selected upstream result? | Traversal/admission complete, incomplete or not attempted, with requested boundaries and attempt identity. |
| What interval and kinds were actually requested/observed? | Requested interval, observed first/last event, filters (none by default), received/as-of clocks, and known gaps. Earliest observed transaction is not an account-opening date. |
| Were the provider pages a consistent historical result? | Provider snapshot guarantee when supplied; otherwise explicitly unverified, with stability diagnostics. |
| Does this cover the Account's lifetime? | Verified only with a supported inception bound plus source coverage/reconciliation evidence; otherwise unknown or a known limited interval. |
| Did our result match the reference export? | Separate bounded reconciliation result, source hash and comparison interval. No implication about periods outside that export. |

Use wording such as `All available broker transactions retrieved; lifetime coverage unverified`, rather than `Complete account history` after merely exhausting pagination. An unavailable source is different from a successful empty result. Missing records/types remain visible in reconciliation; no trade-only default can masquerade as all transactions.

## Recover and reuse before extending

| Existing precedent | Reuse | Proven gap |
|---|---|---|
| Installed `ww ls accounts`, `ww show positions`, historical Position catalog | Nickname resolution, human/machine conventions, retained evidence and honest clocks. | Positions and observation catalogs contain inventory, not a transaction ledger. |
| V2 Account, authentication and grants | Stable Account IDs, backend-only broker binding, explicit financial access, masked account numbers. | Transaction read/acquisition capabilities need explicit scoped grants; holdings grants do not imply them. |
| `BrokerageArtifacts` and existing SQLite retention | Exact source bytes/hashes, retention before parsing, attempt lineage, failed-processing preservation and source-scope checks. | Fidelity activity admission matches observed rows; tastytrade currently admits holdings, not transaction pages. |
| `TastytradeClient` | Backend OAuth, secret exclusion, bounded body/deadline, redirect refusal, cancellation and safe diagnostics. | Add paginated transaction retrieval; do not reuse the holdings parser's single-page rejection or instrument restrictions. |
| ADR-015 and ADR-016 | Preserve evidence provenance and identity scope. | Fidelity `NormalizedTransaction.id` is a content fingerprint; assessment occurrence IDs are not durable brokerage transaction identity. Neither can be promoted to that job. |
| Account-domain facade/read-through in Doc 77 | One reusable backend Transaction collection for CLI/web/other consumers. | Need bounded historical acquisition, correction/reversal and collection-consistency semantics, not client-side broker pagination. |

This extends the Account Ledger evidence capability. It adds neither a fifth engine nor a generic event-sourcing, reporting, IAM or job framework. Existing Production economic-event rendering is a separate interpreted view, not the source of raw transaction truth.

## Backend and HTTP design

Proposed canonical resources:

```text
GET /v2/transactions?accountId=CANONICAL_ACCOUNT_ID
GET /v2/transactions/{transactionId}
```

Account relationship lives in the representation and scoped collection filter, not a broker-number URI. The CLI resolves `tt1`; REST accepts only canonical IDs. The collection represents Account transactions, independently useful to many clients; it is not named after `ww history` or tastytrade transport.

Default GET is a retained-first domain facade. Under separately configured and authorized backend evidence policy, it may retrieve/admit missing transaction evidence. An ordinary Operator need not coordinate a separate provider script or sync prerequisite. This is proposed behavior for the new capability only; existing pure-held contracts and `ww sync account` semantics stay unchanged. Provider access is read-only; GET cannot create/cancel trades or issue broker instructions.

For large histories, first establish a shared v2 collection convention: bounded pages, opaque continuation tokens bound to Account/query/immutable published revision, stable ordering, total record count, coverage context and expiration behavior. Authorization is rechecked on every page; tokens grant no authority. A stale cursor fails explicitly rather than switching revisions. The CLI follows all backend pages automatically; it does not own provider offsets, transaction reconciliation or a shadow ledger. Backend pins one retained publication revision for export; this does not retroactively make the upstream multi-request acquisition atomic.

Bounded read-through returns a truthful state: usable retained revision plus latest acquisition outcome, or incomplete/unavailable with no fabricated history. Backend owns checkpoints and coalesces concurrent acquisition for the same Account/scope. If a full initial scan exceeds its admitted time/request budget, preserve progress and return explicit incompleteness; no detached work is implied. A later invocation resumes/revalidates backend-owned work. Do not introduce an asynchronous operation/resource until actual measured need justifies it; if selected later, it needs explicit identity/status/cancellation semantics. No arbitrary timeout/page limit is presented as a successful full history.

Use current v2 request correlation, standard Problem responses, private/no-store financial HTTP caching and OAS-first implementation. Proposed grants are `account.transactions.read:ID` and `account.transactions.acquire:ID`, plus existing `account.read:ID` for nickname discovery. A read-only caller may read retained history; missing acquisition authority yields an explicit retained/unavailable result, never implicit grant broadening. Existing admin identity privileges do not bypass financial grants. Original source disclosure inherits artifact all-source-Account authorization, including unknown-scope fail-closed behavior.

### Acquisition and persistence

1. Resolve authorized Account/provider binding in the backend. Establish the history request scope and an upper observation boundary; preserve the fact that an unbounded lower request is not a proven inception bound.
2. Retrieve every provider page without transaction-type/instrument filters. Validate schema, Account attribution, pagination continuity and count/duplicate diagnostics. Retain each response's exact bytes, safe request selectors, timestamps, hash and attempt/page lineage before normalization; credentials and private upstream URLs must not leak into ordinary API/log output.
3. Maintain immutable transaction observations. A provider transaction key is scoped by stable Account, broker/source and environment. Assign a stable opaque Wheelwright transaction ID separately. Identical repeat observations add lineage, not duplicate transaction rows. Changed observations of the same key become revisions, preserving earlier evidence. Distinct transaction IDs remain distinct even with identical economics or order IDs.
4. Normalize kinds, cash effects and optional instrument facts without dropping unfamiliar ledger events. Missing mandatory facts leave an explicit unnormalized/qualified observation and prevent a fully normalized-coverage claim. Preserve unfamiliar fields in private original artifacts rather than leaking arbitrary raw payloads publicly.
5. Publish a new Account history revision only when the intended acquisition/admission unit is complete. Failed/partial pages remain retained with attempt status; the previous successful publication remains readable. No deletion is inferred from absence in a later response.
6. Refresh a recent overlap for late postings/corrections and permit an explicit backend-policy full rescan. The overlap size is a provisional policy parameter to establish from provider evidence, not a claimed guarantee that old history never changes. On restart, revalidate the affected range instead of blindly trusting a saved offset.

Offset pagination can drift while the source changes. Fixing an end boundary and checking counts/duplicates helps detect problems but does not prove snapshot isolation. Instability prevents an unqualified consistency claim. Reversals remain separate ledger entries with links; corrected revisions are not counted as extra cash events. Unresolved reversal relationships stay explicit. Do not deduplicate by order number, timestamp, symbol or amount, or collapse partial executions.

Candidate persistence extends retained artifacts with history-attempt/page lineage, transaction observations/revisions and publication membership/coverage. Reuse existing Account and artifact tables; migrations are additive and preserve all old rows/IDs. The exact schema and shared cursor contract belong to the subsequent reviewed OAS/implementation design, not a silent change in this proposal.

### Money and dates

Backend owns signed monetary normalization, decimal arithmetic and fee components. Preserve reported gross value, net cash and commissions/fees with their effects and currency; validate supported reconciliation identities. Do not subtract fees again from a provider's already-net value. Missing commission is not zero. Preserve reported quantity, action, multiplier and price independently; do not multiply an already-total value by 100 or infer every instrument is an equity option.

Keep execution instant, transaction date, settlement date, source creation time and Wheelwright receipt time separate. Choose the chronological key from the documented transaction date/execution semantics, retaining precision and date-only qualifications; absence never falls back to receipt time as economic chronology. Currency conversion and tax/strategy P/L are outside the first slice.

## Primary provider feasibility evidence

The official [transaction collection](https://developer.tastytrade.com/reference/transactions/getAccountsAccountNumberTransactions/) documents a paginated Account ledger, date/type/instrument selectors, monetary effects and transaction identifiers. The [paging guide](https://developer.tastytrade.com/docs/guides/pagination-and-filtering/) documents offset pagination. [Transaction detail](https://developer.tastytrade.com/reference/transactions/getAccountsAccountNumberTransactionsId/) offers individual lookup. These support adapter feasibility, not verified TT1 access, lifetime retention, correction guarantees, atomic pagination or source-export equivalence. Some published examples contain placeholder values; fixtures must not treat every example value as valid financial evidence. No provider request was made for this design.

## Fresh CSV reference and acceptance specimens

The Principal downloaded the latest Downloads CSV from tastytrade during this session, stated it was account-unfiltered, and confirmed having only one tastytrade Account: **the export is TT1**. Record this as Principal-confirmed source attribution for this specimen, not a general filename-to-Account rule. It has no Account column. Keep the private source outside Git and do not reproduce its account-bearing filename or raw transactions in public documentation.

- Exact source SHA-256: `4987a78b44aa39f007167bdcd72825b8579f4bbf15a7ae6d8e5e5a47462d7958`; 4,283 bytes; 21 data rows; 21 columns.
- Observed event timestamps span September 29–October 15, 2026. The filename's wider selection interval does not prove transactions existed earlier or that this is lifetime history.
- 18 Equity Option trade rows: seven Sell to Open, seven Buy to Open, two Buy to Close, two Sell to Close. Three Money Movement rows: two Deposits and one Balance Adjustment. All rows report USD.
- All 18 trade rows satisfy exact decimal `Total = Value + Commissions + Fees` with the export's signed values. The three money-movement rows have `--` commissions, empty order numbers, price and multiplier; retain those absences. No identical full rows occur in this specimen.

The first Product acceptance test uses this same hashed export and TT1 history over its documented selection interval, after any authorized API acquisition. Compare all 21 occurrences using exact equivalent date/action/symbol/currency/cash/quantity/fee fields and a declared timestamp/rounding mapping. Order number is corroboration, not unique transaction identity. The CSV has no transaction-ID column: use multiset comparison, preserve ambiguity and report unmatched/extra/changed rows; no fuzzy one-to-one matching declared authoritative. A current API observation may legitimately contain later corrections; expose those rather than forcing the CSV to match.

Tests for implementation:

1. Reference CSV: all trades and money movements survive; signed amounts and missing commissions remain exact; supported option fields and raw actions round-trip; no accidental default trade filter. Verify the source hash before use. Use redacted structural fixtures for Git, with private reference verification locally.
2. Paging: more than one page, empty history, duplicate boundary items, changed totals, repeated/missing pages, late arrivals, failure on the final page, expired continuation and concurrent refresh. No capped or mixed-revision result reports complete delivery.
3. Identity/corrections: two genuine identical-looking fills, multiple fills on one order, changed fee on one transaction, linked/unresolved reversal and missing source ID. Repeat acquisition must not double-count.
4. Security: wrong User/Account, changed alias, guessed transaction ID/cursor, admin without financial grants, mixed/unknown original-source scope, embedded secrets and terminal-control text. No credentials or full Account number in ordinary output.
5. Arithmetic/time: exact high-precision decimals, multiple currencies, net-versus-gross fees, `--` versus zero, timestamp offsets, date-only events, unknown type and non-option transactions. Cash signs never imply realized P/L.
6. Product: genuine PTY capture of a sanitized mixed-history table beside current accepted Account/quote styling; plain and colored table, verbose, empty, long descriptions, narrow terminal, `--no-color`, `NO_COLOR`, `TERM=dumb`, `watch -c`, CSV quoting and Unix pipelines. Recompute an exported reference independently. Acceptance requires an arranged candidate with no Operator GUID/environment/wiring burden.

These are proposed falsifiers, not tests already implemented or an assertion of independent review. The CSV inventory/arithmetic checks above were performed; historical API equivalence remains untested.

## Disposition

Proposed intake mapping: retain under `PL-CLI-01` with Account-history pressure on `PL-PORT-01` / `PL-EVID-01`; relate to `PL-CONV-01` without reopening its held implementation. Strategic disposition: supports existing trustworthy Account evidence, no new Bet/horizon proposed. Architectural disposition: bounded extension of the Account-domain facade and ledger, preserving backend authority. This is not a claim of completed Kiro reconciliation, ratified API/schema, accepted Product visuals or implementation permission.

Next authorized mode: review this Product/technical proposal. Implementation, real transaction acquisition, migration, installation and acceptance execution remain separate future work. EVA experiments remain parked.
