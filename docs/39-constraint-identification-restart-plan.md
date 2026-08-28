# Constraint Identification Restart Plan — Kiro/Codex Measurement Campaign

**Date:** August 28, 2026  
**Status:** ACTIVE restart prescription. This is the first work to execute when Kiro credits become available.  
**Scope:** Problem-space analysis and measurement only. No optimization or production-behavior change is authorized by this document.  
**Related:** `docs/38-herbie-evidence-renewal-constraint.md`, `docs/35-evidence-decision-temporal-coherence.md`, `docs/36-temporal-contract-design-brief.md`, `docs/37-console-sparkline-temporal-evidence-finding.md`, `docs/prompts/kiro-constraint-identification.md`, `docs/prompts/codex-factory-floor-measurement.md`.

---

## 1. Why this document exists

Kiro credits are temporarily unavailable. When they return, the next session must not spend scarce reasoning capacity rediscovering the question, reconstructing an ambiguous plan, or writing routine measurement code that Codex can perform.

This record freezes the current epistemic position and prescribes the restart sequence in enough detail that a cold-started Kiro and a cold-started Codex can begin useful work immediately.

The governing intent is:

> Use Kiro for architectural investigation and interpretation. Use Codex for bounded mechanical measurement work wherever practical. Preserve Wheelwright's current behavior while the constraint is being identified.

This is a Theory of Constraints investigation. The purpose is to find the one system constraint, not to improve locally visible metrics.

---

## 2. Epistemic correction to Doc 38

`docs/38-herbie-evidence-renewal-constraint.md` remains a valuable historical record of the August 28 reasoning, but its candidate-Herbie interpretation is now too strong.

The current governing position is:

- **Herbie has not been identified.**
- There is always one current system constraint. Do not invent multiple Herbies.
- “Effective evidence-renewal capacity” is presently a system-level throughput/freshness symptom, not a proven physical or logical constraint.
- Tradier is an externally rate-limited machine in the factory, but that does not make Tradier the constraint.
- Wheelwright's scheduler, pacer, cache, provider adapter, acquisition worker, topology, temporal promises, and universe policies are machinery/policies that may affect flow. None is to be called the constraint without evidence.
- Everything that is not the system constraint is a local optimum unless changing it changes whole-system throughput.

Where Doc 38 identifies “effective evidence-surface renewal capacity” as the candidate Herbie or directs work toward exploitation/elevation before direct constraint identification, this document supplies the more conservative current interpretation.

Do not rewrite history by deleting Doc 38. Treat it as the prior hypothesis state.

---

## 3. Governing TOC discipline

The investigation sequence is mandatory:

1. **Observe the factory floor.**
2. **Model flow.**
3. **Form explicit, falsifiable hypotheses.**
4. **Collect discriminating evidence.**
5. **Identify Herbie only when the evidence warrants it.**
6. **Then, and only then, analyze exploitation/subordination/elevation.**

Do not use this sequence instead:

`observation -> plausible mechanism -> implementation change`

The previous discussion drifted in that direction when the serialized provider path led quickly to “concurrent Tradier load.” Concurrency may later prove useful, but it is a solution-space candidate, not the current finding.

During constraint identification, treat Wheelwright as a machine whose behavior should remain unchanged except for measurement instrumentation that is proven not to alter the operating regime materially.

---

## 4. Current leading hypothesis

The current leading machine-level hypothesis is:

> **Tradier is materially underutilized while eligible Wheelwright WIP is waiting.**

This is not equivalent to “Tradier is Herbie.”

The hypothesis matters because underutilized machinery in the presence of waiting WIP is a strong factory-floor signal. It can indicate release policy, synchronization, serialization, blocking, starvation of a sub-path, or some other mechanism preventing the machine from consuming available work. Which mechanism is responsible is not yet established.

### Primary discriminating question

> **Does eligible WIP persist while usable Tradier request capacity remains unused?**

A direct observation of that condition strengthens the underutilized-Tradier hypothesis.

A direct observation that Tradier is essentially pinned to its usable request envelope whenever WIP is waiting falsifies or substantially weakens the hypothesis and sends the investigation elsewhere.

---

## 5. Existing indirect evidence — preserve, reproduce, do not overclaim

The August 28 read-only Production observer supplied the empirical trigger. The durable facts already recorded in Doc 38 include:

- approximately 95 minutes of observation through regular close;
- 21 complete samples;
- Decision freshness start/end/low/high of approximately 97.27% / 73.69% / 64.15% / 98.64%;
- zero provider-pacer rejections during the observation;
- zero scheduler acquisition failures during the observation;
- 954 represented symbols;
- 1,311 distinct symbol-expiration surfaces;
- 6,341 end-of-window deduplicated underlying acquisitions;
- continued acquisition activity while parts of the promised evidence surface aged out of admissibility.

The interrupted analysis also produced a useful but not-yet-durable indirect throughput calculation that must be reproduced from source evidence before being promoted to ratified fact:

- Production request pacing target/configuration was approximately 1.6 request starts/second, or approximately 96/minute.
- Observed provider dispatch growth was approximately 7,098 dispatches over approximately 95 minutes, or approximately 74.7/minute.
- That is approximately 77.8% of the intended 96/minute operating pace.
- Realized start-to-start interval was therefore approximately 803 ms.
- Configured pacing interval was approximately 625 ms.
- The approximately 178 ms residual is consistent with provider/network/service latency being added to each serialized request cycle.
- A simple `625 ms + ~178 ms = ~803 ms` cycle predicts approximately 74.7 starts/minute, closely matching the observed rate.

This arithmetic is **indirect evidence**. It supports the underutilization hypothesis but does not prove available provider capacity at each instant, does not establish vendor-side allowance semantics, and does not identify Herbie.

Likewise, late-run observer samples reportedly showed growing due work and oldest-work age beyond Decision's 1,800-second admissibility horizon. Reproduce those values from the frozen observer bundle before treating them as durable measurements.

### What the existing evidence does establish at hypothesis level

The pattern worth testing directly is:

> waiting/aging work + degrading coverage + realized provider dispatch below intended safe Production pace + no reported rejections/failures.

### What the existing evidence does not establish

Do not claim any of the following yet:

- Tradier is Herbie.
- Serialized access is Herbie.
- Concurrency is required.
- Concurrency is safe or sufficient.
- The scheduler is the constraint.
- The universe is too large.
- Multi-DTE work should be removed.
- Freshness TTLs should be relaxed.
- Carrying capacity should be reduced.
- A pruning policy is justified.

---

## 6. Factory-floor model to measure

The investigation needs a common vocabulary that maps software behavior to flow behavior.

### WIP

**WIP** is eligible work available to be processed but not yet completed by the relevant stage.

For this investigation, WIP must be measured both as **depth** and **age**. A queue of 100 newly-due items and a queue of 10 items already beyond a consumer validity horizon are not equivalent.

### Queue / buffer

A **queue/buffer** is an observable accumulation of WIP before a stage or machine.

A useful buffer measurement includes at minimum:

- total eligible WIP count;
- due/stale count by obligation class if classes materially differ;
- oldest WIP age;
- age percentiles where practical;
- rate at which WIP enters the queue;
- rate at which WIP leaves the queue.

### Machine utilization

**Machine utilization** means the fraction of the machine's practically available processing envelope consumed during a time interval.

Do not confuse utilization with CPU utilization. For Tradier, the relevant machine capacity is request-service capacity under the actual Production allowance and Wheelwright's deliberately chosen headroom policy.

Where vendor headers expose allowance/usage, retain them. Where exact vendor instantaneous capacity is not observable, report the proxy explicitly and do not silently promote it to fact.

### Input and output rates

For each relevant stage distinguish:

- work arrival/release rate;
- request-start rate;
- request-completion rate;
- evidence-acquisition completion rate;
- downstream consumption/admissibility rate where relevant.

Do not use one generic “throughput” number when different boundaries can diverge.

### Starvation

A stage is **starved** when it has available capacity but no eligible WIP reaches it.

### Blocking

A stage is **blocked** when it cannot discharge work or begin new work because a downstream resource/policy cannot accept the output or because some required dependency is unavailable.

### Diagnostic signatures

Use these signatures as hypotheses, not automatic diagnoses:

| Queue/WIP | Machine utilization | First interpretation to investigate |
|---|---|---|
| persistent/growing | near practical maximum | bottleneck/constraint candidate |
| persistent/growing | materially below practical maximum | underutilized machine; investigate release/synchronization/blocking/policy |
| absent | low | likely starvation or no demand |
| stable/small | high | busy machine; not necessarily the system constraint |

