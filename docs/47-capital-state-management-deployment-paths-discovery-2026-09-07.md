# Capital-State Management and Deployment Paths — Discovery Snapshot

**Date:** September 7, 2026  
**Status:** Discovery / reconciled exploration primarily under existing `PL-DEPLOY`, with material refinements to `PL-STRAT-01`, `PL-POL-01`, `PL-PORT-01`, and the Cash-Flow Operating Regime; not implementation authorization  
**Trigger:** Live operator reasoning from current Wheelwright Deployment behavior, real COPX portfolio/activity evidence, and Fidelity Tier 1 trade-ticket observations  
**Related:** `docs/38-entry-mechanism-risk-compensation-finding.md`, `docs/45-operator-strategy-policy-governed-matching-discovery-2026-09-07.md`, `docs/46-options-strategy-surface-fidelity-tier-refinement-2026-09-07.md`, `docs/foundations/regime-objective-function.md`, `PL-DEPLOY`, `PL-STRAT-01`, `PL-POL-01`, `PL-PORT-01`, `PL-DEC-BEH`

---

## Why this snapshot exists

A September 7 operator discussion began with a narrow UI observation: the current **Covered-Call Candidates** surface had only one COPX row, while the existing **Cash Deployment — Prod v0** surface already compared multiple entry mechanisms. The discussion crossed the durability threshold because it exposed a broader model already latent in Wheelwright's foundations:

> **Wheelwright is evolving from option primitives, through strategy comparison, toward capital-state management.**

The important object of decision is increasingly not “which option contract?” or even “which named strategy?” It is:

> **Given the capital states that exist now, what governed state transitions or paths are available, what do those transitions actually mean economically, and which paths best serve the active mission regime?**

This does not replace option primitives or strategies. They become subordinate mechanics used to create capital-state transitions.

The current Cash-Flow Operating Regime already anticipated this direction. Its open questions explicitly ask whether Wheelwright should eventually present a unified **“Where should this capital go?”** surface rather than separate strategy boards. `PL-DEPLOY` already describes a unified Deployment Opportunity as mission-aware portfolio actions. This discovery materially sharpens those existing concepts rather than creating a new backlog namespace.

---

## 1. Concrete trigger: COPX is ordinary residual inventory, not a failure

The Principal currently owns 100 COPX shares because a prior September 4 buy-write call expired just out of the money. Most of that buy-write cohort was called away; COPX was one of the few positions that remained as shares.

The important interpretation is:

> **Having the shares is not wrong. It is simply the capital state produced by a valid lifecycle outcome.**

The original deployment approximately followed:

```text
cash
  -> buy 100 COPX + sell Sep 4 call
  -> collect premium
  -> call expires OTM
  -> 100 COPX shares remain
```

That resolution creates a new decision. It does not mechanically require the next step to be another covered call merely because the conventional wheel would do so.

The current Covered-Call Candidates surface effectively answers:

> “Given shares I own, which covered call can I sell?”

The broader operator question is:

> **“Given shares I own, what productive things can I do with them now?”**

### Historical architecture gap as useful provenance

The one-row COPX behavior is not an evidence-acquisition defect. The existing Calls architecture deliberately chose a narrow operating question: for held, executable inventory, select a single best covered-call recommendation per symbol. Its recommendation logic collapses the available strike/expiration surface to one preferred call for each held symbol even though multi-expiration evidence is available.

That earlier design was reasonable for the capability Wheelwright was building at the time:

> **I own shares; find me a good covered call to write.**

Cash-side reasoning subsequently matured. **Cash Deployment — Prod v0** began comparing multiple alternatives and entry mechanisms across a common production-oriented surface, while Covered-Call Candidates retained the earlier one-best-call-per-symbol model.

COPX makes the resulting asymmetry concrete because the shares themselves were produced by Wheelwright's operating lifecycle:

```text
Cash
  -> COPX buy-write
  -> premium production
  -> short call expires OTM
  -> COPX shares
  -> now what?
```

