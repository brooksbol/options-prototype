# Long-Thread Architectural Reconciliation

**Date:** August 17, 2026
**Status:** Analysis — reconciliation of extended discussion against authoritative architecture
**Source material:** Fidelity UX observations, lifecycle economics, clawback, outcome concentration, treasury architecture discussion
**Governing frame:** `docs/07-architecture-current.md`, `docs/foundations/`, `docs/parking-lot.md`, `docs/25-situation-architecture.md`, `docs/31-architectural-reconciliation.md`

---

## 1. Executive Conclusion

### Is this discussion within current architectural intent?

**Yes — substantially.** The discussion is architecturally compatible with Wheelwright's governing foundations. It does not require overturning any principle, violating any boundary, or fundamentally redesigning the system. The majority of concepts either already have architectural homes or fit naturally into planned-but-unresolved work (PL-EVID-01/02, PL-POL-01, Situation Architecture).

### What clearly fits?

- **NAV erosion as primary failure mode** — already a hard constraint in the Regime Objective Function ("NAV erosion must remain bounded; capital consumed faster than it produces is structurally unsustainable").
- **Premium is not profit** — Net Strategy Result already decomposes OPTION_PREMIUM + REALIZED_APPRECIATION − CAPITAL_EROSION. Production and erosion are separately visible by architectural decision (ADR-014).
- **Assignment as economic state transition** — ADR-013 explicitly states "assignment is an outcome, not a defect." Economic Consequence (dim 3) already models this.
- **Operator agency in failure states** — Sustain Institutional Behavior: "The system reduces cognitive load, not agency." The system recommends; the operator decides.
- **Policy over Prediction** — no directional forecasting, no prescriptive SELL/HOLD. Consequence governance only.
- **Lifecycle economics direction** — Conditioned Operating Opportunity already defines the full put → ownership → call path as a domain concept. PL-EVID-02 names the formal lifecycle assessment domain.
- **Portfolio thinking** — Avoid Concentration principle exists. One-recommendation-per-underlying is current policy. Sector awareness is planned.

### What clearly does not fit inside Wheelwright?

- **Personal Treasury System** — floors, reverse capitalization, Herbie, Sawdust integration, Holdings LLC flows, and vanilla investing coordination are governance concerns *above* Wheelwright. Wheelwright is one tool among several; it is not the treasury.
- **Regime-switching automation** — Wheelwright does not predict when to change regimes. Situations are operator-declared context, not system-determined transitions.

### What remains uncertain?

- Whether **Deployment Lifecycle/Cohort** deserves first-class primitive status or can be adequately expressed through PL-EVID-01/02's historical lifecycle linkage.
- Whether **behavioral bias warnings** belong in the Explanation Engine or constitute a separate cognitive concern.
- Whether **outcome concentration** is merely a richer operationalization of Avoid Concentration or requires distinct governance vocabulary.
- The appropriate granularity for **clawback diagnostics** — whether they emerge naturally from Lifecycle Assessment evidence or require their own diagnostic surface.

---

## 2. Conformance Matrix

