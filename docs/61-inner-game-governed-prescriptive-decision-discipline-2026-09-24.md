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


## 27. Principal independent Portfolio Mandate survey — 2026-09-24

**Source status:** Principal-supplied independent survey. Preserve as high-value semantic/falsification input; it is **not yet independently verified, ratified taxonomy, or architecture/policy authority**. The survey deliberately pressure-tests candidate Portfolio Mandates using a decision-relevance criterion.

### Admission criterion

The Principal's criterion is:

> **A Portfolio Mandate earns its place only if it changes the decision rules and the success metric; otherwise it is just a label.**

This is a useful falsification rule for `PL-SEM-01`, not yet a ratified ontology invariant.

### Candidate Portfolio Mandates

| Candidate Portfolio Mandate | Fundamental purpose of capital | Principal survey success metric / counterfactual | Decision-rule pressure |
|---|---|---|---|
| **Income** | Capital deployed to produce cash flow: premiums, dividends, interest | cash generated per unit of capital per period, against idle-capital counterfactual | home of Wheel, put-write, overwrite; must include opportunity cost and tail consequences that a cash-flow ledger can hide |
| **Growth / Compounding** | Capital deployed to increase in value over time | total return vs benchmark | default buy-and-hold equity specimen; supplies opportunity-cost counterfactual against which income programs must defend themselves |
| **Acquisition** | Capital held to become desired inventory at acceptable/better prices | quality/economics of acquired inventory vs governed acquisition target, not merely premium collected | strike governed by “price I'd celebrate owning,” not premium maximization; prevents premium-chasing from corrupting acquisition discipline |
| **Disposition** | Inventory/capital positioned to exit at governed target prices | successful governed exit / disposition economics relative to target and alternatives | strike is an exit price, not premium-optimal strike; call-away is desired rather than merely tolerated |
| **Protection / Hedging** | Capital spent to alter the distribution of other capital | counterfactual protection: avoided/limited adverse outcome relative to unhedged state | deliberate cost center; hedge expiry worthless can be process-consistent/good because insured adverse event did not occur |
| **Speculation** | Capital risked for positive-skew / convex or event-driven payoffs | portfolio-level payoff distribution/expectancy rather than trade-level win rate | expected decay/frequent failures can be admissible; requires different sizing/diversification/risk rules from Growth |
| **Liquidity Reserve** | Capital whose job is to remain available / preserve uncommitted optionality | capacity retained to act when dislocations/opportunities arrive; “regret avoided” is Principal shorthand requiring operationalization | differs from Acquisition because no specific target inventory is required; reserve size itself becomes governed |
| **Preservation** | Capital whose job is to avoid nominal loss / preserve principal | nominal capital preservation plus appropriate liquidity/yield constraints | supports T-bill, money-market, short-duration Treasury specimens; strengthens “do nothing” / remain-safe as legitimate Alternative |

### Principal pressure-test verdicts

The survey explicitly pressure-tested three candidates previously flagged as uncertain in the working ontology table.

#### Acquisition — Principal verdict: PASS at mandate level

Reasoning:

- acquisition capital is earmarked to become specific desirable inventory;
- its optimization target differs from Income;
- the relevant strike is governed by the price at which ownership is desirable, not by maximum premium;
- demoting Acquisition to an Income phase creates a pathology: premium chasing can override ownership discipline.

This is strong semantic evidence that Acquisition may deserve mandate-level identity, but it remains a Principal survey verdict pending `PL-SEM-01` falsification/reconciliation.

#### Disposition — Principal verdict: PASS at mandate level

Reasoning:

- disposition inventory is intended to leave the portfolio at governed target economics;
- call strike is primarily an exit target, not a premium-optimal strike;
- call-away is desired;
- the same covered-call construction can receive a different verdict under Income versus Disposition.

This is a particularly useful controlled specimen because the Economic Construction can remain constant while mandate changes decision rules and outcome interpretation.

#### Protection / Hedging — Principal verdict: PASS at mandate level

Reasoning:

- protection capital exists to change the distribution of other capital;
- it is intentionally a cost center;
- judging it by Income criteria (“premium paid was wasted”) is a category error;
- a hedge expiring worthless may be the desired portfolio-level outcome because the insured adverse event did not occur;
- its success metric is inherently counterfactual to the unhedged state.

This is the survey's clearest mandate-level specimen and a strong falsifier of global cash-flow/premium-production objectives.

### New candidate pressure: Speculation

The Principal proposes **Speculation** as a distinct Portfolio Mandate:

- capital is risked for positive-skew payoffs;
- examples include long convexity, event bets, and lottery-like small-risk/high-payoff positions;
- most individual specimens may fail by design;
- sizing should therefore be small and potentially numerous/uncorrelated;
- evaluation belongs at portfolio/program distribution level rather than individual trade win rate.

The survey argues this is distinct from Growth because expected path, sizing, payoff topology, and success metric differ materially.

This candidate requires substantial pressure testing. In particular:

- whether “Speculation” is too broad to be a single mandate;
- whether long-convexity/event-bet behavior belongs instead to an Operating Program or Inventory Role under another mandate;
- whether “positive skew” is necessary or merely common;
- how it relates to optional Scenario / Market Thesis Assertions;
- whether it can be defined without moral or colloquial baggage.

### New candidate pressure: Liquidity Reserve

The Principal proposes **Liquidity Reserve** as a mandate whose purpose is uncommitted optionality itself.

It differs from Acquisition because:

- Acquisition targets specific inventory or a bounded acquisition purpose;
- Liquidity Reserve remains deliberately uncommitted;
- its success is preserving capacity to act when better opportunities/dislocations arrive;
- reserve size is a governed choice rather than leftover cash.

This strongly intersects the Inner Game “patience is a position” pressure and `LVT-BET-WAIT`.

Open semantic questions:

- whether Liquidity Reserve is a Portfolio Mandate, Capital Pool role, Constraint/floor, or combination;
- whether “regret avoided” can become a disciplined measurable success criterion;
- whether the same dollars can simultaneously satisfy Preservation and Liquidity Reserve purposes without semantic double counting.

### New candidate pressure: Preservation

The Principal proposes **Preservation** for capital whose job is not to lose nominal value.

Specimens:

- T-bills;
- money-market funds;
- short-duration Treasuries.

The survey calls this the quiet mandate that can fund collateral needs and makes “do nothing” economically real rather than empty.

Open semantic questions:

- whether Preservation is distinct from Liquidity Reserve when safe liquid assets serve both;
- whether Preservation is a Portfolio Mandate or a risk profile/objective attached to another mandate;
- whether nominal preservation is sufficient or must account for inflation, duration, credit risk, and liquidity.

### Structural finding 1 — capital can migrate between mandates

The Principal proposes:

> **Capital migrates between mandates.**

The Wheel is offered as the key specimen:

```text
Acquisition
    ↓ assignment
Income
    ↓ covered-call lifecycle
Disposition
    ↓ call-away
capital available for next cycle
```

This is a major semantic pressure and should **not yet be accepted literally without reconciliation**.

It may indicate one of several possibilities:

1. Portfolio Mandate genuinely changes through the Wheel lifecycle;
2. one durable higher-level Income mandate contains changing sub-objectives/Inventory Roles;
3. Capital Pool purpose and Inventory Role change while Portfolio Mandate remains stable;
4. the Wheel Operating Program coordinates several mandate-like purposes across phases;
5. current semantic scope is insufficient and needs another concept.

This is exactly the kind of specimen that can falsify the ontology. Do not force the Wheel into the proposed mandate-migration interpretation merely because the language is intuitive.

The survey's associated reason for keeping **Inventory Role** separate remains strong:

> mandate describes what capital is fundamentally for; Inventory Role describes what a governed quantity is currently doing within that purpose/context.

The Wheel specimen should test whether that distinction is sufficient.

### Structural finding 2 — every mandate carries a counterfactual

The Principal proposes:

> **Every Portfolio Mandate smuggles in a counterfactual, and mandate misclassification corrupts performance judgment before any trade is evaluated.**

Survey examples:

- Income → idle capital / alternative yield / total-return opportunity cost;
- Growth → benchmark / buy-and-hold counterfactual;
- Acquisition → alternative acquisition price/timing and desired ownership economics;
- Disposition → target exit economics / continued-hold counterfactual;
- Protection → unhedged adverse state;
- Speculation → portfolio allocation without the convex/event exposure;
- Liquidity Reserve → lost capacity when capital is prematurely committed;
- Preservation → unsafe/risk-bearing alternative and nominal-loss avoidance.

This is a high-value bridge between **Portfolio Mandate** and **Counterfactual Consequence**.

Research question:

> Does a Portfolio Mandate need an explicit governed success criterion / counterfactual comparator, or should those be represented as separate policy/objective/evaluation semantics associated with the mandate?

The answer matters because the same realized P/L can be judged differently under different legitimate counterfactuals.

### Controlled mandate specimens

The survey enables a compact contrastive set:

1. **Income vs Acquisition — same CSP mechanics**
   - Income: premium production may dominate within risk/ownership constraints.
   - Acquisition: ownership price is primary; premium is compensation while waiting.
   - Tests whether mandate changes strike/ranking logic.

2. **Income vs Disposition — same covered-call mechanics**
   - Income: premium/upside tradeoff and repeatability matter.
   - Disposition: exit target/call-away is the point.
   - Tests Recommendation and outcome-quality interpretation.

3. **Growth vs Protection — same strategic shares, hedge added**
   - Growth evaluates total return.
   - Protection spends capital to alter downside distribution.
   - Tests cross-mandate relationships and whether protection is subordinate/supporting or peer-level.

4. **Growth vs Speculation — both may buy calls**
   - Growth may use long calls as capital-efficient directional exposure.
   - Speculation may intentionally buy small positive-skew convexity with low win rate.
   - Tests whether Economic Construction or thesis can infer mandate (they cannot if model holds).

5. **Acquisition vs Liquidity Reserve — both can be cash**
   - Acquisition cash has a target/ownership purpose.
   - Liquidity Reserve cash is deliberately uncommitted.
   - Tests whether cash state alone can infer purpose.

6. **Liquidity Reserve vs Preservation — same money-market/T-bill inventory**
   - Reserve emphasizes availability/optionality.
   - Preservation emphasizes nominal safety.
   - Tests whether these are truly distinct mandates or different objectives/roles attached to the same capital.

7. **Protection vs Income — collar/covered-call overlap**
   - both may include a short call;
   - protection values downside-floor economics and retention;
   - income values cash production;
   - tests global sell-side bias and conventional-strategy-label leakage.

### Decision-relevance test

The Principal's mandate-admission criterion can be operationalized for falsification:

A candidate mandate is semantically useful only if, under controlled specimens, changing it can legitimately change at least one of:

- generated Alternatives;
- admissibility;
- ranking/comparison;
- risk/consequence interpretation;
- required evidence;
- policy selection;
- Outcome Stance;
- attention/reconsideration;
- Recommendation;
- success/outcome evaluation;
- relevant counterfactual.

If none change, the candidate is likely metadata or a synonym rather than a load-bearing Portfolio Mandate.

### Cross-survey topology now available

The three Principal surveys now form a much stronger test bench:

```text
Portfolio Mandate
    ↓ supplies fundamental purpose / evaluation frame
Operating Program
    ↓ supplies durable governed process
Economic Construction
    ↓ describes point-in-time economic structure
Decision Subject + State/Evidence
    ↓
Alternatives / Consequences
    ↓
Recommendation
```

This is **not** a ratified containment hierarchy. The semantic model's association topology still applies. A mandate can potentially support multiple programs; a program can traverse multiple constructions; the same construction can appear under different mandates/programs.

The surveys make those many-to-many distinctions testable rather than merely verbal.

### Intake / roadmap pressure

This survey remains primarily under:

- `PL-DEC-BEH` — governed purpose should be established upstream rather than reconstructed under pressure;
- `PL-SEM-01` — Portfolio Mandate identity/scope and distinction from Inventory Role, Operating Program, Objective/Purpose, Policy, and counterfactual semantics;
- `PL-DEPLOY` — mandate-aware Alternative generation, admissibility, comparison, and WAIT;
- `PL-PORT-01` — Capital Pool / Inventory Block state needed to bind mandates to actual capital;
- `PL-STRAT-01` — programs/constructions must be evaluated against legitimate mandate purpose rather than admitted as free-floating “strategies.”

Roadmap pressure remains within existing Bets. No new LVT identity is implied.

### Actor handoff requirement — expanded again

Future Kiro/Codex/ChatGPT prompts concerning the Inner Game, governed purpose/context, Portfolio Mandates, Operating Programs, Economic Constructions, strategy/program expansion, prescriptive recommendations, lifecycle policy, performance evaluation, or sell-side bias must explicitly direct actors to reacquire:

- `docs/61-inner-game-governed-prescriptive-decision-discipline-2026-09-24.md`;
- §25 Principal Operating Program survey;
- §26 Principal Economic Construction survey;
- §27 Principal Portfolio Mandate survey;
- current `PL-DEC-BEH`;
- current `PL-SEM-01` artifacts;
- relevant practitioner-corpus/reconciliation material.

These surveys are Principal-supplied pressure-test inputs. Do not silently promote their classifications or verdicts into ratified ontology, architecture, policy, or implementation.


## 28. Principal independent Policy Rule survey — 2026-09-24

**Source status:** Principal-supplied independent survey. Preserve as high-value semantic/falsification input; it is **not yet independently verified, ratified policy taxonomy, or implementation authority**. Examples and numeric thresholds below are survey specimens, not Wheelwright defaults.

The survey defines **Policy Rules** as:

> **Governed rules that determine how decisions get made.**

It organizes them by where they bite in a position/program lifecycle, plus portfolio-level and meta-governance rules.

### Entry rules

| Policy-rule family | Principal survey meaning | Illustrative specimens |
|---|---|---|
| **Entry qualification** | Preconditions before anything opens; the gate through which later entry reasoning passes | setup criteria; IV-vs-HV qualification; thesis stated in writing |
| **DTE / tenor** | Which expirations are eligible under the applicable program | sellers 30–60 DTE; buyers ≥90 DTE; 0DTE only under a dedicated 0DTE program |
| **Delta / strike selection** | Governed strike-selection bands/targets appropriate to construction and purpose | short puts at 16–30 delta; call-sale strikes tied to governed exit targets for disposition inventory |
| **Liquidity / execution** | Minimum market-quality and order-handling conditions | minimum volume/OI; max bid-ask width such as 5–10% of mid; limit orders only; no chasing |
| **No-trade** | Conditions that veto a new entry | earnings blackout; IV below floor; premium below minimum; post-loss cooling-off period; volatility-regime exclusion |
| **Event** | Rules for binary/scheduled events that can affect both prospective and existing positions | close, reduce, or convert to defined risk before earnings, FOMC, CPI |

**Survey distinction:** Event rules are not reducible to no-trade rules because an already-open position may require governed treatment when the event approaches.

### Live-management rules

