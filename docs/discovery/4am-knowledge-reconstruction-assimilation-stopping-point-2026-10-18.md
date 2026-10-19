# Wheelwright — 4AM Knowledge Reconstruction and Assimilation: Nightly Stopping Point

**Date:** 2026-10-18 (evening)  
**Purpose:** Preserve the Principal-facing review of **what follows the completed A8 design/review workstream**, and the precise stopping state for the next session.  
**Category:** D — historical reconciliation / handoff checkpoint; **not** a ratified taxonomy, domain model, migration, implementation grant, roadmap change, or A8 ratification.  
**Last verified remote `main` before checkpoint:** `95669b8c255c1ec07d456767b9671e70bfe36072` (verify anew at resumption).  
**Authority:** ADR-023 D1–D5 remains ratified. A8 Candidate 4 is delivered, **unratified**.

## 1. Principal purpose and why A8 is not the destination

The original 4AM problem is structural: Wheelwright was intended to learn through a feedback loop, yet consequential understanding ended up stranded inside historical documents. The Principal's formulation was **"we learn something, we leave it where it is"**. The intended outcome is that a new actor can recover what matters without repeatedly being told **"it's in the repo"**.

The review's central conclusion:

> We have finished designing how Wheelwright should learn. Now we need to make its accumulated learning part of what Wheelwright actually knows.

Three distinct activities must not be conflated:

1. **Knowledge reconstruction:** Discover and reconcile what Wheelwright has learned, decided, implemented, rejected, and left unresolved.
2. **Knowledge assimilation:** Incorporate surviving meaning into appropriate maintained authority, preserving original evidence, exact Principal wording, historical alternatives and decision context.
3. **Knowledge delivery:** Make current maintained understanding reliably available to fresh human/AI consumers, with correct standing, scope, realization State and Time.

**Historical preservation is not assimilation.** A catalog, journal, checkpoint, or `HOLD` entry alone does not establish current knowledge.

## 2. Evidence already preserved; do not commission another archaeology pass

