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
