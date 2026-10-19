=== Context Gathering Summary ===
FOUND: Full heading index of all 5 journal files (17,479 lines). All block quotes in the journal. Explicit Principal-attributed statements at j2:46, j2:331, j3:589, j4:167, j1:8682, j1:11707, j5:1852, j5:1965, j5:2023 and j5:1772. BUG-021 five-pass record (j4:270-366). Four-Actor (j2:68). 3AM and 4AM entries. URI patterns (j5:1944). tt live acceptance and failure entries. Six "-ities" (j5:394). Zero-cash RCA. Gen-29066 and BTS failure lessons. Integration checks for about 24 concepts.
NOT FOUND: "Technically correct is the worst kind of correct": not anywhere in the repo, only "technically correct" variants. "Six personal objectives": not in the journal (only docs/foundations/principal-personal-objectives-2026-10-14.md). "Product precedent": no journal hits. "Human clipboard": not in the journal (parking-lot-9 PL-ACTOR-01). Herbie: only one passing journal mention. Exact entry counts are approximate. Speaker attribution for several block quotes (j2:204, 367, 377) is inferred, not verified. Most of journal.md lines 1-7500 and the 9000-10900 span (Kreature lab, console B-series) were indexed only.
====================================

=== CONTEXT GATHERING COMPLETE ===

ANSWER:
Survey method: I counted lines in all five files, indexed every `## ` heading, and grepped for the markers you listed, block quotes (`^> `), and the special terms. I then read about 40 high-signal spans in full and grep-checked integration in docs/foundations, docs/principles.md, docs/07c-adrs.md and docs/07-architecture-current.md, plus a wider docs/ check for some concepts. Coverage is index-heavy. I read under 5% of the lines linearly, so treat anything outside the listed spans as indexed only.

## 1. Coverage ledger

| File | Lines | Date range | ~Dated entries | Read fully (spans) |
|---|---|---|---|---|
| project-journal.md | 12,469 | 2026-07-03 to 2026-09-02 | ~190 | 7505-7512, 7560-7580, 8682-8690, 8810-8818, 11142-11152, 11195-11215, 11303-11312, 11479-11492, 11705-11709, 4770-4779, 3736-3742, 6818-6830, 7064-7076 |
| project-journal-2.md | 1,332 | 2026-09-03 to 09-09 | 15 (the 09-03 entry alone runs about 590 lines) | 12-30, 42-47, 68-80, 262-280, 325-335, 1197-1201 |
| project-journal-3.md | 1,037 | 2026-09-09 to 10-02 | 33 | 335-342, 484-492, 586-590 |
| project-journal-4.md | 373 | 2026-09-16 to 09-18 | 11 | 150-170, 215-236, 270-280, 336-362 |
| project-journal-5.md | 2,268 | 2026-09-17 to 10-15 | ~125 | 11-36, 155-158, 1186-1200, 1579, 1616, 1643-1652, 1720-1726, 1772, 1841-1854, 1983-1986, 2034-2036, 2107-2110 |

All other block quotes (136 in total) and grep hits were seen as single lines only.

Chronology defects (verified):
- Entries at journal.md lines 6628-7064 are dated 2025-08-12. That is a year typo for 2026.
- Entries dated 2026-07-03 at journal.md lines 2971-3571 appear after the 07-13 entries.
- journal.md:11953, dated 09-01, follows a 09-02 entry.
- Mixed date formats: ISO, "August 18, 2026", "October 5, 2026", and undated "Entry:" or "Calls Horizon" headings (journal.md 304-510, 4509-4882).

