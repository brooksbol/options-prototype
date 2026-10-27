# BUG-050 — Covered-call recommendations surface strikes below cost basis (loss if called away)

- **Status:** Open — filed October 27, 2026
- **Severity:** Not established (Principal has not assigned one)
- **Area:** Write Desk (Deployment, v1) / covered-call Decision path (`recommendCalls`)
- **Provenance:** Principal report in the October 27, 2026 Kiro session, made while reviewing the Deployment page Cash Deployment — Prod v0 export (`wheelwright-cross-entry-2026-10-27.csv`)

## Principal statements (exact wording, in order)

1. "i think i found a bug in the cash deployment table in the console page in ww v1. appr-->strike column should never have negative values. confirm"
2. "deployment page, not console page, sorry"
3. "it's a bug even if i approved it. follow the bug protocol and file a bug for this. loss if called away is unacceptable."
4. "this does not apply to puts, just calls including BWs"

## Intended semantics violated

For **calls, including buy-writes**, appreciation to strike must never be negative: a call that would sell shares for a **loss if called away is unacceptable** (Principal, statements 3–4). Puts are explicitly excluded, so the negative Appr→Strike values on CSP rows remain correct and are not this defect.

The Principal's ruling holds even though earlier behavior was Principal-accepted. The October 1 Appr→Strike column (`4177ee6f`) was accepted with its signed convention, and the covered-call path's lack of a basis guard predates this record.

*Actor interpretation (not Principal quotation):* "appreciation to strike" is the share leg only (strike − share basis, premium excluded), matching the Appr→Strike column. The share basis is the purchase price (spot at entry) for a buy-write and the holding's cost basis for a covered call on held shares. "Never negative" admits strike = basis.

## Observed failure

The covered-call engine surfaces its target-delta pick without checking it against cost basis. A call struck below basis is filed as an ordinary ACTIONABLE/EDGE candidate in the Calls table.

Executable specimen (derived; run against the unmodified `main` engine with a synthetic fixture through `recommendCalls` and `DEFAULT_RECOMMENDATION_POLICY`, October 27, 2026, at `11a7cc1c`; the temporary probe was deleted after the run):

| Input | Value |
|---|---|
| Holding | XLE, 100 free shares, broker average cost **$63.00** |
| Spot | $58.00 |
| Chain (24 DTE) | $60 call bid/ask 1.20/1.30, Δ 0.30; $62 call 0.60/0.70, Δ 0.18 |

Output: one candidate, **strike $60, basis $63, posture ACTIONABLE, selection `target-delta`**. Called away, the shares sell **$3.00/share (−$300/contract) below basis**. The $1.25 mid premium does not cover the loss. No `basis+` alternative was offered, because no admissible strike was at or above $63.

The Principal-supplied cross-entry export contains no call-side violation. All 46 buy-write rows have positive Appr→Strike, and every negative value is a CSP row. The demonstrated call-side failure is the covered-call path above.

## Evidence (source-confirmed)

- `options-prototype/src/write-desk/recommend-calls.ts`: step 1 files `buildCandidate(targetContract, "target-delta")` with no strike-versus-`basisPerShare` check. Step 2 adds a `basis-positive` row (lowest admissible strike ≥ basis) only as an *additional* alternative. It does not remove or demote the below-basis pick.
- `options-prototype/src/components/WriteDesk.tsx` `CallCandidateTable`: shows Spot and Basis columns plus a `δ`/`basis+` tag. A below-basis row gets no warning, no exclusion and no appreciation-to-strike value.
- **Compliant paths (regression guards, not defects):**
  - `recommend-buy-writes.ts`: the "Strategy Fitness: require positive appreciation" filter keeps only `strike > underlyingPrice`. Otherwise it records the terminal reason "No positive-appreciation call available" (`strategyUnfit`).
  - `conditioned-call-surface.ts` (contingent / if-assigned calls): counts `strike <= basis` as `callsBelowBasis` and excludes those calls.

## Consequence

On a real-money decision surface, Wheelwright presents a Principal-unacceptable outcome (a share loss on call-away) as an ordinary actionable recommendation. Nothing on the row says it violates the call-away rule.

## Diagnosis / root cause

Established at source level. The covered-call path has no "never sell below basis" admissibility rule. The buy-write and contingent-call paths each carry an equivalent rule on their own. The basis-positive row was added as optionality rather than as a constraint.

## Scope / non-goals

- In scope: covered calls on held inventory in the v1 Deployment Calls table, its funnel and its CSV export.
- Buy-writes and contingent calls are in scope only as regression guards.
- Puts/CSPs are explicitly out of scope (Principal statement 4). Their signed negative Appr→Strike is correct.
- Not in scope: v2 / `ww` CLI / Talk surfaces, unless separately identified.
- Filing does not authorize remediation.

## Open questions for the Principal

1. **Unknown basis:** when a holding has no broker basis (`economics` null), should the covered-call path fail closed (no candidate, explicit reason) or surface with an explicit "basis unknown" qualification?
2. **Premium inclusion:** confirm the rule is share-leg only (strike ≥ basis), not net of premium (strike + premium ≥ basis).
3. **Placement:** should a below-basis call be excluded entirely, following the buy-write `strategyUnfit` precedent, or kept visible but non-actionable?

## Acceptance criteria

1. Under the default policy, no covered-call candidate with strike below a known cost basis is presented as ACTIONABLE or EDGE.
2. The specimen above produces no below-basis recommendation. Its funnel/terminal record states the reason explicitly, following the buy-write `strategyUnfit` precedent and BUG-016 membership accounting.
3. Calls at or above basis are still surfaced, including the `basis-positive` selection.
4. Buy-write (`strike > spot`) and contingent-call (`strike > basis`) guards remain unchanged.
5. CSP Appr→Strike behavior is unchanged.
6. The behavior for open questions 1–3 matches the Principal's answers.
7. The Principal accepts the change in the browser on the Deployment page.

## Remediation history

None.

## Verification

None.

## Related

- `4177ee6f` — Appr→Strike column on Cash Deployment — Prod v0 (signed convention; CSP side unaffected).
- BUG-039 — buy-write chain mispairing (separate buy-write economics defect).
- BUG-016 — funnel membership/terminal-reason accounting precedent.
- PL-ARCH-06 — browser-local recommendation engine placement (context only).
