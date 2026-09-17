# Wheelwright Options Domain Reference

**Ratified:** September 16, 2026
**Status:** Principal-ratified specialized reference.
**Authority:** Category E — Current Specialized Reference. This reference **consolidates specialized domain knowledge**; its load-bearing claims remain subject to applicable external authority, assumptions, and current evidence, and **ratification does not independently establish economic correctness** (see Part 5). It is **non-authoritative for Wheelwright policy** (policy lives in Category A/B authority, ADRs, foundations, and Principal direction) and does not carry Category A system-definition authority.
**Companion:** `options-domain-competence-contract.md` (Category B, ratified). That contract governs *when an actor must establish options economics before dependent work*; this reference is the durable place actors go to *establish* them. It is the landing place a `STOP DOMAIN — NOT SPECIFIED` routes to.
**SYNC SHA at authoring:** `a08b271100208e6bbf1a30002677c6d7336ff827` (remotely verified accepted `main`).

---

## How to read this reference

This is an **operational reference, not a textbook**. Its job is to let a Wheelwright actor (Principal, ChatGPT, Kiro, Codex) reason correctly about *what an option position economically is and does* before designing, implementing, reviewing, or accepting software that depends on it — so we do not spend effort implementing an economically wrong model.

This reference **consolidates** domain knowledge; each load-bearing claim remains subject to its applicable external authority, assumptions, and current evidence. **Ratification and repository residence do not establish economic correctness.** Part 5 identifies source classes *and* claim-specific grounding; the `[MECH]`/`[THEORY]`/`[EMPIRICAL]` tag on a claim indicates the kind of authority it answers to, not that it has been exhaustively substantiated here.

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

> **Record domain understanding, implementation status, and support decision separately.** Mechanics may be **established** while implementation is **absent** and the support decision remains **undecided** — three distinct axes, not one. Explicitly unsupported behavior requires **support authority**; absence of implementation does **not** establish rejection, and it does not establish unresolved *mechanics* either. ("Not currently operationalized," never "deliberately excluded," unless support authority says so.)

---

# PART 1 — Options Economic Model (the always-read core)

*Usability target ~1,000–2,000 words. If it grows past that, something structure-specific leaked in and belongs in Part 2 or 4.*

## 1. An option is a contract with two asymmetric sides

`[MECH]` A standardized U.S. equity/ETF option **ordinarily has a 100-share deliverable before adjustment** — a contract on a specific underlying at a fixed **strike**, expiring on a fixed date. The deliverable is a contract term, **not a constant**: corporate actions can change it (see Part 4 D8 / Specimen 7). Always read the deliverable from the applicable contract rather than assuming 100 shares.

- A **call** gives the *holder* the right to **buy** the underlying at the strike. `[MECH]`
- A **put** gives the *holder* the right to **sell** the underlying at the strike. `[MECH]`

The two sides are **not symmetric**:

- The **holder (long)** paid a premium and holds a **right**, never an obligation. Maximum loss = premium paid **on the long option position itself**; if the holder *exercises*, the resulting underlying position has a new exposure profile — resume complete-position reasoning after exercise. `[MECH]`
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

> **Standard-contract scope (applies to §§3–4 and Part 2).** The per-share formulas and 100-share arithmetic below assume **ordinary unadjusted physical-delivery** equity/ETF contracts. Adjusted or other contracts require their actual deliverable, aggregate exercise payment, premium quotation factor, valuation convention, and settlement terms (D8 / Specimen 7). Do **not** substitute deliverable share count for premium or strike dollar-extension factors, or use a raw underlying share price for an adjusted contract's moneyness.

`[THEORY]` An option's price decomposes as:

- **Intrinsic value** — the in-the-money amount: `max(0, S−K)` for a call, `max(0, K−S)` for a put (S = underlying price, K = strike). `[MECH]`/`[THEORY]`
- **Extrinsic (time) value** — everything above intrinsic; a function of time remaining, volatility, and carry. `[THEORY]`

