# Project Parking Lot

> The unprioritized roadmap. Every unfinished idea has a stable ID and explicit disposition. Nothing silently disappears.

**Last reviewed:** August 20, 2026 (BW economic investigation: lot-pairing defect and execution-drift annotations added to PL-PORT-01 and PL-EXEC-01)

---

## Intake Discipline

1. New ideas receive a stable ID immediately.
2. Merges preserve explicit mapping from the original concept.
3. Nothing is removed without a recorded disposition.
4. No priority field. Sequence is determined by active project threads, not by row order.

---

## Active Items

### Principal Decisions (Unresolved)

| ID | Name | Summary |
|---|---|---|
| `PL-ARCH-06` | Recommendation Engine Ownership | Whether recommendation logic moves to backend or remains browser-local. Transitional per Retooling Charter. Evaluate against: determinism, reproducibility, auditability, policy authority, multi-user, latency, operational simplicity. Dead-pipeline drift risk and Deployment Opportunity composition add pressure but do not force the answer. |
| `PL-GOV-EXPR` | Governance Operator Expression | Does the operator need direct inspection, intervention, override, or audit of governance decisions? Possible expressions: invisible policy, explanation in rejected opportunities, progressive disclosure, audit tooling, or a true workflow. Resolve when observed operator need demonstrates it. |

### Accepted Direction (Design/Implementation Needed)

| ID | Name | Summary | Concept Home |
|---|---|---|---|
| `PL-SHELL` | Application Coherence / Shell | Shared operating context, navigation, consistent evidence/session presentation, reactive recommendation trigger, context-preserving transitions, route topology (3 operational + engineering), vocabulary cleanup, Lab retirement. See `docs/32` §Application Coherence Initiative for sub-concerns. | Reconciliation F-12, ADR-011, ADR-012 |
| `PL-DEPLOY` | Deployment Opportunity / Unified Surface | Domain/composition concept within Decision: normalize strategy-specific candidates into mission-aware portfolio actions. Remaining work: normalized representation, cross-strategy comparability, generalized collateral, "wait" semantics, unified surface design. Decision-semantics refinement (August 2026): eligibility and acceptability prune; fitness ranks only survivors; relative superiority is insufficient — the best opportunity on a bad board may still be WAIT. Absolute deployment threshold concept: deployment should occur only when the best opportunity clears an absolute quality floor, not merely because it is the best available. This deepens the already-accepted Deployment Opportunity direction through Situation Architecture and Regime Objective Function, which already anticipate a unified "where should this capital go?" reasoning model. | Reconciliation F-13, Situation Architecture, Regime Objective Function, `foundations/strategy-expansion-governance.md` |
| `PL-CLEANUP` | Active Holistic Cleanup | Remove vestigial scaffolding, dead pipelines, obsolete vocabulary. Implement reconciled surface topology. Align documentation with architecture. Sequenced after Application Shell design establishes the target. Absorbs former PL-OPS-02, PL-OPS-05, and Lab retirement implementation. Scope is bounded to the current holistic-conformance initiative: documentation topology, Lab retirement, obsolete vocabulary, dead/duplicate structures, architectural conformance, and application-coherence work exposed by the August 2026 reconciliation. Not a permanent technical-debt bucket. | `docs/31`, `docs/32` |

### Implementation Work (Ratified Architecture)

