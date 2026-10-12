# Income Wheel methodology notes — 2026-10-12

Status: Non-authoritative research record. Not ratified Wheelwright policy or permission to change ranking, posture, or execution. Reconcile through existing PL-* governance before codification.

## Operating objectives
- October 2026 cashflow target remains **$6,000**. Codex's description of it as aggressive is a forecast/feasibility assessment, not a target change.
- Income Wheel seeks premium cashflow with a Monday reset after Friday expiry; track booked premiums separately from realized capital erosion.
- Options capital approximately $88,462: $51,900 available cash plus $36,562 in BDRY/DRAM/GDXJ/URA expiring October 16. ETHA and SPYI shares outside this options allocation but relevant to correlated exposure.
- Premium booked in September on options expiring October 16 is September production, not October.
- Maximum new-trade DTE 18, October 30 final October expiry. No requirement to trade October 12. Model Oct 19 and Oct 26 recycling without double-counting principal.
- Prefer to exclude governance DANGER products; REVIEW evaluated individually; UNKNOWN not assumed safe. DANGER concerns leveraged, inverse, daily-reset, and single-stock structural complexity, not high IV alone.

## Volatility methodology and provenance
- Tradier midIv and smvVol are point-in-time, option-specific absolute IV, not IV Rank.
- tastytrade /market-metrics provides per-underlying IV Rank, IV Percentile, IV Index, historical volatility 30, IV-HV30 difference, timestamp, and distinct TOS/TW ranks.
- Raw rank and percentile values are generally 0–1; display as 0–100, preserve raw values, sources and observation times. Investigate negative ranks rather than silently clamping.
- TOS = thinkorswim; TW = tastyworks/tastytrade. Exact algorithmic differences have NOT been established. Do not average or silently substitute methodologies.
- Observed Oct 12: EWZ TOS 67.1 vs TW 21.0; USO TOS 20.7 vs TW 56.0; XLU TOS 61.4 vs TW 9.0. Methodology reverses EWZ/USO relative rank.
- IV Rank measures position in historical low/high IV range; IV Percentile measures share of historical observations below current IV. They can disagree legitimately after extreme historical spikes.
- Underlying IV Index is not the selected contract's IV. IV-HV30 is provider-derived and may not reproduce exactly from independently exported IV Index and HV30 fields.
- VIX is broad-market context, not a standalone entry signal for commodity, country, sector, or crypto ETFs. No VIX or IV Rank decision thresholds are ratified.
- These volatility fields remain observational; do not silently alter Wheelwright candidate governance, ACTIONABLE posture, rankings, or policy.

## Analytical process to revisit/codify
1. Reconcile actual October booked production, account scope, and realized erosion; label incomplete evidence. Do not double count September premiums or episode presentation figures.
2. Compare puts and buy-writes on strike, DTE, premium, capital, breakeven, maximum profit, downside, spreads, open interest, executable quote and freshness; not premium alone.
3. Include existing positions and correlated energy, financials, rates, metals, semiconductor, crypto, country and event exposure.
4. Exclude DANGER from preferred portfolios; scrutinize REVIEW and UNKNOWN.
5. Examine both TOS and TW IV Rank, IV Percentile, IV Index, historical vol, IV-HV spread, and evidence provenance. Do not assume high rank predicts favorable economic returns.
6. Model distinct options capital separately from cumulative capital turnover across October deployment windows; account for liquidation, settlement, and erosion.
7. Compare maximum-premium, volatility-informed, lower-risk, and delayed-entry scenarios. Do not force cash utilization.
8. Keep the $6,000 goal visible, report the verified gap and scenario sensitivity without presenting hypothetical future premium as booked production.

## Findings requiring further validation
- Codex flagged Brazilian election runoff Oct 25 as an EWZ weekend risk after Oct 23 expiration and before Monday liquidation.
- USO is REVIEW (futures structure), not DANGER; leveraged SOXL is DANGER.
- Codex proposed USO Oct 23 $153 buy-write + KRE Oct 23 $69.50 put ($22,146 capital, $522.50 midpoint premium) as an analytical comparison, NOT an authorized order.
- Codex found $84.45 confirmed October cash production in a SOURCE_INCOMPLETE report, leaving $5,915.55 against target under that narrow scope; broader episode/account reconciliation is unresolved.
- Future work: establish TOS/TW methods and corporate-action handling; test incremental predictive value of IV metrics out of sample; reconcile quota across account sources.

Provenance: October 12, 2026 user / ChatGPT / Codex research conversation. Snapshot figures require source validation before trading.