# SFND1 — Foundations survey summary (internal, redacted, non-normative; not authority)

Scope: all 38 `docs/foundations/*.md` (9,362 lines). Assigned main bef03dd; working tree HEAD d03d8d1 — `git diff bef03dd d03d8d1 -- docs/foundations` is empty, so line numbers hold for both.
Resume: prior interrupted run left E001–E075 with partial line spans. This run re-read every file and appended E076–E134 (59 entries), then wrote 31 decisions and 443 heading-level coverage rows.
Depth: FULL on 37 files (8,900 lines across 427 segments). `training-mode-exploration.md` is PARTIAL: lines 1–130, 422–561 and 722–805 read; 131–421 and 562–721 headings only (156 PARTIAL lines, 307 INDEXED lines). `multi-actor-repeatability…` was read FULL.
QA: E001–E075 verbatims are partly markdown-normalized (bold, list numbers and line breaks stripped). E001 joins the list and E053 joins a code block. New entries are exact apart from outer bold markers, and each verbatim was machine-checked against its source.

## Top 10 findings
1. Header status is heterogeneous. Six files have no status or date line (policy-over-prediction, secondary-observation, operational-surface-design, closed-loop-engineering except its Aug 26 section, multi-actor has no date). Their standing comes from `principles.md` or routing (E085, E075; per-file status is in the coverage.tsv `note` column).
2. Ratified v1 foundations are stale against v2, with no amendments. The retooling charter defers auth ("No second user exists"), provider diversification and server-side portfolio context. v2 has UsersController, BearerAuthenticator, Tastytrade*, FidelityPositions and PortfolioCapitalController (E081, E015, E084).
3. Backend-authority conflict persists. INV-BOUND-01/NEG-03 and evidence-appliance open question 4 still put recommendations in the client. PRIN-ARCH-BACKEND-AUTHORITY (Oct 11) and GovernedDecisionController point the other way (E013, E014, E016).
4. Actor roles disagree across four ratified/active sources. Codex is Architect in three-actor and multi-actor. Kiro does architecture and reconciliation in idea-intake and TQC, and in the current-investigation steering. Codex "implements" in idea-intake:289 (E089, E040).
5. Stale numbers in UI and scheduler foundations: 496 symbols and 0.9 req/sec / 60 per min, against a 1,286 seed and 119 per trailing 60 s. Steering still says "18 invariants", but the catalog has 23 INV IDs (E127, E019, E017).
6. Shared Execution Contract is suspended (withdrawn claim, E124). The competence contract:19 and the engineering-methodology steering still call it "primary" (E009).
7. Options domain authority conflicts with older concepts. COO's "effective basis = strike - premium" and "×100" are deterministic inputs there, but the reference calls effective basis [HEURISTIC] and bans a universal 100-share model. Delta-as-probability is superseded (E099, E097, E095, E100).
8. The Fidelity balance section (Sept 19) postdates the reference's Sept 16 ratification. Its ratification is unrecorded and it is Fidelity-only, with no tastytrade equivalent in foundations (E098, D014, E033).
9. Purpose hierarchy is buried and unregistered. system-goal-hierarchy holds the five levels, "Risk is not failure…", the household-mission formulation and "Persist cheap, policy-neutral, irreconstructible facts…". None is in the principles register, and the file declares itself non-authorizing (E104–E108).
10. Seven candidate operating principles (July 16) remain unratified. regime-objective-function and strategy-expansion-governance nonetheless cite them as "governing principles" (E113, E115, E063).

## Top Principal statements (exact)
- `principal-personal-objectives-2026-10-14.md:7-12`: "More profit" / "Less risk" / "Eliminate the need to be Nostradamus" / "Learn about options" / "Build cool stuff" / "Smoother, more reliable trading experience". Line 14 says do not relabel these as LVT Goals.
  - Correction (E134): the list is at lines 7–12, not 9–14.
- `principal-rest-uri-design-review-intent-2026-10-18.md:5`: "The principal can detect design flaws in a rest api just by looking at the uri patterns."
- `holistic-domain-first-api-design-principle-2026-10-18.md:15`: "this is a decent step in the right direction. we're thinking holistically about the domain model, not myopically about some feature we're trying to implement in the moment. this is another principle that we need to persist. this the the right way to think about api design."
- `principal-decision-surface.md:9`: "Make the right thing to do the easy thing to do." This is the file's Purpose line and is not attributed to Principal speech there (E005).
- `backend-behavioral-invariants.md:548`, operator (inferred to be the Principal): "If the current implementation falls short of the documented architectural intent, the implementation is wrong — not the architecture." Also from the operator: "Make provider stewardship the invariant." (:416) and "This is the appliance's public contract." (:433).

## Decision candidates not in the ADR register (D-file)
- D001 objectives vs LVT
- D002 and D003 API principle and URI review
- D004 and D005 Decision Surface and the Oct 13 delegation
- D006 SEC suspension (authority class unrecorded)
- D007–D010 death-spiral, idea-intake, the docs/bugs SoR (replacing GitHub Issues) and the parking lot
- D011 TQC v1 and the baseline, with AcquisitionWorker analysis-only
- D012 and D013 competence contract and domain reference
- D014 Fidelity Deployable projection
- D015 and D016 credit-spread reopening and the exploratory admission test
- D017 Portfolio Capital V1
- D018 visual principles
- D019 fail-closed experiments
- D020 and D021 invariants and the charter
- D022 and D023 appliance and roadmap meta-state
- D024 multi-actor ("prefer isolated execution", superseded by the main-only steering)
- D025 SAR
- D026 Operating Forecast
- D027 Projected Call Surface
- D028 scheduler
- D029 CRS split
- D030 Java-targeted invariants
- D031 cash-flow regime

Authority class is left empty where the source does not record one (D006, D014, D026, D027, D029).

## Contradictions (beyond findings above)
- Progressive disclosure (visual principle 5/6) vs compression over concealment (operational-surface-design) (E047).
- Production includes appreciation (regime) vs Production separate from appreciation (portfolio-capital) (E037).
- The capital ladder has 8 quantities in the contract vs 6 in the reference (E029).
- multi-actor "Prefer isolated execution and GitHub convergence" vs the Principal Git Workflow steering (E069).
- Visual principle 11 depends on the branch `ui/deploy-expanded-row` under a no-routine-branch workflow (E125).
- The strategy admission test is "exploratory hypothesis" in its parent doc but "governs" per the accepted amendment (E101).

## Coverage gaps
- training-mode-exploration.md lines 131–421 and 562–721 are not read (curriculum, scenarios, simulation engine, control room, taxonomy).
- Not verified at runtime:
  - whether v2 endpoints behave as their class names suggest;
  - completion of the TQC baseline;
  - whether the AcquisitionWorker restriction is still active;
  - the current universe count;
  - market-metrics IV availability.

## Challenges to assumptions
- The survey brief's "9-14" line reference for the objectives is off by two (E134).
- Foundations name no Account entity (E072).
- "Decision" is overloaded (E073).
- Foundations treat Fidelity as the broker and handoff target, while v2 carries tastytrade (E033).
- system-goal-hierarchy carries the strongest Product-level purpose language but the weakest authority header. Recorded standing is "unknown" for E104–E107, which differs from the prior run's E057 "Principal-accepted".
