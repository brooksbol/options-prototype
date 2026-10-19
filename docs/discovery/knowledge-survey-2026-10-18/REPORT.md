# Workstream B Final Report: Knowledge Reconstruction Survey

- **Date:** 2026-10-18
- **Actor:** Kiro, Workstream B (evidence owner)
- **Classification:** internal, redacted, non-normative. This report is not authority.

## 1. Verified main

- **Survey baseline:** `bef03dd5db7cfa770023fd0a46af30d315734023` (ADR-023), remotely verified at the start of the session.
- **Main during the survey:** advanced to `d03d8d1ad8fd3db6bc8a1f586a13ae9a869f1873`. `git ls-remote` showed `origin/main` = local HEAD.
- **What changed:** 2 Principal commits (`8c59f15`, `d03d8d1`). They add only `docs/discovery/4am-csvlod-artifact-meta-standard-planning-snapshot-2026-10-18.md`. Surveyors confirmed that no other source they surveyed changed.
- **Working tree:** clean apart from two untracked directories:
  - this survey directory;
  - `docs/reference-data/kotusev/` (the PDF, not placed by Kiro).

## 2. Coverage and omissions

`coverage-ledger.tsv` is reconciled per segment: 5,004 heading segments in 411 knowledge-source files, 120,538 lines.

| Depth | Lines | Share |
|---|---|---|
| FULL | 92,980 | 77.1% |
| PARTIAL | 22,513 | 18.7% |
| INDEXED | 4,296 | 3.6% |
| SKIPPED | 419 | 0.3% |
| UNSURVEYED | 330 | 0.3% |

**Read FULL:**
- Doc 61 (all 45 sections, including the Operating Program, Construction, Mandate, Policy Rule and Wheel surveys).
- Doc 81 (all sections).
- Docs 47, 49, 50, 58 and 80.
- All six journal files, with entry bodies.
- All ten parking-lot files.
- ADR-001–022 bodies.
- Numbered docs 00–82.
- Foundations, except one PARTIAL file.
- Root governance, bootstrap, mandates, prompts and `.kiro/steering`.
- Most of the research.

**PARTIAL:**
- **SDB marker scan** of design, cli, contracts, api-v2, bugs, reviews, experiments, discovery, velvet-rope, universe, supplementary, historical and reference-data (~22.5k lines). It extracts lines carrying decision, acceptance or Principal markers. It does not interpret prose. This replaced the planned interpreted surveys after repeated sub-agent throttling and under cost constraints.
- **Research:** long external reproductions (Q0 §§5–21, Cashflow KB beyond l.96, Muse ETF tier tables, EVA muse-raw bodies) and the practitioner charter's schema sections.
- **`foundations/training-mode-exploration.md`:** 131–421 and 562–721 were indexed only.
- **Git:** 1,127 commit subjects were keyword-classified (235 flagged in `raw/surveyors/SGIT/commits-decisions.tsv`). Commit bodies were not read.

**SKIPPED:**
- `docs/development-machine.md` (sensitive: hardware identifiers).
- 3 research `.html` reports, whose `.md` analyses were read.
- 1 binary PDF.

**UNSURVEYED (330 lines):**
- `docs/reference-data/sonar/*` (2 files).
- Part of `docs/28a`.
- `options-prototype/README.md`.
- One test-resource README.

**Not done:**
- Interpreted (non-mechanical) reading of the SDB folders.
- Mapping of invariants to tests.
- Exact file:line inventory of policy literals in decision code.
- Commit-body archaeology.
- Deduplication of catalog rows.

## 3. Knowledge inventory

The interpreted surveyors produced 1,974 typed entries:

| Type | Entries |
|---|---|
| domain_semantic | 436 |
| principal_statement | 167 |
| contradiction | 154 |
| uncertainty | 86 |
| implementation_witness | 81 |
| falsified_assumption | 78 |
| operational_witness | 60 |
| precedent | 45 |
| rejected_design | 43 |
| operator_question | 41 |
| capability | 38 |
| other / learning / decision | remainder |

The SDB marker scan added 1,504 mechanical lines on top of these.

