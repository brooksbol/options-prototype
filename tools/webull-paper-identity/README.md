# Webull paper account evidence pilot

Bounded acquisition harness for the Martin Harrison Portfolio experiment. This
is not a trading client, production Account integration, strategy engine or
scheduler. The identity gate passed; the November 6 continuation adds bounded
orders and cash observations. Stop before any new trade or lifecycle experiment.
The Portfolio checkpoint governs the
experiment:
<https://github.com/brooksbol/portfolio/blob/main/research/2026-11-05-aristocrats-paper-trading-checkpoint.md>.

## Architecture and scope

Authorized November 6, 2026: retrieve the Principal's Sandbox accounts, balances,
positions, working/historical orders, order details and cash activities. The
[continuation authorization](https://github.com/brooksbol/options-prototype/pull/46#issuecomment-6693131460)
keeps PR #46 draft and excludes UI automation, production rollout and trading. No
orders, credentials/grants or positions may be changed. Existing thinkorswim
treatments and Market Sentinel remain untouched.

Home: Wheelwright `tools/`, as an isolated provider acquisition pilot. Recovered
precedents: `scripts/tastytrade.mjs` (bounded standalone broker observation),
`evidence-service-java/.../v2/TastytradeClient.java` (safe diagnostics, redirects
disabled, secret exclusion before retention), Market Sentinel's `tradier.py`
(Keychain access pattern only). Their OAuth/Tradier authentication cannot sign
Webull OpenAPI requests. Use the official Webull SDK's seven request builders and
`SignerFactory`; a constrained requests transport replaces the SDK's broad
network client. No signature algorithm is reimplemented. No canonical Account,
Position, Operating Regime, financial engine or v2 API is introduced. Integration
into the operational backend would be a later, independently reviewed scope.

This conserves backend/evidence authority and brokerage-observed-fact semantics
(`docs/07-architecture-current.md`, `docs/principles.md`, maintained Account owner).
Raw observations are local acquisition evidence, not an adopted institutional
ledger or admitted Drive records. The Principal's independent Desktop observation
provides the source-boundary identity check. No investment hypothesis is encoded.

## Security boundary

Only HTTPS `api.sandbox.webull.com`, with exactly these GET operations:

* `/trading/accounts/list`
* `/trading/assets/balances/get?account_id=...`
* `/trading/assets/positions/list?account_id=...`
* `/trading/orders/open-orders/list?account_id=...`
* `/trading/orders/historical-orders/list?account_id=...&start_time=...&end_time=...`
* `/trading/orders/get?account_id=...&client_order_id=...`
* `/trading/activities/cash-activities/list?account_id=...&start_time=...&end_time=...`

The final prepared request is checked before the HTTP adapter. Query parameters,
method, host, port, path, body and Host override are constrained. Production,
other Sandbox services, order mutations, token creation and redirects are
rejected. Ambient proxies/netrc are disabled; TLS verification is required.
Timeouts are bounded; there are no automatic retries or SDK debug logs. SDK
imports are limited to the official signer and the seven read request builders.
This is an application transport boundary, not a machine-wide network sandbox.

macOS Keychain service `portfolio.webull-sandbox`, accounts `app-key` and
`app-secret`, supplies existing values through `security find-generic-password`.
The program never generates/resets credentials or prints their values. It does
not create/refresh a 2FA token. A future token/permission failure must be resolved
separately, without disabling security or widening the operation allowlist.

Exact JSON response bytes, SHA-256, HTTP status, query parameters and UTC request start/end times
are retained outside Git in owner-only storage:

`~/Library/Application Support/Wheelwright/webull-paper-identity/<UTC-run>/`

Run directories are 0700; files are exclusively created 0600. Request headers and
authentication exchanges are never retained. JSON credential/token/signature
echoes are rejected before body retention. Error bodies remain private and are
not echoed. Account IDs/numbers are not printed. Never commit raw observations.

## Local execution

Use a maintained Python (verified Python 3.14) and an isolated environment outside
the checkout. The official SDK is pinned at 3.0.4; requests is its dependency.

```sh
python3.14 -m venv ~/.local/share/wheelwright/webull-paper-identity/venv
~/.local/share/wheelwright/webull-paper-identity/venv/bin/python -m pip install -r tools/webull-paper-identity/requirements.txt
~/.local/share/wheelwright/webull-paper-identity/venv/bin/python -m unittest discover -s tools/webull-paper-identity -v
```

From this repository root, when account reads are authorized:

```sh
~/.local/share/wheelwright/webull-paper-identity/venv/bin/python tools/webull-paper-identity/webull_identity.py --observe
```

No endpoint, secret or account GUID needs to be supplied. With no `--observe`,
help is displayed without reading Keychain or contacting Webull. Up to ten
enumerated paper accounts are observed once, without automatic polling. The
console leaves identity UNRESOLVED until an independent Desktop comparison.

The continuation uses the prior private identity evidence to select only the
verified Individual Cash account, requiring both its internal ID and full broker
number still match current enumeration. Do not enter identifiers in commands.
The original private run's `01-accounts.json` and `desktop-observation.json` must
remain under the run locator below; missing evidence is a setup blocker, not a
reason to guess an account or select a different cash portfolio.

```sh
~/.local/share/wheelwright/webull-paper-identity/venv/bin/python tools/webull-paper-identity/webull_identity.py --activity --start 2026-11-05T00:00:00.000Z --end 2026-11-06T19:24:28.000Z
```

This example repeats the explicitly stated historical window, not a current-time
snapshot promise. `--start` and `--end` are required for activity mode. Query times
normalize to UTC milliseconds; naive timestamps are rejected. The adapter's
31-day maximum is a local safety bound, not a vendor retention limit. Cash windows
cannot cross a calendar year under the vendor's documented rule.

SDK 3.0.4: `OrderOpenRequestV2` and `OrderHistoryRequestV2` live in `request/v3/`;
`GetActivitiesRequestV2` lives in `request/`; `OrderDetailRequest` uses the v3 path.
All send `x-version: v3`. Avoid the deprecated date/last-order pagination classes.
Only SDK-supported `client_order_id` lookup is exposed for details; no guessed IDs.

Order/cash pages must have `{data: [...], pagination_key?: ...}`. The cursor is
carried to the next request without changing the account or window. Bounds:
20 pages and 2,000 top-level objects per stream; 20 distinct observed client IDs
for detail reads. Repeated cursors, unknown pagination, malformed data or bounds
produce an explicit incomplete/failed result while retaining acquired pages.
No retry or automatic polling occurs. The 20-page/detail bounds stay below the
documented 30-request/minute-per-endpoint Sandbox quota for one run; separately
launched runs share the same vendor quota and can still receive 429.

`activity-observation.json` retains separate working/history groups, detail
observations and cash records, plus per-operation success/failure and page receipts.
Raw responses remain intact. The normalized projection preserves provider fields,
group context, option legs, exact numeric strings, stable account-scoped IDs and
UTC timestamps (with documented legacy epoch-millisecond fallback). Order account
references are labeled request scope; cash's native account field is checked.
Missing fees, commission and timestamps remain unknown/empty as supplied. Unknown
order statuses remain UNKNOWN alongside the raw provider value. No replacement
chain, execution list, stock delivery or cash flow is invented. Working/history
can contain the same order and must not be added as separate trades. A reported
average fill and last-fill time do not establish every execution.

Each endpoint failure is recorded independently. CLI exit 1 means failed or
incomplete evidence, including failed detail reads; successful other reads remain
available privately. On 401/403/417/429 or transport failure, inspect evidence and
resolve the cause before a deliberate rerun. No non-GET token operation bypasses
the transport, and no security setting is weakened.

## Identity acceptance and limits

Compare Desktop's displayed **account number**, label/type and total account
value against API `account_number`, `account_class` and reported net liquidation
value. The API's `account_id` is a separate internal routing identity. Preserve
the Desktop observation independently; never populate it from the API response.
`compare_identity` performs exact full-number equality plus type/currency/NAV
checks; evidence outside Git retains the actual values. Missing or conflicting
facts remain UNRESOLVED. A complete nonempty enumeration with different displayed
account numbers returns DIFFERENT ACCOUNT. The comparison helper assumes the
caller supplies a complete successful enumeration, not a filtered list.

Current SDK builders expose no pagination controls for the original account reads. A
recognized nonempty continuation indicator fails closed instead of inventing a
cursor request or claiming a complete result. Unknown response schemas also fail
closed. Cash/NLV absence remains unknown, not zero. Positions retain broker-native
fields; absent strike/right/expiration/multiplier is never fabricated from a
symbol or a conventional 100-share assumption. Order/cash acquisition is now
implemented under the continuation; options lifecycle acquisition remains unverified.

The original 17 offline tests cover the actual final transport seam, wrong hosts/methods,
query/body violations, Host spoofing, redirects, official signing, Keychain mocks,
credential echoes, account identity, reported balance/position preservation,
UTC metadata, file permissions, pagination refusal, malformed/oversized responses,
rate limits, suppressed SDK signing-debug logs and failures. Fixtures use synthetic credentials; tests neither read
Keychain nor contact Webull. They are implementer verification, not independent
review or evidence of actual account behavior.

The extended suite adds synthetic grouped options, partial fills, canceled and
unknown replacement states, multiple provider execution records preserved as an
undocumented extension, missing timestamps/fees, bounded cursor walks, exact SDK
query parameters, detail deduplication and partial failures. No actual response is
committed as a fixture. Run the full discovery command above for current results.

See [the initial identity result](RESULT-2026-11-06.md) and
[the populated orders/cash result](ACTIVITY-RESULT-2026-11-06.md) for authenticated observations.
The empty-account comparison does not verify manual order visibility, physical
assignment, premiums, fees, expiration, dividend eligibility/payments, basis,
covered-call availability or corporate-action accounting. Those require a later
scope and any test trade requires separate authorization.

## Offline lifecycle checkpoint

The Principal's November 6 continuation authorizes read-only reconciliation of
the two CAT puts through expiration/possible assignment. The
[lifecycle result](LIFECYCLE-RESULT-2026-11-06.md) verifies both opening fills and
cash, but leaves expiration/assignment UNRESOLVED at the evening observation.
No new transport path or acquisition behavior is required.

`reconcile_lifecycle.py` reads two existing private `activity-observation.json`
files and writes a new timestamped 0600 reconciliation beside the later one.
It performs no HTTP or Keychain read. For this checkpoint:

```sh
~/.local/share/wheelwright/webull-paper-identity/venv/bin/python tools/webull-paper-identity/reconcile_lifecycle.py --before "$HOME/Library/Application Support/Wheelwright/webull-paper-identity/20261106T192437.158183Z" --after "$HOME/Library/Application Support/Wheelwright/webull-paper-identity/20261107T032447.580059Z" --symbol CAT --expiry 2026-11-06 --strike 560 --control-shares 100
```

Preserve originals. Stable account/order IDs anchor observed updates; repeated
cumulative fill quantities are not summed across snapshots. Native cash records
deduplicate by account/activity ID; conflicting same-ID records fail closed.
The control quantity must match the prior snapshot. Case A needs option removal,
100 additional shares, a uniquely associated documented OPTION_ASSIGNMENT event,
strike debit and internally consistent reported cash/positions. Case B needs
option removal, unchanged control quantity and an associated OPTION_EXPIRATION
event. Missing/delayed/conflicting evidence stays Case C. Event-symbol uniqueness
is tested against returned expiry contracts; no order-ID cash link is fabricated.
The tool is a bounded single 100-share put audit, not a generic transaction engine.

Exact Decimal arithmetic checks provider cash/NLV/position values and flags
last-price versus market-value discrepancies without rewriting marks. Such a flag
can reflect different quote sessions, as the supplied after-hours Desktop quote
supports in this checkpoint; it does not by itself establish a broker defect. A conditional
premium-adjusted acquisition outlay is not observed assignment or pooled broker
cost basis. Business, accounting and observation times remain distinct; no posting
or settlement time is guessed. The expanded **52-test** suite includes synthetic
assignment/expiration paths, which do not establish real simulator behavior.

## Official sources

Verified during the November 5–6 access investigation:

* [Application](https://developer.webull.com/apis/docs/authentication/IndividualApplicationAPI/)
* [SDKs and environments](https://developer.webull.com/apis/docs/sdk/)
* [Official Python SDK](https://github.com/webull-inc/webull-openapi-python-sdk)
* [Signature authentication](https://developer.webull.com/apis/docs/authentication/overview/)
* [Account APIs](https://developer.webull.com/apis/docs/trade-api/account/)
* [Account list](https://developer.webull.com/apis/docs/reference/account-list/)
* [Balances](https://developer.webull.com/apis/docs/reference/account-balance/)
* [Positions](https://developer.webull.com/apis/docs/reference/account-position/)
* [Working orders](https://developer.webull.com/apis/docs/reference/order-open/)
* [History](https://developer.webull.com/apis/docs/reference/order-history/)
* [Order details](https://developer.webull.com/apis/docs/reference/order-detail/)
* [Cash activities](https://developer.webull.com/apis/docs/reference/trade-cash-activity-by-type/)
* [Sandbox rate limits](https://developer.webull.com/apis/docs/rate-limits/)
* [Separate OpenAPI market-data entitlements](https://developer.webull.com/apis/docs/market-data-api/faq/)

## Authorized experiment preparation — November 7, 2026 (local review candidate)

Authority: [Principal ratification and engineering grant, bc494ef](https://github.com/brooksbol/portfolio/blob/bc494ef4499aaaacf998c446417b06db28d0c490/decisions/2026-11-07-aristocrats-experiment-3am-principal-reconciliation.md).
This slice is **uncommitted on the existing draft PR #46 branch**, pending independent
review and Principal Product acceptance. It is not installed v2 behavior. No order
writer, signal predicate, quote service, scheduler or notification sender is added.

Reuse and gaps:

- `acquisition_state.py` composes the existing seven GET families and normalization.
  It brackets the acquisition with another positions/working-orders/balances read;
  checks quantities, order/detail consistency, pagination, capacity fields and account
  arithmetic; and refuses missing, unsupported, conflicting or old observations.
  The 60-second acquisition/receipt guard is a conservative engineering bound for
  this diagnostic, **not** source-event freshness or a new quote policy. Order lists
  can lag; a stable bracket is not an atomic or complete broker-history guarantee.
- `experiment_state.py` supplies the missing Portfolio-specific cohort/treatment/
  intent/client-order correlation identities. A single protected JSON file, file
  lock, atomic replacement and fsync suffice; no database or service is introduced.
  The file never substitutes for reacquired financial state. Its account fingerprint
  scopes native correlations; it is not a new Wheelwright Account identity.
- Duplicate events recover the same identities; other events cannot enroll the same
  underlying again. Existing-cohort children remain planned after an exactly matched
  control fill. Unknown submissions never clear automatically, even when later reads
  find the order. Unassociated activity or inconsistent inventory stops the evaluation.
- `prepare()` returns **unsigned, unpriced data**, with submission and retry always
  false. It exposes no send operation. The official SDK's v3 `PlaceOrderRequest` can
  package the synthetic fields locally in tests, but the unchanged real transport
  rejects its POST. This is packaging evidence, not preview/submission acceptance.
- Canonical financial resources, broker observations and existing pilot evidence stay
  with Wheelwright. Experimental identities and attribution belong to Portfolio.
  No v2 contract, governance, Position ontology or operational database changes.

From the existing branch and private environment, ordinary read-only inspection is:

```sh
~/.local/share/wheelwright/webull-paper-identity/venv/bin/python tools/webull-paper-identity/experiment.py CAT
~/.local/share/wheelwright/webull-paper-identity/venv/bin/python tools/webull-paper-identity/experiment.py XOM
```

Each command enumerates accounts and verifies the original Desktop identity anchor,
then acquires new broker evidence. It does not load an old observation as current.
Private outputs are `current-state.json` and `experiment-result.json` in the existing
timestamped evidence directories. Durable identities live in the sibling owner-only
`aristocrats-experiment/experiment.json`; opening an empty store does not enroll it.

Engineering enrollment takes both `--event-id` and `--contracts PATH`. The former is
an explicitly supplied event identity, **not automatic stochastic confirmation**.
The latter is a private JSON list with `symbol`, `expiration`, `strike`, `right: PUT`,
`multiplier: 100`, `deliverable: 100`, and a nonempty source `reference`, one selected
put per distinct expiration within 45 calendar days. The supplied reference is not
independently verified by this pilot. No signal or contract file was invented to
enroll a real treatment during this demonstration. Selection of actual available
expirations/ATM requires independent source qualification. By default, previews use
only currently held put metadata, excluding expired dates; they are not a full chain.

### Authenticated Product observation — November 7, 2026

Two final demonstration runs each made **12 Sandbox GET requests, all HTTP200**:

| Read boundary UTC | Underlying | Actual result |
|---|---|---|
| 16:08:14–16:08:16.943804 | CAT | **BLOCKED**: existing broker exposure and reported order activity |
| 16:08:53–16:08:55.422811 | XOM | **ELIGIBLE_FOR_PLANNING**: no exposure/order observed at this cut; not execution clearance |

Both reported cash **$945,522.84**, NLV **$999,871.84**, settled cash **$944,040.00**,
buying power **$833,522.84**, and option buying power **$833,522.84**. These are distinct
broker fields, not interchangeable collateral or available-cash determinations.
CAT still reported100 shares and short1 each of Nov6 and Nov13 $560 puts. Its preview
showed stock100 plus one Nov13 put; no cohort was enrolled. XOM showed an unpriced
stock preview and no discovered put references; no cohort was enrolled. These are
current account reads on Saturday, not regular-session quote or execution evidence.
The overdue Nov6 position does not prove assignment or unassigned expiration.

Raw IDs, source rows, full timestamps and response hashes remain private. Final run
directories are `20261107T160814.559088Z` and `20261107T160853.272528Z` beneath the
existing evidence root. Earlier evidence reports remain unchanged historical records.

### Focused verification and remaining gates

The complete pilot suite has **69 passing offline tests** (the existing52 plus17):
duplicate signals, preserved children, partial fills, delayed/missing/conflicting
details, account mismatch, opposing inventory rows, unknown acceptance, atomic state
failure, separate-process identity recovery and stale-observation rejection. Existing
host, method, redirect, credential-redaction and pagination tests remain unchanged.
Fixtures and SDK packaging do not prove broker submission or idempotency.

```sh
~/.local/share/wheelwright/webull-paper-identity/venv/bin/python -m unittest discover -s tools/webull-paper-identity -p 'test*.py' -v
```

Before the first programmatic paper order: independently qualify actual contract/ATM
selection, live bid/ask and Greeks and permitted data use; reconcile current capacity
and obligations; independently review/accept an explicitly sandbox-only writer and
client-ID outcome controls; obtain separate bounded Principal order authorization.
The official [place-order contract](https://developer.webull.com/apis/docs/reference/common-order-place/)
documents account-unique client IDs; [list queries](https://developer.webull.com/apis/docs/reference/order-open/)
can lag and recommend detail lookup. A missing lookup does not prove nonacceptance.
No create/modify/cancel/preview request, credential change, broker mutation, deployment,
or production endpoint access occurred. No automatic retry or covered-call capability
is enabled. Independent review and Principal acceptance remain pending.

### Bounded successor correction — November 7, 2026

The original local candidate was independently **REJECTED** for two financial
qualification omissions. Its base `9f995ee7`, original patch SHA-256
`5e2afb48b2b865ed712254a30b276d9db6e3a9bdf3e153d676f9753052d956b4`,
patch, test log and manifest remain unchanged in private `engineering-slice-20261107/`.
The CAT/XOM observations above remain historical evidence, not new acquisitions.

This successor reuses `reconcile_lifecycle.unique_cash()` to reject conflicting
account/activity identities, checks each cash projection against the retained
provider row, and applies the same existing USD cash + market value = NLV check
to **both** balance boundaries. The existing one-cent representation tolerance
is unchanged. Opening and closing NLV need not match; consistent market-value
changes remain admissible. Existing cash/quantity stability guards still require
reacquisition when those parts of the observed account cut change.

Successful preview publication now occurs only after the identity transaction
completes. A commit/directory-sync failure cannot publish successful enrollment.
A later preview-write failure reports that publication failed after commitment;
the durable identities remain available to the same event on the next read-only
evaluation. No cross-resource rollback or automatic brokerage retry is claimed.

Verification: **78 offline tests pass** (the previous69 plus9 focused correction
tests). CLI regressions inject replace failure, directory-sync failure and preview
write failure; repeat the same event and compare the committed identities. Financial
regressions cover duplicate/conflicting cash, projection contradictions, missing or
invalid closing values, legitimate NLV movement and the existing rounding boundary.
No new authenticated reads, Keychain access, brokerage mutation or endpoint change
was used to verify this correction. The seven-path Sandbox GET transport and
submission-disabled boundary are unchanged. This is a distinct uncommitted successor,
**pending separate independent review**, not an accepted revision of rejected evidence.
