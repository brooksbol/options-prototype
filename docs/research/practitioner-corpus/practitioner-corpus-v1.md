# Practitioner Corpus v1 — Cashflow Academy

**Status:** COMPLETE — RESEARCH CORPUS v1  
**Built under:** `docs/research/practitioner-corpus/practitioner-corpus-v1-charter.md` v1.0  
**Source baseline:** `3ab9f0ac16d1d432ebd5ff0578c62cf5df1b3fa8`  
**Admitted evidence:** Cashflow Academy studies 1–12 and 25–36 (24 transcript-derived studies)  
**Not admitted:** studies 13–24 (`PRESERVED_INSUFFICIENT_FIDELITY`)  
**Governing principle:** **Wheelwright-blind, domain-informed, provenance-bound.**  
**Authority:** Research evidence and synthesis only. No authority over Wheelwright domain semantics, policy, architecture, product behavior, or implementation.

> This corpus describes practitioner reality represented by the admitted evidence. It does not define Wheelwright reality and does not establish practitioner claims as universal options truth.

---

# Part I — Executive Synthesis

## 1. Executive Narrative

The admitted corpus presents options practice not primarily as a catalog of named strategies, but as a repeated **decision process under interacting uncertainty**. The practitioner observes market and instrument state; forms some expectation about direction, magnitude, volatility, time, or ownership; chooses a construction whose economics fit that expectation; sizes the exposure; defines what being wrong means; then manages the position as time, price, volatility, assignment state, and opportunity cost evolve.

The most persistent practitioner distinction is between **buying optionality and selling obligation**. Buying is repeatedly framed as limited-loss but exposed to time decay and the need for sufficient movement; selling is framed as higher-probability cash flow with unattractive structural risk/reward that requires active risk management. This is a recurrent practitioner belief and pedagogy, not externally verified truth.

A second strong pattern is that **construction alone is not the decision**. The same named structure is treated differently depending on direction, volatility, time, underlying quality, assignment desirability, capital, and lifecycle state. Covered calls are sometimes income, sometimes opportunity-cost traps, and sometimes positions requiring defense. Cash-secured puts are simultaneously premium sales and contingent acquisition mechanisms. Long options may be leverage, protection, or event speculation. Calendars, PMCCs, and Wheel examples make the temporal/lifecycle dimension impossible to reduce to a single expiration payoff.

A third pattern is that **risk is plural** in practice. The presenters distinguish structural maximum loss, probability of loss, planned exit loss, position size, assignment exposure, opportunity cost, volatility exposure, gap/event exposure, and psychological ability to manage the trade. They repeatedly insist that maximum possible loss is not necessarily the loss a trader plans to accept.

A fourth pattern is that practitioners repeatedly need to reason about **counterfactual outcomes**. They ask what happens if price rises, falls, stays flat, moves violently, volatility expands or contracts, time passes, assignment occurs, an option expires, or an existing thesis breaks. Payoff graphs are one recurring tool for this reasoning, but calendar, PMCC, exercise, after-hours expiration, and Wheel specimens show that terminal payoff alone is not enough.

The corpus also reveals meaningful internal tension. Short-dated theta is taught as a seller advantage, while 0DTE selling is described as an edge that crowding can destroy. High probability is repeatedly attractive, while the presenters explicitly warn that high-probability structures can have poor payoff ratios. Covered calls are promoted as putting stock “to work,” while another admitted source calls opportunity cost their number-one problem. Selling premium is framed as a recurring edge, yet the evidence also emphasizes volatility regime, trend, pricing, and active loss control. These tensions are retained rather than reconciled.

The practitioner worldview that emerges is therefore **conditional rather than strategy-centric**: context, construction, economics, risk, management, and lifecycle interact. The practitioner is repeatedly performing jobs of qualification, comparison, projection, sizing, monitoring, and response.

---

## 2. Practitioner Mental Model

The admitted evidence supports the following cross-evidence model of practitioner reasoning:

```text
Observe context
  ↓
Form an expectation or identify an acceptable ownership/protection condition
  ↓
Decide whether optionality should be bought, sold, combined, or avoided
  ↓
Choose construction, strike, expiry, and quantity
  ↓
Evaluate premium, probability, payoff, Greeks, capital, and assignment/exercise consequences
  ↓
Define "wrong" and management conditions
  ↓
Enter
  ↓
Monitor price + volatility + time + lifecycle state
  ↓
Hold / close / hedge / roll / accept assignment / exercise / expire
  ↓
Reassess the resulting position or inventory state
```

This is `CROSS_OBSERVATION_DERIVED`. It is not claimed as a formal process stated verbatim by any one presenter.

---

## 3. Practitioner Decision Framework

Five recurring questions organize much of the admitted practice:

1. **What do I believe can happen?** Direction, magnitude, volatility, time, trend, event, or acceptable acquisition/disposition.
2. **What construction expresses that belief or purpose?** Long option, short option, spread, hedge, income overlay, cross-expiry structure, or no trade.
3. **What are the economics?** Debit/credit, break-even, probability, max loss/profit, capital, opportunity cost, Greeks, and commissions.
4. **What makes the position unacceptable?** Thesis break, loss tolerance, volatility change, assignment consequence, expiration state, or opportunity cost.
5. **What do I do next?** Hold, close, hedge, roll, exercise, accept assignment, let expire, or transition to another state.

The evidence repeatedly treats “do nothing” as a legitimate decision when qualification is poor.

---

## 4. Major Patterns

### PAT-001 — Multi-dimensional qualification
- **Type:** `PRACTICE_RECURRENCE`
- **Status:** `CROSS_OBSERVATION_DERIVED`
- **Statement:** Practitioners repeatedly combine multiple dimensions—especially direction, volatility, time, probability, liquidity/quality, and risk—before qualifying a trade.
- **Support:** OBS-001, OBS-004, OBS-009, OBS-015, OBS-021, OBS-025, OBS-039.
- **Sources:** SRC-001, 002, 003, 005, 009, 010, 031.
- **Counterevidence:** None establishing a single universal qualification formula.
- **Truth status:** `NOT_ESTABLISHED_BY_CORPUS`.