Wheelwright could reason richly about several ways to deploy cash into COPX, but after that deployment legitimately resolved into COPX shares, the owned-inventory surface reduced the next decision to one covered-call candidate. The system's own operation therefore produced a capital state that its earlier Calls presentation represented more narrowly than the newer Deployment model could support.

This is useful architectural provenance, not a new defect identity. It explains why evolving Covered-Call Candidates is not simply a request for a larger option-chain table or “more rows.” The question itself has matured:

> **Earlier Calls question:** Which single covered call should I write against this held symbol?
>
> **Emerging Deployment question:** Given this owned capital, what materially different governed things can I do with it now?

A related execution-capacity distinction should remain explicit. One unencumbered 100-share lot supports only one simultaneously covered short-call contract, but that does **not** imply recommendation cardinality must be one. Several mutually exclusive one-contract calls can be valid alternatives for the same 100 shares because each expresses a different consequence/compensation bargain. Capacity constrains simultaneous execution; it does not require the decision surface to collapse to one alternative.

This history is the storytelling reason for the proposed Share Deployment evolution:

> **Real Wheelwright deployments began producing owned-inventory states, and the operator needed to compare what that capital should do next.**

No separate parking-lot item is created for this historical gap; it is why-state supporting the existing `PL-DEPLOY` refinement captured by this document.

---

## 2. Natural UI evolution: Cash Deployment → Share Deployment

A first, deliberately incremental UI model emerged by symmetry with the current surface:

> **▾ Cash Deployment — Prod v0**
>
> **▾ Share Deployment — Prod v0**

The current Cash Deployment table already places heterogeneous entry mechanisms such as BW and CSP on one production-oriented comparison surface. The proposed Share Deployment analogue would place heterogeneous actions on owned inventory on one surface.

The **Entry** column should remain leftmost, matching Cash Deployment. On the share side, candidate entry/action values could include:

- `CC` — shares → shares + short call;
- `Collar` — shares → shares + long put + short call;
- `Sell` — shares → cash;
- `Hold` — shares → remain shares.

This is intentionally less tool-oriented and more outcome-oriented than separate accordions such as Covered-Call Candidates, Collar Candidates, Protective-Put Candidates, etc.

A working conceptual table is:

| Entry | Symbol | Flavor / intent | Structure | Immediate effect | Possible resulting state | Mission-relevant consequence |
|---|---|---|---|---|---|---|
| CC | COPX | Income-first | nearer/lower call | premium received | shares + short call → possibly cash | more current production, tighter upside cap |
| CC | COPX | Balanced | e.g. Sep 18 $93 call | premium received | shares + short call → possibly cash | production plus plausible cycle completion |
| CC | COPX | Participation-first | farther OTM call | smaller premium | shares + short call → possibly cash | retain more upside for less current production |
| Collar | COPX | Protection | long put + short call | debit/credit depends on strikes | protected shares | spend/surrender some economics for downside boundary |
| Sell | COPX | Return to cash | market sell 100 shares | cash released | cash | realize current result and restore deployment freedom |
| Hold | COPX | Full participation | no trade | none | shares | preserve uncapped equity exposure and downside |

`Flavor / intent` is provisional vocabulary. Multiple CC rows are clearly useful; explicit named flavors should not be promoted into architecture until operating pressure proves they help.

---

## 3. Multiple covered calls are materially different outcomes, not duplicate contracts

A covered call is not one outcome. Different strikes and expirations express different bargains among:

- current premium production;
- upside retained;
- call-away/disposition likelihood;
- time until the next capital-state decision;
- recovery/appreciation required before disposition;
- execution quality.

For the same COPX shares, Wheelwright could eventually surface several materially distinct CC alternatives rather than one “best covered call.” Examples include income-first, balanced, disposition-oriented, participation-first, short-cycle, or longer-cycle expressions.

The important principle is not the labels. It is:

> **One symbol and one current share lot can legitimately produce multiple governed alternatives because different contracts create different capital consequences.**

