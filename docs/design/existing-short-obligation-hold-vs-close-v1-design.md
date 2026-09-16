# Existing Short-Obligation HOLD vs CLOSE — Consequence Assessment V1 — Bounded Design

**Status:** Design decomposition — implementation-ready candidate. **NOT implemented, NOT authorized for implementation.** Design completeness does not confer implementation authority (see §19).
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
- the next contractual/lifecycle decision boundary remains in the future.

HOLD is **not** "do nothing forever." It is continuation to the next relevant lifecycle boundary while preserving later optionality. The time-to-boundary is an **exposure duration**, not guaranteed capital lockup (the operator may BTC, roll, or let it resolve).

## 6. CLOSE semantics

CLOSE means:

- buy to close the existing short leg;
- the existing obligation terminates; future exposure from that obligation terminates;
- the nominal encumbrance associated with that obligation is removed (§13);
- the portfolio moves to the resulting post-close state (CSP → collateral freed to cash; covered call → shares freed from the call obligation, **not** converted to cash);
- remaining option value is surrendered through the closing debit;
- the operator gains whatever future optionality the resulting state actually provides.

CLOSE does **not** assume nominal-encumbrance removal equals broker-authoritative deployable buying power (§13). There is no executable close price before execution (§11).

## 7. Consequence-fact contract

V1 represents, **per obligation, per supplied alternative**, the following independent facts. Each carries its own precision/provenance (§10/§14). Facts are never combined into a scalar (§17).

### CLOSE facts

| # | Fact | One-line meaning |
|---|------|------------------|
| C1 | **Estimated close debit** | `assumedClosePrice × 100 × contracts`, `assumedClosePrice = (bid+ask)/2` midpoint. Indicative pre-trade estimate; **not** fill/executable/guaranteed debit (§11). |
| C2 | **Quote convention used** | Names the convention behind C1 (midpoint), so the estimate is inspectable. |
| C3 | **Quote/evidence provenance and age** | Chain-acquisition provenance/age for the option leg (ADR-015). Never presented as timeless. |
| C4 | **Nominal encumbrance removed** | The obligation-specific nominal encumbrance released by closing (CSP: `strike × 100 × contracts`; covered call: the `contracts × 100` shares freed from the call obligation — shares, **not** cash). §13. |
| C5 | **Resulting holding/obligation state** | What the operator holds after CLOSE (CSP → freed collateral/cash; covered call → unencumbered shares). A holding label, not a capital-state ontology. |
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
| H3 | **DTE / time to contractual boundary** | Exposure duration to the next contractual boundary; **not** guaranteed lockup (§5). |
| H4 | **Assignment/expiration resolution branches** | The mechanically possible resolutions, each with its Economic Consequence (ADR-013), scoped "if held through expiration"; earlier exits acknowledged as descriptions, not modeled. |
| H5 | **Current moneyness** | Same as C7. |
| H6 | **Current Greeks (where authoritative)** | §12; enrich, never decide. |
| H7 | **Mid IV / SMV (where authoritative)** | §12; distinct measurements. |
| H8 | **No immediate closing cash outlay** | HOLD incurs no close debit now. |
| H9 | **Continued exposure** | Directional/volatility/time exposure the obligation retains. |
| H10 | **Retained ability to close later** | Optionality preserved (BTC/roll/let-resolve remain available). |
| H11 | **Next decision boundary** | The next natural forced-decision date (typically expiration). |

### Historical / context facts — optional, degradable (NOT prerequisites)

| # | Fact | One-line meaning |
|---|------|------------------|
| X1 | **Opening credit** | Premium received when the obligation was opened, where authoritatively attributable. |
| X2 | **Current historical P/L** | `openingCredit − currentObligationValue` (per §8 sign discipline), where attributable. |
| X3 | **Premium captured %** | `(openingCredit − currentObligationValue) / openingCredit`, where attributable. |
| X4 | **Realized-to-date economics** | Any realized economics on this obligation to date, where attributable. |

