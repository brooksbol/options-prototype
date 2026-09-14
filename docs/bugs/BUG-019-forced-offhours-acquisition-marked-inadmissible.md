# BUG-019 — Operator-forced off-hours acquisition succeeds but its newly acquired evidence is marked `admissible: false`, making it unusable by Decision

- **Status:** Open
- **Severity:** S2
- **Area:** Backend admissibility semantics (per-subject verdict) ↔ Decision consumer; operator-forced acquisition
- **Provenance:** Discovered 2026-09-14 during PL-GOV-02 seven-ETF admission acceptance testing

## Observed failure

During acceptance testing, an operator-authorized forced acquisition was issued for the seven newly admitted symbols while the canonical session was **closed** (`CLOSED_CANONICAL`, after 16:15 ET). The acquisition **succeeded**: all seven moved `pending → ready`, chains were acquired with real (delayed) provider timestamps, and the evidence was published in snapshot generation 29555. Each symbol has structurally sufficient chain evidence to produce a 0–45 DTE Decision candidate (e.g. ETHA has four puts with |delta| 0.15–0.50, non-zero bids, healthy OI).

Yet none of the seven produce a Deployment/Decision candidate row. With the Deployment CSP table filtered to `ETHA`, the table shows **"Showing 0 rows."**

## Intended semantics violated

Proposed invariant this defect violates:

> **Explicit forced acquisition must produce Decision-usable current evidence when usable provider evidence is available, regardless of canonical-session posture, while preserving truthful timestamps, provider provenance, and an explicit indication that the evidence is after-hours / non-canonical.**

The operator deliberately requested the best evidence available *now* via the forced-acquisition path (which intentionally bypasses the market-session gate). Acquisition succeeded and produced truthful, current evidence. But the backend immediately stamped that newly acquired evidence `admissible: false` **solely because it was acquired outside the canonical session**, and the Decision consumer then rejects it in every session state. The result defeats the entire purpose of the operator action: the operator asked for Decision-usable evidence now, got truthful evidence, and Decision refuses to use it.

## Evidence

Observed live, 2026-09-14, appliance on `main` (`b3e2171`), snapshot generation 29555, session `CLOSED_CANONICAL` (sealed):

- Forced targeted acquisition `POST /api/evidence/refresh?symbol=ETHA&…` returned `outcome: ACQUIRED, targeted: true, sessionPosture: BLOCKED`; generation advanced 29554 → 29555; coverage `pending 7 → 0`, `ready 957 → 964`.
- Backend DB: `ETHA` resolution `ready`, primary expiration `2026-10-02`, five chains `success` (retrieved `2026-09-14T21:52:49Z`).
- Published snapshot `ETHA`: `status: ready`, 47 puts on the primary chain, underlying `iShares Ethereum Trust ETF` @ $19.17; four puts qualify under the admissible delta band (0.15–0.50) with non-zero bids and OI.
- **Published per-subject admissibility verdict for `ETHA`** (the authoritative value the frontend consumes):
  `primaryChainAdmissibility = {"admissible": false, "basis": "real-time", "canonicalSessionDate": "2026-09-14"}` — acquired `21:52` (after close).
- Contrast, a prior-session symbol that DOES produce recommendations (`ABFL`): `primaryChainAdmissibility = {"admissible": true, …}` — acquired `19:39` (during the session).
- Frontend exclusion point: `options-prototype/src/write-desk/subject-admissibility.ts` `isSubjectAdmissible`, path **(1a)** — a backend per-subject verdict `admissible: false` is inadmissible in **every** session state, including sealed. Consumed via `isEligible` in `options-prototype/src/write-desk/recommend.ts`. So ETHA is filtered out *before rendering*; the visible ~93 CSP recommendations are prior-session chains stamped `admissible: true` under sealed-session validity.

Epistemic status: all of the above are directly observed from the live backend DB, the published snapshot, and the live-code predicate. The chain data itself is truthful current (delayed) provider evidence; the defect is the admissibility verdict assigned to operator-forced off-hours acquisition, not the evidence content.

## Consequence

Operator-triggered hydration during a closed session cannot surface a newly admitted (or any) symbol into Decision, even though the acquisition succeeds and the evidence is truthful and structurally sufficient. The operator has no way, off-hours, to obtain Decision-usable evidence for a symbol — the forced action silently produces permanently-non-recommendable evidence until a live session re-acquires it. This directly blocks the acceptance goal (hydrate the seven and see them participate) and, more broadly, makes the operator-forced acquisition control misleading: it reports `ACQUIRED` while producing evidence Decision will refuse. Severity S2 (major): no incorrect economic figure is produced, but a core operator action is defeated by policy and the outcome is silent/unexplained at the operator surface.

