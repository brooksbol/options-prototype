# Project Journal — Continuation 5

> **Continuation notice.** This file is physical page 5 of the single logical Wheelwright project journal. It continues `docs/journal/project-journal.md`, `-2`, `-3`, and `-4` with no lesser authority or durability. File boundaries are pagination only; topical retrieval and chronological reconstruction must scan the complete `docs/journal/project-journal*.md` sequence (see `docs/README.md` Project-Journal Continuation Rule and `docs/bootstrap/project-memory-protocol.md`).
>
> **Why a new page here:** page `-4` carried concurrent uncommitted why-state from a separate active thread (the BUG-021 buy-to-close candidate) at the time this entry was written. Per the multi-actor shared-working-state discipline (`foundations/multi-actor-repeatability-temporal-synchronization.md` §10), that unowned working state must not be absorbed, staged, or committed by another actor. Opening this continuation lets this entry be committed as owned work without disturbing the concurrent page-`-4` edits. This is coordination hygiene, not a claim that `-4` was full.

---

## 2026-09-17 — Zero-cash Write Desk outage: known $0 deployable emptied the board (Kiro)

**Actor:** Kiro (repository-resident implementation partner).
**SYNC SHA at repair:** repair pushed at `5610f3ea5bafb20d1f323d0c19792344543b40f6` (accepted `main`; this journal entry authored at a later `main` after the unrelated Operator Console totals-alignment commit `f936879` landed).
**Mode:** Outage RCA / why-state preservation. The repair is already restored, committed, pushed, and Principal-validated. This entry only makes the RCA durable outside git history (Principal disposition: journal, **not** a numbered `BUG-*` record).
**Scope:** Independent of BUG-021 — different code paths, and the defective guards predate BUG-021 (they date to July 14/16). This entry deliberately does **not** fold in the separate operating-model / process-control finding; that remains conceptually separate.

### Operator-visible incident

On a fully-encumbered account (DEPLOYABLE **$0**, EVIDENCE = Sealed / SESSION = Closed), the Deployment / Write Desk surface showed **no** Cash-Secured Put or Buy-Write candidate rows — only "No actionable or edge put opportunities available across the evaluated universe." The board was empty when it should have shown candidates (annotated unaffordable).

### Root cause

Both Decision entry points began with `if (!snapshot || !snapshot.deployableCash) return;`. `snapshot.deployableCash` is `number | null`, where:

- `null` = **INDETERMINATE** regime (deployable cash genuinely unknown → must fail closed), and
- `0` = a **known** broker balance (a real, valid capital state).

The `!deployableCash` falsy test conflated known-`0` with unknown-`null`, so a known-$0 balance short-circuited **before the engine ran** — `recommendPuts` / `recommendBuyWrites` never executed, and in `handleNewEvidence` evidence ingestion was skipped as well. The Decision engine itself was always correct: it marks each candidate `affordable: false` rather than dropping unaffordable rows. The empty board therefore came **solely** from the premature entry-point early-return — not from any affordability filter and not from the session gate.

### Corrected invariant

- `deployableCash === 0` is a **known capital state** and must **not** suppress strategy evaluation. Explorer discovery ("what is possible?") must still run.
- `deployableCash === null` is **INDETERMINATE / unknown** and remains **fail-closed**.
- **Affordability is a candidate property, not a Deployment/Explorer evaluation gate.** A row that cannot currently be afforded is annotated `affordable: false`, never withheld.

### Repair

Both guards now gate on unknown cash only:

```
if (!snapshot || snapshot.deployableCash == null) return;   // was: !snapshot.deployableCash
```

`handleReRecommend` (~L258) and `handleNewEvidence` (~L417) in `options-prototype/src/components/WriteDesk.tsx`, each with an explanatory comment. `== null` is type-safe: it narrows `number | null` → `number` for the `recommendPuts(deployableCash: number, …)` calls. Known-$0 now proceeds; unknown-null still fails closed.

### Regression evidence

- New focused regression in `options-prototype/tests/write-desk/recommend.test.ts`: a known `deployableCash === 0` still returns the candidate, marked `affordable: false` (pinning that the engine never drops $0 rows — so emptiness could only have come from the entry-point guard).
- `tests/write-desk` suite **580/580** after the addition; `tsc --noEmit` clean.
- **Principal observed the operator-visible result: rows restored.**

### Independent diagnostic evidence (already established)

During diagnosis, an isolated replay of captured live evidence at **$0 / closed session** produced **50 actionable/edge CSP candidates plus 18 WAIT**. **Caveat:** the shared guard also blocked buy-write evaluation, so a buy-write count at $0 was **not** independently established — do **not** generalize the CSP count to buy-writes.

### Open, separate question (not a prerequisite for this fix)

Cash-balance **accuracy** is distinct from this outage: deriving $0 does not prove Fidelity reports $0, and portfolio − encumbrance does not establish tradable cash. Tracked separately if desired; it did not gate this repair.

### Commit

Repair: `5610f3ea5bafb20d1f323d0c19792344543b40f6` — `fix(write-desk): known $0 deployable cash no longer empties the board` (2 files: `WriteDesk.tsx` + the `recommend.test.ts` regression).
---

## 2026-09-20 — Roadmap Operator Surface: build-time projection of canonical roadmap authority (Kiro)

**Actor:** Kiro (repository-resident implementation partner).
**SYNC SHA:** implementation authorized and begun at accepted `main` `0d1061699ad32b86c67fb4285a64d94bd69734ef`.
**Mode:** Authorized implementation (Principal Option A, provisional UX). Canonical intake + Reconciliation Completion Record: `PL-ROADMAP-UI` in `docs/parking-lot-9.md`.

### What and why

The Principal requested a fifth top-level operator tab — **Roadmap** at `/app/roadmap`, after Console / Deployment / Production / Kreature — so Wheelwright's current future-work landscape (the LVT strategy tree plus the work and learning hanging from it) is visually comprehensible without reading `docs/roadmap.md`, `docs/architecture-roadmap.md`, and the complete `docs/parking-lot*.md` sequence. The surface must be a trustworthy *projection* of those authorities, not a competing authority, and must preserve the epistemic and governance distinctions they encode.

### Two decisions worth preserving

1. **Build-time derived projection, not runtime Markdown parsing.** The nine parking-lot files are heterogeneous (the primary file is tabular; continuations are prose Reconciliation Completion Records), so runtime parsing inside the shipped app would be fragile and could silently corrupt or drop relationships. Instead a Node generator parses the canonical Markdown into a version-controlled, read-only `roadmap-projection.json` consumed by the React surface. The Markdown remains the single authority; the JSON is regenerable and auditable against it. This aligns with "persist facts; derive trust" — the projection derives a view; it never owns roadmap truth.

2. **Explicit-only relationships.** The LVT is cleanly structured (semantic IDs + indentation parentage), so LVT parentage and each AR pressure's explicit "Pressure from:" mapping are safe to derive. But most `PL-*` items have **no** explicitly stated LVT/AR parent, and row order is explicitly not priority. The generator therefore emits a PL→LVT/AR relationship **only where the authority text states it**; everything else is emitted as unlinked rather than guessed. No manufactured relationships, priority, sequencing, progress, dates, owners, estimates, or authorization state. The reconciliation analytical labels (ALIGNED/EXTENDS/PRESSURES/…) are not rendered as item statuses because they are analysis vocabulary, not governance states.

### Governance boundary

The Roadmap surface reads a derived artifact. It cannot edit canonical state. `docs/roadmap.md`, `docs/architecture-roadmap.md`, and existing `docs/parking-lot*.md` item content are unchanged by this work. The provisional interaction model (progressive disclosure, detail panel, view filters) is a first hypothesis pending Principal inspection of the rendered page; it is not ratified information architecture.
---

## 2026-09-20 — Ratified: no runtime GitHub dependency (ADR-018) (Kiro)

**Actor:** Kiro. **SYNC SHA:** `0d1061699ad32b86c67fb4285a64d94bd69734ef` (implementation in progress). **Mode:** Architectural/security constraint reconciliation during authorized `PL-ROADMAP-UI` implementation.

**Principal decision:** The Wheelwright production/runtime environment must not contain GitHub credentials and must not depend on GitHub at runtime. Repository interaction belongs on the engineering, reconciliation, and build side of the boundary. For the Roadmap capability: GitHub/repository artifacts remain durable authority; actors update/reconcile that authority as part of major units of work; the projection is regenerated as part of the same completion process; validation verifies the shipped Roadmap reflects reconciled repository state; Wheelwright receives the resulting structured read-only projection with the application and does not authenticate to, poll, call, or retrieve from GitHub at runtime.

**Conflict check:** None. Verified the current frontend (`options-prototype/src`) and backend runtime (`evidence-service-java/src/main`) contain no GitHub credentials, clients, or calls (the only match was a code comment referencing a GitHub issue — not a dependency). The constraint conforms with and strengthens existing authority: ADR-001 (runtime reads prepared state, no live calls for this data class), the Evidence Appliance identity, and the credential-custody invariant (provider key never in the frontend → now: no repository credential in the runtime).

**Reconciled into authority:** ADR-018 appended to `docs/07c-adrs.md` (Category B, Accepted). `PL-ROADMAP-UI` architectural disposition updated to cite it. The already-authorized build-time projection design (statically imported, read-only `roadmap-projection.json`) already satisfies the constraint, so no rework — the decision confirms the architecture. Provisional-UX approach preserved. Added completion criterion: regenerate + verify the projection whenever authoritative project state materially changes.
---

## 2026-09-20 — GIA prior-art reconciliation for the Roadmap surface (Kiro)

**Actor:** Kiro. **SYNC SHA:** `0d1061699ad32b86c67fb4285a64d94bd69734ef`. **Mode:** Principal-directed prior-art inspection within the authorized `PL-ROADMAP-UI` implementation.

**Prior art inspected:** `brooksbol/-kiroj1` (GIA "Gem Compass"), specifically the "Trust Production Architecture" learning-map page and the `.kiro/specs/_reference/` artifacts (domain-capability-inventory, architecture-roadmap, trust-production-thesis).

**Key learning.** GIA had rich structured Markdown authorities but its learning-map page was a single hand-authored static HTML file that transcribed a subset of that knowledge into markup (including hand-counted coverage stats). That is the drift-prone failure mode Wheelwright's build-time derived projection is specifically designed to avoid. The comparison therefore **strengthens** the already-reconciled Wheelwright direction: derived + validated projection, explicit-only relationships, read-only UI, no runtime GitHub dependency (ADR-018).

**One justified adjustment.** GIA's reclassification/coverage views surface the *resolved* landscape ("what was learned / reclassified / closed"), not just open work. Wheelwright already owns this natively via the parking lot's Graduated/Closed Index dispositions. The v1 projection parsed only active PL items; I am extending it to also capture graduated/closed dispositions and surface them as a lightweight, clearly-separated part of the existing Parking Lot view — using only dispositions the authority records, with no GIA semantics, no hand-counted stats, no new runtime surface. This stays within the authorized capability ("what remains to be … reconciled") and the provisional-UX envelope. No Principal decision required (no material conflict).

Full comparison and disposition preserved in the `PL-ROADMAP-UI` record (`docs/parking-lot-9.md`).
---

## 2026-09-20 — Roadmap: Priority stack + Coming Soon (honest-empty by default) (Kiro)

**Actor:** Kiro. **SYNC SHA:** `0d1061699ad32b86c67fb4285a64d94bd69734ef`. **Mode:** Authorized additive UX within `PL-ROADMAP-UI` (Principal-identified gaps).

Added two small, deliberately-simple capabilities as projections of two new canonical Markdown authorities:

- **`docs/roadmap-priority.md`** — provisional working order of priority ("subject to change"), authority-established only, never inferred. Ships empty; surface says "no authoritative priority ranking established yet."
- **`docs/roadmap-coming-soon.md`** — curated user-facing future capabilities, no auto-inclusion, no delivery dates. Ships empty; surface says "nothing is currently announced as coming soon."

Key discipline preserved: **honesty about emptiness**. Neither surface is populated speculatively; the prioritization exercise and the coming-soon curation have not been done, and the UI represents that truthfully rather than inventing content. The generator strips HTML comments so authoring guidance inside the templates is never parsed as data, and fails-closed on any stale priority id reference. No backend, database, runtime GitHub, or project-management machinery — same boundary as ADR-018. Six lenses total now (Strategy, Priority, Architecture, ADRs, Parking Lot, Coming Soon). 68 roadmap/router tests pass; projection freshness verified; vite build clean.
---

## 2026-09-20 — Principles established as a first-class primitive (register + Roadmap lens) (Kiro)

**Actor:** Kiro. **SYNC SHA:** `0d1061699ad32b86c67fb4285a64d94bd69734ef`. **Mode:** Principal-directed (Option B + refinement).

