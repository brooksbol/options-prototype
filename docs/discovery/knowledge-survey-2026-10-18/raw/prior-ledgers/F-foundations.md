=== Context Gathering Summary ===
FOUND: The six Principal objectives verbatim and their explicit non-LVT status; LVT = Lean Value Tree with its ID convention and Goals/Bets; the Principal REST/URI and holistic API statements verbatim; the principles register (9 Architectural/build + 1 Epistemic ratified, Product family empty); the 7 candidate operating principles; all 23 INV IDs plus NEG-01..09 and operator-ratification quotes; Portfolio Capital V1 and its invariants; the options domain reference (capital ladder, M/E/P, specimens); strategy admission test plus amendment; the system goal hierarchy; market-priced-risk; KNOWN-FAILURE-MODES; WARNING FINAL findings; death-spiral, decision-surface and roadmap-meta-state key quotes; priority stack; coming-soon; AR1–AR10 titles; ADR-001..022 titles and statuses.
NOT FOUND: No "technically correct" / "worst kind of correct" hits in scope. Not read in full: ADR bodies, WARNING-active body, roadmap.md 200–314 (7th LVT goal unverified), options-domain-reference Part 4–5 tail, and most methodology foundations (multi-actor, idea-intake, training-mode, regime-objective-function, strategy-architecture-reconciliation, technology-quality docs).
====================================

=== CONTEXT GATHERING COMPLETE ===

ANSWER:
FAMILY "F" KNOWLEDGE SURVEY. HEAD bcbc291. Read-only. Line numbers are verified where I read the text; everything marked (inferred) is my interpretation.

== 1. COVERAGE LEDGER ==
FULL means the whole file was read. PARTIAL means headers plus key sections were read. HEADER-ONLY means only the status/date lines or block quotes were read.
- foundations/principal-personal-objectives-2026-10-14.md (16 lines): FULL
- foundations/principal-rest-uri-design-review-intent-2026-10-18.md (11): FULL
- foundations/holistic-domain-first-api-design-principle-2026-10-18.md (23): FULL
- foundations/epistemic-precision.md (70): FULL
- foundations/shared-execution-contract.md (41): FULL
- foundations/parking-lot-continuation-governance.md (22): FULL
- foundations/portfolio-capital.md (190): FULL
- foundations/market-priced-risk.md (195): FULL
- mandates/product-first-continuous-engineering-2026-10-13.md (26): FULL
- principles.md (103): FULL
- KNOWN-FAILURE-MODES.md (164): FULL
- roadmap-priority.md (35): FULL
- roadmap-coming-soon.md (63): FULL
- foundations/options-domain-reference.md (368): PARTIAL, lines 1–~255 (Parts 1–3, start of Part 4)
- foundations/principles-governance-model.md (386): PARTIAL, lines 1–190 plus all headers
- foundations/backend-behavioral-invariants.md (580): PARTIAL, all IDs and names, lines 400–460 and 478–553
- roadmap.md (314): PARTIAL, lines 1–~200
- foundations/system-goal-hierarchy.md (328): PARTIAL, headers, block quotes, lines 63–92
- foundations/strategy-expansion-governance.md (229): PARTIAL, lines 16–45, 101–123, headers
- foundations/strategy-expansion-governance-2026-08-29-amendment.md (105): PARTIAL, lines 7–32, headers, line 105
- foundations/principal-decision-surface.md (121): PARTIAL, headers and quotes
- foundations/death-spiral-avoidance-protocol.md (247): PARTIAL, headers and quotes
- WARNING-operating-model-reality-report-FINAL.md (573): PARTIAL, headers and quotes through about line 340
- WARNING-operating-model-reality-report-active.md (550): HEADER-ONLY
- architecture-roadmap.md (434): PARTIAL, AR1–AR10 headers and the 2026-09-24 reconciliation headers
- 07c-adrs.md (915): HEADER-ONLY, all 22 ADR titles and statuses
- foundations/three-actor-model.md (247): HEADER-ONLY plus quotes
- foundations/roadmap-self-documenting-meta-state.md (81): HEADER-ONLY plus quotes
- foundations/options-domain-competence-contract.md (268): HEADER-ONLY plus quotes
- foundations/evidence-appliance.md (222): HEADER-ONLY plus quotes
- foundations/closed-loop-engineering.md (418): HEADER-ONLY plus quotes
- foundations/conditioned-operating-opportunity.md (278): HEADER-ONLY plus quotes
- foundations/technology-quality-constitution-v1.md (368): HEADER-ONLY plus quotes
- HEADER-ONLY, status/date lines only:
  - acquisition-scheduler-policy (195)
  - architectural-evolution-methodology (211)
  - cognitive-role-separation (173)
  - idea-intake-reconciliation (324)
  - multi-actor-repeatability-temporal-synchronization (775)
  - operational-surface-design (151)
  - policy-over-prediction (240, one quote read at line 208)
  - recommendation-set-analysis (191)
  - regime-objective-function (226)
  - retooling-charter (134)
  - secondary-observation (141)
  - state-oriented-console (215)
  - step4-conformance-assessment (142)
  - strategy-architecture-reconciliation (436)
  - training-mode-exploration (805)
  - visual-design-principles (189)
  - technology-quality-baseline-charter-v1 (171)
  - technology-quality-fitness-controls-v1 (188)
  - technology-quality-program-v1 (482)
  - technology-quality-slo-build-test-v1 (74)

