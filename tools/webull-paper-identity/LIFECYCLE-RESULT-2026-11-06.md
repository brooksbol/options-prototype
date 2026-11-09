# CAT put lifecycle / expiration checkpoint — November 6, 2026 Mountain

**Result: Case C — UNRESOLVED expiration/assignment outcome. Both opening option
fills and their net cash credits are demonstrated. Physical assignment is not.**

Continuation of draft PR #46 under the Principal's November 6 read-only lifecycle
instruction. Portfolio's [experiment checkpoint](https://github.com/brooksbol/portfolio/blob/main/research/2026-11-05-aristocrats-paper-trading-checkpoint.md)
governs the acquisition-and-retention hypothesis. No orders, positions, credentials,
strategy, Portfolio governance, Market Sentinel or thinkorswim activity were changed.

## A. Latest authenticated account observation

Nine GETs across the existing seven approved Sandbox paths returned HTTP 200,
**2026-11-07 03:13:24.051–03:13:25.963 UTC**, or **November 6 8:13:24–25 PM
Mountain / 10:13 PM Eastern**. Completion of overnight processing is not
established. Historical orders and unfiltered cash queries explicitly cover
**November 6 00:00 UTC through November 7 03:12:59 UTC**. Other reads are current
snapshots; they are not atomic or historical-as-of queries.

A bounded follow-up made another **nine GETs, all HTTP 200**, through
**03:24:49.745 UTC / November 6 8:24:49 PM Mountain**, with a query end of
03:24:47.382 UTC. Balances, position quantities/marks, three filled orders,
three cash records and absence of lifecycle events were unchanged. The table
below is therefore also the latest observed state. Overnight completion remains
unestablished; two evening observations do not establish a processing schedule.

The previous Individual Cash identity anchor still matched current enumeration.
Working orders: **none**. Historical orders: **three**, all FILLED. Cash activities:
**three** (stock debit and two option credits). Each list completed on one page.
Three order details succeeded; no authentication/permission/rate-limit failure.

| Account field | Reported value |
|---|---:|
| Cash | $945,522.84 |
| Aggregate position market value | $54,349.00 |
| Net liquidation value | $999,871.84 |
| Equity control | 100 CAT shares; reported cost $55,960 / $559.60 per share |
| Nov 6 CAT $560 put | Short 1; reported mark $1.81, market value −$181 |
| Nov 13 CAT $560 put | Short 1; reported mark $15.20, market value −$1,520 |
| Additional CAT shares established | 0 at this checkpoint |

The target November 6 option remains a position. An order's FILLED status means
its opening trade executed; it does not mean expiration/assignment completed.
The two **reported** short contracts carry $112,000 nominal strike obligations
(2 × $560 × 100), distinct from broker margin/buying-power displays; the overdue
contract's actual settlement obligation remains part of the unresolved lifecycle.

**Valuation cross-field check:** the equity row reports last price **$558.63**, market
value **$56,050** and unrealized gain **$90**. For 100 shares, that market value
implies **$560.50**, a $187 difference from last-price × quantity. Reported market
values sum correctly to the balance and NLV; the last-price relationship does not.
No provider mark was overwritten, and no authoritative expiration settlement price
or moneyness conclusion was derived from these fields.
The subsequently supplied Desktop screenshot labels **CAT $558.63** and **After
$560.50**. Its after-hours quote reproduces $56,050 exactly. This supports a
regular-session versus after-hours explanation rather than establishing a wrong
account valuation. The offline arithmetic flag remains factual; explicit quote
session/mark provenance is absent from the API position fields inspected.

## B. Original submissions, observed changes and executions

Exact full `order_id` and `client_order_id` equality was checked locally between
the preserved 12:24 PM and new 8:13 PM observations. Both option orders retain
their original identifiers and creation times. The API now returns updated limit
and terminal fill fields on those same orders, not separate replacement trades.

| Contract | Original submission UTC | Limit at 12:24 PM Mountain | Latest limit | Aggregate execution UTC | Filled qty / price |
|---|---|---:|---:|---|---|
| CAT Nov 6 $560 put | Nov 6 19:04:47.832 | $1.89 | $1.50 | Nov 6 19:27:59.806 | 1 @ **$1.58** |
| CAT Nov 13 $560 put | Nov 6 19:17:27.877 | $15.05 | $13.25 | Nov 6 19:33:15.604 | 1 @ **$13.25** |

Executions were at **12:27:59.806 PM** and **12:33:15.604 PM Mountain**. The
November 6 $1.50 value was the final limit, not the actual $1.58 fill. This
corroborates the Principal's repricing observations while correcting the exact
execution amount. Simulated price improvement is not real-market fill evidence.

