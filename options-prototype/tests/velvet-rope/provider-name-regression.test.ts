/**
 * Regression test: Provider name preservation → ProductStructure inference.
 *
 * Verifies that the Tradier provider's quote description flows through to
 * chain.underlying.name, enabling ProductStructure inference for symbols
 * not in the hardcoded SUPPORTED_UNDERLYINGS list.
 *
 * This test protects against the bug where SOXS was evaluated as
 * structurally equivalent to XLE because the provider discarded the
 * descriptive name.
 */

import { describe, it, expect } from "vitest";
import { inferProductStructure, hasStructuralComplexity } from "../../src/velvet-rope/product-structure";
import { evaluateStructuralCriteria } from "../../src/velvet-rope/evaluate";
import { DEFAULT_ADMISSION_POLICY } from "../../src/velvet-rope/policy";

describe("provider name → ProductStructure pipeline", () => {
  describe("when Tradier provides a descriptive name (production path)", () => {
    // Simulates what happens when the Tradier quote response contains a description
    // and the provider correctly preserves it in chain.underlying.name

    it("SOXS with Tradier description produces structural caution", () => {
      // This is the name Tradier returns in the quote description field
      const tradierDescription = "ProShares UltraPro Short Semiconductors";
      const structure = inferProductStructure("SOXS", tradierDescription);

      expect(structure.leveraged).toBe(true);
      expect(structure.inverse).toBe(true);
      expect(structure.dailyReset).toBe(true);
      expect(hasStructuralComplexity(structure)).toBe(true);

      const criteria = evaluateStructuralCriteria(structure, DEFAULT_ADMISSION_POLICY);
      expect(criteria.length).toBeGreaterThan(0);
      expect(criteria[0].criterion).toBe("structuralCaution");
      expect(criteria[0].severity).toBe("soft");
    });

    it("TQQQ with Tradier description produces structural caution", () => {
      const tradierDescription = "ProShares UltraPro QQQ";
      const structure = inferProductStructure("TQQQ", tradierDescription);

      expect(structure.leveraged).toBe(true);
      expect(structure.leverageMultiple).toBe(3);
      expect(structure.dailyReset).toBe(true);
      expect(hasStructuralComplexity(structure)).toBe(true);
    });

    it("SPXS with Tradier description produces structural caution", () => {
      const tradierDescription = "Direxion Daily S&P 500 Bear 3X Shares";
      const structure = inferProductStructure("SPXS", tradierDescription);

      expect(structure.leveraged).toBe(true);
      expect(structure.inverse).toBe(true);
      expect(structure.dailyReset).toBe(true);
    });
  });

  describe("when provider falls back to symbol only (regression scenario)", () => {
    it("SOXS with only symbol name does NOT produce structural caution", () => {
      // This was the bug: provider returned just the symbol as name
      const structure = inferProductStructure("SOXS", "SOXS");

      // With only the symbol, inference cannot determine structure
      expect(hasStructuralComplexity(structure)).toBe(false);

      const criteria = evaluateStructuralCriteria(structure, DEFAULT_ADMISSION_POLICY);
      expect(criteria).toHaveLength(0);
    });

    it("demonstrates why the full name is required for inference", () => {
      // Symbol alone: no structural detection
      const fromSymbol = inferProductStructure("SOXS", "SOXS");
      // Full name: structural detection works
      const fromName = inferProductStructure("SOXS", "ProShares UltraPro Short Semiconductors");

      expect(hasStructuralComplexity(fromSymbol)).toBe(false);
      expect(hasStructuralComplexity(fromName)).toBe(true);
    });
  });

  describe("conventional ETF names produce no structural caution", () => {
    it("XLE with Tradier description remains conventional", () => {
      const tradierDescription = "Energy Select Sector SPDR Fund";
      const structure = inferProductStructure("XLE", tradierDescription);

      expect(hasStructuralComplexity(structure)).toBe(false);

      const criteria = evaluateStructuralCriteria(structure, DEFAULT_ADMISSION_POLICY);
      expect(criteria).toHaveLength(0);
    });

    it("SPY with Tradier description remains conventional", () => {
      const tradierDescription = "SPDR S&P 500 ETF Trust";
      const structure = inferProductStructure("SPY", tradierDescription);

      expect(hasStructuralComplexity(structure)).toBe(false);
    });

    it("QQQ with Tradier description remains conventional", () => {
      const tradierDescription = "Invesco QQQ Trust Series 1";
      const structure = inferProductStructure("QQQ", tradierDescription);

      expect(hasStructuralComplexity(structure)).toBe(false);
    });
  });

  describe("name fallback order", () => {
    // The provider should prefer: quote description → curated name → symbol
    // This test documents the expected behavior

    it("quote description is preferred over symbol", () => {
      // If the provider correctly passes the description, inference works
      const withDescription = inferProductStructure("SOXS", "ProShares UltraPro Short Semiconductors");
      expect(withDescription.leveraged).toBe(true);
    });

    it("null description falls back safely", () => {
      const withNull = inferProductStructure("SOXS", null);
      expect(hasStructuralComplexity(withNull)).toBe(false);
      // This is acceptable — we simply don't know the structure
      expect(withNull.inferenceSource).toBe("unknown");
    });
  });
});
