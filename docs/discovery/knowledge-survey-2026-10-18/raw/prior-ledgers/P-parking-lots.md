=== Context Gathering Summary ===
FOUND: Line counts, date ranges and PL heading/table IDs for all 10 parking-lot files. Full reads of the base active tables (lines 1–~100), the closed index, PL-CONV-01 checkpoints (ratification, sequence, overlay, principle promotion, CONV-WEB), PL-ACTOR-01, PL-DEPLOY-BAL, PL-SEM-01 v1.4, the PL-DEC-BEH Inner Game refinement, PL-CLI-01 Oct 12/17 guidance, PL-API-02/03 status, PL-DEC-RES-01, PL-SETUP-01, PL-BETA-01, PL-STRAT-01 Test 1, PL-OPS-09, PL-ELIG and PL-RECIPE-01 headers. Canonical-doc cross-check by phrase grep for about 30 knowledge items.
NOT FOUND: I did not fully read files -3 through -7 or the PL-CLI-01 Oct 3–5 and Oct 15 detail. I did not check docs/contracts, the why-state docs (56, 58, 61, 62, 67, 71, 76), ADR text in 07c-adrs.md, or the journals for canonical duplicates of the NOT FOUND items. The later state of PL-ACTOR-01 is unknown. The PL-SETUP-01 Sep 27–28 continuations and the -8:277 SLO intake ID were not inspected.
====================================

=== CONTEXT GATHERING COMPLETE ===

