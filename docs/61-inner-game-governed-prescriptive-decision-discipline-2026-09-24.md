# Inner Game / Governed Prescriptive Decision Discipline — Thread Capture and Intake Reconciliation — 2026-09-24

**Status:** Category E discovery/reconciliation artifact under `PL-DEC-BEH`; preserves Principal-directed problem-space findings from the 2026-09-24 Inner Game discussion at maximum useful resolution. Not ratified architecture, policy, implementation authority, or recommendation-policy change.

**Primary intake home:** `PL-DEC-BEH` — Behavioral Decision Discipline / Accountable HITL

**Strongly related:** `PL-SEM-01`; `PL-DEPLOY`; `PL-STRAT-01`; `PL-PORT-01`; `PL-POL-01`; `PL-UX-01`; `PL-EXEC-01`; `LVT-BET-WAIT`; `LVT-BET-LIFECYCLE-CHOICES`; `LVT-BET-RISK-PROFILES`; `LVT-BET-LIFECYCLE-POLICY`; `LVT-BET-EXPLANATION`; `LVT-BET-ACCEPTABILITY`; `LVT-BET-LIFECYCLE-OUTCOME`; `LVT-BET-OUTCOME-LEARNING`.

**Semantic references:** `docs/58-wheelwright-semantic-model-v1.md`; `docs/59-practitioner-strategy-semantic-falsification-2026-09-24.md`; `docs/60-scenario-market-thesis-adversarial-specimens-2026-09-24.md`.

**Practitioner basis:** `docs/research/practitioner-corpus/`, especially `the-edge-and-the-hourglass-final-reader-v1.md`, `practitioner-corpus-v1.md`, and reconciliation v1.1.

---

## 1. Why this artifact exists

The Principal explicitly directed that the findings from the 2026-09-24 Inner Game discussion be moved out of conversational memory as quickly as possible and at high resolution. The discussion began with trading psychology and process discipline in *The Edge and the Hourglass*, then exposed a broader Wheelwright Product problem:

> Wheelwright currently disciplines the opportunity better than it disciplines the operator's ongoing process.

The concern is not merely education, journaling, warnings, or UI. It is whether Wheelwright can carry enough durable governed context and routine decision reasoning that the accountable human does not repeatedly reconstruct the process under market pressure.

The Product goal discovered in the thread is:

> **Make the disciplined, process-consistent action the path of least cognitive resistance while preserving final operator authority.**

A companion formulation is:

> **Wheelwright should do enough routine reasoning that the HITL primarily exercises authority, not reconstructs the process.**

And the governing boundary remains:

> **Wheelwright determines what the governed process says should happen. The operator determines whether it actually happens.**

This is an Accountable-HITL concern, not an autonomous-trading direction.

---

## 2. Practitioner-corpus Inner Game findings

### 2.1 Psychology is structural

The reader's Chapter 12 states that psychology is structural rather than an afterthought. Its process sequence is:

1. educate yourself;
2. paper trade;
3. write the plan;
4. size the position;
5. journal the decision;
6. review the result.

The important Product implication is that discipline is not expected to emerge from willpower at the instant of a stressful trade. Process should be established before pressure arrives.

The reader's stronger systems claim is:

> A system that demands heroic discipline is probably a poor system for the person who must operate it.

The corresponding design direction is not to make the operator superhuman. It is to design a process a normal human can run under stress.

Candidate mechanisms named in the practitioner material include:

- predefined size limits;
- no-trade criteria;
- written invalidation points;
- cooling-off rules;
- simpler constructions where complexity adds no value.

These are practitioner propositions to challenge and classify, not automatically ratified Wheelwright policy.

### 2.2 Journaling is decision evidence, not a diary

The reader frames the journal as a record of contemporaneous decisions, including:

- What did I believe?
- What did I think the market was pricing?
- Why this construction?
- Why this size?
- What would make me wrong?
- What was the intended exit?
- What actually happened?

The critical hindsight observation is:

> Memory edits the evidence.

A winning trade is easily remembered as obviously brilliant; a losing trade as obviously unlucky. The journal is therefore a lab notebook for uncertainty.

Wheelwright already has, or plans to have, much of the factual substrate that a conventional journal asks a human to recreate manually. This creates a Product opportunity to derive a durable decision record from system state rather than forcing duplicate human bookkeeping.

Candidate decision-record shape:

```text
state
→ governed purpose/context
→ Alternatives
→ Recommendation
→ rationale
→ operator selection/decision
→ execution
→ lifecycle
→ reconciled outcome
```

The human should be asked to supply only judgment Wheelwright genuinely cannot know, such as a newly changed objective, a discretionary reason for departure, or an external fact not yet represented.

### 2.3 Pathologies explicitly surfaced

The practitioner corpus names or strongly supports the following behavioral failure modes:

- FOMO;
- revenge trading;
- boredom/activity trading;
- taking rare large winners too early because realizing a gain feels good;
- holding a small loser because realizing the loss feels like failure;
- loss aversion;
- reference-point effects;
- hindsight reconstruction;
- anchoring;
- sunk-cost behavior;
- state-dependent risk taking.

The thread added system-specific candidate pathologies:

- objective drift after a position becomes uncomfortable;
- changing mandate/policy/stance to rationalize a desired action;
- premium optimization that forgets total economics;
- treating the best available trade as good enough even when the board is bad;
- repeated operator reconsideration caused by salience rather than changed evidence;
- unnecessary intervention in a position already progressing according to plan;
- confusing a legitimate plan change with abandonment of the plan.

Wheelwright must not claim to diagnose an operator's mental state merely from behavior. For example, it may observe a departure from prior policy after a loss, but should not assert "revenge trading" without a legitimate basis. The useful Product question is what semantic/process mechanism makes the departure observable or makes the disciplined path easier.

### 2.4 Patience and inactivity are genuine decisions

The reader states that "do nothing" is a legitimate market action. Qualification earns its keep when it can say no:

- no edge;
- no adequate premium;
- no clean thesis;
- no acceptable liquidity;
- no fitting size;
- no reason to own the resulting state.

"Idle capital is not failed capital." Capital deployed badly is unavailable when a better trade arrives. Patience is inventory management.

The thread generalized this beyond entry:

- WAIT;
- HOLD;
- LET RESOLVE / natural resolution;
- NO TRADE

may all be legitimate governed paths, but should not be collapsed into one vague inactivity label if their semantics differ.

A Product that always makes a transaction feel like progress can manufacture activity bias.

### 2.5 Losses and sizing

The reader treats losses as operating expenses only within limits. A loss inside an expected, budgeted, reviewed operating envelope differs from a recurring loss pattern indicating a broken process.

Chapter 11 emphasizes that a reasonable trade can become an unreasonable portfolio decision when sized badly. The important consequence is not merely monetary loss; it is losing enough that future decisions become distorted.

A trade that threatens survival of the process is too large regardless of attractive expected value.

This strengthens `PL-DEC-BEH`'s existing "Mechanics over Impulse" framing and the roadmap's upstream governed-risk-profile direction.

---

## 3. GDXJ as the principal falsifier

### 3.1 What happened

A real GDXJ covered-call discussion exposed the core problem.

The mechanical state was available:

- shares were already owned;
- a short call was open;
- expiration was imminent;
- the call was out of the money at one point in the discussion;
- assignment/expiration paths were understood.

The initial AI reasoning nevertheless made an unstated assumption about what the operator wanted the position to accomplish.

The Principal then supplied the missing purpose:

> recover cost basis through premium and ultimately get the shares called away.

The management reasoning changed.

The Principal then imposed a further governing context:

> by-the-book Wheel.

The prescription narrowed again.

### 3.2 What this proves

The same mechanical construction does not imply one correct prescription.

Market state and option mechanics are insufficient. The missing input was normative/governing context.

The sequence demonstrates three different layers:

1. **Mechanical facts** — what exists and what can happen.
2. **Governed purpose/context** — what this capital/inventory/program is supposed to accomplish and which outcomes are desired or acceptable.
3. **Recommendation** — which governed Alternative survives under current state/evidence.

A conventional label such as "covered call" cannot establish the missing normative facts.

### 3.3 The process-consistent GDXJ path

Once the governed context was known, the immediate by-the-book reasoning became simple:

- existing call is consistent with the disposition/call-away objective;
- no intervention is required merely because expiration is near;
- allow the contract to resolve unless a governed reconsideration condition occurs.

Two ordinary lifecycle branches:

**Expires OTM**
- retain premium;
- retain shares;
- shares become unencumbered;
- evaluate the next governed covered-call action under applicable policy.

**Assigned / called away**
- shares are disposed at the strike;
- lifecycle is reconciled;
- economics are reconciled;
- proceeds return to the relevant capital state/pool;
- the operating program continues according to policy.

The key Inner Game observation is:

> **Patience was the process.**

The operator did not need more creativity. The operator needed confidence that doing nothing was the process-consistent action.

### 3.4 Desired future interaction shape — specimen, not design commitment

A useful conceptual interaction would be something like:

```text
GDXJ — LET RESOLVE / WAIT

Current lifecycle state:
Covered call approaching expiration

Governed purpose:
Income / Wheel; call-away desired

Prescribed action:
No intervention

Why:
The existing call remains consistent with the governed objective and policy.

If assigned:
Reconcile call-away, close/advance lifecycle, return proceeds to relevant capital state.

If expired OTM:
Shares become unencumbered; evaluate next covered call under policy.

Reconsider only if:
A material evidence, economic, governance, or lifecycle condition changes.
```

This is not a UI specification. It is a specimen showing how much routine cognitive reconstruction Wheelwright could potentially absorb.

---

## 4. The Account / mandate specimen: PTS and Sawdust

The Principal supplied a concrete multi-account example:

- **PTS** — Portfolio Mandate: **Income**
- **Sawdust Roth IRA** — Portfolio Mandate: **Growth / Compounding**

Vocabulary correction from the current semantic draft:

- PTS and Sawdust are **Accounts**.
- Income and Growth/Compounding are candidate **Portfolio Mandates** / purpose-side semantics.
- They should not casually be called "strategies."
- They should not casually be called Account Regimes. Account Regime is a semantic/accounting/execution context and is not synonymous with investment purpose.
- Wheel is an **Operating Program**.
- Covered call is an **Economic Construction**.
- Call-away desired/retention preferred are **Outcome Stances**.
- "I think GDXJ will rise" is a **Scenario / Market Thesis Assertion**, not purpose or Outcome Stance.

The same ITM covered call near expiration can therefore mean materially different things:

**PTS / Income / Wheel / call-away desired**
- assignment may be progress toward the intended outcome;
- natural resolution may be process-consistent;
- the position may require no attention merely because assignment is likely.

**Sawdust / Growth-Compounding / strategic retention / retention preferred**
- impending assignment may be contrary to the governed purpose;
- attention may be warranted;
- the Alternative set and comparison may differ.

The evidence can be identical while normative context changes the meaning.

This supports semantic presentation that communicates relationship to mandate/process rather than simply "good/bad" price movement.

---

## 5. Locked decision-journey semantic spine

The thread intentionally selected a smaller working spine rather than replacing the full semantic model. This table is preserved as a standing exploration artifact.

| Ontology concept | Role in the journey | Concrete GDXJ example | Examples |
|---|---|---|---|
| **Account** | Where the governed activity occurs | PTS brokerage account | PTS; Sawdust Roth IRA; another independently governed brokerage account |
| **Portfolio Mandate** | What this capital is fundamentally for | **Income** | Income; Growth/Compounding; Acquisition; Disposition; Protection/Hedging — latter three still require pressure-testing for exact scope/placement |
| **Inventory Block** | Which governed quantity is involved | governed GDXJ share quantity supporting call | Strategic SPY shares; disposable SPY shares; shares allocated to overwrite; shares allocated to Wheel cycle |
| **Inventory Role** | What inventory is supposed to contribute under mandate | inventory used to produce income / progress toward disposition | Income-producing inventory; strategic long-term holding; acquisition target/result; disposition inventory; protected inventory; supporting/collateral inventory |
| **Operating Program** | Durable process being followed, if any | **Wheel** | Wheel is strongest established example; systematic overwrite is a plausible second specimen; other recurring processes require testing before promotion |
| **Economic Construction** | What economic structure currently exists | shares + short call = **covered call** | Covered call; CSP; protective put; collar; long call/put; vertical; iron condor; straddle; strangle; calendar; PMCC/diagonal; butterfly/BWB/HBWB |
| **Decision Subject** | Exactly what the current decision is about | GDXJ inventory/short-call relationship evaluated now | Covered-call construction; CSP obligation + collateral; complete spread; inventory exposed to assignment; governed subset of a larger position |
| **Outcome Stance** | Which specified outcomes are desired, acceptable, disfavored, or prohibited | **Call-away desired** | Assignment desired; permitted but disfavored; prohibited; retention preferred; call-away desired; acquisition through assignment desired; upside cap acceptable |
| **Policy Rule** | Governed rules determining how decisions should be made | applicable **by-the-book Wheel management rules** | Entry qualification; DTE/delta rules; sizing; profit-taking; expiration management; roll criteria; assignment management; liquidity/execution rules; no-trade rules |
| **Constraint** | Boundary an Alternative may not violate | capital, capability, risk, inventory boundaries | Capital/buying-power limit; risk limit; assignment prohibition; unavailable inventory; existing encumbrance; account capability; liquidity floor; unsupported construction |
| **Preference** | Ordering among otherwise admissible Alternatives/outcomes | prefer governed Wheel path over unnecessary intervention | Retention preferred to disposition; defined risk preferred; assignment preferred at acceptable acquisition price; better execution preferred; simpler construction preferred when economically equivalent |
| **Reconciled State / Evidence** | What WW currently accepts as true | shares owned; call open; strike/expiry; underlying price; quote; Greeks; contract state | Holdings; obligations; cash/collateral; encumbrances; prices; chains; Greeks; DTE; moneyness; fills; working orders; broker lifecycle evidence |
| **Alternatives** | Governed paths available for evaluation | **HOLD / let resolve; CLOSE; ROLL** | HOLD; WAIT; natural resolution; OPEN; CLOSE; ROLL; replace; write call; sell put; establish hedge; modify multi-leg construction, depending on Decision Subject |
| **Recommendation** | What WW determines governed process prescribes | **Allow natural resolution rather than manufacture activity** | HOLD; WAIT; LET RESOLVE; CLOSE; ROLL; OPEN qualified construction; choose governed Alternative; unresolved when context/evidence insufficient |
| **Action** | What operator actually chooses to do | accept WAIT/let-resolve — or consciously choose another path | Do nothing; open; close; roll; cancel; replace; accept recommendation; deliberately depart |
| **Execution** | What actually happens in broker/market after actionable choice | no execution while waiting; actual fill if close/roll | Full fill; partial fill; multi-leg fill; no fill; canceled order; replacement execution |
| **Reconciled Outcome** | What WW ultimately accepts happened after evidence/reconciliation | call expires/shares remain; shares called away; position closed/rolled | Expiration; assignment; exercise; successful close; residual inventory; acquired shares; disposed shares; multi-leg resolution |

Working groupings:

**Governed purpose/context**
- Portfolio Mandate
- Inventory Role
- Operating Program
- Outcome Stance
- Policy Rule
- Constraint
- Preference

**Decision subject/world**
- Account
- Inventory Block
- Economic Construction
- Decision Subject
- Reconciled State/Evidence

**Decision**
- Alternatives
- Recommendation

**Human authority/reality**
- Action
- Execution
- Reconciled Outcome

Cautions:

- `Reconciled State / Evidence` is deliberately compressed in this working table; the canonical semantic draft separates state from evidence.
- Outcome Stance / Intent Assertion naming remains provisional in `PL-SEM-01`.
- The row `Action` compresses operator selection and Action; the canonical semantic model currently distinguishes them. This is a possible load-bearing omission to revisit rather than silently repair.
- Scenario / Market Thesis Assertion is not in the 17-row spine even though the semantic model treats it as an optional decision input. It should not be silently inserted; its omission should be tested.
- This spine is a problem-space tool, not ratified architecture.

---

## 6. Governed purpose/context is the critical left-hand leg

The thread's central reasoning shape is:

> **governed purpose/context + Decision Subject + authoritative state/evidence → governed Alternatives → Recommendation**

The governed-purpose/context leg requires deliberate exploration. "Wheel" is not itself the purpose. It is an Operating Program.

Potential purpose-side examples include:

- Income;
- Growth/Compounding;
- Acquisition;
- Disposition;
- Protection/Hedging.

These examples must be pressure-tested against the semantic model rather than assumed to all occupy the same type/scope.

The problem-space questions include:

- At what scope does purpose live: Account, Capital Pool, Inventory Block, Operating Program, Decision Subject, or some combination?
- Which context inherits from Account/Portfolio Mandate?
- Which context may differ for a particular Inventory Block?
- Which assertions are durable versus decision-specific?
- Which may be derived?
- Which must never be inferred?
- Who/what may authoritatively assert them?
- What is their effective interval?
- How are conflicts, corrections, supersession, and revocation represented?
- What happens when governed context is absent?
- What happens when it is internally conflicting?
- What downstream behavior may each kind of context legitimately affect?

The GDXJ failure demonstrates a key invariant candidate:

> **Missing normative context must not be silently replaced with assumed intent.**

But the safe response cannot simply become a questionnaire before every decision. Durable/reusable context should eliminate repeated cognitive load.

Standing test:

> **Every time Wheelwright asks the operator a question, ask whether the human is supplying genuinely new judgment or merely reconstructing something the system should already know.**

The latter is **cognitive-load debt**.

---

## 7. Governance authority occurs at two levels

The thread identified two different human-authority moments.

### 7.1 Governance authority

The operator establishes or changes durable context such as:

- Portfolio Mandate;
- Inventory Role;
- Operating Program;
- Outcome Stance;
- Policy;
- Constraints;
- Preferences.

These should be established outside the pressure of an individual trade when appropriate.

### 7.2 Decision/execution authority

For a particular Decision Subject, Wheelwright produces a Recommendation under the applicable governed context. The operator retains authority to accept or depart.

Example:

```text
PRESCRIBED: LET RESOLVE
OPERATOR CHOICE: ROLL
```

The system should preserve that distinction rather than rewriting the recommendation to match the eventual action.

A departure can itself become durable decision evidence.

Possible reasons include:

- new evidence not represented by Wheelwright;
- changed objective/purpose;
- changed Outcome Stance;
- exceptional circumstance;
- explicit policy change;
- deliberate discretionary departure.

These categories are exploratory, not ratified schema.

---

## 8. Plan changed because the world changed vs I abandoned the plan

This distinction is one of the strongest Inner Game findings.

A mature process must permit legitimate change. Blind adherence to an obsolete plan is not discipline.

At the same time, the operator must not be able to rewrite history by changing today's purpose and thereby making yesterday's departure appear process-consistent.

The system therefore needs enough temporal/provenance semantics to ask:

> Was the action consistent with the governing context, evidence, and Recommendation that existed at the time?

Potential categories:

**Process-consistent continuation**
- governing context unchanged;
- relevant evidence/state does not cross a reconsideration boundary;
- prior prescription remains applicable.

**Legitimate reconsideration**
- evidence/economics/governance/lifecycle state materially changed;
- prior Recommendation is no longer assumed current;
- alternatives are re-evaluated.

**Governance change**
- Portfolio Mandate, Inventory Role, Outcome Stance, Policy, Constraint, or Preference changes authoritatively;
- the change is time-bounded and preserved;
- it does not retroactively rewrite earlier decisions.

**Operator departure**
- operator knowingly selects an Alternative other than the current Recommendation without changing the governing context that produced it.

The Product should not morally label the departure. It should make it visible and reconstructible.

---

## 9. Practitioner heuristics inventory

The practitioner corpus is useful not as a catalog to copy but as a **specimen library and heuristic test bench**.

### 9.1 Ownership / assignment / lifecycle

- Only sell a put on something you're willing to own.
- Choose a put strike you're willing to pay for the shares.
- Assignment can be an intended transition rather than failure.
- Know what state you will own after assignment/expiration.
- A trade is not finished when opened.
- Lifecycle state changes the next decision.
- Terminal payoff geometry is not the whole position.
- Derived, not verbatim: do not write calls on shares you are unwilling to lose.

### 9.2 Planning / sizing / risk

- Have a right/wrong plan before capital is at risk.
- Position size comes before confidence.
- Structural maximum loss and planned loss are different.
- Planned stops do not guarantee fills; gaps/spreads/liquidity remain relevant.
- Limited risk does not mean acceptable risk.
- Capital efficiency can become leverage concentration.
- Precommit entry/risk boundaries while allowing a governed adaptive management menu.

### 9.3 Probability / expectancy

- High probability does not imply a good trade or edge.
- Probability belongs beside payoff.
- Delta can be probability-like shorthand but is not literal real-world probability.
- Win rate does not establish expectancy.
- Endpoint max-profit/max-loss arithmetic can misstate expected value when intermediate/path-dependent outcomes matter.

### 9.4 Premium / covered calls / counterfactual economics

- Premium is not free money.
- Premium received is not the same as profit.
- Covered-call premium trades away upside.
- Whether a covered call is desirable depends on objective and counterfactual.
- A specific practitioner 20/50 moving-average covered-call filter is an unvalidated heuristic and useful challenge specimen.

### 9.5 Volatility / time / Greeks

- Volatility is a qualification variable, not merely a Greek input.
- "Sell rich vol / buy cheap vol" is a tendency, not a sufficient rule; ask why volatility is rich.
- Volatility mean reversion is an empirical tendency under bounded populations/regimes, not a free timing edge.
- "Sellers want shorter duration / buyers want more time" is a recurring practitioner pattern but not universal.
- 45-DTE entry / manage near 21 DTE is a studied retail premium-selling framework, not universal truth.
- Strong absolute buyer-side "never buy short duration" rules have weaker empirical support.
- Theta mechanically favors sellers but does not establish adequate compensation.
- 0DTE theta does not automatically create edge.
- More theta is not automatically better; gamma and compensation matter.
- Greeks interact; do not treat them as independent scores.
- Near expiration, gamma can dominate a comforting theta story.

### 9.6 Construction / thesis fit

- Do not buy unlimited upside if the thesis only requires a moderate move; a vertical may fit.
- Do not cap payoff if the thesis depends on an outsized move.
- Being directionally correct can still lose money because of IV, time, or price paid.
- The market has already priced a forecast.
- Before an earnings trade, ask whether the construction still works if IV collapses.
- Expected movement is insufficient; price paid for movement/convexity matters.
- Straddles/strangles are not merely "I don't know direction"; magnitude and price of convexity matter.

### 9.7 Execution / mechanics

- Liquidity is a qualification gate.
- Bid/ask, slippage, commissions, and fills matter.
- Know exercise/assignment/settlement/broker deadlines.
- Do not automatically exercise a long option early because doing so can destroy extrinsic value.
- "Never exercise early" is also too strong; compare executable alternatives.

### 9.8 Patience / no-trade

- Do nothing is legitimate.
- No adequate premium → no trade.
- No acceptable liquidity → no trade.
- No clean thesis → no trade.
- No fitting size → no trade.
- Idle capital is not failed capital.
- Patience is inventory management.
- Qualification earns its keep when it can say no.

### 9.9 Behavioral / Inner Game

- Journal the decision, not merely the result.
- Record beliefs before the outcome.
- Do not revenge trade.
- Do not boredom trade.
- Do not FOMO into trades.
- Do not take a rare large winner too early merely because realizing the gain feels good.
- Do not hold a loser merely because realizing loss feels like failure.
- Losses can be operating expenses within governed limits.
- A system requiring heroic discipline is probably poorly designed.
- Design around predictable weakness.
- Prefer simplicity where complexity adds no value.
- Educate / paper trade / plan / size / journal / review.
- Practitioner rules have exceptions.

---

## 10. Heuristic classification required before Product use

No practitioner rule should silently become Wheelwright policy.

The thread identified four useful classes.

### 10.1 Candidate durable principles

Examples:

- know the resulting state;
- probability is not expectancy;
- size is a first-line risk decision;
- premium modifies payoff rather than appearing from nowhere;
- WAIT/no-trade is legitimate;
- preserve contemporaneous decision evidence.

Even these require reconciliation before ratification.

### 10.2 Parameterizable heuristics / policy candidates

Examples:

- 45/21 DTE;
- delta ranges;
- volatility qualification;
- planned-loss thresholds;
- moving-average gates;
- take-profit rules;
- roll criteria.

These are likely Policy candidates, not universal truths.

### 10.3 Folk rules requiring challenge

Examples:

- 30 delta means exactly 30% assignment/ITM probability;
- theta implies short duration is always better;
- IV > HV means sell premium;
- high probability means edge;
- never exercise early;
- covered calls simply "put idle stock to work."

These are especially valuable falsification specimens.

### 10.4 Anti-pathology heuristics

Examples:

