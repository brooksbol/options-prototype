# Assimilation Obligations — Canonical Ledger

<!-- ASSIMILATION-LEDGER v1 -->

**Category:** C — canonical project work-state record.
**Owns:** the state of *assimilation obligations* — consequential learning that has been recognized but not yet (or only now) carried into maintained Wheelwright knowledge.
**Does not own:** domain, Product or architectural meaning. Meaning lives in the maintained subject owners under [`knowledge/`](knowledge/README.md) and in the authorities they cite.
**Does not confer:** execution, implementation, ratification, deployment or any other mutation permission. No state below authorizes anything by itself.
**Basis:** ADR-023 D3 (learning assimilation) and D5 (context delivery). The record format follows the *unratified* A8 Candidate 4 durable-obligation proposal as implementation guidance only; Candidate 4 is not ratified by this ledger.
**Established:** October 19, 2026, under the Principal-authorized 4AM first knowledge-assimilation slice.

## How to use this ledger

- **Finding open work:** search this file for `ASSIM-STATE: PENDING` or `ASSIM-STATE: READY`, or for a subject marker (for example `ASSIM-SUBJECTS:` containing `position`).
- **Allocating an ID:** reconcile against current remote `main` first. IDs are `ASSIM-NNNN`, monotonically allocated, never reused or renumbered. Read-only actors do not reserve IDs; they deliver a handoff (below) to a receiver who can persist.
- **Closing work:** `VERIFIED` requires an applied target (exact path and commit) **and** an independent verification witness. Target existence or self-attestation alone cannot close an entry.
- **Structural check:** `python3 scripts/check-knowledge-slice.py --local` validates fields, receipts and closure evidence. It does **not** establish semantic correctness.

### States

| State | Meaning |
|---|---|
| `PENDING` | Something named is missing: destination, evidence, judgment or permission. |
| `READY` | The recorded resume trigger is evidenced. Independent of write permission. |
| `APPLIED` | Exact authorized maintained-target changes exist (path + commit recorded). |
| `VERIFIED` | Scoped closure criterion met and independently witnessed. Closed. |
| `CANCELLED` | Evidenced rejection, duplicate or no-generalization disposition, with surviving links. Age or missing ownership never cancels learning. |

### Required entry fields

`ASSIM-ID`, `ASSIM-STATE`, `ASSIM-SUBJECTS`, `ASSIM-DEPENDS`, `ASSIM-HANDOFF`, `ASSIM-SOURCES`, `ASSIM-DESTINATION`, `ASSIM-RECEIVER`, `ASSIM-RESOLVER`, `ASSIM-PERMISSION`, `ASSIM-RESUME`, `ASSIM-CLOSURE`. `APPLIED` additionally requires `ASSIM-APPLIED`; `VERIFIED` additionally requires `ASSIM-APPLIED` and `ASSIM-WITNESS`; `CANCELLED` requires `ASSIM-CANCELLED`.

### Handoff receipts

A producer that cannot persist (read-only reviewer, conversation conduit) hands work to a named receiver. The receiver records an `EXPECTED` receipt before the producer relinquishes responsibility, then updates it to `RECEIVED` with the AH→ASSIM mapping once entries are persisted on accepted remote `main`. A ZIP, local file, unpushed commit or actor statement is not a durable handoff. `EXPECTED` without mapped entries is a visible missing submission.

`AH-` keys are the first 12 hex characters of SHA-256 over safe locator fields only (source revision, path, section, concern, intended consequence) — never secrets or financial values.

---

## Handoff receipts

### AH-c55f13e0ce4d — 4AM stopping point → first canonical-knowledge slice

```text
HANDOFF-ID: AH-c55f13e0ce4d
HANDOFF-STATE: RECEIVED
HANDOFF-PRODUCER: 4AM review (Principal + ChatGPT conduit + Codex/Kiro inputs), preserved in the October 18 4AM stopping-point checkpoint
HANDOFF-RECEIVER: Kiro, repository-resident persistence role, under the October 19 Principal authorization (4AM first knowledge-assimilation slice, Option A)
HANDOFF-SOURCE: docs/discovery/4am-knowledge-reconstruction-assimilation-stopping-point-2026-10-18.md sections 4, 6, 7 @ 345a4d7b1c91e42937a62f0d9d7276b3bc0edb1f
HANDOFF-EXPECTED-COUNT: 2
HANDOFF-MAPPING: ASSIM-0001; ASSIM-0002
```