| ID | Name | Summary | Concept Home |
|---|---|---|---|
| `PL-UX-01` | Console: Decision Pressure | Implement ADR-013 dimension 2 — resolution proximity as operational interpretation of approaching decision points. Threshold calibration and visual encoding remain design decisions. | `26-operator-console-architecture.md`, ADR-013 |
| `PL-UX-04` | Console: Progressive Hydration | Treemap tiles should color progressively per-symbol as evidence arrives rather than batch-appearing after full coverage. Console implementation detail. | `26-operator-console-architecture.md` |
| `PL-ELIG` | Deployment Eligibility / Capacity Explanation | Transparency of why actions are available or unavailable: held/encumbered/free shares, executable contracts, collateral, exclusion reasons. General capability; call inventory observability is one case. | Evolved from PL-CALL-04 |
| `PL-EVID-03` | Conditioned Operating Opportunity: EP2 | Second entry point (existing open short puts) for conditioned call-environment evaluation. Receives the "existing-position PCS" child from retired PL-CALL-01. | `foundations/conditioned-operating-opportunity.md` |
| `PL-PORT-01` | Portfolio-State Maturity | Assignment transitions, richer encumbrance state, multi-account support (depends on PL-ARCH-03), aggregation, stale-balance warnings. Economics slice implemented; broader maturity remains. **Lot-level basis attribution (Aug 2026 BW investigation):** The current `InventoryPosition` model aggregates at the symbol level with a single blended `averageCostPerShare`. For multi-lot symbols (BNO, GDXJ with 200 shares across 2 calls), the popup's call-away economics use this blended average rather than the lot-specific acquisition price paired with each call. This produces materially incorrect per-call appreciation/erosion figures. The recommendation engine is not affected (it uses chain-embedded price, not imported basis). The Console popup and any future consequence columns require lot-level attribution for correctness on multi-lot symbols. | `07-architecture-current.md` |
| `PL-PORT-02` | Production Accounting (remaining) | Distribution-character resolution, transferred-asset basis, persistence/multi-month, full audit-trail drill-down, lifecycle reconstruction. Current-month operational view implemented (ADR-014). Deferred B2 findings absorbed: historical-month presentation maturity (current/historical visual continuity, ~80% shared shape, positions that came and went during a period), In-Flight Positions density management and drill-down interaction, persistent/stale Production Uncertain lifecycle (operator acknowledgment, materiality handling, investigation of logical causes of persistent false uncertainty). These are valid deferred findings, not rejected ideas — deferred because they do not materially advance the near-term Forecast objective. | `/app/production`, engineering-spikes, ADR-014 |
| `PL-EXEC-01` | Trade Lifecycle Evolution | Full lifecycle beyond URL handoff: intended → submitted → working → filled → assigned → closed/rolled. Receives "call execution handoff" from retired PL-CALL-01. Connects to overlay strategy (roll/take-profit). **Execution-drift awareness (Aug 2026 BW investigation):** Wheelwright recommends buy-writes using chain-embedded Tradier prices (~15-min delayed). Actual Fidelity fills may occur at materially different prices. BNO example: recommendation saw price < $51, fill was $51.42, producing −$42 erosion at the $51 strike. The economic stakes are typically small relative to premium but create alarming popup displays. Future work: communicate breakeven fill price at recommendation time ("if shares fill above $X, equity leg produces erosion"); post-execution reconciliation when Activity evidence is available. | `src/execution/`, ADR-004 |
| `PL-GOV-01` | Governance Catalog Gap | Live catalog covers only 12 instruments. Name heuristic doesn't gate commodity/futures structure. Suspected gaps: UGA, DBC, CPER. Needs pipeline from 105-ticker validation to live catalog. Correctness defect in golden data. | `catalog-seed.json`, Governance correctness family |
| `PL-POL-04` | Policy Evolution / Governance Provenance | Full policy versioning, attribution, replay, inspectability, testability as complexity grows. Absorbs former PL-ARCH-04. | `07-architecture-current.md`, ADR-003, Governance provenance family |
| `PL-OPS-06` | Dead Pipeline Retirement | Remove `scanPuts()`, `scanCalls()`, `scanUniversePuts()` — zero runtime callers, duplicating live paths, creating drift risk. Active conformance/technical-debt work within the holistic cleanup. | Labs reconciliation |

### Unresolved Architectural Work

