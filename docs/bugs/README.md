# Wheelwright Bug Tracking — Repository-Native Defect System

**Status:** Governing methodology for defect tracking (Category B — Ratified Methodology)
**Ratified:** September 11, 2026 (Principal decision — Defect Tracking Migration)
**Supersedes:** The September 4, 2026 "GitHub Issues as the Defect System of Record" rule (formerly in `docs/README.md` and `foundations/idea-intake-reconciliation.md`).

---

## The One Rule

> **`docs/bugs/` is the one and only authoritative defect-tracking mechanism for Wheelwright.**

There is exactly one way to track a bug. A bug has:

> one durable identity → one authoritative record → one lifecycle.

GitHub Issues are **no longer** the defect system of record. They are preserved as historical **provenance** only. New defects must **not** be filed as GitHub Issues, and a repository bug record must **not** be mirrored by a parallel defect Issue. Parking-lot items, roadmap artifacts, journal entries, ADRs, PRs, commits, and tests may *reference* a `BUG-NNN`, but they never become an alternative bug record.

---

## What a Defect Is

**A defect is a demonstrated failure of Wheelwright to behave according to its intended semantics** — for example accounting-correctness failures, lifecycle-projection failures, presentation/cognitive-correctness failures, or authority-boundary violations. A defect is **not** a new capability, a roadmap direction, or a discovery note. Those remain governed by the parking lot and roadmap (`foundations/idea-intake-reconciliation.md`).

---

## Identity

Each bug receives a simple, permanent, sequential identifier:

```
BUG-001, BUG-002, BUG-003, ...
```

- **The `BUG-NNN` portion is the permanent identity.** Identifiers are assigned in ascending order and are **never reused**, even if a bug is later found invalid or duplicate.
- **The identifier encodes nothing else.** Severity, area, status, date, ownership, and any other mutable attribute must **not** appear in the identifier. Those live *inside* the record and the index.
- **Filenames add a human-readable hint:** `BUG-NNN-short-hint.md` (e.g. `BUG-001-called-away-share-basis.md`). The hint is descriptive only and **may change** if understanding of the defect improves. The `BUG-NNN` prefix must not change.

---

## Record Format

Every bug record is a Markdown file in `docs/bugs/` following this structure. The goal is that a cold actor can determine — **without conversation history** — what failed, what intended semantics were violated, what evidence supports the defect, its current disposition, and what remediation/verification (if any) occurred.

```markdown
# BUG-NNN — <concise defect title>

- **Status:** Open | Resolved | Won't Fix | Duplicate
- **Severity:** S1 | S2 | S3 | S4 | Not established
- **Area:** <affected surface/engine, e.g. Production, Operator Console, Application Shell>
- **Provenance:** GitHub Issue #<n> (<url>) — historical, non-authoritative

## Observed failure
What was demonstrated to fail, in working software.

## Intended semantics violated
Which Wheelwright semantics the observed behavior contradicts.

## Evidence
Concrete evidence: traces, figures, specimens, dates. Preserve epistemic status
(observed vs. operator-reported vs. derived). Do not manufacture evidence.

## Consequence
Why it matters / operator impact. Severity rationale where established.

## Diagnosis / root cause
Where established. If not established, say so.

## Scope / non-goals
What this record does and does not cover. Filing does not authorize remediation.

## Acceptance criteria
Conditions an eventual fix must satisfy (where the historical record established them).

## Remediation history
Empty while Open. When resolved, records the change and relevant PRs/commits.

## Verification
Empty while Open. When resolved, records how the fix was verified.

## Related
Cross-links to other BUG-NNN, PL-* items, ADRs, journal why-state — as context, not authority.
```

### Severity vocabulary (verbatim, ratified)

`S1` critical · `S2` major · `S3` moderate · `S4` minor.

Severity describes **consequence if the defect stands**. It is evidence, not a remediation priority or ordering. Where a defect's historical record never established a severity, record it honestly as **`Not established`** — do not assign one merely to fill the field.

### Status / disposition vocabulary

`Open` · `Resolved` · `Won't Fix` · `Duplicate`. A **`Resolved`** bug remains in the corpus and index (resolved bugs are still bugs and remain discoverable); its record carries remediation and verification provenance.

---

## Lifecycle Rules

1. **Filing does not authorize remediation.** Identifying, recording, classifying, or reconciling a defect is not permission to change code, redesign a surface, or alter behavior. Remediation requires separate explicit Principal authorization, consistent with the mode/authorization discipline in `bootstrap/project-memory-protocol.md`.
2. **Severity describes consequence; priority/sequencing is a separate Principal decision.** *When* a defect is addressed is Principal sequencing and is not encoded in the record.
3. **Disposition does not change merely because related later work exists.** A bug is `Resolved` only when its own remediation is demonstrated and verified.
4. **Provenance is preserved, not authority.** Historical GitHub Issue numbers/URLs are retained inside each record as provenance. They do not confer continuing authority.
5. **Ideas and defects are not double-booked.** A defect does not receive a `PL-*` identity for being a defect; a `PL-*` capability does not become a bug record. They may cross-link; neither restates the other as its own authority.

---

## Discovery

- Browse `docs/bugs/` directly — filenames carry human-readable hints.
- The canonical index is `docs/bugs/INDEX.md` (one row per bug: identity, title, area, severity, status, provenance).
- The index is the fast path; each `BUG-NNN-*.md` record is the authoritative detail.

---

## Adding a New Bug

1. Confirm it is a **defect** (demonstrated failure of intended semantics), not an idea/capability/discovery note.
2. Assign the next unused `BUG-NNN` (never reuse).
3. Create `docs/bugs/BUG-NNN-short-hint.md` using the record format above.
4. Add a row to `docs/bugs/INDEX.md`.
5. Do **not** open a GitHub Issue for the defect. Do **not** create a `PL-*` for it.

---

## Provenance of This System

Migrated from GitHub Issues on September 11, 2026 as a knife-edge authority cutover (Principal decision). The historical defect population (GitHub Issues #2, #3, #8, #9, #10, #11, #12, #14, #15, #16) was reconciled into `BUG-001`–`BUG-010`. Issues #1, #4, #7 were explicitly **not** defects and were not migrated. See `INDEX.md` for the mapping.