- precommit before capital is at risk;
- preserve the original plan;
- size before confidence;
- make no-trade easy;
- distinguish plan change from abandonment;
- use cooling-off rules where evidence supports them;
- preserve contemporaneous decision context.

The key Product question for every heuristic is:

> **Where does it enter the decision spine, what evidence would make it legitimate, what pathology does it address or create, and should Wheelwright treat it as invariant, Policy, Preference, heuristic, warning, question, or empirical hypothesis?**

---

## 11. Corpus limitations that must remain visible

The practitioner corpus is not ground truth.

Important limitations preserved from reconciliation:

- it represents one educator ecosystem with a material income/premium-selling orientation;
- recurrence or pedagogical confidence does not establish effectiveness;
- the corpus contains plans, calculations, examples, and recommendations, not a complete audited blotter of actual presenter behavior;
- teaching is evidence about teaching, not automatically evidence about behavior;
- portfolio-level net Greeks, concentration/correlation, and stress testing are materially absent;
- taxes are absent;
- explicit short-option ex-dividend screening/roll rules were not observed;
- liquidity/slippage/commissions are acknowledged but not exhaustively modeled;
- missing/excluded studies disproportionately covered strangles, straddles, condors, losing-Wheel management, small-account constraints, journaling, capital-recovery accounting, claimed testing, and debit-spread execution.

Therefore absence from the admitted reader/corpus does not establish absence from the broader practitioner program.

---

## 12. Sell-side bias as an open falsification question

Wheelwright was born as an options-income system, and the current roadmap Vision still says "continuously operating options-income decision system." The practitioner corpus used in this exploration is itself premium-selling oriented.

The thread therefore opened, but did not answer, a material question:

> **Where does Wheelwright's sell-side bias actually live, is each occurrence intentional or accidental, and at what semantic level does it belong?**

Possible locations:

- Portfolio Mandate;
- Inventory Role;
- Operating Program;
- Policy;
- Preference;
- Alternative generation;
- ranking/comparison;
- historical Product scope;
- presentation.

The dangerous case is accidental sell-side bias in **Alternative generation**, because that can prevent governed purpose/context from ever comparing legitimate long-option or protective Alternatives.

No conclusion is authorized. Possible eventual outcomes include:

- sell-side bias is appropriate for a specific Income mandate;
- it is inappropriate as a global assumption;
- it belongs as a parameterized Policy/Preference;
- it is an intentional Product-scope boundary;
- different portions of the current bias have different dispositions.

This must be tested rather than assumed.

---

## 13. Specimen methodology: coverage without combinatorial explosion

The Principal explicitly wants varying combinations of semantic dimensions without Cartesian explosion.

The selected method is:

> **Baseline → single-axis contrast → two-axis interaction → adversarial counterexample.**

### 13.1 Hold construction constant

Use shares + short call and vary:

- Income + Wheel + call-away desired;
- Income + overwrite + retention preferred;
- Growth/Compounding + retention preferred;
- Disposition + call-away desired;
- baseline + bullish Scenario/Market Thesis;
- baseline + changed call-away stance.

This tests whether Mandate, Operating Program, Outcome Stance, and Thesis remain distinct and actually affect the decision machinery.

### 13.2 Hold purpose constant

For Income, vary:

- Wheel;
- covered-call overwrite;
- CSP premium production;
- defined-risk credit spread;
- iron condor;
- potentially other admitted constructions/programs.

Ask which mechanisms genuinely serve the same purpose and how Wheelwright chooses among them.

### 13.3 Use awkward/adversarial specimens

Examples:

- Growth/Compounding + covered call;
- Income + protective put;
- acquisition purpose + CSP;
- Income + CSP where assignment is undesirable;
- hedge purpose + long straddle without a positive thesis that volatility will rise.

These prevent practitioner stereotypes from being encoded as ontology.

### 13.4 Dimension-worth test

If changing a supposed dimension never changes any of:

- Alternatives;
- admissibility;
- consequences;
- comparison;
- Recommendation;
- attention;
- explanation;
- required evidence,

then question whether it is decision-relevant or merely metadata.

Conversely, if controlled specimens show that two apparently similar concepts lead to different governed results, the distinction earns support.

### 13.5 Pathology testing without a giant matrix

Map each pathology to the seam where it enters:

- objective drift → durable Mandate / Outcome Stance;
- activity bias → WAIT / HOLD / natural-resolution Alternatives;
- loss aversion → planned invalidation / CLOSE semantics;
- hindsight bias → contemporaneous decision provenance;
- mandate/policy shopping → temporal governance history;
- oversizing → upstream constraints/risk profile;
- premium fixation → consequence envelope/counterfactual economics.

Standing question:

> **Which semantic or process mechanism makes this pathology observable or makes the disciplined path easier without taking authority away from the operator?**

---

## 14. Problem-space dimensions to complete before solution design

The thread explicitly deferred feature design. A gear/modal beside an Account is a useful specimen, not yet the solution.

The problem space must cover at least:

### Scope
Where do Mandate, Role, Program, Stance, Policy, Constraint, Preference, and thesis apply?

### Inheritance and override
What comes from Account/Portfolio Mandate? What can differ for Capital Pool, Inventory Block, Program, or Decision Subject?

### Time
How do context, evidence, and policy change? What was applicable at the actual decision time?

### Authority and provenance
Who/what asserted each fact? Was it operator-authored, policy-derived, model-derived, broker-observed, or inferred? Which kinds may be inferred at all?

### Completeness and unknowns
When does missing normative context make a Recommendation unresolved rather than permit a guessed intent?

### Lifecycle
How does purpose/context survive or change through assignment, expiration, rolling, replacement, partial resolution, and residual inventory?

### Decision mechanics
Which context affects Alternative generation, admissibility, comparison, WAIT/HOLD/natural resolution, and Recommendation?

### Presentation
How should attention/colorization communicate governed meaning rather than raw market movement or simplistic good/bad state?

### Operator authority and deviation
How are Recommendation, operator selection, Action, and execution kept distinct? How is departure preserved without moralizing?

### History and learning
Can Wheelwright reconstruct what was known, governed, recommended, selected, executed, and realized without hindsight contamination?

The endpoint of problem-space exploration is:

> **What information is required for Wheelwright to know what the process prescribes, at what scope that information belongs, how it becomes authoritative, how it changes through time, what happens when it is absent or conflicting, and what downstream Wheelwright behavior it legitimately affects?**

---

## 15. Product implications discovered but not yet designed

### 15.1 Account governance configuration surface

The Principal proposed a small gear beside an account in the Portfolio dropdown as a conceptual example.

Potentially visible simple choices might include:

- Purpose: Income;
- Purpose: Growth/Compounding.

The underlying model must preserve semantic decomposition rather than store one overloaded "strategy" string.

This could eventually be an **account governance configuration surface**, not merely a "regime selector."

No UI shape is authorized by this artifact.

### 15.2 Semantic colorization / attention

Color could eventually represent relationship to governed purpose/process, such as:

- on-process;
- attention required;
- contrary to mandate;
- insufficient information.

This is distinct from current `ActionPosture` execution-quality coloring and must not be conflated with `PL-POSTURE-01`.

### 15.3 Automatic decision journal

Because Wheelwright may possess most of the contemporaneous state and reasoning, a journal could largely be generated from authoritative system facts. The human adds only genuinely new judgment.

This is not a standalone implementation decision. Its substrate already overlaps lifecycle/outcome and learning roadmap work.

### 15.4 Exception-first operator interaction

A mature prescriptive system should not ask the operator to continuously rediscover ordinary process.

The ordinary path should be low-cognitive-load. Human judgment should concentrate on:

- genuinely new information;
- governance changes;
- exceptions;
- discretionary departures;
- consequential authorization.

---

## 16. Roadmap reconciliation

No new strategic Bet is justified by this thread at present. The current LVT already contains the necessary strategic homes.

### Awareness

`LVT-BET-POSITION` and `LVT-BET-ATTENTION` already own continuous reassessment and the distinction between meaningful reconsideration and noise.

`LVT-INIT-ATTN-RECONSIDER` is directly relevant to the question "has enough changed to justify reconsidering the prior prescription?"

### Choices

`LVT-BET-WAIT` owns WAIT as a genuine Alternative.

`LVT-BET-LIFECYCLE-CHOICES` owns explicit comparison of HOLD, CLOSE, ROLL, protection, and natural resolution.

`LVT-BET-STRATEGIES` owns broader governed trade shapes, but this thread pressures it to ensure strategy expansion is evaluated through governed purpose/context rather than merely adding constructions.

