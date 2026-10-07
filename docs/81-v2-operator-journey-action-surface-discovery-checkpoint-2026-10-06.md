# V2 Operator Journey / Action Surface Discovery Checkpoint

**Date:** October 6, 2026  
**Status:** Product discovery checkpoint — Category D provenance, not ratified Product authority and not implementation authority  
**Scope:** Operator-first discovery for governed capital action surfaces, position management, regime-relative work, operator profile, and cash-side sister question  
**Related:** `docs/80-v2-question-driven-lifecycle-product-architecture-milestone-2026-10-06.md`, `docs/58-wheelwright-semantic-model-v1.md`, `docs/59-practitioner-strategy-semantic-falsification-2026-09-24.md`, `docs/62b-mandate-program-return-disposition-capital-allocation-discovery-2026-09-25.md`, `docs/67-unresolved-predicate-resolution-model-architecture-reconciliation-2026-09-26.md`, `docs/69-assignment-centric-wheel-v1-operating-program.md`, `docs/foundations/regime-objective-function.md`, `docs/foundations/portfolio-capital.md`, `docs/foundations/options-domain-reference.md`, `docs/roadmap.md`, `docs/77-api-v2-architectural-guardrails.md`, `docs/78-api-v2-design-implementation-handoff-checkpoint-2026-10-05.md`

---

## 1. Why this checkpoint exists

After Doc 80, Product discovery deliberately reversed the next-step direction.

Rather than starting with evidence catalogs, governance primitives, schemas, APIs, or a generalized lifecycle model, the Principal chose:

> **Tell the operator journey first, through its materially different permutations, then work backward to the governance and evidence primitives required to support it.**

This checkpoint preserves that conversational discovery so independent review can falsify and reconcile it against repository authority without depending on a large transient prompt.

Nothing in this document is implementation authority. Exploratory action words are not public enums. Candidate Product boundaries are not ratified merely because they are recorded here.

---

## 2. The central operator question

The durable shares-side question is:

> **How do I get the most work out of these shares?**

The phrase **get the most work** does not mean maximize activity, premium, yield, utilization, intervention count, or trading frequency.

The discovery meaning is:

> **Make the capital perform its intended job under its governing regime.**

This is important because productive capital need not produce immediate cash flow.

Under a BUY AND HOLD regime, unencumbered shares may already be doing exactly their assigned job. Selling a call would add behavior and risk that the regime did not ask for.

Therefore:

> **More activity can make capital perform its job worse.**

This is also why **LEAVE ALONE** is a substantive action stance rather than absence of analysis.

---

## 3. The answer starts with regime

The physical holding alone does not establish what productive use means.

For example:

- 100 unencumbered SPY shares under **BUY AND HOLD** can correctly produce **LEAVE ALONE**.
- The same shares under **GROWTH WHEEL** may make **SELL SHORT CALL** a legitimate action family, but not necessarily the right action now.
- The same economic position under **ASSIGNMENT-CENTRIC WHEEL** may support different position-management conclusions from Growth Wheel.

Regime therefore gives “work” its meaning.

Current market/position/account circumstances then determine which regime-legitimate actions are feasible and attractive enough to present or prefer.

A critical non-implication remains:

> **ACCOUNT → REGIME is not necessarily 1:1.**

An account is context/container, not proof that every quantity inside it has one purpose.

A concrete falsification specimen is:

- one account owns 250 SPY shares;
- 150 shares may be governed BUY AND HOLD;
- 100 shares may be governed GROWTH WHEEL.

Therefore the question must apply to an **identified governed quantity/inventory scope**, not silently to every share of a symbol in the account.

Do not infer regime from Roth/taxable/account identity.

---

## 4. Operator action vocabulary

The Principal prefers operator words that are:

- action-oriented;
- low cognitive load;
- domain-native;
- specific enough that a competent operator immediately understands the move.

Exploratory action words discovered so far include:

- **LEAVE ALONE**
- **SELL SHORT CALL**
- **BUY SHARES**
- **LIQUIDATE**
- **ROLL**
- **BUY TO CLOSE**
- **ALLOW EXPIRATION**
- **ALLOW ASSIGNMENT**

These are discovery vocabulary only, not a canonical enum.

**SELL SHORT CALL** is preferred in this exploration over the more generic **WRITE CALL** because it makes direction and instrument explicit in operator language.

---

## 5. Action surface, not strategy selector

The emerging Product shape is an **action surface**.

For the identified governed capital and current situation, Wheelwright should be able to distinguish materially relevant actions and make the operator understand the choice.

The discovery target includes:

1. actions that are currently available;
2. particularly relevant actions that are unavailable, with the blocker exposed;
3. consequences and decision criteria for available alternatives;
4. a governed recommendation when Product semantics can actually establish one;
5. why another action could reasonably be right or become right;
6. what changed fact, condition, obligation, or preference could change the answer.

This is not a ratified response schema.

The operator-facing value is not merely “WW recommends X and the operator may override.” The alternatives and consequences are themselves Product output. The operator should be able to make an informed different choice.

The discovery does **not** establish that every evaluated surface must have one winner.

A safer current formulation is:

> **enumerate → establish feasibility → evaluate → explain → recommend when governance can establish a recommendation**

not:

> **enumerate → score → always choose one winner**

---

## 6. The 99-share specimen: feasibility is distinct from preference

The specimen:

> **99 ordinary equity/ETF shares**

exposes an important distinction.

For a standard 100-share covered-call contract, **SELL SHORT CALL** is not merely unattractive; it is unavailable as a covered action for that inventory quantity.

That is materially different from:

- available but unattractive now;
- available and legitimate but not preferred;
- available and recommended.

The operator surface may therefore usefully expose:

> **SELL SHORT CALL — unavailable: requires 100 shares**

rather than silently omit a highly relevant blocked action.

At the same time, **BUY SHARES** may be available and may change the subsequent action surface by taking the holding from 99 to 100 shares.

The quantity constraint itself is not new semantic territory: existing Assignment-Centric Wheel and options-domain work already distinguish quantity, coverage, encumbrance, and contract deliverables. The operator-first discovery is the importance of projecting the blocker and the action that can alter the feasible action set.

The 100-share example is deliberately limited to an ordinary unadjusted equity/ETF contract. Adjusted contracts can have different deliverables, so the Product must not universalize `100 shares` where actual contract terms say otherwise.

---

## 7. SELL SHORT CALL is not automatic under Growth Wheel

A Growth Wheel regime can make **SELL SHORT CALL** legitimate without making it a foregone conclusion.

For:

> 100 SPY shares, unencumbered  
> Regime: GROWTH WHEEL

the current answer may still be:

> **LEAVE ALONE**

It may be a poor day to assume the short-call obligation. The criteria have deliberately not yet been designed. Possible future inputs could include compensation, option-market conditions, timing, opportunity cost, risk, or other governed facts, but this checkpoint ratifies none of them.

The important discovery is:

> **Regime determines what kinds of work are legitimate. Current circumstances determine whether doing that work makes sense now.**

If a future Growth Wheel implementation mechanically converts every eligible unencumbered 100-share block into a short call, it would likely have collapsed this distinction.

---

## 8. LIQUIDATE and larger capital obligations

**LIQUIDATE** is a legitimate action to consider even when the local holding regime normally favors continued ownership.

A surrounding capital requirement can change the relevant action surface. The conversational specimen is:

> **FULFILL MONTHLY INCOME OBLIGATION**

A locally productive Growth Wheel holding may coexist with a larger need for withdrawable cash.

This does not mean liquidation itself is “income,” nor does it prove that liquidation satisfies the obligation. Liquidation may instead recapitalize/reallocate the system or create cash that can become available to withdraw.

The unresolved Product question is how competing purposes, obligations, constraints, and priorities interact. This checkpoint does not design that mechanism.

