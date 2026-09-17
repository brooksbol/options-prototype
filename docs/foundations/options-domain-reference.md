# Wheelwright Options Domain Reference

**Ratified:** September 16, 2026
**Status:** Principal-ratified specialized reference.
**Authority:** Category E — Current Specialized Reference. Its factual mechanics are authoritative domain knowledge because they are externally grounded (see Part 5); this reference is **non-authoritative for Wheelwright policy** (policy lives in Category A/B authority, ADRs, foundations, and Principal direction). It does not carry Category A system-definition authority.
**Companion:** `options-domain-competence-contract.md` (Category B, ratified). That contract governs *when an actor must establish options economics before dependent work*; this reference is the durable place actors go to *establish* them. It is the landing place a `STOP DOMAIN — NOT SPECIFIED` routes to.
**SYNC SHA at authoring:** `a08b271100208e6bbf1a30002677c6d7336ff827` (remotely verified accepted `main`).

---

## How to read this reference

This is an **operational reference, not a textbook**. Its job is to let a Wheelwright actor (Principal, ChatGPT, Kiro, Codex) reason correctly about *what an option position economically is and does* before designing, implementing, reviewing, or accepting software that depends on it — so we do not spend effort implementing an economically wrong model.

Five parts, in retrieval order:

1. **Options Economic Model** — the compact, always-read core.
2. **Lifecycle / Structure Matrices** — the working lookup for the structures Wheelwright handles.
3. **Semantic Specimens** — contrasting worked cases used to *attack* proposed generalizations.
4. **Focused Depth** — retrieved only when a concrete trigger appears.
5. **External Grounding Map** — claim-appropriate authority, and what each source class can and cannot establish.

**Every claim carries a class tag** so convention never masquerades as fact and mechanics never masquerade as policy:

- `[MECH]` mechanical/contractual fact (clearing/exchange defined)
- `[BROKER]` broker/account operational treatment (varies by broker; requires account evidence)
- `[THEORY]` financial theory / mathematical relationship
- `[EMPIRICAL]` statistical tendency (conditional, not mechanical)
- `[HEURISTIC]` practitioner convention (contestable; never a fact or a policy)
- `[WW-POLICY]` current Wheelwright ratified policy (cite the ADR/foundation)
- `[WW-INTENT]` Wheelwright strategy intent (situation/mission)
- `[UNRESOLVED]` not established / not decided — must not be silently resolved

> **Support status ≠ diagnostic boundary.** "Wheelwright does not currently do X" is **not** "X is rejected." Unless explicit support authority establishes rejection, an unused concept is `[UNRESOLVED]` — "not currently operationalized," never "deliberately excluded."

---

# PART 1 — Options Economic Model (the always-read core)

*Usability target ~1,000–2,000 words. If it grows past that, something structure-specific leaked in and belongs in Part 2 or 4.*

## 1. An option is a contract with two asymmetric sides

`[MECH]` A standardized U.S. equity/ETF option **ordinarily has a 100-share deliverable before adjustment** — a contract on a specific underlying at a fixed **strike**, expiring on a fixed date. The deliverable is a contract term, **not a constant**: corporate actions can change it (see Part 4 D8 / Specimen 7). Always read the deliverable from the applicable contract rather than assuming 100 shares.

- A **call** gives the *holder* the right to **buy** the underlying at the strike. `[MECH]`
- A **put** gives the *holder* the right to **sell** the underlying at the strike. `[MECH]`

The two sides are **not symmetric**:

- The **holder (long)** paid a premium and holds a **right**, never an obligation. Maximum loss = premium paid. `[MECH]`
- The **writer (short)** received a premium and holds an **obligation** to perform if assigned. `[MECH]`

> **Load-bearing:** "short option" tells you there is an obligation. It does **not** tell you what backs it, which direction it resolves, or what you own. You must name the *complete position*.

## 2. The four order actions (open vs close)

`[MECH]` Every option order is one of a 2×2 (buy/sell × open/close):

- **BTO** Buy To Open — become long (acquire a right).
- **STO** Sell To Open — become short (accept an obligation, receive premium).
- **BTC** Buy To Close — retire an existing short (pay to extinguish your obligation).
- **STC** Sell To Close — retire an existing long (sell the right you hold).

