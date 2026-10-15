# WW Account Transaction History — Product and Technical Proposal

Date: October 15, 2026. Revision 2: Principal design-review clarification applied against `83561ab3ccf7040786e905fe1271882302b73f24`; original proposal remains recoverable there. Status: **PROPOSED; design refinement only, implementation uncommissioned.** Owning concern: `PL-CLI-01`, related `PL-PORT-01`, `PL-EVID-01` and `PL-CONV-01`. This proposal does not resume Position-convergence implementation, change EVA-001, or authorize operational acquisition, database migration, deployment or brokerage instructions.

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

**Human view:** terminal table by default; `--table` forces that view when piped. Show a compact heading such as `tt1 — tastytrade transaction history`, retained/new evidence status, as-of clock, covered interval and one concise coverage qualification. Proposed columns: `DATE`, `TYPE / ACTION`, `SYMBOL / DESCRIPTION`, `QTY`, `PRICE`, `VALUE`, `COMMISSION`, `FEES`, `NET CASH`, `CCY`, `ORDER`. Repeated broker order references make reported multi-leg records visible without grouping away individual transactions or naming a strategy. Non-trade rows retain their descriptions and absent instrument fields. Same-date events with genuine execution instants show those instants; date-only records stay visibly date-only. Dates are not synthesized from receipt clocks. Verbose includes uncut description, transaction/observation identity, source clocks, adjustment/reversal references and provenance.

**Color:** reuse the accepted Account/table visual precedents and shared formatting components rather than a separate history theme. Account alias cyan; tastytrade's established broker color; symbols yellow; descriptions light gray; neutral text bright/ordinary white; identifiers dark gray. Reuse alternating black/indexed-232 rows, alignment and reset discipline. Price may use the existing orange price treatment. Cash amounts stay neutral with explicit signs/labels: existing green/coral negative-change colors must not silently redefine deposits as profits or purchases as losses. Unknown cells are neutral `?`. Two-decimal human money follows existing rounding, with currency explicit; exact precision remains in machine/verbose output. Reuse `--no-color`, `NO_COLOR`, `TERM=dumb`, and explicit-table/watch behavior; no ANSI in TSV, CSV or JSONL. Existing surfaces differ on empty versus present `NO_COLOR`; compose the Account/Positions opt-out behavior (presence disables color) and test it explicitly, without modifying other commands.

**Machines:** automatic piped output is headerless TSV; explicit `--tsv` also forces it on a terminal. CSV has one header row and standard quoted cells/newlines, never comments or table decoration. JSONL has one transaction per line, preserving nested provenance and history context. All formats preserve Account identity, currency, original transaction kind/action, distinct dates, exact signed decimals, nullability, reversal status and source lineage. Decimal money/quantity fields use exact decimal strings in JSONL. Numeric-looking broker identifiers remain strings. CSV/TSV include explicit coverage/as-of columns on each record; JSONL includes the same context. Empty CSV has its header; empty TSV/JSONL has no transaction rows. A single stderr summary preserves coverage context even for empty output. No full brokerage account number is emitted by any ordinary format.

The CSV schema is a documented Wheelwright schema, not a claim to reproduce tastytrade's export byte-for-byte. Map and reconcile equivalent fields explicitly. Use proper CSV escaping, disable source text as terminal control sequences, and document that spreadsheet formula interpretation is outside lossless CSV semantics; do not silently alter source descriptions.