== 2. KNOWLEDGE ITEMS ==
Fields: ID | title | path:lines | verbatim | speaker | type | status | scope | related | subject area | Principal judgment?

F-001 | Six Principal personal objectives (not LVT) | foundations/principal-personal-objectives-2026-10-14.md:7-14 | [P] "1. More profit 2. Less risk 3. Eliminate the need to be Nostradamus 4. Learn about options 5. Build cool stuff 6. Smoother, more reliable trading experience" | Principal (exact wording supplied Oct 18) | PRINCIPAL-STATEMENT | accepted (persisted on explicit confirmation) | why the Principal trades and builds | Objective 3 is the personal root of policy-over-prediction (F-004), (inferred) | Principal purpose / motivation layer | N

F-002 | Objectives vs LVT separation | same file:3,14 | [D] "do not relabel the six personal objectives as LVT Goals" | Principal-confirmed doc | DECISION | accepted | planning, bootstrap | roadmap.md:11 | Purpose hierarchy | N

F-003 | LVT = Lean Value Tree | roadmap.md:11, 93-103, 105-122 | [D] "This is Wheelwright's current Lean Value Tree (LVT) roadmap." | Doc ratified 2026-08-31, 2026-09-09 | DOMAIN-DEFINITION | ratified | strategy | Vocabulary: Vision, Goal, Bet, Initiative, Experiment, Direction. IDs follow LVT-<TYPE>-* | Strategy model | N

F-004 | Policy over prediction | principles.md (PRIN-POLICY-OVER-PREDICTION); strategy-expansion-governance.md:18-20 | [D] "don't use prediction where policy would suffice" | Ratified | RATIFIED-PRINCIPLE | ratified | Wheelwright-wide | Conflicts in strength with the steering wording "architecturally inadmissible"; see section 6 | Decision epistemics | N

F-005 | Principles register: ratification rule | principles.md:30-36 | [D] "If an item appears in this register, Wheelwright considers it a ratified enduring principle." | Ratified register | METHODOLOGY | ratified | governance | Only explicit Principal ratification promotes a principle | Principle governance | N

F-006 | Product Principle classification test | principles.md:~19-23 | [D] "If this LVT disappeared tomorrow, would we still insist that this statement remain true of Wheelwright?" | Doc | METHODOLOGY | ratified (structure) | Product principles | No Product Principles are ratified yet (intentional) | Principle governance | Y: Product principles family is empty

F-007 | Principles are PASS/FAIL constraints | principles.md:~96 | [D] "applicable ratified principles are PASS/FAIL constraints, not inspirational prose" | Doc | METHODOLOGY | ratified | design/review | Chain: WHY → WHAT MUST BE TRUE → HOW SATISFIED → HOW ATTACKED | Principle governance | N

F-008 | Holistic domain-first API design | holistic-domain-first-api-design-principle-2026-10-18.md:9,15 | [P] "we're thinking holistically about the domain model, not myopically about some feature we're trying to implement in the moment. this is another principle that we need to persist." | Principal | RATIFIED-PRINCIPLE (PRIN-ARCH-HOLISTIC-DOMAIN-API) | ratified 2026-10-18 | public API v2+ | F-009, Doc 77, Doc 82 | API / domain facade design | N

F-009 | URI-pattern review intent | principal-rest-uri-design-review-intent-2026-10-18.md:5-7 | [P] "The principal can detect design flaws in a rest api just by looking at the uri patterns." | Principal | PRINCIPAL-STATEMENT | review intent only; explicitly not a rule | API review method | Corrected an actor review that had focused on bugs: inspect URI topology first, implementation defects after | API design review | N

F-010 | Backend authority and presentation independence | principles.md (PRIN-ARCH-BACKEND-AUTHORITY) | [D] "Equivalent evidence and governance must yield equivalent domain conclusions across interfaces." | Principal-ratified Oct 11, 2026 | RATIFIED-PRINCIPLE | ratified | Wheelwright-wide | Conflicts with NEG-03 (F-021) and with steering "backend must NOT produce recommendations" | Authority / topology | Y: NEG-03 contradicts ratified principle