X1–X4 are **historical context**, not forward value. They **degrade honestly** to `approximate`/`unavailable` (§10) and **must never** be prerequisites for, or suppress, the forward HOLD/CLOSE facts (C*/H*). They must never masquerade as forward value (§8).

**Not in V1 as a computed fact:** any scalar combining these; any ranking; any "recommended" alternative; any ROLL/replacement economics; any assignment-desirability inference.

## 8. Historical vs forward — the load-bearing distinction

- **Historical economics** (X1–X4: opening credit, realized premium, premium-captured %, historical P/L) answer *what has happened so far*. Useful context; **not** the forward decision model.
- **Forward consequences** (C*/H*) answer *from this instant forward, what changes if the operator continues vs closes*. This is the actual HOLD-vs-CLOSE comparison.

The design must not allow historical P/L, premium-captured %, sunk cost, or "getting back to even" to masquerade as forward value. Consistent with `PL-DEC-BEH` (Mechanics over Impulse; sunk-cost/reference-point effects) and ADR-014 (premium recognized once at receipt; resolving capital is never forecast production). A test asserts historical facts are labeled historical and are never inputs to a forward CLOSE-vs-HOLD verdict (there is no verdict in V1 anyway — §17).

## 9. Authoritative inputs (classified)

| Class | Inputs |
|---|---|
| **Portfolio state** | the short obligation (`OpenShortPut`/`OpenShortCall`), quantity, strike, expiration, associated collateral/encumbrance |
| **Historical / accounting** | opening credit + realized-to-date (ADR-014; recognized-once), where authoritatively attributable — degradable |
| **Current market evidence** | option midpoint (close-leg price), underlying spot, DTE, moneyness, chain-acquisition provenance/age |
| **Greek/IV evidence** | delta/gamma/theta/vega/rho, `midIv`, `smvVol`, `greeksUpdatedAt` — nullable; age = chain age; distinct IV measurements (§12) |
| **Situation / policy** | acceptability, take-profit thresholds, assignment intent — **kept upstream**, out of the consequence plumbing; consumed later by `LVT-BET-ACCEPTABILITY` / `LVT-INIT-POLICY-TAKE-PROFIT` |
| **Execution evidence** | none exists pre-execution; midpoint is indicative only (§11) |

The five evidence classes (option-chain, underlying, Greek/IV, portfolio state, historical/accounting) are **distinguished**, never conflated.

## 10. Evidence precision states

Every fact is emitted with one of: **`known`** (authoritative value + provenance), **`approximate`** (value derivable but with a named precision caveat, e.g. blended-basis historical P/L, aged quote), or **`unavailable`** (`{ kind: "unavailable" }`, no synthesis). Rules:

- Forward facts (C*/H*) that require only current chain + portfolio + calendar are `known` when that evidence is admissible; `unavailable` (with fail-closed refusal, §14) otherwise.
- Historical facts (X*) degrade to `approximate` (e.g. blended symbol-level basis; incomplete opening attribution across multiple STOs/partial closes/reopenings — Codex finding) or `unavailable`, and **never** suppress C*/H*.
- No fact is shown bare; each shows its precision/provenance. **No invented precision** (mirrors the release-cost precedent: never emit `exact`/`known` beyond what evidence proves).

## 11. Pricing semantics

There is **no authoritative executable BTC price before execution.** C1 uses midpoint `(bid+ask)/2` (the existing Wheelwright convention) as an **estimate/indicative** value only. It must be labeled as such and must **never** be called fill price, executable price, or guaranteed debit. Spread/slippage uncertainty is surfaced (C11), not hidden. No execution evidence is invented; no local option-pricing model or IV solver is introduced (§17). If bid/ask is wide, the midpoint is a **weak** estimate and the design says so (§16 case 6).

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

- **Short put (CSP):** cash-secured strike-notional geometry supports a nominal encumbrance fact = `strike × 100 × contracts`. Closing removes that nominal encumbrance.
- **Covered call:** closing the call **releases the shares from the call obligation**; it does **not** create cash from those shares. The freed asset is *shares*, not cash.

