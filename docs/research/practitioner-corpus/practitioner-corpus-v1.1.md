# Practitioner Corpus v1.1

**Date:** September 23, 2026  
**Status:** REPAIRED RESEARCH REVISION — v1.1 — bounded post-review revision; research-only  
**Version:** 1.1  
**Lineage:** frozen `practitioner-corpus-v1.md` → frozen reconciliation v1.0 → rejected reconciliation-v1.1 review candidate → repaired corpus v1.1  
**Applies to:** `docs/research/practitioner-corpus/practitioner-corpus-v1.md` without mutating that frozen baseline  
**Authority:** Research evidence/synthesis only. No authority over Wheelwright domain semantics, policy, architecture, Product behavior, roadmap, or implementation.  
**Corpus integrity:** This revision does not rewrite Practitioner Corpus v1. Original corpus records remain the preserved practitioner-evidence baseline.

> This v1.1 artifact is the bounded repaired research revision produced after independent adversarial review. Frozen corpus v1, frozen reconciliation v1.0, and the rejected reconciliation-v1.1 candidate remain unchanged historical inputs. Where this document corrects an inherited statement, the correction controls only in v1.1; it does not rewrite history.


## 1. Why this overlay exists

Practitioner Corpus v1 deliberately retained contradictions, red flags, open questions, and a verification backlog rather than prematurely reconciling them. Subsequent research worked those records directly. The result is not a replacement corpus. It is an epistemic overlay that records:

- which apparent contradictions dissolve when missing dimensions are made explicit;
- which practitioner claims survive, fail, or require qualification under external checking;
- which open questions can be answered from the corpus and which expose source limitations;
- which verification-backlog items can close and which require further work;
- which distinctions should be preserved for later domain/semantic/Product reconciliation.

The governing separation remains:

```text
Practitioner Corpus v1
    → post-corpus reconciliation / verification overlay
        → later Wheelwright reconciliation
```

The overlay must not retroactively alter what the admitted practitioners actually said, demonstrated, calculated, or omitted.

---

# 2. Contradiction / tension dispositions

## CON-001 — Theta seller advantage vs 0DTE edge erosion

**Disposition:** `RESOLVED — DIFFERENT AXES`

The apparent contradiction dissolves by separating a pricing mechanic from economic compensation.

Theta decay is a pricing mechanic: remaining time value must decay toward zero as expiration approaches. That does not establish that the seller was adequately compensated for the price-path, gamma, gap, or tail exposure assumed when the option was sold.

The practitioner material's 0DTE crowding claim concerns compensation: crowding can compress implied volatility/premium relative to realized movement even while theta continues to operate mechanically.

**Reconciled principle:** theta can be a tailwind on the time axis without establishing positive expectancy or adequate entry compensation. Mechanical decay and exploitable selling edge are different claims.

**External-verification dependency:** the specific claim that 0DTE seller edge has eroded remains open as Verification Backlog item #10. This resolution does not depend on that empirical claim being true; it establishes only that the two propositions are not logically contradictory.

---

## CON-002 — Covered calls as routine yield vs opportunity-cost hazard

**Disposition:** `RESOLVED — CASH FLOW VS COUNTERFACTUAL ECONOMICS`

Collected premium is real cash flow. The opportunity-cost warning describes the other side of the same payoff transformation: the short call exchanges some upside participation for premium.

Below the relevant call-away/breakeven region, a covered-call path can outperform simple stock ownership; sufficiently above it, the short call truncates upside that the unencumbered stock would have retained.

**Reconciled principle:** covered-call premium is not “yield plus unchanged equity participation.” It is compensation received while surrendering some upside participation. Premium income and forgone upside are both decision-relevant economic consequences.

**Important boundary:** the channel's specific 20/50 moving-average filter for deciding when to withhold covered calls remains unverified (Verification Backlog item #9). The conceptual resolution does **not** validate that operational heuristic.

---

## CON-003 — Selling as statistical advantage vs explicit poor risk/reward

**Disposition:** `RESOLVED — FREQUENCY VS EXPECTANCY`

The apparent contradiction conflated outcome frequency with economic expectancy.

A high probability of a small gain can coexist with a low probability of a much larger loss. Win rate therefore does not establish edge.

**Reconciled principle:**

```text
win frequency ≠ edge

expectancy depends on both:
probability distribution × consequence distribution
```

Defined-risk structures can truncate tails and materially alter the consequence distribution, but structural truncation alone does not prove positive expectancy.

The “casino” analogy is therefore incomplete if it is read as “high win rate = house edge.” Probability must be considered with payoff magnitude and pricing.

---

## CON-004 — Exercise almost never vs expiration exercise opportunity

