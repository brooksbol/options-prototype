# Decision Surface Discovery — Expanded Row vs Drawer

**Status:** Discovery / why-state (Exploration). Not ratified architecture; not authorized for implementation.
**Authority:** Supporting discovery record (Category E). Canonical intake: **`PL-DEPLOY` refinement — Decision Surface: Expanded Row vs Drawer** (`docs/parking-lot-8.md`).
**Observed:** 2026-09-09, live working software at SYNC `6786c1b` (v1 consequence section shipped + FE/BE-conformance-repaired). Captured against `c8f24bd`.
**Actors:** Principal + ChatGPT + Kiro (3AM). Kiro as invoked actor.
**Governing method:** `foundations/strategy-architecture-reconciliation.md`, `foundations/idea-intake-reconciliation.md`, `foundations/cognitive-role-separation.md`, `foundations/visual-design-principles.md`.

---

## Governing epistemic caution (carry forward to Codex review)

> **Replacement unresolved does not mean problem uncertain.**

Working software has **falsified** the current narrow-drawer presentation for this consequence comparison. It has **not yet selected** the final replacement. Those are different epistemic states and must not be collapsed. Codex (and any reviewer) should continue to challenge unsupported promotion of the expanded-row/drawer *hypothesis*, but must not weaken the directly observed working-software *failure* merely because the replacement architecture remains exploratory. Do not let epistemic caution about the design erase the strength of the observation.

This is a specific instance of the general review discipline **"Withhold promotion without demoting evidence"** — see `foundations`/`bootstrap/project-memory-protocol.md` → *Epistemic Integrity*. That section is the reusable authority; this record is the concrete case.

The record below is deliberately structured in explicit epistemic levels so that distinction survives.

---

## 1. Observed (working-software evidence — not hypothesis)

Exercising the shipped `LVT-INIT-CONSEQUENCE-RELEASE-COST` v1 in the covered-call `CallBrief` drawer (demo SPY, 100 shares, 1 contract) **demonstrated a real visual-cognition failure**:

- Sell / Hold / Covered Call consequences are **comparative** information across a **shared owned-capital block**.
- In the current narrow contract-detail drawer, that comparison is **cognitively unusable**: the operator must read alternatives **serially**, retain their values in **working memory**, and mentally **reconstruct** comparisons that should be visually available.
- The information is intrinsically closer to a two-dimensional grid — **alternatives × consequence dimensions** — but the drawer offers vertical inspection territory and **insufficient horizontal comparison territory**.
- The v1 section additionally rendered **well below the fold**, beneath Decision Summary → Execution Evidence → Strike Neighborhood.

Three candidate quick-fixes were considered and **do not solve the problem**:
- moving the consequence section upward;
- reordering drawer content;
- merely making the existing drawer presentation more prominent.

None address the geometry: a narrow vertical column cannot present an intrinsically horizontal, multi-dimensional comparison.

This is **observed evidence**. It is not a "possible usability problem," a "placement concern," or a "layout nit." The live software failed the intended operator task.

## 2. Observed (unit-of-interaction level mismatch — evidence)

The same live session exposed a level mismatch:

- The operator selects a specific **covered-call contract/candidate** row in the table.
- The drawer naturally begins as **candidate/contract inspection** (Decision Summary, Execution Evidence, Strike Neighborhood — all evidence about that one call).
- **Sell / Hold / Covered Call are not properties of that contract.** They are alternatives applying to the **shared owned-capital block** (the shares).
- Therefore the current surface **silently crosses** from contract-level inspection to capital-block-level decision comparison, with no architectural treatment of the transition.

This establishes real architectural/design pressure. It does **not** prove that the application or the drawer must become position-centric — that resolution is deliberately deferred (§4/§5).

## 3. Derived design pressure

From the observed failure and level mismatch, comparison and inspection appear to impose **materially different spatial/cognitive requirements**:

- **Comparison** (alternatives × dimensions) wants **horizontal** territory and simultaneous visibility.
- **Inspection** (deep evidence about one selected candidate) is well served by the drawer's **vertical** territory.

This is derived design pressure — a reasoned consequence of the evidence, stronger than speculation, weaker than a ratified rule.

## 4. Leading interaction hypothesis (not ratified)