**Structural findings (with evidence):**
- **Ratified knowledge lives in non-canonical containers.** Doc 81 holds four Principal ratifications: the call, put and cash primitive-discovery closures, and the MVP 1 Solution Overview, capabilities and technology. Yet its header says "not ratified" and `docs/README.md:229` indexes it as "unresolved". Similar buried rules:
  - the 3AM universe ruling (journal only);
  - Portfolio Capital semantics, account locality, broker modularity and monitored-position observation (parking-lot rows only);
  - the decision-ingress rule (`parking-lot-9.md:1187`);
  - the incognito invariant (`parking-lot-9.md:769`).
- **Category A and pre-bootstrap context are stale relative to v2.** `07-architecture-current.md`/`07a` describe v1 only. Always-injected `.kiro/steering` contradicts ratified authority on about a dozen facts:
  - the backend-recommendation boundary;
  - the 1,286-symbol universe;
  - 0.9 req/sec and sandbox 60/min;
  - posture set, Nudge and Velvet Rope state;
  - test and invariant counts;
  - Shared Execution Contract "primary";
  - roles.

  Details are in SFND2 E044–E059 and SN0 E068.
- **Principal wording is sparse before September.** The July journal never names the Principal (SJ1A). Doc 61's survey sections are actor-curated, and the raw Principal text is not in the repository (S61B E058).
- **Many "Ratified"/"accepted" labels name no ratifier.** Most ADR-001–018 records say only "Accepted" (SPL1).

## 4. Principal Knowledge Review Catalog

`catalog/principal-knowledge-review-catalog.{jsonl,md}` has 784 rows:
- **269 read by surveyors.** Attribution: 36 explicit, 218 document-attributed, 15 inferred. Standing as recorded: 93 Principal-stated, 77 Principal-directed, 55 Principal-ratified, 28 Principal-accepted, plus superseded/falsified.
- **515 mechanical marker lines** that need interpretation.

Each row carries:
- stable `PKRC-####` ID and subject;
- exact original statement;
- path, section and lines;
- speaker and confidence;
- date and date confidence;
- variants, standing, applicability, related concepts;
- proposed destination, and classification (default `unresolved`).

**Verified specimen statements:**
- **"Technically correct is the worst kind of correct."**
  - Location: `4am-knowledge-architecture-learning-loop-snapshot-2026-10-18.md:74`.
  - Git: first in `f2f9022`, absent from all earlier history.
- **"we learn something, we leave it where it is"**
  - Locations: learning-loop snapshot `:13`, inside the longer quote "we started this project with the notion of a learning cycle…". Also preratification `:12`.
  - Git: first in `f2f9022`.
  - This corrects SJ5's "preratification only".
- **"i want every new thread to know what's important. i never want to have to say "it's in the repo" again."**
  - Locations: learning-loop `:23`, preratification `:15`.
- **"with the transition to v2, we are no longer building a prototype."**
  - Location: preratification `:18`.
  - Git: first in `995b033`.
- **URI statement:** "The principal can detect design flaws in a rest api just by looking at the uri patterns."
  - Location: `foundations/principal-rest-uri-design-review-intent-2026-10-18.md:5`.
  - Git: `9acb513`.
- **"Make the right thing easy to do. Make what is right easy to know."**
  - Location: `journal/project-journal-2.md:331`, attributed to the Principal at :329. Repeated at :596.
  - Variants:
    - `principal-decision-surface.md:9`, "Make the right thing to do the easy thing to do." (Purpose line, unattributed);
    - Doc 61:4702, "Make the right thing to do the easiest thing to do." ("original sentiment").
  - Git: first in `c48f83a` (2026-09-03).
- **Six personal objectives:** `principal-personal-objectives-2026-10-14.md`, **lines 7–12, not 9–14**. Line 14 forbids relabeling them as LVT Goals. Git: `afeba42`.
- **Other high-value explicit statements:**
  - "Don't make me think unnecessarily, otherwise I may become emotional and make a mistake." (Doc 61:4718)
  - "Keep my shares until it is foolish to keep them." (Doc 80:58)
  - "Growth Wheel supplies a share-retention / ownership preference. It supplies no implied bullish or bearish market bias." (Doc 81:982)
  - "provenance needs a subject" (journal:11707)
  - "Common interface does not require common capability" (journal:12206)
  - "SCA is the scoreboard. Sonar is the brutal arbiter of truth." (j2:367)
  - "Consider this a contract between three actors…" (j3:589)
  - "we've shifted our governance focus to v2 and loosened our grip on v1" (j5:1852)
  - "Unix commands, not War and Peace." (PL-10:276)
  - "no environment variables allowed in acceptance testing" (PL-10:1413)