**Disposition:** `RESOLVED — LIFECYCLE-DEPENDENT APPLICATION OF ONE ECONOMIC RULE`

The two statements refer to different lifecycle states rather than conflicting exercise doctrines.

Early exercise generally destroys remaining extrinsic/time value that could instead be realized by selling the option. Near expiration, remaining time value can approach zero; after-close information can also change moneyness before the exercise decision window has fully closed. Dividend economics can create another exception when the economic value captured by exercise exceeds the remaining extrinsic value surrendered.

**Reconciled principle:** exercise is economically attractive only when the value captured by exercising exceeds the value surrendered by giving up the option. The relevant quantities change across lifecycle state.

The corpus's colorful “expiration Friday really means Saturday” framing is refined by the primary-source verification in Backlog item #12: OCC exercise-by-exception and contrary-instruction mechanics extend beyond the regular market close, while retail broker instruction cutoffs can be earlier and broker-specific.

---

## 2.1 Cross-contradiction finding

All four retained tensions produced useful distinctions rather than requiring one side simply to defeat the other:

| Tension | Distinction exposed |
|---|---|
| CON-001 | mechanical decay vs compensation / edge |
| CON-002 | premium cash flow vs total / counterfactual economics |
| CON-003 | outcome frequency vs expectancy |
| CON-004 | generic exercise heuristic vs lifecycle-state economics |

**Derived finding:** an apparent practitioner contradiction can be evidence of an omitted dimension. Reconciliation should ask what variable, state, relationship, boundary condition, or evidence distinction would allow both observations to be true before treating the claims as mutually exclusive.

---

# 3. Red-flag verification dispositions

The following dispositions preserve the external-verification work supplied during post-corpus research. Where exact external citations have not yet been durably attached to this overlay, the result is preserved as a research conclusion with its claimed evidence basis, not silently promoted into canonical options-domain authority.

## RED-001 — “~80% of options expire worthless”

**Disposition:** `RESOLVED — REFUTED AS STATED / REWORDED`

Reported CBOE/OCC figures used in the verification put unconditional outcomes at approximately:

- ~10% exercised;
- ~55–60% closed before expiration;
- ~30–35% expiring worthless.

The ~80% figure is defensible only under a narrower conditional denominator, such as contracts still open at expiration, and some index-option studies report similarly high expiration-worthless percentages for their specific population.

**Corrected formulation:** do not state that ~80% of all options expire worthless. Preserve the denominator/population explicitly.

**Additional qualification:** a leg expiring worthless does not establish trade profitability. Multi-leg positions, covered calls, and positions closed before expiration make “expired worthless” an especially poor proxy for trader P/L.

---

## RED-002 — Delta as probability

**Disposition:** `RESOLVED — PARTIALLY CONFIRMED / QUALIFIED`

Delta is a legitimate practitioner approximation for probability-like reasoning, but the theoretical Black-Scholes risk-neutral probability of expiring ITM is associated with (N(d_2)), not call delta (N(d_1)).

Because (d_1=d_2+sigmasqrt{T}), call delta is not exactly the same quantity as the risk-neutral ITM probability.

**Required qualifications:**

1. (N(d_2)), not delta, is the corresponding theoretical risk-neutral ITM probability under the model.
2. Risk-neutral probability is not the same thing as a physical/real-world forecast probability.

**Corrected formulation:** delta may be used as a ballpark practitioner heuristic; it must not be labeled the exact real-world probability of expiring ITM.

---

## RED-003 — Fixed DTE prescriptions

**Disposition:** `PARTIALLY DISPOSITIONED — RELATED 45/21 EVIDENCE DOES NOT VERIFY SOURCE PRESCRIPTIONS`

The sell-side 45-DTE entry / manage-around-21-DTE framework has substantial retail backtest literature, especially from Tastytrade-style research, but independent results contest unconditional profitability and expose the familiar high-win-rate / negative-skew problem.

The corpus's stronger buy-side prohibitions (“never buy” particular short durations) do not have comparable empirical support in the reviewed verification work.

**Corrected representation:**

- **sell-side 45/21 framework:** empirically studied retail heuristic; supported in some studies, contested in others; not universal truth;
- **absolute buy-side DTE prohibitions:** practitioner heuristic unless separately established.

**Transferability boundary:** much of the cited testing is SPX/SPY-centered; transfer to single names is not established by that evidence. More importantly, the corpus itself teaches seller durations such as ≤60 DTE / roughly 1–2 months and longer-duration buyer prescriptions. Evidence about 45/21 is related context, not verification of those different source prescriptions.

---

## RED-004 — IV > HV seller rule

**Disposition:** `RESOLVED — QUALIFIED EMPIRICAL REGULARITY`

