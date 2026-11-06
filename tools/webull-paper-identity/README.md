# Webull paper account identity pilot

Bounded acquisition harness for the Martin Harrison Portfolio experiment. This
is not a trading client, production Account integration, strategy engine or
scheduler. Stop after the identity gate. The Portfolio checkpoint governs the
experiment:
<https://github.com/brooksbol/portfolio/blob/main/research/2026-11-05-aristocrats-paper-trading-checkpoint.md>.

## Architecture and scope

Authorized November 6, 2026: retrieve the Principal's Sandbox accounts, balances
and positions and compare the new Desktop Individual Cash paper account. No
orders, credentials/grants or positions may be changed. Existing thinkorswim
treatments and Market Sentinel remain untouched.

Home: Wheelwright `tools/`, as an isolated provider acquisition pilot. Recovered
precedents: `scripts/tastytrade.mjs` (bounded standalone broker observation),
`evidence-service-java/.../v2/TastytradeClient.java` (safe diagnostics, redirects
disabled, secret exclusion before retention), Market Sentinel's `tradier.py`
(Keychain access pattern only). Their OAuth/Tradier authentication cannot sign
Webull OpenAPI requests. Use the official Webull SDK's three request builders and
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

The final prepared request is checked before the HTTP adapter. Query parameters,
method, host, port, path, body and Host override are constrained. Production,
other Sandbox services, order operations, token creation and redirects are
rejected. Ambient proxies/netrc are disabled; TLS verification is required.
Timeouts are bounded; there are no automatic retries or SDK debug logs. SDK
imports are limited to the official signer and three account request builders.
This is an application transport boundary, not a machine-wide network sandbox.

macOS Keychain service `portfolio.webull-sandbox`, accounts `app-key` and
`app-secret`, supplies existing values through `security find-generic-password`.
The program never generates/resets credentials or prints their values. It does
not create/refresh a 2FA token. A future token/permission failure must be resolved
separately, without disabling security or widening the operation allowlist.

Exact JSON response bytes, SHA-256, HTTP status and UTC request start/end times
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

Current SDK builders expose no pagination controls for these three calls. A
recognized nonempty continuation indicator fails closed instead of inventing a
cursor request or claiming a complete result. Unknown response schemas also fail
closed. Cash/NLV absence remains unknown, not zero. Positions retain broker-native
fields; absent strike/right/expiration/multiplier is never fabricated from a
symbol or a conventional 100-share assumption. No order normalization, historical
reads or lifecycle acquisition is included at this gate.

The 17 offline tests cover the actual final transport seam, wrong hosts/methods,
query/body violations, Host spoofing, redirects, official signing, Keychain mocks,
credential echoes, account identity, reported balance/position preservation,
UTC metadata, file permissions, pagination refusal, malformed/oversized responses,
rate limits, suppressed SDK signing-debug logs and failures. Fixtures use synthetic credentials; tests neither read
Keychain nor contact Webull. They are implementer verification, not independent
review or evidence of actual account behavior.

See [the November 6 result](RESULT-2026-11-06.md) for authenticated observations.
The empty-account comparison does not verify manual order visibility, physical
assignment, premiums, fees, expiration, dividend eligibility/payments, basis,
covered-call availability or corporate-action accounting. Those require a later
scope and any test trade requires separate authorization.

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
* [Sandbox rate limits](https://developer.webull.com/apis/docs/rate-limits/)
* [Separate OpenAPI market-data entitlements](https://developer.webull.com/apis/docs/market-data-api/faq/)
