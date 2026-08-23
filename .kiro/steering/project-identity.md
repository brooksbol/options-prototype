# Wheelwright — Project Identity

## What This System Is

Wheelwright is an always-on evidence appliance for policy-governed options-income decision support.

The backend continuously maintains an authoritative model of the options opportunity environment. Consumers apply operator-configured policy, determine recommendation state, explain it, and support — but do not perform — execution.

## What This System Is Not

- Not a screener (it maintains a continuous evidence model, not on-demand scan results)
- Not a portfolio dashboard (it is decision support, not reporting)
- Not an automated trading system (human confirmation before any broker action)
- Not a brokerage integration (it hands off to broker, does not submit)
- Not a prediction engine (policy over prediction — always)

## Governing Principles

1. **Policy over prediction.** The system applies explicit, auditable policy to observed evidence. It does not predict market direction. Both resolution states of any position must be acceptable before deployment; predicting which will occur is architecturally inadmissible.

2. **Evidence appliance.** The backend maintains evidence continuously and independently of any connected client. The browser is a viewport, not the lifecycle owner.

3. **Persist facts; derive trust.** The database stores observations with provenance. Freshness, staleness, and validity are computed at query time from facts and session context — never stored.

4. **Failed refresh preserves successful evidence.** A failed acquisition attempt never overwrites the last successful payload.

5. **Session awareness is correctness.** Market-session semantics determine when evidence can change and when it is sealed. Acquiring during closed sessions is a modeling failure.

6. **Deterministic recommendation generation.** Same evidence + same policy = same recommendations. No hidden state, no randomness.

7. **Single acquisition authority.** One process maintains one authoritative evidence model. No split-brain.

8. **Product definition is version-controlled.** Structural knowledge, governance, descriptions, and golden product definitions are maintained in Git. Runtime persistence is derived, never authoritative.

## Cognitive Role Separation (Product Surfaces)

The system's operational surfaces serve distinct cognitive roles:

| Role | Question | Surface |
|------|----------|---------|
| Explorer | What is possible? | Write Desk (recommendation discovery) |
| Governor | Should we proceed? | Velvet Rope (admission policy) |
| Operator | How do I execute? | Operator Console + Broker Handoff |

Conflating these roles in a single interface produces poor outcomes. Each surface should serve one role clearly.

## Four Conceptual Engines

1. **Evidence Engine** — What is true about the market?
2. **Policy Engine** — Given evidence, what rules govern our response?
3. **Decision Engine** — Given policy results, what is recommended?
4. **Explanation Engine** — Why was this recommended?

## Naming

- **Wheelwright** — the overall system/project
- **Evidence Appliance** — the architectural identity of the backend
- **Write Desk** — the deployment and recommendation surface (route `/app/write`)
- **Operator Console** — the home/monitoring surface (route `/`)
- **Velvet Rope** — instrument admission governance (designed, not live)
- **Recommendation Brief** — detailed decision-support drawer for a candidate

## Repository

- GitHub: `git@github.com:brooksbol/options-prototype.git`
- The workspace root contains both the Java backend and React frontend as sibling directories.

## Key Reference Documents

- `docs/foundations/evidence-appliance.md` — System identity
- `docs/foundations/retooling-charter.md` — Migration governance
- `docs/07-architecture-current.md` — Current architecture
- `docs/foundations/backend-behavioral-invariants.md` — 18 ratified invariants
- `docs/contracts/evidence-snapshot-v1.md` — Frozen API contract
- `docs/foundations/closed-loop-engineering.md` — Engineering methodology
- `docs/foundations/policy-over-prediction.md` — Core reasoning principle
- `docs/foundations/three-actor-model.md` — Development methodology
- `docs/foundations/cognitive-role-separation.md` — Product surface design
