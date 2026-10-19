# SFND2 survey summary — entry, governance, roadmap, bootstrap, steering

Classification: internal, redacted, non-normative survey evidence. Not authority.

## Scope and reading
- Assigned FULL depth: root `AGENTS.md`, `README.md`; `docs/AGENTS.md`, `docs/README.md`, `KNOWN-FAILURE-MODES.md`, `principles.md`, `roadmap*.md`, `architecture-roadmap.md`, `technology-quality-*.md`, both WARNING reports; all of `docs/bootstrap/`, `docs/mandates/`, `docs/prompts/`, `docs/technology-quality/`, `.kiro/steering/`. 34 files, 6,248 lines, all FULL; `docs/development-machine.md` has one SKIPPED/sensitive-withheld row.
- Resumed after a throttled run. E001–E065 and D001–D030 came from that run; this pass added E066–E098 and D031–D036 and re-read every uncovered or thin source. Some segments (parts of architecture-roadmap AR1–AR10, fitness controls, the opening sections of the tech-quality program, KFM-adjacent sections) are recorded FULL on the strength of the earlier run's citations.
- Repository HEAD at survey time is `d03d8d1`, not the assigned `bef03dd`. Line numbers refer to `d03d8d1`.
- Outputs: 98 entries, 36 decisions, 385 coverage rows.

## Top findings
1. LVT Vision and seven Goals are recorded verbatim (E001, E066–E069) and kept separate from the Principal's six personal objectives (E002). No assigned routing path reaches the objectives file.
2. A–F authority model (E016): `principles.md` is Category C although it is the single source of truth for ratified principles. No v2 document is Category A. `.kiro/steering/*` and both AGENTS files are unclassified, yet KFM cites steering as authority (E079).
3. Steering contradicts repository authority on: universe 1,286 (E044); sandbox 60/min and 0.9 req/s (E045); "backend must NOT produce recommendations" versus ratified PRIN-ARCH-BACKEND-AUTHORITY (E046, E076); Nudge (E048); posture set (E050); Velvet Rope "designed, not live" (E053); test counts (E052); invariant count 18 (E057); Fidelity-only handoff (E058); v1-only topology (E059); Shared Execution Contract called "primary" although it is suspended (E047). Delta 0.30 / DTE ~21 matches v1 code but has no ratified authority (E054).
4. Actor-role incoherence. Cold starts make Codex primary AI Architect. Steering, both roadmaps and the docs index still use the Three Actor model (E051, E070), and current-investigation steering assigns Kiro architecture work (E072). The program and WARNING use Four-Actor, and project-memory omits Codex (E092).
5. Whether the constraint investigation is still open cannot be determined, and the answer is load-bearing. The ratified tech-quality program freezes AcquisitionWorker restructuring "while … investigation remains open" (E082, D033). README calls Docs 39/40 historical, while steering says ACTIVE.
6. The operating-model diagnosis is the strongest durable learning: adequate declarative rules but no transition control (E030, E077, E085). KFM's maxim: "Models reason. Durable state remembers. Deterministic mechanisms control consequential transitions. The Principal decides meaning." Gate Experiment 001 is still STAGED (E073).
7. Domain semantics hidden in governance docs: covered close ≠ complete retirement, and unknown quantity must not become zero (E088); Console Capital ≠ Account NAV (E078); observed inventory ≠ verified managed Position membership (E095); WAIT versus insufficient evidence (E007); Outcome is not Explanation (E097).
8. Index integrity: the docs index says ADR-001…022 though ADR-023 exists, and the priority stack cites a non-existent ADR-024 (E071). The ratified priority stack (2026-09-20) has no v2 entries (E040).
9. Product delivery means installed behavior the Principal accepts, not tests or review ACCEPT (E096). Principal acceptance must need zero configuration (E022).
10. The tech-quality estate shows approved-but-not-installed controls (ArchUnit, E037), two baseline SHAs (E039), an SCA exit criterion still pending (E081) and an SLO bound to a withheld machine file (E094).

## Top Principal statements (exact; attribution per source)
- "The Principal mandate is non-negotiable: **backend owns state and business logic; clients own presentation.**" — `docs/bootstrap/kiro-cold-start.md:33` (also chatgpt/codex cold starts)
- "In particular, instructions such as `export WW_BASE_URL=...` are **not acceptable** as Principal acceptance procedures." — `docs/bootstrap/codex-cold-start.md:42` (Principal requirement, Oct 11 2026)
- "> **execute end of session protocol**" — `docs/bootstrap/end-of-session-protocol.md:36`
- "Working software must drive architectural learning and reach the Principal early, not last." — `docs/mandates/product-first-continuous-engineering-2026-10-13.md:6` (document record of Principal direction)
- "Authority determines whether a capability is supportable. The Principal determines its horizon." — `docs/roadmap-coming-soon.md:9`
- "1. More profit 2. Less risk 3. Eliminate the need to be Nostradamus 4. Learn about options 5. Build cool stuff 6. Smoother, more reliable trading experience" — `docs/foundations/principal-personal-objectives-2026-10-14.md` (context file; explicitly not the LVT)

## Decision candidates not in the ADR register (selection)
- D009 Shared Execution Contract suspended (2026-09-17). D010 docs/bugs as sole defect system (2026-09-11). D011/D012 continuation rules. D013 idea-intake pipeline.
- D014 Product-first mandate (2026-10-13). D015 zero-config acceptance (2026-10-11). D016 End-of-Session Protocol (2026-09-22). D017 API v2 doc procedure (2026-10-15).
- D018–D021 Technology Quality Program, fitness controls, SLO-BUILD-01, SCA charter. D022 Principal git workflow (steering only; no docs/ home).
- D023 BUG-021 field test terminated. D031 Principal told actors to ignore the WARNING during the field test. D032 Gate Experiment 001 STAGED.
- D033 AcquisitionWorker protection. D035 mandatory roadmap-projection closeout. D036 Codex may be assigned implementation, with a separate reviewer.
- Proposal-only: D024 Codex as primary Architect (no ratification found), D026/D027 north star and Trade Finder boundary, D029 replacement topology, D034 friction ratchet.

## Contradictions (beyond steering, item 3)
- Commit authority layering: project-memory lets the authorized-work closeout commit/push, while steering commits only after explicit Principal acceptance (E055).
- The active WARNING says "DO NOT ARCHIVE" although a FINAL exists (E035).
- AR6 browser-side lifecycle evaluation conflicts with the backend-authority principle (E042).
- README's tastytrade Step 5 "not yet accepted" conflicts with the docs index "accepted/deployed" (E061).
- "Not a brokerage integration" conflicts with v2 broker acquisition (E093).

## Coverage gaps
- `three-actor-model.md`, `docs/experiments/*` (beyond two grep lines), Doc 77 and 07c ADR text were not read; they are outside the assignment.
- Whether a technology-optimization roadmap exists was not checked (E091).
- The derivation of FINAL's "~223 credits" is not shown in the assigned files (E084).

## Challenges to assumptions
- The Kiro steering injected into every session is the most stale authority surface and contradicts ratified v2 principles. A cold Kiro session therefore starts with wrong architecture facts unless it follows `AGENTS.md`.
- "Ratified" principles are few: 11 Architectural/Epistemic and zero Product. Most principle-like language (KFM maxim, friction ratchet, Trustability, operating principles) is unratified.
