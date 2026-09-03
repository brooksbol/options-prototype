# Provider Failover / Production Recovery Findings — September 3, 2026

**Status:** Durable experiment evidence / specialized reference.  
**Scope:** Preserves the production observations from the PL-PROV-FAILOVER experiment after the production credential was replaced and Wheelwright was restarted on accepted implementation commit `097844f`. This record does not broaden implementation authority or claim that unobserved live-failback paths were production-proven.  
**Related:** `PL-PROV-FAILOVER` in the complete `docs/parking-lot*.md` sequence; `docs/40-provider-admission-controller-findings-2026-08-31.md`; `PL-EVID-AGE`; roadmap G6/N1 Decision-value-aware evidence acquisition.

---

## Executive finding

The post-restart production observation established two useful facts at once:

1. **Recovery correctness:** startup verification and production restoration after an operator-installed credential plus restart were observed against production. Ordinary acquisition remained gated until production verification succeeded.
2. **Operating constraint:** once production authentication was healthy, Wheelwright operated near the configured provider request allowance with reliable, low-latency single-flight execution and no queue accumulation. Under the captured workload, the active acquisition constraint was the configured admission budget, not provider latency, concurrency, queueing, authentication, or transport reliability.

This strengthens the earlier admission-controller finding: the provider path can consume essentially all of the intentionally allocated request budget. Future optimization above that boundary should focus on **which evidence deserves the constrained provider capacity**, not on adding concurrency without new evidence.

---

## Recovery ladder observed in production

Captured after restart with the new production credential:

- first production HTTP 200: approximately **1.75 seconds** after recorder start;
- three successful production verification probes completed in approximately **64 seconds**;
- first fresh production evidence commit followed approximately **4.4 seconds** after verification;
- `PRODUCTION_ACTIVE / NORMAL` was reached approximately **76 seconds** after boot;
- no ordinary acquisition occurred before production verification established authority.

The post-recovery saved status showed production authority active, evidence availability `NORMAL`, scheduler acquiring, and zero scheduler failures.

### Proof boundary

The experiment **did not** naturally observe every failover path.

Established by production observation:

> Startup verification and production restoration after an operator-installed credential plus restart were observed against production.

Still unobserved in a natural production transition:

- automatic in-process `degraded → production` live failback without restart;
- stale-work rejection/fencing during that live authority transition.

Those paths remain implementation- and test-proven, not production-observed by this experiment. Do not collapse these proof levels.

---

## Post-recovery provider performance

Longer deduplicated observation segment: **2026-09-03 19:29:01Z–19:52:57Z**.

| Measure | Observed |
|---|---:|
| Completed provider requests | 2,776 |
| HTTP 200 | 2,776 / 2,776 |
| Transport result `SUCCESS` | 2,776 / 2,776 |
| Successful acquisition commits | 828 |
| Acquisitions with no usable evidence | 3 |
| Provider/auth/transport failures | 0 |
| Sustained provider requests/minute | ~116 |
| Configured admission ceiling | 119 starts / trailing 60 s |
| Approximate budget utilization | ~97% |
| Maximum request-start concurrency | 1 |
| Provider backoff observed | none |

The three no-usable-evidence acquisition outcomes were evidence-quality outcomes, not provider request failures. Likewise, `ABSENT` evidence state must not be reported as provider failure.

---

## Latency baseline

| Request | Count | Mean | Median | p95 | p99 | Max |
|---|---:|---:|---:|---:|---:|---:|
| Quote | 828 | 103 ms | 83 ms | 193 ms | 389 ms | 705 ms |
| Chain | 1,945 | 141 ms | 106 ms | 296 ms | 618 ms | 2.63 s |
| Expirations | 3 | 272 ms | 365 ms | 367 ms | 367 ms | 367 ms |
| Overall | 2,776 | 130 ms | — | — | — | 2.63 s |

