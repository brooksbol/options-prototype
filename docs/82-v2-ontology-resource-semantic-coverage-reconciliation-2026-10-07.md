# V2 Ontology / Resource Semantic-Coverage Reconciliation

**Date:** October 7, 2026  
**Status:** Principal-ratified Product/architecture reconciliation; not implementation authority  
**Scope:** Operating-regime scope and ontology-to-v2-resource audit discipline

## Operating-regime scope — v2 reconciliation

> **An operating regime applies to the explicitly governed capital/inventory scope for which it is authoritative. Account identity or account accounting/execution context does not establish that operating regime. One account may contain separately governed quantities under different operating regimes. The canonical identity of those scopes remains subject to Position/Inventory reconciliation.**

This preserves the distinct account accounting/execution context recognized in Doc 80 while incorporating the separately governed quantity specimens in Doc 81. Operating-regime scope is not shares-only; the wording deliberately preserves cash-side governed capital.

## Semantic-coverage audit rule

> **Every Product-relevant meaning required by a supported capability must have a faithful v2 representation. Independent resource identity is earned, not automatic.**

Operator capabilities establish why independent access is useful; identity, authority, provenance, and temporal semantics establish whether the proposed resource is sound.

The ontology itself remains falsifiable. An audit can expose an incorrect ontology distinction as well as an incorrect resource representation.

Therefore absence of a root endpoint does not by itself establish a semantic gap. An embedded relationship, assertion, governed context, observation, or derived finding can be a faithful representation where independent identity is unnecessary. An ontology noun does not automatically imply a REST collection, and a descriptive URI does not repair ambiguous identity.

## Audit questions

For each Product-relevant meaning implicated by a supported capability, ask:

1. Is the meaning faithfully represented anywhere? — semantic coverage.
2. Is independent identity necessary? — resource candidacy.
3. Who establishes or changes it? — authority boundary.
4. What operator question or capability requires independent access? — capability justification.
5. Is it a definition, occurrence, relationship, assertion, observation, or derived view? — representation meaning.
6. What provenance and temporal semantics make it truthful? — evidence/authority fitness.

These questions are an audit discipline, not an endpoint-generation algorithm.

## Identity-conflation falsifiers

### Contract versus account relationship

A Contract can exist independently of any account holding it. An account's evidenced long or short quantity establishes an account-specific economic relationship to that Contract. Contract existence alone does not establish that an account owns a Right or bears an Obligation. Canonical Contract identity must not be silently conflated with an account-specific holding/obligation record.

### Construction definition versus realized construction

A definition such as **IRON_CONDOR** may merit independent inspectable identity if supported capability needs justify it. Recognition of a particular account-specific iron-condor occurrence requires established constituent Contracts, sides, quantities, and relationships. The definition does not itself establish an occurrence. Recognition of the occurrence does not imply linked execution or automatic joint disappearance of all constituents.

### Position versus governed scope

Conventional Product vocabulary may use **Position**, but that name must not silently establish one universal semantic identity spanning brokerage holding/obligation record, governed inventory, Economic Construction, Decision Subject, and lifecycle continuity. Before expanding a Position resource hierarchy, v2 discovery must state what that identity denotes and what preserves or terminates it through change.

## Non-implications

This reconciliation does not ratify a v2 resource taxonomy or candidate URI, define Contract canonical identity, resolve Position versus Inventory identity, define operating-regime policy, select schemas/persistence/HTTP methods, or authorize implementation.

## Next authorized action

> **Resume bounded v2 resource discovery by auditing capability-required meanings for semantic coverage and earned independent identity, with particular attention to Contract/account relationship, Construction definition/occurrence, and Position/governed-scope conflation.**
