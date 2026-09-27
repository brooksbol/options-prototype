# Research-Program Reorientation Memo

**Date:** 2026-09-27
**Assignment:** Reorient the options research program from scientific falsification of a stipulated short-premium treatment toward the Principal's actual objective.
**Working dir:** `~/workspace/research_notes/options-program-reorientation-20260927/`
**Evidence inputs:** four bounded workers (A: failures/blow-ups; B: human factors; C: practitioner survival lessons; D: portfolio/capital-survival + brokerage/capability), each with evidence-state tags and source ledgers at `notes/worker-{A,B,C,D}-*.md`. This memo is synthesis and prioritization only — no new empirical question was executed.

**Evidence tags used:** VERIFIED / IDENTIFIED-TRACEABLE / INFERENCE / ABSENCE-OF-EVIDENCE / CONTRADICTED.

---

## 1. Principal's actual objective as understood

The Principal is not writing a dissertation on options-market microstructure, the variance risk premium, or the ultimate economic explanation for option returns. The objective is to become a competent, sustainable options operator and to build Wheelwright in support of that operation — without this assignment turning that objective into product requirements or implementation work.

The orienting question:

> What operating practices, controls, capabilities, and decision disciplines give a real options operator the best chance of running a repeatable process for a long time while preserving the capital base and avoiding known catastrophic or self-inflicted failure modes?

Information value is ranked by consequence to the operator: capital-threatening first, then process-threatening, then operational, then marginal optimization. The operative standard is survival of the operator and the account, not the elegance of the explanation.

---

## 2. Where the program drifted

The program organized itself around scientific falsification of a stipulated short-premium treatment (the 45/50/21 composite) and ranked questions by scientific interest rather than operator consequence:

1. **Net retail execution baselines first.** The evidence-upgrade wave treated "is there a net, sequential, friction-inclusive replication of the canon?" as the program's keystone. It is a legitimate empirical question. But it answers "does the premium exist net of costs?" — not "will an operator survive collecting it?" The program was optimizing for the existence of edge before studying the survival of the edged.
2. **Precision friction calibration as a flagship.** Q0 spent a full eight-track investigation on the retail execution-friction matrix. The Principal's own subsequent judgment: brokerage friction has not been a major practical problem in their operating experience so far. Legitimate research, useful as a bound — but it was worked at flagship depth while operator-survival questions (forced liquidation, reserve sizing, revision governance) had no worker at all.
3. **Compensation-vs-mispricing queued as next.** The temporal-incidence investigation answered its question (see §3) and then proposed adjudicating *why* the premium accrues overnight — dealer compensation, mispricing, or behavioral stickiness. Scientifically well-formed. But no one asked what operator decision its answer would change. None was identified. The program was about to spend its next major wave on a question with no operator consequence.
4. **Adherence studied as a virtue.** The precommitment and wheel-discipline work correctly found that pre-specified procedures beat unstructured judgment — but the program's framing leaned toward "discipline matters" as the thesis to defend, while the evidence said adherence-itself is unsupported independently of program quality and mechanical adherence can institutionalize destructive behavior.

The drift was not a failure of rigor — the program's evidence standards, self-correction record, and falsifier culture are assets to keep. The drift was in the objective function: it maximized answered scientific questions instead of reduced operator risk.

---

## 3. What existing research still contributes

Changed priority does not change truth status. The durable findings, preserved as found:

