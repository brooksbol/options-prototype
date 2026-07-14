# Secondary Observation

## Purpose

This document describes the principle of measuring the mechanism that produces a measurement before trusting the measurement itself.

It answers a different question than the Three Actor Model. Instead of "Who is acting?" it asks "How much should I trust what I'm observing?"

---

## Core Insight

Every observation is produced by a mechanism.

The mechanism itself has characteristics — reliability, freshness, completeness, calibration state — that affect how much confidence you should place in the observation.

A system that only reports primary observations is asking you to trust the mechanism implicitly. A system that also reports the mechanism's state is giving you the information to calibrate your own confidence.

---

## The Pattern

```
Reference Input
      ↓
Mechanism
      ↓
Expected Output
      ↓
Observed Output
      ↓
Mechanism Health
```

The primary observation tells you about the thing you're measuring.

The secondary observation tells you about the process that produced that measurement.

Governance interprets the primary observation in light of the secondary observation.

---

## The Fundamental Question

**Should I trust the evidence before I trust the conclusion?**

If the mechanism is healthy, trust the conclusion.

If the mechanism is degraded, qualify the conclusion.

If the mechanism is unreliable, withhold the conclusion.

---

## The Reference Does Not Replace Reality

This is the subtle but critical distinction.

A reference observation does not provide the "correct" answer. It characterizes the reliability of the process that produced the answer.

- A GIA reference diamond does not replace customer diamonds. It tells you whether the grading instrument is calibrated.
- A 3:59 PM market quote does not replace the 7:00 PM quote. It tells you whether the current market state is operationally meaningful.
- A known-good test input does not replace production data. It tells you whether the processing pipeline is behaving as expected.

You are not searching for the correct answer. You are characterizing the reliability of the process that produced the answer.

---

## Examples Across Domains

| Domain | Primary Observation | Secondary Observation | What It Reveals |
|---|---|---|---|
| Gemology (GIA) | Grade of customer diamond | Grade of reference diamond | Grading instrument calibration |
| Options (Velvet Rope) | ADMIT/REJECT decision | Market session state, quote age, spread stability | Evidence quality for deployment decisions |
| Manufacturing | Product measurement | Gauge R&R study | Measurement system capability |
| Networking | Latency measurement | Probe path health | Whether the measurement reflects the network or the probe |
| Scientific instruments | Experimental reading | Calibration standard reading | Instrument drift |
| AI/ML evaluation | Model output quality | Benchmark performance on known inputs | Whether degradation is in the model or the evaluation |

---

## Manifestation in This Project

Today Velvet Rope evaluates:

```
Market Evidence → Velvet Rope → Decision
```

The emerging architecture adds a secondary observation layer:

```
Market Evidence → Evidence Context → Velvet Rope → Decision
```

Evidence Context asks:
- Regular session or extended hours?
- Quote age and completeness?
- Operational or observational evidence?
- Is the market state suitable for deployment decisions?

This does not change the evaluation logic. It qualifies the evidence that feeds the evaluation.

---

## Implementation Sequencing

When applying this principle, the natural progression is:

1. **Label** — Annotate the primary observation with mechanism metadata (what produced this? when? under what conditions?).
2. **Surface** — Make the label visible to the operator (awareness without behavior change).
3. **Present alternatives** — Show both the current observation and a reference observation side by side.
4. **Govern** — Only after the above are validated, consider whether policy should behave differently based on mechanism state.

Each step produces evidence for whether the next step is warranted.

---

## Relationship to Other Principles

**Three Actor Model** — Secondary observation is primarily a governance concern. The governor needs to trust evidence quality before making institutional decisions.

**Policy over Prediction** — Policy should incorporate evidence quality. "Reject because spreads are wide" is different from "Reject because spreads are wide *and the market is closed, so this may not reflect deployable conditions*."

**Closed Feedback Loops** — Secondary observations feed the organizational learning loop. Patterns in mechanism degradation (e.g., "extended hours always produces rejections") become knowledge that improves future system design.

---

## Domain Independence

This principle survives the removal of all domain nouns.

It applies in any system where:
- Decisions depend on observations.
- Observations are produced by mechanisms.
- Mechanisms have variable reliability.
- The cost of acting on unreliable observations is meaningful.

That describes healthcare, manufacturing, networking, scientific instrumentation, robotics, AI evaluation, financial markets, and gemological grading — at minimum.

The independent emergence of this pattern across unrelated domains is strong evidence that it is a genuine architectural principle rather than a domain-specific technique.