No modification timestamp or intermediate replacement sequence is supplied in the
observed list/detail payloads. We can establish changed limits on stable IDs,
not the exact time or number of edits. No canceled/replaced attempts appear as
additional history rows in this window. It remains unknown whether Desktop has
a richer change log. No private endpoint or UI automation was used to find one.

These are one-contract aggregate fills. There are no individual execution IDs or
execution-by-execution rows in the approved responses. Repeated snapshots and
working/history/detail views are not additional trades. Unknown relationships
between different order IDs are never created merely from matching contracts.

**Desktop order reconciliation is now DEMONSTRATED at displayed precision.** The
Principal supplied a screenshot captured **November 6 8:26:33 PM Mountain**,
showing all three orders in the Filled tab. Direct image inspection and a local
comparison verified side, total/filled quantities, current limits, average fill
prices and submission/fill times for both puts and the original stock buy.
The screen displays Eastern whole seconds, matching the API's UTC timestamps
after conversion; milliseconds and full order IDs are not visible. The displayed
account value $999,871.84 matches API NLV. The quote-delay banner also states
15 minutes, but does not reconstruct contemporaneous thinkorswim quotes or fill
quality. The privately retained image is primary supplied evidence; no UI
automation occurred. It shows orders, not the Positions/activity views needed to
resolve assignment. This supersedes the earlier pending order-comparison status
without rewriting that historical report.

## C–D. Cash, premiums, control ownership and unresolved expiration

| Opening treatment | Gross credit | Posted net TRADE/SELL credit | Difference / final detail fee sum |
|---|---:|---:|---:|
| Nov 6 put | $158.00 | $157.93 | $0.07 |
| Nov 13 put | $1,325.00 | $1,324.91 | $0.09 |
| Total | **$1,483.00** | **$1,482.84** | **$0.16** |

Each option cash record has the matching aggregate fill business timestamp and
contract-related symbol. There is no explicit order ID in the cash schema, so
this is a uniquely matching time/symbol/amount reconciliation, not an ID join.
Final detail fee components total the observed gross-to-net deductions. Empty
commission objects are not converted into invented zero commission amounts.
There are no separate FEES rows here; deductions are reflected in net TRADE cash.
The earlier unfilled-order fee values were provisional: they changed as orders
filled, so earlier `actual_value` labels alone were not a charge admission.

Combining retained windows and deduplicating by account plus activity ID yields
four unique cash records: the $1 million virtual deposit, −$55,960 stock buy and
the two net option credits. The stock debit appears in both snapshots and is
counted once:

`$1,000,000 − $55,960 + $157.93 + $1,324.91 = $945,522.84 cash`

`$56,050 − $181 − $1,520 = $54,349 position market value`

`$945,522.84 + $54,349 = $999,871.84 reported NLV`

The original 100-share control remains 100 shares. There is **no demonstrated
second 100-share block**, no $56,000 assignment strike debit and no returned
OPTION_ASSIGNMENT or OPTION_EXPIRATION event. The short Nov 6 put remains −1.
Therefore neither Case A (assigned) nor Case B (expired without assignment) is
established. Absence of an event at this time does not prove that the event did
not/will not occur; posting delay and simulator behavior remain unresolved.

For the Nov 6 treatment **only if later assigned**, the presently supported
premium-adjusted 100-share outlay would be **$56,000 − $157.93 = $55,842.07**,
before unknown assignment charges ($558.4207 per share). This is a conditional
economic calculation, not an observed purchase or the broker's pooled average
cost. Control cost remains separately $55,960. Premium cash is not counted as
realized strategy profit while the obligation remains unresolved.

The $128.16 reduction from initial $1 million NLV uses the provider's reported
marks. The screenshot supports its after-hours equity valuation; independent
real-market total return and consistent quote-session provenance remain untested.
No strategy inference or preferred DTE follows.

## E. Complete-lifecycle capability matrix