The external review found substantial evidence for a positive variance-risk premium in index options: implied volatility has historically exceeded subsequent realized volatility on average in major index samples.

The review cited, among other evidence, Bollerslev, Tauchen & Zhou (2009) and later SPX/VIX sample summaries; it also identified important limits.

**Required qualifications:**

- strongest evidence is for index options rather than a universal single-name rule;
- single-name variance-risk premia are smaller/noisier and can reverse in stress;
- index variance-risk premium includes compensation for correlation/systematic tail exposure;
- result depends on measurement window and regime;
- existence of an average premium does not establish unconditional profitability for an arbitrary short-vol implementation;
- crowding can change compensation.

**Corrected formulation:** IV-over-realized-vol is a documented empirical regularity in important index populations, not a blanket instruction to sell every instance where IV exceeds a chosen HV measure.

---

## RED-005 — Return and probability claims

**Disposition:** `RESOLVED — RECLASSIFIED`

The corpus bundled quantities with different epistemic identities.

- **15.5% Wheel ROI:** a single-account / single-stock / single-period worked example, not a population backtest.
- **69.6% LEAPS figure:** a prospective worked premium/capital calculation for the proposed SanDisk LEAPS position, not a realized trade outcome or population evidence; the capital denominator remains a claim requiring its own validation.
- **86.42% spread win probability:** model-implied probability for a specific Chevron spread at a specific observation point, not an observed historical win rate.
- **10% premium stories:** anecdotal without an identified population/reference in the preserved material.

**Derived distinction:**

```text
realized example return
≠ backtested return
≠ model-implied probability
≠ historical frequency
≠ heuristic target
```

The figures can remain as source specimens when correctly labeled. They cannot support generalized performance claims.

---

## RED-006 — “Volatility is mean reverting”

**Disposition:** `RESOLVED — QUALIFIED EMPIRICAL REGULARITY`

The external review found strong empirical support for mean-reverting behavior in index volatility/VIX over longer horizons, while also finding that the mean, persistence, and shock half-life vary through time.

**Required qualifications:**

- mean reversion is not a precise timing signal;
- deviations can persist for long periods;
- the relevant mean is not fixed;
- expected mean reversion is incorporated into volatility term structure and therefore does not automatically create a free trading edge;
- evidence is strongest for VIX/SPX-style populations; single-name volatility is noisier.

**Corrected formulation:** volatility mean reversion is an empirical tendency with horizon/regime/instrument dependence, not a sufficient trading rule.

---

## 3.1 Red-flag epistemic findings

Verification exposed several distinctions that practitioner language can compress:

- conditioning/denominator semantics;
- approximation vs theoretical quantity;
- risk-neutral vs physical probability;
- empirical procedure vs practitioner prescription;
- instrument/population/regime transferability;
- realized example vs backtest vs model output vs historical frequency;
- empirical tendency vs actionable timing rule.

A red flag marked `RESOLVED` therefore means the verification question has a disposition. It does **not** mean every trading prescription built on the underlying fact has been validated.

---

# 4. Open-question dispositions

## Q-001 — How broadly representative are these practices beyond this channel?

**Disposition:** `RESOLVED — BOUNDED EXTERNAL VALIDITY`

The corpus is one educator ecosystem (Noah Davidson plus guests) and is unusually income/premium-selling focused.

Mechanical content such as standard Greeks definitions, exercise mechanics, settlement concepts, and basic construction mechanics is broadly aligned with standard options references. Strategy preferences, DTE prescriptions, Wheel emphasis, and premium-selling framing characterize a particular retail premium-selling school rather than the full profession.

**External-validity note:** practices are best treated as representative of a retail premium-selling school, not as representative of market-making, systematic-volatility, institutional buy-side, or all professional options practice.

---

## Q-002 — Which repeated heuristics survive independent empirical verification?

**Disposition:** `RESOLVED — MIXED EMPIRICAL SUPPORT`

Post-corpus verification supports, with qualifications:

- IV vs realized-volatility premium as an index-centered empirical regularity;
- delta as a probability-like heuristic, subject to the (N(d_2)) / risk-neutral correction;
- volatility mean reversion as a statistical tendency, not a timing edge;
- 45/21-style sell-side management as a heavily studied retail framework, but with contested unconditional performance.

Claims that did not survive as general statements include the unconditional “~80% expire worthless” statistic and generalized performance inference from single examples.

**Finding:** mechanics/volatility heuristics generally survived better than performance and frequency claims.

---

## Q-003 — How do practitioners aggregate Greeks and risk across an entire portfolio?

**Disposition:** `RESOLVED — NOT OBSERVED IN CORPUS / SOURCE LIMITATION`

Portfolio-level Greek/risk aggregation was not observed in the admitted corpus.