F-011 | Architectural principle cluster | principles.md (8 PRIN-ARCH entries) | n/a | Ratified (retooling-charter source) | RATIFIED-PRINCIPLE | ratified | backend | Entries: evidence appliance; persist facts, derive trust; failed refresh preserves; session awareness; deterministic recommendation; single acquisition authority; version-controlled definition | Evidence appliance core | N

F-012 | Epistemic precision | epistemic-precision.md:11-13, 38-46 | [D] "Numerical precision must be commensurate with evidence quality." | Governing, ratified as PRIN-EPI-PRECISION | RATIFIED-PRINCIPLE | ratified | all derived outputs | Precision scale: historical production to the penny; month-to-date to the dollar; forecast to about $1K. Echoed in roadmap-coming-soon rule 5 | Epistemics / presentation | N

F-013 | False precision is implied prediction | epistemic-precision.md:52-54 | [D] "False precision is a form of implied prediction." | Doc | RATIFIED-PRINCIPLE (corollary) | ratified | outputs | F-004, ADR-013 | Epistemics | N

F-014 | Seven candidate operating principles | principles-governance-model.md:111-189 | [D] Preserve Optionality; Respect Uncertainty; Execute with Discipline; Earn Proportional Compensation; Avoid Concentration; Observe Before Acting; Sustain Institutional Behavior | Doc (July 16, 2026) | CANDIDATE-PRINCIPLE | candidate ("initial hypotheses") | capital under uncertainty | principles.md excluded list confirms they are not ratified | Operating philosophy | Y: candidates awaiting ratification since July

F-015 | Principle as domain model, not documentation | principles-governance-model.md:8-50 | [D] "Principles are not documentation. They are the top layer of the domain model." | Doc | REJECTED-DESIGN + DECISION | adopted. Rejected design: the principle as a code comment, because the system cannot trace, explain or measure against it | explainability | Chain: Principles→Policies→Evidence→Recommendations→Execution→Learning→Refinement | Explanation engine | N

F-016 | Sustain Institutional Behavior | principles-governance-model.md:176-189 | [D] "The system reduces cognitive load, not agency." | Doc | CANDIDATE-PRINCIPLE | candidate | HITL | Judge a principle over the full operating horizon, not on the last trade | Operating philosophy | Y: candidate

F-017 | Backend invariant catalog | backend-behavioral-invariants.md:42-456 | IDs: INV-LIFE-01/02; INV-ACQ-01/02; INV-SESS-01/02/03; INV-PERSIST-01..04; INV-PUB-01..05; INV-PROV-01..04; INV-UNIV-01/02; INV-BOUND-01 | Operator-ratified | ARCH-INVARIANT | ratified | backend | 23 IDs listed. Steering says "18 ratified" (count drift) | Evidence appliance invariants | N

F-018 | Sealed evidence validity, and implementation is wrong rather than architecture | backend-behavioral-invariants.md:442-456, 550-553 | [P] "If the current implementation falls short of the documented architectural intent, the implementation is wrong — not the architecture." | Operator (= Principal, inferred) | ARCH-INVARIANT + PRINCIPAL-STATEMENT | ratified | session/validity | INV-SESS-03 | Session semantics / authority of architecture | N

F-019 | Provider stewardship | backend-behavioral-invariants.md:408-422 | [P] "Make provider stewardship the invariant." | Operator | ARCH-INVARIANT | ratified (narrowed from INV-ACQ-C01) | provider | TTLs are explicitly policy, not invariant | Provider boundary | N

F-020 | Versioned published contract | backend-behavioral-invariants.md:425-439 | [P] "This is the appliance's public contract." | Operator | ARCH-INVARIANT (INV-PUB-05) | ratified | snapshot/API | evidence-snapshot-v1 frozen | Contracts | N

F-021 | Prohibited behaviors NEG-01..09 | backend-behavioral-invariants.md:484-492 | [D] "NEG-03 Recommendation computation occurs in the backend" | Doc | ARCH-INVARIANT (negative) | ratified originally; NEG-03 likely superseded by F-010 (inferred) | backend | F-010 | Authority topology | Y: NEG-03 vs Oct-11 principle

F-022 | Portfolio Capital definition and V1 derivation | portfolio-capital.md:9-27 | [D] "Portfolio Capital = Fidelity Total Account Value − aggregate short-option MTM" | Ratified Aug 20, 2026 (empirically verified) | DOMAIN-DEFINITION | ratified, V1 | capital accounting | Fidelity-based; current broker workflow is tastytrade (data/tastytrade), so possibly stale | Capital semantics | Y: Fidelity-specific formula, tastytrade now

F-023 | Capital accounting invariants | portfolio-capital.md:~85-95 | [D] "Premium is recognized once." | Ratified | ARCH-INVARIANT (domain) | ratified | capital | Others: state-transition stability; appreciation and erosion separately observable; assignment does not double-count | Capital semantics | N