**Completion:** exit 0 means the entire bounded backend representation was validated/delivered and no required acquisition/admission work is incomplete. It does not mean independently proven lifetime coverage. Exit 1 means operational failure, incomplete acquisition or truncated delivery; exit 2 means usage/configuration error. Retained prior rows may accompany exit 1, clearly identified. Validate the complete response before ordinary stdout so a truncated response does not resemble a complete export. A downstream closed pipe follows the established EPIPE convention. No output file is silently described as complete after a write failure.

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
| V2 Account, authentication and grants | Stable Account IDs, backend-only broker binding, explicit financial access, masked account numbers. | One Account transaction-history capability needs an explicit scoped grant; holdings grants do not imply it. Internal acquire/read separation does not require two caller permissions. |
| `BrokerageArtifacts` and existing SQLite retention | Exact source bytes/hashes, retention before parsing, attempt lineage, failed-processing preservation and source-scope checks. | Fidelity activity admission matches observed rows; tastytrade currently admits holdings, not transaction pages. |
| `TastytradeClient` | Backend OAuth, secret exclusion, bounded body/deadline, redirect refusal, cancellation and safe diagnostics. | Add paginated transaction retrieval; do not reuse the holdings parser's single-page rejection or instrument restrictions. |
| ADR-015 and ADR-016 | Preserve evidence provenance and identity scope. | Fidelity `NormalizedTransaction.id` is a content fingerprint; assessment occurrence IDs are not durable brokerage transaction identity. Neither can be promoted to that job. |
| Account-domain facade/read-through in Doc 77 | One reusable backend Transaction collection for CLI/web/other consumers. | Need bounded historical acquisition, correction/reversal and collection-consistency semantics, not client-side broker pagination. |

This extends the Account Ledger evidence capability. It adds neither a fifth engine nor a generic event-sourcing, reporting, IAM or job framework. Existing Production economic-event rendering is a separate interpreted view, not the source of raw transaction truth.

## Backend and HTTP design

Principal-clarified domain hierarchy: **Authenticated User → Authorized Accounts → Account Transaction History**. A User may have explicit grants to several Accounts, and several Users may have grants to the same Account; this hierarchy does not turn the relationship into ownership or a one-to-many database constraint. Use:

```text
GET /v2/accounts/{accountId}/transactions
GET /v2/accounts/{accountId}/transactions/{transactionId}
```

Account nesting expresses the transaction history's selected Account context, not foreign-key topology. There is no global transaction collection and no demonstrated cross-Account search requirement. The token establishes User identity; backend explicit financial grants establish Account access; neither Account nor transaction ID grants authority. The CLI resolves `tt1`; REST accepts only canonical IDs and never a raw brokerage account number. Both list and instance reads authorize the path Account; an instance belonging to another Account fails closed even when its ID is known. Preserve existing Account IDs and many-to-many grants; no identity migration or User-nested route is proposed.

Default GET is a retained-first domain facade. Under separately configured and authorized backend evidence policy, it may retrieve/admit missing transaction evidence. An ordinary Operator need not coordinate a separate provider script or sync prerequisite. This is proposed behavior for the new capability only; existing pure-held contracts and `ww sync account` semantics stay unchanged. Provider access is read-only; GET cannot create/cancel trades or issue broker instructions.

History reuse/freshness belongs to backend Account-evidence policy. Do not import chain/quote TTLs or prohibit history revalidation merely because equity markets are closed: money movements, corrections and settlements have their own reporting behavior. A source's newest transaction time is not its last checked time; a recently checked collection may still have unknown source coverage. The first slice reports these facts separately.

**First-slice response:** one complete bounded collection representation, read from one consistent retained database view, with total count, coverage, acquisition outcome and as-of context. Reuse existing response-size/deadline protections. If the collection exceeds that capacity, return an explicit capacity failure; never truncate, introduce a hidden date limit, or claim the first N rows are history. This is a bounded usability limit, not a claim that one response scales indefinitely. Backend provider pagination is essential now; public API pagination is deferred until measured history size demonstrates need. At that point use a shared v2 continuation convention with stable-view and authorization semantics, not bespoke CLI/provider offsets. The CLI consumes Wheelwright results only.

