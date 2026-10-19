# SN1 Survey Summary — numbered docs 23–40

Classification: internal, redacted, non-normative survey evidence. Not authority.

## Scope and method
- Assignment: `docs/2[3-9]-*.md`, `docs/3*.md`, `docs/40-*.md` (23 files, 7,740 lines incl. both 33s/34s/38s/39s, three 40s). Assigned SHA bef03dd; working tree was d03d8d1, and `git diff bef03dd d03d8d1` shows no change to these files.
- Resume run: kept the earlier 62 entries (E001–E062) unchanged and added E063–E164. Six docs had no entries before: 23, 24, 35, 39-credit-spreads, 40-demand, 40-MVPTA.
- Depth: every assigned file was read in full during this run (281/281 segments FULL). For long inventories (32 per-item dispositions, 31 D-01..D-16, 39c measurement field lists) I captured cross-cutting content, not one item per row. The notes column in coverage.tsv says where.
- Read-only. Spot cross-checks (grep only): `RequestPacer.java`, `roadmap-priority.md:29`, `foundations/system-goal-hierarchy.md:285`, the parking-lot sequence (for PL IDs), and whether `foundations/failure-state-vocabulary.md` exists.

## Top 10 findings
1. Constraint lineage, current position: Herbie has not been identified. Doc 38 (Aug 28) named "effective evidence-surface renewal capacity" as candidate Herbie. Doc 39 (Aug 28) downgraded that to a symptom (39c:24-41). Doc 40 (Aug 31) says "Herbie remains unidentified." (40p:248). At HEAD, roadmap-priority.md:29 calls it "an evidence checkpoint awaiting a decision" (E055, E118, E163).
2. Doc 40 falsified the "96/min" envelope. The old pacer added a fixed 625 ms post-completion sleep to the provider call: 109 ms call + 631 ms wait + 65 ms residual ≈ 74.5/min. Separately, a scheduler-cycle handoff costs about 1.2 s per cycle (E156, E157).
3. The 119-per-trailing-60s, single-flight controller ran for one hour after hours at 119.72/min: 7,200/7,200 HTTP 200, zero 429s, no state interference. At HEAD, RequestPacer.java:12-13 implements it. I did not verify a regular-session A/B evaluation, and Doc 40 says provider utilization ≠ system improvement (E159, E164, E163).
4. Pacer and provider figures conflict over time: sandbox 60/min and 0.9 req/s (30:350-351, 36:30, still in steering); Production ~1.6 req/s, ~96/min (39c:100); a 120/min allowance with a 119 ceiling (40p). All of these need time-qualification (E077).
5. Temporal contract (35–37): the Aug 27 7–45 DTE board collapsed silently. Cause: a 30-min browser chain TTL against a multi-hour revisit cadence. Proposed invariant: "maintain or report degraded" (not ratified). Leading direction: appliance-owned validity, Model A with C-style internals; still a 3AM decision. The browser TTL is still present at HEAD (E097–E107, E042).
6. Finding #2: spot_history writes one row per setChain, so 6–11 identical rows per weekly-symbol burst. Doc 40-MVPTA generalizes this: "One economic observation should become one durable observation…" (E111, E151).
7. Credit spreads (Aug 29): the premise that verticals require prediction was found too strong, so they are reopened for four-lens evaluation, not admitted. New primitives: a strategy-aware consequence envelope; fitness profiles that "rank survivors" only; four cash-entry shapes, including BW + call credit spread (no finite max profit) (E130–E136).
8. Behavioral discipline (Aug 29): "Mechanics over Impulse" and accountable human-in-the-loop (PL-DEC-BEH, which is in the parking lot). This sits alongside Doc 33-long's earlier operator-agency boundary: never diagnose psychology, moralize, prescribe SELL/HOLD, or block (E087, E137, E138).
9. MVPTA (Aug 29) is a research-first, point-in-time evidence experiment, not policy. Daily OHLCV is its only new primitive. It keeps strategy-neutral evidence, avoids score creep, keeps SQLite, and must not take freshness from current evidence (E147–E155).
10. Situation/mission/console: Situation 0 plus Bridge Income, "build one, then extract", and Situation reframed as cross-cutting Application Shell context. The Console capacity denominator is totalAccountValue ("eligible AUM" is future). The Portfolio Trajectory headline and series must share one accounting definition (E069–E073, E080, E010).