F-024 | Portfolio Capital is not NAV, Deployable or Encumbered | portfolio-capital.md:~130-145; KNOWN-FAILURE-MODES.md:11 | [D] "Do not assume Console Capital or Current value is Account NAV." | Doc / KFM | REPEATED-CONFUSION | ratified | capital | F-027 | Capital semantics | N

F-025 | Denominator discipline | portfolio-capital.md:~150-160 | [D] "Portfolio Capital must NOT automatically become the denominator for every percentage" | Doc | DOMAIN-DEFINITION | ratified | metrics | n/a | Production / metrics | N

F-026 | Mechanics, Evidence and Policy kept distinct | options-domain-reference.md §8 (~138-146) | [D] "Mechanics must not be invented to satisfy policy. Policy must not be inferred from mechanics." | Principal-ratified ref (Cat E) | RATIFIED-PRINCIPLE (domain) | ratified ref; correctness not established by ratification | options reasoning | Also in the competence contract | Options domain reasoning | N

F-027 | Capital ladder (six distinct quantities) | options-domain-reference.md §7 (~118-135) | [D] "retiring an obligation removes that obligation's attributable encumbrance — nothing more." | Ratified ref | DOMAIN-DEFINITION | ratified | capital/broker | Six quantities: notional, collateral, margin, buying power, settled cash, deployable. Linked to BUG-023, F-022 | Capital semantics | N

F-028 | Complete-position rule | options-domain-reference.md §1, §9 | [D] "Never infer economic meaning from an isolated leg." | Ratified ref | DOMAIN-DEFINITION | ratified | options | Competence contract | Options domain | N

F-029 | Three separate axes: domain understanding, implementation, support decision | options-domain-reference.md:~45; competence-contract:175 | [D] "absence of implementation does not establish rejection" | Ratified | METHODOLOGY | ratified | domain/backlog | Steering "Existing Capability Before New Machinery" | Knowledge-state hygiene | N

F-030 | Semantic specimens 1–8 | options-domain-reference.md Part 3 (~200-250) | [D] Specimen 1: "Same action verb, categorically different residual" | Ratified ref | METHODOLOGY (test vectors) | ratified | design review | Topics: BTC of CSP vs CC; assignment direction; synthetic similarity; pin risk; dividend early assignment; roll; adjusted deliverable; short put ≠ CSP | Options domain test vectors | N

F-031 | BUG-021 accounting lesson | options-domain-reference.md §2.3 accounting box | [D] "a BTC debit mis-booked as a generic asset purchase" | Doc | LESSON-FROM-FAILURE | accepted | accounting | WARNING FINAL (BUG-021 was the specimen) | Capital accounting | N

F-032 | Claim class tags | options-domain-reference.md:33-43 | [D] tags: [MECH] [BROKER] [THEORY] [EMPIRICAL] [HEURISTIC] [WW-POLICY] [WW-INTENT] [UNRESOLVED] | Ratified | METHODOLOGY | ratified | domain claims | n/a | Epistemics of domain claims | N

F-033 | Strategy admission test | strategy-expansion-governance.md:16-45 | [D] "A strategy should earn admission by serving governed portfolio/capital transformations" | Doc | DECISION | accepted | strategy | Criteria: enumerable resolution states, bounded/collateralized capital, lifecycle governability | Strategy governance | N

F-034 | Credit spreads and others excluded as prediction-dependent | strategy-expansion-governance.md:101-123 | [D] "Credit spreads … Profitability depends on predicting a price range." | Doc | REJECTED-DESIGN (reason: prediction dependence, unbounded risk, P&L-optimization identity) | partially superseded by F-035 | strategy | Iron condors, butterflies, naked shorts, diagonals still excluded | Strategy governance | Y: conflicts with roadmap repertoire

F-035 | Credit-spread exclusion premise corrected | strategy-expansion-governance-2026-08-29-amendment.md:7-32,105 | [D] "Credit spreads are reopened for analysis, not admitted for operation." | Doc (Aug 29) | FINDING-THAT-CHANGED-ASSUMPTION | accepted correction | vertical spreads | "favorable payoff region does not by itself prove … prediction" | Strategy governance | N

F-036 | Repertoire model, 1×2 ratio spread as canonical specimen | roadmap.md:~39-60 | [D] "Wheelwright selects the opportunity; the brokerage shapes and executes the trade." | Ratified roadmap (Cat C) | PRODUCT-REQUIREMENT | accepted | Trade Finder | Conflicts with F-034. A 1×2 ratio has an uncovered short leg (inferred mechanics) and parent governance excludes naked shorts; iron condor is named as a "familiar structure" | Product boundary / strategy | Y: ratio spread vs admission test