Provider response latency had substantial headroom relative to the governing request budget. Chain calls were predictably slower and owned the observed long tail, but the tail was modest and did not produce queue accumulation.

---

## Admission-wait behavior

Across the same segment:

- median admission wait: **0 ms**;
- p95: **1.37 s**;
- p99: **2.46 s**;
- maximum: **30.46 s**;
- provider queue depth at the saved operational checkpoint: **0**.

The isolated long maximum is consistent with reaching a rolling-window release boundary. In combination with low provider latency, near-ceiling sustained request rate, zero provider queue depth, and no backoff, it is evidence of deliberate quota pacing rather than an accumulating application backlog.

---

## Constraint interpretation

For the captured production workload:

> **Wheelwright was admission-budget-bound, not provider-latency-, concurrency-, queue-, authentication-, or transport-failure-bound.**

Strict single-flight execution sustained approximately 116 requests/minute against the configured 119-start trailing-window ceiling. Therefore the observed `max concurrency = 1` is **not evidence that provider concurrency should be increased**. Increasing concurrency cannot materially improve sustained throughput while the admission budget remains the governing constraint; it would primarily alter burst shape and add coordination complexity.

This is a Theory-of-Constraints guardrail: do not optimize a non-constraint merely because it is visible or mechanically tunable.

---

## Evidence coverage snapshot

At the saved post-recovery checkpoint:

- symbols acquired: **697**;
- coverage: **955 ready, 351 absent, 0 failed**;
- ready coverage: approximately **73.1%** of the 1,306-symbol universe;
- provider queue depth: **0**;
- cache: **697 chains, 251 quotes**;
- last batch size: **10**;
- average batch-dispatch duration: approximately **15.9 seconds**.

`ABSENT` is an evidence state, not an acquisition/provider failure. The observed failure population was zero.

---

## Relationship to evidence allocation / operator intent

The August 31 admission-controller experiment established that a 119-entry trailing-window controller could run near the documented production allowance in an isolated workload. The September 3 post-recovery observation strengthens that result under ordinary production acquisition: the provider path again operated near the configured budget with healthy latency and no queue accumulation.

That changes the useful optimization question. Once the request pipe is healthy and substantially full, the higher-value question is:

> **What deserves the constrained provider capacity?**

This supports the existing `PL-EVID-AGE` / roadmap G6/N1 direction: observe the age and usefulness of operator-facing evidence, then eventually allocate acquisition capacity according to demonstrated decision value rather than treating every possible provider request as equally valuable.

It does **not** authorize a scheduler-policy change, new acquisition tiers, Age-based ranking, or a scalar utility score. It is evidence supporting the already-recorded direction.

---

## Durable guardrails

1. Do not add provider concurrency merely to improve a concurrency metric; first demonstrate that the admission budget is no longer the active constraint.
2. Keep provider/request failure distinct from evidence-quality outcomes such as `ABSENT` or `no usable evidence`.
3. Preserve proof levels: startup restoration was production-observed; live in-process failback and stale-work fencing were not.
4. Treat the captured latency and throughput numbers as a baseline for commit `097844f` and the observed production epoch, not timeless provider guarantees.
5. Do not infer current runtime status from the experiment snapshots after the experimental process was shut down and control returned to the Principal's normal `./scripts/dev.sh` workflow.

---

## Short checkpoint statement

> September 3 production observation confirmed that, after credential recovery, Wheelwright's provider path was healthy and quota-bound: 2,776/2,776 provider requests succeeded, sustained throughput was approximately 116 requests/minute against the configured 119-start/60-second admission ceiling, provider queue depth was zero, latency was low, and single-flight execution was sufficient. Startup verification correctly gated acquisition and restored NORMAL in roughly 76 seconds. This does not prove natural in-process failback or stale-work fencing. Future throughput work should not target concurrency absent new evidence; above the provider boundary, the useful optimization problem is allocation of constrained evidence capacity according to operator value.
