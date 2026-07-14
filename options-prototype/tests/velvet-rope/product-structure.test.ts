/**
 * Tests for ProductStructure inference and structural evaluation.
 */

import { describe, it, expect } from "vitest";
import { inferProductStructure, hasStructuralComplexity, describeStructure, CONVENTIONAL_STRUCTURE } from "../../src/velvet-rope/product-structure";
import { evaluateStructuralCriteria } from "../../src/velvet-rope/evaluate";
import { DEFAULT_ADMISSION_POLICY } from "../../src/velvet-rope/policy";

// --- Inference Tests ---

describe("inferProductStructure", () => {
  describe("leveraged detection", () => {
    it("detects UltraPro as 3x leveraged", () => {
      const result = inferProductStructure("SOXS", "ProShares UltraPro Short Semiconductors");
      expect(result.leveraged).toBe(true);
      expect(result.leverageMultiple).toBe(3);
    });

    it("detects Ultra (not UltraPro) as 2x leveraged", () => {
      const result = inferProductStructure("SSO", "ProShares Ultra S&P 500");
      expect(result.leveraged).toBe(true);
      expect(result.leverageMultiple).toBe(2);
    });

    it("detects 2X in name", () => {
      const result = inferProductStructure("TEST", "Direxion Daily 2X Bull Fund");
      expect(result.leveraged).toBe(true);
      expect(result.leverageMultiple).toBe(2);
    });

    it("does not flag conventional ETF as leveraged", () => {
      const result = inferProductStructure("XLE", "State Street Energy Select Sector SPDR ETF");
      expect(result.leveraged).toBe(false);
      expect(result.leverageMultiple).toBeNull();
    });
  });

  describe("inverse detection", () => {
    it("detects Short in name", () => {
      const result = inferProductStructure("SOXS", "ProShares UltraPro Short Semiconductors");
      expect(result.inverse).toBe(true);
    });

    it("detects Inverse in name", () => {
      const result = inferProductStructure("TEST", "Some Inverse Bond ETF");
      expect(result.inverse).toBe(true);
    });

    it("detects Bear in name", () => {
      const result = inferProductStructure("TEST", "Direxion Daily Bear 3X");
      expect(result.inverse).toBe(true);
    });

    it("does not flag conventional ETF as inverse", () => {
      const result = inferProductStructure("XLF", "Financial Select Sector SPDR Fund");
      expect(result.inverse).toBe(false);
    });
  });

  describe("daily reset detection", () => {
    it("infers daily reset for ProShares leveraged/inverse", () => {
      const result = inferProductStructure("SOXS", "ProShares UltraPro Short Semiconductors");
      expect(result.dailyReset).toBe(true);
    });

    it("infers daily reset for Direxion leveraged", () => {
      const result = inferProductStructure("SPXS", "Direxion Daily S&P 500 Bear 3X");
      expect(result.dailyReset).toBe(true);
    });

    it("detects Daily keyword", () => {
      const result = inferProductStructure("TEST", "Daily Leveraged Gold ETF");
      expect(result.dailyReset).toBe(true);
    });

    it("does not infer daily reset for conventional ETF", () => {
      const result = inferProductStructure("SPY", "State Street SPDR S&P 500 ETF");
      expect(result.dailyReset).toBe(false);
    });
  });

  describe("commodity detection", () => {
    it("detects Gold in name", () => {
      const result = inferProductStructure("GLD", "SPDR Gold Shares");
      expect(result.commodityBacked).toBe(true);
    });

    it("detects known commodity symbols", () => {
      const result = inferProductStructure("GLD", "anything");
      expect(result.commodityBacked).toBe(true);
    });

    it("detects Oil keyword", () => {
      const result = inferProductStructure("USO", "United States Oil Fund");
      expect(result.commodityBacked).toBe(true);
    });
  });

  describe("fixed income detection", () => {
    it("detects Bond in name", () => {
      const result = inferProductStructure("TLT", "iShares 20+ Year Treasury Bond ETF");
      expect(result.fixedIncome).toBe(true);
    });

    it("detects Treasury in name", () => {
      const result = inferProductStructure("GOVT", "iShares U.S. Treasury ETF");
      expect(result.fixedIncome).toBe(true);
    });

    it("detects TIPS in name", () => {
      const result = inferProductStructure("VTIP", "Vanguard Short-Term TIPS ETF");
      expect(result.fixedIncome).toBe(true);
    });
  });

  describe("conventional ETF (no flags)", () => {
    it("XLE is conventional", () => {
      const result = inferProductStructure("XLE", "State Street Energy Select Sector SPDR ETF");
      expect(result.leveraged).toBe(false);
      expect(result.inverse).toBe(false);
      expect(result.dailyReset).toBe(false);
      expect(result.commodityBacked).toBe(false);
      expect(result.fixedIncome).toBe(false);
      expect(result.singleStock).toBe(false);
      expect(result.activelyManaged).toBe(false);
    });

    it("QQQ is conventional", () => {
      const result = inferProductStructure("QQQ", "Invesco QQQ Trust");
      expect(hasStructuralComplexity(result)).toBe(false);
    });
  });

  describe("unknown/missing name", () => {
    it("returns conventional defaults when name is null", () => {
      const result = inferProductStructure("UNKNOWN", null);
      expect(result).toEqual(CONVENTIONAL_STRUCTURE);
    });

    it("inference source is unknown when no patterns match and name is null", () => {
      const result = inferProductStructure("TEST", null);
      expect(result.inferenceSource).toBe("unknown");
    });

    it("inference source is name_heuristic when patterns match", () => {
      const result = inferProductStructure("SOXS", "ProShares UltraPro Short Semiconductors");
      expect(result.inferenceSource).toBe("name_heuristic");
    });
  });

  describe("SOXS full classification", () => {
    it("correctly classifies SOXS as leveraged + inverse + daily-reset", () => {
      const result = inferProductStructure("SOXS", "ProShares UltraPro Short Semiconductors");
      expect(result.leveraged).toBe(true);
      expect(result.leverageMultiple).toBe(3);
      expect(result.inverse).toBe(true);
      expect(result.dailyReset).toBe(true);
      expect(result.singleStock).toBe(false);
      expect(result.commodityBacked).toBe(false);
      expect(result.fixedIncome).toBe(false);
      expect(hasStructuralComplexity(result)).toBe(true);
    });
  });
});

