# Wheelwright Technology Quality Program — Version 1

**Mandated and ratified:** September 3, 2026  
**Status:** Principal-mandated program — execution required  
**Authority:** Category C — Canonical Project / Operational State for the technology-quality program  
**Principal mandate:** This program is both **ratified and mandated**. It is not an optional recommendation, a parking-lot seed, or a discretionary cleanup proposal. It establishes the required path by which Wheelwright will reach and then sustain the technology-quality condition expected by the Principal.  
**Constitutional authority:** `foundations/technology-quality-constitution-v1.md`  
**Related:** `architecture-roadmap.md`, complete `parking-lot*.md` sequence, complete `journal/project-journal*.md` sequence, `foundations/closed-loop-engineering.md`, `foundations/architectural-evolution-methodology.md`, `foundations/idea-intake-reconciliation.md`

---

## 1. Program purpose

The Technology Quality Constitution defines the principles by which Wheelwright's technology architecture is governed. This program converts those principles into an executable sequence of work.

The program exists to move Wheelwright from its current partially understood implementation condition to a state in which:

- architectural intent is visible in repository structure and code shape;
- implementation quality is measured with reproducible evidence rather than intuition;
- dead, obsolete, duplicated, and misplaced structures are explicitly reconciled;
- important architectural characteristics are known and managed;
- technology condition is visible through a multidimensional Architecture & Quality Balanced Scorecard;
- material quality risks produce a deliberate internal technology-optimization roadmap;
- appropriate mechanical and architectural fitness controls are integrated into CI/CD only after they have earned that authority;
- day-to-day architecture and implementation work follows the Technology Quality Constitution without requiring repeated rediscovery; and
- technology optimization becomes a standing operating responsibility rather than another episodic cleanup campaign.

The desired outcome is not "zero findings" or a cosmetically clean scanner report. The desired outcome is a Wheelwright codebase whose quality, architecture, and capacity for economical change are understood, intentionally governed, and continuously improvable.

---

## 2. Mandate and authority

The Principal has ratified the Technology Quality Constitution v1 and mandates execution of this program.

This mandate establishes **sequence and obligation**, not blanket authorization for arbitrary remediation.

The following work is authorized by this program without requiring a new idea-intake decision for each step:

- documentation and authority reconciliation required to establish the program;
- selection and configuration of analysis tooling for the untouched baseline, subject to this Program and the Baseline Charter's disclosure and data-custody restrictions;
- read-only static, dependency, security, topology, architecture-coherence, test/evidence, and coupling/changeability analysis;
- preservation and interpretation of baseline evidence;
- construction of the initial Architecture & Quality Balanced Scorecard;
- reconciliation of existing parking-lot identities into the program;
- repair of project-memory and journal discoverability;
- production of a proposed technology-optimization roadmap from evidence;
- design and shadow evaluation of candidate fitness functions.

This mandate does **not** automatically authorize:

- production-code remediation merely because a scanner reports a finding;
- restructuring `AcquisitionWorker` while the active provider-admission/constraint investigation remains open;
- deleting code before live/dead/redundant status is established and the deletion is properly reconciled;
- introducing a new framework, service boundary, database, infrastructure platform, architectural pattern, or object ontology without demonstrated pressure and the normal architecture process;
- uploading source or analysis results to a third-party service without explicit Principal authorization;
- promoting an observational metric directly to a CI gate; or
- changing Category A product/system meaning, ratified ADRs, or behavioral invariants without their normal authority process.

The Constitution governs **how** this program executes. Existing Category A/B authority continues to govern **what Wheelwright is and must do**.

---

## 3. Program operating model

This program is the technology-optimization expression of Wheelwright's broader operating model.

Wheelwright separates three related management concerns:

1. **Strategic planning** — what outcomes and product capabilities Wheelwright should pursue.
2. **Initiative delivery** — how authorized product and architectural changes are designed, implemented, verified, and accepted.
3. **Technology optimization** — how the health, coherence, sustainability, and changeability of the technology estate are measured and deliberately improved.

The Technology Quality Program owns the third concern. It informs the other two but does not replace them.

Accordingly, Wheelwright maintains two distinct but connected roadmaps:

- the **architecture roadmap**, which records structural evolution required by product/system direction; and
- the **technology-optimization roadmap**, which records evidence-supported interventions required to improve or preserve technology quality.

An item may affect both roadmaps. The distinction is the reason for the work, not necessarily the files changed.

### Standing loop