This is consistent with the existing 0..N recommendation invariant from Operator Strategy Policy.

---

## 4. Cost basis adds context without becoming a command

The supplied Fidelity Activity CSV establishes the real COPX acquisition history used in this discussion:

- 100 COPX acquired August 24, 2026 at approximately **$94.93/share**;
- cash outlay approximately **$9,492.80**;
- Sep 4 $95 call sold for **$3.42/share**;
- net call premium received after commission/fees approximately **$341.34**;
- the Sep 4 call later expired, leaving the 100 shares.

This creates at least two useful basis concepts:

### Stock/accounting acquisition basis

Approximately:

> **$94.93/share**

At the sealed Wheelwright reference price of $90.66, the shares alone show approximately **-$427** unrealized change.

### Capital-cycle economic basis

If the prior net option premium is treated as production already received from the same deployment cycle:

```text
$9,492.80 stock outlay
-  $341.34 prior net call premium
= $9,151.46 net capital after prior premium
= $91.5146/share cycle basis
```

At $90.66, the complete prior buy-write cycle is therefore only about **$85.46 below** that net capital figure, even though the shares themselves are approximately $427 below acquisition basis.

These are different facts serving different questions. Wheelwright should not collapse them.

Most importantly:

> **Cost basis is state/history context, not a veto on a forward capital-allocation decision.**

“Do not sell below basis” is not a valid universal policy. The relevant question is what the capital can productively do from its current state under the active mission regime and operator policy.

---

## 5. Concrete COPX CC comparison with basis context

Two live/sealed examples illustrate why basis-aware Share Deployment could be more informative than a single covered-call candidate.

### Sep 18 $93 covered call — current Wheelwright candidate

Current sealed Wheelwright evidence showed approximately:

- COPX spot: **$90.66**;
- Sep 18 $93 call;
- midpoint approximately **$1.98**;
- 14 DTE;
- execution quality 86/100;
- 100 available shares;
- imported average stock cost approximately $94.93/share.

If the call were sold near $1.98 and the shares were ultimately called at $93, then relative to the prior cycle basis:

```text
$93.00 exit
+ 1.98 new call premium
-91.5146 prior cycle basis
= about +$3.4654/share
= about +$346.54 across 100 shares before new transaction friction
```

Thus `$93 < $94.93` does **not** mean the complete production cycle necessarily ends at a loss. It means the shares exit below their stock acquisition basis; prior and current option production are separate economic facts that must remain visible.

### Sep 11 $95 covered call — strike near stock basis

Fidelity showed:

- COPX spot: **$90.66**;
- Sell to Open 1 Sep 11 $95 call;
- bid approximately $0.45;
- midpoint approximately $0.525;
- ask approximately $0.60;
- entered limit $0.52;
- estimated proceeds after $0.65 fee approximately $51.35.

The $95 strike is almost exactly the $94.93 stock acquisition basis. At $0.52 gross premium, the cycle basis after the new call would be approximately $90.9946/share. If called at $95, the cumulative cycle result would be approximately +$4.0054/share before the new fee, or about +$399.89 after the displayed $0.65 new fee.

The $93 and $95 calls therefore express materially different capital-management bargains:

- **$93 call:** more current premium / earlier possible disposition / less retained upside;
- **$95 call:** less current premium / more recovery and upside retained / disposition nearer original stock basis.

Cost basis gives these alternatives meaning without dictating which is correct.

---

## 6. Selling shares can be rational even at a realized loss

A key correction emerged from the COPX example:

> **Asset acceptability and current capital allocation are separate questions.**

The conventional rule “only accept assignment in something you are willing to own” is an admission/acceptability constraint. It does not imply that, once shares exist, they must remain the preferred use of capital.

If the operator independently decides “I want to dump these shares,” no motive inference is required. The operator may execute at Fidelity and later CSV evidence tells Wheelwright that the state changed.

Wheelwright could also eventually originate a recommendation that shares should be converted to cash because another admissible deployment appears materially better. The agency boundary remains:

> **Wheelwright may recommend a capital-state transition. The operator authorizes it. The broker executes it. Later portfolio/activity evidence confirms what actually happened.**

Selling COPX at $90.66 would realize the stock loss and release roughly $9,066 of cash. The decision is not correctly framed as “should I wait until COPX gets back to $94.93?” It is closer to:

> **Is keeping this capital in COPX the best governed use of it from here, or is accepting the current erosion and redeploying the released cash superior under the active mission?**

Time and foregone alternative production are opportunity costs. Basis should not chain capital to an asset.

---

## 7. Share → cash may be an intermediate state, not the recommendation endpoint

This was the major conceptual step toward a merged Deployment surface.

A recommendation need not end at:

```text
COPX shares -> cash
```

It can describe a complete path:

```text
COPX shares -> cash -> XYZ CSP
COPX shares -> cash -> XYZ BW
COPX shares -> cash -> COPX CSP
COPX shares -> cash -> COPX BW
```

The last two are not contradictions. Selling current COPX ownership and then accepting a compensated conditional COPX obligation can be economically different from simply retaining unconditional current ownership. Likewise, selling and re-entering through a buy-write may usually be dominated after friction, but Wheelwright should determine that from economics rather than from a rule that the sequence “looks silly.”

This yields an important distinction:

- **atomic transition:** `COPX shares → cash`;
- **deployment path:** `COPX shares → cash → another governed productive state`.

The operator generally cares more about the complete path because it explains why realizing a current loss might improve the use of capital.

---

## 8. From separate Cash/Share Deployment toward Capital Deployment

The first natural UI evolution is still useful:

> **Cash Deployment — Prod v0**
>
> **Share Deployment — Prod v0**

But once `Shares → Cash → new deployment` is admitted, the boundary between the two tables becomes increasingly artificial. The deeper model is a potential future unified surface:

> **▾ Capital Deployment — Prod v0**

A row on that future surface may represent a capital-state path rather than merely a trade.

Working model:

| Entry / path | Current state | Mechanism | Resulting state | What it means |
|---|---|---|---|---|
| BW | Cash | buy shares + short call | shares + short call | immediate ownership + premium + capped upside |
| CSP | Cash | short secured put | cash obligation → possibly shares | premium for conditional ownership |
| CC | Shares | short call | shares + short call → possibly cash | monetize owned inventory / accept cap |
| Collar | Shares | long put + short call | protected shares | buy downside boundary with premium/upside economics |
| Sell | Shares | market sale | cash | realize current result / restore deployment freedom |
| Hold | Shares | none | shares | retain full equity exposure |
| Sell → CSP | Shares | sale, then CSP | secured-put state | accept erosion now to pursue compensated conditional ownership elsewhere or even in same symbol |
| Sell → BW | Shares | sale, then BW | new shares + short call | move capital to a different integrated production bargain |

This directly sharpens existing `PL-DEPLOY` language: the Deployment Opportunity is increasingly a **mission-aware portfolio action/path**, not a strategy-specific candidate row.

The hierarchy now appears to be:

```text
options primitives
    -> strategy / mechanism
    -> capital-state transition
    -> capital-state path
    -> mission-relative governed alternative
```

Or in operator terms:

> **Which option? → Which strategy? → Which use of this capital?**

---

## 9. Strategies become mechanisms; outcomes become the comparison center

This discovery does not make strategies unimportant. It changes their level of abstraction.

- **Options primitives** describe calls, puts, strikes, expirations, quantities.
- **Strategies/mechanisms** describe how primitives are combined: CSP, BW, CC, collar, spread, etc.
- **Capital states** describe what the portfolio currently owns/owes/encumbers.
- **Transitions/paths** describe what the operator can cause the capital to become.
- **Mission regime** determines what consequences mean and which outcomes are valuable.

This is less “options toolbox” and more **capital decision support**.

A useful formulation is:

> **Options are instruments. Strategies are mechanisms. Capital outcomes are the objective-facing unit of comparison.**

---

