# Evidence Appliance

**Date:** July 16, 2026
**Status:** Governing architectural concept — ratified

---

## Core Definition

> Wheelwright is an always-on evidence appliance for options-income decision support.

The appliance:

- Continuously maintains an authoritative evidence model of the options opportunity environment
- Operates independently of any browser session
- Understands when evidence can and cannot change (session awareness)
- Preserves valid evidence across runtime restarts (persistence)
- Exposes maintained state to operator clients
- Supports recommendation consumers and, eventually, historical-analysis consumers
- Does not require the operator to initiate acquisition

The browser is a viewport into the appliance, not the thing that starts or owns the system.

---

## What It Is Not

### Not a Desktop Application

A desktop application typically begins when the user opens it and may reasonably own transient local state. It scans when asked, loses state when closed, and depends on the operator for initiative.

The evidence appliance should already be operating before any user connects. When the operator opens Write Desk, the opportunity surface is already there — maintained, valid, ready. The operator observes; the appliance maintains.

### Not a Generic Web Service

A generic web service answers requests. It is passive — it performs work when asked and is idle otherwise.

The evidence appliance also maintains an evolving, session-aware body of evidence continuously and independently of any request. It acquires, evaluates, seals, and preserves evidence according to market-session policy whether or not any client is connected.

### Not a Scanner

A scanner performs a process. It starts, runs, produces output, and finishes.

The evidence appliance maintains a valid model. Acquisition is a means, not an end. The distinction:

- Scanner: "I scanned 496 symbols and here are the results."
- Appliance: "The opportunity environment currently contains 49 actionable recommendations. Evidence was sealed at today's close."

This reinforces the governing UI principle:

> Represent the environment, not the machinery.

---

## Architectural Consequences

### Single Acquisition Authority

The backend owns provider acquisition and evidence maintenance. Clients observe state and do not independently crawl providers.

This is not merely a performance or simplicity choice. It follows from the appliance identity: the appliance maintains one authoritative evidence model. Multiple independent acquirers would create split-brain evidence with unresolvable version conflicts. One authority maintains one truth.

### Persistence

Durable persistence is required. An appliance that loses its evidence on restart has failed structurally, not merely suffered a temporary inconvenience.

Consider a thermostat that forgets the temperature history and current setpoint every time power cycles. It hasn't experienced a graceful degradation — it has failed at its fundamental purpose of maintaining a model of the thermal environment.

SQLite is the intended first persistence substrate. It provides:
- Sealed-evidence preservation across restarts
- Historical observation accumulation
- Restart recovery without re-acquiring an entire universe
- Foundation for multi-day and multi-session analysis

### Session Awareness

The appliance must understand market sessions:

- Regular observation (primary acquisition)
- Premarket (limited preparation)
- Open delay (hold — delayed data not yet trustworthy)
- Delay drain (finalize — last observations arriving)
- Closed canonical (sealed — evidence complete for this session)
- Non-trading day (suspended — no new evidence possible)

Session awareness is a correctness requirement because it determines whether evidence can physically change and whether acquisition is useful. An appliance that acquires when markets are closed is wasting resources on data that cannot differ from what it already holds — a failure of environmental modeling.

### Sealed Evidence

Evidence sealed at session close remains valid until superseded by the next session's canonical observations. Wall-clock age does not invalidate sealed evidence.

Friday's sealed close is the newest valid evidence throughout the weekend. The appliance preserves and serves this state without marking it stale. The trust label reflects session context ("Prior Session · Friday Close"), not elapsed time.

### Cloud Deployment

Cloud deployment is not primarily about learning AWS. Its main value is making the appliance:

- Always on (not dependent on a laptop being open)
- Reachable from multiple locations
- Usable by multiple operators
- Independent of the desk-bound development machine
- Capable of maintaining evidence through nights, weekends, and holidays without a running browser

The appliance model makes cloud deployment a natural consequence rather than an ambitious stretch goal.

### Frontend Role

Write Desk is an operator console — a viewport into the appliance.

It presents:
- Portfolio context
- Evidence trust and validity
- The current opportunity surface
- Recommendation state
- Decision workspace (Recommendation Brief)

It does not narrate acquisition machinery by default. The operator sees what the environment currently offers, not what the system is doing to learn about it. Diagnostics remain available for process mechanics, but they are not the primary surface.

### Refresh Semantics

A normal operator should not need to "refresh" an always-on appliance. You do not refresh a thermometer — you read it.

Any remaining nudge or reevaluation action is administrative. It means: "Reevaluate whether acquisition work is currently due and permitted." It does not guarantee fresh data. It must obey session policy. It belongs in diagnostics, not in the primary operator workflow.

### Historical Analysis

Continuous durable evidence naturally creates the substrate for historical observation and analysis.

The appliance maintains:
- Current operational evidence (the live opportunity surface)
- Eventually, historical evidence over time (how the surface evolved)

This enables future capabilities: trend observation, policy back-testing, seasonal patterns, outcome correlation. These are natural products of an appliance that maintains a continuous record — not features that require separate data infrastructure.

