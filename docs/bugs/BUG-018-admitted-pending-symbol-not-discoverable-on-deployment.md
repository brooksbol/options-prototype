# BUG-018 — Newly admitted (pending) universe member is not discoverable on Deployment; evaluated-universe count conceals distinct symbol states; no operator-facing targeted hydration for non-portfolio symbols

- **Status:** Open
- **Severity:** S3
- **Area:** Write Desk (Deployment) / operator discoverability + hydration workflow
- **Provenance:** Discovered 2026-09-14 during PL-GOV-02 seven-ETF admission acceptance testing (no GitHub Issue — `docs/bugs/` is the sole defect registry)

## Observed failure

After the seven-symbol cohort (ETHA, TSLL, NVDL, QQQM, IBIT, DRAM, TLT) was admitted to the maintained universe, the Deployment (Write Desk) surface reported the universe/evaluated count as `1313` and "Showing 90 rows", but the newly admitted symbols could not be found anywhere on the operator surface. In their `pending` (not-yet-hydrated) state they produce no recommendation rows, and the Deployment surface renders only recommendation-producing rows, so a real, governed universe member was **entirely invisible** to the operator between admission and hydration.

Demonstrated in working software: admission verified (`symbols`/membership present, snapshot `status: pending`), yet no operator surface exposed the symbols' existence or state; they became visible only after an explicitly targeted backend forced-acquisition (`POST /api/evidence/refresh?symbol=...`) moved them `pending → ready` with chains.

## Intended semantics violated

The expected operator mental model is: **admit → the symbol is governed universe state → the operator can see its state → hydrate → it becomes evaluable/candidate-producing.** The current surface instead behaves as: **admit → the symbol silently disappears from the operator surface until enough evidence exists to produce a recommendation row.** A newly admitted `pending` symbol is real universe state and should be inspectable somewhere immediately (e.g. as `PENDING / NOT HYDRATED`), even without a recommendation row.

Relatedly, the displayed universe/evaluated count (`1313`) is presented as a single figure that does not let the operator distinguish materially different states:

- admitted but pending (not hydrated),
- acquisition attempted but failed,
- ready but no qualifying contract,
- ready but filtered by DANGER (Show Danger off),
- genuinely not a universe member.

Presenting these as one undifferentiated "evaluated" count is a cognitive-correctness failure: the number implies more than the surface can actually account for.

## Evidence

Observed (working software, 2026-09-14, appliance on `main` with the seven admitted):

- `/api/status` `evidence.universe = 1313`, `coverage.pending = 7`, scheduler `session_blocked` (`CLOSED_CANONICAL`).
- `/api/evidence/snapshot`: all seven present with `status: pending` (in the published snapshot) yet producing no Deployment rows.
- Deployment surface: "Show 1313 / Showing 90 rows"; the seven were not locatable in the put/candidate table (they produce no candidate row while `pending`). The "Showing 90 of N" cap is a separate display control and was not the cause — the symbols produce zero candidate rows regardless of the cap.
- After an explicitly targeted forced refresh for exactly the seven, coverage moved `pending 7 → 0`, `ready 957 → 964`, and the symbols then produced candidate rows (five visible directly; TSLL/NVDL only under Show Danger — see BUG note below).

Operator-workflow observation: the seven are not portfolio underlyings, and the existing Console force-acquisition control (`ForceAcquisitionButton`) derives its targets from operator context (visible/monitored opportunities). It is not a general arbitrary-symbol picker, so there was **no straightforward operator-facing way to select exactly these newly admitted symbols for hydration** — hydration required dropping to a backend `curl` call, which is not an operator workflow.

## Consequence

