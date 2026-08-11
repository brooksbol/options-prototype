# Architectural Baseline Inventory

**Purpose:** Extract the current architectural state from authoritative sources without editorial changes, reconciliation, or new interpretation. This document is the clean baseline against which recent operational discoveries will be tested.

**Sources:** `07-architecture-current.md`, `07c-adrs.md`, `25-situation-architecture.md`, `26-operator-console-architecture.md`, `foundations/*`, `contracts/evidence-snapshot-v1.md`, `parking-lot.md`

**Date:** August 11, 2026
**Status:** Extraction — read-only snapshot of current authoritative architecture

---

## 1. System Identity

Wheelwright is an always-on evidence appliance for policy-governed options-income decision support.

**What it is:**
- An evidence appliance that continuously maintains an authoritative model of the options opportunity environment
- A decision-support workbench that presents evidence, produces recommendations, and hands off execution to a broker
- A policy engine that applies explicit, auditable rules to observed evidence
- An active portfolio-operations tool serving operators who consciously trade time and cognitive effort for a particular portfolio outcome

**What it is not:**
- A screener
- A portfolio dashboard
- An automated trading system
- A brokerage integration
- A prediction engine
- A generic investment platform

**Source authority:** `07-architecture-current.md` §System Identity, `foundations/evidence-appliance.md` §Core Definition, `25-situation-architecture.md` §Principles

---

## 2. Architectural Primitives

These are the fundamental concepts the architecture reasons in terms of. They are implementation-independent.

### 2.1 Evidence

Observable facts about the market environment, maintained continuously and independently of any connected client.

- Chain data (strikes, bids, asks, deltas, OI, volume)
- Expirations (available dates for each symbol)
- Quotes (underlying prices)
- Absence (confirmed non-availability of data for a symbol)
- Session state (market open/closed/sealed)
- Freshness and provenance (when observed, by what mechanism, under what session conditions)

Evidence is acquired, sealed, and preserved according to session policy. It is never prediction. It is never interpretation.

**Source:** `07-architecture-current.md` §Evidence Engine, `foundations/evidence-appliance.md`, `foundations/acquisition-scheduler-policy.md`

### 2.2 Portfolio Context

The operator's current factual capital state. Situation-agnostic.

- Inventory (held positions, quantities, economics)
- Cash (deployable, settled, pending — with brokerage-mediated capability distinctions)
- Existing encumbrances (short calls, short puts, pending intents)
- Position economics (cost basis, market value, broker option basis)
- Provenance (source files, timestamps, account identity)

Portfolio Context is factual regardless of operating situation. The same positions exist whether the operator is in Bridge Income or Situation 0.

**Source:** `07-architecture-current.md` §Portfolio Context, ADR-011, ADR-013 §Economic Consequence

### 2.3 Policy

Explicit, auditable rules that govern system behavior. Traceable to principles.

- Contract selection policy (delta range, DTE range)
- Execution assessment policy (spread thresholds, OI floors, volume)
- Ranking policy (mode selection: yield-first, balanced, execution-first, capital-efficiency)
- Deployment policy (affordability, reserve)
- Governance policy (product structure, instrument authorization)
- Admission policy (Velvet Rope criteria)

Policy is the Governor's tool. It is versioned, configurable, and inspectable. It does not predict. It governs.

**Source:** `07-architecture-current.md` §Recommendation Policy, `foundations/policy-over-prediction.md`, `foundations/principles-governance-model.md`

### 2.4 Decision (Recommendation)

The deterministic output of applying policy to evidence in the context of portfolio state.

- Ranked candidates (puts, calls, future: buy-writes)
- Posture assignment (ACTIONABLE, EDGE, WAIT)
- Contract selection (best-fit within policy constraints)
- Yield computation (midpoint economics)
- Funnel reduction (universe → eligible → admissible → ranked)

Recommendations are a pure function: same evidence + same policy + same portfolio = same recommendations. Zero provider calls. No hidden state.

**Source:** `07-architecture-current.md` §Recommendation Engines, ADR-001, ADR-003

### 2.5 Explanation

Why a recommendation was made, structured for operator comprehension.

- Recommendation brief (identity, decision summary, position context, execution evidence, strike neighborhood, provenance)
- Governance annotations (which principles/policies admitted or excluded)
- Neighborhood context (nearby contracts, alternatives considered)
- Provenance (evidence age, session, observation time)
- Conditioned Operating Opportunity (if-assigned call environment)