ANSWER:
Read-only survey at HEAD bcbc291. I indexed headings and IDs in all 10 parking-lot files and searched them for high-signal terms. I fully read only the strongest spans (listed per file). "Canonical?" means I grepped a distinctive phrase in docs/foundations/*, principles.md, 07c-adrs.md, 07-architecture-current.md, 77-*.md, roadmap.md, architecture-roadmap.md and KNOWN-FAILURE-MODES.md. I did not grep docs/contracts, the numbered why-state docs (56/58/61/67/77+) except 77, or the journals, so NOT FOUND means "not in that canonical set", not "absent from the repo". [V] = verified by reading; [I] = inferred.

## 1. COVERAGE LEDGER
| File | Lines | Dates | PL IDs defined here | Read |
|---|---|---|---|---|
| parking-lot.md | 231 | Jul–Aug 29 2026 header; rows amended in place up to Oct 14 | 42 active + 17 closed/merged rows (list in §2) | PARTIAL: lines 1–~100 full, plus families/closed index/history |
| parking-lot-2.md | 40 | Aug 29 | 1: PL-EVID-MVPTA | INDEXED |
| parking-lot-3.md | 509 | Sep 1–4 | 6: PL-EVID-AGE, PL-POSTURE-01, PL-SURF-01, PL-SCHED-DRIFT, PL-DEPLOY-02-DEF01, PL-PROV-FAILOVER. Also holds the PL-CLEANUP/PL-SHELL final records (lines 345–509) | INDEXED + spans |
| parking-lot-4.md | 191 | Sep 6 | 2: PL-ARCH-FITNESS-01, PL-PROD-EXPORT-01 | INDEXED |
| parking-lot-5.md | 422 | Sep 7 | 0 new; 3 PL-STRAT-01 refinements (HBWB, comparative surface, Operator Strategy Policy) | INDEXED |
| parking-lot-6.md | 307 | Sep 7 | 0 new; PL-STRAT-01 Fidelity tier refinement; 2 PL-DEPLOY refinements | INDEXED |
| parking-lot-7.md | 217 | Sep 8–9 | 1: PL-OPS-08; plus a PL-DEPLOY share-release refinement | INDEXED |
| parking-lot-8.md | 1043 | Sep 9–17 | 4: PL-OPS-09, PL-MKT, PL-DEPLOY-EXPORT, PL-RECIPE-01. Also an unlabelled Java test-suite SLO intake at :277 with no PL ID found [I], and refinements to PL-OPS-01, PL-DEPLOY and PL-ELIG V1 | PARTIAL |
| parking-lot-9.md | 1626 | Sep 17–24 | 10: PL-ACTOR-01, PL-DEPLOY-BAL, PL-PORT-01-UPLOAD-ALL, PL-PORT-01-CAPGRAPH, PL-ROADMAP-UI, PL-ARCH-07, PL-BROKER-CAP, PL-SEM-01, PL-EVID-OBS, PL-RESEARCH-05; plus PL-PORT-01 and PL-DEC-BEH refinements | PARTIAL |
| parking-lot-10.md | 1724 | Sep 24–Oct 17 | 9: PL-BETA-01, PL-OPS-CSV-01, PL-SETUP-01, PL-DEC-RES-01, PL-CLI-01, PL-OPS-10, PL-API-02, PL-API-03, PL-CONV-01; plus PL-STRAT-01 Test 1 and PL-EVID-04 EVA-001 refinements | PARTIAL |

Total is about 6,310 lines and about 93 distinct IDs.

## 2. PL REGISTRY SNAPSHOT
Format: ID — file:line — status — latest note.

### Defined in parking-lot.md
- PL-ARCH-06 — :24 — Principal decision unresolved — Aug 26 RCA exonerated the browser engine. Effectively answered by PRIN-ARCH-BACKEND-AUTHORITY (Oct 11) but the row was never updated.
- PL-GOV-EXPR — :25 — Unresolved — resolve when operator need is observed.
- PL-SHELL — :31 — RESOLVED/RATIFIED 2026-09-04 (edcbfb2).
- PL-DEPLOY — :32 — Active concept home — refinements in files -6, -7, -8, -9.
- PL-DEC-BEH — :33 — Accepted direction / exploration — Sep 24 Inner Game refinement (-9:1436).
- PL-CLEANUP — :34 — COMPLETE 2026-09-04 (51ee08f).
- PL-GOV-02 — :35 — Active (workflow delta) — 7-symbol cohort admitted Sep 14 (179d29d); BUG-018 split out.
- PL-UX-01 — :41 — Implementation work — Aug 29 "Do I need to do anything now?"
- PL-UX-04 — :42 — Implementation work.
- PL-ELIG — :43 — V1 implemented Sep 14 (a129fe1); visual acceptance pending.
- PL-EVID-03 — :44 — Implementation work.
- PL-PORT-01 — :45 — Active — Sep 21 account-locality invariant ratified; refinements in -9.
- PL-PORT-02 — :46 — Active/deferred findings.
- PL-EXEC-01 — :47 — Active — Sep 2 broker-modularity requirement.
- PL-GOV-01 — :48 — Correctness defect, open.
- PL-POL-04 — :49 — Active.
- PL-OPS-06 — :50 — Listed active, but PL-CLEANUP says it absorbed this item (contradiction, see §8).
- PL-PROD-EVENTS — :51 — V1 committed; V2 design pending.
- PL-EVID-07 — :57 — Resolved Aug 21.
- PL-PROD-MISSION — :58 — Implemented (ce849bb).
- PL-PROD-NET — :59 — Resolved.
- PL-PROD-FORECAST — :60 — V1 implemented; V2 pending.
- PL-PROD-VALUE — :61 — V1 derivation ratified Aug 20.
- PL-EVID-01 — :62 — Unresolved architecture — monitored-position invariant ratified Aug 24.
- PL-EVID-02 — :63 — Unresolved.
- PL-DEPLOY-02 — :64 — Unresolved ownership; DEF01 closed Sep 1.
- PL-OPS-01 — :70 — Infrastructure prerequisite — Sep refinement in -8:17.
- PL-ARCH-03 — :71 — Prerequisite, informed by PL-ARCH-07.
- PL-EVID-04 — :77 — Blocked — Oct 14 EVA-001 notes in -10:1543.
- PL-EVID-05 — :78 — Blocked.
- PL-RESEARCH-04 — :79 — Blocked.
- PL-RESEARCH-01 — :85 — Active research — Pass −1 frozen Oct 1.
- PL-ARCH-02, PL-ARCH-01, PL-POL-01, PL-CALL-03, PL-OPS-04, PL-STRAT-01, PL-TRAIN-01, PL-META-01 — :91–99 — Exploratory seeds. PL-STRAT-01 has heavy refinements in -5, -6 and -10 (Test 1 FAIL accepted Oct 8).
- PL-COHERE-01 — :98 — Active (promoted Aug 26) — no later base update.
- PL-RESEARCH-03 — :105 — Engineering research instrument.

Closed index (:165–214):
- Graduated/Promoted: PL-OPS-03, PL-CALL-05, PL-DEPLOY-01, PL-POL-02, PL-API-01.
- Superseded: PL-CALL-01, PL-CALL-02, PL-UX-02, PL-DEPLOY-03, PL-POL-03, PL-OPS-02.
- Merged: PL-OPS-05 → PL-CLEANUP; PL-ARCH-04 → PL-POL-04; PL-EVID-06 → PL-EVID-02; PL-REC-STATE → PL-ARCH-06 + PL-DEPLOY-02.
- Reframed: PL-CALL-04 → PL-ELIG.
- Dissolved: PL-RESEARCH-02.
- PL-OPS-07 → PL-CLEANUP (absorbed; mentioned only inside the PL-CLEANUP row).

### Defined in continuation files
- PL-EVID-MVPTA (-2:32) — Exploratory research.
- PL-EVID-AGE (-3:30) — Principal-selected workstream; reconciled at -3:34.
- PL-POSTURE-01 (-3:98), PL-SURF-01 (-3:99), PL-SCHED-DRIFT (-3:100) — Discovery.
- PL-DEPLOY-02-DEF01 (-3:110) — Closed Sep 1 (c5df959).
- PL-PROV-FAILOVER (-3:172) — Reconciled Sep 2; not implemented.
- PL-ARCH-FITNESS-01 (-4:28) — Intake.
- PL-PROD-EXPORT-01 (-4:50) — V1 accepted/committed (-4:184).
- PL-OPS-08 (-7:128) — Intake; bounded forced one-shot recovery implemented, after the nudge approach was falsified.
- PL-OPS-09 (-8:149) — Intake; targeted refresh shipped Sep 10.
- PL-MKT (-8:613) — Intake; two capabilities shipped.
- PL-DEPLOY-EXPORT (-8:647) — Reconciled (-8:733); greeks+IV slice design authorized, implementation not.
- PL-RECIPE-01 (-8:795) — Intake, partly Principal-settled; reconciled record at -8:921.
- PL-ACTOR-01 (-9:11) — Intake Sep 17; no later update found.
- PL-DEPLOY-BAL (-9:170) — Reconciled Sep 19; cash-layout fix shipped Sep 21 (-9:238); ww accounts parked Oct 17 (-10:1697).
- PL-PORT-01-UPLOAD-ALL (-9:265) — Dropped/deferred by Principal Option 4.
- PL-PORT-01-CAPGRAPH (-9:313) — Intake.
- PL-ROADMAP-UI (-9:363) — Log lens accepted Sep 21; detail pane Sep 22.
- PL-ARCH-07 (-9:531) — Intake/research.
- PL-BROKER-CAP (-9:857) — Intake.
- PL-SEM-01 (-9:995) — Intake; draft at v1.4; ratification and DDD blocked.
- PL-EVID-OBS (-9:1242) — Active research.
- PL-RESEARCH-05 (-9:1345) — Intake.
- PL-BETA-01 (-10:17) — Reconciled intake.
- PL-OPS-CSV-01 (-10:115) — Reconciled intake.
- PL-SETUP-01 (-10:160) — Reconciled; Sep 27–28 continuations.
- PL-DEC-RES-01 (-10:215) — Architecture ratified (ADR-021/Doc 67); implementation held.
- PL-CLI-01 (-10:243) — Ongoing. Positions human presentation accepted Oct 17, not implemented. ww live STOPPED Oct 16. ww accounts parked Oct 17.
- PL-OPS-10 (-10:640) — Intake, "address soon".
- PL-API-02 (-10:661) — CLOSED/ACCEPTED Oct 15 (docs delivery, Steps 1–5).
- PL-API-03 (-10:764) — POST direct-quote contract ratified and implemented; GET held-discovery ratified and specified (later implemented: -10:842 held ETF queries verified); broader work is Intake.
- PL-CONV-01 (-10:948) — ONGOING. Steps 1–2 complete, 3 next, 4–6 planned/unauthorized. Oct 13–14 Position-scan proposal under review; ww live stopped Oct 16.

## 3. EMBEDDED KNOWLEDGE ITEMS
Format: ID | title | ref | essence (≤35 words; [P] = Principal-attributed wording, [D] = document wording) | authority | type | status | scope | Canonical? | proposed subject area | needs Principal judgment (Y/N).

- P-001 | Backend authority principle | -10:1325–1344 | [D] "authoritative business state, domain semantics, business rules, and decision logic belong to the backend… Clients… must not establish competing authoritative business state or decisions." | Principal-ratified Oct 11 | RATIFIED-INVARIANT | Persisted | System-wide | principles.md (PRIN-ARCH-BACKEND-AUTHORITY) | Architecture principles | N
- P-002 | Backend authority closes the allocation debate | -10:1346–1356 | [D] Allocation is settled; capability definition stays open. "Do not reopen the settled allocation question during routine design." Ships three design tests: interface substitution, fresh client, deterministic equivalence. | Interpretive consequence of P-001 | DECISION | Persisted | Architecture review | NOT FOUND (the three tests appear only in the PL) | Architecture fitness tests | N
- P-003 | Account identity and confidentiality | -10:1010–1027 | One random immutable canonical GUID per Account. Operators use nicknames only. Broker account numbers are sensitive, excluded from URIs, masked by default (at most last four visible). | Principal-ratified Oct 11 | RATIFIED-INVARIANT | Ratified; implementation not authorized | API v2 / identity | 77-api-v2-architectural-guardrails.md | Identity & security | N
- P-004 | Model A User–Account authorization + fail-closed source disclosure | -10:1170–1200, 1270 | Explicit backend User–Account grants. Admin User inspection grants no financial access. Original bytes are fail-closed when Account scope is unestablished. | Ratified (Doc 77) | RATIFIED-INVARIANT | Complete (Step 1) | Security | 77; fail-closed also in 07c-adrs.md | Authorization | N
- P-005 | Account-locality invariant | parking-lot.md:45 | [D] Multi-account state keyed by stable `brokerageAccountId`, account-local, NOT partitioned by Operator. An Operator ID "must not become the partition key." | Ratified Sep 21 (SYNC 6a99217) | RATIFIED-INVARIANT | Active | Portfolio persistence | brokerageAccountId found in 07c-adrs.md and 07-architecture-current.md | Portfolio/account model | N
- P-006 | Monitored-position observation invariant | parking-lot.md:62 | [D] "Every symbol with an open monitored portfolio position must be observable by the Evidence Appliance, independent of recommendation/discovery universe membership." | Ratified Aug 24 | RATIFIED-INVARIANT | Mechanism unprescribed | Evidence | NOT FOUND | Evidence scope / universe | N (mechanism: Y)
- P-007 | Portfolio Capital derivation | parking-lot.md:61 | `Portfolio Capital = Fidelity Total Account Value − aggregate short-option MTM`, plus six ratified accounting semantics, state-transition stability, and residual reconciliation. | Ratified Aug 20 | RATIFIED-INVARIANT / DOMAIN-DEFINITION | Ratified | Production/Console | foundations/portfolio-capital.md | Capital accounting | N
- P-008 | Net Strategy Result | parking-lot.md:59 | NSR = OPTION_PREMIUM + REALIZED_APPRECIATION − CAPITAL_EROSION. Structural income excluded. Shown adjacent to Production, never replacing it. Computed in the backend. | Resolved | DOMAIN-DEFINITION | Implemented | Production | ADR-014 (cited; I did not grep it) | Production accounting | N
- P-009 | Broker modularity | parking-lot.md:47 | [D] "Common integration does not imply common capability; unsupported operations must be refused rather than approximated. Decision/domain logic must not acquire broker-specific conditionals." | Principal requirement Sep 2 | PRODUCT-REQUIREMENT | Interfaces unratified | Execution | NOT FOUND | Execution boundary | N
- P-010 | Broker-fact layering | -9:170–237 | [D] "broker-native facts → account-regime classification → Wheelwright semantic projection → policy". Also: do not build a synthetic Fidelity NAV/margin engine. | Reconciled Sep 19 | ARCH-INVARIANT | Reconciled | Portfolio/Deployment | foundations/options-domain-reference.md (phrase only) | Broker semantics | N
- P-011 | Deployable cash is regime-aware | -9:200–225 | MARGIN → AWMI (not settled cash, not buying power). CASH → "Available to trade (all settled)". INDETERMINATE → null. Tradable ≠ withdrawable. PTS falsifier specimen. | Reconciled + shipped Sep 21 | DOMAIN-DEFINITION / FINDING | Partly shipped | Deployment | NOT FOUND | Capital availability | N
- P-012 | UNRESOLVED predicate/resolution model | -10:215–234 | Rule-local immutable predicate results plus separate derived resolution metadata. Never pretend dependency-blocked predicates were evaluated. No workflow, policy or ontology engine. | Principal-ratified (ADR-021/Doc 67) | DECISION | Implementation held | Governed Decision | ADR-021 (cited; 07c not grepped for it) | Governed decision | N
- P-013 | Governed-scope topology | -10:160–175 | "Account → governed scope(s) → Operating Program/configuration → Recommendation". Program is NOT account-global (PTS: Treasury ladder + options overlay). Setup is "evidence-accelerated, never inferred". | Reconciled Sep 26 | DOMAIN-DEFINITION | Reconciled | Governance setup | NOT FOUND (phrase) | Governance/Program model | Y
- P-014 | Inner Game discipline | -9:1436–1460 | [D] Make the disciplined process "the path of least cognitive resistance." "Wheelwright determines what the governed process says should happen. The operator determines whether it actually happens." | Principal-directed refinement | PRODUCT-REQUIREMENT | Reconciled; not authorized | Decision/HITL | NOT FOUND (Doc 61 not checked) | Behavioral decision discipline | Y
- P-015 | GDXJ falsifier: state ≠ purpose | -9:1450+ | Mechanical state does not establish purpose, Outcome Stance, Program or policy. The AI implicitly supplied an objective. "Patience was the process." | Principal falsifier | FINDING-THAT-CHANGED-ASSUMPTION | Recorded | AI reasoning / Decision | NOT FOUND | Intent non-inference | N
- P-016 | Mechanics over Impulse / accountable HITL | parking-lot.md:33 | Human owns the money, decision and accountability. Move discretion upstream into policy. Avoid an "idiot in the loop" and ceremonial rubber-stamping. No manipulative presentation. | Accepted direction | PRODUCT-REQUIREMENT | Exploration | Decision | NOT FOUND | Behavioral decision discipline | Y
- P-017 | Lifecycle reconsideration semantics | parking-lot.md:47; -10:948 | Compare HOLD/CLOSE/ROLL/natural resolution. "Stop loss" is not universal. A replacement must independently qualify rather than serve as loss repair. Condition reached ≠ reconsideration warranted ≠ preferred action. UNRESOLVED ≠ ALERT. | Accepted direction; enums NOT ratified | DOMAIN-DEFINITION | Open (Step 6) | Lifecycle | NOT FOUND | Lifecycle governance | Y
- P-018 | Absolute deployment floor | parking-lot.md:32 | "The best opportunity on a bad board may still be WAIT." Eligibility and acceptability prune; fitness ranks only the survivors. | Accepted refinement | DECISION | Accepted direction | Deployment | foundations/strategy-expansion-governance.md | Decision semantics | N
- P-019 | Market expectation ≠ outcome desirability | -9:1220–1241 | Scenario / Market Thesis is a governed Assertion family, not an entity. "market expectation is not outcome desirability". | Draft v1.4 | DOMAIN-DEFINITION | Not ratified | Semantic model | NOT FOUND (Doc 58 not checked) | Semantic model | Y
- P-020 | No canonical Strategy type | -9:1194–1219 | The practitioner corpus does not force a single `Strategy` type. Labels bundle construction, payoff, scenario and lifecycle. The −2…+2 framework is pedagogy only. | Falsification result | FINDING | Recorded | Semantic model | NOT FOUND | Semantic model | N
- P-021 | Semantic-model gap | -9:995–1030 | Mature submodels exist but there is no integrated ontology. docs/02-domain.md is an early mixed artifact. DDD should follow semantic ownership, not precede it. | Intake | FINDING | Draft v1.4 | Domain | NOT FOUND | Semantic model | Y
- P-022 | Authority vs transport | -9:11–110 | "The Principal owns authority. The system owns transport." Plus "Automatic transport, actor-directed workflow, Principal-held authority, mechanical backstop." No actor hierarchy accepted. | Intake (discussion language) | PRINCIPAL-STATEMENT / UNRESOLVED | Intake | Methodology | NOT FOUND | Multi-actor operating model | Y
- P-023 | Codex independence is not a hierarchy | -9:95 | No `Principal > ChatGPT > Kiro > Codex` hierarchy. The independent-falsifier role must not collapse. Any proxy authority must be explicitly bounded. | Intake | DECISION (negative) | Recorded | Methodology | NOT FOUND | Actor roles | Y
- P-024 | Unix CLI usability | -10:272–283 | "Unix commands, not War and Peace." No recurring disclaimers "even when each statement is technically true". A quiet view must never falsify meaning. Reviewers judge usability as well as correctness. | Principal direction Oct 12 | PRODUCT-REQUIREMENT | Standing guidance | CLI | NOT FOUND | CLI design rules | N
- P-025 | Review-process blind spot | -10:282 | Three data rows followed by about 15 lines of qualifications passed technical review because the reviewer was told not to challenge length. | Finding | LESSON-FROM-FAILURE | Recorded | Review method | NOT FOUND | Review methodology | N
- P-026 | Declining marginal capability cost | -10:285–300 | "Optimize Wheelwright development for the declining marginal cost of adding trustworthy capabilities." Ask "Can existing capabilities already do this?" Keep financial, auth and governance logic out of CLI/agent glue. | Working guideline, explicitly NOT ratified | PRINCIPAL-STATEMENT | Unratified | Platform strategy | NOT FOUND | Platform thesis | Y
- P-027 | Held-evidence reads never acquire | -10:545, 796 | "Held-evidence reads never acquire or revalidate evidence." `ww ls quotes` and GET /v2/quotes make no provider contact. GET is the complete held inventory; empty returns 200. | Principal-ratified Oct 5 | RATIFIED-INVARIANT | Implemented | API v2 | NOT FOUND in checked set (likely docs/contracts or Doc 76 [I]) | API read/acquire semantics | N
- P-028 | `ww fetch` meaning | -10:481, 504–535 | `ww refresh` retired. `fetch SYMBOL...` → POST /v2/quotes with mode ORDINARY, or FORCE via --force. Bare fetch only experimentally accepted, not a ratified default. | Principal decisions Oct 4–5 | DECISION | Implemented | CLI/API | NOT FOUND | CLI contract | N
- P-029 | Node.js chosen for ww | -10:420–455 | Provisional gate; Node selected durably (c96dc2c); gate reopened; later resolution followed. Observing a specimen must not silently ratify the technology. | Principal decision | DECISION | See spans | CLI | NOT FOUND | Tech choices | N
- P-030 | Temporal observation principle (candidate) | -10:439 | Market observations are temporally situated facts, not timeless current state. | Candidate; Doc 71 | UNRESOLVED-QUESTION | Candidate | Evidence semantics | NOT FOUND | Temporal semantics | Y
- P-031 | PL-CONV-01 six-step sequence | -10:1170–1200 | Account-first. Order: Model A → BUG-036 → multi-broker Account → XLE occurrence → tastytrade evidence → governed reconsideration. The order is binding but each step needs separate authorization. | Principal-selected Oct 11 | DECISION | Steps 1–2 done | Convergence | NOT FOUND | Convergence program | N
- P-032 | Protect operational clients | -10:1186–1196, 1283 | v1 Web stays the Cash Deployment client and `tt live` stays the monitor until v2 equivalence is accepted. No forced cutover. Converged CLI adopts the tt motif. | Principal direction | PRODUCT-REQUIREMENT | Active | Delivery | NOT FOUND | Migration/continuity | N
- P-033 | Distinctions to preserve | -10:1284 | Brokerage source truth vs retained observation; holding vs managed occurrence; working order vs fill; objective vs policy; quote vs executable price; historic vs current. | Principal-accepted constraints (explicitly "not seven new principles") | DOMAIN-DEFINITION | Accepted | Domain | NOT FOUND | Semantic distinctions | N
- P-034 | Geometry ≠ managed Position | -10:948–960, 1272 | A four-leg geometric match is a hypothesis, not proof of a managed Position. No grouping or Program authority is inferred from geometry. Missing history stays unknown. | Intake/constraint | DOMAIN-DEFINITION | Open (Step 4) | Position identity | NOT FOUND | Position/occurrence model | N
- P-035 | CONV-WEB is a rewrite (Kiro view) | -10:1350–1392 | "Rewrite, not migration": the browser-owned substrate cannot carry forward. Explicitly NOT ratified; requires 4AM consensus and Principal approval. | Kiro interpretation | UNRESOLVED-QUESTION | Not ratified | Web FE | NOT FOUND | Migration | Y
- P-036 | Admission policy facts | parking-lot.md:35 | "DANGER is not an admission veto". "Admission ≠ hydration". VR_MANUAL_REVIEW results are preserved, not converted. Census results are research findings, not Appliance observations. | Principal-authorized execution Sep 14 | DOMAIN-DEFINITION | Executed | Governance | NOT FOUND | Universe governance | N
- P-037 | Backlog item ≠ missing capability (GOV-02) | parking-lot.md:35 | [D] "An authorized universe change that can be executed safely through existing mechanisms must not be deferred solely because PL-GOV-02 remains unfinished." | Capability boundary | CAPABILITY-BOUNDARY | Active | Methodology | Steering rule (development-workflow); NOT FOUND in the checked docs | Capability vs productization | N
- P-038 | DANGER detection limits | parking-lot.md:35 | Single-stock detection is only a name-string match. Crypto-trust structure cannot be represented. | Finding | CAPABILITY-BOUNDARY (DEFER) | Deferred | Governance | NOT FOUND | Governance correctness | N
- P-039 | Operator topology | parking-lot.md:31 | Console → Deployment → Production inside the shell. Engineering instruments are not operator surfaces. Operator code must not depend on engineering-only code. `/engineering/*` is the intended direction. Kreature excluded. | Ratified Sep 4 | ARCH-INVARIANT | Ratified | App shell | NOT FOUND (phrase; ADR-011/012 not checked) | Surface topology | N
- P-040 | Evidence–Decision temporal coherence (Finding #1) | parking-lot.md:98 | A 30-minute chainStaleMs gate silently collapsed the 7–45 DTE board. Candidate invariant: the Appliance maintains the surface or reports it degraded. Ownership ratification awaited. | Finding | FINDING / UNRESOLVED | Awaiting ratification | Evidence/Decision | NOT FOUND | Temporal contract | Y
- P-041 | No coherent definition of evidence readiness | parking-lot.md:98 | The "60/60 fresh" indicator reflects only quote readiness. spot_history writes duplicate rows per expiration. | Candidate finding #2 | FINDING | Not ratified | Evidence | NOT FOUND | Readiness semantics | Y
- P-042 | Entanglement lesson (Aug 26) | parking-lot.md:24, 98 | A tiny React effect loop was indistinguishable from architectural failure for hours. The entanglement is the warning. The snapshot and browser engine were exonerated. | RCA | LESSON-FROM-FAILURE | Recorded | Architecture | NOT FOUND | Coherence | N
- P-043 | Cloud gating | parking-lot.md:98 | Do not go to cloud just because local works. Reconciliation is a prerequisite. "Boring Wheelwright, weird Kreature." Three-band model. | 3AM role assignments | DECISION | Status stale since Aug 26 | Roadmap | NOT FOUND | Sequencing | Y
- P-044 | Full-surface expiration finding | parking-lot.md:57 | The ~21 DTE pick sampled a liquidity trough: 44% vs 8% ACTIONABLE+EDGE, median OI 1,152 vs 10. Decision chose non-primary expirations 5/5. Cross-DTE fitness unresolved. | Resolved | FINDING-THAT-CHANGED-ASSUMPTION | Implemented | Evidence | NOT FOUND (docs/21 not checked) | Expiration policy | N
- P-045 | Execution drift | parking-lot.md:47 | BNO falsified. EWY −$135 erosion confirmed. COPX had about $0.07 headroom. Future work: show the maximum capital-preserving fill. | Finding | FINDING | Open | Execution | NOT FOUND | Execution quality | N
- P-046 | Lot-level basis | parking-lot.md:45 | A blended averageCostPerShare gives wrong per-call economics on multi-lot symbols. The engine is unaffected. | Finding | FINDING | Open | Portfolio | NOT FOUND | Lot model | N
- P-047 | Targeted re-observation exception | -8:176–200 | A narrow operator-scoped bypass of the stewardship/freshness gate for an explicit small symbol set. POST rather than side-effecting GET. Top-30 cap is display-relative. | Shipped Sep 10 | ARCH-INVARIANT | Shipped | Acquisition | NOT FOUND | Acquisition exceptions | N
- P-048 | Notification semantics | parking-lot.md:95 | Notify on decision/attention-state transitions, not price moves. "Minimize required operator attention, not maximize engagement; silence is correct". Must not execute. | Accepted | PRODUCT-REQUIREMENT | Seed | Ops/UX | NOT FOUND | Attention model | N
- P-049 | Console question | parking-lot.md:41 | "Do I need to do anything now?" Periodic assessment should normally conclude no action. Attention is not an instruction. | Aug 29 refinement | PRODUCT-REQUIREMENT | Implementation work | Console | NOT FOUND (doc 26 not checked) | Console purpose | N
- P-050 | Recipes as decision lenses | -8:795–960 | A named, versioned lens over the governed population, not a subsystem. Raw weighted Greek sums are "dimensionally suspect". DSL rejected by Principal Sep 16. Must be falsifiable. | Principal-settled parts | DECISION / REJECTED-DESIGN | Intake | Decision | NOT FOUND | Comparative fitness (AR5) | Y
- P-051 | Falsified vs replaced | -8:109, 995 | "Replacement unresolved does not mean problem uncertain." An off-tool trade falsifies the CC surface but does not select its replacement. | Discovery | LESSON | Recorded | Method | NOT FOUND | Epistemics | N
- P-052 | Strategy admission hypothesis | parking-lot.md:96; -10:884–906 | Strategies must serve governed capital transformations without prediction. Partial-collar Test 1 FAIL accepted (ending value [amount-redacted] vs [amount-redacted]). No Test 2. | Principal-accepted FAIL Oct 8 | FINDING / REJECTED-DESIGN | Closed for the candidate | Strategy | foundations/strategy-expansion-governance.md (framework) | Strategy admission | N
- P-053 | Four brokerage capability surfaces | -9:857–880 | Portfolio State, Market Evidence, Execution, Lifecycle/Outcome form the problem space. Vendors and APIs are the solution space and must not substitute for it. | Intake | DOMAIN-DEFINITION | Intake | Broker strategy | NOT FOUND | Brokerage capability model | Y
- P-054 | Browser-only portfolio is not authority | -9:712–730 | [P] "Much of the Fidelity / brokerage portfolio information is currently stored only in the frontend/browser." Account-safe ≠ durable authority. | Principal observation Sep 21 | PRINCIPAL-STATEMENT | Intake | Persistence | NOT FOUND | Portfolio authority | N
- P-055 | Sole import identity authority | -9:287 | "explicit account selection is sole import identity authority" (decision e6e743b). Multi-select "Upload All" dropped by Principal (Option 4). | Ratified | DECISION | Ratified | Import | NOT FOUND | Import identity | N
- P-056 | Observation value ≠ membership | -9:1242–1260 | Separate servicing priority from universe membership. 340/340 REMOVE → Muse F; 487/487 WEEKLY → D/F. No policy change. | Research | FINDING | Active research | Evidence | NOT FOUND | Observation value | Y
- P-057 | Provider entitlements fail independently | -3:172–182 | Production returned 401 while sandbox returned 200. Failover vocabulary is non-ratified. | Reconciled | FINDING | Not implemented | Provider | NOT FOUND | Provider availability | N
- P-058 | Roadmap self-documenting meta-state | -9:469 | [D] "the Roadmap is Wheelwright's self-documenting meta-state; its freshness is a side effect of doing the work" | Codified | RATIFIED | Promoted | Methodology | foundations/roadmap-self-documenting-meta-state.md | Meta-state | N
- P-059 | Private beta disclosure | -10:17–70 | Disclosures must describe actual behavior rather than "a contradictory fiction". No multi-user implementation. Legal text not ratified. | Reconciled intake | PRODUCT-REQUIREMENT | Intake | Beta | NOT FOUND (Doc 62) | Beta program | Y
- P-060 | API docs publication | -10:679–681 | Static Redocly site from the authoritative OAS on GitHub Pages; COTS-first. 15 public / 19 internal operations. | Principal decision Oct 15 | DECISION | Closed/accepted | API | NOT FOUND | API documentation | N
- P-061 | API schema must not weaken evidence semantics | -10:720–721 | Machine-readable API contract work must not weaken persist-facts/derive-trust semantics for the sake of framework introspection. | Reconciliation | ARCH-INVARIANT | Recorded | API | principles.md (base principles) | API design | N
- P-062 | Do not over-claim test measurements | -8:339–348 | No SLO, "87%", "<60s" or "~200s reclaimable" figure is ratified from failed runs. "Verification breadth appears over-purchased." | Intake | LESSON | Intake | Engineering | NOT FOUND | Verification economics | N
- P-063 | Positions human presentation | -10:1676–1696 | Accepted target: separate POSITION and CONTRACT columns, PURPOSE/STATE/COLLATERAL, blanks for absent data, no arrows. The backend establishes all associations; clients do no recognition. | Principal-accepted Oct 17 | PRODUCT-REQUIREMENT | Not implemented | CLI | NOT FOUND | CLI presentation | N
- P-064 | Isolated acceptance rejected | -10:1606 | The Principal rejected the isolated acceptance path. Acceptance requires the installed, integrated workflow. | Principal Oct 15 | DECISION / LESSON | Applied | Acceptance | NOT FOUND (possibly in KNOWN-FAILURE-MODES; not matched) | Acceptance method | N

## 4. BURIED KNOWLEDGE
Ratified or accepted items that exist only inside a PL entry, as far as my canonical grep could tell:
1. P-006 monitored-position observation invariant (ratified Aug 24).
2. P-009 broker-modularity Principal requirement (Sep 2).
3. P-027 held-evidence reads never acquire (Principal-ratified Oct 5). I did not check contracts/.
4. P-036 "DANGER is not an admission veto" and "Admission ≠ hydration".
5. P-039 operator topology and engineering-boundary import rule (ratified Sep 4). The exact phrasing was not found; ADR-011/012 were not checked.
6. P-055 "explicit account selection is sole import identity authority" (e6e743b).
7. P-011 regime-aware Deployable rule (MARGIN → AWMI; CASH → all settled).
8. P-002 the three backend-authority design tests (interface substitution, fresh client, deterministic equivalence) and the "do not reopen" rule.
9. P-031/P-032 Principal-selected six-step convergence sequence and protection of operational clients.
10. P-024 "Unix commands, not War and Peace" standing guidance, plus the usability-in-review requirement.

Runners-up: P-007 Portfolio Capital ratified semantics 1–6 (the formula is canonical; I did not check whether all six semantics are); P-048 notification silence principle; P-047 targeted-refresh exception boundary.

## 5. UNRESOLVED QUESTIONS (keep visibly open)
- PL-ARCH-06 (parking-lot.md:24) is still labelled an unresolved Principal decision even though P-001/P-002 settle the allocation side. Whether to close it is a Principal call.
- PL-GOV-EXPR (:25).
- Decision/recommendation history ownership is "Unresolved" (parking-lot.md families table).
- Cross-DTE fitness (:57).
- The temporal-contract ownership question from the Aug 27 3AM session (:98, docs/36).
- COPX headroom: marginal recommendation or execution drift (:47).
- PL-ACTOR-01 tiebreak/adjudication question (-9:~70): "When two actors propose incompatible next actions… what adjudication mechanism determines the workflow head?"
- PL-SEM-01 remaining blockers (-9:1236): Lifecycle Episode identity, Capital Pool partition, association authority, Intent naming, decision-trace identity, commitment boundary, Candidate durability, capability lifecycle.
- HOLD/ALERT/UNRESOLVED vocabulary is not ratified (-10:948).
- XLE occurrence continuity (Step 4).
- CONV-WEB rewrite-vs-incremental (-10:1360+).
- User-isolation/admin exception parked (-10:1022).
- Full broker-number disclosure capability unresolved, with BUG-035 open and unscheduled (-10:1017–1019).
- PL-RECIPE-01 normalization (AR4) (-8:897).
- Provider-IV quality-tag vocabulary (-8:713).
- PL-EVID-04 historical IV sufficiency.
- PL-RESEARCH-01 replay selector.
- PL-PROD-VALUE open implementation questions (:61).

## 6. VERBATIM PRINCIPAL-ATTRIBUTED STATEMENTS
- "Unix commands, not War and Peace." (-10:276, Oct 12 2026, Principal direction)
- "Optimize Wheelwright development for the declining marginal cost of adding trustworthy capabilities." (-10:289, Oct 12 2026)
- "Much of the Fidelity / brokerage portfolio information is currently stored only in the frontend/browser." (-9:~717, Sep 21 2026, Principal)
- "The Principal owns authority. The system owns transport." (-9:~26, Sep 17 2026). This is discussion language, not a decision.
- "Wheelwright should make following the disciplined process the path of least cognitive resistance…" and "Wheelwright determines what the governed process says should happen. The operator determines whether it actually happens." (-9:~1445, Sep 24 2026). Labelled as Principal-led exploration; exact speaker attribution is not explicit [I].
- Intent-first example: "Figure out how ratio spreads work and encode them as a type in ww." (-10:~295, Oct 12 2026)
- Principal names the workstream "ww accounts" (-10:1699, Oct 17 2026).

The record has no other verbatim Principal quotes. Most "Principal decision" text is document paraphrase [D].

## 7. NATURAL CLUSTERS
- **Authority & architecture:** P-001/2, P-039, P-040–43, P-047, P-061, PL-ARCH-06, PL-COHERE-01.
- **Identity, security & accounts:** P-003/4/5, P-055, BUG-035/036, PL-ARCH-07/03, ww accounts.
- **Broker/capital semantics:** P-007/8/10/11, P-053/54, PL-DEPLOY-BAL, PL-BROKER-CAP, PL-PORT-01.
- **Governed decision & lifecycle:** P-012/13/14/16/17/18/50, PL-DEC-RES-01, PL-SETUP-01, PL-DEC-BEH, PL-EXEC-01, PL-UX-01, PL-OPS-04.
- **Semantic model:** P-019/20/21/33/34, PL-SEM-01, PL-CONV-01 Step 4.
- **Evidence scope & temporality:** P-006, P-027, P-030, P-041, P-044, P-056, P-057, PL-OPS-08/09/10.
- **CLI/API product:** P-024–29, P-060, P-063, PL-CLI-01, PL-API-02/03.
- **Governance/universe:** P-036–38, PL-GOV-01/02, PL-RESEARCH-01.
- **Methodology/actors:** P-022/23/25/51/58/62/64, PL-ACTOR-01, PL-META-01, PL-ARCH-FITNESS-01.

Cross-cutting concepts:
- capability ≠ product expression;
- falsified ≠ replaced;
- a condition ≠ an action;
- facts → projection → policy layering;
- never infer intent;
- fail closed;
- protect accepted operational clients;
- separate authorization per step.

## 8. DUPLICATION / CONTRADICTION
All verified unless marked [I].
- **Duplicate paragraph:** in parking-lot.md:45 (PL-PORT-01), the "Lot-level basis attribution (Aug 2026 BW investigation)" paragraph appears twice, verbatim.
- **PL-OPS-06:** listed as active "Implementation Work" (parking-lot.md:50), but the PL-CLEANUP row (:34) says it was absorbed ("scan functions already retired") and CLEANUP is COMPLETE.
- **PL-ARCH-06:** still filed as an unresolved Principal decision; it was never updated after the PRIN-ARCH-BACKEND-AUTHORITY ratification (-10:1325), which declares the allocation debate closed.
- **Stale base header:** "Last reviewed: August 29, 2026", while rows were amended in place up to Oct 14 (PL-EVID-04, PL-RESEARCH-01). PL-COHERE-01 "Active" has no update since Aug 27.
- **PL-ELIG heading vs body:** heading -8:398 says "implementation not yet authorized"; the state at -8:405 says "IMPLEMENTED and pushed (a129fe1)".
- **CONV-WEB record (-10:~1358–1392):** two contradictory status lines. "Complete source artifact subsequently archived" sits next to "COMPLETE SOURCE ARTIFACT PENDING", and there is a malformed "(October 11, 2026)" heading fragment.
- **PL-API-03 state line (-10:768):** says GET held-discovery is "specified, not implemented". Later sections (-10:842) say held ETF queries were implemented and verified. The state line was not updated.
- **Unlabelled intake:** -8:277 (Java test-suite SLO review) carries no PL-* ID as far as I could find [I]. That conflicts with the intake discipline "New ideas receive a stable ID immediately".
- **Inline-only absorption:** PL-OPS-07 is referenced as absorbed but has no closed-index row.
- **Historical duplicate-ID note:** parking-lot.md:~225 (Source Integrity Note) records the old PL-ARCH-01 collision.
- **Requested phrase hits:**
  - "technically correct": none in the parking lots. The nearest is -10:278 "even when each statement is technically true". Found elsewhere in bootstrap/chatgpt-cold-start.md:69 and discovery/02-prior-art-findings.md:29, 111.
  - "worst kind of correct": NOT FOUND anywhere in docs.
  - "URI patterns": not in the parking lots. Found in journal/project-journal-5.md:1944, design/ww-show-positions-v2-architectural-proposal-2026-10-13.md:9, 82-v2-ontology-…:67 and foundations/principal-rest-uri-design-review-intent-2026-10-18.md.
  - "personal objectives": not in the parking lots. Found in foundations/principal-personal-objectives-2026-10-14.md (explicitly not the LVT).

RELEVANT FILES (ranked by importance):
  1. docs/parking-lot.md — Base registry holding the most ratified invariants buried in rows (account locality, monitored-position observation, Portfolio Capital, broker modularity, shell topology, DANGER/admission) and the closed/merge index
  2. docs/parking-lot-10.md — Latest (Sep 24–Oct 17): PL-CONV-01 ratifications and sequence, the PRIN-ARCH-BACKEND-AUTHORITY promotion, CLI/API Principal decisions, the UNRESOLVED predicate model, and the governed-scope topology
  3. docs/parking-lot-9.md — PL-ACTOR-01 authority/transport, PL-DEPLOY-BAL broker regime semantics, PL-SEM-01 semantic model, PL-BROKER-CAP, PL-DEC-BEH Inner Game
  4. docs/parking-lot-8.md — PL-OPS-09 targeted-refresh exception, PL-RECIPE-01 (DSL rejected), falsified-vs-replaced lessons, test-SLO non-ratification
  5. docs/parking-lot-3.md — PL-SHELL/PL-CLEANUP final records, PL-PROV-FAILOVER finding, PL-EVID-AGE

NOTE: Line ranges have been extended by ~50 lines to provide additional surrounding context.