- **Evidence upgrade** (`options-evidence-upgrade-20260927`): the pooled low-single-digit gross baseline is CONTRADICTED as stated; most "annual" figures are per-trade extrapolations, not sequential returns; no net sequential replication of the exact composite exists; the single-name short-vol book is not "structurally long correlation" (corrected to common-downside-factor concentration in stress, INFERENCE); SEBI outcomes are valuable but India-specific and published as reports, not microdata; US retail outcome data remain sparse; "customer" cannot be equated with retail. Operator-lens value: this work proved the research process catches denominator mistakes, lineage duplication, false transfer, and fake evidentiary completeness.
- **Q0 friction** (`options-friction-q0-20260927`): one genuine SPX retail-proxy effective-spread estimate exists (Beckmeyer, Branger & Gayda: calls 6.0%, puts 5.0%, buys 8.4%, sells 5.2%, under one hour to expiry 10.5%); the 30–60 DTE retail cell is empty; broker × order type are first-order execution dimensions; explicit fees are far better identified than spread execution. Disposition: LOCALLY INCONCLUSIVE — PARKED.
- **Temporal incidence** (`options-next-question-20260927`): three independent arrivals (Muravyev & Ni 2020; Terstegge Dec-2025 WP; Jones & Shemesh 2018) show negative delta-hedged SPX returns accrue essentially entirely over non-trading periods; mechanism contested (dealer gap-risk compensation vs. mispricing vs. behavioral stickiness). Disposition: ANSWERED — ADVANCE. The operator-relevant residue: the binding constraint is temporal access (a day-only process cannot harvest an overnight phenomenon), not the 30–60 DTE spread cell — which demotes Q0's empty cell further.
- **Precommitment** (`precommitment-adherence-override-20260925-2133`): pre-specified procedures beat unstructured contemporaneous judgment; adherence-itself is not established independently of program quality; bounded/documented override is more defensible than either unrestricted discretion or absolute prohibition; outcome-triggered revision is statistically invalid (outcome bias, DSR/PBO); stable policies are a precondition for learning and attribution; no validated governance exists for review cadence and evidence thresholds; checklist/aviation transfer is limited because trading often lacks known-correct actions. Dyer et al. (2021) — quant funds −2.73%/yr after accounting changes — is the cleanest discretion-beats-adherence finding and the structural-break case.
- **Wheel discipline vs. discretion** (`wheel-discipline-vs-discretion-20260925-2102`): no direct evidence compares Wheel adherers against overriders; mechanical adherence can institutionalize destructive behavior (indefinite rolls, cost-basis anchoring, post-decline delta increases); underlying selection may dominate premium mechanics (spintwig: 94–99% of return from the long underlying); "discipline matters" is mostly proxy evidence and practitioner doctrine at the Wheel level.
- **Practitioner landscape** (`comparative-options-landscape-redo-20260927`): practitioner slogans conceal incompatible behaviors ("be the casino," "trade small," "high probability," "manage winners," "income," "cost basis," "mechanical" are false-consensus language); competent practitioners disagree about premium selling, assignment, discretion, sizing, and mechanics; convergence often reflects shared lineage, not independent confirmation; practitioner evidence is evidence of practice, not automatic empirical truth.
- **Program design** (`options-research-program-design-20260927-0131`): the wave structure, the 15 unanswered questions, the boundary-failure catalog (especially #5, #6, #9, #18, #19, #22), and the regulatory-evidence ecosystem map remain the program's best inventory of where evidence could come from.

---

## 4. Macro-optima versus micro-optima — provisional classification

Provisional definitions, evidence-revisable: **MACRO-OPTIMA** are mistakes or decisions affecting survival, capital preservation, uncontrolled exposure, forced liquidation, behavior under stress, repeatability, hidden poor economics, portfolio aggregation, or operational feasibility. **MICRO-OPTIMA** are real but marginal improvements to an already viable process.

Worker B's evidence challenges the distinction as a settled category: the disposition pattern appears in profitable professionals (Garvey & Murphy 2004, VERIFIED), loss-conditioned risk expansion had no detectable cross-day profit–risk relation (Coval & Shumway 2005, VERIFIED core), and outcome bias means realized bad outcomes cannot adjudicate whether a macro mistake occurred. The honest statement: MACRO-OPTIMA remains a hypothesis in need of identification criteria. The evidence supports a narrower claim — **structural mechanisms (leverage constraints, nonlinear tail exposure, forced liquidation) threaten capital more legibly than any measured psychological bias.**

Provisional classification of the program's question inventory:

**Capital-threatening (macro):**
- Forced liquidation under margin expansion — VERIFIED mechanism (Santa-Clara & Saretto 2004: margin calls flip the near-maturity strangle's Sharpe from +1.69 to negative; IBKR primary disclosure: liquidation without notice, no choice of positions/timing, margin changeable at any time in sole discretion).
- Unhedged tail exposure / common-downside-factor concentration — VERIFIED adjacent (BKT 2008: correlation 35.83%→65.14%, short-correlation-proxy losses −24.4%/−12.4%/−7.5%); exact diversified single-name short-premium book test never run (ABSENCE-OF-EVIDENCE).
- Sequence × leverage — VERIFIED at practitioner level (SJ Options leverage ladder: same rules, 15% margin use → +2% cumulative, 70% → −93% stopped 2011); population level (SEBI: sellers lose rarely, catastrophically — 44% incidence, ₹51.7L average loss per loss-maker).
- Measurement distortion sustaining losing processes — VERIFIED (InTheMoney's 2023 on-camera demotion of adjusted cost basis to "psychological comfort"; Option Alpha: "the only thing that matters is the balance in the account"; 0DTE median-profitable/mean-negative inversion).
- Platform operational failure — VERIFIED one case (Robinhood March 2020: $9.9M settlement, ~150k investors, $20.4M calculated losses, expiration-day timing); no base rate.

**Process-threatening (macro):**
- No validated method for distinguishing structural strategy break from painful variance before the abandon/override decision (ABSENCE-OF-EVIDENCE; the Dyer et al. case proves the distinction matters, Marks's "judge decision quality not outcome" proves outcomes can't make it).
- No evidence that any trading-specific safeguard (checklist, journal, kill switch, cooling-off, accountability) improves long-horizon operator survival (ABSENCE across all cells; journaling has no causal evidence plus fabricated statistics circulating).
- Reserve sizing: the margin-expansion mechanism is verified, the prescribed defense ("keep 40–50% idle") has zero empirical calibration (ABSENCE-OF-EVIDENCE — one of the largest empty cells).

**Operational:**
- Assignment/exercise/expiration mechanics — VERIFIED primary facts (OCC auto-exercise $0.01/$1.00; 5:30pm ET cutoff; contrary exercise; pin risk in the ±$0.01 band; Poteshman & Serbin: suboptimal long-holder exercise is a documented income source for short writers).
- Capability adequacy: the load-bearing "capability" is the broker's liquidation policy and margin discretion — contractual, not technical (Worker D).

**Marginal optimization (micro):**
- Q0-style precise fill calibration (per the Principal's own operating experience, brokerage friction has not been a practical problem — this does not prove irrelevance, but precise calibration is currently a micro-optimum).
- DTE/IVR parameter tuning, win-rate tuning, 0DTE spread-cell completion.

A micro issue becomes macro if shown to affect survival, repeatability, utilization, or economic results. The classification is a working hypothesis, not a verdict.

---

## 5. Important practical domains currently under-researched

Ranked by consequence to the operator, not by research ease:

1. **Sequential funded-account outcomes for defined retail short-premium programs** — net of all frictions, geometrically compounded, with margin/liquidation events included. This is the load-bearing quantity for the entire objective and no source measures it. SEBI is population-level and buyer-dominated; Cboe indices are geometric but paper; per-trade studies are arithmetic.
2. **Cohort survival curves for retail options accounts** — what fraction of accounts that start selling premium are at zero within N years. Worker A: no source found. This is the number "repeatable process for years without blowing up" actually needs.
3. **Reserve/liquidity-buffer sizing** — mechanism (margin expansion) verified, defense ("keep X% idle") pure folklore. Whether any reserve fraction has survival benefit, or survival is fully explained by position sizing, is unmeasured.
4. **Multi-day loss-conditioned behavior with convex payoffs** — all existing risk-expansion evidence is intraday (Coval & Shumway) or forced (Bian et al.). The multi-day interaction of drawdown psychology with nonlinear options exposures is the actual operator risk and is unmeasured.
5. **Revision governance** — review cadence, evidence thresholds, and a non-outcome method for distinguishing "program broken" from "trade hurts." Terminal ABSENCE-OF-EVIDENCE is the likely finding; declaring it is itself valuable.
6. **Joint-assignment / joint-loss structure of multi-position premium portfolios** — "five concurrent wheels behave like one large position wearing five symbols" is practitioner phenomenology; the joint-tail probability structure is unmeasured, and folk reserve ratios (20–50%) are not joint-tail-calibrated.
7. **Small-account viability** — whether trade-small doctrine or Freudberg's "chase proven winners" is right for small accounts. Highest-consequence sizing disagreement in the corpora; zero evidence; not in any verification backlog.
8. **Stress-plan executability under correlated moves** — whether stress-management plans (rolls, hedges, liquidations) remain executable when several positions move together. Adjacent evidence (portfolio insurance 1987: the hedge's execution destroyed the liquidity it assumed) suggests the plan and the stress are not independent.
9. **Pausing/stopping governance** — no corpus specifies a rule for deliberately stopping new cycles; the wheel-family report found no source demonstrating one. Starting rules are taught; stopping rules are not.
10. **Data/record quality and false feedback loops** — ERN's "scam accounting" critique and InTheMoney's self-correction show measurement shapes behavior; no empirical work exists on how operator record-keeping quality affects process persistence.
11. **Counterparty-chain quality for retail** — Malachite showed dealer hedges failing when the originator defaults; the retail analogue (what happens to the operator's positions if their clearing chain breaks) has no documented case.
12. **Operator bandwidth vs. strategy complexity** — the interaction between the number of concurrent decisions a process demands and the operator's capacity under stress. Unmeasured; the "availability-set stop" anecdote (Lakha's 0DTE iron fly stopped by afternoon availability, not by the trade) is the only corpus datum.

---

## 6. Lessons from practitioner research that deserve deeper testing

Practitioner claims are evidence about practice, not causal truth. These are the claims whose truth value would change operator behavior, ranked by (evidence strength × survival consequence):

1. **Friction consumes the edge** — Goyal–Saretto (peer-reviewed): ~80%+ of a cross-sectional return at quoted spreads; spintwig: commissions ~20% in one backtest (model undisclosed); ProjectOption: 25% profit targets went negative after commissions. Strongest cross-source agreement in the corpora; decides whether the paper edge exists at all net of costs. Test: full-friction (commissions + slippage + spreads + assignment) accounting in one flagship backtest — no corpus currently does all four.
2. **The portfolio-accounting absence** — no corpus reports sequential portfolio P&L. The absence itself is the finding. Test: any practitioner backtest re-run at funded-account level with margin events.
3. **Correlated tails** — Driessen–Maenhout–Vilkov (peer-reviewed): index VRP is priced correlation risk; ProjectOption Q&A and wheel-family phenomenology agree diversified shorts correlate in stress. Test: the exact diversified single-name short-premium book through a correlation spike (never run).
4. **Rolling as close-plus-reopen** — rolling for credit defers loss recognition and extends duration risk; InTheMoney's own credit-vs-collateral hurdle partially acknowledges this. Test: disposition-effect costs of rolling vs. closing — do rollers hold losers longer at worse economics?
5. **Anti-override doctrine (Option Alpha)** — the only quantified adherence-vs-override datum in any corpus: manual profit-taking at 500% cut long-run profit ~$17k; two overrides cost ~$1,300 (n=1, unaudited backtest). Test: live A/B — same teacher, same period, rules vs. overrides. None exists beyond this n=1.
6. **Sanctioned override (Freudberg/Brexit model)** — override explicitly permitted at obvious binary-event risk, in tension with mechanical rules. Test: can the override boundary be specified ex ante rather than narrated ex post? (Worker C OQ-C1.)
7. **Earnings ban vs. earnings selling** — OA stopped trading earnings after a 648,861-trade study (tail losses killed it despite ~90% IV contraction) vs. InTheMoney explicitly selling premium into earnings for IV crush. Largest-sample practitioner falsifier in any corpus, contradicted by a genuine outlier practice. Test: adjudicate — the academic side is UNRESOLVED (landscape redo §8.4).
8. **Manage-early vs. hold-to-expiration** — ProjectOption's own 41,600-trade study: holding to expiration had the highest per-trade average P&L — an internal falsifier of manage-early as unconditional optimum. Test: commission-adjusted, capital-recycling-aware comparison.
9. **Cost-basis accounting** — InTheMoney's 2023 self-correction (basis demoted to "psychological comfort") is first-person self-falsification; the wheel-family report documents basis-anchoring as the bag-holding mechanism. Test: disposition-effect costs of basis-anchored vs. forward-looking call management (wheel-family unresolved #9).
10. **0DTE seller-edge erosion (#10 backlog)** — Cashflow source claims crowding compressed 0DTE selling premiums; OA's 0DTE program is built on the opposite premise. Resolving it decides a live trade/no-trade boundary. Care: the claims differ (short-premium selling vs. defined-risk <50%-win structures) — the adjudication must not conflate them.
11. **"Keep 40–50% idle" reserve folklore** — specific, load-bearing, zero calibration. Test: reserve-fraction sweep against survival in a sequential backtest with margin accounting.
12. **Small-account sizing (trade-small vs. Freudberg)** — "it was way too small" vs. five corpora of trade-small. Zero evidence; not in any backlog. Test: small-account outcomes under both rules.

Also worth recording as a pattern, not a test: **doctrine pivots without post-mortems** (ProjectOption 2026 → long LEAPS; InTheMoney 2026 → LEAPS; OA across three eras). When a teacher's doctrine moves and no autopsy is published, followers of the old doctrine are running a program its author has left.

---

## 7. Failure modes and blow-up research opportunities

Worker A's 12 documented cases, compressed to the mechanisms that threaten a retail premium operator:

- **LJM Preservation and Growth (Feb 2018, FINRA AWC VERIFIED):** −80% in two days on a vol spike; the tail was disclosed in the prospectus ("unlimited downside," "extreme volatility spikes" named as the challenging market). The failure was the disclosed tail arriving, unreserved. Lesson-class: works until the environment where survival matters most; attractive cash flow concealing poor economics.
- **OptionSellers.com/Cordier (Nov 2018):** naked commodity options, leverage ~10× prudent, simultaneous nat-gas spike + crude drop; broker forced liquidation; clients lost 100%+ (margin debt beyond deposits). A 2013 CFTC reparations decision against Cordier predated the blow-up — a traceable lead on "the public record contained the warning."
- **Niederhoffer (1997, 2007):** naked short S&P puts, margin wipeout in a day; then the same strategy class again a decade later. The cleanest "foreseeable from own data" case: the operator's own history contained the lesson and it did not bind.
- **Karen Bruton/Hope (2014–16):** ~$100M paper losses concealed via paired "scheme trades" (realize gains, roll losses, extract $6M+ fees on phantom profits); surfaced by an NFA audit comparing clearing statements to client statements. Purest case of measurement concealing economics; also a caution on sourcing strategies from practitioner media (tastytrade featured her pre-fraud).
- **Malachite (Mar 2020, contemporaneous practitioner paper VERIFIED):** capped/uncapped variance spread — a pure short-tail structure; AUM insufficient for margin calls; counterparty default propagated to dealer hedges. Aggregated "uncorrelated" short-vol strategies were one tail bet in different costumes.
- **XIV (Feb 2018, SEC-filed release VERIFIED):** the acceleration clause (≤20% of prior close intraday) made a −96% day permanent — product structure converting a bad day into a terminal event. Reflexive rebalancing amplified the spike.
- **Alex Kearns/Robinhood (Jun 2020):** the displayed −$730K was a transient settlement-state artifact on a spread, not the economic position; the cost was a life. Bounds the "consequence to the operator" framing: interface + assignment mechanics + unreachable support.
- **Knight Capital (Aug 2012):** dormant code reactivated by a partial deployment; ~$440–461M in 45 minutes. The purest operational-risk case: the machine executes exactly what it was told, at machine speed. Directly relevant to any operator running automation.
- **Portfolio insurance (Oct 1987):** the hedge's execution destroyed the liquidity it assumed — the canonical "exit is crowded because everyone runs the same program" failure. Transfers to dynamic hedging of short-gamma books.

**Survivorship-bias audit (Worker A):** the record over-represents spectacular, litigated, institutional failures and under-represents attrition — the modal retail failure (a $5–50K account ground to zero) leaves no trace; survivors who took the same risks write the books; quiet fund deaths are absent; fraud-concealed failures are structural unknowns; near-misses are unmeasured ("how often does the trigger get pulled and nothing happens").

**Explicit empty cells (research opportunities):** no documented hedged-premium-book blow-up (wings may save books, or their failures are quieter — unknown); no named, quantified pin-risk or dividend early-exercise disaster; no 0DTE-era operator blow-up with documentation; strategy drift as a documented cause (alleged everywhere in hindsight, proven almost nowhere with contemporaneous records); no cohort survival curve for retail premium sellers; counterparty-chain quality for retail.

---

## 8. Human/operator research opportunities

Worker B's findings, added to the precommitment baseline:

- **Loss-conditioned risk expansion is real intraday, unmeasured multi-day.** Coval & Shumway (2005, VERIFIED core): CBOT professionals took above-average afternoon risk 31.2% of the time after morning losses vs. 27.0% after gains. Huang & Chan (2014): the effect is heterogeneous by trader type — no universal "revenge trading" model. No direct evidence exists for multi-day loss-conditioned risk in retail options accounts — the actual operator risk, unmeasured.
- **Experience does not attenuate bias.** Haigh & List (2005, VERIFIED): CBOT professionals showed *greater* myopic loss aversion than students. Falsifies "experience cures bias" as stated. Any program design relying on experience-driven bias attenuation contradicts this.
- **The disposition pattern is not automatically capital-threatening.** Garvey & Murphy (2004, VERIFIED): profitable prop traders realized winners faster than losers — the asymmetry lowered profit but the team was profitable. A secondary reading of Locke & Mann has professionals showing the pattern without financial loss (CONTESTED, primary needed). Worker B's challenge to the macro/micro distinction stands: holding-time asymmetry's cost is strategy-conditional.
- **Devices change behavior, not demonstrated outcomes.** Binding automatic exits causally reduce disposition behavior in the lab (Fischbacher et al. 2017, VERIFIED) — but behavior ≠ outcome, and Kaminski & Lo (2014) show stops can lower expected returns under IID processes. Journaling: no credible causal evidence, plus fabricated statistics circulating (integrity flag — do not cite). Kill switches, daily loss limits, cooling-off, accountability: practitioner-common, evidence-absent. Gambling precommitment reviews: no clear monetary-precommitment efficacy, 1.2% adoption, limit-exceeding by problem gamblers (distant transfer — blocks "binding limits obviously work").
- **Checklists: total absence of evidence in trading.** No empirical study shows pre-trade, expiration-day, or assignment-monitoring checklists improve trader outcomes. The aviation/medicine mechanism (checklist encodes known-correct actions) does not transfer automatically — in trading the correct action is frequently the contested object. A checklist can formalize a bad rule, become post-hoc rationalization, or create compliance theater.
- **The revision/adjudication gap is the deepest human-factors hole.** No validated method exists for distinguishing "program broken" from "trade hurts" before the decision. Marks's "You Bet!" doctrine (judge decision quality, not outcome) converges with the outcome-bias findings but is practitioner doctrine, not a method — and it sharpens the problem: if outcomes can't adjudicate decisions, the operator needs non-outcome evidence to ever revise, and none validated exists. Dyer et al. proves the distinction matters while remaining ex-ante unresolvable.
- **Stress behavior is mechanism-specific, not universal panic.** Vanguard: <0.5% went to cash in March 2020. Giglio et al.: selling tracked belief revision (optimists revised hardest). Robinhood users bought the dip. Bian et al.: margin accounts liquidated monotonically approaching the constraint — forced, not panicked. A stress protocol designed for one mechanism may worsen another.

**Net assessment:** the cleanest macro-grade human-factors mechanisms are structural (leverage-forced liquidation, tail-risk concentration), not psychological. The highest-value human-factors research is not "more biases" — it is the revision-governance gap, multi-day loss-conditioned behavior with convex payoffs, and whether any safeguard demonstrably improves long-horizon survival.

---

## 9. Portfolio/capital-survival research opportunities

Worker D's central analytic result: **the ruin object is not trade-level max loss but forced liquidation at the loss extreme under an expanded margin requirement** — a mechanism distinct from payoff risk, verified across regimes and brokers.

- **Santa-Clara & Saretto (2004, full text re-verified):** margin calls flip the near-maturity strangle's Sharpe from +1.69 to negative; margins "severely limit" position size below utility-maximizing levels; the paper opens with Niederhoffer's 1997 letter ("delay liquidating... for one more day" would have saved it). The authors' own caveat: exchange margins were arguably "set too high" in the 1985–2002 regime — the mechanism is regime-independent, its frequency regime-dependent.
- **Margin expansion is arithmetic.** Reg-T naked-short formula (Cboe manual, VERIFIED): proceeds + 20% of underlying − OTM, 10% floors. In a crash the short put goes deep ITM; the option's market value explodes convexly while the 20%-of-underlying term shrinks linearly — margin demand grows faster than the underlying's fall. Portfolio margin grants 3–4× leverage on hedged books in calm regimes (Cboe 2007 examples: SPX naked shorts at 26–37% of strategy-based margin) — so the absolute-dollar stress margin call can exceed the Reg-T account's. **Lower requirement ≠ safer account.**
- **The broker's discretion is a standing threat.** IBKR primary disclosure (VERIFIED): liquidation "without prior notice," no choice of positions/timing/order; "IB MAY MODIFY MARGIN REQUIREMENTS FOR ANY OR ALL CUSTOMERS... AT ANY TIME, IN IB'S SOLE DISCRETION." Two distinct threats: liquidation timing is the broker's at the worst moment; house margin can expand without any market move.
- **Correlation: verified adjacent, untested exact.** BKT: 35.83%→65.14% (Sep 2008), short-correlation-proxy losses −24.4%/−12.4%/−7.5%. Falsifier: most-positive-correlation-beta funds drew down only 5% — the spike is hedgeable in principle; what is fatal is *unhedged common-downside* exposure, which the exact retail-book test never measures. The binding variable is simultaneity of capital calls — unquantified for any retail book.
- **Sequence × leverage: the SJ Options ladder** (practitioner backtest, VERIFIED): identical trade rules, 15% margin use → +2% cumulative, 70% → −93% stopped 2011. The allocation is the return. Arithmetic reporting hides this (boundary #18).
- **Measurement: trust the funded sequential account.** Every alternative is shown manipulable or misleading by at least one primary or practitioner-primary source: premium collected (ERN "scam accounting"), win rate (0DTE median/mean inversion), adjusted basis (InTheMoney self-correction), per-trade P&L (ProjectOption's "not perfect" extrapolation), "income" framing (Israelov: engineering derivative income lowers expected total return). SEBI: gross 82.1% vs. net 87.7% loss incidence — costs push ~5.6pp of traders from profit to loss.
- **Reserves: the biggest empty cell.** "Keep 40–50% idle" is folklore with a verified mechanism behind it (margin expansion) and zero calibration. No study tests any reserve fraction against survival.
- **Assignment mechanics (VERIFIED primary):** OCC auto-exercise $0.01 (equity) / $1.00 (index, multiplier≠1); 5:30pm ET exercise cutoff — after-hours moves can assign a short that closed OTM; contrary exercise available; pin risk lives in the ±$0.01 band around strikes; Poteshman & Serbin: suboptimal long-holder exercise is a documented income source for short-call writers.

---

## 10. Brokerage/capability research opportunities

Capabilities, not rankings. No product design. (Worker D.)

- **The capability→process mapping.** Systematic single-leg short premium needs GTC management orders, buying-power visibility, assignment handling — not complex orders or APIs. Defined-risk premium needs multi-leg net-price complex orders (COB ≤16 legs, 1:3–3:1; COA customer-only 100ms auctions — VERIFIED). Rolling-to-avoid-assignment needs expiration-day management and fast assignment notification; no broker publishes a native "roll for credit" primitive — rolling is a construction, not an order type. The Wheel needs cash-secured-put collateral tracking, assignment handling, buy-write execution, dividend-calendar visibility. 0DTE SPX needs intraday risk analytics; European exercise removes the assignment problem entirely.
- **The most load-bearing capability is contractual.** Liquidation policy and margin discretion dominate trade-level edge (S&S; IBKR disclosure). Capability audits that rank order-type counts while ignoring the margin agreement measure the wrong thing.
- **Order-type choice dominates broker choice.** Barardehi et al. (via Q0): trader fixed effects explain 71% of execution-quality variation, broker fixed effects <1%; retail market orders 2.44% true effective spread vs. executed limits −1.01% — conditional on a ~30% fill rate. The operator's order-type discipline is the capability that matters; whether the 30% fill rate's opportunity cost erases the account-level benefit is unmeasured (open question).
- **Auction access is real but unverifiable.** ~50% of retail orders route via PIM-style auctions (45% of NBBO improvement vs. 5.6% autoexecution); COA gives complex orders the same structure. Whether a given broker routes a given order type into auctions vs. autoexecution cannot be verified from any public source.
- **Platform risk: real, episodic, uncalibrated.** Robinhood March 2020 (outages Mar 2/3/9; SPY options expiring Mar 2 formed the settlement class; $20.4M calculated losses) is the single documented case of platform failure destroying option operators' positions — at expiration-day timing, the worst possible. Eaton et al.: retail brokerage outages move the IV surface (short-dated OTM call IV falls; long-dated rises). Legal recourse is thin (GME restriction dismissal). No base rate exists; it cannot be sized, only acknowledged.

**Assessment for the program:** precise fill optimization stays parked as micro (per §4 and the Principal's operating experience). Capability adequacy and platform failure are macro only where they create forced exposure — which is exactly the liquidation-policy/margin-discretion channel of §9.

---

## 11. Candidate next-question map

Small number, consequential, each with the failure it addresses, consequence class, current belief, challenging evidence, independent lineages, null possibility, rabbit-hole risk, and knowledge unlocked.

### Q-R1. Forced-liquidation incidence: what fraction of short-premium account failures are forced liquidations vs. voluntary exits at a loss?

- **Failure addressed:** the operator's process is overridden by the margin constraint at the loss extreme — the #1 ranked ruin mechanism (S&S; Niederhoffer 1997; IBKR policy; Bian et al. forced deleveraging).
- **Consequence class:** capital-threatening.
- **Current belief:** forced liquidation is the binding ruin mechanism for leveraged short-premium books (INFERENCE from verified mechanism + cases).
- **Evidence that would challenge it:** account-level data showing most premium-seller failures are voluntary exits (measurement/behavior), with forced liquidations a small minority.
- **Independent lineages:** S&S margin-call accounting; broker auto-liquidation disclosures; Bian et al. margin-threshold liquidation; Worker A case series; SEBI seller loss-magnitude distribution.
- **Useful null:** if voluntary exits dominate, the binding constraint is measurement/behavior (§8), not margin governance — the program re-ranks toward §8/§9-measurement.
- **Rabbit-hole risk:** medium — broker account data are not public; the study must be designed around obtainable proxies (practitioner backtests with margin accounting, S&S-era replication, disclosure archaeology) or it becomes a data-wish project.
- **Knowledge unlocked:** whether margin governance (reserves, leverage caps, broker-agreement terms) is the #1 operator lever — the single highest-consequence ranking decision in the program.

### Q-R2. Reserve empirics: is there a reserve fraction with survival benefit, or is survival fully explained by position sizing?

- **Failure addressed:** margin expansion in stress meets an under-reserved account; the folklore defense ("keep 40–50% idle") is uncalibrated.
- **Consequence class:** capital-threatening.
- **Current belief:** none warranted — the mechanism is verified, the defense is folklore (ABSENCE-OF-EVIDENCE).
- **Evidence that would challenge it (either direction):** a sequential backtest with margin accounting showing a reserve fraction dominating position size — or showing reserves add nothing beyond small sizing.
- **Independent lineages:** S&S margin mechanics; Reg-T/PM formula arithmetic; SJ Options leverage ladder; practitioner folklore (OA, tastytrade, wheel community); retirement buffer literature (adjacent, different mechanism).
- **Useful null:** reserves add nothing beyond sizing — kills a load-bearing folk rule and simplifies the operator's constraint set.
- **Rabbit-hole risk:** medium-high — reserve-fraction sweeps invite parameter optimization; the preregistration must fix the question as "does any reserve fraction beat size-matched no-reserve" not "what is the optimal fraction."
- **Knowledge unlocked:** the first calibrated capital-adequacy input for a premium-selling operation.

### Q-R3. Sequential funded-account replication of a defined retail premium program, net of all frictions with margin events included.

- **Failure addressed:** the entire program's evidence base is per-trade; survival is per-account. The pooled-baseline contradiction (evidence upgrade) means the gross edge itself is unsettled at the account level.
- **Consequence class:** capital-threatening (decides whether the process is survivable at all).
- **Current belief:** no net sequential replication of the exact 45/50/21 composite exists (ABSENCE-OF-EVIDENCE, evidence upgrade).
- **Evidence that would challenge it:** a funded-account replication — or the demonstration that no executable specification survives friction + margin accounting, which is itself the answer.
- **Independent lineages:** evidence-upgrade replication audit; SJ Options ladder; SEBI population outcomes; Cboe strategy-index methodology critiques.
- **Useful null:** the defined program does not survive net sequential accounting — the most valuable negative in the program; it would retire the canon as an operating program (not as a scientific curiosity).
- **Rabbit-hole risk:** HIGH — this is the old program's keystone wearing new clothes; it must be bounded as a single replication attempt with preregistered frictions, not an open-ended backtest program. Kill it after one bounded attempt either way.
- **Knowledge unlocked:** whether "the premium" exists as an operable, survivable process — the existence question the reorientation subordinates but does not eliminate.

### Q-R4. Revision governance: what non-outcome evidence distinguishes structural strategy break from painful variance before the abandon/override decision?

- **Failure addressed:** the operator cannot tell "program broken" from "trade hurts" — the deepest human-factors hole (Worker B); outcome-triggered revision is invalid (DSR/PBO, outcome bias), and Dyer et al. proves the distinction matters.
- **Consequence class:** process-threatening.
- **Current belief:** no validated adjudication method exists (ABSENCE-OF-EVIDENCE — likely terminal).
- **Evidence that would challenge it:** fund letters, shutdown postmortems, risk-manager interviews, or quant model-governance material yielding an operational rule (review cadence + evidence thresholds + break criteria).
- **Independent lineages:** precommitment baseline (DSR/PBO, Dyer); Worker B's failed search; Marks's doctrine; practitioner pivots-without-postmortems (Worker C).
- **Useful null:** the search returns empty after a bounded hunt — declaring the unresolvability as a premise (design the operation to survive unresolvable revision decisions) is itself the finding.
- **Rabbit-hole risk:** medium — the hunt must be timeboxed; "one more interview set" is the failure mode.
- **Knowledge unlocked:** review cadence and evidence thresholds for program revision — the governance layer every long-horizon operation needs and no one has.

### Q-R5. Small-account viability: trade-small vs. Freudberg's "chase proven winners" — which, if either, survives?

- **Failure addressed:** the highest-consequence sizing disagreement in the corpora, with zero evidence; decides whether small accounts should trade these programs at all.
- **Consequence class:** capital-threatening (for that population).
- **Current belief:** none warranted (CONTRADICTED as consensus; ABSENCE of evidence).
- **Evidence that would challenge it:** small-account cohort outcomes under both rules — or the demonstration that neither survives friction (sit-out is the answer).
- **Independent lineages:** Freudberg primary transcript; tastytrade/OA/Lakha/Bassman doctrine; SJ Options allocation ladder (adjacent); Bauer et al. retail option losses (adjacent population).
- **Useful null:** neither rule survives — the small-account premium program is not viable, which is a decision (don't run it), not a refinement.
- **Rabbit-hole risk:** low-medium — bounded cohort/backtest study; the risk is scope creep into general small-account advice.
- **Knowledge unlocked:** a go/no-go for an entire operator population the corpora currently serve with contradictory slogans.

### Q-R6. Earnings gap-risk adjudication: OA's 648,861-trade earnings ban vs. InTheMoney's IV-crush selling into earnings.

- **Failure addressed:** gap risk is the canonical premium-seller tail event; the corpora's sharpest live contradiction.
- **Consequence class:** operational to capital-threatening (position-level gap survival).
- **Current belief:** OA's study (practitioner-reported, unaudited) says tail losses killed short-premium earnings approaches despite ~90% IV contraction; InTheMoney's practice says the crush pays. Academic adjudication UNRESOLVED.
- **Evidence that would challenge it (either side):** independent replication of the OA study's claims; audited accounting of the ITM earnings practice.
- **Independent lineages:** OA practitioner study; ITM primary transcripts; academic earnings-announcement volatility literature; Worker A gap-risk cases (LJM, Niederhoffer).
- **Useful null:** the contradiction is instrument- and structure-dependent (index vs. single name; defined-risk vs. undefined) — dissolving rather than resolving it, which still tells the operator where the ban applies.
- **Rabbit-hole risk:** low — bounded, two-sided, falsifiable.
- **Knowledge unlocked:** a live trade/no-trade boundary for the canonical gap event.

---

## 12. Reassessment of compensation-vs-mispricing

The test the Principal required: *what operator behavior, capital-survival practice, risk boundary, or capability decision would the answer materially change?*

The temporal-incidence investigation established the incidence half (overnight concentration, three independent arrivals) and proposed adjudicating the nature half: dealer gap-risk compensation (Terstegge), persistent mispricing (Jones & Shemesh), or behavioral stickiness (Muravyev & Ni).

Applied to the test, the adjudication fails to clear the bar:

- **Sizing:** unchanged under all three mechanisms. None implies a different position size.
- **Margin/reserves:** unchanged. The margin-expansion mechanism (§9) is mechanism-independent.
- **Revision governance:** unchanged. No mechanism provides a break-detection criterion.
- **Measurement:** unchanged. All three are consistent with the same accounting distortions.
- **Capability/brokerage:** unchanged.
- **Whether to run a premium process at all:** this is the one decision it could theoretically touch — if the premium were pure mispricing being arbed away, the process has a shelf life. But the live, operator-relevant form of that question is the **0DTE seller-edge erosion** item (#10 backlog, §6.10), which is about a specific claim (crowding compressed 0DTE selling premiums) adjudicated against a specific live program (OA's defined-risk 0DTE structures) — not about the general economic nature of the SPX variance premium.

The incidence finding already delivered the operator-relevant residue: the binding constraint is temporal access. A day-only process cannot harvest an overnight phenomenon; that demotes Q0's 30–60 DTE spread cell and constrains which processes can even attempt the harvest. The *why* behind the overnight accrual changes no operator decision currently on the table.

**Verdict: PARKED as an operator question.** It remains legitimate science and a valid supporting branch — if future evidence shows the edge is being arbed away (the erosion question), the compensation-vs-mispricing framing may become decision-relevant again. Until then, it does not earn wave resources. The program should not execute the adjudication before Principal review, and the default after review should remain parked unless a specific operator decision is attached to it.

---

## 13. Proposed next research wave

One wave, five bounded questions, sequenced by consequence. Each states its kill condition. No question executes before Principal review (§16).

- **Wave R1 — Forced-liquidation incidence (Q-R1).** Design around obtainable proxies: practitioner backtests re-run with margin-call accounting (S&S method, PM-era update), broker-disclosure archaeology, SEBI seller loss-magnitude decomposition. Kill condition: no obtainable proxy distinguishes forced from voluntary failure — declare the cell empty and move on.
- **Wave R2 — Reserve/sizing empirics (Q-R2).** Preregistered as "does any reserve fraction beat size-matched no-reserve," not "what is optimal." SJ-Options-ladder replication with margin accounting. Kill condition: reserves add nothing beyond sizing — publish the null, retire the folklore.
- **Wave R3 — Bounded sequential replication (Q-R3).** One bounded attempt: a single executable specification of a defined retail premium program, preregistered frictions (commissions + slippage + spreads + assignment), margin events included, geometric account accounting. Kill condition: one attempt, either outcome — a surviving replication or a documented non-survival. No second specification, no parameter search. This is deliberately the old program's keystone asked once, under the new objective's accounting, then retired as a question.
- **Wave R4 — Revision-governance hunt (Q-R4).** Timeboxed search across fund letters, shutdown postmortems, risk-manager interviews, quant model-governance material for an operational break-detection rule. Kill condition: the timebox expires — declare unresolvability as a premise and design around it.
- **Wave R5 — Earnings gap-risk adjudication (Q-R6).** Bounded two-sided replication/audit of the OA earnings study claims vs. the ITM practice. Kill condition: instrument/structure-dependence dissolves the contradiction — record the boundary conditions.

Q-R5 (small-account viability) is sequenced after the wave or dropped, pending the Principal's answer in §16 on whether that population is in scope.

---

## 14. What should remain parked

- **Q0 precision friction calibration.** Legitimate, useful as a bound, currently a micro-optimum per the Principal's operating experience. Do not reopen the 30–60 DTE cell or design a controlled execution experiment merely because public evidence is incomplete.
- **Compensation-vs-mispricing adjudication.** Per §12: parked until a specific operator decision attaches to it.
- **DTE/IVR/win-rate parameter tuning.** Micro-optima on an unsettled gross edge; the landscape redo found the 30–45 DTE "sweet spot" has no empirical backing anyway.
- **Educator-interview expansion.** The corpora are mined; new channels add lineage, not independent evidence. The marginal interview's information value is near zero for survival questions.
- **Backtest-of-the-month.** Any question whose answer is a parameter value rather than a survival input.
- **The 0DTE spread cell** — unless and until its completion would change a live trade/no-trade decision (the erosion question §6.10 is the decision-relevant form).

Parking is not deletion. Parked items retain their evidence states and can be reactivated by a decision that needs them.

---

## 15. Research stopping/rabbit-hole rules appropriate to this objective

1. **The operator-decision test.** Before resourcing any question, state the operator behavior, risk boundary, or capability decision its answer would change. No decision attached — no wave resources. (This is the rule that parks compensation-vs-mispricing.)
2. **Terminal absence gets declared, not re-dug.** After a bounded search, ABSENCE-OF-EVIDENCE is a finding. "One more source set" is the rabbit hole; the timebox is the guardrail.
3. **Preregister or declare.** Any backtest or replication fixes its specification, frictions, and kill condition before running. No post-hoc specification search. One bounded attempt per question (Q-R3's single-attempt rule is the template).
4. **Parameters are not findings.** Sweeps that end in "the optimal value is X" are micro-optima by construction; stop the sweep at the question that matters ("does any reserve fraction beat size-matched no-reserve").
5. **Falsifier first.** Each question states what evidence would kill it before the search begins. Questions without a kill condition don't start.
6. **Nulls are results.** A documented non-survival, an empty revision-governance cell, a dissolved contradiction — these retire questions, which is progress.
7. **No research-to-policy conversion.** Findings are research inputs, not trading rules. Nothing in this program becomes operator policy without the Principal's explicit direction. (Standing constraint, restated because the reorientation increases the temptation: survival-flavored findings feel actionable.)
8. **Importance ≠ evidence strength ≠ actionability.** A capital-threatening question with weak evidence (reserves) outranks a marginal question with strong evidence (fill calibration) — but weak evidence never becomes a prescription.
9. **One worker, one question, no cascades.** Bounded delegation with evidence-state discipline; synthesis and prioritization stay with the coordinator.
10. **Survivorship accounting on every lesson.** Any claim sourced from survivors carries the missing-population audit (Worker A's seven biases; Worker C's absent voices) or it doesn't ship.

---

## 16. Open questions for the Principal

Only questions whose answers materially change research direction:

1. **Whose operation is the research modeling?** Should the next wave target the Principal's own operating conditions specifically (account type, margin regime, instruments, scale) or retail premium operators generally? This determines whether Q-R1/Q-R2 are calibrated to Reg-T or portfolio-margin mechanics and whether the Principal's own records are in scope as evidence.
2. **Is the small-account population in scope?** Q-R5 (trade-small vs. Freudberg) is the highest-consequence sizing disagreement in the corpora and has zero evidence — but if the Principal's capital base is well above that regime, it should be dropped from the wave, not merely deprioritized.
3. **Does the Principal's operation sell premium into earnings?** If yes, Q-R6 (the earnings gap-risk adjudication) jumps to the front of the wave; if no, it stays sequenced fourth.
4. **Are the Principal's own operating records admissible as research evidence?** Wheelwright journals, trade records, and decision logs would be the only sequential, funded-account, operator-specific data available to the program. Admitting them changes what Q-R1/Q-R3 can be built on; excluding them keeps the research strictly external. Either is defensible; the wave design depends on it.
5. **Compensation-vs-mispricing: confirm parked?** §12 recommends parking the adjudication until an operator decision attaches to it. If the Principal sees a decision it would change — e.g., a shelf-life judgment on a specific live program — name it and the branch reactivates in that bounded form.

No next empirical question will be executed before the Principal reviews this memo.