### PAT-002 — Structural maximum loss and planned loss are distinct
- **Type:** `PRACTICE_RECURRENCE`
- **Statement:** Defined structural loss is repeatedly treated as a boundary, while management plans target earlier/smaller losses.
- **Support:** OBS-002, OBS-006, OBS-011, OBS-017.
- **Sources:** SRC-001, 002, 006, 009.
- **Truth status:** `NOT_ESTABLISHED_BY_CORPUS`.

### PAT-003 — High probability trades create payoff-management pressure
- **Type:** `BELIEF_RECURRENCE`
- **Statement:** Selling/credit structures are repeatedly described as higher-probability but poorer risk/reward, making management central.
- **Support:** OBS-003, OBS-010, OBS-016, OBS-028.
- **Sources:** SRC-001, 003, 006, 012.
- **Truth status:** `NOT_ESTABLISHED_BY_CORPUS`.

### PAT-004 — Volatility is both a pricing input and a trade-selection input
- **Type:** `PRACTICE_RECURRENCE`
- **Statement:** IV/vega is repeatedly used not merely to explain price but to decide whether buying or selling premium is attractive.
- **Support:** OBS-004, OBS-012, OBS-018, OBS-022, OBS-038, OBS-039.
- **Sources:** SRC-001, 005, 007, 009, 028, 031.
- **Truth status:** `NOT_ESTABLISHED_BY_CORPUS`.

### PAT-005 — Time is treated asymmetrically for buyers and sellers
- **Type:** `BELIEF_RECURRENCE`
- **Statement:** The presenters repeatedly recommend more time for buyers and shorter-duration exposure for sellers to exploit theta.
- **Support:** OBS-018, OBS-021, OBS-035, OBS-044.
- **Sources:** SRC-007, 009, 026, 033.
- **Exceptions:** EXC-004 (0DTE crowding/edge erosion).
- **Truth status:** `NOT_ESTABLISHED_BY_CORPUS`.

### PAT-006 — Assignment can be an intended transition, not merely a failure
- **Type:** `PRACTICE_RECURRENCE`
- **Statement:** In Wheel/CSP examples, assignment is acceptable or desired when it acquires stock at a pre-accepted price and leads to a subsequent covered-call state.
- **Support:** OBS-023, OBS-024, OBS-045.
- **Sources:** SRC-008, 010, 033.
- **Truth status:** `NOT_ESTABLISHED_BY_CORPUS`.

### PAT-007 — Lifecycle state changes the next decision
- **Type:** `RELATIONSHIP_RECURRENCE`
- **Statement:** Assignment, expiration, exercise opportunity, partial resolution, or call-away changes the practitioner’s available next actions.
- **Support:** OBS-024, OBS-026, OBS-034, OBS-041, OBS-042, OBS-046.
- **Sources:** SRC-008, 010, 025, 028, 029, 036.
- **Truth status:** `NOT_ESTABLISHED_BY_CORPUS`.

### PAT-008 — Payoff topology is necessary but not sufficient
- **Type:** `RELATIONSHIP_RECURRENCE`
- **Statement:** Risk graphs and break-even/max-loss mechanics recur, but cross-expiry, volatility-sensitive, and lifecycle examples require reasoning beyond terminal payoff.
- **Support:** OBS-019, OBS-026, OBS-034, OBS-038, OBS-041.
- **Sources:** SRC-008, 012, 025, 028, 031.
- **Truth status:** `NOT_ESTABLISHED_BY_CORPUS`.

### PAT-009 — Position sizing is a first-line risk decision
- **Type:** `PRACTICE_RECURRENCE`
- **Statement:** Practitioners repeatedly size exposure by affordable loss, capital, or an explicit cash-flow goal rather than reward alone.
- **Support:** OBS-005, OBS-017, OBS-028, OBS-047.
- **Sources:** SRC-002, 009, 012, 034.
- **Truth status:** `NOT_ESTABLISHED_BY_CORPUS`.

### PAT-010 — Opportunity cost is treated as real economic consequence
- **Type:** `PRACTICE_RECURRENCE`
- **Statement:** Covered-call examples explicitly compare collected premium with forgone upside and treat that difference as a decision-relevant cost.
- **Support:** OBS-007, OBS-025.
- **Sources:** SRC-004, 011.
- **Counterevidence:** Source 011 strongly promotes covered calls as yield; retained as CON-002.
- **Truth status:** `NOT_ESTABLISHED_BY_CORPUS`.

### PAT-011 — Practitioner rules are conditional and exception-bearing
- **Type:** `RELATIONSHIP_RECURRENCE`
- **Statement:** Rules about selling time, exercising, covered calls, volatility, and trade entry repeatedly acquire conditions or exceptions.
- **Support:** OBS-008, OBS-013, OBS-036, OBS-040, OBS-043.
- **Sources:** SRC-004, 005, 026, 028, 036.
- **Truth status:** `NOT_ESTABLISHED_BY_CORPUS`.

### PAT-012 — Process discipline is treated as part of trading competence
- **Type:** `BELIEF_RECURRENCE`
- **Statement:** Education, paper trading, planning, risk management, patience, journaling, and review are repeatedly presented as prerequisites to durable performance.
- **Support:** OBS-005, OBS-014, OBS-037, OBS-047.
- **Sources:** SRC-002, 006, 027, 034.
- **Truth status:** `NOT_ESTABLISHED_BY_CORPUS`.

---

## 5. Major Insights

### INS-001 — “Strategy” is not one practitioner decision
The corpus repeatedly uses named strategies as compressed bundles of construction, outlook, economics, management, and lifecycle expectations. Selection still requires separate judgments about context and consequences.  
**Evidence:** PAT-001, PAT-007, PAT-008; SPC-004, SPC-006.

### INS-002 — Risk is a family of practitioner questions
“Risk” appears as structural max loss, probability, affordable loss, position size, assignment exposure, opportunity cost, volatility/gamma exposure, gap risk, and management threshold. Treating these as one number would lose practitioner meaning.  
**Evidence:** PAT-002, PAT-003, PAT-009, PAT-010; FAIL-001–006.

### INS-003 — Lifecycle and inventory intent can dominate payoff equivalence
The corpus calls CSP and covered call synthetically identical in risk-graph terms, yet uses one to acquire stock and the other to generate yield/dispose of stock. Similar payoff does not erase different practitioner jobs.  
**Evidence:** OBS-023–026; REL-006; SPC-004.