Special-term search results (verified):
- "Technically correct is the worst kind of correct": not found anywhere in the repo. "Worst kind" matched nothing. Only the variant "technically correct" exists, in project-journal-2.md:17 (the Principal's code-reading critique), docs/bootstrap/chatgpt-cold-start.md:69 ("A technically correct answer to the first question does not answer the second") and docs/discovery/02-prior-art-findings.md. The nearest journal expression of the idea is project-journal-5.md:1841 ("rejected the technically passing default presentation").
- "Six personal objectives": not in the journal. The doc docs/foundations/principal-personal-objectives-2026-10-14.md exists. The journal's "six" is the six "-ities" at project-journal-5.md:394: usability, security, reliability, extensibility, maintainability, scalability.
- "URI patterns": project-journal-5.md:1944 (the ww show positions v2 proposal leads with existing and proposed URI patterns).
- 4AM: project-journal-2.md:1199 (the 4AM pause led to ADR-016), :1297, :1310; project-journal-3.md:869 (4AM discovery led to Recipes); project-journal-4.md:104.
- 3AM: journal.md:11193 (navigation-freeze root-cause analysis and 3AM recovery direction) and :11477 (3AM universe-governance ruling).
- Four-Actor: project-journal-2.md:9 and :68-80; project-journal-3.md:529.
- Herbie: one journal mention only, project-journal-5.md:146 (priority stack, Herbie/Constraint item).
- "Product precedent": zero journal hits. It lives in AGENTS.md and docs/mandates.
- `tt live` acceptance: project-journal-5.md:1718, :1965, :1983 (a FAILED acceptance), :2032.
- BUG-021: project-journal-4.md:270-366, five passes.
- "Human clipboard": not in the journal. It is in docs/parking-lot-9.md:11 (PL-ACTOR-01) and docs/experiments/operating-model-pending-corrections-2026-09-17.md:125.

## 2. Chronology spine

- 2026-07-03 | j1:57 | Bootstrap. AI lowers the cost of experiments; optimize observation cadence (j1:186, 202).
- 07-03 | j1:830 | Methodology: three kinds of knowledge.
- 07-04 | j1:1079 | Guardrail: history refines operation, not prophecy.
- 07-13 | j1:1854, 2131 | Velvet Rope: measurement differs from policy; measuring a contract differs from measuring a market.
- 07-13 | j1:2794 | The SOXS counterexample shows product structure matters for admission.
- 07-03* | j1:3148-3330 | Foundations review: ten candidate principles, side-asymmetric liquidity.
- 07-15 | j1:3670, 3734 | Backend evidence-service decision. Reactive vs anticipatory: the 12-click Rescan revealed a boundary, not a UX bug.
- 07-16 | j1:4201-4255 | Two evidence-state semantics corrections lead to the Evidence Appliance concept.
- 07-26 | j1:4467 | The repository is theory, not merely code.
- 07-27 | j1:4768 | Epistemic Integrity principle accepted.
- 08-06 | j1:5071 | Three-actor reconciliation; the cold-start reconstruction test (j1:5064, 5110).
- 08-07 | j1:5281 | Yield-suppression bug: execution rules must not suppress economic facts (j1:5328).
- 08-09 | j1:5563 | Epistemic pipeline hypothesis.
- 08-12 | j1:6628-7064 | Capital-erosion finding. ATM-bias hypothesis falsified. 76% of selections dominated. Delta reframed as an emergent property, not a governance constraint.
- 08-11/12 | j1:6405, 6523 | A freshness rollover emptied the deployment surface. "Valid but incomplete" search.
- 08-17 | j1:7228 | Mission concern and Situation architecture.
- 08-19 | j1:7497, 7558 | "Persistence is not recall." Two cold-start failure modes. The journal carries fidelity, not correctness.
- 08-19 | j1:7964 | CC/BW classification regression lesson.
- 08-19 | j1:8178 | Kreature (continuous observer) discovered.
- 08-20 | j1:8748, 8835 | Option Summary found not to be a holdings ledger. Defensive max() rejected. Portfolio Capital V1 ratified.
- 08-20 | j1:9307 | Console economics validated against Fidelity.
- 08-21 | j1:9425-9551 | Application-scoped state ownership is not the same as persistent visual residency.
- 08-26 | j1:10956-11193 | A Kreature debugging excursion into operational code leads to "Kreature as independent observer", "Boring Wheelwright, Weird Kreature", and the 3AM recovery direction. The navigation-freeze root cause was one unstable React dependency.
- 08-27 | j1:11295 | DTE-22 collapse. The first diagnosis was falsified by the Principal.
- 08-27 | j1:11477 | 3AM ruling. The active universe is a governed bounded resource; carrying capacity is measured in decision surfaces, not tickers.
- 09-01 | j1:11691 | ADR-015: "provenance needs a subject."
- 09-02 | j1:12001-12448 | PL-PROV-FAILOVER (automatic failover) and broker modularity.
- 09-03 | j2:9 | The Principal reads the Java code directly and reacts negatively. Four-Actor model, implementation standards, "make the right thing easy", SCA as scoreboard.
- 09-03 | j2:617 | Strict Sonar and ArchUnit graduate.
- 09-04 | j2:644-968 | PL-CLEANUP: reduce accidental change surface.
- 09-04 | j2:1030 | "Basis for what purpose?" (XLE economic truth).
- 09-05 | j2:1128, 1199 | Production disposition truth. The 4AM pause leads to ADR-016 (association is a semantic claim).
- 09-09 | j3:9 | Reliability classes before service boundaries.
- 09-10 | j3:245 | The spinner arc: two red herrings.
- 09-11 | j3:333 | Issue #16: the third instance of downstream authority reconstruction. Authority must reach the consumer.
- 09-14 | j3:482, 534 | Gen-29066 governance-conformance failure leads to the three-actor contract: "Find freely…"
- 09-16 | j4:150-236 | BTS/HOLD-CLOSE product-outcome failure. Specimen-first loop.
- 09-16 | j4:270-366 | BUG-021 five passes: uncertainty as state, single lifecycle authority.
- 09-17 | j5:9 | Zero-cash outage: known $0 is not the same as unknown null.
- 09-20 | j5:85-157 | ADR-018 (no runtime GitHub dependency). Principles become a primitive. The Roadmap is self-documenting meta-state.
- 09-23 | j5:407-589 | Semantic model (PL-SEM-01) and practitioner corpus.
- 09-24 | j5:612-686 | URA split-brain. ADR-020: Positions are aggregate-ownership.
- 09-28 | j5:1019 | Series-key ATTACH identity rejected; bounded continuity ratified (ADR-022).
- 09-30 | j5:1184 | tt product boundary and the Ten-Second Read. A "single-acquisition-authority" concern was a category error.
- 10-01 | j5:1335-1463 | Exit Reliability becomes the next evidence question. Pass 0 geometry adopted after a calendar-phase falsification.
- 10-02 | j3:923-1030 | Market Shape → Structure Fit sequencing; Iron Condor deployment projection.
- 10-05 | j5:1478-1653 | ww v2 CLI: path codec instead of a query parameter; "show is inspection, not a transaction."
- 10-08 | j5:1661 | Partial-collar Test 1 falsified.
- 10-11 | j5:1696-1797 | Tokens identify Users, independent of Accounts; tt live scan accepted ("recognition before arithmetic").
- 10-13/14 | j5:1902-2055 | BUG-040/041. TT Live economic-story baseline accepted. UNG falsified "stop = loss boundary". Isolated-replay acceptance failed.
- 10-15 | j5:2107, 2145 | Acceptance gate set to `ww pull && ww history` on the installed CLI. PL-API-02 contract fidelity.

## 3. Verbatim Principal statements

[P] means the journal explicitly attributes the wording to the Principal. [D] means a quotation whose speaker the journal does not name.

1. "Make the right thing easy to do. Make what is right easy to know." | j2:331 | 09-03 | governing axiom for code standards | [P] "The Principal stated the axiom"
2. "Every accepted change is intended to be production-ready. Environments provide progressively stronger evidence of readiness; they do not provide progressively weaker definitions of done." | j2:46 | 09-03 | release-state thinking | [P] "The Principal's rule is"
3. "Consider this a contract between three actors. It's your job to remind these actors of the contract they just signed. Persist it as such. Execute as such." | j3:589 | 09-14 | three-actor governance contract | [P]
4. "DBO must show a red BTS indicator and, when governed lifecycle policy supports the conclusion, Wheelwright should directly say 'BTC THIS PUT.'" | j4:167 | 09-16 | expected operator outcome | [P] "clarified expected outcome" (may be lightly paraphrased)
5. "The left and top panel on the Console page are crap right now." | j1:8682 | 08-20 | console sidebar redesign | [P]
6. "provenance needs a subject" | j1:11707 | 09-01 | ADR-015 deployment evidence age | [P] "in the Principal's words"
7. "perfect. acceptance passed. execute end of session protocol" | j5:1965 | 10-14 | TT Live credit spreads | [P]
8. "yes! that's the visualization" | j5:2023 | 10-14 | beyond-stop diamond grammar | [P]
9. "we've shifted our governance focus to v2 and loosened our grip on v1" | j5:1852 | 10-12 | interim IV Rank authorization | [P]
10. "simple beauty" | j5:1772 | 10-11 | describing `ww ls accounts` | [P] fragment
11. The Principal rejected `owned = max(observed, encumbered)` as "epistemically dishonest" | j1:8814 | 08-20 | inventory invariant | paraphrase
12. The Principal explicitly rejected "capacity utilization" | j1:5483 | 08-08 | denominator semantics | paraphrase
13. The Principal "rejected /v2/quotes/observation?symbol=... and explicitly retained the original instance-resource API" | j5:1616 | 10-05 | URI design | paraphrase
14. "show is inspection, not a transaction" | j5:1579 | 10-05 | Codex wording, ratified by the Principal | actor wording
15. "Exact gate: `ww pull && ww history`" with no preview wiring | j5:2107 | 10-15 | acceptance path | paraphrase
16. The Principal FAILED acceptance because the installed `tt live` showed the old renderer | j5:1983 | 10-14 | acceptance path | paraphrase
17. The Principal "rejected the technically passing default presentation" | j5:1841 | 10-12 | ww historical inventory | paraphrase
18. "SCA is the scoreboard. Sonar is the brutal arbiter of truth." | j2:367 | 09-03 | quality measurement | [D] (Principal attribution likely, not verified)
19. "The game with SCA isn't necessarily any score in a moment in time. It's trends." | j2:377 | 09-03 | | [D] (conversational, likely Principal)
20. "Well-written Java has three basic kinds of objects: State… Behavior… Creation… That's it. No more." | j2:204-210 | 09-03 | Java design taste | [D] (likely Principal)
21. "Why is an acquisition worker responsible for keeping provider authority healthy when acquisition isn't even permitted?" | j2:269 | 09-03 | control-plane separation | [D] "revealing question"
22. "Basis for what purpose?" | j2:1044 | 09-04 | XLE economic truth | [D]
23. "Maybe the Console isn't a visualization at all. Maybe it's a projection of the portfolio through a chosen operational axis." | j1:7747 | 08-19 | | [D]
24. "Would I still want this visible if I switched among Console, Deployment, and Production without changing the portfolio?" | j1:9457 | 08-21 | residency heuristic | [D] (first person)
25. "What does this screen already know that it currently makes the operator read instead of letting the operator see?" | j1:10440 | 08-25 | perceptual legibility | [D]
26. "What strategy, if any, is appropriate for today's market conditions?" | j3:931 | 10-02 | Market Shape discovery | [D]
27. "Kreature is always watching." | j1:8201 | 08-19 | | [D]
28. "Architecture should converge at the rate of learning, not the rate of spending." | j1:3262 | 07-03 | foundations critique | [D]
29. "If all conversation context vanished, could GitHub alone explain why Wheelwright looks and behaves this way?" | j1:5064 | 08-04 | | [D]
30. "Absence from the current projection is not evidence of absence from the source domain." | j1:5056 | 08-04 | | [D]
31. "Yield is the market's compression of multiple risk factors into a single price." | j1:3970 | 07-15 | market as oracle | [D]
32. "The operator console shows what IS. The diagnostic console shows what the system is DOING." | j1:4176 | 07-16 | | [D]
33. "These recommendations are valid; this search is incomplete." | j1:6466 | 08-11 | freshness | [D]
34. "Prefer non-eroding deployments. Admit an eroding deployment into the top set only when its economic advantage … is sufficient to justify the erosion…" | j1:6695 | 08-12 | | [D]
35. "Approved changes converge immediately to `main`. Deployment safety comes from verification, immutable artifact identity, rollback, and recovery…" | j2:66 | 09-03 | | [D]
36. "If switching Tradier to a hypothetical second provider requires broad frontend edits, the provider boundary is wrong." | j2:487 | 09-03 | | [D]
37. "If the frontend can change the economic truth by choosing a value, deriving a fact, or filling a missing field, the boundary is wrong." | j3:104 | 09-09 | | [D]
38. "Useful judgment does not authorize mutation of ratified authority." | j2:612 | 09-03 | | [D]
39. "Only automate architectural propositions we are prepared to defend independently of the code that happens to violate them." | j2:629 | 09-03 | | [D]
40. "Every cleanup intervention must name the future Wheelwright change it makes easier, safer, or cheaper." | j2:662 | 09-04 | | [D]
41. Six "-ities": usability, security, reliability, extensibility, maintainability, scalability | j5:394 | 09-22 | quality-attribute posture | paraphrase ("The Principal uses")
42. The Principal articulated the Roadmap as "self-documenting meta-state … kept fresh as a side effect of doing the work" | j5:157 | 09-20 | | paraphrase
43. The Principal "observed that Wheelwright automated testing had become too slow" | j3:643 | 09-14 | verification economics | paraphrase

## 4. Knowledge items

ID | title | ref | verbatim/gist | speaker | type | status | scope | points to | subject area | integrated? | needs Principal?

J-001 | Make right thing easy/known | j2:331 | "Make the right thing easy to do. Make what is right easy to know." [P] | Principal | PRINCIPAL-STATEMENT | as-recorded (stated axiom) | engineering system | tech-quality-constitution | engineering philosophy | NOT FOUND outside journal (whole docs/ grep) | Y
J-002 | Production-ready definition of done | j2:46 | "Environments provide progressively stronger evidence of readiness; they do not provide progressively weaker definitions of done." [P] | Principal | DECISION | accepted | release | development-workflow rule | delivery model | NOT FOUND in 4 target docs | N
J-003 | Three kinds of Java objects | j2:204 | "State… Behavior… Creation… That's it. No more." [D] | likely Principal | PRINCIPAL-STATEMENT | candidate | Java code | tech-quality-constitution | code design taste | NOT FOUND in 4 target docs | Y
J-004 | Workers execute; control planes control | j2:277 | "Workers execute. Control planes control. Persistence persists. Presentation projects." [D] | Kiro/session | ARCH-INVARIANT | candidate | backend | constitution v1 | responsibility boundaries | technology-quality-constitution-v1.md | N
J-005 | No Cartesian lifecycle state machine | j2:262 | "Do not encode the Cartesian product of independent concerns into one lifecycle state machine…" [D] | session | METHODOLOGY | candidate | backend | PL-PROV-FAILOVER | code design | NOT FOUND (inferred) | N
J-006 | Provider identity not a domain branch | j2:25-30 | Sandbox is a degraded evidence regime, not a second normal operating mode | Arch | ARCH-INVARIANT | accepted | provider | PL-PROV-FAILOVER | provider boundary | partly in 07-arch (not verified) | N
J-007 | SCA trends as scoreboard | j2:367-388 | "SCA regression is a build failure unless explicitly approved as an architectural exception." [D] | Principal/Arch | DECISION | ratified (09-03 graduation j2:617) | build | Sonar/ArchUnit | quality gates | constitution (inferred) | N
J-008 | Four-Actor model | j2:68-80 | Principal/Kiro/Codex/ChatGPT roles; Codex displaced speculative architecture conversation | session | METHODOLOGY | accepted | operating model | three-actor-model.md | actor operating model | constitution v1 only | Y
J-009 | Three-actor contract | j3:546, 589 | "Find freely. Block narrowly. Defer explicitly. Observe quickly. Ratchet what reality proves." [D, Principal-ordered persistence] | all actors | METHODOLOGY | ratified | operating model | closed-loop-engineering | execution discipline | parking-lot-8, supplementary/ai-assisted… (not foundations by exact phrase) | N
J-010 | Gen-29066 over-hardening failure | j3:484-492 | Legitimate findings repeatedly reopened authorized design; the observation window was lost | Kiro | LESSON-FROM-FAILURE | as-recorded | experiments | engineering-methodology rule | authorized-execution discipline | steering rule (authorized-execution discipline) | N
J-011 | BTS outcome displaced by machinery | j4:150-236 | "actors failed to preserve the simple objective while technically legitimate intermediate concerns became dominant" [D] | Kiro | LESSON-FROM-FAILURE | accepted | product delivery | shared-execution-contract | outcome-first execution | shared-execution-contract (inferred) | N
J-012 | Specimen-first loop | j4:233 | "real specimen → confirmed outcome → reconciled architecture → executable protection → implementation → continuous protection" [D] | Kiro | METHODOLOGY | accepted | all | PL-ARCH-FITNESS-01 | outcome verification | shared-execution-contract (inferred) | N
J-013 | BTC THIS PUT | j4:167 | "Wheelwright should directly say 'BTC THIS PUT.'" [P] | Principal | PRODUCT-REQUIREMENT | accepted (j4:242) | Console lifecycle | HOLD/CLOSE V1 | lifecycle decision UX | NOT FOUND (not checked beyond target docs) | N
J-014 | BUG-021 BTC netting | j4:276 | BTC debit netted against premium at the OPTION_PREMIUM source level (signed negative) | Kiro | DECISION | accepted ("not re-litigated") | Production accounting | BUG-021 record | production accounting | docs/bugs BUG-021 | N
J-015 | Unknown is not zero | j4:338 | "unknown prior consumption is NOT zero"; uncertainty preserved as a range | Codex+Principal | ARCH-INVARIANT | accepted | lifecycle | BUG-021 | uncertainty semantics | BUG-021 record | N
J-016 | Covered ≠ complete | j4:353 | residual [0,2] is covered but not retired; same-day ambiguity propagates | Codex | FINDING-THAT-CHANGED-ASSUMPTION | accepted | lifecycle | BUG-021 | lifecycle | BUG-021 record | N
J-017 | Single lifecycle authority (backend) | j4:338, 353 | frontend `isFullyClosed()` removed as a second authority | Kiro | ARCH-INVARIANT | accepted | FE/BE | ADR-016 | authority placement | BUG-021 record | N
J-018 | Known $0 vs null | j5:30-36 | "Affordability is a candidate property, not a Deployment/Explorer evaluation gate." [D] | Kiro, Principal-validated | ARCH-INVARIANT | accepted | Decision | zero-cash RCA | capital-state semantics | journal only (Principal disposition: journal, not BUG) | N
J-019 | Exact-zero Delta as unavailable | j3:401, 465 | greek usable only if finite AND nonzero; BUG-011 not fixed by Principal choice | Kiro/Principal | DECISION | accepted / BUG deferred | Console greeks | BUG-011 | evidence display | docs/bugs | N
J-020 | Downstream must not reconstruct authority | j3:335-342 | "transformation confers no authority"; third instance after ADR-015/016 | Kiro | ARCH-INVARIANT | accepted | FE/BE | Issue #16, ADR-015/016 | authority precedence | 07c-adrs (ADR-015/016) | N
J-021 | Fabricated CLOSED is more permissive | j3:342 | a "conservative" CLOSED_CANONICAL bootstrap was more permissive; pending authority fails safe | Kiro | FINDING-THAT-CHANGED-ASSUMPTION | accepted | session | Issue #16 | session semantics | NOT FOUND (inferred) | N
J-022 | Authority must reach the consumer | j3:341 | only consumer-path integration tests prove governance | Kiro | LESSON-FROM-FAILURE | accepted | testing | Issue #16 | verification | development-workflow "Authority Before Consumers" (partial) | N
J-023 | ADR-016 association is a claim | j2:1199 | "an identifier may only carry the guarantees it actually has" [D] | Arch (4AM) | DECISION | ratified | domain | ADR-016 | semantic authority | 07c-adrs | N
J-024 | Provenance needs a subject | j1:11707 | "provenance needs a subject" [P] | Principal | PRINCIPAL-STATEMENT | ratified (ADR-015) | evidence age | ADR-015 | provenance | phrase NOT FOUND outside journal | N
J-025 | Epistemic Integrity | j1:4778 | "must not communicate greater certainty, freshness, completeness, or authorization than its evidence supports" [D] | accepted principle | ARCH-INVARIANT | accepted | all | 07c-adrs | epistemic integrity | 07c-adrs, project-memory-protocol | N
J-026 | Yield not suppressed by execution | j1:5328 | "No execution rule should suppress a computable economic value" [D] | Arch | ARCH-INVARIANT | accepted | Decision | yield bug | economics vs execution | NOT FOUND in target docs | N
J-027 | Defensive max() rejected | j1:8814 | owned=max(observed, encumbered) is "epistemically dishonest" | Principal | REJECTED-DESIGN (internally inconsistent records) | rejected | portfolio | Portfolio Capital | inventory truth | NOT FOUND | N
J-028 | Option Summary is not a holdings ledger | j1:8839 | strategy-allocation view; Positions export is validation evidence only | Principal/Kiro | FINDING-THAT-CHANGED-ASSUMPTION | accepted | portfolio | Portfolio Capital V1 | broker evidence semantics | partial (BUG-001 contract, j4:126) | N
J-029 | Delta emergent, not a gate | j1:7064 | admissible delta range [0.25,0.40] caused the discrepancy; filter removed in BW | Kiro | FINDING-THAT-CHANGED-ASSUMPTION | as-recorded (experimental) | BW Decision | Production v0 | selection economics | NOT FOUND in target docs | Y (conflicts with vocab "Target delta 0.30")
J-030 | ATM-bias falsified | j1:6818 | the strike-surface evidence did not confirm the hypothesis | Kiro | FINDING-THAT-CHANGED-ASSUMPTION | falsified | BW | | selection diagnostics | journal only | N
J-031 | Non-eroding preference | j1:6695 | "Prefer non-eroding deployments…" [D] | Arch | DECISION | candidate | Deployment ranking | | capital-erosion policy | NOT FOUND in target docs | Y
J-032 | Global freshness needs a contract | j1:6466, 6478 | "These recommendations are valid; this search is incomplete." [D] | Arch | DOMAIN-DEFINITION | accepted | Write Desk | ADR-015 | admissibility | partial | N
J-033 | Active universe is a bounded resource | j1:11479-11492 | carrying capacity in decision surfaces, not tickers; no numeric cap ratified | 3AM ruling (Principal) | DECISION | ratified constraints; policies falsifiable | universe | PL-GOV | universe governance | NOT verified | N
J-034 | Boring Wheelwright, Weird Kreature | j1:11140 | Kreature as independent observer; fragility located at the browser/backend boundary (19 MB snapshot, 924 MB IndexedDB) | Principal direction | DECISION | accepted direction | topology | PL-ARCH-06 | architecture recovery | parking-lot.md | N
J-035 | Unstable React dep mimicked system failure | j1:11195-11215 | five system-scale hypotheses falsified; cause was a `[positions, generation]` dependency | Kiro | LESSON-FROM-FAILURE | as-recorded | debugging | | diagnostic method | journal only | N
J-036 | DTE-22 wrong diagnosis | j1:11303 | the claim "frontend never consumed chains" was falsified by the Principal | Kiro | LESSON-FROM-FAILURE | as-recorded | diagnosis | | evidence-decision coherence | journal only | N
J-037 | Persistence is not recall | j1:7505, 7560 | Failure A (persistence without recall) vs Failure B (recall without persistence); journal carries fidelity, not correctness | Principal/Kiro | METHODOLOGY | accepted | project memory | project-memory-protocol | project memory | project-memory-protocol.md | N
J-038 | Residency ≠ state ownership | j1:9533 | persistent residency is reserved for operator-orienting facts; capital triad is provisional | Arch | DECISION | provisional | app shell | | UI architecture | NOT FOUND | Y
J-039 | Reliability classes before services | j3:9, 45, 53 | rejected: "evidence acquisition is more important, therefore it should immediately become a separate microservice" | Arch | REJECTED-DESIGN (importance ≠ service boundary) | accepted | topology | | reliability architecture | NOT verified | N
J-040 | Dead surfaces with live coupling | j2:479-483 | deletion has architectural value beyond cosmetic cleanup | Arch | METHODOLOGY | accepted | cleanup | PL-CLEANUP | change-surface reduction | NOT FOUND in target docs | N
J-041 | Admission-budget-bound | j2:182 | "Wheelwright was admission-budget-bound, not provider-latency-… bound." [D] | experiment | FINDING-THAT-CHANGED-ASSUMPTION | as-recorded | acquisition | Doc 39/40 | constraint identification | Doc 40 (inferred) | N
J-042 | One owner per economic claim | j2:1086 | "An operator-visible economic claim should have one authoritative domain owner." [D] | Arch | ARCH-INVARIANT | accepted | domain | | authority | NOT verified | N
J-043 | Basis for what purpose | j2:1044 | "basis" depends on purpose (XLE) | Principal/Arch | DOMAIN-DEFINITION | settled why-state | cost basis | | economic truth | NOT FOUND in target docs | N
J-044 | Broker-native facts first | j3:914 | "preserve broker-native facts → classify account regime → project explicit Wheelwright decision semantics → apply policy" [D] | Arch | ARCH-INVARIANT | reconciled | Fidelity | PL-DEPLOY-BAL | broker semantics | NOT verified | N
J-045 | Market Shape → Structure Fit | j3:935, 1030 | strategy pipeline sequencing | Arch | DECISION | ratified (IC projection, j3:961) | strategy | | multi-structure strategy | NOT FOUND in target docs | Y
J-046 | tt product boundary / Ten-Second Read | j5:1190s | tastytrade is the workstation; Wheelwright is decision support; tt is the bridge; rebuilding tastytrade means something has gone wrong | Principal/Kiro | PRODUCT-REQUIREMENT | as-recorded | tt CLI | cli/tt-live-panel.md | product boundaries | NOT FOUND in docs/ | Y
J-047 | tt concern was a category error | j5:1190 | tt reading quotes is not a breach of single acquisition authority | Kiro | REPEATED-CONFUSION | corrected | tt | | invariant scope | journal only | N
J-048 | Independent visual meanings | j5:1722 | price movement, evidence age and expiration payoff are independent visual meanings; SPAN starts at the fill, no invented D21 | Principal/Codex | DOMAIN-DEFINITION | accepted | tt live | tt-live-panel.md | terminal visual grammar | cli doc | N
J-049 | Stop ≠ loss boundary | j5:1985, 2036 | UNG's gain-protecting stop falsified the assumption | Principal | FINDING-THAT-CHANGED-ASSUMPTION | accepted | TT Live | | position economics | NOT verified | N
J-050 | Acceptance on the installed path | j5:1983, 2107 | isolated replay or demo is insufficient; gate is `ww pull && ww history` | Principal | METHODOLOGY | ratified-by-practice | acceptance | shared-execution-contract | acceptance discipline | partial | N
J-051 | Technically passing ≠ accepted | j5:1841 | rejected about 15 lines of qualifications; tt live is the presentation standard | Principal | PRODUCT-REQUIREMENT | accepted | ww CLI | | presentation quality | NOT FOUND | Y
J-052 | Narrow evidence ≠ capability absence | j5:1845 | Codex overgeneralized; Account-value history is unverified, not absent | Kiro | REPEATED-CONFUSION | as-recorded | discovery | development-workflow "Existing Capability" | capability discovery | steering rule | N
J-053 | Show is inspection | j5:1579 | nine valid observations are not suppressed because a tenth subject is absent | Principal-ratified | DECISION | ratified | ww show | | CLI semantics | NOT FOUND | N
J-054 | Instance-resource URI retained | j5:1614-1626 | query proposal rejected; reversible path-symbol codec | Principal | REJECTED-DESIGN (Product change vs transport) | ratified | API v2 | | API design | NOT verified | N
J-055 | Membership vs order | j5:1648 | "biggest movers" selects by magnitude, then orders by sign | Principal | REPEATED-CONFUSION | corrected | CLI | | operator question semantics | journal only | N
J-056 | Tokens identify Users | j5:1696 | Accounts keep independent IDs; backend establishes membership | Principal | DECISION | ratified | auth | PL-ARCH-07 | identity/authorization | NOT verified | N
J-057 | Roadmap as meta-state | j5:157 | kept fresh as a side effect of the work | Principal | PRINCIPAL-STATEMENT | ratified | Roadmap | ADR-018 | project self-description | Roadmap docs (inferred) | N
J-058 | Exit Reliability | j5:1386 | likelihood that a complete position can be closed at a price represented by observed evidence | Arch | DOMAIN-DEFINITION | candidate | execution evidence | Doc 81, PL-10 | execution evidence | doc 81, parking-lot-10 | Y
J-059 | Interim v1 governance loosened | j5:1852 | v1 is soon to be replaced; governance focus moved to v2 | Principal | DECISION | as-recorded | v1 UI | | v1/v2 transition | NOT verified | Y
J-060 | Contaminated measurement stop rule | j3:663 | "stop measuring, disclose the limitation, and move forward" [D] | Arch | METHODOLOGY | accepted | experiments | | verification economics | NOT FOUND | N

## 5. Buried knowledge (journal-only)

Each concept was grep-checked against the four target docs; the wider docs/ check is noted where I ran it.

1. "Make the right thing easy to do / easy to know" (J-001). Absent from all of docs/ outside the journal.
2. Three-kinds-of-Java-objects design taste and the no-Cartesian-state-machine rule (J-003, J-005).
3. Known $0 vs unknown null, with affordability as an annotation rather than a gate (J-018). The Principal chose the journal over a BUG record for this.
4. Delta as an emergent property, not a governance gate (J-029). This tensions with domain vocabulary "Target: 0.30" and needs Principal reconciliation.
5. The non-eroding deployment preference and the capital-erosion finding (J-031).
6. A fabricated "conservative" CLOSED state is more permissive; pending authority must fail safe (J-021).
7. Diagnostic lessons from the navigation freeze and DTE-22 (J-035, J-036).
8. Technically passing ≠ Principal-accepted presentation, and acceptance only on the installed path (J-050, J-051).
9. The tt / tastytrade / Wheelwright product boundary and the Ten-Second Read (J-046, J-047). Absent from docs/; may exist in cli/.
10. "Basis for what purpose?", the rejected defensive max(), and "provenance needs a subject" as Principal wording (J-024, J-027, J-043).

## 6. Repeated confusions

- Unknown vs zero vs known-zero: deployableCash at j5:30; Delta 0.0 at j3:401/465; BUG-021 unknown consumption at j4:338; covered≠complete at j4:353; max() lower bound at j1:8814. At least five instances.
- Downstream reconstructing authority: ADR-015 (j1:11691), ADR-016 (j2:1199), Issue #16 (j3:335, explicitly "third instance"), the BUG-021 frontend resolver (j4:338, 353), and the URA split-brain (j5:612).
- Over-hardening displacing the observed outcome: gen-29066 (j3:484), BTS (j4:150-236, explicitly "same class"), isolated-replay acceptance (j5:1983), the isolated history demo (j5:2107), and the technically passing presentation (j5:1841).
- Premature system-scale diagnoses: navigation freeze (j1:11195), DTE-22 (j1:11303), ATM bias (j1:6818), the delta-range cause (j1:7064), and the spinner "two red herrings" (j3:245).
- Misapplied invariant scope or absence inferences: the tt single-authority category error (j5:1190), Codex's overgeneralized capability absence (j5:1845), and "absence from the projection is not absence from the source" (j1:5056).
- Operator-question semantics misread: membership vs sort order (j5:1648), and "all fields"/"default white" (j5:1643).
- Provider identity and sandbox treated as an operating mode (j2:25-30; the PL-PROV-FAILOVER separation-of-concerns correction at j1:12143).

## 7. Natural clusters

1. Epistemic integrity and authority placement: J-015/017/018/020-027/042.
2. Actor operating model and execution discipline: J-008-012/037/050/060, plus the human clipboard material (PL-ACTOR-01, outside the journal).
3. Code quality and architecture transmission: J-001/003-005/007/040.
4. Evidence appliance, acquisition and universe governance: J-006/033/039/041, Herbie (Doc 39/40).
5. Portfolio and production accounting truth: J-014/027/028/043/044.
6. Decision and deployment economics: J-026/029-032.
7. Console and terminal perceptual product design: J-013/038/048/051/055, plus j1:10440 and 7747.
8. Kreature and temporal observation: j1:8178-10956 and J-034.
9. Strategy expansion (XSP, tastytrade, Market Shape, Exit Reliability, collars): J-045/049/058.
10. v2 CLI, API and identity (ww/tt, URI patterns, tokens): J-053/054/056/059.
11. Project memory and self-description (Roadmap meta-state, cold-start failure modes): J-037/057.

RELEVANT FILES (ranked by importance):
  1. docs/journal/project-journal-2.md — Densest Principal axioms: production-ready, make-right-easy, Java taste, Four-Actor model, SCA, cleanup doctrine
  2. docs/journal/project-journal-4.md — BTS outcome failure lesson, specimen-first loop, BUG-021 uncertainty-as-state and single lifecycle authority
  3. docs/journal/project-journal-5.md — Zero-cash invariant, tt/Ten-Second Read boundary, acceptance-path discipline, v2 CLI/URI decisions, verbatim acceptances
  4. docs/journal/project-journal-3.md — Three-actor contract, gen-29066 failure, Issue #16 authority spine, Market Shape sequencing
  5. docs/journal/project-journal.md — Origin chronology: Evidence Appliance, epistemic integrity, persistence≠recall, 3AM rulings, diagnostic lessons, economics findings

NOTE: Line ranges have been extended by ~50 lines to provide additional surrounding context.