# Accounts and Operating Regimes

**Maintained subject owner** for **Account** and **Operating Regime** (ADR-023 D1).
**Category:** A, bounded to the already-established meaning of these two subjects. This page integrates and routes to the authorities below. It does not ratify candidate semantics, supersede supported contracts, or authorize implementation.
**Established:** October 19, 2026 (4AM first knowledge-assimilation slice; obligation `ASSIM-0001` in [`../../assimilation-obligations.md`](../../assimilation-obligations.md)).
**Related subjects:** [Positions and Governed Quantity](positions-and-governed-quantity.md).

---

## Short answer

<a id="does-an-account-determine-its-operating-regime"></a>

**Does an Account determine its Operating Regime?**

**No.** An Account does not determine its Operating Regime. A regime applies to *explicitly governed* capital or inventory scope, and that includes cash-side capital, not only shares. One Account may contain separately governed quantities under different regimes. The Account's accounting/execution context (for example cash versus margin) is a separate concern. The exact identity of a governed scope (Position, Inventory Block or something else) is **still unresolved**.

*Standing:* Principal-ratified Product/architecture reconciliation, October 7, 2026 (Doc 82, "Operating-regime scope — v2 reconciliation"). The ratified sentence:

> An operating regime applies to the explicitly governed capital/inventory scope for which it is authoritative. Account identity or account accounting/execution context does not establish that operating regime. One account may contain separately governed quantities under different operating regimes. The canonical identity of those scopes remains subject to Position/Inventory reconciliation.