The important discovery is that the action surface cannot always be evaluated as position-local.

---

## 9. Position management is the trader-language umbrella

Once an option obligation exists, **POSITION MANAGEMENT** is useful existing trader shorthand for the continuing action surface.

Trading is not necessarily “done after the first trade.” Some management can be predeclared or built into operating behavior, such as DTE review/exit boundaries or buy-to-close profit targets. Other management is interactive and responds to changing evidence.

For shares with an existing short-call obligation, exploratory operator actions include:

- **LEAVE ALONE**
- **ROLL**
- **BUY TO CLOSE**
- **ALLOW EXPIRATION**
- **ALLOW ASSIGNMENT**

Again, this list is not asserted complete or canonical.

**ROLL** is a transition/action, not a lifecycle state.

A roll can change strike, expiration, duration, credit/debit, surrender economics, capital encumbrance, and future action space. A positive credit alone does not establish that the roll improved the governed situation.

---

## 10. LEAVE ALONE versus ALLOW outcomes

**LEAVE ALONE** and the two **ALLOW** phrases are not interchangeable.

**LEAVE ALONE** can mean:

> **No intervention is warranted now.**

It need not commit the operator to a desired eventual contract resolution.

**ALLOW EXPIRATION** and **ALLOW ASSIGNMENT** are contextual tactical stances toward likely resolution paths.

They are not terminal states.

They are not immutable predictions.

They are not determined by delta alone.

They do not stand alone outside regime and situation.

An answer of **ALLOW EXPIRATION** at 10:00 AM can become **ROLL** at noon if the facts change.

Likewise, the same option state can support different tactical conclusions under Growth Wheel and Assignment-Centric governance.

Delta, moneyness, time, extrinsic value, volatility, liquidity, events, and other facts may eventually matter, but this checkpoint selects no single governing metric or rule.

---

## 11. The recurring question never has a final answer while capital remains managed

The central question:

> **How do I get the most work out of these shares?**

has a **current answer**, not a permanent final answer, while the capital remains under management.

The emerging rhythm is:

> **ask → evaluate the current action surface → act or deliberately do not act → circumstances change → ask again**

Examples over time might be:

> LEAVE ALONE → SELL SHORT CALL → LEAVE ALONE → ROLL → ALLOW ASSIGNMENT

This sequence is illustrative only.

After shares become cash, the capital still has a job and the sister question may become relevant.

---

## 12. Position management can be productive or pathological

More management is not inherently better.

Position management can be productive, for example preserving desired ownership through appreciation while extracting premium when doing so remains consistent with the governing regime.

It can also become pathological, for example repeatedly adjusting, extending, adding risk, or committing capital simply to resist an outcome rather than because intervention still serves the job assigned to the capital.

Wheelwright need not diagnose trader psychology to preserve this distinction.

The Product question is whether an intervention serves the governed purpose better than available alternatives, including **LEAVE ALONE**.

This is another reason mere feasibility does not establish desirability.

---

## 13. Operator profile is distinct from regime

A further discovery is **operator profile**.

The working distinction is:

> **Regime defines the job. Operator profile influences how the operator prefers to perform that job.**

Two operators can have the same governed holding, regime, and market conditions while preferring different management intensity.

One may prefer a hands-off approach with fewer interventions and more predeclared management boundaries.

Another may be comfortable with active monitoring and more frequent management when the incremental economics justify it.

Operator effort/attention therefore may have a real preference cost.

Operator profile must not:

- make an infeasible action feasible;
- override hard constraints;
- silently change regime;
- convert BUY AND HOLD into Growth Wheel merely because the operator likes active management.

The exact operator-profile model is unresolved.

---

## 14. The sister question: cash

The reflexive sister question is:

> **How do I get the most work out of this cash?**

It is intentionally parked for later because the cash side is more complicated.

Purpose becomes explicit quickly. One specimen is:

> **FULFILL MONTHLY INCOME OBLIGATION**

The cash question also exposes that “cash” is not one useful scalar.

A real non-margin Fidelity account balance report used during discovery exposed distinct operator concepts including:

- Cash and credits;
- Available to trade;
- Settled cash;
- Available to withdraw.

Conversation also identified:

- Margin;
- Reserved for options.

The current principle is:

> **AVAILABLE TO TRADE ≠ AVAILABLE TO WITHDRAW ≠ MARGIN ≠ RESERVED FOR OPTIONS**

This checkpoint does not decide whether these are distinct capital pools, balances, claims, encumbrances, projections, or multiple views of the same underlying capital.

The monthly-income specimen makes **AVAILABLE TO WITHDRAW** particularly important: nominal cash or trading capacity does not by itself establish that a withdrawal obligation can be met.

Cash can also be productively undeployed. Productive capacity is not synonymous with immediate output.

---

## 15. Productive output versus productive capacity

The operator-first work reinforces an earlier economic distinction:

> **Capital can be productive because of what it is currently producing, or because of the capacity it preserves for the governed purpose.**

Examples:

- BUY AND HOLD shares can be productive without current option premium.
- Unencumbered Growth Wheel shares can be productively left alone when current option economics do not justify an obligation.
- Cash can be productively available for withdrawal, assignment support, re-entry, opportunity response, or another declared purpose without being “put into a trade.”

Therefore neither premium generation nor deployment percentage is a universal proxy for “work.”

---

## 16. Lifecycle economics must survive operator projection

The action surface eventually needs to preserve material lifecycle consequences, not merely transaction mechanics.

Examples:

- **SELL SHORT CALL** can produce premium while changing optionality and creating an obligation.
- **ROLL** can produce a credit while extending duration, capital captivity, or another consequence.
- **BUY TO CLOSE** spends cash to remove an obligation while retaining the shares.
- **ALLOW ASSIGNMENT** can transition managed capital from shares toward cash.
- **LIQUIDATE** converts/terminates the ownership exposure.

Therefore:

> **Cash received is not sufficient evidence that an action improved the governed situation.**

This is consistent with prior Wheelwright distinctions such as premium versus profit, capital consequence, future action space, and lifecycle outcome.

The action surface should not hide these consequences behind a magic score or single metric.

---

## 17. Recommendation boundary is reopened for reconciliation

Doc 80 preserved the boundary that Wheelwright does not exercise ungoverned fuzzy judgment and does not choose a “best” move unless Product defines a deterministic rule establishing a Recommendation.

The operator-first discovery creates pressure to refine, not silently discard, that boundary.

A candidate formulation is:

> **Wheelwright may recommend among explicitly evaluated actions when governed Product semantics establish a recommendation. It does not make the operator's decision and it does not execute the trade.**

This is **not ratified by this checkpoint**.

The important Product requirement discovered here is stronger operator agency:

- enumerate legitimate alternatives;
- expose relevant unavailable alternatives and blockers;
- explain consequences and decision criteria;
- identify a recommendation when governance establishes one;
- explain why another action could be right;
- preserve unresolved evidence, policy, or authority rather than manufacture a winner.

Independent review found this boundary semantically compatible with existing Alternative / Counterfactual Consequence / Recommendation and operator-disposition distinctions. The new pressure is primarily operator-facing projection, not a new recommendation primitive. Doc 58 remains specialized semantic reference rather than ratified v2 implementation authority.

The no-mandated-winner constraint remains essential: multiple alternatives can be legitimate when governance supplies no deciding rule. A truthful surface may therefore establish consequences and leave the choice with the operator.

---

## 18. Intermediate Codex reconciliation

Independent adversarial review found that most of this checkpoint **strengthens or projects existing authority rather than introducing new semantic primitives**.

Existing work already supports:

- capital stock/capacity being distinct from production flow;
- premium or roll credit being insufficient as an economic verdict;
- lifecycle consequences extending through appreciation/erosion, encumbrance, liquidity, optionality, and resulting holdings;
- Alternatives, including HOLD-like non-intervention, being distinct from Recommendation, operator selection, contemplated Action, execution, and outcome;
- quantified governed scopes rather than account or ticker rows being the universal decision subject;
- quantity/coverage feasibility and actual contract deliverables;
- operator agency and transparent policy/evidence/consequence reasoning;
- one account containing multiple governed scopes or Programs without inferring membership from account, symbol, or trade geometry.

The genuinely new Product pressure is:

> **Make that reasoning legible as an operator journey: expose relevant alternatives, feasibility and blockers, consequences, and a recommendation only when governed rules establish one.**

The review also sharpened a non-canonical distinction ladder that must not be collapsed merely for presentation convenience:

- infeasible;
- policy prohibited or policy undefined;
- authority missing;
- evidence insufficient;
- feasible but unattractive;
- legitimate alternative;
- governed recommendation.

These are **not** established as seven Product statuses or an enum. They are falsifiers for any design that merely shows/hides actions or turns every action surface into a ranked winner.

The review confirmed that deterministic governed recommendation is compatible with the existing Wheelwright boundary provided that:

> **Wheelwright recommends only when applicable governed semantics establish a recommendation; otherwise multiple legitimate alternatives may remain without a mandated winner.**

The operator retains selection and brokerage retains execution.

The review also confirmed that treasury/capital purposes are already known concerns but no accepted general priority resolver follows from them. A local holding regime and a larger liquidity/withdrawal obligation can both be relevant without this checkpoint deciding which prevails.

---

## 19. Smallest unresolved Product questions after review

The intermediate review reduced the next discovery boundary to four questions:

1. **Subject and scope** — What identified holding and governed quantity is the first shares question about? How should the 150/100 SPY split expose separate decision contexts inside one account and symbol?
2. **Choice-set promise** — Which relevant blocked actions should be shown, and how should infeasibility, policy, authority, and evidence limitations be distinguished? Can multiple actions remain legitimate without a single recommendation?
3. **Governing comparison** — How should Product express that local regime objectives, portfolio/treasury needs, and operator profile can pull in different directions without prematurely inventing a priority mechanism?
4. **Temporal answer** — Confirm that position-management stances are current, revisable answers with their own facts and reasons, rather than predictions, terminal states, or rewrites of prior Decisions.

Exact action words remain exploratory. Cash-side modeling remains deferred; the observed broker balance distinctions are compatibility constraints, not a selected ontology.

---

## 20. What this checkpoint deliberately does not decide

This checkpoint does **not** decide:

- a canonical action enum;
- a complete Growth Wheel lifecycle;
- exact Growth Wheel call-selling criteria;
- exact roll criteria;
- delta or any other single-metric threshold;
- a surrender-floor policy;
- action ranking/scoring;
- whether every action surface has a winner;
- priority semantics among competing obligations;
- a capital-pool or inventory-cohort schema;
- a cash taxonomy;
- an operator-profile schema;
- a generic policy/rules engine;
- a generic workflow/state-machine engine;
- API resources;
- CLI syntax;
- persistence schema;
- brokerage execution;
- automatic trading.

---

## 21. Review questions used for the intermediate Codex pass

The intermediate review should test:

1. What existing authority already supports these discoveries?
2. What is genuinely new versus rediscovery of existing semantics?
3. Does any discovery contradict ratified Product or architecture?
4. Where does the action-surface language still contain hidden assumptions?
5. What materially distinct operator permutations are still missing?
6. Is deterministic governed recommendation compatible with the existing “no ungoverned fuzzy judgment” boundary?
7. Does existing semantic work already support separately governed quantities within one account/symbol?
8. How should the review distinguish local holding regime from larger capital obligations without prematurely designing a priority engine?
9. What is the smallest set of unresolved Product questions that must be answered before the next snapshot can move beyond discovery?

---

## 22. Disposition

This checkpoint records discovery evidence so it can be reviewed from repository state rather than reconstructed from conversation.

After the intermediate review, the strongest current working formulation is:

> **The operator asks how to get the most work out of identified capital. Regime defines the job. Current evidence and constraints establish the feasible action surface. Operator profile can influence how legitimate choices are managed. Wheelwright should expose actions, blockers, consequences, alternatives, and limitations, and may recommend only where governed Product semantics establish a recommendation. The answer is temporal: while capital remains under management, circumstances can change and the question can be asked again.**

The cash-side sister question remains intentionally parked for a later operator-first pass.

No implementation authority is created by this checkpoint.


---

## 23. Principal closure of call-side primitive discovery

**Principal disposition:** On October 6, 2026, after the final adversarial closure review, the Principal explicitly ratified **closure of call-side primitive discovery**.

This disposition is deliberately narrow.

It means:

> **Within the declared call-side Growth Wheel discovery scope, no materially different operator recommendation or decision boundary was found that requires a new Product primitive.**

It does **not** mean:

- Growth Wheel call policy is complete;
- any particular call-entry, roll, profit-taking, defense, surrender, or exit rule is ratified;
- every call-side action surface has a single winner;
- a usable evaluator exists;
- implementation is authorized;
- the exploratory action vocabulary is canonical;
- put-side or cash-side primitive discovery is complete.

The closure review found that the challenged call-side cases can be explained using existing distinctions among:

- governed scope and quantity;
- current economic state;
- option obligation and actual contract terms;
- consequences and resulting position;
- policy, constraint, and preference;
- evidence and epistemic state;
- feasibility and execution state;
- action / non-intervention;
- outcome stance;
- completed outcome.

Call-side primitive discovery is therefore closed so Product discovery can move deliberately to the put side.

### 23.1 Governing comparison: complete resulting economic state

The strongest repaired call-side comparison is:

> **Evaluate each governed alternative by the complete resulting economic state of the identified governed quantity from the current decision boundary.**

Do not rank alternatives primarily by:

- transaction debit or credit;
- isolated option profit or loss;
- historical share gain;
- a strategy label;
- one metric such as delta, POP, DTE, premium, or exit reliability.

Material consequences can include:

- ownership retained or surrendered;
- remaining or replacement obligations;
- cash and funding consequences;
- residual downside and upside exposure;
- surrender economics;
- distributions;
- duration and timing;
- settlement and outcome uncertainty;
- governed quantity and actual contract deliverable;
- execution/manageability;
- future action space.

Historical facts can still be legitimate policy inputs when governance explicitly references them. A profit-taking rule, for example, can depend on opening credit. The constraint is narrower:

> **Historical P/L does not independently establish the current economic recommendation.**

### 23.2 Roll reasoning

The closure review preserves these call-side distinctions:

- A roll closes the existing obligation and assumes a replacement obligation.
- Net roll credit/debit is insufficient to establish desirability.
- The replacement obligation receives no exemption from ordinary obligation scrutiny merely because it is part of a roll.
- Both economic components should be visible, followed by evaluation of the **whole resulting alternative**.
- An acceptable current obligation can still be replaced if a materially preferable governed alternative exists.
- Improvement does not itself justify churn; execution cost, duration, attention burden, new obligation consequences, and unresolved preference can leave alternatives incomparable.

A replacement may legitimately be governed differently from a standalone fresh entry only where explicit policy establishes that contextual distinction. “It is a roll” does not create that policy.

### 23.3 BUY TO CLOSE reasoning

BUY TO CLOSE is understood as purchasing removal of the present obligation and restoring unencumbered ownership on the retained quantity.

A large displayed BTC debit does not, by itself, establish that BTC is economically expensive relative to assignment or rolling. For an in-the-money call, much of the debit may be intrinsic value corresponding to value that remains in the retained shares.

Therefore:

> **Compare the resulting position, funding consequence, residual exposure, and future choices—not the debit label alone.**

Funding remains a separate feasibility concern. An economically preferred BTC can still be unavailable because sufficient usable cash is absent.

### 23.4 Review rules, exit rules, and governed thresholds