Bounded read-through returns usable retained evidence plus the latest acquisition outcome, or explicit incomplete/unavailable evidence. Reuse existing acquisition synchronization/deadline mechanisms, scoped to this capability; serialize same-Account transaction admission and avoid holding a global database lock across provider calls. An interrupted first scan retains received source artifacts but does not replace the last successful projection. Initially a later attempt restarts the scan and reuses matching observations idempotently; durable pagination checkpoints are deferred. Exceeding the scan's admitted budget is visible incompleteness, not successful completion. No detached job, scheduler or public acquisition resource is introduced.

Use current v2 request correlation, standard Problem responses, private/no-store financial HTTP caching and OAS-first implementation. **Recommend one first-slice grant, provisionally named `account.transactions.read:ID`,** authorizing the Account history facade including its policy-bounded read-through. Existing `account.read:ID` still supports nickname discovery. A separate acquire permission has no independently valued Operator behavior in this slice and is withdrawn; granting history access does not authorize trades, forced refresh, changed admission policy or general artifact disclosure. Backend deployment policy independently controls provider availability, reuse, budgets and fallback. This is a proposed new scoped capability, not permission inherited from metadata/holdings grants and not a current grant configuration change. Split read/acquire only if a concrete later Product needs retained-only callers or separately controlled costly acquisition. Existing admin identity privileges do not bypass financial grants. Original source disclosure retains existing artifact permissions and all-source-Account authorization, including unknown-scope fail-closed behavior.

### Acquisition and persistence

1. Resolve authorized Account/provider binding in the backend. Establish the history request scope and an upper observation boundary; preserve the fact that an unbounded lower request is not a proven inception bound.
2. Retrieve every provider page without transaction-type/instrument filters. Validate schema, Account attribution, pagination continuity and count/duplicate diagnostics. Retain each response's exact bytes, safe request selectors, timestamps, hash and attempt/page lineage before normalization; credentials and private upstream URLs must not leak into ordinary API/log output.
3. Maintain stable opaque Wheelwright transaction identity separately from the provider key scoped by Account, broker/source and environment. Identical repeat observations reuse the same transaction and observation without duplicate cash events; acquisition lineage remains recoverable. A changed observation under the same source key is retained separately and linked to its predecessor; earlier original bytes survive. This minimal observation-version relation is necessary correction evidence, not a generic revision framework or public time-travel API. Distinct source transaction IDs stay distinct even with identical economics or order IDs.
4. Normalize kinds, cash effects and optional instrument facts without dropping unfamiliar ledger events. Missing mandatory facts leave an explicit unnormalized/qualified observation and prevent a fully normalized-coverage claim. Preserve unfamiliar fields in private original artifacts rather than leaking arbitrary raw payloads publicly.
5. After the complete scan validates, atomically admit its current projection and coverage/attempt outcome using an existing database transaction. Read that projection consistently. Failed/partial pages remain retained with attempt status; previous successfully admitted history stays readable. No separate publication-membership catalog is required initially. Absence from a later response is not deletion authority.
6. Reusable retained evidence avoids a full scan on every GET. When policy requires revalidation, first-slice acquisition is a bounded full available-history scan, with no unproven recent-overlap cutoff. Incremental windows and durable resume can be introduced only when latency/volume evidence warrants them and historical-correction limitations are explicit. No fixed freshness duration, request cap or overlap scalar is claimed ratified; these must be specified before any authorized live verification.

Offset pagination can drift while the source changes. Fixing an end boundary and checking counts/duplicates helps detect problems but does not prove snapshot isolation. Instability prevents an unqualified consistency claim. Reversals remain separate ledger entries with links; corrected revisions are not counted as extra cash events. Unresolved reversal relationships stay explicit. Do not deduplicate by order number, timestamp, symbol or amount, or collapse partial executions.

Candidate persistence reuses Account and immutable artifact identities and processing attempts. Add only the transaction/source-key mapping, observation links needed for changes/reversals, and acquisition scope/page lineage/coverage not represented by existing records. One database commit guards the admitted projection. Reuse existing attempt/processing records where they carry these meanings; their current holdings-only scope is not silently widened without design/tests. Exact additive schema/OAS remain unimplemented. No checkpoint table, public revision catalog, publication-membership store or generic event/job engine is a prerequisite.