### INS-004 — The practitioner repeatedly reasons in counterfactual branches
Worked examples ask what happens across price paths, volatility changes, passage of time, assignment, exercise, and expiration. This is broader than “show max profit/max loss.”  
**Evidence:** SPC-001–012; PAT-008.

### INS-005 — Mechanical advantage and exploitable edge are not the same claim
Theta acceleration is repeatedly taught as a seller-friendly mechanical property, while the 0DTE source says crowding reduced premiums enough to erode a previously exploitable selling system.  
**Evidence:** CON-001; EXC-004.

### INS-006 — Practitioner purpose can change while construction vocabulary remains familiar
A long call can be leverage/speculation, stock replacement, or a hedge component; a put can be speculation, protection, or contingent acquisition when sold. Construction name alone does not reliably reveal practitioner purpose.  
**Evidence:** OBS-019, OBS-032, OBS-048, OBS-049.

---

## 6. Practitioner Decision Jobs

### JOB-001 — Qualify whether a trade should exist
- **Status:** `EXTRACTED`
- **Support:** OBS-001, 004, 009, 015, 021.
- **Trigger:** A candidate underlying/setup exists.
- **Information:** direction, volatility, time, probability, liquidity/quality, catalyst/confluence.
- **Outcome:** trade / different construction / no trade.

### JOB-002 — Choose whether to buy or sell optionality
- **Status:** `EXTRACTED`
- **Support:** OBS-003, 012, 018, 021, 038.
- **Criteria:** expected magnitude, IV, theta, probability/payoff, event state.

### JOB-003 — Select construction for the expected path
- **Status:** `EXTRACTED`
- **Support:** OBS-019, 020, 032.
- **Information:** directional magnitude, volatility, time, desired protection/income.

### JOB-004 — Determine how wrong the trader can afford to be
- **Status:** `SOURCE_EXPLICIT` / extracted register form.
- **Support:** OBS-005, 017, 047.
- **Outcome:** quantity/capital boundary.

### JOB-005 — Define what invalidates the trade before entry
- **Status:** `EXTRACTED`
- **Support:** OBS-002, 006, 016.
- **Outcome:** exit/hedge threshold rather than passive max-loss acceptance.

### JOB-006 — Decide whether assignment is acceptable or desirable
- **Status:** `EXTRACTED`
- **Support:** OBS-023, 024, 045.
- **Information:** underlying desirability, effective basis, capital, next-state plan.

### JOB-007 — Decide whether a covered call is worth the opportunity cost
- **Status:** `EXTRACTED`
- **Support:** OBS-007, 008, 025.
- **Information:** premium, strike, trend, upside foregone, defense alternatives.

### JOB-008 — Decide whether to exercise, sell, or hedge near expiration
- **Status:** `EXTRACTED`
- **Support:** OBS-041, 042, 043.
- **Information:** time value, after-hours price, dividend, settlement mechanics.

### JOB-009 — Decide whether volatility makes premium cheap or expensive enough
- **Status:** `EXTRACTED`
- **Support:** OBS-004, 012, 038, 039.
- **Information:** IV, HV, event state, vega, expected compression/expansion.

### JOB-010 — Manage a position whose state has changed
- **Status:** `EXTRACTED`
- **Support:** OBS-006, 008, 024, 034, 040.
- **Alternatives:** hold, close, hedge, roll, accept assignment, unwind legs.

### JOB-011 — Compare probability with payoff rather than using either alone
- **Status:** `EXTRACTED`
- **Support:** OBS-003, 010, 016, 028.
- **Outcome:** accept/reject/restructure.

### JOB-012 — Decide how much time to buy or sell
- **Status:** `EXTRACTED`
- **Support:** OBS-018, 021, 035, 044.
- **Information:** theta curve, strategy role, expiry, management horizon.

---

## 7. Practitioner Frictions

### FRI-001 — Multi-variable qualification burden
The practitioner must combine direction, volatility, time, probability, and risk rather than optimize one variable independently.  
**Status:** `CROSS_OBSERVATION_DERIVED`  
**Jobs:** JOB-001–003, JOB-009, JOB-011.

### FRI-002 — High-probability / poor-payoff tension
Structures that win frequently may expose the trader to losses larger than routine gains.  
**Status:** `EXTRACTED`  
**Jobs:** JOB-004, JOB-005, JOB-011.

### FRI-003 — Opportunity cost is invisible if only premium income is watched
Covered-call premium can look successful while upside is forfeited.  
**Status:** `EXTRACTED`  
**Jobs:** JOB-007.

### FRI-004 — Greeks change while the position is alive
Direction, gamma, theta, vega, and rho affect value differently across price/time/volatility.  
**Status:** `EXTRACTED`  
**Jobs:** JOB-001, JOB-009, JOB-010.

### FRI-005 — Expiration does not reduce to the closing print
After-hours moves and exercise instructions can change exercise/assignment consequences.  
**Status:** `SOURCE_EXPLICIT` / extracted register form.  
**Jobs:** JOB-008.

### FRI-006 — Cross-expiry structures resist simple terminal-payoff intuition
Calendar and PMCC examples retain a surviving long-dated leg while short legs expire or are replaced.  
**Status:** `EXTRACTED`  
**Jobs:** JOB-010, JOB-012.

### FRI-007 — Capital efficiency can invite overleverage
Margin or LEAPS reduce capital deployed but can tempt larger exposure.  
**Status:** `SOURCE_EXPLICIT` / extracted register form.  
**Support:** OBS-013, OBS-033.

### FRI-008 — Practitioner psychology can break a mathematically plausible system
FOMO, revenge, boredom, inability to hold asymmetric winners, and comfort with frequent small wins are explicitly discussed.  
**Status:** `EXTRACTED`  
**Support:** OBS-005, OBS-010, OBS-014.

---

## 8. Failure Modes

### FAIL-001 — Direction right, option trade wrong
Price moves in the expected direction but insufficient magnitude/time/volatility causes the option to lose.  
**Support:** OBS-019, OBS-021.

### FAIL-002 — IV crush overwhelms price thesis
A buyer focuses on price while event volatility collapses.  
**Support:** OBS-012, OBS-039.

### FAIL-003 — High-probability seller takes structural max loss
Many small credits can be overwhelmed by an unmanaged tail loss.  
**Support:** OBS-002, OBS-016.

