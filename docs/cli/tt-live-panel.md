# tt live compact panel

Principal-approved October 11, 2026; implementation candidate, manual acceptance separate.
Standalone tastytrade companion only. No Wheelwright v2 Position, order-writing or management-rule changes.

## Approved contract

Human columns: SYMBOL, PAYOFF, EXP, QTY, DTE, EXIT, OPEN, NOW, TARGET, P/L, PROG, SPOT, QUOTE.
One row per recognized position; masked account and expiration year in heading. Mixed expiration years appear in each EXP value. Broker position order is preserved.

OPEN is weighted actual opening-fill net credit. NOW preserves the existing sum of short leg broker mids minus long leg mids. TARGET is the verified broker debit limit. P/L is `(OPEN - NOW) * quantity * multiplier`, gross before fees. Partial-close accounting remains unsupported. PROG is signed `100 * (OPEN - NOW) / (OPEN - TARGET)`; negative and over-100 results are retained. `~` denotes indicative mid at/below target while still held, never execution. P50:B requires actual 50% gross credit capture; other targets use LIMIT:B and the numeric TARGET. T flags an existing exit transition; `tt positions` retains broker target/stop details. No DTE exit is inferred. DTE retains New York calendar-date counting floored at zero.

SPOT is exclusively tastytrade equity `mid`, inside validated nonnegative bid/ask, with a valid quote-update timestamp and positive midpoint. No last, mark or close substitution. This is a quote observation timestamp, not a trade-event timestamp. Missing, duplicated or malformed equity observations produce unknown spot; valid option economics survive. Stale spot retains a numeric value plus `!` but cannot supply an active marker. Eligible retained spot can supply a marker.

O/S label independent option/spot observations. O uses the oldest leg. `r` identifies eligible broker-confirmed latest-completed-session observations, including shortly after close. They are not official closing prices. Ordinary 12-hour freshness is unchanged; session lookup failure retains age-only behavior. Missing evidence is `—`, stale is `!`. There is no leg timestamp-skew bound or persistence fallback. Provider evidence limit remains 100 held option symbols; equity reads are separate bounded requests.

## Terminal behavior

Default width comes from stdout, then COLUMNS, then 157; `--width 20..1000` overrides it. Every invocation checks width, including watch refreshes after resizing. Fixed PAYOFF width is 31 cells. Numeric fields right-align; financial values are never truncated. A narrow view drops PAYOFF, OPEN, TARGET, then SPOT as necessary, retaining identity, exit, P/L, progress and independent evidence. An impossibly narrow view explicitly reports the number of positions not displayed and directs the operator to TSV. Layout reserves the last terminal cell.

ANSI is excluded from cell counts; combining sequences and wide graphemes are measured. Apple Terminal ambiguous-width line glyphs are treated as one cell. `--no-color`, nonempty NO_COLOR or TERM=dumb disables color; `--ascii` (also TERM=dumb) provides ASCII. Normal human output continues emitting ANSI through pipes for watch -c. Static economics remain neutral; current P/L/progress use sign colors, evidence uses amber/gray. No whole-row coloring or bullish/bearish desirability colors.

TSV retains the existing schema, ordering, optional NOTE, calculations and quote-label semantics. It acquires no new spot evidence. PAYOFF is reserved for the subsequent silhouette PR; block-height rendering was explicitly rejected by the Principal.

## Verification

Compact-panel tests cover 20 rows at 157/189 columns; numeric alignment; 100/80/20-column fallbacks; ANSI/Unicode widths; ASCII/monochrome; spot validation; both mixed-freshness directions; retained observations; target notation and non-clamped progress. Domain tests preserve fills, quantity/multiplier, gross valuation, fail-closed behavior, legacy direction and calendar conventions. TSV was compared byte-for-byte to PR 1 for normal, retained, stale, empty and transitional-order specimens.

Provider capability: https://developer.tastytrade.com/reference/market-data/getMarketDataByType/