F-037 | Golf/caddie analogy | roadmap.md:~62-90 | [D] "Wheelwright is the caddie and course book. The brokerage is where the trader addresses the ball. The trader remains the golfer." | Doc | PRODUCT-REQUIREMENT (boundary) / teaching model | accepted | product identity | Broker Handoff ADR-004 | Product identity | N

F-038 | Question-driven design north star | roadmap.md:~21-33 | [D] "The system becomes more capable as the operator's important unanswered-question list gets shorter." | Roadmap | PRODUCT-REQUIREMENT | accepted | CLI `ww run <question>` | Acceptance: "correctly, reproducibly, and quickly" | Product north star | N

F-039 | Explore freely, reconcile before committing | roadmap.md:~17-19 | [D] "Explore freely; reconcile before committing. Govern commitment, not curiosity." | Roadmap | METHODOLOGY | ratified | strategy | idea-intake-reconciliation | Idea governance | N

F-040 | LVT Goals and Bets | roadmap.md:128-200 | [D] e.g. LVT-BET-ACCEPTABILITY "reduces deployment into the best bad opportunity" | Ratified | PRODUCT-REQUIREMENT (Bets are hypotheses) | ratified tree; Bets are hypothesis by definition | product | Goals read: AWARENESS, CHOICES, CONSEQUENCES, OUTCOMES. CONTINUITY and ACCESS are referenced in roadmap-priority. The 7th goal is not verified (lines 200–314 unread) | Strategy model | N

F-041 | Provisional priority stack and its logic | roadmap-priority.md:20-35 | [D] "make the evidence trustworthy → make capital state trustworthy → make outcomes trustworthy → learn … → … accessible anywhere" | Ratified 2026-09-20 (Principal + Kiro) | DECISION | ratified, provisional | sequencing | Priority must never be inferred from order or heuristics | Sequencing | N

F-042 | Coming-soon contract | roadmap-coming-soon.md:9-13 | [D] "Authority determines whether a capability is supportable. The Principal determines its horizon." | Doc | METHODOLOGY | ratified | horizons | Now: position reassessment; genuine WAIT. Next: broader structures. Later: always-on; mobile | Product horizon | N

F-043 | System goal hierarchy, five levels | system-goal-hierarchy.md:19-150 | [D] "A lower-level optimization is valuable only insofar as it improves the goal of the level above it." | Foundational orientation (non-authorizing) | METHODOLOGY | accepted, non-authorizing | whole system | Levels: machinery → widget supply → deal quality → productive capital → household mission. Herbie/TOC investigation sits at level 1 | Purpose hierarchy | N

F-044 | Risk is not failure | system-goal-hierarchy.md:69 | [D] "Risk is not failure. Uncompensated or misunderstood risk is failure." | Doc | CANDIDATE-PRINCIPLE (inferred; not in register) | accepted as orientation | deal quality | LVT-BET-COMPENSATION, F-014 Earn Proportional Compensation | Decision quality | Y: principle-strength, not registered

F-045 | Household mission | system-goal-hierarchy.md:142-150 | [D] "productive-capital system capable of sustainably supporting required household cash flow" | Doc | PRODUCT-REQUIREMENT | accepted orientation | mission | Bridge Income | Purpose hierarchy | N

F-046 | Persist irreconstructible facts | system-goal-hierarchy.md:248-254 | [D] "Persist cheap, policy-neutral, irreconstructible facts; derive changing interpretations from them later." | Doc | CANDIDATE-PRINCIPLE (extends persist facts / derive trust) | accepted orientation | evidence retention | PRIN-ARCH-PERSIST-FACTS | Evidence/learning substrate | Y: extends ratified principle informally

F-047 | Goldratt vs Senge balance | system-goal-hierarchy.md:234 | [D] "Senge prevents Wheelwright from optimizing a system whose underlying mental model is wrong. Goldratt prevents … endlessly improving its mental model without improving the system." | Doc | METHODOLOGY | accepted | engineering | Doc 39/40 | Learning methodology | N

F-048 | Market-priced risk research | market-priced-risk.md:9-14, 41 | [D] "In the absence of evidence, all that remains are agendas." | Doc (July 2026) | UNRESOLVED-QUESTION (research) | hypothesis | Brief explanation | Explicitly avoids composite risk scores | Evidence/explanation | N

F-049 | Declarative rules lack transition controls | WARNING-…-FINAL.md:25-29, 104 | [D] "Wheelwright appears to have adequate declarative constraints but inadequate transition controls." | Doc (field test terminated by Principal) | FINDING-THAT-CHANGED-ASSUMPTION | accepted, warning active | operating model | KFM meta-failure, F-051 | Multi-actor operating model | N