| ID | Name | Summary | Concept Home |
|---|---|---|---|
| `PL-EVID-07` | Multi-Expiration / Weekly-Aware Evidence Acquisition | **Resolved (August 21, 2026).** Wheelwright now acquires all eligible expirations within the 7–45 DTE window. The former `selectPrimaryExpiration()` heuristic (one chain nearest ~21 DTE) has been replaced by full-surface acquisition. **What was discovered:** A contemporaneous multi-expiration experiment across 64 weekly-capable symbols revealed that the ~21-DTE primary selection was systematically sampling a liquidity trough. The standard monthly expiration (28 DTE in the sample) had 44% ACTIONABLE+EDGE rate vs 8% at 21 DTE; median OI 1,152 vs 10. Liquidity topology (first hypothesized July 2026 from XLC) was validated at cohort scale — liquidity concentrates at standard monthly expirations and nearest weeklies, with intermediate weeklies often structurally untradeable. **Live validation:** With the full surface visible, Decision selected non-primary expirations for 5/5 tested liquid weekly symbols (DIA, GLD, SMH, SOXL, EEM). Execution score improved +12 to +57 points. Selection varied by symbol: SOXL→7 DTE, SMH/EEM→28 DTE, DIA/GLD→40 DTE. No new DTE fitness model was required — existing execution-quality ranking naturally finds the best part of each symbol's expiration surface. **Remaining optimization work (deferred):** Expiration viability persistence, liquidity topology characterization, selective maintenance of proven-viable expirations, scheduler optimization for multi-expiration refresh load. These optimize the capability but were not prerequisites for it. | `docs/21-primary-expiration-investigation.md` |
| `PL-PROD-MISSION` | Monthly Production Mission Primitive | **Implemented (ce849bb).** Operator-configured monthly production target stored in Workspace. Production surface displays target, remaining (target − produced), and calendar progress. This is one concrete operator constraint within Mission (Situation Architecture), not the primary expression of success. Mission discoverability defect identified and fix prepared (unconfigured state was invisible; visible affordance added). Live use also produced experiential evidence that the operator looks for growth-rate / qualified-growth objectives beyond the fixed monthly target — consistent with B1 finding that qualified growth is a plausible long-term objective requiring multi-month persistence. Future work: connect to deployment urgency and recommendation framing when Situation Architecture advances; richer Mission dimensions when multi-month infrastructure exists. | ADR-014, `ce849bb` |
| `PL-PROD-NET` | Net Strategy Result | **Resolved.** Net Strategy Result = OPTION_PREMIUM + REALIZED_APPRECIATION − CAPITAL_EROSION, scoped to the options strategy engine. Structural income (money-market, Treasury discount, dividends) is excluded because it is not a consequence of options strategy decisions. Production and Capital Erosion remain separately visible — Net Strategy Result is adjacent, never replacing them. Authoritative computation in backend ProductionAssessor; frontend is pass-through only. Future: month-over-month change in Net Strategy Result is the simplest first-order qualified-growth metric (requires multi-month persistence). | ADR-014, `ProductionAssessor.computeNetStrategyResult()` |
| `PL-PROD-FORECAST` | Production Forecasting Capability | **V1 implemented (c6191db). V2 exploration complete; implementation pending.** V1 provides Resolution Outlook (position classification: likely-expires-otm / likely-assigned / uncertain) + Production Outlook (recognized + likely consequence = rounded base estimate). Provisional parameters: 5 DTE / 3% moneyness. Live operation immediately exposed V1's scope limitation: terminates at current-position lifecycle boundary, cannot see prospective redeployment. V2 exploration discovered temporal quantization (strategy production is event-driven), dual-clock model (cycles vs months), and event-based forecast framing. Remaining V2 design: prospective-deployment-event estimate using recent comparable deployment productivity. Architecture: Operating Forecast scope ratified (143a075); Resolution Outlook named (ADR-013 amendment); ADR-014 Forecast semantics amended. See `docs/27-resolution-outlook-v1.md`, `docs/28-forecast-v2-exploration.md`. | ADR-014, Policy over Prediction §Operating Forecast, ADR-013 §Resolution Outlook |
| `PL-PROD-VALUE` | Portfolio Capital | **V1 derivation ratified (August 20, 2026).** `Portfolio Capital = Fidelity Total Account Value − aggregate short-option MTM`. Empirically verified: $118,960.23 = $116,300.23 − (−$2,660.00). Fidelity's Total already includes cash, SPAXX, equities, T-bills, and pending activity; Wheelwright applies one semantic correction (removing option liability from the capital-stock quantity). Three-CSV workflow preserved; no Positions/Holdings CSV dependency. **Ratified accounting semantics:** (1) Premium received increases Portfolio Capital when it becomes cash — intentional, do not offset with open short-option MTM. (2) Contributions increase Portfolio Capital; withdrawals decrease it. (3) Market appreciation of owned securities increases Portfolio Capital; erosion decreases it. (4) Appreciation and erosion remain separately observable even though both are reflected in the aggregate. (5) Assignment/exercise that transforms one included asset form into another does not itself manufacture a gain/loss — any genuine economic difference (realized appreciation or erosion) is reflected. (6) Shares called away become cash; realized appreciation/erosion changes Portfolio Capital; premium was already recognized and must not be counted again. **Conceptual separation:** Production adds capital; appreciation/erosion changes capital; contributions/withdrawals move capital across the system boundary; obligations constrain capital but do not reduce the capital stock through short-option MTM. **State-transition stability (ratified):** Capital moving between forms within the boundary (cash ↔ shares, cash ↔ T-bills, free ↔ encumbered) does not manufacture trajectory jumps. **T-bills (ratified):** Included in the broad capital quantity via `cashAndCredits` (Fidelity reports money-market/SPAXX as cash). No per-instrument purpose tagging required. Inclusion does not imply deployability. **Fidelity reconciliation (ratified invariant):** `Residual = Fidelity Total Account Value − Wheelwright Portfolio Capital`. The residual is explainable: it equals the aggregate open short-option MTM (a negative quantity that Fidelity includes as a liability in their total). **Console trajectory chart:** Concrete consumer — the chart's rightmost/current point equals the Portfolio Capital headline number; point-in-time and historical computation use identical accounting definitions. **Remaining implementation questions (not yet resolved):** Historical observation persistence mechanism (localStorage vs backend); chart rendering; whether T-bill securities not held as money-market (e.g., individual T-bills in the brokerage account) appear in `cashAndCredits` or in `valueOfInvestments`; whether all owned equities reliably appear in the Option Summary CSV inventory; exact residual composition verification from real account data. **Denominators:** Portfolio Capital is NOT automatically the denominator for all percentages — different questions use different denominators. | Console Architecture (trajectory region), ADR-014, Situation Architecture (Eligible AUM), `foundations/portfolio-capital.md` |
| `PL-EVID-01` | Historical Evidence / Observation Architecture | Architecture for accumulating, storing, and analyzing observations over time. Must distinguish: market evidence history (Evidence Engine), portfolio observation history, Decision/recommendation history (ownership unresolved per reconciliation D-04), reconstructed lifecycle evidence, simulation artifacts. Foundational dependency for lifecycle assessment, opportunity observation, Level 3 models. The opportunity observation experiment (PL-DEPLOY-02) is the most actionable near-term consumer of this architecture; its local experimental form can proceed independently, but durable observation ownership remains dependent on this domain model. **Kreature discovery (Aug 19, 2026):** The "Kreature is always watching" concept provides a named domain actor and additional concrete consumers for this architecture: moneyness sparklines, strike-crossing detection, persistence measurement, intraday baselines, session summaries, and anomaly detection. The sparkline investigation confirmed no historical quote series exists anywhere in Wheelwright. A multi-timescale memory model (bounded raw → derived metrics → promoted artifacts) and a responsibility-separation hypothesis ("Kreature watches; Evidence remembers") are documented in the journal as inputs to this architecture's eventual design. | `foundations/policy-over-prediction.md` (guardrail), Historical/Observational family, Journal 2026-08-19 |
| `PL-EVID-02` | Lifecycle Assessment Evidence Domain | Formal domain for lifecycle quality: ingress, operating, egress. Partially implemented (PCS EP1). Depends on PL-EVID-01. Absorbs former PL-EVID-06 (score vs classification sub-question). | `foundations/conditioned-operating-opportunity.md` |
| `PL-DEPLOY-02` | Opportunity Surface Observation | Temporal observation of recommendation/deployment surface output. Cross-cutting history capability with unresolved architectural ownership. Closely coupled to Deployment Opportunity evolution and Historical/Observational architecture. Concrete use case: preserving decision context to compare how deployment logic versions interpret the same opportunity surface. Intraday observation protocol identified (August 2026): per-strategy daily high-water-mark tracking, observe-only discipline (no alerts, no trades, no recommendation changes), opportunity frontier recording with contemporaneous evidence. Frontend observation seam identified as plausible experimental approach (post-buildCrossEntryRows output contains all scored/governed candidates with timestamp); architectural ownership deliberately unresolved per Evidence Appliance principle — the browser is a viewport, not the permanent observation authority. A local observational experiment can proceed before resolving the full Historical Evidence architecture or cloud deployment. The durable production capability remains dependent on PL-EVID-01 architectural ownership and likely the always-on/cloud trajectory. | Journal entry 2026-08-10, Journal entry 2026-08-14, Historical/Observational family |