## 5. Decision candidates

`catalog/decision-inventory.{jsonl,md}` has 583 candidates; 534 were read by surveyors.

**Authority class as recorded:**

| Class | Count |
|---|---|
| Principal-directed | 142 |
| Principal-ratified | 111 |
| proposal-only | 84 |
| Principal-accepted | 80 |
| actor-decided-under-delegation | 58 |
| inferred-from-implementation | 51 |
| unrecorded | 5 |
| Principal-stated | 3 |

ADR-001–022 are included as records. Most "Principal-accepted" ADR classes are inferred from register status.

Consequential decisions outside the ADR register:
- Doc 81: call, put and cash closures; the MVP 1 Solution Overview; the 7-capability decomposition; the technology direction "Direct, typed, deterministic functions…" (CEL/DMN rejected); backend placement (§30).
- Doc 82: regime scope and v2 resource candidates. Doc 77, with its Oct 11 and Oct 13 amendments.
- Doc 65's Wheel rules. Doc 69: Program vs configuration version.
- The 3AM universe-governance ruling (journal, 08-27).
- Provider-failover three-layer design (PL-3, "ADR owed").
- Portfolio Capital V1.
- `docs/bugs` replacing GitHub Issues.
- Installed-path acceptance gate (`ww pull && ww history`).
- v1 governance loosening (10-12).
- The Principal git workflow, which exists in steering only.

**Unlabeled reversals:**
- bare `ww fetch`;
- held-GET no-contact;
- fetch success semantics (Oct 3 → Oct 5);
- Unencumbered Shares exclusions;
- the ww language gate.

## 6. Domain findings

`domain-semantics.md` has 1,004 items. **Nothing below is ratified by this survey**, and conflicts are not resolved.

- **Account vs Regime.**
  - "Account identity or account accounting/execution context does not establish that operating regime" (82:9, ratified Oct 7).
  - Doc 58:125 still defines Account Regime as an account property. These may be two concepts (82:11).
- **Position.**
  - Doc 58 says no universal identity.
  - Doc 82:104 makes Position the default decision subject, without cross-reference to 58.
- **Governed Quantity.** A phrase, not an entity. The thread runs 58:130 Inventory Block → 69 → ADR-022 cohort → 82:110 "escape hatch". The 250 SPY 150/100 split is the anchor specimen (81:62–76).
- **Operating Program vs Regime vs Mandate.**
  - Program is well defined. Doc 69 ratifies `assignment-centric-wheel`/config `1`.
  - No document relates Operating Regime to Operating Program.
  - Mandate binding was falsified at every scope tried, and Decision Aspect was rejected (Doc 61 §31–35).
  - Purpose is upstream provenance, not runtime input.
- **Capital and cash.**
  - A short put is liability plus contingent acquisition.
  - Cash availability depends on purpose.
  - "idle capital is not automatically failed capital".
  - Settled cash ≠ buying power.
  - Productive output ≠ capacity.
- **Recommendation, Decision, Execution, Outcome.**
  - Recommendation ≠ selection ≠ order ≠ execution ≠ disposition ≠ lifecycle fact.
  - Outcome stance (ALLOW EXPIRATION/ASSIGNMENT) ≠ action ≠ completed outcome.
  - WAIT, HOLD, LET RESOLVE and NO TRADE are not synonyms. "insufficient evidence is not automatically WAIT".
  - Posture (ACTIONABLE/EDGE/WAIT) is execution quality, not recommendation strength (18:87).
- **Policy literals.**
  - The 0.30Δ / ~21 DTE / 7–45 figures are v1 code values with no ratified policy authority. "Target DTE 21… NOT established operator policy" (21-primary:398).
  - The practitioner corpus never tests them.
  - Covered-call delta targeting hid the posture the operator actually traded (Doc 50).
