# EVA-001 — Retained Data and Retrieval Feasibility

October 14, 2026. Evidence classification: directly inspected facts, vendor-documented possibilities and unresolved local access are kept separate. Scope is the repository's named research archives, the retained Partial Collar raw/normalized files and one offline recovery database. This is not a machine-wide data census or inspection of operational databases, private account payloads or subscriptions through billing portals.

## What is actually held

The [inventory](evidence/inventory.json) is the machine-produced basis of these counts. Hashes show correspondence with recorded files, not market accuracy or executable fills.

| Resource | Direct observation | What it supports and does not support |
|---|---|---|
| Retained Theta history | All 82 monthly files match their October 8 manifest. Manifest records 841 IWM EOD rows, June 1, 2023–October 7, 2026, and 692 RVX EOD rows, January 2, 2024–October 7, 2026. Unavailable months are retained, not silently removed. | Underlying/index history and provenance precedent. These are not historical option quotes or SPY/XLE/EWZ panels. |
| Longer public-provider history | Partial Collar raw IWM Yahoo JSON, FRED RVX CSV and Cboe RVX CSV remain locally available. Its documented IWM capture spans May 26, 2000–October 7, 2026. | Potential underlying-method precedent, with the original adjustment/vintage limitations. It cannot supply option premiums, IV or managed-exit labels. No new historical download occurred. |
| Three retained Tradier research archives | All archive hashes match their manifests. Two October 1 specimen archives contain 25 chain payloads across eight underlyings; six payloads repeat across archives. | Point-in-time option terms, quotes and Greek/IV fields. Payload repetition is not independent evidence or a quote path. The third archive is the earlier identity census. |
| SPY chain specimen | November 20 expiry: 442 contracts; November 13: 84 contracts. All rows have bid/ask and non-null `mid_iv`/`smv_vol`. The 442-contract body is duplicated in the other specimen archive. | Demonstrates field availability for these snapshots, not quote freshness, nonzero valid IV, simultaneous leg markets, trade reconstruction or general historical coverage. Both expirations are still in the future at this audit. |
| XLE/EWZ in those chain specimens | Neither appears among the eight chain underlyings. | Absence in the audited contrast panel; no assertion that the provider or the rest of the machine lacks their history. |
| TT Live specimens | Accepted construction/target behavior, sanitized observations, rendered specimens and tests are retained. | Operator and semantic precedents. They are selected examples, not a historical sampling frame, broker fill calibration panel or archived POP/P50 probability series. |
| tastytrade market metrics | October 12 full-universe coverage audit is retained. | One dated cross-section of field coverage, not a historical IV/forecast dataset. IV Rank is distinct from contract IV. |
| One offline v2 backup | Read-only immutable inspection: 316 brokerage artifacts, 28 Position snapshots; zero rows in `evidence`, `spot_history`, `direct_quote`. No account identities/payloads exported. | Brokerage observations in this particular backup are not an option-market path archive. Counts do not describe the current live backend. |

Underlying source records and limitations: [Partial Collar DATA.md](../partial-collar-test1/DATA.md), [Theta manifest](../partial-collar-test1/data/theta_history_manifest.json), [coordinate archive manifest](../../../data/research/specimen-coordinate-comparison-2026-10-01/artifact-manifest.json), [selection archive manifest](../../../data/research/specimen-selection-pilot-2026-10-01/artifact-manifest.json), [market-metrics audit](../../../data/research/market-metrics-coverage-2026-10-12/README.md). Other prior broker-export research, including the SPY overwrite analysis, is a methods/benchmark lead; its results are not iron-condor observations.

## Current access versus historical access

One bounded GET to the documented existing Theta Terminal at `127.0.0.1:25503` returned `ConnectionRefusedError`; the dated request and error classes are retained. No credentials were read, no terminal/service was started, and no subscription was changed. Current stock and option entitlements therefore remain **UNVERIFIED**. October 8 successful IWM/RVX requests and older-date HTTP 403s establish only those earlier tested requests. They do not prove current tier, option access or an exact first accessible option date.

No Tradier, ORATS or tastytrade authenticated requests were issued. The audited Tradier captures preserve separate `mid_iv` and `smv_vol`; they do not establish a direct ORATS account or historical ORATS entitlement. Current brokerage position/order data is not needed to draft this retrospective protocol.

## What the vendor documents

Official documentation retrieved during this audit describes the following possibilities; none verifies this account's access:

- Theta distinguishes free EOD from paid historical quote access. The subscription page contains conflicting free-history and request-rate descriptions between narrative and tables. Record actual endpoint/tier results rather than choosing a convenient statement. [Subscriptions](https://thetadata.net/docs/Articles/Getting-Started/Subscriptions.html).
- Option history can provide timestamped NBBO bid/ask, sizes and conditions. With an interval, it selects the last quote at that interval boundary; actual quote age still needs verification. [Historical quotes](https://thetadata.net/docs/operations/option_history_quote.html).
- Theta EOD option reports are generated at 17:15 ET and use the last NBBO at generation. Report creation is not quote time, and this cannot establish an executable 15:55 or intraday target fill. [Option EOD](https://thetadata.net/docs/operations/option_history_eod.html).
- Greeks/IV are computed analytics with rate, dividend, model/version and price-source choices. Historical calculations must preserve those choices and publication timing. Default settings are not automatically point-in-time research truth. [Greeks methodology](https://thetadata.net/docs/Articles/Data-And-Requests/Option-Greeks.html).

## Sufficiency verdict by question

| Question | Present verdict | Missing evidence |
|---|---|---|
| Inspect one supported chain's terms and IV fields | Feasible using retained SPY specimens | Quality validation before financial use |
| Construct historical four-leg candidates at a scheduled entry | Not yet demonstrated | Dated chain/contract enumeration, coherent underlying and leg NBBO/terms across historical entries |
| Evaluate a 50%-capture / 21-DTE managed policy | Not yet demonstrated | Quote paths, actual observation/quote clocks, target monitoring and delayed fill convention, missingness/assignment handling |
| Prove historical package execution | Not established by NBBO alone | Complex-order or broker order/fill evidence; otherwise explicitly assumed spread/slippage scenarios |
| Compare IV-based and historical-IV-adjusted models | Not yet demonstrated | Consistent historical entry IV and sufficient prior history, with model/vintage provenance |
| Validate tail robustness across crises | Not demonstrated | Actual option coverage across distinct stress periods and adequate independent outcome blocks |
| Compare with brokerage probability estimates | Not currently supported | Archived contemporaneous probability values with event/horizon/method; TT's P50 target is insufficient |

**Smallest defensible next data step:** once an authenticated terminal is available within a separately established retrieval envelope, inspect a small, predeclared, outcome-blind historical panel for SPY first. Expand to XLE/EWZ only according to the same coverage tests. The detailed prospective probe plan is in the protocol. This audit neither downloaded that panel nor certified executable reconstruction.

If only EOD history is available, narrow explicitly to once-daily observation or terminal-payoff research. Do not retain the label of an intraday continuously working profit target. A two-leg vertical reduces quote-coherence burden, but cannot cure absent quote history and would answer a narrower structural question. No change to the proposed iron-condor population has been made by selecting favorable results.