// --- hasStructuralComplexity ---

describe("hasStructuralComplexity", () => {
  it("returns false for conventional structure", () => {
    expect(hasStructuralComplexity(CONVENTIONAL_STRUCTURE)).toBe(false);
  });

  it("returns true when leveraged", () => {
    expect(hasStructuralComplexity({ ...CONVENTIONAL_STRUCTURE, leveraged: true })).toBe(true);
  });

  it("returns true when inverse", () => {
    expect(hasStructuralComplexity({ ...CONVENTIONAL_STRUCTURE, inverse: true })).toBe(true);
  });

  it("returns true when dailyReset", () => {
    expect(hasStructuralComplexity({ ...CONVENTIONAL_STRUCTURE, dailyReset: true })).toBe(true);
  });

  it("returns true when singleStock", () => {
    expect(hasStructuralComplexity({ ...CONVENTIONAL_STRUCTURE, singleStock: true })).toBe(true);
  });

  it("returns false for commodity-only (not considered structurally complex)", () => {
    expect(hasStructuralComplexity({ ...CONVENTIONAL_STRUCTURE, commodityBacked: true })).toBe(false);
  });

  it("returns false for fixedIncome-only", () => {
    expect(hasStructuralComplexity({ ...CONVENTIONAL_STRUCTURE, fixedIncome: true })).toBe(false);
  });
});

// --- describeStructure ---

describe("describeStructure", () => {
  it("returns empty for conventional", () => {
    expect(describeStructure(CONVENTIONAL_STRUCTURE)).toHaveLength(0);
  });

  it("describes leveraged", () => {
    const struct = { ...CONVENTIONAL_STRUCTURE, leveraged: true, leverageMultiple: 3 as number | null };
    const desc = describeStructure(struct);
    expect(desc.some((d) => d.includes("Leveraged") && d.includes("3x"))).toBe(true);
  });

  it("describes inverse", () => {
    const struct = { ...CONVENTIONAL_STRUCTURE, inverse: true };
    const desc = describeStructure(struct);
    expect(desc.some((d) => d.includes("Inverse"))).toBe(true);
  });

  it("describes daily-reset", () => {
    const struct = { ...CONVENTIONAL_STRUCTURE, dailyReset: true };
    const desc = describeStructure(struct);
    expect(desc.some((d) => d.includes("Daily-reset"))).toBe(true);
  });
});

// --- evaluateStructuralCriteria ---

describe("evaluateStructuralCriteria", () => {
  const policy = DEFAULT_ADMISSION_POLICY;

  it("produces no criteria for conventional ETF", () => {
    const result = evaluateStructuralCriteria(CONVENTIONAL_STRUCTURE, policy);
    expect(result).toHaveLength(0);
  });

  it("produces soft-fail criterion for leveraged+inverse structure", () => {
    const struct = inferProductStructure("SOXS", "ProShares UltraPro Short Semiconductors");
    const result = evaluateStructuralCriteria(struct, policy);
    expect(result).toHaveLength(1);
    expect(result[0].criterion).toBe("structuralCaution");
    expect(result[0].status).toBe("fail");
    expect(result[0].severity).toBe("soft");
  });

  it("explanation mentions detected complexities", () => {
    const struct = inferProductStructure("SOXS", "ProShares UltraPro Short Semiconductors");
    const result = evaluateStructuralCriteria(struct, policy);
    expect(result[0].explanation).toContain("leveraged");
    expect(result[0].explanation).toContain("inverse");
    expect(result[0].explanation).toContain("daily-reset");
  });

  it("does not produce criteria when policy disables structural caution", () => {
    const noStructPolicy = { ...policy, structuralCaution: { value: false as boolean | null, severity: "soft" as const } };
    const struct = inferProductStructure("SOXS", "ProShares UltraPro Short Semiconductors");
    const result = evaluateStructuralCriteria(struct, noStructPolicy);
    expect(result).toHaveLength(0);
  });
});
