# Provider Admission Controller Findings — August 31, 2026

**Status:** ACTIVE evidence / Kiro handoff.  
**Scope:** Records the August 31 measurement findings and the after-hours controller/provider experiment. It does **not** identify Herbie and does **not** authorize further production optimization by itself.  
**Related:** `docs/39-constraint-identification-restart-plan.md`, `.kiro/steering/current-investigation.md`.

---

## Executive handoff for Kiro

The August 31 factory-floor investigation materially changed the provider-path understanding.

1. The old Production `RequestPacer` behavior used a fixed post-completion sleep. The measured request cycle was approximately:
   - 109.28 ms provider callable
   - 630.74 ms deliberate pacer wait
   - 65.48 ms residual
   - 805.50 ms mean start-to-start
   - 74.49 requests/minute
2. The residual was not uniform. 340 long intervals above 500 ms aligned with 340 scheduler-cycle increments. Those cycle-boundary gaps accounted for roughly 410.53 of 434.12 total residual seconds and had roughly 1.2 s median completion-to-next-enqueue delay.
3. Therefore the old `96/min` figure was not an achievable envelope. It was only the reciprocal of the configured 625 ms sleep. The implementation added provider duration to the configured delay.
4. The provider trace showed persistent due WIP while request activity remained near 75/min with zero provider rejections. Tradier returned `X-Ratelimit-Allowed: 120`; `Used`/`Available` did not behave like a coherent cumulative per-token ledger.
5. A simpler admission-control candidate emerged: strictly single-flight provider calls, no fixed inter-request sleep, exact local trailing-window accounting, execute immediately when dependency-ready, provider backoff/429 as hard override.
6. The operator clarified that the desired utilization target is approximately **99% of Tradier's documented 120/minute capacity**, not 99 requests/minute. A practical candidate ceiling is therefore **119 starts in any trailing 60 seconds**.
7. Codex implemented a bounded non-persistent after-hours measurement path using the real provider/pacer path so the controller could be exercised while normal acquisition remained session-blocked.
8. A one-hour after-hours experiment then demonstrated sustained provider-path operation at essentially the documented Production market-data limit without the old fixed sleep.

Kiro should treat the provider admission controller as a concrete machine-level candidate now backed by experiment, but should still evaluate live-session system effects before declaring a constraint or authorizing broader optimization.

---

## Pre-change factory-floor evidence

The regular-session instrumented campaign produced 6,631 contiguous successful requests with zero provider failures, rejections, recorder drops, or acquisition failures.

Observed request-cycle decomposition:

| Measure | Result |
|---|---:|
| Effective request rate | 74.49/min |
| Mean start-to-start | 805.50 ms |
| Mean provider callable | 109.28 ms |
| Mean deliberate pacer wait | 630.74 ms |
| Mean residual | 65.48 ms |
| Deliberate wait share | 78.30% |
| Provider callable share | 13.57% |
| Residual share | 8.13% |

The residual distribution was highly bimodal. Median residual was about 2.45 ms, but 340 transitions exceeded 500 ms and all 340 exceeded 1,000 ms. Exactly 340 scheduler-cycle increments occurred. The long gaps had about 1,197.55 ms median completion-to-next-enqueue delay and contributed about 410.53 seconds of the 434.12 seconds of total measured residual.

During the provider-active interval, due-WIP proxy remained positive throughout (min 107, median 294, max 444) and oldest work was generally beyond the 1,800-second Decision admissibility horizon. The measurement therefore answered Doc 39's discriminating question strongly: eligible/due WIP persisted while the provider path was not consuming the documented 120/minute allowance.

This does **not** identify Herbie. It localizes a machine behavior.

---

## Contract / implementation mismatch hypothesis

Repository language had described the provider policy in terms of requests per second, minimum interval between dispatches, request-start pacing, and approximately 96 starts/minute with headroom. The implementation instead imposed a fixed delay after the previous synchronous provider callable completed.

That means the effective cycle was approximately:

```text
provider duration + fixed sleep + other residual
```

rather than a start-to-start spacing contract.

Counterfactual replay of the recorded intervals showed:

- actual: 74.49/min, 805.50 ms mean start-to-start;
- start-time pacing at 625 ms, preserving measured scheduler gaps: about 90.90/min;
- perfect removal of scheduler residual while retaining completion-based sleep: about 81.71/min;
- 625 ms start-time pacing with scheduler gaps removed: about 95.91/min.