V1 must **not** automatically translate nominal-encumbrance removal into: broker buying power released, cash released, deployable cash, or immediately reusable capital. Authoritative deployable buying power remains **broker/account (Fidelity balance) evidence**, not this design. Canonical term: **"nominal encumbrance removed"** (no better established term exists in current authority). This mirrors the release-cost precedent's F1 "estimated gross sale value ≠ deployable capacity" correction.

## 14. Evidence / admissibility behavior

Inherited from ADR-015 / ADR-016 / ADR-017:

- **Consume backend-owned session/admissibility authority**; do not reconstruct competing admissibility authority in the consumer (ADR-017). Use the same per-subject admissibility verdict + session block the recommendation engines consume.
- **Fail closed** where governing authority says evidence is inadmissible/insufficient or authority is pending — refuse to establish the comparison rather than fabricate one (§16 case 13).
- **Carry available provenance/age** (ADR-015); do not manufacture quote provenance.
- **Surface materially mismatched acquisition times** (e.g. greek/IV or underlying older than the option quote) rather than hiding them (§16 case 12).
- **Never present aged evidence as timeless/current** without qualification.
- Distinguish option-chain, underlying, greek/IV, portfolio-state, and historical/accounting evidence (§9).

## 15. Degradation behavior (summary)

- Missing/aged current chain → forward facts `unavailable` / refuse comparison (fail closed); never guess a close debit.
- Missing one greek, valid others → show the available ones; mark the missing one `unavailable` (per-greek independence).
- Exact all-zero greek vector → treat as unavailable placeholder (whole-vector rule).
- `midIv`/`smvVol` disagree → show both distinctly; never reconcile/average.
- Incomplete opening attribution → X1–X4 `approximate`/`unavailable`; C*/H* unaffected.
- No authoritative deployable capacity → C4/C5 stay "nominal encumbrance removed", never "buying power".

## 16. Design pressure test (18 cases)

For each: the design must produce **truthful facts**, **degrade explicitly**, or **refuse** the comparison. No fabricated precision.

1. **OTM CSP, substantial DTE, most premium captured.** C1 small close debit (midpoint, indicative); H* show remaining exposure/DTE; X3 premium-captured % shown as *historical context*, explicitly not a forward CLOSE signal. Truthful facts.
2. **OTM CSP, 1–2 DTE, tiny close debit.** C1 tiny debit; C12 "now"; H3 very short exposure duration; assignment/expiration branches shown. Truthful facts. No "just let it expire" recommendation (no verdict).
3. **ITM CSP, assignment explicitly desired.** Assignment *consequence* (H4) + *outlook* (ADR-013) shown; assignment *desirability* consumed from Situation/intent, presented as acceptable — but V1 states facts, not a CLOSE/HOLD verdict. Truthful facts.
4. **ITM CSP, assignment intent unknown.** Consequence + outlook shown; **no** "high assignment exposure ⇒ CLOSE" conclusion is produced (intent unknown → withhold acceptability judgment). Truthful facts + explicit withholding.
5. **Covered call, closing releases shares not cash.** C4/C5 = shares freed from call obligation; explicitly **not** cash/buying power (§13). Truthful facts.
6. **Wide bid/ask, midpoint weak estimate.** C1 shown with C2 convention + C11 execution uncertainty; the width is surfaced as weak-estimate caveat (`approximate`). Explicit degradation.
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
17. **Position already BTC'd but live overlay not reconciled (Finding B).** V1 must not assume the live projected position set is authoritative for a just-closed obligation; if the obligation is absent/ambiguous in reconciled state, refuse or mark `unavailable` rather than emitting confident facts for a ghost position. Refusal/degradation. (Cross-links BUG-001 / §17-adjacent finding.)
18. **Assignment/expiration already economically resolved but projected state inconsistent.** Same discipline as 17: do not emit forward HOLD/CLOSE facts for an obligation that reconciled evidence shows already resolved; degrade/refuse. (Cross-links Finding B.)