`[MECH]` "Open" changes what obligations/rights exist; "close" retires an existing one. **BTC is defined by what you already hold.** BTC of a short put and BTC of a short call are the *same action verb* on *economically different positions* and therefore leave *different residual states* (see Part 3, Specimen 1). Do not assume BTC has one meaning.

## 3. Premium = intrinsic + extrinsic value

`[THEORY]` An option's price decomposes as:

- **Intrinsic value** — the in-the-money amount: `max(0, S−K)` for a call, `max(0, K−S)` for a put (S = underlying price, K = strike). `[MECH]`/`[THEORY]`
- **Extrinsic (time) value** — everything above intrinsic; a function of time remaining, volatility, and carry. `[THEORY]`

> **Load-bearing:** almost every lifecycle decision is really a statement about **remaining extrinsic value** — early assignment risk, "is it worth closing," take-profit, roll economics. Wheelwright's DTE + moneyness heuristics are *proxies* for extrinsic value; name the real quantity when the decision depends on it.

## 4. Moneyness

`[MECH]` OTM / ATM / ITM describe strike vs underlying:

- Call: ITM when `S > K`, OTM when `S < K`. Put: ITM when `S < K`, OTM when `S > K`.
- ATM ≈ strike near underlying.

Moneyness governs *resolution direction* but is **not** by itself a probability, a decision, or a final outcome (see §Delta, §Expiration).

## 5. Lifecycle events (four distinct kinds)

Distinguish the *kind* of transition — this typing is used in Part 2:

- **Operator action** — you choose it: BTO/STO/BTC/STC, roll, early close.
- **Continued state** — HOLD: no transition now; obligation and exposure persist.
- **Counterparty event** — you do not control it: early assignment (American-style).
- **Natural contract resolution** — expiration: worthless if OTM, or exercise/assignment if ITM.

`[MECH]` **American-style** equity/ETF options can be assigned **any business day before expiration**, not only at expiration. `[MECH]` **Assignment is not controllable by the writer** — OCC assigns randomly to a clearing member, which then allocates to a customer (see Part 4).

## 6. Settlement: equity/ETF options are physically settled

`[MECH]` **Standard, unadjusted** equity and ETF options ordinarily settle by **physical delivery of the specified shares**: an exercised/assigned ITM option is exchanged for shares, not cash. But the actual settlement form and deliverable must be read from the **applicable contract / OCC adjustment** — an adjusted contract can carry a cash component or a non-standard deliverable (see Part 4 D8 / Specimen 7), and index options (e.g. SPX) cash-settle (out of Wheelwright scope). Establish physical settlement before relying on it; do not assume it.

`[MECH]` Since **2024-05-28**, U.S. stock trades settle **T+1** (one business day). The share leg from assignment/exercise therefore settles on the stock cycle, not instantaneously.

> **Load-bearing:** assignment on a covered call delivers *shares out* and cash in at the strike; assignment on a cash-secured put delivers *shares in* and cash out at the strike. "Assignment" is not one outcome.

## 7. The capital ladder — the most misused part of the domain

These are **distinct** and must never be collapsed `[MECH]`/`[BROKER]`:

1. **Mechanical notional** — `strike × 100 × contracts`. An arithmetic fact about the contract. `[MECH]`
2. **Collateral / encumbrance** — what a strategy ties up: cash for a cash-secured put, shares for a covered call. `[MECH]` for the *nominal* amount.
3. **Margin requirement** — the broker/regulatory amount actually reserved; governed by Reg-T / FINRA Rule 4210 and the broker's house rules. **"Cash-secured" is a broker/account collateral treatment, not a clearing mechanic.** `[BROKER]`
4. **Broker buying power** — what the broker says you can deploy. `[BROKER]`
5. **Settled cash / deployable capital** — cash actually available, post-settlement. `[BROKER]`

> **Capital invariant (load-bearing):** retiring an obligation removes *that obligation's attributable encumbrance* — nothing more. It does **not** by itself establish cash received, buying power created, settled cash, deployable capital, or a broker-recognized capacity increase. Those require **broker/account evidence**. Nominal notional is arithmetic; deployable capacity is a broker fact.

## 8. Mechanics / Evidence / Policy — keep three questions separate

For any options conclusion, separate:

- **Mechanics** — what economically happens if the event occurs? (true even when the market is closed)
- **Evidence** — which admissible facts establish *this* position's current state? (underlying price, option quote, provenance, broker state)
- **Policy** — given mechanics + evidence, what does Wheelwright *prefer*? `[WW-POLICY]`/`[UNRESOLVED]`

