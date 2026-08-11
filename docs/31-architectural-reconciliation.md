# Architectural Reconciliation

**Purpose:** Test recent operational discoveries — both domain/trading concepts and application-shell/context/flow concerns — against the architectural baseline inventory. Determine what remains true, what needs extension, and whether a new primitive or boundary is emerging.

**Baseline:** `docs/30-architectural-baseline-inventory.md`
**Date:** August 11, 2026
**Status:** Analysis — no existing documents edited

---

## Discovery Inventory

### Category A: Domain / Operational Discoveries

| ID | Discovery | Origin |
|----|-----------|--------|
| D-01 | Buy-Write Recommendation Board | PL-CALL-05, Journal 2026-08-10 |
| D-02 | Cross-Entry Multi-Path Opportunity Awareness | PL-DEPLOY-03, observed live 2026-08-11 |
| D-03 | Unified Capital Deployment Surface | PL-DEPLOY-01, Situation Architecture §Unified |
| D-04 | Opportunity Surface Observation (temporal) | PL-DEPLOY-02 |
| D-05 | Governance Catalog Coverage Gap (BNO/UNG) | PL-GOV-01 |
| D-06 | Assignment Economics / NAV Erosion in calls | ADR-013 dim 3, Console implementation |
| D-07 | Cash-Flow Operating Regime as named concept | `foundations/regime-objective-function.md` |

### Category B: Application-Shell / Context / Flow Discoveries

| ID | Discovery | Origin |
|----|-----------|--------|
| D-08 | Common application header / shell | This week's operational use |
| D-09 | Coherent navigation between surfaces | ADR-012 consequence |
| D-10 | Application-scoped CSV/portfolio context and provenance | ADR-011 consequence |
| D-11 | Consistent evidence/session/freshness across surfaces | State-Oriented Console, Evidence Appliance |
| D-12 | Common page-layout and interaction grammar | Operational observation |
| D-13 | Continuity of operator context across surface transitions | ADR-012 §Action Transition |
| D-14 | Coherent operator flow: orientation → deployment → decision → handoff → production | Emerging from use |
| D-15 | Terminology/surface-boundary cleanup (Write Desk → Wheelwright) | PL-OPS-07, ADR-002 |
| D-16 | Avoiding duplicated page-local state for application-scoped concepts | ADR-011 rationale |

---

## Category A: Domain Discovery Reconciliation

### D-01: Buy-Write Recommendation Board

**Discovery:** The operator can deploy capital by purchasing shares and simultaneously writing a covered call. This is a third entry mechanism alongside CSP and covered calls on existing inventory.

**Owning primitive(s):** Decision (Recommendation). The buy-write board is architecturally parallel to `recommendPuts()` — it applies the same evidence + policy + portfolio → ranked candidates pattern. The Evidence Engine supplies the same cached chains. Policy Engine applies shared concepts (delta, DTE, execution quality) with potentially independent calibration.

**Boundary coherence:** All boundaries hold:
- Evidence ≠ Recommendation: buy-write reads cached call chains, makes zero provider calls. ✓
- Recommendation ≠ Execution: produces BuyWriteCandidate[], broker handoff constructs intent. ✓
- Rank ≠ Presentation: Wheelwright assigns rank; operator sorts view. ✓

**Already anticipated?** Yes.
- Regime Objective Function explicitly names buy-write as a first-class entry mechanism.
- PL-CALL-05 documents the full analysis including Fidelity handoff limitations.
- `07-architecture-current.md` does not yet reflect it but the Four Engines accommodate it without modification.

**Classification:** **Implementation work + documentation drift.** The architecture accommodates buy-write. The primary architecture doc simply hasn't been updated to include it as a recognized recommendation path.

---

### D-02: Cross-Entry Multi-Path Opportunity Awareness

**Discovery:** The same underlying can appear simultaneously as a CSP candidate, a buy-write candidate, and (if held) a covered-call candidate. These are distinct economic propositions, not duplicates.

**Owning primitive(s):** Decision (Recommendation) — each entry mechanism independently evaluates its candidate universe. The cross-entry phenomenon is an emergent property of running multiple recommendation paths against the same evidence.

**Boundary coherence:** Holds. Each recommendation path independently consumes evidence and applies policy. No boundary is violated by observing the same symbol across paths.

**Already anticipated?** Partially. PL-DEPLOY-03 explicitly documents this observation. The Situation Architecture's "Unified Recommendation Surface" implicitly anticipates it by proposing that puts and calls are both portfolio actions in service of a mission. The parking lot correctly notes these are "distinct economic propositions with different capital use, downside exposure, premium behavior, and upside participation."

**Classification:** **Already accommodated.** No architectural change needed. The observation that multi-path visibility exists is a product feature to present, not an architectural pressure to resolve. The current behavior (separate strategy boards, each surfacing the symbol independently) is valid. Whether to add explicit cross-entry presentation is a UX decision, not an architectural one.

---

### D-03: Unified Capital Deployment Surface

**Discovery:** The operator's real question is not "what put should I write?" but "where should my available capital be deployed?" Puts, buy-writes, and covered calls are deployment strategies evaluated against a common policy surface.

**Owning primitive(s):** This sits at the intersection of Situation/Mission and Decision (Recommendation). The Situation provides the mission objective ("produce $6,000/month"). The Decision engines produce candidates from multiple entry mechanisms. The unified surface is the presentation of those candidates organized by mission relevance rather than by entry mechanism.

**Boundary coherence:** Requires examination.
- Evidence ≠ Recommendation: preserved — the surface consumes recommendation output, not raw evidence. ✓
- Observation ≠ Interpretation: the surface displays ranked candidates (interpretation), labeled by their contributing evidence. ✓
- Does it create a new boundary? Potentially — between "strategy-specific recommendation" and "mission-aware deployment recommendation." Currently the architecture has no concept that sits above the individual `recommendPuts()` / `recommendCalls()` outputs and below the operator surface.

**Already anticipated?** Yes, explicitly. The Situation Architecture §Unified Recommendation Surface states: "Under situation-based operation, the primary recommendation table contains portfolio actions that fit the current situation." It also notes: "The current implementation split (separate puts and calls sections) is an artifact of the recommendation engine's structure, not an inherent operator-model requirement."

**Classification:** **Architectural extension (anticipated).** The extension is: a composition layer that assembles outputs from multiple recommendation engines, applies situation-level prioritization, and presents a unified deployment view. This is the natural consequence of Situation Architecture being implemented. It does not violate existing boundaries — it adds a composition concern above the individual engines.

