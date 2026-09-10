# Options Prototype — Project Journal, Continuation 3

> Logical continuation of `docs/journal/project-journal.md` and `docs/journal/project-journal-2.md`.
>
> The project journal is one append-only Category C chronology across physical continuation files. This file preserves the same authority, purpose, chronology, and journal rules.

---

## 2026-09-09 — Reliability classes before service boundaries

### Context

A service outage prompted the Principal to revisit Wheelwright's future cloud reliability model. The initial intuition was not to decompose Wheelwright broadly into microservices, but to ask whether different parts of the system deserve different reliability levels or failure domains.

The concrete example was the market-evidence path: a relatively feature-stable component dedicated to gathering market information, especially during open sessions, and keeping the durable evidence store populated. A second component might eventually expose the APIs needed by the frontend. The motivation was continuity of market truth rather than service decomposition for its own sake.

### Repository reconciliation

Current authority already establishes several relevant facts:

- Wheelwright is an always-on evidence appliance.
- Evidence acquisition operates independently of browser sessions.
- The backend is the single acquisition authority and owns provider communication, session-aware scheduling, evidence maintenance, persistence, and validity.
- Current accepted cloud direction is deliberately simple: one always-on Spring Boot service, one instance, SQLite on persistent disk, acquisition worker and HTTP API in the same process.
- The retooling charter and Technology Quality Constitution both require new services, infrastructure, topology, and complexity to be earned by demonstrated architectural pressure rather than introduced speculatively.

The reliability discussion therefore does **not** currently justify changing the accepted cloud topology.

### Emerging perspective

The durable observation is that Wheelwright may have materially different **reliability classes** before it has different deployed services.

A useful exploratory decomposition is:

1. **Evidence Continuity** — provider acquisition, session scheduling, normalization, freshness/validity maintenance, and durable persistence. Failure here can degrade Wheelwright's authoritative model of the market and is especially consequential during time-sensitive market windows.
2. **Evidence Consumption / Application Access** — snapshot, quote, status, production, and other operator-facing APIs. Failure here may temporarily prevent consumption of current evidence without necessarily requiring evidence maintenance itself to stop.
3. **Operator Experience** — browser UI, visualization, recommendation presentation, drawers, and workflow affordances. Failure here should ideally not threaten maintained market evidence.

These names and boundaries are exploratory vocabulary, not ratified architecture.

### Candidate architectural characteristic

The conversation exposed a possible technology-quality characteristic worth testing:

> **Evidence continuity isolation:** operator-facing activity and operator-facing change should not materially compromise Wheelwright's ability to maintain authoritative market evidence during time-sensitive acquisition windows.

This is not yet a formal invariant, SLO, fitness function, ADR, or requirement. It is an architectural hypothesis whose usefulness depends on evidence.

### Important non-conclusion

The discussion explicitly rejected the inference:

> evidence acquisition is more important, therefore it should immediately become a separate microservice.

The current single-process architecture may already provide sufficient practical isolation. A JVM/process/service boundary is justified only if evidence shows that the existing topology cannot satisfy the required reliability characteristic with reasonable simplicity.

Examples of useful future failure-mode questions include:

- Can heavy or pathological frontend/API traffic materially delay acquisition scheduling?
- Can repeated operator-endpoint failures destabilize the acquisition worker?
- Can slow API work, thread exhaustion, memory pressure, or serialization behavior interfere with evidence continuity?
- Does ordinary operator-facing deployment churn force avoidable restarts of time-sensitive evidence acquisition during open sessions?
- Can the system degrade operator access while continuing to preserve and update market truth?

These are candidate experiments and observations, not assumed defects.

### Decision condition for future extraction

If future cloud/runtime evidence demonstrates that API/UI workload, deployment churn, or other operator-facing concerns can materially interrupt evidence continuity, then extracting a small, stable evidence-maintenance service may become an **earned** service boundary.

If the current one-service architecture survives those pressures cleanly, retaining one service is preferable because it preserves SQLite simplicity, single acquisition authority, and low operational overhead.

The governing sequence is therefore:

```text
identify differentiated reliability requirement
→ observe concrete failure modes / interference
→ determine whether current topology satisfies the requirement
→ improve in-process isolation first where simple and sufficient
→ introduce a process/service boundary only if evidence demonstrates the need
```

### Relationship to the system goal hierarchy

Reliability at the acquisition layer is not an end in itself. It matters because machinery exists to produce current, trustworthy evidence; that evidence supports useful decision products; those products support operator decisions; and those decisions ultimately serve the productive-capital and household mission.

This preserves the distinction between protecting a critical capability and locally optimizing infrastructure for abstract uptime.

### Status

**Exploration / why-state only.**

No ADR, cloud-topology amendment, new service, new infrastructure technology, or implementation work is authorized by this entry. The perspective is preserved so future cloud and technology-quality work does not have to rediscover the distinction between reliability classes and deployment boundaries.