Explanation is always evidence-backed. It references the operator's declared objectives (when a situation exists) rather than presenting context-free metrics.

**Source:** `07-architecture-current.md` §Explanation Engine, ADR-006, `foundations/conditioned-operating-opportunity.md`, `25-situation-architecture.md` §Explainability

### 2.6 Situation / Mission

The operator's declared context that shapes how Wheelwright reasons about recommendations, explanations, and portfolio monitoring.

- Context (why the operator is doing this)
- Constraints (what boundaries must be respected)
- Optimization priorities (what the operator values most)
- Explanation framing (how recommendations are justified)
- Mission (what must be accomplished — e.g., monthly cash-flow target)
- Operating envelope (acceptable boundaries for the mission)

A situation does NOT replace evidence, portfolio model, or recommendation mechanics. It adds context, constraints, and optimization priorities to existing capabilities.

**Current state:** Situation 0 (implicit, unnamed) is the current implementation. Bridge Income is the first explicit situation (designed, not implemented).

**Source:** `25-situation-architecture.md`

### 2.7 Position Monitoring

The operator's awareness of encumbered capital and its operational state. Decomposed into three independent dimensions:

1. **Contract State** — Observable facts requiring no interpretation (type, strike, DTE, encumbered capital, moneyness, distance from strike)
2. **Decision Pressure** — Operational interpretation of whether resolution is approaching and operator awareness is warranted (derived from resolution proximity: DTE + moneyness magnitude)
3. **Economic Consequence** — What resolution means economically (effective exit, gain/loss relative to basis, capital released/transformed)

These are independent. Each is useful without the others. Situations may later interpret them but do not produce or constrain them.

**Key invariant:** No position is classified as inherently "bad." The word "health" is not an architectural concept. Assignment is an outcome, not a defect.

**Source:** ADR-013, `26-operator-console-architecture.md`

### 2.8 Operator Surfaces

How the system presents itself to the operator. Two primary surfaces with distinct responsibilities:

- **Operator Console** (home, orientation): Monitoring, urgency awareness, mission progress, capacity assessment. Represents encumbered capital over time (DTE ladder). Does not own recommendation or execution.
- **Write Desk / Wheelwright workbench** (action): Recommendation discovery, contract selection, execution support. Contains put and call candidate tables, recommendation brief drawer, policy controls, broker handoff.

**Source:** ADR-012, `26-operator-console-architecture.md`, `07-architecture-current.md` §Write Desk

### 2.9 Broker Handoff

The explicit boundary between system recommendation and market execution.

- WriteIntent constructed (broker-neutral)
- Broker adapter produces pre-populated trade URL
- Operator confirms in broker interface
- System never submits orders, interacts with credentials, or assumes acceptance
- Portfolio state is never mutated by opening a trade link

**Source:** ADR-004, `07-architecture-current.md` §Broker Handoff

---

## 3. Boundaries

Explicit architectural separations that must be preserved.

| Boundary | Separation | Source |
|----------|-----------|--------|
| Evidence ≠ Recommendation | Evidence acquisition never produces recommendations. Recommendation engine never calls providers. | ADR-001, INV-BOUND-01 |
| Observation ≠ Interpretation | Contract State is fact. Decision Pressure is interpretation. Economic Consequence is arithmetic. These layers do not collapse. | ADR-013 |
| Recommendation ≠ Execution | System constructs intent and opens broker ticket. Broker confirms and submits. The boundary is explicit and documented. | ADR-004 |
| Rank ≠ Presentation Sort | Recommendation rank (Wheelwright-assigned) is independent of table column sort (operator-controlled). | ADR-003 |
| Observable State ≠ Operational State | What the market *is* (operator surface) vs what the system is *doing* (diagnostic surface). | `foundations/state-oriented-console.md` |
| Golden Data ≠ Runtime Data | Git-backed catalog/descriptions vs persistence-backed observations. Git is authority for structural knowledge. | Retooling Charter §Stable Boundaries |
| Situation ≠ Evidence | Market data doesn't change based on operator intent. Situations shape reasoning, not facts. | `25-situation-architecture.md` §Relationship table |
| Provider ≠ Application | Adapter owns credential, pacing, normalization. Provider types never leak into application domain. | INV-PROV-01, INV-PROV-02 |
| Primary Observation ≠ Mechanism Health | Trust the evidence only after trusting the mechanism that produced it. | `foundations/secondary-observation.md` |