## 10. Collar discovery: first explicit owned-inventory risk-management candidate

The collar discussion materially helped expose this model.

A simple mental model is:

> **Collar = protected covered call**

or from the other direction:

> **Collar = subsidized protective put**

Economic position shape:

```text
long 100 shares + long 1 put + short 1 call
```

Its value to Wheelwright is not that it is “another monthly-income strategy.” The put can reduce current production. Its more important role is as an owned-inventory capital-management action:

> **sacrifice some current production/upside to preserve productive capital through a mechanically bounded downside floor.**

This fits the hard mission precisely because the mission is not maximum premium; it is sustainable realized production **while preserving productive capacity**.

The collar also reinforces Policy over Prediction. It can be justified consequence-first:

> “I am unwilling to tolerate losses below this floor; I am willing to surrender gains above this cap at this cost.”

That does not require a forecast that terminal price will remain between the strikes.

---

## 11. Economic position shape is not broker order shape

Fidelity Tier 1 UI evidence corrected an earlier derived assumption in `docs/46-options-strategy-surface-fidelity-tier-refinement-2026-09-07.md`.

The Principal's account visibly shows **Tier 1** and the Fidelity trade ticket exposes **Collar** as an available strategy. When 100 shares are already owned, Fidelity's Collar ticket shows only two option legs:

- Buy to Open 1 put;
- Sell to Open 1 call.

The stock leg is not part of the new order because it already exists in the portfolio.

Therefore:

> **The `docs/46` Collar = Tier 2 derived mapping is superseded by this observed account/UI evidence. Current evidence: Collar is available on this Tier 1 account, account/context-specific.**

This suggests an evidence vocabulary for broker-permission claims:

- **explicit-doc** — broker documentation explicitly states permission;
- **observed-ui** — capability directly observed on the relevant account UI;
- **derived** — inferred from broader broker permissions;
- **conditional/unverified** — unresolved or dependent on context.

It also establishes a broader invariant:

> **Economic position shape ≠ broker order/trade shape.**

Examples:

- covered call economic position: shares + short call; order when shares already owned: sell call;
- protective put economic position: shares + long put; order: buy put;
- collar economic position: shares + long put + short call; order when shares already owned: buy put + sell call;
- buy-write includes stock in the transaction because the shares are acquired as part of entry.

This distinction may later matter for PMCC, synthetics, rolls, adjustments, and other structures that modify existing inventory.

---

## 12. Broker order-level risk is not necessarily resulting portfolio risk

A Fidelity collar example exposed another important distinction. Fidelity displayed “Max Loss Unlimited” for a two-option collar order even though the account already held 100 COPX shares.

The display is **consistent with** Fidelity evaluating the submitted two-option order independently, where the short call appears naked in the order-only shape. Wheelwright must not claim this internal calculation method as confirmed.

What is confirmed conceptually is:

> **An order-level broker risk display can differ materially from the consequence envelope of the resulting portfolio when an order modifies existing inventory.**

Wheelwright should reason about the resulting portfolio state, not blindly copy an order-only risk label.

---

## 13. Concrete collar examples and execution caution

Two COPX collar experiments were discussed against spot approximately $90.66.

### Sep 11 $85 put / $100 call

Entered approximately $0.15 net debit; estimated debit including $1.30 fee approximately $16.30.

Approximate resulting portfolio envelope relative to $90.66 reference:

- floor loss: about **$581** before considering fee detail;
- capped gain: about **$919**.

### Sep 11 $88 put / $104 call

Observed option quotes approximately:

- $88 put: $0.80 bid / $0.925 midpoint / $1.05 ask;
- $104 call: $0 bid / $0.375 midpoint / $0.75 ask;
- combined net: approximately $0.05 bid / $0.55 midpoint / $1.05 ask;
- entered net debit: $0.55;
- estimated debit including $1.30 fee: $56.30.

Approximate resulting portfolio envelope relative to $90.66:

- floor loss: about **$321** (~3.5%);
- capped gain: about **$1,279** (~14.1%);
- before fee refinement.