### FAIL-004 — Covered call sacrifices a large upside move
Premium income is outweighed by forgone stock appreciation above strike + premium.  
**Support:** OBS-007, OBS-008.

### FAIL-005 — Position size makes an ordinary loss unacceptable
Trader sizes to reward rather than affordable loss/drawdown.  
**Support:** OBS-005, OBS-017, OBS-047.

### FAIL-006 — Assignment/exercise surprises the trader
Trader treats expiration/assignment as automatic/simple and misses after-hours or settlement consequences.  
**Support:** OBS-041, OBS-042.

### FAIL-007 — Capital efficiency becomes leverage concentration
Reduced capital requirement encourages doubling exposure.  
**Support:** OBS-013, OBS-033.

### FAIL-008 — Rule applied outside its market condition
Selling calls into a new uptrend, selling volatility when IV is cheap, or relying on 0DTE seller economics after crowding changes pricing.  
**Support:** OBS-008, OBS-004, OBS-040.

---

## 9. Contradictions and Tensions

### CON-001 — Theta seller advantage vs 0DTE edge erosion
- **A:** Short-dated theta is repeatedly taught as mechanically favorable to sellers. (OBS-018, OBS-035)
- **B:** 0DTE selling is described as having lost attractiveness because crowding compressed premium. (OBS-040)
- **Dimension:** mechanical decay versus exploitable market edge.
- **Resolution:** `UNRESOLVED`.

### CON-002 — Covered calls as routine yield vs opportunity-cost hazard
- **A:** Owning stock without selling calls is described as “leaving money on the table.” (OBS-025)
- **B:** Opportunity cost is called the number-one covered-call problem and selling into strength is discouraged. (OBS-007, OBS-008)
- **Resolution:** `UNRESOLVED`.

### CON-003 — Selling as statistical advantage vs explicit poor risk/reward
- **A:** Sellers are repeatedly framed as the “casino” with probability advantage. (OBS-010, OBS-016)
- **B:** High-probability trades are explicitly said to have lousy risk/reward and require management. (OBS-003, OBS-016)
- **Resolution:** `UNRESOLVED`.

### CON-004 — Exercise almost never vs expiration exercise opportunity
- **A:** Early exercise is discouraged because it destroys time value. (OBS-043)
- **B:** After-hours expiration moves can make exercise economically useful even after an OTM close. (OBS-041, OBS-042)
- **Resolution:** Context-dependent tension retained; no universal reconciliation asserted.

---

## 10. Exceptions and Boundary Conditions

### EXC-001 — Covered-call trend exception
Do not apply routine covered-call selling immediately after the source's 20/50 bullish crossover condition.  
**Applies to:** PAT-010 / covered-call yield practice.  
**Support:** OBS-008.

### EXC-002 — Early-exercise dividend exception
Near expiration, deep ITM, with little remaining time value, dividend capture may justify exercise.  
**Applies to:** general “do not exercise early” recommendation.  
**Support:** OBS-043.

### EXC-003 — Long-option “more time” rule has event/magnitude use cases
Pure long calls/puts are reserved in the corpus for expected violent/home-run moves rather than routine use.  
**Support:** OBS-020, OBS-021.

### EXC-004 — Short-dated seller rule does not guarantee edge
0DTE source argues crowding can compress premium enough to make selling unattractive despite rapid theta.  
**Support:** OBS-040.

### EXC-005 — Assignment is not universally adverse
In CSP/Wheel use, assignment can be an accepted acquisition transition.  
**Support:** OBS-023, OBS-024, OBS-045.

---

## 11. Red Flags

### RED-001 — “~80% of options expire worthless”
Repeated practitioner claim requiring independent empirical definition and verification.  
**State:** `VERIFY_LATER`.

### RED-002 — Delta as probability
Delta is repeatedly used as a ballpark probability of expiring with intrinsic value. Useful practitioner heuristic; exact interpretation requires theoretical qualification.  
**State:** `VERIFY_LATER`.

### RED-003 — Fixed DTE prescriptions
“Never buy 60-day/30-day/weekly” and “sell ≤60 DTE” are strong practitioner rules whose general validity is not established here.  
**State:** `VERIFY_LATER`.

### RED-004 — IV > HV seller rule
Repeated as a qualification rule; requires definition of measurement windows and empirical testing before external truth status.  
**State:** `VERIFY_LATER`.

### RED-005 — Return and probability claims
15.5% Wheel ROI, 69.6% LEAPS return, 86.42% spread win probability, 10% premium stories, and similar figures are source claims/examples, not corpus-validated performance.  
**State:** `VERIFY_LATER`.

### RED-006 — “Volatility is mean reverting”
Repeated theoretical/empirical practitioner claim requiring qualification by instrument, horizon, and measure.  
**State:** `VERIFY_LATER`.

---

## 12. Takeaways

### TAK-001
Practitioner work represented here is better described as **qualification → construction → economics → management → lifecycle** than as strategy-name selection alone.

### TAK-002
Practitioners repeatedly need consequence reasoning across price, volatility, time, assignment, exercise, and residual-position states.

### TAK-003
Risk cannot be faithfully represented by max loss or probability alone in this corpus.

### TAK-004
Assignment desirability depends on the practitioner’s ownership intent and next-state plan.

### TAK-005
Rules of thumb are common, but exceptions and market-condition dependencies are also common.

### TAK-006
Process discipline—planning, sizing, risk management, patience, and review—is treated as part of trading competence rather than administrative overhead.

All Takeaways are `CROSS_OBSERVATION_DERIVED` and bounded to this corpus.

---

## 13. Open Questions

- Q-001 — How broadly representative are these practices beyond this channel?
- Q-002 — Which repeated heuristics survive independent empirical verification?
- Q-003 — How do practitioners aggregate Greeks and risk across an entire portfolio? `NOT_OBSERVED_IN_CORPUS`.
- Q-004 — How are taxes incorporated into trade/lifecycle decisions? `NOT_OBSERVED_IN_CORPUS`.
- Q-005 — How are early-assignment probabilities managed around dividends for short options? Only partial evidence exists.
- Q-006 — How do transaction costs/slippage alter the claimed edges across strategy families? Only limited evidence exists.
- Q-007 — Which management rules are precommitted versus improvised after entry?
- Q-008 — How often do the presenters’ stated rules differ from their actual live-trade behavior? The distilled artifact permits some comparison but not a full behavioral audit.

---