F-050 | Death spiral as emergent compensation | WARNING-…-FINAL.md:112-122, 185 | [D] "The death spiral is an emergent property of competent actors compensating for one another after a failed transition." | Doc | LESSON-FROM-FAILURE | accepted | multi-actor | death-spiral-avoidance-protocol:17,21 | Operating model | N

F-051 | Shared Execution Contract suspended | shared-execution-contract.md:1-5, ~28-30 | [D] withdrawn claim: "probabilistic actors can reliably enforce consequential transition authority merely by reading, remembering, reciting, and following this contract" | Doc | DECISION (supersession) | runtime control suspended | execution control | Conflicts with steering "primary execution contract" | Operating model | Y: steering contradicts suspension

F-052 | Models reason; deterministic mechanisms control | KNOWN-FAILURE-MODES.md:~147-153 | [D] "Models reason. Durable state remembers. Deterministic mechanisms control consequential transitions. The Principal decides meaning." | Doc | RATIFIED? Unclear; checksum (does not create authority) | accepted | operating model | DSA:236 parallel wording | Operating model | N

F-053 | 14 known failure modes | KNOWN-FAILURE-MODES.md:15-140 | [D] e.g. "Do not patch the falsifier when the model is wrong"; "Do not make the Principal the human 'continue' button" | Doc | LESSON-FROM-FAILURE | accepted | all actors | three-actor-model:120 | Operating model | N

F-054 | Oct 12 recurrence: Product precedent ignored | KNOWN-FAILURE-MODES.md:7-11 | [D] "Position CLI passed technical reviews but failed Principal usability acceptance" | Doc | LESSON-FROM-FAILURE | accepted | operator surfaces | mandate regression specimen `ww show positions` | Product acceptance | N

F-055 | Product-first proof-carrying work | mandates/…2026-10-13.md:6-26 | [D] "A review rejection invalidates the candidate, not the Product goal."; "RECOVER → REUSE → COMPOSE → EXTEND → INVENT" | Principal mandate (paraphrased record) | PRINCIPAL-STATEMENT (paraphrase) | accepted; explicitly not enforcement | engineering | WW-GATE-001 staged; mandate also says "A staged gate is not active enforcement" | Engineering methodology | N

F-056 | Reasoning vs authority | principal-decision-surface.md:19 | [D] "What should be done? is reasoning. May it be done now? is authority state." | Ratified Sept 17 | RATIFIED-PRINCIPLE (methodology) | ratified | actors | Oct 13 delegation reconciliation at :33 | Operating model | N

F-057 | No repeated traversal without new state | death-spiral-avoidance-protocol.md:17,21,51 | [D] "When repeated evidence falsifies work at the current abstraction layer, move up one layer before attempting implementation again." | Ratified Sept 27 | METHODOLOGY | ratified | workflow | F-050, KFM #3, #13 | Operating model | N

F-058 | Roadmap as self-documenting meta-state | roadmap-self-documenting-meta-state.md:11,23,31,65 | [D] "Roadmap freshness is a side effect of doing Wheelwright work correctly." | Ratified (Cat A) | ARCH-INVARIANT (meta) | ratified | project state | ADR-018, KFM #12 | Project self-knowledge | N

F-059 | Principal is decision authority, not scheduler | three-actor-model.md:108,120 | [D] "The Principal is the decision authority, not the workflow scheduler or human continue button." | Doc | METHODOLOGY | active | actors | KFM #14 | Operating model | N

F-060 | One logical parking lot | parking-lot-continuation-governance.md:10-20 | [D] "File boundaries have no semantic meaning." | Ratified | METHODOLOGY | ratified | backlog | steering duplicate | Project memory | N

F-061 | Architectural pressures AR1–AR10 | architecture-roadmap.md:45-201 | n/a (titles only) | Ratified 2026-08-31 | DECISION / pressure | ratified as pressure | architecture | AR5 "Separate Eligibility, Acceptability, and Comparative Fitness" pairs with LVT-BET-ACCEPTABILITY; AR6/AR8 partly resolved 2026-09-24 | Architecture evolution | N

F-062 | ADR register | 07c-adrs.md:3-915 | [D] "Authoritative through September 26, 2026" | Accepted ADRs | DECISION | accepted. ADR-007 is provisional; ADR-022 was Principal-ratified Sept 28 | various | Titles read; ADR bodies NOT read. ADR-023/024 are referenced elsewhere but are not in this register | Decisions | Y: register frozen at Sept 26

F-063 | Experimental surfaces fail closed | closed-loop-engineering.md:391 | [D] "Experimental surfaces must fail closed relative to core operator workflows." | Doc | ARCH-INVARIANT (candidate) | unknown | UI/experiments | n/a | Safety | N