`LVT-BET-CAPITAL-CHOICES` owns the dependence of feasible Alternatives on capital state.

### Consequences

`LVT-BET-RISK-PROFILES` already says moving risk/consequence discretion upstream into governed policy reduces state-dependent risk taking.

`LVT-BET-LIFECYCLE-POLICY` already says precommitted lifecycle policy produces more consistent decisions under pressure. This is a direct strategic home for the Inner Game thesis.

`LVT-BET-EXPLANATION` owns explanation of why a preferred Alternative survives and its tradeoffs.

`LVT-BET-ACCEPTABILITY` owns the "best bad trade" problem and preserves WAIT when nothing is acceptable.

### Outcomes

`LVT-BET-LIFECYCLE-OUTCOME` already owns decision-to-resolution reconstruction, recommendation-to-execution linkage, economic events, basis attribution, and preservation of decision-time Alternatives.

This is much of the substrate required for an automatic decision journal.

### Learning

`LVT-BET-OUTCOME-LEARNING` and especially `LVT-INIT-LEARN-PRESERVE` already require preservation of point-in-time evidence, recommendations, and outcomes.

This supports hindsight-safe evaluation and the distinction among recommendation quality, execution quality, and outcome quality.

### Access

Potential future account-governance controls, semantic attention, and concise explanation may eventually appear in UI/Access work, but Access is not the concept home. The gear/modal is a specimen, not the problem definition.

---

## 17. Intake reconciliation

### 17.1 Primary home: `PL-DEC-BEH`

The existing item already states:

- Wheelwright should reduce state-dependent operator decision variance without removing meaningful human agency;
- the human owns the money, decision, and accountability;
- consequential discretion should move upstream into explicit policy, objective/profile selection, acceptable-consequence definitions, and lifecycle rules;
- those choices should be applied transparently/mechanically at decision time;
- "Mechanics over Impulse";
- concern extends to WAIT, entry, BTC, assignment, rolling, loss realization, lifecycle decisions;
- operator should not reconsider merely because a red position becomes emotionally salient;
- changed evidence/economics/governance/lifecycle state can justify reconsideration;
- presentation should make consequences legible without intentionally manipulating choice.

That is the direct conceptual home for the Inner Game findings.

This thread therefore **refines `PL-DEC-BEH`; it does not justify a new PL identity.**

The refinement materially broadens the evidence/specimen base from credit-spread consequences and generic behavioral economics into:

- durable governed purpose/context;
- mandate/program/Outcome-Stance-aware prescription;
- GDXJ natural-resolution specimen;
- account-specific purpose specimen (PTS vs Sawdust);
- cognitive-load minimization;
- process-consistent inactivity;
- explicit operator departure/provenance;
- automatic decision-record pressure;
- practitioner heuristic classification;
- sell-side-bias falsification;
- contrastive specimen methodology.

### 17.2 `PL-SEM-01` owns semantic correctness, not the Product concern

`PL-SEM-01` owns distinctions among:

- Portfolio Mandate;
- Inventory Role;
- Operating Program;
- Economic Construction;
- Decision Subject;
- Outcome Stance;
- Policy/Constraint/Preference;
- state/evidence;
- Alternative;
- Recommendation;
- authority/provenance/time.

This thread supplies strong falsification specimens for that draft.

But `PL-SEM-01` explicitly does not authorize recommendation/UI/execution behavior change and should not absorb the Accountable-HITL Product concern.

Relationship:

> `PL-SEM-01` answers what the concepts mean and how they remain distinct; `PL-DEC-BEH` asks how governed decision machinery should use those meanings to reduce state-dependent operator variance while preserving agency.

### 17.3 `PL-DEPLOY` owns normalized decision composition

`PL-DEPLOY` is strongly related because it already owns:

- mission-aware portfolio actions;
- normalized Alternatives;
- cross-strategy comparability;
- WAIT semantics;
- eligibility/acceptability/fitness separation;
- absolute quality floors;
- the "where should this capital go?" decision model.

This thread pressures `PL-DEPLOY` to consume authoritative governed purpose/context rather than assume it, and to avoid accidental sell-side narrowing in Alternative generation.

But `PL-DEPLOY` is not the behavioral-discipline owner.

### 17.4 `PL-STRAT-01` owns repertoire/admission questions

The practitioner specimen library and sell-side-bias question pressure Strategy Expansion Governance:

- which constructions/programs belong in the governed repertoire?
- what purpose do they serve?
- what capability/evidence is required?
- does a candidate require predictive reasoning?
- is sell-side orientation a legitimate scope boundary or an accidental pre-filter?

But `PL-STRAT-01` is too narrow to own journaling, operator departure, precommitment, cognitive load, or lifecycle process adherence.

### 17.5 `PL-PORT-01` owns required state maturity

Inventory Blocks, lot attribution, account locality, encumbrance, and richer portfolio state are required substrate for correct prescriptions.

They do not own the behavioral/prescriptive concern.

### 17.6 `PL-POL-01` is a narrow policy specimen

Cash-Flow-Safe Recovery is relevant to GDXJ-like recovery/disposition economics and to regime/mission-dependent valuation of erosion, premium, and recovery potential.

It is not the general home.

### 17.7 `PL-UX-01` owns downstream attention expression

Lifecycle Decision Pressure asks "Do I need to do anything now?" and should elevate attention only when changed evidence/economics/governance/lifecycle state warrants inspection.

This is a direct downstream expression of the Inner Game direction, but not its concept home.

### 17.8 `PL-EXEC-01` owns lifecycle transition/execution semantics

Recommendation, operator selection, Action, staging, broker instruction, execution, and resolution must remain distinct. The behavioral concern depends on that separation but does not replace it.

### 17.9 `PL-POSTURE-01` is explicitly not the home for semantic mandate coloring

Current ActionPosture/CSS drift concerns execution-quality band semantics. Any future "on-process / contrary to mandate / insufficient context" visual language is a separate semantic layer and must not be silently overloaded onto current posture coloring.

---

## 18. Reconciliation disposition

**Canonical intake identity:** `PL-DEC-BEH` — Behavioral Decision Discipline / Accountable HITL.

**No new PL identity.**

**No new LVT Bet.**

**Strategic effect:** strengthens existing roadmap Bets, especially lifecycle policy, upstream risk profiles, WAIT, lifecycle alternatives, acceptability, attention/reconsideration, outcome reconstruction, and point-in-time learning.

**Semantic effect:** supplies high-value specimens and pressure to `PL-SEM-01`, especially Portfolio Mandate / Inventory Role / Operating Program / Outcome Stance / Policy / Decision Subject / Alternative / Recommendation / temporal provenance.

**Deployment effect:** pressures `PL-DEPLOY` to become genuinely governed-purpose-aware and to distinguish insufficient normative context from a valid governed WAIT/Recommendation.

**Strategy effect:** opens a falsification question about where sell-side bias belongs and whether Alternative generation is accidentally narrower than governed purpose warrants.

**Behavioral effect:** expands `PL-DEC-BEH` from consequence presentation and state-dependent decision variance into durable process-prescription support, explicit process-consistent inactivity, departure provenance, and cognitive-load reduction.

**Implementation effect:** none authorized.

---

## 19. Non-goals / boundaries

This artifact does **not** authorize:

- autonomous broker execution;
- removal of operator authority;
- an account-settings gear/modal;
- a new account "strategy" field;
- a universal Account Regime selector;
- semantic color implementation;
- a journal UI;
- behavioral scoring of the operator;
- claims that Wheelwright can diagnose FOMO/revenge/loss aversion from behavior;
- automatic punishment or blocking of discretionary departures;
- promotion of practitioner heuristics into policy;
- a generalized rules engine;
- a Cartesian matrix of all semantic combinations;
- a global long-option or short-option preference;
- a change to the current roadmap Vision;
- a new Recommendation algorithm;
- implementation migration from the semantic draft.

---

## 20. Next problem-space work

Before solution design, use the practitioner corpus and real Wheelwright specimens to answer:

1. Which governed-purpose/context concepts are actually required for prescription?
2. At what scope does each apply?
3. Which inherit and which override?
4. Which are durable, conditional, decision-specific, or derived?
5. Which must never be inferred?
6. What establishes authority/provenance/effective time?
7. What constitutes sufficient context for a Recommendation?
8. What is the fail-closed behavior when normative context is absent/conflicting?
9. Which context changes Alternative generation versus only admissibility/comparison/explanation?
10. How is legitimate reconsideration distinguished from mere salience?
11. How are governance change and operator departure represented without moralizing?
12. What parts of the practitioner heuristic inventory are invariants, Policy candidates, Preferences, heuristics, warnings, questions, or empirical hypotheses?
13. Where does Wheelwright's current sell-side bias live?
14. Which portions of that bias are intentional Product scope, mandate-specific policy, historical accident, or decision-engine coupling?
15. Which contrastive specimens are sufficient to falsify the model without combinatorial explosion?
16. What information can Wheelwright capture automatically so the operator is not asked to reconstruct known context?
17. What minimal genuinely human judgment remains at decision time?
18. What durable decision record is required to evaluate process quality without hindsight contamination?

---

## 21. Standing ontology-to-example discipline

For this work, important concepts should be explained bidirectionally:

**Ontology → example**
- What does Portfolio Mandate mean in PTS?
- What does Outcome Stance mean for GDXJ call-away?

**Example → ontology**
- "I want this inventory called away" → Outcome Stance.
- "Run the Wheel" → Operating Program.
- "I think GDXJ is going higher" → Scenario / Market Thesis Assertion.
- "Generate income" → Portfolio Mandate / Objective-Purpose side, subject to scope reconciliation.
- "Sell this 45 put" → Alternative or Action depending exact stage.

When the Principal uses an overloaded term during the exploration, correct it briefly without derailing the substantive discussion. The purpose is to sharpen the shared mental model, not enforce vocabulary ceremonially.

If a concept cannot map convincingly to real specimens, treat that as evidence against the ontology rather than forcing the specimen into the model.

---

## 22. Working Product thesis preserved from the thread

The thread's strongest Product thesis is:

> **Wheelwright should make following the disciplined process the path of least cognitive resistance. The HITL should spend judgment on exceptions and authority—not repeatedly reconstructing routine decisions that the system can determine from authoritative state, governed purpose/context, policy, and evidence.**

A more formal working shape is:

```text
authoritative governed context
+ Decision Subject
+ Reconciled State / Evidence
+ optional Scenario / Market Thesis Assertion(s)
→ governed Alternatives
→ Counterfactual Consequences
→ admissibility / comparison
→ Recommendation
→ operator selection / Action
→ Execution
→ Reconciled Outcome
→ hindsight-safe learning
```

The Product must preserve at least three different outcomes of reasoning:

1. **A governed Alternative is recommended.**
2. **Sufficient evidence establishes that WAIT/HOLD/natural resolution is the governed surviving path.**
3. **Evidence or normative context is insufficient to establish the choice set/recommendation.**

State 3 must not be mislabeled as state 2.

---

## 23. Why this belongs under PL-DEC-BEH

The existing `PL-DEC-BEH` summary thesis already says the human owns the money, decision, and accountability; Wheelwright should move consequential discretion upstream into explicit policy/objective/profile/consequence/lifecycle rules and apply those choices transparently and mechanically under pressure.

The Inner Game thread did not discover a competing concern. It supplied the missing high-resolution Product model for that concern:

- **what should be moved upstream:** governed purpose/context;
- **what should be remembered:** authoritative scope, provenance, time, prior plan;
- **what should be computed routinely:** governed Alternatives and Recommendation;
- **what should remain human:** governance changes, exceptional judgment, consequential authorization;
- **what should be preserved:** recommendation, selection/departure, execution, outcome;
- **what should become easier:** WAIT/HOLD/LET RESOLVE when process-consistent;
- **what should become visible:** departures and context changes without moralizing;
- **what should be empirically challenged:** practitioner heuristics and sell-side assumptions;
- **what should not be required:** heroic discipline or repeated reconstruction of already-known process.

That is a direct refinement of Behavioral Decision Discipline / Accountable HITL.

---

## 24. Reconciliation completion record

- **Intake:** `PL-DEC-BEH` refinement — Inner Game / Governed Prescriptive Decision Discipline.
- **Strategic disposition:** strengthens existing roadmap directions; **no new LVT identity and no `docs/roadmap.md` change**.
- **Architectural disposition:** creates pressure on decision-context, temporal provenance, governed Alternative generation, and decision-record semantics; **no architecture change or implementation authorized**.
- **Semantic disposition:** pressure/specimens feed `PL-SEM-01`; semantic model remains Category E draft and is not silently promoted.
- **Parking-lot disposition:** retain under existing `PL-DEC-BEH`; cross-link `PL-SEM-01`, `PL-DEPLOY`, `PL-STRAT-01`, `PL-PORT-01`, `PL-POL-01`, `PL-UX-01`, `PL-EXEC-01`.
- **Why-state:** this artifact.
- **Next authorized mode:** further problem-space exploration / specimen-driven reconciliation only. Do not enter solution design until the governed-purpose/context leg, heuristic classification, and sell-side-bias location have been pressure-tested.


## 25. Principal independent Operating Program survey — 2026-09-24

**Source status:** Principal-supplied independent survey. Preserve as high-value semantic/falsification input; it is **not yet independently verified practitioner evidence, ratified taxonomy, or policy**. Future actors working this problem must reacquire and explicitly consider this survey rather than treating Wheel as the only established Operating Program specimen.

The survey proposes the following durable, rule-governed processes as candidate peers of the Wheel at the **Operating Program** level, grouped by mandate.

### Income programs

| Candidate Operating Program | Program sketch | Inventory Role | Outcome Stance | Illustrative Policy Rule(s) |
|---|---|---|---|---|
| **Systematic put-write** | Recurring CSP sales, e.g. 30–45 DTE and delta-banded | collateral → contingent acquisition | assignment desired at acceptable effective price | IV-vs-HV qualification; sizing; premium floors |
| **Systematic overwrite** | Recurring covered calls against held shares | income-producing or disposition inventory | call-away acceptable/desired; upside cap priced in | strike selection vs exit targets; no-write filters |
| **PMCC program** | Recurring short-call sales against a long LEAPS | long LEAPS as supporting inventory | retain long leg; never passively accept short-call assignment | long-leg delta thresholds; defend-or-close triggers |
| **Mechanical delta-neutral premium** | Recurring delta-targeted premium sales, e.g. 45-DTE entry, managed at 21 DTE or 50% profit | margin only | assignment prohibited | IV-rank entry gate; mechanical profit-takers |
| **Defined-risk spread ladder** | Recurring iron condors/verticals across expiries | governed risk/capital support to be pressure-tested | assignment prohibited; losses contractually capped | width-vs-credit minimums; no binary-event holds |
| **Covered strangle program** | Recurring short calls + short puts against shares and cash | existing shares plus acquisition capital | call-away acceptable; put assignment = sized acquisition | put strikes only at buy-more prices; size for double-assignment branch |
| **Diagonal income ladder** | Recurring calendar/diagonal sales against longer-dated longs | longer-dated long as supporting inventory | residual-leg management is the job; front-leg expiry is renewal, not full resolution | re-sell criteria; long-leg impairment exits |
| **Earnings premium harvest** | Trigger-based defined-risk premium sales into earnings | risk capital; exact Inventory Role requires semantic pressure test | assignment prohibited; event risk treated as governed operating cost | liquid names only; defined-risk constructions only; per-event risk caps |
| **0DTE premium program** | Daily mechanical premium sales into same-day expiry | intraday risk/margin support; exact Inventory Role requires pressure test | flat by closing bell; no overnight inventory | intraday entry windows; hard stop-outs |
| **Long-dated put-write** | Opportunistic LEAPS put sales after volatility spikes | collateral → contingent long-horizon acquisition | assignment desired only at deep-discount strikes; multi-year holding tolerance | elevated term-structure gate; strikes at “celebrate owning” levels |

**Epistemic caution:** the thread's practitioner reconciliation already treats 0DTE seller edge as disputed and warns that crowding may compress premium. The survey's 0DTE entry is therefore especially useful as a falsification specimen rather than evidence of edge.

### Protection programs

| Candidate Operating Program | Program sketch | Inventory Role / Mandate | Outcome Stance | Illustrative Policy Rule(s) |
|---|---|---|---|---|
| **Systematic collar program** | Recurring collars on strategic inventory, potentially near-zero-cost | protected strategic holding; Protection/Hedging purpose | retention preferred; call-away disfavored | put tenors matched to hedge horizon; call strikes at acceptable exit levels |
| **Tail-hedge program** | Rolling long index or single-name puts | Protection/Hedging; pure cost-center behavior | hedge expiring worthless can be the desired portfolio-level outcome because the insured adverse event did not occur | fixed annual portfolio hedge budget; mechanical rolling; no discretionary monetization |