- **Evidence and provenance.** "Evidence belongs to providers; Facts belong to Wheelwright." Replay persists the values that DECIDE consumed (Doc 61 §43–44, ADR-019).

## 7. Precedents

`precedents.md` holds 45 specimens:
- GDXJ covered call LET RESOLVE (Doc 61);
- PTS vs Sawdust mandate contrast;
- 99-share feasibility vs preference (81 §6);
- 250 SPY split governance;
- DBO $21 put "BTC THIS PUT" red vs DBO buy-write / PDBC ITM covered call not red (j4:167, 246–262);
- the lived ATM covered-call trade done off-tool (Doc 50; negative specimen);
- the Doc 64 frozen Console specimen (proof = "truthfully state and preserve what the selected governed Program prescribed");
- MVP 1 acceptance cases (81 §27);
- the ww twelve-question probe;
- Partial Collar Test 1 FAIL (Principal-accepted).

## 8. Implementation witnesses

`implementation-witnesses.md` holds 141 doc-derived witnesses. Directly observed facts are in `raw/surveyors/SWIT/witnesses.md`, taken at 2026-10-18T23:32Z.

**Running processes:**
- **v1 on :3100:** `bootRun` from the working tree since Oct 16 11:12, **version unknown**.
- **v2 on :3101:** release jar `pl-cli-01-update/operational-20261015-r2` on `data/positions-v2.sqlite3`.
- Both `/api/health` endpoints return `{"status":"up"}`.

**Installed CLIs:**
- `ww` → `pl-cli-01-positions/operational-20261015-3de8dce`.
- `tt` → the working-tree `scripts/tt`.

**Releases and tooling:**
- 7 release lineages exist.
- Deploy and recovery tooling lives outside Git: `deploy.py`, `DeploymentOps.java`, `integrity.py`, rehearsal harnesses, incident JSON.
- There is no version endpoint.

**Databases:**
- Both share migrations 001–020.
- The v1 database also records **`002_priorities.sql` (applied 2026-07-20) with no source anywhere in Git history**.

**Source facts:**
- 35 v1 `/api/*` mappings; 16 v2 mappings over 13 `/v2/*` paths.
- 844 Java `@Test`; 2,173 frontend `it`/`test`.
- The only CI publishes the API v2 docs.

**Calendar:** 2026-only tables are duplicated in four components, and early-close times differ: 13:30 incl. delay, 13:00, and 13:15.

## 9. Contradictions and uncertainties

`contradictions.md` lists 361 items. The most consequential:

1. **Backend recommendation authority.** Steering `architecture.md:44`, INV-BOUND-01 and evidence-appliance OQ4 conflict with PRIN-ARCH-BACKEND-AUTHORITY (Oct 11), Doc 77:28, Doc 81 §30 and ADR-019.
2. **Constraint investigation status.** Steering says "ACTIVE", README says historical, and the tech-quality AcquisitionWorker freeze depends on which is true. The journal's Sep 1 "provider-bound / coverage complete" claim conflicts with "Herbie has not been identified". The pacer change appears to violate Doc 39c:563–588 without a recorded operator override.
3. **URI shape.** Account-nested URIs (Doc 82:71–77) conflict with Doc 77:67 (no FK nesting).
4. **Actor roles.** Codex is Architect in some places, Kiro in others. "Codex implements" (idea-intake:289).
5. **Status vocabulary.** The same decision is called "ratified" in §45 and "Accepted" in ADR-019. Doc 31/32 ratification is ambiguous.
6. **Policy over Prediction vs EVA.** EVA's "Forecasting is acceptable" (CONVERSATION-RECOVERY:26) is not reconciled.
7. **Corpus self-contradiction.** v1.1 states 9/3 and 7/2/3 in different places. The rejected reconciliation is unmarked, and PL-RESEARCH-05 is stale.
8. **Index integrity.** `docs/README.md` says ADR-001…022. `roadmap-priority.md:34` cites a nonexistent ADR-024. Journal-5 entries after Oct 15 use `###` headings and are invisible to `##` indexes.

## 10. Artifact paths and durability