> **Load-bearing:** remaining **extrinsic value** is important to many lifecycle comparisons — early-assignment incentive, "is it worth closing," take-profit, roll economics. It does **not** replace intrinsic value, complete-position exposure, financing, execution costs, resulting holdings, or governed intent. Wheelwright's DTE + moneyness heuristics are *proxies* for extrinsic value; name the real quantity when the decision depends on it.

## 4. Moneyness

`[MECH]` OTM / ATM / ITM describe strike vs underlying:

- Call: ITM when `S > K`, OTM when `S < K`. Put: ITM when `S < K`, OTM when `S > K`.
- ATM ≈ strike near underlying.

Option type and contract terms determine **settlement direction**. Moneyness describes intrinsic value and informs applicable exercise-by-exception defaults; it does **not** by itself establish exercise, assignment, desirability, or final holdings (see D5, D2).

## 5. Lifecycle events (four distinct kinds)

Distinguish the *kind* of transition — this typing is used in Part 2:

- **Operator action** — you choose it: BTO/STO/BTC/STC, roll, early close.
- **Continued state** — HOLD: no transition now; obligation and exposure persist.
- **Counterparty event** — you do not control it: early assignment (American-style).
- **Expiration boundary** — the option ceases to exist if unexercised; exercise and assignment outcomes depend on applicable exercise-by-exception procedures, valid instructions, and allocation. Closing-price moneyness alone does not establish the resulting position (see Specimen 4, D2).

`[MECH]` **American-style** equity/ETF options can be assigned **any business day before expiration**, not only at expiration. `[MECH]` **Assignment is not controllable by the writer** — OCC assigns randomly to a clearing member, which then allocates to a customer (see Part 4).

## 6. Settlement: standard equity/ETF options ordinarily settle physically

`[MECH]` **Standard, unadjusted** equity and ETF options ordinarily settle by **physical delivery of the specified shares**: an exercised/assigned ITM option is exchanged for shares, not cash. But the actual settlement form and deliverable must be read from the **applicable contract / OCC adjustment** — an adjusted contract can carry a cash component or a non-standard deliverable (see Part 4 D8 / Specimen 7), and index options (e.g. SPX) cash-settle (not currently operationalized by Wheelwright). Establish physical settlement before relying on it; do not assume it.

`[MECH]` Since **2024-05-28**, U.S. stock trades settle **T+1** (one business day). The share leg from assignment/exercise therefore settles on the stock cycle, not instantaneously.

> **Load-bearing:** assignment on a covered call delivers *shares out* and cash in at the strike; assignment on a cash-secured put delivers *shares in* and cash out at the strike. "Assignment" is not one outcome.

## 7. The capital ladder — the most misused part of the domain

These are **distinct** and must never be collapsed `[MECH]`/`[BROKER]`:

1. **Aggregate exercise payment / stated notional** — determined from applicable contract terms. For **ordinary unadjusted 100-share physical-delivery** contracts this is `strike × 100 × contracts`. It is **not** necessarily deliverable market value, collateral, margin, or buying power. `[MECH]`
2. **Collateral / encumbrance** — what a strategy ties up: cash for a cash-secured put, shares for a covered call. `[MECH]` for the *nominal* amount.
3. **Margin requirement** — the broker/regulatory amount actually reserved; governed by Reg-T / FINRA Rule 4210 and the broker's house rules. **"Cash-secured" is a broker/account collateral treatment, not a clearing mechanic.** `[BROKER]`
4. **Broker buying power** — what the broker says you can deploy. `[BROKER]`
5. **Settled cash** — cash whose relevant settlement has completed; settlement alone does **not** establish freedom from reserves or restrictions. `[BROKER]`
6. **Deployable capital** — capacity available for the contemplated action under authoritative broker/account evidence and applicable Wheelwright policy. **Not** synonymous with settled cash, notional, collateral, or margin requirement. `[BROKER]`

> **Capital invariant (load-bearing):** retiring an obligation removes *that obligation's attributable encumbrance* — nothing more. It does **not** by itself establish cash received, buying power created, settled cash, deployable capital, or a broker-recognized capacity increase. Those require **broker/account evidence**. Stated notional is arithmetic; **broker-recognized capacity requires broker/account evidence, and Wheelwright deployability additionally depends on applicable policy.**

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

