# ww live — Product plan and Codex handoff (2026-10-16)

Status: Principal-directed planning checkpoint; implementation and operational changes are not yet accepted or deployed. Owning concern: PL-CLI-01 / PL-CONV-01; reconcile with canonical task state before consequential work.

## Principal outcome
Create `ww live`, visually similar to the Principal-accepted `tt live` terminal prototype, but consuming Wheelwright v2 backend exclusively. Use accepted `ww positions` BROKER/ACCOUNT conventions for multiple authorized Accounts. Screenshot from October 16 is an initial layout/behavior reference, **not** a black-background requirement: terminal backgrounds may be dark, light, or custom. Preserve semantic legibility, Unicode/ASCII and width fallbacks; avoid hard-coded background.

Backend owns evidence, Position membership, contract terms, construction, financial calculations, valuations, working-order reconciliation, management semantics and qualification. CLI owns presentation. Never import standalone `tt live` brokerage acquisition/domain calculations into production WW.

## Independent Codex audit
Audited remote main `58161d2bf273f24ad1951d6a94e149b0d4eb768e` on 2026-10-16. Audit was read-only, with 238 selected Node tests passing and Java tests inspected but not run. Findings supplied in Principal conversation; this record preserves the planning disposition, not an invented independently committed audit report.

- Already available: authorized multi-Account Position inventory, snapshot-bound whole-holding explicit associations, backend remaining DTE, underlying quote infrastructure, some Fidelity option bid/ask evidence, October 15 transaction history, bounded legacy continuity precedent, accepted `ww positions` and `tt live` presentation.
- Missing/partial: current quantity/occurrence-qualified managed membership; verified contract terms and payoff construction; opening attribution; option-contract quote admission and coherent package valuation; working-order coverage/reconciliation; management objective and checkpoint evaluation.
- No evidence justifies a new universal Position aggregate, event bus, lifecycle engine, association registry or provider framework. Extend existing capabilities; distinguish unknown from confirmed absent.
- Debit verticals are beyond the accepted TT credit-vertical prototype. Experimental movement and provisional stop-limit interpretation are not first-delivery requirements.

## Proposed delivery progression (engineering plan, not blanket operational authorization)
1. Early read-only operator specimen using v2 inventory, accepted WW account conventions and TT geometry, with explicit unavailable fields and fallback for unassociated/unsupported holdings. Obtain Principal visual feedback before extensive hardening.
2. Bounded current membership/quantity and verified terms/construction for one supported strategy; demonstrate non-grouping of merely matching contracts, no double allocation, adjusted-deliverable uncertainty and preserved `ww positions`.
3. First useful structural monitoring: verified shape/range, qualified underlying spot, existing remaining DTE; unknown economics remain unknown.
4. Parallel evidence tracks: extend quote infrastructure to option-contract observations; add order evidence and coverage, both with provenance, authorization, failure preservation and explicit acquisition.
5. Opening occurrence attribution over accepted transaction history, including partial fills, corrections and close/reopen falsifiers.
6. Qualified package valuation and management evaluation; profit/stop/checkpoint display and skull only for verified absence of a protective stop.
7. Broaden strategy/account coverage; defer experimental movement until separately justified.

## Open Product decisions — ask Principal one at a time
**Principal decision (October 16): A with B as fallback.** Prefer explicit, provenance-bearing operator-established Position associations. Where no applicable explicit association exists, permit brokerage-derived membership only when sufficient evidence establishes it unambiguously; otherwise preserve individual holdings and UNKNOWN membership. Do not manufacture grouping from matching contract geometry. Conflicting explicit/brokerage evidence requires qualification/escalation, not silent override. This is the selected source precedence, not yet a decision on partial quantity allocation.
Quantity/display discussion: identical option contracts (same Account, underlying, expiration, strike, right and terms) may be displayed as one row with aggregate quantity, unless distinct established managed associations require separation. Display aggregation does not prove common opening economics or management; partial allocations remain an engineering/domain question. Principal directed moving on rather than ratifying a universal allocation rule.

**Principal decision — freshness (October 16):** `ww live` is a retained-evidence read, not an automatic brokerage acquisition operation. Operator can explicitly run `ww pull && ww live`. Reuse accepted `ww pull` and v2 backend acquisition semantics; do not invent a new refresh path. Report age/coverage honestly and verify whether `ww pull` acquires all evidence types needed for the target live view; no claim of universal freshness or completeness.

Next: final multi-account display/unknown behavior, one consequential decision at a time. Escalate only material choices.

## Codex next assignment
Architect and drive a bounded first `ww live` structural Product specimen using the audited current backend and accepted UX, with early operator-visible output. First recover latest authority and verify current remote/main/worktree state. Reconcile current PL task state and any other actor's in-flight work. Resolve the single pending membership policy with Principal before hardening semantics that depend on it. Reuse accepted `ww positions` and `tt live` rendering. Keep v2 backend exclusively authoritative. Deliver a concrete runnable specimen and explicit capability limits early, then independently falsifiable engineering evidence. Do not infer permission for brokerage acquisition, deployment, service/database/grant changes, or trading.

## Principal clarification — freshness/acquisition (October 16)
The operator controls acquisition using the existing accepted `ww pull` command, then reads retained evidence with `ww live`, e.g. `ww pull && ww live`. `ww live` itself must not trigger implicit brokerage acquisition or new refresh infrastructure. Distinguish existing pull's actual source/coverage limits from a guarantee that all option quotes/orders are freshly available; display qualification. No new freshness-policy decision is required for the initial slice.

## Principal Product decisions — completed October 16
1. Membership precedence: explicit evidence-backed operator association first; brokerage-derived association as fallback only when unambiguous; otherwise individual inventory. Identical contracts may be displayed as one quantity row when no distinct managed associations require separation; display aggregation does not establish shared lifecycle or management.
2. Consolidated default table across all authorized Accounts, BROKER and ACCOUNT as first columns; no account-by-account sections.
3. Unsupported/incomplete Positions remain visible, with em dash (—) for unavailable values; do not silently omit holdings or turn unknown into zero.
4. Initial strategy focus and default ordering: descending complexity/interest: iron condors, credit vertical spreads, single-leg options, then other holdings. Debit spreads later. This is ordering, not permission to infer membership from geometry.
5. Deliver first runnable structural monitoring early: verified payoff geometry, strike ranges, qualified spot and available DTE; economic/management gaps shown as —. Full economic monitoring follows as backend capabilities mature.
6. All authorized Accounts from the first release; no tastytrade-only phase.
7. Independent verified geometry remains visible when spot or economics are unavailable. Principal expects a usable last known price outside trading hours/weekends. Backend must prefer an admissible retained last observation with its actual age/session/provenance; do not invent a price or mislabel stale as live. If no valid price evidence exists, display — while preserving geometry.
8. Operator explicitly refreshes via existing `ww pull && ww live`; `ww live` is a retained-state read, with no implicit brokerage contact. Existing `ww pull` coverage limitations remain explicit.
9. Screenshot is initial layout reference, not a fixed black-background theme; support light/dark/custom terminal backgrounds.

These are Principal Product decisions, not proof that v2 already supplies missing semantics or authorization for operational acquisition/deployment. Codex should proceed with early specimen and escalate only actual unresolved consequential decisions one at a time.