---

## Relationship to Existing Foundations

The evidence appliance is the system identity that the other governing principles assume but do not independently name. Each foundation describes one aspect of how the appliance behaves:

| Foundation | Relationship to the Appliance |
|-----------|-------------------------------|
| **Policy over Prediction** | The appliance maintains evidence and applies policy to it. It does not predict outcomes. Recommendations are policy-governed assessments of current evidence, not forecasts. |
| **State-Oriented Console** | Write Desk presents the appliance's maintained state. "Show what is" is natural when the appliance already maintains a valid model. |
| **Secondary Observation** | The appliance's own health, freshness, and acquisition state are observable alongside the evidence it maintains. Trust is derived from evidence metadata, not assumed. |
| **Closed-Loop Engineering** | The development methodology mirrors the product: both continuously produce evidence. The appliance is the product analog of the engineering loop. |
| **Three Actor Model** | The appliance is the system the Implementation Engineer builds, the Architect designs, and the Principal governs. Its always-on nature clarifies that it is infrastructure, not a tool invoked on demand. |
| **Evidence Validity Model** | Defines when the appliance's maintained evidence is valid, sealed, stale, or unavailable. The validity model is the appliance's internal correctness invariant. |
| **Single Acquisition Authority** | The appliance has one maintenance authority (the backend worker). This follows from the single-truth requirement of the appliance model. |
| **Recommendation Set Analysis** | The appliance's maintained evidence is the input to recommendation computation. The recommendation engine is a consumer of the appliance's state, not an acquirer. |
| **Opportunity Surface** | The appliance's externally visible state: how many opportunities exist, how much of the universe has been resolved, what the current decision space looks like. |
| **Decision-Space Compression** | The appliance resolves 496 symbols into 49 opportunities. This compression is the appliance's primary value to the operator — not the raw data, but the maintained, policy-governed view. |

---

## Current Implementation Maturity

### Already Present

- Backend-owned acquisition (single authority)
- Snapshot polling (frontend observes backend state)
- State-oriented trust derivation direction
- Background worker (self-scheduling, single-flight)
- Operator clients consuming shared evidence
- Emergency off-hours acquisition guard (session awareness, minimal)
- Recommendation funnel instrumentation
- Evidence-state indicator in Write Desk

### Transitional

- In-memory backend evidence store (no persistence across restarts)
- Browser IndexedDB projection (legacy from desktop-app era)
- Incomplete backend session authority (emergency gate, not full six-state model)
- Misleading "Refresh" button on primary surface
- Local-only deployment (laptop-bound)
- Frontend independently classifies session for trust display

### Required to Fully Realize the Appliance

- SQLite persistence (sealed evidence survives restarts)
- Full backend session authority (shared six-state model, canonical sealing)
- Restart recovery (load prior sealed evidence on cold start)
- Cloud deployment (always-on, location-independent)
- Multi-user authentication and operator context
- Durable historical observation capture
- Elimination of browser-owned evidence projection
- Frontend trust derived entirely from backend-reported validity metadata

The concept is the architectural north star. The implementation is partway there. The transition is tracked in `docs/21-write-desk-recomposition.md` (implementation phases).

---

## The Conceptual Shift

The project began as a desktop application that screened options chains on demand. Through iterative development, it has crossed a threshold:

| Before | After |
|--------|-------|
| The browser starts the system | The system is already running |
| The operator initiates scanning | The appliance maintains evidence continuously |
| Evidence lives in the browser | Evidence lives in the appliance |
| Closing the browser loses state | The appliance preserves sealed evidence |
| The system reports what it did | The system shows what is |
| Deployment means "run locally" | Deployment means "the appliance is reachable" |
| Refresh means "go get data" | Refresh is an administrative diagnostic |

This shift was not a single decision. It emerged from the accumulation of architectural choices:
- Moving acquisition to the backend (single authority)
- Adding session awareness (evidence validity)
- Implementing sealed-evidence semantics (persistence requirement)
- Designing Write Desk as an operator console (state-oriented)
- Recognizing that off-hours crawling was a correctness error (session gate)

Each of these individually made sense. Together they describe a system that is fundamentally an always-on evidence appliance, not a desktop application that happens to have a backend.

---

## Open Questions

1. **Naming:** Should the external-facing name remain "Wheelwright" or evolve to reflect the appliance identity? (Not urgent — internal architecture matters more than external naming.)

2. **Multi-tenancy:** Does the appliance serve one operator or multiple? Current assumption: single operator with potential for multi-user read access. Full multi-tenancy (different portfolios, different policies) is a separate architectural decision.

3. **Evidence retention:** How long does the appliance retain historical observations? Forever? Rolling window? Policy-governed? (Deferred to persistence design.)

4. **Appliance boundary:** Where exactly does the appliance end and the client begin? Current answer: the appliance owns evidence acquisition, persistence, session awareness, and validity. The client owns recommendation computation, policy controls, and presentation. This boundary may shift as the system matures.