> **Standard-contract scope.** The 100-share matrices and per-share formulas below apply to **ordinary unadjusted physical-delivery** equity/ETF contracts. Adjusted or other contracts require their actual deliverable, aggregate exercise payment, premium quotation factor, valuation convention, and settlement terms (Part 4 D8 / Specimen 7). Do not substitute deliverable share count for premium or strike dollar-extension factors.

> **Quantity preservation.** Unless explicitly stated otherwise, full-resolution rows assume **all represented contracts resolve**. Preserve excess inventory, unaffected contracts, other positions, and their corresponding encumbrances. For standard contracts, let `h` = owned shares, `n` = open short contracts, `m` = contracts affected by the event.

> **Conditional transition, not evidence of an event.** Matrix outcomes are **conditional economic transitions**, not evidence that an event occurred. Quotes support indicative pre-execution estimates only. An actual transition requires **authoritative execution or lifecycle evidence** identifying contract, affected quantity, price/payment, fees, and event timing. An order submission or a quote does not establish execution (Contract §7).

## 2.1 Cash-Secured Put (CSP)

The obligation is to **buy** shares at strike; backed by **cash**. `[MECH]` "Cash-secured" is the `[BROKER]` collateral treatment; the contractual short put is the `[MECH]` obligation. (A short put *without* established cash security is **not** a CSP — see §Short put ≠ CSP.)

| Before | Action/Event | Kind | Cash Flow | Assets After | Obligations After | Exposure After | Encumbrance After | Evidence Required | Policy Still Required |
|---|---|---|---|---|---|---|---|---|---|
| Cash | STO put | A | **+ premium (historical inflow at open)** | Cash (incl. premium received) | Short put | Obligation to acquire at strike if assigned | Cash `strike×100×n` reserved (nominal) | pre-execution: contract terms, before-state, indicative price · actual: authoritative fill + affected quantity | Is acquisition at strike acceptable? `[WW-POLICY]` |
| Short put | HOLD | C | none now | unchanged | Short put | unchanged | unchanged | underlying (moneyness), DTE | none if already governed |
| Short put | BTC (m of n) | A | **−(executed closing debit + relevant fees) now (new outflow)** | Cash decreases by executed closing debit plus relevant fees; **no shares acquired by BTC**; `n−m` short puts remain | `n−m` short puts remain | flat on the affected leg(s) | only the affected legs' cash encumbrance released (nominal; broker confirms capacity) | pre-execution: contract terms + indicative price · actual: authoritative fill + affected quantity | Was closing preferred over holding? `[UNRESOLVED]`/`[WW-POLICY]` |
| Short put | Expiration without exercise/assignment, authoritatively confirmed | R | none now | Cash unchanged | none | flat | released (nominal) | Applicable expiration procedures + authoritative broker lifecycle/position evidence confirming resolution of the affected quantity; underlying closing price alone is insufficient | none |
| Short put | Assignment (ITM) | X/R | − `strike×100×n` now | **Shares acquired** at strike | none (obligation consumed) | long shares | cash converted to shares (T+1) | broker Activity (authoritative) | Manage resulting shares (CC? hold? sell?) `[UNRESOLVED]` |
| Short put (n) | **Partial** assignment (m<n) | X | − `strike×100×m` | m×100 shares + (n−m) still short | (n−m) short puts remain | mixed | partial | broker Activity | Re-evaluate residual short + new shares |

## 2.2 Covered Call (CC)

Own ≥100 shares; sell a call against them. The obligation is to **sell** shares at strike; backed by **shares**. `[MECH]`