This is a wide collar: relatively close downside protection while retaining substantial upside.

However, the $104 call had no bid and a $0.75 ask. The combined market was extremely wide. Therefore the midpoint is only an indicative hypothesis, not executable economics.

General rule:

> **Consequence surfaces must use honest execution assumptions. Midpoint economics are not production until the market can actually provide them.**

---

## 14. Production, erosion, and the hard mission

The governing mission remains hard:

> **Sustain target monthly realized production from available capital while preserving the productive capacity of that capital.**

The Principal clarified an important operating rule: the amount shown by Production for the prior month will be withdrawn. Production is therefore not automatically retained in the account to repair capital erosion.

A simple example demonstrates the distinction:

```text
start productive capital: $10,000
realize stock loss:          -$500
remaining capital:          $9,500
generate premium:            +$501 production
withdraw prior-month production: -$501 from the system when distributed
```

The $501 can satisfy the income/production objective, but if it is distributed it cannot simultaneously be counted as restoration of the $500 productive-capital erosion.

Therefore Wheelwright must not double-count production as both distributable output and retained capital repair.

This sharpens two distinct flows:

- **productive output:** realized production reported by Production and subsequently withdrawn under the current operating rule;
- **productive capacity:** the capital base/NAV that remains available to generate future production.

The hard mission requires both. High premium can coexist with capital consumption; that is not sustainable merely because monthly production looks strong.

---

## 15. Erosion semantics belong to mission regimes, not to capital-state mechanics

The discussion then corrected a potential overreach. “Erosion” is an observed economic condition. What erosion **means for a decision** should not be hard-coded universally into the capital-state substrate.

The current Cash-Flow Operating Regime already states that it is a regime, not Wheelwright's permanent identity; a capital-preservation or growth regime could have different operational objectives while governing principles survive.

Therefore:

> **Capital-state machinery should describe the state transition and its consequences. The active mission regime should supply the semantics for how those consequences are valued, constrained, or tolerated.**

Examples of regime-specific questions include:

- Is any realized erosion prohibited, or only erosion beyond a bound?
- Is production distributed, retained, or partly retained?
- Must prior erosion be recovered before distribution?
- How is capital velocity valued relative to temporary or realized loss?
- How much current production may be surrendered for downside protection?
- How are appreciation, premium, and realized capital changes combined or kept separate?

This does **not** ratify new regimes or specific parameter values. It records the architectural pressure that erosion semantics and similar consequence treatment may be parameters/policy of the active mission regime rather than universal definitions in strategy code.

`PL-POL-01` Cash-Flow-Safe Recovery is directly relevant: its existing thesis that premium production may defer/mitigate NAV erosion should be revisited under the explicit operating fact that Production is withdrawn, because distributed production cannot also be treated as retained capital repair.

---

## 16. Return to the questionnaire: Operator Strategy Policy becomes broader

This discussion loops directly back to `docs/45-operator-strategy-policy-governed-matching-discovery-2026-09-07.md`.

That artifact already established:

> **The questionnaire is an elicitation mechanism, not the architecture.**

and:

> **operator policy × strategy characteristics × current evidence × portfolio state → governed alternatives**

The capital-state discovery strengthens and broadens that model.

The questionnaire/policy should not merely answer:

> “Which named strategies does this operator permit?”

It can help establish:

> **What consequences may capital be exposed to, what outcomes matter under the active mission, and which state transitions or paths may Wheelwright recommend?**

The earlier questions remain highly relevant: objective, ownership relationship, assignment, call-away, adverse consequence, bounded loss, recurring premium importance, upside surrender, hedge cost, reward surface, prediction dependence, lifecycle management, execution friction, capital efficiency versus robustness, and portfolio role.

The emerging conceptual flow is therefore closer to:

```text
Mission regime
    -> Operator policy
    -> Current capital state
    -> construct admissible capital-state paths
    -> strategy/broker/account eligibility
    -> current evidence and executable contracts
    -> consequence envelope
    -> compensation relative to consequence
    -> mission fitness
    -> 0..N recommended paths + exclusions + reasons
```