F-064 | Represent the environment, not the machinery | evidence-appliance.md:51 | [D] "Represent the environment, not the machinery." | Ratified foundation | RATIFIED-PRINCIPLE (inferred; not in register by this name) | ratified doc | surfaces | Echoes F-009 (no workflow/provider leakage in URIs) | Surface design | N

== 3. BURIED KNOWLEDGE ==
These high-value items sit outside the normal entry points (07-architecture-current, the steering rules):
1. system-goal-hierarchy.md:19, 69, 142-150, 234, 248. This holds the five-level purpose stack: household mission, "Risk is not failure…", and "Persist … irreconstructible facts". None of it is in the principles register or the steering rules.
2. portfolio-capital.md:19-27, 85-95, 150-160. Portfolio Capital semantics and the premium-once invariant are Fidelity-specific, while the active broker is tastytrade.
3. options-domain-reference.md §7 capital ladder, §8 Mechanics/Evidence/Policy, Part 3 specimens 1–8. This is the economic test-vector set.
4. roadmap.md:~21-90. The question-driven north star (`ww run <question>`), the "selects the opportunity / brokerage shapes" boundary, and the golf/caddie model. None of this is in the steering identity rule.
5. backend-behavioral-invariants.md:550-553. The operator ruling that the architecture outranks a deficient implementation.
6. strategy-expansion-governance-2026-08-29-amendment.md:21, 105. The consequence-governance reframing that reopens credit spreads.
7. principles.md:~19-23, 96. The Product Principle test ("If this LVT disappeared tomorrow…") and principles as PASS/FAIL. The Product family is empty.
8. principal-personal-objectives-2026-10-14.md:7-14. The six objectives, especially "Eliminate the need to be Nostradamus", which is the Principal's personal root for policy-over-prediction. Referenced nowhere in the steering rules.

Honorable mention: market-priced-risk.md (the yield-decomposition research question) and KNOWN-FAILURE-MODES.md:7-11 (the Oct-12 usability failure).

== 4. VERBATIM PRINCIPAL STATEMENTS ==
1. "More profit" / "Less risk" / "Eliminate the need to be Nostradamus" / "Learn about options" / "Build cool stuff" / "Smoother, more reliable trading experience". Location: principal-personal-objectives-2026-10-14.md:9-14. Dated Oct 14 (items 1–5) and later the same conversation (item 6); restated Oct 18, 2026. Labeled "Exact wording supplied by the Principal".
   - Relation to LVT: the file explicitly says these are not the LVT, not the seven Product Goals, and not a roadmap. They are the "why" one level above the LVT and must not be relabeled LVT Goals.
2. "The principal can detect design flaws in a rest api just by looking at the uri patterns." Location: principal-rest-uri-design-review-intent-2026-10-18.md:5. Oct 18, 2026. Labeled verbatim. Also repeated at holistic…:17.
3. "this is a decent step in the right direction. we're thinking holistically about the domain model, not myopically about some feature we're trying to implement in the moment. this is another principle that we need to persist. this the the right way to think about api design." Location: holistic-domain-first-api-design-principle-2026-10-18.md:15. Oct 18, 2026. Labeled verbatim; the typo "this the the" is preserved.
4. "Make provider stewardship the invariant." Location: backend-behavioral-invariants.md:~418. Undated (July 2026, inferred). Labeled "Operator ratification". That operator = Principal is inferred.
5. "This is the appliance's public contract." Location: backend-behavioral-invariants.md:~435. Same labeling.
6. "The Constitution says it should. If the current implementation falls short of the documented architectural intent, the implementation is wrong — not the architecture." Location: backend-behavioral-invariants.md:~452 and 552. Labeled operator ratification/guidance.

Paraphrases only, not verbatim:
- The Oct 13 mandate text: "Principal direction … PL-CONV-01".
- The WARNING FINAL termination rationale (:7).
- The Oct 13 delegation reconciliation in principal-decision-surface.md:33.
- roadmap-coming-soon "move cloud to Now". This is an illustrative example, not a recorded statement.

"technically correct" / "worst kind of correct": a case-insensitive grep across every in-scope file found NO hits.

== 5. NATURAL CLUSTERS ==
- Purpose hierarchy: F-001, F-002, F-003, F-040, F-043, F-045, F-041
- Evidence appliance and backend invariants: F-011, F-017, F-018, F-019, F-020, F-021, F-046, F-064
- Epistemics and honesty of output: F-004, F-012, F-013, F-029, F-032, F-048
- Capital and accounting semantics: F-022, F-023, F-024, F-025, F-027, F-031
- Options domain economics: F-026, F-028, F-030, F-032
- Strategy and repertoire governance: F-033, F-034, F-035, F-036, F-037
- Product boundary and north star: F-036, F-037, F-038, F-042, F-054
- Principle governance: F-005, F-006, F-007, F-014, F-015, F-016, F-044
- API / domain facade: F-008, F-009, F-010, F-064
- Multi-actor operating model: F-049, F-050, F-051, F-052, F-053, F-055, F-056, F-057, F-059
- Project self-knowledge and memory: F-058, F-060, F-039, F-041, F-042, F-062