Averages are insufficient. Short-window time series are required because alternating bursts and starvation can average into a misleadingly healthy number.

---

## 7. Required measurement record

The campaign should produce time-correlated records sufficient to answer, at minimum:

```text
time
market/session state
stage_or_machine
eligible_wip_depth
oldest_wip_age_ms
wip_age_percentiles_if_available
work_arrival_count_delta
work_release_count_delta
request_start_count_delta
request_completion_count_delta
successful_completion_count_delta
failed_completion_count_delta
provider_rejection_count_delta
provider_allowed_if_exposed
provider_used_if_exposed
provider_available_if_exposed
machine_busy_time_or_best_proxy
machine_idle_time_or_best_proxy
blocking_state_or_best_inference
starvation_state_or_best_inference
active_symbol_or_surface_if_safe_to_record
queue_class_or_obligation
observer/provenance metadata
```

Not every stage will expose every field. Missing fields must be represented as missing, not inferred silently.

The minimum useful output for the Tradier hypothesis is a sufficiently fine-grained time series that can align:

1. eligible WIP present/not present;
2. oldest eligible WIP age;
3. Tradier request starts;
4. request completions and durations;
5. rate-limit/allowance headers or the best explicitly-labeled capacity proxy;
6. rejection/failure counters;
7. session state.

---

## 8. Sampling resolution

The August 28 five-minute observer is good for broad trajectories but too coarse to establish instantaneous machine utilization or reveal idle gaps while WIP is present.

The new observer should use two layers when feasible:

- **Event-level or request-boundary telemetry** for provider start/completion timestamps and request duration.
- **Periodic queue snapshots** at approximately 1-second resolution, or the finest non-disruptive resolution that can be demonstrated not to interfere materially with the system.

If event-level provider telemetry already exists in logs/counters, consume it rather than altering runtime code.

If 1-second SQLite/status polling causes measurable lock/load effects, back off to the fastest safe interval and document the reason and measured observer overhead.

Do not select a sampling interval merely because it is convenient.

---

## 9. Non-interference requirement

Measurement must not materially change the factory being measured.

Prefer, in order:

1. existing logs/counters/status endpoints;
2. read-only SQLite queries against existing indexes/cheap aggregates;
3. external process observation;
4. minimal additive telemetry in Wheelwright only if the needed boundary is otherwise unobservable.

Before a live campaign, measure observer overhead in a non-critical/pre-market period where possible.

Record:

- observer CPU and memory footprint where practical;
- polling frequency;
- query duration distribution;
- SQLite busy/lock errors;
- any effect on Wheelwright request rate or scheduler cadence visible during the test.

If instrumentation requires a Wheelwright code change, Kiro must first explain exactly why existing evidence is insufficient, and the change must be additive/observational rather than an optimization. Do not combine instrumentation with behavior changes in the same patch.

---

## 10. Division of labor — conserve Kiro credits deliberately

Kiro credits are themselves a constrained investigative resource. Spend them where architectural reasoning has the highest leverage.

### Kiro owns

Kiro should:

- bootstrap from repository authority;
- reconstruct the current TOC question and epistemic boundary;
- inspect the exact acquisition/provider pipeline;
- decide which observations discriminate among hypotheses;
- specify measurement boundaries and acceptance criteria;
- inspect Codex output for semantic correctness;
- interpret the resulting evidence;
- update the hypothesis set;
- identify when evidence is strong enough to name Herbie;
- stop before implementation unless the operator explicitly authorizes solution work.

Kiro should **not** spend scarce credits doing routine data collection, repetitive scripting, CSV munging, plotting, counter extraction, or mechanical observer implementation if Codex can do it from a precise measurement order.

### Codex owns

Codex should:

- inspect named code paths and existing telemetry as directed;
- build bounded read-only observers;
- run status/SQLite/log sampling;
- collect provider-boundary timestamps where available;
- reproduce arithmetic from frozen evidence;
- generate CSV/JSONL/raw logs and plots;
- calculate rates, durations, percentiles, queue ages, and correlations;
- package a provenance manifest;
- report missing observability explicitly;
- make no production-behavior optimization.

Codex is a measurement technician, not the authority for declaring the system constraint.

