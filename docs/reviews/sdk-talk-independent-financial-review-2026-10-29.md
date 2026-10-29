# Independent financial review — 2026-10-29

**Disposition: QUALIFIED.** The three currently retained reported round trips reconcile independently to native source evidence. This supports the bounded **reported matched closed-round-trip net P/L** calculation, including its estimated-fee qualification. It does not establish complete monthly, portfolio, tax-lot or brokerage-statement P/L. A reproducible quantity-comparison defect prevents unqualified acceptance of the general matching implementation.

Frozen target: `4ffd79653f6e4efd29034ca6ccf33f1bfdec9486`. Assigned installed financial/runtime source: `fe7077f5ca936bf8336a12e09272e089e47ddea2`. `git diff` confirms the examined financial projection/normalization classes, MCP transaction adapter and presentation/rounding files are unchanged between those revisions. Remote `refs/heads/main`, local HEAD and origin/main were independently observed at the frozen target during bootstrap. Installed process/JAR identity was not independently inspected in this review.

## Independence and authority

This reviewer did not implement or correct the candidate and did not read parent conversation. It recovered root/docs AGENTS, the A–F authority model, Codex role, known failures, governing evidence/backend and maintained Account/Position boundaries, principles, Product-first mandate/fitness controls, ADR-001/014/015/016/022/024, current task-plan direction and staged Gate001 state. Parking-lot and journal continuation sets were enumerated/searched; unrelated history was not exhaustively read. ASSIM-0002 remains open; this report does not invent Position/governance identity. Gate001 is STAGED, `experiment_started:false`, with mutation permission INACTIVE.

Principal direction recovered from the task plan specifies a closed-trade report with totals and deliberate detail disclosure. Existing monthly Production accounting is a different metric: premium recognition at receipt is not replaced by closed-round-trip recognition. Existing transaction lineage and Account isolation are reused. No new architecture is proposed here.

The author receipt was encountered while recovering scope/Principal wording; it is not independent proof. Neither author tests nor the author's original-reconciliation script were executed or used as the accounting oracle. This review used its own native-data calculations, controlled counterexamples and presentation/adapter probes. Source inspection naturally informed falsifiers; independence does not mean ignorance of source code.

## Material finding F1 — numeric-equivalent quantities are rejected

Severity: bounded correctness/availability defect; no incorrect amount demonstrated in the current three rows.

`ClosedTradeReport.java:71` compares quantity maps with `Map.equals`. Values are `BigDecimal` built without scale normalization at lines 63–67. Java equality distinguishes `1` from `1.0`, although these represent the same contract quantity. Both forms are valid source decimal lexemes admitted by `TastytradeTransactions.decimal`.

Exact reproduction is embedded in the independent `review.py`: one synthetic native contract, one earlier SELL_TO_OPEN Order of quantity `1`, one later BUY_TO_CLOSE Order of quantity `1.0`, identical Account/symbol/currency and no other events. The control with closing quantity `1` matches; changing only its textual scale to `1.0` returns unavailable association and withholds otherwise supportable P/L. `synthetic-checks.json` records `scale_equivalent_quantity_matches:false`. This is a false unavailable result, not evidence that the current retained row totals are numerically wrong. No correction was made to the frozen target.

## Independently established current numerical result

Read-only SQLite diagnostics inspected one tastytrade Account, 32 current observations sourced from two accepted retained originals. Each original's payload SHA-256 and byte length were verified locally. Current observation source-row lineage resolves exactly to the native transaction ID. No originals, private IDs, financial amounts or credentials were emitted into model context or written to review artifacts.

For all current records, independently applying native debit/credit effects reproduced normalized gross/net/commission values and quantity/price decimals exactly. For the report's three matched trades and 20 constituent legs:

- Native opening and closing Orders are distinct and unique per package. Exact native contracts balance signed quantities to zero. Native opening/closing actions agree; no other retained event touches those package contracts. No FIFO, partial-lot allocation, strategy membership or durable Position identity is inferred.
- Opening executions precede closing executions. Closing membership uses actual instants localized to America/Denver within October 1–29. Earlier opening basis is included. Synthetic midnight localization also passed.
- Summing native already-net cash once reproduces each backend row, the aggregate total and winner/loser/break-even counts exactly using Python Decimal independent of Java accounting. There is no double subtraction of fees.
- For each matched native leg, gross plus explicitly reported signed charges equals native net. This establishes no unexplained residual in these records; it does not prove omitted components are zero or final.
- Every matched native fee flag is estimated, and the report's qualified estimate status is appropriate. Missing/unknown estimate status is also conservatively classified estimated in a controlled probe.
- Source multipliers are absent in all matched legs. The calculation correctly uses reported monetary cash totals, without multiplying price/quantity by an assumed 100. This review does not certify a price-times-quantity reconstruction or adjusted-contract deliverable identity.