After the initial program reaches steady state, technology optimization operates continuously as:

**Measure → understand → identify material constraint/risk → choose bounded intervention → change → evaluate → repeat.**

This loop is evidence-driven. It does not create a permanent generic technical-debt queue.

---

# 4. Program workstreams and sequence

The workstreams below form the mandated path. Some may overlap where doing so does not contaminate the untouched baseline or violate an active investigation boundary.

## Workstream 0 — Establish durable program authority

**Objective:** Make the Constitution and this Program reliably discoverable and establish one unambiguous program identity.

Required actions:

1. Preserve `foundations/technology-quality-constitution-v1.md` as the governing Category B methodology.
2. Preserve this document as the canonical Category C program state.
3. Add both documents to the appropriate documentation reading paths and indexes.
4. Ensure future actor bootstrap paths route architecture/implementation-quality work through the Constitution and active program state.
5. Record versioning explicitly: Constitution changes require Principal ratification; program state may evolve as execution produces evidence, while material changes to mandate/scope require Principal ratification.

**Exit:** A cold actor can identify the governing quality principles and current quality program from repository authority without reconstructing this conversation.

## Workstream 1 — Reconcile existing parking-lot identities

**Objective:** Make the canonical backlog accurately express the new program without inventing tool-specific or duplicate identities.

Required reconciliation:

### `PL-COHERE-01` — Architecture-to-Code Coherence Assessment

Retain as the primary existing program-related architecture identity. Reconcile it to the Constitution and this Program so that it owns architecture-to-code coherence and the baseline/reconciliation work already within its scope.

Its historical temporal-coherence findings remain valid why-state. The new quality program broadens the evidence context around it; it does not erase those findings.

### `PL-CLEANUP` — Active Holistic Cleanup

Retain as a **bounded intervention**, not the technology-quality program itself. Its work should be informed by baseline evidence and the technology-optimization roadmap. It must not become the permanent destination for every quality finding.

### `PL-OPS-06` — Dead Pipeline Retirement

Retain as known concrete deletion work. Treat it as a companion to live/dead/redundant topology analysis and deletion hygiene. Known dead code should not receive local quality remediation before deletion unless required for safe removal.

### Other related items

Review the complete `parking-lot*.md` sequence for items that overlap architecture coherence, craftsmanship, dead-code retirement, CI/CD, security/dependency health, cloud readiness, or implementation structure. Preserve stable IDs and explicit dispositions. Merge or map concepts where appropriate; do not silently delete history.

**Explicit constraint:** Do **not** create a Sonar-specific parking-lot item. Sonar or any replacement analyzer is a tool within the evidence capability, not a product/program identity.

**Exit:** Every existing quality/coherence/cleanup item has a clear relationship to the program and there is no competing generic quality backlog.

## Workstream 2 — Complete project-memory and journal routing

**Objective:** Eliminate the discoverability defect exposed by the September 3 journal continuation.

The repository now states that numbered project-journal files form one logical chronology. Complete the operational consequence of that rule:

1. verify `docs/README.md`, shared project-memory protocol, ChatGPT bootstrap, Kiro bootstrap, and any journal index/routing language consistently refer to the complete `project-journal*.md` sequence;
2. ensure topical retrieval does not stop at `project-journal.md` merely because it is the original file;
3. ensure the Technology Quality Constitution and Program are discoverable through the normal architecture/quality reading path;
4. remove or correct stale routing statements that would cause a cold actor to miss later journal continuations; and
5. preserve the journal as why-state rather than turning it into competing current authority.

**Exit:** A cold-start test can recover the September 3 quality discovery, the Constitution, and this Program by following repository instructions alone.

### Documentation architecture and governance cleanup — Principal scope decision, October 19, 2026

**Status:** Principal-approved roadmap/workstream placement. Bounded corrections executed October 19, 2026. **Not closed:** final independent verification and the Option A API documentation publication repair (candidate `86d73b7`, review pending) remain open (closeout record below). This is program state, not ratification of the survey's candidate repairs.

The Principal directs that the **documentation architecture and governance cleanup initiative as a whole** belong in **Technology Quality Program Workstream 2**, with an explicit relationship to the existing active `PL-COHERE-01` architecture-to-code coherence identity. This extends Workstream 2 beyond its original journal-continuation routing specimen to include authority discoverability and documented coherence across architecture, ADRs, principles, API contracts, maintained domain knowledge, actor bootstrap and generated project-state projections. It does **not** replace the original Workstream 2 obligations, create another `PL-*` identity or Lean Value Tree Bet, or redefine `PL-COHERE-01`'s historical temporal findings.