| # | Concept | Current Architectural Home | Fit | Disposition |
|---|---------|---------------------------|-----|-------------|
| 1 | NAV erosion as primary failure mode | Regime Objective Function (hard constraint) | Already supported | Confirmed |
| 2 | Premium is not profit | ADR-014, Net Strategy Result decomposition | Already supported | Confirmed |
| 3 | Assignment as economic state transition | ADR-013 dim 3 (Economic Consequence) | Already supported | Confirmed |
| 4 | Operator agency / no prescriptive SELL/HOLD | Sustain Institutional Behavior principle | Already supported | Confirmed |
| 5 | No directional forecasting | Policy over Prediction (hard boundary) | Already supported | Confirmed |
| 6 | Fidelity UX cognitive-load problem | Operational Surface Design (impatient mode) | Supported — under-documented | Enriches existing principles |
| 7 | Moneyness / strike interpretation layer | Operator Console, Position Monitoring (ADR-013 dim 1) | Supported — under-documented | Implementation refinement |
| 8 | Theta / Greek sensitivities on position view | ADR-013 (Contract State) | Implicitly supported | Observation only — data dependency |
| 9 | Historical P&L causal attribution (waterfall) | PL-EVID-01 (Historical Evidence Architecture) | Genuine new — blocked | Parking-lot candidate |
| 10 | Strategy/lifecycle provenance (buy-write identity) | PL-EXEC-01 (Trade Lifecycle Evolution) | Supported but under-documented | Enriches PL-EXEC-01 |
| 11 | Position-level NAV erosion diagnostic | Production Accounting + Economic Consequence | Supported but under-documented | Implementation work within PL-PORT-02 |
| 12 | Lifecycle/cohort identity (separate clocks) | PL-EVID-02 (Lifecycle Assessment Evidence Domain) | Genuine new concept | Requires clarification |
| 13 | Clawback as decision situation | PL-POL-01 (Cash-Flow-Safe Recovery), Situation Architecture (Liquidity Repair) | Genuine new — conceptually anticipated | Enriches future Situation |
| 14 | Basis-Anchored Delta Decay (named pathology) | None explicit | Genuine new concept | Vocabulary candidate |
| 15 | Implied Clawback Duration (diagnostic metric) | None | Genuine new concept | Diagnostic candidate (within PL-EVID-02) |
| 16 | Capital Captivity | Economic Consequence (implicit) | Supported but unnamed | Vocabulary candidate |
| 17 | Sunk-cost / loss-chasing behavioral biases | Sustain Institutional Behavior (philosophy), no mechanism | Genuine new concern | Explanation Engine candidate |
| 18 | Behavioral bias warnings as operator context | Explanation Engine (natural home) | Genuine new capability | Parking-lot candidate |
| 19 | Portfolio-level clawback vs position-level | PL-PORT-02, Production Accounting | Requires clarification | Design question for PL-EVID-01/02 |
| 20 | Multiple entry cohorts / DCA trap | PL-EVID-02 (Lifecycle Assessment) | Genuine new — depends on PL-EVID-01 | Parking-lot candidate |
| 21 | Outcome Concentration | Avoid Concentration principle | Extension of existing principle | Enriches Avoid Concentration |
| 22 | Recurring premium clusters / correlation | PL-EVID-05 (Recommendation Set Analysis) | Observation only | Experiment/instrumentation candidate |
| 23 | Premium-Driven Risk Clustering hypothesis | PL-EVID-05, PL-ARCH-02 | Observation only | Experiment candidate |
| 24 | Diversification Cost | None | Observation only | Experiment candidate |
| 25 | Insurance-company analogy (portfolio of premiums) | Regime Objective Function (mission framing) | Implicitly supported | Vocabulary/explanatory |
| 26 | Cash-flow knob / Equity knob | Situation Architecture (regime parameters) | Implicitly supported | Enriches Situation model |
| 27 | Productive Output vs Productive Capacity | Regime Objective Function (partial) | Supported but under-documented | Vocabulary clarification |
| 28 | Production Burden metric | None explicit | Genuine new concept | Belongs in Situation/Mission |
| 29 | Floors (personal expenses → Holdings → real estate) | Above Wheelwright | Out of scope | Treasury-level governance |
| 30 | Reverse capitalization (Holdings → Wheelwright) | Above Wheelwright | Out of scope | Treasury-level governance |
| 31 | Herbie (current constraint) | Above Wheelwright | Out of scope | Treasury-level governance |
| 32 | Sawdust as complementary tool | Above Wheelwright | Out of scope | Treasury-level governance |
| 33 | Wheelwright has no entitlement to capital | Preserve Optionality, operator agency | Already supported (implicit) | Vocabulary candidate |
| 34 | Tax-loss harvesting as clawback dimension | PL-PORT-02 (production accounting remaining) | Genuine new — data-dependent | Far-future observation |
| 35 | Tug-of-war / force decomposition | Explanation Engine (future) | Genuine new — data-dependent | Far-future observation |
| 36 | Chasing the Delta Dragon (anti-pattern name) | None | Vocabulary/behavioral | Vocabulary candidate |

---

## 3. Primitive Review

The discussion introduces substantial new vocabulary. The question is whether any of it requires a new *first-class domain primitive* — a new type in the domain model that other subsystems must know about and consume.

### Candidate: Deployment Lifecycle / Cohort

**Assessment: Possibly justified, but defer structural decision.**

The concept is that repeated entries into the same ticker at different times/bases create economically distinct lifecycles with their own clocks, premium histories, impairment states, and resolution economics.

**Test against existing architecture:**
- PL-EVID-02 (Lifecycle Assessment Evidence Domain) already names "ingress, operating, egress" as lifecycle phases.
- Conditioned Operating Opportunity already models the put → ownership → call path as a deterministic domain sequence.
- PL-EXEC-01 (Trade Lifecycle Evolution) anticipates: intended → submitted → working → filled → assigned → closed/rolled.
- Fidelity's tax-lot reporting distinguishes individual purchases; Wheelwright's CSV parsing could preserve this granularity.