> Evidence unavailable for one conclusion must not erase an independently supported conclusion that does not depend on it. Mechanics must not be invented to satisfy policy. Policy must not be inferred from mechanics.

## 9. Complete-position rule

`[MECH]`/`[THEORY]` Never infer economic meaning from an isolated leg. A short call *alone* is an undefined-risk position; a short call *against 100 owned shares* is a covered call with bounded, entirely different economics. Conversely, do not assume different implementation/lifecycle forms imply different terminal economics: a cash-secured put and a covered call at the same strike/expiration are **synthetically similar in payoff** (put–call parity) `[THEORY]` while differing in capital form and assignment direction (see Part 3, Specimen 3).

---

# PART 2 — Lifecycle / Structure Matrices

Working lookup for the structures Wheelwright currently handles: **cash-secured put (CSP)**, **covered call (CC)**, **buy-write (BW)**. Schema:

`Before → Action/Event → Cash Flow → Assets After → Obligations After → Exposure After → Encumbrance After → Evidence Required → Policy Still Required`

`Kind` column: **A**=operator action, **C**=continued state, **X**=counterparty event, **R**=natural resolution.

## 2.1 Cash-Secured Put (CSP)

The obligation is to **buy** shares at strike; backed by **cash**. `[MECH]` "Cash-secured" is the `[BROKER]` collateral treatment; the contractual short put is the `[MECH]` obligation. (A short put *without* established cash security is **not** a CSP — see §Short put ≠ CSP.)

| Before | Action/Event | Kind | Cash Flow | Assets After | Obligations After | Exposure After | Encumbrance After | Evidence Required | Policy Still Required |
|---|---|---|---|---|---|---|---|---|---|
| Cash | STO put | A | **+ premium (historical inflow at open)** | Cash (incl. premium received) | Short put | Obligation to acquire at strike if assigned | Cash `strike×100×n` reserved (nominal) | option quote, underlying | Is acquisition at strike acceptable? `[WW-POLICY]` |
| Short put | HOLD | C | none now | unchanged | Short put | unchanged | unchanged | underlying (moneyness), DTE | none if already governed |
| Short put | BTC | A | **− debit now (new outflow)** | Cash − debit; **no shares** | none (from this leg) | flat on this leg | this leg's cash encumbrance released (nominal; broker confirms capacity) | option quote (for debit); underlying | Was closing preferred over holding? `[UNRESOLVED]`/`[WW-POLICY]` |
| Short put | Expire OTM | R | none now | Cash unchanged | none | flat | released (nominal) | underlying at expiry, session finality | none |
| Short put | Assignment (ITM) | X/R | − `strike×100×n` now | **Shares acquired** at strike | none (obligation consumed) | long shares | cash converted to shares (T+1) | broker Activity (authoritative) | Manage resulting shares (CC? hold? sell?) `[UNRESOLVED]` |
| Short put (n) | **Partial** assignment (m<n) | X | − `strike×100×m` | m×100 shares + (n−m) still short | (n−m) short puts remain | mixed | partial | broker Activity | Re-evaluate residual short + new shares |

## 2.2 Covered Call (CC)

Own ≥100 shares; sell a call against them. The obligation is to **sell** shares at strike; backed by **shares**. `[MECH]`

| Before | Action/Event | Kind | Cash Flow | Assets After | Obligations After | Exposure After | Encumbrance After | Evidence Required | Policy Still Required |
|---|---|---|---|---|---|---|---|---|---|
| Shares | STO call | A | **+ premium (historical inflow at open)** | Shares (+ cash from premium) | Short call | Shares, upside capped at K | `n×100` shares encumbered by call | option quote, shares owned | Is disposition at strike acceptable? `[WW-POLICY]` |
| Shares + short call | HOLD | C | none now | unchanged | Short call | unchanged | unchanged | underlying, DTE, (dividend calendar if ITM near ex-date) | none if governed |
| Shares + short call | BTC | A | **− debit now (new outflow)** | **Shares retained (now uncapped)** | none (from call) | full share exposure restored | call encumbrance released; **shares still held, no cash created** | option quote (debit); underlying | Why uncap? (keep upside / avoid assignment) `[UNRESOLVED]` |
| Shares + short call | Expire OTM | R | none now | Shares unchanged | none | shares, uncapped | released (shares) | underlying at expiry, session finality | Re-write? `[WW-POLICY]` |
| Shares + short call | Assignment / call-away (ITM) | X/R | + `strike×100×n` now | **Shares gone**; cash at strike | none | flat (no shares) | shares delivered out (T+1) | broker Activity | Redeploy proceeds? `[UNRESOLVED]` |
| Shares + short call | **Early** assignment (dividend) | X | + `strike×100×n` now | Shares gone **before** ex-date; **dividend forfeited** | none | flat | shares delivered out | broker Activity; dividend/ex-date | Was dividend capture intended? `[UNRESOLVED]` |

