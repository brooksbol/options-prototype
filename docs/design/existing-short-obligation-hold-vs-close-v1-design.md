# Existing Short-Obligation HOLD vs CLOSE — Consequence Assessment V1 — Bounded Design

**Status:** Design decomposition — implementation-ready candidate. **Design gate 2026-09-16: ACCEPT WITH REQUIRED AMENDMENTS — amendments applied (see Revision log).** **NOT implemented, NOT authorized for implementation.** Design completeness does not confer implementation authority (see §23).
**Authority:** Supporting design artifact (Category E). Canonical strategy is `docs/roadmap.md`; accepted why-state is `docs/journal/project-journal-4.md` (2026-09-16 entry) and `docs/discovery/lvt-owned-capital-consequence-reconciliation-2026-09-09.md`.
**Produced:** 2026-09-16, authorized three-actor reconciliation cycle (Principal + ChatGPT + Kiro; Codex adversarial input reflected in the accepted reconciliation), Kiro as invoked repository-resident actor.
**SYNC SHA:** `7b4a0843295bfed52584e4b5d97efd4eb7eacdd1` (remotely verified accepted `main`).
**LVT homes (no new identity):**
- Alternatives (that {HOLD, CLOSE} are the applicable transitions): `LVT-BET-LIFECYCLE-CHOICES` → `LVT-INIT-LIFE-COMPARE`, `LVT-INIT-LIFE-TRANSITIONS`.
- Independent consequence facts: `LVT-BET-CONSEQUENCE-ENVELOPE` → `LVT-INIT-CONSEQUENCE-RELEASE-COST` (this design **extends that Initiative from owned shares to existing short-option obligations**; the owned-share v1 design `docs/design/lvt-init-consequence-release-cost-v1-design.md` is the direct architectural precedent).
- Comparative judgment (later, not V1): `LVT-BET-EXPLANATION`, `LVT-BET-ACCEPTABILITY`.
- Governed BTC/take-profit policy (later, not V1): `LVT-BET-LIFECYCLE-POLICY` → `LVT-INIT-POLICY-TAKE-PROFIT`; mechanics experiment `LVT-EXP-BTC-MECHANICS`.
- Lifecycle-transition/execution semantics + CLOSE-vs-ROLL separation: `PL-EXEC-01`. Behavioral discipline: `PL-DEC-BEH`.
**Review path:** returns to 3AM (Principal + ChatGPT). A 4AM (add Codex) adversarial pass may follow **after** this design exists, only if the Principal authorizes escalation. This document does not request one.

---

## 1. Operator question

> **"For a short option obligation I already hold, what changes from this instant forward if I continue holding it versus buying it to close now — and is there enough trustworthy evidence to compare those two alternatives?"**

This is a **forward consequence** question about an already-open obligation. It is not "when should Wheelwright buy this back" (that is governed policy, `LVT-INIT-POLICY-TAKE-PROFIT`), not "which alternatives exist" (`LVT-BET-LIFECYCLE-CHOICES`), and not "which alternative should I choose" (comparative judgment, `LVT-BET-EXPLANATION` / `LVT-BET-ACCEPTABILITY`). Those Bets *consume* this consequence representation; this design *produces* it.

**V1 exposes trustworthy consequence facts. V1 does not choose the winner.**

## 2. Ownership boundary (governing constraint — inherited from the release-cost precedent)

> **The consequence model consumes an already-known governed alternative and emits its independent consequence facts. Alternative discovery/enumeration remains outside this design — it belongs to `LVT-BET-LIFECYCLE-CHOICES`. An existing surface may compose the two already-evaluated alternatives (HOLD, CLOSE) side by side, but this design must not become the mechanism that discovers or enumerates the lifecycle-alternative set.**

Concretely the V1 unit of work is:

```
evaluateShortObligationConsequences(obligation, alternative ∈ {HOLD, CLOSE}) → consequence facts
```

It takes one governed alternative as input. It does **not** iterate the chain to *find* alternatives (roll strikes, replacement expirations, spread legs). That enumeration is `LVT-BET-LIFECYCLE-CHOICES`'s responsibility. This single boundary prevents the first implementation from silently becoming a lifecycle-alternative or BTC engine (the Goal separation preserved at ratification).

## 3. Domain subject

The subject is a **`MonitoredPosition` that is an existing single-leg short-option obligation** — a short put (CSP) or short call (covered call), as already modeled by `OpenShortPut` / `OpenShortCall` in the portfolio snapshot and monitored under ADR-013 (Contract State / Decision Pressure / Economic Consequence).

Not a new lifecycle-episode entity. Not a `CapitalState` machine. Consistent with ADR-016 non-decisions: no durable lifecycle identity is established, defined, required, or anticipated by this design.

The subject carries an explicit **contract quantity** (number of short contracts). Both alternatives evaluate the **same** obligation block; V1 does not partially close (see §17 non-goals — no one-leg / partial-close).

## 4. Supplied alternatives (exactly two)

- **HOLD** — continue the existing obligation to its next relevant lifecycle boundary while preserving later optionality (§5).
- **CLOSE** — buy to close the existing short leg now, retiring the obligation and moving to the resulting state (§6).

ROLL, assignment-as-action, expiration-as-action, spread-close, one-leg-close, take-profit-on-a-structure are **neighboring** lifecycle alternatives owned by `LVT-BET-LIFECYCLE-CHOICES` / `PL-EXEC-01`. They are explicitly **out of V1** (§17) but the abstraction leaves room for them: each is simply *another supplied alternative* a future surface could compose through the same evaluator seam (§18).

## 5. HOLD semantics

HOLD means:

- no lifecycle transition now; the existing short obligation remains;
- current nominal encumbrance remains (§13);
- contractual exposure remains; assignment/expiration resolution possibilities remain;
- current option sensitivities (Greeks/IV) remain (§12);
- the operator preserves the ability to close (or roll/let-resolve) later;
- the **scheduled** contractual boundary is expiration, but **for American-style short options earlier assignment remains possible** — HOLD does not guarantee the obligation survives until expiration.

HOLD is **not** "do nothing forever." It is continuation toward the scheduled contractual boundary (expiration) while preserving later optionality, **acknowledging that early assignment may resolve it sooner**. The time-to-expiration is an **exposure duration**, not guaranteed capital lockup and not a guarantee the obligation persists that long (the operator may BTC/roll/let-resolve, and the counterparty may assign early). V1 does **not** predict early assignment merely from this possibility (§12, §16 case 3/4).

## 6. CLOSE semantics

CLOSE means:

- buy to close the existing short leg;
- the existing obligation terminates; future exposure from that obligation terminates;
- the nominal encumbrance associated with that obligation is removed (§13);
- the portfolio moves to the resulting post-close state. For a **short put (CSP)**: the short-put obligation and its nominal encumbrance are removed — **whether this produces additional cash, buying power, or deployable capacity is unknown until authoritative broker/account evidence establishes it** (never stated as "collateral freed to cash"). For a **covered call**: the shares are **no longer encumbered by this call** — the shares remain shares; **no cash release from those shares is implied**;
- remaining option value is surrendered through the closing debit;
- the operator gains whatever future optionality the resulting state actually provides.

CLOSE does **not** assume nominal-encumbrance removal equals broker-authoritative deployable buying power, cash, or deployable capacity (§13). There is no executable close price before execution (§11).

## 7. Consequence-fact contract

V1 represents, **per obligation, per supplied alternative**, the following independent facts. Each carries its own precision/provenance (§10/§14). Facts are never combined into a scalar (§17).

### CLOSE facts

| # | Fact | One-line meaning |
|---|------|------------------|
| C1 | **Estimated close debit (+ quote geometry)** | `assumedClosePrice × 100 × contracts`, `assumedClosePrice = (bid+ask)/2` midpoint, **presented together with the bid, ask, and spread (or equivalent quote-quality context) that produced it** — C1 must never become a precise-looking dollar figure detached from that geometry. Indicative pre-trade estimate; **not** fill/executable/guaranteed debit (§11). If evidence cannot distinguish a missing/unusable zero quote from a meaningful zero, or the market is structurally weak/wide, the estimate is marked **weak/`unavailable`** rather than manufacturing confidence. |
| C2 | **Quote convention + quality used** | Names the convention behind C1 (midpoint) and carries the bid/ask/spread geometry and evidence age/provenance, so the estimate and its quality are inspectable. |
| C3 | **Quote/evidence provenance and age** | Chain-acquisition provenance/age for the option leg (ADR-015). Never presented as timeless. |
| C4 | **Nominal encumbrance removed** | The obligation-specific nominal encumbrance removed by closing (CSP: `strike × 100 × contracts` of cash-secured encumbrance removed; covered call: the `contracts × 100` shares are no longer encumbered by this call — shares, **not** cash). **Removal of nominal encumbrance is not a claim about cash/buying-power/deployable-capacity change** — that is unknown until broker/account evidence establishes it. §13. |
| C5 | **Resulting holding/obligation state** | What the operator holds after CLOSE (CSP → short-put obligation removed; any change to cash/deployable capacity unknown pending broker/account evidence. Covered call → shares no longer encumbered by this call, still held as shares). A holding label, not a capital-state ontology, and **not** a cash-release claim. |
| C6 | **Current DTE** | Days to expiration of the obligation being retired. |
| C7 | **Current moneyness** | ITM/ATM/OTM + distance from strike, from current underlying + strike. |
| C8 | **Assignment/expiration exposure removed** | The resolution exposure eliminated by closing. |
| C9 | **Current Greeks (where authoritative)** | delta/gamma/theta/vega/rho as context; each independently nullable; §12. |
| C10 | **Mid IV / SMV (where authoritative)** | `midIv` and `smvVol` as **distinct** volatility-state context; never collapsed; §12. |
| C11 | **Execution uncertainty** | Explicit statement that the actual fill is unknown pre-execution; spread/slippage not hidden. |
| C12 | **Next decision boundary** | "now" (the CLOSE is itself the decision) / resulting-state boundary. |

### HOLD facts

| # | Fact | One-line meaning |
|---|------|------------------|
| H1 | **Obligation remains** | The short obligation continues unchanged. |
| H2 | **Nominal encumbrance remains** | The obligation-specific nominal encumbrance stays committed (§13). |
| H3 | **DTE / time to scheduled contractual boundary** | Exposure duration to expiration (the scheduled boundary); **not** guaranteed lockup and **not** a guarantee the obligation lasts that long — American-style early assignment remains possible (§5). |
| H4 | **Assignment/expiration resolution branches** | The mechanically possible resolutions, each with its Economic Consequence (ADR-013). Expiration-path branches are scoped "if held through expiration"; **early assignment is acknowledged as a possible earlier resolution** (not predicted); other earlier exits (BTC/roll) acknowledged as descriptions, not modeled. |
| H5 | **Current moneyness** | Same as C7. |
| H6 | **Current Greeks (where authoritative)** | §12; enrich, never decide. |
| H7 | **Mid IV / SMV (where authoritative)** | §12; distinct measurements. |
| H8 | **No immediate closing cash outlay** | HOLD incurs no close debit now. |
| H9 | **Continued exposure** | Directional/volatility/time exposure the obligation retains. |
| H10 | **Retained ability to close later** | Optionality preserved (BTC/roll/let-resolve remain available). |
| H11 | **Next scheduled decision boundary** | Expiration is the scheduled contractual boundary; earlier assignment remains possible (not predicted). Not asserted as the only or guaranteed resolution date. |