These conclusions concern the retained source cuts. They are stronger than simply repeating implementation arithmetic, but are not proof that the brokerage has supplied every relevant event.

## Falsifiers and boundaries

Independent controlled probes passed prior-month opening basis, partial-quantity refusal, same-Order partial-fill accumulation, ambiguous-opening refusal, reversal refusal, missing-net refusal, mixed-currency refusal, period-straddling close refusal, unresolved-close aggregate withholding, foreign Account rejection and empty-period unknown rather than zero.

Two additional exploratory negatives are preserved transparently:

1. Add an unrelated closing trade with unknown execution time to an otherwise matched report: the known matched subtotal remains available, with `unknownExecutionTimes` in coverage; it is not counted in `unavailableTrades`. This is compatible only with the explicitly selected **matched reported subset** metric. It cannot support “all this month's P/L” or the claim that every unresolved source row forces aggregate withholding. Code locations: `TransactionExecutionGroups.java:44`, `ClosedTradeReport.java:48`. A sole unknown-time close yields unavailable/empty results, not zero.
2. Artificially supply conflicting instrument types/multipliers for the same symbol: the matcher ignores that metadata. This is a limitation of the narrow source-native-symbol identity, not a demonstrated error in this source set; the actual normalizer never supplies a multiplier. A broader adjusted-contract/instrument identity claim is not accepted by this review.

Coverage remains `PERIOD_COMPLETENESS_NOT_ESTABLISHED`. A successful upper-cutoff traversal is not a verified lower bound or snapshot-consistency guarantee. September zero P/L, full-month completeness and all-Account totals are unproven. Fidelity has an explicit unsupported-provider path for this report; retained activity existence does not establish native execution/Order association. No new brokerage records were acquired.

Account isolation was traced through the transaction controller's grant-before-read check and account-keyed SQL joins, with a controlled foreign-row rejection and independent MCP foreign-item refusal. This is scoped evidence, not a new full authorization/security audit.

## Drill-down and presentation

All returned opening/closing IDs resolve to distinct current observations and SHA-verified source rows in the selected Account. Source inspection verifies Account-scoped item lookup and MCP Account/transaction/correlation validation. Independent mocked MCP reads preserve the exact returned net decimal and reject foreign scope. No live item read was invoked because it can perform policy acquisition; real SDK selection and installed browser behavior are outside this review's independent evidence.

Independent presentation probes passed positive/negative half-away-from-zero cent rounding, exact large decimals beyond binary-safe integers, zero formatting, preservation of unrounded source values in details, estimated metric label and Denver close-date formatting. These are presentation checks, not a browser visual-acceptance claim. Backend totals sum exact unrounded values; independently rounded row displays need not add to the independently rounded displayed total.

## Reproduction and evidence

Independent detached worktree: `/tmp/ww-independent-review-20261029` at the frozen target; its source tree remained clean. Independent harness/evidence: `/tmp/ww-financial-review-evidence-20261029/`.

Reproduce with:

```sh
python3 /tmp/ww-financial-review-evidence-20261029/build.py
python3 /tmp/ww-financial-review-evidence-20261029/review.py
node /tmp/ww-financial-review-evidence-20261029/presentation.mjs
```

`build.py` copies the exact frozen three projection/normalization classes and compiles them with Jackson 2.18.2. Two minimal harness substitutes provide only SHA-256 and the cursor exception type; no financial function is replaced. `review.py` passes retained normalized observations locally to the frozen projection, keeps its financial output inside local process memory, and independently derives checks from original native rows. Its SQLite connection is `mode=ro`, `query_only=on`, transaction-scoped. The original-data run is reproducible only against still-available matching operational evidence; no immutable private database copy was created.

Aggregate/check-only receipts: `original-checks.json`, `synthetic-checks.json`, `presentation-checks.json`. Expected false exploratory checks are explained above and must not be described as all checks passing. Scripts contain only synthetic specimen values and source locators, not protected payloads. No author reconciliation/test was run, no external model/provider request occurred, no grants/services were changed and no unrelated worktree or dirty v1 file was touched.

## Acceptance boundary

Independent numerical verification: **PASS for the three retained qualified reported round trips**. General matching implementation: **QUALIFIED by F1 and stated source/coverage limits**. Complete monthly/portfolio/statement financial acceptance: **NOT ESTABLISHED**. Principal Product/financial acceptance: **not granted by this review**. Source corrections and any subsequent re-review require a new immutable candidate; this report does not authorize operations or rewrite the frozen submission.

CURRENT STATE: Frozen target independently reviewed; bounded financial calculation supported with qualifications and one reproducible false-unavailable defect.

DECISION REQUIRED: NO

NEXT AUTHORIZED ACTION: Return this immutable review to the commissioning actor for reconciliation.