## 14. Verification Backlog

Priority external verification candidates:

1. option-expiry-worthless percentage claims;
2. delta-as-probability approximation and limits;
3. theta decay percentages by DTE;
4. IV/HV selling heuristic;
5. volatility mean-reversion claims;
6. fixed buyer/seller DTE prescriptions;
7. quoted win probabilities and expected-value examples;
8. performance/ROI claims;
9. 20/50 moving-average covered-call filter;
10. 0DTE seller-edge erosion claim;
11. “former leading industry groups regain leadership only 12%” claim;
12. assignment/exercise timing and broker cutoff mechanics.

No verification was performed during corpus construction.

---

# Part II — Evidence Model

## 15. Source Ledger

| ID | Study | Admission | Primary subject |
|---|---:|---|---|
| SRC-001 | 1 | ADMITTED | Direction/volatility/time; credit spreads |
| SRC-002 | 2 | ADMITTED | Process, sizing, psychology, butterfly |
| SRC-003 | 3 | ADMITTED | Probability, expectancy, vertical/back-ratio |
| SRC-004 | 4 | ADMITTED | Covered-call failure modes and defense |
| SRC-005 | 5 | ADMITTED | LEAPS selling, vega, leverage |
| SRC-006 | 6 | ADMITTED | Option selling, management, psychology |
| SRC-007 | 7 | ADMITTED | Greeks |
| SRC-008 | 8 | ADMITTED | 11 strategy constructions / five-direction pedagogy |
| SRC-009 | 9 | ADMITTED | Broad options risk advice |
| SRC-010 | 10 | ADMITTED | Wheel process |
| SRC-011 | 11 | ADMITTED | Covered-call income |
| SRC-012 | 12 | ADMITTED | Bull-put spread / sizing |
| SRC-025 | 25 | ADMITTED | PMCC / cross-expiry income |
| SRC-026 | 26 | ADMITTED | Theta / cash-flow zone |
| SRC-027 | 27 | ADMITTED | Learning process / risk / journaling |
| SRC-028 | 28 | ADMITTED | 0DTE / edge erosion |
| SRC-029 | 29 | ADMITTED | Expiration / after-hours exercise |
| SRC-030 | 30 | ADMITTED | Delta / probability heuristic |
| SRC-031 | 31 | ADMITTED | IV crush |
| SRC-032 | 32 | ADMITTED | Calls / leverage / optionality |
| SRC-033 | 33 | ADMITTED | Beginner mechanics / CSP |
| SRC-034 | 34 | ADMITTED | Capital / sizing / drawdown |
| SRC-035 | 35 | ADMITTED | Protective puts |
| SRC-036 | 36 | ADMITTED | Exercise vs sale / dividend exception |

Studies 13–24 are retained only in the external artifact and have admission state `PRESERVED_INSUFFICIENT_FIDELITY`.

---

## 16. Observation Register

The observations below are faithful extractions from the admitted per-video transcript-derived studies preserved in the source artifact. They are not direct raw-transcript quotations unless quotation marks are shown.

