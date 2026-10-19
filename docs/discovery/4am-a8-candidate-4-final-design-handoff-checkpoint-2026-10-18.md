# Wheelwright — 4AM A8 Candidate 4 Final Design Handoff

**Date:** 2026-10-18  
**Classification:** Category D — non-normative preservation / handoff checkpoint.  
**Status:** A8 Candidate 4 **delivered, unratified**. The Principal expressly ended the iterative design/review workstream after Codex's response. **No Candidate 5 or renewed broad review is commissioned.** ADR-023 remains authoritative.  
**Source:** Codex Candidate 4 complete and reviewer-only ZIPs provided to ChatGPT and checked for ZIP integrity and member structure. This is the **GitHub-persisted manifest and disposition**, NOT a representation that the ZIP bytes themselves have been committed.

## 1. Final supplied packages (SHA-256 verified on the supplied bytes)

1. **Complete:** `wheelwright-a8-v3-r4-2026-10-18-cbcc55b2.zip` — SHA-256 `cdc779702174d062ae0578637e44c4d1bc136cb0971eef0a4e3d48bd18abd33c`, 28,626 bytes.
2. **Review-only:** `wheelwright-a8-v3-r4-review-inputs-2026-10-18-cbcc55b2.zip` — SHA-256 `efa42af2a6ee36d7b5a8d0cffee1b36cbed667332ad47adb9d6b2b0ed5087e3a`, 19,887 bytes.

Both ZIP archives passed `ZipFile.testzip()` integrity checks against the attached copies. File/member names are recorded below. These packages remain source deliverables outside GitHub unless separately archived there; a manifest does not replace the source bytes.

**Complete archive, eight members:** `README.md`; `A8-standard.md`; `A8-catalog.md`; `A8-durable-obligations.md`; `A8-ledger-example.md`; `A8-acceptance-inputs.md`; `A8-acceptance-expectations.md`; `A8-correction-record.md`; plus `preservation-manifest.json` (**nine** members in total).  
**Reviewer archive, four members:** `A8-acceptance-inputs.md`; `A8-catalog.md`; `A8-durable-obligations.md`; `A8-standard.md`.

Reviewer inputs intentionally exclude expectations, worked example, correction commentary, and README. They are not evidence of independently executed acceptance tests.

## 2. What Candidate 4 proposes (Codex correction record)

- **NC-3/NC-4 — durability:** One proposed Git-tracked assimilation-obligation ledger, stable `ASSIM` IDs, subject/dependency markers, receipt/acknowledged persistence handoffs, detection of missing submissions, applied-target verification and bounded closure. A `persistence pending` actor response does not, by itself, prove GitHub durability.
- **NC-1/NC-2 — authority:** Distinguish same-scope Category A conflicts, ratified decisions awaiting assimilation, stale derived projections and successive dated State observations. Account for the Category B absorption rule.
- **NC-5 — protection:** Apply information protection to **inputs, generators, output artifacts and distribution**, not merely prose; hold unsafe generation rather than copying protected identifiers.
- **NC-6 — quoting:** Mark intentional redactions explicitly and consider combinations permitting reidentification; a safely modified quotation is not unqualified verbatim.
- **NC-8 — verification:** Specify independent semantic, authority, operational and disclosure witnesses with bounded mechanical-check exceptions.
- **Human judgment:** Recover applicable prior Principal/delegated decisions as precedents rather than re-escalating routine known choices; `READY` is not an execution grant.
- **Meaning/State/Time:** Retain installed-state uncertainty, temporal qualification and distinction between accepted Product semantics and observed realization.
- **Worked learning specimen:** Account ledger merge/reconciliation rule from Doc 82, not unrelated operating-regime scope; illustrative `ASSIM` ID is **not allocated**.

The 34-artifact Kotusev v3.0 catalog is reported **unchanged**. No taxonomy restart, Product decision, implementation, installation, migration, ledger creation, bootstrap edit, or GitHub source-code change is authorized by this proposal.

## 3. Acceptance limits and deferred demonstrations

Codex explicitly reports **NC-3/NC-4 remain ratification-blocking until actual GitHub recovery and lifecycle demonstrations are performed**. The packet provides three independent acceptance inputs and held-back expectations but **does not claim these demonstrations ran**. The proposed ledger and lifecycle are **design**, not currently established operational infrastructure. No recipient for guaranteed persistence was appointed merely by proposing the process.

**Crucial distinction:** **Design/review is closed by Principal direction; formal ratification and future implementation/verification are not implied.** A future separately authorized minimal pilot may produce the required GitHub witness. That is a later governed decision, not an invitation to another adversarial design cycle.

## 4. Evidence and historical continuity

- ADR-023 D1–D5: `docs/07c-adrs.md` (ratified).
- Kiro Candidate 3 independent checkpoint: `docs/discovery/4am-a8-candidate-3-kiro-independent-review-checkpoint-2026-10-18.md`.
- Workstream B historical checkpoint: `docs/discovery/4am-workstream-b-completion-report-checkpoint-2026-10-18.md`.
- Full Workstream B survey: `docs/discovery/knowledge-survey-2026-10-18/REPORT.md`.
- Canonical PDF copy: `docs/reference-data/kotusev/enterprise-architecture-artifacts-v3.0.pdf`.
- Kiro frozen Candidate 3 local review SHA-256 (Kiro-reported; not independently rehashed): `ebf519c7674821f1bb397fd726e208652646efd3ce9585fcc189864859bfbf31`.
- Codex reported source baseline during Candidate 4 construction: `cbcc55b2797f5fd2213fa2dda9b7bd71f9392daf`; reported final main: `f81f9e9f778f1324455e9ac2068656620d45343e`. Check current main separately.

## 5. Scope boundary / closeout

**CURRENT STATE:** Candidate 4 delivered as the final proposed design; A8 design and adversarial review workstream closed. Source packages are attached in the 4AM conversation and identified with hashes but **not yet committed as Git objects by this checkpoint**. Candidate remains unratified.

**DECISION REQUIRED:** None for closeout. Later ratification and any narrow ledger pilot require separate appropriate authority.

**NEXT AUTHORIZED ACTION:** Return focus to the original architectural objective: turning Wheelwright's costly recovered knowledge into maintained, directly accessible subject knowledge. Preserve the findings and avoid reopening an indefinite A8 review loop.