All artifacts are under `docs/discovery/knowledge-survey-2026-10-18/` (14 MB). See `README.md` for the full map.

They are **UNTRACKED and uncommitted, so not durable GitHub memory.**

> **Current Git state (note added October 19, 2026):** this section's durability and persistence statements are historical, as of authorship. The directory was later committed to `main` in the Principal's push `cbcc55b` (October 18, 2026); see `README.md` in this directory. Being committed does not change the survey's non-normative standing or resolve the review items listed below.

- **Persistence:** pending Principal decision A (checkpoint `ef5c54c`).
- **Session record:** the 2026-10-18 entry in `docs/journal/project-journal-5.md` records the paths and state.

**Protection:**
- The regex scan found zero account, brokerage-ID, email, UUID, serial or personal-name matches.
- All dollar amounts of $1,000 or more were replaced (92).
- `raw/prior-ledgers/` (7 redacted files) and every verbatim cell still need **human review before commit**.

**Sensitive content in tracked sources (not copied here; Principal decision needed):**
- account numbers at `docs/07c-adrs.md:778` and `docs/parking-lot-9.md:249–250`;
- 14 tracked docs with 21 account-number-pattern tokens (prior session);
- real balances in several PL and journal records;
- `docs/development-machine.md` hardware identifiers.

ADR-023 forbids history rewriting without authority; nothing was changed.

**Cleanup:** temporary tools in `/tmp` were used and the large render images were removed.

## 11. Challenges to Codex (Workstream A / A8)

Each challenge is evidence-backed. Kiro has not edited any Codex-owned artifact.

1. **Taxonomy size.** The canonical v3.0 diagram has **34** artifact titles, not 24 (`kotusev-v3-name-verification.md`). Outlines and Designs split into Solutions (Project Mode) and Products (Product Mode). Wheelwright's product-mode work makes Increment Overviews/Increment Designs and Product Roadmaps/Product Diagrams relevant. Their category placement is still unverified.
2. **Subject boundaries must allow mixed-status documents.** Docs 81, 61, 82 and 77 each mix ratified, accepted, proposal and falsified content inside one file. File-level classification will misroute them; this supports ADR-023's rejection of file-level authority.
3. **Pre-bootstrap context is the largest single hazard.** Every new Kiro session gets the stale steering (RC-04, RC-12). A8 and the context-delivery design should treat injected context as a routed view with a currency obligation.
4. **Authority-class inference.** Many "Ratified/Accepted" labels name no ratifier (ADR-001–018, the 3AM ruling, Epistemic Integrity). Rules need an explicit `authority unrecorded → UNRESOLVED` branch (RC-18) rather than promotion.
5. **The regression suite needs realization events with unknown versions** (RC-09, RC-10). v1 runs unversioned, and one applied migration has no source.
6. **Governed Quantity / Position exemplar.** If A's exemplar treats Position as primary, it must reconcile Doc 58 §21.1 with Doc 82:104 and the 250 SPY split (81:62–76). Neither document cites the other.

## 12. Remaining work

1. **Interpret the SDB marker-scan folders.** These are design, cli, contracts, bugs, reviews, experiments, discovery, velvet-rope and universe. Interpreting them is the main Workstream B coverage gap.
2. **Deduplicate and cluster** catalog and decision rows into variant groups. This is needed before Principal review.
3. **Run a human review of redaction** in `raw/prior-ledgers/` and in verbatims.
4. **Map invariants to tests**, and inventory policy literals at exact file:line.
5. **When A8 exists,** falsify it with `meta-standard-regression-cases.md` RC-01…RC-19.

## Decision surface for the Principal

- **A. Persist the survey.** Commit this directory to `main` as classified, non-normative survey evidence, after your redaction review of `raw/prior-ledgers/`. Alternatively, keep it local.
- **B. File BUG-043.** Copy the draft into `docs/bugs/`, add the INDEX row and regenerate the roadmap projection. BUG-043 is the next free ID. Filing does not authorize remediation.
- **C. Tracked sensitive identifiers.** Decide how to handle the account numbers in tracked docs. Any history rewrite is high-risk and irreversible for clones; a forward-only redaction commit is the lower-risk option.