| Policy-rule family | Principal survey meaning | Illustrative specimens |
|---|---|---|
| **Profit taking** | Mechanical or governed harvest triggers | close short premium at 50% max profit; scale winners in tranches |
| **Invalidation / planned loss** | Thesis-break or governed loss exit established before pressure arrives; distinct from structural max loss | exit at 2× credit; exit at technical level that invalidates thesis |
| **Roll criteria** | Conditions under which defense/repositioning is permitted and how | strike tested; delta breached; DTE floor reached; roll out/down/up for governed economics; specimen rule “never roll for a debit to save a premium trade” |
| **Assignment management** | Whether assignment is accepted, desired, disfavored, or avoided and what action follows | Wheel accepts put assignment as program transition; other premium programs may close before assignment risk |
| **Hedging** | Conditions requiring portfolio/position protection to be established or maintained | tail-hedge budget; collar triggers; vega caps |

**Semantic caution:** some survey phrases combine Policy with Outcome Stance. For example, “accept assignment” can depend on a prior Outcome Stance; the Policy Rule determines what action/Alternative treatment follows under that stance. The survey is useful precisely because it pressures those boundaries.

### Exit / expiration rules

| Policy-rule family | Principal survey meaning | Illustrative specimens |
|---|---|---|
| **Expiration management** | Rules governing final-DTE exposure and remaining optionality | no short options inside final N days without a plan; compare exercise vs sale rather than surrendering extrinsic; dividend/early-assignment checks |
| **Exercise / settlement** | Governed handling of exercise style, broker deadlines, and settlement form | American vs European exercise; broker cutoffs; cash settlement vs physical delivery |

### Portfolio-level rules

| Policy-rule family | Principal survey meaning | Illustrative specimens |
|---|---|---|
| **Sizing** | Limits on risk/capital committed per trade and across the portfolio | planned-loss cap such as ≤2–5% of account; portfolio heat; contract-count ceilings |
| **Concentration / correlation** | Prevent apparently separate trades from creating one hidden exposure | max underlying/sector exposure; portfolio Greek bands such as net delta/net vega |
| **Volatility regime** | Program behavior/eligibility conditioned on volatility environment | reduce size or widen wings at low IV rank; prefer defined risk during volatility spikes; gate program eligibility by regime |
| **Leverage / margin** | Bound use of buying power and account capabilities | max margin utilization; no naked shorts in IRA; spreads-only capability; buying-power buffers |
| **Drawdown circuit breakers** | Precommitted response to program/account loss state | halt new entries or halve size after X% drawdown; resume only after governed review |
| **Mandate migration** | Rules governing when capital/inventory changes purpose classification | shares Income → Disposition at target; cash Reserve → Acquisition on trigger |
| **Tax-aware** | Tax consequences included in governed choice | holding period; wash-sale awareness on rolls; assignment-vs-close treatment in taxable accounts |

**Epistemic note:** the practitioner-corpus reconciliation observed taxes as materially absent from the source school. Their inclusion here is therefore Principal independent survey material, not corpus-derived evidence.

### Meta rules

| Policy-rule family | Principal survey meaning | Illustrative specimens |
|---|---|---|
| **Review / journaling** | Rules requiring contemporaneous decision evidence and periodic review | trade record with thesis, planned loss, outcome; weekly review; periodic program audit |
| **Rule change** | Governance for changing Policy itself | evidence threshold; paper-trading period; no mid-drawdown rewrites |

The Principal's useful analogy is:

> **Rule-change rules are the constitution's amendment clause. Without them, every losing week can rewrite the system.**

This directly supports the Inner Game distinction between legitimate governed change and ex-post rationalization.

### Structural observation from the survey

The Principal proposes:

> **Most retail “strategies” ship with only entry and live-management rules and improvise the rest. Portfolio-level and meta rules are what separate a durable governed program from a collection of trades.**

This is a high-value hypothesis, not yet an ontology invariant.

It pressures the relationship among **Operating Program**, **Policy Rule**, and governance:

- a program is not merely a repeated construction;
- a program may require a durable rule set spanning entry, live management, expiration, portfolio interaction, and policy amendment;
- program identity should not be inferred solely from a handful of entry parameters;
- policy can operate at different scopes: Account, Capital Pool, Portfolio Mandate, Operating Program, Inventory Block, construction/Decision Subject, or event/lifecycle state.

### Important semantic pressure: Policy vs Constraint vs Preference

The survey contains specimens that can help falsify these boundaries.

Potential **Constraint** examples:
- account legally/operationally cannot write naked options;
- capital/buying power is insufficient;
- assignment is prohibited by a governing boundary;
- margin utilization may not exceed a hard ceiling.

Potential **Policy Rule** examples:
- only enter short puts in a governed delta band;
- close at a defined profit trigger;
- reconsider/roll when a defined lifecycle condition occurs;
- halt new entries after a governed drawdown threshold.

Potential **Preference** examples:
- prefer simpler construction when economics are materially equivalent;
- prefer better execution among otherwise admissible choices;
- prefer retention or disposition where neither is a hard boundary.

But these categories can interact. A Policy Rule may operationalize a Constraint or Preference. The semantic model must preserve the underlying meaning rather than classify solely by surface grammar such as “never” or “prefer.”

### Policy and the decision journey

The survey suggests a policy application pipeline:

```text
governed purpose/context
+ applicable Operating Program
+ Decision Subject
+ Reconciled State / Evidence
        ↓
resolve applicable Policy Rules by scope + effective time
        ↓
generate / normalize Alternatives
        ↓
apply hard Constraints
        ↓
derive Counterfactual Consequences
        ↓
apply policy-specific qualification / lifecycle rules
        ↓
compare admissible Alternatives using Preferences / objective criteria
        ↓
Recommendation
```

This is a **research specimen**, not a ratified computation order. In particular, some Policy Rules may participate in Alternative generation itself, some may operationalize Constraints, and some may define consequence interpretation.

### Policy inheritance and scope questions

The survey makes policy scope unavoidable.

Examples:

- Account capability rule: no naked options in an IRA.
- Portfolio Mandate rule: minimum liquidity reserve.
- Operating Program rule: Wheel put-entry DTE/delta band.
- Inventory-specific rule: do not overwrite strategic founder shares below a governed exit price.
- Event rule: no undefined-risk exposure through earnings.
- Account-wide drawdown circuit breaker: suspend new risk.
- Meta rule: policy changes require review and cannot be made during an active drawdown.

Research questions:

1. How is an applicable Policy Rule associated with scope?
2. How does a narrower rule override, refine, or conflict with a broader one?
3. Which rules are hard vetoes versus comparison inputs?
4. How are effective time, version, provenance, supersession, and revocation represented?
5. What happens when two applicable rules conflict?
6. Which rule families may be parameterized per Account/Program without becoming a generic rules engine?
7. What does “by-the-book Wheel” mean as a durable, inspectable Policy set rather than a conversational phrase?

### Rule-change governance and the Inner Game

Rule-change rules are especially important to the thread's central pathology:

> **Changing the rules because today's position is uncomfortable must not masquerade as following the rules.**

A legitimate Policy change may occur, but the system should preserve:

- prior Policy version;
- new Policy version;
- authority/provenance;
- effective time;
- reason/evidence for change where governed;
- positions/decisions to which each version applied.

A new rule must not retroactively rewrite whether an earlier Action followed the Policy applicable at the time.

This is the policy analogue of the thread's distinction:

> **The plan changed because the world/governance changed** vs **I abandoned the plan.**

### Review/journaling as meta-policy

The survey's claim that review/journaling “enforces all other rules” creates useful pressure.

Wheelwright may be able to automate much of the required record:

```text
applicable mandate/program/policy version
+ Decision Subject
+ decision-time evidence
+ Alternatives
+ Recommendation
+ operator selection/departure
+ execution
+ lifecycle events
+ Reconciled Outcome
```

The human should not be forced to retype facts Wheelwright already knows.

A review rule can then ask higher-value questions:

- Was the applicable policy followed?
- If not, was there an authoritative governance change or an operator departure?
- Did the Recommendation itself fail under later evidence?
- Was execution poor even though the decision was sound?
- Did the outcome differ while the process remained valid?
- Is a repeated loss pattern evidence against the Policy/Program rather than evidence that one trade was “bad”?

### Policy-rule survey × prior surveys

The four Principal surveys now expose a richer decision context:

```text
Portfolio Mandate
    ↓ fundamental purpose / evaluation frame
Operating Program
    ↓ durable governed process
Policy Rules
    ↓ governed decision mechanics across lifecycle and portfolio
Economic Construction
    ↓ point-in-time economic structure

+ Inventory Role
+ Outcome Stance
+ Constraints
+ Preferences
+ optional Scenario / Market Thesis
+ Reconciled State / Evidence

→ governed Alternatives
→ Counterfactual Consequences
→ Recommendation
→ operator authority
→ Execution
→ Reconciled Outcome
```

This remains a **falsification topology, not ratified architecture**.

### High-value controlled specimens

1. **Same Program, different Policy version**
   - Wheel v1: 30–45 DTE, one roll rule.
   - Wheel v2: different DTE/management rule.
   - Tests Policy versioning without changing Program identity.

2. **Same construction, different Program policy**
   - covered call inside systematic overwrite vs Wheel vs Disposition context.
   - Tests whether mechanics improperly dictate management.

3. **Same Account, account-level capability Constraint vs Program Policy**
   - program permits a naked short construction;
   - IRA/account capability forbids it.
   - Tests hard Constraint precedence without pretending the program changed.

4. **Same setup, no-trade Policy changes result**
   - economically attractive premium;
   - event blackout or liquidity rule vetoes entry.
   - Tests WAIT/no-trade as governed result rather than absence of opportunity.

5. **Same losing position, planned-loss vs structural max**
   - structural max unchanged;
   - Policy invalidation reached.
   - Tests whether “defined risk” improperly overrides planned-loss discipline.

6. **Same evidence, drawdown circuit breaker active**
   - trade qualifies locally;
   - account/program-level rule suspends entry.
   - Tests portfolio policy vs local recommendation.

7. **Policy change during discomfort**
   - operator proposes relaxing roll/loss rule after position moves against them.
   - Tests amendment governance and hindsight contamination.

8. **Tax-aware taxable account vs IRA**
   - same economic Alternative set;
   - tax-aware policy changes comparative consequences in taxable account.
   - Tests Account-specific policy without conflating account identity and mandate.

### Intake / roadmap pressure

This survey primarily strengthens:

- `PL-DEC-BEH` — precommitment, rule-change governance, low-cognitive-load application under pressure;
- `PL-SEM-01` — Policy Rule identity, scope, association, effective time, provenance, and distinction from Constraint/Preference;
- `PL-DEPLOY` — policy-aware Alternative generation/admissibility/comparison;
- `PL-STRAT-01` — a candidate Operating Program should arrive with lifecycle/portfolio/meta governance, not merely construction labels;
- `PL-PORT-01` — account/capital/inventory state required to apply sizing, concentration, margin, and mandate policies;
- `PL-EXEC-01` — expiration, exercise, settlement, and broker-capability rules;
- `PL-POL-01` — remains a specific policy specimen, not the general Policy Rule home.

Existing roadmap pressure includes `LVT-BET-RISK-PROFILES`, `LVT-BET-LIFECYCLE-POLICY`, `LVT-BET-WAIT`, `LVT-BET-LIFECYCLE-CHOICES`, `LVT-BET-ACCEPTABILITY`, `LVT-BET-LIFECYCLE-OUTCOME`, and `LVT-BET-OUTCOME-LEARNING`.

No new PL or LVT identity is implied by this survey.

### Actor handoff requirement — expanded

Future Kiro/Codex/ChatGPT prompts concerning the Inner Game, governed purpose/context, Portfolio Mandates, Operating Programs, Economic Constructions, Policy Rules, strategy/program expansion, prescriptive recommendations, lifecycle policy, performance evaluation, or sell-side bias must explicitly direct actors to reacquire:

- `docs/61-inner-game-governed-prescriptive-decision-discipline-2026-09-24.md`;
- §25 Principal Operating Program survey;
- §26 Principal Economic Construction survey;
- §27 Principal Portfolio Mandate survey;
- §28 Principal Policy Rule survey;
- current `PL-DEC-BEH`;
- current `PL-SEM-01` artifacts;
- relevant practitioner-corpus/reconciliation material.

These surveys are Principal-supplied pressure-test inputs. Do not silently promote their examples, thresholds, classifications, or structural hypotheses into ratified ontology, architecture, policy, or implementation.


## 29. Principal technical Wheel definition — Operating Program instance — 2026-09-24

**Source status:** Principal-supplied formalization intended as a technical definition/specimen of the Wheel at the Operating Program level. Preserve verbatim in substance and structure for falsification/reconciliation. It is **not yet ratified architecture, policy, implementation authority, or a verified claim that the defining invariant is unique**.

### 0. META

```text
program_id: WHEEL
ontological_type: Operating Program
cadence: continuous evaluation; event-driven actions
scope: single-underlying instances; instances are independent and effectively unlimited
source_specimens: EOG CSP→wheel cycle; KO 12-month wheel; corpus studies 10 (wheel process), 33 (CSP), 11 (covered-call income), 4 (covered-call defense)
```

### 1. GOVERNING CONTEXT

**Account:** brokerage account with capabilities `{short_put, covered_call, assignment}`. IRA instances: cash-secured only (Constraint C1).

**Portfolio Mandate:** multi-mandate program. Mandate is phase-dependent, not program-constant:

- Phase P1 — put working: **Acquisition**
- Phase P2/P3 — shares held, calls working: **Income**
- Phase P3-exit — call strike = exit target: **Disposition**

Mandate migration across phases is itself governed by Policy Rule `PR-W-14`.

### 2. STATE MACHINE

States:

```text
S0_SCAN          — no position; cash uncommitted
S1_PUT_OPEN      — CSP working
S2_STOCK_HELD    — 100-share blocks held, unencumbered
S3_CALL_OPEN     — covered call working
S4_CYCLE_CLOSED  — terminal; capital released to S0_SCAN
```

Transition table:

```text
S0_SCAN
  --P_entry_true-->
S1_PUT_OPEN
  action: open CSP

S1_PUT_OPEN
  --put_expired_worthless | profit_target_hit-->
S0_SCAN
  result: premium realized; no inventory

S1_PUT_OPEN
  --assigned-->
S2_STOCK_HELD
  result: shares acquired; basis = strike − premium_received

S2_STOCK_HELD
  --P_callwrite_true-->
S3_CALL_OPEN
  action: open covered call

S2_STOCK_HELD
  --thesis_broken-->
S0_SCAN
  action/result: liquidate shares; loss realized

S3_CALL_OPEN
  --call_expired_worthless | profit_target_hit-->
S2_STOCK_HELD
  result: premium realized; shares retained

S3_CALL_OPEN
  --called_away-->
S4_CYCLE_CLOSED
  result: shares disposed at strike

S4_CYCLE_CLOSED
  --capital_released-->
S0_SCAN

ANY STATE
  --underlying_ineligible | account_halt-->
wind-down per PR-W-15 / PR-W-16
```

### 3. PER-STATE SPECIFICATION

#### S0_SCAN

