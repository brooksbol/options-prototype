# BUG-034 — tt live suppresses last-session values while markets are closed

- **Status:** Resolved
- **Severity:** Not established
- **Area:** CLI / tt live
- **Provenance:** Principal Sunday observation and explicit remediation instruction, October 11, 2026

## Observed failure

Sunday EWZ and XLE rows showed 42h quote ages, blank CURRENT, P/L DAY,
TOTAL G/L and DIRECTION, and `quotes stale` progress. Economic colors disappeared.

## Intended semantics violated

The Principal confirmed that tt live should remain useful on Sundays using Friday's
available session evidence and corresponding colors, with honest observation dates.
Latest quotes are not promoted into official closing prints.

## Diagnosis / root cause

Quote valuation and direction used a 12-hour wall-clock limit without considering
market closures. Direction also depended on a separate optional DXLink snapshot,
although the existing REST option quote response already contains signed `delta`
for every observed leg. Incomplete streaming acquisition therefore hid direction
unnecessarily. Actual REST payload inspection confirmed eight populated deltas.

## Scope / non-goals

Read-only tt companion only. No Wheelwright acquisition, policy, trading, account
or position persistence change. Missing broker evidence remains unknown.

## Acceptance criteria

Retain latest completed-session evidence during broker-confirmed closure, date it,
preserve sign/direction colors and color-free TSV, and reject older-session evidence.
Resume ordinary freshness once a newer session opens. Missing session context
retains the original age-based behavior.

## Remediation history

October 11: shared broker-session freshness logic covers valuations and direction.
The existing session read supplies current/previous/next session times, without
weekday-only calendar or holiday guesses. Direction now sums quote.delta × signed
held quantity × multiplier using the same quotes and timestamps as valuation.
The tt live streaming token/instrument/WebSocket acquisition is removed. The
existing neutral band and direction colors remain. Missing or malformed delta
leaves direction unknown without hiding valid economics. CLI help explains the
retained observation date and broker daily-close reference.

## Verification

Deterministic tests cover Sunday values/colors/direction, Saturday and Monday preopen,
holiday/short-session context, older legs, missing/open session context, resumed
trading, signed REST delta strings/numbers, missing/malformed delta, and TSV fidelity.
The CLI allowlisted-read test rejects any additional streaming/instrument requests.
Read-only production Sunday verification returned EWZ CURRENT 0.60 / TOTAL G/L
-$18 and XLE CURRENT 0.41 / TOTAL G/L -$23, dated `Fri, 10/09 (42h)` with economic
colors. Both normal human-table and TSV production reads returned NEUTRAL for
EWZ and XLE, calculated from the returned REST deltas. All 30 relevant tests pass;
Roadmap generation/check and git diff --check pass. Principal manual acceptance
remains separate.

## Related

- `scripts/tastytrade-freshness.mjs`
- `scripts/tastytrade-live.mjs`
- `scripts/tastytrade.mjs`
- [Broker session response contract](https://developer.tastytrade.com/reference/market-sessions/getMarketTimeEquitiesSessionsCurrent/)
