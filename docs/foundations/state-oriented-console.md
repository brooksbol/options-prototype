# State-Oriented Operator Console

**Date:** July 2026
**Status:** Architectural principle — guides future UI and system design

---

## Governing Principle

> The operator console shows what **is**.
>
> The diagnostic console shows what the system is **doing**.

---

## Observable State vs Operational State

### Observable State

Information required for investment decisions. Consumed by the operator in normal workflow.

| Category | Examples |
|----------|---------|
| Evidence freshness | "Evidence: 2 min ago" |
| Evidence coverage | "489 / 496 current" |
| Recommendation readiness | "Top 20 recommendations current" |
| Market session | "Regular Session · Jul 16" |
| Recommendation population | "3 of top 10 are semiconductors" |
| System health (operator level) | ● Active (green dot) |
| Portfolio context | "$18,500 deployable" |
| Pending exposure | "URA — pending broker order" |

**Consumed by:**
- Write Desk (primary operator surface)
- Recommendation Brief
- Future: Scriptable widgets, mobile clients, APIs

**Characteristics:**
- Answers "can I trust what I'm seeing?"
- Answers "what should I do?"
- Does not require understanding of system internals
- Scales independently of universe size
- Remains meaningful at 500 or 50,000 symbols

### Operational State

Information required to understand or troubleshoot the Evidence Service. Consumed by engineers or operators in diagnostic mode.

| Category | Examples |
|----------|---------|
| Scheduler activity | "Cycle #47 · batch 3/10" |
| Acquisition planner | "XLE chain fetch in progress" |
| Work queue | "7 symbols remaining this batch" |
| Provider pacing | "0.9 req/sec · 42/60 budget used" |
| Cache statistics | "312 entries · 78 chain hits" |
| Retry state | "COPX: attempt 2/3 · last error: timeout" |
| Request lifecycle | "GET chains XLE → 200 (340ms)" |
| Generation publication | "Generation 1847 published 2s ago" |

**Consumed by:**
- Labs & Diagnostics
- Administrative views
- Engineering tools
- Backend status API

**Characteristics:**
- Answers "is the system working correctly?"
- Answers "why is evidence stale for this symbol?"
- Requires understanding of acquisition mechanics
- Describes process, not market state
- May not scale meaningfully at very large universe sizes

---

## The Distinction in Practice

| Operator question | Answer source | UI layer |
|-------------------|--------------|----------|
| "Can I make decisions now?" | Observable State | Write Desk |
| "Is this evidence current?" | Observable State | Write Desk |
| "Why is COPX still pending?" | Operational State | Diagnostics |
| "What's the acquisition rate?" | Operational State | Diagnostics |
| "Is the system healthy?" | Observable State (summary) | Write Desk |
| "What's the provider error rate?" | Operational State | Diagnostics |

---

## Relationship to Backend-Owned Acquisition

Backend-owned acquisition naturally shifts the frontend from process-oriented to state-oriented:

| Architecture | Frontend model | Operator sees |
|-------------|---------------|---------------|
| Browser owns acquisition | Process-oriented | "Scanning... pass 7" |
| Backend owns acquisition | State-oriented | "Evidence: current · 489/496" |

When acquisition happens inside the browser, process details leak into the UI because they ARE the UI thread. When acquisition moves to the backend, the browser genuinely doesn't know (or need to know) what internal step is executing. It knows the current evidence state. That's what it should present.

---

## Relationship to Evidence

Evidence is the primary architectural asset. The system pipeline:

```
Providers (Tradier, future others)
    ↓
Evidence Service (acquires, maintains, publishes)
    ↓
Evidence (the shared operational fact base)
    ↓
Wheelwright (applies policy to evidence → recommendations)
    ↓
Recommendation Set Analysis (observes population characteristics)
    ↓
Decision Workspace (operator makes choices)
    ↓
Broker Handoff (execution)
```

Observable State tells the operator about the **quality and freshness** of Evidence.

Operational State tells engineers about the **mechanics** of producing Evidence.

---

## Scan as Transitional Artifact

"Scan" exists because the browser used to own acquisition. It was the operator's way of saying "start the process."

In a state-oriented system, the question is not "have I scanned?" but "is my evidence current?"

Future implementations should evaluate whether operator actions become **evidence-state actions**:
- "Show me current evidence" (already satisfied by opening Write Desk)
- "Refresh this symbol" (nudge, not initiation)
- "Tell me how fresh this is" (freshness indicator)

Rather than **acquisition actions**:
- "Start scanning" (process-oriented)
- "Wait for completion" (process-oriented)
- "Check if scan finished" (process-oriented)

---

## Scalability

| Concept | At 496 symbols | At 50,000 symbols |
|---------|---------------|-------------------|
| "Scan complete" | Achievable (~20 min) | Unachievable (never finished) |
| "Evidence current" | Meaningful | Meaningful |
| "Pass 7 of 20" | Understandable | Meaningless |
| "Top 20 fully evidenced" | Meaningful | Meaningful |
| "97% coverage" | Meaningful | Meaningful |
| "Acquisition health: active" | Meaningful | Meaningful |

State-oriented concepts scale. Process-oriented concepts don't.

The principle: design for concepts that remain honest and useful as the system grows, rather than concepts that work only at current scale.

---

## Information Layers

The system should present information at appropriate abstraction levels:

**Layer 1 — Operator glance (Write Desk header):**
```
● Evidence current · 489/496 · 2 min ago
```

**Layer 2 — Expanded context (disclosure or hover):**
```
Ready: 489 | Absent: 80 | Pending: 7 | Failed: 0
Session: REGULAR_OBSERVATION · Jul 16
Last evidence: 10:42:17 ET
```

**Layer 3 — Full diagnostics (Labs / Admin):**
```
Scheduler: acquiring · cycle #47 · batch 3/10
Current: ARKQ (chain fetch)
Queue: 7 remaining · Pacer: 0.9 req/sec
Cache: 312 entries · Provider: 42/60 this minute
Generation: 1847
```

The operator always HAS access to Layer 3. They just don't see it by default. Process detail belongs in diagnostics, not in the decision surface.

---

## Cross-References

| Document | Relationship |
|----------|-------------|
| `14-background-acquisition-design.md` | Backend acquisition makes state-oriented UI natural |
| `09-backend-evidence-service-design.md` | Evidence Service owns process; Write Desk observes state |
| `foundations/recommendation-set-analysis.md` | Population-level observation is inherently state-oriented |
| `foundations/market-priced-risk.md` | Market pricing context is state, not process |
| `foundations/conditioned-operating-opportunity.md` | Lifecycle quality is state assessment |
| `07-architecture-current.md` | Write Desk as "operator workbench" — evolving toward state observer |
| `07c-adrs.md` ADR-005 | Progressive disclosure aligns with information layers |

---

## Open Questions

1. **What is the minimum Observable State for Write Desk?** Evidence freshness + coverage + session + health? Or less?

2. **Should Observable State be a formal API contract?** If future clients (Scriptable, mobile) consume it, should `GET /api/evidence/snapshot` evolve into an Observable State endpoint?

3. **Where is the boundary between "operator health" and "operational diagnostics"?** A green/yellow/red indicator is operator-level. The reason it's yellow might be diagnostic-level.

4. **Should Operational State be hidden by default or merely de-emphasized?** Current implementation shows telemetry inline. Future: move to a separate diagnostic surface entirely?

5. **Does the Recommendation Brief consume Observable or Operational state?** Probably both — evidence provenance (Observable) and retrieval timestamps (borderline Operational).
