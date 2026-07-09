/**
 * Tests for opportunity explanation logic.
 *
 * Verifies that explainOpportunity correctly decomposes an OpportunityRow
 * into human-readable evidence with accurate math.
 */

import { describe, it, expect } from "vitest";
import { explainOpportunity } from "../../src/opportunity/explain";
import type { OpportunityRow } from "../../src/opportunity/types";

// --- Test helpers ---

function makeRow(overrides?: Partial<OpportunityRow>): OpportunityRow {
  return {
    symbol: "XLE",
    price: 85.00,
    capitalPerContract: 8300,
    optionsAvailable: true,
    nearestExpiration: "2026-07-18",
    nearestDte: 14,
    callDelta: 0.30,
    callMid: 1.20,
    callYield: 36.8,
    putDelta: 0.30,
    putMid: 1.00,
    putYield: 31.4,
    status: "interesting",
    statusReason: "Best yield 36.8% exceeds 8% threshold",
    greeksAvailable: true,
    iv: 0.28,
    dataSource: "api",
    ...overrides,
  };
}

// --- Tests ---

describe("explainOpportunity", () => {
  describe("call decomposition", () => {
    it("computes premium per contract correctly", () => {
      const result = explainOpportunity(makeRow());
      // callMid = 1.20, premiumPerContract = 1.20 * 100 = 120
      expect(result.call).not.toBeNull();
      expect(result.call!.premiumPerContract).toBe(120);
    });

    it("uses underlying price as collateral for calls", () => {
      const result = explainOpportunity(makeRow());
      expect(result.call!.collateral).toBe(85.00);
    });

    it("computes raw yield correctly", () => {
      const result = explainOpportunity(makeRow());
      // rawYield = 1.20 / 85.00 = 0.01412
      expect(result.call!.rawYield).toBeCloseTo(0.01412, 4);
    });

    it("computes annualization multiplier from DTE", () => {
      const result = explainOpportunity(makeRow());
      // 365 / 14 = 26.07
      expect(result.call!.annualizationMultiplier).toBeCloseTo(26.07, 1);
    });

    it("computes annualized yield correctly", () => {
      const result = explainOpportunity(makeRow());
      // (1.20 / 85.00) * (365 / 14) * 100 = ~36.8%
      expect(result.call!.annualizedYield).toBeCloseTo(36.8, 0);
    });

    it("includes delta and IV", () => {
      const result = explainOpportunity(makeRow());
      expect(result.call!.delta).toBe(0.30);
      expect(result.call!.iv).toBe(0.28);
    });
  });

  describe("put decomposition", () => {
    it("derives strike from capitalPerContract", () => {
      const result = explainOpportunity(makeRow());
      // capitalPerContract = 8300, strike = 8300 / 100 = 83
      expect(result.put!.strike).toBe(83);
    });

    it("uses strike as collateral for puts", () => {
      const result = explainOpportunity(makeRow());
      expect(result.put!.collateral).toBe(83);
    });

    it("computes raw yield using strike as denominator", () => {
      const result = explainOpportunity(makeRow());
      // putMid = 1.00, rawYield = 1.00 / 83 = 0.01205
      expect(result.put!.rawYield).toBeCloseTo(0.01205, 4);
    });

    it("computes put annualized yield correctly", () => {
      const result = explainOpportunity(makeRow());
      // (1.00 / 83) * (365 / 14) * 100 = ~31.4%
      expect(result.put!.annualizedYield).toBeCloseTo(31.4, 0);
    });

    it("computes premium per contract for puts", () => {
      const result = explainOpportunity(makeRow());
      // putMid = 1.00, premium = 100
      expect(result.put!.premiumPerContract).toBe(100);
    });
  });

  describe("annualization context", () => {
    it("flags very short DTE (≤7 days)", () => {
      const result = explainOpportunity(makeRow({ nearestDte: 4 }));
      expect(result.annualizationNote).toContain("Very short DTE");
      expect(result.annualizationNote).toContain("91.3");
    });

    it("flags short DTE (8-14 days)", () => {
      const result = explainOpportunity(makeRow({ nearestDte: 10 }));
      expect(result.annualizationNote).toContain("Short DTE");
      expect(result.annualizationNote).toContain("36.5");
    });

    it("flags moderate DTE (15-45 days)", () => {
      const result = explainOpportunity(makeRow({ nearestDte: 30 }));
      expect(result.annualizationNote).toContain("Moderate DTE");
    });

    it("flags longer DTE (>45 days)", () => {
      const result = explainOpportunity(makeRow({ nearestDte: 60 }));
      expect(result.annualizationNote).toContain("Longer DTE");
    });
  });

  describe("IV context", () => {
    it("identifies high IV (>40%)", () => {
      const result = explainOpportunity(makeRow({ iv: 0.55 }));
      expect(result.ivNote).toContain("High IV");
      expect(result.ivNote).toContain("55");
    });

    it("identifies moderate IV (25-40%)", () => {
      const result = explainOpportunity(makeRow({ iv: 0.30 }));
      expect(result.ivNote).toContain("Moderate IV");
    });

    it("identifies low IV (10-25%)", () => {
      const result = explainOpportunity(makeRow({ iv: 0.15 }));
      expect(result.ivNote).toContain("Low IV");
    });

    it("identifies very low IV (<10%)", () => {
      const result = explainOpportunity(makeRow({ iv: 0.08 }));
      expect(result.ivNote).toContain("Very low IV");
    });

    it("handles missing IV", () => {
      const result = explainOpportunity(makeRow({ iv: null }));
      expect(result.ivNote).toContain("unavailable");
    });
  });

  describe("capital explanation", () => {
    it("identifies put_strike as capital source when put data exists", () => {
      const result = explainOpportunity(makeRow());
      expect(result.capitalSource).toBe("put_strike");
    });

    it("identifies underlying_price as source when no put", () => {
      const result = explainOpportunity(makeRow({ putMid: null }));
      expect(result.capitalSource).toBe("underlying_price");
    });

    it("returns unavailable when no capital data", () => {
      const result = explainOpportunity(makeRow({ capitalPerContract: null }));
      expect(result.capitalSource).toBe("unavailable");
    });
  });

  describe("narrative", () => {
    it("includes symbol and price", () => {
      const result = explainOpportunity(makeRow());
      expect(result.narrative[0]).toContain("XLE");
      expect(result.narrative[0]).toContain("$85.00");
    });

    it("mentions IV when available", () => {
      const result = explainOpportunity(makeRow());
      expect(result.narrative.some((n) => n.includes("28%"))).toBe(true);
    });

    it("explains annualization math", () => {
      const result = explainOpportunity(makeRow());
      expect(result.narrative.some((n) => n.includes("Annualized"))).toBe(true);
      expect(result.narrative.some((n) => n.includes("×"))).toBe(true);
    });

    it("mentions capital per contract", () => {
      const result = explainOpportunity(makeRow());
      expect(result.narrative.some((n) => n.includes("$8,300"))).toBe(true);
      expect(result.narrative.some((n) => n.includes("minimum capital unit"))).toBe(true);
    });

    it("adds DTE caution for very short DTE", () => {
      const result = explainOpportunity(makeRow({ nearestDte: 4 }));
      expect(result.narrative.some((n) => n.includes("Caution"))).toBe(true);
      expect(result.narrative.some((n) => n.includes("amplified"))).toBe(true);
    });

    it("handles data_missing status gracefully", () => {
      const result = explainOpportunity(makeRow({
        status: "data_missing",
        price: null,
        callMid: null,
        putMid: null,
        callYield: null,
        putYield: null,
        nearestDte: null,
      }));
      expect(result.call).toBeNull();
      expect(result.put).toBeNull();
      expect(result.narrative.length).toBeGreaterThan(0);
    });
  });

  describe("null handling", () => {
    it("returns null call when callMid is null", () => {
      const result = explainOpportunity(makeRow({ callMid: null }));
      expect(result.call).toBeNull();
    });

    it("returns null put when putMid is null", () => {
      const result = explainOpportunity(makeRow({ putMid: null }));
      expect(result.put).toBeNull();
    });

    it("returns null put when capitalPerContract is null", () => {
      const result = explainOpportunity(makeRow({ capitalPerContract: null }));
      expect(result.put).toBeNull();
    });

    it("handles zero price gracefully", () => {
      const result = explainOpportunity(makeRow({ price: 0 }));
      expect(result.call).toBeNull();
    });
  });
});
