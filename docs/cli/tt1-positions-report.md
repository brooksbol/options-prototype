# TT1 Positions — daily ChatGPT position report

**Lookup name:** `TT1 Positions`
**Standing:** Principal-accepted reporting presentation / operator preference (2026-10-29). This is a reporting specification, not trading policy, market evidence or authorization to place orders.
**Source:** `ww export tt1-cadence` ZIP generated for the trading session, including `tt1-account-positions-orders.json`, `evidence-coverage.json` and manifest. Repository: `brooksbol/options-prototype`.

## Cold-start retrieval

When the Principal says **"TT1 Positions"** (or asks for the TT1 positions report), first bootstrap using repository `AGENTS.md` and `docs/AGENTS.md`, find and read this file, then use the latest attached daily export ZIP. Never reconstruct the report format from conversation memory. If the ZIP is absent, ask for the latest `~/Downloads/tt1-cadence-*.zip`; do not republish old values as current. The source data wins over illustrative figures.

## Accepted display contract

Show a single compact report headed **TT1 — Position Performance**, with the session date.

Above the table, show **Available BP** and **Deployed BP** as two headline values, and one thin **segmented horizontal capital-allocation bar**: segments by position BP, remainder available BP; short captions for percentage deployed and percentage available. Prefer distinct restrained segment colors. Do not introduce a second table, a second chart, or a separate disclaimer paragraph.

Show exactly **one table**, in this column order:

| Position | DTE | P/L | BP | Max loss | Target profit | Profit / BP | Profit / max loss |
|---|---|---|---|---|---|---|---|

- **Position:** underlying and short/long strikes; for iron condors, concise structure name.
- **DTE:** `x/y` (remaining/original). Heading is **DTE** only; no parenthetic explanation.
- **P/L:** current indicative position profit/loss, gross, signed currency; heading simply **P/L** (not `Current`, `Unrealized` or `Gross`).
- **BP:** position's broker-reported current buying-power footprint, matched to exact margin groups; heading simply **BP**.
- **Max loss:** theoretical defined-risk maximum expiration loss computed from verified structure geometry and opening credit, not interchangeable with broker BP.
- **Target profit:** gross profit at the *working* profit-taking exit order based on actual opening credit and working closing debit. If no working target is observed, do not silently assume one; show unavailable.
- **Profit / BP:** target profit divided by broker-reported position BP.
- **Profit / max loss:** target profit divided by theoretical max loss.
- Include a **Total** row with sums for additive dollar measures and ratios of summed target profit over summed denominators; DTE shows a dash.
- Currency figures should be compact; losses use a minus sign; do not imply a missing value is zero.
- Never put `Opening credit`, `Close debit`, `Current`, `Unrealized`, or `exit` into column headings, and do not add `Target` to either of the final two ratio headings.
- Keep the output focused on this report, not a long interpretation or disclaimer. Necessary qualifications should be in provenance/data, not repeatedly restated beneath the report.

## Data discipline

Read fresh fields from the supplied ZIP rather than baking in example amounts. Prefer matched broker margin requirements for BP and actual broker order state for target profits; use the evidence package's own source clocks. Exclude known closed structures from the open-position report. If a field is unavailable, show `—`, not a fabricated number. Calculate derived figures transparently; don't turn P50 *closing debit* into a modeled P50 *probability*. A probability column was explored but is **not part of this accepted table** absent a new Principal choice.

Use `ww export tt1-cadence` as the ordinary operator workflow (saved in `~/Downloads`). Do not initiate brokerage actions.

## Future Wheelwright Talk direction — Principal intent (2026-10-29)

The Principal states: **"this will eventually be something that becomes the new normal in ww talk."**

This accepted TT1 Positions presentation is a **working operator-facing precedent** for a future default Wheelwright Talk portfolio/position response: concise capital allocation visualization, one integrated performance table, and no redundant generic reports. Recover and reuse this precedent during Talk Product discovery and design rather than re-deriving the operator experience from scratch.

**Standing:** Principal-stated future direction, **not** an authorization or accepted design to implement Talk integration now. The current working delivery is the ChatGPT daily ZIP report. Future Talk work must independently reconcile Product authority, intended scope, evidence/data paths, and implementation gates. Do not modify Talk or API v2 as part of this documentation capture.

## Example only — 2026-10-29 historical snapshot, not current data

Available BP $2,994.17; deployed BP $2,237.00; 42.8% deployed / 57.2% available.

| Position | DTE | P/L | BP | Max loss | Target profit | Profit / BP | Profit / max loss |
|---|---:|---:|---:|---:|---:|---:|---:|
| IWM 272.5/269 | 43/43 | +$3 | $288 | $285 | $35 | 12.2% | 12.3% |
| QQQ 700/690 | 50/51 | −$87 | $672 | $759 | $130 | 19.3% | 17.1% |
| SPY 755/739 | 50/51 | −$40.50 | $1,250.50 | $1,291 | $167 | 13.4% | 12.9% |
| UNG iron condor | 29/45 | −$14.50 | $26.50 | $41 | $7 | 26.4% | 17.1% |
| **Total** | — | **−$139** | **$2,237** | **$2,376** | **$339** | **15.2%** | **14.3%** |

This example is for formatting regression only; do not reuse the values on subsequent days.