- **Inventory Block:** cash reserve.
- **Inventory Role:** uncommitted / acquisition-reserve.
- **Economic Construction:** none.
- **Decision Subject:** candidate underlying × candidate CSP terms.
- **Outcome Stance:** assignment desired at acceptable effective price; expiry-worthless acceptable; no position acceptable (WAIT is valid).
- **Alternatives:** `{OPEN_CSP, WAIT, NO_TRADE}`.
- **Recommendation:** `OPEN_CSP` iff `P_entry` true, else `WAIT`.
- **P_entry:** entry-qualification predicate; all conditions must hold. Exact predicate terms remain to be reconciled/filled from applicable Policy Rules and evidence.

#### S1_PUT_OPEN

- **Inventory Role:** collateral (cash encumbered) or margin; shares = acquisition target.
- **Economic Construction:** CSP.
- **Decision Subject:** short-put obligation + encumbered collateral.
- **Outcome Stance:** assignment desired at strike − premium; early profit-taking acceptable; rolling acceptable only if new strike still passes `willing_to_own`.
- **Alternatives:** `{HOLD, CLOSE_AT_PROFIT, ROLL_DOWN_OUT, ACCEPT_ASSIGNMENT}`.
- **Recommendation logic:** supplied definition leaves this heading open for later formalization from Policy + state/evidence.

#### S2_STOCK_HELD

- **Inventory Block:** `N×100` shares.
- **Basis:** `B = strike − premium_received`.
- **Inventory Role:** income-producing inventory under Income; reclassifies to disposition inventory if price ≥ `exit_target` under the proposed Disposition phase.
- **Economic Construction:** long stock, unencumbered.
- **Decision Subject:** unencumbered share block.
- **Outcome Stance:** call-away desired at `≥ max(B + MIN_PROFIT, exit_target)`; retention acceptable while premium harvesting; liquidation required if thesis broken.
- **Alternatives:** `{WRITE_CALL, HOLD_UNCOVERED, SELL_SHARES, ADD_PROTECTION}`.

`P_callwrite` mirrors `P_entry` for the call leg, plus:

```text
strike ≥ max(B + MIN_PROFIT, exit_target)
AND no-write filters (PR-W-09; e.g. suppress after bullish 20/50 crossover)
AND dividend / early-assignment screen on candidate short call
```

#### S3_CALL_OPEN

- **Economic Construction:** covered call = shares + short call.
- **Decision Subject:** share/call relationship; encumbered block.
- **Outcome Stance:** call-away desired at strike; realized economics described as `strike − B + cumulative premiums`; expiry-worthless acceptable; never defend at a debit.
- **Alternatives:** `{HOLD, CLOSE_AT_PROFIT, ROLL_UP_OUT, ACCEPT_CALL_AWAY}`.
- **Recommendation logic:** supplied definition leaves this heading open for later formalization from Policy + state/evidence.

### 4. POLICY RULE CATALOG

- **PR-W-01 — Entry qualification:** `P_entry` above. No discretionary bypass without logged override.
- **PR-W-02 — Underlying eligibility:** liquid options + durable willingness-to-own. Re-screened per cycle; ineligibility triggers wind-down, never new entry.
- **PR-W-03 — Tenor/delta bands:** per leg, as resolved by the entry/call-write predicates.
- **PR-W-04 — Premium adequacy floor:** reject trades where premium < floor even if all else passes.
- **PR-W-05 — Sizing:** contracts bounded by allocatable capital, buying power, and per-underlying concentration; planned-loss sizing, not premium-target sizing.
- **PR-W-06 — Profit taking:** close short legs at `PROFIT_TARGET` (survey specimen default 50% of max); never hold to expiry for the last 10% unless assignment is the intent.
- **PR-W-07 — Roll criteria:** rolls must be net credit **and** new strike must independently pass acceptability: ownership for puts; `≥ B + MIN_PROFIT` for calls. Rolling to avoid an acceptable assignment is prohibited as manufactured activity.
- **PR-W-08 — Assignment policy:** put assignment accepted iff strike acceptable, having been pre-accepted at entry. Call assignment accepted iff strike `≥ B + MIN_PROFIT`.
- **PR-W-09 — No-write filters:** suppress call writing into defined bullish configurations, e.g. post-20/50 crossover; suppress put writing into defined bearish / IV-collapse configurations.
- **PR-W-10 — Expiration management:** DTE floors per state; exercise-vs-hold decisions use remaining-extrinsic test; broker cutoff observed and distinguished from exchange deadline.
- **PR-W-11 — Dividend / early-assignment guard:** screen short calls before ex-dividend; close if dividend > remaining extrinsic value.
- **PR-W-12 — Downside contingency:** if shares fall more than `DRAWDOWN_TRIGGER` below B, Alternatives = `{hold + write reduced-strike calls, add protective put priced as business expense, liquidate}`. Selection governed by whether `willingness_to_own` still holds.
- **PR-W-13 — Event handling:** no new CSP into known binary events unless explicitly permitted; working positions reduced or converted to defined risk at operator discretion with logged rationale.
- **PR-W-14 — Mandate migration:** every `S1→S2` transition logs Acquisition→Income; every strike-set-at-exit-target logs Income→Disposition for that block. Proposed definition treats migration as a reconciled fact, not an interpretation.
- **PR-W-15 — Record keeping:** every transition, Recommendation, departure from Recommendation, and fill logged with timestamp and evidence references.
- **PR-W-16 — Program halt:** underlying ineligibility or account-level drawdown breaker suspends new entries; working positions managed to resolution rather than abandoned.

### 5. CONSTRAINTS

- **C1:** account capability ∈ `{short_put, covered_call, assignment}`; IRA → cash-secured only, no margin.
- **C2:** buying power ≥ `strike × 100 × contracts` for cash or applicable margin requirement for margin account.
- **C3:** 100-share blocks required to write calls; no fractional encumbrance.
- **C4:** liquidity floors from PR-W-02.
- **C5:** concentration: single-underlying exposure ≤ `CONC_MAX`; correlated-underlying aggregate ≤ `CORR_MAX`.
- **C6:** construction whitelist = `{CSP, covered_call, long_stock, protective_put}`; everything else unsupported in this program.

### 6. PREFERENCES — tie-breakers among admissible Alternatives

- **PF1:** natural resolution > intervention when both admissible. Let expire / accept assignment rather than manufacture activity.
- **PF2:** pre-accepted outcomes > engineered outcomes. Assignment at an acceptable strike beats a clever roll.
- **PF3:** fewer transitions > more transitions. Each roll is a cost and a new decision.
- **PF4:** ownership acceptability dominates premium size in all strike decisions.

### 7. RECONCILED STATE / EVIDENCE SCHEMA

The Principal definition requires sufficient reconciled facts before any Recommendation and specifies **UNRESOLVED** when evidence/context is insufficient.

The supplied definition intentionally leaves the concrete schema body open here. This is a required completion point, not permission to invent fields silently.

### 8. DECISION LOOP

The supplied definition establishes a per-evaluation-tick decision loop but intentionally leaves the detailed algorithm body open. It should later be derived/reconciled from the state machine, applicable Policy, Constraints, Preferences, state/evidence, and Recommendation semantics rather than guessed.

### 9. RECONCILED OUTCOMES — terminal/reconciled facts, not projections

```text
PUT_EXPIRED
  premium realized
  inventory unchanged
  → S0_SCAN

PUT_ASSIGNED
  shares += 100 × contracts @ basis B
  → S2_STOCK_HELD

CALL_EXPIRED
  premium realized
  shares retained
  → S2_STOCK_HELD

CALL_ASSIGNED
  shares -= 100 × contracts @ strike
  realized = (strike − B) × shares + Σpremiums
  → S4_CYCLE_CLOSED

SHARES_LIQUIDATED
  thesis-break exit
  realized P&L logged
  → S0_SCAN
```

### 10. DEFINING INVARIANT — Principal proposed machine-checkable essence

The Principal proposes:

> **The Wheel is the unique Income-mandate Operating Program satisfying: (a) its state machine contains an assignment-accepting transition (`S1_PUT_OPEN --assigned--> S2_STOCK_HELD`) classified as desired rather than failure; (b) its terminal transition (`S3_CALL_OPEN --called_away--> S4_CYCLE_CLOSED`) is classified as desired; (c) its construction whitelist is exactly `{CSP, long_stock, covered_call, protective_put}`; (d) every strike in every state independently satisfies a pre-acceptance predicate (`willing_to_own` / `≥ B + MIN_PROFIT`). Any program violating (a) is not the Wheel — it is a premium program with assignment risk.**

**Reconciliation warning:** this proposed invariant is deliberately preserved but is **not yet accepted as machine-checkable truth**. It creates immediate falsification pressure:

1. The same definition says the Wheel is **multi-mandate and phase-dependent**, while the invariant calls it a “unique Income-mandate Operating Program.” Those formulations may conflict.
2. The exact whitelist including `protective_put` requires evidence: a protective put may be an allowed contingency without being essential to Wheel identity.
3. “Unique” requires comparison against systematic put-write, covered strangle, long-dated put-write, and other assignment-accepting programs from §25.
4. Requirement (a) alone cannot distinguish Wheel from put-write programs that intentionally acquire inventory through assignment.
5. The likely stronger discriminator is the **closed lifecycle topology**: desired put assignment transitions into owned inventory, followed by a governed call-writing phase whose desired call-away returns capital to the scan/acquisition state.
6. Requirement (d), especially `≥ B + MIN_PROFIT`, may describe a particular Wheel policy instance rather than the ontological essence of every legitimate Wheel.
7. The basis expression `B = strike − premium_received` may be useful economic-cycle accounting but must be reconciled with tax basis, lot basis, cumulative premium attribution, and existing Wheelwright accounting semantics rather than overloaded as one universal “basis.”
8. `S1_PUT_OPEN --profit_target_hit--> S0_SCAN` and `S3_CALL_OPEN --profit_target_hit--> S2_STOCK_HELD` compress Recommendation, Action, Execution, and Reconciled Outcome into transition triggers. The semantic model may require explicit intermediate states/events or a different formalization.
9. “Mandate migration is a reconciled fact” depends on whether the mandate-migration hypothesis from §27 survives. It cannot be assumed merely because the state transition occurred.
10. `S0_SCAN` calls cash “uncommitted” while also assigning it an acquisition-reserve Inventory Role. That is a useful tension to resolve: truly uncommitted Liquidity Reserve vs target-bound Acquisition capital may be semantically distinct.

### Why this specimen is unusually valuable

This definition is the first Principal-supplied specimen that attempts to instantiate most of the locked decision-journey concepts in one coherent technical object:

- Account;
- Portfolio Mandate;
- Inventory Block;
- Inventory Role;
- Operating Program;
- Economic Construction;
- Decision Subject;
- Outcome Stance;
- Policy Rule;
- Constraint;
- Preference;
- Reconciled State/Evidence;
- Alternatives;
- Recommendation;
- Action/transition pressure;
- Execution pressure;
- Reconciled Outcome.

It therefore provides a much stronger falsifier than isolated terminology examples.

### Immediate semantic tests exposed by the definition

#### Program identity vs policy instance

Which properties make something **the Wheel**, and which merely define **this Wheel policy instance**?

Likely pressure points:

- exact DTE/delta bands;
- 50% profit target;
- no-debit-roll rule;
- 20/50 crossover filter;
- protective-put contingency;
- `MIN_PROFIT`;
- event treatment.

A durable Operating Program identity should probably survive some Policy changes without becoming a different program.

#### State machine vs decision journey

The state machine models lifecycle state. The decision journey models how a Recommendation becomes operator Action, Execution, and reconciled transition.

Those should not be silently collapsed.

A more explicit conceptual sequence may be:

```text
state + evidence + governed context
→ Alternatives
→ Recommendation
→ operator selection
→ Action / broker instruction where applicable
→ Execution / external event
→ Evidence
→ reconciled transition
→ new state
```

No implementation design is authorized by this observation.

#### Phase-dependent mandate vs Inventory Role

The definition intentionally claims:

```text
Acquisition → Income → Disposition
```

This is now the strongest specimen for testing whether Portfolio Mandate actually migrates or whether:

- one higher-level mandate persists;
- Inventory Role changes;
- Outcome Stance changes;
- the Operating Program contains phase objectives;
- a Capital Pool/Block purpose changes at narrower scope.

The definition must be used to **falsify** the semantic model rather than to force mandate migration into it.

#### Natural resolution as first-class behavior

PF1/PF2 and PR-W-07 directly encode the GDXJ lesson:

> Do not manufacture activity merely to avoid a pre-accepted outcome.

This provides a formal program-level expression of the Inner Game thesis that WAIT / HOLD / natural resolution can be the prescribed action.

#### Evidence insufficiency

Section 7 explicitly requires **UNRESOLVED** when required evidence is insufficient.

This reinforces the existing distinction:

```text
governed WAIT because sufficient evidence establishes no better action
≠
UNRESOLVED because evidence/context is insufficient to establish the decision
```

### Intake / roadmap disposition

This technical definition remains a specimen/refinement under the existing intake structure:

- **`PL-DEC-BEH`** — precommitment, natural resolution, operator departure, rule-change discipline;
- **`PL-SEM-01`** — Operating Program identity, phase semantics, state/transition/event, Decision Subject, mandate/role, policy/constraint/preference, evidence sufficiency;
- **`PL-DEPLOY`** — Alternatives and Recommendation under program state;
- **`PL-STRAT-01`** — what makes Wheel a distinct admitted Operating Program and which constructions belong;
- **`PL-PORT-01`** — inventory blocks, encumbrance, lots/basis, capital state;
- **`PL-EXEC-01`** — Recommendation→selection→Action→Execution→reconciliation boundary.

No new PL or LVT identity is implied.

### Actor handoff requirement — expanded

Future Kiro/Codex/ChatGPT prompts concerning the Inner Game, governed purpose/context, Portfolio Mandates, Operating Programs, Economic Constructions, Policy Rules, Wheel semantics, strategy/program expansion, prescriptive recommendations, lifecycle policy, performance evaluation, or sell-side bias must explicitly direct actors to reacquire:

- `docs/61-inner-game-governed-prescriptive-decision-discipline-2026-09-24.md`;
- §25 Principal Operating Program survey;
- §26 Principal Economic Construction survey;
- §27 Principal Portfolio Mandate survey;
- §28 Principal Policy Rule survey;
- §29 Principal technical Wheel definition;
- current `PL-DEC-BEH`;
- current `PL-SEM-01` artifacts;
- relevant practitioner-corpus/reconciliation material.

The technical Wheel definition is a Principal-supplied formal specimen. Preserve its unresolved sections and contradictions as research evidence; do not silently complete or repair them in actor prompts.


## 30. Principal Portfolio Mandate ↔ Operating Program mapping survey — 2026-09-24

**Source status:** Principal-supplied independent mapping survey. Preserve as high-value semantic/falsification input; it is **not yet a ratified compatibility matrix, taxonomy, architecture, or implementation authority**.

### Core proposition

The Principal proposes:

> **Portfolio Mandate ↔ Operating Program is n-to-n.**

A Portfolio Mandate can be served by multiple Operating Programs. An Operating Program can serve multiple Portfolio Mandates, potentially at different lifecycle phases.

