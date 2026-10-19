# SRC2 survey summary — docs/research (excluding practitioner-corpus)

Classification: internal, redacted, non-normative survey evidence. Not authority. Baseline main bef03dd.

## Scope and depth
- 52 `.md` files (~10,510 lines) under `docs/research/` outside `practitioner-corpus/`, plus 3 `.html` files SKIPPED by assignment (their `.md` analyses were read).
- FULL: all conclusions/analyses/memos, academic register, research-program design/control/state transitions, reorientation memo/analysis/reconciliation, primary-evidence upgrade, Q0 analysis + lead inspection, comparative landscape + analysis, Muse liquidity synthesis, Fidelity continuity, SPY backtest, covered-call memo, growth taxonomies, income-wheel notes, partial-collar-test1 (5 files), EVA-001 core files, session artifacts.
- PARTIAL/INDEXED (long external reproductions): Q0 friction report §§5–21 (lines 120–353, 524–558) unread; Cashflow KB lines 1–96 only; Muse ETF reports ~20% read, cohort-84 per-symbol table INDEXED; three EVA muse-raw `.md` files executive summaries only.
- Counts: 598 coverage rows (490 FULL, 11 PARTIAL, 94 INDEXED, 3 SKIPPED); 89 entries; 16 decisions.

## Top findings
1. Operating Program is the governed unit: "Wheel" is a family label; "by the book" = selected, versioned Program at the decision boundary; Operating Program must stay strategy-family-neutral (wheel-family:14,20,250; sosnoff:43). E001/E002/E008.
2. Recurring separations: Program fidelity vs validity vs execution vs outcome; "Program says X" vs "X is optimal"; exposure vs instrument; symbol vs product vs options-market continuity. E003/E009/E014/E061.
3. Lifecycle Mechanics: roll = close + new obligation; roll credit ≠ profit; same-expiry roll-up is a debit by no-arbitrage; delta is a re-underwriting prompt, not assignment probability (practitioner KB contradicts); buy-write assignment replacement must not be double-counted. E005/E020/E021/E031/E089.
4. Ruin model narrowed (Principal-accepted, next-wave:31-47): economic vs liquidity/collateral vs broker-enforced ruin; path survivability ≠ terminal payoff. E048.
5. Program-design premises falsified: pooled 0–5% canon baseline; mis-signed "single-name short book is long correlation"; SEBI "goldmine"; 45/50/21 never tested as one specification. E039/E040/E041.
6. Execution friction is a matrix, not a scalar; 30–60 DTE retail SPX cell empty; Principal parked Q0 as a local dependency; Principal's reprice-or-cancel workflow recorded (market drift ≠ slippage). E044/E045, D001.
7. Broker evidence cannot prove option-obligation continuity: STO-hold and STO-BTC-STO on one series are indistinguishable; series geometry ≠ occurrence identity. E035/E036.
8. No positive strategy result: delta-band calls NOT DEMONSTRATED; SPY overlays all trailed stock; Partial Collar Test 1 FAIL (Principal-accepted); XSP spreads adverse, unverified (one forced loss ≈3.4 winners). NO CALL / WAIT / cash kept first-class.
9. Portfolio vs position risk: "Strategy diversity is not risk-factor diversity"; remaining buying power is the wrong objective (start from NAV-at-risk budget); a time-forced close can exceed spread width. E080/E084.
10. Research governance: operator-decision test; falsifier first; nulls count; no rescue tuning; sanitized external actors (WW-labelled work = reconciliation evidence); build/adopt (own economics/validation, adopt commodity infrastructure). E037/E038/E051/E064/E069.

## Principal statements (exact, or as recorded)
- Q0 Option A (2026-09-27, option text selected): "Record Q0 as locally inconclusive/public-evidence-limited, park direct data collection, and continue the broader research program." (rabbit-hole-parked:12)
- "that's why i wanted you to scan the transcript.  tom talks about his favorites and what to expect.  the guy's a walking talking research project." (conversation-record:205; variants :215, :241, :289)
- "bootstrap from github and persist this entire conversation, including the provided artifacts" (conversation-record:360)
- Actor-recorded: "Principal accepts FAIL for the tested tactical state-machine candidate…" (partial-collar PRINCIPAL-REVIEW:5); preliminary interpretation at :15, explicitly unsettled.
- EVA objectives as recorded: "Avoid being “Nostradamus”: calibrated statistical forecasts and probabilities are welcome; unsupported “feeling bullish today” predictions are not." (CONVERSATION-RECOVERY:9); also "entry selection first" (:24), tastytrade backtester "poor" (:63).
- October target "remains [amount-redacted]"; Codex "aggressive" = "a forecast/feasibility assessment, not a target change" (income-wheel:6).
- Attributed: brokerage friction "has not been a major practical problem" (reorientation-memo:29); XSP selector "deliberately not delta-selected" (conversation-record:57).

## Decision candidates not in ADR-001–023
- D001 Q0 parked (Principal-directed). D002 reorientation accepted; Muse R1–R5 rejected unchanged; reconciled wave adopted.
- D003/D004 Q1→Q0 redirect and control pipeline (research-process authority; approver unrecorded).
- D005/D006 Partial Collar Test 1 authorized, then FAIL accepted. D007 compensation-vs-mispricing parked.
- D008/D009 EVA-001 audit/protocol only; entry selection first.
- D010–D012 XSP premium selector; no post-result optimization; broker GTC vs Wheelwright time-exit split.
- D013 sanitation boundary. D014 taxonomy Non-decision. D015 universe 2×2 crosswalk. D016 October Income Wheel parameters (DANGER exclusion, DTE ≤ 18).

## Contradictions and tensions
- EVA "Forecasting is acceptable" (CONVERSATION-RECOVERY:26) vs Policy over Prediction's inadmissibility of predicting resolution; not reconciled (E066).
- Credit spreads historically out of scope as "require prediction", later challenged (conversation-record:265; E081).
- 2026-09-29 GTD semantics (GTD cancels, cannot close) vs later "Pxx + GTD = Manual xDTE Exit" (S2-040).
- Option-letter mismatch: Principal's "Option A" text matches the post-lead doc's path C (formal ceiling + park).
- Muse overclaims corrected by Codex: Goyal–Saretto "all negative" wrong (16 kept significant net returns); Q→P sign reversed; "no peer-reviewed condor literature" refuted (Niblock 2017); "LEAN verified winner" not accepted.
- Comparative landscape keeps correlation-diversification wording later narrowed by the upgrade (F-04).
- Academic register cites an unsourced "currently observed" buy-write production advantage over CSP (E018).

## Coverage gaps
- 3 `.html` reports skipped; Q0 report §§5–21 (fees, transfer audits) unread; Cashflow KB Part A §6–17 and Part B unread; Muse ETF tier tables and cohort-84 per-symbol rows unread; muse-raw bodies beyond executive summaries unread.
- Not verified here: whether reconciled wave R1 was ever authorized; Doc 65 text (cited only).

## Assumption challenges
- Policy over Prediction may be narrower than its foundation wording: the Principal admits calibrated physical-P forecasts. Q0, EVA and XSP all treat execution and timing as load-bearing evidence gaps.
- Every strategy experiment surveyed came back null or adverse, supporting first-class NO CALL / WAIT / cash outcomes.
- Broker evidence limits (no obligation identity) challenge any design assuming cross-observation Position continuity from Fidelity data.