The corpus discusses Greeks and risk primarily at trade/position level, plus position sizing and affordable-loss ideas. It does not provide a practice for net portfolio delta/theta/vega, beta-weighting, portfolio stress testing, or correlated aggregate exposure.

**Boundary:** the consequence of that omission for correlated portfolios is analyst inference, not a corpus observation.

---

## Q-004 — How are taxes incorporated into trade/lifecycle decisions?

**Disposition:** `RESOLVED — NOT OBSERVED IN CORPUS / SOURCE LIMITATION`

Tax treatment was not observed in the admitted corpus. The distilled evidence does not address holding-period treatment, wash sales, Section 1256 treatment, assignment tax consequences, or after-tax strategy comparison.

**Finding:** reported corpus economics are gross/pre-tax examples and therefore cannot establish after-tax economic performance.

No generalized tax rule is promoted by this overlay.

---

## Q-005 — How are early-assignment probabilities managed around dividends for short options?

**Disposition:** `PARTIALLY RESOLVED`

**Corpus observation:** the long-option exercise material teaches a dividend/time-value decision rule.

**Corpus absence:** no explicit short-option ex-dividend screening rule, short-call roll rule around ex-dividend dates, or quantified early-assignment probability was observed.

**External/domain implication:** the corresponding short-call exposure can be analyzed through dividend versus remaining extrinsic-value economics, but that is not represented as an observed practitioner management rule in this corpus.

---

## Q-006 — How do transaction costs/slippage alter the claimed edges across strategy families?

**Disposition:** `RESOLVED — ACKNOWLEDGED, NOT MODELED`

The admitted corpus acknowledges liquidity and commissions and repeatedly treats liquidity as a critical filter. Explicit wide-bid/ask and slippage discussion located in excluded study 14 is not admissible evidence for this corpus.

It does **not** model slippage systematically by strategy family or incorporate full transaction friction into claimed edge/performance across the corpus.

**Finding:** transaction friction is recognized qualitatively but not sufficiently quantified to validate the economics of high-turnover or multi-leg strategies.

---

## Q-007 — Which management rules are precommitted versus improvised after entry?

**Disposition:** `RESOLVED — MIXED CONTROL MODEL`

The corpus contains both:

- **precommitted teaching/boundaries:** position sizing, some loss limits, entry DTE/premium filters, automated-close/alert examples, and explicit “plan for right and wrong before capital is at risk” pedagogy; bracket-order workflow from excluded study 13 is not admitted evidence;
- **adaptive/discretionary responses:** roll, hedge, reduce, take off half, exit early, and chart/market-contingent responses.

**Derived characterization:** the admitted teaching more often predeclares entry/risk boundaries while presenting management as a menu of contextual responses. “Pre-authorized response menu” is analyst shorthand, not evidence of formal authorization or measured trader behavior.

This distinction matters: a precommitted decision boundary or permitted response set is not the same thing as a precommitted deterministic action.

**Reproducibility boundary:** deterministic entry rules are more reproducible from the corpus than discretionary management. Management could be backtested if formalized, but the corpus often does not specify it sufficiently to do so.

---

## Q-008 — How often do presenters' stated rules differ from actual live-trade behavior?

**Disposition:** `RESOLVED — INSUFFICIENT OBSERVABILITY FOR BEHAVIORAL AUDIT`

Available specimens permit spot-checks but not a complete behavioral audit.

Admitted examples such as the KO Wheel sequence and Chevron spread are consistent with rules being taught. The SanDisk material describes a planned exit boundary, not an executed exit, and therefore cannot evidence adherence. No admitted distilled specimen establishes an on-camera rule violation, but recommendations and plans must not be promoted into observed behavior.

However, the corpus is curated pedagogy rather than a complete trade blotter. Selection bias prevents inference from “no observed violation” to systematic rule adherence.

**Evidence ceiling:** the corpus can establish what is taught, demonstrated, calculated, and omitted in the admitted material. It cannot establish population adherence rate, complete-book expectancy, omitted losing trades, or discretionary-override frequency without a complete underlying trade record.

---

# 5. Verification Backlog — reconciled

The original corpus listed twelve verification targets. Post-corpus work closes nine and leaves three genuinely open.