A threshold's meaning comes from its governing policy, not from the metric name.

Examples:

- a call-delta threshold can be defined to trigger **review**;
- a governed P50 profit-taking rule can be defined to trigger or recommend **exit**;
- a governed 0DTE rule can be defined to require or prefer closure before expiration uncertainty.

The closure review therefore rejects a universal rule that every threshold means “reconsider only.”

Instead:

> **Evidence establishes whether the governed condition is satisfied; policy establishes what consequence follows.**

P50 itself remains undefined here. A 50%-premium-capture rule and a modeled probability of reaching 50% profit are different concepts and must not be conflated.

No Growth Wheel P50, delta-management, or mandatory 0DTE rule is ratified by this closure.

### 23.5 Time, early assignment, and outcome pending

Nominal time-to-expiration does not guarantee ownership duration. Early exercise can occur before expiration.

Conversely, governed exit policy can deliberately reduce exposure to early-assignment or expiration uncertainty when an exit condition is satisfied.

That mitigation is not a guarantee:

- execution can fail;
- markets can be unavailable;
- assignment may already have occurred;
- authoritative confirmation can lag the economic event.

The call-side journey therefore preserves a materially important boundary where:

> **the ordinary intervention window can be closed while the final economic outcome is not yet authoritatively reconciled.**

ALLOW EXPIRATION and ALLOW ASSIGNMENT must not be projected as completed transitions before authoritative evidence establishes the outcome.

Once authoritative evidence establishes assignment, the prior BTC/ROLL surface for that obligation is no longer actionable.

### 23.6 Intervention versus outcome stance

Final review did not find a specimen requiring ALLOW ASSIGNMENT or ALLOW EXPIRATION to be independent brokerage actions.

It did find a Product distinction that must survive:

> **What intervention is chosen now, versus which possible outcomes are acceptable or preferred over the governing horizon?**

For example, Product may eventually project:

> **LEAVE ALONE** — assignment acceptable if it occurs before the next review boundary.

or:

> **LEAVE ALONE** — retention remains preferred; reevaluate if assignment exposure materially changes.

This closure does not canonize that exact projection or vocabulary. It records only that action/non-intervention and outcome stance are distinct concerns.

### 23.7 Feasibility, blockers, and failed execution

The closure review preserves the distinction between economic preference and current executability.

Examples include:

- insufficient usable cash;
- market halt;
- option market unavailable;
- execution conditions outside governed limits;
- broker rejection;
- settlement/funding unavailable;
- a working order already exists;
- an intended exit cannot be completed.

A desired or required action can therefore remain visible as:

> **preferred/required — execution blocked**

rather than being silently rewritten as a recommendation to continue exposure.

A feasible alternative is not economically superior merely because the preferred action is blocked.

### 23.8 Governed quantity, coverage, and actual contract terms

Ticker and account identity do not establish the decision subject.

The governed subject can be a quantified inventory block associated with a specific obligation.

The prior falsifier remains important:

- 250 SPY shares in one account;
- 150 governed BUY AND HOLD;
- 100 governed GROWTH WHEEL;
- one short call associated with the Growth Wheel quantity.

Other shares in the account cannot silently become Growth Wheel inventory merely because brokerage-level coverage could exist.

Coverage and governance permission are therefore separate claims.

Likewise, the ordinary 100-share contract convention cannot be universalized.

Corporate actions such as splits, reverse splits, and special distributions can produce adjusted contracts with nonstandard deliverables. Actual contract economics can require:

- share components;
- cash components;
- actual strike/payment terms;
- multiplier or pricing terms;
- settlement terms.

The governing requirement is:

> **Reason from the actual contractual obligation and authoritative governed quantity, not a universal “one call equals 100 current shares” assumption.**

This closure does not design corporate-action ingestion or adjustment handling.

### 23.9 Complete-position reasoning under decline and liquidation

A profitable short-call leg does not establish that the governed position improved.

A substantial underlying decline can make the option cheap to close while the combined governed position has deteriorated materially.

The action surface must therefore be able to distinguish:

- ownership remains desirable and the obligation should remain;
- ownership remains desirable and unencumbered ownership is preferable;
- ownership remains desirable but a replacement obligation is preferable;
- ownership itself should be reduced or ended;
- no governed winner can be established.

LIQUIDATE remains semantically distinct from contractual assignment.

With an existing short call, ending ownership exposure requires reasoning about the **whole resulting position**, including any residual obligation. Brokerage mechanics are therefore consequential evidence even though brokerage execution remains outside Wheelwright's role.

### 23.10 Strongest surviving candidate rules

The final closure review leaves the following as the strongest call-side candidate rules for later policy work:

1. A management trigger has the consequence its governed policy defines; a review trigger does not automatically imply intervention.
2. A governed exit rule can legitimately require stronger action than a review rule.
3. Evaluate both components of a roll, then evaluate the complete resulting alternative.
4. A replacement obligation receives no exemption from ordinary obligation scrutiny merely because it is part of a roll.
5. Evaluate complete resulting economic positions from the current decision boundary.
6. Feasibility constrains current actionability but does not rewrite economic preference.
7. Retention preference can have limits; tolerating call-away does not establish underlying undesirability.
8. A governed recommendation to continue exposure requires an appropriate horizon and acceptable continuing consequences.
9. Time-to-expiration does not itself bound ownership duration where early exercise is possible.
10. Governed exit policy can mitigate, but not guarantee elimination of, assignment/expiration uncertainty.
11. Actual contract terms and deliverables govern coverage reasoning.
12. Symbol/account identity does not establish governed inventory scope.
13. An acceptable current obligation can still be replaced when another attainable resulting state is materially preferable under governed semantics.
14. A completed economic transition changes the available action surface.
15. Isolated option profit does not establish complete-position improvement.
16. Execution inability is a blocker, not evidence that another action is economically superior.

These remain **candidate call-side policy material**, not ratified Growth Wheel policy.

### 23.11 Policy questions intentionally left open

Call-side primitive closure leaves policy discovery to determine, among other things:

- adequate compensation for assuming a short-call obligation;
- acceptable surrender economics;
- defense limits;
- retention versus assignment preferences;
- duration and operator-attention preferences;
- exact management/review triggers;
- exact P50 or other profit-taking semantics;
- 0DTE exit behavior;
- what degree of improvement justifies intervention;
- conflict precedence among applicable rules;
- partial-quantity reduction/association treatment;
- search scope required before claiming no acceptable replacement exists.

These are Product/policy questions. Their existence is not evidence of a missing call-side primitive.

### 23.12 Closure criterion satisfied

The final adversarial review attempted to produce a materially different call-side recommendation that the discovered primitives could not explain.

It did not find one within the declared scope.

The remaining attacks reduced to:

- missing or unratified policy;
- evidence requirements;
- execution blockers;
- epistemic state;
- consequence modeling;
- actual contract terms;
- implementation concerns;
- or Product problems outside the declared call-side scope.

Therefore the Principal ratifies:

> **CALL-SIDE PRIMITIVE DISCOVERY CLOSED.**

This is a Product-discovery closure disposition only.

No implementation authority is created.

The next authorized discovery scope is the **put side**, using the same operator-first and falsification method before the later cash-side pass.


---

## 24. Principal-ratified put-side primitive-discovery closure

**Principal disposition:** bounded put-side primitive discovery is closed after the initial acquisition pass, Principal corrections, adversarial Codex review, reconciliation, and final closure review.

This section records the closure evidence. It does **not** ratify Growth Wheel put policy, acquisition thresholds, discount definitions, ladder construction, P50 behavior, 0DTE behavior, directional-forecast use, replacement rules, quantity targets, lifecycle accounting, or implementation.

### 24.1 Closure scope

The bounded question was:

> **Can a materially different Growth Wheel put-side operator recommendation or decision boundary be produced, within the declared acquisition scope, that requires a new put-specific Product primitive?**

