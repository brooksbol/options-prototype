# `UNRESOLVED` Predicate / Resolution Model — Architecture Reconciliation

**Date:** September 26, 2026
**Status:** Principal-ratified bounded semantic contract / accepted design; not implementation authorization
**Canonical intake:** `PL-DEC-RES-01` in `docs/parking-lot-10.md`
**Scope:** the bounded governed Recommendation slice governed by Doc 65 and ADR-019; COPX membership, URA call-away, and undefined gates are specimens, not separate architectures

**Ratification:** The Principal selected Option A on September 26, 2026. ADR-021 records the canonical architecture decision; this document carries its detailed semantic contract and adversarial basis. Ratification does not authorize application implementation.

## 1. Authority and implementation baseline

Remote accepted `main` was verified at `a4e25a30f077d96bdbdc46eda3bd231882a0f871`. Repository bootstrap was completed from `docs/README.md`, including the suspended execution-contract bridge, Principal Decision Surface, Codex bootstrap, current gate state (`STAGED`, `experiment_started: false`), project-memory/reconciliation methodology, multi-actor synchronization, and the complete parking-lot sequence.

Current authority already determines:

- Program membership and subject→scope binding are authoritative associations, never consequences of symbol equality or mechanical resemblance (ADR-016; Doc 65; Doc 66 / `PL-SETUP-01`).
- Doc 65 authorizes only the two bounded affirmative rules: `LET RESOLVE` and `SELL CALL`. Each requires every stated applicability condition. Missing applicability, intent, evidence, or encountered-but-ungoverned conditions fail closed to `UNRESOLVED`.
- `UNRESOLVED` is distinct from governed inactivity such as HOLD, WAIT, or `LET RESOLVE` (ADR-019).
- Historical Decisions pin immutable governed context, exact consumed values, evidence provenance, evaluator/rule version, and decision time; later state must not rewrite the decision boundary (ADR-019).
- A present desired disposition is not automatically historical pre-acceptance; current mechanics do not establish Wheel membership; scope establishment must not imply call-away stance or clear gates.
- Policy that has not been defined must not be represented as an operator fact question or defaulted to `CLEAR` (Doc 65; Doc 66).

Current implementation evidence:

- `GovernedEvaluation` carries Recommendation, reasons, and string `unresolvedCauses`; it has no per-predicate result.
- Both evaluators return immediately on missing association/context. They collect multiple causes only after context exists, so current `NEEDS` is not a complete dependency-respecting picture.
- Context collapses call-away into `accepted | unknown`; it cannot separately represent historical pre-acceptance, continuing effectiveness, present desire, retention preference, or supersession.
- Gates use `CLEAR | ACTIVE | UNKNOWN`; this cannot distinguish an unknown factual result under an existing policy from absence of a ratified policy.
- A Decision is emitted only when a Context Version exists. Thus an `UNRESOLVED` result caused by no association/context is projected but not durably recorded.
- Replay re-runs the pinned evaluator against the stored bundle when a bundle exists, but the bundle has no complete predicate picture to reproduce.
- The current drawer is intentionally read-only and has no decorative controls. It translates first-stop causes into presentation language.

Implementation is evidence, not authority. The current short-circuit and collapsed value shapes are limitations governed by this ratified contract; changing them remains separately gated implementation work.

## 2. Semantic definition of `UNRESOLVED`

For the bounded Doc 65 rule, `UNRESOLVED` means:

> **The evaluator cannot establish an authorized affirmative Recommendation at this decision boundary, and existing authority supplies no other deterministic governed Recommendation for the subject.**

This is deliberately not “at least one predicate is not SATISFIED.” That formulation wrongly collapses several cases:

- a known-negative applicability fact may establish that the rule does not apply rather than uncertainty;
- an applicable predicate may be unknown, unsupported, or policy-undefined;
- a downstream predicate may not have been evaluated because its prerequisite is unavailable;
- a predicate may be not applicable;
- a negative predicate may eventually produce a deterministic non-action if a ratified rule says so.