### Infrastructure Prerequisites

| ID | Name | Summary | Concept Home |
|---|---|---|---|
| `PL-OPS-01` | Cloud Deployment | Always-on backend (Render or equivalent). Persistent SQLite. GitHub CI/CD. Independent of workstation. Prerequisite for PL-ARCH-03, PL-OPS-04, always-on observation. | `docs/24-cloud-deployment.md` |
| `PL-ARCH-03` | Security and User Accounts | Application-managed users, sessions, ownership boundaries. Depends on cloud deployment. | `10-backend-implementation-preferences.md` §5 |

### Blocked on External Dependencies

| ID | Name | Blocker | Concept Home |
|---|---|---|---|
| `PL-EVID-04` | Market-Priced Risk | Needs IV data source (Tradier sandbox lacks IV) | `foundations/market-priced-risk.md` |
| `PL-EVID-05` | Recommendation Set Analysis | Needs enrichment data (sector, industry classification) | `foundations/recommendation-set-analysis.md` |
| `PL-RESEARCH-01` | Universe Discovery | Needs paid provider tier for enumeration | `universe/`, `engineering-spikes/` |
| `PL-RESEARCH-04` | Instrument Catalog Evolution | Needs provider/data-source for programmatic enrichment (sector, issuer, structural classification). Prerequisite for set analysis grouping and richer governance. | Code + catalog generation scripts, Governance golden-data family |

