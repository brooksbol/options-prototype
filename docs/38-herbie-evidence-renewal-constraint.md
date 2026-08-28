# Herbie: Evidence-Renewal Capacity as the Current Constraint

**Date:** August 28, 2026  
**Status:** Operator-ratified optimization discipline + candidate empirical constraint finding. Theory of Constraints is the governing method for optimizing a constrained Wheelwright system; the identification of the *current* Herbie remains evidence-derived and must move when the constraint moves. No runtime/code/config/universe change is authorized by this record.  
**Classification:** Capacity / temporal-service coherence / universe-governance finding.  
**Related:** PL-COHERE-01, PL-EVID-07, PL-GOV-02, `docs/35-evidence-decision-temporal-coherence.md`, `docs/36-temporal-contract-design-brief.md`, `docs/37-console-sparkline-temporal-evidence-finding.md`, Aug. 27 universe-governance ruling, Aug. 28 opportunity-history plane.

---

## 1. Operator Ruling: Optimize Wheelwright as a Constrained System

Wheelwright is to be optimized using the Theory of Constraints rather than by independently tuning locally visible metrics.

The governing sequence is:

1. **Identify the constraint (Herbie).** Find the resource/capacity that limits the system's promised outcome.
2. **Exploit the constraint.** Ensure constrained capacity is spent on the work that most advances Wheelwright's objective; eliminate avoidable waste at the constraint before adding capacity.
3. **Subordinate everything else.** Universe breadth, topology, scheduler priorities, discovery/requalification work, temporal promises, and other upstream/downstream behavior must respect the constraint instead of flooding it with work or manufacturing comforting local metrics.
4. **Elevate the constraint.** Only after exploitation/subordination should Wheelwright increase the constraint's capacity through provider pacing, concurrency, acquisition shape, caching, request structure, infrastructure, or other justified changes.
5. **Repeat.** Once the constraint moves, stop optimizing the old Herbie and identify the new one.

This is a system-optimization discipline, not permission to make the current graph look better. The objective is trustworthy Wheelwright behavior under the declared operating contract.

A critical corollary:

> Do not optimize a non-constraint merely because it is easy to measure, and do not remove high-value work merely because it is expensive at the constraint.

A heavy multi-expiration symbol may consume materially more renewal capacity than a one-surface symbol while also producing materially more useful opportunity. TOC does not imply "remove the heavy hikers"; it implies allocate scarce constraint capacity according to system value and governing obligations.

---

## 2. Empirical Trigger: August 28 Production Observation

A frozen, read-only production observer ran from approximately 12:24:45 MDT through 13:59:59 MDT on August 28, 2026, taking 21 complete samples at roughly five-minute wall-clock boundaries.

The observer's raw bundle was produced outside the repository at:

`/Users/bollich/wheelwright-history-observer-2026-08-28`

The measurement method used raw `/api/status` snapshots plus read-only SQLite queries. Historical acquisition burden was deduplicated by `(symbol, expiration, chain_retrieved_at)`. Production-history analysis used the truthful-provenance boundary at generation 17110 / 2026-08-28T17:46:40Z. Per-symbol files retained factual dimensions; no usefulness score was computed.

Measured freshness summary:

| Surface | Start | End | Low | High |
|---|---:|---:|---:|---:|
| Decision | 97.27% | 73.69% | 64.15% | 98.64% |
| Whole multi-DTE | 82.81% | 10.94% | 10.94% | 100.00% |
| Monitored positions | 87.50% | 100.00% | 75.00% | 100.00% |

During the same observation:

- provider pacer rejections remained `0 -> 0`;
- scheduler acquisition failures remained `0 -> 0`;
- the opportunity-history plane continued accumulating;
- end-of-window deduplicated underlying acquisitions were 6,341;
- the represented population was 954 symbols;
- the union topology was 1,311 distinct `(symbol, expiration)` surfaces;
- CSP and buy-write each retained 6,341 strategy observations.

These measurements establish trajectories and represented evidence work. They do **not** establish exact vendor billing/API-call burden, a pruning rule, a membership usefulness score, or justified symbol removals.

---

## 3. Candidate Herbie

The strongest current candidate for Herbie is **effective evidence-surface renewal capacity relative to the topology and temporal validity promises imposed on it**.

This is deliberately phrased as a capacity, not a single code component.

The operational question is not merely "how many requests can Tradier accept?" or "how many tickers are in the universe?" It is:

> At the achieved acquisition/service rate, how much governed evidence surface can Wheelwright renew before the evidence required by each obligation crosses its validity boundary?

The August 28 observation supports this candidate because the system continued doing substantial acquisition work with no reported pacer rejections or acquisition failures while parts of the promised evidence surface nevertheless aged out of admissibility.

Decision is therefore best treated as a **downstream symptom surface**, not automatically as the constraint itself. Provider health is likewise not equivalent to Evidence-service sufficiency.

