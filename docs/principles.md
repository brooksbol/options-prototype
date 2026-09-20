# Wheelwright Principles Register

> **Status:** Canonical Project / Operational State (Category C) — the first-class register of Wheelwright's **ratified enduring principles**.
> **Authority:** This file is the single source of truth for *which* principles Wheelwright considers ratified and enduring. It does not restate the full reasoning of the originating documents; it names each principle, preserves its family, and points to its canonical source.
> **Method:** Populated **only** with principles already explicitly established by current Wheelwright authority. Provenance is preserved back to the originating canonical document.

## Semantic contract

> **If an item appears in this register, Wheelwright considers it a ratified enduring principle.**

A principle is an enduring constraint on *how* Wheelwright is built and operated — distinct from a Bet (what we pursue), an AR (architectural pressure), an ADR (a decision made), or a PL item (unresolved work).

## Inclusion rule (governance)

1. Only principles **explicitly established as principles** by ratified/governing authority are listed here.
2. Something that is currently only implicit, operated-by, encoded in an ADR, a reconciliation convention, or suggested by recent work is **not** a principle merely because it sounds principle-like. It stays out of this register until the Principal explicitly ratifies it as a principle. Promotion is a separate, explicit Principal decision.
3. Each entry preserves its **family** and a **provenance** reference to the originating canonical document.

## Families

- **Architectural / build** — enduring constraints on how the system is structured and built.
- **Epistemic** — enduring constraints on how the system treats knowledge, evidence, and uncertainty.
- **Operating / product-domain** — enduring commitments about how the operator manages capital under uncertainty. *(Present in authority as a first-class governing model, but the specific operating principles are currently framed as **candidate hypotheses**, not ratified; see the note at the end. They are therefore intentionally NOT listed as ratified principles here.)*

---

## Ratified principles

### Architectural / build

Source: `docs/foundations/retooling-charter.md` § "Durable Principles" (Category B — Ratified). "These govern the system regardless of implementation language."

- **`PRIN-POLICY-OVER-PREDICTION` — Policy over prediction.** The system applies explicit, auditable policy to observed evidence rather than predicting outcomes; govern behavior through policy on current evidence, not forecasts of market direction. **Provenance:** `docs/foundations/retooling-charter.md` (Durable Principle #1) and `docs/foundations/policy-over-prediction.md` (Governing principle). *(One principle, two authoritative expressions — architectural and epistemic. Consolidated to a single record so the register reports distinct principles, not duplicate provenance.)*
- **`PRIN-ARCH-EVIDENCE-APPLIANCE` — Evidence appliance.** The backend maintains evidence continuously and independently of any connected client. The browser is a viewport, not the lifecycle owner.
- **`PRIN-ARCH-PERSIST-FACTS-DERIVE-TRUST` — Persist facts; derive trust.** The database stores observations with provenance. Freshness, staleness, and validity are computed at query time from facts and session context.
- **`PRIN-ARCH-FAILED-REFRESH-PRESERVES` — Failed refresh preserves successful evidence.** A failed acquisition attempt never overwrites the last successful payload.
- **`PRIN-ARCH-SESSION-AWARENESS` — Session awareness is correctness.** Market-session semantics determine when evidence can change, when acquisition is useful, and when evidence is sealed. Acquiring during closed sessions is a modeling failure.
- **`PRIN-ARCH-DETERMINISTIC-RECOMMENDATION` — Deterministic recommendation generation.** Same evidence + same policy = same recommendations. No hidden state, no randomness.
- **`PRIN-ARCH-SINGLE-ACQUISITION-AUTHORITY` — Single acquisition authority.** One process maintains one authoritative evidence model. No split-brain.
- **`PRIN-ARCH-VERSION-CONTROLLED-DEFINITION` — Product definition is version-controlled.** Structural knowledge, governance, descriptions, and other golden product definitions are maintained in Git. Runtime persistence is derived from these artifacts and never becomes their authority.

### Epistemic

- **`PRIN-EPI-PRECISION` — Epistemic precision (explicit uncertainty over false precision).** Numerical/output precision must be commensurate with evidence quality; the system must not present outputs with more precision than the underlying evidence and computation deserve. Rounding, qualification, and range representation are honest communication of epistemic state, not compromises. Source: `docs/foundations/epistemic-precision.md` (Governing principle).

---

## Not (yet) in this register — explicitly excluded

The following are excluded on purpose, to keep the semantic contract honest:

- **Operating / product-domain principles** (Preserve Optionality, Respect Uncertainty, Execute with Discipline, Earn Proportional Compensation, Avoid Concentration, Observe Before Acting, Sustain Institutional Behavior). The governing *model* that principles are first-class is ratified (`docs/foundations/principles-governance-model.md`, Category A), but that document frames these seven as **"Candidate Operating Principles… initial hypotheses."** They are strong candidates and may be ratified later; until the Principal explicitly ratifies them as principles, they are not listed here as ratified.
- **Implicit / operating-practice / decision-encoded concepts** — for example: no runtime GitHub dependency (currently ADR-018, a decision); don't manufacture relationships not established by authority; dumb runtime / intelligence in reconciliation. These are operated-by or encoded in decisions and reconciliation records, not ratified as principles. They may be good candidates for later consideration; promoting any of them into this register is a separate, explicit Principal decision.

---

## Register metadata

```
Classification:  Canonical Principles register (Category C)
Lifecycle:       Living — a principle is added only by explicit Principal ratification, with provenance
Grounded in:     docs/foundations/retooling-charter.md, docs/foundations/policy-over-prediction.md,
                 docs/foundations/epistemic-precision.md, docs/foundations/principles-governance-model.md
Projection:      docs/… → build-time roadmap projection → read-only Roadmap "Principles" lens (ADR-018 boundary)
```
