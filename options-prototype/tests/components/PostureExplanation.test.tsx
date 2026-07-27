/**
 * PostureExplanationSection — Component Render Tests
 *
 * Proves:
 * 1. EDGE renders score, range, next threshold, and contributors
 * 2. Hard-no renders exclusion explanation, does NOT render score contributors
 * 3. Delta fit and governance render under independent observations
 * 4. Recommendation number, table position, sort label are absent
 * 5. Contributor measured value, component score, and weight survive into output
 */

import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { PostureExplanationSection } from "../../src/components/RecommendationBrief";
import type { PostureExplanation } from "../../src/write-desk/posture-explanation";

// --- Fixtures ---

function makeEdgeExplanation(): PostureExplanation {
  return {
    posture: "EDGE",
    derivation: "weighted_score",
    score: 52,
    scoreRange: {
      lowerInclusive: 35,
      upperExclusive: 65,
      nextPosture: "ACTIONABLE",
      nextThreshold: 65,
    },
    hardNoReasons: [],
    contributors: [
      { name: "Spread", measured: 22, measuredLabel: "22.0% relative spread", referenceLabel: "preferred ≤ 15%", componentScore: 84, weight: 0.40, weightedContribution: 33.6 },
      { name: "Open Interest", measured: 25, measuredLabel: "25 contracts", referenceLabel: "preferred ≥ 50", componentScore: 50, weight: 0.25, weightedContribution: 12.5 },
      { name: "Volume", measured: 3, measuredLabel: "3 daily volume", referenceLabel: "preferred ≥ 10", componentScore: 30, weight: 0.15, weightedContribution: 4.5 },
      { name: "Premium", measured: 0.45, measuredLabel: "$0.45 bid", referenceLabel: "preferred ≥ $0.10", componentScore: 100, weight: 0.20, weightedContribution: 20 },
    ],
    deltaFit: { delta: 0.30, category: "preferred_band", label: "Delta 0.30 — Preferred" },
    governance: { status: "authorized", hasRestriction: false, summary: "No governance restrictions" },
  };
}

function makeHardNoExplanation(): PostureExplanation {
  return {
    posture: "UNAVAILABLE",
    derivation: "hard_no",
    score: null,
    scoreRange: null,
    hardNoReasons: ["Zero open interest — no market participation."],
    contributors: [],
    deltaFit: { delta: 0.30, category: "preferred_band", label: "Delta 0.30 — Preferred" },
    governance: { status: "authorized", hasRestriction: false, summary: "No governance restrictions" },
  };
}

// --- Tests ---

describe("PostureExplanationSection", () => {

  it("EDGE renders score, range, next threshold, and contributors", () => {
    const { container } = render(<PostureExplanationSection explanation={makeEdgeExplanation()} />);

    // Posture badge
    expect(container.textContent).toContain("EDGE");

    // Score
    expect(container.textContent).toContain("52");
    expect(container.textContent).toContain("100");

    // Next threshold
    expect(container.textContent).toContain("ACTIONABLE");
    expect(container.textContent).toContain("65");

    // Contributors present
    expect(container.textContent).toContain("Spread");
    expect(container.textContent).toContain("Open Interest");
    expect(container.textContent).toContain("Volume");
    expect(container.textContent).toContain("Premium");

    // Score contributors label
    expect(container.textContent).toContain("Score contributors");
  });

  it("hard-no renders exclusion and does NOT render score contributors", () => {
    const { container } = render(<PostureExplanationSection explanation={makeHardNoExplanation()} />);

    // Posture badge
    expect(container.textContent).toContain("UNAVAILABLE");

    // Exclusion reason
    expect(container.textContent).toContain("Zero open interest");
    expect(container.textContent).toContain("Absolute exclusion");

    // Hard-no note
    expect(container.textContent).toContain("not assigned a normal execution posture");

    // Score contributors ABSENT
    expect(container.textContent).not.toContain("Score contributors");
    expect(container.textContent).not.toContain("Spread");
    expect(container.textContent).not.toContain("Open Interest");

    // No score displayed
    expect(container.textContent).not.toContain("/ 100");
  });

  it("delta fit and governance render as independent observations", () => {
    const { container } = render(<PostureExplanationSection explanation={makeEdgeExplanation()} />);

    // Delta fit
    expect(container.textContent).toContain("Delta 0.30");
    expect(container.textContent).toContain("Preferred");

    // Governance
    expect(container.textContent).toContain("No governance restrictions");
  });

  it("does NOT contain recommendation number, table position, or sort metadata", () => {
    const { container } = render(<PostureExplanationSection explanation={makeEdgeExplanation()} />);

    expect(container.textContent).not.toContain("Recommendation #");
    expect(container.textContent).not.toContain("Table Position");
    expect(container.textContent).not.toContain("Sorted by");
    expect(container.textContent).not.toContain("Yield First");
    expect(container.textContent).not.toContain("Execution First");
    expect(container.textContent).not.toContain("Capital Efficiency");
  });

  it("contributor measured value, component score, and weight survive into rendered output", () => {
    const { container } = render(<PostureExplanationSection explanation={makeEdgeExplanation()} />);

    // Spread contributor
    expect(container.textContent).toContain("22.0% relative spread");
    expect(container.textContent).toContain("84");
    expect(container.textContent).toContain("40%");

    // Premium contributor
    expect(container.textContent).toContain("$0.45 bid");
    expect(container.textContent).toContain("100");
    expect(container.textContent).toContain("20%");

    // Reference labels
    expect(container.textContent).toContain("preferred ≤ 15%");
    expect(container.textContent).toContain("preferred ≥ 50");
  });

  it("governance with restriction renders warning-style observation", () => {
    const explanation: PostureExplanation = {
      ...makeEdgeExplanation(),
      governance: { status: "danger", hasRestriction: true, summary: "Governance restriction: not authorized for standard operation" },
    };
    const { container } = render(<PostureExplanationSection explanation={explanation} />);

    expect(container.textContent).toContain("not authorized for standard operation");
  });
});