**Epistemic boundary:** this is the strongest current candidate Herbie, not a permanent architectural truth. Future evidence may identify a more specific bottleneck or show that the constraint moved.

---

## 4. Why Ticker Count Hides the Constraint

The August 28 production history represented 954 symbols but 1,311 distinct symbol-expiration surfaces.

The interrupted Kiro analysis of the observer bundle found a strongly bimodal topology: approximately 890 symbols represented a single maintained expiration while the 64-symbol multi-DTE population carried the additional multi-expiration topology. This is consistent with the existing 64-symbol `multiDteSurface` population and with the Aug. 27/28 architecture direction that capacity should be reasoned about in decision surfaces, not ticker count.

This Kiro-derived topology characterization is useful but should remain **derived analysis** until its exact query/thresholds are reproducibly captured. The durable measured facts remain the 954-symbol / 1,311-surface union and the raw observer bundle.

The important architectural implication survives without the derived split:

> One ticker is not necessarily one unit of constrained servicing work.

Universe governance must therefore reason about maintained topology and observed renewal burden, not only symbol membership count.

---

## 5. Three Freshness Surfaces, Three Behaviors

The 21-sample trajectory demonstrates that "freshness" is not one scalar system property.

### Decision breadth

Decision remained in the mid/high 90% range for much of the observation, then entered a sustained late-session decline before partially recovering. The interrupted Kiro analysis traced the Decision validity window to 1,800 seconds (30 minutes) and observed scheduler oldest-age values eventually exceeding that window while the stale-symbol population expanded.

**Candidate mechanism:** effective renewal cadence could not continuously revisit the full Decision population inside the 30-minute admissibility window under the observed workload.

This is a tighter hypothesis than "freshness got worse," but causal attribution remains subject to reproducible telemetry analysis.

### Whole multi-DTE completeness

Whole multi-DTE freshness repeatedly approached 100% and then fell sharply, producing a sawtooth unlike Decision. The interrupted Kiro analysis found a roughly 25–30 minute renewal-wave pattern in the 64-symbol multi-DTE cohort.

**Candidate mechanism:** cohort/batch renewal plus validity-boundary crossing produces oscillating whole-surface completeness. This is distinct from the progressive late-session Decision aging tail.

### Monitored positions

Monitored freshness remained strongly protected, ending at 100% and spending most observations fully current despite deterioration elsewhere.

This strengthens the architectural principle already recorded on Aug. 27:

> Existing capital exposure is an independent protected obligation; its servicing capacity is non-borrowable by ordinary active-universe work.

The observation supports the **principle**. It does not by itself ratify every detail of the current scheduler implementation.

---

## 6. TOC Interpretation of the Current System

Under the current candidate-Herbie model:

- **Constraint / Herbie:** effective evidence-renewal capacity under the declared temporal contract.
- **Work inventory/WIP before the constraint:** due/stale evidence surfaces awaiting renewal.
- **Downstream symptom:** evidence crosses consumer validity boundaries and disappears from admissible Decision coverage.
- **Heavy work:** symbols carrying multiple maintained expirations/surfaces.
- **Protected work:** monitored-position obligations, which receive preferential service because capital is already exposed.
- **Locally healthy but system-insufficient condition:** provider and scheduler failure counters can remain healthy while governed-surface coverage degrades.

The result is a classic constrained-system pattern: the system is busy and productive, yet the back of the troop stretches out because the constrained service cannot renew every promised obligation simultaneously within its required interval.

---

## 7. Optimization Consequences

### 7.1 Exploit before elevating

Before increasing provider rate or adding infrastructure, measure where constrained renewal capacity is spent and whether each unit of burden earns its place in the governed surface.

The live opportunity-history plane exists for precisely this phase: retain -> accumulate -> analyze -> govern.

Useful factual dimensions include:

- distinct evidence acquisitions by symbol/expiration;
- maintained expiration topology;
- qualified/actionable/edge/wait/no-opportunity outcomes;
- CSP versus buy-write contribution;
- liquidity/economic dimensions already retained;
- temporal recurrence of useful versus evaluated-non-opportunity states.

Do not collapse those dimensions prematurely into an opaque usefulness score.

### 7.2 Subordinate universe and scheduler to the constraint

A universe that creates more required renewal work than Herbie can carry inside the declared validity contract is not "more complete." It is an overcommitted service promise.

Possible future subordinate actions may include:

- smaller or tiered active-universe commitments;
- selective expiration maintenance where extra topology has demonstrated value;
- separate discovery/requalification budgets;
- explicit degraded-state semantics when the promise cannot currently be met;
- priority rules that protect monitored capital exposure and other ratified obligations.

None of these is selected or authorized by this finding.

### 7.3 Elevate only when justified

If the governed workload still exceeds the desired capacity after exploitation/subordination, then elevate Herbie. Candidate levers include provider pacing, concurrency, acquisition request shape, caching/reuse, provider profile, or infrastructure.