| Before | Action/Event | Kind | Cash Flow | Assets After | Obligations After | Exposure After | Encumbrance After | Evidence Required | Policy Still Required |
|---|---|---|---|---|---|---|---|---|---|
| Shares (≥ `100×m` available, unencumbered) | STO `m` calls | A | **+ premium (historical inflow at open)** | Shares (+ cash from premium) | Short call(s) | Upside capped at K on the `100×m` covered shares; excess shares retain uncapped exposure | `100×m` shares encumbered **in total** for the newly written calls; preserve any existing encumbrances | pre-execution: contract terms, before-state, indicative price · actual: authoritative fill + affected quantity | Is disposition at strike acceptable? `[WW-POLICY]` |
| Shares + short call | HOLD | C | none now | unchanged | Short call | unchanged | unchanged | underlying, DTE, (dividend calendar if ITM near ex-date) | none if governed |
| Shares + short call | BTC (m of n) | A | **−(executed closing debit + relevant fees) now (new outflow)** | **All `h` shares retained**; cash decreases by executed closing debit plus relevant fees; `n−m` calls remain | `n−m` short calls remain | affected shares uncapped; still capped under remaining calls | only the affected calls' nominal share encumbrance removed | pre-execution: contract terms + indicative price · actual: authoritative fill + affected quantity | Why uncap? (keep upside / avoid assignment) `[UNRESOLVED]` |
| Shares + short call | Expiration without exercise/assignment, authoritatively confirmed | R | none now | Shares unchanged | none | shares, uncapped | released (shares) | Applicable expiration procedures + authoritative broker lifecycle/position evidence confirming resolution of the affected quantity; underlying closing price alone is insufficient | Re-write? `[WW-POLICY]` |
| Shares + short call | Assignment / call-away (m of n) | X/R | + `K×100×m` now | shares remaining `h−100m`; `n−m` calls remain | `n−m` short calls remain | reduced share exposure; flat **only** if `h−100m=0` and `n−m=0` | affected shares delivered out (T+1) | authoritative broker Activity (contract + affected quantity + payment + timing) | Redeploy proceeds? `[UNRESOLVED]` |
| Shares + short call | **Early** assignment (dividend, m of n) | X | + `K×100×m` now | shares remaining `h−100m` **before** ex-date; distribution on delivered shares forfeited | `n−m` short calls remain | reduced share exposure | affected shares delivered out | authoritative broker Activity; dividend/ex-date | Was dividend capture intended? `[UNRESOLVED]` |

## 2.3 Buy-Write (BW)

Simultaneously **buy the shares + sell (STO) a call against them**. `[MECH]` Once opened, the resulting position **is** a covered call — the CC rows above then govern its lifecycle.

| Before | Action/Event | Kind | Cash Flow | Assets After | Obligations After | Exposure After | Encumbrance After | Evidence Required | Policy Still Required |
|---|---|---|---|---|---|---|---|---|---|
| Cash | Buy shares + STO call | A | − share cost + premium | Shares + short call | Short call | Shares, upside capped at K, downside to 0 below effective basis | shares encumbered by call; cash spent on shares | pre-execution: share + option quotes, deployable cash `[BROKER]` · actual: **authoritative fills of BOTH legs** before asserting a covered-call position | Is bounded-upside acquisition at this basis acceptable? `[WW-POLICY]` |

> **"Effective basis = share price − premium"** is a `[HEURISTIC]` presentation convention. For a matched standard buy-write, ignoring costs and distributions, `share purchase price − call premium per share` is the **expiration breakeven** — a theoretical relationship, not necessarily broker or tax basis, and not a current-asset figure.

