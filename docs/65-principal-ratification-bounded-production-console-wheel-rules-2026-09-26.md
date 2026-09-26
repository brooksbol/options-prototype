# Principal ratification — bounded production Console Wheel rules — 2026-09-26

**Status:** Principal-ratified Product policy for the bounded production Console walking slice  
**Authority:** Principal decision, 2026-09-26  
**Scope:** Existing covered-call obligations in the Ladder and eligible unencumbered Wheel inventory in the Unencumbered Shares table  
**Supersedes:** No broader Wheel policy. This artifact narrows and ratifies only the two rules stated below.

## Purpose

The production Console must be able to project truthful, governed, by-the-book Wheel recommendations against the real portfolio. This ratification supplies the minimum positive Product semantics needed for the first walking slice without silently completing the broader Wheel rulebook.

The Console is a projection surface, not the authority. The rules below must be applied only when their governed applicability and required evidence are established. Otherwise the result is `UNRESOLVED`.

## Rule 1 — existing governed covered call: `LET RESOLVE`

### Applicability

This rule applies only when all of the following are established:

- the Decision Subject is an existing short call;
- the call is authoritatively covered by the relevant owned shares;
- the subject is already inside the call phase of the applicable assignment-centric Wheel program;
- call-away at the existing strike was a pre-accepted disposition when the call was opened;
- that call-away stance remains effective and has not been superseded;
- no governed intervention condition is active;
- the obligation, coverage, lifecycle state, and required evidence are sufficiently authoritative and unambiguous.

### Ratified rule

> For an existing covered call already governed by the assignment-centric Wheel, where call-away was pre-accepted and remains the effective disposition and no governed intervention condition is active, the by-the-book action is **`LET RESOLVE`**. Missing applicability, intent, evidence, or an encountered but not yet governed intervention condition produces **`UNRESOLVED`**.

Equivalent bounded decision form:

```text
IF
    covered_call_is_current
AND wheel_call_phase_is_established
AND call_away_was_preaccepted
AND call_away_stance_remains_effective
AND no_governed_intervention_trigger_is_active
AND evidence_is_sufficient
THEN
    LET_RESOLVE
ELSE
    UNRESOLVED
```

### Meaning

`LET RESOLVE` is affirmative natural-resolution behavior. It is not an alias for generic `HOLD`.

The recommendation does not predict expiration, assignment, or future price behavior. It says that the governed program prescribes no intervention now because the current lifecycle is proceeding toward a pre-accepted disposition and no separately governed reason to intervene is active.

### Explicit non-authority

This rule does **not** ratify rules for:

- BTC at a profit threshold;
- 21-DTE management;
- rolling;
- dividend management;
- thesis-break response;
- event response;
- generic CLOSE;
- other intervention mechanics.

If such a condition becomes load-bearing and no ratified rule governs the response, the bounded evaluator returns `UNRESOLVED`; it must not improvise.

## Rule 2 — eligible unencumbered Wheel shares: `SELL CALL`

### Applicability

This rule applies only when all of the following are established:

- the Decision Subject contains at least one authoritatively established unencumbered 100-share block;
- those shares are attributable to an active assignment-centric Wheel cycle rather than merely being mechanically writable inventory;
- the underlying remains eligible to continue that Wheel cycle under the effective governed stock-state rules;
- call-away remains an accepted disposition of the Wheel inventory;
- no governed no-write or exception condition is active;
- evidence required to establish the phase decision is sufficiently authoritative.

### Ratified rule

> For an authoritatively unencumbered 100-share block belonging to an active assignment-centric Wheel cycle, where the underlying remains eligible and call-away remains accepted, the by-the-book next phase is **`SELL CALL`**. This phase Recommendation does not itself select a contract. Missing applicability, eligibility, disposition authority, or other required governance produces **`UNRESOLVED`**.

Equivalent bounded phase decision:

```text
IF
    free_shares >= 100
AND shares_belong_to_active_wheel_cycle
AND stock_remains_program_eligible
AND call_away_is_accepted
AND no_governed_no_write_condition_is_active
AND evidence_is_sufficient
THEN
    SELL_CALL
ELSE
    UNRESOLVED
```

### `SELL CALL` versus `WHICH CALL?`

This distinction is part of the ratification.

`SELL CALL` means:

> the governed Wheel says this inventory should enter the call-writing phase.

It does **not** mean:

> sell this particular option contract.

Exact contract selection is a separate capability. Strike method, tenor, premium threshold, delta, below-basis policy, liquidity, dividend/event handling, and similar candidate-selection mechanics are not silently ratified by this artifact.

Accordingly, the Product may truthfully represent a state equivalent to:

```text
Program action: SELL CALL
Contract selection: UNRESOLVED / no current admissible candidate
```

without changing the Wheel phase recommendation solely because a current chain does not yield a selectable contract.

## Contrastive Product invariants

The first production implementation must preserve these distinctions:

| Situation | Expected bounded result |
| --- | --- |
| Governed covered call; call-away pre-accepted and still effective; no governed intervention condition active | `LET RESOLVE` |
| Mechanically identical call; required call-away stance cannot be established | `UNRESOLVED` |
| Same governed call; a decision-relevant intervention condition becomes active but its response is not governed by this bounded policy | `UNRESOLVED` |
| Eligible unencumbered 100-share block in active assignment-centric Wheel cycle; call-away accepted | `SELL CALL` |
| Mechanically identical free shares that are not attributable to the applicable Wheel cycle | not `SELL CALL`; `UNRESOLVED` unless another governed rule applies |
| Same Wheel shares but accepted call-away cannot be established | `UNRESOLVED` |
| Wheel shares satisfy the phase rule but exact contract selection is not currently resolved | `SELL CALL` remains the phase result; contract selection remains separately unresolved |

Mechanical similarity must not erase governed differences.

## Production Console boundary

These rules are ratified specifically for the real-portfolio production Console walking slice:

- existing obligations are projected in the Ladder;
- unencumbered share inventory is projected in the Unencumbered Shares table;
- the operator can inspect the governing basis;
- insufficient governance/evidence fails closed as `UNRESOLVED`;
- historical Decisions remain distinct from later lifecycle state;
- expiration or assignment may create/remove later Decision Subjects but must not rewrite the historical Recommendation.

The durable Decision/replay architecture remains governed by ADR-019 and other applicable accepted authority.

## What this ratification does not ratify

This artifact does not ratify:

- the whole Principal technical Wheel specimen in Doc 61 §29;
- a universal or canonical Wheel rulebook;
- a generic Program engine or policy DSL;
- exact call-contract selection;
- CSP entry or management;
- BTC, CLOSE, or rolling policy beyond the bounded rules above;
- a universal Recommendation vocabulary;
- generic capital allocation;
- Portfolio Mandate scoring;
- Operator Disposition or FOLLOW/DEFER/DEPART;
- adherence scoring;
- paper trading;
- sandbox or live broker execution;
- autonomous order submission;
- a universal lifecycle/event architecture;
- multi-strategy generalization.

## Implementation constraint

The ratified Product meaning is authoritative; its implementation representation is not prescribed here.

Engineering may choose bounded DTOs, enums/tagged unions, persistence schema, evaluator organization, UI components, and other ordinary implementation structures provided they preserve these semantics and applicable repository architecture.

Program/configuration labels must not operate as unexplained magic switches. Explicit governed applicability and mechanics must causally support the Recommendation.

Discovery-only semantics outside these two rules remain discovery-only and must fail closed when they become load-bearing.
