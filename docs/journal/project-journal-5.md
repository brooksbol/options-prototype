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