The reviewed journey covered:

- immediate ownership;
- contingent acquisition through a short put;
- continued absence / patience;
- working discounted acquisition orders;
- BUY-WRITE as immediate ownership plus a call obligation;
- existing-put management;
- BTC;
- replacement/ROLL alternatives;
- BTC + BUY SHARES;
- BTC + BUY-WRITE;
- assignment outcome stance;
- partial execution and failed composed actions;
- quantity changes and contract granularity;
- sequential and simultaneous acquisition ladders;
- P50/profit-taking and exit reliability;
- 0DTE alternatives and authority conflicts;
- operator directional belief versus Growth Wheel ownership preference;
- historical evidence dependencies;
- actual contract terms and adjusted deliverables.

No reviewed specimen required a new put-specific Product primitive.

### 24.2 Acquisition surface is broader than a three-action triad

BUY SHARES, SELL PUT, and LEAVE ALONE remain useful first comparisons, but they are not an exhaustive acquisition surface.

Where materially relevant, the operator surface can also include:

- a working discounted acquisition order;
- BUY-WRITE;
- partial purchase;
- mixed paths across different governed quantities;
- composed actions that retire an existing obligation before direct acquisition.

These are operator permutations and action compositions explainable through existing semantics. Their existence does not require a new put-specific primitive.

### 24.3 Immediate ownership, contingent acquisition, and continued absence

The reviewed Product distinction survives:

- **BUY SHARES** seeks ownership now and immediate upside/downside participation without a new put obligation.
- **SELL PUT** creates a present short-put liability and contingent acquisition exposure. Funding/collateral can be encumbered now even though shares are not yet owned.
- **LEAVE ALONE** creates neither ownership nor a new acquisition obligation and accepts continued absence over the governing horizon.
- **BUY-WRITE** seeks ownership now while simultaneously accepting a separately scrutinized short-call obligation.

A short put must not be projected as unencumbered cash or as owned inventory.

Acquisition intent does not privilege puts merely because the capital is governed by Growth Wheel.

### 24.4 Price willingness is not unconditional acquisition authority

The review exposed an important operator-facing distinction:

> **Willingness to buy at a stated price is not necessarily willingness to accept every condition under which acquisition could occur.**

For example:

> “I would buy at $680 after reviewing why it got there.”

does not by itself authorize either:

- an ordinary live $680 acquisition order that can execute without that later review; or
- a $680 short put whose contractual acquisition consequences persist through its governed horizon.

Existing conditional governance, action, execution, and outcome semantics explain this distinction. No new primitive is required.

### 24.5 Discounted acquisition order versus short put

The conversational shorthand:

> **“The difference is premium.”**

is useful for exposing compensation, but it is not a complete economic comparison.

A working acquisition order and a short put can differ materially in:

- acquisition timing and triggering conditions;
- ability to withdraw or revise;
- funding and encumbrance;
- duration of obligation;
- ownership participation;
- execution/resolution uncertainty;
- retirement/closing consequences;
- assignment mechanics.

Premium is therefore properly treated as compensation offered for accepting the put's contractual consequences, not as proof that the put dominates a discounted acquisition order.

Neither price contact nor ITM status establishes completed acquisition.

### 24.6 Complete resulting-state reasoning for existing puts

The call-side requirement to compare complete resulting economic states survives on the put side.

An existing-put surface can include, when admissible:

- LEAVE ALONE;
- BTC;
- ROLL / replacement;
- BTC + BUY SHARES;
- BTC + BUY-WRITE;
- non-intervention with an explicit assignment outcome stance.

A large BTC debit does not independently establish economic disadvantage. Intrinsic value can correspond to value retained or acquired through another leg of the resulting position.

Likewise, intended action composition is not completed state.

Examples:

- if BTC fails but a share purchase executes, the surviving put must remain in the actual exposure;
- buying shares while a put survives can create additional contingent acquisition;
- that additional exposure is legitimate only if governance permits it and must not be silently described as exact target restoration.

A replacement obligation must be independently scrutinized. “ROLL DOWN” is not the universal replacement shape; same-strike or higher-strike replacement can be legitimate under different governed acquisition preferences.

### 24.7 Assignment can be productive without being automatically desirable

Put assignment can accomplish an intended capital-form transition:

> **cash + acquisition obligation → shares**

Therefore:

- an ITM put is not inherently a deteriorating Product state;
- a large unrealized option loss can coexist with approaching a desired acquisition;
- a profitable put can coexist with failure to restore desired ownership.

Assignment remains productive only while the resulting acquisition is acceptable under current governance.

Isolated option P/L does not establish progress toward the ownership objective.

### 24.8 Growth Wheel ownership preference is not a market forecast

The Principal clarified:

> **Growth Wheel supplies a share-retention / ownership preference. It supplies no implied bullish or bearish market bias.**

An operator may state a directional belief. Wheelwright may preserve that assertion and explain consequences associated with choices made under it.

Under current policy-over-prediction authority, the belief itself does not automatically become deployment authority or an observed future fact.

For example:

> “I think the market will continue lower.”

is materially different from an admissible governed preference such as:

> “For this horizon, I prefer continued nonownership over acquisition above $660.”

The former is a belief/forecast. The latter can be an operator preference if applicable governance admits it.

Management intensity does not encode market direction.

This closure does not authorize forecast-driven deployment policy.

### 24.9 Discount remains an unresolved policy boundary

No universal definition of acquisition “discount” was established.

Potential references can include, when precisely defined and relevant:

- current spot;
- prior call-away price;
- acquisition price or brokerage basis;
- a Wheel-economic analytical measure;
- standard deviation or another defined dispersion measure;
- delta;
- technical reference levels;
- volatility conditions;
- an operator-selected price or valuation reference.

These answer different questions and do not independently establish the correct acquisition level.

Historical references such as prior call-away price remain evidence until governance gives them decision significance.

Wheelwright's Product role remains to make choices, evidence, assumptions, and consequences clear without pretending to predict future market direction.

An unresolved winner is not a primitive failure.

### 24.10 P50, exit reliability, and acquisition purpose

P50 requires precise semantics. A profit-taking rule based on opening credit is distinct from a modeled probability measure.

Where a governed profit-taking condition exists:

- opening economics can be historical policy input;
- current executable closing economics are current evidence;
- exit reliability can affect feasibility and attainable economics;
- closing the put removes the current acquisition obligation.

Therefore reaching a marked profit threshold does not by itself answer whether acquisition intent continues, whether direct ownership is now preferred, whether a replacement obligation is justified, or whether execution is attainable.

A required/preferred exit can remain **execution blocked**. Failed execution must not be silently rewritten as a recommendation to continue the obligation.

No Growth Wheel put-side P50 policy is ratified here.

### 24.11 0DTE is a decision boundary, not an automatic close

At a 0DTE put boundary, materially different alternatives can include:

- LEAVE ALONE with an explicit outcome stance;
- ROLL / replace, including but not limited to a lower strike;
- BTC;
- BTC + BUY SHARES;
- BTC + BUY-WRITE.

A mandatory-close policy can conflict with desired assignment. A review-only policy cannot be treated as mandatory closure.

Where applicable authority does not resolve the conflict, Wheelwright must preserve the authority gap rather than manufacture a winner.

Early assignment and final assignment/expiration outcomes require appropriate evidence. A desired outcome must not be projected as completed before authoritative evidence establishes it.

No universal Growth Wheel 0DTE put rule is ratified here.

### 24.12 Sequential rolls, multi-lot ladders, and governed quantity

Different governed quantities can carry different acquisition terms while sharing the same Growth Wheel regime.

For example, a 300-share desired inventory can coherently include separate contingent acquisition quantities at different strikes.

The review preserves the distinction between:

- **sequential replacement**, where one governed acquisition obligation is replaced over time; and
- **simultaneous multi-lot ladders**, where multiple governed quantities carry concurrent acquisition obligations.

These arrangements have materially different aggregate exposure.

Product reasoning must preserve, as applicable:

- quantity already owned;
- quantity contingently obligated;
- quantity still desired but uncommitted;
- actual contractual deliverable;
- aggregate funding/encumbrance;
- surviving obligations after partial acquisition or early assignment.

For example:

> **100 owned + 100 contingent + 100 uncommitted**

is neither 300 owned nor automatically 300 fully funded.

A partial share fill while a full contract remains outstanding can create potential ownership beyond the originally intended quantity.

Actual deliverable, exercise payment, multiplier/pricing, settlement terms, and authoritative governed quantity control. The ordinary 100-share convention cannot be universalized.

### 24.13 Repeated rolling neither proves improvement nor pathology

A sequence of lower replacement strikes can represent:

- changing acquisition terms in response to observed conditions;
- an admissible operator preference;
- an explicitly governed acquisition ladder;
- retirement of an increasingly undesirable obligation;
- or repeated deferral that fails the ownership objective.

The sequence itself establishes none of these interpretations.

A lower contractual purchase price if assigned does not prove a better acquisition strategy.

Closing cost, replacement liability, duration, attention, funding, compensation, ownership delay, and other complete-state consequences remain relevant under applicable governance.

No psychological diagnosis or universal rolling prohibition is established.

### 24.14 Lifecycle history remains upstream and cross-cutting

GitHub issue #34 records the open cross-cutting concern:

> **Any Wheel requires durable lifecycle history because current brokerage state alone is insufficient for truthful tracking/reporting and for governed policies that explicitly depend on historical economic facts.**

This concern subsumes call- and put-specific governance design.

Put-side review confirmed examples where history can matter:

- profit-taking relative to opening credit;
- a policy that explicitly references prior call-away price;
- cumulative Wheel reporting;
- any future rule limiting cumulative deferral or repeated-roll cost;
- replay/reconciliation of earlier recommendations;
- continuity of reacquired shares with an earlier governed Wheel lifecycle.

History is evidence, not automatically policy.

Current-state recommendations do not require lifetime reconstruction unless the applicable conclusion depends on historical facts.

This closure does not select a lifecycle identity model, accounting formula, event model, persistence design, or implementation.

### 24.15 Strongest surviving candidate rules

The final put-side closure leaves the following as strong candidate material for later policy work:

1. Acquisition intent does not privilege a short put over immediate purchase, BUY-WRITE, a relevant working acquisition order, or patience.
2. A short put creates present liability/exposure and contingent acquisition, not ownership or unencumbered cash.
3. Compare put-side alternatives through complete resulting economic states.
4. Retiring an acquisition obligation and abandoning acquisition intent are distinct decisions.
5. BTC + BUY SHARES is materially different from BTC alone.
6. BTC + BUY-WRITE is materially different when immediate ownership plus a call obligation is admissible.
7. A replacement put receives no exemption from ordinary obligation scrutiny merely because it is part of a roll.
8. Assignment can be a productive acquisition transition only while the resulting acquisition remains acceptable.
9. Isolated option P/L does not establish progress toward desired ownership.
10. A governed profit-taking condition requires defined semantics and attainable-exit evidence; closure also changes the acquisition state.
11. 0DTE has the consequence its governing policy defines; it does not imply universal closure.
12. Growth Wheel ownership preference supplies no bullish or bearish forecast.
13. Operator directional belief does not automatically authorize forecast-driven Wheelwright deployment recommendations.
14. Repeated rolling establishes neither improvement nor pathology without governed comparison of resulting states.
15. Different governed quantities can carry different put strikes while sharing one regime.
16. Sequential replacement and simultaneous multi-lot ladders must not be conflated.
17. No universal acquisition-discount reference is established.
18. Historical evidence becomes decision-significant only through applicable governance.
19. A discounted acquisition order is a useful counterfactual where its execution path materially differs from a put.
20. Price willingness does not automatically establish acceptance of every acquisition condition or contractual consequence.
21. Intended composed actions must not be projected as completed when execution is partial, failed, pending, or otherwise unreconciled.
22. Actual contract terms and authoritative governed quantity control acquisition exposure.

These remain **candidate put-side policy material**, not ratified Growth Wheel policy.

### 24.16 Policy questions intentionally left open

Put-side primitive closure intentionally leaves policy work to determine, among other things:

- what constitutes an acceptable acquisition discount;
- which reference, if any, defines discount;
- adequate compensation for assuming a put obligation;
- ownership urgency;
- acceptable acquisition conditions;
- target versus maximum quantity;
- partial-quantity treatment;
- ladder permissions and construction;
- replacement-put selection;
- exact P50/profit-taking semantics;
- exact 0DTE behavior;
- exit-reliability requirements;
- conflict precedence;
- degree of improvement required to justify intervention;
- admissible role of operator preferences;
- historical references that governance makes decision-significant;
- when direct purchase or BUY-WRITE should outrank contingent acquisition;
- treatment of working acquisition orders;
- treatment of incomplete composed execution.

These are Product/policy questions. Their existence is not evidence of a missing put-side primitive.

### 24.17 Final closure specimens

The final closure account explicitly preserves five high-value falsifiers:

1. **Conditional willingness** — “buy at $680 after review” versus a live automatic acquisition order versus a contractual put.
2. **Partial completion** — partial share purchase while a full put survives, or failed BTC with successful purchase.
3. **Changed quantity/governance** — desired quantity reduced below a whole surviving contract, or acquisition permission removed while the obligation remains.
4. **Conflicting exit authority** — desired assignment versus mandatory close, including both successful and blocked execution.
5. **History-dependent policy** — opening-credit exit or prior-call-away constraint with sufficient, missing, or corrected historical evidence.

All five are explainable through existing action, governance, quantity, evidence, execution, outcome, and cross-cutting history distinctions.

### 24.18 Closure criterion satisfied

The adversarial review attempted to produce a materially different put-side recommendation or operator decision boundary that the discovered primitives could not explain.

It did not find one within the declared Growth Wheel acquisition scope.

The remaining attacks reduce to:

- missing or unratified policy;
- unresolved operator preference;
- evidence requirements;
- execution state or blockers;
- partial/incomplete action completion;
- governed quantity;
- actual contract terms;
- authority/precedence conflicts;
- cross-cutting lifecycle history;
- or implementation concerns outside the declared discovery scope.

Therefore the Principal ratifies:

> **PUT-SIDE PRIMITIVE DISCOVERY CLOSED.**

This is a Product-discovery closure disposition only.

No Growth Wheel put policy is ratified.

No implementation authority is created.

The next authorized discovery scope is the **cash side**, using the same operator-first and falsification method around the question:

> **How do I get the most work out of this cash?**

Cash-side discovery must not assume that “work” means maximum deployment, maximum yield, maximum premium, or mandatory option activity. Cash can have governed jobs including availability, withdrawal support, obligation/collateral support, acquisition readiness, opportunity response, and other capital purposes that remain to be exercised through the operator journey.


---

## 25. End-of-session checkpoint — cash-side discovery in progress

**Date:** 2026-10-06

**Status:** cash-side primitive discovery is **OPEN**. This section is a restart checkpoint only. It does not close cash-side discovery, ratify cash policy, or create implementation authority.

### 25.1 Durable state entering the cash pass

The Principal has ratified closure of both:

- call-side primitive discovery; and
- put-side primitive discovery.

GitHub issue #34 remains the open cross-cutting concern for Wheel lifecycle history, tracking, reporting, and historical evidence used by governed policy.

The authorized cash-side operator question is:

> **How do I get the most work out of this cash?**

Cash-side discovery must not assume that productive cash means maximum deployment, maximum yield, maximum premium, or mandatory option activity.

