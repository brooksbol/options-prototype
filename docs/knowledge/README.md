# Wheelwright Maintained Knowledge

**Category:** navigation for maintained subject owners (ADR-023 D1).
**Purpose:** answer "what does this concept mean now, on whose authority, and what is still open?" directly, without reconstructing it from numbered historical documents.

Each maintained subject page is a bounded Category A owner of **already-established** meaning for its subject. It cites the decisions that establish that meaning, keeps each assertion's original standing visible, and lists what remains unresolved. Creating a page does not ratify candidate semantics, supersede contracts, or authorize implementation. Historical sources stay where they are and remain the evidence record.

## Domain subjects

| Subject | Maintained owner | Status |
|---|---|---|
| Account | [Accounts and Operating Regimes](domain/accounts-and-operating-regimes.md#account) | Maintained (Oct 19, 2026) |
| Operating Regime | [Accounts and Operating Regimes](domain/accounts-and-operating-regimes.md#operating-regime) | Maintained; scope identity open (`ASSIM-0002`) |
| Position | [Positions and Governed Quantity](domain/positions-and-governed-quantity.md#position) | Maintained; identity open (`ASSIM-0002`) |
| Governed Quantity | [Positions and Governed Quantity](domain/positions-and-governed-quantity.md#governed-quantity) | Maintained |

Frequent question: *Does an Account determine its Operating Regime?* See the [short answer](domain/accounts-and-operating-regimes.md#does-an-account-determine-its-operating-regime).

Subjects not listed here have no maintained owner yet. Use [`../README.md`](../README.md) and the authorities it indexes.

## Open assimilation work

Learning that has been recognized but not yet carried into a maintained subject is tracked in [`../assimilation-obligations.md`](../assimilation-obligations.md). Check it for open `PENDING`/`READY` entries touching your subject before relying on a page as complete.

## Reading a subject page

- **Standing** is quoted from the source: Principal-ratified, Principal-accepted, candidate, discovery (Category D), draft, or implementation evidence.
- **Realization** uses distinct words: Proposed, Accepted, Implemented, Released, Installed, Running. Unknown installed or running state is written as UNKNOWN.
- **Version unknown** is stated rather than invented (ADR-023 D2).
