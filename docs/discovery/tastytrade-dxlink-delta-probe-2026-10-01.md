# DXLink delta acquisition probe — 2026-10-01

**Scope:** Read-only acquisition-capability experiment for XSP, TLT, and SPY only. This is not Wheelwright strategy authority, a delta target decision, a cross-root selector, or an Exit Reliability result.

## Documented capability and method

[tastytrade's DXLink guide](https://developer.tastytrade.com/docs/guides/stream-market-data/) documents a quote token from GET /api-quote-tokens, DXLink authentication, FEED_SETUP with a Greeks delta field, and subscriptions using option-chain streamer symbols. [dxFeed's Greeks reference](https://docs.dxfeed.com/dxfeed/api/com/dxfeed/event/option/Greeks.html) documents the Greek-event time field in milliseconds. The REST option chain supplies contract identity and streamer symbols; the REST quote response is not a delta source.

The isolated script subscribes to the **five exact 2026-11-20 puts nearest an explicitly supplied strike center**, breaking equal-distance ties toward the lower strike. It does not move to another expiration or substitute a contract. After the authenticated REST chain and quote-token reads, it subscribes to the five DXLink symbols for 20 seconds; connection/handshake has a further finite timeout. It requests eventType, eventSymbol, time, delta, and volatility. Output retains each positional Greek event row, contract identity, local REST request and receipt times, local subscription and event receipt times, and broker Greek time separately. It never exports OAuth or DXLink tokens.

For this probe alone, a delta is counted as usable if it is a finite put delta in [-1, 0] with a valid source timestamp no more than five minutes old at window end and not materially in the future. The five-minute rule is a disclosed acquisition convention, not a strategy or trading threshold. Missing/stale evidence exits nonzero. A complete five-contract set only establishes bounded-set coverage, not the globally nearest delta in the full chain.

Commands used:

    node scripts/tastytrade-delta-probe.mjs XSP --center 765
    node scripts/tastytrade-delta-probe.mjs TLT --center 78
    node scripts/tastytrade-delta-probe.mjs SPY --center 762

The centers were declared from a preceding read of each underlying's then-current mark. They are not target deltas or candidate-strategy strikes.

## Live observation

| Root | Contracts | Greek event | Usable delta | Contracts with repeated events | Contracts with source-time event after subscription | Source event age at window end |
|---|---:|---:|---:|---:|---:|---:|
| XSP | 5 | 5 | 5 | 0 | 0 | about 58 seconds |
| TLT | 5 | 5 | 5 | 5 | 5 | about 19 seconds for latest events |
| SPY | 5 | 5 | 5 | 0 | 0 | about 222 seconds |

Each window lasted about 20 seconds. All five contracts in each root received a source-time-bearing Greek event with delta. XSP and SPY each received a single five-contract batch whose **source timestamp preceded subscription** (about 38 and 202 seconds earlier respectively); neither had a later source-time update in the window. TLT received an initial batch dated about 62 seconds before subscription and a second batch dated about 1.4 seconds after subscription. The five contracts in each batch shared one source timestamp. Thus receipt during the window is not evidence of a Greek newly computed during the window.

The live quote-token response used host tasty-openapi-dxlink-md-ws.dxfeed.com rather than the guide's example tasty-openapi-ws.dxfeed.com. The probe accepts these two exact dxFeed hosts over wss only. The observed FEED_DATA packed multiple positional Greek records into one array; the decoder splits by the configured field count. A second FEED_CONFIG did not trigger a second subscription after the decoder correction.

## Bounded conclusion

DXLink delta was obtainable with broker timestamps and exact contract identity for these 15 declared contracts. This supports **conditional feasibility** of a delta-based acquisition primitive. It does not establish reliable freshness on every root or time, because two roots supplied only pre-subscription source events during the window and SPY was already more than three minutes old. A later selector would need a declared freshness rule, coverage rule, target delta, full candidate-region definition, and explicit failure when required contracts lack timely Greeks. This probe does not choose any of those research policies.