**Scope of this receipt.** The Principal authorized exactly two obligations for the first slice. The stopping point's other recognized items stay owned by that checkpoint and are **deferred, not dropped**. They are not registered here: priority 3 (Recommendation → Decision → Execution → Outcome), priority 4 (accepted capability vs realized software) and the §10 housekeeping. Priority 1 (stale actor steering) is handled directly by this slice's bounded steering corrections, with no separate obligation. Registering any of them is future, separately authorized work. Authorization and verification evidence for this slice: [`discovery/4am-first-knowledge-slice-verification.md`](discovery/4am-first-knowledge-slice-verification.md).

Key input: `345a4d7b1c91e42937a62f0d9d7276b3bc0edb1f|docs/discovery/4am-knowledge-reconstruction-assimilation-stopping-point-2026-10-18.md|sections 4,6,7|concern=domain:account,operating-regime,position,governed-quantity|consequence=first canonical knowledge slice`.

---

## Obligations

### ASSIM-0001 — Account does not determine Operating Regime (closed)

```text
ASSIM-ID: ASSIM-0001
ASSIM-STATE: VERIFIED
ASSIM-SUBJECTS: account; operating-regime; governed-quantity
ASSIM-DEPENDS: ASSIM-0002
ASSIM-HANDOFF: AH-c55f13e0ce4d
ASSIM-SOURCES: docs/82-v2-ontology-resource-semantic-coverage-reconciliation-2026-10-07.md#operating-regime-scope--v2-reconciliation (Principal-ratified); docs/81-v2-operator-journey-action-surface-discovery-checkpoint-2026-10-06.md section 3 (Category D discovery specimen); docs/80-v2-question-driven-lifecycle-product-architecture-milestone-2026-10-06.md section 6; docs/58-wheelwright-semantic-model-v1.md "Identity and economic world" (unratified draft); docs/77-api-v2-architectural-guardrails.md section 2 Account identity (Principal-ratified)
ASSIM-DESTINATION: docs/knowledge/domain/accounts-and-operating-regimes.md (to be created by this slice)
ASSIM-RECEIVER: Kiro, repository-resident persistence role (4AM first-slice authorization, October 19, 2026)
ASSIM-RESOLVER: Already settled by Principal ratification in Doc 82; no new human judgment required unless source inspection finds a same-scope conflict
ASSIM-PERMISSION: Knowledge-documentation assimilation only, inside the October 19 4AM first-slice authorization. No code, API, policy, data or runtime change.
ASSIM-RESUME: Maintained destination page exists on accepted remote main
ASSIM-CLOSURE: Destination states the qualified current answer with source standing and scope; Doc 58 "Account Regime" vs Doc 82 operating regime reconciled as distinct concerns, not a silent winner; a fresh actor answers "Does an Account determine its Operating Regime?" correctly without document-number hints; independent witness recorded
ASSIM-APPLIED: docs/knowledge/domain/accounts-and-operating-regimes.md#does-an-account-determine-its-operating-regime @ 65e8d61c7f798ad4e3768bb315e76ec95188c17d
ASSIM-WITNESS: docs/discovery/4am-first-knowledge-slice-verification.md#7-session-two--after-assimilation @ c9949b11569022b12e23665ade8b9b239d431a97 (fresh-context reader on a fresh GitHub clone at 0a6535a answered Q1 and variants a–e correctly and verified the Doc 82 sentence itself; source reconciliation in section 4 of the same record; limitations recorded there)
ASSIM-HISTORY: 2026-10-19 PENDING @ b765bae9857cc9575773c7d697d3f25a87038249; 2026-10-19 APPLIED @ 65e8d61c7f798ad4e3768bb315e76ec95188c17d (maintained page created); routing/steering corrections @ c8c85c551c3fa9f58b802485786c1fea90ba2dfd; 2026-10-19 VERIFIED (witness above)
```