## Principal statements (exact, as recorded; most are document paraphrase)
- 40p:23 — "The operator clarified that the desired utilization target is approximately **99% of Tradier's documented 120/minute capacity**, not 99 requests/minute." (paraphrase in document voice)
- 38h:26 (operator ruling) — "Do not optimize a non-constraint merely because it is easy to measure, and do not remove high-value work merely because it is expensive at the constraint."
- 28:24 — "I've got [amount-redacted] cycling next week. How can the forecast still just be [amount-redacted]?"; 28:194 — "I don't see myself leaving substantial cash idle for an entire month."
- 27:65 — "**Principal-selected conservative starting parameters for the first operating experiment.**"
- 28:104/110 — two approaches marked "rejected per Principal" (average batch primitive; arbitrary participation fraction).
- 33s:112 — "The Principal explicitly blessed the normalized tree…" (paraphrase).
- Unattributed but load-bearing (39s:477, 483): "We want human-in-the-loop, not idiot-in-the-loop…" and "It is the human's money and the human's accountability."

## Decision candidates not in the ADR-001–023 register (see decisions.jsonl, 28)
- TOC as optimization discipline (D001); Herbie not identified + forbidden-work gate + actor split (D002–D004).
- 99%-of-120 target; 119/60 single-flight controller; headers as evidence, not control (D005–D007).
- Temporal-contract leading direction; chainStaleMs bump rejected; maintain-or-report-degraded invariant (D008–D010) — all proposal-only.
- Credit-spread reopening; PL-DEC-BEH/Mechanics over Impulse; demand hypothesis parked; MVPTA research-first (D011–D014).
- Situation/Bridge Income; Resolution Outlook V1 parameters; Forecast V2 rejections; Render deployment; Lab retirement; LVT blessing; good-enough/differentiation; opening-experiment constraints; treasury-above-Wheelwright; protected monitored-position obligation (D015–D028).

## Contradictions and supersessions
- Doc 38 candidate Herbie → superseded by 39c:24-41 (E118). Doc 39's 96/min framing → falsified by 40p:20 (E157). Doc 40-MVPTA:150 repeats the stale 74.7-vs-96 framing.
- "Herbie" is used for two things: a treasury-level constraint (33l:414-420, 33l:74) and the Wheelwright system constraint (38–40) (E088).
- Doc 23:50 says calls use a primary-expiration gate; Doc 35 (Aug 27) shows multi-expiration acquisition is live (E065).
- Ratification status is unclear: Doc 32:5 calls Doc 31 "ratified", but Doc 31 calls itself analysis. Doc 32:571 says the Lab direction "is ratified", but Doc 32:8 says "awaiting ratification" (E027, D019).
- Doc 34-opening's header says "pending Principal authorization", but data/seeds/opening-set.txt exists (E002, E096).
- Doc 39c:563-588 forbids changing the pacing interval unless the operator overrides, yet the pacer changed. The assigned docs do not record the override (D003).
- Doc 26 treats "Health" as a Console concept, but ADR-013 / Doc 30:137 reject "health" as architectural (E013).
- Velvet Rope: retired as the governance home (32:515), but the steering still names it as a surface (E085).

## Coverage gaps / not verified
- I did not locate the Aug 27 universe-governance ruling or the Aug 28 observer bundle. The bundle's path is outside the repo and was withheld (E123).
- I did not verify whether regular-session acquisition routes through the new controller, whether the live A/B ran, or whether ADRs adopted the temporal contract (out of scope).
- Proposed `failure-state-vocabulary.md`, PL-BEHAV-01 and PL-CONC-01 do not exist at HEAD (E089).
- Real amounts were redacted (Bridge Income target, forecast and portfolio dollar figures).

## Challenges to assumptions
- The steering architecture summary (sandbox, 0.9 req/s) is stale relative to the 40p findings and code.
- "Accepted direction" in Docs 24, 25 and 39s never names who accepted, so authority class is uncertain.
- Who ratified what in Docs 31/32 is ambiguous; downstream actors should not treat Doc 31's findings as ratified without a record.