This is a refinement, not a rejection, of the durable Operator Strategy Policy work.

---

## 17. Mission versus policy versus mechanics

A useful separation emerging from the discussion is:

### Mission regime

Defines what the capital system is trying to accomplish and the semantics of success/constraint in that regime.

Current example: recurring realized production while preserving productive capacity.

### Operator policy

Defines what consequences the operator is willing to own in pursuit of the mission: assignment, call-away, bounded loss, hedge cost, lifecycle complexity, prediction dependence, etc.

### Capital-state manager / Deployment reasoning

Describes current state, constructs available transitions/paths, computes consequences, and compares admissible paths under mission and policy.

### Strategy / mechanism

Provides the mechanics for a transition: CSP, BW, CC, collar, spread, outright sale, no-action/hold, etc.

### Options primitives

Calls, puts, strikes, expirations, quantities, prices, Greeks, liquidity evidence.

This hierarchy prevents a mission objective such as monthly income from being confused with a strategy or a capital state.

---

## 18. `Prod v0` pressure: local trade productivity versus path fitness

The current `Prod v0` surface is valuable because it already compares BW and CSP across a common production-oriented lens. Capital-state management creates pressure on what that score/object eventually means.

A future path-level interpretation may need to account for:

- realized production;
- capital committed;
- capital velocity / time to next decision;
- productive-capital preservation / erosion;
- opportunity cost of retaining the current state;
- conditional resulting state;
- execution quality;
- concentration;
- operator-policy fitness;
- mission-regime semantics.

This does **not** authorize changing `Prod v0`, inventing a composite score, or collapsing hard constraints into weighted terms. The existing regime foundation already warns that governance, execution, concentration, affordability, and erosion may be gates rather than score components. The present discovery simply makes the path-level comparison problem concrete.

---

## 19. Important invariants and corrections

1. **Having shares is not failure.** It is a capital state that may be a valid lifecycle consequence.
2. **Assignment/expiration is not the end of decision-making.** Resolution creates a new state and therefore a new decision opportunity.
3. **Asset acceptability ≠ current allocation preference.** Willingness to own does not imply shares should remain the best use of capital forever.
4. **Cost basis is context, not destiny.** Historical basis informs consequences but does not command recovery before redeployment.
5. **Stock basis ≠ capital-cycle basis.** Both can be useful and must not be silently conflated.
6. **Production ≠ capital repair when production is distributed.** Do not double-count the same dollars.
7. **Strategy ≠ objective.** Strategies are mechanisms for creating capital-state transitions.
8. **Economic position shape ≠ broker order shape.** Existing inventory changes what must be submitted.
9. **Order-level risk display ≠ resulting portfolio consequence envelope.** Wheelwright reasons about the resulting state.
10. **Midpoint ≠ executable economics.** Wide/no-bid markets can invalidate attractive theoretical structures.
11. **Sell is a legitimate state transition even if Wheelwright does not execute it.** Wheelwright may recommend; operator authorizes; broker executes; evidence later confirms.
12. **Hold is a legitimate baseline/no-transition alternative.** It need not be an options trade to belong in the decision space.
13. **Share → cash can be intermediate.** Complete deployment paths can continue into a new premium-producing state.
14. **Same-symbol redeployment is not inherently contradictory.** Selling shares and later selling a CSP on the same symbol changes unconditional ownership into a compensated conditional obligation.
15. **Recommendation cardinality remains 0..N.** No path is required merely because capital exists.
16. **Mission semantics belong above strategy mechanics.** Erosion, protection cost, retained/distributed production, and similar concepts may be interpreted differently by different regimes.
17. **Execution capacity ≠ recommendation cardinality.** One 100-share lot can support only one simultaneously covered short call, while several mutually exclusive covered-call alternatives can still be valid recommendations.
18. **The one-row Calls design is historical architecture, not an evidence limitation.** Multi-expiration evidence can exist while the recommendation surface deliberately collapses it to one best call per held symbol.

