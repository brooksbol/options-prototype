# SDK Talk financial dependency integration — October29

Standing: author engineering/verification, not Product ratification, independent implementation acceptance or Principal acceptance. Existing PL-MCP-01 / BUG053 own this work; no new backlog or question registry.

## Authority and baseline

Root AGENTS → docs/AGENTS → docs/README A–F → Codex bootstrap and Principal Decision Surface; ADR024; Doc77 backend/Account/financial authority; maintained Account/Operating Regime and Position/Governed Quantity owners; ASSIM0002 remains PENDING; Product-first mandate/fitness and Technology Quality Constitution. Current task explicitly authorizes ordinary association/dependency corrections inside established contracts. Main verified `8b6857fdfca667bbba6412f196dec2bb2690bfb4`; runtime `0054c2fa`, JAR105b7cd0. Approved tt1 Order/Account-market plus global market grants and300/30request-triggered policies stay fixed. V1/services/unrelated worktrees protected; separate candidate `codex/talk-tactical-financial-20261029`.

Accepted precedents: existing Java terminal contractual payoff, separately qualified current marks/timeline, explicit source-association evaluation and native SVG rendering; existing tt-live domain projection, not terminal formatting. No model/MCP financial calculations, new provider client or question router. Earlier review targets and receipts remain historical/frozen.

## What actually differs

`tt live` groups held contracts, requires one matching Filled whole opening package, uses reported leg fills/current held multipliers and compatible current marks, then renders gross economic progress. V2 normalizes those Orders but evaluates opening economics only after an admitted source association. Its producer currently establishes **current observed closing scope**, not current-held origin.