> **Accounting model (load-bearing; ties to `BUG-021`).** State the distinct quantities rather than only prohibiting the shortcut:
> - Premium receipt is a **historical cash-flow event**. Cash remaining from that receipt is counted **once** in current cash; the receipt is **not** a second current asset.
> - While the option remains open, represent its current **short-option liability** (mark-to-market uses current liability valuation, not an executed closing cost).
> - For an **authoritatively matched quantity closed by BTC**, option **trading P&L** = attributable opening proceeds − executed closing cost − relevant expenses. This is trading P&L, **not** current deployable capital and **not** the complete covered-call result.
> - **Complete-position P&L** additionally includes relevant underlying and other components.
> - Wheelwright **Production recognition** is a separately governed accounting policy (`[WW-POLICY]`, ADR-014), not proof of realized trading profit.
> Conflating these is exactly the class of error behind `BUG-021` (a BTC debit mis-booked as a generic asset purchase instead of being associated with the obligation's lifecycle and resulting option P&L).

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
- **CSP assigned:** buy the affected contracts' shares at strike, cash out, now long those shares (any unaffected short puts remain).
- **CC assigned:** deliver the affected contracts' required shares, receive the aggregate exercise payment, and **preserve any excess shares or remaining obligations**. Flat **only** for a fully resolved, exactly matched position.
- **Exposes:** treating "assignment" as one outcome, and treating call-away as "everything flat." Opposite direction (acquire vs dispose), opposite cash flow, and quantity must be preserved (own 150, one call assigned → 50 shares remain; short 3 calls, one assigned → 200 shares + 2 short calls remain).

### Specimen 3 — Same-strike CSP vs covered call (synthetic similarity ≠ identity)
- Same strike/expiration: **payoff diagrams are nearly identical** `[THEORY]`.
- But capital form differs (cash vs shares), assignment direction differs, and tax/holding treatment differs.
- **Exposes:** reading synthetic payoff similarity as economic identity.

### Specimen 4 — Near-strike expiration (pin/after-hours uncertainty)
- Underlying pinned ≈ strike into the close; ITM/OTM status can flip on after-hours movement. **Two distinct uncertainties compound:** (a) whether the *holder* exercises (exercise-by-exception is a default, but contrary instructions can exercise an OTM option or decline an ITM one — the writer cannot know); and (b) if exercised, *which writer* is assigned (random allocation, see D1). Post-expiration you may therefore hold an **unexpected** position (or unexpectedly not). `[MECH]`
- **Exposes:** "let it expire OTM is safe" and "expiration moneyness proves final resulting position." Near-strike expiration is a distinct risk with a next-morning surprise.

### Specimen 5 — Dividend-driven early call assignment
- Short call ITM approaching ex-dividend: little remaining extrinsic value relative to the dividend is a useful *indicator* of early-exercise incentive, but it is **not alone sufficient** — the holder's decision also depends on financing/carry, transaction alternatives, timing, and continuation value. Exercise effective before the relevant ex-date generally transfers the upcoming unadjusted distribution on the delivered shares to the exercising holder; assignment notification may arrive later, and unaffected shares (and their distribution entitlement) are preserved. `[THEORY]`/`[MECH]`
- **Exposes:** symmetric put/call early-assignment treatment. This is the early-assignment case with the clearest economic *incentive*; it is primarily a **short-call** phenomenon (put early exercise is driven by different deep-ITM/carry economics, and a forthcoming distribution can favor waiting). The incentive does **not** prove exercise/assignment will occur (do not reduce it to a one-variable trigger; see D3 and the Competence Contract §10).

### Specimen 6 — Roll as close-old + open-new
- A combined-order "roll for a $0.30 credit" is BTC (debit) + STO (larger credit). The credit can coexist with a **loss** on the closed leg and a **worse** new position.
- **Exposes:** treating a roll as one atomic favorable event; net credit ≠ profit/improved risk.

### Specimen 7 — Adjusted contract / non-standard deliverable
- After a split/reverse-split/special distribution, OCC may change the **deliverable** (e.g., 100 shares → 100 shares + cash, or a different share count). "100 shares at strike" is then false. `[MECH]`
- **Exposes:** the silent assumption that every contract is an ordinary 100-share deliverable.

### Specimen 8 — Short put where cash security is not established
- A short put alone, or unavailable reserve evidence, does **not** establish cash security. Inspect the complete position and broker/account evidence: the put may be cash-secured, uncovered/margin-supported, covered by short stock, part of an option structure (e.g. a spread), or **unresolved** as to coverage. Preserve its contractual obligation while withholding unsupported coverage and funding conclusions. `[MECH]`/`[BROKER]`
- **Exposes:** the assumption "short put = cash-secured put" — and the opposite over-correction "no reserved cash ⇒ naked/margin put." Absence of cash-security evidence is a coverage question, not proof of any single coverage form.

---

# PART 4 — Focused Depth (retrieve only on trigger)

### D1. Assignment & allocation mechanics *(trigger: partial assignment, multi-contract, "probability of assignment")*
`[MECH]` OCC assigns exercises **randomly to clearing-member accounts** (a documented wheel with a random start, in standard increments); the clearing member (broker) then allocates to individual customers by its own random or FIFO method. Consequences: (a) assignment is **not** controllable or predictable by the writer; (b) **partial assignment** of a multi-contract position is possible; (c) delta is **not** an allocation probability. Source of record: OCC Standard Assignment Procedures; OIC.

### D2. Expiration: exercise-by-exception & contrary instructions *(trigger: expiration handling, near-strike)*
`[MECH]` At expiration OCC uses **exercise-by-exception ("ex-by-ex")**: options ITM by a threshold are exercised **automatically unless** the clearing member submits contrary instructions; a holder can also submit contrary instructions to *not* exercise an ITM option or to exercise one that would not auto-exercise. Customer/broker/firm deadlines differ and are **earlier** than OCC's. So expiration outcome is a *default with overrides*, and after-hours price moves add uncertainty (Specimen 4). Source: Cboe C2 RG10-007; OCC ODD.

### D3. Early exercise economics *(trigger: ITM short near ex-date, deep-ITM short)*
`[THEORY]` **Call:** a forthcoming unadjusted dividend and little remaining call extrinsic value are useful *indicators* of a potential dividend-related early-exercise incentive — but establish continuation value, financing/carry, feasible sale-and-share-purchase alternatives, costs, and contract terms before drawing an economic conclusion. This comparison is **not a universal exercise trigger**; early call exercise can also be rational for short-sale/transaction/funding-cost reasons even without a dividend. **Put:** American put early exercise can become attractive when receiving the exercise payment sooner outweighs continuation value and relevant costs. Deep-ITM status and interest carry are important, while a forthcoming distribution can favor *waiting* and can alter exercise timing (not simply "not dividends"). Do **not** collapse any of this into a one-variable shortcut (Competence Contract §10). Wheelwright does **not** predict exercise; it should *recognize the incentive condition* and treat it as evidence-and-mechanics, not forecast.

### D4. Settlement & funding *(trigger: any "freed cash / deployable" claim)*
`[MECH]`/`[BROKER]` For ordinary physical-delivery equity options, exercise/assignment creates the **contractual** security-delivery and exercise-payment obligations (direction and amount are `[MECH]`), generally settling **T+1**; adjustment memos can prescribe different handling for particular deliverable components. **Broker/account evidence** `[BROKER]` establishes balance treatment, funding arrangements, restrictions, and when proceeds or capacity can actually be used. So the contractual cash effect is a mechanic; its *recognition, availability, and deployability* are broker facts. Do not translate a closed obligation into deployable cash without broker evidence (Capital invariant, §7). Ties to `BUG-021` (a BTC debit mis-accounted as a generic asset purchase rather than associated with the short-option obligation's lifecycle and resulting option P&L) and HOLD/CLOSE design §13.

### D5. Delta & the Greeks *(trigger: any exposure/valuation claim, "assignment probability")*
`[THEORY]` Delta is a **local sensitivity** of option price to a move in the underlying — **not** a probability. Precisely, in the European Black–Scholes–Merton model with continuous dividend yield `q`: call delta = `e^(−qT)·N(d₁)`, put delta = `e^(−qT)·[N(d₁)−1]`. The **risk-neutral terminal ITM probabilities** are `N(d₂)` for calls and `N(−d₂)` for puts. **Dual delta** is the *strike* sensitivity: `∂C/∂K = −e^(−rT)·N(d₂)`, `∂P/∂K = e^(−rT)·N(−d₂)` under those assumptions — related to, but not literally equal to, those probabilities (sign and discounting matter). American exercise, discrete distributions, and model conventions require separate treatment. **None of these quantities alone establishes writer assignment probability or probability of touching.** The durable lesson: **delta is a sensitivity; treat any probability reading as conditional on a stated event/horizon/measure/model.**
`[THEORY]` **Gamma** measures change in delta; **theta** measures value sensitivity to elapsed time under the stated convention; **vega** measures sensitivity to the volatility input. State units/conventions, and aggregate *signed* quantities with the underlying and other legs for position-level conclusions. Greeks/IV are `[EMPIRICAL]`/`[THEORY]` context, never a Wheelwright action by themselves.

### D6. Volatility & option compensation *(trigger: "richness," entry-timing, expected return)*
`[THEORY]` Implied volatility is the volatility parameter that reconciles an observed option price with a specified pricing model and its other inputs. It is **not** necessarily an unbiased physical forecast of realized volatility.
`[EMPIRICAL]` Using the positive-for-sellers convention, the forward **variance risk premium** compares **risk-neutral and physical expected future variance over a matched horizon**. Empirical estimators and ex-post implied-minus-realized spreads are *related but distinct* quantities. Historical compensation varies with instrument, sample, horizon, hedging, costs, and regime; it does **not** establish profitability of an individual CSP, covered call, or roll. `[UNRESOLVED]` whether/how Wheelwright operationalizes relative-compensation observation. **Observing** relative compensation is *evidence* and is compatible with policy-over-prediction; **betting entry on predicted volatility direction** is prediction and is inadmissible as deployment authority (`foundations/policy-over-prediction.md`). Distinguish the two carefully.

### D7. Portfolio consequence — detect-and-route boundary *(trigger: an action changes aggregate exposure)*
`[MECH]`/`[UNRESOLVED]` A locally correct single-position action can change **aggregate** exposure: assignment across correlated ETFs concentrates equity exposure; multiple CSPs concentrate funding/assignment obligations on the same date; call-aways can leave concentrated cash. This reference only asks the actor to **notice and route** such consequences to Situation/Mission authority (`25-situation-architecture.md`). It contains **no** concentration limits, correlation policy, or sizing rules — those are `[UNRESOLVED]`/`[WW-POLICY]` and live elsewhere. Detect-and-route only.

### D8. Adjusted contracts *(trigger: corporate action, non-standard deliverable, unusual symbol)*
`[MECH]` OCC issues contract-adjustment memos for splits, reverse splits, special/large cash distributions, mergers, and spin-offs; the adjusted contract may carry a modified **deliverable**, share count, or a cash component, and often a modified option symbol. This is **live on ETFs** (OCC info memos show ETF splits). Adjustment can change **contract count, strike, deliverable, or settlement handling** — and need **not** change every field or leave a non-standard share deliverable. The deliverable quantity is distinct from the premium/strike dollar-extension (multiplier) fields; do not conflate them (a real example: an adjusted deliverable of 33 shares + cash while the premium multiplier stays 100, requiring a separate adjusted-underlying pricing formula). A cash-settled ETF FLEX option is a further reminder not to infer settlement from "ETF." Never assume a clean 100-share deliverable without checking for adjustment.

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

**Claim-specific grounding anchors** (concrete starting sources for the load-bearing claims; numeric deadlines and account-specific treatment still require current applicable evidence):

- **Standard 100-share physical delivery + T+1** — OCC equity-option product specifications ([theocc.com equity-options specs](https://www.theocc.com/clearance-and-settlement/clearing/equity-options-product-specifications)); SEC T+1 rule (effective 2024-05-28).
- **Expiration / exercise-by-exception + contrary instructions** — OCC ODD ([riskstoc.pdf](https://www.theocc.com/components/docs/riskstoc.pdf)); Cboe C2 exercise-declaration procedures ([RG-C2-2010-007](https://cdn.cboe.com/resources/regulation/circulars/regulatory/RG-C2-2010-007.pdf)); broker instruction deadlines from broker documentation.
- **Random assignment + partial assignment** — OCC [Standard Assignment Procedures](https://www.theocc.com/getmedia/0cdda3c2-ab81-450f-b8b8-7ce84d88fce7/standard-assignment-procedures.pdf); OIC [assignment FAQ](https://www.optionseducation.org/referencelibrary/faq/options-assignment).
- **Contract adjustments / non-standard deliverables** — OCC info-memo adjustments (concrete example: memo [58645](https://infomemo.theocc.com/infomemos?number=58645), a 33-shares+cash deliverable with a retained 100 premium multiplier); OCC [FLEX specifications](https://www.theocc.com/clearance-and-settlement/clearing/flex-options) (cash-settled ETF FLEX counterexample).
- **Collateral / margin / reserves / buying power** — FINRA [Rule 4210](https://www.finra.org/rules-guidance/rulebooks/finra-rules/4210) (regulatory floor) + broker documentation (e.g. Fidelity [options balances](https://www.fidelity.com/products/stocksbonds/content/options-balances.shtml), [trading restrictions](https://www.fidelity.com/trading/faqs-trading-restrictions)), plus **account evidence** where a specific account's treatment is asserted.
- **Early-exercise economics, Greeks, synthetics/parity** — Ritchken exercise/parity discussion ([Ch. 6](https://faculty.weatherhead.case.edu/phr/textbook/Chapter6ps.pdf)); Columbia Black–Scholes/Greeks notes ([FoundationsFE](https://www.columbia.edu/~mh2078/FoundationsFE/BlackScholes.pdf)); Jensen & Pedersen, *Early Option Exercise* — **with assumptions stated** (European vs American, dividend yield, discounting).
- **Variance risk premium** — e.g. Federal Reserve FEDS variance-premium definition ([2011-45](https://www.federalreserve.gov/pubs/feds/2011/201145/201145pap.pdf)); Dew-Becker & Giglio ([NBER w31833](https://www.nber.org/papers/w31833)) — **with sample, horizon, and estimator qualifications**; recent literature qualifies historical persistence.

---

## Reconciliation notes

Some reconciliation is **already performed** (documentation-level, within this correction pass); items still requiring **separate Principal action** (e.g. implementation/support decisions, or edits to other authority) are marked as such.

1. **`02-domain.md` subordination + A-5 — RECONCILED (documentation).** The authority root (`docs/README.md`) establishes `02-domain.md`'s subordination to this reference for lifecycle economics; `02-domain.md` now carries an authority-qualification note and A-5 is scoped to the yield/screening calculation only (it no longer reads as prohibiting early closure, consistent with shipped BTS / HOLD-CLOSE and the HOLD-vs-CLOSE V1 design). **Remaining Principal action:** implementation support for any lifecycle action is a separate decision.
2. **Delta ≈ assignment probability shorthand (`02-domain.md` BR-5/A-3) — RECONCILED (documentation).** BR-5 and A-3 are now marked superseded; delta is stated as a sensitivity, and probability interpretations are routed to D5 (qualified by event/horizon/model/measure and distinguished from American assignment). No delta-as-assignment-probability claim remains active.
3. **`23-calls-architecture.md` collateral table** (CSP `strike×100`, CC share ownership): consistent with §7 here, but should cross-link the Capital invariant so nominal encumbrance is never read as deployable capacity.
4. **HOLD/CLOSE V1 design §13** (nominal-encumbrance-removed ≠ buying power): consistent and reinforced; cross-link, keep authoritative.
5. **`BUG-021`** (BTC classified as generic asset purchase, not associated with the obligation lifecycle): this reference's §7/D4/accounting-model supplies the domain rationale; the bug record remains the authoritative **defect record**, and remediation requires separate authorization.
6. **Support-status labels** (`[UNRESOLVED]` for IV-timing/VRP, take-profit-%, rolling, multi-leg): recorded as "not currently operationalized," **not** "rejected." Do not infer rejection from nonimplementation without explicit support authority.

## Intentional-boundary note

Named so a cold-start actor arriving from the standard seller canon does not read absence as defect: multi-leg/defined-risk structures, IV-rank/relative-compensation *ranking*, variance-risk-premium *entry logic*, percentage-of-premium take-profit *as a forward decision driver*, and rolling are **not currently operationalized** (`[UNRESOLVED]`). The one genuine ratified boundary: **deployment justified by directional forecast is inadmissible** (`foundations/policy-over-prediction.md`, Category A). Everything else in this list is undecided, not rejected.