### Operator owns

The operator decides:

- whether a hypothesis is accepted/rejected/retained;
- whether new runtime instrumentation is acceptable;
- whether Kiro should enter solution space;
- whether any scheduler/provider/universe/temporal-contract change is authorized.

---

## 11. Restart sequence when Kiro credits return

This sequence is intentionally prescriptive.

### Phase 0 — Cold start and authority check

Kiro must first:

1. Confirm repository `brooksbol/options-prototype`, branch `main`.
2. Read `README.md` and follow its documented reading order.
3. Read `.kiro/steering/*`.
4. Read this document in full.
5. Read Doc 38 as historical context, but apply the epistemic correction in this document.
6. Read Docs 35–37 for the temporal/freshness evidence problem.
7. Inspect current implementation evidence for the acquisition worker, request pacer, Tradier adapter, scheduler/work-queue construction, status telemetry, evidence store, and relevant tests/config.
8. Verify that no newer commit has superseded this restart prescription.
9. State the current hypothesis and forbidden solution-space moves before doing anything else.

Expected Kiro checkpoint statement:

> “Herbie is not yet identified. The leading current hypothesis is that Tradier is underutilized while eligible WIP waits. My next job is to specify and validate discriminating measurement, not to optimize the provider path.”

If Kiro cannot make that statement after bootstrap, stop and reconcile authority before proceeding.

### Phase 1 — Reproduce existing indirect evidence

Before inventing new instrumentation, Kiro should direct Codex to reproduce the August 28 indirect calculations from the frozen observer bundle and current source/config.

Required reproduced outputs:

- exact observation start/end and duration;
- provider dispatch counter start/end/delta if present;
- dispatches per minute;
- configured/declared Production pacing interval and implied request-start envelope;
- implied utilization against that envelope, with caveats;
- provider rejection delta;
- acquisition failure delta;
- WIP due counts over time;
- oldest WIP ages over time;
- exact moments oldest WIP exceeded Decision's 1,800-second validity horizon;
- Decision freshness trajectory;
- request-latency arithmetic, clearly marked as mechanism hypothesis rather than causal proof.

If the frozen observer bundle is not available on the machine, record that fact and identify its expected location before proceeding.

### Phase 2 — Observability inventory

Kiro then answers:

> “Can the primary discriminating question be answered with existing runtime evidence?”

Produce a short observability map:

| Needed fact | Existing source | Resolution | Trust/provenance | Missing? |
|---|---|---|---|---|
| eligible WIP depth | ... | ... | ... | ... |
| oldest WIP age | ... | ... | ... | ... |
| request start time | ... | ... | ... | ... |
| request completion time/duration | ... | ... | ... | ... |
| provider allowance/usage | ... | ... | ... | ... |
| provider rejection | ... | ... | ... | ... |
| session state | ... | ... | ... | ... |

Only after this inventory may Kiro prescribe new telemetry.

### Phase 3 — Issue a Codex measurement order

Use or adapt `docs/prompts/codex-factory-floor-measurement.md`.

The measurement order must state:

- exact hypothesis;
- exact fields;
- exact data sources;
- sampling/event resolution;
- run duration/window;
- observer non-interference constraints;
- artifact filenames/directories;
- calculations to produce;
- what Codex must not change;
- completion criteria.

Do not send Codex a vague “investigate performance” prompt.

### Phase 4 — Pre-market preparation

If credits return Monday evening or before Tuesday market open, use the closed-market period to remove mechanical uncertainty without changing behavior.

Pre-market tasks:

- build/reproduce the observer;
- validate read-only queries;
- verify timestamps/time zones;
- verify session-state capture;
- verify provider counters/headers available in the current regime;
- verify the observer can restart without corrupting its output;
- establish output directory and provenance manifest;
- measure observer overhead;
- run a short dry run;
- inspect sample rows for semantic correctness;
- correct instrumentation bugs only.

Do **not** use the lack of live market traffic to draw conclusions about Production machine utilization.

### Phase 5 — Live Tuesday observation

Once normal market activity supplies genuine WIP, run the measurement campaign without changing the operating regime.

Desired observation window:

- begin early enough to capture transition into meaningful acquisition demand;
- include the regular-market opening period if operationally safe;
- continue long enough to observe at least one sustained WIP episode and, ideally, both accumulation and recovery behavior;
- preserve raw event data even if derived summaries are generated continuously.