Doc 65 presently maps missing/negative required conditions to `UNRESOLVED` unless another governed rule applies. That is a bounded rule outcome, not a universal claim that every negative fact is uncertain. The predicate picture must preserve the known negative exactly.

## 3. Minimum predicate-result model

Each evaluator returns an ordered, rule-versioned list of the rule's **relevant predicates**. Each entry has a stable rule-local predicate key, operator label, semantic status, dependency references where applicable, reason, and resolution affordance metadata.

Minimum semantic status taxonomy:

| Status | Meaning |
|---|---|
| `SATISFIED` | Evaluated under its governing semantics and true. |
| `NOT_SATISFIED` | Evaluated and false: a known negative, not uncertainty. |
| `UNKNOWN` | Meaningful and evaluable, but the required fact is not known at the boundary. |
| `EVIDENCE_INSUFFICIENT` | Evidence exists or is required but cannot authoritatively support a result. |
| `AUTHORITY_MISSING` | The fact/association requires an authority-bearing assertion and none applicable is established. |
| `POLICY_UNDEFINED` | Evaluation requires governing policy/semantics that have not been ratified or versioned. |
| `NOT_EVALUATED` | Deliberately not evaluated because named prerequisite result(s) were unavailable. |
| `NOT_APPLICABLE` | An evaluated applicability condition establishes that this predicate does not govern this rule instance. |

This is the smallest taxonomy that preserves current authority. `UNKNOWN` is not an umbrella for insufficient evidence, absent authority, undefined policy, or dependency blocking. `NOT_EVALUATED` identifies the blocking predicate keys.

`POLICY_UNDEFINED` concerns the missing rule needed to interpret facts. `AUTHORITY_MISSING` concerns the missing authority-bearing fact under otherwise-defined semantics. This separation is load-bearing for truthful controls.

## 4. Dependency and completeness semantics

Dependencies remain **rule-local evaluator structure**, not a durable generic dependency graph or workflow engine.

For each evaluator version:

1. Declare the finite predicate set relevant to that rule.
2. Evaluate independent mechanical/evidence predicates even if governance predicates fail, when semantically valid.
3. Evaluate a dependent predicate only if its prerequisites make it meaningful and its inputs are available.
4. Otherwise emit `NOT_EVALUATED` with exact `blockedBy` predicate keys.
5. Emit `NOT_APPLICABLE` only after an evaluated condition proves non-applicability; absence is never non-applicability.
6. Derive the Recommendation from the rule and predicate results; UI code never reconstructs the verdict.

“Complete” means **every predicate relevant to the selected rule is accounted for**, not that every predicate was evaluated. A downstream `NOT_EVALUATED` row prevents false precision.

Example for COPX without a governed association:

- free 100-share block: `SATISFIED`;
- ownership evidence: `SATISFIED` or `EVIDENCE_INSUFFICIENT`;
- Wheel membership: `AUTHORITY_MISSING`;
- call-away stance: `NOT_EVALUATED`, blocked by membership;
- eligibility/no-write: `POLICY_UNDEFINED` only if policy absence is independently known; otherwise `NOT_EVALUATED` until applicability exists.

The evaluator must not pretend scope-relative predicates were evaluated against a scope that does not exist.

## 5. Resolution mechanism is a separate dimension

Predicate status answers **what is established now**. Resolution metadata answers **what authorized mechanism, if any, could change the input at a future decision boundary**.

Resolution metadata is rule/catalog metadata, not mutable workflow state or automatically a durable domain entity. A predicate may list more than one source. Minimum vocabulary:

`OPERATOR_GOVERNANCE | AUTHORITATIVE_EVIDENCE | DETERMINISTIC_POLICY_EVALUATION | LIFECYCLE_EVENT | PROGRAM_CONFIGURATION | PRINCIPAL_AUTHORITY | NONE_IN_SLICE`

Each advertised mechanism must identify its semantic fact kind, capability/write-contract version, evaluator consumer, availability, and explanation where defined.