### Exploratory / Far-Future Seeds

| ID | Name | Summary | Concept Home |
|---|---|---|---|
| `PL-ARCH-02` | Situation-Governed Deployment Strategy | Temporal distribution, concentration limits, lifecycle management (roll/take-profit/hold), rung renewal cadence. Distinct from per-contract recommendation policy. A Situation/Mission concern. | Journal entries, Situation Architecture |
| `PL-ARCH-01` | Instrument Governance Modes | Per-instrument authorized operating modes beyond binary admission. Part of the Governance policy family. | `velvet-rope/` docs |
| `PL-POL-01` | Cash-Flow-Safe Recovery | Premium production may defer/mitigate NAV erosion while preserving recovery potential. Exploratory thesis for a future situation. | None |
| `PL-CALL-03` | Familiarity vs Favorites | Familiarity: inferred from history. Favorites: explicit designation. Separate concepts. Both depend on historical evidence and user accounts. | None |
| `PL-OPS-04` | Notification / Background Awareness | Push notifications or indicators when evidence state changes significantly. Depends on cloud deployment. | None |
| `PL-STRAT-01` | Strategy Expansion Governance | Evaluation framework and scope boundary for strategies beyond CSP/CC/BW. Admission hypothesis: a strategy should serve governed portfolio/capital transformations and should not require predictive reasoning where present evidence, policy, and mechanical-consequence reasoning suffice. Candidates under study: rolling, protective puts, collars, fully-collateralized two-sided position. Currently out of scope absent reconsideration: credit spreads, diagonals, iron condors, butterflies, naked strategies. Four-lens evaluation framework. Rolling already has seeds in PL-EXEC-01 and PL-ARCH-02. | `foundations/strategy-expansion-governance.md` |
| `PL-TRAIN-01` | Training Mode / Portfolio-Operations Simulator | Behavioral training environment: game capital + simulated/historical market, experience compression, sequential learning, decision-quality vs outcome-quality separation, operator resilience development. Subsumes and expands PL-RESEARCH-03. Simulation engine may eventually serve Real Money fitness evaluation (shared capability, not game-only). Three potential operating environments (Training / Live Simulation / Real Money) differing in evidence source, portfolio source, clock, and execution boundary. Extended concepts: agent war-gaming (autonomous operators as policy test subjects), WAIT as first-class deployment action, simulation-control-room / simulated-world boundary as potential architectural separation, multi-purpose scenario definitions. Architectural questions: injectable clock, simulated evidence feeds, execution boundary separation, operating-environment abstraction, agent harness infrastructure, scenario concept taxonomy. | `foundations/training-mode-exploration.md` |
| `PL-COHERE-01` | Architecture-to-Code Coherence Assessment | Deliberate assessment of whether the implementation still realizes the architecture and specifications we say we have. Not traditional static analysis (linting, complexity, duplication, security) — those may contribute supplementary evidence but are not the primary question. The primary question: does the code structure faithfully express the documented architectural intent? Specific concerns: Does backend actually own authoritative evidence lifecycle? Is any frontend state becoming a shadow source of truth? Do dependencies point in the intended direction? Are provider calls confined to the evidence-acquisition boundary? Does recommendation logic remain deterministic and provider-free? Are React effects or FE stores orchestrating behavior that belongs in backend/domain services? Are architectural primitives represented coherently in code or duplicated under divergent names/structures? Are transitional placements quietly becoming permanent? Are there implementation paths that pass tests but violate ADRs or documented invariants? Can major runtime data paths be explained directly from code structure? Does code ownership align with the BE/FE authority boundary? **Motivating evidence:** August 2026 hard-refresh debugging — a simple operator requirement ("show the evidence the backend already has") required tracing subscription lifecycle, React StrictMode behavior, observation-store state, polling, abort semantics, and backend retrieval across multiple async boundaries. The code was not wrong per se, but the gap between architectural intent ("browser is a viewport into the appliance") and implementation reality (complex async orchestration with fragile lifecycle coupling) was wider than expected. **Approach:** Combine (1) existing architecture/spec corpus as intended model, (2) code/dependency/data-flow analysis of actual repository, (3) AI/code-to-spec or architecture-conformance tooling where useful, (4) traditional static-analysis/security tools as supplemental evidence. **Goal:** architectural intent ↔ implementation coherence, not merely "clean code." | `07-architecture-current.md`, `foundations/`, ADRs |

