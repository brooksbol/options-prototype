# Wheelwright Coming Soon (Now / Next / Later)

> **Status:** Canonical Project / Operational State (Category C).
> **Authority:** This file is the single source of truth for Wheelwright's user-facing product-horizon snapshot.
> **Method:** Principal-curated. A lightweight snapshot of current product focus — not a plan, schedule, or commitment.

## Governing contract

> **Authority determines whether a capability is supportable. The Principal determines its horizon. Horizon placement expresses current attention and intent, not commitment. Priority expresses current execution preference. Actual work begins only through the normal work-authorization process.**

And, separately:

> **Explicit Principal horizon changes are sufficient authority to update this snapshot, even when no implementation decision has been made.**

## Semantics

This answers **"which user-meaningful capabilities are in our near, intermediate, and farther product horizons?"** It is a **snapshot, not a prescription**: a capability may move between any horizons, appear directly in any horizon, or leave the snapshot entirely. There is no required Later → Next → Now → done progression.

- **Now** — capabilities in the Principal's near product horizon. Not "being coded," not "next commit," not a date or commitment.
- **Next** — capabilities expected to be pursued after nearer work matures; credible in Wheelwright's direction but not at the front of the horizon.
- **Later** — capabilities/directions believed to belong in Wheelwright's future, not a near-term concern. Not "unimportant."

## Governing rules

1. **Capabilities, not implementation work.** Entries are user-meaningful product capabilities (e.g. "genuine WAIT / governed alternatives"), never engineering tasks, ADR dimensions, component migrations, bug fixes, parsers, endpoints, or evidence work. How engineering produces a capability belongs in other authority.
2. **Horizons are unordered.** There is no rank within Now, Next, or Later. Markdown order, rendering order, and insertion order carry **no** priority meaning. If ordinal execution meaning is required, `docs/roadmap-priority.md` is authoritative.
3. **No commitment, no authorization.** Horizon placement is attention/intent only. Appearing in Now does not authorize work and is not a commitment; work begins only through the normal work-authorization process.
4. **Curated, no auto-inclusion.** An item does not appear merely because it is high priority, in the parking lot, in the LVT, or has an ADR. Supportability is an actor-checkable precondition; horizon placement is Principal intent.
5. **No false precision.** No dates, quarters, percentages, delivery estimates, status badges, or maturity badges.
6. **No Completed section (current scope).** When a capability is sufficiently realized that it is no longer a future product-horizon item, remove it through normal reconciliation. Durable history lives elsewhere in the repository.
7. **Empty is valid.** If a horizon has nothing sufficiently supportable and in Principal focus, it is empty rather than populated aspirationally.

## Maintenance (two triggers, no separate ceremony)

1. **Explicit Principal horizon change.** When the Principal says e.g. "move cloud to Now," update this snapshot as governance maintenance. Do not infer implementation authorization, do not require a workstream to exist, and do not automatically mutate Priority.
2. **Routine reconciliation side effect.** During normal work — course corrections, completion, abandonment, redirection — actors check whether this snapshot still truthfully represents the Principal's product horizon, as part of the existing reconcile-while-learning / end-of-workstream discipline. If Principal intent is genuinely ambiguous, surface it rather than inventing a horizon move.

---

## Now

- Position reassessment / attention — help the operator recognize when an open position deserves attention or reconsideration.
- Genuine WAIT / governed alternatives — allow Wheelwright to conclude that waiting is preferable to selecting the relatively-best available opportunity.

## Next

- Broader governed trade structures — expand the governed repertoire of trade structures Wheelwright can consider.

## Later

- Continuous / always-on operation — Wheelwright running continuously rather than depending on a local session.
- Mobile / attention-first access — extend Wheelwright's attention experience to remote/mobile use.

---

## Register metadata

```
Classification:  Canonical Coming Soon product-horizon snapshot (Category C)
Lifecycle:       Living snapshot — updated on explicit Principal horizon change or routine reconciliation
Ordering:        NON-SEMANTIC within each horizon; Priority (docs/roadmap-priority.md) is the sole ordinal execution authority
Projection:      docs/roadmap-coming-soon.md → build-time roadmap projection → read-only Roadmap "Coming Soon" lens (ADR-018 boundary)
```