| ID | Source | Act | Status | Faithful observation | Verification |
|---|---|---|---|---|---|
| OBS-001 | SRC-001 | RECOMMENDATION | SOURCE_EXPLICIT | Combine direction, volatility and time when selecting credit spreads. | UNVERIFIED_PRACTITIONER_CLAIM |
| OBS-002 | SRC-001 | RECOMMENDATION | SOURCE_EXPLICIT | Do not passively accept max loss; improve the worst case through exit/hedge/size management. | UNVERIFIED_PRACTITIONER_CLAIM |
| OBS-003 | SRC-001 | CLAIM | SOURCE_EXPLICIT | High probability trades can have poor risk/reward; probability alone is insufficient. | VERIFY_LATER |
| OBS-004 | SRC-001 | DECISION | EXTRACTED | Source skips premium selling when IV is below HV and prefers IV above HV. | VERIFY_LATER |
| OBS-005 | SRC-002 | RECOMMENDATION | SOURCE_EXPLICIT | Position size is the first line of defense; ask “how wrong can I afford to be?” | UNVERIFIED_PRACTITIONER_CLAIM |
| OBS-006 | SRC-002 | DECISION | SOURCE_EXPLICIT | Butterfly example risks $125, targets ~$600, and exits if loss exceeds 50% of debit. | NOT_REQUIRED |
| OBS-007 | SRC-004 | CALCULATION | SOURCE_EXPLICIT | Covered-call opportunity-cost break-even is illustrated as strike + premium; upside beyond it is forgone. | VERIFY_LATER |
| OBS-008 | SRC-004 | RECOMMENDATION | SOURCE_EXPLICIT | Avoid covered-call selling immediately after the specified bullish 20/50 crossover; defend a threatened call with a longer-dated call. | UNVERIFIED_PRACTITIONER_CLAIM |
| OBS-009 | SRC-002 | RECOMMENDATION | SOURCE_EXPLICIT | Trade only when context, charts, catalyst, confluence and confirmation qualify the pitch. | UNVERIFIED_PRACTITIONER_CLAIM |
| OBS-010 | SRC-003 | CLAIM | SOURCE_EXPLICIT | Buying calls is framed as lower-probability/higher-reward and selling as probability-favored. | VERIFY_LATER |
| OBS-011 | SRC-003 | CALCULATION | SOURCE_EXPLICIT | WDAY vertical and back-ratio examples compare probability, max loss and asymmetric payoff. | VERIFY_LATER |
| OBS-012 | SRC-005 | CLAIM | SOURCE_EXPLICIT | LEAPS have materially larger vega exposure; seller thesis expects volatility compression after spikes. | VERIFY_LATER |
| OBS-013 | SRC-005 | RECOMMENDATION | SOURCE_EXPLICIT | Reduced margin requirement should not be used as permission to double exposure; park or diversify unused capital. | UNVERIFIED_PRACTITIONER_CLAIM |
| OBS-014 | SRC-006 | CLAIM | SOURCE_EXPLICIT | Frequent small seller wins are described as psychologically easier than holding rare large buyer wins. | VERIFY_LATER |
| OBS-015 | SRC-006 | RECOMMENDATION | SOURCE_EXPLICIT | A system is only as good as the trader’s ability to manage it. | UNVERIFIED_PRACTITIONER_CLAIM |
| OBS-016 | SRC-006 | CALCULATION | SOURCE_EXPLICIT | Bear-call example collects $1,845 against $3,155 risk and plans exit around $600–650 loss rather than max loss. | NOT_REQUIRED |
| OBS-017 | SRC-009 | RECOMMENDATION | SOURCE_EXPLICIT | Size positions to risk, not reward; a single-trade 20% account loss is called unacceptable. | UNVERIFIED_PRACTITIONER_CLAIM |
| OBS-018 | SRC-007 | DEMONSTRATION | SOURCE_EXPLICIT | Greeks are used to reason about direction, acceleration, time decay, volatility and rates; theta accelerates near expiration. | VERIFY_LATER |
| OBS-019 | SRC-008 | DEMONSTRATION | SOURCE_EXPLICIT | Eleven strategy constructions are compared by debit/credit, directional outlook, use and payoff shape. | NOT_REQUIRED |
| OBS-020 | SRC-008 | RECOMMENDATION | SOURCE_EXPLICIT | Pure long calls/puts are associated with large directional moves; spreads with more moderate views; straddles/strangles with large movement either way. | UNVERIFIED_PRACTITIONER_CLAIM |
| OBS-021 | SRC-009 | RECOMMENDATION | SOURCE_EXPLICIT | Buyers are told to buy more time and avoid severe late-stage decay; sellers are encouraged toward shorter duration. | VERIFY_LATER |
| OBS-022 | SRC-009 | DEMONSTRATION | SOURCE_EXPLICIT | Earnings example shows both calls and puts losing as IV collapses despite limited price movement. | VERIFY_LATER |
| OBS-023 | SRC-008 | STATEMENT | SOURCE_EXPLICIT | Covered call and CSP are described as having synthetically identical risk graphs. | VERIFY_LATER |
| OBS-024 | SRC-010 | DEMONSTRATION | SOURCE_EXPLICIT | Wheel transitions from short put to stock ownership on assignment, then to covered-call selling, then possibly call-away/re-entry. | NOT_REQUIRED |
| OBS-025 | SRC-011 | RECOMMENDATION | SOURCE_EXPLICIT | Stock owners are encouraged to sell calls for yield; source also describes hedging/rolling to avoid losing shares. | UNVERIFIED_PRACTITIONER_CLAIM |
| OBS-026 | SRC-008 | DEMONSTRATION | SOURCE_EXPLICIT | Calendar buys a later call and sells nearer calls repeatedly if the stock stays suitable. | NOT_REQUIRED |
| OBS-027 | SRC-010 | CALCULATION | SOURCE_EXPLICIT | EOG Wheel example evaluates premium %, effective basis, probability, assignment and next covered-call state. | VERIFY_LATER |
| OBS-028 | SRC-012 | CALCULATION | SOURCE_EXPLICIT | Chevron bull-put spread chooses three contracts specifically to match a $150 cash-flow goal while showing $1,350 structural max risk. | VERIFY_LATER |
| OBS-029 | SRC-010 | CLAIM | SOURCE_EXPLICIT | 12-month KO case is reported at about 15.5% cash-flow ROI. | VERIFY_LATER |
| OBS-030 | SRC-010 | RECOMMENDATION | SOURCE_EXPLICIT | Wheel stock should be something the trader would willingly own, with liquid options and acceptable fundamentals/price. | UNVERIFIED_PRACTITIONER_CLAIM |
| OBS-031 | SRC-010 | RECOMMENDATION | SOURCE_EXPLICIT | Protective puts/collars are described as downside-protection “business expense” tools inside Wheel practice. | UNVERIFIED_PRACTITIONER_CLAIM |
| OBS-032 | SRC-025 | DEMONSTRATION | SOURCE_EXPLICIT | PMCC substitutes a long LEAPS call for 100 shares and repeatedly sells shorter calls against it. | NOT_REQUIRED |
| OBS-033 | SRC-025 | CALCULATION | SOURCE_EXPLICIT | PMCC example compares $27,300 stock capital with roughly $5,000 LEAPS capital and warns that the long LEAPS still decays. | VERIFY_LATER |
| OBS-034 | SRC-025 | RECOMMENDATION | SOURCE_EXPLICIT | PMCC requires a plan for up, flat and down scenarios and should not rely on early exercise of the LEAPS to cover the short call. | UNVERIFIED_PRACTITIONER_CLAIM |
| OBS-035 | SRC-026 | CLAIM | SOURCE_EXPLICIT | Final ~60 days are described as seller “cash-flow zone” and buyer danger zone because of accelerating theta. | VERIFY_LATER |
| OBS-036 | SRC-026 | RECOMMENDATION | SOURCE_EXPLICIT | Buyers are told to use at least ~3 months and sellers ≤60 DTE. | VERIFY_LATER |
| OBS-037 | SRC-027 | RECOMMENDATION | SOURCE_EXPLICIT | Risk management and journaling are described as commonly skipped; mentorship/paper trading/process discipline are emphasized. | UNVERIFIED_PRACTITIONER_CLAIM |
| OBS-038 | SRC-028 | CLAIM | SOURCE_EXPLICIT | Crowding is said to have compressed 0DTE selling premiums and eroded the old seller edge. | VERIFY_LATER |
| OBS-039 | SRC-031 | CLAIM | SOURCE_EXPLICIT | IV crush around earnings is described as a major source of buyer losses and seller opportunity. | VERIFY_LATER |
| OBS-040 | SRC-028 | DECISION | SOURCE_EXPLICIT | Source now often rejects 0DTE selling economics while considering short-term buying during VIX spikes above 25. | VERIFY_LATER |
| OBS-041 | SRC-029 | DEMONSTRATION | SOURCE_EXPLICIT | After-hours movement after Friday close can change whether exercising an option is economically useful. | VERIFY_LATER |
| OBS-042 | SRC-029 | CALCULATION | SOURCE_EXPLICIT | Example buys stock after hours at $99.50 and exercises a 100 put, locking 50¢/share. | VERIFY_LATER |
| OBS-043 | SRC-036 | RECOMMENDATION | SOURCE_EXPLICIT | Do not exercise early when time value remains; dividend capture near expiry/deep ITM is presented as an exception. | VERIFY_LATER |
| OBS-044 | SRC-033 | RECOMMENDATION | SOURCE_EXPLICIT | Beginners are told to buy more time and sell 1–2 months so theta works in the intended direction. | VERIFY_LATER |
| OBS-045 | SRC-033 | STATEMENT | SOURCE_EXPLICIT | CSP assignment is described as acceptable because it acquires desired stock and can transition to covered calls. | UNVERIFIED_PRACTITIONER_CLAIM |
| OBS-046 | SRC-028 | STATEMENT | SOURCE_EXPLICIT | SPX/index options and SPY/equity options are distinguished by settlement/exercise consequences. | VERIFY_LATER |
| OBS-047 | SRC-034 | RECOMMENDATION | SOURCE_EXPLICIT | $2k–$3k is recommended as minimum capital so losing trades/drawdowns can be survived; $5k–$10k preferred. | VERIFY_LATER |
| OBS-048 | SRC-032 | DEMONSTRATION | SOURCE_EXPLICIT | Long call is framed as a right to buy that can provide leveraged participation with premium-limited loss. | VERIFY_LATER |
| OBS-049 | SRC-035 | DEMONSTRATION | SOURCE_EXPLICIT | Protective put is framed as transferring downside below a strike while retaining the stock. | VERIFY_LATER |
| OBS-050 | SRC-030 | CLAIM | SOURCE_EXPLICIT | Delta is used both as price sensitivity and as a rough probability of expiring with intrinsic value. | VERIFY_LATER |