### Research Instruments (Engineering Boundary)

| ID | Name | Summary | Concept Home |
|---|---|---|---|
| `PL-RESEARCH-03` | Scenario Replay | Activity document → state transitions → overlay implications. Engineering research instrument behind subordinate boundary. Not a product surface. Relationship to PL-TRAIN-01: scenario replay is a narrow engineering instrument; Training Mode is the broader product concept that could eventually consume and supersede it. | Journal entries |

---

## Capability Families

### Governance Family

| Responsibility | Description | Items |
|---|---|---|
| Governance policy | What instruments/actions are admissible or authorized? | PL-ARCH-01, automatic batch evaluation |
| Governance golden data | What do we know about instrument structure/classification? | PL-RESEARCH-04 |
| Governance provenance/scaling | How are decisions versioned, attributable, inspectable? | PL-POL-04 |
| Governance correctness | Where is the live catalog incomplete or wrong? | PL-GOV-01 |
| Governance operator expression | Does the operator need direct inspection/intervention? | PL-GOV-EXPR (unresolved) |

### Historical / Observational Family

| Domain | Source | Owner |
|---|---|---|
| Market evidence history | Provider acquisition | Evidence Engine (clear) |
| Portfolio observation history | Fidelity imports, lifecycle events | Portfolio Context / Production (clear) |
| Decision/recommendation history | Wheelwright's Decision output | **Unresolved** |
| Reconstructed lifecycle evidence | Combined market + portfolio + execution | PL-EVID-02, depends on PL-EVID-01 |
| Simulation/replay artifacts | Hypothetical state transitions | Engineering/research (PL-RESEARCH-03) |

---

## Strategy-Specific Semantics (Within Unified Deployment)

Puts, covered calls, and buy-writes serve one unified operator workflow but retain distinct:

- Evidence requirements
- Consequence math (collateral, assignment economics, appreciation geometry)
- Ranking considerations
- Explanation content
- Interaction patterns

This is the surviving concern from the retired desk-asymmetry question (formerly PL-UX-02). Resolution emerges through Deployment Opportunity implementation.

---

## Graduated / Closed Index

Items that have been implemented, superseded, or promoted to authoritative architecture.