**Finding:** The *concept* is architecturally anticipated. The question is whether a Lifecycle/Cohort becomes a named type in the domain model (with ID, basis, premium history, inception date, resolution state) or whether it emerges naturally from the Historical Evidence Architecture (PL-EVID-01) as a reconstructed view of transaction history.

**Recommendation:** Do not create the primitive yet. When PL-EVID-01's domain model is designed, explicitly test whether lifecycle/cohort identity is an input to that design or an output of it. Preserve the vocabulary. Defer the structural decision.

### Candidate: Clawback State

**Assessment: Not a new primitive. Express through Situation.**

Clawback is a *decision situation* — a failure-state operating context that shapes how Wheelwright reasons about an impaired position or portfolio. The Situation Architecture already anticipates "Liquidity Repair" and "Capital Recovery" as future situations.

**Finding:** Clawback diagnostics (implied duration, basis-safe delta, production per cycle) are *evidence* within a failure-state Situation, not a new architectural primitive. They belong in the Lifecycle Assessment domain (PL-EVID-02) and would be consumed by a future Situation's explanation framing.

### Candidate: Outcome Concentration

**Assessment: Extension of Avoid Concentration, not a new primitive.**

The existing principle "Avoid Concentration" already governs "no single position, sector, or thesis should dominate." Outcome concentration asks: "How dependent is portfolio success on any one lifecycle resolving favorably?" This is a richer operationalization of the existing principle, not a different concern.

**Finding:** Outcome concentration is a future Level 2 Policy operationalization of Avoid Concentration. It does not require a new engine, domain type, or architectural concept. It requires *evidence* (historical lifecycle outcomes, concurrent deployment inventory) that depends on PL-EVID-01.

### Candidate: Productive Output / Productive Capacity

**Assessment: Already partially expressed. Vocabulary clarification only.**

The Regime Objective Function's mission statement already says: "Sustain target monthly realized production from available capital while preserving the productive capacity of that capital." The distinction between output and capacity is *stated* but not formalized as separate measurable quantities.

**Finding:** These are vocabulary refinements to the existing regime model, not new primitives. "Productive output" maps to realized production (Net Strategy Result). "Productive capacity" maps to NAV / deployable capital. Making these terms explicit in the Regime Objective Function document is valuable but does not create new architecture.

### Candidate: Behavioral Bias Warning

**Assessment: Capability within Explanation Engine, not a new primitive.**

The Explanation Engine's purpose is "Why was this recommended?" It could naturally extend to "What known pathologies are consistent with this contemplated action?" This is an explanatory annotation, not a new domain type.

**Finding:** If bias warnings are ever implemented, they belong as a capability of the Explanation Engine (or a future Post-Deployment Governance concern within the same engine). They do not require a new architectural entity. They require historical evidence (PL-EVID-01) to detect patterns.

### Candidate: Production Burden

**Assessment: Situation parameter, not a new primitive.**

Production Burden = required external distributions / productive capital. This is a property of a Situation (specifically Bridge Income: monthly target relative to eligible AUM). It is already implicitly present in "mission gap" (shortfall between current production and target).

**Finding:** Production Burden is a derived metric within the Situation model. It does not require its own primitive.

### Summary

**No new first-class primitives are required at this time.** The existing architecture — particularly PL-EVID-01/02 (unresolved), Situation Architecture (partially implemented), and the Explanation Engine — provides homes for every concept in this discussion. The discussion enriches and motivates these planned capabilities without demanding structural additions.

---

## 4. Surface / Cognitive-Role Review

### Current roles

| Role | Surface | Discussion impact |
|------|---------|-------------------|
| Explorer | Write Desk / Deployment | Minimal — discussion focuses on post-deployment |
| Governor | Policy Engine (automatic), Velvet Rope (unresolved expression) | Outcome concentration governance is a future Governor concern |
| Operator | Console + Broker Handoff | Significant — failure-state visibility belongs here |

### Post-deployment governance: a missing cognitive moment?

The discussion reveals a cognitive moment not cleanly served by the current three surfaces:

> "I own impaired shares. What are my options? What pathologies might I be exhibiting? What are the economic consequences of each path?"

This is neither exploration (discovering new opportunities) nor pre-deployment governance (admitting an instrument) nor execution (placing an order). It is **post-deployment reassessment**.