---

## 17. Vocabulary Register

| ID | Term | Sources | Local practitioner meaning |
|---|---|---|---|
| VOC-001 | cash-flow zone | SRC-026, SRC-007 | late-duration region presented as favorable to option sellers |
| VOC-002 | speed bump | SRC-004 | covered-call premium cushions but does not hedge a crash |
| VOC-003 | five directions | SRC-008 | pedagogical magnitude/direction scale −2 to +2 |
| VOC-004 | get paid to wait | SRC-010, SRC-012, SRC-033 | sell puts while willing to acquire stock |
| VOC-005 | put stocks to work | SRC-011 | sell calls against stock to generate premium |
| VOC-006 | hopes and dreams | SRC-006 | seller framing of selling expensive possibility/optionality |
| VOC-007 | casino | SRC-003 | seller/probability metaphor |
| VOC-008 | expense trade | SRC-034 | losing trade reframed as expected business expense |
| VOC-009 | defend | SRC-004, SRC-006 | intervene before an adverse position reaches worst case |
| VOC-010 | line in the sand | SRC-035 | protective put strike as downside floor |
| VOC-011 | no debt leverage | SRC-025, SRC-032, SRC-028 | control exposure with option premium rather than borrowed purchase capital |
| VOC-012 | Wheel | SRC-010, SRC-033 | repeated CSP → stock → covered-call lifecycle process |

---

## 18. Relationship Register

### REL-001
**IV relative to HV → affects willingness to sell premium.**  
Status: `EXTRACTED`. Support: OBS-004, OBS-012, OBS-039.

### REL-002
**Shorter time to expiry → greater theta pressure in practitioner teaching.**  
Status: `EXTRACTED`. Support: OBS-018, OBS-035.

### REL-003
**Higher win probability ↔ poorer payoff ratio.**  
Status: `EXTRACTED`. Support: OBS-003, OBS-016.

### REL-004
**Position size → bounds affordable trade loss.**  
Status: `EXTRACTED`. Support: OBS-005, OBS-017, OBS-047.

### REL-005
**Covered-call premium ↔ reduced basis / forgone upside.**  
Status: `EXTRACTED`. Support: OBS-007, OBS-025.

### REL-006
**Payoff equivalence ≠ lifecycle equivalence.**  
Status: `CROSS_OBSERVATION_DERIVED`. Support: OBS-023, OBS-024, OBS-025, OBS-045.

### REL-007
**Assignment → can trigger a new inventory/strategy state.**  
Status: `EXTRACTED`. Support: OBS-024, OBS-045.

### REL-008
**Cross-expiry construction → one leg may survive another leg’s expiration.**  
Status: `EXTRACTED`. Support: OBS-026, OBS-032, OBS-034.

### REL-009
**Volatility change → option value can change without corresponding underlying move.**  
Status: `EXTRACTED`. Support: OBS-018, OBS-022, OBS-039.

### REL-010
**Exercise decision → depends on remaining time value, expiry state, after-hours price, and sometimes dividend.**  
Status: `CROSS_OBSERVATION_DERIVED`. Support: OBS-041–043.

---

# Part III — Representative Evidence

## 19. Worked Specimens

### SPC-001 — $400 underlying credit spread
**Sources:** SRC-001; OBS-001–004.  
**Situation:** $400 stock, 17 DTE.  
**Construction:** short 360 put ~$5.30 / long 350 put ~$3.50.  
**Economics:** ~$1.80 credit; ~$180 max gain above 360; net theta about +$7/day in source example.  
**Why representative:** joins direction, volatility, time, premium and payoff qualification in one trade.

### SPC-002 — FCX targeted butterfly
**Sources:** SRC-002; OBS-005–006, 009.  
**Situation:** FCX ~$73.93, bullish retracement, 43 DTE, target ~$82.50.  
**Construction:** +75 call / −2×82.50 calls / +90 call.  
**Economics:** ~$125 debit/max risk; source claims ~$600 max reward; exits if debit loses >50%.  
**Why representative:** shows thesis, construction, asymmetric payoff, sizing and planned loss tolerance.

### SPC-003 — SanDisk bear-call management
**Sources:** SRC-006; OBS-015–016.  
**Situation:** high-probability seller structure.  
**Economics:** collect ~$1,845; structural risk ~$3,155.  
**Management:** thesis break near prior resistance; planned loss ~$600–650 rather than max loss.  
**Why representative:** clean structural-max-loss vs management-loss specimen.

### SPC-004 — CSP / covered-call lifecycle equivalence tension
**Sources:** SRC-008, SRC-010, SRC-011, SRC-033; OBS-023–025, 045.  
**Situation:** CSP and covered call are described as synthetic risk-graph equivalents.  
**Lifecycle:** CSP may acquire stock; covered call operates on existing stock and may dispose of it.  
**Why representative:** payoff similarity with different inventory transitions and practitioner jobs.