| Former ID | Name | Disposition | Destination |
|---|---|---|---|
| #7 | PendingIntent vs Open-Order | Implemented | `src/execution/pending-intent.ts` |
| #8 | Backend Evidence Service | Implemented (Java) | `evidence-service-java/` |
| #9 | Backend Implementation Preferences | Followed | Implemented as specified |
| #11 | Continuous Acquisition | Implemented | Java acquisition worker |
| #12 | Canonical Session Validity | Implemented | Session gate (Java + TS) |
| #18 | Fidelity Broker Handoff | Implemented | `src/execution/fidelity-trade-link.ts` |
| #19 | Recommendation Brief | Implemented | `src/components/RecommendationBrief.tsx` |
| #20 | Progressive Disclosure | Implemented | Architecture doc ADR-005 |
| #24 | Wheelwright Naming | Implemented (convention) | ADR-002 |
| #29 | Midpoint Yield Convention | Implemented | `07-architecture-current.md` §Midpoint Economics |
| #31 | Four-Engine Decomposition | Promoted to ratified architecture | `07-architecture-current.md` §Conceptual Architecture |
| #17 | Product-Structure (umbrella) | Split | Heuristic/governance: implemented. Catalog: PL-RESEARCH-04. Strategy auth: PL-ARCH-01. |
| `PL-OPS-03` | Prior-Epoch Failed Scheduler Gap | Implemented (Java) | Recovery-probe mechanism, 8 tests |
| `PL-CALL-05` | Buy-Write Recommendation Board | **Promoted** (Aug 2026) | Buy-Write Deployment Mechanism — accepted direction within Decision domain. Board topology is implementation; concept is architecture. |
| `PL-DEPLOY-01` | Unified Capital Deployment Surface | **Promoted** (Aug 2026) | Deployment Opportunity — accepted architectural direction (reconciliation F-13). Implementation work retained as PL-DEPLOY. |
| `PL-POL-02` | Monthly Production Regime | **Promoted** (Aug 2026) | Graduated → Situation Architecture, Bridge Income, Regime Objective Function |
| `PL-API-01` | API Testability and Cacheability | **Promoted** (Aug 2026) | Principles graduated → Publication invariants, `contracts/evidence-snapshot-v1.md` |
| `PL-CALL-01` | Calls Horizon B | **Superseded** (Aug 2026) | Historical container closed. Children: existing-put PCS → PL-EVID-03; appreciation geometry → ADR-013 dim 3; call handoff → PL-EXEC-01 |
| `PL-CALL-02` | Calls Horizon C | **Superseded** (Aug 2026) | Historical container closed. Children: lifecycle linkage → PL-EVID-01/02; call discovery → Deployment Opportunity; longitudinal → Level 3 (far future); user state → PL-ARCH-03; lifecycle quality → PL-EVID-02 |
| `PL-UX-02` | Put/Call Desk Asymmetry (topology) | **Superseded** (Aug 2026) | Desk topology resolved by Deployment Opportunity. Strategy-specific semantics survive as §Strategy-Specific Semantics above. |
| `PL-DEPLOY-03` | Cross-Entry Multi-Path | **Superseded** (Aug 2026) | Emergent property of Deployment Opportunity model. Current implementation already handles it. |
| `PL-POL-03` | Portfolio Optimization Layer | **Superseded** (Aug 2026) | Situation Architecture + Deployment Opportunity provide the composition. |
| `PL-OPS-02` | Post-Retooling Craftsmanship Review | **Superseded** (Aug 2026) | Absorbed into active holistic cleanup (PL-CLEANUP). The trigger arrived. |
| `PL-OPS-05` | ADR Coverage Review | **Merged** (Aug 2026) | → Documentation Topology cleanup within PL-CLEANUP |
| `PL-ARCH-04` | Policy-Governance Scaling | **Merged** (Aug 2026) | → PL-POL-04 (same concern) |
| `PL-EVID-06` | Score vs Classification | **Merged** (Aug 2026) | → PL-EVID-02 (design sub-question) |
| `PL-REC-STATE` | Client-Local Recommendation State | **Merged** (Aug 2026) | → PL-ARCH-06 + PL-DEPLOY-02 (symptom of two tracked concerns) |
| `PL-CALL-04` | Call Inventory/Eligibility Observability | **Reframed** (Aug 2026) | → PL-ELIG (Deployment Eligibility / Capacity Explanation — broader concept) |
| `PL-RESEARCH-02` | Velvet Rope Evolution | **Dissolved** (Aug 2026) | Lab container retired. Surviving capabilities distributed into Governance family. |

---

## Merge / Split / Supersession History

