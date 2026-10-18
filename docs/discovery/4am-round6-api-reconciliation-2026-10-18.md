# Wheelwright — 4AM Round 6 Reconciliation
**Codex + Kiro | REST API Architectural Assessment**

We now have both independent assessments. The central finding is encouraging:

**V2's foundation is largely sound. Its financial-domain resource model needs correction before we extend it substantially.**

Neither actor recommends replacing v2.

More importantly, both have independently identified the same structural weakness.

## 1. Where the actors agree

| Area | Codex | Kiro | Reconciliation |
|---|---|---|---|
| V2 foundation | Sound evidence and authorization | Sound infrastructure | **Agreement** |
| Position identity | Incomplete | Structurally inadequate | **Agreement** |
| Canonical Contract | Missing | Missing | **Agreement** |
| Governed quantities | Cannot represent split holdings | Same | **Agreement** |
| Broker abstraction | Incomplete | Fidelity vocabulary leaks | **Agreement** |
| Shared conventions | Fragmented | IDs, time, provenance inconsistent | **Agreement** |
| API replacement | Not warranted | Not warranted | **Agreement** |
| Portfolio-first delivery | Supported | Supported | **Agreement** |

**The 250-share SPY specimen is the clearest architectural falsifier.** The current model cannot represent 100 shares governed by one program and 150 by another without changing its Position relationships.

That is a domain-model deficiency, not simply an implementation defect.

## 2. Where they differ

### A. Resource topology

Codex is more critical of acquisition-oriented public resources such as `/position-acquisitions`.

Kiro argues that process resources can be legitimate REST resources when they have meaningful identity and addressability.

Both positions have merit.

The architectural question isn't whether an acquisition resource is inherently forbidden. It's whether acquisition is an independently meaningful Product resource or merely an implementation workflow exposed because it was convenient.

**My recommendation:** Preserve explicit operational resources where justified, but don't let them determine the public financial-domain model.

### B. What should happen first?

Codex emphasizes correcting Position, Contract, and quantity semantics before expanding portfolio capabilities.

Kiro agrees on those dependencies but identifies **Accounts** as a capability that can progress independently.

I favor Kiro's sequencing distinction.

We don't need to hold up Account balances and regime reporting while resolving Position identity.

That gives us an opportunity to continue delivering working software while the structural design is reconciled.

### C. How broad should remediation be?

Kiro proposes one structural remodel and one conventions pass.

Codex identifies additional financial-domain concerns involving history, capital, provenance, authorization, and resource composition.

These aren't necessarily competing proposals.

Kiro is describing the likely implementation work.

Codex is describing the architectural boundaries that must remain coherent as implementation proceeds.

**The comprehensive review is complete enough to establish direction.** The remediation scope should follow demonstrated problems rather than assume every observation requires redesign.

---

# 3. Proposed architectural correction

I would organize the work around two connected outcomes.

### Outcome A — Coherent financial resource model

Establish:

- Canonical Contract identity.
- Position identity independent of brokerage holding-row identity.
- Quantity-qualified relationships.
- Explicit Account, Contract, Position, and governed-scope associations.
- Appropriate continuity semantics.

This is the principal structural correction.

It should satisfy Doc 82's existing specimens, not invent a new ontology.

### Outcome B — Consistent API conventions

Reconcile:

- Resource and identifier conventions.
- Temporal vocabulary.
- Provenance representation.
- HTTP creation and status semantics.
- OAS organization and runtime alignment.
- Brokerage-neutral financial vocabulary.

The result should be a coherent REST API that can grow without accumulating independently designed conventions.

These outcomes are architectural targets, not implementation authorization.

---

# 4. Portfolio-side delivery implications

| Capability | Planning disposition |
|---|---|
| **Accounts** | Can proceed independently of Position redesign |
| **History** | Can progress with bounded semantic and convention corrections |
| **Positions** | Requires Position/Contract identity reconciliation |
| **Live** | Depends on qualified Position semantics and appropriate economic evidence |
| **Portfolio** | Depends on compatible capital, quantity, and temporal meanings |
| **Production** | Requires trustworthy transaction normalization and attribution |
| **Reporting** | Builds on accepted financial measures and coverage |

This gives us a credible path to your objective of finishing the relatively straightforward portfolio capabilities.

It also allows useful parallelism without constructing competing domain models.

---

# 5. Operational findings that should not be lost

Kiro identified four concerns requiring separate attention:

1. **Dual acquisition authority:** Two backends reportedly share one Tradier production allowance without coordinated pacing.
2. **Network exposure:** V1 reportedly exposes unauthenticated API endpoints on all interfaces.
3. **2027 calendar:** Market-session classification lacks next year's holidays.
4. **Tastytrade session dating:** UTC receipt dates can misidentify the applicable market session.

These are operational correctness and security concerns, distinct from the REST resource-model review.

They should be tracked independently rather than allowed to disappear into the architectural work.

---

# 6. What I recommend next

We should stop commissioning broad assessments.

**The next 4AM activity should be a bounded architectural design session focused on the canonical financial resource model.**

Codex and Kiro should work from the existing Doc 82 candidate, your REST principles, and the identified falsification specimens.

The intended output is a concrete resource design showing:

- Proposed URI topology.
- Canonical resource identities.
- Relationships and cardinalities.
- How the 250-share split is represented.
- How close/reopen and partial reductions behave.
- How the model remains brokerage-agnostic.
- How existing accepted v2 capabilities survive the correction.

In parallel, Kiro's proposed Accounts pilot is a credible working-software increment, subject to your authorization.

That combination preserves your two priorities: **architectural integrity and delivery acceleration**.

---

**CURRENT STATE:** Round 6 assessments reconciled. Structural resource-model correction and conventions reconciliation identified as principal architectural work.

**DECISION REQUIRED:** NO

**NEXT AUTHORIZED ACTION:** Prepare a concrete Doc 82 resource-model design for Principal review; Accounts remains parked until separately authorized.