---

## 4. Invariants

Non-negotiable system behaviors that must hold regardless of implementation.

### 4.1 Evidence Invariants

| ID | Statement | Source |
|----|-----------|--------|
| INV-LIFE-01 | Evidence acquisition operates independently of any browser session | Retooling Charter, conformance assessment |
| INV-LIFE-02 | Evidence survives runtime restarts (durable persistence) | Retooling Charter, conformance assessment |
| INV-ACQ-01 | Single acquisition authority — one process maintains one authoritative evidence model | `foundations/evidence-appliance.md` §Single Acquisition Authority |
| INV-ACQ-02 | No consumer initiative required — appliance operates before any user connects | `foundations/evidence-appliance.md` |
| INV-SESS-01 | Acquisition gated by market session — acquiring during closed sessions is a modeling failure | Retooling Charter §Durable Principles |
| INV-SESS-03 | Sealed evidence from canonical session remains valid during closed sessions regardless of wall-clock TTL | Retooling Charter, `foundations/evidence-appliance.md` §Sealed Evidence |
| INV-PERSIST-01 | Failed refresh never overwrites last successful evidence | Retooling Charter §Durable Principles |
| INV-PERSIST-03 | All evidence carries observation provenance (when, how, under what session) | conformance assessment |

### 4.2 Recommendation Invariants

| ID | Statement | Source |
|----|-----------|--------|
| REC-DET | Same evidence + same policy + same portfolio = same recommendations | Retooling Charter §Durable Principles, `07-architecture-current.md` |
| REC-ZERO | Recommendation engine makes zero provider calls | ADR-001, `07-architecture-current.md` §Design Principles |
| REC-MID | All indicative economics use midpoint valuation convention | `07-architecture-current.md` §Midpoint Economics |

### 4.3 Governance Invariants

| ID | Statement | Source |
|----|-----------|--------|
| GOV-PRODUCT | Product definition is version-controlled; runtime persistence is derived from Git artifacts | Retooling Charter §Durable Principles |
| GOV-HUMAN | Human confirmation before broker submission — system opens ticket, broker confirms | ADR-004, `07-architecture-current.md` §Design Principles |
| GOV-EPISTEMIC | System never implies more certainty than evidence supports | ADR-013, `25-situation-architecture.md` §Epistemic Integrity |

### 4.4 Publication Invariants

| ID | Statement | Source |
|----|-----------|--------|
| INV-PUB-01 | Snapshot is coherent (consistent point-in-time view) | conformance assessment |
| INV-PUB-02 | Conditional retrieval via ETag/304 | conformance assessment |
| INV-PUB-03 | Generation is monotonically increasing | conformance assessment |
| INV-PUB-05 | Published contract is versioned and frozen | conformance assessment, `contracts/evidence-snapshot-v1.md` |

---

## 5. Governing Principles

Enduring operating philosophy that governs all layers below. Rarely changes.

| Principle | Statement | Primary Source |
|-----------|-----------|---------------|
| Policy over Prediction | Apply explicit auditable rules to observed evidence. Do not predict market direction. | `foundations/policy-over-prediction.md` |
| Preserve Optionality | Never take an action that permanently forecloses future decisions. | `foundations/principles-governance-model.md` |
| Respect Uncertainty | Act only where evidence supports the action and risk is bounded. | `foundations/principles-governance-model.md` |
| Execute with Discipline | Act only where market structure supports reliable execution. | `foundations/principles-governance-model.md` |
| Earn Proportional Compensation | Accept risk only when compensated proportionally. | `foundations/principles-governance-model.md` |
| Avoid Concentration | Diversify exposures. No single position, sector, or thesis should dominate. | `foundations/principles-governance-model.md` |
| Observe Before Acting | Maintain continuous awareness. The system observes; the operator decides. | `foundations/principles-governance-model.md` |
| Sustain Institutional Behavior | Reduce cognitive load, not agency. Optimize institutional outcomes over long horizons. | `foundations/principles-governance-model.md` |
| Epistemic Integrity | Never present observations as judgments. Preserve the fact-to-interpretation boundary. | ADR-013, `25-situation-architecture.md` |

---

## 6. Conceptual Architecture (Four Engines)

The four architectural concerns, ratified as the conceptual decomposition:

| Engine | Question | Responsibility |
|--------|----------|---------------|
| Evidence | What is true about the market? | Chains, expirations, quotes, absence, freshness, session validity, coverage |
| Policy | Given evidence, what rules govern our response? | Delta range, DTE range, execution thresholds, governance, product structure, affordability |
| Decision | Given policy results, what is recommended? | Ranked candidates, posture, contract selection, yield computation |
| Explanation | Why was this recommended? | Brief, neighborhood, governance annotations, provenance, delta fit |

These are not four services. They are four responsibilities that may coexist within the same process.

**Source:** `07-architecture-current.md` §Conceptual Architecture

---

## 7. Cognitive Role Architecture

Product surfaces serve three fundamentally different cognitive roles:

| Role | Question | Optimizes for | Current Surface |
|------|----------|---------------|-----------------|
| Explorer | What is possible? | Discovery, breadth, optionality | Write Desk (recommendation tables) |
| Governor | Should we proceed? | Safety, policy compliance, institutional reasoning | Velvet Rope (designed, not live) |
| Operator | How do I execute? | Reliability, precision, efficiency | Operator Console + Broker Handoff |

**Source:** `foundations/cognitive-role-separation.md`

---

## 8. Operating Regime

The system currently operates in a **cash-flow production regime**: convert available capital into sustainable realized income through options strategies.

- Mission: Sustain target monthly realized production while preserving productive capacity of capital
- Entry mechanisms: Cash-Secured Put, Buy-Write (analyzed, feasible), Covered Call (on held inventory)
- Evidence maturity levels: Level 1 (observable facts) → Level 2 (transparent policy) → Level 3 (learned from operating history, not yet earned)
- No Level 3 learned model exists or should be built until sufficient operating history justifies it

**Source:** `foundations/regime-objective-function.md`

---

## 9. Transitional Boundaries (Current Placement, Not Permanent)

| Placement | Current | Permanent? | Note |
|-----------|---------|------------|------|
| Recommendation engine | Browser-local | Transitional | Not necessarily permanent. Do not combine move with other changes. |
| Portfolio context | Browser-local (Fidelity CSV) | Undetermined | May eventually have server-side persistence for multi-device/multi-user. |
| Description Library | Browser-local (generated .ts) | Transitional | May move to backend as catalog matures. |

**Source:** Retooling Charter §Transitional Boundaries

---

## 10. Explicitly Unresolved Questions

These are questions the authoritative documentation explicitly leaves open. They are not gaps or defects — they are deliberate deferral.

### Architecture

1. **Recommendation engine permanent home** — Browser or backend? Separate decision with separate drivers. (Retooling Charter)
2. **Multi-tenancy** — One operator or multiple? Currently single-operator assumption. (Evidence Appliance §Open Questions)
3. **Evidence retention policy** — How long does the appliance retain historical observations? (Evidence Appliance §Open Questions)
4. **Appliance boundary** — Where exactly does the appliance end and the client begin? May shift. (Evidence Appliance §Open Questions)
5. **Situation switching mechanism** — UI, navigation, configuration schema, persistence model. (Situation Architecture §What This Document Does NOT Specify)
6. **Production Score object model** — Is there a first-class "Deployment Opportunity" between Derived Facts and Recommendation? (Regime Objective Function §Open Questions)

### Position Monitoring

7. **Decision Pressure thresholds** — How many DTE constitute "approaching"? How close is "near strike"? (ADR-013 §Explicitly not decided)
8. **Decision Pressure categorical states** — Number of states, their names, visual encoding. (ADR-013)
9. **Resolution proximity** — Separately named field or implicit in decision-pressure derivation? (ADR-013)

### Policy / Governance

10. **Principles as runtime entities** — Should `principleId` exist in the type system? (Principles Governance Model §Open Questions)
11. **Principle conflicts** — How resolved when Preserve Optionality conflicts with Earn Proportional Compensation? (Principles Governance Model §Open Questions)
12. **Lifecycle Quality scoring model** — Numeric score, multi-dimensional classification, or evidence summary? (Conditioned Operating Opportunity §Open Questions)
13. **Measurement methodology** — Single-contract or neighborhood evaluation for market quality? (Journal experiments 001/002 — weakening hypothesis)

### Evidence / Data

14. **IV data source** — Tradier sandbox lacks IV. Richer market-pricing context requires provider upgrade. (Market-Priced Risk §Data Requirements)
15. **Sector/industry classification source** — Needed for Recommendation Set Analysis grouping. (Recommendation Set Analysis §Data Requirements)
16. **Historical NAV acquisition** — No mechanism or schema ratified. Source and format unresolved. (Operator Console Architecture §NAV/Mission Progress)

