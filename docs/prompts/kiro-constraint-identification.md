# Kiro Prompt — Constraint Identification Restart

Use this prompt verbatim or nearly verbatim when Kiro credits return.

---

You are resuming Wheelwright constraint-identification work in repository `brooksbol/options-prototype`.

Before doing anything else, bootstrap from the current `main` branch as repository authority. Read `README.md`, follow its reading order, read `.kiro/steering/*`, then read `docs/39-constraint-identification-restart-plan.md` in full. Read `docs/38-herbie-evidence-renewal-constraint.md` as historical context, but apply the epistemic correction in Doc 39. Also inspect Docs 35–37 and current implementation evidence for the scheduler/work queue, acquisition worker, request pacer, Tradier adapter, status telemetry, evidence store, provider configuration, and relevant tests.

Do not rely on conversational memory where repository evidence can establish the state.

## Governing problem-space discipline

Herbie has **not** been identified.

There is one current system constraint. Everything else is a local optimum unless changing it changes whole-system throughput.

The current leading machine-level hypothesis is:

> **Tradier is materially underutilized while eligible Wheelwright WIP is waiting.**

That hypothesis is not equivalent to “Tradier is Herbie.”

The previous idea of concurrent Tradier load is a solution-space candidate that arose from an implementation clue. It is not an authorized change and must not bias the measurement campaign.

Your first job is to identify discriminating evidence, not to optimize Wheelwright.

## Forbidden work

Do not change scheduler policy, universe membership, refresh horizons, Decision validity, cache TTLs, request pacing, provider concurrency, provider profile, multi-DTE topology, A/B/C/D semantics, session semantics, or infrastructure to make visible metrics improve.

Do not prune symbols.

Do not add concurrent provider load.

Do not call serialization, Tradier, the scheduler, SQLite, or any other component “Herbie” without queue/utilization evidence.

Instrumentation may be added only if existing telemetry cannot answer the discriminating question, and any instrumentation change must be isolated, additive, observational, and explicitly justified before implementation.

## First required checkpoint

After bootstrap, state explicitly:

1. the current repository HEAD;
2. whether any newer authority supersedes Doc 39;
3. “Herbie is not yet identified”;
4. the leading underutilized-Tradier hypothesis;
5. the primary falsification question;
6. which solution-space moves are prohibited.

Do not proceed if repository authority conflicts with this prompt; report the conflict first.

## Primary discriminating question

> **Does eligible WIP persist while usable Tradier request capacity remains unused?**

You must define “eligible WIP” at the exact boundary being measured and define the best defensible measure of “usable Tradier request capacity.” Do not treat a configured pace as vendor capacity unless current source/runtime evidence supports that interpretation.

## Reproduce existing indirect evidence first

Before designing new telemetry, use Codex for mechanical reproduction of the August 28 evidence wherever practical.

Reproduce or explicitly fail to reproduce:

- observer start/end/duration;
- provider dispatch counter start/end/delta;
- dispatches per minute;
- current Production pacing interval and its implied start-rate envelope;
- the resulting apparent utilization against that envelope, with caveats;
- provider rejection delta;
- scheduler acquisition-failure delta;
- due-WIP trajectory;
- oldest-WIP trajectory;
- exact periods where oldest WIP exceeded the 1,800-second Decision validity horizon;
- Decision freshness trajectory;
- request-latency arithmetic showing why serialization plus provider/network latency could predict the observed approximately 75/minute rate.

The last item is a mechanism hypothesis, not causal proof.

If the frozen August 28 observer bundle is missing, record the missing provenance and expected path rather than fabricating replacement facts.

## Build an observability inventory

Before asking Codex to write anything new, determine whether existing logs, `/api/status`, SQLite, provider headers, counters, or runtime metrics already expose the needed facts.

Produce a table with:

`needed fact | source | resolution | trust/provenance | missing?`

At minimum cover:

- eligible WIP depth;
- oldest eligible WIP age;
- request start timestamp;
- request completion timestamp and duration;
- request success/failure;
- provider rejection/backoff;
- provider allowed/used/available semantics if exposed;
- market/session state.

## Use Codex as the measurement technician

Do not waste Kiro credits on routine scripting, polling, CSV munging, plotting, or repetitive arithmetic that Codex can do from a bounded order.

Use `docs/prompts/codex-factory-floor-measurement.md` as the base Codex order. Refine only the concrete source paths, queries, fields, and sampling choices that require your code inspection.

Your Codex handoff must specify:

- exact hypothesis;
- exact data sources;
- exact fields;
- event/sampling resolution;
- run window;
- non-interference constraints;
- output artifact layout;
- calculations/plots;
- provenance requirements;
- forbidden behavior changes;
- completion criteria.

Once the task becomes mechanical and Codex has an adequate order, stop spending Kiro credits until Codex returns evidence.

## Pre-market work

If this session occurs before market open, use the time to:

- inspect current code and telemetry;
- reproduce frozen evidence;
- prepare/validate the observer;
- validate read-only queries;
- verify timestamps/time zones;
- verify session-state capture;
- verify provider-header/counter capture;
- test restartability and artifact output;
- measure observer overhead;
- run a short dry run;
- inspect sample rows for semantic correctness.

Do not infer Production utilization from a closed market.

## Live measurement design

Prefer event-level provider request start/completion telemetry if already available.

Pair it with approximately 1-second WIP snapshots, or the finest empirically non-disruptive interval.

The minimum aligned record needed to test the leading hypothesis is:

`time | eligible WIP depth | oldest WIP age | provider request starts | request completions/durations | provider allowance/usage or explicit proxy | rejections/failures | session state`

Preserve raw observations. Derived summaries must be reproducible from them.

## Non-interference

Prefer existing telemetry, then read-only SQLite/status observation, then external process observation. Add runtime telemetry only if necessary.

Any observer must record enough overhead information to show that it did not materially alter the system being measured.

Do not combine measurement instrumentation with optimization in one patch.

## Analysis gate

After live evidence returns, classify the leading hypothesis as one of:

A. strengthened — sustained eligible WIP exists while Tradier's usable envelope is materially unconsumed;
B. weakened/falsified — Tradier is essentially pinned to its practical envelope whenever eligible WIP persists;
C. inconclusive — the required boundary remains unobservable or the run lacks sufficient WIP.

For A, localize why the machine is underutilized next; do not jump directly to concurrency.

For B, continue the factory-floor search upstream/downstream for persistent WIP against highly utilized machinery.

For C, improve measurement only.

No branch authorizes a solution change without operator review.

## Reporting standard

Separate your report into:

- Observation
- Derived measurement
- Inference/hypothesis
- Ratification recommendation

State what evidence would overturn your leading conclusion.

Do not declare Herbie unless direct factory-floor evidence supports doing so.

## Credit discipline

Treat Kiro credits as scarce. Spend them on:

- semantic/code-path understanding;
- hypothesis design;
- measurement design;
- interpretation;
- deciding the next discriminating question.

Delegate bounded mechanical measurement to Codex.

Your successful first session ends when Codex has a precise measurement order and the next useful work is mechanical, even if Herbie remains unidentified.