### SPC-005 — EOG Wheel transition
**Sources:** SRC-010; OBS-024, 027, 030–031.  
**Situation:** EOG ~$136; sell 130 put ~35 DTE for ~$2.50.  
**Next state:** assignment acceptable; then sell 150 covered call; protective put/collar discussed as risk control.  
**Why representative:** repeated process whose next action depends on prior resolution.

### SPC-006 — Calendar repeated short-leg cycle
**Sources:** SRC-008; OBS-026.  
**Construction:** buy later call, sell nearer call; if short expires and thesis remains suitable, sell another nearer call.  
**Why representative:** terminal payoff picture does not capture continuing residual long leg and repeated formations.

### SPC-007 — PMCC cross-expiry position
**Sources:** SRC-025; OBS-032–034.  
**Situation:** Apple ~$273; stock capital ~$27,300 vs long LEAPS ~ $5,000.  
**Construction:** long LEAPS + recurring short calls.  
**Risk/management:** long LEAPS decays; delta hedging/game plan required; early exercise discouraged.  
**Why representative:** capital efficiency, cross-expiry lifecycle, residual-leg and management complexity.

### SPC-008 — Earnings IV crush
**Sources:** SRC-009, SRC-031; OBS-022, 039.  
**Situation:** options bought into earnings with high priced-in movement; realized move small.  
**Consequence:** calls and puts can lose from IV collapse despite limited underlying movement.  
**Why representative:** falsifies price-only consequence reasoning.

### SPC-009 — After-hours expiration exercise
**Sources:** SRC-029; OBS-041–042.  
**Situation:** stock closes ~$100.50, falls to ~$99.50 after hours; 100 put was OTM at close.  
**Action:** buy shares after hours, exercise put at 100.  
**Economics:** source calculates ~$0.50/share locked spread.  
**Why representative:** expiration lifecycle does not end conceptually at closing print.

### SPC-010 — Early exercise / dividend exception
**Sources:** SRC-036; OBS-043.  
**Rule:** generally sell option rather than exercise while time value remains.  
**Exception:** deep ITM, near expiry, little time value, dividend capture may alter decision.  
**Why representative:** rule with explicit boundary condition.

### SPC-011 — Covered-call opportunity cost
**Sources:** SRC-004; OBS-007–008.  
**Situation:** stock 100; short 110 call for 2.  
**Consequence:** source treats 112 as opportunity-cost crossover; stock at 130 creates substantial forgone upside.  
**Why representative:** collected premium can coexist with economically undesirable counterfactual outcome.

### SPC-012 — 0DTE seller-edge erosion
**Sources:** SRC-028; OBS-038, 040.  
**Situation:** rapid theta mechanically exists, but source claims crowding compressed selling premium.  
**Decision:** reject many 0DTE sales despite decay; consider buying during volatility spikes.  
**Why representative:** mechanical property does not guarantee exploitable edge.

---

## 20. Reference-Specimen Challenge Set

| Challenge | Specimen | Why selected |
|---|---|---|
| Multi-variable qualification | SPC-001 | direction + IV + theta + payoff |
| Planned loss vs max loss | SPC-003 | explicit management boundary |
| Payoff-equivalent / lifecycle-different | SPC-004 | CSP vs covered call |
| Repeated process transition | SPC-005 | Wheel |
| Cross-expiry residual position | SPC-006 | calendar |
| Capital-efficient cross-expiry | SPC-007 | PMCC |
| Volatility-sensitive consequence | SPC-008 | IV crush |
| Expiration edge case | SPC-009 | after-hours exercise |
| Explicit rule exception | SPC-010 | dividend/early exercise |
| Opportunity cost | SPC-011 | covered call |
| Mechanical property vs market edge | SPC-012 | 0DTE |
| Thesis + sizing + planned exit | SPC-002 | butterfly |

This challenge set is selected for coverage and falsifiability, not popularity or endorsement.

---

## 21. Provenance Index

The complete provenance path for this corpus is:

```text
Cashflow Academy videos
    ↓
Muse transcript-derived per-video studies
    ↓
docs/research/external-artifacts/cashflow-academy-options-knowledge-base.md
    @ 3ab9f0ac16d1d432ebd5ff0578c62cf5df1b3fa8
    ↓
24 admitted studies only: 1–12, 25–36
    ↓
OBS / SPC / VOC
    ↓
JOB / FRI / FAIL / REL / EXC
    ↓
PAT / CON / INS / RED / TAK / Q
    ↓
Executive synthesis
```

Part A of the Muse artifact was used only as a navigation/checking aid. Corpus findings were grounded in admitted per-video deep dives. Studies 13–24 were not used as evidentiary support.

The immediate evidence available to this corpus is the preserved Muse distillation of the transcripts, not raw transcript text. Therefore exact wording, high-stakes mechanics, model-changing conclusions, and external truth claims should descend to the primary video/transcript or independent authoritative evidence before promotion beyond this research layer.

---

# 22. Completion Audit

| Charter completion test | Result |
|---|---|
| 24 admitted studies represented in source ledger | PASS |
| 12 insufficient-fidelity studies contribute no evidence | PASS |
| Worked specimens preserved | PASS |
| Practitioner-native vocabulary recorded | PASS |
| Decision Jobs extracted with derivation status | PASS |
| Frictions extracted with derivation status | PASS |
| Failure Modes extracted with derivation status | PASS |
| Relationships extracted with derivation status | PASS |
| Exceptions extracted with derivation status | PASS |
| Patterns distinguish recurrence from truth | PASS |
| Contradictions remain visible | PASS |
| External claims queued for verification | PASS |
| Executive synthesis traceable to evidence | PASS |
| Reference-specimen challenge set selected | PASS |
| Wheelwright semantic/product reconciliation performed inside corpus | NO — REQUIRED |
| Human-readable independently of Wheelwright | PASS |

---

# 23. Corpus Boundary

This artifact may now be used as an independent input to:

- domain discovery;
- semantic falsification;
- product discovery;
- product falsification;
- external verification planning.

Those downstream activities MUST preserve the distinction between:

`CORPUS EVIDENCE`  
`WHEELWRIGHT EVIDENCE`  
`ANALYST INFERENCE`

No downstream consumer may retroactively alter this corpus to make Wheelwright appear more or less aligned with practitioner evidence.

---

> **Preserve what practitioners actually say, do, calculate, decide, recommend, struggle with, and contradict before asking what Wheelwright thinks it means.**