| # | Verification target | Current disposition | Next evidence operation |
|---|---|---|---|
| 1 | Option-expiry-worthless percentage | **CLOSED — RED-001** | None; preserve corrected denominator/population |
| 2 | Delta-as-probability approximation | **CLOSED — RED-002** | None; preserve (N(d_2)) and risk-neutral qualifications |
| 3 | Theta decay percentages by DTE | **CLOSED — THEORETICAL ATM BALLPARK CONFIRMED** | None; preserve ATM/time-value scope |
| 4 | IV/HV selling heuristic | **CLOSED — RED-004** | None; preserve instrument/window/regime scope |
| 5 | Volatility mean reversion | **CLOSED — RED-006** | None; preserve tradability caveat |
| 6 | Fixed buyer/seller DTE prescriptions | **PARTIALLY DISPOSITIONED — RED-003** | Verify the actual source prescriptions; 45/21 evidence is related but non-equivalent |
| 7 | Quoted win probabilities / EV examples | **PARTIALLY DISPOSITIONED — RED-005** | Explicitly test/classify WDAY EV arithmetic; intermediate outcomes are omitted by the presented max-win/max-loss shortcut |
| 8 | Performance / ROI claims | **CLOSED — RED-005** | Preserve as source examples, not backtests |
| 9 | 20/50 moving-average covered-call filter | **OPEN — EMPIRICAL TEST REQUIRED** | Backtest covered-call outcomes with/without gate, net of costs |
| 10 | 0DTE seller-edge erosion | **OPEN — CURRENT EMPIRICAL TEST REQUIRED** | Source current 0DTE literature/data; test IV-realized compensation/strategy economics over time |
| 11 | “Former leading industry groups regain leadership only 12%” | **OPEN — SOURCE TRACE FIRST** | Identify original study/universe/definition/lookback; downgrade if unattributable |
| 12 | Assignment/exercise timing and broker cutoffs | **CLOSED — PRIMARY-SOURCE MECHANICS CONFIRMED** | Preserve broker-specific cutoff caveat |

## 5.1 Backlog item #3 — Theta decay percentages by DTE

**Disposition:** `CLOSED — CONFIRMED AS THEORETICAL ATM BALLPARK`

The reviewed corpus percentages were approximately:

- 0.4%/day around four months;
- 0.6% around three months;
- 1.1% around 60 DTE;
- 1.6% around 30 DTE.

Post-corpus theoretical checking found these broadly consistent with the square-root-of-time behavior of ATM option time value under simplifying Black-Scholes assumptions. A rough ATM approximation implies fractional daily time-value decay on the order of (1/(2cdot DTE)), producing the same accelerating shape and ballpark magnitude.

**Required caveat:** these are illustrative percentages of ATM time value under simplifying assumptions, not universal percentages of total option premium. Moneyness, volatility, rates/dividends, discrete passage of time, and model assumptions matter.

---

## 5.2 Backlog item #9 — 20/50 moving-average covered-call filter

**Disposition:** `OPEN — MEDIUM PRIORITY EMPIRICAL TEST`

The corpus presents the 20/50 moving-average filter as a way to avoid selling calls into emerging strength. No supporting study was identified in the post-corpus review.

**Required test:** compare covered-call economics on a sufficiently broad and defined universe with and without the 20/50 gate, using explicit entry/exit/roll rules and transaction costs.

**Important dependency:** CON-002's conceptual resolution does not depend on this filter. The filter remains a practitioner-specific hypothesis.

---

## 5.3 Backlog item #10 — 0DTE seller-edge erosion

**Disposition:** `OPEN — HIGH PRIORITY / TIME-SENSITIVE EMPIRICAL TEST`

The growth in 0DTE participation/volume is externally observable. The stronger claim—that crowding compressed the compensation available to a naive short-volatility seller—requires direct empirical testing.

**Required test:** evaluate time-series changes in implied-versus-realized compensation and appropriately specified short-vol strategy economics, including transaction costs and tail behavior. Current academic/market literature should be source-traced before designing the test.

**Relationship to CON-001:** CON-001 is resolved logically whether or not this empirical claim ultimately survives. The open question is whether the claimed edge erosion actually occurred, not whether theta decay exists.

---

## 5.4 Backlog item #11 — “Former leading industry groups regain leadership only 12%”

**Disposition:** `OPEN — SOURCE TRACE REQUIRED BEFORE EMPIRICAL TEST`

The statistic lacks sufficient provenance in the corpus to define the population, “leadership,” lookback window, or study methodology.

**Next operation:** attempt to identify the original study. If no attributable source can be found, preserve it as an unattributed presenter statistic rather than leaving it indefinitely in a verification queue that implies it is presently testable.

---

## 5.5 Backlog item #12 — Assignment/exercise timing and broker cutoff mechanics

**Disposition:** `CLOSED — PRIMARY-SOURCE MECHANICS CONFIRMED WITH OPERATIONAL CAVEAT`

Post-corpus checking against OCC mechanics confirmed Exercise-by-Exception around expiration and the existence of a post-market-close exercise/contrary-instruction window. The reviewed rule included automatic exercise for sufficiently ITM contracts and a holder instruction deadline later than the regular market close.