---

## 20. Reconciliation

### Primary canonical identity

**`PL-DEPLOY` — Deployment Opportunity / Unified Surface**

This discovery most directly strengthens the already-accepted direction to normalize strategy-specific candidates into mission-aware portfolio actions and the existing “where should this capital go?” model.

No new `PL-*` identity is created.

### Secondary mappings

- **`PL-STRAT-01`** — strategy expansion / Operator Strategy Policy is refined: strategy becomes a mechanism inside governed capital-state paths; policy matching may operate on consequence/path characteristics rather than only named strategy families.
- **`PL-POL-01`** — cash-flow-safe recovery/erosion semantics require explicit treatment under the operating fact that reported production is withdrawn; distributed production cannot simultaneously restore productive capital.
- **`PL-PORT-01`** — portfolio-state maturity and lot/basis attribution matter because correct path consequences can depend on stock basis, lot provenance, encumbrance, and prior production history.
- **`PL-DEC-BEH`** — basis, realized loss, and “getting back to even” create obvious anchoring/sunk-cost pressure; Wheelwright should expose consequences without making historical basis a behavioral command.
- **`PL-EXEC-01`** — operator/broker/evidence boundaries remain: recommendation, authorization, execution, later observed state.

### Strategic disposition

**Strengthens existing direction; no roadmap change required.**

The current Regime Objective Function and `PL-DEPLOY` already anticipate unified capital deployment. This discovery gives that direction a concrete owned-inventory case and extends comparison from cash-entry mechanisms to complete capital-state paths.

### Architectural disposition

**Refines existing governed-alternatives / Deployment Opportunity pressure; no new architecture direction is authorized.**

The discovery suggests that the durable comparison object may eventually need to represent current state, transition/path, resulting state, consequence envelope, compensation, and mission/policy fitness. It does not authorize a generic state-machine framework, arbitrary strategy DSL, optimizer, path search engine, new recommendation service, or UI implementation.

### Why-state

This document is the rich why-state snapshot. It preserves the concrete COPX trigger, basis calculations, Fidelity collar observations, execution cautions, UI evolution, mission-regime distinction, return to Operator Strategy Policy, and the historical reason the intentionally narrow Covered-Call Candidates surface became insufficient as Deployment matured.

### Next authorized mode

**Further exploration / design only.**

Useful next questions include:

1. What is the smallest useful representation of a capital-state path without prematurely building a generic state machine?
2. Should Share Deployment be built as an intermediate learning surface before any merged Capital Deployment surface?
3. Which current `Prod v0` dimensions remain meaningful for Hold, Sell, Collar, and multi-step redeployment paths?
4. Which mission-regime consequences are hard gates versus graded comparisons?
5. What basis/provenance data are required for correct owned-inventory consequence reasoning, especially multi-lot symbols?
6. How should Wheelwright compare `keep current shares + overlay` against `sell + redeploy elsewhere` without combinatorial explosion?
7. How should Operator Strategy Policy evolve from strategy-family matching toward consequence/path matching while preserving the existing 0..N and hard-gate invariants?
8. How should the active regime explicitly define distribution, retained production, and erosion semantics?
9. Which broker/account capabilities need observed verification before a path can be considered executable?

**Not authorized:** implementation of Share Deployment or Capital Deployment, changes to `Prod v0`, automatic selling/redeployment, direct broker execution, strategy admission, generalized path/state-machine framework, new mission regimes, policy promotion, or roadmap reprioritization.

---

## Snapshot thesis

The discussion can be compressed to one durable model:

> **Wheelwright began with options primitives, learned to compare strategies, and is now encountering the need to manage capital states. A strategy is a mechanism for moving capital from one state to another. A recommendation can be a complete path through states, not merely a contract. The active mission regime says what the consequences mean; Operator Policy says which consequences are acceptable; current evidence says which paths are actually available; Wheelwright compares 0..N governed alternatives; the operator decides.**