### Mapping supplied by the Principal

| Portfolio Mandate | Operating Program | Why it fits |
|---|---|---|
| **Income** | **Wheel** | Multi-phase premium harvesting; both assignment transitions pre-accepted as desired outcomes |
| **Income** | **Systematic put-write** | Recurring premium; assignment is the contingent acquisition branch, not a failure |
| **Income** | **Systematic overwrite** | Premium on held shares; upside cap is the explicitly priced cost |
| **Income** | **PMCC program** | Overwrite economics at a fraction of the capital; long-leg decay is the known drag |
| **Income** | **Mechanical delta-neutral premium** | Rules-based short-vol harvesting (45 DTE / manage at 21 specimen); assignment prohibited by policy |
| **Income** | **Defined-risk spread ladder** | Capped-tail short premium; wings bound tail risk |
| **Income** | **Covered strangle program** | Dual premium streams; position sized for the double-assignment branch |
| **Income** | **Diagonal income ladder** | Front-leg decay harvested against persistent long leg; front expiry is renewal, not full resolution |
| **Income** | **Earnings premium harvest** | Event-volatility premium captured with defined-risk constructions, sized per event |
| **Income** | **0DTE premium program** | Same-day decay harvested mechanically; flat by close; edge status disputed |
| **Income** | **Long-dated put-write** | Term-structure premium sold after volatility spikes; distant acquisition is tail branch |
| **Growth / Compounding** | **Systematic accumulation (buy-and-hold)** | Compounding through ownership; governed by allocation and rebalancing rather than option-trading rules |
| **Growth / Compounding** | **Dividend-growth program** | Compounding plus rising income stream; secondary fit to Income |
| **Acquisition** | **Systematic put-write** | Strike = celebration price; premium compensates contingent commitment to buy |
| **Acquisition** | **Long-dated put-write** | Distant acquisition at deep-discount strikes; multi-year patience is the policy |
| **Acquisition** | **Wheel (Phase 1)** | CSP leg is acquisition mechanism; proposed mandate migration to Income on assignment |
| **Disposition** | **Systematic overwrite (exit-strike)** | Strike = exit price; call-away is plan completion rather than unwanted upside loss |
| **Disposition** | **Wheel (Phase 3)** | Covered-call leg disposes inventory at ≥ basis + target; proposed mandate migration on sale |
| **Protection / Hedging** | **Systematic collar program** | Floor on strategic inventory funded by capped upside; retention is the point in this specimen |
| **Protection / Hedging** | **Tail-hedge program** | Rolling long puts; expiry worthless can be good outcome; judged against unhedged non-event |
| **Speculation** | **Asymmetric convexity program** | Recurring small long-vol bets; sized for frequent total loss; judged at portfolio payoff level |
| **Liquidity Reserve** | **Cash-reserve ladder program** | T-bill / money-market ladder; availability itself is the product; sized as governed share of account/capital |
| **Preservation** | **Cash-reserve ladder program** | Same program under different mandate: nominal safety rather than optionality |

### N-to-N structure made explicit

#### One program → many mandates

Principal examples:

```text
Wheel
  → Acquisition
  → Income
  → Disposition
  (phase-dependent)

Systematic put-write
  → Income
  → Acquisition

Systematic overwrite
  → Income
  → Disposition

Cash-reserve ladder
  → Liquidity Reserve
  → Preservation

Dividend-growth
  → Growth / Compounding
  → potentially Income as a secondary fit
```

This is strong pressure against making `OperatingProgram.mandate_id` a simple one-to-one attribute.

#### One mandate → many programs

The survey gives **Income** the densest program set, with eleven supplied mappings.

Principal interpretation:

> **Income is the most crowded mandate, which is why program-level Policy Rules—not mandate labels—do the real governing work.**

This is useful but should be pressure-tested. A mandate can constrain/evaluate purpose while program policy governs mechanics; “do the real governing work” should not be read as making Mandate semantically weak.

### Sparse regions are evidence

The Principal explicitly calls out:

- Growth / Compounding has no options-native Operating Program in this survey;
- options may be guests rather than residents under Growth;
- Speculation has one surveyed program;
- the asymmetry reflects a surveyed program space built heavily around Income and Protection rather than a claim that the global program universe is actually sparse.

This is particularly important for the sell-side-bias investigation. Do **not** interpret the mapping density as evidence that Income deserves greater product priority or that long-premium/growth/speculation programs are intrinsically less legitimate.

### Integrity note — Program vs (Program, Phase)

The Principal identifies a key modeling issue:

> Rows such as **Wheel (Phase 1)** suggest that the mapping key may really be **(Program, Phase)** rather than Program alone for multi-mandate programs. If Wheelwright needs a clean key, phase-qualified programs are the honest unit.

This is a high-value semantic hypothesis, but it should be challenged before introducing a `ProgramPhase` entity or key.

Possible interpretations include:

1. **Program ↔ Mandate is genuinely n-to-n, with phase as association context.**
2. **(Program, Phase) ↔ Mandate** is the actual semantic relationship.
3. **Program remains under one higher-level Mandate**, while phase changes Inventory Role / Outcome Stance / local objective.
4. **Mandate binds to Inventory Block/Capital Pool over effective time**, and Program phase merely triggers migration.
5. The current concept of Portfolio Mandate is too coarse and is mixing capital purpose with phase objective.

No implementation choice follows yet.

### Why phase qualification matters

Consider the same Wheel instance:

```text
S1_PUT_OPEN
  proposed Mandate: Acquisition
  construction: CSP
  desired transition: assignment → shares

S2_STOCK_HELD / ordinary S3_CALL_OPEN
  proposed Mandate: Income
  construction: long stock / covered call
  desired activity: premium production

S3_CALL_OPEN at governed exit strike
  proposed Mandate: Disposition
  construction: covered call
  desired transition: call-away → cash
```

If the mapping were only:

```text
WHEEL → Income
```

the model could lose the purpose change that affects strike selection and outcome evaluation.

If the mapping were instead:

```text
WHEEL → {Acquisition, Income, Disposition}
```

without phase/effective-time context, Wheelwright could still fail to determine **which mandate governs this Decision Subject now**.

Therefore the important decision-time question is not merely:

> Which mandates can this program serve?

It is:

> **Which governed mandate is applicable to this Decision Subject / Inventory Block at this effective time, and why?**

### Cross-product is not implied

The n-to-n relationship must not become a Cartesian compatibility assumption.

For example:

- Tail Hedge ↔ Protection does not imply Tail Hedge ↔ Income.
- Wheel ↔ Acquisition does not mean every Wheel state is Acquisition-governed.
- Systematic overwrite ↔ Disposition may require exit-strike policy; an ordinary overwrite instance need not be a Disposition program.
- Cash-reserve ladder ↔ Preservation and Liquidity Reserve may use the same mechanics but different success criteria and release rules.

Mappings therefore require evidence/governance, not mere structural compatibility.

### New Operating Program specimens introduced by this survey

The mapping adds several program candidates not explicit in §25:

- **Systematic accumulation / buy-and-hold**
- **Dividend-growth program**
- **Asymmetric convexity program**
- **Cash-reserve ladder program**

These are preserved as Principal-supplied Operating Program candidates for falsification. Their inclusion is important because it broadens the test bench beyond options-income programs and reduces the risk that the ontology merely describes the system's historical sell-side center of gravity.

They should be tested against the §25 Operating Program criterion: durable, repeatable, rule-governed process spanning states/positions rather than a construction label or mandate synonym.

### High-value controlled specimens

#### Same program, different mandate — systematic put-write

```text
Income:
  optimize qualified premium production subject to willingness-to-own

Acquisition:
  optimize acceptable acquisition economics;
  premium compensates waiting/commitment
```

Same recurring short-put mechanics, different governing objective and success criterion.

#### Same program, different mandate — systematic overwrite

```text
Income:
  premium/upside tradeoff + repeatability

Disposition:
  strike = governed exit target
  call-away = successful disposition
```

Same covered-call construction/program family; different strike policy and outcome interpretation.

#### Same program, different mandate — cash-reserve ladder

```text
Liquidity Reserve:
  optimize availability / optionality subject to safety/yield

Preservation:
  optimize nominal safety subject to liquidity/yield
```

This is an especially useful falsifier for whether Liquidity Reserve and Preservation truly deserve separate Mandate identities.

#### Same mandate, different programs — Income

Hold mandate constant and compare:

```text
Wheel
Systematic put-write
Systematic overwrite
PMCC
Mechanical delta-neutral premium
Defined-risk spread ladder
Covered strangle
Diagonal income ladder
Earnings premium harvest
0DTE premium
Long-dated put-write
```

This tests what Program contributes after purpose is held constant: state topology, eligible constructions, lifecycle rules, assignment stance, renewal/resolution semantics, risk topology, cadence, and policy.

### Semantic relationship candidate

A more faithful exploratory relation than a direct Program field may be:

```text
Portfolio Mandate
        ↕
[governed association:
 scope + phase/state applicability + effective time + authority/provenance]
        ↕
Operating Program
```

At decision time:

```text
Account
+ Capital Pool / Inventory Block
+ Operating Program instance
+ current program state/phase
+ effective-time governance
        ↓
applicable Portfolio Mandate
        ↓
Inventory Role / Outcome Stance / Policy applicability
        ↓
Alternatives / consequences / Recommendation
```

This is a semantic research sketch, **not ratified architecture**.

### Sell-side-bias consequence

The mapping materially strengthens the sell-side-bias investigation.

The current sample is visibly asymmetric:

- Income has many mature options-native programs;
- Protection has established long-option/collar specimens;
- Growth, Speculation, Liquidity Reserve, and Preservation have fewer surveyed programs;
- the new non-income programs help expose whether Wheelwright's Alternative generation is globally biased toward premium receipt.

The correct research response is **not** to artificially balance the taxonomy. It is to determine whether sparse areas reflect:

1. the actual bounded Wheelwright product mission;
2. historical implementation bias;
3. practitioner-corpus sampling bias;
4. legitimate absence of useful programs;
5. missing research.

### Intake / roadmap disposition

This mapping strengthens existing concerns rather than creating a new identity:

- **`PL-SEM-01`** — n-to-n Mandate↔Program relationship, phase/effective-time applicability, association provenance;
- **`PL-DEC-BEH`** — purpose should be explicit and stable enough to prevent mandate shopping under pressure;
- **`PL-DEPLOY`** — applicable mandate/program pair affects Alternative generation/comparison;
- **`PL-STRAT-01`** — broadened program candidate set and admission governance;
- **`PL-PORT-01`** — mandate may need binding to actual Capital Pool / Inventory Block over time.

It also strengthens existing `LVT-BET-STRATEGIES`, `LVT-BET-LIFECYCLE-POLICY`, `LVT-BET-LIFECYCLE-CHOICES`, and `LVT-BET-RISK-PROFILES`.

No new PL or LVT identity is implied.

### Actor handoff requirement — expanded

Future Kiro/Codex/ChatGPT prompts concerning the Inner Game, governed purpose/context, Portfolio Mandates, Operating Programs, Economic Constructions, Policy Rules, Wheel semantics, strategy/program expansion, prescriptive recommendations, lifecycle policy, performance evaluation, or sell-side bias must explicitly direct actors to reacquire:

- `docs/61-inner-game-governed-prescriptive-decision-discipline-2026-09-24.md`;
- §25 Principal Operating Program survey;
- §26 Principal Economic Construction survey;
- §27 Principal Portfolio Mandate survey;
- §28 Principal Policy Rule survey;
- §29 Principal technical Wheel definition;
- §30 Principal Portfolio Mandate ↔ Operating Program mapping;
- current `PL-DEC-BEH`;
- current `PL-SEM-01` artifacts;
- relevant practitioner-corpus/reconciliation material.

The mapping is Principal-supplied falsification input. Do not silently turn it into a schema, compatibility matrix, exhaustive program universe, or ratified phase model.


## 31. Principal falsification run — at what scope does Portfolio Mandate bind? — 2026-09-24

**Source status:** Principal-supplied falsification analysis and schema recommendation. Preserve as high-value semantic research evidence. The falsification results and proposed `DecisionAspect` solution are **not yet ratified ontology, architecture, schema, or implementation authority**.

### Method

The Principal's test:

> **A scope hypothesis predicts that each entity at that scope carries exactly one mandate. One counterexample falsifies.**

The §30 Mandate↔Operating Program mapping is used as the evidence set.

### H1 — Mandate is single-valued at PROGRAM scope

**Principal verdict: FALSIFIED.**

Counterexamples:

- Wheel → `{Income, Acquisition, Disposition}`
- systematic put-write → `{Income, Acquisition}`
- systematic overwrite → `{Income, Disposition}`
- cash-reserve ladder → `{Liquidity Reserve, Preservation}`

Four of thirteen surveyed programs are multi-mandate under the supplied mapping.

Principal consequence:

> Forcing a single-valued Program mandate can misclassify governed decisions. Example: filing the Wheel CSP leg simply under Income can license premium-chasing over ownership discipline, contrary to the acquisition/ownership gate.

### H2 — Mandate is single-valued at PROGRAM-PHASE scope

**Principal verdict: FALSIFIED.**

#### Counterexample 1 — Wheel `S3_CALL_OPEN`

- strike set at governed exit target → call-write decision evaluated under **Disposition**;
- strike optimized for premium → evaluated under **Income**.

Principal inference:

> Same Program, same phase, different mandate frame. Phase alone does not determine the evaluation frame; strike-selection intent does.

#### Counterexample 2 — Wheel `S1_PUT_OPEN` entry

The single apparent decision “open CSP” is jointly gated by:

- `willing_to_own` → **Acquisition** frame;
- premium adequacy → **Income** frame.

Principal inference:

> One phase and one apparent decision can contain multiple simultaneous mandate frames. Program-phase therefore remains too coarse.

### H3 — Mandate is single-valued at CAPITAL-POOL scope

**Principal verdict: NOT FALSIFIED, BUT VACUOUS.**

Test case:

- overwrite written on strategic Growth-mandate shares;
- shares can remain in a Growth pool while an Income program places a call-writing encumbrance over them.

The Principal notes that the same economic inventory can then be subject to rules associated with multiple logical pools/overlays, e.g. retention plus overwrite.

Principal criticism:

> If Capital Pools can be subdivided arbitrarily until every observation fits, the hypothesis survives by re-pooling rather than prediction. At the limit, one logical pool per decision becomes decision scope under another name.

Therefore H3 is not treated as evidentially useful merely because no counterexample was found.

### H4 — Mandate is single-valued at INVENTORY-BLOCK scope

**Principal verdict: NOT FALSIFIED, BY CONSTRUCTION / CIRCULAR.**

The working ontology's own examples can individuate blocks by role/purpose, e.g.:

- strategic SPY shares;
- shares allocated to an overwrite;

even when the physical shares overlap or derive from the same holding.

Principal criticism:

> If Inventory Block identity already incorporates role/mandate, then claiming Mandate is single-valued per block is true by definition. The scope claim relocates the problem to “what individuates a block?” rather than answering where Mandate actually governs a decision.

### Verdict table