Standing specimen: one Account holds 250 SPY shares, with 150 governed under Buy & Hold and 100 under Growth Wheel. The same symbol in the same Account carries two regimes. See [Governed Quantity](positions-and-governed-quantity.md#governed-quantity).

---

## Account

<a id="account"></a>

### Current meaning

A Wheelwright **Account** is Wheelwright's stable identity for one brokerage account. That identity is distinct from all of these:

| Distinct from | Why it matters | Standing / source |
|---|---|---|
| Broker account number / external reference | The number is sensitive, broker-scoped evidence, never a canonical identity, never in API paths. Human output masks it (at most last four). | Principal-ratified, Oct 11, 2026 — Doc 77 §2 "Account identity, operator nicknames and account-number confidentiality"; earlier Sept 21 ratification in Doc 57 |
| Nickname / display name (e.g. `pts`, `sawdust`) | Operators use nicknames, resolved by backend discovery. Renaming preserves identity, evidence, Positions and grants. | Principal-ratified, Oct 11 — Doc 77 §2 |
| User identity | Tokens identify immutable Users. Users and Accounts have independent IDs. | Principal clarification, Oct 11 — Doc 77 §2 "User identity and Account access" |
| Access grants | Backend grants establish many-to-many User–Account access. Knowing an ID, nickname or ownership grants nothing. Private Account information is inaccessible by default (Model A). | Principal-ratified, Oct 11 — Doc 77 §2 "Account information isolation…" |
| Financial / legal ownership | A separate concept from both identity and access. | Principal-ratified, Sept 21 — Doc 57 "Codex review closure"; reaffirmed Doc 77 |
| Operating Regime | See below. Account identity does not establish it. | Principal-ratified, Oct 7 — Doc 82 |

**Identity representation.** One immutable, globally unique, randomly generated GUID per Account; standard unprefixed UUID is the intended representation. Existing `acct_`-prefixed random IDs conform semantically. Migration is **deferred, not authorized** (Doc 77 §2).

**Account locality.** Account-local durable state is keyed by the stable Wheelwright Account identity, not by Operator/User. *Principal-ratified Sept 21, 2026* (Doc 57; `PL-PORT-01`). In the v1 governed-decision substrate the key is a client-supplied opaque `brokerageAccountId`. That does **not** make the v1 backend an Account registry (`07-architecture-current.md`, "Account locality").

### Account accounting/execution context ("Account Regime" in older vocabulary)

<a id="account-accounting-execution-context"></a>

Brokerage accounts have an accounting/execution context: cash versus margin, which balance fields mean deployable cash, broker permission tier. This is real, and it is **not** the Operating Regime.

- **Balance dialects.** Fidelity CASH/legacy and MARGIN accounts expose different balance fields. The remediated BUG-022 projection maps CASH → "Available to trade (all settled)", MARGIN → "Available without margin impact", INDETERMINATE → fail closed. *Principal-ratified*; the canonical home is [`../../foundations/options-domain-reference.md`](../../foundations/options-domain-reference.md). The layering is: broker-native facts → account-regime classification → Wheelwright semantic projection → policy (Doc 56; `PL-DEPLOY-BAL`).
- **Broker permission** is an execution-eligibility constraint, not a strategy property (broker-permission record in `parking-lot-6.md`; Doc 46).
- **Older term.** The unratified Semantic Model draft (Doc 58) calls this an *Account Regime*: "semantic/accounting/execution regime applicable to an Account; a property/context of an account". Doc 80 keeps "Account versus Account Regime" as reusable v2 vocabulary. Read "Account Regime" as **this accounting/execution context**. It is not the Operating Regime.

### Accepted behavior versus realization

| Claim | State | Evidence |
|---|---|---|
| v2 Account identity, nickname discovery, User–Account grants | **Implemented** and **Principal-accepted** (Account operating loop, Oct 11, 2026) | Journal / `PL-CLI-01` records, Oct 11; `cli/ww-account-evidence.md`; `contracts/api-v2-account-evidence.json` |
| Default masking of account numbers in `ww ls accounts` | **Not conformant** when recorded — BUG-035 | [`../../bugs/INDEX.md`](../../bugs/INDEX.md) (check the record for current status) |
| `ww accounts` single human Account view | **Proposed / parked** design (Oct 17); no implementation or table acceptance | `design/ww-accounts-2026-10-17/README.md` |
| Wheelwright Talk H-004 r1 authorized Account question | **Installed, real-data author-verified, independently accepted and Principal-accepted** (Oct 23, 2026); exact source02e4f45 | [Acceptance/integration receipt](../../discovery/h004-r1-authorization-acceptance-integration-2026-10-23.md); access means backend-authorized visibility, not legal ownership or brokerage completeness |
| Retained broker-balance API/MCP projection | **Author-verified candidate (Oct27), independent review/installation pending**; distinct cash/BP/requirements, no debt/regime inference | [Coverage correction receipt](../../reviews/sdk-talk-capability-audit-2026-10-27.md) |
| Other currently installed / running backend Account behavior | **UNKNOWN beyond the bounded delivery evidence cited here**; H-004 does not certify all Account capabilities | — |

---

## Operating Regime

<a id="operating-regime"></a>

### Current meaning

An **Operating Regime** gives "work" its meaning for some explicitly governed capital or inventory. Examples are Buy & Hold, Growth Wheel and Assignment-Centric Wheel. The same 100 shares may correctly be LEAVE ALONE under Buy & Hold and admit SELL SHORT CALL under Growth Wheel (Doc 81 §3, discovery evidence).

Established rules (Principal-ratified, Doc 82, Oct 7, 2026):

1. A regime applies to the **explicitly governed scope** for which it is authoritative.
2. **Account identity does not establish it.** Neither does the Account's accounting/execution context.
3. **One Account may contain several regimes** across separately governed quantities.
4. Regime scope is **not shares-only**: governed cash-side capital is included.
5. **Scope identity is unresolved.** It waits on Position/Inventory reconciliation (Doc 82 open questions 1, 2, 7; obligation `ASSIM-0002`).

Further constraints, from other authorities:

- Do not infer regime from Roth/taxable/account identity, ticker, prior Wheel activity or chain availability (Doc 81 §3 discovery; ratified for the MVP 1 decision subject in Doc 81 §27.3).
- Generic Account cash is not automatically a governed Wheel subject (Doc 64 thin-slice outcome contract, Principal-accepted).
- Program membership comes only from an authoritative governance act, never from brokerage evidence, co-location or symbol equality (Doc 69 "Membership semantic", ratified; ADR-022).

### Relationship to Operating Program and Mandate

- **Operating Program** (for example Assignment-Centric Wheel v1, Growth Wheel) is the governed program/configuration. Doc 69 ratifies the first one. Its v2 resource is a strong candidate (`/v2/programs`, Doc 82), **not** an operative contract.
- **Mandate / purpose** (Income, Growth/Compounding) is distinct from Program (Doc 80 §6 reusable vocabulary). Where purpose lives (Account, Capital Pool, Inventory Block, Program) is an **open** discovery question (Doc 61, actor interpretation).
- How Operating Regime and Operating Program relate formally (same concept, regime as a family of programs, or regime as a property of governed scope) is **not separately ratified**. This page does not settle it.

### Earlier system-level usage

`foundations/regime-objective-function.md` (August 10, 2026) says Wheelwright "currently operates in a cash-flow production regime". That is a **system-level v1 operating stance**: one implicit regime for all deployable capital. It does not conflict with the per-scope rule above. It predates per-scope governance and stays the historical description of v1's objective function. For v2 scope questions, Doc 82 governs. That document is unchanged.

### Accepted behavior versus realization

| Claim | State |
|---|---|
| Per-scope Operating Regime meaning | **Accepted** (Principal-ratified, Doc 82) |
| Operating Regime representation in v2 resources | **Proposed only.** "Linked/applied to the explicitly governed Position/inventory scope"; waits on Position/Inventory reconciliation |
| Any implemented regime assignment for governed scopes | **None established** by the sources on this page; installed/running: **UNKNOWN** |

---

## Source-to-consequence mapping

| Source | Decision standing | Concern / version | Surviving meaning | Maintained destination | Changed interpretation | Dependent consequences | Open obligations |
|---|---|---|---|---|---|---|---|
| Doc 82 "Operating-regime scope" (Oct 7, 2026) | Principal-ratified | v2 Product/architecture | Regime applies to governed scope; Account does not establish it; multi-regime Accounts; cash-side included | [Operating Regime](#operating-regime), [Short answer](#does-an-account-determine-its-operating-regime) | None. Now directly discoverable | Steering vocabulary routes here; v2 regime representation waits | ASSIM-0002 |
| Doc 58 "Identity and economic world" (Sept 2026 draft v1.4) | Unratified Category E draft | Semantic vocabulary | "Account Regime" = accounting/execution context of an Account | [Account accounting/execution context](#account-accounting-execution-context) | Reconciled: Doc 58's Account Regime is **not** Operating Regime. Different concerns, no conflict | Readers of Doc 58 should not infer Account → Operating Regime | — |
| Doc 80 §6 (Oct 6, 2026) | Category D milestone; vocabulary "reuse unless falsified" | v2 discovery | Account vs Account Regime; governed quantity vs symbol | [Account](#account) | None | — | — |
| Doc 81 §3, §27.3 (Oct 6–7, 2026) | §3 Category D discovery; §27 Principal-ratified MVP 1 Solution Overview | v2 discovery / MVP 1 | Account→regime not 1:1; 150/100 SPY specimen; decision subject = account + underlying + governed quantity + Program context | [Short answer](#does-an-account-determine-its-operating-regime) | §3 specimen now backed by Doc 82 ratification | Governed Quantity page | ASSIM-0002 |
| Doc 57 closure; Doc 77 §2 (Sept 21; Oct 11, 2026) | Principal-ratified | Account identity, locality, access, confidentiality | Identity ≠ broker ref ≠ nickname ≠ User ≠ grants ≠ ownership | [Account](#account) | None | BUG-035 masking defect stays separate | — |
| `foundations/regime-objective-function.md` (Aug 10, 2026) | Category A (v1 system definition) | v1 system-level objective | Cash-flow production regime as v1 operating stance | [Earlier system-level usage](#earlier-system-level-usage) | Scoped as system-level v1 stance; per-scope v2 rule governs scope questions | Justified non-change: source unchanged | — |
| Options domain reference; Doc 56 (Sept 2026) | Principal-ratified mapping (BUG-022); Doc 56 implemented-observed | Fidelity balance semantics | CASH/MARGIN/INDETERMINATE balance dialect projection | [Account accounting/execution context](#account-accounting-execution-context) | None | — | — |

## Open questions (not settled here)

- Canonical identity of governed scopes: Position vs Inventory Block (`ASSIM-0002`).
- v2 representation of Operating Regime (Doc 82 open question 7).
- Formal Operating Regime ↔ Operating Program relationship (not separately ratified).
- Where purpose/Mandate lives (Doc 61 discovery).
- Account–Brokerage resource design and multi-broker admission (Doc 77 §2 "explicitly outside").
