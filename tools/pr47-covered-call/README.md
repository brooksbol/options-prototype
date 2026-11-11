# PR47 buy-writes and Friday rolls

The Principal approved the execution plan for implementation candidate 1e0643cd on November 10, 2026 Mountain time, choosing option A. Independent code review is pending. Broker placement has not been exercised by this candidate. The retained Webull Sandbox sender, readers, pacing protocol and provider workers supply the execution mechanics.

## Execution sequence

1. PR46 executes first. PR47 monitors its accepted throughput, stalls, provider usage and actionable blockers through completion.
2. PR46's runner must exit and reconcile every original attempted submission. Its working and uncertain inventories must be explicitly accounted for. Both threads have recorded this dependency.
3. PR47 verifies the shared dependency receipt, final evidence locator and PR46 ledger. It acquires the existing PR46 runner/sender-control locks and original PR47 account/call writer locks for its own execution window. Read-only observers retain their existing schedule and share provider pacing.
4. After that handoff, refresh GRA5 identity, financial state, obligations, Tastytrade Greeks and Tradier quotes.
5. Wednesday November 11 entry targets 10 a.m. Eastern / 8 a.m. Mountain, conditional on PR46 finishing beforehand. A later handoff moves entry later that session. Nothing starts automatically.
6. Friday November 13 rolls target 10 a.m. Eastern / 8 a.m. Mountain.

The protected dependency record is at `~/Library/Application Support/Wheelwright/webull-paper-identity/pr46-pr47-continuation-dependency-20261111.json`. PR46 owns its completion fields. PR47 checks `READY`, observed runner exit, the actual final reconciliation file, and exact working/uncertain original-client inventories against the ledger. An incomplete handoff blocks entry.

## Wednesday orders

The frozen cohort contains 28 symbols from Portfolio's retained calendar at commit `c8fd0eb5d10f7a97bfa7e6f1040a8af576bbf742`.

For each name, buy 100 additional shares and sell one November 13 call in one `COVERED_STOCK` LIMIT DAY order through the Webull Sandbox API. The account must match the original native PR47 identity, Individual Margin classification and account-number suffix GRA5.

Select the call nearest +0.50 delta from fresh Tastytrade DXLink Greeks. Equal distances use the higher strike. Full listed-chain Greek coverage is required, as in the proven PR47 call path. There is no OTM-only guard or hourly-Greek fallback. Greeks retain their 120-second dispatch-age bound.

The buy-write limit is the qualified stock ask minus the selected call's positive bid, expressed as a net debit per share. One combo quantity represents 100 shares plus one call. A $209.00 net limit represents $20,900 before fees. Stock and call quote identities and timestamps are checked independently. A quote with a zero bid, invalid sizes, crossed prices, missing clocks or failed freshness is an explicit blocker.

The candidate composes PR46's current qualification function. Production Tradier receipt age must remain within five seconds and source ages/skew within 30 seconds. The market clock is cached for up to 30 seconds and independently requalified against the same open-session predicate. Final exact stock/option books are acquired once per dispatch attempt. Quote revalidation occurs after pacing and immediately before HTTP transmission.

## Funding and reservations

The complete remaining basket is priced before admission. Reserve gross stock purchase costs conservatively, retain full gross obligations on existing short puts, and inspect overnight stock and option buying power. Expected new premium is excluded from funding capacity.

Opening/closing financial observations must agree on position quantities, working orders and cash. Position values must reconcile to the broker's market value, and cash plus market value to NAV. Snapshot acquisition is bounded at 60 seconds. Dispatch uses a cut younger than 20 seconds, matching the existing PR46 financial-book reuse interval.

A cash or buying-power shortfall blocks full-basket admission and reports its dollar amount. The initial observed account could cover the basket in cash. Margin borrowing beyond that remains unverified.

Each original client identity gets an exclusive durable attempt claim and a 100-share coverage reservation. A filled combo requires both exact order legs, a fill within its net limit and the expected stock/option position changes. The original account already has later-expiring calls and 28 Friday puts. Those remain in aggregate coverage and capital accounting.

Restart only unattempted names after every prior entry is position-reconciled. A working or uncertain prior entry keeps its reservation and requires read-only reconciliation. Ambiguous submissions retain their original identity and are never automatically resent.

## Friday orders

Screen only this experiment's position-reconciled short calls using qualified underlying midpoints. ITM means midpoint strictly above strike. OTM and exactly-at-strike calls remain unchanged. Unfilled or unresolved openings are reported separately.

For each ITM call, discover the symbol's next listed expiration after November 13 and require a standard call at the original strike. An unavailable original strike is a symbol-level blocker. Verify both exact Webull contracts and retained stock coverage.

