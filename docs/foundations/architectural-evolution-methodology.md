# Architectural Retooling Methodology

**Date:** July 2026
**Status:** Governing methodology — derived from Wheelwright retooling experience
**Related:** `closed-loop-engineering.md`, `retooling-charter.md`, `backend-behavioral-invariants.md`

---

## Purpose

This document records the engineering methodology for retooling a system's architecture without accidentally changing its behavior. It was derived from the Wheelwright backend retooling and scheduler repair work — not invented speculatively.

These principles should govern future architectural changes to Wheelwright and inform similar work on other systems.

---

## 1. Architecture Should Be Derived from Invariants

The preferred workflow for architectural retooling:

```
1. Observe existing implementation
2. Extract candidate invariants
3. Ratify invariants through operator review
4. Perform explicit conformance assessment
5. Modify implementation until it conforms
```

Each step produces a durable artifact:

| Step | Artifact |
|------|----------|
| Observe | Behavioral audit |
| Extract | Candidate invariant catalog |
| Ratify | Ratified invariants document |
| Assess | Conformance assessment with disposition per invariant |
| Modify | Implementation changes, each traced to a specific invariant |

**Why this order matters:** Invariants are defined before the implementation is examined for conformance. This prevents the existing implementation from silently becoming the standard merely because it exists.

The implementation is evidence. It is not authority.

The retooling charter established: "If the current implementation falls short of the documented architectural intent, the implementation is wrong — not the architecture."

---

## 2. Review Architecture, Not Code

Architectural review should challenge:

- guarantees (can the system actually deliver what it claims?)
- policies (are the stated rules consistent with each other?)
- assumptions (do the preconditions hold in production?)
- capacity calculations (does the math work at actual scale?)
- contradictions (are two requirements mutually exclusive?)
- terminology (does a term mean the same thing everywhere it appears?)

This is fundamentally different from code review, which examines correctness of specific logic paths.

**Examples from the scheduler work:**

- The 120-minute "maximum" was impossible under sustained Class A pressure. The guarantee was softened to an urgency threshold after capacity analysis proved it could not be a hard bound.
- Modulo-based service floors were replaced with service-debt tracking after discovering that transient modulo checks cannot durably guarantee obligations across batch boundaries.
- "~18-minute cadence" was rejected after verifying that the arithmetic required 810 calls (all capacity) for B alone, not the 690 available after A.
- "Sustainable capacity" was distinguished from "theoretical capacity" to avoid claiming a guarantee the system can only deliver when no other work is running.

---

## 3. Every Engineering Claim Requires Evidence

Implementation claims should be backed by at least one of:

- **Measurement** — actual values from the production system
- **Test** — deterministic proof that a behavior holds
- **Invariant** — a ratified statement that the system must satisfy
- **Proof** — logical derivation from known constants

Engineering confidence is proportional to evidence quality, not confidence of assertion.

**Prefer measurement over estimation when the system is available.**

Examples from the scheduler work:

| Claim | Evidence type | Result |
|-------|--------------|--------|
| "Class A population is ~300-500" | Measurement (production DB) | Exactly 324 |
| "Scheduler can meet 15-min target" | Proof (648 calls < 690 capacity) | Verified |
| "Publication doesn't fire without changes" | Test (idle-transition test) | Verified |
| "B floor provides ~3 symbols per 15 min" | Incorrect estimation | Corrected to ~40 by measurement |
| "Full B pass takes ~18 min" | Incorrect arithmetic | Corrected to ~23 min minimum, ~231 min under pressure |

The last two demonstrate why estimates are dangerous. The arithmetic was wrong in both cases and would have survived into production if not verified against exact calculations.

---

## 4. Ratified Invariants Are Authoritative

Once invariants are ratified:

- Implementation conforms to invariants (not the reverse)
- Documentation reflects invariants
- Future changes begin by modifying the invariant first, then the implementation

An invariant cannot be silently violated by:

- an implementation shortcut
- a performance optimization
- an expedient workaround
- a "temporary" behavior that becomes permanent