Primary [cash-activity documentation](https://developer.webull.com/apis/docs/reference/trade-cash-activity-by-type/)
explicitly maps `OPTION_EA` to `OPTION_ASSIGNMENT`, `OPTION_EXPIRATION`,
`OPTION_EXERCISE` and `CONTRACT_CLOSE`. It maps `DIVIDENDS` to income/distribution
subtypes and lists corporate-action subtypes. These are documented API categories,
not proof of paper simulator implementation or posting schedules.

| Event / capability | Classification | Evidence / remaining boundary |
|---|---|---|
| Same paper account, balances and holdings | DEMONSTRATED | Prior exact identity; current matching account scope |
| Desktop/manual-order API visibility | DEMONSTRATED | Supplied screenshot matches all three fills and visible times/prices |
| Original and updated option order state | DEMONSTRATED | Same order/client IDs and creation times; limits changed |
| Each intermediate replacement / timestamp | UNKNOWN | No mutation log in returned objects; no separate attempts observed |
| Opening fills, premiums and net deductions | DEMONSTRATED | Aggregate fills, final detail fees and net cash agree |
| Individual executions | UNKNOWN | Approved responses do not expose complete execution IDs/list |
| Option expiration activity | DOCUMENTED | OPTION_EA / OPTION_EXPIRATION; not observed here |
| Assignment activity | DOCUMENTED | OPTION_EA / OPTION_ASSIGNMENT; not observed here |
| Actual Nov 6 expiration result | UNKNOWN | Target position remains; removal/event/settlement absent |
| Assignment-created stock delivery | UNKNOWN | Only original 100 shares observed; no delivered block |
| Assignment strike debit | UNKNOWN | No $56,000 lifecycle debit returned |
| Exercise | DOCUMENTED | OPTION_EA / OPTION_EXERCISE; no exercise performed/tested |
| Dividend cash credit | DOCUMENTED | DIVIDENDS categories; no paper credit observed |
| Dividend entitlement and early-call risk | UNKNOWN | Activity categories do not establish eligibility or simulation fidelity |
| Corporate actions | DOCUMENTED | Cash categories; no paper event demonstrated |
| Realized charged fees at opening | DEMONSTRATED | $0.07 and $0.09 gross-to-net differences reconcile to final fees |
| Overnight event availability / posting latency | UNKNOWN | No processing schedule or account-posted timestamp established |
| Complete post-expiration lifecycle reconciliation | UNKNOWN | Case C, with exact missing evidence above |

No capability was newly classified UNSUPPORTED merely from absent events. No
assignment was inferred from an indicative price, date or 100 existing shares.
`biz_time` is business-event time; `trade_date` is accounting date; request times
bound when evidence was observed. None independently supplies posting/settlement
time or establishes that overnight processing completed.

## F. Implementation, tests and reproducibility

The unchanged sandbox GET transport and acquisition code are reused. Added only
an offline reconciliation helper and synthetic tests: stable-ID order timelines,
cumulative fills, duplicate/conflicting cash records, retained control ownership,
explicit native lifecycle events, strike cash, missing metadata, delayed evidence
and inconsistent account states. The reconciler requires uniquely associated
native events and corroborating state/cash for a resolved outcome. Unlinked
different-order attempts are kept distinct. Cash-only or net-zero position
shortcuts do not prove physical delivery/removal.

**52 offline tests pass**, including all previous 33 security/acquisition tests.
Positive assignment and expiration fixtures are synthetic, not actual broker
events. The real account audit returns UNRESOLVED. There is no new endpoint,
credential operation, network call in the helper, database, scheduler or dashboard.

Private source runs:

* Before: `20261106T192437.158183Z` (the original populated snapshot).
* After: `20261107T031323.986210Z` (this checkpoint).
* Latest follow-up: `20261107T032447.580059Z` (unchanged outcome).

Both are under `~/Library/Application Support/Wheelwright/webull-paper-identity/`.
Each new run retains nine response bodies and metadata, `activity-observation.json`,
and timestamped `lifecycle-reconciliation-*.json` outputs with source locators
and analysis-source SHA-256. Raw responses/identifiers stay outside Git, 0700/0600.
The prior reports are preserved unchanged.
The follow-up directory also holds `desktop-orders-20261106T202633-MST.png`, its
source hash and transcribed comparison receipt, and `desktop-comparison-checks.json`.
All eight field/time comparisons per order and displayed account value passed.

## G. Next evidence boundary

The supplied screenshot resolves the manual-order visibility gate. It does not
show assignment/expiration activity or aggregate position quantities.
Required next observation: the same read-only endpoints after broker processing,
plus Principal-supplied Desktop activity/history if API records remain incomplete.
Desktop may contain additional history, but this has not been inspected and is
not asserted as a supported export/API feature. Do not fabricate a posting time
or install a watcher to bridge the gap.

If assignment is subsequently established, separate the new 100 shares from the
control, reconcile strike debit and charges, then observe any **Principal-entered**
covered-call order against that treatment, share encumbrance/retention and future
ex-date/payment activity. No covered call, exercise or other order is entered by
this task. No investment strategy validation is claimed. PR #46 stays draft,
unmerged and undeployed. This checkpoint meets the documented-evidence-gap branch
of the completion standard, not the complete-assignment branch.