### Scope classification

| Essential first slice | Invariant preserved | Safe deferral and trigger |
|---|---|---|
| Account-nested list/detail, single scoped history grant, backend-owned read-through | Many-to-many User–Account grants, identity confers no authority, no financial-admin bypass | Cross-Account search or split acquire grant only after a distinct Product requirement. |
| Full provider-page traversal, explicit scope/counts/outcome, bounded whole-response read | No truncation masquerading as success; provider pages are not asserted atomic | Public cursors only when complete collections exceed the proven response envelope. |
| Stable source-key mapping, exact original observations, change/reversal links, atomic admission | Idempotence, earlier source preservation, no cash-event duplication or inferred deletion | Public revision browsing and historical replay only for a specified analytical/audit use. |
| Bounded synchronous scan, retained fallback, restart safely on retry | Failure preserves last good evidence; limits and freshness are truthful | Durable checkpoints, incremental windows or async operation only after measured scan costs justify them. |
| Canonical transaction records and existing CLI projection/style | Brokerage evidence only; exact cash, instrument, time and provenance facts | Strategy reconstruction, realized P/L, tax and wheel interpretation belong to separate capabilities. |

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
- Reinspection verified the same source hash and found order-number multiplicities of four rows for four order references and two rows for one reference. That is reported linkage, not proof of strategy identity, atomic fills or economic lifecycle.

### Representative terminal and export specimens

[Sanitized design specimens](ww-history-specimens-2026-10-15/README.md) provide all 21 records in normal, colored, verbose, TSV, CSV and JSONL forms, plus retained/incomplete and empty cases. They preserve the reference's row/type/action counts, missing non-trade fields and order-reference multiplicities. Symbols, prices, cash amounts, IDs, exact timestamps and relationships are invented. They are not live output, a replay of private TT1 trades, or an implemented renderer.

Normal-view excerpt (full 21-row table is in [normal.txt](ww-history-specimens-2026-10-15/normal.txt)):

```text
tt1 — tastytrade transaction history | 21 records | RETAINED / REUSABLE
Observed Sep 29–Oct 15, 2026 | as of Oct 15 10:10 MDT
Provider traversal complete; source consistency / lifetime unverified
DATE (MDT)   TYPE / ACTION       SYMBOL / DESCRIPTION          QTY  PRICE     VALUE  COMMISSION   FEES  NET CASH  CCY  ORDER
09-29 09:00  Deposit             Synthetic opening deposit       0      ?  +4000.00           ?   0.00  +4000.00  USD  ?
09-29 10:01  Sell to Open        DEMO 261120P00095000            1   1.50   +150.00       -1.00  -0.12   +148.88  USD  s-order-01
09-29 10:01  Buy to Open         DEMO 261120P00090000            1   0.50    -50.00       -1.00  -0.12    -51.12  USD  s-order-01
09-29 10:01  Sell to Open        DEMO 261120C00105000            1   1.25   +125.00       -1.00  -0.12   +123.88  USD  s-order-01
09-29 10:01  Buy to Open         DEMO 261120C00110000            1   0.40    -40.00       -1.00  -0.12    -41.12  USD  s-order-01
```

The excerpt has four separate leg records sharing a reported order reference. It does not sum them or label a strategy. All cash values are neutral-colored, explicitly signed; categorical identity/price styling and alternating backgrounds follow the recovered palette. Fixed columns deliberately need horizontal viewing on narrower terminals: recommend `--table | less -SR`; do not hide fee/cash fields to make them fit. Unknown `?` differs from reported `0.00`. Human output keeps one concise context line rather than repeating qualifications per row.