**Candidate concept:** "Deployment Opportunity" — the object produced when a situation-aware composition layer evaluates candidates from all entry mechanisms against the active mission. This is noted as an open question in the Regime Objective Function (§Open Questions #8).

---

### D-04: Opportunity Surface Observation (temporal)

**Discovery:** Observing the recommendation surface over time could answer questions like: Do opportunities cluster near the open? How quickly do high-quality opportunities disappear? Does waiting improve deployment quality?

**Owning primitive(s):** Evidence Engine. This is temporal observation of the recommendation surface — recording what the Decision engines produce at various points in time. The observation itself is evidence (factual, timestamped, provenance-bearing). What you do with it later is analysis.

**Boundary coherence:** Clean.
- The observation records recommendation-engine output (a derived fact) at a point in time.
- It does not feed back into real-time recommendations.
- It is additive evidence that could later inform Level 3 learned models (per Regime Objective Function).

**Already anticipated?** Yes. Evidence Appliance §Historical Analysis: "Continuous durable evidence naturally creates the substrate for historical observation and analysis." The Regime Objective Function §Evidence Architecture explicitly describes Level 3 learned models built from operating history. PL-DEPLOY-02 names this specific application.

**Classification:** **Implementation work.** The architecture already provides for historical evidence accumulation. Opportunity surface observation is a specific application of that general capability.

---

### D-05: Governance Catalog Coverage Gap (BNO/UNG)

**Discovery:** The live product-structure catalog only covers 12 instruments. The remaining ~1,290 universe symbols rely on a name heuristic that does not gate commodity/futures structure.

**Owning primitive(s):** Policy (Governance). Product-structure governance is a policy concern. The catalog is the concrete artifact that implements GOV-PRODUCT (product definition is version-controlled).

**Boundary coherence:** Preserved. The boundary between golden data (Git-backed catalog) and runtime data (observations) is maintained. The gap is in the golden data's coverage, not in the boundary itself.

**Already anticipated?** Yes. PL-GOV-01 documents this precisely, including suspected additional gaps (UGA, DBC, CPER). The parking lot correctly identifies it as a "correctness defect (partial fix applied)" rather than an architectural issue.

**Classification:** **Correctness defect in golden data.** Not architectural pressure. The architecture is right; the data is incomplete.

---

### D-06: Assignment Economics / NAV Erosion in Calls

**Discovery:** A covered call's desirability depends on economics relative to cost basis (effective exit vs basis), not merely on premium attractiveness. The same call can be excellent or destructive depending on the operator's ownership economics.

**Owning primitive(s):** Position Monitoring (Economic Consequence dimension, ADR-013) and Explanation (the Brief should present assignment economics in situational terms).

**Boundary coherence:** Clean.
- Observation ≠ Interpretation: "effective exit is $2.20 above basis" is arithmetic (Economic Consequence). "This serves Bridge Income" is situational interpretation layered on top. The boundary is preserved.
- Contract State remains situation-independent. Economic Consequence is arithmetic. Only situation-level interpretation (future) would be situation-dependent.

**Already anticipated?** Yes, thoroughly.
- ADR-013 defines Economic Consequence as the third dimension of position monitoring.
- The Console architecture documents its implementation (assignment-consequence.ts with decomposed components).
- The Conditioned Operating Opportunity document explicitly describes basis-conditioned evaluation.
- The Situation Architecture explains how the same contract can be a strong fit under one situation and poor under another.

**Classification:** **Already implemented / documentation current.** ADR-013's Economic Consequence dimension covers this. The Console has delivered the first implementation slice. No architectural pressure.

---

### D-07: Cash-Flow Operating Regime as Named Concept

**Discovery:** Wheelwright operates in a cash-flow production regime with an explicit mission. This is documented in `foundations/regime-objective-function.md` but not reflected in the primary architecture document.

**Owning primitive(s):** Situation/Mission — the regime is the broader context within which situations operate. Bridge Income is a specific situation within the cash-flow production regime.

**Boundary coherence:** The regime concept sits above situations in the hierarchy (regime → situation → mission → outcomes → envelope → selection). This layering is implicit in the Situation Architecture but not explicitly named.

**Already anticipated?** Partially. The Regime Objective Function document exists as a foundation. The Situation Architecture references Bridge Income's mission. But the primary architecture document (`07-architecture-current.md`) does not mention regime or mission at all.

**Classification:** **Documentation drift.** The architecture implicitly operates within this regime. Making it explicit in the primary architecture doc is documentation work, not architectural change.

---

## Category B: Application-Shell / Context / Flow Reconciliation

### D-08: Common Application Header / Shell

**Discovery:** Wheelwright's multiple surfaces (Console, Write Desk, Production, future deployment surface) share application-level concerns that belong in a common shell: portfolio provenance, evidence session state, active situation, navigation, operator identity.

**Owning primitive(s):** This is not owned by a single primitive. It is the *runtime expression* of several primitives that the architecture already declares application-scoped:
- Portfolio Context (ADR-011: "Multiple Wheelwright surfaces observe one consistent imported portfolio")
- Evidence session state (Evidence Appliance: session awareness is correctness)
- Situation/Mission (Situation Architecture: situation is operator-declared context, not page-local)
- Operator Surfaces (ADR-012: Console is home; recommendation/execution is another area)

**Boundary coherence:** No boundary is violated. The shell concept *enforces* boundaries by making shared state explicitly shared rather than implicitly duplicated.

**Already anticipated?** Substantially yes, but implicitly.
- ADR-011 states: "A portfolio change on any surface is immediately visible to all other surfaces."
- ADR-012 states: "Application-scoped state becomes a prerequisite for implementation."
- The Console architecture §State Ownership explicitly lists which state categories are application-scoped vs console-local.
- None of these ADRs explicitly name an "application shell" — they describe the properties it must have without naming the container.

**Classification:** **Architectural consequence (implied but unnamed).** ADR-011 and ADR-012 together logically require a shared application shell. The architecture describes the properties; it does not name or specify the structural artifact that provides them. This is a gap between architectural intent and implementation structure.

---

### D-09: Coherent Navigation Between Surfaces

**Discovery:** The operator needs to move fluidly between orientation (Console), deployment opportunity assessment, contract selection, execution, and production reconciliation — preserving context across transitions.

**Owning primitive(s):** Operator Surfaces (as defined in the baseline). ADR-012 §Action Transition explicitly identifies this: "When the operator decides to act, the Console transitions them to the appropriate Wheelwright capability. The transition preserves context."

**Boundary coherence:** Navigation does not violate any existing boundary. It is the connective tissue between surfaces that respect their own scope.

**Already anticipated?** Yes — and explicitly deferred. ADR-012: "The exact navigation mechanism (route change, slide panel, modal, tab) is not yet specified." The Console architecture: "Deliberately deferred: navigation mechanism, URL structure, transition animation, whether capabilities are co-rendered or separately routed."

**Classification:** **Deferred implementation of a recognized architectural requirement.** The architecture knows this is needed. The design decision was explicitly deferred until implementation informs the right model. The discovery is not new; the urgency has increased because multiple surfaces now exist.

---

### D-10: Application-Scoped CSV/Portfolio Context and Provenance

**Discovery:** Portfolio state, its provenance (source files, timestamps, validation), and its derived artifacts (PortfolioSnapshot, economics, capacity) should be visible and consistent across all surfaces without re-upload or re-parsing.

**Owning primitive(s):** Portfolio Context. ADR-011 is precisely this decision.

**Boundary coherence:** Clean. ADR-011's rejection of page-local portfolio state is explicit.

**Already anticipated?** Yes — this IS ADR-011. Implemented via `portfolio-store.ts` (module-level singleton, `useSyncExternalStore`, self-hydrating from localStorage).

**Classification:** **Already decided and implemented.** The discovery is simply the operational experience of using what ADR-011 specified. The architecture is confirmed by use.

---

### D-11: Consistent Evidence/Session/Freshness Across Surfaces

**Discovery:** Evidence freshness, session validity, and provenance are not page-concerns — they are application-level facts that every surface must respect and display consistently.

**Owning primitive(s):** Evidence (as primitive) and the boundary "Observable State ≠ Operational State" from State-Oriented Console. The evidence appliance maintains state independently of any surface; every surface is a viewport into that state.

**Boundary coherence:** Strengthened. If evidence/session state were page-local, the boundary between evidence and its consumers would be violated (each surface re-deriving trust independently). Application-scoped evidence state enforces the single-authority invariant at the UI level.

**Already anticipated?** Yes. The Evidence Appliance foundation: "The browser is a viewport into the appliance, not the thing that starts or owns the system." State-Oriented Console: information layers (glance → expanded → diagnostics) apply uniformly. The `observation-store.ts` already implements subscriber-driven evidence polling that is surface-independent.

**Classification:** **Already architecturally decided; partially implemented.** The observation store exists. What's missing is a formalized, consistently-rendered evidence-state presentation across all surfaces (currently each surface renders its own version of freshness/session indicators).

---

### D-12: Common Page-Layout and Interaction Grammar

**Discovery:** Surfaces should share layout conventions, typographic hierarchy, interaction patterns (drawers, modals, progressive disclosure), and information density norms — not because of aesthetic consistency but because the operator's cognitive model of "how Wheelwright works" should be portable across surfaces.

**Owning primitive(s):** Operator Surfaces. This is not a primitive in the baseline inventory — it's a design-system concern that serves the Cognitive Role Architecture. The operator should not context-switch cognitive models when moving between surfaces.

**Boundary coherence:** Not a boundary concern per se. It's a coherence concern — ensuring that the application's visual/interaction language reinforces rather than contradicts its architectural boundaries.

**Already anticipated?** Partially. ADR-009 (Numbers-First Typography) and ADR-010 (Centralized Theme Tokens) establish shared design language at the CSS level. The progressive-learning concept system (`src/concepts/`) creates shared explanatory content. But no document names a "design grammar" or "interaction pattern library" as an architectural concern.

**Classification:** **Implementation work with light architectural acknowledgment needed.** The architectural principle exists (Cognitive Role Separation requires that surfaces be coherent within their role). The implementation requires a shared layout/interaction system. Whether this merits an ADR or is adequately served by existing theme-token infrastructure is a judgment call.

---

### D-13: Continuity of Operator Context Across Surface Transitions

**Discovery:** When the operator moves from Console to Write Desk (or future deployment surface), the transition should carry context: which symbol was inspected, which DTE range was relevant, what situation was active, what the operator was attending to.

**Owning primitive(s):** Operator Surfaces — specifically ADR-012's "Action Transition" concept. Also touches Situation/Mission (the situation persists across navigation) and Portfolio Context (the portfolio snapshot is continuous).

**Boundary coherence:** Introduces a new concern: **transition state**. Currently, application state is either:
- Application-scoped and always available (portfolio, evidence, situation) — these survive navigation automatically.
- Surface-local and lost on navigation (selected tile, expanded rung, filter settings).

The new concern is: **surface-local state that should survive a specific transition** (e.g., "I clicked XLE on the Console; when I arrive at the deployment surface, XLE should be pre-selected"). This is neither fully application-scoped nor purely local — it's transitional.

**Already anticipated?** ADR-012 identifies "context-preserving transition" as a requirement and explicitly defers specification. The Console architecture §Action Transition: "The transition preserves context (active situation, relevant symbol, relevant DTE range)."

**Classification:** **Recognized requirement, unresolved design.** The architecture knows context must be preserved. The mechanism (URL params, ephemeral navigation state, application-level "attention" model) is not specified. This is a design decision waiting for implementation to inform it, per the explicit deferral.

---

### D-14: Coherent Operator Flow (Orientation → Deployment → Decision → Handoff → Production)

**Discovery:** The operator's workflow has a natural shape: assess portfolio state → identify deployment opportunities → select specific contracts → hand off to broker → later reconcile production. This flow should be architecturally legible, not a maze of independent pages.

**Owning primitive(s):** This discovery describes the *relationship between* multiple primitives in temporal sequence:
1. Position Monitoring + Portfolio Context → **Orientation** (Console)
2. Situation/Mission + Evidence + Policy → **Opportunity Assessment** (deployment surface)
3. Decision + Explanation → **Contract Selection** (recommendation + brief)
4. Broker Handoff → **Execution**
5. Portfolio Context (updated) → **Production Reconciliation**

**Boundary coherence:** The flow does not violate boundaries — it traverses them in sequence. Each step respects its own scope. The question is whether the architecture makes this traversal legible and efficient.

**Already anticipated?** Implicitly. The Four Engines describe a logical progression (Evidence → Policy → Decision → Explanation). The Situation Architecture describes a top-down reasoning chain (Situation → Mission → Outcomes → Envelope → Greek Profile → Selection). ADR-012 introduces Console as the starting point with transitions to other capabilities. But no document explicitly maps the full operator workflow as a first-class architectural concept.

**Classification:** **Architectural extension (mild).** The individual stages are well-defined. The flow connecting them is implicit but not named. Naming it would serve as an architectural organizing principle for navigation, context preservation, and surface boundaries — without changing any individual primitive.

---

### D-15: Terminology / Surface-Boundary Cleanup

**Discovery:** "Write Desk" is the legacy name for what is now two distinct surfaces (Console + deployment/recommendation workbench). The code still uses `WriteDesk.tsx`, `src/write-desk/`, `wd-*` CSS classes. ADR-002 ratified "Wheelwright" as the recommendation craftsmanship layer, but the product surface naming hasn't followed.

**Owning primitive(s):** Operator Surfaces. PL-OPS-07 explicitly identifies this as a mechanical refactor with no architectural decisions required.

**Boundary coherence:** Not a boundary concern — it's a naming/identity concern. However, continuing to use "Write Desk" for both the overall product and a specific surface creates ambiguity that *obscures* the boundary between Console (orientation) and Wheelwright workbench (action).

**Already anticipated?** Yes. PL-OPS-07 documents the scope: rename to Wheelwright vocabulary, zero behavioral changes, dedicated commit. ADR-002 established the naming convention.

**Classification:** **Identified implementation work (mechanical refactor).** No architectural decision needed beyond what already exists in ADR-002 and PL-OPS-07. But sequencing matters — do this after the architecture settles so the new names reflect the final surface topology.

---

### D-16: Avoiding Duplicated Page-Local State for Application-Scoped Concepts

**Discovery:** Concepts that are architecturally application-scoped (portfolio, evidence, situation, session state) must not be independently owned or re-derived by individual surfaces, as this creates drift, duplication, and inconsistency.

**Owning primitive(s):** This is a direct consequence of ADR-011's core decision: "Portfolio ingestion belongs to Wheelwright, not to an individual page or surface." The same logic applies to evidence state, situation, and session validity.

**Boundary coherence:** This *is* a boundary — between application-scoped state and surface-local state. The baseline inventory §9 (Transitional Boundaries) identifies portfolio context and recommendation engine location as transitional. This discovery argues that the boundary between application-scoped and surface-local needs to be explicit and consistently enforced.

**Already anticipated?** Yes, for portfolio (ADR-011). Partially for evidence (observation-store is application-scoped). Not explicitly for situation (no implementation exists). Not explicitly for "which concepts are application-scoped" as a general principle — ADR-011 decided it for portfolio specifically.

**Classification:** **Architectural clarification needed.** The principle "application-scoped concepts must not be owned by individual surfaces" is implicit in ADR-011 but not generalized. A brief architectural statement clarifying which concepts are application-scoped would prevent future violations of this pattern.

---

## Cross-Discovery Synthesis

This section asks: what becomes visible only when the discoveries are considered together?

### Synthesis 1: The Application Shell Is an Architectural Primitive, Not a UX Detail

**Observation:** D-08 (header/shell), D-09 (navigation), D-10 (portfolio context), D-11 (evidence/session), D-13 (context continuity), D-14 (operator flow), and D-16 (no page-local duplication) all point to the same structural requirement: Wheelwright needs a first-class concept of a **shared application operating context** — a container that holds the concerns multiple surfaces need, provides consistent presentation of cross-cutting state, enables context-preserving navigation, and enforces the boundary between application-scoped and surface-local.

**Test against baseline:** The baseline inventory §2.8 lists "Operator Surfaces" as a primitive, defined as "how the system presents itself to the operator." But it describes surfaces as *things* (Console, Write Desk) rather than their *shared container*. ADR-011 and ADR-012 together logically require the container but never name it.

**Finding:** The baseline is missing a primitive — or more precisely, the existing Operator Surfaces primitive needs explicit decomposition into:

1. **Application Shell** — the shared container providing: navigation, application-scoped state visibility (portfolio provenance, evidence/session, situation), layout grammar, and transition mechanics.
2. **Functional Surfaces** — the individually-scoped areas (Console, Deployment/Recommendation, Production, future surfaces) that plug into the shell and own their local concerns.

This is not a dramatic architectural change. It's making explicit what ADR-011 and ADR-012 already require implicitly. But naming it matters because without the name, implementation keeps recreating page-local versions of application concerns (which is exactly the anti-pattern ADR-011 rejected for portfolio).

**Classification: Extended.** The Operator Surfaces primitive needs decomposition. No boundary changes. No invariant violations.

---

### Synthesis 2: The Operator's Question Is Deployment, Not Strategy

**Observation:** D-01 (buy-write), D-02 (cross-entry), D-03 (unified deployment surface), and D-14 (operator flow) converge on a single insight: the operator's operational question is not "what put should I write?" or "what call should I sell?" — it's "given my portfolio, capital, evidence, and mission, what productive actions are available now?"

Puts, covered calls, and buy-writes are all answers to *that* question. The current architecture separates them because the recommendation engines were built independently. But architecturally, the Decision Engine's output (per the Four Engines) is "Given policy results, what is recommended?" — not "What put is recommended?" and separately "What call is recommended?"

**Test against baseline:** The Four Engines decomposition describes a single Decision Engine. The Situation Architecture explicitly anticipates a unified surface. The Regime Objective Function names multiple entry mechanisms serving the same mission. But the current primary architecture document (`07-architecture-current.md`) describes `recommendPuts()` and `recommendCalls()` as separate engines with separate sections.

**Finding:** The Four Engines already accommodate this. The Decision Engine conceptually produces "ranked candidates" — it does not inherently require strategy-separated outputs. The current implementation's separation is an artifact, not an architectural necessity. What's missing is:

- A **composition concern** above individual recommendation engines that assembles their outputs into a mission-relevant deployment view.
- A **Deployment Opportunity** object that normalizes the output of different engines into a common shape suitable for cross-strategy comparison and mission-aware prioritization.

These are the "Deployment Opportunity" concept already identified as an open question in the Regime Objective Function (§Open Questions #8) and the "Unified Recommendation Surface" already anticipated by the Situation Architecture.

**Classification: Extended (anticipated).** The architecture points toward this. It's an extension that fulfills existing direction rather than contradicting it.

---

### Synthesis 3: Situation Shapes the Entire Application, Not Just Recommendations

**Observation:** D-03 (unified deployment), D-06 (assignment economics), D-11 (evidence/session relevance), D-13 (context continuity), and D-14 (operator flow) together reveal that Situation/Mission is not merely a recommendation-shaping input. It shapes:

- What the Console shows as "important" (Decision Pressure thresholds may be situation-aware)
- How Economic Consequence is interpreted ("serves the mission" vs "undermines it")
- What the deployment surface prioritizes (mission gap → urgency of production)
- How the Brief frames explanations (situational terms, not generic metrics)
- How production is assessed against targets (monthly gap, bridge progress)

**Test against baseline:** The Situation Architecture §Relationship to Existing Architecture correctly identifies that recommendation engine, explanation, operator console, and policy configuration are all situation-informed. But the baseline inventory §2.6 positions Situation/Mission as a single primitive alongside the others, rather than as a cross-cutting concern that shapes the behavior of multiple other primitives.

**Finding:** The Situation is architecturally more like a lens or operating mode than a peer primitive. It doesn't own data the way Evidence does. It doesn't produce output the way Decision does. It provides **context that shapes how other primitives behave and present themselves.** This is already how it's described in the Situation Architecture document ("A situation contributes: context, constraints, optimization priorities, explanation framing"). But its architectural role is closer to "active operating context" than "one of nine primitives."

**Classification: Reframed.** Situation is not wrong in the baseline. But its nature is cross-cutting rather than parallel. The reconciliation suggests it belongs in the Application Shell as the active operating context that every surface references, rather than as a page-level input to the recommendation engine alone. This aligns perfectly with Synthesis 1 (application shell holds cross-cutting state).

---

### Synthesis 4: Both Discovery Categories Are the Same Maturation

**Observation:** The domain discoveries (buy-write, cross-entry, unified deployment, opportunity observation) and the application-shell discoveries (header, navigation, shared context, flow) are not two independent cleanup tracks. They are both consequences of the same thing:

**Wheelwright has evolved from independently developed feature surfaces into a coherent portfolio-operations application.**

The domain discoveries express this as: "we need unified deployment reasoning, not separate strategy pages."
The shell discoveries express this as: "we need unified application context, not separate page-local state."

These are the same architectural maturation seen from different angles. The domain side asks "what should the application *reason* about?" The shell side asks "what should the application *look like structurally*?" Both answers converge: a coherent application with a mission-aware operating context, cross-cutting shared state, unified deployment reasoning, and context-preserving navigation between specialized functional areas.

**Test against baseline:** The baseline inventory was extracted from documents written when the surfaces were being designed independently (Console, Write Desk, Production). The ADRs acknowledge application scope (ADR-011, ADR-012) but were written as transitions from page-local to application-scoped. The full picture — where application coherence is the default and page-local is the exception — is the maturation these discoveries reveal.

**Classification:** This synthesis does not identify a new primitive or boundary. It identifies the **developmental stage** Wheelwright has reached: the point where the existing architectural primitives, correctly applied, produce a coherent application rather than a collection of related pages. The architecture is right. The documentation, naming, implementation structure, and surface boundaries need to catch up.

---

## Architectural Findings

Each finding is classified as: **Confirmed** (architecture is correct and current), **Extended** (architecture is correct but needs explicit addition), **Reframed** (architecture is correct but the characterization should change), **Gap** (something is missing that should exist), or **Superseded** (something in the documentation has been overtaken by reality).

### Confirmed

| # | Finding | Evidence |
|---|---------|----------|
| F-01 | The Four Engines (Evidence, Policy, Decision, Explanation) accommodate all domain discoveries without modification | D-01 through D-07 all map to existing engines |
| F-02 | All invariants remain valid and are not challenged by any discovery | No discovery violates evidence, recommendation, governance, or publication invariants |
| F-03 | All boundaries remain coherent | Evidence ≠ Recommendation, Observation ≠ Interpretation, Recommendation ≠ Execution, etc. — all hold |
| F-04 | The governing principles accommodate all discoveries | Policy over Prediction, Preserve Optionality, Epistemic Integrity — none are challenged |
| F-05 | ADR-011 (application-scoped portfolio) is confirmed by operational use | D-10, D-16 validate the decision |
| F-06 | ADR-012 (Console as home surface, context-preserving transition) is confirmed | D-09, D-13, D-14 validate the decision |
| F-07 | ADR-013 (Position Monitoring decomposition) accommodates assignment economics | D-06 is precisely what ADR-013 was designed for |
| F-08 | The Situation Architecture correctly anticipates unified deployment and mission-aware reasoning | D-03, D-07 validate the direction without requiring changes |
| F-09 | Buy-write is architecturally parallel to existing recommendation engines | D-01 fits Decision Engine with no structural modification |
| F-10 | Cross-entry multi-path is an emergent phenomenon, not architectural pressure | D-02 requires no architectural response |
| F-11 | Governance catalog gap is a data defect, not architectural | D-05 |

### Extended

| # | Finding | What needs adding | Impact |
|---|---------|-------------------|--------|
| F-12 | Operator Surfaces needs decomposition into Application Shell + Functional Surfaces | Name and specify the shared container that ADR-011 and ADR-012 already require | Low — makes implicit requirement explicit |
| F-13 | A composition concern ("Deployment Opportunity" or equivalent) above individual recommendation engines | Assembles strategy-specific candidates into mission-aware deployment view | Medium — new concept, but anticipated by Situation Architecture and Regime Objective Function |
| F-14 | The set of application-scoped concepts needs explicit enumeration | Portfolio, evidence/session, situation, navigation state — generalize ADR-011's pattern | Low — clarification of existing pattern |
| F-15 | The primary architecture document needs to reflect buy-write as a recognized recommendation path | `07-architecture-current.md` currently describes only puts and calls | Low — documentation catch-up |
| F-16 | The primary architecture document needs to reflect the operating regime and mission concept | Currently absent from `07-architecture-current.md` | Low — documentation catch-up |

### Reframed

| # | Finding | From → To |
|---|---------|-----------|
| F-17 | Situation/Mission is better understood as a cross-cutting operating context than as a peer primitive | Peer of Evidence, Portfolio, etc. → Active lens/context within the Application Shell that shapes how all other primitives behave |
| F-18 | The operator flow (orientation → deployment → decision → handoff → production) is better understood as the natural traversal of the Four Engines under situation context than as a separate architectural concept | "Navigation design problem" → "The Four Engines have a natural temporal sequence from the operator's perspective" |

### Gap

| # | Finding | What's missing | Severity |
|---|---------|---------------|----------|
| F-19 | No architectural concept for "transition state" (context that is neither application-scoped nor purely surface-local but must survive one specific navigation) | Mechanism for preserving transient operator intent across surface boundaries | Low — design decision, not architectural crisis |
| F-20 | The operator's workflow as a complete cycle (orient → assess → select → execute → reconcile → orient) is nowhere explicitly named as an architectural organizing principle | The cycle exists implicitly across ADRs and situation architecture but has no home | Low — naming and documentation |

### Superseded

| # | Finding | What's overtaken | By what |
|---|---------|-----------------|---------|
| F-21 | The charter's characterization of Wheelwright as "an evaluation and screening tool" | `00-project-charter.md` opening paragraphs | System identity in `07-architecture-current.md`, Evidence Appliance foundation |
| F-22 | The charter's "not a portfolio manager" framing | `00-project-charter.md` first paragraph | ADR-011 (application-scoped portfolio), ADR-012 (Console monitors portfolio state), ADR-013 (position monitoring decomposition) — the system actively manages portfolio awareness |
| F-23 | The separate puts/calls architecture as a permanent structural commitment | `07-architecture-current.md` §Recommendation Engines describes them as separate engines | Situation Architecture's "Unified Recommendation Surface" and Regime Objective Function's shared-mission framing already anticipate convergence |
| F-24 | Lab surfaces as operator-facing product destinations | 12 Lab tabs in App.tsx under `/labs` | Operational surfaces (Console, Write Desk, Production) have absorbed or superseded all Lab concepts; remaining utility is engineering/debug |
| F-25 | The current 15-surface route inventory as the basis for application-shell design | Root.tsx (3 operational) + App.tsx (12 labs) = 15 navigable surfaces | The coherent application is 4 operational surfaces + a subordinate engineering area; shell design should target the end state, not normalize the current inventory |

---

## Summary Assessment

### The hypothesis: "the architecture accommodates the discoveries"

**Verdict: Confirmed, with mild extension needed.**

No discovery violates an existing boundary, invariant, or principle. No discovery requires removing or contradicting an existing ADR. The Four Engines, the governing principles, and the separation contracts all hold.

What the reconciliation reveals is:

1. **One missing structural concept** (Application Shell / shared operating context) that is already logically required by ADR-011 + ADR-012 but never named.
2. **One anticipated composition concept** (Deployment Opportunity / unified surface) that fulfills existing architectural direction (Situation Architecture, Regime Objective Function) without contradicting anything.
3. **One reframing** of Situation/Mission from peer-primitive to cross-cutting operating context — which is actually how the Situation Architecture already describes it; the baseline inventory just positioned it as parallel rather than cross-cutting.
4. **Documentation drift** in the primary architecture document, which hasn't absorbed buy-write, operating regime, or the application-coherence implications of its own ADRs.
5. **Naming/terminology debt** where "Write Desk" vocabulary obscures the evolved surface topology.
6. **A vestigial product surface layer** (12 Lab UIs) whose concepts have been absorbed into the operational architecture but whose dedicated interfaces remain, creating navigation clutter, maintenance burden, drift risk, and product confusion. The coherent application is 4 operational surfaces, not 15.
7. **One unrealized capability** (Velvet Rope / governance) that exists only as Lab scaffolding and should migrate into the operational architecture as the Governor surface.

The architecture has outrun its documentation. The documentation has not outrun the architecture. And the product surface inventory has not caught up with the architecture's maturation — it still exposes the development journey as navigation structure.

---

## Documentation Consequences (Deferred — Noted for Sequencing)

These follow from the findings but should not be executed until the reconciliation is ratified.

1. `07-architecture-current.md` — absorb buy-write, name operating regime, acknowledge application shell, note unified deployment as architectural direction, reflect 4-surface product topology
2. New ADR or architecture section — Application Shell: enumerate application-scoped concepts, define shell vs functional-surface boundary, identify the 4 operational surfaces
3. `00-project-charter.md` — demote to historical origin document; stop treating it as living definition
4. `25-situation-architecture.md` — minor: acknowledge situation's cross-cutting nature explicitly (it already describes this; a clarifying sentence suffices)
5. Parking lot reconciliation — apply the retain/reframe/merge/supersede/promote/delete rubric (separate exercise)
6. Document authority map — formalize which docs are authoritative, historical, or superseded
7. Lab retirement plan — sequence the removal/migration of Lab surfaces: remove 4 spike UIs immediately, supersede 4 Labs by confirming operational coverage, migrate Velvet Rope into operational architecture, establish engineering/debug boundary for retained tooling
8. Route/navigation architecture — design the operational surface topology and transitions (4 surfaces + engineering area) before implementing the application shell

---

## Backlog Reconciliation Criteria

For the parking-lot pass that follows this reconciliation:

| Disposition | Definition | Criteria |
|-------------|-----------|----------|
| **Retain** | Item remains valid and open under the reconciled architecture | The concern exists, is not addressed, and fits within confirmed/extended architecture |
| **Reframe** | The concern is real but the articulation uses obsolete vocabulary or framing | Update description to reflect reconciled understanding (e.g., "Write Desk" → Wheelwright surface) |
| **Merge** | Two or more items describe the same underlying concern from different angles | Combine into one item with richer description |
| **Supersede** | A newer architectural concept or decision has swallowed this item | Link to the superseding concept; move to graduated/closed |
| **Promote** | Item is no longer backlog — it's now ratified architecture or a recognized architectural requirement | Move to ADR, architecture doc, or foundation |
| **Delete** | Item represents noise, was never a real requirement, or has been resolved without explicit documentation | Record disposition; remove from active list |

---

*This document is analysis. It does not propose implementation priorities or change existing architecture documents. The next step is ratification by the Principal, followed by parking-lot reconciliation and documentation topology cleanup.*

## Category C: Lab Surface Reconciliation

### Current Surface Inventory

The application has two routing worlds:

**Operational surfaces** (Root.tsx, path-based):
- `/` — Operator Console (home)
- `/app/write` — Write Desk (recommendation + execution)
- `/app/production` — Cash Production assessment

**Lab surfaces** (App.tsx at `/labs`, tab-based):
- Laboratory — Interactive delta probe with engineering fixtures
- Options Chain — Reference data view (Fidelity XLE fixture)
- Recommendation Lab — Single-symbol contract evaluation
- Opportunity Lab — Multi-symbol opportunity radar
- Universe — Universe view
- CSV Import Lab — Fidelity CSV parsing and classification
- Scenario Replay — Document-driven state transition laboratory
- ETF Catalog — API Ninjas catalog exploration
- Velvet Rope — Single-symbol admission evaluation
- SEC Explorer — SEC filing exploration
- FMP Explorer — FMP API exploration
- Massive API — Polygon.io API spike

**Hypothesis under test:** The Labs were valuable discovery scaffolding. Their concepts survived and became part of Wheelwright's architecture, but their dedicated user-facing UI has become vestigial.

---

### Per-Lab Reconciliation

#### Laboratory (Interactive Delta Probe)

**Original purpose:** Validate delta-matching logic interactively. Demonstrate that the reasoning subsystem (types, calculations, policy, delta matching) works correctly against engineering fixtures. Make the system's reasoning observable before end-user features existed.

**Does the concept still exist?** Yes — delta matching, policy application, and decision explanation are core architectural capabilities.

**Where does it now live?** The Write Desk applies delta matching to 1,286 real symbols with live evidence. The recommendation brief explains contract selection including delta fit and neighborhood context. Decision explanation is a first-class architectural engine.

**Is it already represented operationally?** Yes — completely. Every recommendation in the Write Desk demonstrates the same logic that the Laboratory probe demonstrated against fixtures, but against real evidence with real policy.

**Does retaining it create burden?** Yes — it imports engineering fixtures (`probeData.ts`), maintains its own contract table, decision narrative component, and metrics display that duplicate concepts in the operational surfaces. The decision narrative logic is independently maintained.

**Would removing it lose capability?** No operationally relevant capability. The engineering fixtures remain useful for unit tests but not as a user-facing probe.

**Classification: Superseded.** The operational recommendation surface demonstrates everything the Laboratory once proved, with more data, richer explanation, and real evidence. The engineering fixtures serve tests, not UI.

---

#### Options Chain (Reference Data View)

**Original purpose:** Display the XLE reference fixture in a traditional options-chain format. Validate that the domain model could represent observed market data faithfully.

**Does the concept still exist?** Yes — options chain evidence is the primary data the Evidence Engine maintains.

**Where does it now live?** The Write Desk's recommendation tables display chain-derived data for 1,286 symbols. The recommendation brief shows strike neighborhood (adjacent contracts). The backend maintains chain evidence in SQLite.

**Is it already represented operationally?** Partially — the operational surface doesn't render a traditional "options chain" (all strikes for one symbol). It renders policy-filtered candidates. The full-chain view was an engineering artifact, not an operator need.

**Does retaining it create burden?** Minimal — it's a simple table rendering static fixture data. But it represents a view of the system (raw chain inspection) that has no operator use case.

**Would removing it lose capability?** The ability to inspect a full options chain for one symbol is not currently available in any operational surface. However, this is traditionally available at the broker (Fidelity) and the operator has no stated need for Wheelwright to replicate it.

**Classification: Superseded.** Raw chain inspection is a broker capability. Wheelwright's value is the policy-filtered, ranked, explained recommendation — not a chain table. If chain inspection were needed for debugging, it would belong behind an engineering/debug surface.

---

#### Recommendation Lab

**Original purpose:** Evaluate a single symbol's put/call chain against recommendation policy. The "microscope" — deep evaluation of one symbol.

**Does the concept still exist?** Yes — this is the core function of the Decision Engine.

**Where does it now live?** The Write Desk evaluates the entire universe and produces ranked recommendations. The recommendation brief provides deep single-symbol explanation. The put drawer includes Projected Call Surface (conditioned operating opportunity).

**Is it already represented operationally?** Yes — completely. The Write Desk is the mature version of the Recommendation Lab applied at scale. The brief is the mature version of single-symbol deep evaluation.

**Does retaining it create burden?** Significant. The Recommendation Lab maintains its own provider interaction, policy controls, portfolio context, and rendering — all independently of the operational surface. It represents a parallel recommendation pipeline that can drift from the authoritative one (the yield-suppression bug manifested in multiple places because of this duplication).

**Would removing it lose capability?** No. Every capability is available in the operational Write Desk with richer evidence and better explanation.

**Classification: Superseded.** The Write Desk + recommendation brief is the Recommendation Lab's mature descendant. The Lab's continued existence creates maintenance burden and policy-drift risk.

---

#### Opportunity Lab

**Original purpose:** Scan a curated universe to answer "where should I look next?" The "radar" — broad, shallow evaluation across multiple symbols.

**Does the concept still exist?** Yes — universe-wide opportunity scanning is core to the recommendation engine.

**Where does it now live?** `recommendPuts()` evaluates 1,286 symbols. `recommendCalls()` evaluates held inventory. The buy-write analysis evaluates the call side for the full universe. The Write Desk displays the results as ranked candidate tables with funnel reduction.

**Is it already represented operationally?** Yes — completely. The operational recommendation surface is the Opportunity Lab's mature descendant operating at full universe scale with tiered scheduling, background acquisition, and continuous evidence maintenance.

**Does retaining it create burden?** Yes — it maintains its own provider interaction, evaluation logic (`evaluateSymbol`, `classifyOpportunity`), and rendering. It evaluates against the old curated 15-symbol universe rather than the canonical 1,286-symbol universe.

**Would removing it lose capability?** No. The Write Desk recommendation surface provides strictly more capability (larger universe, richer policy, continuous evidence, ranked output with explanation).

**Classification: Superseded.** The operational recommendation surface, powered by the Evidence Appliance's continuous acquisition, is the Opportunity Lab's successor at production scale.

---

#### Universe View

**Original purpose:** Display the canonical ETF universe (1,286 symbols from Yahoo merged list).

**Does the concept still exist?** Yes — the candidate universe is a first-class concept.

**Where does it now live?** The backend imports and maintains the universe in SQLite. The Write Desk funnel infographic shows universe → eligible → admissible → ranked reduction. The Velvet Rope design addresses universe admission.

**Is it already represented operationally?** Partially — the funnel shows the universe's effect on recommendations but doesn't provide a browsable universe list.

**Does retaining it create burden?** Minimal — it's a rendering of seed data.

**Would removing it lose capability?** The ability to browse the full universe list would be lost from the UI. This may be useful for debugging/exploration but is not an operator workflow need.

**Classification: Retain only as engineering/debug tooling.** Universe browsing has no operational purpose but may be useful for catalog maintenance and governance review. It belongs behind a developer surface, not in operator navigation.

---

#### CSV Import Lab

**Original purpose:** Validate Fidelity CSV parsing (Option Summary, Positions, Activity History). Demonstrate document classification and field extraction.

**Does the concept still exist?** Yes — Fidelity CSV import is how the operator provides portfolio context.

**Where does it now live?** The Write Desk contains portfolio import controls. The Production view accepts Activity History CSV. The portfolio-store (ADR-011) manages parsed state application-wide.

**Is it already represented operationally?** Yes — CSV import is integrated into the operational surfaces. The Write Desk imports Option Summary + Positions. Production imports Activity History.

**Does retaining it create burden?** Moderate — it maintains independent parsing UI, validation display, and document classification demonstration that duplicate operational import flows.

**Would removing it lose capability?** The detailed parsing diagnostics (field-by-field extraction visibility, classification decision display) would be lost. These are engineering concerns, not operator needs.

**Classification: Migrate engineering diagnostics to debug surface; remove user-facing Lab.** The operational import flows in Write Desk and Production are the mature implementations. Parsing diagnostics, if needed, belong in developer tooling.

---

#### Scenario Replay

**Original purpose:** Document-driven state transition laboratory for overlay lifecycle observation. Takes activity documents and replays state transitions.

**Does the concept still exist?** Yes — lifecycle observation and state transitions remain important concepts (PL-EVID-02, PL-EXEC-01).

**Where does it now live?** The Production view performs actual lifecycle accounting from real Activity History. The Console's position monitoring (ADR-013) observes current position state. Economic Consequence computes assignment outcomes.

**Is it already represented operationally?** Partially. Production accounting handles realized lifecycle events. Position monitoring handles current state. What's missing is the *replay/simulation* aspect — observing hypothetical state transitions. However, this is exploratory functionality that has never been prioritized beyond the journal-level prototype.

**Does retaining it create burden?** Moderate — it maintains its own state-transition logic and rendering that may not align with current domain model evolution.

**Would removing it lose capability?** The ability to simulate overlay lifecycle transitions from documents would be lost. This is a research/exploration capability, not an operational one.

**Classification: Retain only as engineering/debug tooling (exploratory research).** Scenario replay is a research instrument, not an operational surface. If retained, it belongs behind a developer/research boundary.

---

#### ETF Catalog Explorer

**Original purpose:** Explore API Ninjas ETF catalog data. Engineering spike validation.

**Does the concept still exist?** Marginally — API Ninjas was evaluated and found inadequate for the free tier. The spike served its purpose (retire integration risk).

**Where does it now live?** The spike findings are documented in `docs/engineering-spikes/api-ninjas-etf-catalog.md`. No operational use of API Ninjas exists.

**Does retaining it create burden?** Low in isolation, but it occupies navigation space for a provider that produced no operational value.

**Would removing it lose capability?** No. The spike's value was the knowledge it produced, which is documented. The UI adds nothing.

**Classification: Remove.** Engineering spike UI with zero operational purpose. The documented findings in `docs/engineering-spikes/` preserve the learning.

---

#### Velvet Rope

**Original purpose:** Single-symbol admission evaluation against institutional policy. Demonstrate whether an ETF's options market satisfies operational requirements.

**Does the concept still exist?** Yes — universe admission and governance are active architectural concerns (PL-RESEARCH-02, PL-ARCH-01).

**Where does it now live?** The concept is designed (docs) but the Lab is its only implementation. It is not integrated into the operational recommendation flow.

**Is it already represented operationally?** No — Velvet Rope evaluation is not accessible from any operational surface. The Write Desk does not perform admission gating. The product-structure heuristic and governance catalog provide partial coverage but not the full evidence-based evaluation the Velvet Rope Lab demonstrates.

**Does retaining it create burden?** Moderate — it uses its own provider interaction, localStorage persistence, and evaluation pipeline independent of the backend.

**Would removing it lose capability?** Yes — it would remove the only UI for executing and inspecting admission evaluations.

**Classification: Retain, but migrate into operational architecture.** Velvet Rope is not a "Lab" — it's an unrealized architectural capability (Governor role, per Cognitive Role Separation) that happens to be implemented only as a lab prototype. Its proper destination is either integration into the operational recommendation flow (as a governance gate) or a dedicated governance surface within the coherent application. It should not remain under `/labs` as if it were scaffolding.

---

#### SEC Explorer

**Original purpose:** Explore SEC EDGAR filings for ETF reference data and structural classification.

**Does the concept still exist?** Marginally — SEC data was identified as a potential reference-data source but no operational use was built.

**Where does it now live?** The exploration findings inform the universe-management design direction but have no runtime representation.

**Does retaining it create burden?** Low in isolation. Occupies navigation for an unused data source.

**Would removing it lose capability?** No operationally relevant capability. SEC exploration can be performed with external tools when needed.

**Classification: Remove.** Research spike UI. Documented learnings exist in design documents.

---

#### FMP Explorer

**Original purpose:** Explore Financial Modeling Prep API for ETF reference data (ticker search, profile, institutional holdings).

**Does the concept still exist?** Marginally — FMP was evaluated as a potential catalog-enrichment source.

**Where does it now live?** Findings documented in `docs/engineering-spikes/fmp-etf-reference-data.md`.

**Does retaining it create burden?** Low in isolation. Occupies navigation for an unused data source.

**Would removing it lose capability?** No operationally relevant capability.

**Classification: Remove.** Research spike UI. Documented learnings exist.

---

#### Massive API (Polygon.io)

**Original purpose:** Validate Polygon.io options API integration. Engineering spike for provider feasibility.

**Does the concept still exist?** No — the Tradier provider was selected. Polygon.io (Massive) is unused.

**Where does it now live?** The spike findings are documented in the journal. No operational integration exists.

**Does retaining it create burden?** Low in isolation. Occupies navigation for an abandoned provider.

**Would removing it lose capability?** No.

**Classification: Remove.** Provider spike UI. The spike served its purpose (retired CORS/auth risk). Documented in journal.

---

### Lab Reconciliation Summary

| Lab Surface | Classification | Rationale |
|-------------|---------------|-----------|
| Laboratory (Delta Probe) | **Superseded** | Operational recommendation surface demonstrates everything with real data |
| Options Chain | **Superseded** | Raw chain inspection is a broker capability; Wheelwright adds policy-filtered value |
| Recommendation Lab | **Superseded** | Write Desk + brief is the mature descendant; Lab creates drift risk |
| Opportunity Lab | **Superseded** | Operational recommendation at full universe scale; Lab uses obsolete 15-symbol universe |
| Universe View | **Engineering/debug only** | Useful for catalog maintenance; not an operator concern |
| CSV Import Lab | **Migrate diagnostics; remove Lab** | Operational import exists; parsing details are engineering |
| Scenario Replay | **Engineering/debug only** | Research instrument for lifecycle simulation; not operational |
| ETF Catalog Explorer | **Remove** | Spike UI for inadequate provider; learnings documented |
| Velvet Rope | **Migrate into operational architecture** | Unrealized Governor capability; not scaffolding |
| SEC Explorer | **Remove** | Research spike UI; learnings documented |
| FMP Explorer | **Remove** | Research spike UI; learnings documented |
| Massive API | **Remove** | Provider spike UI for abandoned provider |

### Synthesis: What Survives as Operational

From 12 Lab surfaces:
- **0** retain as operator-facing Labs
- **1** migrates into operational architecture as a first-class capability (Velvet Rope → governance surface)
- **2** retained as engineering/debug tooling behind a subordinate boundary (Universe View, Scenario Replay)
- **2** have engineering diagnostics worth preserving behind a debug surface (CSV parsing, universe browse)
- **4** are cleanly removable (ETF Catalog, SEC Explorer, FMP Explorer, Massive API)
- **4** are superseded by operational surfaces (Laboratory, Options Chain, Recommendation Lab, Opportunity Lab)

### Implication for Application Shell / Navigation

The desired coherent Wheelwright application consists of:

**Operational surfaces (operator-facing):**
1. Operator Console (orientation, monitoring, capacity)
2. Deployment / Recommendation surface (opportunity assessment, contract selection, execution handoff)
3. Production (reconciliation, accounting)
4. Governance (Velvet Rope matured — admission, registry, audit)

**Engineering surface (developer-facing, deliberately subordinate):**
- Universe browser
- Scenario replay (research)
- Parsing diagnostics
- Backend telemetry / scheduler status

**Removed entirely:**
- All provider spike UIs (ETF Catalog, SEC, FMP, Massive)
- All superseded Labs (Laboratory, Options Chain, Recommendation Lab, Opportunity Lab)

The application shell wraps the operational surfaces. Engineering tools are accessible but not part of the operator's mental model or navigation.

---

### Finding: Labs as Vestigial Product Surfaces

**Classification: Confirmed (superseded).**

The hypothesis holds. The Labs were valuable discovery scaffolding. Their concepts — observability, explainability, controlled evidence inspection, decision traces, policy transparency — are now embedded in the operational architecture (Explanation Engine, recommendation brief, position monitoring, evidence provenance, policy-governed recommendation). The dedicated Lab UIs have become:

- Navigation clutter (12 tabs for capabilities the operator accesses elsewhere)
- Maintenance burden (parallel recommendation/evaluation pipelines that can drift)
- Product confusion (exposing development history as navigation structure)
- Architectural debt (implementations that predate and may contradict current architectural decisions)

The concepts survived. The scaffolding should be retired.

This finding feeds directly into Synthesis 1 (Application Shell). The application shell should not be designed to accommodate the current 15-surface route inventory. It should be designed around the 4 operational surfaces that constitute Wheelwright as a coherent product, with engineering tools accessible separately.