### Survey hypothesis about the Wheel

The Principal's survey proposes this distinguishing claim:

> **Across this candidate set, the Wheel is unusual because assignment is a desired state transition in the operating process rather than merely a prohibited, disfavored, tolerated, or exceptional branch. The Wheel treats assignment as the machine working.**

This is a valuable hypothesis, but it should be **falsified rather than promoted as fact**. In particular, the survey itself contains possible neighboring counterexamples:

- systematic put-write can desire assignment at an acceptable effective price;
- covered strangle can treat put assignment as sized acquisition and call-away as acceptable;
- long-dated put-write can desire assignment at deep-discount strikes.

Therefore the sharper research question may be whether the Wheel is distinguished not simply by *desiring assignment*, but by making assignment an **ordinary endogenous transition that advances a durable multi-state cycle**:

```text
cash
→ short put
→ assignment
→ shares
→ short call
→ call-away
→ cash
→ repeat
```

That distinction should be tested against the other candidate programs rather than assumed.

### Semantic pressure created by the survey

The survey materially improves the Operating Program test bench because it provides candidates with different:

- mandates/purposes;
- inventory roles;
- assignment stances;
- renewal/resolution semantics;
- time horizons;
- risk topology;
- policy styles;
- use of long versus short optionality;
- lifecycle continuity.

It also creates several useful falsifiers for the current semantic model:

1. **Operating Program vs Economic Construction** — a program may repeatedly create different constructions over time; the Wheel is the clearest case, but diagonal ladders and covered-strangle programs also create recurring lifecycle state.
2. **Operating Program vs Policy** — “systematic overwrite” is not merely a strike rule; its strike/no-write rules are Policy inside a larger repeatable process.
3. **Operating Program vs Portfolio Mandate** — multiple Income programs can serve one mandate; Protection/Hedging can support collar or tail-hedge programs.
4. **Operating Program vs Outcome Stance** — assignment stance varies inside superficially similar short-option programs.
5. **Resolution vs renewal** — a front-leg expiry in a diagonal program may be a renewal event rather than lifecycle completion.
6. **Inventory Role** — PMCC/diagonal programs expose “supporting inventory” as distinct from ordinary income-producing shares.
7. **Cost-center success semantics** — a tail hedge expiring worthless can be consistent with successful protection because the adverse insured state did not occur. Outcome quality cannot be inferred from leg P/L alone.
8. **Trigger-based vs continuously recurring programs** — earnings premium harvest and opportunistic long-dated put-write test whether “Operating Program” requires periodic cadence or merely durable repeatable governed process.
9. **Flat-at-close requirement** — 0DTE programs test whether a program can make end-of-session inventory state a hard policy invariant.
10. **Assignment as program transition** — the Wheel, systematic put-write, covered strangle, and long-dated put-write provide controlled specimens for distinguishing assignment desired, acceptable, tolerated, prohibited, and cycle-advancing.

### Contrastive specimen set enabled by the survey

Use the survey to construct a small basis set rather than a Cartesian matrix:

- **Wheel vs systematic put-write:** both can desire put assignment; only Wheel clearly specifies the subsequent shares → short call → call-away → cash continuation.
- **Wheel vs systematic overwrite:** both can create covered calls; one may arise from an assignment-driven cycle while the other repeatedly overwrites pre-existing inventory.
- **Systematic overwrite vs collar:** both may write calls against strategic shares, but protection purpose and retention stance can reverse the meaning of call-away.
- **PMCC vs diagonal income ladder:** similar long/short calendar geometry can differ in program purpose, renewal semantics, and long-leg management policy.
- **Mechanical delta-neutral premium vs 0DTE premium:** both can prohibit assignment and use mechanical exits, while horizon/gamma/execution pressure differs radically.
- **Defined-risk spread ladder vs earnings premium harvest:** same spread construction can participate in a continuous ladder or an event-triggered program.
- **Tail hedge vs premium-selling income program:** one may intentionally spend premium and regard worthless expiry as process-consistent; the other seeks premium production. This is a strong falsifier of any global sell-side or “premium received = productive” assumption.
- **Covered strangle vs Wheel:** both can have assignment/call-away branches, but their durable lifecycle topology and inventory/capital requirements may differ.

### Intake disposition

This survey does **not** create a new PL identity.

It strengthens:

- `PL-SEM-01` — Operating Program identity and its distinction from construction, mandate, policy, Inventory Role, and Outcome Stance;
- `PL-STRAT-01` — repertoire and strategy/program expansion governance;
- `PL-DEC-BEH` — durable rule-governed processes as precommitment machinery;
- `PL-DEPLOY` — multiple programs serving the same mandate create real cross-program Alternative-comparison pressure;
- `LVT-BET-STRATEGIES` — candidate governed repertoire;
- `LVT-BET-LIFECYCLE-POLICY` — repeatable program rules and lifecycle management;
- `LVT-BET-LIFECYCLE-CHOICES` — program-specific lifecycle Alternatives;
- `LVT-BET-RISK-PROFILES` — program-specific consequence/risk envelopes.

It also materially strengthens the open **sell-side-bias** investigation because the candidate program set includes both short-premium and long-premium/protection programs.

### Actor handoff requirement

Future Kiro/Codex/ChatGPT prompts that ask actors to work on the Inner Game, governed purpose/context, semantic model, strategy/program expansion, prescriptive recommendations, lifecycle policy, or sell-side-bias question should explicitly direct them to reacquire:

- `docs/61-inner-game-governed-prescriptive-decision-discipline-2026-09-24.md`;
- this Operating Program survey section;
- current `PL-DEC-BEH` state;
- `PL-SEM-01` semantic-model artifacts;
- relevant practitioner-corpus material.

Do not substitute a conversational paraphrase for that repository reacquisition.


## 26. Principal independent Economic Construction survey — 2026-09-24

**Source status:** Principal-supplied independent survey. Preserve as high-value semantic/falsification input; it is **not yet independently verified domain reference, ratified taxonomy, or implementation authority**. Future actors working this problem must reacquire and explicitly consider this survey.

The survey's governing ontology proposition is:

> **Economic Constructions are structures that exist at a point in time, independent of any Operating Program running them. None of the conventional labels below is, by itself, a strategy in the decision-making sense. Each is a candidate value of Economic Construction, evaluated as a Decision Subject under a Portfolio Mandate / governed purpose, subject to Constraints and Preferences, with Outcome Stance and applicable Policy Rules supplied by the relevant governed context / Operating Program.**

This proposition should be pressure-tested against `PL-SEM-01`; it must not be promoted merely because the examples fit well.

### Single-option constructions

| Economic Construction | Principal survey description |
|---|---|
| **Long call** | Right to buy at strike. Pays premium; needs magnitude, speed, and cooperative volatility. No inventory required. |
| **Long put** | Right to sell at strike. Bearish speculation or hedge leg. |
| **Short call (naked)** | Uncapped obligation. Undefined upside risk; margin and nerve required. |
| **Short put (naked)** | Obligation to buy; downside exposure to zero minus premium. |
| **Cash-secured put** | Short put plus earmarked cash. Identical payoff to naked short put; the "security" is a collateral fact about inventory/capital, not a different option payoff structure. |

**Semantic pressure:** the CSP specimen is especially important. The conventional label bundles a short-put obligation with a collateral/encumbrance fact. The survey therefore challenges the simplistic claim that every market label maps cleanly to exactly one construction primitive. The semantic model may need to represent the option construction and authoritative cash encumbrance separately while still understanding/exposing the conventional label "cash-secured put."

### Stock-plus-option constructions

| Economic Construction | Principal survey description |
|---|---|
| **Covered call** | Shares + short call. Premium income; upside capped at strike; assignment is the mechanism, not an accident. |
| **Protective put** | Shares + long put. Hard floor at strike; premium is insurance cost. |
| **Collar** | Shares + long put + short call. Floor and ceiling; often structured zero-cost. Retention-oriented in the survey specimen. |
| **Covered strangle** | Shares + short call + short put. Double premium; assignment exposure on both sides — call-away above, acquisition below. |

**Semantic caution:** "retention-oriented" for collar is not intrinsic to the Economic Construction if the ontology discipline holds. It is a useful practitioner-purpose association/specimen, but actual retention preference belongs to governed purpose/Outcome Stance rather than being inferred from mechanics.