**Intended outcome:** A fresh actor can find and apply governing architectural meaning without knowing numbered document filenames; current and historical standing, unresolved Product decisions, and execution authority remain distinguishable; known stale references and generated-state defects are corrected; verification is repeatable with the existing tools.

**Execution shape (proposed, not automatically authorized by this placement):**

1. Reconcile the repository-wide survey's findings against current `main`; correct evidenced navigation, source/status, ADR lifecycle presentation, and steering-currency problems while preserving original provenance and the A–F model.
2. Verify the roadmap projection parser's identity semantics before regenerating the derived projection. Reuse existing tests, projection freshness checks and knowledge validation; add only warranted, narrowly scoped regression coverage. Do not hand-edit generated state.
3. Obtain bounded independent verification of the final revisions and representative cold-start routes, record exact checks and dispositions, and close this **bounded documentation cleanup** only after confirmed in-scope defects and derived freshness are resolved or explicitly dispositioned.

**Historical evidence and open boundaries:** The October 2026 documentation survey and follow-up Codex/Kiro reviews are evidence, not automatically ratified changes. Candidate conflicts involving defect channels, Class A freshness, Doc 81 standing, steering-only policies, or external GitHub issues require their own evidenced disposition and any necessary Principal decision. `ASSIM-0002` Position identity, Operating Regime/Program representation, comprehensive compatibility policy, and other open Product decisions do not block documentary coherence when accurately labeled and routed.

**Completion proof:** No unclassified survey findings; every confirmed in-scope repair verified against exact committed source; original ADRs and historical records preserved; no duplicate canonical authority; roadmap generation and freshness checked after source/parser correction; representative cold-start retrieval independently verified; a durable closeout record points to the accepted commits and unresolved exclusions. This does not authorize backend/runtime, API, trading, external-issue, CI enforcement, or `ww live` changes.

**Provenance:** Principal selection of Option A in the documentation-architecture review thread, October 19, 2026; existing `PL-COHERE-01` and this Program provide canonical ownership. The repository-grounded survey and Experiment 2 assessment remain supporting discovery/provenance, not replacement authority.

#### Closeout record — October 19, 2026 (implementation evidence; not yet closed)

Kiro prepared this record as implementation evidence. It is not independent acceptance of Kiro's own corrections.

**Commits on accepted `main`:**