**Current architectural coverage:**
- The Console provides Contract State, Decision Pressure, and Economic Consequence for open positions.
- Production provides realized accounting.
- The Recommendation Brief explains *new* deployment recommendations.

**What's missing:** A governed reassessment interaction for *existing impaired positions* that surfaces:
- current lifecycle economics (NAV deficit, cumulative premium, net position result),
- available operating paths (hold + write, close, redeploy),
- mechanical consequences of each path,
- relevant pathology indicators (if evidence exists),
- relevant bias warnings (if capabilities exist).

**Finding:** This is an evolution of the Operator Console's position-detail modal — or a new progressive-disclosure depth within it. It does not require a fourth surface or a new cognitive role. It is the Console's existing "reflective mode" (Operational Surface Design) applied to post-deployment governance.

**Recommended architectural treatment:** Record as an enrichment of the Console's position-detail progressive disclosure, dependent on PL-EVID-01/02 (historical lifecycle evidence) and PL-PORT-01 (portfolio-state maturity). Not a new surface. Not a new cognitive role.

### Explanation Engine expansion

The discussion identifies two new explanation capabilities:

1. **Pathology detection** — "This position's observable state is consistent with Basis-Anchored Delta Decay."
2. **Bias context** — "This contemplated action is consistent with sunk-cost anchoring."

Both are explanation concerns: they help the operator understand *what is happening* without prescribing *what to do*. They belong in the Explanation Engine's remit but depend on historical evidence that does not yet exist.

**Recommended architectural treatment:** Acknowledge as future Explanation Engine capabilities. Do not build scaffolding for them until PL-EVID-01 provides the historical substrate. Preserve the vocabulary.

---

## 5. Accounting / Lifecycle Review

### Position-level NAV erosion

**Current state:** Net Strategy Result operates at the monthly aggregate level. Economic Consequence operates at the individual-position level for *current* open positions. Neither provides a longitudinal per-position lifecycle result.

**What the discussion reveals:** The operator cannot easily answer: "Has this ticker/lifecycle produced net positive value across all its cycles, or has cumulative premium failed to offset cumulative erosion?"

**Architectural path:** This is precisely what PL-EVID-02 (Lifecycle Assessment Evidence Domain) is designed to answer. The lifecycle result is:

```
Lifecycle Net Result = Σ(option premium received) + Σ(realized appreciation) − Σ(realized capital erosion)
```

This is a historical reconstruction from Activity History evidence — the same data Production already consumes. The difference is temporal scope: Production computes monthly; Lifecycle Assessment computes per-deployment-history.

**Dependency:** PL-EVID-01 (Historical Evidence Architecture) must resolve ownership, storage, and lifecycle linkage before this can be computed.

### Lifecycle/cohort accounting

**The problem:** Fidelity average-basis accounting collapses multiple entries into one position. Wheelwright would need to either:
- preserve individual entry records (from Activity History CSV transactions), or
- accept average-basis aggregation and acknowledge the loss of cohort identity.

**Finding:** Fidelity Activity History CSV contains individual transactions with dates and amounts. Tax lots are conceptually available even if Fidelity's position display averages them. The data source for cohort-level reconstruction exists. The architecture to consume it does not yet exist (PL-EVID-01).

### Premium vs appreciation attribution

**Current state:** Net Strategy Result already separates OPTION_PREMIUM from REALIZED_APPRECIATION. This distinction is live and operational.

**What the discussion adds:** The *lifecycle-level* version: "Of this position's total economic result, how much came from premium and how much from appreciation (or depreciation)?" This is a decomposition of the Lifecycle Net Result.

**Finding:** Naturally follows from Lifecycle Assessment (PL-EVID-02) once historical evidence exists. No architectural change needed.

### Clawback mechanics

**The discussion defines clawback as:** After NAV erosion occurs, subsequent option production progressively restores the lost NAV.

**Architectural interpretation:** Clawback is not a mechanism — it is an *observable state* within a lifecycle:

```
IF lifecycle_net_result < 0:
    impaired (NAV erosion exists)
    
IF lifecycle_net_result was < 0 and is now ≥ 0:
    clawed back (premium production offset the erosion)
```

This is arithmetic on Lifecycle Assessment evidence. It requires no new primitive — only the data substrate (PL-EVID-01/02).

**Position-level vs portfolio-level:** Both are computable from the same evidence. Position-level sums one lifecycle. Portfolio-level sums all lifecycles. The distinction is attribution scope, not a structural difference.

### Recapitalization vs organic clawback

