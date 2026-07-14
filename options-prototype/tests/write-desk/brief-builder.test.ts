/**
 * Tests for the Wheelwright Brief Builder.
 */

import { describe, it, expect } from "vitest";
import { classifyDeltaFit, type NeighborTag } from "../../src/write-desk/brief-builder";
import { DEFAULT_RECOMMENDATION_POLICY } from "../../src/write-desk/recommend";

const contractSelection = DEFAULT_RECOMMENDATION_POLICY.contractSelection;

describe("classifyDeltaFit", () => {
  it("delta within preferred band → preferred_band", () => {
    const fit = classifyDeltaFit(-0.30, contractSelection);
    expect(fit.category).toBe("preferred_band");
    expect(fit.label).toBe("Preferred");
    expect(fit.deviation).toBe(0);
  });

  it("delta at band edge → preferred_band", () => {
    const fit = classifyDeltaFit(-0.25, contractSelection);
    expect(fit.category).toBe("preferred_band");
    expect(fit.deviation).toBe(-0.05);
  });

  it("delta outside preferred but within admissible → admissible_range", () => {
    const fit = classifyDeltaFit(-0.20, contractSelection);
    expect(fit.category).toBe("admissible_range");
    expect(fit.label).toBe("Admissible");
    expect(fit.deviation).toBe(-0.1);
  });

  it("delta at admissible edge → admissible_range", () => {
    const fit = classifyDeltaFit(-0.50, contractSelection);
    expect(fit.category).toBe("admissible_range");
    expect(fit.deviation).toBe(0.2);
  });

  it("delta near 0.48 → admissible_range (high deviation)", () => {
    const fit = classifyDeltaFit(-0.48, contractSelection);
    expect(fit.category).toBe("admissible_range");
    expect(fit.deviation).toBe(0.18);
  });

  it("delta outside admissible range → extended_fallback", () => {
    const fit = classifyDeltaFit(-0.55, contractSelection);
    expect(fit.category).toBe("extended_fallback");
    expect(fit.label).toBe("Extended");
  });

  it("delta below admissible minimum → extended_fallback", () => {
    const fit = classifyDeltaFit(-0.10, contractSelection);
    expect(fit.category).toBe("extended_fallback");
  });

  it("uses absolute value of delta", () => {
    const fitNeg = classifyDeltaFit(-0.30, contractSelection);
    const fitPos = classifyDeltaFit(0.30, contractSelection);
    expect(fitNeg.category).toBe(fitPos.category);
    expect(fitNeg.selectedDelta).toBe(fitPos.selectedDelta);
  });

  it("deviation is correctly computed relative to target", () => {
    // target is 0.30
    const fit = classifyDeltaFit(-0.45, contractSelection);
    expect(fit.deviation).toBe(0.15);
    expect(fit.targetDelta).toBe(0.30);
    expect(fit.selectedDelta).toBe(0.45);
  });
});

describe("NeighborTag classification", () => {
  // These test that the tag type system is properly defined
  it("SELECTED is a valid tag", () => {
    const tag: NeighborTag = "SELECTED";
    expect(tag).toBe("SELECTED");
  });

  it("all policy tags are valid", () => {
    const validTags: NeighborTag[] = [
      "SELECTED", "HIGH_DELTA", "LOW_DELTA", "OUTSIDE_TARGET",
      "LOW_PREMIUM", "WIDE_SPREAD", "LOW_OI", "NO_GREEKS",
      "EXCLUDED", "LOWER_YIELD", "LOWER_EXEC",
    ];
    expect(validTags).toHaveLength(11);
  });
});