### Verticals — same expiry, two strikes

| Economic Construction | Principal survey description |
|---|---|
| **Bull call vertical** | Long lower call / short higher call. Debit, defined risk/reward; expresses upside without paying for unlimited upside. |
| **Bull put vertical** | Short higher put / long lower put. Credit, defined risk; common defined-risk premium-selling construction. |
| **Bear call vertical** | Call-side downside/bearish mirror construction. |
| **Bear put vertical** | Put-side downside/bearish mirror construction. |

### Volatility constructions — same expiry, two legs

| Economic Construction | Principal survey description |
|---|---|
| **Long straddle** | Long ATM call + long ATM put. Pays for movement itself; direction-agnostic, magnitude-hungry. |
| **Long strangle** | Long OTM call + long OTM put. Cheaper than straddle; needs a larger move to pay. |
| **Short straddle** | Short ATM call + short ATM put. Undefined risk in both directions; concentrated short premium and high gamma exposure near expiry. |
| **Short strangle** | Short OTM call + short OTM put. Wider breakevens than straddle; undefined wings; slower premium bleed. |

### Winged / defined-risk multi-leg constructions

| Economic Construction | Principal survey description |
|---|---|
| **Iron condor** | Short strangle plus long wings both sides. Defined risk; range-bound premium construction; wings bound tail loss. |
| **Iron butterfly** | Short ATM straddle plus long wings. Condor with short strikes pinched together; concentrated premium, narrow sweet spot. |
| **Long butterfly** | Long wings, short two bodies. Cheap convexity around a target price; value decays rapidly away from center as time passes. |
| **Broken-wing butterfly** | Asymmetric wings; directional tilt with defined risk; may be entered for credit. |
| **Jade lizard** | Short put plus short call spread, with call-spread width covered by put credit. No upside loss beyond the short-call-spread economics when credit is sufficient; downside remains short-put-like. |

### Cross-expiry constructions

| Economic Construction | Principal survey description |
|---|---|
| **Calendar spread** | Short near-dated option + long farther-dated option at same strike. Near leg decays faster; at front expiry a residual long leg remains — resolution/renewal semantics matter. |
| **Diagonal spread** | Calendar with different strikes. Adds directional tilt to time-spread economics. |
| **PMCC (construction)** | Deep-ITM long LEAPS call + short near-dated call. A diagonal whose long leg functions as a stock substitute; capital-efficient, with live theta/vega on the long leg. |

**Semantic pressure:** PMCC is deliberately present in both surveys: **PMCC construction** is the point-in-time diagonal relationship; **PMCC program** is the durable recurring process that repeatedly sells/manages short calls against the long leg. This is a high-value controlled specimen for Economic Construction ≠ Operating Program.

### Ratio / asymmetric constructions

| Economic Construction | Principal survey description |
|---|---|
| **Ratio call spread (1×2)** | Long one call, short two higher calls. Stock-repair shape; undefined risk above upper strike. |
| **Call backspread** | Short one call, long two higher calls. Small credit/debit; strong positive convexity if underlying rises violently. |
| **Put ratio spread** | Downside mirror of call ratio spread. |
| **Put backspread** | Downside mirror of call backspread. |

### Synthetic / arbitrage constructions

| Economic Construction | Principal survey description |
|---|---|
| **Synthetic long stock** | Long call + short put, same strike/expiry. Share-like economics subject to different capital, margin, dividend, and operational treatment. |
| **Synthetic short stock** | Mirror image. |
| **Conversion** | Long stock + long put + short call. Near-locked outcome associated with put-call parity. |
| **Reversal** | Short stock + short put + long call. Conversion mirror. |
| **Box spread** | Bull call spread + bear put spread. Financing/interest-rate construction when correctly priced and executable. |

### Semantic consequences / falsification questions

The survey creates several important pressures:

1. **Construction ≠ purpose.** A long put can be bearish speculation or a hedge leg. The construction alone cannot establish Portfolio Mandate, Inventory Role, Outcome Stance, or thesis.
2. **Construction ≠ Operating Program.** Covered calls can occur inside Wheel, systematic overwrite, collars/protection, disposition, or one-off decisions. PMCC exists both as construction and as recurring program.
3. **Construction ≠ formation provenance.** Shares + short call can exist because a call was written against long-held shares, because shares arrived through put assignment in a Wheel, or because both legs were established as a buy-write.
4. **Construction ≠ Outcome Stance.** Covered-call mechanics do not establish whether call-away is desired, acceptable, disfavored, or prohibited.
5. **Construction ≠ Market Thesis.** A covered call does not prove "neutral-to-moderately bullish"; a CSP does not prove bullishness; a long put does not prove a bearish speculative thesis when it may be insurance.
6. **Construction ≠ Policy.** DTE, delta, roll, take-profit, no-write, hedge-budget, and assignment rules belong elsewhere.
7. **Conventional labels may bundle multiple semantic facts.** "Cash-secured put" combines short-put mechanics with authoritative collateral/encumbrance. "Covered call" combines shares and a short-call relationship whose coverage association must itself be authoritative. The ontology should understand conventional labels without allowing them to collapse canonical distinctions.
8. **Residual-leg semantics are load-bearing.** Calendar, diagonal, PMCC, ratio, and multi-leg structures pressure the concept of Complete Position / Decision Subject because one leg may resolve while another remains.
9. **Defined-risk vs undefined-risk is a consequence property, not purpose.** Iron condor and vertical geometry constrain loss, but do not establish whether the construction is acceptable under a given mandate/risk profile.
10. **Synthetic equivalence does not imply operational identity.** Synthetic stock, conversions, reversals, and boxes can have economically related payoff structures while differing in capital, dividends, margin, assignment/exercise, taxes, liquidity, and execution semantics. Payoff equivalence must not erase operational evidence.
11. **A construction can participate in multiple Decision Subjects.** A short call may be evaluated alone for execution, together with shares as a covered call for assignment consequences, or inside a broader Operating Program for lifecycle choice. Decision Subject remains conclusion-relative.
12. **Point-in-time identity matters.** Economic Construction is the current structural relation; an Operating Program can survive the disappearance/replacement of one construction and create another over time.

### Controlled cross-survey specimens

The Operating Program and Economic Construction surveys together now provide a strong two-dimensional falsification bench:

| Operating Program | Possible point-in-time Economic Construction(s) | Key semantic pressure |
|---|---|---|
| Wheel | CSP → shares → covered call → cash | one Program traverses multiple constructions; assignment/call-away advance lifecycle |
| Systematic put-write | CSP / short-put + collateral relation | recurring same-family construction; assignment may end or transform the episode depending program definition |
| Systematic overwrite | covered call; shares alone between writes | program persists when no short call is currently open |
| PMCC program | PMCC/diagonal; residual long call between shorts | program persists through front-leg renewal; supporting inventory matters |
| Defined-risk spread ladder | bull-put/bear-call verticals, iron condors, etc. | multiple simultaneous constructions can belong to one recurring program |
| Covered strangle program | covered strangle; covered call + residual shares; shares + short put, depending resolution | partial leg resolution changes construction without necessarily ending program |
| Diagonal income ladder | calendars/diagonals + residual long legs | renewal vs resolution |
| Earnings premium harvest | defined-risk vertical/condor/other admitted event construction | trigger-based Program vs point-in-time construction |
| 0DTE premium program | short/defined-risk intraday constructions | hard temporal boundary; flat-at-close policy |
| Systematic collar | collar; strategic shares between renewals | Protection program can include short premium without becoming an Income mandate |
| Tail hedge | long puts / put spreads if admitted by policy | long-premium cost center falsifies global "premium production = productive" assumption |

This table is illustrative, not a ratified program-to-construction compatibility matrix.

### Actor handoff requirement — expanded

Future Kiro/Codex/ChatGPT prompts concerning the Inner Game, governed purpose/context, semantic model, Operating Programs, Economic Constructions, strategy expansion, prescriptive recommendations, lifecycle policy, or sell-side bias must explicitly direct actors to reacquire:

- `docs/61-inner-game-governed-prescriptive-decision-discipline-2026-09-24.md`;
- the Principal Operating Program survey in §25;
- this Principal Economic Construction survey in §26;
- current `PL-DEC-BEH`;
- current `PL-SEM-01` artifacts;
- relevant practitioner-corpus material.

The surveys are pressure-test inputs with preserved source status. Do not silently promote them to ratified ontology or policy.