Concepts that span clusters:
- "Policy over prediction" spans Purpose (Nostradamus objective), Strategy admission, Epistemics (false precision as implied prediction) and Product boundary.
- "Authority before consumers / backend authority" spans API, Evidence and Capital.
- "Acceptability before fitness / genuine WAIT" spans LVT-BET-ACCEPTABILITY, AR5, coming-soon Now and the candidate Respect Uncertainty.
- "Escalate abstraction, not patches" spans the operating model and the options specimens ("patch the falsifier").

== 6. DUPLICATION / CONTRADICTION ==
1. NEG-03 vs PRIN-ARCH-BACKEND-AUTHORITY.
   - NEG-03 (backend-behavioral-invariants.md:486) prohibits recommendation computation in the backend.
   - The architecture steering rule also says the backend must NOT produce recommendations.
   - The Oct 11 ratified principle puts decision logic in the backend.
   - This is a direct contradiction. No supersession note was seen in the lines I read.
2. Shared Execution Contract. The steering rule calls it the "primary execution contract", but the file itself says SUSPENDED as runtime control (shared-execution-contract.md:1-5).
3. Strategy scope, in three places:
   - Parent strategy-expansion-governance:101-123 excludes credit spreads, iron condors and naked shorts as prediction-dependent.
   - The amendment reopens vertical credit spreads for analysis only.
   - roadmap.md names the 1×2 ratio spread as a canonical design specimen and iron condor as a familiar structure.
   - The ratio-spread vs naked/unbounded exclusion is unreconciled (inferred mechanics).
4. Strength of policy over prediction:
   - Steering identity says "predicting which will occur is architecturally inadmissible".
   - strategy-expansion-governance quotes the governing principle as "don't use prediction where policy would suffice".
   - policy-over-prediction.md:208 and epistemic-precision admit an "operating forecast".
   - This is a nuance gap: absolute vs. qualified.
5. Invariant count. Steering says "18 ratified invariants"; the catalog has 23 INV IDs (20 + 3 resolved candidates) plus NEG-01..09.
6. Portfolio Capital formula is Fidelity-based, and the active broker evidence is tastytrade. KFM warns against equating Console Capital with NAV. These are consistent in concept, but the derivation may be stale (unverified).
7. Operating-model aphorisms are duplicated with small differences:
   - KNOWN-FAILURE-MODES ~147-153: "Models reason. Durable state remembers…"
   - death-spiral-avoidance-protocol:236: "Death Spiral Avoidance controls workflow topology. Authority controls permission…"
   - three-actor-model:120 and KFM #14: "not the human continue button"
   - mandate, KFM #3/#13, DSA:21: repeated falsifiers mean model review, not patches
8. Persist facts / derive trust is stated three ways: PRIN-ARCH-PERSIST-FACTS-DERIVE-TRUST, INV-PERSIST-04 "Facts persisted, trust derived", and system-goal-hierarchy:248, which adds "policy-neutral, irreconstructible" and a learning purpose.
9. Precision discipline appears in epistemic-precision and roadmap-coming-soon rule 5 ("No false precision"). Consistent.
10. Parking-lot continuation is stated in parking-lot-continuation-governance.md and the steering rule. Consistent duplicates.
11. Principles-governance-model is labeled "Governing architectural foundation" (Category A, per principles.md), while its seven operating principles stay candidates. This is not a contradiction, but readers often conflate the two.
12. ADR register: "Authoritative through September 26, 2026". ADR-023/024 are cited elsewhere (roadmap-priority #9) but are not in 07c. Inferred: the register is lagging.

Verification notes: ADR bodies, most of the WARNING-active report, roadmap.md lines 200–314, options-domain-reference lines 256–368, and most methodology foundations were not read in full. Claims about them are limited to titles, status lines and the quoted block lines.

RELEVANT FILES (ranked by importance):
  1. docs/principles.md — Canonical register of ratified principles, Product Principle test, candidate exclusions
  2. docs/foundations/principal-personal-objectives-2026-10-14.md — Six verbatim Principal objectives and explicit separation from LVT
  3. docs/roadmap.md — LVT definition, north star, Trade Finder boundary, repertoire/golf model, LVT tree
  4. docs/foundations/backend-behavioral-invariants.md — All INV/NEG IDs and operator-ratification quotes, including the NEG-03 conflict
  5. docs/foundations/system-goal-hierarchy.md — Buried five-level purpose hierarchy and candidate principle-strength statements

NOTE: Line ranges have been extended by ~50 lines to provide additional surrounding context.