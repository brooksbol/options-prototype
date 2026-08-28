# Codex Prompt — Factory-Floor Measurement Order

Use this prompt as the canonical bounded Codex task. Kiro may replace placeholders with exact current paths/queries after inspecting `main`, but must preserve the problem-space constraints and artifact requirements.

---

You are acting as a **measurement technician** for Wheelwright in repository `brooksbol/options-prototype`.

Your job is to collect and package evidence. You are **not** authorized to optimize Wheelwright or declare the system constraint.

## Authority and scope

Work from the current `main` branch. Read:

- `README.md`
- `docs/39-constraint-identification-restart-plan.md`
- the current code paths named by Kiro in the handoff

If Kiro supplies exact files, methods, SQL, endpoints, counters, or runtime commands, treat those as the concrete measurement specification so long as they do not conflict with Doc 39.

## Hypothesis under test

The current leading machine-level hypothesis is:

> **Tradier is materially underutilized while eligible Wheelwright WIP is waiting.**

This does **not** mean Tradier is Herbie.

Your task is to produce measurements that allow Kiro/operator to strengthen, weaken, or reject that hypothesis.

## Primary question

> **Are there reproducible time intervals in which eligible WIP is waiting while usable Tradier request capacity is left idle?**

You must not silently redefine either “eligible WIP” or “usable capacity.” Use Kiro's specified boundary definitions. If a required fact is not observable, record it as missing.

## Absolute prohibitions

Do not:

- change request pacing;
- add provider concurrency;
- change scheduler logic or priorities;
- change universe membership;
- change refresh/validity horizons;
- change cache TTLs;
- remove multi-DTE work;
- change provider profile;
- optimize SQLite/application code;
- change A/B/C/D or session semantics;
- introduce infrastructure changes;
- alter production behavior to make the experiment succeed;
- declare Tradier, serialization, scheduler, database, or any other component to be Herbie.

If measurement requires a production-code telemetry change, stop and report exactly what boundary is unobservable and what minimal additive telemetry would expose it. Do not implement that change unless the operator/Kiro explicitly authorizes it.

## Part 1 — Reproduce August 28 indirect evidence

Before new live collection, reproduce as much as possible from the frozen August 28 observer bundle and current source/config.

Expected external bundle location from the prior record:

`/Users/bollich/wheelwright-history-observer-2026-08-28`

Do not assume it exists. Check and report.

Produce a reproducibility note containing:

1. observer start/end timestamps and elapsed minutes;
2. provider dispatch counter start/end/delta if the bundle captures it;
3. dispatches/minute;
4. current Production pacing configuration and implied request-start envelope;
5. apparent utilization against that configured envelope, explicitly labeled as a proxy unless provider semantics prove otherwise;
6. provider rejection delta;
7. acquisition-failure delta;
8. due-WIP trajectory;
9. oldest-WIP trajectory;
10. exact timestamps where oldest eligible work exceeded 1,800 seconds, if reproducible;
11. Decision freshness trajectory;
12. request-cycle arithmetic comparing configured pacing interval, realized start-to-start interval, and residual latency.

Preserve every source filename/query used. If a reported prior number cannot be reproduced, say so explicitly.

## Part 2 — Build the observer only from the approved measurement order

Use Kiro's observability map to select existing sources. Prefer this order:

1. existing runtime counters/logs/status endpoints;
2. read-only SQLite queries;
3. external process observation;
4. only explicitly-authorized additive runtime telemetry.

The observer should collect two complementary streams when practical.

### A. Provider request/event stream

Capture, at minimum when available:

```text
event_time_utc
request_id_or_local_sequence
provider_endpoint_class
request_start_time_utc
request_complete_time_utc
request_duration_ms
success
http_status
provider_rejected_or_throttled
rate_limit_allowed
rate_limit_used
rate_limit_available
rate_limit_expiry_or_reset_if_exposed
symbol_if_safe
expiration_if_safe
source/provenance
```

Do not log credentials, authorization headers, account IDs, or response bodies unless specifically required and proven non-sensitive.

### B. Queue/WIP snapshot stream

At approximately one-second cadence, or the finest Kiro-approved non-disruptive cadence, capture:

```text
sample_time_utc
session_state
eligible_wip_depth
oldest_eligible_wip_age_ms
wip_age_p50_ms_if_cheap
wip_age_p90_ms_if_cheap
wip_age_p99_ms_if_cheap
due_count_by_relevant_obligation_class
scheduler_or_worker_state
provider_dispatch_counter
provider_completion_counter
provider_rejection_counter
acquisition_failure_counter
other_approved_boundary_counters
source/provenance
```

If a percentile or class split is expensive or semantically ambiguous, omit it and document why rather than perturbing the system.

## Sampling and non-interference

