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