**Operational caveat:** brokers may impose earlier customer instruction cutoffs. Practical operator deadlines are therefore broker-specific even when OCC mechanics define a later clearing-level boundary.

**Corpus implication:** the underlying lifecycle point survives: the regular-session closing print is not always the final determinant of exercise/assignment consequence.

---

# 6. Backlog triage

**Fully dispositioned:** 7 of 12 — #1–#5, #8, #12.  
**Partially dispositioned:** 2 of 12 — #6, #7.  
**Open:** 3 of 12 — #9, #10, #11.

The remaining items have different evidence operations:

1. **#10 — high priority:** current empirical/time-series research and likely backtest;
2. **#9 — medium priority:** controlled backtest of the practitioner-specific 20/50 filter;
3. **#11 — provenance first:** source trace before deciding whether empirical testing is meaningful.

**Cross-backlog finding:** epistemic risk is increasingly concentrated in presenter-specific prescriptions and performance/edge claims rather than textbook option mechanics. This is a finding about this corpus and verification pass, not a universal claim about practitioner education.

---

# 7. Consolidated epistemic findings

The post-corpus work supports a more differentiated evidence map.

## 7.1 Established mechanics / theory

Standard option mechanics and theoretical relationships generally survived checking, usually with precision added. Examples include exercise/expiration mechanics, the distinction between (N(d_1)) and (N(d_2)), and the accelerating shape of ATM time-value decay.

## 7.2 Empirical regularities

Some practitioner claims correspond to well-documented empirical tendencies, but only with population and regime boundaries attached. Variance-risk premium and volatility mean reversion belong here.

## 7.3 Practitioner heuristics / prescriptions

DTE rules, moving-average gates, management menus, and similar prescriptions require separate empirical support. Recurrence or pedagogical confidence does not establish effectiveness.

## 7.4 Examples / model outputs

Single-trade returns, worked ROI examples, and model-implied probabilities are useful specimens but must not be mislabeled as historical frequencies or population performance.

## 7.5 Source omissions

Portfolio-level aggregation, taxes, systematic short-option ex-dividend management, transaction-cost modeling, and complete behavioral adherence are absent or materially under-observed in this corpus. Absence is a source limitation, not evidence that the concerns are unimportant in practice.

---

# 8. Relationships discovered across the reconciliation

Several original records now reinforce one another:

- **RED-004 ↔ CON-001:** an average variance-risk premium can coexist with regime/crowding-dependent compression of seller compensation.
- **RED-001 ↔ CON-003:** a high frequency of worthless expirations—however measured—does not establish positive expectancy.
- **RED-002 ↔ CON-003:** a probability-like quantity is not an economic-quality score.
- **RED-006 ↔ CON-001:** a mechanical/statistical tendency does not itself establish a tradable edge.
- **Q-007 ↔ management/lifecycle findings:** “plan before entry” can coexist with discretionary management when what is precommitted is a boundary or response set rather than a deterministic action.
- **Q-008 ↔ evidence ceiling:** curated examples can demonstrate pedagogy and specimens without establishing population adherence or realized strategy expectancy.
- **Backlog #9 ↔ CON-002:** the covered-call opportunity-cost reconciliation survives while the specific 20/50 operational prescription remains unverified.

---

# 9. Research-state conclusion

The original corpus deliberately retained unresolved pressure. Post-corpus reconciliation has now materially reduced that uncertainty without rewriting the evidence baseline:

- **4/4 contradictions** have dispositions;
- **6/6 red flags** have verification/reclassification dispositions;
- **8/8 open questions** have bounded answers or explicit source-limit dispositions;
- **9/12 verification-backlog items** can close;
- **3/12 verification-backlog items** remain genuinely open.

The result is not “Practitioner Corpus v1 is now universally true.” The result is a more precise research object:

> practitioner observations + explicit reconciliation + external-verification status + evidence ceilings + remaining uncertainty.

That object is substantially better prepared for later Wheelwright domain, semantic, Product, policy, architecture, and implementation falsification because practitioner recurrence, mechanics, empirical regularities, heuristics, model outputs, anecdotes, omissions, and analyst inference are no longer collapsed into one epistemic class.

---

# 10. Remaining research boundary

The next research work, if deliberately resumed under `PL-RESEARCH-05`, is bounded:

- source and test the 0DTE seller-edge-erosion claim;
- test the 20/50 covered-call filter if the research value justifies a backtest;
- source-trace the “12% leadership regain” statistic before any empirical evaluation;
- attach durable primary/external citations for post-corpus verification claims where those sources are intended to support later domain promotion;
- preserve Practitioner Corpus v1 itself as the original evidence-preserving baseline.

No finding in this overlay directly authorizes a Wheelwright Product feature, semantic change, domain promotion, trading policy, architecture change, roadmap commitment, or implementation.

