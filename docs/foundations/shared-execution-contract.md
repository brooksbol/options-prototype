# Wheelwright Shared Execution Contract — SUSPENDED AS RUNTIME CONTROL

**Original ratification:** September 16, 2026  
**Current status:** **Suspended as runtime execution-control mechanism pending capability-boundary evidence**  
**Reason:** BUG-021 field-test evidence demonstrated that actor-readable prose did not reliably control consequential workflow transitions.

The original contract remains historical evidence and contains useful reasoning guidance, but it must not be treated as an executable permission mechanism or as proof that an actor may advance a workflow state.

Original text is durably recoverable from commit `b7a74ac37a19a7c46ff26555dcd104456e9dc512` at this path. A historical pointer also exists at `docs/historical/shared-execution-contract-2026-09-16.md`.

## Current cold-start routing

Because `docs/README.md` still routes cold actors here while the replacement mechanism is being developed/tested, this file deliberately serves as the compatibility bridge.

Read next:

1. `docs/WARNING-operating-model-reality-report-FINAL.md` — field-test evidence and limitations.
2. `docs/foundations/principal-decision-surface.md` — ratified reasoning-vs-authority distinction and fixed Principal interaction grammar.
3. `docs/experiments/ww-gate-experiment-001.md` — staged capability-boundary experiment design.
4. `docs/experiments/ww-gate-experiment-001-state.yaml` — current experimental state; representation is not enforcement.
5. Actor bootstrap as applicable:
   - ChatGPT: `docs/bootstrap/chatgpt-cold-start.md`
   - Kiro: `docs/bootstrap/kiro-cold-start.md`
   - Codex: `docs/bootstrap/codex-cold-start.md`

Do not infer that Gate Experiment 001 is active from conversation or from the existence of its design document. Its durable state determines whether it has actually started.

## Current interpretation

Useful semantic principles from the former contract — concrete Product outcomes, early Product observation, explicit uncertainty, evidence over recital — remain useful guidance where consistent with current governing authority.

The following claim is withdrawn pending empirical replacement:

> That probabilistic actors can reliably enforce consequential transition authority merely by reading, remembering, reciting, and following this contract.

Conversational claims are never authoritative execution state. Technical reasoning and execution authority are separate questions. A Codex `REJECT` does not authorize remediation or retry, and an actor recommendation does not become a Principal decision by being repeated or packaged into an implementation prompt.

The September 17 BUG-021 chain is evidence that conversational containment can fail even when actors recognize the death-spiral risk and perform technically competent work. Because the durable Gate Experiment 001 state remained `STAGED` with `experiment_started: false`, that chain must not be mislabeled as failure of an activated Gate capability boundary.

The ratified Principal Decision Surface is a human-factors control and actor self-check. It is not deterministic runtime enforcement. Do not create another prose contract and call it an execution boundary.