Do not assume the provider is the constraint merely because it is upstream of acquisition. The August 28 run recorded zero reported pacer rejections while coverage degraded.

### 7.4 Repeat when Herbie moves

If renewal capacity is elevated or workload is reduced enough that another subsystem becomes limiting, Wheelwright must stop optimizing the old bottleneck. The method is intentionally iterative.

---

## 8. Universe Governance: What TOC Changes and What It Does Not

This finding strengthens the need for governed carrying capacity but **does not authorize pruning**.

The correct question is not:

> Which symbols are expensive?

It is:

> Which workload consumes the scarce renewal capacity, what system value does that workload produce, what obligations are protected, and what is the lowest-demonstrated-opportunity-cost work that can be removed or demoted if carrying capacity must be reduced?

This preserves the Aug. 28 opportunity-history purpose and the Aug. 27 rule that evaluated failure is not the same as not evaluated.

The interrupted Kiro analysis suggested that expensive multi-DTE symbols were overwhelmingly productive rather than obviously wasteful. Because that classification depended on analyst-defined cheap/expensive/useful thresholds that were not durably captured, it is **not ratified evidence**. It is a reason not to make a simplistic "multi-DTE is expensive, therefore prune it" move.

PL-GOV-02 remains downstream of this work: candidate admission/replacement needs the eventual evidence-grounded workload policy; it must not invent one.

---

## 9. Trust Consequence

The August 28 observation narrows what Wheelwright can presently claim.

It is reasonable to trust that Wheelwright can acquire and retain production evidence and that a current recommendation is an evidence-backed candidate for operator review. The observation also materially increases confidence in protected monitored-position servicing.

It is **not yet reasonable to treat silence from Decision as proof that no better opportunity exists across the promised governed surface** when Decision coverage itself can degrade substantially.

The remaining trust gap is therefore not simply acquisition correctness. It is the system's ability to truthfully state whether its promised decision surface is sufficiently covered at the moment it presents conclusions.

This reinforces, but does not yet ratify the exact mechanism proposed in `docs/36-temporal-contract-design-brief.md`: evidence coverage/validity and Decision admissibility need an explicit cross-subsystem service contract, including truthful degraded semantics.

---

## 10. What Is Ratified vs. Still Candidate

### Operator-ratified discipline

- Optimize Wheelwright as a constrained system using Theory of Constraints.
- Find Herbie before optimizing locally visible components.
- Exploit -> subordinate -> elevate -> repeat.
- Treat protected obligations honestly rather than borrowing their capacity to improve a broad metric.
- Do not remove expensive work without considering the value produced by that work at the system objective.

### Strong candidate findings

- Current Herbie is effective evidence-surface renewal capacity relative to topology and temporal validity promises.
- Decision late-session degradation is consistent with renewal cadence exceeding the 30-minute Decision validity interval for a growing tail of the population.
- Multi-DTE sawtooth is a distinct cohort-renewal/completeness phenomenon rather than the same mechanism as Decision's late-session decline.
- Provider-health counters are insufficient as a system-level evidence-service health claim.
- Freshness/readiness is at least multi-dimensional across Decision breadth, whole-surface completeness, protected operational observation, and historical observation density.

### Still unresolved

- Numerical carrying capacity.
- Exact sustainable active-universe/surface budget.
- Exact causal bottleneck inside effective renewal capacity.
- Exact Production temporal contract and degraded-state semantics.
- Final A/B/C/D semantics.
- Which expirations earn selective maintenance.
- Any usefulness score or pruning policy.
- Any justified symbol removal.
- Whether the current scheduler shape should be ratified.

---

## 11. Next Analysis When Work Resumes

Do **not** change scheduler, universe, pacer, or the observation instrument merely to improve the visible percentages.

The next analytical objective is:

> Given the observed provider pace, effective acquisition completion rate, maintained symbol-expiration topology, scheduler obligations, and temporal validity contract, what governed evidence surface can Wheelwright sustain continuously at an explicit service level?

Use the existing August 28 observer bundle and accumulated opportunity history first. Reproduce any Kiro-derived claims from raw data before promoting them to durable facts.

Only after carrying capacity and workload value are understood should Wheelwright choose whether to exploit/subordinate the workload, elevate renewal throughput, alter temporal promises, or combine those actions.

---

## 12. Disposition

**Record the finding; preserve the regime.**

No code, scheduler, pacer, universe, Decision, or evidence-schema changes are authorized by this document. The opportunity-history instrument remains valuable precisely because it is accumulating ordinary operating history under the current regime.

This finding extends the architecture investigation from "freshness/coherence defect" to "constrained-system optimization discipline." It does not supersede Findings #1/#2 or the temporal-contract brief; it supplies the system-level optimization lens under which those findings, universe governance, and future capacity work should be reconciled.
