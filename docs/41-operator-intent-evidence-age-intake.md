# Operator-Intent Evidence Age / Acquisition-Tier Discovery Record

**Date:** September 1, 2026  
**Status:** Supporting discovery/intake evidence; canonical unresolved-work identity is `PL-EVID-AGE`  
**Authority:** Category E — Current Specialized Reference / discovery record; does not replace canonical parking-lot intake  
**Related:** `PL-EVID-AGE` in the complete `docs/parking-lot*.md` sequence; `docs/roadmap.md` G6/N1 Decision-value-aware evidence acquisition; `docs/40-provider-admission-controller-findings-2026-08-31.md`; `docs/architecture-roadmap.md`; `docs/foundations/idea-intake-reconciliation.md`

---

## Principal decision

The Principal has selected **operator-visible evidence Age on Deployment, followed by operator-intent-aware acquisition-tier design**, as the next Wheelwright workstream after the current regular-session constraint experiment.

The September 1 live experiment should continue unchanged through its planned end. This decision does **not** authorize additional scheduler optimization before the Age capability is understood and observed in normal operator use.

This document preserves the richer discovery record. The canonical stable intake identity is **`PL-EVID-AGE`**; roadmap and architectural placement remain subject to the standard reconciliation pipeline in `docs/foundations/idea-intake-reconciliation.md`.

---

## Triggering operating evidence

The September 1 mid-session mechanical cut showed that after opening Decision coverage reached 955/955:

- due WIP remained continuously positive;
- stable 30-minute provider request-start rates were roughly 117.4–118.63/min;
- about 89.9% of classified non-provider-service idle time while WIP was positive was attributable to the local 119-start/60-second admission budget;
- there were no 429s, provider backoff events, or request failures in the cut;
- oldest-WIP proxy settled in a stable band near 1,632–1,638 seconds while Decision coverage stayed complete.

This is strong evidence that Wheelwright has reached a useful provider-bound operating regime under the present workload. The immediate optimization question therefore shifts from primarily **"how do we fill the pipe?"** toward **"what deserves the constrained provider capacity?"**

This does not by itself identify Herbie or prove the feed is optimized.

---

## Core capability thesis

Wheelwright should treat provider observations as a scarce information budget and allocate them according to **business intent and probable operator demand**.

Infrastructure optimization remains necessary: the provider layer should be simple, reliable, contract-respecting, and near its practical throughput envelope. Above that layer, acquisition priority should reflect the relative usefulness of operator-facing information products rather than uniform freshness or endpoint-level TTLs detached from operator intent.

The intended causal direction is:

> **information-product / row quality → probable operator interest → acquisition tier / priority → achieved freshness**

Age should ideally be an **outcome** of that allocation, not a factor that makes an otherwise low-value row high quality merely because it became old. A separate maximum-age validity boundary may still be necessary.

### Concrete operator example

On Deployment put tables, the operator often sorts premium descending. A row offering approximately 100% premium is materially more interesting than one offering approximately 2%. The low-premium row should not consume equal freshness budget merely because it is old.

This demonstrates that information usefulness is contextual to operator intent rather than intrinsic to the endpoint, contract, or raw datum.

---

## Candidate acquisition model: return to tiers

The emerging thesis is to return to acquisition tiers, but base tier membership on **probabilistic operator behavior / decision relevance**.

The design question is not simply which data type is important. It is:

> **What are operators most likely to care about next, what are they least likely to care about, and how should that probability parameterize tier priority?**

The project should investigate contextual signals that change probable operator demand and the cost of stale information. Candidate signals may include row quality/rank, active sort/filter context, visibility, held-position state, workflow stage, and other decision semantics supported by actual operator behavior.

Do not prematurely collapse these dimensions into a scalar utility score. Do not authorize scheduler-policy changes until the model is understood well enough to test deliberately.

Priority should conceptually propagate backward:

> **operator behavior → information-product importance → evidence requirements → acquisition tiers → provider requests**

rather than beginning with provider endpoints and assigning arbitrary TTLs.

---

## Immediate product requirement: Deployment Age

Before further acquisition/scheduler optimization, add an **Age** column to **each table on the Deployment page**.

Console may eventually expose age for diagnostic reasons, but it is materially less important there. Deployment is the immediate operator-facing scope.

The Age column must answer:

> **How old are the market observations from which this displayed row was calculated?**

It must **not** mean:

- UI render age;
- time since the row object was emitted;
- merely the time since recommendation/decision recomputation.

For a row derived from multiple market observations, the current conservative semantic to evaluate is:

> `Age = now - oldest observation timestamp among the market evidence actually used to produce the displayed row`

This is a working semantic for the 3AM design discussion, not an instruction to implement blindly. Kiro must first inspect the current evidence/provenance architecture and determine whether Wheelwright can support this definition truthfully and consistently for every Deployment row type.

The visible presentation should be compact and sortable (for example seconds/minutes). Richer provenance or component-age detail may belong behind progressive disclosure if useful.

---

## Why Age comes before further optimization

Age is not primarily intended as a new ranking or row-quality factor.

It is **operator-facing instrumentation** that allows running Wheelwright to generate real-world feedback about whether finite provider capacity is being spent on the information the operator actually values.

Initial Age visibility should therefore be observational. Displaying Age must not itself change acquisition priority.

Normal operator use can then expose observations such as:

- high-quality rows the operator repeatedly evaluates are older than expected;
- low-quality rows remain very fresh despite little operator interest;
- some classes of rows tolerate substantial age without reducing usefulness;
- other rows require significantly tighter freshness to remain trustworthy.

Those observations should inform later tier semantics and freshness SLOs.

A successful future allocation may intentionally produce younger high-value rows and older low-value rows. Uniform freshness is not the goal.

---

## Optimization transition

The current investigation has exposed an important transition in Wheelwright's optimization problem:

1. **Infrastructure optimization** — use the external provider envelope efficiently and reliably.
2. **Business-intent optimization** — allocate that constrained envelope toward the information most useful to operator decisions.

Near-optimal provider throughput is still a goal, but only when constrained to information that operators care about. Efficiently focusing on the wrong things is not an optimized feed.

A stronger working definition is:

> **The feed is optimized when available provider capacity is allocated so as to maximize the usefulness of operator-relevant information products subject to the provider constraint.**

The project is not yet ready to claim this condition.

---

## Relationship to the strategic roadmap

This work appears to **strengthen and concretize** existing roadmap Bet **G6 / N1 — Decision-value-aware evidence acquisition**, whose current bet is that prioritizing finite acquisition capacity by decision relevance improves freshness of evidence that matters most.

This intake also deepens the roadmap's cross-cutting **Trustability** concern by making evidence age directly visible on a primary operator decision surface.

At this point a wholly new strategic Bet is not presumed necessary. Kiro should reconcile `PL-EVID-AGE` against `docs/roadmap.md`, `docs/architecture-roadmap.md`, the complete `docs/parking-lot*.md` sequence, and project-memory/journal evidence before deciding what durable roadmap or architecture changes are warranted.

---

## Required 3AM / Kiro discussion

Before implementation, Kiro should bootstrap from repository authority and inspect current Deployment construction, evidence provenance/timestamps, existing acquisition tiers/scheduler semantics, N1, relevant quality/differentiation material, architecture, parking-lot items, and implementation evidence where necessary.

The discussion should answer at least:

1. What exactly is the truthful evidence-Age semantic for each Deployment table row?
2. Can existing provenance support that semantic, or what minimal plumbing is missing?
3. Which Deployment tables or row types require distinct age semantics?
4. How should Age be exposed without allowing Age itself to become a row-quality/ranking input?
5. What operator behaviors plausibly predict information demand?
6. What is the relationship among row quality, probabilistic operator interest, acquisition tiers, and freshness SLOs?
7. Which existing tier concepts should be restored or reframed instead of inventing a new scheduler abstraction?
8. What should Wheelwright observe during normal operator use before any tier-policy optimization is authorized?

---

## Current authorization boundary

Authorized next work: **3AM design/reconciliation of `PL-EVID-AGE`, the Deployment Age capability, and its relationship to probabilistic operator-demand tiers.**

Not yet authorized by this intake:

- scheduler-policy changes;
- new acquisition-tier parameters;
- demand-aware prioritization implementation;
- scalar utility/importance scores;
- Age as a recommendation/ranking factor;
- further infrastructure optimization merely because residual scheduler-release time remains measurable.

The next implementation scope should be determined by the 3AM discussion and Principal decision after Kiro has reconciled current architecture and implementation truth.