The complete Kiro Workstream B survey is now tracked in GitHub at `docs/discovery/knowledge-survey-2026-10-18/` (committed in the Principal's manual push, `cbcc55b`), despite its original README/REPORT still stating it was untracked at the time of authorship. Preserve their historical context; do not interpret those old status claims as current GitHub state.

Its `REPORT.md`, catalogs, inventories and ledgers report:

| Measure | Reported count / meaning |
|---|---|
| Total surveyed source material | **120,538 lines**, 5,004 segments in 411 source files |
| FULL interpreted/read depth | **77.1%** of lines |
| PARTIAL marker-scan or partial reading | **18.7%** of lines; not equivalent to interpreted reading |
| Other coverage | **4.2%** indexed/skipped/unsurveyed |
| Principal Knowledge Review Catalog | **784 entries**, **269 interpreted**; 515 marker-scan lines; not deduplicated |
| Retrospective decision candidates | **583**, **534 read**; not automatically ratified |
| Contradictions | **361 leads**, not 361 confirmed current architectural conflicts |
| Real A8 regression cases | **19** repository-grounded specimens |
| Dated implementation witnesses | **141** document-based items, plus observed point-in-time runtime evidence |

Supporting artifacts: `catalog/principal-knowledge-review-catalog.{jsonl,md}`, `catalog/decision-inventory.{jsonl,md}`, `domain-semantics.md`, `precedents.md`, `implementation-witnesses.md`, `contradictions.md`, `coverage-ledger.tsv`, and raw provenance. The Kotusev 2026 **v3.0 PDF with 34 named artifact types** is tracked at `docs/reference-data/kotusev/enterprise-architecture-artifacts-v3.0.pdf`.

**Economic boundary:** Workstream B's later Part D reportedly cost **~2,000 Kiro credits and three hours**. Do not repeat the exhaustive survey or a multi-actor review spiral merely to collect more documentation. Future work should extract practical value from the existing survey.

## 3. Design and review stopping state

- **ADR-023 (D1–D5)**: ratified; governs semantic authority, Meaning / State / Time, assimilation, protection, retained history and cold-start delivery.
- **Codex A1–A7**: destination knowledge architecture candidate packet; not installed or ratified by mere delivery.
- **A8 Candidate 4**: Codex's final proposed artifact-selection/lifecycle meta-standard, delivered as complete and reviewer-only ZIPs; design/review loop **closed by the Principal**, **not ratified**.
- **Final A8 preservation checkpoint:** `docs/discovery/4am-a8-candidate-4-final-design-handoff-checkpoint-2026-10-18.md` (commit `95669b8`). ZIP filenames, hashes and substantive corrections recorded. The manifest checkpoint **does not substitute for Git-archiving the ZIP contents**.
- **Kiro A8 independent Candidate 3 review:** `docs/discovery/4am-a8-candidate-3-kiro-independent-review-checkpoint-2026-10-18.md` and local frozen evidence references.
- **Kiro Workstream B report checkpoint:** `docs/discovery/4am-workstream-b-completion-report-checkpoint-2026-10-18.md`.

Candidate 4 proposes Git-tracked durable assimilation obligations, stable IDs, explicit persistence handoffs, authority precedence, generated-output protection, independent verification witnesses, and reuse of past human decisions. **NC-3/NC-4 operational proof remains outstanding**: no GitHub recovery + verified lifecycle demonstration has occurred. Do not claim the proposed ledger or mechanism is already live.

**Principal boundary:** No Candidate 5, new broad taxonomy review, or further expensive A8 adversarial rounds. The next phase is constructive assimilation, not reopening A8.

The design must support **both professional human architectural judgment/HITL and deterministic agent guardrails**. Kotusev is the faithfully preserved reference; any Wheelwright-specific semantic adaptations must be explicit and justified. Routine, already-authorized choices should not require Principal escalation; consequential unresolved meaning requires a bounded decision surface.

## 4. What assimilation means — one concrete domain example

**Account vs Operating Regime**, as surfaced in Kiro's `domain-semantics.md`:

- Doc 58 historically describes Account Regime as a property of an Account.
- Doc 82 establishes that Account identity or the Account's accounting/execution context does not, by itself, establish Operating Regime.
- These statements could describe incompatible models, separate concepts, or an evolution of accepted meaning. They require scope/authority reconciliation **before** changing maintained Product meaning. Do not silently choose a winner or infer a universal relation.

The complete assimilation path is:

1. **Recover** original claims, source locations, standing, scope and historical decision context.
2. **Reconcile** whether the statements conflict, vary in concern, or represent temporal evolution; send only unresolved consequential judgment to the rightful human authority.
3. **Update maintained subjects** (Account and Operating Regime as applicable) with current qualified meaning and references; preserve historical documents unchanged.
4. **Reconcile downstream consequences** in capability explanations, architectural views, contracts, tests and implementation references, recording reasoned changes and justified nonchanges.
5. **Verify cold-start recovery:** A fresh actor asked **"Does an Account determine its Operating Regime?"** should find the current authoritative answer without being given Docs 58 and 82 as breadcrumbs.

An apparently correct catalog entry or journal record is not a successful end-to-end assimilation.

## 5. Proposed subject clusters, not a ratified new taxonomy

Prioritize by architectural dependency and consequence rather than processing all 784 rows in sequence:

| Cluster | Main questions / example concepts |
|---|---|
| Product purpose and capabilities | EDGE/LVT Vision→Goals→Bets→Initiatives, accepted Product outcomes, operator questions/capabilities |
| Domain model | Account, Position, Governed Quantity, Operating Program, Operating Regime, Mandate, capital, cash |
| Decision semantics | Recommendation, Decision, Execution, Outcome, policy, evidence and provenance |
| System realization | Implemented source vs accepted design vs released, installed, running; v1/v2 and dated provenance |
| Architecture/governance | Ratified principles, ADRs, decisions, standards, historical precedent and actor delivery |

These are useful initial groupings for reconciliation; they are not mandatory one-document-per-cluster deliverables. Existing authority remains in force until properly transferred/assimilated.

## 6. Initial priorities

Highest-value early knowledge recovery targets:

1. **Stale v2 actor steering** — demonstrated cold-start error: injected older backend/Tradier assumptions can contradict ratified v2 source and cause fresh agents to reason incorrectly. Confirm the exact source and temporal standing before changing anything.
2. **Account / Operating Regime / Position / Governed Quantity** — centrally important domain relationships spanning Docs 58, 69, 81 and 82, with mixed-status evidence.
3. **Recommendation → Decision → Execution → Outcome** — distinctions affect operator-facing behavior and trading consequences; avoid inventing policy from source defaults.
4. **Accepted capability vs actually realized software** — no design, release, or historical install record alone establishes what is running now.

The stale-steering issue is urgent for reliable cold starts, but **this stopping-point checkpoint does not authorize actor-bootstrap edits**.

## 7. Proposed first implementation milestone — NOT authorized yet

**Working title:** *Wheelwright Canonical Knowledge — First Working Slice*.

Proposed bounded subject: **Account, Operating Regime, Position and Governed Quantity**.

Input: Ratified ADR-023; candidate A1–A7 as destination design; A8 Candidate 4 as unratified lifecycle guidance; Workstream B catalog and verified primary sources (Docs 58/69/81/82). Avoid duplicating canonical semantic owners.

A successful first slice:

- establishes or updates the appropriate maintained subject explanation(s), preserving scope-specific authority;
- qualifies contested statements and obtains limited human judgment only if existing authority cannot settle them;
- records historical decisions and provenance without converting old journals into competing current owners;
- updates or flags dependent architectural, capability and realization views;
- ensures any held consequence has a **genuinely Git-tracked, discoverable** obligation rather than an actor-local promise;
- passes a truly fresh-actor question about the subject without historical document-number hints.

**Suggested approach:** First perform a compact A1–A7/A8-to-survey destination reconciliation and produce an implementation plan with one vertical slice. This is a handoff, not another broad architectural study or ratification.

## 8. Sequence proposed during tonight's review

1. **Preserve and normalize evidence:** Keep Kiro's original IDs, wording and provenance. Cluster duplicates/variants selectively; do not delete or auto-promote historical evidence.
2. **Establish maintained subject owners:** Recover existing authority, apply ADR-023, use Candidate 4's tested direction as *proposal*, and resolve only genuinely consequential unknowns with HITL.
3. **Assimilate:** Reconcile source into maintained canonical knowledge, update dependent views as warranted, track justified held obligations, and leave a witness of applied targets/why.
4. **Validate delivery:** Fresh Codex/Kiro/ChatGPT cold-start testing of answer, authority, scope, time and realization; no reliance on the source historical document number.

**Avoid:** re-running full Workstream B; one document per Kotusev artifact; 784-item Principal questionnaire; wholesale migration; promoting code literals or provisional observations to ratified policy; self-attested closure; another A8 review loop.

## 9. Success measures

- A fresh actor recovers a **correct, qualified current answer**, not merely a matching keyword.
- Original evidence, alternatives and exact attributed Principal wording remain recoverable.
- Accepted learning is reflected in maintained subjects or a real durable/locatable obligation with an explicit hold reason.
- Genuine current authority conflicts are surfaced while stale projections or successive State observations are not falsely elevated to conflicts.
- HITL demand stays bounded; past ratified human judgments become reusable precedent.
- Cold-start archaeology cost materially decreases.
- Subsequent accepted changes **continue** to update maintained knowledge and derived views.

This is an operating feedback-loop objective, not a one-time file-reorganization exercise.

## 10. Open housekeeping and authorization boundaries

- The survey's `README.md` and `REPORT.md` still speak in the historical present about being untracked, although they are now committed; correct only through authorized follow-up, or contextualize when reading.
- Workstream B's BUG-043 trading-calendar record is **a draft**, not filed in `docs/bugs/`.
- Identifiers in previously tracked ADR/parking-lot material and possible generated outputs need controlled handling; the survey's automated redaction scan does **not** independently prove every committed row safe. Do not reproduce protected values in new summary artifacts.
- The complete A8 Candidate 4 ZIP exists in the conversation as an attachment; previous manifest says the ZIP bytes themselves were not committed. Verify before claiming durable GitHub archiving.
- No code, current operational state, acceptance standing, ADR or roadmap is modified by this checkpoint.

## 11. Tonight's explicit disposition

**CURRENT STATE:** Workstream B's extracted evidence is durably committed; ADR-023 remains the ratified structural basis; Codex A1–A7 and A8 Candidate 4 remain candidate designs; A8 iterative design/review is closed; the source-to-subject assimilation implementation has not begun.

**DECISION REQUIRED:** None to end tonight's session. The initial vertical slice and any consequential authority transfers require appropriately scoped future authorization.

**NEXT AUTHORIZED ACTION:** At next resumption, recover this checkpoint and the committed Workstream B `REPORT.md`; propose a **bounded canonical-knowledge first slice** for Principal consideration. Do not start work automatically because this checkpoint exists.

**Stopping principle:** *We have already paid for discovery. The next investment should produce maintained understanding rather than more historical evidence.*
