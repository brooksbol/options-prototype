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

---

## Compression over Concealment

Operational density means keeping useful information simultaneously visible by making it spatially inexpensive — not merely hiding it behind interaction.

### The distinction

There are three ways to reduce the viewport footprint of information:

**Concealment** — hiding information behind accordions, disclosure controls, tabs, scrolling, hover, or secondary screens. This reduces visible content but does not increase information density. The operator must take another action to see what was hidden.

**Shrinking** — reducing font sizes, control sizes, or container dimensions. This may increase density but can damage readability.

**Compression** — tighter padding, tighter line height, horizontal composition, aligned columns, inline labels, shared baselines, typography-driven hierarchy, and elimination of repeated chrome. This increases density while preserving or improving scanability.

**Prefer compression over concealment.**

Progressive disclosure remains appropriate for genuine cognitive-mode boundaries — information the operator needs only when switching from impatient mode to reflective mode, or from operational to audit/diagnostic. It is not appropriate as a substitute for spatial efficiency when information could remain visible at low cost.

### The concealment test

Before hiding information behind a disclosure control, ask:

> Could this remain continuously visible at one line of spatial cost?

If yes, compress rather than conceal. Use concealment only when the information genuinely belongs to a different cognitive mode or when compression cannot make it legible at acceptable spatial cost.

### Spatial budget awareness

Padding, borders, backgrounds, section gaps, card chrome, and repeated labels all consume a finite viewport budget. Each pixel of vertical space spent on non-information structure is a pixel unavailable for decision-relevant content.

This does not mean eliminating whitespace. It means treating whitespace as a scarce resource that must justify its contribution to hierarchy, grouping, or readability — not as a default applied uniformly to all semantic boundaries.

### Density and scanability are compatible

High information density does not require sacrificing clarity. Financial operational interfaces routinely present dozens of facts simultaneously through:

- consistent column alignment (positional semantics replace repeated labels);
- predictable row structure (the eye learns where to find each fact);
- typography-driven hierarchy (weight, size, and color establish importance);
- grouping by proximity (related facts share a baseline or row);
- compact group boundaries (separators that cost less than a data row);
- numeric formatting consistency (monospace, consistent precision).

The goal is **high semantic density with low cognitive friction** — many useful facts visible and usable simultaneously without the interface becoming incoherent.

### Measuring density

Judge operational surface density by:

> How many decision-relevant facts can the operator perceive simultaneously without losing semantic clarity?

Not by how compact the collapsed interface appears when information is hidden.
