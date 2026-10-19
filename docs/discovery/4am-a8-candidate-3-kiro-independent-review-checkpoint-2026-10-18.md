# Wheelwright — 4AM A8 Candidate 3: Kiro Independent Validation Checkpoint

**Date:** 2026-10-18  
**Type:** Category D — historical review / reconciliation checkpoint, NOT normative architectural authority.  
**Source:** Kiro's independent Candidate 3 validation report, supplied in full by the Principal in conversation. This checkpoint preserves that report and its disposition.  
**Status:** Kiro recommends **REVISE (narrow)**. **A8 Candidate 3 remains unratified**; ADR-023 unchanged. No implementation, migration, bootstrap alteration, remediation, or further review cycle is authorized by this record.  
**Frozen evidence:** Local Kiro review under `/Users/bollich/kiro/reviews/wheelwright/a8-v3-r3-kiro-independent-2026-10-18/`. See §10. **The local frozen source files and their reported checksums have not been independently fetched or recomputed by ChatGPT.**  
**Kiro-reviewed baseline:** `d03d8d1ad8fd3db6bc8a1f586a13ae9a869f1873`. This was Kiro's verified baseline, **not** necessarily current GitHub main at checkpoint-commit time; other workstream checkpoint commits followed.  
**Related tracked evidence:** `docs/discovery/4am-workstream-b-completion-report-checkpoint-2026-10-18.md`; `docs/07c-adrs.md` ADR-023.  
**Separation:** Kiro's Workstream B discovery report and this separate A8 adversarial review are different artifacts.

## 0. Principal closeout direction

The Principal's directive after the review: **"this is it. we're getting off in the weeds now. once codex replies, we're done with this piece of work"**. The Principal further emphasized that proper persistence of the results is the most important part, noting substantial time and credit expenditure on Kiro's work. This record preserves the review for subsequent architectural assimilation rather than authorizing another escalating review cycle.

The Principal's prior design clarification is retained: Wheelwright's Kotusev-based artifact standard must support **both human architectural judgment (HITL)** and **deterministic agent guardrails**. Kotusev's human-oriented taxonomy remains a canonical reference, with explicit, justified Wheelwright semantic adaptations where needed. Agent determinism cannot silently manufacture Principal architectural authority.

## 1. Kiro executive disposition and freeze

Kiro reported: **"REVISE (narrow)."** Candidate 3 fixes the domain-Policy name collision (F1), meta-standard self-classification (F3), and quotation redaction (F5). Conflict-type differentiation (F4) is largely corrected, with two precedence gaps. Durable assimilation (F2) and source-based validation (F6) remain partial.

Crucial finding: Candidate 3 now routes learning to the correct authority but **still does not make a held assimilation obligation durable and discoverable from GitHub**. Codex's worked example places such an obligation in an **untracked local file**, not a discoverable Git-tracked record.

Kiro states its independent assessment was frozen **before opening Codex's complete packet**, and that the repository, ADR-023, and Codex candidate directory were unchanged during the review. The review-only candidate's standard, catalog, and case inputs were byte-identical to those in the complete packet.

## 2. Verified baseline and untouched local items (Kiro-reported)

- Remote `main` and local `HEAD` matched `d03d8d1ad8fd3db6bc8a1f586a13ae9a869f1873` at the time of Kiro's review.
- The untracked `docs/discovery/knowledge-survey-2026-10-18/` and `docs/reference-data/kotusev/enterprise-architecture-artifacts-v3.0.pdf` were not modified by Kiro.
- Reviewer-only ZIP was extracted independently; its standard, catalog, and case inputs matched those in the complete packet.
- **Caution:** These were point-in-time observations, not claims about what is installed or tracked now.

## 3. Regression check against Candidate 2 defects

| Defect | Kiro verdict | Basis |
|---|---|---|
| F1 — Product policy vs. Policies view | **Fixed** | Policies may present Product policy but do not own it. Source-code defaults are not assumed operative policy. |
| F2 — Durable assimilation | **Partly fixed** | Obligation contents and states (`PENDING → READY → APPLIED → VERIFIED/CLOSED`) are sound; durable host and discovery are undecided. |
| F3 — Meta-standard self-classification | **Fixed** | A8 and protocols are outside the 34 Kotusev artifact types. |
| F4 — Authority conflict vs. successive observations vs. stale copy | **Fixed with two gaps** | See NC-1 and NC-2. |
| F5 — Redaction | **Fixed with gaps** | Explicitly marked redactions; generator outputs and extent of protection remain open (NC-5, NC-6). |
| F6 — Real-event testing | **Partly fixed** | Real source specimens used, but R03/R04 still hint at answers; fresh-actor runs not provided with candidate. |