For acceptance testing and, more importantly, operations: a newly admitted symbol cannot be observed or acted on through the operator surface until it happens to produce a recommendation row. The operator cannot tell whether an admitted symbol is pending, failed, ready-without-candidate, danger-filtered, or absent. Combined with the missing operator-facing targeted hydration path, an admitted non-portfolio symbol is effectively un-operable from the UI until the next full acquisition session or an out-of-band backend call. Severity S3 (moderate): no incorrect economic figure is produced and no evidence is corrupted; the defect is discoverability/legibility + an operator-workflow gap, with a functional (if non-operator) backend workaround available.

## Diagnosis / root cause

Established at the behavioral level, not yet at a specific code fix:

- The Deployment/Write Desk surface renders from the recommendation/Decision output (candidate rows), which requires `ready` evidence with a qualifying chain in the current 0–45 DTE Decision policy. A `pending` universe member has no candidate row and no other operator-visible representation on that surface.
- The displayed count is the evaluated-universe size and is not decomposed into the lifecycle/outcome states enumerated above.
- The Console hydration control targets its existing operator context rather than accepting an arbitrary operator-chosen symbol set, even though the backend endpoint (`forceAcquireSymbols`) already accepts an arbitrary bounded set.

## Scope / non-goals

Covers: operator discoverability of admitted-but-not-yet-evaluable universe members, legibility of the evaluated-universe count with respect to distinct symbol states, and the absence of an operator-facing targeted hydration path for non-portfolio symbols. Does **not** cover: the DANGER classifier's representational gaps for single-stock/crypto-trust structures (recorded as DEFER findings under the PL-GOV-02 admission; not a defect of this surface). Filing does not authorize remediation; severity is not priority. The broader productized universe intake/evaluation/admission/hydration **workflow** remains a `PL-GOV-02` capability item and is not restated here as a defect.

## Acceptance criteria

An eventual fix should let an operator, without conversation history or backend `curl`:

1. observe that an admitted symbol exists and see its state (e.g. `PENDING / NOT HYDRATED`, `FAILED`, `READY / NO CANDIDATE`, `DANGER-FILTERED`) even when it produces no recommendation row; and
2. distinguish those states rather than folding them into a single "evaluated" count; and
3. request evidence (hydration) for a newly admitted symbol through an operator-facing control rather than a raw backend call.

(Exact surface/product expression is a design decision and is not prescribed here.)

## Remediation history

Empty (Open).

## Verification

Empty (Open).

## Related

- `PL-GOV-02` (Universe Candidate Evaluation / Admission Workflow) — the mature productized intake/evaluation/**admission/hydration** workflow. This defect is the concrete discoverability/legibility + targeted-hydration gap observed during the PL-GOV-02 cohort admission; it is cross-linked, not double-booked (the capability item is not a defect, and this defect does not restate the workflow item).
- Journal why-state: `docs/journal/project-journal-3.md` (2026-09-14 PL-GOV-02 admission + acceptance-testing entries).
- `BUG-017` (Deployment CSV export may be constrained by presentation row limit) — a separate defect surfaced in the same 2026-09-14 acceptance session on the same surface. Distinct concern (export completeness vs. row cap), cross-linked for context only.
- `BUG-019` (operator-forced off-hours acquisition produces `admissible: false` evidence Decision won't use) — the *next* step in the operator flow: this record (BUG-018) is about discovering an admitted symbol and reaching a hydration path; BUG-019 is about the hydration result being rejected by admissibility even after that path succeeds. Distinct, sequential; cross-linked for context only.
- Context: the seven-ETF admission is durable on `main` (seed + derived SQLite); this defect concerns the operator surface, not the admission itself.

## Audit checkpoint — 2026-09-22

**Disposition:** Confirmed still active on accepted main.

Deployment remains centered on recommendation-producing rows and does not independently expose pending, failed, or ready-without-candidate universe members in a way that makes an admitted pending symbol directly discoverable. The targeted-hydration/operator-discoverability gap remains.

**Restart point:** Reproduce with an admitted non-portfolio symbol in a pending/non-candidate state, then address discoverability/hydration only under separate implementation authority.
