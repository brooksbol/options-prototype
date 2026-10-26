# October 26, 2026 — Real-money Income Wheel deployment: Wheelwright Talk Product learning

**Standing:** Category D real-world operator/Product learning and replay specimen; **not** a ratified strategy, financial performance claim, accepted Talk functionality, new API contract, permission to trade, or implementation authorization.
**Source:** Principal's October 26, 2026 Wheelwright/ChatGPT conversation and user-supplied v1 opportunity, positions, Fidelity transaction-history and account-balance CSV exports. The raw account-bearing exports and full transcript were supplied in the conversation; **they are not committed here**. This checkpoint deliberately omits brokerage account numbers and other private identifiers.
**Related:** [ADR-024](../07c-adrs.md#adr-024-sdk-based-wheelwright-talk-mcp-integration-and-financial-authority), [PL-MCP-01 SDK Talk delivery plan](../implementation/pl-mcp-01-sdk-talk-delivery-plan-2026-10-25.md), [operator-question inventory](operator-question-inventory-2026-10-22.md), [Account/Operating Regime maintained meaning](../knowledge/domain/accounts-and-operating-regimes.md).

## Why this is worth preserving

This was an **actual, manually executed brokerage session with real financial consequences**. The operator used v1 exported candidates and holdings, a conversational assistant for scenario analysis, and Fidelity for order execution and post-trade reconciliation. **The SDK-based Wheelwright Talk did not execute or autonomously complete this workflow.** The session is a rigorous Product learning specimen for what the successor should eventually support through authorized API v2 capabilities and MCP, not evidence that it can do so already.

Principal's explicit learning request: **“persist this as a product learning exercise. a real world exercise”** (October 26). The observed Product question grew from candidate-trade selection into a whole-portfolio Monday Income Wheel workflow involving wait/deploy timing, existing free shares, cash, permitted options structures, account margin context, call-away preference, cross-symbol distribution, actual fills, and post-trade balances.

## Actual operator objective and evolving constraints

- Monday October 26, 2026: approximately **$4,000 in new gross option premiums** to meet a monthly cash-flow obligation, not a claim of investment profit.
- Initial hypothetical cash amount was $82,000; the operator corrected the **actual available initial deployment cash to $20,000** alongside free existing shares.
- Option expirations **no later than November 20, 2026** (25 calendar DTE from October 26).
- Income Wheel emphasizes repeatable premium production and capital redeployment; uncovered new obligations and downside exposures must not be inferred away.
- Existing shares should, when appropriate, **be called away after possible additional share-price appreciation**. Appreciation on assignment is **not** counted toward the $4,000 option-premium target. Neither assignment nor further appreciation is guaranteed.
- **SPYI expressly off limits** for covered calls or liquidation in this exercise. An existing encumbered BDRY holding/call was not available for the new covered-call plan.
- The operator compared (A) keep eligible shares and sell calls plus deploy cash, (B) liquidate shares and redeploy, and (C) hybrid selective liquidation/calls/cash. Avoid selling shares only to buy them back without an economic case.
- Broad-market volatility, VIX, spreads, and **WAIT or PARTIAL DEPLOY** are legitimate alternatives, not failures of the trade search. The $4,000 target is not a forced-deployment instruction.
- PTS is a Fidelity **margin-enabled Account**, but that does not establish actual margin borrowing, options permission, or Operating Regime for every quantity. Available without margin impact, margin buying power, settled cash, options collateral and borrowed debit are distinct.
- Other user-described environments for wider Talk coverage: Sawdust Growth Wheel and a planned ~$5,000 tastytrade transfer for defined-risk strategies. Those are **not part of the confirmed PTS trade tally**. Account does not determine Operating Regime under maintained authority.

## Chronological decision and evidence chain

| Stage | Actual observation or operator decision | Product learning |
|---|---|---|
| 1. Candidate universe | Uploaded v1 cross-entry export with quotes, deltas, premiums, DTE, execution/posture flags | Discover and qualify market-data provenance/age; rank candidates with actual available evidence, not model-invented quotes |
| 2. Portfolio reconciliation | Uploaded actual PTS positions; corrected cash from hypothetical $82,000 to $20,000 | Link available cash, free share lots, short options and coverage; don't double-count or infer governance |
| 3. Expiration/strategy constraint | November 20 cutoff, SPYI excluded, $4,000 premium target kept; call-away with appreciation desired | Preserve evolving cross-turn constraints exactly; option premium and contingent appreciation separately |
| 4. Fresh quotes and three-way comparison | Repeatedly refreshed cross-entry exports; compared all-liquidate, hold/write, hybrid | Recompute on each input version and make comparable capital/turnover/downside trade-offs visible |
| 5. Select hybrid | Sell GDXJ, IBIT, SLV; retain DRAM, EWY, URA for calls; allocate cash to USO, PTF, BNO, ETHA | One portfolio decision coordinates stock sales, covered calls, CSP and buy-writes; avoid needless sell/buy-back churn |
| 6. Capital correction | Fidelity available-without-margin-impact value after share sales was **$38,784.15**, less than projected $39,468; operator allowed slight margin impact | Use actual broker balance semantics; ask brokerage buying-power preview, don't equate the budget gap with loan debt |
| 7. Manual executions | Operator submitted orders at Fidelity; second history export showed all seven planned option structures filled, with some strikes changed | Reconcile intended versus executed contracts and fills; don't claim assistant or Talk placed orders |
| 8. Post-trade reconciliation | Brokerage history showed **$4,071 gross new option credits** and **$4,064.32 net option proceeds**; later balances showed **$3,606.47 available without additional margin impact** and a **$10,300 PTF put reserve** | Count gross premiums separately from net proceeds, realized P/L, future obligations, margin borrowing and retained option liability |

### Confirmed option credits from the supplied updated history

| Filled structure | Expiration | Qty | Strike | Filled credit/share | Gross option premium |
|---|---|---:|---:|---:|---:|
| DRAM covered calls | 2026-11-20 | 3 | $49 call | $3.16 | $948 |
| EWY covered call | 2026-11-20 | 1 | $154 call | $8.12 | $812 |
| URA covered calls | 2026-11-20 | 2 | $35 call | $1.42 | $284 |
| USO buy-write call | 2026-11-20 | 1 | $168 call | $9.14 | $914 |
| PTF cash-secured put | 2026-11-20 | 1 | $103 put | $4.40 | $440 |
| BNO buy-write call | 2026-11-20 | 1 | $71 call | $4.08 | $408 |
| ETHA buy-write call | 2026-11-20 | 1 | $53 call | $2.65 | $265 |
| **Total** | | **10 contracts / 7 order structures** | | | **$4,071** |

**Observed premium result:** $4,071 gross option credits, **$71 above** the $4,000 target. This is **not** established net investment return, realized profit, or proof of the best possible decision. The model's earlier export-based optimum forecast was not equal to actual fills; e.g. EWY and USO filled at lower strikes than originally proposed. The operator placed the trades.

**Observed cash/margin snapshot:** $92,971.36 total reported Account value, $13,906.47 combined cash/margin credits, $10,300 cash reserved for PTF, and $3,606.47 available without margin impact. A positive margin credit rather than reported debit was observed, but later settlement, interest, or future borrowing cannot be inferred. Prior DRAM call assignment was visible in history; whether the 300 new DRAM calls are covered by a contemporaneously verified share inventory remains an **explicit operational verification obligation**, not resolved by the trade fills alone.

### Candidate comparison as evaluated during the session (not a universal optimum)

The refreshed candidate comparison (before actual execution) quoted roughly **$3,576** hold/write-and-deploy, **$3,749** hybrid, and **$3,456** wholesale liquidation/redeployment (with sell/buy-back permitted). These were contingent bid-based portfolio screens with near-zero cash cushions; subsequent fills yielded $4,071 in gross credits. Optimization assumptions included Actionable entries, execution scores, per-symbol/per-contract limits and gross capital estimates. Differences in opportunity filters, strike selection, actual execution and share sale costs mean this comparison is not proof of relative expected return, risk-adjusted superiority or a guaranteed $4,000 trade plan.

## Product findings and acceptance specimens for successor Talk

1. **Natural, evolving conversation:** The operator must not restate the target, 25-DTE cutoff, SPYI exclusion, existing holdings, Account, permitted strategies, and call-away objective after every refinement.
2. **Portfolio-level composition:** Answer one question across real brokerage positions, cash, free shares, encumbrances, quotes/chains/Greeks, volatility conditions, Account permission tiers, and governed capital scopes. Brokerage Account identity alone never establishes Operating Regime.
3. **Real-data acquisition:** Backend (WW BE/API v2) owns configured local Fidelity CSV discovery/import, filesystem access, credentialed provider ingestion, persistence, temporal source qualifications and authorization. **Neither the model agent nor MCP is granted filesystem access.** Talk accesses governed backend operations through MCP.
4. **Compare alternatives:** Hold & write, sell/redeploy, hybrid, wait/partial. Explain premium versus capital usage, potential call-away appreciation, turnover, downside/correlation and uncommitted buying power. Do not conflate premium with P/L or assignment proceeds.
5. **Executable claims:** A quoted option bid is not a confirmed fill or executable combined buy-write debit. Prefer current properly qualified evidence and brokerage order preview for collateral; record actual strikes, fills, fees and time stamps.
6. **Margin/account semantics:** Explicitly distinguish Fidelity available without margin impact, available buying power, margin-designated positions, actual debit and collateral reserve; honor authorized option tiers and account restrictions.
7. **Evidence integrity and UX:** Show concise backend-backed financial findings visibly separate from qualified analysis. Keep provenance inspectable rather than dumping raw JSON. Missing history, stale quotes, failed provider reads and unsupported “why” explanations cannot be filled by model confidence.
8. **Close the operational loop:** Ingest actual transaction history and post-trade balances, reconcile expected versus executed premiums, track covered shares and remaining obligations. Human-controlled trading remains the standing case-study method; **no trade execution authorization** follows.
9. **Negative specimens:** Incorrect 50/25/25 weighting inferred from ordering; inventing market rankings/volatility conditions; treating Gross premium as realized profit; counting price appreciation as premium; liquidation plus immediate repurchase; treating a margin account as an outstanding loan; claiming 300 DRAM covered shares without a fresh custody check; treating synthetic sandbox evidence as current; model disclosure of raw private CSVs.

## Explicit gaps and next engineering application

This case is a **question-driven benchmark** for the existing [Q01–Q63 inventory](operator-question-inventory-2026-10-22.md) and the PL-MCP-01 SDK Talk delivery plan. It demonstrates cross-question dependencies, not a warrant for one MCP tool or endpoint per sentence. An authorized actor should first inventory existing v1/BE/API v2 functions and retained data, then classify each gap as present capability, missing composition/exposure, missing actual evidence, blocked permission or unresolved Product meaning. Reuse/extend the backend and expose through MCP only where justified.

**Proposed replay sequence:** Recover a dated real retained Account state → assess volatility and WAIT → compare hold/sell/hybrid under user constraints → refresh quote evidence → formulate read-only candidate orders → reconcile user-executed transaction history and balances. First replay actual evidence **backend-side within existing authorization**. Real private Account payloads must not enter Codex/SDK model context until separately authorized under ADR-024. For replay and regression, use sanitized/authorized derived records or synthetic fixtures clearly labeled as such, without claiming they reproduce the original real-data exercise. No live orders, provider credential changes or new grants are authorized by this document.

**Why this is Product learning:** It establishes a real, operator-valued outcome and failure tests for architecture/API/MCP/UX work; it does **not** ratify specific option-selection math, strategy thresholds, weights, or the economic wisdom of the trades.

## Persistence/authority disposition

- This is a **single dated Category D historical evidence record**, not a parallel roadmap, standard, defect register or mandatory checklist.
- Current progress belongs to the [existing PL-MCP-01 delivery plan](../implementation/pl-mcp-01-sdk-talk-delivery-plan-2026-10-25.md); architectural authority remains ADR-024 and domain knowledge owners.
- Use this record to design/replay Product specimens, and distinguish Principal-observed outcomes from assistant-derived calculations and independently verified backend behavior.
