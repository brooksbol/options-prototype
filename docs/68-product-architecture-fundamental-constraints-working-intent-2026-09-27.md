# Product–Architecture Fundamental Constraints — Working Intent

> **Status:** Working discovery / why-state checkpoint — not a ratification artifact.
> **Purpose:** Preserve the Principal's intent for a staged body of Product/Architecture reasoning that will be developed alongside Wheelwright.
> **Authority boundary:** This document does **not** promote any candidate statement into the canonical Principles Register, create new architectural authority, alter the operating model, or authorize implementation. Promotion remains subject to the repository's existing governance and explicit Principal ratification where required.
> **Method:** Build this incrementally as Wheelwright is built. Preserve existing documents and reference them rather than reorganizing or rewriting the repository merely to fit this vocabulary.

## 1. Why this exists

Wheelwright needs durable reasoning artifacts that preserve not only *what* was decided, but *why* fundamental constraints exist and how those constraints should influence later Product, architecture, and technical-design work.

The primary consumers include the Principal, Codex, Kiro, and future actors reviewing or attacking proposals months after the original reasoning occurred.

The desired behavioral chain is:

**WHY → WHAT MUST BE TRUE → HOW A SOLUTION SATISFIES IT → HOW TO ATTACK / FALSIFY IT**

A durable constraint is incomplete if a future actor can understand why it exists but cannot use it to reject a bad Product, architecture, or technical design. Conversely, a constraint is brittle if an actor can enforce it but cannot recover why Wheelwright cares about it.

These artifacts therefore exist as design-time and review-time sounding boards, not merely explanatory documentation.

## 2. Product Principles as a counterpart, not a replacement

Use **Product Principles** as a disambiguating term for enduring business/product-facing principles.

Product Principles are counterparts to Architectural Principles:

- **Product Principles** preserve enduring truths about what Wheelwright must be for its operator and purpose.
- **Architectural Principles** preserve enduring truths about what Wheelwright must be as a system.
- Neither substitutes for the other.
- Some fundamental constraints intentionally have both Product and architectural force.

This is not a proposal to reorganize all existing documentation, rewrite the operating model, or move existing foundations. A thin principle/constraint index may reference existing canonical documents as provenance. Existing useful documents should remain useful where they are.

The current canonical docs/principles.md inclusion rule remains in force: principle-like discoveries are not automatically ratified principles.

## 3. What "Product" means here

"Product" is broader than UX.

It includes, where relevant:

- business/product value and LVT concerns;
- operator relationship, authority, agency, and cognitive burden;
- user journeys and lifecycle continuity;
- UX and interaction behavior;
- practitioner-facing language;
- decision experience and explainability;
- expected outcomes;
- high-level Product acceptance;
- externally meaningful behavioral commitments;
- trust and legibility;
- Product boundaries and non-goals;
- Product optionality and evolution across future interfaces/capabilities.

A Product Principle should generally survive a technology or interface rewrite. Individual UI treatments usually should not.

## 4. Fundamental constraints are not philosophical escape hatches

High-level principles preserve the durable **why**, but their useful consequences should be expressed, when appropriate, as statements that are not left to philosophical interpretation.

Useful forms include invariants, policies, guardrails, cardinality rules, authority rules, temporal rules, identity/lineage rules, lifecycle rules, Product acceptance expectations, and attack/falsification tests.

These should be strong enough for Product review, architecture review, technical-design review, implementation review, and adversarial attack to produce a meaningful PASS/FAIL or explicit unresolved result.

A useful pattern is:

1. **Why** — the durable Product/business/architectural reason.
2. **What must be true** — the non-negotiable constraint.
3. **Design implications** — constraints on acceptable solution shape without unnecessarily prescribing implementation.
4. **Attack / verification** — observable evidence capable of falsifying the proposed solution.

Not every entry needs every field or a memorable test name. Do not manufacture taxonomy or slogans where they do not add value.

## 5. Applicability horizon

Discovery scope is not necessarily applicability scope.

A constraint discovered while building one LVT may express a Wheelwright-wide truth. Fundamental constraints are expected often to cross LVT boundaries; genuinely LVT-specific constraints remain valid but should not be assumed to own a fundamental truth merely because that is where it was discovered.

When reconciling a candidate constraint, consider its applicability horizon explicitly: Wheelwright-wide, Product/Architecture-wide, capability/Solution Overview, Operating Program, account/regime, or LVT-specific.

A useful attack question is:

> If the current LVT disappeared tomorrow, would Wheelwright still need this statement to remain true?

Promotion to a broader horizon must remain deliberate rather than automatic.

## 6. Solution Overview and Solution Design — useful reasoning concepts

Kotusev's terminology is useful as a guide, not as a mandate to restructure Wheelwright's operating model.

A **Solution Overview** is a reconciled Product/business/architecture artifact for a consequential capability or problem. It preserves the integrated *why and what*: intended operator outcome, journey, relevant Product constraints, architecture constraints, important tradeoffs, and high-level acceptance.

A **Solution Design** is a more technically focused implementation proposal for realizing a Solution Overview. It addresses the technical *how*: identities, persistence, APIs, transactions, evaluator integration, migrations, frontend/backend responsibilities, and similar realization concerns.

These artifacts should be introduced where their durable reasoning value justifies them. Existing ADRs, foundations, checkpoints, and other artifacts remain valid; not every feature requires new documents.

## 7. Working specimens — not yet promoted by this document

The following examples preserve the Principal's intended kind of constraint. Their presence here does not independently ratify them into the canonical Principles Register.

### 7.1 Operator authority

Candidate Product principle:

> **The operator is the ultimate operational authority because the operator makes the trades.**

Potential concrete consequences include:

- recognition is not authority;
- operator intent must not be manufactured from brokerage evidence, geometry, or convenience;
- an authority-bearing state transition must be attributable to a legitimate operator act or an already-authorized deterministic rule;
- recommendations and execution remain semantically distinct.

The purpose is not to force repetitive confirmation. Wheelwright should use legitimate evidence and existing authority to minimize the amount of new authority the operator must supply.

### 7.2 Operator-domain language

Candidate cross-cutting guardrail:

> **Operating Wheelwright must not require the operator to understand Wheelwright's internal ontology.**

Terms such as governed scope, subject association, predicate status, and internal identifiers may be excellent architecture while still being inappropriate operator vocabulary.

Attack idea:

> Can a practitioner who understands options/Wheel trading but not Wheelwright's internal architecture complete the journey correctly? If internal ontology knowledge is required, the Product has failed the guardrail.

### 7.3 Minimum necessary operator authority

Candidate Product behavior:

> **Wheelwright should ask the operator for the smallest piece of information or authority it cannot legitimately derive, after using everything it can legitimately derive to narrow the question.**

Related working distinctions:

- recognition may narrow or suggest;
- recognition does not itself create authority;
- deterministic transitions already authorized by a Program need not be re-authorized merely because the lifecycle advanced;
- Product-policy gaps should not be converted into questions for the operator.

### 7.4 Operating Program cardinality

Candidate domain invariant:

> **At an effective point in time, a governed position/instrument is associated with exactly zero or one governing Operating Program, never more than one.**

This is intended as a fundamental domain constraint, not merely a persistence preference. Product journeys, architecture, data representation, APIs, and lifecycle transitions must not permit contradictory simultaneous effective governance.

Attack idea:

> Attempt to establish a second simultaneously effective Operating Program association for the same governed subject. If Wheelwright can reach that state, the design fails the invariant.

The exact subject/identity semantics remain to be reconciled; this checkpoint does not settle the current tax-lot/inventory-block question.

### 7.5 Delivery-surface independence

Candidate cross-cutting Product/Architecture principle:

> **Wheelwright is not a web application, though it may have a web interface.**

A stronger consequence:

> **Wheelwright's core business capabilities, authoritative business semantics, and durable business state belong to Wheelwright, not to a particular presentation surface.**

Product force:

- preserve Product optionality;
- do not make today's desktop web interface define what Wheelwright is;
- leave open responsive/mobile web, native mobile, desktop, agent-mediated, and other legitimate future interfaces without redefining Product semantics.

Architectural force:

- preserve extensibility;
- avoid presentation-owned authoritative state;
- avoid making the current frontend the only implementation of core business semantics;
- force designs to consider an interface-independent business capability and durable data boundary.

This does **not** prohibit browser-local caches, projections, presentation logic, or other legitimate client behavior. It constrains what may become authoritative or semantically essential.

#### Incognito Test

> **After an operator establishes durable Product state or authority, the relevant Product behavior must survive opening Wheelwright in a fresh browser context with no prior browser-local state.**

The test intentionally does not say "do not use browser storage." It states an observable required outcome and leaves implementation freedom inside the boundary.

For historical Decisions, fresh-browser current behavior must not imply hindsight rewriting: a pre-change Decision must still replay from what Wheelwright knew at that earlier boundary.

#### Interface Substitution attack

> At the Product-semantic level, could another legitimate interface present/operate the capability without changing what the capability means?

This does not require every interface to exist today.

#### Headless attack

> Where appropriate, can the underlying business capability and authoritative result be exercised without executing the current presentation surface?

This is an attack against accidental semantic coupling, not a blanket requirement that every UI interaction expose a public API.

## 8. Cross-cutting force is intentional

Do not force every fundamental constraint into an exclusively Product or exclusively Architectural bucket.

Some of the most valuable constraints are reconciliation constraints with both kinds of force.

Delivery-surface independence is the model specimen:

- Product-wise, it preserves optionality and avoids painting the Product into today's interface.
- Architecturally, it preserves extensibility and prevents core business semantics or durable state from becoming presentation-bound.

The duality is useful. It creates a shared litmus test for Product, architecture, and technical design.

## 9. Staged development

Build this body of reasoning **as Wheelwright is built**.

Do not attempt a one-time exhaustive principles exercise.

At consequential boundaries:

1. notice a potentially fundamental truth;
2. preserve its why-state;
3. determine whether it is already established by existing authority;
4. distinguish principle, invariant, policy, guardrail, acceptance/litmus test, or local design choice as useful;
5. determine applicability horizon;
6. reconcile Product and architectural consequences;
7. use it to attack Solution Overviews, architecture, Solution Designs, and implementation;
8. promote or ratify only through the existing authority process.

Prefer referencing existing foundations and decisions over duplicating their reasoning.

The goal is a progressively stronger, coherent body of **why + must-be-true + attackable consequences**, not a documentation reorganization.

## 10. Relationship to current work

The current multi-Wheel governance-entry work is a productive discovery surface for these ideas, but it does not own them.

Examples currently under active reconciliation include recognition versus authority, zero-or-one Operating Program membership, operator-domain language, minimum necessary operator interaction, durable authority independent of browser state, Product-policy gaps versus operator-resolvable ambiguity, lifecycle continuity, identity/lineage semantics including future cost-basis/closed-Wheel-loop needs, and multiple Wheel flavors without transferring internal ontology burden to the operator.

These should inform the eventual Solution Overview before technical representation is frozen.

## Checkpoint summary

The intent is to give future actors durable, actionable constraints that connect:

**WHY → WHAT → HOW → ATTACK**

They should help Codex and Kiro reject bad Product, architecture, and technical designs while preserving implementation freedom inside the legitimate boundary.

This checkpoint deliberately preserves the model without prematurely ratifying the candidate principles/invariants or reorganizing Wheelwright's existing authority.