| Hypothesis | Scope | Principal verdict | Falsifier / weakness |
|---|---|---|---|
| **H1** | Program | **Falsified** | four multi-mandate programs in supplied mapping |
| **H2** | Program-phase | **Falsified** | S3 strike-intent splits Income/Disposition; S1 entry contains Acquisition + Income frames |
| **H3** | Capital Pool | **Unfalsified, vacuous** | arbitrary re-pooling can absorb observations; weak predictive content |
| **H4** | Inventory Block | **Unfalsified, circular** | block can be individuated by mandate/role; true by construction |

### Principal surviving hypothesis — Decision Aspect scope

The Principal concludes:

> **Mandate binds at decision-aspect scope: each governed decision aspect (strike selection, premium acceptance, sizing, exit targeting, etc.) is evaluated under exactly one frame, while a compound decision can contain multiple single-frame aspects.**

Example decomposition for Wheel put entry:

```text
Decision: OPEN CSP?

Aspect: ownership / strike acceptability
  evaluated under → Acquisition

Aspect: premium adequacy
  evaluated under → Income

Aspect: sizing / capital preservation
  potentially evaluated under → Preservation or another governing risk frame
```

Under this interpretation, the n-to-n Mandate×Program relation from §30 is not fundamental. It is a projection:

```text
Decision Aspect × Mandate
        ↓ aggregate/project over decisions
Program × Mandate
```

Principal interpretation:

> **The observed n-to-n-ness is the algebraic signature of aggregating over too coarse a key. It is evidence that Program is the wrong binding scope, not necessarily a primitive fact about Programs.**

### Principal schema recommendation

The Principal recommends an exploratory relationship:

```text
Decision
  --[evaluated_under, scoped by decision aspect]-->
Portfolio Mandate
```

with many-to-many behavior at the compound-decision level and single-frame semantics at the decomposed aspect level.

Policy Rules declare which frame governs which aspect, e.g.:

```text
strike selection   → Acquisition
premium acceptance → Income
sizing             → Preservation
exit targeting     → Disposition
```

Program-, phase-, Capital-Pool-, and Inventory-Block-level mandate sets would then be **derived unions over governed decisions/aspects**:

```text
Program mandates     = union(mandates governing its decision aspects)
Phase mandates       = union(mandates governing decision aspects active in phase)
Pool mandate-set     = union(mandates governing decisions over pool)
Block mandate-set    = union(mandates governing decisions over block)
```

Principal principle:

> **Those aggregate mandate sets are descriptive, never prescriptive.**

### Why this matters to the locked decision-journey spine

This falsification directly challenges the current row:

> **Portfolio Mandate — what this capital is fundamentally for**

If the Decision-Aspect hypothesis survives, that wording may be too coarse. A single capital quantity can participate in a compound decision evaluated through multiple legitimate frames.

This does **not yet authorize changing the locked 17-row spine**. Instead it creates a concrete falsification obligation for `PL-SEM-01`:

1. Is **Portfolio Mandate** actually the correct name if it governs decision aspects rather than whole portfolios/capital pools?
2. Is **Decision Aspect** a real semantic concept or merely decomposition of Policy evaluation?
3. Does every aspect truly have exactly one mandate, or can one aspect itself require multiple simultaneous objective frames?
4. Is **Preservation** in “sizing → Preservation” actually a Mandate, or is risk preservation a Constraint/objective that should not be elevated?
5. Are Acquisition and Disposition better understood as **frame-mandates**, local objectives, Outcome Stances, or lifecycle intents rather than Portfolio Mandates?
6. Does Growth/Compounding behave the same way under aspect decomposition, or is this result peculiar to options-income specimens?
7. Can a mandate be a purpose of capital and an evaluation frame without collapsing two semantic roles into one term?

### Strong adversarial tests still required

The Principal run is powerful but not conclusive because the evidence set was itself generated from the prior Principal mapping. Future actors should try to falsify the surviving Decision-Aspect hypothesis with independent specimens.

#### Test A — one aspect, two legitimate frames

Find a single indivisible decision aspect whose correct evaluation requires two mandates simultaneously. If found, the “exactly one frame per aspect” claim fails or aspect decomposition is still too coarse.

#### Test B — mandate without a decision

Ask whether capital can have a durable mandate while no decision is currently being evaluated. If yes, Mandate may still be an independently governed purpose, with decision-aspect evaluation inheriting from it rather than constituting it.

#### Test C — policy chooses frame vs governance establishes frame

The recommendation says Policy Rules declare the frame per aspect. Test whether that is semantically correct. A Policy may **apply because** capital has a governed purpose rather than **create** that purpose. Otherwise Policy could manufacture Mandate.

#### Test D — historical provenance

If an operator changes the frame from Acquisition to Income after a put becomes uncomfortable, does the system recognize a legitimate governance change or mandate shopping? This requires effective-time authority independent of the current decision calculation.

#### Test E — same aspect across different programs

Hold the decision aspect constant, e.g. “strike acceptability,” across Wheel, put-write, overwrite, collar, and acquisition program. Determine whether the same Mandate semantics actually transfer.

#### Test F — non-options programs

Use systematic accumulation, dividend growth, tail hedge, asymmetric convexity, and cash-reserve ladder. If Decision Aspect only appears necessary in option-entry decomposition, it may be a local modeling artifact rather than universal ontology.

### Important distinction: binding vs inheritance

A possible reconciliation is:

```text
governed capital purpose exists durably
        ↓ inherited by default
Decision Aspect
        ↓ may refine/select applicable evaluation frame
Recommendation
```

This would distinguish:

- **where Mandate is governed/declared**, from
- **where Mandate becomes decision-relevant/applied**.

The Principal falsification primarily attacks **single-valued application scope**. It may not yet prove that durable mandate identity itself exists only at Decision Aspect.

That distinction should be preserved in future review.

### Implication for the Wheel technical specimen

The §29 phase-migration model:

```text
Acquisition → Income → Disposition
```

is now explicitly under stronger challenge.

Under the Principal Decision-Aspect hypothesis, the Wheel might instead simultaneously apply:

```text
Acquisition → ownership / strike-acceptability aspect
Income      → premium-adequacy aspect
Disposition → exit-target aspect
Preservation / risk frame → sizing aspect
```

as applicable, without requiring the entire Program phase or Inventory Block to “become” one Mandate.

This may resolve the §29 contradiction between a multi-mandate phase model and an “Income-mandate Wheel,” but that resolution is **not yet accepted**.

### Implication for the Inner Game

Decision-aspect binding could provide a stronger defense against mandate shopping:

Instead of asking the operator to choose one global label that can be changed to rationalize a desired trade, Wheelwright could preserve pre-governed evaluation frames for specific questions:

- “Would I celebrate owning at this effective price?”
- “Is the premium adequate?”
- “Does this size preserve governed risk capacity?”
- “Is this strike an acceptable exit?”

The operator cannot make inadequate premium acceptable by relabeling Acquisition as Income, nor make an unacceptable ownership price acceptable by pointing to premium.

This is a direct expression of the thread's central thesis:

> **Make the disciplined process the path of least cognitive resistance.**

### Intake disposition

This falsification materially strengthens:

- **`PL-SEM-01`** — Mandate scope, Decision decomposition, inheritance vs application, association cardinality, temporal governance;
- **`PL-DEC-BEH`** — prevents mandate shopping / objective drift under pressure;
- **`PL-DEPLOY`** — compound Alternative evaluation may require multiple governed frames;
- **`PL-PORT-01`** — challenges using Pool/Block identity as the primitive mandate carrier;
- **`PL-STRAT-01`** — Program mandate labels become descriptive summaries rather than sufficient governing semantics.

No new PL or LVT identity is implied yet. `DecisionAspect` is a **candidate semantic concept under falsification**, not a ratified entity.

### Actor handoff requirement — expanded

Future Kiro/Codex/ChatGPT prompts concerning Portfolio Mandate scope, Inner Game, governed purpose/context, Operating Programs, Policy Rules, Wheel semantics, recommendation composition, or sell-side bias must explicitly direct actors to reacquire:

- `docs/61-inner-game-governed-prescriptive-decision-discipline-2026-09-24.md`;
- §§25–30 Principal surveys and technical Wheel specimen;
- **§31 Principal Mandate-scope falsification run**;
- current `PL-DEC-BEH`;
- current `PL-SEM-01` artifacts;
- relevant practitioner-corpus/reconciliation material.

Actors must challenge the surviving Decision-Aspect hypothesis rather than treat it as the answer. In particular, distinguish **where a Mandate is durably governed** from **where it is applied to evaluate a decision**.


## 32. Independent Muse falsification — where does an investment mandate bind? — 2026-09-24

**Source status:** Independent Muse challenge result supplied by the Principal. Deliberately produced without Wheelwright context. Preserve as external adversarial research input and falsification evidence. It is **not yet ratified ontology, architecture, policy, schema, or Product authority**.

Muse explicitly reverses two earlier positions:
- prior support for Decision-Aspect mandate binding;
- prior support for Acquisition / Disposition as mandates.

### Executive result

Muse rejects the hypothesis:

> **Each governed Decision Aspect is evaluated under exactly one Mandate.**

The rejection is structural, not cosmetic:

1. If Decision Aspect is analyst-defined, troublesome decisions can always be subdivided until the claim becomes true. The hypothesis is then unfalsifiable.
2. If Decision Aspect is operationally or independently individuated, concrete decisions remain jointly governed by multiple concerns. The hypothesis is then false.

Muse therefore concludes that **Mandate should not currently be treated as a universal decision-time evaluator**.

The smallest surviving model proposed by Muse is:

```text
Governance
  ├── durable allocation purpose / recorded standing intent
  └── Policy + Constraints + Preferences + Objectives

Policy + Constraints + Preferences + Objectives + Evidence
  ↓
Alternative evaluation
  ↓
Recommendation
```

Under this model, Mandate may explain **why** decision rules exist without itself appearing in every evaluation loop.

### Attack 1 — Decision Aspect lacks a non-circular individuation rule

Muse tests three possible individuation rules.

#### (a) Linguistic / analyst individuation

> “Aspects are the questions the operator asks.”

**Result: fails.**

An analyst can always subdivide a decision into smaller questions until every fragment is associated with one mandate. Exactly-one-mandate-per-aspect becomes true by subdivision.

Muse's conclusion:

> A claim rescued by arbitrary subdivision is unfalsifiable and semantically empty.

#### (b) Operational individuation

> “One aspect = the domain of one Policy Rule.”

**Result: falsifies the hypothesis.**

Counterexamples:

- sizing simultaneously changes premium production, acquisition exposure, tail exposure, and ruin risk;
- entry qualification can jointly test ownership desirability and premium adequacy.

Under operational individuation, one aspect can carry multiple mandate-like concerns.

#### (c) Independent-variation individuation

> Vary X while holding Y fixed; X's criterion must not reference Y.

Muse argues the CSP strike-selection specimen fails:

- a strike rejected at one premium may be accepted at a sufficiently different premium;
- therefore strike acceptability and premium adequacy can interact through substitution rather than independent conjunction.

The decomposition:

```text
strike  → Acquisition
premium → Income
```

can therefore lose the actual joint trade-off.

#### Strongest single counterexample: sizing

Muse:

> **Size scales every consequence at once — income produced, acquisition commitment, tail exposure. There is no coherent single-mandate evaluation of “is this size right”; sizing is where mandates collide, not where they separate.**

The prior example `sizing → Preservation` is judged arbitrary.

### Attack 2 — Mandates can exist when no decision exists

Muse uses:

- earmarked acquisition cash;
- dry powder;
- capital reserves;
- protected strategic holdings during idle periods.

No transaction must be actively contemplated, yet the capital remains governed.

Muse therefore forces a distinction:

```text
Declared mandate / standing purpose
  durable
  recorded
  persists during inactivity

Applied frame
  transient
  used during a specific decision
```

Muse's causal claim:

> Decision aspects do not create durable mandate binding. If anything, decision evaluation inherits from prior declared governance.

This means the Decision-Aspect hypothesis, even if useful as an application mechanism, cannot explain the existence of standing purpose.

### Attack 3 — Acquisition and Disposition are not Mandates

**Muse reverses its earlier verdict.**

Muse introduces a telic / atelic category test:

- **Income / Growth** are atelic: ongoing purposes without a natural completion event.
- **Acquisition / Disposition** are telic: completable objectives that terminate when the desired transition occurs.

Example:

- Acquisition is satisfied when the desired asset is acquired.
- Disposition is satisfied when the asset is sold.
- Income does not “finish” merely because one premium cycle succeeds.

Muse argues that this categorical distinction is stronger than the earlier test “does it change decision rules?”

Muse also sees semantic redundancy:

- “acquisition through assignment desired” can be represented by **Outcome Stance**;
- “disposition inventory” can be represented by **Inventory Role**.

**Muse reclassification:**

> **Acquisition and Disposition are Objectives / desired state transitions, not Mandates.**

This directly challenges:
- §27 Principal Portfolio Mandate survey;
- §29 Wheel phase-mandate migration;
- §30 Mandate↔Program mapping.

### Attack 4 — Preservation is not a Mandate

Muse argues:

> “Do not blow up” is a boundary, not a purpose.

And if Preservation applies to essentially all capital, it becomes non-discriminating.

T-bill reserve specimen:

```text
objective:
  earn acceptable yield

constraints:
  remain available on demand
  avoid nominal loss
```

This requires no separate Preservation Mandate.

Muse therefore demotes **Preservation** to a **Constraint family** such as:

- nominal-loss bounds;
- survivability;
- portfolio risk limits;
- other capital-preservation boundaries.

The prior example `sizing → Preservation` is explicitly rejected as a category error.

### Attack 5 — outside options, Decision-Aspect binding becomes artificial

Muse tests:

- passive index accumulation;
- systematic rebalancing;
- trend following;
- dividend growth;
- tail hedging;
- cash / T-bill laddering.

Results:

#### Passive accumulation / systematic rebalancing / trend following

These can often be described as direct Policy execution:

```text
buy $X monthly
restore target allocation
long above 200DMA
```

The operative evaluation frame is Policy compliance, not Mandate decomposition.

#### Dividend-growth investing

The thesis can be inherently dual:

> “Will the dividend grow?”

Income and Growth are intertwined in the thesis rather than cleanly separable into independent mandate aspects.

#### Tail-hedge budgeting

A rule such as “spend 1% NAV/year on hedges” looks naturally Constraint- or Policy-governed, not Mandate-governed.

#### Cash / T-bill laddering

Rung sizing can jointly trade:
- yield;
- liquidity / availability;
- maturity risk.

Decomposing:

```text
maturity → Liquidity
yield    → Income
```

can fail to represent the actual Pareto trade-off.

Muse's broader conclusion:

> **Mandate is neither necessary nor sufficient as a universal decision-time frame.**

### Attack 6 — exactly-one-Mandate was an unsupported premise

Examples:

- T-bill held for safety + liquidity + yield;
- strategic stock held for compounding + dividends + collateral + future charitable transfer.

Muse notes these “purposes” are heterogeneous:

- collateral is a use;
- charitable transfer is a terminal objective;
- compounding is an ongoing purpose;
- dividend income is a recurring economic contribution.