### Historical / context facts — optional, degradable (NOT prerequisites)

| # | Fact | One-line meaning |
|---|------|------------------|
| X1 | **Opening credit** | Premium received when the obligation was opened, where authoritatively attributable. |
| X2 | **Estimated gross mark-to-market option result vs attributable opening credit** | `openingCredit − currentObligationValue` (per §8 sign discipline), where opening credit is authoritatively attributable. **This is NOT realized P/L:** `currentObligationValue` is quote-derived (midpoint, indicative), no actual close has occurred, and closing costs/slippage are excluded unless separately authoritative. A mark-to-market estimate, never accounting truth. |
| X3 | **Premium captured %** | `(openingCredit − currentObligationValue) / openingCredit`, where opening credit is trustworthy. Its numerator uses the same **gross** quote-derived estimate as X2 (before closing costs/slippage); the denominator is **gross opening credit**. The %'s gross/net basis must be stated explicitly and its gross numerator and gross denominator must **not** be silently mixed with any net figure. |
| X4 | **Realized-to-date economics** | Any realized economics on this obligation to date, where attributable. |

X1–X4 are **historical context**, not forward value. They **degrade honestly** to `approximate`/`unavailable` (§10) and **must never** be prerequisites for, or suppress, the forward HOLD/CLOSE facts (C*/H*). They must never masquerade as forward value (§8).

**Not in V1 as a computed fact:** any scalar combining these; any ranking; any "recommended" alternative; any ROLL/replacement economics; any assignment-desirability inference.

## 8. Historical vs forward — the load-bearing distinction

- **Historical / context economics** (X1–X4: opening credit, estimated gross mark-to-market result vs opening credit, premium-captured %, realized-to-date) answer *what has happened so far* (or, for X2/X3, a gross mark-to-market estimate of it). Useful context; **not** the forward decision model. Note X2 is explicitly an estimate, not realized P/L (§7).
- **Forward consequences** (C*/H*) answer *from this instant forward, what changes if the operator continues vs closes*. This is the actual HOLD-vs-CLOSE comparison.

The design must not allow the mark-to-market estimate (X2), premium-captured % (X3), sunk cost, or "getting back to even" to masquerade as forward value. Consistent with `PL-DEC-BEH` (Mechanics over Impulse; sunk-cost/reference-point effects) and ADR-014 (premium recognized once at receipt; resolving capital is never forecast production). A test asserts historical facts are labeled historical and are never inputs to a forward CLOSE-vs-HOLD verdict (there is no verdict in V1 anyway — §17).

## 9. Authoritative inputs (classified)

| Class | Inputs |
|---|---|
| **Portfolio state** | the short obligation (`OpenShortPut`/`OpenShortCall`), quantity, strike, expiration, associated collateral/encumbrance |
| **Historical / accounting** | opening credit + realized-to-date (ADR-014; recognized-once), where authoritatively attributable — degradable |
| **Current market evidence** | option midpoint (close-leg price), underlying spot, DTE, moneyness, chain-acquisition provenance/age |
| **Greek/IV evidence** | delta/gamma/theta/vega/rho, `midIv`, `smvVol`, `greeksUpdatedAt` — nullable; age = chain age; distinct IV measurements (§12) |
| **Situation / policy** | acceptability, take-profit thresholds, assignment intent — **kept upstream and externally authoritative**, out of the consequence plumbing. The evaluator **never creates or infers** assignment intent; it may *carry* an authoritative supplied value if one exists, otherwise intent is `unknown`. Consumed/owned by `LVT-BET-ACCEPTABILITY` / `LVT-INIT-POLICY-TAKE-PROFIT` |
| **Execution evidence** | none exists pre-execution; midpoint is indicative only (§11) |

The five evidence classes (option-chain, underlying, Greek/IV, portfolio state, historical/accounting) are **distinguished**, never conflated.

## 10. Evidence precision states

Every fact is emitted with one of: **`known`** (authoritative value + provenance), **`approximate`** (value derivable but with a named precision caveat, e.g. blended-basis historical P/L, aged quote), or **`unavailable`** (`{ kind: "unavailable" }`, no synthesis). Rules:

- Forward facts (C*/H*) that require only current chain + portfolio + calendar are `known` when that evidence is admissible; `unavailable` (with fail-closed refusal, §14) otherwise.
- Historical/context facts (X*) degrade to `approximate` (e.g. gross mark-to-market estimate from a quote-derived obligation value; incomplete opening attribution across multiple STOs/partial closes/reopenings — Codex finding) or `unavailable`, and **never** suppress C*/H*.
- No fact is shown bare; each shows its precision/provenance. **No invented precision** (mirrors the release-cost precedent: never emit `exact`/`known` beyond what evidence proves).

## 11. Pricing semantics

There is **no authoritative executable BTC price before execution.** C1 uses midpoint `(bid+ask)/2` (the existing Wheelwright convention) as an **estimate/indicative** value only. It must be labeled as such and must **never** be called fill price, executable price, or guaranteed debit. **C1 always carries the quote geometry that produced it** — bid, ask, and spread (or equivalent quote-quality context) plus evidence age/provenance — so it never loses the market shape behind the dollar figure. Spread/slippage uncertainty is surfaced (C11), not hidden. No execution evidence is invented; no local option-pricing model or IV solver is introduced (§17). No execution-quality threshold or CLOSE policy is invented here (that is `LVT-INIT-POLICY-TAKE-PROFIT`); the requirement is only that a structurally weak/wide market, or evidence that cannot distinguish an unusable zero quote from a meaningful zero, yields a **weak/`unavailable`** estimate rather than a precise-looking, falsely-confident value (§16 case 6).