| Source | Action | Destination(s) | Rationale | Date |
|---|---|---|---|---|
| Old #13 (Historical Analytics) | Expanded | `PL-EVID-01` | Now includes provenance/backfill distinction | Jul 2026 |
| Old #23 (Call Contract Quality) | Merged into | `PL-CALL-01` | Subsumed by Horizon B | Jul 2026 |
| Old #27 (Cloud deployment) | Stabilized as | `PL-OPS-01` | Constraints documented | Jul 2026 |
| Old #28 (Prior-epoch failed gap) | Renamed | `PL-OPS-03` | Clarity | Jul 2026 |
| `PL-OPS-03` | Graduated | Closed Index | Java recovery-probe implementation | Jul 2026 |
| Old #30 (Calls execution handoff) | Merged into | `PL-CALL-01` | Part of same milestone | Jul 2026 |
| Old #17 (Product-Structure) | Split | Graduated + PL-RESEARCH-04 + PL-ARCH-01 | Jul 2026 |
| Old #21 (Portfolio-State Maturity) | Retained | `PL-PORT-01` | Economics done; broader maturity remains | Jul 2026 |
| Old #6 (Write Intent / Lifecycle) | Retained | `PL-EXEC-01` | Handoff done; lifecycle incomplete | Jul 2026 |
| Old #4 (Put/Call Asymmetry) | Retained | `PL-UX-02` | Then superseded Aug 2026 | Jul 2026 |
| `PL-ARCH-04` | Merged | `PL-POL-04` | Same concern: policy governance at scale | Aug 2026 |
| `PL-EVID-06` | Merged | `PL-EVID-02` | Design sub-question of lifecycle assessment | Aug 2026 |
| `PL-REC-STATE` | Merged | `PL-ARCH-06` + `PL-DEPLOY-02` | Symptom of two tracked concerns | Aug 2026 |
| `PL-OPS-05` | Merged | `PL-CLEANUP` (doc topology) | Part of broader documentation authority reconciliation | Aug 2026 |
| `PL-OPS-02` | Superseded | `PL-CLEANUP` | Holistic cleanup IS this item's trigger | Aug 2026 |
| `PL-CALL-01` | Superseded | Children mapped to PL-EVID-03, ADR-013, PL-EXEC-01 | Historical container overtaken by architecture | Aug 2026 |
| `PL-CALL-02` | Superseded | Children mapped to PL-EVID-01/02, Deployment, PL-ARCH-03 | Historical container overtaken by architecture | Aug 2026 |
| `PL-UX-02` (topology) | Superseded | Deployment Opportunity | Desk question resolved; strategy semantics survive separately | Aug 2026 |
| `PL-DEPLOY-03` | Superseded | Deployment Opportunity model | Emergent property, already implemented | Aug 2026 |
| `PL-POL-03` | Superseded | Situation Architecture + Deployment Opportunity | Speculative layer not needed | Aug 2026 |
| `PL-RESEARCH-02` | Dissolved | Governance capability family | Lab container retired; capabilities survive | Aug 2026 |
| `PL-CALL-04` | Reframed/replaced | `PL-ELIG` | Broader Deployment Eligibility concept | Aug 2026 |
| `PL-CALL-05` | Promoted | Graduated/Closed | Buy-Write Deployment Mechanism accepted | Aug 2026 |
| `PL-DEPLOY-01` | Promoted | Graduated/Closed + `PL-DEPLOY` | Concept graduated; implementation work retained | Aug 2026 |
| `PL-POL-02` | Promoted | Graduated/Closed | Concept graduated into Situation/Bridge Income | Aug 2026 |
| `PL-API-01` | Promoted | Graduated/Closed | Principles graduated into publication invariants | Aug 2026 |

---

## Historical Context

The original July 2026 reconciliation audit is preserved at `docs/11-parking-lot-reconciliation.md`.

The August 2026 holistic reconciliation is documented at:
- `docs/30-architectural-baseline-inventory.md` — extracted architectural state
- `docs/31-architectural-reconciliation.md` — ratified architecture reconciliation
- `docs/32-parking-lot-reconciliation.md` — ratified parking-lot dispositions and capability families

---

## Source Integrity Note

The pre-reconciliation parking lot contained a duplicate ID: a row labeled `PL-ARCH-01` with content "Client-Local Recommendation State" appeared in the Historical Context section, colliding with the formal PL-ARCH-01 (Instrument Governance). During reconciliation this was given temporary identity `PL-REC-STATE` and merged into PL-ARCH-06 + PL-DEPLOY-02 as a symptom of those two tracked concerns.
