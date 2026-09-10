# Project Parking Lot — Continuation 8

> This file is a physical continuation of `docs/parking-lot.md` through `docs/parking-lot-7.md`. Together, all `docs/parking-lot*.md` files constitute **one logical Wheelwright parking lot**.

**Started:** September 9, 2026  
**Status:** Canonical Project / Operational State (Category C), same authority and governance as the preceding parking-lot files  
**Governing intake method:** `docs/foundations/idea-intake-reconciliation.md`

---

## Continuation Invariant

This is not a new backlog or namespace. Stable IDs remain global across the complete parking-lot sequence; row/file position is not priority; new material is reconciled against existing canonical concerns before a new identity is created.

---

## `PL-OPS-01` Refinement — Provider-Neutral Well-Architected Review / Render Reliability Fit

**Date:** September 9, 2026  
**State:** INTAKE refinement under existing `PL-OPS-01` Cloud Deployment / always-on; no new `PL-*` identity created  
**Related why-state:** `docs/journal/project-journal-3.md` — “Reliability classes before service boundaries”

### Intake

A reliability discussion following the September 9 observation-continuity incident asked whether Render has an equivalent of AWS Well-Architected. The useful result is not a new cloud strategy or an instruction to migrate platforms. It is a bounded architecture-review method and a concrete Render-specific failure characteristic that should be evaluated against Wheelwright's already-accepted cloud direction.

Canonical mapping:

> **Provider-neutral Well-Architected review / Render reliability fit → merged/refined into `PL-OPS-01`**

No new cloud-review `PL-*` identity is created. The concern belongs with the existing Cloud Deployment / always-on work because it asks whether the accepted Render topology satisfies Wheelwright's required operational characteristics.

### What was discovered

Render does not appear to publish one formal architecture-assessment framework directly equivalent to AWS Well-Architected. Its relevant guidance is distributed across platform documentation such as uptime best practices, shared responsibility, security/compliance, observability, deployment/recovery, and service-topology guidance.

Working hypothesis:

> **Wheelwright can use the AWS Well-Architected Framework as a provider-neutral review lens while grounding every answer in Render's actual capabilities and Wheelwright's actual failure modes.**

The AWS pillars—Operational Excellence, Security, Reliability, Performance Efficiency, Cost Optimization, and Sustainability—can function as a mature question set. AWS-specific mechanisms are not prescriptions. Each relevant question should instead resolve to one of:

- **Render-provided capability**;
- **Wheelwright-owned mechanism**;
- **explicitly accepted risk**;
- **demonstrated gap requiring experiment/design**.

This does **not** imply AWS adoption, AWS migration, AWS-specific architecture, or infrastructure complexity for its own sake.

### Concrete Render pressure against the accepted topology

Render documents that services with attached persistent disks can experience brief downtime during some infrastructure maintenance because the service must stop before its replacement starts; stateless services can remain available through that maintenance behavior.

Wheelwright's accepted Phase-1 cloud topology is deliberately simple:

```text
one Render Web Service
  └─ one Spring Boot process
       ├─ acquisition worker
       ├─ HTTP API
       └─ SQLite on attached persistent disk
```

The persistent-disk platform characteristic therefore intersects directly with the reliability why-state preserved earlier today: **Evidence Continuity may have a stronger reliability requirement than operator-facing consumption even before those concerns become separate deployed services.**

This is the first concrete platform-level pressure identified against that topology. It establishes a real failure mode worth examining. It does **not** establish that the topology is unacceptable, that SQLite should be replaced, or that acquisition/API should be split.

### Review discipline

A future bounded cloud review should:

1. start from Wheelwright's mission, accepted architecture, and observed failure modes;
2. use Well-Architected questions to expose risk rather than prescribe AWS mechanisms;
3. translate each relevant concern into Render capability, Wheelwright responsibility, accepted risk, or demonstrated gap;
4. prefer experiments/observed behavior where platform semantics or operational consequences are uncertain;
5. explicitly evaluate deployment, restart, maintenance, persistent-disk, process, provider, and recovery failure modes against time-sensitive evidence continuity;
6. preserve the Technology Quality Constitution rule that complexity must be earned;
7. change topology only if a required characteristic cannot be satisfied simply enough within the accepted topology.

### Relationship to the reliability-class exploration

The journal entry “Reliability classes before service boundaries” remains the why-state for the conceptual distinction. Its candidate characteristic was:

> **Evidence continuity isolation:** operator-facing activity and operator-facing change should not materially compromise Wheelwright's ability to maintain authoritative market evidence during time-sensitive acquisition windows.

The Render persistent-disk behavior strengthens the case for examining that characteristic because it identifies a platform-coupled failure domain shared by acquisition and operator access. It does not settle whether the correct remedy is acceptance, recovery behavior, in-process isolation, deployment scheduling, database/topology change, or eventual service extraction.

### Parking-lot disposition / mapping

**Retained as a refinement under existing `PL-OPS-01`.** `PL-OPS-08` remains distinct: it owns observation-continuity/gap detection and recovery semantics, while `PL-OPS-01` owns the cloud/always-on topology and therefore the provider-fit review. The reliability-class journal entry supplies cross-cutting why-state but does not itself become architecture authority.

### Next authorized mode

**Reconciliation / bounded architecture review only.** A future selected work session may perform the provider-neutral Well-Architected review of the accepted Render topology and produce explicit findings/experiments.

**Not authorized:** cloud migration, service extraction, database replacement, horizontal scaling, HA topology, new SLOs, infrastructure implementation, or any assumption that AWS mechanisms are the desired solution.

---

## `PL-DEPLOY` Refinement — Decision Surface: Expanded Row vs Drawer