## 17. Explicit V1 non-goals

No automatic HOLD recommendation; no automatic CLOSE recommendation; no scalar HOLD/CLOSE score; no generalized BTC engine; no take-profit policy implementation; no ROLL evaluation; no replacement-leg recommendation; no multi-leg lifecycle framework; no spread-close; no close-one-leg/partial-close; no assignment-desirability inference; no assignment-probability invention; no automatic redeployment; no claim that nominal encumbrance equals broker buying power; no capital-path optimizer; no generalized lifecycle-episode entity; no generalized `CapitalState` machine; no new provider calls; no local option-pricing model / IV solver; no policy thresholds hidden in UI/domain plumbing; no mutation of Deployment recommendation semantics; no direct broker execution; no alternative discovery/enumeration (that is `LVT-BET-LIFECYCLE-CHOICES`).

## 18. Future extensibility

The **supplied-alternative + independent-consequence-facts + presentational composition** shape generalizes cleanly. ROLL, assignment-as-action, expiration-as-action, close-a-spread, close-one-leg, take-profit-on-a-defined-risk-structure each become *another supplied alternative* evaluated through the same `evaluateShortObligationConsequences`-style seam, with enumeration owned by `LVT-BET-LIFECYCLE-CHOICES` and judgment by `LVT-BET-EXPLANATION`/`LVT-BET-ACCEPTABILITY`. V1 does **not** paint into a BTC-specific corner precisely because it declines to build a BTC mechanism — it evaluates a *supplied transition*. The CLOSE-vs-ROLL wall (§2, §16 case 16) is the specific guarantee that the roll extension will keep old-leg close economics separate (`PL-EXEC-01`).

## 19. Lifecycle / accounting dependencies

- **Hard (already present):** cached option chain + underlying spot; portfolio short-obligation state; per-subject session/admissibility verdict (ADR-017); chain-acquisition provenance (ADR-015); the newly-accepted greek/IV fields (contract §Secondary Greeks / §IV).
- **Soft / degradable:** opening-credit + realized-to-date attribution (ADR-014 recognition; lot/lifecycle maturity `PL-PORT-01`/`PL-PORT-02` / `LVT-INIT-OUTCOME-BASIS`) — required only for `known` historical facts (X*), never for the forward comparison.
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

## 21. Adjacent correctness findings (identified, classified, NOT repaired here)

Per authorization item 4 (identify, do not silently repair):

- **Finding A — BTC mis-classified in Production accounting.** Genuine current defect, previously untracked as a specific BUG. `TransactionClassifier` lacks a `"YOU BOUGHT CLOSING TRANSACTION"` branch → BTC falls through to `ASSET_PURCHASE` → `EconomicDecomposer` books `CAPITAL_DEPLOYMENT`, never netted against the recognized opening premium. Filed as **BUG-021** (record only). This is *why* §8/§19 forbid assuming Production has reconciled a BTC. Remediation not authorized.
- **Finding B — live overlay does not resolve BTC/expired.** Genuine defect in `projectActivityOverlay`; `buy_to_close`/`expired` (and `assigned`/`shares_sold_assignment`) fall through the mutation switch without reducing positions. The **assigned** subset is already **BUG-001** (Open). The **BTC/expired** cases are the same class, untracked; recorded as a scope note cross-linked to BUG-001 (Principal to decide widen-vs-sibling). This is *why* §16 cases 17–18 require refusing confident facts for a possibly-ghost obligation. Remediation not authorized; BUG-001 scope not unilaterally widened.

## 22. Smallest coherent implementation boundary (decomposition)