Forcing all into one category called Mandate creates artificial conflict.

Muse's simpler representation is multiple direct evaluation criteria rather than mandatory single-valued mandate binding.

### Attack 7 — hierarchy dissolves level confusion

Muse proposes a trimmed three-level hierarchy:

```text
Allocation Purpose
  what governed capital pools are for
  stable
  declared
  recorded

Program Edge Thesis
  what the recurring program exploits

Decision Machinery
  predicates / vetoes
  Preferences / tie-breakers
  Constraints / bounds
  recorded telic Objectives
```

Muse argues this is not mere renaming because it resolves concrete disputes:

- Acquisition → Objective level;
- Disposition → Objective level;
- Income → Allocation Purpose level;
- Preservation → Constraint level.

Muse's provisional conclusion:

> **Allocation purpose is the only level where the word “Mandate” currently earns its keep.**

### Attack 8 — causal direction between Mandate and Policy is backwards or sibling-based

Muse rejects:

```text
Policy → Mandate
```

because changing a delta band changes decisions but does not change what capital is fundamentally for.

Muse also rejects a simple deterministic:

```text
Mandate → Policy
```

because declaring Acquisition or Income does not uniquely determine a delta band, sizing limit, tenor, or profit target.

Muse instead proposes:

```text
Principal / higher-order governance situation
    ├──→ Mandate declaration
    └──→ Policy Rules
```

Mandate and Policy are siblings derived from governance rather than one causing the other.

Muse also warns that if Policy creates decision aspects and then Mandates are assigned to those aspects to explain the Policy's outputs, the reasoning becomes circular:

```text
Policy
  → creates aspects
  → aspects receive Mandates
  → Mandates supposedly explain Policy evaluation
```

### Attack 9 — temporal integrity is the strongest attack on pure decision-time binding

Specimen:

1. A put is sold because ownership at the effective strike was explicitly accepted.
2. The underlying falls sharply.
3. The operator says:
   > “Actually, this was an Income trade. I don't want the shares.”

Muse says distinguishing legitimate reconsideration from hindsight rationalization requires durable facts that predate the adverse move:

- timestamped entry intent;
- whether `willing_to_own(strike)` actually passed;
- changed evidence vs changed preference;
- re-label test: would the newly claimed purpose/program have selected this strike?
- policy governing when intent may be revised.

Muse's strongest criticism:

> **A pure transient decision-time binding model has no memory. If today's frames are simply re-derived, it cannot distinguish plan abandonment from plan execution.**

Therefore any acceptable model needs durable, timestamped intent / purpose / governance independent of the current evaluation.

### Attack 10 — compound Recommendation does not require Mandates

#### Case A

```text
ownership acceptable
premium inadequate
sizing acceptable
liquidity acceptable

→ WAIT / NO TRADE
```

Reason: premium floor predicate vetoes.

#### Case B

```text
premium excellent
ownership unacceptable
sizing acceptable
liquidity acceptable

→ WAIT / NO TRADE
```

Reason: ownership predicate vetoes.

Muse argues that predicates alone reproduce these behaviors.

Marginal cases can potentially use existing Preference semantics:

> acquisition satisfaction outranks premium maximization when marginal.

Therefore Mandate may do work at **design/governance time** but be explanatorily idle in routine decision evaluation.

---

## Muse competing-model table

| Model | Strongest support | Strongest counterexample / weakness | Muse result |
|---|---|---|---|
| One Mandate / Program | pure Tail-Hedge / simple program specimens | Wheel / put-write / overwrite / cash ladder | falsified |
| One Mandate / Program Phase | apparently homogeneous lifecycle phases | S3 strike-intent split; S1 mixed concerns | falsified |
| One Mandate / Capital Pool | earmarked capital with standing purpose | overlap / arbitrary re-pooling | survives weakly; risks vacuity |
| One Mandate / Inventory Block | logical block examples | block may be individuated by mandate | circular / reject as vacuous |
| One Mandate / Decision Aspect | CSP appears decomposable | sizing; joint strike/premium tradeoff; individuation dilemma | rejected |
| Multiple simultaneous Mandates | T-bill and strategic-stock multi-purpose examples | explains everything trivially | too permissive / vacuous if unrestricted |
| Durable capital purpose + decision criteria | standing intent, inaction, hindsight policing | multi-purpose capital remains unresolved | survives strongly |
| Hierarchical purposes | resolves category confusion | risk of level proliferation | promising diagnostic |
| No Mandate in decision loop | veto cases; rebalancing; trend following | marginal case may still reveal mandate effect | strongest current Muse model; falsifiable |

---

## Muse final deliverable

### A. What Muse says was actually falsified

Muse reports as falsified:

1. single Mandate at Program scope;
2. single Mandate at Program-Phase scope;
3. exactly-one-Mandate-per-Decision-Aspect under any non-circular individuation rule;
4. requirement that Mandate must bind somewhere in the routine decision loop.

Muse also concludes:
- Acquisition / Disposition should be demoted from Mandates to Objectives;
- Preservation should be demoted from Mandate to Constraint family.

**Reconciliation warning:** the last two are strong category / parsimony arguments, not as cleanly falsified by counterexample as H1/H2/Decision-Aspect. They require independent challenge before Wheelwright adopts them.

### B. What survived

Muse preserves:

- durable declared standing purpose;
- design-time role for purpose explaining why Policy exists;
- temporal integrity requirement;
- Policy-as-frame cases;
- hierarchy / level-confusion diagnosis.

### C. Muse's smallest current semantic model

```text
Allocation Mandate
  durable
  recorded
  capital-budget level
  “what this pool is for”

Program Edge Thesis
  what recurring edge / process the program exploits

Decision Machinery
  predicates
  Preferences
  Constraints
  recorded telic Objectives

Design Rationale
  explains why the Policies exist
  need not be evaluated on every decision tick
```

Under this model, no Mandate entity is required inside the routine decision-evaluation loop.

### D. Muse terminology recommendations

- **Mandate** → restrict to allocation-level capital purpose.
- **Objective** → telic/completable desired transition, e.g. acquire / dispose / donate.
- **Purpose** → atelic/ongoing, e.g. Income / Growth.
- **Intent** → split durable recorded intent from transient current inclination.
- **Policy** → examine whether qualification predicates, Preferences, Constraints, and other mechanisms are being conflated.
- **Acquisition / Disposition** → Objective / possibly Outcome Stance, not Mandate.
- **Preservation** → Constraint family, not Mandate.
- **Inventory Role** → retain.

### E. Strongest remaining falsifier for Muse's preferred model

Muse proposes the following controlled test:

```text
Hold constant:
  Reconciled State / Evidence
  candidate Alternative
  Policy predicates
  Constraints
  Preferences
  recorded Objectives
  Program
  execution assumptions

Change only:
  declared allocation Mandate
```

Concrete specimen:

```text
same CSP
same ownership predicate
same premium predicate
same sizing
same liquidity
same objective
same Preferences / Constraints

Operator A declared allocation Mandate: Income
Operator B declared allocation Mandate: Acquisition
```

Question:

> **Do the governed Recommendations legitimately differ?**

If **yes**, and the difference cannot be represented as a Policy / Preference / Constraint / Objective difference, then Mandate has irreducible decision-time explanatory power and Muse's “no Mandate in the loop” model fails.

If **no**, the case strengthens that Mandate belongs at governance/design/provenance scope rather than routine decision evaluation.

### F. Muse confidence

**High confidence:**
- Program and Program-Phase single-valued binding fail.
- exactly-one-per-Decision-Aspect is false or unfalsifiable depending on individuation.
- temporal integrity requires durable recorded intent.
- Policy-as-frame cases exist.

**Provisional:**
- no-Mandate-in-decision-loop model;
- Mandate restricted to allocation level;
- trimmed hierarchy.

**Unresolved:**
- whether allocation Mandate has independent decision-time effect beyond Policy/Preference/Constraint/Objective;
- how to represent genuinely multi-purpose capital without returning to vacuous multiple-mandate semantics;
- whether Program Edge Thesis deserves semantic identity or is only explanatory documentation.

---

## ChatGPT analysis of the Muse result

### 1. The Decision-Aspect survivor from §31 is no longer the leading explanation

The strongest reason is not merely that Muse found another counterexample. It found a **meta-falsification problem**:

> If the unit of analysis can be subdivided until the proposition becomes true, the proposition is not doing domain work.

This directly attacks the semantic legitimacy of `DecisionAspect` as a carrier for exactly one Mandate.

The burden of proof is now on any future actor who wants to retain `DecisionAspect`:

- provide an individuation rule independent of Mandate;
- show that the rule is operationally meaningful;
- show that the resulting aspects remain single-frame under adversarial specimens;
- show that the concept adds explanatory power beyond Policy predicates / Constraints / Preferences / Objectives.

Until that occurs, `DecisionAspect` should remain an unratified research concept.

### 2. The result separates durable governance from runtime evaluation more cleanly

The earlier discussion blurred:

```text
what capital is for
```

with:

```text
what criteria evaluate this Alternative now
```

Muse shows these may be different semantic jobs.

A durable standing purpose can explain:

- why cash stays idle;
- why a holding is retained;
- why a reserve exists;
- why a particular family of Policy Rules was adopted;

without needing to be re-evaluated as a frame on every decision tick.

This creates a stronger two-layer research model:

```text
GOVERNANCE / DESIGN TIME
  declared purpose
  program choice
  Policy design
  risk boundaries
  recorded intent
  amendment rules

RUNTIME DECISION TIME
  state/evidence
  applicable predicates
  Constraints
  Preferences
  Objectives
  Alternatives
  consequences
  Recommendation
```

This is not ratified architecture, but it is now a serious contender.

### 3. Temporal integrity is strengthened, not weakened, by removing Mandate from the runtime loop

The core Inner Game requirement remains:

> The system must know what the operator committed to before discomfort arrived.

That can be preserved by durable provenance even if Mandate is not directly consulted during every Recommendation.

A possible semantic split is:

```text
Allocation Purpose / Mandate
  durable governance provenance

Recorded Intent / Objective
  position/program-specific commitment
  effective-time scoped

Policy
  mechanical decision rule

Current Recommendation
  result of applying Policy to current evidence
```

This may be cleaner than allowing the operator to choose a current “frame” at decision time.

### 4. Acquisition / Disposition now need categorical re-review

Muse's telic / atelic distinction is powerful because it asks a different question than the earlier admission test.

Earlier:

> Does Acquisition / Disposition change decision rules and success criteria?

Muse:

> Is it the same *kind of thing* as Income / Growth?

Those are not equivalent tests.

A concept can be important and decision-relevant without deserving the same ontology type.

Therefore future review should explicitly test:

```text
Income / Growth
  ongoing purpose?

Acquisition / Disposition
  completable objective?

Protection
  ongoing purpose, objective, or service relationship?

Liquidity Reserve
  purpose or Inventory Role?

Preservation
  purpose or Constraint family?
```

No reclassification is authorized yet, but the old mandate list is reopened.

### 5. Preservation receives especially strong reduction pressure

Muse's challenge is compelling:

If the semantic model already has:

- capital-risk Constraints;
- nominal-loss Constraints;
- liquidity Constraints;
- concentration Constraints;
- survivability / drawdown controls;

then introducing Preservation as an additional Mandate may duplicate rather than explain those rules.

A future falsifier should seek a case where:

> **Preservation as a declared purpose changes a legitimate Recommendation while all relevant Constraints, Preferences, Objectives, and Policies remain identical.**

If no such case exists, Preservation likely does not earn independent Mandate identity.

### 6. Policy Rule may itself be too coarse

Muse indirectly exposes another issue.

Current research uses `Policy Rule` for:

- qualification predicates;
- lifecycle transitions;
- vetoes;
- profit targets;
- roll conditions;
- assignment rules;
- drawdown breakers;
- record-keeping;
- sometimes Preference-like ordering.

That may be appropriate as a governance umbrella, but the decision machinery may need to distinguish the **mechanism** a rule instantiates:

```text
Predicate / Qualification
Constraint / Boundary
Preference / Ordering
Objective / Target
Transition Rule
Reconsideration Rule
Record-Keeping / Provenance Rule
Amendment Rule
```

This does not require creating seven new ontology entities. It means future semantic work should not assume all Policy Rules have the same computational or normative role.

### 7. The strongest next experiment is now exceptionally clean

Muse's proposed controlled test is the right next falsifier:

> **Hold all decision machinery constant and vary only declared Mandate.**

This is much better than arguing terminology.

If Recommendation changes, Mandate has irreducible runtime semantics.

If Recommendation does not change, then Mandate is likely governance/design context whose operational effects are mediated through Policy/Constraint/Preference/Objective.

The test should be run across more than one domain:

1. CSP / acquisition-income marginal case;
2. covered-call income-vs-disposition case;
3. T-bill liquidity-vs-preservation case;
4. long-equity growth-vs-income case;
5. hedge protection case.

The critical discipline is that **nothing except declared Mandate may change**. If an actor changes a premium floor, exit target, ownership predicate, risk bound, or Preference to make the Recommendations diverge, it has demonstrated that the decision machinery changed—not that Mandate independently mattered.

### 8. Current research fork

The current strongest alternatives are now:

#### Model A — Mandate participates directly in runtime evaluation

```text
durable Mandate
  ↓
applicable decision frame
  ↓
Policy / Constraints / Preferences
  ↓
Recommendation
```

#### Model B — Mandate is governance/design provenance, not runtime evaluator

```text
Governance
  ├──→ durable Mandate / purpose
  └──→ Policy + Constraints + Preferences + Objectives

Policy + Constraints + Preferences + Objectives + Evidence
  ↓
Recommendation
```

#### Model C — mandate vocabulary itself is over-broad

```text
Allocation Purpose
Program Thesis
Telic Objectives
Inventory Roles
Outcome Stances
Constraints
Preferences
Policy
```

and “Mandate” is retained only for one narrow layer or removed entirely if it adds no unique information.

The next work should falsify these alternatives rather than blend them prematurely.

---

## Reconciliation pressure on existing research

Muse §32 explicitly reopens:

- **§27** Principal Portfolio Mandate survey;
- **§29** Wheel phase-mandate migration;
- **§30** Mandate↔Program n-to-n mapping as a possible projection rather than primitive relation;
- **§31** Decision-Aspect surviving hypothesis;
- locked 17-row ontology wording:
  > Portfolio Mandate — what capital is fundamentally for;
- whether Acquisition / Disposition / Preservation belong in one category;
- whether Policy Rule needs finer mechanism classification.

It strengthens:

- durable effective-time intent/provenance;
- no hindsight rewriting;
- operator departure semantics;
- rule-change/amendment governance;
- direct Policy/Constraint/Preference composition of Recommendation.

---

## Intake / roadmap disposition

This result materially strengthens or challenges existing work only:

- **`PL-SEM-01`** — mandate/purpose/objective taxonomy, Decision Aspect rejection pressure, Policy mechanism roles, governance-vs-runtime semantics;
- **`PL-DEC-BEH`** — historical intent, objective drift, hindsight rationalization, precommitment;
- **`PL-DEPLOY`** — actual composition of Alternative qualification and Recommendation;
- **`PL-PORT-01`** — capital-pool purpose, Inventory Block semantics, standing governed capital;
- **`PL-STRAT-01`** — Operating Program vs Program Edge Thesis;
- **`PL-EXEC-01`** — recorded intent → recommendation → operator departure → execution → reconciled outcome provenance.

No new PL or LVT identity is implied.

---

## Actor handoff requirement — expanded

Future Kiro/Codex/ChatGPT work concerning Mandate, Purpose, Objective, Intent, Decision Aspect, Policy Rule, Wheel phase semantics, Recommendation composition, or the Inner Game must explicitly reacquire:

- `docs/61-inner-game-governed-prescriptive-decision-discipline-2026-09-24.md`;
- §§25–31;
- **§32 Independent Muse falsification and ChatGPT analysis**;
- current `PL-SEM-01`;
- current `PL-DEC-BEH`;
- relevant practitioner corpus;
- canonical semantic model.

Actors must not treat:
- §31 Decision-Aspect binding,
- §32 Muse's allocation-only Mandate,
- Acquisition / Disposition demotion,
- Preservation demotion,
- or the no-Mandate-in-runtime-loop model

as ratified.

The immediate falsification burden is the controlled experiment:

> **Hold all decision machinery constant; vary only declared Mandate; determine whether Recommendation legitimately changes.**

If an actor changes Policy, Objective, Preference, Constraint, state/evidence, or Program while claiming to test Mandate, the experiment is invalid.


## 33. Kiro read-only reconciliation — controlled collision, taxonomy audit, and governance/runtime split — 2026-09-24

**Source status:** Principal-supplied Kiro run result. Kiro operated read-only after synchronizing to current main `3ef807d39b7021ae0c928f97a644da58c24fe762`, completed the required bootstrap at scoped depth, reacquired Doc 61 §§25–32 plus current PL/semantic authority, and performed no repository-content mutation. Preserve as high-value semantic reconciliation evidence. **Not ratified ontology, architecture, Product semantics, roadmap disposition, schema, or implementation authority.**

### Authority/acquisition result reported by Kiro

Kiro reported:
- HEAD synchronized to `3ef807d39b7021ae0c928f97a644da58c24fe762`;
- remote main advanced during the run, and Kiro used clean non-destructive fast-forwards to reacquire current authority;
- Doc 61 did not exist on its stale local checkout but did exist on current `origin/main`, exposing the importance of synchronizing before semantic work;
- no content mutation authority was held or exercised;
- the live semantic workflow remained specimen-driven reconciliation under `PL-SEM-01`, with pressure on `PL-DEC-BEH`, `PL-DEPLOY`, `PL-STRAT-01`, `PL-PORT-01`, and `PL-EXEC-01`.

Kiro preserved the epistemic distinction that §§25–32 consist of Principal-supplied survey/falsification material plus external Muse falsification and ChatGPT analysis; none is ratified.

### Research progression reconstructed by Kiro

Kiro reconstructed §§25–32 as a falsification sequence rather than a linear design:

| Research step | Proposition tested | What survived | What was falsified / reopened |
|---|---|---|---|
| §25 Operating Program | Wheel is one instance of a broader durable rule-governed program class | Program is distinct from construction, mandate, and policy; assignment can be a desired endogenous transition | “Wheel unique because assignment desired” softened; other programs also desire assignment |
| §26 Economic Construction | point-in-time economic structures exist independently of program/purpose | construction ≠ purpose ≠ program ≠ provenance ≠ Outcome Stance ≠ thesis ≠ policy | conventional labels bundle facts; retention/disposition cannot be inferred from mechanics |
| §27 Portfolio Mandate | mandate must change decision rules and success metric | ongoing purpose intuition, counterfactual semantics, migration specimen | Acquisition/Disposition/Protection classifications later reopened by Muse |
| §28 Policy Rule | policy governs decision behavior across lifecycle | amendment/rule-change governance, journaling/provenance importance | `Policy Rule` exposed as an umbrella across several distinct mechanisms |
| §29 formal Wheel | state-machine specimen with phase semantics | coherent specimen spanning much of the spine | phase-mandate migration now under challenge |
| §30 Mandate↔Program | relation appears n-to-n | mapping is real as an observed projection | n-to-n may be a projection of coarser keys rather than primitive semantics |
| §31 mandate-scope falsification | find single-valued mandate scope | governance-vs-application distinction; temporal integrity pressure | Program and Program-Phase falsified; Pool weak/vacuous; Block circular; DecisionAspect only provisional |
| §32 Muse + ChatGPT | attack DecisionAspect and runtime mandate binding | durable declared purpose, temporal integrity, policy-as-frame, hierarchy diagnosis | DecisionAspect strongly rejected; Acquisition/Disposition/Preservation reopened; no-mandate-in-runtime-loop becomes leading contender |

### Controlled collision — Kiro independently reproduces the no-runtime-mandate result

Kiro ran the same controlled experiment proposed in §32:

> **Hold all runtime decision machinery constant; change only declared Mandate / durable purpose; ask whether Recommendation legitimately changes.**

The five specimens were:

1. CSP — Income vs Acquisition
2. covered call — Income vs Disposition
3. cash / T-bill reserve — Liquidity Reserve vs Preservation
4. long equity — Growth / Compounding vs Income
5. strategic holding + hedge — Growth vs Protection / Hedging

Kiro's result across all five:

> **Changing only declared Mandate produced no legitimate Recommendation change.**

When a divergent Recommendation could be manufactured, Kiro found that some other semantic variable had actually changed:
- ownership / willing-to-own predicate;
- premium floor;
- exit target;
- Outcome Stance;
- Inventory Role;
- liquidity / nominal-loss Constraint;
- hedge budget;
- Program selection;
- Policy;
- Objective;
- Preference.

Kiro therefore treated those runs as contaminated and refused to attribute the difference to Mandate.

#### Collision matrix

| Specimen | Only declared Mandate changed? | Recommendation changed? | Hidden variable needed to make it change | Kiro implication |
|---|---|---|---|---|
| CSP | yes | no | ownership predicate / premium floor / Objective | Acquisition intent is better represented by willing-to-own + Objective + Outcome Stance |
| Covered call | yes | no | exit target / call-away stance / retention preference | Disposition behaves like telic Objective, with Stance / Role carrying operational consequences |
| Cash / T-bill | yes | no | availability / maturity / nominal-loss constraints | Preservation adds no independent runtime work once constraints are explicit |
| Long equity | yes | no at the tick | different Program / Policy selection | Growth vs Income appears upstream as allocation-purpose / program-choice rationale |
| Hedge | yes | no | hedge budget / downside tolerance / retention objective | Protection may be objective / service / relationship role rather than runtime mandate |

Kiro's specimen-bounded conclusion:

> **Model B/C is strongly favored over Model A: durable purpose may matter upstream, but Mandate did not demonstrate independent causal work in the routine Recommendation loop once explicit decision machinery was held constant.**

### Important caveat preserved by Kiro

Kiro did **not** claim the runtime-mandate question is mathematically closed.

It identified one remaining discriminator:

> a genuinely marginal case where two otherwise-admissible Alternatives remain tied under all explicit Policy, Objective, Constraint, Preference, Outcome Stance, Inventory Role, and evidence inputs, but declared Allocation Purpose alone appears to determine Recommendation.

Kiro noted that this is the narrow remaining refuge for irreducible runtime Mandate semantics.

ChatGPT follow-on analysis sharpens the test:

> **If the reason the Recommendation changes can be losslessly compiled into an explicit Preference, Objective, Constraint, Policy, Outcome Stance, Inventory Role, or other governed input, then Mandate has not demonstrated independent runtime semantics.**

The remaining question is therefore not merely “can Mandate break a tie?” but:

> **Can Allocation Purpose alter Recommendation in a way that cannot be represented without information loss as explicit decision machinery?**

### Kiro taxonomy audit

Kiro pressure-tested the candidate Mandates without silently ratifying reclassification:

| Candidate | Strongest current interpretation | Current pressure |
|---|---|---|
| Income | atelic Allocation Purpose | supported upstream; no independent runtime effect demonstrated |
| Growth / Compounding | atelic Allocation Purpose | supported upstream; no independent runtime effect demonstrated |
| Acquisition | telic Objective + Outcome Stance | Principal §27 PASS reopened; Muse/Kiro lean Objective |
| Disposition | telic Objective + exit/call-away stance / Inventory Role | Principal §27 PASS reopened; Muse/Kiro lean Objective |
| Protection / Hedging | hedge relationship Objective / service / role | category unresolved; not clearly an allocation purpose of underlying capital |
| Speculation | candidate Allocation Purpose | insufficient pressure-testing |
| Liquidity Reserve | availability Constraint / capital-pool role / possible purpose | unresolved overlap |
| Preservation | Constraint family | strong reduction pressure; demotion still needs independent challenge before ratification |

Kiro emphasized that Acquisition/Disposition/Preservation demotions are not as cleanly falsified as H1/H2; they are category/parsimony conclusions and remain research positions.

### Governance-time vs runtime-time model emerging from Kiro

Kiro's smallest currently supported contender:

```text
GOVERNANCE / DESIGN TIME
  Allocation Purpose
  Program selection
  Policy design
  Objectives
  Constraints
  Preferences
  standing intent
  amendment rules
  authority + effective time

          ↓ establishes

RUNTIME DECISION TIME
  Reconciled State / Evidence
  Decision Subject
  Alternatives, including WAIT / HOLD
  qualification predicates
  Constraints
  Objectives / Outcome Stance
  Preferences
  counterfactual consequences
          ↓
  Recommendation
          ↓
  human Action / deliberate departure / execution
```

Under this contender, Allocation Purpose does not disappear; it performs upstream design/provenance work rather than necessarily appearing as a runtime evaluator.

### Temporal integrity remains load-bearing

Kiro independently reinforced the strongest survivor across §§31–32:

> **The system must preserve what was decided before the position became uncomfortable.**

For the adverse-put specimen, Kiro located the anti-rationalization mechanism in durable effective-time facts such as:
- whether `willing_to_own(strike)` actually passed at entry;
- the Objective / Outcome Stance then in force;
- the Policy version then in force;
- the evidence then available;
- authority + effective time;
- later amendment reason and authority;
- explicit operator departure when current action differs from Recommendation.

Kiro's critical result:

> **The durable protection against hindsight rewriting need not be a Mandate label. It can be the effective-time intent / policy / evidence record.**

This directly serves the Inner Game goal: distinguish changed evidence, legitimate governance change, natural plan resolution, and deliberate departure from retrospective rewriting.

### Policy Rule mechanism audit

Kiro found `Policy Rule` useful as a governance umbrella but too coarse if actors assume every rule has the same computational role.

Kiro identified at least these distinct mechanisms within the existing umbrella:

- qualification predicate;
- hard veto / Constraint;
- Preference / ordering;
- Objective / target;
- lifecycle transition rule;
- reconsideration / attention rule;
- amendment / rule-change rule;
- provenance / record-keeping rule.

Kiro did **not** propose eight new ontology entities.

Instead:

> **Policy Rule can remain the governance umbrella, while its mechanism must be typed or otherwise semantically distinguishable.**

Why this matters:
- a hard Constraint cannot become a relative ranking factor;
- a reconsideration trigger cannot become an action recommendation;
- an amendment rule governs changing Policy, not the trade itself;
- a provenance rule records evidence and history rather than deciding action;
- an Objective can complete while an ongoing purpose does not.

This result strongly aligns with the Inner Game constitutional principle that rule changes must themselves be governed.

### Inner Game fit

Kiro explicitly tested the emerging model against the actual Product goal.

The model reduces objective drift because:
- willing-to-own, premium floor, exit target, and risk boundaries are precommitted upstream;
- the operator cannot rescue a failing criterion simply by switching the current label.

The model reduces activity bias because:
- WAIT / HOLD / LET RESOLVE remain first-class governed Alternatives;
- reconsideration can trigger attention without forcing action;
- natural resolution can itself be the disciplined path.

The model preserves human authority because:
- Recommendation remains system output;
- Action remains operator-owned;
- deliberate departure can be recorded without pretending the governed process said something else.

The model distinguishes changed plan vs abandoned plan only if temporal provenance is durable.

Kiro restated the core behavioral objective in substance:

> Wheelwright should do enough routine reasoning that the human spends judgment on authority, exceptions, and genuinely new evidence rather than reconstructing routine process under discomfort.

### Locked 17-row spine audit — no mutation

Kiro audited rather than changed the locked spine.

Pressure points:

- **Portfolio Mandate** — terminology/category pressured; may be too broad and may belong primarily at allocation/governance time.
- **Inventory Block** — supported, but must not be individuated by mandate or role in a circular way.
- **Inventory Role** — strongly supported and increasingly important for absorbing “current job” semantics.
- **Operating Program** — supported; relation to mandate/purpose remains pressured.
- **Economic Construction** — reinforced as distinct.
- **Decision Subject** — supported.
- **Outcome Stance** — supported; gains importance if Acquisition/Disposition leave Mandate.
- **Policy Rule** — supported as umbrella but mechanism-typing pressure increased.
- **Constraint** — supported; may absorb Preservation.
- **Preference** — supported; must not collapse into Constraint.
- **Alternatives** — supported; WAIT/HOLD first-class.
- **Recommendation** — supported.
- **Action** — supported but remains a known compression point relative to selection/commitment.
- **Reconciled Outcome** — supported.
- **DecisionAspect** — has not earned entity status.
- **Program Edge Thesis** — has not earned entity status; may remain explanatory documentation.

No change to the 17-row spine is authorized by this audit.

### Strongest remaining competing explanations after Kiro

#### Model B — durable Mandate / Allocation Purpose as governance/design provenance

Explains:
- all five collision specimens;
- standing purpose during inactivity;
- program/policy design rationale;
- temporal integrity/provenance.

Strongest falsifier:
- irreducible marginal decision where only purpose changes and the difference cannot be represented elsewhere without information loss.

#### Model C — “Mandate” is over-broad vocabulary

Possible decomposition:
- Allocation Purpose;
- Program thesis/rationale;
- telic Objective;
- Outcome Stance;
- Inventory Role;
- Constraint;
- Preference;
- Policy.

Explains much of the original taxonomy conflict.

Strongest falsifier:
- a supposedly demoted category demonstrates unique semantic work not expressible by the smaller existing concepts.

#### Model A — Mandate as direct runtime evaluator

Now weakest but not logically eliminated.

Needs:
- a clean specimen showing an irreducible runtime effect after all explicit mechanics are held constant.

### Decisions explicitly not earned

Kiro correctly withheld authority for:
- ratifying Model A/B/C;
- adding `DecisionAspect`;
- adding `Program Edge Thesis`;
- ratifying Acquisition/Disposition demotion;
- ratifying Preservation demotion;
- changing the 17-row spine;
- deciding Program↔Mandate cardinality;
- changing canonical semantic model;
- changing ADRs/roadmap/parking-lot dispositions;
- schema/code/UI implementation;
- treating sparse Growth/Speculation observations as priority evidence.

### Kiro's recommended 4AM focus