**Decision:** Principles are a legitimate missing primitive in the Roadmap model (Vision = where we're going; Principles = enduring constraints on how; AR = pressure; ADR = decision; LVT/work = what we pursue). Created `docs/principles.md` as the canonical first-class Principles register and added a read-only Roadmap "Principles" lens projecting it (ADR-018 boundary preserved).

**Reconciliation — what authority already established (not invented):**
- **Architectural / build (8, ratified):** the `retooling-charter.md` "Durable Principles" — Policy over prediction; Evidence appliance; Persist facts/derive trust; Failed refresh preserves evidence; Session awareness is correctness; Deterministic recommendation generation; Single acquisition authority; Product definition is version-controlled. The charter states "These govern the system."
- **Epistemic (2, ratified):** `policy-over-prediction.md` (governing principle; also charter #1, cross-referenced not double-authored) and `epistemic-precision.md` (governing principle — explicit uncertainty over false precision).

**Deliberately excluded (honesty of the register's semantic contract "if it's here, it's ratified"):**
- **Operating / product-domain principles** (Preserve Optionality, Respect Uncertainty, Execute with Discipline, Earn Proportional Compensation, Avoid Concentration, Observe Before Acting, Sustain Institutional Behavior). The governing *model* that principles are first-class is ratified (`principles-governance-model.md`, Category A), but that document frames these seven as **"Candidate Operating Principles… initial hypotheses."** Per Principal instruction, candidate ≠ ratified; excluded until explicitly ratified. This was the one consequential judgment; I followed the authority's own "Candidate" label.
- **Implicit/decision-encoded concepts** (no runtime GitHub dependency [ADR-018]; don't manufacture relationships not established by authority; dumb runtime / intelligence in reconciliation). Operated-by or decision-level, not ratified principles; promotion is a separate explicit Principal decision.

**Result:** register = 10 ratified principles (8 architectural + 2 epistemic), projected read-only. `docs/principles.md` records the excluded sets explicitly so the boundary is legible. Seven-lens Roadmap now (Strategy, Principles, Priority, Architecture, ADRs, Parking Lot, Coming Soon). 73 roadmap/router tests pass; projection freshness verified; vite build clean.
---

## 2026-09-20 — Priority stack ratified; Principles identity consolidated (Kiro)

**Actor:** Kiro. **SYNC SHA:** `0d1061699ad32b86c67fb4285a64d94bd69734ef`. **Mode:** Principal reconciliation.

**Principles register — identity consolidation.** The Principal identified that "Policy over prediction" appeared twice (architectural durable-principle #1 and the epistemic governing principle), inflating the count to 10 when there are 9 distinct principles. Reconciled per the register's purpose (identity consolidation without changing authority): `PRIN-POLICY-OVER-PREDICTION` is now a single record carrying **both** provenance references (`retooling-charter.md` Durable Principle #1 + `policy-over-prediction.md`). Register = **9 distinct ratified principles** (8 architectural + Epistemic precision). The seven operating/product-domain principles remain excluded (candidate status; not to be used as governing justification until ratified).

**Principles ↔ Priority relationship (Principal model).** Principles constrain the ranking; Priority orders the work. Principles are generally not themselves priority items. The correctness-first spine is defensible precisely because ratified principles support it: Evidence appliance / Persist facts / derive trust (fix authoritative state before sophisticated downstream behavior); Session awareness is correctness (#1 session work); Failed refresh preserves evidence (sealed-evidence/failover in #1); Single acquisition authority (constrains evidence/hydration); Epistemic precision (resolve uncertainty rather than propagate apparently-precise unreliable state); Policy over prediction (governed WAIT/acceptability over more recommendations).

**Priority stack ratified.** `docs/roadmap-priority.md` populated with the reconciled 10-item stack, with Herbie/Constraint Identification at **#4 (behind Production)**. Rationale for the placement: Doc 40 shows the investigation's next gate is a live-session evidence-flow *evaluation* that does not itself authorize production optimization and forbids scheduler/universe changes without authorization — an evidence checkpoint awaiting a decision, not active intervention — and interpreting its live-session effects depends on #1–#3 being trustworthy. Sequence: trustworthy evidence → trustworthy capital state → trustworthy outcomes → learn → attention → governed choices → broader choices → continuity → access. The generator fails-closed on any stale priority id reference; all 10 references resolve.

**Coming Soon relationship (recorded, not yet acted on).** Principles → constrain everything; Strategy → desired outcomes; project evidence/state → reality; Priority → current working order; Coming Soon → selectively communicates user-meaningful results of that order. Coming Soon is neither Strategy nor mechanically Priority; it remains empty pending explicit curation.

75 roadmap/router tests pass; projection freshness verified; vite build clean.
---

## 2026-09-20 — Roadmap as self-documenting meta-state (foundation); Coming Soon = Now/Next/Later (Kiro)

**Actor:** Kiro. **Base:** accepted `main` `b8d699938f02d406d5a22d4ed2e4c78a00a7efa0` (uncommitted increment). **Mode:** Principal-ratified governance + implementation.

**Enduring concept codified.** The Principal articulated the Roadmap's deeper purpose: it is Wheelwright's **self-documenting meta-state** — a live projection of what the project believes, intends, prioritizes, has decided, and has yet to resolve, kept fresh as a *side effect of doing the work* rather than a separate documentation exercise. Reconciliation found a real classification gap: mechanics/boundary were governed (ADR-018) and provenance existed (PL-ROADMAP-UI, journal), but no authority stated the *why*. Codified as a new Category-A governing concept `docs/foundations/roadmap-self-documenting-meta-state.md`, deliberately independent of the current lens set (the tabs are current expressions, not the concept). The feedback loop is preserved near-verbatim: governed project meta-state → projection → Principal inspection → observation/course correction → authority reconciliation → updated projection (not circular authority; the projection never governs the state it projects). Split of homes: **foundation** = why; **project-memory protocol** = how we keep it true (generalized "Roadmap Freshness Invariant"); **ADR-018** = the repository/runtime boundary. README + ADR-018 back-references added so cold-start actors reacquire the intent before treating the Roadmap as "just a UI feature."

**Coming Soon = Now/Next/Later.** Reshaped the Coming Soon authority + lens into an unordered product-horizon snapshot of user-meaningful *capabilities* (not implementation work): NOW {position reassessment/attention, genuine WAIT/governed alternatives}; NEXT {broader governed trade structures}; LATER {continuous/always-on, mobile/attention-first}. Tab stays "Coming Soon." Governing contract: *Authority determines whether a capability is supportable. The Principal determines its horizon. Horizon placement expresses current attention and intent, not commitment. Priority expresses current execution preference. Actual work begins only through the normal work-authorization process.* Plus: *explicit Principal horizon changes are sufficient authority to update the snapshot even when no implementation decision has been made.* Two maintenance triggers (explicit Principal horizon change; routine reconciliation side effect) — no separate ceremony. Horizons are unordered: parser preserves authored order and does **not** sort (sorting would itself imply governance ordering); item shape is exactly {name, description} — no rank/date/status/percentage; no Completed section (current scope); empty is valid. Non-isomorphic with Priority by construction and by test.

76 roadmap/router tests pass; projection freshness `--check` passes; vite build clean. Uncommitted, pending Principal browser validation. Pre-existing unrelated defects (velvet-rope date-relative snapshot; baseline `tsc -b` noUnusedLocals) intentionally untouched.
---

## 2026-09-20 — Roadmap Domain lens (faithful projection of the options domain reference) (Kiro)

**Actor:** Kiro. **Base:** accepted `main` `cdf278d7a09b9b804f390c5198723fd6099270da`. **Mode:** Principal-ratified (A + fidelity constraint + mechanical matrix rendering).

Added an eighth Roadmap lens, **Domain**, projecting the canonical `docs/foundations/options-domain-reference.md` (Category E). It renders documentation; it never synthesizes a second interpretation. Governing fidelity rule: every rendered string is canonical text verbatim, a mechanically boundary-sliced excerpt, or a heading — plus grounding tags (`[MECH]`/`[THEORY]`/`[EMPIRICAL]`/`[BROKER]`/`[WW-POLICY]`/`[UNRESOLVED]`/`[HEURISTIC]`) detected mechanically. No actor-written summaries (integrity-enforced: entries carry only heading/content/level/tags/truncated/tables).

Projection: 6 Parts / 36 entries (Preface, the five reference Parts, Notes & Boundaries — nothing dropped). Part 2 lifecycle/structure matrices (CSP/CC/BW/Roll) are extracted structurally and rendered as real HTML tables with **verbatim cells** rather than raw pipe text — the Principal's flagged readability concern, fixed mechanically within the fidelity rule (the earlier prose-excerpt approach truncated the matrices away entirely). Fidelity verified end-to-end: 36 prose entries, 4 tables, 180 table cells — **zero drift** from source. Lens carries the persistent boundary: "describes the domain; does not establish Wheelwright policy or authorize trading behavior."

Boundaries preserved: source unchanged; no new authority doc; self-documenting-meta-state foundation not amended (Domain is a current expression; the "any future lenses" freshness clause already covers it); no runtime GitHub, DB, wiki, knowledge graph, or search; build-time projection, read-only runtime; freshness `--check` extended to the reference. 87 roadmap/router tests pass; vite build clean. Pre-existing unrelated defects untouched.

---
## 2026-09-21 — TSLL BTC specimen + forward-transition lifecycle design authorized (Kiro)
**Actor:** Kiro (invoked repository-resident actor). **SYNC SHA:** `848daf055197615f2a2fd6d3ea9e0333c6a6300c` (remotely verified accepted `main` at commit time; authored against `37dd918`, reconciled onto `848daf0` — intervening commit is an immaterial Deployment Show-filter UI change; working tree clean, 0/0 divergence). **Mode:** Principal Option-B **design** authorization — design authority only, NOT implementation.

**Why this entry exists.** A real TSLL short-put lifecycle (open → governed HOLD → actual operator BTC) falsified the shipped BTC/HOLD model's expressiveness. Preserving it as durable empirical evidence so the finding is not trapped in conversation, and recording the authorized design response. The specimen is **evidence to pressure-test the design, not a target the policy is fitted to reproduce** — no TSLL-specific number becomes a policy constant.

**TSLL specimen (epistemic labels preserved).**
- *Production evidence:* `-TSLL260925P9`, 1 contract, $9 strike, exp 2026-09-25; opened 2026-09-15 `+$35.34` (included); $900.00 nominal encumbrance established; closed 2026-09-21 `YOU BOUGHT CLOSING TRANSACTION … −$5.01` (deterministic, included); obligation retired; $900.00 nominal encumbrance removed.
- *Principal-observed Product/runtime evidence:* pre-close ~5 DTE, spot ≈$10.14, ~12.7% OTM, displayed Delta <0.01, gamma ≈0.039, bid/ask ≈$0.05/$0.06; post-update **Deployable $849**.
- *Repository fact:* governed pre-close result = **HOLD** (12.7% OTM missed the provisional 15% BTC threshold).
- *Derived arithmetic:* retained premium $30.33; retained fraction ≈85.77%; close/premium ≈14.18%; close/observed-deployable ≈0.59% (conceptual only).
- *Principal interpretation (NOT provenance-established):* ~$50 of the nominal release absorbed by an existing margin deficit. Not upgraded to fact — doc `56`/BUG-022 invariants forbid inferring deployable capacity from settled cash / margin holding type. The $900→$849 gap is exactly why "nominal encumbrance removed ≠ deployable cash released" is load-bearing.

**The finding.** The shipped lifecycle DECIDE (`short-obligation-decision.ts`, unchanged since `eae8305`, reverified at `37dd918`) is a static, volatility-blind DTE+moneyness risk classifier consuming only `{side, dte, moneyness, candidate, closePriceSupported}`. It ignored residual reward (~$5 remaining), current BTC debit (~$5.01), nominal encumbrance ($900), residual sensitivity (Delta corroboration), and the capital consequence (deployable-capital effect) — all available or derivable, some already in the sibling EVALUATE layer, deployable cash in `PortfolioSnapshot` (consumed by deployment engines, excluded from lifecycle DECIDE). TSLL passes the risk arm but the reward/cost + capital arms are what the current model cannot express.

**Design authorized and persisted.** `docs/design/lifecycle-forward-transition-comparison-v1-design.md` (Category E, non-governing). Smallest coherent generalized design: evaluate HOLD and BTC as competing **forward transitions**, extending the ratified HOLD/CLOSE V1 consequence seam (whose §18 already anticipated this) with a generalized **JUDGE** layer (the generalization of today's `decideShortObligationLifecycle`). Selected seam = bounded composition of "consequence vectors + separate governed judgment" (2) and "capital opportunity cost owned by `LVT-BET-CAPITAL-CHOICES`" (3), rejecting a pure enriched-DECIDE (repeats the Sep-16 collapse defect) and any opaque multi-factor score.

**Boundaries held.**
- *Historical/forward wall preserved:* residual reward uses **forward** residual option value / BTC debit; opening-premium **premium-captured-% take-profit is explicitly declined** and flagged as `LVT-INIT-POLICY-TAKE-PROFIT` scope requiring separate Principal authority (crosses the wall; `PL-DEC-BEH`/ADR-014).
- *Delta:* corroborating residual-sensitivity evidence only, per `options-domain-reference.md` D5/D1 (local sensitivity, NOT probability); fail-closed on stale/placeholder/missing/inadmissible/near-expiry-gamma; never a standalone `Delta < X → BTC`.
- *Capital:* lifecycle emits the capital *consequence fact* (nominal removed + deployable-evidence handle, regime-aware, fail-closed); the *opportunity-cost judgment* stays in `LVT-BET-CAPITAL-CHOICES` (COPX→SOXX feasible-set precedent; roadmap priority #2). No opportunity value assigned merely because capital could become available; absence of a qualified alternative must never force BTC. Truthful pre-BTC statement bounded to nominal + authoritative `deployableCash`-or-unknown; $849 exact figure is post-action calibration evidence only.

**No new identity created.** Existing homes own it: `LVT-BET-LIFECYCLE-POLICY`/`LVT-INIT-POLICY-TAKE-PROFIT`, `LVT-EXP-BTC-MECHANICS`, `LVT-BET-CAPITAL-CHOICES`/`LVT-INIT-CAP-AVAILABILITY`/`LVT-INIT-CAP-ALTERNATIVES`, `LVT-BET-LIFECYCLE-CHOICES`, `LVT-BET-CONSEQUENCE-ENVELOPE`.

**Kept separate (NOT authorized for code change):** the inaccurate `"near strike"` HOLD wording and the surviving `assignmentProbability(delta)=|delta|`/BR-5 drift (both reverified present at `37dd918`). Classified in the design (§11) as, respectively, a presentation/semantic defect and documentation/implementation drift; neither remediated.

**Epistemic status.** Design + specimen preserved as durable memory. NOT implementation authority; no production code changed. Required pre-implementation calibration (risk-arm generalization, residual-reward operational definition, capital opportunity-cost integration, 15% threshold disposition, Delta admissibility harness) routed to `LVT-EXP-BTC-MECHANICS` and the named Initiatives — thresholds are NOT invented in the design pass. Implementation gate: Principal acceptance → calibration resolved/deferred with bounded first increment → explicit implementation authorization.


---
## 2026-09-21 — Roadmap "Log" lens: reconciled as a `PL-ROADMAP-UI` refinement; the load-bearing constraint is an uneven temporal-fact authority gap (Kiro)

**Actor:** Kiro (repository-resident architecture/implementation partner). Reconciliation only; no implementation, no commit authorized.
**SYNC SHA:** `90098621332539e583c7c715cab5a125153368d2` (remotely verified accepted `main`).

**What was asked.** The Principal wants a Roadmap **Log**: chronologically, what ideas entered Wheelwright's governed meta-state and what subsequently happened to them. Ran the canonical idea-intake/reconciliation procedure against the self-documenting-meta-state foundation, ADR-018, the intake methodology, the project-memory protocol, the complete parking-lot sequence, and the current projection generator + Roadmap UI.

**Disposition.** Refinement of existing `PL-ROADMAP-UI` (identity confirmed against authority, not assumed — no existing PL item and no absent identity contemplates an intake chronology; the enduring-purpose foundation explicitly admits new/removed lenses). No new Bet, no AR change, wholly inside the ADR-018 build-time projection boundary. Full Reconciliation Completion Record lives in `docs/parking-lot-9.md` under `PL-ROADMAP-UI`. **No implementation authorized.**

**The finding worth not re-deriving — temporal authority is structurally uneven.** A truthful Log can only project temporal facts that canonical authority *explicitly states*, and those facts are unevenly recorded:

- The **prose continuation records** (`parking-lot-3.md`…`-9.md`) carry structured `**Date:**` + `**State:**` (often `**SYNC at reconciliation:**` and dated transition notes). Intake date + state + selected transitions are explicit and projectable for these.
- The **primary `parking-lot.md` table** (the older foundational `PL-*` population) has **no date column and no state column**. Dates, where they exist, are buried in free-text Summary cells and usually mark *resolution/refinement*, not *original intake*. The Graduated/Closed Index has disposition + destination but **no dates**.

So a Log built today is **complete for reconciliation-era items and partial for early primary-table items**. Per the Roadmap's explicit-only rule, the gaps must render as *missing/unknown* — never inferred. This is a real authority gap but **not a blocker**: an honest Log that says "intake date not recorded" for early items is faithful; only a *complete* chronology is blocked. Backfilling explicit intake dates into the primary table is optional, separate reconciliation work, and must not be done speculatively.

**Schema note.** The current projection (`PlItem` / `parseParkingLotFile`) captures **no date and no transition** at all. A Log lens therefore needs an explicit-only temporal extension of the projection schema — not a new authority, not a new backend, not runtime GitHub. Smallest coherent unit is spelled out in the PL record.

**Distinction held.** Journal ≠ Log. The Journal (this file) is rich why-state / intellectual history. The Log is a compact operator chronology of governed intake/reconciliation events projected from the parking lot, pointing back here for depth. No evidence in the architecture says to collapse them; not collapsed.

**Epistemic status.** Reconciliation result + authority-gap observation preserved as durable memory. Not implementation authority; no production code changed. Implementation gate: explicit Principal authorization of the smallest unit, with the explicit-only / gaps-as-unknown discipline binding.


---
## 2026-09-21 — `PL-ARCH-07` intake: Authorization Platform / COTS RBAC-FGA build-vs-buy, isolated as research/design that informs (does not depend on) PL-ARCH-03 (Kiro)

**Actor:** Kiro (repository-resident architecture partner). Intake only; no implementation, no vendor selection, no commit authorized by this entry beyond the durable intake record.
**SYNC SHA:** `90098621332539e583c7c715cab5a125153368d2` (remotely verified accepted `main`).

**What was asked.** The Principal authorized creation of a new parking-lot identity, `PL-ARCH-07` — Authorization Platform / COTS RBAC-FGA Evaluation (Build-vs-Buy) — as an `INTAKE` concern, using the scope/relationships/evidence from the multi-Operator migration-safety analysis, with one explicit dependency clarification.

**Disposition.** New canonical identity `PL-ARCH-07` created in `docs/parking-lot-9.md` (latest continuation, per continuation governance). Verified against repository authority that no existing `PL-*` owns the authorization-model / build-vs-buy question: `PL-ARCH-03` owns the eventual *users/sessions/ownership-enforcement implementation*, not the build-vs-buy evaluation. No new Bet, no `roadmap.md` change; no new AR, no ADR (an ADR becomes warranted only if/when a build-vs-buy or RBAC-vs-FGA direction is actually chosen). Must respect ADR-018 (no runtime GitHub / no runtime credential) and credential custody.

**The dependency distinction worth not re-deriving (Principal clarification, load-bearing).**
- `PL-ARCH-07` **informs** `PL-ARCH-03`.
- `PL-ARCH-03` *implementation* may ultimately **depend on** `PL-OPS-01` for real remote/multi-Operator runtime use.
- `PL-ARCH-07` is **not** enabled-by or dependent-on `PL-OPS-01` — researching/designing the authorization model / COTS build-vs-buy decision does not require cloud deployment. `PL-OPS-01` is referenced only as relevant deployment context.
- `PL-PORT-01` **preserves the authorization seam** (the Operator-ownership invariant / owner-stamping from the migration-safety analysis) but is **not blocked** by COTS authorization selection or by multi-Operator implementation. Multi-BrokerageAccount work can proceed on the ownership foundation independently.

**Why this isolation matters.** The migration-safety analysis established that the authorization layer is the expensive, safely-deferrable half of multi-Operator support, distinct from the cheap now-seam (ownership invariant). Isolating the build-vs-buy evaluation as its own research/design concern lets it proceed and inform `PL-ARCH-03` without dragging in cloud deployment or multi-Operator implementation, and without forcing `PL-ARCH-03` implementation to default to a bespoke authorization build.

**Explicitly not authorized.** No vendor selected; no RBAC/FGA/authentication/authorization/identity/session implementation; no multi-Operator implementation work; no cloud/deployment change; no new dependency or credential.

**Epistemic status.** Durable intake + dependency clarification preserved as project memory. Not implementation authority; no production code changed. Full Required Intake Record and Reconciliation Completion Record live in `docs/parking-lot-9.md` under `PL-ARCH-07`. Next mode: research/design only when separately selected by the Principal.


---
## 2026-09-21 — Roadmap Log lens implemented (Option A, smallest coherent unit) — Kiro

**Actor:** Kiro (repository-resident implementation partner). Principal-authorized implementation; uncommitted pending operator acceptance.
**SYNC SHA:** `90098621332539e583c7c715cab5a125153368d2` (remotely verified accepted `main`).

**What shipped.** The Log lens reconciled earlier today under `PL-ROADMAP-UI` is now implemented: a build-time explicit-only temporal projection (`LogEntry`/`log[]` in the roadmap projection; `parseLogEvents`/`parseLeadingIsoDate` in the generator) and a read-only `Log` lens (`LogView.tsx`) in the Roadmap surface. Wholly within ADR-018 — no runtime GitHub, no credentials, no backend. Full record in `docs/parking-lot-9.md` (`PL-ROADMAP-UI` — Log lens implemented, 2026-09-21).

**The design decision worth remembering.** The Log is a **separate projection section**, not a `date` field on `PlItem`. That preserves the pre-existing explicit-only invariant (and its integrity test) that parking-lot items carry no dates, while giving the Log its own temporal shape. It also matches the domain reality: a single `PL-*` identity accrues **several** dated records over time (intake, then reconciliation, then refinements), and the Principal wants each governed step in the chronology — so the Log's unit is the *dated record*, not the *unique PL id*. 28 dated events render today.

**The honest-gap finding held under implementation.** The reconciliation predicted uneven temporal authority; implementation confirmed it concretely: 43 of 60 parking-lot items have no explicit dated record (chiefly the primary-table rows) and therefore produce no Log event. The lens states this plainly ("Date not recorded") rather than inferring dates from order/history. No backfill was done (out of scope). If the Principal later wants a complete chronology, backfilling explicit intake dates into the primary table is separate, authorizable reconciliation work — still explicit-only.

**Two authoring shapes surfaced, deliberately not "fixed".** Two dated records name no `PL-*` in their heading (Java Test-Suite performance entries); two state no `**State:**`. Both render honestly rather than fabricated. Editing the authority to normalize them would exceed this authorization and would be authority cleanup, not Log implementation — so it was left alone and noted.

**Verification.** 1898/1898 frontend tests; clean `tsc`+`vite` build; ADR-018 freshness `--check` in sync; operator surface served and the rendered chronology inspected. Epistemic status: implementation complete and verified at the software level; **operator/product acceptance is the gate before commit**, consistent with the rest of `PL-ROADMAP-UI`'s provisional UX.


---
## 2026-09-21 — COTS authorization investigation reconciled into durable evidence (`docs/57`), linked from `PL-ARCH-07` (Kiro, governance)

**Actor:** Kiro (governance thread). Reconciliation/persistence only; no vendor selected, no authorization/authentication/RBAC/ReBAC/FGA/multi-Operator implementation authorized.
**SYNC SHA:** `be128ee21545482f1a0d6bbe58480b431b0e5024` (remotely verified accepted `main`; re-fetched, not assumed).

**What was asked.** A dedicated COTS authorization research session (research baseline `90098621…`) closed without repository mutation and handed back a substantive evidence package for `PL-ARCH-07`. The Principal authorized reconciling that package into durable authority so a future cold-start actor can recover the investigation from GitHub without the conversation and without repeating the research.

**Durable home chosen.** A dedicated evidence document, `docs/57-cots-authorization-investigation-2026-09-21.md` (Category E — bounded investigation evidence), following the numbered-discovery convention (cf. doc 56). The handoff's suggestion of "PL record + journal why-state" was treated as non-binding: the investigation is large enough that dumping it into `parking-lot-9.md` would turn the backlog identity into a research notebook. So `PL-ARCH-07` remains the backlog identity and now *points to* doc 57; the journal carries why-state; doc 57 carries the detailed vendor/model/Render/economics investigation.

**Epistemic status preserved.** Doc 57 retains the investigation's labels — `[EXT]` external evidence, `[FIND]` finding, `[HYP]` hypothesis, `[RATIFIED]` decision, `[OPEN]` unresolved. **No finding or hypothesis was promoted to ratified architecture.** The only ratified items are the previously-ratified relationship decisions (PL-ARCH-07 informs PL-ARCH-03; not dependent on PL-OPS-01 for research/design; PL-OPS-01 is deployment context; PL-PORT-01 not blocked; near-term multi-BrokerageAccount may proceed with one implicit Operator preserving the authorization seam).

**Discoverability.** `PL-ARCH-07` intake record (`parking-lot-9.md`, question 7 "richer evidence/why-state") now names `docs/57-…` explicitly.

**Git-safety note (important).** The working tree carried extensive **unrelated in-flight `PL-ROADMAP-UI` / Log-lens work** (`RoadmapView.tsx`, untracked `LogView.tsx`, roadmap projection scripts/types/json/css, roadmap tests, and Log-lens prose interleaved in `parking-lot-9.md`/`journal-5.md`). That work is foreign to this task and was **excluded**: only the new `docs/57` file and the isolated `PL-ARCH-07`-pointer / journal hunks were staged (via `git add -p`), and the staged diff was inspected to confirm no Log-lens content was present before committing.

**Epistemic status.** Evidence persisted as durable project memory. Not implementation authority; no production code changed. Next mode for `PL-ARCH-07`: research/design only when separately selected by the Principal.


---
## 2026-09-21 — Codex authorization-review closure: one blocking finding reconciled (account-locality), rest deferred; review loop closed (Kiro, governance)

**Actor:** Kiro (governance thread). Bounded closure reconciliation; no COTS research, no authorization-model/vendor/grant/multi-Operator design, no application implementation authorized.
**SYNC SHA:** `6a99217ec8a107b333519dd60ceadd4c919b7862` (remotely verified accepted `main`; re-fetched, not assumed).

**Why this entry exists — the convergence rule.** Wheelwright was at risk of a research/reconciliation spiral (Kiro researches → governance reconciles → Codex reviews → governance reconciles the review → …), where each pass finds another legitimate refinement and nothing stabilizes enough to build. The Principal ratified a convergence rule: a review finding may reopen current design only if ignoring it would (1) semantically redefine a core domain object later, (2) leave a material safety/capital-path failure unresolved, (3) contradict ratified authority, or (4) create materially irreversible/migration-hostile debt. Otherwise: record → defer → proceed.

**What was accepted as blocking (threshold #1).** Codex's finding that **near-term multi-account state must be keyed by stable `BrokerageAccount` identity and be account-local, NOT partitioned by Operator ownership.** Account-local durable objects (`PortfolioSnapshot`, intents, Production state, broker-handoff evidence, capital-history) reference `brokerageAccountId`; external broker account ref, application authorization, and financial/legal ownership are each separate concerns. Using an Operator/user id as the partition key now — merely because Brooks is the only Operator — would force semantic redefinition of those objects when a second human arrives. Reconciled into `PL-PORT-01` (durable authority) and `docs/57` (§Codex review closure). This supersedes the earlier "(depends on PL-ARCH-03)" framing on `PL-PORT-01`; multi-account is not blocked by authorization/operator work and proceeds under this invariant.

**What was deferred (fails the threshold).** RBAC/ABAC/ReBAC/FGA; AccountAccessGrant shape; principalId/userId/Operator terminology; service/AI principals; Cerbos/OpenFGA/WorkOS/Permit/Auth0 comparisons; OPA/Cedar/SpiceDB gaps; permission vocabulary; deeper COTS evaluation; authorization audit architecture; provider selection. All recorded as `PL-ARCH-07` `[OPEN]` concerns in `docs/57`; none blocks multi-BrokerageAccount work.

**Closure.** The Kiro → governance → Codex review budget for this question is exhausted. No further independent architecture review of this reconciliation. Governance's reconciliation is the closure operation, not new material to review. Next phase: concrete multi-BrokerageAccount design/work under the ratified account-locality invariant. New architecture review only if implementation surfaces new evidence crossing the reopening threshold.

**Git-safety.** Unrelated in-flight `PL-ROADMAP-UI` / Log-lens work (roadmap scripts/types/json/css, `RoadmapView.tsx`, untracked `LogView.tsx`, roadmap tests, and Log-lens prose interleaved in `parking-lot-9.md`/`journal-5.md`) preserved exactly as-is and excluded from this commit via surgical staging; staged diff inspected to confirm no foreign content.

**Epistemic status.** Closure reconciliation persisted as durable authority. Not implementation authority; no production code changed.


---
## 2026-09-21 — Roadmap Log lens corrected after Codex NOT-READY review — Kiro

**Actor:** Kiro (repository-resident implementation partner). Correction of the uncommitted Log implementation; still uncommitted, now awaiting a second independent review.
**SYNC SHA:** `6a99217ec8a107b333519dd60ceadd4c919b7862` (remotely verified accepted `main`; the first pass was authored against `90098621…`, which `main` has since advanced past).

**What happened.** Codex reviewed the first Log implementation and returned NOT READY with two blocking findings and several material ones. All were correct. Corrected in place — the projection→UI structure held, no restart. Durable record: `docs/parking-lot-9.md`, "PL-ROADMAP-UI — Log lens corrected after Codex review (2026-09-21)".

**The two findings worth remembering (they are subtle and I got them wrong the first time):**

1. **Depth blindness dropped real records.** Recognizing temporal records only at `##` silently swallowed explicitly dated `###` records — including the Log lens's own two `###` records. The corpus had 30 dated records; I emitted 28 and did not notice. Lesson: when a canonical corpus mixes heading depths, an event-extraction rule must be *semantic* ("a heading block that states its own `**Date:**`"), enforced with a **corpus-reconciliation test** that recomputes the expected count straight from the Markdown. Hardcoding the count (28) would have hidden the defect; recomputing it exposes drift automatically. (Adding the correction record itself moved the live count to 31 — the reconciliation test tracked it without edits.)

2. **Event date is not intake date.** I let "does this identity appear in any dated event?" stand in for "is its intake date known?" and the UI asserted "43 of 60 have no dated intake record" — a claim the data could not support. A reconciliation/refinement/implementation event dated today says nothing about when the identity was first taken in. The correct model derives an explicit **event kind** and treats intake-date-known as *there exists an intake-kind event*. `PL-ROADMAP-UI` is the clean example: it has dated reconciliation + implementation events but no intake event, so its original intake date is honestly unknown. The corrected surface lists the 53 unknown-intake identities by name rather than as a possibly-misleading aggregate.

**Also corrected:** fail-closed real-calendar date validation (impossible dates now fail generation visibly instead of being silently normalized/sorted last); state badges only on exact leading tokens (no "not closed" misread); removed the `transitions[]` prose-scrape in favor of explicit dated events; corrected UI/why-state wording so the Log no longer implies a journal link it does not provide (`sourceFile` is provenance, not a why-state reference).

**Epistemic status.** Corrected and verified at the software level (roadmap 132, full suite 1913, build clean, freshness in sync, fail-closed proven end-to-end). NOT declared commit-ready on passing tests alone — awaiting a second independent (Codex) review and then Principal operator-surface acceptance, consistent with `PL-ROADMAP-UI`'s provisional-UX discipline. The general lesson for the Roadmap projection family: *derive counts and coverage from authority and test the reconciliation, and keep "an event happened" strictly separate from "this specific governed fact (intake date) is known."*


---
## 2026-09-21 — Roadmap Log lens: final bounded correction after second Codex review — Kiro

**Actor:** Kiro. Final bounded implementation pass; uncommitted, awaiting one constrained Codex verification against a frozen acceptance contract.
**SYNC SHA:** `1a9eafa24e6963a4266d752038fc7e6fe13fcdb9`.

**What happened.** Second Codex review found a finite defect set; all corrected in place (no restart). Durable record: `docs/parking-lot-9.md` "Log lens final bounded correction after second Codex review (2026-09-21)". This was explicitly the last open-ended-review iteration — the Principal froze an eight-invariant acceptance contract and a stopping rule.

**The one idea worth remembering (I got it wrong twice before).** *An event happening is not the same fact as a specific governed fact being known.* I first used `eventKind === "intake"` to decide whether an identity's original intake date was known. That conflates classification with evidence. A single canonical record can carry two independent facts: `PL-DEPLOY-02-DEF01` is a **remediation** record whose `**Date:**` line explicitly says `(intake)` — so it establishes intake while being a remediation event; `PL-ROADMAP-UI`'s record is a **reconciliation** that explicitly "created the canonical identity" — so it establishes intake despite not being kind=intake; and an "INTAKE refinement … no new `PL-*` identity created" must **not** establish intake despite containing the word INTAKE. The fix models `establishesIntake` as its own explicit signal (`(intake)` date marker, or "canonical identity created" in state, minus the negative), independent of `eventKind`. Known-intake went from a false "7/60" (and earlier a misleading "43/60 no dated intake record") to a derived, defensible **9 known / 51 unknown**, reproducing all nine of Codex's falsification identities from authority.

**Other corrections.** (a) Depth-generic heading attribution (levels 2–6, general nearest-enclosing rule) instead of special-casing `##`/`###`. (b) True `sourceOrder` tie-break for same-day events (parent before nested child). (c) Removed the event-kind substring leak — "V1 NOT IMPLEMENTED" no longer reads as implementation; `unclassified` over guessing. (d) Strengthened the corpus test into an **independent oracle** keyed by `file::title::date` set equality (a count-only check let "one missing + one extra" pass). (e) Verified independent intake-evidence tests whose truth comes from authority, not from the generator's own classification.

**Method lesson for the Roadmap projection family.** Derive coverage/known-sets from explicit authority signals, keep independent facts independent, and verify with an oracle that does not reuse the code under test. A count that matches is not proof of correspondence; identity-keyed set equality is.

**Epistemic status.** Corrected and verified at the software level (roadmap 149, full 1930, build clean, freshness sync, fail-closed reconfirmed, lint/diff clean). Operator validation is a text render (no screenshot capability). NOT commit-ready on tests alone — next is one constrained Codex verification against the frozen invariants, then Principal operator-surface acceptance. Non-blocking robustness/UX ideas belong in follow-up parking-lot state, not another reimplementation loop.

---

## 2026-09-21 — Option A recovery: Sawdust Roth cash-layout Deployable fix shipped; Upload All dropped — Kiro

**Actor:** Kiro (repository-resident implementation partner). Authorized work item resumed after the prior Kiro session hit its attached-document limit; closed out under the Authorized-work closeout rule (`bootstrap/project-memory-protocol.md`, SYNC `57a3bca`).

**What happened.** Resumed the Principal-authorized Option A recovery from the clean `e6e743b` code baseline. Reconciled git truth first: remote had advanced past the stale handoff (accepted-main was `7d14412`, not `56c3363`), and the working tree already carried an *incomplete* uncommitted parser change — the interface field `availableToTradePresent` and the classifier branch existed, but `parse()` never populated the flag, so it would not actually have fixed the Sawdust case. Wired the producer, grounded the fix in the real Sep-2026 specimens the Principal pasted, and shipped it as `970f87a`. Increment B (Upload All / multi-select) was **dropped by the Principal (Option 4)**.

**Increment A — the fix.** Fidelity's Sep-2026 cash export dropped "Available to trade (all settled)" and split out "Settled cash", so the modern cash layout classified INDETERMINATE and blocked the Roth account. Smallest sufficient change: record a value-bearing "Available to trade" row as cash-regime evidence; cash Deployable prefers legacy all-settled and falls back to the headline; MARGIN still wins on presence; "Settled cash" is never Deployable. Real-specimen + browser acceptance: PTS → MARGIN / $849.30; Sawdust Roth → LEGACY_CASH / $458.42; both produced a fully populated Production page after Activity upload. Durable record: `docs/parking-lot-9.md` §"PL-DEPLOY-BAL — Sep-2026 cash-layout Deployable fix shipped (2026-09-21)".

**Findings worth remembering.**
- *The "silent failure" was not a bug.* `buildSnapshotForAccount` returns null unless BOTH Option Summary and Balances are present; uploading one file leaves the snapshot null with no operator feedback — an ordering trap, not a defect. I diagnosed it against the real files at the store layer rather than guessing, and confirmed the correct outcome once both files were present.
- *"Working activity upload" means a populated Production page.* The Principal's real acceptance bar for Activity was a fully populated Production page, which runs on the Java backend (`POST /api/production/assess`). Verified against the real Sawdust History file: HTTP 200, known cash production $1,241.88. The Activity capability was fully present; the gap was purely workflow (Activity must reach the active account's slot).
- *Increment B was unsatisfiable as specified.* The handoff's identity-gated multi-select ("unidentified Balances fails closed", "route by content identity") collides with reality: real Fidelity Balances *and* Option Summary exports carry no embedded account reference (confirmed — refs return null; the number is only in the filename). Filename-derived identity was already rejected by the ratified selection-as-identity decision at `e6e743b`. Surfaced this contradiction to the Principal rather than silently picking a resolution; the Principal chose to drop Upload All entirely.
- *DoD is not a file.* I initially searched for a `definition-of-done.md`; there isn't one. The governing completion criteria are the End-of-Workstream Memory Check inside `bootstrap/project-memory-protocol.md`, where the Principal had just added (a) the Roadmap Log explicit-dated-canonical-record criterion and (b) the accepted-main SYNC criterion. Reached them via authority routing, not filename guessing.
- *A closeout gate the Principal removed.* I stopped after identifying the required closeout to ask for re-authorization of ordinary persistence — exactly the failure specimen the Principal then corrected with the Authorized-work closeout rule. This journal entry and the PL-DEPLOY-BAL dated record are that carried closeout, executed without a new gate.

**Excluded, confirmed not leaked.** The failed-session capital-history attribution work and the FE/BE persistence architecture (PL-PORT-01 Durable Brokerage Evidence Persistence / Incognito invariant) were deliberately not touched. The Increment A commit changed only `balancesParser.ts` and its test.

**Epistemic status.** Increment A verified at every level (focused tests, adjacent suites, tsc, and Principal real-browser acceptance for both accounts) and committed/pushed/remote-verified at `970f87a`. This closeout is reconciliation-only.

---

## 2026-09-21 — Intake: Upload All and portfolio capital-graph as PL-PORT-01 refinements — Kiro

**Actor:** Kiro. Principal-directed intake ("create the work items, follow the process") for two concerns that surfaced during the Option A recovery but were not durably captured.

Both reconcile as refinements of `PL-PORT-01` (portfolio-state maturity), not new top-level `PL-*` identities, per the idea-intake methodology's prefer-existing-structure rule:

- **`PL-PORT-01-UPLOAD-ALL`** — multi-file "Upload All" import affordance. Dropped for the recovery by Principal (Option 4); preserved as deferred future UX. Key unresolved tension recorded: identity-gated multi-select is unsatisfiable against real Fidelity files (no embedded account reference; number only in filename), so any future implementation must honor the ratified selection-as-identity decision or introduce a new identity source first. No new Bet/AR; import-UX convenience beneath `LVT-INIT-POS-STATE`.
- **`PL-PORT-01-CAPGRAPH`** — portfolio capital-history graph durability/restoration. The graph is empty after the storage clear because the capital trajectory persists only in browser localStorage. Reconciled as the concrete instance of the Incognito-invariant question (durable authority vs disposable presentation state — unresolved), under AR6/AR1 durable-state pressure and the PL-PORT-01 Durable Persistence refinement. Explicitly must NOT reopen or authorize the excluded capital-history attribution-by-inference work. Not a `docs/bugs/` defect: clearing client-local storage legitimately clears client-local state; whether it should have been durable is a capability/architecture question.

Both carry full intake records + Reconciliation Completion Records in `docs/parking-lot-9.md`. Neither authorizes implementation. Roadmap Log/projection regenerated so the two refinements are visible from canonical authority.


---

## 2026-09-22 — Brokerage-facing capability model crosses durability threshold — ChatGPT

**Actor:** ChatGPT. **Mode:** Principal-authorized intake + project-memory reconciliation. **Intake commit:** `b074d9bb95f87366382f7054d858091fc4a3f9c9`.

**What changed in understanding.** A discussion that began with Fidelity options-permission friction and possible brokerage/integration alternatives evolved past any one broker, integration, LVT node, initiative, or existing parking-lot item. The Principal stopped solution-space exploration before it became vendor-led and identified the more fundamental work: appraise Wheelwright's brokerage-facing capabilities and incumbent fitness before deciding what “better” means or shopping for mechanisms.

The durable problem-space decomposition is four capability surfaces:

1. **Portfolio State** — brokerage-account financial state, identity, provenance, freshness, availability/encumbrance.
2. **Market Evidence** — options/market observations and their provenance, freshness, trust/fitness.
3. **Execution** — movement from operator-authorized TradeIntent toward actual market action, including representation/review/handoff and authority boundaries.
4. **Lifecycle / Outcome** — authoritative reconstruction of what actually happened and its economic/portfolio consequences.

**Principal framing worth preserving.** *Capabilities are currency in the problem space; vendors, APIs, platforms, aggregators, and drop-in/hosted components live in the solution space.* The incumbent must be appraised before a landscape survey. The intended inquiry order is: **incumbent appraisal → observed problem/pressure → solution-neutral “better” → decision criteria → solution classes → landscape survey → evidence/experiments → decision.** This is explicitly intended to avoid “hammer shopping when I don't know if I have nails.”

**Incumbent posture.** Tradier APIs, Fidelity CSVs, and Fidelity/browser execution handoff are not being characterized as mistakes. They were direct, pragmatic mechanisms that produced working software and the operational evidence now making the deeper capability boundaries visible. The corresponding counter-principle is equally important: what got Wheelwright this far is not presumed to be what gets it the rest of the way. **Keep** is a first-class outcome; replacement must earn displacement of a working incumbent.

**Quality-attribute posture.** The Principal uses six contextual “-ities” — usability, security, reliability, extensibility, maintainability, and scalability (including performance). Their relative importance is application/surface-specific rather than globally ranked. The present integration discussion is substantially **usability-forward and security-supported**: CSV copying, dual-browser execution/re-entry, manual chain scanning, and reconciliation are examples of mechanical operator impedance, while integrations add trust/threat surfaces that must be bounded. Security-first reasoning is valid, but security is not the sole objective.

**Platform hypothesis — deliberately downstream.** A mature trading/connectivity platform might supply multiple brokerage capabilities and save Wheelwright from implementing broker-specific plumbing. That is an attractive hypothesis, not a conclusion or requirement. No platform/vendor survey should begin until the incumbent appraisal establishes actual nails and solution-neutral criteria.

**Canonical intake.** Complete `parking-lot*.md` reconciliation found existing narrower homes (`PL-PORT-01`, `PL-EXEC-01`, evidence family, `PL-DEPLOY-BAL`, broker eligibility, etc.) but no one item owns the cross-cutting capability-provision appraisal. New canonical identity `PL-BROKER-CAP` was therefore created in `docs/parking-lot-9.md` at **INTAKE** only. It does not supersede the narrower items and does not establish a new LVT/AR/ADR direction.

**Epistemic status.** Durable discovery/intake + why-state. Strategic and architectural reconciliation intentionally remain incomplete. No vendor selection, landscape survey, API spike, generalized broker abstraction, execution-authority expansion, or implementation is authorized.

**Resume point.** When Principal-selected, continue in the **problem space** by appraising the four surfaces from incumbent evidence. Do not begin with vendors or mechanisms.


---

## 2026-09-23 — Semantic-model gap made explicit; v1 draft created (`PL-SEM-01`)

**What changed in understanding.** Options-intent and nomenclature work exposed that Wheelwright's problem is larger than the overloaded word `strategy`. The repository contains mature bounded semantic models but never produced one integrated model of Wheelwright's world. The file historically named `02-domain.md` is better understood as an early-slice mixed domain-knowledge/calculation/data-contract artifact, not the canonical domain model the name suggests.

**Concrete trigger.** The same covered-call construction can serve opposite operator purposes: UNG disposition can make call-away desired, while a strategic SPY overwrite can use low-delta calls for incremental premium while retention is desired. Conventional practitioner lists also legitimately call payoff constructions such as covered calls, protective puts, iron condors, straddles, and calendar spreads “options strategies,” while the Wheel is closer to a recurring lifecycle program. The market vocabulary is useful but too overloaded to carry Wheelwright's machine semantics by itself.

**Independent review.** Codex independently reviewed the information architecture and agreed that Wheelwright has neither a canonical ontology nor an integrated domain model. It characterized the current state as a federation of semantic submodels. Its strongest additional finding was a missing cross-cutting semantic-assertion grammar: who asserts what, about which subject, for what effective time, from what evidence/authority, at what epistemic level, and through which transformations may that meaning travel. It also independently identified association/subject resolution, the decision-to-execution ladder, portfolio topology, integrated accounting relationships, capability/executability, counterfactual semantics, validity/revocation, and explanation trace as integration gaps.

**Capability finding.** Capability/executability is distinct from mechanics, desirability, and policy admission. An Alternative can be mechanically coherent and policy-admissible yet unavailable because of account permission/tier, broker support, collateral treatment, settlement state, market evidence/liquidity, supported order semantics, or Wheelwright support maturity.

**Information-architecture conclusion.** Ontology and operational domain model remain useful intellectual distinctions, but the working direction is one eventual **Wheelwright Semantic Model** with explicit sections for both, to reduce the risk of two adjacent authorities drifting. Specialized domain references remain specialized owners rather than being duplicated.

**DDD boundary.** This work deliberately stops before bounded contexts, aggregates, repositories, domain services, anti-corruption layers, context maps, CQRS/event sourcing, or service/module boundaries. Those should be discovered later from stable semantic identity, ownership, authority, invariants, and consistency requirements rather than imposed first.

**Durable action.** Principal explicitly authorized creation, GitHub persistence, wiring, and project-memory reconciliation of a v1 draft. New canonical intake `PL-SEM-01` owns the unresolved semantic-integration concern. `docs/58-wheelwright-semantic-model-v1.md` is the bounded Category E draft/review target. It is not ratified Category A/B architecture and authorizes no implementation migration.

**Still unresolved.** Position/lifecycle identity; capital-pool/mandate topology; whether lot identity is always required; Wheel program/cycle identity; the exact boundary of Intent versus objective/purpose/mandate; authoritative operator declarations; capability fact lifetime; and eventual DDD context/aggregate boundaries remain open design questions.


---

## 2026-09-23 — Semantic Model v1.1: Principal selects specimen-driven reconciliation

The first independent adversarial review of `PL-SEM-01` validated the persistence/governance package and independently ran the repository's actual `npm run check:roadmap-projection` against accepted main successfully. It also found four material semantic type collisions in v1: Event versus evidence of Event; capability versus current feasibility versus Wheelwright support; slash-combined concept families mislabeled as primitives; and counterfactual Consequence versus realized outcome.

The Principal was presented three paths: **A** narrow patch, **B** specimen-driven semantic-core reconciliation, or **C** immediate expansion into DDD/domain architecture. The Principal selected **B**, the recommended path.

v1.1 therefore revises the semantic core before any DDD decomposition. Event is now independent of observation; Event Observation / Assertion and Reconciled Transition / Outcome are distinct. Capability, current feasibility/executability, and Wheelwright support status are separate axes. The primitive claim is withdrawn in favor of candidate concept families pending decomposition/specimen survival. Counterfactual Consequence, Mechanical Event Effect, Reconciled Outcome, and Economic Attribution are distinct. Candidate/Alternative and Position/Complete Position remain explicit review pressure rather than hidden equivalences. The decision-to-execution ladder now states authority boundaries.

`PL-BROKER-CAP` is explicitly related but non-duplicative: it owns brokerage-facing capability-provision/incumbent appraisal; `PL-SEM-01` owns the general semantic distinction among capability, present feasibility, and Wheelwright support.

The DDD boundary remains unchanged: no bounded contexts, aggregates, repositories, domain services, anti-corruption layers, context maps, CQRS/event sourcing, persistence schemas, or implementation migration are authorized.

**Next pressure:** second independent adversarial review of v1.1 and specimen-driven falsification. No Principal decision is required before that review.


---

## 2026-09-23 — Semantic Model v1.2: focused reconciliation continues; practitioner-strategy pressure pinned

The second independent adversarial review of Semantic Model v1.1 verified accepted authority, project-memory wiring, and Roadmap projection freshness. It concluded that v1.1 should remain active and need not be withdrawn, but is not ready for ratification.

The review's principal blockers are Position identity; quantified portfolio association semantics; assertion applicability/validity; actual World/Economic State versus source assertions and Wheelwright Reconciled State; and the unresolved boundary of Intent. It also surfaced quantity/unit semantics, absence/conflict semantics, commitment/cancellation, reconciliation-correction semantics, and decision-trace identity.

The Principal agreed to the recommended focused identity–association–assertion continuation. The core specimen set is strategic SPY overwrite with multiple lots, partial assignment with late broker evidence, Wheel across a cycle boundary, and HOLD/CLOSE with residual state.

A **long straddle** was added as a deliberate control specimen. Its purpose is to falsify accidental modeling of only Wheelwright's current covered-call/CSP/Wheel center of gravity: two long option rights, same-strike/same-expiration relationships, two opening debits, no underlying inventory requirement, bilateral convex payoff, and no covered-call-style assignment-intent semantics must still fit the core distinctions.

Separately, the Principal supplied practitioner educational material whose conventional “strategy” treatment includes mechanics and selection/use criteria. That broader corpus is intentionally pinned for later semantic pressure. It may test construction mechanics, debit/credit formation economics, payoff topology, directional/magnitude scenario thesis, volatility/time exposure, lifecycle behavior, applicability/use case, and external strategy vocabulary. It is **not** being silently promoted into the semantic model before the focused reconciliation stabilizes.

Semantic Model v1.2 records these refinements while retaining the DDD boundary. No ratification, implementation, bounded contexts, aggregates, anti-corruption layers, context maps, or persistence design are authorized.

**Next pressure:** specimen-driven identity–association–assertion reconciliation, with the long straddle as a generalization control; broader practitioner-strategy mechanics/outlook/applicability analysis follows only after that focused pass stabilizes.


---

## 2026-09-23 — Semantic Model v1.3: identity–association–assertion specimen pass completed

The focused Option-C continuation has completed against strategic SPY with multiple governed quantities and overwrite calls, partial assignment with late broker evidence, Wheel across a cycle boundary, HOLD/CLOSE with residual state, and a long-straddle control outside Wheelwright's current covered-call/CSP/Wheel center of gravity.

The pass rejects a universal canonical `Position` identity. It separates Holding/Obligation Record, Economic Construction, Decision Subject, Complete Position, and provisional Lifecycle Subject/Episode. Complete Position is treated as conclusion-relative reasoning closure unless future specimens prove durable identity is required.

Portfolio relationship semantics were strengthened: coverage, encumbrance, allocation, pool/mandate/program membership, lifecycle association, and accounting attribution are governed claims rather than pointer-like facts. Quantity/unit, effective interval, authority, overlap/exclusivity, and correction/conflict can be semantically load-bearing.

The epistemic boundary is now explicit: World/Economic State is independent of Wheelwright knowledge; Observation is evidence; Assertion is a bound claim; Reconciled State is what Wheelwright currently accepts. Late evidence and reassociation can change accepted history without changing when an Event actually occurred.

Normative semantics were narrowed: Objective/Purpose, Outcome Stance, Constraint, Preference, and Action Choice are separate. `Intent Assertion` is provisionally narrowed toward scoped Outcome Stance rather than serving as an umbrella.

HOLD/CLOSE exposed commitment, withdrawal/cancellation, cancel-replace, partial execution, and residual-state semantics. The long-straddle control demonstrated that the core can represent two long Rights and a multi-leg construction without importing inventory, short-obligation, call-away, or Wheel assumptions.

The model advanced to **v1.3**. Ratification remains blocked on the explicitly retained identity/authority/topology questions, and DDD remains downstream.

**Next pressure:** the previously pinned broader practitioner-strategy falsification pass. Its purpose is to test the semantic model against conventional strategy bundles—mechanics, opening cash flows, payoff geometry, directional/magnitude thesis, volatility/time exposure, lifecycle, applicability, and vocabulary—without manufacturing a universal `Strategy` type or inferring operator Intent from practitioner criteria.


---

## 2026-09-23 — v1.3 coherence repair and practitioner-source provenance bound

The independent v1.3 review accepted the specimen-driven semantic direction but found bounded contradictions and precision defects: stale earlier sections competed with Section 21; a coverage escape clause allowed authority to appear capable of overriding physical-delivery mechanics; HOLD was described too strongly as preserving state; and commitment withdrawal was conflated with broker cancellation/order state.

The Principal selected **Option B — narrow v1.3 coherence repair and source binding**. This selection is itself valid Principal decision ingress; project-memory persistence records the decision rather than serving as a prerequisite for the decision to exist. Actor mutation authority is separate.

The producing actor repaired the Semantic Model in place without advancing beyond v1.3:

- canonical identity language now rejects universal `Position` identity consistently;
- Complete Position is consistently conclusion-relative reasoning closure;
- Event/Execution Observation and Assertion are separated;
- Objective/Purpose is separate from the provisionally narrowed Outcome Stance / Intent Assertion;
- portfolio topology is expressed as governed association rather than a generic containment tree;
- duplicate physical share coverage cannot be authorized contrary to mechanics;
- HOLD continues an obligation without a current transaction and without freezing state;
- withdrawal, cancellation request, canceled-order state, cancel/replace, partial execution, and residual commitment remain distinct.

The practitioner source is now durably identified as YouTube video ID `5BMMrfBtA_c`, supplied URL `https://youtu.be/5BMMrfBtA_c?si=YqV2dB-SEdyzFUpk`, supplied by the Principal on 2026-09-23. The repository does **not** yet establish the title, channel/publisher, publication date, transcript, reviewed segments, or exact claims. Those must be acquired and classified before use; the source is evidence pressure, not Wheelwright mechanics or policy authority.

**Next pressure:** independent review of this bounded repair. Only after it survives should the broader practitioner-strategy falsification pass begin. DDD remains downstream.


---

## 2026-09-23 — Practitioner-evidence research workstream made durable

The Practitioner Corpus workstream reached a deliberate stopping point after completion of Practitioner Corpus v1 and the first successful corpus-first Product Challenge. The Principal selected **Option A** for durable continuation: create a dedicated canonical research identity and preserve the Product Challenge Test 2 result as a separate research artifact.

Canonical intake is now **`PL-RESEARCH-05 — Practitioner Corpus / Practitioner-Evidence Research Program`** in `docs/parking-lot-9.md`. The item is **INTAKE / ACTIVE RESEARCH** only. It preserves the research program's identity, contamination boundary, why-state, downstream boundaries, and next research mode without creating Product, semantic, domain, architecture, policy, roadmap, or implementation authority.

The Test 2 result is preserved at `docs/research/practitioner-corpus/product-challenge-test-2-2026-09-23.md`. The experiment derived and froze ten capability hypotheses from the completed corpus before current Wheelwright Product/implementation bootstrap, then reconciled them against Wheelwright. Result: **9 PARTIALLY EXISTS, 1 NOT FOUND**; the clear absent family was cross-expiry residual-leg management. Strongest corroboration included Assignment Consequence, Recommendation Brief, and Unencumbered Shares/capacity semantics. Strongest pressure included covered-call opportunity cost, planned-loss/invalidation semantics, monitoring beyond state display, volatility qualification, single-leg lifecycle boundaries, and probability/payoff comparison.

The durable research sequence is:

> **practitioner evidence → corpus → blind hypotheses/challenges → freeze → Wheelwright bootstrap → reconciliation**

The experiment is preserved as a useful pilot, not represented as pristine double-blind validation. Rediscovery of existing capability is itself useful convergence evidence; research findings do not automatically become requirements.

Session-closeout note: creation of the new canonical `PL-*` identity triggers Roadmap derived-projection regeneration/freshness verification under the Project-Memory Protocol. The ChatGPT GitHub execution surface used for this closeout can persist repository files but cannot run the repository-local generator command. That mechanical closeout obligation therefore remains to be completed by a repository-resident capable actor before the session can claim fully fresh derived Roadmap state.

---

## 2026-09-23 — Practitioner Corpus v1 post-corpus reconciliation preserved

The Principal continued the `PL-RESEARCH-05` research workstream by resolving the corpus's retained contradictions, externally checking the red-flag claims, answering the open questions at the level supported by the corpus and external review, and triaging the verification backlog.

The work is preserved separately at `docs/research/practitioner-corpus/practitioner-corpus-v1-reconciliation-2026-09-23.md` so the frozen Practitioner Corpus v1 remains the evidence-preserving baseline rather than being silently rewritten by later reconciliation.

The reconciliation produced several durable research distinctions:

- CON-001–004 all received dispositions by separating mechanics from compensation/edge, premium cash flow from counterfactual economics, win frequency from expectancy, and generic exercise heuristics from lifecycle-state economics.
- RED-001–006 received verification/reclassification dispositions. The work distinguishes conditional statistics, theoretical/model quantities, empirical regularities, practitioner heuristics, model-implied probabilities, and single-example performance.
- Q-001–008 received bounded answers or explicit source-limit dispositions. Important corpus limitations include absent portfolio-level Greek/risk aggregation, absent tax treatment, incomplete short-option dividend/assignment management, transaction costs acknowledged but not modeled, discretionary management that is less reproducible than deterministic entry rules, and curated examples insufficient for a complete behavioral audit.
- The twelve-item Verification Backlog is now **9 closed / 3 open**. Remaining work is: #9 empirical testing of the 20/50 covered-call filter; #10 current empirical testing of 0DTE seller-edge erosion; #11 source tracing for the “former leading industry groups regain leadership only 12%” statistic.

A key research correction is preserved: CON-002's conceptual covered-call reconciliation survives, but the specific 20/50 moving-average prescription remains unverified and must not be smuggled into the resolved principle.

The emerging epistemic pattern is that standard mechanics/theory generally survive verification with precision added; empirical regularities survive only with population/regime/instrument boundaries; and the greatest remaining epistemic risk is concentrated in presenter-specific prescriptions, edge claims, and performance generalization.

This overlay remains research only. It does not promote practitioner findings into the Options Domain Reference, semantic model, Product requirements, policy, architecture, roadmap commitment, or implementation. Exact external citations remain a prerequisite wherever a post-corpus verification result is later proposed for canonical domain promotion.

Because `PL-RESEARCH-05` in `docs/parking-lot-9.md` was updated to include this new durable research state, the Roadmap projection requires the ordinary repository-local regeneration and freshness check before this persistence pass is fully synchronized.

---

## 2026-09-23 — Practitioner Corpus reconciliation overlay rolled to Revision 1.1

An independent review of frozen Practitioner Corpus v1 strongly corroborated its provenance architecture, evidence/inference separation, and the decision to leave v1 frozen while placing later verification in a separate overlay.

The review also added bounded research pressure that was not yet durable. The reconciliation overlay at `docs/research/practitioner-corpus/practitioner-corpus-v1-reconciliation-2026-09-23.md` was therefore rolled to **Revision 1.1** rather than editing Practitioner Corpus v1.

Revision 1.1 preserves three main additions:

- exclusion of studies 13–24 creates **topic-specific coverage holes**, particularly around neutral / volatility-premium multi-leg structures and several practitioner-process topics; admission is therefore a coverage-topology issue, not merely a sample-size issue;
- generic v1 synthesis language such as “the practitioner” must be read as **the retail premium-selling practitioner represented by this corpus**, not as representative of market makers, institutional buy-side practice, systematic-volatility practice, or the options profession generally;
- future verification work should distinguish **VERIFY_BY_REFERENCE** for contractual/mechanical/theoretical claims from **VERIFY_BY_EVIDENCE** for empirical performance/frequency/edge/behavior claims. This is a methodological refinement only; the frozen v1 charter and tags were not retroactively changed.

The review also identified useful overlay relationships CON-001↔PAT-005 and CON-003↔PAT-003, while correctly treating portfolio-level aggregation and taxes as important source omissions. The stronger claim that those omissions automatically block downstream Product design was not promoted; that judgment belongs to later governed reconciliation.

Current verification state remains **9 closed / 3 open** (#9 20/50 covered-call filter, #10 0DTE seller-edge erosion, #11 source trace for the 12% leadership statistic).

This revision remains research-only and creates no Wheelwright Product, semantic, domain, policy, architecture, roadmap, or implementation authority.

Because canonical `PL-RESEARCH-05` was updated to record Revision 1.1, the ordinary Roadmap derived-projection regeneration/freshness check is again required before the persistence pass is fully synchronized.

---

## 2026-09-23 — Practitioner Corpus reconciliation revision boundary made explicit

The Principal selected the explicit-version option after observing that Revision 1.1 existed only as metadata inside the original reconciliation filename.

The research artifacts now have a visible revision boundary:

- `docs/research/practitioner-corpus/practitioner-corpus-v1-reconciliation-2026-09-23.md` is restored and frozen as **Revision 1.0**;
- `docs/research/practitioner-corpus/practitioner-corpus-v1-reconciliation-v1.1.md` is the explicit **Revision 1.1 review candidate**.

Revision 1.1 carries forward the complete v1.0 reconciliation/verification content and adds the independent corpus-review findings. Practitioner Corpus v1 itself remains untouched and frozen.

This corrects artifact identity rather than changing the research conclusions. Canonical `PL-RESEARCH-05` now points to both revision artifacts and records their roles.

Because the canonical PL changed again, Roadmap derived-projection regeneration/freshness verification is required as ordinary mechanical closeout.

---

## 2026-09-23 — Practitioner Corpus v1.1 repaired after independent adversarial review

The Principal authorized Option A: execute the bounded repair as `docs/research/practitioner-corpus/practitioner-corpus-v1.1.md` and preserve all existing artifacts as history.

Independent Codex review rejected `practitioner-corpus-v1-reconciliation-v1.1.md` for acceptance as written while corroborating the overall freeze-plus-overlay architecture. The review found excluded-source leakage, evidence-act promotions from recommendation/plan/calculation to observed behavior, incomplete dispositions for verification items #6 and #7, an overly broad population qualifier, omitted topic-specific coverage losses, a within-corpus long-LEAPS exception, and pre-existing frozen-v1 provenance inconsistencies.

The repaired v1.1:
- removes bracket-order and wide-bid/ask/slippage evidentiary leakage from excluded studies 13–14;
- corrects the SanDisk planned exit and 69.6% LEAPS prospective calculation classifications;
- narrows the evidentiary population to admitted Cashflow Academy teaching/demonstration evidence mediated through Muse;
- records topic-specific admission holes and the 540-DTE LEAPS exception;
- discloses frozen-v1 provenance/derivation-status limitations without editing v1;
- replaces the binary verification-method refinement with authority/reference lookup, mathematical/theoretical derivation, empirical testing, and source/provenance tracing;
- changes backlog state from 9 closed / 3 open to **7 fully dispositioned / 2 partially dispositioned / 3 open**.

Frozen corpus v1, frozen reconciliation v1.0, and the rejected reconciliation-v1.1 candidate remain historical and unchanged by this repair. No Product, semantic, domain, policy, architecture, roadmap, implementation, or execution authority is created. Broad Wheelwright reconciliation remains separate future governed work.

The Principal also invoked the End-of-Session Protocol. Canonical PL-RESEARCH-05 was reconciled to the repaired revision; Roadmap projection freshness must be regenerated and verified as the ordinary derived closeout consequence.



---

## 2026-09-24 — URA "Unencumbered Shares" split-brain: additive-lot collapse (not an Activity-upload failure) + AUTO-JOURNAL ingestion resiliency assessment (Kiro)

**Actor:** Kiro (repository-resident implementation partner).
**SYNC SHA at investigation:** synced accepted `main` through `d0f953a` (fast-forward reconciliation of docs-only advancement during the read-only phase). BUG records filed and this entry authored under explicit Principal authorization for a bounded work item (file two proven bugs, update BUG-023, run a read-only AUTO-JOURNAL resiliency assessment, then Project Memory + commit + push).
**Mode:** Read-only diagnosis → authorized durable capture (BUG-026, BUG-027, BUG-023 note, this journal entry). **No remediation authorized or performed.**
**Specimens:** operator's real Fidelity exports, Account Z39411514 — Option Summary (quote 09/24/2026, downloaded 2:56 PM ET) and Activity History (downloaded 09/24/2026 12:56 pm).

### Operator-visible incident

Three surfaces disagreed about the same Sep 24 URA buy-write:

1. **Production** reconstructed the Sep 24 URA buy-write episode (+$39.34 produced, $4,094 deployed) — proving the Activity CSV was ingested.
2. **Operator Console / Unencumbered Shares** warned: "Open short calls require 200 shares of URA, but only 100 shares were observed as owned. Observed ownership and open-call geometry do not reconcile."
3. **Header Activity upload slot** showed `— ⬆` (as if no Activity CSV were loaded).

### Specimen-backed causal attribution (the disciplined result)

The initial hypothesis (offered as a starting point, not a conclusion) was that the Activity overlay "lost" or never received the Sep 24 share purchase. The specimens **falsified** that framing. Findings:

- **True URA position (from the Activity ledger):** 200 shares held — lot 1 (100 @ $45.79, bought 09/04) + lot 2 (100 @ $40.94, bought 09/24) — against two short calls (Sep 25 $43 covering lot 1, opened 09/17; Sep 25 $41 covering lot 2, the 09/24 buy-write). Fully covered, coherent. Correct state = **no warning**.
- **Option Summary** carries **four** URA rows: two "Shares" rows of 100 (byte-identical, showing the *position-level blended* basis $4,336.50 / $43.37 = ($4,579+$4,094)/200) + the $41 and $43 CALL rows. The two additive lots are **indistinguishable by row content**.
- **Observed, sufficient cause = BUG-026:** `deriveInventory` (`fidelity-snapshot.ts`) collapses the two additive URA share rows via **MAX-not-SUM** → `owned=100`, while `deriveExistingShortCalls` emits both calls → `required=200`. `deriveUnencumberedInventory` Case 2 then fires the exact warning — **from the Option Summary alone, before any Activity projection**. `evaluateReadiness` never checks call-vs-share geometry, so nothing flags it.
- **Latent, non-causal = the Activity checkpoint seam (recorded on BUG-023, not a new bug):** `applyActivityProjection` reconciles Activity inclusion against the Option Summary `quoteDate` via `parseCheckpoint`; `"09/24/2026"` yields **day precision**, so the same-day Sep 24 purchase is **excluded** (`isAfterCheckpoint` requires a strictly-later date). For this specimen that exclusion is **correct** — the OS already contains the Sep 24 lot, so adding the Activity purchase would double-count (the EWY failure class commit `ad48816` was built to prevent). The ownership-side same-day under-count is a real *mechanism* but did **not** participate in this incident; it is the ownership analogue of BUG-023's cash-side double-count and is recorded there.
- **Independent display defect = BUG-027:** `FidelityUploadCompact`'s mount effect reconstructs only OS/Balances slots from provenance; the Activity slot's loaded state is ephemeral component state seeded only by `handleActFile()`. On remount it reverts to `—`. Activity is durably persisted and re-applied (`loadActiveAccountSnapshot` → `readAccountCsv(activeId,"activity")`), so `— ⬆` is **not** evidence of absence.

**Counterfactuals against the specimen:** (a) applying the same-day purchase → owned 200 numerically, but by double-count (OS already has the lot) → insufficient and dangerous; (b) SUM instead of MAX → correct here but doubles the genuinely-repeated-per-strategy case, and value-dedup also fails since the rows are byte-identical → the correct repair is **lot disambiguation** using short-call coverage count and/or Activity buy events, at the ownership-derivation authority (not the consumer, not the checkpoint).

**Regression origin:** none. MAX-not-SUM dates to the covered-call restore (`4ff135c`, deliberate per-strategy dedup); day-precision checkpoint dates to `ad48816` (deliberate EWY double-count fix). Both are original design decisions whose edges this incident exposed.

### AUTO-JOURNAL ingestion resiliency assessment (read-only; Principal-requested)

The Sep 24 Activity contains new Fidelity vocabulary: `JOURNALED VS Z39-411514-N AUTO-JOURNAL ...` (cash/margin internal journaling of the GDXJ call + shares). Assessment of whether the current parser/classifier contracts adequately protect Wheelwright:

- **Unknown syntax stays first-class unknown — HELD.** Frontend `classifyAction` returns `"other"` for the AUTO-JOURNAL rows (they contain no matched substring); `projectActivityOverlay`'s `default` branch does not mutate portfolio state for `"other"`. Backend `TransactionClassifier` returns `UNCLASSIFIED` (no `startsWith` match); `EconomicDecomposer` maps `UNCLASSIFIED` → `UNRESOLVED` / `BASIS_UNKNOWN`, and `ProductionAssessor` surfaces each as an `UNCLASSIFIED_ACTION` reconciliation issue. No fabricated economics.
- **Unknown rows remain visible/auditable — HELD.** Frontend preserves every parsed row (including `rawRow`) and reports an event-type breakdown diagnostic; backend surfaces unclassified in-period actions as explicit reconciliation issues rather than dropping them.
- **Zero-economic internal transfers remain non-mutating unless understood — HELD (for this specimen).** The AUTO-JOURNAL cash/margin pairs net to zero and are treated as `"other"` (FE) / `UNCLASSIFIED` (BE); neither invents a transfer economic.
- **Broad `YOU BOUGHT` / `YOU SOLD` fallbacks cannot silently misclassify structurally novel events — PARTIALLY HELD; standing design pressure.** Both layers place specific patterns before the generic verb catch-all (FE `shares_bought_direct`/`shares_sold_direct`; BE `ASSET_PURCHASE`/`ASSET_SALE`). This is resilient to novel vocabulary that does **not** contain a familiar verb (AUTO-JOURNAL is safe). It is **not** structurally guaranteed against a *future* Fidelity phrase that contains `YOU BOUGHT`/`YOU SOLD` while carrying different semantics — the exact class BUG-021 belonged to before its repair (a buy-to-close resembling an asset purchase). No such phrase is present in this specimen, so this is a **resiliency/design pressure, not a demonstrated defect** (no bug filed).
- **Adding support for a new phrase should require a corpus/specimen test, not another ad hoc branch — DESIGN PRESSURE.** Current growth path is lexical branch accretion in both classifiers; there is no corpus-driven guard forcing a specimen test when vocabulary is added.

**Governing resiliency principle (captured, not implemented):** external broker prose must not acquire economic authority merely by matching a generic lexical pattern. Specific recognized evidence may classify confidently; unfamiliar or ambiguous verb-bearing variants should degrade to explicit uncertainty (`UNRESOLVED`/`BASIS_UNKNOWN` / `"other"`) rather than a broader economic catch-all. Recorded here as durable design pressure for a future governed decision; deliberately **not** manufactured into a bug, since the specimen shows the current fail-closed boundary holding for genuinely-novel vocabulary.

### Durable outcomes

- Filed **BUG-026** (additive-lot collapse — the observed URA cause) and **BUG-027** (ephemeral Activity slot status). Added the ownership-side checkpoint note to **BUG-023**. INDEX updated.
- No remediation authorized. The two ownership "defects" were correctly held apart: BUG-026 is observed; the checkpoint under-count is latent and lives on BUG-023.


---

## 2026-09-24 — BUG-026/BUG-027 remediated; ADR-020 ratifies Positions as aggregate-ownership authority (Kiro)

**Actor:** Kiro (repository-resident implementation partner).
**SYNC SHA at implementation start:** `e161198` (accepted `main`; reconciled forward from the diagnosis SHA `ade8bb5` through Principal-authored ADR-019 / private-beta docs commits, none of which touched the target code).
**Mode:** Principal-authorized implementation of BUG-026 and BUG-027 only, plus ADR persistence, tests, bug-state transitions, and end-of-session closeout. Architecture authority for the ownership question was resolved by the Principal before implementation.

### Decision (ADR-020)

The additive-lot-vs-repeated-strategy ambiguity behind BUG-026 is **not resolvable from the Option Summary alone** — the two cases are byte-identical at the row level (Fidelity shows position-level blended basis on each per-strategy share row), and covered-call obligation geometry must never be used to infer ownership. The Principal ratified the **Fidelity Positions export as the authoritative source of aggregate share ownership when available**, over the rejected alternative of inferring ownership from call geometry. Absent Positions, the conservative observed Option Summary value is preserved (undercount over invention). Evidence roles: Positions = how many shares are owned; Option Summary = how those shares are presented as strategies (known ambiguity); Activity = temporal events under the existing checkpoint rules. See `docs/07c-adrs.md` ADR-020.

### Implementation

Smallest-seam wiring of the already-registered Positions parser into ownership derivation: new `positions-ownership.ts` (sum equity rows — opposite of the OS MAX-collapse); `deriveInventory` takes authoritative ownership and marks `ownershipAuthority` per position; account + legacy snapshot builders read the account-local `positions` slot; `CsvDocKind`/`ImportOperation` gain `positions`; a Positions upload slot is added. The Unencumbered Shares consumer was deliberately not touched (authority before consumers). BUG-027 fixed in the same component: the mount effect now reconstructs Activity and Positions slot status from persisted account evidence (store accessors), not ephemeral component state.

### Verification

The URA incident now resolves for the correct reason — 200 shares are true because Positions reports 200, not because two calls require 200. Falsifiers cover both sides of the historical problem on the live path: additive→200 (no warning), repeated→100 (no inflation), Positions-absent→observed 100 (warning fires, unchanged), genuine insufficient ownership→warning still fires, and the EWY same-day-no-double-count / post-checkpoint-inclusion behavior is preserved (activity-projection.ts untouched; existing checkpoint tests green). AUTO-JOURNAL vocabulary re-guarded: classifies as `other`, projection non-mutating. Frontend 2049/2049 green excluding one pre-existing unrelated failure (below); backend green; zero lint errors in touched files.

### Pre-existing unrelated defect discovered (NOT touched)

`tests/roadmap/RoadmapView.test.tsx` (2 tests) fails on **pristine `e161198`**, before any change in this session, because `docs/architecture-roadmap.md` now contains **two `## AR1` headings** (line 45 "Authoritative State Must Mature…" and line 331 "AR1 — bounded partial resolution"), introduced by commit `14ac2e5` (ADR-019 architecture-promotion workstream). The roadmap projection emits two AR entries with id `AR1`; RoadmapView renders duplicate React keys and `getByText("AR1")` finds two. This is a canonical-source data-integrity defect in another actor's just-landed work, outside the BUG-026/BUG-027 authorization. Per in-flight-work discipline it was left untouched and is surfaced for the Principal rather than silently absorbed or "fixed." Candidate dispositions: give the second AR1 section a distinct id (e.g. an `AR1-resolution` sub-anchor) or make the projection parser reject/merge duplicate AR ids; either is a separate authorized change.


---

## 2026-09-24 — BUG-026/BUG-027 Principal-accepted; Roadmap Log bug-event legibility (Kiro)

**Actor:** Kiro. **SYNC at closeout:** `4ff54ce` (accepted `main`). **Mode:** acceptance capture + a small authorized Product-legibility follow-up + end-of-session closeout.

**Acceptance.** Principal browser validation (PTS + Sawdust) accepted both fixes: the URA over-encumbrance warning is gone from Unencumbered Shares once Positions is supplied (BUG-026), and the persistent up-arrow-on-remount is gone with the refresh icon correctly retained (BUG-027). No regressions; Deployment unaffected. Recorded on both BUG records via governed `## Principal acceptance — 2026-09-24` headings (commit `b486a41`), which is also what surfaces them as `remediation` events in the Roadmap Log.

**Operator-cost signal.** Authoritative ownership now costs a fourth manual CSV (Positions) per refresh. Captured as parking-lot intake `PL-OPS-CSV-01` (workflow cost, not a defect; ADR-020 keeps Positions authoritative only when supplied). Candidate directions (Positions substituting for rather than adding to an upload; broker-API end-state) preserved there.

**Log-tab legibility resolution (context-recovery note).** The Principal reported "no bug entries in the Log tab." Investigation established the events were in fact present, served fresh, and rendering (proven by inspecting the served projection module and a passing Log-lens test against the real projection). The real issue was **legibility**: bug-sourced Log events were styled identically to parking-lot events and read as generic kinds ("Reconciliation" / "Remediation / closure"), the only tell being the `BUG-NNN` id chip. Resolved with a small additive UI change (commit `4ff54ce`): `LogView` now renders a distinct red **BUG** source tag on any Log event with a `bugId`, in both the list row and detail pane, alongside (not replacing) the shared event-kind label. UI-only; no projection/data/schema change. A future cold-start actor should NOT re-investigate "are bug events in the Log?" — they are; the BUG tag makes that visible.

**Open, unrelated (untouched all session):** `tests/roadmap/RoadmapView.test.tsx` Architecture-lens tests fail on a duplicate `## AR1` heading in `docs/architecture-roadmap.md` (introduced by commit `14ac2e5`, the ADR-019 workstream). Pre-existing on `e161198`; left untouched as out of scope. Fix candidates: give the second AR1 section a distinct id, or make the projection parser reject/merge duplicate AR ids.

---
## 2026-09-26 — Governed production Console walking slice P0–P3 implemented (Kiro)

**Actor:** Kiro (Implementation Engineer). **SYNC at start:** `95dd00d` (accepted `main`, verified against GitHub; clean worktree). **Mode:** Principal-authorized Option A — complete bounded P0–P3 production Console governed-recommendation walking slice under the converged Candidate B design, including executable historical replay, **BUG-001 remediation excluded**. Controlling Product authority: `docs/65-...-bounded-production-console-wheel-rules-2026-09-26.md`. Architecture: ADR-019 (durable Decision) + ADR-020 (ownership).

**What was built.** A new isolated Wheel-specific browser module `options-prototype/src/governed-decision/` plus strategy-family-neutral durable substrate in the Java backend.

- **P0 — bounded fail-closed evaluators.** `evaluators.ts`: `evaluateCoveredCall → LET_RESOLVE | UNRESOLVED` and `evaluateSharePhase → SELL_CALL | UNRESOLVED`. Pure, deterministic, isolated from the provisional BTC/HOLD evaluator (no `HOLD → LET_RESOLVE`). Tri-state gates (`CLEAR | ACTIVE | UNKNOWN`): missing ⇒ `UNKNOWN` ⇒ `UNRESOLVED`; `ACTIVE` ⇒ `UNRESOLVED`. Covered-call is gated on the intervention gate; share-phase on eligibility + no-write. Both require `callAwayStance === "accepted"`, an established association, and sufficient evidence. `SELL_CALL` is a phase result — it never selects a contract (`SELL CALL != WHICH CALL?`).
- **P1 — governed context + projection.** Backend migration `010_governed_decision.sql` adds append-only, account-partitioned `governed_context_version`, `governed_decision`, and `subject_scope_association`. `GovernedContextController` performs the explicit **authority-bearing** governance write (`POST /api/governed-context`), rejecting any non-`operator-governance` provenance or malformed gate (the abuse guard); it also owns bitemporal resolution and explicit subject→scope association (never inferred from ticker). Browser: `client.ts`, `resolve.ts` (facts built from ADR-020 ownership + moneyness; ownership never inferred from call geometry), `use-governed-recommendations.ts` (Console hook), a `GovernedRecommendationsRegion` projecting both subject classes on the real-portfolio Console, a `GovernedRecommendationInspector` drawer, and a `GovernanceAuthoringModal` (deliberate durable governance act, not a display toggle).
- **P2 — durable Decision.** `decision-bundle.ts` canonical length-prefixed (injective) serialization + FNV-1a `bundleHash`/`decisionId`; backend `appendGovernedDecision` is idempotent (`INSERT OR IGNORE`) and requires the pinned context to exist. Decisions are immutable and account-partitioned; the browser is disposable (governance, context versions, decisions, and replay inputs all live in SQLite).
- **P3 — executable replay.** `replay.ts` re-runs the *pinned historical* evaluator version against the recovered bundle and reports `MATCH | MISMATCH | UNSUPPORTED_EVALUATOR_VERSION`; `replay-client.ts` reconstructs the bundle from the persisted record and adds a `bundleHash` integrity check. Replay consults only the recovered record — never current context/portfolio/evidence/outcome.

**Central truth (fail-closed).** The Doc 65 governance predicates (Wheel-cycle attribution via explicit association, accepted+effective call-away stance, program eligibility, intervention/no-write clearance) have **no authoritative runtime source until an operator authors governance**. So on a real portfolio with no governance yet authored, both rules truthfully project `UNRESOLVED`. Authoring governance (context version + explicit subject→scope association) is what unlocks `LET RESOLVE` / `SELL CALL`. Governance is never manufactured from shares / covered-call geometry / ticker / `origin:"buy-write"` / a `WHEEL` label / absent exception — enforced by both the browser `validateGovernedContextDraft` guard and the server-side controller guard, with explicit abuse tests.

**Strategy-family neutrality (Sosnoff falsifier).** The shared substrate (context identity/versioning, Decision persistence, replay, bundle) stores Wheel values as opaque columns/JSON and understands no Wheel vocabulary; removing the Wheel evaluators leaves the substrate coherent. Wheel semantics live only in the evaluators + context payload.

**Tests.** New: `tests/governed-decision/{evaluators,bundle-replay-subject,resolve-lifecycle}.test.ts` (32 browser tests covering C1–C13 aspects + governance-abuse + bundle determinism/idempotency + replay MATCH/MISMATCH/UNSUPPORTED + subject no-ticker-fallback + lifecycle transitions), and backend `GovernedDecisionStoreTest` (append/idempotency/bitemporal anti-hindsight/partitioning/association) + `GovernedContextControllerTest` (governance-abuse guard). Two semantic bugs were caught by tests during development and fixed: a test-helper default-param masking absent ownership authority, and a temporal-dead-zone hook-ordering error in `OperatorConsole` (the null→present hooks-order regression test caught it).

**Verification.** Backend `./gradlew test` green. Frontend `npx vitest run` → 2105 passed; the only 2 failures are the **pre-existing** `tests/roadmap/RoadmapView.test.tsx` duplicate-`## AR1` heading defect (introduced by the ADR-019 workstream commit `14ac2e5`), confirmed identical with all this session's work stashed on `95dd00d`. `tsc -b` clean; oxlint clean on touched files.

**BUG-001 boundary.** Not touched. First-local acceptance and fresh authoritative Option Summary checkpoints establish current-ness; the older Activity-overlay cumulative-lifecycle projection (assigned/expired/BTC fall-through) remains a separately authorized remediation. The lifecycle tests assert the governed transition *semantics* (expiration successor requires its own association; assignment produces no share subject) at the evaluator/resolve layer, which does not depend on BUG-001.

**Scope audit.** No deferred capability entered: no exact-contract selection, no CSP/BTC/roll/CLOSE/dividend policy, no Operator Disposition / FOLLOW-DEFER-DEPART, no adherence or economic-outcome scoring, no paper/sandbox/live execution, no generic Program engine / policy DSL / universal Recommendation enum, no BUG-001 fix.

---

## 2026-09-26 — Governed Recommendation projection UX correction (RECOMMENDATION hyperlink) + operator-governance setup discovery (`PL-SETUP-01`) (Kiro)

**Actor:** Kiro (Implementation Engineer). **SYNC at start:** `df246ba` (accepted `main`, verified against GitHub `ls-remote` + `fetch`; local = origin, 0/0 ahead/behind; clean worktree, no stashes). **Mode:** Principal-authorized consolidated UX reconciliation pass — one small production UX correction plus durable discovery preservation. No reopening of the settled governed-decision P0–P3 architecture or Doc 65 Product policy.

### Principal browser-acceptance finding (preserved)

Real browser use of the governed-decision walking slice (Doc 65 / ADR-019 / ADR-020) produced this acceptance state — **not** a declaration that the whole frozen Product outcome is finally accepted:

- **Passing / useful:** standalone `Governed Recommendations` region correctly removed; row-level projection is the right general location; real positions fail closed to `UNRESOLVED` without governance (observed COPX share block and URA covered call both `UNRESOLVED` for missing governed-scope association); the inspector is useful and correctly exposes the missing association; no Program membership inferred from mechanics.
- **Needed small polish (done this pass):** `By-the-book` → `Recommendation`; Recommendation rendered as an ordinary hyperlink, not a status pill/tag.
- **Not operator-ready (preserved as discovery, NOT implemented):** the raw governance-authoring modal; manual opaque governed-scope id entry; unexplained raw tri-state gates; generic display of gates irrelevant to the subject/rule; any expectation that the operator select `CLEAR` without an enumerated governed condition set.

### A. Production UX correction (implemented)

`GovernedRecommendationTag.tsx` now renders the Recommendation **value** as a conventional in-table hyperlink (`grt-link` / `grt-link-{let-resolve,sell-call,unresolved}`) instead of a bordered pill; `governed-recommendation-tag.css` rewritten to link treatment (underline + link color, colour still distinguishes affirmative vs fail-closed). `UnencumberedInventory.tsx` column header `By-the-book` → `Recommendation` (sentence case, matching sibling headers). The link remains a `<button>` because it opens the in-app inspector rather than navigating a URL; it is the **single** entry point (no added Govern/Inspect button, icon, or status badge). Row density preserved; Ladder site keeps its `stopPropagation` wrapper (no row-click bleed); Unencumbered rows have no row-level click handler. **Recommendation semantics and the inspector are unchanged.**

**Verification.** Focused governed-row + governed-decision (4 files, 39 tests) pass; `operator-console` suite (10 files, 124 tests) pass; `tsc -b` clean; `npm run lint` exit 0 (warnings only, incl. the pre-existing `UnencumberedInventory` `only-export-components` CSV-export warnings); full frontend `npx vitest run` → 2112 pass / 2 fail, the 2 fails being **only** the pre-existing `tests/roadmap/RoadmapView.test.tsx` duplicate-`## AR1` heading defect. No introduced failures.

### B. Setup/configuration discovery (durable intake, NOT implemented)

Materially developed operator-governance-configuration discovery crossed the durability threshold and was reconciled under `docs/foundations/idea-intake-reconciliation.md` against the complete `docs/parking-lot*.md` sequence. No existing `PL-*` owned it. New canonical identity **`PL-SETUP-01`** created in `docs/parking-lot-10.md` with a full Reconciliation Completion Record; rich why-state in `docs/66-operator-governance-setup-configuration-discovery-2026-09-26.md`.

Key preserved discoveries: an Account may contain multiple governed scopes; Program is **not** account-global (PTS = Treasury ladder + options overlay in one account is the motivating counterexample); opaque `governedScopeId` should be system-managed while the operator deals in meaningful (illustrative, non-canonical) scope names; guided vs advanced setup are alternate views over the **same** durable governance; brokerage evidence may pre-fill established facts and propose likely structures but **cannot establish Program/Wheel membership** (`recognition is not authority`; covered-call geometry ≠ Wheel call-phase membership; writable 100-share lot ≠ Wheel inventory); `UNKNOWN` stays in the model and undefined policy conditions remain `UNRESOLVED` rather than being guessed into `CLEAR`; configuration updates create successor immutable Context Versions, never rewriting history.

**Dispositions:** no `roadmap.md` change; **new architectural pressure on the AR1 governed-decision durable owner** (multiple scopes per account, scope-relative Program, operator-facing authoring) with no `architecture-roadmap.md` direction change and no ADR authorized yet; next authorized mode is design/exploration only when the Principal selects it.

**Retraction (correcting the prior completion report).** The earlier instruction to accept by authoring an *"accepted-call-away governed scope with CLEAR gates"* is retired. The Principal must not manufacture `CLEAR` values to exercise the positive evaluator path; production governance must be truthful attestation. Automated evaluator tests may continue to use explicit positive fixtures.

**ADR-018 compliance.** Adding `PL-SETUP-01` materially changes authoritative parking-lot state, so `scripts/generate-roadmap-projection.mjs` was regenerated (exit 0; 69 PL items incl. `PL-SETUP-01`) and verified via `tests/roadmap` projection-freshness/integrity/parsers (3 files, 147 tests pass). `src/roadmap/roadmap-projection.json` updated.

### Scope audit

No deferred capability entered: no full setup wizard or advanced configuration editor, no scope-discovery/inference machinery, no broker-connection architecture or credential storage, no Treasury/Program engine or governance DSL, no account-global Program selector, no new intervention/eligibility/no-write policy, no automated Wheel classification, no BUG-001 fix, and **no change to Doc 65 P0–P3 evaluator semantics** (governed-decision + evaluator tests remain green).

---

## 2026-09-26 — Governed Recommendation interaction consolidated into one drawer idiom (Kiro)

**Actor:** Kiro (Implementation Engineer). **SYNC at start:** `0a5b9a7` (accepted `main`, verified against GitHub `ls-remote` + `fetch`; local = origin, 0/0; clean worktree). **Mode:** Principal-authorized bounded production UX correction — interaction consolidation only. No reopening of settled P0–P3 governance semantics.

### Accepted operator model

`Recommendation column → plain-text value → click cell → one governed-decision drawer → inspect + establish/update governance in that same drawer.` The redundant idioms are gone.

### What changed

- **Plain-text Recommendation, clickable cell.** New `GovernedRecommendationCell` renders `UNRESOLVED` / `LET RESOLVE` / `SELL CALL` as ordinary dense table text (class `grc`) — no pill, tag, badge, hyperlink, underline, or status dot. Colour alone distinguishes affirmative from fail-closed. The containing `<td>` (`oc-td-governed` / `oc-inv-td-governed`) is the interaction target with a subtle hover/cursor affordance and `stopPropagation`. The former `GovernedRecommendationTag` (pill→hyperlink) and its CSS were deleted.
- **Ladder gets its own Recommendation column.** The governed Recommendation was moved OUT of the `TYPE`/badge cell into a dedicated trailing `Recommendation` column (col 28, appended after Quote Freshness to preserve the precisely-tracked `RungTotalsRow` 1–17 `colSpan` + 18–27 layout; one trailing totals `<td/>` added). `TYPE` now describes only the position type. Clicking the Recommendation cell opens the drawer and does not trigger the row's position/lifecycle modal.
- **One drawer owns inspection AND authoring.** `GovernedRecommendationInspector` now embeds `GovernanceForm` (extracted from the deleted `GovernanceAuthoringModal`) inline. It is inspection-first: the recommendation, facts, and (for UNRESOLVED) "Why unresolved" render first; an `Establish governance…` / `Amend governance…` affordance reveals the form in the SAME panel. The separate modal, its CSS, the drawer→modal launch bridge, and the `governingSubject` Console state were removed. Exactly one dialog exists.
- **Versioning preserved.** `GovernanceForm` still writes via `writeGovernedContext` + `writeSubjectScopeAssociation`; every submission creates a successor immutable Context Version (append-only). Historical governance and replay are untouched.

### Red-dot interpretation (flagged for Principal)

The rejected "red dot next to unresolved Recommendation text" was the `HoldCloseBell` (🔴) sharing the Ladder `TYPE`/badge cell with the old inline Recommendation tag. `HoldCloseBell` is the SEPARATE hold/close lifecycle attention system (`use-hold-close-notices`, short-obligation NOTICE→EVALUATE→DECIDE), not the Doc 65 governed Recommendation. Per §12 it keeps its own vocabulary, and §14/§18 scope the removal to governed-Recommendation presentation. I therefore did NOT delete `HoldCloseBell` (a different ratified feature); moving the Recommendation into its own column removes the red-dot adjacency to the Recommendation. If the Principal intended the hold/close bell itself gone, that is a separate authorization touching a different system.

### Semantic preservation

No governed-decision core file (`evaluators`, `governed-context`, `subject`, `decision-bundle`, `replay`, `resolve`, `client`, `types`) and no backend file was touched. Recommendation vocabulary unchanged (`UNRESOLVED` / `LET RESOLVE` / `SELL CALL`); no CLOSE/ROLL/WAIT/MONITOR added; fail-closed behavior intact. `PositionTable` was exported solely to enable the focused Ladder test.

### PL-SETUP-01 boundary

Untouched. The full guided/advanced setup experience remains discovery/design only; this pass made today's bounded slice coherent without implementing any wizard, scope inference, or new policy.

### Verification

`tsc -b` clean; `npm run lint` exit 0 (warnings only). Focused: governed-row-projection + governed-drawer + ladder-governed-column = 18 pass. Broader: governed-decision + operator-console + components = 24 files / 215 pass (includes replay tests). Full frontend `npx vitest run` → 2122 pass / 3 fail. The 3 fails are ALL pre-existing `tests/roadmap/RoadmapView.test.tsx` failures (2 duplicate-`## AR1` heading + 1 Log newest-date now `2026-09-26` from the previously-accepted `PL-SETUP-01` intake), confirmed identical on the clean `0a5b9a7` base with this session's work stashed. No introduced failures.

---

## 2026-09-26 — Governed Recommendation UX corrected: compact tags, no red balls, operator-first drawer (Kiro)

**Actor:** Kiro (Implementation Engineer). **SYNC at start:** `2de1198` (accepted `main`, GitHub-verified; local = origin, 0/0; clean worktree). **Mode:** Principal-authorized bounded correction — a **failed UX acceptance** of the prior pass, not evidence the governed-decision semantics are wrong. Presentation/interaction only.

### What the previous pass got wrong (Principal browser feedback) and the correction

- **`UNRESOLVED` must stay a tag, not plain text.** Restored the compact **tag idiom** for `UNRESOLVED` / `LET RESOLVE` / `SELL CALL` in the dedicated Recommendation column, styled to match the `CALL` / `BW` type tags (`grc-tag*`, mirroring `.oc-badge`: `padding 1px 4px; radius 2px; 9px`). Not a hyperlink, not plain text, not in the TYPE cell. Applies to both the Ladder covered-call rows and the Unencumbered Shares rows.
- **Red balls removed from the Ladder.** Removed the `HoldCloseBell` (🔴) render from the Ladder badge cell and cleaned up its now-dead prop threading. This is presentation-only: `HoldCloseBell.tsx`, `use-hold-close-notices`, the hold/close lifecycle records/calculations, and the position-modal `HoldVsCloseSection` consumer are **unchanged**.
- **Recommendation opens the right-side governed drawer, not the centered modal.** Clicking the Recommendation cell `stopPropagation`s, does not trigger the centered position/lifecycle (RECONCILE LIFECYCLE) modal, and opens the right-side drawer. Regression tests assert this on the Ladder.
- **One drawer; no second governance modal.** Governance authoring stays inside the single right-side drawer (the separate modal was already removed last pass).
- **Operator-first drawer.** The drawer now leads with the recommendation tag + a plain-English summary; for `UNRESOLVED` it shows "What WW needs" in plain language and, where authority supports it, the desired-disposition question **"Do you want URA to be called away at $43?"** with **Yes / No / Not sure** (deliberately *desired*, not "is call-away acceptable?"). Raw machinery (subject/scope/Context Version/rule/evaluator/gate state) is demoted under a collapsed **Technical details** disclosure; the bounded raw governance form is demoted under a collapsed **Advanced governance** disclosure. No opaque scope-id or raw `CLEAR`/`ACTIVE`/"fails closed" interaction is presented as the primary workflow.

### Semantic finding surfaced (not silently mapped)

Two honest boundaries were surfaced rather than papered over, per the Principal's instruction:

1. **Desired vs accepted.** Doc 65's durable `callAwayStance = "accepted"` means call-away was *pre-accepted when the call was opened and remains effective*. The operator's *"Do you want…"* answer captures **desired disposition**, which is not identical to that pre-accepted-at-open semantic. So a "Yes" is **not** silently written as `accepted`.
2. **Undefined gates + missing scope association.** An affirmative Recommendation also requires the intervention / eligibility / no-write gates (which Doc 65 deliberately leaves **undefined** — it says return `UNRESOLVED` rather than improvise) and an explicit governed-scope association (PL-SETUP-01 territory). Because those conditions have no ratified operator-facing meaning, the drawer does **not** fabricate friendly questions for them; it explains the boundary in operator language and holds at `UNRESOLVED`. The call-away question is only asked when call-away is the missing bounded fact **and** a scope association already exists.

Net: capturing the operator's desire is necessary but not sufficient in this bounded slice; the drawer captures it and truthfully explains what else would be needed, without inventing a mapping or instructing the operator to choose `CLEAR`.

### Semantic preservation / scope

No governed-decision core file (`evaluators`, `governed-context`, `subject`, `decision-bundle`, `replay`, `resolve`, `client`, `types`) and no backend file was touched. Recommendation vocabulary unchanged; fail-closed behavior intact; immutable Context Versions / Decision persistence / replay unchanged. PL-SETUP-01 not implemented (no wizard, guided onboarding, advanced editor, inference, or new policy). New helper `governed-drawer-language.ts` is pure presentation-language mapping over already-computed evaluator output.

### Verification

`tsc -b` clean; `npm run lint` exit 0. Focused governed-row + governed-drawer + ladder-governed-column = 21 pass. Broader governed-decision + operator-console + components = 24 files / 218 pass (incl. replay). Full frontend `npx vitest run` → 2125 pass / 3 fail. The 3 fails are ALL pre-existing `tests/roadmap/RoadmapView.test.tsx` failures (2 duplicate-`## AR1` heading + 1 Log newest-date), confirmed pre-existing on the `2de1198` base last session; no roadmap/projection files were touched this pass. No introduced failures.

### Not browser-accepted yet

Automated tests passing is not acceptance. The endpoint remains a Principal inspection of the real Console (compact tags, no red balls, Recommendation → right-side drawer, operator-first URA question).

---

## 2026-09-26 — Governed drawer: Ladder rung-view click-path bug fixed + dense operator-first redesign (Kiro)

**Actor:** Kiro (Implementation Engineer). **SYNC at start:** `e897fab` (accepted `main`, GitHub-verified; local = origin, 0/0; clean worktree). **Mode:** Principal-authorized tightly-bounded correction. Presentation/interaction only.

### Root cause of the "Recommendation click opens the centered RECONCILE LIFECYCLE modal" bug

Traced the actual event path (not just component tests, which is why prior tests missed it). The **expiration-rung Ladder view** renders positions through `ExpirationRungRow`, which was calling `PositionTable` **without** `governedBySubjectId` / `onInspectGoverned`. So in the rung view every Recommendation cell fell to the dash fallback `<td>—</td>` (no `stopPropagation`), and clicking in the Recommendation column bubbled to the row `<tr onClick={onTileClick}>` → `PositionDetailModal` (the centered RECONCILE LIFECYCLE surface). The non-rung grouped `PositionTable` already received the governed props, so component tests and that view worked — masking the defect.

**Fix:** threaded `governedBySubjectId` + `onInspectGoverned` through `ExpirationRungRow` into its `PositionTable`, and hardened the dash fallback cell with `stopPropagation` so the Recommendation column never opens the position/lifecycle modal (`Recommendation click ≠ position-detail click`), regardless of position type. Added a **real rung-view regression** (`ExpirationRungRow` exported for test) asserting: governed tag projects, clicking it invokes the drawer path, and `onTileClick` (modal) is **not** called.

### Dense, flat, operator-first drawer redesign

Rebuilt `GovernedRecommendationInspector` as a dense operator inspector consistent with the Console (11px base, compact two-column rows, ~340px panel), replacing the low-density settings-panel look:

- **Removed all accordions/disclosures** (`Technical details` / `Advanced governance` are gone — no `<details>`/`<summary>`).
- **Removed raw governance engineering from the operator surface**: no governed-scope-id entry, no configuration version, no `CLEAR`/`ACTIVE`/`UNKNOWN` gate controls, no "fails closed" phrasing, no raw Record-governance form. The rejected `GovernanceForm` + its CSS were **deleted**. The durable write client (`client.ts`) is untouched and remains for the future PL-SETUP-01 workflow.
- **Flat layout**: compact recommendation tag + subject summary + one-line headline; **Needs** (plain-English rows, e.g. `Wheel program membership — Not established`); the desired call-away question when authority supports it; **Basis** (Account/Subject/Program/Context/Rule, compact); **Why unresolved** (one line). All visible without expansion.
- **Honest boundary preserved**: with no governed Wheel association, the drawer states `Wheel program membership — Not established` and "WW will not infer Wheel membership from the position itself" rather than exposing an internal governance editor. Absent the PL-SETUP-01 workflow, it stops at that boundary.

### Semantics preserved

`UNRESOLVED` / `LET RESOLVE` / `SELL CALL` remain compact tags in the CALL/BW idiom (`grc-tag*`); red Ladder balls remain absent; the call-away question keeps the required wording ("Do you want URA to be called away at $43?", Yes/No/Not sure) and is only asked when call-away is the missing bounded fact and an association exists; the desired-vs-pre-accepted boundary is stated (a "Yes" is captured as current intent and explicitly does not by itself establish governance). No governed-decision core file and no backend file was touched; recommendation vocabulary, fail-closed behavior, immutable Context Versions, Decision persistence, and replay are unchanged. PL-SETUP-01 not implemented. The browser drawer is now read-only (no governance write), so the Console governance-epoch state was removed.

### Verification

`tsc -b` clean; `npm run lint` exit 0. Focused governed-row + governed-drawer + ladder-governed-column (incl. the rung-view regression) = 20 pass. Broader governed-decision + operator-console + components = 24 files / 217 pass (incl. replay). Full frontend `npx vitest run` → 2124 pass / 3 fail — the 3 fails are ALL the pre-existing `tests/roadmap/RoadmapView.test.tsx` failures (2 duplicate-`## AR1` heading + 1 Log newest-date), unrelated and unchanged. No introduced failures.

### Not browser-accepted

Automated tests are not acceptance. The endpoint remains a Principal Console inspection: rung-view Recommendation click opens the right-side drawer (not the centered modal), and the drawer is dense with no accordions and no raw governance controls.

---

## 2026-09-26 — Governed Recommendation: column next to TYPE, state-colored tags, denser inspector; operator-control STOP surfaced (Kiro)

**Actor:** Kiro (Implementation Engineer). **SYNC at start:** `9ba1b24` (accepted `main`, GitHub-verified; local = origin, 0/0; clean). **Mode:** Principal-authorized bounded pass with an explicit §16 stop condition on decorative controls.

### Mandatory semantic trace (the gate) — decisive finding

Before building any operator control I traced both candidate controls end-to-end (client → backend controller → durable model → evaluator predicate → reevaluation → persistence/replay). The write **plumbing** is real and authorized (`writeGovernedContext`, `writeSubjectScopeAssociation`, both `operator-governance` provenance; consumed via `resolveGovernedContext`/`resolveSubjectScope`; reevaluation via the hook). But an **operator-language answer cannot truthfully establish the predicates** an affirmative Recommendation requires:

- **Wheel program membership ("Is this COPX part of your Wheel?")** needs a `governedScopeId` + `program.configVersion`. There is no ratified operator-language way to name/mint a scope; auto-minting one silently decides account scope topology (an account may hold multiple governed scopes) — a **PL-SETUP-01 / new-semantic decision**. The operator must not type `wheel-COPX-2026Q3`. **BLOCKED (Product/architecture).**
- **Call-away intent ("Do you want URA called away at $43?")** would map to `callAwayStance="accepted"`, but Doc 65's `accepted` means *pre-accepted when the call was opened and still effective* — a historical governed proposition, not present desire. There is **no durable field for present desired disposition** distinct from that stance; mapping "Yes"→`accepted` fabricates history. **BLOCKED (semantic/persistence gap).**
- Even setting those aside, affirmative also needs `interventionGate`/`eligibilityGate`/`noWriteGate` = `CLEAR`, and **Doc 65 leaves those conditions undefined** ("return UNRESOLVED; do not improvise"). No authorized operator question sets a gate `CLEAR`. **BLOCKED (Product/undefined policy).**

**Conclusion:** neither `UNRESOLVED → LET RESOLVE` nor `UNRESOLVED → SELL CALL` is reachable through legitimate operator input today. Per the §16 STOP branch I implemented the safe/ratified parts and **did not build any control that cannot persist**. The previous pass's local-only Yes/No/Not-sure buttons were exactly such a decorative control and were **removed**.

### Implemented (safe, ratified)

- **Recommendation moved next to TYPE.** Ladder is now `TYPE | RECOMMENDATION | SYMBOL | …` (moved from the trailing column to col 2; `RungTotalsRow` label `colSpan` 17→18 and the trailing totals cell removed; layout comment updated). Unencumbered Shares is now `RECOMMENDATION | SYMBOL | …`.
- **State-colored tags.** `grc-tag-let-resolve` (green), `grc-tag-sell-call` (blue), `grc-tag-unresolved` (grey), each with a matching border — distinct, readable, Console-consistent; no red ball, no hyperlink. State differentiation, not a good/bad score.
- **Denser, richer, honest drawer.** Flat sections: recommendation tag + subject summary + headline; **Needs** (plain-English missing predicates); **What WW needs from you** (the call-away question in operator language **with an honest "WW cannot record this answer yet" boundary note — no clickable answer**); **Position / evidence** (real observed facts threaded from the Console: shares/short-calls/strike/expiration/spot/DTE/ownership authority for covered calls; free shares/lots for share blocks); **Governance / basis**; **Why unresolved**. No accordions/disclosures; no scope-id/config/gate controls; no "fails closed".
- **Dual Ladder clickability preserved** (Recommendation cell → drawer via `stopPropagation`; rest of row → position/lifecycle modal), including the rung-view prop threading, with regression coverage.

### Semantics preserved

No governed-decision core file and no backend file touched. Recommendation vocabulary, fail-closed behavior, immutable Context Versions, explicit association, Decision persistence, and replay unchanged. PL-SETUP-01 not implemented. "Recognition is not authority" preserved.

### Verification

`tsc -b` clean; `npm run lint` exit 0. Focused governed-row + governed-drawer + ladder-governed-column (incl. column-order + rung-view regression) = 21 pass. Broader governed-decision + operator-console + components = 24 files / 218 pass (incl. replay). Full frontend `npx vitest run` → 2125 pass / 3 fail (all pre-existing `RoadmapView.test.tsx`). No introduced failures.

### Open decision (surfaced, not resolved)

Making `UNRESOLVED` operator-resolvable requires a Principal/architecture decision on one or more of: a durable representation of present call-away intent distinct from Doc 65's pre-accepted stance; an operator-facing Wheel-scope establishment path (system-managed scope identity — PL-SETUP-01); and definitions for the intervention/eligibility/no-write conditions Doc 65 currently leaves undefined. Until then the drawer is honestly inspection + boundary, not a resolver.

---

## 2026-09-26 — ADR-021 governed UNRESOLVED predicate/resolution model implemented (bounded slice) (Kiro)

**Actor:** Kiro (Implementation Engineer). **SYNC at start:** `e3179353` (accepted `main`, GitHub-verified; local = origin, 0/0; clean). **Authority:** ADR-021 + Doc 67 (accepted), Doc 65, ADR-016/017/019/020, `PL-DEC-RES-01`, `PL-SETUP-01`. **Mode:** the bounded ADR-021 walking-slice implementation handoff.

### What was implemented

- **Rule-local predicate-result contract** (`governed-decision/predicate.ts`): the canonical eight states (`SATISFIED`, `NOT_SATISFIED`, `UNKNOWN`, `EVIDENCE_INSUFFICIENT`, `AUTHORITY_MISSING`, `POLICY_UNDEFINED`, `NOT_EVALUATED` + `blockedBy`, `NOT_APPLICABLE`), plus derived `ResolutionAffordance` metadata. No generic engine.
- **Both evaluators rewritten** (`evaluators.ts`) to return the COMPLETE ordered picture with rule-local dependency ordering: independent mechanical/evidence predicates evaluated regardless of governance; dependents emit `NOT_EVALUATED` with exact `blockedBy` when a prerequisite is absent; membership is `AUTHORITY_MISSING` (never inferred, never `UNKNOWN`); authoritative negative membership is `NOT_SATISFIED` + `programApplicability: "outside-program"`; intervention/eligibility/no-write are `POLICY_UNDEFINED`. The Recommendation is derived only in the evaluator. `EVALUATOR_VERSION` bumped to `2` (semantic change).
- **Negative membership** projects as *outside Program / no applicable Recommendation* beside the Recommendation; public vocabulary unchanged (`LET RESOLVE | SELL CALL | UNRESOLVED`, no 4th enum).
- **Durable Decision + replay** (`decision-bundle.ts`, `replay.ts`, backend): the Decision now persists the complete ordered predicate picture + program applicability; `DecisionInputBundle` context/scope are nullable; replay reproduces and compares BOTH the Recommendation and the predicate picture; version-aware + anti-hindsight preserved (the ADR-019 bitemporal store already refuses later-recorded backdated governance).
- **No-context UNRESOLVED Decisions** (migration `011`): `governed_decision.context_version_id` and `governed_scope_id` are now nullable (FK relaxed), and `program_applicability` + `predicate_results_json` columns added. The controller accepts an absent context (recording the explicit absence, never fabricating a Context Version) but still rejects a *present* context id that does not exist. The frontend hook now emits a Decision for every subject.
- **Operator-control admissibility gate** (`control-admissibility.ts`): the single tested gate implementing the ADR-021 §4 / Doc 67 §6 chain. The admissible-capability manifest is **empty** in this slice, so no enabled mutating control is rendered.
- **Drawer rewritten** to render the full predicate picture in operator language (distinct statuses, `NOT_EVALUATED (needs …)`, outside-program projection), explain the blocker where no control is admissible, and clean up presentation (human account name primary; plain rule name primary; machine ids/`ba-…` demoted to detail rows). Accepted structural UX + dual-click preserved.

### Ratified authority boundary surfaced (tasks 9 & 10 STOP)

Per Doc 67 §6/§7, the bounded **scope-establishment control** and the **retrospective pre-acceptance attestation control** are NOT admissible in this slice: configuration selection + Product-language scope-creation semantics are unratified (`PROGRAM_CONFIGURATION` unavailable), and the attestation depends on an established scope. Building them as enabled controls would violate the §6 admissibility invariant ADR-021/Doc 67 themselves draw. So they are represented honestly (affordances `unavailable`, manifest empty, drawer explains the blocker) rather than shipped as decorative/inadmissible controls. The durable substrate that *would* support them (no-context Decisions, anti-hindsight bitemporal store, pre-acceptance as a distinct predicate) is in place.

### Consequence to flag

Affirmative `LET RESOLVE` / `SELL CALL` is currently **unreachable in-slice** because the intervention (Rule 1) and eligibility + no-write (Rule 2) predicates are `POLICY_UNDEFINED` — exactly as ADR-021 §8 / Doc 67 §16 ratified ("affirmative outcomes remain blocked pending separate policy ratification"). This is correct, honest behavior, not a defect: the Console now truthfully shows the full picture and where each subject is blocked. Reaching affirmative requires separately ratifying those policies (and, for membership-gated subjects, the scope-establishment path).

### Verification

`tsc -b` clean; `npm run lint` exit 0. Focused governed-decision + operator-console + components: 220 pass (incl. predicate states, dependency/no-false-downstream, no-context Decision, replay picture comparison, outside-program, admissibility, drawer render). Backend full suite green (migration 011 applies to in-memory test DBs; store test adds a no-context Decision case). Full frontend `npx vitest run` → 2127 pass / 3 fail (all pre-existing `RoadmapView.test.tsx`; unrelated, unchanged). Scope audit: changes confined to the governed-decision module, drawer, hook/Console drawer-render, and the backend decision controller/store/migration + their tests. No generic engine, no full PL-SETUP-01 wizard, no undefined-policy invention, no BUG-001.

### Browser acceptance still required

Automated tests are not acceptance. The endpoint remains a Principal Console inspection of the URA and COPX specimens: the drawer should show the complete predicate checklist (membership `Not established`, dependents `Not yet evaluated (needs wheel-membership)`, gates `No governed policy yet`), remain `UNRESOLVED`, and offer no fake control.

---

## 2026-09-27 — Session stopping point: ADR-021 slice browser-accepted; governed-entry work intentionally held (Kiro end-of-session)

**Actor:** Kiro (Implementation Engineer), executing `bootstrap/end-of-session-protocol.md`. **Closeout start SYNC:** `e65a123` (accepted `main`; fast-forwarded from my `53959fd` over two docs-only research-program commits `0762575`, `e65a123` that landed after my push; worktree clean). This entry is the durable stopping-point snapshot; there is no separate snapshot mechanism — the journal is the canonical durable home (project-memory protocol).

### Accepted authority at this boundary

- **ADR-021** (`docs/07c-adrs.md`) and **Doc 67** (`docs/67-unresolved-predicate-resolution-model-architecture-reconciliation-2026-09-26.md`) are accepted architecture authority for the governed `UNRESOLVED` predicate/resolution model. Canonical intake: **`PL-DEC-RES-01`** (`docs/parking-lot-10.md`). Related: `PL-SETUP-01`, Doc 65, ADR-016/017/019/020. (Links preserved; definitions not duplicated.)
- The **bounded ADR-021 implementation** is present at commit `53959fd641a6e0533f5bdbf31f5bccd2614ba284` (in `main` history) and is detailed in the prior journal entry this session.

### Implemented stopping point (what `53959fd` actually delivers)

Canonical eight-state rule-local predicate-result model; complete ordered predicate pictures (not first-blocker); dependency-blocked `NOT_EVALUATED` with `blockedBy`; resolution mechanism as separate derived metadata; negative Program membership projected as *outside Program / no applicable Recommendation* (not overloaded `UNRESOLVED`, no 4th public enum); durable predicate pictures persisted in Decisions; durable **no-context** `UNRESOLVED` Decisions (migration 011, nullable context/scope); replay compares Recommendation **and** predicate picture; ADR-019-compatible anti-hindsight preserved; `POLICY_UNDEFINED` for intervention/eligibility/no-write; drawer projects the complete governed checklist; **no fake enabled authority-changing controls** where the ADR-021 admissibility chain is incomplete (admissibility manifest empty in-slice). No functionality is claimed beyond `53959fd`.

### Principal browser-acceptance evidence (production Console, after the implementation)

Specimens observed:
1. **URA unencumbered share block** — 200 free shares, 2 free lots; inventory/mechanical facts established; Wheel program membership **not established**; dependent call-away evaluation blocked by membership; eligibility and no-write shown as **"No governed policy yet"**; Recommendation remains **UNRESOLVED**.
2. **URA covered call** — covered-call mechanics / coverage / decision evidence established; membership **not established**; call-away pre-acceptance and continuing effectiveness **not evaluated** because membership is upstream; intervention policy **"No governed policy yet"**; Recommendation remains **UNRESOLVED**.

(Screenshots were reviewed live; the repository's normal evidence mechanism is this journal record — no separate screenshot-artifact protocol exists, so provenance is recorded as Principal live browser inspection, not fabricated image files.)

### Product finding selected tonight (responsibility boundary) — why-state, not new authority

The Principal affirmed the responsibility split, refining (not changing) the already-ratified ADR-021/Doc 67 admissibility + routing boundary:

- **Recommendation drawer = explanation and legitimate routing.** Read-mostly governed Decision explanation: predicate state, dependency, provenance, and a legitimate next destination *where one exists*. It must **not** embed casual authority-changing questionnaires merely to clear `UNRESOLVED`.
- **Governance/setup = authority-changing controls.** Membership, retrospective attestation, Program/configuration selection, and future policy configuration belong in deliberate governance/setup journeys **when ratified and implemented**.
- **Recommendation = operational output** once sufficient governed inputs exist.

**Routing is itself governed.** A route such as `Set up in Wheel governance →` becomes legitimate only when the destination actually exists, account/subject/quantity context can be transferred safely, the destination implements an authorized authority-bearing path, and the ADR-021 control/routing admissibility requirements are satisfied. Until then, **explanation without a clickable route is correct** (which is exactly what `53959fd` ships).

Predicate-to-UX direction captured (Product responsibility boundary, not an implementation spec, not routing/governance authorization):
- `SATISFIED` → evidence/display; normally no action.
- `NOT_EVALUATED` → explain upstream blocker; no independent action.
- `POLICY_UNDEFINED` → explain Product-policy boundary; **no raw gate editor**.
- operator-governance-resolvable → eventually route to legitimate governance/setup when an admissible destination exists.
- evidence-resolvable → eventually route to legitimate evidence acquisition when such a journey exists.
- Recommendation → operational output.

Intake reconciliation: this finding is **why-state on already-ratified `PL-DEC-RES-01` + `PL-SETUP-01`**, not a new unresolved capability. The unresolved capabilities it points at (operator-facing Wheel-scope establishment; retrospective attestation; the gate policies) are already owned by `PL-SETUP-01` and named in ADR-021 §7/§8. No new `PL-*` was created (avoiding backlog accretion / not manufacturing authority). If a future actor decides the drawer↔governance routing contract deserves its own durable identity, that is a reconciliation decision to make deliberately, not tonight.

### Explicitly unfinished / held (intentional stop)

Tonight stops before: bounded governance-entry / `PL-SETUP-01` child design and implementation; operator-facing Wheel-scope establishment; retrospective pre-acceptance attestation UI/control; intervention / eligibility / no-write policy definition; the affirmative evaluator version those policies would enable; additional drawer routing; further presentation refinements. None of these missing policies are inferred or filled in.

### Non-blocking presentation observations (future refinement, not authority)

Primary account identity should eventually use the human account name (e.g. `Sawdust Roth IRA`, `Personal Treasury System`) rather than `Fidelity Snapshot`, with machine account/rule ids kept as secondary provenance; `Decision evidence` may benefit from more concrete operator language; the checklist is the strongest explanatory region; explanatory prose may be shortened once legitimate routing exists; **"No governed policy yet" was judged successful operator language**. These are observations only — not filed as defects or `PL-*`, per instruction.

### Restart point for the next session

Resume by choosing the next authorized workstream among: (A) ratify + implement the intervention/eligibility/no-write **gate policies** (would unblock affirmative `LET RESOLVE`/`SELL CALL`); (B) authorize the bounded **`PL-SETUP-01`-child Wheel-scope establishment** design (would make the membership route/control admissible); or (C) other Principal-selected direction. No implementation is authorized by this closeout. Cold-start via `docs/README.md` → `KNOWN-FAILURE-MODES.md` → bootstrap; the ADR-021 slice is the accepted baseline.

---

## 2026-09-27 — ATTACH TO… first walking slice implemented (covered-call → Assignment-Centric Wheel v1) (Kiro)

**Actor:** Kiro (Implementation Engineer). **SYNC:** `86ea76e` (accepted `main`; clean tree at start). Authority root `docs/README.md`; Gate Experiment 001 `STAGED`. This is authorized bounded implementation of the first real `ATTACH TO…` capability against the ratified `Assignment-Centric Wheel v1` Program (Doc 69).

### What shipped

The first admissible operator resolution control in the governed Recommendation drawer. An operator inspecting a covered-call subject whose `wheel-membership` predicate is `AUTHORITY_MISSING` can choose `Attach to…` → the one ratified destination **Assignment-Centric Wheel**, confirm, and Wheelwright durably records Program membership. Deterministic reevaluation then flips `wheel-membership` to `SATISFIED`. The Recommendation stays `UNRESOLVED` (call-away pre-acceptance becomes the next `AUTHORITY_MISSING`; intervention stays `POLICY_UNDEFINED`) — attachment establishes **membership only**.

### The load-bearing design decision (subject/quantity)

The evaluator already had two subject classes: covered-call (`call-<underlying>-<strike>-<expiration>`, a **bounded** identity) and share-block (`shares-<SYMBOL>`, **symbol-level**). Attaching the symbol-level share-block would silently mean "all free shares of this symbol" — the exact unsafe approximation the task forbids and the same-symbol attack targets. Rather than invent an inventory-block ontology, this slice **attaches only the already-bounded covered-call subject** and the backend **refuses** share-block attach. This is an ordinary implementation scoping choice grounded in existing identity structure (not a Principal decision): the covered-call subject is bounded; the share-block is not. Bounded inventory-block identity for share-phase attachment is the documented residual gap.

### Atomicity + idempotency

Context-version and association writes were previously two separate transactions. Attachment requires them atomic (a partial failure must never leave an association pointing at a non-existent scope), so I added one backend command, `SqliteEvidenceStore.attachSubjectToProgram(context, association)`, performing both `INSERT OR IGNORE`s inside a single `inTransaction`. The endpoint `POST /api/governed-context/attach` **system-mints** the governed scope deterministically from `(account, subject, program)` — the operator never supplies an opaque id — and derives the context/association identities from `(account, scope, version)` / `(account, subject, scope)` with a fixed tag rather than wall-clock time, so a repeated attach is a true durable no-op (verified: counts stayed 1 ctx / 1 assoc per subject). The minted context asserts nothing affirmative: `callAwayStance=unknown`, all gates `UNKNOWN`, `authorityProvenance=operator-governance`.

### Authority preserved

- Membership is an ADR-016 authoritative association; symbol equality / geometry / co-location never mint or reuse a scope (verified: same-symbol different subject → distinct scope).
- ADR-019/ADR-021 replay honesty preserved: the association is effective from the recorded boundary forward; a pre-attachment Decision replays unchanged (the evaluator/bundle are pure over the pinned inputs; attaching does not rewrite prior Decisions).
- ADR-021 §6 admissibility chain is complete for this one capability (question → operator authority → resolved bounded subject/scope → durable atomic append → known evaluator consumer → deterministic reevaluation via `governanceEpoch` → replay-bound Decision), so it is the first entry in `ADMISSIBLE_CONTROL_CAPABILITIES`. No policy was invented; eligibility/no-write/intervention stay `POLICY_UNDEFINED`.

### Verification

Backend full suite green (5 new attach controller tests). Frontend: 2134 pass; the only 3 failures are the pre-existing `RoadmapView.test.tsx` ones (AR duplicate-key/isolation ×2; Log NEWEST-FIRST stale-date), confirmed pre-existing and unrelated. Real end-to-end acceptance was exercised against a freshly-built backend on an isolated port (3199) + temp DB — I cannot visually see a browser, so I drove the actual `/attach` endpoint the drawer calls and verified before/attach/after, membership-only context, same-symbol isolation + distinct scopes, fresh-client recovery, idempotency, and share-block/bad-program refusal. The Principal's always-on appliance on port 3100 was left running and untouched.

### Residual gaps (unchanged by this slice)

Bounded inventory-block identity for share-phase attachment; call-away pre-acceptance attestation; intervention/eligibility/no-write policy; CSP/contract selection; negative-membership write; retrospective/lifecycle semantics. All remain honestly `AUTHORITY_MISSING` / `POLICY_UNDEFINED` and keep the Recommendation `UNRESOLVED`.

### Next boundary

Extend `ATTACH TO…` to the share-phase subject once a bounded inventory-block identity is designed (a Solution Overview/Design step), OR ratify one of the blocking policies (intervention/eligibility/no-write) or the call-away pre-acceptance attestation to unblock an affirmative `LET RESOLVE`/`SELL CALL`. Not authorized by this task.

---

## 2026-09-28 — Series-key ATTACH identity rejected; bounded continuity ratified; first design rejected (Codex checkpoint)

**Checkpoint start SYNC:** `8093caedf1d64a079c9a74f1b1b6e04570fb81d1` (GitHub-advertised `main` == local `HEAD`; clean tree). Gate Experiment 001 remained `STAGED`, mutation permission `INACTIVE`. The Principal authorized **documentation/authority checkpoint only**, including commit/push, not product implementation.

The September 27 ATTACH entry above accurately records what Kiro built and tested, but its claim that `call-<underlying>-<strike>-<expiration>` is a bounded economic obligation identity is **rejected**. BTC 1 then identical STO 1 reuses the old membership; an additional same-series STO expands the aggregate without an attached quantity boundary. Same-symbol-different-series isolation did not test either failure. Do not use the old entry as present architecture authority or infer that the next task is share-block attachment or policy ratification.

The Principal-supplied `History_for_Account_Z39411514-72.csv` directly demonstrated opening, closing, assignment, and expiration actions. A complete accepted economic interval can distinguish unchanged obligation from close/reopen without a broker position-instance ID. That conclusion depends on a scoped completeness/finality assertion, semantic ingestion of every relevant raw event, sufficient economic ordering, and endpoint reconciliation. The first model was refined after independent falsification to separate economic finality from export/Run Date and separate historical membership, surviving quantity, full-`Q` intact, and current applicability. The refined bounded model survived independent falsification. The Principal explicitly chose **A — RATIFIED** for the opening-anchored **whole-quantity** cohort and conditional evidence-authority contract; ADR-022 is its canonical authority.

The first bounded Solution Design candidate proposed durable immutable History/endpoint artifacts and completeness assertions in the existing backend, cohort evidence anchors, single accepted ledger version per Decision, derived reconciliation, and replay-bound consumed evidence. Independent review **rejected the design candidate**: paired option-affecting raw rows could be omitted by normalization while net endpoint quantity still matches; economic event/endpoint cuts and one semantic ownership path were insufficiently specified. This is a design return, not a new Product decision or a model reopening. Doc 70 preserves the detailed evidence/status trail and exact resume boundary. No product code, runtime state, or remote refs were changed by the analysis preceding this checkpoint.

---

## 2026-09-28 — Bounded option-obligation continuity slice implemented (ADR-022 / Doc 70) (Kiro)

**Actor:** Kiro (Implementation Engineer). **SYNC at start:** `1eb448e` (accepted `main`; clean tree; fast-forwarded from `50985c5` over the ADR-022/Doc 70/death-spiral-protocol commits). Authority root `docs/README.md`; Gate Experiment 001 `STAGED`. Principal-authorized bounded implementation per Doc 70 "Implementation authorization"; ADR-022 is the ratified Product/architecture authority.

### What shipped

The backend now **owns** an option-obligation continuity assessment (ADR-022 §3 / Doc 70 §1). The browser Decision evaluator **consumes** the backend verdict for covered-call membership; it no longer treats a series-key association as membership. This directly implements the ADR-022 §6 finding that the existing series-key ATTACH does not, by itself, conform.

**Backend (`com.wheelwright.evidence.continuity`):**
- `ContinuityEngine` — pure, deterministic. Consumes an opening-anchored whole-quantity cohort, all raw History rows, an accepted completeness premise through a quiet endpoint day `P`, and a Positions observation on `P`; returns a verdict + ordered blockers. Reuses the production `TransactionClassifier`/`FidelityTransactionKind` for exhaustive semantic admission. Enforces every Doc 70 boundary: STO→BTC→identical-STO does not inherit; ambiguous governed/ungoverned reduction after mixing → `POLICY_UNDEFINED`; assignment/expiration reduce exactly once; companion share rows never double-reduce; unsupported/uninterpretable option-affecting rows (transfer/ACAT/unclassified on the series) fail closed (catches the paired net-zero transfer counterexample); non-quiet `P` fails closed; conservative daily temporal envelope only (no intraday inference; CSV order/Settlement Date never establish order); additional ungoverned same-series openings never join but do not defeat an untouched governed subset.
- Verdicts map to ADR-021 predicate statuses: `FULL_Q_INTACT_APPLICABLE`→SATISFIED, `EXHAUSTED`→NOT_SATISFIED(known-negative/outside-program), `POLICY_UNDEFINED`→partial/ambiguous, `AUTHORITY_MISSING`/`EVIDENCE_INSUFFICIENT`→fail-closed.
- Migration `012_option_obligation_continuity.sql` + `SqliteEvidenceStore.appendContinuityAssessment`/`resolveContinuityAssessment` (append-only, deterministic id, ADR-019 bitemporal effective/recorded). `ContinuityController`: `POST /api/continuity/assess` (compute + durably persist), `GET /api/continuity/resolve` (bitemporal). A non-affirmative verdict is a durable first-class outcome (200), not a 4xx; only a structurally incomplete opening anchor is a 422 intake error.

**Frontend:**
- `resolveContinuityAssessment` client fn; `use-governed-recommendations` resolves the backend verdict for each covered-call subject and feeds it into `evaluateCoveredCall`. Membership SATISFIED only on `FULL_Q_INTACT_APPLICABLE`; a legacy series-key association alone (no assessment) is `AUTHORITY_MISSING` (never inferred). Legacy series-key associations are NOT auto-converted.
- Replay binding (Doc 70 §7): `DecisionInputBundle.continuity` pins the verdict/evidence-hash/admission-rule-version; `canonicalizeBundle` bumped v2→v3; `replay.ts` reconstructs the pinned verdict (anti-hindsight — a later correction affects only later Decisions).

### Why the covered-call membership semantic changed (and why existing tests were updated)

Under ADR-022 §6, covered-call membership can no longer be `SATISFIED` from association+context alone; it requires the backend continuity verdict. Existing evaluator/resolve/attach tests that asserted `SATISFIED` from association alone encoded the pre-ADR-022 behavior and were updated to supply the `FULL_Q_INTACT_APPLICABLE` verdict (the ratified path). The share-phase path is out of this slice's continuity scope and its membership logic/tests are unchanged. This is a ratified model change, not a test weakening.

### Verification

Backend full suite green (new `ContinuityEngineTest` 14 adversarial cases, `ContinuityControllerTest`, `ContinuityStoreTest` incl. bitemporal anti-hindsight). Frontend 2141 pass; only the 3 pre-existing `RoadmapView.test.tsx` failures remain (AR duplicate-key/isolation ×2; Log NEWEST-FIRST stale-date) — confirmed pre-existing/unrelated. Real acceptance exercised the live `/api/continuity/assess`+`/resolve` on an isolated port 3199 + temp DB (Principal appliance on 3100 untouched): affirmative persists+resolves; STO→BTC→STO EXHAUSTED; transfer fails closed; non-quiet P fails closed; missing completeness AUTHORITY_MISSING; fresh-client recovers. (No visual browser screenshots — I cannot see a browser; I drove the true endpoints the hook calls, clearly labeled.)

### Boundaries held / residual

No partial/residual cohort membership (POLICY_UNDEFINED, unratified). No generalized transfer/custody semantics (they fail closed). No inferred intraday ordering (daily envelope only). No auto-conversion of legacy series-key associations. Recommendation vocabulary unchanged (`LET RESOLVE | SELL CALL | UNRESOLVED`); affirmative Recommendation still blocked by call-away/policy gaps. Residual: partial-survivor residual-membership policy; call-away pre-acceptance attestation; intervention/eligibility/no-write policy; share-phase bounded-inventory-block identity; the operator-facing act that supplies the opening anchor + accepted-completeness premise + Positions observation to the assess endpoint (this slice implements the backend assessment + Decision consumption; the operator authoring UX for those premises is the next boundary).

### Next boundary

Design the operator-facing act that supplies the opening-anchor + accepted-completeness premise + quiet-day Positions observation into `/api/continuity/assess` (a Solution Overview/Design step) — OR ratify partial-survivor residual membership. Not authorized by this task.

---

## 2026-09-28 — Continuity slice REJECT remediation (5 conformance defects) (Kiro)

**Actor:** Kiro (Implementation Engineer). **SYNC at start:** `511f1b5` (accepted `main`; the commit under review). Independent review REJECTed `511f1b5` against ratified ADR-022 / accepted Doc 70 with five conformance defects. This was implementation correction at the implementation layer (per the death-spiral protocol: the REJECT supplied new decision-relevant evidence — concrete counterexamples — while the model/authority were unchanged, so a new bounded traversal was justified; no architecture reopened).

**Note on working state:** an unrelated uncommitted change to `options-prototype/src/components/CrossEntryStrip.tsx` was present at start (another actor's in-flight work). Per KNOWN-FAILURE-MODES #8 it was preserved untouched and never staged.

### The five defects and their corrections

1. **Opening evidence required.** The affirmative lane no longer trusts caller `openingQuantity`; it requires an admitted opening STO row on the opening day establishing ≥ Q (`sawOpeningAnchor` + `openingEvidenceQty`). Absent → `AUTHORITY_MISSING` / `opening-evidence-missing`.
2. **Endpoint reconciled against admitted aggregate.** The engine tracks admitted net short (opening + later opens − reductions) and requires the Positions observation to equal it exactly. Admitted STO 1 + STO 1 with Positions short 1 now fails closed (`endpoint-aggregate-mismatch`) instead of affirming on observed ≥ Q — an off-record reduction is proven.
3. **Explicit economic "as of" date controls.** `ParsedSeries.asOfDate` parses "as of MM/DD/YYYY" (and ISO) from action/description; `economicDay` uses it over Run Date. ASSIGNED "as of 2026-09-20" with Run Date 2026-09-28 now lands on 09-20 and reduces the cohort within a 2026-09-26 cut.
4. **Decision-cut coverage.** New `covered_through` boundary (migration 013) records the last day the completeness/endpoint contract extends through (the quiet day for an affirmative). `resolveContinuityAssessment` requires `effectiveAsOf <= covered_through`, so a Sep-26 assessment cannot satisfy a Sep-27 Decision cut.
5. **Governance identity binding.** Resolution is bound to the governed scope the Decision consumes (`governed_scope_id` required; no series-key/cross-scope match; blank scope → null). An affirmative assessed without a `governedScopeId` is downgraded to `EVIDENCE_INSUFFICIENT` / `governance-scope-binding-missing`. The frontend hook resolves continuity only for the subject's resolved governed scope, never inferring from the series key.

### Evidence

Adversarial regressions added for each exact counterexample: backend `ContinuityEngineTest` (`defect1_noOpeningEvidence_cannotAffirm`, `defect2_admittedSto1Sto1WithShort1_mustNotAffirm`, `defect3_assignedAsOfEarlierDate_affectsEarlierDecisionCut`, updated endpoint-aggregate test), `ContinuityStoreTest` (`decisionCutBeyondCoverageResolvesNull_Defect4`, `resolveRequiresGovernedScope_Defect5`, coverage-aware anti-hindsight), `ContinuityControllerTest` (defect 2/4/5 endpoint tests), and frontend `continuity-consumption.test.ts` (scope-bound resolve + fail-closed without scope). Backend full suite green; frontend 2142 pass with only the 3 pre-existing unrelated `RoadmapView.test.tsx` failures. Real isolated-backend acceptance (port 3199 + temp DB, Principal appliance 3100 untouched) reproduced all five counterexamples: D1 AUTHORITY_MISSING/opening-evidence-missing; D2 EVIDENCE_INSUFFICIENT/endpoint-aggregate-mismatch; D3 EXHAUSTED via as-of; D4 09-27 cut resolves false while 09-26 resolves true; D5 no-scope downgraded + wrong-scope resolve false.

### Boundaries preserved

Fail-closed behavior and all ADR-022/Doc 70 boundaries intact. No architecture reopened; no partial/residual membership; no generalized custody/transfer semantics; no inferred intraday ordering (day-granularity envelope, as-of date only). Migration is append-only (013). Recommendation vocabulary unchanged.


---

## 2026-09-29 — XSP defined-risk / tastytrade / Sosnoff research conversation preserved

**Principal instruction:** bootstrap from GitHub and persist the complete current conversation, including provided artifacts.

This entry records the durable why-state. The conversation explored a new bounded-risk XSP put-credit-spread research hypothesis (approximately 45 DTE; short put selected by premium closest to $5; long put 20 points lower; 50% profit exit; mandatory 21-DTE exit; one/two entries per trading day), tastytrade as a possible execution venue, Tom Sosnoff's "11 Boring Trading Strategies" transcript as practitioner hypothesis pressure, and two independent Codex reviews. The work remains **research/exploration under existing PL-STRAT-01**, not strategy admission, implementation authority, or policy ratification.

Durable conclusions from the discussion and Codex reviews:

- XSP verticals are a genuinely new strategy family relative to Assignment-Centric Wheel v1; cash-settled index spreads do not participate in an assignment-to-inventory lifecycle.
- Defined risk per spread does not imply low portfolio risk. Overlapping XSP cohorts may behave as one concentrated broad-equity downside exposure.
- The simple two-entry/day capacity illustration of roughly 32–36 concurrent spreads is useful only as capacity arithmetic, not an allocation target. "Remaining buying power" is not a portfolio objective; NAV-at-risk and liquidity/stress reserve should come first.
- At the illustrative $1.88 credit on a $20-wide spread, a 50% target is about $94 while contractual max loss is about $1,812; one full-loss outcome equals roughly 19.3 target winners. The pending empirical study therefore needs the forced-21-DTE exit loss distribution, not merely win rate.
- The $5 short-premium rule is mechanically simple but does not hold delta, moneyness, probability of loss, or risk compensation constant across volatility/skew/spot regimes. That variability is part of the hypothesis to measure, not an implementation detail to ignore.
- Tom Sosnoff's eleven named structures collapse into fewer economic families. Many are variations on short volatility plus directional bias rather than independent return factors. Strategy-name diversity is not risk-factor diversity.
- Transcript-supported practitioner observations are useful hypothesis generators only. Tom's self-reported preferences/performance are not Wheelwright policy or independent empirical evidence.
- Short call spreads are legitimately interesting because Tom says he uses them heavily to reduce long delta while retaining defined risk. But repeated put spreads plus repeated call spreads may simply create a staggered/distributed iron-condor-like book: lower snapshot delta can coexist with higher gross exposure, short gamma, short volatility, whipsaw/path risk, and larger cumulative turnover.
- No obvious second strategy from the eleven simultaneously provides a clearly orthogonal return source, deterministic Wheelwright policy expression, and bounded maximum loss. Pairs/relative value are more factor-distinct but discretionary/unbounded as described; broken-wing butterflies are bounded but strongly setup-dependent.
- Research sequence: first falsify the standalone XSP put engine with realistic fills, costs, overlapping cohorts, 21-DTE exits, and account-level stress; next test robustness/capacity under a predeclared NAV-risk/liquidity budget; only then test any negative-delta sleeve against simpler comparators such as fewer puts plus cash at equal gross-risk budgets. Do not run an eleven-strategy tournament yet.

The complete conversational record and the two Principal-provided source artifacts are intended to be preserved with this workstream. Where exact earlier chat turns had already been compacted in the model context, the record must preserve the available structured summary and label that limitation rather than fabricate verbatim text.


**Durable session artifacts:**
- `docs/research/session-artifacts/2026-09-29/conversation-record.md` — complete available conversation state, with explicit compacted-history limitation.
- `docs/research/session-artifacts/2026-09-29/github-url.md` — Principal-provided repository URL artifact.
- `docs/research/session-artifacts/2026-09-29/kiro-op-model.md` — Principal-provided Kiro operating-model artifact, preserved verbatim as supplied.


---

## 2026-09-29 — XSP historical-data / backtest-engine checkpoint

**Principal instruction:** persist the current XSP research state while the historical pull continues.

The XSP study has reached a clean methodological checkpoint. Historical-data acquisition is now using ThetaData as a research/replay source while preserving the distinction between live operational evidence and historical point-in-time evidence. No provider migration has been decided.

Canonical engine corrections now enforce a strict [40,50]-DTE entry window, 50%-target fills at the actual limit price rather than opportunistic sampled improvement, exclusion of incomplete end-of-sample positions from realized P&L, and a hard $92,000 aggregate-BPR ceiling for both one- and two-entry/day cases. Conservative execution is 2 cents per leg per side. The actor reports 13 passing unit tests, including targeted tests for these boundaries.

ThetaData coverage is being established empirically rather than assumed from plan documentation. The first scan was returning XSP data in July 2024; the acquisition process is probing farther back before the full run.

tastytrade Advanced Order screenshots also confirmed that a GTC 50%-profit bracket can represent the price-triggered half of the proposed lifecycle. The platform's default ~25% stop-loss bracket is **not** part of the canonical XSP hypothesis. The mandatory 21-DTE close remains a separate time-lifecycle responsibility.

XND and MRUT were considered as mini-index analogues, but the Principal observed materially poorer chain completeness. Do not force instrument diversification where the mechanical selector cannot be expressed faithfully.

**Authority boundary:** this remains PL-STRAT-01 research. No performance result exists yet; no strategy admission, provider migration, execution-policy ratification, or implementation authority is created by this checkpoint.

**Resume point:** complete the historical pull, establish the true usable XSP coverage window, then run the fixed canonical study and inspect forced-21-DTE loss distribution, clustered cohort drawdown, monthly production, and capital utilization before changing the strategy.


---

## 2026-09-29 — XSP historical-results / audit-boundary snapshot

**Principal instruction:** take a snapshot after Muse completed the first historical XSP report and a separate actor reviewed it read-only.

Muse now reports a completed 2023-06-01 through 2026-09-28 ThetaData EOD backtest for the frozen XSP put-credit-spread hypothesis. Under the canonical bid/ask execution model it reports 546 entries / 537 completed trades, 69.1% profitable trades, **-$21,593** net P&L, **-$540/month** mean P&L, **+$415/month** median P&L, profit factor 0.61, and **-$33,009 (-35.9%)** max drawdown. The central reported mechanism is winner erasure: average target winner +$98.41 versus average losing forced exit -$331.30, or about 3.37 winners erased per average losing forced exit. Cohort clustering, not isolated trade frequency, dominates bad months.

Execution is a first-order uncertainty. Muse reports **+$18,096** with midpoint fills versus **-$21,593** with bid/ask fills. One dislocated forced exit is modeled at a $23.01 debit on a $20-wide spread. The literal daily rule was reportedly enterable on only 63.5% of days, with exact-20 strike-grid gaps a major cause.

A separate read-only audit therefore classifies the report as **useful adverse research, not yet independently validated evidence**. Four checks are required before it can affect strategy/capital authority: (1) reconcile the reported 859-day calendar, (2) verify same-day EOD selection/execution timing against raw timestamps and code, (3) audit the >width forced-close execution semantics, and (4) recompute drawdown from true daily mark-to-market equity across overlapping positions.

**Authority boundary:** no parameter tuning, strategy admission, capital decision, provider migration, or execution-policy ratification follows from this report. XSP remains PL-STRAT-01 research. The frozen canonical rule remains frozen during audit.

**Related curriculum observation:** tastytrade’s introductory curriculum and UI put intrinsic/extrinsic value front and center. For the normally OTM ~$5 short-put selector, this provides a useful economic interpretation—roughly fixed extrinsic premium sold—but does not make delta, moneyness, IV, or risk compensation constant and does not change the canonical selector.

**Resume point:** audit Muse’s `~/workspace/xsp-study` artifacts end-to-end: calendar -> raw ThetaData timestamps/quotes -> selection -> entry execution -> lifecycle execution -> daily MTM portfolio equity -> statistics. Preserve the distinction between Muse-reported results and independently reproduced results.


---

## 2026-09-30 — tastytrade multi-leg operator-learning session preserved (ChatGPT)

**Actor:** ChatGPT (Principal-facing reasoning/synthesis).
**Mode:** Principal-requested project-memory persistence of empirical operator learning; no strategy admission, Product-policy ratification, or implementation authorization.
**Scope:** tastytrade iron-condor construction, transient complex-order validation behavior, post-fill bracket management, and sanitized evidence preservation.

The Principal used a deliberately tiny tastytrade account to learn the platform's multi-leg workflow. The session established a practical operator sequence: clear the ticket → select symbol → Table → deliberately select expiration/DTE → generate Iron Condor → Curve → use Width expand until the desired P50/POP region → inspect economics/buying power → Review & Send → Submit when validation succeeds → verify working exits after fill.

Two real fills were preserved as learning specimens: EWZ at 51 DTE (+31P/-32P/-42C/+43C, $0.42 credit) and XLE at 16 DTE (+59P/-59.5P/-64.5C/+65C, $0.18 credit). The XLE DTE was an operator-selection mistake during experimentation, useful mainly as a reminder that expiration selection needs an explicit visual checkpoint.

The session also resolved an important false lead. `Complex order structure is invalid` appeared repeatedly and on both Desktop and Web, but successful later orders demonstrated that bracketed four-leg iron condors are not categorically unsupported. XLE filled with working profit and stop children; EWZ filled without children and then accepted a post-fill bracket after selecting all four position legs and choosing **Actions → Advanced Order → Bracket**. The exact cause of the intermittent validation failure remains unknown; discarded explanations must not be promoted into broker capability facts.

Durable specialized record: `docs/discovery/tastytrade-iron-condor-operator-learning-2026-09-30.md`.

Sanitized evidence snapshots (public-repository-safe: account and broker order identifiers removed/replaced):

- `data/tastytrade/2026-09-30/tastytrade-positions-2026-09-30-sanitized.csv`
- `data/tastytrade/2026-09-30/tastytrade-activity-2026-09-30-sanitized.csv`

The activity export was taken before the later post-fill EWZ bracket was added, so the specialized record preserves that subsequent UI observation separately.

---

## 2026-09-30 — tt product boundary, Ten-Second Read, and a corrected architectural review (Kiro)

**Actor:** Kiro (Implementation Engineer), reconciling a review correction with repository authority.
**Mode:** Project-memory persistence of product/architectural context and a review self-correction; no strategy admission, Product-policy ratification, or implementation authorization. SYNC at write: `5318bfe`.
**Scope:** Why `tt` exists, the boundary between tastytrade / Wheelwright / `tt`, the Ten-Second Read product concept, and a corrected review of the `tt live` work (`aed56ef`, `5318bfe`).

### Why this is preserved

A read-only review of `tt live` raised an architectural concern — that `tt` reading live option quotes was "the first place this tooling pulls market data outside the backend" and might need reconciliation against Wheelwright's single-acquisition-authority invariant. **That concern was a category error and is recorded here so a cold-start actor does not rediscover it.** The single-acquisition-authority invariant governs *Wheelwright's* evidence appliance. `tt` is not a Wheelwright evidence path; it never claimed to be a second acquisition authority, so there is no split-brain risk to reconcile.

### Product boundary (the missing "why")

- **tastytrade is the trading workstation.** Chains, curves, order construction, inspection, adjustment, submission, and broker-native state live there.
- **Wheelwright is decision support.** It does not become a trading workstation.
- **`tt` is the tastytrade / API companion and mental-model bridge.** Overlap is allowed. Reimplementing the broker workstation is an explicit non-goal. Guardrail: if the tooling is rebuilding tastytrade, something has gone wrong; if it is translating between tastytrade evidence and the operator's decision/management model, it is in the right territory.
- **`tt`'s two views are deliberately different shapes.** `tt positions` is broker/evidence-shaped. `tt live` is operator-shaped and *translates* evidence into the Ten-Second Read — it is not a new source of trading authority.

### Ten-Second Read vocabulary (as shipped)

- **GREEN/RED is live-state vocabulary** (economically better/worse than entry under current valuation; since-entry, not P/L Day). **Winner/loser is terminal vocabulary** reserved for completed trades.
- **OBJECTIVE** is the *managed* objective, not the theoretical expiration maximum. GREEN may show progress-to-target; RED need not be a symmetric percentage (an "off target by …" gap can be more useful).
- Routine OCO/OTOCO plumbing stays out of the view unless it materially changes the story; stale quotes suppress economic color; ambiguous evidence fails closed rather than fabricating a story.
- **"Indicative" was deliberately removed from the operator-facing render.** The concept is preserved in documentation and in fail-closed honesty constraints (and an internal error string), but peppering the ten-second view with "indicative" was noise against the product goal. Technically-correct hedging that degrades the read is a cost, not a virtue, in this surface.

### Review correction, grounded in evidence

- The **multi-trade concern was already empirically falsified** before it was raised: the production run rendered two simultaneously recognized clean trades, **EWZ and XLE**, together. The per-trade grouping (by underlying + expiry) and leg-scoped exit matching resolve independently; the live run confirms it.
- The **midpoint note** survives only in weak form: `tt live` explicitly presents a tastytrade-derived current valuation; it does not establish Wheelwright's canonical historical midpoint semantics, so there is no silent divergence from WW convention.
- The review's confirmed-good properties stand: read-only, fail-closed recognition, fill-derived entry economics, quote-derived current economics, stale-data suppression, no protection claim, credential safety, clean TSV, masked account.

### Development philosophy (recorded so it is not re-litigated)

Intentional **clean happy-path first, learn from real use.** Partial closes, scale-ins, rolls, assignment, adjusted/reused contracts, ambiguous grouping, calendars/diagonals, covered-call provenance, and exhaustive structure reconstruction are **known deferred cases**, not prerequisites for making the clean case useful.

### Operating context ("why now")

tastytrade is no longer a toy fallback. Fidelity has one final Tier-2 attempt pending; at the local Fidelity meeting the Principal was advised that if it fails, **options trading** (not the entire Fidelity relationship) should move to tastytrade. This is why learning the tastytrade API and building a companion around it has practical near-term value. This note is operating context; it authorizes no implementation and ratifies no strategy.

### Authority

Review correction and context preservation only. No code change, no architecture reopened, no Product policy ratified. The `tt live` work is already accepted and on `main` (`aed56ef`, `5318bfe`).


---

## 2026-10-01 — XSP capital velocity, naive recycling, and live complex-order evidence boundary (ChatGPT)

**Actor:** ChatGPT, preserving research continuity from the XSP follow-on analysis and live `tt live` experiment.
**Mode:** Research/journal persistence only. No XSP strategy admission, policy ratification, deployment-rule adoption, or optimization authorization.
**Scope:** Capital-recycling hypothesis, Muse scenario R findings, initial Codex review, and the live XLE synthetic-threshold watch.

### Why this is preserved

The XSP study's original calendar-cohort deployment model attempted one entry per valid session. A new question emerged: a ~45-DTE spread managed at P50 or from 21 DTE can release capital well before the nominal lifecycle ends, so an actively deployed system might recycle that BPR. This raised a distinct question about **capital velocity**, separate from individual-trade expectancy.

The first useful diagnostic was not the absence of one-day winners but the holding-time distribution. In the canonical A output, P50 exits had a **median holding time of 11 trading sessions** (mean 10.5; p10 5), while forced exits had a median of 16 sessions. The original engine averaged only about **$14,732 BPR / 16% of the $92,000 envelope**, and the capital ceiling never bound. The original model therefore left substantial capital idle and did not model close-driven replacement opportunities.

### Muse capital-recycling scenario R

Muse's follow-on research report, *XSP Put-Credit-Spread Study — Capital-Recycling Deployment Analysis* (2026-10-01), tested a specific renewal rule:

- each position closed on session T-1 mints one replacement-entry attempt on session T;
- the normal one-per-session calendar attempt remains;
- unused/failed replacement opportunities expire;
- same-session recycling is not modeled;
- the frozen selector, P50 target, 21-DTE rule, execution assumptions, fees, and $92k BPR ceiling otherwise remain unchanged.

Reported A → R changes include:

- entries: **528 → 1,287**;
- completed trades: **519 → 1,256**;
- average BPR utilization: **16.0% → 40.1%**;
- completed trades / 100 sessions: **62.2 → 150.6**;
- realized P&L: **-$20,842 → -$106,395**;
- max concurrent positions: **18 → 52**;
- peak BPR: **$33,808 → $91,979**;
- maximum entries in one session: **47**;
- reported MTM drawdown: **-$31,534 → -$180,311**.

The important interpretive correction is that scenario R **did materially increase capital velocity/activity**. Its adverse result is therefore not evidence that there was little velocity to harvest. Rather, under this specific renewal rule, the additional turnover was loss-dominated and capital efficiency deteriorated (reported P&L per $1,000 BPR-day: -$1.71 → -$3.50).

Scenario R should not yet be treated as synonymous with generic "capital recycling." Only reuse of released capital is inherent to that broad idea. R additionally chooses one-for-one close-driven replacement opportunities, allows many attempts on the same next session, uses the same deterministic selector for those attempts, has no same-day fresh-cohort concentration limit beyond aggregate BPR, and lets forced exits mint replacements exactly as target exits do.

A major open audit question is therefore the **47-entry day / same-cohort concentration**: determine how many same-session R entries were identical `(expiration, short strike, long strike)` structures. If repeated calls to the frozen selector return the same spread, the severe R tail may partly represent faithful but pathological same-cohort concentration under the chosen renewal rule. This must be established from artifacts rather than assumed.

### Live `tt live` XLE watch: valuation crossing is not execution evidence

A one-hour read-only watch sampled `tt live` once per minute from 10:16–11:16 a.m. EDT. All **61 reads succeeded**.

- XLE P50 target: 0.09 debit.
- Synthetic four-leg midpoint was at/below target on **4/61 samples**, one contiguous run at 10:19, 10:20, 10:21, and 10:22 EDT.
- Those samples showed synthetic since-entry G/L of **+$12.50, +$10.50, +$10, +$10** while the position remained held.
- The condition was back above target at 10:23.
- EWZ crossed its 0.21 target on **0/61** samples.
- An earlier XLE synthetic **+$16** observation did not recur during the watch.

This establishes a useful evidence boundary for `tt live`: a synthetic leg-derived valuation can remain beyond a management threshold for several sampled minutes while the actual complex position remains held. Operator wording such as **"mid at/below target; still held"** is therefore more truthful than **"target reached."**

Do not over-transfer the XLE observation to canonical XSP. XLE was a **four-leg iron condor valued from independent leg mids**. Canonical XSP is a **two-leg vertical whose historical P50 trigger uses short ask minus long bid**. The live XLE event supports the general proposition that a valuation synthesized from independent option-leg quotes is not automatically evidence that a resting complex-order limit was executable. It does **not directly falsify** the canonical XSP ask/bid trigger.

### Initial Codex review of Muse R

Codex's initial read-only review accepted the adverse result as consequential for the **specific tested replacement rule**, but identified three claims requiring narrowing or verification:

1. The XLE observation illustrates the general package-execution evidence boundary but does not directly falsify XSP's two-leg ask/bid trigger.
2. The reported negative equity / extreme drawdown is driven by **uncapped independent-leg marks/crosses** and must remain distinct from an observed executable defined-width spread loss. Contractual expiration payoff, executable combo liquidation, synthetic leg valuation, and model MTM are separate concepts.
3. Muse states that A-vs-R direction is robust across execution scenarios, but the report says R was run under the canonical execution model only. That robustness claim has not yet been demonstrated by the presented R results.

Codex had not yet independently verified the R run files or the reported 25-test result at the time of that review.

### Next research run requested

A new Muse audit/refinement run was requested to:

- independently reproduce scenario R and its tests;
- quantify same-session duplicate structures, especially the 47-entry day and March–April 2025;
- distinguish **capital velocity/activity** from **capital efficiency/expectancy**;
- attribute replacement chains to P50-sourced versus forced-exit-sourced renewals;
- correct the XLE/XSP execution comparison;
- decompose >width synthetic marks and their contribution to extreme MTM drawdown;
- actually run R under compatible existing execution scenarios before claiming A-vs-R robustness;
- mechanically trace the March–April 2025 renewal/concentration feedback;
- avoid optimization or designing a post-hoc "better" replacement policy.

The purpose is classification and mechanism isolation, not strategy rescue.

### Current research posture

What is supported so far:

- the original calendar model did not recycle close-released capital;
- the P50 median residence is about 11 sessions, not ~1 session;
- the original model had substantial idle BPR;
- scenario R materially increases activity/utilization;
- scenario R is materially worse economically under the canonical execution model;
- R permits extreme daily entry bursts and therefore requires concentration audit;
- live XLE evidence demonstrates a general synthetic-valuation-versus-complex-execution distinction.

What remains unresolved:

- whether R's severe tail is substantially driven by identical same-session cohort duplication;
- how much of incremental R loss is attributable to forced-exit renewal chains;
- how much extreme MTM drawdown depends on >width synthetic independent-leg valuations;
- whether R is worse than A under each compatible existing execution model;
- whether historical XSP P50 trigger observations correspond to executable resting complex-order fills.

**Authority:** research continuity only. XSP remains exploratory. No Wheelwright strategy authority, roadmap admission, policy change, or production deployment rule is established by this entry.


---

## 2026-10-01 — XSP recycling audit closes; Exit Reliability becomes the next execution-evidence question (ChatGPT)

**Actor:** ChatGPT, preserving the completed Muse follow-on audit and its connection to the live tastytrade evidence work.
**Mode:** Research/journal persistence only. No XSP strategy admission, deployment-policy adoption, Exit Reliability score, Wheelwright eligibility rule, or optimization authorization.
**Scope:** Completed audit of scenario R; corrected interpretation of recycling; execution-model dependence; same-session concentration; and the research handoff to Exit Reliability / `tt scout`.

### Muse follow-on audit: what is now established

Muse completed the requested audit/refinement run against the frozen XSP recipe. Scenario R reproduces exactly from its artifacts: **1,287 entries** (779 replacement / 508 calendar), **1,256 completed**, 674 P50 / 582 forced, **-$106,394.70** net, **-$180,310.70** model MTM drawdown, average BPR **$36,901 / 40.1%**, peak BPR **$91,979**, max 52 concurrent, and max **47 entries/session**. Replacement-attempt accounting reconciles on all 834 sessions with zero mismatches; 25/25 regression tests re-passed.

The concentration question is resolved. The 47-entry day was **47 copies of one identical spread**. More generally, every one of the 508 R entry sessions selected exactly one unique `(expiration, short, long)` structure; 136 sessions entered multiple copies; 100% of replacement entries shared their session/structure with another entry; and **71% of all R BPR entered** sat in same-session duplicated cohorts. This is classified as a **faithful but pathological consequence of the specified renewal rule**, not a simulator bug: repeated same-day attempts invoke one deterministic selector, and the rule contains no same-session de-duplication or concentration constraint beyond aggregate BPR.

The capital ceiling also has an important model boundary: it is checked against a **fixed $92,000 notional**, not current modeled equity. On 2025-03-17, after equity had fallen to **$145**, the model could still deploy **$91,966 BPR** into 42 identical replacement entries. This materially amplifies the modeled feedback loop and prevents reading the tail as a literal brokerage-account path.

### Velocity and efficiency are separate

The earlier phrase "little velocity to harvest" is withdrawn. R materially increased activity: completed trades / 100 sessions **62.2 → 150.6**, BPR-days **12.2M → 30.4M**, and mean utilization **16.0% → 40.1%**. But capital efficiency deteriorated: P&L per $1,000 BPR-day **-$1.71 → -$3.50**. Cycles per BPR-year actually fell **19.5 → 18.7**, so the turnover increase came from deploying more dollars, not faster cycling.

Forced-exit-sourced renewal is the dominant loss channel. Expected attribution assigns about 355 replacement entries to forced-exit sources and 424 to P50 sources. Forced-sourced replacements lost about **-$74,495** versus **-$10,336** for P50-sourced replacements; approximately **87% of replacement P&L damage** traces to forced-exit-minted chains. Mean renewal depth is about 2.2 generations; the March 17 cohort reached about 3.9.

### R is a specific renewal policy, not generic capital recycling

The tested object is now bounded precisely: every close on T-1 mints one next-session replacement attempt; the standing calendar attempt remains; all attempts use one deterministic same-day selector; no same-day cohort concentration constraint exists; forced exits mint replacements identically to P50 exits; opportunities expire unused; and the BPR ceiling is fixed at $92k.

Only "released capital can be reused" is inherent to the broad concept of capital recycling. One-for-one minting, deterministic duplicate selection, source-blind renewal, and lack of concentration controls are policy choices. Therefore the result must not be summarized as "capital recycling fails."

### Execution-model robustness claim is refuted and replaced

Muse actually ran R under the existing execution models. Calendar → R results:

- optimistic midpoint: **+$18,252 → +$68,850** (R delta **+$50,598**);
- reasonable/canonical: **-$20,842 → -$106,395** (delta **-$85,552**);
- conservative: **-$24,998 → -$109,841** (delta **-$84,842**);
- combo-cap: **-$20,541 → -$106,094** (delta **-$85,552**).

The earlier broad claim that R is directionally bad across execution scenarios is therefore false. The better description is that this renewal rule is a **sign-preserving amplifier of base-trade expectancy**, while also widening tails and concentration. Even the profitable midpoint R run drew down **-$66,083** and lost **-$43,285** in March 2025.

This makes the execution economics of the base trade a prerequisite to useful deployment optimization. Under the frozen study, changing the execution model changes the calendar strategy from positive to negative and changes renewal from beneficial to catastrophic. Recycling should therefore remain untouched until the base trade's executable economics are better established.

### >width marks and XLE comparison narrowed

The extreme R drawdown is not primarily a >width synthetic-mark artifact. Only 12 of 17,007 valid R position-days (0.07%) synthesized above the $20 width; capping those marks would improve the approximately -$83k trough by only about **$2.3k**. The dominant mechanism is concentration in many copies of spreads widening substantially toward, but mostly below, maximum loss. Combo-cap ≈ canonical independently supports this conclusion.

The live XLE observation is also bounded correctly. Four consecutive one-minute XLE observations had a four-leg synthetic midpoint at/below the resting P50 target while the complex order remained unfilled. This establishes the **general** proposition that independent-leg synthetic valuation is not package-execution evidence. It does **not** directly falsify the XSP historical trigger, which uses a two-leg ask(short)-bid(long) taker-crossing on a different underlier. The XSP substrate itself still cannot establish whether a particular historical P50 trigger would have filled as a live complex order.

### Exit Reliability: the research handoff

The completed audit and the live evidence work now converge on one research priority: **establish the execution economics of the base trade before optimizing capital velocity**.

A new research concept is being used for that problem:

> **Exit Reliability:** the empirical likelihood that a complete options position can be closed, when its management rule requires closure, at a price reasonably represented by observable market evidence.

Exit Reliability is not a broker liquidity rating and is not yet a Wheelwright score or policy. Leg bid/ask width, size, timestamp freshness/skew, open interest, volume, synthetic stability, and tastytrade's broker liquidity rating are candidate predictors only. The eventual dependent evidence requires package-level outcomes or comparable evidence: fill/no-fill, time-to-fill, and concession required.

The read-only `tt scout` feasibility slice has been implemented locally by Codex (reported local commit `b2e139a`, not pushed at the time of this journal persistence). It accepts operator-supplied roots and exact specimen rules and exports one-shot tastytrade evidence without ranking roots or inventing a package quote. A live XSP specimen at 50 calendar DTE returned complete two-sided leg quotes, sizes, timestamps, and broker liquidity facts across $5/$10/$15/$20 widths. In that single observation, the component-market mid-to-natural gap remained roughly 7.5-9 cents while the spread credit increased with width; therefore the same absolute quote concession consumed a much larger fraction of the narrow spread's credit/P50 objective. This is a candidate diagnostic, **not an execution result** and not evidence that a complex order would fill at either synthetic price.

The next research step is cross-sectional design, not another `tt` product feature: explicitly choose a candidate-root universe and specimen-sampling methodology, compare observable candidate predictors across roots and lifecycle ages, and only then decide whether longitudinal/streaming evidence collection is justified. Do not hard-code an Exit Reliability formula or Wheelwright criterion from the first snapshots.

### Authority / unresolved

This checkpoint preserves research continuity only.

Supported:
- R reproduces exactly under its specified rule.
- Same-session duplicate concentration is total when multiple R attempts occur.
- R materially increases utilization/activity but worsens efficiency under the canonical model.
- Forced-exit-sourced renewal dominates incremental R losses.
- R's direction depends on the base execution model; it is not universally destructive.
- >width synthetic marks are not load-bearing for the extreme R tail.
- XLE supports the general synthetic-valuation-versus-package-execution boundary.
- The historical XSP substrate cannot determine actual complex-order fill truth.
- One-shot `tt scout` evidence is suitable for studying candidate execution-quality predictors, not for claiming Exit Reliability.

Unresolved:
- actual fill/no-fill truth for historical XSP P50 triggers;
- whether EOD ask/bid systematically over- or under-counts executable package fills;
- which observable market-quality features predict package exit outcomes;
- which underlying/structure/width/DTE combinations have high Exit Reliability;
- any renewal policy other than the audited R bundle;
- whether forced-sourced renewal damage persists out of sample.

**Authority:** XSP remains exploratory under existing research authority. No strategy admission, capital-allocation rule, recycling policy, Exit Reliability threshold, underlying ranking, or Wheelwright ingestion is authorized by this entry.

## 2026-10-01 — Pass 0 v1 geometry boundary adopted after calendar-phase falsification (Principal)

The Principal adopted Pass 0 v1 as a dated, class-specific option-geometry census over all 6,381 class rows in frozen Pass −1 v0, with 6,072 underlyings separately reportable. The 101 class rows whose provider roots were unresolved at Pass −1 stay in the denominator. Pass 0 records observed exact-root future put expirations, contract and strike geometry, acquisition and identity states, and provenance. It does not select a unique specimen, screen market quality, or determine eligibility.

Why this boundary matters: an offline counterfactual held the Pass −1 option listings fixed and moved only the hypothetical observation date. A 40–50 DTE same-class put-pair count changed from 6,038 on October 1 to 13 on October 15 to zero on October 22. A narrow DTE gate would therefore encode calendar phase as structural attrition. These counts are a sensitivity check on static lookup strings, not a live later-date census.

The next authorized research action is a bounded specimen-selection pilot covering reference price, volatility provenance, risk coordinate, expiration phase, strike tolerance, nonstandard deliverables, and unmatched behavior. The full-population Pass 0 crawl is deferred until that pilot checks whether the geometry evidence contract is sufficient. The adopted bounded methodology is recorded in `docs/discovery/pass-zero-v1-class-geometry-method-2026-10-01.md`; no product eligibility or Exit Reliability policy follows from it.

## 2026-10-01 — First bounded specimen-selection contrast pilot exposes separate reference-evidence needs (Codex)

A read-only eight-underlying Tradier panel plus one supplemental adjusted-class chain returned 33/33 HTTP 200 responses; all raw bodies were hash-verified and archived. The November monthly `SPX` chain contained distinct `SPX` and `SPXW` roots, both marked `standard`. The November `TSLL` chain did not contain `TSLL1`, while the January chain contained both. Both January roots reported `contract_size: 100`, yet OCC Memo #57857 establishes a cash component in the adjusted `TSLL1` deliverable at its effective date. Exact root and authoritative contract terms remain necessary.

A deliberately provisional selector normalized strike log-moneyness by 60-return realized volatility and chose target coordinates −0.5/−1.0 without option liquidity fields. Observed short-leg deltas still ranged −0.1704 to −0.3380 across the panel, and the TSLL/TLT strike grids missed the short coordinate by more than 0.1 standardized units. This falsifies any claim that the tested coordinate plus nearest-strike selection automatically yields risk-comparable specimens. It does not establish a better target or tolerance.

The Pass 0 geometry method remains adopted. The pilot is exploratory evidence, not a revision of that decision. A price/volatility-scaled Pass 1 selector needs timestamped reference-price and history evidence paired to the geometry observation, a declared adjustment convention, applicable deliverables, expiration-phase control, tolerance, and unmatched handling. Whether reference evidence is acquired in the Pass 0 run or as a separately versioned Pass 1 bundle remains an acquisition-design question. See `docs/discovery/pass-one-specimen-selection-bounded-pilot-2026-10-01.md` and its archived raw evidence.

## 2026-10-01 — Pass 0 ancillary reference capture adopted (Principal)

The Principal chose to capture timestamped underlying quote and history evidence needed for downstream replay alongside each dated Pass 0 geometry observation. That evidence is ancillary: only identity and exact-class option geometry determine the Pass 0 class state. Missing or ambiguous reference evidence remains a separate state and may withhold a later specimen conclusion without erasing observed geometry or either frozen denominator.

The decision resolves the acquisition-boundary question raised by the first bounded pilot. It does not ratify the pilot's 60-return lookback, price-adjustment assumption, realized-volatility coordinate, expiration phase, strike tolerance, or unique specimen. The reference-history window and provenance protocol must be declared before a full-population acquisition so the capture can actually replay the later rule. No full Pass 0 crawl or market-quality filtering follows from this decision.

## 2026-10-01 — `tt live` Ten-Second Read layout refined (Principal)

The Principal approved an operator-facing split of the former OBJECTIVE column after inspecting a mockup against the live EWZ/XLE positions. `OPEN@` is the fill-derived net opening credit; `CLOSE@` is the current four-leg midpoint debit; `TARGET CLOSE@` shows the profit-order limit as a percentage of opening credit plus contract expiration; `PROGRESS` shows the current price gap to that target. OPENED combines the New York opening date and elapsed calendar days. The existing P/L Day and since-entry STATE remain separate measures.

The agreed specimen used `0.42 CR / 0.465 / 50% @ 0.21; exp 11/20 / 0.255 above target` for EWZ and `0.18 CR / 0.165 / 50% @ 0.09; exp 10/16 / 0.075 above target` for XLE. The values came from the same live broker read, not a hard-coded display. A DTE-based close rule was discussed as a possible future target component but was not declared for these trades and is not inferred. A midpoint at or below the target remains valuation evidence, not execution evidence; PROGRESS says the position is still held.

QUOTE may display `EOD` only when the broker's equity-session close time is known and all four leg quote updates are at or after that close on the same New York date. Otherwise it retains quote age. This is an operator label for observed post-close quote context, not a claim of a broker-certified closing print. The optional session read does not block the live view if it fails.

## 2026-10-01 — Bounded Pass 1 coordinate/history comparison remains inconclusive (Codex)

A protocol fixed eight underlyings, two expirations (43 and 50 DTE), 95%/90% price-relative strikes, and −0.5/−1.0 realized-volatility-normalized strike coordinates with 20/40/60 return windows **before** the 40 read-only Tradier requests. All 40 responses were HTTP 200 and raw-body hashes verified. No spread, size, OI, volume, quote-quality, or delta field selected a contract; delta was inspected only afterward. An explicit one-quarter target-separation strike tolerance produced unmatched states without fallback.

On the 50-DTE monthly date, all four selectors matched the same eight of nine ordinary exact-root class rows; `TSLL` was unmatched. Short-delta span fell from 0.1792 for fixed 95%/90% moneyness to 0.0672 for RV20, but RV20's long-delta span was 0.1207 and its net-spread-delta span 0.0535 versus 0.0507 for fixed moneyness. Seven of those eight matched classes changed the selected contract pair across the 20/40/60 histories. At 43 DTE, `SPXW` was present and `SPX` absent at the exact root; aggregate match counts were 5/9 for fixed moneyness and 6/9 for each RV window. The weekly/monthly and DTE differences are not causally isolated.

The narrower RV20 short-leg diagnostic is a candidate for independent challenge, not an adopted history window or specimen rule. The experiment does not establish complete position-risk comparability, adjustment semantics for history, or adjusted-class deliverables. `TSLL1` and unresolved `SPX9` remain separately accounted for. See `docs/discovery/pass-one-coordinate-history-comparison-2026-10-01.md` and its archived pre-acquisition protocol, raw bodies, and row-level analysis. Full-population Pass 0 acquisition remains downstream of the selector/reference-protocol decision.

## 2026-10-01 — `tt live` current-valuation and color semantics clarified (Principal)

After testing the first refined readout, the Principal identified that `CLOSE@` implied an executed closing fill even though the live trade remains open. The live header is now `CURRENT` for the four-leg midpoint-derived debit; `CLOSE@` is reserved for an actual closing execution. `OPEN@` becomes `OPENED@` for the fill-derived opening credit. The underlying numeric evidence and target/progress calculations are unchanged.

Color is scoped to the measure it describes: P/L Day has its own sign color; STATE and TOTAL G/L share the since-opening economic color; OPENED@ through PROGRESS remain white. A trade can be GREEN since opening while its current debit is still above the target closing price. The independent color treatment keeps that distinction visible rather than making the whole row look like target completion.

## 2026-10-01 — `tt live` removes redundant STATE and extends since-open color (Principal)

The Principal removed the explicit STATE column from the live readout. TOTAL G/L now carries the since-opening gain/loss directly. Its red/green color also applies to CURRENT, TARGET CLOSE@, and PROGRESS; OPENED@ remains white, while P/L Day retains its independent sign color. Color on the target/progress segment expresses the trade's since-open economics, not whether the target order executed. Stale or flat economics have no red/green color.

The TARGET CLOSE@ separator changed from a semicolon to `or`, yielding `50% @ 0.21 or exp 11/20` in the EWZ specimen. This is operator-facing wording for the displayed profit target and contract expiration; it does not add a DTE close rule or infer an executed exit.

## 2026-10-03 — `ww` explicit synchronization reaches the Principal's shell

The initial read/sort specimen proved numeric composition but exposed a missing capability: the Principal wanted numbers after an explicit request to synchronize, without a hidden acquisition in the read. The old targeted-refresh response could not certify completion or per-symbol held prices, so the CLI was parked instead of compensating with a refresh-plus-reread inference. The Principal authorized a bounded PL-OPS-09 backend repair and later the narrow `ww refresh`/`ww prices` shell path, deliberately setting language selection aside.

After the backend candidate exposed completed per-symbol acquisition and held-price facts, the Principal ran `ww refresh QQQ SPY XLE && ww prices QQQ SPY XLE | ww sort --by price`. All three refresh results reported held prices; the read/sort output was XLE 62.82, QQQ 749.58, SPY 769.64. This is Product evidence for explicit synchronization → separate inspection → numeric Unix composition. Friday or previously held values can satisfy presence; the command makes no age, freshness, independent underlying-quote provenance, or trading-suitability claim. The Node specimen's TTY metadata density remains an observed UX concern, and the durable implementation-language gate is still open. Canonical state: `PL-OPS-09` in `docs/parking-lot-8.md`, `PL-CLI-01` in `docs/parking-lot-10.md`.

## 2026-10-04 — `ww fetch` replaces the CLI refresh spelling

The Principal selected `fetch` as the executable acquisition primitive and explicitly retired the `refresh` CLI spelling without an alias. Git's fetch convention provided the useful separation: update held knowledge, then inspect it with `ww prices`. The accepted success postcondition remains completed synchronization with a held price for every requested symbol; it does not prove new acquisition or freshness. The working CLI now exposes `ww fetch SYMBOL...`, reports a concise held-price count to terminal stderr, supports `-q`/`--quiet`, and emits per-symbol result records on redirected stdout. `ww --help`/`--man` and command-level equivalents provide self-contained discovery for humans and agents. Direct local probes of `./scripts/ww fetch QQQ` and `./scripts/ww fetch QQQ SPY XLE && ./scripts/ww prices QQQ SPY XLE | ./scripts/ww sort --by price` returned exit 0. The latter produced held prices for all three symbols and numeric order XLE 62.82 → QQQ 749.58 → SPY 769.64 in non-TTY records. This is implementation evidence, not Principal Product acceptance of the renamed UX or its terminal presentation. Bare fetch/default context, installer work, and implementation-language choice remain open. Canonical state: `PL-CLI-01` in `docs/parking-lot-10.md`.
## 2026-10-05 — PL-API-02 HTTP boundary classification persisted as Category E evidence
Following the OpenAPI/OAS feasibility investigation that produced `PL-API-02`, the Principal authorized a bounded read-only classification of the entire backend HTTP surface: all 30 mapped handlers across 16 `@RestController` classes, each tagged with Java return type, actual response shape, serialization mechanism, direct HTTP-path test, discoverable reason for weak typing, a classification (contract-required / justified / incidental debt / uncertain / already-typed), and whether changing the Java type would alter observable HTTP semantics. No DTO, annotation, springdoc, OAS file, or cleanup was created; the surface was only read.
The material result reframes the API: weak typing is **heterogeneous, not one defect**. The backend already embodies four legitimate representation patterns — exact hand-controlled contracts where presence/null/ETag semantics matter (snapshot, quotes), genuinely dynamic maps where a fixed DTO is not better (symbol-keyed histories, count maps), ordinary Jackson records that are already typed (observer page, production success body), and incidental type erasure around otherwise-typed responses (the `ResponseEntity<?>` resolve/decision wildcards, `Object` on provider-events). Counts: 3 contract-required, 6 justified, 13 incidental debt, 3 uncertain, 2 already-typed. A non-obvious contract-required case is `POST /api/evidence/observe`, whose untyped request `Map` encodes a three-way omitted/`[]`/present lifecycle (unchanged / clear / replace, with a `heldExpirations: -1` "unchanged" sentinel) that a flat DTO would destroy. The three uncertain endpoints (`/api/status`, `/api/evidence/refresh`, `/api/continuity/assess`) turn on absence-vs-null and conditional key presence, so a naive DTO conversion would be an observable change — the honest answer to "is the weak typing required?" there is "partly."
The Principal judged this evidence past Wheelwright's durability threshold and chose to persist it rather than leave it to be reconstructed later. It is recorded as `docs/75-pl-api-02-http-boundary-classification-2026-10-05.md` (Category E) and indexed in `docs/README.md`. The Principal explicitly directed stopping here: no OAS design-options evaluation yet. The persisted survey becomes an input to the strategic/architectural reconciliation of `PL-API-02`, which remains at `INTAKE`. The Roadmap projection was unaffected — numbered `docs/NN-*.md` and the journal are not canonical inputs to `generate-roadmap-projection.mjs` (parking-lot, roadmap, architecture-roadmap, ADRs, principles, bug corpus, domain reference are), and the parking lot was not modified. Baseline `main` @ `2c49b26`.

## 2026-10-05 — `ww fetch` Product meaning selected; provider capability sheet preserved

The Principal stopped the accumulating PL-OPS-10 performance investigation and selected a durable semantic boundary: `fetch` acquires a declared family of external market observations for named subjects; unqualified `fetch SYMBOL` defaults to the direct quote-observation family and does not silently traverse further evidence units selected by Wheelwright policy. Ordinary fetch may reuse backend-acceptable evidence; a distinct force intention would require upstream reacquisition, with syntax and acceptance rules still undecided. This Product decision does not change the current experimental CLI. It is recorded canonically under `PL-CLI-01` in `docs/parking-lot-10.md`.

The October 5 measurement made the architectural reason concrete: 14 requested symbols led through the shared v1 web-oriented targeted refresh to 99 legitimate chains plus 14 quotes. The 85 non-primary chains serve accepted `PL-EVID-07` Decision coverage and must not be removed from v1 simply to accelerate the CLI. The distinction is between cardinality inside a named evidence unit and policy traversal across further units. The Product decision is distilled into the existing `docs/76-ww-fetch-api-v2-investigation-snapshot-2026-10-05.md`; the short official-provider capability table is `docs/cli/tradier-market-data-capabilities-2026-10-05.md`. The separate common-API concern receives `PL-API-03` intake; `PL-API-02` remains the machine-readable-contract concern, and Doc 77 carries ratified v2 architectural guardrails. Canonical quote observation authority is the first unresolved design pressure, because today's held price is derived from primary-chain evidence. No v2 implementation was authorized by this documentation step.

## 2026-10-05 — `ww fetch` migrated to accepted v2 direct-quote acquisition (Codex)

The Principal explicitly authorized Codex to implement the bounded CLI migration against accepted backend `e3da44f63e8fa7681b9a5d6fd4f722fc3e2440a0`, with one local commit and no push. Bootstrap verified a clean local `main`, identical `origin/main`, and identical remotely queried main. Gate Experiment 001 remained STAGED/inactive; this work did not activate it or reopen any rejected backend candidate.

Inspection exposed the one externally visible migration gap: experimentally accepted bare fetch selected monitored UNION fixed seed using v1 `GET /api/evidence/monitored`. Codex stopped before inventing its replacement. The Principal then decided that bare fetch must be a usage error with no API/provider work, explicitly rejecting seed-only or another implicit selector. That disposition and the migration's current operational meaning are reconciled under `PL-CLI-01` in `docs/parking-lot-10.md`.

Fetch now expresses ordinary/force intent through one named-subject v2 batch request. The old held-price success criterion is replaced by backend fulfillment: retained prior after failed acquisition remains failure, and reuse is visibly distinct from new acquisition. Quiet/verbose and JSON Lines are preserved without a general output redesign. New credential plumbing uses explicit `WW_API_TOKEN` Bearer auth, with fail-before-contact missing credentials, backend-owned grants, remote HTTPS, rejected redirects, and secret suppression. The accepted backend and frozen contract remain unchanged.

The discovery examples no longer suggest that `fetch && prices` inspects newly acquired direct quotes: prices remains an independent v1 chain-associated read, while fetch's structured result contains the returned canonical direct quote. No public v2 held-read capability was invented. Deterministic HTTP fixtures permit only `/v2/quotes`; terminal/shell acceptance includes retained-prior failure, reuse, quiet/verbose, and bounded early pipe closure. These checks are implementation evidence; no live provider acquisition or independent Product acceptance is claimed. Roadmap projection synchronization is required because the canonical parking-lot record changed. The local commit is the reviewable handoff; remote main remains at the accepted backend baseline and no push is authorized.

**End-of-session closeout:** Executed the containing `docs/bootstrap/end-of-session-protocol.md` within the Principal's explicit local-commit/no-push constraint. Canonical disposition, current CLI discovery, and why-state are reconciled; Coming Soon requires no horizon change. Verification: all Node script tests 43/43, focused Wheelwright tests 17/17, terminal/shell acceptance 10/10, syntax and diff checks clean. The no-chain invariant also checks that the accepted v2 controller/service/provider source do not reference legacy worker/enrollment/chain-acquisition entry points. Roadmap projection regenerated and freshness passed; regeneration also reflects the already-existing canonical BUG-028 record (no record or remediation code changed). Backend/OAS/Docs 77–79 are unchanged. Authorized persistence is one local commit; accepted remote-main SYNC remains `e3da44f63e8fa7681b9a5d6fd4f722fc3e2440a0`. Remote promotion is deliberately deferred under the no-push instruction, rather than claimed synchronized with the local candidate. No Product/security/architecture question remains for this slice.

## 2026-10-05 — Acceptance runner exposes every command and captured result (Codex)

The Principal ran the supplied block and reported all 43 Node tests, all 10 terminal/shell cases, and roadmap freshness passing; live probes were skipped because no WW_API_TOKEN was exported. This is Principal-run deterministic evidence, not live-provider acceptance. The Principal then requested the command line and output for each acceptance test. The runner now prints every case's command, separately labeled stdout/stderr (explicitly marking empty streams), exit status, and PASS/FAIL, including all pipe and shell-sequencing cases. Captured output is shown before assertions so failures remain observable; credential echoes and assertion diagnostics are redacted. Terminal CRLF is normalized for transcript readability. Verified all 10 cases pass. No CLI/backend behavior or canonical roadmap input changed; no projection regeneration is needed. This follow-up is locally persisted without rewriting the migration commit or pushing, preserving the existing no-push closeout constraint.

## 2026-10-05 — Complete local v2 credential setup so plain `ww fetch SPY` works (Codex)

The live shell acceptance stopped on missing WW_API_TOKEN. Inspection showed neither client token nor backend Bearer configuration existed in the private root `.env`; earlier export instructions had not provisioned a matching credential. The Principal explicitly requested script/config correction, permitting private `.env` updates, with the operator outcome that typing `ww fetch SPY` works. The CLI now follows the existing repository private-file convention, reading only literal WW_API_TOKEN when no nonempty export exists; it never evaluates shell expressions or loads provider credentials. Empty exports fall back to the file so the previous empty prompt attempt cannot strand the operator. Missing-both-source tests use an isolated temporary CLI tree, protecting tests from actual private credentials.

A random local Bearer credential and matching `cli:quote.acquire|quote.force` backend configuration were added to the Git-ignored `.env` without exposing values or changing existing provider configuration. File permissions are 0600. The backend JVM was restarted using that environment and JDK 21; the frontend was preserved. Initial authenticated calls correctly returned UPSTREAM_UNAVAILABLE during provider initialization. At `2026-10-05T21:06:00Z`, plain PATH `ww fetch SPY` returned NEWLY_ACQUIRED, canonical SPY/ETF observation `68fbdc0a-b497-4f0f-bd83-070b53ce7a58`, and exit 0 without token exports/prompts. Current configuration and why-state are reconciled under PL-CLI-01; no backend/OAS/auth implementation changed. The private credential is not part of Git persistence.

**Separate observed runtime contract anomaly, not remediated:** that successful live response included non-date values for optional sourceEventAt fields (`prevclose`, `asksize`, `root_symbols`). These are verbatim backend facts in the acquired observation, not values invented by the CLI. They conflict with the frozen date-time field schema. This follow-through does not reopen Doc 79, change the backend, normalize those values into fictional timestamps, or claim full live wire conformance. The configuration/acquisition success is established separately; the backend timestamp anomaly needs its own bounded disposition.

**Principal-run live confirmation:** `ww fetch -v spy spx xle xlf` returned mode ORDINARY, request `1ff5df81-38a9-48b8-a7cb-6e2a9c43f443`, and NEWLY_ACQUIRED for SPY, SPX, XLE, and XLF with `4/4 fulfilled; 4 newly acquired, 0 reused, 0 failed`. This independently establishes the intended low-ceremony local authentication and explicit multi-subject acquisition outcome. It does not resolve the separate optional source-time wire anomaly noted above.

**Closeout verification:** 45/45 Node script tests and 10/10 terminal/shell acceptance cases pass; syntax/diff checks clean. Roadmap projection regenerated and freshness passed after PL-CLI-01 reconciliation. Private `.env` remains ignored and is not staged. The backend source, frozen contract, and unrelated v1 code remain unchanged. The follow-up is persisted as a new local commit without rewriting prior commits or pushing; backend remains running with the matching private credential configuration. The separate source-time anomaly is preserved as observed evidence, with no backend remediation undertaken.

**Principal final test disposition:** “acceptance tests passed.” Recorded under PL-CLI-01 as the bounded test result after local configuration and live batch verification. No push authorized; no further CLI change required.
