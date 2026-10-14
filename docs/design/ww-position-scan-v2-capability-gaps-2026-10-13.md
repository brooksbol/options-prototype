# Fresh ww Position scan — v2 capability gaps

**October14 cleanup disposition:** retained unaccepted design evidence; Principal architectural review remains pending. The orphaned runnable source draft is now preserved as [inactive recovery material](ww-position-scan-draft-recovery-2026-10-14/README.md). Statements below about the uncommitted draft or its runtime/tests describe the October13 observation, not current installed behavior. No implementation or Product acceptance follows from cleanup.

Status: current bounded discovery and engineering checkpoint under PL-CONV-01 / PL-CLI-01. Not an accepted API contract, independent review, deployment, or Product acceptance.

## Principal direction and fresh start

On October 13 the Principal requested `ww show positions` with the existing `tt live` appearance and one additional column, ACCOUNT. The Principal supplied the latest Desktop screenshot as the UX reference, selected a fresh build from current main, directed deletion of the abandoned implementation, and confirmed that the fresh build includes missing backend support.

The Principal explicitly clarified that `tt live` was only a UX prototype. `ww show positions` must communicate only with the Wheelwright v2 API. Capability gaps must be reported. This is an application of ratified `PRIN-ARCH-BACKEND-AUTHORITY`, not an exception or a new principle.

The prior Increment A/R3 implementation must not be resumed. Its implementation archive, 19 helper/metadata files and working patch were deleted on instruction. Rejected candidate identities and the independent R2 rejection report remain as failure evidence; unrelated work and accepted-release recovery materials remain. Local deletion receipt: `~/.local/share/wheelwright/workspace-reset-20261013/increment-a-deletion.json`.

Base/SYNC: `b94e5b75a78e0bc1b57f34228fc5c2aace8751bd`; main was clean and matched remotely advertised main before fresh edits. No new task branch, operational installation, service restart, brokerage request, evidence admission, grant/configuration change, migration, commit or push occurred.

Reference: `~/Desktop/Screenshot 2026-10-13 at 3.09.58 PM.png` (the actual filename contains a narrow no-break space before PM). It shows UNG, EWZ and XLE managed rows with PAYOFF, RANGE, SPOT, SPAN, EXIT PROFIT, P/L and QUOTE. ACCOUNT is the sole added scan column, using backend-discovered friendly nicknames. The screenshot is UX evidence, not admissible brokerage evidence.

## Recovered precedent and invariants

- Accepted presentation: `docs/cli/tt-live-panel.md`; literal reusable `scripts/tastytrade-live-render.mjs` and its pure payoff geometry renderer. Prototype recognition, valuation, freshness and broker-client modules are excluded from the production ww dependency graph.
- Governing boundary: `docs/principles.md` PRIN-ARCH-BACKEND-AUTHORITY and `docs/77-api-v2-architectural-guardrails.md`. Backend owns evidence, semantic associations, business rules and financial conclusions. CLI owns terminal geometry, formatting and interaction.
- Association is an authoritative claim: ADR-016; draft Doc 58 is supporting semantic context, not ratified domain authority. Four matching contracts alone do not establish managed membership. Current working instructions, managed association, recognized construction, Program membership and opening continuity are separate assertions.
- Opening continuity: Doc 70 and ADR-022 are bounded short-obligation precedents, not automatic current-package membership or permission to inherit opening economics after close/reopen.
- Existing source retention, Account identity/grants and immutable snapshot provenance are reused. GET remains a pure read. Acquisition is explicit and separate; failed refresh preserves successful evidence. No broker submission or modification is part of this task.
- Existing fitness-control program is reused. Tests below are invoked engineering checks, not an externally enforced unskippable substrate. WW-GATE-001 remains staged/unstarted.

## Verified capability inventory

The common v2 OAS references `docs/contracts/api-v2-account-evidence.json`. Actual Java controllers, PositionReadService, PositionSnapshot, PositionAcquisition and TastytradeClient agree on the bounded holdings behavior below. A read-only installed `ww show positions --account tt1 --jsonl` confirmed eight retained EWZ/XLE constituents; no new broker contact was made.