Kiro identified three highest-value questions:

1. **Does declared Allocation Purpose ever change a legitimate Recommendation when every explicit decision mechanism is held constant?**
2. **Is Mandate one word doing several jobs, and what is the minimum decomposition that corresponds to real governed differences?**
3. **What minimum durable temporal-provenance record distinguishes legitimate plan change from plan abandonment / hindsight rewriting?**

### ChatGPT follow-on analysis — persisted with the Kiro result

The Kiro run materially changes the burden of proof.

We now have:

```text
§31 Principal:
  DecisionAspect looked like the surviving scope hypothesis.

§32 Muse:
  DecisionAspect is arbitrary/unfalsifiable or false under non-circular individuation.
  Durable purpose + direct decision machinery is smaller.

Codex controlled run:
  five specimens → no independent Recommendation effect from Mandate.

Kiro reconciliation:
  independently reproduces the five-specimen result
  and reconciles it against §§25–32, the spine, PLs, and Inner Game.
```

Therefore the old research question:

> **Where does Mandate bind?**

is increasingly likely to be malformed.

The stronger current question is:

> **What durable upstream purpose/provenance must exist, and what explicit runtime decision machinery consumes its consequences?**

The purpose remains meaningful even if it is not an evaluator in every decision tick.

### Single remaining allocation-purpose falsifier

The reserved Codex capacity should now be used only against this proposition:

> **Allocation Purpose has no irreducible runtime semantics once explicit decision machinery is complete.**

The challenge must attempt to construct a case where:
- every relevant state/evidence fact is identical;
- Program is identical;
- Policy is identical;
- qualification predicates are identical;
- Constraints are identical;
- Preferences are identical;
- Objectives are identical;
- Outcome Stance is identical;
- Inventory Role is identical;
- execution assumptions are identical;
- only declared Allocation Purpose changes;
- Recommendation legitimately changes.

Then the actor must attempt to **compile away** that divergence by representing its reason explicitly as a Preference, Objective, Constraint, Policy, Stance, Role, or another governed input.

The discriminator is:

> **If the divergence can be compiled away without information loss, Allocation Purpose has not demonstrated independent runtime semantics.**

> **If it cannot be compiled away without losing a real governed distinction, identify exactly what information is lost. That is the strongest remaining case for a runtime Mandate/Purpose role.**

This is the next authorized semantic falsifier. It should be narrow, adversarial, and capacity-constrained.

---

## 34. Conversation-context durability sweep — additional context promoted to repository — 2026-09-24

**Source status:** Principal instruction to eliminate conversation-only dependency before further research. Preserve the following as durable working context because it materially governs the next phase but was previously available primarily in conversation synthesis. This section does **not** ratify any semantic conclusion.

### Product / Inner Game goal

The research is not an ontology-beautification exercise.

Primary working goal:

> **Wheelwright should make following the disciplined process the path of least cognitive resistance.**

Companion goal:

> **Wheelwright should do enough routine reasoning that the human-in-the-loop primarily exercises authority and judgment over exceptions rather than repeatedly reconstructing routine process from raw facts.**

Boundary:

> **Wheelwright determines what the governed process says should happen. The operator determines whether it actually happens.**

The system is not autonomous trading.

Human authority remains over:
- money;
- action;
- exceptions;
- governance amendment;
- legitimate override;
- consequential judgment.

The system should make durable distinctions between:
- evidence changed;
- governance legitimately changed;
- a precommitted plan is naturally resolving;
- the operator deliberately departed;
- current discomfort created retrospective objective/thesis drift;
- evidence is insufficient;
- WAIT / HOLD / LET RESOLVE is the governed answer.

### Canonical GDXJ lesson

The GDXJ covered-call episode remains the primary behavioral falsifier.

Mechanical state was available:
- shares owned;
- call open;
- strike / expiry / market facts;
- call OTM near expiry.

The reasoning failure occurred because AI supplied an unstated objective.

After the Principal supplied the actual objective — recover basis through premium and ultimately have the shares called away — the governed interpretation changed materially.

The high-value principle remains:

> **Do not manufacture activity merely to avoid a pre-accepted outcome.**

and:

> **Patience was the process.**

Natural resolution must remain a first-class governed path.

### Behavioral / Inner Game pressure

Observe behavior; do not diagnose psychology.

Relevant process hazards include:
- FOMO;
- revenge;
- boredom / activity bias;
- premature profit-taking;
- loss aversion;
- objective / thesis drift;
- hindsight rationalization;
- mandate / regime shopping;
- premium / probability fixation;
- oversizing;
- best-available being mistaken for acceptable.

The system should reduce dependence on heroic operator discipline by making precommitted governance, evidence, constraints, objectives, preferences, and amendment history durable.

### Journaling / provenance working principle

Where the system already possesses:
- authoritative state;
- governing context;
- Alternatives;
- Recommendation;
- rationale;
- operator choice;
- execution;
- lifecycle;
- outcome;

it should not force the human to manually restate those facts as journaling theater.

Human journaling should capture genuinely new/private judgment.

Temporal provenance is essential:
- what was believed / known at the time;
- what intent was recorded;
- what Policy version applied;
- what authority permitted a change;
- when the change became effective.

Memory edited after the fact must not silently replace contemporaneous evidence.

### Process change vs process abandonment

Research must preserve the distinction among:
- process-consistent continuation;
- legitimate reconsideration because evidence/economics/governance/lifecycle changed;
- governed Policy / objective amendment with authority and effective time;
- operator departure from current Recommendation.

Do not moralize the categories.

The semantic system must permit deliberate human departure while preserving that it was a departure.

### Inactivity semantics

WAIT / HOLD / LET RESOLVE / NO TRADE may not be synonymous.

Current research principles:
- natural resolution is affirmative;
- sufficient evidence that no action clears governance can produce WAIT;
- insufficient evidence is not automatically WAIT;
- inactivity can be the disciplined action path;
- idle capital is not automatically failed capital.

### Sell-side-bias guard

Wheelwright was born in an options-income context and much of its corpus/UI naturally over-samples premium-selling programs.

Do not infer from sparse research mappings that:
- Income is semantically primary;
- premium received is intrinsically preferable to premium paid;
- long-premium / hedging / Growth programs are illegitimate.

Protection / Tail Hedge / Long Put remains a clean counterexample to any hidden “premium received good, premium paid bad” assumption.

The live question is where sell-side bias exists, if anywhere:
- Mandate / Allocation Purpose;
- Program;
- Policy;
- Preference;
- Alternative generation;
- ranking;
- UI.

### Contrastive-testing discipline

Avoid Cartesian explosion.

Preferred research sequence:

> **baseline → single-axis contrast → two-axis interaction → adversarial counterexample**

If a proposed dimension never changes:
- Alternatives;
- admissibility;
- consequence interpretation;
- comparison;
- Recommendation;
- attention;
- explanation;
- evidence required;

then its semantic relevance is suspect.

### Research lifecycle / authority discipline

Exploration remains governed by:

> **Explore → Intake (PL) → Reconcile Strategy → Reconcile Architecture → Preserve Why → Decompose → Authorize/Implement**

Working maxim:

> **Explore freely; reconcile before committing. Govern commitment, not curiosity.**

No implementation/mutation authority may be inferred from:
- reasoning quality;
- research convergence;
- actor agreement;
- tests;
- momentum;
- a compelling specimen.

No semantic change is authorized merely because multiple actors converge.

### Actor-role context

Current working roles:
- **ChatGPT** — Principal-facing synthesis/reconciliation;
- **Codex** — primary AI Architect + adversarial reviewer/falsifier;
- **Kiro** — repository-resident Implementation Engineer / broader repo reconciliation;
- **Muse** — independent generic domain/ontology challenger, intentionally kept away from Wheelwright-specific context;
- **Principal** — owns Product meaning, scope/economic commitment, stop, and final/delegated acceptance.

Muse prompts should remain generic and should not be contaminated with Wheelwright/repository/Product-specific semantics.

### Current actor-capacity context

At the time of this durability sweep:
- Codex had approximately 35% capacity remaining before a 4 PM reset;
- the immediately preceding constrained Codex falsification consumed materially less capacity than expected;
- one additional narrow Codex adversarial pass is therefore intentionally reserved;
- Kiro has more context/capacity wiggle room and is the preferred actor for broader reconciliation.

This is operational planning context only, not durable Product semantics. It is preserved here solely because it governs the next research handoff and should not be mistaken for a roadmap commitment.

### Next semantic falsifier after persistence

Do not resume broad discovery.

The immediate remaining falsifier is:

> **Can Allocation Purpose change Recommendation in a way that cannot be losslessly compiled into explicit runtime decision machinery?**

The actor should attack that proposition directly and stop once the discriminator is resolved or a single irreducible counterexample is found.



## 35. Codex narrow allocation-purpose irreducibility falsifier — 2026-09-24

**Source status:** Principal-supplied Codex adversarial result. Codex reused the already-completed bootstrap because bootstrap authority was unchanged since the prior acquisition, synchronized to current `main` at `fdf506fbf9c4fd6fb265dd68782a5a5e203ac699`, read only §§33–34, and performed no repository-content mutation. Preserve as high-value falsification evidence. **Not ratified ontology, architecture, Product semantics, roadmap disposition, schema, or implementation authority.**

### Acquisition delta

Codex reported:
- HEAD: `fdf506fbf9c4fd6fb265dd68782a5a5e203ac699`;
- only Doc 61 changed since prior acquisition;
- bootstrap authority files were unchanged, so the previously completed literal bootstrap was legitimately reused;
- only §§33–34 were newly read.

### Proposition under attack

Codex attacked the remaining proposition:

> **Allocation Purpose has no irreducible runtime semantics once explicit decision machinery is complete.**

This was the single remaining refuge after the §32 Muse challenge, the first Codex five-specimen controlled run, and the §33 Kiro reconciliation.

### Best attempted counterexample

Codex constructed the strongest marginal case it could:

> two admissible capital uses where an Income purpose selects current cash production while a Growth purpose selects reinvestment.

The apparent divergence was:

```text
Income → prefer current distributable cash flow
Growth → prefer expected compounding
```

Codex then applied the mandatory compile-away test.

Result:

> the distinction compiles losslessly into an explicit Objective or Preference.

If those explicit runtime inputs are then held identical, the legitimate basis for divergent Recommendations disappears.

### Compile-away results

Codex generalized the same result across several candidate purpose effects:

| Apparent purpose effect | Explicit representation that carries the runtime work |
|---|---|
| lexicographic purpose priority | governed Preference ordering |
| purpose-specific success condition | Objective |
| purpose-specific prohibition | Constraint |
| purpose-specific qualification requirement | Policy predicate / rule |
| purpose-specific desired outcome | Outcome Stance |
| purpose-specific inventory use | Inventory Role |

Codex further attacked the escape hatch that purpose might be “holistic” or nonseparable.

Its conclusion:

> **A complete mapping from state and Alternatives to admissibility or ordering is itself decision machinery, even if represented as one compound Policy rather than decomposed rules.**

Therefore holistic purpose does not demonstrate irreducible runtime semantics merely by resisting simple decomposition.

### Discriminator result

Codex stated the discriminator cleanly:

If all explicit runtime machinery is genuinely complete and identical, but Recommendation still changes only because the purpose label differs, then one of two things is true:

1. the behavior is unexplained label-based behavior; or
2. the runtime machinery omitted a purpose-derived criterion.

In case (2), the omitted criterion must be represented explicitly as an Objective, Preference, Constraint, Policy, Outcome Stance, Inventory Role, consequence semantics, or another governed runtime input.

Thus:

> **An apparent Allocation-Purpose effect that can be compiled into explicit machinery without information loss does not establish independent runtime semantics for Allocation Purpose.**

### Governance explanation vs runtime information

Codex identified one important distinction that must not be lost:

> Compiling purpose consequences into runtime machinery can lose governance explanation if Allocation Purpose is deleted altogether. It does **not** lose runtime decision information if Allocation Purpose remains as durable design rationale and provenance.

This separates two legitimate semantic jobs:

```text
Allocation Purpose
  explains why the machinery exists
  supports governance coherence
  persists as provenance

Explicit runtime machinery
  determines the Recommendation
```

This result strengthens the governance/runtime split without arguing that Allocation Purpose is meaningless or disposable.

### Narrow falsification verdict

Codex concluded:

> **No valid irreducible counterexample survives.**

And:

> **Allocation Purpose has no demonstrated irreducible runtime semantics once explicit decision machinery is complete.**

This is a falsification result against the remaining runtime-purpose hypothesis, **not ontology ratification**.

It closes the reserved marginal-case refuge unless future evidence identifies a concrete Recommendation-relevant distinction that:
- cannot be represented as admissibility;
- cannot be represented as Objective;
- cannot be represented as Preference;
- cannot be represented as Constraint;
- cannot be represented as Policy;
- cannot be represented as Outcome Stance;
- cannot be represented as Inventory Role;
- cannot be represented as consequence semantics;
- and cannot be represented as another explicit governed input without real information loss.

### Semantic consequence

The current evidence now strongly supports this separation:

```text
GOVERNANCE / DESIGN / PROVENANCE
  Allocation Purpose
  Program selection rationale
  Policy design rationale
  durable effective-time intent
  amendment authority/history

          ↓ establishes

RUNTIME DECISION
  Reconciled State / Evidence
  Decision Subject
  Alternatives
  qualification predicates
  Constraints
  Objectives
  Outcome Stance
  Inventory Role
  Preferences
  consequence semantics
          ↓
  Recommendation
```

The remaining semantic value of Allocation Purpose is therefore upstream:
- durable declaration of what governed capital is for;
- rationale for Program / Policy selection;
- coherence check against later governance;
- historical provenance;
- anti-hindsight context.

No current specimen demonstrates that Allocation Purpose must also appear as an independently causal runtime evaluator.

### Strongest falsifier of this result

The result should be overturned if a future specimen demonstrates all of the following simultaneously:

1. all explicit runtime decision machinery is complete and held constant;
2. only durable Allocation Purpose differs;
3. Recommendation legitimately differs;
4. the reason for that difference cannot be represented losslessly in any existing governed runtime input;
5. the supposedly irreducible content is operationally identifiable rather than merely called “purpose,” “context,” “intent,” “meaning,” or “strategy.”

Until such a specimen exists, runtime Allocation-Purpose causality has not earned semantic status.

### Research implication

This narrows the 4AM research focus materially.

The primary question is no longer:

> **Where does Mandate bind in the runtime loop?**

The better current question is:

> **What durable governance-purpose and temporal-provenance facts must be recorded upstream, and how should explicit runtime decision machinery consume their consequences without allowing hindsight rewriting or hidden decision criteria?**

The unresolved work therefore moves away from mandate-scope hunting and toward:
- minimum durable governance/provenance record;
- typed Policy mechanisms;
- telic Objective vs atelic Allocation Purpose;
- Outcome Stance / Inventory Role boundaries;
- amendment / reconsideration semantics;
- preserving WAIT / HOLD / natural resolution;
- ensuring operator authority and departures remain explicit.

No implementation, ontology mutation, or spine change is authorized by this result alone.