If an invariant must change, the change is proposed, reviewed, and ratified explicitly — the same process that created it.

Implementation is one source of evidence during invariant extraction. After ratification, it ceases to be authoritative and becomes subject to the ratified invariants.

The authority hierarchy remains:

```
Constitution (identity, principles)
    ↓
Behavioral Invariants (testable truths)
    ↓
Implementation (current code)
```

Implementation does not become authoritative merely because it exists or passes tests. It must also satisfy the ratified invariants.

---

## 5. Contradictions Are Architectural Findings

Discovering that two requirements are mutually incompatible is a **successful outcome** of architecture review — not a failure.

The objective is not to preserve every previous statement.

The objective is to eliminate impossible combinations.

**Examples from the scheduler work:**

- "15-minute freshness for all 940 ready symbols" contradicted "0.9 req/sec provider limit" at 2 calls per symbol (1,880 calls in 15 min requires 2.1 req/sec). The resolution was tiered freshness — not all symbols are equally important.

- "Publication freshness = evidence freshness" contradicted "re-publication does not renew evidence freshness." Frequent publication was not an acceptable substitute for actually refreshing evidence.

- "Full coverage = Current" contradicted "evidence from Friday is stale on Monday." The trust-state shortcut assumed completion was permanent rather than epoch-scoped.

Each contradiction produced a cleaner architectural statement once resolved.

---

## 6. Separate Domain Policy from Implementation

The scheduler's domain policy changed very little through multiple implementation revisions:

**Policy (stable):**
- Important evidence receives stronger freshness protection
- Background evidence is maintained slower, not abandoned
- Starvation prevention must be bounded and deterministic
- Publication does not manufacture freshness
- The backend owns scheduling

**Implementation (changed multiple times):**
- All-ready single-pass → rejected (35 min > 15 min target)
- Frontend-pushed priorities → rejected (violates backend-owns-scheduling)
- Modulo-based floors → replaced (non-durable obligation tracking)
- 120-min hard maximum → softened (cannot be guaranteed under pressure)
- Percentage-based capacity caps → replaced (conflicts with A-first objective)

The policy survived. The implementation converged toward it.

**Lesson:** When implementation repeatedly changes while policy remains stable, the policy is probably correct and the implementation is finding its final shape. When policy changes frequently, the domain understanding is still immature.

---

## 7. Emerging Patterns

The scheduler design revealed a generalized resource-allocation pattern:

```
Scarce resource (provider capacity)
    ×
Competing work (Class A, B, C, D)
    ×
Differentiated urgency (freshness targets per class)
    ×
Bounded neglect (anti-starvation floors)
    =
Policy-driven allocation with truthful reporting
```

This pattern may later appear in:

- API rate budget allocation across multiple consumers
- Cloud resource scheduling (compute, storage, bandwidth)
- Token allocation in AI-assisted workflows
- Organizational learning economics (allocation of attention, experimentation, and evidence acquisition)

**Do not prematurely generalize.** The pattern has been observed once, in one concrete implementation. That is sufficient to record the insight but not sufficient to build a framework. Framework design should wait until at least two or three additional concrete implementations reinforce the pattern.

If a second subsystem independently discovers the same structure — scarce capacity, competing classes, differentiated targets, bounded neglect — that would justify extracting a shared abstraction. Until then, the scheduler policy document is the authoritative specification and this observation is merely a note for future recognition.

---

## Relationship to Closed-Loop Engineering

This methodology complements `closed-loop-engineering.md`:

- Closed-loop engineering governs **new development** (spec → implement → observe → learn → refine)
- Architectural retooling methodology governs **changing existing systems** (observe → extract invariants → assess conformance → retool)

Both share the principle that working software produces evidence, and evidence improves understanding. The difference is whether you are building something new or changing something that already exists.

Retooling is successful when architectural understanding improves, regardless of whether the resulting implementation becomes simpler or more complex. The objective is not merely better code. The objective is better architecture.