| Operator field | Existing reusable v2 capability | Actual gap |
|---|---|---|
| ACCOUNT | GET /v2/accounts: authorized canonical identity, alias, display name, broker association | No capability gap for the column. Use alias; no raw broker number or GUID burden. |
| SYMBOL / managed row | GET /v2/positions: observed contract/custody inventory and explicit snapshot-bound associations | No qualified current managed-package association from brokerage working evidence; no automatic symbol/geometry grouping. Preserve constituents when association is unestablished. |
| PAYOFF / RANGE | Existing positions carry contract text and expiration; explicit associations can name constituents | No v2 verified standard deliverable, multiplier and construction result or derived expiration payoff/plateau. Contract text alone cannot prove these. |
| SPOT | GET /v2/quotes and GET /v2/quotes/{symbol}: held underlying quote facts/provenance, independent explicit acquisition | Backend Position-to-underlying association, selected price primitive, admissibility and coherent movement result are not supplied for this use. Existing quote facts are reusable; a second quote store or CLI-derived midpoint/status is unjustified. |
| SPAN | Backend constituent dte and evaluatedAt | No occurrence-qualified opening date/lifespan result. Snapshot receipt/export date is not opening time. |
| EXIT PROFIT | Position qualifications explicitly say orders/close policy unknown; workingOrderCoverage is contractually UNKNOWN | No retained/read working instruction coverage, qualified target/stop association, applicable exit objective or computed progress. Broker instruction is not a Wheelwright Program/policy or execution fact. |
| P/L | Broker-reported openPl/marketValue, nullable; tastytrade holdings have these unavailable | No opening-attributed package credit, qualified option close valuation, gross opening-minus-close P/L or valuation status. Existing broker openPl is a different metric and must not be claimed as the prototype's gross package P/L. |
| QUOTE | Underlying quote clocks exist independently; holdings acquisition has request/receipt bounds | No option-quote capability in the common v2 direct-quote contract (ResolvedSubject excludes option contracts), nor backend Position-level evidence coverage/age/status. Holdings receipt age must not become quote age. |

POST /v2/position-acquisitions currently requests holdings only. It does not supply orders, fills, instrument terms or option quotes. GET /v2/artifacts and ledger retention do not by themselves establish current order coverage, opening attribution or quote admissibility. These are missing evidence and semantic capabilities, not simply missing CLI fields. No universal lifecycle engine, new Position aggregate, event bus or connector framework follows from the gaps.

Step 6 is shared governed reconsideration. The earlier conversational description equating these display gaps with Step 6 was incorrect. This fresh scan does not authorize or require that broader capability.

## Fresh runnable specimen and limits

The uncommitted presentation draft reuses the shared pure renderer, adds ACCOUNT and uses existing authorized-scope GET /v2/positions plus Account discovery. Explicit Account/snapshot selection, verbose constituent/evidence inspection and complete backend JSONL remain available. Prototype broker credentials are not consumed; redirects are rejected.

This is an inventory fallback specimen, not the requested finished managed display. It renders current backend contract rows and DTE with unavailable instruments. The draft's P/L currently displays existing backend broker openPl when present; before managed delivery the contract must distinguish that basis from package gross P/L. No fake payoff, fabricated opening date, geometry grouping, synthetic exit progress or receipt-derived quote age is supplied.

Author verification: 98 existing relevant CLI/tt/observation/confidentiality tests passed; three additional API-boundary tests passed. Public CLI tests observe only GET /v2/accounts and GET /v2/positions, reject a v2 redirect to a broker, and inspect the renderer's dependency graph for prototype domain/broker imports. No independent review or native Terminal Product acceptance is claimed.

## Bounded backend design work

Reuse current backend retention, Account authorization, observation identity and existing Position resource. Establish domain capabilities before selecting OAS additions or source transports. The backend must expose separately qualified current association, construction/terms, opening attribution, working instructions, valuation and evidence status. Each conclusion binds to recoverable evidence and its effective/observed/recorded times; a failure in one does not invent or erase unrelated known facts.

Additional source observations require explicit source-specific coverage and admission semantics. Do not quietly widen the existing holdings acquisition contract. Report proposed v2 capability/contract changes before implementing around missing public capabilities. `ww show positions` must remain GET-only with no read-triggered provider work. Explicit acquisition is a separate operation, with separate capabilities, durable outcome and preservation of earlier successful evidence.

Required falsifiers include overlapping packages/quantities; malformed or missing references; terminal orders with incoming successor links; unresolved or contradictory replacement/cancellation graphs; different observation generations; instrument disagreement/adjusted deliverables; incomplete/negative package valuation; quote staleness versus retained session validity; close/reopen opening-attribution failure; independent unknowns; Account isolation; and unchanged constituent/machine/verbose paths. Rejected R1/R2 findings remain regression requirements, not implementation material or a grant to resurrect the abandoned design.

The next engineering action is bounded backend capability/contract design with an evidence-backed proof index and runnable positive/negative specimens. The overall Product outcome remains open until ordinary installed behavior is accepted by the Principal. Operational promotion, live acquisition/admission, service/database/configuration/grant changes and brokerage actions are not performed or implicitly authorized by this checkpoint.
