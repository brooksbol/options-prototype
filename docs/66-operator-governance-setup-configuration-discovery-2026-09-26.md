# Operator-Facing Governance Setup / Configuration Discovery

**Date:** September 26, 2026
**Status:** Discovery / why-state record (Category C supporting artifact). Not ratified Product policy, architecture, or implementation authorization.
**Canonical intake identity:** `PL-SETUP-01` (see `docs/parking-lot-10.md`).
**Triggered by:** Principal browser acceptance of the bounded governed-decision P0–P3 walking slice (Doc 65 / ADR-019 / ADR-020).
**Related authority:** `docs/64-governed-by-the-book-console-thin-slice-outcome-contract-2026-09-25.md`, `docs/65-principal-ratification-bounded-production-console-wheel-rules-2026-09-26.md`, ADR-019/ADR-020 (`docs/07c-adrs.md`), `docs/architecture-roadmap.md` (AR1 governed-decision durable owner), `docs/foundations/idea-intake-reconciliation.md`.

---

## 1. Why this record exists

Principal browser use of the governed-decision slice produced two distinct kinds of feedback:

1. A small, already-settled **row-projection polish** (rename `By-the-book` → `Recommendation`; render the value as an ordinary hyperlink, not a pill/tag). That was ordinary implementation and is **not** the subject of this record.
2. A materially developed **operator-facing governance configuration** discovery — how an operator should establish and update governance without being forced to speak the system's internal architecture. That discovery has crossed the durability threshold: losing it would force meaningful rediscovery and risks reconstructing the account/governance topology incorrectly.

This document preserves the why-state for (2). It does **not** authorize implementation. Implementation decomposition remains gated behind strategic/architectural reconciliation and explicit Principal authorization.

The load-bearing distinction throughout is:

> **observable mechanics ≠ inferred/proposed meaning ≠ operator-authoritative governed meaning.**

And the governance discipline preserved from Doc 65:

> **recognition is not authority.** Wheelwright may fill what it can know and propose what it can infer, but Program/Wheel membership is an explicit authorized operator act, never inferred from position geometry.

---

## 2. What was observed (acceptance evidence)

- The removal of the standalone `Governed Recommendations` region was correct; row-level projection is the right general location; the Console should stay dense.
- Real positions correctly fail closed to `UNRESOLVED` without governance. The observed COPX share block reported `UNRESOLVED` because no explicit governed-scope association existed; the observed URA covered call likewise reported `UNRESOLVED` for the same reason.
- The Recommendation inspector is useful and correctly exposes the missing governed-scope association.
- No Program membership was inferred from mechanics — the fail-closed behavior held.
- The current `Establish governance` authoring modal is **not operator-ready**: it exposes internal architecture directly (governed scope id, Program, configuration version, call-away stance, eligibility gate, intervention gate, no-write gate) and asks the operator to select raw tri-state gates (`UNKNOWN`/`CLEAR`/`ACTIVE`) without stating what governed condition each gate attests to.

## 3. What was inferred / clarified in discussion

- **An Account is not necessarily governed by one Program.** The concrete motivating counterexample is **PTS**: the same brokerage account contains a Treasury ladder *and* an options overlay. Therefore Program must not become a global account-level selector.
- The emerging topology is approximately:

  > **Account → governed scope(s) → Operating Program/configuration → Recommendation.**

  One account may contain multiple scopes governed differently. The existing `governedScopeId` is a genuinely useful architectural identity.
- **Opaque governed-scope identity should normally be system-managed.** The operator should not have to invent an identifier like `wheel-GDXJ-2026Q3`. The operator should deal in meaningful Product concepts (illustratively: Treasury Ladder, Options Overlay, Wheel Income, Growth Overlay). **These example names are illustrative and are NOT canonized by this record.**
- The operator needs to answer not only *what* the Recommendation is (`LET RESOLVE` / `SELL CALL`) but *according to what* — the governing Program/configuration. The inspector can answer this for a specific Decision; an account-level affordance for discovering applicable Programs/scopes is an emerging (not authorized) need. If such an affordance exists it must mean **"Programs / governed scopes for this account,"** never **"Program for this entire account."**

## 4. Proposed (unratified) setup/configuration experience

An emerging setup/configuration experience around **Add Account → account settings → initial configuration → configuration updates**, potentially a wizard/modal, with two presentations over the *same* underlying governed configuration:

- **Guided mode** — question-based, Product-language setup. Wheelwright asks concrete questions and pre-fills what it can establish or reasonably propose from evidence.
- **Advanced / super-user mode** — a more direct representation of governed scopes, Program/configuration, Outcome Stance, applicable constraints/gates, provenance/effective dates, and other underlying governance state. Even advanced mode should not gratuitously require manufacturing opaque implementation identifiers.

Both modes must resolve into the **same durable governance architecture**. Do **not** build a second, parallel governance system for guided mode.

### Evidence-driven setup / fast-tracking

Setup may begin from brokerage CSVs today and (later) from an authorized broker connection. The important Product concept is acceleration, not autonomous governance:

> **ingest brokerage evidence → understand observable account structure → pre-fill established facts → propose likely scopes/programs where justified → ask the operator only for unresolved meaning-bearing facts → operator confirms/corrects → durable governance is created.**