**V1 = a read-only, deterministic consequence evaluator that, per existing single-leg short obligation, emits independent CLOSE facts (C1–C12) and HOLD facts (H1–H11) plus precision-tagged historical context (X1–X4), for the two supplied alternatives {HOLD, CLOSE} (NOT discovering them), consuming cached option-chain + underlying + newly-accepted greek/IV evidence + portfolio short-obligation state + backend session/admissibility authority, composed as two adjacent independently-evaluated alternatives on an existing surface, with §12 greek/IV guardrails, §11 pricing semantics, §13 encumbrance semantics, §8 historical-vs-forward wall, and §14 fail-closed admissibility all enforced by test.**

- **No backend change, no schema, no provider calls, no scheduler change, no new page** for the core evaluator + composition.
- One frontend computation module (extending the pattern in `call-brief-builder.ts` / the release-cost consequence pattern) + presentational adjacency in an existing surface.
- **Host-surface hypothesis (to be confirmed at the design gate, not decided here):** the Operator Console position-detail (ADR-013 Economic Consequence dimension) is the natural host because the subject is a *held* obligation; the Write Desk drawer is the alternative. Decision deferred to the design gate to avoid duplicating representation across surfaces (mirrors the release-cost host-first discipline). A dedicated new surface is a **non-goal** (§17).
- Historical facts (X*) and any exact accounting depend on `PL-PORT-01`/`PL-PORT-02`/`LVT-INIT-OUTCOME-BASIS` and on BUG-021/BUG-001 correctness — all **degradable**, none blocking the forward comparison.

## 23. Implementation-authorization gate

Implementation is **UNAUTHORIZED**. This design becomes eligible for implementation only after:

1. Principal (3AM) acceptance of this design; optional 4AM (Codex) adversarial pass if the Principal authorizes escalation;
2. explicit Principal implementation authorization (design completeness does **not** authorize code — `PL-EXEC-01` / idea-intake-reconciliation discipline);
3. host-surface confirmation (§22);
4. a decision on the adjacent findings (§21) — whether BUG-021 / BUG-001-scope work sequences before, with, or after this V1 (the forward comparison can ship with degradation regardless, but the Principal may prefer to sequence the accounting/overlay correctness first).

## 24. Open design-time (non-blocking) questions

1. Host surface: Console position-detail vs Write Desk drawer (§22) — related to the open `PL-DEPLOY` decision-surface (expanded-row vs drawer) pressure.
2. Where the "applicable alternatives = {HOLD, CLOSE}" enumeration is authoritatively produced (`LVT-INIT-LIFE-COMPARE`) vs supplied by the host surface for V1.
3. Whether an honest HOLD comparison can be stated without any Resolution Outlook, or whether it inherently imports the ADR-013 outlook layer (and its uncertainty-honesty rules).
4. Presentation prominence of degraded/`unavailable` facts (Trustability presentation choice; settle at implementation design).

---

## Provenance

- Accepted why-state: `docs/journal/project-journal-4.md` (2026-09-16).
- Ownership-seam precedent: `docs/discovery/lvt-owned-capital-consequence-reconciliation-2026-09-09.md` and `docs/design/lvt-init-consequence-release-cost-v1-design.md`.
- Evidence contract: `docs/contracts/evidence-snapshot-v1.md` §Secondary Greeks / §IV.
- Governing decisions: ADR-013, ADR-014, ADR-015, ADR-016, ADR-017; `foundations/policy-over-prediction.md`.
- Canonical strategy: `docs/roadmap.md` (`LVT-BET-LIFECYCLE-CHOICES`, `LVT-BET-CONSEQUENCE-ENVELOPE`, `LVT-INIT-CONSEQUENCE-RELEASE-COST`, `LVT-BET-EXPLANATION`, `LVT-BET-ACCEPTABILITY`, `LVT-BET-LIFECYCLE-POLICY`); backlog `PL-EXEC-01`, `PL-DEC-BEH`, `PL-PORT-01`, `PL-PORT-02`.
- Adjacent findings: `docs/bugs/BUG-021-*.md` (Finding A), `docs/bugs/BUG-001-assigned-call-closure-projection.md` (Finding B assigned subset).
