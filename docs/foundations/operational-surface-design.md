# Operational Surface Design Principles

## Purpose

This document captures the UX and information-hierarchy principles governing Wheelwright's operational surfaces. These principles emerged from Production and Deployment surface development and apply across all operator-facing views.

These are architectural principles, not CSS specifications. They describe how operational surfaces should behave regardless of the specific layout mechanism used.

---

## Impatient Mode versus Reflective Mode

Operational surfaces serve two distinct operator modes:

### Impatient mode (above the fold)

The operator needs the answer immediately. They are making a decision or checking status.

- Answer the immediate operational question first
- Consequence first, decomposition second
- Minimal cognitive load — no arithmetic required by the operator
- Key numbers visible without scrolling

### Reflective mode (available on demand)

The operator is analyzing, auditing, or understanding the system's reasoning.

- Full decomposition of summarized values
- Supporting measurements and evidence
- Provenance and reconciliation detail
- Analytical explanation

### Governing principle

> Operational surfaces provide the decision-relevant consequence first, with analytical decomposition available immediately beneath or behind it.

Do not force the operator to read reflective-mode content to reach impatient-mode answers. Do not hide reflective-mode content so thoroughly that analysis requires navigation away from the operational surface.

---

## Operational Density

Operational density does not mean tiny fonts or indiscriminate information compression.

It means: **allocate viewport space according to operator importance.**

### Principles

- Use available horizontal canvas proportionally to information importance
- Prioritize decision-relevant information above the fold
- Use progressive disclosure for reflective/explanatory information
- Avoid narrow report-style layouts when they create scrolling while wasting horizontal space
- Avoid decorative whitespace between information the operator needs to compare

### Anti-patterns

- Narrow centered column with large unused margins while important content scrolls below
- Equal visual weight given to primary metrics and supporting detail
- Card-per-concept layouts that consume vertical space for borders and padding rather than content
- Fixed-width layouts designed for print rather than widescreen operation

### The Production redesign demonstrated this

The initial narrow-centered-column layout wasted ~70% of physical screen space while forcing operational evidence below the fold. The two-column layout (summary left, evidence table right) solved this by recognizing that the in-flight position table is spatially large but operationally important — it belongs beside the summary, not below it.

---

## Above-the-Fold Priority

On a normal desktop viewport, the operator should see the major operating picture without scrolling:

1. Primary metrics (production, capital, consequences)
2. Immediately relevant context (erosion, unresolved amounts)
3. Capacity/resource information
4. Evidence summary or beginning of supporting evidence

Secondary information may extend below the fold:
- Detailed reconciliation
- Full provenance
- Analytical decomposition
- Historical comparison

---

## Applicability

These principles apply to:
- The Operator Console (position monitoring, treemap, consequence summary)
- The Deployment surface (candidate tables, recommendation evidence)
- The Production surface (current-month operations, historical assessment)
- Future operator surfaces

They do NOT apply to:
- Engineering laboratories (exploration tooling behind the subordinate boundary)
- Configuration/settings views
- Documentation