Do **not** design around storing raw brokerage login credentials. Future broker integration should use whatever authorized connection mechanism is appropriate when that work is actually undertaken.

## 5. The critical inference boundary (preserve exactly)

The Principal explicitly rejected the idea that arbitrary option positions can establish Wheel membership. A brokerage CSV of puts, calls, shares, covered calls, and Treasury positions can establish or support **mechanical facts and economic constructions**, and may support **hypotheses** about account use. It cannot by itself establish *"This is a Wheel."*

Ten short puts and several covered calls could be an assignment-centric Wheel, unrelated premium trades, an options overlay, hedges, legacy positions, experiments, or several mixed strategies. Therefore:

- **WW fills what it can know. WW proposes what it can infer. WW asks for what requires operator authority.**
- `covered-call geometry ≠ membership in the Wheel call phase`.
- `mechanically writable 100-share lot ≠ Wheel inventory`.

A useful future setup interaction might say *"I see a Treasury-like ladder and a collection of option positions; this may represent more than one operating scope,"* then **ask** whether the option positions belong to an Assignment-Centric Wheel. It must not silently establish that fact.

## 6. Governance authoring should ask meaningful questions

Raw tri-state gates are architecture-facing. An operator cannot truthfully choose `CLEAR` unless the Product has told them what condition set is being cleared. The Product must not encourage selecting `CLEAR` merely to obtain an affirmative Recommendation.

For the bounded Doc 65 covered-call `LET RESOLVE` rule, the kinds of Product-language questions the eventual UX may need to resolve include (examples, not new policy):

- Is this position actually part of the applicable Assignment-Centric Wheel scope?
- Was call-away at this strike an accepted outcome when the call was opened?
- Does that call-away stance remain effective?
- Has a governed condition occurred that requires intervention instead of natural resolution?

If the governing rule does not define what constitutes an intervention condition, the Product must **surface that authority gap** rather than convert an undefined question into a `CLEAR` gate. Undefined policy conditions remain `UNRESOLVED`.

The authoring surface should expose only the Product questions actually relevant to the subject/rule being configured (do not indiscriminately show unrelated share-phase gates on a covered-call subject, or vice versa). The durable Context Version may still contain broader state as architecture requires; the *operator interaction* should be driven by the governance facts actually needed. **Do not silently change evaluator semantics while improving this UX.**

`UNKNOWN` remains important and must not be removed from the underlying model. The correction is not "make everything easier to mark `CLEAR`" — it is "ask concrete questions whose answers can truthfully resolve the underlying governed state." If the operator cannot answer, the result stays `UNRESOLVED`, which is correct.

## 7. Configuration updates preserve versioning

The same experience could later serve as a configuration updater:

> **Add Account → discover account → propose/define scopes → configure Programs → establish governance**, and later **Account Settings → select governed scope → update configuration → create a new immutable governed Context Version.**

Do **not** mutate historical governance in place. Do **not** compromise historical Decision replay. The operator-facing simplification must preserve immutable/versioned backend semantics (ADR-019).

## 8. Correction to the prior completion report

The previous handoff suggested Principal acceptance could proceed by authoring an *"accepted-call-away governed scope with CLEAR gates"* and observing positive `LET RESOLVE` / `SELL CALL`. **This instruction is retired.** The Principal should not manufacture `CLEAR` values merely to exercise the positive evaluator path. Before real governance is recorded, the operator-facing questions and their authority must be truthful enough that the resulting Context Version represents actual governance rather than test data masquerading as governance. Automated evaluator tests may continue to exercise positive states with explicit fixtures; production Principal acceptance must not require false attestation.

---

## 9. Discovered ideas to preserve (durable list)

- Account may contain multiple governed scopes.
- Program is not necessarily account-global.
- PTS Treasury ladder + options overlay is the concrete motivating counterexample.
- Account Add/Settings is a plausible operator entry point.
- Guided/question-based and advanced/super-user setup are alternate views over the same governed configuration.
- Brokerage evidence can pre-fill established facts.
- Brokerage evidence can propose likely structures.
- Inference cannot establish Program membership.
- Random puts/calls cannot establish Wheel membership.
- WW fills what it knows, proposes what it infers, and asks for operator-authority blanks.
- Opaque governed-scope identity should normally be system-managed.
- Operator-facing scope names should be meaningful.
- Setup confirmation creates durable governance.
- Configuration updates create successor immutable Context Versions rather than rewriting history.
- Recommendation inspection should identify the governing Program/configuration.
- Raw tri-state gates are architecture-facing and require Product-language questions before an operator can truthfully resolve them.
- Undefined policy conditions must remain unresolved rather than being guessed into `CLEAR`.

---

## 10. Explicitly NOT authorized by this record

Final scope naming; automatic scope-discovery semantics; Program compatibility rules; questionnaire schema; advanced-mode schema; inference confidence model; brokerage connection architecture; broker credential storage; Treasury Program semantics; a generalized Program/governance engine or DSL; account-global Program ownership; new intervention/eligibility/no-write policy; automated Wheel classification; the full setup wizard; the full advanced configuration editor; portfolio allocation; or any change to Doc 65 P0–P3 evaluator semantics.

This is discovery/reconciliation state. It informs later design; it does not become implementation authority.
