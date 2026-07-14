/**
 * Tests for institutional risk categories and contextual explanations.
 */

import { describe, it, expect } from "vitest";
import { categorizeCriteria } from "../../src/velvet-rope/risk-categories";
import type { OptionSideEvidence, CriterionResult } from "../../src/velvet-rope/types";
import { CONVENTIONAL_STRUCTURE, type ProductStructure } from "../../src/velvet-rope/product-structure";

// --- Helpers ---

function makeSideEvidence(criteria: CriterionResult[]): OptionSideEvidence {
  return {
    side: "call",
    selectedContract: { strike: 185, delta: 0.32, bid: 1.12, ask: 2.02, mid: 1.57, spread: 0.90, spreadPercent: 44.5, openInterest: 33, volume: 12, iv: 0.41, annualizedYield: 73.5, dte: 4 },
    selectionStatus: "selected",
    criteria,
  };
}

function makePassCriterion(name: string): CriterionResult {
  return { criterion: name, status: "pass", measuredValue: 100, threshold: "50", severity: "hard", explanation: "OK" };
}

function makeFailCriterion(name: string, measured: number | string, threshold: string, severity: "hard" | "soft" = "hard"): CriterionResult {
  return { criterion: name, status: "fail", measuredValue: measured, threshold, severity, explanation: `${name} failed` };
}

// --- Tests ---