## 4. Real-repository regression findings (Kiro-reported)

### 4.1 Velvet Rope

- Canonical meaning resides in dormant `docs/velvet-rope` model.
- **No Velvet Rope admission policy runs anywhere** in the observed system: persistence store is never created; Write Desk uses its own provisional recommendation policy.
- Steering says "DTE 7–45, target ~21" but conflates the distinct policies. Kiro reports the **live eligible range is 0–45**.
- Preserve distinction between policy *meaning*, dormant realization, and actual live runtime behavior.

### 4.2 Tradier steering and authority

- Automatically injected steering claims **60 requests/minute**, **0.9 requests/second**, and sandbox; Kiro found these **stale**.
- Kiro identifies **Production primary** and **at most 119 requests per trailing minute** in `07-architecture-current.md`, `INV-PROV-03`, Doc 40, and the source default.
- Two Category A documents (`07b-diagrams.md` and `acquisition-scheduler-policy.md`) still carry stale claims, so a steering copy can faithfully reproduce a **stale Category A source**.
- A fresh probe actor initially absorbed stale values from injected context, correcting itself only after explicitly reading sources.
- **Implication:** D5 actor cold-start correctness cannot be assumed merely from declared documentation precedence.

### 4.3 October 15 installation records

- Kiro reconstructed client chronology: release r2 `e6e3b55` → `9843296` → `1dec8ab` → `3de8dce`, based on records, times, and ancestry.
- Backend: **last recorded install is r2**.
- **Currently installed versions are unknown.** Do not infer current state from last recorded evidence.

### 4.4 ww-history architecture

- `07-architecture-current.md` is the current architectural owner to amend; its August date describes currency rather than constraining ownership scope.
- Canonical homes for the capability and installed-state descriptions do not yet exist; associated obligations remain pending.
- Creating such homes requires Principal or properly delegated judgment; a held obligation is not authorization to invent the destination.

### 4.5 ADR-020 protected identifiers

- Kiro located identifier/quantity material around lines **779, 781, and 803**.
- It demonstrated **"verbatim except marked redactions"** without reproducing the identifier.
- The material is ADR narration of a Principal decision, **not a direct Principal quotation**; do not mislabel provenance.
- This checkpoint intentionally does **not** reproduce account identifiers or protected source values.

### 4.6 Principal knowledge in journals

- A production-readiness rule is substantially represented in Git-workflow steering and `KNOWN-FAILURE-MODES.md` §11; its **exact original wording** remains outside the maintained presentation, but this does not itself require another Principal decision.
- Another Principal quotation in `journal-5` around line **2036** is unregistered.
- Git-workflow steering can itself be the actual canonical owner for some procedural rules, not only a stale derivative.

### 4.7 Additional specimens

- TT Live's "no new … follows" statement concerned future work, not later installed-state changes. An installation after that statement referenced a mutable working tree.
- `INV-PERSIST-01` references a test file Kiro could not locate.
- The reviewed architecture-roadmap entries classify as **Architecture Strategies (K03)** under the tested taxonomy and use **Product mode**.

## 5. Human judgment and deterministic-agent boundary

Kiro's assessment:

- Routine routing is deterministic and prevents invented authority; `READY` is **not** permission, and a Policies view cannot alter operative domain policy.
- Human-decision surfaces are appropriately bounded; Kiro saw **no unnecessary escalation** in its 10 real specimens.
- **Gap:** A resolved human judgment must be recoverable and cited as precedent before the actor asks for the same consequential decision again.
- A merely logged event, or one marked `persistence pending`, cannot count as assimilated or closed.

## 6. Assimilation lifecycle proof

Kiro traced the **ledger-merge rule from Doc 82** through proposed stages and produced a complete example pending obligation with simulated continuation.

A fresh probe actor given no source-document number:

1. Found the rule only through repository search.
2. Found no canonical maintained destination.
3. Found no persisted obligation for the rule.

Kiro **did not run a clean post-assimilation repeat** because a reachable destination would require modifying the repository, outside its read-only authority. The lack of a tracked destination is an observed limit of the experiment, not evidence of a successfully closed loop.

## 7. New counterexamples and severity