## Diagnosis / root cause

Established at the behavioral level:

- The backend assigns per-subject admissibility from the subject's own acquisition time under canonical-session policy. Evidence acquired while the canonical session is closed is stamped `admissible: false` (basis `real-time`), regardless of whether it was produced by an explicit operator-forced acquisition.
- The Decision consumer treats a backend `admissible: false` verdict as authoritative and inadmissible in all session states (correctly, per its own authority-precedence rule — see `subject-admissibility.ts` path 1a). The consumer is behaving as designed; the mismatch is upstream, in how forced off-hours acquisition is characterized.
- Net: there is no representation for "operator-forced, after-hours, non-canonical, but Decision-usable-now on explicit operator request." The system collapses "acquired outside the canonical session" into "not admissible," which is correct for the *passive* session gate but wrong for an *explicit* operator-forced acquisition whose whole purpose is to obtain usable evidence now.

Root-cause ownership (per authority-before-consumers): the authoritative fact that needs to change is the backend admissibility characterization of operator-forced off-hours acquisition — not a compensating exception in the Decision consumer. The consumer's authority-precedence rule is correct and must not be weakened; a frontend override of `admissible: false` would reintroduce the exact fabricated-permissiveness failure that authority precedence was designed to prevent.

## Scope / non-goals

Covers: the admissibility characterization of evidence produced by an explicit operator-forced acquisition performed while the canonical session is closed, and the resulting Decision-usability of that evidence. Does **not** cover: the passive session gate's normal behavior during closed sessions (that gate correctly suppresses ordinary acquisition), sealed-evidence validity for prior-session evidence, DANGER classification, or admission/universe membership. Filing does not authorize remediation. Severity is consequence, not priority.

### Not a duplicate of BUG-013 / BUG-014

BUG-013 and BUG-014 concern admissibility/sealing behavior for evidence associated with **canonical-session boundaries** — the preservation and correct use of evidence that was **already valid/canonical** around a boundary, subsequently mishandled by admissibility/sealing semantics. This defect concerns the semantics of an **explicit operator-forced acquisition performed while the canonical session is closed**: the operator deliberately requests the best evidence available now, acquisition succeeds, but that **newly acquired** evidence is made unusable by Decision solely because it was acquired outside the canonical session. Different trigger (deliberate forced acquisition vs. boundary handling of pre-existing evidence), different evidence (newly acquired vs. previously admissible), different owner concern.

### Not a duplicate of BUG-017 / BUG-018

BUG-017 concerns Deployment CSV export completeness vs. a presentation row limit. BUG-018 concerns discoverability of admitted-but-`pending` symbols and the absence of a straightforward operator hydration path. This defect occurs **after** a hydration path has successfully executed: evidence is acquired, persisted, published, and structurally sufficient for Decision, but is rejected by the admissibility verdict. Even with perfect discoverability and an operator symbol-picker, this defect would remain — the requested hydration would succeed but its result would be unusable.

## Acceptance criteria

An eventual fix should satisfy the invariant above. Specifically, when an operator issues an explicit forced acquisition while the canonical session is closed and usable provider evidence is available:

1. the acquired evidence is Decision-usable for that operator's decision context, rather than silently `admissible: false`; and
2. truthful acquisition timestamps and provider provenance are preserved (no laundering of after-hours evidence as in-session/canonical); and
3. the evidence carries an explicit after-hours / non-canonical indication so it is not mistaken for canonical-session evidence; and
4. the fix repairs the authoritative characterization upstream (backend), not via a compensating exception in the Decision consumer, and does not weaken the consumer's authority-precedence rule or sealed-evidence semantics for prior-session evidence.

(Exact mechanism — e.g. a distinct "operator-forced / after-hours-usable" admissibility characterization — is a design decision, not prescribed here.)

## Remediation history

Empty (Open). Filing does not authorize remediation.

## Verification

Empty (Open).

## Related

- `BUG-013`, `BUG-014` — per-subject admissibility / sealed-session authority around canonical-session boundaries. Related area; explicitly **not** the same defect (see "Not a duplicate of" above).
- `BUG-018` — discoverability/hydration of admitted-but-pending symbols. Sequential in the operator flow; explicitly **not** the same defect.
- `PL-GOV-02` — the seven-ETF admission whose acceptance testing surfaced this.
- Journal why-state: `docs/journal/project-journal-3.md` (2026-09-14 acceptance-testing entries).
- Code touchpoints (evidence, not remediation authorization): backend per-subject admissibility publication; `options-prototype/src/write-desk/subject-admissibility.ts` (`isSubjectAdmissible` path 1a); `options-prototype/src/write-desk/recommend.ts` (`isEligible`).