Design-artifact verification passed: the private reference hash and order multiplicities were rechecked; all 21 synthetic records agree across TSV/CSV/JSONL; all 18 synthetic trade cash equations reconcile exactly; absent non-trade commission/order/price/multiplier remain absent; source hashes resolve; ANSI-stripped normal output matches plain text. The colored artifact was emitted through an actual PTY using `cat`; this is presentation of a synthetic artifact, not execution of `ww history` or a claim of native Terminal visual acceptance. These checks do not verify live transaction acquisition, persistence or security behavior.

`--verbose` supplies exact facts/source lineage for each transaction; it does not repeat the full history context per record. The specimen JSONL includes this context per record for independent machine interpretation, and flattened TSV/CSV preserve it in named columns. Empty TSV/JSONL carry no invented metadata transaction: stderr supplies the context. The specimen CSV has a header, the TSV does not, and JSONL has one object per transaction. No machine output contains ANSI or human signed-value decoration; signed decimal strings retain the exact canonical sign/value representation. Full schema and status names are illustrative for design review, not an implemented OAS contract.

The first Product acceptance test uses this same hashed export and TT1 history over its documented selection interval, after any authorized API acquisition. Compare all 21 occurrences using exact equivalent date/action/symbol/currency/cash/quantity/fee fields and a declared timestamp/rounding mapping. Order number is corroboration, not unique transaction identity. The CSV has no transaction-ID column: use multiset comparison, preserve ambiguity and report unmatched/extra/changed rows; no fuzzy one-to-one matching declared authoritative. A current API observation may legitimately contain later corrections; expose those rather than forcing the CSV to match.

Tests for implementation:

1. Reference CSV: all trades and money movements survive; signed amounts and missing commissions remain exact; supported option fields and raw actions round-trip; no accidental default trade filter. Verify the source hash before use. Use redacted structural fixtures for Git, with private reference verification locally.
2. Provider paging: more than one page, empty history, duplicate boundary items, changed totals, repeated/missing pages, late arrivals, failure on the final page, response capacity overflow and concurrent refresh. No capped/mixed-view result reports complete delivery. Cursor expiration tests belong to a later public-pagination extension, not this slice.
3. Identity/corrections: two genuine identical-looking fills, multiple fills on one order, changed fee on one transaction, linked/unresolved reversal and missing source ID. Repeat acquisition must not double-count.
4. Security: wrong User/Account, changed alias, guessed transaction ID/cursor, admin without financial grants, mixed/unknown original-source scope, embedded secrets and terminal-control text. No credentials or full Account number in ordinary output.
5. Arithmetic/time: exact high-precision decimals, multiple currencies, net-versus-gross fees, `--` versus zero, timestamp offsets, date-only events, unknown type and non-option transactions. Cash signs never imply realized P/L.
6. Product: genuine PTY capture of a sanitized mixed-history table beside current accepted Account/quote styling; plain and colored table, verbose, empty, long descriptions, narrow terminal, `--no-color`, `NO_COLOR`, `TERM=dumb`, `watch -c`, CSV quoting and Unix pipelines. Recompute an exported reference independently. Acceptance requires an arranged candidate with no Operator GUID/environment/wiring burden.

These are proposed falsifiers, not tests already implemented or an assertion of independent review. The CSV inventory/arithmetic checks above were performed; historical API equivalence remains untested.

## Principal review disposition

