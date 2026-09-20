# Wheelwright Provisional Priority Stack

> **Status:** Canonical Project / Operational State (Category C).
> **Authority:** This file is the single source of truth for Wheelwright's *provisional* working order of priority.
> **Method:** Established only through explicit Principal/actor reconciliation. Never inferred.

## Semantics

This is **"our current working order of priority, subject to change."**

It is **not** a committed schedule, a delivery promise, or an immutable ordering. It carries no dates, estimates, assignees, or story points.

## Governing rules

1. Priority is **manually/reconciliation-established only**. It must never be inferred from parking-lot order, document order, recent activity, implementation status, or any heuristic.
2. Each ranked entry should reference an existing canonical identity where one applies — a `PL-*`, `LVT-*`, or `AR*` id — or state a concise reconciled description when no single id fits.
3. If no authoritative ranking currently exists, this file states that honestly and the projection/UI represent emptiness rather than a speculative order.
4. Rank is expressed by list order in the "Ranked stack" section below (top = highest current priority).

## Ranked stack

> **Ratified:** 2026-09-20 (initial stack). Reconciled between Principal and Kiro from current authority. Provisional and subject to change.
>
> **Reconciling logic (why this sequence hangs together):** make the evidence trustworthy → make capital state trustworthy → make outcomes trustworthy → learn from trustworthy evidence → improve operator attention → improve governed choices → broaden the choices → make the system continuous → make it accessible anywhere. The ratified Principles register supplies the enduring constraints underneath this order (Evidence appliance, Persist facts / derive trust, Session awareness is correctness, Failed refresh preserves evidence, Single acquisition authority, Epistemic precision, Policy over prediction). Priority orders the work; Principles constrain the ordering and are not themselves priority items.

1. `LVT-GOAL-AWARENESS` — Restore trustworthy decision-feeding authoritative state: session-authority reach to the recommendation consumer and durable sealed-evidence validity. Sources: AR1, ADR-017, ADR-007; BUG-012, BUG-013, BUG-014, BUG-019; `PL-PROV-FAILOVER`. Directly supported by principles Session awareness is correctness, Failed refresh preserves evidence, Evidence appliance, Persist facts / derive trust. Foundational — every downstream Bet depends on trustworthy state.
2. `LVT-BET-CAPITAL-CHOICES` — Deployable-cash / capital-state correctness (broker-balance ingestion → deployable derivation). Sources: `LVT-INIT-CAP-AVAILABILITY`; BUG-023; adjacent resolved BUG-022/BUG-020; zero-cash outage RCA (journal). Capital state determines the feasible choice set; wrong deployable cash silently distorts Deployment. Partially depends on #1 for coherent evidence timing.
3. `LVT-GOAL-OUTCOMES` — Production accounting correctness cluster (realized economic truth). Sources: `LVT-BET-CAPITAL-ACCOUNTING`, `PL-PORT-02`, ADR-014/015/016; BUG-002, BUG-003, BUG-006, BUG-007, BUG-008, BUG-009. Retrospective truth; below live-decision correctness but a prerequisite for the Learning loop.
4. `LVT-BET-EVIDENCE-PRIORITY` — Herbie / Constraint Identification: live-session evidence-flow evaluation of the admission controller, insofar as the active investigation requires work. Sources: current-investigation steering; Doc 39/40; `PL-SCHED-DRIFT`, AR2. Currently an evidence checkpoint awaiting a decision (Doc 40 does not authorize production optimization by itself and forbids scheduler/universe changes without authorization); interpreting live-session effects depends on #1–#3 being trustworthy. Behind Production accordingly.
5. `PL-GOV-02` — Operator discoverability + targeted hydration for admitted symbols. Sources: `PL-ELIG`; BUG-018, BUG-017. Completes the Sep-14 cohort admission; bounded, high operator value. Depends on #1 (BUG-019 blocks off-hours hydrated evidence being usable).
6. `PL-UX-01` — Lifecycle attention / position reassessment (Console "do I need to act now?"). Sources: `LVT-BET-POSITION`, `LVT-BET-ATTENTION`, `PL-EXEC-01` (lifecycle-attention direction), ADR-013, AR2. Trustworthy attention requires trustworthy state (#1–#3) first.
7. `LVT-BET-ACCEPTABILITY` — WAIT + absolute-acceptability separation (governed alternatives foundation). Sources: `LVT-BET-WAIT`, `LVT-INIT-ACCEPT-GATES`, AR3, AR5; `PL-DEPLOY`, `PL-RECIPE-01`. Supported by Policy over prediction (govern WAIT/acceptability rather than producing more recommendations). Gateway to broader strategies.
8. `LVT-BET-STRATEGIES` — Broader governed trade shapes (spreads). Sources: defined-risk child hypotheses, `PL-STRAT-01`, AR3/AR4 (consequence semantics). A hypothesis, not admitted strategy; depends on the governed-Alternative + consequence-semantics foundation (#7, AR4) and execution modularity.
9. `LVT-DIRECTION-ALWAYS-ON` — Continuity / always-on cloud runtime. Sources: `LVT-GOAL-CONTINUITY`, AR9, ADR-024, `PL-OPS-01`, `PL-OPS-08`. Enabling infrastructure whose value compounds after the evidence/decision layer is trustworthy.
10. `LVT-BET-MOBILE` — Access / mobile (attention-first). Sources: `LVT-GOAL-ACCESS`, AR10. Roadmap's own sequence is state → attention → remote delivery; depends on shared authoritative state (#1, #9) and attention (#6).