New inspection finds retained native **OTOCO opening triggers**, not just unrelated opening records. Existing complex-source admission retained parent/child corroboration but discarded explicit trigger/child navigation. [Official provider description](https://developer.tastytrade.com/order-management/) establishes instruction-trigger semantics; it does not establish current-held lifecycle continuity. [Positions documentation](https://developer.tastytrade.com/reference/balances-and-positions/getAccountsAccountNumberPositions/) also exposes average-open-price/cost and creation/update fields. Actual originals retain those fields. This is unmodeled/qualified evidence, not proof the provider lacks entry data. A row-creation timestamp or raw average-price field does not by itself establish a governed opening occurrence or accepted current basis projection.

Independent early [design review](sdk-talk-independent-financial-design-2026-10-29.md), immutable SHA256 `a5f3b5efaa35a0d8a0502b3634b9ac5123650b5717476c79efea06daa85cc67b`, is QUALIFIED: native bracket linkage is independently establishable; a whole/partial close and identical reopen can leave the old bracket working against new holdings. Therefore native trigger→working child→current contracts alone cannot populate current openedAt/openingCashFlow/P/L. ADR016 association authority and the bounded ADR022 continuity distinction are preserved; ASSIM0002 is not resolved here. No accepted opening-to-current completeness premise is invented from a bounded Order scan.

Separately, `PortfolioReadService.propagate` treated cash/share support insufficiency as owned-allocation conflict and erased geometry, marks, entry, economic comparison and management. Source inspection establishes that those fields do not universally depend on support sufficiency. Conservation and coverage are separate predicates. This was a demonstrated overbroad dependency, not a missing market integration or denied permission.

## Field-level admissibility

| Field | Required evidence | Coverage-only failure | Current origin unresolved |
|---|---|---|---|
| Contractual terminal geometry / strike range | Bound contract identity, side, quantity, compatible standard terms/multiplier/expiration and independently reconciled allocation | Preserve, warnings remain | Preserve as TERMINAL_VALUE; no economic break-even/P/L offset |
| Source spot | Qualified underlying bid/ask/mid/currency and source clock | Preserve | Preserve |
| Remaining DTE | Qualified expiration + NY calendar evaluation clock | Preserve | Preserve |
| Original duration | Established applicable opening execution + expiration | Not a dependency | Unavailable |
| Entry cash / gross-P/L geometry | Applicable attributed basis or independently admitted complete opening fills with qualified units/currency/scale | Not a dependency | Unavailable; historical bracket is not substituted |
| Current liquidation mark | Correct constituents/quantities/multipliers, compatible source quotes and clocks | Preserve | Preserve; not investment profit |
| Indicative gross/net P/L | Qualified current basis/opening + compatible marks; net additionally qualified fees | Not a dependency | Unavailable |
| Profit/adverse threshold | Current applicable closing instruction, whole scope/quantity, source price convention and qualified entry reference | Not a dependency | Gross threshold unavailable |
| Manual review checkpoint | Accepted GTD convention, qualified applicable instruction, entry/time prerequisites | Not a dependency | Unavailable; not a timed exit |
| Cash security / support / reservation / availability | Their own Account-wide evidence and rules | Remain insufficient/unknown | Never inferred from shape or bracket |
| Native bracket relationship | Same-Account provider parent/trigger/child identities and explicit source record | Independent | Historical instruction relationship only |

Actual owned-allocation contradictions still invalidate their dependent owned-scope economics/geometry. Invalid terms, mixed currency, missing/stale marks, ambiguous openings, partial quantities and unestablished association retain their existing guards. A fresh quote never repairs stale/missing opening authority.

## Bounded corrections

- Separate coverage warnings from independent allocated-constituent evaluation; retain coverage assessments/relationship qualifications and Account reconciliation. No cash is allocated, reserved or manufactured. Actual allocation failures still use the previous invalidation path.
- Add optional normalized `Order.brokerGroupStructure`: native groupId/type, trigger/child role, canonical same-Account trigger/child references, missing-member count and qualification. Conflicting corroboration preserves reported historical links as CONFLICT instead of silently discarding them. These links create no opening association or held lifecycle event. A finite interpretation marker replays already-retained complex records once; source originals, opaque resource identities and frozen Construction history are preserved.
- Add thin exact `inspect_order_details` MCP read for deliberate canonical Order inspection, with nickname resolution, Account/link checks, finite budget and no history enumeration or provider-original dump. Existing tactical capability consumes corrected DTOs unchanged.
- Native renderer shows only supported cells, contractual geometry and clocks; unknown entry/progress gets a compact note instead of empty gauges. Source/analysis remain deliberate accordions. Pixels stay client-owned; no model SVG/financial arithmetic.

API39HTTP operations unchanged. Contract adds the optional native group structure and clarifies field dependencies. No financial calculation moved to MCP/Talk. No new Account, OAuth, acquisition policy, polling or trading behavior.

## Verification before independent implementation review

-404Java v2 tests,0failures,1skip;60Talk tests pass.8OAS checks/39operations pass. Relevant specimens cover four-leg no-entry geometry, admitted vertical entry/marks (synthetic expected200entry/150gross), no market, stale target, multiple historical candidates, partial fill/remainder, native parent links and conflicting child terms, conservation/coverage and authorization isolation.
- Private real-original replay:4current structures,35Orders with native group links; all4gain qualified TERMINAL_VALUE geometry, source spot/liquidation and remaining DTE. Current opening/progress remain INCOMPLETE. No production-store writes/provider/model requests in this replay. All4tactical and35linked Order DTOs validate against the governed schema.
- Same-originals/clock comparison uses the actual existing tt-live domain code, not an invented algorithm. All4structures, memberships, leg counts, spot values/source clocks/age, remaining DTE and strike boundaries match. CLI gross-P/L geometry includes its matched historical opening credit; backend terminal geometry deliberately excludes unproved current basis. This is a justified difference, not full entry/progress parity. The fourth underlying is preserved; public receipts anonymize its identity.
- Actual SDK candidate against the private Java backend and live original User grants selects the tactical tool naturally:2requests,19,472input/484output tokens;4rows with geometry and no invented entry economics. No provider beans or production writes. Trace export/store/remote compaction off, local session. This is real retained evidence, **not installed-runtime acceptance**. Two earlier harness attempts were blocked by the existing W1 policy when the engineer used guarded global fetch for local host inspection; no model request occurred. The corrected harness uses its captured trusted local HTTP transport, without weakening SDK egress controls.
- Controlled native browser specimen: four strike knots, terminal-value label, no raw JSON/default evidence, no empty progress gauge, keyboard disclosure works, mobile no overflow/page errors. Screenshot is synthetic, not protected brokerage pixels or Principal visual acceptance.
- Initial author checks exposed old tests encoding blanket coverage invalidation, a new Java compound-var compilation error and a synthetic spot fixture missing required bid/ask. Corrected fixtures/assertions preserve source guards and test the new dependency; failures are not relabelled successful runs. Full passing results above are subsequent runs.

Raw financial payloads/IDs/credentials/conversations remain private outside repository/author model context. Only authorized normalized SDK results reach the configured model. Independent implementation review, installed verification and Principal acceptance remain separate and follow.


## Independent implementation falsification and successor

Frozen `405d2cbf4c436ad7526451f41492e7fccab51643` is independently **REJECTED**, [immutable report](sdk-talk-independent-financial-dependencies-review-2026-10-29.md), SHA256 `4ae239b757a0eec5861ec88565f3d60845665cb1d48d277a571a10f203773f4d`. Original source worktree/commit/report stay untouched and were not deployed.

F1: OTOCO without trigger normalized QUALIFIED/null/missing0, contrary to contract. Successor explicitly counts the absent trigger and emits INCOMPLETE; malformed OCO-with-trigger is rejected atomically, without discarding originals or creating a fictitious trigger. F2: one represented holding masked another allocated holding present only in a prior cut. Successor requires every Construction allocation holding to resolve in the Account-cut reconciliation for that Construction before preserving coverage-independent economics. Real owned-allocation gaps still invalidate dependent quantities/geometry/values. The actual SQLite old-cut counterexample and native missing-member cases are regressions, not merely assertions about helper output.

Correction branch `codex/talk-tactical-financial-correction-20261029` is isolated from frozen405. Initial new regression fixture compilation used the wrong repository put overload; subsequent DTE check lacked source grants and correctly redacted its own date. The corrected synthetic principal has the read permissions needed to isolate the allocation predicate; production grants were not changed. Focused corrected tests pass; final whole-suite/replay/re-review follow. No current-opening association or weaker continuity predicate is added.

Successor author verification:406Java v2 tests,0failures,1skip. Existing60Talk and8OAS checks cover unchanged client/MCP/contract trees relative to405; new successor changes only Java allocation/missing-trigger predicates plus regressions and interpretation marker. Private fresh-current replay again has4healthy structures/35native-linked Orders with all terminal geometries restored and entry/progress unknown; schema validation passes for4+35and explicitly rejects the missing-trigger QUALIFIED shape. One ordinary approved tt1 holdings acquisition refreshed the acceptance cut successfully before replay; no grant/policy change. Frozen405positive proof and subsequent rejection remain distinct. Successor freeze/re-review follows.

Independent [financial dependency re-review](sdk-talk-independent-financial-dependencies-rereview-2026-10-29.md), immutable SHA256 `acc80fbb49261a1b4e0aabcd24839c8c8995086be7af4a14182985521abd94ae`, **ACCEPT within bounded source scope** at `6f5ed3081d7c35842d03f4e117725be8e3f19167`. Both original falsifiers and positive coverage/allocation/native/scope controls independently pass. No current-origin inference was added. Reviewer did not inspect protected live payloads or certify full-suite/installed/Principal acceptance.

Concurrent remote main9ae70988 adds the Principal-accepted daily ChatGPT TT1 Positions report and its exact shorthand lookup routing. Both files were read and preserved unchanged. The report explicitly has presentation/operator-preference standing; it does not ratify a new current-held-origin predicate or alter this SDK agent architecture. Integration87162993 merges those docs with6f; git tree comparison confirms Java/MCP/Talk/API contract content is byte-identical to6f and both concurrent documents exactly match9ae. No v1 runtime implementation changes. Existing source-origin boundary remains.

A final synchronization guard prevented installation when remote advanced again to8d8481b9 (8ec41342 and8d8481b9). Both further edits are docs-only: exact report rendering and future Talk UX precedent, explicitly no current Talk implementation grant from that documentation capture. Those documents were read and merged unchanged; this financial task retains its separately explicit engineering authority. Runtime/API trees remain byte-identical to independently accepted6f. No source values or ZIP example figures are reused as current financial evidence.