**Why held:** the meaning is already Principal-ratified (Doc 82, October 7), but it has no maintained subject owner. A fresh actor meets Doc 58's older "Account Regime … applicable to an Account" wording first and has to reconcile it alone. This is the concrete example named in the 4AM stopping point §4.

**Surviving meaning to assimilate:** An Account does not determine its Operating Regime. Operating Regime applies to explicitly governed capital or inventory scope, including cash-side capital. One Account may contain separately governed quantities under different regimes. Account accounting/execution context (cash vs margin balance dialect, "Account Regime" in older vocabulary) is a separate concern. Exact scope identity remains unresolved (see ASSIM-0002).

**Downstream consequences to check:** steering vocabulary, `07-architecture-current.md` routing, cold-start bootstraps. No contract, code or data change is implied.

### ASSIM-0002 — Position / governed-scope identity is unresolved

```text
ASSIM-ID: ASSIM-0002
ASSIM-STATE: PENDING
ASSIM-SUBJECTS: position; governed-quantity; operating-regime; inventory-block
ASSIM-DEPENDS: none
ASSIM-HANDOFF: AH-c55f13e0ce4d
ASSIM-SOURCES: docs/82-v2-ontology-resource-semantic-coverage-reconciliation-2026-10-07.md "Position versus governed scope", "Position as the default decision subject", "Open questions deliberately preserved" items 1, 2, 7 (Principal-ratified candidate; questions explicitly open); docs/07c-adrs.md ADR-022 (Principal-ratified, bounded option cohorts); docs/69-assignment-centric-wheel-v1-operating-program.md "Membership semantic" (ratified); docs/parking-lot-10.md PL-CONV-01 Account identity checkpoint (Position occurrence and Account/Position convergence sequencing open)
ASSIM-DESTINATION: docs/knowledge/domain/positions-and-governed-quantity.md#unresolved-position-identity (maintained page records the open question; resolution awaits a decision)
ASSIM-RECEIVER: Kiro, repository-resident persistence role (records and maintains the open obligation only)
ASSIM-RESOLVER: Principal (Product meaning of Position identity and lifecycle), with independent Codex architectural falsification of any proposed identity model
ASSIM-PERMISSION: None granted for resolution. Recording and routing only. Resolving Position identity, designing Inventory Block, or changing v2 resources requires separate Principal authorization.
ASSIM-RESUME: A Principal-ratified decision on Position identity/lifecycle (Doc 82 open question 1), on Inventory Block survival (question 2), or on Operating Regime representation (question 7); or a v2 specimen result showing whether the 250 SPY = 150 Buy & Hold + 100 Growth Wheel split can be carried as separate Positions without manufacturing brokerage holdings
ASSIM-CLOSURE: The maintained Position page states the ratified identity/lifecycle rule with source and scope; dependent pages (Operating Regime, Governed Quantity), v2 contract references and steering are reconciled or carry justified non-changes; fresh-actor recovery confirms the revised answer; independent witness recorded
ASSIM-HISTORY: 2026-10-19 PENDING @ b765bae9857cc9575773c7d697d3f25a87038249; 2026-10-19 open question recorded on maintained page @ 65e8d61c7f798ad4e3768bb315e76ec95188c17d (still PENDING; not resolved)
```

**Why held:** a genuinely unresolved Product/architecture question. There is no ratified universal Position identity spanning broker holdings, display rows, governance scopes, constructions and lifecycle continuity. Doc 82 ratified Position only as the *default decision subject* inside a v2 resource-design candidate and explicitly left identity open.

**What must not happen meanwhile:** do not promote candidate URIs (for example `/v2/accounts/{account}/positions/{position}`) into operative contracts; do not treat the accepted `ww positions` display rows as the canonical Position identity; do not infer Operating Regime from Account while the scope identity is open.

**Affected subjects:** Position, Governed Quantity, Operating Regime, Inventory Block (candidate only).