**Date:** September 9, 2026
**State:** RECONCILED (discovery intake) under existing `PL-DEPLOY`; no new `PL-*` identity created; not authorized for implementation.
**Rich why-state:** `docs/discovery/decision-surface-expanded-row-vs-drawer-2026-09-09.md`
**Observed at:** SYNC `6786c1b` (v1 consequence section live + conformance-repaired), captured against `c8f24bd`.

### Epistemic caution (carry forward to Codex review)

> **Replacement unresolved does not mean problem uncertain.** Working software *falsified* the current narrow-drawer presentation for this comparison; it has *not* selected the replacement. Challenge unsupported promotion of the expanded-row/drawer hypothesis, but do not weaken the directly observed working-software failure because the replacement remains exploratory.

### Intake

Exercising the shipped `LVT-INIT-CONSEQUENCE-RELEASE-COST` v1 in the covered-call `CallBrief` drawer surfaced interaction-surface pressure. This is **reconciled as a refinement under existing `PL-DEPLOY`**, which already owns normalized alternatives, owned-capital decision paths, cross-strategy comparison, the unified deployment-surface direction, and release/retention consequence comparison. This discovery is interaction-surface pressure within that existing concern, so no new identity is minted. `PL-SURF-01` remains related but distinct (it governs result completeness/truncation, not this comparison/inspection problem).

### Observed (working-software evidence, not hypothesis)

The v1 consequence comparison (Sell / Hold / Covered Call across a shared owned-capital block) is **cognitively unusable in the current narrow contract-detail drawer**: the operator must read alternatives serially, hold them in working memory, and reconstruct a comparison that should be visually available. The information is intrinsically **alternatives × consequence dimensions** (two-dimensional); the drawer supplies vertical inspection territory and insufficient horizontal comparison territory. Moving the section up, reordering drawer content, and making the existing presentation more prominent all **fail to solve** this. The live software also exposed a **unit-of-interaction level mismatch**: the operator selects a contract, the drawer begins as contract inspection, but Sell/Hold/CC are alternatives on the shared capital block — so the surface silently crosses from contract-level inspection to capital-block-level decision comparison.

### Derived design pressure

Comparison and inspection appear to impose materially different spatial/cognitive requirements — comparison wants horizontal, simultaneously-visible territory; inspection is well served by the drawer's vertical territory.

### Leading interaction hypothesis (not ratified)

Comparison may belong in a **horizontal expanded-row region** beneath the selected candidate row, while selected-candidate inspection **remains in the drawer**. Useful design reasoning (hypotheses/heuristics, not durable rules): Sell/Hold as stable reference alternatives vs candidate-specific CC variants; the progressive-disclosure sequence *scan → expand → compare → inspect*; the sorting heuristic *compare-alternatives vs inspect-candidate*; a Tier-2 extension path that avoids table column explosion (future pressure only). Exact expanded-row design, the drawer's ultimate subject, and any enduring interaction architecture remain **unresolved**.

### Strategic disposition

**Strengthens existing `PL-DEPLOY` direction; no roadmap change; no new Bet.** Instantiates `foundations/cognitive-role-separation.md` and `foundations/visual-design-principles.md` (progressive disclosure) for the deployment surface, serving `LVT-BET-LIFECYCLE-CHOICES` (alternatives) and `LVT-INIT-CONSEQUENCE-RELEASE-COST` (consequences) where they meet the operator.

### Architectural disposition

**Refines existing `PL-DEPLOY` interaction-surface pressure; no architectural decision or implementation authorized.** Does not decide the drawer's ultimate subject; does not authorize CapitalState, a generalized decision/state-machine or multi-leg abstraction, a Tier-2 action-set build, a drawer redesign, scoring/ranking, or any code change. Does not claim the application/drawer must become position-centric.

### Parking-lot disposition / mapping

**Retained and refined under `PL-DEPLOY`.** Cross-links: `PL-SURF-01` (adjacent, distinct table-surface completeness), `LVT-INIT-CONSEQUENCE-RELEASE-COST` (the shipped feature that produced the evidence), `foundations/cognitive-role-separation.md`, `foundations/visual-design-principles.md`, and Fidelity Tier 2 (`PL-STRAT-01`) as future pressure only. The shipped v1 consequence section is unchanged and correct.

### Why-state

Preserved in `docs/discovery/decision-surface-expanded-row-vs-drawer-2026-09-09.md`, structured in explicit epistemic levels (observed failure → derived pressure → leading hypothesis → unresolved → not authorized) so the observation's strength is not softened into a placement concern.

### Next authorized mode

**Exploration / reconciliation only.** If selected, the smallest useful next step is a bounded design of the comparison surface (which facts earn horizontal comparison territory vs drawer inspection), reconciled against the open drawer-subject question, then normal decompose/authorize gates. No UI mutation until then.

---

## Continuation History

| Date | Event |
|---|---|
| Sep 9, 2026 | Provider-neutral Well-Architected / Render reliability-fit discovery reconciled as a refinement under existing `PL-OPS-01`. Preserves Render attached-persistent-disk maintenance downtime as concrete pressure against the accepted one-service topology while explicitly withholding any inference that service extraction, database replacement, HA, or AWS migration is required. |
| Sep 9, 2026 | Decision Surface (expanded row vs drawer) reconciled as a refinement under existing `PL-DEPLOY` from live-software discovery: the v1 consequence section falsified the narrow contract-detail drawer as the presentation for Sell/Hold/CC comparison across an owned-capital block, and exposed a contract→capital-block unit-of-interaction mismatch. Leading (unratified) hypothesis: horizontal expanded-row comparison + drawer inspection. Rich why-state: `docs/discovery/decision-surface-expanded-row-vs-drawer-2026-09-09.md`. No new `PL-*` id; no UI/implementation authorized; exact design held exploratory. |
