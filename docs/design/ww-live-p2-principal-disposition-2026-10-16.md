# ww live P2 — Principal disposition (2026-10-16)

**Principal decision: APPROVE P2 as the bounded implementation basis, with two reviewed semantic gaps DEFERRED, not falsely resolved.** This explicitly supersedes the independent review's REJECT-as-implementation-ready disposition for purposes of scoped engineering authorization; the review evidence and P1/P2 frozen artifacts remain intact. This is a Principal risk/scope decision, not an independent technical ACCEPT.

## Provenance
Remote main at review: `7ae274cbb0ad0ce77f21440b0c390558913f61e8`. P2 packet reported at `/tmp/ww-live-api-p2/`: `proposal.md`, `proposed-account-evidence.openapi.json`, `source-admission.md`, `independent-review.md`. These are actor-local paths, not repository files; do not claim they were committed or can be retrieved from GitHub. Recover and preserve them in the actor's workspace before implementation.

## Deferred findings and safety containment
1. **Physical-equity product classification insufficiently proven.** Until sufficient provenance-bearing classification is established, do NOT admit ambiguous, missing-classification, conflicting or cash-settled/index contracts into the physical-share payoff model. Return qualified UNKNOWN/UNSUPPORTED; no fabricated payoff.
2. **Strategy units sensitive to allocation encoding.** Until canonical allocation handling is proven, do NOT claim an established package unit count or structure classification when duplicate/split allocations or equivalent contract holdings could alter the result. Preserve exact source/holding lineage and quantities, expose UNKNOWN/CONFLICTING as appropriate; no silent arbitrary GCD result.

Deferral means limited supported cases may proceed, not that invalid or ambiguous cases become acceptable. Positive cases require verifiable evidence and deterministic tests. Independent reviewer also noted nonblocking correlation semantics, retry precedence, history dependencies and batching; handle proportionately within bounded engineering.

## Approved bounded next work
Codex may continue v2 BACKEND API and implementation engineering based on P2, including reviewed opt-in `GET /v2/positions?view=option-structure`, snapshot-bound association assertions with quantity allocation, and explicit backend contract-definition acquisition, **only within separately applicable operational authorization boundaries**. Existing v2 behavior and accepted `ww positions` must remain compatible. Backend owns all financial/domain semantics; clients only render. Structural GET must use retained evidence without provider contact or writes. No raw-artifact grant expansion or CLI brokerage integration. Preserve unknowns, Account isolation, and accepted Product scope (open option Positions only). Deliver early runnable backend specimens, including affirmative and negative cases, and independently review the implementation and OAS changes.

This decision does NOT authorize live brokerage acquisition, deployment, service restart, DB migration, grant/credential changes, trading, or modification of unrelated work. Obtain separate explicit authorization if those are necessary.

## Product reference
`docs/design/ww-live-product-plan-2026-10-16.md` and its final supersession section govern the target UX and Position semantics. P1/P2 remain frozen provenance. The Principal requested Codex continue without further design-review looping on the two deferred findings.