### 25.2 Starting cash specimen

The first specimen used $100,000 with no selected instrument and no initial contractual encumbrance:

- $30,000 must support a withdrawal in ten days;
- $50,000 must remain capable of funding a permitted acquisition during that period;
- the remaining $20,000 has no immediate commitment, while the operator values retaining future choices;
- earning an acceptable return is desirable wherever consistent with those purposes.

The first repair is:

> **Cash can be mechanically unencumbered while already committed to a governed purpose.**

“No existing obligation” does not mean “available for any new obligation.”

Availability is purpose-relative:

> **Available for what proposed use, in what amount, by when, and without defeating which surviving commitments?**

### 25.3 Overlapping purposes and concurrent demand

Cash purposes are not necessarily exclusive buckets.

A governed quantity can coherently support overlapping concerns such as:

- withdrawal readiness;
- acquisition readiness;
- obligation/collateral support;
- opportunity readiness;
- return-seeking.

Labels do not create duplicate capacity.

The important falsifier is concurrent demand:

> **Can the same capital satisfy every obligation/capability that may require it under the proposed resulting state?**

Purposes must neither be summed automatically nor allowed to reuse the same dollars for incompatible simultaneous requirements.

Return-seeking is cross-cutting. Cash can earn return while performing another governed job when the resulting state preserves the required capabilities and other applicable constraints.

Low earnings do not establish poor productivity. High earnings do not establish successful performance.

### 25.4 Purpose-relative availability and evidence

“AVAILABLE CASH” must not mean universal deployability.

A displayed balance does not establish usable funding for a withdrawal, acquisition, obligation, or other proposed use.

Where evidence is insufficient, the truthful finding is:

> **Availability for this use is not established.**

It must not be silently treated as either fully available or zero.

Likewise, an instrument labeled or treated colloquially as a cash substitute does not inherit every cash capability merely from the label. Relevant conversion, settlement, withdrawal, collateral/support, timing, risk, and execution consequences require appropriate evidence.

### 25.5 Preserving capability can itself be productive work

Withdrawal reserve and acquisition readiness can be economically purposeful before any transaction occurs.

An alternative offering higher return can be inadmissible if it defeats a required capability or horizon.

Conversely:

> **Reserved cash need not remain idle.**

Return-seeking can be permissible when the alternative preserves the governed capability, timing, acceptable risk, and other constraints.

Acquisition readiness is similarly horizon-dependent. Preserving the ability to act can be productive without predicting that an opportunity will occur.

### 25.6 Obligation support and brokerage permission

When an existing obligation requires support, distinguish at least:

1. the cash can support the existing obligation;
2. brokerage mechanics permit some other use of that cash;
3. that other use preserves the complete governed position.

The second does not establish the third.

Retiring an obligation does not automatically make its former support capital universally deployable. Other purposes can survive.

### 25.7 Changing the job of cash

The second cash pass exercised changes to governed purpose.

A central surviving distinction is:

> **Release from one commitment is not assignment to another purpose.**

If a withdrawal is canceled by appropriate authority, the old purpose can cease. That does not automatically authorize a new deployment.

Likewise, a purpose can cease before an instrument has been converted, liquidation has settled, collateral has been released, or other evidence establishes usability for the proposed next purpose.

Preserve the distinction among:

- governance/purpose transition;
- economic/execution transition;
- evidenced availability for the proposed use.

### 25.8 Expired and conditional purposes

A purpose reaching its horizon does not imply indefinite continuation or automatic redeployment.

A legitimate result can be:

> **Purpose expired; subsequent use unresolved.**

Where release is conditional, the release condition requires appropriate evidence.

The familiar rule survives:

> **Evidence establishes whether the governed condition is satisfied; policy establishes what consequence follows.**

### 25.9 Same instrument, different job; different instrument, same job

A particularly strong cash-side falsifier is:

> **If Wheelwright infers the job of cash from the instrument holding it, the model is wrong.**

The same dollars in the same money-market or cash-like position can have materially different governed purposes.

Conversely, changing instruments does not necessarily change the governed job if the required capability remains preserved.

Therefore distinguish:

> **Change how the capital performs its job**

from:

> **Change the job itself.**

Return enhancement can sometimes be a better way to perform the same governed cash purpose rather than a reallocation.

### 25.10 Partial release and quantity

Purpose transitions can apply to only part of a governed quantity.

If $10,000 of a $30,000 withdrawal reserve is released:

- $20,000 can remain committed to withdrawal capability;
- $10,000 is released from that purpose.

The released $10,000 is not thereby universally free; overlapping surviving purposes can still apply.

Governed quantity remains the decision subject rather than named buckets.

### 25.11 Emerging cash-side structure

The current discovery suggests the following exploratory structure:

- **PURPOSE** — what capability must this governed quantity provide?
- **QUANTITY** — how much capital does that capability require, considering concurrent demands rather than labels?
- **HORIZON** — when must the capability exist?
- **CURRENT STATE** — what does the capital currently own, support, or owe?
- **AVAILABILITY FOR PROPOSED USE** — can this quantity take on the proposed use without defeating surviving purposes?
- **TRANSITION** — has a purpose, obligation, or economic state actually changed enough to alter that availability?
- **EVIDENCE** — is that conclusion established?

This is discovery language, not a canonical schema or implementation design.

Return is evaluated inside the governing constraints rather than assumed to outrank them.

### 25.12 Strongest current candidate rule

The strongest current cash-side candidate rule is:

> **Capital becomes available for another use only to the extent that the proposed use preserves all surviving governed capabilities, or authoritative governance has released or changed those capabilities, and any necessary economic transition is sufficiently evidenced.**

This remains a discovery hypothesis, not ratified cash policy.

### 25.13 Current primitive finding

No new cash-specific Product primitive has yet been demonstrated.

The exercised specimens remain explainable through existing concepts including:

- purpose/governance;
- governed quantity;
- timing/horizon;
- obligation;
- feasibility;
- execution state;
- evidence;
- complete resulting consequences;
- operator preference;
- and cross-cutting lifecycle history where historical commitments or attribution matter.

The cash-specific discovery so far is primarily their operator-facing application.

### 25.14 Exact restart point

Cash-side discovery stops here for the session.

The next authorized action is:

> **Falsify cash-purpose transitions against partial release, conditional release, expired purposes, overlapping surviving commitments, replacement instruments, and incomplete economic transitions before moving to cash deployment alternatives.**

Do not begin by selecting instruments or maximizing yield.

Cash-side primitive discovery remains **OPEN**.


---

## 26. Cash-side primitive-discovery closure

**Date:** 2026-10-07

**Status:** Principal-ratified Product-discovery closure disposition only. This section does not ratify cash policy, strategy coverage, multi-objective precedence, lifecycle-history architecture, or implementation authority.

### 26.1 Closure statement

After operator-journey falsification, scope reconciliation, and adversarial review, the Principal ratifies:

> **CASH-SIDE PRIMITIVE DISCOVERY CLOSED.**

The bounded closure claim is:

> **No materially different cash-side operator recommendation or decision boundary found within the declared Product scope requires a new cash-specific Product primitive.**

The exercised cash cases remain explainable through existing distinctions including purpose/objective, governed quantity, horizon, obligations, evidence sufficiency, feasibility, execution/settlement state, alternatives, complete resulting consequences, operator preferences, and cross-cutting lifecycle history where applicable.

This closure does not establish that cash policy is complete or that every cash use is supported.

### 26.2 HITL, recommendation, warning, and enforcement boundary

The reconciled owner-operator boundary is:

> **The HITL controls their capital and accepts the consequences. Wheelwright governs what it can truthfully recommend.**

Wheelwright does not create a superior authority over the operator's capital. The operator can revise a previously stated purpose or choose differently from a Wheelwright recommendation.

Preserve four distinct findings:

1. **Wheelwright informative warning** — a consequence, incompatibility, or material tradeoff established by the evidence under stated assumptions.
2. **Wheelwright recommendation** — a policy-supported preference among evaluated alternatives.
3. **HITL judgment** — the operator's action or non-action, potentially incorporating broader context outside Wheelwright's scope.
4. **Brokerage/execution enforcement** — actual order, funding, collateral, settlement, margin, account, and other mechanical constraints.

Therefore:

> **Wheelwright warning is not brokerage prohibition.**

and:

> **Brokerage permission is not Wheelwright recommendation.**

Brokerage balances and related account facts are evidence. Their source authority can establish appropriate factual conclusions without establishing Product desirability, purpose, or Program membership.

### 26.3 Repaired availability wording

The earlier candidate wording in §25.12 is narrowed for this closure.

Under the currently stated plan, Wheelwright can establish availability for a proposed use when the proposed use preserves surviving requirements—or the operator has revised those requirements—and necessary funding, execution, settlement, and evidence conditions are established.

This describes a Wheelwright conclusion. It is not permission Wheelwright grants the operator.

Likewise:

> **Release from one purpose does not establish that other requirements or obligations have ceased.**

Purpose transition, economic/execution transition, and evidenced availability remain distinct.

### 26.4 Evidence-bounded observation loop

The operator does not need to report an explicit `I choose A` event to Wheelwright.

The repaired operating loop is:

> **maintained evidence and known context → state-change preparation → activity outside Wheelwright → reevaluation when relevant evidence, context, or time changes**

Prices, rates, time, settlement status, evidence freshness, policy, and known operator context can change while holdings remain identical. Wheelwright therefore does not become inert merely because no portfolio transaction occurred.

At the state-change-preparation boundary, Wheelwright should expose materially relevant supported alternatives within its scope, explain their criteria and consequences plainly, and recommend when applicable policy and evidence establish a preference.

The HITL may then act, not act, choose another supported alternative, or act for reasons outside Wheelwright's domain. Wheelwright later reasons from the evidence it actually has.

### 26.5 Recommendation history is not economic history

Dispensing with a mandatory explicit HITL choice event does not eliminate history requirements.

Keep separate:

- recommendation provenance — what Wheelwright concluded using which evidence and policy;
- economic history — transactions, assignments, distributions, rolls, capital changes, and other economic events;
- operator disposition — where explicitly recorded, whether a recommendation was followed, deferred, or departed from.

A later endpoint state must not be used to invent unobserved intermediate history.

GitHub issue #34 remains the open cross-cutting concern for lifecycle history, tracking, reporting, and policy-dependent historical evidence.

### 26.6 Cash economics

Cash must not be treated as economically inert.

A truthful general formulation is:

> **An identified cash or cash-like holding may earn a return, including zero, while also providing liquidity, optionality, and potentially collateral utility.**

Those capabilities depend on the actual holding, account treatment, horizon, and evidence.

Low return alone does not establish that cash should be redeployed. High return alone does not establish that a replacement is superior.

Wheelwright is not a general valuation, NPV, or household capital-allocation appliance. It does not need to request or derive a discount rate merely because cash exists.

Where an appropriately qualified operator-supplied comparison reference already exists, Wheelwright may make a modest comparison such as observing that a cash holding's return is below that reference. It must not manufacture valuation loss, attainable counterfactual return, or deployment pressure from the comparison.

### 26.7 Product scope: brokerage financing versus the operator's debt surface

General household debt and financing optimization are outside the declared Wheelwright Product scope.

Wheelwright does not need to discover or optimize the operator's mortgage, HELOC, vehicle debt, real-estate financing, or other external debt surface.

Brokerage financing remains part of complete-state economics when material. Margin debit, margin interest, collateral treatment, and related brokerage consequences can therefore belong in an in-scope comparison.

This is a scope boundary, not a new cash primitive.

### 26.8 Future-event evidence is not present funding

Wheelwright is constrained to what known evidence establishes.

A pending transfer or other future event may be relevant evidence without becoming present usable cash.

Wheelwright must not fill a current funding gap with a pro forma expectation merely because an inflow is anticipated.

Preserve exactly what the evidence establishes about amount, timing, status, settlement, and usability.

### 26.9 Multi-objective requests and sparse supported-strategy coverage

Operator objectives need not be mutually exclusive.

A legitimate request can be:

> **I want capital-protected growth along with cash flow to meet my stated monthly income obligation.**

Wheelwright need not already possess one supported strategy satisfying every requested capability.

Early strategy coverage can be intentionally sparse. Wheelwright should present the materially distinct supported choices it can establish, explain what each accomplishes and sacrifices, and be explicit about uncovered requirements.

A supported-strategy gap must not be converted into an impossibility claim.

Keep distinct:

- unsupported by Wheelwright's current strategy coverage;
- insufficiently evidenced;
- infeasible under the evidenced state;
- incompatible with another stated requirement.

Therefore:

> **Incomplete strategy coverage is acceptable; hidden incompleteness is not.**

Expanding supported strategy coverage can enrich the action surface over time without creating a new cash-specific primitive.

The adjacent growth/capital-protection taxonomy remains discovery work. This closure does not ratify a Capital Protection regime, Hedged Equity family, collar policy, or multi-objective precedence rule.

### 26.10 Underlying-specific acquisition

Available cash does not imply a particular underlying or equity exposure.

An acquisition question becomes specific only when evidence/operator intent establishes it, for example:

> **I am willing to acquire XYZ, but only below $X.**

That intent can make direct acquisition, a relevant working acquisition order, SELL PUT, patience, staged/partial acquisition where supported, or other materially distinct paths relevant.

Price willingness does not establish acceptance of every acquisition condition or contractual consequence.

This reuses the closed put-side distinctions and does not reopen put-side primitive discovery.

### 26.11 Closure qualifications

Three qualifications explicitly survive closure:

1. **Brokerage financing remains part of complete-state economics.** Margin debit, interest, collateral, and related consequences belong in comparisons where material; household debt optimization does not.
2. **Supported-strategy gaps are distinct from impossibility.** “Wheelwright cannot establish a supported choice satisfying all stated requirements” must not become “no such strategy exists.”
3. **Future-event evidence is not present funding.** A pending transfer or expected event can be relevant evidence without becoming usable cash.

The warning/recommendation/HITL/enforcement distinctions and the repaired evidence-observation loop also survive as part of the durable closure account.

### 26.12 What closure does not decide

Cash-side primitive closure does **not** ratify:

- a cash policy;
- a cash optimizer;
- mandatory deployment;
- a universal yield or return objective;
- a hurdle-rate or discount-rate model;
- valuation or NPV machinery;
- a canonical cash-purpose schema;
- a canonical strategy matrix;
- multi-objective precedence;
- complete strategy coverage;
- a Capital Protection taxonomy;
- lifecycle-history architecture or accounting formulas;
- persistence, API, or implementation design.

Issue #34 remains open.

### 26.13 Closure criterion satisfied

The cash-side discovery attempted to produce materially different operator recommendation or decision boundaries that existing Product distinctions could not explain.

After adversarial review and Principal scope reconciliation, the remaining attacks reduce to:

- existing purpose/objective and quantity distinctions;
- timing/horizon and evidence sufficiency;
- obligations and brokerage-state economics;
- execution/settlement facts;
- supported-strategy coverage;
- operator preferences and broader out-of-scope context;
- complete consequence comparison;
- cross-cutting lifecycle history;
- unratified policy;
- or matters explicitly outside Wheelwright's declared Product scope.

No new cash-specific Product primitive was demonstrated.

Therefore the Principal ratifies the bounded cash-side primitive-discovery closure.

This is Product-discovery closure only. Policy, supported-strategy expansion, multi-objective precedence, lifecycle-history work, and implementation remain open.
