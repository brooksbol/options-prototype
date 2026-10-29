# TT1 cadence evidence export

Task: Principal-authorized bounded implementation, October 29, 2026. Scope is a CLI evidence package, not API v2, Talk, strategy admission or brokerage execution. This extends the October 29 external evidence specimen and reuses the accepted v1 liquidity code on main `b74d127f`.

Run `ww export tt1-cadence` (optional `--verbose`). One verified ZIP is published atomically in the actual user's Downloads directory. Existing files are never overwritten; subsequent exports get a UTC timestamp and, if necessary, numeric collision suffix. Output contains only the six requested result files, no code, logs, credentials or unbounded source dumps. `manifest.json` checksums the other five members; ZIP construction verifies all six exact contents and CRCs before publication. File mode is 0600.

The NY session date uses the existing versioned 2026 calendar. On a nontrading date it explicitly names the most recent trading session and uses that session as the DTE reference. Unsupported calendar years fail without an export. Candidate DTE is recalculated from expiration dates. Any disagreement with stored backend DTE is reported; the liquidity CSV preserves the exact accepted table calculation on the original snapshot.

The contract/pair JSON reproduces the original 14-ETF research universe (IWM, TLT, SPY, XLE, XLF, EWZ, EEM, HYG, GDX, SLV, GLD, QQQ, USO, IBIT). The liquidity CSV covers the full snapshot universe. Neither population is automatically qualified for trading. All observed eligible expirations remain available; closest to45DTE is identified as preferred. Signed short put delta is -0.30 through -0.20. Every retained lower-strike put is considered, regardless of long delta or spread width. Missing/inadmissible/negative-credit evidence remains explicit. Numeric dollar outputs are conditional on a conventional100 multiplier until actual contract terms are verified.

## Reuse and authority

- `GET /api/evidence/snapshot` on the existing v1 service reads retained evidence. The complete snapshot is bounded in memory and is never dumped into Downloads.
- `buildSymbolLiquidity` and existing liquidity grade/provenance helpers are imported directly from accepted v1 TypeScript. The browser's existing CSV column schema is moved without changing its values into `symbol-liquidity-csv.ts`; both browser download and CLI call it. No second liquidity formula, changed grade threshold or acquisition behavior.
- `ww` uses its existing Wheelwright credentials for Account discovery and only the two independently inspected pure-read endpoints: `/v2/account-balance-observations` and `/v2/option-inventory`. It does not call financial Position/Order facades or transaction history, which can perform read-through/admission.
- A bounded subprocess reuses standalone `tt live --tsv` acquisition and `projectLive`. Brokerage credentials stay in that standalone process. Its only POST is existing OAuth authentication. A narrowly bounded current balance GET reuses the already implemented broker route `/accounts/{native}/balances?currency=USD` from `TastytradeClient.settledCashBalance`; it performs no Wheelwright admission or persistence.
- The Principal previously established TT1 as the sole tastytrade Account. Backend metadata currently withholds its native reference, so the standalone default single-account selection is reused and labeled with that attribution. Multiple native accounts refuse implicit selection. A supplied/disclosed backend native reference, where available, must match. Neither a nickname nor account ID expands grants.

No account sync, force acquisition, market refresh, order submission/cancellation/replacement, service/database/schema/grant/API v2 change is included. Original `tt` sources are unchanged. This is the explicitly commissioned external-evidence-composition export, not a new authoritative v2 financial model.

## Interpretation and limits

Read completion is distinct from evidence readiness. The manifest always qualifies current decision readiness as PARTIAL while candidate contract terms, individual quote clocks and complete strike coverage remain unverified. Missing sources are recorded, not silently replaced. If no useful source is accessible, validation fails, or capacity is exceeded, no completed ZIP is published. Expected source-denial/unavailability can produce an explicitly PARTIAL result when other useful observations were retrieved.

Chain acquisition time is not quote observation time or independently established underlying spot time. Backend admissibility is preserved, not overridden with a new freshness rule. OI and volume values are preserved; BUG-055 means normalized zeros cannot always distinguish provider zero from missing source data. The CSV's accepted v1 missing/zero handling is unchanged.

Direct current-balance responses and historical retained observations are separate. Current BP requires a usable same-NY-date source clock, not just a new retrieval time; the response remains non-atomic with holdings/orders and cannot guarantee orderability after the read. Never subtract committed BP again from available BP. Broker per-position requirements, full fee-adjusted realized P/L and a portfolio correlation matrix remain unknown unless separately observed.

Original opening fills, working exits, derived P50 and21DTE objectives and actual closing fills are separate evidence. A GTD date expires an order and does not execute a time exit. At most one qualified new short put vertical per session; WAIT is valid. The operator verifies actual account capacity, contract identity/terms, package markets, fees, target tick rounding and order state in Tastytrade and alone controls execution.

## Proof and delivery

Falsifiers cover positive put delta, fractional/large widths, missing long delta, missing versus zero quotes/OI, nonpositive credits, mismatched chain identity, stale source dates, holidays/NY dates, shared CSV bytes, denied reads, malformed/all-failed inputs, account mismatch, no broker writes, ZIP corruption/hashes, collision/no-overwrite and installed CLI behavior. The real October29 external specimen is an optional private regression reference; no financial specimen or credentials are committed as test fixtures.

Implementation uses only Node24 built-ins, existing TS source and Python3's standard `zipfile`. No dependency installation is needed. Independent review and actual installed-command verification are recorded below when completed; implementation tests alone are not Principal acceptance.

### Initial independent review and correction

Independent source reviewer REJECTED immutable `bea1a944` with two reproduced synthetic falsifiers: empty holdings caused `tt live` to skip order reads while reporting complete collection; and a nonempty failure-envelope object could let total financial-evidence failure reach ZIP publication. The original commit/release preparation remains preserved and was not installed. The disposition is retained in `ww-export-tt1-cadence-initial-review.txt`.

Correction is to source-coverage invariants rather than presentation: always acquire missing order pages through the existing tt pagination readers, even with zero holdings, and gate publication on actual successful financial evidence (including an authoritative empty inventory/order read) rather than transport-wrapper object existence. Network failures in optional broker reads are recorded. Source identity, valuation formula, liquidity, trading parameters, grants and v2 are unchanged. Independent re-review and installation remain separate.

### Source usability contract after second independent falsification

Independent re-review of `feb98baf` verified the empty-holdings order correction and original failure-envelope falsifier, but REJECTED a remaining field-presence assumption: a broker-only `derivative-buying-power: "UNAVAILABLE"` could reach publication. Its exact report is `ww-export-tt1-cadence-second-review.txt`.

The correction now defines source usability separately from transport success, wrapper existence and field presence. Broker balances and retained reported fields must contain a finite numeric observation (actual zero is valid); valid custody/order collections can establish known empty state; incomplete empty order pages do not; malformed holdings cannot establish usable exposure. The same finite-number contract governs balance display/currentness. Table-driven falsifiers cover null, absent, empty, unavailable, nonnumeric, infinite, overflow, boolean and container values, as well as legitimate zeros and qualified empty collections. This is a source-fact invariant, not an expanding list of special-case failure labels. Earlier frozen commits remain unchanged and uninstalled.

Acquisition age is evaluated no earlier than snapshot receipt, since a concurrently maintained chain can be acquired after the export command started. DTE remains anchored to the named session. This preserves subject clocks and avoids falsely excluding observations acquired during snapshot retrieval.