The prior five-minute observer is too coarse for provider utilization. Use event-level request timestamps where existing telemetry permits.

For queue snapshots, target approximately 1 second unless measured overhead requires a slower cadence.

Before live observation:

- run a dry test;
- measure query durations;
- record observer CPU/memory where practical;
- detect SQLite busy/lock errors;
- confirm timestamps are monotonic/coherent enough for alignment;
- confirm the observer can be stopped/restarted without corrupting artifacts;
- verify the observer does not materially change Wheelwright request cadence in the dry test.

If the observer causes interference, reduce frequency or simplify queries and record the change.

## Live-run conditions

Do not draw utilization conclusions from a closed market or a period with no meaningful eligible WIP.

For the live Tuesday run:

- begin before or near the onset of meaningful acquisition demand as directed by Kiro;
- preserve raw data continuously;
- continue through at least one sustained WIP episode;
- ideally capture WIP accumulation and subsequent recovery/drain;
- do not stop after a brief confirming interval;
- record market/session-state transitions.

If Wheelwright restarts, the observer restarts, or the host sleeps/suspends, mark the discontinuity explicitly.

## Required derived analysis

From raw data, produce mechanically reproducible derived artifacts:

1. request starts/minute using short rolling windows;
2. request completions/minute;
3. request-duration distribution and percentiles;
4. WIP depth over time;
5. oldest-WIP age over time;
6. intervals where eligible WIP > 0;
7. intervals where oldest WIP exceeds relevant validity horizons supplied by Kiro;
8. provider request-start utilization against the approved capacity proxy;
9. idle-gap distribution between request starts, segmented by `WIP > 0` vs `WIP == 0`;
10. provider rejection/failure series;
11. correlation/alignment views that place WIP and provider activity on the same time axis;
12. a table of all periods where WIP is present and request-start rate is materially below the approved envelope, without asserting cause.

Do not choose a “materially below” numerical threshold yourself unless Kiro supplied one. If none is supplied, provide the continuous values and candidate percent-of-envelope bands for Kiro to interpret.

## Required plots

Create clear plots with timestamps and units, at minimum:

- `wip-vs-request-starts.png`
- `oldest-age-vs-provider-utilization.png`
- `idle-gap-distribution-wip-present.png`
- `request-duration-over-time.png`

Plots are supporting evidence only. Raw files remain authoritative.

## Artifact layout

Create a timestamped external directory such as:

```text
wheelwright-constraint-observer-YYYY-MM-DD/
  README.md
  manifest.json
  events.jsonl
  queue_samples.jsonl
  status_raw.jsonl
  provider_raw.jsonl        # only if approved/available
  reproduction-2026-08-28.md
  derived/
    request_windows.csv
    wip_windows.csv
    idle_gaps.csv
    underutilized_intervals.csv
    summary.json
  plots/
    wip-vs-request-starts.png
    oldest-age-vs-provider-utilization.png
    idle-gap-distribution-wip-present.png
    request-duration-over-time.png
  analysis.md
```

Do not commit large/raw runtime evidence to GitHub unless explicitly instructed. The artifact directory should be independently inspectable.

## Manifest requirements

`manifest.json` must contain, when available:

- repository commit SHA;
- working-tree state/dirty flag;
- observer source path and hash/version;
- observer start/end UTC timestamps;
- local/market timezone used for reports;
- provider profile;
- relevant pacing/config values;
- sampling cadence;
- endpoints/queries/log sources used;
- source table/index names if SQLite is queried;
- observer overhead measurements;
- count of observer errors/restarts;
- host sleep/suspension events if detected;
- known missing/unobservable fields;
- any explicitly-authorized instrumentation patch SHA.

Do not include secrets.

## `analysis.md` format

Do not declare the constraint. Use this structure:

### Direct observations

Facts directly present in raw data.

### Derived measurements

Arithmetic/aggregations with formulas or script names sufficient for reproduction.

### Boundary limitations

Facts that could not be observed or whose semantics remain ambiguous.

### Candidate discriminating intervals

Time ranges Kiro should inspect because WIP and provider utilization diverge or because they contradict the leading hypothesis.

### No conclusion on Herbie

End with an explicit statement that constraint identification remains Kiro/operator work.

## Completion criteria

Your task is complete only when:

- the August 28 indirect evidence has been reproduced or non-reproducible items are explicitly identified;
- the observer has passed a dry-run/non-interference check;
- raw live measurement artifacts are preserved if market conditions allowed a live run;
- derived files are reproducible from raw data;
- every field has provenance;
- missing observability is explicit;
- no production optimization has been introduced;
- Kiro can inspect the bundle and answer the discriminating question without asking you to reconstruct what was measured.

If market conditions are not yet available, stop after preparing and validating the observer. Do not simulate evidence and do not infer live utilization from the dry run.