| Review item | Changed or retained | Unresolved / boundary |
|---|---|---|
| 1. REST resource model | Replaced the proposed global collection with Account-nested list/detail. Token → User; explicit grants → authorized Accounts; IDs select resources only. Many-to-many access retained. | Exact OAS schemas are still proposed; no existing routes/IDs changed. No global transaction-search Product is established. |
| 2. Permission granularity | Withdrew separate acquire permission. Recommend one Account history grant covering policy-bounded read-through; existing metadata and original-artifact permissions remain distinct. | Exact new grant name is provisional; no grants configured. A later independently valued retained-only/forced-acquisition behavior could justify a split. |
| 3. Read-through | Retained backend ownership of admission, reuse/freshness, provider pagination and ledger reconciliation; Operator uses one history command. | Provider guarantees, actual access, freshness and budget parameters need bounded verification under future authorization. |
| 4. Scope control | Added explicit first-slice/invariant/deferred classification; one bounded response, simple consistent DB read and atomic admission. Deferred public cursors, durable checkpoints, incremental windows, async jobs and general revision catalogs. | Full-history volume may require a later collection extension; capacity failure is truthful meanwhile. Minimal change/reversal/source lineage remains essential. |
| 5. Product presentation | Added complete sanitized 21-record output specimens, order-reference multiplicity, colored/normal/verbose/machine forms, empty and incomplete behavior. | No installed command, native Terminal acceptance or production schema is claimed. Narrow-terminal layout and exact human columns remain reviewable. |
| 6. Accounting boundary | Retained brokerage cash/fee/time/source facts only; no strategy labels, lifecycle linking, realized P/L, taxes or performance scores. | Future analytics require their own semantics and authority; reported order linkage is not strategy reconstruction. |
| 7. Existing strengths | Stable IDs, exact decimals, immutable originals, repeat idempotence, correction/reversal evidence, honest coverage/failure and brokerage-independent records all retained. | Source-specific mapping and coverage assumptions require fixtures and actual source verification before implementation acceptance. |

## Check against ratified v2 guardrails

Checked against [Doc 77](../77-api-v2-architectural-guardrails.md), especially its October 11 identity/Model A/source-disclosure clarifications and October 13 facade/read-through/uniform-interface clarifications, plus ADR-015/016. This is a design cross-check, not independent implementation conformance.

- **Domain hierarchy:** October 11 resource guidance rejects nesting justified merely by foreign keys; the Principal's present clarification establishes genuine Account-history context. Account nesting follows that Product relationship and preserves shallow noun resources. It does not redefine other existing independent resources or create User ownership restrictions.
- **Identity and authorization:** opaque stable Account/transaction identity, aliases in CLI only, existing IDs preserved, explicit User–Account financial grants, no admin bypass or account-number leakage. Account-path access is checked independently of instance identity.
- **Facade and single authority:** one backend representation supports all clients; internal retained/acquired differences and bounded freshness are explicit. No client provider-pagination/cache/ledger authority and no client-facing acquisition choreography.
- **HTTP and source evidence:** ordinary GET is read-through only under admitted policy and cannot issue broker instructions. Preserve standard Problem/correlation/private-cache conventions and exact retained source scope. A successful HTTP representation may still declare retained or incomplete acquisition; CLI status must reflect it.
- **Temporal and completion truth:** execution/transaction/settlement/receipt clocks remain distinct; page traversal does not establish lifetime coverage or upstream snapshot isolation. Complete bounded response or explicit capacity/failure outcome; no accidental unbounded collection or hidden truncation.
- **Conservation:** compose existing Account discovery, grants, artifacts, processing attempts, OAuth safeguards, SQLite transactions and CLI palette. New mapping/observation links solve the demonstrated transaction-identity gap; no generic event-processing architecture is introduced.

## Disposition

Proposed intake mapping: retain under `PL-CLI-01` with Account-history pressure on `PL-PORT-01` / `PL-EVID-01`; relate to `PL-CONV-01` without reopening its held implementation. Strategic disposition: supports existing trustworthy Account evidence, no new Bet/horizon proposed. Architectural disposition: bounded extension of the Account-domain facade and ledger, preserving backend authority. This is not a claim of completed Kiro reconciliation, ratified API/schema, accepted Product visuals or implementation permission.

Next authorized mode: review this Product/technical proposal. Implementation, real transaction acquisition, migration, installation and acceptance execution remain separate future work. EVA experiments remain parked.
