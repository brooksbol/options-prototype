# Assignment-Centric Wheel v1 — Operating Program / Configuration

**Date:** September 27, 2026

**Status:** Principal-ratified Product authority / accepted bounded Program definition (Category B)

**Stable Program identity:** `assignment-centric-wheel`

**Configuration version:** `1` (operator-facing: **v1**)

**Canonical intake relationship:** bounded child of `PL-SETUP-01`; uses the ADR-021 bounded scope-establishment authority

**Related authority:** Doc 65; ADR-016, ADR-017, ADR-019, ADR-020, ADR-021; Doc 67

## Product definition

> **Assignment-Centric Wheel v1 is a governed Wheel Operating Program whose intended lifecycle may acquire Wheel inventory through assignment of a governed short put and may dispose of governed Wheel inventory through covered-call assignment. Assignment is an intended lifecycle mechanism rather than an exception to be avoided.**

`Assignment-Centric Wheel` is the Operating Program: the durable Product meaning across lifecycle phases. `v1` is its first ratified configuration/version. “Operating Program/configuration” is therefore deliberately both terms, not an unresolved taxonomy: Program names the governed process; configuration version identifies the versioned Product authority used at a Decision boundary.

This definition establishes conceptual lifecycle meaning, not a complete Wheel rulebook. The Program may legitimately exist while one or more decision boundaries lack deterministic governed policy. At such a boundary, the missing rule remains explicit as `POLICY_UNDEFINED` and the applicable Decision may remain `UNRESOLVED`. Missing policy does not cause the Program or an otherwise-authoritative membership association to cease to exist.

The put-assignment acquisition clause is a lifecycle boundary only. It does **not** ratify a CSP recommendation, put-entry rule, strike or expiration selection, assignment target, or evaluator coverage. Current deterministic Recommendation authority remains bounded to the rules below.

## Membership semantic

> **Attaching an explicitly bounded governed subject/quantity to Assignment-Centric Wheel v1 establishes only that the subject/quantity participates in that Operating Program/configuration from the association's governed effective boundary.**

Membership is an authoritative association, not a conclusion from economic construction, brokerage evidence, account co-location, symbol equality, writable geometry, or a strategy-like label. The exact subject/quantity identity, partial-association semantics, correction/supersession contract, and persistence transaction belong to the later `ATTACH TO…` Solution Overview and Solution Design; this ratification does not settle them.

Membership does **not** by itself establish:

- present desire to be called away, historical call-away pre-acceptance, retrospective attestation, continuing stance, or supersession state;
- eligibility, no-write clearance, intervention clearance, or any other policy result;
- evidence, ownership, coverage, encumbrance, lifecycle, construction, execution, or historical fact;
- strike, expiration, contract, premium, delta, DTE, earnings, dividend, BTC, CLOSE, or rolling policy;
- Program membership before the association's effective boundary or knowledge of it before its recorded boundary;
- lifecycle continuity not already authorized by deterministic Program rules;
- membership of other same-symbol inventory, future inventory, other account inventory, or the whole account;
- tax-lot identity, economic lineage, brokerage construction identity, Wheel-cycle identity, or any other association not separately governed.

A later membership act must not rewrite an earlier Decision. ADR-019/ADR-021 decision-time inputs, recorded-time knowledge cutoff, replay, and historical predicate picture remain authoritative.

## Currently governed Program rules

Doc 65 supplies the only currently ratified affirmative Recommendation rules associated with this Program/configuration:

1. **Existing governed covered call — `LET RESOLVE`.** When every Doc 65 Rule 1 applicability condition is established—including authoritative coverage, call-phase membership, historical pre-accepted and still-effective call-away stance, no active governed intervention condition, and sufficient authoritative evidence—the Recommendation is `LET RESOLVE`. Missing or ungoverned required conditions produce `UNRESOLVED`.
2. **Eligible unencumbered Wheel shares — `SELL CALL`.** When every Doc 65 Rule 2 applicability condition is established—including an authoritative free 100-share block in an active assignment-centric Wheel cycle, governed eligibility, accepted call-away disposition, no active governed no-write/exception condition, and sufficient evidence—the phase Recommendation is `SELL CALL`. It does not select a contract. Missing or ungoverned required conditions produce `UNRESOLVED`.

