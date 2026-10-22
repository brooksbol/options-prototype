# BUG-045 — Collections expand whole portfolio before pagination

- **Status:** Open — isolated correction candidate; independent Kiro verification pending.
- **Severity:** S2
- **Area:** Foundational Holdings API v2
- **Provenance:** Principal-supplied Kiro Product-conformance finding F2, October22,2026. Original independent probe artifacts unavailable; author constructed new probes against frozen base8bd75f5. No original-probe reproduction claim.

## Observed failure
A limit=1 Position request expanded every source Position. Cold 1000-source admission also repeated continuity scans; the SQL planner could choose a quadratic reconciliation join.

## Intended semantics violated
Select authorized membership and the page before per-item evaluation; keep exact Account-wide reconciliation once per request and bounded read-through. Doc77 §§4,12,13,19 and the operative contract govern the relevant boundary. Principal explicitly authorized bounded correction; no domain redesign.

## Evidence
[F2 reproduction, source/contract citations and author verification](../implementation/api-v2-foundational-2026-10-21/product-conformance-2026-10-22/verification.md). New probes are identified separately from reported samples and Kiro evidence.

## Consequence
Small collection pages impose unnecessary portfolio-sized latency/work. Severity describes that consequence; no live financial loss or disclosure incident demonstrated.

## Diagnosis / root cause
Whole-population read/expansion and repeated source interpretation; per-item invariant recomputation.

## Scope / non-goals
Bounded F2 correction only. No v1/CLI migration, live acquisition, lifecycle policy, trade submission, or publication. Filing is not an execution grant.

## Acceptance criteria
Select authorized membership and the page before per-item evaluation; keep exact Account-wide reconciliation once per request and bounded read-through. Existing36operations, financial/evidence/security semantics and retained source history remain intact. Independent Kiro verification required before integration/publication.

## Remediation history
Candidate prepared in codex/api-v2-product-conformance-correction-2026-10-22. See linked immutable candidate review package; not deployed or independently accepted.

## Verification
Author deterministic tests and static documentation specimens are recorded in the linked report. Bug remains Open pending independent verification and controlled acceptance; passing author tests are not Product acceptance.

## Related
[Correction task state](../implementation/api-v2-foundational-2026-10-21/product-conformance-2026-10-22/STATE.md); F3 lifecycle questions are reserved and are not this defect.
