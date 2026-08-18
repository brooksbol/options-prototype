# Epistemic Precision

## Date: August 2026
## Status: Governing principle

---

## Core Claim

Output precision is itself an epistemic claim. A system that displays $5,437.26 when its evidence supports only "approximately $5,000" is making a false assertion about the quality of its knowledge.

**Numerical precision must be commensurate with evidence quality.**

---

## The Principle

Wheelwright must not present outputs with more precision than the underlying evidence and computation deserve. This applies to:

- Production forecasts and estimates
- Portfolio valuations derived from point-in-time snapshots
- Any derived quantity that aggregates uncertain inputs

When the inputs are approximate, the output must communicate its approximate nature. Rounding, qualification, and range representation are not compromises — they are honest communication of epistemic state.

---

## Manifestations

### Accuracy over Precision

A useful answer rounded to approximately the nearest $1,000 may be entirely adequate for planning purposes. A defensible $5K forecast is preferable to a fragile $5,437.26 forecast whose apparent precision exceeds the evidence.

### False Precision as Architectural Defect

Displaying penny-accurate results from inputs that are:
- point-in-time snapshots (stale within hours)
- directional assessments (coarse, not calibrated)
- aggregations across independently uncertain positions

is not a neutral formatting choice. It communicates unwarranted certainty and may mislead the operator into treating estimates as facts.

### Appropriate Precision Scales

The right precision depends on the evidence and the decision being served:

- **Reconciled historical production** — penny accuracy is appropriate (the evidence is complete, authoritative, and auditable)
- **Current-month production so far** — dollar accuracy (evidence is factual but may have reconciliation gaps)
- **Operating forecast** — coarse precision appropriate to directional planning; current Bridge Income use may justify rounding to approximately the nearest $1,000
- **Portfolio operating value** — depends on evidence freshness; import-time snapshots do not justify intraday precision

---

## Relationship to Other Principles

**Policy over Prediction** — False precision is a form of implied prediction. Displaying $5,437 implies the system knows the outcome to that resolution. If it doesn't, the display is an unauditable claim.

**Epistemic Integrity (ADR-013)** — The fact-to-interpretation boundary requires that observations not be presented as judgments. Similarly, estimates must not be presented as facts.

**Secondary Observation** — Mechanism quality affects how much confidence to place in outputs. Epistemic Precision is the output-side complement: don't display more confidence than the mechanism deserves.

---

## Domain Independence

This principle survives the removal of all domain nouns.

Any system that derives outputs from uncertain inputs faces the same question: how much precision should the output claim? The answer is always: no more precision than the evidence chain as a whole can reasonably support.

This applies to weather forecasts (temperature to nearest degree, not nearest hundredth), financial projections (to nearest thousand, not nearest cent), and engineering estimates (with explicit tolerance bands).