### Execution / Lifecycle

17. **Full trade lifecycle** — Beyond handoff: submitted → working → filled → assigned → closed. (PL-EXEC-01)
18. **Put/Call desk asymmetry** — Whether puts and calls ultimately require different evidence, ranking, presentation, or workflow. (PL-UX-02)

---

## 11. Implementation Facts (Current Runtime)

Recorded for completeness. These are implementation choices, not architectural primitives.

| Concern | Implementation |
|---------|---------------|
| Backend | Java 21, Spring Boot 3.4, SQLite (JDBC, WAL mode) |
| Frontend | React 18+, TypeScript (strict), Vite |
| Evidence persistence | SQLite (durable, single authority) |
| Frontend evidence cache | IndexedDB (read cache, not system of record) |
| Frontend workspace state | localStorage |
| Provider | Tradier sandbox (REST, 15-min delayed, 60 req/min) |
| Rate control | RequestPacer at 0.9 req/sec |
| Frontend-backend communication | Conditional HTTP polling (ETag/304, 30s interval) |
| Test suites | Vitest (1112 tests), JUnit 5 (173 tests) |
| Visualization | d3-hierarchy (treemap packing), CSS custom properties |

---

## 12. Document Authority Map

Current understanding of which documents carry which kind of authority:

| Document | Authority Type | Current Health |
|----------|---------------|----------------|
| `07-architecture-current.md` | Authoritative system definition | Current (July 2026 snapshot) |
| `07c-adrs.md` (ADR-001 through ADR-013) | Ratified architectural decisions | Current |
| `25-situation-architecture.md` | Accepted architectural direction | Current (not yet implemented beyond Situation 0) |
| `26-operator-console-architecture.md` | Accepted design + partial implementation | Current |
| `foundations/*` (16 documents) | Governing principles and concepts | Current |
| `contracts/evidence-snapshot-v1.md` | Frozen API contract | Stable (v1 locked) |
| `parking-lot.md` | Unprioritized backlog | Current (last reviewed July 26, 2026) |
| `00-project-charter.md` | **Ambiguous** — origin story + stale living document hybrid | Contains Slice 1 language contradicted by current architecture |
| `04-architecture.md` | **Superseded** by `07-architecture-current.md` | Historical |
| `05-design.md` / `05a-component-map.md` | **Superseded** by current architecture | Historical |
| `07a-component-map-current.md` | Component map | Unknown currency — requires inspection |
| `07b-diagrams.md` | Architecture diagrams | Unknown currency — requires inspection |
| `09-backend-evidence-service-design.md` | Backend design (TypeScript era) | **Partially superseded** — Java is now authoritative |
| `23-calls-architecture.md` | Calls design | Current (Horizon A implemented) |
| `velvet-rope/*` | Universe management design | Current (designed, partially implemented) |

---

## 13. Extraction Notes

This inventory was extracted without editorial judgment. Observations for the reconciliation phase:

1. The Four Engines (Evidence, Policy, Decision, Explanation) do not explicitly name Situation/Mission as a fifth engine or a cross-cutting concern. The Situation Architecture operates *across* engines rather than as one.

2. The Principles Governance Model proposes principles as first-class runtime entities but acknowledges this is "currently implicit." The gap between documented principles and runtime enforcement is large.

3. Position Monitoring (ADR-013) was designed in explicit opposition to composite "health" scoring — yet some parking-lot items and the Console architecture still reference "health" in informal contexts.

4. The Retooling Charter marks recommendation-engine location as "transitional" (browser) but no concrete migration path exists. This is explicitly deferred but also explicitly identified as architectural debt.

5. Two invariants (INV-SESS-03 sealed evidence validity, INV-PERSIST-04 trust derivation at publication) are documented as required but not yet implemented in the live Java backend.

6. The operating regime (cash-flow production) is documented in a foundation document but is not yet named or made explicit in the primary architecture document (`07-architecture-current.md`).

7. Buy-Write is analyzed as feasible (parking lot PL-CALL-05) and the regime document discusses it as a first-class entry mechanism, but `07-architecture-current.md` does not yet reflect it.

---

*This document is a read-only extraction. It does not propose changes. The reconciliation exercise begins from this baseline.*