These replays are mechanical counterfactuals, not provider-safety proofs. They established that the post-completion sleep was the larger local throughput loss and that scheduler handoff was a separate smaller loss.

---

## Admission-control candidate

The design discussion converged on direct quantity control rather than sleep tuning:

```text
when work is ready and no provider request is active:
    remove local start timestamps older than 60 seconds

    if fewer than configured_limit starts remain:
        admit and execute immediately
    else:
        wait until the oldest retained start reaches 60 seconds

on provider throttle / 429:
    stop admission
    honor recovery guidance conservatively
```

Candidate policy for approximately 99% utilization of the documented Production allowance:

- documented market-data limit: 120/minute per access token;
- candidate local ceiling: 119 starts in any trailing 60 seconds;
- strictly single-flight HTTP;
- no fixed inter-request sleep;
- dependencies remain naturally serialized;
- local monotonic start accounting is proactive control;
- raw `Allowed`, `Used`, `Available`, and `Expiry` headers are retained as evidence;
- `429` is an authoritative emergency brake, not the normal governor.

If the access token is shared, the local ledger only accounts for Wheelwright-generated starts. Near-100% utilization therefore requires either exclusive token traffic or an explicit reserve for external consumers.

---

## One-hour after-hours experiment

Normal Wheelwright acquisition remained `session_blocked`. A non-persistent measurement harness issued uncached read-only SPY quote GETs through the same Production `RequestPacer`. It invoked 120 requests per batch so every batch necessarily crossed the 119-entry trailing-ledger release boundary. Sixty consecutive batches were run.

### Result

The operational experiment passed:

- 7,200 / 7,200 provider calls succeeded;
- every response was HTTP 200;
- zero 429s;
- zero provider failures;
- zero pacer rejections;
- zero recorder errors or event drops;
- zero system-observer errors or missed deadlines;
- all 7,200 events contiguous;
- actual HTTP starts averaged **119.72/min** over 3,607.91 seconds;
- exactly 60 long quota waits occurred, one per 119 events;
- release-to-release spacing averaged 60,006.89 ms, range 60,000.19–60,010.29 ms;
- the 119-request active portion averaged about 11.54 seconds;
- the long quota wait averaged about 48.45 seconds.

119.72/min is approximately 99.77% of the documented 120/minute allowance.

The workload was intentionally burst/drain: synchronous requests ran immediately until the local budget was consumed, then admission waited for ledger capacity to release. This proves provider-path/controller behavior for this isolated after-hours quote workload; it does not yet establish that burst/drain is the best live evidence-production shape.

### Exact ledger boundary

The callable/admission ledger never contained more than 119 starts in a trailing 60 seconds. The tightest 120-callable-start span was 60,000.005 ms.

At the exact adapter HTTP-start boundary, two observations contained 120 starts in a trailing 60-second interval; the tightest 120-HTTP-start span was 59,999.919 ms, about 0.081 ms inside the mathematical boundary. It never reached 121 starts. This results from the small handoff between the admission/callable-start timestamp and the exact outbound HTTP-start timestamp.

This did not violate the documented 120/minute provider contract and caused no throttle. Formal alignment of the ledger to the exact outbound HTTP-start boundary remains a separable correctness improvement, not a prerequisite for interpreting this experiment.

### Provider latency / stability

Across all 7,200 calls:

| HTTP duration | Result |
|---|---:|
| median | 56.18 ms |
| mean | 71.47 ms |
| p90 | 119.01 ms |
| p95 | 135.96 ms |
| p99 | 190.08 ms |
| max | 720.88 ms |

Non-HTTP callable residual was negligible: median 0.114 ms, mean 0.122 ms, p99 0.302 ms, max 4.22 ms.

There was no meaningful latency degradation across the hour. The fixed 625 ms post-completion sleep was therefore not required to remain cleanly inside Tradier's documented Production market-data allowance for this isolated workload.

---

## Tradier header finding

`X-Ratelimit-Allowed` was 120 on every response and is consistent with the documented Production market-data contract.

The other observed headers should **not** presently govern normal admission:

- `Available`: 95–119, median 114;
- `Used`: 1–25, median 6 while Wheelwright generated about 120 actual starts/minute;
- 61 distinct expiry groups;
- `Used` was non-monotonic in every expiry group;
- `Used` decreased 2,682 times while `Expiry` was unchanged.

Current interpretation:

- configured/documented limit supplies the nominal local policy ceiling;
- Wheelwright's own monotonic request-start ledger controls proactive admission;
- headers remain raw provider evidence;
- a credible lower provider limit should be honored conservatively;
- a higher header value should not automatically raise the documented ceiling;
- 429/backoff remains the runtime safety override.

---

## Non-interference evidence

The after-hours experiment did not mutate normal Wheelwright evidence/acquisition state:

- durable evidence generation remained exactly 19,057;
- evidence `generatedAt` remained `2026-08-31T20:16:13.832468Z`;
- response cache remained empty in all classes before and after;
- scheduler was `session_blocked` for all 3,721 system samples;
- scheduler cycle count remained zero;
- symbols acquired remained zero;
- WIP proxy remained zero;
- acquisition failures and pacer rejections remained zero;
- intended ephemeral measurement state changed only in pacer counters, trailing ledger, and bounded event recorder.

---

## What is now established

Within the measured boundaries:

1. The old approximately 75/min provider-path behavior is mechanically explained by the fixed post-completion wait, provider callable duration, and recurrent scheduler-cycle handoff delay.
2. The old `96/min` reciprocal-of-625-ms figure should not be described as an achievable envelope under the old implementation.
3. A simple 119-entry trailing-60-second admission controller can sustain essentially the documented Production market-data request allowance for an hour in an isolated read-only quote workload.
4. Strict single-flight provider execution is sufficient for this throughput in the isolated workload; concurrency was not required.
5. Tradier latency remained stable and no throttling occurred at about 119.72 actual HTTP starts/minute.
6. `Used` and `Available` are not supported by current evidence as authoritative admission-control signals.
7. The 625 ms fixed post-completion sleep is not supported as necessary provider protection for the measured after-hours workload.

---

## What is NOT established

Do not infer any of the following from this experiment alone:

- Herbie has been identified.
- The provider admission controller is the system constraint.
- Burst/drain traffic is optimal for regular-session evidence production.
- Scheduler handoff should be redesigned now.
- Provider concurrency is required or desirable.
- Tradier will behave identically for every endpoint mix or market condition.
- Production scheduling, universe, TTL, freshness horizon, DTE policy, or topology should be changed.

---

## Kiro next gate

Kiro should bootstrap from repository authority, then use this document as the latest evidence checkpoint.

The immediate architectural questions are:

1. Review the Codex implementation and verify the local trailing-window admission controller preserves request ordering, dependency semantics, failure behavior, and single-flight execution.
2. Confirm that normal regular-session acquisition goes through the same controller and that the after-hours measurement harness remains isolated/non-persistent.
3. Decide whether the admission/callable timestamp versus exact HTTP-start timestamp distinction requires correction before live evaluation or can remain a documented separable correctness refinement.
4. Design the regular-session A/B observation. Compare the old baseline against the new controller using starts/minute, WIP depth, oldest WIP age, Decision coverage, evidence freshness, publication cadence, provider latency/status, quota-wait duration, header behavior, and scheduler-cycle handoff gaps.
5. Keep provider-capacity utilization and whole-system effectiveness separate. A controller that reaches 119/min is not automatically a system improvement unless evidence flow improves.
6. Keep the scheduler-cycle handoff issue separate from provider admission. The earlier measurement localized about 1.2 s of delay per scheduler cycle before next enqueue; the after-hours synchronous harness did not test a prefilled pacer queue or regular scheduler topology.
7. Do not declare Herbie until the regular-session evidence supports it.

### Short Kiro checkpoint statement

> August 31 established that Wheelwright's old provider path imposed a fixed post-completion wait that materially reduced request throughput. A 119-entry trailing-60-second, strictly single-flight, no-fixed-sleep controller sustained 119.72 actual HTTP starts/minute for one hour after hours with 7,200/7,200 HTTP 200 responses, no throttling, stable provider latency, and no durable-state interference. Tradier `Used/Available` headers remain incoherent as a control ledger. The next question is not whether the provider path can run near 120/min; it can in this isolated workload. The next question is what the controller does to regular-session evidence flow and whether that changes the system constraint picture. Herbie remains unidentified.