---

# 11. Revision 1.1 — Independent corpus-review findings

A subsequent independent review of frozen Practitioner Corpus v1 broadly corroborated the corpus architecture and the decision to preserve post-freeze verification in a separate overlay rather than editing v1. The review also identified several incremental limitations and methodological refinements worth preserving before downstream Wheelwright reconciliation.

## 11.1 Admission-created topic coverage holes

The exclusion of studies 13–24 for insufficient source fidelity did more than reduce evidence volume. Those excluded studies disproportionately covered topics including strangles, straddles, iron condors, bear call spreads, Wheel stock screening, position sizing, and journaling.

**Finding:** admission/exclusion can create topic-specific coverage holes. The admitted v1 evidence therefore should not be read as uniformly representative across the strategy families discussed in the upstream source set.

In particular, neutral / volatility-premium multi-leg structures are less directly represented in the admitted evidence than the corpus's broad language about selling structures might suggest.

This does not invalidate PAT-003 or PAT-005. It bounds their evidentiary breadth and should be considered whenever those patterns are used downstream.

## 11.2 Population qualifier for synthesis language

The review independently reinforced Q-001's external-validity boundary.

**Interpretive scope:** where frozen v1 uses generic synthesis language such as “the practitioner,” downstream readers should interpret it as shorthand for **the retail premium-selling practitioner represented by this corpus**, not as a claim about all options practitioners.

The admitted source population does not establish representative practice for market makers, institutional buy-side options users, systematic-volatility practitioners, or the profession generally.

Frozen v1 remains unchanged; this qualifier belongs in the overlay.

## 11.3 Verification-method refinement

The review identified a useful distinction within the original `VERIFY_LATER` class.

Some claims can be resolved primarily through authoritative reference or mathematical/theoretical derivation—for example contractual settlement specifications or put-call-parity relationships. Other claims require empirical evidence such as historical observations, backtests, or population studies.

For future corpus methodology, preserve the conceptual distinction:

- **VERIFY_BY_REFERENCE** — mechanics, contractual specifications, mathematical/theoretical relationships, or other claims resolvable against authoritative reference/derivation;
- **VERIFY_BY_EVIDENCE** — empirical frequencies, performance, edge, behavioral prevalence, strategy effectiveness, and similar claims requiring observational evidence.

This is a **methodological refinement for future work**, not a retroactive mutation of the frozen v1 charter or its original verification tags.

The review specifically identified OBS-023 (CSP / covered-call synthetic-equivalence pressure) and OBS-046 (SPX vs SPY settlement distinctions) as examples where reference-based verification is more appropriate than open-ended empirical verification.

## 11.4 Additional relationship pressure

The review noted that frozen v1 cross-links PAT-010 to CON-002 but does not provide comparable inbound pattern pointers for all other contradictions.

Two relationships are worth preserving without editing v1:

- **CON-001 ↔ PAT-005:** theta/volatility mechanics and the claim of seller advantage must remain distinct; the contradiction resolution supplies a boundary on broad volatility-selling interpretation.
- **CON-003 ↔ PAT-003:** probability-oriented selling/construction patterns must not be read as establishing positive expectancy; the contradiction resolution supplies the missing frequency-vs-expectancy boundary.

These are overlay relationships, not corrections to frozen corpus evidence.

## 11.5 Source limitations are not automatic Product blockers

The review correctly emphasized portfolio-level Greek aggregation and taxes as important missing dimensions. The overlay preserves those absences under Q-003 and Q-004.

However, the stronger proposition that either omission is automatically **blocking** for downstream position-management design is **not established by the corpus**. Whether a missing domain dimension blocks a particular Wheelwright capability is a downstream Product/domain/semantic decision and must not be promoted directly from corpus review.

## 11.6 Review-state correction

The independent review was performed against frozen v1 and therefore correctly observed that v1 itself still shows unresolved contradictions, verification flags, open questions, and the original backlog.

That is intentional after creation of this overlay, not a defect requiring v1 mutation.

The review's backlog arithmetic reflected an earlier research snapshot. Current durable overlay state remains:

- **9 of 12 closed**;
- **3 of 12 open**: #9, #10, #11.

## 11.7 Revision 1.1 synthesis

The independent review adds three especially useful findings to the post-corpus research state:

1. **Admission can create topic-specific coverage holes, not merely reduce sample size.**
2. **Reference-verifiable claims and empirically-verifiable claims should use different verification methods.**
3. **The synthesis population must be explicitly bounded to the retail premium-selling practitioner school represented by the admitted corpus.**

It also independently corroborates the central preservation decision: **freeze Practitioner Corpus v1 and place subsequent verification/reconciliation in a versioned overlay rather than silently editing the evidence baseline.**