The same status can have different resolution paths: unknown ownership may be resolved by Positions evidence; missing Wheel membership by operator governance. `POLICY_UNDEFINED` is resolved only by new governing authority followed by policy implementation/evaluation; it is never directly editable as a fact.

## 6. Hard operator-control admissibility invariant

Kiro may render an **enabled mutating control** only when every link is machine-identifiable:

1. **Question semantics:** exact statement/answer vocabulary, scope/quantity, effective-time meaning, and correction/supersession semantics are defined.
2. **Authority:** current authority permits that operator role to establish the fact.
3. **Durable owner:** a defined append/version contract stores it with subject/scope binding, provenance, effective time, and recorded time.
4. **Identity:** subject and any scope/configuration resolve without asking the operator to manufacture opaque identity.
5. **Consumer:** a named evaluator/policy version consumes that exact fact without authority-inventing translation.
6. **Transition:** successful persistence triggers or permits deterministic reevaluation.
7. **Replay:** the resulting Decision binds the consumed value/provenance.
8. **Failure honesty:** validation, persistence failure, conflict, or unavailable authority leaves original state intact and visibly unresolved.

This is testable as a control-manifest invariant: no enabled control without a complete semantic-fact → authority → write contract → consumer → reevaluation → replay chain.

If any link is absent, show status, explanation, and blocker but no enabled answer control. Navigation to an existing authorized capability is permissible only when the return/reevaluation path is real.

## 7. Specimen A — COPX Wheel membership

Broker evidence may establish ownership, free shares, and writable mechanics. It cannot establish Wheel membership.

“Yes, COPX is part of my Wheel program” minimally establishes an **effective subject/quantity → governed-scope Program-membership association**. It does not establish call-away stance, eligibility, no-write clearance, or intervention clearance.

For the present bounded block, current subject association may be reusable, but must not generalize to all same-symbol inventory.

- If an applicable governed scope/configuration exists, the operator may associate the bounded subject to it through Product-language selection.
- If none exists, a legitimate action must create the first immutable Context Version for a system-minted opaque scope, select an authorized Program/configuration, and append the association.

The system may mint opaque identity only as part of an authorized semantic creation transaction. Continuity is the immutable `(brokerageAccountId, governedScopeId)` lineage, never symbol equality. Multiple scopes require explicit selection or explicit creation; no account-global default.

A full `PL-SETUP-01` wizard is not required, but an association cannot point to an empty scope. Current authority does not define configuration selection or complete Product-language creation semantics. Today membership is `AUTHORITY_MISSING` with `PROGRAM_CONFIGURATION / unavailable`, and no enabled Yes/No control.

This is a dependency on `PL-SETUP-01`, not promotion of setup into the general resolution architecture.

## 8. Specimen B — URA call-away

Distinct facts are required:

- present desired disposition;
- historical pre-acceptance when the call opened;
- continuing effective/unsuperseded stance;
- retention-preferred disposition;
- unknown history;
- prospective supersession.

Doc 65 requires historical pre-acceptance and continuing effectiveness for `LET RESOLVE`. “Do you want URA called away at $43?” establishes only present desire unless the Product separately captures a legitimate historical assertion. It cannot silently establish opening-time acceptance.

Thus that question is not currently an enabled resolver. The picture may show membership established, historical pre-acceptance `AUTHORITY_MISSING` or `UNKNOWN`, continuing stance `NOT_EVALUATED` if dependent, and present desire as a distinct optional fact.

A present “No” is a known retention preference, not uncertainty. Doc 65 specifies no new affirmative Recommendation for it; the bounded result remains `UNRESOLVED` unless another ratified rule applies.

## 9. Specimen C — intervention / eligibility / no-write

Each requires:

1. a ratified policy defining which facts constitute the condition and who owns them; and
2. an evaluated subject result at the decision boundary.

Doc 65 names the concepts but does not ratify complete policies. The honest state is `POLICY_UNDEFINED`, not `UNKNOWN`, `ACTIVE`, or `CLEAR`. The raw tri-state gates are an implementation compression that cannot carry this distinction.