The discussion correctly identifies that external capital injection must not be confused with earned recovery. This is an accounting-provenance concern:

- Production (premium) → organic output
- Capital contribution → external injection

**Finding:** ADR-014's production-recognition semantics already establish that production is recognized at receipt. A capital injection is not a sell-to-open transaction — it would not produce a Production record. The two are already structurally distinct in the current accounting model. The concern is valid but already addressed by the existing invariant: "One premium receipt contributes to Production exactly once."

---

## 6. Behavioral Safeguard Review

### Pathology vs bias: an important distinction

The discussion correctly separates:
- **Pathology:** observable system/position state (e.g., basis-safe delta has decayed from 0.30 to 0.03 over 6 months).
- **Bias:** possible operator reasoning error (e.g., sunk-cost anchoring, loss chasing).

Wheelwright can observe pathologies. It cannot diagnose biases. But it can note: "This contemplated action is consistent with a known behavioral pattern."

### Basis-Anchored Delta Decay

**What it is:** A named pathology describing the mechanical deterioration of viable basis-preserving call options as an impaired position's basis-safe strikes move progressively farther OTM.

**Observable evidence dimensions:**
- Current NAV deficit for the lifecycle
- Basis-safe strike (lowest call strike ≥ cost basis)
- Delta at basis-safe strike
- Premium available at basis-safe strike
- Time elapsed since impairment began
- Capital committed

**Architectural home:** This is a derived diagnostic within PL-EVID-02 (Lifecycle Assessment). It requires:
1. Historical cost basis (from portfolio/activity evidence)
2. Current call chain evidence (already cached)
3. Historical delta/premium trajectory (requires PL-EVID-01)

Items 1 and 2 are currently available. Item 3 is not.

**Finding:** A simplified current-state version (snapshot: "your basis-safe delta is currently 0.06 with $8 premium available") is computable *today* from existing evidence + portfolio cost basis. The trend/trajectory version requires historical evidence. Both belong in the Console's position-detail progressive disclosure.

### Chasing the Delta Dragon

**Assessment:** A memorable name for the behavioral loop accompanying basis-anchored delta decay. It is vocabulary, not architecture. It should be preserved as an anti-pattern name in domain documentation but should not become a system classification or alert.

### Behavioral bias warnings — operator agency boundary

**Architectural constraint:** Wheelwright must never:
- diagnose the operator's psychology,
- moralize about decisions,
- produce a prescriptive SELL/HOLD recommendation,
- block operator action based on inferred bias.

**What it may do:**
- Surface observable pathology evidence (factual).
- Note consistency with known behavioral patterns (informational).
- Ensure failure-state economic context is visible alongside contemplated actions (transparency).

**The slot-machine analogy is architecturally useful:** Just as a slot machine emphasizes "WIN $12.50" while hiding total money inserted, a premium-focused display can emphasize "+$27 PREMIUM" while hiding "-$2,140 NAV / 97 DAYS IMPAIRED." Wheelwright should ensure both are simultaneously visible when relevant.

**Recommended architectural treatment:** This is an Explanation Engine / Operational Surface Design concern. When position-detail progressive disclosure is implemented:
- Lifecycle economics should be prominently visible (impatient mode).
- If pathology indicators exist, they should be presented factually.
- If bias-consistency warnings are ever implemented, they should be presented as informational annotations, not as prescriptions.

Governance boundary: the system presents evidence and economic consequences. The operator decides. This is Sustain Institutional Behavior applied to failure states.

---

## 7. Portfolio Construction Review

### Outcome Concentration

**Definition from discussion:** How dependent is portfolio success on any one lifecycle resolving favorably?

**Relationship to existing architecture:** The Avoid Concentration principle currently operationalizes as "one recommendation per underlying" and future "sector exposure awareness" and "maximum position sizing." These are *input* concentration measures (how much capital is deployed where).

Outcome concentration is an *output* measure: "If this specific lifecycle fails, how much does portfolio-level NAV suffer?" This is a richer question that requires knowing both position size and current impairment state.

**Finding:** Outcome concentration is a future Level 2 Policy operationalization of Avoid Concentration. It requires:
- Position sizing data (portfolio context — available today).
- Lifecycle assessment (impairment state — requires PL-EVID-01/02).
- Correlation awareness (premium-driven clustering — requires PL-EVID-05 enrichment data).

**Recommended treatment:** Add "Outcome Concentration" as a named future dimension of Avoid Concentration in the principles governance model. Do not build governance for it until evidence exists. Observe first.