## 12. Greek / IV semantics (newly-accepted evidence — hard guardrails)

Greeks and IV **enrich** the consequence model; they **do not decide the action** (no V1 action anyway). From `docs/contracts/evidence-snapshot-v1.md` §Secondary Greeks / §IV (additive, INV-PUB-05):

- **All nullable; null ≠ 0.** A genuine provider `0` is data. Only an **exact all-five-zero** greek vector may be treated as an unavailable placeholder (whole-vector only, per contract); a single zero is never "unavailable."
- **No independent provenance:** greek/IV acquisition age **equals the chain's** age. `greeksUpdatedAt` is verbatim provider-local, zone-unspecified, distinct from chain `retrievedAt`; **no** ISO parse, **no** freshness claim beyond the raw value.
- **`midIv` (Tradier midpoint-inverted) and `smvVol` (ORATS surface) are DISTINCT** — never aliased, averaged, substituted, or collapsed into a generic `iv`. There is no generic `iv`. IV is **never** computed locally.
- **Per-greek independence:** a missing `delta` says nothing about `theta`; consumers evaluate availability field by field.
- **Sign preserved as reported.** A magnitude view normalizes itself.

Semantic limits carried into every presentation:

- **Delta** — directional/local sensitivity. **Not** assignment probability.
- **Gamma** — local change in delta. High gamma is **not** a CLOSE trigger.
- **Theta** — local time-decay sensitivity. **Not** guaranteed daily income; short-position sign/quantity normalized carefully if shown as position economics.
- **Vega** — local volatility sensitivity. High volatility is **not** inherently undesirable for an existing short obligation.
- **Mid IV / SMV** — distinct volatility-state context. Neither is a BTC trigger. No volatility-trajectory inference without authoritative historical evidence (none exists today).

## 13. Capital / encumbrance semantics

V1 may compute/display a **nominal obligation/collateral consequence** where strategy semantics make it deterministic:

- **Short put (CSP):** cash-secured strike-notional geometry supports a nominal encumbrance fact = `strike × 100 × contracts`. Closing **removes that nominal encumbrance**; whether it produces additional cash/buying power/deployable capacity is **unknown until broker/account evidence establishes it** (never "collateral freed to cash").
- **Covered call:** closing the call means the shares are **no longer encumbered by this call**; it does **not** create cash from those shares. The unencumbered asset is *shares*, not cash.

V1 must **not** automatically translate nominal-encumbrance removal into: broker buying power released, cash released, deployable cash, or immediately reusable capital. Authoritative deployable buying power remains **broker/account (Fidelity balance) evidence**, not this design. Canonical term: **"nominal encumbrance removed"** (no better established term exists in current authority). This mirrors the release-cost precedent's F1 "estimated gross sale value ≠ deployable capacity" correction.

## 14. Evidence / admissibility behavior

Inherited from ADR-015 / ADR-016 / ADR-017:

- **Consume backend-owned session/admissibility authority**; do not reconstruct competing admissibility authority in the consumer (ADR-017). Use the same per-subject admissibility verdict + session block the recommendation engines consume.
- **Fail closed** where governing authority says evidence is inadmissible/insufficient or authority is pending — refuse to establish the comparison rather than fabricate one (§16 case 13).
- **Carry available provenance/age** (ADR-015); do not manufacture quote provenance.
- **Surface materially mismatched acquisition times** (e.g. greek/IV or underlying older than the option quote) rather than hiding them (§16 case 12).
- **Never present aged evidence as timeless/current** without qualification.
- Distinguish option-chain, underlying, greek/IV, portfolio-state, and historical/accounting evidence (§9).

## 14a. Lifecycle-ambiguity fail-closed guard (bounded, required)

The live portfolio overlay can retain a **ghost obligation** after it has already been bought-to-close, expired, or assigned (this is the untracked live-overlay gap — Finding B / BUG-001 sibling, §21). Confidently offering HOLD/CLOSE facts on a ghost obligation is exactly the trustability failure this capability exists to eliminate. V1 therefore carries a bounded fail-closed guard:

- **Rule:** if authoritative post-checkpoint Activity evidence contains an **exact-contract resolution event** (buy-to-close, expiration, or assignment) that **conflicts with the projected open obligation** being evaluated, the evaluator classifies the subject as **`lifecycle state ambiguous`** and **refuses** HOLD/CLOSE evaluation for that subject.
- **Exact-contract association only.** The conflict is recognized only when the resolution event can be associated to the exact contract **without speculative inference**. If exact-contract association cannot be established under existing authority, the evaluator **refuses rather than associates** (preserves ADR-016 — no manufactured/competing association).
- **No state repair inside the evaluator.** The consequence evaluator **must not** mutate, reconstruct, or repair portfolio/overlay state to resolve the disagreement. Portfolio-state remediation remains **BUG-001 / its sibling scope**, separately governed.
- **No competing authority.** The guard reads authoritative Activity evidence to *detect a conflict and refuse*; it does not become a second position-projection authority.
- This is a **refusal**, not a fabricated domain state — it fails closed (consistent with ADR-017's pending/unknown-fails-closed spirit), surfacing `lifecycle state ambiguous` rather than a confident HOLD/CLOSE comparison.

## 15. Degradation behavior (summary)

- Missing/aged current chain → forward facts `unavailable` / refuse comparison (fail closed); never guess a close debit.
- Missing one greek, valid others → show the available ones; mark the missing one `unavailable` (per-greek independence).
- Exact all-zero greek vector → treat as unavailable placeholder (whole-vector rule).
- `midIv`/`smvVol` disagree → show both distinctly; never reconcile/average.
- Incomplete opening attribution → X1–X4 `approximate`/`unavailable`; C*/H* unaffected.
- No authoritative deployable capacity → C4/C5 stay "nominal encumbrance removed", never "cash/buying power/deployable capacity".
- Exact-contract post-checkpoint resolution conflicts with the projected open obligation → classify **`lifecycle state ambiguous`** and **refuse** (§14a); never repair state in the evaluator.
- Structurally weak/wide market or indistinguishable unusable-zero quote → C1 marked **weak/`unavailable`** with quote geometry, never a precise-looking confident figure (§11).

## 16. Design pressure test (18 cases)

For each: the design must produce **truthful facts**, **degrade explicitly**, or **refuse** the comparison. No fabricated precision.

1. **OTM CSP, substantial DTE, most premium captured.** C1 small close debit (midpoint, indicative); H* show remaining exposure/DTE; X3 premium-captured % shown as *historical context*, explicitly not a forward CLOSE signal. Truthful facts.
2. **OTM CSP, 1–2 DTE, tiny close debit.** C1 tiny debit; C12 "now"; H3 very short exposure duration; assignment/expiration branches shown. Truthful facts. No "just let it expire" recommendation (no verdict).
3. **ITM CSP, assignment explicitly desired — ONLY when an authoritative supplied intent exists.** Assignment *consequence* (H4) + *outlook* (ADR-013, if independently available) shown; assignment *desirability* may be carried **only if** an authoritative Situation/operator-intent value is supplied — the evaluator consumes it, never owns or infers it. Absent such authority the intent is `unknown` (case 4). V1 states facts, not a CLOSE/HOLD verdict. Truthful facts (conditional on supplied intent).
4. **ITM CSP, assignment intent unknown (default).** Consequence + outlook shown; intent remains `unknown`; **no** "high assignment exposure ⇒ CLOSE" conclusion is produced, and desirability is **never** inferred from moneyness/delta/basis/P/L (withhold acceptability judgment). Truthful facts + explicit withholding.
5. **Covered call, closing removes call encumbrance, not cash.** C4/C5 = shares no longer encumbered by this call, still held as shares; explicitly **not** cash/buying power (§13). Truthful facts.
6. **Wide bid/ask, midpoint weak estimate.** C1 shown with C2 quote geometry (bid/ask/spread) + C11 execution uncertainty; the width is surfaced as a weak-estimate caveat (`approximate`), or `unavailable` if structurally unusable. Explicit degradation.
7. **Missing opening-credit attribution.** X1–X4 `unavailable`; C*/H* fully shown. Explicit degradation; forward comparison intact.
8. **Partial close / reopened contract history.** Opening attribution ambiguous → X1–X4 `approximate`/`unavailable` with caveat; C*/H* unaffected. Explicit degradation.
9. **Missing one greek, valid others.** Missing greek `unavailable`; others shown (per-greek independence). Explicit degradation.
10. **Exact all-zero provider greek vector.** Treated as unavailable placeholder (whole-vector rule); not shown as real zeros. Explicit degradation.
11. **`midIv` and `smvVol` materially disagree.** Both shown, labeled distinctly; never averaged/collapsed. Truthful facts.
12. **Greek/IV older than underlying/option quote.** Mismatched acquisition times surfaced (C3 + greek age = chain age; `greeksUpdatedAt` shown verbatim). Explicit degradation.
13. **Session/admissibility says evidence not usable.** Fail closed: refuse to establish the comparison; show pending/inadmissible state, not fabricated facts (ADR-017). Refusal.
14. **Large nominal encumbrance, no known redeployment.** C4 nominal encumbrance removed shown; **no** claim of freed buying power or redeployment (§13; feasible-set is `LVT-BET-CAPITAL-CHOICES`). Truthful facts.
15. **Apparent superior new opportunity, deployable capacity not authoritative.** V1 does not compute redeployment or feasible-set; C4 stays nominal-only; deployable capacity deferred to broker/account evidence. Truthful facts (bounded).
16. **Potential ROLL where replacement credit would hide a costly old-leg close.** ROLL is out of V1; the design refuses to produce a net roll credit. CLOSE economics stand alone (per `PL-EXEC-01`). Refusal (of ROLL) + truthful CLOSE facts.
17. **Position already BTC'd but live overlay not reconciled (Finding B).** The §14a guard fires: authoritative post-checkpoint Activity shows an exact-contract buy-to-close conflicting with the projected open obligation → classify **`lifecycle state ambiguous`** and **refuse** HOLD/CLOSE; the evaluator does **not** repair overlay state. If exact-contract association cannot be made without inference, refuse rather than associate. Refusal. (Cross-links BUG-001 sibling.)
18. **Assignment/expiration already resolved but projected state inconsistent.** Same §14a guard: an exact-contract expiration/assignment resolution event conflicting with the projected open obligation → **`lifecycle state ambiguous`**, refuse. No state repair in the evaluator. Refusal. (Cross-links BUG-001 sibling.)

## 17. Explicit V1 non-goals

No automatic HOLD recommendation; no automatic CLOSE recommendation; no scalar HOLD/CLOSE score; no generalized BTC engine; no take-profit policy implementation; no ROLL evaluation; no replacement-leg recommendation; no multi-leg lifecycle framework; no spread-close; no close-one-leg/partial-close; no assignment-desirability inference; no assignment-probability invention; no automatic redeployment; no claim that nominal encumbrance equals broker buying power; no capital-path optimizer; no generalized lifecycle-episode entity; no generalized `CapitalState` machine; no new provider calls; no local option-pricing model / IV solver; no policy thresholds hidden in UI/domain plumbing; no mutation of Deployment recommendation semantics; no direct broker execution; no alternative discovery/enumeration (that is `LVT-BET-LIFECYCLE-CHOICES`); **no tax computation or inference** — V1 does not compute or infer the tax consequences of HOLD/CLOSE because current authoritative evidence does not support reliable tax-specific lifecycle claims (stated explicitly rather than silently omitted); **no creation of assignment-desirability/intent state** — intent is consumed only from an authoritative supplied source, otherwise `unknown` (§9, §16 cases 3/4); **no portfolio/overlay state repair inside the evaluator** (§14a).

## 18. Future extensibility

The **supplied-alternative + independent-consequence-facts + presentational composition** shape generalizes cleanly. ROLL, assignment-as-action, expiration-as-action, close-a-spread, close-one-leg, take-profit-on-a-defined-risk-structure each become *another supplied alternative* evaluated through the same `evaluateShortObligationConsequences`-style seam, with enumeration owned by `LVT-BET-LIFECYCLE-CHOICES` and judgment by `LVT-BET-EXPLANATION`/`LVT-BET-ACCEPTABILITY`. V1 does **not** paint into a BTC-specific corner precisely because it declines to build a BTC mechanism — it evaluates a *supplied transition*. The CLOSE-vs-ROLL wall (§2, §16 case 16) is the specific guarantee that the roll extension will keep old-leg close economics separate (`PL-EXEC-01`).

## 19. Lifecycle / accounting dependencies

- **Hard (already present) — the minimum for the core forward comparison:** portfolio short-obligation state; usable current option evidence (bid/ask/midpoint for the obligation contract); the necessary underlying evidence; and provenance + per-subject session/admissibility authority (ADR-015 / ADR-017). Nothing else is required to produce the core HOLD/CLOSE forward facts.
- **Optional / degradable enrichment — NOT hard dependencies:** the newly-accepted greek/IV fields (`delta`, `gamma`, `theta`, `vega`, `rho`, `midIv`, `smvVol`, `greeksUpdatedAt`; contract §Secondary Greeks / §IV). Each is independently nullable and degradable context (§12); the forward comparison must remain fully functional when any or all are absent. All §12 semantic guardrails still apply when they are present.
- **Soft / degradable:** opening-credit + realized-to-date attribution (ADR-014 recognition; lot/lifecycle maturity `PL-PORT-01`/`PL-PORT-02` / `LVT-INIT-OUTCOME-BASIS`) — required only for `known` historical/context facts (X*), never for the forward comparison.
- **Adjacent correctness constraints (NOT dependencies to repair here, but bounding the design — see §21):** backend BTC classification (**BUG-021**) and live-overlay BTC/expired resolution (**BUG-001** assigned subset + untracked BTC/expired). V1 must not assume Production accounting has netted a BTC, nor that the live projected position set has removed a closed/resolved obligation (§16 cases 17–18).

## 20. Testable invariants (design-level)

1. **No verdict:** the evaluator returns facts only; no field ranks, scores, or names a recommended alternative (`assert` no `recommended`/`score`/`winner` output).
2. **Two alternatives, supplied:** the evaluator accepts a supplied alternative ∈ {HOLD, CLOSE} and does **not** enumerate the chain to discover alternatives (no strike/expiration/roll search inside the module).
3. **Estimate labeling:** C1 close debit is labeled indicative/midpoint (C2), never fill/executable/guaranteed; a test asserts the disclaimer and C11 presence.
4. **Historical ≠ forward:** X1–X4 are labeled historical; a test asserts they are absent from any forward CLOSE/HOLD fact derivation and do not suppress C*/H* when `unavailable`.
5. **Encumbrance semantics:** C4/C5 use "nominal encumbrance removed"; covered-call close yields shares (not cash); a test asserts C4 is never labeled deployable buying power / cash released.
6. **Greek/IV guardrails:** null ≠ 0; exact all-zero vector → unavailable (whole-vector); `midIv`/`smvVol` never collapsed; greek age = chain age; `greeksUpdatedAt` not ISO-parsed. Tests assert each.
7. **Assignment discipline:** delta not labeled assignment probability; unknown assignment intent prevents any "high exposure ⇒ CLOSE" output.
8. **Fail-closed:** inadmissible/pending authority → comparison refused, not fabricated (ADR-017).
9. **CLOSE ≠ ROLL:** no net-roll-credit output; CLOSE economics stand alone.
10. **Determinism:** same cache + portfolio + policy → same facts (ADR-001).
11. **Precision:** no fact shown bare; no invented `known`/exact precision; provenance/age carried.
12. **Greeks/IV optional:** the core forward comparison (C1–C8/C11–C12, H1–H5/H8–H11) is produced when greek/IV evidence is entirely absent; a test drives the evaluator with all greek/IV fields null and asserts the forward facts still emit.
13. **HOLD early-assignment:** HOLD facts describe expiration as the *scheduled* boundary and never assert the obligation survives until expiration; a test asserts early-assignment possibility is preserved (H3/H4/H11) and no early-assignment probability is produced.
14. **Assignment intent external:** a test asserts intent defaults to `unknown`, is never inferred from moneyness/delta/basis/P/L, and is only carried when an authoritative supplied value is present.
15. **Lifecycle-ambiguity guard:** given post-checkpoint exact-contract BTC/expiration/assignment conflicting with the projected open obligation, the evaluator emits `lifecycle state ambiguous` and no HOLD/CLOSE facts, and performs no portfolio-state mutation (§14a); if exact-contract association is not establishable, it refuses rather than associates.
16. **C1 quote geometry:** a test asserts C1 always carries bid/ask/spread + provenance, and that a structurally weak/wide or indistinguishable-zero market yields weak/`unavailable`, never a bare confident dollar value.
17. **X2 not realized P/L:** a test asserts X2 is labeled an estimated gross mark-to-market result (not realized P/L) and X3 declares its gross/net basis without mixing.
18. **Tax non-goal:** a test/spec assertion confirms no tax figure is computed or presented.
19. **Degraded-fact distinguishability (presentation invariant):** degraded/`unavailable` evidence must be visually and semantically distinguishable enough that it **cannot masquerade** as a known consequence fact. (Visual prominence is an implementation-design detail; this invariant is not.)

## 21. Adjacent correctness findings (identified, classified, NOT repaired here)

Per authorization item 4 (identify, do not silently repair):

- **Finding A — BTC mis-classified in Production accounting.** Genuine current defect, previously untracked as a specific BUG. `TransactionClassifier` lacks a `"YOU BOUGHT CLOSING TRANSACTION"` branch → BTC falls through to `ASSET_PURCHASE` → `EconomicDecomposer` books `CAPITAL_DEPLOYMENT`, never netted against the recognized opening premium. Filed as **BUG-021** (record only). This is *why* §8/§19 forbid assuming Production has reconciled a BTC. Remediation not authorized.
- **Finding B — live overlay does not resolve BTC/expired.** Genuine defect in `projectActivityOverlay`; `buy_to_close`/`expired` (and `assigned`/`shares_sold_assignment`) fall through the mutation switch without reducing positions. The **assigned** subset is already **BUG-001** (Open). The **BTC/expired** cases are the same class, untracked; recorded as a scope note cross-linked to BUG-001 (Principal to decide widen-vs-sibling). This is *why* §16 cases 17–18 require refusing confident facts for a possibly-ghost obligation. Remediation not authorized; BUG-001 scope not unilaterally widened.

## 22. Smallest coherent implementation boundary (decomposition)

**V1 = a read-only, deterministic consequence evaluator that, per existing single-leg short obligation, emits independent CLOSE facts (C1–C12) and HOLD facts (H1–H11) plus precision-tagged historical context (X1–X4), for the two supplied alternatives {HOLD, CLOSE} (NOT discovering them), consuming cached option-chain + underlying + newly-accepted greek/IV evidence + portfolio short-obligation state + backend session/admissibility authority, composed as two adjacent independently-evaluated alternatives on an existing surface, with §12 greek/IV guardrails, §11 pricing semantics, §13 encumbrance semantics, §8 historical-vs-forward wall, and §14 fail-closed admissibility all enforced by test.**

- **No backend change, no schema, no provider calls, no scheduler change, no new page** for the core evaluator + composition.
- One frontend computation module (extending the pattern in `call-brief-builder.ts` / the release-cost consequence pattern) + presentational adjacency in an existing surface, plus the §14a lifecycle-ambiguity guard.
- **Host surface — DECIDED (design gate 2026-09-16): Operator Console position-detail.** The subject is an already-held obligation; ADR-013 already assigns Contract State / Decision Pressure / Economic Consequence to that surface; placing this in Deployment first would blur prospective (new-deployment) and existing-obligation populations. Deployment may eventually compose lifecycle alternatives, but Console is the cleanest first realization. **No new page.** A dedicated surface remains a **non-goal** (§17).
- **Alternative supply — DECIDED (design gate 2026-09-16):** the Console host may supply the **fixed pair `{HOLD, CLOSE}`** for a qualifying existing single-leg short obligation. The evaluator still accepts **one supplied alternative at a time** and never discovers alternatives itself. This bounded realization does **not** establish a generalized lifecycle-enumeration engine; future enumeration remains `LVT-INIT-LIFE-COMPARE`.
- Historical facts (X*) and any exact accounting depend on `PL-PORT-01`/`PL-PORT-02`/`LVT-INIT-OUTCOME-BASIS` and on BUG-021/BUG-001 correctness — all **degradable**, none blocking the forward comparison.

## 23. Implementation-authorization gate and sequencing

Implementation is **UNAUTHORIZED**. Design-gate status: **ACCEPT WITH REQUIRED AMENDMENTS — amendments applied (this revision).** This design becomes eligible for implementation only after:

1. Principal acceptance of this amended design (3AM); a 4AM Codex adversarial pass is **not required** for the design itself (Codex already supplied the accepted-code adversarial audit that shaped it) unless the Principal chooses to escalate;
2. explicit Principal implementation authorization (design completeness does **not** authorize code — `PL-EXEC-01` / idea-intake-reconciliation discipline).

### Sequencing (design-gate decision, 2026-09-16)

- **BUG-021 does not block V1.** Historical/context facts (X*) are degradable; the forward comparison does not require Production to correctly net an actual BTC.
- **BUG-001 / its sibling scope does not have to precede V1 — but only because of the §14a lifecycle-ambiguity guard.** With that guard implemented and tested, V1 refuses (rather than confidently evaluates) a possibly-ghost obligation. **Without the §14a guard, V1 is NOT implementation-safe** and would be blocked, because confidently offering HOLD/CLOSE on a ghost obligation is the exact trustability failure this capability exists to eliminate.
- **Accepted implementation sequence:** design amendments (this revision) → explicit implementation authorization → V1 evaluator + Console position-detail composition + §14a lifecycle-ambiguity guard (with its invariants/tests) → separately governed BUG-001 / BUG-021 remediation.

## 24. Open design-time (non-blocking) questions

Three of the four prior open questions were **settled at the 2026-09-16 design gate**: host surface = Operator Console position-detail (§22); alternative supply = fixed `{HOLD, CLOSE}` pair supplied by the host, evaluator still one-at-a-time (§22); Resolution Outlook is **not** a dependency (HOLD may state moneyness/DTE/branches/sensitivities/scheduled-expiration without predicting a branch; if ADR-013 Resolution Outlook exists independently it may be shown as separately-labeled adjacent context, never required or recomputed by the evaluator — invariant preserved in §12/§16 case 4).

Remaining open (implementation-design detail only):

1. **Visual prominence of degraded/`unavailable` facts.** Presentation choice, deferred to implementation design — bounded by the strong invariant (§20.19) that degraded evidence must be conspicuous enough that an unavailable estimate cannot visually masquerade as a known one.

---

## Provenance

- Accepted why-state: `docs/journal/project-journal-4.md` (2026-09-16).
- Ownership-seam precedent: `docs/discovery/lvt-owned-capital-consequence-reconciliation-2026-09-09.md` and `docs/design/lvt-init-consequence-release-cost-v1-design.md`.
- Evidence contract: `docs/contracts/evidence-snapshot-v1.md` §Secondary Greeks / §IV.
- Governing decisions: ADR-013, ADR-014, ADR-015, ADR-016, ADR-017; `foundations/policy-over-prediction.md`.
- Canonical strategy: `docs/roadmap.md` (`LVT-BET-LIFECYCLE-CHOICES`, `LVT-BET-CONSEQUENCE-ENVELOPE`, `LVT-INIT-CONSEQUENCE-RELEASE-COST`, `LVT-BET-EXPLANATION`, `LVT-BET-ACCEPTABILITY`, `LVT-BET-LIFECYCLE-POLICY`); backlog `PL-EXEC-01`, `PL-DEC-BEH`, `PL-PORT-01`, `PL-PORT-02`.
- Adjacent findings: `docs/bugs/BUG-021-*.md` (Finding A), `docs/bugs/BUG-001-assigned-call-closure-projection.md` (Finding B assigned subset).

---

## Revision log

**2026-09-16 — Design-gate ACCEPT WITH REQUIRED AMENDMENTS (Principal + ChatGPT; Kiro applied).** Core architecture accepted (ownership seam, HOLD/CLOSE state-transition model, historical-vs-forward separation, no-verdict V1, CLOSE≠ROLL, existing identities). Ten bounded corrections applied, no architectural reversal:

1. **CSP CLOSE resulting-state** — removed "collateral freed to cash"; CSP CLOSE removes the short-put obligation + nominal encumbrance, and any cash/buying-power/deployable-capacity change is unknown until broker/account evidence; covered-call CLOSE = shares no longer encumbered by this call (still shares, no cash release). (§6, C4, C5, §13, §16.5, §20.5)
2. **Lifecycle-ambiguity fail-closed guard (§14a, new)** — exact-contract post-checkpoint BTC/expiration/assignment conflicting with the projected open obligation ⇒ classify `lifecycle state ambiguous` and refuse; no state repair inside the evaluator; refuse rather than infer association (ADR-016 preserved). Invariant §20.15; pressure-test §16.17–18.
3. **Greeks/IV are optional, not hard dependencies** — §19 hard minimum is obligation state + usable current option evidence + necessary underlying evidence + provenance/admissibility; greeks/`midIv`/`smvVol`/`greeksUpdatedAt` are degradable enrichment (guardrails preserved). Invariant §20.12.
4. **X2 reframed** — no longer "historical P/L"; now "estimated gross mark-to-market option result vs attributable opening credit" (quote-derived, pre-close, excludes closing costs); X3 declares gross/net basis and does not mix. (§7, §8, §10, §16.1, §20.17)
5. **C1 quote geometry preserved** — C1 always carries bid/ask/spread + provenance; structurally weak/wide or indistinguishable-zero market ⇒ weak/`unavailable`, never a precise-looking confident figure; no execution-quality threshold invented. (C1, C2, §11, §16.6, §20.16)
6. **HOLD early-assignment** — expiration is the *scheduled* boundary; American-style early assignment remains possible; HOLD never implies survival to expiration; no early-assignment probability invented. (§5, H3, H4, H11, §16, §20.13)
7. **Assignment intent external** — evaluator never creates/infers intent; carries it only from an authoritative supplied source, else `unknown`; case 3 made conditional on supplied authoritative intent. (§9, §16.3–4, §17, §20.14)
8. **Taxes non-goal** — V1 explicitly does not compute/infer tax consequences (stated, not silently omitted). (§17, §20.18)
9. **Three design questions settled** — host = Operator Console position-detail (no new page); host may supply the fixed `{HOLD, CLOSE}` pair (evaluator still one-at-a-time; enumeration stays `LVT-INIT-LIFE-COMPARE`); Resolution Outlook is not a dependency (may be shown as separately-labeled adjacent context). Degraded-fact distinguishability added as a presentation invariant (§20.19); only visual prominence remains an implementation-design detail. (§22, §24)
10. **Sequencing recorded** — BUG-021 non-blocking; BUG-001/sibling non-blocking **only if** the §14a guard is implemented and tested, else V1 is not implementation-safe; accepted sequence: amendments → authorization → evaluator + Console composition + §14a guard → separately governed BUG remediation. (§23)

No new `PL-*`/LVT/ADR created; no code changed; no BUG remediated. Contradiction check: none discovered — the amendments only *narrow* implicit claims and *reduce* hard dependencies; they are consistent with ADR-013/014/015/016/017 and the release-cost precedent.