No operator may directly answer “CLEAR / ACTIVE.” Scope creation must not initialize gates to `CLEAR`. Later policy ratification creates a new policy/evaluator version, which may then return satisfied, not satisfied, unknown, or evidence-insufficient. Historical `POLICY_UNDEFINED` Decisions never change.

## 10. Known-negative behavior

`NOT_SATISFIED` is preserved. Recommendation consequence is rule-defined, not status-defined.

- “COPX is not part of my Wheel program” establishes negative membership. The Doc 65 Wheel rule is not applicable. The Principal ratified projection outside that Program / with no applicable Recommendation, rather than repeated solicitation as unresolved. The public Recommendation enum does not expand.
- “I do not want URA called away” establishes current retention preference. It does not erase historical pre-acceptance. If authorized as prospective supersession, continuing stance is `NOT_SATISFIED`. With no Doc 65 BTC/ROLL/HOLD response, the bounded Recommendation remains `UNRESOLVED` with a known-negative reason.

No universal `NO_ACTION` Recommendation is introduced.

## 11. Partial resolution and reevaluation

Persist only authoritative inputs: immutable Context Versions, explicit associations, authoritative evidence, later policy/configuration versions, and immutable Decisions. Predicate results/resolution metadata are derived output persisted inside a Decision for explanation/replay, not mutable truth. No resolution-session entity is required.

`authoritative append/version → resolve effective inputs at a new boundary → evaluate complete picture → append new Decision → project latest Decision`

Resolving A may expose B as unknown; resolving B may expose C as policy-undefined. Earlier Decisions remain unchanged. Failed writes create no authority and no optimistic projection.

## 12. Historical Decision and replay

Every persisted Decision, affirmative or unresolved, preserves or reproducibly recovers:

- Recommendation and complete ordered predicate picture, including `blockedBy`;
- structured reasons;
- exact consumed facts/associations/context values and provenance;
- evidence cutoff, decision time, and backend recorded time;
- pinned Context Version when one exists;
- rule/evaluator/policy versions and canonical bundle identity/hash.

Replay re-runs the pinned evaluator over pinned inputs and compares both Recommendation and predicate picture. Persisted picture is the historical output; replay verifies it. Current drawer/resolution state is irrelevant.

No-context unresolved outcomes also cross the historical truth boundary and need durable Decisions. ADR-019 permits unresolved Decisions, but current schema requires a Context Version. Implementation design must permit an explicit absence binding (nullable reference or equivalent bounded contract) without fabricating context, recording that none was known.

## 13. Minimum contract consequences

### Evaluator

- Replace free-form causes as semantic source with `predicateResults[]`; a summary may remain for compatibility.
- Define finite rule-local predicate catalogs/dependencies.
- Remove first-blocker returns; emit a dependency-respecting complete picture.
- Derive Recommendation only in the evaluator.

### Context / association

- No universal predicate store.
- Split call-away facts only as authorized by the Principal.
- Stop treating raw gates as proof of defined policy; emit `POLICY_UNDEFINED` until policy exists.
- Preserve system-managed scope identity and explicit association; add quantity only if bounded semantics require it.

### Decision persistence / replay

- Store predicate results as explicit immutable Decision output and replay-compare them.
- Permit no-context/no-association unresolved Decisions without invented governance.
- Version bundle/result schema and evaluator dispatch.
- Backend remains structural validator/durable custodian, not competing evaluator.

### API / frontend

- Projection exposes predicate key/label/status/reason/`blockedBy` and resolution availability/explanation.
- Controls derive only from a versioned admissibility manifest satisfying §6; status alone never enables a control.
- Drawer renders full relevant picture densely, with controls only where admissible and explicit blocks otherwise.
- Preserve human account name primary; demote raw `ba-*`, implementation provenance phrases, and machine rule id; promote plain rule name; no accordion maze or raw scope/config/gate editor; distinct colors and Ladder dual click behavior.

## 14. Non-goals

