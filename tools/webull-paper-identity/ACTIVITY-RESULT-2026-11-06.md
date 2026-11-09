# Webull paper orders / cash observation — November 6, 2026

**Phase result: all seven approved GET endpoints returned HTTP 200, with populated
orders, stock holdings and cash activity. Desktop/manual-order reconciliation
remains pending Principal confirmation.** No new order was created for this test.

Authority: [Principal's continuation authorization](https://github.com/brooksbol/options-prototype/pull/46#issuecomment-6693131460)
and the Portfolio [experiment checkpoint](https://github.com/brooksbol/portfolio/blob/main/research/2026-11-05-aristocrats-paper-trading-checkpoint.md).
Same draft PR #46, extending the prior `2f335142` identity pilot. No merge,
production deployment, strategy change, new infrastructure or brokerage mutation.

## Authenticated observation

Queries used **2026-11-05T00:00:00.000Z through 2026-11-06T19:24:28.000Z** for
historical orders and unfiltered cash activity. Account/position/working/detail
reads are observation-time snapshots, not historical snapshots bounded by that
window. Boundary inclusivity and full retention were not empirically established.

The acquisition ran **19:24:37.250–19:24:38.616 UTC** (12:24:37–38 Mountain),
using only `https://api.sandbox.webull.com`. Nine authenticated GETs succeeded.
Current enumeration was matched against the private prior identity anchor:
internal API ID, full displayed number and `INDIVIDUAL_CASH` class still matched.
Full account/order/activity identifiers remain outside Git; account suffix GV97
is sufficient for this report. The Desktop identity investigation was not repeated.

| Read | HTTP | Actual response |
|---|---|---|
| Account list | 200 | Five accounts; prior Individual Cash selected |
| Balances | 200 | Cash $944,040; NLV $1,000,062; market value $56,022 |
| Positions | 200 | 100 CAT shares; cost price $559.60; unrealized gain $62 |
| Working orders | 200 | Two groups / two unfilled CAT puts |
| Historical orders | 200 | Three groups / three orders, including the stock fill |
| Cash activities | 200 | Two activities: virtual deposit and CAT purchase debit |
| Order details | 200 × 3 | One response for each observed distinct client order ID |

Every paginated response had `data` and no continuation key: one terminal page
per stream. Actual multi-page behavior is unverified; synthetic tests exercise it.
No authentication, token, account-permission or rate-limit blocker occurred.
No non-GET authentication operation was needed or permitted. SDK request builders
and signer are used without the broader SDK client's automatic token machinery.

## Observed orders — source-dated, not a current order-management instruction

| Order | Submitted UTC | Status at observation | Filled / total | Limit | Average fill |
|---|---|---|---|---|---|
| BUY CAT equity | Nov 6 18:58:19.433 | FILLED | 100 / 100 shares | $559.70 | $559.60 |
| SELL CAT Nov 6 $560 put | Nov 6 19:04:47.832 | SUBMITTED | 0 / 1 contract | $1.89 | Not supplied |
| SELL CAT Nov 13 $560 put | Nov 6 19:17:27.877 | SUBMITTED | 0 / 1 contract | $15.05 | Not supplied |

Stock last-fill time: **18:58:22.708 UTC / 11:58:22.708 Mountain**. Both options
report PUT, expiration, strike $560, multiplier 100 and deliverable 100 in their
returned legs. Those contract fields demonstrate populated order metadata, not
physical exercise/assignment behavior. No option position existed at this read.

Order and client-order identifiers are present and preserved. Working/history
repeat the same put orders; they are separate observations, not additional trades.
The approved endpoints report aggregate fill quantity, average price and last-fill
time. Neither the observed data nor the reviewed retail schema supplies a complete
list of execution IDs and execution-by-execution fills. No synthetic fill list was
created. The separate Broker API is not this integration's host or authority.

## Cash and internal consistency

Returned cash events:

* `DEPOSIT / WIRE`: **+$1,000,000**, November 5 23:42:47.153 UTC. This is a paper
  ledger label, not evidence of a real wire or funded live brokerage account.
* `TRADE / BUY`, CAT: **−$55,960**, November 6 18:58:22.708 UTC; accounting date
  November 6. This equals 100 × $559.60 and shares the order's last-fill timestamp.

For these observed records, $1,000,000 − $55,960 = **$944,040 reported cash**;
$944,040 + $56,022 market value = **$1,000,062 reported NLV**. The 100-share
position's cost price also agrees with the aggregate fill price. These are bounded
arithmetic consistency checks, not proof of exhaustive historical accounting.
Cash activities have their own IDs and account IDs, but no order ID in the
observed schema: symbol/time/amount agreement is not an explicit ID-based join.

**Fee caveat:** filled stock detail returned `fees: []` and `commission: {}`.
Both unfilled put details returned fee entries with `actual_value` and
`receivable_value`: four named fee components per order. They sum to $0.10 and
$0.07 respectively, despite filled quantity zero. No fee cash debit was returned.
Do not book these values as paid, subtract them from cash, or infer that an empty
commission object means zero commission. Their simulated accounting meaning and
posting timing require later evidence. Original objects are retained intact.

## Capability / field matrix

Sources: [order history](https://developer.webull.com/apis/docs/reference/order-history/),
[working orders](https://developer.webull.com/apis/docs/reference/order-open/),
[order detail](https://developer.webull.com/apis/docs/reference/order-detail/),
[cash activities](https://developer.webull.com/apis/docs/reference/trade-cash-activity-by-type/).
Current documentation's response schemas and installed official SDK 3.0.4 request
builders were inspected; no undocumented endpoint was used.

| Evidence | Documented / implemented | Demonstrated here / limitation |
|---|---|---|
| Provider account reference | `account_id` request scope; native field in cash records | Scope bound to prior verified account; native cash IDs checked. Orders/positions do not independently repeat account ID |
| Order identity | `order_id`, `client_order_id`, group context | Present across lists/details; retained privately |
| Contract | Symbol and option-leg specifications | Two puts have strike/right/expiry/multiplier/deliverable; no settlement claim |
| Side / quantity / limit / status | Provider fields, lossless projection | Stock BUY/FILLED and puts SELL/SUBMITTED; unknown states remain UNKNOWN |
| Submission / last execution time | ISO timestamps; deprecated epoch-ms fallback | Populated stock fill; no execution timestamp for unfilled puts |
| Aggregate fill | `filled_quantity`, `filled_price` | Stock 100 @ $559.60; put quantity 0, price absent |
| Individual executions / IDs | Not exposed by the approved retail response schemas reviewed | Unavailable from this observed endpoint set; multiple-fill reconstruction unresolved |
| Fees / commissions | Detail breakdown fields | Pending-order fees present; stock fees empty; commission amounts unavailable; realized charge interpretation unresolved |
| Cash debit / credit | Signed `net_amount`, currency | Deposit and stock debit demonstrated; not a per-order fee ledger |
| Activity identity / type / dates | `id`, `activity_type`, subtype, `biz_time`, `trade_date` | Populated DEPOSIT and TRADE; business time and accounting date preserved separately |
| Pagination | `data`, optional `pagination_key`; bounded walk | Terminal first pages demonstrated; multi-page tests are offline only |
| Retention / completeness | Explicit window; vendor defaults avoided | Window retained; broader coverage, processing latency and boundary semantics unverified |
| Dividend / option events | Cash enums include DIVIDENDS, OPTION_EA, CORPORATE_ACTION | Category names are documented; no such paper events observed |

Cash request documentation prohibits cross-year windows. The adapter additionally
caps windows at 31 days for this pilot; that is not a claim about vendor retention.
Unfiltered cash requests avoid silently selecting only TRADE. An enum or empty
result cannot establish complete event processing in paperTrade.

## Desktop reconciliation and next acceptance gate

The authorization excludes UI automation, so none was performed in this phase.
The Principal was asked to confirm the three API-observed orders against Desktop
at the stated observation boundary. **Until that confirmation/evidence arrives,
manual-order reconciliation is UNRESOLVED.** Prior identity acceptance and the
new internally consistent populated API data do not replace this comparison.

The next gate is a single Principal-manually-entered paper order with matching
Desktop/API identity, side, quantity, price, status and actual execution. The
existing filled CAT share order may satisfy it after independent Desktop/manual
origin confirmation; do not create a redundant test order. No new paper order is
authorized by this report. Physical short-put assignment/share delivery, dividend
entitlement/payment and subsequent covered calls remain separate later tests.

## Test evidence and private artifacts

**33 offline tests pass**, including all original 17 tests. Added coverage includes
the four new request builders/parameters, all-host/method enforcement, bounded
cursor walks and history windows, partial fills, canceled/unknown replaced states,
contract fields, unknown fees/times, detail deduplication/caps, partial failures
and multi-execution passthrough without manufacturing a ledger. Tests never read
Keychain or contact Webull. Existing tests cover redirects, signing-debug
suppression, credentials/echoes, 401/403/417/429/500 and malformed responses.

Private run:
`~/Library/Application Support/Wheelwright/webull-paper-identity/20261106T192437.158183Z/`

* `01-accounts.json`, `02-balances.json`, `03-positions.json`.
* `04-working.json`, `05-history.json`, `06-cash.json`.
* `07-detail.json` through `09-detail.json`.
* Per-request metadata: UTC times, status, query scope and body SHA-256.
* `activity-observation.json`: separate provider objects and normalized projections.
* `replay-and-arithmetic-checks.json`: successful final-parser replay and bounded
  cash/NLV arithmetic checks, without another network request.

Original responses and full identifiers stay outside Git in 0700/0600 storage.
No actual response was converted into a committed fixture. The initial identity
report remains unchanged historical evidence. Independent review, merge and
deployment remain unperformed. Stop before any brokerage mutation or later test.