Do not stop merely because one five-minute interval appears to support the hypothesis.

### Phase 6 — First analysis

Codex should produce, at minimum:

- raw event/request JSONL or CSV;
- periodic WIP snapshots;
- provenance manifest;
- request starts/minute in short rolling windows;
- request completions/minute;
- request duration distribution;
- WIP depth and oldest-age series;
- intervals where WIP > 0;
- within those intervals, measured/proxied Tradier utilization;
- idle-gap distribution while WIP > 0;
- provider rejection/failure series;
- plots aligning WIP and provider activity on the same time axis;
- explicit list of unobservable facts.

Kiro then interprets the evidence. Codex does not declare Herbie.

### Phase 7 — Decision gate

Kiro must classify the result into one of these states:

**A. Underutilized-Tradier hypothesis strengthened**  
There are reproducible intervals where eligible WIP persists while the usable Tradier envelope is materially unconsumed. Quantify how much and when. The next investigation is to localize why the machine is underutilized, still without assuming the remedy.

**B. Underutilized-Tradier hypothesis falsified/weakened**  
Whenever eligible WIP persists, Tradier is essentially pinned to the practical usable envelope. Continue factory-floor measurement upstream/downstream to find where WIP accumulates against high utilization.

**C. Evidence inconclusive**  
Required boundary facts remain unobservable or the run does not contain sufficient WIP. Improve measurement only; do not infer a solution.

No state by itself authorizes concurrency, pacing changes, scheduler changes, topology changes, universe pruning, TTL changes, caching changes, or provider changes.

---

## 12. Specific falsification criteria

The leading hypothesis should be treated as falsifiable, not rhetorically protected.

### Strengthening evidence

The hypothesis is materially strengthened if, during sustained eligible-WIP intervals:

- request starts remain materially below the independently-supported practical provider envelope;
- idle gaps occur that are not explained by empty WIP, provider backoff/rejection, session closure, or another required dependency;
- this behavior is recurrent rather than a single anomaly;
- the result survives observer-overhead checks.

### Weakening/falsifying evidence

The hypothesis is weakened or falsified if:

- Tradier request consumption is essentially at the practical envelope whenever eligible WIP is waiting; or
- the apparent “unused” capacity disappears once vendor allowance semantics are measured correctly; or
- the apparent WIP is not actually eligible/releasable to the provider stage; or
- another hard dependency demonstrably prevents the work from being provider-ready, meaning the queue was measured at the wrong boundary.

No arbitrary utilization threshold is ratified here. Kiro must justify any numerical threshold from actual provider semantics and chosen safety headroom before using it as a pass/fail criterion.

---

## 13. Measurement topology beyond Tradier

Do not tunnel-vision on the leading hypothesis. The whole point is to identify Herbie.

Kiro should construct, at least conceptually, a flow map from obligation creation through evidence admissibility. Candidate boundaries include:

- obligation/due-work creation;
- scheduler/work-queue release;
- acquisition worker dispatch;
- request pacer admission;
- provider request start;
- provider request completion;
- parsing/persistence;
- evidence publication/snapshot readiness;
- Decision admissibility.

For each boundary, ask:

- Is WIP accumulating here?
- Is the downstream machine/resource fully utilized?
- Is the stage starved or blocked?
- What rate enters and leaves?
- What age distribution develops?

If the Tradier hypothesis fails, this map prevents the investigation from collapsing into random optimization.

---

## 14. Known implementation clues — clues only

Current implementation evidence has previously shown:

- a request pacer that serializes provider calls with minimum spacing;
- synchronous request execution inside the pacer path;
- a synchronous Tradier HTTP request path;
- a single scheduled acquisition worker executing acquisition work sequentially;
- a Production pacing target around 1.6 requests/second with headroom below the observed Production allowance;
- freshness/work-queue behavior that can leave due work aging while acquisition continues.

These are mechanism clues. Do not convert any of them into “the constraint” merely because the code is easy to point at.

Tradier does not, by itself, forbid concurrent access. Therefore one-at-a-time access is a Wheelwright policy/implementation characteristic, not a vendor rule.

The previous concurrency idea arose because the arithmetic of serialization plus network/provider latency approximately predicted observed request-start throughput. That makes concurrency a plausible later elevation/exploitation candidate **only if the problem-space evidence eventually warrants it**.