These rules make the Program more than a label, but they do not complete it. Doc 65 remains the rule authority; this artifact does not broaden its applicability or vocabulary.

## Known policy and design gaps

- Intervention policy for the existing-covered-call rule is not ratified.
- Eligibility and no-write/exception policies for the share-phase rule are not ratified.
- Put-entry/CSP Recommendation and contract-selection policy are not ratified.
- Call contract selection—including strike, DTE, delta, premium, liquidity, dividend, earnings, and below-basis treatment—is not ratified.
- BTC, CLOSE, rolling, event response, and generic lifecycle-management policy are not ratified.
- Exact governed-subject and quantity semantics—including 100 versus 200 shares, partial membership, inventory-block identity, same-symbol continuity, tax-lot backing, and future-inventory treatment—remain unresolved for the membership write path.

These gaps remain visible and fail closed where load-bearing. They do not authorize an operator to answer raw internal gates or an implementation to default them to `CLEAR`.

## Adversarial acceptance

| Attack | Result | Governing reason |
| --- | --- | --- |
| Writable but not Wheel | **PASS** | Free/writable shares without authoritative membership are not Wheel inventory. |
| Attached but stance unknown | **PASS** | Membership is established; stance is not, so the Decision may remain `UNRESOLVED`. |
| Attached but policy undefined | **PASS** | Program and membership remain real; missing eligibility/no-write/intervention policy remains `POLICY_UNDEFINED`. |
| Same symbol, different inventory | **PASS** | Membership is bounded and does not propagate by symbol equality or to future inventory. |
| Historical replay | **PASS** | Later attachment cannot alter the recorded inputs or predicate picture of an earlier Decision. |
| Fresh client | **PASS** | Program meaning and future membership authority belong to Wheelwright's durable boundary, never browser-local state. This is a constraint on the later design, not an implemented claim. |
| Construction confusion | **PASS** | Covered-call, collar, short-put, or other construction evidence does not establish Program membership. |
| Incomplete Program policy | **PASS** | Missing strike-selection, rolling, or other policy leaves the relevant boundary unresolved; it does not erase Program identity. |

## Next Product boundary

This ratification supplies the first legitimate concrete destination for the next **`ATTACH TO…` Product/Solution Overview**. That next artifact must define the operator journey and acceptance boundary for choosing Assignment-Centric Wheel v1 while preserving the membership semantic, exact subject/quantity uncertainty, durable authority, deterministic reevaluation, fresh-client recovery, and historical replay honesty above.

This artifact does **not** authorize or implement `ATTACH TO…`, a membership command/write path, evaluator changes, Console changes, a generic Program registry/framework, or any missing Wheel policy.

## September 28, 2026 bounded continuation

ADR-022 records the Principal's later ratification of **whole-quantity, opening-anchored existing short-option cohort** identity and conditional History-based economic continuity. This partially resolves the exact subject/quantity question left open above; partial attachment, residual membership after a reduction, share-block identity, a specific accepted History artifact, and the technical evidence-admission design remain open. The implemented series-derived `ATTACH TO…` covered-call key does not conform to ADR-022 merely by persisting a membership association. Doc 70 preserves the evidence and rejected-design trail. The September 27 boundaries above remain historical statements of what this artifact itself ratified at the time.

## Product Principles check

The canonical Principles Register currently contains no ratified Product Principles, so none independently constrain this ratification. Doc 68's operator-authority, minimum-necessary-authority, Operating Program cardinality, delivery-surface-independence, and Incognito Test candidates are relevant attack surfaces but remain unratified. This work promotes none of them and discovers no additional principle candidate requiring separate intake.