### Recurring premium clusters

**Observation:** The same dozen ETFs repeatedly appear as top premium producers (semiconductors, commodities, Korea, Taiwan). This may represent hidden correlation concentration.

**Architectural assessment:** This is an instance of PL-EVID-05 (Recommendation Set Analysis), which is blocked on enrichment data (sector, industry classification). The observation is architecturally anticipated — the system already acknowledges that recommendation-set composition should eventually be analyzed.

**Finding:** Instrumentation-before-policy applies. The system should:
1. Observe (record which symbols appear in recommendations over time — PL-DEPLOY-02).
2. Measure (when enrichment data becomes available, compute co-occurrence and sector overlap — PL-EVID-05).
3. Learn (determine whether recurring leaders represent genuine correlation risk).
4. Only then: calibrate policy.

### Diversification Cost

**Concept:** The premium sacrificed by choosing a less-concentrated alternative over the highest-premium leader.

**Finding:** This is a natural output of any Deployment Opportunity comparison. If the system presents a ranked list and the operator selects a lower-ranked alternative, the "cost" is the yield difference. This does not require a new primitive or even a new calculation — it is a presentation/explanation concern within the Deployment surface.

**Recommended treatment:** Observation only. When the Deployment Opportunity surface matures, consider whether to explicitly surface "premium sacrificed vs. best available" as explanatory context. Do not build governance around it.

### Correlation hypothesis

**Assessment:** "The highest-premium opportunities may be correlated because the market is paying the most to transfer those specific risks" is a valid hypothesis with insufficient evidence.

**Governing principle test:**
- Policy over Prediction: ✓ — the hypothesis does not require prediction. It asks about structural characteristics.
- Observe Before Acting: ✓ — the correct response is observation, not policy.
- Avoid Concentration: ✓ — if correlation is eventually demonstrated, it enriches concentration governance.

**Finding:** Start measuring. Do not govern. Record as an instrumentation/observation candidate within PL-EVID-05 and PL-DEPLOY-02.

---

## 8. Regime / Treasury Review

### Productive Output vs Productive Capacity

**Current architectural state:** The Regime Objective Function already states: "Sustain target monthly realized production from available capital while preserving the productive capacity of that capital."

The discussion names these as:
- **Productive output** = realized production (premium + appreciation + other realized output)
- **Productive capacity** = the capital base capable of producing future output (NAV, liquid capital)

**Finding:** The concepts are present but not formalized as separately trackable metrics. Net Strategy Result captures output. Portfolio NAV (from Fidelity CSV balances) captures capacity. The *relationship* between them — whether output is growing while capacity is preserved, or output is consuming capacity — is the regime's central health diagnostic.

**Recommended treatment:** Add explicit vocabulary to the Regime Objective Function document:
- Productive Output ≡ Net Strategy Result (monthly, realized)
- Productive Capacity ≡ Portfolio NAV / Eligible AUM

This is a vocabulary clarification, not an architectural change.

### Cash Flow / Equity as regime parameters

The discussion frames these as "knobs" — continuously adjustable priorities rather than binary regime switches.

**Architectural compatibility:** The Situation Architecture already anticipates this. Bridge Income prioritizes cash flow. A future "Capital Preservation" or "Growth" situation would prioritize equity preservation or growth. The Situation model is explicitly designed to be operator-declared context with different optimization priorities.

**Finding:** The "knobs" framing is compatible with Situations but slightly different in mechanism. Situations are discrete declared contexts; knobs imply continuous adjustment. The current architecture correctly handles this: Situation parameters (monthly target, liquidity floor, horizon) are adjustable quantities within a named situation. The operator adjusts the knobs by adjusting situation parameters, not by sliding a continuous control.

**Recommended treatment:** No architectural change. The knobs analogy is useful for operator understanding but does not require architectural expression beyond what Situations already provide.

### Floors (personal expenses → Holdings → real estate deployment)

**Architectural assessment:** These are sequential capital-destination priorities that exist *above* Wheelwright. They describe how Wheelwright's output is distributed after production, not how Wheelwright operates internally.