No Revision 1.1 finding creates Wheelwright Product, semantic, domain, policy, architecture, roadmap, or implementation authority.


---

# 12. Bounded repair after independent adversarial review

This section records the controlling repair findings that distinguish corpus v1.1 from the rejected reconciliation-v1.1 candidate.

## 12.1 Evidence population and behavior ceiling

The evidentiary population is **the admitted Cashflow Academy teaching and demonstration evidence represented by this corpus, as mediated through Muse's transcript-derived distillation**. It is not a representative sample of all options practitioners, all retail premium sellers, or even a longitudinal behavioral record of Cashflow Academy traders.

Teaching recurrence, recommendation recurrence, calculation recurrence, and demonstrated/observed practice are different evidence acts. Recommendation-heavy records cannot establish behavioral prevalence. The integrated decision framework is an analytical reconstruction from admitted evidence, not an observed longitudinal workflow followed by a representative trader population.

## 12.2 Admission-created coverage holes

Exclusion of studies 13–24 creates non-uniform coverage. Detailed evidence is thinned or lost for broker execution/conditional-order workflows, strangle/straddle selection and management, iron-condor detail, small-account constraints and losing-Wheel management, operational journaling/cumulative capital-recovery accounting, a claimed longitudinal credit-spread test/system rules, and beginner debit-spread selection/execution.

Admitted overview evidence means some of these topics are **thinly covered rather than wholly absent**. Screening, sizing, and bear-call management also retain admitted support elsewhere.

## 12.3 Within-corpus long-duration exception

PAT-005 / JOB-012 / REL-002 require an explicit exception: admitted study 5 advocates selling approximately 540-DTE LEAPS. Therefore shorter-duration selling is a recurrent teaching pattern in parts of the corpus, not a universal rule even within this source school.

## 12.4 Frozen-v1 provenance qualifications

Independent audit found pre-existing traceability limitations in frozen v1. PAT-001, PAT-002, PAT-007, and PAT-008 source sets do not exactly match the sources reachable through their supporting OBS records. PAT-002 through PAT-012 also omit the explicit derivation-status field required by the charter.

These are disclosed limitations. Frozen v1 is not edited.

## 12.5 Verification methods

Future verification should select one or more methods per decomposed claim:

- **AUTHORITY / REFERENCE LOOKUP** — contractual, broker, exchange, regulatory, or other authoritative specifications;
- **MATHEMATICAL / THEORETICAL DERIVATION** — relationships established under explicit assumptions;
- **EMPIRICAL TESTING** — frequencies, performance, edge, behavioral prevalence, and historical regularities;
- **SOURCE / PROVENANCE TRACING** — locating the origin, denominator, universe, definition, or study behind a quoted claim.

These methods are not mutually exclusive. Mixed claims should be decomposed rather than forced into one verification class.

## 12.6 Theory and lifecycle bounds

- Theta/time-value convergence does not imply monotonic observed decay or universal seller advantage; model statements require their held-constant assumptions.
- Covered-call premium and forgone upside are both consequences, but comparisons require explicit holding/terminal assumptions and applicable costs.
- Exercise economics require executable alternatives and applicable liquidity, financing/capacity, exercise style, settlement, deadlines, dividends/extrinsic value, and broker constraints.
- The literal phrase “Friday really means Saturday” is retired as a rule. The surviving lifecycle point is that regular-session close need not be the final determinant of exercise/assignment consequence, while customer/broker deadlines can be earlier than clearing-level deadlines.

## 12.7 WDAY expected-value claim

The admitted WDAY example multiplies a stated ~40% win probability by maximum spread profit and ~60% by maximum loss. That shortcut does **not** establish expected value for a spread whose realized outcomes can occur between maximum profit and maximum loss. Backlog #7 is therefore only partially dispositioned until the probability distribution/outcome assumptions are explicitly specified or the claim is reclassified as presenter arithmetic rather than validated expectancy.

## 12.8 External-verification reproducibility ceiling

Where exact durable external source locators are not preserved in the repository, this artifact records **reported post-corpus verification conclusions**, not independently repository-auditable verification. “Resolved” or “dispositioned” identifies research state; it does not itself mean empirically validated.

## 12.9 Resulting backlog state

The repaired state is:

- **7 fully dispositioned:** #1–#5, #8, #12;
- **2 partially dispositioned:** #6, #7;
- **3 open:** #9, #10, #11.

No work in this repair resolves #9, #10, or #11.

## 12.10 Authority boundary

Corpus v1.1 remains research evidence/synthesis only. It creates no Wheelwright Product, semantic, domain, policy, architecture, roadmap, implementation, or execution authority. Broad Wheelwright reconciliation remains a separate future governed step.