No generic workflow/policy/predicate/ontology engine, generalized event sourcing, universal lifecycle, full setup wizard, automatic Wheel inference, new public Recommendation vocabulary, broker execution, or implementation in this pass. `PL-SETUP-01` stays separate. No Decision history mutation.

## 15. Adversarial findings

- Predicate results are immutable evaluator output, avoiding a mini-workflow engine.
- Resolution modes are metadata, allow multiple sources, and are not durable state.
- Dependencies remain rule-local/versioned, not a generic graph.
- Completeness does not imply false evaluation: `NOT_EVALUATED + blockedBy` is first-class.
- Unknown never implies operator-editable; §6 prevents that collapse.
- Replay stays immutable; current resolution state cannot contaminate it.
- Setup remains one resolver, not universal architecture.
- Present desire cannot satisfy historical pre-acceptance.
- Undefined policy cannot be cleared by convenience.
- Merely adding cause strings is too small: it cannot represent evaluated negatives, dependency blocking, policy absence, control admissibility, or replayable completeness.

## 16. Ratified disposition

Already determined:

- Keep the bounded Recommendation vocabulary unchanged.
- `UNRESOLVED` is neither inactivity nor generic uncertainty.
- Preserve negative, missing authority, insufficient evidence, policy undefined, dependency-blocked, and not-applicable distinctions.
- Membership is explicit; mechanics and symbol equality never establish it.
- Scope creation cannot imply stance or clear undefined gates.
- Present desire does not establish historical pre-acceptance.
- No enabled control without the complete durable authority path.
- No mutable resolution session.
- Decisions/replay bind complete decision-time output/inputs, including no-context unresolved outcomes.

The Principal ratified the three consequential decisions:

1. **Known-negative Wheel membership.** An authoritative negative is outside the applicable Program / has no applicable Recommendation. It is not `UNRESOLVED`, and it does not add a public Recommendation enum value. Unknown membership, missing authority, authoritative negative membership, and Program non-applicability remain distinct.
2. **Retrospective call-away pre-acceptance attestation.** An operator may explicitly attest later that call-away was pre-accepted when the call opened. This assertion is distinct from present desire, present retention preference, contemporaneously recorded opening governance, and later supersession. It carries explicit retrospective-attestation provenance and two times: an earlier effective time and a later backend-assigned recorded time. ADR-019's knowledge-cutoff rule is mandatory: a Decision made before `recorded_at` cannot consume or replay with the later attestation, even when its effective time is earlier. Later evaluation may consume it only when both effective-time applicability and recorded-time knowledge cutoff admit it. It never masquerades as contemporaneous evidence and never rewrites an earlier Decision.
3. **Bounded operator-authorized Wheel-scope establishment.** A bounded governance act may atomically select an explicitly ratified Program/configuration, create a system-managed opaque scope identity when needed, associate the specific governed subject/quantity, and record authority-bearing provenance. The operator never invents the id. The act establishes only membership/scope authority: it does not establish call-away stance or history, clear intervention/eligibility/no-write conditions, infer continuity from symbol/account/mechanics, or authorize the full `PL-SETUP-01` wizard. One account may retain multiple scopes/Programs.

Missing intervention, eligibility, and no-write policies remain explicitly unratified Product-policy gaps. Their honest state is `POLICY_UNDEFINED`; affirmative outcomes remain blocked pending separate policy ratification.

## 17. Bounded future implementation handoff

This ratification establishes architecture authority but does not itself authorize Kiro implementation. After the ratified authority is committed, pushed, and GitHub-verified, a subsequent bounded decomposition/handoff may include:

1. add the rule-local predicate-result contract/catalogs;
2. produce complete dependency-respecting pictures;
3. bind/persist/replay-compare them, including no-context Decisions;
4. replace collapsed call-away storage only as authorized;
5. add the selected negative-membership projection;
6. implement only controls whose manifests satisfy §6;
7. leave undefined policies visibly blocked;
8. update the dense drawer without changing accepted interaction findings;
9. test every status, dependency edge, control-admissibility failure, partial transition, and replay contamination case.

Implementation remains held pending that separate bounded handoff under repository actor routing.