**Finding:** Wheelwright knows about one floor: its production target (Bridge Income's monthly requirement). Where that production goes after it leaves the Wheelwright portfolio is a treasury/household governance concern. Wheelwright should not model Holdings LLC reserves, real estate acquisition targets, or personal expense budgets.

**What Wheelwright *could* know:** The monthly production target itself is a floor. If future situations define minimum liquidity reserves or minimum production rates, those are floors expressed as situation constraints. The language "floor" is useful but does not require architectural work within Wheelwright.

### Reverse capitalization

**The concept:** Holdings LLC flowing capital back into Wheelwright's productive base during a downturn.

**Architectural assessment:** From Wheelwright's perspective, this is simply a change in portfolio balance. The operator imports a new Fidelity CSV showing a larger cash balance. Wheelwright does not need to know *why* the cash balance changed — only that it did.

**What matters architecturally:** Per the discussion's own insight, "recapitalization is not clawback." The accounting model must not make external capital injection look like earned recovery. This is already handled by ADR-014's production-recognition semantics: production is recognized only from sell-to-open transactions, not from deposits.

**Recommended treatment:** No Wheelwright architecture change. Treasury-level governance concern.

### Herbie (current constraint)

**The concept:** Theory of Constraints applied to the personal treasury — the current bottleneck determines where marginal capital should flow.

**Finding:** This is above Wheelwright. Wheelwright does not decide whether capital should be allocated to options income, real estate, time-bucketed savings, or broad index funds. It operates the capital it is given.

### Sawdust / vanilla investing / real estate

**Finding:** All separate tools under a treasury governance layer that does not exist in the codebase and should not be built into Wheelwright. Wheelwright's boundary is clear: it is "an always-on evidence appliance for policy-governed options-income decision support." The other tools remain external.

### What belongs inside Wheelwright vs above it

| Concept | Inside Wheelwright | Above Wheelwright |
|---------|-------------------|-------------------|
| Production target (monthly $) | ✓ (Situation parameter) | |
| NAV preservation constraint | ✓ (hard constraint) | |
| Deployment sizing limits | ✓ (Policy/Governance) | |
| Where production output goes after earning | | ✓ |
| When to add/remove capital from Wheelwright | | ✓ |
| Which tool (Sawdust/Wheelwright/RE) to use | | ✓ |
| Liquidity reserve minimum | ✓ (Situation constraint) | |
| Holdings LLC balance | | ✓ |
| Real estate acquisition timing | | ✓ |
| Production Burden ratio | Borderline — derived metric | Primary consumer is treasury |

---

## 9. Recommended GitHub Changes

### Existing documents that should change

| Document | Change | Justification |
|----------|--------|---------------|
| `docs/foundations/regime-objective-function.md` | Add explicit "Productive Output" and "Productive Capacity" vocabulary in a §Vocabulary section | Discussion revealed these terms are useful and already implied but never named |
| `docs/parking-lot.md` | Add PL-POL-01 enrichment note referencing clawback decision-situation concept | Currently a one-line exploratory seed; the discussion gives it substantial content |
| `docs/parking-lot.md` | Add note to PL-EVID-02 acknowledging cohort/lifecycle identity as a design question | The discussion reveals this is a key question for the Lifecycle Assessment design |

### New documents justified

| Proposed document | Type | Justification |
|-------------------|------|---------------|
| `docs/foundations/failure-state-vocabulary.md` | Foundation vocabulary | Preserves: Basis-Anchored Delta Decay, Capital Captivity, Implied Clawback Duration, Chasing the Delta Dragon. Explicitly marks these as vocabulary candidates, not ratified architecture. Prevents vocabulary loss without premature architectural promotion. |

### What should NOT be documented yet

| Concept | Reason to defer |
|---------|-----------------|
| Outcome Concentration governance policy | No evidence substrate exists (PL-EVID-05 blocked) |
| Premium-Driven Risk Clustering rules | Observation hypothesis with insufficient data |
| Behavioral bias warning system | Requires PL-EVID-01 (largest unresolved dependency) |
| Cohort/lifecycle primitive definition | Requires PL-EVID-01 domain model design first |
| Treasury architecture (floors, Herbie, reverse cap) | Above Wheelwright's boundary |
| Diversification Cost metric | Observation only; premature to formalize |
| Post-deployment governance surface | Console position-detail progressive disclosure; implementation concern |
| Tug-of-war / force attribution visualization | Requires historical data that doesn't exist |

### Parking-lot items justified

| ID (proposed) | Name | Summary |
|---|---|---|
| `PL-BEHAV-01` | Failure-State Legibility | Ensure impaired-position economics are visible alongside contemplated actions: lifecycle NAV deficit, cumulative premium, implied clawback duration (when calculable), available paths with consequences. Depends on PL-EVID-01/02. Natural home: Console position-detail progressive disclosure. |
| `PL-CONC-01` | Outcome Concentration Observation | Instrument and eventually measure outcome concentration: how dependent is portfolio success on individual lifecycle resolution? Observation-first. Depends on PL-EVID-01 and PL-EVID-05. Future enrichment of Avoid Concentration principle. |

---

## 10. Open Questions

These are preserved as genuine uncertainty. Do not resolve without evidence.

### Lifecycle identity

1. When PL-EVID-01's domain model is designed, is lifecycle/cohort a first-class entity with its own ID, or a reconstructed view from transaction history? The answer may depend on whether Wheelwright tracks intent ("this is a new deployment of WEAT") or only observes effects ("Fidelity shows 200 WEAT shares purchased on two dates").

2. Should tax-lot identity (from Fidelity) serve as the natural cohort boundary, or is there a conceptual lifecycle that spans multiple tax lots (e.g., a buy-write that assigns, then is written against repeatedly)?

### Clawback

3. Is "implied clawback duration" a useful diagnostic even though it assumes current production continues unchanged? Does displaying it violate Policy over Prediction by implying a forecast? (Counter-argument: it is a current-state diagnostic analogous to "at current production rate, recovery would require X cycles" — no more predictive than a mortgage amortization schedule.)

4. Should portfolio-level clawback be a Situation-aware concept? (e.g., "The portfolio has $700 of net erosion across all lifecycles" vs. "WEAT has $700 of lifecycle erosion.") Both are factual; the question is which framing serves the operator better.

### Behavioral safeguards

5. Can pathology detection be implemented without historical trajectory data? A snapshot version ("basis-safe delta is 0.03, capital has been committed for 97 days") may be computationally possible from current evidence + portfolio context. Is the snapshot sufficient, or does the trajectory matter?

6. Where is the operator-agency boundary? If the system shows "This action is consistent with sunk-cost anchoring" and the operator proceeds, does the system record the override? Should it? This interacts with Principle-level override logging (Principles Governance Model).

### Portfolio construction

7. Is the operator's observed "novelty preference" (choosing less-recurring ETFs at slightly lower premium) a useful behavioral signal worth instrumenting? If so, what evidence should be preserved to evaluate it later?

8. Should Wheelwright eventually distinguish between *opportunity concentration* (the board repeatedly shows the same names) and *portfolio concentration* (the operator's portfolio actually holds concentrated positions)? The former is an input observation; the latter is a governed state.

### Treasury boundary

9. If Wheelwright's production target is its primary interface with the treasury layer, is that sufficient? Or does the system need to know about minimum capital reserves ("don't deploy below $X") to properly govern deployment sizing?

10. Production Burden (required distributions / productive capital) is computable from existing data (monthly target / eligible AUM). Should it be displayed as operator context? Where? Console? Production? Does it violate any boundary?

---

## Traceability Summary

For each major recommended action, the causal chain:

| Observation | Principle tested | Recommended artifact |
|-------------|-----------------|---------------------|
| Operator cannot determine lifecycle net result for impaired positions | Sustain Institutional Behavior, Operational Surface Design (impatient mode) | PL-BEHAV-01 (Failure-State Legibility) |
| Recurring premium leaders may represent hidden correlation | Avoid Concentration, Observe Before Acting | PL-CONC-01 (Outcome Concentration Observation) |
| "Basis-Anchored Delta Decay" names an observable mechanical deterioration | Evidence Appliance (observe and name) | `docs/foundations/failure-state-vocabulary.md` |
| "Productive Output" and "Productive Capacity" are useful named quantities | Regime Objective Function (already implied) | Vocabulary update to regime doc |
| Clawback is a decision situation, not a mechanism | Situation Architecture (Liquidity Repair anticipated) | Enrichment note on PL-POL-01 |
| Lifecycle/cohort identity is a key design question | PL-EVID-02 (Lifecycle Assessment) | Note added to parking-lot item |
| Treasury concerns (floors, Herbie, reverse cap) are above Wheelwright | System identity boundary (evidence appliance for options income) | No Wheelwright artifact — treasury-level concern |

---

## Governing Principle Preserved

> **History refines operation, not prophecy.**

This reconciliation does not promote discussion hypotheses into architecture. It identifies where the discussion confirms, enriches, or extends existing architecture — and where it should remain observation until evidence accumulates.

---

*This document is analysis. It does not edit existing architecture documents, create new primitives, or commit to implementation. It preserves the causal chain from operational observation to architectural assessment. Next steps require Principal ratification.*