---

## 15. Forbidden work during this campaign

Unless the operator explicitly overrides this document, do not:

- add concurrent provider load as an optimization;
- change the request-pacing interval;
- increase provider request rate;
- change cache TTLs;
- change Decision validity horizons;
- change scheduler priorities or refresh horizons;
- prune or add universe symbols to improve freshness;
- remove multi-DTE surfaces;
- alter A/B/C/D policy semantics;
- change session semantics;
- add new provider infrastructure;
- optimize SQLite or application code merely because profiling reveals a local inefficiency;
- redesign the observer into a product feature;
- declare multiple constraints;
- call a locally slow component “Herbie” without queue/utilization evidence;
- interpret zero 429s as proof of unused capacity without rate/allowance evidence;
- interpret 100% CPU or a busy thread as proof of constraint utilization.

Instrumentation changes are allowed only when they are necessary to answer a discriminating question and are isolated from behavior changes.

---

## 16. Artifact and provenance requirements

Every live measurement campaign must be reproducible enough that another investigator can audit it without conversational memory.

Create a timestamped external evidence directory, for example:

```text
wheelwright-constraint-observer-YYYY-MM-DD/
  README.md
  manifest.json
  events.jsonl
  queue_samples.jsonl
  status_raw.jsonl
  provider_raw.jsonl        # if available/safe
  derived/
    request_windows.csv
    wip_windows.csv
    idle_gaps.csv
    summary.json
  plots/
    wip-vs-request-starts.png
    oldest-age-vs-utilization.png
  analysis.md
```

The manifest should include:

- repository commit SHA;
- working-tree dirty/clean state;
- observer version/hash;
- start/end timestamps in UTC and local market-relevant zone;
- system/provider profile;
- relevant configuration values;
- sampling frequencies;
- data sources/endpoints/queries;
- known missing data;
- machine/host identifier at a non-sensitive level;
- observer failures/restarts;
- any code changes required solely for telemetry.

Do not commit secrets, provider credentials, account identifiers, or raw artifacts containing sensitive data.

Commit durable **findings and reproducible method**, not necessarily the entire runtime evidence bundle.

---

## 17. Reporting format

Kiro's first post-campaign report should separate four epistemic layers explicitly:

### Observation

Directly measured facts with source and time window.

### Derived measurement

Arithmetic/aggregation reproducible from observed facts.

### Inference / hypothesis

Interpretation that could still be wrong.

### Ratification recommendation

What, if anything, is now strong enough for operator ratification.

Never merge these into a single narrative of “what happened.”

The report must include at least one sentence explaining what evidence would overturn its leading conclusion.

---

## 18. Completion criteria for the first Kiro session

A successful first Kiro session does **not** require identifying Herbie.

It succeeds if all of the following are true:

- repository authority was reconstructed;
- the current epistemic boundary was preserved;
- existing indirect evidence was reproduced or its missing provenance explicitly identified;
- the measurement boundary was specified precisely;
- existing observability was inventoried;
- Codex received a bounded executable measurement order;
- the observer/dry run was validated if market conditions were unavailable;
- no unauthorized optimization was introduced;
- Kiro stopped when the next useful work became mechanical Codex work.

That is the desired use of scarce Kiro credits.

---

## 19. Exact Kiro and Codex prompts

The canonical copy/paste prompts are maintained separately so they can be used directly without editing this document:

- `docs/prompts/kiro-constraint-identification.md`
- `docs/prompts/codex-factory-floor-measurement.md`

Kiro may refine the Codex prompt after inspecting current code, but any refinement must preserve the hypothesis, non-interference requirements, provenance requirements, forbidden solution work, and operator decision gate.

---

## 20. Final restart instruction

When Kiro becomes available, do not ask “what should we work on?”

Start here.

The first question is not how to make Wheelwright faster.

The first question is:

> **Where is WIP accumulating, how utilized is the machinery immediately downstream of that WIP, and what does that tell us about the one current system constraint?**

The leading sub-hypothesis to test first is:

> **Eligible WIP waits while Tradier has usable capacity left idle.**

Measure it. Try to falsify it. Preserve the machine while observing it. Use Codex for the mechanical work. Spend Kiro on deciding what the evidence means.