describe("categorizeCriteria", () => {
  describe("spread categorized as Execution Risk", () => {
    it("wide spread appears under execution_risk category", () => {
      const spreadFail = makeFailCriterion("maxBidAskSpreadPercent", 139.4, "15");
      const call = makeSideEvidence([spreadFail]);
      const put = makeSideEvidence([makePassCriterion("maxBidAskSpreadPercent")]);

      const categories = categorizeCriteria(call, put, [], CONVENTIONAL_STRUCTURE);
      const execRisk = categories.find((c) => c.category === "execution_risk");

      expect(execRisk).toBeDefined();
      expect(execRisk!.categoryLabel).toBe("Execution Risk");
    });

    it("spread explanation mentions fill uncertainty and unreliable midpoint", () => {
      const spreadFail = makeFailCriterion("maxBidAskSpreadPercent", 139.4, "15");
      const call = makeSideEvidence([spreadFail]);
      const put = makeSideEvidence([]);

      const categories = categorizeCriteria(call, put, [], CONVENTIONAL_STRUCTURE);
      const execRisk = categories.find((c) => c.category === "execution_risk");
      const spreadItem = execRisk!.items.find((i) => i.criterion.criterion === "maxBidAskSpreadPercent");

      expect(spreadItem!.consequence).toContain("midpoint");
      expect(spreadItem!.consequence).toContain("fill");
      expect(spreadItem!.consequence).toContain("price concession");
    });
  });

  describe("open interest categorized as Execution Risk", () => {
    it("low OI appears under execution_risk category", () => {
      const oiFail = makeFailCriterion("minOpenInterest", 13, "50");
      const call = makeSideEvidence([oiFail]);
      const put = makeSideEvidence([]);

      const categories = categorizeCriteria(call, put, [], CONVENTIONAL_STRUCTURE);
      const execRisk = categories.find((c) => c.category === "execution_risk");

      expect(execRisk).toBeDefined();
      expect(execRisk!.items.some((i) => i.criterion.criterion === "minOpenInterest")).toBe(true);
    });

    it("OI explanation mentions fill reliability and counterparties", () => {
      const oiFail = makeFailCriterion("minOpenInterest", 13, "50");
      const call = makeSideEvidence([oiFail]);
      const put = makeSideEvidence([]);

      const categories = categorizeCriteria(call, put, [], CONVENTIONAL_STRUCTURE);
      const execRisk = categories.find((c) => c.category === "execution_risk");
      const oiItem = execRisk!.items.find((i) => i.criterion.criterion === "minOpenInterest");

      expect(oiItem!.consequence).toContain("fill reliability");
      expect(oiItem!.consequence).toContain("counterparties");
    });
  });

  describe("ProductStructure categorized as Product Structure Risk", () => {
    it("structural caution appears under product_structure_risk", () => {
      const structFail = makeFailCriterion("structuralCaution", "leveraged, inverse, daily-reset", "conventional structure", "soft");
      const call = makeSideEvidence([]);
      const put = makeSideEvidence([]);
      const leveragedStructure: ProductStructure = {
        ...CONVENTIONAL_STRUCTURE,
        leveraged: true,
        leverageMultiple: 3,
        inverse: true,
        dailyReset: true,
        inferenceSource: "name_heuristic",
        confidence: "medium",
      };

      const categories = categorizeCriteria(call, put, [structFail], leveragedStructure);
      const structRisk = categories.find((c) => c.category === "product_structure_risk");

      expect(structRisk).toBeDefined();
      expect(structRisk!.categoryLabel).toBe("Product Structure Risk");
    });
  });

  describe("capital categorized as Capital / Allocation Policy", () => {
    it("minimum capital failure appears under capital_allocation_policy", () => {
      const capFail = makeFailCriterion("minCapitalPerContract", 400, "2000", "soft");
      const call = makeSideEvidence([]);
      const put = makeSideEvidence([]);

      const categories = categorizeCriteria(call, put, [capFail], CONVENTIONAL_STRUCTURE);
      const capPolicy = categories.find((c) => c.category === "capital_allocation_policy");

      expect(capPolicy).toBeDefined();
      expect(capPolicy!.categoryLabel).toBe("Capital / Allocation Policy");
    });

    it("capital explanation does NOT imply product-quality failure", () => {
      const capFail = makeFailCriterion("minCapitalPerContract", 400, "2000", "soft");
      const call = makeSideEvidence([]);
      const put = makeSideEvidence([]);

      const categories = categorizeCriteria(call, put, [capFail], CONVENTIONAL_STRUCTURE);
      const capPolicy = categories.find((c) => c.category === "capital_allocation_policy");
      const capItem = capPolicy!.items.find((i) => i.criterion.criterion === "minCapitalPerContract");

      expect(capItem!.consequence).toContain("not evidence");
      expect(capItem!.consequence).toContain("low quality");
    });
  });

  describe("yield categorized as Opportunity Quality", () => {
    it("passing yield appears under opportunity_quality", () => {
      const yieldPass = makePassCriterion("minYieldAtTargetDelta");
      const call = makeSideEvidence([yieldPass]);
      const put = makeSideEvidence([]);

      const categories = categorizeCriteria(call, put, [], CONVENTIONAL_STRUCTURE);
      const oppQuality = categories.find((c) => c.category === "opportunity_quality");

      expect(oppQuality).toBeDefined();
    });
  });

  describe("facts, policy, and outcome remain distinguishable", () => {
    it("each categorized item has separate consequence and interpretation", () => {
      const spreadFail = makeFailCriterion("maxBidAskSpreadPercent", 44.5, "15");
      const call = makeSideEvidence([spreadFail]);
      const put = makeSideEvidence([]);

      const categories = categorizeCriteria(call, put, [], CONVENTIONAL_STRUCTURE);
      const execRisk = categories.find((c) => c.category === "execution_risk");
      const item = execRisk!.items[0];

      // Consequence = practical impact (what happens)
      expect(item.consequence.length).toBeGreaterThan(0);
      // Interpretation = policy response (what institution does about it)
      expect(item.interpretation.length).toBeGreaterThan(0);
      // They are different strings
      expect(item.consequence).not.toBe(item.interpretation);
    });
  });

  describe("conventional ETFs with all-pass criteria", () => {
    it("produce concise category summaries without unnecessary warnings", () => {
      const call = makeSideEvidence([
        makePassCriterion("minOpenInterest"),
        makePassCriterion("maxBidAskSpreadPercent"),
        makePassCriterion("minYieldAtTargetDelta"),
      ]);
      const put = makeSideEvidence([
        makePassCriterion("minOpenInterest"),
        makePassCriterion("maxBidAskSpreadPercent"),
      ]);
      const capPass = makePassCriterion("maxCapitalPerContract");

      const categories = categorizeCriteria(call, put, [capPass], CONVENTIONAL_STRUCTURE);

      // Should have categories but none with structural warnings
      const structRisk = categories.find((c) => c.category === "product_structure_risk");
      expect(structRisk).toBeUndefined(); // no structural flags → no structural section

      // Execution risk section should show as passing
      const execRisk = categories.find((c) => c.category === "execution_risk");
      if (execRisk) {
        expect(execRisk.summary).toContain("adequate");
      }
    });
  });

  describe("existing evaluation outcomes unchanged", () => {
    it("categorizeCriteria does not modify the original criterion objects", () => {
      const original = makeFailCriterion("maxBidAskSpreadPercent", 44.5, "15");
      const originalCopy = { ...original };
      const call = makeSideEvidence([original]);

      categorizeCriteria(call, makeSideEvidence([]), [], CONVENTIONAL_STRUCTURE);

      // Original criterion should be unchanged
      expect(original.status).toBe(originalCopy.status);
      expect(original.measuredValue).toBe(originalCopy.measuredValue);
      expect(original.threshold).toBe(originalCopy.threshold);
      expect(original.severity).toBe(originalCopy.severity);
    });
  });
});
