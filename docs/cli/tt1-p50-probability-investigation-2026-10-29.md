# TT1 export — broker-modeled P50 probability investigation

Date: October29,2026. Category E bounded provider/capability investigation; not Product ratification, a model specification or trading authorization.

## Outcome and limits

**No exact broker-modeled P50 is available from the published API contracts and authorized observations inspected.** This is a bounded negative finding, not proof that no internal/private capability exists. No private endpoint, browser session, credential workaround, new grant, server, synchronization, refresh or order action was used.

The Principal commissioned a bounded investigation and conditional extension of installed `ww export tt1-cadence`, with `p50Probability` distinct from `p50ClosingDebit`. Explicit absent-value representation and documentation are authorized if no source is established. Existing accepted exporter source is `2b7e2eb8`; branch delivery `5e868296`. Remote main and root are `8b6857fdfca667bbba6412f196dec2bb2690bfb4`; worktrees were clean. Authority/bootstrap subjects were recovered through root AGENTS/docs README, unchanged applicable authority checked against main, complete parking-lot/journal continuation sets indexed and maintained Position/assimilation boundary recovered. WW-GATE-001 remains STAGED/inactive; ASSIM-0002 is not being resolved. No v2 work.

## Official evidence

- [Official API reference](https://developer.tastytrade.com/reference/) publishes16 service specs/96 operations. Every downloaded OpenAPI document was parsed recursively, including descriptions, properties, response/request schemas and examples. There were **zero P50/probability matches**, not merely zero matching search-engine hits. Version/hash receipts below make the scope reproducible. Arbitrary-extension schemas cannot establish an undocumented semantic field.
- [Tastytrade UI trade details](https://support.tastytrade.com/support/s/solutions/articles/43000528791) explicitly lists Probability of making50% separately from POP and says trade details apply during order entry because markets/prices can change. This establishes UI availability, not an API. Historical Principal UI observations TLT83% and IWM87% are neither current nor held-position sources; they are not exported as probabilities.
- [Positions contract](https://developer.tastytrade.com/openapi/balances-and-positions.json): `CurrentPosition` has exact instrument identity/side/quantity, opening values and other holding facts; no structure-level P50. [Market data](https://developer.tastytrade.com/openapi/market-data.json): `MarketData` supplies quotes/Greeks/volatility, not a strategy P50. [Market metrics](https://developer.tastytrade.com/openapi/market-metrics.json): underlying metrics are not trade-level P50. [Risk parameters](https://developer.tastytrade.com/openapi/risk-parameters.json): collateral/range/limit parameters, not a probability model.
- [Orders](https://developer.tastytrade.com/openapi/orders.json) including dry-run responses and [margin](https://developer.tastytrade.com/openapi/margin-requirements.json) including its dry-run have no documented P50 output. No new POST previews were made for this investigation. The previously authorized retained margin dry-run observations were inspected separately; BP/`is-spread` fields do not supply P50.
- [Backtesting](https://developer.tastytrade.com/openapi/backtesting.json) has `takeProfitPercentage` (example50), historical `profitLoss` and simulate-trade pricing; those are exit parameters/realized historical outcomes, not broker modeled P50. No backtest/simulation was invoked.

## Actual authorized reads and existing implementation

The installed standalone collector was run without changing its request surface: existing OAuth authentication, then GET positions, ordinary orders, complex orders, market-data/by-type, current equity session, balances and held margin requirements. Retrieval ended **2026-10-29T21:28:15.047Z**; all7 captured financial/session reads succeeded, four structures projected, no probability/P50/fifty field in any raw response body. `tt`'s own `projection.positions[].p50` is a **boolean test of working target = credit/2**, not observed broker probability. The collector still redacts native account references/tokens. No full finance dumps or credentials belong in Git.

Source search of scripts and v1 source found no installed exact broker P50 retrieval/calculation. Existing delta assignment proxies, POP, exit-progress labels and quote-quality measures are not reused as probability. Candidate-margin evidence from the prior task was read from its sanitized retained report; raw response trees contained no P50/probability field. Held coverage: no source established. Candidate coverage: UI documented, no authorized API source established. No undocumented live probe was attempted.

## Inputs, model and lifetime semantics

The inspected official material does **not disclose an exact P50 formula, input contract, model version, calibration or per-held-position probability clock**. Proprietary implementation details are therefore unknown; it would overstate evidence to assert a particular proprietary algorithm or that it is client/server computed. An independent model could use original-credit profit barrier, exact signed legs/quantities/deliverables, current spot/option prices, volatility surface/dynamics, remaining time, rates/dividends and exercise/management assumptions, but that is a separately specified research model, not reproduction of broker P50. These are research requirements, not verified broker inputs.

Entry-ticket P50 for a prospective new credit differs in subject from the probability that an existing original-credit target will be reached. Remaining-horizon/conditional-on-not-yet-exited semantics and treatment of changing marks/time/volatility are unverified. Official UI documentation warns that trade details are price/market dependent, so a historical ticket percentage must not be frozen as a lifetime constant. Exact held update behavior remains unknown. P50 also does not establish the probability of success under TT1's P50-or-21-DTE rule.

To enable exact integration, the provider must establish a supported authorized interface/calculation: precise definition/horizon and target basis, exact leg/quantity and credit inputs, result scale, model version, source observation/as-of timestamp, held-versus-candidate semantics and authorized credentials/scope. Provider API support can clarify this gap; no message has been sent. Manual UI observation would require exact structure, quantity, price/target basis and capture time; it remains manual evidence and is not automatically a held original-target probability.

## Small bounded implementation and proof

Reuse the existing position projection unchanged. Per held projected row add `p50Probability: null`, evidence status NOT_AVAILABLE, percentage-point unit0–100 and null source/observedAt (no invented observation clock). Add `p50ClosingDebit` as the existing credit/2 value, equal to `p50Objective.closingDebitPerShare`; preserve the existing target/order/exit fields and legacy boolean for compatibility. Coverage and package README explain missing probability and interpretation. No collector route, candidate/exit/BP/liquidity calculation, v2 code or strategy rule is changed.

Regression falsifiers: different structures/expirations retain their source identity, legacy true boolean/POP/delta/injected unverified87 cannot populate probability, probability is null rather than0, absent credit stays null, real zero credit stays zero, mismatched working target stays distinct, source/time remain null for unavailable values, full ZIP/coverage still validates. Focused tests and independent immutable review precede installation; actual installed command and archive/checksum/source inspection complete delivery. An implementer does not self-certify review.

## Public specification receipts

Downloaded directly from the official documented `/openapi/<group>.json` routes, October29,2026. All16 responses parsed successfully. No authenticated private route involved.

| Official document | SHA-256 |
|---|---|
| [account-status.json](https://developer.tastytrade.com/openapi/account-status.json) | 1f358c3212d28b424749646503af1deb57b1463dd269252a38795ff001c47efe |
| [accounts-and-customers.json](https://developer.tastytrade.com/openapi/accounts-and-customers.json) | 56a19159daf170950e63c50b4227c376a31f0fb634e6da1fda933769d6f781b7 |
| [backtesting.json](https://developer.tastytrade.com/openapi/backtesting.json) | 482676159080f9823721ac7273a0f466d454e7d4fb57323a9f891f9b76982c1d |
| [balances-and-positions.json](https://developer.tastytrade.com/openapi/balances-and-positions.json) | 0fa49e96241c49e7e280b9c9536b72f31316b2c7eb1e6d96c5fefb65a20c945b |
| [instruments.json](https://developer.tastytrade.com/openapi/instruments.json) | a4367fb9dd060cbd18c0fcf5c7adac8f0f9ff65489e58508ebebfdabc5350538 |
| [margin-requirements.json](https://developer.tastytrade.com/openapi/margin-requirements.json) | ada237bd3e263bb73536c86f0baf8902f6af051b92dcb1d7b713a4b079396c63 |
| [market-data.json](https://developer.tastytrade.com/openapi/market-data.json) | cdff4ad12ca5cfd0f1059b54ce9a47b463b53d3e60c23796b8484a8f1e15fc40 |
| [market-metrics.json](https://developer.tastytrade.com/openapi/market-metrics.json) | a29ca27e7c983d2f1d0d1078eb10bf8b3d1524d414ba1d03eb21fbd9c4d7403c |
| [market-sessions.json](https://developer.tastytrade.com/openapi/market-sessions.json) | dbef53e1c524a6e9f55fa726731ca18413ff301a4c97ea4c974791ae4378d03a |
| [net-liquidating-value-history.json](https://developer.tastytrade.com/openapi/net-liquidating-value-history.json) | b220816e64fbc3bf6388092bd93def9ebb7a46802f8a51e88def35cf4308ed59 |
| [orders.json](https://developer.tastytrade.com/openapi/orders.json) | a92419137b22640d17fb38d15364426909027a7cebe96e74f510ae808ad7fc8b |
| [quote-alerts.json](https://developer.tastytrade.com/openapi/quote-alerts.json) | cd4ba9004d024e46584309a8b7fde8cdf05ac9fa2ad1f6e9c69f27943b4d2489 |
| [risk-parameters.json](https://developer.tastytrade.com/openapi/risk-parameters.json) | 64e02277be25c86ce680ab9db0553749d62d6709b576a26b8b7ee4787547171b |
| [symbol-search.json](https://developer.tastytrade.com/openapi/symbol-search.json) | 9ae5413056445967b20ad76abc6efc6d0a06976813bbe68b40b6aeef0ef61799 |
| [transactions.json](https://developer.tastytrade.com/openapi/transactions.json) | 42acf37ab14cba77133fdd488c08d3d08a93fff99d183ef1728196dda1f76870 |
| [watchlists.json](https://developer.tastytrade.com/openapi/watchlists.json) | 23a68f518f91bab66a4cb440b696ac8af6c500db9b427cfb4b5138e0adc854c4 |