## 2.3 Buy-Write (BW)

Simultaneously **buy the shares + sell (STO) a call against them**. `[MECH]` Once opened, the resulting position **is** a covered call — the CC rows above then govern its lifecycle.

| Before | Action/Event | Kind | Cash Flow | Assets After | Obligations After | Exposure After | Encumbrance After | Evidence Required | Policy Still Required |
|---|---|---|---|---|---|---|---|---|---|
| Cash | Buy shares + STO call | A | − share cost + premium | Shares + short call | Short call | Shares, upside capped at K, downside to 0 below effective basis | shares encumbered by call; cash spent on shares | share quote, option quote, deployable cash `[BROKER]` | Is bounded-upside acquisition at this basis acceptable? `[WW-POLICY]` |

> **"Effective basis = share price − premium"** is a `[HEURISTIC]` presentation convention, not a current-asset figure. It folds a historical premium inflow into a per-share number; it is useful for framing acceptability but must not be treated as broker basis or current cash.

> **Accounting discipline (load-bearing; ties to `BUG-021`).** The `Cash Flow` column records the cash event **at that transition** (historical when it happened, new when it happens). Premium received at STO is a **historical inflow**, not a standing current asset that later events "keep." BTC is a **new cash outflow** that retires the obligation — it is *not* a return of the premium and *not* nettable in the naive "premium − debit" sense without proper lifecycle accounting. Distinguish **historical option cash flow / P&L** from **current assets and obligations**. Conflating the two is exactly the class of error behind `BUG-021` (a BTC debit mis-booked as a generic asset purchase instead of being associated with the obligation's lifecycle).

## 2.4 Roll (any short leg)

`[MECH]` A roll is **two trades**: BTC the existing short + STO a new short (different strike and/or expiration), often presented as one net-priced combined order.

| Before | Action/Event | Kind | Cash Flow | Assets After | Obligations After | Exposure After | Encumbrance After | Evidence Required | Policy Still Required |
|---|---|---|---|---|---|---|---|---|---|
| Short leg | Roll (BTC old + STO new) | A | net credit **or** debit | underlying holdings unchanged | **new** short obligation (new terms) | shifted (new strike/expiry) | re-based to new leg | both legs' quotes | Is the *new* position independently acceptable? `[HEURISTIC]`→`[WW-POLICY]` |

> `[HEURISTIC]` Practitioner canon: treat a roll as a **new trade**, roll only if the thesis is unchanged, and prefer a net credit. **A net roll credit does not establish profit or reduced risk** — it can mask a costly old-leg close and a worse new position. Not currently a Wheelwright-operationalized action (`[UNRESOLVED]`; see roadmap / `PL-EXEC-01`).

---

# PART 3 — Semantic Specimens

These are **domain-semantic test vectors**. Use them during design/review to attack a proposed generalization: run the rule against the contrasting pair and check whether the residuals actually match the rule's assumption. Underlying ≈ $25.47 in the DBO examples that motivated this reference.

### Specimen 1 — BTC of CSP vs BTC of covered call *(the foundational contrast)*
- **CSP $21, ~2 DTE, OTM.** BTC → a **new cash debit** retires the obligation; **no shares**; this leg's cash encumbrance released (broker confirms capacity). The STO premium is historical, not a standing asset the close "keeps."
- **CC $26, ~2 DTE, OTM, shares owned.** BTC → a **new cash debit** retires the obligation; **shares retained, now uncapped**; **no cash created**.
- **Exposes:** the false generalization "near-expiry + OTM short → BTC" as one rule. Same action verb, categorically different residual (cash-freed-from-obligation vs shares-uncapped-still-held). Any lifecycle rule spanning both structures must survive this pair.

### Specimen 2 — CSP assignment vs covered-call call-away
- **CSP assigned:** buy shares at strike, cash out, now long shares.
- **CC assigned:** sell shares at strike, cash in, now flat.
- **Exposes:** treating "assignment" as one outcome. Opposite direction (acquire vs dispose), opposite cash flow.

### Specimen 3 — Same-strike CSP vs covered call (synthetic similarity ≠ identity)
- Same strike/expiration: **payoff diagrams are nearly identical** `[THEORY]`.
- But capital form differs (cash vs shares), assignment direction differs, and tax/holding treatment differs.
- **Exposes:** reading synthetic payoff similarity as economic identity.

### Specimen 4 — Near-strike expiration (pin/after-hours uncertainty)
- Underlying pinned ≈ strike into the close; ITM/OTM status can flip on after-hours movement. **Two distinct uncertainties compound:** (a) whether the *holder* exercises (exercise-by-exception is a default, but contrary instructions can exercise an OTM option or decline an ITM one — the writer cannot know); and (b) if exercised, *which writer* is assigned (random allocation, see D1). Post-expiration you may therefore hold an **unexpected** position (or unexpectedly not). `[MECH]`
- **Exposes:** "let it expire OTM is safe" and "expiration moneyness proves final resulting position." Near-strike expiration is a distinct risk with a next-morning surprise.

### Specimen 5 — Dividend-driven early call assignment
- Short call ITM approaching ex-dividend: a remaining extrinsic value **smaller than the dividend** is a *necessary condition* for early exercise to be economically attractive, but it is **not alone sufficient** — the holder's decision also depends on financing/carry, transaction alternatives, timing, and continuation value. When exercise does occur, the writer is assigned **before** ex-date and **forfeits the distribution**. `[THEORY]`/`[MECH]`
- **Exposes:** symmetric put/call early-assignment treatment. This is the early-assignment case with the clearest economic *incentive*; it is a **short-call** phenomenon (short-put early exercise is driven by different, rarer deep-ITM/carry economics). The incentive does **not** prove exercise/assignment will occur (do not reduce it to a one-variable trigger; see D3 and the Competence Contract §10).

### Specimen 6 — Roll as close-old + open-new
- A combined-order "roll for a $0.30 credit" is BTC (debit) + STO (larger credit). The credit can coexist with a **loss** on the closed leg and a **worse** new position.
- **Exposes:** treating a roll as one atomic favorable event; net credit ≠ profit/improved risk.

### Specimen 7 — Adjusted contract / non-standard deliverable
- After a split/reverse-split/special distribution, OCC may change the **deliverable** (e.g., 100 shares → 100 shares + cash, or a different share count). "100 shares at strike" is then false. `[MECH]`
- **Exposes:** the silent assumption that every contract is an ordinary 100-share deliverable.

### Specimen 8 — Short put where cash security is not established
- A short put in an account without reserved cash is **not** a CSP; it is (partially) a margin short put with different capacity, risk, and assignment-funding consequences. `[MECH]`/`[BROKER]`
- **Exposes:** the assumption "short put = cash-secured put."

---

# PART 4 — Focused Depth (retrieve only on trigger)

### D1. Assignment & allocation mechanics *(trigger: partial assignment, multi-contract, "probability of assignment")*
`[MECH]` OCC assigns exercises **randomly to clearing-member accounts** (a documented wheel with a random start, in standard increments); the clearing member (broker) then allocates to individual customers by its own random or FIFO method. Consequences: (a) assignment is **not** controllable or predictable by the writer; (b) **partial assignment** of a multi-contract position is possible; (c) delta is **not** an allocation probability. Source of record: OCC Standard Assignment Procedures; OIC.

### D2. Expiration: exercise-by-exception & contrary instructions *(trigger: expiration handling, near-strike)*
`[MECH]` At expiration OCC uses **exercise-by-exception ("ex-by-ex")**: options ITM by a threshold are exercised **automatically unless** the clearing member submits contrary instructions; a holder can also submit contrary instructions to *not* exercise an ITM option or to exercise one that would not auto-exercise. Customer/broker/firm deadlines differ and are **earlier** than OCC's. So expiration outcome is a *default with overrides*, and after-hours price moves add uncertainty (Specimen 4). Source: Cboe C2 RG10-007; OCC ODD.

### D3. Early exercise economics *(trigger: ITM short near ex-date, deep-ITM short)*
`[THEORY]` Early exercise of an American **call** becomes economically attractive as the captured **dividend approaches or exceeds the call's remaining extrinsic value** — but that comparison is a *necessary, not sufficient* condition. The holder's decision also depends on financing/carry, feasible transaction alternatives, timing, and continuation value (the value of exercising now vs holding the option). Early exercise of an American **put** is driven by deep-ITM/interest-carry considerations, not dividends. Do **not** collapse any of this into a one-variable "dividend > extrinsic ⇒ exercise" shortcut (Competence Contract §10). Wheelwright does **not** predict exercise; it should *recognize the incentive condition* and treat it as evidence-and-mechanics, not forecast.

### D4. Settlement & funding *(trigger: any "freed cash / deployable" claim)*
`[MECH]`/`[BROKER]` Physical settlement + T+1 means assignment produces a **share** event that settles next business day, and any cash effect is a **broker/account** fact. Do not translate a closed obligation into deployable cash without broker evidence (Capital invariant, §7). Ties to `BUG-021` (a BTC debit mis-accounted as a generic asset purchase rather than associated with the short-option obligation's lifecycle and resulting option P&L) and HOLD/CLOSE design §13.

### D5. Delta & the Greeks *(trigger: any exposure/valuation claim, "assignment probability")*
`[THEORY]` Delta is a **local sensitivity** of option price to a $1 move in the underlying (a hedge ratio, `N(d₁)` in Black–Scholes) — **not** a probability. Any probability interpretation is **model-, measure-, horizon-, and event-specific**: the risk-neutral probability of finishing ITM is a distinct quantity (the **dual delta**, ≈ `N(d₂)`), it is risk-neutral rather than real-world, and it is a *finish-at-expiration* statement that says nothing about *when* American assignment occurs. So "delta ≈ assignment probability" conflates a sensitivity with a specific, assumption-laden probability. The durable lesson: **delta is a sensitivity; treat any probability reading as conditional on a stated event/horizon/measure/model.** Gamma/theta/vega are local sensitivities, not decisions. Greeks/IV are `[EMPIRICAL]`/`[THEORY]` context, never a Wheelwright action by themselves.

### D6. Volatility & option compensation *(trigger: "richness," entry-timing, expected return)*
`[EMPIRICAL]` Implied volatility is the market's forward volatility estimate embedded in price; realized volatility is what occurs. The **variance risk premium** — the tendency for IV to exceed subsequent realized volatility, so option *sellers* are compensated on average — is an empirical regularity, **not** a mechanical guarantee and conditional on regime. `[UNRESOLVED]` whether/how Wheelwright operationalizes relative-compensation observation. **Observing** relative compensation is *evidence* and is compatible with policy-over-prediction; **betting entry on predicted volatility direction** is prediction and is inadmissible as deployment authority (`foundations/policy-over-prediction.md`). Distinguish the two carefully.

### D7. Portfolio consequence — detect-and-route boundary *(trigger: an action changes aggregate exposure)*
`[MECH]`/`[UNRESOLVED]` A locally correct single-position action can change **aggregate** exposure: assignment across correlated ETFs concentrates equity exposure; multiple CSPs concentrate funding/assignment obligations on the same date; call-aways can leave concentrated cash. This reference only asks the actor to **notice and route** such consequences to Situation/Mission authority (`25-situation-architecture.md`). It contains **no** concentration limits, correlation policy, or sizing rules — those are `[UNRESOLVED]`/`[WW-POLICY]` and live elsewhere. Detect-and-route only.

### D8. Adjusted contracts *(trigger: corporate action, non-standard deliverable, unusual symbol)*
`[MECH]` OCC issues contract-adjustment memos for splits, reverse splits, special/large cash distributions, mergers, and spin-offs; the adjusted contract may carry a modified **deliverable**, share count, or a cash component, and often a modified option symbol. This is **live on ETFs** (OCC info memos show ETF splits). The deliverable quantity is distinct from other scaling/multiplier fields. Never assume a clean 100-share deliverable without checking for adjustment.

---

# PART 5 — External Grounding Map

There is **no universal master source.** Ground each claim to the weakest-sufficient source *of record* for its class; corroborate, don't substitute.

| Claim class | Source of record (independently discovered) | Can establish | Cannot establish |
|---|---|---|---|
| Contract/exercise/assignment/settlement/adjustment mechanics | **OCC** rules, procedures, info memos, and the SEC-filed **ODD "Characteristics and Risks of Standardized Options"** ([riskstoc.pdf](https://www.theocc.com/components/docs/riskstoc.pdf)); OCC [Standard Assignment Procedures](https://www.theocc.com/getmedia/0cdda3c2-ab81-450f-b8b8-7ce84d88fce7/standard-assignment-procedures.pdf); OIC [optionseducation.org](https://www.optionseducation.org/) | what contractually/operationally happens at clearing | strategy, return, broker-specific capacity |
| Regulatory / exchange mechanics (margin, ex-by-ex, thresholds) | **FINRA** [Rule 4210](https://www.finra.org/rules-guidance/rulebooks/finra-rules/4210); SEC; exchange circulars, e.g. Cboe [C2 RG10-007](https://cdn.cboe.com/resources/regulation/circulars/regulatory/RG-C2-2010-007.pdf); Cboe settlement docs | rule-level requirements, admin defaults | what a given broker actually reserves/shows |
| Broker/account treatment (buying power, settled cash, house margin, allocation) | current **broker documentation + the operator's account evidence** (Fidelity = Wheelwright's handoff target) | what *our* account will actually do | universal mechanical truth |
| Product-specific mechanics (ETF distributions, adjustments) | **issuer** documentation + OCC adjustment memos | product-specific deliverable/behavior | generic option mechanics |
| Payoff/valuation/Greeks/synthetics | established **financial theory** (Black–Scholes–Merton; standard derivatives texts) | mathematical relationships | empirical returns or a specific account's facts |
| Empirical (VRP, persistence, expected return) | peer-reviewed / **academic empirical** literature | statistical tendency, with conditions | mechanical certainty or Wheelwright policy |
| Trading conventions/heuristics | attributed **practitioner** material (tastylive, OIC education, Predicting Alpha) | "what practitioners commonly do/consider" | mechanical fact or Wheelwright policy |

**Rule:** a `[MECH]` claim must be grounded to clearing/exchange/regulatory authority of record; a practitioner or broker-education page is corroboration/convention only. Settlement dates, thresholds, margin rules, and product characteristics are **verify-current** (they change); core payoff mechanics are **durable**.

---

## Reconciliation notes (required Principal action — NOT performed here)

This reference **identifies** contradictions with existing authority; it does **not** silently edit them. Each requires separate Principal decision:

1. **`02-domain.md` A-5 ("Position held to expiration … Does not model early close or roll") — CONTRADICTION.** Directly contradicts shipped BTS / HOLD-CLOSE behavior (`short-obligation-decision.ts` produces BTC/HOLD on existing obligations) and the ratified HOLD-vs-CLOSE V1 design. A-5 is a stale simplifying assumption; it must be reconciled, and `02-domain.md` should be subordinated to this reference as the domain-authority source for lifecycle economics.
2. **Delta ≈ assignment probability shorthand** (`02-domain.md` BR-5/A-3): retain as an explicitly-labeled rough approximation only; Part 4 D5 is the corrected statement (delta = sensitivity/hedge ratio; ITM probability = dual delta; risk-neutral ≠ real-world).
3. **`23-calls-architecture.md` collateral table** (CSP `strike×100`, CC share ownership): consistent with §7 here, but should cross-link the Capital invariant so nominal encumbrance is never read as deployable capacity.
4. **HOLD/CLOSE V1 design §13** (nominal-encumbrance-removed ≠ buying power): consistent and reinforced; cross-link, keep authoritative.
5. **`BUG-021`** (BTC classified as generic asset purchase, not netted against premium): this reference's §7/D4 supplies the domain rationale for the fix; the bug record remains the remediation authority.
6. **Support-status labels** (`[UNRESOLVED]` for IV-timing/VRP, take-profit-%, rolling, multi-leg): recorded as "not currently operationalized," **not** "rejected." Do not infer rejection from nonimplementation without explicit support authority.

## Intentional-boundary note

Named so a cold-start actor arriving from the standard seller canon does not read absence as defect: multi-leg/defined-risk structures, IV-rank/relative-compensation *ranking*, variance-risk-premium *entry logic*, percentage-of-premium take-profit *as a forward decision driver*, and rolling are **not currently operationalized** (`[UNRESOLVED]`). The one genuine ratified boundary: **deployment justified by directional forecast is inadmissible** (`foundations/policy-over-prediction.md`, Category A). Everything else in this list is undecided, not rejected.