Use one CALENDAR LIMIT DAY order with a buy-to-close leg and sell-to-open leg. Calculate new call bid minus old call ask. A positive result is a minimum net credit. A negative result is a maximum net debit, with no discretionary debit cap. Actual cash, put obligations, option buying power and outstanding reservations still constrain submission.

Webull rejected $0.00 limits on both BUY and SELL calendar previews. The Principal approved a $0.01-per-share net debit fallback when the calculation is exactly zero. That permits up to $1 per contract before fees. The fallback passed Sandbox preview.

Recheck ITM status, exact quotes and funding at dispatch. Working or uncertain roll orders retain reservations. Both legs and stock coverage must reconcile before recording a completed roll. Paired-order rejection does not automatically fall back to sequential legs.

## Expiration and delivery evidence

Opening stock delivery, option fills and positions have distinct recorded timestamps. Subsequent assignment/expiration requires an exact-contract OPTION_EA activity, strike cash where applicable, option removal and a consistent aggregate share bridge. Concurrent put assignment and call delivery are tracked separately.

An underlying-only lifecycle label cannot uniquely distinguish the Friday put from the Friday call. Such evidence remains UNRESOLVED. The candidate's lifecycle parser is deliberately bounded to exact-contract events until actual broker delivery evidence establishes an additional supported association.

## Commands

Use the established Webull SDK environment from this candidate's checkout.

```sh
PR47_PYTHON="$HOME/.local/share/wheelwright/webull-paper-identity/venv/bin/python"
PR47_DIR="/Users/bollich/kiro/options-candidates/pr47-buywrite-roll-20261110/tools/pr47-covered-call"

"$PR47_PYTHON" "$PR47_DIR/runner.py" observe
"$PR47_PYTHON" "$PR47_DIR/runner.py" plan-entry
"$PR47_PYTHON" "$PR47_DIR/runner.py" plan-roll
"$PR47_PYTHON" "$PR47_DIR/runner.py" benchmark
```

Execution commands are for the separately reviewed run on its authorized session.

```sh
"$PR47_PYTHON" "$PR47_DIR/runner.py" entry --reviewed-execution
"$PR47_PYTHON" "$PR47_DIR/runner.py" roll --reviewed-execution
```

No scheduler or installed PR46 release was changed. The operator/agent continues read-only `observe` until all accepted orders have reconciled dispositions. A financial cut changing while fills propagate can temporarily block an observation. Reacquire read-only evidence before proceeding.

Private state and raw evidence are retained under `~/Library/Application Support/Wheelwright/pr47-buywrite-roll-20261111/`. The source graph pins the reused immutable PR46 release and the external Tradier/Tastytrade helpers. It contains hashes and locators, with credentials and native account/order identities kept in protected local evidence.

## Verification and measured performance

- 37 focused tests pass, including a full simulated 28-order entry, Friday ITM/ATM/OTM screening, same-strike rolls, zero-net fallback, cash shortfall, unknown outcomes, durable-claim replay prevention and the proven sender's exact Sandbox bytes.
- Real read-only GRA5 observations passed the financial bracket. Real warm Tastytrade worker checks returned 54 CVX Greeks and 49 PG Greeks. The second request reused OAuth and the quote token.
- Real GRA5 previews accepted the buy-write, same-strike calendar credit/debit, and one-cent debit/credit cases. Both exact-zero sides returned HTTP 417 `OPENAPI_PARAM_ERR` for invalid limit_price. Preview evidence establishes request handling. Placement, fills and delivery for these new order forms remain to be verified during the reviewed experiment.
- Eight identical stock/option quote pairs were exercised through both request paths off-hours. The old path used 32 requests, 4 per sample, in 20.698 seconds. The new path used 9 requests, 1.125 per sample, in 5.888 seconds. These measurements cover the clock/quote request path and pacing. They exclude discovery and Greeks, and establish no accepted-order throughput improvement.
- Retained PR46 trading baseline was 109 acknowledgments over a 50.079-minute first-to-last dispatch span, 2.177/minute mean, 14/minute rolling peak, and 0.217-second median claim-to-acknowledgment. Its final claim/ack intervals had maximum overlap one. Local claim clocks differ from this candidate's new explicit HTTP-send measurement.

Each run retains startup-to-first-prepared/acknowledgment, accepted mean/peak rates, per-provider/per-route requests, requests per accepted order, worker-lock waits, file-lock waits, pacing waits, explicit HTTP sends and preparation-to-acknowledgment p50/p95. Acceptance, broker fill time, first observed fill and first position reconciliation are separately recorded. Actual trading improvements require the reviewed session's measured results.

Benchmark and preview raw evidence stay local. The execution plan is Principal-approved. The candidate awaits independent code review and the required PR46 completion handoff. The protected principal-approval.json record binds that approval to implementation commit 1e0643cdb04ed8a78a8a40b1240387c79e581cbc and preserves the dates, account scope, sequencing, strike rule and zero-net fallback.