> **Comparison may belong in a horizontal expanded-row region beneath the selected candidate row, while selected-candidate inspection remains in the drawer.**

Supporting design reasoning (hypotheses/heuristics to validate, **not** durable rules):

- **Expanded row** gives full table-width horizontal territory for Sell → Hold → CC scanned across a dimension, while keeping the operator spatially anchored on the candidate row that prompted the question.
- **Stable references vs candidate variants:** Sell and Hold act as **stable reference alternatives**; different CC rows are different **versions** of the CC alternative. Expanding a different strike changes the CC column against the same Sell/Hold references — cognitively clean.
- **Candidate progressive-disclosure model** (candidate sequence, not ratified architecture): *scan table → expand interesting row → compare governed alternatives → inspect candidate detail in the drawer when needed.*
- **Information-sorting heuristic** (to test during bounded design, not a universal governing rule): *does this information help the operator compare governed alternatives, or inspect/validate the selected candidate?* — the former earns scarce expanded-row territory; the latter belongs in the drawer.
- **Tier 2 extension path (future pressure only):** a wide expanded region could later accommodate an added alternative or alternative-selection/horizontal-scroll presentation without the table acquiring dozens of columns. This is a reason the direction is *not obviously cornered*; it is **not** justification for building a Tier 2 action set or a generalized framework now.

Illustrative shape (**non-ratified**, for communication only):

```
SPY  9/10  $777  Δ.38  ...                                     [expanded]
┌────────────────────────────────────────────────────────────────────────┐
│ 100 SHARES UNDER CONSIDERATION                                           │
│           SELL              HOLD              COVERED CALL                │
│ Gross     $77,315           —                 $287 opening premium       │
│ Time      immediate         open-ended        1 day                      │
│ Downside  equity released   equity downside   equity downside            │
│ Upside    none              full              to $777                    │
│ Basis     ≈ −$23,815        n/a               n/a                        │
│ Result    cash              100 shares        shares / assignment        │
│                                            ▾ execution evidence (drawer)  │
└──────────────────────────────────────────────────────────────────────────┘
```

## 5. Unresolved (open design/architecture questions)

Deliberately not decided by this record:

- the exact expanded-row layout and interaction mechanics;
- whether expanded rows are ultimately the chosen mechanism (vs another wide decision surface);
- whether the drawer remains permanently contract-centric or becomes position-centric;
- the drawer's enduring primary subject;
- how Tier 2 alternatives will be presented, and how many alternatives a future comparison surface supports;
- any generalized decision-surface architecture.

## 6. Not authorized

No code change. No expanded-row implementation, no drawer redesign, no moving the shipped v1 section, no CapitalState, no generalized decision/state-machine or multi-leg abstraction, no scoring/ranking, no Tier 2 action set, no inference of future Tier 2 architecture, no change to consequence semantics. The shipped v1 consequence section is unchanged and correct; it simply now sits in a structure whose adequacy for comparison has been falsified.

---

## The durable one-sentence boundary

> **Working software has falsified the current narrow-drawer presentation for this comparison. It has not yet selected the final replacement.**

## Relationships

- **`LVT-BET-LIFECYCLE-CHOICES`** (governed alternatives) and **`LVT-INIT-CONSEQUENCE-RELEASE-COST`** / `LVT-BET-CONSEQUENCE-ENVELOPE` (consequences) — the drawer/row is where these meet the operator.
- **`PL-DEPLOY`** — owns normalized alternatives, owned-capital decision paths, cross-strategy comparison, unified deployment-surface direction, and release/retention consequence comparison. This discovery is interaction-surface pressure **within** that concern.
- **`PL-SURF-01`** — related but distinct: it governs result-surface completeness/truncation, not this comparison/inspection problem.
- **`foundations/cognitive-role-separation.md`** — the governing principle this instantiates for the deployment surface.
- **`foundations/visual-design-principles.md`** — progressive disclosure in particular.
- **Fidelity Tier 2** (`PL-STRAT-01` broker execution eligibility) — future pressure test only.

## Next authorized mode

**Exploration / reconciliation only.** If selected, the smallest useful next step is a bounded design of the comparison surface (which facts earn horizontal comparison territory vs drawer inspection), reconciled against the open drawer-subject question, then normal decompose/authorize gates. No UI mutation until then.