| Commit | Scope | Independent disposition |
|---|---|---|
| `c134125`, `7ca034b` | `docs/README.md` index/route repairs; `07c-adrs.md` register header | Earlier increments of this cleanup |
| `f34ed32`, `eeeaa56`, `4411d7a`, `2ceab57` | Roadmap parser AR identity consolidation, dated/shared reconciliation preservation, regression fixtures, regenerated projection | `2ceab57`: ACCEPT WITH NONBLOCKING FINDINGS (independent Kiro review, relayed by the Principal's conduit; report not persisted in-repo) |
| `1841525` | Thirteen-file ordinary corrections: BUG index table, Doc 77 BUG-035 state, Minimum Safe Bootstrap owner, snapshot-contract test path, payoff screenshot custody, survey commit status, index routes, steering pointers | ACCEPT WITH NONBLOCKING FINDINGS (independent Codex review, relayed; report not persisted in-repo) |
| `b9d7264` | ADR-008 applicability note; roadmap-priority ADR-024 citation; Doc 63/65 routes and non-exhaustive index note; nudge vs forced-acquisition reconciliation (`PL-OPS-08`); Constraint Identification dated status; Category A numerical routing; RoadmapView Log test bound derivation; regenerated projection | **Pending independent verification** |

**Validation at `b9d7264`:**
- `check-knowledge-slice.py`: `--self-test` PASS, `--local` PASS, `--remote b9d7264` PASS (all structural only).
- `npm run check:roadmap-projection`: in sync.
- `npx vitest run tests/roadmap/`: 4 files, 178/178 passing. The Log test failure that predated these corrections is repaired by deriving its bounds from the rendered projection.
- `git diff --check`: clean.
- Projection substantive diff, by inspection: only the ADR-008 `consequences` text, the priority #9 `reason`, and `generatedAt`.
- Representative cold-start routes resolve: root `AGENTS.md` → `docs/AGENTS.md` / `docs/README.md` / `knowledge/README.md` / `assimilation-obligations.md`; `docs/README.md` → this Program, `architecture-roadmap.md`, Doc 77, Docs 63/65, journal continuations; `project-memory-protocol.md` → `docs/AGENTS.md`.

**Open finding: API v2 documentation publication identity.** Under `bootstrap/api-v2-documentation-update-procedure.md` §2/§4:
- *Baseline.* The deployed baseline is run `38840860205` (source `011defb`, build and deploy success). No trigger-set path changed since that baseline. Live `index.html` and `LICENSES.txt` are byte-identical to an accepted `--publish` build at `2ceab57`.
- *Failure.* At `1841525` and later, `build.py --publish` fails with "generated preview differs from accepted artifact" (`ACCEPTANCE_PENDING` / identity mismatch).
- *Cause.* The public "Recent contract changes" list uses `git log -5 -- docs/contracts`, which also counts non-v2 files. `1841525` touched `docs/contracts/evidence-snapshot-v1.md`, which added a public changelog line.
- *Probe.* Locally narrowing that pathspec to `docs/contracts/api-v2-*` reproduces the accepted preview hash exactly. The probe was reverted and not committed.
- *Consequence.* No run was triggered and the live site is unaffected. The next trigger-set push will fail closed at `--publish` until this is reconciled.
- *Remedies.* Either a §3 identity refresh with review of the changed public bytes, or a reviewed tooling correction. Both lie outside ordinary documentation cleanup.

**Principal decision, October 19, 2026: Option A (reviewed tooling correction).** Kiro prepared candidate `86d73b739ec7cf175ee44f133af48777c1eea9d7`, based on `01efa32`. It is committed but **deliberately not on `main`**: a push touching `tools/api-docs/**` or `docs/api-v2/**` triggers the Pages workflow, which would publish once identity passes.
- *Changes.* `tools/api-docs/build.py` scopes the public changelog to `docs/contracts/api-v2-*` (the accepted contract inputs and workflow trigger set). `tools/api-docs/validate.py` adds a regression: the public changelog must equal the API v2 contract history derived independently from `release.json`'s accepted inputs, and no commit touching only other `docs/contracts` files may appear. `docs/api-v2/README.md` now says the historical Step 3 review preceded the October 15 publication and that later changes follow the adopted procedure.
- *What the narrowing excludes.* Only the seven commits that touched nothing but `docs/contracts/evidence-snapshot-v1.md` (including `1841525`). No commit touching an `api-v2-*` file is lost (27 of 27 retained).
- *Validation at `86d73b7`.* Procedure §3 passes:
  - OAS conformance: 19 operations.
  - `validate.py`: internal 19 operations / 134 examples; public 15 operations / 106 response examples.
  - `human-specimen.mjs`: PASS.
  - Two preview builds are byte-identical.
  - Preview `index.html` equals the accepted `acceptedPreviewSha256`, and `LICENSES.txt` matches.
- *Falsifier.* The new regression fails against a build made with the old `docs/contracts` scope ("Public changelog differs from API v2 contract history").
- *Historical baseline.* The corrected generator at the accepted source `c2f44a3` reproduces the accepted preview.
- *Expected refusal.* `--publish` at `86d73b7` refuses only `docs/api-v2/README.md` as an unaccepted contract input. That is the procedure's identity gate working, and it was not bypassed.
- *Simulated refresh.* A §3 identity refresh simulated on the clean candidate, never committed, changes only `acceptedSource` and the README input hash, keeping `publicationDate` 2026-10-15. Its `--publish` output passes `validate.py` and `human-specimen.mjs` and is byte-identical to the live `index.html` (`f8c5f1b6…c411`) and `LICENSES.txt` (`56872a8c…f377`).
- *No publication.* No push of `86d73b7`, no workflow run, no deployment and no `release.json` change has occurred.
- *Pending step.* Independent review of `86d73b7`. Then the procedure §3 refresh with `DOCS_ACCEPTED_SOURCE=86d73b7…` (publication date unchanged, since the public bytes are unchanged), the §4/§5 push, run observation and live comparison.

**Exclusions — independently governed, not bounded-cleanup work:**

| Item | Owner / scope | Why excluded |
|---|---|---|
| Class A freshness 15 vs 25 min | `foundations/acquisition-scheduler-policy.md` and `07-architecture-current.md` (both Category A); `SchedulerConfig` | Policy conflict. Both sources now carry a routing note; no value is selected here |
| Velvet Rope runtime admission | `foundations/cognitive-role-separation.md` vs `foundations/secondary-observation.md`; `src/velvet-rope/` | Code presence is not live operational use; Product/Principal question |
| Position / Governed Quantity identity | `knowledge/domain/positions-and-governed-quantity.md`; `ASSIM-0002` **PENDING** | Open semantic decision. `ASSIM-0001` remains **VERIFIED** |
| Constraint Identification continuation | `roadmap-priority.md` #4; Docs 39/40; steering | Dated status now qualified; resumption or termination is a Principal sequencing decision |
| Forced acquisition vs "refresh belongs in diagnostics" | `foundations/evidence-appliance.md` Refresh Semantics; `PL-OPS-08` | The foundation text accurately describes nudge. Whether the Console placement of forced acquisition conflicts with it is not decided here |
| Parser latent edge cases (undated/shared headings, code fences) | `roadmap-projection-parsers.mjs`; `2ceab57` nonblocking findings | Current canonical source unaffected |
| Shared reconciliation notes not displayed in the Roadmap UI | Projection `meta.notes`; RoadmapView | Optional presentation improvement |
| ADR-008 note renders under "Consequences" in the ADR lens | Parser field accumulation | Presentation caveat; the note self-identifies as presentation-only |
| Comprehensive indexing of historical/discovery files | `docs/README.md` (now states it is non-exhaustive) | Requires per-document classification; optional |
| Projection CI enforcement | ADR-018 | Excluded by this cleanup's scope ("does not authorize … CI enforcement") |
| 2026-only trading calendar | Survey draft BUG-043 (Principal decision B) | Defect channel, not documentation cleanup |
| Illustrative 496 / 0.9 req/sec figures | `foundations/evidence-appliance.md`, `foundations/state-oriented-console.md` | Historical illustrations, not current claims |

**Preserved:** original ADR text, ratification and standing; historical document status text, with later notes added rather than rewritten; the A–F model and maintained-knowledge routing. `PL-COHERE-01` remains open as the broader architecture-to-code coherence concern.

**Remaining for closure:**
1. Independent verification of `b9d7264` and this record.
2. Independent review of candidate `86d73b7`.
3. After acceptance, the procedure §3 identity refresh, persistence to `main`, run observation and live byte comparison, recorded here with the exact run.


## Workstream 3 — Charter the untouched Technology Quality Baseline

**Objective:** Convert the Constitution's baseline authorization into an executable measurement charter before scanning begins.

The charter must specify:

- immutable subject SHA;
- harness identity and isolated execution method;
- frontend/backend and repository scope;
- included/excluded paths and generated/vendor policy;
- tool candidates and exact versions/configuration;
- local vs external processing/data-disclosure boundary;
- raw-result custody, integrity, retention, and interpretation separation;
- materiality threshold;
- historical window or sampled initiatives for coupling/changeability analysis;
- required evidence streams;
- required positive and negative architecture exemplars;
- output artifacts and review path; and
- baseline exit criteria.

The charter should choose the smallest useful toolchain. Tool selection is subordinate to evidence needs.

**Static analysis leads temporally.** Capture the untouched mechanical condition before remediation. Static analysis does not define the architecture or quality model.

**Exit:** The Principal and reviewing actors can tell exactly what will be measured, against which immutable subject, by which harness, with what disclosure/custody consequences, before the first baseline result is interpreted.

## Workstream 4 — Freeze and execute the untouched baseline

**Objective:** Establish the first reproducible evidence package describing current technology condition before cleanup contaminates it.

Required evidence streams:

1. **Static/mechanical quality** — complexity, duplication, maintainability/code smells, likely defects, language-specific structural findings, and existing lint/compiler evidence.
2. **Live/dead/redundant topology** — unused code, dormant surfaces, duplicate paths, obsolete scaffolding, and known retirement candidates.
3. **Architecture-to-code coherence** — actual authority, responsibility, state, lifecycle, and dependency boundaries compared with governing architecture.
4. **Test and behavioral-evidence quality** — test distribution, meaningful coverage evidence where available, invariant/contract protection, and material blind spots.
5. **Dependency and security health** — vulnerable/outdated dependencies and relevant static/security evidence, interpreted by consequence rather than tool severity alone.
6. **Coupling/changeability** — blast-radius and change-coordination evidence using a declared historical window or sampled initiatives.

Persistence/data sustainability may be added when material evidence warrants it and need not block the first baseline.

The first coherence package must include the Constitution-mandated exemplars:

- `ProviderAuthorityManager` as a candidate positive exemplar to be validated by code evidence; and
- `AcquisitionWorker` as a candidate negative exemplar to be assessed by code evidence, **analysis only** while the provider investigation remains open.

No remediation occurs during baseline capture.

**Exit:** One immutable subject SHA has a complete, reproducible, reviewable baseline package, with limitations stated rather than hidden.

## Workstream 5 — Reconcile findings before remediation

**Objective:** Convert raw findings into architectural knowledge and explicit dispositions.

For each material finding, determine:

- concrete evidence;
- affected scope;
- confidence;
- consequence/severity;
- architectural characteristic under pressure;
- **drift vs misplaced boundary** where evidence permits;
- live/dead/redundant status;
- named dependency or active-investigation constraint; and
- disposition: **delete / retain / repair locally / restructure / explicitly accept / investigate / defer with named dependency**.

Key rule:

> Establish whether code should exist and whether its responsibility is correctly located before investing heavily in local remediation.

A dead module with fifty scanner findings is primarily one deletion decision, not fifty quality tasks.

**Exit:** Significant findings are no longer undifferentiated scanner output; they have architectural meaning and explicit disposition.

## Workstream 6 — Establish the Architecture & Quality Balanced Scorecard

**Objective:** Create the initial multidimensional management view of technology condition.

The initial scorecard should evaluate evidence-supported dimensions such as:

- architectural coherence;
- responsibility clarity;
- state integrity;
- boundary integrity;
- dependency integrity;
- changeability/coupling;
- structural/mechanical quality;
- test and behavioral-evidence quality;
- security/dependency health;
- deletion hygiene; and
- operational/data sustainability when supported by evidence.

These are candidate dimensions, not a requirement to manufacture data for every category. The baseline may combine, split, rename, or defer dimensions when evidence supports doing so.

For each adopted dimension record:

- current condition;
- evidence and confidence;
- material risk/constraint;
- desired direction;
- candidate intervention;
- mechanical/judgment/mixed assessment type; and
- interpretation owner.

Do **not** produce a composite score.

The first scorecard is a baseline, not a trend report. Trend begins only after comparable repeated measurement.

**Exit:** The Principal can see the technology estate as a set of explicit quality dimensions rather than a pile of code smells or one artificial grade.

## Workstream 7 — Create the technology-optimization roadmap

**Objective:** Turn baseline evidence and scorecard condition into a sequenced internal improvement roadmap.

Roadmap selection should consider:

- consequence to correctness and safety;
- architectural leverage;
- effect on economical change;
- active product/architecture dependencies;
- deletion opportunities;
- whether the issue is drift or misplaced boundary;
- remediation cost and migration risk;
- opportunity to reduce future rediscovery or blast radius; and
- whether intervention can be verified with existing or candidate fitness evidence.

The roadmap must remain distinct from `architecture-roadmap.md`, while cross-linking items that serve both structural product evolution and technology optimization.

The first roadmap should explicitly reconcile the sequencing of `PL-CLEANUP`, `PL-OPS-06`, `PL-SHELL`, `PL-COHERE-01`, cloud readiness, and any baseline-discovered interventions.

**Exit:** There is a bounded, evidence-supported improvement sequence rather than a generic technical-debt backlog.

## Workstream 8 — Execute bounded interventions through the normal delivery loop

**Objective:** Improve technology condition without turning the quality program into an uncontrolled rewrite.

Each intervention follows the Constitution and Wheelwright delivery model:

**Restore intent → identify characteristic → classify problem → design bounded change → implement → test/measure → adversarial review → reconcile → Principal acceptance → merge.**

Interventions should prefer deletion and simplification where they remove obsolete architecture. Misplaced-boundary findings may justify bounded restructuring. Drift should normally receive local correction.

Structural correction is not prohibited by incrementalism. Rewrite-by-ideology is prohibited by the requirement for evidence and earned complexity.

**Exit:** Each accepted intervention has evidence of behavioral correctness and a separate assessment of whether the targeted technology characteristic improved.

## Workstream 9 — Promote earned fitness functions into CI/CD

**Objective:** Prevent recurrence of demonstrated failure modes without creating arbitrary tool dogma.

Candidate controls follow the Constitution lifecycle:

**Observation → characteristic → operational definition → candidate fitness function → exemplar validation → shadow measurement → reliability/consequence review → warning or gate → recalibration/retirement.**

Potential control families include:

- static/mechanical quality;
- dependency/security health;
- architectural dependency/boundary rules;
- test/coverage expectations where meaningful;
- forbidden provider/domain coupling;
- repository/documentation coherence checks; and
- other characteristics demonstrated by program evidence.

Controls live in CI/CD or equivalent delivery machinery, not Wheelwright runtime behavior.

No control becomes a hard gate merely because a tool ships with that rule enabled.

**Exit:** Promoted controls have demonstrated protective value, explicit authority, known failure semantics, and a review/retirement condition.

## Workstream 10 — Enter steady-state technology optimization

**Objective:** Make technology quality a normal management responsibility after the initial recovery program.

At steady state:

- repeat comparable measurements at an agreed cadence or material-change checkpoint;
- update scorecard dimensions with genuine trends;
- review the technology-optimization roadmap against current constraints;
- recalibrate or retire controls that no longer protect useful characteristics;
- feed architecture learning into normal initiative design;
- keep dead-code and topology hygiene active enough that obsolete structures do not accumulate indefinitely; and
- version the Constitution when accumulated evidence shows its principles or operating model require material change.

**Exit:** There is no terminal "quality complete" state. The initial program completes when the standing loop is demonstrably operating and no longer depends on a one-time cleanup campaign.

---

# 5. Program deliverables

The mandated program is expected to produce, at minimum:

1. **Technology Quality Constitution v1** — governing principles and day-to-day architecture method. **Complete / ratified.**
2. **Technology Quality Program v1** — this canonical execution plan. **Ratified and mandated.**
3. **Parking-lot reconciliation** — explicit mapping of `PL-COHERE-01`, `PL-CLEANUP`, `PL-OPS-06`, and related items into the program.
4. **Project-memory/journal routing verification** — cold-start-safe access to the complete chronology and quality authority.
5. **Untouched Baseline Charter** — reproducible measurement plan and disclosure/custody boundary.
6. **Untouched Technology Quality Baseline** — raw evidence plus separate interpretation for one immutable SHA.
7. **Architecture-to-Code Coherence Assessment** — concrete findings with exemplars, drift/boundary classification, and dispositions.
8. **Architecture & Quality Balanced Scorecard — Baseline Edition** — multidimensional condition view, no composite grade.
9. **Technology-Optimization Roadmap** — sequenced internal improvement plan distinct from the product architecture roadmap.
10. **Bounded intervention packages** — authorized remediation/restructuring/deletion work with before/after evidence.
11. **CI/CD fitness-control set** — only controls that have passed the earned-promotion lifecycle.
12. **Steady-state operating cadence** — repeatable measurement, scorecard, roadmap, and control-review practice.

---

# 6. Program governance and actor responsibilities

The Four-Actor Model applies throughout the program.

### Principal

- owns the mandate;
- ratifies the Constitution and material program changes;
- authorizes consequential structural/remediation work where existing authority does not already do so;
- accepts/rejects roadmap priorities, fitness-function promotion, and exceptions;
- determines when the initial recovery phase has reached steady state.

### Kiro

- maintains repository-native understanding of current authority;
- executes authorized baseline collection and architecture-to-code analysis when designated;
- prepares repo-native reconciliation and implementation changes;
- preserves evidence and project memory;
- implements bounded interventions when authorized.

### Codex

- independently reviews/falsifies analysis and implementation;
- challenges scanner interpretation, architecture claims, rule enforceability, false positives, overreach, and hidden implementation risk;
- verifies that proposed controls actually distinguish positive and negative cases where practical;
- distinguishes a **finding** from a **required precondition**: when recommending that authorized work stop, states the concrete failure that proceeding would cause and why deferral would invalidate or materially endanger the current experiment;
- does not promote completeness, generalized robustness, or reusable infrastructure into blocking scope merely because they are technically desirable.

### ChatGPT

- independently synthesizes evidence and competing interpretations;
- checks program work against the Constitution and broader architecture;
- exposes unresolved Principal decisions;
- reconciles Kiro and Codex findings into decision-ready form;
- protects scope containment during authorized execution by weighing blocking consequence against tactical opportunity cost and finite observation windows;
- challenges solution inflation when review findings begin expanding a bounded intervention beyond its Principal-authorized purpose.

Assistant convergence does not replace Principal authority.

---

# 7. Program controls

## Untouched-baseline protection

No remediation may contaminate the frozen baseline subject. Development may continue elsewhere; the baseline remains attached to its immutable SHA.

## Active-investigation protection

Quality work must not perturb an active production experiment merely to improve quality metrics. In particular, `AcquisitionWorker` may be analyzed but not restructured under this program while the current provider-admission/constraint investigation remains open unless the Principal explicitly changes that boundary.

## Tool neutrality

No vendor owns the program. Sonar, linters, dependency scanners, architecture-test libraries, coverage tools, and repository scripts are replaceable evidence mechanisms.

## No metric gaming

A lower warning count is not success if it was achieved by exclusions, suppression, threshold manipulation, deleting useful tests, or moving complexity out of a tool's field of view.

## No quality theater

The program should not generate ceremony that exceeds its protective value. Reports, metrics, controls, and recurring activities are themselves subject to the Constitution's earned-complexity and retirement rules.

## No cleanup-by-accumulation

The program does not authorize opportunistic unrelated cleanup inside every feature change. Adjacent cleanup should be justified by reduced risk, simpler implementation, deletion of obsolete structure, or direct improvement to the characteristic under pressure.

---

# 8. Initial execution order

The Principal mandates the following initial sequence:

1. **Durable authority:** Constitution v1 and Program v1 are committed and discoverable.
2. **Parking-lot reconciliation:** align `PL-COHERE-01`, `PL-CLEANUP`, `PL-OPS-06`, and related identities with this program.
3. **Journal/project-memory routing verification:** prove a cold actor can find the complete chronology and quality authority.
4. **Baseline charter:** choose the subject/harness model, scope, tools, custody, materiality, and reproducibility rules.
5. **Freeze baseline SHA.**
6. **Execute untouched static/mechanical baseline first**, followed by the other evidence streams without remediation.
7. **Reconcile topology and findings:** deletion candidates, drift, misplaced boundaries, accepted/deferred/investigate dispositions.
8. **Build the baseline balanced scorecard.**
9. **Create and Principal-review the technology-optimization roadmap.**
10. **Authorize and execute bounded interventions.**
11. **Evaluate candidate fitness functions in shadow mode; promote only those that earn authority.**
12. **Repeat measurement and enter steady-state technology optimization.**

Steps 2–4 may overlap where they do not alter the baseline subject or pre-judge findings. The untouched evidence capture must precede remediation.

---

# 9. Initial program completion criteria

The initial Technology Quality Program v1 recovery phase is complete when all of the following are true:

1. Constitution and Program authority are discoverable through normal bootstrap and documentation routing.
2. Existing parking-lot quality/coherence/cleanup identities have explicit program dispositions.
3. Journal continuation and project-memory retrieval have been verified from a cold-start perspective.
4. A reproducible untouched baseline exists for an immutable SHA.
5. Significant findings have architectural meaning and explicit dispositions rather than existing only as tool output.
6. The baseline Architecture & Quality Balanced Scorecard exists without a composite grade.
7. An evidence-supported technology-optimization roadmap has been reviewed by the Principal.
8. The first bounded interventions have demonstrated the full measure → understand → change → evaluate loop.
9. Any promoted CI/CD fitness functions have passed exemplar/shadow validation and have explicit review/retirement conditions.
10. A repeat-measurement cadence or material-change trigger has been established.
11. Technology optimization can continue as normal operating practice without treating `PL-CLEANUP` as a permanent generic debt bucket.

Completion of this phase does not mean Wheelwright has achieved permanent perfect quality. It means Wheelwright has established a functioning quality-management system capable of identifying, prioritizing, improving, and preserving the technology characteristics that matter.

---

# 10. Versioning and change

This is **Technology Quality Program v1**.

The Principal has ratified and mandated it as the current program.

Program execution will produce evidence that may change sequencing, dimensions, tools, interventions, and fitness controls. Those changes should be recorded as program evolution rather than treated as failure of the plan.

Material changes to program purpose, mandate, authority boundaries, or constitutional relationship require Principal ratification. Operational progress and evidence-driven sequencing updates may be recorded in this program or a successor current-state document according to normal Category C governance.

The Technology Quality Constitution is versioned separately. Program evidence may motivate a future constitutional revision, but the program cannot silently rewrite the Constitution.

> **Mandate:** Wheelwright will execute this program to establish the expected technology-quality condition and the operating system required to sustain it. Quality is not a one-time cleanup milestone; it is an evidence-driven technology-optimization capability governed by the Technology Quality Constitution.