| ID | Severity | Finding |
|---|---|---|
| **NC-3** | **High** | Multiple plausible parking-lot hosts for one assimilation obligation; no Git-tracked D4 ledger and no fixed searchable marker. |
| **NC-4** | **High** | Read-only actors have no durable destination for newly discovered obligations; records can disappear into conversation. |
| NC-1 | Medium | Two Category A documents disagree about the same operational fact, with no unambiguous C3 rule. |
| NC-2 | Medium | Category A text conflicts with later ratified v2 authority; C3 fails to route to README's rule for an unassimilated decision. Steering can block conforming work. |
| NC-5 | Medium | A protected identifier is copied into generated `roadmap-projection.json`, which cold-start instructions require regenerating. |
| NC-8 | Medium–Low | The same actor who makes a change may declare it verified without an independent witness. |

**NC-6** concerns redaction scope (reported as remaining open); three additional low-severity items are detailed only in the **local frozen review**, which was not provided verbatim here.

## 8. Blind versus Codex answer-key comparison

- Kiro agreed with Codex's direction for **all 11 cases**, and identified no independent interpretation errors.
- Additional real-source discoveries include Velvet Rope dormancy, NC-1, NC-2, NC-5, the missing `INV-PERSIST-01` test citation, and TT Live's time-sensitive state.
- **One substantive disagreement (R10):** Codex placed the worked obligation in `knowledge-survey-2026-10-18/raw/segments-base.tsv`. Kiro found **zero tracked files** in that directory, making the proposed obligation invisible to a fresh GitHub cold start. The example entry also concerns operating-regime scope, not the ledger-merge rule at issue.
- Matching fixture dispositions did **not** establish operational durability.

## 9. Kiro's ranked remaining corrections and recommendation

1. **High — NC-3/NC-4:** Choose one durable, Git-tracked host; assign fixed marker and state field; for read-only actors require a `persistence pending` handoff that an authorized closeout must either persist or explicitly decline; require cold-start discoverability.
2. **Medium — NC-1/NC-2:** Clarify inconsistent Category A sources and later ratified-but-not-assimilated v2 authority.
3. **Medium — NC-5:** Prevent protected-value replication through generated outputs, not just human prose.
4. **Medium–Low — NC-8:** Define independent verification requirements.
5. **Low:** Reuse prior HITL precedent, specify redaction scope, handle mutable working-tree installs, and remove answer hints from test inputs.

**Recommendation: REVISE (narrow)**. This is **Kiro's review disposition**, not ratification by the Principal.

**Subsequent Principal scope instruction:** After Codex's next reply, **close this specific review workstream**. Do not automatically commission Candidate 5, another broad taxonomy pass, or further costly adversarial review rounds. Preserve unresolved findings accurately rather than silently promoting them into authority or fabricating closure.

## 10. Frozen local evidence and verification limits

Kiro reported this review directory:

`/Users/bollich/kiro/reviews/wheelwright/a8-v3-r3-kiro-independent-2026-10-18/`

Artifacts:

- `A8-C3-kiro-independent-results-FROZEN.md`: read-only; SHA-256 **`ebf519c7674821f1bb397fd726e208652646efd3ce9585fcc189864859bfbf31`**; frozen **2026-10-18T23:35:38Z** and rechecked by Kiro after answer-key comparison.
- `FREEZE.txt`: freeze timestamp/hash record.
- `inputs/`: read-only reviewer materials.
- `A8-C3-kiro-comparison-post-freeze.md` and `complete-packet-post-freeze/`: created after freeze.

**Boundary of this checkpoint:** The exact frozen local files, ZIP contents, and their checksums have **not** been independently inspected or copied into GitHub through this checkpoint. The reported digest is preserved as a locator for later integrity verification, **not** claimed as ChatGPT-verified. This checkpoint makes the **conversation-supplied review report** durable.

## 11. Final snapshot

- A8 Candidate 3 **unratified**.
- ADR-023 **unchanged**.
- Kiro Candidate 3 independent review **reported complete and frozen** with recommendation **REVISE (narrow)**.
- **Most important unresolved issue:** Git-tracked, discoverable assimilation-obligation lifecycle; filing an actor-local pending record does not close the feedback loop.
- Workstream B completion report preserved separately in GitHub; its untracked detailed survey artifacts were not thereby committed.
- Principal wants the A8 review **closed after Codex's next reply**, with findings preserved for implementation planning, not another open-ended review.

**CURRENT STATE:** Historical evidence checkpoint; source-to-knowledge assimilation and any rule remediation remain separate future governed work.

**DECISION REQUIRED:** None by this checkpoint.

**NEXT AUTHORIZED ACTION:** Await Codex's bounded final response; preserve and reconcile without launching additional adversarial cycles.
